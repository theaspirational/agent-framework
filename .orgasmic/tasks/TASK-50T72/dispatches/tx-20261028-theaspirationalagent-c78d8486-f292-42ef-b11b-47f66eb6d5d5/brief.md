# Implement fix round — Dispatch Brief
````brief
FIX ROUND 2, TASK-50T72. THIS LEDGER IS PUBLIC (no private paths/records in commits or report body). Same author/committer rule as before; no push.

The independent review REJECTED b4089505605b01bd8f86e6b506245f3febe31250 with one HIGH (verbatim below). Everything else (engine capability gate, booleans, packaging, harness removal, redactor cache, double/hanging stop) was found OK; do not churn it.

Required:
1. Fix the in-flight handshake retirement: while shutdown owns lifetimes, a failed/aborted connect (addServer catch at src/framework.ts ~30289, reached via stopOwned ~5019) must not retire the credential or remove the config from what the sinks consult; retirement happens only at the shutdown-finally boundary. Audit EVERY retirement and config-map removal path (connect failure, close callback, removeServer, closed-tab, stopOwned) for the same early-retire-during-shutdown pattern and list each with file:line and the decision. Outside shutdown, a failed connect must keep its current behaviour (no indefinite retention).
2. Commit the reviewer's real in-flight-handshake regression to the suite (adapted into test/fixtures like mcpl-strict-shutdown.mjs): real WebSocket server that receives initialize and withholds the reply; stop() called (twice, same promise); module teardown publishes an alert containing the credential; both sinks must be redacted. Cover successful and rejected module shutdown. Record red on b4089505 and green after.
3. Production limit for this round: +60 net lines over b4089505, same four production files; otherwise STOP and ask.
4. Gates fresh via orgasmic dispatch gate at the final commit: build, typecheck, full npm test on Node 22.12.0 and 22.23.3 (isolated layout as before), strict on bun-1.4.3 and Bun 1.4.0, the new regression, the base comparison (committed mode). Report per gate.

=== Review (verbatim) ===
# Verdict

**REJECT — HIGH security / unmet teardown criterion.** Reviewed `b4089505605b01bd8f86e6b506245f3febe31250` against `cb57dfa611bb02232a55f07020966d141df1bcf2`. No tracked files changed; no commit or push.

# Findings

## HIGH — security: an in-flight strict handshake retires its credential during shutdown

**`src/framework.ts:30289`**, reached from `stopOwned()` at **5019**, bypasses the new shutdown-finally retention at **4875–4879**. Stop aborts an in-flight legacy connection; `addServer()` rejects and its catch unconditionally calls `endCredentialLifetime(config, this)`. Later module teardown can still publish that accepted credential. Both protected sinks then export it unredacted.

**Reproducer:** the review artifact `inflight-stop.mjs` adapts the committed real shutdown fixture, not a mocked stop. Create the real framework with its module but no initial server; call `connectMcplServer(config)` against a real WebSocket server that receives `initialize` but deliberately withholds its reply. Wait until that request has arrived and the strict registry contains the credential. Call `stop()` twice, asserting the same promise. The module waits for the socket to close, then calls `notifyOpsAlert()` with the synthetic credential. The original two-sink assertion fails with:

```
{ failuresLogLeaks: true, webhookLeaks: true }
```

Command: `node "$ORGASMIC_EVIDENCE_DIR/inflight-stop.mjs" success` (also reproduced using Node 22.12.0). Confirmed-handshake receipt: `gate-reviewer-inflight-confirmed-01M60WZKKDZZX90SYR5YWHMAKZ.log`, exit 1. This is an existing edge left unfixed by this round, not a newly introduced leak; it violates the explicit shutdown-retention acceptance criterion and new README guarantee.

**Fix direction:** defer retirement from failed/aborted connects while shutdown owns their lifetime. Audit every retirement and configuration-map removal path, not only the connection close callback. Keep shutdown credentials available to sink collection until the shutdown-finally boundary; simply suppressing retirement is insufficient if another path removes the config from the map consulted by the sinks. Add this real in-flight-handshake regression for successful and rejected module shutdown.

# Verification Gates

The execution context explicitly requires reading reusable clean-tree receipts rather than rerunning eligible gates. Consequently **build, typecheck, full npm test and Bun strict tests were not freshly rerun**. Inspected reusable logs at the reviewed commit:

| Gate / command | Result | Log basename |
|---|---|---|
| build: `npm run build` | pass | `gate-build-01M60VKMB1JWEE44C0M34F2GY2.log` |
| typecheck: `npm run typecheck` | pass | `gate-typecheck-01M60VKMP1N0585CDE7YK0197X.log` |
| isolated-test-node2212: `AF_TEST_CONCURRENCY=4 npm test`, isolated candidate layout, Node 22.12.0 | 8,880 pass, 63 skip, 0 fail | `gate-isolated-test-node2212-01M60VYHVH36K4KXDY9D920YEX.log` |
| strict-bun143: `bun-1.4.3 test --timeout 60000 ./dist/test/mcpl-strict*.test.js` | 138 pass, 1 skip, 0 fail | `gate-strict-bun143-01M60VN0EKWQ877P9AZFSY4HMP.log` |
| compiled-floor-away-cwd: Node 22.12.0 `--test --test-force-exit` on compiled strict tests from another directory | 139 pass | `gate-compiled-floor-away-cwd-01M60VYC206D74GFBTWWYAB2J5.log` |
| base-comparison: supplied comparison harness, committed mode | pass | `gate-base-comparison-01M60VNQMNRSYMA72C7T7YJXYZ.log` |

These log basenames refer to the supplied reviewed evidence. The supplied engine-checksum record reports the official Node 22.12.0 tarball SHA256 verified; I reused its installed engine for the fresh failing probe, not a newly downloaded engine.

Fresh scoped gates, all through `orgasmic dispatch gate`:

- `reviewer-double-stop`: real fixture with concurrent double-stop identity assertion, success and rejection — pass. Log `gate-reviewer-double-stop-01M60WXWVSHX23RS8F9GYEAG1D.log`.
- `reviewer-same-size`: `node "$ORGASMIC_EVIDENCE_DIR/same-size.mjs"` — pass. Replacement config and same-object re-registration both replace one one-token registry with another one-token registry; new token redacts and retired token is released. Log `gate-reviewer-same-size-01M60WYGAPE5SEVTB93Y2WVS9D.log`.
- `reviewer-hanging-stop`: real module waits indefinitely, explicit 100ms shutdown budget, concurrent double stop — rejection settles, registry retires, then probe releases module and retries cleanup successfully. Log `gate-reviewer-hanging-stop-01M60WZ760GS8TY0N6NSBB7R2S.log`. First probe attempt was interrupted because its own finally retried shutdown without releasing the module; corrected probe passed. No production conclusion relies on that interrupted attempt.
- `reviewer-inflight-stop`, `reviewer-inflight-floor`, and the stronger `reviewer-inflight-confirmed` — fail with the finding above; last probe requires receipt of the actual initialize request before stopping.

# Unmet Criteria / Test Gaps

- Criterion 2 remains unmet: committed shutdown tests cover already-established connections, not accepted credentials in an in-flight handshake aborted by stop. The committed fixture does exercise real `AgentFramework.stop()`, real module teardown and parallel socket closure; the supplied red baseline log shows both success/failure cases failing before the fix.
- Criteria 1, 3–7: no additional actionable regression found in the four production-file diff (+21 net lines). Numeric finite status alone classifies refused upgrades: 401/403 credential-unusable, other numeric connection-failed, missing/non-numeric engine-unsupported. Generic socket errors remain connection-failed. No strict branch retries with a static token. The version allowlist is gone; docs/types/changelog describe the capability and comparison evidence rather than exact-version support.
- Boolean validation includes credentialRequired and names it; direct transport checks reject string/number/object settings before provider/I/O.
- Compiled fixture resolution uses import-relative URLs; node:module.register, rather than registerHooks, is exercised at the engine floor. Injected client construction count proves substitution. Removed harnesses are comparison tooling; remaining tests cover five codes, minimum length, both sinks, mixed unions, GC/lifetimes and accessor withholding. Removed inference-router tests do not test this production change.
- Cache safety relies on its internal accepted sets being append-only. Inspected production mutations only add tokens; retirement/re-registration creates distinct sets and invalidates the owner cache. No production same-size in-place token replacement found. Arbitrary external mutation of the exported ReadonlySet views is not covered by that contract.

# Residual Risk

Default shutdown deliberately has no deadline. A genuinely never-settling shutdown retains credentials indefinitely; an explicit timeout bounds the tested module-hang path. This review does not claim unconditional bounded retention for every framework subsystem. Timed-out cleanup may continue after stop rejects. Bun retains its existing malformed-frame test skip. No exhaustive audit of unrelated framework behavior was performed. Supplied conventions/gotchas were absent; project baseline was read.

# Fix Directions

Address the HIGH finding and extend the real shutdown fixture to cover an accepted but uncompleted handshake before reconsidering approval. Preserve append-only registry/cache semantics and existing fail-closed classification. No changes were made by this review.

````

## Round context
Resume round contract: 2. Continues dispatch tx-20261028-theaspirationalagent-374f8777-a4a3-4b2e-ac2e-827986b94cb7, run run-01M60TS5H3887GENF409WAYPXZ, in your own native session and the same worktree.
Changed this round: the brief above narrows the assignment; use this run's evidence directory and report, not the earlier round's destination.
Original instructions are history, not missing context. Original scope, security and read-only-ledger boundaries still apply, narrowed by this brief. Do not replay startup reads unless changed facts or this brief require them. Do not merge or close the dispatch.

## Evidence and verification
Earlier reads/code/reports remain context, not new proof. Identify valid inherited evidence and its unchanged inputs/scope in this round's report. No earlier gate pass is implied by resuming. Verify findings against current source. Run assigned checks and scoped probes through `orgasmic dispatch gate <name> -- <cmd> [args...]`; missing receipts do not assign a full suite. Keep builds outside evidence.

## Completion for this round
Report Changed, Verification Gates (commands/results/logs and inherited evidence), Unmet Criteria, and Residual Risk in `$ORGASMIC_EVIDENCE_DIR/report.md`. If unset, substitute a scratch path outside the worktree below.
For done, satisfy the narrowed brief and make a local commit in this worktree; stage explicit paths and do not bypass hooks. Then run:
`orgasmic dispatch finalize --status done --summary-file "$ORGASMIC_EVIDENCE_DIR/report.md"`
If blocked, report the exact unmet criteria and run:
`orgasmic dispatch finalize --status blocked --reason "<why>" --summary-file "$ORGASMIC_EVIDENCE_DIR/report.md"`
Blocking decision: `orgasmic dispatch ask "<question>"`; keep it alive for the stdout answer. A timeout is not permission. With `--no-wait`, answers/messages arrive at turn boundaries, not between tool calls. If finalize refuses for pending messages, handle their full text and retry. Successful finalize is terminal; no work follows it. Never disclose credentials or the run token.