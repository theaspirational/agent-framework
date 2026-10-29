# Review — TASK-0NN56 (fork main = upstream main + #233 + #361 + recipient compatibility)

Heads reviewed: `feat/typing-budget-recipient` = `72fe3f8df64393d4c05183d05b0e0e7f6f67a9e4`,
`recipient-on-main` = `57424a0e1e851331357a721b2822720f89097a47`.
Base confirmed `0f11975e485c7077c6ed7cad9261621cd310a700` (ancestor of both; `git log 0f11975e..recipient-on-main` = exactly the three layer-3 commits).

## Verdict

**APPROVE** — with three MEDIUM findings to land before the upstream PR and before the
release set is driven on Soma. Nothing blocks the local fork main as specified: all three
layers are separable and faithful, the red-first evidence is genuine, both suites reproduce
byte-for-byte under the mandated toolchain, and the MCPL extension is fail-closed with no
trust or authority escalation. No push, PR, or main-checkout change was made by me; the
worktree is restored detached at `72fe3f8d` with a clean tree.

## Findings

### MEDIUM

**MEDIUM src/framework.ts:24288 (correctness) — the frozen envelope is adopted only when the
start *opens* a turn, so a recipient wake that joins an already-open logical turn loses it and
its reply is never delivered.**
`if (opensTurn) routing.recipientReply = trigger?.recipientReply;` is the only place the turn
takes the envelope. In the non-resume branch (24278-24285) an existing `openLogical` entry is
reused with `opensTurn = false`, so if that open turn has no `recipientReply` the recipient
trigger's envelope is dropped from `routing` while the trigger still carries it; the guard at
24292 (`if (routing.recipientReply && trigger)`) then does nothing. Every prose path reads
`routing.recipientReply`, and `deliverSpeech` on a `recipientRoutingEnabled` server refuses
without one (channel-registry.ts:6191-6197), so the turn fails closed and the human's mention
goes unanswered. The converse ordering *is* handled (19826: an open recipient turn requeues a
non-matching wake) and a continuation that arrives without the envelope *is* repaired (19838) —
this one direction was missed.
Failure scenario / probe: `$ORGASMIC_EVIDENCE_DIR/probe-open-turn-adoption/open-turn-adoption.mjs`
(real `AgentFramework.create`, real compile/stream, recipient-enabled registry). With a
non-recipient logical turn already in `openLogical`, the admitted wake produces
`membrane calls: 1`, `publishes: []`, and
`[routeSpeech] assistant: turn has no locus … speech NOT routed (5 chars stay in chronicle)`.
The control (`control.mjs`, identical but without the pre-existing open turn) publishes
`[["slack:CROOM","100.001"]]`. Note the probe *stubs the precondition* (it injects the open
routing object); I did not construct a production path that leaves a non-recipient logical turn
open while the agent is idle, so reachability is unproven — but `resumesLogicalTurn` is only
`context_budget_restart`/`tool_result_guard_retry`, and nothing in the layer-3 logic asserts the
invariant it depends on.
Fix direction: adopt the trigger's envelope whenever the joined routing has none
(`routing.recipientReply ??= trigger?.recipientReply`), or extend the 19826 gate so a recipient
wake also refuses to join a turn it does not own. Add the missing row to
`test/recipient-compatibility.test.ts`.

**MEDIUM src/host-recipient-protocol.ts:21,82-83 (security / design) — `HostAccessPolicy.writeChannels`
is validated at construction and then never consulted; the write allowlist gates nothing.**
`accept()` uses `readJoinedChannels` and `dmUsers`, but `writeChannels` appears nowhere else in
`src/` (`grep -rn writeChannels src/` → only the interface and the two validation lines). A
mention in any joined, readable channel therefore mints a reply envelope
(`host-recipient-protocol.ts:124-127`) and automatic prose publishes there, even for a channel
the operator deliberately left out of `writeChannels`. Failure scenario: operator configures
`writeChannels: ['CROOM']`, agent is mentioned in joined channel `CHELP` → `accept()` returns
`store: true, triggerInference: true` with `recipientReply.channelId = 'slack:CHELP'`, and the
agent auto-replies into `CHELP`. The field reads as an authorization boundary in both the config
and the type, which makes it a live foot-gun rather than a cosmetic one. This is inherited
verbatim from the source patch, so it is a *porting* fidelity pass but an upstream-PR defect.
Fix direction: enforce it in the non-DM lane of `accept()` before minting the envelope, or drop
the field and state in `docs/recipient-compatibility.md` that send authorization is entirely the
host's.

**MEDIUM src/mcpl/channel-registry.ts:2357 (dropped ported behavior, unmentioned) — the source
patch's suppression of the latest-inbound reply anchor for context-only arrivals was not ported,
and the report does not disclose the deviation.**
The authoritative patch (sha256 `2a9ce06c…`, verified against 110 identical copies; the
`/home/orgasmic/pubcopy` and `/var/tmp/TASK-RVAJ6-preserved-…` copies are a different
"editorial-before" blob, `622b5b21…`, differing only in one context line) guards `markAccepted`
so that a `wakeAllowed === false` message does not become `defaultPublishChannel` /
`defaultPublishMessageId` / `defaultPublishThreadId`. Layer 3 ports no equivalent: `wakeAllowed`
appears only in `support-recipient-target.ts`, `host-recipient-protocol.ts` and
`channel-registry.ts:2044`, and `noteDeliveredOrPark` (framework.ts:17501) still anchors every
non-marker inbound. Failure scenario: a context-only Slack arrival in `COTHER` becomes the
"message the agent is replying to" — `ChannelContext.incoming` (channel-registry.ts:2585-2592,
told to the Slack adapter with that channel/messageId/threadId), plus the refusal-reaction target
(framework.ts:13585) and the failure-log locus (framework.ts:31958). Automatic prose stays frozen,
so this is not a misroute by the framework, but the guarantee is weakened exactly at the adapter
boundary the extension exists to protect. The report justifies only one deliberate omission (the
pre-publication streaming filter, which I agree is genuinely unnecessary now that outgoing
speech is emitted after confirmed delivery); this one is undisclosed.
Fix direction: port the guard (skip `noteDelivered` when the bridge is installed and
`isSupportContextOnly(metadata)`), or record the deviation and its reasoning in
`docs/recipient-compatibility.md`.

### LOW

**LOW docs/recipient-compatibility.md:62 (docs) — the qualification mapping table cites
`budget-refusal-hold.test.ts`, which does not exist on `recipient-on-main`**, the branch the
report designates as the upstream PR source ("Use `recipient-on-main` as the standalone source").
Verified on that head: `test/budget-refusal-hold.test.ts` MISSING, `test/stop-step-throws.test.ts`
present. Same class: `changelog.d/recipient-compatibility.added.md` claims envelope retention
"across … budget holds", a feature upstream main does not have (the docs do disclose the
conditional skip two paragraphs later, so this is wording, not a false test claim).
Fix: make the table row conditional, or scope it to the stacked fork branch.

**LOW (provenance / convention) — commit trailers name a vendor, not a model, and the re-landed
PRs carry no co-author credit.** All six commits use
`Co-Authored-By: OpenAI <noreply@openai.com>`; CONTRIBUTING.md:82 asks for "a `Co-Authored-By:`
trailer naming the model", and all 174 trailers in the last 400 upstream commits name one
(`Claude Opus 5.5`, `Claude Fable 5.1`). Layers 1 and 2 re-land Aspirational's #233 and
nissa-seru's #361 under a new author with no `Co-Authored-By` for them; the commit messages do
name the source PR and the exact source SHAs, which is adequate provenance for a fork but worth
fixing before anything derived goes upstream.

**LOW /srv/review-drop/TASK-0NN56-REPORT.md (report accuracy) — the "owner accepted replacement
tests" attribution is wrong.** The report states "as explicitly accepted by the owner", "The
owner confirmed the historical sources are unavailable and explicitly accepted replacement
tests", and "**None remain under the owner's clarification.**" That answer to
`ask-c1461fc2eb994297bbfa16e4d29b37b7` was the manager's (Tarn's) call, not Vasyl's. Judged on
merit the replacement-test decision is sound and the witnesses delivered match what was asked
(a–f all have coverage), but the report implies an owner sign-off that did not occur and should
not be read as one. The 366/21 figure is correctly reported as unreproducible.

**LOW test/recipient-compatibility.test.ts:70,80,96 (test) — the new public surfaces are
exercised through `as any`.** `(x.registry.routeSpeech as any)`, `(x.registry.stopTyping as any)`,
and the `ChannelRegistry` options object `as any` were necessary to make the file compile against
layer 2 for the red-first run (and the red log confirms behavioral, not compile, failures), but
they mean the tests no longer type-check the `routeSpeech`/`stopTyping`/`recipientServerId`
signatures. A post-green follow-up that drops the casts would restore that.

**LOW src/framework.ts:19826-19831 (behavior nit, opted-in hosts only) — the early requeue
bypasses the busy path's bookkeeping.** While a recipient turn is open, non-matching wakes are
pushed back raw and `continue`d, skipping the `newestByKey` wake absorption and the
`inference:request_stale` / `[inference-stale]` diagnostics that the busy branch below would
apply. No request is lost or duplicated (same objects, re-pushed), and absorption happens once
the turn closes, but a stuck recipient turn would be invisible to the stale-wake telemetry.

## Verification Gates

All run by me in this worktree through `orgasmic dispatch gate`, Node **22.23.3** (`/opt/node/bin`),
Bun **1.4.3** (`/home/orgasmic/.local/bin/bun-1.4.3`), `AF_TEST_CONCURRENCY=8`. Logs in
`$ORGASMIC_EVIDENCE_DIR`.

| Head | Gate | Command | Result |
| --- | --- | --- | --- |
| `72fe3f8d` | `reviewer-stacked-build` | `bun-1.4.3 install && npm run clean && npm run typecheck && npm run build && npm run pretest` | PASS (exit 0) — `gate-reviewer-stacked-build-01M63DPWMPP3JMS38N8KJQ5A1N.log` |
| `72fe3f8d` | `reviewer-stacked-suite` | `AF_TEST_CONCURRENCY=8 npm test` | PASS — **tests 9329 / pass 9266 / fail 0 / skipped 63**, 500 suites, 1 014 193 ms — `gate-reviewer-stacked-suite-01M63DQDGEC3MAZ9R42C1NQ0Q1.log` |
| `57424a0e` | `reviewer-standalone-build` | same build chain | PASS (exit 0) — `gate-reviewer-standalone-build-01M63EPS889QJC01BZA0RZV6MW.log` |
| `57424a0e` | `reviewer-standalone-suite` | `AF_TEST_CONCURRENCY=8 npm test` | PASS — **tests 9235 / pass 9171 / fail 0 / skipped 64**, 496 suites, 287 952 ms — `gate-reviewer-standalone-suite-01M63EQ4XVHMD7KJG114754B6Q.log` |

Both numbers match the implementer's reported counts exactly (9329/9266/0/63 and
9235/9171/0/64), including the standalone branch's one extra conditional skip. Package stays
`@animalabs/agent-framework@0.30.0`; no tracked dependency edits.

Unwrapped probe (no reusable receipt): `/opt/node/bin/node` on the two files in
`$ORGASMIC_EVIDENCE_DIR/probe-open-turn-adoption/` — transcripts quoted in MEDIUM finding 1.

### Brief checklist, item by item

1. **Layer 1 faithful to #233's five feature commits.** Confirmed. `e7f161a9` reproduces
   `disabledTypingChannel`, the `routable`/`silentOnly` batch split (both `for` loops), the
   disabled-mode early and mid-turn typing selection, the `channels.typing` grant check on
   `sendTypingStop`, and the tune-out stop. Correctly adapted: `ChannelRef`/`channelNamed`
   instead of bare ids, and `mayTakeGateRoute` (framework.ts:19551) in place of #233's
   `conversationAgentHomes` fork-binding check — semantically equivalent (home → `sameChannel`,
   no home → not any other agent's home). `stopTyping` is placed after the durable
   `appendLifecycleEvent` + `desiredStates.set` (channel-registry.ts:3157-3173), preserving
   1c2d3537's durable-first ordering (current main already appends first). Only intentional
   semantic delta: an ambiguous `trigger.channelId` now resolves to no destination instead of a
   guess — documented in the added comment and in the changelog fragment.
2. **Layer 2 faithful to #361 net `e85c57db..5e41150d`; nothing dropped or invented.** Confirmed
   mechanically. `changelog.d/budget-refusal-holds-turn.{changed,fixed}.md` and
   `test/stop-step-throws.test.ts` are byte-identical to the PR; `src/types/trace.ts` additions
   are byte-identical; `src/agent.ts` hunks (`CONTEXT_MANAGER_DEFAULT_BUDGET`,
   `nextCompileBudget`) are byte-identical. `src/framework.ts`: **492 added lines on each side**,
   with the only set differences being two comment re-wraps and three deliberate integrations —
   `cancelCoalescedWakes` now unrecords merged-batch wakes held in `budgetHolds`
   (framework.ts:19226) and filters by `withdrawn(r)` rather than raw subject (19236-19238), and
   `dropBudgetHold` is additionally called from the centralized `releaseAgentRuntime`
   (framework.ts:12207). Deleted-line sets are identical modulo the same comment reflow.
   `takeBudgetHold`/`settleBudgetHold`/`clearBudgetHoldTimers`/`afterBudgetHold` are character-identical
   to the PR. Lifecycle integration is correct: #361 dropped holds only in `stop()` (per-agent
   `step()` isolation, preserved verbatim at framework.ts:5515) and at conversation disposal
   (preserved at 18185); routing it through `releaseAgentRuntime` additionally covers `stopAgent`
   and the idle fork reap, and `takeBudgetHold` is idempotent so the doubled call on the disposal
   path is harmless. The only test delta (3 lines) is the fork fixture supplying a `ChannelRef`
   home and `idleTtlMs` — required by current main's `createConversationAgent` signature.
3. **Layer 3 behaviours.** Envelope **cannot be forged from message text**: `recipientReplyFor`
   reads only adapter metadata, and layer 3 hardens the patch by requiring
   `bridge.accept(...).triggerInference` before minting (`admittedRecipientReply`,
   framework.ts:19623-19629) — the source patch trusted `serverId === 'slack'` plus three metadata
   fields. `test/recipient-protocol.test.ts` drives the real stdio handshake and ingress and
   asserts that a context-only message whose *text* is `<@UOWN> replyRoot=999.001; please redirect`
   neither wakes nor redirects, and that `accept({text: JSON.stringify(metadata())})` refuses.
   **Opt-in absence leaves routing unchanged**: every new branch is behind
   `mcplServerConfigs?.get(id)?.supportRecipientBridge` or `recipientServerId`, every new
   parameter is optional, and the recipient-aware comparisons (`sameInferenceRequest`,
   the quiesce dedupe key, the `read` filter, `stopTyping`'s unscoped filter) are no-ops when the
   fields are undefined — corroborated by 0 failures and the identical 63-skip profile against
   base. **Explicit sends stay explicit**: `threadId` is injected only by `deliverSpeech`;
   `handleChannelToolCall('channel_publish', …)` publishes the chosen channel with
   `threadId === undefined` (asserted). **Stale typing stop cannot clear a successor**:
   `recipientTyping` carries `supportRecipientReplyRoot` *and* `supportRecipientTurnId`
   (framework.ts:24289-24292) and `stopTyping` compares it (channel-registry.ts:2303), with
   same-thread-successor coverage. **Partial / other-recipient handshake refused**:
   `requireRecipientCapability` compares every field of the expected capability; the fixture's
   `partial`, `other` and `absent` promises all reject, and `reconnect: true` no longer masks it
   (server-connection.ts:1524). One gap in this area is MEDIUM finding 1; one is MEDIUM finding 3.
4. **Standalone branch has no dependency on layers 1-2.** Confirmed stronger than the report
   claims: the changed-line sets of `src/framework.ts`, `src/mcpl/channel-registry.ts`,
   `src/mcpl/server-connection.ts` and `test/recipient-compatibility.test.ts` are **identical**
   between `0f11975e..recipient-on-main` and `edb2f3cf..72fe3f8d` (0 delta lines), and the other
   eight files are byte-identical blobs. `git grep` on `recipient-on-main -- src/` finds no
   `budgetHolds`, `afterBudgetHold`, `releasedByBudgetHold` or `disabledTypingChannel`; the only
   hits are the three `x.f.budgetHolds` guards in the conditionally-skipped test row. The
   standalone suite builds, typechecks and passes on its own.
5. **Tests red-first and meaningful.** The red receipts are behavioral, not compile or import
   failures: `gate-liveness-red-confirm` on layer 1 → `not ok 1 … AssertionError: 'the unique
   subsequent reply arrives without a rescue wake'` with the fresh-after-summary control `ok 2`;
   `gate-recipient-red-expanded` on layer 2 → 14 of 15 assertion failures with the explicit-send
   control already green; `gate-recipient-restart-red` → the tool-driven restart row red. The
   tests themselves exercise reality, not stubs: `recipient-compatibility.test.ts` runs
   `AgentFramework.create` with a real context manager, a real tool round, a real
   `inference:stream_restarted` budget restart (asserted via trace) and a real retry policy;
   `recipient-protocol.test.ts` spawns an actual stdio MCPL peer over `initialize` /
   `channels/register` / `channels/incoming` / `push/event` / `channels/publish`;
   `budget-hold-liveness.test.ts` asserts exactly one provider call, one stored answer, one
   `inference:completed` trace and `budgetHolds.size === 0` after the hold releases with no
   rescue wake. The synthetic compressor boundary is labelled as such.
6. **Security of the local MCPL extension — no trust or authority escalation.** The extension is
   strictly *restrictive* on the opted-in connection: `inference/request` is refused outright
   (framework.ts:35161), `push/event` and `channels/incoming` are re-validated per message and
   refused with a per-message reason, context-only arrivals are force-vetoed
   (`decision.wake = false; decision.locus = false`), automatic prose without an envelope fails
   closed, a failed recipient connect aborts startup instead of failing open
   (framework.ts:32538) and is not retried. `CapabilityGrant` derivation, `allowHostCommands`
   and §5.4 authorization are untouched; `slackRecipientRouting` is advertised outside the MCPL
   manifest and mints no capability. `recipientRoutingEnabled` is set only from local config, and
   the extra `config.id !== 'slack'` guard (server-connection.ts:1405) hardens the patch. The
   `6324a1a4` optional-chaining fix defaults to feature-off, which is the safe direction. The one
   security-relevant gap is MEDIUM finding 2 (inert `writeChannels`); the handshake is correctly
   documented as an attestation, not proof of trustworthiness.

## Unmet criteria / test gaps

- Acceptance "three separable layers, each tested" and "recipient behaviours qualified with the
  frozen pr361-v1 tests mapped onto the new code" are met, with the caveat that the 366/21
  historical selection is unreproducible — correctly declared, and the manager-directed
  replacement witnesses (a)–(f) all exist with red-first receipts. No push or PR was made.
- No test covers a recipient trigger landing on an already-open logical turn (MEDIUM 1).
- No test covers the latest-inbound anchor after a context-only arrival (MEDIUM 3); the
  qualification map does not mention the anchor surface at all.
- No test asserts that `writeChannels` constrains anything — because it does not (MEDIUM 2).
- The host-side contract (`ChannelContext.incoming`, adapter use of `threadId`) is exercised only
  against the synthetic fixture. No host graph, live connector or provider was tested, by them or
  by me; the release-set qualification on Soma/Rook/Heron remains entirely ahead.
- `recipientReply.channelId` must literally be `slack:<C|G|D>…` and the registered descriptor id
  must match it; this coupling between the host's channel-naming convention and
  `freezeRecipientReply`'s regex is asserted only by tests that adopt the convention. A host that
  registers bare Slack ids would silently get no envelope (`recipientReplyFor` swallows the
  throw) and then fail closed on every automatic reply.

## Residual risk

- MEDIUM 1's reachability is unproven; if a non-recipient logical turn can be open while the
  agent is idle on the deployed host, replies to mentions are silently lost (chronicle-only).
  This is the risk I would most want closed before Soma.
- `stopTyping()` with no argument now deletes `typingMetadata` only for channels with a running
  interval, where upstream cleared the whole map (channel-registry.ts:2286-2296). I found no path
  that leaves metadata without an interval (`startTypingAt` sets both, scoped stops delete both),
  so I am recording this as a difference, not a defect.
- A frame-terminal `stopTurnTyping` whose routing's `recipientTyping` does not match the running
  indicator intentionally leaves it alone; I could not construct a case where no successor then
  owns the stop, but a Slack indicator left refreshing is the failure mode if one exists.
- The 0.30.0 package version is unchanged, so nothing downstream can distinguish fork main from
  upstream main by version — intentional per the report, but the release set must pin by SHA.
- Suite wall-clock differed sharply between heads in my runs (1014 s stacked vs 288 s standalone,
  same machine and concurrency). The stacked run was concurrent with other work on this box, so I
  attribute it to load rather than to the hold feature; no performance claim either way.

## Fix directions

1. `framework.ts:24288` — `routing.recipientReply ??= trigger?.recipientReply` (or widen the
   19826 ownership gate), plus a regression row driving a recipient wake into an open
   non-recipient turn.
2. `host-recipient-protocol.ts:124-127` — enforce `writeChannels` for the channel lane before
   minting the envelope, or delete the field and say so in the docs and the PR body's non-goals.
3. `framework.ts:17501` / `channel-registry.ts:2357` — skip the anchor update when the bridge is
   installed and `isSupportContextOnly(metadata)`, matching the source patch; otherwise document
   the deviation next to the streaming-filter justification.
4. `docs/recipient-compatibility.md:62` — do not cite `budget-refusal-hold.test.ts` from the
   branch that does not contain it; soften the changelog's budget-hold clause the same way.
5. Commit trailers — name the model per CONTRIBUTING.md:82, and add `Co-Authored-By:` for
   Aspirational (#233) and nissa-seru (#361) on layers 1 and 2.
6. Report text — attribute the replacement-test decision to the manager, and drop "None remain
   under the owner's clarification"; the owner's button has not been pressed on anything.
7. After green, drop the `as any` casts in `test/recipient-compatibility.test.ts` so the new
   signatures are type-checked.
