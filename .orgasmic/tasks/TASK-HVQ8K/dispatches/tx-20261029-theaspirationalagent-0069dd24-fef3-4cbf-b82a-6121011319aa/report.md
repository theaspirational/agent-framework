# TASK-HVQ8K — polish round

## Changed

Read `/srv/review-drop/TASK-HVQ8K-REVIEW2.md` in full first and verified the three requested items in source. Final branch: `task-hvq8k-impl`; final HEAD **`6aec11ec1dad94eac0610a868e55428f5b96bc10`**, six commits on upstream `4a45766f019fa11c8699645bd6806ebf3e13e5d1`. Recovery ref **`task-hvq8k-reviewed-before-polish`** preserves reviewed HEAD `02ee294731a2e171aa0eae7533f7ec7b7129a2c0`. Local only: no push, PR, external messages, landing, merge or dispatch close; no further review was commissioned.

### Per-item changes

1. **Result-borne hints:** `src/mcpl/server-connection.ts:2485` now calls `tapResponse` only for a current-epoch **unconfigured** connection. Required connections still receive their tool result intact but do not apply its hints. The unconfigured branch retains its original synchronous call and behavior. The real-WebSocket pair at `test/mcpl-admission-lifecycle.test.ts:334–362` uses an actively declaring peer and an empty capability grant. Required: unchanged revision, no recovery timer, zero taps, zero admission hooks. Unconfigured: revision advances, the legacy tap runs and skipped-revision recovery is scheduled. Both assert the tool result is retained. `docs/required-inbound-admission.md:38–44` and `changelog.d/required-inbound-admission.added.md:2–5` state that required connections apply no peer hints from any carrier.
2. **Committed architecture regression guard:** `test/routing-runtime-has-no-connector-literals.test.ts:13–131` explicitly inventories the **322 inherited AST occurrences** across the **nine runtime files** touched by the series. The nine tests at `:138–157` parse identifiers and string/template/regex literals, ignoring comments, and reject vocabulary or occurrence counts beyond that file's inventory. Removal of an inherited occurrence is allowed. Runtime tests do not read git history or generate an allowlist from the current source. The inventory was generated from the pinned upstream base, not from the modified tree; the generation script is retained as evidence. An added runtime connector string kills the test (mutation evidence below).
3. **Module headers restored:** the added imports now follow the leading module docblocks at `src/mcpl/channel-registry.ts:15`, `src/mcpl/inference-router.ts:10`, `src/mcpl/types.ts:14`, and `src/mcpl/protocol-family.ts:25`. These are import-placement-only changes.

### Folded commit series

All six final commits retain author **and** committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` and trailer `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Fixups were folded into the requested owners; no extra polish commit remains.

| Commit | Purpose / folded polish |
| --- | --- |
| `6077a80e` | Shared required-admission core; result-tap suppression; `types.ts` and `protocol-family.ts` import placement. |
| `e1fb895a` | Complete channel lane; channel-registry import placement. |
| `d16327e0` | Complete push lane, unchanged runtime content this round. |
| `e47796bd` | Complete inference lane; inference-router import placement. |
| `87ae2a9c` | Cross-lane/no-hook tests, new result-hints pair and committed nine-file AST inventory test. No runtime changes. |
| `6aec11ec` | Capability/compatibility docs and changelog, including no peer hints from any carrier. |

Each lane patch independently applies to the shared core; the final gate checks this with temporary indexes without modifying the worktree. This is patch independence, not a claim that every partial combination received a full suite. The full final tree is the tree qualified below. All 19 file hashes match the snapshot taken before folding (`final-tree-before-fold.json`).

### Files / line counts

Against reviewed `02ee2947`: **nine files, +197/-8**. Against upstream base: **19 files, +1291/-22**. Exact per-file/commit/authorship inventory: `final-commits-and-files.txt`.

| File changed this round | Added / removed vs reviewed HEAD |
| --- | ---: |
| `src/mcpl/server-connection.ts` | +1 / -1 |
| `src/mcpl/channel-registry.ts` | +1 / -1 |
| `src/mcpl/inference-router.ts` | +1 / -1 |
| `src/mcpl/types.ts` | +1 / -1 |
| `src/mcpl/protocol-family.ts` | +1 / -1 |
| `test/mcpl-admission-lifecycle.test.ts` | +30 / -0 |
| `test/routing-runtime-has-no-connector-literals.test.ts` | +157 / -0 |
| `docs/required-inbound-admission.md` | +3 / -2 |
| `changelog.d/required-inbound-admission.added.md` | +2 / -1 |

No dependency manifest, lockfile, SPEC, storage, connector-adapter, reply-destination or typing changes. Installed dependency versions are recorded in `final-environment.txt`; `@animalabs/mcpl-core` remains **0.4.0**. No install was needed this round.

## Verification Gates

**Every Node/npm command**, including preparation, test/mutation probes and final qualification, ran under:

```sh
env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -q \
  -p MemoryMax=16G -p MemorySwapMax=0 <command>
```

The initial capped probe read its own cgroup files and confirmed `memory.max=17179869184` and `memory.swap.max=0`: `gate-polish-cap-probe-01M646854N7D1NJ656J9PYB7G1.log`. No uncapped fallback was used. Commit/rebase commands also ran in capped scopes so any hooks would inherit the limits. Full suites ran sequentially, not concurrently with each other or the focused suites. Builds remain in ignored worktree `dist/`; evidence contains logs and small scripts only.

Every final row below uses `orgasmic dispatch gate <name> --` followed by the cap prefix above. `PATH` selects the named Node for npm and descendants. All final gates are at **`6aec11ec`**; no earlier receipt is reused as a completion gate.

The focused argument list `A` is the six existing admission test files plus the new architecture file:

```text
dist/test/mcpl-required-admission.test.js
dist/test/mcpl-required-push-admission.test.js
dist/test/mcpl-required-inference-admission.test.js
dist/test/mcpl-admission-lifecycle.test.js
dist/test/mcpl-admission-no-hook.test.js
dist/test/mcpl-admission-compatibility.test.js
dist/test/routing-runtime-has-no-connector-literals.test.js
```

| Gate / command after cap prefix | Result | Receipt (relative to this report directory) |
| --- | --- | --- |
| `polish-typecheck-22-23` / `env PATH="/opt/node/bin:$PATH" npm run typecheck` | PASS | `gate-polish-typecheck-22-23-01M646JSK60XMXDJNKEBQQ74CF.log` |
| `polish-build-22-23` / `env PATH="/opt/node/bin:$PATH" npm run build` | PASS | `gate-polish-build-22-23-01M646JT1DX7KB8NY3ZBAXNGYM.log` |
| `polish-admission-22-23` / `env PATH="/opt/node/bin:$PATH" node --test --test-concurrency=1 --test-force-exit A` | **149 pass, 0 fail, 0 skipped**; 14.216 s | `gate-polish-admission-22-23-01M646K1G2G4PXQTK1ZDMPT4MR.log` |
| `polish-npm-test-22-23` / `env PATH="/opt/node/bin:$PATH" AF_TEST_CONCURRENCY=4 npm test` | **PASS: 9,365 tests; 9,302 pass, 0 fail, 63 skipped; 497 suites**; 1230.059 s | `gate-polish-npm-test-22-23-01M646M3ZD6SG58TCKD0PTB6TK.log` |
| `polish-typecheck-22-12` / `env PATH="/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH" npm run typecheck` | PASS | `gate-polish-typecheck-22-12-01M647W06GA1S8BDTQAWA2C1A5.log` |
| `polish-build-22-12` / `env PATH="/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH" npm run build` | PASS | `gate-polish-build-22-12-01M647W0MPJF3HKTZJEQ5AJESA.log` |
| `polish-admission-22-12` / `env PATH="/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH" node --test --test-concurrency=1 --test-force-exit A` | **149 pass, 0 fail, 0 skipped**; 45.841 s | `gate-polish-admission-22-12-01M647W7AEF5C8TV7PG6KN3DPY.log` |
| `polish-npm-test-22-12` / `env PATH="/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH" AF_TEST_CONCURRENCY=4 npm test` | **PASS: 9,365 tests; 9,302 pass, 0 fail, 63 skipped; 497 suites**; 1724.779 s | `gate-polish-npm-test-22-12-01M647Y8XHGY637YWTB11YMVWH.log` |
| `polish-lane-independence` / `python3 "$ORGASMIC_EVIDENCE_DIR/check-lane-patches.py"` | PASS: channel, push and inference independently apply to shared core | `gate-polish-lane-independence-01M646KWMKG6YMMGM6J3N1ZVN6.log` |

Focused counts: **140 admission tests** (31 channel, 11 push, five inference, 64 lifecycle, four no-hook, 25 compatibility) plus **nine architecture tests**, total **149**. New this round: two result-hints controls and nine architecture rows. `git diff --check` also passed (non-receipted formatting check). Command ownership and full wrapper transcripts are retained as `*-owner.txt` and `*-wrapper.log`.

### Red-before / mutation evidence

| Evidence | Outcome | Receipt |
| --- | --- | --- |
| Real-WebSocket result-hints pair before runtime fix | **1 pass, 1 fail**; required profile fails, unconfigured control passes | `gate-polish-red-result-hints-01M646AK3Y2Q3C8K1VT34ZHCAG.log` |
| Same pair after suppression | **2 pass, 0 fail** | `gate-polish-green-result-hints-01M646D87CZ5PBKWPWC9XE2JQZ.log` |
| Architecture guard on unchanged runtime | **9 pass, 0 fail** | `gate-polish-architecture-baseline-01M646FEVVDGXNFM89Z8RFA2XN.log` |
| Add a new connector string to `src/mcpl/inbound-admission.ts` | **8 pass, 1 fail**, specifically the core-file architecture assertion | `gate-polish-architecture-mutation-01M646FVETPP4TSQJ4S2XNQ750.log` |

`mutate-connector-literal.py` records the exact mutation and capped gate command. It restores the source byte-identically in `finally`; no mutation entered a build/commit used for final qualification. These red failures are intentional evidence, not remaining regressions.

### Inherited evidence

The previous report `/home/orgasmic/.orgasmic/runs/run-01M642DGGHHPVM127DKKJ91M1C/evidence/report.md` and REVIEW2 remain historical context, **not reused gate passes**. Their unchanged scope includes the underlying three-lane admission algorithms, timeout/budget/epoch guards, labelled internal-boundary witnesses, original upstream no-hook controls and prior manager-approved compatibility decisions. This round changes the result-tap branch, import positions, documentation and tests only; current final suites re-exercise the behavior. `review2-input-hash.txt` pins the review read this round. The formerly evidence-only connector check is now committed and covered by the full/focused suites.

## Unmet Criteria

None. All three polish items are implemented and folded into their owning commits. Every assigned final-head gate passed under the required cap on both requested Node versions; both full suites report zero failures, cancellations and todo tests. The tracked worktree is clean. No further review, feature design or scope expansion was performed.

## Residual Risk

- Suppression of result-borne hints is an intentional opt-in compatibility change: required peers must not rely on hint-driven state/recovery from any carrier. Tool results themselves remain intact. Unconfigured carrier behavior is preserved.
- The architecture test is an explicit nine-file inventory and finite vocabulary/count ceiling, not a proof over every possible encoding or the entire runtime dependency graph. Existing upstream connector sites remain allowed by the approved compatibility boundary; adding coverage for new runtime files requires updating this inventory deliberately.
- Existing documented limits remain: callbacks run in-process, cancellation cannot preempt synchronous loops or undo external writes, 60-second per-item timeouts can accumulate across sequential batches, and private host intent is not durable.
- Real WebSocket/stdio paths use synthetic peers and mock providers, not deployed connectors. Previously labelled emit/policy scaffolds remain labelled and supplemented by transport tests. The deferred host-returned `admission_mode_ungranted` observation was not part of the three polish items.
- Both full suites retain 63 skips; those scenarios are not claimed as exercised. No gate failure, memory-cap failure or environment-blocked assigned check remains.
