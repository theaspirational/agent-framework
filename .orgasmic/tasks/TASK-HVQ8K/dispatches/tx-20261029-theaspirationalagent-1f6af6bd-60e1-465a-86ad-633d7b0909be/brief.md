# Implement fix round — Dispatch Brief
```brief
Owner button hvq8k:final:text. Final round on TASK-HVQ8K from 453484be889a665b88f7386eabd9484824960c32. Read /srv/review-drop/TASK-HVQ8K-REVIEW3.md in full. No re-review follows: no runtime behaviour may change except deleting the dead guard.
1. MEDIUM (text only): docs/required-inbound-admission.md, changelog and the PR draft must stop claiming "no peer hints from any carrier". State precisely: required connections ignore peer hints on push, standalone tools/hints and result-borne hints; the host's own solicited tools/list result still supplies tool presence and mcpl/rev and may trigger host->peer list recovery, because the host asked for it; no wake, content or stored data. Add a pinning test on a real WebSocket for that exact behaviour (required connection, tools/list with _meta mcpl/rev, zero admission hook calls, presence updated) so the documented contract is locked in. Do NOT change server-connection.ts:1835.
2. LOW: delete the unreachable early guard at inference-router.ts:253 (afterBoundary at server-connection.ts:2630 is the real gate); show the 94 affected tests still pass.
3. LOW: add an allow-then-stop/close-during-provider-call case on a required connection, asserting exactly one answer and the mcpl:inference_fail trace.
4. LOW: PR body: note the connector-literal inventory is an exact ceiling over upstream files, so a future upstream identifier needs a ceiling bump, not suspicion of admission code; keep admission_mode_ungranted as maintainer question 2.
5. Rebase onto upstream main 8145085d06dfdbea402eb3451e7f06ade455cf9d (ls-remote it again right before you finish; if it moved, rebase onto the newest). Recovery ref task-hvq8k-before-final at 453484be. Keep the six-commit lane shape (fold the changes into the right commits), Vasyl author+committer, GPT-6-Astra trailer. Re-check preservation of upstream-only files and the connector inventory against the new base.
Every node/npm command under the 16G zero-swap systemd-run scope. Gates on final HEAD: typecheck, build, 7 focused files, upstream targeted files (including any new ones touching our files), full npm test (AF_TEST_CONCURRENCY=4) on Node 22.23.3 and 22.12.0, lane independence, diff --check, internal-name grep of the commit range and PR body. Final PR draft in evidence. Local only.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-9f97405d-2683-48aa-8312-7f5d52d44d85, run run-01M64DGNQTRCJJ7B205PNGV6EY, in your own native session and the same worktree.
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