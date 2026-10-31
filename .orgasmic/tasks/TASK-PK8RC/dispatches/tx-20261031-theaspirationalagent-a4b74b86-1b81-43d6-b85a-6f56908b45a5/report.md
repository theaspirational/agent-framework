# TASK-PK8RC — bounded delta review of the C LOW round

Range `d3230a69002b493fef94e501fbf5cfc9a211080b..3c95d166242892206b5e1e5d624b3c9ebb062323`
(8 commits, 9 tracked paths). Read in full: `/srv/review-drop/TASK-PK8RC-LOWS-FINAL.md`
(sha256 `85d5d524…d567c`, **matches**) and `/srv/review-drop/TASK-PK8RC-REREVIEW1.md`
(LOW a–e). Not a whole audit. Attribution as given: Tarn is the task operator, Soma the
programme qualifier; nothing here is recorded as an owner decision of Vasyl's.

## Verdict

**REJECT.** LOW a, c, d, e are closed as described. LOW b is not: the identity-guarded
retirement shipped in `cce9e844`/`9cfce380` made *entry* deletion — not just hint
deletion — conditional on captured provenance. Three ordinary production paths now
leave a disconnected server's channel entries in `this.channels`, and a leaked entry
still resolves to the dead server (`resolveChannel` → `framework.ts:37090`), which is
exactly the condition `removeServer`'s own contract exists to prevent ("so a dead
server's channels don't linger and route speech into the void",
`src/mcpl/channel-registry.ts:2710-2712`). The two tests that would have caught it pass
only because their double was changed to `getServer: () => null`; with a real identity
both fail. Separately, the captured-pair comparison that is the whole point of the round
is not load-bearing in any test: three mutants I derived from the brief survive.

Items 2, 3, 4, 6 (assertion text), and 7 check out independently and are reported below.

## Findings

### HIGH — bug/regression `src/mcpl/channel-registry.ts:2746-2748`: guarded retirement refuses to retire its *own* entries, so a disconnected server's channels linger and still resolve

`retireRegistration` returns `false` — deleting nothing — whenever the entry has no
`channelRegistrations` record, or has `replacedWithinEpoch`, or carries a different
epoch of the same connection. `removeServer` (`:2722-2724`) is the only caller on the
disconnect path, so those entries are never retired. At base, `removeServer(serverId)`
deleted every entry of that server unconditionally
(`git show d3230a69:src/mcpl/channel-registry.ts:2698-2702`). Three triggers, all
ordinary:

1. **Lazy push registration.** `registerEntry` at `:2252` (the `ensureChannelRegistered`
   path, for "a push for a channel no registration has", e.g. after a host restart) is
   the one call site that passes no connection/epoch, so the entry gets **no WeakMap
   record at all**. Probe `probes/lazy-probe.mjs`:
   ```
   has channelRegistrations record: false
   channels after guarded disconnect: [ '["srv","pushed"]' ]
   resolveChannel("pushed") on the dead server: {"serverId":"srv","channelId":"pushed"}
   ```
2. **Same-epoch re-announce.** `registerEntry:1589-1592` sets `replacedWithinEpoch` when
   the previous entry for the key had the same (connection, epoch) — which any server
   that calls `channels/register` twice, or names an already-registered channel in
   `changed.added` (`:1814`), produces. Such an entry can **never** be retired by a
   guarded call. Probe `probes/route-probe2.mjs`:
   ```
   ### same-epoch re-announce = true     resolveChannel("room"): {"serverId":"srv","channelId":"room"}
   ### same-epoch re-announce = false    resolveChannel("room"): {"error":"No channel has the id \"room\"…"}
   ```
3. **Earlier-epoch registration.** An entry registered before a reconnect keeps the old
   epoch (`transportClosed` retains registrations); the later disconnect carries the
   current pair and the epoch comparison refuses. Probe `probes/leak-probe.mjs` P3:
   `entry after removeServer(conn,2): SURVIVED (leak)`.

Also unreached for those entries: the `typingHintWarnAt` reap (`:2750`) and
`forceStopTyping` (`:2751`).

The binding rulings required the *hint* deletion to be provenance-gated and, on
mismatch, that a **replacement's** entry be spared (Tarn 23:35/23:36, Soma addition 3).
None of the three cases above involves a replacement; the implementation generalised the
refusal to any entry it cannot prove, which is scope overreach against the explicit
"legacy behaviour unchanged / conservative = current behaviour" condition for entries.

**Fix direction:** keep the hint (and the `typingMetadata.delete`) provenance-gated, but
delete the `ChannelEntry` whenever it is the entry currently at the key and no
*newer-provenance* entry has replaced it — i.e. refuse only when the WeakMap record
shows a strictly newer (connection, epoch) than the caller's. Give `registerEntry:2252`
the connection/epoch it can obtain from `serverRegistry.getServer(serverId)` at
registration time, or treat a record-less entry as retirable.

### HIGH — bug/regression `src/mcpl/channel-registry.ts:2717` + `src/framework.ts:34399`: the second disconnect pass is unconditionally inert, and the docs assert the opposite

`removeServer`'s function-level guard early-returns when
`this.serverRegistry.getServer(serverId) !== connection`. By the time
`framework.ts:34399` runs, `framework.ts:34373`/`:34384` have already awaited
`registry.removeServer(id)` on the **mcpl server registry**, which removes the
connection — so `getServer(id)` returns `undefined` and the second pass returns before
doing anything. Its documented purpose is lost: "Whatever was registered since: a
connect that was still handshaking, whose own removal couldn't reap, is re-checked here"
(`:34383`). Probe `probes/leak-probe.mjs` P2:

```
serverRemovals after pass 1: 1
serverRemovals after pass 2: 1 (base incremented again)
late-registered channel b: SURVIVED disconnect
```

Besides the entry, the skipped second increment of `serverRemovals` (`:2721`) means
lifecycle work queued by that in-flight connect between the two passes is no longer
cancelled (`:3734`, `:3766`, `:3923`).

`docs/reply-routing.md` states "Both retirement calls (`src/framework.ts:34363/:34399`)
carry that original pair across awaits" — literally true, materially false: the second
call can never act. The repo's own test for this case
(`test/channel-lifecycle-order.test.ts:1853-1881`, "a channel its server registers while
a disconnect closes it is removed with the rest") passes only via the `getServer: () => null`
double; see the MEDIUM below.

**Fix direction:** drop the function-level current-connection guard (the per-entry check
in `retireRegistration` is already the authority) and gate only entry/hint retirement, so
`serverRemovals` and the `defaultPublish*` reset still run on the captured pair; or
capture the connection identity for the second pass independently of the mcpl registry's
current contents.

### MEDIUM — test `test/channel-lifecycle-order.test.ts:1838,1866`: the two legacy doubles were given `getServer: () => null`, which moves both tests off the production path; with a real identity both fail

Item 6 answered precisely: **no assertion text was weakened.** The whole diff to that
file is 4 added lines, two comments and two `getServer: () => null` entries; the
assertions (`'nothing queued for its channels can run against the closing connection'`,
`'no channel of the disconnected server outlives its disconnect'`) are byte-identical.

But `runDisconnectMcplServer` reads `registry.getServer(id) ?? undefined`
(`framework.ts:34357`), so `null` makes `connection` undefined and the entire guarded
path is bypassed — both tests now exercise the legacy ID-only branch, not the branch
production takes. Replacing the double with a registered identity
(`{ id: 'test', transportEpoch: 0 }`) in a scratch copy of the build
(`/tmp/pk8rc-rev3`, worktree untouched) fails both:

```
not ok 1 - disconnecting a server removes its channel entries before its connection closes
    nothing queued for its channels can run against the closing connection
    1 !== 0
not ok 2 - a channel its server registers while a disconnect closes it is removed with the rest
    no channel of the disconnected server outlives its disconnect
# tests 2  # pass 0  # fail 2
```

Test 1 fails because its fixture registers via `handleChanged('test', {added:[…]})`
with no identity (HIGH-1 trigger 1); test 2 because of HIGH-2. These are the only two
tests covering the disconnect-ordering contract, and the substitution is why the two
HIGHs shipped. The round report describes this as "corrected by adding
`getServer: () => null` without changing assertions", which is accurate about the
assertions and silent about the lost path coverage.

**Fix direction:** keep a registered identity in both doubles and fix the production
behaviour; retain a separate ID-only variant for the legacy contract.

### MEDIUM — test/verification: the captured `(connection, transportEpoch)` comparison is not load-bearing; three mutants named by the brief survive at the delivered head

Re-derived independently and run against
`channel-registry-typing, typing-transport-epoch, channel-lifecycle-order,
channel-lifecycle-provenance, shared-channel-id, reply-routing, channel-registry-routing`
(baseline 462 tests / 462 pass / 0 fail), driver `/tmp/mutate3.py`, build restored and
sha-verified afterwards:

| Mutant | Site | Result |
|---|---|---|
| **M1b** drop `connection.transportEpoch !== transportEpoch` from the `removeServer` guard | `:2717` | **SURVIVED** 462/462 |
| **M2b** drop the captured-pair value comparison, keep the current lookup | `:2746` | **SURVIVED** 462/462 |
| **M7** drop the current lookup, keep the captured pair | `:2747` | **SURVIVED** 462/462 |
| M6 drop the whole captured block (current lookup only) | `:2746-2748` | KILLED — `guarded removal refuses entries without captured registration provenance`, both same-pair tests |
| M3 drop `typingMetadata.get(key) === hint` in `stopAll` | `:2805` | KILLED — `shutdown preserves a host hint when its hint is replaced after the snapshot` |
| M5 drop `this.channels.get(key) === entry` in `stopAll` | `:2805` | KILLED — `shutdown preserves a host hint when its entry is replaced after the snapshot` |
| M4 drop the `replacedWithinEpoch` ambiguity refusal | `:2746` | KILLED — both `same-pair … conservatively refuses re-registration cleanup` tests |

M2b and M7 together show the captured check and the current-pair lookup are mutually
redundant for every test in scope: only the *existence* of a WeakMap record
(`!registration`) and `replacedWithinEpoch` are actually witnessed. The round report's
mutation table claims three rows that my results do not support at `3c95d166` —
"Connection comparisons", "Epoch comparisons" and "Replace original pair by current
lookup in retirement". Reading the implementer's driver
(`…/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/mutations-delivery.py:8-10`) explains why:
`registration-connection-check` and `registration-epoch-check` each delete **both** the
captured and the current conjunct in one patch, so neither isolates the captured
mechanism; `registration-current-pair-lookup` overwrites `connection`/`transportEpoch`
*before* the captured comparison, which the captured comparison then catches. The
mutants are killed as written; they do not measure the property Soma's condition (2) was
about. (`disconnect-current-pair-lookup`, line 20, *is* isolated and genuine.)

Note for the record: the delivered code **does** look the pair up as "current" at
deletion time (`:2717`, `:2747-2748`) — the mechanism condition (2) forbade as the
basis. As an added conjunct it is only strengthening, but per M7 it is also the half
that carries every test, and per HIGH-2 it is what makes the second disconnect pass inert.

### MEDIUM — bug `src/mcpl/channel-registry.ts:1754-1757`: a legitimate `channels/changed` removal is answered `accepted: false, reason: "registration changed"` and the channel stays registered

Server-facing face of HIGH-1 trigger 2. Probe `probes/wire-probe.mjs`:

```
channels/changed removal answer: {"results":[{"id":"room","accepted":false,"reason":"registration changed"}]}
entry still registered: true
```

Base answered `accepted: true` and deleted. A §14.5 server that re-announced a channel
in its current epoch can no longer remove it and is told its own removal was refused.
The report discloses the refusal abstractly ("This also refuses legitimate later
pair-qualified removal within that epoch") but not that it is wire-visible on the
itemized result. **Fix direction:** as HIGH-1 — `replacedWithinEpoch` should not block a
removal whose pair is current and for which no newer-provenance entry exists.

### LOW — behaviour `src/mcpl/channel-registry.ts:1756`: an identified removal of an unregistered channel no longer force-stops typing

Base called `this.forceStopTyping(ref)` unconditionally; head calls it only when
`!entry && !connection && transportEpoch === undefined`, so on the production
(identified) path a removal for a channel with no entry stops nothing. No hint
difference (`stopTypingWhere`'s `clearOrphanHints` defaults to `false`, `:2386`), so the
only loss is a live interval for a ref whose entry is already gone. Narrow; noted for
completeness. Legacy ID-only `handleChanged`/`removeServer` are otherwise unchanged
(verified by reading both branches and by `probes/leak-probe.mjs` P4).

### LOW — diagnostics `src/mcpl/channel-registry.ts:2750`: warn stamps for un-retirable entries are reaped only by cap eviction

The `typingHintWarnAt.delete(key)` reap sits after the refusal returns, so every entry
covered by HIGH-1 keeps its stamp until the 256-entry LRU evicts it. Bounded and
disclosed as bounded-by-size; no unbounded growth.

## Verification Gates

**No implementer receipt was reused as acceptance.** My own focused run, fresh, through
the dispatch gate, Node 22.23.3, in a 16G/zero-swap scope with a whole-command bound:

```
orgasmic dispatch gate rev-focused-22233 -- systemd-run --user --scope \
  -p MemoryMax=16G -p MemorySwapMax=0 timeout --signal=TERM --kill-after=60s 1800s \
  $ORGASMIC_EVIDENCE_DIR/run-focused.sh
```

Payload: `npm run typecheck && npm run build` (both clean) then, in one Node process,
`channel-registry-typing, typing-transport-epoch, channel-lifecycle-order,
channel-lifecycle-provenance, channel-registry-routing, reply-routing,
routing-runtime-has-no-connector-literals, discord-typing-keepalive`.

| Gate | Node | Commit | Exit | Total | Pass | Fail | Skip | Cancelled |
|---|---|---|---:|---:|---:|---:|---:|---:|
| `rev-focused-22233` | 22.23.3 | `3c95d166` | 0 | **353** | **353** | **0** | **0** | **0** |

Log: `gate-rev-focused-22233-01M67TTK17XG9RY7YX7QR64NQ1.log`. duration_ms 50029.86,
`head=3c95d166… clean=yes`. No timeout, no truncation. Worktree left clean
(`git status --porcelain` empty; only ignored `dist/`).

Mutation and test-double work ran in `/tmp/pk8rc-rev3` (a copy of `dist`/`node_modules`,
outside the tracked tree); the worktree build was never mutated. Unmutated baseline
there: 462 tests / 462 pass / 0 fail. The 4 `routing-runtime-has-no-connector-literals`
subtests fail in that scratch copy for want of `src/` and are discounted, not counted as
kills. Probes under `$ORGASMIC_EVIDENCE_DIR/probes/`.

Reusable receipt read, not rerun: `r4-isolated-head-22233` exit 0 at `3c95d166`.
Not re-executed and not relied on for acceptance: the four full-suite cells, the isolated
pairs, and the 22.12.0 leg. Two statements in the round report I can confirm
independently: `test/shared-channel-id.test.ts` is **unchanged in the range**
(`git diff --stat d3230a69..3c95d166 -- test/shared-channel-id.test.ts` is empty), so the
"stopping everything forgets each channel's typing metadata…" assertion at `:965-974` is
byte-identical to base; and the 22.23.3 head wrapper exit is genuinely absent, reported
as unknown rather than inferred.

### Item 2 — lifecycle table, re-derived from source

Confirmed, with one correction of emphasis. `transportEpoch` is declared
`src/mcpl/server-connection.ts:460` ("Increments at every transport boundary") and its
**sole** increment is `:602` inside `resetPolicyForTransportBoundary` (`:598-602`),
called from `:2073` (explicit close), `:2255` and `:2305` (reconnect, before handshake
for required admission / before adopting the replacement transport), and `:2959`
(transport loss). So: a transport-boundary counter, not a reconnect counter — as the
brief states.

**(A) parsed transport controls.** `const epoch = this.transportEpoch` is captured in the
closure of `setupMessageRouting` at `:2573`, before the `transport.on('line', …)`
handler; the old-epoch drop is `:2607-2610` (`if (epoch !== this.transportEpoch)
{ this.afterBoundary(request, epoch); return; }`); emission is synchronous through
`dispatchInboundEvent` `:2739-2742`; the framework's registry calls are
`framework.ts:35156`/`:35171`, and the registry's own removal is synchronous before its
first await. All four line references hold.

**(B) disconnect → removeServer.** Capture at `framework.ts:34357-34358`
(`registry.getServer(id) ?? undefined` and `connection?.transportEpoch`), carried to
`:34363` and `:34399`; guard at `channel-registry.ts:2715-2725`. Holds as written — but
see HIGH-2: `:34399` cannot act.

**close / error.** `framework.ts:35454-35459` calls `transportClosed(connection.id)`,
**not** `removeServer`; `:35437-35443` emits only an `mcpl:server-error` trace. Confirmed.

**(B) is proven separately from (A).** `test/typing-transport-epoch.test.ts` carries
distinct subtests, all passing in my run: `old line-closure epoch drops delayed controls
after same-object reconnect before registry dispatch` (A) versus `disconnect carries its
start pair across delayed teardown (sameObject=false)` and `(sameObject=true)` (B), plus
`late close/error reports keep replacement registration and hints` for both
`sameObject` values.

### Items 3, 4, 7

- **Item 3 — `stopAll` (`:2801-2808`).** Snapshot is taken only over
  `typingIntervals` filtered `!typing.owner`, and retires only when
  `this.channels.get(key) === entry && this.typingMetadata.get(key) === hint`. Owned,
  post-snapshot-replaced and idle orphan hints are untouched; both `===` comparisons are
  mutation-killed (M3, M5 above). The existing shared-channel shutdown assertion is
  byte-identical to `d3230a69` (file unchanged in range). **Confirmed as described.**
- **Item 4 — diagnostics map (`:1307`, `:2298-2302`).** Keyed by `destinationKey`, 60 s
  per-key window, hard cap of 256 with eviction of the least-recently-emitted key
  (delete-then-reinsert keeps Map order as recency). Reaped at `:2750`
  (`retireRegistration`) and cleared at `:2814` (`stopAll`); `transportClosed`
  (`:2758+`) does **not** touch it, so a transient disconnect does not reap. **Confirmed
  as described**, with the LOW above about refused retirements.
- **Item 7 — hygiene.** All 8 commits authored and committed
  `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, each with a
  single `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>` trailer. Scanning the diff,
  all 8 commit messages and the report's PR body for
  `orgasmic|PK8RC|alnold|tarn|soma|gpt-6|/srv/|/home/|ledger|dispatch|reviewer|implementer|theaspirational`
  returns only the ordinary JSON-RPC sense of "dispatch" and the `@internal` JSDoc tags.
  No internal operator names, no private paths. **Clean.**

### Item 1 — LOW a–e

| LOW | Status |
|---|---|
| **a** move-away-and-back lockout | **Closed (docs + test).** `docs/reply-routing.md` now spells out the same-turn lockout ("This also locks out the same turn… returning to A refuses acquisition"); subtest `real turn terminals yield to successive host hints without acquiring or stopping the host indicator` passes. |
| **b** hints for removed channels never reaped | **NOT closed.** Mechanism is present and the ambiguous same-pair case is refused and pinned by two tests (M4 kills the refusal), with no ID-only fallback and legacy ID-only behaviour unchanged. But see HIGH-1, HIGH-2, MEDIUM(wire) and MEDIUM(mutants): the fix overreaches into entry retirement and its central guard is unwitnessed. |
| **c** per-registry throttle stamp | **Closed.** Per-destination, bounded at 256, documented. |
| **d** changelog filed `fixed` while adding API | **Closed.** `changelog.d/owned-typing.added.md` names all four exports. |
| **e** AST guard misses the destination-choosing code | **Closed.** Guard now reaches `earlyTypingChannel`, `driveStream.typingChannel`, `driveStream.followTurnLocus`, `sameTypingOwner`, `TypingOwner`, `registerEntry`, `retireRegistration`, `stopAll` and the typing emitters; 4 guard subtests pass. |

On the brief's sub-clause for (b): a mismatch does spare the replacement entry, its hint
and its `typingHintWarnAt` stamp (all three deletions sit after the refusal return,
`:2749-2752`), and no guarded call falls back to the ID-only API. That part is as
described.

## Unmet Criteria / test gaps

- **Acceptance "force-cleanup"** is not met on the production path for the three entry
  classes in HIGH-1, nor for the second disconnect pass in HIGH-2.
- The only two tests of the disconnect-ordering contract do not exercise the production
  branch (MEDIUM, test doubles). There is no test in which `runDisconnectMcplServer`
  runs with a registered transport identity.
- No test covers a **lazily registered** (`ensureChannelRegistered`, `:2252`) entry
  through any retirement path — the one `registerEntry` call site with no provenance.
- No test covers **same-epoch re-registration followed by removal or disconnect**; the
  two same-pair tests cover a *stale delayed* teardown, not a current one.
- No test isolates the captured `(connection, transportEpoch)` comparison (M1b, M2b, M7).
- Carried forward, unchanged and correctly not claimed closed: design rows 4 and 11 in
  their thread dimension; two validated topic leases; `endDroppedTurn` on an
  already-settled routing; `showTurnTyping`'s `routing.silent` guard.
- I ran Node 22.23.3 only; 22.12.0 rests on the implementer's receipts.

## Residual Risk

- A host whose MCPL servers re-announce channels, push to unregistered channels, or
  reconnect without re-registering accumulates resolvable entries for dead servers.
  CI will not show it: every in-repo witness routes around the guarded path.
- Lifecycle work queued during the disconnect window is no longer cancelled by a second
  `serverRemovals` bump (HIGH-2); I did not probe a concrete mis-ordering from this.
- The round's honest disclosures stand and I found no contradiction in them: the 22.23.3
  head wrapper exit is genuinely unknown; the 22.12.0 pair is a real method difference;
  the historical `prose-drafts` cancellation remains unexplained; orphan fixture PID
  3192524 was left untouched (I did not inspect or signal it).
- All my evidence is source, unit and synthetic-transport level. No live adapter,
  provider or deployment qualification.

## Fix Directions

1. **HIGH-1:** make only `typingMetadata` (and optionally the stamp) provenance-gated.
   Delete the `ChannelEntry` whenever it is the entry currently at the key and the
   WeakMap record does not show a strictly newer (connection, epoch) than the caller's.
   Supply the pair at `registerEntry:2252`, or treat a record-less entry as retirable.
2. **HIGH-2:** remove the function-level guard at `:2717` so `serverRemovals` and the
   `defaultPublish*` reset still run, and gate only entry/hint retirement per entry.
3. **MEDIUM (doubles):** restore a registered identity in both
   `test/channel-lifecycle-order.test.ts` doubles and keep a separate explicit ID-only
   variant for the legacy contract.
4. **MEDIUM (mutants):** split the paired mutants so the captured comparison and the
   current lookup are each removed alone, and add the witness each needs — a stale
   teardown where the current lookup would pass but the captured pair would not. If no
   such scenario exists, say so and drop the redundant conjunct rather than claim both
   are proven.
5. **MEDIUM (wire):** do not answer `accepted: false` to a removal whose pair is current.
6. **LOW:** restore the unconditional `forceStopTyping(ref)` on an identified removal
   with no entry; move the stamp reap ahead of the refusal return.

Review-only: no commits, no tracked-file edits, no pushes. Worktree verified clean at
`3c95d166` on entry and exit; all artifacts in `$ORGASMIC_EVIDENCE_DIR` and
`/tmp/pk8rc-rev3`.
