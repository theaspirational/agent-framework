# Implement fix round — Dispatch Brief
```brief
Fix round 2 for TASK-MD5AH, upstream PR anima-research/agent-framework#937 (head 43df5ab0799db0aeea7b682dc3666a335007f3fa on upstream main 71193a9fefdba30bb2ffa1c0c092464305973491). Continue on branch task-md5ah-impl. The owner has approved this round. NO PUSH; I publish.
Inputs (read in full, read-only):
- The upstream bot review: /tmp/pr937-reviews.json (summary, incl. 3 LOWs) and /tmp/pr937-comments.json (5 inline MEDIUMs, full text in the "body" fields). Also /tmp/pr937-issue-comments.json.
- Our re-review 2: /srv/review-drop/TASK-MD5AH-REVIEW2.md (4 LOWs).
Fix all of them, each with a failing-before test where it's a behaviour change:
B-M1 (event-gate.ts ~3874): different per-recipient remainders must not write several lines into the shared slot that show residents events they already answered. Design it so that each resident's shared-slot view is correct. If a single correct line isn't possible, state the trade-off explicitly.
B-M2 (~3872): the partial-group line must go to the shared slot (sharedSlotReaders), not to group.agents[0], which may be a fork. Handle fork recipients correctly.
B-M3 (~3840) and our LOW-3: on fence release, intersect with the current recipients (gate recipients / receivesGateWakes). Drop the fence's events for an agent that is gone, with no write and no inference request.
B-M4 (~3857): hold events only for the recipient that can satisfy them (placement.agent === recipient). Others get them without the fence delay.
B-M5 (~3882) and our LOW-2: a trace counts each event once per delivery occurrence. No double counting across immediate and fence release. Document the emission sites (fireDebounce, buffer flush, fence release) in the changelog.
Our LOW-1 (two fences on the same event giving duplicate lines): fix, or show it's solved by B-M1/B-M2.
Our LOW-4 (~4392-4409): the delivery microtask must re-check disposed||quiesced||inferring and put the events back on the fence. Apply the same to flushInferenceBufferIfClear only if it's a minimal, clearly safe change; otherwise leave the pre-existing pattern and say so.
Bot LOWs: read all 3. Make gateWriteDone share logic with deferredWriteDone/storedMessageDone (framework.ts ~31199-31216) if possible without behaviour change. Make the changelog's "at most 65 seconds" claim accurate. Handle the third.
Rules:
- ls-remote upstream main first. If it moved, rebase (no squash, no rewording of existing commits).
- New commits with author/committer Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com> and the trailer Co-Authored-By: GPT-6-Astra <noreply@openai.com>. Topic-only commit subjects. No internal names (orgasmic, task ids, hosts, agent names) in commits, code or the body.
- No upstream test edits. Gates on base and head, Node 22.23.3 (/opt/node/bin) and 22.12.0 (/tmp/credential-engines/node-v22.12.0-linux-x64/bin), the same command as last round, under XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0.
Output:
1. a disposition table covering all 5+3+4 findings
2. BEGIN BOT REPLY ... END BOT REPLY: a concise reply to the bot review, keyed by finding title/file:line, saying what changed with commit shas
3. BEGIN PR BODY ... END PR BODY: the full updated body (same style as now, updated test counts)
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-83696874-4e33-441b-9797-41e870ee45ff, run run-01M66PGEXQQHMGRMTPS5J2BY1K, in your own native session and the same worktree.
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