# Implement fix round — Dispatch Brief
```brief
Round 3 (last before publication). Re-review approved f3f0627a; full text at /srv/review-drop/TASK-HVQ8K-R1FIX2-REVIEW.md. Do these, additive commits citing R1-3:
1. Head-of-line: framework.ts awaits the whole handleInferenceRequest for a held inference-request, so one held inference blocks every later held/live data item for the full inference. Make the drain wait only until the held item's admission decision and its synchronous dispatch/storage effect (enough to keep arrival order of stored data), not the full inference handling. Test: a held inference with a slow handler does not delay subsequent held pushes/channels; arrival order of stored data is preserved.
2. Docs + changelog + disposition: one sentence that while a backlog drains, required data (held and newly arriving) is admitted one at a time, so sustained ingress above ~1 item per callback latency accumulates and is dropped/refused at the existing hold bounds. Mention a bounded-concurrency ordered drain as a possible follow-up (maintainer's call); do not implement it.
3. Add one test sending live data during an active drain, pinning the capture behaviour.
4. Optional, if cheap: make trackHeldHandler's pairing not depend on args[0] identity (or add a test that fails if params are cloned); make the admission receipt symbol non-enumerable.
5. Then REBASE the whole branch (66c9db3f's 6 commits + all fix commits) onto current upstream main (`git ls-remote https://github.com/anima-research/agent-framework.git refs/heads/main`; was 30825fdf). Keep the commits as they are (no squash). Resolve conflicts carefully; report each conflict and the semantic interactions with upstream commits between 48f26ce5 and the new main. ls-remote again at the end and report the value.
Gates on the rebased head AND on the new upstream base, both Nodes, `npm run clean` before build, 16G scope. Updated DISPOSITION and PR BODY blocks in full. Same author/committer and trailer. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-2a0fa27f-4e9b-4578-a3be-3caa45ccc4c4, run run-01M668ANMJV2SVKBVVH237B0SJ, in your own native session and the same worktree.
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