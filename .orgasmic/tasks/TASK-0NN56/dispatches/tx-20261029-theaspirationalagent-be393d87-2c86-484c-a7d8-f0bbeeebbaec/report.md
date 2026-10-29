# Re-review 4 — TASK-0NN56 upstream rebase (agent-framework, local only)

Scope as briefed: **the upstream rebase only.** Heads reviewed: stacked
`feat/typing-budget-recipient-r` = `4f942947b6218ffcb51589fa9c5b4f3f55a93f4e`
(old `5560cdd9`), standalone `recipient-on-main-r` =
`36a9194253f319dcf79428b79893553dd9af4cb3` (old `f48546e3`), both on upstream main
`4a45766f019fa11c8699645bd6806ebf3e13e5d1`. Read in full:
`/srv/review-drop/TASK-0NN56-REBASE.md` and `/srv/review-drop/TASK-0NN56-REVIEW3.md`.
All four refs confirmed intact at the end of this review (`feat/typing-budget-recipient`
`5560cdd9`, `recipient-on-main` `f48546e3`, and the two `-r` heads above).

## Verdict

**APPROVE.** The rebase is exact, and I proved that independently rather than by
reading the implementer's audit: both new heads' trees are *bit-identical* to
"old head tree + the upstream `0f11975e..4a45766f` patch", every carried commit's
stable patch ID, raw author header and full message are unchanged, range-diff is
`=` on 8/8 and 5/5 pairs, and layer-3 is still byte-equivalent between the two
branches and against its pre-rebase form. All assigned gates rerun green on both
heads with counts matching the implementer's claims exactly. No finding is
attributable to the rebase; the one new test gap below is a gap, not a defect.

## Findings

### HIGH
None.

### MEDIUM
None.

### LOW

**LOW test/subconscious-model-fields.test.ts (test) — the five upstream rows that make a
reader's window and thinking binding independently configurable are never exercised with
a live recipient turn or a #361 budget hold, and that is the one place the upstream delta
actually meets the carried features.**
Upstream's only runtime additions are `readerModelFields` (`src/framework.ts:3499` on the
stacked head) spread into the persistent reader's config (`16290-16300`) and the reader
fork's (`16403` region). `physicalWindowTokens` has exactly one consumer: the mid-turn
physical-window projection at `framework.ts:16940`, `16963` and `16971` — and that is the
same `context_budget_restart` path through which **layer 3** threads the frozen envelope
(`framework.ts:17115`, `17232`). So after this rebase a reader can, for the first time,
have a *different* physical window from the resident it serves, on the very path layer 3
depends on. `thinkingBinding` is read by **#361** at `budgetHoldPreview`
(`agent.thinkingBindingOption()`, `src/agent.ts:2068`) for its hold verdict.
I traced the composition and it is correct — see *Semantic interaction* below, every read is
`agent.*` for the agent in the turn, and a reader fork's trigger carries no envelope — but
no committed row drives a reader with its own window/binding while a recipient envelope is
frozen or a budget hold is holding. The combined suites prove only that the five new rows
and the 34 recipient rows are green side by side.
Fix direction: before the upstream PR, one row on the stacked branch that gives the
subconscious its own `physicalWindowTokens` and `thinkingBinding` while the resident holds
a frozen recipient envelope, asserting the resident's envelope and hold verdict are
unaffected by the reader's fields. Cheap, and it pins the only new coupling.

**Carried forward from review 3, unchanged code, out of this round's scope** (recorded so
they are not lost, not re-argued): the `docs/recipient-compatibility.md:54` silent-start
sentence that holds only for `openLogical`; the shared `staleWarnAt` throttle starving the
busy-path `idle+turn-alive` tell (`src/framework.ts` `warnRecipientDeferral`); the untested
`noteDeliveredOrPark` guard; and the missing changelog bullet for the deferral diagnostic.
Also unchanged: all eight stacked and five standalone commits still carry
`Co-Authored-By: OpenAI <noreply@openai.com>` with no model name per `CONTRIBUTING.md:82`
and no credit for Aspirational (#233) or nissa-seru (#361). Deferred by instruction; it
matters only before anything goes upstream, and it needs the owner's call.

## Verification Gates

Every structural check below I computed myself; I did **not** rely on the implementer's
`audit-rebase.py` for any claim (I read it afterwards and it is sound, and my results agree
with it). I did not reuse the `rebase-stacked-*` receipts for any pass claim — the brief
assigned reruns on both heads.

### Structural (unwrapped probes — evidence, not reusable receipts)

1. **Range-diff all `=`.** `git range-diff 0f11975e..<old> 4a45766f..<new>`: stacked **8 of 8**
   pairs marked `=`, zero non-`=`; standalone **5 of 5**, zero non-`=`.
2. **New head tree == old tree + upstream patch, exactly.** Built
   `git diff --binary --full-index 0f11975e 4a45766f` (19 127 bytes), read each old head's
   tree into a throwaway `GIT_INDEX_FILE` outside the worktree, applied only that patch
   `--cached`, and wrote the tree:
   - stacked → `0ba251e7671fb14999347cb169a9da0a20de0862` == `4f942947^{tree}` **MATCH**
   - standalone → `44948301f29fde8bf47fa931467ae3bb22739281` == `36a91942^{tree}` **MATCH**
   This is stronger than a line-multiset comparison: nothing beyond the upstream delta can
   hide in either head. Corroborating: `git diff --stat <old> <new>` on both heads is the
   upstream net diffstat exactly — the same five files, **188 insertions / 24 deletions**.
3. **Carried patches and metadata unchanged.** Per-commit `git patch-id --stable` sequences
   are identical old vs new on both branches; `%an|%ae|%aI|%B` sequences identical on both.
   Committer identity stays the neutral `orgasmic worker (devbox) <orgasmic@devbox>`; only
   committer timestamps moved (all `2026-10-29T10:58:22+00:00`), as documented.
4. **Upstream delta shape.** `0f11975e..4a45766f` = 8 commits, 2 of them merges; both new
   heads descend from `4a45766f` (`merge-base --is-ancestor` yes); 8 and 5 commits above the
   new base, zero merges introduced.
5. **Layer-3 equivalence — confirmed, two ways.** `git diff --name-status 75c90343 4f942947`
   is identical to `git diff --name-status 4a45766f 36a91942`. **10 of the 12** layer-3 paths
   are the *same blob* on both new heads (`changelog.d/recipient-compatibility.added.md`,
   `docs/recipient-compatibility.md`, `src/host-recipient-protocol.ts`,
   `src/mcpl/server-connection.ts`, `src/mcpl/types.ts`, `src/support-recipient-target.ts`,
   `src/types/agent.ts`, `test/fixtures/recipient-mcpl-server.mjs`,
   `test/recipient-protocol.test.ts`, `test/recipient-compatibility.test.ts`). The two that
   differ do so only because layers 1-2 touch them, and their sorted added/deleted line
   multisets match across branches (`src/framework.ts` md5 `94ca1b5f…`,
   `src/mcpl/channel-registry.ts` md5 `807faa8a…`) **and** match their pre-rebase values
   (`22454888..5560cdd9`), i.e. layer 3 is unchanged by the rebase as well as equivalent
   across branches. New stacked layer-2 tip is `75c90343`, as reported.
6. **No dependency drift.** `git diff --name-only 5560cdd9 4f942947 -- package.json bun.lock
   bun.lockb package-lock.json` is empty; package stays `@animalabs/agent-framework@0.30.0`.
   `changelog.d/` carries upstream's new `subconscious-model-fields.added.md` alongside our
   `feat-disabled-mode-typing.changed.md`, `budget-refusal-holds-turn.*` and
   `recipient-compatibility.added.md` with no filename collision.
7. **Test-count arithmetic closed.** `test/subconscious-model-fields.test.ts` goes from
   **3 to 8** `it(` rows across the upstream delta — exactly the **+5** seen in both suites
   (stacked 9339→9344, standalone 9245→9250), with the skip profile unchanged. So the suite
   growth is entirely upstream's new reader window/binding rows, and they run green inside
   the combined build.

### Assigned gate reruns — both heads

Run by me in this worktree through `orgasmic dispatch gate`. Node **22.23.3**
(`/opt/node/bin/node`), Bun **1.4.3** (`/home/orgasmic/.local/bin/bun-1.4.3`),
`AF_TEST_CONCURRENCY=8` on both suites. `git status --porcelain` empty before and after
every gate. Logs in `$ORGASMIC_EVIDENCE_DIR`; drivers
`rr4-stacked-driver.log` (owner PID 1966208) and `rr4-standalone-driver.log` (owner PID
2014221), both exited normally.

| Head | Gate | Command after the wrapper | Result |
| --- | --- | --- | --- |
| `4f942947` | `rr4-stacked-install` | `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS (exit 0) — "no changes", no lockfile write |
| `4f942947` | `rr4-stacked-typecheck` | `npm run typecheck` | PASS (exit 0) |
| `4f942947` | `rr4-stacked-build` | `bash -c 'npm run clean && npm run build && npm run pretest'` | PASS (exit 0) |
| `4f942947` | `rr4-stacked-recipient` | `node --test --test-force-exit dist/test/recipient-compatibility.test.js dist/test/recipient-protocol.test.js` | PASS — **34 / 34 / 0 fail / 0 skip** |
| `4f942947` | `rr4-stacked-suite` | `npm test` | PASS — **tests 9344 / pass 9281 / fail 0 / cancelled 0 / skipped 63**, 501 suites, 327 164 ms |
| `36a91942` | `rr4-standalone-install` | same bun install | PASS (exit 0) |
| `36a91942` | `rr4-standalone-typecheck` | `npm run typecheck` | PASS (exit 0) |
| `36a91942` | `rr4-standalone-build` | same clean build chain | PASS (exit 0) |
| `36a91942` | `rr4-standalone-recipient` | same recipient command | PASS — **34 / 33 / 0 fail / 1 skip** |
| `36a91942` | `rr4-standalone-suite` | `npm test` | PASS — **tests 9250 / pass 9186 / fail 0 / cancelled 0 / skipped 64**, 497 suites, 292 373 ms |
| `4f942947` | `rr4-restored-stack` | clean build + pretest + the two recipient files | PASS — 34 / 34 / 0 / 0; worktree restored on the stacked head |

Zero `not ok` lines in either suite log. Counts match the implementer's reported figures
**exactly** (9344/9281/0/63 and 9250/9186/0/64; 34/34/0/0 and 34/33/0/1). The standalone's
single recipient skip is confirmed by name to be the conditional layer-2 row — *"a
first-compile budget hold keeps its opening root while a later root waits # SKIP budget
holds are not part of upstream main"* — so all 34 rows are selected on both heads and the
skip is a correct layer guard, not a silently dropped assertion.

### Semantic interaction of the 8 upstream commits with #233 / #361 / the recipient envelope

The upstream delta's *entire* runtime surface is: `assertThinkingBinding` extracted in
`src/agent.ts:173` (validation refactor, newly also applied to
`subconscious.thinkingBinding`), and `readerModelFields` (`src/framework.ts:3499`) spread
into the persistent reader's `AgentConfig` (`16290-16300`) and the reader fork's
(`16403` region). Everything else in the eight commits is tests, docs and merges. The
`proseRouting: 'disabled'` line on the fork is *unchanged context* in the upstream diff —
upstream did not touch fork prose routing, only added two model-shaping fields beside it.

**Do reader forks receive recipient triggers? No — and the reason is structural, not
incidental.** A subconscious reader fork is built by `deriveAgent` → `taskForkSpec` →
`boundedJob` (`src/dendrite/presets.ts:113-114`), whose roles are
`receivesUntargeted: false`, `receivesGateWakes: false`, `defaultDelivery: false`,
`ownsProviderScheduling: false`, and which sets **no `homeChannel`**. The only three ways a
`recipientReply` is ever minted onto a wake are all closed to it:
- untargeted channel/push ingress resolves recipients through
  `registry.untargetedRecipients()` (`src/dendrite/registry.ts:313`, filtered on
  `receivesUntargeted`) — excluded;
- host-wide gate fan-out uses `gateRecipients()` (`registry.ts:318`, `receivesGateWakes`) —
  excluded;
- the `deliverTo` lane at `src/framework.ts:17662-17698` is the one path that mints a
  `recipientReply` for a non-resident, and it is gated on
  `this.registry.homeChannel(target.name) !== undefined` — i.e. a **conversation** fork, not
  a subconscious one. (`deliverTo` is set only by the push-coalescer to an agent that already
  held a placement in that channel, which a reader fork never does.)
The persistent reader is likewise excluded: `subconsciousSpec` (`presets.ts:46-47`) sets both
roles false and no home channel, and is explicitly "never a broadcast recipient".

**Can a fork start a turn that adopts or defers a recipient wake? No.** The fork's turn is
driven by exactly one request, pushed at `src/framework.ts:12932`:
`{ agentName, reason: 'ephemeral', source: 'subagent', timestamp }` — **no `channelId`, no
`wakeChannelId`, no `recipientReply`, no `suppressProse`**. Consequences, each anchored:
- layer 3's adopt/defer logic (`framework.ts:19857-19884`) operates on the per-agent request
  set; no recipient request can be queued under a fork's name (roles above) and its own
  request carries none, so there is nothing to adopt and nothing to defer;
- the direct-start guard added last round (`framework.ts:23546`) short-circuits on
  `trigger?.recipientReply`, which is undefined;
- `routing.recipientReply` is set from the trigger (`24347`), so a fork freezes no envelope
  and mints no `recipientTyping`.

**#233 typing × `proseRouting: 'disabled'` on forks — inert.** A reader fork's turn does have
`turnProseRouting === 'disabled'`, so it reaches #233's new
`disabledTypingChannel(agent.name, trigger)` (`framework.ts:19624`, called at the two start
sites). That function needs `trigger.channelId` or `trigger.wakeChannelId` to resolve a
destination; the ephemeral trigger has neither, so it returns `null` and **no typing presence
is published for a reader fork**. #233's other change, the `silentOnly`/`routable` request
ranking, is untouched by upstream.

**#361 budget hold × thinking binding — correct composition.** #361 does read the binding:
`budgetHoldPreview` passes `agent.thinkingBindingOption()` into `previewContext`, and
`thinkingBindingOption()` (`src/agent.ts:2068`) is built from the agent's *own*
`thinkingBinds`/`thinkingDropBlock` with `participant: this.name`. Upstream's change puts the
subconscious's own binding into the *reader's* `AgentConfig`, so a reader's hold verdict is
previewed under the same binding its real compile will use — no cross-agent leak, and the
resident's config is untouched (`{ ...primaryConfig }` is copied, then the reader's fields
override it). Two further reassurances I checked rather than assumed: `nextCompileBudget()`
resolves through `resolveBudget` (`src/agent.ts:582`), which reads `contextBudgetTokens` and
**not** `physicalWindowTokens` — so a reader's new window cannot shift the hold's budget; and
the hold is bounded at `BUDGET_HOLD_MS = 30 * 60_000` (`framework.ts:2516`), while ephemeral
runs are additionally exempted from provider-wait holds at `framework.ts:19852` and `23658`.
`src/agent.ts` is the one file both the upstream delta and layer 2 (#361) modify, and they
modify disjoint regions — proven by the clean `--cached` replay and the exact tree match.

The genuinely new coupling, therefore, is narrow and one-directional: a reader may now have a
different `physicalWindowTokens` from its resident, and that field's sole consumer
(`framework.ts:16940`, `16963`, `16971`) is the mid-turn physical-window restart that layer 3
threads the frozen envelope through (`17115`, `17232`). It composes correctly for the reasons
above; it is untested, which is LOW 1.

## Unmet criteria / test gaps

- Acceptance still holds, with the base updated as the manager instructed: three separable
  layers in the same order on a pinned upstream main (`4a45766f`), each tested, with the
  frozen pr361-v1 recipient behaviours mapped onto the new code. No push, PR, merge, remote
  mutation or main-checkout change by the implementer or by me.
- The caveat is unchanged and correctly declared in the rebase report: the historical 366/21
  qualification selection remains **unreproducible** from the supplied sources (manager's
  ruling of 2026-10-29 07:27). The replacement synthetic tests stand in for it.
- New gap, LOW 1: no row exercises a reader's own window/binding against a live recipient
  envelope or an active budget hold.
- Carried gaps from review 3, all still open because the code is unchanged: the
  `noteDeliveredOrPark` guard has no test; nothing covers the `turnRouting` consequence of a
  silent start against an open prose turn; nothing covers the shared-throttle interaction
  between the recipient-deferral line and the busy-path wedge tell; the shutdown-time
  direct-start requeue (`providerAdmissionClosed`) still drops its trigger with no diagnostic
  and no test either way.
- Unchanged from every earlier round: the host-side contract is exercised only against the
  synthetic stdio MCPL fixture; no host graph, live connector or real provider was tested by
  the implementer or by me. The release-set qualification on Soma, then Rook/Heron, is
  entirely ahead.

## Residual risk

- The base is pinned to `4a45766f` as of this round. Upstream can advance again, and the next
  rebase gets no free pass from this one — though the audit method here (tree identity against
  "old tree + upstream patch") is cheap to repeat and is the check worth keeping.
- `0.30.0` is unchanged on both heads, so nothing downstream can distinguish fork main from
  upstream main by version. The release set must pin by SHA.
- Upstream's new `subconscious.physicalWindowTokens` / `thinkingBinding` are opt-in: with
  neither set, a reader behaves exactly as before, so the release set inherits no new
  behaviour unless it configures these. If it does configure them, LOW 1's gap becomes live
  and `writeChannels`-style deliberate configuration applies here too.
- The commit trailers still misattribute authorship (no model name; no credit to Aspirational
  or nissa-seru). Harmless locally, blocking before the upstream PR.
- Suite wall-clock was 327 s stacked / 292 s standalone at concurrency 8, up from review 3's
  273 s / 271 s on the same box. This review ran two suites back to back on a shared machine;
  I make **no** performance claim either way and did not investigate, since no gate is
  time-bound.
- No live host, provider, credential or agent history/state was used. The optional recipient
  extension remains local, not a standard MCPL capability.

## Fix directions

1. `test/` on the stacked branch — add the one combined row described in LOW 1 (reader with
   its own `physicalWindowTokens` + `thinkingBinding`; resident holding a frozen recipient
   envelope and/or a budget hold; assert the resident's envelope and hold verdict are
   unaffected). This is the only fix direction this round creates.
2. Carried, unchanged, for the pre-PR pass: review 3's directions 1-4
   (`docs/recipient-compatibility.md:54` wording; `warnRecipientDeferral` throttle key and
   `requestCount`; a direct-call row for the `noteDeliveredOrPark` guard;
   `changelog.d/recipient-compatibility.added.md` bullet).
3. Commit trailers before the upstream PR — name the model per `CONTRIBUTING.md:82` and add
   `Co-Authored-By:` credit for Aspirational (#233) and nissa-seru (#361). Needs the owner's
   or manager's call.

## Worktree state

Left exactly as found: detached at `4f942947b6218ffcb51589fa9c5b4f3f55a93f4e`,
`git status --porcelain` empty, the stacked `dist/` rebuilt in place (`rr4-restored-stack`),
all four branch refs at their original objects. No commits, no tracked-file edits, no new
files in the tree; probe scratch lived in `/tmp` and logs in `$ORGASMIC_EVIDENCE_DIR`.
