# Implement fix round — Dispatch Brief
```brief
C fix round 1 (TASK-PK8RC) + rebase. Read review 1 IN FULL: /srv/review-drop/TASK-PK8RC-REVIEW1.md (sha c22afffb…). First, rebase the slice (08a0ec8392d01d0cedd4017cc15d4fa4fd88f15b, on B 27a32127) onto B LOW head 29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04 (`git rebase --onto 29edcf8b 27a32127`); record conflicts and the range-diff. Then fix:
MEDIUM (call of the task operator Tarn, not the human owner Vasyl): option (a). Ownership governs only who may start/stop/move an indicator; the owner handover must NOT delete the channel's typingMetadata, and owned 7 s refreshes carry the channel's last host-supplied hint; ordinary startTyping(ref, metadata) while owned may update the stored hint (metadata only, not ownership/start/stop). Fix docs/reply-routing.md:120-121 and changelog.d/owned-typing.fixed.md honestly; replace the "owned acquisition drops unowned hints" tests with ones asserting metadata is preserved and that unscoped metadata doesn't change the owned TARGET channel (ChannelRef), only the hint. No new thread field (out of scope).
LOW stopAll: pin the shutdown stop per indicator in a test (don't zero calls before the assertion); add the channels.typing grant check to sendTypingStop (like sendTypingNotification) with a test; mention the wire delta in the changelog.
LOW stale binding: when a stale reply binding is detected (where the private notice is injected), call stopTurnTyping(routing), or re-check liveness on the refresh tick; test: non-transport invalidation → refreshes stop.
LOW forceStopTyping: mark @internal/host-only in the doc comment and docs (don't change the export if that breaks the API; give a rationale).
LOW idle-TTL/endDroppedTurn and the unowned sweeper: only notes in docs/report, no code.
inbound-admission.ts and B's reply files: no changes beyond what the rebase requires. Disabled mode: no automatic typing (keep the guards and the test). Separate commits, Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com> + trailer Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>. Gates: typecheck+build+npm test on Node 22.23.3 AND 22.12.0 in a 16G scope via orgasmic dispatch gate, plus the base 29edcf8b on 22.23.3; report pass/fail/skip/cancelled exactly; don't pass off reused receipts as fresh. Mutations for the new guards. Update the PR body (stacked on B). No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-ca00445c-01c3-4a08-9d61-be91beaf0ab3, run run-01M67A45AAA93376VDXNYS0VY1, in your own native session and the same worktree.
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