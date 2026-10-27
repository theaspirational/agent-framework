# TASK-V1DZF — security re-review, round 4

## Verdict

**Do not approve 340231e371c2b1efebefd8f974c3923332ea569c.** Three strict-mode disclosure classes remain, application input is rewritten, SDK trace types are corrupted, and a responder change regresses flag-unset behavior. The previous handshake-close, pagination and native-carrier reproductions now pass; that is not class-wide closure.

## Findings

### HIGH — security / unmet R7: catalogue admission misses assembled names and credential rotations

**Locations:** src/framework.ts:30191–30221 (namespacing/adoption), 6355–6378 (getAllTools), 7065–7071 (presentation surface), 29879–29883 (asynchronous reconnect refresh); upstream-only admission at src/mcpl/server-connection.ts:504–512.

Admission checks each received definition, but the framework subsequently constructs a namespaced callable name without checking the completed definition. Its cached model catalogue is also not re-admitted when credential history changes.

**Both-engine production reproductions**, current evidence review-catalogue-edges.mjs:

1. Generate an ordinary leaf name with a random suffix; supply “mcpl--strict--” plus that leaf as the provider credential. The peer advertises only the leaf, an ordinary description and an empty object schema. Authentication succeeds; the received definition contains no complete credential. Nevertheless getAllTools and the actual per-agent presentation catalogue contain the credential as the assembled callable name. Public start/nudgeAgent sends it in the request captured by the **local mock membrane**. No external model is called. Operator listings and traces are clean, so testing those alone misses this.
2. First advertise a random name that does not match the current credential. Reconnect the **same config** with that name as the next credential, holding the second tools/list reply. After the second authenticated upgrade, both catalogues still expose the now-known credential. The entry disappears only after the held reply is released and filtered.

Node and Bun assert:

    assembled-callable-name, strict=true:
      catalogueLeak=true, presentationLeak=true, providerRequestLeak=true
      listingLeak=false, traceLeak=false
    rotation-stale-catalogue:
      catalogueLeak=true, presentationLeak=true, removedAfterRelist=true

These are accepted header-carryable credentials, including long random-suffix values. This is unmet new-mode protection, not a legacy regression. Existing wire routing still works under the original name.

**Fix:** admit the completed model-facing entry, including its namespaced name. Revalidate/invalidate cached definitions and presentation/toolset snapshots when credential history changes, and check the final request surface before transmission. Withhold unsafe entries with a fixed diagnostic; do not advertise masked callable aliases or rewrite wire identities. Add assembled-name and held-relist rotation regressions on both engines.

### HIGH — security / unmet R7: emitTrace performs diagnostic side effects before filtering

**Locations:** src/framework.ts:26366–26396; downstream 26841, 26849–26852, 26867–26878; healthSnapshot at 26499.

For inference:exhausted, emitTrace passes the original error to noteInferenceExhausted **before** creating its strict-filtered listener copy. That consumer stores raw lastError, writes a console diagnostic, and persists an SDK-authored [inference-failed] marker with raw reason text. healthSnapshot then returns the raw last-error field. Filtering the eventual trace and failures.log does not repair those earlier publications.

**Production reproduction:** review-public-failure.mjs authenticates a real loopback MCPL connection and receives the synthetic credential in a permitted tool-result structuredContent value. A local mock membrane reflects that received value in its failure, modelling a provider's rejected-request echo. Public start/nudgeAgent drives one real framework failure/exhaustion cycle. There is no private emitTrace injection, external provider/model call, or real secret.

On **Node and Bun**, strict mode reports:

    consoleLeak=true, markerLeak=true, healthLeak=true
    traceLeak=false, failuresLeak=false, localMockCalls=1

The application result is deliberately unchanged and is **not** the finding. The subsequent console line, SDK failure marker and health listing are SDK-owned diagnostic copies. This is conditional on forwarding/echo, as was the previous native-carrier finding. Per this review's severity instruction, a credential reaching an SDK-owned sink is HIGH.

**Harness blind spot:** test/mcpl-diagnostic-allowlist-boundaries.test.ts:67–69 always exercises emitTrace with mcpl:server-error while looping over proposal IDs. It does not exercise exhaustion side effects. The scanner does not select the indirectly reached noteInferenceExhausted body merely because emitTrace calls it.

**Fix:** protect every diagnostic output of the exhaustion path, including persisted markers and health-state error fields, before publication/storage. Keep operational agent identity and error classification usable internally; do not indiscriminately rewrite control data. Expand the shared-boundary inventory and add a public failed-turn regression rather than another server-error-only witness.

### HIGH — security / unmet R7: key-redacted notice copies are merged over the original secret fields

**Locations:** src/framework.ts:5945–5952; src/mcpl/protocol-family.ts:398–413; actual new-tools notice producer src/framework.ts:30469–30475.

Independently verified manager lead F1. pushEvent filters an object containing content and metadata using a walker that redacts **keys**, then spreads that copy over the original event. With accepted credential “content” or “metadata”, that field is renamed to “redacted”. It no longer replaces the original field, which survives alongside the new safe-looking property.

**Both-engine production probe:** review-manager-notices.mjs connects a real strict server, using credential content/metadata and a corresponding configured tool prefix. The server advertises an ordinary safe leaf. The SDK constructs its actual new-tools notice. For both credentials the queued notice contains the original credential-bearing field and a new “redacted” field, while the emitted trace is clean. This is not merely a direct call to the redactor or host-created application data.

    strict=true, field=content: queuedNoticeLeaks=true, originalFieldSurvives=true, traceLeak=false
    strict=true, field=metadata: queuedNoticeLeaks=true, originalFieldSurvives=true, traceLeak=false

The prefix/leaf path also exercises the earlier assembled-name issue, but the defective merge is independently wrong: a purported replacement must never silently leave the old sensitive field in place. Fixing catalogue admission alone does not make this generic notice boundary sound.

**Fix:** keep SDK-owned envelope keys structural and explicitly assign filtered content/metadata values, rather than spreading key-renamed data over the original. Audit analogous merges. Test both field-name credentials and arbitrary nested keys, queued/persistent notices separately from traces, on both engines.

### MEDIUM — correctness: whole-event prefiltering destroys fixed SDK trace types

**Locations:** src/mcpl/inference-router.ts:202; analogous wrapping at src/mcpl/checkpoint-manager.ts:210; final type restoration at src/framework.ts:26395–26399.

The new helper callback filters an entire SDK-created event before handing it to the framework, including its compile-time type. The framework's later restoration uses the **already modified** event.type.

**Both-engine real-wire reproduction:** review-fixed-event-type.mjs uses accepted credential mcpl:inference_fail, connects normally, and sends a valid inference/request for a granted feature set. With no inference-routing model configured, the SDK correctly returns -32603 without calling a model. Legacy emits mcpl:inference_fail; strict emits type “redacted” instead. Subscribers switching on the documented type miss the failure. Assertions check both the missing expected type and the invalid replacement.

This is SDK-created fixed schema, not a peer-forged discriminator or a request to preserve reflected text. The implementation itself explicitly intends to preserve fixed types. The checkpoint callback needs equivalent coverage; only the inference case was independently reproduced.

**Fix:** structurally separate fixed SDK discriminants from dynamic event fields, filter the latter, then attach the trusted discriminator. Do not establish provenance by text matching. Test actual router/checkpoint events with credentials colliding with types or field spellings, preserving legacy output.

### MEDIUM — correctness / scope regression: strict mode rewrites raw external application input

**Locations:** src/framework.ts:5945–5952; ExternalMessageEvent contract src/types/events.ts:67–81; README.md:368–373.

Independently verified manager lead F2. Every public external-message is treated as an SDK notice, although this event type explicitly carries raw Discord/HTTP/CLI content and external metadata. With strict credential “6”, public pushEvent of source http-input and raw content “page 6” queues “page redacted”; flag unset queues the original. Both engines reproduce this in review-manager-notices.mjs.

This changes application data before modules can process it, contrary to the documented unmodified-inbound-body exclusion. The strict opt-in does not identify these events as SDK-authored diagnostic text.

**Fix:** distinguish SDK notices structurally from raw external application ingress. Redact notice/display copies and trace copies, but preserve original application events and metadata for processing. Add a real external-input/module-consumer control, not only MCPL push-body controls.

### MEDIUM — correctness / flag-unset regression: responder wrapping loses methods and receiver identity

**Locations:** src/mcpl/inference-router.ts:221–223, 247–249, 349–365; compare base 4976c67d inference-router.ts:215–244.

Independently verified manager lead F3 against base source, not assumed from the suggested audit. The unconditional spread wrapper drops inherited/non-enumerable respond/sendChunk methods. Enumerable copied methods are subsequently called with the wrapper as this, not the original responder. The default identity formatter does not prevent this operational change.

**Both-engine base/final probes:** review-manager-responder.mjs supplies a stub membrane and structurally valid (a) prototype-method responder, (b) own non-enumerable-method responder and (c) own-method responder with receiver-keyed private state. It tests streaming and non-streaming. All six base cases deliver the result with the original receiver; streaming delivers a chunk. All six final cases return -32603 instead, deliver no result/chunk and fail receiver preservation. No strict flag or external provider is involved.

This affects component callers supplying such responders; the ordinary framework creates closure-based responders, so the existing per-sink comparisons miss it. It does not establish that every normal framework inference request fails.

**Fix:** forward methods explicitly to the original object with their original receiver, including optional chunk delivery and request identity, or leave the original responder untouched and sanitize only error arguments at the error publication call. Add class/non-enumerable/receiver-sensitive controls with the flag unset.

### LOW — docs: strict returned-error identity changes are not explicitly documented

README.md describes detached diagnostic copies, but does not warn that strict returned errors are fresh objects, arbitrary custom prototypes/instanceof relationships may be lost, and cause chains become detached projections rather than the original references (protocol-family.ts:212–254, 334–383). Document this host-facing opt-in contract and identify the SDK exception types explicitly preserved. No identity change is proposed for legacy mode.

## Open Questions

No decision is needed to reproduce or fix these findings.

The owner-policy question remains whether to require a minimum credential length/format. Recommend high-entropy host credentials and an explicit decision, not a silent contract change or a substitute for closing missed sinks. This round expressly preserves the no-minimum policy.

## Verification Notes

### Scope and read-only status

Read the live task record, ledger project.org, empty gotchas/conventions collections, original R1–R8 brief/clarifications, complete round-4 report and requested inventory/proposal/key-count evidence, all three previous reviewer reports and probe programs, relevant production diff/consumers, committed scanner/allowlist/witness tests, and final receipts. No applicable AGENTS.md or convention was found. Tier remains **risky**: P1, credential safety-path blast radius, and breadth.

Base: 4976c67d5c7916a15046c627b68913994c33b3cb. No worktree edits, commits, checkout movement, installation, push or external traffic. Review files are outside the worktree. Final tracked status is clean at the reviewed HEAD.

Reviewed evidence: /home/orgasmic/.orgasmic/runs/run-01M5XT37CK8M493G9ADZPXMNTM/evidence.
Current evidence: /home/orgasmic/.orgasmic/runs/run-01M5Y2F8RP7CZ0E2G5RQ3HWV89/evidence.

### Mechanical guard and independent allowlist judgment

The final inventory is **740 sites: 258 locally routed plus 482 proposals**, not the preliminary 424.

| Reason category | Count | Disposition |
|---|---:|---|
| Deferred final boundary | 339 | **41 exact entries sampled**, prioritising received-data routes; current deferred-sample-review.md records actual delegation/qualifications. No wholesale approval. |
| Operational | 33 | **Every entry individually judged** in current operational-proposal-review.md; production probe per class on both engines. |
| Unsupported strict family | 82 | HTTP/stdio cannot enable strict; admission/transport policy inspected, not every excluded site executed. |
| Pre-dial | 27 | Ordinary bootstrap/host-input exclusions, not downstream redaction evidence. |
| Root implementation | 1 | Error factory constructs from safe final message/options. |

**Manager-requested key count: 33**, conservatively marked received-data operational proposals without complete-original-payload redaction-boundary coverage: **22 mixed process/application, 6 connection lifecycle/dispatch, 5 transport input/close**. Their exact IDs, locations, original reasons and individual dispositions are in operational-proposal-review.md. The implementer's matching entries/count are in reviewed round4/closure-uncovered-received-proposals.md and closure-keycount.json. Locations explicitly grouped:

- Mixed: framework **22700, 22708, 24386, 24400, 24481, 24532, 24564, 24574, 24589, 27117, 27148, 30518, 30533, 30549, 30591, 30699, 30900, 31094, 31253, 31266**; channel-registry **2048**; push-handler **286**.
- Connection: server-connection **1093, 2002, 2030, 2184, 2643, 2909**.
- Transport: transport **76, 80, 136, 142, 167**. The two stderr paths are additionally unreachable on strict WS, so their received-data classification is conservative.

I accept the **narrow original wire/routing/application-body exclusion**, not blanket exemption of an event or ToolResult.data. Mixed presentation/channel-tool returns contain SDK-generated listings/notices too; those remain SDK-controlled. In particular framework 24400/31253 cannot be justified simply by calling every returned data field application payload.

The independent operational probe exercises all three classes: actual push/event and tool dispatch, original transport line/close, connection event, pending-request public error and final console/onTrace. It separately verifies unchanged application bodies/wire codes and filtered diagnostic copies. Both engines pass. Arbitrary host serialization of internal events remains outside the claim.

All 339 deferred entries have named boundary/test **strings**; zero are mechanically missing one. This is not 339 demonstrated source-to-boundary routes: the witness repeats seven boundary adapters instead of executing each site. My sample confirms important delegations (contained handler, RPC/close errors, coalescer audit, toolset logger, signature/meta-tool errors, class logging), but records qualifications: whole-event callbacks have the MEDIUM above; hook timeout/map rejections are swallowed internally rather than reaching the claimed final boundary; normalizeClassTable's optional callback is not supplied at bootstrap sites and should not be described as a tested received-data formatter route.

The committed test properly states the scan's limits: recursive src/mcpl TS, anchored/framework MCPL-referencing methods and selected shared boundaries; Error/Refusal/throw, console, trace/event/audit/log/notifyOps and file-write syntax. Aliases, delegated formatting, indirect framework helpers and dynamic callbacks can escape. This is a useful **drift guard, not closure proof**. Newly discovered final sinks outside that selected scope are not magically included in the 33-entry numerator.

### SDK sink and non-string inventory

This acknowledges the earlier sink/class-wide addenda, including **model-facing** metadata. “Pass” describes exercised producers/boundaries, not every possible producer.

| SDK surface | Evidence/outcome |
|---|---|
| Console: transport, handshake, RPC, callback, generated counts/errors, helper diagnostics | Prior final tests/probe receipts pass; independent operational close passes. **Failed-turn console leaks.** |
| Connection diagnostic events and returned host errors | Prior handshake/reconnect/pagination/native receipts pass; independent pending-request close/refusal paths pass. Raw wire codes remain operational. |
| Traces: process:received, tool/server/ops/control events and dependent listeners | Prior scalar/native/rotation receipts and independent push/close pass. **Exhaustion side effects leak before tracing; router type is corrupted.** |
| failures.log and webhook JSON | Prior actual append/read and intercepted production-fetch serialization pass, including native/scalar carriers. New failed-turn failures.log is clean. No external webhook delivery. |
| listMcplServers toolClasses/manifest/grant/filter state; listToolClasses | Prior production receipts pass. New assembled-name test confirms listing masking while model output leaks. |
| Static/shared/per-agent model definitions, presentation catalogue, actual mock-provider request | Prior raw/encoded/Bearer cases pass. **Assembled names and stale rotated definitions fail.** |
| Dynamic toolsets/look/open/close/act, hints, notices and stored model-window tool changes | Prior real toolset receipts pass; routes inspected. Invalidation of every cached/persisted variant on credential-history change is **not proved**. |
| New-tools notices, queued diagnostics and native-carrier notices | Prior receipts/native-getter tests pass for their fixtures. **New field-name credentials bypass notice replacement; raw external application ingress is rewritten.** |
| Health listing and SDK failure markers | **New public failed-turn reproduction leaks.** |
| Other inference/history/logging and indirect helpers | Not exhaustively closed. No all-producer/inference-log guarantee is inferred from server-error trace tests. |

Value classes in inspected final tests/probes include decimal/negative/exponential numbers, numeric RPC codes/IDs, numeric-looking strings/keys, booleans, null, host bigint, nested arrays, delayed IDs/refusal codes across rotation, generated pagination numbers and validation indices. Numeric JSON keys are strings. Array positions are not authored metadata keys, but rendered diagnostic indices need final-message filtering. Native Error name/message/code/httpStatus/cause/aggregate fields and boxed primitives are separately projected. Bigint/symbol/functions are not JSON wire values.

The diagnostic projection uses detached data-descriptor copies and intrinsic unboxing, not raw native references. Unsupported classes/accessors/cycles/depth limits are withheld. Existing tests/receipts cover those carriers; the new actual queued-notice/trace probe adds AggregateError, Map/toJSON, enumerable getter and boxed number, asserting **zero getter/toJSON invocations** and different references. This is diagnostic projection, not resistance to trusted same-process Proxy/intrinsic monkeypatching.

Fixed-reason provenance is sound in the inspected factory: a private WeakMap brands SDK-created Errors; a separate typed enum is attached after dynamic-body filtering, including cross-boundary matching. Peer text cannot obtain that brand. The real forged-marker test (test/mcpl-credential-diagnostics.test.ts:166–173) sends marker-looking text plus credential and requires reflected text to be redacted. Both final focused receipts also pass the unchanged 94-character control and dynamic/fixed-suffix spanning test. The MEDIUM is a separate fixed-schema provenance error.

**Intended exclusions:** accepted tool-result content/structuredContent, inbound application bodies, internal protocol/routing buffers, unknown encodings and arbitrary trusted host serialization. The new external-input reproduction shows that this exclusion is not consistently implemented. SDK diagnostics derived from those inputs are not categorically exempt. README correctly disclaims blanket malicious-server exfiltration protection. Safe callable names remain original; a diagnostic “redacted” placeholder is not a callable alias.

### Explicit answers to earlier manager questions

- **Engine check:** transport.ts:616–621 detects Bun by process.versions.bun !== undefined, accepting exact string **1.4.3**. Otherwise it requires process.release.name === 'node' and exact Node string **22.23.3**. It is not semver, constructor identity or a package-version check. Bun 1.4.4/different Node patches refuse before provider/network, even under host Bun >=1.4.3. This is an **intended documented limitation**, not a finding. Metadata-spoof controls are not runs on newer engines. Actual qualified redirect controls cover 301/302/303/307/308 with no second-origin upgrade.
- **Retention:** protocol-family.ts:444–474 retains every distinct accepted/sent strict credential for the reachable config's lifetime. Equal values are deduplicated/moved newest without history growth or a version bump solely for the repeat. **No count/byte/age/work bound** exists; memory, insertion scans, rebuilding/compilation and redaction cost grow with distinct rotations. WeakMap GC only helps after config release. Requested documented tradeoff; no longevity benchmark or policy change here.
- **String “true”:** a configuration problem, not enabled or silently unset. Shared validation/boolean admission reject it; both-engine follow-up receipts assert rejection.
- **Provider admission:** startup, runtime connect, restart and automatic reconnect converge on WebSocketTransport.open before socket creation. Missing-provider runtime/restart receipts show zero additional upgrades; restart first tears down its old connection. No separate SDK admin/overlay socket constructor exists. External host overlays that might drop the flag were not certified.
- **Dial snapshot:** transport.ts:602–607 captures id/url/binding fields, token policy, required flag and provider reference before await. Header-only/no-fallback/redirect policy derives from this snapshot; no separate configurable header override is reread. Prior both-engine probes mutate every dial input during await and pass. The original object remains for provider this/registry identity, not post-await dial policy.
- **Admission/short credentials:** protocol-family.ts:981–1014 matches individual actual keys/scalar text, not serialized-whole JSON, cross-field strings or array-index keys. Punctuation controls pass. Both-engine 94-character receipts report **26/94 initializer refusals from actual collisions, zero syntax-only refusals, 68 connections, 25/408 ordinary entries withheld**. This substantial substring-availability limitation is intended; it does not excuse missed final sinks.
- **Withholding visibility/recovery:** rejected entries are omitted, never renamed. Entry withholding currently reports to **console only**, not a dedicated listing reason/count, failures record or successful-connect host error. Rotation alone does not make old-token-bearing entries safe because history remains protected. A genuinely safe replacement returns on actual re-list; prior receipts assert that. The separate rotation exposure window is HIGH above.

### Gates, legacy equality and new independent probes

Following the explicit reusable-receipt instruction, **read rather than reran** the identical supplied gates, including all prior adapted probes and focused tests. The new rr4-retained-evidence gate checks all **32 final receipts**, reviewed HEAD/clean/exit-0 records, source-overlay coverage, and **32 retained per-sink base/final comparisons**.

- Build/typecheck pass; focused **104/104 on each engine**; full suite **7,963 tests, 7,918 pass, 45 skip, zero failures**.
- All eight prior probe programs pass on both engines: review-probes, review-envelope-toolset, followup-probes, review-scalar-matrix, review-short-values, review-short-withholding, review-additional, review-native-boundary. Inspected adaptations: earlier defect assertions were inverted/strengthened, not excused.
- Legacy comparisons overlay **all 20 changed production files** from original base in memory, not a mixed implementation. Eight separate sinks × two variants × two engines are equal: traces, console, failures.log, webhook, shared catalogue, presentation, notices and listing. Controlled time, omitted generated failure-record at, and ephemeral-port substitution are explicit; message/value/key-order differences are not normalized away. This proves those exercised outputs, **not universal all-input byte equality** or merely unset controls 39/42. The new responder base/final comparison demonstrates a legacy regression outside those fixtures.
- Environment: Bun 1.4.3, Node 22.23.3, npm 10.9.9; unchanged lock digest 0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1. No reinstall.

New commands used orgasmic dispatch gate NAME, the existing isolated wrapper, and Node --import tsx / bun-1.4.3:

| Gates | Current-evidence script | Latest result |
|---|---|---|
| rr4-catalogue-edges-node / rr4-catalogue-edges-bun | review-catalogue-edges.mjs | Pass **asserting HIGH**, including actual local mock-provider request and held re-list |
| rr4-public-failure-node / rr4-public-failure-bun | review-public-failure.mjs | Pass **asserting HIGH** through public failed-turn path |
| rr4-fixed-event-type-node / rr4-fixed-event-type-bun | review-fixed-event-type.mjs | Pass **asserting MEDIUM** invalid type |
| rr4-operational-node / rr4-operational-bun | review-operational-exceptions.mjs | Pass: all three exception classes and native queue/trace copies |
| rr4-retained-evidence | check-retained-evidence.mjs | Pass: 32 receipts, 32 artifact comparisons, 20 source overlays |
| rr4-manager-notices-node / rr4-manager-notices-bun | review-manager-notices.mjs | Pass asserting manager F1 HIGH and F2 MEDIUM |
| rr4-manager-responder-base-node / -final-node / -base-bun / -final-bun | review-manager-responder.mjs | Base succeeds; final fails expected responder semantics in six cases per engine |
| rr4-default-identity-node / rr4-default-identity-bun | review-default-identity.mjs | Seven default formatters, exact text/object/cause/thrown identity and failed-save console identity pass |
| rr4-wrapper-base-node / -final-node / -base-bun / -final-bun | review-wrapper-and-route-controls.mjs | Base/final callback receiver comparison; final actual 5-second timeout swallowed without downstream diagnostic |

Exact argv/transcripts are current gate-rr4-*.log files. Latest invocations supersede earlier same-name runs. Green defect reproduction is **not approval**. Two initial operational-fixture attempts per engine failed harness assertions: default inspect depth hid nested input, then an incorrect legacy expectation assumed the returned error included its numeric RPC code (only console does). Corrected those expectations without removing strict assertions. Latest both-engine runs pass; no product flake/interruption is claimed.

All tests used synthetic data, self-started numeric-loopback ephemeral peers, credential-free/offline package settings and the existing libc loopback guard, not kernel network isolation. Real TLS/providers, external overlays, live model/webhook delivery, other runtimes, exhaustive producers/native classes and longevity benchmarks remain untested.

### Size and maintainability

**+6,393/-472 across 30 files** is accurate: production **+947/-469 across 20 files**, tests **+5,391/-2**, README +55/-1. The test total includes a **3,858-line allowlist**. Size alone is not a finding; broad sink work is required by R7.

The concrete risk is fragmented publication ownership: some callbacks filter whole objects, others strings, some final consumers perform side effects first, and catalogue admission precedes transformation/history changes. The reproduced HIGH/MEDIUMs are consequences. A 482-entry fixture plus seven repeated adapters can remain green despite this fragmentation.

Split dial policy, typed diagnostic projection/publication, model-catalogue admission/invalidation, and the drift guard into independently reviewable concerns. Simplify duplicated whole-event filtering and generic identity-style callback contracts into explicit diagnostic payload boundaries. Do not broaden legacy transformations just to make the scanner green. The per-sink legacy controls are valuable but do not cover every helper/operational input.

### Manager finalize follow-ups — independently verified

Both messages delivered on the first finalize attempt are acknowledged here. F1–F3 were independently executed on both engines and promoted to findings; the manager's unexecuted audit was not adopted as proof.

**Formatter defaults beyond shared-sink snapshots:** review-default-identity.mjs instantiates FeatureSetManager, CheckpointManager, HookOrchestrator, PushHandler, ChannelRegistry, ReferenceFetcher and InferenceRouter without a diagnostic override. On both engines each default returns the exact string/object/Error/cause/scalar input reference. It also checks no-strict factory message/cause behavior, diagnosticErrorValue's original thrown-object identity, checkpoint event data identity, arbitrary checkArgs/resolveAct thrown-object identity, and a real failed payload-save console Error argument remaining the same object. These pass. They prove identity at the checked boundaries, **not unchanged surrounding operations**: the unconditional responder wrapper is a counterexample despite its identity formatter.

**Strict error contract:** fresh Error/projection behavior is intentional for strict diagnostics; legacy error values/options remain original at the checked boundaries. README does not explicitly warn about custom instanceof or cause-reference changes: the LOW documentation gap above, not a reason to restore raw native references.

**Mixed pushEvent boundary:** preserving routing/application content while filtering diagnostic fields/display copies is coherent in principle for the 22 mixed proposals. It is not coherent to classify every external-message as an SDK notice, or every ToolResult.data as application-owned. F1/F2 demonstrate both a notice leak and an application-data rewrite. Thus exceptions are accepted only narrowly; the implementation is not approved.

**F4 source corrections:** withTimeout's rejection is consumed by fanOutBeforeInference's Promise.allSettled branch at hook-orchestrator.ts:214–217, not the claimed deferred formatter. The channelsFor async-map rethrow is consumed there too after its inner diagnostic log. Arbitrary errors rethrown by tool-signature.ts:239 / toolsets-module.ts:257 reach the programmatic framework catch at 22555–22557 using diagnosticErrorValue, not mcplToolDiagnostic. MetaError refusals have a different returned-error path. Correct these reasons/tests. They show that witness labels do not prove delegation, not additional independently reproduced remote leaks. The 41-entry sample records these distinctions.

**Exact inventory:** 740 scanned = 258 routed + 482 allowlisted. Exactly **373** entries are marked potentially received-data: **340 deferred/root (339 + 1) + 33 operational**. This conservative metadata count is not 373 executed/approved runtime branches.

**Guard maintenance:** within its scope, every new upstream site needs routing or explicit exception triage. Changing an allowlisted site's exact source/owner invalidates its fingerprint; formatting within that source can require review/fixture updates, whereas simple line relocation alone is not the key. The 482-entry fixture imposes substantial repeated merge/CI cost. This is a purposeful review tax only if updates are genuinely reviewed; automatic regeneration or copying a boundary label makes it busywork. Document review ownership, keep it visibly a drift test, and reduce exceptions through typed final boundaries tested with actual producers. Do not disable it to hide churn or advertise it as closure proof. Aliases/indirection outside its scope remain invisible regardless of this CI tax.

### Second finalize addendum: default responders and other wrappers

Acknowledged the additional F3 instruction. The latest responder gates now cover **class/prototype methods, own non-enumerable methods, receiver-keyed this state, and both streaming/non-streaming** in DEFAULT mode, with a stub membrane, on each engine. Six cases per engine succeed against base and fail the expected result/chunk semantics against final. F1 and F2 are confirmed by the real-notice/raw-external-input probes. F3 is confirmed by this base/final comparison. F4's claimed witness/dataflow mismatch is confirmed: the additional final-mode wrapper gate actually waits for the internal five-second withTimeout rejection and observes **zero injections and zero downstream diagnostic calls** on each engine; arbitrary-error boundary names were separately source-verified as diagnosticErrorValue, not mcplToolDiagnostic. F4 is a harness/proposal defect, not another demonstrated credential leak.

I checked the other optional formatter/wrapper additions in the production diff rather than treating identity defaults as proof of identity operations. The default formatter functions themselves pass the seven-module identity probe. Most new string callbacks, error factories and framework display/tool-result wrappers have explicit no-strict identity returns; sourceBodyDigest's map adapter does not change block inputs, and the legacy WebSocket provider receiver remains the config object. No additional copied caller object like the responder spread was found in those formatter additions.

**Another observable default wrapper difference (LOW compatibility risk):** CheckpointManager:210 and InferenceRouter:202 wrap the caller's trace callback. Base invokes the stored function as a helper method (this is the helper); final calls the captured function as a plain function (this is undefined). The base/final wrapper gates reproduce this on both engines through actual registerFeatureSet and inference-refusal methods. Event type/data remain unchanged in this no-strict test. The framework supplies arrow callbacks, and the callback type documents no helper-receiver contract, so I do not classify this as an additional blocking API bug; it does disprove an unqualified claim that all surrounding default callback behavior is unchanged. Prefer deliberate forwarding/binding, or explicitly document that callbacks must not rely on an implicit receiver.

### Per-file production / test / fixture size

| Kind | File | Added | Removed |
|---|---|---:|---:|
| documentation | README.md | 55 | 1 |
| production | src/framework.ts | 306 | 226 |
| production | src/mcpl/capability-grant.ts | 8 | 7 |
| production | src/mcpl/channel-registry.ts | 16 | 15 |
| production | src/mcpl/checkpoint-manager.ts | 11 | 10 |
| production | src/mcpl/feature-set-manager.ts | 5 | 4 |
| production | src/mcpl/hook-orchestrator.ts | 12 | 12 |
| production | src/mcpl/inbound-source.ts | 5 | 5 |
| production | src/mcpl/inference-router.ts | 9 | 5 |
| production | src/mcpl/log-value.ts | 4 | 2 |
| production | src/mcpl/protocol-family.ts | 264 | 36 |
| production | src/mcpl/push-handler.ts | 6 | 5 |
| production | src/mcpl/reference-fetcher.ts | 2 | 1 |
| production | src/mcpl/server-connection.ts | 199 | 95 |
| production | src/mcpl/server-registry.ts | 2 | 1 |
| production | src/mcpl/tool-classes.ts | 7 | 5 |
| production | src/mcpl/tool-lifecycle.ts | 3 | 1 |
| production | src/mcpl/tool-result-normalize.ts | 2 | 1 |
| production | src/mcpl/toolset-host.ts | 2 | 2 |
| production | src/mcpl/transport.ts | 69 | 35 |
| production | src/mcpl/types.ts | 15 | 1 |
| fixture | test/fixtures/mcpl-diagnostic-allowlist.json | 3858 | 0 |
| test/helper | test/helpers/mcpl-diagnostic-closure.ts | 137 | 0 |
| test/helper | test/mcpl-credential-diagnostics.test.ts | 214 | 0 |
| test/helper | test/mcpl-credential-required.test.ts | 588 | 0 |
| test/helper | test/mcpl-credential-scalars.test.ts | 212 | 0 |
| test/helper | test/mcpl-credential-sinks.test.ts | 203 | 0 |
| test/helper | test/mcpl-diagnostic-allowlist-boundaries.test.ts | 105 | 0 |
| test/helper | test/mcpl-diagnostic-closure.test.ts | 70 | 0 |
| test/helper | test/mcpl-rejection-log-lines.test.ts | 4 | 2 |

## Fix Directions

1. Close completed/cached model metadata exposure, including credential-history changes and final request snapshots; omit unsafe entries without aliases.
2. Close pre-trace side effects and derived health/marker/error outputs while preserving internal operational classification.
3. Preserve SDK fixed discriminants structurally; test actual router/checkpoint events.
4. Fix notice replacement without key-renaming SDK envelope fields; separate notices from raw external application ingress. Preserve original responder methods/receivers with flag unset.
5. Correct/qualify proposal reasons and test real delegation branches. Keep application/wire exclusions narrow.
6. Preserve engine policy, full snapshot, lifetime retention, no-minimum contract and per-sink legacy controls; rerun affected gates and obtain re-review. The allowlist is **not approved wholesale**.
