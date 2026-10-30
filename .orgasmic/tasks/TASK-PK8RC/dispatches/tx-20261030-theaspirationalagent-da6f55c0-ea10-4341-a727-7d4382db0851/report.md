# Review — TASK-PK8RC (slice C, owned typing) at 08a0ec8392d01d0cedd4017cc15d4fa4fd88f15b

Base B `27a321276c8c03efe3fbc810029d25d53ec04572`. Design pin `3be0d77f:docs/design/GENERIC-RECIPIENT-ROUTING.md`
§5, §6 rows 4–5/11/20–22, §7 row C, O3. Implementer report `/srv/review-drop/TASK-PK8RC-C1.md` read in full.

## Verdict

**APPROVE.** The owned lease, the frozen-destination binding of automatic typing, the frame-vs-lifecycle
cleanup split and the shared stale-deferral throttle are implemented as the design describes, and the
assertions are load-bearing: eight mutations I re-derived and re-ran independently were each killed by the
named test, for the named reason. No HIGH finding. One MEDIUM (an undocumented, wire-visible loss of
connector typing metadata when a lease is acquired) and five LOW findings follow.

## Findings

### MEDIUM — correctness/compat: acquiring a lease destroys the channel's unowned indicator *and* its routing metadata, and the host cannot refresh it for the turn's duration

`src/mcpl/channel-registry.ts:2286` (`startTypingAt`, the `forceStopTyping(ref)` handover) together with
`src/mcpl/channel-registry.ts:2285` (`if (running?.owner && !owner) return;`) and
`src/mcpl/channel-registry.ts:2355` (`this.typingMetadata.delete(key)` on every stop).

`startOwnedTyping` passes `metadata: undefined` (`:2273`). When a turn acquires a channel that a host is
already typing in, the handover force-stops that indicator, which deletes `typingMetadata[key]`; afterwards
every ordinary `startTyping(ref, metadata)` is refused outright, so the hint cannot be re-supplied, and the
owned 7 s refreshes carry no metadata at all.

Failure scenario (production path probe, `probes/probe-meta2.mjs`, output in `probes/probe-outputs.txt`): a
Zulip-style host shows typing with `{topic: 'design review'}`; a turn then acquires the lease; the host moves
the topic.

```
1 host start:                       [{"op":"start","metadata":{"topic":"design review"}}]
2 owned acquire:                    [{"op":"stop","metadata":{"topic":"design review"}},{"op":"start"}]
3 host metadata update while owned: []   stored: undefined
4 owner stop:                       [{"op":"stop"}]
```

At base the automatic start was a no-op on an already-typing channel (`startTypingAt`'s "Already typing"
branch) and every refresh read the host's latest `typingMetadata`, so the indicator kept hitting the right
topic/thread — exactly the behaviour the field's own doc comment at `src/mcpl/channel-registry.ts:1302-1304`
describes. For the whole turn the indicator now lands at the channel root instead.

The direction is deliberate — `test/channel-registry-typing.test.ts:191` asserts "an owned acquisition drops
unowned hints" and `:201` asserts "unscoped metadata cannot change the owned target" — and design §5 does
want the eventual target to be a negotiated thread field rather than opaque metadata. But that field is
explicitly out of this slice, so the slice lands the removal without the replacement, and nothing says so:
`docs/reply-routing.md:120-121` claims the opposite shape ("Ordinary unowned callers keep their metadata,
refresh and name fan-out behavior on unowned indicators" — true only for channels no turn types in), and
`changelog.d/owned-typing.fixed.md` does not mention it.

Fix direction: either (a) do not delete `typingMetadata` on the owner handover and let owned refreshes keep
carrying the channel's last host-supplied hint — ownership still governs *who may start/stop*, which is what
§5 actually requires — or (b) keep the current isolation but say so in `docs/reply-routing.md` and the
changelog as a named behaviour delta for metadata-targeting connectors, and add the assertion that the
pre-existing hint is dropped to the reply-routing docs section rather than only to a unit test.

### LOW — behaviour/test: `stopAll()` now emits a `channels/typing` stop per live indicator; base emitted none, and nothing asserts either way

`src/mcpl/channel-registry.ts:2734` replaced the explicit interval/metadata clear with `forceStopTyping()`,
which dispatches `sendTypingStop(ref)` (`:2353`) while `this.channels` is still populated. Probe
(`probes/probe-stopall.mjs`): `after stopAll: [{"serverId":"srv","channelId":"ch1","op":"stop"}]`; the base
implementation had no `sendTypingStop` on this path at all (see the removed comment in the diff).
`src/framework.ts:5831` calls it inside `stop()`, so shutdown is now wire-visible to any still-open
connection. This is defensible (and arguably better than letting indicators auto-expire), but it is an
unannounced wire delta, and the new lifecycle test does not pin it: `test/channel-registry-typing.test.ts:253`
sets `calls.length = 0` immediately after the cleanup, so the shutdown case asserts only that no *refresh*
survives.

Related, pre-existing but now exercised on more paths: `sendTypingStop` (`:2367`) does not check the
`channels.typing` grant that `sendTypingNotification` checks (`:4020`), so a server that is denied typing
still receives these stops.

### LOW — gap: a reply binding that lapses mid-turn blocks new acquisitions but does not release the live lease

`src/framework.ts:21749` refuses to acquire or move an indicator once `replyBindingCurrent(routing.reply)` is
false, but the already-running 7 s refresh keeps dispatching to that destination until the turn's terminal.
Publication on the same stale binding fails closed (`src/mcpl/channel-registry.ts:5996`,
`automatic_reply_stale`) and the turn only gets the private notice (`src/framework.ts:24377-24379`), so the
connection sees "typing…" for authority that has already lapsed. Not a regression (base had no staleness
check on typing at all) and transport close does force-clean (`:2723`), but non-transport invalidation
(`requiredAdmission.invalidate()`, grant loss, descriptor replacement) leaves presence running.
Fix direction: call `stopTurnTyping(routing)` where the stale-binding notice is injected, or re-check
liveness on the refresh tick.

### LOW — design: `forceStopTyping` is public on an exported class, so the bypass the slice closes is still reachable under a new name

`src/mcpl/channel-registry.ts:2338` is public, and `ChannelRegistry` is exported from `src/index.ts:83` for
"modules that need channel-level operations". Any module can therefore clear another turn's lease with
`forceStopTyping(ref)` — the stale-stop-clears-a-successor hazard this slice exists to close.
`docs/reply-routing.md:127-129` points lifecycle code at it without marking it host-internal.
Fix direction: mark it `@internal`/host-only in the doc comment and the docs section, or move lifecycle
cleanup behind a non-exported entry point.

### LOW — design/test: idle-TTL expiry releases typing by routing the whole turn through `endDroppedTurn`

`src/framework.ts:18081-18086`. Design §5's row asks only to "End owned typing/binding; do not turn idle TTL
into a reply continuation", and the observable outcome is right (`test/reply-routing.test.ts` "idle expiry
ends typing and binding before the independent closure wake"). But `endDroppedTurn`
(`src/framework.ts:12463-12473`) also runs `nameUnpostedSpeech`, `releaseTurnInputs`, `settledTurns.add` and
`codeExecution.scripts.turnEnded(..., false)` on a routing that, at this point, has usually already ended
normally. I could not construct a failure — the `!this.hasTurn()` guard covers active tokens and every
continuation source (`pendingContinuationAgents`, `:8821-8831`), `routing.unpostedSpeech` is deleted on first
use (`:21260`), and `turnEnded` is effectively idempotent — so this is a blast-radius and coverage note, not a
defect: no test exercises `endDroppedTurn` on an already-settled routing.

### LOW — robustness: unowned indicators lost their de-facto sweeper

Every base turn terminal called the global `stopTyping()`, which cleared *all* indicators, including ones a
host module leaked. That sweep is gone by design (successor safety), the registry's typing intervals have no
TTL and are not `unref`-ed (`src/mcpl/channel-registry.ts:2310`), and an owner handover only clears the
channel a turn actually types in. A host that leaks `startTyping` on any other channel now refreshes forever
and holds the event loop open until `stopAll()`. Bounded by `framework.stop()`, so low.

## Check (d), expanded per Soma: old assertion → retained coverage → external contract

Method, in three parts. (1) I ran the **base test files verbatim against head source** — every one of the
10 spy-site tests fails, and *every* failure message is an empty trace (`[]`), e.g.
`typing moves to the DM, once: []`, `typing showed on the trigger channel: []`
(`probes/oldtests-*.log`). Not one failure says "wrong channel" or "a stop missing from a non-empty trace":
the old probes simply stopped observing, because the `Proxy` stubs swallow the unknown `startOwnedTyping` /
`stopOwnedTyping` into their `() => undefined` fallback. So the rewrite was forced, not elective.
(2) I then restored the **base assertions verbatim** and added only an *observation adapter*
(`registry.startOwnedTyping = registry.startTyping` and the stop equivalent — 3 adapters in
explicit-prose-routing, 10 in present-while-acting, which is the brief's "10 spies"), rebuilt, and re-ran:
**8 of the 10 base tests pass unchanged against head** (`probes/adapt-*.log`).
(3) For the 2 that still fail, and for the external contract generally, I compared the **server-visible
`channels/typing` notifications** for the same public call sequence on a real `ChannelRegistry` built from
each tree (`probes/wire-probe.mjs`, `probes/wire-probe-output.txt`).

| # | Head site | Old assertion (at 27a32127) | Retained coverage at head | Base assertion verbatim on head | External (wire) contract |
| --- | --- | --- | --- | --- | --- |
| 1–4 | `test/present-while-acting.test.ts:476-477` (4 parameterized: locus / hybrid / hybrid-with-`>>>` / text-before-block) | `shown` collects `start <ch>` / `stop <ch>\|(all)`; asserts typing moves to the re-pinned channel once, and that the old channel stops first | identical assertions; only the spied method names changed | **PASS** | unchanged (S3 identical base/head) |
| 5 | `test/present-while-acting.test.ts:1498-1499` | "a budget restart that re-pins its turn stops the typing its earlier stream left in the old channel" | identical assertion | **PASS** | unchanged (S3) |
| 6 | `test/present-while-acting.test.ts:2469-2470` | "channel_open moves the pin mid-turn…", typing follows it | identical assertion | **PASS** | unchanged (S3) |
| 7–8 | `test/present-while-acting.test.ts:2539-2540` (2 variants, incl. XML tool mode) | "a channel_open just before an empty final response doesn't start typing in the opened channel" | identical assertion | **PASS** | unchanged |
| 9 | `test/present-while-acting.test.ts:2570-2571`, assertion `:2579` | `deepEqual(shown.filter(x => x !== 'stop (all)'), ['start discord:guild:observatory'], 'typing shows only in the opened channel, and nothing else is stopped')` | `deepEqual(shown, ['start discord:guild:observatory', 'stop discord:guild:observatory'])` — the **whole** sequence is pinned, so "nothing else is stopped" is asserted directly instead of by filtering a label away | **FAIL**, label shape only: observed `["start discord:guild:observatory","stop discord:guild:observatory"]`; the base predicate filtered the terminal stop out because it carried the `(all)` label, and head's carries the channel | unchanged (S1 byte-identical: `start X, stop X`) |
| 10 | `test/explicit-prose-routing.test.ts:1859-1860`, assertions `:1881-1883` | `ok(typing.includes('start chan-alpha'))`; `equal(typing.includes('stop chan-alpha'), false, 'and stayed there until the turn ended')`; `ok(typing.includes('stop (all)'), "control: the turn's end stopped it")` | `ok(typing.includes('start chan-alpha'))`; `deepEqual(typing.filter(startsWith 'stop '), ['stop chan-alpha'])` — exactly one stop, ever; `equal(typing.at(-1), 'stop chan-alpha')` — and it is the turn's end | **FAIL**, label shape only: observed `["start chan-alpha","start chan-alpha","stop chan-alpha"]`; that single stop *is* the terminal one, which is what "stayed there until the turn ended" meant. At base a channel-scoped stop could only come from a mid-turn move, so the base predicate used `includes(…) === false` as a proxy for "no mid-turn stop" | unchanged (S1 byte-identical) |

Non-asserting spy renames in the same rewrite, for completeness (`Proxy` no-ops, or assertions unchanged):
`test/clock-rows.test.ts:331`, `test/silent-heartbeat-rows.test.ts:172`, `test/silent-heartbeat.test.ts:50-51`,
`test/explicit-prose-routing.test.ts:1560`, and `test/tool-wrapper-prose-guard-integration.test.ts:465-466,484`
and `:524-525,550-551`. The last two are **tightenings**: base accepted
`includes('stop:(all)') || includes('stop:world:test')`; head requires the channel-scoped form.

**Is the public-call/effect contract preserved?** Yes, with one deliberate exception. Driving a real registry
from each tree through the same public sequence a turn frame makes (start → [move] → terminal; base
`startTyping` / `stopTyping()`, head `startOwnedTyping` / `stopOwnedTyping`), recording what `sendTypingFn`
hands the server:

| Scenario | base wire | head wire |
| --- | --- | --- |
| S1 — only this turn's indicator exists (**the setup of all 10 rewritten tests**) | `start A, stop A` | `start A, stop A` |
| S3 — mid-turn locus move, then terminal | `start A, stop A, start B, stop B` | `start A, stop A, start B, stop B` |
| S2 — a host module is also typing in another channel | `start B, start A, stop B, stop A` | `start B, start A, stop A` |

S1 and S3 are byte-identical, so no rewritten test's observable effect changed. S2 is the only external
delta — the terminal no longer stops an indicator the turn does not own — and that *is* the slice's purpose
(design §5: "a stale stop cannot clear a successor"; "Unscoped frame start/stop cannot acquire or remove
owned indicators"). No rewritten test sets up a second indicator, so nothing that still exists lost
coverage: what the base `stop (all)` label incidentally witnessed is the behaviour being deleted on purpose.
Its one real consequence is recorded as LOW 6 above.

**Disabled mode (no automatic typing).** Untouched by the rewrite, and strictly better covered. None of the
10 spy-site tests runs in disabled mode, and no base test asserted anything about automatic typing in
disabled mode at all — the only base `proseRouting: 'disabled'` typing-adjacent case
(`27a32127:test/present-while-acting.test.ts:2271`) is about *sleep announcements*, and its spies were not
touched. At base the behaviour was already "none", provably from three lines: `const turnLocus =
turnProseRouting === 'disabled' ? undefined : routing.locus` (`27a32127:src/framework.ts:24211`) feeds
`earlyTypingChannel = turnProseRouting === 'explicit' ? … : turnLocus ?? null` (`:24248`), which is `null` in
disabled mode, and `driveStream`'s own `turnProseRouting === 'disabled' ? null : …` suppressed the second
site. Head preserves that *and* adds the first wire-observed assertion of it — `reply-routing.test.ts`
"automatic typing uses the frozen turn destination before and after compile in **disabled** mode" asserts
`early.length === 0` and `x.typings.length === 0` against the real registry's `sendTypingFn`. That assertion
is necessary rather than decorative, because head's new `routing.reply ? routing.reply.destination` branch
sits *ahead* of `turnLocus` at both callsites and would otherwise have introduced typing in disabled mode;
removing all three guards (my `disabled-mode` mutation) makes it report `disabled mode emits no early
typing: 1 !== 0`.

**Verdict on (d): no assertion was weakened**, so no finding is due here. Two assertions were re-expressed
because their old form encoded the *method argument* (`(all)`) rather than the effect, and in both cases the
head form is strictly stronger — exactly-one-stop and full-sequence equality, versus a filtered `includes`.

## Informational — items the brief asked me to decide

- **(c) disabled mode is unchanged relative to base.** Confirmed, and the new guards are load-bearing rather
  than redundant. At base `turnLocus` is already `undefined` in disabled mode
  (`git show 27a32127:src/framework.ts`, `const turnLocus = turnProseRouting === 'disabled' ? undefined : …`),
  so `earlyTypingChannel` was `null` and `driveStream` had its own disabled branch: base emitted no automatic
  typing in prose-disabled mode. Head inserts a `routing.reply ? routing.reply.destination` branch *ahead* of
  `turnLocus` at both sites, which would have introduced typing in disabled mode; the added
  `turnProseRouting === 'disabled' ? null` branches and `showTurnTyping`'s `agent.proseRouting === 'disabled'`
  check are what preserve Alnold's contract. Removing all three (my `disabled-mode` mutation) makes
  `reply-routing` report `disabled mode emits no early typing: 1 !== 0` — i.e. the guard, not luck, holds it.
- **(d)** see the dedicated section above: no assertion was weakened; 8 of the 10 base tests pass verbatim
  against head under an observation adapter, and the server-visible typing notifications are byte-identical
  in every shape those tests set up.
- **(e) throttled diagnostics.** `warnStaleRequests` (`src/framework.ts:19560`) is shared by the scheduler
  reply-deferred branch, the busy branch and the new direct-start deferral (`:23342`); one 60 s per-agent
  stamp gates both the trace and stderr; quiesce suppresses; `reduce(Math.min)` replaced a `Math.min(...spread)`
  on an unbounded array. Request age is never rewritten — the `deferred-age` mutation
  (`{...trigger, timestamp: Date.now()}`) is killed. Minor nit only: the scheduler's reply-deferred call omits
  the pass's `now` and takes a fresh `Date.now()` while the busy call passes `now`; harmless at a 30 s
  threshold.
- **AST no-literals guard** asserts it inspected every named boundary
  (`test/routing-runtime-has-no-connector-literals.test.ts:60`), which is the right shape. It covers the five
  registry methods and four framework methods but not the module-level `sameTypingOwner` helper
  (`src/mcpl/channel-registry.ts:685-687`) or the `TypingOwner` interface (`:679-683`); neither contains
  literals today. A larger gap in the same spirit: the *destination-choosing* code is not in the method list
  either — `earlyTypingChannel` lives in `startAgentStream` (`src/framework.ts:24290-24296`) and
  `typingChannel`/`followTurnLocus` in `driveStream` (`:25050-25065`), so a connector literal in the place
  that actually picks the typing target would pass the guard. `connectorVocabulary`
  (`test/routing-runtime-has-no-connector-literals.test.ts:9`) does cover the second connector, as the
  `connector-ast` mutation shows.
- **Changelog category.** `changelog.d/owned-typing.fixed.md` is filed as `fixed`, but the slice also adds
  public API (`startOwnedTyping`, `stopOwnedTyping`, `forceStopTyping`, and the `TypingOwner` export in
  `src/index.ts:84` / `src/mcpl/index.ts:179`), which the release fold will therefore not list under Added.
  Format itself is valid per `changelog.d/README.md` (flat `<slug>.<type>.md`, bullets, two-space
  continuations, no headings).
- **Hygiene (h).** Clean. `git diff 27a32127..08a0ec83 -- src docs changelog.d | grep '^+'` matches none of
  `orgasmic|PK8RC|alnold|tarn|gpt-|/srv/|/home/|ledger|dispatch|reviewer|implementer|theaspirational`.
  The `Co-Authored-By: GPT-6.1-Sol` trailer and the PR body's AI-assistance line follow
  `CONTRIBUTING.md:74-82` and the repo's existing trailer history. `changelog.d/owned-typing.fixed.md` matches
  the required `<slug>.<type>.md` fragment format. No `.skip`/`.only` added.

## Verification Gates

| Gate | Command | Outcome | Log |
| --- | --- | --- | --- |
| `reviewer-head-node22233` (mine) | `orgasmic dispatch gate reviewer-head-node22233 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 "$ORGASMIC_EVIDENCE_DIR/reviewer-suite.sh" /opt/node-v22.23.3-linux-x64/bin` (`npm run typecheck && npm run build && AF_TEST_CONCURRENCY=8 npm test`), cwd = review worktree at 08a0ec83 | **exit 0** — Node v22.23.3, 9792 tests, **9729 pass / 0 fail / 63 skip**; footer `HEAD 08a0ec83… clean=yes` | `$ORGASMIC_EVIDENCE_DIR/gate-reviewer-head-node22233-01M67E0XZ6W6W1AVHHP1MMFA05.log` |
| `qualified-head-node22233` (reused receipt) | `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 run-final-suite.sh /opt/node-v22.23.3-linux-x64/bin` | exit 0 — 9792 tests, 9729 pass / 0 fail / 63 skip; log footer `HEAD 08a0ec83… clean=yes` | `…/run-01M67A45AAA93376VDXNYS0VY1/evidence/gate-qualified-head-node22233-01M67CFP4GYVZ60KH4AKCH6XK6.log` |
| `qualified-head-node22120` (implementer, read only) | same script, Node 22.12.0 | reported 9729 / 0 / 63 | `…/gate-qualified-head-node22120-01M67CFQ5ZWP803X6Z214E44WH.log` |

Reuse of `qualified-head-node22233` is eligible under the receipt rules: clean tree at exactly this commit,
exit 0, recorded by the daemon. I ran my own full suite anyway, per brief item (g).

### Independent probes (outside the worktree: `/tmp/pk8rc-review` at head, `/tmp/pk8rc-base` at 27a32127 — both detached from the shared gitdir, both built with `npm run build` exit 0 on Node 22.23.3)

Baseline in the copy, Node 22.23.3: `npm run build` exit 0; `channel-registry-typing` 14/14,
`reply-routing` 55/55, `reply-routing-transport` 54/54, `routing-runtime-has-no-connector-literals` 4/4 —
all 0 fail.

Eight mutations re-derived from the source (script `probes/reviewer-mutations.py`, results
`probes/reviewer-mutations.json`, per-mutation logs `probes/rev-mut-*.log`). Each rebuilt cleanly (so no kill
came from a type/import error) and each was killed by its named assertion:

| Mutation | Killing test |
| --- | --- |
| `owner-turn` (`a.turnId === b.turnId` → `true`) | owned successor survives predecessor stops on the same and different channels |
| `owned-stop` (owned stop matches every owner) | owned successor survives predecessor stops on the same and different channels |
| `unscoped-start` (drop the owned-lease guard on unscoped starts) | unscoped frame starts and stops cannot acquire, refresh or remove an owned indicator |
| `channel-removal` (drop force cleanup on channel removal) | lifecycle remove-channel force-cleans owned typing without touching another server |
| `frozen-target` (drop `channel = routing.reply.destination`) | turn cleanup cannot erase a successor… (`+'endpoint-b','room/other'` vs `-'endpoint-a','room/one'`) |
| `stale-threshold` (30 s → 60 s) | direct deferral reports the whole queue and busy qualifier through the shared throttle… |
| `unbound-binding` (drop the `requiresReplyBinding` guard) | real stdio: an unbound wake cannot type on a reply-authorized connection — all three of locus/hybrid/explicit |
| `disabled-mode` (remove all three disabled guards at once) | automatic typing uses the frozen turn destination … in disabled mode (`disabled mode emits no early typing: 1 !== 0`) |

Production-path probes against the built registry (`probes/probe-meta2.mjs`, `probes/probe-stopall.mjs`,
outputs in `probes/probe-outputs.txt`) support the MEDIUM and the first LOW above. The base-vs-head
wire-equivalence probe and the two old-assertion runs behind check (d) are `probes/wire-probe.mjs` /
`probes/wire-probe-output.txt`, `probes/oldtests-*.log` (base tests verbatim on head source: 10 failures, all
empty traces) and `probes/adapt-*.log` (base assertions verbatim plus an observation adapter: 8/10 pass).
The review copy was restored to head and rebuilt afterwards.

Source audit rather than test: all seven base call sites of `channelRegistry.stopTyping()` in
`src/framework.ts` (base lines 21725, 23592, 23797, 24321, 24404, 24452, 24501, 26972) are accounted for —
six became `stopTurnTyping(routing)`, and the one deleted at base:23592 is covered because both
`endContinuedTurn` branches now reach a stop (`endStoppedStart` → `:23839`, or `endDroppedTurn` → `:12464`).
`routing` in `startAgentStream` and `streamRouting` in `driveStream` are the same object
(`this.turnRouting.set(agent.name, routing)` at `:24134` precedes both the early start at `:24296` and
`routingOf` at `:24845`), so explicit mode's `streamRouting.typing ?? null` cannot orphan the early lease.
`showTurnTyping`'s staleness check uses the production liveness closure, which already includes
`requiredAdmission.isCurrent(key)`, server identity, publish grant and channel registration
(`src/framework.ts:34990-34997`), so an epoch-invalidated binding cannot type.

## Unmet criteria / test gaps

- **Design rows 4 and 11 are satisfied only in their channel dimension.** Both rows are written about threads
  ("different thread", "same-thread successor"); the witnesses use different/identical registered *channel*
  targets. That narrowing is the owner-sanctioned carve-out (narrowed B dropped thread transport; the brief
  puts threaded typing out of scope) and the docs say so (`docs/reply-routing.md:133-136`), but the rows are
  not fully closed and should not be recorded as such.
- No test pins whether `stopAll()`/shutdown emits typing stops (LOW 2), nor the ungranted-stop asymmetry.
- No test covers `endDroppedTurn` on an already-settled routing (LOW 5).
- No test covers a mid-turn binding invalidation while an indicator is live (LOW 3).
- `showTurnTyping`'s `routing.silent` guard (`src/framework.ts:21745`) is witnessed only through a direct
  private-scaffolding call ("typing defensive boundary refuses private, invalidated and silent bindings"),
  which is also what kills the `silent-boundary` mutation. The end-to-end silent case in "private and silent
  turns emit no automatic typing" is actually suppressed one layer earlier, because `suppressProse` makes
  `turnProseRouting` `'disabled'` (`:23890`) and the callsite's disabled branch returns `null` first. The
  `routing.silent` check is therefore defence in depth with no production-path witness of its own — fine, but
  not the coverage the test name suggests.
- The AST guard does not reach `sameTypingOwner` (informational, above).
- I did not re-run the `qualified-head-node22120` gate; Node 22.12.0 rests on the implementer's receipt.

## Residual risk

- The MEDIUM metadata delta is invisible to this repo's own suite (nothing in `src/` calls
  `startTyping(ref, metadata)` — the only in-repo typing consumer, `src/modules/discord/index.ts:520`, runs
  its own loop), so it can only show up against an external host that supplies routing hints.
- One-indicator-per-channel means a second agent typing in the same channel force-stops the first's lease and
  takes it. That is the design's explicit model, not a defect, but it is a visible cross-agent interaction
  with no "restore the predecessor on release" step.
- Nested-thread typing targets, thread transport negotiation, context-only wire delivery and any blanket
  status/reaction/draft guarantee remain out (O3 respected: `docs/reply-routing.md:135-136`).
- Everything here is runtime/test evidence; no live connector, provider or deployment was exercised.

## Fix directions (summary)

1. MEDIUM: keep the channel's `typingMetadata` across an owner handover (or document the drop in
   `docs/reply-routing.md` and the changelog as a named delta for metadata-targeting connectors).
2. LOW: assert the shutdown stop emission one way or the other, and gate `sendTypingStop` on
   `channels.typing` as `sendTypingNotification` is.
3. LOW: release the live lease where the stale-binding notice is injected (`src/framework.ts:24377`).
4. LOW: mark `forceStopTyping` host-internal.
5. LOW: give idle-TTL expiry a narrower release than `endDroppedTurn`, or cover the already-settled case.

Review-only: no commits, no tracked-file edits. Probe copy lives at `/tmp/pk8rc-review` (detached from the
shared gitdir); artifacts in `$ORGASMIC_EVIDENCE_DIR/probes`.
