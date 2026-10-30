# Re-review — TASK-PK8RC (slice C, owned typing), fix round 1 + rebase, at d3230a69002b493fef94e501fbf5cfc9a211080b

Base B `29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04`. Previous review `/srv/review-drop/TASK-PK8RC-REVIEW1.md`
(at 08a0ec83); implementer report `/srv/review-drop/TASK-PK8RC-FIX1.md`, both read in full.

## Verdict

**APPROVE.** Every binding rule in the brief holds in the code, at the line level, and the assertions that
hold them are load-bearing: eight mutations I derived and ran independently — including all four the brief
named (`owned-refresh-absence`, `idle-hint`, `stop-grant`, `stale-release-is-owned`) — each built cleanly and
each was killed by the named test for the named reason. The rebase is clean (five patches `=`, protected files
untouched). All five review-1 LOWs and the review-1 MEDIUM are closed. My own full gate at d3230a69 on
Node 22.23.3 under a 16 GiB zero-swap scope is **exit 0 — 9739 pass / 0 fail / 63 skip / 0 cancelled**,
matching the implementer's counts exactly. No HIGH, no MEDIUM. Five LOW findings, all either disclosed
consequences of the binding rules or carried forward unchanged from review 1.

The behaviour delta I verified base-vs-head on real registries is honestly documented: the wire is
**byte-identical** for hosts without hints (S1/S3), and every delta for hosts with hints is named in
`docs/reply-routing.md` and `changelog.d/owned-typing.fixed.md`.

## (1) Do the binding rules hold in the code?

| Rule | Where | Holds |
| --- | --- | --- |
| No mutable "latest hint" retarget; automatic typing YIELDS to any stored host hint, incl. idle | `src/mcpl/channel-registry.ts:2273-2287` — `startOwnedTyping` returns before `startTypingAt` on `typingMetadata.has(key)` | ✅ |
| On yield: no automatic start/stop/delete of metadata, NO root fallback | the early `return` at `:2285` precedes every wire call and every `typingMetadata` write; probe S5 `start A {"topic":"t"}` only — no stop, no root start | ✅ |
| Named gap, not a fix | `docs/reply-routing.md:124-133,143-146`; `changelog.d/owned-typing.fixed.md:16-20` ("incomplete thread path, not a thread-ownership fix") | ✅ |
| Root lease only for a genuine channel-root binding; a lost thread binding is not root authority | `src/framework.ts:21748-21751` (`routing.reply.destination` or refuse; no locus/trigger borrow); `docs/reply-routing.md:143-146` | ✅ |
| Refresh/terminal/stale/force/shutdown stops carry the **captured absence** of metadata — no `undefined → read current typingMetadata` | the only two wire reads of `typingMetadata` are `:4048` (`sendTypingNotification`) and `:2395` (`sendTypingStop`), both `owner ? undefined : …`; the refresh closure at `:2328-2330` passes the frozen `owner` | ✅ |
| Cleanup neither deletes nor uses a newer host hint | `:2380` `if (typing ? !typing.owner : clearOrphanHints) this.typingMetadata.delete(key)` — owned entries are never deleted; `forceStopTyping`/`stopOwnedTyping` pass `clearOrphanHints = false` | ✅ |
| Verified on the WIRE on a real registry | `test/channel-registry-typing.test.ts:16-53` (real `ChannelRegistry` + `sendTypingFn`), `test/reply-routing.test.ts:35` (real registry + real framework + real `RequiredAdmission`) | ✅ |
| Stale cleanup releases only its own lease | `src/framework.ts:24378` → `stopTurnTyping` `:21766-21768` → `stopOwnedTyping` `:2351-2353` → `sameTypingOwner` `:685-687` | ✅ |
| Force/lifecycle cleanup gated by `channels.typing`; denied → retire local state, no stop, no claim of clearing | `:2392-2396` — the grant check is in `sendTypingStop`, which runs **after** `clearInterval` + `typingIntervals.delete` at `:2373-2375`; `docs/reply-routing.md:158-161` makes the no-clearance claim explicit | ✅ |
| `stopAll` pinned | `:2757-2760`; `test/channel-registry-typing.test.ts:299-304` asserts the exact four-call sequence | ✅ |
| Disabled-mode wire controls pinned | `src/framework.ts:21745`, `:25052-25053`, `:24290-24296`; `test/reply-routing.test.ts:790-791` asserts `early.length === 0` and `x.typings.length === 0` | ✅ |
| No widening of scope/permissions | fix commits touch no export (`git diff 4cb78d61 d3230a69` lists no `src/index.ts`/`src/mcpl/index.ts`); `sendTypingStop` got **narrower** (new grant gate) | ✅ |

**Every path where metadata may be read is accounted for.** All ten `typingMetadata` references in
`src/mcpl/channel-registry.ts` (`1305, 2277, 2301, 2307, 2309, 2380, 2384, 2385, 2395, 4048`): two wire reads
(both owner-gated), one `.has()` yield gate, three writes (host hints only), three deletes (all behind
`!typing.owner` / `clearOrphanHints`), one declaration. The `metadataChanged` refresh at `:2316` is
unreachable for an owned lease: `:2304` returns early when `running.owner && !owner`, and the
`!sameTypingOwner` branch force-stops first, so the "Already typing" branch is only reached when owners match
— and `startOwnedTyping` always passes `metadata: undefined`.

`forceStopTyping`, `stopOwnedTyping` and `stopTyping` were each walked on the move, refresh-timer,
terminal, stale-release, channel-removal (`:1735-1737`), server-removal (`:2699-2701`), transport-close
(`:2744-2750`), tool-close (`:5383`) and shutdown (`:2760`) paths. No path reads a hint for an owned lease.

## (2) Do the 14 mutations really kill? — eight re-derived independently

Fresh copy of head at `/tmp/pk8rc-rev2` (`git archive d3230a69`, detached from the shared gitdir), Node
22.23.3, baseline `channel-registry-typing` + `reply-routing` **78 pass / 0 fail**. My own script
(`$ORGASMIC_EVIDENCE_DIR/probes/rev2-mut.py`, results `rev2-mut.json`, per-mutation logs
`rev2-mut-<name>.log`) — all eight **built cleanly** (so no kill came from a type error) and all eight were
killed:

| Mutation (mine) | Killing assertion, verbatim from my run |
| --- | --- |
| `owned-refresh-absence` — `sendTypingNotification` drops `owner ? undefined :` | `unscoped hints cannot retarget owned wire refresh/stop and survive {owner,force,shutdown} cleanup`: *"the existing lease keeps its registered channel, not a later opaque topic"*, actual gains `metadata: {…}`; plus `non-transport binding invalidation … (successor=true)`: *"stale and terminal stops never adopt the newer host hint"* |
| `owned-stop-absence` — same in `sendTypingStop` | the same three cleanup cases, plus `automatic typing uses the frozen turn destination before and after compile in locus mode` |
| `idle-hint` — yield only when an indicator is **live** (`&& this.typingIntervals.has(key)`) | `an idle stored host hint refuses automatic acquisition without a root fallback`: `0 !== 2`; and the three cleanup cases: *"idle stored hints still cannot authorize automatic acquisition", 4 !== 3* |
| `stop-grant` — drop the `channels.typing` check from `sendTypingStop` | `typing stop checks the current grant while retiring local {owner,shutdown} state`: *"denied grant permits no wire stop or claim of platform clearance", 2 !== 1* |
| `stale-release-is-owned` — stale notice calls `forceStopTyping(routing.typing)` instead of `stopTurnTyping` | `non-transport binding invalidation releases only its own typing lease (successor=true)`: *"stale authority releases the lease before the stream terminal", 0 !== 1* — i.e. the successor's lease was wrongly cleared |
| `stale-notice-release` — remove the stale release entirely | `… (successor=false)` |
| `retain-newer-hint` — `typingMetadata.delete(key)` unconditionally | the three cleanup cases + the idle-hint case |
| `unscoped-start-is-metadata-only` — host start during an owned lease also emits a wire refresh | the three cleanup cases + `locus mode` |

The four the brief named are all here and all kill for the right reason. I did not re-derive the remaining
six (`hint-presence`, `hint-throttle`, `force-preserves-idle-hints`, `retain-host-update`,
`shutdown-wire-stop`, `disabled-mode`); `disabled-mode` I re-derived and confirmed in review 1, and
`shutdown-wire-stop` is independently pinned by my S11 wire probe below. The implementer's disclosure that
the first mutation batch contained one invalid (unreachable-code) mutant, excluded and never counted as a
kill, matches `mutations.wrapper.log` vs `mutations-final.wrapper.log` in the reviewed evidence.

## (3) Behaviour delta vs base — real registries, both trees

Base `29edcf8b` and head `d3230a69` each built from `git archive` into separate trees, driven through the
same public call sequence a turn frame makes, recording what `sendTypingFn` hands the server
(`$ORGASMIC_EVIDENCE_DIR/probes/rev2-wire.mjs`, `rev2-wire2.mjs`, output `wire-base-vs-head.txt`):

| Scenario | base wire | head wire | status |
| --- | --- | --- | --- |
| **S1** — host has no hints at all; start → terminal | `start A, stop A` | `start A, stop A` | **byte-identical** |
| **S3** — mid-turn locus move (stop old, start new), then terminal | `start A, stop A, start B, stop B` | `start A, stop A, start B, stop B` | **byte-identical** |
| S4 — host typing (no metadata) in another channel | `start B, start A, stop B, stop A` | `start B, start A, stop A` | intended (review-1 S2 delta: the terminal no longer sweeps a foreign indicator) — `docs/reply-routing.md:173-176` |
| S5 — host typing **with metadata** in the turn's channel | `start A {topic:t}, stop A {topic:t}` | `start A {topic:t}` *(no acquisition, host indicator and metadata untouched)* | the new yield rule — documented |
| S6 — host start+stop with metadata, then a turn | `start A, stop A` | `start A, stop A` | identical; an ordinary host `stopTyping(ref)` discards its hint (`:2380`), so no suppression |
| S11 — shutdown with a live indicator, granted | *(none)* | `stop A` | review-1 LOW 2, now **pinned** (`test/channel-registry-typing.test.ts:299-304`) and **documented** (`changelog.d/owned-typing.fixed.md:11-13`) |
| S8 — shutdown, grant **denied** | *(none)* | *(none)* | grant gate holds |
| S9 — channel removal while typing | *(no stop)* | *(no stop)* | not a delta: `handleChanged` deletes the entry at `:1735` before `forceStopTyping`, so `sendTypingStop`'s `entryAt` guard suppresses — pre-existing at base |

So **hosts without hints see a byte-identical wire** in exactly the shapes the suite sets up, and every delta
is confined to hosts that supply `typingMetadata` — which is the explicitly sanctioned gap. The honesty check
passes: `docs/reply-routing.md:124-146` states the yield, the live-or-idle scope, the absence of a root
fallback, the hint retention, the throttled fixed-message trace, and that this is "an explicit gap between
typing, transport and adapter integration, not a thread-ownership fix"; the changelog fragment says the same
and names the idle-hint reversal ("idle hints suppress acquisition instead of being reused"). The report's
Residual Risk also states that retained idle hints can keep automatic typing suppressed.

## (4) Rebase

- `git range-diff 27a32127..08a0ec83 29edcf8b..4cb78d61` run by me: all five patches **`=`**, no conflict edits.
- `29edcf8b` is an ancestor of `d3230a69`; the four fix commits sit on top of `4cb78d61`.
- Protected files: `git diff --name-only 29edcf8b d3230a69` contains **none** of `src/mcpl/inbound-admission.ts`,
  `src/mcpl/reply-admission.ts`, `src/mcpl/reply-routing.ts`, `src/mcpl/protocol-family.ts`,
  `src/mcpl/server-connection.ts`. Zero diff, independently confirmed. (`protected-files.diff` in the
  reviewed evidence is 0 bytes, consistent.)

## (5) Review-1 findings — all closed

| Review 1 | Status at d3230a69 |
| --- | --- |
| **MEDIUM** — acquisition destroyed the host's indicator *and* its routing metadata, indicator fell to channel root | **Closed** by the gap path: acquisition yields instead (`:2277`), the host indicator keeps its own loop and metadata (S5), the turn's terminal cannot stop it (`sameTypingOwner(undefined, owner) === false`). The review-1 `probe-meta2` scenario no longer regresses. Documented in both docs and changelog. |
| LOW — `stopAll` wire emission unasserted; `sendTypingStop` ungated | **Closed** both ways: pinned (`:299-305`) and gated (`:2393`), each mutation-killed (`stop-grant`). |
| LOW — lapsed binding blocked acquisition but left the live lease refreshing | **Closed** at `src/framework.ts:24378`, owner-scoped, with a successor control (`test/reply-routing.test.ts:935-980`, both `successor` values) and two mutations. |
| LOW — `forceStopTyping` public bypass | **Closed as annotation**: `@internal` host-only at `:2354-2361` + `docs/reply-routing.md:152-161`, which honestly caveats that it is "an API-use boundary, not a security sandbox for a module already holding the registry". Accepted; kept public for existing host integrations. |
| LOW — idle-TTL via `endDroppedTurn` | **Closed as a note**, per brief: `docs/reply-routing.md:167-171`. |
| LOW — unowned indicators lost their de-facto sweeper | **Closed as a note**: `docs/reply-routing.md:173-176`. |

## (6) My gate at d3230a69 (reported exactly)

| Gate | Command | Outcome |
| --- | --- | --- |
| `reviewer-r2-head-22233` | `orgasmic dispatch gate reviewer-r2-head-22233 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 "$ORGASMIC_EVIDENCE_DIR/reviewer-suite.sh" /opt/node-v22.23.3-linux-x64/bin` (`npm run typecheck && npm run build && AF_TEST_CONCURRENCY=8 npm test`), cwd = this worktree | **exit 0** — Node v22.23.3, 9802 tests / 501 suites: **9739 pass, 0 fail, 63 skip, 0 cancelled, 0 todo**; footer `head=d3230a69002b493fef94e501fbf5cfc9a211080b clean=yes`. Log `$ORGASMIC_EVIDENCE_DIR/gate-reviewer-r2-head-22233-01M67H1PY6Z80Y9B6E15W4QVTD.log` |

This is a fresh execution, not a reused receipt, and its counts match the implementer's `r2-head-22233`
(9739/0/63/0) exactly. Scoped probes of mine (unwrapped, no reusable receipt): baseline typing suite in the
probe copy **78 pass / 0 fail / 0 skip / 0 cancelled**; eight mutation runs as tabulated. Node 22.12.0 rests
on the implementer's `r2-head-22120` receipt (9739/0/63/0) — I did not re-run it.

## (7) Hygiene

Clean. All nine commits author **and** commit as `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`
with a single `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>` trailer, matching `CONTRIBUTING.md:74-82`.
`git diff 29edcf8b d3230a69 -- src docs changelog.d test | grep '^+'` matches none of
`orgasmic|PK8RC|alnold|tarn|soma|gpt-6|/srv/|/home/|ledger|dispatch|reviewer|implementer|theaspirational`.
No `.skip`/`.only` added. Worktree left clean (`git status --porcelain` empty; only ignored `dist/`, `logs/`,
`node_modules/`, `package-lock.json`).

## Findings

### LOW — behaviour/docs: a host hint that arrives during a hint-free lease locks the **same turn** out of its own channel if its locus moves away and back

`src/mcpl/channel-registry.ts:2277` (the yield gate) together with `:2380` (the hint survives the turn's own
release) and `src/framework.ts:21759-21762` (a move releases the old lease before acquiring the new one).

Probe S12 (`$ORGASMIC_EVIDENCE_DIR/probes/rev2-wire2.mjs`), hint-free acquire on A → host
`startTyping(A, {topic:'late'})` → locus moves to B → locus moves back to A → terminal:

```
base | stop A {"topic":"late"}, start B, stop B, start A, stop A
head | stop A,                  start B, stop B                  | lease on A: false
```

The turn silently shows no typing for the rest of its work in A, because the hint it is required to ignore
also outlives its own release. This is rule-conformant (the rule says yield to *any* stored hint, and
cleanup must not delete one), and the consequence is disclosed abstractly — `docs/reply-routing.md:139-140`
("Its cleanup preserves that hint for the host, without an automatic restart") and the fix report's Residual
Risk ("retaining idle hints can keep automatic typing suppressed"). What is not written down anywhere is that
the turn that *created* the lease is itself locked out. Fix direction (docs only, no code change needed under
the current rules): add the move-away-and-back sequence to the "Incomplete thread path" paragraph so adapter
authors do not read the retention clause as affecting only *later* turns.

### LOW — robustness: hints retained for a channel that is removed are never reaped, so they suppress automatic typing across re-registration and accumulate

`src/mcpl/channel-registry.ts:2380` and `:2383-2387`. `handleChanged`'s removal (`:1735-1737`) and
`removeServer` (`:2699-2701`) delete the channel entry and then call `forceStopTyping`, which now runs with
`clearOrphanHints = false` — so a hint stored during an owned lease outlives the channel itself. Probe S13:

```
head | after re-register: (none) | stored hint: {"topic":"late"}
```

Two consequences. (a) After the channel is registered again, automatic typing on it is suppressed
permanently, until some host calls `stopTyping`. (b) Nothing in `src/` calls the no-arg `stopTyping()` —
the orphan sweep at `:2383-2387` is reachable only from an external host — so `typingMetadata` grows by one
entry per churned channel for the process's lifetime, and `stopAll` (`:2760`) does not clear it either. (a)
is disclosed in the fix report's Residual Risk ("including shutdown/re-registration"); (b) is not disclosed
anywhere. Both are small: one short record per churned channel, and no wire effect. Fix direction: delete the
hint when the channel leaves `this.channels` — a hint for a channel that no longer exists cannot be newer
host authority for anything, so reaping it does not conflict with "cleanup neither deletes nor uses a newer
host hint", which is about a *live* channel's lease.

### LOW — diagnostics: the unbound-hint trace is throttled by one per-registry stamp, so a yield on one channel silences the trace for every other channel

`src/mcpl/channel-registry.ts:1306` (`typingHintWarnAt`, a single `number | undefined`) and `:2278-2284`. An
operator asking "why is typing not showing in channel Y" can get no trace at all if an unrelated yield on
channel X happened within 60 s. The shape is honestly documented (`docs/reply-routing.md:131-133`, "at most
once per registry per 60 seconds") and the trace carries no hint contents, so this is a diagnostics-fidelity
note, not a defect. Fix direction, if ever wanted: key the stamp by `destinationKey` with a bounded map, as
`warnStaleRequests` keys its 60 s stamp per agent.

### LOW — docs (carried forward from review 1, unaddressed): the changelog fragment is filed `fixed` while the slice adds public API

`changelog.d/owned-typing.fixed.md` is the only fragment for this slice, but the stack exports
`startOwnedTyping`, `stopOwnedTyping`, `forceStopTyping` and `TypingOwner` (`src/index.ts:83-84`,
`src/mcpl/index.ts:179`); `grep -rn 'startOwnedTyping\|TypingOwner' changelog.d/` returns nothing. The
release fold will therefore not list the new API under Added. Format itself is valid per
`changelog.d/README.md`. Fix direction: add an `owned-typing.added.md` fragment naming the four exports.

### LOW — test (carried forward from review 1, partly addressed): the AST no-connector-literals guard still does not reach the code that *picks* the typing destination

`test/routing-runtime-has-no-connector-literals.test.ts:34-36`. This round widened the registry method list
to include `sendTypingNotification` and `sendTypingStop` (good — those are the two wire emitters). The
framework list is still `showTurnTyping, stopTurnTyping, staleRequestStatus, warnStaleRequests`, so a
connector literal in `earlyTypingChannel` (`src/framework.ts:24290-24296`) or in `driveStream`'s
`typingChannel`/`followTurnLocus` (`:25052-25068`) — the code that actually chooses where typing goes —
would still pass the guard. Also still unreached: the module-level `sameTypingOwner` (`:685-687`) and the
`TypingOwner` interface (`:679-683`); neither holds literals today.

## Unmet criteria / test gaps

- **Design rows 4 and 11 remain closed only in their channel dimension.** Both rows are written about
  threads; the witnesses use different/identical registered *channel* targets. The owner-sanctioned carve-out
  and the named gap are documented (`docs/reply-routing.md:124-146, 178-181`), and the fix report does not
  claim closure. Unchanged from review 1 — correctly so.
- **The thread path is explicitly incomplete, by ruling.** There is no turn-qualified host hint in the API, so
  there is no test of two *validated* topic leases; the two-topic controls prove refusal and host ownership
  instead (`test/channel-registry-typing.test.ts:186-214`, `test/reply-routing.test.ts:982+`). This is what
  was asked for, and the report and docs say so rather than claiming a fix.
- No test covers `endDroppedTurn` on an already-settled routing (review-1 LOW 5; notes-only per brief).
- No test asserts that a turn which yielded to a hint and later returns to that channel stays silent (the
  LOW-1 sequence); the three `survive … cleanup` cases cover a *later* turn, not the same one.
- No test covers hint retention across channel removal + re-registration (LOW-2); the `shutdown` variant of
  `unscoped hints cannot retarget…` re-registers but then only re-asserts suppression for a *new* turn id.
- `showTurnTyping`'s `routing.silent` guard (`src/framework.ts:21745`) still has no production-path witness of
  its own — `suppressProse` makes `turnProseRouting` `'disabled'` one layer earlier. Defence in depth;
  unchanged from review 1.
- Node 22.12.0 rests on the implementer's receipt; I ran only 22.23.3.

## Residual risk

- The whole hint-yield path is only observable against an external host that supplies `typingMetadata`:
  nothing in `src/` calls `startTyping(ref, metadata)` (the one in-repo typing consumer,
  `src/modules/discord/index.ts:520`, runs its own loop). For such a host, automatic typing is now effectively
  off on any channel it has ever hinted — the named C/E/F gap, not a defect, but a real functional reduction
  that will surface on first integration rather than in CI.
- `routing.typing` is set even when acquisition yielded (`src/framework.ts:21763`), so explicit mode's
  `explicitTypingChannel` fallback (`:19462`) will re-attempt the same channel and yield again. Harmless
  today — `routing.typing` is read only for the move comparison and that fallback — but it records a
  destination the turn does not own.
- One-indicator-per-channel means a second agent typing in the same hint-free channel force-stops the first's
  lease and takes it, with no "restore the predecessor" step. The design's explicit model.
- Stale authority is checked at the inference/private-notice boundary, not on each refresh tick; no
  continuous policy-polling promise. Documented (`docs/reply-routing.md:163-165`).
- Shutdown's stop is best-effort and unacknowledged, and on a just-closed transport (`:2744-2750`) it is sent
  into a dead socket. Documented as "not a delivery acknowledgement".
- No live connector/provider/deployment qualification; everything here is runtime/test evidence.

## Fix directions (summary, all optional — none blocks ship)

1. LOW-1: document the move-away-and-back lockout in the "Incomplete thread path" paragraph of
   `docs/reply-routing.md`, and add it as a test case next to the three `survive … cleanup` variants.
2. LOW-2: reap `typingMetadata[key]` when the channel leaves `this.channels` (`:1735`, `:2701`), and say in
   the report that orphan hints are otherwise never reaped automatically.
3. LOW-3: key `typingHintWarnAt` by `destinationKey` in a bounded map, as `warnStaleRequests` keys per agent.
4. LOW-4: add `changelog.d/owned-typing.added.md` for `startOwnedTyping`/`stopOwnedTyping`/`forceStopTyping`/
   `TypingOwner`.
5. LOW-5: add `startAgentStream` and `driveStream` (or the destination-choosing helpers extracted from them)
   to the AST guard's framework method list.

Review-only: no commits, no tracked-file edits, no fetch. Probe copies live at `/tmp/pk8rc-rev2` (head) and
`/tmp/pk8rc-rev2-base` (29edcf8b), both created with `git archive` and detached from the shared gitdir;
artifacts in `$ORGASMIC_EVIDENCE_DIR/probes/`.
