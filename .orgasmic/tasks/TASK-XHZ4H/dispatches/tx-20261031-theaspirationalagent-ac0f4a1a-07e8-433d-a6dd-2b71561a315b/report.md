# TASK-XHZ4H — bounded delta review, D fix round 2 (fork-seed witness enforcement)

Range `93932bae02b35584530840a5683abc7376baac6e..b612e8664c89c4f61c5c4ad69def914deb9889b4`
(5 commits, 3 files, +40/-4). Reviewed report `/srv/review-drop/TASK-XHZ4H-HASHFIX2.md`,
sha256 `d88de833ec96c091befe4ece0f3fa3d4b97795be4aa7d4e30960b70fca81a4ab` — verified and read
in full. Prior review `/srv/review-drop/TASK-XHZ4H-HASHFIX-REVIEW.md` read in full.

Attribution as recorded in the brief: the marker design is the engineering call of task
operator **Tarn** (ask-758e21c5) under programme qualifier **Soma**'s condition. These are
**not** decisions or consent by the human owner **Vasyl**. I judge them on their merits only.

## Verdict

**APPROVE** — 0 HIGH, 1 MEDIUM, 2 LOW.

Both MEDIUMs from the previous review are closed, and I reproduced the closures myself on the
frozen 0.24.2 closure: the brief's **real fork-before-hash reorder mutant is now killed**
(exit 1, `not ok 2`) and the **evidence-deletion mutant is killed** (exit 1, 0/2 pass), with
pristine 2/2 green. Soma's condition is satisfied **as literally specified**: the marker is
emitted inside the mocked `stripUnpairedToolBlocks` on the first real invocation, the real
reorder mutant was kept (not swapped for a print-order mutant), and on changed bytes the guard
refuses with the normalization counter at 0. No `src/`, dependency, lockfile or installed-package
change; no publication action. The one MEDIUM is a boundary-definition gap I reproduced, not a
product defect, and it does not contradict the condition as written — which is why it does not
block.

## Findings

### MEDIUM — test: the observable refusal boundary is the first *normalization*, not the first real fork work; a guard placed after framework creation and both stamped store writes survives

`test/fixtures/context-only-fork-seed-child.mjs:28-31,42-43,48-51`,
`test/context-only-delivery.test.ts:490-500`.

The only two observables that bound "before any real work" are (a) `stdout` being exactly the
evidence line and (b) `FORK_SEED_REFUSAL_NORMALIZATIONS 0`. Both are keyed to the mocked
`stripUnpairedToolBlocks` counter, which is first incremented inside
`framework.createConversationAgent(...)` (fixture:75). Everything before that call —
`AgentFramework.create` with `contextOnlyStorage: true` (fixture:63-68, real Chronicle store
open) and both `source.addMessage(...)` writes including the `mode: 'context-only'` stamp
(fixture:70-73) — is real dependency and store work that leaves **no** observable trace in
either assertion.

Failure scenario, **reproduced** (mutant `rvearly`, diff `rv-mutant-rvearly.diff`): move only the
hash guard from fixture:42-43 to immediately before fixture:75 — i.e. after framework creation,
store open and both stamped `addMessage` calls, still before the first normalization. Result on
Node 22.23.3, frozen closure: **both focused tests pass, 2 total / 2 pass / 0 fail, exit 0**
(gate `rv-mutants-23`).

Direct changed-byte observation of the same mutant (gates `rv-observe-early-23b`,
`rv-durability-23`):

| child | exit | stdout lines | framework created? | `FORK_SEED_REFUSAL_NORMALIZATIONS` | mismatch msg |
|---|---:|---:|---|---:|---|
| pristine `b612e866` | 1 | 1 (evidence only) | **no** (0 diagnostics) | 0 | yes |
| `rvearly` | 1 | 1 (evidence only) | **yes** (framework diagnostic emitted) | 0 | yes |

So every assertion in `changed normalizer bytes fail the fork-seed precondition loudly` holds
identically for both, yet the mutant reached the guard at `…child.rvearly.mjs:74` (stack frame
captured in `rv-early-rvearly.stderr:15`) *after* running the framework on changed-byte reads.
With the temp store preserved (`rv-durability.*`), that run **persisted a `context-only` stamped
row into the real store** before refusing:
`/tmp/rv-early-store-*/store/records.log` matches `grep -ao 'context-only'`.

Impact is bounded and is why this is MEDIUM, not HIGH: production's guard is cardinality-based
and version-independent (`src/framework.ts:17871`, which throws *before* the `addMessage` loop at
17875-17880), so no production path regresses. The fixture's hash assert is a **re-audit
tripwire**, and this finding is that the tripwire's position is only pinned down to "before the
first normalization" — a later edit could let changed-byte runs open stores and write stamped
rows with a fully green suite, quietly weakening exactly the property Soma asked to be made
observable.

Fix direction (one of): (1) include a second counter in the refusal line — wrap
`ContextManager.open` (or `addMessage`) in the same `mock.module` namedExports and print both
counts, so an early-reorder mutant prints a nonzero value; or (2) move the hash guard **above**
the evidence `console.log` and assert in the mismatch test that no store directory was created;
or (3) assert positionally that the guard is the first statement after the evidence emission.
Option (1) is the smallest change and keeps the existing assertion shape.

### LOW — test: the marker's kill chain is entirely test-internal and reads as tautological; both of its load-bearing parts are undocumented

`test/fixtures/context-only-fork-seed-child.mjs:36-41,50-51`.

Tarn's observation is worth answering precisely: `assert(witnessStarted, …)` at fixture:51,
sitting directly under `if (normalizations === 1) console.log('FORK_SEED_WITNESS_STARTED')`, can
never fail in pristine code — but it is **load-bearing, not decorative**, and the `console.log`
monkeypatch **is** required. I proved both by mutation (gate `rv-mutants2-23`, diffs
`rv-mutant-rvnoassert.diff`, `rv-mutant-rvdirectflag.diff`):

| probe | mutation | result |
|---|---|---|
| `rvnoassert` | marker moved below the witness work **and** fixture:51 deleted | **survives**, 2/2 pass, exit 0 |
| `rvdirectflag` | monkeypatch replaced by a direct `witnessStarted = true`, marker moved below the witness work | **survives**, 2/2 pass, exit 0 |

Interpretation: the parent test's stdout-order assertions cannot distinguish "marker emitted at
the real normalizer entry" from "marker emitted at the very end, just before
`FORK_SEED_ALIGNMENT_OK`". The in-wrapper assert is the *only* thing that pins the marker to the
normalizer entry, and the monkeypatch is what couples the flag to an actual stdout emission
rather than to a bare assignment. Remove either and the shipped `marker-move` mutant goes back to
surviving. A routine "this assert is trivially true" / "why patch console.log?" cleanup would
therefore silently undo this round's work with a green suite.

Fix direction: one comment at fixture:36 and fixture:51 recording that the flag is deliberately
set only via the intercepted emission, and that fixture:51 exists to kill a marker moved out of
the normalizer. No behaviour change.

### LOW — docs: stale `0.24.1` label on the production comment (carried forward, correctly deferred)

`src/framework.ts:17867` still reads "context-manager 0.24.1 preserves cardinality" while the
qualified resolution is **0.24.2**. Cosmetic only — the quoted normalizer SHA-256
`dcfff6de…701a` is the same for both versions, and the guard itself is version-independent. This
is LOW 3 of the previous review, which explicitly scheduled it for a follow-up round and
forbade any `src/` diff here; the implementer deferred it exactly as instructed
(report line 18, and the diffstat confirms zero `src/` change). No action in this round.

## Answers to the brief's numbered checks

1. **Is the first `normalizations++` the first real fork work?** No. Framework creation, store
   open and both stamped `addMessage` writes precede it, and a reorder mutant can run all of them
   on changed bytes while both tests stay green — reproduced and persisted to disk. See the
   MEDIUM above. Soma's condition as literally worded ("marker/normalization counter = 0") *is*
   met; the gap is that the counter is the only boundary observable.
2. **Is `assert(witnessStarted, …)` load-bearing, and is the monkeypatch needed?** Load-bearing,
   and yes. Proven by two surviving probes (`rvnoassert`, `rvdirectflag`); see the first LOW. It
   is however purely test-internal self-consistency and carries no production guarantee.
3. **Does `uncaughtExceptionMonitor` → `FORK_SEED_REFUSAL_NORMALIZATIONS N` correctly prove 0
   invocations under refusal; can it fail to fire; does it print on any exit path?** It works and
   is fail-closed, with three observations (gates `rv-observe-early-23b`, `rv-monitor-23`):
   - It **does** fire for the ESM top-level `assert.equal` throw on Node 22.23.3, printing
     before Node's fatal dump (`rv-early-test.stderr`, and the implementer's `refusal-23.stderr`).
   - It does **not** print on the successful path: 0 occurrences in the pristine matching-bytes
     child's stderr, which exits 0. It is not an unconditional "prints on any exit" line.
   - It cannot silently pass if the monitor never fires: I replaced the throw with an equally
     loud `console.error(<same message>) + process.exit(1)` refusal (`rvexit`). stdout, exit
     status and the mismatch-message assertion all still hold, and the test correctly **fails**
     (`not ok 1`, 1 fail) because the counter line is absent.
   Two caveats, both minor: the handler reports the counter at *exception* time rather than at
   refusal time (identical in pristine code), and it proves zero *normalizer* invocations only —
   not zero dependency work (the MEDIUM).
4. **What does the marker-move mutant do, and does it kill a meaningful property?** Per
   `invocation-mutant-marker-move.diff` it replaces the in-normalizer emission with `void 0;`
   and re-emits the marker one line above `FORK_SEED_ALIGNMENT_OK`. It is killed **solely** by
   the in-wrapper `assert(witnessStarted, …)` — the parent test's ordering assertions are fully
   satisfied by the mutant's late marker (confirmed: delete only that assert and the identical
   mutation survives 2/2). So it does test a real property — "the marker is emitted at the real
   normalizer entry, not somewhere convenient" — but the property and its killer are both inside
   the fixture, so the mutant certifies the witness's own honesty, not product behaviour. As
   Tarn required, it is an addition and not a substitute: the real fork-before-hash reorder was
   kept and is killed independently, by the exact-stdout assertion in the mismatch test (the
   marker reaches stdout once the guard moves past the normalizer). Minor precision note:
   `assert(start > output.indexOf(evidenceLine))` at `test/context-only-delivery.test.ts:498`
   compares against the evidence line's *start* index, which is always 0, so it reads stronger
   than it checks; it still catches a wholly absent marker (`start === -1`).
5. **Reproduction (my own, Node 22.23.3 only, frozen closure, focused tests, no npm install):**

   | mutant | source | expectation | observed |
   |---|---|---|---|
   | pristine `b612e866` | — | 2/2 pass | **2 total / 2 pass / 0 fail**, exit 0 |
   | `rvreorder` (= brief's real fork-before-hash reorder, guard after all fork work) | mine, matches `invocation-mutant-reorder.diff` | killed | **exit 1**, `not ok 2 - changed normalizer bytes fail…`, 2/1/1 |
   | `rvnoevidence` (evidence `console.log` deleted) | mine, matches `invocation-mutant-no-evidence.diff` | killed | **exit 1**, `not ok 1` + `not ok 2`, 2/0/2 |
   | `rvearly` (guard after framework creation + stamped writes) | **mine, new** | — | **survives**, 2/2 pass, exit 0 |
   | `rvnoassert`, `rvdirectflag`, `rvexit` | mine, new | — | see checks 2 and 3 |

   Both of the brief's mandated mutants reproduce the implementer's claimed kills. The
   implementer's own retained first-try survivor record (report line 29, `mutants-initial/`) is
   consistent with the prior review and is not hidden.
6. **Docs and PR body.** Correct. `docs/context-only-delivery.md:154-155` states the
   context-manager file:line references "were collected at **0.24.1** and have not been
   re-audited against **0.24.2**" — it is *not* presented as re-confirmed, and `grep -n '0\.24\.'`
   over the file shows no competing claim (only the audited-at-0.24.1 label at :146). The PR
   body repeats it verbatim under Qualification (report line 176). The watchdog sentence
   (report line 183) is accurate and correctly scoped: it says the zero-fail figures are
   environment-bound and that a separate, **unresolved** two-test liveness-watchdog divergence in
   the task operator's environment is tracked separately — it does not relabel it env-only or
   claim a root cause, matching Tarn's 23:01 and 01:46 records, which named exactly that pair
   plus the now-fixed fork-seed version pin. This closes LOW 4 of the previous review.
7. **Base-reuse bindings table — honest.** I re-verified `base-reuse-proof.py` independently:
   `data/fixture-closure` is at `b6e225e07a8214894c3f721dfb14ac0c1cf75714` and clean; both
   `run-cell.sh` **and** `capture-cell.sh` are byte-identical to the source run's
   (`cmp` → identical, so the same `AF_TEST_CONCURRENCY=8` export, the same `unset NODE_OPTIONS`
   and the same capture/timeout wrapper); the closure manifest is
   `dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01` for the current closure,
   the final closure, **and** the source run's frozen manifest; `node_modules` of both checkouts
   resolve context-manager **0.24.2**. The proof script re-hashes both Node binaries live and
   re-reads `--version`, asserts the recorded `head=` in the old logs, and asserts
   `producer_exit == npm_test_exit == 1 and not inconclusive` — i.e. the rows are explicitly
   labelled "reused failed-base observation, not a passing receipt", with source paths. Counts
   reconcile: base 9623+1+63 = 9687, head 9625+0+63 = 9688, and the +1 test / +2 passes are
   exactly `93932bae`'s new mismatch test plus the previously failing version-pin test. The one
   honest limitation, already visible in the JSON's own wording, is that concurrency and
   `NODE_OPTIONS` are bound by **runner byte-equality**, not by a captured environment snapshot
   of the old run; since the runner itself exports one and unsets the other, that is sound. No
   finding.

   Range hygiene (not a gate, noted for Soma's pre-publication guard): `git log -p` over the
   range and a `git grep` across the range's blobs for `/srv`, `review-drop`, `run-01M` and
   `.orgasmic/runs` return nothing, so these 5 commits carry no private paths. The report's own
   `[redacted]` of the source evidence root (line 89) is consistent with that guard. The full
   publication scan over the whole branch remains the publication step's job, not this delta's.

## Verification Gates

All gates run via `orgasmic dispatch gate`, from the frozen detached checkout
`data/enforcement-final-head` at `b612e866` (clean; `node_modules` → `data/fixture-closure`,
context-manager **0.24.2**). **No `npm install` ran.** Single Node
`/opt/node-v22.23.3-linux-x64/bin/node` (sha256 `fde6a4bf…48`, v22.23.3) as instructed. Every
child wrapped in `timeout --signal=TERM --kill-after=60s 600s`. Focused tests only
(`--test-name-pattern='fork seed normalization preserves alignment|changed normalizer bytes fail'`).

| Gate | Producer | Outcome |
|---|---|---|
| `rv-pristine-focused-23` | `rv-run.sh test` | exit 0 — **2 total / 2 pass / 0 fail / 0 cancelled / 0 skip** |
| `rv-mutants-23` | `rv-run.sh rvreorder rvnoevidence rvearly` | exit 0 — reorder **killed** (1), no-evidence **killed** (1), `rvearly` **survived** (0) |
| `rv-observe-early-23` | `rv-observe-early.sh` | exit 1 — **invalid, my own bug** (bare `dist/...` passed to `--import` → `ERR_MODULE_NOT_FOUND`); no tests ran; superseded |
| `rv-observe-early-23b` | `rv-observe-early.sh` (fixed `./dist`) | exit 0 — pristine refuses with no framework created; `rvearly` refuses *after* framework creation, both with counter 0 |
| `rv-durability-23` | `rv-durability.sh` | exit 0 — `rvearly` changed-byte child persisted a `context-only` stamped row to `store/records.log` before refusing |
| `rv-mutants2-23` | `rv-run.sh rvnoassert rvdirectflag` | exit 0 — both **survived** (2/2 pass), proving fixture:51 and the monkeypatch are load-bearing |
| `rv-monitor-23` | `rv-monitor.sh` | exit 0 — monitor silent on success (0 lines, exit 0); `process.exit(1)` refusal variant correctly **fails** the mismatch test |

Receipt logs are in this run's evidence directory as `gate-rv-*-01M681*.log`; probe scripts,
mutant diffs and captured child stdout/stderr as `rv-*`. No cap, timeout, 124/137/141 exit or
cancellation occurred in any gate. Failure classification: every non-zero test exit above is an
**intended mutant kill**; the single `rv-observe-early-23` exit 1 is **my own probe-script
error**, reported rather than quietly dropped, and is superseded by `…-23b`. No pre-existing,
flaky or environment-blocked failure was observed on this Node. I ran no full suite — the brief
scoped me to focused tests, so the implementer's full-suite cells are reused evidence (verified
for identity in check 7), not re-executed duties.

Worktree left exactly as found: outer `git status --porcelain` empty at `b612e866`; all probe
`dist/` artifacts removed from `data/enforcement-final-head` (ignored tree, now back to only
`context-only-fork-seed-child.mjs` and `context-only-delivery.test.*`); no commits, no tracked
edits, nothing written inside the tracked tree.

## Unmet criteria / test gaps

- No unmet criterion for this delta. Soma's condition is met as specified; both prior MEDIUMs are
  closed and independently reproduced; the real reorder mutant was kept rather than replaced.
- **Gap (the MEDIUM):** "refuses before real fork work" is enforced only at the granularity of
  the first normalizer invocation. Framework creation, store open and stamped `addMessage` writes
  are unobserved, and a guard drifting past them keeps the suite green.
- **Gap:** nothing asserts that the fixture's own marker machinery stays intact; deleting
  fixture:51 or simplifying the monkeypatch silently restores the `marker-move` survivor.
- **Gap (pre-existing, out of scope):** the hash contract lives only in the test fixture.
  Production has no normalizer-hash precondition — only the runtime cardinality check at
  `src/framework.ts:17871` — so a changed normalizer in production is caught by cardinality, not
  by the audited-bytes contract. That is the documented design, not a regression in this round.

## Residual risk

- The changed-byte scenario is simulated by an in-memory `fs.readFileSync` patch
  (`test/fixtures/context-only-normalizer-read-mismatch.mjs:5-11`) that appends one byte to the
  *read* bytes only; the module Node actually executes is the real one. The witness therefore
  tests the guard's **position**, never behaviour under genuinely different normalizer semantics.
  Correctly disclosed by the implementer.
- `FORK_SEED_REFUSAL_NORMALIZATIONS` relies on stderr reaching the parent. On Linux, writes to a
  pipe are synchronous, and the observed ordering (counter line before Node's fatal dump)
  confirms it lands; on a platform where stderr is asynchronous the line could in principle be
  lost, which would present as a failing (not silently passing) test.
- The permanent, unrestored `console.log` monkeypatch (fixture:37-41) intercepts every subsequent
  `console.log` in the child for the rest of its life. Harmless today because framework
  diagnostics go to stderr; it would become a confounder if any production path started logging
  to stdout during a fork.
- One normalizer's byte identity is not whole-package compatibility, and the 0.24.2 closure is
  qualification evidence, not committed dependency policy — AF remains unpinned
  (`"^0.24.0"`, no root lockfile), so a future resolution will trip this precondition by design.
- The two-test `liveness-watchdog` divergence in the task operator's environment remains
  unexplained across pristine and A/B/D commits; it did not appear in my gates or the
  implementer's. "0 fail" should not be read as environment-independent — and the PR body now
  says so.
- I verified one Node (22.23.3) per the brief. The implementer's 22.12.0 cells and mutant kills
  are reused, unreproduced claims here; their identity bindings are verified, their execution is
  not.

## Fix directions

1. **(MEDIUM)** Widen the refusal observable beyond the normalizer. Smallest change: add a
   second counter in `test/fixtures/context-only-fork-seed-child.mjs` over a mocked
   `ContextManager.open` (or `addMessage`) namedExport and emit both in the
   `uncaughtExceptionMonitor` line, then tighten
   `test/context-only-delivery.test.ts:498-500` to require both at 0. Verify by re-running my
   `rvearly` mutant (`$ORGASMIC_EVIDENCE_DIR/rv-gen-mutants.py` + `rv-run.sh rvearly`): it must
   then fail. Alternative, even simpler: move the hash guard above the evidence `console.log`,
   emit the evidence from the monitor path too, and assert no store directory was created.
2. **(LOW)** Add two short comments in the fixture (at :36 and :51) recording that the flag is
   set only through the intercepted emission and that :51 exists to kill a relocated marker, so
   neither is "simplified" away later. Re-running `rvnoassert` / `rvdirectflag` is the regression
   check.
3. **(LOW, follow-up round as already scheduled)** Drop the `0.24.1` label from
   `src/framework.ts:17867` and refer to the hash contract instead. Deliberately **not** in this
   round; no `src/` diff is permitted here.
4. None of the three blocks this delta. 1 and 2 are small, test-only, and belong either to a
   further bounded round or to the publication follow-up at the task operator's discretion.
