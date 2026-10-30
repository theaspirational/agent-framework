# Required inbound admission refresh

## Changed

- Fetched `upstream`, then rebased `c5306693..c848977fc2280b378576f0eb72c2b07a0a93b86f` onto `a64cfc010f4df5090c698e9fa7926b1d3aa0dc5a` with `git rebase --onto a64cfc010f4df5090c698e9fa7926b1d3aa0dc5a c5306693`.
- Final head: **`1d990e4195e265f58be865719df2bb7e51f5c456`**.
- All **21 original commits** retained separately, in order. `git range-diff c5306693..c848977f a64cfc01..1d990e4195e265f58be865719df2bb7e51f5c456` reports **21 `=` pairs**, no changed/dropped patches, plus one new test-only commit, `1d990e41`.
- **Conflicts: none.** No conflict-resolution edits were needed. Full transcript: `rebase.log`; full comparison: `range-diff.txt`.
- New delta beyond replay: `test/mcpl-admission-injections.test.ts` (84 lines, six tests). No production behavior, design, API, dependency, metadata schema or wire vocabulary changed by this refresh.
- Verified author and committer on all 22 commits: `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`. All 21 original messages and trailers are byte-identical after replay; see `identity-and-trailers.txt`.
- Worktree clean; `git diff --check a64cfc01..HEAD` passes. Nothing pushed; no PR, comment, release or external messaging edits.
- Read the supplied project baseline and repository `CONTRIBUTING.md`; no additional conventions/gotchas were supplied. The design reference at its supplied commit matches SHA-256 `475da25d262cfffd2f36f091378b53d404a6f4d4f1d70cb1eaf8f968c07118ac`.

### Upstream changes and guarantee checks

The range contains 177 commits including merges. Only three change runtime source:

1. **`bbba75bc`** removes unsupported compatibility readings: XML rounds persist only `roundPreamble`; unused reference-testimony `truncatedFields` disappears; version-1 awareness-outbox files receive the generic existing version refusal. Shared-inheritance documentation names the actual capability. No new admission or inference/request entry point, capability, verdict member or authority source. The rebase restores none of the removed fallbacks.
2. **`93cdb7d6`** changes deferred injections: only a stream explicitly declaring support receives them; false/undeclared streams wait for turn end, while no-stream direct-API boundaries continue draining for their next storage compile. Watermark/coalescer documentation and mocks are aligned. Added the six real-transport cases specifically for this new downstream branch. Refusals never become deferred work; allowed non-waking work obeys upstream's storage/injection ordering and retains its downstream wake ceiling.
3. **`664473ad`**, merged by **`a64cfc01`**, removes reasoning-loss context notices and their builder/teller, retaining operator alerts and the host callback. This removes writes rather than creating an admission route. Removal and surviving tests are preserved.

There are no upstream source changes in `server-connection`, `channel-registry`, `push-handler`, `inference-router`, `capability-grant` or `feature-set-manager`. No new transport requires an admission adapter. Existing required state/key capture, authorization-before-hook, post-await revalidation, failure refusal, tap suppression, hint-less negotiation, coalescing refusal, ordered held dispatch and inference cancellation/stop behavior remain intact. All no-hook compatibility and lifecycle/refusal matrices are included in both full head suites. The supplied head's post-initialize staging/quiesce holding contract is preserved; this refresh does not revert it to the earlier proposal's broader pre-ready refusal.

The complete per-commit lane/lifecycle source-and-test list is **`upstream-admission-inventory.md`**; the unfiltered list is `upstream-commits.txt`. It includes reconnect/grant/buffer tests; coalescing/push acceptance and retries; channel registration and identity; hints/toolsets; request errors/timeouts; holds, provider waits and exhaustion; cancel/quiesce/stop/drain; deferred writes and injections; gate decisions and wakes. These revisions alter tests/fixtures, not dispatch authority. Important fixture changes retained: bounded child-exit grace (`6bb7b446`, `e6e9214c`, `24fd5f25`), unscripted-stream checks (`d9b8eddc`), complete-line JSONL reads (`5c8ee8fc`), bounded stop-tool waits (`20fe9ac6`). CI concurrency/typecheck changes (`58e2db34`, `0a147a1b`) do not waive this refresh's explicit standalone typechecks. Release `ae4d8aa0` bumps to 0.31.0 without dependency-range changes.

Full assessment and unchanged guarantee checklist: **`upstream-audit.md`**. Runtime source diff: `upstream-runtime.diff`. Existing connector-specific compatibility routing, including the origin-source/composite-id fallback in `derivePushEventChannel`, is untouched. The admission runtime's connector-vocabulary AST test remains in the suites. `@animalabs/mcpl-core` is still 0.4.0, both declared and installed; no SPEC change or external pin is introduced.

## Verification Gates

All four final gate invocations exited **0**, each under the requested 16 GiB/no-swap user scope. Each selected the exact Node binary, printed checkout SHA and Node version, ran `npm run clean`, `npm run typecheck`, `npm run build`, then full `npm test`. `AF_TEST_CONCURRENCY=8`; no test filtering, cancelled tests or todos in the full runs.

| Revision | Node | Typecheck | Clean build | Pass / fail / skip / total |
| --- | --- | --- | --- | --- |
| Base `a64cfc01` | 22.23.3 | pass | pass | 9363 / 0 / 63 / 9426 |
| Base `a64cfc01` | 22.12.0 | pass | pass | 9363 / 0 / 63 / 9426 |
| Head `1d990e41` | 22.23.3 | pass | pass | 9566 / 0 / 63 / 9629 |
| Head `1d990e41` | 22.12.0 | pass | pass | 9566 / 0 / 63 / 9629 |

Reproduction commands and checkout/tool paths: **`gate-commands.md`**; common shell driver: `run-suite.sh`. Baseline build caches live in the ignored `node_modules/.cache/admission-base` detached checkout, not evidence. Shared installed dependencies have unchanged declared ranges.

Logs, relative to this report:

- Base 22.23.3: `base-node22.23.3.console.log` (392.249 s test duration).
- Base 22.12.0: `base-node22.12.0.console.log` (371.427 s).
- Head 22.23.3: `head-node22.23.3.console.log` (377.219 s).
- Head 22.12.0: `head-node22.12.0.console.log` (346.935 s).

Each console log names its durable `orgasmic dispatch gate` receipt/log. The first baseline receipt is marked `moved-head` because the test-only commit was made while the independent detached baseline suite ran; its printed/tested revision remained exactly `a64cfc01`. It is not reused as a head receipt. Both head receipts ran at the clean final commit. No final failure requires a baseline exception, including the previously reported watchdog failures: these runs have none.

Development evidence: `injection-probe.console.log` passes all six focused cases. `injection-red-before.console.log`/`injection-red-before.tap` record the deliberate negative control: replacing only the compiled drain condition with the old condition fails both undeclared cases (2 failures), and the wrapper verifies that expected result before restoring the artifact. A subsequent clean build/full suite tests the real source. An initial uncommitted test draft failed typecheck for missing required external-message metadata; this scaffold error was corrected before the local commit and all final typechecks pass. It is not an accepted final-gate failure.

## Unmet Criteria

None for the refresh. No upstream-forced semantic change or new design decision was needed.

## Residual Risk

- Real local WebSocket/stdio transport coverage uses the repository's model mocks; no live connector/provider or deployment qualification is claimed.
- Inherited opt-in limitations remain: cooperative callback cancellation/external effects; no required coalesced acceptance, durable re-admission, stamps or reply routing. See `docs/required-inbound-admission.md`.
- The PR body has not been edited remotely. Its facts changed (base/head, test counts, extra coverage); the local refresh follows and is also saved as `pr-body.md`.

BEGIN PR BODY

## Summary

Add opt-in required admission for inbound legacy MCPL traffic with `McplServerConfig.inboundAdmission`. Unconfigured connections keep their existing synchronous dispatch and behavior. New admission code contains no connector-specific policy.

## Contract

- Host-issued binding keys identify the connection instance and transport epoch. The callback receives a detached, frozen raw item and cancellation signal.
- Existing capability, feature and registration authorization precedes admission. Verdicts are closed-field validated; authority and registration are rechecked after awaits. Denial, timeout, exceptions, invalid verdicts and stale authority admit nothing.
- Data received after initialize waits through startup staging, policy exchange and quiesce. Required held data drains sequentially in arrival order, including whole channel batches, under the key current at flush. A flush waits for admission slots instead of refusing backlog overflow. New data joins an active drain; control traffic and RPC responses stay live. Superseded-epoch work is refused.
- Independently sent live items without a backlog remain concurrent and may complete in callback-latency order. Held inference releases the drain after admission and synchronous provider dispatch, not after model completion. A held inference backlog reaches the provider concurrently (one call per held item, as on the unconfigured path), because the drain releases at dispatch. Hold time is outside the per-item admission timeout. While a backlog drains, required data (held and newly arriving) is admitted one at a time, so sustained ingress above roughly one item per callback latency accumulates and is dropped/refused at the existing hold bounds. A bounded-concurrency ordered drain is a possible follow-up at the maintainer's discretion, not implemented here.
- During initialize, required data requests receive JSON-RPC -32002 `capability_denied`. Null input uses the normal decoder, and same-chunk ping is not swallowed.
- Required connections do not advertise `toolHints` and carry no RFC-014 toolset presence. The generic result tap is preserved, but production does not attach a toolset controller or adopt `toolsets/*` state. An explicit `toolHints:true` override logs once at connect.
- Required channel/push coalescing returns `admission_unsupported` before acceptance. Durable re-admission is not implemented. Drain pending coalesced work before enabling the profile on an existing binding.
- `mayWake:false` caps downstream wakes, including module requests. `mayWake:true` leaves gate/module behavior intact; it does not force a wake.
- Missing bindings and attestation refusals abort startup, including through cleanup-error wrappers. Ordinary outages retain existing non-fatal startup and reconnect behavior.
- Refusals use itemwise channel results, push `{accepted:false, reason}` results, or inference errors (-32600), with fixed-code traces and rate-limited diagnostics. Inference cancellation releases its slot; stop answers once and transport closure answers nothing.

## Public API and limits

Exports include `admissionOf(event)`, read-only `AdmittedEnvelope`, `AdmissionConnectError`, `MAX_ADMISSION_TIMEOUT_MS` (60000), and `MAX_PENDING_ADMISSIONS` (64). Timeout is required in 1..60000 ms. Live overload refuses immediately; connection budgets are independent. Channel batches have per-item deadlines, so their latency can approach batch length × timeoutMs.

Optional `replyIntent` is validated host-only runtime data, not persisted authority. Stamp support arrives with context-only delivery; this profile rejects stamp and unknown verdict members. Callbacks must cooperate with cancellation and protect their own external effects.

## Verification

Rebased all 21 commits without conflicts or squashing onto upstream `a64cfc010f4df5090c698e9fa7926b1d3aa0dc5a`. `git range-diff c5306693..c848977f a64cfc01..1d990e4195e265f58be865719df2bb7e51f5c456` marks every original patch equal; one additional test-only commit covers upstream's changed deferred-injection path. Final local head: `1d990e4195e265f58be865719df2bb7e51f5c456`.

Fresh standalone typecheck, clean build and full `npm test` on base and head, on both Node versions under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, with `AF_TEST_CONCURRENCY=8`:

| Revision | Node | Typecheck | Clean build | Pass / fail / skip / total |
| --- | --- | --- | --- | --- |
| Base `a64cfc01` | 22.23.3 | pass | pass | 9363 / 0 / 63 / 9426 |
| Base `a64cfc01` | 22.12.0 | pass | pass | 9363 / 0 / 63 / 9426 |
| Head `1d990e41` | 22.23.3 | pass | pass | 9566 / 0 / 63 / 9629 |
| Head `1d990e41` | 22.12.0 | pass | pass | 9566 / 0 / 63 / 9629 |

Head adds 203 tests over base, including six new real-WebSocket cases crossing channel/push admission with declared, non-carrying and undeclared injection support. Denied work never reaches modules, storage or injection; admitted `mayWake:false` work preserves upstream's deferral and cannot gain a module-driven wake. Restoring the old injection-drain condition makes both undeclared-stream cases fail; all six pass with upstream's condition. Existing admission semantics are unchanged.

Regression coverage includes the null-line, same-chunk-ping and quiesced-push repros; all handshake data-lane refusals; startup staging; >64 held pushes and channel items as requests and notifications; staggered held-order tests; slot saturation before quiesce; pause/reconnect during a drain; slow held inference with later push/channel storage in arrival order; live data captured during an active drain; cloned dispatch and explicit re-hold without a spin; held inference timeout releasing later storage; pending-batch reconnects; generic result taps and absent required-profile toolset presence; notification diagnostics; fatal cleanup causes; public exports; and module wake ceilings. The connector AST check is confined to the new admission runtime.

See `docs/required-inbound-admission.md`. This profile uses the repository's decoder/grant implementation and `@animalabs/mcpl-core` 0.4.0; no SPEC change is required. A full external MCPL pin remains separate. Existing connector-specific compatibility behavior is unchanged.

## Not verified / out of scope

No live connector or external model-provider qualification, deployment, publication or protocol change. Model execution in the transport tests uses the repository mock provider. Existing JavaScript callback cancellation and external-effect limitations still apply.

Generated with OpenAI Codex.

END PR BODY
