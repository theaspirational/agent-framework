# Changed

TASK-T2F13 fix round 2 is complete. This remains a part-1 fail-closed dial only: NOT full-R7 certification and NOT rollout permission. No diagnostic hardening, credential-format/length change, additional error code, dependency change or out-of-scope source edit was introduced.

- Starting round HEAD: `3b1d62284b0794a3249d613d7ff2eb1897c5c108`.
- Final local commit: `112bc593464315a9531b6af6d00d9d2368985daa` — `TASK-T2F13: reject mistyped credential flags at every dial entry`.
- transport.ts:600-604 and :947-950 capture only the flag and reject non-boolean, non-null values using the existing `credential-unusable` code before provider invocation, binding resolution/spawn (factory entry), or WebSocket I/O. Undefined/null/false continue into the original legacy bodies. Literal true still enters the existing strict implementation.
- Both exported entries are covered directly for `'true'`, `1` and `{}`: zero provider calls and zero upgrade requests. A real connection/reconnect regression test mutates the flag after its first successful dial and proves no second provider call or upgrade. The existing connection open path uses openTransport at server-connection.ts:1275, so callers such as connect/reconnect/restart/programmatic connect receive admission rather than relying only on shared configuration validation.
- README.md:330-337 documents dial-entry refusal and pins explicit `protocol: 'legacy'` on a strict WebSocket server as **refused**, as is `'modern'`: the protocol selector is stdio-only and the URL decides a network family. Both direct and shared admission are tested; existing HTTP/modern-family refusal tests remain green.
- New direct WebSocket admission tests reject ambiguous command+URL and stdio transport without command. Testing WebSocketTransport.open directly prevents the factory's binding check from masking an omitted snapshot field.
- SERVER_CONFIG_BOOLEANS/assertServerConfigBooleans were NOT changed. A source gate proves their complete table, messages and iteration identical to the prior round. It also proves the legacy WebSocket dial body and factory body after new-flag admission are byte-identical to original base `4976c67d5c7916a15046c627b68913994c33b3cb`.

Round diff (allowed files only):

```text
README.md                            |  5 ++-
 src/mcpl/transport.ts                | 10 +++++-
 test/mcpl-credential-verify.mjs      |  2 +-
 test/mcpl-strict-credentials.test.ts | 60 +++++++++++++++++++++++++++++++++++-
 4 files changed, 73 insertions(+), 4 deletions(-)
```

Round production delta: +9/-1 (net 8); README +4/-1 (net 3); tests +60/-2 (net 58). Cumulative versus original base: production net **126**, tests **709**, README **39**. No additional production hunks except the two new-flag entry checks; no existing-settings read, copy, error text or ordering change. No cherry-pick or earlier-branch reuse in this round. No push, PR, tag, version bump, review or landing.

# Verification Gates

## Environment and acquisition continuity

Same installed tree as round 1: Bun 1.4.3, Node v22.23.3, npm 10.9.9. Bun binary digest previously checked: `7ce7d6b654eddeec20afddf2396317fba6dc19ab52788a27e894e1806bf8f24b`.

No install or dependency resolution occurred. Preserved package-lock.json bytes still hash to `0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`; the acceptance verifier checks the current lock against the preserved external copy. The prior manager disposition retained the public npm update-notifier metadata deviation without restart. This round disables update notifications **from its first command**, and every npm gate receives NO_UPDATE_NOTIFIER=1 plus npm_config_update_notifier=false. No further acquisition was performed.

Test processes used `env -i PATH="$PATH" HOME="$E/home" LD_PRELOAD="$E/loopback-only.so" NO_UPDATE_NOTIFIER=1`; npm gates additionally received the empty user/global config paths and npm_config_update_notifier=false. Only local files and self-started loopback servers were used; credentials are synthetic, and model/provider adapters in router controls are mocks. The loopback filter from round 1 is preserved, not an all-sockets-denied sandbox.

All gates ran through `orgasmic dispatch gate`. Final positive gates ran on a clean tracked tree at the final commit. Negative baselines/mutants intentionally exit 1 and are not claimed as positive gate passes.

| Gate | Command after isolated environment | Result |
|---|---|---|
| r2-build | npm run build | PASS |
| r2-typecheck | node_modules/.bin/tsc --noEmit | PASS |
| r2-suite | npm test | 7,945 tests: 7,900 pass; 45 skipped; 0 failed |
| r2-scope | node $E/scope.mjs | PASS; legacy dial/factory and boolean validator source identity; four allowed round files |
| r2-final-credentials-node | node --import tsx --test --test-concurrency=1 test/mcpl-strict-credentials.test.ts test/mcpl-credential-legacy.test.ts | 86 PASS |
| r2-final-credentials-bun | bun-1.4.3 test test/mcpl-strict-credentials.test.ts test/mcpl-credential-legacy.test.ts | 86 PASS |
| r2-baseline-credentials-node | same Node command with --import ./test/mcpl-credential-base-overlay.mjs before --test | 32 controls PASS, 54 new cases FAIL as expected |
| r2-baseline-credentials-bun | same Bun command with --preload ./test/mcpl-credential-base-overlay.mjs | 32 controls PASS, 54 new cases FAIL as expected |
| r2-acceptance-comparison | T2F13_EVIDENCE=$E node test/mcpl-credential-verify.mjs | PASS; A/B/C/E checks, hashes, full per-test matrix |

The unmodified original full suite had 7,859 tests (7,814 pass / 45 skip / 0 fail). Prior round had 7,933 tests (7,888 pass / 45 skip / 0 fail). The increase is exactly this round's 12 tests; no pre-existing failure or regression.

## Regression red/green and capture sensitivity

Before changing production code, r2-prefixed-implementation-node and r2-prefixed-implementation-bun each ran the expanded 86-test set against the prior implementation: **79 pass, 7 fail**. Failures were precisely the six mistyped direct-entry cases and the reconnect case. Both engines now pass all 86.

At final HEAD, deliberate in-memory mutants (no tracked file edits) proved the new admission tests are sensitive to the captured fields:

| Negative gate | Expected outcome |
|---|---|
| r2-drop-command-capture | ambiguous command+URL test FAIL; missing-command stdio test PASS |
| r2-drop-transport-capture | ambiguous command+URL test PASS; missing-command stdio test FAIL |

Commands: `node --import tsx --import "$E/drop-capture.mjs" --test --test-name-pattern 'new: strict direct admission' test/mcpl-strict-credentials.test.ts`, with T2F13_ROOT set to the local repository file URL and T2F13_DROP_CAPTURE=command or transport. The external loader substitutes only that captured field with undefined in memory. Each negative gate exits 1, one test fails and the other passes; this is mutation sensitivity evidence, not manufactured base-red behavior. The committed unmutated suite is green.

## Base-versus-final production comparisons, both engines

All eight sink pairs and all behavioral receipts were regenerated from the original-base source overlay and final source, on this same dependency tree. The overlay uses git show for all three changed production sources and neither checks out a branch nor reinstalls packages.

For each engine, these four named gates PASS:
- r2-sinks-base-ENGINE, r2-sinks-final-ENGINE
- r2-wire-base-ENGINE, r2-wire-final-ENGINE

Node launch: `node --import tsx [--import ./test/mcpl-credential-base-overlay.mjs] SCRIPT`.
Bun launch: `bun-1.4.3 [--preload ./test/mcpl-credential-base-overlay.mjs] SCRIPT`.
Overlay arguments apply only to base. SCRIPT is test/mcpl-credential-comparison.mjs or test/mcpl-credential-wire-and-failures.mjs. T2F13_ARTIFACT selects sinks-/wire-VERSION-ENGINE.json; T2F13_WORKSPACE selects the same disposable scenario directory for sink runs. All exact argv are in the named gate receipts.

Sink clocks are fixed; only loopback ephemeral ports normalized. All sinks are nonempty and come through real runtime connections, tool refresh/notices, real failures.log, and a real loopback webhook POST. No other value is normalized.

| Engine | Sink | Base sha256 | Final sha256 |
|---|---|---|---|
| node | traces | `5deb627dd182204ff2d2d54214c85ce4386cf2238d73cee623e23a47f706636c` | `5deb627dd182204ff2d2d54214c85ce4386cf2238d73cee623e23a47f706636c` |
| node | console | `d4f7d832f558f3c2a059f6de2646588c591b6c9519181340442b5fa6444fd2c7` | `d4f7d832f558f3c2a059f6de2646588c591b6c9519181340442b5fa6444fd2c7` |
| node | failures | `e190c50773b4ebd489842c623a32222f95b91cc968b6ca4a94ff01043a33be74` | `e190c50773b4ebd489842c623a32222f95b91cc968b6ca4a94ff01043a33be74` |
| node | webhook | `cd4f5670bd229528e0f1c89f6e5f99fd96a75552365fc5b2280b2d59980b21cf` | `cd4f5670bd229528e0f1c89f6e5f99fd96a75552365fc5b2280b2d59980b21cf` |
| node | shared | `64fdd4b5e6e9b0599fdadb081fd80c7c371e8e77bb6fa9bb97a4efddc00b6fa1` | `64fdd4b5e6e9b0599fdadb081fd80c7c371e8e77bb6fa9bb97a4efddc00b6fa1` |
| node | presentation | `ba49af086a4604ead9313192877b4101e52ec006c58e52cbccc0691d561c8057` | `ba49af086a4604ead9313192877b4101e52ec006c58e52cbccc0691d561c8057` |
| node | notices | `ef4c7925a00c2fbd1fdf7563e8b7a3285ab71e947968c51362c86055356e4818` | `ef4c7925a00c2fbd1fdf7563e8b7a3285ab71e947968c51362c86055356e4818` |
| node | listing | `1cf537288c7356d9400489180f695c2348a469f029547be8f292e491e8789267` | `1cf537288c7356d9400489180f695c2348a469f029547be8f292e491e8789267` |
| bun | traces | `dcbbad48c50ddeaff3d91814376cbe7e0f131408d7bd715d119894fcb644cce2` | `dcbbad48c50ddeaff3d91814376cbe7e0f131408d7bd715d119894fcb644cce2` |
| bun | console | `d4f7d832f558f3c2a059f6de2646588c591b6c9519181340442b5fa6444fd2c7` | `d4f7d832f558f3c2a059f6de2646588c591b6c9519181340442b5fa6444fd2c7` |
| bun | failures | `0f7df08b0a092cb5a742aaa159938112717884125408f4a6b054c3667e5a1d9a` | `0f7df08b0a092cb5a742aaa159938112717884125408f4a6b054c3667e5a1d9a` |
| bun | webhook | `c53d96c2d50aa9e62621cfd6f635d23b15ad07fbfbf5ce24afac5aaaefb25a1f` | `c53d96c2d50aa9e62621cfd6f635d23b15ad07fbfbf5ce24afac5aaaefb25a1f` |
| bun | shared | `64fdd4b5e6e9b0599fdadb081fd80c7c371e8e77bb6fa9bb97a4efddc00b6fa1` | `64fdd4b5e6e9b0599fdadb081fd80c7c371e8e77bb6fa9bb97a4efddc00b6fa1` |
| bun | presentation | `ba49af086a4604ead9313192877b4101e52ec006c58e52cbccc0691d561c8057` | `ba49af086a4604ead9313192877b4101e52ec006c58e52cbccc0691d561c8057` |
| bun | notices | `ef4c7925a00c2fbd1fdf7563e8b7a3285ab71e947968c51362c86055356e4818` | `ef4c7925a00c2fbd1fdf7563e8b7a3285ab71e947968c51362c86055356e4818` |
| bun | listing | `1cf537288c7356d9400489180f695c2348a469f029547be8f292e491e8789267` | `1cf537288c7356d9400489180f695c2348a469f029547be8f292e491e8789267` |

All 16 sink pairs match. Behavioral comparisons retain raw request bytes and normalize ONLY the random Sec-WebSocket-Key value, per the prior manager instruction. Every other request/header byte (names, values, whitespace, order and count) matches. Keys are canonical base64 decoding to 16 bytes and unique on every dial; zero frames/extra bytes precede the first server response. No production client is wrapped/replaced. Error class/text/shape, provider fallback/logs, prototype/non-enumerable/stateful responders, streaming and fixed inference event/reason controls all remain identical.

| Engine | Behavior | Base sha256 | Final sha256 |
|---|---|---|---|
| node | wire | `e8f877a4014c84648dfac0e56120dbc78b23dcc392868482c8987b96d1b5dfd7` | `e8f877a4014c84648dfac0e56120dbc78b23dcc392868482c8987b96d1b5dfd7` |
| node | logs | `8cda2533ebaecacaead9eb95017a0a7b644ec29582f482b1f8c0fdae04fdfb41` | `8cda2533ebaecacaead9eb95017a0a7b644ec29582f482b1f8c0fdae04fdfb41` |
| node | failures | `7c0861f932375538e4ae35a8a56e7218eaa117c4a6810d7014128491d94ff5a9` | `7c0861f932375538e4ae35a8a56e7218eaa117c4a6810d7014128491d94ff5a9` |
| bun | wire | `a7ce73d16a09d39de7987326df590bffd3a7302e6beea46d50562df131149a3e` | `a7ce73d16a09d39de7987326df590bffd3a7302e6beea46d50562df131149a3e` |
| bun | logs | `8cda2533ebaecacaead9eb95017a0a7b644ec29582f482b1f8c0fdae04fdfb41` | `8cda2533ebaecacaead9eb95017a0a7b644ec29582f482b1f8c0fdae04fdfb41` |
| bun | failures | `7629f30ac2845c837696a759fbde2d32bf57f129fbe03897a5bf0d3620f5d9e6` | `7629f30ac2845c837696a759fbde2d32bf57f129fbe03897a5bf0d3620f5d9e6` |

Per-engine redirect tests for 301/302/303/307/308 also PASS within the focused suite: exactly one authenticated original-origin upgrade, zero destination-origin requests, fixed-code failed dial.

## Per-test baseline/final evidence

The complete 86-test per-engine matrix is in acceptance.json, with names, control/red-then-green classification and original-base/final outcomes. New round tests are listed below; outcomes are identical on Node and Bun.

| Added test | Original-base classification | Base Node/Bun | Final Node/Bun |
|---|---|---|---|
| new: openTransport rejects mistyped flag "true" before provider or upgrade | red-then-green | FAIL/FAIL | PASS/PASS |
| new: openTransport rejects mistyped flag 1 before provider or upgrade | red-then-green | FAIL/FAIL | PASS/PASS |
| new: openTransport rejects mistyped flag {} before provider or upgrade | red-then-green | FAIL/FAIL | PASS/PASS |
| new: WebSocketTransport.open rejects mistyped flag "true" before provider or upgrade | red-then-green | FAIL/FAIL | PASS/PASS |
| new: WebSocketTransport.open rejects mistyped flag 1 before provider or upgrade | red-then-green | FAIL/FAIL | PASS/PASS |
| new: WebSocketTransport.open rejects mistyped flag {} before provider or upgrade | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict direct dial refuses explicit protocol legacy before provider or upgrade | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict direct dial refuses explicit protocol modern before provider or upgrade | red-then-green | FAIL/FAIL | PASS/PASS |
| control: shared WebSocket admission refuses explicit legacy and modern protocol selectors | control | PASS/PASS | PASS/PASS |
| new: strict direct admission captures ambiguous command and URL | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict direct admission captures stdio transport without command | red-then-green | FAIL/FAIL | PASS/PASS |
| new: reconnect refuses a newly mistyped flag before another provider call or upgrade | red-then-green | FAIL/FAIL | PASS/PASS |

The protocol/binding pins already pass against the prior round; they are not presented as regressions fixed in this round. Against original base their genuinely strict behavior is red, except the existing shared-selector refusal control. All other round-1 controls and strict tests retain their prior classifications.

# Unmet Criteria

None for this fix round. The documented original acquisition deviation remains a retained deviation under the manager's explicit instruction, not a claim that the extra notifier request met the original acquisition restriction. No fresh install or resolution change occurred.

# Residual Risk

Strict mode remains pinned to Bun 1.4.3 and Node 22.23.3 with npm ws; other versions remain unsupported. Parts 2-4 (diagnostic publication/projection, catalogue admission/rotation invalidation, drift guard) are not implemented or certified. Existing redaction and headerCarries remain unchanged. No minimum credential format/length or fifth reason code was added.

Evidence is retained under credential-part1-round2/ in this run's evidence directory: report.md, acceptance.json, original lock bytes, gate wrapper logs, raw sink/wire JSON, mutation/scope loader sources, and loopback filter. Native gate receipts remain in the run evidence directory. Ignored build/test artifacts and existing node_modules are mechanical side effects, not tracked edits. No earlier-round task/conventions/report reread was needed.

Later-part design note: the unchanged original-config noteDialSent key and captured strict id/endpoint/binding policy remain the relevant dial seam. Diagnostic and catalogue work still need a separately designed publication policy and per-dial admission/rotation epoch; no such interface/state was added here.
