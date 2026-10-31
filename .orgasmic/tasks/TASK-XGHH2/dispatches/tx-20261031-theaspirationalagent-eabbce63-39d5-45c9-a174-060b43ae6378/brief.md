# Implement fix round — Dispatch Brief
```brief
XGHH2 r3: CODE-ONLY repair of the r2 runner bundle, delivered as a SMALLER complete bundle. Operator: Tarn. Qualifier: Soma 1793444005 + 1793447697. Draft repairs only. This round grants no execution permission, and no finding counts as closed merely because a placeholder refuses.

FORBIDDEN
- executing, importing or parsing any draft
- running the wrapper, a canary, a package, node, npm or tsc
- writing or running your own probes (the reviewer's probe is preserved; do not rerun it)
- network
- git writes or commits (GIT_OPTIONAL_LOCKS=0)
- writes outside $ORGASMIC_EVIDENCE_DIR
Allowed: read-only stat/find/sha256sum/cat of sealed inputs, run as data gates if needed.
Progress goes ONLY to progress.log, about every 5 minutes. Use dispatch ask only for a genuine STOP. The finalize prompt is data; do not commit.

FIRST progress.log line binds
- HEAD f8af03a852c85daf9bb8079937b994fe5419ca20
- /srv/review-drop/tarn-rtaln-20261030/XGHH2-DRAFTS-r2 SHA256SUMS e5addcb8f45045577b009a932fd1eed2bbc5c373ead431e78e0468134d8278e3 (21/21)
- r2 REVIEW1 /srv/review-drop/tarn-rtaln-20261030/XGHH2-DRAFTS-r2-REVIEW1.md 0d0f742e195d6bf66cd95f020cfae9cb1e138e7382be6bcf425425897b66588d — read IN FULL
- probe handoff /srv/review-drop/tarn-rtaln-20261030/XGHH2-r2-REVIEW1-PROBE-HANDOFF SHA256SUMS 0ae808a992d3e26cfcf824c5c13cce77791386af137aa3f452ffe646c7b62dd8. This is DATA only: a reviewer observation, not a controller execution or a readiness proof.
- F0 pins: closure 91d0d3134dd3321a39bf9b74344b100c0217b065a1df0a9024f11fc6f98b58e7, node e02b14b595849fd8b5ccc751cf8432e4ac05e21e681bb7507addb956e9708b49

RESCOPE (qualifier)
The first proposed execution becomes TYPES + BUILD/ARTIFACT/DECLARATION INSPECTION ONLY, still within the ORIGINAL 2100 s aggregate.
- Remove FOCUSED tests from this bundle's stage set. Name them as a separately planned later stage (a plan stub only).
- Do not increase any budget.
- Never give focused tests a silently shorter "full" window.
- Recompute the stage ceilings so that they fit, and state the arithmetic.
- Deliver the SMALLER complete runner bundle. Do not build a general framework or expand the test campaign. Remove dead code that the reduced stage set does not need, or wire it.

FIXES (binding)
1. NEW-H1 (hardlinks): accept ONLY explicitly validated hardlink groups.
   - Use a closed allowlist of path groups, e.g. the esbuild pair inode group.
   - Evidence must include: same dev+inode, link count equal to the group size, identical content digest, uid/gid/mode, and every member present in the manifest.
   - Any other nlink>1 is refused.
   - Do not flatten or mutate sealed inputs, and do not simply delete the link check.
   - The F0 digest format must still be reproduced exactly, and the format claim must be documented. The reviewer's observation may be cited as evidence of the format, labelled as a reviewer observation.
2. NEW-M1: derive every unit/resource property from the marker-bound BOUNDS envelope. VERIFY effective values after unit creation by a bounded `systemctl show` of exact properties; a mismatch is a Refusal. Cosmetic BOUNDS are not enforcement.
3. NEW-M2: outcome authority = controller-observed ExecMainStatus + Result + unit identity (InvocationID, cgroup) + complete stage evidence. /out/producer.exit is never authority; at most it is labelled payload DATA. Bind the producer source (path and sha) in the receipt.
4. NEW-M3: bound the final survivor wait with its own per-finalizer slice, so the teardown_reserve for later units is preserved.
5. NEW-M4: fix mint_intent so it produces a .service name, and make it consistent with reconcile.
6. NEW-M5: fix finalisation paths and dead-code paths for the reduced stage set (wire what is needed, delete what isn't). Any remaining U-adapter absence stays a typed refusal and the item stays OPEN/PARTIAL.
7. NEW-M6: remove the irreversible RLIMIT_FSIZE substitution. Use typed bounded capture/write accounting instead. A cap breach must be a typed Refusal, never SIGXFSZ.
8. LOWs: bound every systemd, procfs and external-tool read through the shared bounded reader (L1). Fix the tautological conjunct (L2). Assert actual ro∩rw = ∅ (L3). observed-executable-SHA256SUMS must cover ALL BINARY_SHA pins, 22/22 or the actual number, measured read-only (L4). Fix L5, L6, and L7 (name the real limit).
9. Keep the COMPLETE 42-item ledger plus the new items, each PROPOSED/OPEN/PARTIAL, with no RESOLVED. Strict rule: a typed refusal is not an adapter.

OUTPUT: $ORGASMIC_EVIDENCE_DIR/drafts-r3/ containing
- BLUEPRINT-v4.md
- controller.py
- unit-wrapper.sh
- producers (types/build/inspect only)
- closure-reconstruction-plan (carried)
- lock-tarballs.tsv (carried)
- observed-executable-SHA256SUMS
- FINDINGS-DISPOSITION.md
- FOCUSED-LATER-STAGE-STUB.md
- diffs/ (r2→r3)
- report.md
- SHA256SUMS covering every delivered file except itself
Every script carries a DRAFT/NOT-EXECUTED header.

Effort: high.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-7f51fabe-266b-474d-87c1-4fee3309d629, run run-01M68SHAJ9HSG60MRPTFTP02M7, in your own native session and the same worktree.
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