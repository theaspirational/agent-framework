# Changed

- Round base: `89fbae8814fd8b5c0ae68f20087d2abc75de84cf`.
- Head: `f3f0627ae1c00f3b235df76e2d60fcf45c30b1d4` (three additive commits); no rebase, push, PR edit or GitHub comment.
- Read the complete supplied review and verified the two flush findings against `flushHeld`, the admission budget, and framework handler containment.
- Upstream main has moved to `30825fdfb5d43f6aa2425061469f0cda25400d26` (`git ls-remote https://github.com/anima-research/agent-framework.git refs/heads/main`). Kept the explicitly requested additive base rather than rebasing.
- `b17ef20b` — R1-3: required held data drains one complete handler at a time in arrival order. The remainder stays in the existing bounded hold buffer across awaits. New data arriving during a drain joins that buffer. Pre-pause live callbacks can finish before held work takes a slot; held work is not refused merely because those slots are occupied. Control traffic, responses and ping remain live. Transport boundaries release the waiter without rebinding old queued data. Unconfigured flushing remains synchronous.
- `72c6c169` — R1-2: log once at connect when explicit `toolHints:true` is disabled by required admission. Tests verify no hint offer or RFC-014 toolset presence, including after reconnect, and no repeated warning on automatic transport retries. Corrected the generic-tap scaffold wording in tests and docs.
- `f3f0627a` — R1-5: removed the duplicate connector inventory file; retained one admission-only AST check with the combined vocabulary.
- Production files changed: `src/framework.ts`, `src/mcpl/server-connection.ts`, `src/mcpl/inbound-admission.ts`. Tests: new `test/mcpl-admission-held.test.ts`; updates to the compatibility, lifecycle and required-push suites; removal of `test/routing-runtime-has-no-connector-literals.test.ts`.
- Updated `docs/required-inbound-admission.md` and `changelog.d/required-inbound-admission.added.md`, including the remaining concurrency of independently sent live traffic without a backlog.
- Author, committer and co-author trailer verified on all three commits. Explicit staging only; no tracked dependency or lockfile changes. The build directory was cleaned before the final build so the deleted test could not survive as stale compiled output.

# Verification Gates

Every install, build, typecheck and test used `XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, through `orgasmic dispatch gate`.

## Fresh checks in this round

| Revision | Node | Typecheck | Build | Full npm test |
| --- | --- | --- | --- | --- |
| `f3f0627a` | 22.23.3 | pass | pass | 9623 pass / 0 fail / 63 skip; 9686 total |
| `f3f0627a` | 22.12.0 | pass | pass | 9623 pass / 0 fail / 63 skip; 9686 total |

Commands and evidence (paths relative to this report's evidence directory):
- Setup gate `r2-install-clean`: `npm install --ignore-scripts --no-save && npm run clean`; passed (`install-clean.log`).
- Final gates: `orgasmic dispatch gate r2-<version>-<gate> -- env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 env PATH=<node-bin>:$PATH bash -c 'node --version; npm run "$1"' _ <gate>`, for `typecheck`, `build`, `test`, using `/opt/node/bin` and `/tmp/credential-engines/node-v22.12.0-linux-x64/bin`.
- Exact invocation script: `run-head-gates.sh`; process-owner record: `head-process-owner.txt`. Logs: `head-22.23.3-{typecheck,build,test}.log`, `head-22.12.0-{typecheck,build,test}.log`, and `head-summary.log`. Each log names the corresponding daemon gate receipt.
- Red-before gate `held-red`: `node --import tsx --test test/mcpl-admission-held.test.ts` on the unchanged production base. All 8 new tests failed: 70-item bursts on both lanes and both wire forms lost 6 admissions; staggered-hook cases had overlapping preflights instead of one-at-a-time release (`held-red.log`). These were expected reproductions, not unresolved head failures.
- Green gate `held-green`: the new held tests plus admission lifecycle and no-hook suites; 86 passed, 0 failed (`held-green.log`).
- Gate `held-boundaries`: typecheck, build, pretest, then the held, request-handler-error and no-hook suites; 101 passed, 0 failed (`held-boundaries.log`). After preserving the containment helper's original void return, the same suites passed again under tsx (`held-contained.log`, 101/0).
- The 12 held-data tests cover >64 pushes/channels as requests and notifications; staggered callback order; whole-channel-batch order; all 64 slots occupied by live pre-pause work; repeated ready calls; new data joining a drain; live controls and ping; pause/resume during a drain; and reconnect during a pending callback without old queued work being rebound.
- Gate `hint-override`: negotiation, warning count, absent presence and generic tap/scaffold tests; 8 passed, 0 failed (`hint-override.log`). The scaffold is explicitly not production toolset adoption.
- `git diff --check 89fbae88..HEAD` passed. Worktree clean at final gate launch and completion; all six final-head receipts report exited:0 at the unchanged commit.

## Inherited evidence and scope

`inherited-summary.txt` records the original log paths, revision identity, clean-tree receipt status and counts read from the preceding implementation round. These are valid **historical baseline results only**; no previous pass substitutes for the fresh head gates, because production and test inputs changed this round.

| Historical revision | Node | Typecheck/build | Tests: pass / fail / skip / total |
| --- | --- | --- | --- |
| `66c9db3f` | 22.23.3 | passed | 9595 / 0 / 63 / 9658 |
| `66c9db3f` | 22.12.0 | passed | 9595 / 0 / 63 / 9658 |
| `89fbae88` | 22.23.3 | passed, clean receipts | 9612 / 0 / 63 / 9675 |
| `89fbae88` | 22.12.0 | passed, clean receipts | 9612 / 0 / 63 / 9675 |

The pinned historical source/build inputs have not changed. The original `66c9db3f` counts are raw baseline logs rather than a reusable receipt (the enclosing wrapper recorded moved-head after compiled baseline tests had started). The supplied review independently reproduced the 22.23.3 result at `89fbae88`; that review is supporting evidence, not a fresh gate by this round. Earlier R1 dispositions remain applicable except for the explicitly corrected R1-2 wording and the R1-3 residues addressed here.

# Unmet Criteria

None. Both MEDIUM residues and all three LOWs are addressed. All six fresh final-head gates passed on the clean committed tree.

# Residual Risk

- Independently sent live items without a backlog still run admission concurrently and can complete in callback-latency order. This is unchanged and now documented. Channel-batch items and required held data are sequential.
- Sequential release introduces head-of-line waiting for held data: a slow complete handler (including a held inference request) delays later held data. Waiting in the bounded buffer is outside the per-item admission timeout. Control traffic, RPC responses and transport-boundary cancellation remain live.
- Existing hold bounds still apply. This fixes admission-slot overflow caused by flushing; it does not make the hold buffer unbounded or remove ordinary live-overload refusals.
- Required coalescing remains unsupported. Drain previously accepted unconfigured coalesced work before enabling this profile on its binding.
- Required connections intentionally carry no RFC-014 toolset presence. Generic result taps are available, but production does not attach a toolset controller to these connections.
- No rebase or integration claim is made against the newly moved upstream main. All current gates target the requested additive branch.

BEGIN DISPOSITION

- R1-1: fixed in 345569a7. Handshake refusal uses the validated decoder; null input is covered by the real-stdio regression.
- R1-2: fixed in 9c3ebd1e, clarified and extended in 72c6c169. Required connections do not advertise toolHints or carry RFC-014 toolset presence. The generic result tap is preserved; production does not adopt toolset state. Explicit toolHints:true logs once at connect, without repeating on automatic transport retries.
- R1-3: fixed in 4f949be4 and b17ef20b. Data waits through startup staging and quiesce. Held handlers now drain sequentially in arrival order, wait for occupied admission slots, and retain the existing bounded buffer and epoch checks. Tests cover >64-item push/channel bursts as requests and notifications, staggered latency, whole batches, pause and reconnect. Independently sent live traffic without a backlog remains concurrent and may reorder by callback latency; documented.
- R1-4: fixed in a13320fd. Required coalescing returns admission_unsupported before acceptance; reconnect comparisons cover both profiles.
- R1-5: fixed in bb0d4866 and f3f0627a. Removed unrelated identifier ceilings, then consolidated the duplicate admission-only AST checks into one.
- R1-6: fixed in 345569a7. Refusal exists only inside the installed initialize reader; same-chunk ping is answered. The handshake -32002 capability_denied shape is documented.
- R1-7: fixed in e09d5375. Admission refusals emit existing lane rejection/inference failure traces and rate-limited diagnostic lines, including notifications and stale work.
- R1-8: fixed in 493b4a0d. Startup follows the cause chain; binding and attestation failures remain fatal when initial cleanup also fails.
- R1-9: fixed in b4ca46ec. Exported admissionOf, AdmittedEnvelope, AdmissionConnectError and both limits, with immutable public-receipt tests.
- R1-10: fixed in b029c935. Only mayWake:false caps module wakes; mayWake:true preserves module wake behavior despite gate declines.
- Bot Medium, null handshake line: fixed in 345569a7, with decoder reuse and real-stdio coverage.
- Bot Medium, accepted coalesced work revoked: fixed in a13320fd, by refusing unsupported coalescing before acceptance.
- Bot Medium, unrelated connector ceilings: fixed in bb0d4866; duplicate check removed in f3f0627a.
- Bot Medium, missing handshake-refusal coverage: fixed in 345569a7, covering all three lanes, malformed input and same-chunk ping.
- Follow-up Medium, held bursts overflow admission slots: fixed in b17ef20b by sequential draining and waiting for pre-pause slot owners; >64-item tests cover both lanes and both wire forms.
- Follow-up Medium, held items reorder under callback latency: fixed in b17ef20b by completing each held handler before dispatching the next; staggered-hook tests verify arrival order. Live concurrency is disclosed.
- Follow-up Low, toolset-adoption overclaim: corrected in 72c6c169 and this PR body. Only generic result-tap preservation is claimed; required connections have no RFC-014 presence.
- Follow-up Low, silent explicit hint override: fixed in 72c6c169 with a once-at-connect diagnostic and tests.
- Follow-up Low, duplicate AST inventory: fixed in f3f0627a; one admission-only check remains.

END DISPOSITION

BEGIN PR BODY

## Summary

Add opt-in required admission for inbound legacy MCPL traffic with `McplServerConfig.inboundAdmission`. Unconfigured connections keep their existing synchronous dispatch and behavior. New admission code contains no connector-specific policy.

## Contract

- Host-issued binding keys identify the connection instance and transport epoch. The callback receives a detached, frozen raw item and cancellation signal.
- Existing capability, feature and registration authorization precedes admission. Verdicts are closed-field validated; authority and registration are rechecked after awaits. Denial, timeout, exceptions, invalid verdicts and stale authority admit nothing.
- Data received after initialize waits through startup staging, policy exchange and quiesce. Required held data drains sequentially in arrival order, including whole channel batches, under the key current at flush. A flush waits for admission slots instead of refusing backlog overflow. New data joins an active drain; control traffic and RPC responses stay live. Superseded-epoch work is refused.
- Independently sent live items without a backlog remain concurrent and may complete in callback-latency order. A slow held handler delays subsequent held data; hold time is outside the per-item admission timeout. Existing hold bounds still apply.
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

Fresh typecheck, build and full npm test on both Node versions under 16 GiB memory scopes; historical baselines retained for comparison:

| Revision | Node | Pass | Fail | Skip |
| --- | --- | ---: | ---: | ---: |
| Original base 66c9db3f | 22.23.3 | 9595 | 0 | 63 |
| Original base 66c9db3f | 22.12.0 | 9595 | 0 | 63 |
| Previous fix head 89fbae88 | 22.23.3 | 9612 | 0 | 63 |
| Previous fix head 89fbae88 | 22.12.0 | 9612 | 0 | 63 |
| Updated head f3f0627a | 22.23.3 | 9623 | 0 | 63 |
| Updated head f3f0627a | 22.12.0 | 9623 | 0 | 63 |

Regression coverage includes the null-line, same-chunk-ping and quiesced-push repros; all handshake data-lane refusals; startup staging; >64 held pushes and channel items as requests and notifications; staggered held-order tests; slot saturation before quiesce; pause/reconnect during a drain; pending-batch reconnects; generic result taps and absent required-profile toolset presence; notification diagnostics; fatal cleanup causes; public exports; and module wake ceilings. The connector AST check is confined to the new admission runtime.

See `docs/required-inbound-admission.md`. This profile uses the repository's decoder/grant implementation and `@animalabs/mcpl-core` 0.4.0; no SPEC change is required. A full external MCPL pin remains separate. Existing connector-specific compatibility behavior is unchanged.

END PR BODY
