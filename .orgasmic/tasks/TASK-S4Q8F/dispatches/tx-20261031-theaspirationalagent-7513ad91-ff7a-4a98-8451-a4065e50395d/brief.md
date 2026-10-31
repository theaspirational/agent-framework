# Implement fix round — Dispatch Brief
```brief
TASK-S4Q8F, a small LOW round after the r3 APPROVE (review /srv/review-drop/TASK-S4Q8F-FIX3-REVIEW.md, sha256 055787974ada7f413259872e548de6bc2ec7de5bfaa8cb9c83e824725fef453f — read the LOWs). Start from 29b5ebf33ca5d785564cdd85c4609543d8202d57. Task operator: Tarn; qualifier: Soma; not decisions by the owner Vasyl. Local commits only, no pushes.
1) LOW-2 (registration-ingress.ts:23-26): give the refusal ingress from missing() a self-returning forItem (returns the same refusal, or a new admission_missing refusal) so a direct fork.forItem(x) refuses admission_missing with no TypeError and no effects. A test: a direct call on the refusal object → admission_missing, 0 effects; a mutant "missing() without forItem" is killed.
2) LOW-1: docs/registration-scope-view.md:84-95 — say explicitly: a wrapper adding its own guard MUST issue through the internal composer; forwarding (including an arrow) does not carry the wrapper's guard; the invariant is "a fork is not weaker than the issued context it names". No code changes for LOW-1.
3) LOW-3 (not to be confused with the old LOW-3): one sentence in the same doc about the unreachable fail-closed arm of the composer (admission_missing instead of admission_not_ready when the queue is closed on a bare capture of a protected key; server-connection.ts:1156-1162 refuses earlier). No code changes.
The old LOW-3 (white-box epoch provenance) stays OPEN, don't touch it.
Gates (bounded: orgasmic dispatch gate, systemd-run --user --scope -p MemoryMax=16G, timeout --signal=TERM --kill-after=60s 3000s, 64 MiB cap, PIPESTATUS; 124/137/141/cap = INCONCLUSIVE; no retries): focused (the three registration test files + the unchanged A/B admission files, as in r3), the new mutant + rerun of 2-3 key r3 mutants (blanket-refusal, unissued-outer-structural-fallback), profile-off differential (expect ddc883dd…), then FRESH full head cells on both Nodes (22.23.3 fde6a4bf…, 22.12.0 177208bf…, concurrency 8, the existing closure 91c5fd4f…, no installs); base = B 29edcf8b reused with the same bindings table. Verify free disk before the full cells (reserve 20 GiB). Restore compiled files after mutants byte-for-byte. Commits: Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>, trailer Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>. STOP and ask if the fix requires changing public types/exports or RefusalCode.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-3023c2cd-a1df-42b7-938d-6e6501bfa270, run run-01M6832514GX6VMH3AZ46W99KS, in your own native session and the same worktree.
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