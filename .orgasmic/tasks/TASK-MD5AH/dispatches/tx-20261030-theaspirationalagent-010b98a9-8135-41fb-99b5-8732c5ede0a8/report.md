# Re-review (round 2) — TASK-MD5AH @ 43df5ab0799db0aeea7b682dc3666a335007f3fa

Scope: fix round 1 against `/srv/review-drop/TASK-MD5AH-REVIEW1.md`, reported in
`/srv/review-drop/TASK-MD5AH-FIX1.md`. Head = `4f6a4295` (the reviewed `84149999`, rebased) +
`43df5ab0`, on upstream main `71193a9f`. Round 2 touches `src/gate/event-gate.ts` (+177/-65),
the two existing regression test files, and the two changelog fragments; `src/framework.ts` is
byte-identical to the reviewed round-1 version (`git diff --quiet 4f6a4295 HEAD -- src/framework.ts`).
No upstream test or source file is edited by either commit (`git diff --name-only 71193a9f HEAD`
lists exactly 6 files, 4 of them this task's own).

# Verdict

**Approve.** Both MEDIUM findings are genuinely fixed, not papered over, and I reproduced the
fix for each on the production path. Both of round 1's surviving mutations (M6, M8) are now
caught. The four new mutations I aimed at the 65 s deadline and the per-agent keying are all
caught. Nothing I could construct holds an event forever or delivers one twice.

Everything below is LOW. Three are new (all narrow, all in round 2's own new code); one is a
re-grade of round 1's LOW-2, whose disposition is only partly accurate. None blocks ship, and
none would justify another fix round on its own — I'd take L-1 and L-3 as a trailing cleanup
with whatever lands next in this file.

# Findings

## LOW

**LOW `src/gate/event-gate.ts:3872` (design, inconsistent with its own stated rationale): when
two residents each hold an open publication fence over the same event, each fence writes its own
batch line into the shared message slot — exactly the duplicate that LOW-1's shared-slot choice
was adopted to avoid.**
The LOW-1 disposition is correct and well-evidenced for the direct path: residents really do read
one stored row (`test/debounce-seen-wake.test.ts:167` is a real-framework test asserting
`deepEqual(third, other)` with `other.length === 1`), so collapsing identical remainders to one
`deliverBatch` is right, and I agree with taking the documented alternative. But round 2's
per-agent fences release independently, and the released path pins `forAgent` to the fence's own
agent (`released?.agentName ?? …`) rather than collapsing across agents, so the collapse no longer
covers the fenced case.
Probe (`two-fences.mjs`, in evidence; `isWriteDone` always false, two residents, one addressed
channel event, both residents' turns end with a slow publication):
```
after agent one settles -> writes: [{… "forAgent":"one"}]              wakes: [ 'one' ]
after agent two settles -> writes: [{… "forAgent":"one"}, {… "forAgent":"two"}] wakes: [ 'one','two' ]
>>> stored gate:debounce lines for ONE event: 2 | forAgent values: one,two
```
Two `[Gate: 1 event matched]` rows land in the slot both residents read, for one message. Impact is
bounded: fenced events always carry `replyTo`, so they are MCPL channel events with
`inContext: true` and the duplicated line is the compact *reference* line ("1 message in room —
already shown above at arrival"), never a second copy of the content; and the wake count is
unchanged (2 wakes, as upstream also produced). So this is context noise, not wake amplification
or input loss. It needs ≥2 residents whose publications are both in flight when the event fires,
which is why `"one agent's slow publication does not hold another recipient of the same batch"`
(batch test:230, one fenced + one unfenced) does not reach it.
Fix direction: let `flushPublicationFencesIfClear` collect the fences that are ready in the same
pass and deliver their identical remainders as one group (reusing the existing grouping), or
suppress the line — not the wake — for the second and later fence releases of the same event.

**LOW `src/gate/event-gate.ts:3876-3881` (docs/observability): `gate:debounce-delivered` is now
emitted from two paths that previously emitted nothing, and can fire more than once per delivery
occurrence; the report's "fixed without changing the trace shape" and the changelog bullet cover
only the count change.**
Upstream emits this trace at exactly one site, after `deliverEvents` in `fireDebounce`
(`git show 71193a9f:src/gate/event-gate.ts`, one match). Round 2 moves it into `deliverEvents`
behind `traceDelivery`, which is passed `true` from `fireDebounce` *and* from
`flushInferenceBufferIfClear` (:4380) *and* from the fence-release path (:4405). The field set is
indeed unchanged, and the `fireDebounce` path stays 1:1 because a debounce bucket holds one policy
— so the compatibility claim is real as far as it goes. But the inference/quiesce buffer flush
merges several policies' batches, and the new per-policy grouping then emits one trace per policy
where upstream emitted none.
Probe (`trace-flush.mjs`, in evidence; no `isWriteDone` hook at all, so this is the plain no-op
path — two policies buffered across one turn):
```
traces while inferring:        []
traces after the buffer flush: [ 'alpha:2', 'beta:1' ]
writes: 1
```
One stored line, two traces, where upstream produced one line and zero traces. A consumer counting
`gate:debounce-delivered` to count debounce fires will now also count buffer flushes and will see
multiple events per flush. Arguably an improvement (buffered deliveries were invisible), but it is
an undisclosed trace-surface change, and CONTRIBUTING.md:116 names "event/trace surfaces" as
needing an entry. The changelog bullet
(`changelog.d/debounce-answered-writes.fixed.md:9-10`) says only that the trace "now counts only
events actually delivered".
Fix direction: add a clause naming the new emission sites (or state that a merged flush traces
once per policy), and consider a test over the buffer-flush path — the existing trace test
(batch test:178) only exercises `fireDebounce`.

**LOW `src/gate/event-gate.ts:3840` (robustness): the released path takes its recipient from the
name captured when the fence opened, not from the live `getAgentNamesFn()`, so a recipient
deregistered mid-fence is still written to and still woken.**
The direct path re-reads `this.getAgentNamesFn()` at delivery, so it can never name an agent that
is gone; `const recipients = released ? [released.agentName] : this.getAgentNamesFn()` makes the
fence path the one exception.
Probe (second block of `two-fences.mjs`: fence opened for `one`, then `getAgentNames` returns
`['two']` only, then the publication settles):
```
>>> after deregistering the fenced recipient -> writes: [{…"forAgent":"two"}, {…"forAgent":"one"}]
                                                wakes: [ 'two', 'one' ]
```
By code reading the framework-side consequence is a no-op plus noise rather than a fault:
`addMessage` hits the unregistered-target guard at `src/framework.ts:29649-29656`, logs
`delivery target "one" is not a registered agent — message dropped` and returns, and
`requestInference` (framework.ts:4852) only pushes a `pendingRequests` row that no registered agent
will claim. I did **not** confirm that end-to-end — the probe is gate-level, and the implementer's
`disposes` outcome test (wake test:241ff) covers gate *disposal*, which short-circuits in
`release()`, not deregistration with a surviving gate. Fix direction: intersect the released
recipient with `getAgentNamesFn()` before delivering, and drop the fence's events if it is gone.

**LOW `src/gate/event-gate.ts:4392-4409` (robustness, pre-existing pattern): the flush gate checks
`quiesced` / `inferring` synchronously but the delivery microtask re-checks only `disposed`, and
the events are already spliced out of the fence by then.**
`flushPublicationFencesIfClear` deletes the fence and `splice(0)`s its events before
`queueMicrotask`, and the comment at :4400-4401 ("If a turn or surgery is active at release, the
ready fence waits here") describes the gate, not the microtask. If `onInferenceStarted` or
`setQuiesced(true)` runs in the remainder of the same synchronous task, the batch is delivered
mid-turn or mid-surgery with no path left to re-hold it — the #122 rule the quiesce check exists to
enforce. The window is one microtask and the identical pattern already exists in
`flushInferenceBufferIfClear` (:4370-4389), so this is not a round-2 regression; I could not
construct a real framework sequence that hits it. Noting it because round 2 added a second
instance and asserted the stronger property in the comment. Fix direction: re-check
`disposed || quiesced || inferring.size > 0` inside the microtask and put the events back on the
fence if it fires.

# Verification Gates

Range-diff / identity, verified by me, not taken from the report:
- `git range-diff 84149999^..84149999 4f6a4295^..4f6a4295` → `1: 84149999 = 1: 4f6a4295`.
- Patch-ids identical: both `8fa99376beb3231a012c424766161c9ebf5f29b6`.
  `diff <(git diff 84149999^ 84149999) <(git diff 4f6a4295^ 4f6a4295)` → empty. **The rebased
  patch is identical**; the rebase moved it from `a687fa61` to `71193a9f`, which
  `git merge-base --is-ancestor 71193a9f HEAD` confirms is this head's ancestor.
- Both commits: author = committer = `Vasyl Dovhanchyn
  <48733736+theaspirational@users.noreply.github.com>`, each carrying
  `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`.
- Internal-name scan over the PR body, both commit messages and the full `71193a9f..HEAD` diff
  (`orgasmic|tarn|alder|MD5AH|ZA-2026|TG N|ask-<hex>|review-drop|srv/|/home/orgasmic`): the only
  hits are the fork owner's own GitHub handle in the author fields. **Clean.**

Run by me, all under `XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G
-p MemorySwapMax=0`, Node 22.23.3, via `orgasmic dispatch gate`:
- `probe-new-tests` — exit 0 — `npm run build && node --test … dist/test/debounce-seen-{batch,wake}.test.js`
  → **# tests 36 / # pass 36 / # fail 0** — log
  `gate-probe-new-tests-01M66T29R5QWSTDXB3EHX3CWN8.log`. (This is the brief's required run; it
  matches the head−base delta of 36 below.)
- `probe-mutations-r2` — exit 0 — 10 mutations of the compiled output, baseline asserted green
  first and restored green at the end — log
  `gate-probe-mutations-r2-01M66V25YSJFAEVRD0M9DGD5WR.log`, script
  `md5ah-review2-mutations.py` (in evidence):

  | # | mutation | result |
  | --- | --- | --- |
  | M6 | fence predicate over-broad (drop `&& event.replyTo !== undefined`) | **CAUGHT** — `only placement-backed reply-requiring events wait on a publication fence` (round 1: survived) |
  | M8 | judge batches also acquire placements (`!judge &&` removed) | **CAUGHT** — `a final-publication fence leaves judge timing and inference status unchanged` (round 1: survived) |
  | N1 | deadline timer never armed | CAUGHT (14 not-ok) — but it throws on `fence.timer.unref?.()`, so a crash mutation; N2 is the clean deadline probe |
  | N2 | deadline widened 65 s → 650 s | **CAUGHT** — `a stuck fence releases wakeable events after 65 seconds and logs once`, `overlapping fences cannot extend an earlier batch deadline` |
  | N3 | timeout re-checks `writeDone` (drops instead of waking) | **CAUGHT** — `a stuck fence releases wakeable events after 65 seconds and logs once` |
  | N4 | fence stored under one global key, not per agent | **CAUGHT** — `overlapping fences cannot extend an earlier batch deadline` |
  | N5 | fence *lookup* ignores the agent (any open fence holds) | **CAUGHT** — `one agent's slow publication does not hold another recipient of the same batch` |
  | N6 | newest open fence chosen instead of oldest | **SURVIVES** — test gap (below) |
  | N7 | `fence.ready` double-release guard removed | **SURVIVES** — test gap (below) |
  | N8 | `dispose()` stops clearing fence timers | **SURVIVES** — test gap (below) |

Production-path probes (in evidence; all drive the real exported `EventGate`, outside the tracked
tree): `fence-cap.mjs` (M-1), `two-fences.mjs` (L-1, L-3), `trace-flush.mjs` (L-2).

Reused receipts (read, not re-run; counts confirmed from the logs themselves):
`round2-rebased-head-node22.23.3` and `…-node22.12.0` @ `43df5ab0` → **9442 pass / 0 fail /
63 skipped** each, `node --version` lines `v22.23.3` and `v22.12.0`;
`round2-rebased-base-…` @ `71193a9f` → **9406 / 0 / 63** each. Delta 36 = the 36 regression tests I
ran. `round2-rebased-mutations` log shows M6 and M8 each failing their designated test and the
restored build green at 36/36. `round2-regression-red` → `# tests 36 / # pass 29 / # fail 7`.
I did not re-run the full suite; the brief makes it optional and the manager runs it separately.

**Focus answers**

1. **M-1 — fixed, and I reproduced it.** Fenced events are pushed to `fence.events`
   (`event-gate.ts:3855`), an ordinary array on the per-agent `PublicationFence`; no path reaches
   `bufferForInference` from the fence, and the released path keeps them out of it too
   (`:4405` delivers directly). `fence-cap.mjs` replays review 1's exact failing case — 101
   addressed channel events, one open fence, `isWriteDone` always false:
   `held: 101  droppedBuffered: 0  cap logs: 0`, and the released batch reads
   `[Gate: 101 events matched]`. Review 1 measured `buffered: 100 droppedBuffered: 1` plus the cap
   warning on the same input. The 100-event cap itself is untouched and still pinned
   (`the cap evicts placements with their events and never resurrects them`, batch test:108).
   **Held forever:** no. A fence's events leave by one of three doors — the promise, the 65 s
   timer, or `dispose()` — and a release blocked by `quiesced`/`inferring` is retried from
   `flushInferenceBufferIfClear` (:4372), which both `onInferenceEnded` (:4343) and
   `setQuiesced(false)` (:4365) call; `released holds remain uncapped while a new turn or quiesce
   prevents delivery` (batch test:314) pins that door. `dispose()` discards them, which is the same
   contract `inferenceBuffer` has had.
   **Delivered twice:** no. `flushPublicationFencesIfClear` does `fences.delete(fence)` and
   `fence.events.splice(0)` synchronously before queueing the delivery, so nothing can be picked up
   a second time; and the released path passes `released`, which suppresses re-holding
   (`:3850`, `!released && …`), so there is no hold→release→hold loop. Pinned by `late settlement
   cannot deliver twice` (batch test:290). The one genuine double-*write* is L-1, and it is one line
   per agent, not the same line twice to one agent.
2. **M-2 — fixed.** `settlingReplies` (a global counter) is gone, replaced by
   `publicationFences: Map<string, Set<PublicationFence>>` keyed by agent, and both the store
   (:3845) and the lookup (:3850) are per-agent — N4 and N5 kill the two ways to get that wrong.
   The 65 s deadline is real (`PUBLICATION_FENCE_TIMEOUT_MS`, :63, armed at :4338, justified in the
   comment as one 60 s MCPL publish timeout plus teardown) and N2 kills widening it.
   **Timer leak:** none. The timer is `clearTimeout`ed on every release (:4332) and for every
   fence in `dispose()` (:4900); `flushPublicationFencesIfClear` only ever deletes fences that are
   already `ready`, i.e. whose timer is already cleared, so no armed timer is ever orphaned — and
   `fence.timer.unref?.()` (:4339) means even an orphan could not hold the process open.
   **Double release:** guarded by `fence.ready` (:4329) and, independently, by the splice-and-delete
   above; see N7 for the part of this that is unpinned.
   **Overlapping fences:** an event attaches to the oldest open fence, i.e. the one with the
   earliest deadline, so a later turn cannot extend an already-waiting event's bound — the
   property the report claims. Max hold is 65 s either way (an event attaches to exactly one
   fence, once, at arrival), which is why N6 survives harmlessly.
   **Timeout drops vs wakes:** it wakes. `released?.timedOut || !this.writeDone(…)` (:3858) keeps
   every event when the deadline fired, bypassing the answered-write check entirely, with a single
   log line; N3 kills inverting this and the test asserts `checks === 0`.
   **Disposal:** `this.disposed = true` is set before the fence teardown in `dispose()`, and
   `release()` tests `disposed` first, so a late promise settlement after disposal delivers nothing
   (batch test:337 asserts no wakes, no logs, `bufferedEvents === 0`).
3. **LOW-1 — the shared-slot choice is correct, with the L-1 caveat.** The premise is not just
   asserted: `test/debounce-seen-wake.test.ts:167` drives the real framework and real storage and
   shows both residents reading the *same single* stored row, so writing it per resident really
   would duplicate it, and the code comment at :3841-3844 states the reliance as the review asked.
   What round 2 did not carry over is that the collapse stops applying once fences release
   per agent — see L-1.
   **LOW-2 — the compatibility claim is only partly real.** Fields: unchanged, and the
   `fireDebounce` path is still exactly one trace per fire. Emission sites and per-occurrence
   cardinality: changed, and undisclosed — see L-2.
4. Done — table above. M6 and M8 are closed; N2/N3/N4/N5 confirm the deadline and the per-agent
   keying are load-bearing and pinned; N6/N7/N8 are the new gaps.
5. **PR body — accurate.** Every number checks out against the logs: base 9,406 and head 9,442 with
   0 failures and 63 skips on both Nodes; 36 regression tests (= the head−base delta, = my 36/36
   run); "both previously surviving mutations are caught" (verified independently above, not just
   from their log). "Fixes #814" opens it; the aggregate render-batch limitation and the
   no-live-provider caveat are both still disclosed; the 65 s deadline, the out-of-cap holds, the
   per-recipient fence and the shared line are each named. No internal names. Identity and the
   co-author trailer are right on both commits. One nit, in the artifact rather than the text:
   `$ORGASMIC_REVIEWED_EVIDENCE_DIR/pr-body.md` includes the literal `BEGIN PR BODY` /
   `END PR BODY` envelope lines, so it is not safe to paste verbatim — strip them, or they will
   appear in the PR.

# Unmet Criteria / test gaps

No unmet acceptance criteria. #814's criteria were already met in round 1 and nothing in round 2
weakens them: the drop filter, the reply requirement, the per-recipient grouping, the error
fallback, the fire-time re-check and the aggregate-render exception are all still pinned (M6, M8
and round 1's M1–M5/M7 all fail their designated tests), and `src/framework.ts` is unchanged.

Gaps, all new to round 2's own code and all narrower than the two the fix round closed:
1. **N6 survives.** `overlapping fences cannot extend an earlier batch deadline` (batch test:294)
   does not pin what its name suggests. At no point in it do two fences sit open *while an event
   arrives*: `first` arrives when only fence 1 exists, and `second` arrives at t=65 s after fence 1
   has already timed out, leaving fence 2 the only candidate. So `[...fences].find(f => !f.ready)`
   can be flipped to pick the newest and nothing fails. Benign — the bound is 65 s either way — but
   the "earliest deadline wins" property is unverified. Add a case with two fences genuinely open
   at arrival and assert the event releases on the older one's deadline.
2. **N7 survives.** Removing the `fence.ready` guard changes nothing observable, because
   delete-and-splice already makes the *delivery* idempotent. The guard is still load-bearing, in a
   case no test reaches: if a fence times out while `inferring.size > 0`, its flush is deferred with
   `timedOut: true` still set on a fence that is *still in the map*; a later promise settlement
   would, without the guard, overwrite `fence.timedOut` back to `false`, and the deferred flush
   would then run the answered-write check on events whose deadline had already expired — i.e.
   drop wakes the deadline had promised to keep. Worth a test: time a fence out during a turn, then
   settle its promise, then end the turn, and assert the events still wake.
3. **N8 survives.** `disposal clears fence timers and prevents later delivery` (batch test:337)
   only pins the second clause; the `clearTimeout` loop in `dispose()` (:4900) can be removed with
   no failure, since the timers are `unref`'d and `release()` bails on `disposed`. Cosmetic.
4. No test covers two residents both fenced over the same event (L-1), the buffer-flush trace path
   (L-2), or a recipient deregistered mid-fence (L-3).

# Residual Risk

- A publication chain longer than 65 s degrades to today's extra wake. That is the intended
  trade and is disclosed in both the changelog and the PR body.
- `fence.events` is deliberately uncapped — the M-1 fix. Growth is bounded by the 65 s deadline
  rather than by a count, so a very high-rate channel against a stalled publication holds more
  than the old 100, at ~200 bytes of content snippet each. Visible as
  `inferenceDiagnostics().bufferedEvents`, which is now a distinct union of the buffer and all
  fences, so an event in both is counted once.
- `dispose()` discards held fence events (same contract as `inferenceBuffer`). L-3 is the only
  place I found where a stale captured agent name escapes, and its framework-side effect is a
  logged drop, which I did not confirm end-to-end.
- Everything round 1 listed still stands unchanged: the fix only drops events for the agent that
  *owns* the placement, so a multi-resident deployment keeps most of #814's duplicate wakes for
  non-owners; aggregate render batches, unknown/unsafe placements and another resident's placement
  stay conservatively wakeable; #243 recipient selection and fork views are untouched.
- No live provider or production deployment was exercised by either side. MCPL coverage is a real
  loopback WebSocket with a mock model; the publication-outcome tests (throw / refuse / stop /
  dispose) do drive the real `ChannelRegistry.routeSpeech`.
- My own process note, for the record: my first mutation run was killed mid-flight and, because
  `tsc` is incremental, the surviving mutation was not overwritten by a plain rebuild. The results
  reported above come from a re-run after `npm run clean && npm run build`, with the pristine
  anchors verified and the baseline asserted green before the first mutation and again after the
  last. Earlier intermediate numbers from the killed run are not relied on anywhere.

# Fix Directions

1. (L-1) In `flushPublicationFencesIfClear`, gather the fences that are ready in one pass and run
   their remainders through the existing identical-remainder grouping, so two residents released
   together share one line as the direct path does; or write the line only on the first release of
   a given event and keep the later releases' wakes.
2. (L-2) Add one clause to `changelog.d/debounce-answered-writes.fixed.md` naming the new emission
   sites (the inference/quiesce flush and the fence release), and note that a merged flush traces
   once per policy. A trace assertion over the buffer-flush path would pin it.
3. (L-3) Intersect `released.agentName` with `getAgentNamesFn()` before delivering a released
   fence, and discard the fence's events if the recipient is gone.
4. (L-4) Re-check `disposed || quiesced || inferring.size > 0` inside the fence-release microtask
   and return the events to the fence if it trips; the same guard would help
   `flushInferenceBufferIfClear`.
5. (gap 1) Extend `overlapping fences cannot extend an earlier batch deadline` so two fences are
   open when the event arrives, and assert it releases on the older deadline.
6. (gap 2) Add the timed-out-during-a-turn-then-settled case, asserting the events still wake.
7. (nit) Strip the `BEGIN PR BODY` / `END PR BODY` lines from the `pr-body.md` artifact.
