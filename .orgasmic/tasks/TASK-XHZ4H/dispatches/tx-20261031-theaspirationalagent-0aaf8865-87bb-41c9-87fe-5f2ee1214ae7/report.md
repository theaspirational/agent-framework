# Fork-seed fixture qualification

## Changed

- Matched base: `b6e225e07a8214894c3f721dfb14ac0c1cf75714`.
- Fix head: **`93932bae02b35584530840a5683abc7376baac6e`**.
- `87314602`: replace the CM version-string precondition with the existing normalizer SHA-256 contract; record actual version and available installed-package/lock integrity in test output.
- `93932bae`: add a discriminating one-byte in-memory read mock and a test requiring a loud precondition failure.
- Both commits use author/committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` and the requested GPT-6.1-Sol co-author trailer. Exact metadata: `commit-identities.txt`; complete patch: `fix.diff`.
- No production code, framework guard, dependency declaration, committed lockfile, permission or admission change. Only `test/context-only-delivery.test.ts`, its fork child fixture, and the new read-mock fixture changed. No push or public action.
- The engineering choice was Soma's (programme qualifier), passed on by Tarn (task operator); it was **not** a decision or consent of human owner Vasyl.

### Fixture contract and discriminating controls

The fixture accepts normalizer SHA-256 **`dcfff6de61ea5e77ea2d75100a29021d79ba1e45844302cd8b34ffcc2526701a`**, regardless of the resolved package version. Version and integrity are evidence only. Both positive and negative test output include `CONTEXT_MANAGER_NORMALIZER_EVIDENCE` with actual version, integrity, its source and measured normalizer hash.

**Identical normalizer bytes do not establish whole-package compatibility.** This limitation is explicit in the fixture comment and emitted JSON. The production cardinality guard is unchanged.

| Control | Observed result |
|---|---|
| Expected bytes on the frozen 0.24.2 closure | Focused test passes and completes real fork seed alignment/refusal assertions. |
| Different bytes | A test-only preload mocks the normalizer's file read, adding one newline byte in memory. Measured hash becomes `5cb74f70739fe3f8fdb3980e3518102e47337c135a18ce7e70dfd698b7b12b5c`. The child exits **1** with `normalizer hash contract mismatch; re-audit required`, before the fork witness runs. The parent requires this exact failure, not a skip. |
| Hash-check-removal mutant | Only the hash assertion is removed in a generated fixture copy. The child now exits 0 even on changed bytes, so the discriminating parent test fails with `changed bytes must fail the normalizer precondition`. Raw test exit **1**, exactly one failed test; wrapper exit 0 means **mutant killed**, not that the mutant passes the suite. |

Control artifacts: `fixture-focused.log` (2/2 pass), `fixture-focused.result.json`, `fixture-mutant.log`, `fixture-mutant.result.json`, `mutant-raw.log`, and `mutant.diff`. Installed package sources are never modified. Generated mutant files are outside tracked source and removed by the subsequent clean build.

## Verification Gates

### Executable preflight

Full SHA-256 and `node --version` were recorded **before npm/install/test**, and again at each cell's start:

| Executable | Version | SHA-256 |
|---|---|---|
| `/opt/node-v22.23.3-linux-x64/bin/node` | 22.23.3 | `fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48` |
| `/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin/node` | 22.12.0 | `177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9` |

Preflight gate: `node-binary-preflight`; log `node-binary-preflight.log`.

### One frozen resolved dependency closure

Exactly **one** `npm install` ran, in a fresh detached base checkout with no pre-existing lockfile or node_modules. Its exit was 0; `npm ls --all --json` exited 0. No subsequent install, re-resolution or retry was used for either checkout or Node version.

- Generated lock: `frozen-package-lock.json`, SHA-256 **`df14aa0a57fd237393e3853956707ecbb31e93952504dcba24e9a971eb022578`**.
- Complete resolved graph: `frozen-npm-ls-all.json`; its SHA-256 is recorded in `npm-ls-sha256.txt`.
- Resolved CM: **0.24.2**; integrity **`sha512-TiS7kX6L5/AMqmYPVqI5XHXaDxTfnS6ca6d4LL8Yhs7lbApS40qa6deVP0QOeCN9UpxmGRh02jcuVFaOTANDgQ==`**.
- Installed normalizer bytes match the hash contract above.
- Shared physical closure: base checkout `data/fixture-closure/node_modules`; fix checkout `data/fixture-head/node_modules` points to that exact directory. The saved lock is evidence, not committed and not a new AF dependency pin.
- Before/after each cell, a manifest compares **7,332 files/symlinks**, their hashes/targets and modes, against `frozen-node-modules-manifest.json` (manifest SHA-256 `dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01`). All four before/after manifests match the frozen manifest byte-for-byte.

Install gate: `frozen-dependency-install`; logs `frozen-install.log` and `frozen-install-gate.log`. The generated lock and `npm ls` graph are saved verbatim; no dependency/build cache is stored in evidence.

### Matched qualification cells — sequential, no retries

Order: **base-23 → head-23 → base-12 → head-12**. Each cell's actual cwd is the tested checkout. The producer runs clean → typecheck → build → `npm test`, with **AF_TEST_CONCURRENCY=8** and NODE_OPTIONS unset.

Exact wrapper shape:

```sh
orgasmic dispatch gate qualified-<cell> -- \
  systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 \
  bash "$ORGASMIC_EVIDENCE_DIR/capture-cell.sh" <cell> \
  bash "$ORGASMIC_EVIDENCE_DIR/run-cell.sh" <absolute-node> <cell> <commit>
```

Inside `capture-cell.sh`, the whole producer is bounded by:

```sh
timeout --signal=TERM --kill-after=60s 3000s <producer> 2>&1 | <64-MiB bounded capture>
```

The capture continues draining after its limit rather than causing SIGPIPE. Producer and capture `PIPESTATUS` are preserved separately. A timeout/signal exit **124/137/141**, cap hit, or nonzero/missing log-capture status is explicitly **inconclusive**, never a pass. No retry-until-green was performed.

| Cell | Producer / npm test exit | Tests | Pass | Fail | Skip | Cancelled | log_capture | Cap hit | Conclusive |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| base-23 | 1 / 1 | 9687 | 9623 | 1 | 63 | 0 | 0 | False | True |
| head-23 | 0 / 0 | 9688 | 9625 | 0 | 63 | 0 | 0 | False | True |
| base-12 | 1 / 1 | 9687 | 9623 | 1 | 63 | 0 | 0 | False | True |
| head-12 | 0 / 0 | 9688 | 9625 | 0 | 63 | 0 | 0 | False | True |

Failure names (verbatim TAP):

- **base-23**: fork seed normalization preserves alignment or refuses before any shifted normal classification is stored
- **head-23**: no failure names.
- **base-12**: fork seed normalization preserves alignment or refuses before any shifted normal classification is stored
- **head-12**: no failure names.

Logs/results are `<cell>.log`, `<cell>.capture.json`, `<cell>.result.json`, `<cell>.gate.log` and corresponding dispatch receipt logs. The cell JSON includes exact producer exit, npm test exit, counts, failure names, capture status and byte totals; no truncated result is silently accepted. `run-matrix.sh` records sequential transitions and exits in `matrix-owner.log` / `matrix-exits.txt`.

Observed progress was reported at intervals ≤4 minutes; raw observations (timestamp, active cell, log bytes, latest completed test, observed failure count) are saved in `progress.log`.

### Final integrity check

Gate `fixture-final-integrity` passed with producer/capture exits **0/0** and no cap hit (`final-integrity.log`, `final-integrity-gate.log`). It verifies zero production/dependency-declaration diff, unchanged existing file modes, exactly two correctly attributed commits, all eight before/after closure manifests, all four 16-GiB scopes and the unchanged generated lock.

The largest interval between recorded progress observations was **206 seconds**, below the required 240 seconds. Scope snapshots are in `scope-limits.json`. Captured cell bytes: base-23 **4,285,656**, head-23 **4,278,650**, base-12 **4,120,378**, head-12 **4,115,017** — all below 64 MiB.

Both base logs show the actual failure `'0.24.2' !== '0.24.1'` at the original fixture version assertion. Both head logs pass that same fork witness plus the additional different-byte precondition control. No other failure name appeared.

### Inherited evidence and limits

No old pass is reused as a fresh execution. Earlier reports used an installed **0.24.1** closure; those gates cannot qualify this newly frozen **0.24.2** closure. The reported fresh-install failure motivated this round; the matched base cells above independently reproduce or refute it under exactly the same closure as the fix cells. The separate earlier store-probe input is not used as compatibility evidence here.

The earlier repository instructions remain applicable. Long-command ownership and receipt rules were read for the new bounded/sequential gate workflow. No manager startup scans were replayed.

## Unmet Criteria

None within this fixture round. All four cells are complete and conclusive. Both matched bases reproduce only the version-string fixture failure; both fix-head cells pass. No retries, skips, dependency pin, production-guard edit or permission change was used.

## Residual Risk

- Matching one module's bytes is not whole-package compatibility or live-provider/integration qualification. The matched AF suites qualify only the resolved closure and checks recorded above.
- A future changed normalizer fails the explicit precondition and requires re-auditing the witness; it is not silently skipped or accepted.
- The in-memory byte control checks the hash precondition, while the existing element-dropping stub checks the separate production cardinality guard. Neither changes installed files.
- Existing default-off/one-way storage limitations and deferred work are unchanged; no production behavior or dependency permission was modified.

BEGIN PR BODY

## Problem and changes

Stacked on **#906 (required inbound admission) at `869bb3ad`**; merge that first.

Add opt-in `channels/incoming` per-item `delivery: "context-only"` with host-owned durable classification. Selected input cannot open/repair channels, move reply anchors, inject into an active answer, reset explicit-send suppression or wake conversational inference. Required admission may refuse or narrow it, never lift it.

`contextOnlyStorage` remains default-off. Delivery requires the MCPL-family advertisement, both effective grants and a validated mode; an existing per-server `channels.*` opt-in counts when storage is enabled. Modern-family acceptance of those configuration patterns supplies no MCPL grant, mode or fallback wake.

Fork seeding refuses a normalization cardinality change before writing shifted classifications. The dependency-boundary witness now checks the normalizer **hash contract**, not an incidental package version. Test output records actual version/integrity, and a different-byte control fails loudly. Removing only the hash assertion is killed by that control. Identical normalizer bytes do **not** establish whole-package compatibility.

## Compatibility and diagnostic deltas

1. With the profile enabled, `inboundDelivery` is host-reserved on framework message-write paths; with it off, historical sender values remain unchanged.
2. Any top-level `delivery` on push/event is refused before taps/effects as content/state-independent `-32602 unsupported_combination`; notifications are diagnosed. No-field push retains its behavior.
3. After initial policy, an ungranted incoming batch carrying any item `delivery` field receives ordered `capability_denied` results instead of the single capability error. Before initial policy, the phase-aware error remains; no-field batches retain the existing error.
4. Even with incoming granted, profile-off context-only selection is refused with `capability_denied`; invalid modes get `invalid_delivery`, never a downgrade to ordinary input.
5. Masked local-leaf diagnostics additionally name `channels.contextOnly` in logs/operator status, without changing effective grants or denied-capability lists.

**One-way enablement:** rollback to older framework code is unsupported and would treat stamped rows as conversational; current dependency open APIs lack a minimum application-reader gate. The reader-floor shortcut assumes v1 only; unreadable branches and loss of the sole floor-bearing branch remain limitations. Production enablement is separate.

## Qualification

One fresh install, one frozen resolved closure, sequential matched base/fix cells on each Node version; concurrency 8, 16G user scopes, 3000-second outer timeout and bounded capture. Actual CM resolution: **0.24.2**, with normalizer bytes matching the audited SHA-256; no dependency pin or committed lockfile added.

- Node 22.23.3: matched base **9,687 tests / 9,623 pass / 1 fail / 63 skipped / 0 cancelled**; fix head **9,688 tests / 9,625 pass / 0 fail / 63 skipped / 0 cancelled**.
- Node 22.12.0: matched base **9,687 tests / 9,623 pass / 1 fail / 63 skipped / 0 cancelled**; fix head **9,688 tests / 9,625 pass / 0 fail / 63 skipped / 0 cancelled**.


The base failure is the old fixture's version-string assertion. The changed-byte control uses an in-memory read mock, never edits installed files, and requires a precondition failure rather than a skip. All original fork cardinality protections remain unchanged.

The earlier expanded no-config corpus and ordinary assistant-metadata control retain their separate recorded scope; no fresh corpus execution is claimed for this fixture-only change. No live-provider qualification, production enablement, dependency reader-floor backport or generic initialize-offer facility is included.

AI-assisted implementation with GPT-6.1-Sol; co-author trailers included.

END PR BODY
