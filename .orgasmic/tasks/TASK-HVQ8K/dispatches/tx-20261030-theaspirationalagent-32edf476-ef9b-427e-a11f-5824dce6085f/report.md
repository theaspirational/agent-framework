# Changed

- Round began at `f3f0627ae1c00f3b235df76e2d60fcf45c30b1d4`. Read the complete supplied re-review and checked the inference lifetime and required drain against current source.
- Added `f21635ec` (now `a218dfb0220e86f8f1dfc4cf318e41db7c9ffd58` after rebase), **Fix R1-3: release held inference at dispatch and document drain capacity**.
- The required held-inference drain now waits for admission and synchronous provider dispatch, not the full inference. The original contained handler still owns eventual replies, errors and cancellation. Refusal or failure before dispatch settles through the full-handler fallback; transport loss still releases the waiter.
- `trackHeldHandler` pairs by the current synchronous dispatch event, no longer by handler-parameter object identity. No ordered-concurrency implementation was added.
- Added real-WebSocket regressions: a slow held inference does not delay subsequent held push/channel storage, whose arrival order remains intact; 20 live push/channel requests and notifications arriving during an active drain join behind the two held items and stay one-at-a-time.
- Updated `docs/required-inbound-admission.md` and `changelog.d/required-inbound-admission.added.md` with the dispatch boundary, serial backlog throughput and existing overflow bounds, and bounded-concurrency ordered draining as a possible maintainer-directed follow-up.
- Changed-file inventories: `round-changed-files.txt` (this round) and `branch-changed-files.txt` (whole rebased branch).
- Production changes this round: `src/framework.ts`, `src/mcpl/inference-router.ts`, `src/mcpl/server-connection.ts`. Test changes: `test/mcpl-admission-held.test.ts`. Explicit staging only. All 20 branch commits retain the required author, committer and co-author trailer (`commit-identities.txt`). No push, PR edit, comment or main-checkout modification.

## Rebase and upstream interactions

- Start-of-round `git ls-remote https://github.com/anima-research/agent-framework.git refs/heads/main`: `00d7d7aaba7492c7a1703799e8b55050ebbc2d19` (advanced from the previously reported `30825fdf`). Fetched that exact revision.
- Command: `git rebase --onto 00d7d7aaba7492c7a1703799e8b55050ebbc2d19 48f26ce56cf73267d715e853acc9a88b50595337`.
- **No conflicts. No squash or dropped commits.** All six original commits and fourteen fix commits replayed. `range-diff.txt` marks all 20 patch pairs `=`. `pre-rebase-commits.txt`, `rebased-commits.txt`, `pre-rebase-head.txt` and `rebase.log` record the complete mapping and operation.
- Inspected the complete upstream diff from `48f26ce5` to `00d7d7aa` (`upstream-diff.patch`):
  - `d92e6b55` raises Chronicle to `^0.5.1`; `95aed056` clarifies its storage scope and updates comments in the canonical inbound-source serializer and tool-result guard. Chronicle preserves object-key insertion order for new JSON writes. Canonical source hashing still sorts keys; admission verdicts/receipts and stored-message arrival order do not depend on object-property sorting. Installed Chronicle is `0.5.1`. Both upstream and rebased head are verified with that same dependency. The upstream migration caveat for previously stored raw-byte objects remains applicable; no storage migration was introduced here.
  - `7c52a683` copies QuickJS WASM in pretest and makes orphan helpers fail promptly if the child exits before output; `ea5643d1` adds that regression. These affect test setup/failure reporting, not admission. Fresh clean builds and full tests exercise the updated helpers and include the extra upstream test.
  - `22c1b26d` changes the no-reconnect-after-stop process probe from a machine-wide `ps` read to a scoped `pgrep`, avoiding buffer overflow. This improves the transport lifecycle gate without changing connection behavior; the full suites include it alongside admission lifecycle tests.
  - Merge commits `30825fdf`, `cdf7e550`, `00d7d7aa` introduce these upstream changes; no other upstream runtime dispatch changes are present in this interval.
- End-of-round upstream observation: `00d7d7aaba7492c7a1703799e8b55050ebbc2d19` from the same `git ls-remote` command; unchanged during this round (`upstream-end.txt`).

# Verification Gates

Every install, typecheck, build and test ran through `orgasmic dispatch gate` under `env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`. No earlier gate pass substitutes for fresh verification.

## Fresh base and rebased-head gates

| Revision | Node | Typecheck | Build | Pass / fail / skip / total |
| --- | --- | --- | --- | --- |
| Base `00d7d7aa` | 22.23.3 | pass | pass (clean first) | 9432 / 0 / 63 / 9495 |
| Base `00d7d7aa` | 22.12.0 | pass | pass (clean first) | 9432 / 0 / 63 / 9495 |
| Head `a218dfb0` | 22.23.3 | pass | pass (clean first) | 9626 / 0 / 63 / 9689 |
| Head `a218dfb0` | 22.12.0 | pass | pass (clean first) | 9626 / 0 / 63 / 9689 |

Exact script: `run-gates.sh`. It runs, for each revision and Node:

- `orgasmic dispatch gate r3-<base|head>-<version>-typecheck -- env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 env PATH=<node-bin>:$PATH bash -c 'node --version; npm run typecheck'`
- Same wrapper with `bash -c 'node --version; npm run clean && npm run build'` for the build gate.
- Same wrapper with `bash -c 'node --version; npm run test'` for the full-test gate.

Node paths: `/opt/node/bin` (22.23.3), `/tmp/credential-engines/node-v22.12.0-linux-x64/bin` (22.12.0). Base gates ran detached at `00d7d7aa` in the assigned worktree; head gates ran after returning to the rebased branch. No checkout movement or source edits occurred during either set of final gates. `npm run clean` preceded **each** build, removing stale compiled tests between revisions and Nodes. Installs use `npm install --ignore-scripts --no-save`; no tracked lockfile or dependency edit was added by this round.

Logs, relative to this report directory: `base-install.log`, `head-install.log`, `base-<version>-{typecheck,build,test}.log`, `head-<version>-{typecheck,build,test}.log`, `base-summary.log`, `head-summary.log`. Each log identifies its daemon receipt. Owner records: `base-process-owner.txt`, `head-process-owner.txt`.

## Scoped probes

- `hol-red`: the new slow-held-inference test on unchanged production `f3f0627a` failed while the later two items remained held (60-second request timeout). `hol-red-bounded` then pinned the specific failure at five seconds: “all held data must dispatch while inference is still pending.” Its failed-test cleanup also left two request timers to expire; the final test releases the provider and settles requests before closing. These are expected red-before reproductions, not unresolved head failures.
- `hol-green` and `r3-focused`: typecheck plus the held/inference suites, **33 passed / 0 failed**. Two extra filenames in the initial command did not match existing files; these counts cover only the two actual suites, not containment or no-hook coverage.
- `r3-contained`: corrected explicit file list, `node --import tsx --test --test-force-exit test/mcpl-admission-held.test.ts test/mcpl-required-inference-admission.test.ts test/mcpl-request-handler-errors.test.ts test/mcpl-admission-no-hook.test.ts`; **122 passed / 0 failed**. This includes cancellation and contained-error behavior, unconfigured compatibility, >64 held bursts, staggered arrival order, and the two new tests. Logs are `hol-red.log`, `hol-red-bounded.log`, `hol-green.log`, `r3-focused.log`, `r3-contained.log`. These dirty-tree probes are diagnostic evidence, not reusable final-head receipts.
- `git diff --check 00d7d7aa..a218dfb0` passed. `git range-diff` confirms the rebase preserved every branch patch.

## Inherited evidence and scope

Historical source revisions and their logged results remain unchanged, but the current source, upstream inputs and Chronicle dependency changed; none of these results is reused as a current gate:

| Historical revision | Node | Typecheck/build | Pass / fail / skip / total |
| --- | --- | --- | --- |
| Original PR head `66c9db3f` | 22.23.3 | passed | 9595 / 0 / 63 / 9658 |
| Original PR head `66c9db3f` | 22.12.0 | passed | 9595 / 0 / 63 / 9658 |
| First fix head `89fbae88` | 22.23.3 | passed | 9612 / 0 / 63 / 9675 |
| First fix head `89fbae88` | 22.12.0 | passed | 9612 / 0 / 63 / 9675 |
| Second fix head `f3f0627a` | 22.23.3 | passed | 9623 / 0 / 63 / 9686 |
| Second fix head `f3f0627a` | 22.12.0 | passed | 9623 / 0 / 63 / 9686 |

Original/first-fix logs and report: `/home/orgasmic/.orgasmic/runs/run-01M6669APQD2QBQ44ZZ6DRVMCT/evidence`. Second-fix logs and report: `/home/orgasmic/.orgasmic/runs/run-01M668ANMJV2SVKBVVH237B0SJ/evidence`; the two `head-*-test.log` summaries were reread. The original `66c9db3f` result is raw baseline evidence, not a reusable receipt (the enclosing wrapper observed a later HEAD movement after compiled tests started). The supplied re-review independently reproduced the second-fix 22.23.3 count; it is supporting evidence only. Earlier finding dispositions remain valid through the patch-equivalent rebase, with R1-3 completion semantics updated below.

# Unmet Criteria

None of the mandatory criteria remain unmet. All twelve fresh base/head gates passed on clean committed trees, with zero failures or cancellations on both Nodes. The worktree is clean at `a218dfb0220e86f8f1dfc4cf318e41db7c9ffd58`.

Optional non-enumerable receipt hardening was not taken: existing shallow event-copy paths rely on the symbol propagating. Changing that safely needs explicit receipt forwarding and its own compatibility coverage, rather than a descriptor-only change. The optional parameter-identity pairing improvement was implemented.

# Residual Risk

- A backlog remains serial for held and newly arriving required data. Sustained ingress above roughly one item per callback latency accumulates and is dropped/refused at the existing hold bounds. Buffer residence is outside the admission timeout. A bounded-concurrency ordered drain remains a possible maintainer-directed follow-up, not part of this change.
- Without a backlog, independently sent live items remain concurrent and may reorder by callback latency. Held inference no longer adds full model latency to backlog release; synchronous provider dispatch can still block the JavaScript thread.
- Host callbacks must cooperate with cancellation and protect external effects. Limits cannot preempt synchronous code or undo external writes.
- Required coalescing remains unsupported, and pending unconfigured coalesced work should be drained before enabling the profile. Required connections carry no RFC-014 toolset presence; preserved generic result taps do not imply production toolset-state adoption.
- The receipt symbol remains enumerable to preserve existing shallow-copy behavior; it is host-only and not supplied by wire JSON.

BEGIN DISPOSITION

- R1-1: fixed in 47b52140. Handshake refusal uses the validated decoder; null input is covered by the real-stdio regression.
- R1-2: fixed in 862e130f, clarified and extended in 54997f76. Required connections do not advertise toolHints or carry RFC-014 toolset presence. The generic result tap is preserved; production does not adopt toolset state. Explicit toolHints:true logs once at connect, without repeating on automatic transport retries.
- R1-3: fixed in 1bec9083 and 56024279. Data waits through startup staging and quiesce. Held admission and synchronous dispatch/storage effects now drain sequentially in arrival order, wait for occupied admission slots, and retain the existing bounded buffer and epoch checks. a218dfb0 releases held inference after provider dispatch rather than model completion and tests live capture during a drain. While a backlog drains, required data (held and newly arriving) is admitted one at a time, so sustained ingress above roughly one item per callback latency accumulates and is dropped/refused at the existing hold bounds. A bounded-concurrency ordered drain is a possible maintainer-directed follow-up, not implemented here. Tests cover >64-item push/channel bursts as requests and notifications, staggered latency, whole batches, pause and reconnect. Independently sent live traffic without a backlog remains concurrent and may reorder by callback latency; documented.
- R1-4: fixed in a204d1bd. Required coalescing returns admission_unsupported before acceptance; reconnect comparisons cover both profiles.
- R1-5: fixed in ae9be1ac and d09baa90. Removed unrelated identifier ceilings, then consolidated the duplicate admission-only AST checks into one.
- R1-6: fixed in 47b52140. Refusal exists only inside the installed initialize reader; same-chunk ping is answered. The handshake -32002 capability_denied shape is documented.
- R1-7: fixed in 4c506645. Admission refusals emit existing lane rejection/inference failure traces and rate-limited diagnostic lines, including notifications and stale work.
- R1-8: fixed in bc5377ef. Startup follows the cause chain; binding and attestation failures remain fatal when initial cleanup also fails.
- R1-9: fixed in e6c6fcab. Exported admissionOf, AdmittedEnvelope, AdmissionConnectError and both limits, with immutable public-receipt tests.
- R1-10: fixed in 750d44ee. Only mayWake:false caps module wakes; mayWake:true preserves module wake behavior despite gate declines.
- Bot Medium, null handshake line: fixed in 47b52140, with decoder reuse and real-stdio coverage.
- Bot Medium, accepted coalesced work revoked: fixed in a204d1bd, by refusing unsupported coalescing before acceptance.
- Bot Medium, unrelated connector ceilings: fixed in ae9be1ac; duplicate check removed in d09baa90.
- Bot Medium, missing handshake-refusal coverage: fixed in 47b52140, covering all three lanes, malformed input and same-chunk ping.
- Follow-up Medium, held bursts overflow admission slots: fixed in 56024279 by sequential draining and waiting for pre-pause slot owners; >64-item tests cover both lanes and both wire forms.
- Follow-up Medium, held items reorder under callback latency: fixed in 56024279 by completing each held admission and dispatch before releasing the next; staggered-hook tests verify arrival order. Live concurrency is disclosed.
- Follow-up Low, toolset-adoption overclaim: corrected in 54997f76 and this PR body. Only generic result-tap preservation is claimed; required connections have no RFC-014 presence.
- Follow-up Low, silent explicit hint override: fixed in 54997f76 with a once-at-connect diagnostic and tests.
- Follow-up Low, duplicate AST inventory: fixed in d09baa90; one admission-only check remains.

- Final follow-up, held-inference head-of-line blocking: fixed in a218dfb0. The drain waits for admission and synchronous provider dispatch; the full handler still owns cancellation and the eventual reply. The slow-provider test pins subsequent push/channel storage order.
- Final follow-up, live capture during draining: fixed in a218dfb0 with a gated-callback test mixing live push/channel requests and notifications behind held data, verifying FIFO and one active callback.
- Optional pairing hardening: fixed in a218dfb0; trackHeldHandler pairs by synchronous event dispatch rather than params identity. The receipt symbol remains enumerable because existing shallow-copy paths rely on propagation; descriptor-only hardening would risk dropping the wake cap.
- Rebase: all 20 commits preserved without conflicts on 00d7d7aa; no squash.

END DISPOSITION

BEGIN PR BODY

## Summary

Add opt-in required admission for inbound legacy MCPL traffic with `McplServerConfig.inboundAdmission`. Unconfigured connections keep their existing synchronous dispatch and behavior. New admission code contains no connector-specific policy.

## Contract

- Host-issued binding keys identify the connection instance and transport epoch. The callback receives a detached, frozen raw item and cancellation signal.
- Existing capability, feature and registration authorization precedes admission. Verdicts are closed-field validated; authority and registration are rechecked after awaits. Denial, timeout, exceptions, invalid verdicts and stale authority admit nothing.
- Data received after initialize waits through startup staging, policy exchange and quiesce. Required held data drains sequentially in arrival order, including whole channel batches, under the key current at flush. A flush waits for admission slots instead of refusing backlog overflow. New data joins an active drain; control traffic and RPC responses stay live. Superseded-epoch work is refused.
- Independently sent live items without a backlog remain concurrent and may complete in callback-latency order. Held inference releases the drain after admission and synchronous provider dispatch, not after model completion. Hold time is outside the per-item admission timeout. While a backlog drains, required data (held and newly arriving) is admitted one at a time, so sustained ingress above roughly one item per callback latency accumulates and is dropped/refused at the existing hold bounds. A bounded-concurrency ordered drain is a possible follow-up at the maintainer's discretion, not implemented here.
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

Rebased all 20 commits without conflicts or squashing onto upstream `00d7d7aa`. Every patch is unchanged by replay. Fresh typecheck, clean build and full npm test on the new upstream base and rebased head, on both Nodes under 16 GiB memory scopes:

| Revision | Node | Typecheck | Build | Pass / fail / skip / total |
| --- | --- | --- | --- | --- |
| Base `00d7d7aa` | 22.23.3 | pass | pass (clean first) | 9432 / 0 / 63 / 9495 |
| Base `00d7d7aa` | 22.12.0 | pass | pass (clean first) | 9432 / 0 / 63 / 9495 |
| Head `a218dfb0` | 22.23.3 | pass | pass (clean first) | 9626 / 0 / 63 / 9689 |
| Head `a218dfb0` | 22.12.0 | pass | pass (clean first) | 9626 / 0 / 63 / 9689 |

Historical original PR head `66c9db3f`: 9595 passed, 0 failed, 63 skipped on each Node (22.23.3 and 22.12.0). Fresh head coverage includes the two new drain tests and the upstream orphan-helper regression.

Regression coverage includes the null-line, same-chunk-ping and quiesced-push repros; all handshake data-lane refusals; startup staging; >64 held pushes and channel items as requests and notifications; staggered held-order tests; slot saturation before quiesce; pause/reconnect during a drain; slow held inference with later push/channel storage in arrival order; live data captured during an active drain; pending-batch reconnects; generic result taps and absent required-profile toolset presence; notification diagnostics; fatal cleanup causes; public exports; and module wake ceilings. The connector AST check is confined to the new admission runtime.

See `docs/required-inbound-admission.md`. This profile uses the repository's decoder/grant implementation and `@animalabs/mcpl-core` 0.4.0; no SPEC change is required. A full external MCPL pin remains separate. Existing connector-specific compatibility behavior is unchanged.

END PR BODY
