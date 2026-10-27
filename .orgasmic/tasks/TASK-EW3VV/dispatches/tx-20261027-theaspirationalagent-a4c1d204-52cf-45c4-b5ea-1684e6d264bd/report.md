# TASK-EW3VV — BLOCKED-FOR-SCOPE

This is a **part-2 baseline investigation, not a completed implementation**. Neither these results nor acceptance of part 2 would certify the full guarantee or authorize strict-mode rollout to any client or agent. A clean diagnostic listing, trace, or notice would not certify the model catalogue or actual provider-request surface.

## Changed

**No repository changes or commits.** HEAD remains `112bc593464315a9531b6af6d00d9d2368985daa`. Production/test/documentation diff: **0/0/0 lines**, zero changed tracked files. No push, PR, tag, version bump, publishing, checkout switch, cherry-pick, or modification of the main checkout.

The manager's scope decision directed this result: complete the start-commit matrix without production edits, then finalize blocked-for-scope for a single re-scope decision. The earlier grant for `src/mcpl/push-handler.ts` stands but was not used. Authorization for `inference-router.ts` and `tool-classes.ts` was withheld pending this report; subsequent probes also found diagnostic publications in `feature-set-manager.ts` and `channel-registry.ts`.

All scripts, raw observations, logs, preserved lock bytes, and this report are under `$ORGASMIC_EVIDENCE_DIR` (abbreviated **E** below), outside the worktree. Installation/build created ignored `node_modules`, `package-lock.json`, `dist`, and incremental compiler output. The generated lock is not committed.

### Preflight and references

- Starting HEAD exactly matches the required commit; `git merge-base --is-ancestor 4976c67d5c7916a15046c627b68913994c33b3cb HEAD` exits 0.
- `git diff --stat 4976c67d..112bc593` lists exactly the specified ten files: README, three production files, six tests; +876/-2.
- Bun `1.4.3`, SHA-256 **`7ce7d6b654eddeec20afddf2396317fba6dc19ab52788a27e894e1806bf8f24b`**; Node `v22.23.3`; npm `10.9.9` (the brief specified no expected npm version). Raw receipt: `preflight.txt`.
- Read the supplied project baseline; it contains no additional operative constraints. No applicable AGENTS.md found. Conventions/gotchas supplied as none. Read the orgasmic skill and command-ownership instructions.
- Missing reference paths were requested before probes. Read the supplied round-4 HIGH/MEDIUM findings, probe list, v2 brief review, v3 closure review, and part-1 verification review. Verified SHA-256:
  - `/srv/review-drop/TASK-V1DZF-r4-review.md`: `dba2e625530144c6eeb7e1e2ecd158c9e070795c7b548418fb74bef25e1866ac`
  - `/srv/review-drop/WO-1a-part2-v2-brief-review.md`: `7db6ffbcd04b7fe74668da86e8e19f257c9a106960486758911f07a298312781`
  - `/srv/review-drop/WO-1a-part2-v3-closure.md`: `d63430a129654f7a6a5658473a3d0ab8d50833046908d7c6fd8737c950d1ddba`
  - `/srv/review-drop/TASK-T2F13-r2-review.md`, computed (no expected hash supplied): `f3f2ecb9d848cc45dfaac2fb98ab45b9f8285cea083138880ac467547e326f0b`
- Inspected the named rejected commit using `git show`/`git ls-tree`, including its diagnostic/sink tests, and the current part-1 comparison harness. No earlier implementation was copied or cherry-picked. New evidence scripts were authored for this investigation; existing compiled MockMembrane test support was imported. Reviewer reports are leads, not reused verification receipts.

### Dependency acquisition

Installed once with `npm install --registry https://registry.npmjs.org/ --ignore-scripts --no-audit --no-fund`, via `install.sh` under gate `baseline-install`. The child used `env -i`, fresh HOME/cache, empty explicitly selected user/global npm configs, `NO_UPDATE_NOTIFIER=1`, `npm_config_update_notifier=false`, and no auth environment. All resolved lock sources are HTTPS public-registry sources. No dependency/version edits.

Preserved lock bytes: `E/package-lock.json`; SHA-256 **`0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`**, identical to part 1. Versions match: ws 8.22.0, typescript 7.0.2, tsx 4.23.15, @types/node 22.20.5, @types/ws 8.18.2, @animalabs/mcpl-core 0.4.0, @modelcontextprotocol/server 2.4.0. No dependency-drift qualification is necessary.

The lock declares install scripts for esbuild and optional fsevents. esbuild's `postinstall: node install.js` was inspected but never enabled; a local transform smoke check works without it. fsevents is not installed on this platform. No package was found to require enabling a lifecycle script.

## Verification Gates

All listed runtime gates ran at the unchanged start commit. The wrapper log named `<gate>-wrapper.log` identifies the immutable `gate-<gate>-<id>.log` and receipt. Gate stdout includes HEAD and clean-tree status. These are baseline results, not implementation acceptance.

Exact command pattern: `orgasmic dispatch gate NAME -- COMMAND`. `offline.sh` creates a fresh HOME and empty npm configs, clears the environment except PATH and explicitly listed settings, disables both notifier settings, and loads the loopback guard. It permits local sockets, unlike a deny-all-socket sandbox.

| Gate | Command after `--` | Outcome |
|---|---|---|
| baseline-install | `bash "$E/install.sh"` | PASS; 55 packages; matching lock |
| baseline-build | `env -i PATH="$PATH" HOME="$(mktemp -d)" NO_UPDATE_NOTIFIER=1 npm_config_update_notifier=false npm run build` | PASS; see procedural qualification below |
| baseline-build-isolated | `bash "$E/offline.sh" npm run build` | PASS |
| baseline-typecheck | `bash "$E/offline.sh" node_modules/.bin/tsc --noEmit` | PASS |
| baseline-suite | `bash "$E/offline.sh" npm test` | PASS: 7,945 tests, 7,900 pass, 45 skip, 0 fail; 364 suites |
| baseline-scope-node / baseline-scope-bun | `bash "$E/offline.sh" node-or-bun-1.4.3 "$E/scope-probe.mjs" "$E/scope-ENGINE.json"` | PASS asserting push diagnostic leak, two credentials/engine |
| baseline-inference-scope-node / -bun | analogous `inference-scope-probe.mjs` | PASS asserting inference diagnostic leaks |
| baseline-classes-scope-node / -bun | analogous `classes-scope-probe.mjs` | PASS asserting class diagnostic leak |
| status-source-node | `bash "$E/offline.sh" node "$E/status-probe.mjs" "$E/status-node.json"` (v1 preserved) | PASS; structured status |
| status-source-bun | same with Bun | FAILED fixture: assumed request.destroy exists |
| status-source-bun-corrected | same with Bun, corrected script/output | PASS; request.abort instead |
| matrix-final-node | `bash "$E/offline.sh" node "$E/matrix-probe.mjs" "$E/matrix-final"` | PASS: 102 scenarios |
| matrix-final-bun | same with `bun-1.4.3` | 99 scenarios complete; three socket-error fixtures fail before intended error event |
| matrix-bun-socket-raw | `bash "$E/offline.sh" bun-1.4.3 "$E/matrix-bun-socket-probe.mjs" "$E/matrix-bun-socket" socket-error` | FAILED intended-error assertion; actual close 1011, not error event |
| matrix-lifecycle-verified-node / -bun | `bash "$E/offline.sh" node-or-bun-1.4.3 "$E/matrix-lifecycle-probe.mjs" "$E/matrix-lifecycle-verified" connect-failed,reconnect-failed,pending-close,rotation-late-error` | PASS: 12 scenarios/engine |
| scope-final | clean-tree/HEAD/diff assertions via `bash -c` (exact argv in receipt) | PASS; unchanged HEAD and no tracked/untracked changes |
| matrix-audit | `python3 "$E/matrix-audit.py"` | PASS; 228 scenarios, 2,736 annotated cells |

Earlier exploratory `matrix-node`, `matrix-complete-node`, and `matrix-lifecycle-{node,bun}` logs/artifacts are retained, not substituted for the final matrix. Corrections included causal sink attribution, scanning actual captured strings rather than only escaped serialization, a channel message batch instead of an invalid envelope, and recording initial acceptance separately from later rotated headers. No production failure was repaired or hidden by those changes.

First `baseline-build` cleared the environment and used a fresh HOME but did not explicitly select empty user/global config files. `baseline-build-isolated` reran the exact package build with those files selected. This is a procedural qualification of the first build, not a dependency reinstall or a claim that its invocation complied fully.

Tests used synthetic data, local files, and self-started numeric-loopback servers. The ops webhook was an actual loopback HTTP server, not a network fetch stub. Local mock membrane failures were used, never an external model/provider. The libc guard rejects non-loopback connect/send/name-resolution calls; it is **not kernel isolation**, and no packet-capture or direct-syscall-bypass guarantee is claimed. The baseline full-suite log contains zero guard-denial markers. Existing suite failures: none. Bun full-suite parity was not run; Bun ran the identified probes, not the entire npm suite.

## Baseline evidence and leak matrix

**225/228 scenarios completed** across both engines: 38 lanes × random, 32-digit, and additional escape-bearing credentials. Three Bun post-open-error fixtures remain unexercised. The random credentials are CANARY plus 40 hex digits; the digit credential is a 32-character string. Escape-bearing variants add space, slash, quote, backslash, percent, and plus to exercise distinct encoding forms. All original credentials were accepted by the strict dial and observed as the Authorization header by the real peer.

Each scenario captures console arguments/caller frames, connection diagnostic events, errors including own fields/cause and inspection text, framework traces, actual failures.log bytes, loopback webhook bodies, queued SDK tool notices, server listing, health, failure markers, catalogue snapshot, and relevant application consumers. Empty captures are not cleanliness proof. Noncausal startup traces/listings are also **unexercised** for the lane, not counted as coverage.

`leak-matrix.csv` and `leak-matrix.json` contain **every cell**, including engine, credential kind, lane, sink, leaks/does-not-leak/unexercised, originating source site, sink source site, baseline gate, raw artifact path, matching forms, and scope classification. Raw fixtures are in `matrix-final/` and `matrix-lifecycle-verified/`. “Does not leak” means only the observed publication, not a closed class.

Counts: 192 leaking part-2 diagnostic cells; 198 observed nonleaking part-2 cells; 1,890 unexercised part-2 cells. Separately: 18 catalogue-disclosure cells (part 3), 12 nonleaking catalogue snapshots, and 24 unchanged application-payload cells (intended R8 behavior). Counts are repeated observations, not distinct defects or a completeness measure.

**After matrix:** no implementation was authorized or made; the start commit remains the final tree. There is no red-then-green or post-fix matrix. The baseline matrix below is not relabelled as a final guarantee.

# Baseline leak matrix

L = leaks; N = does not leak in the exercised publication; U = unexercised. App L means required unchanged payload, not a diagnostic defect. Catalogue L is part 3. Every cell with its origin, sink site, gate, credential kind, matched forms and raw artifact is in leak-matrix.csv/json.

Each compact cell is Node/Bun for accepted random and 32-digit credentials. Escaped-token variants are separately retained in the detailed matrix. Noncausal background snapshots are U, even when they contain no credential.

| Lane | errors | connectionEvents | console | trace | failures | webhook | notices | listing | health | markers | catalogue | application |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| upgrade-401 | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| upgrade-403 | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| upgrade-404 | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| upgrade-500 | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| upgrade-302 | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| initialize-close-raw | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| initialize-close-percent | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| initialize-close-json | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| initialize-close-authorization | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| initialize-error | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| initialize-malformed | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| malformed-json | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| malformed-page | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| rpc-message | N/N | U/U | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| rpc-code | N/N | U/U | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| rpc-data | N/N | U/U | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| tools-name | U/U | U/U | U/U | L/L | U/U | U/U | L/L | L/L | U/U | U/U | L/L | U/U |
| tools-description | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | L/L | U/U |
| tools-schema | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | L/L | U/U |
| tools-class | U/U | U/U | L/L | U/U | U/U | U/U | U/U | N/N | U/U | U/U | N/N | U/U |
| tools-refresh-notices | U/U | U/U | U/U | L/L | U/U | U/U | L/L | N/N | U/U | U/U | N/N | U/U |
| notification-list-error | U/U | U/U | N/N | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| logging-notification | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| unknown-request | U/U | U/U | L/L | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| push-accepted | U/U | U/U | U/U | L/L | U/U | U/U | U/U | U/U | U/U | U/U | U/U | L/L |
| push-rejected | U/U | U/U | L/L | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| inference-refused | U/U | U/U | L/L | L/L | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| feature-disabled | U/U | U/U | L/L | L/L | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| channel-incoming | U/U | U/U | L/L | L/L | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| socket-error | U/U | N/U | U/U | N/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| close-after-open | U/U | L/L | U/U | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| external-input | U/U | U/U | U/U | L/L | U/U | U/U | U/U | U/U | U/U | U/U | U/U | L/L |
| exhaustion | U/U | U/U | L/L | L/L | L/L | L/L | U/U | U/U | L/L | L/L | U/U | L/L |
| native-exhaustion | U/U | U/U | L/L | L/L | L/L | L/L | U/U | U/U | L/L | L/L | U/U | L/L |
| connect-failed | U/U | N/N | N/N | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| reconnect-failed | U/U | N/N | N/N | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| pending-close | N/N | L/L | N/N | N/N | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |
| rotation-late-error | L/L | U/U | L/L | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U | U/U |

### Interpretation and originating-route evidence

- **Admission/structural controls:** invalid protocol revision is refused by handshake validation; malformed JSON is ignored by parsing; an unhandled `notifications/message` is ignored by notification dispatch. None proves redaction at an unreached sink. Short enum/key collisions from the rejected attempt were not padded or advertised as reproduced defects. The 31/32 admission tests remain implementation work.
- **Handshake:** peer status text/body carries the forms while structured upgrade status varies; returned strict errors are fixed part-1 messages. Close-reason echoes at initialize do not reach the returned handshake message; this is omission of peer reason, not evidence for other close paths. Post-open close reasons do reach public connection close events unfiltered (`server-connection.ts:2797-2805`). Pending-call close also exercises safe returned-error/console copies and the leaking close event.
- **RPC error answers:** actual tools/call answers separately place echoes in message, code, and nested data/keys. The current returned errors and console copies are clean for these accepted credentials. Message probes also carry forged `provider-threw`, `mcpl:inference_fail`, and `[credential-unusable]` text; no privileged marker exemption is inferred. Their clean result is a baseline control, not new code coverage.
- **Rotation:** keep one real connection/configuration, perform 17 additional real strict dials on the same configuration, verify all 18 headers, then receive an error reflecting the first credential over the still-open original connection. Both engines leak the old credential in returned error and console. This exercises the 16-entry eviction in `noteDialSent`, not direct registry injection.
- **tools/list:** name echoes reach queued new-tools content/metadata, process trace, operator listing, and catalogue. A refresh replaces the credential-named tool with a safe name; the removed name still appears in queued notice metadata. Catalogue entries/identities were not altered. Description/schema echoes reach the shared catalogue and remain part 3.
- **Class warning boundary:** `_meta['mcpl/class']` carries the credential while the callable name is safe. The leak is the SDK's own warning at `tool-classes.ts:128`, invoked by catalogue classification at `framework.ts:30191`. It reads catalogue data, but the proposed change is only its console display copy, not definition admission or class/callable semantics. The unknown class is ignored; that is not catalogue-admission certification.
- **Push, channel, feature, inference:** granted/authenticated wire routes execute the actual helper publication, not a direct call to console/emitTrace. The feature validation/channel-registration failures are business-protocol refusals that themselves publish diagnostics. They do not refuse the credential before the diagnostic sink. Their console/trace echoes therefore count as reproduced leaks, not credential admission controls.
- **Ordering witness:** tools/call returns unchanged credential-bearing structuredContent. A local mock membrane reflects that received value as an error during three real public failed turns (`pushEvent` → `runUntilIdle`). One exhaustion path populates console, trace, failures.log, marker, health, and eventually the actual ops webhook. `mockCalls == 3` is asserted. No private `emitTrace`, failure writer, health setter, or ops boundary is directly injected. All those diagnostic sinks leak on both engines. Native variants add Error name/cause/code; the digit variant supplies a bigint code. This exercises a native carrier on that route, but does **not isolate bigint as the sole source** of a sink echo.
- **Application controls:** accepted push body/origin fields remain unchanged in the real queued event; public raw external input remains the original object in the queue and reaches a module with unchanged content; tool-result content/structuredContent remains unchanged. Their trace copies leak. “Application L” in the table denotes required unchanged delivery, not a defect to fix by rewriting application data.
- **Encoding qualification:** full detailed cells include raw, percent, lowercase-percent, form, JSON, slash-escaped JSON, and Authorization variants. The audit also recognizes the SDK log formatter's `\u0020`/`\u003d` representation. These SDK-generated escapes can otherwise hide a recoverable console disclosure from a substring-only checker. Proposed fixes redact variable text **before** logValue formatting, not globally at console. No claim covers arbitrary encodings.

### Per-engine status source

- **Node 22.23.3 / ws 8.22.0:** `unexpected-response(req,res)` supplies `res.statusCode`. Installed `ws/lib/websocket.js:915-948` reads the HTTP response object and emits this event; adding the listener suppresses default abort. Runtime probes received 401, 403, 404, 500, 302 from that structured field while the peer reason phrase said PEER-403 and body said PEER-401. No message parser is needed.
- **Bun 1.4.3:** its built-in ws implementation also emitted `unexpected-response` with structured response `statusCode` for the same five statuses. Its request has `abort()` and lacks `destroy()`; response has `destroy()`/`resume()`. Corrected probe closes after response destruction/request abort/termination. The stack identifies Bun's built-in `ws` handshake callback. This is runtime evidence for a structured source, not an invented text-provenance argument or full teardown qualification.
- No other HTTP 401/403 source at this configuration/upgrade step was identified. JSON-RPC error codes, reason phrases, headers, bodies, and close reasons must not be treated as HTTP status. The strict listener implementation and its exactly-once/listener/timer/handle tests are **not done**. Therefore no status-mapping acceptance is claimed.

## Evidence-backed change inventory and requested re-scope

These are the **exact evidence-backed source files/sites proposed for the next implementation**, plus required dial/projection/retention work. Estimates are net production additions, not measured diffs. No unexercised class is claimed closed by this inventory.

| File | Proved/required sites and narrow change | Estimated net lines |
|---|---|---:|
| `src/mcpl/protocol-family.ts` | Existing redactor/projector/error helpers :160-277: one strict projection choke point, fresh strict error copies, fixed-constant provenance; registry :294-318: strict lifetime retention, legacy 16 unchanged. Rotation leak reproduced. | 150–200 |
| `src/mcpl/transport.ts` | `openStrict` :705-777: required fifth code, structured strict-only upgrade handling/teardown, abort mapping, 32 floor after unchanged headerCarries; route strict errors through choke point without changing legacy wiring. | 35–55 |
| `src/mcpl/server-connection.ts` | Unknown-method console :2463-2479; lifecycle close diagnostic :2797-2805; route existing diagnostic error/publication helpers as needed to strict choke point. Preserve operational codes and application event bodies. Existing RPC/error controls must remain green. | 40–70 |
| `src/framework.ts` | Strict trace display copy before side effects :26338-26410; failure/health/marker/ops path :26488-26500,26632-26671,26778-26966; process trace :5931-5942 without changing input; queued SDK notices :30394-30412; display listing :29238-29355; per-config formatter wiring for proved helper sites. | 100–150 |
| `src/mcpl/push-handler.ts` | Manager-granted expansion: rejection console :174, accepted trace :288-294 proved. Optional per-call strict diagnostic formatter; no replacement of params/event/responder, no legacy wrapper. Other siblings need their own witnesses. | 12–20 |
| `src/mcpl/inference-router.ts` | **Not authorized:** no-model refusal console :275-283 and trace :287-293. SDK explanatory text contains received feature name. Keep original responder and trace callback receiver; not application-message rewriting. | 10–20 |
| `src/mcpl/tool-classes.ts` | **Not authorized:** warning :128, from actual tools/list metadata. Only diagnostic string formatting; do not change parsed class result, names, definitions, or admission. | 10–20 |
| `src/mcpl/feature-set-manager.ts` | **Not authorized:** disable console/trace :226-235. SDK explanation and diagnostic fields from received feature name/uses. Preserve enabled-set/grant decisions and original capability objects. | 10–20 |
| `src/mcpl/channel-registry.ts` | **Not authorized:** unknown-channel rejection console/trace :1842-1854. SDK rejection record containing received channel/message IDs. Preserve incoming application bodies, wire response, routing IDs, and registration policy. | 15–25 |

**Total: 9 production source files, approximately 382–580 net production lines**, plus roughly 40–65 README lines and substantial tests/harness work. This exceeds the 8-file stop threshold even without README. Other authorized files (`types.ts`, `log-value.ts`) are not currently necessary in this minimal plan; adding them or unexercised helper paths could further increase scope. Estimates do not authorize implementation or establish a 600-line upper bound.

### Proposed split for manager approval

1. **Dial classification/admission:** the five-code mapping and teardown tests, then the 32-character floor, as separate focused commits in the original required order. No diagnostic-completeness or rollout claim.
2. **Strict diagnostic primitive/lifetime and connection publications:** protocol-family choke point, R9, connection/transport diagnostic paths, detached-error and provenance tests; legacy object/receiver controls.
3. **Framework diagnostic ordering and display copies:** pre-side-effect trace/error projection, failed-turn bookkeeping, notices/listing, and the five explicitly identified helper files (push, inference, classes, features, channels) through per-config strict-only parameters. Split this further if review size requires it; retain one primitive, not parallel redactors.
4. **Integration gates and final documentation:** complete original-base overlays on both engines for omitted/false/null, every required behavior control, residual origin probes, final README guarantee only when all required diagnostic work passes. Parts 3 and 4 of the overall rebuild remain separate, unchanged scope.

This is a proposal, not a new work order or unilateral change to deliverables. It avoids reconstructing the rejected all-at-once implementation and avoids dropping any observed SDK diagnostic leak from the guarantee.

## Unmet Criteria

The manager explicitly requested a scope-blocked result, not implementation continuation.

- **A:** no production/test/doc hunks; no commit. The requested implementation commit sequence is not performed. Current FILES is inadequate for the observed strict diagnostic origins despite the one granted expansion.
- **B/C:** original-base versus final legacy per-sink/wire/error/identity/responder/receiver comparisons were not rerun. Existing comparison code was read, not adopted as a new receipt. No equality/hash claim is made. No strict fix exists to compare.
- **D:** unmodified baseline build, suite, typecheck completed as above. No final implementation gates exist. Existing failures: none in the Node npm suite. Bun full suite not run.
- **E:** no new repository tests. Evidence probes have recorded start-commit outcomes only. Leak witnesses pass by **asserting/recording the defect**; they are not red-then-green security tests. Clean observed routes are baseline controls. No artificial product failures were constructed.
- **F:** the populated matrix and raw artifacts are supplied, with 225 completed scenarios and unexercised cells explicit. Fifth-code mapping, 31/32 floor, dedicated short-token admission controls, fresh strict API error/prototype/instanceof/cause identity, getter/toJSON/exotic/cycle/depth controls, isolated bigint disclosure, all fixed-type/forged-marker combinations, and after-fix ordering are not implemented/qualified. Bun post-open socket-error event remains unexercised: `_socket` was unavailable; the raw-upgrade-socket variant instead produced close 1011 with fixed reason “Compression not implemented yet.” Both failed fixture receipts remain, with no regression label.
- **G:** source/sink inventory supplied per cell and above; it is an audit aid, not a source-site completeness claim. No part-4 scanner or allowlist was added.
- **R1/R2/R4/R6/R9/R11:** required changes remain unimplemented. **R3/R5/R7/R8/R10:** observed baseline evidence only; no universal guarantee or non-strict equivalence acceptance. R8 controls demonstrate the exercised unchanged application routes, not every application lane.

### Explicit unexercised routes and limits

All unexercised lane/sink combinations are enumerated in `leak-matrix.csv/json`; many lanes naturally do not produce every kind of publication. A background listing or absent webhook is not treated as a reached redaction sink. Additional unexercised subroutes include startup-only connect-failure console/alert, TLS/DNS/open-timeout/constructor/abort failure inventory, shared-entry configuration error after prior accepted credentials, arbitrary error-listener failures, all helper sibling warnings, reconnect alert threshold, registered-channel/coalesced delivery, checkpoint/hook/tool-lifecycle diagnostics, toolset-derived notices, resource contents, native accessor/exotic/cycle/depth cases, form encoding with lowercase hex as a distinct escaped-token variant, and arbitrary unknown encodings. Short-token/field-name/type collisions are not possible after the proposed floor and have not been counted as reproduced diagnostic closure.

**Part-3 findings:** real tools/list names, description, and schema echoes reach the shared catalogue. The name case independently leaks the SDK operator/display copies, which are part 2. Completed namespaced-name collisions, stale catalogues across credential rotation, per-agent presentation snapshots, and actual provider-request admission were not exercised here; previous review claims about them are not new receipts. No catalogue entry was withheld, renamed, or altered.

## Residual Risk

The full original assignment cannot be accepted from this run. Known leaks remain in the unchanged code, including pre-trace failure bookkeeping and old-token eviction. Four additional source files need authorization beyond the push-handler grant; broad helper/sibling routes could widen the evidence-backed plan further. Retention must remain the owner's unbounded strict-lifetime decision with the legacy cap unchanged, and its memory growth still needs documentation.

No required owner decision was revisited. Open operational decision: re-scope/sequence the proposed diagnostic changes before implementation. Bun structured status is available in these probes; full strict teardown still needs dedicated tests. No class is described as closed.

### Artifact integrity

- Preserved lock: `0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`
- `leak-matrix.json`: `212783bc263d0b8e2a3d09175b1e575823a87d92d514cacd993ad2d612a764a7`
- `leak-matrix.csv`: `c2f1680d76d5735c063bbae627e17d701af9ccbe50507e958818b6da40d6d94e`
- `matrix-probe.mjs`: `5e55f42d441168e128be17e5de326c35409651bc936b05348002a6de20e68b76`
- `matrix-lifecycle-probe.mjs`: `ccbef956cf31a463cb011c94a29e145e44caf394baebeb860797284bea4b0c76`

These are integrity hashes, not base/final comparison hashes. `matrix-audit.json` records counts and the three incomplete fixtures. Wrapper logs preserve exact gate commands/results and their durable log references. Final status is **BLOCKED-FOR-SCOPE**, with no implementation commit.

### Finalize handoff

The first finalize was refused for one queued manager message. The CLI returned only a conflict, so the recovery/peer-message guidance was read and the run's message events inspected read-only. The full delivered message repeats the reference-material instruction already received through the initial ask answer and fulfilled before probes. Its three supplied hashes match those above. It requests no new implementation or scope change; receipt/read verification was acknowledged again. No daemon/session/ledger state was hand-edited.
