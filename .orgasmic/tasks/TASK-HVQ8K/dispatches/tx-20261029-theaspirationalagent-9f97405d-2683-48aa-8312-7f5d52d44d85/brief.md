# Implement fix round — Dispatch Brief
```brief
Upstream moved again during manager gates. Rebase TASK-HVQ8K's 6-commit series (task-hvq8k-impl, HEAD f0d66760c832c0e36337cdbf0b7dd8747a57eae2, on 84e040897779552d92816285c29a123036f234e4) onto upstream main 9b54c588234f852c7299412be2d8e627bdf02095. Recovery ref task-hvq8k-before-rebase2 at f0d66760. Same rules as your last round (owner button hvq8k:rebase+text): per-lane shape, Vasyl author+committer, GPT-6-Astra trailer, every node/npm command under the 16G systemd-run scope, no uncapped runs.
This delta overlaps our files: src/framework.ts, src/mcpl/inference-router.ts, protocol-family.ts, server-connection.ts, types.ts. Notably #895 (an inference request's stop/abort holds from arrival to end; a request whose transport closed gets no router answer and makes no provider call), #870 (strict dial, now merged), #898 (retired module context). Resolve conflicts preserving both: the required inference preflight must compose with upstream's abort/stop semantics (e.g. a refused or pending-admission request whose transport closes or which stop() ends must not answer twice, make a provider call, or leak an admission slot). Add a test for that interaction if no existing test covers it, with red-before if you change behaviour. Explain each resolution with file:line. Re-check the connector inventory against the new base (regenerate from base only, never from our tree, and say so).
Gates on final HEAD: typecheck, build, full npm test (AF_TEST_CONCURRENCY=4) on Node 22.23.3 and 22.12.0, the 7 focused files, upstream's new tests (stop-with-work-in-flight, retired-module-context, the inference-abort tests), lane independence, diff --check. Update the PR draft only if facts changed. Local only; no push/PR/messaging.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-c863fb40-b1d0-426a-a8a5-52bcff053914, run run-01M64ANKWFR1W73NXXEM15MG6A, in your own native session and the same worktree.
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