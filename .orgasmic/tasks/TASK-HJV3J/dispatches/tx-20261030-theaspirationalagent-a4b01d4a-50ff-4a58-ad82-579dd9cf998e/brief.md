# Implement fix round — Dispatch Brief
```brief
Mini round 3 on #931 (slice B). The R2 review APPROVED ce5e4e88970bedc9437d0033fbcbc72f295512b2; full text at /srv/review-drop/TASK-HJV3J-R2-REVIEW.md (read it).
Fix:
1. MEDIUM-1: in both 'stale' branches (src/framework.ts ~19628 and ~23321), when the dropped request satisfies continuesTurn, call endContinuedTurn(agentName, {kind:'dropped', why:'its admitted reply owner ended'}) before the trace, mirroring ~19617. Add a context_budget_restart-through-'stale' test that fails before the fix (turn token still held) and passes after.
2. LOW-2: initialise openLogical/turnRouting in the Object.create test harnesses and drop the three optional chains (~19525, ~19623, ~32160).
3. LOW-3: two rows in test/mcpl-post-admission.test.ts: a valid consumer refusal code yields that refusal; 'nonsense' yields admission_invalid. Prove it by mutation (deleting inbound-admission.ts:159 fails it).
4. LOW-1: reword commit 5b0c1a65's subject and body to describe the zero-vocabulary AST check it actually contains (interactive rebase reword only, no content change). Since this rewrites the commits after it, show range-diff proof that only that message changed.
5. LOW-6: in the BOT REPLY key items by file:line, not M1..M5. Commit subjects may keep "(bot …)", but replace it with the short topic.
Fixes 1–3 go in additive commits. ls-remote upstream main first and at the end; if it moved past c5306693, STOP and ask (A would need a rebase first). Gates on head, both Nodes, npm run clean before build, 16G scope. Same identity and trailer, no internal names. Output an updated BOT REPLY and PR BODY in full. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-3ac5c6ba-9b29-4870-bfa6-7a9f6d3c3e75, run run-01M66DQ27GPZZS7EMR615JP6WS, in your own native session and the same worktree.
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