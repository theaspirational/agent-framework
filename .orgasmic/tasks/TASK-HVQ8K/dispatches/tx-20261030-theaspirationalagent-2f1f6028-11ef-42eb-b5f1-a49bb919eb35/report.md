# Changed

- Read the complete round-three re-review and verified the remaining `args[0]` coupling in the required emit guard.
- Added one commit citing R1-3: `77e6492b`, rebased as **`c848977fc2280b378576f0eb72c2b07a0a93b86f`**, “Fix R1-3: remove held-dispatch identity coupling and refuse re-holds”.
- `requiredFlushDispatching` is set only around synchronous `dispatchInboundEvent`, and cleared in `finally`. The emit guard uses that window and event name, not params identity. A required data item returning to hold during its own dispatch is refused with `admission_not_ready` rather than fed back into the loop. The unconfigured path is unchanged by this fix.
- Three real-WebSocket tests added: cloned dispatch params cannot spin (a clone without the transport receipt fails closed with `admission_missing`); an explicit same-dispatch re-hold is refused once; held inference admission timeout releases the drain for subsequent pushes and channel storage, without model resolution or slot leakage.
- Docs and changelog now state that a held inference backlog reaches the provider concurrently, one call per held item as on the unconfigured path, because release occurs at dispatch. This is documentation of existing behavior, not a new concurrency policy.
- Four files changed this round: `src/mcpl/server-connection.ts`, `test/mcpl-admission-held.test.ts`, `docs/required-inbound-admission.md`, `changelog.d/required-inbound-admission.added.md`. Inventories: `round-changed-files.txt`, `branch-changed-files.txt`.
- All 21 commits have the required author, committer and co-author trailer (`commit-identities.txt`). Explicit staging only; no push, PR edit, comment, merge or read-only checkout modification.

## Rebase and upstream interactions

- First command, `git ls-remote https://github.com/anima-research/agent-framework.git refs/heads/main`, reported **`c5306693e0684efefb0122cba740ca74f6b4fc92`**, advanced beyond `00d7d7aa`. Fetched that revision.
- Rebased the complete branch with `git rebase --onto c5306693e0684efefb0122cba740ca74f6b4fc92 00d7d7aaba7492c7a1703799e8b55050ebbc2d19`. **No conflicts, no squash, no dropped commits.** Six original commits and fifteen fix commits remain.
- `range-diff.txt`: 20 pairs are `=`; the original core commit is `!` solely because the context immediately before `admission.bind(epoch)` now uses upstream's `stdioStopCause` check and wording instead of `pipeFailure`. Its admission additions are unchanged. No manual resolution was needed. Full identities/mapping: `pre-rebase-head.txt`, `pre-rebase-commits.txt`, `rebased-commits.txt`, `rebase.log`.
- Inspected upstream `00d7d7aa..c5306693` (full diff: `upstream.diff`; relevant source excerpts: `upstream-runtime.diff`, `upstream-other.diff`):
  - `7a869549` adds the 100 Mi UTF-16-code-unit stdio line bound. Overlong stdout ends the transport, suppresses later lines and writes, and causes ordinary transport failure/reconnect handling. Complete earlier lines still arrive. The inherited handshake decoder/refusal and same-chunk handoff remain inside the transport's normal line path; the stop-cause check still precedes required binding. A later transport loss still invalidates required admission and wakes the drain's boundary waiter.
  - `8d0e8e8d`, `973ed916`, and `0bb27981` clarify stopped-stdio/unreaped wording and which earlier stdout lines arrive. Close classification retains `pipeFailed` for a host-ended child; the framework change is explanatory comment text. These transport diagnostics are distinct from fixed admission refusal codes.
  - `2b07f280`, `f97c7f75`, `b24d458f`, `77e08ad0`, `b43f0060`, `72956cee`, and `bc94f7d7` refine stderr splitting and buffering: overlong diagnostic lines are dropped with notices, unfinished tails are released, and both engines share copied held lines bounded to the newest 200 lines and the character ceiling. Stderr is not a required data lane, so the new dispatch flag and admission budgets do not change those diagnostics or their holding rules.
  - Modern MCP shares the transport bound and stderr helper, but still rejects required admission configuration. The API stdio reader adopts the new `readLines` handler API and exits on overlong input; it does not run this inbound admission drain.
  - Upstream transport, handshake, close, stderr, modern-engine and line-reader tests changed accordingly and are included in the new base/head full suites. Only `src/mcpl/server-connection.ts` and `src/framework.ts` overlap the PR's changed-file set; their upstream hunks coexist with the admission hunks without manual conflict resolution. The other transport/modern/trace changes are inherited upstream files, not PR edits.
- The prior upstream interval `48f26ce5..00d7d7aa` remains as documented in the previous report: Chronicle `^0.5.1` property-order behavior (canonical source hashing still sorts), QuickJS pretest/orphan-helper fixes, and the scoped no-reconnect process probe. No further dependency bump is present in this interval; installs continue using `npm install --ignore-scripts --no-save`, with no tracked lockfile edit.
- Final upstream observation: `c5306693e0684efefb0122cba740ca74f6b4fc92`, unchanged since the first lookup (`upstream-end.txt`), from the same `git ls-remote` command.

# Verification Gates

All installs, typechecks, builds and tests use `orgasmic dispatch gate` and `env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`.

## Fresh gates

| Revision | Node | Typecheck | Build | Pass / fail / skip / total |
| --- | --- | --- | --- | --- |
| Base `c5306693` | 22.23.3 | pass | pass (clean first) | 9449 / 0 / 63 / 9512 |
| Base `c5306693` | 22.12.0 | pass | pass (clean first) | 9449 / 0 / 63 / 9512 |
| Head `c848977f` | 22.23.3 | pass | pass (clean first) | 9646 / 0 / 63 / 9709 |
| Head `c848977f` | 22.12.0 | pass | pass (clean first) | 9646 / 0 / 63 / 9709 |

Exact script: `run-gates.sh`. For each revision and each Node:
- `orgasmic dispatch gate r4-<base|head>-<version>-typecheck -- env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 env PATH=<node-bin>:$PATH bash -c 'node --version; npm run typecheck'`
- Same wrapper with `bash -c 'node --version; npm run clean && npm run build'` for build.
- Same wrapper with `bash -c 'node --version; npm run test'` for the full suite.

Node paths are `/opt/node/bin` (22.23.3) and `/tmp/credential-engines/node-v22.12.0-linux-x64/bin` (22.12.0). Base gates run detached at the new upstream commit in the assigned checkout; head gates run on the rebased branch. The tree stays clean and the commit fixed throughout each set. Every build is preceded by `npm run clean`. Installs use `npm install --ignore-scripts --no-save`; no build cache lives in evidence.

Logs: `base-install.log`, `head-install.log`, `{base,head}-<version>-{typecheck,build,test}.log`, `base-summary.log`, `head-summary.log`. Each names its daemon receipt. Process-owner records: `base-process-owner.txt`, `head-process-owner.txt`.

## Targeted regressions

- `r4-clone-red`: the first cloning/re-hold test draft failed both cases on production `a218dfb0`; a synchronous five-dispatch safety guard prevented event-loop starvation, but its thrown error left the request to expire (two 60-second timeouts). These are expected red-before failures, not head failures.
- `r4-clone-red-bounded`: improved that test-only guard to answer before throwing; ran the exact final tests with `server-connection.ts` restored to `a218dfb0`, then restored the fix. Both cases fail in under a second with **5 dispatches instead of 1** (`clone-red-bounded.log`), directly pinning the old self-rehold loop without hanging the test process. The saved fixed source is `server-connection-fixed.ts`.
- `r4-focused`: typecheck and `node --import tsx --test --test-force-exit test/mcpl-admission-held.test.ts test/mcpl-required-inference-admission.test.ts test/mcpl-request-handler-errors.test.ts test/mcpl-admission-no-hook.test.ts`; **125 passed / 0 failed** (`focused.log`), including all three new tests. These dirty-tree probes are diagnostic evidence, not substitutes for final clean receipts.
- `git diff --check` passed on the rebased branch. Rebase mapping and commit identities were inspected.

## Inherited evidence and scope

The previous round's evidence directory is `/home/orgasmic/.orgasmic/runs/run-01M669ZE6X0JNYT9SXXRN4PQ5D/evidence`. Its source revisions and historical logs are unchanged, but neither previous head nor base passes are reused for the changed upstream/current head. Both new revisions receive fresh gates on both Nodes. The supplied re-review independently reproduced the prior head on Node 22.23.3 and its behavioral probes corroborate the inherited inference-dispatch/cancellation behavior; they do not replace this round's tests.

| Historical revision | Nodes | Typecheck/build | Pass / fail / skip / total (each Node) |
| --- | --- | --- | --- |
| Original PR head `66c9db3f` | 22.23.3, 22.12.0 | passed | 9595 / 0 / 63 / 9658 |
| First fix head `89fbae88` | 22.23.3, 22.12.0 | passed | 9612 / 0 / 63 / 9675 |
| Second fix head `f3f0627a` | 22.23.3, 22.12.0 | passed | 9623 / 0 / 63 / 9686 |
| Previous upstream `00d7d7aa` | 22.23.3, 22.12.0 | passed | 9432 / 0 / 63 / 9495 |
| Previous head `a218dfb0` | 22.23.3, 22.12.0 | passed | 9626 / 0 / 63 / 9689 |

Older raw log locations and receipt limitations are recorded in the inherited report; in particular the original `66c9db3f` result is historical raw evidence, not a reusable receipt. The previous head/base test summaries were reread. Earlier R1 dispositions remain applicable with rebased identifiers; the remaining emit-guard identity dependency is corrected below rather than claiming the previous round removed it.

# Unmet Criteria

None. All twelve fresh base/head gates passed on clean committed trees, with zero failures or cancellations on both Nodes. The worktree is clean at `c848977fc2280b378576f0eb72c2b07a0a93b86f`.

# Residual Risk

- During a backlog, required data is admitted serially; sustained ingress above roughly one item per callback latency accumulates and reaches existing hold drop/refusal bounds. A bounded-concurrency ordered drain remains a maintainer-directed follow-up, not implemented.
- Held inference calls reach the provider concurrently after their individual admissions, one call per held item, as on the unconfigured path. The admission-slot limit is not an in-flight provider limit. Hold residence remains outside the admission timeout, and a peer's own deadline can expire first.
- Without a backlog, independently sent live items may complete in callback-latency order. A cloned object lacking its original transport receipt is refused rather than given authority; this fix prevents spinning, not implicit receipt transfer.
- Receipt symbols remain enumerable for existing shallow-copy propagation. Required coalescing remains unsupported; required connections carry no RFC-014 toolset presence. These inherited limits are unchanged.
- Upstream's new stdio bounds and changed diagnostic wording apply equally to both profiles. They are upstream behavior, not added admission policy.

BEGIN DISPOSITION

- R1-1: fixed in d345c455. Handshake refusal uses the validated decoder; null input is covered by the real-stdio regression.
- R1-2: fixed in a6035c10, clarified and extended in 0d3f8365. Required connections do not advertise toolHints or carry RFC-014 toolset presence. The generic result tap is preserved; production does not adopt toolset state. Explicit toolHints:true logs once at connect, without repeating on automatic transport retries.
- R1-3: fixed in 92f8ce94 and 194b6c60. Data waits through startup staging and quiesce. Held admission and synchronous dispatch/storage effects now drain sequentially in arrival order, wait for occupied admission slots, and retain the existing bounded buffer and epoch checks. a70631f7 releases held inference after provider dispatch rather than model completion and tests live capture during a drain. While a backlog drains, required data (held and newly arriving) is admitted one at a time, so sustained ingress above roughly one item per callback latency accumulates and is dropped/refused at the existing hold bounds. A bounded-concurrency ordered drain is a possible maintainer-directed follow-up, not implemented here. Tests cover >64-item push/channel bursts as requests and notifications, staggered latency, whole batches, pause and reconnect. Independently sent live traffic without a backlog remains concurrent and may reorder by callback latency; documented.
- R1-4: fixed in 8abec780. Required coalescing returns admission_unsupported before acceptance; reconnect comparisons cover both profiles.
- R1-5: fixed in 139ce36d and a1ebe78f. Removed unrelated identifier ceilings, then consolidated the duplicate admission-only AST checks into one.
- R1-6: fixed in d345c455. Refusal exists only inside the installed initialize reader; same-chunk ping is answered. The handshake -32002 capability_denied shape is documented.
- R1-7: fixed in faf75ef3. Admission refusals emit existing lane rejection/inference failure traces and rate-limited diagnostic lines, including notifications and stale work.
- R1-8: fixed in 8963ef2b. Startup follows the cause chain; binding and attestation failures remain fatal when initial cleanup also fails.
- R1-9: fixed in 7ae967fa. Exported admissionOf, AdmittedEnvelope, AdmissionConnectError and both limits, with immutable public-receipt tests.
- R1-10: fixed in 9d176f17. Only mayWake:false caps module wakes; mayWake:true preserves module wake behavior despite gate declines.
- Bot Medium, null handshake line: fixed in d345c455, with decoder reuse and real-stdio coverage.
- Bot Medium, accepted coalesced work revoked: fixed in 8abec780, by refusing unsupported coalescing before acceptance.
- Bot Medium, unrelated connector ceilings: fixed in 139ce36d; duplicate check removed in a1ebe78f.
- Bot Medium, missing handshake-refusal coverage: fixed in d345c455, covering all three lanes, malformed input and same-chunk ping.
- Follow-up Medium, held bursts overflow admission slots: fixed in 194b6c60 by sequential draining and waiting for pre-pause slot owners; >64-item tests cover both lanes and both wire forms.
- Follow-up Medium, held items reorder under callback latency: fixed in 194b6c60 by completing each held admission and dispatch before releasing the next; staggered-hook tests verify arrival order. Live concurrency is disclosed.
- Follow-up Low, toolset-adoption overclaim: corrected in 0d3f8365 and this PR body. Only generic result-tap preservation is claimed; required connections have no RFC-014 presence.
- Follow-up Low, silent explicit hint override: fixed in 0d3f8365 with a once-at-connect diagnostic and tests.
- Follow-up Low, duplicate AST inventory: fixed in a1ebe78f; one admission-only check remains.

- Final follow-up, held-inference head-of-line blocking: fixed in a70631f7. The drain waits for admission and synchronous provider dispatch; the full handler still owns cancellation and the eventual reply. The slow-provider test pins subsequent push/channel storage order.
- Final follow-up, live capture during draining: fixed in a70631f7 with a gated-callback test mixing live push/channel requests and notifications behind held data, verifying FIFO and one active callback.
- Optional pairing hardening: fixed in c848977f, completing a70631f7. Identity coupling is now removed from both trackHeldHandler and the emit guard. An explicit dispatch window replaces params identity, and a same-dispatch re-hold is refused instead of retried. Cloning and re-hold regressions verify one dispatch and a completed drain. The receipt symbol remains enumerable for existing shallow-copy propagation.
- Rebase: all 21 commits preserved without conflicts on c5306693; no squash. One core-commit range-diff context change retains the upstream stdioStopCause check before binding; admission additions are unchanged.
- Held inference timeout: covered in c848977f; the timeout refuses the inference, releases its admission slot and permits later push/channel storage without model resolution.

END DISPOSITION

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

Rebased all 21 commits without conflicts or squashing onto upstream `c5306693`. The original core commit has only a changed context line around the upstream stopped-stdio check; admission additions are preserved. Fresh typecheck, clean build and full npm test on the new upstream base and rebased head, on both Nodes under 16 GiB memory scopes:

| Revision | Node | Typecheck | Build | Pass / fail / skip / total |
| --- | --- | --- | --- | --- |
| Base `c5306693` | 22.23.3 | pass | pass (clean first) | 9449 / 0 / 63 / 9512 |
| Base `c5306693` | 22.12.0 | pass | pass (clean first) | 9449 / 0 / 63 / 9512 |
| Head `c848977f` | 22.23.3 | pass | pass (clean first) | 9646 / 0 / 63 / 9709 |
| Head `c848977f` | 22.12.0 | pass | pass (clean first) | 9646 / 0 / 63 / 9709 |

Historical original PR head `66c9db3f`: 9595 passed, 0 failed, 63 skipped on each Node (22.23.3 and 22.12.0). Fresh head coverage includes cloned dispatch, same-dispatch re-hold, and held inference admission timeout regressions, alongside upstream stdio-line and stderr-buffering tests.

Regression coverage includes the null-line, same-chunk-ping and quiesced-push repros; all handshake data-lane refusals; startup staging; >64 held pushes and channel items as requests and notifications; staggered held-order tests; slot saturation before quiesce; pause/reconnect during a drain; slow held inference with later push/channel storage in arrival order; live data captured during an active drain; cloned dispatch and explicit re-hold without a spin; held inference timeout releasing later storage; pending-batch reconnects; generic result taps and absent required-profile toolset presence; notification diagnostics; fatal cleanup causes; public exports; and module wake ceilings. The connector AST check is confined to the new admission runtime.

See `docs/required-inbound-admission.md`. This profile uses the repository's decoder/grant implementation and `@animalabs/mcpl-core` 0.4.0; no SPEC change is required. A full external MCPL pin remains separate. Existing connector-specific compatibility behavior is unchanged.

END PR BODY
