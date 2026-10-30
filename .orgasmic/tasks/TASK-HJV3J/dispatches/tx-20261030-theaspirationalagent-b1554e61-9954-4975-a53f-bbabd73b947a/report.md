# Review round 2 — TASK-HJV3J, generic routing slice B rebased on #906 (`ce5e4e88`)

## Verdict

**APPROVE.**

All five bot Mediums are really fixed: I killed each one with my own mutations in an
untracked copy of the head tree (8 mutations, 8 kills — `mutation-log.md`), and I
independently reproduced the report's one *corrective* claim about M5 (the pre-M5 suite
already caught thread-support removal, and did **not** catch the ungranted check).
The rebase is faithful: `git range-diff 66c9db3f..20610f0c c848977f..f7280f83` shows ten
`=` pairs, four import/export-context conflicts, and the one approved removal/addition
pair; A's semantics are untouched — zero existing test files modified, and
`src/mcpl/inference-router.ts` is **byte-identical to A** at the head (commit `7f764d7e`
added the routing check and the M2 commit `08ab556d` removed it again, net zero).
The four engineering calls match their approvals. One MEDIUM (a bound continuation that
is dropped without ending its turn) and six LOWs, none blocking; the MEDIUM's state I
could only build by hand.

---

## Findings

### HIGH

None.

### MEDIUM

**MEDIUM-1 (correctness) — `src/framework.ts:19628` and `src/framework.ts:23321`: a
`continuesTurn` request dropped as `reply_owner_ended` never ends its turn, leaving the
turn token held.**

A's own drop path two branches earlier is explicit about this:

```ts
// src/framework.ts:19617-19619
if (requests.some(continuesTurn)) {
  this.endContinuedTurn(agentName, { kind: 'dropped', why: 'its agent is gone' });
}
```

The new ownership branch drops with a trace only:

```ts
// src/framework.ts:19628
else if (disposition === 'stale') this.emitTrace({ type: 'inference:request_dropped', agentName, reason: 'reply_owner_ended', requestCount: 1 });
// src/framework.ts:23321
else this.emitTrace({ type: 'inference:request_dropped', agentName: agent.name, reason: 'reply_owner_ended', requestCount: 1 });
```

`context_budget_restart` and `tool_result_guard_retry` are exactly the two
`continuesTurn` reasons (`src/framework.ts:1218,1312`) *and* exactly the reasons that
carry `[replyOwner]` via `ownedReply` (`src/framework.ts:16917`, `25683`). A bound one
whose `openLogical` entry has gone or changed `turnId` therefore takes the `'stale'`
branch and is discarded while its turn token is still held. `endContinuedTurn`
(`src/framework.ts:23595-23629`) is what releases the token, abandons the tool-result
guard, settles a waiting ephemeral run and flushes `deferredMessages`; none of that runs.

Failure scenario, reproduced by `probe-drop-leak.ts` (evidence dir) against the
production scheduler with the state set up by hand:

```
after : hasTurn= true pending= 0 activeTurnTokens= 99
drops : [{"type":"inference:request_dropped","reason":"reply_owner_ended","requestCount":1}]
turnEnd traces: []
wedge: membrane calls= 0 pending= 1 hasTurn= true
[inference-stale] agent=assistant busy (idle+turn-alive) — 1 request(s) waiting 60s
```

The agent is permanently `idle+turn-alive`: every later wake is requeued forever. This
is precisely the wedge the M3 diagnostic calls "the wedge's tell" — the M3 fix makes it
*visible*, it does not prevent it.

**Honest caveat on severity.** I built that state directly (`turnRouting` holds the
bound routing, token held, `openLogical` empty) and could **not** find a production
route to it. The resuming path re-establishes `openLogical` from `turnRouting`
(`src/framework.ts:24071-24073`), the turn-alive guard blocks a competing start, and
the ownerless post-settle routes (`prose-continuation`, `inference-failure-rewind-retry`,
refusal/unstick rewind) are covered by `test/reply-routing.test.ts:513,531` and take the
`'run'` branch. A's own `providerAdmissionClosed` return at `src/framework.ts:23327` has
the same shape, though only at shutdown. So this is a defensive gap in new code, not a
demonstrated live defect — hence MEDIUM, not HIGH, and not a block.

**Fix direction.** In both branches, before the trace, do what `19617` does:
`if (trigger && continuesTurn(trigger)) this.endContinuedTurn(agent.name, { kind: 'dropped', why: 'its admitted reply owner ended' });`

### LOW

**LOW-1 (docs/process) — `5b0c1a65`: the commit subject and body still describe the test
that the rebase replaced.**
Subject: `test(routing): cover binding and event-gate runtime vocabulary`; body: "inventory
the four existing event-gate occurrences without increasing any previously covered
ceiling". The replayed test was deliberately replaced (approved conflict resolution) with
a zero-vocabulary AST check over `src/mcpl/reply-routing.ts` **only**
(`test/routing-runtime-has-no-connector-literals.test.ts:7`); there is no event-gate
inventory and no ceiling. An upstream maintainer reading that commit will look for
coverage that is not there. The PR body states the narrowing correctly; the commit does
not. **Fix:** reword the commit (the only reword needed in the 18).

**LOW-2 (correctness, carried round-1 LOW-4, unfixed) — `src/framework.ts:19525,19623,32160`:
the ownership check fails *open* behind optional chaining on eagerly-initialised fields.**
`openLogical` and `turnRouting` are `Map<string, TurnRouting> = new Map()`
(`src/framework.ts:3844,3806`); base had no `openLogical?.`/`turnRouting?.` uses. If either
were ever absent, `replyStartDisposition` returns `'run'` and reply ownership silently
stops being enforced. The three chains exist only for
`Object.create(AgentFramework.prototype)` test harnesses. **Fix:** give those harnesses the
two maps and drop the `?.`.

**LOW-3 (test, carried round-1 LOW-6, unfixed and now measured) —
`src/mcpl/inbound-admission.ts:159`: the consumer's invalid-refusal-code guard has zero
coverage.**
I deleted `if (!reasons.has(consumed.reason)) throw new InvalidData();` and all 98
reply-routing/post-admission tests still passed (`mutation-log.md`). That guard is the only
thing stopping a post-verdict consumer from injecting an arbitrary string into A's refusal
surface. **Fix:** two rows in `test/mcpl-post-admission.test.ts` — a valid code yields that
refusal, `'nonsense'` yields `admission_invalid`.

**LOW-4 (correctness, carried round-1 LOW-5, unfixed) — `src/framework.ts:23320`: a
`'defer'` with no trigger is reported as a drop and is not requeued.**
`replyStartDisposition(name, undefined)` returns `'defer'`, not `'stale'`, when a bound
turn is open, so the `else` emits `reply_owner_ended` and the start vanishes with no
requeue. Unreachable today (every `startAgentStream` call site passes a trigger while a
turn is open), but mislabelled. **Fix:** handle `defer`-without-trigger explicitly.

**LOW-5 (docs, carried round-1 LOW-7, partly addressed) — `src/framework.ts:20975`: the
explicit draft resend republishes a bound turn's prose at the channel root.**
`registry.publish(agentName, d.text, { serverId, channelId })` passes neither `routed` nor
a `binding`, so `routingRefusal` (`src/mcpl/channel-registry.ts:5962`) is inert and the
frozen `threadId` is dropped. In-contract per design §5 (a resend is a model-chosen
explicit send) and the M4 docs now say "Explicit sends retain their separately authorized,
chosen targets" — but neither doc states that on a threaded connector an *existing* resend
moves thread words to the channel root, a different audience. **Fix:** carry the draft's
recorded thread, or say so in `docs/reply-routing.md`.

**LOW-6 (docs/process, carried round-1 LOW-8, unfixed) — the `M1`…`M5` labels are the
review chain's, not the bot's.**
Six commit subjects end in `(bot M1)`…`(bot M5)` and the BOT REPLY block is keyed on the
same labels. The upstream bot's five comments carry no such numbering, so the labels are
only inferrable from comment order. Each item is restated inline, so nothing is hidden.
**Fix:** key the reply to file:line instead (e.g. "`reply-routing.ts:69`:") or drop the tags.

**LOW-7 (observability) — `src/mcpl/channel-registry.ts:5750,5773`: the §14.3 streaming
observer surface drops the bound `threadId`.**
`PublishDestination` now carries `threadId`, and `publish()` sends it, but
`sendOutgoingChunk`/`sendOutgoingComplete` forward only `channelId`, and
`destinationKey` (`channel-registry.ts`) ignores `threadId`. A threaded connector's
stream consumer therefore sees channel-root deltas for a thread-scoped publish. Observer
surface only — the authoritative delivery is correct — and arguably out of the slice's
scope, but worth a line in the maintainer questions.

---

## Checks against the brief

**1. Rebase fidelity — confirmed.**
- `git range-diff 66c9db3f..20610f0c c848977f..f7280f83` (`range-diff-verified.txt`): pairs
  5–10 and 12 are `=`; pairs 1–4 differ only in import/export merge context (A's
  `AdmissionRefusals`, `admissionConnectErrorOf`, A's `refuse(...)` helper, A's
  `cancelled()` helper, A's restored `src/index.ts` export block); pair 11 is the approved
  removal/addition. No squash, no dropped commit, 12 → 12.
- **`eca4edad` conflict resolution verified against A directly.** A has exactly **one**
  capture site, at dispatch time inside `emit()`
  (`git show c848977f:src/mcpl/server-connection.ts:1164`); pre-rebase B had it at
  transport receipt (`20610f0c:src/mcpl/server-connection.ts:2608`). The head has exactly
  one capture site, at `src/mcpl/server-connection.ts:1169` — A's site, with the consumer
  appended. No second site was added, so routing resolution happens inside A's deadline,
  abort signal and capacity slot, and held data still enters admission only at flush.
- **Scoped AST check.** `test/routing-runtime-has-no-connector-literals.test.ts` covers
  `src/mcpl/reply-routing.ts` only, with no literal/identifier ceilings on existing
  modules — exactly the R1-5-consistent narrowing that was approved. Independent check:
  `git diff c848977f..ce5e4e88 -- src/ docs/ changelog.d/` has **zero added lines**
  matching `slack|telegram|discord|zulip|eidoverse|whatsapp` (the single hit is a
  pre-existing context comment in `event-gate.ts`). The "no connector literals"
  acceptance criterion holds regardless of the narrowed gate.
- **A untouched.** `git diff --name-status c848977f..ce5e4e88` — every `test/` entry is
  `A` (added); no existing test file modified. `git diff c848977f..ce5e4e88 --
  src/mcpl/inference-router.ts` is **empty**: byte-identical to A.
- A's 21 commits are not rewritten; `c848977f` is an ancestor of the head.

**2. The five bot Mediums and the four engineering calls.**
- Mutation table in `mutation-log.md`: 8 mutations, 8 kills. M1 (2 fails), M2 (5 fails),
  M3 (3 fails), and each of the five M5 refusal branches independently killed (2/2/3/1/2
  fails).
- **M2 scope is right.** `src/mcpl/server-connection.ts:1172` excludes exactly
  `inference-request` out of the three lanes listed at `:1156`; push and channel still
  resolve and bind. `src/mcpl/inference-router.ts` is back to A. Transport tests prove the
  resolver is never called for live *or* held inference even when it would return `null`
  or throw, and that push still resolves and publishes its bound thread.
- **M3 is diagnostic-only.** `warnStaleRequests` (`src/framework.ts:19554-19582`) is a
  verbatim extraction: same `STALE_REQUEST_MS = 30_000`, same 60 s per-agent
  `staleWarnAt` throttle shared by trace and stderr, same `!this.quiesced` suppression.
  The existing busy path is pinned by the `reply=false, token=true` row asserting
  `agentStatus === 'idle+turn-alive'`; the new path adds the `+reply-deferred` qualifier
  and the full pending snapshot. No timestamp reset, reorder, retry or drop semantics
  changed.
- **M4 matches the code.** Every automatic reply reaches `publish()` with `routed: true`
  through `deliverSpeech` (`channel-registry.ts:6241`), and `routingRefusal` refuses on
  `target.routed && (binding || peer?.requiresReplyBinding)` — so the documented blanket
  refusal of unbound automatic replies is accurate, including the heartbeat / home-channel /
  timer / module / silent-resume cases. The only unrouted `publish()` caller is the
  explicit draft resend (LOW-5).
- **M5 claims verified, including the correction.** Restoring `test/reply-routing.test.ts`
  to `059d6d25^`: deleting the thread-support guard fails 1 test (old coverage existed),
  deleting the ungranted guard fails 0 (it did not) — exactly what the report states.
- **Module-wake carriage (`ce5e4e88`) is scoped correctly.** The one production line is
  `...carryWork(event)` at `src/framework.ts:17266`, inside `applyProcessResponse`'s
  existing `requestInference` producer. `carryWork` → `workOf` reads only
  `event[replyWork]` or `event[admittedEnvelope].routing`; it never mints. Bindings are
  gated by a module-private `WeakSet` (`reply-routing.ts:19,27-29`), so a forged object
  cannot pass `isReplyBinding`. A's `wakeForbidden(event)` ceiling at `:17239` is
  untouched, so `mayWake:false` still caps module wakes. Tests: both lanes × both
  `mayWake` values over real stdio, plus a synthetic timer entering the real module
  pipeline with a scaffolded home destination that stays unbound and whose publish is
  refused. **No authority leak found.**

**3. New interactions with A.**
- *Held drain.* The transport witness
  (`test/reply-routing-transport.test.ts`, "held routing stays sequential while direct
  inference releases at provider dispatch") stalls the first resolver, injects live
  traffic mid-drain, and asserts dispatch order
  `['first','second','inference','push','live']` with four distinct bound events and the
  frozen thread list `['topic:alpha/β','topic:second',undefined,'topic:live']`.
- *Dispatch release.* Same test asserts `answered === false` while later routed items
  store — a slow direct provider call does not retain the drain.
- *Gate release.* `src/framework.ts:23319` mirrors A's `providerAdmissionClosed` branch
  (`:23328`) exactly, and `:19642` mirrors A's `:19872` `endPendingPrimary` guard.
- *Coalescing.* Required channel/push coalescing is still refused `admission_unsupported`
  before admission, with the resolver asserted at zero calls on both lanes.
- *Double replies.* `sameInferenceRequest` gains `sameWork` and `pendingRequestKey`
  returns A's exact string for unbound requests (`src/framework.ts:19518-19521`), so
  unbound coalescing is unchanged; distinct bindings get distinct keys, so no bound wake
  is absorbed by another.
- *Deadlock.* The only unbounded wait I found is a bound request deferring behind an open
  bound turn that never closes — now reported by the M3 diagnostic rather than fixed,
  which is the approved diagnostic-only scope. See MEDIUM-1 for the one drop that is not
  reported as a turn end.
- *Negative result, no finding.* I suspected `routingReceipts` (a `WeakMap` keyed on the
  host's verdict) could swap two concurrent admissions' bindings if a host returned one
  shared frozen verdict object. `probe-verdict-key.ts` disproves it:
  `inbound-admission.ts:145` re-`snapshot`s the host verdict, so the key is fresh per
  admission.

**4. BOT REPLY / PR BODY and commit hygiene.**
- All **18** commits have author *and* committer `Vasyl Dovhanchyn
  <48733736+theaspirational@users.noreply.github.com>` and the exact
  `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer.
- No internal identifier (`orgasmic`, `tarn`, `TASK-…`, `hjv3j`, `hvq8k`, `review-drop`,
  `rev-engine`, maintainer handles) appears in any commit message, in the patch content,
  or in the BOT REPLY / PR BODY blocks. No `#361` or `#233` reference in the diff.
- Test counts in both blocks are exact against receipts: base `c848977f`
  9,646/0/63/9,709 on both Nodes; head `ce5e4e88` 9,745/0/63/9,808 on both Nodes; focused
  296/296.
- `c848977f..ce5e4e88` is 18 commits, as stated.
- Residual accuracy nits are LOW-1 (commit message) and LOW-6 (M-labels).

---

## Verification Gates

| Gate | Command | Result | Log |
| --- | --- | --- | --- |
| `review-r2-full` | `env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0 bash -c 'set -e; git rev-parse HEAD; node --version; npm install --ignore-scripts --no-save; npm run clean; npm run build; npm run typecheck; AF_TEST_CONCURRENCY=4 npm test'` | **exit 0** — Node v22.23.3, install clean, `tsc` clean, typecheck clean, **9,808 tests / 9,745 pass / 0 fail / 63 skip** (matches the report and the implementer receipts exactly) | `$ORGASMIC_EVIDENCE_DIR/gate-review-r2-full-01M66FVEV45ASP8QRHEYQR1TTP.log` |

Receipts read, not rerun (all clean-tree, exit 0, at `ce5e4e88` or `c848977f`):
`head-22233-{install,typecheck,build,test}`, `head-22120-{install,typecheck,build,test}`,
`head-focused` (296/296), `head-static-audit`, and the implementer's
`base-22233-test` / `base-22120-test` (both 9,646/0/63/9,709 at `c848977f`). I
re-extracted the counts from the logs rather than trusting the report table.

Unwrapped probes (evidence dir, all outside the tracked tree, in `/tmp/hjv3j-mut` — a tar
copy of the head tree with `node_modules` symlinked):
`mutation-log.md` (8 mutations + the pre-M5 cross-check), `probe-drop-leak.ts`,
`probe-verdict-key.ts`, `range-diff-verified.txt`. Baseline in that copy: 99/99 green.

Worktree: `git status --porcelain` empty before and after my work; no commit, no edit, no
new tracked file. Only ignored `dist/` and `node_modules/` changed.

---

## Unmet criteria / test gaps

Acceptance (§7 exit condition, O5 silent-resume, no connector literals, no #361
dependency, upstream-ready commits) is met. Remaining gaps:

1. **MEDIUM-1 has no witness.** No test asserts what happens to a *bound continuation*
   whose owner has ended — the `'stale'` branch is exercised only by forged-owner
   non-continuation requests (round-2 review's `-1` / `MAX_SAFE_INTEGER` probe). A
   `context_budget_restart` row through `'stale'` would pin the fix.
2. **LOW-3**: `inbound-admission.ts:159` is uncovered (mutation survives 98 tests).
3. **LOW-4**: the `defer`-without-trigger branch at `23320` has no witness.
4. **LOW-7**: no test asserts what the §14.3 streaming surface reports for a thread-bound
   publish.
5. Round-2's **LOW-9** (3 s wall-clock poll at `test/reply-routing.test.ts:282` instead of
   `runUntilIdle`) is still there — a flake vector under suite concurrency, not a
   correctness defect.
6. No live connector/provider deployment, per the report's own residual-risk list.

---

## Residual risk

- The ownership model is enforced only through `openLogical`/`turnRouting` identity. Any
  future path that clears `openLogical` while a turn token is held converts MEDIUM-1 from
  defensive to live; the two optional chains in LOW-2 make the same check fail open.
- The approved diagnostic-only M3 scope means an indefinitely deferred bound backlog is
  *reported*, not recovered. Operators enabling `replyRouting` get a 30 s/60 s-throttled
  `idle+turn-alive+reply-deferred` line and nothing else.
- Opting in is a behaviour cliff for existing deployments: all unbound automatic speech to
  that connector stops. This is now documented (M4), but it is a config-time footgun.
- The host resolver / initialize-offer API, the local publish-only `experimental.replyRouting`
  v1 profile, the optional thread field, and the additive post-admission seam in A's
  `inbound-admission.ts` all still need maintainer agreement; the PR body lists them.
- Qualification is local, with neutral stdio peers and mock model responses.

---

## Fix directions

1. **MEDIUM-1** — in both `'stale'` branches (`src/framework.ts:19628`, `:23321`), call
   `endContinuedTurn(agentName, { kind: 'dropped', why: 'its admitted reply owner ended' })`
   when the dropped request satisfies `continuesTurn`, mirroring `:19617`. Add a
   `context_budget_restart`-through-`'stale'` row.
2. **LOW-1** — reword `5b0c1a65` to describe the AST check it actually contains.
3. **LOW-2** — initialise `openLogical`/`turnRouting` in the `Object.create` harnesses and
   drop the three `?.`.
4. **LOW-3/LOW-4/LOW-7** — add the three missing witnesses.
5. **LOW-5/LOW-6** — one sentence in `docs/reply-routing.md` about the resend's thread
   loss; key the BOT REPLY to `file:line` rather than `M1`…`M5`.

None of these blocks publication. 1–3 are cheap and worth doing before the maintainer
round; 4–5 can ride a follow-up.
