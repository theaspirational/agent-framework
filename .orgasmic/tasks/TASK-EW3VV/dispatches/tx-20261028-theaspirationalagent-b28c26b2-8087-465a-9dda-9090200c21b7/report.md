# P2-narrow — fix round 2

This is deliberately the narrow dial/two-sink piece, **not the full credential-redaction guarantee and not permission to roll strict mode out to any client or agent**. Other diagnostic redaction (local console output, trace events, connection events, health and marker state, notices and listings), model-catalogue admission and the mechanical drift guard remain parked. A server that sends the credential back can still make it appear in local console output and traces: the documented R7 limit, not a bug fixed here.

Artifacts below are relative to this report’s current-run evidence directory. `pull-request-draft.md` is an unpublished, updated upstream description. No push, PR, tag, version/dependency change or publication occurred. This is implementation evidence, not independent review or qualification.

## Changed

Round starting HEAD: `d2b5fbf0cd15652427dd5afff13a80257ae59195` (the rejected candidate). Two focused local commits:

1. `bb518788363c139c0a94834d2fa8a95c4f908407` — retire displaced and failed MCPL credential lifetimes without retaining configurations.
2. `e95400714223477305624645dbf6f846e9f0918e` — detach strict exporting diagnostics before legacy preparation; preserve original throws.

Round diff: **two production files +103/-59, net 44**; tests/harnesses **+202/-0**; README **+12/-1**. Cumulative P2 diff from `112bc593464315a9531b6af6d00d9d2368985daa`: **three production files +246/-48, net 198**, tests **+977/-2**, README **+84/-25**. The same three-file/~300-net-production-line ceiling is respected. Transport and types are unchanged this round. `scope.json` lists every file, counts and diff hashes; `round-source.diff` and `p2-source.diff` preserve the public source diffs. No other production file changed.

### Finding 1: ownership, replacement, failed initial connections and stop

- `src/mcpl/protocol-family.ts:285–318`: an owner has a weak-key `byConfig` lookup and an enumerable set of lifetime records. Each record holds **only a WeakRef to the configuration**, plus an optional accepted-credential set. The reverse lookup is also weak-keyed and holds weak references to records. Never-strict records have no accepted set and no bookkeeping reference that strongly retains a configuration. The framework’s pre-existing public configuration map still holds its current entry; this is why the GC result is one retained object, not zero.
- `src/framework.ts:6435–6443`: registration retires a different object displaced under the same id before overwriting the map. It reuses the original id read, rather than adding observable getter invocations. Other owners’ records are not removed.
- `src/framework.ts:28260–28263`: a rejected initial `addServer` ends its lifetime. Source inspection confirmed reconnecting stubs return normally; the rejection path does not retain a retry. Existing pending/completed reconnect routes still retain history.
- `src/framework.ts:4744` calls `endCredentialLifetimes(this)`, clearing every owned record, not only objects discoverable in the public map. Removal/final-close cleanup remains in place. Accepted sets belonging to another live framework remain intact.
- README lines 390–399 document replacement, failed-initial unwind, weak bookkeeping and all-owned stop cleanup.

Committed tests: `test/mcpl-strict-lifetime-gc.{mjs,test.ts}` adapt the reviewer’s GC/probe cases into real loopback HTTP-401 and opened-WebSocket/failed-MCPL-initialize connections. Eight distinct objects replace the same id; the framework remains alive during forced collection before and after stop. Both strict and never-strict variants run on both engines. Strict accepted sets are asserted absent **immediately after each failed initial connection**, before the next replacement and before stop; they are not merely hidden by the current map lookup. This is stronger timing than waiting for replacement/stop to clear a failed object.

| Probe (each engine) | Rejected d2b5fbf0: retained before/after stop | Final: retained before/after stop | Original base, never-strict |
|---|---:|---:|---:|
| 8 HTTP-401 failures, strict false / true | 8 / 8 | 1 / 1 | 1 / 1 |
| 8 initialize failures after WS open, strict false / true | 8 / 8 | 1 / 1 | 1 / 1 |

`gc-snapshots/summary.json` contains all 16 rejected/final snapshots and strict registry-after-failure checks. `gc-{node,bun}-{false,true}-{base,final}.json` compare never-strict objects to original base. Entire result objects match, including configuration-id getter counts: **189** for eight upgrade failures and **197** for eight handshake failures, on both engines. An intermediate M1 implementation added 16 getter reads; `r2-m1-getter-before.log` preserves that failed comparison. It was corrected before amending the unpublished M1 commit; it is not concealed as a baseline failure.

### Finding 2: project first, preserve legacy preparation and exceptions

- `src/framework.ts:26655–26714`: obtain the same framework-global union, then build safe exporting message/data copies from the raw values **before** legacy coercion/serialization. The original preparation still determines ordinary trace data. On success the order remains failure record, trace, webhook. On an escaping preparation exception, strict-active sets attempt the projected failure record and webhook, then rethrow **the same original exception object** in `finally`; no trace that the old preparation failed to produce is invented. Missing/throttled webhooks do not swallow that exception. Never-strict preparation still throws before either export, as in original base.
- `src/mcpl/protocol-family.ts:330–409`: the existing single choke point uses descriptors, withholds affected accessor/custom-hook objects with fixed code-owned `[withheld]`, and never invokes those hooks. Error-subclass hooks are detected too. Native Error projections retain existing formatting. Sparse arrays retain holes/length; repeated acyclic plain-object references are copied normally rather than mistaken for cycles. Actual cycles/deep/unsafe values remain withheld.
- `src/framework.ts:26490–26519`: the existing detached Error formatter and failures.log choke point remain the two-sink mechanism. No caller Error/config/responder/event is replaced; no application data is rewritten.

The manager explicitly authorized a **second named intentional difference in only the two exporting sinks**, besides union credential redaction: accessor/hook objects are withheld in strict-active sets, including a non-strict server’s failure in a mixed set. This is documented in README lines 408–417 and the PR draft. It is not presented as ordinary-data byte identity. Answers are preserved in `medium2-decision.log` and `queued-message-request.log`. The original thrown exception must not be swallowed; that requirement is implemented.

Committed tests: `test/mcpl-strict-accessors.{mjs,test.ts}` use a successful strict connection and a real non-strict `tools/call` failure. The application error text is delivered unchanged. The host then attaches diagnostic accessors/hooks carrying the received text through public `notifyOpsAlert`; functions are **not** claimed to travel over the JSON wire. Four cases run with and without a strict lifetime, both engines:

| Case | Never-strict behavior (equals original base) | Strict-active exporting behavior |
|---|---|---|
| Throwing top-level details accessor | One getter call; same TypeError escapes; no record, webhook or trace | One getter call; projected record and webhook; fixed marker for data; same TypeError escapes; no invented trace |
| Throwing Error.message accessor | Existing `failureDescription` catches it internally; one getter call; existing description/trace; no escaping exception | One getter call, same trace/internal handling; exported reason is fixed marker |
| Raw toString; nested toJSON, throwing toJSON/toString; inherited Error-subclass toJSON | Original hook counts and bytes | Affected exporting values withheld; no additional hook calls; original trace bytes |
| Native Errors, plain nested data, sparse arrays and repeated shared plain objects | Original formatting | Identical formatting apart from credential substitution; no blanket withholding |

The Error.message exception was already caught by legacy `failureDescription`; the test does **not** manufacture a rethrow that never existed. `accessor-compare.sh` compares 32 original-base/final snapshots, including exact exception identity, hook counts and trace values, permitting only the two named exporting differences. `accessor-comparison/hashes.json` records snapshot hashes.

### Shared-code hunks / scope audit

The weak lifetime declarations/import and cleanup calls are outside a lexical strict branch so runtime enabling on a held legacy object still works. They add no accepted set, listener, caller wrapper or strong configuration reference for never-strict use. Registration preserves getter count and existing order. The ops preparation is now inside try/catch/finally on shared code, but safe projection is conditional on an existing strict registry; the no-strict catch rethrows unchanged and the finalizer is inert without a captured preparation failure. Original-base controls exercise these changes. No local diagnostic formatter, transport wiring, application payload handler or unrelated subsystem changed this round.

Both exporting sites remain framework-global: `strictSinkRegistries(this.mcplServerConfigs.values(), this)` selects accepted sets owned by that framework’s current live configuration lifetimes. Rotation adds to those sets; replacement/removal/final close/failed initial connect/stop end the appropriate lifetime; other owners and pending reconnects retain theirs. No other sink consults this union.

## Verification Gates

All assigned commands ran through `orgasmic dispatch gate`. Final passes are recorded at clean commit `e95400714223477305624645dbf6f846e9f0918e`, not reused from earlier dirty checkpoints. `gate-inventory.json` identifies exact immutable receipt logs and their SHA256; short names below also have `<name>.log` transcripts.

### Environment and inherited evidence

Current environment rechecked in `r2-environment.log`: Node **v22.23.3**, npm **10.9.9**, Bun **1.4.3**, Bun binary SHA256 `7ce7d6b654eddeec20afddf2396317fba6dc19ab52788a27e894e1806bf8f24b`. Preserved installed-lock SHA256 `0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`. No reinstall or dependency drift; lock bytes copied to this evidence directory. Every npm invocation keeps both update-notifier variables disabled. Only synthetic data, local files and loopback are used; no external provider/model call or real credential.

Inherited context is the prior implementation evidence in run `run-01M5ZV61MEYAMQEGWE3N8CTWYV`: original start/ancestor check, ten-file part-1 diff, public dependency-install audit and unchanged lock resolution; Step-0 start-commit status/two-sink reproduction; original full-suite inventories and previously named unexercised routes. Those inputs and untouched transport source remain applicable as history, **not new pass receipts for this round**. Its broad lifecycle/custom-serialization claims are superseded by the two findings and this report. Earlier rejected-candidate B/C checks missed the GC and exceptional-data cases now added. Previous full Node count was 7992/7947 pass/45 skip; this round adds 12 tests. Previous isolated full Bun had 175 baseline failures; that full Bun inventory is context only, not a current full-Bun pass.

Reviewer inputs were inspected, not treated as proof. `review-inputs/` preserves the four scripts and SHA256 inventory; the new tests reproduce their relevant cases. The M2 fixture deliberately uses a successful strict connection: after M1, a failed initial connection no longer leaves a live strict lifetime.

### Exact commands and results

Every row below is prefixed with `orgasmic dispatch gate <gate> --`. The five existing strict files plus the two new regression files run in the focused glob.

| Gate / transcript | Exact command after `--` | Result |
|---|---|---|
| `r2-final-build` / `r2-final-build.log` | `env NO_UPDATE_NOTIFIER=1 npm_config_update_notifier=false npm run build` | PASS |
| `r2-final-typecheck` / `r2-final-typecheck.log` | `node_modules/.bin/tsc --noEmit` | PASS |
| `r2-final-node-suite` / `r2-final-node-suite.log` | `env NO_UPDATE_NOTIFIER=1 npm_config_update_notifier=false npm test` | 8004 tests: 7959 pass, 45 skip, 0 fail |
| `r2-final-strict-node` / `r2-final-strict-node.log` | `node --import tsx --test test/mcpl-strict-*.test.ts` | 126 pass, 0 fail |
| `r2-final-strict-bun` / `r2-final-strict-bun.log` | `bun-1.4.3 test --timeout 60000 test/mcpl-strict-*.test.ts` | 125 pass, 1 known skip, 0 fail |
| `r2-final-identity` / `r2-final-identity.log` | `bash "$ORGASMIC_EVIDENCE_DIR/identity.sh"` | 19 controls × base/final × two engines; all pass |
| `r2-final-gc-comparison` / `r2-final-gc-comparison.log` | `bash "$ORGASMIC_EVIDENCE_DIR/gc-compare.sh"` | Four original-base/final never-strict pairs equal |
| `r2-final-accessor-comparison` / `r2-final-accessor-comparison.log` | `bash "$ORGASMIC_EVIDENCE_DIR/accessor-compare.sh"` | 32 snapshots; original bytes/throw identity, only named strict exporting differences |
| `r2-final-gc-snapshots` / `r2-final-gc-snapshots.log` | `python3 "$ORGASMIC_EVIDENCE_DIR/gc-snapshots.py"` | 16 rejected/final runs; 8→1 retained, strict failed lifetimes end immediately |
| `r2-final-comparison` / `r2-final-comparison.log` | `env P2_EVIDENCE="$ORGASMIC_EVIDENCE_DIR/final-comparison" bash test/mcpl-narrow-verify.sh` | PASS both engines: omitted/false/null and mixed-set comparison |
| `r2-final-matrix-node` / `r2-final-matrix-node.log` | `env PROBE_OUTPUT="$ORGASMIC_EVIDENCE_DIR/matrix-node.json" node --import tsx test/mcpl-strict-sinks.mjs` | 288 cells: 276 absence assertions + 12 intentional raw controls; 0 mismatches |
| `r2-final-matrix-bun` / `r2-final-matrix-bun.log` | `env PROBE_OUTPUT="$ORGASMIC_EVIDENCE_DIR/matrix-bun.json" bun-1.4.3 test/mcpl-strict-sinks.mjs` | 288 cells: 276 absence assertions + 12 intentional raw controls; 0 mismatches |

The short transcript and immutable receipt-log hashes are indexed in `gate-inventory.json`. `r2-final-artifact-audit` additionally validates clean HEAD, these receipts, matrix expectations, the scope/line ceiling, the lock digest and the verbatim README sentences.


### Red-then-green accounting

`r2-rejected-new-tests-{node,bun}` load all four changed-since-original production sources from **d2b5fbf0** via the committed overlay; dependencies and current tests stay identical. Each engine: **12 tests, 7 fail, 5 pass**. Four failed-connection lifetime/GC tests and three strict-active exceptional-diagnostic tests fail on d2. The five controls (four no-strict accessor/plain cases and strict-active plain-data case) pass there. Final focused runs: all 12 pass on each engine. These are assertion failures for retained objects/missing or unsafe exporting projections, not “leak observed” tests counted as security passes. For this fix round the required red baseline is d2, not a newly reconstructed failure on the original start commit.

Before committing M1, `r2-m1-final-controls` and `r2-m1-final-comparison` passed both-engine legacy/GC/identity/reconnect/independent-owner checks at its exact source contents. Before committing M2, `r2-m2-restored-controls` and `r2-m2-restored-comparison` passed after restoring the separately staged change. Dirty receipts describe precommit source checks, not clean-final receipts. The final gates repeat them end to end.

### Original-base comparisons, normalization and matrix

`test/mcpl-narrow-overlay.mjs` loads original `4976c67d5c7916a15046c627b68913994c33b3cb` versions of **framework.ts, protocol-family.ts, transport.ts and types.ts**, covering every production source changed since that base. It uses the same installed tree, without reinstalling or switching branches. Omitted/false/null flags run on Node and Bun. The harness checks serialized console, traces, failures.log, webhook, shared catalogue, per-agent presentation, notices and listing; header/query wire bytes, provider fallback and exercised failure identities/shapes are compared. Identity controls include class/non-enumerable responders, `this` state, streaming/whole routing and the trace callback receiver.

Fixed clock, fixed uptime/performance counters and explicit ephemeral-port/workspace-path normalization are retained. Wire comparisons additionally replace only the random Sec-WebSocket-Key and assert every key is fresh 16-byte base64 with zero frames before the first response. Hashes are comparable only within their paired run. No field from ordinary traces/console is normalized for the fix. Mixed comparisons now explicitly permit the fixed marker for the known custom toJSON detail, asserting its original structure first; every other field still compares. The separate accessor comparison includes the mixed top-level getter case and exact legacy exception identity.

`matrix-{node,bun}.json`: each is the existing **288-cell** real-route matrix, not 288 new tests. It exercises raw/encoded reflection into both sinks via a failed turn/local mock and public diagnostic forwarding, long random and all-digit credentials, bigint diagnostic projection, 18-dial rotation, fixed/forged markers, application-data control, removal/final close/stop, flag flips, pending/completed automatic reconnect and independent owners. Expected absence cells and intentional post-lifetime/pre-flip raw controls are counted in the final gate table. New accessor cases are reported separately rather than silently expanding the 288-cell claim. This is a route inventory, not a completeness claim.

## Unmet Criteria

No narrowed-round implementation decision remains open. All assigned narrowed-round gates passed as recorded above. Independent review/qualification and any owner-approved push or rollout are not performed here.

Inherited coverage limits remain: real external DNS failure and actual client-constructor failure are not generated (labelled injected branch tests instead); real Bun post-open socket-error emission is still UNEXERCISED and skipped. The compatibility fixture does not exercise every existing failure route. Handshake cancellation evidence is through the public signal, not a separate close-method test. Static exporting callers outside reproduced routes remain UNEXERCISED. The full Bun suite is **not rerun in this narrowed round**; the requested five strict files (plus the two new files), identity/comparison probes and matrix are rerun on Bun. Its previously inventoried 175 full-suite failures must not be described as fixed or current-suite green.

## Residual Risk

The two named strict-active exporting differences are credential union redaction and fixed-marker withholding of accessor/hook objects, including non-strict failures in mixed sets. Local output and ordinary traces remain unchanged and may expose reflected credentials. Legacy preparation can still invoke its pre-existing hooks; the projection does not add hook calls. The original escaping exception is intentionally preserved after exporting attempts. Delivery remains best-effort and existing cooldown/skip rules remain; this is not a webhook delivery guarantee.

Distinct strict credentials remain unbounded during each configuration lifetime, so rotation consumes memory until that lifetime ends. Ended lifetimes intentionally stop redacting old credentials; live independent owners retain theirs. Strong retention of the current public config-map entry remains exactly as original base, including after stop. Only the enumerated encodings and exercised routes are claimed. Catalogue admission, other diagnostic sinks, drift guard and other parked work remain out of scope. No class is described as closed.
