# Changed

TASK-T2F13 implements part 1's opt-in fail-closed dial only. This is NOT full-R7 certification and NOT rollout permission. Acceptance evidence below uses the manager's explicit C(2) normalization instruction and retains the explicitly disclosed acquisition deviation under the manager's disposition.

## Starting state, environment and acquisition

- Starting HEAD: `4976c67d5c7916a15046c627b68913994c33b3cb` (package 0.27.0), exactly the required base.
- Final HEAD: `3b1d62284b0794a3249d613d7ff2eb1897c5c108`; local branch only. No push, PR, tag, version/dependency edit, publish, review, landing or housekeeping.
- Preflight commands: `git rev-parse HEAD`; `bun-1.4.3 --version`; `command -v bun-1.4.3 | xargs sha256sum | cut -d' ' -f1`; `node --version`; `npm --version`.
- Bun: 1.4.3; binary sha256: `7ce7d6b654eddeec20afddf2396317fba6dc19ab52788a27e894e1806bf8f24b`. Node: v22.23.3. npm: 10.9.9.
- Read the live task, project.org, Worker route and dispatch lifecycle instructions. Conventions and gotchas collections were empty; no applicable AGENTS.md was found. Tier: risky (P1, credential safety; subsequently breadth from test/doc lines).
- Exactly one install: `env -i PATH="$PATH" HOME="$E/home" npm_config_userconfig="$E/userconfig" npm_config_globalconfig="$E/globalconfig" npm install --ignore-scripts --registry https://registry.npmjs.org/ --no-audit --no-fund`. The HOME-like directory was fresh, user/global config files were empty, and a project .npmrc was confirmed absent before invoking npm. No authentication variables were set. No lifecycle scripts were enabled or required. Resolved dependency sources were checked against the public npm registry.
- Acquisition deviation: npm's default update notifier additionally fetched `https://registry.npmjs.org/npm` (public package-manager metadata, not a declared dependency). This is outside the declared-dependencies-only boundary. It is recorded, not excused. Manager disposition for `ask-a19854cfb5d64d9c93c67ff9c814b5a9`: **"Retain the current evidence; do not restart."** The exact extra request was GET https://registry.npmjs.org/npm, made by npm's update notifier, public registry metadata only; no credentials, install/resolution change or lock-hash change. All subsequent npm invocations disable update notifications using NO_UPDATE_NOTIFIER=1 and npm_config_update_notifier=false. No private/non-registry source or credential was used. No reinstall was performed to hide or replace this evidence.
- Generated package-lock.json bytes are preserved outside the repository in the evidence bundle; sha256: `0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`. This same installed tree was used for ALL baseline/final runs; no reinstall or resolution change occurred. Development evidence only, not a sealed candidate closure.

| Package | Resolved version | Integrity |
|---|---|---|
| ws | 8.22.0 | `sha512-Ydggc987+RO0AnWtZ/7Wq9FtNvcrL1b/RO0ud9mWjUPgDrsAAwQSF51sm2hm1XofbU/4jkpGEsLFsZZxU+1DOg==` |
| typescript | 7.0.2 | `sha512-8FYau96o3NKOhbjKi/qNvG/W5jhzxkbdm5sj9AbZ/5T5sWqn3hJgLfGx27sRKZWTvyzCP8dLRBTf5tBTSRVUNA==` |
| tsx | 4.23.15 | `sha512-Yiex1Ovn8z2xPpOWckIiysV1SSyRMY9BkLF++q0yKiDxCqRhosKfMg3janKkiLBwZ5c/YryloKwGZcrEmtwxKw==` |
| @types/node | 22.20.5 | `sha512-U2+DNr+wSjpsTS/wZGYHq7GcwfuSmKiKvoPvK22zwTlRhU91yOniN4qRR5KhIjvif7ysw/dz/hKmfDH0Ris4aA==` |
| @types/ws | 8.18.2 | `sha512-67MQl+fpWKVTT1NYdnmo3U4sc/xPo/zQBncVnI74qmQa0z/b+1g6iYqNmGCPbxO+zz2aklb08a0oHfegiVd0/w==` |
| @animalabs/mcpl-core | 0.4.0 | `sha512-+XMPYcQb8ausCcSEnj/8nJw6tZuOTprBbtUFCna+/hOVJ7GUg/uMinBhuqmTpKqVgOe38VxbMP6/Zucvgxxu4A==` |
| @modelcontextprotocol/server | 2.4.0 | `sha512-rgR9yxSaAJ+bcsi/XroT/S2AfPiIWloXAnrdfYSCms9ivVju0ishu/wW0J21Ho6+ZOR1r7RyeRbjiRuF87ix5Q==` |

## Commits and scope (acceptance A)

- `93a23e4f`: strict credential policy, dial and accompanying README documentation.
- `cdb66b32`: strict/legacy tests and source-overlay/production-path comparison harnesses.
- `1ffe1ff1`: comparison verifier accepts Bun's zero-duration receipt lines (some omit their duration suffix).
- `3b1d6228`: manager-directed actual raw wire/pre-response capture and canonical/fresh 16-byte handshake-key assertions.
- Cherry-picked: none. The following named earlier commits were supplied in a manager message delivered after the fresh implementation was complete; each was declined for reuse because this implementation was already written fresh, and no reuse was necessary: `d8ab99c9`, `f4e38cedc652404cc059bb360cdaff19dcc5ad8d`, `fb4c3329543d8526ad927e833eaa09adc256e147`, `fd575946248892f4c5ff7116254d0e71c5d496bd`, `340231e371c2b1efebefd8f974c3923332ea569c`. No earlier implementation or supplied private harness was read, copied or cherry-picked. No assertion about their whole-commit scope is made.
- `git diff --stat 4976c67d5c7916a15046c627b68913994c33b3cb..HEAD`: only the ten allowed files below. Production: 120 added / 2 removed, net **118**. Tests: **651** new lines. README: **36** new lines. Under the approximately 300-net-production-line limit.

```text
README.md                                  |  36 ++++
 src/mcpl/protocol-family.ts                |  25 +++
 src/mcpl/transport.ts                      |  84 +++++++++-
 src/mcpl/types.ts                          |  13 ++
 test/mcpl-credential-base-overlay.mjs      |  28 ++++
 test/mcpl-credential-comparison.mjs        |  97 +++++++++++
 test/mcpl-credential-legacy.test.ts        |  99 +++++++++++
 test/mcpl-credential-verify.mjs            |  73 +++++++++
 test/mcpl-credential-wire-and-failures.mjs | 100 ++++++++++++
 test/mcpl-strict-credentials.test.ts       | 254 +++++++++++++++++++++++++++++
 10 files changed, 807 insertions(+), 2 deletions(-)
```

Production hunks outside the separate strict-only dial:
1. transport.ts:28 adds an import binding from the already-imported module (no new module or side effect).
2. transport.ts:600 is the mandated early literal-true guard. The existing legacy body is otherwise byte-for-byte unchanged.
3. transport.ts:909 excludes this separately validated flag from a type-level Record key set. Erased by compilation; the runtime boolean table/iteration is unchanged, avoiding another legacy read.
4. protocol-family.ts:698 is the single shared-validation call. For undefined/null/false the helper returns an empty array immediately; no existing config fields are read beyond the new flag and no caller object is copied or mutated.
5. types.ts:315-327 adds only documentation and an optional erased type member.
The new helper at protocol-family.ts:763-785 handles flag admission; its legacy early return is above all other reads. The strict implementation at transport.ts:698-775 can be reached only through the literal-true guard. No caller responder, error, event, transport or config is replaced on the legacy path.

## Flag semantics and requirement evidence

`credentialRequired` is the final name. Only literal true enables it. False, null and omission retain legacy behavior; all other values are configuration problems without quoting the value.

| Requirement | Production anchor | Test evidence |
|---|---|---|
| R1 | types.ts:315-327; protocol-family.ts:766-770 | six non-boolean cases; legacy flag undefined/false/null controls |
| R2 | protocol-family.ts:698, 774-781; transport.ts:717-719 | static token (including empty), query/omitted mode, URL token/userinfo; missing provider; direct dial validates before provider |
| R3 | transport.ts:724-742 | provider throw/null/empty/spaces/control/non-ASCII/non-string; server refusal is one authenticated attempt and a fixed-code Error without cause |
| R4 | protocol-family.ts:783 | remote IP and never-resolve.invalid refused before provider/DNS/connect; zero local upgrade requests |
| R5 | transport.ts:713-720, 741 | unsupported Bun/Node simulations call provider zero times; 301/302/303/307/308 production-path redirect tests on each engine |
| R6 | protocol-family.ts:774-775 | HTTP, HTTPS, stdio and modern configuration refusals |
| R7 reduced | transport.ts:710, 738, 770; protocol-family.ts:824 unchanged | no provider result added to config/serialization; fixed-code errors; existing noteDialSent statement unchanged in the legacy body and identical in strict dial; no new redaction registry or credential floor |
| R8 | transport.ts:703-723, 728, 738, 766 | one pending-provider mutation test per URL, mode, flag, static token, provider, id, command, transport and protocol; all-read getters forbid any original-config reread after await |
| R9 | README.md:326-360 | required sentence verbatim; every-dial provider/reconnect rotation, failing provider, exact engine pins, unsupported engines, non-WebSocket refusal and reduced-R7 limits documented |

Strict errors contain only server id and provider-threw/provider-empty/credential-unusable/engine-unsupported. Timeout/abandonment and socket failures use credential-unusable; the abort race, 15-second socket-open timeout, teardown and swallow-late-error mechanics are retained on the strict path. Legacy error text/classes/options are untouched. headerCarries() is unchanged, with no minimum length or new format rule.

### Per-engine redirects

| Engine | 301 | 302 | 303 | 307 | 308 |
|---|---|---|---|---|---|
| Node 22.23.3 + npm ws 8.22.0 | PASS | PASS | PASS | PASS | PASS |
| Bun 1.4.3 | PASS | PASS | PASS | PASS | PASS |

Every case: first loopback origin sees exactly one authenticated upgrade; second origin sees **zero** requests; production WebSocketTransport.open rejects with the fixed credential-unusable error. No copied dial logic is used.

# Verification Gates

## Commands, isolation and receipts

Every actual build/test/typecheck/comparison gate was run via `orgasmic dispatch gate NAME -- COMMAND...`. The daemon retains unique gate-NAME-invocation.log receipts in this run's evidence directory. Final successful gates below ran with clean tracked trees at final HEAD. Intentional red baselines are recorded as failed gates, not misreported as passes.

Test child processes received `env -i PATH="$PATH" HOME="$E/home" LD_PRELOAD="$E/loopback-only.so"`; package-manager commands also received the two empty config paths; final npm invocations additionally received NO_UPDATE_NOTIFIER=1 and npm_config_update_notifier=false. No real credentials/tokens or provider/model calls were supplied. The externally stored C interposer permits loopback/Unix sockets, blocks non-loopback connect/sendto, and prevents nonnumeric/non-localhost getaddrinfo lookups; it does NOT deny socket creation. All servers created by these probes bind 127.0.0.1 on ephemeral ports. Network namespaces were unavailable, so no claim of a network-namespace sandbox is made. Acquisition and testing were separate phases. The interposer source and acquisition audit are retained for reproduction.

Gate commands (prefix the executable with the isolated environment above as shown in the receipts):

- `baseline-build`, `final-build`: `npm run build`.
- `baseline-typecheck`, `final-typecheck`: `node_modules/.bin/tsc --noEmit`.
- `baseline-suite`, `final-suite`: `npm test` (the repository's Node test script, unchanged).
- `baseline-credentials-node`: `node --import tsx --import ./test/mcpl-credential-base-overlay.mjs --test --test-concurrency=1 test/mcpl-strict-credentials.test.ts test/mcpl-credential-legacy.test.ts`.
- `final-credentials-node`: same without the overlay import.
- `baseline-credentials-bun`: `bun-1.4.3 test --preload ./test/mcpl-credential-base-overlay.mjs test/mcpl-strict-credentials.test.ts test/mcpl-credential-legacy.test.ts`.
- `final-credentials-bun`: same without --preload and its argument.
- `sinks-{base,final}-{node,bun}`: Node uses `node --import tsx [--import ./test/mcpl-credential-base-overlay.mjs] test/mcpl-credential-comparison.mjs`; Bun uses `bun-1.4.3 [--preload ./test/mcpl-credential-base-overlay.mjs] test/mcpl-credential-comparison.mjs`. Overlay options apply only to base. Set T2F13_WORKSPACE to the same disposable directory each run and T2F13_ARTIFACT to the corresponding sinks-VERSION-ENGINE.json.
- `wire-{base,final}-{node,bun}`: identical launch forms, with `test/mcpl-credential-wire-and-failures.mjs` and the corresponding wire-VERSION-ENGINE.json output.
- `acceptance-comparison`: `env -i PATH="$PATH" HOME="$E/home" T2F13_EVIDENCE="$E" node test/mcpl-credential-verify.mjs`.

The overlay loads each changed source directly from the specified base with git show, while all other modules and installed dependencies remain shared. No checkout, branch switch or reinstall. Baseline/final runs each use fresh processes. Comparison scripts and per-test matrix are retained in the repository, raw artifacts in the evidence bundle.

Exploratory failures were corrected, not counted as acceptance passes: an over-isolated outer gate invocation could not authenticate to the local daemon and launched no gate; Bun requires `bun-1.4.3 test`, not Node's --test form; the sink scenario initially expected only one notice but base correctly emits initial and refresh notices (two); the receipt parser initially missed Bun's zero-duration lines and was fixed in the final test-only commit. All final named evidence was rerun at final HEAD. None is a production regression.

## B. Eight serialized sink pairs

Clock fixed before loading framework modules (Date and performance); only ephemeral loopback ports normalized. No ids, strings, events, ordering or other values normalized. Real runtime MCPL connection, tools/list_changed refresh, real loopback upgrade refusal, real failures.log append, real loopback HTTP webhook POST. Shared tools and per-agent presentation snapshot/rendered catalogue are captured; both initial and refresh new-tools notices are nonempty.

| Engine | Sink | Base sha256 | Final sha256 |
|---|---|---|---|
| node | traces | `5deb627dd182204ff2d2d54214c85ce4386cf2238d73cee623e23a47f706636c` | `5deb627dd182204ff2d2d54214c85ce4386cf2238d73cee623e23a47f706636c` |
| node | console | `d4f7d832f558f3c2a059f6de2646588c591b6c9519181340442b5fa6444fd2c7` | `d4f7d832f558f3c2a059f6de2646588c591b6c9519181340442b5fa6444fd2c7` |
| node | failures | `e190c50773b4ebd489842c623a32222f95b91cc968b6ca4a94ff01043a33be74` | `e190c50773b4ebd489842c623a32222f95b91cc968b6ca4a94ff01043a33be74` |
| node | webhook | `cd4f5670bd229528e0f1c89f6e5f99fd96a75552365fc5b2280b2d59980b21cf` | `cd4f5670bd229528e0f1c89f6e5f99fd96a75552365fc5b2280b2d59980b21cf` |
| node | shared | `64fdd4b5e6e9b0599fdadb081fd80c7c371e8e77bb6fa9bb97a4efddc00b6fa1` | `64fdd4b5e6e9b0599fdadb081fd80c7c371e8e77bb6fa9bb97a4efddc00b6fa1` |
| node | presentation | `2b4d7357d0087c96d48a96bf8532dfa8c4414e81c1cf91a1269f132c0572f9fd` | `2b4d7357d0087c96d48a96bf8532dfa8c4414e81c1cf91a1269f132c0572f9fd` |
| node | notices | `ef4c7925a00c2fbd1fdf7563e8b7a3285ab71e947968c51362c86055356e4818` | `ef4c7925a00c2fbd1fdf7563e8b7a3285ab71e947968c51362c86055356e4818` |
| node | listing | `1cf537288c7356d9400489180f695c2348a469f029547be8f292e491e8789267` | `1cf537288c7356d9400489180f695c2348a469f029547be8f292e491e8789267` |
| bun | traces | `dcbbad48c50ddeaff3d91814376cbe7e0f131408d7bd715d119894fcb644cce2` | `dcbbad48c50ddeaff3d91814376cbe7e0f131408d7bd715d119894fcb644cce2` |
| bun | console | `d4f7d832f558f3c2a059f6de2646588c591b6c9519181340442b5fa6444fd2c7` | `d4f7d832f558f3c2a059f6de2646588c591b6c9519181340442b5fa6444fd2c7` |
| bun | failures | `0f7df08b0a092cb5a742aaa159938112717884125408f4a6b054c3667e5a1d9a` | `0f7df08b0a092cb5a742aaa159938112717884125408f4a6b054c3667e5a1d9a` |
| bun | webhook | `c53d96c2d50aa9e62621cfd6f635d23b15ad07fbfbf5ce24afac5aaaefb25a1f` | `c53d96c2d50aa9e62621cfd6f635d23b15ad07fbfbf5ce24afac5aaaefb25a1f` |
| bun | shared | `64fdd4b5e6e9b0599fdadb081fd80c7c371e8e77bb6fa9bb97a4efddc00b6fa1` | `64fdd4b5e6e9b0599fdadb081fd80c7c371e8e77bb6fa9bb97a4efddc00b6fa1` |
| bun | presentation | `2b4d7357d0087c96d48a96bf8532dfa8c4414e81c1cf91a1269f132c0572f9fd` | `2b4d7357d0087c96d48a96bf8532dfa8c4414e81c1cf91a1269f132c0572f9fd` |
| bun | notices | `ef4c7925a00c2fbd1fdf7563e8b7a3285ab71e947968c51362c86055356e4818` | `ef4c7925a00c2fbd1fdf7563e8b7a3285ab71e947968c51362c86055356e4818` |
| bun | listing | `1cf537288c7356d9400489180f695c2348a469f029547be8f292e491e8789267` | `1cf537288c7356d9400489180f695c2348a469f029547be8f292e491e8789267` |

All **16 pairs match**. Raw sinks-VERSION-ENGINE.json and acceptance.json are retained.

## C. Behavioral identity

1. Throwing/null/empty/value providers in both header/query modes match base requests and log text. Empty string retains the base's no-token behavior; throw/null retain its static fallback. Class-based configuration/provider receivers, own-property keys and provider-error descriptors/cause remain intact.
2. Eight raw HTTP upgrade receipts per engine retain every wire header. After port normalization, request targets and ALL other header bytes match except Sec-WebSocket-Key, which each engine generates randomly for each handshake. Actual raw incoming bytes are retained, rather than reconstructed HTTP parser fields. Every key is canonical base64 decoding to exactly 16 bytes, unique across all sixteen base/final dials per engine. The raw loopback server delays its first response for 20ms and captures zero bytes/frames beyond the upgrade request before that first response on every dial. Only the Sec-WebSocket-Key VALUE is normalized; header names, values other than that key, whitespace, order and count are unchanged. No production WebSocket client was replaced or wrapped. This implements the manager-approved C(2) interpretation below. Literal random-key equality itself is not claimed.
3. Abandonment, connect failure, 403 refusal, actual 15-second timeout, missing/invalid URL, wrong scheme, fragment, invalid mode, header/query conflict, header/userinfo conflict, unusable header and constructor refusal: same error text, class/prototype, own keys, descriptor flags and lack of cause, within each engine. Not an error-stack byte comparison: stacks naturally name different source locations.
4. All six responder/streaming combinations (prototype methods, non-enumerable methods, stateful this; streamed and whole) pass through the production inference router on base/final, both engines. Prototype/method identities and the responder's receiver/state are asserted directly.
5. mcpl:inference_fail and its exact synthetic failure reason, inference_start and inference_complete remain pinned.
6. Caller configuration identity/prototype/keys, provider error identity/descriptors, and the original transport instance's shape through writeLine are asserted. No new config own properties appear in legacy mode.

| Engine | Serialized behavior | Base sha256 | Final sha256 |
|---|---|---|---|
| node | wire (only random key value normalized; zero pre-response frames) | `e8f877a4014c84648dfac0e56120dbc78b23dcc392868482c8987b96d1b5dfd7` | `e8f877a4014c84648dfac0e56120dbc78b23dcc392868482c8987b96d1b5dfd7` |
| node | logs | `8cda2533ebaecacaead9eb95017a0a7b644ec29582f482b1f8c0fdae04fdfb41` | `8cda2533ebaecacaead9eb95017a0a7b644ec29582f482b1f8c0fdae04fdfb41` |
| node | failures | `7c0861f932375538e4ae35a8a56e7218eaa117c4a6810d7014128491d94ff5a9` | `7c0861f932375538e4ae35a8a56e7218eaa117c4a6810d7014128491d94ff5a9` |
| bun | wire (only random key value normalized; zero pre-response frames) | `a7ce73d16a09d39de7987326df590bffd3a7302e6beea46d50562df131149a3e` | `a7ce73d16a09d39de7987326df590bffd3a7302e6beea46d50562df131149a3e` |
| bun | logs | `8cda2533ebaecacaead9eb95017a0a7b644ec29582f482b1f8c0fdae04fdfb41` | `8cda2533ebaecacaead9eb95017a0a7b644ec29582f482b1f8c0fdae04fdfb41` |
| bun | failures | `7629f30ac2845c837696a759fbde2d32bf57f129fbe03897a5bf0d3620f5d9e6` | `7629f30ac2845c837696a759fbde2d32bf57f129fbe03897a5bf0d3620f5d9e6` |

## D. Existing full suite, build and typecheck

| Gate | Unmodified base | Final committed tree |
|---|---|---|
| npm run build | PASS | PASS |
| node_modules/.bin/tsc --noEmit | PASS | PASS |
| npm test | 7,859 tests: 7,814 pass, 45 skip, 0 fail | 7,933 tests: 7,888 pass, 45 skip, 0 fail |

Exactly 74 added tests; no existing failure. The repository's full suite runs on Node via npm test; focused new tests and all production comparisons separately run on both exact engines. No claim that the entire existing suite was ported to Bun's runner.

## E. Per-test baseline/final matrix

Same outcomes on Node and Bun: **31 controls PASS→PASS; 43 genuine additions FAIL→PASS**. Baseline-credentials gates exit 1 intentionally (43 assertions fail); final-credentials gates exit 0 (74 pass). The matrix below lists every new named test. The two production scenario scripts are additional controls, PASS on base/final on both engines. The verification script is an evidence checker, not another production behavior test.

| Test | Classification | Base Node/Bun | Final Node/Bun |
|---|---|---|---|
| control: legacy flag undefined preserves validation | control | PASS/PASS | PASS/PASS |
| control: legacy flag false preserves validation | control | PASS/PASS | PASS/PASS |
| control: legacy flag null preserves validation | control | PASS/PASS | PASS/PASS |
| control: legacy query provider throws preserves receiver, fallback, wire and shape | control | PASS/PASS | PASS/PASS |
| control: legacy query provider null preserves receiver, fallback, wire and shape | control | PASS/PASS | PASS/PASS |
| control: legacy query provider empty preserves receiver, fallback, wire and shape | control | PASS/PASS | PASS/PASS |
| control: legacy query provider value preserves receiver, fallback, wire and shape | control | PASS/PASS | PASS/PASS |
| control: legacy header provider throws preserves receiver, fallback, wire and shape | control | PASS/PASS | PASS/PASS |
| control: legacy header provider null preserves receiver, fallback, wire and shape | control | PASS/PASS | PASS/PASS |
| control: legacy header provider empty preserves receiver, fallback, wire and shape | control | PASS/PASS | PASS/PASS |
| control: legacy header provider value preserves receiver, fallback, wire and shape | control | PASS/PASS | PASS/PASS |
| control: inference responder prototype, streaming=false, preserves this and methods | control | PASS/PASS | PASS/PASS |
| control: inference responder prototype, streaming=true, preserves this and methods | control | PASS/PASS | PASS/PASS |
| control: inference responder non-enumerable, streaming=false, preserves this and methods | control | PASS/PASS | PASS/PASS |
| control: inference responder non-enumerable, streaming=true, preserves this and methods | control | PASS/PASS | PASS/PASS |
| control: inference responder stateful, streaming=false, preserves this and methods | control | PASS/PASS | PASS/PASS |
| control: inference responder stateful, streaming=true, preserves this and methods | control | PASS/PASS | PASS/PASS |
| control: fixed inference failure event and reason remain unchanged | control | PASS/PASS | PASS/PASS |
| new: strict provider null refuses with zero upgrades | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict provider empty refuses with zero upgrades | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict provider leading space refuses with zero upgrades | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict provider trailing space refuses with zero upgrades | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict provider control refuses with zero upgrades | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict provider non-ASCII refuses with zero upgrades | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict provider number refuses with zero upgrades | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict provider object refuses with zero upgrades | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict throwing provider never falls back or exposes its error | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict missing provider refuses with zero upgrades | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict server refusal is fixed-code, one authenticated attempt, no fallback | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict validation rejects static token | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict validation rejects empty static token | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict validation rejects query | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict validation rejects omitted transport mode | red-then-green | FAIL/FAIL | PASS/PASS |
| control: strict validation rejects query token | control | PASS/PASS | PASS/PASS |
| control: strict validation rejects userinfo | control | PASS/PASS | PASS/PASS |
| new: strict validation rejects cleartext remote | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict validation rejects http | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict validation rejects https | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict validation rejects stdio | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict validation rejects modern | red-then-green | FAIL/FAIL | PASS/PASS |
| new: flag validation rejects "true" without quoting it | red-then-green | FAIL/FAIL | PASS/PASS |
| new: flag validation rejects "CANARY-invalid-flag" without quoting it | red-then-green | FAIL/FAIL | PASS/PASS |
| new: flag validation rejects 1 without quoting it | red-then-green | FAIL/FAIL | PASS/PASS |
| new: flag validation rejects 0 without quoting it | red-then-green | FAIL/FAIL | PASS/PASS |
| new: flag validation rejects {} without quoting it | red-then-green | FAIL/FAIL | PASS/PASS |
| new: flag validation rejects [] without quoting it | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict direct dial validates before provider (token empty) | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict direct dial validates before provider (token set) | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict direct dial validates before provider (tokenTransport set) | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict direct dial validates before provider (url set) | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict direct dial validates before provider (protocol set) | red-then-green | FAIL/FAIL | PASS/PASS |
| new: unsupported bun refuses before provider or I/O | red-then-green | FAIL/FAIL | PASS/PASS |
| new: unsupported node refuses before provider or I/O | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict 301 redirect fails closed at original origin | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict 302 redirect fails closed at original origin | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict 303 redirect fails closed at original origin | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict 307 redirect fails closed at original origin | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict 308 redirect fails closed at original origin | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict snapshot holds url while provider is pending | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict snapshot holds tokenTransport while provider is pending | red-then-green | FAIL/FAIL | PASS/PASS |
| control: strict snapshot holds credentialRequired while provider is pending | control | PASS/PASS | PASS/PASS |
| control: strict snapshot holds token while provider is pending | control | PASS/PASS | PASS/PASS |
| control: strict snapshot holds accessProvider while provider is pending | control | PASS/PASS | PASS/PASS |
| new: strict snapshot holds id while provider is pending | red-then-green | FAIL/FAIL | PASS/PASS |
| control: strict snapshot holds command while provider is pending | control | PASS/PASS | PASS/PASS |
| control: strict snapshot holds transport while provider is pending | control | PASS/PASS | PASS/PASS |
| control: strict snapshot holds protocol while provider is pending | control | PASS/PASS | PASS/PASS |
| control: provider rotation on each header dial sends no query token | control | PASS/PASS | PASS/PASS |
| control: flag unset throwing provider falls back to static token | control | PASS/PASS | PASS/PASS |
| control: abort during pending provider cannot create a late dial | control | PASS/PASS | PASS/PASS |
| control: strict connection reconnect fetches a rotated credential | control | PASS/PASS | PASS/PASS |
| control: strict successful header dial stores no provider result on configuration | control | PASS/PASS | PASS/PASS |
| new: strict captures all policy reads before the provider await | red-then-green | FAIL/FAIL | PASS/PASS |
| new: strict non-loopback hostname refuses before provider or DNS/connect | red-then-green | FAIL/FAIL | PASS/PASS |

# Unmet Criteria

None under the manager's explicit dispositions below; no claim of independent review or sealed qualification (not this dispatch's stage).

## Manager instructions received at finalize and handled

The first finalize was refused once because three manager messages were pending. They supplied optional prior commits/harnesses, approved the exact C(2) exception, and retained the acquisition evidence. The messages were read from the daemon's own run record, then this report and the wire assertions were updated. Gates were rerun at the new final commit.

For `ask-cbacff19e48c416d9550b4bba606cd36`, quoted direction:
> Yes. For C(2) compare byte-for-byte the request line/target and EVERY header except Sec-WebSocket-Key (names, values, order and count, credential-bearing headers included), plus any frames sent before the first server response; normalise only the Sec-WebSocket-Key value, and assert separately that it is a valid fresh 16-byte base64 key and the ONLY remaining difference.

For `ask-a19854cfb5d64d9c93c67ff9c814b5a9`, quoted first line:
> Retain the current evidence; do not restart.

The acquisition exception is disclosed above with the exact request, notifier origin, public-metadata-only nature, absence of credentials, unchanged resolution and unchanged lock digest. It is a retained deviation, not an assertion that the extra request met the original acquisition restriction. Later npm invocations have update checks disabled.

# Residual Risk

Strict mode remains deliberately limited to Bun 1.4.3 and Node 22.23.3 with npm ws. Parts 2-4 remain outstanding: diagnostic projection/publication, model catalogue admission and invalidation on credential rotation, and the drift guard. Existing short-string redaction limitations remain; headerCarries is exactly the base and no minimum credential length was chosen. Host file-reading providers and origin binding remain out of scope. This branch must not be rolled out on the strength of this report.

Mechanical side effects: ignored package-lock.json, node_modules, dist/tsbuildinfo and test-generated ignored logs; no dependency/version or other tracked-file edits. Original lock bytes, resolution.json, acquisition.log/audit, loopback-only.c/.so, wrapper logs, JSON receipts and acceptance.json are preserved in this run's evidence bundle under credential-part1/. Native gate receipts remain alongside that subdirectory. No process was orphaned or restarted due to an empty poll.

## Later-part design note (not implemented)

1. Diagnostic work should consume existing noteDialSent bookkeeping keyed by the original config, not publish a provider result or derive new state from mutable config.
2. The strict dial already uses captured id, endpoint, transport/protocol fields and header/redirect policy; later designs should preserve that boundary.
3. Diagnostic projection still needs one deliberate publication policy for arbitrary errors, events, boxed/scalar carriers and sinks.
4. Catalogue admission needs a per-server/per-dial epoch and success/failure/rotation invalidation, without exposing raw credential equality material.
5. Any typed reason/state interface, admission notices or mechanical drift scan belongs to a separately scoped later part.
