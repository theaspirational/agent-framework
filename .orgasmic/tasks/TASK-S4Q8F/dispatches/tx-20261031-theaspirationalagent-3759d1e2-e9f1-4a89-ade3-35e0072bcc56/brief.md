# Implement fix round — Dispatch Brief
```brief
S4Q8F fix round 2, from 39c76401f1be9191e5f62f66b497828d4f30fd56. Task operator: Tarn; constraints: Soma (programme qualifier); not decisions by the owner Vasyl. Review: /srv/review-drop/TASK-S4Q8F-BATCHFIX-REVIEW.md (sha256 79a68ee836d44495d75b70a6e558b3f8fc2a1fa0c72127de6249206e254d4425) — read it in full, including the probes/ and npm-ls-explanation.md in the reviewer's evidence.
FIX:
MEDIUM: a real-path test of a non-removing mid-batch replacement: m1's host admit sends `channels/changed {updated:[…changed target…]}` for the same channel; assert explicitly m1 → admission_stale, m2 → accepted against the NEW generation (the host observes the new ref in its input), plus a variant where the replacement's scope hasn't resolved yet (the expected verdict — per the current code; if the code gives a false pass/refusal — STOP and ask). A mutant that would break this axis must be killed.
LOW-1: replace the disjunctive reason assertion with the exact expected reason per shape (record which guard fired; same-registration = the unknown-channel gate §14.5 — say so honestly in the test name/comment).
LOW-2: make the unsafe primitive unreachable by the natural name: either withRegistrationScope.forItem itself composes the outer check, or rename it to forItemUnchecked (internal) — pick the smaller option without changing behaviour; a test/mutant that a direct call doesn't lose the outer checks (framework.ts:35200-35203).
LOW-4: docs/registration-scope-view.md:71-73 — one sentence on the replacement corollary.
LOW-3 (per-item-epoch only via a monkeypatch) — a note in the report, no change.
GATES: the 6 old mutants + new ones, profile-off serialized (byte-identical to ddc883dd…), focused tests; fresh head cells head-22.23.3 and head-22.12.0. Base 29edcf8b may be REUSED (labelled "reused") only with a table of identical bindings (code, node sha, the closure inventory 91c5fd4f…, AF_TEST_CONCURRENCY, flags) — note: the reviewer found there's no package-lock.json, the "same lock inode" = node_modules/.package-lock.json; don't call that independent evidence. Same shape: 16G scope, `timeout --signal=TERM --kill-after=60s 3000s`, 64 MiB cap, PIPESTATUS, 124/137/141/cap=INCONCLUSIVE, no retries; progress every ≤4 min; reconcile your own processes at the end. No npm reinstall.
No deps/lock/wire/grant changes. Commits: Vasyl noreply author/committer, trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-3ddc4580-95d6-4d8e-b28d-42841800be57, run run-01M67TBE53E4YSJ4E1KCSZDFCK, in your own native session and the same worktree.
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