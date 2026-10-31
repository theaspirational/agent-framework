# Implement fix round — Dispatch Brief
```brief
PK8RC: a LOW-only docs round, from 7504acbd139e63878f6142f962750b8669fc92d1. Task operator: Tarn; constraints: Soma (programme qualifier). Review: /srv/review-drop/TASK-PK8RC-LOWB-REVERT-REVIEW.md (sha256 bf0925d2b856918ed4d850e924f3d410011d4a20ef5305d6e6a2ec99b0f46a5a).
The only change: docs/reply-routing.md:181-183 — narrow "late registrations and their queued lifecycle work cannot outlive the disconnect" down to what's proven: registrations arriving while close settles (between the first and second pass) are removed by the second pass, and lifecycle work queued up to the second pass is cancelled (serverRemovals ×2); no claim about registrations after the second pass (as test/typing-transport-epoch.test.ts:119-144 proves). LOW-2 (same-pair) — no change. Nothing else: no src/test/changelog edits (if the changelog repeats the same overclaim — fix it too and say so).
Gates (bounded 300s, TERM/60s): git diff --check; the focused test test/typing-transport-epoch.test.js + channel-lifecycle-order on Node 22.23.3 on the existing build (no npm install) — as a sanity check that docs didn't affect the tests (expected identical). Commit: Vasyl noreply author/committer, trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-abc22e30-980f-4a2a-9d4d-f7115152c9f6, run run-01M67W0Y48J8WSM1ZYEBFQH5G0, in your own native session and the same worktree.
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