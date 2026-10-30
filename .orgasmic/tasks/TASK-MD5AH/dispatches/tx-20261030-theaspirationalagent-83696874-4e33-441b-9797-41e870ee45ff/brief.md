# Implement fix round — Dispatch Brief
```brief
Fix round on your commit 84149999 for #814, after the Opus review (read /srv/review-drop/TASK-MD5AH-REVIEW1.md in full). Add commits on top; no rewrite of 84149999 unless a reword is needed, and if so explain it.
Fix:
- MEDIUM-1 (event-gate.ts:3811-3814): events held by the publication fence must not go through the capped inference buffer (MAX_INFERENCE_BUFFER 100, oldest dropped). Hold them in a dedicated list, or re-arm the debounce, so the fence can never evict unseen events. Add a test: 101+ unseen events during one open fence are all delivered after it.
- MEDIUM-2 (event-gate.ts:4291-4301, framework.ts:25819-25825): (a) key the fence by agent, so an event waits only on fences of its own possible recipients; (b) bound it with a deadline (pick a value, justify it relative to the 60s publish request timeout, make it an internal constant). On timeout, release the events as wakeable (never drop) and log once per occurrence. Tests: another agent's slow fence doesn't hold this agent's batch; a stuck fence releases after the deadline (use fake timers).
- Test gaps: M6 (pin the fence predicate's narrowing to after && replyTo) and M8 (pin that judge batches get no placement): each must fail under the reviewer's mutation.
- LOW-1: give each agent in a multi-recipient remainder group its own batch line (or document the shared slot if per-agent writes break something; explain which).
- LOW-2: don't emit gate:debounce-delivered for a batch that was fully held or fully dropped; or emit it with an accurate count. Keep the trace shape compatible.
- LOW-3: log check faults with a throttle instead of once per lifetime (match the scheduler's style).
- LOW-4: move the API bullet into a sibling changelog.d/...added.md fragment.
ls-remote upstream main at start and end. It was a687fa61; if it moved, rebase (no squash) and report. Gates on base and head as before, both Nodes, 16G scope. Same identity, trailer, conventional subjects; no internal names. Output: report with a disposition per finding, and a full BEGIN PR BODY / END PR BODY ("Fixes #814", mentioning the deadline and the per-agent fence). No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-664b3bde-68ea-430a-a78b-ac66aa1b6914, run run-01M66KAVRF18KPVPEGGWQYY3SK, in your own native session and the same worktree.
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