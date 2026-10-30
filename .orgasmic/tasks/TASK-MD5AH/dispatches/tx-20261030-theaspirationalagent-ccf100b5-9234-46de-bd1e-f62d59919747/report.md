# Re-review (round 3) — TASK-MD5AH @ acfccc9a24e663a7c17c166a1a364bc1aeb3c2ca

Scope: fix round 2 (`acfccc9a`) on reviewed head `43df5ab0`, upstream main `71193a9f`
(`git merge-base --is-ancestor 71193a9f HEAD` → yes). Inputs read: implementer report
`/srv/review-drop/TASK-MD5AH-FIX2.md`, bot review `/tmp/pr937-reviews.json` +
`/tmp/pr937-comments.json` (5 MEDIUM + 3 LOW), prior re-review
`/srv/review-drop/TASK-MD5AH-REVIEW2.md` (4 LOW). `git diff --name-only 71193a9f..HEAD` lists
exactly 7 files, all this task's own; `src/dendrite/registry.ts` is **not** touched, so
`sharedSlotReaders()` is pre-existing upstream API, not something this PR invented.

# Verdict

**Approve (confidence HIGH).** All 12 findings are genuinely closed, and I reproduced the fix
for each on the production path rather than taking the disposition table on trust. I could not
construct a double wake, a lost event, a lost input, or an event held forever that round 2
introduced. The approved trade-off is implemented as approved and is **content-safe**: the
events the shared summary omits are, by construction, exactly the placement-backed ones, and a
`WritePlacement` only exists because the host already stored that content (framework.ts:6257,
:17193, :17525, :19302) — so the only thing omitted is the summary/reference line, never input.

Everything below is LOW, and all four are **test gaps on round 3's own new code**, not defects:
three deliberate guards are load-bearing but unpinned (my mutations R3, R4, R8 survive), and one
is a design asymmetry worth one sentence of documentation. None blocks ship.

# Findings

## HIGH
None.

## MEDIUM
None.

## LOW

**LOW-1 `src/gate/event-gate.ts:3907` (test): the `deferLine = false` argument on the fork's own
line is load-bearing and unpinned — mutation R3 survives all 60 regressions.**
`deliverBatchLine(group.events, name, false)` forces the fork's line to be *written into the
fork's store* instead of being handed to the wake as a deferred `WakeLine`. The `false` is
required because `newestEntry` answers about the **residents' slot**, not the fork's window —
`isNewestContextEntry` (framework.ts, `const agent = this.deliveryAgent()`) tests the delivery
agent, and `WakeLine`s are written "into the window they name, the delivery agent's … on that
agent's own start only". The code comment at :3905-3906 states exactly this. Without the `false`,
a fork receiving a single `mcpl:channel-incoming` event (`inContext: true`) that is the newest
entry in the residents' slot, with no resident turn alive, gets **no gate line at all** in its own
window — the line is deferred to a start that never happens for it. Reachable: conversation forks
are woken by their own channel's debounced traffic (`conversationForkSpec`,
`receivesGateWakes: true`), which is `mcpl:channel-incoming`.
Evidence: `probe-r3-mutations` → `SURVIVES R3-fork-deferline exit 0 []`
(log `gate-probe-r3-mutations-01M66YVB9FYDKNAQ1QC91YHJQN.log`, script `r3-mutations.py`).
The existing fork tests miss it because both use non-`inContext` events
(`debounce-recipient-delivery.test.ts:69` uses the default `clock:reminder`;
`debounce-seen-wake.test.ts` "a conversation fork gets its own summary" uses `send(f,'module')`),
so `only` is never set and the write happens either way.
Fix direction: add a gate-level case with `isNewestEntry: () => true`, a non-shared recipient and
one `mcpl:channel-incoming` event; assert a write with `forAgent` = the fork and no deferred line.

**LOW-2 `src/gate/event-gate.ts:3903` (test): the shared branch never produces a deferred
`WakeLine` in any test, so the "one shared line, both residents' wakes" property it exists to
preserve is unverified — mutation R8 survives.**
Replacing `this.wakeBatch(group.events, residents, line)` with `…, undefined)` fails nothing.
Round 2's coverage of this property was `debounce-seen-wake.test.ts:167`
(`assert.deepEqual(third, other)` with `other.length === 1`); round 3 rewrote that test to assert
`other.length === 0` (correctly — its event's owner answered it, so `common` is empty), and no
replacement reaches a non-`undefined` `line` through `getSharedSlotReadersFn`. The gate-level
fixture in `debounce-recipient-delivery.test.ts` passes no `isNewestEntry`, so `newestEntry()`
returns `false` (`event-gate.ts:4050`) and `line` is always `undefined` there too.
Evidence: `SURVIVES R8-line-not-attached exit 0 []`.
The path does work — my production-path probe (`r3-probe.mjs`, P1: two shared-slot residents,
`isNewestEntry: () => true`, one unanswered addressed channel event) gives
`P1 wakes [{"name":"one","line":{…"messageId":"E"…}},{"name":"two","line":{…"messageId":"E"…}}] writes 0`
— one line object, both wakes, zero store writes. It is simply untested.
Fix direction: that probe as a test case.

**LOW-3 `src/gate/event-gate.ts:3898` (test): the `!released?.timedOut` guard in the `common`
filter is unpinned — mutation R4 survives — and it leaves residents and forks asymmetric on a
timed-out release.**
The guard implements the stated rule "Timeout cannot establish a common remainder: keep its wake
without guessing at a new shared summary" (comment :3896-3897). Removing it fails nothing
(`SURVIVES R4-timedout-common exit 0 []`). Its observable effect, probe P6 (one shared-slot
resident, `isWriteDone` always true, fence forced to `timedOut`):
`P6 timed-out release: wakes ["one"] writes []` — the wake is kept, no line is written. But the
non-shared branch at :3907 is **not** guarded, so a fork owner on a timed-out release *does* get
a line while a resident does not. Cosmetic either way (every fenced event has a placement, so its
content is stored, and `replyTo`-carrying fenced events are `inContext` channel events whose line
is only a reference), but a deliberate asymmetry with no test and no changelog sentence.
Fix direction: assert `writes.length === 0` on a timed-out shared release (and decide whether the
fork branch should match).

**LOW-4 `src/gate/event-gate.ts:3898` (design/docs): the `common` filter re-asks `isWriteDone` for
the fence owner at fire time — i.e. before the publication the fence exists to distrust has
settled — so the premature "answered" signal can suppress the shared summary line even while the
same code correctly defers that owner's wake.**
In the `unread` filter an owner's event short-circuits into `fence.events.push(event)` *before*
`done(agentName, event)` is called (:3867-3872), so the answered-write check is deliberately not
consulted for the owner. One block later, `shared.every((name) => !done(name, event))` calls it
for that same owner anyway. If it returns `true` mid-publication — the exact unreliability
`PUBLICATION_FENCE_TIMEOUT_MS` was introduced for — the event drops out of `common` and no shared
line is written for the *other* residents who do need it. Bounded to the line: those residents
still wake with correct provenance, and the content is already in the shared slot. Not a wake or
input defect; it is an undocumented inconsistency in which signal is trusted where.
Fix direction: skip `done(owner, event)` in the `common` filter for events that were just pushed
onto a fence (treat a fenced event as "unseen by its owner" for summary purposes), or state the
asymmetry in the comment.

# Verification Gates

All through `orgasmic dispatch gate`, Node 22.23.3, under
`XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`:

- `probe-r3-regressions` — exit 0 — `npm run clean && npm run build && npm run pretest` then
  `node --import ./dist/test/helpers/force-exit-blocking-stdout.js --test --test-force-exit
  --test-timeout=120000 dist/test/debounce-{recipient-delivery,seen-batch,seen-wake}.test.js`
  → **# tests 60 / # pass 60 / # fail 0** — log
  `gate-probe-r3-regressions-01M66YT9W16SECZ8PC0Z7D5NBK.log`. This is the brief's required run;
  60 matches the head−base delta below and the PR body's "60 regression tests".
- `probe-r3-mutations` — exit 0 — 9 mutations of my own aimed at round 3's new code, baseline
  asserted green first and restored green (`# pass 60 / # fail 0`) at the end — log
  `gate-probe-r3-mutations-01M66YVB9FYDKNAQ1QC91YHJQN.log`, script `r3-mutations.py`,
  per-mutation logs `r3-mutation-*.log`:

  | # | mutation | result |
  | --- | --- | --- |
  | R1 | fence re-hold order reversed (`fence.events.concat(events)`) | SURVIVES — **vacuous**, see below |
  | R2 | inference-buffer re-hold order reversed | **CAUGHT** — `re-holding a queued inference batch preserves oldest-first cap eviction` |
  | R3 | fork line loses `deferLine = false` | **SURVIVES** — LOW-1 |
  | R4 | `!released?.timedOut` dropped from `common` | **SURVIVES** — LOW-3 |
  | R5 | re-held fence not put back in `publicationFences` | **CAUGHT** — `a fence delivery microtask rechecks turn` / `… quiesce` |
  | R6 | `residents` = all group agents (forks get the shared line) | **CAUGHT** — 2 unit + the real fork test |
  | R7 | fork gets no line of its own | **CAUGHT** — same 3 tests |
  | R8 | `line` not attached to residents' wakes | **SURVIVES** — LOW-2 |
  | R9 | `common` computed with no shared recipients | **CAUGHT** — 4 unit + 2 real framework tests |

  R1's survival is expected, not a gap: a fence only accepts pushes while `!f.ready`
  (:3866-3870), and `flushPublicationFencesIfClear` only ever releases fences that are already
  `ready` after `fence.events.splice(0)`, so `fence.events` is provably empty at the re-hold and
  the concat order is unobservable. Defensive, correct either way.

- Production-path probes, `r3-probe.mjs` (in evidence, driving the real exported `EventGate`
  outside the tracked tree). Raw output in `r3-probe.out`:
  - P1 — shared deferred `WakeLine`: one line, two wakes, zero writes (LOW-2's uncovered path).
  - P2 — a re-held fence survives a turn interruption *and then* a quiesce interruption and
    delivers **exactly once**: `wakes ["one"] writes 1 buffered 0`.
  - P3 — re-held fence whose recipient then leaves `getAgentNames()`:
    `wakes 0 writes 0 buffered 0` — dropped cleanly, no leak.
  - P4 — wedged `inferring` with a re-held fence: `buffered 1 inferring ["one"]`, i.e. visible in
    `inferenceDiagnostics()`; `dispose()` → `buffered 0`.
  - P5 — divergent remainder whose answered owner is a **fork** (not a shared reader): residents
    still get the shared line (`wakes ["one","two"]`, one write) — the `shared.every` filter does
    not let a non-reader's answered state suppress the residents' summary.
  - P6 — timed-out shared release: `wakes ["one"] writes []` (LOW-3).
  - P7 — fully divergent remainders (each resident answered its own write): `wakes ["one","two"]`,
    zero writes, one `gate:debounce-delivered` with `eventCount: 2` — both wake, neither is
    re-presented its own answered event.

- Structural equivalence checks I ran rather than inferred:
  - `src/framework.ts` refactor (focus d): the legacy bodies of `deferredWriteDone` /
    `storedMessageDone` and the new `writeDoneFromEvidence` are semantically identical. The only
    ordering change is that `this.deferredMessages.some((m) => m.id === writeId)` moved *inside*
    the existing `try` — an `Array.some` over an id comparison cannot throw — and
    `agent.getContextManager()` became lazy, which is a pure getter (`src/agent.ts:2491-2493`).
    `settleUnknownLandings` stays in the scheduler wrapper only; the gate stays read-only, as its
    contract requires. No scheduler behaviour change.
  - Focus (b), byte-for-byte legacy without the hook: I diffed the normalized bodies of
    `deliverBatch` @ `43df5ab0` against the new `deliverBatch` + `deliverBatchLine` + `wakeBatch`.
    The **only** two deltas are the new `deferLine &&` conjunct (default `true`) and
    `recipients ?? this.getAgentNamesFn()` moving up into the `deliverBatch` wrapper. The `else`
    branch at :3912-3918 is character-identical to `43df5ab0`'s grouping loop, including
    `released?.agentName ?? (group.agents.length === recipients.length ? undefined : group.agents[0])`,
    and the fast path gains `!this.getSharedSlotReadersFn &&`, which is vacuously true without
    the hook. The grouping loop differs only in the two independently-approved fixes
    (`liveRecipients` intersection, `event.after?.agent === agentName`) plus the `done()` memo,
    which cannot change semantics because `isWriteDone` is contractually side-effect-free and the
    legacy loop already queried each (agent, event) at most once.
  - Identity: `acfccc9a` author = committer =
    `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, trailer
    `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`; same on `43df5ab0` and `4f6a4295`.
  - Internal-name scan (`orgasmic|tarn|alder|MD5AH|review-drop|/srv/|/home/orgasmic|ZA-2026|ask-<hex>`)
    over all three commit messages, the full `71193a9f..HEAD` diff, and the report's
    `BEGIN BOT REPLY`/`BEGIN PR BODY` blocks: **zero hits.** Clean.

Reused receipts (read from the logs, not re-run):
`revision-head-node22.23.3` and `revision-head-node22.12.0` @ `acfccc9a` →
**# tests 9529 / # pass 9466 / # fail 0 / # skipped 63** each, with `v22.23.3` / `v22.12.0`
`node --version` lines; `revision-base-node22.{23.3,12.0}` @ `71193a9f` →
**9469 / 9406 / 0 / 63** each. Delta = 60 = the 60 regressions I ran.
`revision-red-complete` → **60 / 44 pass / 16 fail**. `revision-targeted-complete` → 525/525.
`revision-mutations` → 14 mutations, each with the named designated test failing, baseline green
and restored green (60/60); I re-read `mutations.py` and it does assert the baseline, assert the
*designated* test name appears among the failures, and restore both files in `finally`.
I did not re-run the full suite; the brief makes it optional and the manager runs it separately.
Note for the record: the implementer's full-suite logs show 0 failures, where the manager's own
16G run at `43df5ab0` saw the 2 known environment-only watchdog failures. Environment variance in
a pre-existing, out-of-scope pair; not a regression either way.

**PR body numbers — consistent.** Every figure checks out against the logs: base 9,406 / head
9,466 / 0 failures / 63 skips on both Nodes; 60 regression tests (= head−base delta = my 60/60
run); "reproduces 16 failures before the fix" (= `red-complete`'s `# fail 16`); "all 14 targeted
mutations are caught" (= 14 `mutation-*.log` files, all caught, independently re-read).
"Fixes #814." opens it. The aggregate render-batch limitation, the no-live-provider caveat, the
new `getSharedSlotReaders()` hook, the divergent-summary trade-off, the legacy-placement
fallback, the 65-second wording and the trace emission sites are all disclosed. No internal names.

## Focus answers

**(a) The approved trade-off — implemented as approved, and content-safe.** `common` is
`events.filter(e => !e.sharedSummaryQueued && !released?.timedOut && shared.every(n => !done(n, e)))`.
Because `writeDone` returns `false` whenever `!event.after` (:3932), only **placement-backed**
events can ever fall out of `common`; and because `readsWriteFor` returns `{}` unless
`placement.agent === agentName` (framework.ts:31222) and `writeDoneFromEvidence` returns `false`
for an empty mark, the only event that can fall out is one its **own placement owner** answered.
Every omitted event therefore has a `WritePlacement`, which only exists because the host already
wrote the content (`addMessage` at framework.ts:6257 heartbeat/reminder, :17193 module, :17525
channel-incoming, :19302 push) — so what is omitted is the line, never the input.
- *Unread resident keeps the input and still wakes*: pinned by a real framework test,
  `debounce-seen-wake.test.ts` "unsatisfied residents retain stored content without re-presenting
  it in a shared summary", which asserts `/new event/` in each resident's
  `getContextManager().getAllMessages()` **and** in `f.membrane.calls.slice(1)` — i.e. in the
  actual model request — plus `f.membrane.calls.length === 3`. Mutation R9 kills it.
- *The answered resident does not see it re-presented*: same test asserts
  `linesFor('other').length === 0`; the gate-level case asserts
  `doesNotMatch(JSON.stringify(writes), /answered by/)`. Mutation `shared-common`
  (`every` → `some`) kills it.
- *Forks get their own summary*: `debounce-seen-wake.test.ts` "a conversation fork gets its own
  summary without adding it to the residents shared slot" drives a **real registered**
  conversation fork and asserts one `gate:debounce` row in the fork's store, zero in both
  residents', and `pendingRequests` = `['isolated','other']`. Mutations R6, R7 and
  `store-placement` each kill it.
- B-M2 is genuinely fixed, not papered over: `sharedRecipients[0]` can never be a fork
  (`conversationForkSpec` has `readsSharedSlot` unset) and can never be the subconscious
  (`subconsciousSpec` has `receivesGateWakes: false`, so it is not in `gateRecipients()` and
  cannot reach `groups`). The fork-owner case is handled correctly too (probe P5).

**(b) Legacy grouping/placement without the hook — byte-for-byte.** Verified by normalized diff,
above, and pinned by the new test "without the optional shared-slot hook, legacy divergent-line
placement is unchanged" plus mutation `store-placement`.

**(c) The microtask re-hold in both paths — ordering and cap, no loss or duplication.**
*Inference buffer* (:4437-4443): `const events = this.inferenceBuffer.splice(0)` returns a fresh
array and empties the field, so `events.concat(this.inferenceBuffer)` cannot duplicate; older
events go first; `this.inferenceBuffer = []` then `bufferForInference(pending)` replays through
the single `MAX_INFERENCE_BUFFER` shift-oldest cap (:4521-4540), which is not recursive and emits
no trace. Pinned by "re-holding a queued inference batch preserves oldest-first cap eviction"
(asserts `bufferedEvents === 100`, `droppedBufferedEvents === 5`, and the exact delivered order
`['5'…'104']`); mutations `buffer-microtask` and my R2 both kill it.
*Fence* (:4469-4475): re-adds the fence under `?? new Set()`, which is required because the
synchronous `if (fences.size === 0) this.publicationFences.delete(agentName)` has already run by
then — I checked that interleaving specifically, and the `??` handles it. `fence.timedOut`
survives the re-hold (pinned by "late settlement during a turn cannot undo timeout
wakeability"). A re-held fence is `ready`, so no new event can attach to it, which makes the
concat order unobservable (R1). Delivery is exactly once: `fences.delete` + `splice(0)` happen
synchronously before the microtask, and the released path passes `released`, which suppresses
re-holding. Pinned by mutations `fence-microtask` and my R5; reproduced end-to-end in probe P2
(turn then quiesce interruption → one wake, one write, `buffered 0`) and P3 (recipient gone →
nothing written, nothing leaked).

**(d) `writeDoneFromEvidence` does not change scheduler behaviour.** See the structural check
above; additionally the full head suite is green on both Nodes, which exercises the scheduler's
own deferred/stored regressions.

**(e) New holes — none found.** *Double wake:* every group agent is woken exactly once
(`residents` ∪ non-`shared` = `group.agents`, disjoint, and each agent joins exactly one group);
owner-only fencing means an event sits in at most one fence, so there is no hold→release→hold
loop. *Lost event:* the historical `recipients.length === 0` write is preserved; the only new drop
is the intended `if (released && recipients.length === 0) return` for a departed recipient
(B-M3), pinned by two gate tests and two real framework outcomes ("disposes", "loses its gate
role") that now assert **no gate write and no inference request**, not merely
`bufferedEvents === 0`. *Held forever:* a re-held fence's doors are `onInferenceEnded` →
`flushInferenceBufferIfClear` → `flushPublicationFencesIfClear`, `setQuiesced(false)` → the same,
and `dispose()`; the only way to wedge it is the pre-existing leaked-`inferring` wedge, which is
visible in `inferenceDiagnostics()` (probe P4: `buffered 1 inferring ["one"]`) and cleared by
disposal.

# Unmet criteria / test gaps

No unmet acceptance criteria. #814's criteria (seen events dropped, a fully seen batch causing no
wake, unseen events kept, red tests for the #814 case and the channel path) were met in round 1
and are not weakened: all of rounds 1–2's mutations plus round 3's 14 still fail their designated
tests, and the heartbeat/reminder lane is now covered by four real framework tests that the
`heartbeat-placement` mutation kills all four of.

Gaps, all new to round 3's own code and all narrower than the five MEDIUMs it closed:
1. **R3 survives** — the fork line's `deferLine = false` (LOW-1). The only gap whose guard, if
   removed, would lose a line rather than merely change one.
2. **R8 survives** — nothing reaches a deferred shared `WakeLine` (LOW-2). Round 2's coverage of
   this property was deliberately rewritten and not replaced.
3. **R4 survives** — the `!released?.timedOut` guard (LOW-3), plus the undiscussed
   resident/fork asymmetry on a timed-out release.
4. No test covers a `sharedRecipients[0]` that is **not** the primary resident (e.g. the primary's
   `receivesGateWakes` revoked). I satisfied myself by code reading that this is safe — residents
   share one message slot, and `heldWritesFor` / `isNewestContextEntry` / the retained round-2
   test all rely on that — but the new code's choice of write target is untested against that
   permutation.
5. Round 2's own surviving gaps N6/N7/N8 are now **closed** by this round's three new cases
   ("an event arriving with two open fences uses the older deadline", "late settlement during a
   turn cannot undo timeout wakeability", "disposal cancels the outstanding publication watchdog
   timer"), each with its own mutation. Verified from the mutation log, not from the report.

# Residual risk

- The approved trade-off is real and permanent: in a multi-resident deployment, once the
  placement owner has answered, the batch's **summary line disappears for the other residents**
  too (the retained framework test now asserts `linesFor('other').length === 0` where round 2
  asserted `1`). They keep the stored input, the wake and the provenance; they lose the
  "[Gate: N events matched]" framing. Hosts that do not supply `getSharedSlotReaders` keep the
  legacy line.
- New in this round: a fence released into a busy host is re-held with its 65-second watchdog
  already cleared, so those events are bounded by neither a deadline nor a count until
  inference/quiesce clears. Exposure is narrow — the re-hold only fires when the flush ran and
  then a turn or quiesce began within the same task, and `flushPublicationFencesIfClear` returns
  early while quiesced, so fences do not accumulate *during* a quiesce — and the hold is visible
  as `inferenceDiagnostics().bufferedEvents`. Disclosed in the changelog as "Delivery still waits
  for inference and quiesce to clear."
- The gate's new hook contract leans on `WritePlacement` implying stored content. That holds for
  every framework call site, and the type cannot name an unstored write, but a standalone host
  that fabricated a placement for unstored content could lose a quoted line. Worth one sentence
  in the `getSharedSlotReaders` doc comment if the hook is ever made public.
- Everything rounds 1–2 listed still stands: the filter only drops events for the agent that
  *owns* the placement, so non-owners keep most of #814's duplicate wakes; aggregate render
  batches (`queueCoalescedWakes`), unknown/unsafe placements and other residents' placements stay
  conservatively wakeable; #243 recipient selection and fork views are untouched.
- No live provider or production deployment was exercised by either side. MCPL coverage is a real
  loopback WebSocket with a mock model.

# Fix directions

1. (LOW-1) Gate-level test: `isNewestEntry: () => true`, recipients `['fork','resident']`,
   `shared: ['resident']`, one `mcpl:channel-incoming` event; assert a write with
   `forAgent === 'fork'`. Kills R3.
2. (LOW-2) Promote probe P1 to a test: two shared-slot residents, `isNewestEntry: () => true`,
   one unanswered addressed channel event; assert zero writes and that both wakes carry the same
   `provenance.line.entry`. Kills R8.
3. (LOW-3) Assert `writes.length === 0` on a timed-out shared release (kills R4), and either
   guard the fork branch at :3907 with `!released?.timedOut` too or say in the comment why forks
   differ.
4. (LOW-4) In the `common` filter, treat an event just pushed onto a fence as unseen by its
   owner, so the shared summary does not depend on the mid-publication answered signal the fence
   exists to distrust; or document the asymmetry at :3896.
5. (gap 4) Add a permutation where the first shared-slot gate recipient is not the primary.

None of the five is worth a fix round on its own; they are a trailing cleanup for whatever lands
next in this file.
