# Implement fix round — Dispatch Brief
```brief
Fix round 1 for TASK-HVQ8K slice A on branch task-hvq8k-impl (HEAD 632f2e87c093c82f80f80e0b8e84104111300bc7, base upstream 4a45766f019fa11c8699645bd6806ebf3e13e5d1). Owner approved fixing every finding (button hvq8k:fix:all). Read /srv/review-drop/TASK-HVQ8K-REVIEW1.md in full first and verify each finding against source.

MEDIUM-1: on required connections, refuse peer `tools/hints` before any tap/state effect with the fixed reason `admission_unsupported` (same as hinted pushes), or do not install the read tap for required connections; pick whichever keeps unconfigured connections byte-identical. Red-before test on the real transport: hook call count 0, no toolset state change, refusal visible to the peer. Fix the doc sentence about push hints accordingly.
MEDIUM-2: narrow framework.ts:32035 so only admission setup failures (AdmissionConnectError: binder/attestation) abort startup for required servers; ordinary connect failures follow the existing non-fatal path. Put the new clause in its own statement, separate from the DiscordAwarenessAccountingError branch (also fixes the hygiene LOW). Tests: required server with an unreachable command starts the framework; binder absent still aborts. Document the behaviour in the doc and changelog.
LOW: reuse the existing capability-error message builder for the required-path refusal (or keep the new form and make report/doc say so), and keep the base diagnostic log line for notifications. Add killing tests for the data-only/accessor guard (accessor on replyIntent; a non-enumerable extra member) and rows for the two surviving mutations (M15 receipt guard for params null/non-object; M16 decision downgrade) if a test can isolate them, otherwise say why. In PR-facing docs/changelog drop slice letters and the base sha; state capabilities instead ("stamp support arrives with context-only delivery"; "a full MCPL pin follows separately").
Commit shape: restructure the series so each ingress lane (channels, push, inference) is its own commit with its fixes folded in, plus shared core and docs commits as needed, so upstream can take them separately. Author/committer Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>, trailer `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. The final tree must be what you test.
Gates on the final HEAD: typecheck, build, full npm test on Node 22.23.3 (/opt/node/bin) and Node 22.12.0 (/tmp/credential-engines/node-v22.12.0-linux-x64/bin), the six admission test files, and the connector-delta AST check. Local only: no push, PR or messages. Report: new commit list with purpose, per-finding fix with file:line, red-before evidence, gate table, and anything left open.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-2d2e812e-b832-4985-a955-b3232af57d66, run run-01M63VVZ46SV58RQ6QHPHXKTXN, in your own native session and the same worktree.
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