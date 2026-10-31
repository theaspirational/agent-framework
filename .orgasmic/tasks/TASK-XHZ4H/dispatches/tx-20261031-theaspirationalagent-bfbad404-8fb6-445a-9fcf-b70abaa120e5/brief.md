# Implement fix round — Dispatch Brief
```brief
TASK-XHZ4H, ONE diagnostic four-file pair (approved by programme qualifier Soma; task operator Tarn; not owner decisions). NO code/commits/installs/fixes/retries. Report, then stop.
Trees: head 93427f90a16bcfbcf815217f4c080669ab842a71 (current worktree), base b6e225e07a8214894c3f721dfb14ac0c1cf75714 (the same separate base tree you used in r3/diag-1; verify HEAD and a clean porcelain for both before starting).
Files, in exactly this order: test/context-only-delivery.test.ts (it starts the changed fixture test/fixtures/context-only-fork-seed-child.mjs), test/tune-out-e2e.test.ts, test/tune-out-reader-epoch-shared.test.ts, test/tune-out-reader-fork-handoff.test.ts — the compiled equivalents exactly as the full suite runs them.
Bindings: Node 22.12.0 absolute path with sha256 177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9 (preflight version+sha before npm/node), the frozen closure CM 0.24.2 manifest dabd7705…/lock df14aa0a… unchanged (verify before and after), AF_TEST_CONCURRENCY=8 (--test-concurrency=8), the SAME test flags as the full suite (force-exit/import/--test-timeout as in the full head-12 cell; NOT the diagnostic 600000), in-test budgets unchanged, NODE_OPTIONS unset.
Order: head first, then base, sequential, each once. Each cell: orgasmic dispatch gate NAME -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 timeout --signal=TERM --kill-after=60s 900s …, 64 MiB log cap, PIPESTATUS of producer/capture separately; 124/137/141/cap → INCONCLUSIVE. Check free disk before (reserve 20 GiB).
Record: exact commands/argv, start/end UTC, loadavg at the start and end of each cell, per-leaf outcome+duration+limit for all 4 files (not ok names, timeouts), identities (pid+start ticks+scope) and reconcile owned survivors after each cell (save logs, TERM, grace, KILL only exact owned identities, verify).
Conclusion boundary: this tests REPRODUCTION at this scale, not the cause. No outcome clears the failed full head-12 or qualifies D. Report the observation separately from any interpretation; give the head/base table.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-a21653cc-f44c-48f3-89be-f9fc925581d9, run run-01M6838A7CBXAWYC4MNMCZRKXB, in your own native session and the same worktree.
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
Blocking decision: `orgasmic dispatch ask "<question>"`; keep it alive for the stdout answer. A timeout is not permission. With `--no-wait`, Codex app-server accepts answers/messages mid-turn; other multi-turn harnesses receive them at turn boundaries or finalize. If finalize refuses for pending messages, handle their full text and retry. Successful finalize is terminal; no work follows it. Never disclose credentials or the run token.