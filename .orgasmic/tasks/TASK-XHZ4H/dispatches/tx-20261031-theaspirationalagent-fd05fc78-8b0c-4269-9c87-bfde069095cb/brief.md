# Implement fix round — Dispatch Brief
```brief
D fix round 3 (TEST-ONLY), from b612e8664c89c4f61c5c4ad69def914deb9889b4. Task operator: Tarn; constraints: Soma (programme qualifier); not decisions by the owner Vasyl. Review: /srv/review-drop/TASK-XHZ4H-HASHFIX2-REVIEW.md (sha256 9ff5c32b342d78bbbe9c5676b72733f079dab3457f0da85149932e6a7dd8ca1b) — in full, including the rv-* mutants/diffs in the reviewer's evidence.
MEDIUM: the mismatch test must prove that on changed bytes the guard refuses BEFORE ANY real work — not just before the first normalization. Make every real step after the evidence line observable: AgentFramework.create / store open (contextOnlyStorage), source.addMessage (both stamped writes), createConversationAgent/fork. Preferred: counters via the same mock.module/wrappers in the fixture plus a refusal line with all counters (all must be 0) AND an assert that the store directory wasn't created/contains no records. Don't touch src/production logging. The reviewer's mutant `rvearly` (guard moved right before createConversationAgent) must be KILLED on both Nodes; also a mutant "guard after AgentFramework.create but before addMessage" — killed. Keep and rerun: reorder, no-evidence, no-hash, marker-move, rvnoassert, rvdirectflag (the last two — after LOW-1 they should still survive unless you add a test; document honestly what kills each).
LOW-1: comments at fixture:36 and :51 — why the flag is set only via the intercepted emission and that :51 kills a marker moved out of the normalizer.
LOW-2 (src/framework.ts:17867) — still deferred, no src diff.
EVIDENCE: the same frozen closure (manifest dabd7705…, no npm install), absolute nodes with preflight. Base b6e225e0 — reused with the bindings table (as in round 2). Fresh head-23 and head-12, sequential, bounded: 16G scope, `timeout --signal=TERM --kill-after=60s 3000s`, 64 MiB cap, PIPESTATUS, 124/137/141/cap=INCONCLUSIVE, no retries; progress every ≤4 min; reconcile helpers. Keep the first survivor observations. Also delete the reviewer's temp stores /tmp/rv-early-store-* ONLY if their owner is orgasmic-worker/orgasmic and they're not open by any process (lsof) — record what was deleted.
Commits: Vasyl noreply author/committer, trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-87b81894-5043-4b9e-a98f-f86f9f8bbd7c, run run-01M67ZSW69W73G44KPCTCACQ7Z, in your own native session and the same worktree.
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