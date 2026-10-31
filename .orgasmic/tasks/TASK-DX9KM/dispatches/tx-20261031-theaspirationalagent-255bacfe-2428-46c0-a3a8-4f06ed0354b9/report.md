# Round 3 — fail-closed dispatch and coverage, LOCAL ONLY / UNQUALIFIED

## Changed

New additive commit: **`9184d91e796ccd201831d9456a8662d9abd47d28`**, parent **`54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27`**, on `unqualified-local-abdi7-20261031`.

Author: `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`. Neutral message; **no trailer**. No amend, rebase, reset, force, deletion, merge, push, main update, package/publication or production enablement. Metadata and exact ref resolutions: `round3-final-commit.txt`.

### Refs and reachable history

| Recovery ref | Exact target |
| --- | --- |
| `refs/heads/recovery/abdi7-low1-54ebfc58` — new, before editing | `54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27` |
| `refs/heads/recovery/abdi7-merge-0bba1e8b` — preserved | `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f` |
| `refs/heads/recovery/abdi7-i7-a0970645` — preserved | `a0970645d403a7a76449221fc36f240a7aa2464b` |
| `refs/heads/recovery/abdi7-d-93427f90` — preserved | `93427f90a16bcfbcf815217f4c080669ab842a71` |

Fresh final-head gates confirm all four commits remain ancestors. The original merge still has exactly its original I7 then D parents. The initial dispatch branch was checked out at I7; the required named composition/recovery refs matched, and I switched normally to the composition branch before edits. No edits or commits on the dispatch branch.

### Diff and stat

**M-before** = `54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27`; **M-after** = `9184d91e796ccd201831d9456a8662d9abd47d28`. Full diff: `round3-change.diff`; stat/numstat: `round3-diff-stat.txt`, `round3-diff-numstat.txt`. Numbered snapshots: `round3-trees/{M-before,M-after}/<file>`.

**4 files, +263/−27** (production **+22/−4**, test source **+241/−23**):

| File | Before → after cites | Change |
| --- | --- | --- |
| `src/mcpl/inbound-delivery.ts` | :1–10 → :1–22 | Add a module-private async-local dispatch carrier and two internal helpers; retain existing frozen constants, event symbol, classification and validator bodies. |
| `src/mcpl/channel-registry.ts` | :46,1983 → same lines | Import helper and scope the existing admission invocation with the already validated host `plan`. Keep the fourth argument as well. |
| `src/mcpl/reply-admission.ts` | :29–50 → :30–56 | Capture channel carrier synchronously at entry, before the first await; suppress preparation if either trusted restriction forbids it. Diagnose a lost/mismatched argument without preparing a binding. |
| `test/context-only-reply-admission.test.ts` | :1–198 → :1–416 | Scoped/unscoped real-chain and omission coverage; live-field pending assertions; barrier-based stale case; normal push/inference controls; concurrent/nested/restoration witnesses; retain inverted scaffold and add disclosure comment. |

No dependency, lockfile, build artifact, generated declaration or unrelated source change.

## Part 1 — one internal fail-closed mechanism

### Binding truth table — required design, not an executed result

This table was echoed in progress **before Part 1 edits**, and again **before committing**, including after the 09:06:38 binding addition.

| Row | Trusted state | Required / source-designed behavior | Test source |
| --- | --- | --- | --- |
| (i) | Applied `CONTEXT_ONLY` | Always suppress preparation: zero resolve, zero authorize, no routing fields; A/storage still run. | `:95–123`; `truth.context-only.*` at :352–386, scoped/unscoped. |
| (ii) | Applied `NORMAL`, or legacy normal with no context-only decision | Preserve the original store/mayWake/current-admission preparation prerequisites and normal binding/counts. | mixed :155–178; normal :206–223; `truth.normal.*` / `truth.legacy.*`; original inverted controls :390–416. |
| (iii) | Internal context-only dispatch, optional plan lost or mismatched at a wrapper | Retain the private restriction independently; suppress, never default to legacy normal. Diagnose loss so the healthy-path test detects it. Scoped identity violations may refuse even earlier as `admission_missing`. | wrapper-drop :126–153; `truth.missing.*` / `truth.mismatched.*`; healthy `a.applied-plan-forwarded-without-loss-S1-S2-S5`. |
| (iv) | Push/event or inference/request | No channel carrier applied/consumed; push retains normal preparation, direct inference retains its answer with no automatic reply consumer. | :225–262, both configs; explicit no-carrier assertions. |

### Mechanism and why it is narrow

- `inbound-delivery.ts:10–19` holds the instance **privately**, using only `AsyncLocalStorage.run` and `getStore`. No `enterWith`, instance export, disable/reset operation, item registry, wire key, grant, or global default mutation. `withAppliedDelivery`'s first argument is required-but-nullable **only on this new internal helper**, not on any public admission interface.
- The sole production dispatch writer is `channel-registry.ts:1983`. D has already run `validateDelivery` at `:1965–1967` and selected its frozen constant/absence at `:1968`. The helper encloses the **same** A invocation at the **same** position. It does not parse, copy, strip or change the item A sees.
- A missing fourth parameter is no longer the only available information. At **consumer entry**, `reply-admission.ts:34` reads the carrier for `channels/incoming` into immutable **`const applied`**, synchronously **before** `await admission.admit` at `:35`. There is no ambient lookup after that await. Each invocation closes over its own frozen value.
- Original A completion and store/mayWake/current checks remain at `:35–36`. At `:41`, a non-conversational captured plan **or** a restrictive explicit plan returns the original verdict without invoking the consumer or inserting routing receipts. No supplied conversational argument can override a captured context-only restriction. Carrier absence is legacy-normal only outside a host context-only dispatch, not the consequence of merely dropping a forwarding argument.
- At `:37–38`, the missing/mismatched-argument path emits one fixed diagnostic per affected positive admission, containing no item/callback/private data. This makes S1/S2/unscoped S5 observable **without** reintroducing resolver/authorizer effects. It is a diagnostic of internal argument loss, not authority or a wire response field. Negative/stale admission still follows its original path without preparation.
- For normal host dispatch, the private scope contains the existing frozen NORMAL value; legacy callers need no scope or new argument. Their preparation predicates remain the original ones. For push, the ternary at `:34` deliberately does **not** read the channel store. Inference is still never wrapped with a reply consumer (`server-connection.ts:1191–1192`).
- Nested normal dispatch installs its own normal scope, so it does not inherit a parent's context-only restriction; nested context-only installs its own restriction. `run` boundaries and entry capture are the source-level means of isolating each invocation across awaits and restoring its caller. This is justified by the mechanism itself, **not qualified by ALS use elsewhere**. Node/Bun implementation behavior, propagation and restoration remain **UNKNOWN** because nothing was executed.

The incorrectly inverted raw-selector candidate was **not implemented**. `reply-admission.ts` does not inspect `hasDeliverySelector`, item/wire presence, tags, metadata stamps or wake-gate decisions for the omission guard. The new carrier's value comes only from D's validated production decision; optional public input can remove preparation, never create authority. Existing `AdmissionInput`, A verdict, registration/epoch identity, destination authorization and wire modes are unchanged.

### Source-only async analysis and coverage

- **Concurrent interleaving:** :263–295 blocks a context-only item in A, starts a normal item on the same connection, allows normal to finish first, then releases context-only. Both scoped/unscoped variants assert per-invocation entry/after-await carriers, exactly one normal preparation, zero context preparation and no context routing.
- **Nested admissions:** :297–323 runs normal→context-only and context-only→normal, in both configs, with an A hook triggering a real second `channels/incoming`. It asserts the parent restriction before/after the inner answer and preparation only for the normal item. These are deliberately reentrant nested scenarios; the stale test is not.
- **Restoration:** :325–350 directly specifies synchronous throw, a suspended/awaited `run`, asynchronous rejection, and nested normal/context-only `run` restoration, including no ambient store in the caller while a child is suspended and after completion/error.
- **Omitted argument:** :126–153 exercises an explicit three-argument compositor wrapper in both configs. Scoped issuance rejects replaced `admit` identity; unscoped admission remains accepted/stored while the private carrier suppresses preparation and records loss. :352–386 additionally isolates missing/mismatched arguments through both wrapper configurations with **no selector/metadata claim at all**.
- **Other lanes:** :225–262 checks no carrier in A for push and inference, push's normal binding/counts, and inference's direct answer/provider call with zero automatic routing callbacks.

These are source witnesses and static control-flow analysis, **not passed tests or claims of runtime semantics**. The source captures the trusted value before all A awaits and uses scoped `run`; actual Node/Bun ALS behavior under these scenarios is UNKNOWN.

### Unchanged invariants and cites

All cites below are M-after. Except for `inbound-delivery.ts`'s +12 line shift, these invariant regions have identical line numbers before/after. Protected files are freshly compared at final HEAD below.

| Invariant | Preservation evidence |
| --- | --- |
| Issued per-item context / no refresh or borrowing | `channel-registry.ts:1892–1895` unchanged. `registration-ingress.ts:13–71` unchanged, including authenticated key/check/admit identity, ancestor composition and protected keys. No new `capture()` or registration lookup added. |
| A read/storage and stale refusal | `channel-registry.ts:1975–1991`: same unsupported arm, precheck, entry/descriptor capture, A await, postcheck/identity refusal, D postcheck, envelope. Only the existing await expression is scoped. `registration-view.ts:135–157` and `inbound-admission.ts:122–161` unchanged, including A's snapshot and original verdict validation. |
| `admission_missing` fail-closed | `registration-ingress.ts:23–26,53–71`; `server-connection.ts:495–496`, unchanged. S5's scoped replacement still refuses; no authentication bypass added. |
| Epoch, grant and readiness | `server-connection.ts:1172–1192,613–619`; `inbound-admission.ts:122–161`, unchanged. The new carrier neither supplies nor refreshes a connection key, epoch, registration ref or grant. |
| D validation/classification order | `channel-registry.ts:1965–1968,1989–1991,2046–2047,2083,2123–2124,2177–2181` unchanged. `inbound-delivery.ts` before :28–45 → after :40–57: existing selector/validator bodies unchanged. Raw presence still participates in D's existing validation, **not** in the new omission mechanism. |
| Storage, wake, locus, fork seed | `framework.ts:17346–17351,17386,17495,17526,17764–17770,17881–17902,29785`; `stored-injections.ts:37–98`; `admission/admit.ts:98–106`, unchanged. The event plan/private symbol functions remain unchanged, now `inbound-delivery.ts:22–37`. |
| Invalidation | Seven channel sites `:1577,1744,1787,2237,2686,2753,4555` and transport invalidation above, unchanged. |
| B routing / literal true / private+notice | `reply-routing.ts:27,106–149` unchanged, including literal `authorize(...) === true` at :137. `reply-admission.ts:42–52` retains ordinary consumer/catch/private-receipt behavior; context restrictions alone bypass it. Publication binding revalidation remains unchanged. |
| Host wrappers / other lanes | `framework.ts:35095,35169,35286`, `push-handler.ts:153–202`, `inference-router.ts:222–313`, `server-connection.ts:1191–1192,2638–2658`, unchanged. Public three-argument normal wrappers remain valid; no required parameter added. |

## Part 2 — source tests and mutant matrix

Full named-assertion inventory: `round3-assertion-inventory.txt`. Earlier tests remain in the same file; no existing separate suite was edited. Key groups:

| Source group | Load-bearing named assertions |
| --- | --- |
| (a), both configs :95–123 | `a.real-scoped-or-unscoped-chain`; `a.accepted-context-only`; `a.A-read-storage-admission-not-skipped`; zero-resolve/authorize-despite-A-mayWake-true; `a.applied-plan-forwarded-without-loss-S1-S2-S5`; `a.no-routing-field-on-context-envelope`; `a.no-reply-binding-on-context-envelope`; context-only storage/classification, no reply/turn/locus/open effects. `a.no-pendingRequests-at-acceptance` and `a.nothing-added-to-pendingRequests` read the **live field**. Captured-array push interception was removed. |
| Explicit wrapper drop :126–153 | `drop.scoped-identity-refusal-or-unscoped-storage`; `drop.zero-resolve-in-both-configs`; `drop.zero-authorize-in-both-configs`; `drop.no-routing-fields-in-both-configs`; non-vacuous refused/accepted receipt count; `drop.unscoped-plan-loss-is-diagnosed`; live pending/turn/publication/classification assertions. |
| Mixed batch and normal gate controls :155–178,206–223 | Both item orders; original `b.normal-exactly-one-resolve-despite-server-gate-false-context-zero` / authorize counterpart; normal binding, no borrowed context routing; `d.baseline-one-resolve-even-when-local-gate-will-skip` / authorize counterpart; forged stamp replaced, normal stored classification. |
| (c) :180–204 | Barrier enters at A hook :60. Test body removes/re-registers and waits for replacement readiness, asserts `c.stale-original-generation-invalidated-before-release`, then releases A. No `f.send` inside the stale hook. Original `c.<negative/stale/narrow-grant>-refusal-preserved`, zero callbacks, no stored refused item/turn/pending requests retained. Header :1 discloses admission I/O/barriers and live mutation; authority callbacks still only count. |
| Push/inference :225–262 | `push.no-channel-carrier-at-admission`, exactly-one normal resolve/authorize and retained binding; `inference.no-channel-carrier-at-admission`, normal direct answer, A retained, one model call, zero automatic callbacks/publication. |
| Concurrent :263–295 | `concurrent.normal-completes-while-context-is-blocked`; `concurrent.interleaved-awaits-retain-their-own-carrier`; context-zero/normal-one resolve/authorize; context no routing; no ambient store in test caller. |
| Nested :297–323 | `nested.inner-admitted-through-real-channel-chain`; `nested.outer-carrier-restored-after-inner-await`; `nested.only-normal-item-resolves` / authorizes; context no routing; caller has no ambient store. Both directions and configs. |
| Restoration :325–350 | `restore.no-store-after-sync-throw`; `restore.same-carrier-after-await-inside-run`; `restore.caller-store-restored-while-run-is-suspended`; `restore.no-store-after-awaited-run`; `restore.no-store-after-async-rejection`; `restore.nested-run-restores-normal-parent`; `restore.no-store-after-nested-runs`. |
| Truth rows :352–386 | For context-only/missing/mismatched/normal/legacy, both configs: `truth.<row>.A-still-runs`, `.A-verdict-unchanged`, `.resolve-count`, `.authorize-count`, `.routing-presence`, `.no-routing-fields` for restricted rows, `.loss-diagnostic`. |
| Inverted scaffold :390–416 | Existing raw-input and absent/conversational/context-only argument expectations retained. One-line comment :405 explicitly identifies deliberate inversion and sole S4 kill. The wrapper composition itself is unchanged (:406; was :188). |

### Mutants — described only, not created or executed

| Seam | Final-source effect | Killing assertions / honest limitation |
| --- | --- | --- |
| **S1** drop fourth argument at channel-registry :1983 (retain internal dispatch scope) | Carrier remains context-only; callbacks/routing suppressed, positive A/storage unchanged; fixed loss diagnostic. | Healthy (a) in both configs: **`a.applied-plan-forwarded-without-loss-S1-S2-S5`** / `a.no-late-plan-loss-diagnostic`. Zero-callback assertions alone are intentionally no longer a kill: fail-closed safety still holds. Removing the carrier too would be a different/multiple mutation, caught by callback/routing assertions. |
| **S2** drop/lose consumer parameter at reply-admission :33 | Entry carrier still captured; suppress and diagnose the missing argument. | Same healthy loss-diagnostic assertions in both configs. Literal removal leaving an undeclared identifier may be a type error; no compiler result claimed. The semantic omission mutant treats the argument as absent. |
| **S3** drop inward forwarding argument at reply-admission :35 | Current outermost consumer has already captured its own restriction/argument; inward capture deliberately ignores plan. | **Unobservable in production order**; no runtime kill claimed. Do not reorder code to manufacture one. |
| **S4** drop registration-view :140 parameter / :146 forwarding | Same production-order no-op: outer consumer already consumed the plan. | **Unobservable on production path**. Deliberate inverted scaffold is the **only kill**: `d.context-only-baseline-resolve-count-ignores-raw-selector`, authorize counterpart, binding-match assertion, `d.applied-context-only-no-routing-fields` (:412–415). It has no ambient dispatch carrier, so its forwarding hop is deliberately load-bearing. |
| **S5** explicit three-argument re-wrapper at framework compositor (instead of reference-preserving spread) | **Scoped:** unchanged identity check refuses `admission_missing`, no preparation. **Unscoped:** scoped dispatch carrier survives ordinary async forwarding, suppresses preparation and diagnoses loss. | Healthy scoped (a): **`a.accepted-context-only`** fails on unexpected refusal. Healthy unscoped (a): **`a.applied-plan-forwarded-without-loss-S1-S2-S5`** fails on loss diagnostic. Explicit wrapper-drop witnesses verify the fail-closed outcomes, not successful mutation execution. |

The former remove-gate/wake-proxy mutants remain covered by the existing callback/binding and gate-false controls; the matrix above addresses the specifically requested omission seams. No mutant was run.

## Part 3 — exact type surface

**No public declaration signature changed from M-before to M-after.** The previous report's “internal because not root-exported” reasoning is not reused: `RequiredIngress` is **structurally public**, including via `ReturnType<McplServerConnection['admissionFor']>`, and its legacy optional argument remains optional. Root directly exports `ChannelRegistry` (:83) and `McplServerConnection` (:106); the other MCPL class declarations below are also listed explicitly rather than assuming a root wildcard export. No emit or consumer compile was performed.

The following before **and** after spellings are identical:

| Declaration (current source) | Exact before = after |
| --- | --- |
| `RequiredIngress.admit`, inbound-admission :98 | `admit(lane: AdmissionLane, item: unknown, signal?: AbortSignal, delivery?: import('./inbound-delivery.js').DeliveryPlan): Promise<AdmissionVerdict>` |
| Public connection return, server-connection :495 | `admissionFor(params: object): RequiredIngress` |
| Public connection field, server-connection :463 | `readonly requiredAdmission?: RequiredAdmission` |
| Reachable capture return, inbound-admission :134 | `capture(check: () => RefusalCode | undefined): RequiredIngress` |
| Terminal captured admit, inbound-admission :143 | `(lane: AdmissionLane, item: unknown, signal?: AbortSignal) => ...` — still three parameters; A still receives only its original AdmissionInput. |
| ChannelRegistry, channel-registry :1879–1885 | `handleIncoming(serverId: string, params: ChannelsIncomingParams, responder?: Responder, admission?: RequiredIngress): Promise<void>` |
| PushHandler, push-handler :163 | `handleRequiredPushEvent(serverId: string, params: PushEventParams, responder: Responder | undefined, admission: RequiredIngress): Promise<void>` |
| InferenceRouter, inference-router :222–229 | `handleInferenceRequest(serverId: string, params: McplInferenceRequestParams, responder: Responder, admission?: RequiredIngress, dispatched?: () => void): Promise<void>` |
| Registration wrapper's admit, registration-view :140 | `async admit(lane: AdmissionLane, item: any, signal?: AbortSignal, delivery?: import('./inbound-delivery.js').DeliveryPlan)` |
| Reply wrapper's admit, reply-admission before :32 → after :33 | `async admit(lane: AdmissionLane, item: unknown, signal?: AbortSignal, delivery?: import('./inbound-delivery.js').DeliveryPlan)` |
| Existing plan alias, inbound-delivery before :7 → after :8 | `export type DeliveryPlan = typeof NORMAL | typeof CONTEXT_ONLY` |
| Root `DeliveryPlan` named export | absent → absent; intentionally not added. The fix does not require public callers/implementers to name/forward it to remain safe. |

`RequiredIngress` key/check/forItem, public AdmissionInput/AdmitInbound/InboundAdmissionConfig, PostAdmissionConsumer, withRegistrationScope and registrationAdmissionForItem signatures are unchanged. Package exports/types/files and tsconfig declaration settings are unchanged (fresh protected check).

**New source-module helper declarations only**, not re-exported by root or MCPL barrels and not referenced by a new public class method signature:

- absent → `export function withAppliedDelivery<T>(plan: DeliveryPlan | undefined, dispatch: () => T): T` (`inbound-delivery.ts:13`).
- absent → `export function appliedDispatchDelivery(): DeliveryPlan | undefined` (`:18`).

These are internal dispatch plumbing in the shipped source module, not a new supported package subpath or a new authority API. No `export type { DeliveryPlan }` was added just to make an unused name available. The cumulative optional fourth-argument surface introduced in round 2 still exists; this round does not make it mandatory or claim the structural type is private. **Declaration emit and consumer checking: UNKNOWN.**

## Verification Gates

### Inputs and sanitised safety preflight

Read both requested reports before source Git inspection, including the full addendum (read in successive file ranges). Verified full hashes, recorded in `round3-input-hashes.txt`:

- `/srv/review-drop/TASK-DX9KM-LOW1-REVIEW1.md`: `a9763762f6a90b6aa5c4327d17507977ed1e4f838cb4339326e864ed882d6647`.
- `/srv/review-drop/TASK-DX9KM-LOW1-FIX1.md`: `3dfb044576ad68fb89c9a6d7d9d068a10e5ced2231bac27d785e223903b9fd0a` (matches supplied prefix/suffix and review's full hash).

**First Git command at 08:58:18 UTC was the read-only sanitised source-config machinery audit**, using `--show-origin --name-only --get-regexp`. No Git ref/status/diff/show/checkout operation preceded it. Exit 1 means no requested keys present. Audit completed at **08:58:31 UTC**, before other Git work. `round3-machinery-audit.txt` records hooks and attributes. Actual final touched-path check-attr output is empty (`round3-final-path-attributes.txt`).

| Key/class | Presence / source origin | Executable configured/applies? |
| --- | --- | --- |
| core.hooksPath | absent; no origin or target | No; common hooks has no non-sample hooks, worktree hooks absent. |
| commit.gpgsign / gpg.* | absent; no origin | No configured signing; no keys loaded. |
| merge driver / diff driver / textconv / diff.external | absent; no origin; external-diff environment absent | No. |
| filter.* / core.fsmonitor | absent; no origin | No. |
| core.attributesFile | absent; no origin | No. |
| .gitattributes / info/attributes | None in inspected worktree, ancestors, common/worktree info and standard user/system locations | No applicable attributes; candidate and final path queries empty. |

No command/secret-bearing values printed, no credentials/signing keys accessed, no config changed. All subsequent Git commands used `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false`; every diff also used `--no-ext-diff --no-textconv`; commit used `--no-verify --no-gpg-sign` as explicitly required.

### Timestamped chronology

Exact per-command UTC timestamps and escaped arguments: **`round3-command-chronology.txt`**. Key order:

- **08:58:18**: first Git source-config audit; input reads/checksums.
- **08:58:31**: hook/attribute audit completed; then starting ref/status checks. Required composition/recovery targets matched.
- Before editing: normal switch to the requested branch and new `recovery/abdi7-low1-54ebfc58` creation (exact command timestamps in chronology).
- **09:00:16 binding correction**: rejected raw selector mechanism; echoed four-row truth table before Part 1 edits. Evaluated then selected scoped internal dispatch rather than item identity.
- **09:06:38 binding addition**: echoed truth table again; moved carrier capture to entry-before-await; added concurrency/nesting/restoration/lane-isolation source witnesses before commit.
- **09:08:57–09:10:15**: source-only diffs, attributes, declaration/production-path inspection and snapshots. No execution.
- Before commit: echoed truth table/current-code behavior again in progress; explicitly staged the four changed paths; whitespace and clean-unstaged checks.
- **09:11:38**: new additive commit `9184d91e`; metadata/original-parent/recovery-ref verification.
- **09:11:50–09:11:51**: seven fresh final-head source-only gates below.

### Fresh final-head gates

All ran via `orgasmic dispatch gate <name> -- <command>`, returned **exit 0**, and identified final HEAD **`9184d91e796ccd201831d9456a8662d9abd47d28`**, `clean=yes`. Transcript: `round3-gate-results.txt`. Log names below are relative to this evidence directory. Let **G** denote the exact safety-prefixed Git invocation above.

| Gate | Command after G | Log |
| --- | --- | --- |
| round3-whitespace | `diff --no-ext-diff --no-textconv --check 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27 HEAD` | `gate-round3-whitespace-01M68KNHGHWAKBWFSR0NS3GFD5.log` |
| round3-protected-modules | `diff --no-ext-diff --no-textconv --exit-code 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27 HEAD -- src/mcpl/registration-ingress.ts src/mcpl/inbound-admission.ts src/mcpl/registration-view.ts src/mcpl/server-connection.ts src/mcpl/reply-routing.ts src/mcpl/push-handler.ts src/mcpl/inference-router.ts src/stored-injections.ts src/framework.ts src/admission/admit.ts src/mcpl/capability-grant.ts src/index.ts src/mcpl/index.ts package.json tsconfig.json` | `gate-round3-protected-modules-01M68KNHNK11A6G42X58RMC18J.log` |
| round3-low1-base-reachable | `merge-base --is-ancestor 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27 HEAD` | `gate-round3-low1-base-reachable-01M68KNHTHF1ZSQ83MK9V9KDCW.log` |
| round3-original-merge-reachable | `merge-base --is-ancestor 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f HEAD` | `gate-round3-original-merge-reachable-01M68KNHZRQWCMT9YHHV3767AF.log` |
| round3-i7-reachable | `merge-base --is-ancestor a0970645d403a7a76449221fc36f240a7aa2464b HEAD` | `gate-round3-i7-reachable-01M68KNJ4TX60BASG41HV9JW64.log` |
| round3-d-reachable | `merge-base --is-ancestor 93427f90a16bcfbcf815217f4c080669ab842a71 HEAD` | `gate-round3-d-reachable-01M68KNJ9VW1W4WAGQN86X66CX.log` |
| round3-clean-tracked-tree | `diff --no-ext-diff --no-textconv --exit-code HEAD` | `gate-round3-clean-tracked-tree-01M68KNJEWV2RF6TK6B26RN9SR.log` |

**Intentional protected-list change:** inbound-delivery.ts is no longer claimed byte-identical: its new private carrier/helpers are the authorized Part 1 mechanism. Its previous constants, symbol operations and validator bodies were reviewed in the exact narrow diff, not hidden behind a passing equality gate. Channel-registry and reply-admission likewise have the intentional edits described above. Public type declarations and the remaining invariant modules are freshly compared unchanged.

### Inherited evidence

The checksum-verified round-2 review/report remain evidence of their **54ebfc58** source scope and describe the omission gap; they are not proof of this new fix or any test result. Prior baseline/instruction reads and supplied absence of conventions/gotchas remain unchanged context; no startup scan was replayed. Starting refs, current source, type paths and protected modules were re-inspected. **No prior gate receipt is reused as a pass at this head.** In particular, the earlier “internal interface” classification was corrected, not inherited as fact.

## Unmet Criteria

No code-only criterion identified as unmet: mechanism, corrected truth table, entry capture/run-only rule, scoped/unscoped omission tests, live pending field checks, stale barrier, other-lane controls, concurrency/nesting/restoration source, honest seam matrix, type-surface inventory, additive commit/recovery refs, and fresh source-only gates are recorded.

**No build/test run.** No npm, bun, node, tsc, build, typecheck, test, mutant execution, install, package execution, network, lifecycle or native 2b. Loopback I/O, provider calls, nested RPCs and throwing/awaiting behaviors occur only in **written test source**, not in commands run this round.

## Residual Risk

- **Bun/Node ALS propagation, isolation and restoration are UNKNOWN. No runtime semantics are claimed.** Source scopes/entry capture and unexecuted witnesses express the intended invariants; they do not qualify this use of ALS. Its use elsewhere is not a receipt.
- No compiler, declaration emit or consumer check: **UNKNOWN**, including public structurally reachable types, generic helper declarations and test source correctness. No runtime callback/count/storage/scheduler/race result, normal-delivery equivalence, profile-off byte identity or mutant kill was measured.
- The omission guarantee is source-level for ordinary wrappers forwarding within the internal dispatch. Removal/bypass of the dispatch scope itself, or a runtime that does not preserve its async context, is not claimed verified. Complete removal of both trusted dispatch information and the argument cannot be distinguished from a legacy normal external call; this is why the host creates the private scope before dispatch and why actual ALS runtime validation remains a later gate.
- S3/S4 are production-order unobservable by construction. Only the deliberately inverted S4 scaffold makes that forwarding load-bearing; no reorder or forced public parameter was introduced to improve a mutant score.
- Fixed loss diagnostics are intentional new fault-path output; healthy-path source tests assert none. No diagnostic throttle/runtime cost was measured.
- **D's release hold and #931/B holds remain. LOCAL ONLY / UNQUALIFIED.** No I6 clearance, production barrier lift, public-use privacy scan, qualification, publication or deployment.
