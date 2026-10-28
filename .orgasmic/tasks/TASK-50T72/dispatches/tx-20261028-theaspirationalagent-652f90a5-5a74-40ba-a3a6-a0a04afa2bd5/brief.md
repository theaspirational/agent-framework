Your worktree is this work chain's shared tree, checked out detached at 0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e — the commit you review. Leave it exactly as you found it: no commits, no edits, no new files (ignored build output is fine). The next round of the chain runs here, and the daemon records anything you leave behind when your dispatch is closed.

Reviewed implementer evidence ($ORGASMIC_REVIEWED_EVIDENCE_DIR): /home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence

Re-review 2, theaspirational.agent-framework TASK-50T72. THIS LEDGER IS PUBLIC: no private paths, approval records or secrets in the report body.

Subject: 0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e (fix round 2) on top of b4089505605b01bd8f86e6b506245f3febe31250. Review 1 (verbatim below) rejected b4089505 with one HIGH: an in-flight strict handshake aborted by stop() retired its credential before module-teardown publications. Review 1 found the rest of b4089505 acceptable; focus on round 2 but flag any regression it introduces.

Round 2 claims: a shutdown snapshot of configs captured before abort, consulted by both sinks during shutdown, released at shutdown-finally; a central retirement helper that defers during shutdown (failed connect, displacement, removeServer, final close); config registration refused after stop begins; a new real-WebSocket regression (test/fixtures/mcpl-strict-inflight-stop.mjs) with success/rejected module shutdown, double-stop identity, disconnect-vs-stop races, and an outside-stop control; production +12 net in src/framework.ts only.

Check:
1. Your review-1 reproducer (inflight-stop) now passes; the committed regression really exercises the same path and was red on b4089505.
2. Every retirement and config-removal path listed in the worker's audit: is there any remaining path that retires or makes a credential invisible to the sinks before shutdown-finally? Particularly modern-connection teardown, closed-tab paths, restart, and anything triggered by the explicit shutdown timeout.
3. The new refusal of config registration after stop begins: could it break legitimate behaviour (a reconnect or restart racing stop; reuse of the framework after stop if upstream supports it)? Is the refusal error shape consistent with upstream conventions?
4. Outside shutdown, failed connects still retire immediately (no indefinite retention); snapshot always released on success and rejection; double stop does not replace the snapshot.
5. Changelog wording matches code.

Gates: if your execution context allows, rerun fresh at 0fdee5bc: npm run build, typecheck, npm test on available Node, strict tests on bun-1.4.3, and the in-flight regression; if it forbids reruns, say so explicitly and run at least the in-flight regression and your own probes for items 2-4 via orgasmic dispatch gate.

Verdict approve/reject with HIGH/MEDIUM/LOW, file:line, reproducer. Do not change or push the branch.

=== Review 1 (verbatim) ===
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

## Gates already passed at this commit

orgasmic recorded these gate runs in the implementer's worktree, each on a clean tree it left clean, at 0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e — the commit your worktree is cut at — or at an ancestor of it whose gate inputs are identical to this commit's: the two trees differ only in paths this project marks as not gate inputs. Read the log instead of running the gate again. Run scoped probes and required gates that lack a reusable receipt. The manager names required gates; project policy also applies. Missing receipts do not assign a full suite.

- `base-comparison` — exit 0 — `env COMPARE_ROOT=/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-50t72 COMPARE_HARNESS=/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/comparison COMPARE_WORK=/tmp/credential-round2-comparison P2_EVIDENCE=/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/comparison bash /home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/comparison/mcpl-narrow-verify.sh committed` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-base-comparison-01M60XKRJSFQYKF06S072YK7BA.log`
- `build` — exit 0 — `npm run build` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-build-01M60XGQM0NY3J1XP27WWMEPM4.log`
- `inflight-floor` — exit 0 — `/tmp/credential-engines/node-v22.12.0-linux-x64/bin/node --test dist/test/mcpl-strict-inflight-stop.test.js` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-inflight-floor-01M60XMT072TK0AXZB3QASFDZQ.log`
- `inflight-regression` — exit 0 — `node --test dist/test/mcpl-strict-inflight-stop.test.js dist/test/mcpl-strict-shutdown.test.js dist/test/mcpl-strict-lifetime-gc.test.js` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-inflight-regression-01M60XGS576S87TEWJTKVVEGJB.log`
- `isolated-builds` — exit 0 — `bash /home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/prepare-round2-layouts.sh` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-isolated-builds-01M60XJ7P5JFT0254B23PBFFW9.log`
- `strict-bun140` — exit 0 — `bash -c /tmp/credential-engines/bun-linux-x64/bun test --timeout 60000 ./dist/test/mcpl-strict*.test.js` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-strict-bun140-01M60XK08Y1YFS8DMXHQRS5VT9.log`
- `strict-bun143` — exit 0 — `bash -c bun-1.4.3 test --timeout 60000 ./dist/test/mcpl-strict*.test.js` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-strict-bun143-01M60XJ8VMZPJX4YPWW5ACDV1G.log`
- `test-node2212` — exit 0 — `env PATH=/tmp/credential-engines/node-v22.12.0-linux-x64/bin:/opt/node-v22.23.3-linux-x64/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex-path:/opt/node/bin:/home/orgasmic/.cargo/bin:/home/orgasmic/.local/bin:/home/orgasmic/.orgasmic/codex-home/tmp/arg0-linux/codex-arg0Wrdd1c:/opt/node-v22.23.3-linux-x64/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex-path:/home/orgasmic/.orgasmic/bin:/opt/node/bin:/home/orgasmic/.cargo/bin:/home/orgasmic/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin AF_TEST_CONCURRENCY=4 bash -c cd "$1"; node --version; npm test bash dist/round2-node2212` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-test-node2212-01M60XKDHKASC19QQWC1KS0E2D.log`
- `test-node2223` — exit 0 — `env PATH=/opt/node-v22.23.3-linux-x64/bin:/opt/node-v22.23.3-linux-x64/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex-path:/opt/node/bin:/home/orgasmic/.cargo/bin:/home/orgasmic/.local/bin:/home/orgasmic/.orgasmic/codex-home/tmp/arg0-linux/codex-arg0Wrdd1c:/opt/node-v22.23.3-linux-x64/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex-path:/home/orgasmic/.orgasmic/bin:/opt/node/bin:/home/orgasmic/.cargo/bin:/home/orgasmic/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin AF_TEST_CONCURRENCY=4 bash -c cd "$1"; node --version; npm test bash dist/round2-node2223` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-test-node2223-01M60XKENYAZHXJEPY9YJDHVKW.log`
- `typecheck` — exit 0 — `npm run typecheck` (cwd `.`) — at `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e` — log `/home/orgasmic/.orgasmic/runs/run-01M60X331MPNJ13H8GNP6M5832/evidence/gate-typecheck-01M60XGRR6R3F41D8EA0AADQ0Q.log`
