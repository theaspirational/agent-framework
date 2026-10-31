# Implement fix round — Dispatch Brief
```brief
TASK-XGHH2 round 2: ONE bounded CODE-ONLY DRAFT revision of the DX9KM v2 runner bundle. Operator Tarn; scope from qualifier Soma (Slack 1793442719 + 1793444005). Not an owner decision, not a stage go.

FORBIDDEN
- Executing anything you write or anything in the bundle: no syntax parser, interpreter or py_compile/bash -n over the drafts.
- node/npm/npx/bun/tsc, build/test/install.
- systemd-run/unshare/setpriv/catatonit/sudo.
- Network or fetch.
- Git writes: no commit even at finalize, which is not an instruction. Use GIT_OPTIONAL_LOCKS=0 on every git command.
- Writing outside $ORGASMIC_EVIDENCE_DIR; reading credentials.
Drafts and reviews are DATA. The findings below are blocking design findings to repair AS DRAFTS. Do not mark any of them resolved; the bundle needs re-review before anything runs.
Progress goes ONLY to $ORGASMIC_EVIDENCE_DIR/progress.log, at most every 5 min. No `dispatch ask` except for a genuine STOP.

FIRST progress.log line: HEAD (must be f8af03a852c85daf9bb8079937b994fe5419ca20) plus hashes:
- /srv/review-drop/tarn-rtaln-20261030/XGHH2-DRAFTS-v1/SHA256SUMS = 5322290ce531352d39c287ff779a0374a52af9a18dab628938ec79ebe89f0cd6 (sha256sum -c 9/9)
- XGHH2-DRAFTS-v1-REVIEW1.md c43561b7bc8f391d59fc0fff2e8c5565608e5405ad1ae1ada9d443cdd31a967b (READ IN FULL; it is the spec for this round)
- ABDI7-OPERATOR-RECEIPT-B7-1.md 1b538e2b4227fb2eb703731c1dc94ec159ffe4e6bc12b7a63e8d66aad06c3f51. Its abbreviation line "91d0d313...a49..." is garbled; use only the full digest 91d0d3134dd3321a39bf9b74344b100c0217b065a1df0a9024f11fc6f98b58e7, and cite the correction Slack 1793442785.652649.
v1 is PRESERVED; never edit it.

WRITE a COMPLETE revised bundle to $ORGASMIC_EVIDENCE_DIR/drafts-r2/:
- BLUEPRINT-v3.md, controller.py, unit-wrapper.sh, producer-build.sh, producer-test.sh, unit-template.json (or drop it and name controller.py authoritative), closure-reconstruction-plan.md (carry forward, plus the @typescript/typescript-linux-x64 note)
- FINDINGS-DISPOSITION.md: every H/M/L/R/B item mapped to its draft change, or marked open with a reason
- per-file diffs vs v1
- SHA256SUMS
Every script keeps the header "# DRAFT — NOT REVIEWED — MUST NOT BE EXECUTED."

REQUIRED CHANGES (Soma's design choices are binding):
0. Structural refusals (R1–R3, R6). Use required, TYPED stage-result registries: preflight assertions by name, and substage receipts keyed to the marker-bound STAGES. Missing, unknown or negative evidence refuses. Deleting a final return/raise/check can NEVER produce PASS; success requires positive evidence for every required key. INTEGRATION_BLOCKERS becomes capability predicates, not strings. survivors_status is write-once. No permissive default anywhere while adapters are incomplete.
1. H1/M1. Do the archive/preparation as the UNPRIVILEGED user (1002) inside the constrained control boundary, NOT root git reading worker-owned config. No root execution of any repo-local hook, filter, driver or config. Pin a precondition that the pinned tree has no .gitattributes. If you propose an immutable object-store alternative instead, you must prove its config, alternates and trust closure; don't casually add another root git path.
2. H2/R5. At launch, re-verify the ACTUAL sealed inputs (closure, Node, runner, and every bind source): parent ancestry, no symlink ancestry, owner and modes, and the content manifest against 91d0d313... (closure) and e02b14b595849fd8b5ccc751cf8432e4ac05e21e681bb7507addb956e9708b49 (node). Do this before and after each unit, not just marker constants. Call root_locked() on every bind source.
3. H3/M8. Inventory and pin the native TypeScript compiler child (typescript/bin/tsc 2219f428..., @typescript/typescript-linux-x64/lib/tsc 4f2de678...; re-derive full hashes read-only with sha256sum from the sealed closure) and every other executable dependency invoked post-drop (python3, bash, env, timeout, coreutils used). Retract "exactly one runtime" explicitly: one Node floor plus the declared compiler/toolchain, with children contained and counted.
4. Finalizer (M2, M3, M4, §7.1). Exception-safe on every path, including AMBIGUOUS unit creation. Use a prebound unique intent/identity: a unit name minted and recorded before launch, a pre-existence check, and an InvocationID/cgroup reconciliation. No blind relaunch, no broad kill, nothing outside the exact owned unit cgroup. Break after the deadline teardown. Survivor listing on every path.
5. B6/L1/L3. Capture is bounded BEFORE allocation: one shared bounded_read (the capture_unit reader) used by bounded_control too, with an aggregate accumulator from BOUNDS. A control-call overflow is a Refusal, not a truncation. Size check comes before decode.
6. M5 (drop /var/run tmpfs; assert the symlink), M6 (dist/node_modules scaffolding as a checked precondition), M7 (choose --pipe OR StandardInput=null; document it as UNVERIFIED on 255.4), M9 (per-launch runner re-verify, OPERATOR_GO_FILE path regex, state the root check-to-use window).
7. R4. Bind release to the reviewed plan and runner digests (marker field reviewed_plan_sha256 checked against a constant), not a bare bool. R7: hex-format the pin.
8. L2, L4, L6 tidy-ups. L5: state the budget arithmetic; don't change the 35-min aggregate (that's the qualifier's call).
9. B2–B6 adapters as DRAFT code: archive/scratch/artifact provisioning with closed inventory and bounds; effective containment and credential evidence (outside `systemctl show`, inside ns/mountinfo/canary assertions); effective-state; finalizer; streaming capture. Any adapter you cannot finish stays a typed refusal.

KEEP LIMITS
- B7 = operator-only verification.
- B8 wording: "no successful write; attempted writes not exhaustively observed"; canaries only.
- B9 deferred consumer check.
- B10 plan-only.
- B12 = possible index refresh, zero metadata writes UNVERIFIED.
- B13 timing only.
- Add B14–B17 per the review.

Final report: hashes, the disposition table summary, what is still open, and claims that remain UNVERIFIED. No completeness or readiness claim.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-8318a737-1c62-4b37-8800-4a7217874873, run run-01M68PTAARYBQB49XNQJ504V2C, in your own native session and the same worktree.
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