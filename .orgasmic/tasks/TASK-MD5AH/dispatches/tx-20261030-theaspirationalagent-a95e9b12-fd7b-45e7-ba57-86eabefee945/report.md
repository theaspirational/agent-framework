# Review — TASK-MD5AH @ 8414999904622471a8d3dee5b7bd0ff309855330

Scope: `fix(gate): drop debounced events already read and answered` (upstream #814), one commit
on `a687fa61`. 5 files, +589/-21: `src/gate/event-gate.ts`, `src/framework.ts`,
`changelog.d/debounce-answered-writes.fixed.md`, 2 new test files.

# Verdict

**Approve.** The fix does what #814 asks and the approved design was followed exactly
(additive no-op-when-absent hooks, fire-time check, throw ⇒ wakeable, publication fence moved
to the outer `finally`, aggregate render batches left wakeable and pinned by a test). I found
no logic path that drops a genuinely unseen or unanswered event: every "done" answer reuses
`readsWriteFor` / `landedRow` / `writeAnswered` with the same semantics the scheduler's existing
wake-drop already applies (framework.ts:31158-31192 vs :19752-19756), and every uncertainty
(no agent, another resident's placement, unknown landing, unknown placement, store fault,
branch mismatch, fork write, aggregate render) resolves to *wakeable*. Tests are real: 8
independent mutations of the drop filter, the fire-time retention, the per-recipient grouping,
the reply requirement, the error fallback and the fence were each caught (receipt below).

Two MEDIUM findings concern the new global publication fence, not the drop logic. M-1 is a
capacity-limit path that can discard unseen channel events in a window where the old code
delivered them; it is small to fix and I'd take it before merge, but it is a 100-event
overflow of a pre-existing, counted-and-logged cap rather than a logic false-drop, so it does
not block.

# Findings

## MEDIUM

**MEDIUM `src/gate/event-gate.ts:3811-3814` (bug, possible input loss): fenced events are
re-buffered into the capped inference buffer, so a slow final publication can evict unseen
channel events that the old code delivered immediately.**
While a fence is open the gate's `inferring` set is *empty* (`onInferenceEnded` deletes the
agent before the fence resolves, event-gate.ts:4292-4303), so each debounce fire goes
`fireDebounce` → `deliverEvents` → `bufferForInference(batched.filter(waits))`. That buffer is
capped at `MAX_INFERENCE_BUFFER = 100` and silently drops the **oldest** (event-gate.ts:4383-4400).
Before this commit the same batches were delivered at once (idle agent, nothing inferring), and
an over-capacity wake only queued in `pendingRequests` — nothing was lost.
Probe (`md5ah-probe-fence-cap.mjs`, `isWriteDone` always false so *every* event is unseen):
with one fence open, 101 addressed channel events → `buffered: 100 droppedBuffered: 1`,
`[gate] inference buffer cap (100) — dropped 1 oldest buffered event(s)`, and the released
batch names only the surviving 100. The window is real: a `channels/publish` request has a
60 s deadline (`DEFAULT_REQUEST_TIMEOUT_MS`, src/mcpl/server-connection.ts:144), a turn's
speech chain can hold several, plus `waitForOpenChannel` lifecycle tails
(src/mcpl/channel-registry.ts:3836), and the minimum debounce is 100 ms — so a busy channel
against a stalled server can exceed 100 events inside one fence.
Fix direction: don't route fenced events through the capped buffer — hold them in a dedicated
list (or re-arm the debounce timer) so the fence can't consume the quiesce/inference cap; or
bound the fence (see M-2), which shortens the window.

**MEDIUM `src/gate/event-gate.ts:4291-4301`, `src/framework.ts:25819-25825` (robustness): the
fence is a single global counter with no deadline, so one agent's slow or stalled publication
defers every agent's placement-backed channel debounce delivery.**
`settlingReplies` is agent-agnostic: any open fence holds every event with `after` + `replyTo`,
whoever its recipients are. The promise is only resolved by `finishGateReplies?.()` in the
stream's outer `finally` (framework.ts:26781-26782). I verified that release is unconditional
on the real paths — the assignment is in `case 'complete'` of the `for await` body inside the
same `try` (framework.ts:25070, 26782), so every exit including `return`, throw, stop and
disposal runs it, and `dispose()` zeroes the counter after setting `disposed`
(event-gate.ts:4829-4833) so a disposed gate cannot leak it. I also verified the dependency
audit's claims: `routeLocusSpeech` (framework.ts:20966-20977) only reaches
`ChannelRegistry.routeSpeech` → `deliverSpeech` → `publish`, whose waits are lifecycle tails
and a deadlined `sendChannelsPublish` (server-connection.ts:1697-1704); nothing there awaits
the gate or inference, so there is no deadlock. What remains is latency and coupling: up to
minutes against an unresponsive server, and `turnStreamEvents` only ends the loop when the
stream yields again or ends (framework.ts:2627-2661), so a foreign stream that stalls after its
terminal event holds the fence until it does, with no watchdog. Events are buffered, not
discarded (and are visible as `inferenceDiagnostics().bufferedEvents`) except via M-1.
Fix direction: race `repliesSettled` against a deadline, and/or key the fence by agent so an
event only waits on a fence belonging to one of its possible recipients.

## LOW

**LOW `src/gate/event-gate.ts:3851-3853` (design): when a remainder group holds 2+ recipients
but not all of them, the batch line is written only into `group.agents[0]`'s window while every
member of the group is woken.** `forAgent` is a single name (framework.ts:29581-29607: that
agent's window, absent = the primary's). Probe (`md5ah-probe-3agents.mjs`, 3 recipients, `one`
has answered): `writes: [{forAgent: "two"}]`, `wakes: ["two","three"]` — `three` wakes with no
line of its own. Not a regression in kind (historically the single line went to the primary
only, so non-primary recipients already relied on the residents' shared/merged view), and it
needs ≥3 gate recipients with diverging remainders. Fix direction: one `deliverBatch` write per
agent in a multi-agent group, or document the reliance on the shared slot.

**LOW `src/gate/event-gate.ts:3795-3801` (observability): `gate:debounce-delivered` is still
emitted for a batch the fence re-buffered in full or the read check dropped in full**, so the
trace's `eventCount` now overstates deliveries. The implementer discloses this in the report's
residual risk; it is a trace-surface change and the changelog's "what needs an entry" list in
CONTRIBUTING.md names event/trace surfaces.

**LOW `src/gate/event-gate.ts:2201,3862-3871` (observability): a persistent check fault is
logged once per gate lifetime** (`writeCheckErrorLogged` is never reset), where the scheduler's
equivalents log per call (framework.ts:31170,31184). The fallback itself is right (returns
false ⇒ wake kept), and `gateWriteDone` deliberately has no `try/catch` of its own because the
gate's catch covers it — but a store that is unreadable for hours leaves one line of evidence.

**LOW `changelog.d/debounce-answered-writes.fixed.md:7-11` (docs): the public-API bullet sits in
a `.fixed.md` fragment**, so the new optional `EventGate` constructor option / parameters fold
into the **Fixed** section at release. CONTRIBUTING.md:Changelog allows sibling fragments per
category and the repo already does this (`awaited-call-routes.added.md` + `.fixed.md`); an
`.added.md` sibling would file the API addition under Added. Content itself is accurate.

# Verification Gates

Reused (implementer's receipts, read not re-run; numbers confirmed from the logs):
- `head-node22.23.3` / `head-node22.12.0` @ `84149999`: exit 0, `# pass 9430 / # fail 0 / # skipped 63`.
- `base-node22.23.3` @ `a687fa61`: `# pass 9405 / # fail 0 / # skipped 63` — delta 25 = the new tests.
- `regression-red`: `# tests 19 / # pass 4 / # fail 15`, matching the PR body's "15 failed, 4 passed".

Run by me (all under `XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G
-p MemorySwapMax=0`, Node 22.23.3, `orgasmic dispatch gate`):
- `probe-build` — exit 0 — `npm run build` —
  `gate-probe-build-01M66NXS6W81JN37TJC35CPNPC.log`
- `probe-new-tests` — exit 0 — `node --test dist/test/debounce-seen-{batch,wake}.test.js` →
  25 pass / 0 fail — `gate-probe-new-tests-01M66NXWVPK6JTD7WMR9QWVXG6.log`
- `probe-mutations` — exit 0 — 8 mutations of the compiled output (ignored build tree; restored
  and re-verified green at the end) — `gate-probe-mutations-01M66P7BYJXER6JVV2BF7RVJKJ.log`,
  script `md5ah-mutations.sh`:

  | mutation | caught |
  | --- | --- |
  | M1 `writeDone` always true (drop every batched event) | 10 fail |
  | M2 check-error fallback drops instead of keeping | 1 fail (`a check that throws keeps every event`) |
  | M3 publication fence removed (plain `onInferenceEnded`) | 5 fail (held channel batch + all 4 publication-outcome tests) |
  | M4 one recipient's remainder reused for all | 3 fail (per-agent + multi-resident) |
  | M5 `replyTo` never recorded (reply requirement dropped) | 5 fail (`keeps its addressed wake` + fence tests) |
  | M6 fence holds every placement-backed event (over-broad) | **survives** — test gap |
  | M7 placement cloned at admission (not retained by reference) | 6 fail (fire-time check pinned) |
  | M8 judge batches also acquire placements | **survives** — test gap |

- Production-path probes, outside the tracked tree: `md5ah-probe-fence-cap.mjs` (M-1 evidence),
  `md5ah-probe-3agents.mjs` (LOW-1 evidence). Both drive the real exported `EventGate`.

Code review beyond the tests: `gateWriteDone` vs `deferredWriteDone`/`storedMessageDone`
semantics (including "row missing ⇒ done" parity and the deliberate omission of
`settleUnknownLandings`, which keeps unknown landings wakeable); `readsWriteFor`'s
`placement.agent !== agentName` restriction (#819) for other residents and fork writes
(framework.ts:17448-17482 returns before the hoisted placement is ever filled — audit claim
confirmed); `markAnswered(finalRead)` at framework.ts:25483 precedes the fence, so the watermark
is current; gate `replyTo` vs the scheduler's `to` have identical nullability because both derive
the channel from `derivePushEventChannel`/`info.channelId`; no-hook path is byte-identical
(`deliverEvents` short-circuits to `deliverBatch(events)` at event-gate.ts:3834-3837).
Worktree left clean (`git status --short` empty, `dist` restored byte-identical).

# Unmet Criteria / test gaps

Acceptance criteria are met: seen events are dropped (`does not wake a fully satisfied
recipient`), a fully seen batch causes no wake (module/channel/push × direct/held), unseen events
are kept (partial batch with a mid-turn arrival; aborted/failed turns), a red test exists for the
#814 case and the channel path, gates pass on both Nodes, and the PR body opens with `Fixes #814`.
No internal names appear in the commit or the PR body; the `Co-Authored-By: GPT-6-Astra
<noreply@openai.com>` trailer and the fork-owner authorship match existing history (3 prior
commits use the same trailer). Existing tests are unedited (`git show --stat`: only the 2 new
test files).

Gaps:
1. The fence predicate's narrowing to `after && replyTo` is unpinned (M6 survives): widening it
   to all placement-backed events — which would delay module/ambient wakes needlessly — passes.
2. The `!judge` exclusion in `handleDebounce` is unpinned (M8 survives): giving judge batches a
   placement passes, because the judge test never supplies a placement.
3. No test covers a ≥3-recipient subset group (LOW-1) or the fence/cap interaction (M-1).
4. No test asserts the aggregate render-batch exception stays unmarked at the *call site* beyond
   the one behavioural test; that is sufficient for the approved limitation.

# Residual Risk

- M-1/M-2 above: the fence's duration is bounded only by MCPL request deadlines (60 s each) and,
  for non-conforming streams, by when the stream ends. Held events are visible in
  `inferenceDiagnostics().bufferedEvents`, which is the documented wedge tell.
- The fix only ever drops events for the agent that *owns* the write placement. For every other
  resident `readsWriteFor` returns `{}`, so no debounced event is dropped for non-primary
  recipients — pinned by `one resident reading a shared write does not cancel another
  resident's wake`. A multi-resident deployment keeps most of the #814 duplicate wakes.
- Aggregate render-batch wakes stay wakeable (approved limitation, pinned and disclosed).
  Unknown placements, multi-message module responses, fork writes and #243's recipient
  selection are unchanged.
- No live provider or production deployment was exercised by either side; MCPL coverage is a real
  loopback WebSocket with a mock model.
- Hosts that embed `EventGate` directly and pass none of the new optional arguments are
  unaffected (verified by code and by `without either optional hook …`).

# Fix Directions

1. (M-1, recommended before merge) Stop routing fenced events through `bufferForInference`: keep
   a separate `fencedEvents` list (counted in `inferenceDiagnostics`) drained by `release`, or
   re-arm the batch's debounce timer instead of re-buffering, so the fence cannot consume the
   100-event cap and discard unseen input.
2. (M-2) Race `repliesSettled` against a deadline (`Promise.race` with a timer that logs when it
   fires) so a stalled publication degrades to today's extra wake rather than a held batch, and
   consider keying the fence by agent name so one agent's publication does not hold another's
   channel wakes.
3. (LOW-1) In a multi-agent remainder group, write the line once per agent instead of once per
   group, or state the shared-slot reliance in the code comment.
4. (LOW-2) Emit `gate:debounce-delivered` only for what was actually delivered (or add a
   `held`/`dropped` count), and name the trace change in the changelog fragment.
5. (LOW-3) Log the check fault on a throttle rather than once per lifetime.
6. (LOW-4) Move the API bullet to a sibling `changelog.d/debounce-answered-writes.added.md`.
