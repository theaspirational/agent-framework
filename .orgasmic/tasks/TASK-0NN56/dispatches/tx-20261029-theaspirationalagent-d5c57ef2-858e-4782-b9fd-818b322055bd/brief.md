# Implement fix round — Dispatch Brief
```brief
Fix round 1 for TASK-0NN56. Review: /srv/review-drop/TASK-0NN56-REVIEW1.md (read in full). New commits on BOTH branches (stacked feat/typing-budget-recipient @72fe3f8d and standalone recipient-on-main @57424a0e); no rewrite of existing commits; keep the two branches' layer-3 changed-line sets identical.
1. MEDIUM framework.ts:24288: a recipient wake joining an already-open logical turn must not lose its envelope. Prefer: a recipient wake refuses to join a turn it does not own (requeue, like 19826), or adopt via ??= only when the open turn has none; pick the safer one and justify. Red-first regression row in test/recipient-compatibility.test.ts. Also try to state whether the precondition is reachable in production.
2. MEDIUM host-recipient-protocol.ts: writeChannels is validated but never enforced. ENFORCE it in the channel (non-DM) lane of accept() before minting an envelope (a mention in a joined readable channel outside writeChannels stores as context but does not mint a reply envelope / does not trigger inference). This is the manager's call (Tarn), say so in the report. Red-first test.
3. MEDIUM channel-registry.ts:2357 / framework.ts:17501: port the source patch's guard so a context-only arrival (bridge installed and isSupportContextOnly(metadata)) does not become the latest-inbound reply anchor (defaultPublish*, incoming, refusal-reaction target). Red-first test.
4. LOW docs/recipient-compatibility.md:62 and the changelog fragment: make budget-hold mentions conditional on the stacked branch so recipient-on-main does not cite a missing test or feature.
5. LOW: drop the `as any` casts in test/recipient-compatibility.test.ts where they can now type-check.
6. Report: the replacement-test decision was the manager's (Tarn's), not the owner's; do not write owner-accepted.
Leave the trailers as they are (handled at publication). Gates on both heads with Bun 1.4.3 install + Node 22.23.3: typecheck, clean build, full npm test (AF_TEST_CONCURRENCY=8); zero failures.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-b6881096-ef6c-4449-804b-867d89bc0a93, run run-01M63783T63Z42QNG09P652MBB, in your own native session and the same worktree.
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