# TASK-V1DZF security re-review

## Verdict

**Do not approve.** At `fb4c3329543d8526ad927e833eaa09adc256e147`, the previously reported tool-listing/notice/trace disclosure and provider-await dial-policy race are closed in the exercised paths. However, an SDK console sink still discloses an accepted strict credential, so R7 remains unmet. There is also a new metadata-admission false positive.

## Findings

### HIGH — security / unmet acceptance: numeric RPC error codes bypass credential redaction

**Locations:** `src/mcpl/log-value.ts:63-64`; caller `src/mcpl/server-connection.ts:2759-2761`. The new response admission at `src/mcpl/server-connection.ts:2450-2457` excludes error responses and does not close this sink.

`loggedCode` sends numeric values directly to `logValue`, bypassing the scoped redactor. Strict providers accept numeric-only strings. An authenticated server can return a tools/call error whose numeric `code` equals that credential, with a completely innocuous message. The SDK prints the complete credential in its console error line. This is diagnostic metadata, not an excluded tool-result/application payload.

**Reproduction:** `review-probes.mjs`, probe `numeric-rpc-error-code`, generates a fresh exactly representable decimal credential, connects through the real `McplServerConnection.connect` WebSocket path, calls `sendToolsCall`, and receives `{code: Number(token), message: 'fixed failure'}`. Both Node 22.23.3 and Bun 1.4.3 assert and report:

```
{"probe":"numeric-rpc-error-code","consoleLeak":true}
```

No credential is printed by the probe itself. The defect is an **unmet strict-mode guarantee**, not a claim that the existing numeric formatter regressed relative to the base: its numeric bypass already existed there. The passing suite exercises string errors and numeric error data, but does not prove numeric error-code redaction.

**Fix direction:** apply credential redaction to the textual representation of numeric codes before log formatting, while preserving unchanged output when nothing matches. Preserve the requested legacy contract, using strict-aware handling if necessary. Add real-response tests for current and retained rotated numeric credentials on both engines; check console output as well as returned errors and traces.

### MEDIUM — correctness: JSON syntax is mistaken for credential-bearing metadata

**Locations:** `src/mcpl/protocol-family.ts:833-837`; initialize admission `src/mcpl/server-connection.ts:1403-1405`.

Admission searches `JSON.stringify(value)` wholesale, including serializer-generated punctuation. A provider credential `':'` is a valid non-empty header-carryable string under the implemented contract. A normal initialize result with no colon in any key or string value is nevertheless refused because JSON inserts colons between properties and values. Thus a successfully authenticated, ordinary server cannot finish connecting. Quote/composite punctuation credentials have analogous collisions. This is not merely withholding an identifier that actually contains a known credential.

**Reproduction:** the independent `json-syntax-false-positive` probe gets one authenticated loopback upgrade, then `metadata-credential` from an otherwise normal initializer on **both engines**. There is no hostile metadata in this case.

**Fix direction:** inspect actual metadata keys and scalar values recursively, rather than matching across JSON grammar or field boundaries. Retain raw/URL/JSON-escaped representation coverage within those values, and conservative failure for unreadable data. Test valid punctuation credentials against benign initialize/list responses, alongside actual punctuation-bearing metadata.

## Open Questions

None requiring a manager decision to reproduce these findings. **Owner policy question:** whether strict mode should impose an explicit minimum credential length/format; see the quantified follow-up below. Do not silently add such a restriction to the present headerCarries-based contract.

A short token that really occurs inside a name remains a separate compatibility limitation: the `benign-short-substring` probe confirms token `abc` withholds `abc_search`. Given the explicit no-length-floor redaction and instruction to omit credential-bearing identifiers rather than rename them, I classify that conservative substring withholding as an **intended limitation**, not a third finding. It should remain clear to hosts; it does not justify matching JSON punctuation that was never in a metadata value.

## Verification Notes

### Scope and read-only status

Read the live task record, project.org, empty gotchas/conventions collections, original requirements/clarifications, prior reviewer report and scripts, complete fix-round report (`evidence/last.txt`), complete eight-file base-to-final source/test/docs diff, and relevant connection/framework consumers. No applicable AGENTS.md was found. Risk is **risky**: P1, credential safety-path blast radius, and breadth above 300 net lines. No source edits, commits, installations, branch movement or external traffic. Evidence scripts/report are outside the worktree; final tracked status is clean at the reviewed commit.

### Manager addenda: sink inventory and model/callable-name semantics

The inventory below covers the server-metadata-to-SDK paths identified by source inspection, including model-facing surfaces, not just operator listings. “Probed” means actual production serialization/admission with synthetic loopback inputs, on **both engines**. Shared-boundary coverage is not a claim to execute every trace event variant or every downstream renderer independently.

| SDK-owned sink / state feeding it | Reviewed boundary and independent evidence | Outcome |
|---|---|---|
| `listMcplServers` (toolClasses, connection/manifest/grant/filter fields), separate `listToolClasses` | `strictDisplayData` detached listing copies; `review-probes.mjs` calls public listings after current/rotated tools/list | Clean in exercised paths |
| Model-facing native/static definitions, shared catalogue, per-agent presentation definitions, code-execution catalogue inputs | tools/list admission before returned inventory/read tap; inspected catalogue builders; probes serialize `getAllTools` and actual `availableToolsForPresentation` output, including name/description/schema/nested-key/value echoes | Unsafe entries omitted; benign original names unchanged |
| Dynamic tool definitions, toolset catalogue/look titles, schemas, descriptions, declaration-derived reminders | Initialize/RPC/hint admission before ToolPresence; `review-envelope-toolset.mjs` exercises actual toolset controller/catalogue and public look through reconnect | Clean in exercised paths |
| New-tools notices and their newTools/removedTools metadata; queued notice copies; `process:received` | Pre-queue copy filter plus upstream tools/list admission; adapted prior probe checks real initial tool-diff notice, reconnect/list-changed, queues and trace listeners | Prior HIGH reproduction now passes |
| Persisted toolset changes/model-window notices; meta-tool open/act/close outputs | Notice admission before addMessage, controller metadata admission; second script calls public meta tools, verifies actual stored “tool changes” messages and original benign dynamic call | Unsafe open/close metadata refused; look/catalogue/notices clean; act application result deliberately unchanged |
| Initialize serverInfo/capabilities/toolset declarations; manifest and other RPC result metadata feeding SDK registries/listings | Second script tests serverInfo, declarations, nested keys; manifest/list/open/close/tools-call metadata in raw, percent-encoded and Bearer forms | Refused before adoption/consumer delivery |
| Standalone tools/hints, result hints, push-carried hints; tools/list_changed control metadata | Admission before tap/dispatch; second script asserts unsafe standalone/push hints and list-change requests never reach read taps/handlers; actual reconnect/list refresh in first script | Clean in exercised paths |
| Push/channel/control-plane envelopes, registration labels and nested metadata | Second script sends real push/event, channels/register and channels/incoming requests and checks fixed refusals/no handler delivery | Refused; application bodies are deliberately a different boundary |
| All framework trace listener serializers: process/tool/server/module/reconnect/error/ops and dependent UI/observer listeners | Shared `emitTrace` copy filter, before bounding/delivery; captured real connection, tool, error, reconnect, queue and ops flows in both scripts | Clean in exercised paths; not every event producer individually triggered |
| Console class/duplicate/toolset/metadata diagnostics and connection/provider/transport/error lines | Upstream admission, class/duplicate display filtering and existing scoped redactors inspected; real metadata refusals and RPC string errors captured; retained focused tests cover client-error paths | **Not fully closed: numeric RPC code leak above** |
| Durable failures.log and ops-alert data/trace | First script invokes real notifyOps/log writer and reads actual failures.log | Clean for tested nested/current/rotated forms |
| Optional webhook JSON body | First script intercepts production fetch serialization, with a synthetic loopback hook and no outbound request | Clean for tested forms; external delivery not tested |
| Config/endpoint displays, runtime connect/restart errors, transport diagnostics | Existing registry/endpoint redaction, strict dial snapshot; retained focused receipts plus independent mutation/follow-up probes | No additional defect found |

No masked callable identifier is invented. Credential-bearing tools are absent from advertisements, with a fixed `metadata-credential` diagnostic; admitted tools retain their exact original callable names, verified against server-received calls. `redacted` in remaining diagnostic copies is **display-only**, not a replacement name to call. The catalogue probes confirm no masked aliases are advertised. Low-level arbitrary wire-name routing remains the pre-existing host API behavior; omission is not a new authorization barrier.

No unset-flag regression was found: metadata admission returns the original response when strict credentials are absent, display filtering returns the original object when no strict server exists, and both-engine legacy controls retain credential-bearing listings/notices and exact wire names. The new class display callback is then identity. This is source/control evidence, not an exhaustive byte-for-byte proof for every possible legacy input.

**Deliberately excluded:** accepted tool-result `content`/`structuredContent`, toolsets--act application content, inbound application message bodies, internal wire/routing buffers, arbitrary trusted host callback state, and unknown encodings. The dynamic probe explicitly verifies unchanged application result content; retained tests cover the inbound-body distinction. SDK diagnostics derived from those sources are not categorically exempt—Finding 1 concerns an SDK diagnostic. README.md now clearly states these boundaries and disclaims blanket malicious-server exfiltration protection. No live model request or external webhook delivery was performed.

### Manager follow-up: explicit engine, retention, boolean and lifecycle answers

**(a) Exact engine gate — intended limitation.** `src/mcpl/transport.ts:616-621` checks whether `process.versions.bun !== undefined`; if so, only exact string `'1.4.3'` passes, irrespective of Node metadata. Otherwise it requires `process.release.name === 'node'` and exact `process.versions.node === '22.23.3'`. It is not semver matching, constructor identity checking or a minimum-version policy. Bun 1.4.4 and differently numbered Node patches refuse before provider/network even if a host declares Bun >=1.4.3. This is explicitly required to remain pinned and now honestly documented in README.md:387-393, so not a finding. Reused follow-up scripts confirm refusal after changing reported patch metadata; they do not claim execution on those newer engines. Trusted same-process metadata/loader spoofing is not prevented.

**(b) Strict retention — unbounded, documented tradeoff.** `src/mcpl/protocol-family.ts:292-322` retains every distinct sent strict token for the configuration object's reachable lifetime. Identical values are deduplicated with `indexOf` and moved to newest without growing the set; no version bump solely for a repeat. Strict retention disables sixteen-entry eviction. WeakMap collection only helps after the config becomes unreachable. There is **no count/byte/age or cumulative cost bound**: memory, insertion scans, pattern construction/compilation and matching grow with distinct rotations; aggregate framework display filtering reconstructs patterns repeatedly. README.md:350-357 documents this. No longevity benchmark was run. Per the manager's instruction to preserve retention, this is an operational limitation, not a new performance finding.

**(c) String `"true"` — configuration problem.** Literal string true is rejected by shared configuration validation and the boolean guard; it cannot silently enable/disable the flag. Independently re-executed follow-up probes assert both refusals.

**(d) Provider before dial — holds in inspected SDK lifecycle paths.** The shared transport check at `transport.ts:621` precedes provider resolution/socket construction. Runtime connect, automatic reconnect and restart all reach that path. Both-engine production follow-up probes confirm missing-provider runtime connect makes zero upgrades and a missing-provider restart makes no additional upgrade (restart first tears down its old connection). No separate admin/overlay dial constructor exists in this SDK source. External host plumbing was not inspected: the conclusion applies when added servers enter the public SDK paths preserving literal `credentialRequired:true`, not to a host silently dropping the flag/provider policy.

**All dial inputs snapshotted:** `transport.ts:602-607` captures id, url, transport/command/protocol binding, static-token policy, tokenTransport, required flag and provider reference before validation/await. Header construction/no-fallback/followRedirects:false derive from those settings. There is no configurable separate headers override to reread. The original object remains for provider `this` and registry identity only. My adapted prior probe mutates every listed field during the wait; only the original endpoint sees an upgrade, with fresh Authorization, no token query, original id, and no replacement-provider invocation. Both engines pass. Retained tests additionally prove flag mutation cannot disable post-dial metadata admission.

### Gates and baseline comparison

Read the seven supplied clean-commit gate logs rather than rerunning them:

- `fix-final-build`, `fix-final-typecheck`, `fix-final-diff-check`: pass.
- `fix-final-node`: 89 tests, 88 pass, one skip, zero failures.
- `fix-final-bun`: all 46 credential tests pass, no skips/failures.
- `fix-compat-node`: 130 pass, zero failures.
- `fix-final-tests`: 7,905 tests, 7,860 pass, 45 skip, zero failures.

Their supplied log paths identify final clean HEAD `fb4c3329`. Original baseline receipt logs show build/typecheck pass and 7,859 tests, 7,814 pass, 45 skip, zero failures. Previous rejected commit has 7,897 tests, 7,852 pass, same skips. Fix-round dirty/test-added baseline logs show 39/41 passing (metadata and mutation fail), then 41/46 passing (five strengthened admission failures), on Node and Bun; final 46/46 passes. Those dirty baseline runs are development comparisons, **not reusable pristine checkout receipts**. The claim about temporarily restoring 1da0c9ff source is in the implementer report; the addendum logs themselves record dirty HEAD 2e61c25b. No baseline checkout/source mutation was performed during this read-only review; the later manager-requested per-sink comparison uses an in-memory base-source overlay, described below.

Same installed lock digest remains `0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`. No reinstall occurred.

### Independent commands and retained evidence

All independent tests used `orgasmic dispatch gate NAME -- /tmp/task-v1dzf-evidence/isolated ...`, the same env-i/offline-npm/loopback-only libc-guard wrapper. Credentials are synthetic; servers bind numeric loopback ephemeral ports. The guard is not kernel network-namespace isolation.

Current review evidence: run `run-01M5XPJ3KRCG9X4V9ZA3W2XGR9`, `evidence/`:

- `review-independent-node`: `node --import tsx <evidence>/review-probes.mjs`; latest log `gate-review-independent-node-01M5XPQ8AYKPZ5TWMAQ0TJP187.log`.
- `review-independent-bun`: `bun-1.4.3 <evidence>/review-probes.mjs`; log `gate-review-independent-bun-01M5XPQ8W41PRZ5BPZBM3MRYXG.log`.
- `review-envelopes-node`: `node --import tsx <evidence>/review-envelope-toolset.mjs`; log `gate-review-envelopes-node-01M5XPST98G4WFB67R29P7G9EE.log`.
- `review-envelopes-bun`: `bun-1.4.3 <evidence>/review-envelope-toolset.mjs`; log `gate-review-envelopes-bun-01M5XPSWW33CC4TJTZQV1KCQX7.log`.
- `review-followup-node`: `node --import tsx <evidence>/followup-probes.mjs`; log `gate-review-followup-node-01M5XPTJW39NVN6NTEFQJ7K0CJ.log`.
- `review-followup-bun`: `bun-1.4.3 <evidence>/followup-probes.mjs`; log `gate-review-followup-bun-01M5XPTKA7EE5V97S27XARDD2M.log`.

All latest runs exit 0 with clean start/end trees. **The first pair deliberately asserts the two defects, so green probe execution is not security approval.** An earlier independent Node attempt failed a harness assertion expecting a second new-tools notice despite identical surviving strict inventory. Corrected to require the actual initial notice; the production list-changed/reconnect paths remain exercised. That failed attempt is preserved in `gate-review-independent-node-01M5XPPZE73WVWJ4X8JC2VRWHN.log`; it is not classified as a product regression.

Residual gaps: no real TLS/provider deployment, external host admin/overlay integration, live model transmission, external webhook transport, additional runtime, exhaustive trace-producer matrix, or long-duration retention/cost benchmark. None explains away the reproduced console leak.

## Fix Directions

1. Close numeric-code credential disclosure at the SDK formatter boundary and test real error responses on both supported engines, including retained rotations.
2. Make metadata detection operate on actual keys/values, not JSON punctuation; add benign valid-credential controls.
3. Preserve entry withholding/no-alias semantics, legacy controls, complete dial snapshot, documented exact pins and retention tradeoffs.
4. Rerun affected focused gates and required suite after the fix, then obtain re-review. Existing green receipts do not establish R7 compliance.


## Additional manager follow-up: per-sink legacy comparison, short credentials, withholding diagnostics

This section acknowledges and answers all three questions delivered when the first finalize was refused.

### 1. Legacy behavior: now compared per shared sink, not only controls 39/42

Ran `review-legacy-sinks.mjs` against base **4976c67d** source and final source on **both engines**, with the same dependencies and a flag-unset configuration. No repository was edited or checked out. For base execution only, a Node load hook (`base-source-loader.mjs`) or Bun onLoad plugin supplies `git show 4976c67d:<path>` in memory for **all six changed production source files**; unchanged files load normally. Logs explicitly name every overlaid source file. This is a controlled base-code experiment at a final-commit gate receipt, not a claim that the receipt itself stood on a base checkout.

The real loopback tools/list response contains a credential-bearing name, description, schema/key/value metadata, invalid class and duplicate. The script exercises production connect, real RPC error logging, actual new-tools notice construction, shared trace delivery/queue insertion, notifyOps, actual failures.log writing/reading, production fetch body serialization, and actual shared/per-agent catalogue builders. It saves serialized sink outputs in `legacy-{base,final}-{node,bun}.json`.

`review-legacy-compare` asserts **byte equality of each captured sink representation separately**, on each engine:

| Sink | Compared serialized bytes, each engine | Result |
|---|---:|---|
| traces | 717 | equal |
| console | 242 | equal |
| failures.log records | 183 | equal |
| webhook serialized body | 88 | equal |
| shared tool catalogue | 10,963 | equal |
| per-agent presentation catalogue | 11,120 | equal |
| actual tool notices | 247 | equal |
| server listing | 693 | equal |

**Normalization is explicit:** controlled trace calls use a fixed Date.now; failures.log's nondeterministic `at` field is omitted; the server listing's ephemeral endpoint port is replaced by `PORT`. No credential, metadata, message or field-order differences are normalized away. Console lines, notice objects, catalogues and webhook bodies require exact equality. Thus the tested shared-sink cases are proven equal, but this is not an exhaustive all-input proof or a claim that independently generated wall-clock timestamps/ports are literally identical.

Latest gates (same isolated wrapper, all exit 0, clean final HEAD):

- `review-legacy-base-node`: `node --import tsx <evidence>/review-legacy-sinks.mjs base <evidence>/legacy-base-node.json`; log `gate-review-legacy-base-node-01M5XQ4CPWB0JE927W0EYXGW7H.log`.
- `review-legacy-final-node`: same script, `final`, final-node output; log `gate-review-legacy-final-node-01M5XQ4DB60NPR4HGNVTSME9B1.log`.
- `review-legacy-base-bun`: `bun-1.4.3 <evidence>/review-legacy-sinks.mjs base <evidence>/legacy-base-bun.json`; log `gate-review-legacy-base-bun-01M5XQ4DS9A4JJ6HHR1V4QRNBT.log`.
- `review-legacy-final-bun`: same script, `final`, final-bun output; log `gate-review-legacy-final-bun-01M5XQ4E138P9V68HMVWJC40ZN.log`.
- `review-legacy-compare`: `node <evidence>/compare-legacy.mjs <evidence>`; log `gate-review-legacy-compare-01M5XQ6G2R3H5SYQK6KK4EJM6M.log`, including per-sink SHA-256 digests.

Initial attempts incorrectly expected duplicate-tool ops alerts to also produce a console line; that same harness assertion failed on base and final, both engines. Removed only that invalid expectation; unknown-class and actual RPC console logging remain asserted, and ops/failures serialization is separately exercised. The four earlier failed gate logs remain preserved under the same gate names; latest successful receipts above supersede them. These were harness mistakes, not product regressions.

### 2. Quantified short-token behavior and owner decision

`review-short-withholding.mjs` actually connects once for **each of the 94 valid one-character printable non-space ASCII credentials** (U+0021–U+007E), with the same ordinary initialize response and six ordinary tool entries. Results are identical on both engines:

- **31/94 (33.0%)** cannot finish initialization.
- **5/94** are refused only because of JSON-generated punctuation, with no matching actual key/string/scalar value: quote, comma, colon and braces. This strengthens Finding 2.
- The other **26 initializer refusals** match actual ordinary metadata text/keys. This is conservative no-length-floor admission, not syntax-only false detection.
- Of **63 connected configurations**, **25 of their 378 offered ordinary tool entries (6.6%)** are withheld. These figures characterize this explicit fixture, not a population estimate for real servers.
- Separate token `abc` / name `abc_search` production probe also confirms ordinary names can disappear solely through a short substring collision.

**Classification:** JSON grammar collisions are the MEDIUM correctness finding. Actual substring collisions are an intended but substantial **strict-mode compatibility/availability limitation** under the current no-minimum/no-leak policy, not an unstated guarantee that benign names always survive. Accepted historical rotations make the collision set grow.

**Recommendation to the owner:** require hosts to use high-entropy credentials (e.g. at least 128 random bits) and decide explicitly whether the SDK should enforce a documented minimum length/format in strict mode. A minimum would reduce these incidental collisions and should be considered before rollout, but length alone does not prove entropy. Changing R3's current accepted-value contract requires owner approval; do not introduce it silently, use it instead of fixing value-wise admission, or present it as a replacement for numeric-code redaction.

### 3. Withholding visibility and recovery after rotation/re-list

The same script connects a real framework to a server advertising one safe entry and one credential-bearing entry, then reconnects with a different token and finally announces a clean replacement definition.

For **tools/list entry withholding**, the dedicated `metadata-credential` diagnostic reaches **console.error only** (`server-connection.ts:503`). The public host connect resolves successfully. The listing reports connected and a reduced toolCount, **without a withholding reason/count**. There is no dedicated withholding trace, failures.log record, or error returned to the host by this successful connect. These absences are asserted from actual captured traces/listings/log-file delta, not inferred from an empty server. Whole initialize/manifest/RPC-metadata refusals do return errors, but that is different from filtered tool entries. Thus an operator who does not retain stderr can miss the specific cause of a missing tool. This is a residual diagnostic limitation; exposing a fixed reason/withheld count in operator state or an ops alert would improve it without revealing rejected identifiers.

**Rotation alone does not make an old echoed credential safe in this design:** all old credentials remain in the same config's registry. The real reconnect re-lists tools, but the old-token-bearing entry is still withheld after the new credential arrives. This is consistent with the mandated lifetime retention, not a stale negative cache. When the server changes the rejected definition to a genuinely safe name and sends real tools/list_changed, the public catalogue returns to two entries and advertises the exact safe replacement. The probe asserts that recovery, demonstrating there is no permanent blacklist independent of metadata. A fresh configuration object has a fresh registry scope; no claim is made that discarding historical redaction policy is automatically safe for retained host diagnostics.

Gates (same wrapper; both exit 0, clean final HEAD):

- `review-short-withholding-node`: `node --import tsx <evidence>/review-short-withholding.mjs`; log `gate-review-short-withholding-node-01M5XQ6G7DQ2CC1TE7Q3CTQD73.log`.
- `review-short-withholding-bun`: `bun-1.4.3 <evidence>/review-short-withholding.mjs`; log `gate-review-short-withholding-bun-01M5XQ6GRJMVAZCKWWW5WAGARB.log`.

These follow-up results leave the verdict unchanged: **do not approve; fix the HIGH and MEDIUM above.** No tracked worktree edits were made.
