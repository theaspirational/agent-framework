# Implement fix round — Dispatch Brief
```brief
C (TASK-PK8RC) fix round after the REJECT of the bounded delta review, from head 3c95d166242892206b5e1e5d624b3c9ebb062323. Task operator: Tarn; engineering constraints: Soma (programme qualifier); not decisions by the owner Vasyl. Read in full: /srv/review-drop/TASK-PK8RC-LOWS-DELTA-REVIEW.md (sha256 d3fc9c74643663deda6f1bf98da3405ff2163b2c8906374aaa914b9f7ff70b22). Its probes are in that reviewer's evidence dir and in /tmp/pk8rc-rev3.

FIX (with file:line from the review):
1. HIGH-1 (channel-registry.ts:2746-2748): only the HINT (typingMetadata) and the stamp are provenance-gated. Delete the ChannelEntry when it is the current entry at the key and there's NO record of a strictly newer (connection, epoch) than the caller's. Record-less entries (lazy registerEntry:2252 / ensureChannelRegistered) get the pair at registration if it's obtainable from the transport event; otherwise they're retirable as an entry (the hint stays conservative). replacedWithinEpoch does NOT block retiring the current entry with a current pair. A mismatch with a NEWER replacement still spares its entry, hint and stamp (Soma's binding condition).
2. HIGH-2 (channel-registry.ts:2717 + framework.ts:34399): remove the function-level current-connection guard; serverRemovals++ and the defaultPublish* reset always run on the captured pair; gate retirement per entry. The second disconnect pass must act again (a late-registered channel is removed); fix the docs/reply-routing.md sentence.
3. MEDIUM doubles (test/channel-lifecycle-order.test.ts:1838,1866): restore a registered identity in both tests (the production path); add a separate explicit ID-only legacy variant. Assertions unchanged.
4. MEDIUM mutants: split them so the captured comparison and the current lookup are each removed ALONE; for each, a witness (a stale teardown where the current lookup would pass but the captured pair wouldn't, and vice versa). If one conjunct has no scenario, say so and remove the redundant conjunct instead of claiming both are proven. The CAPTURED pair is the basis (condition (2) forbade the current lookup as the basis).
5. MEDIUM wire (:1754-1757): a removal with a current pair and no newer-provenance entry → accepted:true and deletion (base behaviour).
6. LOW: restore the unconditional forceStopTyping(ref) on an identified removal with no entry; move the stamp reap before the refusal return.
NEW TESTS: lazy push entry → disconnect retires it; same-epoch re-announce → removal/disconnect retires it; an earlier-epoch entry → disconnect retires it; the second pass removes a late registration and serverRemovals == 2; resolveChannel on a dead server = an error. Keep the same-pair stale-teardown gap test.
BOUNDARIES: no admission/transport production changes; legacy ID-only public API unchanged; stopAll restore unchanged; no new identity subsystem.
GATES: a matched pair on ONE frozen node_modules closure (the same for base 3c95d166 and the new head; lock/`npm ls` as evidence, not committed), Node 22.23.3 /opt/node-v22.23.3-linux-x64/bin/node and 22.12.0 /tmp/task-pk8rc-tools/node-v22.12.0-linux-x64/bin/node (sha256 + --version preflighted), AF_TEST_CONCURRENCY=8, a 16G scope + MemorySwapMax=0, `timeout --signal=TERM --kill-after=60s 3000s`, a 64 MiB cap with producer/capture exits; 124/137/141/cap = inconclusive. Exact numbers + failure names. Progress from observed activity every ≤4 min. Read-only process reconciliation after the set (report survivors, don't kill them).
COMMITS per concern, author/committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`, no internal names. No push.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-6efef37a-a49f-4ee7-8ace-3a5bfb531f9b, run run-01M67PQ853E43HZ3FBZBQSDAB9, in your own native session and the same worktree.
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