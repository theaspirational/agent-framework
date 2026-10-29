# Implement fix round — Dispatch Brief
```brief
Polish round for TASK-HVQ8K on task-hvq8k-impl (HEAD 02ee294731a2e171aa0eae7533f7ec7b7129a2c0, 6 commits on upstream 4a45766f019fa11c8699645bd6806ebf3e13e5d1). Owner button hvq8k:polish: fix the three items below, no further review, manager gates after. Read /srv/review-drop/TASK-HVQ8K-REVIEW2.md in full first.
1. Result-borne hints (RFC-014 carrier 1): suppress `tapResponse` for required connections at src/mcpl/server-connection.ts:2485, the same shape as the push-tap suppression at :2522, so a required connection never applies hints from any carrier without a verdict. Unconfigured connections must stay byte-identical. Add a real-WebSocket test pair like the carrier-3 one (required: rev unchanged, no recovery timer, 0 taps, 0 hooks; unconfigured control: legacy behaviour). Red-before. Update docs/required-inbound-admission.md and the changelog so they state that required connections apply no peer hints from any carrier.
2. Promote the connector-delta check into a committed test (e.g. test/routing-runtime-has-no-connector-literals.test.ts) over the runtime files this series touches. It must pass on the final tree, fail if a new connector literal is added (show a mutation), and allow pre-existing upstream sites through an explicit inventory in the test.
3. Move the new import lines below the leading module docblock in channel-registry.ts, inference-router.ts, types.ts and protocol-family.ts.
Fold each change into the commit it belongs to (1 → shared core, its test in the cross-lane test commit, docs/changelog → docs commit; 2 → cross-lane test commit; 3 → the commit that added each import), keeping the 6-commit per-lane shape, the author/committer Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com> and the trailer `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Keep a recovery ref of 02ee2947.
Run every node/npm command under `XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0`; if that fails, say so and don't run uncapped. Gates on final HEAD: typecheck, build, full npm test (AF_TEST_CONCURRENCY=4) on Node 22.23.3 and 22.12.0, the admission files, lane-patch independence. Local only. Report: new commit list, per-item file:line, red-before, gate table.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-59f3ee50-9082-49fa-bee8-e9ec443a0455, run run-01M642DGGHHPVM127DKKJ91M1C, in your own native session and the same worktree.
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