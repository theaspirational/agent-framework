# Implement fix round — Dispatch Brief
```brief
Owner button af:main:rebase. Rebase both local branches onto the latest upstream main of anima-research/agent-framework (fetch upstream; at my check it was 4a45766f019fa11c8699645bd6806ebf3e13e5d1, 8 commits past 0f11975e; use whatever upstream/main is when you start and record it).
- feat/typing-budget-recipient (5560cdd94d89821e0511b7b24aecfaa845432217) -> new local branch feat/typing-budget-recipient-r (keep the old ref).
- recipient-on-main (f48546e353165aa1842972a7594e0355d3997754) -> recipient-on-main-r (keep the old ref).
Keep commit structure and messages; resolve conflicts minimally and list each with file and reason. Keep layer-3 line multisets identical between the two new heads; report the diff of each new head vs its old head beyond the upstream delta (expected: conflict resolutions only). Check whether any of the 8 new upstream commits touch #233/#361/recipient areas and say so.
Gates on both new heads: bun-1.4.3 install, typecheck, clean build+pretest, full npm test with AF_TEST_CONCURRENCY=8 (Node 22.23.3), plus the 34 recipient rows. Zero failures. Local only, no push. Trailers/authors unchanged (publication rewrite comes later).
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-caf1f64e-b8c8-4385-bf1f-db593e62fbfe, run run-01M63HTMPTP6T8R8MFH32TQNT4, in your own native session and the same worktree.
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