# Fork-seed workload-boundary enforcement

## Changed

- Start: `b612e8664c89c4f61c5c4ad69def914deb9889b4`.
- Final head: **`93427f90a16bcfbcf815217f4c080669ab842a71`**.
- Read the complete review (SHA-256 `9ff5c32b342d78bbbe9c5676b72733f079dab3457f0da85149932e6a7dd8ca1b`) and its mutation generators, rv-* diffs, observation scripts and mutant gate logs. Preserved historical reference artifacts under `reviewer-reference/`.
- Two additive, per-concern commits: `541f8b93` (workload counters/refusal assertions) and `93427f90` (marker kill-chain comments). Both have the required Vasyl noreply author/committer and GPT-6.1-Sol co-author trailer. Exact metadata: `commit-identities.txt`; complete delta: `workload.diff`.
- Exactly two test files changed: `test/context-only-delivery.test.ts` and `test/fixtures/context-only-fork-seed-child.mjs` (+33/-15). No production/source, dependency, lockfile, native-method, SDK-export or permission changes. Existing normalizer mock.module remains the only SDK export mock. No npm install, push or publication.
- Engineering constraints are Soma's (programme qualifier), relayed by Tarn (task operator); **not decisions or consent by human owner Vasyl**.

| Finding / requirement | Disposition |
|---|---|
| MEDIUM: guard may drift past create/store and stamped writes | Closed: call-site counters cover create/store acquisition, both stamped source writes, both forks, explicit context reopen, and normalization. Mismatch requires all zero. Both early-guard mutants killed on both Nodes. |
| LOW-1: marker instrumentation rationale | Closed with comments explaining emission-only flag assignment and the in-normalizer assertion's marker-move kill chain. No extra behavior added to those mechanisms. |
| LOW-2: stale production version comment | Deferred as required; `src/framework.ts` and all other production files have zero diff. |
| Supplementary store check | Parent owns an empty temp root, supplies it to the child, asserts its `store/` never appeared, then cleans up. This is supplementary, not the primary proof. |
| Known marker-machinery survivors | `rvnoassert` and `rvdirectflag` still survive on both Nodes. Comments document their significance; no new meta-test or stronger kill claim is made. |

### Bounded claim and controls

The enforced claim is **refusal before the fixture's declared SDK workload calls**: create/store acquisition, source addMessage, fork/normalization, and its explicit context reopen. It is **not** a claim that module loading is I/O-free, that all internal SDK calls are separately counted, or that the fixture supplies a native reader-format guarantee.

A two-line fixture helper increments a named counter, then invokes a closure containing the actual method call. This preserves receiver, return value and synchronous throw; async promises are returned unchanged. `creates` observes entry to `AgentFramework.create` with `storePath` and `contextOnlyStorage: true`, including its store-acquisition workload; it is not an independent native-store hook. No non-configurable method or loader/SDK export was patched.

On an uncaught refusal the fixture emits `FORK_SEED_REFUSAL_WORK` JSON. The mismatch test requires the exact hash-contract reason **normalizer hash contract mismatch; re-audit required**, exit **1**, evidence-only stdout, and:
```json
{"creates":0,"seedWrites":0,"forks":0,"contextOpens":0,"normalizations":0}
```
It also requires the existing zero-normalization line and absence of the store directory. A parent-owned directory is not removed by the child, so a late refusal cannot erase the supplementary evidence before the parent's assertion. Parent cleanup always follows through the test teardown.

The positive witness asserts that every counter is exercised: **1 create / 2 seed writes / 2 forks / 1 explicit context reopen / 2 normalizations**, retaining all original alignment/refusal/store assertions. The flag remains tied to actual marker emission; the in-normalizer assertion kills a relocated marker.

Fresh direct observations on **both** Nodes (`workload-observations.json`; raw `observe-<variant>-<23|12>.stdout/.stderr`):

| Changed-byte child | Exit | creates | seedWrites | forks | contextOpens | normalizations | store exists |
|---|---:|---:|---:|---:|---:|---:|---|
| pristine guard | 1 | 0 | 0 | 0 | 0 | 0 | no |
| guard after create, before writes | 1 | 1 | 0 | 0 | 0 | 0 | yes |
| rvearly: guard immediately before first fork | 1 | 1 | 2 | 0 | 0 | 0 | yes |

All six children emit exactly the evidence line on stdout and the same specific mismatch reason. The new counter assertion, not directory absence or stdout alone, kills both early variants.

### Mutants and first observations

Historical observations are retained, **not relabelled fresh**:
- `mutants-initial/`: first round's real fork-before-hash survivors on both Nodes at `162f9203`, test exit 0, 2/2 pass.
- `mutants-top-marker/`: intermediate marker observations, not substituted for real-invocation evidence.
- `reviewer-reference/gate-rv-mutants-23-*.log` and `rv-mutant-rvearly.diff`: the reviewer's `rvearly` survivor at `b612e866`, exit 0, 2/2 pass on Node 22.23.3.
- `reviewer-reference/rv-durability.stdout/.stderr`: the reviewer's earlier real stamped-write counterexample, preserved as historical evidence. No new native-format audit is claimed.
- `reviewer-reference/gate-rv-mutants2-23-*.log`: original `rvnoassert` / `rvdirectflag` survivors.

Fresh candidate tests/mutants ran first, then the source was committed/frozen once, then full final-head cells ran. `focused-source-sha256.json` binds both candidate files byte-for-byte to final head; final integrity rechecks this. There were no source edits or retries after freeze.


| Fresh mutant | Node | Exact test/gate exit | Total | Pass | Fail | Skip | Cancelled | Observation |
|---|---|---|---:|---:|---:|---:|---:|---|
| reorder | 22.23.3 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| no-evidence | 22.23.3 | 1 / 1 | 2 | 0 | 2 | 0 | 0 | killed |
| no-hash | 22.23.3 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| marker-move | 22.23.3 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| rvearly | 22.23.3 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| after-create | 22.23.3 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| rvnoassert | 22.23.3 | 0 / 0 | 2 | 2 | 0 | 0 | 0 | SURVIVES |
| rvdirectflag | 22.23.3 | 0 / 0 | 2 | 2 | 0 | 0 | 0 | SURVIVES |
| reorder | 22.12.0 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| no-evidence | 22.12.0 | 1 / 1 | 2 | 0 | 2 | 0 | 0 | killed |
| no-hash | 22.12.0 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| marker-move | 22.12.0 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| rvearly | 22.12.0 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| after-create | 22.12.0 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| rvnoassert | 22.12.0 | 0 / 0 | 2 | 2 | 0 | 0 | 0 | SURVIVES |
| rvdirectflag | 22.12.0 | 0 / 0 | 2 | 2 | 0 | 0 | 0 | SURVIVES |

**Survivors:** `rvnoassert` and `rvdirectflag`, each on both Nodes (four surviving executions). This is expected and is not described as a kill. All 16 executions are conclusive, capture exit 0, no cap hit; the aggregation controller exit 0 checks the expected kills **and** known survivors.

What kills each:
- `rvearly` and `after-create`: the mismatch test's **all-zero workload deep equality**. The logs show actual creates=1, with seedWrites=2 or 0 respectively, despite normalizations=0.
- `reorder` and `no-hash`: mismatch stdout includes the real normalization-entry marker, violating evidence-only stdout.
- `no-evidence`: positive evidence-presence assertion and negative exact-stdout assertion (two failed tests).
- `marker-move`: the **positive** fixture's in-normalizer flag assertion. It is an instrumentation honesty check, not a production guarantee.
- `rvnoassert`: removes that flag assertion and relocates the marker; no current test kills it.
- `rvdirectflag`: replaces intercepted-emission coupling with direct flag assignment and relocates the marker; no current test kills it.

Exact failed test names:
- Killed `rvearly`, `after-create`, `reorder`, `no-hash`: **changed normalizer bytes fail the fork-seed precondition loudly**.
- Killed `marker-move`: **fork seed normalization preserves alignment or refuses before any shifted normal classification is stored**.
- `no-evidence`: both names above.
- Surviving variants: no failed names.

Artifacts: `workload-mutant-<variant>-<23|12>.log/.result.json/.capture.json/.gate.log`, `workload-mutant-<variant>.diff`, `workload-mutant-results.json`, `workload-mutant-exits.txt`; generator `generate-workload-mutants.py`. The real reorder still moves **only** the hash assertion below both forks and store assertions; `rvearly` still moves it immediately before the first real fork. No easier print-order substitute was used.

## Verification Gates

### Dependency and executable bindings

**No install or dependency resolution ran this round.** All current candidate/mutant/full tests use the frozen physical closure in `data/fixture-closure/node_modules`; `data/workload-head/node_modules` points to it. CM is **0.24.2**. No earlier 0.24.1 pass is used as qualification.

| Binding | Exact value |
|---|---|
| Frozen manifest (7,332 files/symlinks, hashes/targets/modes) | `dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01` |
| Generated uncommitted lock SHA-256 | `df14aa0a57fd237393e3853956707ecbb31e93952504dcba24e9a971eb022578` |
| npm ls --all graph SHA-256 | `ddab82bf8e2cfab56aa37eb750bb2b8e94c915fd8806e57011ae2ab2b919d25a` |
| CM integrity from installed node_modules lock | `sha512-TiS7kX6L5/AMqmYPVqI5XHXaDxTfnS6ca6d4LL8Yhs7lbApS40qa6deVP0QOeCN9UpxmGRh02jcuVFaOTANDgQ==` |
| Normalizer SHA-256 | `dcfff6de61ea5e77ea2d75100a29021d79ba1e45844302cd8b34ffcc2526701a` |
| In-memory changed-read SHA-256 | `5cb74f70739fe3f8fdb3980e3518102e47337c135a18ce7e70dfd698b7b12b5c` |
| Head | `93427f90a16bcfbcf815217f4c080669ab842a71` |
| Base | `b6e225e07a8214894c3f721dfb14ac0c1cf75714` |

Saved closure evidence: `frozen-package-lock.json`, `frozen-npm-ls-all.json`, `frozen-node-modules-manifest.json`. All fresh before/after manifests and `closure-final.json` match it exactly. **Identical normalizer bytes do not establish whole-package compatibility.** The docs' CM file:line audit remains explicitly historical 0.24.1, not a 0.24.2 re-audit; neither docs nor production comments changed this round.

| Absolute executable | Version | Full SHA-256 |
|---|---|---|
| `/opt/node-v22.23.3-linux-x64/bin/node` | 22.23.3 | `fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48` |
| `/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin/node` | 22.12.0 | `177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9` |

Full hashes and versions are printed before npm/test in every fresh cell and before every mutant test.

### Reused observations — explicitly not fresh gates

Both original b6 base cells are **reused failed-base observations**, never passing receipts. Refreshed identity proof is `base-reuse-proof.json`, checked in `workload-integrity-audit`.

| Reused cell | Code | Node SHA-256 | Closure manifest | AF concurrency | NODE_OPTIONS | Same? |
|---|---|---|---|---|---|---|
| base-23 | `b6e225e07a8214894c3f721dfb14ac0c1cf75714` | `fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48` | `dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01` | 8 | unset | yes |
| base-12 | `b6e225e07a8214894c3f721dfb14ac0c1cf75714` | `177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9` | `dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01` | 8 | unset | yes |

Runner SHA-256: `55628eda93a59a5c0f27bfbf0a11b553748acc58684096ab1968d16d45b2b7b7`; bounded capture-wrapper SHA-256: `ed896412b6abda15ad660760c1132bec647b4c30a25ab6cc70a2c14eb3c01350`. Both are byte-identical to the source run; the runner itself exports AF_TEST_CONCURRENCY=8 and unsets NODE_OPTIONS. Base source is clean at the same commit; live executable hashes/versions and current closure match old preflight/before/after artifacts.

Source run evidence: `/home/orgasmic/.orgasmic/runs/run-01M67T7WWFXPBXDR04N3CY5RQR/evidence`, `base-23.log`, `base-12.log` and corresponding result/capture/gate files. Earlier head passes are not reused as fresh executions. Historical mutation/reviewer evidence retains its original commit and Node scope.

### Commands and observations

Fresh full cells run from the **tested checkout**, with:
```sh
orgasmic dispatch gate qualified-<cell> --   systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0   bash "$ORGASMIC_EVIDENCE_DIR/capture-cell.sh" <cell>   bash "$ORGASMIC_EVIDENCE_DIR/run-cell.sh" <absolute-node> <cell> <expected-full-sha>
```
The producer performs clean → typecheck → build → full npm test, AF_TEST_CONCURRENCY=8, NODE_OPTIONS unset. The entire producer is inside **timeout --signal=TERM --kill-after=60s 3000s** and a **64-MiB** capped/draining log capture, with both PIPESTATUS values preserved. Exits 124/137/141, cap hit or capture failure are **INCONCLUSIVE**; none occurred.

Order: focused controls/mutants → freeze → **head-23 → head-12**, one attempt each. After head-12 failed, task operator Tarn authorized **one separate fresh matched base-12** (ask `ask-8d27adde703e4bb4b1563c204c570d7f`), after other owned checks ended. That base is **not a head retry**. It uses the same wrapper and immutable runner, with a thin `run-load-cell.sh` around the runner to record newly requested load telemetry. No head retry, timeout increase, production fix or further suite was run.

Tested checkouts: `data/workload-head` at the full head SHA; `data/fixture-closure` at the full base SHA. Builds remain in checkout dist directories, not evidence.

| Cell | Status | Producer / npm exit | Total | Pass | Fail | Skip | Cancelled | Capture | Cap | Bytes |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|
| base-23 | reused | 1 / 1 | 9687 | 9623 | 1 | 63 | 0 | 0 | no | 4,285,656 |
| base-12 | reused | 1 / 1 | 9687 | 9623 | 1 | 63 | 0 | 0 | no | 4,120,378 |
| head-23 | fresh | 0 / 0 | 9688 | 9625 | 0 | 63 | 0 | 0 | no | 4,275,499 |
| head-12 | fresh | 1 / 1 | 9688 | 9622 | 3 | 63 | 0 | 0 | no | 4,113,096 |
| base-12-fresh | fresh matched observation | 1 / 1 | 9687 | 9623 | 1 | 63 | 0 | 0 | no | 4,115,438 |

All rows are **conclusive**, including the failures. Typecheck/build exited 0 in all fresh full cells.

Failure names, without dropping enclosing suites:
- Reused base-23/base-12 and fresh base-12: **fork seed normalization preserves alignment or refuses before any shifted normal classification is stored** — old assertion `'0.24.2' !== '0.24.1'`. Fresh base has no other failure.
- Fresh head-23: none.
- Fresh head-12 leaves:
  1. **runs the full divert → wake → auto-cancel arc**
  2. **a real reader fork carries its epoch and leaves a later hold and channel untouched**
  3. **names queued messages by their write handles, gives a failed fork's messages to the next reader, and hands nothing twice once they land**
- Fresh head-12 enclosing suite not-ok records: **tune-out end to end**; **reader forks: the framework hands on what is queued behind the resident turn**. These explain five not-ok lines but **three failed tests** in the TAP summary.

Raw full-cell artifacts: `head-{23,12}.*`, `base-12-fresh.*` (logs/results/capture/gate and closure before/after). Gate receipt logs are `gate-qualified-head-23-*.log`, `gate-qualified-head-12-*.log`, `gate-qualified-base-12-fresh-*.log`. `matrix-owner.log`, `base-owner.log` and `matrix-exits.txt` preserve the sequential timeline and exact exits.

### Per-leaf matched comparison

| Leaf | Head outcome / TAP duration ms | Fresh base outcome / TAP duration ms | Wait limit ms | Explicit leaf / runner limit ms | Classification |
|---|---|---|---:|---|---|
| runs the full divert → wake → auto-cancel arc | fail / wait timeout / 33494.434613 | pass / 4913.923078 | 20000 | not overridden / 600000 | **head-unique, unclassified / held** |
| a real reader fork carries its epoch and leaves a later hold and channel untouched | fail / wait timeout / 32050.232226 | pass / 2544.692012 | 20000 | not overridden / 600000 | **head-unique, unclassified / held** |
| names queued messages by their write handles, gives a failed fork's messages to the next reader, and hands nothing twice once they land | fail / wait timeout / 31366.942351 | pass / 8644.014751 | 20000 | 120000 / 600000 | **head-unique, unclassified / held** |

These are **whole-leaf TAP durations**, including setup, prior waits and teardown, not isolated stopwatch measurements of the failing wait. The failed poll has a 20,000-ms limit in each test. The handoff test additionally has an explicit 120,000-ms leaf limit; the other two use the runner's 600,000-ms setting. Outer cell timeout is separately 3,000 seconds. No limit changed.

Failure reasons: auto-cancel returns the channel to open; old reader request and new hold; the first fork. Source references: `test/tune-out-e2e.test.ts:186–189`, `test/tune-out-reader-epoch-shared.test.ts:41–47,124`, `test/tune-out-reader-fork-handoff.test.ts:60–66,77,138`; runner limit in package.json test command. `tune-out-matched-leaves.json` holds machine-readable paired outcomes/durations/limits.

### Load context — not a cause

Head-cell start/end uptime/loadavg: **not recorded**, explicitly accepted by the operator in ask `ask-b4dec13d243f44fe9c4515f184d84543`; no replay. Task operator's separately supplied observation at **04:13:32Z** was **3.97 / 6.58 / 6.13, 16 CPUs**, after head-12 ended. It is attributed context, not this worker's measurement at head start/end and not a causal explanation.

- Fresh base start, **2026-10-31T04:14:45.279498+00:00**: `04:14:45 up 3 days, 12:07,  0 user,  load average: 1.66, 5.36, 5.74`; `/proc/loadavg: 1.66 5.36 5.74 5/1095 364475`, 16 CPUs.
- Fresh base end, **2026-10-31T04:18:38.649724+00:00**: `04:18:38 up 3 days, 12:10,  0 user,  load average: 5.50, 5.92, 5.91`; `/proc/loadavg: 5.50 5.92 5.91 2/1087 397455`, 16 CPUs.

Raw telemetry: `base-12-fresh.load-start.json`, `.load-end.json`, cell log, and `load-context-note.txt`. No load-based failure classification is asserted.

### Focused/audit gates, helper ownership, cleanup

- `workload-focused`: typecheck/build/pretest then both focused tests on both absolute Nodes, **2 total / 2 pass / 0 fail / 0 skip / 0 cancelled** each; producer/capture 0/0.
- Sixteen `workload-mutant-*` gates: exact exits/counts above. Expected kills and survivors remain separately labelled.
- `workload-observations`: direct mismatch children for pristine, after-create and rvearly on both Nodes; aggregate gate 0 after checking each child's exit 1 and exact expected counters.
- `workload-integrity-audit`: exit 0 verifies clean final head, exact restricted diff, unchanged modes/closure, both commit identities/trailers, source hash equality to focused inputs, raw cell counts/capture/scope values and reused-base identity. **This is an integrity audit, not a passing qualification gate; head-12 remains FAILED.**

All current focused/mutant/observation/audit producers also use dispatch gates, 16G/zero-swap scope, the 3000-second bound and capped capture. Scripts and corresponding raw/result/receipt logs are saved by gate name.

Helper reconciliation: **80 observed PID/start/cgroup identities; 77 ended; 3 unchanged control-infrastructure survivors; zero unexpected/test-helper survivors**. No kill-by-name or inferred ownership cleanup. Snapshots `helpers-*.json/.txt`, source mapping `owned-scope-sources.json`, and final `helper-reconciliation.json` preserve PID, kernel start ticks, UTC start, cgroup, command and final status.

| Full cell | Capture PID | Start ticks | UTC start | Cgroup scope | Final state |
|---|---:|---:|---|---|---|
| head-23 | 300710 | 30219491 | 2026-10-31T04:04:14Z | run-u70696.scope | ended |
| head-12 | 327141 | 30243144 | 2026-10-31T04:08:11Z | run-u70707.scope | ended |
| base-12-fresh | 364452 | 30282513 | 2026-10-31T04:14:45Z | run-u70719.scope | ended |

Scope prefix is `0::/user.slice/user-1002.slice/user@1002.service/app.slice/`; all three recorded **MemoryMax=17179869184, MemorySwapMax=0**. All enumerated owned gate scopes are inactive after completion.

Remaining control identities, not suite helpers:
- PID **291328**, ticks **30192761**, start **2026-10-31T03:59:47Z**, cgroup `0::/user.slice/user-1002.slice/user@1002.service/app.slice/orgasmic-run-0c9eb01950c84b1593b542f4518b55512e66b4cf95006f10ca0cf0692ee25586-run-01M681T4Y5G7VP7ZAQYJ8GM8HN-b24d1c2f00474ec5add0f72642cacbe3.scope`.
- PID **291340**, ticks **30192770**, start **2026-10-31T03:59:47Z**, cgroup `0::/user.slice/user-1002.slice/user@1002.service/app.slice/orgasmic-run-0c9eb01950c84b1593b542f4518b55512e66b4cf95006f10ca0cf0692ee25586-run-01M681T4Y5G7VP7ZAQYJ8GM8HN-b24d1c2f00474ec5add0f72642cacbe3.scope`.
- PID **291563**, ticks **30193130**, start **2026-10-31T03:59:51Z**, cgroup `0::/user.slice/user-1002.slice/user@1002.service/app.slice/orgasmic-run-0c9eb01950c84b1593b542f4518b55512e66b4cf95006f10ca0cf0692ee25586-run-01M681T4Y5G7VP7ZAQYJ8GM8HN-b24d1c2f00474ec5add0f72642cacbe3.scope`.

Observed-activity progress lines at intervals below four minutes are saved in `progress.log`, with active cell, log bytes, latest completed test and observed not-ok count. The reported Node-12 failures were not suppressed.

Reviewer-temp cleanup follows the narrowed instruction: only paths concretely named in preserved captured evidence were eligible. Exact path **/tmp/rv-early-store-HfWt** was already absent. **Nothing deleted**; no owner/lsof check or deletion was attempted on an absent path. The script's XXXX template is not an observed store and was excluded from the final eligible list. No broad /tmp deletion. See `reviewer-store-cleanup.json`; the reviewer counterexample/report was preserved first.

### Qualification decision (separate from observations)

**HELD / BLOCKED.** The required Node-12 head gate has **three conclusive, head-unique failures of unknown cause**. The single fresh matched base passes those same leaves, so none is classified shared. The test-only delta does not touch tune-out (`tune-out-source-diff.txt` is empty); that fact bounds the diff but does **not** prove the failures unrelated or establish their cause. No gate is relabelled PASS.

Per operator instructions: stop without production fixes, timeout changes, head retry or further suites. The bounded fixture fixes and mandated mutant checks are complete, but qualification is not green.

## Unmet Criteria

- Final-head qualification is held by the three Node-12 tune-out timeouts above. They were not reproduced in the single fresh matched base cell. Classification remains **head-unique, unclassified**.
- No in-scope production fix or further rerun is authorized. Local test commits and all observations are preserved for the task operator's next decision.

## Residual Risk

- Two compound marker-machinery mutations still survive; the added LOW comments document, rather than enforce against, removal of the instrumentation's own load-bearing parts.
- Call-site counters qualify only this declared SDK workload. Module loading, all SDK internals and native reader-format compatibility are not claimed.
- One normalizer's byte identity is not whole-package compatibility. AF stays unpinned; future changed bytes require a re-audit, not a silent skip.
- Separately, the task operator's unresolved two-test liveness-watchdog divergence remains tracked. It is distinct from these newly observed head-unique tune-out failures. No causal attribution is made for either.
- Production code, cardinality enforcement, permissions, admission and deferred reader-floor/one-way limitations are unchanged.

BEGIN PR BODY

## Problem and changes

Stacked on **#906 at `869bb3ad`**; merge that first.

Add opt-in per-item `delivery: "context-only"` for `channels/incoming`, with host-owned durable classification. Selected input cannot open/repair channels, move reply anchors, inject into an active answer or wake conversational inference. Required admission may refuse or narrow it, never lift it.

`contextOnlyStorage` remains default-off. Delivery requires MCPL-family advertisement, effective incoming/context-only grants and a validated mode. A per-server `channels.*` pattern includes the leaf when the profile is enabled. Modern-family config acceptance supplies no MCPL grant, mode or fallback wake.

The fork-seed test witness checks normalizer bytes, not the package version. It requires parsed version/integrity/hash evidence, and a changed-byte refusal before the fixture's declared SDK workload calls: create/store acquisition, stamped writes, forks and normalization. All-zero counters are the primary proof; store-directory absence is supplementary. This is not a module-loading I/O or whole-package compatibility claim.

## Compatibility and diagnostic deltas

1. With the profile enabled, `inboundDelivery` is host-reserved on framework writes; profile-off sender metadata retains historical behavior.
2. Top-level `delivery` on push/event is refused before effects as content/state-independent `-32602 unsupported_combination`; notifications are diagnosed.
3. After initial policy, selector-bearing ungranted incoming batches receive ordered `capability_denied` results rather than one capability error. Pre-policy and no-selector behavior remain unchanged.
4. Even with incoming granted, profile-off context-only selection is refused with `capability_denied`; invalid modes get `invalid_delivery`, never an ordinary-input downgrade.
5. Masked local-leaf diagnostics additionally name `channels.contextOnly`, without changing effective grants or denied-capability lists.

Enablement is one-way: older framework rollback is unsupported and would treat stamped rows as conversational. Current dependency APIs lack a minimum-reader gate. Production enablement is separate. The existing MCPL offer builder is used; generic initialize-offer support and a dependency minimum-reader gate remain separate follow-ups. Dependency file:line references were audited at 0.24.1, not re-audited against 0.24.2.

## Qualification — held

Frozen CM 0.24.2 dependency closure, no new install/pin/committed lockfile. Sequential full cells use concurrency 8, 16G/zero-swap scopes, 3000-second bounds and capped capture.

- Fresh Node 22.23.3 head: **9,688 total / 9,625 pass / 0 fail / 63 skipped / 0 cancelled**.
- Fresh Node 22.12.0 head: **9,688 total / 9,622 pass / 3 fail / 63 skipped / 0 cancelled**.
- One separately authorized fresh matched Node 22.12.0 base at `b6e225e0`: **9,687 total / 9,623 pass / 1 fail / 63 skipped / 0 cancelled** (old fixture version assertion).
- Earlier matched base observations on both Nodes are explicitly reused, not fresh runs.

The three head tune-out timeouts pass in that fresh base observation and remain **head-unique, unclassified; qualification is held**. The head result was not retried or relabelled PASS. No production or timeout changes were made.

The Node 22.23.3 zero-fail figure is for this environment; a separate unresolved two-test liveness-watchdog divergence in the task operator's environment remains tracked, without a causal claim.

Focused controls pass on both Nodes. Six mandatory mutants are killed on both: late validation after all fork work, missing evidence, missing hash check, moved marker, validation after create, and validation after stamped writes but before the first fork. Two compound marker-machinery mutations still survive; comments explain why the intercepted-emission coupling and in-normalizer assertion are load-bearing. No stronger coverage claim is made.

Earlier corpus and assistant-metadata controls retain their separately recorded scope; no fresh corpus/live-provider qualification or production enablement is claimed in this test-only round.

AI-assisted implementation with GPT-6.1-Sol; co-author trailers included.

END PR BODY

## Full fixture diff

Exact `git diff b612e866..HEAD` of both changed files follows. No tune-out or production file is touched.

```diff
diff --git a/test/context-only-delivery.test.ts b/test/context-only-delivery.test.ts
index 649a5296..e089bba1 100644
--- a/test/context-only-delivery.test.ts
+++ b/test/context-only-delivery.test.ts
@@ -1,5 +1,5 @@
 /** Context-only v1: synthetic peers on the real loopback transport. */
-import { mkdtempSync, rmSync } from 'node:fs';
+import { existsSync, mkdtempSync, rmSync } from 'node:fs';
 import { tmpdir } from 'node:os';
 import { join } from 'node:path';
 import { execFileSync, spawnSync } from 'node:child_process';
@@ -484,11 +484,13 @@ test('fork seed normalization preserves alignment or refuses before any shifted
   assert(done > start, 'the witness start marker precedes successful completion');
 });
 
-test('changed normalizer bytes fail the fork-seed precondition loudly', () => {
+test('changed normalizer bytes fail the fork-seed precondition loudly', t => {
+  const dir = mkdtempSync(join(tmpdir(), 'context-only-refusal-'));
+  t.after(() => rmSync(dir, { recursive: true, force: true }));
   const result = spawnSync(process.execPath, ['--experimental-test-module-mocks', '--import',
     new URL('./fixtures/context-only-normalizer-read-mismatch.mjs', import.meta.url).pathname,
     new URL('./fixtures/context-only-fork-seed-child.mjs', import.meta.url).pathname],
-  { encoding: 'utf8', timeout: 60_000 });
+  { encoding: 'utf8', timeout: 60_000, env: { ...process.env, FORK_SEED_TEST_DIR: dir } });
   assert.ifError(result.error);
   assert.match(result.stdout, /^CONTEXT_MANAGER_NORMALIZER_EVIDENCE \{[^\n]*\}\n$/,
     'only the evidence line precedes the refusal, before any fork work');
@@ -497,5 +499,10 @@ test('changed normalizer bytes fail the fork-seed precondition loudly', () => {
   assert.match(result.stderr, /normalizer hash contract mismatch; re-audit required/);
   assert.match(result.stderr, /^FORK_SEED_REFUSAL_NORMALIZATIONS 0$/m,
     'changed bytes are refused before the first real normalization invocation');
+  const work = result.stderr.match(/^FORK_SEED_REFUSAL_WORK (\{[^\n]*\})$/m);
+  assert(work, 'the refusal records every declared SDK workload counter');
+  assert.deepEqual(JSON.parse(work[1]!), { creates: 0, seedWrites: 0, forks: 0, contextOpens: 0, normalizations: 0 },
+    'the hash refusal precedes create/store acquisition, stamped writes, forks and normalization');
+  assert(!existsSync(join(dir, 'store')), 'no workload store directory was created before refusal');
   assert(!result.stdout.includes('FORK_SEED_ALIGNMENT_OK'), 'the hash precondition fails before the fork witness runs');
 });
diff --git a/test/fixtures/context-only-fork-seed-child.mjs b/test/fixtures/context-only-fork-seed-child.mjs
index 403c7a09..8e8c2ed5 100644
--- a/test/fixtures/context-only-fork-seed-child.mjs
+++ b/test/fixtures/context-only-fork-seed-child.mjs
@@ -26,14 +26,20 @@ for (const [relative, source] of [['../../.package-lock.json', 'node_modules/.pa
 }
 const normalizerHash = createHash('sha256').update(readFileSync(new URL('./normalize-tool-messages.js', packageEntry))).digest('hex');
 let normalizations = 0;
+const workload = { creates: 0, seedWrites: 0, forks: 0, contextOpens: 0 };
+// Count entry to the declared SDK calls, preserving their receiver, return and throw.
+const observe = (step, call) => { workload[step]++; return call(); };
 process.on('uncaughtExceptionMonitor', () => {
   console.error('FORK_SEED_REFUSAL_NORMALIZATIONS ' + normalizations);
+  console.error('FORK_SEED_REFUSAL_WORK ' + JSON.stringify({ ...workload, normalizations }));
 });
 console.log('CONTEXT_MANAGER_NORMALIZER_EVIDENCE ' + JSON.stringify({
   version: manifest.version, integrity, integritySource, normalizerSha256: normalizerHash,
   note: 'Identical normalizer bytes do not establish whole-package compatibility.',
 }));
 let witnessStarted = false;
+// Set the flag only through the intercepted emission, never a bare assignment:
+// otherwise a marker relocated below the workload could satisfy the flag check.
 const witnessLog = console.log;
 console.log = (...args) => {
   if (args[0] === 'FORK_SEED_WITNESS_STARTED') witnessStarted = true;
@@ -48,6 +54,7 @@ mock.module('@animalabs/context-manager', { namedExports: { ...contextManager,
     normalizations++;
     // Observe the first real fork-seed normalization, not fixture setup.
     if (normalizations === 1) console.log('FORK_SEED_WITNESS_STARTED');
+    // This load-bearing check kills a marker moved out of the normalizer.
     assert(witnessStarted, 'the start marker must precede real normalization work');
     assert.deepEqual(messages.slice(0, 2).map(message => message.inheritedDelivery.mode), ['normal', 'context-only']);
     const normalized = contextManager.stripUnpairedToolBlocks(messages);
@@ -57,37 +64,41 @@ mock.module('@animalabs/context-manager', { namedExports: { ...contextManager,
 } });
 const { AgentFramework } = await import('../../src/framework.js');
 const { MockMembrane } = await import('../helpers/mock-membrane.js');
-const dir = mkdtempSync(join(tmpdir(), 'context-only-fork-seed-'));
+const dir = process.env.FORK_SEED_TEST_DIR ?? mkdtempSync(join(tmpdir(), 'context-only-fork-seed-'));
 let framework;
 try {
-  framework = await AgentFramework.create({
+  // This create call includes acquisition of the store at storePath.
+  framework = await observe('creates', () => AgentFramework.create({
     storePath: join(dir, 'store'), membrane: new MockMembrane().asMembrane(), modules: [],
     agents: [{ name: 'template', model: 'test', systemPrompt: 'Template' }],
     contextOnlyStorage: true,
     conversations: { templateAgent: 'template', bind: { channel: 'always' }, trigger: { channel: 'always' } },
-  });
+  }));
   const source = framework.getAgent('template').getContextManager();
-  source.addMessage('template', [{ type: 'text', text: 'ordinary seed' }],
-    { inboundDelivery: { version: 1, mode: 'normal', conversational: false } });
-  source.addMessage('user', [{ type: 'text', text: 'restricted seed' }],
-    { inboundDelivery: { version: 1, mode: 'context-only', conversational: false } });
+  observe('seedWrites', () => source.addMessage('template', [{ type: 'text', text: 'ordinary seed' }],
+    { inboundDelivery: { version: 1, mode: 'normal', conversational: false } }));
+  observe('seedWrites', () => source.addMessage('user', [{ type: 'text', text: 'restricted seed' }],
+    { inboundDelivery: { version: 1, mode: 'context-only', conversational: false } }));
   const home = { serverId: 'endpoint', channelId: 'room' };
-  const preserved = await framework.createConversationAgent('fork-preserved', home);
+  const preserved = await observe('forks', () => framework.createConversationAgent('fork-preserved', home));
   assert.deepEqual(preserved.getContextManager().getAllMessages().map(row => row.metadata.inboundDelivery),
     [{ version: 1, mode: 'normal', conversational: false }, { version: 1, mode: 'context-only', conversational: false }]);
   dropFirst = true;
-  await assert.rejects(framework.createConversationAgent('fork-dropped', home), /seed normalization changed message count/);
+  await assert.rejects(observe('forks', () => framework.createConversationAgent('fork-dropped', home)), /seed normalization changed message count/);
   assert.equal(normalizations, 2, 'both preserving and dropping normalizers ran at the real fork boundary');
   assert.equal(framework.getAgent('fork-dropped'), null);
   assert.equal(framework.usedEphemeralAgentNames.has('fork-dropped'), false);
-  const failed = await contextManager.ContextManager.open({
+  const failed = await observe('contextOpens', () => contextManager.ContextManager.open({
     store: framework.getStore(), namespace: 'conversations/fork-dropped', isolate: true,
     strategy: new contextManager.PassthroughStrategy(),
-  });
+  }));
   try { assert.deepEqual(failed.getAllMessages(), [], 'no misaligned normal stamp is persisted before refusing the fork'); }
   finally { failed.close(); }
+  assert.deepEqual(workload, { creates: 1, seedWrites: 2, forks: 2, contextOpens: 1 },
+    'the positive witness exercises every declared SDK workload counter');
   console.log('FORK_SEED_ALIGNMENT_OK');
 } finally {
   await framework?.stop();
-  rmSync(dir, { recursive: true, force: true });
+  // A supplied directory belongs to the parent, which checks it before cleanup.
+  if (!process.env.FORK_SEED_TEST_DIR) rmSync(dir, { recursive: true, force: true });
 }

```
