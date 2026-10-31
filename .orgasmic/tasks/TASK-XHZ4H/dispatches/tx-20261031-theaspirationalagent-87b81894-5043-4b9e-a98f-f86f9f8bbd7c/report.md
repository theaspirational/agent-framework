# Fork-seed witness enforcement

## Changed

- Starting head: `93932bae02b35584530840a5683abc7376baac6e`.
- Final head: **`b612e8664c89c4f61c5c4ad69def914deb9889b4`**.
- Read the complete hash-fix review; SHA-256 `9c5f0580a56331d3543bd506bd8fb4cce755927bccf6d88ca2f7985e9cfd1160`.
- Current-round patch: `enforcement.diff` — 3 files, +40/-4: the parent test, fork-child test fixture, and context-only documentation. No `src/`, production guard, dependency declaration, lockfile or file-mode change; no installed package source edits, install, push or public action.
- Five additive commits, no rewriting: `6fd3c052` (evidence assertions), `162f9203` (historical audit scope), `33a2d1df` (observable witness boundary), `62a6d9f3` (actual emission observation), `b612e866` (marker in the real normalizer invocation; zero-invocation refusal assertion). All author/committer identities and co-author trailers match the brief; see `commit-identities.txt`.
- The additional marker work followed task operator Tarn's answer to `ask-758e21c51d93492daa038c789f97cb8b`, followed by Soma's programme-qualification clarification relayed by Tarn. These are engineering calls by the task operator/programme qualifier, **not a decision or consent by human owner Vasyl**.

| Finding / addition | Disposition |
|---|---|
| M1: refusal before real fork work | Exact evidence-only mismatch stdout; specific exit/message; stderr normalization count must be zero. Marker is emitted inside the mocked normalizer on its first actual invocation, not at fixture setup. Real fork-before-hash mutant killed on both Nodes. |
| M2: evidence enforcement | Both paths require an evidence line, parse JSON, and validate version, integrity (string or explicit null), and 64-digit SHA-256. Missing evidence cannot print undefined and pass. Deletion mutant killed on both Nodes. |
| LOW: historical dependency audit | Docs explicitly identify the file:line evidence as CM 0.24.1 and not re-audited against 0.24.2. Maintainer question unchanged. |
| LOW: environment-bound PR claim | Updated PR qualification states this environment's zero-fail results and the separate unresolved two-test watchdog divergence. |
| LOW: production comment | Deferred exactly as instructed: the stale version label in `src/framework.ts` is unchanged; no `src/` diff. |
| Additional marker-move control | Move only the emitted marker below real witness work; positive test fails on both Nodes. This is additional to, not a substitute for, the real hash-reordering mutant. |

### Control and mutant evidence

The hash contract remains `dcfff6de61ea5e77ea2d75100a29021d79ba1e45844302cd8b34ffcc2526701a`. Version and integrity remain evidence, not preconditions. **Identical normalizer bytes do not establish whole-package compatibility.**

Direct changed-byte probes on both Nodes record child **exit 1**, stdout containing exactly the evidence line, **zero witness-start markers**, and stderr `FORK_SEED_REFUSAL_NORMALIZATIONS 0` plus the specific hash-contract refusal. Changed in-memory bytes hash to `5cb74f70739fe3f8fdb3980e3518102e47337c135a18ce7e70dfd698b7b12b5c`. Installed files are untouched. See `invocation-refusal.log`, `refusal-{23,12}.stdout` and `.stderr`.

The positive test requires evidence → actual first-normalization marker → successful completion. The normalizer wrapper itself requires the marker to have been emitted before running normalization work. The existing preserving/drop-one cardinality assertions still execute; production enforcement is unchanged.

**Initial survivors are retained, not hidden:** at intermediate `162f9203`, the reviewer's real fork-before-hash mutant still survived on both Nodes (test exit **0**, 2 total / 2 pass / 0 fail). Exact stdout alone was insufficient because ordinary framework diagnostics went to stderr. These observations and their diffs/results are retained under `mutants-initial/`; `mutant-results.json` records the two survivors. Intermediate top-level-marker controls at `62a6d9f3` are retained under `mutants-top-marker/` and are **not** used as final actual-invocation evidence.

At final `b612e866`, the reviewer's reorder is unchanged in substance: only the hash assertion moves to immediately before the final completion log, **after both real forks, the cardinality assertions and store re-open**. The marker remains in the real normalizer wrapper. See `invocation-mutant-reorder.diff`. Pure evidence-deletion removes only its console.log block; marker-move preserves the conditional with `void 0` and moves only the marker console statement. No mutant modifies tracked source or dependencies.

Additional direct late-guard observation confirms the reorder is real: on changed bytes, both Nodes reach **two actual normalizer invocations**, emit the entry marker once, then exit 1 at the moved hash assertion. See `invocation-late-guard-observation.log` and `late-guard-{23,12}.{stdout,stderr}`. This contrasts with the pristine guard's zero invocations; no print-order substitute is used.

| Final mutant | Node | Exact test / gate exit | Total | Pass | Fail | Skip | Cancelled | Result |
|---|---|---|---:|---:|---:|---:|---:|---|
| reorder | 22.23.3 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| no-evidence | 22.23.3 | 1 / 1 | 2 | 0 | 2 | 0 | 0 | killed |
| no-hash | 22.23.3 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| marker-move | 22.23.3 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| reorder | 22.12.0 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| no-evidence | 22.12.0 | 1 / 1 | 2 | 0 | 2 | 0 | 0 | killed |
| no-hash | 22.12.0 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |
| marker-move | 22.12.0 | 1 / 1 | 2 | 1 | 1 | 0 | 0 | killed |

**Final survivors: none.** All eight final mutant test exits are exactly **1**, capture exits 0, no cap hit, no cancellation, all conclusive. Expected mutant-failing gates are not suite passes; the aggregation controller exit 0 verifies their expected failure signatures.

Failure names:
- `reorder` and `no-hash`, both Nodes: **changed normalizer bytes fail the fork-seed precondition loudly**.
- `no-evidence`, both Nodes: that test plus **fork seed normalization preserves alignment or refuses before any shifted normal classification is stored**.
- `marker-move`, both Nodes: **fork seed normalization preserves alignment or refuses before any shifted normal classification is stored**.

Raw per-mutant logs/results/diffs: `invocation-mutant-<mutation>-<23|12>.log`, `.result.json`, `.gate.log`, and `invocation-mutant-<mutation>.diff`; aggregate `invocation-mutant-results.json` / `invocation-mutant-exits.txt`. Pristine final focused gate `invocation-focused` first ran typecheck/build/pretest and both focused tests on each Node: **2 total / 2 pass / 0 fail / 0 skip / 0 cancelled** each.

## Verification Gates

### Frozen dependency closure and executable identity

**No npm install ran this round.** The one install from the preceding fixture round supplied the same physical closure to the matched base and current fix. Current tests run in the detached, clean checkout `data/enforcement-final-head` at final head; its `node_modules` resolves to `data/fixture-closure/node_modules`. Builds stay in checkout `dist/`, not evidence.

| Evidence | Value |
|---|---|
| Generated uncommitted lock SHA-256 | `df14aa0a57fd237393e3853956707ecbb31e93952504dcba24e9a971eb022578` |
| Complete npm graph SHA-256 | `ddab82bf8e2cfab56aa37eb750bb2b8e94c915fd8806e57011ae2ab2b919d25a` |
| Closure manifest SHA-256 (7,332 files/symlinks, hashes/targets/modes) | `dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01` |
| Actual CM version | **0.24.2** |
| CM integrity, from installed `node_modules/.package-lock.json` | `sha512-TiS7kX6L5/AMqmYPVqI5XHXaDxTfnS6ca6d4LL8Yhs7lbApS40qa6deVP0QOeCN9UpxmGRh02jcuVFaOTANDgQ==` |

Saved verbatim as `frozen-package-lock.json`, `frozen-npm-ls-all.json`, `frozen-node-modules-manifest.json`. Manifest matches before/after both fresh cells and the final integrity gate. Each cell's JSON includes the installed CM evidence; both full logs contain the asserted positive and mismatch evidence lines.

Absolute executable paths, full binary hashes and `node --version` are recorded **before npm/test** in each cell:

| Executable | Version | SHA-256 |
|---|---|---|
| `/opt/node-v22.23.3-linux-x64/bin/node` | v22.23.3 | `fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48` |
| `/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin/node` | v22.12.0 | `177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9` |

### Reused base observations — not fresh executions

Base remains **`b6e225e07a8214894c3f721dfb14ac0c1cf75714`**. Both old base cells are explicitly **reused failed-base observations**, not passing receipts. Their code/node/closure/concurrency/options identity is checked by `base-reuse-proof.py`; refreshed successfully by `enforcement-final-integrity`.

| Reused cell | Code | Node SHA-256 | Closure manifest | AF_TEST_CONCURRENCY | NODE_OPTIONS | Identical? |
|---|---|---|---|---|---|---|
| base-23 | `b6e225e07a8214894c3f721dfb14ac0c1cf75714` | `fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48` | `dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01` | 8 | unset | yes |
| base-12 | `b6e225e07a8214894c3f721dfb14ac0c1cf75714` | `177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9` | `dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01` | 8 | unset | yes |

The unchanged runner's SHA-256 is `55628eda93a59a5c0f27bfbf0a11b553748acc58684096ab1968d16d45b2b7b7`; its byte equality against the prior runner proves the same AF concurrency export and explicit NODE_OPTIONS removal. The base worktree is still clean at that commit. Saved old before/after manifests match the freshly measured closure, and both executable hashes/version strings match the old preflight logs. Machine-readable proof: `base-reuse-proof.json`; current gates `frozen-base-reuse-proof` and `enforcement-final-integrity`.

Source logs/results are in **`/home/orgasmic/.orgasmic/runs/run-01M67T7WWFXPBXDR04N3CY5RQR/evidence`** as `base-23.log`, `base-12.log` and corresponding `.result.json`, `.capture.json`, `.gate.log` files. Nothing here labels those tests freshly executed. Earlier CM **0.24.1** passes are not reused for qualification of this **0.24.2** closure. The first static proof attempt was launched from the assigned root with an ambient 0.24.1 collector label; it ran no tests. The corrected `frozen-base-reuse-proof` and all reported test/mutant cells run on the frozen 0.24.2 closure.

### Full qualification cells — fresh heads sequential, no retries

Exact fresh command, cwd = tested detached checkout at `b612e866`:

```sh
orgasmic dispatch gate qualified-<head-23|head-12> --   systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0   bash "$ORGASMIC_EVIDENCE_DIR/capture-cell.sh" <cell>   bash "$ORGASMIC_EVIDENCE_DIR/run-cell.sh" <absolute-node> <cell> <final-head>
```

The identical producer runs clean → typecheck → build → full `npm test`, exports **AF_TEST_CONCURRENCY=8**, and unsets NODE_OPTIONS. `capture-cell.sh` surrounds the entire producer with `timeout --signal=TERM --kill-after=60s 3000s`, captures at most **64 MiB**, keeps draining after a cap, and preserves separate producer/log-capture **PIPESTATUS**. Exit 124/137/141, cap hit or nonzero/missing capture status is **INCONCLUSIVE**, never accepted as a pass. No such condition occurred.

Observed order this round: **head-23 (03:38:25–03:42:21 UTC) → head-12 (03:42:21–03:46:18 UTC)**; one execution each, no retries. `matrix-owner.log` and `matrix-exits.txt` record the transitions and exact gate exits.

| Cell | Evidence status | Producer / npm exit | Total | Pass | Fail | Skip | Cancelled | Capture exit | Cap | Log bytes |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|
| base-23 | reused | 1 / 1 | 9687 | 9623 | 1 | 63 | 0 | 0 | no | 4,285,656 |
| base-12 | reused | 1 / 1 | 9687 | 9623 | 1 | 63 | 0 | 0 | no | 4,120,378 |
| head-23 | fresh | 0 / 0 | 9688 | 9625 | 0 | 63 | 0 | 0 | no | 4,286,988 |
| head-12 | fresh | 0 / 0 | 9688 | 9625 | 0 | 63 | 0 | 0 | no | 4,121,687 |

All four observations are conclusive. Exact full-suite failure names:
- **base-23 (reused)** and **base-12 (reused)**: `fork seed normalization preserves alignment or refuses before any shifted normal classification is stored` — old version pin, actual `'0.24.2' !== '0.24.1'`. No other failed name.
- **head-23 (fresh)** and **head-12 (fresh)**: **none**.

Each fresh cell's typecheck and build exited 0 before npm test. Current raw artifacts: `head-{23,12}.log`, `.result.json`, `.capture.json`, `.gate.log`, and before/after closure manifests. Dispatch receipts: `gate-qualified-head-23-*.log` and `gate-qualified-head-12-*.log`.

### Other current-round gates

All final focused/mutant/observation/integrity commands also use dispatch gates, the same 16G/zero-swap scope and bounded capture wrapper. Producers:
- `invocation-focused`: `bash final-focused.sh` — typecheck/build/pretest plus two focused tests per Node, exit 0.
- `invocation-mutant-<mutation>-<23|12>`: `bash mutant-test.sh <absolute-node> <mutation>` — exact failing test exits in the table, all 1; all eight killed.
- `invocation-refusal`: `bash observe-refusal.sh` — direct mismatch children; gate exit 0 after asserting each child's exit 1 / zero real invocations.
- `invocation-late-guard-observation`: `env -u NODE_OPTIONS AF_TEST_CONCURRENCY=8 python3 observe-late-guard.py` — gate exit 0 after asserting both changed-byte late-guard children run two real normalizations and then exit 1.
- `enforcement-final-integrity`: `python3 final-integrity.py <assigned-root>` — exit 0; verifies restricted diff, unchanged modes/closure, clean final head, all five commit identities/trailers, full-cell counts/capture/scope limits, base reuse identity, and helper reconciliation.

Their command scripts, `.gate.log` receipt locations, raw logs, capture metadata and result JSON are kept in this evidence directory. Initial and intermediate results are kept separately as described above; no earlier gate pass is represented as a fresh final-head execution.

### Process ownership, survivors and progress

Ownership snapshots `helpers-before.json`, `helpers-after-initial-mutants.json`, `helpers-head-23.json`, `helpers-head-12.json`, `helpers-after.json` record **PID + kernel start ticks + UTC start + cgroup**, not just process names. `owned-scope-sources.json` links gate scopes to our receipt logs. `helper-reconciliation.json` compares the same identities against /proc and queries our prior/current gate scopes.

- **47 observed identities; 44 ended; zero unexpected/test-helper survivors.** No process was killed by name or presumed ownership.
- Node 22.23.3 gate scope: `run-u70455.scope`; capture PID **65677**, start ticks **30064538** (03:38:25Z); timeout PID **65678**, ticks **30064540**. All ended.
- Node 22.12.0 gate scope: `run-u70482.scope`; capture PID **93231**, ticks **30088101** (03:42:21Z); timeout PID **93235**, ticks **30088102**. All ended.
- Both cgroups have prefix `0::/user.slice/user-1002.slice/user@1002.service/app.slice/` followed by their scope name. Recorded live scope limits: **MemoryMax=17179869184, MemorySwapMax=0** (`scope-limits.json`).
- The only three surviving observed identities are the unchanged control infrastructure, not suite helpers: PID **4189523** / start **29982162** / 03:24:41Z; PID **4189598** / **29982174** / 03:24:41Z; PID **4190453** / **29982719** / 03:24:47Z. Their exact common cgroup is:
  `0::/user.slice/user-1002.slice/user@1002.service/app.slice/orgasmic-run-0c9eb01950c84b1593b542f4518b55512e66b4cf95006f10ca0cf0692ee25586-run-01M67ZSW69W73G44KPCTCACQ7Z-9ea123c941f342bdb40dcbfe15aac08b.scope`.
- All enumerated owned gate scopes are inactive after completion. The final integrity gate itself then exited 0.

Observed-activity progress was reported during the full cells at 03:38, 03:40, 03:43 and 03:45 UTC, then completion; raw timestamps/log bytes/latest completed tests are in `progress.log`. The recorded gaps during full execution are below 4 minutes.

## Unmet Criteria

None for this test-enforcement round. The production-comment LOW is explicitly a separate follow-up, not an unauthorized source edit. All required final mutants are killed; both fresh head cells pass, and the reused matched base failures are identified exactly.

## Residual Risk

- The **0-fail figures apply to this environment**. A separate unresolved liveness-watchdog divergence in the task operator's environment (`watchdog kills a wedged process`, `watchdog aborts a wedged process`) is being tracked separately; no root-cause or dismissal is claimed.
- One normalizer's byte identity is not whole-package compatibility or live integration qualification. CM file:line references in the maintainer question remain the historical 0.24.1 audit, not a new 0.24.2 audit.
- AF remains unpinned; a future different normalizer correctly fails this explicit precondition and requires re-auditing. The frozen lock/closure are qualification evidence, not committed dependency policy.
- No production behavior, guard, permissions, startup policy, admission design or reader-floor limitation changes. Earlier corpus/store/integration evidence retains its original scope and dependency versions; no fresh corpus or live-provider execution is claimed here.

BEGIN PR BODY

## Problem and changes

Stacked on **#906 (required inbound admission) at `869bb3ad`**; merge that first.

Add opt-in `channels/incoming` per-item `delivery: "context-only"` with host-owned durable classification. Selected input cannot open/repair channels, move reply anchors, inject into an active answer, reset explicit-send suppression or wake conversational inference. Required admission may refuse or narrow it, never lift it.

`contextOnlyStorage` remains default-off. Delivery requires the MCPL-family advertisement, both effective grants and a validated mode; an existing per-server `channels.*` opt-in counts when storage is enabled. Modern-family acceptance of those configuration patterns supplies no MCPL grant, mode or fallback wake.

Fork seeding refuses a normalization cardinality change before writing shifted classifications. The dependency-boundary witness checks the normalizer hash contract, not an incidental package version; test output must record parsed version/integrity/hash evidence. A different-byte control requires a loud refusal before the first real fork normalization. All four enforcement mutants are killed on both Nodes: late hash validation after real fork work, missing evidence, missing hash check, and a delayed actual-entry marker. Identical normalizer bytes do **not** establish whole-package compatibility.

## Compatibility and diagnostic deltas

1. With the profile enabled, `inboundDelivery` is host-reserved on framework message-write paths; with it off, historical sender values remain unchanged.
2. Any top-level `delivery` on push/event is refused before taps/effects as content/state-independent `-32602 unsupported_combination`; notifications are diagnosed. No-field push retains its behavior.
3. After initial policy, an ungranted incoming batch carrying any item `delivery` field receives ordered `capability_denied` results instead of the single capability error. Before initial policy, the phase-aware error remains; no-field batches retain the existing error.
4. Even with incoming granted, profile-off context-only selection is refused with `capability_denied`; invalid modes get `invalid_delivery`, never a downgrade to ordinary input.
5. Masked local-leaf diagnostics additionally name `channels.contextOnly` in logs/operator status, without changing effective grants or denied-capability lists.

**One-way enablement:** rollback to older framework code is unsupported and would treat stamped rows as conversational; current dependency open APIs lack a minimum application-reader gate. The reader-floor shortcut assumes v1 only; unreadable branches and loss of the sole floor-bearing branch remain limitations. Production enablement is separate.

## Qualification

The fixture qualification uses one frozen resolved closure from the preceding single install, no further install or dependency pin, concurrency 8, 16G/zero-swap user scopes, a 3000-second timeout and bounded capture. Actual CM resolution is **0.24.2**, with the hash-bound normalizer. The maintainer question's dependency file:line references were collected at **0.24.1**, not re-audited against **0.24.2**.

Matched base observations at `b6e225e0` are **reused**, after checking identical source, Node executable hashes, closure manifest, AF concurrency and NODE_OPTIONS; current-head cells at `b612e866` ran freshly and sequentially, once each:

- Node 22.23.3: reused base **9,687 total / 9,623 pass / 1 fail / 63 skipped / 0 cancelled**; fresh head **9,688 total / 9,625 pass / 0 fail / 63 skipped / 0 cancelled**.
- Node 22.12.0: reused base **9,687 total / 9,623 pass / 1 fail / 63 skipped / 0 cancelled**; fresh head **9,688 total / 9,625 pass / 0 fail / 63 skipped / 0 cancelled**.

The zero-fail figures are for this environment; a separate unresolved two-test liveness-watchdog divergence in the task operator's environment is being tracked separately.

The sole matched base failure is the old fixture's version-string assertion. Both fresh head cells also pass typecheck/build; all captures are complete and below the cap. The changed-byte control is an in-memory read mock and never edits installed files. The original production guard remains unchanged.

Earlier expanded no-config corpus and ordinary assistant-metadata controls retain their separately recorded scope; no fresh corpus execution is claimed for this fixture-only change.

## Maintainer questions and limits

The capability offer currently uses the existing typed MCPL offer builder; generic initialize-extension offer support belongs to the separate initialize-offer slice. The current context-manager/Chronicle open path lacks a minimum-reader/classification gate, so old-code rollback after enablement is unsupported. A companion minimum-reader gate remains follow-up work, not a dependency change here.

No live-provider qualification, production enablement, dependency reader-floor backport or generic initialize-offer facility is included.

AI-assisted implementation with GPT-6.1-Sol; co-author trailers included.

END PR BODY
