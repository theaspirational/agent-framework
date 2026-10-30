# Implement fix round — Dispatch Brief
```brief
D rebase onto refreshed A (gen:exec). Local only, no push.
Rebase D (all commits from c848977f..51cf9b1e50602b5f6d82c2eddff34f194b0e6375; old A base c848977f) onto refreshed A **869bb3add7b48893d48b2ce50ea423e4b33fdfbc** (upstream a64cfc01 + A). Keep a recovery ref at 51cf9b1e. Keep the commits as they are (same identities and trailers), resolve conflicts minimally, and list every conflict and how you resolved it.
Watch especially for interaction with upstream 93cdb7d6 (deferred injections only for streams with `supportsInjectedMessages: true`) and the upstream bbba75bc/664473ad removals: does context-only delivery still reach no wake/injection after rebase? If the rebase requires a behavioural change, make it a SEPARATE commit and describe it.
Afterwards: `git range-diff c848977f..51cf9b1e 869bb3ad..HEAD`; A's files (inbound-admission.ts, server-connection.ts admission parts) have zero diff against 869bb3ad.
Gates in `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, cwd = tested checkout: typecheck plus a full npm test on Node 22.23.3 and 22.12.0 at the head; the base 869bb3ad counts (Node 22.23.3) in a separate checkout; the no-config differential corpus base 869bb3ad vs head (byte-identical); the modern compatibility probes and the red control again.
Report: head, range-diff, conflicts, counts, and the updated BEGIN/END PR BODY (stacked on #906 at 869bb3ad; no internal names).
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-f6f813ae-a604-4310-9136-0e3b6316910b, run run-01M6778WBGZYGCHS9PT3SWWRH3, in your own native session and the same worktree.
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