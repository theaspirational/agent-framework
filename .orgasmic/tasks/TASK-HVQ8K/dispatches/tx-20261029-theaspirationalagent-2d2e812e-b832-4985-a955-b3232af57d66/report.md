# TASK-HVQ8K — slice A implementation

## Changed

Implemented explicitly enabled, host-owned required inbound admission for all three ingress lanes. Unconfigured connections keep their original dispatch branches; no default hook, asynchronous preflight or synthetic allow verdict was introduced. Required connections establish admission state before traffic, capture the original instance/epoch at receipt, authorize before preflight, refuse pre-ready work rather than hold it, validate the complete verdict, recheck live authority, and only then run effects. Required push hint taps are suppressed. Refused work does not reach channel mutations/coalescing, push dedup/notices, or inference model resolution/chunks. Private runtime envelopes preserve the wake ceiling through modules and deferred coalescing without introducing reply routing or persistence.

Base: `4a45766f019fa11c8699645bd6806ebf3e13e5d1` (upstream main), not the design commit. Design read in full from `591f6c14578ef57796399b91c8a0bea1d5ba7c62`; the design document was not added to this branch. W: `/srv/review-drop/TASK-VZ0CD-CMT-R4DF2.md`. Input hashes are recorded in `design-input-hashes.txt` in this evidence directory. Applicable repository policy: supplied project baseline, no additional conventions/gotchas, and `CONTRIBUTING.md`; the latter requires the included behavior-change changelog fragment.

### Local commits

| Commit | Purpose |
| --- | --- |
| `273e609c` | Shared required-admission core, initialization and channel preflight |
| `f514854e` | Push preflight before deduplication/notices |
| `93a15a88` | Inference preflight before model routing |
| `a78b337e` | Wake ceilings and stale/deferred-work invalidation |
| `4d3c96a0` | No-hook synchronous and transport compatibility controls |
| `404e264b` | Real stdio notification replacement and mixed-profile connections |
| `632f2e87` | Feature authorization before hinted-push refusal |

All commits are local; no push, PR, messaging to Slack/Telegram, landing, merge or dispatch close was performed.

### Files and line counts

Final implementation diff: **18 files, +988/-15** against the base. Exact commit/version/file inventory: `environment-and-files.txt`.

| File | Added | Removed |
| --- | ---: | ---: |
| `changelog.d/required-inbound-admission.added.md` | 5 | 0 |
| `docs/required-inbound-admission.md` | 71 | 0 |
| `src/framework.ts` | 46 | 2 |
| `src/index.ts` | 2 | 0 |
| `src/mcpl/channel-registry.ts` | 21 | 2 |
| `src/mcpl/inbound-admission.ts` | 163 | 0 |
| `src/mcpl/inference-router.ts` | 15 | 0 |
| `src/mcpl/protocol-family.ts` | 6 | 0 |
| `src/mcpl/push-handler.ts` | 34 | 2 |
| `src/mcpl/server-connection.ts` | 89 | 9 |
| `src/mcpl/types.ts` | 3 | 0 |
| `test/fixtures/required-admission-server.mjs` | 29 | 0 |
| `test/mcpl-admission-compatibility.test.ts` | 57 | 0 |
| `test/mcpl-admission-lifecycle.test.ts` | 268 | 0 |
| `test/mcpl-admission-no-hook.test.ts` | 43 | 0 |
| `test/mcpl-required-admission.test.ts` | 66 | 0 |
| `test/mcpl-required-inference-admission.test.ts` | 21 | 0 |
| `test/mcpl-required-push-admission.test.ts` | 49 | 0 |

No dependency manifest, storage schema or SPEC changes. Build output and copied `.mjs` fixtures remain untracked/ignored build products, not committed artifacts.

### Refusal matrix

Channel outcomes below are per-message `{ accepted: false, reason }`; push outcomes are `{ accepted: false, reason }`; inference admission refusals are JSON-RPC `-32600` with the fixed reason. Notifications have no response receipt. Existing authorization errors retain their old wire form and precede admission.

| Condition | channels/incoming | push/event | inference/request | Verified ordering/effects |
| --- | --- | --- | --- | --- |
| Hook denies | `admission_denied` | same | same | No admitted effects |
| Hook throws/rejects | `admission_threw` | same | same | Fixed code, no private exception disclosure |
| Timeout / late allow | `admission_timeout` | same | same | Signal aborted; late success ignored |
| Malformed verdict | `admission_invalid` | same | same | Whole shape validated before effects |
| Unknown member, unsupported stamp, accessor, contradictory verdict, unknown refusal reason | `admission_invalid` | Shared validator | Shared validator | Detailed shape matrix exercised on ordinary and coalesced channel transport; representative malformed case on other lanes |
| Missing/removed binding | `admission_missing` | same | same | Cannot downgrade to unconfigured path |
| Old epoch/replaced connection or revoked grant after await | `admission_stale` | same | same | Original receipt cannot acquire replacement authority |
| Channel registration removed/replaced after await | `admission_stale` | N/A | N/A | No conversion/tags/queue/coalescer; remaining siblings independently refused |
| Granted but pre-ready/paused connection | `admission_not_ready` | same | same | Refused, not held or replayed |
| Missing grant at receipt | Existing capability error | Existing capability error | Existing capability error | No hook; required push tap remains suppressed |
| Missing/disabled feature | N/A | Existing feature error | Existing feature error | Authorization before hook; removal after await becomes `admission_stale` |
| Valid feature plus push hints | N/A | `admission_unsupported` | N/A | No early tap, hook, dedup or notice |
| Unknown feature plus push hints | N/A | Existing feature error | N/A | Feature validation wins over hints refusal |
| Store true, mayWake false | Stored under existing downstream rules; no wake promotion | Same | `admission_denied` | Existing gates are intersected, not overridden; no inference model/chunks |
| 64 pending preflights on a connection | Immediate `admission_denied` | Shared budget | Shared budget | No queue; separate connection budget remains usable |
| Host stop / inference loop unavailable after await | Not ready on host stop | Not ready on host stop | `admission_not_ready` | No late effect |
| Attestation absent/mismatch/throw/timeout/malformed | Terminal connection failure across lanes | Same | Same | `initialize_attestation_refused`, before initialized/capability use; protocol agreement errors take precedence |
| Binder absent/wrong key, including reconnect | Terminal `admission_missing` | Same | Same | Startup cannot degrade; reconnect must bind a fresh key |
| Required profile on modern MCP | Configuration rejection | Same | Same | Before connection launch |

Ordinary and coalesced channel/push transports exercise refusal paths. The mixed channel batch exercises denial, throw, timeout and subsequent success in order with an independent deadline per item. Post-await authority tests use actual transport ingress, with deliberately controlled internal lifecycle mutations; additional real stdio disconnect/replacement and WebSocket reconnect tests cover real transport teardown. Real stdio framework probes cover all three lanes and initialization, pending notifications, and two simultaneous required/unconfigured connections with colliding channel ids. No live external connector/provider is contacted.

### Clarifications and deviations from W/design

These are manager engineering calls, not new owner decisions; O4 remains the owner decision controlling opt-in strictness.

- **W §6 stamp slot omitted:** A has neither a stamp member nor `isNormalizedStamp`. Unknown fields including stamp are invalid, not silently dropped. No metadata keys are reserved and no storage is changed. PR-facing text states: “Stamp support arrives with context-only delivery.” Slice D adds the schema/storage together. Answer: `ask-20b642cb3a344b99a9b7dcca478fecc8`.
- **Initial numeric bounds:** required integer `timeoutMs` in 1..60000, validated before launch; named constants `MAX_ADMISSION_TIMEOUT_MS` and `MAX_PENDING_ADMISSIONS` (64); independent connection budgets; channel items sequential with separate deadlines. Overload is immediate `admission_denied`. Answer: `ask-78870de2c6d143738def2f8fd1913f2b` (also repeated in dispatch messages).
- **Existing connector policy retained:** literal removal of every connector name/format in the entire upstream framework conflicts with O4 and exceeds A. The manager instructed preserving upstream fallbacks while keeping new/changed admission policy generic (`ask-8c10d500780c4ffea98ec5d4ba32ed73`). AST comparison across nine changed runtime files found **zero new connector-specific values/identifiers**; `preexisting-connector-ast-inventory.txt` lists all **322 retained AST sites** discovered by that scan, with file/line references. A narrower literal inventory is `preexisting-connector-sites.txt`. This includes the upstream `derivePushEventChannel` fallback at base `src/framework.ts:19260–19268`, existing DM/guild interpretation, connector awareness/imports and routing/outbox paths. This is not a claim that the whole pre-existing framework is connector-free.
- **Protocol baseline:** no external MCPL repository read or SPEC change is needed for A. The decoder/grant implementation at the specified upstream framework base is authoritative; `@animalabs/mcpl-core` is pinned to **0.4.0** in `package.json` and installed at that version. No new wire vocabulary. The full MCPL pin is deferred to slice E, as stated in PR-facing documentation. Answer: `ask-fb5b34918b364337a9a4fc4c5e62c9e4`.
- **Hint ordering:** feature authorization precedes unsupported-hints refusal, while required early taps remain unconditionally suppressed. Tests cover unknown-feature+hints, valid-feature+hints, and unconfigured hints unchanged. Answer: `ask-3d4b2cd1ae8d489388ac43650d478ca1`.

## Verification Gates

Final HEAD: `632f2e87c093c82f80f80e0b8e84104111300bc7`. Node **22.23.3**, npm **10.9.9**. All evidence paths below are relative to this report directory unless absolute. `environment-and-files.txt` records the installed dependency versions and clean tracked worktree.

| Command | Outcome | Receipt log |
| --- | --- | --- |
| `orgasmic dispatch gate typecheck -- npm run typecheck` | PASS | `gate-typecheck-01M63YSJ3EJV521XQRTGA9PK4R.log` |
| `orgasmic dispatch gate build -- npm run build` | PASS | `gate-build-01M63YSPYMHSZ1JRWZ0QP72SNX.log` |
| `orgasmic dispatch gate npm-test-node22 -- env AF_TEST_CONCURRENCY=4 npm test` | **PASS: 9,339 tests; 9,276 pass, 0 fail, 63 skipped; 497 suites** | `gate-npm-test-node22-01M63YSX6FA8XT9RXFRD7DK5X9.log` |
| `orgasmic dispatch gate admission-final -- node --test --test-concurrency=1 --test-force-exit dist/test/mcpl-required-admission.test.js dist/test/mcpl-required-push-admission.test.js dist/test/mcpl-required-inference-admission.test.js dist/test/mcpl-admission-lifecycle.test.js dist/test/mcpl-admission-no-hook.test.js dist/test/mcpl-admission-compatibility.test.js` | **123 pass, 0 fail, 0 skipped** | `gate-admission-final-01M63YT62ZNQT4TD2P9GA1MBHD.log` |
| `orgasmic dispatch gate connector-agnostic-delta -- node "$ORGASMIC_EVIDENCE_DIR/check-connector-delta.mjs"` | PASS: nine changed runtime files, zero new connector-specific AST values/identifiers | `gate-connector-agnostic-delta-01M63YVEY442B6G62ARVMPBQA7.log` |

The six new test files contain **123 tests**: channels 25, push 11, inference 5, lifecycle 55, no-hook controls 4, compatibility/wake/AST 23. Final-head scoped run duration: 19.234 seconds. Full-suite duration: **519.291 seconds**; zero cancelled/todo tests. Full-suite output is in `final-npm-test-wrapper.log`; command ownership is in `final-npm-test-owner.txt`. `git diff --check 4a45766f019fa11c8699645bd6806ebf3e13e5d1..HEAD` also passed (non-receipted formatting check).

A previous full-suite invocation passed 9,276 / 9,339 tests with 63 skips and zero failures, but its receipt was marked **moved-head** because the final commit was amended to remove a trailing blank line in a test. It is superseded by the final-head run above, not reused as a gate. Earlier full-suite and intermediate targeted logs are retained for provenance; only final-head receipts above qualify completion.

### Red-before evidence

| Receipt log | Pass / fail before fix | Meaning |
| --- | --- | --- |
| `gate-red-channels-01M63W0BACCJ0P7RBM6FB01FH9.log` | 0 / 25 | Real transport channel refusals initially admitted by U |
| `gate-red-push-inference-01M63W8Z0X5G367VGTQVBP2WTF.log` | 1 / 13 | Lane preflights absent before implementation; hinted push already protected by shared required profile |
| `gate-red-stale-siblings-01M63WX8NB06CVVQXY50220B2S.log` | 0 / 2 | Replacement/stop still allowed later sibling hook before precheck fix |
| `gate-red-existing-veto-01M63X157X6DTCSCRHTDDPNKT9.log` | 0 / 2 | Module could promote an existing false wake gate |
| `gate-red-coalesced-binding-01M63XASJ9KA7HHRGFKYKGMJB4.log` | 0 / 1 | Deferred coalesced work retained removed binding authority |
| `gate-red-hints-feature-order-01M63XSJKKVHC64W9A9ADEZ585.log` | 1 / 1 | Unknown feature incorrectly lost to hints refusal before ordering fix |

Mutation control `gate-mutation-wake-ceiling-01M63WVG9MB3H3YD6GZX163647.log`: disabling the wake ceiling made all four module-promotion controls fail; production source was restored. These failures are deliberate red/mutation evidence, not remaining regressions.

The identical four no-hook controls pass against an archived base checkout and current implementation: synchronous channel/push callback order, unchanged metadata/no private symbols, synchronous inference model/refusal path, legacy push early tap and paused holding/release. Base receipt: `gate-no-hook-baseline-01M63X95AET905JYF258Y6VH25.log` (**4 pass, 0 fail**). Baseline setup was scratch-only, not a commit or edit in the main checkout. This baseline probe is historical evidence, not a reused final-head receipt.

## Unmet Criteria

None within the manager-clarified slice A scope. All assigned gates passed at the final local commit; the tracked worktree is clean. The explicit W/design clarifications above are deviations, not hidden compliance claims. No scope B–F implementation is claimed. In particular, private optional intent is non-authorizing; this slice does not bind reply destinations, own turns/typing, implement context-only delivery, persist stamps, add SPEC vocabulary or modify connector adapters.

## Residual Risk

- Host hooks run in-process. Timers cannot preempt synchronous infinite loops or undo external side effects; cancellation requires cooperative callbacks. Documentation explicitly states this obligation.
- Strict required-profile readiness/hints/replay behavior is intentionally incompatible with peers relying on the old path; unconfigured connections retain those behaviors. Operational timeout/concurrency bounds are initial values, not production sizing evidence.
- Real transports and framework paths were exercised with synthetic peers/providers, not deployed connector services. Internal lifecycle mutation tests supplement (not replace) actual disconnect/reconnect probes.
- Private intent/authority is not durable. Restored required coalesced work without a live original envelope cannot inherit a replacement grant. Durable reply/turn recovery is outside A.
- Pre-existing connector-specific routing remains by approved compatibility exception; the AST inventory documents it. The finite vocabulary scan is evidence of no new known connector policy, not a proof against every conceivable platform encoding.
- The full suite reports **63 skips**; those skipped scenarios are not claimed as exercised. There are no final test failures, cancellations or environment-blocked assigned gates.
