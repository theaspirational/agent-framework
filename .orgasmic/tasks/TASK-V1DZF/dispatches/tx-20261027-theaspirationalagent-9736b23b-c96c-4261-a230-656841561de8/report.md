# TASK-V1DZF security review

## Verdict

**Do not approve: R7 is not satisfied.** Reviewed commit `f4e38cedc652404cc059bb360cdaff19dcc5ad8d` against base `4976c67d5c7916a15046c627b68913994c33b3cb`. No source edits, commits, dependency installation or external traffic were performed; the worktree remains clean.

## Findings

### HIGH — security / unmet acceptance: strict credentials escape through server metadata into SDK listings and traces

**Locations:** `src/framework.ts:29349-29358` (`listMcplServers` toolClasses), `src/framework.ts:30405-30411` (`emitMcplToolDiff`), and `src/framework.ts:5942` (`process:received` trace).

A successfully authenticated server can echo the provider credential in a `tools/list` tool name. The framework retains that name and copies it without credential redaction into both `listMcplServers()[0].toolClasses` and the newly-available-tools external message. `pushEvent` then emits the message and its metadata verbatim in a `process:received` trace. Thus the provider secret reaches operator-facing serialization and trace consumers even though it never appears on the config object. R7 explicitly includes SDK-owned display/listing serializers and traces; the clarification permits transport/header buffers, not these diagnostic/display copies.

**Reproduction:** the retained `review-probes.mjs` uses a frozen strict config, a fresh synthetic credential, and a numeric-loopback WebSocket server that returns a tool named `echo_<credential>`. Through the real `AgentFramework.connectMcplServer` path, both Node 22.23.3 and Bun 1.4.3 report:

```
{"probe":"strict-server-echo","listingLeak":true,"traceLeak":true,"leakingTraceTypes":["process:received"]}
```

These booleans are asserted, not inferred; the script never prints the credential. This is an unmet new-mode guarantee, not a claim that legacy behavior regressed. The existing successful-dial redaction test (`test/mcpl-credential-required.test.ts:239-268`) returns no tools and injects only an error event, so it cannot detect this disclosure.

**Fix direction:** apply strict credential filtering at SDK-owned display/diagnostic serialization boundaries, including nested metadata and newly-available-tool notices. Do not rewrite operational tool identifiers into different routable names. Retain necessary wire identifiers internally, or reject credential-bearing metadata before it becomes persistent/display state. Keep unset-flag behavior unchanged. Add production-path tests where server metadata echoes raw, encoded and Bearer-form credentials, and assert that listings, queued notices and emitted traces are clean.

## Open Questions

- Is the existing immutable-config contract an intended security precondition? A separate probe starts a strict dial, changes `config.tokenTransport` from `header` to `query` while its provider is pending, then resolves the provider. Both engines send the credential as a URL query and no Authorization header. Validation occurs at `src/mcpl/transport.ts:600`, but the config is reread after the await at lines 646 and 661. This is **not counted as another defect** because `src/mcpl/types.ts:221-225` explicitly prohibits mutating submitted configurations. If strict guarantees must survive this race, snapshot validated dial settings before awaiting the provider or reject changes before dialing. No origin-binding requirement is inferred.

## Verification Notes

### Scope and requirement review

Read the live task, project constraints including REVIEWED DISPATCH CLARIFICATIONS, implementer brief/report, complete five-file diff, relevant transport/connection/framework paths, and retained gate evidence. Gotchas and conventions collections were empty; no applicable AGENTS.md was found. Risk tier remains **risky**: P1 priority, credential safety-path blast radius, and over 300 net added lines.

- **R1 / default behavior:** optional boolean and docs are present. For immutable ordinary configurations, the unset path retains provider/static fallback, query/header selection and existing WebSocket options. Strict retention changes are opt-in. The retained control tests pin fallback and rotation; no default-mode regression found.
- **R2–R4:** shared validation rejects strict static tokens, non-header mode, URL token/userinfo and non-loopback cleartext. Runtime guards reject missing providers and unusable results with fixed reason codes before construction; no fallback is selected. Validation and provider-await ordering were inspected. Retained tests cover zero upgrades and the DNS refusal.
- **R5:** inspected actual-client redirect probe logs and final focused tests for both requested engines. Node/npm ws 8.22.0 receives `followRedirects:false`; Bun's inspected adapter does not pass that option to native WebSocket. Retained tests for 301/302/303/307/308 show one source upgrade, no target upgrades and failed dials on both engines. Unknown reported versions refuse before provider/network. The guard trusts mutable process version metadata; no hostile same-process loader/monkeypatch resistance is claimed, and no additional engine was qualified.
- **R6:** HTTP and both stdio families are refused through shared configuration checking. Modern HTTP credential implementation is unchanged. Initial connect, automatic reconnect and restart paths were traced; reconnect re-enters `openTransport` and invokes the provider again. Framework startup/runtime/restart validation uses the shared checker. No separate admin/overlay network constructor was found.
- **R7:** config/provider storage, registry retention, client-error redaction and listing/trace sinks were inspected. Strict short/old rotations have additional registry coverage, but the finding above disproves complete no-leak coverage. No evidence of a separate serializer exposing the weak registry itself was found.
- **R8:** flag semantics, reconnect rotation, provider refusal, engine support limits and HTTP/stdio rejection are documented. No unrelated source/dependency/version changes were found.

### Retained gates checked, not rerun

Per the supplied receipt-reuse instruction, inspected the named final build, typecheck, full-suite, focused Node/Bun and diff-check logs rather than rerunning those gates. Their final receipts name the reviewed commit and clean start/end trees:

- `final-build`, `final-typecheck`, `final-diff-check`: exit 0.
- `final-tests`: 7,897 tests; 7,852 passed, 45 skipped, 0 failed.
- `final-node`, `final-bun`: 38 passed, 0 failed/skipped each.
- Baseline build/typecheck passed; baseline full suite: 7,859 tests, 7,814 passed, 45 skipped, 0 failed.
- Compared all 38 baseline/final Node TAP names and order. Baseline has precisely the reported 14 passing controls and 24 failing new assertions; final has all 38 passing. Bun baseline/final totals agree. Baseline-new receipts are dirty/test-added evidence, not reusable green receipts. The original/retained dependency lock hashes match the implementer report; no reinstall occurred.

Reviewed logs reside in `/home/orgasmic/.orgasmic/runs/run-01M5XHS7W65ZK96NX3SZ5TPNXJ/evidence`.

### Independently executed probes

Both probes ran through `orgasmic dispatch gate`, using the existing sanitized `env -i`, offline-npm, loopback-only libc-guard wrapper. Exact command argv are retained in receipts. They import production source with Node/tsx or Bun, use only synthetic credentials and local numeric-loopback ephemeral-port servers, and clean up their temporary framework stores.

Evidence directory: `/home/orgasmic/.orgasmic/runs/run-01M5XJNGPWYYYH8D0HKTGCA7VK/evidence`.

- Script: `review-probes.mjs`.
- `review-adversarial-node`: exit 0; assertions reproduce the metadata disclosure and the documented-contract mutation race. Log: `gate-review-adversarial-node-01M5XJSTG72V2Y207H7QE8619E.log`.
- `review-adversarial-bun`: same results, exit 0. Log: `gate-review-adversarial-bun-01M5XJTAXMTWMSY067SN8GNWY4.log`.

Probe success means the asserted disclosures were reproduced, **not** that the implementation passed acceptance. The metadata failure is classified as unmet R7, not flaky or environment-blocked. No real TLS deployment, real provider, external origin, additional runtime version or kernel network namespace was tested. Libc guard isolation is not a kernel-level traffic guarantee.

## Fix Directions

1. Close the strict metadata-to-listing/trace disclosure, preserving legacy defaults and operational routing identifiers.
2. Add adversarial successful-response coverage, not only error-event redaction and empty-list controls; test current and rotated credentials on both supported engines.
3. Decide explicitly whether documented configuration immutability bounds strict security guarantees; otherwise snapshot/revalidate the asynchronous dial policy.
4. Rerun affected focused tests and the required gates after the fix, then obtain re-review. Existing passing receipts do not establish R7 compliance.

## Manager follow-up: explicit answers

The manager requested explicit engine-gate, registry-growth, quoted-boolean and lifecycle/provider-admission analysis. Those checks do not change the verdict or add a separate blocking finding.

**(a) Exact engine detection and patch releases — intended, documented limitation.** At `src/mcpl/transport.ts:609-611`, the check first asks whether `process.versions.bun !== undefined`. If present, only the exact string `'1.4.3'` passes; Node identity/version is not checked in that branch. Otherwise it requires both `process.release.name === 'node'` and the exact string `process.versions.node === '22.23.3'`. This is not a semver range or a check of the actual constructor's identity/package version. Consequently Bun 1.4.4 and any differently numbered Node patch release refuse strict dialing, even if the host accepts Bun `>=1.4.3`. That deployment mismatch must be accounted for by the host. I classify the exact pin as an intentional R5 fail-closed support limit, not an implementation bug: only those two exact engines were qualified, README documents the limitation, and legacy mode bypasses the guard. A probe replacing only the reported version with Bun `1.4.4` / Node `22.23.4` confirms refusal before provider invocation or upgrade; this does not claim to have run those newer engines. Runtime metadata spoofing by trusted in-process code is not prevented.

**(b) Rotation retention and cost — unbounded, documented tradeoff.** `src/mcpl/protocol-family.ts:292-322` keeps all distinct strict credentials for the config object's lifetime in a WeakMap. Strict mode disables the sixteen-entry eviction rule for its entry. Identical values are deduplicated by `indexOf`; a repeated value moves to the end without increasing the registry version or rebuilding solely for that repeat. Once the config is unreachable, its WeakMap entry may be collected. Until then, there is no token-count, byte-count, age or total-cost bound. In a long-lived process receiving a fresh short-lived token on each reconnect, memory grows with distinct rotations; insertion scans the retained array, and pattern-building/sorting/regex compilation and matching depend on that growing history. `serverTextRedactor` caches until the registry version changes, but a fresh credential invalidates that cache; aggregate framework redactors also rebuild patterns. This is an intentional retention consequence of R7, not a demonstrated performance regression requiring another finding. No long-duration cost benchmark was run. It is a real operational capacity risk, not bounded by the WeakMap while the framework retains the config.

**(c) The string `"true"` is a configuration problem.** `credentialRequiredProblem` accepts only literal true/false or null/undefined as unset, and returns a fixed type-based problem for a string (`src/mcpl/protocol-family.ts:804-808`). Framework boolean admission also throws (`src/mcpl/transport.ts:854-877` and `src/config-checks.ts:37-40`). Both follow-up probe gates explicitly assert rejection of `credentialRequired: 'true'`; it cannot silently enable or disable strict mode on the checked paths.

**(d) Provider admission across lifecycle paths.** The mandatory runtime check is centralized in `WebSocketTransport.open` at line 613, before provider resolution and socket construction. Runtime connect reaches it through `connectMcplServerInternal` → `connectWithReconnect` → handshake → `openTransport`. Restart's reconnect phase uses `runConnectMcplServer` and the same chain; automatic reconnect invokes the same handshake. The follow-up production-path probes verify a missing-provider runtime connect causes zero upgrades, and restarting a live strict connection with a missing-provider config causes no additional upgrade. The restart does tear down the previous connection before the runtime missing-provider refusal; provider presence is deliberately not a configuration-admission check. With `reconnect:true`, a provider failure can leave a disconnected retry stub, but no unauthorized dial is made.

No separate admin/overlay-added-server dial implementation exists in this repository's source. If external host admin/overlay code enters through these public framework APIs or startup `mcplServers`, it necessarily reaches this transport check; a config losing its provider while retaining literal `credentialRequired:true` fails closed. **External host plumbing was not inspected or exercised** (host changes are outside this task), so this is not an end-to-end certification that its overlay preserves the flag or attaches providers correctly. That remains an integration test gap, not evidence of a local bypass.

Additional independent evidence, same credential-free/offline/loopback wrapper and clean reviewed commit:

- Script: `followup-probes.mjs` in this review's evidence directory.
- `review-followup-node`: exit 0; log `gate-review-followup-node-01M5XK1JVXEBNWG6X0TH92FAWZ.log`.
- `review-followup-bun`: exit 0; log `gate-review-followup-bun-01M5XK1KA1Z47XYE0ZVWZ67E0Q.log`.
- Both assert quoted-true rejection, exact-patch refusal, runtime missing-provider refusal and restart missing-provider refusal. All traffic is synthetic numeric loopback; no installation or source modification was performed.
