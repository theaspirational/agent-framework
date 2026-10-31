# Implement fix round — Dispatch Brief
```brief
XHZ4H fix round 2 (test enforcement), from 93932bae02b35584530840a5683abc7376baac6e. Task operator: Tarn; constraints: Soma (programme qualifier); not the owner Vasyl. Review: /srv/review-drop/TASK-XHZ4H-HASHFIX-REVIEW.md (sha256 9c5f0580a56331d3543bd506bd8fb4cce755927bccf6d88ca2f7985e9cfd1160) — read it in full.
FIX:
M1+M2: test/context-only-delivery.test.ts:478 — the mismatch child's stdout must be EXACTLY the evidence line (e.g. `assert.match(result.stdout, /^CONTEXT_MANAGER_NORMALIZER_EVIDENCE \{[^\n]*\}\n$/)`); the positive test :465 must assert that the evidence line is present (and parses as JSON with version/integrity/normalizerSha256). Don't replace console.log(find(...)) with something that silently prints undefined.
LOW docs: docs/context-only-delivery.md:146 — state that the file:line evidence was taken at CM 0.24.1 and wasn't re-audited against 0.24.2 (or re-audit and cite it); don't change the meaning of the maintainer question.
LOW PR body: one sentence noting that 0 fail is in this environment, and that a separate unresolved liveness-watchdog divergence (2 tests) in the task operator's environment is being tracked separately.
DON'T TOUCH src/ (the framework.ts:17867 comment is a separate follow-up), deps, the lockfile, the production guard.
MUTANTS on the same frozen closure (manifest dabd7705…; no new npm install): (a) the reviewer's reorder mutant (hash assert just before the final console.log), (b) deleting the evidence console.log, (c) the original hash-check removal — all three must be KILLED; record the exact test exit.
GATES: base b6e225e0 cells may be REUSED (labelled "reused") only if code/node binary sha/closure manifest/AF_TEST_CONCURRENCY/NODE_OPTIONS are identical — prove it in a table; fresh head cells head-23 and head-12 on the new head, sequential, same shape (16G scope, timeout --signal=TERM --kill-after=60s 3000s, 64 MiB cap, PIPESTATUS, 124/137/141/cap=INCONCLUSIVE), no retries; exact numbers and failure names. Progress every ≤4 min. Report survivors and reconcile your own helpers by pid/start/cgroup.
Commits: Vasyl noreply author/committer, trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-0aaf8865-87bb-41c9-87fe-5f2ee1214ae7, run run-01M67T7WWFXPBXDR04N3CY5RQR, in your own native session and the same worktree.
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