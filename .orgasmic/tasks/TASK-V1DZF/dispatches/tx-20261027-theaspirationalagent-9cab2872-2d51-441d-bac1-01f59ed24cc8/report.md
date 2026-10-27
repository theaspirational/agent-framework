# TASK-V1DZF — fix round 3

## Changed

Completed only the two requested fixes and the requested scalar-path audit, on the existing local branch `task-v1dzf-impl`; no push.

- Starting HEAD: `fb4c3329543d8526ad927e833eaa09adc256e147` (clean).
- Final HEAD: `fd575946248892f4c5ff7116254d0e71c5d496bd` (clean).
- Focused commits:
  - `ef8518857158c4cb3e74f9a771e020ceed851e42` — strict scalar diagnostic redaction and real-response regressions.
  - `f03101cffe33e7a1a6ade3c0b044d07dbfdb290f` — value-wise metadata inspection and punctuation regressions/controls.
  - `fd575946248892f4c5ff7116254d0e71c5d496bd` — manager-requested class-wide sink coverage, including null, scalar callback failures, numeric double-answer diagnostics and synthesized validation indices.
- Original upstream base remains `4976c67d5c7916a15046c627b68913994c33b3cb`; no merge/rebase/branch replacement.

Read the re-review report and all five requested probe scripts in full from run `run-01M5XPJ3KRCG9X4V9ZA3W2XGR9`, plus its legacy loader/comparison script. No task/conventions/previous implementer report reread.

### HIGH: scalar diagnostics

| Boundary | Change/evidence |
|---|---|
| Numeric RPC error code | `src/mcpl/log-value.ts:65-66` adds an opt-in strict argument: textual redaction precedes bounded/escaped field formatting. Default legacy numeric formatting is unchanged. `src/mcpl/server-connection.ts:2757-2775` supplies sticky strict policy. |
| Error data and SDK listing/notice/log/trace copy walker | `src/mcpl/protocol-family.ts:231-241` adds opt-in boolean/bigint/null textual redaction alongside existing number redaction; unmatched scalars retain their original types. Error-data callers opt in only for strict servers. `src/framework.ts:29167,29171` opts in at the existing strict diagnostic-copy boundary. |
| Numeric protocol-rejection error property | `src/mcpl/server-connection.ts:194-222` omits a matching strict numeric code from the returned diagnostic error, keeping the existing optional numeric public type and its rejection kind. Legacy code/data remain unchanged. |
| Numeric close code | `src/mcpl/server-connection.ts:2863-2866` redacts the code's text before the pending-request disconnect log. Handshake-close failures already pass their entire assembled text through the scoped redactor. |
| Delayed/echoed request identifiers and refusal codes | `src/mcpl/server-connection.ts:2641-2644,2774,2801-2805,2822-2823` redacts textual values before log formatting, including delayed IDs that could match a newly rotated credential. Wire identifiers/codes are not rewritten. |

The audit covered number/boolean/bigint conversion in the common log-value formatter, response error data, protocol errors, close diagnostics, request-ID diagnostics, orphan/error trace inputs, and the framework's shared diagnostic-copy serializer. `logValueRedacted` already converts any scalar before redaction; `loggedCode`'s numeric exception and the data walker's boolean/bigint exceptions were the bypasses. The modern HTTP path keeps its default legacy formatter/walker calls and is not changed. Bigint cannot arrive over JSON-RPC; its test exercises the actual SDK trace copy/listener boundary with host diagnostic input, not a fictional bigint wire response.

Production-path tests are in `test/mcpl-credential-scalars.test.ts:60-159`: real loopback RPC errors through public programmatic calls and the actual model-driven dispatch function (without a model call), real reconnect/provider rotation, captured console, returned errors/results and emitted traces. Current and retained previous numeric credentials are both echoed after rotation. Additional real responses cover boolean code/message/data, protocol-rejection codes, and pending-request WebSocket close codes. Matching values are redacted only in strict diagnostics; the control cases keep legacy values.

### MEDIUM: metadata admission

`src/mcpl/protocol-family.ts:833-869` now recursively checks individual actual object keys and scalar text against the existing raw/URL-encoded/JSON-escaped credential patterns. It does not stringify containers or concatenate fields. Array positions are not treated as authored keys. A path-local ancestor set permits shared acyclic children but rejects cycles; unreadable/unsupported objects or excessive depth fail conservatively. It does not invoke a custom toJSON hook as a substitute for inspection.

`test/mcpl-credential-scalars.test.ts:162-209` covers:
- Benign real initialize/list responses for each credential `"`, `,`, `:`, `{`, `}`.
- Actual nested key/value echoes in raw, URL-encoded, JSON-escaped and Bearer forms: unsafe tool entries remain withheld, never renamed; the healthy wire tool name is unchanged.
- Actual punctuation-bearing initialize metadata is still refused.
- Composite credentials that used to match only across JSON grammar/field boundaries now do not match; the same text inside an actual key/value still matches.
- Unreadable and cyclic data still refuses, while flag-unset admission remains unchanged.

Flag name/semantics are unchanged: literal `credentialRequired:true`, WebSocket-only, qualified exact engines, provider per dial, header-only/no fallback. No minimum length, engine pin, retention, withholding visibility/policy, operational identifier, dial snapshot, HTTP path, README, dependency or version change. README/transport/types have no diff in this round.

### Manager addendum: class-wide inventory, not only loggedCode

The first finalize was refused to deliver a manager addendum requiring every non-string class and every SDK sink to be inventoried/tested. Acknowledged by content and completed before re-finalizing. This broadened audit found and fixed **four additional instances of the same class**:

1. **Null** was another non-string scalar exception in the strict data walker. It now follows the strict textual-match rule (`protocol-family.ts:231-241`); unmatched nulls and all legacy nulls retain their types. The before run independently identified leaks in traces, failures.log, listings, queued notices and returned errors.
2. **Double-answer code:** a server-driven handler's second numeric response code was rendered into console text without strict filtering. `framework.ts:29532-29533` now filters its converted text before log formatting. The wire reply is not changed.
3. **Callback exceptions:** read-tap/onRead/inbound/error-listener callbacks can throw scalar server-derived data. `server-connection.ts:517-521,540,2648-2650,2669-2670,2781` converts then strictly redacts before formatting. A strict inbound diagnostic no longer retains an unredacted raw cause; legacy causes/formatting remain unchanged.
4. **Synthesized array index:** an admitted schema need not contain the credential, yet checkArgs can generate `items[6]` when the credential is `6`. `framework.ts:22664-22669` filters the returned validation diagnostic before both programmatic and model-driven callers receive it. It does not mask a callable name or change validation/routing.

#### Value-class inventory

The server wire carries JSON numbers (including numeric IDs), booleans, null, arrays and objects; numeric-looking strings and object keys are already textual. Keys that look numeric are still strings after JSON.parse/Object.entries. Bigint is not a JSON wire type, but conversion of a received numeric value by a host callback can produce one and is exercised. Undefined, symbols and functions cannot be carried as JSON server values; unexpected/unreadable metadata is refused, and callback text conversion is contained before formatting. Plain nested arrays/objects are traversed, not flattened through serializer grammar.

| Source/value class | Console paths | Shared displays/records | Operational metadata/state |
|---|---|---|---|
| Numeric RPC/protocol/close codes | strict loggedCode, whole-text handshake failure redaction, close-code text filter | trace/data walker; returned protocol code omitted on match | Wire code/type is not rewritten |
| Server numeric IDs and numeric-looking values | admission rejects matching live inbound IDs; delayed IDs redact before format | numeric values use textual-match rule; string forms use existing patterns | IDs on wire remain original; numeric-ID test uses actual server request/response |
| Booleans and null | scalar message/code text conversion; callback diagnostics | strict walker masks matching text and preserves unmatched type | Credential-bearing metadata entries refused before retention/catalogue adoption |
| Bigint derived from server data | converted before formatting in callback/log path | strict walker handles bigint; tests include queue/trace/ops/log serialization | Not falsely presented as a bigint JSON wire response/catalogue field |
| Numbers used as object keys | text redaction before log rendering | keys traversed/redacted, including nested keys and collision-safe copy behavior | Matching metadata keys cause admission refusal, not a renamed wire identifier |
| Arrays/nested objects | callbacks describe then redact; generated paths filtered | recursive per-value/key walk, before bounding/serialization | Array positions are not authored metadata keys |
| Array indices rendered into validation paths | generated diagnostic text goes through strict filtering | returned validation error and its emitted trace are filtered | Actual index-6 invalid call sends zero tools/call requests; no argument/index/name is changed on wire |

Fixed SDK discriminants, timestamps, native stack coordinates and implicit array serializer syntax are not server-authored authentication echoes. Tests examine the server-derived diagnostic fields, excluding native stack coordinates and the framework-added trace timestamp; failures.log's generated `at` is omitted from the assertions. Server-selected paths, IDs, values and keys are **not** normalized away.

#### Per-sink coverage on both engines

`test/mcpl-credential-sinks.test.ts:28-120` independently captures and checks each sink below for **number, boolean, null and host-derived bigint**, both current and retained after a real provider reconnect/rotation. Each fixture sends scalar-only carriers, numeric-looking strings, numeric IDs, arrays and numeric-looking object keys in real tools/list/RPC responses. Matching tools are withheld before adoption; accepted application structuredContent is left untouched and then deliberately passed into SDK diagnostics to exercise those downstream boundaries.

| SDK sink | Actual exercised boundary/assertions |
|---|---|
| console | real tools/call error code/message, fixed metadata refusal, plus double-answer and callback branches |
| traces | actual onTrace listener delivery, process:received for queued metadata and ops:alert; callback/double-answer/validation failures |
| failures.log | real notifyOps/logFailure append/read; exactly two per-round records asserted |
| webhook body | actual production fetch body serialization intercepted locally; both raw scalar message conversion and complete formatted/nested diagnostic text |
| listings | public listMcplServers and listToolClasses; each scalar/key carrier withheld and only the two benign tools remain |
| notices | actual new-tools notices plus pre-queue metadata copies drained from the real framework queue |
| catalogues | actual shared and per-agent presentation definitions for this server; no unsafe scalar/name/key carrier or masked alias advertised |
| returned host errors | real McplRequestError message/data/code, protocol error tests from the first file, scalar callback diagnostic errors, and actual array-index validation refusal |

Catalogue assertions select this server's actual definitions, not unrelated built-in SDK tools whose fixed boolean/schema syntax can coincidentally equal a short credential. Bigint is created only after receiving a numeric application value, never injected as invalid JSON. Legacy controls prove each exercised shared sink really received the synthetic value (except numeric returned data, which legacy already redacts). The separately required base-versus-final byte comparisons remain unchanged and pass again at final HEAD.

Additional production-path probes (`test/mcpl-credential-sinks.test.ts:124-201`) cover a numeric double-answer code, all four scalar callback exception branches, and real checkArgs index-6 validation through public toolsets--act. The callback probe uses real RPC reads and the actual containment/reporting functions, with a server-derived value; it does not claim an external server can install a host callback.

#### Before/after of every addendum test

The exact final **14-test file** ran against preceding commit **f03101cf** on both engines, using the same installed tree and a trapped temporary restoration of the three changed production source files. `r3-class-baseline-exact-node` / `r3-class-baseline-exact-bun`: **10 pass / 4 fail** per engine. Final: **14 pass / 0 fail** per engine.

| Test parameterization | f03101cf before | Final | Classification |
|---|---:|---:|---|
| `control legacy: {number,boolean,null,bigint} class at every SDK sink, current and retained rotation` (four tests) | PASS each | PASS each | Controls |
| `strict: {number,boolean,bigint} class at every SDK sink, current and retained rotation` (three tests) | PASS each | PASS each | Controls for the initial class fixes, not manufactured reds |
| `strict: null class at every SDK sink, current and retained rotation` | FAIL | PASS | Genuine red→green |
| `control legacy: server-derived numeric double-answer code in console and trace` | PASS | PASS | Control |
| `strict: server-derived numeric double-answer code in console and trace` | FAIL | PASS | Genuine red→green |
| `control legacy: scalar callback exceptions across console and returned diagnostic errors` | PASS | PASS | Control |
| `strict: scalar callback exceptions across console and returned diagnostic errors` | FAIL | PASS | Genuine red→green |
| `control legacy: actual array-index validation path across returned errors and SDK sinks` | PASS | PASS | Control |
| `strict: actual array-index validation path across returned errors and SDK sinks` | FAIL | PASS | Genuine red→green |

Exact commands:
```
orgasmic dispatch gate r3-class-baseline-exact-node -- "$I" node --import tsx --test test/mcpl-credential-sinks.test.ts
orgasmic dispatch gate r3-class-baseline-exact-bun -- "$I" bun-1.4.3 test test/mcpl-credential-sinks.test.ts
```
`class-baseline-exact.sh` preserves the restoration recipe. These are dirty experimental baseline receipts, not clean/reusable final gates. Two explicit test casts (the runtime structuredContent extension and the documented JavaScript non-string ops-message input) were corrected for typechecking before final qualification; there was no production typecheck failure.

The metadata matcher is precisely **per actual field**: actual object key strings and `String()` of scalar values, tested against known credential forms, recursively and independently. There is no whole-object JSON.stringify or matching across delimiters/field boundaries. The five punctuation credentials against ordinary initialize/list replies, plus actual punctuation-bearing metadata refusal cases and the 94-character probe, all reran green at final HEAD.

### Mechanical effects / environment

Build outputs and SDK test logs are ignored; temporary stores are removed. The existing ignored lockfile and installed dependency tree were reused, with **no reinstall**. No tracked mechanical/generated files were added.

`r3-final-environment` confirms Bun **1.4.3**, binary SHA-256 **7ce7d6b654eddeec20afddf2396317fba6dc19ab52788a27e894e1806bf8f24b**; Node **22.23.3**; npm **10.9.9**. The generated lockfile is byte-equal to its original preserved copy; SHA-256 **0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1**. This remains development resolution evidence, not a sealed closure.

## Verification Gates

Current evidence run: `run-01M5XQABAWESJNH878FWZNSW1C`, `evidence/`. All final gates below stood on clean final HEAD and exited 0. Every test/build/typecheck used the same existing `/tmp/task-v1dzf-evidence/isolated` wrapper: env-i, isolated empty package-manager config, offline npm, and the existing loopback-only libc traffic guard. No real credential/model/provider/external webhook call or external traffic was used. This is not kernel network-namespace isolation.

### Before/after outcomes of every added test

For the exact final 22-test file, temporarily restored the **four changed production files** from pre-fix HEAD `fb4c3329`, ran both engines on the same installed tree, and restored the final source with an EXIT trap. Unchanged production files already equal that HEAD. No checkout/reinstall was performed. These baseline gate receipts explicitly record a dirty source-overlay experiment at HEAD `ef851885`, not a reusable clean-base gate.

`r3-baseline-exact-node` and `r3-baseline-exact-bun`: **22 tests: 11 pass / 11 fail** on each engine, as follows. All 22 pass finally on each engine.

| Exact test suffix / parameterization | Before | After | Classification |
|---|---:|---:|---|
| `control legacy: real numeric RPC codes, current and retained rotation, console/errors/traces` | PASS | PASS | Control |
| `control legacy: boolean RPC code/message and response data` | PASS | PASS | Control |
| `control legacy: boolean/bigint nested SDK diagnostic scalars` | PASS | PASS | Control |
| `control legacy: numeric WebSocket close code in pending-request diagnostic` | PASS | PASS | Control |
| `control legacy: protocol rejection numeric code is safe for returned-error serialization` | PASS | PASS | Control |
| `strict: real numeric RPC codes, current and retained rotation, console/errors/traces` | FAIL | PASS | Genuine red→green |
| `strict: boolean RPC code/message and response data` | FAIL | PASS | Genuine red→green |
| `strict: boolean/bigint nested SDK diagnostic scalars` | FAIL | PASS | Genuine red→green |
| `strict: numeric WebSocket close code in pending-request diagnostic` | FAIL | PASS | Genuine red→green |
| `strict: protocol rejection numeric code is safe for returned-error serialization` | FAIL | PASS | Genuine red→green |
| `metadata: benign initializer/list and separate fields with punctuation credential` — five tests: quote, comma, colon, opening brace, closing brace | FAIL each | PASS each | Genuine red→green |
| `control metadata: actual punctuation-bearing initializer refused` — same five credentials | PASS each | PASS each | Controls |
| `metadata: matches stay inside individual keys/scalars, including encoded and escaped values` | FAIL | PASS | Genuine red→green |
| `control metadata: unreadable and cyclic data remains conservatively refused` | PASS | PASS | Control |

Exact baseline commands (I = existing isolated wrapper):
```
orgasmic dispatch gate r3-baseline-exact-node -- "$I" node --import tsx --test test/mcpl-credential-scalars.test.ts
orgasmic dispatch gate r3-baseline-exact-bun -- "$I" bun-1.4.3 test test/mcpl-credential-scalars.test.ts
```
The retained `baseline-exact.sh` records the source restoration procedure. It used the external saved final-source copy; equivalently, reproduce by saving the four final files, replacing them with `git show fb4c3329:<path>`, running these commands, and restoring the saved bytes.

Earlier development receipts are retained, not substituted for the exact baseline: a default-argument harness issue was corrected to ensure explicit undefined really leaves the flag unset; a deep-data control was removed because Bun can stringify that depth (not an existing failure); an overly strong assumption that the programmatic API emits tool:failed was corrected by exercising the actual model-driven dispatcher; one test-only Error cast was corrected for typechecking. These are harness/type-annotation corrections, not pre-existing suite failures. The final baseline reran the strengthened tests against pre-fix production source.

### Final commands and counts

```
orgasmic dispatch gate r3-final-build -- "$I" npm run build
orgasmic dispatch gate r3-final-typecheck -- "$I" ./node_modules/.bin/tsc --noEmit
orgasmic dispatch gate r3-final-node -- "$I" node --import tsx --test test/mcpl-credential-required.test.ts test/mcpl-credential-scalars.test.ts test/mcpl-credential-sinks.test.ts
orgasmic dispatch gate r3-final-bun -- "$I" bun-1.4.3 test test/mcpl-credential-required.test.ts test/mcpl-credential-scalars.test.ts test/mcpl-credential-sinks.test.ts
orgasmic dispatch gate r3-final-diff -- git diff --check
orgasmic dispatch gate r3-final-tests -- "$I" npm test
```

| Gate | Result |
|---|---|
| r3-final-build | PASS (tsc and repository postbuild) |
| r3-final-typecheck | PASS |
| r3-final-node | 82 tests, 82 pass, 0 fail/skip |
| r3-final-bun | 82 tests, 82 pass, 0 fail/skip |
| r3-final-diff | PASS |
| r3-final-tests | **7,941 tests, 364 suites; 7,896 pass, 45 skip, 0 fail** |

Full-suite increase from starting HEAD is exactly the 36 added tests (22 initial regressions/controls plus 14 manager-addendum tests). Intermediate f03101cf also passed its 7,927-test suite before the manager addendum; that receipt was not reused for the final source. Carried-forward pre-fix full-suite evidence in the requested re-review is 7,905 tests / 7,860 pass / 45 skip / 0 fail, with build/typecheck passing. The original upstream baseline there is 7,859 / 7,814 / 45 / 0. Those are previous receipts, not falsely claimed as freshly rerun this round. No pre-existing failures or final regressions were observed.

The 46 retained strict tests also reran per engine, including redirect refusal for 301/302/303/307/308 between two loopback origins, the unsupported-engine guard, retained rotation, no-leak metadata/model/listing/queue/trace paths, and provider-await snapshot mutation. Only Bun 1.4.3 and Node 22.23.3 remain qualified; newer engines are still refused.

### Required base-versus-final per-sink legacy equality

Copied the reviewer's `review-legacy-sinks.mjs`, `base-source-loader.mjs` and unchanged `compare-legacy.mjs` into this run's evidence. The **only harness change** is extending both base-source overlay file lists with `src/mcpl/log-value.ts`, so all **seven** changed production files load from original base `4976c67d` in base mode. The new formatter must not accidentally load final source during the base comparison. Logs name all seven overlays on each engine. No repository checkout/source mutation is used in these comparison gates.

With E = `/tmp/task-v1dzf-round3-evidence` (scripts and output JSON copies also retained in this run's evidence):
```
orgasmic dispatch gate r3-legacy-base-node -- "$I" node --import tsx "$E/review-legacy-sinks.mjs" base "$E/legacy-base-node.json"
orgasmic dispatch gate r3-legacy-final-node -- "$I" node --import tsx "$E/review-legacy-sinks.mjs" final "$E/legacy-final-node.json"
orgasmic dispatch gate r3-legacy-base-bun -- "$I" bun-1.4.3 "$E/review-legacy-sinks.mjs" base "$E/legacy-base-bun.json"
orgasmic dispatch gate r3-legacy-final-bun -- "$I" bun-1.4.3 "$E/review-legacy-sinks.mjs" final "$E/legacy-final-bun.json"
orgasmic dispatch gate r3-legacy-compare -- "$I" node "$E/compare-legacy.mjs" "$E"
```

Every comparison passes, independently per sink on **both** engines:

| Sink | Compared serialized bytes per engine | Result |
|---|---:|---|
| traces | 717 | equal |
| console | 242 | equal |
| failures.log records | 183 | equal |
| webhook serialized body | 88 | equal |
| shared catalogue | 10,963 | equal |
| per-agent presentation catalogue | 11,120 | equal |
| actual new-tools notices | 247 | equal |
| server listing | 693 | equal |

The comparison log records SHA-256 for all 16 sink comparisons. Normalization is unchanged: fixed Date.now for controlled trace calls, omission of failures.log `at`, and substitution of the ephemeral listing port with `PORT`. Credentials, metadata, messages and field order are not normalized away. This proves these exercised shared-sink outputs equal, not exhaustive equality for every possible legacy input.

### Supplemental 94-character probe

Reran the reviewer's complete `review-short-withholding.mjs` with **only** its expected-defect assertion changed from `syntaxOnly > 0` to `syntaxOnly === 0`:
```
orgasmic dispatch gate r3-short-withholding-node -- "$I" node --import tsx "$E/review-short-withholding.mjs"
orgasmic dispatch gate r3-short-withholding-bun -- "$I" bun-1.4.3 "$E/review-short-withholding.mjs"
```
Both engines: 94 attempted, **26 actual-value initializer refusals, zero syntax-only refusals**, 68 connected, 25 ordinary entries withheld out of 408 offered. Reviewed pre-fix results were 31 refused, including five syntax-only refusals. No minimum-length policy was added.

Both also preserve the diagnostic/recovery assertions: entry withholding emits its fixed diagnostic only to console, not listing/trace/failures; old credential echoes remain withheld after rotation; a genuinely safe replacement returns on real list-changed ingress. Withholding visibility and retention semantics were deliberately not redesigned.

## Unmet Criteria

None in this fix-round brief. All requested fixes and the manager class-wide addendum, both-engine focused checks, per-sink legacy comparisons, build, typecheck, full suite, local commits and no-reinstall/no-push boundaries are satisfied. Independent review and candidate sealing remain downstream work, not performed here.

## Residual Risk

- Exact engine pins, unbounded strict historical retention/cost, and console-only per-entry withholding visibility remain as documented and explicitly requested. No minimum credential length was introduced; actual short-token collisions can still refuse benign metadata/tools.
- Tests use synthetic numeric-loopback peers. No real TLS/provider/host deployment, live model request, external webhook transport, additional engine qualification, or longevity benchmark is claimed.
- Accepted application content/structuredContent and inbound application bodies remain outside metadata withholding; this is not blanket malicious-server exfiltration protection.
- The audit and regressions exercise shared boundaries plus the named real-response paths, not every possible diagnostic producer/input combination. Request routing and wire values are unchanged.
