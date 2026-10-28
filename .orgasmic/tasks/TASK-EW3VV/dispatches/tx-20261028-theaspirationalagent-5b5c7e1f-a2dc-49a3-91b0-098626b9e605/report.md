# Independent review — TASK-EW3VV

## Verdict

**REJECT** — two MEDIUM findings. Reviewed `112bc593464315a9531b6af6d00d9d2368985daa..d2b5fbf0cd15652427dd5afff13a80257ae59195`, including original-base compatibility evidence. No tracked files, commits, branches or dependencies changed.

## Findings

### MEDIUM — bug / lifetime: replaced failed configurations remain strongly retained after stop

**`src/framework.ts:6438–6439`**, with `src/mcpl/protocol-family.ts:286,295` and `src/framework.ts:4745`.

Registration inserts the configuration into the owner's strong `Map`, but replacing an existing id does not end the previous object's lifetime. A failed initial connection can be replaced under the same id: its registry entry has been removed, while its configuration remains in the config map. The next registration overwrites that config map entry without disposing the old ownership entry. Stop iterates only the current config-map values, so it cannot dispose the overwritten entries. The final-close listener is installed only after the initial handshake succeeds and does not repair this path.

**Reproducer:** from the reviewed checkout:

```sh
node --expose-gc --import tsx "$ORGASMIC_EVIDENCE_DIR/reviewer-gc.mjs"
node --expose-gc --import tsx --import ./test/mcpl-narrow-overlay.mjs "$ORGASMIC_EVIDENCE_DIR/reviewer-gc.mjs"
```

The probe performs eight public `connectMcplServer` calls with different configuration objects, the same id, and a loopback server returning 401; it stops the framework, releases caller references, and runs GC across event-loop turns. Candidate retains **8/8 configurations**, original base **1/8**, while both config maps contain only one entry. `reviewer-gc-legacy.mjs` repeats with `credentialRequired:false`: same **8 versus 1** regression. Thus even never-strict ownership bookkeeping is not inert with respect to retention.

`reviewer-probe.mjs` independently inspects the old object's accepted set after replacement and after stop; both Node and Bun still return the old token. These are genuinely retained credential sets, not merely WeakRef scheduling differences. An application retaining its stopped framework retains these obsolete configurations and credentials indefinitely; repeated unsuccessful reconfiguration grows memory without relation to currently held configuration lifetimes.

**Fix direction:** retire the displaced object before overwriting an id; explicitly unwind non-reconnecting failed-initial-connect lifetimes, and make stop clear all ownership entries belonging to that framework, not only entries still discoverable through its public config map. Preserve reconnect and independent-owner retention. Add failed-handshake/replacement/stop GC controls for strict and never-strict objects.

### MEDIUM — correctness / unmet safe-projection criterion: unsafe preparation can prevent both strict exports

**`src/framework.ts:26656,26665–26671`** (`failureDescription` at 2481 and `boundFailureFields` at 2578).

The ops route prepares untrusted messages/details using legacy coercion and serialization **before** making the detached strict exporting copy. A top-level details accessor is read by `Object.entries` inside `boundFailureFields`. If it throws, `notifyOpsAlert` propagates the exception before either `logFailure` or webhook publication. There is no detached strict record to withhold the accessor safely. This occurs without any trace listeners.

**Reproducer:** `node --import tsx "$ORGASMIC_EVIDENCE_DIR/reviewer-accessors.mjs"` (also reproduced with `bun-1.4.3`). With a registered strict configuration whose provider credential has passed strict admission, invoke:

```js
fw.notifyOpsAlert('review-getter', 'agent', 'ordinary', {
  get details() { throw new Error('synthetic getter executed'); }
});
```

Result: throws `synthetic getter executed`; no record for this call. The probe also demonstrates a caller Error.message getter, nested toJSON, and message toString executed during preparation. Its transcript is `{"getter":1,"toJSON":1,"toString":1,"throwing":1,"thrown":"synthetic getter executed","records":2}` for three alert calls.

This finding does **not** require removing the permitted unchanged trace formatter, and a trace formatter's single toJSON invocation alone is not the finding. The defect is that the strict exporters depend on unsafe preparation succeeding before their descriptor-only projection exists. The committed hostile-data witness hides its getter behind a toJSON method and therefore does not exercise this top-level accessor path. Legacy formatting behavior is pre-existing; inheriting it here leaves the new strict safe-projection acceptance criterion unmet.

**Fix direction:** derive the strict exporting projection from raw descriptors before legacy preparation; isolate the latter so an unsafe trace preparation cannot suppress the detached strict exports. Leave never-strict behavior and ordinary trace bytes unchanged. Test throwing top-level details accessors and Error accessors, not only a getter hidden behind toJSON.

## Verification Gates

All new commands below ran through `orgasmic dispatch gate NAME -- ...` and exited 0. Reproduction gates exit 0 because they record the demonstrated defect, not because the implementation is correct.

### Independently executed

- `reviewer-strict-node`: `node --import tsx --test test/mcpl-strict-five-codes.test.ts test/mcpl-strict-minimum.test.ts test/mcpl-strict-client-faults.test.ts test/mcpl-strict-sink-routes.test.ts test/mcpl-strict-credentials.test.ts` — **114 pass**. Log: `gate-reviewer-strict-node-01M601F5D4MDZN4SXMASGSSQ8N.log`.
- `reviewer-strict-bun`: `bun-1.4.3 test` with the same five files — **113 pass, 1 explicit skip**, zero failures. Log: `gate-reviewer-strict-bun-01M601FDMW6VE8QK70MGFJMKX7.log`.
- `reviewer-lifetime-probe`: `node --import tsx "$ORGASMIC_EVIDENCE_DIR/reviewer-probe.mjs"`; Bun counterpart `reviewer-lifetime-bun`: `bun-1.4.3` with that script. Logs: `gate-reviewer-lifetime-probe-01M601H8WA5KPWCGKRM2JVT3CE.log`, `gate-reviewer-lifetime-bun-01M601K0RK3BNBH6X46XVF2KC0.log`.
- `reviewer-gc-final` / `reviewer-gc-base`: the two GC commands above. Logs: `gate-reviewer-gc-final-01M601J37KW0032D5NXMPM55YG.log`, `gate-reviewer-gc-base-01M601J3Z5S6T94P35NGRC15MW.log`.
- `reviewer-gc-legacy-final` / `reviewer-gc-legacy-base`: those GC commands using `reviewer-gc-legacy.mjs`. Logs: `gate-reviewer-gc-legacy-final-01M601KJH71ZY8EN0HWZAN3X1Y.log`, `gate-reviewer-gc-legacy-base-01M601KKC4VQZ63AJXTNFRNF9C.log`.
- `reviewer-accessors-node` / `reviewer-accessors-bun`: the accessor probe commands above. Logs: `gate-reviewer-accessors-node-01M601K02JPWTB1MHDQEAZ47Q2.log`, `gate-reviewer-accessors-bun-01M601K0GSAR3Q4VZP0VMX7GNA.log`.

All these log paths and probe files are relative to this review's evidence directory. Node v22.23.3; Bun 1.4.3.

### Reused clean-commit receipts, as specifically instructed

Read gate-receipt policy and supplied logs. The later execution-context instruction explicitly says to reuse these clean passes rather than rerun them; consequently build, typecheck, full Node suite and comparison below are **reused**, not claimed independently rerun. Paths below are relative to `$ORGASMIC_REVIEWED_EVIDENCE_DIR`.

| Command | Outcome | Receipt log |
|---|---|---|
| `npm run build` | PASS | `gate-final-candidate-build-01M600XKKC3FRD1Y1EXEPSF4ZX.log` |
| `npm run typecheck` | PASS | `gate-final-candidate-typecheck-01M600XM6S1H328WD8BZGE2GJM.log` |
| `npm test` | 7,947 pass / 45 skip / 0 fail | `gate-final-candidate-test-01M600XMJ7515VAGHQKRR77XNG.log` |
| `env P2_EVIDENCE=<reviewed-evidence>/final-comparison bash test/mcpl-narrow-verify.sh` | PASS, Node and Bun base/final comparisons | `gate-final-candidate-comparison-01M600XRNBZXK24GQETMHT09QX.log` |
| Supplied `final-identity-controls` four-run Node/Bun base/final command | PASS | `gate-final-identity-controls-01M600Y0WQWH6QEEAMBVZWGT6M.log` |
| `env PROBE_OUTPUT=<reviewed-evidence>/absence-final-node.json node --import tsx test/mcpl-strict-sinks.mjs` | 288 cells, zero unexpected presence | `gate-final-matrix-node-01M600Y4V7AXF5403JV37X70PK.log` |
| Bun equivalent of previous command | same | `gate-final-matrix-bun-01M600YAZNF6YVYYMY5H87K5NX.log` |
| `python3 <reviewed-evidence>/final-audit.py` | PASS | `gate-final-audit-01M601DRJ79KF16B93Z8181SB5.log` |

These receipts identify the exact reviewed HEAD and clean tree. No project-specific extra gate policy was supplied; baseline project constraints were read; no AGENTS.md was found in the assigned worktree hierarchy scan.

### Source and production-route checks

- Read implementer report, three-file production diff, README diff, writer/caller inventories, strict tests and comparison overlay/harness. Checked source references to `failures.log` and `CONNECTOME_OPS_WEBHOOK`: one append boundary and one configured webhook builder/sender; no alternate writer found. Hard-down uses those same boundaries.
- Independently executed real-route fixtures cover already-escaped raw/percent/form/JSON/slash/unicode/header forms, accepted-token rotation beyond 16, mixed strict/non-strict failures, removal, same-object re-add, stop/final close, runtime strict enabling, flag-off retention, reconnect pending/completed, and independent framework owners. Those fixtures pass; failed-initial-connect replacement was the missing lifetime transition.
- Inspected strict-only structured status listener and teardown; tested classification, redirects, abort, timer cleanup and settlement. Length 31 is refused before upgrade; length 32 succeeds. The fixed minimum message does not interpolate token/value length.
- Mixed fixture asserts application tool error text unchanged and compares other diagnostic/application snapshots. Production changes do not touch tool-result, push/channel or external-message handlers. Full strict application-lane coverage is not inferred from that source observation.
- Report correctly describes assembled-text sink redaction by manager decision, not R3 template provenance; template-collision over-redaction is documented and tested. No request to expand redaction to parked sinks.

## Unmet Criteria / test gaps

- Failed initial connection followed by same-id replacement and stop does not dispose obsolete lifetime records; never-strict retention also regresses.
- Ops strict exporting path is not independent of unsafe raw formatting; throwing-accessor case was absent from supplied tests.
- Full Bun suite is not green: implementer reports 175 existing failures, without new identities. I did not rerun that suite or independently reclassify all 175 failures; new scoped Bun tests passed except the explicitly skipped real post-open-error route.
- Real DNS and actual client-constructor throw remain dependency-injected branch tests; real Bun post-open error remains skipped. Numerous static alert callers remain source-only, as labelled in supplied inventory.
- No additional real-wire accepted-credential push/channel-message preservation probe was performed in this review. Application-lane completeness is not claimed.

## Residual Risk

Local console/trace/health/marker/notices/listings redaction remains intentionally parked. No rollout approval is implied. Unbounded retention within a genuinely live strict configuration is owner-approved; retention of displaced ended lifetimes is not. The supplied comparison harness covers its declared byte snapshots, not memory ownership, which explains why it passes despite finding 1.

## Fix Directions

Address the two findings with scoped regression tests, then rerun the strict Node/Bun route tests and original-base comparison. Keep all other owner decisions unchanged: union at only two sinks, structured status only, no template-provenance expansion, legacy 16-entry history, and no application-data redaction.

## Manager follow-up checks

Read both pending manager messages in full after finalize's pending-message refusal and acknowledged them. Read the supplied PR draft outside the repository; its SHA256 matches the manager-supplied `41c1a6878addbee7ff7945110b990652bde22884789dce52ec79e22f1ede1fa1`. The draft was not copied into the ledger or checkout.

- **Final commit reviewed separately:** `git show d2b5fbf0 -- src/framework.ts src/mcpl/protocol-family.ts src/mcpl/transport.ts`. Its actual production changes include inert ownership for all registrations, existence-based cleanup, lazy accepted sets, flag-off retention, native Error formatting, structural outer-field names, and moving the exporting projection after shared preparation. Findings 1 (including never-strict retention) and 2 directly cover consequences of those production changes; it was not treated as docs-only.
- **Legacy lifecycle hooks:** inspected registration/removal/stop/final-close hunks and helper implementations. They add no listeners or publications; final-close cleanup is inserted into an existing callback. Cleanup itself reads private Map/WeakRef state rather than caller getters or flags, so no new ordinary caller-induced throw during legacy shutdown was found; stop completed in all GC probes. Serialized legacy output/order controls pass. However the stronger 'nothing observable' claim is false for memory retention, as finding 1 proves with never-strict configurations.
- **Late-error swallow:** strict `transport.ts:748,758` is a stateless no-op installed only during abandonment, after `settled = true`, timer cancellation, abort-listener removal and dial-listener removal, before request/response/socket teardown and the fixed rejection. It consumes teardown/late socket error events on an already abandoned socket. The success path installs a separate `transport.reportError(connection-failed)` listener, not this swallow. It neither reads a body nor retains a dial callback; the exercised abandonment paths settle once and close sockets. No finding from this listener. The corresponding legacy listener is pre-existing and unchanged.

### PR draft factual consistency

No contradiction found in the specifically requested **fail-closed dial/admission/provider/runtime** sentences: static token (including empty), query token, wrong mode, explicit protocol selector, non-loopback cleartext, HTTP/stdio/modern refusal, pinned-engine refusal, and provider failure classifications match the admission/openStrict code and scoped tests. The five-code paragraph is read with its preceding provider/configuration exceptions, not as remapping those exceptions to connection-failed.

Two broader claims are contradicted by finding 1:

1. **“Retention ends when the configuration is removed, finally closed, or the framework stops.”** Overwritten failed configurations' private accepted sets survive stop while the framework remains reachable.
2. **“Without credentialRequired (omitted, false, or null), and with no strict configuration in the framework, behaviour is unchanged.”** Output snapshots do match in the tested scenarios, but repeated failed never-strict reconfiguration now retains obsolete configuration objects (8/8 versus 1/8 in the original-base control).

The early 'every other configuration behaves as before' sentence also needs the later mixed-use qualification: non-strict failures intentionally change at the two sinks in a mixed set. That is an accepted owner decision, not an additional implementation finding. No PR has been opened or edited.
