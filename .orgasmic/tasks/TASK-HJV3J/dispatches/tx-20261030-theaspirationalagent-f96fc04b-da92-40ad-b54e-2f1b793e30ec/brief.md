# Implement fix round — Dispatch Brief
```brief
B narrowed, fix round plus rebase (gen:exec). Local only, no push. The upstream #931 PR stays held: don't touch it.
1) Rebase B (bf6e8e0e, 4 commits on old A c848977f) onto refreshed A **869bb3add7b48893d48b2ce50ea423e4b33fdfbc** (A on upstream a64cfc01). Keep the 4 per-concern commits. Record the range-diff and any conflicts.
2) Fix the findings of the review /srv/review-drop/TASK-HJV3J-NARROW-REVIEW.md (read it in full):
 - MEDIUM-1: table-driven `serverConfigProblems` tests for replyAuthority (without inboundAdmission; timeoutMs 0/60001/1.5/NaN/string; non-function resolve/authorize; boundaries 1 and 60000).
 - LOW-1: authorize truthiness (1/'true'/{}/undefined/null/0 → private).
 - LOW-2: unit tests for turnReply/shareReplyTurn with mixed destinations.
 - LOW-3: a test that the mayWake:false early return skips the resolver.
 - LOW-4: move detach(item) after the verdict gate.
 - LOW-5: try/catch around consume (fail-closed private); pending++ inside the try.
 - LOW-6: remove the "slice A/B" and "A's" vocabulary from src/docs/tests; name the feature.
 - LOW-7: document the bound-wake drop exemption, plus a test.
 - LOW-8: align the fallback at :17034 with :16917.
 Commit as fixups folded into the relevant per-concern commits, or as one or two new commits. Identity is Vasyl noreply with the trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. A's files (inbound-admission.ts) have zero diff against 869bb3ad.
3) Gates: typecheck plus a full npm test on Node 22.23.3 and 22.12.0 under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, cwd = the tested checkout. The A base 869bb3ad counts on both Nodes too (in a separate checkout whose cwd is the receipt). Re-run the mutation probes P2, P5, P7, P8, P11 and P12 from the review: they must fail now.
Report: the head sha, the range-diff, a disposition table, counts, and BEGIN/END PR BODY (stacked on #906; no internal names).
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-d50b5c5b-2fd1-485c-b18f-85b92de66846, run run-01M675WMW5VJZFQ9S6N1351R2R, in your own native session and the same worktree.
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