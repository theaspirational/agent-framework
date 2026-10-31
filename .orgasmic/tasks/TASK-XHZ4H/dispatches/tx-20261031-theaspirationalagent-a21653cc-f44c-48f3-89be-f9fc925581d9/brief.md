# Implement fix round — Dispatch Brief
```brief
D (TASK-XHZ4H): ONE focused diagnostic pair — NOT a gate retry and NOT qualification. Task operator: Tarn; conditions: Soma (programme qualifier); not decisions by the owner Vasyl. Context: full report of round 3 /srv/review-drop/TASK-XHZ4H-HASHFIX3-FULL.md (sha256 66d40f10595aaf53983637bde56ebaee376f625d285d3a054e2f83d07abdb236): head-12 at 93427f90a16bcfbcf815217f4c080669ab842a71 — 3 tune-out timeouts, the fresh matched base-12 b6e225e07a8214894c3f721dfb14ac0c1cf75714 passes them. That result stays FAILED/HELD unchanged.
DO exactly: run ONLY the three files test/tune-out-e2e.test.ts, test/tune-out-reader-epoch-shared.test.ts, test/tune-out-reader-fork-handoff.test.ts — once on head 93427f90, then once on base b6e225e0, sequentially, in the existing trees/worktrees of round 3, on the same frozen closure (manifest dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01), absolute Node 22.12.0 (sha 177208bf… — preflight exe sha+version), AF_TEST_CONCURRENCY=8 and the same node --test flags/runner as in the full cells, NODE_OPTIONS unset. Test timeouts unchanged. No install, source fixes, extra runs, retries. Bounded: 16G scope, `timeout --signal=TERM --kill-after=60s 3000s`, 64 MiB cap, PIPESTATUS, INCONCLUSIVE classes. Record: exact commands, cwd, sha256 of the consumed test files and build entry points (dist/compiled outputs actually used) for each tree, uptime/loadavg at the start/end of each of the two runs, per-leaf outcome/duration/limit. After — reconcile owned survivors (pid+start+cgroup).
Conclusions strictly: both pass → only "not reproduced in this selected subset" (not "interference proved", not "head cleared"); head fail/base pass → "narrowed the observation", not a cause; anything else — as is. In the report, separately: observations / conclusion. Then STOP (report and finish), no further diagnostics. Don't commit anything; the tree is clean before/after.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-fd05fc78-8b0c-4269-9c87-bfde069095cb, run run-01M681T4Y5G7VP7ZAQYJ8GM8HN, in your own native session and the same worktree.
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