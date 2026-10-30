# Review — TASK-XHZ4H fix round 1 (context-only delivery)

Commit reviewed: `a5b02a07fd4c380ded751e01ada2ce3e6b242cca`
Diff base (fixed required inbound admission, #906): `c848977fc2280b378576f0eb72c2b07a0a93b86f`
Inputs read in full: `/srv/review-drop/TASK-XHZ4H-REVIEW1.md`, `/srv/review-drop/TASK-XHZ4H-FIX1.md`.
`$EVID` below = `/home/orgasmic/.orgasmic/runs/run-01M6761VMXFKRWHTNKM8S64E13/evidence`.
Worktree left as found: `git status --porcelain` empty, only ignored `dist/` rebuilt.

## Verdict

**APPROVE**, with one MEDIUM to fix before merge and three LOWs.

Every item the owner assigned for this round — M1, M2, M3, M4, L1, L2, L6 — is
really fixed, and each fix has a test that dies when I revert the fix: all eight
single-point mutations I ran were killed by the named new assertions (table
below). The rebase onto fixed A is restriction-only: `src/mcpl/inbound-admission.ts`
is byte-unchanged, A's `RefusalCode` union is untouched, and the pre-rebase
version's one real intrusion into A's vocabulary (D's reason flowing through A's
`reason` slot in the per-item admission path) was removed by the rebase. My own
full gate at the head on Node 22.23.3 is green (9,755 tests / 9,692 pass / 0
fail / 63 skipped), matching the implementer's receipt exactly, and I reproduced
the profile-off corpus byte-identically from scratch (same SHA-256), including a
negative control proving the corpus is sensitive to a one-line profile-off change.

The MEDIUM is new in this round: the M2 fix (adding `channels.contextOnly` to
`DENY_BY_DEFAULT`) makes a *modern*-family MCP server configuration that worked
before — `enabledCapabilities: ['channels.*']` — fail its configuration check,
independent of the storage profile. That is a fourth compatibility delta on the
"unchanged when unconfigured" path, and it is not disclosed anywhere.

## Findings

### MEDIUM

**M-A — `src/mcpl/capability-grant.ts:228` + `src/mcpl/protocol-family.ts:652-656,748-750`
— undisclosed fourth compatibility delta: a modern MCP server configured with
`enabledCapabilities: ['channels.*']` is now refused at config check, with the
storage profile off.**

`mcplPolicyGrants` enumerates `DENY_BY_DEFAULT`, and any `enabledCapabilities`
pattern matching such a path is reported as "asks for MCPL behaviour", which for
`binding.family === 'modern'` becomes a config *problem*
(`protocol-family.ts:748-750`) and throws out of `ModernMcpConnection`'s
constructor (`src/mcpl/modern-connection.ts:476`). Adding the new leaf makes the
two-segment wildcard `channels.*` match a deny-by-default path for the first
time. `DENY_BY_DEFAULT` is static, so this does not depend on
`contextOnlyStorage`, on any advertisement, or on the new field appearing on the
wire.

Reproduced on both trees with the real built modules
(`$EVID/probe-modern-policy.mjs`, `$EVID/probe-modern-refusal.mjs`; base =
`data/base-gate` at `c848977f`, head = `data/head-floor-gate` at `a5b02a07`,
both archives verified against `git show` blob hashes):

| `enabledCapabilities` | base `c848977f` | head `a5b02a07` |
|---|---|---|
| `['channels.*']` | `mcplPolicyGrants` → `[]`, `checkServerConfig` accepted | → `['enabledCapabilities: channels.contextOnly']`, `checkServerConfig` **throws** |
| `['channels.contextOnly']` | `[]`, accepted | throws |
| `['channels.incoming']` | `[]` | `[]` (unchanged) |
| `['*.*']` | 2 grants (already refused) | 3 grants (already refused) |

Impact: a host that keeps one shared `enabledCapabilities` stanza across its
servers and includes a modern (plain MCP) one stops connecting that server after
upgrade — before any of this feature is enabled. The surrounding design is
explicitly built so that inert policy values stay deployable on a modern server
(`protocol-family.ts:635-642`), and `server-connection.ts:1417` states the
intent as "every configuration that worked before still passes".

The implementer did meet this as test fallout — `a5b02a07` updates the exact
lists in `test/mcp-protocol-family.test.ts:166,182,190` — but treated it purely
as an expectation refresh: the wildcard case is not tested, and nothing in
`docs/context-only-delivery.md:103-124`, the changelog fragment or the PR body's
"Three explicit compatibility deltas" mentions it. The profile-off corpus cannot
see it (it configures no modern server).

*Fix direction:* preferred — exclude the local extension from the modern-family
MCPL-policy check, the same way `isKnownCapabilityPath`
(`capability-grant.ts:102-105`) already excludes it from feature-set `uses`: a
local host-storage path is not something a modern peer could negotiate either
way, so naming it should not condemn a modern config. Otherwise disclose it as a
fourth delta in docs/changelog/PR body and pin `['channels.*']` on a modern
server with a test.

### LOW

**L-A — `src/mcpl/capability-grant.ts:338-351` — once the profile is on, a
pre-existing `enabledCapabilities: ['channels.*']` already grants the new leaf,
with no diagnostic, and the docs do not say so.** `explicitlyEnabled` is a
pattern match, so the wildcard counts as the explicit per-server opt-in; the
deny-by-default diagnostic is skipped. This is tested on purpose
(`test/context-only-delivery.test.ts:431`) and matches how `toolLifecycle.*`
behaves, so it is not a bug — but `docs/context-only-delivery.md:11-15` reads as
if the leaf must be named ("for example, include `channels.contextOnly`"), and
M2's underlying worry (enabling the profile for one connector hands context-only
to peers nobody intended) survives for every server already configured with a
channels wildcard. *Fix:* one sentence in the doc that a `channels.*` pattern
already opts that server in.

**L-B — `src/framework.ts:4612` — the new short-circuit narrows cross-branch
floor-version checking.** Before the M4 fix every branch was inspected, so an
unsupported floor version anywhere refused startup; now a supported floor on the
current branch answers without looking at the others. Only version 1 exists
today, so this is unreachable at present, but the comment ("other branches
cannot change whether this reader/profile satisfies that floor") is only true
while one floor version exists — a future reader that bumps the version would
silently accept a store whose other branch carries a newer floor. Also note that
M4's cost half is only half-fixed, as the report states plainly: a floorless
store (i.e. every store where the profile has never been enabled) still lists
branches and opens a view per branch at every `AgentFramework.create`. That is
inherent to a branch-independent floor; the guards (`4592-4610`) now contain the
failure surface, which was the dangerous half. *Fix:* when a floor is found,
still treat an unsupported version on another branch as refusing, or state the
single-version assumption at the call site.

**L-C — test gap in the differential projection: `stored()`
(`test/helpers/context-only-compatibility-corpus.ts:18-25`) keeps only rows with
`metadata.messageId`,** so host-written rows — clock rows, notices, assistant
rows — are outside the base/head comparison, which is exactly the surface
`deliveryMetadata` (`src/framework.ts:17331-17337`) touches on every
`addMessage` once the profile is on. For the profile-off comparison the helper
returns metadata untouched, and full-suite equality covers the rest, so this is
coverage shape rather than an untested path. Related, smaller: the in-suite test
`test/context-only-compatibility.test.ts:5` only compares `undefined` against
`false` inside one build — the real head-vs-base comparison lives in the gate,
not in `npm test`. *Fix:* include one non-arrival row class in `stored()`.

**L-D — disclosure nit: the numbered delta list omits the case a connector
author hits first.** With `channels.incoming` granted and the profile off, an
item carrying `delivery: "context-only"` now gets an ordered
`capability_denied` where the base accepted and stored it as an ordinary message
(unknown field ignored). This is the owner-mandated no-downgrade rule and it is
stated in the doc body (`docs/context-only-delivery.md:20-24`) and tested
(`test/context-only-delivery.test.ts:166-174`), but the "Three explicit
compatibility deltas" section only numbers the *ungranted* batch. A second
operator-surface item of the same kind: with the profile off and
`disabledCapabilities: ['channels.*']`, the masked-capability log line
(`src/mcpl/server-connection.ts:1643`) and the operator status field
`maskedCapabilities` (`src/framework.ts:34753`) now additionally name
`channels.contextOnly` (reproduced, `$EVID/probe-mask-delta.mjs`); the effective
grant and `deniedCapabilities` are unchanged.

### Deferred as directed (not re-litigated)

L3 (ingress witness isolation), L4 (floor lost with the sole floor-bearing
branch), L5 (diamond lineage over-restriction), L7 (unsupported floor version /
profile-on real fork seed), L8 (`enumerable: false`). I confirmed each is still
present and each is listed in the report, docs or PR body as a follow-up. On
L7(b) specifically, the profile-on fork-seed path still pairs
`seed.entries()` with `withoutNotices[i]!` (`src/framework.ts:17862-17875`); the
non-null assertion would throw at fork creation if any upstream step stopped
being length-preserving, and the widened corpus deliberately runs profile-off,
so that pairing remains unwitnessed on the enabled path.

## Answers to the brief's questions

1. **M1–M4, L1, L2, L6 really fixed, with a test that fails on revert?** Yes —
   all eight mutations killed (table under Verification Gates). M4 is fixed in
   the sense asked (short-circuit + guarded failures, seven tests); the
   O(branches) cost on floorless stores remains and is disclosed (L-B). L6: no
   "slice A/D/E" vocabulary survives in `docs/context-only-delivery.md`,
   `changelog.d/context-only-delivery.added.md` or the PR body block (grep over
   the final diff and all eight commit messages).
2. **Rebase correctness against fixed A.** `git diff c848977f..a5b02a07 --
   src/mcpl/inbound-admission.ts` is empty. A's `RefusalCode` union
   (`inbound-admission.ts:10-12`) is unchanged and D's reasons live in a separate
   `DeliveryRefusal` type (`src/mcpl/inbound-delivery.ts:32`); the wire `reason`
   field was already `string` (`src/mcpl/types.ts:1355`) and the trace's
   `reason` already `string` (`src/types/trace.ts:432`). All eight claimed seam
   touches verified restriction-only, one by one: `admit.ts:102-104` returns
   `wake/gatePass/locus` false while keeping A's computed `held` and never calls
   the gate; `channel-registry.ts:2061` is `envelope?.mayWake !== false &&
   plan?.wake !== false` (mayWake-only ceiling intact);
   `channel-registry.ts:2025` makes `markAccepted` a no-op instead of changing
   it; `framework.ts:17272` adds `&& deliveryOf(event).wake` beside A's
   `!wakeForbidden(event)`; the sequential ordered drain, held-inference
   release-at-dispatch and `requiredFlushDispatching`
   (`server-connection.ts:462-484`) are not in the diff at all; only one
   `refuseCapability` call site exists and it is A's. `git range-diff
   119cb866..a96ca7c1 c848977f..be8ba368` shows the rebase moved D's refusal
   *out* of A's `reason ?? deliveryRefusal() ?? …` chain into a separate check —
   a strict improvement — and did not resurrect the inventory test A deleted.
3. **The three disclosed wire deltas.** Correct, minimal and tested. Delta 1
   (reserved key) — `framework.ts:17242,17331-17337`, witnessed by the forged-stamp
   tests. Delta 2 (push selector rejected before taps/holds) — exactly the owner's
   instruction, at the wire (`server-connection.ts:2614-2618`) and in the direct
   handler (`push-handler.ts:153-159`), gated only on field presence, witnessed
   on both profiles with a read tap and a paused data plane
   (`test/context-only-delivery.test.ts:156-168`). Delta 3 is now
   `policyEstablished`-gated and keeps the `console.error` fallback when there is
   no responder (`server-connection.ts:495-504`), so M1's three consequences are
   all addressed. **Undisclosed fourth delta: yes** — M-A, plus the two smaller
   surfaces in L-D.
4. **The profile-off corpus claim.** Independently reproduced: I ran the head
   corpus against the `c848977f` archive and against the head tree myself
   (`$EVID/rev-corpus-base.json`, `$EVID/rev-corpus-head.json`) — byte-identical,
   SHA-256 `2904518618…99bb6`, the same digest the implementer recorded. The
   normalization removes only generated identity/time (`inboundSource`,
   `acceptedAt`, `deferredWriteId`, push receipt + clock, generated
   `inferenceId`) and the connection-instance element of `coalescingSubject`;
   sender metadata (including the sender's own `inboundDelivery` value), bodies,
   ordered results, admission `decisions`, anchor/typing/repin counters,
   channel/desired state, published output, injection flags, fork seed rows and
   branch count are all compared. Negative control: reverting the profile gate on
   one line (`withoutHostKeys`'s reserved-key delete) makes the corpus differ
   (`$EVID/rev-corpus-sensitivity.json`), so the projection is not swallowing
   real differences. Residual narrowing is L-C.
5. **DENY_BY_DEFAULT + grant opt-in — can enabling the profile alone grant
   anything?** No. `computeGrant` skips the leaf entirely when
   `contextOnlyStorage !== true` (`capability-grant.ts:342`) and, when the
   profile is on, requires `enabledCapabilities` to match
   (`configGrants` cannot grant it — `capability-grant.ts:239-241` only knows
   the two `toolLifecycle` keys); `maskNegotiatedCapabilities` runs first so
   `disabledCapabilities` still wins; the leaf is excluded from feature-set
   `uses`. Verified with the real handshake in the two new tests and with my own
   grant probe. What enabling the profile alone *does* do is offer the sibling
   leaf, stamp every write, and write the one-way floor — all documented. Caveat:
   a wildcard counts as the opt-in (L-A).
6. **Connector names / internal identifiers.** None. The only connector names in
   the diff are inside `test/context-only-routing-architecture.test.ts`'s own
   forbidden-pattern self-test (its red witness), which is the intended use. No
   task id, worker/manager name, `rt:D:go`, `Soma`/`G-T*` label, battery label,
   host or review-drop path appears in any shipped file, in the docs/changelog,
   in the PR body block, or in any of the eight commit messages (greps over
   `git diff c848977f..a5b02a07` and `git log --format='%s%n%b'`). All eight
   commits are authored and committed by
   `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` with
   `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`; `git diff --check` clean.

## Verification Gates

Run by me, not reused:

| Gate | Command | Result | Log |
|---|---|---|---|
| `review-full-22-23-3` | `orgasmic dispatch gate review-full-22-23-3 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 $EVID/rev-full.sh <worktree> /opt/node-v22.23.3-linux-x64/bin` (runner: `npm run clean && npm run typecheck && npm run build && npm test`, `AF_TEST_CONCURRENCY=4`, `NODE_OPTIONS` unset) | **exit 0** — typecheck/build pass; **9,755 tests / 9,692 pass / 0 fail / 63 skipped / 0 cancelled**, 688s | `$EVID/review-full-22-23-3.log`, receipt `$EVID/gate-review-full-22-23-3-01M6762PT4Y03A6NEDJ5CM36P1.log` |

My head totals equal the implementer's `head-full-22-23-3-final` receipt exactly
(9,755 / 9,692 / 0 / 63). I did **not** re-run the base full suite, so the
"+46 tests, 0 fail" delta rests on my head run plus their
`base-full-22-23-3` receipt (9,709 / 9,646 / 0 / 63).

Unwrapped probes (no reusable receipt):

| Probe | Result |
|---|---|
| `$EVID/rev-mutate.py` — 8 single-point mutations on the built tree, originals restored in `finally` | all 8 **killed**; see table below |
| `$EVID/run-corpus.mjs` re-run, head corpus × (base archive, head tree) | byte-identical, SHA-256 `2904518618…99bb6`, `$EVID/rev-corpus-diff.txt` empty |
| corpus sensitivity control (profile gate removed from `withoutHostKeys`) | corpus **differs** → projection is sensitive |
| `$EVID/probe-modern-policy.mjs`, `$EVID/probe-modern-refusal.mjs` | M-A, both trees |
| `$EVID/probe-mask-delta.mjs` | masked-capability list delta with the profile off (L-D) |
| base/head archive integrity (`git show <sha>:<path> \| sha256sum` vs archive) | `src/framework.ts`, `src/mcpl/channel-registry.ts`, `src/mcpl/inbound-admission.ts`, `package.json`, `src/mcpl/capability-grant.ts` all match; `data/base-gate` contains no `contextOnly` reference |
| chronicle `getStateJson` on an unregistered state | returns `null`, does not throw → the new current-branch read adds no spurious startup diagnostic on a fresh store |

Mutation → killing assertion (logs `$EVID/rev-mut-*.log`):

| Mutation (reverts) | Killed by |
|---|---|
| `m1-policy-phase` (drop `this.policyEstablished &&`) | `not ok 29 - ungranted selector retains the initial-policy error and diagnoses notifications…` |
| `m1-no-responder-guard` (drop `&& batchResponder?.respond`) | same test 29 |
| `l2-push-notification-log` (drop the id-less push `console.error`) | same test 29 |
| `m2-deny-by-default` (remove `'channels.contextOnly'` from `DENY_BY_DEFAULT`) | `not ok 30/31 - context-only needs per-server opt-in even with profile enabled (boolean/object)`, `not ok 46 - MCPL policy on a modern server…` |
| `m4-no-short-circuit` (`if (floor === undefined)` → `if (true)`) | `not ok 1 - current reader floor bounds repeated enabled startup…` |
| `m4-unguarded-branch-read` (branch-read catch rethrows) | `not ok 3/4 - reader-floor fallback guards a branch open/read failure…` |
| `l1-no-trace` (drop the refusal trace) | `not ok 33/34/35 - delivery <reason>: every refusal is traced…`, `not ok 36 - grant narrowing after the required hook…` |
| `l1-no-log-line` (suppress the rate-limited line) | same 33/34/35/36 |

Source review: full `git diff c848977f..a5b02a07` of all 10 changed `src/` files
and all 8 test files; `git range-diff` of the rebase; `admit.ts`,
`inbound-delivery.ts`, the new `stored-injections.ts` helpers, the floor block
and `deliveryMetadata`/`isConversationalInjection` wrappers read whole;
`mcplPolicyGrants`/`serverConfigProblems`/`checkServerConfig` consumers,
`maskNegotiatedCapabilities`/`droppedCapabilities` consumers, `RefusalLines.admit`,
`HOST_METADATA_KEYS`/`isConversationalInjection` inputs and the `fromQueue`
sentinel traced to their call sites.

One claim I checked specifically because it decides whether the frozen stamp can
drift from base's dynamic answer: `isConversationalInjection`
(`framework.ts:452-458`) reads only `system`, `tags` and `firstView`;
`firstView` is written into metadata before the write
(`framework.ts:17445,19290`), `editMessage` replaces content and keeps metadata
(`framework.ts:31292-31314`), and the keys `addMessage` strips *after* stamping
(`deferredWriteId`, `primaryIfUnread`) are not inputs to it. So the stamp equals
what the base computes at read time, including across an edit.

## Unmet criteria / test gaps

Nothing in the assigned fix scope is unmet. Against the task's acceptance row,
the round-1 assessment still holds and is now stronger (per-server opt-in,
refusal diagnostics and the floor guards all have witnesses). Remaining gaps:

- M-A's wildcard case on a modern server is untested (and undisclosed).
- L-A: no test or doc line for "a pre-existing `channels.*` is the opt-in".
- L-C: non-arrival rows are outside the differential projection; the in-suite
  compatibility test compares `undefined` vs `false` within one build only.
- Deferred by instruction: L3, L4, L5, L7(a) unsupported floor version, L7(b)
  profile-on real fork seeding, L8.
- The enabled-profile surface is still exercised only by
  `test/context-only-delivery.test.ts` and `test/context-only-floor.test.ts`;
  the full suite runs the profile off throughout.

## Residual risk

1. **Enabled-profile breadth.** Unchanged from round 1 and still the largest
   item: with the profile on, every `addMessage` is stamped and every fork seed
   row becomes non-conversational. The whole enabled path rests on the two new
   test files. "Production enablement is a separate owner decision" is doing real
   work.
2. **One-way enablement with no reader floor in the dependencies.** Unchanged,
   honestly documented, correctly filed as a maintainer question.
3. **Branch-scoped floor.** L4 (deleting the sole floor-bearing branch) plus the
   new L-B single-version assumption, plus "an unreadable branch contributes no
   floor" — now a deliberate, logged degradation rather than a startup crash.
4. **Local extension spelling unratified**, and stamped stores are already
   one-way if SPEC lands a different spelling.
5. **No live connector qualification.** Everything is synthetic over the real
   loopback transport.

## Fix directions (ordered)

1. M-A: exclude `channels.contextOnly` from `mcplPolicyGrants`' deny-by-default
   enumeration (it is a local storage path, already excluded from `uses`), or
   disclose it as a fourth delta and test `['channels.*']` on a modern server.
2. L-D: number the granted-incoming/profile-off per-item refusal in the delta
   list, and mention the masked-capability/operator-status addition.
3. L-A: one doc sentence that a `channels.*` pattern is already the per-server
   opt-in.
4. L-B: make an unsupported floor version on another branch refuse even when the
   current branch's floor is supported, or record the single-version assumption.
5. L-C: add one non-arrival row class to the corpus projection.
6. The still-open LOWs from round 1, in the order that report gave them.
