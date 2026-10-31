# Review — TASK-S4Q8F fix round 3 (bounded delta)

Range `c09aca307a6f08ad839e7cd592632d35fc899920..29b5ebf33ca5d785564cdd85c4609543d8202d57`
(`b7a3bb73`, `29b5ebf3`; 9 files +253/-28). Worktree detached at `29b5ebf3`, clean before and
after; `dist/src/mcpl/registration-ingress.js` / `dist/src/framework.js` restored byte-for-byte
(`4354ca7e…` / `5aab678b…`, verified in `rev-mutants.log`). Implementer report read in full
(`/srv/review-drop/TASK-S4Q8F-FIX3.md`, sha256 `bd30d1fd…` — matches brief). Previous review
`9572aac4…` and its real-path receiver probe (`run-01M68270P7KBBXT53D6M7VG0QQ`) read.
Constraints/answers here come from the task operator (Tarn) and programme qualifier (Soma);
they are not the owner's decisions.

## Verdict

**APPROVE.** No HIGH or MEDIUM. The fix-2 MEDIUM ("a wrong/weaker receiver drops the outer guard
with effects") is **closed by enforcement, not by visibility**: the enforcement is the internal
WeakMap-issued outer context, and I reproduced the exact prior counterexample and the arrow
forwarder on the real path — both refuse `admission_missing` with zero effects, while every
supported wrapper/copy still both **allows** and **denies** correctly. Three LOWs below, all
non-reachable on the production path. LOW-3 (white-box-only epoch provenance) stays open and is
*not* counted as fixed, as instructed.

## Findings

### LOW (correctness/design) `src/mcpl/registration-ingress.ts:42-45`
A hypothetical future wrapper that adds its **own** guard and forwards with an unregistered arrow
(`forItem: () => composed.forItem(composed)`) silently loses *its own* guard if it calls its own
`forItem` directly: the returned fork carries `composed`'s full chain but not the wrapper's
predicate. Probe `probe3-run.log`: `viaDirect_check="(none)"`, verdict `store`, host A +1, while
the production call shape `registrationAdmissionForItem(wrapper)` on the same object refuses
(`viaHelper_check="admission_missing"`, 0 effects). The invariant actually enforced is "a fork is
never weaker than the issued context it names", not "a fork contains every guard of its caller".
Not reachable in-tree (all four fork sites — the three framework composers and the B wrapper — go
through `composeRegistrationIngress`/`issueRegistrationIngress`). Fix direction: no code change
needed now; make the doc paragraph (`docs/registration-scope-view.md:84-95`) say explicitly that a
wrapper adding a guard MUST issue through the composer, since forwarding does not carry its guard.

### LOW (correctness) `src/mcpl/registration-ingress.ts:23-26`
`missing()` returns a refusal ingress with **no** `forItem`, so a direct `fork.forItem(x)` on a
refusal object throws `TypeError` instead of refusing. The production path is safe — the helper
re-refuses (`probe3-run.log`: `refusal_via_helper="admission_missing"`), and `registrationItemFork`
catches the no-factory case via `protectedKeys`. It surfaced in my first probe run as
`TypeError: a.forItem is not a function` (`probe-run.log`, "nested fork" rows). Fix direction:
give `missing()` a self-returning `forItem`, so refusal is uniform under every call shape.

### LOW (correctness) `src/mcpl/registration-ingress.ts:52-56` + `src/framework.ts:35010/35084/35201`
On the *unreachable* defence-in-depth path where `admissionFor` falls back to a bare
`capture(() => 'admission_missing')` (`src/mcpl/server-connection.ts:494-496`) on an
already-protected key, the composer's fail-closed arm now returns `admission_missing` where c09
would have returned `admission_not_ready` first if the queue was closed. Both are refusals with no
effects, and `server-connection.ts:1156-1162` refuses before the handler is ever reached, so this
is not reachable in practice — but it is a verdict-code delta on the protected profile. Fix
direction: none required; note it if the refusal code of that arm is ever asserted.

## Verification Gates

Reused receipts (read, not re-run — all at `29b5ebf3`, clean, exit 0):
`r3-22.23.3-head` and `r3-22.12.0-head` (fresh head cells, **9914/9851/0 fail/0 cancelled/63 skip**
on both Nodes, 0 `not ok` lines, log bytes under cap, producer/capture 0/0); `r3-focused`
(217/217); `r3-mutants` (19/19 killed, each child exit 1 / 1 test / 0 pass / 1 fail with its exact
named test); `r3-profile-off-configured`; `r3-raw-arrow` (2/2); `r3-final-metadata`.
Reused-B binding honesty checked independently: `full-22.23.3-base.log` = `cc136e40…` and
`full-22.12.0-base.log` = `18e2e92d…` match `reused-base-cells.json`; both base receipts exist;
`node_modules/.package-lock.json` = `034f9872…` as claimed; base trees are the symlinked
`.matched-base` against the same physical install (shared bytes by construction, *not* independent
resolution — correctly labelled by the implementer, and the npm-ls exit-1/exit-0 asymmetry stays
explicitly unexplained-by-reinstall).

My own gates (all `orgasmic dispatch gate`, systemd scope, `MemoryMax=16G`, `timeout 3000s`-class
bounds, no installs):

| Gate | Exit | What it proves | Artifact |
| --- | ---: | --- | --- |
| `rev-r3-probe` | 0 | Brief (1): real `WebSocket→framework→ChannelRegistry` path, B off/on | `probe-run.log` |
| `rev-r3-probe2` | 0 | Brief (2): supported composition allow **and** deny, ancestor/mutation negatives | `probe2-run.log` |
| `rev-r3-probe3` | 0 | Residual forwarder shape + WeakRef/`--expose-gc` lifetime | `probe3-run.log` |
| `rev-r3-mutants` | 0 | Independent reproduction of 4 required mutants; dist restored | `rev-mutants.log` |

**(1) Soma's key condition — the same counterexample, real path, before effects.** End-to-end, two
items per batch, B off and on (`probe-run.log`):

| Real-path case | B | Per-item results | host A / B consumed / stored / published |
| --- | --- | --- | --- |
| POSITIVE baseline (no interposition) | off | both `accepted` | 2 / 0 / 2 / 0 |
| POSITIVE baseline (no interposition) | on | both `accepted` | 2 / 2 / 2 / 2 |
| arrow forwarder `forItem: () => inner.forItem()` | off/on | both `admission_missing` | 0 / 0 / 0 / 0 |
| real bare `capture()` receipt as the batch ingress | off/on | both `admission_missing` | 0 / 0 / 0 / 0 |
| issued fork asked with the real bare `capture()` receipt as the **explicit outer** | off/on | both `admission_missing` | 0 / 0 / 0 / 0 |

Refusal is before effects in every negative case, and the positive baseline still works, so this is
not a blanket refusal.

**(2) Supported wrappers/copies — both allow and deny.** `probe2-run.log`, built on the genuine
issued framework ingress captured off the live lane, composed through the same internal composer
the three framework wrappers call, 14 shapes × {allow, queue-closed, foreign-connection} × B
off/on = 84 rows. Every fork's `key` is the frozen transport key (`key=true` on all rows).

| Shape | allow | queue deny | foreign deny |
| --- | --- | --- | --- |
| `helper(composed)` | accepted, A=1 (B=1 when on) | `admission_not_ready`, 0 effects | `admission_stale`, 0 effects |
| `composed.forItem(composed)` | accepted | `admission_not_ready` | `admission_stale` |
| detached `const f = composed.forItem; f(composed)` | accepted | `admission_not_ready` | `admission_stale` |
| wrong receiver `.call(bareReceipt, composed)` | accepted | `admission_not_ready` | `admission_stale` |
| frozen spread copy | accepted | `admission_not_ready` | `admission_stale` |
| non-frozen function-preserving copy | accepted | `admission_not_ready` | `admission_stale` |
| nested fork | accepted | `admission_not_ready` | `admission_stale` |
| double-composed wrapper | accepted | `admission_not_ready` | `admission_stale` |
| **issued ANCESTOR as explicit outer** | `admission_missing` | `admission_missing` | `admission_missing` |
| **bare `capture()` as explicit outer** | `admission_missing` | `admission_missing` | `admission_missing` |
| **no argument** | `admission_missing` | `admission_missing` | `admission_missing` |
| **check-override copy** | `admission_missing` | `admission_missing` | `admission_missing` |
| **mutation after fork creation** | `admission_missing` | `admission_missing` | `admission_missing` |

All refusals: host A 0, B consumption 0, publication 0.

The "detached / wrong receiver **with** explicit outer → accepted" rows in the implementer's table
are **correct and not a weakening**: `forItem` is now a closure that ignores `this`, and the
accepted argument is the issued full chain itself, so the fork is identical to the supported call.
I confirmed the mechanism by reading `registration-ingress.ts:16-22, 42-48`: validity requires the
argument to carry an issued `forItem` **and** the exact `key`/`check`/`admit` triple recorded at
issuance, and `descends()` requires it to be a *descendant* of the issuing context — so the only
degree of freedom is a chain that is equal or stronger. Note my first probe's `[POS]` labels in
`probe-run.log` phase 2 were mis-specified (my hand-made `{...real, check: …}` was an *unissued*
override, which correctly refused); `probe2-run.log` is the corrected, supported-composition run.

**(3) Lifetime-safe bookkeeping.** Structural: the only module-level state is
`registration-ingress.ts:13` `contexts = new WeakMap<forItem, Context>()` and `:14`
`protectedKeys = new WeakSet<ConnectionKey>()`. No strong per-item collection exists anywhere in
the file; references run descendant→ancestor only, never the reverse. Empirical (`probe3-run.log`,
`--expose-gc`): fork, nested fork and the item factory function were all collected
(`collected=[true,true,true]`) while the root stayed usable. Issued-ancestor ≠ substitute
(confirmed above). Identity mutation after issuance of `check`/`admit`/`key` → `admission_missing`
(confirmed above; `registrationOuterCheck` re-validates at every use, `:61-63`). The context holds
only `key`/`check`/`admit`/`fullCheck`/`parent`, all derived from the existing ingress — no
permission, scope, grant or persistent identity is minted, and `missing()` only refuses.

**(4) `framework.ts` :35010-35015 / :35084-35089 / :35201-35206.** Diff shows the queue/render/
connection/`original.check()` predicates kept verbatim; only the enclosing object literal is now
the composer's second argument. Order and refusal codes unchanged, and my probe2 deny rows confirm
queue→`admission_not_ready` and foreign→`admission_stale` in that order. `grep` finds exactly three
`RequiredIngress` spread wrappers in `framework.ts` and all three are bound — no unbound spread
remains. Off-profile the composer returns the *same* outer object unchanged
(`registration-ingress.ts:53`), and the profile-off differential is byte-identical: I recomputed
both serialized corpora myself — `ddc883dd5bb2bf754135bc20fc1841cdc7f62238161e1c5ab84e04ab1e716ff6`
on base and head, 28865 bytes each.

**(5) Public API reachability (actual exports / built `.d.ts`).**
`package.json` exports only `"."`. `git diff c09..r3 -- src/index.ts` is **empty**;
`git diff 29edcf8b..r3 -- src/index.ts` adds exactly one line (the `registration-view` type
re-export — part of delta **A**, pre-r3). Delta **B** (c09→r3) in the built declarations is only
`dist/src/mcpl/inbound-admission.d.ts:75`: `forItem?: (this: RequiredIngress) => RequiredIngress`
→ `forItem?: (outer: RequiredIngress) => RequiredIngress` plus its comment — exactly the approved
signature change, still an optional member of `RequiredIngress`, no other reachable export/type
delta (the rest of the r3 source diff touches only function bodies and a new non-exported module).
`dist/src/mcpl/registration-ingress.d.ts` exists but is referenced by **no other emitted `.d.ts`**
(`grep -rl registration-ingress dist/src --include=*.d.ts` → itself only), so it is unreachable
from the declaration closure; the deep import is refused:
`ERR_PACKAGE_PATH_NOT_EXPORTED` for `@animalabs/agent-framework/dist/src/mcpl/registration-ingress.js`.
The implementer's A-delta patch is a claim I did not rebuild B to re-emit (see Residual Risk).

**(6) Mutants — independent reproduction.** `rev-mutants.log`: I applied the four required mutants
to the compiled output myself, and each one (a) failed its exact named test with
`exit 1, 1 test / 0 pass / 1 fail` and (b) **changed my own independent `probe2` rows**, which is
stronger evidence than the committed test alone:

| Mutant | Named test | My probe2 rows changed |
| --- | ---: | ---: |
| `identity-validation` | fail 1/1 | 12 |
| `unissued-outer-structural-fallback` | fail 1/1 | 30 |
| `blanket-refusal` | fail 1/1 | 54 |
| `framework-binding-channels-incoming` | fail 1/1 | 84 |

`blanket-refusal` changing 54 of my allow rows is the direct proof that a blanket-refuse fix could
not have passed. `dist` SHAs identical before/after (`restored_byte_for_byte: true`). The other 15
mutants, including `framework-binding-push-event` and `framework-binding-inference-request`, come
from the reused `r3-mutants` receipt, which I read rather than re-ran.

**(7) Reused B cells / fresh head cells.** As above: bindings are honest and correctly qualified
(shared physical install, labelled as such, not presented as independent resolution); fresh head
cells 9914/9851/0/63 on both Nodes with receipts present; the reused base cells 9767/9704/0/63 with
receipts present and log hashes matching the manifest.

## Unmet Criteria / test gaps

- **LOW-3 remains open** (not fixed, as instructed): the `per-item-epoch` mutant is discriminated
  only by white-box fork/key association; the implementer states this plainly and makes no
  production-observability claim. Still a gap: there is no black-box assertion that distinguishes
  "epoch captured once for the batch" from "re-read per item" for items that never reach A.
- I did not independently re-emit B's `.d.ts` to re-derive delta **A**; I verified it at source
  level (`src/index.ts` export diff) and verified delta **B** against the built output. Delta A's
  exact declaration text rests on the implementer's `declarations-B-to-c09.patch`.
- The two non-`channels/incoming` framework-binding mutants and 13 others are reused receipts, not
  reproduced by me.
- No test asserts the LOW-1 forwarder residual or the LOW-2 `TypeError`-on-refusal shape.

## Residual Risk

- The guarantee is scoped to the supported composition boundary: code that can replace trusted
  constructors or framework internals is out of contract. The implementer says this explicitly and
  does not overclaim — this is not a JavaScript sandbox, and I agree that is the right boundary.
- `protectedKeys` is process-global and grows one weak entry per protected transport key; weak, so
  released with the epoch, but a key once protected makes every non-issued ingress on it fail
  closed (the LOW-3rd finding above is the only behavioural consequence I found).
- Dependency bytes are shared by construction between base and head; the npm-ls exit-1/exit-0
  asymmetry is documented and not repaired by reinstall (correct handling), and remains an
  unresolved-by-explanation diagnostic rather than a pass.
- Finite invented-ID fixtures and a serialized logical corpus do not prove every schedule, physical
  store-file equality, or host/native-tool behaviour. The first failed differential and the
  development failures remain retained as failures.
- The missing dispatch receipt for the historical `47f3b4f2` 22.23.3 cell remains missing (not in
  this delta's scope).

## Fix Directions

1. (LOW-1) Tighten `docs/registration-scope-view.md:84-95`: a wrapper that adds a guard must issue
   through the composer; forwarding to an issued fork does not carry the forwarder's own predicate.
2. (LOW-2) Give `missing()` a self-returning `forItem` so refusal is uniform under any call shape
   instead of throwing `TypeError` on a direct nested fork.
3. (LOW-3rd) Optional: in the composer's fail-closed arm, keep the outer predicate's refusal code
   when it fires before the missing-context condition, if that arm's code is ever asserted.
4. LOW-3 observability and host/native integration qualification remain separate scoped work.
