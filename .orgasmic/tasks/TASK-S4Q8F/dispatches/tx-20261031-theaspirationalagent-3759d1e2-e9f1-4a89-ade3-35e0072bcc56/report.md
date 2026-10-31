# S4Q8F fix round 2 — replacement coverage and constructed fork safety

## Changed

Starting head `39c76401f1be9191e5f62f66b497828d4f30fd56`; final qualification head **`c09aca307a6f08ad839e7cd592632d35fc899920`**. Three local commits, required Vasyl author/committer and GPT-6.1-Sol co-author trailer (`commit-identities.txt`):
- `fbcb976a`: initial naming-only hardening allowed by the initial brief; superseded by the later construction requirement, not the final solution.
- `c66c0367`: ready/pending replacement regressions, exact refusal reasons and documentation.
- `c09aca30`: receiver-aware `forItem` with outer checks **by construction**, including B forwarding and direct-call tests. No unchecked factory remains in the final API.

No push, merge, dependencies/install, repository lockfile, wire/schema, typing/C, grants or closed-verdict change. Existing feature/fix changelog fragments remain accurate. Builds regenerated ignored outputs only. No ChannelRegistry, framework RequiredAdmission handler block, server-connection or RequiredAdmission implementation body changed this round.

### Final API and semantics

`forItem(this: RequiredIngress)` is a method on the opt-in runtime receipt. It captures the **calling receiver**, including framework queue/connection wrappers, and composes `outer.check() ?? originalAdmission.check()` into the new fork's underlying admission. The fork's existing scope check therefore includes those outer checks before A, after A, before B consumption and at subsequent final checks. `withReplyConsumer` forwards the calling receiver with `.call(this)` and retains the original consumer, signal and diagnostic connection. The convenience helper now delegates; safety no longer depends on using it. The original batch key/view is retained, never freshly captured per item. Off-profile/no-factory helper returns exactly its input, including undefined.

The read-only view/projector/binder API itself is unchanged: opt-in `registrationScope`, `bind(key, view?)`, immutable accepted `lookup(id)` and synchronous `current(ref)`. Host observations in the new test use each real `AdmissionInput.item.channelId` to look up its ref in the bound view; no registration-ref field was added to AdmissionInput or the wire.

### Diff file:line (39c76401 → final head)

Full patch: `changes.diff`.

| File:line | Change |
| --- | --- |
| `src/mcpl/inbound-admission.ts:94-95` | Receiver-typed factory declaration and construction guarantee comment only. |
| `src/mcpl/registration-view.ts:139-144,161` | Factory composes caller outer checks into the fork's admission; helper delegates without a separate required composition step. |
| `src/mcpl/reply-admission.ts:31-33` | Receiver-preserving factory method through B; all existing consumption/sidecar/error logic retained. |
| `test/registration-batch-scope.test.ts:5-6,18-20,22,25,29,39` | Import helpers/types; configurable synthetic projector and per-input host ref observations. |
| `test/registration-batch-scope.test.ts:43-49,59-61` | Exact shape-specific reason assertions. Same-registration removal explicitly names §14.5 unknown-channel refusal of m2, not scope evidence. |
| `test/registration-batch-scope.test.ts:70-104` | Four real WebSocket→framework→ChannelRegistry tests: B off/on × ready/pending retargeting update. |
| `test/registration-batch-scope.test.ts:139-173` | Direct reachable-fork calls, without helper, exercise queue and foreign-connection checks before/after awaits, including B; off-profile identity and undefined arm. |
| `test/registration-batch-scope.test.ts:186` | Existing epoch-test observation preserves method receiver when instrumenting forks. |
| `docs/registration-scope-view.md:74-75` | One replacement corollary sentence: later same-channel items use the ready new generation; pending scope refuses before A. |

### T1 §4 correspondence / exact controls

The original frozen contract/fixture remain unchanged; fixture SHA `70a1827c21722b6056ba209928434877f4d4ea729338793c4d95a9e5c5126381`. The real registry remains authoritative; no mutable/private registry exposure, tap registry, native grammar interpretation, new wire authority, permission relaxation or lazy fallback.

| Axis | Control / evidence |
| --- | --- |
| Original transport epoch for all items | Same captured admission/key/view in every factory; existing reconnect tests rerun. No current-epoch read per item. |
| Per-item accepted generation | Non-removing `channels/changed updated` changes target in m1 admission. Ready case: m1 `admission_stale`; m2 accepted and host observes the new ref, distinct from m1's old ref. |
| Pending replacement scope | Entry remains present, candidate scope deliberately unresolved: both results `admission_stale`; only m1 reaches A, no m2 body/wake/publication. Scope later settles to the replacement ref. This is readiness refusal, not §14.5 removal. |
| Same-registration removal | m1 `admission_stale`; m2 exact `unknown channel "topic/one" — register it first (§14.5)`. Does not claim to discriminate the scope mechanism for m2. Other stale shapes assert `admission_stale` exactly; accepted shapes assert no reason. |
| Outer/own check composition | Direct method calls carry queue→`admission_not_ready` and foreign connection→`admission_stale` both before and after awaits; no host call/B consumption on refusal. Original own-ref, epoch, grants and target checks retained. |
| A/B authority and ordering | No A/B check removed. Existing admission/grant/verdict/sidecar code unchanged. B retains consumer/signal/diagnostic connection. Registration-before-ingress and no-lazy tests rerun. |
| Immutable lifetime and permission separation | Existing epoch, captured-generation, immutability, ancestry/lifecycle and frozen-send tests rerun. View identity is not read/wake/write/tool authority; native truth remains host/adapter responsibility. |
| Opt-out | Identity return when no factory and complete serialized logical corpus unchanged against B. |

## Verification Gates

### Inputs / inherited evidence

Read the review in full: `/srv/review-drop/TASK-S4Q8F-BATCHFIX-REVIEW.md`, verified SHA `79a68ee836d44495d75b70a6e558b3f8fc2a1fa0c72127de6249206e254d4425`, copied as `inherited-review.md`. Read its `npm-ls-explanation.md`, both probe scripts, mutant script and all four TAP logs; fully parsed all five raw JSON artifacts and compared entire reachable dependency sets. Hashes/inspection: `review-probes-inspection.json`; appendix copied as `inherited-npm-ls-explanation.md`. Reviewer evidence root: `/home/orgasmic/.orgasmic/runs/run-01M67ZX4GW8QKMHB0H22XQ7ARE/evidence`.

Prior implementation/qualification evidence: `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence`. Its **two B cells alone are reused**, under the identical bindings table below. Its head/focused/mutant/parity receipts do not qualify this changed head. Earlier reports remain historical evidence, not implied new passes.

### Preprobe, development and focused runs

Before source edits, the correctly configured real-path probe at unchanged `39c76401` confirmed both expected replacement controls: ready m2 accepted/new host ref; pending m2 `admission_stale`/not passed to A. No unexpected false pass/refusal requiring a decision was observed.

An initial probe setup failed **exit 1**, producer/capture **1/0**, no truncation, non-TAP counts N/A: it omitted mandatory `isReplyIntent`, so connection config was rejected and attempting register produced `TypeError: Cannot read properties of undefined (reading 'send')`. It gave no behavioral verdict. Initial script/log preserved as `replacement-preprobe-initial.mjs`, `full-replacement-preprobe.log`; corrected-input probe is separate (`replacement-preprobe.mjs`, `full-replacement-preprobe-configured.log`), exit **0**, producer/capture **0/0**, no truncation. No unchanged failed command was rerun for green; the mandatory input was corrected before production edits.

Both development build gates exited **0**, counts N/A, producer/capture 0/0, no truncation; dirty-tree receipts explicitly are not final qualification: `replacement-development-build`, `construction-development-build`. Logs: `full-development-build.log`, `full-construction-build.log`.

Interim naming-only head `c66c0367`: `replacement-focused` exited **0**, **99 total / 99 pass / 0 fail / 0 skip / 0 cancelled**, no failure names; not reused after the binding construction clarification. Final head: `construction-focused` exited **0**, same **99/99/0/0/0**, no failure names, producer/capture 0/0, no truncation. This comprises 77 existing scope tests + 22 batch tests; four ready/pending real-path tests are new. Direct-call unit test uses no helper. All live incoming batch witnesses use real loopback WebSocket→framework→ChannelRegistry.

Focused command (gate→16 GiB scope→bounded-command.sh):
```sh
/opt/node-v22.23.3-linux-x64/bin/node \
 --import ./dist/test/helpers/force-exit-blocking-stdout.js \
 --test --test-force-exit --test-timeout=120000 \
 dist/test/registration-batch-scope.test.js dist/test/registration-view.test.js
```
Receipts: `gate-replacement-focused-01M680Y5MF6Q5EJNSDM4ASPFVN.log` (interim), `gate-construction-focused-01M6815T1MHJ427JYEGA476FBN.log` (final). Raw TAP: `full-construction-focused.log`.

### Mutants

Final-head `construction-mutants` harness exit **0**. Ten mutants killed; every child exit **1**, **1 total / 0 pass / 1 fail / 0 skip / 0 cancelled**, with its named failure. Three compiled files byte-restored in finally before corpus/full gates. No mutant entered source/a commit. Exact patches/argv/counts/names: `mutants.py`, `mutants.json`, `mutant-*.log`; receipt `gate-construction-mutants-01M6817S86K1MS4NG5DX3SP9X6.log`.

| Mutant | Named discriminating test |
| --- | --- |
| Shared ref closure | `batch preprobe: an invalidated sibling must not poison fresh unrelated registration` |
| Drop epoch/current-key checks | `view epoch invalidation is synchronous` |
| Mutable descriptor reference | `view returns detached deeply immutable descriptors and sidecars` |
| Refresh current instead of captured generation | `real framework push/event: captured generation rechecked after admission await` |
| Lazy missing-ref fallback | `real framework protected push never lazy-registers` |
| Per-item epoch refresh (other outer guards retained) | `scope batch B=false: real epoch change refuses all old items and never reads a new key per item` |
| Pin first same-channel generation across forks | `scope batch B=false: same-channel updated replacement ready scope admits the new generation` |
| Treat unready scope as current | `scope batch B=false: same-channel updated replacement pending scope refuses before A` |
| Drop outer composition from factory | `direct per-item fork retains outer queue and connection checks before and after awaits, including B` |
| Lose calling receiver in B factory | Same direct-call test, B iteration |

**LOW-3 remains a documented limit, not a new production-observable claim:** per-item-epoch mutant is killed only by the test instrumentation's exact fork-key association assertion (`each item must retain the transport-event key`). Both old items still visibly refuse `admission_stale`, with no store/publication, because the retained outer stale guard independently blocks them. The new mutant preserves that guard by construction as well, so it isolates refreshing the epoch rather than also removing composition. For items that actually reach A, real-path host `input.connection` assertions cover the key. No new claim is made for the never-reaches-A observability gap.

### Profile-off differential and preserved failures

Final-head `construction-profile-off` exited **0**; base/head/cmp exits **0/0/0**, producer/capture **0/0**, no truncation. Same fixed ports 45071–45073, deterministic clock/UUID/random and serialized per-request drain, no output-field stripping: **28,865 bytes per output**, 3 opt-out profiles / 21 RPCs / 26 logical rows, complete wire-response/store/offer/publication JSON SHA:

`ddc883dd5bb2bf754135bc20fc1841cdc7f62238161e1c5ab84e04ab1e716ff6`

Artifacts: `profile-off-serialized-{base,head}.json`, `profile-off-serialized.mjs`, `profile-off-serialized-gate.sh`, `full-profile-off.log`; receipt `gate-construction-profile-off-01M681942RPQ9TMWTYV93A0PP6.log`.

Earlier failed evidence remains separate and failed:
- First uncontrolled differential: base/head child exits 0/0, cmp **1**, counts N/A; independently allocated endpoints/random IDs and different unconfigured turn/deferred-write schedules. Original JSONs and `profile-off-first.diff`: `/home/orgasmic/.orgasmic/runs/run-01M67MDC3Y7G9B9R6R58KVBMWD/evidence`. Neither later serialized comparison erases it or claims all concurrent schedules/physical store-file parity.
- Earlier development reconnect-test failure: `batch-dev.log` in the prior implementation evidence, exit **1**, **18 total / 16 pass / 1 fail / 0 skip / 1 cancelled**. Named `scope batch B=false: real epoch change refuses all old items and never reads a new key per item` test failed `condition did not settle within 60 s`, then file timed out at120000ms; reconnect was configured after its startup snapshot. Corrected fixture input was separately qualified. This is not labelled environmental or hidden behind final green gates.

### Reused B bindings / npm-ls resolution context

**Identical input bindings (base reused, not rerun):**

Both B cells below are **reused**, not rerun. They target the unchanged clean baseline source at `node_modules/.matched-base`, not the source of the receipt-owning checkout. The old owner commit is an ancestor of the new head; changes are exclusively in the separate head source.

| Binding | Earlier B cells | Current inputs for paired fresh heads |
| --- | --- | --- |
| B source / cwd | `29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04`, clean; `/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-s4q8f/node_modules/.matched-base` | Identical pin, cwd and clean source |
| package.json SHA-256 | `e149f0a8943238a62ac82fa561ed1732187815d9e4e60f68c76f47dc8b726bc2` | Identical current base/head manifests and B git object |
| v22.23.3 executable | `/opt/node-v22.23.3-linux-x64/bin/node`; `fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48` | Same absolute path, SHA-256, and preflighted version |
| v22.12.0 executable | `/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-s4q8f/node_modules/.runtime/node-v22.12.0-linux-x64/bin/node`; `177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9` | Same absolute path, SHA-256, and preflighted version |
| Application dependency file/symlink inventory | `91c5fd4fc5a930b841480847fb8c54943432aa9f1fcfc8e4ff28c068ce751afd`, 7,332 records | Byte-identical inventory, independently recomputed; same physical install by construction, not independently resolved installs |
| AF_TEST_CONCURRENCY | 8 | 8 |
| npm stage commands | absolute Node + runtime npm-cli.js: run typecheck; run build; test | Identical commands and package scripts |
| Test flags | --import ./dist/test/helpers/force-exit-blocking-stdout.js --test --test-force-exit --test-concurrency=8 --test-timeout=600000 dist/test/*.test.js | Identical |
| Memory / deadline / cap | systemd user scope MemoryMax=17179869184; timeout --signal=TERM --kill-after=60s 3000s; head -c 67108864; separate PIPESTATUS | Identical policy |

There is **no repository package-lock.json or npm-shrinkwrap.json**. The shared `node_modules/.package-lock.json` is installed metadata only; its identical inode/hash is NOT independent evidence. `npm ls` base/head serialization differs because `.matched-base/node_modules` is a symlink: the reviewer demonstrated equal reachable name@version sets and a causal external-symlink control. Full explanation and limitations: inherited-npm-ls-explanation.md. No reinstall.

Receipts and immutable full-log hashes are verified in reused-base-cells.json.

The reviewer resolved the npm-ls issue with identical manifests, Node/npm/config/flags and named package entries, not just a label: `npm ls --all --json` on the symlinked base reports all 14 declared deps as `file:` links (e.g. `typescript → file:../../typescript`, `@animalabs/chronicle → file:../../../@animalabs/chronicle`). Arborist loses parent attribution for 39 hoisted transitive packages (41 extraneous lines) and treats linked packages as roots, reporting their dev/peer requirements plus broken consumer edges (526 missing lines). Examples: missing `@napi-rs/cli` is chronicle’s dev dependency; chronicle 0.5.1 and parser 7.29.12 are actually installed despite missing-edge reports. Base/head flattened reachable sets are both 54 name@version entries with zero symmetric difference. An external directory with only the identical manifest + the same node_modules symlink reproduces all 567 diagnostics; the real-directory head has none. The base cwd/prefix is `.matched-base`, npm root its symlink; head cwd/prefix is the worktree, npm root its real directory. npm local-prefix/config is common; no workspaces/extra flags, no reinstall. Full per-tree contexts, named versions, causal control and raw hashes: copied appendix and `review-probes-inspection.json`.

Base npm-ls exit **1**, JSON SHA `974e3bcfc2d3a01d06f66b219dd303580cb69cdd13ce74487c60257b788d4535`; head exit **0**, SHA `3c34f4248cd25631eae8af813a21972c32225cda9fab8b8ebea1cf9c5ec69975`. Different serialization/attribution, not different installed closure. These hashes are **not asserted equal**, and base npm-ls is not a passing graph check or independent closure evidence in this layout. Final metadata collection reproduces those per-tree exits/hashes unchanged.

### Matched matrix: B reused + fresh final head

Every listed stage exit is observed. No test failure names occurred (`failure_names: []` for each cell).

| Node/tree | Evidence | T/B/test | Total | Pass | Fail | Skip | Cancelled | Gate | Producer | Capture | Bytes | Truncation |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 22.23.3-base | reused | 0/0/0 | 9767 | 9704 | 0 | 63 | 0 | 0 | 0 | 0 | 4316588 | no |
| 22.23.3-head | fresh | 0/0/0 | 9866 | 9803 | 0 | 63 | 0 | 0 | 0 | 0 | 4314572 | no |
| 22.12.0-base | reused | 0/0/0 | 9767 | 9704 | 0 | 63 | 0 | 0 | 0 | 0 | 4152093 | no |
| 22.12.0-head | fresh | 0/0/0 | 9866 | 9803 | 0 | 63 | 0 | 0 | 0 | 0 | 4148301 | no |

Receipts, preserving original locations for reused B cells:
- 22.23.3-base (reused): `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/gate-fix-22.23.3-base-01M67V69RWMFMJPJCWCS5NJ654.log`
- 22.23.3-head (fresh): `/home/orgasmic/.orgasmic/runs/run-01M680NKSB65W88J6PJ9P6F8JC/evidence/gate-head-22.23.3-01M681APAH81TGMYAC8K1E7C9V.log`
- 22.12.0-base (reused): `/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/gate-fix-22.12.0-base-01M67XCYYEBRAJKWKAV6APD6PV.log`
- 22.12.0-head (fresh): `/home/orgasmic/.orgasmic/runs/run-01M680NKSB65W88J6PJ9P6F8JC/evidence/gate-head-22.12.0-01M681J6SPBR84HEJCXQPYB3NJ.log`

Fresh commands were predeclared, sequential **22.23.3 head then 22.12.0 head**, exactly once each. `run-heads.sh`, `stages.sh`, `bounded-cell.sh`, `matrix-owner.log`, `matrix-results.json` preserve argv, pins, times, exits, hashes, scope identity and progress. No script changed during a run. Each Node executable’s absolute path, SHA-256 and `--version` were checked before any npm command in its full cell; PATH points at that runtime and npm is invoked via absolute Node + its npm-cli.js. Both runtime versions/hashes are in the reuse table and each fresh full log.

```sh
orgasmic dispatch gate "head-$VERSION" -- systemd-run --user --scope \
 --unit="$UNIT" -p MemoryMax=16G env "PATH=$NODE_BIN:$PATH" \
 "AF_NODE=$ABSOLUTE_NODE" "AF_NODE_SHA=$SHA" "AF_CELL=$VERSION-head" \
 AF_TEST_CONCURRENCY=8 bash bounded-cell.sh "$WORKTREE" "$HEAD" "$VERSION-head"
# Inside the scope, wrapping the whole typecheck+build+test stage:
timeout --signal=TERM --kill-after=60s 3000s bash stages.sh "$WORKTREE" "$HEAD" \
 2>&1 | head -c 67108864 > "$FULL_LOG"
```

Actual fresh memory.max is **17179869184**. Both producer/capture exits are retained via PIPESTATUS, separately, not inferred from head/tee. Rule: **124/137/141, log at cap, or capture !=0 → INCONCLUSIVE** (timeout: operator-bounded timeout, inconclusive), not a test failure. None occurred. All current probes/builds/focused/mutants/corpus/metadata commands also use `bounded-command.sh` with the same deadline/grace/cap in separate 16 GiB scopes. It logs owner PID/PGID/start time and observed progress every 120s, surfaced at ≤4min. The only wrapper kill reaps its own sleep timer, not fixture survivors.

### Supplemental gate catalogue

All raw stdout/stderr is in the named gate log and `full-$LABEL.log`; producer/capture statuses in `status-$LABEL.txt`. Non-TAP counts N/A; focused counts are above and mutant children are separately enumerated above.

| Gate | Gate exit | Producer/Capture | Log bytes | Cap | Receipt |
| --- | ---: | --- | ---: | --- | --- |
| replacement-preprobe | 1 | 1/0 | 1164 | no | `gate-replacement-preprobe-01M680SNMC6PNCZR9AZCKFETP5.log` |
| replacement-preprobe-configured | 0 | 0/0 | 498 | no | `gate-replacement-preprobe-configured-01M680T8HAN36AHFVVRGD2HFRT.log` |
| replacement-development-build | 0 | 0/0 | 337 | no | `gate-replacement-development-build-01M680WQDJVRV14R1GJDVSNTVJ.log` |
| construction-development-build | 0 | 0/0 | 337 | no | `gate-construction-development-build-01M6813BDRTX0DGZ3HFQTTYSX0.log` |
| replacement-focused | 0 | 0/0 | 37498 | no | `gate-replacement-focused-01M680Y5MF6Q5EJNSDM4ASPFVN.log` |
| construction-focused | 0 | 0/0 | 37450 | no | `gate-construction-focused-01M6815T1MHJ427JYEGA476FBN.log` |
| construction-mutants | 0 | 0/0 | 8855 | no | `gate-construction-mutants-01M6817S86K1MS4NG5DX3SP9X6.log` |
| construction-profile-off | 0 | 0/0 | 3870 | no | `gate-construction-profile-off-01M681942RPQ9TMWTYV93A0PP6.log` |
| final-binding-metadata | 0 | 0/0 | 1384 | no | `gate-final-binding-metadata-01M681THDTB30H6JQHM3WR3DXJ.log` |

`final-binding-metadata` is a read-only consistency gate (counts/failure names N/A): source pins/clean trees, absolute Node SHA/version before npm, same full dependency inventory and same per-tree npm-ls diagnostics/hashes before/after. Source: `final-integrity.py`; result: `final-integrity.json`, `dependency-closure-after.*`, `npm-ls-after-*`. The installed `.package-lock.json` hash is recorded as shared metadata only, never independent evidence or a nonexistent repository lockfile.

Report-only postprocessing initially rejected a prefix-colliding gate-log glob; the selector was corrected to require the exact gate name/invocation ID. No source, inputs, tests or gates reran (`postprocessing-note.txt`).

### Surviving-process reconciliation

After the set and again after final metadata: **zero matching live processes, zero read errors**. All 11 own matrix/probe/build/metadata scopes are inactive with no control group. Read-only audits use scope/cgroup plus previously tracked PID and exact kernel start ticks, with activation timestamps/PPID/PGID/session: `process-audit-head1-running.json`, `process-audit-head2-running.json`, `tracked-processes.json`, `process-audit-after-set.json`, `process-audit-final.json`. No fixture survivor was manually killed. This is a scoped/tracked-identity observation, not an inference from timeout status or a claim about unrelated host processes.

## Unmet Criteria

None for this fix round. Replacement controls (ready and pending), exact reasons, direct reachable-fork construction including B, docs, ten mutants, fixed-hash profile-off corpus and both fresh head cells are complete at committed clean head. B cells are explicitly reused only under the verified bindings table. The initial rename is superseded in final code; it is not the safety solution. No unexpected configured-case false pass/refusal was found, and no BLOCKED-FOR-SCOPE item was required.

## Residual Risk

- LOW-3 remains: never-reaches-A per-item epoch identity is killed by a white-box fork observation, not a changed production-visible outcome; the outer stale guard independently refuses.
- Baseline dependencies are shared by construction through a symlink, not independently resolved installs. npm-ls serialization differs as explained; no repository lockfile exists.
- Finite invented-ID tests and logical corpus do not prove native truth, all concurrent schedules, or physical store-file equality. The 50 ingress fixture cases are AF qualification; seven native-tool cases and T2–T5/native host/send-time qualification remain outside this change. First failed differential and development failures remain preserved above.
- Older 47f3b4f2 historical 22.23.3 head has a missing dispatch-gate receipt (completed 0/0/0 stage log only); nothing here fabricates or reuses it. The two reused B receipts come from the later complete bounded matched set at 39c76401. Older exact matrices are retained in the frozen validation report and prior implementation report.

Remaining work estimate: **no AF implementation/qualification work against this fix brief**; bounded delta review approximately **0.5–1 engineer-hour**. Artifact integration/host repin and native qualification are separate; no push, release, repin or activation was performed.
