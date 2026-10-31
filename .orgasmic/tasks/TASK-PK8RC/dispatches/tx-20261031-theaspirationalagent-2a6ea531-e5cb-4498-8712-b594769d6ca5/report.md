# TASK-PK8RC — bounded delta review of the C LOW-b rollback

Reviewed head: `7504acbd139e63878f6142f962750b8669fc92d1` (worktree detached, `git status --porcelain` = 0 lines before and after my probes).
Primary comparison: `d3230a69002b493fef94e501fbf5cfc9a211080b..7504acbd` (7 files, +311/-18).
Secondary: `3c95d166..7504acbd` (the rejected head → rollback).
Implementer report `/srv/review-drop/TASK-PK8RC-LOWB-REVERT.md` read in full; sha256 `7733d55e190005843f051e68b353f9c5d56f1752d2c09bdcedd1094caacbc96f` verified. Prior rejection `/srv/review-drop/TASK-PK8RC-LOWS-DELTA-REVIEW.md` sha256 `d3fc9c74…70b22` verified.
Constraints applied as Soma's programme-qualifier direction relayed by task operator Tarn — not owner (Vasyl) decisions.

## Verdict

**APPROVE** at `7504acbd` for the assigned bounded rollback. No HIGH, no MEDIUM. Two LOW observations, both documentation/evidence precision, neither blocking.

The three blockers from the previous rejection are gone, and I reproduced the controls that discriminate them rather than taking the report's word. The runtime delta against `d3230a69` is exactly five diagnostic-only hunks; `src/framework.ts` is byte-identical to the baseline.

## Findings

### LOW — docs: `docs/reply-routing.md:181-183` over-states the second disconnect pass
"Disconnect removes entries before closing the connection and again after close settles, so late registrations and their queued lifecycle work **cannot outlive the disconnect**." The two passes (`src/framework.ts:34361`, `:34397`) bound only registrations created *before* the second pass; `serverRemovals` (`src/mcpl/channel-registry.ts:2702`) is incremented twice and cancels lifecycle work queued up to that point. A registration created after the second pass would survive, and its own later lifecycle work would not be invalidated. I could not construct a reachable path for that (after `close()` settles there is no transport line source, and held `PROCESS_EVENTS` are discarded on reset), so this is a wording precision issue, not a demonstrated defect. Fix direction: scope the sentence to "registrations that arrive while close settles", as the test at `test/typing-transport-epoch.test.ts:119-144` actually proves.

### LOW — docs/evidence: the same-connection + same-epoch + no-entry-token case is no longer named as such
Tarn's 23:43Z instruction asked for that case to be named explicitly. `docs/reply-routing.md:179-187` now states the strictly broader and strictly weaker-claiming form — ID-based lifecycle calls "cannot promise that an arbitrary stale external ID-based teardown spares a replacement", and "No new captured-pair API or generation-safety claim is made." Since the captured-pair mechanism was withdrawn entirely, the same-pair case is a subset of what is documented and nothing is over-claimed; I record this only so the supersession is explicit rather than looking like a dropped instruction. No change required.

### No finding — the surviving mutant is not a coverage gap
The report's `reintroduce rejected registry only, without framework pair plumbing` → **SURVIVED** is correct and expected, not a hole. I verified the cause in the rejected source: at `3c95d166:src/mcpl/channel-registry.ts`, `retireRegistration`'s provenance block is gated on `if (connection || transportEpoch !== undefined)`, so ID-only callers (`removeServer(id)`) skipped every guard and deleted entries exactly as the baseline does. A registry-only reintroduction is therefore behaviourally inert through the only callers that exist. There is nothing in `7504acbd` to isolate — the guards do not exist — and the paired mutant (registry **and** framework plumbing) is killed by the exact wire response, the second-pass counter and the conservative idle hint (`mutant-rejected-registry.log` vs `gate-r5-final-probes-…log`). Absence of an isolated single-conjunct proof is acceptable here.

## Checks performed (brief items 1–6)

**(1) Every src hunk is diagnostic-only.** `git diff d3230a69 HEAD -- src/` = 5 hunks, all in `src/mcpl/channel-registry.ts`, all on `typingHintWarnAt`:
- `:1306-1307` scalar stamp → `Map<string, number>` with the cap comment.
- `:1738` stamp reap in the `channels/changed` removed loop — added line only; `channels.delete` + unconditional `forceStopTyping(ref)` + `accepted: existed` are untouched context.
- `:2279-2285` per-destination 60s throttle with cap 256.
- `:2706` stamp reap in the `removeServer` loop — added line only; `channels.delete(key)` and `forceStopTyping(refOf(entry))` are untouched context.
- `:2770` `typingHintWarnAt.clear()` beside the existing `channels.clear()` in `stopAll`.
`channels`, `typingMetadata`, `forceStopTyping`/`stopTypingWhere` (`:2365-2392`) and `serverRemovals` (`:2702`) are byte-identical to `d3230a69`. `src/framework.ts` has **zero** hunks against `d3230a69` (verified with `git diff --stat`), so the optional connection/epoch parameters, the WeakMap stamps and `retireRegistration` are gone, not relocated. `removeServer(serverId: string)` at `:2698` has the baseline signature. All three entry-removal paths in the file (`:1737`, `:2705`, `:2769`) reap stamps — there is no unreaped removal path. My hunk count and the implementer's `baseline-runtime-hunks.diff` are byte-identical.

**Cap-256 eviction is correct.** `:2283-2285` does `delete(key)` → `if (size >= 256) delete(keys().next().value!)` → `set(key, now)`. The leading `delete` makes a re-warn re-insert at the tail, so Map insertion order is exactly "least-recently-emitted first"; the ceiling is 256 (evict at 256 → 255 → set → 256). `keys().next().value!` is only reached when `size >= 256`, so the non-null assertion cannot fire on an empty map. Growth is impossible for unregistered channels because `startOwnedTyping` returns at `:2278` (`!this.entryAt(ref)`) before any stamp is written. All map keys are `destinationKey(...)`, matching the `channels` map keys (`registerEntry` callers at `:1687`, `:1796`, `:2235`), so the reaps at `:1738`/`:2706` cannot miss.

**(2) HIGH-1 / HIGH-2 / wire MEDIUM are gone.** `removeServer` now deletes every entry of the server unconditionally — no record lookup, no `replacedWithinEpoch`, no epoch comparison — so lazy-push entries, same-epoch re-announcements and earlier-epoch entries all go (HIGH-1). The function-level early return is absent, so both `framework.ts:34361` and `:34397` act and `serverRemovals` increments twice (HIGH-2). `handleChanged` reports `accepted: existed` where `existed = this.channels.delete(…)`, so a legitimate removal answers `accepted: true` (wire MEDIUM). Both prior LOWs (unconditional `forceStopTyping` on an absent entry, stamp reap before the refusal) dissolve with the revert.

**(3) Test preservation.** `test/channel-lifecycle-order.test.ts`, `test/shared-channel-id.test.ts`, `test/reply-routing.test.ts`, `test/reply-routing-core.test.ts`, `test/reply-routing-transport.test.ts`, `test/fixtures/reply-routing-server.mjs` are **byte-identical** to `d3230a69` (`git diff --quiet` per file). `test/channel-registry-typing.test.ts`: the baseline's 16 519 bytes are an **exact prefix** (`head -c 16519 | cmp` clean) and the diff is a pure append of three tests; no base assertion touched. `test/typing-transport-epoch.test.ts` does not exist at `d3230a69`. I attributed every removed test declaration to a file: 8 in `channel-registry-typing.test.ts` (all inside the post-baseline append region) and 4 in `typing-transport-epoch.test.ts` (file absent at baseline) — 10 templates, 2+4+2+1+1+6+2+2+2+2 = **24 instances**, every one named for a withdrawn LOW-b mechanism. Zero baseline coverage lost; the implementer's `baseline-assertion-diff.txt` is 0 bytes, which matches my per-file check. Suite-count arithmetic reconciles both ways: 9802 (`d3230a69`, prior round, concurrency 8) + 11 new = **9813**; 9832 (`3c95d166`) − 24 + 5 = **9813**.

**(4) The five new real-path controls discriminate.** Independently reproduced (see Verification Gates): a global-keyed throttle kills 7 tests including all three `disconnect retires a {lazy push,re-announced,earlier epoch} entry on a real connection`; removing the server-side reap kills 4; removing the `changed` reap kills 1. The wire control asserts the `channels/changed` response body itself (`test/typing-transport-epoch.test.ts:113`, `reply.id === 3`), not an earlier `register` reply. The two-pass control detaches the connection from the server-registry double between passes and pins `serverRemovals === 2` plus removal of a registration created during pass one (`:140-142`). These are the exact assertions the paired registry+framework mutant fails.

**(5) Docs/changelog.** `docs/reply-routing.md` promises no stale-callback safety: `:179-187` states the ID-based cleanup "cannot promise that an arbitrary stale external ID-based teardown spares a replacement" and "No new captured-pair API or generation-safety claim is made." The idle-hint gap is stated at `:188-192` (hints may survive removal and suppress automatic typing after re-registration until an explicit host stop; incarnation-aware retirement deferred). `:131-136` documents the per-destination throttle, the 256 cap, LRU eviction and the reap sites, including that an evicted destination can report again sooner. `:168-172` restores the baseline force-cleanup wording. `changelog.d/owned-typing.fixed.md` drops the withdrawn "force cleanup preserves newer hints" claim (now "Owned lease cleanup preserves…"), which matches `stopTypingWhere:2384` exactly (`typing ? !typing.owner : clearOrphanHints` → active unowned hint deleted, owned and idle preserved). The new paragraph makes no deletion guarantee.

**(6) LOW a/c/d/e preserved; only the dead AST selector removed.**
- a (LOW-1 same-turn move-away/back lockout): docs `:139-144` + test `the same turn yields on returning to a channel hinted during its earlier lease` (`channel-registry-typing.test.ts:375-398`). Present.
- b (LOW-2): withdrawn; documented gap. As directed.
- c (LOW-3): bounded per-destination map. Present; the test pins both the cap (`size === 256`) and the eviction order (`has(target) === false`, 260th trace).
- d (LOW-4): `changelog.d/owned-typing.added.md` with the four exports. Present, unchanged from the rejected head.
- e (LOW-5): the only guard change vs `3c95d166` is deleting `'retireRegistration'` from the selector list (`routing-runtime-has-no-connector-literals.test.ts:36`). Everything else — `registerEntry`, `stopAll`, the owned-typing methods, `sameTypingOwner`/`TypingOwner`, `beginAgentTurn.earlyTypingChannel`, `driveStream.typingChannel`, `driveStream.followTurnLocus` — is retained, and the `assert.deepEqual([...found], expected)` shape makes a stale selector a hard failure rather than silent under-coverage. I proved the destination-choosing coverage is real, which the implementer's evidence had only shown for `sameTypingOwner`: injecting a `'slack'` literal into each of the three framework bindings fails the guard at `src/framework.ts:24290`, `:25051` and inside `followTurnLocus` respectively.

## Verification Gates

Reused receipt (not rerun): `r5-final-probes` exit 0 at `7504acbd`, log `…/run-01M67W0Y48J8WSM1ZYEBFQH5G0/evidence/gate-r5-final-probes-01M67WCK66F1Y2G0X66B6VTMC7.log`.

Cross-checked implementer full-suite receipts from `full-results.json` (not rerun): all four cells `producer=0 capture=0 whole_command=0 gate=0`, `truncated=false`, `not_ok=[]`, `clean=yes`; base `3c95d166` 9832/9769/0 fail/63 skip/0 cancelled, head `7504acbd` 9813/9750/0 fail/63 skip/0 cancelled, on Node 22.23.3 and 22.12.0 at `AF_TEST_CONCURRENCY=8`. Note the matched pair's base is the **rejected head**, not `d3230a69`; the `d3230a69` figure (9802/9739) comes from the prior round's receipt, so the baseline comparison is a cross-round inference, reconciled above by test-count arithmetic rather than by a same-closure run.

My own gates, each `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 timeout --signal=TERM --kill-after=60s …`, Node 22.23.3 (`/opt/node-v22.23.3-linux-x64/bin/node`), on the worker's existing `node_modules` closure, no `npm install`. Mutations were applied to **compiled output only** (`dist/`, gitignored) or inside a `/tmp` sandbox of four source files, so no tracked file was ever modified; `RESTORED_OK` / `git status --porcelain` = 0 confirmed at the end of each.

| Gate | Bound | Result | Log |
|---|---|---|---|
| `rev-focused-mutants` | 900s | exit 0. typecheck 0, build 0. Baseline focused **309/309 pass, 0 fail, 0 cancelled**. M1 global throttle → 7 fail (**killed**). M2 remove `changed` reap → 1 fail (**killed**). `RESTORED_OK`. | `gate-rev-focused-mutants-01M680AV6TQTE8AJX8J639NSBY.log` |
| `rev-mutant-names` | 900s | exit 0. Witness names captured: M1 kills `hint-yield diagnostics are independent per server-qualified destination and bounded`, the three `hint-yield stamps are reaped on {changed,server,shutdown} registration cleanup only`, and all three `disconnect retires a … entry on a real connection`. M2 kills the `changed` reap test only. M3 (remove the `removeServer` reap) → 4 fail: the `server` reap test plus all three real-connection controls (**killed**). `RESTORED_OK`. | `gate-rev-mutant-names-01M680C079QDY0BJ4W81TNHH5A.log` |
| `rev-ast-destination` | 300s | exit 0. Sandbox baseline 4/4 pass. Connector literal injected into `earlyTypingChannel` → fail at `src/framework.ts:24290`; into `typingChannel` → fail at `:25051`; into `followTurnLocus` → fail. Sandbox restored 4/4. Worktree 0 dirty paths. | `gate-rev-ast-destination-01M680E3E8DSZDGG2GBJYAS2FM.log` |

Focused files run: `channel-registry-typing`, `typing-transport-epoch`, `channel-lifecycle-order`, `shared-channel-id`, `routing-runtime-has-no-connector-literals`.

Hygiene: three commits `c545dee0`, `81c9f834`, `7504acbd`, all authored and committed as `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` with the `GPT-6.1-Sol` co-author trailer; `git branch -r --contains HEAD` empty (unpushed); `task-pk8rc-lowb-rejected-3c95d166` still at `3c95d166242892206b5e1e5d624b3c9ebb062323`.

## Unmet criteria / test gaps

- No full-suite receipt at this round takes `d3230a69` as the base on the frozen closure. The baseline equivalence rests on the five-hunk diff plus the prior round's `d3230a69` counts; acceptable for a bounded rollback, but it is an inference across closures, not a measurement.
- No isolated single-conjunct proof exists for the withdrawn provenance guards. Correct by construction (the code is gone) and explicitly not claimed; recorded so no later round mistakes the surviving registry-only mutant for coverage.
- Active-unowned hint deletion on force cleanup is covered only through the preserved baseline tests (`shared-channel-id.test.ts`, byte-identical) via the `stopAll` path. No added control asserts that same deletion through `removeServer`/`handleChanged`, though the code path is the identical `stopTypingWhere` call.
- C overall remains rejected/unpublished; incarnation-aware entry/hint retirement and the threaded typing target stay out of scope and uncovered by design.

## Residual risk

- **Diagnostic throttle degradation (accepted, documented).** With more than 256 distinct hinted destinations churning, eviction means an evicted destination re-emits before its 60s window — the trace-volume suppression weakens even though memory stays bounded at 256 entries. This is exactly what `docs/reply-routing.md:135-136` says and what the test asserts; it is diagnostic state only, per Soma's limit.
- **The documented provenance gap is real behaviour, not a latent bug.** An arbitrarily delayed external ID-only `removeServer`/`handleChanged` can remove a replacement's entry, and stored idle hints survive removal and suppress automatic typing after re-registration until an explicit host stop. Deliberate conservative scope.
- `serverRemovals` cancellation semantics bound only work queued before the second disconnect pass (see LOW-1 above).
- Prior-round unresolved observations (the 22.23.3 head cell with a complete summary but unknown wrapper exit; the 32/parallel cancellation; the disclosed unbounded-base/bounded-head 22.12.0 method difference) remain unresolved in the inherited evidence and are correctly not relabelled or erased by this round's green cells.

## Fix directions

Nothing blocking. Optional, at the next doc touch:
1. `docs/reply-routing.md:181-183` — narrow "cannot outlive the disconnect" to registrations arriving while close settles, which is what `test/typing-transport-epoch.test.ts:119-144` proves.
2. If a future round revisits provenance, add an isolated witness per conjunct before shipping any guard, and keep the ID-only public path specified separately — the previous round's kills conflated the captured and current comparisons, which is how HIGH-1/HIGH-2 survived to review.
