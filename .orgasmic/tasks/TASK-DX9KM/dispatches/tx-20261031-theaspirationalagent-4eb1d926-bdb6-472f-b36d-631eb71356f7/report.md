# TASK-DX9KM — LOW-1 fix, static delta review (round 2)

Delta `0bba1e8b..54ebfc58` on `unqualified-local-abdi7-20261031`. READ-ONLY, UNQUALIFIED, LOCAL ONLY.
Operator Tarn; qualifier Soma. No owner decision involved.

**NO BUILD / TEST RUN.** No npm, bun, node, tsc, build, typecheck, test, install, network, or mutant
execution. Every claim below is static source reading plus `git show`/`git diff`/`git log`. The worktree
was left exactly as found: `git status --porcelain` empty, HEAD still `54ebfc58`, no commits, refs,
edits or new files inside the tracked tree.

Input shas verified first, both match:
- `/srv/review-drop/TASK-DX9KM-LOW1-FIX1.md` → `3dfb044576ad68fb89c9a6d7d9d068a10e5ced2231bac27d785e223903b9fd0a`
- `/srv/review-drop/TASK-DX9KM-REVIEW1.md` → `329fe9ef580aa5718c320cc7ff76e1400d1bf3a37db2893203ec9fd1b89f0e69`

## Verdict

**APPROVE (static).** The fix does what the brief authorises and nothing more. The new conjunct reads
only the host's validated applied plan; the plan threads intact through every wrapper on the channel
lane; no unchanged invariant is skipped or reordered; the public type surface is untouched. No HIGH
finding. One MEDIUM is a hardening/robustness point about how the invariant is *enforced*, not a
present defect. Approval is static only — it is not a claim that the new test file compiles or passes,
and it does not touch D's release hold, the #931/B hold, I6, or any production barrier.

Diff is as the report describes: 5 files, +207/−7; four production files +9/−7; 198 lines of new,
never-executed test source. Confirmed by `git diff --no-ext-diff --no-textconv --stat 0bba1e8b HEAD`.

## Findings

### MEDIUM — design/robustness: the fix is fail-open by omission and is not type-enforced
`src/mcpl/inbound-admission.ts:98`, `src/mcpl/reply-admission.ts:35`

The gate is `delivery?.conversational !== false`. Omitting the argument yields `undefined` →
`undefined !== false` → true → the old pre-fix preparation path. So any future wrapper or call site
that drops the 4th argument silently reverts LOW-1 with no diagnostic. TypeScript provides no
protection: `delivery` is optional, and a 3-parameter function is assignable to the 4-parameter
interface type. Two call sites already pass three arguments and compile (`push-handler.ts:184`,
`inference-router.ts:303`), and the terminal implementation `RequiredAdmission.capture().admit`
(`inbound-admission.ts:144`) declares only three parameters and is assignable. Today the chain is
correct (see Q2), so this is latent, not live.

Failure scenario: someone adds a wrapper on the channel lane — say an audit or rate-limit wrapper —
declaring `async admit(lane, item, signal)` and forwarding `inner.admit(lane, item, signal)`. It
compiles, all existing suites pass, and context-only items resume calling the operator's
`replyAuthority.resolve`/`authorize` and minting routing receipts. Exactly the LOW-1 behaviour,
re-introduced invisibly.

Fix direction: make the parameter required-but-nullable on the internal interface —
`admit(lane: AdmissionLane, item: unknown, signal: AbortSignal | undefined, delivery: DeliveryPlan | undefined)`.
Implementations may still declare fewer parameters (TS permits that), but every *forwarding call* must
then name the argument, and the dangerous half of the hazard is the forwarding call. `push-handler:184`
and `inference-router:303` would be updated to pass an explicit `undefined`, which also documents that
those lanes carry no plan. `RequiredIngress` is internal (see Q5), so this costs nothing externally.

### LOW — test: the argument-seam case composes the wrappers in the opposite order from production
`test/context-only-reply-admission.test.ts:188`

Production is `withReplyConsumer(withRegistrationScope(capture, view), …)` — registration scope inner,
reply consumer outer (`src/mcpl/server-connection.ts:1190-1192`). The test builds
`withRegistrationScope(withReplyConsumer(capture, …), view)` — reversed. It is a valid and in fact
*harder* forwarding test (the plan must survive a wrapper hop to reach the consumer), and the label
"through outer scope" plus the `:171-172` comment and the implementer report's "synthetic wrapper
scaffold, not evidence of accepted wire traffic" are honest about it being a scaffold. What neither
discloses is that the composition order is not the lane's. Low because cases (a)/(b) exercise the real
production order end-to-end over the loopback transport.

Fix direction: either match `server-connection.ts:1190-1192`'s order, or add a one-line comment saying
the order is deliberately inverted to test forwarding through a wrapper.

### LOW — test: `a.pendingRequests-push-never-called` can pass vacuously
`test/context-only-reply-admission.test.ts:82-83,103`

The test captures `x.host.pendingRequests` once and patches that array instance's `push`. But
`AgentFramework.pendingRequests` is reassigned to a *new* array at five sites
(`src/framework.ts:12064,16988,19140,19667,23620`). After any reassignment the patch is orphaned and
`enqueued` stays 0 regardless of what is pushed. The assertion is therefore weaker than its name.
Harmless here because `:96`/`:102` read the live field and are the load-bearing checks.

Fix direction: assert on the live field only, or patch via a getter/`Object.defineProperty` on the
framework instance.

### LOW — test: case (c) `stale` depends on reentrancy timing, with no precedent in the suite
`test/context-only-reply-admission.test.ts:43-45`

The `stale` variant performs `await f.send('channels/changed', …)` from *inside* the admission hook,
i.e. while `channels/incoming` is awaiting `admission.admit`. The existing precedent for the same
scenario (`test/registration-view.test.ts:140-168`) deliberately avoids this: the hook blocks on a
barrier and the test body sends `channels/changed`, then releases. I confirmed the deadlock concern
does not apply — `McplServerConnection.dispatchMessage` returns `void` and its comment states "async
RPC handlers own their promises" (`src/mcpl/server-connection.ts:2609`), so frames are not serialised.
But the assertion at `:140` demands exactly `admission_stale`, which requires the framework to have
*applied* the change before the hook returns. That holds only if the framework replies to
`channels/changed` after applying it. If it does not, the reason becomes `admission_timeout` (5000 ms)
or the item is accepted, and the case fails or flakes. Unverifiable without running.

Fix direction: adopt the barrier pattern from `registration-view.test.ts:140-168`, or accept
`admission_stale` as one of a set.

### LOW — test gap: no coverage that the push and inference lanes are unaffected
The diff widens an interface all three lanes share, yet nothing in the new file touches `push/event` or
`inference/request`. Their correctness (Q4) rests on inspection plus each parent's existing suites.

## Per-question table

| Q | Answer | Evidence |
| --- | --- | --- |
| 1a — is `plan` at `:1983` exactly D's validated value, and the same one used for effects? | **Yes.** | `channel-registry.ts:1968` is the single `const plan = hasDeliverySelector(message) ? CONTEXT_ONLY : undefined;` — never reassigned (`grep -n "plan ="` returns only that line). It is defined *after* the pre-A refusal at `:1966-1967` and is the identical binding read at `:2047` (openRepair), `:2083` (wake), `:2124` (`attachDelivery`) and `:2180` (result echo). Value is either the frozen module constant `CONTEXT_ONLY` (`inbound-delivery.ts:6`) or `undefined` — never a wire value. `validateDelivery` (`inbound-delivery.ts:40-44`) has already refused anything whose `delivery` is not literally `'context-only'`, or that lacks `contextOnlyStorage` + `channels.incoming` + `channels.contextOnly`, or that combines with `coalesce`/`chat:addressed`/`script:wake`. `reply-admission.ts:32-35` reads only its own `delivery` parameter — no `item.delivery`, tags, metadata, wake state or gate result. |
| 1b — can a caller pass an attacker-influenced plan? | **No.** | `channel-registry.ts:1983` is the only 4-argument call site in `src/` (`grep -rn "\.admit(" src/`). The value is host-selected from a frozen constant; the wire can only influence *presence*, and only after `validateDelivery` passed. `RequiredIngress` is host-constructed (`RequiredAdmission.capture`); the operator supplies `InboundAdmissionConfig.bind`, which is downstream of the plan, not upstream. |
| 2a — actual wrapper order on the channel lane | Traced. | `server-connection.ts:1186-1193`: `RequiredAdmission.capture(…)` → `withRegistrationScope(…, registrations.view)` (only when `registrations` is set) → `withReplyConsumer(scoped, …)` (and `name !== 'inference-request'`), stored in `admissionReceipts`. Then `framework.ts:35286` `composeRegistrationIngress(original, {…original, check})` → `issueRegistrationIngress` (`registration-ingress.ts:58`). Then per item `channel-registry.ts:1895` `registrationAdmissionForItem` → `registrationItemFork` (`registration-ingress.ts:71`) → `forItem(admission)`, whose `create` chains `reply-admission.ts:50` → `registration-view.ts:151-154`, rebuilding `withReplyConsumer(withRegistrationScope({…capture, check}, view), …)`. |
| 2b — any wrapper that calls `admit(lane,item,signal)` and drops `delivery`? | **None on the channel lane.** | Every hop forwards or preserves by identity: `registration-view.ts:139,146` (declares and forwards `delivery`); `reply-admission.ts:32-33` (declares and forwards); `registration-ingress.ts:49` `Object.freeze({...ingress, forItem})` and `:58`/`:71` carry `admit` by reference, never re-wrapping it; `registration-view.ts:153` and `framework.ts:35095/35169/35286` use `{...original, check}`, which copies `admit` by reference. `composeRegistrationIngress` additionally *refuses* any outer whose `admit` is not identical: `registration-ingress.ts:55` `outer.admit !== original.admit → missing(key)`. The terminal `RequiredAdmission.capture().admit` (`inbound-admission.ts:144`) takes three parameters and deliberately ignores `delivery` — correct, since A must not see it. I also verified the no-`registrationScope` configuration: `scoped === admission` (no `forItem`), `withReplyConsumer` returns the bare `wrapped`, `composeRegistrationIngress` returns `outer` at `:54`, `registrationItemFork` returns the ingress unchanged at `:69`, and the 4-parameter `wrapped.admit` is invoked directly. The fix is not inert in either configuration. |
| 2c — are the `outer.admit === context.admit` identity checks unaffected? | **Yes.** | `registration-ingress.ts` is byte-identical to `0bba1e8b` (gate `round2-final-protected-modules`, exit 0). `contextOf` at `:19` compares `outer.admit === context.admit`; since no wrapper replaces `admit` with a new function on the fork/compose paths, every identity check still succeeds. Changing a function's *signature* does not change its identity. |
| 3a — are A read/storage admission, grant/epoch, D's pre/post `deliveryRefusal`, classification, receipts, per-item issued context, `admission_missing` and invalidation skipped or reordered? | **No.** | `channel-registry.ts:1975-1990` is unchanged apart from the argument list at `:1983`: `coalesce` refusal → `admission.check()` → entry/descriptor capture → `await admit` → `check()` + identity recheck → `!verdict.store` → `deliveryRefusal()` post-hook → envelope. D's pre-check is still at `:1966-1967`, before `plan` exists. `registration-ingress.ts`, `server-connection.ts`, `inbound-delivery.ts`, `reply-routing.ts`, `push-handler.ts`, `stored-injections.ts`, `framework.ts`, `admission/admit.ts`, `capability-grant.ts`, `index.ts` are all byte-identical to `0bba1e8b` (protected-modules gate). `missing()` at `registration-ingress.ts:24-25` is `admit: async () => refusal('admission_missing')` — it ignores every argument and still fails closed. The `attachAdmission`/`attachDelivery` pair at `:2123-2124` and the stamping path (`framework.ts:17346-17351`) are untouched. |
| 3b — does the new conjunct come after `admission.check()` and leave the A verdict alone? | **Yes.** | `reply-admission.ts:35`: `verdict.store && verdict.mayWake && !admission.check() && delivery?.conversational !== false`. `&&` is strictly left-to-right, so `admission.check()` is still evaluated in its original position and still called for context-only items; the new conjunct is last. The verdict is returned unmodified at `:46` on every branch. `delivery` never reaches A: `RequiredAdmission.capture().admit` builds `AdmissionInput` as `{connection, lane, item: snapshot(item), signal}` (`inbound-admission.ts:147`) with no delivery field, so the operator hook cannot see it and the verdict cannot depend on it. |
| 4 — is it correct that `push-handler:184` and `inference-router:303` pass no plan? | **Yes, and normal behaviour is unchanged.** | Push is closed to context-only at three independent points, all before admission: `server-connection.ts:2645` (line-receipt `-32602 unsupported_combination` on any `delivery` key, "Do not consult admission here"), `push-handler.ts:164` and `:202` (`refuseDeliverySelector` at both entries). So no push item can ever warrant a plan. The inference lane never receives a reply consumer at all — `server-connection.ts:1192` applies `withReplyConsumer` only when `name !== 'inference-request'` — so the conjunct is unreachable there. With `delivery` omitted, `undefined?.conversational !== false` is `true`, preserving the pre-fix condition exactly. |
| 5a — normal delivery behaviourally identical to `0bba1e8b`? | **Yes (static).** | Absent plan → `undefined?.conversational !== false` → `true`. Conversational plan: `NORMAL.conversational === true` (`inbound-delivery.ts:5`) → `true !== false` → `true`. In both cases the condition reduces to the original `verdict.store && verdict.mayWake && !admission.check()`, including the `catch` branch that sets `privateReplyBinding` and calls `reportReplyFailure`. The only other production change is parameter plumbing. |
| 5b — is `RequiredIngress` exported anywhere public? Is the optional 4th parameter breaking? | **Not exported; not breaking.** | `src/index.ts:221` exports `InboundAdmissionConfig, AdmissionInput, AdmissionVerdict, AdmitInbound, AdmissionLane, ConnectionKey, RefusalCode` and `:223` exports `admissionOf, AdmissionConnectError, MAX_ADMISSION_TIMEOUT_MS, MAX_PENDING_ADMISSIONS, AdmittedEnvelope`. `RequiredIngress` is in neither. The four `export *` barrels (`./types/index.js`, `./dendrite/index.js`, `./modules/index.js`, `./tool-presentation.js`) do not reach it — `grep -rn "RequiredIngress" src/types/ src/modules/ src/dendrite/` is empty. External code cannot name the type, so it cannot implement it. Even if it could, adding a trailing optional parameter to an interface method is non-breaking in TypeScript for both implementers (fewer parameters are assignable) and callers. |
| 6a — do (a)–(d) and the applied-argument controls assert what is claimed? | **Yes, all of it.** | resolver/authorizer zero: `:87-88,98-99` (a), `:120-121,129-130` (b), `:142-143` (c), `:194-195` (controls). No binding / no routing field: `:92-93` (a), `:125-126` (b, incl. `b.context-cannot-borrow-normal-binding`), `:196-197` (controls). No reply: `:100,133,147,166`. No wake: `:95,127,157`. No `pendingRequests`: `:96,102-103,132,149,164`. Stored context-only classification: `:106-107,131`. Unchanged locus/open: `:104,108` via the `state()` snapshot at `:69-73` (channels/open/descriptor, desiredStates, the three publish defaults, parkedAnchors, openLogical) — the same shape D's own suite uses at `context-only-delivery.test.ts:34-37`. Mixed batches in both orders: `:111` iterates `['normal-first','context-first']`. Stale/negative/narrow-grant: `:136` iterates all three, with distinct expected reasons at `:139`. |
| 6b — would the two described mutants be killed? | **Mutant 1 yes, via the real path. Mutant 2 yes.** | Removing the conjunct makes A's `store:true, mayWake:true` context-only item reach `consume`, so `resolves`/`authorizes` become `['context']` and `receipts.set(verdict, routing)` puts `routing` on the frozen envelope at `channel-registry.ts:1989`, which `workOf` reads via `[admittedEnvelope].routing` (`reply-routing.ts:34-40`). That breaks `:87,88,92,93` in (a) and `:120,121,125,126` in (b) — and (a)/(b) run the real loopback transport and the real wrapper chain, so this is a production-path kill, not a stub kill. Substituting a wake/gate result kills (b): `serverWake: false` makes `shouldTriggerInference` return false (`:32`) so `triggerInference` is false for the *normal* item (`:127`) while A's `mayWake` stays true, so `:120-121` still demand exactly one normal resolve/authorize — a wake-based gate would zero them. It also kills (d): the `default: 'skip'` local gate suppresses the wake but `:158-159` demand one resolve/authorize anyway. A `mayWake`-only substitution collapses into mutant 1 (already a prerequisite) and is killed by (a). |
| 6c — real framework paths or mostly stubs? | **Mostly real; one deliberate stub case.** | (a)–(d) go through `fixture()` (`test/helpers/coalescing-fixture.ts:33`), a real `WebSocketServer` on 127.0.0.1 and a real `AgentFramework.create`, driven by real `channels/register` + `channels/incoming` JSON-RPC. They therefore traverse `framework.ts:35286` → `composeRegistrationIngress` → `channel-registry.ts:1895/1983` → the production wrapper chain, and read real stored context rows via `getContextManager().getAllMessages()`. Only the `:173-198` controls are hand-composed, and they are labelled as such. Stubs are confined to the operator-supplied hooks (`bind`/`admit`, `resolve`/`authorize`), which is what an operator supplies in production anyway. |
| 6d — is the "argument-seam" case honestly labelled? | **Substantially yes, with one omission.** | `:1` ("Synthetic interaction witnesses"), `:171-172` ("Isolate the internal argument seam… the raw item deliberately claims context-only"), the test name "reply preparation reads only the applied plan (…) through outer scope", and the implementer report's "explicitly a synthetic wrapper scaffold, not evidence of accepted wire traffic" are all accurate. Undisclosed: the wrapper order is inverted relative to `server-connection.ts:1190-1192` (LOW finding above). |
| 6e — any real callback I/O? | **None in the reply-authority callbacks. Yes in one admission callback.** | `resolve`/`authorize` at `:54-55` and `:181-182` only push to arrays and return fixed literals — the `:1` header claim is accurate as scoped. But the *admission* hook does real work in two variants: `:43-45` awaits `f.send('channels/changed', …)`, a real loopback JSON-RPC round trip, and `:46-47` calls `establishGrant(new CapabilityGrant(…))`, mutating live framework state. Both are deliberate (they are how (c) creates mid-await staleness and grant narrowing), but they are I/O and state mutation from inside a callback, and the `:1` header does not mention them. |
| 6f — likely static compile errors? | **None found.** | I checked every imported symbol against its definition and every type-checked literal position. All 20 imports exist and are used (`strict: true` is the only strictness flag in `tsconfig.json`; `noUnusedLocals` is not set, so unused imports would be moot anyway). `'admission_denied'` is a valid `RefusalCode` (`inbound-admission.ts:11`). The `view` literal at `:185-187` matches `RegistrationView` exactly (`registration-view.ts:22-25`, just `lookup` + `current`), and its descriptor `{id,type,label,direction:'bidirectional'}` satisfies `RegistrationDescriptor = DeepReadonly<ChannelDescriptor>` (`mcpl/types.ts:1083-1100`: those four required, the rest optional). `new RequiredAdmission({timeoutMs, isReplyIntent, bind}, peer)` at `:176` matches `InboundAdmissionConfig` (`inbound-admission.ts:22-31`); `admit` returning a plain `{store:true, mayWake:true}` is fine because `AdmitInbound` returns `AdmissionVerdict \| Promise<AdmissionVerdict>` (`:21`) and the contextual union narrows the literal. `replyConsumer(config, key => a.isCurrent(key))` at `:180-183` is fine — a 1-parameter arrow is assignable to the declared 2-parameter `valid` (`reply-routing.ts:106`). The `bind: (connection, registrations: RegistrationView)` shape at `:38` is unchecked: `fixture`'s `server` option is `Record<string, unknown>`; it is also the established pattern in `registration-batch-scope.test.ts:27`, `registration-view.test.ts:132,146,173,220,269` and `registration-fork-outer.test.ts:16`. The one genuinely type-checked literal is `framework` (`Partial<FrameworkConfig>`): `contextOnlyStorage` exists (`types/framework.ts:121`), and `gate` matches `GateOptions` (`gate/types.ts:200-226`) with `config?: GateConfig` = `{policies: GatePolicy[]; default?: 'always'\|'defer'\|'skip'}` (`:189-193`) and `judge?: ReplyJudgeOptions \| null` whose `enabled?: boolean` (`:235-238`) accepts `{enabled:false}`. Commit `54ebfc58`'s `'skip' as const` is correct **and necessary**: the gate literal sits inside a conditional spread `...(options.gateSkip ? {…} : {})`, which strips the contextual type, so `default` would otherwise widen to `string` and fail. I also confirmed the two assertions most at risk of being wrong about host behaviour: `:107`/`:131`'s context-only stamp matches `stored-injections.ts:39-43,65` and D's own passing assertion at `context-only-delivery.test.ts:50`; and `:167-168`'s `{version:1,mode:'normal',conversational:true}` holds because `framework.ts:17346-17351` deletes the forged `INBOUND_DELIVERY_KEY` and re-stamps, with `conversational = plan.conversational && isConversationalInjection(clean)` where `isConversationalInjection` (`framework.ts:453-458`) only inspects `system === true` and marker tags — the forged `delivery`/`conversational` metadata keys do not affect it. |
| 7 — commit hygiene | **Clean.** | Both new commits: author **and** committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, empty trailer area — `git log --format='%b'` body for `54ebfc58` is empty and for `b05df842` is two prose lines with no `Co-Authored-By`. (The pre-existing `GPT-6.1-Sol` trailer remains only on the untouched merge `0bba1e8b`, as Soma's record requires.) `0bba1e8b` still has exactly its original parents in order `a0970645 93427f90`. All three reachability gates exit 0 (`round2-final-merge-reachable`, `-i7-reachable`, `-d-reachable`). Recovery refs are exact: `recovery/abdi7-merge-0bba1e8b → 0bba1e8b…`, `recovery/abdi7-i7-a0970645 → a0970645…`, `recovery/abdi7-d-93427f90 → 93427f90…`. Linear, additive, no amend or force. |

## Verification Gates

No gate was re-run: all six have reusable receipts at this exact commit, and the brief forbids
build/test/mutant execution. Receipts read from
`/home/orgasmic/.orgasmic/runs/run-01M68H7A0PSTV76HAV765V0V2C/evidence/`:

| Gate | Result | Log |
| --- | --- | --- |
| `round2-final-clean-tracked-tree` | exit 0 | `gate-round2-final-clean-tracked-tree-01M68HNYKKG0BP6JZNA12N5MGR.log` |
| `round2-final-protected-modules` | exit 0 | `gate-round2-final-protected-modules-01M68HNXZCEREV78VXDCQHGF9F.log` |
| `round2-final-whitespace` | exit 0 | `gate-round2-final-whitespace-01M68HNXTCZE6CND986YVHF570.log` |
| `round2-final-merge-reachable` | exit 0 | `gate-round2-final-merge-reachable-01M68HNY4EDX6D3AX2J16STX8J.log` |
| `round2-final-i7-reachable` | exit 0 | `gate-round2-final-i7-reachable-01M68HNY9GTW4Q3HC3EV7C2F7H.log` |
| `round2-final-d-reachable` | exit 0 | `gate-round2-final-d-reachable-01M68HNYEHKFP4MQEN915P0GZB.log` |

The `round2-final-protected-modules` receipt is load-bearing for Q2c and Q3a: it proves
`registration-ingress.ts`, `server-connection.ts`, `inbound-delivery.ts`, `reply-routing.ts`,
`push-handler.ts`, `stored-injections.ts`, `framework.ts`, `admission/admit.ts`,
`capability-grant.ts` and `index.ts` are byte-identical to `0bba1e8b`, so the identity checks,
plane/epoch handling, D's validator, B's routing and the public barrel are untouched.

My own read-only probes, all within scope: `git` with `-c core.hooksPath=/dev/null -c
commit.gpgSign=false -c core.fsmonitor=false` and `--no-ext-diff --no-textconv` on diffs
(`rev-parse`, `status --porcelain`, `diff --stat`, `diff -U8 … -- src/`, `log --format`,
`for-each-ref`); `sha256sum` on the two input documents; `cat`/`sed`/`grep` over source and test
files. No commits, no ref changes, no checkout, no reset, no build, no package execution, no network.

## Unmet criteria / test gaps

Nothing the brief authorises is unmet. The gaps are the ones the stage forbids closing, plus four
narrower ones:

1. **No execution of anything.** Compile correctness, the new assertions' actual outcomes, real
   callback counts, scheduler/storage interaction, emitted `.d.ts`, and profile-off byte identity are
   all unverified. My Q6f answer is "no error I can see statically", which is weaker than a clean
   `tsc`.
2. **No mutant was created or run.** Q6b is a source-level prediction about which assertions would
   break, not a measured kill.
3. **No test for push or inference lanes** under this diff (LOW finding above).
4. **The MEDIUM's latent hazard is untested.** The only guard against a future wrapper dropping the
   argument is the `:173-198` scaffold, and that scaffold's composition order is not the lane's.
5. **No concurrency probe.** REVIEW1's open question about a channel replaced, removed or grant-narrowed
   during `await admission.admit` is still argued only statically; case (c) gestures at it but is
   itself timing-dependent and unexecuted.
6. **Normal-delivery runtime equivalence to `0bba1e8b` is reasoned, not measured.** Case (d) encodes
   the pre-fix counts as source expectations, as the implementer states — it is not a before/after
   comparison.

## Residual risk

- The fix's correctness depends on an invariant TypeScript does not enforce (MEDIUM). It holds at this
  commit on every path I traced; it is one careless wrapper away from silently reverting.
- LOW-1's underlying safety argument is unchanged: context-only reply work was already inert because
  every `workOf` consumption site is wake-guarded and `admission/admit.ts:98-106` bypasses the gate.
  This fix removes the *effect surface* (operator callbacks no longer fire, no routing receipt is
  minted) rather than fixing a live break. REVIEW1's residual risk — that a future read of
  `workOf(event)` outside a wake guard would make LOW-1 live — is reduced but not eliminated, since the
  push and inference lanes still prepare replies without a plan (correctly, since they are closed to
  context-only by construction).
- Everything in "Unmet criteria" 1–2 is live risk: this is approval of source, not of a working build.
- Inherited holds are untouched and still binding: **D's release hold, the #931/B hold, UNQUALIFIED,
  LOCAL ONLY.** No I6 clearance, no production barrier lift, no publication or privacy qualification,
  no deployment. The `GPT-6.1-Sol` trailer on `0bba1e8b` remains an unresolved provenance note per
  Soma's record; this delta neither worsens nor resolves it, and I made no ref change.

## Fix directions (summary, in priority order)

1. **MEDIUM** — `inbound-admission.ts:98`: change `delivery?: DeliveryPlan` to
   `delivery: DeliveryPlan | undefined` on the internal `RequiredIngress.admit`, and pass an explicit
   `undefined` at `push-handler.ts:184` and `inference-router.ts:303`. Every forwarding call then has to
   name the argument, so a wrapper that drops it fails to compile instead of silently failing open.
2. **LOW** — `test/context-only-reply-admission.test.ts:188`: match
   `server-connection.ts:1190-1192`'s wrapper order, or comment that the inversion is deliberate.
3. **LOW** — `:82-83`: assert on the live `pendingRequests` field rather than a captured array's
   patched `push`.
4. **LOW** — `:43-45`: use the barrier pattern from `registration-view.test.ts:140-168` instead of a
   reentrant `f.send` inside the admission hook.
5. **LOW** — add a push-lane and an inference-lane case asserting the no-plan path is unchanged.

---

# Addendum — qualifier binding additions (Soma 1793436130, via tarn2 msg-996b7098)

Read-only, nothing executed. Still **NO BUILD/TEST RUN**. These three additions changed one of my
answers materially (A) and produced two new findings (A2, B1). Verdict is unchanged — **APPROVE
(static)** — but the severity profile is now one HIGH-adjacent MEDIUM on the public surface plus the
original MEDIUM, so I have re-ranked.

## (A) Package and declaration reachability of the changed `admit` signature

**Correction to my Q5 answer.** I classified `RequiredIngress` as internal on the strength of "not
named in `src/index.ts`". The qualifier is right that this proves nothing. Traced properly, the changed
signature is **PUBLIC** in the emitted declaration surface, in both return and parameter positions.

Build/packaging facts (`tsconfig.json`, `package.json`):
- `"declaration": true`, `"declarationMap": true`, `"outDir": "./dist"` (tsconfig `:8,14,15`).
- `"types": "dist/src/index.d.ts"`, `"main": "dist/src/index.js"`.
- `"exports"` has a single `"."` entry (`bun`/`types`/`import`) and **no `./*` subpath**, so deep
  imports are blocked by Node ESM resolution.
- `"files": ["dist/src", "src"]` — the whole source and declaration tree ships regardless.
- `src/index.ts:106` re-exports `McplServerConnection` from `./mcpl/index.js`; `src/mcpl/index.ts`
  exports `McplServerConnection` (`:114`), `PushHandler` (`:171`), `InferenceRouter` (`:175`) and
  `ChannelRegistry` (`:178`).

### Every public path to `RequiredIngress` / `admit`

| # | Declaration | Position | Public path | Class |
| --- | --- | --- | --- | --- |
| 1 | `McplServerConnection.admissionFor(params: object): RequiredIngress` — `server-connection.ts:495` | **return** | `index.ts:106` → `mcpl/index.ts:114` | **PUBLIC** |
| 2 | `PushHandler.handleRequiredPushEvent(serverId, params, responder, admission: RequiredIngress)` — `push-handler.ts:163` | **parameter** | `index.ts:106` → `mcpl/index.ts:171` | **PUBLIC** |
| 3 | `ChannelRegistry.handleIncoming(serverId, params, responder, admission?: RequiredIngress)` — `channel-registry.ts:1883` | **parameter** | `index.ts:106` → `mcpl/index.ts:178` | **PUBLIC** |
| 4 | `InferenceRouter.handleInferenceRequest(…, admission?: RequiredIngress, …)` — `inference-router.ts:226,253` | **parameter** | `index.ts:106` → `mcpl/index.ts:175` | **PUBLIC** |
| 5 | `withRegistrationScope`, `registrationAdmissionForItem` — `registration-view.ts:135,161` | both | `registration-view.ts` is not re-exported from `mcpl/index.ts`; `index.ts:225` exports only its *types* (`RegistrationRef, RegistrationView, RegistrationDescriptor, RegistrationScopeConfig, VerifiedRegistrationScope, ReadonlyData`) | **INTERNAL** |
| 6 | `withReplyConsumer`, `admissionRoutingFields` — `reply-admission.ts:29,8` | both | not in any barrel; `index.ts:224` exports only `ReplyDestination, ReplyAuthorityConfig` from `reply-routing.ts` | **INTERNAL** |
| 7 | `RequiredIngress` as a *named* type export | — | absent from `index.ts`, `mcpl/index.ts`, and all four `export *` barrels (`./types/index.js`, `./dendrite/index.js`, `./modules/index.js`, `./tool-presentation.js`) — `grep -rn "RequiredIngress" src/types/ src/modules/ src/dendrite/` is empty | **not nameable directly** |

So the type is **structurally public but not nominally exported**: a consumer cannot `import type
{ RequiredIngress }`, but reaches the identical type via
`ReturnType<McplServerConnection['admissionFor']>`, or simply by having to construct an object to pass
to paths 2–4. Paths 2–4 are the significant ones — they mean **external implementers of `admit` are a
supported shape**, which is precisely the case I previously argued away.

### Exact optional-argument delta per reachable declaration

The signature itself changed in one place; the other reachable declarations change only by referring
to it.

| Declaration | Before (`0bba1e8b`) | After (`54ebfc58`) |
| --- | --- | --- |
| `RequiredIngress.admit` (`inbound-admission.ts:96` → `:98`) | `admit(lane: AdmissionLane, item: unknown, signal?: AbortSignal): Promise<AdmissionVerdict>` | `admit(lane: AdmissionLane, item: unknown, signal?: AbortSignal, delivery?: import('./inbound-delivery.js').DeliveryPlan): Promise<AdmissionVerdict>` |
| `withRegistrationScope`'s `scoped.admit` (`registration-view.ts:139`) | `async admit(lane: AdmissionLane, item: any, signal?: AbortSignal)` | `async admit(lane: AdmissionLane, item: any, signal?: AbortSignal, delivery?: import('./inbound-delivery.js').DeliveryPlan)` |
| `withReplyConsumer`'s `wrapped.admit` (`reply-admission.ts:32`) | `async admit(lane: AdmissionLane, item: unknown, signal?: AbortSignal)` | `async admit(lane: AdmissionLane, item: unknown, signal?: AbortSignal, delivery?: import('./inbound-delivery.js').DeliveryPlan)` |
| `RequiredAdmission.capture().admit` (`inbound-admission.ts:144`) | `(lane: AdmissionLane, item: unknown, signal?: AbortSignal) => …` | **unchanged** — still 3 parameters, deliberately ignores `delivery` so A cannot see it |
| Paths 1–4 above | reference `RequiredIngress` | reference `RequiredIngress`, textually identical | 

**Is the delta breaking?** No, for either direction of use:
- External **implementers** (paths 2–4): a 3-parameter `admit` stays assignable to the 4-parameter
  method type — TypeScript permits implementations with fewer parameters. The in-repo proof is
  `RequiredAdmission.capture().admit` itself (`inbound-admission.ts:144`), which declares three
  parameters and is still assigned as a `RequiredIngress`. Existing external code compiles unchanged.
- External **callers** (path 1): the new parameter is optional, so every existing call site is valid.

### NEW FINDING — MEDIUM (public surface): `DeliveryPlan` is referenced by a public declaration but cannot be named by a consumer
`src/mcpl/inbound-admission.ts:98`, `package.json` `exports`

`DeliveryPlan` is exported from `src/mcpl/inbound-delivery.ts:7` but is **not** re-exported from
`src/index.ts`, `src/mcpl/index.ts`, or any `export *` barrel (verified: `grep -rn "DeliveryPlan"
src/index.ts src/mcpl/index.ts src/types/` is empty). The `exports` map has no `./*` subpath, so
`@animalabs/agent-framework/dist/src/mcpl/inbound-delivery.js` is not importable either, even though
`files` ships it.

Failure scenario: an integrator implementing `RequiredIngress` to pass into
`ChannelRegistry.handleIncoming` or `PushHandler.handleRequiredPushEvent` wants to honour the new
parameter — thread it through their own wrapper, or just type it. They cannot name `DeliveryPlan` from
any importable path. They must fall back to `any`/`unknown` (losing the `conversational` check that the
whole fix rests on), or re-derive the type via
`Parameters<ReturnType<McplServerConnection['admissionFor']>['admit']>[3]`. The public surface now
mentions a type the public surface will not let you name. This is exactly the wrapper population that
the MEDIUM below warns can silently revert the fix, so the two compound.

Fix direction: add `export type { DeliveryPlan } from './mcpl/inbound-delivery.js';` to `src/index.ts`
beside the existing admission type exports at `:221`. Type-only, additive, no runtime change, and it
does not widen authority — `DeliveryPlan` is a closed two-member union of frozen constants and naming
it grants nothing (`CONTEXT_ONLY` is already exported from that module and the wire cannot supply a
plan; see (C)). Note this touches `src/index.ts`, which is in the protected-modules gate list, so it is
a follow-up for the owner to authorise rather than something to slip into this delta.

### Declaration-emit note (unverified — no `tsc` permitted)
Three declaration files that previously had no dependency on `inbound-delivery.d.ts` now acquire one:
`inbound-admission.d.ts`, `registration-view.d.ts` and `reply-admission.d.ts`, each via the inline
`import('./inbound-delivery.js').DeliveryPlan` form. The inline form is the right choice (it avoids a
value-position import), and `dist/src` ships `inbound-delivery.d.ts`, so I expect emit to succeed.
I cannot prove it. `DeliveryPlan = typeof NORMAL | typeof CONTEXT_ONLY` where `NORMAL`
(`inbound-delivery.ts:5`) is module-local; that aliasing is pre-existing and unchanged by this delta
(`inbound-delivery.ts` is byte-identical per the protected-modules gate), so if it emitted at
`0bba1e8b` it emits now — but it is now exercised from three additional files. Classify: **UNKNOWN,
pending a real `tsc`.** This sharpens REVIEW1's existing "emitted types" residual risk rather than
adding a new one.

## (B) Test plan

### B-i — does case (a) go through the REAL supported chain? **Yes.** It does not hand `plan` to the final wrapper.

Case (a) (`:79-109`) drives `f.send('channels/incoming', …)` over a real `WebSocketServer` on
127.0.0.1 against a real `AgentFramework.create` (`test/helpers/coalescing-fixture.ts:33-98`). It
therefore traverses, in order:

`framework.ts:35285` `connection.admissionFor(params)` → `:35286` `composeRegistrationIngress(original,
{...original, check})` → `registration-ingress.ts:58` `issueRegistrationIngress` →
`channel-registry.ts:1895` `registrationAdmissionForItem(batchAdmission)` →
`registration-ingress.ts:71` `admission.forItem!(admission)` → `reply-admission.ts:50` →
`registration-view.ts:151-154` → **`channel-registry.ts:1983` `admission.admit('channels/incoming',
message, undefined, plan)`**.

The per-item ingress that call lands on is
`withReplyConsumer(withRegistrationScope({...captured, check}, view), consume, …)` — reply consumer
**outermost**, matching `server-connection.ts:1190-1192`. The test never constructs a wrapper; the only
hand-composed case is the `:173-198` controls, which are labelled as a scaffold. So B-i's hazard ("a
test that hands `plan` straight to the final wrapper") does **not** apply to (a).

### B-ii — drop-the-fourth-argument mutants: **not in the plan. FINDING.**

The implementer's report describes exactly two mutants — "remove the applied-plan conjunct" and "use a
wake/gate result as the preparation gate" — and **neither is a drop-the-argument mutant**. Here is the
per-seam kill matrix I derived from the production chain above. The crux is that the reply consumer is
*outermost*, so it reads its own `delivery` parameter at `:35` and the inward forwarding hops are not
on the decision path at this commit.

| # | Seam | Effect of dropping the 4th argument | Which assertion kills it |
| --- | --- | --- | --- |
| S1 | `channel-registry.ts:1983` (drop `plan` from the call) | **Fix fully inert** — reverts LOW-1 | **Killed.** (a) `:87` `a.context-only-zero-resolve-despite-A-mayWake-true`, `:88` `…-zero-authorize`, `:92` `a.no-routing-field-on-context-envelope`, `:93` `a.no-reply-binding-on-context-envelope`; (b) `:120-121,125-126`. Real chain, so this is a production-path kill. |
| S2 | `reply-admission.ts:32` (drop the parameter *declaration*) | `delivery` is `undefined` → conjunct always true → **fix fully inert** | **Killed.** Same assertions as S1. |
| S3 | `reply-admission.ts:33` (drop the 4th arg on the *forwarding* call) | **No behavioural change today** — the only thing further in is `withRegistrationScope`, which forwards to `capture().admit`, which ignores `delivery` | **Nothing kills it, and nothing can.** Correctly unobservable at this commit. |
| S4 | `registration-view.ts:139` (param decl) or `:146` (forwarding arg) | **No behavioural change today** — same reason as S3 | **Nothing kills it via the production order.** But the `:173-198` controls *do* kill it, because they invert the order (registration scope outer, reply consumer inner), making `:146` load-bearing. See the re-rank below. |
| S5 | `framework.ts:35286` compositor / `registration-ingress.ts:49,58,71` | Nothing to drop — all four carry `admit` **by reference** through `{...original, check}` / `{...ingress, forItem}`. A mutant must *replace* the spread with an explicit 3-arg re-wrapper. In the scoped config that trips `registration-ingress.ts:55` `outer.admit !== original.admit → missing(key)` → every item refuses `admission_missing`. In the **unscoped** config it is silent and the fix goes inert. | **Scoped config: killed loudly** — (a) `:85` `a.accepted-context-only` and (c) `:140` would all report `admission_missing`. **Unscoped config: NOT killed — see B1 below.** |

So two of five seams are test-killable, two are unobservable-by-construction (S3/S4 — not a test
deficiency, they are dead plumbing until someone adds an inner consumer), and one is config-dependent.
That S3/S4 are unobservable *is* the MEDIUM finding restated: the plumbing beyond the outermost
consumer has no behavioural shadow, so nothing but convention protects it.

Fix direction for B-ii: add the S1 and S2 drop-arg mutants to the mutant plan explicitly (both are
already killed, so this is documentation of kill coverage, not new test work), and record S3/S4 as
*deliberately unobservable* with a pointer to the required-parameter hardening in the MEDIUM below —
that hardening is what converts S3/S4 from "untestable" to "compile error".

### NEW FINDING — MEDIUM (test gap): the no-`registrationScope` configuration is uncovered, and it is where seam S5 fails silently
`test/context-only-reply-admission.test.ts:35-37`; `src/mcpl/server-connection.ts:1190`

`registrationScope` is optional (`inbound-admission.ts:25`), and `server-connection.ts:1190` branches
on it explicitly: `this.requiredAdmission.registrations ? withRegistrationScope(admission, …) :
admission`. So `contextOnlyStorage` + `replyAuthority` + **no** `registrationScope` is a supported
configuration — and a materially different chain: `withReplyConsumer` returns the bare `wrapped`
(`reply-admission.ts:51`, since `capture()` has no `forItem`), `composeRegistrationIngress` returns
`outer` at `:54` (no `forItem`, key not in `protectedKeys`), and `registrationItemFork` returns the
ingress unchanged at `:69`. There is no issuance, no fork, and **no `outer.admit === original.admit`
identity check** — the `:55` guard that catches seam S5 is never reached.

Every case in the new file sets `registrationScope` (`:35-37`), so all four cases plus the controls run
only the scoped chain.

Failure scenario: a future change wraps `admit` in the host compositor (`framework.ts:35286`) with a
3-parameter forwarder. Under `registrationScope` every item loudly refuses `admission_missing` and the
suite screams. Without `registrationScope` the plan is silently dropped, context-only items resume
calling the operator's `resolve`/`authorize`, and no test notices. I verified the fix itself is
*correct* in this configuration today — the 4-parameter `wrapped.admit` is invoked directly from
`channel-registry.ts:1983` — so this is a coverage gap, not a present defect.

Fix direction: parameterise `setup()` with a `scope?: boolean` option and run case (a) — the
callback-zero case — in both configurations. Roughly three lines: make the `registrationScope` key a
conditional spread and drop the `await eventually(() => !!view.lookup(room))` guard at `:65` when it is
absent.

### B-iii — re-rank of my earlier LOW on the inverted wrapper order
I previously flagged `:188`'s inverted composition as a LOW. The seam analysis shows it is doing work
the production order *cannot*: with the registration scope outer, `registration-view.ts:146`'s
forwarding becomes load-bearing, so the controls are the **only** kill for seam S4. I am therefore
downgrading that finding to **INFORMATIONAL** — the remaining point is purely the undisclosed
inversion, and the right fix is the one-line comment, not reordering. Reordering it to match production
would *remove* the only S4 coverage.

## (C) Is `plan` the applied value D validated, and is there new wire authority?

**Confirmed, and no new wire authority.** Restating with evidence, since this is a binding re-check:

1. **Single binding, host-selected value.** `channel-registry.ts:1968`:
   `const plan = hasDeliverySelector(message) ? CONTEXT_ONLY : undefined;` — a `const`, never
   reassigned (`grep -n "plan ="` over the file returns only `:1968`). The value is either the frozen
   module constant `CONTEXT_ONLY` (`inbound-delivery.ts:6`, `Object.freeze`) or `undefined`. The wire
   influences only **presence**, never content: `hasDeliverySelector` (`:28-30`) is a bare
   `Object.hasOwn(value, 'delivery')` predicate, and the caller's actual string is discarded.
2. **Validated before it exists.** `validateDelivery` runs at `:1966` — two lines *before* `plan` is
   bound — and refuses, via `refuseDelivery(...) + continue`, anything whose `delivery` is not
   literally `'context-only'` (`invalid_delivery`), or that lacks `contextOnlyStorage` +
   `channels.incoming` + `channels.contextOnly` (`capability_denied`), or that combines with
   `coalesce` / `chat:addressed` / `script:wake` (`unsupported_combination`) —
   `inbound-delivery.ts:40-44`. It is re-run post-A at `:1988-1989` against the current grant.
3. **Same value used for effects.** The identical binding is read at `:2047` (`openRepair`), `:2083`
   (`wake`), `:2124` (`attachDelivery`) and `:2180` (the result echo). Nothing recomputes a plan from
   metadata or a later wire hint.
4. **Never a caller- or wire-supplied mode claim.** `reply-admission.ts:32-35` reads only its own
   `delivery` parameter — no `item.delivery`, no tags, no metadata stamp, no server wake filter, no
   local gate decision, no wake/turn state. `channel-registry.ts:1983` is the **only** 4-argument
   `admit` call in `src/` (`grep -rn "\.admit(" src/`). A `RequiredIngress` is host-constructed by
   `RequiredAdmission.capture`; the operator supplies `InboundAdmissionConfig.bind`, which is
   *downstream* of the plan and cannot see it (`capture().admit` builds `AdmissionInput` as
   `{connection, lane, item: snapshot(item), signal}` — `inbound-admission.ts:147` — with no delivery
   field). Caveat for completeness: public paths 2–4 in (A) let an external caller pass its own
   `RequiredIngress` into `handleIncoming`, but that object is the *recipient* of the plan, not its
   source — it still cannot manufacture a `CONTEXT_ONLY` classification, because the host computes
   `plan` at `:1968` from its own validated predicate before calling.
5. **No new wire authority.** No new wire field, grant, capability path, issuance point or A policy
   contract. `inbound-delivery.ts` and `capability-grant.ts` are byte-identical to `0bba1e8b`
   (protected-modules gate, exit 0). The trusted plan is carried on a module-private
   `Symbol('inbound delivery plan')` (`inbound-delivery.ts:8`) attached by
   `Object.defineProperty` (`:14-16`), which JSON cannot carry — so no wire payload can forge one.
   Test (d) `:154-156` asserts exactly this: a message with `metadata: {inboundDelivery: stamp,
   delivery: 'context-only', conversational: false}` and no top-level `delivery` yields
   `deliveryOf(event).conversational === true` (`d.untrusted-metadata-does-not-apply-a-plan`), and
   `framework.ts:17346-17351` deletes the forged `INBOUND_DELIVERY_KEY` and re-stamps from the applied
   plan.

## Legacy normal/no-plan controls

**Unchanged — verified.** `git diff --name-status 0bba1e8b HEAD` lists exactly five paths: four
modified production files and `A test/context-only-reply-admission.test.ts`. **No existing test file is
modified or deleted.** The legacy controls — `test/reply-admission.test.ts`,
`test/reply-routing.test.ts`, `test/reply-routing-core.test.ts`,
`test/reply-routing-transport.test.ts`, `test/registration-view.test.ts`,
`test/registration-batch-scope.test.ts`, `test/registration-fork-outer.test.ts`,
`test/context-only-delivery.test.ts` — are all byte-identical to `0bba1e8b`, and every one of their
`admit(...)` call sites passes three or fewer arguments, which exercises the absent-plan path and so
asserts the unchanged normal behaviour by construction.

## Re-ranked findings after the addendum

| Severity | Finding | Where |
| --- | --- | --- |
| MEDIUM | Fix is fail-open by omission and not type-enforced | `inbound-admission.ts:98`, `reply-admission.ts:35` |
| MEDIUM | `DeliveryPlan` referenced by a public declaration but unnameable by consumers (**new, from A**) | `inbound-admission.ts:98`, `package.json` exports |
| MEDIUM | No-`registrationScope` configuration uncovered; seam S5 fails silently there (**new, from B**) | `test/context-only-reply-admission.test.ts:35-37`, `server-connection.ts:1190` |
| LOW | Drop-the-4th-argument mutants absent from the mutant plan (S1/S2 killed, S3/S4 unobservable) (**new, from B**) | implementer report, "Two specified mutants" |
| LOW | `a.pendingRequests-push-never-called` can pass vacuously | `test/…:82-83,103` |
| LOW | Case (c) `stale` depends on reentrancy timing, no precedent in the suite | `test/…:43-45` |
| LOW | No push-lane or inference-lane coverage of the no-plan path | — |
| INFO | Inverted wrapper order at `:188` undisclosed (**downgraded from LOW** — it is the only kill for seam S4) | `test/…:188` |

Fix-direction priority is now: (1) required-but-nullable `delivery` on the internal interface;
(2) export `DeliveryPlan` from `src/index.ts` (owner-authorised, touches a protected module);
(3) run case (a) in both `registrationScope` configurations; then the LOWs as previously stated.

## What I could not verify (unchanged, plus one addition)
Everything in the main report's "Unmet criteria / test gaps" stands. Addition from (A): whether
declaration emit actually succeeds with three declaration files newly depending on
`inbound-delivery.d.ts` is **UNKNOWN** — it needs a real `tsc`, which this stage forbids.

**No build/test run.**
