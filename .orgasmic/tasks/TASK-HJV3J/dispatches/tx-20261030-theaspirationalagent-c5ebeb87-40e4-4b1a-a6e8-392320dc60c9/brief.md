# Implement fix round — Dispatch Brief
```brief
B LOW round (gen:exec; local only; NO push — #931 publication is owner-held). Re-review: /srv/review-drop/TASK-HJV3J-REREVIEW-A869.md (APPROVE, 2 LOW). Read the Findings section.
LOW-1: protocol-family.ts:701-702 combines 5 replyAuthority clauses into one message. Split into one message per clause (fixed strings, no values), and have the 8 rejecting cases in test/mcp-protocol-family.test.ts assert the EXACT `problems` array. Show that removing each clause turns its own case red.
LOW-2: the one-shot fail-closed diagnostic (`failedConsumers` WeakSet in reply-admission.ts, `loggedThrow` in reply-routing.ts) → throttled like the existing stale-pending idiom (one line per 60 s per connection while the fault persists). Agent-visible behaviour is unchanged; update docs/reply-routing.md:48-49 and test/reply-admission.test.ts:82 (fake timers: 1 line inside the window, a 2nd after 60 s).
One new commit on top of 27a32127; same identity plus the Sol trailer. inbound-admission.ts zero diff. Gates under 16G: typecheck plus full npm test on Node 22.23.3 and 22.12.0 at the head; focused reply-routing suites. Report: head, counts, and an updated BEGIN/END PR BODY.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-f96fc04b-da92-40ad-b54e-2f1b793e30ec, run run-01M677S0KZ70JMRRCWX5B66M5Z, in your own native session and the same worktree.
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