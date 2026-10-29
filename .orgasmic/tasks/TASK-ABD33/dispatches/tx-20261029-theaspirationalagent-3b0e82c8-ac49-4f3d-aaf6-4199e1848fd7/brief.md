# Implement fix round — Dispatch Brief
```brief
TASK-ABD33 round 3, doc only. The owner answered all four owner questions in Telegram (recorded as task comments tarn-abd33-o1/o3/o4/o5):
- O1 abd33:o1:phased: H1->H2 in separate opt-in phases; H1 retained until qualified; stamps one-way, no downgrade over stamped history.
- O3 abd33:o3:listed: frozen status = only the enumerated tested guarantees (typing, anchors); other effects inventoried and bound one by one before being promised; no blanket frozenStatus.
- O4 abd33:o4:strict: strict W limits apply only to the new explicitly enabled required profile; unconfigured connections unchanged; before live migration verify no agent relies on hinted push / old-epoch replay / cross-epoch reply resumption, else separate design.
- O5 abd33:o5:keep: no new automatic recovery or simultaneous-start contract; keep current behaviour; add a focused owner/silent-resume regression test.
Update docs/design/GENERIC-RECIPIENT-ROUTING.md (now at 3251eace46be5d47ef7cd1f6a884c7fba188d249): turn the owner-questions table into a 'Owner decisions (2026-10-29)' table with each decision and its consequences, adjust any [open] markers and slice exit conditions these decisions settle (e.g. O5 test in the relevant slice, O4 pre-migration check in F/G), leave the maintainer questions open. No other changes. One local commit; rerun your design-source audit; no push/PR/Slack/Telegram. Report the final doc sha256.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261029-theaspirationalagent-94dc16fa-0753-415f-97ad-34c24f18b7f2, run run-01M63RH9GMQE1EVFFF5ZKGNW3X, in your own native session and the same worktree.
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