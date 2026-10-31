# Implement fix round — Dispatch Brief
```brief
C LOW round (TASK-PK8RC), on d3230a69002b493fef94e501fbf5cfc9a211080b. Read /srv/review-drop/TASK-PK8RC-REREVIEW1.md in full (5 LOWs). Calls on asks belong to the task operator Tarn; engineering constraints come from Soma (programme qualifier); none of this is a personal decision by the human owner Vasyl. Correct "owner-sanctioned" in docs/reports: the thread carve-out is Soma's engineering constraint under the programme/preservation contract; the thread path remains explicitly incomplete.
LOW-a (docs): describe the sequence where the same turn that moves away and back is locked out by a hint that arrived mid-lease (in the "Incomplete thread path" paragraph) + a test pinning that behaviour.
LOW-b (production, covered lifecycle engineering, Soma's EXACT boundary): delete a stored hint ONLY when that very registration/incarnation actually leaves the registry (handleChanged removal, removeServer). NOT on tune-out/closed-state changes, NOT on a transient disconnect that keeps the registration. A late teardown of an old incarnation must NOT delete the hint of a replacement registration. Use the existing connection/registration identity (epoch/generation/connection id, whatever is actually there). If the existing identity can't safely tell a replacement apart, DON'T do a broad delete by key: report the gap (BLOCKED-FOR-SCOPE on that item, the rest continues). Controls: remove→re-register (the old hint doesn't suppress automatic typing of the new registration); stale-old-teardown→new-hint (the late teardown doesn't delete the new hint); tune-out/disconnect-with-registration-kept (the hint survives). Outward typing stops still require the channels.typing grant; local retirement is not proof of platform clearing. Source + synthetic tests only.
LOW-c: the trace throttle keyed per destinationKey, as a BOUNDED map, reaped on the same lifecycle cleanup; a test that a yield on X doesn't silence Y, plus a bound.
LOW-d: changelog.d/owned-typing.added.md naming the 4 exports (startOwnedTyping, stopOwnedTyping, forceStopTyping, TypingOwner).
LOW-e: extend the AST no-connector-literals guard to earlyTypingChannel, driveStream typingChannel/followTurnLocus, sameTypingOwner/TypingOwner; a mutation (a literal) is caught.
Gates: full suite base+head on Node 22.23.3 and 22.12.0 in a 16G systemd scope, exact counts; mutations for b and c (killed). Per-concern commits on top of d3230a69, Vasyl noreply + Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-e84fee64-65c1-473f-8b0e-652c411b5313, run run-01M67F562WJRN2ADRE6XFVK9RM, in your own native session and the same worktree.
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