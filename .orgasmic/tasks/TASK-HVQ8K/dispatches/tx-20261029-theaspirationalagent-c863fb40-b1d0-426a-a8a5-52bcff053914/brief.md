# Implement fix round — Dispatch Brief
```brief
Rebase TASK-HVQ8K's 6-commit series (task-hvq8k-impl, HEAD 6aec11ec1dad94eac0610a868e55428f5b96bc10, on 4a45766f019fa11c8699645bd6806ebf3e13e5d1) onto the latest upstream main 84e040897779552d92816285c29a123036f234e4 (upstream #871 re-arm deadline cut; touches src/framework.ts, src/types/framework.ts). Owner button hvq8k:rebase+text. Keep a recovery ref task-hvq8k-before-rebase at 6aec11ec.
Keep the per-lane shape (core, channel, push, inference, cross-lane tests, docs), author and committer Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>, and the trailer `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Resolve conflicts preserving both upstream's new re-arm/deadline behaviour and our admission behaviour; explain each resolution with file:line. Regenerate the committed connector-literal inventory only if upstream's changes add or remove inherited occurrences in the nine files, from the new upstream base, never from our tree, and say so.
Every node/npm command goes under `XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0`; don't run uncapped. Gates on final HEAD: typecheck, build, full npm test (AF_TEST_CONCURRENCY=4) on Node 22.23.3 and 22.12.0, the 7 focused admission+architecture files, lane-patch independence, `git diff --check`. Also confirm upstream's new test/exhausted-turn-rearm.test.ts passes.
Then draft upstream PR text: recommend one PR vs core + 3 lane PRs, with reasons; the title(s); a body describing the opt-in required inbound admission (no internal names, task ids, hosts or agents; no 'slice' vocabulary), compatibility (unconfigured connections unchanged), tests, and a short 'Questions for maintainers' section covering the open design choices (timeout bound 1..60000 ms and 64 pending per connection; refusal-code vocabulary incl. admission_mode_ungranted; result-borne hints refused on required connections; required-server startup is non-fatal on transport outage, fatal on binder/attestation; mcpl-core 0.4.0 baseline, protocol stamp later). Local only; no push, PR or messaging. Report: new commit list, conflict resolutions, gate table, PR draft.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-0069dd24-fef3-4cbf-b82a-6121011319aa, run run-01M6467C786S6YQ7R0P0WQRZQH, in your own native session and the same worktree.
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