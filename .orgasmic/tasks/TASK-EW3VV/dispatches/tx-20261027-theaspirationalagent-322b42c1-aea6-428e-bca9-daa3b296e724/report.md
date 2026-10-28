# WO-1a P2-narrow implementation report

This is deliberately the narrow dial/two-sink piece, **not the full credential-redaction guarantee and not permission to roll strict mode out to any client or agent**. Other diagnostic redaction (local console output, trace events, connection events, health and marker state, notices and listings), model-catalogue admission and the mechanical drift guard are parked. A server that sends the credential back can still make it appear in local console output and traces; that is the documented R7 limit, not something this change fixes.

All artifact references below are relative to the evidence directory containing this report. `pull-request-draft.md` is the requested upstream description; it has not been published. This is implementation evidence, not independent review, qualification or sealing. No class is described as closed.

## Changed

### Commits and scope (acceptance A)

Starting HEAD was exactly `112bc593464315a9531b6af6d00d9d2368985daa`; original base `4976c67d5c7916a15046c627b68913994c33b3cb` was verified as its ancestor. Their diff was exactly the prescribed ten part-1 files (+876/-2). No newer upstream source or earlier rejected implementation was reused.

Four ordered local commits:

1. `82b29b1122ec62bacbab563c08eb5f5f6ae68e49`: five-code mapping and structured-status teardown.
2. `fee3de7d635d286440ca63feac8d452ed6a58337`: 32-character floor.
3. `bf21f134ad70780964f082baa2bf1035cccf2f77`: lifetime registries and two-sink redaction.
4. `d2b5fbf0cd15652427dd5afff13a80257ae59195`: README and comparison harness; also compatibility corrections discovered by that harness (native Error formatting, fixed outer field names, flag-toggle cleanup, already-prepared diagnostic data formatting, and runtime enabling of a previously non-strict held configuration). These corrections are not hidden as documentation-only changes.

Diff from start: **three production files, +170/-16 (net 154)**; tests/harnesses **+775/-2 (net 773)**; README **+73/-25 (net 48)**. Only allowed files changed. `acceptance.json` lists every file and source anchor. `package.json`, dependencies and version were not changed; generated lock bytes are preserved outside the repository and not committed. No push, PR, tag or publication occurred.

### Production changes and strict guards

- `src/mcpl/transport.ts:706–801`: changes are within the existing explicit strict dial. Numeric `unexpected-response.response.statusCode` alone selects 401/403; all other socket/abort/construction paths use `connection-failed`. Listener teardown discards the body, destroys/aborts the request as supported, terminates the socket, removes dial listeners and cancels the timer. One intentional late-error swallow remains, not a retained dial callback. `headerCarries()` is unchanged. The floor at line 742 follows that check and precedes I/O.
- `src/mcpl/protocol-family.ts:283–413`: separate lifetime sets and one descriptor-only `redactStrictSink` choke point. The optional strict argument to `noteDialSent` is absent on the legacy path; the old sixteen-entry history still executes unchanged. The new sets do not replace the old registry used by other diagnostics.
- `src/framework.ts:26504`: `logFailure` selects the strict detached copy before `boundFailureFields` and append. Without a strict lifetime registry it passes the exact original record.
- `src/framework.ts:26640–26700`: `opsAlert` leaves original description/data preparation and trace emission unchanged. Only exporting copies are filtered, including already-escaped forms, before their final formatting/JSON. This preserves native Error and existing custom-serialization formatting without invoking caller hooks a second time. Webhook fixed wrapper/kind and outer record field names stay structural. A small local Error used to print a **detached** diagnostic projection is never returned to a caller; caller Error identity/prototype/cause are untouched.
- Lifecycle hooks: registration `framework.ts:6438`, removal `29028`, final connection close `29987`, framework stop `4745`. Registration now records inert ownership for each held configuration, as expressly allowed by the final manager decision below. It creates no accepted set. Only a strict dial creates/populates that set; cleanup removes the lifetime record without changing caller objects or publishing anything. No listener is added to legacy connections and event order is unchanged.

Hunks outside a lexical strict branch: imports/declarations have no publication effect; union lookup scans current configurations but yields no optional registry for never-strict sets; inert registration/cleanup bookkeeping has no caller-visible state, listener or output changes; the optional `noteDialSent` parameter defaults false and leaves the legacy body untouched. The final original-base byte comparisons exercise these paths. There is no responder/config/transport/event replacement or spread-merge of unfiltered data with filtered data.

### Union ownership and lifecycle (R3–R5)

Both writers are **framework-global**, not per-server. “Held” means the configuration is in that framework’s map and its lifetime record has not ended: stopped/removed/finally-closed configurations contribute nothing even if an object remains in the map; reconnect-pending configurations keep contributing. Each obtains `strictSinkRegistries(this.mcplServerConfigs.values(), this)`: union of accepted sets belonging to the currently held strict lifetimes **in that framework**, including a flag now set to false. They do not infer a registry from a failing server id. No other sink uses this union.

Registration creates an inert lifetime record, not an accepted set; accepted strict dials lazily create sets and add distinct credentials to every live owner of that configuration. Rotation does not evict old entries. Removal/final closure/stop deletes that owner's set, including when an operator turned the flag off before stop; turning it back on afterward cannot resurrect history. Re-adding the same object starts empty. A separate framework holding the same object keeps its own lifetime. Weak ownership/targets avoid a process-wide strong set. Transient reconnects retain history, tested both while reconnect is pending and after a real automatic reconnect. Flipping back to false while held retains the accepted strict set until lifetime end; pre-flip legacy-only credentials never join it. All live owners of a shared object record its strict dials, so cross-framework over-redaction is possible and documented; removal by one owner never erases another’s history. Legacy still keeps exactly sixteen entries.

The mixed scenario demonstrates the owner's intended over-redaction: a non-strict server's failure containing another strict configuration's credential changes **only** the two exporting sinks. Its own unrelated token is untouched. Removing the strict lifetime restores original bytes; another still-held strict lifetime continues to redact. This difference is the owner's decision, not a leak.

### Manager scope decisions

Preserved answers: `scope-question.log`, `ceiling-question.log`, `lifetime-guard-question.log`.

1. Named manager-granted lifecycle scope expansion: same three files/~300 net lines; registration (`framework.ts:6438`), removal (`29028`), stop (`4745`) and existing final-close callback (`29987`) hooks allowed for retention cleanup. No alert caller template was changed.
2. Do **not** modify 28 alert callers for template provenance. Redact assembled text at the two boundaries. Separate fixed fields remain structural; a credential equal to/contained in public fixed template text may redact that template too. **assembled-text redaction at the sink boundary, by manager decision**: this narrows the original R3 template-provenance requirement; full R3 template provenance is not claimed. A public-template credential is tested and documented.
3. Cleanup must guard on an existing lifetime, not merely the current flag. Match previously escaped forms as well as raw text. The flag-false-before-stop/true-after-stop control is included.
4. `runtime-enable-question.log`: a final real-wire probe exposed a gap for a configuration registered non-strict and later mutated to strict. The manager required adoption and authorized inert ownership records for all held configurations as fallback. This implementation uses that fallback: a single per-object accepted set would let stopping one framework erase another framework's still-held history, contrary to the exercised independent-owner contract. Accepted sets remain lazy/strict-dial-only; no caller wrapper, copy, listener or output change is introduced for legacy. `runtime-enable-confirm-{node,bun}.log` reproduces 51 unexpected-presence cells before the fix; the expanded committed route fixture now exercises that transition on both engines. Queued follow-up explicitly required flag-off retention, pre-flip legacy exclusion, reconnect persistence and independent owners; these are now tested. `held-flag-off-before-{node,bun}` shows ten new absence checks failing before the one-line flag-filter correction, while the new reconnect/pre-flip controls already behaved correctly.

## Verification Gates

### Environment, install and baseline

`preflight.txt`, `install.sh`, `dependency-audit.json`, and `commands.md` preserve exact commands/results. No absolute tool/home paths are needed to reproduce them.

- Bun **1.4.3**, binary SHA256 **7ce7d6b654eddeec20afddf2396317fba6dc19ab52788a27e894e1806bf8f24b**.
- Node **v22.23.3**, npm **10.9.9**.
- One installation, fresh empty HOME-like config, empty user/global npmrc, `env -i` (no auth variables), notifier disabled from the first npm command, explicit HTTPS public registry, `--ignore-scripts --no-audit --no-fund`.
- Preserved lock SHA256 **0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1**, byte-identical to the installed tree and the provided part-1 resolution. No git/file/tarball-URL/private registry sources. ws 8.22.0, typescript 7.0.2, tsx 4.23.15, @types/node 22.20.5, @types/ws 8.18.2, @animalabs/mcpl-core 0.4.0, @modelcontextprotocol/server 2.4.0. No baseline comparison is inconclusive due to dependency drift.
- No lifecycle scripts were enabled. esbuild's declared install hook remained disabled; its optional platform binary works and is exercised by the overlay.
- All probes used synthetic data and local files/loopback servers. No provider/model service or real credential was used; failed turns use a local mock model client.

Exact principal commands (each run through `orgasmic dispatch gate NAME -- ...`):

```sh
env NO_UPDATE_NOTIFIER=1 npm_config_update_notifier=false npm run build
env NO_UPDATE_NOTIFIER=1 npm_config_update_notifier=false npm test
node_modules/.bin/tsc --noEmit
# Final typecheck repeats the same compiler via the package script:
env NO_UPDATE_NOTIFIER=1 npm_config_update_notifier=false npm run typecheck
bash "$ORGASMIC_EVIDENCE_DIR/bun-isolated.sh" candidate
env P2_EVIDENCE="$ORGASMIC_EVIDENCE_DIR/final-comparison" bash test/mcpl-narrow-verify.sh
```

Final gate names are `final-candidate-build`, `final-candidate-typecheck`, `final-candidate-test`, `final-candidate-bun-isolated`, `final-candidate-comparison`; transcripts are `candidate-{build,typecheck,test,bun-isolated}.log` and `final-comparison.log`. Immutable `gate-<name>-<invocation>.log` receipts are retained alongside them.

### Existing suite and typecheck (acceptance D)

| Gate | Unmodified start | Final candidate |
|---|---:|---:|
| Build | PASS | PASS |
| Typecheck | PASS | PASS |
| Node suite | 7945 tests: 7900 pass, 45 skip, 0 fail | 7992 tests: 7947 pass, 45 skip, 0 fail |
| Bun, each compiled file isolated | 325 files: 7701 pass, 45 skip, 175 fail | 330 files: 7747 pass, 46 skip, 175 fail |

Bun is **not green**. `bun-failure-comparison.json` lists all existing failing test identities and the 33 failing filenames; there are no new failing identities. `bun-baseline/` and `bun-candidate/` retain every file's stdout/stderr and exit code. An intermediate repetition had one pair of intermittent legacy close-test outcomes exchange pass/fail; `bun-pre-runtime-enable/` retains it separately, and `commands.md` records the start-source rerun rather than hiding the fluctuation. The initial all-files-in-one Bun attempt was interrupted after pre-existing failures/hangs; it is not counted as a passing result. The isolated runner runs every file with eight workers and a 60-second test timeout; it is the comparable baseline/final evidence. The extra skip is the explicitly unexercised real Bun post-open error route.

### Step 0: structured status and teardown

Before production edits, `status-{node,bun}.json` reproduced 401, 403, 404, 500, 302 with both long random `CANARY-` and all-digit 32-character strings. On **both engines**, the structured field was numeric `response.statusCode`; contradictory peer reason/body status text did not change it. Each row performed a raw status-observation connection and an actual strict dial (hence two upgrades in these initial records), ending with zero open server sockets.

| Engine | Request teardown API observed | Response API observed | Start dial | Final dial |
|---|---|---|---|---|
| Node | destroy(), abort() | destroy(), resume() | all five statuses credential-unusable | 401/403 credential-unusable; others connection-failed |
| Bun | abort(); no destroy() | destroy(), resume() | all five statuses credential-unusable | 401/403 credential-unusable; others connection-failed |

Final committed `mcpl-strict-five-codes.test.ts` checks all five redirect codes and misleading status-like text. Its teardown test checks 401/403/404/500/302, one status listener, its removal, removal of open listeners, closed client/server sockets, cleared open timer, one settlement and no peer text in results. No response body is read by the strict listener. The processes exit without a live dial handle. Missing structured status is connection-failed; no text parsing fallback exists.

### Step 0: two sinks, before/after (acceptance F)

Initial **unmodified-start** `sinks-full-{node,bun}.json` has 102 observations per engine, all showing credential presence, from real authenticated MCPL connections and real failed model turns, public `notifyOps`/`notifyOpsAlert`, and 18 real strict dials followed by an error reflecting the first credential. The old sixteen-entry registry is visible in source and its behavior has a real-dial control. The initial rotation leak alone does not prove eviction caused the leak: the two original sinks did not filter even the newest credential.

The final expanded fixtures are rerun against start source and final source with the same dependency tree. `route-matrix.md` gives **route × sink × engine**, with all exercised rows labelled reproduced; `route-matrix.json` gives individual encodings. Each engine has **288 cells**: 276 expected-absence checks (including five baseline-clean webhook field-name controls), plus ten post-lifetime and two pre-flip-legacy intentional raw-presence controls. Final unexpected-presence count is zero. The absence assertion fails on start; this is not merely a passing “leak recorder.”

Short matrix (each entry applies independently to both engines and both sinks unless noted):

| Route | Start | Final | Evidence |
|---|---|---|---|
| Real failed mock-model turn | credential present | absent | reproduced |
| Public notifyOps / notifyOpsAlert | present | absent | reproduced |
| Native Error/cause, forged marker/fields, already escaped data | present | absent | reproduced |
| Credential as received data field name | present in log; not published in webhook | absent | log red-green; webhook control |
| 17 additional strict dials; first reflected in failed turn | present | absent | reproduced |
| Other framework stops same config; first owner still held | present | absent | reproduced |
| Registered non-strict; flag enabled; real strict dial | present | absent | reproduced in final expanded fixture |
| Pre-flip legacy-only credential | present | present | intentional legacy control |
| Flag false but lifetime still held | present | absent | reproduced |
| Real reconnect pending / completed | present | absent | reproduced |
| Flag off, stop, flag on; old credential reflected | present | present | intentional lifetime control |
| 32-digit credential as string and bigint | present | absent | reproduced |
| Other static callers | not exercised | not exercised | source-reading-only; UNEXERCISED |

Forms exercised: raw, percent/form encodings in either hex case, JSON, slash-escaped JSON, ASCII unicode escapes (including formatter space/equals forms), Authorization-header text, forged marker-like text. Inputs include long random, all-digit 32-character, punctuation, and a >=32-character public fixed-template fragment. Unsafe/deep/cyclic values are withheld by detached projection; getter/toJSON witnesses confirm no *additional* invocation by the sink copy (the unchanged trace preparation retains its existing serialization call). No claim covers other encodings.

### R1 case-table audit

Every listed row has a committed strict test, including controls where the start already passed; fault injection is explicitly distinguished from real runtime failures. Full names and before/after outcomes are in `per-test-outcomes.md` and the part-1 fixture-name inventory.

| Case / API entry | Evidence and result |
|---|---|
| 401/403 / WebSocketTransport.open | real loopback; unchanged credential-unusable controls |
| Other HTTP status / direct | real 404/500; red→green connection-failed |
| 301/302/303/307/308 / direct | real refusals, one upgrade/no follow; red→green connection-failed |
| DNS / direct | injected client emits DNS-like failure; red→green connection-failed; real DNS UNEXERCISED |
| Connection refused, TLS, open timeout / direct | real closed loopback port, plaintext response to TLS, real 15-second timer; red→green connection-failed |
| Constructor throw / direct | injected dependency constructor; red→green connection-failed; actual constructor fault UNEXERCISED |
| Post-open error / direct | real malformed frame on Node; Bun real route UNEXERCISED; injected branch on both passes |
| Provider wait abort, already-aborted / direct | red→green connection-failed; late provider cannot dial |
| Connecting abort / direct | real loopback connecting socket; red→green connection-failed |
| Abort/close / McplServerConnection handshake | already aborted and abort after WebSocket open retain `MCPL server "codes" was closed while connecting`; they do not expose the dial's code |
| Strict configuration refusals / direct | retained part-1 tests for mistyped flag, static token, mode, protocol, cleartext non-loopback; credential-unusable with primary configuration diagnosis |
| Pre-guard configuration errors / openTransport | committed controls for missing/malformed URL, scheme, ambiguous binding, modern family; descriptive errors unchanged, no new strict code |
| Provider throws/rejects, timeout-like rejection / direct | committed controls; provider-threw, no SDK provider-wait timeout |
| Provider missing/noncallable/null/undefined/empty / direct | committed controls; provider-empty |
| Non-string/header rejection / direct | part-1 and new controls; credential-unusable |
| 1–31 valid string / direct | explicit 31-character refusal with zero upgrades; red→green credential-unusable; fixed message omits actual value/length |
| 32 valid string / direct | real successful dial; control; legacy 31-character omitted/false/null still succeeds |
| Unsupported engine / direct | retained part-1 metadata-simulation controls; engine-unsupported; not extra real-runtime runs |

Additional discovered case: a fragment-bearing direct strict URL is refused by existing URL construction before provider/I/O, with unchanged credential-unusable. It is **not** evidence of a client constructor throw. The manager confirmed this extra admission-refusal row in the queued reply to `fragment-case-question.log`; no code change was requested.

Part-1 edits were limited to `test/mcpl-strict-credentials.test.ts`: shared canary generator increased from randomBytes(12) (31 total chars) to randomBytes(24) (55), so all users of that fixture remain valid long-credential routes; and the five redirect test instances (301/302/303/307/308) now expect connection-failed. `part1-fixture-tests.txt` lists the affected test instances. No other existing tests were edited.

### B/C: original-base compatibility and mixed set

`test/mcpl-narrow-overlay.mjs` loads original-base source for **every production file changed since the original base**, including part 1: protocol-family.ts, transport.ts, types.ts, framework.ts. No branch switch/reinstall; identical installed dependency tree. The final harness runs original and candidate processes under both pinned engines, with flag omitted/false/null.

Eight serialized sink snapshots compare byte-for-byte: traces, console, failures.log, webhook, shared tool catalogue, per-agent presentation, new-tools notices, server listing. Wire scenarios test throwing/null/empty/value providers in query/header modes, same fallback logs and requests. Only the random Sec-WebSocket-Key value is removed from wire comparison (each is asserted fresh, distinct, valid 16-byte base64); no frames precede the first response. Ephemeral loopback ports are normalized. Clocks are fixed before module load. Paired runs use the same workspace path; **no workspace-path normalization** is needed. Mixed input Error stack is fixed at creation, not removed from outputs; performance/uptime clocks are fixed too.

`final-comparison/final-legacy-hashes.json` records twelve engine/flag/snapshot hashes; `mixed-hashes.json` records two mixed snapshots. Hashes compare only within one run. Exact assertions, not hash equality alone, compare the bytes. The mixed scenario also captures connection events, health, markers, notices/listings and original application tool-result text; these remain identical. The expected transform substitutes only active strict tokens in failures/webhook. Native Error and custom-serialized data formatting stays identical apart from those substitutions; the non-strict server's unrelated token is not redacted. Removal, another retained config, same-object re-addition, final peer close and stop are exercised.

Failure-path inventory in the legacy comparison: HTTP refusal, connection refusal, provider abandonment, open timeout, missing URL, invalid URL, wrong scheme, fragment, invalid mode, header query token, header userinfo, invalid header token, malformed-userinfo constructor refusal. Text, constructor/prototype names, own keys, descriptor flags and cause presence are compared. Real legacy DNS, TLS and post-open errors are **UNEXERCISED** by this paired harness; strict TLS/post-open tests do not substitute for that claim.

`final-identity-controls` repeats 19 controls on original-base and final source under both engines: class/prototype/non-enumerable/stateful responders, streaming/whole responses through the real inference router; provider receiver/configuration shape and transport/constructor error controls; fixed event/reason; explicit no-strict trace-callback receiver. All four runs pass. These router controls have no credential flag input; the flag variants are exercised in the connection/sink/wire scenarios.

Per-commit B/C runs before each commit: `codes-legacy`, `minimum-legacy`, `sinks-owner-legacy`, and `held-lifetime-comparison` for the final amended commit, all both engines/three flags. Dirty pre-commit receipts are **not reusable clean receipts**; final clean `final-candidate-*` runs repeat end-to-end. Superseded command/fixture errors and deliberate regression reproductions are documented in `commands.md` rather than omitted.

### E: new-test accounting

Five new test files add 47 test instances: 36 five-code/control cases, five minimum cases, three labelled dependency-fault cases, two real-route wrappers, one trace receiver. Node: **26 controls + 21 red→green**. Bun: **26 controls + 20 red→green + one explicitly unexercised skip**. `per-test-outcomes.{md,json}` records each name, start/final outcome and label. New test helpers/harnesses run via those wrappers or the comparison gate, not as additional counted test cases. A field-name value not published by the webhook is correctly a control, not a security regression test.

### G: exporting-site inventory

`caller-inventory.md` inventories all 28 start-commit static calls to `logFailure`/`opsAlert`, with file:line and route labels; it is an audit aid, **not a completeness claim**. The two actual publishing sites are `framework.ts:26504` (bounded structured JSONL record, filtered before formatter/write) and `framework.ts:26640–26700` (assembled alert message and agent name, filtered before webhook JSON). Public notifyOps/notifyOpsAlert and failed-turn hard-down/log branches were exercised. Other callers, including the distinct context-refusal branch, are labelled source-reading-only/UNEXERCISED. No caller template or application payload handler was edited. `writer-inventory.md` and `writer-source-search.json` audit the full source references: one actual file append and one configured webhook builder/sender, with no alternate hard-down writer bypass. Each distinct writer route has a real production-path fixture; source-only callers are not claimed exercised.



### Final comparison hashes

Hashes are canonical paired-run receipts, not cross-run equivalence claims.

| Engine | Flag | Snapshot | SHA256 |
|---|---|---|---|
| node | undefined | sinks | `dcacce6d3ec9024d6add925150a92122dd61e7479d424b6488e61dc6c61ff3d6` |
| node | undefined | wire | `31edd92220426ce1d8c703fa6e4c99d4dd61abd4861a00c37e04593696837a88` |
| node | false | sinks | `da4e3b40f65e82e8c9a31f869a65440e439424b0d57aecfe70d5cd177fa6beed` |
| node | false | wire | `31edd92220426ce1d8c703fa6e4c99d4dd61abd4861a00c37e04593696837a88` |
| node | null | sinks | `17f87561e4498aea7776494de9284c776f51f4be3862481a96aa75634751cf6e` |
| node | null | wire | `31edd92220426ce1d8c703fa6e4c99d4dd61abd4861a00c37e04593696837a88` |
| bun | undefined | sinks | `a7fcec88aa6611fcabcd8a919681e1d705dd55d4fb0a34bdef6fedc6e1606358` |
| bun | undefined | wire | `22cdb795cfe38623ce0622259fb2e8d2e502349faa5e000ef05aa313065d382c` |
| bun | false | sinks | `e1487af5805f346bde4078ef04fb50aa507aba2630067f213173d8d393ddfa3b` |
| bun | false | wire | `22cdb795cfe38623ce0622259fb2e8d2e502349faa5e000ef05aa313065d382c` |
| bun | null | sinks | `a8d92018ef9a230072773bccb56e8128d0f7fea4ca00190f85d3e5fe5a240866` |
| bun | null | wire | `22cdb795cfe38623ce0622259fb2e8d2e502349faa5e000ef05aa313065d382c` |
| node | mixed | complete snapshot after permitted two-sink substitutions | `b467ef40ab8948078b70d859208daa2ad050515768ab896f410db590dc9ec251` |
| bun | mixed | complete snapshot after permitted two-sink substitutions | `6b1001ffe76f7e69a2762ade04dd8fb69888a0539843852f1b3ff72cc02e166c` |

`final-audit` passes at the clean final commit: allowed scope, lock bytes, exact README sentences, current-commit gate receipts, new-test outcomes, matrix expectations and unchanged Bun failing-test identities. `artifact-hashes.json` records deliverable hashes; the public start-to-final source diff SHA256 is `8480e622af4d4202223012561edbb968227586bceb15333a2ccf4f2f8c46a881`.

## Unmet Criteria / evidence limits

- The full Bun suite remains failing with the same 175 baseline failures, explicitly inventoried. It is not reported green.
- Real DNS failure and actual client-constructor throw were not generated; branch tests use labelled dependency injection. No external DNS/network was attempted. Real Bun post-open socket-error emission remains UNEXERCISED. A close without an error is not that evidence.
- The paired legacy harness does not exercise every possible failure path (real DNS/TLS/post-open are named above). Static exporting callers outside the reproduced routes remain UNEXERCISED. The report does not promote boundary unit tests or source reading into production-route coverage.
- Handshake close evidence is cancellation via the public signal before/after WebSocket open; it is not a separate close-method-invocation test.
- No open implementation decision remains; the manager acknowledged the fragment admission refusal without a code change.
- Independent review/qualification and any owner-approved rollout/push are not performed here.

## Residual Risk / parked findings

- Server-reflected credentials can still reach local console/trace/connection events, health/markers, notices/listings. The real failed-turn and mixed fixtures preserve those outputs rather than trying to hide the limitation. Earlier supplied push/router/tool-class observations were not imported as new reproduced evidence or fixed.
- Catalogue admission, diagnostic helper redaction, mechanical drift detection, provider/origin binding and other transports are parked. HTTP/stdio/modern strict refusals remain as in part 1.
- Unbounded distinct accepted credentials consume memory for each configuration lifetime; ended lifetimes intentionally no longer redact their old tokens. A host sharing a config across frameworks has independent framework lifetimes.
- A credential equal to public fixed template text causes documented template over-redaction at these two boundaries. Separate fixed fields retain identity. Other encodings are not claimed.
- Strict errors remain fresh ordinary Errors as in part 1, without native subclass/cause identity. The two sink copies do not change caller objects, application values or existing trace callback receivers.
- Exact runtime pins remain deliberate. Passing these scenarios neither certifies other runtimes nor supplies the parked drift guard.
