# Implement fix round — Dispatch Brief
```brief
Slice D fix round 2 (owner programme go `gen:exec`). Local only, no push.
The review of a5b02a07 is at /srv/review-drop/TASK-XHZ4H-REVIEW2.md. Read it in full. Verdict APPROVE, with one MEDIUM and LOWs.
Fix:
- M-A: a modern-family MCP server with `enabledCapabilities: ['channels.*']` (or naming `channels.contextOnly`) is now refused at config check even with the profile off. Use the preferred fix: exclude the local context-only extension path from the modern-family MCPL-policy check, the same way `isKnownCapabilityPath` already excludes it from feature-set `uses`. Add tests: a modern server with `['channels.*']` and one with `['channels.contextOnly']` are accepted exactly as on base c848977f; the MCPL-family deny-by-default behaviour is unchanged.
- L-A: a docs sentence saying that a `channels.*` pattern already opts that server into the leaf once the profile is on.
- L-B: when a floor is found, still refuse if another branch carries an unsupported floor version, or state the single-version assumption at the call site with a test. Pick the smaller safe option and say which one you chose.
- L-C: include one non-arrival row class (e.g. a host notice or assistant row) in the corpus `stored()` projection; the base/head corpus must still be byte-identical.
- L-D: number the granted-incoming `delivery` field refusal (profile off) and the maskedCapabilities naming in the deltas list (docs, changelog, PR body).
Same rules as before: A's files unchanged, generic only, the identity Vasyl noreply plus trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`, per-concern commits on top of a5b02a07, no rewriting.
Gates: full `npm test` on Node 22.23.3 and 22.12.0 under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, plus the no-config differential corpus. Report the counts, the head sha, a disposition table, and an updated `BEGIN PR BODY`/`END PR BODY`.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-a3a879ca-b508-40f2-89ad-1687f9d17476, run run-01M674E7CZAER1Q0T1QZMEH6YK, in your own native session and the same worktree.
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