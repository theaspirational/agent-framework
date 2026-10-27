# TASK-V1DZF fix round — final report

## Changed

Starting HEAD: `f4e38cedc652404cc059bb360cdaff19dcc5ad8d`. Final HEAD: **`fb4c3329543d8526ad927e833eaa09adc256e147`**, clean, same local branch `task-v1dzf-impl`. Seven files changed relative to the reviewed commit: README.md, src/framework.ts, src/mcpl/protocol-family.ts, src/mcpl/server-connection.ts, src/mcpl/tool-classes.ts, src/mcpl/transport.ts, test/mcpl-credential-required.test.ts (458 insertions, 46 deletions). Risk remains risky: P1, credential safety path, and breadth over 300 net lines.

Read the reviewer's complete report.md and review-probes.mjs from run `run-01M5XJNGPWYYYH8D0HKTGCA7VK`. Did not repeat task/convention/previous-report startup reads. No dependency, version, engine allowlist, strict-rotation eviction, modern HTTP authentication, host-repository or release changes. No push, tag or PR.

### Both manager addenda acknowledged and implemented

The first finalize attempt was refused to deliver two queued manager addenda; it did not complete this round. They required (1) a complete SDK sink inventory with both-engine probes and deliberate exclusions, (2) an explicit distinction between masked diagnostic names and callable names, (3) snapshots/tests for every dial-policy input, and (4) model-facing tool definitions, toolsets and notices in that inventory, **withholding credential-bearing entries rather than leaving their wire names in model metadata**. They also required clearly separating SDK metadata protection from unmodified application results, with no blanket malicious-server exfiltration claim.

The final implementation therefore goes beyond the first mask-only draft: **strict metadata is admitted before it becomes SDK catalogue/state, while diagnostic copies remain filtered at serialization boundaries.** This report supersedes that draft.

Focused local commits, oldest first:

- `7cc6f6b0` — SDK display/diagnostic boundary filtering and initial production-path tests.
- `dd013cfd` — validated strict dial snapshot and race test.
- `f5d4e206` — exact engine-pin and retention-cost documentation.
- `1da0c9ff` — preserve legacy diagnostic harness compatibility.
- `8b725b9e` — withhold credential-bearing metadata before SDK catalogues/state, including dynamic hints and flag-mutation protection.
- `2e61c25b` — distinguish metadata admission from application payloads in docs.
- `0360147b` — extend end-to-end sink qualification, including meta-tool open/act/close and nested metadata under benign identifiers.
- `fb4c3329` — explicit asynchronous test result types for the resolved TypeScript compiler.

### Admission and display semantics

`src/mcpl/server-connection.ts:490-525,1403-1407,2448-2487` and `src/mcpl/protocol-family.ts:824-843`:

- A strict tools/list entry with a credential anywhere in its name, description, schema, nested metadata keys/values or JSON forms is **omitted before the read tap and returned inventory**. Benign entries retain their exact wire names; no redacted alias is invented.
- Credential-bearing initialize and RPC response metadata is refused with fixed `metadata-credential` text. Standard application `content` and `structuredContent` fields are not rewritten; unsafe metadata can refuse a response as a whole.
- Unsafe inbound control-plane/envelope metadata is refused before handlers/registries. Application push bodies and channel/inference message content are deliberately separate from their envelopes.
- Unsafe standalone/push/result hints are withheld before toolset presence adopts them. SDK toolset notices also have an admission check before addMessage persists them (`src/framework.ts:28041-28044`).
- The existing scoped registry's strict bit keeps this policy attached to an authenticated strict dial even if the host changes the flag while the provider is pending. No provider result is put on configuration or new diagnostic state.
- Existing diagnostic copy filtering remains: recursive nested JSON values and keys, before queueing/bounding, without mutating operational objects. No strict configuration => original values and legacy serialization behavior.

**What a masked name means:** `redacted` is a diagnostic placeholder, never a callable tool alias. A credential-bearing tool entry is absent from model/native/dynamic advertisements and the fixed `metadata-credential` diagnostic explains its withholding without exposing its name. Model tool notices list only admitted original identifiers. Operators must not call a diagnostic placeholder or serialize internal wire state as a display. Benign tool execution is tested against the exact unchanged server-received name. This is metadata admission, not a redesign of legacy routing/authorization for a host deliberately supplying an arbitrary wire name.

README.md:353-393 documents the unbounded growth/cost of strict history, admission/placeholder semantics, raw-payload exclusions, and the exact Node 22.23.3 / Bun 1.4.3 deployment pin. Newer patches refuse strict dialing until qualified; hosts must account for that rather than assume a minimum-version range. The engine pins and rotation-retention policy themselves are unchanged.

### SDK sink inventory and per-sink probes

Probe labels below are tests in test/mcpl-credential-required.test.ts, run on **both requested engines**:

- **M** (test 40, plus unset control 39): real AgentFramework.connectMcplServer, tools/list, automatic reconnect/rotation, list-changed ingress, public executeToolCall, SDK catalogues/listings, queue draining, console capture, real failures.log writing/reading, trace listeners and production webhook serialization (fetch intercepted, no traffic). Server entries echo raw, percent-encoded and Bearer forms of current and prior tokens. Some have benign names with secrets only in nested schema/metadata keys/values. Includes duplicate/invalid-class diagnostics.
- **T** (test 43, unset control 42): real scripted WebSocket peer, toolHints/toolset declarations, reconnect/rotation, tools/list, toolsets/list, tools/hints; public toolsets--look/open/act/close; controller catalogue; stored agent window and traces/logs. Unsafe metadata is refused/withheld, benign dynamic identifiers remain usable. Raw application results from act and a direct tool call are explicitly checked unchanged.
- **H** (test 44): real initialize and manifest replies with credential-bearing metadata are refused before SDK state.
- **E** (test 45): real inbound channels/register with a poisoned label is refused before its handler; the corresponding application message body remains payload.
- **F** (test 46): an in-flight flag mutation cannot disable metadata admission after the authenticated dial.
- Existing provider/URL/no-leak/redirect controls and strict tests 1-38 remain green on both engines.

| SDK-owned sink / dependent views | Boundary / status | Direct production-path probe(s), both engines |
|---|---|---|
| listMcplServers, including toolClasses, grants, observe filters and manifest-state fields | Whole diagnostic listing copy: framework.ts:29391; raw unsafe tool entries never admitted | M: listing serialization clean for current and rotated tokens |
| Separate listToolClasses operator listing | Diagnostic copy: framework.ts:24257 | M: public listToolClasses clean |
| Model-facing static/native tool definitions, agent presentation definitions, shared tool catalogue, underlying code-execution catalogue inputs | tools/list admission before mcplTools / read tap; no renamed wire identifiers | M: getAllTools, actual availableToolsForPresentation builder and operational inventory all clean; benign calls use exact original names. No live model transmission performed |
| Dynamic tool definitions, toolset catalogue/look descriptions, titles, schemas, suggestions and reminder inputs | Initialize/result/hint admission before ToolPresence retains metadata | T and H: controller catalogue, actual toolsets--look result and model tool surface clean through rotation; shared admitted-state boundary protects dependent renderers |
| SDK-authored toolsets--open/close results and act availability/change notices | Reject unsafe metadata before controller result/presence; admit hints before generated changes | T: actual open/close fail with clean diagnostics; act's original benign dynamic identifier works. Its server application content is separately excluded, not falsely claimed clean |
| New-tools external-message notice, newTools/removedTools metadata, nested queue data, downstream process-event records of those notices | Filter before queue insertion: framework.ts:5940-5948; generated tool names already admitted | M: real tool-diff notices exist, queued records clean, nested public pushEvent metadata copied without mutating source; legacy identity retained |
| Persisted toolset changes/notices in the model's window (including dependent reminders rendered from presence) | Withhold unsafe notice before addMessage: framework.ts:28041; admitted presence is clean | T: actual persisted 'tool changes' messages are present and their agent window is clean, not an empty-window assertion |
| Every trace listener serializer: process:received and nested processEvent, tool lifecycle, module/server/reconnect/error/ops trace variants | Shared emitTrace copy filtering before delivery/bounding: framework.ts:26383 | M/T capture actual emitted traces across all those flows; existing test 33 injects a real transport-error path. Shared trace sink, not a claim to execute every possible event producer |
| Console metadata/class/duplicate/toolset diagnostics | Withhold unsafe metadata upstream; fixed metadata-credential; class parser display callback before formatting, framework.ts:30174,30222,30293 | M/T capture console output through current/rotated inventory, invalid classes, duplicates, toolset failures and hints |
| Durable failures.log / ops-alert data and trace | Filter message/data before bounding: framework.ts:26646,26652; actual logger remains active | M: wraps records but calls real logFailure, then reads actual logs/failures.log and checks absence of the test's credentials |
| Optional ops webhook body serialization | Same filtered message before JSON body formation | M: public notifyOps path invokes actual production fetch call; captured serialized body is clean. Fetch is stubbed and a synthetic loopback URL is used; no external webhook transport exercised |
| Initialize serverInfo/capability/feature/toolset declarations, manifest metadata, channel/other control-plane metadata before downstream registries/displays | Refuse before state/handlers; diagnostic copies still filtered | H/E: actual RPC replies and inbound registration refused; no handler receives the poisoned registration. Dependent registry displays receive no poisoned value |
| Config/URL endpoint displays, connect/provider/reconnect errors, transport diagnostics | Existing scoped redaction, fixed provider reasons; strict dial endpoint snapshot | Existing 1-38 plus F and race test 41; config/JSON remains free of provider results, client-error console/trace probes remain green |

**Deliberately not rewritten / scope limits:** accepted server tool-result application content (including the application-content part of toolsets--act), structuredContent and inbound application message bodies remain payload. M/T/E prove their distinction from SDK-generated metadata; T explicitly asserts raw result content is unchanged. Unknown encodings and secrets neither configured nor sent are outside known-credential filtering. Raw wire buffers, host-private objects and arbitrary trusted host callbacks are not SDK display serializers; hosts must not expose them themselves. No live model request, external webhook, additional engine or real provider/TLS deployment was run. These are deliberate boundaries required by the brief, not a blanket malicious-server exfiltration guarantee.

### Full dial-policy snapshot and mutation matrix

`src/mcpl/transport.ts:598-612,634,654-683,704-726,776-792` snapshots/validates strict policy **before** awaiting the provider. Original config is retained for provider this/registry identity, not post-await dial policy. Headers are created only after validating the fresh result; the policy is captured explicit header transport + required credential + no fallback + followRedirects:false. There is no user-configurable headers/followRedirects override to reread.

| Captured input / policy | Mutation during provider wait in test 41 | Checked outcome on both engines |
|---|---|---|
| URL | another loopback server | original endpoint receives one upgrade; replacement sees zero |
| tokenTransport / header policy | header -> query | Authorization remains Bearer fresh-token; URL has no token query |
| credentialRequired | true -> false | strict header/redirect policy remains; F also proves metadata gate cannot turn off |
| Provider reference | replace with a throwing provider | captured original completes; replacement never runs |
| Static-token/fallback policy | add a different synthetic token | fresh provider credential is sent, no static fallback |
| Binding fields | change transport, command, protocol | validated WebSocket endpoint/policy unchanged |
| Server id | change id | transport keeps captured original server id |
| Redirect option | derived from captured required policy | all five existing strict redirect controls remain green on both engines; no new engine qualified |

The extended provider-reference/binding-field assertions are controls where behavior already existed; they are not manufactured red claims. Test 41's original URL/query-policy race was genuinely red at f4e38ced. F is a separate genuinely red addendum case at 1da0c9ff.

## Verification Gates

Same installed tree and same credential-free `/tmp/task-v1dzf-evidence/isolated` wrapper: env-i, isolated npm configuration, offline npm and loopback-only libc connect/sendto/DNS guard. Same Node 22.23.3 / npm 10.9.9 / Bun 1.4.3. No reinstall, external traffic, real credential or live model/service call. The wrapper is not kernel network-namespace isolation. Webhook qualification temporarily installs a synthetic loopback URL and intercepts fetch solely to capture the production serializer, then restores both.

Ignored lockfile and preserved external copy still match SHA-256 `0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`; copy remains /tmp/task-v1dzf-evidence/package-lock.json. Original resolution/integrity evidence remains development evidence, not a sealed candidate closure.

### Before/after outcomes

- Reviewed f4e38ced full-suite receipt: 7,897 tests, 7,852 pass, 45 skip, zero fail; build/typecheck passed.
- Initial fix-baseline-node/bun: 41 tests, 39 pass and two genuine expected failures on each engine (strict metadata displays, provider-await policy race). Original 38 tests and unset metadata control pass. Initial fixed stage 1da0c9ff: full suite 7,900 tests, 7,855 pass, 45 skip, zero fail.
- After the two manager addenda, the final runtime assertions were run against exact 1da0c9ff versions of framework.ts, server-connection.ts and protocol-family.ts, temporarily restored with git show and then restored. No reinstall. **addendum-baseline-node/bun: 46 tests, 41 pass, five genuine expected failures on each engine.** Subsequent test-only type annotations do not change those assertions.

| Final test number/name (new or strengthened) | Baseline 1da0c9ff Node/Bun | Final Node/Bun |
|---|---|---|
| 39 control: echoed metadata display copies and rotated notices preserve wire routing (credentialRequired=undefined) | PASS / PASS | PASS / PASS |
| 40 strict: echoed metadata display copies and rotated notices preserve wire routing (credentialRequired=true), strengthened to assert withholding from model inventory, not masking alone | FAIL / FAIL | PASS / PASS |
| 41 strict: provider-await mutation cannot replace validated endpoint or header policy, extended mutation matrix | PASS / PASS (already fixed at 1da; genuinely red at f4) | PASS / PASS |
| 42 control: toolset catalogues, hints and persisted notices gate current and rotated metadata (credentialRequired=undefined) | PASS / PASS | PASS / PASS |
| 43 strict: toolset catalogues, hints and persisted notices gate current and rotated metadata (credentialRequired=true) | FAIL / FAIL | PASS / PASS |
| 44 strict: initialize and manifest metadata are refused before SDK state | FAIL / FAIL | PASS / PASS |
| 45 strict: control-plane metadata is refused before handlers while application bodies remain payload | FAIL / FAIL | PASS / PASS |
| 46 strict: provider-wait flag mutation cannot turn off metadata admission after the authenticated dial | FAIL / FAIL | PASS / PASS |

Existing tests 1-38 pass throughout this round. Baseline-new receipts are intentionally dirty/test-added evidence, not reusable green receipts. Tests for known old behavior remain controls. No artificial red was introduced to claim the already-existing redirect or provider-reference behavior as new.

### Latest final commands and counts

Every gate ran as `orgasmic dispatch gate NAME -- COMMAND`; all latest final receipts start/end clean at **fb4c3329543d8526ad927e833eaa09adc256e147**.

| Gate | Exact command after -- | Result |
|---|---|---|
| fix-final-build | `/tmp/task-v1dzf-evidence/isolated npm run build` | PASS |
| fix-final-typecheck | `/tmp/task-v1dzf-evidence/isolated ./node_modules/.bin/tsc --noEmit` | PASS |
| fix-final-node | `/tmp/task-v1dzf-evidence/isolated node --import tsx --test test/mcpl-credential-required.test.ts test/mcpl-ws-transport.test.ts test/mcpl-tool-classes.test.ts` | 89 tests, 88 pass, one existing skip, zero fail; all 46 focused tests pass |
| fix-final-bun | `/tmp/task-v1dzf-evidence/isolated bun-1.4.3 test test/mcpl-credential-required.test.ts` | 46 pass, zero fail/skip |
| fix-compat-node | `/tmp/task-v1dzf-evidence/isolated node --test dist/test/mcpl-request-handler-errors.test.js dist/test/mcpl-transport-error-listeners.test.js dist/test/mcpl-credential-required.test.js` | 130 pass, zero fail/skip |
| fix-final-tests | `/tmp/task-v1dzf-evidence/isolated npm test` | 7,905 tests, 7,860 pass, 45 skip, zero fail; 364 suites |
| fix-final-diff-check | `git diff f4e38cedc652404cc059bb360cdaff19dcc5ad8d..HEAD --check` | PASS |

Baseline command suffixes were `/tmp/task-v1dzf-evidence/isolated node --import tsx --test test/mcpl-credential-required.test.ts` and `/tmp/task-v1dzf-evidence/isolated bun-1.4.3 test test/mcpl-credential-required.test.ts`, under fix-baseline-* and addendum-baseline-* respectively.

### Failed-attempt accounting

The first full attempt at f5d4e206 had three implementation regressions, not pre-existing failures:

1. `a manifest refresh deferred by the fetch floor reports a failure other than its fetch's, as the announcement's own run does`
2. `a manifest refresh queued behind a fetch in flight reports a failure other than its fetch's, after the first run's failed fetch is only logged`
3. `a transport with nothing listening for 'error' logs its errors, and gives them to a listener once there is one`

A partial framework's get-only config-map stand-in is now tolerated without rewriting its diagnostics; the transport constructor retains its legacy server-id default when called directly by an existing test. The compiled compatibility gate and final full suite pass these cases. That failed full log is preserved locally as final-tests-at-f5d4e206.log and in its immutable CLI receipt.

An intermediate source-mode compatibility invocation could not resolve the child .mjs fixture's compiled .js imports (it does not inherit parent tsx); rerunning from dist after build passed. This is an invocation/fixture-layout failure, not a product failure. Intermediate compiler diagnostics (test TS7022 inference, metadata helper nullability and a helper-name typo) were corrected; the added meta-tool probes also needed explicit ToolResult annotations under the resolved TypeScript compiler. No diagnostic was ignored. All final build/typecheck/test commands were rerun at the final commit. Existing 45 skips include case-folding filesystem cases and the old plain-bun probe; the dedicated bun-1.4.3 suite skips nothing.

Local logs/PID records are in /tmp/task-v1dzf-fix-evidence; CLI-managed immutable receipt logs are under fix run `run-01M5XK3XDQG861J31R4VFWZ1MJ`.

Latest receipt log basenames:

- `fix-baseline-node`: `gate-fix-baseline-node-01M5XKWT41NG44H9YHEGHHCAS7.log`
- `fix-baseline-bun`: `gate-fix-baseline-bun-01M5XKWTNBJYE1GZ860F39TW2N.log`
- `addendum-baseline-node`: `gate-addendum-baseline-node-01M5XNYE6S0A90WHS22869CJTJ.log`
- `addendum-baseline-bun`: `gate-addendum-baseline-bun-01M5XNYF1CWNYTE6ECDZF25QC2.log`
- `fix-final-build`: `gate-fix-final-build-01M5XP2J6EY0JK30C7ATXTC5E0.log`
- `fix-final-typecheck`: `gate-fix-final-typecheck-01M5XP332AZSPC1RVD90FK9438.log`
- `fix-final-node`: `gate-fix-final-node-01M5XP33H9Z68VH0R203SFPJ7W.log`
- `fix-final-bun`: `gate-fix-final-bun-01M5XP34JF01TA6XHS0WW1Z052.log`
- `fix-compat-node`: `gate-fix-compat-node-01M5XP353WNWEYQTTJS1PBFRQF.log`
- `fix-final-tests`: `gate-fix-final-tests-01M5XP35VMTZVMJ2BAVSE41ENS.log`

## Unmet Criteria

None from the fix brief and both manager addenda within the explicitly documented SDK-metadata boundary. SDK-controlled catalogues, dynamic toolsets and model notices no longer expose credential-bearing identifiers; raw application content is deliberately not represented as an exfiltration-safe channel. No engine expansion, retention eviction, reinstall or publication was performed. Independent re-review and qualification remain downstream stages, not work claimed by this implementer.

## Residual Risk

- Exact runtime pins intentionally reject newer patches until qualified; trusted in-process loader/version-metadata tampering is not defended.
- Retaining all distinct strict rotations is unchanged. Memory and pattern-building/matching cost grow with history; short values can over-redact or conservatively withhold ordinary metadata. No duration/capacity benchmark was run.
- Admission is based on known raw/URL/JSON representations and standard application-content boundaries, not arbitrary semantic information flow. Malicious servers can exfiltrate through application content or unknown encodings; trusted hosts must not expose internal wire state/custom objects themselves.
- No live model/provider, real TLS service, external webhook or unqualified runtime was contacted. The libc guard is not a kernel-level traffic guarantee. Synthetic production-path serializer/loopback probes are the evidence claimed.
- node_modules, dist, generated ignored lockfile and synthetic diagnostic logs are local mechanical artifacts only. No tracked housekeeping, host integration changes, push or release.
