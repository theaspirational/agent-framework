# Implement fix round — Dispatch Brief
```brief
Small LOW round on the A refresh (gen:exec). Review: /srv/review-drop/TASK-HVQ8K-REFRESH-REVIEW.md, APPROVE with 3 LOWs. Local only, no push.
1) docs/required-inbound-admission.md: add one sentence after the mayWake paragraph. Admitted work goes out with the round's results only on a stream that declares `supportsInjectedMessages: true`; otherwise it arrives at turn end.
2) Make the trailer on the test commit 1d990e41 consistent: reword that commit only (it is the tip) so it carries `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` like the other 21. Don't touch the earlier 21 commits. Put the docs sentence in its own commit with the trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`, identity Vasyl noreply.
3) Repair the PR body: produce the final PR BODY from pr-body.md (no mojibake), updated with this round's facts.
Gate: typecheck plus a full npm test on Node 22.23.3 in `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, run in the worktree at the final head (receipt cwd = the tested checkout). Report the head sha, the counts, and BEGIN/END PR BODY.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-9553e21b-603b-4981-9a07-f7de5d0e7d90, run run-01M675WMXPGMX9TBYT45M7WH6F, in your own native session and the same worktree.
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