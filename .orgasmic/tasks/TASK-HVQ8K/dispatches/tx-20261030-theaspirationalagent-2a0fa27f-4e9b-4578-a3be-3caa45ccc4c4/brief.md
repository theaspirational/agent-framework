# Implement fix round — Dispatch Brief
```brief
Review of your round approved all R1 items, with 2 MEDIUM residues of R1-3 and 3 LOWs (full review: /srv/review-drop/TASK-HVQ8K-R1FIX-REVIEW.md). Fix in additive commits on 89fbae88, citing R1-3 / R1-2:
1. MEDIUM: flushHeld (server-connection.ts:882-903) starts all held items' admissions concurrently, so a held burst above MAX_PENDING_ADMISSIONS (64) is refused at flush (probe: 70 held pushes -> 64 accepted, 6 admission_denied; notifications lost). Admit flushed items sequentially in arrival order (or queue rather than refuse overflow that comes from a flush), so the hold really behaves like unconfigured holding.
2. MEDIUM: concurrent admission reorders held items (stagger probe 4,3,2,1,0). Sequential flush should restore arrival order for held items; for live pipelined traffic (pre-existing), document that callback latency can reorder independently sent items, or preserve order per connection if cheap. Tests: >64 held burst on push and channels lanes, both request and notification; ordering under staggered hook latency (held; live if you change it).
3. LOW: PR body/disposition: say the generic result tap is preserved and that required connections carry no RFC-014 toolset presence, instead of claiming "toolset result adoption".
4. LOW: surface toolHints:true + inboundAdmission: log once at connect (or reject in serverConfigProblems; prefer the log, which is non-breaking).
5. LOW: optionally drop the duplicate connector inventory check if one AST check already covers inbound-admission.ts; keep one.
Update docs, changelog, the DISPOSITION and the PR BODY (blocks again in the report, full text). Same gates on both Nodes, same author/trailer, no push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-fd9f1635-93e5-4e27-9f21-22d75113f75d, run run-01M6669APQD2QBQ44ZZ6DRVMCT, in your own native session and the same worktree.
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