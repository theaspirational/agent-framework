# TASK-S4Q8F — LOW follow-up

## Changed

Task constraints from the task operator/programme qualifier, not decisions by the owner. Started at clean `29b5ebf33ca5d785564cdd85c4609543d8202d57`; final committed head **`a0970645d403a7a76449221fc36f240a7aa2464b`**. Local commit has the required Vasyl author/committer and GPT-6.1-Sol trailer (`commit-identity.txt`). No push/merge, install, dependency/lockfile, wire/schema, grants, public type/export, RefusalCode, typing/C/D or A/B implementation changes.

Read review `/srv/review-drop/TASK-S4Q8F-FIX3-REVIEW.md` in full, SHA256 **`055787974ada7f413259872e548de6bc2ec7de5bfaa8cb9c83e824725fef453f`**; preserved as `inherited-review.md`. Its r3 APPROVE is inherited review context, not a new-head test pass. The full earlier implementation report and its historical failures/declaration deltas remain in `run-01M6832514GX6VMH3AZ46W99KS/evidence/report.md`.

### Exact source delta / file:line

Full diff `changes.diff`.

| File:line | Change |
| --- | --- |
| `src/mcpl/registration-ingress.ts:23-27` | `missing()` now returns a frozen self-forking refusal. Direct `denied.forItem(anything)` returns that same refusal, same key, `admission_missing`, store=false/mayWake=false. No context/authority issued, no outer accessed, no host/B/effects. |
| `test/registration-fork-outer.test.ts:137-159` | Two real WebSocket→framework→ChannelRegistry tests, B off/on. Invalid call creates refusal, direct nested calls with bare/issued outers return identical refusal; exact check/verdict/result/messageId; zero A calls, B consumption, stored body, wake and publication. |
| `docs/registration-scope-view.md:85-92` | A guard-adding wrapper MUST issue through the internal composer. Forwarding (including an arrow) does not carry its own guard. Exact invariant: a fork is not weaker than the issued context it names. Clarifies helper rejection versus direct forwarding. No LOW-1 code change. |
| `docs/registration-scope-view.md:99-102` | Documents unreachable bare-capture/protected-key composer arm: admission_missing, not queue admission_not_ready; server-connection.ts:1156-1162 refuses earlier. No new-LOW-3 code change. |
| `changelog.d/registration-refusal-fork.added.md:1` | Scoped added fragment. |

The original **old LOW-3** (white-box-only epoch provenance) is untouched and OPEN. Its batch test, framework wrappers, inbound-admission and B files are byte-unchanged in this delta. Self-reference in the refusal is local/collectible; no new collection, registry or lifetime retention path was added. Existing weak binding/issued-context enforcement is unchanged.

All 168 emitted `dist/src/**/*.d.ts` hashes are **byte-identical** before/after (including internal declarations and CLI entry points): `declarations-{before,after,final}.sha256`. All 108 actual runtime root names also compare byte-identical: `exports-{before,after,final}.json`. No public type/export or RefusalCode change requiring STOP was necessary. Earlier B→c09 and c09→r3 declaration deltas remain exactly the inherited report's separate deltas, not collapsed into a one-member claim relative to B.

### T1 §4 correspondence (unchanged contract)

| Fixed axis | This round |
| --- | --- |
| Epoch/accepted generation/read-only view | Unchanged registration view/registry/lifecycle code; same epoch captured for batch, per-item ref capture and synchronous rechecks. Existing real-registry tests rerun. |
| Ordering/permissions | No A/B/grant/verdict/sidecar changes. Refusal remains false-store/false-wake before host admission/consumption/effects; direct forks cannot weaken it. |
| Opt-in/off | Only already-failed scoped ingress gains an existing optional factory; off profile same fixed-hash serialized corpus. No new wire field, lazy fallback, native grammar or mutable registry exposure. |
| Supported composition | Existing issued-context allow/deny suite rerun (126 fresh effect rows saved as receiver-argument-effects.json); guard-adding wrappers must compose, not merely forward. Old LOW-3 remains open. |

## Verification Gates

### Predeclared method and commands

`gate-plan.md` fixes this head's qualification set. Every behavioral/build gate uses `orgasmic dispatch gate NAME -- systemd-run --user --scope -p MemoryMax=16G ...` and a whole-command `timeout --signal=TERM --kill-after=60s 3000s`, full log cap67108864bytes via `head -c`, separate producer/capture PIPESTATUS. Actual full scope memory.max17179869184. 124/137→operator-bounded timeout, INCONCLUSIVE;141, at-cap or capture!=0→INCONCLUSIVE. No retries. Observed line/byte progress every120s (≤4min). Bounded wrappers, exact scripts and raw receipts retained.

- Development: absolute22.23.3 Node SHA/version preflight before npm; typecheck/build.
- Focused: `focused.sh`, absolute22.23.3 Node, `--import ./dist/test/helpers/force-exit-blocking-stdout.js --test --test-force-exit --test-concurrency=8 --test-timeout=120000`, three registration files plus unchanged `mcpl-required-admission`, `mcpl-required-inference-admission`, `mcpl-required-push-admission`, `reply-admission`. **219total/219pass/0fail/0skip/0cancel**, no failure names;149 registration +70 A/B. A/B test inputs unchanged against B. Declaration and runtime export comparisons also exit0.
- Mutants: `mutants.py`; **3/3 killed**, every child **exit1,1total/0pass/1fail/0skip/0cancel**, exact named failures below. Five ignored compiled files restored byte-for-byte in finally (`mutant-restoration.json`), verified again after builds. No source mutation committed.
- Profile-off: `AF_CORPUS_PORT=45071 ... profile-off-serialized-gate.sh`, B/head/cmp exits0/0/0, complete logical corpus28865bytes each (3profiles/21RPC/26logical rows), SHA **`ddc883dd5bb2bf754135bc20fc1841cdc7f62238161e1c5ab84e04ab1e716ff6`**. Fixed ports/clock/UUID/random, serialized per-request drain, no field stripping. Not physical store-file/all-schedule proof.
- Full cells: `run-head-cells.sh` fixes sequential22.23.3 then22.12.0, one fresh head run each, AF_TEST_CONCURRENCY8; absolute executable SHA/version before any npm. `stages.sh`: npm run typecheck, npm run build, npm test with unchanged package flags. Checks **available disk≥21474836480bytes (20GiB) before EACH cell**, both sequencer and scoped stage; exact measurements below.
- Final metadata: `final-metadata.sh` verifies clean source/base pins, declaration/export identity, unchanged A/B/RefusalCode/old LOW-3 files, actual closure, base receipt log hashes, restored compiled outputs and corpus.

| Mutant | Exact killing test |
| --- | --- |
| missing-without-forItem | `refusal ingress B=false: direct nested forks remain admission_missing before effects` |
| blanket-refusal (r3 key mutant rerun) | `issued fork B=false: helper allow and deny controls before effects` |
| unissued-outer-structural-fallback (r3 key mutant rerun) | `issued fork B=false: bare capture explicit argument allow and deny controls before effects` |

Exact patches/argv/counts: `mutants.json`, `mutant-*.log`. The new mutant deletes only the refusal's forItem and is killed by the direct-call TypeError, not cancellation/timeout. The two rerun r3 mutants demonstrate allowing controls still work and unissued/weak outer rejection remains enforced. The remaining r3 mutant results remain inherited evidence, not silently requalified at this head.

### B reuse / identical bindings

Only B source29edcf8b is **reused**, not r3 head passes. Original reusable B receipts/full logs are in `run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence`; exact full-log hashes reverified, receipts inspected/present (`reused-base-cells.json`, final metadata). Same bindings as r3:

| Binding | Reused B | Current paired head |
| --- | --- | --- |
| B source/cwd | Clean29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04, worktree node_modules/.matched-base | Same clean pin/cwd, separate changed head |
| Node22.23.3 | `/opt/node-v22.23.3-linux-x64/bin/node`, SHA fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48 | Same absolute executable/version/hash |
| Node22.12.0 | `/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-s4q8f/node_modules/.runtime/node-v22.12.0-linux-x64/bin/node`, SHA177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9 | Same absolute executable/version/hash |
| package.json | SHA e149f0a8943238a62ac82fa561ed1732187815d9e4e60f68c76f47dc8b726bc2 | Same base/head manifest |
| Physical dependency closure | SHA91c5fd4fc5a930b841480847fb8c54943432aa9f1fcfc8e4ff28c068ce751afd,7332 records | Same actual recomputed file/symlink inventory, excludes runtime/base directories |
| Settings | AF_TEST_CONCURRENCY8; same npm stages/test flags,16GiB scope,3000s+60s,64MiB cap/PIPESTATUS | Identical; added disk-reserve check only fails before work, never relaxes a bound |

Base node_modules is symlinked to the same physical install, **not independent resolution**. No repository lockfile; installed `node_modules/.package-lock.json` is shared metadata only (SHA034f98722b1c33ec4901139cca713e96a63dcedaedbd775260598535a6e076ca), not independent lock evidence. npm-ls remains base exit1/SHA974e3bcfc2d3a01d06f66b219dd303580cb69cdd13ce74487c60257b788d4535 versus head exit0/SHA3c34f4248cd25631eae8af813a21972c32225cda9fab8b8ebea1cf9c5ec69975; not matching hashes, no reinstall. Earlier reviewer symlink/Arborist resolution-context explanation and identical reachable versions remain inherited, not a newly fixed diagnostic.

A preliminary **ungated read-only metadata command** stopped at cmp exit2 because the inherited expected inventory hash had been copied but its text inventory had not (`bindings-before.log`). Base actual inventory was already computed as91c5fd4f…, and the scoped head stage independently recomputed the same closure before npm; the actual text inventory was then generated and compared with the inherited expected hash (`closure-current-verification.sha256`). Corrected complete final metadata gate is separate; no behavioral/full cell rerun or failed test was hidden.

### Exact full-cell outcomes

Counts order: total/pass/fail/skip/cancelled. B rows are **reused**, not rerun. New head rows each fresh once, sequentially. Failure-name lists empty. Exact commands/log hashes/receipts in matrix-results.json; all producer/capture exits separate. No timeout/SIGPIPE/cap/capture error.

| Cell | Use | Typecheck/build/test | Gate | Producer/capture | Total/pass/fail/skip/cancelled | Bytes/cap |
| --- | --- | --- | ---: | --- | --- | --- |
| 22.23.3-base | **reused B29edcf8b** | 0/0/0 | 0 | 0/0 | 9767/9704/0/63/0 | 4316588/no |
| 22.23.3-head | fresh a0970645 | 0/0/0 | 0 | 0/0 | 9916/9853/0/63/0 | 4365183/no |
| 22.12.0-base | **reused B29edcf8b** | 0/0/0 | 0 | 0/0 | 9767/9704/0/63/0 | 4152093/no |
| 22.12.0-head | fresh a0970645 | 0/0/0 | 0 | 0/0 | 9916/9853/0/63/0 | 4197386/no |

- 22.23.3-base: full log `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/full-22.23.3-base.log`; receipt `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/gate-fix-22.23.3-base-01M67V69RWMFMJPJCWCS5NJ654.log`.
- 22.12.0-base: full log `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/full-22.12.0-base.log`; receipt `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/gate-fix-22.12.0-base-01M67XCYYEBRAJKWKAV6APD6PV.log`.
- 22.23.3-head: full log `/home/orgasmic/.orgasmic/runs/run-01M685CVTMHP3HT6DNP8CTZVCM/evidence/full-22.23.3-head.log`; receipt `/home/orgasmic/.orgasmic/runs/run-01M685CVTMHP3HT6DNP8CTZVCM/evidence/gate-low-22.23.3-head-01M685J3T8GRTWVVSQ94RSAAYN.log`.
- 22.12.0-head: full log `/home/orgasmic/.orgasmic/runs/run-01M685CVTMHP3HT6DNP8CTZVCM/evidence/full-22.12.0-head.log`; receipt `/home/orgasmic/.orgasmic/runs/run-01M685CVTMHP3HT6DNP8CTZVCM/evidence/gate-low-22.12.0-head-01M685S8HVK2QXAMXDQJ2YE6EV.log`.

**Disk reserve before full cells** (bytes available; required21474836480):
- 22.23.3: 25654792192bytes, reserve met.
- 22.12.0: 25629835264bytes, reserve met.

### Supplemental gate catalogue

All cap results no. N/A is non-TAP, not an assumed test pass. Full stdout/stderr: full-LABEL.log; exact producer/capture: status-LABEL.txt. No failure names in these gates (mutant children intentionally fail their named tests as enumerated above).

| Gate | Gate exit | Producer/capture | Total/pass/fail/skip/cancelled | Bytes | Receipt |
| --- | ---: | --- | --- | ---: | --- |
| low-development | 0 | 0/0 | N/A | 513 | `gate-low-development-01M685DX96EACA8733MX3DMA68.log` |
| low-focused | 0 | 0/0 | 219/219/0/0/0 | 105018 | `gate-low-focused-01M685G8YXWR4DXPJVYCSE2ZKZ.log` |
| low-mutants | 0 | 0/0 | N/A | 2259 | `gate-low-mutants-01M685GYMJW3T5PXF6RZFEAHJR.log` |
| low-profile-off | 0 | 0/0 | N/A | 3870 | `gate-low-profile-off-01M685HK2T3DXS2MS2WYCJ8X82.log` |
| low-final-metadata | 0 | 0/0 | N/A | 1760 | `gate-low-final-metadata-01M6861AGZ8CKBNA1FDMMK33ZC.log` |

Development receipt is dirty-tree precommit build evidence only; final fresh head cells provide committed-head typecheck/build/test. No behavioral gate was retried or failed in this round. The preliminary metadata cmp failure remains explicit above, not treated as a pass.

### Inherited observations / failures retained

The approved r3 head29b5ebf3 had both full cells9914/9851/0fail/63skip/0cancel, stage0/0/0 and complete receipts; these are historical, NOT new-head qualification. r3 focused217/217,19 mutants and its raw-arrow probes remain inherited context only; this round reruns219 focused tests and only the three requested mutants. Earlier T1 semantics, all receiver tables and separate actual B→c09 / c09→r3 declaration diffs remain in the inherited report; this round's declaration delta relative to29b5ebf3 is empty.

Older failures stay separate in that report and their original evidence: first uncontrolled profile-off differential children0/0,cmp1; development epoch fixture run18total/16pass/1fail/0skip/1cancel (B=false real epoch-change test condition-not-settled60s, then filetimeout120s); r3 invalid inference-policy development input68total/66pass/2fail/0skip/0cancel; r3 missing-port corpus invocation children1/1 before fixtures (RangeError). None is overwritten by later serialized parity. The old47f3b4f2 Node22.23.3 head's complete stage/TAP log0/0/0,9844/9781/0/63/0 still has **no completion receipt**; no receipt-based overall exit is asserted or reused. Two original22.23.3 cells had no whole-command bound; the continuation method change is not applied retroactively. Current reused B receipts are from the later fully bounded pair, not those historical incomplete observations.

### Surviving processes

Read-only reconciliation by this round's owned scopes/cgroups plus tracked PID/kernel start ticks, parent/PGID/session and activation times: during-22-23, during-22-12, after-set, final JSONs and tracked-processes.json. **After set and after metadata: zero matching live processes, zero read errors.** All own scopes inactive/no control group. No fixture survivors killed; only the wrapper's own progress sleep is reaped. This is a scoped/tracked-identity observation, not timeout inference or a claim about unrelated processes.

## Unmet Criteria

None for this LOW round. All three requested findings addressed (LOW-1/docs, LOW-2/self-forking refusal+test/mutant, new LOW-3/docs); unchanged API/RefusalCode/A/B verified, three mutants killed with byte-restoration, profile-off fixed hash, both fresh full head cells and20GiB reserve checks complete. Base explicitly reused under identical bindings. No STOP-triggering public type/export/RefusalCode change.

## Residual Risk

- The **old LOW-3 epoch-provenance observability gap remains OPEN**, intentionally untouched; white-box key association is not black-box proof for items that never reach A.
- A wrapper's direct forwarder does not carry its own unissued guard. The enforced invariant is no weaker than the issued context named; internal composer is required to add a guard. No JavaScript sandbox/trusted-internals guarantee claimed.
- Unreachable protected bare-capture fail-closed arm still returns admission_missing rather than queue admission_not_ready; documented, not a code change. Earlier transport refusal makes the production arm unreachable.
- Base/head share physical dependency bytes, not independent installs; npm-ls diagnostic asymmetry remains explicit. Finite synthetic cases and serialized logical parity do not prove native truth, every schedule or physical store-file equality. Historical missing receipt/failures remain preserved.

Remaining implementation/qualification under this brief: **0**. Bounded LOW-delta review estimate **0.25–0.5 engineer-hour**; old LOW-3 and host/native integration qualification remain separate. Local commit only; no push, land/merge, release, repin or activation.
