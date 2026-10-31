# AF-scope — frozen-head validation report

**Status: BLOCKED on a confirmed opt-in batch-isolation defect.** All requested matrix cells are complete as observations; the historical 22.23.3 head receipt remains missing. No code changes were made this round.

## Changed

Frozen head: `47f3b4f2195d2ff544815ea29a410c3a335864ba`; clean tree verified before/after gates and probes. Existing local commits, all with the required author/committer and co-author trailer: `50512535778b1749499a09d243bd364b149f5bcd` (API/runtime/docs/changelog), `25b118cf491b2ff78dbe1fab179457663427e411` (tests/frozen fixture), `47f3b4f2195d2ff544815ea29a410c3a335864ba` (remaining descriptor invalidations). `commit-identities.txt` records identities/messages. No new commit, empty commit, source edit, or compiled-code mutation was made under the continuation's explicit head freeze. Builds regenerated ignored artifacts only. No push, merge, dependency/lockfile or typing/C changes.

Base: `29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04`. Frozen contract and fixture were read from `bff8c46e3a4c403f62b738cead317863d43fca9c`, not a moving head. The fixture retains SHA-256 `70a1827c21722b6056ba209928434877f4d4ea729338793c4d95a9e5c5126381`.

API: opt in with `inboundAdmission.registrationScope = {timeoutMs, project}`; `bind(key, registrations?)` receives the read-only view only with that profile. `lookup(channelId)` returns an immutable accepted `{ref, descriptor, scope}` snapshot; `current(ref)` synchronously checks exact issued K, accepted generation and all ancestors. `project(key, candidateRef, detachedDescriptor, signal, view)` supplies private immutable verified scope or returns undefined. Candidate refs are noncurrent until scope validation settles. Independent 1..60000 ms deadline and 64 active validations. No public wire or persisted sidecar.

No dependencies/lockfiles, typing/C code, grants, closed A verdicts, B required `authorize`, or connector-specific grammar changed. No push, release, integration tarball, native execution, activation, or owner decision is claimed. Repository instructions: CONTRIBUTING.md and supplied baseline; supplied conventions/gotchas explicitly absent.

### Semantic correspondence to T1 §4

| Contract item | Implementation / evidence |
| --- | --- |
| Opt-in binder read view; no mutable registry exposure | View has only lookup/current; its source reads accepted sidecars on actual ChannelRegistry entries. No trace/tap registry, no wire tokens. |
| Exact K + accepted generation | Issued frozen runtime refs, exact-object epoch and per-record key checks, authoritative entry identity. Copied/equal objects do not match. |
| Detached descriptors / immutable sidecars | Data-only recursive copies reject getters/custom prototypes/cycles; parent refs preserve only issued runtime identity. |
| Bounded/cancellable projector; noncurrent candidates | Separate deadline/capacity, synchronous invalidation aborts, late results checked against epoch and authoritative record before readiness. Missing/throw/timeout/invalid/overload deny scope without rewriting ordinary registration ACK. |
| Accepted parents, transitive invalidation, cycles | Parent must be an issued current ref in the same service/epoch. Synchronous current traverses exact ancestry and rejects cycles; replacement does not revive descendants. |
| ACK before reconciliation, registration before ingress | Existing ACK ordering unchanged; scope readiness separate. Unknown/pending protected push refused before permissive A and generic lazy path. |
| Capture before A; repeat after A/B awaits | Scope ingress wrapper captures the original ref. Existing lane final checks consume its synchronous check after A and B. Channel-bearing push covered. |
| Frozen B target at send | Existing B target validation additionally retains the first scope ref and checks it on every later authorization/send validation; same raw descriptor reuse cannot renew authority. |
| Permission/native truth separation | AF interprets no parent/native address grammar and grants no read/wake/write/tool access. Host verifier/admission/authorize and adapter own native truth and fresh access, alongside unchanged A/B checks. |
| Sidecars never read from persistence; epoch/removal/replacement refusal | Runtime entry sidecars only; old retained entries cannot be adopted by a new epoch. Tests cover disconnect-equivalent epoch invalidation, remove/re-register, async completion and ancestry. |

### File:line inventory


| Location | Change |
| --- | --- |
| `src/mcpl/registration-view.ts:1-41` | Read-only public types and internal accepted-entry sidecar record. |
| `src/mcpl/registration-view.ts:43-60` | Getter-free data detachment and deep runtime immutability, preserving only AF-issued ref objects. |
| `src/mcpl/registration-view.ts:62-93` | Per-connection service, per-epoch view, exact-key/generation/ancestor synchronous currentness. |
| `src/mcpl/registration-view.ts:94-130` | Accepted candidate issuance, 64-validation cap, independent timeout/cancellation, immutable verified sidecar settlement only on original epoch/entry. |
| `src/mcpl/registration-view.ts:133-150` | Capture a channel ref before A, refuse absent/invalid scope, and recheck original generation after waits. |
| `src/mcpl/inbound-admission.ts:2,24-25` | Import scope service/types; optional second binder argument and opt-in registrationScope config. |
| `src/mcpl/inbound-admission.ts:47-51` | Validate only the added opt-in projector/deadline. Existing off-profile validation text and behavior remain unchanged. |
| `src/mcpl/inbound-admission.ts:99,107,114,123-125` | Add optional service, snapshot opt-in config, invalidate on existing epoch boundary, and issue the view at bind. Off-profile binder is still called with exactly one argument. Existing capture/run/grant/verdict/attestation logic is unchanged. |
| `src/mcpl/server-connection.ts:1,1173-1176` | Add the opt-in scope ingress wrapper before the unchanged B consumer. Existing required ingress checks and ordering are retained. |
| `src/mcpl/channel-registry.ts:1,393` | Internal accepted sidecar type/optional entry field. |
| `src/mcpl/channel-registry.ts:1574,1580-1589` | Invalidate replacement entries; attach opt-in sidecar from actual accepted registry state; internal source lookup for framework plumbing. Off-profile entries gain no runtime sidecar property. |
| `src/mcpl/channel-registry.ts:1688-1689,1738,1781,1783,1800-1801` | Hook accepted register/changed generations and invalidate removed/replaced descriptors. ACK-before-reconcile logic is unchanged. |
| `src/mcpl/channel-registry.ts:2214,2663,2730,4532` | Invalidate identity backfill, server removal, registry shutdown, and inbound-only open-declaration descriptor rewrites. No lazy path can create scope readiness. |
| `src/framework.ts:34943,34945,34951-34956` | Connect the private authoritative source and add frozen scope-ref checks alongside existing B descriptor/key/publish-grant checks. No private registry is passed to host callbacks. |
| `src/index.ts:225-226` | Public read-only API type exports only. |
| `test/registration-view.test.ts:1-346` | Real-registry/framework tests: lifetime, immutability, ordering, bounded failures, post-A/B races, 50 fixture ingress cases, B frozen-send check, remaining descriptor rewrites. |
| `test/fixtures/registration-scope-cases.json:1-1730` | Exact unchanged frozen synthetic fixture, 57 cases; seven explicit native-tool cases remain outside this AF ingress projection. |
| `docs/registration-scope-view.md:1-87` | Chosen API spelling/packaging, readiness/ordering/lifetime and permission boundaries; qualification limits. |
| `changelog.d/registration-scope-view.added.md:1` | Required behavior fragment. |

No edits to RequiredAdmission channel/push/inference handler blocks in channel-registry.ts, push-handler.ts or framework.ts. The only edits to inbound-admission.ts and the server-connection RequiredAdmission block are the additive opt-in items enumerated above. No A/B permission checks or verdict variants were removed or weakened.


**Scope of this round:** evidence/reporting outside the worktree and the two previously unstarted Node 22.12.0 cells only, followed by the two predeclared scoped probes. The per-item batch fix discussed in prior scratch plans was **not applied**. The semantic table above describes implemented mechanisms, not a claim that all qualifying batches work: the capture/recheck row has the isolation gap documented under Unmet Criteria.

## Verification Gates

### Inputs and inherited evidence

Previous evidence directory: `/home/orgasmic/.orgasmic/runs/run-01M67MDC3Y7G9B9R6R58KVBMWD/evidence`. Its final-head mutant evidence, original failed corpus, source pins, reports and full historical gate logs were inspected, not inferred from resuming. `inherited-manifest.json` records SHA-256s of inherited artifacts; `frozen-inputs.sha256` identifies unchanged current source/test/doc inputs. The historical head log, not its truncated sequencer-owner log, contains the final TAP and stage results. It has **no dispatch-gate completion receipt**; it is a historical log observation, not a success according to a receipt. Neither historical matrix cell was rerun.

Both trees use the same installed dependencies from the previous run; no install occurred this round. The inherited `dependencies.json` identifies context-manager 0.24.2 under the existing dependency range. This is not the separate host 0.24.0 old/new-reader qualification.

### Method change

The continuation changed the method **only for the two Node 22.12.0 cells**: sequential base then head, one run each, AF_TEST_CONCURRENCY=8, the installed `node_modules/.runtime/node-v22.12.0-linux-x64/bin`, in separate systemd --user scopes with actual MemoryMax `17179869184` (16 GiB). Inside each scope the whole typecheck/build/npm-test stage command was wrapped by:

```sh
timeout --signal=TERM --kill-after=60s 3000s bash "$ORGASMIC_EVIDENCE_DIR/stages.sh" "$TREE" "$PIN" 2>&1 | head -c 67108864 > "$FULL_LOG"
```

The wrapper retained producer and capture exits separately. The two historical 22.23.3 cells had **no explicit whole-command deadline or log cap** and remain historical observations under that earlier method; the new bound is not retroactively attributed to them. `continuation-plan.md`, `bounded-cell.sh`, `stages.sh` and `probe-scripts.sha256` preserve the policy and commands. Scripts were not changed mid-run. Progress was emitted every 120 seconds to each gate log and surfaced repeatedly while waiting.

Classification rule used in this report: timeout exits 124/137, producer 141/SIGPIPE, capture exit !=0, or log at the 64 MiB cap are **inconclusive** (a timeout is “operator-bounded timeout, inconclusive”), not test failures. None occurred in either new cell.

### Complete matrix

T/B/test are the **individual observed stage exits**. No test failure names occurred in any matrix cell.

| Node/tree | T/B/test exits | Total | Pass | Fail | Skip | Cancelled | Completion evidence |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 22.23.3 base | 0/0/0 | 9767 | 9704 | 0 | 63 | 0 | present |
| 22.23.3 head | 0/0/0 | 9844 | 9781 | 0 | 63 | 0 | missing; log observation only |
| 22.12.0 base | 0/0/0 | 9767 | 9704 | 0 | 63 | 0 | present |
| 22.12.0 head | 0/0/0 | 9844 | 9781 | 0 | 63 | 0 | present |

| New cell | stage_command_exit | log_capture_exit | Gate exit | Full-log bytes | Truncation |
| --- | ---: | ---: | ---: | ---: | --- |
| 22.12.0 base | 0 | 0 | 0 | 4150073 | no |
| 22.12.0 head | 0 | 0 | 0 | 4142228 | no |

Historical base gate exit: **0**, receipt present. Historical head: all three stage exits **0** in the completed log; overall dispatch-gate completion/receipt **missing**, so no receipt-based overall exit is asserted. Producer/capture exits were not separately recorded for historical cells. Exact parsed data and empty failure-name lists: `all-cells.json` and `historical-cells.json`.

Commands for the new cells, each wrapped with `orgasmic dispatch gate bounded-22.12.0-{base,head} --`, were:

```sh
systemd-run --user --scope --unit="$UNIT" -p MemoryMax=16G   env "PATH=$PWD/node_modules/.runtime/node-v22.12.0-linux-x64/bin:$PATH" AF_TEST_CONCURRENCY=8   bash "$ORGASMIC_EVIDENCE_DIR/bounded-cell.sh" "$TREE" "$PIN" "$LABEL"
```

The base tree is `node_modules/.matched-base` at the exact B pin; head is the assigned worktree at the frozen SHA. `stages.sh` checks that SHA, logs the Node/npm/cgroup/limit, and runs `npm run typecheck`, `npm run build`, `npm test` in order, retaining each exit even if a preceding stage failed.

Raw matrix logs:
- 22.23.3 base: [gate-matched-22.23.3-base-01M67MZQWWCP26DBZKZQ6YJY6T.log](/home/orgasmic/.orgasmic/runs/run-01M67MDC3Y7G9B9R6R58KVBMWD/evidence/gate-matched-22.23.3-base-01M67MZQWWCP26DBZKZQ6YJY6T.log)
- 22.23.3 head: [gate-matched-22.23.3-head-01M67PA2X8CXTGJJ9J5F3CHH88.log](/home/orgasmic/.orgasmic/runs/run-01M67MDC3Y7G9B9R6R58KVBMWD/evidence/gate-matched-22.23.3-head-01M67PA2X8CXTGJJ9J5F3CHH88.log)
- 22.12.0 base: [full-22.12.0-base.log](/home/orgasmic/.orgasmic/runs/run-01M67QDRZ11X7TTXYZ7P5VPY9Z/evidence/full-22.12.0-base.log)
- 22.12.0 head: [full-22.12.0-head.log](/home/orgasmic/.orgasmic/runs/run-01M67QDRZ11X7TTXYZ7P5VPY9Z/evidence/full-22.12.0-head.log)
- base completion receipt/progress: [gate-bounded-22.12.0-base-01M67QFXCX3SZ8WNP84B3C8AXH.log](/home/orgasmic/.orgasmic/runs/run-01M67QDRZ11X7TTXYZ7P5VPY9Z/evidence/gate-bounded-22.12.0-base-01M67QFXCX3SZ8WNP84B3C8AXH.log)
- head completion receipt/progress: [gate-bounded-22.12.0-head-01M67RTBR6YGCA7TJBYGGK4FK7.log](/home/orgasmic/.orgasmic/runs/run-01M67QDRZ11X7TTXYZ7P5VPY9Z/evidence/gate-bounded-22.12.0-head-01M67RTBR6YGCA7TJBYGGK4FK7.log)

### Mutants (unchanged final-head inherited evidence)

All mutant script, JSON and raw-log filenames in this section refer to the previous evidence directory stated above.


`mutants.py` patches compiled registration-view.js for one named test at a time and restores it in finally; no mutant entered a commit. `mutants.json` retains argv, per-case counts and raw logs. Final-head mutation gate: `registration-mutants-complete`, harness exit 0. Each mutant process exits **1**, total **1**, pass **0**, fail **1**, skipped **0**, cancelled **0**.

| Mutant | Named discriminating test |
| --- | --- |
| Drop view epoch/current-key checks (including per-record key) | `view epoch invalidation is synchronous, including a newly bound view over retained entries` |
| Return the mutable descriptor reference rather than a detached snapshot | `view returns detached deeply immutable descriptors and sidecars, not mutable references` |
| Refresh from current lookup after admission instead of retaining captured generation | `real framework push/event: captured generation rechecked after admission await` |
| Permit missing captured refs, enabling the existing generic push lazy-registration path | `real framework protected push never lazy-registers, even with permissive admission` |

Earlier draft/initial-head mutant gates also killed all four; their logs remain `mutants-owner.log`, `mutants-final-owner.log`. The final-head gate is `mutants-complete-owner.log` with its reusable receipt. No full-suite cell has been repeated.


The final-head mutant gate log starts at the same frozen SHA and a clean tree; its source inputs remain unchanged. No compiled mutation probes were rerun under the no-code-changes continuation. Inherited final gate: [gate-registration-mutants-complete-01M67P95TVMCCFFQZAW857QJ64.log](/home/orgasmic/.orgasmic/runs/run-01M67MDC3Y7G9B9R6R58KVBMWD/evidence/gate-registration-mutants-complete-01M67P95TVMCCFFQZAW857QJ64.log).

### Profile-off differential

The original `profile-off-corpus` experiment remains **failed**: base child exit 0, head child exit 0, cmp exit 1. Its complete original JSONs and `profile-off-first.diff` remain in the previous evidence directory. Differences include independently allocated ports/persisted endpoint-binding fingerprints, unseeded Math.random inference IDs, and different unconfigured automatic-turn batching/deferred-write histories. This failure is not erased, called environmental, or relabelled a parity pass.

The distinct serialized experiment was predeclared before execution in the earlier round (`profile-off-serialized-plan.md`): equal fixed endpoint ports 45071–45073, deterministic wall time/UUID/Math.random, and drain after each request, with no output-field deletion or normalization. It ran once after the new matrix. All three exits were **0** (base child/head child/cmp); gate exit **0**. It compares complete response/store/offer/publication JSON for three profiles: no binder, ordinary A only without scope, and ordinary A+B without scope. **21 RPCs, 26 logical stored rows, 28,865 bytes per output**, byte-identical SHA-256:

`ddc883dd5bb2bf754135bc20fc1841cdc7f62238161e1c5ab84e04ab1e716ff6`

Outputs: `profile-off-serialized-base.json`, `profile-off-serialized-head.json`; code: `profile-off-serialized.mjs`; command uses `orgasmic dispatch gate profile-off-serialized -- systemd-run --user --scope ... -p MemoryMax=16G timeout --signal=TERM --kill-after=60s 3000s bash profile-off-serialized-gate.sh`. Both JSON artifacts are complete logical wire/store corpora, not physical Chronicle-file byte comparisons or a proof of concurrent scheduling equivalence. Gate log: [gate-profile-off-serialized-01M67T43YB1AJ9GJ6K3JBZKVR6.log](/home/orgasmic/.orgasmic/runs/run-01M67QDRZ11X7TTXYZ7P5VPY9Z/evidence/gate-profile-off-serialized-01M67T43YB1AJ9GJ6K3JBZKVR6.log).

### Real-path batch-isolation probe

Previously prepared `batch-preprobe.mjs` ran once, without source mutation, through the real WebSocket → framework → ChannelRegistry path on Node 22.12.0, bounded by TERM at 120s/KILL grace 60s in a 16 GiB user scope:

```sh
orgasmic dispatch gate batch-isolation-probe -- systemd-run --user --scope   --unit="$UNIT" -p MemoryMax=16G timeout --signal=TERM --kill-after=60s 120s   "$PWD/node_modules/.runtime/node-v22.12.0-linux-x64/bin/node" "$ORGASMIC_EVIDENCE_DIR/batch-preprobe.mjs"
```

**Exit 1, assertion failure**, not timeout/inconclusive. It is not a TAP run (total/pass/fail/skip/cancelled N/A). Assertion name: `an invalidated sibling must not poison fresh unrelated registration`. Two accepted registrations are initially current. During A admission of m1, its own registration is removed. m1 correctly refuses as stale; m2 on the unrelated, still-current registration must remain eligible. Actual wire result:

```json
{"results":[{"messageId":"m1","accepted":false,"reason":"admission_stale"},{"messageId":"m2","accepted":false,"reason":"admission_stale"}]}
```

The second result is the confirmed defect. `src/mcpl/registration-view.ts:135-146` retains one captured ref in a closure shared by the batch; `src/mcpl/channel-registry.ts:1961` checks it before m2's `admit` can capture m2's ref. No grant, epoch, verdict, or sidecar weakening is proposed as a workaround. Gate log: [gate-batch-isolation-probe-01M67T4VRKE34D56MPYSY5C32Q.log](/home/orgasmic/.orgasmic/runs/run-01M67QDRZ11X7TTXYZ7P5VPY9Z/evidence/gate-batch-isolation-probe-01M67T4VRKE34D56MPYSY5C32Q.log).

### Surviving-process reconciliation

After the two new cells, and again after both probes, scopes/cgroups and process start identities were reconciled read-only. `process-baseline-base.txt`, `process-audit-base-running.json`, `process-audit-head-running.json`, and `tracked-processes.json` retain cgroup membership, PID/PPID/PGID/session and kernel start ticks (plus observed activation/start times). `process-audit-after-set.json` and `process-audit-final.json` show **zero matching surviving processes, zero read errors**; both gate scopes and both probe scopes are inactive with no remaining control group. No surviving fixtures were killed. This is a scoped/tracked-identity audit, not a claim that a timeout alone proves cleanup or that every unrelated process on the host was inspected as this run's child.

## Unmet Criteria

1. **Confirmed false refusal of valid unrelated work within an opt-in incoming batch.** Frozen head is not ready for acceptance despite green full suites and the serialized profile-off match. Per-item currentness must not use a previous sibling's captured generation before capturing the new item. This requires a source fix and focused batch-isolation regression tests, prohibited by this continuation's explicit **NO CODE CHANGES** instruction. The scratch follow-up plan was not applied.
2. The historical 22.23.3 head dispatch-gate receipt is missing. Its complete stage/TAP log is retained as observation only, exactly as instructed; it was not rerun and no receipt was fabricated. This is an evidence limitation, not a claim that its tests failed.

No T1 item was found impossible because of the original forbidden API/permission/wire boundaries, so no BLOCKED-FOR-SCOPE architectural item is claimed. The blocker is the concrete implementation defect at the mandated frozen head, not an owner-policy decision or a request to relax A/B.

## Residual Risk

The existing 77 added tests do not cover the failing shared-batch case; broad green suites therefore do not establish full acceptance. No code fix or new committed regression test was permitted this round. A future authorized fix should preserve every original A/B check, make scoped capture independent for each item, cover both B-off and B-on batches, and requalify the changed head without retrying unchanged source until green.

Estimated remaining AF work: **1–2 engineer-hours** for the bounded per-item fix and focused regressions, then roughly **45–60 minutes elapsed** for final-head gates on both Nodes and **1–2 hours** bounded review. Composed A/B/D artifact rebuild/manifest/host repin is separate integration work (roughly **2–4 hours**, subject to the supplied integration inputs); no dependency/lock changes or release artifact were produced here. T2–T5 native/host qualification remains separate.

Synthetic adapter/verifier facts are not native truth or runtime authority. The 50 fixture ingress cases exercise store/wake through real framework/registry; the seven explicit native-tool cases and full native send-time outcomes are not qualified by this AF-only implementation. Authentic producer attestation, dynamic host selectors, native access/root validation, exact delivery, store migration, live activation and recovery remain unclaimed. The serialized parity corpus is finite and does not remove the explicit failed first concurrent/uncontrolled witness.
