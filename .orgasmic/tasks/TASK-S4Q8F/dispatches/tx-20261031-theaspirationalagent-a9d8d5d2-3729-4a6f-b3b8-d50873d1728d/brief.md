# Implement fix round — Dispatch Brief
```brief
Continuation of AF-scope (TASK-S4Q8F) after the stall of run-01M67MDC3Y7G9B9R6R58KVBMWD. NO CODE CHANGES. Head 47f3b4f2195d2ff544815ea29a410c3a335864ba (verify HEAD and a clean tree). Previous evidence: /home/orgasmic/.orgasmic/runs/run-01M67MDC3Y7G9B9R6R58KVBMWD/evidence/ (report.md draft, gate-plan.md, matrix-plan-revision.log, all gate-*.log).

Reconciled by the task operator Tarn (00:58Z): 22.23.3 base 29edcf8b = all stages exit 0, 9767/9704/0/0/63 (receipt present). 22.23.3 head 47f3b4f2 = it ran to the end after the sequencer died: all stages exit 0 per the AF_GATE_STAGE lines, 9844/9781/0 fail/0 cancelled/63 skip; the dispatch-gate sequencer receipt is MISSING (its owner died); record exactly that, not "success according to the receipt". Its scope is gone (no surviving processes). DON'T rerun these two cells.

Remaining (genuinely unstarted): 22.12.0 base 29edcf8b, then 22.12.0 head 47f3b4f2, sequentially, one run each. METHOD CHANGE (Soma, programme qualifier; record it in the report as a method change, the earlier cells stay as historical observations with no bound): each command gets an explicit whole-command deadline and kill grace: `timeout --signal=TERM --kill-after=60s 3000s` around the whole stage (typecheck+build+test) inside the systemd --user scope (MemoryMax=16G), plus bounded full-log capture (the full log to a file, capped at 64 MiB, e.g. `| head -c 67108864 > log`; record any truncation). The same policy for both new cells. AF_TEST_CONCURRENCY=8, Node 22.12.0 from your node_modules/.runtime. A timeout = "operator-bounded timeout, inconclusive", not a test failure. Exact exit/total/pass/fail/skip/cancelled and failure names for every cell. No retry-until-green and no "environmental" labels.

To avoid another stall-kill: while waiting on a suite, print a progress line (e.g. the log line count) at least every 4 minutes. Then the full final report (the semantic table against T1 §4, mutants, profile-off differential, all gates including the historical ones, the remaining work) and finalize. All the original brief's conditions still apply.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-61a33c51-32e9-4ddd-bc80-281fae465a60, run run-01M67MDC3Y7G9B9R6R58KVBMWD, in your own native session and the same worktree.
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