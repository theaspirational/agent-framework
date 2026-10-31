# Bounded delta review — TASK-S4Q8F AF-scope fix round 2

Range `39c76401f1be9191e5f62f66b497828d4f30fd56..c09aca307a6f08ad839e7cd592632d35fc899920`
(3 commits, 5 files, +104/-33). Report under review: `/srv/review-drop/TASK-S4Q8F-FIX2.md`,
sha256 `de809f5d2642b0cb87de27f0fa4c2009d5ee8a06d1e0d06243412b709667d3d9` — matches the brief, read
in full. Previous review `/srv/review-drop/TASK-S4Q8F-BATCHFIX-REVIEW.md` read in full. Includes
Soma's mid-review additions (msg-556eded5, msg-24b09e59) treating the receiver concern as material.

## Verdict

**APPROVE WITH ONE REQUIRED FOLLOW-UP (conditional).** The delta is merge-safe and strictly
stronger than `39c76401`: no reachable guard bypass exists on any shipped path, and all round-2
brief conditions are met. But the invariant Soma states as acceptance — *"an unsupported call must
refuse before effects, not silently fall back to the weaker original check"* — is **not satisfied
for the wrong-receiver shape**, proven on real objects with real effects. That is a **MEDIUM**, and
per Soma's instruction I am not treating the green suite as acceptance for it.

I did not reject, and I want the reasoning on record: rejecting would revert to `39c76401`, whose
helper used the very arrow-forwarder pattern my probe shows is unsafe and whose safety rested on a
comment. This commit removes that. The MEDIUM is a latent robustness gap in the *mechanism*, not a
defect in shipped behaviour, and the fix is small and additive.

Soma's four earlier conditions, each verified independently rather than read off the report:

1. **Outer + item checks compose BY CONSTRUCTION on the reachable path** — confirmed by my own
   probes and an independently reproduced mutant, not by a name or comment.
2. **Explicit resolved/unresolved verdict controls for the replacement** — both arms assert exact
   per-item verdicts on the real path.
3. **npm-ls resolution context kept and explained** — cwd/prefix, manifests, npm config/flags, named
   resolved entries, causal control; base/head hashes explicitly *not* asserted equal.
4. **Earlier failed evidence kept** — the first uncontrolled differential (cmp exit 1) and the
   development reconnect failure (18/16/1 fail/1 cancelled) preserved as failures, not relabelled.

Scope is exactly the five declared files; all three commits carry the required Vasyl
author/committer and the `GPT-6.1-Sol` co-author trailer.

## Findings

### MEDIUM — design/correctness (latent) — `src/mcpl/registration-view.ts:139-144`: a wrong receiver silently falls back to the weaker original check, admitting with effects

`forItem` composes whatever `this` happens to be. On every *shipped* path `this` carries the outer
guards, so the round-2 construction requirement is genuinely satisfied. But the guarantee is a
property of the call site, not of the mechanism: `this: RequiredIngress` is a receiver annotation,
not a constraint that the receiver *contains* the outer guard. When the receiver is wrong, the fork
is built from it anyway and the outer guard is replaced by a weaker check — silently, with no error
and no refusal.

Proven on real objects (real `RequiredAdmission.capture()` receipt, real `RegistrationScopes` view,
real `withReplyConsumer`, real framework-shape wrapper), outer guard **active**, both B off and B on
(`gate-reviewer-real-path-receiver-shapes`, `real-path-receiver-probe.parsed.json`):

| Receiver shape (outer guard active) | epoch provenance | `check()` | `admit()` | host A | published | refuses before effects |
| --- | --- | --- | --- | ---: | ---: | --- |
| `registrationAdmissionForItem(outer)` — production, channel-registry.ts:1889 | ok | `admission_not_ready` | refusal | 0 | 0 | **yes** |
| `outer.forItem()` direct, no helper | ok | `admission_not_ready` | refusal | 0 | 0 | **yes** |
| `({...outer}).forItem()` frozen spread copy | ok | `admission_not_ready` | refusal | 0 | 0 | **yes** |
| `outer.forItem().forItem()` nested fork | ok | `admission_not_ready` | refusal | 0 | 0 | **yes** |
| detached `const f = outer.forItem; f()` | ok | `TypeError` | `TypeError` | 0 | 0 | yes, but by throwing |
| missing `outer.forItem.call(undefined)` | ok | `TypeError` | `TypeError` | 0 | 0 | yes, but by throwing |
| **wrong `outer.forItem.call(realBareReceipt)`** | ok | **no refusal** | **`{store:true,mayWake:true,replyIntent:…}`** | **1** | 0 | **NO — violation** |

End-to-end on the real WebSocket → framework → ChannelRegistry path, with a wrapper whose own guard
is **active** for the whole batch (`phase1_real_path_forwarders`):

| Forwarder installed on `handleIncoming` | B | per-item results | host A | bodies in context | published |
| --- | --- | --- | ---: | --- | --- |
| `forItem: () => ingress.forItem()` — arrow, wrong receiver (**the pattern this commit replaced**) | off | both **accepted** | p1, p2 | p1, p2 | — |
| same | **on** | both **accepted** | p1, p2 | p1, p2 | **topic/one ×2** |
| `forItem(){ return ingress.forItem.call(this) }` — correct receiver (reply-admission.ts:32's pattern) | off | both `admission_not_ready` | none | none | none |
| same | on | both `admission_not_ready` | none | none | none |

Failure scenario: a future wrapper adds a guard and forwards the fork with an arrow — legal
TypeScript, type-checks against `this: RequiredIngress`, passes review as "it forwards forItem" —
and its guard is silently absent from every item fork. With B on, items the wrapper refused reach
the host, enter context, and **publish**. Substituting a receiver loses every layer above the base,
including the genuine `framework.ts:35199-35203` queue/connection guards.

Scope bounds, stated honestly: **not reachable today.** The only two call sites are the helper's
method call (`channel-registry.ts:1889`) and `reply-admission.ts:32`'s `.call(this)`, and the latter
is pinned by the implementer's "Lose calling receiver in B factory" mutant. The **item** guard and
**epoch provenance** survive every shape tested, including the violating one (`fork.key ===`
transport key in all 14 rows; the fork is still built by `withRegistrationScope` over the same
`view`, so per-item capture is intact) — only the *outer* guard is lost. That containment is why I
grade MEDIUM rather than HIGH: there is no shipped defect and no data loss. It is not LOW because
the violation is demonstrated with real effects including wake and publication, and because the
bypass direction is the silent one.

Fix direction (satisfies both of Soma's constraints — no new authority/wire subsystem, and
legitimate framework composition keeps working) is in **Fix Directions 1** below.

### LOW — clarity — `src/mcpl/registration-view.ts:143`: the `?? admission.check()` tail is unreachable as a fallback on the current path and double-evaluates the base predicate

`outer.check()` already chains to the base admission's `check` (framework override →
`original.check()` → parent scoped `check` → base `current()`), so the explicit tail never *adds* a
verdict today; it only re-runs the base predicate. Measured (`double-check-probe.json`): one
base-predicate evaluation per outer `check()`, **two** per fork `check()`. The predicate is pure
(`inbound-admission.ts:133-139` — epoch/binding/grant reads only), so there is no behavioural
defect, only a small per-item cost and a composition that reads as if it terminates in the base when
the receiver already does. It is real defence-in-depth against an outer wrapper that does not chain
— worth one comment saying so, so it is not later "cleaned up" into a genuine gap.

### LOW — test — carried from round 1, honestly disclosed: the per-item-epoch invariant is observable only through white-box fork instrumentation

The report's own LOW-3 paragraph states this precisely and does not upgrade it to a
production-observable claim: both old-epoch items still visibly refuse `admission_stale` with no
store or publication, because the retained outer stale guard independently blocks them, so the
per-item-epoch mutant is killed only by the test's fork-key association assertion
(`test/registration-batch-scope.test.ts:186` instrumentation). I agree with the classification and
with leaving it open.

## Round-1 findings: disposition

| Previous finding | Status |
| --- | --- |
| MEDIUM — test — no coverage for a non-removing mid-batch replacement | **resolved** (4 real-path tests, both arms, exact verdicts) |
| LOW — test — `same-registration-stale` shape cannot discriminate the fix | **resolved honestly** — shape renamed to name the §14.5 gate, exact reason string asserted, and the report explicitly declines to claim scope discrimination for m2 |
| LOW — design — `forItem` unsafe to call directly; safety rests on a comment | **resolved for the reachable path**; the residual is now the MEDIUM above, re-graded upward on Soma's materiality addition |
| LOW — test — per-item-epoch invariant only via monkeypatch | **open, disclosed** |
| LOW — docs — batch paragraph omits the replacement corollary | **resolved and accurate** |

## Verification Gates

### Run by me (independent reproduction; Node 22.23.3, worker's existing closure, no install)

- `orgasmic dispatch gate reviewer-outer-composition-mutant` — **exit 0**, receipt
  `gate-reviewer-outer-composition-mutant-01M682GJXE00R7N2HEYXK0QWPQ.log`.
  Mutant: `check: () => outer.check() ?? admission.check()` → `check: () => admission.check()` in
  the git-ignored build output `dist/src/mcpl/registration-view.js`. Result: producer **exit 1**,
  **99 tests / 98 pass / 1 fail / 0 cancelled / 0 skipped**, log 38,531 bytes (not at cap).
  **MUTANT KILLED** by
  `not ok 20 - direct per-item fork retains outer queue and connection checks before and after awaits, including B`.
  Build output byte-restored: before and after sha256
  `d8cf1500b7b09f5188ec449b4daf51285a75f034e0c604fa633bf718255e1e18` (`RESTORE=byte-identical`).
  Bounded `timeout --signal=TERM --kill-after=60s 900s`, focused files only.
  Script `outer-composition-mutant.sh`; TAP `mutant-drop-outer-composition-reviewer.tap`.
- `orgasmic dispatch gate reviewer-real-path-receiver-shapes` — **exit 0**, receipt
  `gate-reviewer-real-path-receiver-shapes-01M682X52H5RMYZWCZ5PR52DB2.log`, producer exit 0,
  log 9,110 bytes (not at cap), bounded 900 s. Both tables in the MEDIUM above.
  `INVARIANT_VIOLATIONS=2` (the wrong-receiver shape, B off and B on). Phase 1 is the real
  WebSocket → framework → ChannelRegistry path via the fixture with an interposer on
  `channelRegistry.handleIncoming`; phase 2 is direct calls on the genuine captured framework
  ingress, with a real bare `capture()` receipt as the substituted receiver. Script
  `real-path-receiver-probe.mjs`, wrapper `real-path-receiver-gate.sh`, parsed result
  `real-path-receiver-probe.parsed.json`, raw `real-path-receiver-probe.log`.
- `receiver-probe.json` (exit 0) — the same seven call shapes against the compiled modules with
  synthetic stubs; agrees with the real-object run. Also confirms opt-out identity directly:
  `registrationAdmissionForItem(raw) === raw` and `registrationAdmissionForItem(undefined) === undefined`.
- `single-consumption-probe.json` (exit 0) — three sequential item forks off one receipt:
  **3 consumptions for 3 items, exactly 1 per item**; each consumer input carries the original
  transport `connection` key, the correct lane, and `signal === transportSignal`. No second B
  consumption, no consumer/signal/diagnostic loss.
- `double-check-probe.json` (exit 0) — base-predicate evaluation counts backing the first LOW.
- Independent recomputation of the profile-off corpus: `profile-off-serialized-base.json` and
  `-head.json` are both 28,865 bytes with sha256
  `ddc883dd5bb2bf754135bc20fc1841cdc7f62238161e1c5ab84e04ab1e716ff6` — byte-identical, matching the
  report.
- Source reading, not inference: `framework.ts:35008/35082/35199` (all three lanes use the
  spread+override pattern, so `forItem` survives where present); `server-connection.ts:1169-1176`
  (per-request wrapper order `capture` → `withRegistrationScope` → `withReplyConsumer`);
  `inbound-admission.ts:133-160` — `capture()` returns a frozen literal whose `check`/`admit` are
  arrow closures, so the new `{...admission}` spread inside `forItem` loses **no** prototype method
  and **no** `this` binding. That was the main structural risk in this delta and it is clean;
  `channel-registry.ts:1886-1889` — `batchAdmission` is read **only** to make forks, the parent
  scoped wrapper's `admit` is never called on the batch path, so its mutable `captured` /
  `channelBearing` stay inert and the composed outer check cannot leak parent scope state across
  items; `registration-view.ts:75-80` — `current()` requires `record.ready`, which is exactly what
  makes the "pending" arm a readiness refusal.

### Reused receipts (read, not rerun; all at `c09aca30`, `clean=yes`)

| Gate | Exit | Counts | Truncation |
| --- | ---: | --- | --- |
| `construction-focused` | 0 | 99/99/0 fail/0 cancelled/0 skip | no |
| `construction-mutants` | 0 | 10 mutants, every child exit 1 | no |
| `construction-profile-off` | 0 | base/head/cmp 0/0/0, hash verified by me | no |
| `final-binding-metadata` | 0 | read-only consistency | no |
| `head-22.23.3` | 0 | typecheck/build/test 0/0/0, 9866/9803/0/0/63 | no |
| `head-22.12.0` | 0 | typecheck/build/test 0/0/0, 9866/9803/0/0/63 | no |

The two reused B receipts exist at their original locations
(`gate-fix-22.23.3-base-01M67V69RWMFMJPJCWCS5NJ654.log`,
`gate-fix-22.12.0-base-01M67XCYYEBRAJKWKAV6APD6PV.log`), and `final-integrity.json` reproduces the
report's npm-ls figures exactly: base exit **1** sha `974e3bcf…`, head exit **0** sha `3c34f424…`, on
both Nodes. The bindings table is honest on the point the brief flags: it states in terms that the
shared `.package-lock.json` identical inode/hash is **not** independent evidence, and that the
dependency inventory is the same physical install by construction rather than an independently
resolved install. No "same lock inode" is offered as independent evidence anywhere.

### Brief checklist

| # | Check | Outcome |
| --- | --- | --- |
| 1 | `forItem(this)` receiver capture; detached, wrong, missing, spread; can a direct call lose the outer guards | **Positives pass, one negative fails.** Helper / direct / frozen spread copy / nested fork all keep the full outer+item binding with correct epoch provenance. Detached and `.call(undefined)` refuse before effects but by throwing. `.call(otherIngress)` **bypasses the outer guard and admits with effects** → the MEDIUM. |
| 2 | `outer.check() ?? admission.check()` composition + scope check; no double/lost check; order; after `await` | Order is outer → base → own scope, before **and** after the await (`registration-view.ts:148-154`). No lost check on any reachable path. One redundant base-predicate evaluation → first LOW. |
| 3 | `withReplyConsumer` `.call(this)` preserves consumer/signal/diagnostic; no second B consumption | **Pass** — exactly 1 consumption per item, transport key/lane/signal intact; the parent reply wrapper is not in the fork's `admit` chain. |
| 4 | Replacement tests: ready → m2 accepted, host sees the NEW ref; pending → both stale, only m1 reaches A; real path | **Pass** — `test/registration-batch-scope.test.ts:70-103`, real loopback WebSocket → framework → ChannelRegistry via `fixture()`. Ready: `[['m1',false,'admission_stale'],['m2',true,undefined]]`, `x.refs == [oldRef, replacementRef]` with `notEqual(replacementRef, oldRef)`. Pending: both `admission_stale`, `x.calls == ['m1']`, no body in context, no publication, no membrane call, and the replacement settles afterwards. |
| 5 | Exact reasons per shape; same-registration honestly attributed to §14.5 | **Pass** — `deepEqual` on `[messageId, accepted, reason]` triples including `undefined` for accepted items; the same-registration shape asserts the literal `unknown channel "topic/one" — register it first (§14.5)`, and both the shape name and the report decline to claim scope discrimination. |
| 6 | Profile-off identity (`undefined → undefined`, serialized corpus) | **Pass** — identity proven directly on real objects; corpus hash independently recomputed, byte-identical. |
| 7 | Docs corollary accurate | **Pass** — `docs/registration-scope-view.md:74-75` matches tested behaviour; "only once its scope is ready" is exactly `current()`'s `record.ready` requirement, and "refused before host admission" matches `x.calls == ['m1']`. |
| 8 | Base-reuse bindings table honest | **Pass** — see above. |

## Unmet criteria / test gaps

- **Unmet (Soma's materiality addition):** "an unsupported call must refuse before effects, not
  silently fall back to the weaker original check" — unmet for the wrong-receiver shape (MEDIUM).
  Met for detached and missing receivers only in the effect-safety sense: no A, no B, no store/wake,
  but via `TypeError` rather than a refusal code.
- No test pins the receiver requirement for *future* forwarders. The existing B forwarder is
  mutant-guarded; a newly added wrapper would not be. The negative shapes (detached / wrong /
  missing) have no coverage at all — my probe is the only evidence, and it lives in review evidence,
  not the suite.
- The per-item-epoch invariant for items that never reach A is observable only through test-only
  fork instrumentation (LOW, carried).
- `view === undefined` with registrations configured refuses every channel-bearing item
  (`admission_stale`). Fail-closed and pre-existing — outside this delta, noted only so it is not
  mistaken for a new path.

## Residual risk

- The by-construction guarantee is a call-site property, not a mechanism property. Today's blast
  radius is nil (no such call site); after any future wrapper is added it is one connection's batch,
  silently admitted past that wrapper's guard, with wake and publication. This is the one risk I
  would not leave unaddressed past the next round.
- Baseline dependencies are shared through a symlink by construction, not independently resolved;
  npm-ls base exit 1 is explained, not repaired, and is correctly not counted as a passing graph
  check. No repository lockfile exists. This stays an explained limitation, not a pass.
- Finite invented-ID tests and a logical corpus do not prove native truth, every concurrent
  schedule, or physical store-file equality. T2–T5, native host and send-time qualification remain
  outside this change.
- The historical `47f3b4f2` 22.23.3 head cell has no dispatch-gate receipt; nothing in this round
  reuses or fabricates it, and I did not rely on it.

## Fix Directions

1. **(MEDIUM, required) Take the outer admission as an explicit parameter instead of the receiver.**
   `forItem(outer: RequiredIngress)` at `registration-view.ts:139`; the helper passes what it was
   handed (`admission.forItem(admission)`), and `reply-admission.ts:32` forwards its parameter
   (`forItem(outer){ return withReplyConsumer(admission.forItem!(outer), consume, …) }`). Then `this`
   stops mattering entirely, so detachment and `.call(x)` cease to be failure modes, and a forwarder
   that forgets to pass the outer is a **compile error** rather than a silent downgrade. Pair it with
   a fail-closed runtime arm: if `outer` is absent or not a usable ingress, compose
   `() => 'admission_missing'` instead of calling it — turning today's `TypeError` into a refusal
   before effects. This preserves every legitimate composition the probe exercises as a POSITIVE
   (the framework spread wrapper, `withReplyConsumer`, frozen copies, nested forks all pass the
   outer through the helper or the parameter) and adds **no new authority or wire subsystem** — only
   an existing `RefusalCode`. Note the honest residual: a caller can still pass a deliberately
   weaker object. That is undecidable in general; the point of the change is to make it an explicit,
   reviewable argument rather than an invisible receiver default.
2. **(MEDIUM, required) Pin the negatives in the suite,** not just the positives: one test per
   receiver shape (detached, wrong, missing) asserting refuse-before-effects — no host admit, no B
   consumption, no `store`/`mayWake` — alongside the existing positive direct-call test, plus a
   mutant that reintroduces the arrow forwarder. My phase-1 interposer harness is a working template
   and can be lifted directly from `real-path-receiver-probe.mjs`.
3. **(LOW)** Add one comment at `registration-view.ts:143` stating that `?? admission.check()` is
   defence-in-depth for an outer wrapper that does not itself chain to the base.
4. Leave the carried LOW-3 open as written. No change is warranted to buy production observability
   for items that never reach A.

## Worktree state

Left exactly as found: `git status --porcelain` empty, HEAD `c09aca30`, no commits, no edits to
tracked files, no new files in the tree. The only file I touched is the git-ignored
`dist/src/mcpl/registration-view.js`, byte-restored and verified by sha256. Evidence totals ~140 KiB;
largest log 38,531 bytes, far under the 64 MiB cap. Disk unchanged at 97% / 25 G available. No
surviving processes were created outside the two bounded gates, and neither hit its deadline.
