# TASK-V1DZF implementation report

## Changed

- Starting HEAD: `4976c67d5c7916a15046c627b68913994c33b3cb` (exact assigned upstream base, package 0.27.0). No merge/rebase onto newer heads.
- Local branch: `task-v1dzf-impl`.
- Implementation/tests: `d8ab99c9d854d35fb18f93bc489edc3db4af4a82`.
- Documentation/final HEAD: `f4e38cedc652404cc059bb360cdaff19dcc5ad8d`.
- Changed only `src/mcpl/types.ts`, `src/mcpl/transport.ts`, `src/mcpl/protocol-family.ts`, `test/mcpl-credential-required.test.ts`, `README.md`. 462 insertions, 23 deletions across five files. No dependency, version, modern HTTP implementation, connectome-host, release or ledger-source edits. No push, tag or PR.
- Read live task record and project.org, entry worker route and dispatch lifecycle skill. Gotchas and conventions collections contained no files; no matching convention. No applicable AGENTS.md found. Workflow classification: risky (P1 priority, credential safety-path blast radius, and final breadth over 300 net lines). This is implementation, not independent review or qualification.

### Flag and exact semantics

Keep the proposed name **`credentialRequired`**: it describes the invariant without suggesting file reading or origin binding. Only literal `true` enables it; false, null and omission preserve legacy behavior. Non-boolean non-null values are configuration problems.

Strict mode is WebSocket-only. It requires explicit header transport, no static token (including an empty string; null is unset), no URL token parameter or userinfo, and WSS outside the existing loopback-host definition. The host may attach the provider after configuration admission, but it must be present before dialing. Every dial and automatic reconnect obtains a fresh provider result. Throw => `provider-threw`; missing provider/null/undefined/empty => `provider-empty`; non-string or failed headerCarries => `credential-unusable`. Errors name the server and fixed code without quoting provider text, adding a cause, or falling back. Unverified engines stop before provider/network with `engine-unsupported`. Abort races and socket timeout/cleanup are retained.

Strict accepted credentials are retained only in the existing config-keyed weak redaction registry and its redaction machinery (plus necessary transport/header buffers). Strict redaction covers short credentials and every prior rotation for that configuration's lifetime; legacy redaction keeps its length floor and sixteen-value limit. No provider result is assigned to configuration or display/diagnostic state.

### Per-requirement evidence

| Requirement | Production/document evidence | Test evidence (names numbered below) |
|---|---|---|
| R1 | `src/mcpl/types.ts:316-339` | 26, ordinary typecheck |
| R2 | `src/mcpl/protocol-family.ts:736-737,804-822`; `src/mcpl/transport.ts:599-614,854-877,888-895` | 14-20,26,36-38 |
| R3 | `src/mcpl/transport.ts:618-644` | 5-18; every refused provider case sees zero upgrades |
| R4 | `src/mcpl/protocol-family.ts:819-820` reuses `isLoopbackHost` | 25 intercepts DNS and proves provider was not called |
| R5 | `src/mcpl/transport.ts:605-614,667-671`; `README.md:360-368` | 27-32 under both engines, plus raw runtime probes below |
| R6 | `src/mcpl/protocol-family.ts:809-810` | 21-24; modern HTTP credential code unchanged |
| R7 | `src/mcpl/transport.ts:633,651`; `src/mcpl/protocol-family.ts:292-322,380-385,458-485` | 6-13 capture thrown messages/console; 33 captures actual framework traces, logs, connection errors, frozen config and JSON/list serializer; 34 covers short and old credentials |
| R8 | `README.md:341-368`; `src/mcpl/types.ts:316-339` | Documentation inspection and full gates |

All framework validation sites continue through the existing shared serverConfigProblems/checkServerConfig path. No duplicate framework policy implementation was added. Runtime admission, startup listing/refusal, and restart-before-teardown are exercised in 36-38. Startup retains invalid configuration for operator listing, following existing behavior; it makes no upgrade.

## Verification Gates

### Environment and acquisition

First-turn preflight, before any repository change:

```
git rev-parse HEAD
bun-1.4.3 --version
sha256sum "$(command -v bun-1.4.3)" | awk '{print $1}'
node --version
npm --version
```

Results: assigned HEAD above; Bun `1.4.3`; Bun binary SHA-256 `7ce7d6b654eddeec20afddf2396317fba6dc19ab52788a27e894e1806bf8f24b`; Node `v22.23.3`; npm `10.9.9`. Resolved tool paths are intentionally omitted.

Installed once using:

```
env -i PATH="$PATH" HOME=/tmp/task-v1dzf-evidence/config \
 NPM_CONFIG_USERCONFIG=/tmp/task-v1dzf-evidence/config/npmrc \
 NPM_CONFIG_GLOBALCONFIG=/tmp/task-v1dzf-evidence/config/global-npmrc \
 npm install --ignore-scripts --registry https://registry.npmjs.org/ --no-audit --no-fund
```

The HOME-like configuration directory was newly created; both npmrc files were empty, project npmrc was absent, and no authentication variables were inherited. 55 packages installed; no lifecycle scripts enabled. All lockfile resolved sources were checked to be HTTPS public npm registry URLs. No dependency required an additional lifecycle script. No reinstall occurred. Build's repository-owned postbuild only chmods two compiled entrypoints and copies the bundled WASM; pretest only copies local fixtures.

Generated ignored lockfile bytes preserved at `/tmp/task-v1dzf-evidence/package-lock.json`, outside the repository. Original and copy SHA-256, checked again after implementation:
`0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`.

Development-resolution evidence only, NOT a sealed candidate closure:

| Package | Version | Integrity |
|---|---|---|
| ws | 8.22.0 | `sha512-Ydggc987+RO0AnWtZ/7Wq9FtNvcrL1b/RO0ud9mWjUPgDrsAAwQSF51sm2hm1XofbU/4jkpGEsLFsZZxU+1DOg==` |
| typescript | 7.0.2 | `sha512-8FYau96o3NKOhbjKi/qNvG/W5jhzxkbdm5sj9AbZ/5T5sWqn3hJgLfGx27sRKZWTvyzCP8dLRBTf5tBTSRVUNA==` |
| tsx | 4.23.15 | `sha512-Yiex1Ovn8z2xPpOWckIiysV1SSyRMY9BkLF++q0yKiDxCqRhosKfMg3janKkiLBwZ5c/YryloKwGZcrEmtwxKw==` |
| @types/node | 22.20.5 | `sha512-U2+DNr+wSjpsTS/wZGYHq7GcwfuSmKiKvoPvK22zwTlRhU91yOniN4qRR5KhIjvif7ysw/dz/hKmfDH0Ris4aA==` |
| @types/ws | 8.18.2 | `sha512-67MQl+fpWKVTT1NYdnmo3U4sc/xPo/zQBncVnI74qmQa0z/b+1g6iYqNmGCPbxO+zz2aklb08a0oHfegiVd0/w==` |
| @animalabs/mcpl-core | 0.4.0 | `sha512-+XMPYcQb8ausCcSEnj/8nJw6tZuOTprBbtUFCna+/hOVJ7GUg/uMinBhuqmTpKqVgOe38VxbMP6/Zucvgxxu4A==` |
| @modelcontextprotocol/server | 2.4.0 | `sha512-rgR9yxSaAJ+bcsi/XroT/S2AfPiIWloXAnrdfYSCms9ivVju0ishu/wW0J21Ho6+ZOR1r7RyeRbjiRuF87ix5Q==` |

### Commands and results

Every gate below ran through `orgasmic dispatch gate NAME -- COMMAND`. The executable wrapper `/tmp/task-v1dzf-evidence/isolated` supplies a fresh empty HOME/npm configuration, offline npm, credential-free `env -i` (only PATH plus explicit test isolation variables), and a locally compiled loopback-only libc connect/sendto/DNS guard. Test traffic was synthetic, numeric loopback/ephemeral-port servers and local files only, without live external provider/model calls. A network namespace could not be created (`unshare` was not permitted); no claim of kernel-level network isolation is made. Wrapper, guard source/binary, logs, PID records and raw probe source are in `/tmp/task-v1dzf-evidence`.

| Gate | Exact command after `--` | Result |
|---|---|---|
| baseline-build | `/tmp/task-v1dzf-evidence/isolated npm run build` | PASS, unmodified base |
| baseline-typecheck | `/tmp/task-v1dzf-evidence/isolated ./node_modules/.bin/tsc --noEmit` | PASS, unmodified base |
| baseline-tests | `/tmp/task-v1dzf-evidence/isolated npm test` | 7,859 tests: 7,814 pass, 45 skipped, 0 fail; 364 suites |
| baseline-new-node | `/tmp/task-v1dzf-evidence/isolated node --import tsx --test test/mcpl-credential-required.test.ts` | 38 tests: 14 controls PASS, 24 expected FAIL |
| baseline-new-bun | `/tmp/task-v1dzf-evidence/isolated bun-1.4.3 test test/mcpl-credential-required.test.ts` | Same 14 PASS / 24 expected FAIL |
| final-build | `/tmp/task-v1dzf-evidence/isolated npm run build` | PASS |
| final-typecheck | `/tmp/task-v1dzf-evidence/isolated ./node_modules/.bin/tsc --noEmit` | PASS |
| final-tests | `/tmp/task-v1dzf-evidence/isolated npm test` | 7,897 tests: 7,852 pass, 45 skipped, 0 fail; 364 suites |
| final-node | `/tmp/task-v1dzf-evidence/isolated node --import tsx --test test/mcpl-credential-required.test.ts` | 38 PASS, 0 fail/skip |
| final-bun | `/tmp/task-v1dzf-evidence/isolated bun-1.4.3 test test/mcpl-credential-required.test.ts` | 38 PASS, 0 fail/skip |
| final-diff-check | `git diff 4976c67d5c7916a15046c627b68913994c33b3cb..HEAD --check` | PASS |

Full baseline completed before production edits. For baseline-new gates, the three production files were restored byte-for-byte using `git show 4976c67d:src/mcpl/FILE`, the unchanged new test source ran directly, then implementation bytes were restored. These deliberately red, test-added working trees have dirty receipts and are evidence, not reusable pass receipts. Latest such receipts contain the final 38-test source. On the base, malformed header values already refuse network I/O; their new-mode tests are red specifically because R3 adds fixed reason codes, not because legacy mode sent those malformed values. Provider rotation, server refusal, existing URL guards and redirect behavior are explicitly labeled controls.

Final gates ran at clean final HEAD above. Intermediate `strict-node`, `strict-bun`, `strict-typecheck` gates supported the build loop. An early strict-typecheck found a test-only dns.lookup mock cast missing `__promisify__`; corrected via an explicit unknown cast, with subsequent typechecks green. No pre-existing test/typecheck failures. The 45 baseline skips include the old plain-`bun` probe (plain bun is intentionally unavailable) and filesystem case-folding cases; the new Bun suite explicitly uses `bun-1.4.3` and skips nothing.

Receipt log basenames (run `run-01M5XHS7W65ZK96NX3SZ5TPNXJ`; CLI-managed evidence, not prose-only checks):

- `baseline-build`: `gate-baseline-build-01M5XHVZHAVNM9AVH21X8JEFB2.log`
- `baseline-typecheck`: `gate-baseline-typecheck-01M5XHXB40CSDT83REQRVWC8F1.log`
- `baseline-tests`: `gate-baseline-tests-01M5XHXBGPQKNVVWTGFKS5WG8Y.log`
- `baseline-new-node`: `gate-baseline-new-node-01M5XJB7269E7B3TXAXXA51DD1.log`
- `baseline-new-bun`: `gate-baseline-new-bun-01M5XJB7PJ1FE7M1FC7M3QEJDW.log`
- `final-build`: `gate-final-build-01M5XJD6AGTYA3HDXT8S8AGCQW.log`
- `final-typecheck`: `gate-final-typecheck-01M5XJD73JJK7S1RZSC9HHWCE0.log`
- `final-tests`: `gate-final-tests-01M5XJDGFYVKS51MHQHY3GMDPP.log`
- `final-node`: `gate-final-node-01M5XJDHN61YNGGZH207XCJ99X.log`
- `final-bun`: `gate-final-bun-01M5XJD7ERC7A5386M0GHS0YGE.log`

### Per-test baseline outcomes (both engines) and final outcomes

Numbers are the Node TAP order in `test/mcpl-credential-required.test.ts`. Each row ran on both engines. All final results are green.

| # | Exact test name | Base Node/Bun | Final Node/Bun |
|---|---|---|---|
| 1 | `control: header provider sends Authorization and no token query` | PASS (control) | PASS / PASS |
| 2 | `control: reconnect rotates the header provider (credentialRequired=undefined)` | PASS (control) | PASS / PASS |
| 3 | `control: reconnect rotates the header provider (credentialRequired=true)` | PASS (control) | PASS / PASS |
| 4 | `control: unset flag retains throwing-provider static fallback` | PASS (control) | PASS / PASS |
| 5 | `control: strict provider credential refused by server fails without another dial` | PASS (control) | PASS / PASS |
| 6 | `strict: provider throws refuses before upgrade with provider-threw` | FAIL (new behavior) | PASS / PASS |
| 7 | `strict: provider null refuses before upgrade with provider-empty` | FAIL (new behavior) | PASS / PASS |
| 8 | `strict: provider empty refuses before upgrade with provider-empty` | FAIL (new behavior) | PASS / PASS |
| 9 | `strict: provider leading space refuses before upgrade with credential-unusable` | FAIL (new behavior) | PASS / PASS |
| 10 | `strict: provider trailing space refuses before upgrade with credential-unusable` | FAIL (new behavior) | PASS / PASS |
| 11 | `strict: provider control character refuses before upgrade with credential-unusable` | FAIL (new behavior) | PASS / PASS |
| 12 | `strict: provider non-ASCII refuses before upgrade with credential-unusable` | FAIL (new behavior) | PASS / PASS |
| 13 | `strict: provider non-string refuses before upgrade with credential-unusable` | FAIL (new behavior) | PASS / PASS |
| 14 | `strict: missing runtime provider refuses before upgrade` | FAIL (new behavior) | PASS / PASS |
| 15 | `strict: validation and direct dial refuse static token` | FAIL (new behavior) | PASS / PASS |
| 16 | `strict: validation and direct dial refuse empty static token` | FAIL (new behavior) | PASS / PASS |
| 17 | `strict: validation and direct dial refuse default query mode` | FAIL (new behavior) | PASS / PASS |
| 18 | `strict: validation and direct dial refuse explicit query mode` | FAIL (new behavior) | PASS / PASS |
| 19 | `control: header URL credential rejected (query)` | PASS (control) | PASS / PASS |
| 20 | `control: header URL credential rejected (userinfo)` | PASS (control) | PASS / PASS |
| 21 | `strict: configuration refuses non-WebSocket http` | FAIL (new behavior) | PASS / PASS |
| 22 | `strict: configuration refuses non-WebSocket https` | FAIL (new behavior) | PASS / PASS |
| 23 | `strict: configuration refuses non-WebSocket stdio` | FAIL (new behavior) | PASS / PASS |
| 24 | `strict: configuration refuses non-WebSocket modern` | FAIL (new behavior) | PASS / PASS |
| 25 | `strict: non-loopback cleartext refuses before provider, DNS or request` | FAIL (new behavior) | PASS / PASS |
| 26 | `strict: flag rejects non-boolean values without quoting them` | FAIL (new behavior) | PASS / PASS |
| 27 | `strict: unverified engine runtime guard refuses before provider or upgrade` | FAIL (new behavior) | PASS / PASS |
| 28 | `control: actual runtime strict transport refuses cross-origin redirect 301` | PASS (control) | PASS / PASS |
| 29 | `control: actual runtime strict transport refuses cross-origin redirect 302` | PASS (control) | PASS / PASS |
| 30 | `control: actual runtime strict transport refuses cross-origin redirect 303` | PASS (control) | PASS / PASS |
| 31 | `control: actual runtime strict transport refuses cross-origin redirect 307` | PASS (control) | PASS / PASS |
| 32 | `control: actual runtime strict transport refuses cross-origin redirect 308` | PASS (control) | PASS / PASS |
| 33 | `control: strict successful dial retains no credential on config or SDK display state` | PASS (control) | PASS / PASS |
| 34 | `strict: short credential and credentials older than sixteen rotations stay redacted` | FAIL (new behavior) | PASS / PASS |
| 35 | `control: strict provider wait can be aborted, with no late dial` | PASS (control) | PASS / PASS |
| 36 | `strict: framework startup validates strict settings before upgrade or teardown` | FAIL (new behavior) | PASS / PASS |
| 37 | `strict: framework connect validates strict settings before upgrade or teardown` | FAIL (new behavior) | PASS / PASS |
| 38 | `strict: framework restart validates strict settings before upgrade or teardown` | FAIL (new behavior) | PASS / PASS |

### Actual runtime redirect evidence

Raw probe gates were `redirect-probe-node` and `redirect-probe-bun`, at the clean base with the same installed dependency tree. Commands:

```
orgasmic dispatch gate redirect-probe-node -- /tmp/task-v1dzf-evidence/isolated node --input-type=module -e "$(cat /tmp/task-v1dzf-evidence/redirect-probe.mjs)"
orgasmic dispatch gate redirect-probe-bun -- /tmp/task-v1dzf-evidence/isolated bun-1.4.3 -e "$(cat /tmp/task-v1dzf-evidence/redirect-probe.mjs)"
```

Each imports `ws` normally at runtime, sends a fresh synthetic canary header to one loopback server, and records a second loopback server at another port/origin. The first returns 302; the target refuses if contacted. Probe output prints constructor identification and booleans/counts, never the credential.

| Runtime / actual constructor | Option | Source upgrades | Target upgrades | Target credential | Dial |
|---|---|---|---|---|---|
| Node 22.23.3 / npm ws 8.22.0 EventEmitter client | default | 1 | 0 | no | error |
| same | followRedirects:false | 1 | 0 | no | error |
| same | followRedirects:true | 1 | 1 | no (ws strips cross-origin Authorization) | error |
| Bun 1.4.3 / built-in BunWebSocket EventEmitter adapter | default | 1 | 0 | no | error |
| same | followRedirects:false | 1 | 0 | no | error |
| same | followRedirects:true | 1 | 0 | no | error |

Inspected installed `node_modules/ws/lib/websocket.js` (followRedirects defaults false and gates redirect processing) and Bun's runtime constructor text: its adapter passes selected header/TLS/proxy options to the native WebSocket, not followRedirects. The final production-path tests 28-32 repeat cross-origin upgrade redirects for 301/302/303/307/308 in BOTH engines: one authenticated source request, zero target requests, failed dial. Test 27 changes the reported engine version to an unverified one and proves runtime guard failure before provider/upgrade, on both engines. Neither requested engine is unsupported; every other engine/version is intentionally unsupported for strict mode until verified. No reliance on Node's global WHATWG WebSocket.

## Unmet Criteria

None. No external origin, model, real credential, file-reading credential provider, host application changes, publication or independent review was attempted. Full npm suite is the repository's Node suite; Bun verification covers all 38 focused tests and the raw redirect probes, not the entire repository under Bun.

## Residual Risk

- Strict support is deliberately limited to Node 22.23.3 and Bun 1.4.3. Future engine/client changes require fresh redirect qualification before expanding the allowlist; currently resolved ws is 8.22.0, package manifest unchanged.
- Strict redaction retains every accepted rotation until its config object is released, so memory/pattern cost grows with rotations; short values can over-redact ordinary text. Both are scoped to strict mode and documented rather than silently weakening R7.
- No real service/TLS deployment or provider was contacted. Existing header semantics and local redirect/upgrade paths are covered with synthetic values. Namespace isolation was unavailable; tests instead used sanitized configuration, offline npm and the loopback-only guard described above.
- Generated ignored package-lock.json, node_modules and dist are mechanical local artifacts only; lock copy and resolution evidence are preserved outside tracked source. Qualification/sealing and independent review remain separate downstream stages. No push.
