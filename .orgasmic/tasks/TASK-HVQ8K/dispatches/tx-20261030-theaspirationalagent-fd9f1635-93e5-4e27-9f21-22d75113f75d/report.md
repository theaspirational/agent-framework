# Changed

- Base: `66c9db3fd840c7d821aa4f8e9d5ce389b19d923c`.
- Head: `89fbae8814fd8b5c0ae68f20087d2abc75de84cf`; ten additive, finding-labelled fix commits. No rebase, push, PR edit or GitHub comment.
- `git ls-remote https://github.com/anima-research/agent-framework.git refs/heads/main` returned `48f26ce56cf73267d715e853acc9a88b50595337`, unchanged from the brief.
- Read both complete review inputs, the supplied project baseline and the command-ownership worker page. No applicable AGENTS.md was present; conventions and gotchas were explicitly absent.
- Production changes: validated handshake refusal; data-plane holding with receipt epochs and flush-time keys; no required-profile hint offer; unsupported coalescing refusal; bounded refusal diagnostics; fatal cause-chain classification; public read-only receipt/error/limits exports; wake caps limited to `mayWake:false`.
- Changed production files: `src/framework.ts`, `src/index.ts`, and `src/mcpl/{server-connection,inbound-admission,channel-registry,push-handler,inference-router}.ts`.
- Tests: updated the admission lifecycle, compatibility, channel and push suites; added diagnostics and public-API suites; extended the neutral stdio peer and WebSocket fixture; narrowed the connector inventory to `src/mcpl/inbound-admission.ts` with an empty allowance.
- Updated `docs/required-inbound-admission.md` and `changelog.d/required-inbound-admission.added.md`.
- The requested author, committer and co-author trailer were checked on every new commit. Explicit paths were staged. No tracked dependency/lockfile changes.
- R1-10's existing tests conflicted with the preferred fix. The blocking ask confirmed replacing their intent: `mayWake:true` preserves module wakes despite a gate decline; `mayWake:false` remains the downstream ceiling. Both cases are now tested.

# Verification Gates

Every install, typecheck, build and test command used the requested user scope with `MemoryMax=16G` and `MemorySwapMax=0`. Gates ran through `orgasmic dispatch gate`.

| Revision | Node | Typecheck | Build | Full npm test |
| --- | --- | --- | --- | --- |
| `66c9db3f` | 22.23.3 | pass | pass | 9,595 pass / 0 fail / 63 skip; 9,658 total |
| `66c9db3f` | 22.12.0 | pass | pass | 9,595 pass / 0 fail / 63 skip; 9,658 total |
| `89fbae88` | 22.23.3 | pass | pass | 9,612 pass / 0 fail / 63 skip; 9,675 total |
| `89fbae88` | 22.12.0 | pass | pass | 9,612 pass / 0 fail / 63 skip; 9,675 total |

Commands:
- Dependency setup: `npm install --ignore-scripts --no-save` with `/opt/node/bin` first on PATH.
- Base gate: install, then `node --version; npm run typecheck; npm run build; npm test` on each requested Node binary. Raw log: `base-gates.log`. Both baseline builds and test launches preceded source edits; compiled baseline tests were not rebuilt during their runs. The enclosing receipt records `moved-head` because additive commits began before it exited. Baseline counts are raw baseline evidence, not reused final-head receipts.
- Final gates: `orgasmic dispatch gate head-<version>-<gate> -- env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 env PATH=<node-bin>:$PATH bash -c 'node --version; npm run "$1"' _ <gate>`, for `typecheck`, `build`, `test`. Full invocation script: `run-head-gates.sh`; owner process record: `head-process-owner.txt`.
- Logs: `head-22.23.3-{typecheck,build,test}.log`, `head-22.12.0-{typecheck,build,test}.log`, `head-summary.log`; each names its daemon gate receipt log.
- Focused compiled admission suites: 181 passed, 0 failed (`admission-scope.log`), after typecheck/build/pretest.
- Red-before handshake probe: the new real-stdio test failed with uncaught `TypeError: Cannot read properties of null (reading 'method')` in `refuseEarly` (`handshake-red.log`). The fixed test passes (`handshake-green.log`), checking null input, all three handshake-time refusal shapes and the same-chunk ping answer.
- Real-transport holding probes: quiesce/resume on all three lanes, startup staging, and a held notification across reconnect; 5 passed (`holding-wire.log`).
- Hint negotiation and result bookkeeping: 8 passed (`hints-fixed.log`). Required connections install no hint controller. The explicit host-controller scaffold separately proves the required transport's solicited `toolsets/list` tap adopts the returned open state rather than merely sending recovery requests.
- Coalescing/ordinary ingress matrix and pending-batch reconnect comparisons: 62 passed (`coalescing.log`).
- Diagnostics and inference lifetime tests: 32 passed (`diagnostics.log`), including notification-only refusals, fixed codes, rate-limited logs and no private payload/error text.
- Wake ceiling matrix: 27 passed (`wake-ceiling.log`). Fatal cleanup and public API probes passed (`fatal-cleanup.log`, `public-admission.log`). Scoped connector inventory passed (`connector-scope.log`).
- Initial hint-test scaffold assertions were corrected from undefined to the actual null tap sentinel and initialized the manually attached controller before inspecting it; their successful rerun is `hints-fixed.log`. No production test failures remain in the focused suite.
- `git diff --check 66c9db3f..HEAD` passed. Worktree clean at final gate launch and completion. All six final-head gate receipts report exited:0 at the unchanged committed head.

All named logs are in this report's evidence directory. No build caches were placed there.

# Unmet Criteria

None. All R1 findings and the four automated Medium comments are addressed. All required gates passed on both Node versions.

# Residual Risk

- Required coalescing is intentionally unsupported, not durable re-admission. Drain pending work before enabling the profile on a binding that previously accepted unconfigured coalesced batches.
- Hint negotiation intentionally disables the framework's RFC-014 controller on required connections. A peer must tailor its inventory to a hint-less host. The transport no longer suppresses generic result taps.
- A pause during an already running callback still refuses that item; holding applies to items not yet admitted. Timers cannot preempt synchronous callbacks or undo their external effects. Batch latency can approach item count times `timeoutMs`.
- Cleanup-failure tests exercise a real stdio handshake and full framework startup with a deliberately failed first close, then perform real cleanup; they do not leave an unreapable process behind.
- Existing connector-specific routing and awareness remain untouched. The admission-only inventory does not impose project-wide policy.
- Stamp support, context-only delivery, durable re-admission and a separate full MCPL specification pin remain outside this slice. Existing decoder/grant baseline remains `@animalabs/mcpl-core` 0.4.0. No SPEC change is required by this profile.

BEGIN DISPOSITION

- R1-1: fixed in 345569a7. Removed the separate listener; early data refusal follows the validated handshake decoder. The null-line regression passes.
- R1-2: fixed in 9c3ebd1e. Required connections do not advertise toolHints. Removed carrier-specific suppression and verified solicited toolsets/list state adoption through the transport tap.
- R1-3: fixed in 4f949be4. Required data waits through startup staging and quiesce, then uses the current admission key at flush; old-epoch work is refused. Added quiesce/resume, startup and reconnect tests.
- R1-4: fixed in a13320fd. Required coalescing returns admission_unsupported before acceptance. Reconnect tests compare refused required batches with surviving unconfigured batches.
- R1-5: fixed in bb0d4866. Restricted the inventory to inbound-admission.ts with no connector allowance; removed unrelated identifier ceilings.
- R1-6: fixed in 345569a7. Refusal exists only inside the installed initialize reader; same-chunk ping is answered. Documented the handshake -32002 capability_denied shape.
- R1-7: fixed in e09d5375. Admission refusals emit existing lane rejection/inference failure traces and rate-limited diagnostic lines, including notifications and stale transport work.
- R1-8: fixed in 493b4a0d. Startup checks the cause chain for fatal admission errors. Binding and attestation failures remain fatal when initial cleanup also fails.
- R1-9: fixed in b4ca46ec. Exported admissionOf, AdmittedEnvelope, AdmissionConnectError and both limits; tested immutable receipt access through the package entry point.
- R1-10: fixed in b029c935. Only mayWake:false caps module wakes. Tests preserve module-visible gate decisions and allow module wakes with mayWake:true.
- Bot Medium, null handshake line: fixed in 345569a7 with decoder reuse and the real-stdio regression.
- Bot Medium, accepted coalesced work revoked: fixed in a13320fd by refusing unsupported coalescing before acknowledging acceptance.
- Bot Medium, connector identifier ceilings: fixed in bb0d4866 by removing the unrelated inventories.
- Bot Medium, missing handshake-refusal coverage: fixed in 345569a7 with all three data lanes, malformed input and same-chunk ping coverage.
- Release notes and profile documentation updated in 89fbae88 to reflect the revised behavior.

END DISPOSITION

BEGIN PR BODY

## Summary

Add opt-in required admission for inbound legacy MCPL traffic with `McplServerConfig.inboundAdmission`. Unconfigured connections keep their existing synchronous dispatch and behavior. New admission code has no connector-specific policy.

## Contract

- Host-owned binding keys identify the connection instance and transport epoch. The callback receives a detached, frozen raw item and cancellation signal.
- Existing capability, feature and registration authorization runs before admission. Verdicts are closed-field validated; connection authority and registration are rechecked after awaits. Denial, timeout, exceptions, invalid verdicts and stale authority admit nothing.
- Data received after initialize waits through startup staging, policy exchange and quiesce; flush runs admission under the current key. Superseded-epoch work is refused. During initialize, required data requests receive JSON-RPC -32002 `capability_denied`.
- Required connections do not advertise `toolHints`. Generic transport taps and solicited result bookkeeping remain intact.
- Required channel/push coalescing returns `admission_unsupported` before acceptance. Durable re-admission is not implemented. Drain pending coalesced work before enabling the profile on an existing binding.
- `mayWake:false` caps downstream wakes, including modules. `mayWake:true` leaves ordinary gate/module behavior intact; it does not force a wake.
- Missing bindings and attestation refusals abort startup, including through cleanup-error wrappers. Ordinary connection outages retain existing non-fatal startup and reconnect behavior.
- Refusals use itemwise channel results, push `{accepted:false, reason}` results, or inference errors (-32600), plus fixed-code traces and rate-limited diagnostics. Inference cancellation releases its slot; stop answers once and transport close answers nothing.

## Public API and limits

Exports include `admissionOf(event)`, read-only `AdmittedEnvelope`, `AdmissionConnectError`, `MAX_ADMISSION_TIMEOUT_MS` (60000) and `MAX_PENDING_ADMISSIONS` (64). Timeout is required in 1..60000 ms; overload refuses immediately and budgets are independent per connection. Channel batches run sequentially with per-item deadlines, so total latency can approach batch length × timeoutMs.

Optional `replyIntent` is validated host-only runtime data, not persisted authority. Stamp support arrives with context-only delivery; this profile rejects stamp and unknown verdict members. Callbacks must cooperate with cancellation and protect their own external effects.

## Verification

Typecheck, build and full npm test on Node 22.23.3 and 22.12.0, each under a 16 GiB memory scope:

| Revision | Node | Pass | Fail | Skip |
| --- | --- | ---: | ---: | ---: |
| Base 66c9db3f | 22.23.3 | 9595 | 0 | 63 |
| Base 66c9db3f | 22.12.0 | 9595 | 0 | 63 |
| Updated head 89fbae88 | 22.23.3 | 9612 | 0 | 63 |
| Updated head 89fbae88 | 22.12.0 | 9612 | 0 | 63 |

Regression coverage includes null input and same-chunk ping during initialize, all handshake data-lane refusals, quiesce/resume, startup staging, stale held traffic, pending-batch reconnects, toolset result adoption, notification diagnostics, fatal cleanup causes, public exports and module wake ceilings. The connector inventory is confined to the new admission runtime.

See `docs/required-inbound-admission.md`. This profile uses the repository's decoder/grant implementation and `@animalabs/mcpl-core` 0.4.0; it requires no SPEC change. A full external MCPL pin remains separate. Existing connector-specific compatibility behavior is unchanged.

END PR BODY
