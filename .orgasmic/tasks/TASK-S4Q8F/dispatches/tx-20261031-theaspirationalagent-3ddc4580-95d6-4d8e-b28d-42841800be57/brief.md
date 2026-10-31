# Implement fix round — Dispatch Brief
```brief
AF-scope (TASK-S4Q8F) fix round, from head 47f3b4f2195d2ff544815ea29a410c3a335864ba. Task operator: Tarn; engineering constraints: Soma; not a decision by the owner Vasyl. Read the previous report in full: /srv/review-drop/TASK-S4Q8F-FROZEN-HEAD-VALIDATION.md (sha256 5211c99422b19681b5f098096b9713a4723b6cefacfb3fc7f03c246aad35a598).

DEFECT (your batch-isolation probe, exit 1): in an opt-in incoming batch, one item's stale captured ref (m1, whose registration was removed during A admission) also makes the unrelated current m2 refuse as admission_stale. Cause per your report: registration-view.ts:135-146 keeps one captured ref in a closure shared by the batch; channel-registry.ts:1961 checks it before m2's admit captures its own.

DO: capture and check currentness PER ITEM (each item captures its own ref before A and checks only its own after A/B awaits); stale m1 → refused; m2 → as without the defect. Keep EVERY existing A/B check, epoch, grant, verdict and sidecar (nothing weakened or removed). Focused regression tests through the real WebSocket→framework→ChannelRegistry path: B-off and B-on batches; stale-first/stale-last/all-stale/none-stale; a mixed batch with an unknown registration; commit batch-preprobe as a test (without internal paths). A mutant that returns the shared closure is killed. The 4 earlier mutants still killed at the new head. The serialized profile-off differential is repeated at the new head (byte-identical to base 29edcf8b, or explicit differences).

GATES: fresh at the new head: base 29edcf8b may be REUSED only with demonstrated identical bindings (the same Node executable sha256, the same node_modules closure (lock/`npm ls` hash), the same settings), labelled "reused"; otherwise fresh. Node 22.23.3 (/opt/node-v22.23.3-linux-x64/bin/node) and 22.12.0 (your node_modules/.runtime), absolute executable path, sha256 + `node --version` preflighted BEFORE npm; AF_TEST_CONCURRENCY=8; a 16G systemd --user scope; `timeout --signal=TERM --kill-after=60s 3000s` around the stage; log capped at 64 MiB with producer/capture exits; 124/137/141/cap/capture≠0 = inconclusive. Exact numbers and failure names. No retry-until-green or "environmental". A progress line from observed activity every ≤4 min. Process reconciliation after the set (read-only; don't kill survivors, report them).

COMMITS: per concern, author/committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`, no internal names or private paths. No push, no dependency/lockfile, no typing/C. The report: diff file:line, tests, mutants, profile-off, cells, survivors.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-a9d8d5d2-3729-4a6f-b3b8-d50873d1728d, run run-01M67QDRZ11X7TTXYZ7P5VPY9Z, in your own native session and the same worktree.
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