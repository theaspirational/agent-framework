# TASK-V1DZF — security re-review, round 3

## Verdict

**Do not approve** `fd575946248892f4c5ff7116254d0e71c5d496bd`.

The original numeric RPC-code reproduction and JSON-grammar admission defect are fixed. The HIGH is **not closed as a class**: handshake-close diagnostics still disclose accepted numeric credentials, and native diagnostic carriers bypass the strict copy filter. No flag-unset regression was found in the exercised base/final comparisons.

## Findings

### HIGH — security / unmet R7: returned diagnostic assembly still bypasses strict redaction

**Locations:** `src/mcpl/server-connection.ts:1446-1455`, `1354-1359`; additional generated-message instance at `1804-1807`.

Before an initialize response arrives, `onClose` interpolates the peer's numeric WebSocket close code into `failure`. The `failed` helper redacts stderr, **not `failure`**, and returns `new Error(failure)`. The error propagates through both public `McplServerConnection.connect` and `AgentFramework.connectMcplServer`. Filtering the established-connection close log at lines 2863-2866 does not cover this transition.

**Both-engine production reproduction:** `review-additional.mjs`, `handshake-close-code`, generates a synthetic four-digit credential in the valid private close-code range. The provider supplies it; the loopback peer accepts one authenticated upgrade and closes with that numeric code instead of replying to initialize. Both public callers reject with the entire credential in `error.message`:

```
{"probe":"handshake-close-code","via":"connection","returnedHostErrorLeaks":true,"upgradeCount":1}
{"probe":"handshake-close-code","via":"framework","returnedHostErrorLeaks":true,"upgradeCount":1}
```

The retained-rotation variant first connects successfully, rotates to a different credential, then closes the second initialize with the **previous** numeric credential. The SDK's `reconnect-failed.error` diagnostic event contains it, although the separately filtered reconnect console line does not. Thus checking only framework traces or console misses the defect. The implementer report's claim that handshake-close failures already receive whole-text redaction is contradicted by source and execution.

The same returned-message boundary misses synthesized numbers: with accepted credential `6`, five ordinary cursor pages followed by `{tools:null}` make public `sendToolsList()` return `malformed tools/list page 6: no tools array`. The page number is generated, like the validation array index fixed this round; it is not an actual metadata key/value echo and should not be refused by admission instead.

**Impact/classification:** unmet strict-mode credential guarantee, not a flag-unset regression. Short numeric credentials are explicitly accepted; no minimum-length policy excludes these cases. Initial-handshake errors reach the host before a framework trace filter can repair them.

**Fix direction:** strictly redact assembled returned/diagnostic messages before constructing or publishing their Errors, including handshake failures and generated pagination paths, without changing legacy text or wire close codes. Add both public-caller tests and a retained-token reconnect-event test on both engines. Inspect other assembled diagnostic paths rather than assuming the established-connection formatter covers them.

### MEDIUM — security: native diagnostic projections reintroduce scalar credentials after filtering

**Locations:** `src/mcpl/protocol-family.ts:241-243`; `src/framework.ts:29161-29171`, `26655-26661`, `2578-2593`, `5943-5948`.

`redactedData(..., true)` returns every non-array/non-plain object unchanged. Consequently, a supposedly detached strict diagnostic copy can retain an original `Error` or boxed scalar. For ops data, `boundFailureFields` subsequently projects those values into text/JSON **after** the only pre-log strict filter. This publishes values the scalar walker would have masked had they been plain fields.

**Both-engine production reproduction:** `review-native-boundary.mjs` obtains a numeric scalar from a real tools/call `structuredContent`. The host puts that number into `httpStatus` on `new Error('fixed failure')`, then invokes the supported public API:

```
notifyOps('native-classification', 'assistant', 'fixed diagnostic', { native })
```

The SDK's own Error projection writes `HTTP <credential>` to real `failures.log`. An external-message diagnostic containing that Error and `Object(number)` also retains both original values in the queue and actual `process:received` listener event. The probe asserts that the event's Error is the **same object reference**, not a redacted detached projection:

```
{"probe":"numeric-Error-httpStatus-and-boxed-number","failuresLeak":true,"opsTraceLeak":false,"processTraceLeak":true,"queueLeak":true,"webhookLeak":false,"rawNativeReferenceRetained":true}
```

The additional script also reproduces native Error/boxed-carrier leaks with server-derived boolean, null and numeric values. The ops trace is repaired by its later shared filter; the persisted record is not. The fixed-message webhook does not leak in this reproduction.

**Scope/impact:** this requires host code to wrap/forward a received value into an SDK diagnostic API; JSON cannot transmit a native Error or boxed primitive. It is **not** evidence that a server can instantiate those objects remotely, nor a demand to rewrite accepted application content. Once forwarded into supported SDK diagnostics, however, those projections are SDK-owned output, not excluded application payload. The supported Error projection and advertised detached-copy guarantee currently disagree. This is a conditional diagnostic disclosure, hence MEDIUM rather than the direct remote transition defect above.

**Fix direction:** for strict copies, project supported native diagnostic objects into safe detached data before redaction, or withhold unsupported carriers conservatively. Redact the final supported projection before bounding/persistence; do not return raw object references. Cover Error classification scalars, nested Errors and boxed scalar serialization, keeping legacy and application payloads unchanged.

## Open Questions

No decision is needed to reproduce or fix the findings.

**Owner policy decision remains:** whether strict mode should enforce credential length/format. Recommend high-entropy host credentials and an explicit documented policy; do not silently introduce a minimum or use one instead of fixing missed sinks. Exact engine pins, lifetime retention and console-only withholding visibility remain requested limitations, not new findings here.

## Verification Notes

### Read-only scope and evidence

Read the live task record; project.org; empty gotchas/conventions collections; original dispatch requirements/clarifications; complete prior review and requested scripts; complete round-3 implementer report, including the class-wide addendum; base-to-final source/docs/tests diff; relevant consumers and supplied receipts. No applicable AGENTS.md was found and no conventions matched. No source edits, commits, checkout movement, installation or push. Evidence files are outside the worktree. Tracked status remains clean at the reviewed commit.

Current evidence is run `run-01M5XSEW65ASPZ070YR6TFF7VS`, `evidence/`. Reviewed evidence is run `run-01M5XQABAWESJNH878FWZNSW1C`, `evidence/`; previous reviewer evidence is run `run-01M5XPJ3KRCG9X4V9ZA3W2XGR9`, `evidence/`. Full reports/scripts remain referenced there rather than pasted.

All independent probes use the existing isolated wrapper: env-i, isolated package-manager configuration, offline npm and loopback-only libc traffic guard. Synthetic credentials only; numeric-loopback ephemeral peers; no model/provider/external webhook traffic. The guard is not kernel network-namespace isolation.

### Manager addenda: scalar and sink inventory

The inventory covers SDK-controlled surfaces, including **model-facing** catalogues. “Pass” means the exercised boundary, not an exhaustive proof for every producer.

| SDK sink | Production-path verification on Node and Bun | Result |
|---|---|---|
| Console | Original numeric RPC error-code probe; real decimal, negative/exponent, boolean/null error codes/messages/data; rotation; delayed inbound ID/refusal code | Tested paths pass; supplied tests additionally cover pending-close/callback/double-answer branches |
| Framework traces, including process:received, tool failure, lifecycle, ops and dependent listener output | Shared actual onTrace delivery; real errors/reconnect; queue notices; scalar matrix; native-carrier probe | Plain scalar paths pass; native Error/boxed notice data leaks |
| Connection diagnostic events and returned host errors | Initial connect through both public callers; real reconnect-failed event; RPC errors; pagination failure | **HIGH above**; ordinary RPC scalar data now passes |
| failures.log | Actual notifyOps append/read, not a mocked writer; scalar/key/array matrix and native Error classification | Plain data passes; post-filter native projection leaks |
| Webhook body | Intercepted actual production fetch body serialization, scalar/structured message conversion and rotations | Tested message paths pass; no external delivery claimed |
| listMcplServers, including toolClasses/manifest/grant/filter state; listToolClasses | Actual public listing calls after real tools/list and reconnect | Unsafe entries withheld; diagnostic plain scalar copies pass |
| New-tools notices, queued metadata and process:received | Actual initial/re-list notices plus public pushEvent diagnostic ingress | Ordinary/string/plain-scalar copies pass; native diagnostic reference bypass above |
| Shared and per-agent model tool definitions/catalogues | Actual getAllTools and availableToolsForPresentation, server-specific definitions selected | No rejected entry or masked callable alias advertised in tested cases |
| Dynamic toolset catalogue/look, toolset notices and persisted model-window changes | Real toolset controller, meta look/open/act/close, hints and reconnect from prior adapted script | Tested paths pass; safe callable names remain original |
| Initialize, manifest, declarations, hints, push/channel/control envelopes feeding those sinks | Real wire initializer/RPC/inbound requests in raw, encoded and Bearer forms | Unsafe metadata refused before adoption/handler/tap |

**Value classes:** wire numbers (positive, negative, exponential), booleans and null are tested as codes, scalar values, nested arrays, numeric-looking strings and numeric-looking object keys. Numeric keys are strings after JSON parsing. Server-selected live numeric IDs are admission-tested in the supplied focused tests; my independent held-ID probe receives a numeric request before rotation, then makes that number the next credential and replies after reconnect: console ID/refusal code are clean. Host-derived bigint is checked in plain diagnostics; bigint is not a JSON wire type. Native Error/boxed conversions are separate host-side carriers and expose the MEDIUM. Generated validation indices are covered by supplied tests; generated pagination indices expose the HIGH's additional message-assembly gap. Cycles/unreadable metadata remain conservative by inspected matcher and supplied tests.

Undefined, functions and symbols cannot be JSON wire values. Unknown native/custom-toJSON objects are not exhaustively tested; the non-plain-object return already identifies an unsafe class boundary. Fixed SDK discriminants, timestamps, native stack coordinates and JSON serializer grammar are not asserted as server-authored credential echoes.

**Deliberate exclusions:** accepted application content/structuredContent, inbound application bodies, internal routing/wire buffers, arbitrary trusted host state and unknown encodings. Application data intentionally forwarded into an SDK diagnostic is distinguished above. No blanket malicious-server exfiltration guarantee is claimed; README.md states that limitation. No live model transmission or external webhook delivery was exercised.

### Previous MEDIUM: closed, with short-token limitation quantified

`credentialBearingMetadata` at `src/mcpl/protocol-family.ts:833-869` matches **individual actual object keys and scalar String() values**, independently, against raw/encoded/JSON-escaped credential patterns. It does not stringify containers, match across fields, or treat array positions as authored keys. Unsupported/unreadable objects, cycles and excessive depth refuse; path-local ancestry permits shared acyclic children.

My adapted colon probe now connects and retains its benign tool. `rr3-short-values-{node,bun}` reruns all 94 printable non-space ASCII credentials and additionally inserts a real credential-bearing key/value entry for each connected case. Results on each engine:

- **26/94 (27.7%)** initializer refusals, all actual field-value/key collisions.
- **Zero syntax-only refusals**, down from the previous five JSON-punctuation defects.
- **68 connected**; **25/408 (6.1%)** offered ordinary entries withheld.
- Real key/value echoes remain withheld, including punctuation tokens.

Actual short-substring collisions remain the intended conservative no-length-floor limitation; JSON-generated punctuation collisions are fixed. Supplied final tests also cover five punctuation credentials, composite cross-field strings, actual initializer echoes, encoded/escaped forms, cycles and unreadable data.

The withholding/recovery probe confirms: entry withholding emits its fixed metadata-credential diagnostic to **console only**. Successful host connect has no dedicated withholding error; listings have reduced toolCount without reason/count; no dedicated withholding trace/failures record. Rotation alone does not restore old-token-bearing tools because history remains protected. A genuinely safe replacement returns on real tools/list_changed. This is not a stale negative cache.

### Callable/display semantics and dial lifecycle

Credential-bearing entries are **omitted**, not renamed. A diagnostic redacted placeholder is not a callable alias; admitted tools retain exact original names, verified against peer-received tools/call names. Programmatic arbitrary wire-name routing remains existing behavior, not a new authorization boundary.

The independent provider-await probe mutates url, tokenTransport, credentialRequired, provider reference, static token, id, transport, command and protocol. Only the original endpoint receives an upgrade, with the original header-only policy and fresh provider value; replacement provider is not called. The snapshot at `transport.ts:602-607` captures all those dial inputs before awaiting. There is no separate configurable headers override; headers/no-fallback/redirect policy derive from captured settings. Sticky registry policy preserves metadata protection if the flag changes during the wait.

Missing-provider public runtime connect produces zero upgrades; restart produces no additional upgrade (the missing-runtime-provider restart tears down its old connection first). Startup/runtime/restart and reconnect converge on the shared transport check before socket creation. No separate admin/overlay socket constructor exists in this SDK; external host plumbing that might drop the flag was not inspected.

Literal string **"true" is a configuration problem**, independently checked through serverConfigProblems and assertServerConfigBooleans; it does not silently select legacy behavior.

**Engine guard, intended limitation:** `transport.ts:616-621` uses `process.versions.bun !== undefined`; if present, only exact string `1.4.3` passes. Otherwise it requires `process.release.name === 'node'` and exact `process.versions.node === '22.23.3'`. It is not semver/minimum matching or constructor identity verification. Bun 1.4.4 and different Node patches refuse before provider/network, even under a host declaration Bun >=1.4.3. Follow-up probes mutate reported patch metadata to verify refusal; they do not claim execution on those newer engines. Supplied tests cover actual resolved constructors and 301/302/303/307/308 redirect refusal.

**Retention, intended limitation:** `protocol-family.ts:292-322` retains every distinct strict sent token for the reachable config's lifetime. Identical strings are deduplicated and moved newest without growing history. Strict history has **no count/byte/age bound**; memory, insertion scans, pattern construction/compilation and matching cost grow with distinct rotations. WeakMap GC only helps after config release. No longevity benchmark was run. README.md documents the tradeoff; this round was explicitly told not to change it.

### Legacy per-sink equality

Read the supplied original per-sink comparison receipts, then independently repeated the approach with **extended scalar/native diagnostic inputs**, not just flag-unset controls 39/42. `review-legacy-scalars.mjs` overlays all seven changed production source files from base `4976c67d` in memory using the retained Node loader/Bun plugin. No source checkout or editing occurs.

`rr3-legacy-scalars-compare` asserts separate base/final byte equality on **both engines**:

| Sink | Serialized bytes per engine | Result |
|---|---:|---|
| traces | 1,175 | equal |
| console | 246 | equal |
| failures.log records | 355 | equal |
| webhook body | 88 | equal |
| shared catalogue | 10,963 | equal |
| per-agent presentation catalogue | 11,120 | equal |
| actual new-tools notices | 247 | equal |
| server listing | 693 | equal |

Per-sink SHA-256 values are in the comparison log. Normalization is explicit and unchanged: fixed Date.now for controlled trace calls, omission of generated failures.log at, and replacement of the ephemeral listing port. No credential/value/message or field-order differences are normalized away. This proves the exercised outputs, not universal all-input legacy equivalence.

### Commands, receipts and test gaps

Let E be this run's evidence directory and I the existing isolated wrapper. Each independent command ran through `orgasmic dispatch gate NAME -- "$I" ...`:

| Gates | Command after wrapper | Outcome |
|---|---|---|
| rr3-prior-node / rr3-prior-bun | node --import tsx / bun-1.4.3 E/review-probes.mjs | Pass; original HIGH/MEDIUM assertions inverted to require fixes |
| rr3-envelopes-node / rr3-envelopes-bun | same engines, E/review-envelope-toolset.mjs | Pass |
| rr3-followup-node / rr3-followup-bun | same engines, E/followup-probes.mjs | Pass |
| rr3-matrix-node / rr3-matrix-bun | same engines, E/review-scalar-matrix.mjs | Latest pass: six scalar families, two dial rounds, eight sinks, delayed ID/code |
| rr3-additional-node / rr3-additional-bun | same engines, E/review-additional.mjs | Pass **asserting outstanding defects** |
| rr3-native-node / rr3-native-bun | same engines, E/review-native-boundary.mjs | Pass **asserting outstanding defect** |
| rr3-short-values-node / rr3-short-values-bun | same engines, E/review-short-values.mjs | Pass: 94 credentials plus actual key/value echoes and recovery |
| rr3-legacy-scalars-{base,final}-{node,bun} | same engines, E/review-legacy-scalars.mjs base-or-final E/legacy-*.json | All pass |
| rr3-legacy-scalars-compare | node E/compare-legacy.mjs E | All 16 sink comparisons equal |

Gate logs are durable `gate-NAME-*.log` files in E. Latest additional defect logs end in `01M5XSWGRZDW08JCSCNAPB2S7F` (Node) and `01M5XSWH71NZ6SN2JBT3F9WS0T` (Bun); native boundary logs end in `01M5XST7M6C2N7EGKDT478X0B4` and `01M5XST82A2NMA73KGKAKE5MZJ`. Green defect-probe execution is **not approval**.

Two earlier matrix attempts per engine are preserved as failed harness runs: the fixture accidentally advertised true for credential true, then named its own ops kind with the credential text. Corrected those fixture inputs, without weakening server-derived field assertions. Latest matrix runs pass on clean trees; neither earlier failure is claimed as a new product regression.

Per the supplied-receipt instruction, did not rerun the identical full/build/typecheck/focused gates. Read their final clean-commit logs (summaries retained in E/supplied-receipts-inspected.txt): build, typecheck and diff check pass; **82/82 focused tests pass on each engine**; full npm test **7,941 tests, 7,896 pass, 45 skip, zero failures**. Independently reran focused production probes above on both engines. Read the dirty experimental baseline recipes/receipts: scalar tests 11 pass/11 fail against the prior source; class tests 10 pass/4 fail against f03101cf. These are not clean reusable baseline receipts and were not reproduced by mutating this worktree.

Environment receipt: Bun 1.4.3, Node 22.23.3, npm 10.9.9; same preserved lock digest `0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`. No reinstall.

Residual gaps: real TLS/provider deployment; external host admin/overlay integration; live model transmission; external webhook transport; additional runtimes; exhaustive diagnostic producers/native carrier classes; longevity/cost benchmarking. None explains away the reproduced returned-error or persisted-diagnostic leaks.

## Fix Directions

1. Close strict redaction at final returned-message and connection-diagnostic publication boundaries; include pre-initialize close codes, retained rotations and generated pagination messages.
2. Make strict diagnostic copies/projections safe for supported native objects and prevent raw-reference retention; verify persistence separately from traces.
3. Keep value-wise metadata admission, omission/no-alias semantics, original wire identifiers, complete dial snapshot, legacy byte controls and documented engine/retention policy.
4. Add regressions for these reproductions on both engines, rerun affected gates, and obtain another review. The present green suite does not establish class-wide R7 compliance.
