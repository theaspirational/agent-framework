# Implement fix round — Dispatch Brief
```brief
Round 4 (mini, last). The re-review approved a218dfb0; full text at /srv/review-drop/TASK-HVQ8K-R1FIX3-REVIEW.md. One additive commit citing R1-3:
1. server-connection.ts:1113-1114: replace the args[0] identity check in the emit hold-guard exception with an explicit `requiredFlushDispatching` flag set around dispatchInboundEvent in flushRequiredHeld. Belt-and-braces: if an item comes back held during its own dispatch, refuse it instead of re-dispatching, so the loop cannot spin. Add a test that wraps or clones params on the dispatch path and asserts the drain completes (it must hang or fail on a218dfb0).
2. Add a test that a held inference whose admission times out lets the drain proceed.
3. docs/required-inbound-admission.md + changelog: one sentence that a held inference backlog reaches the provider concurrently (one call per held item, as on the unconfigured path), because the drain releases at dispatch.
4. DISPOSITION: correct the "Optional pairing hardening" line to say the identity coupling is now removed from both trackHeldHandler and the emit guard (naming the commit). Keep the other lines. Updated DISPOSITION and PR BODY blocks in full.
First ls-remote upstream main; if it has moved past 00d7d7aa, rebase (no squash) and report the interactions. Gates on head (and on the new base only if rebased) on both Nodes, npm run clean before build, 16G scope. Same identity and trailer. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-32edf476-ef9b-427e-a11f-5824dce6085f, run run-01M669ZE6X0JNYT9SXXRN4PQ5D, in your own native session and the same worktree.
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