# Review — TASK-HJV3J, generic routing slice B (`task-hjv3j-impl` @ `02e36223`)

## Verdict

**REJECT.** The slice is otherwise strong — the slice-A seam is genuinely additive, the
unconfigured path is unchanged (verified by my own full suite plus an unmodified A/inventory
test set), the local `experimental.replyRouting` v1 profile is minimal and fails closed, and
the test suite is unusually honest about its scaffolding. But there is one confirmed
functional regression on exactly the connections the feature configures: **every framework
continuation that is queued after its logical turn has settled is silently dropped on a
`replyRouting` connection.** I reproduced it end-to-end: `autoContinue` runs 4 turns on an
unconfigured control and **1** turn with `replyRouting`, with one
`inference:request_dropped reason=reply_owner_ended`. The same code path governs `!`
prose continuations and all three rewind/unstick retries. No test covers it, and the shipped
changelog and `docs/reply-routing.md` claim the opposite ("turn ownership survive[s] …
continuations").

---

## Findings

### HIGH

**HIGH-1 (bug, unmet acceptance) — `src/framework.ts:19472`: an owned continuation is dropped whenever no turn is open, so `autoContinue`, `!` continuations and all rewind retries stop working on a `replyRouting` connection.**

`replyStartDisposition` treats "my owner turn is not the currently open logical turn" as
`'stale'`:

```ts
// src/framework.ts:19467-19475
if (work && owner !== undefined && open?.turnId !== owner) return 'stale';
```

`open?.turnId` is `undefined` when *no* turn is open, so a request stamped by
`ownedReply(routing)` is dropped rather than allowed to open a fresh bound turn. Five
framework sites stamp ownership and then push **after** `settleAgent` has already deleted
`openLogical` (`src/framework.ts:12477`):

| site | reason |
| --- | --- |
| `src/framework.ts:22334` (`autoContinueAfterTurn`) | `auto-continue` — called at `26238`, after `settleAgent` at `25865` |
| `src/framework.ts:22243` (`requestProseContinuation`) | `prose-continuation` — called at `26231`, same position |
| `src/framework.ts:25929` (`doRewind`) | `refusal-rewind-retry` / `unstick-retry` |
| `src/framework.ts:32015` (`noteInferenceExhausted`) | `inference-failure-rewind-retry` — reached via `26808`, after `settleAgent` at `26796` |
| `src/framework.ts:16980` (`tool_results_ready`) | same drop if the turn settles between push and scheduling (race, not reproduced) |

**Failure scenario (reproduced).** Probe
`$ORGASMIC_EVIDENCE_DIR/probe-autocontinue.mjs`, using the branch's own
`reply-routing.test.ts` scaffolding on the built `dist/`:

```
### autoContinue + replyRouting
membrane calls (turns): 1
publishes: [["room/one","topic:alpha","reply"]]
drops: [{"type":"inference:request_dropped","agentName":"assistant",
         "reason":"reply_owner_ended","requestCount":1}]

### autoContinue, UNBOUND control        <- identical config, requiresReplyBinding=false
membrane calls (turns): 4
drops: []
```

So an `autoContinue` agent on a configured connection answers once and then goes silent; by
the same mechanism an agent that hits a provider refusal or an exhaustion rewind never gets
its retry, leaving it mute instead of recovering. This is a behaviour difference only under
`replyRouting`, so slice A is unaffected — but it is a regression against the design, which
requires continuations to *carry* the binding (§5: "Carry the same binding and existing turn
owner through restart/setup failures and provider waits"), never to be discarded, and B's
exit condition claims continuation ownership.

**Why the suite misses it.** The branch's only witness for this branch,
`test/reply-routing.test.ts:464` ("an ended owner is dropped without borrowing a successor
or retaining provider admission"), injects a **forged** owner (`[replyOwner]: -1`) with no
open turn. That is a different scenario from a continuation whose own turn legitimately just
settled, and it locks the over-broad behaviour in. `mutation-checks.py` has no case for this
line either.

**Fix direction.** Distinguish a forged/unknown owner from a settled one. Cleanest: do not
stamp `[replyOwner]` on requests that are meant to *open* a new turn (`auto-continue`,
`prose-continuation`, `refusal-rewind-retry`, `unstick-retry`,
`inference-failure-rewind-retry`) — carry only `[replyWork]`, so `startAgentTurn:24024`
re-freezes the binding on a fresh turn — and keep `[replyOwner]` only on true in-turn
continuations (`tool_results_ready`, `context_budget_restart`, `tool_result_guard_retry`,
`TURN_RETRY`). Alternatively narrow the guard to `open && open.turnId !== owner` and reject
owner ids the framework never minted (e.g. `owner >= 1 && owner <= lastTurnId`) so the `-1`
witness still drops. Either way the carried binding is re-validated before any effect
(`channel-registry.ts:5957-5970` checks epoch, `replyBindingCurrent`, registration and the
`channels.publish` grant), so opening a new bound turn is safe. Update
`test/reply-routing.test.ts:464` and add a positive witness: a bound turn with
`autoContinue` must take its second turn into the same frozen thread. Then correct
`changelog.d/admitted-reply-routing.added.md:3` and the "logical turn id owns continuations"
paragraph in `docs/reply-routing.md`.

### MEDIUM

**MEDIUM-2 (bug, PLAUSIBLE) — `src/framework.ts:16868`: the streamless context-budget restart loses its binding and then defers forever.**

```ts
// src/framework.ts:16868  (context_budget_restart)
...ownedReply(currentState.stream ? this.replyStreamOwners.get(currentState.stream) : undefined),
// src/framework.ts:16980  (tool_results_ready) — sibling site, different fallback
...ownedReply(currentState.stream ? this.replyStreamOwners.get(currentState.stream) : this.openLogical.get(agent.name)),
```

With no live stream at the budget boundary the restart continuation is stamped with nothing.
`replyStartDisposition` then sees a bound open turn and an unowned request and returns
`'defer'` (`19474-19475`), so `processInferenceRequests` pushes it straight back
(`19538`). The turn's stream was already cancelled, so nothing settles the turn and nothing
clears `openLogical` — the continuation is re-queued on every pass and the agent wedges. The
surrounding code treats a missing `currentState.stream` as reachable (`16890`: `if (restarted
&& currentState.stream)`), but I could not construct it, so this is PLAUSIBLE rather than
confirmed. **Fix:** use the same fallback as the sibling site —
`this.replyStreamOwners.get(currentState.stream) ?? this.openLogical.get(agent.name)`.

**MEDIUM-3 (test) — `test/routing-runtime-has-no-connector-literals.test.ts:13-132`: B's new runtime routing module is outside the architecture gate.**

The `inherited` map is a fixed eight-file list; `src/mcpl/reply-routing.ts` (105 lines, the
module that mints and validates every binding) and the modified `src/gate/event-gate.ts` are
not in it. Design §6 scopes the gate to "all runtime modules on these paths, new or existing,
including their runtime dependency closure". The report's claim that the inventory ceiling is
unchanged is true, but it is unchanged partly because the new module was never added. I read
both files: they are clean today, so this is coverage, not a live literal. **Fix:** add
`"src/mcpl/reply-routing.ts": {}` and a `"src/gate/event-gate.ts"` entry with its current
counts.

### LOW

**LOW-4 — `src/framework.ts:19469,19471,32015`: three new optional chains on definitely-initialized fields, which make the ownership check fail *open*.**
`this.openLogical` and `this.turnRouting` are non-optional class fields
(`src/framework.ts:3808,3770`); base had zero `openLogical?.` / `turnRouting?.` uses. The
three new ones exist only so `Object.create(AgentFramework.prototype)` harnesses
(`test/inference-exhaustion-rewind.test.ts:55`) keep working — that is what `02e36223`
fixed. The cost is that if `openLogical` were ever absent, `replyStartDisposition` returns
`'run'`, i.e. ownership silently stops being enforced. **Fix:** give the harness
`fw.turnRouting = new Map(); fw.openLogical = new Map();` and drop the `?.`.

**LOW-5 — `src/framework.ts:23253`: a `'defer'` with no trigger is reported as a drop and is not re-queued.**
`if (replyDisposition === 'defer' && trigger) … else this.emitTrace({… reason: 'reply_owner_ended' …})`.
`replyStartDisposition(name, undefined)` returns `'defer'` (not `'stale'`) when a bound turn
is open, so the `else` emits a wrong reason and the start vanishes without re-queue.
Unreachable today — every `startAgentStream` call site (`19987`, `23332`, `24547`, `25618`,
`26390`) has a trigger whenever a turn is open — but the branch is mislabelled. **Fix:**
handle `defer`-without-trigger explicitly; design §2 names the state `reply-deferred`.

**LOW-6 — `src/mcpl/inbound-admission.ts:144`: the consumer's invalid-refusal-code path is untested.**
`if (!reasons.has(consumed.reason)) throw new InvalidData();` has no witness;
`test/mcpl-post-admission.test.ts` covers `{}`, throw, timeout and cancel, but never a
returned `reason`, valid or invalid. **Fix:** add two rows (valid code → that refusal;
`'nonsense'` → `admission_invalid`).

**LOW-7 — `src/framework.ts:20908`: the explicit draft-resend republishes a bound turn's held prose at the channel root.**
`registry.publish(agentName, d.text, { serverId: destination.serverId, channelId: destination.channelId })`
passes neither `routed` nor a `binding`, so `routingRefusal`
(`src/mcpl/channel-registry.ts:5955`) does not run and the frozen `threadId` is dropped.
Design §5 treats a resend as a model-chosen explicit send, so this is arguably in-contract
and the PR body's "explicit sends retain their chosen targets" is accurate — but
`docs/reply-routing.md`'s "this feature does not add resend" understates that an *existing*
resend moves thread words to the channel root, a different audience on a threaded connector.
**Fix:** carry the draft's recorded thread, or state the behaviour in the doc.

**LOW-8 — PR body: `M1`/`M3`/`M5` are unresolvable labels upstream.**
Each question is stated inline, so nothing is hidden, but the tags reference a design document
that is deliberately not on the branch. **Fix:** drop the labels or say "(design-doc question
M1)". Otherwise the PR body is accurate: I reproduced 9,602 pass / 0 fail / 63 skip and
228/0 focused independently (below), the 64 added tests match `9665 − 9601`, the inventory
ceiling is untouched, and no existing test file was modified.

---

## Verification Gates

All gates rerun by me in this worktree at `02e36223`; no implementer receipt reused.

| Gate | Command | Result | Log |
| --- | --- | --- | --- |
| `review-node22233` | `env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0 bash -c 'set -e; node --version; npm run typecheck; npm run build; AF_TEST_CONCURRENCY=4 npm test'` | **exit 0** — Node v22.23.3, tsc clean, build clean, **9,665 tests / 9,602 pass / 0 fail / 63 skip** (matches the report exactly) | `$ORGASMIC_EVIDENCE_DIR/gate-review-node22233-01M65YA6RFM31AX1BJCRN60YT8.log` |
| `review-focused` | same wrapper, `node --test --test-force-exit --test-concurrency=4 --test-timeout=90000 dist/test/reply-routing*.test.js dist/test/mcpl-post-admission.test.js dist/test/mcpl-admission-*.test.js dist/test/mcpl-required-*.test.js dist/test/routing-runtime-has-no-connector-literals.test.js` | **exit 0** — **228 pass / 0 fail** | `$ORGASMIC_EVIDENCE_DIR/gate-review-focused-01M65YPESP3ZSMJVAB2WQ74XYC.log` |

Receipts read, not rerun: `qualified-node2212` (Node 22.12.0 leg, exit 0) and
`qualified-mutations` (exit 0). I reviewed `mutation-checks.py` directly rather than
re-executing it.

Probes (production paths, both outside the tracked tree, in `$ORGASMIC_EVIDENCE_DIR`):

- `probe-autocontinue.mjs` — **confirms HIGH-1.** Three runs on the built `dist/`: bound
  baseline (1 turn, correct frozen thread), bound + `autoContinue` (1 turn, one
  `reply_owner_ended` drop), unbound + `autoContinue` control (4 turns, no drops).
- `probe-debounce-lines.mjs` — **negative result, no finding.** Real stdio `reply-routing-server.mjs`
  peer, debounce gate, two admitted roots. Routing is correct (`["topic:one","topic:two"]`,
  two separate turns), and both turns seeing both messages' text is the pre-existing
  single-agent shared-window behaviour, not a routing leak. I had suspected the
  `wakeLines` duplication at `src/framework.ts:4864` was a cross-root leak; it is not.

Other checks: `git status --porcelain` clean before and after; `git diff --check
119cb866..HEAD` clean; all nine commits authored and committed as Vasyl Dovhanchyn with the
`Co-Authored-By: GPT-6-Astra` trailer; `git diff --name-only 119cb866..HEAD -- test/` shows
**only new files** — no A, admission or inventory test was touched.

### Focus areas 1–6 as assigned

1. **Slice-A seam (`505d8132`) — clean.** With `consume` undefined the only reachable change
   is a false `if (verdict.store && consume)` at `inbound-admission.ts:139`; the envelope
   spread at `channel-registry.ts:1949` and `push-handler.ts:174` adds nothing and preserves
   key order. The seam runs after full verdict validation inside the same `run()` frame, so it
   shares the deadline (`163-185`), the `controller.signal` and the single
   `this.pending.delete(controller)` in `finally` — no double release. Consumer throw →
   `admission_threw` / `admission_invalid`; hang → `admission_timeout` via the `cancelled`
   race; a receipt is never recorded after abort because `142` rechecks `signal.aborted`
   before `routingReceipts.set`. The receipt lives in a module `WeakMap` keyed on the
   freshly-snapshotted verdict, so it is off the verdict's reflective and serialized shape.
   Four tests cover unset-equality, allow-only, throw/timeout and cancel/invalidate slot
   release.
2. **Ownership — correct except HIGH-1 and MEDIUM-2.** Freezing at `24023-24030`, trigger
   channel and locus from `reply.destination` (`24083`, `24111`), repin guard (`21710`),
   `channel_open` guard (`36496`), coordinator/all-except guard (`36916`), both sleep
   announcement routes (`37179`, `37189`), the `routingRefusal` re-checks before resolve,
   before open and before send with `boundEntry`/`boundDescriptor` identity
   (`channel-registry.ts:5957-6129`), stale-epoch and replaced-registration refusal
   (`framework.ts:34815-34825`). Explicit `channel_publish` is untouched (`routed` unset) and
   asserted not to inherit the thread. Only `deliverSpeech`/`routeSpeech` reach the routed
   publish, and every caller passes the binding.
3. **Unconfigured connections — unchanged.** Every new branch degenerates when
   `replyRouting` is absent: `workOf` → `[]`, `carryWork`/`ownedReply` → `{}`,
   `sameWork` → `true`, `pendingRequestKey` → the original `base` string, the new scheduler
   block is gated on `openLogical…?.reply || requests.some(workOf)`, and `publish`'s
   `routingRefusal` short-circuits on `!target.routed && !peer?.requiresReplyBinding`. The
   `02e36223` rewind fix is correct but is a test-harness accommodation (LOW-4). Evidence:
   full suite 0 fail with no existing test modified.
4. **Protocol profile — minimal, safely negotiated, clearly local.** Offered only when
   `threaded` (`server-connection.ts:1389-1391`), one field (`publishThreadId`), no typing
   promise; absent/partial/`version:2`/`publishThreadId:false` all reject with
   `initialize_attestation_refused` (`1473-1479`), which `connectWithReconnect:1617` and
   `reconnectOnce:2190` both treat as terminal. `initializeExtensions` is deep-detached by
   `routingData` and spread *before* `mcpl` and `replyRouting`, with both keys rejected at
   config time (`protocol-family.ts:706-710`). The config is snapshotted before the first
   dial and stored on the connection (`1305`), so a host mutation cannot change the profile
   across a reconnect. The transport test asserts the exact wire offer and that `replyIntent`
   never appears in any publish. No connector literal in any new code (I read
   `reply-routing.ts` and the `framework.ts`/`channel-registry.ts` hunks) — but see
   MEDIUM-3 for the gate's blind spot.
5. **Test quality — high.** Spot-checked rows 7, 8, 12, 14, 15, 16, 17/18, 22/O5, N3/N4 and
   the collision/epoch row. They drive real paths, not shims: row 7 mutates the raw root
   inside a hooked `cm.compile`; row 8 calls the real `repinTurnLocus`; row 12 fails a real
   compile under a real `errorPolicy` retry; row 15 executes the real `channel_open` tool;
   row 16 asserts the production `inference:stream_restarted` trace, three streams and both
   destinations; N3/N4 compare the predicates directly with separator-bearing opaque ids plus
   structural tuple-component assertions and an epoch rebind, then exercise the quiesce path.
   The transport file uses a real stdio peer and asserts the real `initialize` params.
   Scaffolding (`openLogical.set`, host-side `targetAgents` fanout) is labelled where used.
   The ten mutations are meaningful — each strips one guard, binding argument or key
   component and requires an `ERR_ASSERTION`, explicitly excluding module/transform/syntax
   errors. Gaps: no mutation or realistic witness for the `'stale'` branch (HIGH-1), and
   LOW-6.
6. **PR body — accurate, with one nit.** Numbers, counts, scope limits, the disclosed
   additive-seam note and the "Not verified / Out of scope" section all check out against my
   own runs; no internal names. Only LOW-8 (unresolvable `M1`/`M3`/`M5` labels). It does not
   over-claim, but its continuation bullet and the changelog inherit HIGH-1's inaccuracy.

---

## Unmet Criteria / test gaps

- **Unmet (§7 slice-B exit, continuation ownership):** post-turn continuations are dropped
  rather than carried — HIGH-1. Rows 12/14/16 and the N-witnesses prove *in-turn* carriage
  only; nothing exercises `autoContinue`, `!` prose continuation, `refusal-rewind-retry`,
  `unstick-retry` or `inference-failure-rewind-retry` under `replyRouting`.
- `test/reply-routing.test.ts:464` encodes the ended-owner drop with a forged `[replyOwner]:
  -1` and no open turn; it does not distinguish a forged owner from a settled one, so it
  passes while HIGH-1 is live.
- `src/mcpl/reply-routing.ts` and `src/gate/event-gate.ts` are outside the connector-literal
  architecture gate (MEDIUM-3).
- No witness for the streamless `context_budget_restart` fallback (MEDIUM-2) or for the
  consumer's invalid-refusal-code validation (LOW-6).
- Rows 4, 5, 11, 13, 20, 21 and 23–34 are out of slice B's assigned scope (C/D) and are
  correctly not claimed.

## Residual Risk

- Typing is slice C, and the profile deliberately omits `typingThreadId`: on a threaded
  connector the typing indicator shows at the **channel root** while the reply lands in the
  thread. Correct per O3/scope, but visible to users at deployment.
- Not qualified against upstream `main`, which the implementer recorded as having moved to
  `48f26ce5`. Qualification is against the requested slice-A base only, so a rebase can
  surface new interactions — most plausibly around the five continuation sites in HIGH-1.
- `experimental.replyRouting` v1 is an unaccepted local agreement (M1); the `4096`-code-unit
  thread bound is asserted twice (`reply-routing.ts:94`, `channel-registry.ts:5968`) but is
  not a negotiated limit.
- Host resolvers are trusted policy and run inside the admission deadline; cancellation
  cannot roll back a side effect inside one. Documented, not enforced.
- `PublishDestination.threadId` and `ChannelsPublishParams.threadId` are new public optional
  fields; `routing.locus`/`triggerChannel` now sometimes carry a `threadId` that ordinary
  `ChannelRef` consumers ignore. Benign today; a future consumer that structurally compares
  `ChannelRef` objects could be surprised.
- No live connector/provider qualification, no durable reply recovery, no cross-epoch
  reauthorization — all correctly out of scope and stated.

## Fix Directions

1. **HIGH-1 (blocking).** Stop stamping `[replyOwner]` on turn-*opening* continuations
   (`framework.ts:22243`, `22334`, `25929`, `32015`) — carry `[replyWork]` only — or narrow
   `19472` to `open && open.turnId !== owner` plus a minted-owner-id check so the `-1`
   witness still drops. Rework `test/reply-routing.test.ts:464` and add a positive witness
   (bound turn + `autoContinue` → second turn into the same frozen thread; bound turn +
   forced rewind → the retry runs). Then align
   `changelog.d/admitted-reply-routing.added.md:3`, the "logical turn id owns continuations"
   paragraph in `docs/reply-routing.md`, and the PR body's second Changes bullet.
2. **MEDIUM-2.** `src/framework.ts:16868` → `this.replyStreamOwners.get(currentState.stream)
   ?? this.openLogical.get(agent.name)`, matching `16980`.
3. **MEDIUM-3.** Add `"src/mcpl/reply-routing.ts": {}` and a `"src/gate/event-gate.ts"` entry
   to `test/routing-runtime-has-no-connector-literals.test.ts:13`.
4. **LOW-4.** Initialize `turnRouting`/`openLogical` in
   `test/inference-exhaustion-rewind.test.ts:55` and remove the three new `?.`.
5. **LOW-5/6/7/8.** Label the triggerless defer correctly; add the two consumer-refusal-code
   rows; decide and document the draft-resend thread behaviour; drop or expand the
   `M1`/`M3`/`M5` labels.

Items 2–5 are small and could land with item 1 in one follow-up round.
