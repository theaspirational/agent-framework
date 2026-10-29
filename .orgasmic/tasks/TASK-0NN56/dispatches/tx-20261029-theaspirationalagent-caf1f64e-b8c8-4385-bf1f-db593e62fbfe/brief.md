# Implement fix round — Dispatch Brief
```brief
Fix round 2 for TASK-0NN56 (owner button 0nn56:lows). Review: /srv/review-drop/TASK-0NN56-REVIEW2.md (read in full). New commits on BOTH branches (stacked feat/typing-budget-recipient @3e4e4990, standalone recipient-on-main @280ec03d); no rewrite; keep layer-3 changed-line sets identical.
1. LOW 2: deferred recipient wakes must be visible: one throttled trace + stderr line on the scheduler requeue (framework.ts:19829) and on the direct-start requeue (23518), like the provider-admission sibling at 23557; or let the recipient filter fall through to the stale-wake accounting. Test that a long-deferred recipient wake emits the diagnostic.
2. LOW 3: add `&& !trigger.suppressProse` to the direct-start guard (23511), with a test.
3. LOW 1: drive the anchor regression row through real channels/incoming (as recipient-protocol.test.ts:162 does) instead of calling noteDeliveredOrPark directly; describe the 17494 guard as defence in depth behind decision.locus in docs/report.
4. LOW 4+5 docs (docs/recipient-compatibility.md): a channel absent from writeChannels gets no automatic reply; an empty writeChannels is valid and disables channel auto-replies; note the addressed-but-context storage asymmetry (host-recipient-protocol.ts:129).
Do NOT touch trailers/authors (handled at publication). Gates on both heads: Bun 1.4.3 install, Node 22.23.3, typecheck, clean build, full npm test (AF_TEST_CONCURRENCY=8), zero failures.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-d5c57ef2-858e-4782-b9fd-818b322055bd, run run-01M63F62CHR2AMB907SNGAMDBA, in your own native session and the same worktree.
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