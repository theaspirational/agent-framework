# Findings

None. No actionable correctness, security, regression, scope or acceptance finding was identified for part 1. This is **not full-R7 certification and not rollout permission**; parts 2–4 remain outstanding.

# Verdict

**APPROVE TASK-T2F13, part 1 only**, at `3b1d62284b0794a3249d613d7ff2eb1897c5c108`, against base `4976c67d5c7916a15046c627b68913994c33b3cb`.

# Open Questions

None blocking this part. Credential minimum-length/format policy remains an owner decision. A separate owner question is whether a future release should distinguish infrastructure/dial failures from `credential-unusable`; this review does not request a fifth code.

# Verification Notes

## Inputs and scope

Read the task's `node.org` and `journal.org`, project.org, implementer `brief.md` and full `last.txt`, the complete diff, relevant transport/validation/caller source and all six added test/harness files. The project's gotcha and convention collections contain no files; no applicable AGENTS.md was found. Reviewed implementer evidence is in run `run-01M5Y5Q4AZY1EJHWRTPE2XHKC1/evidence`; this report and independent artifacts are in the current run's evidence directory.

Acceptance A passes: only the three permitted production files, README, and six **new** test files changed. Production: 120 additions / 2 removals, net 118; tests: 651 additions; README: 36 additions. No dependency/version changes. An automated source comparison additionally proves that the legacy `WebSocketTransport.open` body is byte-identical after removing only the new literal-true guard (`transport.ts:600`).

Other non-strict/shared hunks are the import binding (`transport.ts:28`), erased type exclusion (`transport.ts:909`), optional interface member/docs (`types.ts:315–327`), and the required validation call (`protocol-family.ts:698`). The helper immediately returns for undefined/null/false (`:767–768`); it does not read other policy fields or copy caller objects in that case.

## Strict dial

Inspected `protocol-family.ts:766–784` and `transport.ts:702–774`: validation rejects invalid flag values without echoing them, static tokens including empty, non-header mode, URL token/userinfo, non-loopback cleartext and non-WebSocket bindings. The dial captures its inputs before the provider await, preserves the provider receiver, refuses unsupported engine versions before provider invocation, and has no static/query/anonymous fallback. `headerCarries()` is unchanged. Node explicitly receives `followRedirects: false`; new dial/socket errors use only captured id and fixed codes without provider text/cause. Existing `noteDialSent` bookkeeping is retained without storing provider results on config.

Independent `review-strict-edges` probes passed on **Node 22.23.3 + npm ws 8.22.0** and **Bun 1.4.3**:
- Each 301/302/303/307/308 redirect: exactly one authenticated original-origin upgrade, **zero second-origin requests**, failed dial.
- Undefined/null/empty/unusable/non-string results and provider throw: fixed-code rejection, no upgrade; invalid static policy and remote cleartext refuse before provider invocation.
- Every captured config field replaced by a throwing accessor while the provider is pending: authenticated original-endpoint dial succeeds without late config reads.
- Real `McplServerConnection` reconnect obtains the rotated credential with exactly two provider calls.
- Abort during a pending provider produces no late dial.

Per-field mutation tests, flag validation, engine-version simulations and the other strict cases are also covered by the inspected recorded focused-suite receipts. README:326–360 includes the required sentence verbatim and documents exact engine pins and reduced-R7 limits.

## Independent non-strict comparison: B and C

Adapted the earlier reviewer sink/responder/default-identity/fixed-event controls for this fresh base. The old rejected branch's diagnostic helper APIs do not exist here; controls instead exercise the original production APIs. The raw-wire control was inspected and adapted from the committed harness to the independent overlay. No production WebSocket constructor was replaced or wrapped.

`review-independent-comparisons` ran fresh base/final processes on both engines with the **same installed dependency tree**. Its independent source loader gets all three changed production sources directly from the specified base using `git show`; no checkout or reinstall. Eight nonempty sinks traverse a real connection/tool error and real loopback HTTP webhook: traces, console, failures.log, webhook body, shared catalogue, per-agent presentation, notices and server listing. Date/performance are fixed; only ephemeral endpoint ports are normalized. Credential-bearing names/text are deliberately retained in the legacy scenario.

`review-byte-comparison` verifies all **16 sink pairs** byte-identical. Below, each hash is both base and final, independently on both engines; the complete paired receipts and sizes are in `review-comparison.json`.

| Serialized sink | Matching SHA-256 on Node and Bun |
|---|---|
| traces | `805d234762ebfaf3cb99df4c7f953c157da91f5227d8954f8291939d3addc160` |
| console | `d503e96988f6991e15eada820a446733fd9f0577293061a048ae2be80097305e` |
| failures | `1c9cdf3861b13e2585b4b61f9af4ae5697c0b11aa43e97038887d5a3b31bf2b3` |
| webhook | `963984b8c78d4cca678658beb70582c07bff436e334373b413bf4f77a8c1f91a` |
| catalogue | `feb6296a5afba5549d7a773f7b128a40d0cef0c4f809ed0b972e31ba069111e2` |
| presentation | `d12a78af8cdb8e9ba7a43fc5513542b61f3631edaeb897d0cea73bf980cbf244` |
| notices | `88b32f2d020206eac2515c55a114c4c0328e95240fe3c9f1b0887d34f938d4d6` |
| listing | `7ce40c6c59a1cdcc8f917a5c3a7ba0e4544bf83bb5b270a3d03faf2ee38d7db0` |

Behavior controls additionally passed on base/final, both engines: throwing/null/empty/value providers in header/query mode; class config/provider receiver; config/transport prototypes and own-property shape; original native error/cause identity; prototype, non-enumerable and private-state responder methods in streaming/non-streaming production inference routing; fixed inference start/complete/fail event types and exact failure reason.

`review-fixed-events` also traversed the real framework/WebSocket inference router with each fixed event-type string used as the legacy credential: event types were preserved, not replaced by redaction. Base/final outputs match on each engine.

Wire/error comparison: eight header/query handshakes per version per engine, all request-line and header bytes/order/count equal after ephemeral-port normalization and **only the Sec-WebSocket-Key value normalization**. Every key is canonical base64 for 16 bytes and fresh across all sixteen dials per engine; raw receipts are retained. There were zero pre-response frames/extra bytes during the delayed response window. The actual clients were unchanged. This follows the manager-approved C(2) interpretation; literal equality of random key values is not claimed.

Legacy abandonment, connect failure, refusal, real 15-second timeout, URL/mode conflicts, unusable-header and constructor-refusal cases also match in text, error class/prototype, own keys, descriptor flags and cause presence (13 cases per engine). Stack text is not compared across different source locations. Normalized wire hashes reproduce the implementer evidence: Node `e8f877a4014c84648dfac0e56120dbc78b23dcc392868482c8987b96d1b5dfd7`; Bun `a7ce73d16a09d39de7987326df590bffd3a7302e6beea46d50562df131149a3e`.

## Existing suite and per-test baseline: D and E

Read the supplied clean-tree gate logs rather than rerunning their full suite/build/typecheck. Baseline: 7,814 pass, 45 skip, zero fail; final: 7,888 pass, 45 skip, zero fail. Build/typecheck passed on base and final. `review-evidence-audit` independently compares existing suite/test statuses and skip reasons: no removal/status change, exactly 74 added cases. It parses every added named outcome from original Node/Bun baseline/final logs: **31 controls PASS→PASS and 43 additions FAIL→PASS on each engine**. Bun's repeated failure-summary lines were checked for consistent duplicate outcomes.

Lock bytes still match the preserved acquisition copy: SHA-256 `0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`. Runtime versions were verified locally; Bun binary digest matches the specified digest. No installation was performed during review.

## Commands, receipts and evidence validity

All independent verification ran through these gates, each ending at the reviewed HEAD with a clean worktree:

- `review-independent-comparisons`: `bash "$E/review-run.sh" "$E" "$P"`
- `review-strict-edges`: `bash "$E/review-strict-run.sh" "$E" "$P"`
- `review-fixed-events`: `bash "$E/review-fixed-events-run.sh" "$E" "$P"`
- `review-byte-comparison`: `env -i PATH="$PATH" HOME="$E" node "$E/review-compare.mjs" "$E"`
- `review-evidence-audit`: `env -i PATH="$PATH" REVIEWED="$ORGASMIC_REVIEWED_EVIDENCE_DIR" REVIEW_EVIDENCE="$E" python3 "$E/review-evidence-audit.py"`

Here `E` is this review's evidence directory; `P` is the reviewed implementer's `credential-part1` evidence subdirectory. Wrapper scripts retain exact child commands: Node uses `node --import tsx`, Bun uses `bun-1.4.3`, each in a credential-free `env -i` with the inspected loopback-only interposer. The scripts supply only synthetic credentials and target reviewer-started loopback servers/local files. The guard actually used is LD_PRELOAD interception of libc connect/sendto/getaddrinfo, **not a namespace or kernel-enforced egress boundary**. The specified probe endpoints and acquisition logs are observed evidence; there is no packet-capture evidence establishing absence of all other traffic, and direct-syscall bypass is not excluded. No claim of kernel-enforced isolation is made. Unsupported-engine tests simulate version properties; they do not run a second unsupported engine binary. Gate logs, scripts, JSON artifacts and full paired hashes are retained beside this report.

Earlier failed reviewer gate attempts were harness-adaptation failures, not product regressions: a webhook receipt race, an unavailable Bun named `registerHooks` export, and Bun's duplicated failure-summary records. The harnesses were corrected only in evidence, and all final named gates passed. These earlier logs remain retained.

The acquisition log's exact extra request is **`GET https://registry.npmjs.org/npm`**: scheme **HTTPS**, not cleartext HTTP (npm's `http fetch` log category does not change the URL scheme). It occurred during the one dependency **acquisition/install phase**, not test execution, and was npm's update notifier requesting public registry metadata. It violated the original declared-dependencies-only acquisition boundary. The manager said, “Retain the current evidence; do not restart”; that is not retroactive compliance or evidence that no deviation occurred. On the evidence's merits, this extra metadata request does **not** invalidate the base/final behavioral, build, typecheck, focused-test or full-suite gates: no credential was sent, no install/resolution change or reinstall occurred, and the lock hash stayed unchanged. It affects acquisition-policy compliance/audit, not the identity of the installed tree on which those gates ran. Original acquisition evidence is retained unchanged. No further npm invocation was needed in this review.

Residual gaps: no full-R7/parts-2–4 guarantees were tested or certified, no real-credential/external-network testing or sealed dependency qualification was attempted, and the existing full suite was not rerun under Bun (focused controls and production comparisons were). Independent strict probes use loopback ws, not a new external/TLS qualification. These do not block this part's scoped acceptance.

## Manager follow-up: capture mutations and precise limits

Acknowledged both manager messages by content: acquisition scheme/phase and gate impact; six per-field capture-removal checks; broad error-code classification; simulated-engine and actual LD_PRELOAD limits; late private-input provenance; and the qualification to trace real post-await uses rather than treating every surviving redundant capture as an unmet guarantee. No artificial reds or production edits were made.

`review-capture-mutations` removes exactly one capture field at a time in an **in-memory source overlay**, preserving each mutated transport source and its SHA-256 in evidence. It runs the existing 74 focused tests on each exact engine. Results are identical across engines:

| Removed field | Existing-suite result | Meaningful detecting control |
|---|---|---|
| credentialRequired | 68 pass / 6 fail | Direct invalid-policy/provider-before-I/O controls; the helper otherwise skips strict admission |
| token | 72 pass / 2 fail | Direct static-token/empty-static-token admission controls |
| accessProvider | 48 pass / 26 fail | Successful authenticated strict-header control refuses because the selected provider reference is missing |
| command | 74 pass / 0 fail | Survives the existing suite; see direct admission probe below |
| transport | 74 pass / 0 fail | Survives the existing suite; see direct admission probe below |
| protocol | 73 pass / 1 fail | Direct modern-protocol admission control |

Some accessProvider-mutant snapshot cases additionally fail cleanup because their provider was never invoked; those cleanup errors are **not** credited as proof of snapshot sensitivity. The successful strict-header control is the substantive detector.

The two survivors reveal an existing **direct-admission test gap**, not a post-await mutation bug. `review-binding-capture` adds evidence-only, independently cleaned-up probes: an ambiguous command+URL, and a stdio transport without a command, must refuse before provider/I/O. Original source passes both with zero provider calls/requests on both engines; deleting the respective command/transport capture makes each control fail, with one provider call and authenticated upgrade. JSON receipts explicitly record `testWouldPass`, avoiding reporting expected mutant failure as an original-source failure.

Actual-use trace (required distinction from capture necessity):
- The literal-true guard at `transport.ts:600` binds the strict invocation before awaiting. Captured `credentialRequired: true` is used to enable validation before await; the flag is not consulted later to choose a legacy fallback or redirect mode.
- Static token is captured and rejected by admission before await; it is never used after await. Its pending mutation cannot supply a fallback.
- Provider reference is selected and called at `:718–730` **before** its promise is awaited. Replacing config.accessProvider while that promise is pending cannot replace the already-invoked work, even on the base. The copied field is not the only possible way to achieve this guarantee.
- Command/transport/protocol are consumed by strict binding admission (`protocol-family.ts:772–775`) before await; normal factory transport selection is also pre-await (`openTransport`). None is read or used to select/rebind a transport after await.
- Endpoint/header policy and redirect refusal are already bound before await (`transport.ts:720–723`); after it the code validates the result and constructs that same WebSocket dial. The original config is only a WeakMap key for noteDialSent. Constructor use of the captured object at `:766` reads its id; the native-error listener that could read other config fields is removed and replaced by the fixed-code listener.

Consequently, passing-on-base pending-mutation controls do not prove that every physical copied property is necessary. The no-late-read guarantee is supported by this source trace plus the independent all-fields-throw-after-await probe. Surviving removal of a redundant storage step would not alone disprove it. The new admission controls strengthen the separately relevant pre-await binding validation without manufacturing red tests for inherently bound inputs.

**Error classification:** source inspection of `transport.ts:740–756,773` shows DNS lookup failure, connection refusal, TLS negotiation/certificate failure and HTTP upgrade/server refusal all reach the same error/abandon handler; its error is `credential-unusable`. Socket-open timeout also calls that handler. This is broader than credential failure: it semantically mislabels non-credential infrastructure failures and removes their diagnostic distinction. It is intentional within the brief's four allowed fixed codes, not a new part-1 finding; any fifth code is an owner decision. Provider throw/empty and engine unsupported retain their separate codes. DNS/TLS cases in this sentence are source-path analysis, not a claim that external DNS/TLS qualification was run.

**Provenance:** the manager identifies the prior private commits/harnesses as arriving only at finalize (QY3F8); the implementer report likewise says they arrived after the fresh implementation was written and were declined. Thus “no reuse” was incidental to late delivery, not evidence of a deliberately exercised reuse-admission procedure. No commit was cherry-picked. This review subsequently read/adapted the explicitly supplied prior reviewer controls as directed; that is reviewer evidence reuse, not implementation reuse.

The first capture-mutation run was interrupted after the missing-provider mutant exposed test cleanup leaving loopback handles open. Its owner PID/process group was inspected, then the exact dispatch gate wrapper was terminated; its interrupted receipt and logs are retained. One retry used a new wrapper/log/PID record and Node's `--test-force-exit`, and completed all twelve mutation runs. No production failure or orphaned process is being hidden as a passing gate. New successful receipts are `review-capture-mutations` and `review-binding-capture`; their exact argv/scripts and expected mutant outcomes are retained beside this report.

# Fix Directions

No code changes requested. Preserve the strict/legacy separation and exact supported-engine limits. Complete the separately scoped remaining parts and qualification before any rollout. Worktree and HEAD were left exactly as found; no edits, commits or new worktree files were made.
