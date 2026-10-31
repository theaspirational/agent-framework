# S4Q8F — fix round 3

## Changed

Task constraints and scope answers came from the task operator/programme qualifier, not decisions by the owner.

Started at clean `c09aca307a6f08ad839e7cd592632d35fc899920`; final qualification head **`29b5ebf33ca5d785564cdd85c4609543d8202d57`**, clean. Local commits:
- `b7a3bb73`: issued internal outer-chain composition, explicit argument, fail-closed validation, documentation/changelog.
- `29b5ebf3`: real-path positive/negative argument and framework-wrapper regressions; mechanical instrumentation adaptation.

Both commits have the required Vasyl author/committer identity and co-author trailer (`commit-identities.txt`). No push/merge/release, install, dependency/lockfile, wire/schema, grant/verdict, typing/C/D changes. No new permission or persistent identity subsystem. Original checks, A ordering, B consumer/routing sidecars and connection provenance remain; bookkeeping authenticates only existing composition.

### Chosen API / enforcement

`RequiredIngress.forItem(outer: RequiredIngress)` uses an **explicit outer**, independent of `this`. `registrationAdmissionForItem(admission)` passes `admission.forItem(admission)`. Scope and B constructors and exactly the three existing framework spread/check wrappers issue an internal context. WeakMap factory membership, exact key/check/admit identities and ancestor/descendant binding authenticate the complete original chain; an issued but weaker ancestor is not a substitute. Frozen/function-preserving copies remain supported. Identity is revalidated at use, including mutation after fork creation. Unsupported calls return an ingress whose check/admit refuse **existing** `admission_missing` before A/B/effects, not TypeError and not a weaker fallback. Missing factory on an opted-in key also fails closed. Ordinary unprotected no-factory ingress is returned unchanged.

The concrete reviewer counterexample was reproduced at c09 (baseline harness exit0 means reproduction, NOT an invariant pass). At the new head the **real bare capture receipt explicitly passed as outer**, unregistered arrow forwarder, missing arguments, malformed outer and identity mutations all refuse `admission_missing`, B off/on, before effects. Receiver-only correction was insufficient; the internal binding—not argument visibility—is the enforcement.

Scope boundary was explicitly approved in two blocking answers (dispatch history, `decision-approved.txt`): internal weak existing-binding authentication only, three framework composers plus scope/B/forks; no new root context API. The already reachable `forItem` declaration's receiver→parameter change alone was approved. No legitimate in-tree supported composition broke in focused tests. Deliberately replacing trusted constructors/framework internals is outside this contract; this is not a JavaScript sandbox. No unresolved weaker-bare-receipt bypass is observed in the covered paths.

### Every changed file / final line references (c09 → new head)

Full patch: `changes.diff`.

| File:line | Change |
| --- | --- |
| `src/mcpl/registration-ingress.ts:1-71` | New internal weak-context implementation: 13-14 weak collections; 16-25 identity/missing; 27-48 lineage/issuance; 51-58 existing-wrapper composition; 60-70 use-time validation/helper. No strong per-item registry. |
| `src/mcpl/inbound-admission.ts:94-95` | Only r3 change to this file: explicit forItem argument/comment. No RequiredAdmission implementation change. |
| `src/mcpl/registration-view.ts:3,139-140,151-157,161-163` | Internal imports; remove receiver-based literal factory; issue fork using explicit authenticated full outer check; defence-in-depth `?? admission.check()` comment; helper delegates authenticated item fork. Per-item generation and all before/after-A checks remain. |
| `src/mcpl/reply-admission.ts:1,31,48-49` | Internal issuer import; existing B wrapper retained; B item factory forwards explicit argument and binds its existing parent. Consumer, signal, diagnostic connection, detach/routing receipts and private fallback unchanged. |
| `src/framework.ts:1,35010-35015,35084-35089,35201-35206` | Add internal composer to only push, inference and incoming RequiredAdmission spread/check wrappers. Every original queue/render/connection/original predicate retained exactly; no branch/order/grant/verdict removed. Off profile composer returns the old outer object unchanged. |
| `test/registration-batch-scope.test.ts:1,151-153,164,172-174,187-191` | Explicit outer/composer in direct test; truly unprotected key for off-profile identity control; adapt existing white-box epoch instrumentation to issued construction. No new LOW-3 production-observability claim. |
| `test/registration-fork-outer.test.ts:1-135` | New real-transport harness/effect counters; 21 argument/copy shapes × three guards × B off/on; direct forks on all three actual framework lanes with allow/queue/foreign controls. |
| `docs/registration-scope-view.md:84-95` | Supported invocation/refusal contract, weak binding/no new permissions, honest trusted-internals residual. Existing replacement corollary remains at74-75. |
| `changelog.d/registration-fork-binding.added.md:1` | Scoped changelog fragment. |

### T1 §4 semantic correspondence

The frozen contract/host documents and fixture remain the original inputs; no local-head substitution. Synthetic fixture hash remains `70a1827c21722b6056ba209928434877f4d4ea729338793c4d95a9e5c5126381` (invented IDs only).

| Fixed T1 axis | Final implementation / qualification |
| --- | --- |
| Accepted, connection-qualified generation | Real ChannelRegistry accepted lifecycle supplies immutable descriptor/scope and opaque ref, same epoch-bound binder view. No trace/tap shadow registry or mutable/private registry exposed by this round. |
| Epoch lifetime | Original transport key/view captured for batch, never refreshed per item. Old epoch invalidates all old items synchronously. Real reconnect and host input-key assertions rerun; LOW-3 white-box limit stated below. |
| Per-item lifetime | Fresh ref capture before A per item. Different registration removal does not poison current siblings; same invalidated registration cannot borrow another's scope. |
| Replacement without removal | Existing ready/pending real-path controls rerun: m1 admission_stale; ready m2 accepted and host observes NEW ref; pending m2 admission_stale before host A. Same-registration removal honestly uses §14.5 unknown-channel for m2. |
| Ordering/currentness | Accepted registration/ACK/readiness remains separate and before protected ingress. Captured ref checked synchronously after A/B awaits and before effects; no lazy-register/fallback. |
| Permissions | View/currentness never confers native read/wake/write/tool/reply permission; independent host verification and all A grants/verdicts/B required authorize retained. No connector parent/thread grammar interpretation. |
| Outer guard chain | Explicit issued context composes original queue/render/connection/A checks plus own per-item scope; supported wrappers/copies both allow and deny. Missing/unissued/ancestor/identity-mutated context refuses before effects. |
| Opt-in / off | Serialized complete logical wire/store corpus repeated vs B at new head, unchanged ddc883dd…; identity-return control for unprotected ingress. |

## Verification Gates

### Inherited evidence and unchanged bindings

Read full fixed review `/srv/review-drop/TASK-S4Q8F-FIX2-REVIEW.md`, SHA `9572aac4cc62e22077a26e334f37cc3a490b6965cdb3e142cc63750cd1ffe1f7`, and reviewer's real-path receiver script and receiver tables in `run-01M68270P7KBBXT53D6M7VG0QQ/evidence`. Copies/read scope: `inherited-review.md`, copied reviewer JSONs and `baseline-receiver-probe.mjs`. Previous implementation report `run-01M680NKSB65W88J6PJ9P6F8JC/evidence/report.md` was read in full in the resumed investigation. Its c09 head passes are historical, NOT current qualification. npm-ls explanation is retained as `inherited-npm-ls-explanation.md`.

Only the two B cells from `run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence` are **reused**, after verifying original full-log hashes, receipt existence and identical current bindings (`reused-base-cells.json`, `bindings.log`, final metadata gate). Head/focused/mutant/profile receipts from earlier heads are not reused.

| Binding | Reused B input | Current paired input |
| --- | --- | --- |
| B code/cwd | Clean `29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04`, same `.matched-base` tree | Same SHA/clean tree; new head source separate |
| Head source | Not a reusable head pass | Clean `29b5ebf33ca5d785564cdd85c4609543d8202d57` |
| Node22.23.3 | `/opt/node-v22.23.3-linux-x64/bin/node`, SHA `fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48` | Identical absolute executable/version/SHA, preflight before npm |
| Node22.12.0 | `/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-s4q8f/node_modules/.runtime/node-v22.12.0-linux-x64/bin/node`, SHA `177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9` | Identical absolute executable/version/SHA, preflight before npm |
| package.json | SHA `e149f0a8943238a62ac82fa561ed1732187815d9e4e60f68c76f47dc8b726bc2` | Identical B/head manifests |
| Actual application closure | Inventory SHA `91c5fd4fc5a930b841480847fb8c54943432aa9f1fcfc8e4ff28c068ce751afd`,7332 file/symlink records, excludes runtime/base directories | Same physical install and byte-identical recomputed inventory, not independent installs |
| AF_TEST_CONCURRENCY / test flags | 8; npm's force-exit/import/test-timeout600000 command | Identical |
| Stages | npm run typecheck; npm run build; npm test | Identical order/commands, absolute Node/npm-cli |
| Limits | 16GiB scope; whole-stage timeout3000s, TERM+60s KILL grace; log67108864-byte cap and separate PIPESTATUS | Identical; actual memory.max17179869184 |

No repository `package-lock.json`/npm-shrinkwrap exists. “Same lock inode” is only shared **installed** `node_modules/.package-lock.json` metadata (SHA `034f98722b1c33ec4901139cca713e96a63dcedaedbd775260598535a6e076ca`); it is **not independent evidence**. Base node_modules is a symlink to this install. Exact per-tree npm-ls diagnostics reproduce: base exit1/SHA `974e3bcfc2d3a01d06f66b219dd303580cb69cdd13ce74487c60257b788d4535`; head exit0/SHA `3c34f4248cd25631eae8af813a21972c32225cda9fab8b8ebea1cf9c5ec69975`. They are NOT identical npm-ls hashes. The reviewer demonstrated Arborist resolution context:54 reachable name@versions identical, symmetric difference0; base link context misattributes transitive/dev/peer edges (external symlink control reproduces567 problems). Byte closure and same symlink binding—not a fictitious lock or matching npm-ls serialization—support reuse. No reinstall performed.

### Bounded method / exact commands

Predeclared `gate-plan.md`. All behavioral qualification gates use:
```
orgasmic dispatch gate NAME -- systemd-run --user --scope --unit=UNIT -p MemoryMax=16G \
 bash bounded-command.sh LABEL COMMAND...
# Full head cells use bounded-cell.sh and stages.sh instead:
timeout --signal=TERM --kill-after=60s 3000s bash stages.sh WORKTREE HEAD \
 2>&1 | head -c 67108864 > FULL_LOG
codes=("${PIPESTATUS[@]}") # producer and capture separate
```
`run-head-cells.sh` fixes Node22.23.3 then22.12.0, one cell each, AF_TEST_CONCURRENCY8, exact head. Absolute Node version/SHA before ANY npm in each full cell. Full stage exit lines are retained individually. 124/137→operator-bounded timeout, INCONCLUSIVE;141, at-cap or nonzero capture→INCONCLUSIVE, never silently test failure/success. Observed line/byte progress prints every120s; no retry-until-green. Reconciliation is by owned scope/cgroup plus PID/start ticks, not timeout inference. Wrapper only reaps its own sleep timer; no fixture survivors killed.

Focused command in `focused.sh`: absolute22.23.3 Node, force-exit helper, `--test --test-force-exit --test-concurrency=8 --test-timeout=120000`, the three registration test files plus unchanged `mcpl-required-{admission,inference-admission,push-admission}.test.js` and `reply-admission.test.js`. **217 total /217pass /0fail /0skip /0cancel**, exit0. 147 scope/batch/fork +70 A/B tests; unchanged A files verified against c09. No failure names. Lifetime probe under `--expose-gc` collected child ingress, nested ingress and item factory while retaining root; structural proof: only WeakMap/WeakSet module collections, child→ancestor references, no strong reverse/item registry. Probe/runtime subpath/declaration audit are non-TAP components, exit0.

### Argument/receiver shape × guard × B: observed effects

`receiver-argument-effects.json` has126 actual real-path rows, exact receipts/messageId mapping and frozen transport-key assertions. Effects columns are **host A calls, B consumption, stored message bodies, model wake calls, publications**, in that order. Each row sends two distinct items. B-off allows still wake/publish under ordinary existing routing (not new B authority). Every unsupported argument refuses even with an allowing outer; this is not a blanket-refuse fix because all supported allow controls succeed.
| Shape | B | Outer allow: verdict / A,B,store,wake,pub | Queue deny | Foreign deny |
| --- | --- | --- | --- | --- |
| helper | false | accepted / 2,0,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| helper | true | accepted / 2,2,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| direct explicit outer | false | accepted / 2,0,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| direct explicit outer | true | accepted / 2,2,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| detached with explicit outer | false | accepted / 2,0,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| detached with explicit outer | true | accepted / 2,2,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| wrong receiver with explicit outer | false | accepted / 2,0,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| wrong receiver with explicit outer | true | accepted / 2,2,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| frozen spread | false | accepted / 2,0,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| frozen spread | true | accepted / 2,2,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| nested forks | false | accepted / 2,0,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| nested forks | true | accepted / 2,2,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| framework wrapper | false | accepted / 2,0,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| framework wrapper | true | accepted / 2,2,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| non-frozen copy control | false | accepted / 2,0,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| non-frozen copy control | true | accepted / 2,2,2,2,2 | admission_not_ready / 0,0,0,0,0 | admission_stale / 0,0,0,0,0 |
| detached without argument | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| detached without argument | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| wrong receiver lost argument | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| wrong receiver lost argument | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| missing outer | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| missing outer | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| malformed outer | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| malformed outer | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| bare capture explicit argument | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| bare capture explicit argument | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| issued ancestor explicit argument | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| issued ancestor explicit argument | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| arrow forwarder loses argument | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| arrow forwarder loses argument | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| unregistered check override | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| unregistered check override | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| mutated check | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| mutated check | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| mutated admit | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| mutated admit | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| mutated key | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| mutated key | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| mutation after fork | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| mutation after fork | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| removed factory | false | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |
| removed factory | true | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 | admission_missing / 0,0,0,0,0 |

An independent exact raw-arrow variant hands the unregistered `forItem: () => inner.forItem()` object directly to the real registry (no pre-validation in the interposer): `r3-raw-arrow`, 2/2 pass, six allow/deny/B rows, all exact admission_missing with zero effects (`raw-arrow-real-path.test.mjs`, `full-raw-arrow.log`). This supplements—not replaces—the committed suite and matches the reviewer forwarder entry shape.

In addition, each actual framework composer (push/event, inference/request, channels/incoming) is tested B off/on with direct forks, then queue-closed→admission_not_ready and foreign-connection→admission_stale controls. Allowed controls reach A exactly once; deny controls reach neither A nor B; inference retains its existing no-reply-consumer lane semantics. Existing direct-call tests also check outer guards after A awaits and before B consumption. Per-item stale/replacement/unknown/unreadable and receipt-mapping tests remain green.

### Mutants

`r3-mutants` harness exit0; **19/19 killed**. Every child: exit1, **1total/0pass/1fail/0skip/0cancel**, its exact named test fails (not a cancellation/timeout). Exact patches/argv/names/counts in `mutants.py`, `mutants.json`, each `mutant-*.log`. Five ignored compiled files restored byte-for-byte in finally (`mutant-restoration.json`); no mutant entered source/commit. Structural fallback mutant deliberately removes both factory membership/lineage and use-time context validation, rather than claiming a redundant individual check alone constitutes the boundary.

| Mutant | Named killing test |
| --- | --- |
| shared-ref | `batch preprobe: an invalidated sibling must not poison fresh unrelated registration` |
| drop-epoch | `view epoch invalidation is synchronous` |
| mutable-reference | `view returns detached deeply immutable descriptors and sidecars` |
| current-not-captured | `real framework push/event: captured generation rechecked after admission await` |
| lazy-register | `real framework protected push never lazy-registers` |
| per-item-epoch | `scope batch B=false: real epoch change refuses all old items and never reads a new key per item` |
| pin-same-channel-generation | `scope batch B=false: same-channel updated replacement ready scope admits the new generation` |
| unready-scope | `scope batch B=false: same-channel updated replacement pending scope refuses before A` |
| drop-outer-composition | `direct per-item fork retains outer queue and connection checks before and after awaits, including B` |
| lose-B-argument | `issued fork B=true: direct explicit outer allow and deny controls before effects` |
| receiver-instead-of-parameter | `issued fork B=false: detached with explicit outer allow and deny controls before effects` |
| remove-fail-closed-arm | `issued fork B=false: issued ancestor explicit argument allow and deny controls before effects` |
| identity-validation | `issued fork B=false: mutated check allow and deny controls before effects` |
| unissued-outer-structural-fallback | `issued fork B=false: bare capture explicit argument allow and deny controls before effects` |
| blanket-refusal | `issued fork B=false: helper allow and deny controls before effects` |
| lost-factory-fallback | `issued fork B=false: removed factory allow and deny controls before effects` |
| framework-binding-push-event | `framework binding push/event B=false: direct fork allow, queue and foreign-connection deny` |
| framework-binding-inference-request | `framework binding inference/request B=false: direct fork allow, queue and foreign-connection deny` |
| framework-binding-channels-incoming | `framework binding channels/incoming B=false: direct fork allow, queue and foreign-connection deny` |

**LOW-3 stays open:** the per-item-epoch mutant is only discriminated by white-box fork/key association. It refreshes the key but retains the old full guard; both old items still visibly refuse and cause no store/publication. Adaptation only makes the existing instrumentation/constructor respect issued identities, not new production observability. Host input.connection is checked for items actually reaching A. No claim that LOW-3 is fixed.

### Profile-off corpus / failures retained separately

Configured final-head serialized differential: base/head/cmp0/0/0, producer/capture0/0, no cap; complete JSONs **28865bytes**, SHA **`ddc883dd5bb2bf754135bc20fc1841cdc7f62238161e1c5ab84e04ab1e716ff6`** on both trees. Same3 off profiles/21RPC/26logical rows, fixed ports45071–45073, deterministic clock/UUID/random, per-request draining, no field stripping. `profile-off-serialized-{base,head}.json`, script, `full-profile-off-configured.log`. No claimed physical store-file or all-schedule proof.

Current round initial differential invocation failed1 (both children1, cmpnotrun, producer/capture1/0, no cap, non-TAP countsN/A): AF_CORPUS_PORT was omitted, causing exact `RangeError [ERR_SOCKET_BAD_PORT]` with NaN before either fixture started. Raw `full-profile-off.log` and failed receipt retained. Corrected-input configured gate is separate, not an unchanged rerun for green. Current development first new-suite run failed1:68total/66pass/2fail/0skip/0cancel; names `framework binding inference/request B=false: direct fork allow and foreign-connection deny` and B=true counterpart. Test input omitted required host inferenceRouting; routing refusal was correct. Added explicit existing policy; no production fallback weakened. Later gates qualify corrected fixtures.

Earlier failed evidence remains failed, not erased:
- First uncontrolled differential in `run-01M67MDC3Y7G9B9R6R58KVBMWD/evidence`: base/head children0/0, cmp1, countsN/A; `profile-off-first.diff` retained (independent endpoint/random/scheduling inputs). Serialized later parity does not negate it.
- Prior `run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/batch-dev.log`: exit1,18total/16pass/1fail/0skip/1cancel; named B=false real-epoch-change test condition-not-settled60s then filetimeout120s; reconnect fixture configured after startup snapshot. Historical, not a current green receipt.
- Prior round replacement-preprobe omitted isReplyIntent, exit1/TypeError; corrected-input result separately retained in its report. No behavioral verdict inferred from invalid input.

### Actual declaration/export deltas

Package exports only root `.` (import/types/bun); both CLI entry declarations are empty `export {}`; new context module not root-exported and package deep import refuses ERR_PACKAGE_PATH_NOT_EXPORTED. Runtime root names byte-identical (`exports-c09.json`, `exports-r3.json`). Conservative relative-import declaration closure: B90 files, c09/r3 both91; new registration-ingress.d.ts **not reachable**. RequiredIngress was already reachable through exported McplServerConnection.admissionFor; unpublished status is not the permission.

**A: B29edcf8b → pre-r3c09**, the actual full earlier scoped declaration delta (not “one member”). Saved `declarations-B-to-c09.patch`:
```diff
--- B/index.d.ts
+++ c09/index.d.ts
@@ -61,4 +61,5 @@
 export type { InboundAdmissionConfig, AdmissionInput, AdmissionVerdict, AdmitInbound, AdmissionLane, ConnectionKey, RefusalCode } from './mcpl/inbound-admission.js';
 export { admissionOf, AdmissionConnectError, MAX_ADMISSION_TIMEOUT_MS, MAX_PENDING_ADMISSIONS, type AdmittedEnvelope } from './mcpl/inbound-admission.js';
 export type { ReplyDestination, ReplyAuthorityConfig } from './mcpl/reply-routing.js';
+export type { RegistrationRef, RegistrationView, RegistrationDescriptor, RegistrationScopeConfig, VerifiedRegistrationScope, ReadonlyData } from './mcpl/registration-view.js';
 //# sourceMappingURL=index.d.ts.map
--- B/mcpl/channel-registry.d.ts
+++ c09/mcpl/channel-registry.d.ts
@@ -1,3 +1,4 @@
+import { type AcceptedRegistration } from './registration-view.js';
 import { type ReplyBinding } from './reply-routing.js';
 /**
  * ChannelRegistry — manages MCPL channel lifecycle, incoming messages, and
@@ -67,6 +68,7 @@
 export declare function desiredStateInLog(store: JsStore, serverId: string, channelId: string): DesiredChannelState | undefined;
 /** A registered channel entry, keyed by its server and id (destinationKey). */
 interface ChannelEntry {
+    registration?: AcceptedRegistration;
     serverId: string;
     descriptor: ChannelDescriptor;
     /** Whether the current target is confirmed open; false can be unconfirmed. */
@@ -576,6 +578,9 @@
      *  decided open or tuned out that no update has given a target
      *  (handleIncoming). */
     private registerEntry;
+    private acceptRegistration;
+    /** Internal source for the epoch-bound read view, not a mutable registry API. */
+    registrationAt(serverId: string, channelId: string): AcceptedRegistration | undefined;
     private hasPendingLifecycle;
     private handleCoalescedIncoming?;
     private acceptInbound?;
--- B/mcpl/inbound-admission.d.ts
+++ c09/mcpl/inbound-admission.d.ts
@@ -1,3 +1,5 @@
+/** Host-owned, opt-in admission. No wire metadata can create this authority. */
+import { RegistrationScopes, type RegistrationScopeConfig, type RegistrationView } from './registration-view.js';
 import type { ChannelIncomingMessage, PushEventParams, McplInferenceRequestParams } from './types.js';
 export declare const MAX_ADMISSION_TIMEOUT_MS = 60000;
 export declare const MAX_PENDING_ADMISSIONS = 64;
@@ -36,10 +38,11 @@
 export type AdmitInbound = (input: AdmissionInput) => AdmissionVerdict | Promise<AdmissionVerdict>;
 export interface InboundAdmissionConfig {
     readonly timeoutMs: number;
-    readonly bind: (key: ConnectionKey) => Readonly<{
+    readonly bind: (key: ConnectionKey, registrations?: RegistrationView) => Readonly<{
         connection: ConnectionKey;
         admit: AdmitInbound;
     }> | undefined;
+    readonly registrationScope?: RegistrationScopeConfig;
     readonly isReplyIntent: (value: unknown) => boolean;
     readonly initializeAttestation?: Readonly<{
         read: (result: DeepReadonly<unknown>) => unknown;
@@ -68,11 +71,14 @@
 export declare function wakeForbidden(event: object): boolean;
 export interface RequiredIngress {
     readonly key: ConnectionKey;
+    /** Item fork composes the receiver's outer checks on the original transport key. */
+    readonly forItem?: (this: RequiredIngress) => RequiredIngress;
     check(): RefusalCode | undefined;
     admit(lane: AdmissionLane, item: unknown, signal?: AbortSignal): Promise<AdmissionVerdict>;
 }
 export declare class RequiredAdmission {
     readonly connectionId: string;
+    readonly registrations?: RegistrationScopes;
     readonly instance: symbol;
     private key?;
     private binding?;
--- B/mcpl/registration-view.d.ts
+++ c09/mcpl/registration-view.d.ts
@@ -0,0 +1,67 @@
+/** Host-only registration identity and verified sidecars. Never persisted or sent. */
+import { type ConnectionKey, type RequiredIngress } from './inbound-admission.js';
+import type { ChannelDescriptor } from './types.js';
+declare const registrationIdentity: unique symbol;
+export type RegistrationRef = Readonly<{
+    [registrationIdentity]: true;
+}>;
+export type ReadonlyData = null | undefined | string | number | boolean | readonly ReadonlyData[] | {
+    readonly [key: string]: ReadonlyData;
+};
+type DeepReadonly<T> = T extends object ? {
+    readonly [K in keyof T]: DeepReadonly<T[K]>;
+} : T;
+export type RegistrationDescriptor = DeepReadonly<ChannelDescriptor>;
+/** Facts are supplied by the configured authenticated verifier, not inferred by AF. */
+export interface VerifiedRegistrationScope {
+    readonly accountId: string;
+    readonly kind: 'joined' | 'dm' | 'sub-conversation';
+    readonly readable: boolean;
+    readonly joined?: boolean;
+    readonly dmUserId?: string;
+    readonly parent?: RegistrationRef;
+    readonly mappingGeneration: ReadonlyData;
+}
+export interface RegistrationView {
+    lookup(channelId: string): Readonly<{
+        ref: RegistrationRef;
+        descriptor: RegistrationDescriptor;
+        scope?: VerifiedRegistrationScope;
+    }> | undefined;
+    current(ref: RegistrationRef): boolean;
+}
+export interface RegistrationScopeConfig {
+    readonly timeoutMs: number;
+    /** No network effects or framework mutation. Native verification precedes registration. */
+    readonly project: (key: ConnectionKey, candidate: RegistrationRef, descriptor: RegistrationDescriptor, signal: AbortSignal, registrations: RegistrationView) => VerifiedRegistrationScope | undefined | Promise<VerifiedRegistrationScope | undefined>;
+}
+/** Internal record on the actual ChannelRegistry entry; not a second registry. */
+export interface AcceptedRegistration {
+    readonly ref: RegistrationRef;
+    readonly connection: ConnectionKey;
+    readonly descriptor: RegistrationDescriptor;
+    scope?: VerifiedRegistrationScope;
+    ready: boolean;
+    invalidate(): void;
+}
+/** One service per protected connection; each bind issues a separate view. */
+export declare class RegistrationScopes {
+    private readonly config;
+    private readonly refs;
+    private readonly pending;
+    private epoch?;
+    private source;
+    constructor(config: RegistrationScopeConfig);
+    setSource(source: (id: string) => AcceptedRegistration | undefined): void;
+    invalidate(): void;
+    bind(key: ConnectionKey, live: () => boolean): RegistrationView;
+    /** Called only by accepted register/changed, never by ingress or a push placeholder. */
+    accept(descriptor: ChannelDescriptor): AcceptedRegistration | undefined;
+    get view(): RegistrationView | undefined;
+}
+/** Capture before A; its existing post-A/B checks also check this exact generation. */
+export declare function withRegistrationScope(admission: RequiredIngress, view: RegistrationView | undefined): RequiredIngress;
+/** Fork only registration capture, retaining every outer batch/host check. */
+export declare function registrationAdmissionForItem(admission: RequiredIngress | undefined): RequiredIngress | undefined;
+export {};
+//# sourceMappingURL=registration-view.d.ts.map```

**B: c09 → r3**, only approved existing forItem signature/comment, no unrelated reachable member/type/export delta. Saved `declarations-c09-to-r3.patch`:
```diff
--- c09/mcpl/inbound-admission.d.ts
+++ r3/mcpl/inbound-admission.d.ts
@@ -71,8 +71,8 @@
 export declare function wakeForbidden(event: object): boolean;
 export interface RequiredIngress {
     readonly key: ConnectionKey;
-    /** Item fork composes the receiver's outer checks on the original transport key. */
-    readonly forItem?: (this: RequiredIngress) => RequiredIngress;
+    /** Fork with an issued outer context (or a function-preserving copy); invalid outer refuses admission_missing. */
+    readonly forItem?: (outer: RequiredIngress) => RequiredIngress;
     check(): RefusalCode | undefined;
     admit(lane: AdmissionLane, item: unknown, signal?: AbortSignal): Promise<AdmissionVerdict>;
 }
```

Supplemental B→r3 aggregate patch and complete per-file declaration text snapshots are also saved. The internal compositor is not a new root-public context API.

### Matched full cells — exact outcomes

Only the two new head cells were run in this round, sequentially once each; B rows are labelled **reused**. No timeout/SIGPIPE/cap/capture error occurred. All failure-name lists are empty. Counts order below is total/pass/fail/skip/cancelled. Each row preserves separate producer/capture exits and receipt path; `matrix-results.json` includes full log hashes.

| Cell | Use / source | T/B/test exits | Gate | Producer / capture | Total / pass / fail / skip / cancelled | Bytes / cap |
| --- | --- | --- | ---: | --- | --- | --- |
| 22.23.3-base | **reused B29edcf8b** | 0/0/0 | 0 | 0/0 | 9767 / 9704 / 0 / 63 / 0 | 4316588 / no |
| 22.23.3-head | fresh new head | 0/0/0 | 0 | 0/0 | 9914 / 9851 / 0 / 63 / 0 | 4362828 / no |
| 22.12.0-base | **reused B29edcf8b** | 0/0/0 | 0 | 0/0 | 9767 / 9704 / 0 / 63 / 0 | 4152093 / no |
| 22.12.0-head | fresh new head | 0/0/0 | 0 | 0/0 | 9914 / 9851 / 0 / 63 / 0 | 4196303 / no |

- 22.23.3-base: log `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/full-22.23.3-base.log`; receipt `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/gate-fix-22.23.3-base-01M67V69RWMFMJPJCWCS5NJ654.log`.
- 22.12.0-base: log `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/full-22.12.0-base.log`; receipt `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/gate-fix-22.12.0-base-01M67XCYYEBRAJKWKAV6APD6PV.log`.
- 22.23.3-head: log `/home/orgasmic/.orgasmic/runs/run-01M6832514GX6VMH3AZ46W99KS/evidence/full-22.23.3-head.log`; receipt `/home/orgasmic/.orgasmic/runs/run-01M6832514GX6VMH3AZ46W99KS/evidence/gate-r3-22.23.3-head-01M6846ZNX6657NWQJXQTK6A3Q.log`.
- 22.12.0-head: log `/home/orgasmic/.orgasmic/runs/run-01M6832514GX6VMH3AZ46W99KS/evidence/full-22.12.0-head.log`; receipt `/home/orgasmic/.orgasmic/runs/run-01M6832514GX6VMH3AZ46W99KS/evidence/gate-r3-22.12.0-head-01M684E6CGPHK80VXZAXABQGDW.log`.

### Current-round gate catalogue (development failures are not hidden)

All commands are in the named scripts/gate logs; bounded wrapper source and the exact full-cell sequencer are retained. Counts N/A denotes non-TAP, not an assumed pass. All cap results are no. Supplemental failure names are enumerated below and in `gate-catalogue.json`; none in final qualification gates. Mutant harness's TAP children are enumerated separately, not misreported as passing tests.

| Gate | Gate exit | Producer / capture | Total / pass / fail / skip / cancelled | Bytes | Receipt |
| --- | ---: | --- | --- | ---: | --- |
| baseline-receiver-counterexample | 0 | 0/0 | N/A | 9110 | `gate-baseline-receiver-counterexample-01M683A3RAACMGRWTG9AKRBEQW.log` |
| r3-dev-build | 0 | 0/0 | N/A | 513 | `gate-r3-dev-build-01M683WFGNEYXMH6GSHRY2A3YA.log` |
| r3-test-development | 1 | 1/0 | 68/66/2/0/0 | 60985 | `gate-r3-test-development-01M683Y29836AQJ0MCVDY9ZM76.log` |
| r3-focused-development | 0 | 0/0 | 145/145/0/0/0 | 84532 | `gate-r3-focused-development-01M683ZJBGMA29NCK1GXF7WEK4.log` |
| r3-complete-development | 0 | 0/0 | 147/147/0/0/0 | 86820 | `gate-r3-complete-development-01M6842EG3HAHC1D65MNVX4PAH.log` |
| r3-focused | 0 | 0/0 | 217/217/0/0/0 | 104606 | `gate-r3-focused-01M6844KP6P25RFFE59JS56H0B.log` |
| r3-mutants | 0 | 0/0 | N/A | 14606 | `gate-r3-mutants-01M6845B6VZRR7K1W698KJ2Y6K.log` |
| r3-profile-off | 1 | 1/0 | N/A | 1441 | `gate-r3-profile-off-01M6845YDZEXW6VPJ2XKS0STEQ.log` |
| r3-profile-off-configured | 0 | 0/0 | N/A | 3870 | `gate-r3-profile-off-configured-01M6846PS394J8QJWNYDH46Z79.log` |
| r3-raw-arrow | 0 | 0/0 | 2/2/0/0/0 | 1888 | `gate-r3-raw-arrow-01M684N0TVGH8R0AHGEV7CHE91.log` |
| r3-final-metadata | 0 | 0/0 | N/A | 1826 | `gate-r3-final-metadata-01M684NVEWVW7VJG3FBSKE6C6X.log` |

Development test failure names (exact):
- `framework binding inference/request B=false: direct fork allow and foreign-connection deny` (`test-development`).
- `framework binding inference/request B=true: direct fork allow and foreign-connection deny` (`test-development`).

`r3-dev-build`: absolute Node preflight then npm typecheck/build. `r3-test-development`: build + two registration files (invalid inference input). `r3-focused-development`: corrected build + three registration files + lifetime probe. `r3-complete-development`: typecheck/build + final three registration files before commit. These dirty-tree receipts are development evidence, not substitutes for final frozen-head focused/full gates. `r3-final-metadata` after full cells verifies final source pin/clean tree, absolute Node preflight, all binding hashes, unchanged A test inputs against B, exact allowed declaration delta, CLI declaration emptiness, preserved profile-off/fixture hashes and restored compiled outputs. Each non-TAP component exited0 except the explicitly retained failed port invocation.

### Historical full-cell observations (not new-head qualification)

`historical-cells.json` preserves exact source logs/receipts and failure-name lists (all empty). Earlier unbounded22.23.3 cells stay historical **with no whole-command bound**. The continuation's bounded22.12.0 method change applies only to those new cells, not retroactively. The 47f3b4f2 head22.23.3 dispatch sequencer/owner died; complete stage/TAP log exists but its completion receipt is **missing**, so no receipt-based overall exit is asserted and it was not rerun. Historical B receipts in that first pair are not used for current reuse; the later bounded B cells are.

| Historical round / pin | Node / tree | T/B/test | Gate exit | Producer/capture | Total/pass/fail/skip/cancelled | Bound / receipt |
| --- | --- | --- | --- | --- | --- | --- |
| original/continuation / 29edcf8b | 22.23.3 base | 0/0/0 | 0 | not separately recorded | 9767/9704/0/63/0 | none / present |
| original/continuation / 47f3b4f2 | 22.23.3 head | 0/0/0 | missing | not separately recorded | 9844/9781/0/63/0 | none / missing, log only |
| original/continuation / 29edcf8b | 22.12.0 base | 0/0/0 | 0 | 0/0 | 9767/9704/0/63/0 | 3000s + TERM; 60s KILL grace / present |
| original/continuation / 47f3b4f2 | 22.12.0 head | 0/0/0 | 0 | 0/0 | 9844/9781/0/63/0 | 3000s + TERM; 60s KILL grace / present |
| batchfix / 29edcf8b | 22.23.3-base | 0/0/0 | 0 | 0/0 | 9767/9704/0/63/0 | 3000s/60s/64MiB / present |
| batchfix / 39c76401 | 22.23.3-head | 0/0/0 | 0 | 0/0 | 9862/9799/0/63/0 | 3000s/60s/64MiB / present |
| batchfix / 29edcf8b | 22.12.0-base | 0/0/0 | 0 | 0/0 | 9767/9704/0/63/0 | 3000s/60s/64MiB / present |
| batchfix / 39c76401 | 22.12.0-head | 0/0/0 | 0 | 0/0 | 9862/9799/0/63/0 | 3000s/60s/64MiB / present |
| fix2 / c09aca30 | 22.23.3-head | 0/0/0 | 0 | 0/0 | 9866/9803/0/63/0 | 3000s/60s/64MiB / present |
| fix2 / c09aca30 | 22.12.0-head | 0/0/0 | 0 | 0/0 | 9866/9803/0/63/0 | 3000s/60s/64MiB / present |

Historical nonmatrix gate commands, counts, named failures and receipts remain in the original frozen validation and prior implementation reports under the evidence roots above; none is promoted to a fresh head pass. In particular the first differential, development epoch failure, invalid-config probe and missing historical receipt stay explicit, rather than being overwritten by later green gates.

### Owned surviving-process reconciliation

After the set and again after final metadata: **0 matching live processes, 0 read errors**. All own matrix/probe/development/metadata scopes are inactive with no control group. `process-audit-during-22-23.json`, `process-audit-during-22-12.json` and `tracked-processes.json` capture live scope membership plus PID/kernel start ticks, parent/PGID/session and activation timestamps. Final results: `process-audit-after-set.json`, `process-audit-final.json`. No fixture survivor was killed; this is scoped/tracked-identity observation, not a timeout-based inference or a claim about unrelated processes. Source reports/evidence remain outside the worktree; builds only in ignored dist.

## Unmet Criteria

None for the covered r3 fix. The new head is locally committed and clean; all supported allow/deny controls, bare/arrow/invalid/identity-mutation refusals,19 mutants, unchanged A/B tests, lifetime/public API audits, repeated fixed-hash profile-off differential and both fresh full head cells are complete. B reuse is explicitly qualified by identical bindings. No new unrelated reachable declaration delta or legitimate in-tree composition break requiring STOP was found. LOW-3 remains intentionally open as instructed, not represented as fixed.

## Residual Risk

- Supported issued composition is enforced, including the real weaker bare receipt; arbitrary trusted internal code modification or direct invocation outside this fork contract is not sandboxed. The host's native permissions remain its own responsibility; bookkeeping never supplies them.
- LOW-3: non-A-reaching epoch provenance is white-box-only. No new production-observable assertion is claimed.
- Same dependency bytes are shared by construction, not independently resolved installs. npm-ls resolution-context differences and lack of repository lock remain explicit.
- Finite invented-ID tests and serialized logical corpus do not prove every schedule, native truth, physical store-file byte equality or host/native-tool/send-time qualification. The first failed differential remains separate evidence. Original 47f3b4f2 head22.23.3 missing receipt remains missing.

Remaining work estimate: **0 AF implementation/qualification work under this fix brief**; bounded delta review approximately **0.5–1 engineer-hour**. LOW-3 observability and host/native integration qualification remain separate scoped work. No push, land/merge, repin, release or activation performed.
