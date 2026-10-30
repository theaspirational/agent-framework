# Implement fix round — Dispatch Brief
```brief
Fix round 1 for slice B (TASK-HJV3J). Read the full Opus review: /srv/review-drop/TASK-HJV3J-REVIEW1.md (verdict REJECT). Fix:
- HIGH-1: post-turn continuations (auto-continue, prose-continuation, refusal-rewind-retry, unstick-retry, inference-failure-rewind-retry) are dropped as reply_owner_ended under replyRouting. Preferred fix per the review: do not stamp replyOwner on requests that open a new turn; carry only replyWork so startAgentTurn re-freezes the binding on a fresh turn; keep replyOwner only for true in-turn continuations. Keep forged/unknown owners dropped. Replace/adjust the forged-owner witness at test/reply-routing.test.ts:464 so it still covers forged owners, and add positive witnesses: a bound turn with autoContinue takes its next turn into the same frozen thread; a rewind retry under replyRouting runs. Add a mutation case for this branch. Correct the changelog fragment and docs/reply-routing.md continuation wording.
- MEDIUM-2: context_budget_restart fallback must match tool_results_ready (`?? this.openLogical.get(agent.name)`); add a witness if constructible, otherwise state why not.
- MEDIUM-3: add src/mcpl/reply-routing.ts and src/gate/event-gate.ts to the connector-literal architecture gate inventory with their current counts.
LOW-4..LOW-8 are NOT part of this round (they go to a follow-up), except: you may fix LOW-8 in the PR body text only (drop the bare M1/M3/M5 labels).
Same rules as before: new commits on top of 02e3622358b48713c86eea1553aac30bc3b939e9 (no rewriting earlier commits), same author/committer and trailer, slice A files untouched beyond the existing seam commit, no pushes, no rebase. Gates under the 16G scope: typecheck, build, full suite on Node 22.23.3 and 22.12.0, focused routing suite, mutation script including the new case. Report per finding what changed with file:line, new head sha, gate counts, and the updated PR body between BEGIN/END PR BODY.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-c070b271-ebd7-40fe-9374-2cedfcf827e7, run run-01M65SDTHPQPT9CBRSFSBQ4WFC, in your own native session and the same worktree.
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