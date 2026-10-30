# Review — TASK-XHZ4H slice D (context-only delivery): fix 2 + rebase onto A `869bb3ad`

Reviewed commit: `3b075de1a1a2afd006f21964671f977897d28a80`.
Covers both reports, read in full: `TASK-XHZ4H-FIX2.md` (fix 2, `a5b02a07`→`51cf9b1e`)
and `TASK-XHZ4H-REBASE-A869.md` (rebase). Recovery branch
`recovery/context-only-before-refresh` = `51cf9b1e` (verified present).

## Verdict

**APPROVE.** No HIGH, no MEDIUM. Four LOW findings, all non-blocking: three are
documentation/test-strength items, one is a design note about where the push
refusal sits. M-A is genuinely fixed and Soma's addition holds structurally, not
just by test assertion. The rebase is clean by independent verification.

## Findings

### LOW (test) `src/framework.ts:17866` — fork-seed stamp alignment rests on an unasserted dependency invariant

`seed = stripUnpairedToolBlocks(withoutNotices)` and the loop below reads the
stamp as `withoutNotices[i]!.inheritedDelivery`, indexing `withoutNotices` by
`seed`'s index. That is only correct while `stripUnpairedToolBlocks` preserves
array length 1:1. It does today — I verified at pinned context-manager **0.24.1**
that it is a `messages.map(...)` which replaces emptied content with a
`[tool call omitted]` placeholder rather than dropping the message
(`node_modules/@animalabs/context-manager/dist/src/normalize-tool-messages.js:96-131`),
across unpaired-use, unpaired-result, multiple-unpaired and paired inputs.
The code must index `withoutNotices` because `stripUnpairedToolBlocks` returns
fresh `{participant, content}` objects and drops the extra `inheritedDelivery`
property — so `seed[i].inheritedDelivery` would be `undefined`. The choice is
deliberate and currently correct.

Failure scenario: if a future context-manager filters that array instead of
mapping it, every seeded row after the first drop silently receives the previous
row's classification; a context-only-derived row could be stamped
`mode: 'normal'`. Blast radius is bounded — `inheritedInboundDelivery` always
returns `conversational: false`, so no wake/injection/anchor effect escapes, and
`isConversationalInjection` returns false either way. The damage is to the
durable classification itself (acceptance O1 "one-way stamped history, no
downgrade") on the fork lane, and it would surface only on a second-generation
fork via `restrictedRow`. This lane is exactly deferred L7(b) (profile-on real
fork seeding), so nothing would catch it.

Fix direction: assert `seed.length === withoutNotices.length` before the loop, or
zip the stamps alongside instead of re-indexing.

### LOW (test) `test/helpers/context-only-compatibility-corpus.ts:17` — the assistant-row "metadata" half of L-C is vacuous

The L-C fix correctly widens `stored()` to include assistant rows and adds a
positive non-vacuity assertion (`90529ac7`), so content drift on assistant rows
is now compared. But in the actual corpus every assistant row carries no
metadata: walking `corpus-head.json` finds **16** assistant non-arrival rows and
**0** of them with a `metadata` object. The report's claim "preserving their
content and metadata" is true of the projection code and untrue of what the
corpus exercises. Failure scenario: a future change that alters assistant-row
metadata under the profile passes the differential unnoticed. Fix direction: note
the limitation beside the assertion, or include a row class that carries metadata.

### LOW (docs) `src/mcpl/server-connection.ts:494` — stale doc comment on `refuseCapability`

The comment still reads "The same capability response and notification diagnostic
on either profile", but the function now returns per-item ordered
`capability_denied` results instead of the JSON-RPC capability error whenever the
batch carries any item `delivery` field (documented delta #3). Failure scenario: a
maintainer relies on the comment and assumes the response shape is
profile-independent and uniform, and reuses `refuseCapability` for a new event
expecting a single error response. No runtime defect. Fix direction: reword to
say the response is uniform across profiles but shape-varying for selector-bearing
incoming batches.

### LOW (design) `src/mcpl/server-connection.ts:2614` — push refusal answers at line receipt, which the file elsewhere argues against

The push/event `delivery` rejection sits in `dispatchMessage` before the tap and
before the plane gate, so a staged or paused connection is answered immediately.
The comment at `src/mcpl/server-connection.ts:1137-1145` explains that the design
deliberately does *not* reject at line receipt because doing so "both bounced
conforming servers' startup pushes and made a FAILED startup observable to the
server (a response where the ledger said nothing was released)". D reintroduces
that pattern for this one frame shape.

I assess it as acceptable on its merits, not merely because it was directed:
the refusal is content- and state-independent (always `-32602
unsupported_combination`, gated only on presence of the field, per the manager's
answer to ask 3), so it leaks no grant, profile or policy state — it discloses
only that the host read the line, which the `ping` fast-path immediately above
(line 2609) already discloses to any server before admission and buffering. It is
also directly tested with a paused data plane on both profiles
(`test/context-only-delivery.test.ts:156-167`: taps 0, `bufferedEvents` 0, all
three delivery values refused, and no-field push still buffers and is accepted
after `ready()`). Fix direction: none required; reconcile the two comments so the
exception is explicit.

## Checks against the brief

**(1) M-A really fixed; Soma's addition holds.** Confirmed by my own probe
(`probe-ma.mjs`, 25/25 PASS), run head-vs-base against both built production
module sets:
- `serverConfigProblems` for a modern config is byte-identical to A for
  `channels.*`, `channels.contextOnly`, `channels.incoming` and `*.*` — the
  wildcard case still reports exactly A's two `toolLifecycle` problems.
- No collateral loss: head's `DENY_BY_DEFAULT` adds only `channels.contextOnly`;
  `mcplPolicyGrants` still reports every one of A's three deny-by-default paths
  identically. The fix (`src/mcpl/protocol-family.ts:653`) skips only paths
  failing `isKnownCapabilityPath`, and `isKnownCapabilityPath` excludes exactly
  `channels.contextOnly` by name (`src/mcpl/capability-grant.ts:104`) while the
  path remains in `ALL_CAPABILITY_PATHS` — so the exclusion is precisely scoped.
- Grant: `computeGrant` yields `channels.contextOnly` only when
  `contextOnlyStorage === true`; `undefined`/`false` deny, for both config
  spellings. No grant when the peer never advertised it, and deny-by-default with
  no `enabledCapabilities` opt-in even with storage on.

**Soma's constraint is structural, not just asserted.** A modern-family config can
never reach the MCPL offer or grant at all: `McplServerConnection.checkConfig`
throws for `family === 'modern'` (`src/mcpl/server-connection.ts:1419-1427`), the
`experimental.mcpl` host capabilities are serialized only in that class's
handshake (`:1475`), and `src/mcpl/modern-connection.ts` contains **zero**
references to `experimental`, `computeGrant`, `contextOnly` or
`McplHostCapabilities`. D does not touch `modern-connection.ts`. The
`contextOnly` leaf is added to the offer only under
`this.contextOnlyStorage` (`src/framework.ts:32361`), and that offer object is
MCPL-only.

`test/context-only-modern.test.ts` is a real negative control, not a stub: 4 cases
(2 patterns x 2 storage values) spawn a real child
(`test/fixtures/context-only-modern-child.mjs`) that *does* advertise
`experimental.mcpl.channels.contextOnly: true` in its modern `server/discover`
reply and then sends real `channels/register`, two `channels/incoming` and a
`push/event` frame. Assertions cover every item Soma named: empty
`effectiveGrant`, absent from the MCPL registry, `grant.has` false,
`validateDelivery` → `capability_denied`, no `contextOnly` anywhere in host
requests (the offer check) even with storage on, zero `channels-incoming`
listeners, `membrane.calls.length === 0` (no fallback wake), zero channels
registered, and no stored payload or context-only row. The "read barrier" claim is
sound — the unsupported frames precede the tool result on the same pipe, so no
assertion is timing-dependent.

**Review 2's LOWs.** L-A: docs now state a pre-existing `channels.*` pattern
already opts in and naming the leaf literally is not required
(`docs/context-only-delivery.md:13-15`). L-B: the v1 single-version assumption is
stated at the call site (`src/framework.ts:4582-4587`) and in docs
(`:85-88`), and made executable by `test/context-only-floor.test.ts:92-108`, which
refuses a discovered v2 floor and then proves the v1 shortcut does not scan a
later branch carrying a newer marker. L-C: fixed for content, see LOW above.
L-D: five numbered deltas in docs, changelog and both PR bodies, consistently.

**(2) Rebase.** Verified independently, not taken from the report:
`git range-diff c848977f..51cf9b1e 869bb3ad..HEAD` → all 14 entries `=`;
`git diff --exit-code 869bb3ad..HEAD -- src/mcpl/inbound-admission.ts` → empty
(byte-identical to A); `git diff --check 869bb3ad..HEAD` clean.

The D seam is the complete `src/mcpl/server-connection.ts` delta — exactly four
hunks and nothing else, so every other block in that 3,032-line file, including
all RequiredAdmission scheduling/epoch/hold/flush/refusal code, is byte-identical
to A by construction:
- `:1` selector import.
- `:494-504` selector-aware `refuseCapability` (new optional `params`, new early
  branch).
- `:1158` passes `args[0]` at the **pre-existing** grant check.
- `:2614-2620` pre-tap push-selector rejection.

**Noting the brief's correction: I assessed the seam on its merits, and the
"owner confirmed" attribution in `TASK-XHZ4H-REBASE-A869.md` is wrong** — that was
the manager's (Tarn's) call on ask-da16e58f, not the owner's. On the merits the
seam is minimal and well-placed:
- The `:1158` call site is one line *above* the `if (this.requiredAdmission ...)`
  block (`:1161-1178`) but modifies only A's own grant-check line; the ordering
  (grant check before admission) is A's, unchanged. An ungranted
  `channels-incoming` never reached admission on A either.
- The new `refuseCapability` branch loses no diagnostic: A also logs nothing when a
  responder exists, and a responder-less notification still falls through to the
  `console.error` path.
- `hasDeliverySelector` matches any own `delivery` property, so delta #3's "any
  item `delivery` field" is accurate including `delivery: 'normal'`; and
  `validateDelivery` returns `invalid_delivery` for `'normal'`, so there is no
  silent downgrade.
- The push rejection at `:2614` precedes the admission epoch recording at
  `:2676-2677`, so a rejected frame never acquires an ingress key and nothing
  downstream reconstructs one — A's "only transport receipt creates an ingress
  key" invariant is intact. See the LOW above for the one design note.

Nothing in the seam should be moved or removed; doing so would change reviewed D
wire behavior.

**(3) Upstream `a64cfc01` interaction.** All three verified in source:
- `93cdb7d6`: the gate `currentState.supportsInjectedMessages === true ||
  !currentState.stream` is preserved verbatim (`src/framework.ts:16654`) and D's
  predicate is nested *inside* it (`:16661-16662`). The predicate is
  `drainDeferredFor`'s `stopAt`, so a context-only entry stops the mid-turn drain
  and it plus everything behind it waits for the turn-end flush — never injected
  mid-turn. A declared-false or undeclared stream drains nothing at all.
  The `injection-boundary` probe receipt at this commit confirms the production
  path for all three stream declarations: `contextStored: 1`, `injected: false`,
  `fallbackWake: false`, `laterContext: true`, with one active turn and one
  explicit publish in each case.
- `bbba75bc`: the round-only `roundPreamble` path stands
  (`src/framework.ts:25251`), and D's diff against A touches neither
  `roundPreamble` nor any cumulative-preamble fallback (grep over the range diff
  returns nothing).
- `664473ad`: all four removed files are still absent; `ReasoningLossTeller`,
  `reasoning-loss-notice` and `reasoningLossNotice` have zero references in
  `src/` and `test/`; D has no delta in those paths.
- No shadowing gap from D's new `isConversationalInjection` method: every
  behavioral call site uses `this.` (`:16750, :16825, :21414, :21680, :29942`).
  The two module-level calls are correct — `:17324` is the method's own
  delegation, `:17332` computes the stamp from raw metadata, which must not
  consult the stamp it is about to write.

**(4) Reader floor / one-way storage docs.** Honest and specific.
`docs/context-only-delivery.md:73-100` states enablement is one-way, that the new
reader refuses a disabled/omitted profile over enabled history, the v1
single-version assumption *and* the remedy required before a second floor version,
that unreadable branches contribute no floor, and — in bold — that **rollback to
older framework code is unsupported and would treat stamped rows as
conversational**, with the reason (no minimum application-reader gate in the
dependency open paths) and file:line evidence at `:139-146`. Production enablement
is called a separate owner decision in docs, changelog and PR body. The floor is
written with `store.sync()` before any connection is opened
(`src/framework.ts:4618-4625`, ahead of framework construction at `:4734`), so the
"no advertising before persistence gates pass" criterion holds.

I probed one ordering risk and found it covered: `readFloor` runs *before*
`ensureStateRegistered`, which would matter if `getStateJson` on an unregistered
state threw and the guard silently degraded. `test/context-only-floor.test.ts`
pre-registers the state and so does not exercise it, but
`test/context-only-delivery.test.ts:207-219` (B5) does the real production path —
stop, then reopen by `storePath` with `contextOnlyStorage` `false` and
`undefined`, both rejected with `/downgrade refused/`, then reopen enabled and
assert the row is deep-equal to before. The guard fires on the real path.

Stamp parsing fails closed as required: `storedInboundDelivery`
(`src/stored-injections.ts:37-45`) rejects a non-1 version, an unknown mode, a
non-boolean or contradictory `conversational`, and any extra key, returning `null`
for malformed/future; `deliveryForbidsInjection` treats `null` as restrictive.
`inheritedInboundDelivery` is restrictive on empty, unresolved and cyclic lineage.
Wake is blocked at three independent layers (`admit.ts:102`,
`channel-registry.ts:2061`, `framework.ts:17266`).

**(6) Hygiene.** Clean. Scanning the **entire** range (`git log 869bb3ad..HEAD -p`,
every commit and added line, not only the final tree) for `/srv`, `review-drop`,
`.orgasmic`, `/home/orgasmic`, `refreshed-base`, `run-01M`, `TASK-XHZ4H` and
`data/head-*` returns nothing; the same scan over commit messages returns nothing.
No connector literals (`telegram|slack|discord|whatsapp|matrix|signal|irc`) in any
added line under `src/`, `docs/` or `changelog.d/`. Both PR bodies and
`docs/context-only-delivery.md` / `changelog.d/context-only-delivery.added.md` are
free of internal names, hosts and paths. Note this is not Soma's pre-publication
guard, which still applies at publication time.

## Verification Gates

**(5) Assigned head gate — reused receipt, not rerun.** The brief's gate (Node
22.23.3, 16G scope, typecheck+build+`npm test` at `3b075de1`) has a valid reusable
receipt, so per project gate-receipt policy I read the log rather than spend ~46
minutes reproducing it. Eligibility checked explicitly: `cwd` is **my own
worktree**, `HEAD 3b075de1... clean=yes` at both start and end, `node=v22.23.3`,
exit 0, and the project sets no `:GATES_NEVER_REUSABLE:`.

| Gate | Commit / Node | Typecheck / build | Tests | Pass | Fail | Cancelled | Skip |
|---|---|---|---|---:|---:|---:|---:|
| `head-full-22-23-3` (reused) | `3b075de1` / 22.23.3 | pass / pass | 9683 | 9620 | **0** | 0 | 63 |
| `head-full-22-12-0` (reused) | `3b075de1` / 22.12.0 | pass / pass | 9683 | 9620 | **0** | 0 | 63 |
| `base-full-22-23-3-retry` (reused) | `869bb3ad` / 22.23.3 | pass / pass | 9629 | 9566 | **0** | 0 | 63 |

**Reported exactly as asked: pass 9620, fail 0, skip 63** at `3b075de1` on Node
22.23.3. Zero `not ok` lines in the log. Head adds +54 tests / +54 passes over
refreshed A with **no new skips** (63 on both), so no coverage was parked to get
green.

**The baseline `workspace-three-way` 600 s timeout did not recur at head.** I kept
it in mind and checked directly: both head runs report `cancelled 0` and no
`testTimeoutFailure`. The failure is confined to the first baseline attempt on
*unchanged* refreshed A, which the implementer then reran to completion in a
separate checkout plus an isolated 407/407 pass of that file. Classified
environment/load-sensitive on the base, **not** a D regression — and the
classification is now supported by head passing the same file twice under the same
unchanged timeout.

**My own scoped probes** — `reviewer-scoped-probes`, exit 0, log
`gate-reviewer-scoped-probes-01M67EVMFZTT24VQS19EBHX3M8.log` (scripts
`probe-ma.mjs`, `probe-forkseed.mjs` in this evidence dir):
- 25 M-A / Soma checks head-vs-base on built production modules — all PASS.
- 9 fork-seed alignment checks against pinned context-manager 0.24.1 — all PASS.

**Independently re-executed, not taken on the report's word:** the range-diff
(14/14 `=`), the `inbound-admission.ts` byte-identity, `git diff --check`, the full
`server-connection.ts` hunk enumeration, and the corpus identity — all three
corpus files (`corpus-base.json`, `corpus-base-checkout.json`, `corpus-head.json`)
hash to `31c0b6de...6221b9`, so profile-off behaviour is byte-identical to A under
the documented projection.

Other receipts at this commit, read not rerun: `final-rebase-integrity`,
`modern-compatibility` (45 pass), `rebased-focused` (51 pass),
`no-config-differential`, `injection-boundary` — all exit 0.

## Unmet criteria / test gaps

No unmet acceptance criterion. Remaining gaps, all pre-existing and explicitly
deferred by the manager, none introduced this round:

- **L7(b) profile-on real fork seeding is untested.** This is the one gap that
  overlaps a finding: it is the same lane as the LOW above, so the stamp-alignment
  coupling has no executable guard.
- L3 (live context-only locus witness isolation), L4 (loss of the sole
  floor-bearing branch removes downgrade protection), L5 (diamond-lineage
  over-restriction — `inheritedInboundDelivery`'s `visited` set returns restrictive
  on revisit), L8 (`attachDelivery` defines the plan symbol
  `enumerable: true`, `src/mcpl/inbound-delivery.ts:15`).
- The corpus is a finite projection, not a proof for every unconfigured input; it
  omits non-arrival classes other than assistant rows (clock rows, for instance).
- No live connector/provider end-to-end qualification; no dependency
  minimum-reader backport.

On L8 I checked the exploitability since enumerability means object spread copies
the plan: the consequence is fail-safe, not fail-open — the plan is
restriction-only, `JSON.stringify` drops symbol keys so it never reaches storage,
and `withoutDeliveryPlan` strips it before stamping. It stays a LOW-grade
discipline issue, correctly deferred.

## Residual risk

- Enabling the profile is one-way and irreversible in practice. The floor is
  written whenever `contextOnlyStorage === true`, even with zero MCPL servers
  configured, so a single enabled boot permanently commits the store. Documented,
  and production enablement is a separate owner decision.
- The v1 shortcut can leave a later branch's unsupported floor unvisited; a second
  floor version must replace it first. Deleting the sole floor-bearing branch
  removes downgrade protection for other stamped history (L4).
- Old-code rollback is unsupported and cannot be enforced by this change; the
  dependency minimum-reader gate remains follow-up with file:line evidence
  recorded in `docs/context-only-delivery.md`.
- Delta #3 changes the refusal *shape* for any ungranted incoming batch carrying a
  `delivery` field on either profile — connector authors relying on the JSON-RPC
  capability error see ordered results instead. Documented in all five numbered
  delta lists.
- The local extension spelling is unratified and the generic initialize-offer
  facility is slice E; both are recorded as maintainer questions.
- A defensive deferred path (`src/framework.ts:27216-27219`) queues the agent's own
  tool_use/tool_result pair with no metadata, so those rows carry no stamp under
  the profile. Correct behaviour (they are not arrivals, and
  `deliveryForbidsInjection(undefined)` is false, so the drain is unaffected), but
  it makes "reserved on all write lanes" a slight overstatement.

## Fix directions

None blocking. In priority order, for a later round:

1. Assert `seed.length === withoutNotices.length` at `src/framework.ts:17866`, or
   carry the stamps alongside rather than re-indexing — and land the deferred
   L7(b) profile-on fork-seeding test, which would cover both.
2. Record the assistant-row metadata limitation beside the corpus assertion at
   `test/helpers/context-only-compatibility-corpus.ts:17`, or widen to a metadata-
   bearing non-arrival class.
3. Reword the `refuseCapability` comment at
   `src/mcpl/server-connection.ts:494`, and reconcile `:1137-1145` with the
   deliberate line-receipt exception at `:2614`.
4. Correct the "owner confirmed" attribution in
   `/srv/review-drop/TASK-XHZ4H-REBASE-A869.md` to the manager's call on
   ask-da16e58f before that text informs any further decision.

The worktree is left exactly as found: `git status --porcelain` empty, no commits,
no tracked-file edits; all probes and artifacts are in this evidence directory.
