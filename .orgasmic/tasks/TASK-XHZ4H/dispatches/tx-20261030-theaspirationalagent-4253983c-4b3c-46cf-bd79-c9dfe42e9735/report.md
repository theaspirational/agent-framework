# Review — TASK-XHZ4H (generic routing slice D: context-only delivery)

Commit reviewed: `a96ca7c172697632e28d5e7e707ec1c39c735403`
Base: `119cb8662d8e3d33f5aedf3633cb95ca6ec7dce1`
Worktree left clean (`git status --porcelain` empty; only ignored `dist/` built).

## Verdict

**Approve.** No HIGH findings. The restriction-only effect plan, the durable
host-owned classification and the one-way floor hold up under independent
inspection and under five single-point mutations I ran myself; my own full
suite is **green on both trees**, which is a better result than the
implementer's receipts claimed. Four MEDIUM items are follow-ups/documentation
and test-coverage gaps, none of which blocks landing a default-off profile
whose production enablement is already a separate owner decision. Fix the two
MEDIUM items touching the unconfigured path (M1 wire delta disclosure, M2
grant scoping) before the profile is enabled anywhere.

## Findings

### MEDIUM

**M1 — `src/mcpl/server-connection.ts:471` — undisclosed third wire delta on the
unconfigured path: an ungranted `channels/incoming` batch carrying `delivery`
switches from a JSON-RPC error to a success response.**
`refuseCapability` now answers `{results:[…capability_denied]}` whenever any
item has a `delivery` key, gated only on the field's presence — independent of
`contextOnlyStorage` and of required admission. I reproduced the difference
directly on both trees (`$EVID/xhz4h-probe-ungranted.mjs`), with
`contextOnlyStorage` omitted entirely and `disabledCapabilities:
['channels.incoming']`:

| request | base `119cb866` | final `a96ca7c1` |
|---|---|---|
| no `delivery` field | `-32002 channels-incoming rejected: capability "channels.incoming" not in the effective grant` | identical |
| `delivery: "context-only"` | same `-32002` error | `{"results":[{"messageId":"m1","accepted":false,"reason":"capability_denied"}]}` |
| `delivery: 42` | same `-32002` error | `{"results":[{"messageId":"m1","accepted":false,"reason":"capability_denied"}]}` |

Three consequences:
1. `docs/context-only-delivery.md:66-78` enumerates exactly **two** explicit
   compatibility deltas and this is not one of them; the changelog fragment and
   the PR body list only two as well. It is described in passing at
   `docs/context-only-delivery.md:21-23`, so this is a disclosure/consistency
   defect, not an undocumented behaviour — but a connector author reading the
   "Two explicit compatibility deltas" section will miss it.
2. The branch returns before the `policyEstablished` phase distinction at
   `src/mcpl/server-connection.ts:478`. While the §5.3 policy exchange has not
   settled, the base told the server "initial policy not yet established
   (§5.3)"; the final tells it `capability_denied`. A server that treats a
   definitive refusal as final can permanently conclude context-only is denied
   because of startup staging.
3. The branch also skips the `console.error` fallback at
   `src/mcpl/server-connection.ts:483`, so a delivery-bearing notification
   (responder without `respond`) is now dropped with no operator diagnostic.

It is not caught by the no-config differential corpus (see M3), which never
sends the field.
*Fix direction:* list this as a third delta in `docs/`, the changelog fragment
and the PR body; preserve the `policyEstablished`-phase answer (or refuse with
the phase-aware reason) while the grant does not yet exist; keep the
`console.error` fallback when there is no `respond`.

**M2 — `src/mcpl/capability-grant.ts:341` — with the profile enabled,
`channels.contextOnly` is granted to any server that advertises the
`channels: true` boolean shorthand, without ever naming the leaf and with no
diagnostic.**
The new path is not in `DENY_BY_DEFAULT` (`src/mcpl/capability-grant.ts:227-231`),
so once `contextOnlyStorage` is on, the only thing between a peer and the new
privilege is the peer's own advertisement. Probe
(`$EVID/xhz4h-probe-grant2.mjs`, real `expandAdvertisementShorthand` →
`maskNegotiatedCapabilities` → `computeGrant` chain):

```
A shorthand channels:true, empty config          -> granted: true   dropped: []
B shorthand + disabledCapabilities contextOnly   -> granted: false  dropped: ["channels.contextOnly"]
C explicit leaf + disabledCapabilities           -> granted: false  dropped: ["channels.contextOnly"]
D never advertised                               -> granted: false  dropped: []
E enabledCapabilities allowlist w/o contextOnly  -> granted: false
```

Case A is the failure mode: enabling the profile for one connector hands
context-only to **every** MCPL server on the host that uses the shorthand,
each of which can then write non-conversational rows into an agent's context
with no wake and no anchor. Per-server scoping exists (B/C/E) but
`docs/context-only-delivery.md` never mentions `disabledCapabilities` /
`enabledCapabilities` as the control, and there is no test for case A — the
closest test, `test/context-only-delivery.test.ts:169-177`, only asserts the
profile-**off** direction. Because this is consistent with how every other
`channels.*` leaf is negotiated in this codebase, I am not calling it a bug;
the exposure is real only once someone enables the profile.
*Fix direction:* add `channels.contextOnly` to `DENY_BY_DEFAULT` so it needs
`enabledCapabilities` per server and emits the existing loud diagnostic, or at
minimum document the shorthand behaviour and the per-server control and add a
test pinning case A.

**M3 — test gap: the no-config differential corpus is too narrow to support the
"behaves exactly as base" claim on its own.**
`$ORGASMIC_REVIEWED_EVIDENCE_DIR/no-config-corpus.mjs` is 26 lines: one fixture
shape, one channel, 5 metadata variants × 2 lanes × 2 profile spellings
(`undefined`, `false`) = the 20 deliveries. It pins
`server: { shouldTriggerInference: () => false }`, so the unconfigured path's
**wake, locus, anchor, repin, typing and explicit-send-suppression** behaviour
— the exact machinery slice D modifies — is never exercised in the
differential at all. It also omits coalesced incoming, tune-out holds,
required-admission profiles, multi-branch stores, and the fork-seed path that
`src/framework.ts:17796` now rewrites unconditionally. The PR body's wording
("matches baseline content/metadata/results apart from generated IDs") is
accurate for what the corpus does; the report's broader framing is not
supported by it.
What actually covers the unconfigured path is full-suite equality, which my own
runs now supply (see Verification Gates). I verified the profile-off
short-circuits by reading each new call site; the only differences I could find
are the two documented deltas, M1, and M4.
*Fix direction:* either widen the corpus to a wake-bearing scenario and the
fork-seed path, or state in the report/PR that full-suite equality is the
primary evidence and the corpus is a stored-shape spot check.

**M4 — `src/framework.ts:4558-4566` — unconditional per-branch store-view scan
at every `AgentFramework.create`, including when the profile has never been
enabled.**
The floor scan opens `store.view(branch.name)` and reads a state for every
branch on every startup. Undo creates branches (`src/framework.ts:14568`) and
nothing in `src/` ever deletes them — the only `deleteBranch` call is the
operator API at `src/api/server.ts:640` — so branch count grows monotonically
with operator undos. Two costs land on the "identical to base" path: O(branches)
view opens plus state reads at boot, and a new hard failure surface, since the
per-branch `view()` / `getStateJson()` is unguarded and any branch that throws
("Branch not found" after a concurrent delete, an unreadable branch) now fails
`AgentFramework.create` outright. The scan itself is correct and necessary (it
is what makes the floor branch-independent — see L4), the unconditional cost is
the issue.
*Fix direction:* read the current branch first and scan the rest only when it
can change the answer; wrap each per-branch read so one unreadable branch
degrades to "no floor found on that branch" with a loud diagnostic rather than
blocking startup.

### LOW

**L1 — `src/mcpl/channel-registry.ts:1935-1937` — the new refusal reasons emit
neither a trace event nor a log line.** Thirty lines above, the sibling
unknown-channel refusal both logs (rate-limited via `unknownChannelLines`) and
emits `mcpl:channel-incoming-rejected`. A connector refused with
`invalid_delivery` / `capability_denied` / `unsupported_combination` is
invisible to an operator reading host logs or traces. The pinned design's M2
paragraph asks for a "reason counter/log" on drops.
*Fix:* emit the existing `mcpl:channel-incoming-rejected` trace with the closed
reason, and reuse `RefusalLines` for the log.

**L2 — `src/mcpl/server-connection.ts:2532-2535` — a `push/event`
*notification* carrying `delivery` is dropped silently.** `if (request.id !=
null)` answers a request; a notification falls through to a bare `return` with
no log and no trace, where the base would have processed it. Consistent with
A3 ("refused before effects"), but the operator gets nothing.
*Fix:* `console.error` on the id-less branch.

**L3 — test: the production-ingress anchor assertion does not witness the live
mechanism.** The pinned design (GENERIC-RECIPIENT-ROUTING.md:53) requires the
live mechanism to be `decision.locus=false`, "not the later defensive guard",
and asks for the production-ingress test *as well as* a defensive-boundary
test. I ran the two mutations independently
(`$EVID/xhz4h-review-mut.py`, logs `$EVID/rev-mut-*.log`):

- `admit.js` context-only branch `locus: false` → `locus: true`: killed, but
  only by `not ok 14 - B6 …` (`test/context-only-delivery.test.ts:188`, a direct
  unit call of `admit()`). The production-ingress test at
  `test/context-only-delivery.test.ts:39` stays **green**.
- framework defensive guard `if (!deliveryOf(event).anchor)` → `if (false)`:
  killed only by `not ok 22 - C2 …` (`test/context-only-delivery.test.ts:329`).

Both mechanisms do have a witness, so this is coverage shape, not an untested
path. It does mean the implementer report's claim that its
`anchor-not-suppressed` mutation makes "the real production-path anchor witness
also fail" is not established: that mutation reverts both mechanisms at once,
and its `locus: false` → `locus: true` string replacement in
`/tmp/xhz4h-mutations-r2.py:8` hits all three `admit` return branches, not just
the context-only one.
*Fix:* have the ingress test assert `locus`/latest-inbound state through the
real decision (or stub the defensive guard out for that assertion).

**L4 — `src/framework.ts:4571-4575` — the floor is written only to the branch
current at startup, so deleting that branch can silently drop the one-way
guarantee.** States are branch-scoped (chronicle `view()` docs,
`node_modules/@animalabs/chronicle/index.d.ts:306-309`). Sequence: branch `X`
is created before the profile is ever enabled; the profile is then enabled with
`main` current (floor → `main`); a runtime `switchBranch('X')` (undo, fork)
stamps rows onto `X`, which carries no floor record of its own. The all-branch
scan still protects this (it finds `main`'s floor), *unless* `main` is deleted
via `src/api/server.ts:640` — after which stamped rows survive on `X` with no
floor and the profile can be turned off, which is exactly the downgrade the
floor exists to prevent. `docs/context-only-delivery.md:80-84` claims the
reader "refuses startup if that floor exists on any branch", which is literally
true and does not cover this.
*Fix:* refresh the floor on the newly current branch after `switchBranch` while
the profile is enabled, or refuse `deleteBranch` of a floor-bearing branch;
document the limitation meanwhile.

**L5 — `src/stored-injections.ts:72,80-81` — the shared `visited` set
over-restricts an acyclic diamond lineage.** `restrictedSummary` returns `true`
on any re-visit, so a summary reached twice through two parents is treated as
restricted even when its first visit resolved to normal. Fail-closed, and since
`inheritedInboundDelivery` always returns `conversational: false` the only
observable effect is an extra `deliveryForbidsInjection` on a fork-seed row that
is not mid-turn injected anyway. Noting it so the next change here does not
assume the traversal is exact.
*Fix:* memoize the per-id verdict instead of treating re-entry as restriction;
keep cycle detection on the active path only.

**L6 — internal planning vocabulary ships into the public doc and the released
changelog.** `docs/context-only-delivery.md:3` ("required-admission slice A
(#906)"), `:93-94` ("pending slice E. D uses the existing typed MCPL offer
builder"), and `changelog.d/context-only-delivery.added.md:2,13` ("dependent on
slice A (#906)", "pending SPEC/slice E"). The changelog fragment is folded into
the public `CHANGELOG.md` at release (`CONTRIBUTING.md:91`). "slice A" is at
least traceable to #906; "slice E" and bare "D" have no public referent, and
`docs/required-inbound-admission.md` (slice A's own shipped doc) uses no slice
vocabulary at all. No genuinely internal identifiers leaked — I scanned every
changed non-test file for the task id, worker/manager names, `rt:D:go`, the
`Soma G-T*` labels and the `B*/C*` battery labels, and found none.
*Fix:* say "required inbound admission (#906)" and "a future generic
initialize-offer extension" instead.

**L7 — test gaps, smaller:** (a) no test for an unsupported floor version
(`floor !== 1` with the profile on), which `docs/context-only-delivery.md:82`
promises and `src/framework.ts:4562` implements; the B5 test at
`test/context-only-delivery.test.ts:207` only covers the disabled/omitted
profile. (b) no test drives the real fork-seed path
(`src/framework.ts:17796-17810`) with the profile on; the compaction test at
`:291` calls `inheritedInboundDelivery` directly instead. That path is where a
`seed`/`withoutNotices` index drift would mis-stamp a row — I verified the
alignment holds by hand (`stripUnpairedToolBlocks` in
`node_modules/@animalabs/context-manager/src/normalize-tool-messages.ts:113-135`
is a pure `map`, so lengths match, and `withoutThinking` /
`withoutPrimaryNotices` at `src/framework.ts:1989-1997,2051-2058` spread the
message so `inheritedDelivery` survives), but it is unwitnessed.

**L8 — `src/mcpl/inbound-delivery.ts:15` — `attachDelivery` makes the private
symbol `enumerable: true`, so every object spread of a carrying metadata object
copies the plan.** Safety currently depends on `withoutDeliveryPlan` /
`deliveryMetadata` being present on each write path rather than on the property
being structurally uncopyable. `enumerable: false` would make the invariant
hold by construction with no call-site discipline (symbols are already dropped
by `JSON.stringify`, and `carryDelivery` uses `in`, not enumeration).

## Verification Gates

Reruns I performed myself (not the implementer's receipts), Node v22.23.3, each
under `XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p
MemoryMax=16G -p MemorySwapMax=0` via `orgasmic dispatch gate`, **without** the
implementer's `loopback-only-v2.cjs` `NODE_OPTIONS` guard, so the two trees are
compared in one identical environment:

| Gate | Tree | typecheck / build | tests | pass | fail | skip | log |
|---|---|---|---|---|---|---|---|
| `review-full-final-22-23-3` | `a96ca7c1` (worktree) | pass / pass | 9632 | 9569 | **0** | 63 | `$EVID/review-full-final.log`, receipt `$EVID/gate-review-full-final-22-23-3-01M665MDTB8PMNCGJS75YV9TZJ.log` |
| `review-full-base-22-23-3` | `119cb866` (`/tmp/xhz4h-review-base`, `git archive` + copied `node_modules`) | pass / pass | 9601 | 9538 | **0** | 63 | `$EVID/review-full-base.log`, receipt `$EVID/gate-review-full-base-22-23-3-01M6660SVMCTDY2GQ1F4CT2SCJ.log` |

Both with `AF_TEST_CONCURRENCY=4`, runner `$EVID/xhz4h-review-run.sh`.
Delta base → final: **+31 tests, +31 pass, 0 fail on both, skips unchanged at
63.** No regression, no new skip, no flake in either direction.

**On the report's 5 full-suite failures:** both of my runs are **green**, and
the implementer's totals reconcile exactly with mine on both trees —
final `9564 pass + 5 fail = 9569` = my final pass count; base `9532 pass + 6
fail = 9538` = my base pass count. That
corroborates the classification — the 4 recurring failures are artifacts of the
`--require loopback-only-v2.cjs` guard prepending child flags (environment, not
regression; the implementer's own pristine-base probe
`gate-baseline-guard-v2-probe-01M664YMDFAC2ASR1W1HQ9QQQN.log` showed the same 4
on unmodified base source), and the 5th was a concurrency fixture collision
that did not recur without the guard. No failure in either of my runs is
attributable to this change.

Independent single-point mutations (`$EVID/xhz4h-review-mut.py`, isolated
`dist` snapshot, originals restored in `finally`; real
`dist/test/context-only-delivery.test.js`). These are mutations the implementer
bundled or omitted, chosen to test witness independence rather than re-run its
battery:

| Mutation | Killed | Killing assertion |
|---|---|---|
| `live-locus-only` (`admit` context-only branch `locus:false`→`true`) | yes | `not ok 14 - B6 …` only (see L3) |
| `defensive-anchor-guard-only` (`!deliveryOf(event).anchor`→`false`) | yes | `not ok 22 - C2 …` only (see L3) |
| `admit-effects-ignored` (`env.effects?.wake === false`→`false`) | yes | `not ok 14 - B6 …` |
| `conversational-override-off` (stamp read in `isConversationalInjection`→`false`) | yes | `not ok 3, 16, 17, 19, 21` |
| `inherited-lineage-permissive` (`inheritedInboundDelivery` row restriction→`false`) | yes | `not ok 16, 17, 18, 19` |

Production-path probes: `$EVID/xhz4h-probe-ungranted.mjs` (M1, run against both
trees' real loopback fixture) and `$EVID/xhz4h-probe-grant2.mjs` (M2, real
shorthand-expansion → mask → `computeGrant` chain).

Reusable receipts read rather than rerun, per the dispatch: `architecture-red-probe`,
`final-cleanup-focused`, `final-context-only-focused` (51/51),
`final-isolated-followup`, `final-no-config-differential` — all exit 0 at
`a96ca7c1`.

Source review: full diff of all 12 changed `src/` files plus the three test
files; `admit.ts`, `inbound-delivery.ts`, `stored-injections.ts` read whole;
`capability-grant.ts` `DENY_BY_DEFAULT`/`advertisedPaths`/`isKnownCapabilityPath`
consumers traced; `stripUnpairedToolBlocks`, `withoutThinking`,
`withoutPrimaryNotices`, `isConversationalInjection`, `markAccepted`,
`refuseCapability`/`refuseAdmission`, `fromQueue` call sites, chronicle
`view()`/`getStateJson` contracts checked against the claims.

## Unmet criteria / test gaps

Against the task's acceptance row, nothing is unmet:

- **T battery incl. compaction/restart and reserved-key collision delta** — met.
  Compaction is real (`test/context-only-delivery.test.ts:291` drives
  `AutobiographicalStrategy` with a stub completion and asserts a summary
  really spans both classifications, read from `sourceIds`, never summary
  text). Restart is real in two forms: in-process re-`create` at `:207` and an
  abrupt child-process exit at `:270` via
  `test/fixtures/context-only-queue-child.mjs`. Sharding is real at `:282`.
  Reserved-key collision is covered at `:98` on all three write lanes.
- **One-way stamped history, no downgrade (O1)** — met, with the narrow
  branch-deletion hole in L4. `test/context-only-delivery.test.ts:207` asserts
  `create` rejects with `/downgrade refused/` for both `false` and `undefined`,
  and that the stored row is byte-identical afterwards.
- **No advertising before persistence gates pass** — met: the floor is
  `setStateJson` + `store.sync()` at `src/framework.ts:4573-4574`, before the
  `AgentFramework` is constructed and therefore before any MCPL connection; the
  offer at `src/framework.ts:32252` is conditioned on the same flag, and the
  `advertisement-without-profile` mutation is killed.
- **Soma G-T1..G-T3** — G-T1 at `:71` (forged top-level tags, nested
  `metadata.tags`, forged reserved stamp, foreign `serverId` — all four, and I
  confirmed the stamp is read-side restriction-only: `isConversationalInjection`
  can only return `false` early and never `true`, and `deliveryForbidsInjection`
  only adds an `||` restriction at `src/framework.ts:16591`, so a forged
  `mode:'normal'` stamp grants nothing). G-T3 at `:207`/`:221`/`:291`. G-T2 is
  unlabelled in the report but covered in substance: push at `:156` (both
  profiles), ungranted at `:126`/`:337`, no-field at `:98`. The one genuine
  spill-over of the selector into a shared helper is M1.
- **No connector literals** — met and strengthened:
  `test/routing-runtime-has-no-connector-literals.test.ts:127-129` adds the three
  new files to the scanned set with empty allowances (a strengthening, not a
  weakening), and `test/context-only-routing-architecture.test.ts` adds an AST
  walk over the 50+ file local import closure with a self-test that the walk
  really fails on identifiers, string/template/regex literals while tolerating
  comments. Reusable `architecture-red-probe` receipt confirms the red direction.

Assertions touched in existing tests are strengthenings or necessary
arithmetic, not weakenings: `test/mcpl-capability-grant.test.ts:28,57-59` updates
19→20 vocabulary paths and `channels: true` 7→8 leaves, both forced by the new
leaf and both still exact-set/exact-count assertions.

Remaining gaps are M2 (case A untested), M3 (corpus narrowness), L7(a) floor
version, L7(b) real fork-seed path, and L3's witness shape.

## Residual risk

1. **Enabled-profile breadth is thinly exercised.** With the profile on,
   `deliveryMetadata` (`src/framework.ts:17265-17271`) stamps **every**
   `addMessage`, turning a previously `undefined` metadata into
   `{inboundDelivery:{…}}` on assistant rows, clock rows, notices and system
   rows alike. I checked the in-function consequences (`'deferredWriteId' in
   metadata` / `PRIMARY_IF_UNREAD_KEY in metadata` at
   `src/framework.ts:29568,29576` are `in`-guarded, and
   `isConversationalInjection(undefined) === isConversationalInjection({}) ===
   true`, so the frozen classification equals what base computes dynamically),
   but the full suite only ever runs the profile **off**; the whole enabled-path
   surface rests on `test/context-only-delivery.test.ts` alone. The report's
   "production enablement is a separate owner decision" is doing real work here.
2. **One-way enablement with no reader floor in the dependencies.** Unchanged
   from A2 and honestly documented. Rolling back to pre-`a96ca7c1` framework
   code reads stamped rows as conversational; context-manager 0.24.1 /
   Chronicle 0.5.1 cannot enforce an application minimum reader. I confirmed the
   cited evidence exists (chronicle `index.d.ts` has no reader floor in its open
   config; context-manager preserves opaque row metadata). The follow-up is
   correctly filed as a maintainer question rather than claimed as implemented.
3. **Local extension spelling.** `experimental.mcpl.channels.contextOnly` and
   `channels.contextOnly` are unratified; `isKnownCapabilityPath` deliberately
   excludes the leaf from feature-set `uses`
   (`src/mcpl/capability-grant.ts:104`), so a peer that lists it in `uses` gets
   an unknown-path error. If SPEC lands a different spelling, stamped stores are
   already one-way.
4. **No live connector qualification.** Everything is synthetic over the real
   loopback transport. The first consumer's behaviour — in particular never
   resending an uncertain context-only ACK — is a connector-side obligation this
   slice can only document (`:197` proves the host does not replay).

## Fix directions (ordered)

1. M1: list the ungranted-batch response change as a third delta in
   `docs/context-only-delivery.md`, the changelog fragment and the PR body;
   keep the `policyEstablished` phase answer while the grant does not yet exist;
   restore the `console.error` fallback for responder-less notifications.
2. M2: add `channels.contextOnly` to `DENY_BY_DEFAULT` (preferred — it buys the
   existing loud diagnostic and per-server `enabledCapabilities` gating), or
   document the `channels: true` shorthand behaviour plus
   `disabledCapabilities` as the control and pin it with a test.
3. M4: make the per-branch floor read fault-tolerant and skip the non-current
   branches when they cannot change the answer.
4. M3 + L7: widen the differential to one wake-bearing scenario and the
   fork-seed path; add the `floor !== 1` case.
5. L1/L2: trace + rate-limited log on the new refusals and on the id-less push
   drop.
6. L3: make the ingress test sensitive to `decision.locus` alone.
7. L6: drop "slice A/D/E" from the shipped doc and changelog fragment.
8. L4, L5, L8: floor-on-branch-switch, memoized lineage verdicts,
   `enumerable: false`.

## PR body accuracy

Checked line by line against the tree and my own runs. Accurate: the slice-A
dependency, the default-off claim, the two-grants requirement, the `uses`
exclusion, the one-way/rollback paragraph, the offer-builder paragraph, the
"not verified / out of scope" list, and the AI-assistance disclosure (commit
trailer `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` is present and
matches `CONTRIBUTING.md:82`). The test paragraph's counts match the implementer
logs, and its characterisation of the 4+1 failures is corroborated by my runs.
Two defects: it claims "two compatibility deltas" where there are three (M1),
and it carries "slice A"/"slice E" into text that will be read publicly (L6).
No internal identifiers (task id, worker or manager names, battery labels,
`rt:D:go`) appear in the PR body or in any shipped file.
