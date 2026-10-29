# Re-review 3 — TASK-0NN56 fix round 2 (agent-framework, local only)

Heads reviewed: stacked `feat/typing-budget-recipient` = `5560cdd94d89821e0511b7b24aecfaa845432217`
(parent `3e4e49901d745bc94c34963f2321d9b171454a0b`), standalone `recipient-on-main` =
`f48546e353165aa1842972a7594e0355d3997754` (parent `280ec03d60720642318b7408710ec4a2059bf525`).
Both reviewed parents confirmed unrewritten (`3e4e4990`'s parent is still `72fe3f8d`,
`280ec03d`'s still `57424a0e`); both branch refs retained. Round diff on each head:
4 files, 153 insertions, 28 deletions. Read in full: `/srv/review-drop/TASK-0NN56-REVIEW2.md`
(my round-2 LOWs) and `/srv/review-drop/TASK-0NN56-FIX2.md`.

## Verdict

**APPROVE.** All five in-scope LOWs are fixed, and each fix is load-bearing rather than
decorative — I proved that by mutation: neutralising any one of the three production changes
turns exactly the intended new row(s) red (details under *Mutation probes*). The deferred-wake
diagnostic behaves as documented on the real scheduler and direct-start paths: throttled to one
trace + one stderr line per agent per minute, no drop, no timestamp reset, no spin
(200 passes in 0.5 ms), suppressed while quiesced, and the wake still runs exactly once on the
frozen destination when the owner clears. The `suppressProse` exemption is correct: the silent
start runs, `openLogical` keeps the prose turn's own object, and the prose turn never adopts
the silent envelope. The replacement real-ingress anchor row is the genuine article — it goes
red when `decision.locus = false` is removed, which is precisely the regression class the
round-1 private-method row could not catch. `writeChannels` docs now state the fail-closed
default and the valid empty allowlist, with a unit row for both lanes. Layer-3 equivalence
between the branches holds: the round-only diffs are byte-identical apart from `index` lines
and five hunk offsets, and the full layer-3 added/deleted line multisets are identical for
`src/framework.ts` (235 lines) and `src/mcpl/channel-registry.ts` (48), with the other ten
changed paths the same blob on both heads. Typecheck, clean build and the full suite pass on
both heads under the mandated toolchain, with counts matching the implementer's claims exactly.

No HIGH, no MEDIUM. Four LOWs, all for the upstream-PR/pre-Soma bucket rather than blocking the
local fork main. The fix report's self-correction about the `noteDeliveredOrPark` guard is
accurate and I reproduced it. Nothing pushed, merged or committed; the worktree is restored
detached at `5560cdd9` with a clean tree.

## Findings

### HIGH
None.

### MEDIUM
None.

### LOW

**LOW docs/recipient-compatibility.md:54 (docs accuracy) — "Silent direct starts do not take or
disturb an open prose turn" is only true of `openLogical`; the silent start does replace the
agent's `turnRouting`, and a `context_budget_restart` continuation of the open prose turn then
resumes the silent routing and drops its prose.**
`framework.ts:24317-24323` gives a `suppressProse` start a `freshTurnRouting()` with
`silent = true` and never registers it in `openLogical` — so the new guard exemption at
`framework.ts:23534` is itself sound. But `framework.ts:24343` unconditionally does
`this.turnRouting.set(agent.name, routing)`, and the resume path reads
`routingOf()` (`framework.ts:22701`, called at `24315`), which returns whatever is in
`turnRouting`, not the `openLogical` entry. Probe
`$ORGASMIC_EVIDENCE_DIR/probe-silent-start/probe-continuation.mjs` on the real
`AgentFramework`: after the silent start, `turnRouting` is no longer the prose object
(`G … === open: false`, `silent: true`), the production-shaped `activeChannelResolver`
(`framework.ts:32455`, which reads `turnRouting`) reports the silent turn's channel
`slack:COTHER` instead of the prose turn's `slack:CROOM`, and a `context_budget_restart`
continuation then resumes the silent object (`J … === open: false`, `K silent: true`) and
publishes nothing although the membrane returned text (`L publishes: []`, `M membrane calls: 2`).
**This is pre-existing, layer-independent and not reachable in production as the code reads it:**
`probe-no-recipient.mjs` reproduces it identically with a silent trigger carrying no
`recipientReply` at all, so it is an upstream `turnRouting`/`openLogical` interaction that
round 1's guard happened to mask for one narrow recipient case and this round deliberately
unmasked on my own round-2 fix direction; and the routing comment at
`framework.ts:24296-24298` states the precondition cannot arise in production ("No silent start
runs while a prose turn is open in production: a capacity hold holds silent wakes with the
turn's, and a re-inference's wake is queued before its stream ends"), which the committed row
honestly flags as deliberately injected. So this is documentation precision, not a defect: the
new sentence reads as an unconditional property while the code only guarantees it for
`openLogical` and only relies on an unenforced scheduling invariant for the rest.
Fix direction: scope the sentence to the open *logical* turn (`openLogical`) — e.g. "a silent
direct start neither takes nor registers an open logical turn" — or, upstream, make the resume
path prefer `this.openLogical.get(name) ?? this.routingOf(name)` as `23835`/`23842`/`23853`
already do.

**LOW src/framework.ts:19849 (observability) — the recipient-deferral warning runs before the
busy-path wedge tell and shares its per-agent throttle, so a mixed queue behind a leaked turn
never shows `idle+turn-alive`, and the line under-reports the stuck queue.**
`warnRecipientDeferral` (19721-19733) sets the same `staleWarnAt` entry the busy branch's
diagnostic reads at 19997, and the recipient filter at 19845-19872 is evaluated ~140 lines
ahead of the busy branch at 19989. So whenever a recipient wake *and* a non-recipient wake are
both queued for an agent whose turn token has leaked, the recipient line wins every throttle
window and the busy branch — whose own comment at 20004-20007 designates its line as "the
wedge's tell (idle+turn-alive, forever)" — is permanently starved. Probe
`$ORGASMIC_EVIDENCE_DIR/probe-throttle-starvation/probe.mjs` (leaked `activeTurnTokens` entry,
open non-recipient `openLogical`, one recipient + one `nudge` wake, both aged 120 s, three
throttle windows): 3 lines emitted, all `idle+recipient-deferred`,
`any idle+turn-alive tell: false`, and each reports `1 request(s)` while
`pending still: 2`. Nothing is lost, and `idle+recipient-deferred` persisting is itself a
usable tell, so this is a reporting-fidelity issue, not the silent-deferral defect round 2
raised — that one is genuinely closed.
Fix direction: either count the agent's whole requeued set in the recipient line, or give the
recipient deferral its own throttle key so it cannot crowd out the busy branch's qualifier
(`idle+turn-alive` / `idle+surgery(...)`).

**LOW src/framework.ts:17495-17499 (test) — the `noteDeliveredOrPark` guard now has zero
coverage: deleting it leaves all 34 recipient rows green.**
Round 2's fix direction asked for the private-method row to be driven through real ingress
instead; the implementer replaced it, and the replacement is good (see *Mutation probes* 1).
But mutant `guardonly` — the guard removed, `decision.locus = false` left intact — runs
`recipient-protocol.test.js` + `recipient-compatibility.test.js` at **34/34 pass**, confirming
both the fix report's self-correction and that nothing in the repository would notice if the
guard were deleted or inverted. The anchor *behaviour* is defended by the ingress row; the
defence-in-depth layer the team chose to keep for port fidelity is untested code.
Fix direction: keep the ingress row and re-add a small direct-call row for the guard (the two
test different things), or accept the guard as deliberately unverified and say so.

**LOW changelog.d/recipient-compatibility.added.md (docs) — a behaviour-affecting `src/` change
with no changelog fragment edit.**
`CONTRIBUTING.md:50` requires "a **Changelog fragment** in `changelog.d/` for anything
behavior-affecting", and `CONTRIBUTING.md:112-114` notes CI "fails the `changelog` check" when
`src/` is touched without one. This round adds an operator-visible stderr line
(`[inference-stale] … recipient-deferred … wake requeued, not started`) and a new
`inference:request_stale.agentStatus` value, plus a behaviour change for silent recipient
starts, and edits only `docs/`. The pending fragment is unchanged and mentions neither. The CI
check is per-PR and the pending fragment will be in the same PR, so it will pass — the gap is
content, not mechanics. (`agentStatus` is a free-form `string` at `src/types/trace.ts:385`
with no pattern-matching consumers in `src/`, `docs/` or non-test code, so the new value breaks
nothing.)
Fix direction: one bullet in the existing fragment for the deferral diagnostic before the
upstream PR.

**Carried forward, out of this round's scope:** both new commits still carry
`Co-Authored-By: OpenAI <noreply@openai.com>` with no model name per `CONTRIBUTING.md:82` and no
credit for Aspirational (#233) or nissa-seru (#361). The brief narrowed this round to LOWs 1-5
and the fix report states the deferral is deliberate and awaiting the manager's/owner's call, so
I record it as unresolved by design, not ignored. It matters only before anything goes upstream.

## Verification Gates

All run by me in this worktree through `orgasmic dispatch gate`. Node **22.23.3**
(`/opt/node/bin/node`), Bun **1.4.3** (`/home/orgasmic/.local/bin/bun-1.4.3`),
`AF_TEST_CONCURRENCY=8` on both suites. Logs in `$ORGASMIC_EVIDENCE_DIR`.

| Head | Gate | Command after the wrapper | Result |
| --- | --- | --- | --- |
| `5560cdd9` | `rr3-stacked-install` | `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS (exit 0) — no lockfile change |
| `5560cdd9` | `rr3-stacked-typecheck` | `npm run typecheck` | PASS (exit 0) |
| `5560cdd9` | `rr3-stacked-build` | `bash -c 'npm run clean && npm run build && npm run pretest'` | PASS (exit 0) |
| `5560cdd9` | `rr3-stacked-suite` | `npm test` | PASS — **tests 9339 / pass 9276 / fail 0 / cancelled 0 / skipped 63**, 500 suites, 273 148 ms |
| `f48546e3` | `rr3-standalone-install` | `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS (exit 0) |
| `f48546e3` | `rr3-standalone-typecheck` | `npm run typecheck` | PASS (exit 0) |
| `f48546e3` | `rr3-standalone-build` | same clean build chain | PASS (exit 0) |
| `f48546e3` | `rr3-standalone-suite` | `npm test` | PASS — **tests 9245 / pass 9181 / fail 0 / cancelled 0 / skipped 64**, 496 suites, 270 704 ms |
| `5560cdd9` | `rr3-restored-stack` | `bash -c 'npm run clean && npm run build && npm run pretest && node --test --test-force-exit dist/test/recipient-compatibility.test.js dist/test/recipient-protocol.test.js'` | PASS — 34 / 34 / 0 / 0; worktree restored on the stacked head |

Counts match the implementer's reported figures exactly (9339/9276/0/63 and 9245/9181/0/64),
i.e. +4 passing tests over each reviewed parent (9335→9339, 9241→9245) with the skip profile
unchanged; the standalone extra skip is still the conditional budget-hold integration row.
Package stays `@animalabs/agent-framework@0.30.0` on both heads; no tracked dependency or
generated-file edits. `git status --porcelain` empty before and after each gate. I did not
reuse the implementer's `r2-*` receipts for any pass claim; the brief assigned these reruns.

### Mutation probes (the new rows are load-bearing)

Each mutant is a copy of the stacked `dist/` with one production change neutralised and
`node_modules` symlinked (`/tmp/probe-mutant.sh`, `/tmp/probe-mutants2.sh`):

1. **`decision.locus = false` removed at both live ingress lanes** (`framework.ts:17632`,
   `19499`), guard kept → `recipient-protocol.test.js` **11/12, 1 fail**: the new row
   *"real context-only ingress preserves the latest-inbound anchor before the defence-in-depth
   guard"* fails on `note.mock.callCount()` (`2 !== 1`). The anchor snapshot assertion still
   passes, i.e. the guard did stop the mutation — so the row catches a `decision.locus`
   regression *through* the surviving guard, exactly as the fix report claims. Round 1's
   private-method row could not have caught this.
2. **Both the guard and the locus overrides removed** → **10/12, 2 fail**: the new row plus the
   pre-existing *"real ingress stores non-writable channel mentions…"* row.
3. **Guard removed, locus overrides kept** → **34/34 pass** (basis for LOW 3).
4. **`&& !trigger.suppressProse` reverted** (`framework.ts:23534`) → **21/22, 1 fail**:
   *"a silent recipient direct start does not join or defer behind the open prose turn"*.
5. **All four `warnRecipientDeferral` calls disabled** → **20/22, 2 fail**: both
   *"long-deferred recipient wakes emit throttled diagnostics"* rows (scheduler and direct start).

### Unwrapped probes (evidence, not reusable receipts)

1. `$ORGASMIC_EVIDENCE_DIR/probe-deferral/probe.mjs` — real `AgentFramework.create`, real
   `processInferenceRequests`, open non-recipient `openLogical` entry, one recipient wake.
   `A` fresh wake: 0 traces / 0 stderr lines. `B` 200 passes in **0.5 ms** (no spin).
   `C` **1 trace, 1 stderr line** across those 200 passes. `D`
   `{"agentStatus":"idle+recipient-deferred","requestCount":1,"oldestRequestAge":120001}`.
   `E` `[inference-stale] agent=assistant busy (idle+recipient-deferred) — 1 request(s)
   waiting 120s — wake requeued, not started`. `F` request kept, **same object**, timestamp
   unchanged, envelope `{slack:CROOM, 100.001}` intact. `G` while `quiesced`, still 1/1
   (suppression works). `H` after the throttle window expires, 2/2 (renewal works).
   `I` after clearing the open turn: **1 membrane call, 1 publish to `['slack:CROOM','100.001']`**,
   `J` queue drained. Throttle / no-drop / no-timestamp-reset / no-spin / liveness all confirmed
   independently of the committed rows.
2. `$ORGASMIC_EVIDENCE_DIR/probe-silent-start/probe.mjs` (+ `probe-continuation.mjs`,
   `probe-no-recipient.mjs`) — the `suppressProse` exemption. Silent start runs (`B` 1 membrane
   call, not requeued), `C` nothing requeued, `D` `openLogical` still the prose object,
   `E` `open.recipientReply` stays `undefined`, `F` no automatic publication. Basis for LOW 1 and
   for its classification as pre-existing.
3. `$ORGASMIC_EVIDENCE_DIR/probe-throttle-starvation/probe.mjs` — basis for LOW 2.
4. Branch equivalence, computed by me, not reusing `audit-round.py`:
   `git diff 3e4e4990 5560cdd9` vs `git diff 280ec03d f48546e3` differ **only** in the
   `index <a>..<b>` line for `src/framework.ts` and five `@@` hunk offsets; `git diff
   --name-status 22454888 5560cdd9` is identical to `git diff --name-status
   0f11975e485c7077c6ed7cad9261621cd310a700 f48546e3`; 10 of the 12 layer-3 paths are the **same
   blob** on both heads (only `src/framework.ts` and `src/mcpl/channel-registry.ts` differ, as
   layers 1-2 touch them); and the sorted added/deleted line multisets of the two full layer-3
   diffs are identical for those two files (235 and 48 lines). **Layer-3 equivalence between the
   branches — confirmed.** The standalone head still sits directly on upstream main
   `0f11975e`.

### Brief checklist, item by item

1. **Deferred-wake diagnostics (throttle, no drop/timestamp reset, no spin).** Resolved and
   correct. One shared helper (`framework.ts:19721-19733`) at all four requeue boundaries —
   the non-recipient-owner filter (19849), the different-recipient-owner filter (19858) and the
   sibling filter (19869) in the scheduler, plus the direct-start requeue (23539) that round 2
   found silent. It reuses `STALE_REQUEST_MS`'s 30 s threshold, the existing per-agent
   `staleWarnAt` 60 s throttle and the `quiesced` suppression; it emits the existing
   `inference:request_stale` trace type with no schema change, mutates no request, and adds
   `wake requeued, not started` to the stderr line, matching 23583's wording for the adjacent
   provider-admission requeue. Empty deferral sets return before any work (19722), so the
   common path costs one `length` check. Probe 1 confirms throttle, no drop, no timestamp reset,
   no spin and liveness on the production scheduler path; mutant 5 confirms the rows are
   load-bearing. The committed rows cover both the scheduler and direct-start lanes, both a
   non-recipient and an other-recipient open owner, throttle renewal, retained age/envelope and
   exactly one subsequent reply. Residual nit: LOW 2.
2. **`suppressProse` exemption.** Resolved and safe. `framework.ts:23534` now requires
   `!trigger.suppressProse`, matching the invariant the routing comment at 24292-24298 already
   states; `24317-24323` is the code that makes it true (fresh silent routing, never entered
   into `openLogical`). Probe 2 confirms the silent start runs, requeues nothing, publishes no
   automatic prose and leaves the open prose turn's object and empty envelope untouched; mutant
   4 confirms the row fails without the exemption. The committed row waits for
   `inference:completed` rather than racing the stream, so it is not a vacuous pass. The
   `turnRouting` caveat is LOW 1 and is pre-existing.
3. **Real-ingress anchor row.** Resolved, and strictly better than what round 2 asked for.
   `test/recipient-protocol.test.ts:173-205` drives an addressed `channels/incoming`, then a
   context-only `channels/incoming` and a context-only `push/event` in another channel through
   the synthetic stdio MCPL fixture, and asserts the default publish channel, the adapter's
   `ChannelContext.incoming`, the refusal source `incomingFor`, `parkedAnchors.size === 0`,
   one membrane call and both contexts stored. The decisive assertion is
   `note.mock.callCount()` unchanged — mutant 1 shows it is what turns red when
   `decision.locus = false` is removed, *through* the surviving guard. The fix report's
   correction (live ingress was already correct before round 1; round 1's red receipt came from
   a stub entry; the guard is defence in depth) is accurate and I reproduced each part of it.
   The code comment at `17495-17497` and `docs/recipient-compatibility.md:44-48` now say so.
   Residual: LOW 3.
4. **`writeChannels` docs including the empty list.** Resolved.
   `docs/recipient-compatibility.md:20-25` states that a channel absent from `writeChannels`
   gets no automatic reply and that `writeChannels: []` is valid and disables all channel
   auto-replies, with DM admission independent — which matches
   `host-recipient-protocol.ts:82-84` (`[].every()` passes the validator, and the
   `/^[CG][A-Z0-9]+$/` rule keeps `D…` ids unlistable) and `126-132` (`writable = kind === 'dm'
   || writeChannels.has(channelId)`). `test/recipient-protocol.test.ts:206-212` adds the unit
   row for both lanes and both channels against `bridge([])`, asserting
   `{store: true, triggerInference: false}` — i.e. no envelope key is minted.
   `docs/recipient-compatibility.md:27-32` documents the addressed-but-context storage
   asymmetry at `host-recipient-protocol.ts:129` (round 2's LOW 4) accurately, including that
   such arrivals can be counted as addressed inbound while waking nothing and moving no anchor.
   These are the configuration notes the eventual PR body needs; `host-recipient-protocol.ts`
   itself is untouched this round, as the fix direction allowed.
5. **Layer-3 equivalence between the branches.** Confirmed independently — see *Unwrapped
   probes* 4.
6. **Reruns on both heads.** Done — see the gate table. Typecheck, clean build and the full
   suite pass on both heads under Bun 1.4.3 / Node 22.23.3 / `AF_TEST_CONCURRENCY=8`.

## Unmet criteria / test gaps

- Acceptance (upstream main `0f11975e` base, three separable layers each tested, recipient
  behaviours qualified with the frozen pr361-v1 tests mapped onto the new code) remains met,
  with the unchanged and correctly declared caveat that the historical 366/21 selection is
  unreproducible from the supplied sources. No push, PR, merge, remote mutation or
  main-checkout change by the implementer or by me.
- The `noteDeliveredOrPark` guard has no test at all (LOW 3): mutant 3 deletes it with 34/34
  still green.
- No test covers the `turnRouting` consequence of a silent start against an open prose turn
  (LOW 1); the committed row checks `openLogical` only. The underlying hazard is upstream's,
  not layer 3's.
- No test covers the shared-throttle interaction between the recipient-deferral line and the
  busy-path wedge tell (LOW 2), nor the under-reported `requestCount`.
- The direct-start requeue during shutdown (`providerAdmissionClosed`, `framework.ts:23537`)
  still drops the trigger with no diagnostic. Accepted in round 2 as normal stop() behaviour
  and unchanged here; no test asserts it either way.
- Unchanged from earlier rounds: the host-side contract (`ChannelContext.incoming`, adapter use
  of `threadId`) is exercised only against the synthetic stdio fixture; no host graph, live
  connector or real provider was tested by them or by me; the `slack:<C|G|D>…` naming coupling
  between host descriptor ids and `freezeRecipientReply`'s regex is asserted only by tests that
  adopt the convention. The release-set qualification on Soma/Rook/Heron remains entirely ahead.

## Residual risk

- Round 2's top risk (indefinite, invisible deferral if `openLogical` leaks) is closed: the
  deferral is now loud, throttled and non-destructive, verified on the production path. What
  remains is fidelity — the line can crowd out `idle+turn-alive` and under-counts the stuck
  queue (LOW 2).
- The `suppressProse` exemption re-exposes an upstream `turnRouting`/`openLogical` hazard for
  one more case: any silent start, recipient or not, leaves the agent's `turnRouting` pointing at
  a `silent: true` object, and a `context_budget_restart` / `tool_result_guard_retry`
  continuation of a still-open prose turn then resumes it and swallows that turn's prose
  (probe 2). I reproduced this with no recipient envelope at all, so it predates all three
  layers and is not introduced here, and `framework.ts:24296-24298` asserts the precondition
  cannot arise in production (a capacity hold batches silent wakes with the turn's). Nothing
  enforces that invariant, so it is worth raising upstream, and the new docs sentence should not
  be read as a guarantee against it.
- `writeChannels` remains a behaviour change for any host that relied on `readJoinedChannels`
  alone, now with the fail-closed default documented; it must be set deliberately in the
  release-set host config, and `writeChannels: []` silently disables every channel auto-reply.
- The guard at `framework.ts:17495` is confirmed inert in production. Keeping it is a defensible
  port-fidelity call, now described accurately in both the code comment and the docs, but it is
  unverified code and must not be counted as the mechanism that produces the anchor guarantee.
- `0.30.0` is unchanged on both heads, so nothing downstream can distinguish fork main from
  upstream main by version; the release set must pin by SHA.
- Suite wall-clock was 273 s (stacked) and 271 s (standalone) on this box at concurrency 8,
  consistent with round 2's 273 s; I make no performance claim.

## Fix directions

1. `docs/recipient-compatibility.md:54` — scope the silent-start sentence to the open *logical*
   turn (`openLogical`), since `turnRouting` is replaced; optionally raise the
   `routingOf`-vs-`openLogical` resume precedence (`framework.ts:22701`/`24315`) upstream as its
   own issue, with `probe-no-recipient.mjs` as the repro.
2. `src/framework.ts:19721-19733` — report the agent's whole requeued set in `requestCount`, and
   either key the recipient deferral's throttle separately from `staleWarnAt` or let it carry the
   busy branch's `idle+turn-alive` / `idle+surgery(...)` qualifier, so the wedge tell is not
   starved.
3. `test/recipient-protocol.test.ts` — keep the new ingress row and re-add a direct-call row for
   the `noteDeliveredOrPark` guard, or state in the report that the guard is deliberately
   unverified.
4. `changelog.d/recipient-compatibility.added.md` — one bullet for the deferral diagnostic and
   the silent-start behaviour before the upstream PR (`CONTRIBUTING.md:50`).
5. Commit trailers — before the upstream PR, name the model per `CONTRIBUTING.md:82` and add
   `Co-Authored-By:` credit for Aspirational (#233) and nissa-seru (#361). Deferred by
   instruction this round; needs the manager's or owner's call.
