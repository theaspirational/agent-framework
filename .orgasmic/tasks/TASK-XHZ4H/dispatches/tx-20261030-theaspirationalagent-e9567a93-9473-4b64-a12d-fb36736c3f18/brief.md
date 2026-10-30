# Implement fix round — Dispatch Brief
```brief
D LOW round (TASK-XHZ4H), on 3b075de1a1a2afd006f21964671f977897d28a80. Read review 3 IN FULL: /srv/review-drop/TASK-XHZ4H-REVIEW3.md. Fix ONLY its 4 LOWs, no behaviour change otherwise:
L1 src/framework.ts:~17866: before the loop, assert seed.length === withoutNotices.length (fail closed: on mismatch, restrictive classification/throw per the existing style), or zip the stamps; a test with a stub that drops an element → restrictive, not 'normal'.
L2 test/helpers/context-only-compatibility-corpus.ts:17: either add a row class with assistant metadata to the corpus, or an honest comment by the assertion that metadata isn't exercised; fix the wording "content and metadata" in docs/PR body if it overclaims.
L3 src/mcpl/server-connection.ts:494: fix the refuseCapability comment (uniform across profiles, but the shape differs for selector-bearing incoming batches).
L4 src/mcpl/server-connection.ts:2614 vs :1137-1145: reconcile the comments, stating the exception explicitly (content/state-independent -32602, leaks nothing beyond what ping does). DON'T move the code.
inbound-admission.ts and A's RequiredAdmission blocks: zero diff. Separate commits, Vasyl noreply identity + trailer Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>. Gates: typecheck+build+npm test on Node 22.23.3 and 22.12.0 in a 16G scope via orgasmic dispatch gate. Update the PR body (stacked on #906) if needed. Note: the human owner is Vasyl; engineering calls on your asks are those of the task operator Tarn, write them that way. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-c1b622aa-8a22-4bdb-9b6e-2f3bd78d518b, run run-01M678TWVHMZV88R82T02CGENQ, in your own native session and the same worktree.
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