# Strict credential rebase

## Changed

- Final local commit: `cb57dfa611bb02232a55f07020966d141df1bcf2`, based on `e85c57db9aacba43a7b55e8e18bba607fa0228e6` (0.28.0). Nothing pushed, landed, or merged.
- Replayed all 11 input commits in order, preserving their messages; **no squashing**. Author and committer on every new commit: `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`.
- A final identity-only history rewrite preserved the entire tree and all commit messages; mandatory gates were rerun afterwards. See [identity-rewrite-map.json](identity-rewrite-map.json).
- Repointed `test/mcpl-narrow-overlay.mjs`, `test/mcpl-credential-base-overlay.mjs`, and `test/mcpl-credential-verify.mjs` from the old base to the new base.
- Re-read all five changed production/documentation files. The README addition and production patch match the input change exactly, except that the framework patch uses upstream's equivalent `opsWebhookText()` helper. See [approved-delta-audit.json](approved-delta-audit.json).
- Added `changelog.d/strict-credential-mode.added.md`, required by upstream `CONTRIBUTING.md` and its changelog check. This summarizes the existing approved behavior, not a new behavior change. No existing PR text was supplied or remotely edited; README wording from the input change is unchanged.
- Read the supplied project baseline (no additional constraints), and `CONTRIBUTING.md`; no project convention/gotcha records were supplied and no applicable `AGENTS.md` was found.

### Commit mapping

| Old | Replayed |
|---|---|
| `c6d04ca154d398a757145c9cd806856b53835f97` | `d8ec235c51b9a89a1f7646e12f2daa2a0ebad3c4` |
| `126a928097561739c1bb3537e02d03a700007c2e` | `eb4f29bf16d49be3d5e3c01794328c38f7a1c8a3` |
| `1e550f75c80d8d5ec83fb6eaed5aa9fddbe3151f` | `64a69d7982e0376cf6c7c106788405e1de2b5e93` |
| `4ee2651b0d4c98f67af38f98a7464381f77b487c` | `c4f501d78eeef7a6216c838caa43daa12ec927db` |
| `0b8a3904f844d88df465017cab2e39465d7498f5` | `32d09bcbdb964362e0103e88de7c01b7c76633ce` |
| `d28f95595d8d7521a81f69c36efd97e5c219dd61` | `813395bd3a1a7e36a6f1c7db4d44c2b5c485ddab` |
| `7a789bab98b534da2573ec7d3ed47e24fe9049e6` | `3b83472a2694352bbc82ab92a804688b167bf405` |
| `91a6c326c6fe48a19b4be522f603e01d9cd53993` | `70c3bd5ae2caba115ce9cc0b4404248a239a2098` |
| `8a8a9c2fc556fe0d11d4c6248b4f5ab1df31140d` | `4a61cdcdec2bece61da423a49789d0c26a7128ff` |
| `db79997af2d1067919a62fda70f95153f43230c7` | `cfdcd6e50019bcec8cdc162820c417e5291fe28b` |
| `ece328ffcbc83a99f4a9a22940e3a40b953ded50` | `249f7bb40bf58d27b4cb332762b2ced388154c0c` |

Additional commits:
- `052ff42175e50ad9056c4947d9ea00ba4f1a74b7` — Compare strict credential compatibility against upstream 0.28.0.
- `cb57dfa611bb02232a55f07020966d141df1bcf2` — Add release note for opt-in strict credential mode.

### Conflict resolutions

All conflicts were in `src/framework.ts`, at the webhook-body expression now at line 28505. The three replay conflicts arose from successive edits to that same area:

1. `91a6c326`: combined strict-union redaction of the agent/message with upstream `opsWebhookText(sinkMessage ?? wholeMessage)` instead of restoring the old direct `boundFailureText` call.
2. `8a8a9c2f`: retained the change from `redactStrictSink` to `strictFailureCopy`, still passing the detached message through upstream's helper.
3. `ece328ff`: retained the entire new preparation catch and exporting try/finally, including rethrowing the same exception even with no webhook or a throttled webhook; kept the helper in the reindented webhook block.

`opsWebhookText()` delegates to the same 500-character bound used by the input patch. No approved strict semantics were dropped, and the upstream helper remains in both strict and never-strict paths.

### Upstream changes on these paths

- Framework: extracted the webhook truncation helper; added `eventGate.sourcesChanged()` after config registration/removal; added heartbeat shutdown; introduced host toolsets/closed-tab connect and disconnect behavior; and captured the now-default-enabled hint policy once before legacy connection setup. All remain intact. Closed-tab disconnect uses the same removal path that ends credential ownership; re-opening registers a fresh lifetime. Transient reconnects still retain history.
- Transport: replaced stdio readline with `readLines`, escaped U+2028/U+2029 on outgoing stdio/WebSocket messages, updated tool-hint defaults, and validated the new presentation enum. These auto-merged unchanged alongside strict dial validation.
- Protocol family: adopted upstream notice tags for legacy withheld/unprintable diagnostics and added bounded dropped-line logging. The strict exceptional-object marker remains the approved literal `[withheld]`.
- Types/README: retained upstream default-on tool hints, host presentation/toolsets, and unrelated upstream documentation changes.
- Upstream raised dependency ranges for context-manager and membrane. Its Node floor remains >=22.12.0, and CI includes Bun 1.4.3; the requested runtimes require no substitution.

The retained patch covers opt-in fail-closed dialing and flag validation, all five codes, structured 401/403 classification only, redirect/abort connection failures, the fixed 32-character floor message, weak lifetime ownership/retirement, union redaction limited to the two exports, raw-descriptor projection before legacy preparation, original exception identity, and the unchanged legacy 16-entry history. Tests below exercise these through real loopback peers and public framework routes, not only copied dial logic.

### Production-line count from the new base

| File | Added | Removed | Net |
|---|---:|---:|---:|
| `src/framework.ts` | 79 | 36 | 43 |
| `src/mcpl/protocol-family.ts` | 166 | 1 | 165 |
| `src/mcpl/transport.ts` | 105 | 2 | 103 |
| `src/mcpl/types.ts` | 13 | 0 | 13 |
| **Production total** | **363** | **39** | **324** |

README adds 98 lines; the new release fragment adds 11. No `package.json` change or repository lockfile was added.

### Dependencies and runtimes

Resolved and installed with an empty user config, empty global config, sanitized environment, and only `https://registry.npmjs.org/`: `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`, then `npm ci --ignore-scripts --no-audit --no-fund`. All 101 lock records were audited: zero non-public resolved sources. esbuild/fsevents declare install scripts, but none ran and none was required for these builds/tests. See [dependency-audit.json](dependency-audit.json), [dependency-resolve.log](dependency-resolve.log), and [dependency-install.log](dependency-install.log).

The generated lock was moved outside the repository into evidence: [package-lock.json](package-lock.json).

**SHA256:** `3108da80bc1fa23eeb56f0e683ad34a4e51033cb1184bdb5448f0c7f073d8b02`.

Used Node **22.23.3**, Bun **1.4.3**, npm ws **8.22.0**. Both baseline and head shared this exact installed dependency tree. The full baseline used a fresh `git archive` of `e85c57db9aacba43a7b55e8e18bba607fa0228e6` under ignored build output, with its own compiled output and a symlink to that same dependency installation; no main checkout was modified.

## Verification Gates

All mandatory rows below ran through `orgasmic dispatch gate <name> -- <command>` at the final clean commit and have reusable passing receipts. Commands show the wrapped command; `$E` denotes the evidence directory. Node's requested installation was first on PATH. Gate names are in the linked log filenames.

| Gate | Command | Result | Evidence |
|---|---|---|---|
| Rebase audit | `python3 "$E/rebase-audit.py"` | 11 messages/order preserved; all 13 identities valid; patch and baseline refs verified | [gate-rebase-audit-01M60QAE7WDCJKFFE3W4GWZJGN.log](gate-rebase-audit-01M60QAE7WDCJKFFE3W4GWZJGN.log) |
| Build | `npm run build` | PASS | [gate-build-01M60QADGQ703Y0XSFVXJK4ZQM.log](gate-build-01M60QADGQ703Y0XSFVXJK4ZQM.log) |
| Typecheck | `npm run typecheck` | PASS | [gate-typecheck-01M60QADWV9J7SXXYMGTGBMXSA.log](gate-typecheck-01M60QADWV9J7SXXYMGTGBMXSA.log) |
| npm base | `bash -c 'cd dist/upstream-base && npm run build && AF_TEST_CONCURRENCY=4 npm test'` | 8793 tests; 8730 pass / 0 fail / 63 skipped | [gate-npm-test-base-01M60QAKJVJTW94SC2CHB92JBK.log](gate-npm-test-base-01M60QAKJVJTW94SC2CHB92JBK.log) |
| npm head | `env AF_TEST_CONCURRENCY=4 npm test` | 8938 tests; 8875 pass / 0 fail / 63 skipped | [gate-npm-test-head-01M60QAWSANB0X3RZRYRBSVQD7.log](gate-npm-test-head-01M60QAWSANB0X3RZRYRBSVQD7.log) |
| Strict Node | `bash -c 'node --import tsx --test --test-concurrency=2 test/mcpl-strict-*.test.ts'` | 126 pass / 0 fail | [gate-strict-node-01M60QBAAZN9DVMK6H2479A7GD.log](gate-strict-node-01M60QBAAZN9DVMK6H2479A7GD.log) |
| Strict Bun | `bash -c 'bun-1.4.3 test --timeout 60000 test/mcpl-strict-*.test.ts'` | 125 pass / 1 skip / 0 fail | [gate-strict-bun-01M60QBTHAHX7MW5GPBHDZ14GV.log](gate-strict-bun-01M60QBTHAHX7MW5GPBHDZ14GV.log) |
| B/C + mixed compatibility | `env P2_EVIDENCE="$E/final-narrow" bash test/mcpl-narrow-verify.sh` | PASS on both engines | [gate-narrow-comparison-01M60QDKWR3BD4YR6KZEE31AC4.log](gate-narrow-comparison-01M60QDKWR3BD4YR6KZEE31AC4.log) |
| Sink matrix | `bash "$E/sink-matrix.sh"` | 288 cells per engine; 0 unexpected presence; 12 lifetime controls each; 0 unexercised | [gate-sink-matrix-01M60QCH5JS85B8338NEFRKF5X.log](gate-sink-matrix-01M60QCH5JS85B8338NEFRKF5X.log) |
| GC/accessors | `bash "$E/compare-lifetimes-accessors.sh"` | 24 base/head comparisons PASS | [gate-lifetime-accessor-comparison-01M60QCQ32CR2QW4C68E5C60B6.log](gate-lifetime-accessor-comparison-01M60QCQ32CR2QW4C68E5C60B6.log) |
| Bun TAB base | `bash -c 'cd dist/upstream-base && bun-1.4.3 test --timeout 60000 --test-name-pattern "holding a TAB" ./test/mcp-recorded-text.test.ts'` | 6 pass / 0 fail | [gate-bun-tab-base-01M60QDK9KGV0KDNS4MJ94BFBG.log](gate-bun-tab-base-01M60QDK9KGV0KDNS4MJ94BFBG.log) |
| Bun TAB head | `bun-1.4.3 test --timeout 60000 --test-name-pattern 'holding a TAB' ./test/mcp-recorded-text.test.ts` | 6 pass / 0 fail | [gate-bun-tab-head-01M60QDKMQ2WR7YJVTJT1GZ188.log](gate-bun-tab-head-01M60QDKMQ2WR7YJVTJT1GZ188.log) |

**Full npm failure identities:** none on either base or head; no differing identities. Head adds 145 passing tests; both have 443 suites and 63 skips. See [suite-comparison.json](suite-comparison.json).

B/C comparison uses the **new base**, for omitted/false/null flags on both engines: 48 sink byte-pairs match across the eight sinks; six wire comparisons each cover eight raw handshakes. Only random handshake-key values are normalized, with fresh valid keys and empty pre-response bytes asserted. Mixed-mode comparison permits only the documented two-sink redaction/withholding differences. Hashes: [final-narrow/final-legacy-hashes.json](final-narrow/final-legacy-hashes.json), [final-narrow/mixed-hashes.json](final-narrow/mixed-hashes.json).

GC compares eight engine/flag/handshake combinations; accessor comparison covers sixteen engine/flag/scenario combinations, preserving counts, traces and throw identity, with only the explicit strict export differences. Raw JSON and summary: [comparisons/summary.json](comparisons/summary.json). Matrix receipts: [sink-summary.json](sink-summary.json), [sinks-node.json](sinks-node.json), [sinks-bun.json](sinks-bun.json).

Bun's strict suite intentionally skips the real malformed-frame-after-open case; Node covers it, and the injected Bun post-open failure case passes.

### Full Bun suite: UNRUN to completion

Attempted on both the new base and production-identical pre-release-note head using `timeout 600 bun-1.4.3 test --timeout 60000 ./test/*.test.ts`. Both reached the 600-second attempt bound (exit 124), so these are **partial diagnostics, not final-commit passing receipts or a complete full-suite comparison**. The documentation commit landed while they ran; their receipts explicitly say moved-head and are not reused.

Observed partial outcomes: base 3,081 pass lines / 140 failure identities; head 3,118 pass lines / 141 failure identities. All 140 base failures appear on head. The one head-only identity was `an initialize error that quotes a credential holding a TAB is recorded without any of it`. Its stack points to an earlier asynchronous 404 assertion in `test/mcp-recorded-text.test.ts:113`, not that TAB case. Isolated TAB comparisons at the final commit pass all six matching tests on both base and head. This is consistent with full-suite asynchronous cross-test contamination, not a reproduced isolated regression; the incomplete full-Bun comparison cannot rule out additional issues.

Many shared failures include source-mode tests assuming compiled-output-relative paths, plus other base failures. They were not repaired in this scoped rebase. Full observed identities are in [suite-comparison.json](suite-comparison.json); raw attempts: [gate-bun-suite-base-01M60P5HDHH2R938VA0KF1PSRR.log](gate-bun-suite-base-01M60P5HDHH2R938VA0KF1PSRR.log), [gate-bun-suite-head-01M60P5S1ES3D4X9VNWFY8XKR7.log](gate-bun-suite-head-01M60P5S1ES3D4X9VNWFY8XKR7.log).

Earlier receipts are retained but superseded: the first baseline pass was marked dirty; a repeat spanned the release-note commit and was marked moved-head. Neither is reused. Passing receipts from before the final identity-only rewrite are also superseded, not reused. Mandatory gates were rerun at the final commit as listed above.

## Unmet Criteria

No mandatory criterion remains unmet. Full Bun completion is **UNRUN**, using the brief's explicit allowance; partial attempts and the differing observed identity are disclosed above. No remote push or PR operation was performed.

## Residual Risk

- This remains a narrow dial/two-export guarantee, not a rollout authorization or blanket credential-redaction claim. Console, trace, application payloads and other surfaces remain outside it.
- Strict accepted-credential history grows with lifetime/rotations; only the approved runtimes and listed encodings are certified. No live external provider was used.
- Full Bun completion and a complete full-Bun failure-identity comparison remain unverified; the isolated differing case passes on both trees.
- CI on other platforms/runtimes and remote PR review were not performed. The historical stage-specific `mcpl-credential-verify.mjs` reference was repointed, but the assigned B/C gate is the newer narrow verifier, not that older receipt consumer.
