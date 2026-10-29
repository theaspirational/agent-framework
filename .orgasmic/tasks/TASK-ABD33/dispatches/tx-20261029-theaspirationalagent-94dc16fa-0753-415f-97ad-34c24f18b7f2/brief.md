# Implement fix round — Dispatch Brief
```brief
TASK-ABD33 fix round 1, doc only (no code). Read /srv/review-drop/TASK-ABD33-REVIEW1.md in full and apply its fix directions to docs/design/GENERIC-RECIPIENT-ROUTING.md on the task branch (currently b9e770a1e2f45a9ef2e717ced3715e58e9ba2bfd):
1. Red-case witness set (doc:208): add R:src/mcpl/server-connection.ts:1320,1407-1410; correct channel-registry 971 -> 973 and add 1189.
2. Scanned module set (doc:206): include src/mcpl/push-handler.ts, src/mcpl/inference-router.ts and src/admission/admit.ts, or restate the closure as all runtime modules on these paths, new or existing.
3. Add inventory rows (keep generically) and neutral witness rows for: coordinator/agent-tool locus suppression on a frozen turn (R:src/framework.ts:36775) and locus/channel-open announcements routed to the frozen reply destination (R:src/framework.ts:37036,37046); add both to slice B's exit condition. Also add witnesses for the pending-request dedupe key (R:...:19523) and request equality (R:...:6375-6376).
4. T:10 -> T:9 at doc:132.
5. Move O2 to the maintainer table (or restate it as a decision taken from T's own text).
6. Re-size slices A and B one tier up, or split A per lane, with a short reason.
Verify every new or changed citation against the pinned shas. Rerun your design-source audit, extended to cover server-connection.ts and the added modules. One new commit on the task branch, local only: no push, no PR, no Slack/Telegram. Report the diff summary and the final doc sha256.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-dcc451db-1542-433f-987f-cb6de5bfc539, run run-01M63PH8ZF75G215JE6T06WDTC, in your own native session and the same worktree.
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