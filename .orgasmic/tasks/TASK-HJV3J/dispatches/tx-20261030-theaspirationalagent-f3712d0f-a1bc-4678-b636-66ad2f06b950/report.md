# Review round 2 — TASK-HJV3J, generic routing slice B fix round 1 (`task-hjv3j-impl` @ `7acacf17`)

## Verdict

**APPROVE.**

HIGH-1, MEDIUM-2 and MEDIUM-3 from round 1 are resolved. I re-ran my own round-1
`autoContinue` probe on the new `dist/` and it now takes **4 turns with 0 drops**, every
publish into the frozen `topic:alpha` — identical turn count to the unbound control (round 1:
1 turn, 1 `reply_owner_ended` drop). A new production-path probe confirms the two properties
the fix could plausibly have broken: an ownerless post-turn work request neither borrows
another admitted cause's turn nor escapes its own frozen destination, and forged/unknown
owners (`-1`, `Number.MAX_SAFE_INTEGER`) still drop. I independently reproduced all four
assigned gates at the clean head: typecheck/build clean and **9,674 tests / 9,611 pass /
0 fail / 63 skip** on Node v22.23.3, and **237/237** focused. Commits are authored and
committed as Vasyl Dovhanchyn with the GPT-6-Astra trailer; the worktree was clean before and
after my work.

One new LOW (a 3-second wall-clock poll replacing `runUntilIdle` in the budget test). It is a
flake vector, not a correctness defect, and does not block.

---

## Findings

### HIGH

None.

### MEDIUM

None.

### LOW

**LOW-9 (test, new this round) — `test/reply-routing.test.ts:282`: the budget-restart witness
asserts after a fixed 3-second wall-clock budget instead of waiting for the framework to
drain.**

```ts
// test/reply-routing.test.ts:281-282
x.framework.start();
for (let i = 0; i < 300 && (x.membrane.calls.length < 3 || x.publishes.length < 2); i++)
  await new Promise(r => setTimeout(r, 10));
```

Round 1's version of this test used `await x.framework.runUntilIdle()`. The switch was made
because, *before* the MEDIUM-2 fix, the missing-owner variant deferred forever and
`runUntilIdle` spun to the harness timeout (`round1-red.log`) — so the red evidence became an
assertion failure rather than a timeout. That was the right call for the red phase, but the
green test is now time-bounded: on a slow or heavily loaded run the loop exits early and the
`deepEqual` on `x.publishes` fails with a confusing diff rather than a timeout. Measured
headroom is comfortable (**197 ms** and **189 ms** against the 3,000 ms budget, per
`gate-round1-focused-…log:1384,1397`; my own `review2-focused` run reproduces the same), so the
risk is low — but the suite runs 9,674 cases at `AF_TEST_CONCURRENCY=4` under a 16 G cgroup,
where tail latencies are not bounded by the measured median.

**Fix direction.** Now that the fallback is in place, `runUntilIdle` terminates for both
variants — restore it, or keep polling but raise the bound to the file's `--test-timeout`
order (e.g. 6,000 iterations) so a slow machine times out visibly instead of asserting on a
partial result.

### Deferred (not re-raised)

LOW-4 through LOW-7 are deliberately out of this round's scope. I checked that none became
worse:

- **LOW-4** — the fix adds `this.openLogical.get(agent.name)` at `src/framework.ts:16868`
  *without* a new optional chain, and does not add any further `openLogical?.` /
  `turnRouting?.` use. Count of new fail-open chains is unchanged at three.
- **LOW-5** — `src/framework.ts:23253` untouched; the triggerless-`defer` branch is still
  mislabelled and still unreachable.
- **LOW-6** — `src/mcpl/inbound-admission.ts` unchanged this round (`git diff 02e36223..HEAD`
  touches no `src/mcpl` file).
- **LOW-7** — `src/framework.ts:20908` untouched.

---

## Verification of the three resolved findings

### HIGH-1 — resolved

**The fix.** `src/framework.ts:1517` introduces `replyForNextTurn(routing)`, which carries only
`[replyWork]`; `ownedReply` at `:1521` is now `{...replyForNextTurn(routing), [replyOwner]:
routing.turnId}`. The four turn-*opening* producers switch to `replyForNextTurn`:

| site | reason | continuesTurn? |
| --- | --- | --- |
| `src/framework.ts:22248` | `prose-continuation` | no |
| `src/framework.ts:22339` | `auto-continue` | no |
| `src/framework.ts:25935` | `refusal-rewind-retry` / `unstick-retry` | no |
| `src/framework.ts:32020` | `inference-failure-rewind-retry` | no |

I verified the classification directly rather than by name: `continuesTurn`
(`src/framework.ts:1282`) is `resumesLogicalTurn(reason) || isTurnRetry(request)`, and
`resumesLogicalTurn` (`:1188`) is exactly `context_budget_restart | tool_result_guard_retry`.
None of the four reasons qualifies, so each genuinely opens a fresh turn at
`startAgentTurn:24021-24030` rather than resuming a settled one. I also confirmed each of the
four pushes is positioned after the turn settles — e.g. `doRewind` at `:25932` runs inside the
refusal block that begins **after** `this.settleAgent(..., streamRouting)` at
`src/framework.ts:25870`.

I enumerated every remaining `ownedReply(` call site to confirm nothing post-turn was missed:
`:16868` (`context_budget_restart`, in-turn), `:16985` (`tool_results_ready`, pushed mid-stream
with the turn live), `:25624` (`tool_result_guard_retry`, in-turn), and `:24034`/`:24037`
(the re-stamp onto the trigger once the fresh turn has opened). The list is complete.

**Carriage into the same frozen destination.** `startAgentTurn:24029-24032` sets
`routing.replyWorks`/`routing.reply` from `workOf(trigger)` when `opensTurn`, then `:24083`
and `:24111` take `routing.reply.destination` for `triggerChannel` and `locus`. So the fresh
turn re-freezes the carried binding, and `Object.assign(trigger, ownedReply(routing))` at
`:24034` re-stamps the *new* turn id.

**Probe — `$ORGASMIC_EVIDENCE_DIR/probe-autocontinue.mjs`** (byte-identical copy of my round-1
probe, rerun against the rebuilt `dist/`):

```
### autoContinue + replyRouting
membrane calls (turns): 4
publishes: [["room/one","topic:alpha","reply"] ×4]
drops: []
### autoContinue, UNBOUND control
membrane calls (turns): 4
drops: []
RESULT: autoContinue second turn ran = true | reply_owner_ended drops = 0
```

Round 1 produced `turns: 1` and one `reply_owner_ended` drop on the bound leg. The bound and
unbound legs now agree on turn count, and every bound publish carries the frozen thread.

**Probe — `$ORGASMIC_EVIDENCE_DIR/probe-ownerless-isolation.mjs`** (new; the two properties the
brief asks about):

```
### (a) ownerless work-A (auto-continue) + bound work-B wake, queued together
turns: 2  turnIds: [1,2]
publishes: [["endpoint-a","room/one","topic:A"],["endpoint-b","room/other","topic:B"]]
drops: []
### (b) forged owner -1          -> turns: 0, publishes: [], drops: [reply_owner_ended ×1]
### (b) forged owner 9007199254740991 -> turns: 0, publishes: [], drops: [reply_owner_ended ×1]
```

(a) proves no borrowing and no escape: two distinct turn ids, each publishing only into its own
frozen destination, with no cross-contamination and no drop. (b) proves the stale-owner guard
is intact for both a negative and an unminted-positive id.

**Why no new escape path exists** (read of `replyStartDisposition`, `src/framework.ts:19472-19480`).
For an ownerless work request:
- no turn open → `'run'` → `startAgentTurn` opens a fresh turn and freezes the carried binding;
- a turn open (bound or unbound, same work or different) → `owner === open.turnId` is false, so
  `'defer'` → re-queued at `:19538`. It never joins a successor's turn.
The scheduler's batch selection (`:19551`) still partitions by `sameWork(first, r)`, and
`sameWork` (`src/mcpl/reply-routing.ts:47`) compares `workId` identity, so a deferred
continuation cannot merge with an unrelated wake. A deferred request is re-driven by
`runLoop`'s 10 ms poll (`src/framework.ts:16270-16310`), so deferral cannot wedge.

**Tests.** Four new cases, all real-path:
- `test/reply-routing.test.ts:491` — real `autoContinue: { maxConsecutive: 1 }` agent config,
  real `runUntilIdle`; asserts 2 membrane calls, **distinct** `turnId`s, object-identical
  `routing.reply`, and both publishes into `topic:alpha/β`. It also calls
  `registry.noteDelivered(at('room/other'), 'later', 'topic:later')` inside the hooked
  `cm.compile`, so an escape to a later default would be caught.
- `test/reply-routing.test.ts:513` (×2) — real `refusalHandling: { autoRewind: true }` with a
  real `'refusal'` response; the forced/unstick variant installs only `forcedRewind`, the
  refusal, history shed, request creation and retry all run production code. Asserts the
  retry runs and the recovered answer publishes in the frozen thread.
- `test/reply-routing.test.ts:531` (×2) — prose-continuation and exhaustion. These invoke the
  production producers (`requestProseContinuation`, three real `noteInferenceExhausted` calls)
  directly after a real bound turn has settled, with the prose flag installed as declared
  scaffolding. Weaker than the first two (see test gaps), but the assertions are behavioural:
  queued `[replyOwner] === undefined`, work identity preserved, then a real `runUntilIdle` that
  produces a second turn with a new `turnId` publishing into the frozen thread.
- `test/reply-routing.test.ts:468` (×2) — replaces the misleading "ended owner" title with
  explicit forged (`-1`) and unminted (`MAX_SAFE_INTEGER`) owner rows, retaining the
  successor-protection and provider-admission-cleanup assertions.

**Docs/changelog.** `docs/reply-routing.md:69-77` and
`changelog.d/admitted-reply-routing.added.md:3-7` now distinguish in-turn owner retention from
post-turn work carriage and are accurate against the code I read.

### MEDIUM-2 — resolved

`src/framework.ts:16868` now reads
`ownedReply((currentState.stream ? this.replyStreamOwners.get(currentState.stream) : undefined) ?? this.openLogical.get(agent.name))`,
matching the sibling at `:16985`. I confirmed `replyStreamOwners.set(stream, streamRouting)` at
`src/framework.ts:24756` runs unconditionally for every stream, so in production the map entry
is always present and the fallback is defensive — which is why the implementer's reachability
note (a truly streamless restart cannot cross the guards at `:16693`/`:16716`) holds, and why
the witness injects the missing entry instead of faking a streamless state. That is an honest
disclosure, not a shim: the deletion happens inside a real `handleToolCall` at a real budget
boundary, and the `budget-owner-fallback` mutation (reverting the `??`) makes it fail.

The pre-fix behaviour I could not confirm in round 1 is now confirmed by the implementer's own
red log: the missing-owner variant was the one case that hung `runUntilIdle` to the harness
timeout, i.e. the `defer` → re-queue wedge I described (`round1-red.log`,
`round1-red-bounded.log:11` `not ok 1`).

### MEDIUM-3 — resolved, and tighter than asked

`test/routing-runtime-has-no-connector-literals.test.ts:125-131` adds
`"src/gate/event-gate.ts"` (four entries) and `"src/mcpl/reply-routing.ts": {}`. The test
iterates `Object.entries(inherited)`, so adding a key genuinely adds a scanned file; the gate
now covers 11 modules. I verified independently with
`$ORGASMIC_EVIDENCE_DIR/count-gate.mjs` (same AST walk, same vocabulary regex) that the
declared ceilings are **exact**, not padded:

```
src/gate/event-gate.ts   TemplateElement:…{"source": "discord"} 1, StringLiteral:"discord" 1,
                         StringLiteral:"discord:*:12345" 1, StringLiteral:discord 1
src/mcpl/reply-routing.ts  (none)
```

I also confirmed all four event-gate occurrences are **pre-existing**: `git show
119cb866:src/gate/event-gate.ts` has the same ten `discord` lines as HEAD, and B's only change
to that file is a 6-line addition elsewhere. No existing ceiling was relaxed (`git diff
02e36223..HEAD -- test/routing-runtime-has-no-connector-literals.test.ts` is purely additive).

### Mutation cases — meaningful

I read `mutation-checks.py` (copy in the reviewed evidence dir). The harness asserts each
`before` string occurs exactly once, requires `ERR_ASSERTION` in the output while explicitly
excluding `ERR_MODULE_NOT_FOUND`/`TransformError`/`SyntaxError`, and restores the file in a
`finally`. A zero-match `--test-name-pattern` would exit 0 and be reported as
`UNEXPECTED RESULT`, so a pattern typo cannot pass silently. The three new cases each remove a
distinct guard this round introduced:

- `new-turn-owner` — re-stamps `ownedReply` onto auto-continue → the fresh-turn witness fails.
- `unknown-owner` — deletes the `'stale'` branch entirely → the forged-owner witness fails.
- `budget-owner-fallback` — drops the `??` → the missing-owner budget witness fails.

All 13 produced their intended assertion failure
(`gate-round1-mutations-01M65ZG6B2C2BTKYHS7V6J7WS3.log`). Residual: only the auto-continue site
is mutated; the prose/rewind/exhaustion sites rely on their witnesses alone.

### PR body

Accurate against my own runs and clean of internal names. I grepped the `BEGIN PR BODY` …
`END PR BODY` block for `orgasmic|hjv3j|slice|reviewer|dispatch|worktree|tarn|O5|§7|M1|M3|M5`
— zero hits. LOW-8 is resolved: the three maintainer questions are now stated directly with no
bare design-document labels. Claim-by-claim:

| Claim | Verified |
| --- | --- |
| "9,611 passed, 0 failed, 63 skipped" | **yes** — my `review2-node22233` run: 9,674 tests / 9,611 pass / 0 fail / 63 skip |
| "base: 9,538 passed, 0 failed, 63 skipped" | consistent with the pinned-base logs cited in the fix report; not rerun by me |
| "Focused … 237 passed, 0 failed" | **yes** — my `review2-focused` run: 237/237 |
| "Thirteen mutation checks" | **yes** — 13 cases in `mutation-checks.py`, 13 intended failures in the receipt |
| "In-turn retries, tool continuations and budget restarts retain their logical owner; auto-continue, prose continuations and rewind retries carry admitted work into a fresh turn with the same frozen destination" | **yes** — matches the call-site audit and both probes |
| "Cover the private binding module and event gate in the connector-literal architecture inventory without relaxing existing ceilings" | **yes** — additive diff, exact ceilings |
| "typecheck and build pass on both Node 22.23.3 and 22.12.0" | 22.23.3 **reproduced by me**; 22.12.0 read from the receipt, not rerun |

One readability nit, not a finding: "Confirm the focused existing silent-resume regression
without adding a recovery or simultaneous-start contract" will not be self-explanatory to a
maintainer with no design document. Naming the behaviour in one clause would help.

---

## Verification Gates

| Gate | Command (after the shared wrapper) | Result | Log |
| --- | --- | --- | --- |
| `review2-node22233` | `bash -c 'set -e; node --version; npm run typecheck; npm run build; AF_TEST_CONCURRENCY=4 npm test'` | **exit 0** — Node v22.23.3, `tsc --noEmit` clean, build clean, **9,674 tests / 9,611 pass / 0 fail / 63 skip**, 389 s | `$ORGASMIC_EVIDENCE_DIR/gate-review2-node22233-01M6605T7SM3AK90P7B55FZZ8E.log` |
| `review2-focused` | `node --test --test-force-exit --test-concurrency=4 --test-timeout=90000 dist/test/reply-routing-core.test.js … dist/test/routing-runtime-has-no-connector-literals.test.js` (the brief's 11-file list) | **exit 0** — **237 tests / 237 pass / 0 fail** | `$ORGASMIC_EVIDENCE_DIR/gate-review2-focused-01M660J7GCHNDEJZ6RC7YXQ592.log` |

Wrapper for both: `orgasmic dispatch gate <name> -- env XDG_RUNTIME_DIR=/run/user/1002
systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0 …`. Both recorded
`HEAD 7acacf170bb017e9bc3a1a548c21150e7a07e412 clean=yes`. My counts match the implementer's
exactly on both gates.

Receipts **read, not rerun** (the brief named only the Node 22.23.3 and focused legs):
`round1-node2212` (Node 22.12.0, exit 0, same 9,674/9,611/0/63) and `round1-mutations`
(exit 0, 13 intended failures). I reviewed `mutation-checks.py` by hand instead of
re-executing it; re-running it would require mutating tracked files in a shared worktree.

Probes (both in `$ORGASMIC_EVIDENCE_DIR`, nothing written inside the tracked tree):

- `probe-autocontinue.mjs` — round-1 probe rerun on the new `dist/`; **HIGH-1 confirmed fixed**.
- `probe-ownerless-isolation.mjs` — new; no borrowing, no binding escape, forged/unknown owners
  still dropped.
- `count-gate.mjs` — independent AST count confirming the new inventory ceilings are exact.

Other checks: `git status --porcelain` empty before and after; `git diff --check
02e36223..HEAD` clean; both new commits authored **and** committed as
`Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` with
`Co-Authored-By: GPT-6-Astra`; `git diff --name-only 02e36223..HEAD` touches no `src/mcpl`
file, so slice A's admission implementation is untouched this round.

---

## Unmet Criteria / test gaps

No unmet acceptance criterion. Remaining gaps, all disclosed by the implementer:

- `prose-continuation` and `inference-failure-rewind-retry` have **no end-to-end** witness: the
  test installs `routing.continuation = true` and calls `requestProseContinuation` /
  `noteInferenceExhausted` directly rather than driving a real `!` parse or a real classified
  `invalid_request` provider failure. The scheduler and carriage halves are real; the
  *producer trigger* is not. (`auto-continue` and both rewind flavours are fully end-to-end.)
- Only the auto-continue site has a mutation; the other three changed sites are protected by
  witnesses alone.
- No witness for the post-turn-continuation **deferral** path (ownerless work queued while an
  unrelated turn is open). I covered it with
  `probe-ownerless-isolation.mjs`, but nothing in the suite locks it in; a future change that
  turned that `'defer'` into `'run'` would let a continuation join a stranger's turn and only
  my probe would notice.
- LOW-9's time-bounded assertion in the budget witness.
- Carried over, unchanged: no witness for the consumer's invalid-refusal-code validation
  (LOW-6), none for the triggerless-`defer` branch (LOW-5).

## Residual Risk

- **Unchanged from round 1** and still accepted: typing is slice C, so on a threaded connector
  the indicator shows at the channel root while the reply lands in the thread; qualification is
  against the pinned slice-A base (`119cb866`), not upstream `main` (`48f26ce5`);
  `experimental.replyRouting` v1 is an unaccepted local agreement; host resolvers are trusted
  policy running inside the admission deadline; `PublishDestination.threadId` is a new public
  optional field that structural `ChannelRef` comparators could be surprised by.
- **Narrowed by this round:** the `tool_results_ready` site (`src/framework.ts:16985`) still
  stamps the owner and would still drop if its turn settled between push and scheduling. I
  re-read the path and it is pushed mid-stream with the turn live, so I could not construct it
  in round 1 or round 2 — but it is the one remaining instance of the HIGH-1 shape.
- A post-turn continuation whose binding has gone stale (transport epoch bump, channel
  deregistration) now opens a fresh turn and is then refused at publish, so the agent goes
  mute rather than falling back to a default destination. That is the intended fail-closed
  design, but it is the user-visible consequence of the fix and is not stated in
  `docs/reply-routing.md`.
- `docs/reply-routing.md:71-75` says post-turn continuations "carry the admitted work into a
  fresh logical turn" without mentioning that they *wait* when another turn is open. Accurate
  as far as it goes; incomplete.

## Fix Directions

1. **LOW-9 (non-blocking).** `test/reply-routing.test.ts:282` — restore
   `await x.framework.runUntilIdle()` (it terminates now that the fallback exists), or raise the
   poll bound so a slow machine times out visibly instead of asserting on a partial result.
2. **Optional hardening.** Add a mutation that flips `'defer'` to `'run'` for the ownerless-work
   case in `replyStartDisposition` (`src/framework.ts:19479`), backed by a witness equivalent to
   `probe-ownerless-isolation.mjs` case (a) — an ownerless continuation and an unrelated
   admitted wake queued together must produce two turns with no cross-publication.
3. **Optional doc.** One sentence in `docs/reply-routing.md` on the two post-turn behaviours a
   reader will hit: a continuation waits while another turn is open, and a continuation whose
   binding went stale is refused at publish rather than redirected.
4. **Deferred, unchanged.** LOW-4 through LOW-8 as written in round 1; LOW-8 (PR-body labels) is
   already resolved.
