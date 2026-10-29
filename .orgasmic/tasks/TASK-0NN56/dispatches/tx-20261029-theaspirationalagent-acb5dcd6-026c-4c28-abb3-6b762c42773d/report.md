# Re-review 2 — TASK-0NN56 fix round 1 (agent-framework, local only)

Heads reviewed: stacked `feat/typing-budget-recipient` = `3e4e49901d745bc94c34963f2321d9b171454a0b`
(parent `72fe3f8d`), standalone `recipient-on-main` = `280ec03d60720642318b7408710ec4a2059bf525`
(parent `57424a0e`). Both parents confirmed unrewritten (`git log -1 --format='%H %P'`).
Round diff on each head: 6 files, 190 insertions, 25 deletions.
Read in full: `/srv/review-drop/TASK-0NN56-REVIEW1.md`, `/srv/review-drop/TASK-0NN56-FIX1.md`.

## Verdict

**APPROVE.** All three MEDIUMs from round 1 are resolved, and resolved correctly: the
requeue-not-adopt choice is implemented at both entry points with provider-admission
release, with no loss, livelock or starvation of either turn; `writeChannels` is enforced in
the channel lane only and I confirmed the denied-mention behaviour end to end on the real
stdio ingress path; the latest-inbound anchor is not moved by a context-only or
write-denied arrival. The four round-1 LOWs in scope (docs/changelog conditionality, cast
removal, report attribution) are fixed. Both branches' layer-3 added/deleted line multisets
are **identical**, verified independently. Typecheck, clean build and the full suite pass on
both new heads under the mandated toolchain.

No HIGH, no MEDIUM. Six LOWs, all carried into the upstream-PR/pre-Soma bucket rather than
blocking the local fork main. Nothing was pushed, merged or committed; the worktree is
restored detached at `3e4e4990` with a clean tree.

## Findings

### HIGH
None.

### MEDIUM
None.

### LOW

**LOW src/framework.ts:17494-17498 (test / report accuracy) — the new anchor guard is
unreachable on both live ingress lanes, and its regression row goes red only because it
calls the private method directly.**
`admit()` returns `locus: true` for a vetoed event (`src/admission/admit.ts:105-107`), but
layer 3 already overrode `decision.locus = false` for an opted-in context-only arrival at
`framework.ts:17629` (channel lane) and `framework.ts:19496` (push lane) **in the reviewed
parent** — that code is untouched by this round. All three `noteDeliveredOrPark` call sites
(17664, 17729, 17853) are behind that `locus` flag, so a context-only arrival never reaches
the method and never parks. My production-path probe instruments the boundary and confirms
it: for a genuine context-only arrival and for a write-denied mention, `noteDeliveredOrPark`
is **not called at all** (`Q2 reached-for-context-only: false`), while the anchor correctly
stays on the earlier addressed message. The new regression
(`test/recipient-compatibility.test.ts:427-443`) invokes `x.f.noteDeliveredOrPark(context)`
directly, so its red receipt (`gate-r1-final-red`, subtest 4: anchor moved to `slack:COTHER`)
was produced by the stub entry, not by a reachable path, and the row would not catch a
future change that re-enabled the anchor via the `decision.locus` route. The *required
behaviour* is correct and now defended in depth, so this is a coverage and reporting
accuracy issue, not a defect: the fix report's framing ("corrects the prior port's
undisclosed omission", "where delivered anchors are now recorded") overstates what changed,
and round 1's MEDIUM 3 premise was already satisfied in production.
Fix direction: keep the guard, but add (or convert the row to) an assertion driven through
`channels/incoming` / `push/event`, and state in the report that the guard is defence in
depth behind `decision.locus`.

**LOW src/framework.ts:19829-19835, 23511-23518 (observability) — both new requeue paths are
silent, and the scheduler one `continue`s before the stale-wake diagnostic, so a deferred
recipient wake is invisible forever.**
The scheduler block `continue`s at 19834 — ahead of the busy branch's
`inference:request_stale` trace and `[inference-stale]` line at 19975-20002, whose own
comment (19985-19988) designates that line as "the wedge's tell (idle+turn-alive, forever)"
for a leaked turn token and permanently requeued wakes. The direct-start block at 23518
returns with no trace and no stderr, unlike the adjacent provider-admission requeue at
23555-23557 which logs `[provider-admission] … wake requeued, not started`. Probe: with an
open non-recipient `openLogical` entry and a recipient wake aged 120 s, 200 scheduler passes
produce `inference:request_stale: 0`, `inference:request_dropped: 0`, the request intact with
its envelope and original timestamp, 1.0 ms total (so no spin). If `openLogical` ever leaks,
round 1's silent-loss failure becomes silent indefinite deferral with no telemetry at all.
Round 1's LOW on this bookkeeping now applies to a strictly wider case (any open
non-recipient turn, not only an open recipient turn).
Fix direction: emit one throttled trace/stderr line on the recipient-deferral requeue, or
let the recipient filter fall through to the busy branch's stale accounting.

**LOW src/framework.ts:23511 (behaviour nit, unproven reachability) — the direct-start guard
does not exempt `suppressProse` starts, which by design do not touch the open turn.**
A silent start takes a fresh routing object and is never registered in `openLogical`
(24292-24299, comment 24268-24274: "A silent start … neither takes nor disturbs an open
turn's"). The new guard keys only on `openLogical.get(agent.name)` and
`trigger?.recipientReply`, so a silent start carrying a recipient envelope would be requeued
if a prose turn were open. Continuations at 17103-17107 and 17220-17225 copy `suppressProse`
and `recipientReply` together from `activeTurnTriggers`, so such a trigger is constructible;
the comment asserts the coexistence cannot occur in production, but nothing enforces it and
the consequence would be a stalled silent turn rather than a dropped one.
Fix direction: add `&& !trigger.suppressProse` to the guard, matching the routing code's own
invariant.

**LOW src/host-recipient-protocol.ts:129 (design) — the new relaxation widens `store` for a
metadata combination that was previously refused outright.**
`metadata.wakeAllowed !== addressed` no longer refuses when
`addressed && !writable && wakeAllowed === false`. That relaxation is necessary (it makes
`admittedRecipientReply`'s re-acceptance at 19630 idempotent after the ingress lanes
normalise `wakeAllowed`), but it means a message is now stored while carrying
`routingReason: 'human-mention'`, `mentionIds: [botUserId]` and the server's
`chat:addressed` tag, and `isAddressedMessage(event.tags)` still reports it as addressed to
`admitInbound`. Probe confirms it causes no wake, no publication and no anchor move, so
there is no routing consequence today; the residue is that any surface counting addressed
inbound sees a mention that will never be answered.
Fix direction: note the asymmetry in `docs/recipient-compatibility.md` next to the
`writeChannels` paragraph, or have the bridge also report the narrowed routing reason.

**LOW src/host-recipient-protocol.ts:82-90 (design / docs) — `writeChannels: []` passes
validation and now silently disables every channel auto-reply.**
`.every()` on an empty array is `true`, so an empty or incomplete allowlist constructs
cleanly and every joined readable channel degrades to context-only; DMs are unaffected
because `writable` short-circuits on `access.kind === 'dm'` and the validator's
`/^[CG][A-Z0-9]+$/` excludes `D…` ids. The docs state the enforcement but not that an
omitted channel is the fail-closed default, which is the opposite foot-gun from round 1's
inert field.
Fix direction: one sentence in `docs/recipient-compatibility.md` (and the PR body's
configuration notes) that a channel absent from `writeChannels` gets no automatic reply.

**LOW (provenance, carried forward unresolved) — both new commits still carry
`Co-Authored-By: OpenAI <noreply@openai.com>`.**
`CONTRIBUTING.md:82` asks for "a `Co-Authored-By:` trailer naming the model"; layers 1-2
still carry no co-author credit for Aspirational (#233) or nissa-seru (#361). The fix report
states the neutral author/committer and the existing trailer convention were requested and
deliberately retained, and this round's brief does not assign it, so I record it as
unresolved rather than ignored. It matters only before anything derived goes upstream.

## Verification Gates

All run by me in this worktree through `orgasmic dispatch gate`. Node **22.23.3**
(`/opt/node/bin/node`), Bun **1.4.3** (`/home/orgasmic/.local/bin/bun-1.4.3`),
`AF_TEST_CONCURRENCY=8` on both suites. Logs in `$ORGASMIC_EVIDENCE_DIR`; chain transcripts
`chain-stacked.log`, `chain-standalone.log`.

| Head | Gate | Command after the wrapper | Result |
| --- | --- | --- | --- |
| `3e4e4990` | `rr2-stacked-install` | `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS (exit 0) — no lockfile change |
| `3e4e4990` | `rr2-stacked-typecheck` | `npm run typecheck` | PASS (exit 0) |
| `3e4e4990` | `rr2-stacked-build` | `bash -c 'npm run clean && npm run build && npm run pretest'` | PASS (exit 0) |
| `3e4e4990` | `rr2-stacked-suite` | `npm test` | PASS — **tests 9335 / pass 9272 / fail 0 / cancelled 0 / skipped 63**, 500 suites, 273 378 ms |
| `280ec03d` | `rr2-standalone-install` | `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS (exit 0) |
| `280ec03d` | `rr2-standalone-typecheck` | `npm run typecheck` | PASS (exit 0) |
| `280ec03d` | `rr2-standalone-build` | same clean build chain | PASS (exit 0) |
| `280ec03d` | `rr2-standalone-suite` | `npm test` | PASS — **tests 9241 / pass 9177 / fail 0 / cancelled 0 / skipped 64**, 496 suites, 316 485 ms |
| `3e4e4990` | `rr2-restored-stack` | `bash -c 'npm run clean && npm run build && npm run pretest && node --test --test-force-exit dist/test/recipient-compatibility.test.js dist/test/recipient-protocol.test.js'` | PASS — 30 / 30 / 0 / 0; worktree restored on the stacked head |

Each receipt records `HEAD <sha> clean=yes` at start and end. Counts match the implementer's
reported figures exactly (9335/9272/0/63 and 9241/9177/0/64), i.e. +6 passing tests over
each reviewed parent with the skip profile unchanged; the standalone extra skip is still the
budget-hold integration row. Package stays `@animalabs/agent-framework@0.30.0`; no tracked
dependency edits.

### Unwrapped probes (evidence, not reusable receipts)

1. `$ORGASMIC_EVIDENCE_DIR/probe-anchor-path/probe.mjs` — real `AgentFramework.create` with
   the real stdio MCPL fixture, `writeChannels: ['CROOM']`, `noteDeliveredOrPark`
   instrumented. Sent an allowed addressed mention in `CROOM`, a genuine context-only
   arrival in `COTHER`, and an addressed mention in readable-but-non-writable `COTHER`.
   Output: anchor stays `{slack:CROOM, 100.001}` throughout; `membrane calls (inference): 1`;
   `publishes: 1`; both denied/context arrivals stored (`context-only stored: true`,
   `write-denied stored: true`); `Q2 reached-for-context-only: false`. This is the
   production-path proof for brief items (2) and (3), and the basis for LOW 1.
2. `$ORGASMIC_EVIDENCE_DIR/probe-requeue-liveness/probe.mjs` — open non-recipient
   `openLogical` entry plus a recipient wake aged 120 s. After 200 `processInferenceRequests`
   passes: `pending 1`, envelope `{slack:CROOM, 100.001}` preserved, timestamp still aged,
   `inference:request_stale 0`, `inference:request_dropped 0`, `membrane calls 0`, 1.0 ms
   total. After deleting the open turn: the deferred wake runs (`membrane calls 1`) and
   `pending 0`. No loss, no spin, no starvation; basis for LOW 2.
3. Branch equivalence, computed by me (not reusing `audit-round.py`):
   `git diff --name-status 22454888 3e4e4990` is identical to
   `git diff --name-status 0f11975e485c7077c6ed7cad9261621cd310a700 280ec03d`; 10 of 12
   changed paths are the **same blob** on both heads (only `src/framework.ts` and
   `src/mcpl/channel-registry.ts` differ, as layers 1-2 touch them); and the per-file
   added/deleted **line multisets** of the two layer-3 diffs are identical for all 12 files
   (framework.ts 211 lines, channel-registry.ts 48, test files 429 + 171, etc.). The
   round-only diffs `72fe3f8d..3e4e4990` and `57424a0e..280ec03d` are byte-identical apart
   from five `@@` hunk offsets and `index` lines. **Both branches' layer-3 changes stay
   identical — confirmed.**

### Brief checklist, item by item

1. **Requeue-not-adopt for a recipient wake on an unowned open turn.** Resolved, and the
   design choice is the right one — adopting the envelope (round 1's suggested
   `??=`) would have retargeted an earlier turn's in-flight deliveries, tools and typing
   owner. Scheduler path `framework.ts:19828-19835`: a recipient request is pushed back and
   the earlier turn's own requests proceed, so the predecessor's continuation runs *ahead*
   of the new wake rather than behind it (round 1's bug had the selection filter at 19843
   displace the continuation — `gate-r1-final-red` subtest 3 shows 1 membrane call instead
   of 3, i.e. a stalled turn). Direct-start path `framework.ts:23511-23518` closes the
   retry/continuation entry that bypasses the scheduler filter, releases a held primary
   provider gate under the same condition as the adjacent stopping block
   (`providerGateAlreadyHeld && ownsProviderScheduling`), and does not queue into a stopping
   framework (`!this.providerAdmissionClosed`). `requests` is safely rebound (the array was
   already removed from `requestsByAgent` at 19752, and 19848 already rebinds it).
   **No livelock:** the pass iterates a snapshot map after `this.pendingRequests = []`
   (19747), so a push-back cannot be re-examined in the same pass, and the run loop's
   backoff at 16527-16540 is the documented drain for exactly this requeue pattern — probe 2
   measures 200 passes in 1.0 ms. **No loss:** `STALE_REQUEST_MS` is diagnostic only
   (19975-20003 requeues, never drops). **No starvation of either turn:** the recipient
   wake runs as soon as the open turn clears (probe 2 part C; and the implementer's
   production-path row at `test/recipient-compatibility.test.ts:370-404` asserts 3 membrane
   calls, an `inference:stream_restarted` trace and the publish landing on
   `['slack:CROOM','100.001']`, which is in the green suite I ran). I also checked the
   inverse directions: a non-recipient turn's continuation never carries `recipientReply`
   (17103/17220/26233/32285 all copy it from `activeTurnTriggers`, which 23656/24322 set per
   start), so the filter cannot divert a continuation of the turn it is protecting; and the
   open turn's envelope is set once at `opensTurn` (24311) and never cleared, so a matching
   continuation always passes the direct-start comparison. Residual nit: LOW 3
   (`suppressProse`).
2. **`writeChannels` enforcement in the channel lane; DM lane unchanged.** Resolved.
   `host-recipient-protocol.ts:91` snapshots the allowlist (consistent with `dmUsers`, and
   the test asserts the snapshot is immune to later array mutation); 126 computes
   `writable = access.kind === 'dm' || writeChannels.has(channelId)`; 130 gates
   `triggerInference` and 131 gates the envelope on it. DM admission is independent — it
   short-circuits `writable`, and the constructor's `/^[CG][A-Z0-9]+$/` validator makes a
   `D…` id unlistable, so no DM can be denied by this field. Both live ingress lanes carry
   the narrowed verdict downstream rather than discarding it:
   `framework.ts:34700` (`push/event`, on a `structuredClone`d `origin`) and
   `framework.ts:34885` (`channels/incoming`, on a `structuredClone`d per-message
   `metadata`) — both copies, so no caller object is mutated. Downstream the `wakeAllowed:
   false` is consumed by `channel-registry.ts:2044` (`triggerInference = false`),
   `support-recipient-target.ts:5` (`recipientReplyFor` refuses), `isSupportContextOnly`
   (vetoing admission and forcing `locus = false` at 17612/17629 and 19481/19496), the
   module-requested-inference guard at 17410, and `admittedRecipientReply`'s re-acceptance
   at 19630. `grep -rn wakeAllowed src/` shows every consumer is recipient-feature-scoped,
   so no other feature is affected. Probe 1 is the end-to-end proof: denied mention = stored
   context, **no inference, no envelope, no publication, no anchor change**.
3. **Context-only arrivals no longer move the latest-inbound anchor; feature-off
   unchanged.** Behaviour confirmed on the real ingress path (probe 1) for both the
   context-only and write-denied cases, and the parked path cannot be reached either because
   `decision.locus = false` precedes `noteDeliveredOrPark`, which is where the park is
   installed. `incomingFor` (the refusal-handling source), `getDefaultPublishChannel` and
   `ChannelContext.incoming` all retain the earlier addressed message. Feature-off is
   unchanged: the new guard is behind `mcplServerConfigs?.get(serverId)?.supportRecipientBridge`,
   and `isSupportContextOnly` is additionally re-anchored to the *event's* `serverId`
   (`{ ...event.metadata, serverId: event.serverId }`), which is a hardening over trusting
   adapter-supplied `serverId`. The caveat is LOW 1 (the guard is defence in depth, and its
   row does not exercise a production path).
4. **Docs / changelog conditionality.** Fixed. `docs/recipient-compatibility.md:62-63` and
   the mapping row now scope the budget-hold claims to the stacked branch and say upstream
   main has neither the feature nor `budget-refusal-hold.test.ts`; I verified
   `git ls-tree 280ec03d test/` has **no** `budget-refusal-hold.test.ts` while `3e4e4990`
   does. `changelog.d/recipient-compatibility.added.md` now reads "and through budget holds
   when that separate feature is installed (the stacked branch)". Docs also now document the
   three new behaviours, and the `writeChannels` paragraph correctly re-scopes the host's
   remaining responsibility to "connector authentication and **explicit-send**
   authorization".
5. **Cast removal.** Fixed on exactly the three surfaces round 1 named: `routeSpeech`,
   `stopTyping` and the `ChannelRegistry` options object now typecheck (`npm run typecheck`
   passes on both heads, so `recipientServerId`/`activeChannelResolver`/`sendTypingFn` and
   the `routeSpeech`/`stopTyping` signatures are genuinely checked), plus two `addMessage`
   metadata casts. Remaining `as any` in the two files are the two `ChannelRegistry`
   constructor doubles, private state (`channels`, `typingIntervals`, `previewContext`) and
   `framework as any` — test scaffolding, as claimed.
6. **Report attribution.** Fixed: the fix report states the replacement-test and
   `writeChannels` decisions were the manager's (Tarn's) call, not the owner's, and that the
   366/21 counts remain unreproducible. No owner approval is implied anywhere.

## Unmet criteria / test gaps

- Acceptance (three separable layers each tested; recipient behaviours qualified with the
  frozen pr361-v1 tests mapped onto the new code) remains met, with the unchanged and
  correctly declared caveat that the historical 366/21 selection is unreproducible. No
  push, PR, merge or main-checkout change was made by the implementer or by me.
- The anchor regression does not drive a production ingress path (LOW 1). My probe 1 closes
  this for the review, but the repository has no committed test that would catch a
  regression arriving via `decision.locus`.
- No test asserts any diagnostic for a deferred recipient wake, because there is none
  (LOW 2); a leaked `openLogical` entry would now be silent rather than loud.
- No test covers a `suppressProse` recipient start against an open prose turn (LOW 3), nor
  `writeChannels: []` (LOW 5).
- Still, as in round 1: the host-side contract (`ChannelContext.incoming`, adapter use of
  `threadId`) is exercised only against the synthetic stdio fixture; no host graph, live
  connector or real provider was tested by them or by me. The `slack:<C|G|D>…` naming
  coupling between the host's descriptor ids and `freezeRecipientReply`'s regex is still
  asserted only by tests that adopt the convention. The release-set qualification on
  Soma/Rook/Heron remains entirely ahead.

## Residual risk

- Round 1's top risk is closed in the direction that matters: an unowned open turn no longer
  silently swallows a mention's reply, and the predecessor turn no longer stalls. What
  replaces it is indefinite deferral if `openLogical` ever leaks, with no telemetry (LOW 2).
  That is the one thing I would want instrumented before Soma.
- The `writeChannels` enforcement is a behaviour change for any host configuration that
  relied on `readJoinedChannels` alone: channels omitted from the allowlist stop producing
  automatic replies. Intended and now documented, but it is the operator-visible edge of
  this round and must be set deliberately in the release-set host config (LOW 5).
- The guard at `framework.ts:17494` is currently inert in production (LOW 1). Keeping it is
  the right call for port fidelity, but it should not be counted as the thing that produces
  the anchor guarantee — `decision.locus = false` is.
- `0.30.0` is unchanged on both heads, so nothing downstream can distinguish fork main from
  upstream main by version; the release set must pin by SHA.
- Suite wall-clock on the stacked head was 273 s this round against 1 014 s in round 1 on
  the same box and concurrency; I attribute the round-1 figure to concurrent load and make
  no performance claim either way.

## Fix directions

1. `framework.ts:19829` / `23518` — emit one throttled trace (or let the recipient filter
   fall through to the stale-wake accounting) so a deferred recipient wake is visible, and
   log the direct-start requeue the way 23557 logs its sibling.
2. `test/recipient-compatibility.test.ts:427` — drive the anchor row through
   `channels/incoming` (as `test/recipient-protocol.test.ts:162` already does for the
   write-denied case) instead of calling `noteDeliveredOrPark`; and in the report, describe
   the 17494 guard as defence in depth behind `decision.locus`.
3. `framework.ts:23511` — add `&& !trigger.suppressProse`, matching the invariant the
   routing comment at 24268 already states.
4. `docs/recipient-compatibility.md` — one sentence that a channel absent from
   `writeChannels` gets no automatic reply (and that an empty allowlist is valid), plus a
   note on the addressed-but-context storage asymmetry at
   `host-recipient-protocol.ts:129`.
5. Commit trailers — before the upstream PR, name the model per `CONTRIBUTING.md:82` and add
   `Co-Authored-By:` credit for Aspirational (#233) and nissa-seru (#361). Unresolved by
   design this round; needs the manager's or owner's call.
