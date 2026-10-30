# Required inbound admission documentation polish

## Changed

- Final head: **`869bb3add7b48893d48b2ce50ea423e4b33fdfbc`**.
- Amended only the former tip `1d990e41` to **`cd440f5d01f6fbdb8cc7259ce3dc109660c00a67`**, replacing its co-author trailer with `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Parent and complete tree are identical; the rest of the message is unchanged.
- The earlier **21 commit SHAs are unchanged**, not merely patch-equivalent. `round-range-diff.txt` shows 21 equal entries, the one trailer-only change, and the new docs commit.
- Separate docs commit **`869bb3ad`**, with `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`, adds the requested sentence after the wake-semantics paragraph in `docs/required-inbound-admission.md`: admitted work rides the round's results only with declared `supportsInjectedMessages: true`, otherwise arriving at turn end.
- Author and committer on all 23 commits are `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`.
- Generated the refreshed `pr-body.md` directly from the previous canonical UTF-8 `pr-body.md`, not the damaged report copy. This report embeds that exact file content. The multiplication sign in `batch length × timeoutMs` is preserved.
- No production source, test or dependency changes; no push or remote PR edits. Only the docs file differs from the previous reviewed tree. Worktree clean; diff whitespace checks pass.

## Verification Gates

### Fresh evidence at the final head

Command, launched **in the tested worktree**, without changing directory inside the driver:

```sh
orgasmic dispatch gate final-node22.23.3 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash "$ORGASMIC_EVIDENCE_DIR/run-final-suite.sh"
```

The driver selects `/opt/node-v22.23.3-linux-x64/bin`, exports `AF_TEST_CONCURRENCY=8`, prints working directory, PID/PGID, revision and Node version, then runs `npm run clean`, `npm run typecheck`, `npm run build`, and full `npm test` with fail-fast shell settings. Receipt cwd and tested checkout coincide. Final head and clean tree are maintained throughout.

- **Typecheck: pass. Clean build: pass. Full suite: 9629 tests / 9566 pass / 0 fail / 63 skip / 0 cancelled / 0 todo.**
- Console: `final-node22.23.3.console.log`.
- Receipt log: `gate-final-node22.23.3-01M677DKTTKY6779E117RBGKKC.log`.
- `polish-integrity`: `orgasmic dispatch gate polish-integrity -- python3 "$ORGASMIC_EVIDENCE_DIR/check-integrity.py"`, exit 0. Checks exact earlier commit identities, trailer-only amendment with identical parent/tree, docs-only final commit, unchanged runtime/tests/dependency declaration, requested identities/trailers, and clean tree. Console: `polish-integrity.console.log`.
- `pr-text-integrity`: `orgasmic dispatch gate pr-text-integrity -- python3 "$ORGASMIC_EVIDENCE_DIR/check-pr-text.py"`, exit 0. Verifies canonical/report body equality, valid UTF-8 and absence of replacement/mojibake sequences. Console: `pr-text-integrity.console.log`.

### Inherited evidence and limits

`inherited-evidence.json` records source paths and SHA-256 hashes for the prior canonical PR body, upstream audit/inventory, range-diff/identity checks, negative control and four full-suite console logs. The upstream base, all 21 replayed commits, production source, tests and dependency declarations are unchanged. Thus the prior upstream interaction audit and the two undeclared-stream negative-control failures remain applicable to exactly the same implementation and tests; no new execution of that negative control is claimed.

Historical raw suite evidence: base `a64cfc01` on each Node was **9363 / 0 / 63 / 9426** (pass/fail/skip/total), and the previous head `1d990e41` on each Node was **9566 / 0 / 63 / 9629**. These are explicitly historical, not fresh passes at this head. No earlier receipt is reused. In particular, the old baseline wrappers had the wrong receipt cwd, so they do not attest a baseline revision; the raw console logs print the actual base SHA. This round's wrapper runs directly in the tested worktree. No baseline or Node 22.12.0 rerun was assigned for this round.

## Unmet Criteria

None.

## Residual Risk

Runtime behavior is unchanged. Transport coverage uses repository fixtures and mock providers; no live connector/provider or deployment qualification. The existing callback-cancellation and external-effect limits remain. The refreshed PR body is local only.

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
- `mayWake:false` caps downstream wakes, including module requests. `mayWake:true` leaves gate/module behavior intact; it does not force a wake. Admitted work goes out with the round's results only on a stream that declares `supportsInjectedMessages: true`; otherwise it arrives at turn end.
- Missing bindings and attestation refusals abort startup, including through cleanup-error wrappers. Ordinary outages retain existing non-fatal startup and reconnect behavior.
- Refusals use itemwise channel results, push `{accepted:false, reason}` results, or inference errors (-32600), with fixed-code traces and rate-limited diagnostics. Inference cancellation releases its slot; stop answers once and transport closure answers nothing.

## Public API and limits

Exports include `admissionOf(event)`, read-only `AdmittedEnvelope`, `AdmissionConnectError`, `MAX_ADMISSION_TIMEOUT_MS` (60000), and `MAX_PENDING_ADMISSIONS` (64). Timeout is required in 1..60000 ms. Live overload refuses immediately; connection budgets are independent. Channel batches have per-item deadlines, so their latency can approach batch length × timeoutMs.

Optional `replyIntent` is validated host-only runtime data, not persisted authority. Stamp support arrives with context-only delivery; this profile rejects stamp and unknown verdict members. Callbacks must cooperate with cancellation and protect their own external effects.

## Verification

Rebased all 21 original commits without conflicts or squashing onto upstream `a64cfc010f4df5090c698e9fa7926b1d3aa0dc5a`. `git range-diff c5306693..c848977f a64cfc01..869bb3add7b48893d48b2ce50ea423e4b33fdfbc` marks every original patch equal. Two additional commits cover upstream's deferred-injection path (`cd440f5d`, test only) and document when admitted work reaches a running turn (`869bb3ad`, docs only). The test commit's co-author trailer is normalized; its tree is unchanged. Final local head: `869bb3add7b48893d48b2ce50ea423e4b33fdfbc`.

Fresh standalone typecheck, clean build and full `npm test` at that final head on Node 22.23.3, under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, with `AF_TEST_CONCURRENCY=8`. The gate wrapper and the tested checkout have the same working directory and revision:

| Revision | Node | Typecheck | Clean build | Pass / fail / skip / total |
| --- | --- | --- | --- | --- |
| Final head `869bb3ad` (fresh) | 22.23.3 | pass | pass | 9566 / 0 / 63 / 9629 |
| Previous head `1d990e41` (historical) | 22.12.0 | pass | pass | 9566 / 0 / 63 / 9629 |
| Base `a64cfc01` (historical) | 22.23.3 | pass | pass | 9363 / 0 / 63 / 9426 |
| Base `a64cfc01` (historical) | 22.12.0 | pass | pass | 9363 / 0 / 63 / 9426 |

Historical rows are earlier raw run evidence, not fresh or reusable final-head receipts. The earlier baseline wrappers did not run with the baseline checkout as their working directory; their suite output identifies the actual tested base. Base and Node 22.12.0 were not rerun for this docs/trailer round. Production source, tests and dependency declarations are unchanged from the previously tested head.

The suite contains 203 more tests than the recorded base, including six real-WebSocket cases crossing channel/push admission with declared, non-carrying and undeclared injection support. Denied work never reaches modules, storage or injection; admitted `mayWake:false` work preserves upstream's deferral and cannot gain a module-driven wake. The earlier negative control restoring the old injection-drain condition failed both undeclared-stream cases; all six pass with upstream's condition. That unchanged negative-control evidence is inherited, not rerun in this round. Existing admission semantics are unchanged.

Regression coverage includes the null-line, same-chunk-ping and quiesced-push repros; all handshake data-lane refusals; startup staging; >64 held pushes and channel items as requests and notifications; staggered held-order tests; slot saturation before quiesce; pause/reconnect during a drain; slow held inference with later push/channel storage in arrival order; live data captured during an active drain; cloned dispatch and explicit re-hold without a spin; held inference timeout releasing later storage; pending-batch reconnects; generic result taps and absent required-profile toolset presence; notification diagnostics; fatal cleanup causes; public exports; and module wake ceilings. The connector AST check is confined to the new admission runtime.

See `docs/required-inbound-admission.md`. This profile uses the repository's decoder/grant implementation and `@animalabs/mcpl-core` 0.4.0; no SPEC change is required. A full external MCPL pin remains separate. Existing connector-specific compatibility behavior is unchanged.

## Not verified / out of scope

No live connector or external model-provider qualification, deployment, publication or protocol change. Model execution in the transport tests uses the repository mock provider. Existing JavaScript callback cancellation and external-effect limitations still apply.

Generated with OpenAI Codex.

END PR BODY
