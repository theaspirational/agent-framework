# TASK-HVQ8K — fix round 1

## Changed

Read `/srv/review-drop/TASK-HVQ8K-REVIEW1.md` in full and verified each finding against the reviewed source before editing. Work remains local on `task-hvq8k-impl`, based on upstream `4a45766f019fa11c8699645bd6806ebf3e13e5d1`. Final HEAD: **`02ee294731a2e171aa0eae7533f7ec7b7129a2c0`**. No push, PR, external messages, merge, landing or dispatch close.

### Per-finding disposition

| Finding | Fix / verification | Final file:line |
| --- | --- | --- |
| MEDIUM-1: standalone `tools/hints` bypassed required admission | Required connections now refuse before the read tap: request error `-32600`, fixed `admission_unsupported`; notifications are discarded. No admission hook runs. The unconfigured tap branch is unchanged. A real WebSocket test uses an actively declaring toolset peer, removes its grant, and asserts zero hooks/taps, unchanged revision and no recovery timer; the unconfigured control still changes revision, schedules recovery and answers `{}`. | `src/mcpl/server-connection.ts:2510–2527`; `test/mcpl-admission-lifecycle.test.ts:277–302`; `docs/required-inbound-admission.md:38–42` |
| MEDIUM-2: ordinary required-server outage aborted the framework | Only `AdmissionConnectError` (binder/attestation) adds an admission-specific fatal-startup condition. A required server with an unreachable executable now permits framework create/start with no binder call; missing binder still aborts. | `src/framework.ts:32038–32041`; `test/mcpl-admission-lifecycle.test.ts:267–275,304–312`; `docs/required-inbound-admission.md:11–14`; `changelog.d/required-inbound-admission.added.md:5–8` |
| LOW: capability wire-message mismatch / lost notification log | Extracted the existing refusal formatting into one private helper used by both paths. The original code, full message, data object and notification diagnostic are preserved. All three lanes now assert the full peer error and the notification log, not just `-32002`. | `src/mcpl/server-connection.ts:468–477,1031,1068`; `test/mcpl-admission-lifecycle.test.ts:170–183` |
| LOW: data-only/accessor guard lacked killing witnesses | Added accessor-on-`replyIntent`, non-enumerable optional intent, and non-enumerable extra-member rows, ordinary and coalesced. Invalid data must not invoke the intent validator. Weakening the descriptor guard now fails four rows. The unknown extra-member row alone remains protected by whole-shape validation, so the additional non-enumerable *allowed* member isolates enumerability. | `test/mcpl-required-admission.test.ts:19–21,32–43`; guarded production code unchanged at `src/mcpl/inbound-admission.ts:53` |
| M15 survivor: receipt guard | Real WebSocket requests with null, number and string params refuse before any event listener or hook. A separately labelled direct-emit boundary test supplies an object without a transport receipt, isolating the presence arm from the downstream fallback. Both whole-guard removal and presence-only removal are killed. | `test/mcpl-admission-lifecycle.test.ts:314–332`; production guard unchanged at `src/mcpl/server-connection.ts:1038` |
| M16 survivor: decision downgrade | Two labelled later-policy-boundary tests start with both host verdict and earlier gate true, inject a later false policy decision, then assert the module sees `triggerInference: false` and cannot wake. Removing the downgrade fails both rows. No production change needed. | `test/mcpl-admission-compatibility.test.ts:59–74`; existing downgrades `src/framework.ts:17220,19083` |
| LOW: PR-facing workplan labels | Removed slice letters and the base SHA from docs/changelog. Capability wording says stamp support arrives with context-only delivery and a full MCPL pin follows separately. Also clarified that private intent is accessible to host modules, not hidden from host code. | `docs/required-inbound-admission.md:21–26,67–75`; `changelog.d/required-inbound-admission.added.md:4–8` |
| LOW: connector-named startup clause | The admission-specific fatal condition is a separate statement. The pre-existing accounting-error branch is restored unchanged; no new admission condition shares it. | `src/framework.ts:32038–32041` |
| LOW: mixed fixup commit series | Rebuilt the series as shared core, one complete commit per lane, shared lifecycle/no-hook tests, and docs. Later commits do not fix up runtime code in earlier lanes. Each lane patch independently applies to the shared core (temporary-index check; no worktree modification). | Commit table below; `final-lane-patch-wrapper.log` |

### New commit series

All six commits have **author and committer** `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` and trailer `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`.

| Commit | Purpose |
| --- | --- |
| `5789ca60` | Shared opt-in core, connection/epoch binding, initialization, limits, hint refusal, capability diagnostics, startup policy and 30 shared transport/setup tests. Required data lanes remain closed until their individual adapters are installed. |
| `ed327072` | Channel adapter and framework wiring, registration rechecks, wake downgrade, 31 real-transport channel tests. |
| `0d745887` | Push adapter and framework wiring, authorization-before-hints order, pre-effect admission, coalesced envelope carriage, 11 push tests. |
| `f5df955f` | Inference adapter and framework wiring, loop/authority recheck and false-wake refusal, five inference tests. |
| `e33e1639` | Remaining cross-lane lifecycle tests, no-hook compatibility and mutation-sensitive wake-policy witnesses; no runtime changes. |
| `02ee2947` | User-facing capability/compatibility documentation and required changelog fragment. |

Lane commits depend on shared core. Their patches were independently checked against that core, so another lane is not a patch prerequisite. This is a clean-application check, not a claim that every arbitrary subset received a full suite. Full qualification covers the complete final tree. The final tree matches all 18 file hashes captured before history reconstruction (`fix1-final-tree-hashes.json`); no test-only mutation entered a commit. A local recovery ref, `task-hvq8k-reviewed-before-fix1`, retains the reviewed HEAD; it was not pushed.

### Files / line counts

Against reviewed `632f2e87`: **seven files, +136/-29**. Against upstream base: **18 files, +1101/-21**. Full author/dependency/file inventory: `final-environment-and-files.txt`. No dependency manifest, storage schema, connector adapter or SPEC change.

| File changed this round | Added / removed vs reviewed HEAD |
| --- | ---: |
| `src/framework.ts` | +5 / -2 |
| `src/mcpl/server-connection.ts` | +21 / -8 |
| `test/mcpl-required-admission.test.ts` | +6 / -3 |
| `test/mcpl-admission-lifecycle.test.ts` | +65 / -1 |
| `test/mcpl-admission-compatibility.test.ts` | +17 / -0 |
| `docs/required-inbound-admission.md` | +17 / -13 |
| `changelog.d/required-inbound-admission.added.md` | +5 / -2 |

### Refusal matrix updates

The existing three-lane matrix remains covered by the six admission files: denial, throw, timeout/late result, invalid verdict, stale authority, missing binding, pre-ready work, and wake ceiling. Channel results are itemwise; push refusal results are `{accepted:false,reason}`; inference admission errors are `-32600` with a fixed reason. Refused data never reaches the lane's admitted effects.

| Case | Required profile | Unconfigured profile |
| --- | --- | --- |
| Standalone peer `tools/hints` request | `-32600 admission_unsupported`, before tap/state/recovery; zero hook calls | Existing `{}` response and tap/state/recovery behavior |
| Hinted push, authorized feature | `admission_unsupported`; no tap or hook | Existing path |
| Hinted push, unauthorized feature | Existing feature error wins; no tap or hook | Existing path |
| Missing capability | Original `-32002` message and data; notifications retain original diagnostic | Same original message/data/diagnostic |
| Missing/wrong binder or failed attestation | Terminal admission setup error; startup aborts | No admission setup |
| Ordinary connect/launch failure | Existing non-fatal startup and configured reconnect policy; unavailable connection admits nothing | Existing policy |
| Non-object push params / object without original receipt | `admission_missing` before dispatch/hook | No new strict guard |
| Accessor/non-enumerable host verdict data | `admission_invalid`; no intent validation or admitted effect | No host preflight |
| Later policy veto after a true host ceiling and true earlier gate | Module-visible wake permission downgraded; no promotion | Existing behavior unchanged |

## Verification Gates

All completion gates are run anew on final HEAD, not inherited from the earlier run. `/opt/node/bin` is Node **22.23.3**; `/tmp/credential-engines/node-v22.12.0-linux-x64/bin` is Node **22.12.0** (npm **10.9.0**, versus **10.9.9** with 22.23.3). Prefixing `PATH` for npm gates selects the named engine for npm and its test subprocesses. Builds stay in the worktree's ignored `dist/`; evidence contains logs/scripts only.

Let `A` denote the explicit six-file argument list:
```
dist/test/mcpl-required-admission.test.js
dist/test/mcpl-required-push-admission.test.js
dist/test/mcpl-required-inference-admission.test.js
dist/test/mcpl-admission-lifecycle.test.js
dist/test/mcpl-admission-no-hook.test.js
dist/test/mcpl-admission-compatibility.test.js
```
Every row is wrapped as `orgasmic dispatch gate <name> -- <command>`; logs below are relative to this report directory.

| Gate name / command after `--` | Outcome | Receipt |
| --- | --- | --- |
| `typecheck-node22-23-fix1` / `env PATH="/opt/node/bin:$PATH" npm run typecheck` | PASS | `gate-typecheck-node22-23-fix1-01M64369T1000D987YPY3KE2V6.log` |
| `build-node22-23-fix1` / `env PATH="/opt/node/bin:$PATH" npm run build` | PASS | `gate-build-node22-23-fix1-01M6436A8PNH9Z2222ZHQM0PM5.log` |
| `npm-test-node22-23-fix1` / `env PATH="/opt/node/bin:$PATH" AF_TEST_CONCURRENCY=4 npm test` | **PASS: 9,354 tests; 9,291 pass, 0 fail, 63 skipped; 497 suites; 459.803 s** | `gate-npm-test-node22-23-fix1-01M6436FYR277MXDZ0VC246Z6Q.log` |
| `admission-node22-23-fix1` / `/opt/node/bin/node --test --test-concurrency=1 --test-force-exit A` | **138 pass, 0 fail, 0 skipped** | `gate-admission-node22-23-fix1-01M6436SD661AB2HFDSFCJ2HEA.log` |
| `typecheck-node22-12-fix1` / `env PATH="/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH" npm run typecheck` | PASS | `gate-typecheck-node22-12-fix1-01M643PAH03AMD5VDXDR7A4YW1.log` |
| `build-node22-12-fix1` / `env PATH="/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH" npm run build` | PASS | `gate-build-node22-12-fix1-01M643PAXQ8N2RCHW93V4D6ZNT.log` |
| `npm-test-node22-12-fix1` / `env PATH="/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH" AF_TEST_CONCURRENCY=4 npm test` | **PASS: 9,354 tests; 9,291 pass, 0 fail, 63 skipped; 497 suites; 468.094 s** | `gate-npm-test-node22-12-fix1-01M643PGH24EGRSDK151VPYEP0.log` |
| `admission-node22-12-fix1` / `/tmp/credential-engines/node-v22.12.0-linux-x64/bin/node --test --test-concurrency=1 --test-force-exit A` | **138 pass, 0 fail, 0 skipped** | `gate-admission-node22-12-fix1-01M643PTAKBWZA7N9NP8NYCZY9.log` |
| `connector-delta-fix1` / `/opt/node/bin/node "$ORGASMIC_EVIDENCE_DIR/check-connector-delta.mjs"` | PASS: nine runtime files, zero new connector-specific AST values/identifiers; 322 old sites inventoried | `gate-connector-delta-fix1-01M64374APHJW8Z61PM5MP6N4Z.log` |
| `lane-patch-independence-fix1` / `python3 "$ORGASMIC_EVIDENCE_DIR/check-lane-patches.py"` | PASS: each of three lane patches applies independently to shared core | `gate-lane-patch-independence-fix1-01M64394KXVAR6A32PYSM1CS3A.log` |

Admission file counts: channel **31**, push **11**, inference **5**, lifecycle **62**, no-hook **4**, compatibility **25**; total **138**, up from 123. New tests comprise six data-only rows, seven lifecycle/transport rows and two later-policy rows; three existing authorization tests now assert full messages and notification diagnostics. `git diff --check` passed (non-receipted formatting check). Focused durations: 18.796 s on Node 22.23.3 and 22.827 s on Node 22.12.0. Full/scoped command ownership and wrapper transcripts are retained as `final-*-owner.txt` and `final-*-wrapper.log`.

### Red-before and mutation evidence from this round

Tests were written and built before fixing runtime code. These are deliberate failures, not remaining regressions:

| Probe | Result | Receipt |
| --- | --- | --- |
| Real-transport hints / ordinary outage / full capability-error assertions on reviewed runtime | **1 pass, 5 fail**: required hints, required outage and all three capability messages fail; unconfigured hints control passes | `gate-fix1-red-behavior-01M642KF9ZRSG87TJ9SCKZ0TEB.log` |
| Same behavior tests plus retained missing-binder terminal case after fixes | **7 pass, 0 fail** | `gate-fix1-green-behavior-01M642RKV0EYC84MB86Y5MBS6X.log` |
| M12: remove accessor/enumerability descriptor guards | **2 pass, 4 fail**: optional accessor and optional non-enumerable intent kill it in both channel modes; unknown-member checks independently protect the extra-member controls | `gate-fix1-mutation-m12-01M642THSXRQQAQ0XS2KBQGH2S.log` |
| M15: remove receipt-presence arm only | **0 pass, 1 fail**: direct-emit object boundary isolates it from the downstream fallback | `gate-fix1-mutation-m15-presence-01M642TJHJGGNN2VY88F2B97CR.log` |
| M15: remove entire receipt guard | **0 pass, 3 fail**: real null/number/string ingress | `gate-fix1-mutation-m15-whole-01M642TJWQXZJQF1CFWWTAGBYH.log` |
| M16: remove both decision downgrades | **0 pass, 2 fail**: later policy veto in channel and push | `gate-fix1-mutation-m16-01M642TKB69B4VXKM0PHYM7E0Q.log` |

`fix1-mutations.py` records exact mutations and gate commands. Mutations affected compiled `dist/` files only, which were restored byte-identically in `finally`; the final committed source and final builds contain no mutation. Additional intermediate lane smoke runs passed: core 30, channels 31, push 11, inference five. They establish restructuring checks, not substitutes for final-head gates.

### Inherited evidence and unchanged scope

The earlier report `/home/orgasmic/.orgasmic/runs/run-01M63VVZ46SV58RQ6QHPHXKTXN/evidence/report.md` and review record are historical context, **not reused gate passes**. The original design/W input hashes, original red-before lane/batch/stale/wake evidence, and four no-hook controls run on the pinned upstream base retain their bounded meaning: the upstream base and input documents are unchanged, and this round does not change the three lane algorithms or the four no-hook test bodies. Current final tests re-exercise those paths. This round supplies new red-before evidence for its own behavior changes.

The connector-delta script was copied unchanged from the earlier evidence directory and rerun against the final tree. Its current inventory is `preexisting-connector-ast-inventory.txt`. The prior manager-approved boundary remains: no new connector policy, while existing upstream connector routing is preserved for compatibility. Likewise unchanged: strictness is opt-in; stamps/context-only support and the full external protocol pin follow separately; the existing `@animalabs/mcpl-core` dependency remains **0.4.0**. Prior acceptance of those boundaries does not imply new engine/gate evidence.

## Unmet Criteria

None in the assigned fix round. Every finding was addressed; all required gates passed anew on the final HEAD under both requested Node versions. Both full suites have zero failures, cancellations or todo tests. The tracked worktree is clean. The observations retained below are scope/risk notes, not unfinished assigned fixes. No out-of-scope reply destination binding, turn/typing ownership, context-only/stamp persistence, SPEC text or connector adapter work was added.

## Residual Risk

- Host callbacks remain in-process; deadlines cannot preempt synchronous infinite loops or undo external writes. The initial 60,000 ms / 64-pending bounds are not production sizing evidence; a sequential 64-item batch of maximum timeouts can occupy its request for about an hour.
- Tests use real WebSocket/stdio ingress with synthetic peers and mock providers, not deployed connectors. M15 presence-only and M16 later-policy isolation intentionally use labelled internal-boundary scaffolds; real transport controls cover the corresponding ingress.
- Private intent is host-only, accessible to host modules via the event envelope, and non-durable. Restored work cannot borrow a replacement connection's grant.
- Pre-existing connector-specific routing remains by the approved compatibility boundary. The broader nine-file AST delta check is a reproducible evidence script, not a newly committed CI test; the committed runtime AST guard still covers the admission core. No task-specific base SHA was introduced into upstream-facing regression tests. Broader runtime-dependency-closure enforcement remains separate from this bounded fix round.
- `admission_mode_ungranted` remains a permitted host refusal code rather than a framework-produced mode decision; no new delivery-mode vocabulary or SPEC behavior was invented to fill that review observation.
- Both full suites retain 63 skips; those scenarios are not claimed as exercised. No new failures or environment-blocked assigned gates remain.
