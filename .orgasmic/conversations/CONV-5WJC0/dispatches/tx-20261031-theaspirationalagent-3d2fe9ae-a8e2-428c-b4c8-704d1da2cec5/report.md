# CONV-5WJC0 — read-only review: final D delta + head-12 evidence (TASK-XHZ4H)

Read-only. I ran only `git show/diff/log`, `grep`, `sed`, `cat`, `wc`, `sha256sum`.
No test, build, install, npm/bun/node invocation, and no retry of any gate.
I am not the owner and make **no disposition recommendation**; the gate stays as recorded.

Input integrity: `/srv/review-drop/TASK-XHZ4H-HASHFIX3-FULL.md` =
`66d40f10595aaf53983637bde56ebaee376f625d285d3a054e2f83d07abdb236` — matches the brief.

Source read from the AF clone `/home/orgasmic/src/agent-framework` via `git show <sha>:<path>`
(its worktree is checked out elsewhere; the lineage objects are present).

---

## Verdict

**Q1 — source review of `b612e866..93427f90` in the context of `b6e225e0..93427f90`: correct,
no regression, and test-only.** The change is sound and does what it claims. Two test-strength
defects, both MEDIUM/LOW: the new `FORK_SEED_TEST_DIR` plumbing is dead on every green path, so
its companion assertion is vacuous; and the positive-path workload assertion is near-tautological.
Neither is a bug in shipped behaviour.

**Q2 — all three head-12 failures: `INDETERMINATE`.** No DIRECT changed-path link is possible —
the lineage changes no production file and the compiled production `dist` is byte-identical at
base and head. The shared-resource / child-lifecycle mechanism *is* nameable but is quantitatively
implausible (~0.5 s added against 15–20 s wall-clock budgets) **and was already present in an
earlier full-suite head-12 run that was green**. I do not call it PLAUSIBLE INDIRECT on that basis.
**Explicitly: this does not exclude test-order, shared-resource or child-lifecycle effects.** The
tune-out code being unchanged and the stacks having no link to changed files *does not* exclude
them; it only bounds the diff. The cause remains unestablished.

**Q3** — the evidence cannot establish cause, cannot establish head-uniqueness as a property
(rather than as a single observation), and cannot establish the machine load during head-12.

**Agreement with HASHFIX3:** its `HELD / BLOCKED`, "head-unique, unclassified", and its explicit
statement that the empty tune-out diff "does **not** prove the failures unrelated" are all
accurate and correctly scoped (`TASK-XHZ4H-HASHFIX3-FULL.md:214-216`). It manufactures no cause
and relabels no gate. My one substantive addition is Finding 1 below.

---

## Findings

### MEDIUM — evidence/test: two cause-shaped errors in the head-12 log are pre-existing noise, and no report says so

`head-12.log` contains, immediately above the first failing leaf, two stack traces rooted in
`src/tune-out/coordinator.js` — exactly the file the failing test exercises:

- `head-12.log:54560` (also at `:48014`): `[tune-out] ... could not be stored:
  Error: nul byte found in provided data at position: 4` at
  `ChannelRegistry.writeCoordinatorState (dist/src/mcpl/channel-registry.js:2786:20)`,
  `code: 'GenericFailure'`.
- `head-12.log:54615` (also at `:54623`): `[tune-out] ... could not be read: TypeError:
  this.channelRegistry.readCoordinatorState is not a function` at
  `TuneOutCoordinator.lastLooks (dist/src/tune-out/coordinator.js:1313:40)`.

Both occur **exactly twice in all three logs, including the fully-green `head-23.log`**:

```
base-12-fresh.log: nul byte 2   readCoordinatorState 2   "timed out waiting for" 0   not-ok 1
head-12.log:       nul byte 2   readCoordinatorState 2   "timed out waiting for" 2   not-ok 5
head-23.log:       nul byte 2   readCoordinatorState 2   "timed out waiting for" 0   not-ok 0
```

So they are pre-existing, outcome-neutral diagnostics, **not** the cause: the green cell has them
in identical number. The only signature that discriminates head-12 is `timed out waiting for`.

Impact: these are the most cause-looking artefacts in a 4.1 MB log and they sit in the right file.
`grep -l "nul byte\|readCoordinatorState" /srv/review-drop/TASK-XHZ4H-*.md` returns nothing — no
round-1/2/3, DIAG1 or DIAG2 report mentions either. The next reader is very likely to seize on
them and manufacture the cause the brief forbids. Fix direction: record the three-way count above
in the evidence so the red herring is retired by data, not by argument. They may still deserve
their own unrelated bug — a `GenericFailure` on a coordinator-state write and a missing
`readCoordinatorState` method are both real defects — but they are out of this slice's scope.

### MEDIUM — test: the new `FORK_SEED_TEST_DIR` plumbing is dead on every green path, and `existsSync` assertion is vacuous

`test/context-only-delivery.test.ts:488-493,506` passes a parent-created temp dir to the child and
then asserts `assert(!existsSync(join(dir, 'store')), 'no workload store directory was created
before refusal')`.

In the refusal run the child throws at `test/fixtures/context-only-fork-seed-child.mjs:48-49`
(the hash-contract assert), which is **above** `child.mjs:67` where `FORK_SEED_TEST_DIR` is read.
So the child never learns about `dir`. The positive test does not set the variable, so
`child.mjs:67`'s env branch and `child.mjs:103`'s `if (!process.env.FORK_SEED_TEST_DIR)` cleanup
skip are **not executed on any passing path in either test**.

Failure scenario: `dir` is a freshly `mkdtemp`'d directory that nothing ever writes to, so
`!existsSync(join(dir,'store'))` is true unconditionally — it would pass identically if the child
ignored `FORK_SEED_TEST_DIR` entirely, or wrote a full store into its own `mkdtemp` dir. It gains
discriminating power only against a mutation that moves the hash assert below `child.mjs:71`'s
`create`, which the `creates: 0` counter at `test:504` already catches. Net: a new untested
branch pair plus an assertion that reads stronger than it is.

Secondary hazard from the same code: if `FORK_SEED_TEST_DIR` is ever set in the runner's
environment, `child.mjs:67` makes the *positive* child adopt it and `child.mjs:103` suppresses its
cleanup, while no parent `t.after` covers that test — a temp-dir leak. `{ ...process.env, ... }`
at `test:493` propagates such a value.

Fix direction: either drop `test:506` and the `child.mjs:67/103` plumbing (the `creates: 0`
counter already carries the property), or make the positive test set `FORK_SEED_TEST_DIR` too so
both branches are actually exercised and the directory check has a live negative control.

### LOW — test: the positive-path workload assertion is near-tautological

`child.mjs:97-98`: `assert.deepEqual(workload, { creates: 1, seedWrites: 2, forks: 2,
contextOpens: 1 }, 'the positive witness exercises every declared SDK workload counter')`.

Because `observe` (`child.mjs:31`) increments on **entry** and every `observe` call site sits on
the straight-line path above line 97, reaching line 97 already implies those exact counts. The
assertion cannot fail for the reason its message states. Its only real power is against a renamed
or mistyped step key (`workload['fork']++` → `NaN` plus an extra key, which `deepEqual` catches).
Not harmful; it just overstates. The load-bearing use of these counters is the refusal-path
zero-check at `test:504`, which does discriminate. Fix direction: reword the message to the
property it actually holds, or drop it in favour of the refusal-path check.

### LOW — docs: version note is correct but narrow

`docs/context-only-delivery.md:154-155` records that the context-manager `file:line` references
were collected at 0.24.1 and not re-audited at 0.24.2. Accurate and the right disclosure. It does
not say what *would* trigger a re-audit; the enforcement actually lives in `child.mjs:48`'s hash
pin, which is not cross-referenced from the doc. Fix direction: one clause pointing at the fixture.

---

## Q1 detail — what the delta does, and why it is test-only

Lineage `b6e225e0..93427f90` (9 commits, `87314602` → `93427f90`):

```
docs/context-only-delivery.md                               |  2 +
test/context-only-delivery.test.ts                          | 48 ++++++++-
test/fixtures/context-only-fork-seed-child.mjs              | 78 +++++++++-----
test/fixtures/context-only-normalizer-read-mismatch.mjs     | 12 ++++
4 files changed, 119 insertions(+), 21 deletions(-)
```

Verified by my own inspection, not taken from the reports:

- `git diff --name-only b6e225e0..93427f90 | grep -v '^test/\|^docs/'` → **empty**.
- `git diff --name-only b6e225e0..93427f90 -- src/ package.json package-lock.json` → **empty**.
  No production file, no dependency, no timeout setting, no test-runner flag changed.
- `git diff --stat b6e225e0..93427f90 -- src/tune-out src/mcpl test/tune-out-e2e.test.ts
  test/tune-out-reader-epoch-shared.test.ts test/tune-out-reader-fork-handoff.test.ts` → **empty**.
  This independently reproduces the zero-byte `tune-out-source-diff.txt` in the receipts.
- Corroborated at the binary level by `TASK-XHZ4H-DIAG1.md:95-110`: `dist/src/framework.js`
  (`86d59157…`), `dist/src/tune-out/coordinator.js` (`11303df9…`), `dist/src/deadline-timer.js`,
  `dist/src/held-writes.js`, `dist/src/index.js` and all three `dist/test/tune-out-*.test.js`
  carry **identical SHA-256 at head and base**. The executed production code is byte-identical.

Final delta `b612e866..93427f90` — correctness read:

- Adds a `workload` counter object (`child.mjs:29`) and an `observe(step, call)` wrapper
  (`child.mjs:31`) around the five declared SDK calls: `AgentFramework.create` (`:71`), both
  `addMessage` seeds (`:78,:80`), both `createConversationAgent` forks (`:83,:87`), and
  `ContextManager.open` (`:91`). Each call keeps its receiver (explicit on the call expression
  inside the closure), its return value (`return call()`) and its throw path (no catch) — so
  `await observe('forks', …)` inside `assert.rejects` at `:87` still hands `assert.rejects` the
  rejecting promise. The comment at `:30` correctly documents that this counts **entry**, which
  is the right semantics for the refusal property ("did we touch it at all").
- Emits the counters on the refusal path from the existing `uncaughtExceptionMonitor`
  (`child.mjs:34`) and asserts them all zero at `test:504`. Ordering holds: the hash assert is at
  `child.mjs:48-49`, above `mock.module` (`:52`), above the `framework.js` import (`:65`), above
  every `observe` site. The stdout shape assert at `test:495` still pins that only the evidence
  line precedes refusal.
- `t.after` cleanup (`test:489`) correctly replaces nothing that existed — the test previously
  created no directory.
- No regression to the positive test: the observed behaviour is unchanged (wrapping only), and the
  receipts show it passing at 504 ms on Node 22.12.0 (`head-12.log:8951-8953`) and 479 ms on
  22.23.3 (`head-23.log:10257-10259`).
- `context-only-normalizer-read-mismatch.mjs` is a read-only in-memory `fs.readFileSync` shim that
  appends one newline to the normalizer bytes (`:6-11`) plus `syncBuiltinESMExports()`; it changes
  no installed file. Scoped by an exact suffix match, so it cannot perturb unrelated reads.

The round-2 reviewer's two surviving mutants (`TASK-XHZ4H-HASHFIX-REVIEW.md:26-44`: the ordering
proxy and the deletable evidence line) are the problems this delta set out to close, and `test:495`
+ `test:504` do close the ordering one with real discriminating power. The directory check
(`test:506`) does not add to it — see Finding 2.

---

## Q2 detail — the three head-12 failures

Receipt arithmetic first: `head-12.result.json` reports `fail: 3` but lists **five**
`failure_names`. The two extras are enclosing suites, not separate tests. From
`grep -nE "^ *not ok" head-12.log`:

| log:line | TAP | leaf / suite | file:line |
|---|---|---|---|
| `head-12.log:54577` | `not ok 1` (subtest) | runs the full divert → wake → auto-cancel arc | `dist/test/tune-out-e2e.test.js:80:5` |
| `head-12.log:54600` | `not ok 4663` | **suite** `tune-out end to end` (`subtestsFailed`) | `…tune-out-e2e.test.js:37:1` |
| `head-12.log:54777` | `not ok 4682` | **leaf** a real reader fork carries its epoch and leaves a later hold and channel untouched | `dist/test/tune-out-reader-epoch-shared.test.js:51:1` |
| `head-12.log:54845` | `not ok 1` (subtest) | names queued messages by their write handles, … | `dist/test/tune-out-reader-fork-handoff.test.js:68:5` |
| `head-12.log:54868` | `not ok 4688` | **suite** `reader forks: the framework hands on what is queued behind the resident turn` | `…tune-out-reader-fork-handoff.test.js:67:1` |

So "the third from TAP" in the brief is **`a real reader fork carries its epoch and leaves a later
hold and channel untouched`**. `TASK-XHZ4H-HASHFIX3-FULL.md:161` already states this reconciliation
correctly.

### (a) `runs the full divert → wake → auto-cancel arc` — INDETERMINATE
- Message: `timed out waiting for: auto-cancel returns the channel to open` (`head-12.log:54582`).
- Stack: `waitFor (dist/test/tune-out-e2e.test.js:34:11)` ← `async TestContext.<anonymous>
  (…:130:9)` (`head-12.log:54588-54591`). Leaf duration **33 494 ms**.
- Timeout: the exceeded budget is `waitFor`'s own wall-clock poll, `timeoutMs = 15_000` default at
  `test/tune-out-e2e.test.ts:42` (`const deadline = Date.now() + timeoutMs`, 100 ms poll); the
  auto-cancel call site passes **20 000 ms** (`HASHFIX3:169`). Node leaf timeout not overridden
  (runner `--test-timeout=600000`). So this is an **in-test wall-clock deadline**, not a runner kill.
- Code paths: `TuneOutCoordinator` divert/wake/auto-cancel, `ChannelRegistry` desired/tune-out
  state, `MockMembrane`, `deadline-timer`, MCPL fixture server.
- Crosses changed files/functions? **No.** `src/tune-out/**` and `test/tune-out-e2e.test.ts` are
  byte-identical across `b6e225e0..93427f90` (empty diff above; identical `dist` SHA-256 in
  DIAG1). Nothing in the stack touches `test/context-only-delivery.test.ts` or the fixtures, and
  Node runs each test file in its own process, so there is no in-process shared state.

### (b) `a real reader fork carries its epoch and leaves a later hold and channel untouched` — INDETERMINATE
- Message: `Timed out waiting for old reader request and new hold` (`head-12.log:54782`).
- Stack: `waitFor (dist/test/tune-out-reader-epoch-shared.test.js:43:11)` ← `async
  TestContext.<anonymous> (…:111:9)` (`head-12.log:54785-54789`). Duration **32 050 ms**.
- Timeout: `waitFor`'s wall-clock `until = Date.now() + 20_000`, 50 ms poll, at
  `test/tune-out-reader-epoch-shared.test.ts:42`. Leaf limit not overridden.
- Code paths: reader-fork epoch propagation, hold/channel state, mock membrane reader streams.
- Crosses changed files/functions? **No**, same proof as (a).

### (c) `names queued messages by their write handles, …` (suite `reader forks: …`) — INDETERMINATE
- Message: `timed out waiting for: the first fork` (`head-12.log:54850`).
- Stack: `waitFor (dist/test/tune-out-reader-fork-handoff.test.js:63:19)` ← `async
  TestContext.<anonymous> (…:118:13)` (`head-12.log:54854-54859`). Duration **31 367 ms**;
  enclosing suite 33 721 ms.
- Timeout: in-test wall-clock **20 000 ms** poll; this leaf additionally carries an explicit
  **120 000 ms** Node leaf timeout — not reached. So again an in-test deadline.
- Code paths: held-writes queue, write-handle naming, failed-fork handoff to the next reader.
- Crosses changed files/functions? **No**, same proof as (a).

### Why not PLAUSIBLE INDIRECT — and what remains open

The one mechanism I can name concretely, with the shared resource identified:

- **Shared resource / child lifecycle.** `test/context-only-delivery.test.ts:490` and the positive
  test both use **`spawnSync`**, which blocks a test-runner worker for the child's whole life, and
  the child runs a real `AgentFramework` with a SQLite store (`child.mjs:71-96`) before
  `framework?.stop()` (`child.mjs:101`). At base that child died in **84 ms** at the stale version
  pin `'0.24.2' !== '0.24.1'` (`base-12-fresh.log:8962` region, leaf 83.9 ms) having done no
  framework work at all. At head it completes the full workload: 504 ms + 91 ms for the two leaves.
  **Ordering:** the extra ~0.5 s and the extra test (9 688 vs 9 687) can shift which files are
  co-resident under `AF_TEST_CONCURRENCY=8`.

I rate this **INDETERMINATE rather than PLAUSIBLE INDIRECT** for two reasons:

1. **Magnitude.** ~0.5 s of additional single-file blocking work, on 16 CPUs over a ~4-minute
   suite, against wall-clock budgets of 15 000–20 000 ms that were exceeded by leaves running
   31–33 s — when the same leaves take 2.4–8.8 s in isolation. The mechanism is three orders of
   magnitude too small to be offered as the explanation.
2. **It was already present in a green full-suite head-12 run.** The round-1 implementer matrix at
   `93932bae` — full suite, Node 22.12.0, same frozen closure `dabd7705…` — recorded
   `grep -c '^not ok'` of **0** for head-12, counts reconciling `9625 + 0 + 63 = 9688`
   (`TASK-XHZ4H-HASHFIX-REVIEW.md:97`). `93932bae` is the commit that fixed the version pin, so the
   full-workload `spawnSync` child **already ran there**. The final delta only wrapped existing
   calls in counters and added the dir plumbing. A mechanism that was live in a green run is not
   a candidate explanation for the red one.

**Said explicitly, as the brief requires:** unchanged tune-out code and the absence of any stack
link to a changed file **do not exclude** test-order, shared-resource or child-lifecycle effects.
They remain live possibilities — my classification is INDETERMINATE, which is agnosticism about
the mechanism, not a clearance of it. What would discriminate is repetition, not more reasoning:
repeated full-suite head-12 and base-12 runs to establish whether the three leaves are
deterministic at head, and a head run with load telemetry recorded.

### Non-reproduction already on record (reused, not re-executed)

| Observation | Scope | Node | Result | Source |
|---|---|---|---|---|
| head-23 full suite | 9 688 tests | 22.23.3 | **0 fail** | `head-23.result.json` |
| head-12 full suite @ `93932bae` | 9 688 tests | 22.12.0 | **0 not-ok** | `HASHFIX-REVIEW.md:97` |
| head-12 full suite @ `93427f90` | 9 688 tests | 22.12.0 | **3 fail** | `head-12.result.json` |
| base-12-fresh full suite | 9 687 tests | 22.12.0 | 1 fail (version pin, not a timeout) | `base-12-fresh.result.json` |
| DIAG1 3-file pair, head **and** base | 5 leaves | 22.12.0 | all pass, 4.9 s / 2.4 s / 8.5 s / 2.2 s | `DIAG1.md:52-63` |
| DIAG2 4-file pair, head **and** base | 43 / 42 leaves | 22.12.0 | all tune-out leaves pass at loadavg 7.2–7.7 | `DIAG2.md:66-80,140-160` |

DIAG2 is the pointed one: it co-ran the **changed** `context-only-delivery` file together with all
three tune-out files, at head, on the implicated Node, under a *higher* recorded load than base
ever saw — and reproduced nothing. That weakens co-tenancy-with-the-changed-file specifically.

`12`/`23` are **Node versions, not concurrency**: `run-head-matrix.sh` selects
`/opt/node-v22.23.3-linux-x64/bin/node` vs
`/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin/node`, and `run-cell.sh:5` sets
`AF_TEST_CONCURRENCY=8` for every cell. Executable identity is pinned in-log: base-12-fresh and
head-12 both `177208bf…937f` / v22.12.0; head-23 `fde6a4bf…348f4` / v22.23.3.

---

## Verification Gates

**I ran none, by instruction.** No gate wrapper was invoked, nothing was rebuilt or re-executed.
All outcomes below are **reused receipts**, read and cross-checked, not fresh observations.

| Gate (reused) | Receipt | Recorded outcome |
|---|---|---|
| `qualified-head-12` | `gate-qualified-head-12-01M6829HH23F825RC5N8ZV2KYY.log` | **exited:1** — 9 688 / 9 622 pass / 3 fail / 63 skip; `inconclusive:false`, `cap_hit:false`, `log_capture:0`; HEAD `93427f90` clean=yes |
| `qualified-head-23` | `gate-qualified-head-23-01M6822AHBVTYSXZHS2X5N1MF6.log` | exit 0 — 9 688 / 9 625 pass / 0 fail |
| `qualified-base-12-fresh` | `gate-qualified-base-12-fresh-01M682NHZXSYTGAX7Y70FYWDD6.log` | exit 1 — 9 687 / 9 623 pass / 1 fail (version pin); HEAD `b6e225e0` clean=yes |

**The head-12 gate remains FAILED.** Nothing in this review alters it, and no reused receipt is
relabelled. Checks I did perform, all read-only:

- Report checksum `66d40f10…` verified against the brief (`sha256sum`).
- Lineage scope proven test+docs-only by three independent `git diff --name-only` filters (above).
- Empty tune-out diff reproduced independently of `tune-out-source-diff.txt`.
- The 5-vs-3 `failure_names` discrepancy resolved against TAP nesting in `head-12.log`.
- Three-way error-signature counts across `base-12-fresh.log`, `head-12.log`, `head-23.log`
  (Finding 1) — `grep -c`.
- `run-cell.sh` vs `run-load-cell.sh` diffed: the latter is a pure wrapper that calls the former,
  adding only load snapshots. **The executed cell is identical**, so base-vs-head is not confounded
  at the harness level — only by load (below).
- Node executable identity and `AF_TEST_CONCURRENCY=8` confirmed per cell from in-log preflight.

Failure classification for the three head-12 leaves: **not a regression of this delta** (no
production change; byte-identical `dist`), **not pre-existing-and-shared** (the matched base cell
passes them), **not environment-blocked** (conclusive, no cap/timeout/signal). Remaining candidates
are **flaky** or **environment/load**, and the evidence does not let me pick between them — hence
INDETERMINATE rather than a classification.

---

## Unmet Criteria / test gaps

1. **The required Node-22.12.0 head gate is FAILED and its cause is unestablished.** Unchanged.
2. **n = 1 per cell.** There is exactly one full-suite observation at `93427f90` on Node 22.12.0,
   and no repeat at head or base. "Head-unique" is therefore a property of one paired observation,
   not a demonstrated property of the commit. Repetition is the missing gate.
3. **No load telemetry for either head cell.** `load-context-note.txt` records this as accepted by
   the operator with no replay. See Residual Risk for why this is the sharpest gap.
4. **`FORK_SEED_TEST_DIR` branches are untested** (Finding 2): `child.mjs:67` env branch and
   `child.mjs:103` cleanup skip execute on no passing path.
5. **Two compound marker mutants still survive**, as HASHFIX3 states at `:225`. The LOW comments
   added at `child.mjs:41-42,57` document rather than enforce. Accurately disclosed, still a gap.
6. **The `nul byte` / `readCoordinatorState` defects are untracked** (Finding 1). No test asserts
   coordinator-state round-tripping; both errors are swallowed into log lines, which is why they
   ride along in a green suite.
7. **Closure is not third-party reproducible** — frozen `node_modules` + non-committed
   `frozen-package-lock.json`; carried forward from `HASHFIX-REVIEW.md:111`, unchanged here.

---

## Residual Risk

- **The cause of the three head-12 timeouts is unknown and this review does not establish it.**
  I decline to name one. Treat any future confident single-cause story about these three leaves as
  unsupported unless it comes with repeated full-suite runs.
- **Load asymmetry is the sharpest unresolved confound, and it runs against the head.** The only
  cell with recorded load is `base-12-fresh` — the one that *passed* the three leaves — and it
  started at a 1-minute loadavg of **1.66** while its own 5/15-minute averages were **5.36/5.74**
  (`base-12-fresh.load-start.json`). It began in a trough well below the trend covering the head
  runs. Head-12 load is **not recorded**; the operator-supplied 3.97/6.58/6.13 at 04:13:32Z is
  *after* head-12 ended at 04:12:37Z. So the single comparison establishing "head-unique" pairs an
  unmeasured head against a base that ran at the quietest recorded moment of the session. That does
  not explain the failures and I do not offer it as a cause — but it means head-uniqueness is not
  cleanly isolated from load.
- **The helper snapshots cannot settle it.** `helpers-head-12.txt` (27 identities) is taken at cell
  *start* and enumerates only the run's own cgroup; it shows control infrastructure and zero test
  helper survivors, but it cannot see other tenants on the 16-CPU host or contention during the
  run. Zero survivors is real and worth having; it is not evidence about load.
- **A green full-suite head-12 exists at `93932bae`** in the same lineage, same Node. Both that and
  the red run at `93427f90` are n=1. Either the intervening test-only commits matter, or the suite
  is non-deterministic here; the evidence does not decide.
- **Prior art for environment-dependent instability in this suite.** `test/liveness-watchdog.test.ts`
  reproducibly fails in the operator's environment across five commits *including pristine*
  `a64cfc01`, and passes for both the implementer and the round-1 reviewer
  (`HASHFIX-REVIEW.md:68,112`). An unexplained environment-dependent divergence already exists here.
  This is context for plausibility, not a link — it is a different test and a different signature.
- Residual risks 2–5 from `HASHFIX3:225-234` (marker mutants, call-site-only counters, byte-identity
  ≠ package compatibility, unchanged production surface) are accurately stated; I found nothing
  contradicting them.
- **Scope honesty:** I reproduced no test outcome. Every pass/fail figure here is a reused receipt.
  My independent work is source inspection, diff proofs, log cross-counting and arithmetic
  reconciliation.
- Per the brief, the earliest pre-HASHFIX3 TAP failure names are **UNKNOWN** and I did not attempt
  to reconstruct them. Nothing in this review depends on them.

---

## Fix Directions

1. **(MEDIUM, Finding 1)** Record the three-way `nul byte` / `readCoordinatorState` /
   `timed out waiting for` counts in the evidence so the next reader cannot mistake those two
   stacks for the cause. File the two coordinator-state defects separately — out of scope for D.
2. **(MEDIUM, Finding 2)** Either delete `test/context-only-delivery.test.ts:506` together with the
   `child.mjs:67`/`:103` env plumbing, or set `FORK_SEED_TEST_DIR` in the positive test as well so
   both branches execute and the directory check acquires a live negative control. Verify by the
   existing after-create mutant — it must still be killed by `test:504`.
3. **(LOW, Finding 3)** Reword `child.mjs:98` to the property actually held, or drop it in favour of
   the refusal-path zero-check.
4. **(LOW, Finding 4)** Cross-reference `child.mjs:48`'s hash pin from
   `docs/context-only-delivery.md:154`, so whoever gets the red suite on a dependency bump is sent
   to the fixture.
5. **(Evidence, for the qualifier)** The gap is repetition, not analysis: repeated full-suite
   head-12 **and** base-12 runs at `93427f90` with load telemetry recorded for every cell, to
   establish whether the three leaves are deterministic at head. Until then INDETERMINATE stands.
   Authorizing that is the operator's/qualifier's call, not mine, and I am not requesting it.

**No disposition.** I make no unhold recommendation, propose no relabelling of the FAILED head-12
gate, and offer no cause. Qualification disposition rests with the qualifier.
