# Changed

Local commit: `b4089505605b01bd8f86e6b506245f3febe31250`. No push. Author and committer are Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>.

1. **Engine capability, not version.** `src/mcpl/transport.ts:699,762` removes the Node/Bun allowlist. A refused-upgrade event needs a finite numeric `statusCode`: only 401/403 select `credential-unusable`; absent/non-numeric status selects `engine-unsupported`. Ordinary socket errors remain `connection-failed`: without an HTTP response they do not establish that the runtime lacks the capability. No message parsing. `test/fixtures/mcpl-strict-fake-client.mjs:1` and `test/mcpl-strict-credentials.test.ts:132` cover missing/string/NaN status and version-independent success. The installed ws was 8.22.0, but no ws version is asserted or pinned.
2. **Shutdown exports stay protected.** `src/framework.ts:4875,32091` retires lifetimes in the shutdown promise's `finally`, on success and rejection, and prevents the parallel server close from retiring them early. `test/fixtures/mcpl-strict-shutdown.mjs:44` waits for the real server close, then publishes a module stop error through the public alert API and checks both sinks. Retention ends after shutdown publication, not at shutdown entry.
3. **Shared boolean validation.** `src/mcpl/transport.ts:918,927,947,969` includes `credentialRequired` in the exhaustive boolean table and uses one shared direct-transport helper. The standard config-validation layer and direct transport layer both refuse bad values with the setting's name. `test/mcpl-config-booleans.test.ts:21` and `test/mcpl-strict-credentials.test.ts:260` cover strings, numbers, objects, and the unchanged true/false/undefined/null behavior.
4. **Normal compiled suite.** Child scenarios live under `test/fixtures/`, copied by the existing pretest script, and import compiled `.js` modules. Wrappers resolve fixtures relative to `import.meta.url`. Node fault injection uses asynchronous `node:module.register`, supported at the engine floor; Bun replaces only the compiled transport's ws import. An assertion proves the fake client actually ran. No runtime tsx, raw TypeScript, registerHooks, undeclared esbuild, repository-root cwd, or P2_BASE switch remains in these suite tests. See `test/fixtures/mcpl-strict-injected-client.mjs:1`, `test/fixtures/mcpl-strict-client-loader.mjs:1`, and `test/mcpl-strict-sink-routes.test.ts:11`.
5. **Evidence removed from branch, preserved externally.** Removed the credential/narrow overlays, comparison/acceptance scripts and shell harness, plus the unrelated receiver test and InferenceRouter portion of `test/mcpl-credential-legacy.test.ts`. Original copies are under evidence `harness/`; the runnable external adaptation is under `comparison/`. The final-candidate production comparison passed before deletion (`comparison-final-candidate.log`), and the same production patch hash is recorded in `candidate-production.sha256`. The comparison ran again through a gate at the final commit.
6. **Low findings.** URL fragments are documented and refused before provider/I/O (`README.md:331`, `src/mcpl/types.ts:319`, `test/mcpl-strict-credentials.test.ts:103,122`). Removed the duplicate error-listener removal and redundant strict-token coalescing (`src/mcpl/transport.ts:731,774`). Registry identity/size caching and weakly keyed redactors avoid rebuilding the union regex for each field/second log projection (`src/mcpl/protocol-family.ts:301,319–361`); rotation/retirement are tested in `test/mcpl-strict-redactor-cache.test.ts:5`.

**Production delta versus cb57dfa6:** 63 insertions, 42 deletions, **net +21 lines**, confined to the four permitted production files. README, the existing changelog fragment, and tests are the only other tracked changes. Package configuration/dependencies/lockfiles are unchanged. Baseline and CONTRIBUTING.md were read; supplied conventions/gotchas were absent.

## Red → green and lifetime evidence

- Starting production `cb57dfa611bb02232a55f07020966d141df1bcf2`, compiled with the new regression fixture: `node --test dist/test/mcpl-strict-shutdown.test.js` in its archived build. **1 pass / 2 fail / 0 skip**. Both success and failure teardown cases report `{ failuresLogLeaks: true, webhookLeaks: true }`. Evidence: `start-build.log`, `shutdown-before-both.log` (earlier reproduction also retained in `shutdown-before.log`).
- Fixed production: `node --test dist/test/mcpl-strict-shutdown.test.js dist/test/mcpl-strict-redactor-cache.test.js`: **4 pass / 0 fail / 0 skip**, `shutdown-after.log`. Final gates exercise these again.
- The final-close/reopen concern was **not reproduced** on the start: that scenario already passed. It verifies the config remains registered, old history is retired, reopening the same object has a fresh **framework-owned** registry, and both sinks consult the new credential but not the retired one (`test/fixtures/mcpl-strict-shutdown.mjs:57–74`). It passes before and after. No artificial red result or unnecessary reopen production fix is claimed; `setMcplServerConfig` already begins the framework-owned lifetime.

# Verification Gates

All final gates use the clean local commit above. Official Node 22.12.0, latest 24.x (24.22.1), and latest Node (26.12.1) distributions were checked against published SHASUMS256; Bun 1.4.0 was checked against its official release asset's published SHA-256 digest. Evidence: `engine-checksums.log`, release metadata. Node 22.23.3 and Bun 1.4.3 came from the supplied tools. Installation used only the public npm registry, `--ignore-scripts --package-lock=false`, and separate empty user/global npm configs (`install.log`, `dependency-tree.json`). No private source or repository lockfile was used.

The first concurrent Node attempt shared one dist directory; existing `event-gate-sleep.test.ts:32,90` deletes a fixed directory there. Cross-engine deletion caused unrelated IO errors. Those four runs were deliberately interrupted, not counted as product failures or passes (`shared-layout-interruption.txt`, process records, original launcher logs). The one retry uses engine-specific archived source/build directories under ignored `dist/`, with the same installed dependency tree and `AF_TEST_CONCURRENCY=4`. Each candidate archive is exactly HEAD; each base archive is exactly `e85c57db9aacba43a7b55e8e18bba607fa0228e6`. No sources were patched for the matrix. See `prepare-isolated.sh`, `run-isolated-node-gates.sh`.

| Final gate / engine | Pass | Fail | Skip | Result |
|---|---:|---:|---:|---|
| Build (`npm run build`) | — | 0 | — | PASS |
| Typecheck (`npm run typecheck`) | — | 0 | — | PASS |
| Full npm test — Node 22.12.0 | 8,880 | 0 | 63 | PASS |
| Full npm test — Node 24.22.1 | 8,880 | 0 | 63 | PASS |
| Full npm test — Node 22.23.3 | 8,880 | 0 | 63 | PASS |
| Full npm test — Node 26.12.1 (latest) | 8,878 | 0 | 65 | PASS |
| Strict — Bun 1.4.0 | 138 | 0 | 1 | PASS |
| Strict — Bun 1.4.3 | 138 | 0 | 1 | PASS |
| Strict compiled suite, Node floor, unrelated cwd | 139 | 0 | 0 | PASS |
| Local CI changed-path/changelog checks + workflow tests | 5 | 0 | 0 | PASS |
| Base/final comparison, Node 22.23.3 + Bun 1.4.3 | 12 legacy + 2 mixed comparisons | 0 | 0 | PASS |

Full Node suites each report 8,943 tests and 443 suites. Final gate log names are indexed in `final-gate-log-index.txt`; launcher transcripts are `isolated-test-ENGINE-launch.log`, `bun140-final-launch.log`, `bun143-final-launch.log`, `compiled-floor-away-cwd-launch.log`, `ci-final-launch.log`, and `comparison-committed-launch.log`. Each records its exact gate log/receipt. Build/typecheck use `build-final-launch.log` and `typecheck-final-launch.log`.

Commands (engine binary directories supplied through PATH):

```sh
orgasmic dispatch gate build -- npm run build
orgasmic dispatch gate typecheck -- npm run typecheck
orgasmic dispatch gate isolated-test-$ENGINE -- env PATH="$ENGINE_BIN:$PATH" AF_TEST_CONCURRENCY=4 bash -c 'cd "$1"; node --version; npm test' bash "dist/matrix-$ENGINE-candidate"
orgasmic dispatch gate isolated-base-$ENGINE -- env PATH="$ENGINE_BIN:$PATH" AF_TEST_CONCURRENCY=4 bash -c 'cd "$1"; node --version; npm test' bash "dist/matrix-$ENGINE-base"
orgasmic dispatch gate strict-bun140 -- bash -c '$BUN140 test --timeout 60000 ./dist/test/mcpl-strict*.test.js'
orgasmic dispatch gate strict-bun143 -- bash -c 'bun-1.4.3 test --timeout 60000 ./dist/test/mcpl-strict*.test.js'
orgasmic dispatch gate ci-local -- bash "$EVIDENCE/ci-checks.sh"
orgasmic dispatch gate base-comparison -- env COMPARE_ROOT="$PWD" COMPARE_HARNESS="$EVIDENCE/comparison" COMPARE_WORK="$SCRATCH" P2_EVIDENCE="$EVIDENCE/comparison" bash "$EVIDENCE/comparison/mcpl-narrow-verify.sh" committed
```

The local CI check executes the workflow's changelog and changed-path predicates for base...HEAD and `ci-workflow-pins.test.js`. It selects both Bun operating systems and the PR Node exclusions as expected. The comparison verifies 12 engine/flag/sink combinations (Node/Bun × omitted/false/null × wire/sinks), plus mixed-set comparisons on both engines. WebSocket random handshake keys are validated and normalized only for comparison; raw receipts are retained. Mixed mode allows only the documented credential replacement and hook-object withholding differences. Evidence: `comparison/committed-legacy-hashes.json`, `comparison/mixed-hashes.json`, and raw JSON receipts.

## Unmodified-base results and failure classification

| Base e85c57db engine | Pass | Fail | Skip |
|---|---:|---:|---:|
| Node 22.12.0 | 8,730 | 0 | 63 |
| Node 24.22.1 | 8,730 | 0 | 63 |
| Node 22.23.3 | 8,730 | 0 | 63 |
| Node 26.12.1 | 8,728 | 0 | 65 |

Base suites each report 8,793 tests and 443 suites. **Base-shared failures: none. Candidate-only failures: none.** Skip counts are identical per engine; the candidate runs 150 additional passing tests. Evidence: `isolated-base-ENGINE-launch.log`, `isolated-results-ENGINE.txt`. Shared-layout attempt IO errors are classified as verification-environment interference, not base-shared product defects; the isolated rerun passes unchanged code on every engine.

# Unmet Criteria

None for the requested implementation and named local gates. The requested actual shutdown red→green is recorded. The conditional reopen production fix was unnecessary because the starting code already establishes framework ownership; the new regression remains in the suite. One pre-existing Bun-specific skip and unrun platform/job coverage are disclosed below.

# Residual Risk

- Linux verification only; macOS matrix and upstream pack-install jobs were not reproduced locally. No live external credential/provider or production rollout was exercised.
- Bun's real malformed-frame case still skips because that runtime closes without emitting the socket error. Injected post-open errors and other strict paths pass; the skip is explicit, not reported as coverage.
- The intentionally separate, two-sink redaction policy remains: unbounded per-lifetime accepted credentials, cross-server over-redaction, and hook/accessor withholding. Console/traces/other diagnostics are not newly protected. This round does not redesign that policy or authorize rollout.
- Claims for the PR description now describe structured-status capability instead of exact-version support; the in-depth comparison engines remain Node 22.23.3/Bun 1.4.3, while CI exercises the broader engine range. Unknown refused-upgrade status is explicitly engine-unsupported; message-only socket failures remain connection-failed. Teardown retention now lasts through the last awaited shutdown exports. URL fragments and descriptive mistyped-boolean refusals are explicit.
