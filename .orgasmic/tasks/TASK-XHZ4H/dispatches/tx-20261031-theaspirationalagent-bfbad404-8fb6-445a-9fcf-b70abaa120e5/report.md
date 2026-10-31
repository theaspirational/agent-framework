# Four-file diagnostic pair

## Changed

**No code, commits, installs, builds, fixes, timeout changes or retries.** This is the single authorized reproduction pair, not qualification. Both actual worktrees and the assigned root remain clean.

Task operator Tarn relayed programme qualifier Soma's conditions; these are **not owner Vasyl's decisions**.

### Preflight conflict and correction

The brief said to match the full-suite flags but also said “NOT ... 600000”. Before running anything, the recorded full head-12 log and both package.json files were checked: the actual full-suite value was **--test-timeout=600000**. Ask **ask-a1f27e7911b14e098a5cd11e5733425f** was answered by the task operator: the exclusion was a mistake; use **the recorded 600000**, preserve in-test budgets, and use the same frozen head/base trees as before. The answer and original conflict are preserved in `preflight-ask.txt`.

The operator additionally required actual consumed content/build bindings and verification that Git did not walk up to the parent. `git-tree-identity.json` verifies, for **each** tree, that `git rev-parse --show-toplevel` equals its own realpath. These are actual worktrees, not inherited parent identities.

## Verification Gates

### Exact identities, contents and flags

| Cell | Actual cwd / Git toplevel (equal) | Verified full HEAD | Before/after porcelain |
|---|---|---|---|
| four-head | `/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-xhz4h/data/workload-head` | `93427f90a16bcfbcf815217f4c080669ab842a71` | empty / empty |
| four-base | `/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-xhz4h/data/fixture-closure` | `b6e225e07a8214894c3f721dfb14ac0c1cf75714` | empty / empty |

Absolute executable: **`/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin/node`**, preflight **v22.12.0**.
Full executable SHA-256 printed and checked before test invocation:
**`177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9`**.

AF_TEST_CONCURRENCY=8; NODE_OPTIONS unset. Exact test argv in **both** cells, in the requested file order:
```sh
/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin/node   --import ./dist/test/helpers/force-exit-blocking-stdout.js   --test --test-force-exit --test-concurrency=8 --test-timeout=600000   dist/test/context-only-delivery.test.js   dist/test/tune-out-e2e.test.js   dist/test/tune-out-reader-epoch-shared.test.js   dist/test/tune-out-reader-fork-handoff.test.js
```

The flags match the recorded full cell; only the file set is narrowed. No npm/full-suite invocation, rebuild or dependency resolution was performed.

Exact dispatch/scope/outer-timeout argv, including tested cwd, is saved as `four-{head,base}.command.json`:

```sh
cd /home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-xhz4h/data/workload-head
orgasmic dispatch gate diagnostic-four-head -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 timeout --signal=TERM --kill-after=60s 900s bash /home/orgasmic/.orgasmic/runs/run-01M685PJ2DQ3FQ9M9KC23Q3CY9/evidence/capture-inside.sh four-head bash /home/orgasmic/.orgasmic/runs/run-01M685PJ2DQ3FQ9M9KC23Q3CY9/evidence/four-producer.sh four-head 93427f90a16bcfbcf815217f4c080669ab842a71
```

```sh
cd /home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-xhz4h/data/fixture-closure
orgasmic dispatch gate diagnostic-four-base -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 timeout --signal=TERM --kill-after=60s 900s bash /home/orgasmic/.orgasmic/runs/run-01M685PJ2DQ3FQ9M9KC23Q3CY9/evidence/capture-inside.sh four-base bash /home/orgasmic/.orgasmic/runs/run-01M685PJ2DQ3FQ9M9KC23Q3CY9/evidence/four-producer.sh four-base b6e225e07a8214894c3f721dfb14ac0c1cf75714
```

Each actual invocation is a dispatch gate → **systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 → timeout --signal=TERM --kill-after=60s 900s** → capture/producer. Inside the timed scope, the producer and 64-MiB capped/draining capture form a pipeline and both **PIPESTATUS** values are preserved separately. Exit 124/137/141, cap hit, missing capture metadata, or nonzero capture status is **INCONCLUSIVE**, never accepted as a passing observation. Neither cell is inconclusive.

Bindings verified **before and after** each cell:
- Frozen CM **0.24.2** closure: **`dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01`**, 7,332 files/symlinks/hashes/targets/modes.
- Physical generated lock, `data/fixture-closure/package-lock.json`: **`df14aa0a57fd237393e3853956707ecbb31e93952504dcba24e9a971eb022578`**.
- Each tree's HEAD and clean porcelain.
- All named source/compiled test and build entry-point hashes, plus every existing dist file hash. No assertion relies on Git identity alone.

Raw before/after bindings: `four-{head,base}.binding-{before,after}.json`, `.inputs-{before,after}.json`, `.closure-{before,after}.json`. Content/build maps are unchanged within each cell; the compiled fork fixture is included explicitly. Full manifest metadata (not build caches) stays in evidence.

### Free-space reserve

The producer requires at least **20 GiB plus the 64-MiB log budget** free before either test command. No cleanup to make space was performed.

| Cell | Before available bytes / GiB | After available bytes / GiB |
|---|---|---|
| four-head | 25,619,947,520 / 23.860 | 25,619,664,896 / 23.860 |
| four-base | 25,618,153,472 / 23.859 | 25,615,831,040 / 23.857 |

## Observations

Order was **head → reconcile head → base → reconcile base**, one execution each. Logs and state transitions are in `pair-owner.log` / `pair-exits.json`.

| Cell | Producer/test exit | Capture exit | Total | Pass | Fail | Skip | Cancelled | Cap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|
| four-head | 0 | 0 | 43 | 43 | 0 | 0 | 0 | no | 26,417 |
| four-base | 1 | 0 | 42 | 41 | 1 | 0 | 0 | no | 28,091 |

- **Head failed names:** none.
- **Base failed name:** `fork seed normalization preserves alignment or refuses before any shifted normal classification is stored` — old fixture assertion **'0.24.2' !== '0.24.1'**, not a timeout.
- **Tune-out leaves:** all five pass in each cell.
- **Timeouts:** none in this pair. No cancellation, cap hit or capture failure.
- The head has the additional changed-normalizer-byte test, absent at base; this explains the one-test total difference. “Absent at base” below is not a skip or failed execution.

Raw results: `four-{head,base}.log`, `.gate.log`, `.result.json`, `.capture.json`. Dispatch receipts: `gate-diagnostic-four-head-*.log`, `gate-diagnostic-four-base-*.log`.

### Start/end UTC, uptime and load

- **four-head start**, **2026-10-31T05:10:01.518016+00:00**: `05:10:01 up 3 days, 13:02,  0 user,  load average: 7.21, 4.68, 3.29`; `/proc/loadavg: 7.21 4.68 3.29 4/1242 610620`; **16 CPUs**.
- **four-head end**, **2026-10-31T05:10:13.960438+00:00**: `05:10:13 up 3 days, 13:02,  0 user,  load average: 7.73, 4.93, 3.39`; `/proc/loadavg: 7.73 4.93 3.39 1/1243 611362`; **16 CPUs**.
- **four-base start**, **2026-10-31T05:10:15.803396+00:00**: `05:10:15 up 3 days, 13:02,  0 user,  load average: 7.73, 4.93, 3.39`; `/proc/loadavg: 7.73 4.93 3.39 3/1247 611573`; **16 CPUs**.
- **four-base end**, **2026-10-31T05:10:27.113068+00:00**: `05:10:27 up 3 days, 13:02,  0 user,  load average: 7.62, 5.04, 3.46`; `/proc/loadavg: 7.62 5.04 3.46 3/1280 613701`; **16 CPUs**.

These are context observations, not a causal explanation. Raw snapshots: `four-{head,base}.load-{start,end}.json`.

### Every leaf: outcome, TAP duration and timeout limit

Durations are whole-leaf TAP milliseconds, including setup/prior waits/teardown, not isolated measurements of a particular poll. Parent Node leaf limit is the runner's **600,000 ms** unless explicitly overridden to **120,000 ms** by the two handoff leaves. Limits were not changed.


#### `test/context-only-delivery.test.ts`

| Leaf | Head outcome / ms | Base outcome / ms | Parent Node leaf limit ms |
|---|---|---|---:|
| B1 C1 C2: idle context-only stores once without open repair, null default, anchors, typing, status or inference; a later turn sees it | pass / 326.900247 | pass / 348.617813 | 600000 |
| C1 C2 B4: drift stays closed with desired open; an existing default is not retargeted and no publish right is granted | pass / 183.400053 | pass / 156.568941 | 600000 |
| B2 C3 C4: forged tags, nested metadata.tags, reserved stamps and foreign server identity cannot lift the selector or module suppression | pass / 170.595809 | pass / 164.896171 | 600000 |
| B2: nested metadata.tags cannot select context-only without the field; incoming, ordinary and push strip only the enabled reserved key | pass / 161.042719 | pass / 167.380516 | 600000 |
| B3 C6: ordered mixed batches reject every invalid delivery type/value and normal-wake/coalesce combination before effects | pass / 164.760207 | pass / 159.215327 | 600000 |
| B3 C5: ungranted/unknown channels are refused, no lazy registration | pass / 143.893247 | pass / 147.687049 | 600000 |
| B3: current grant is narrowed between messages and across the admission await | pass / 156.442405 | pass / 163.750098 | 600000 |
| Composition: A's wake ceiling false cannot lift context-only, and store refusal wins | pass / 163.469625 | pass / 177.504089 | 600000 |
| Composition: A's wake ceiling true cannot lift context-only, and store refusal wins | pass / 170.080591 | pass / 160.952241 | 600000 |
| B4: push delivery is rejected before the read tap or hold, independent of profile=false; no-field push unchanged | pass / 136.798952 | pass / 124.436341 | 600000 |
| B4: push delivery is rejected before the read tap or hold, independent of profile=true; no-field push unchanged | pass / 144.675011 | pass / 153.299565 | 600000 |
| B3: no offer or grant without explicit persistence; local leaf is excluded from feature-set uses | pass / 134.197670 | pass / 140.193821 | 600000 |
| wire decoder compatibility: incoming stays boolean; an old closed channel-leaf decoder ignores the new sibling | pass / 0.270564 | pass / 0.422266 | 600000 |
| B6: a context-only plan skips both gate evaluation and probe; storage/maintenance are not inference permission | pass / 0.176289 | pass / 0.297964 | 600000 |
| C7: duplicate context-only deliveries are two stored entries and zero wakes; uncertain ACK is not replayed | pass / 158.441978 | pass / 114.314781 | 600000 |
| B5: restart/history replay retain classification and decisions; disabled/ignored profile refuses one-way history without restoring stale rows | pass / 237.227104 | pass / 216.258545 | 600000 |
| B5: malformed and future stamps never promote conversational authority; unstamped history retains legacy semantics | pass / 151.420979 | pass / 179.471382 | 600000 |
| B1 C3 C4: context during a real active answer neither interrupts nor injects, repins, resets explicit-send suppression or queues a follow-up | pass / 305.019270 | pass / 277.857281 | 600000 |
| B5: a process restart reconstructs the durable deferred queue with the same private classification | pass / 500.628649 | pass / 524.892103 | 600000 |
| B5: sharding preserves the host stamp on every source row | pass / 232.827887 | pass / 234.901847 | 600000 |
| B5 B6: real mixed compaction keeps per-source classification through existing lineage; summaries are not arrivals | pass / 228.042730 | pass / 221.784130 | 600000 |
| C2: the defensive anchor boundary reads the private plan, never a forged metadata field | pass / 137.228921 | pass / 149.137149 | 600000 |
| B3: missing incoming grant preserves ordered per-message refusals in a selector batch | pass / 146.631733 | pass / 154.036619 | 600000 |
| B2: unrelated connections with the same channel id use the same plan and preserve connection identity | pass / 163.839665 | pass / 164.127801 | 600000 |
| B4: push selector is refused, never silently downgraded on a ready connection | pass / 152.013651 | pass / 178.683293 | 600000 |
| C1 B4: registered tuned-out input may store under its existing hold but causes no status/reader-wake bookkeeping | pass / 173.927311 | pass / 183.998929 | 600000 |
| unconfigured profile=undefined: ungranted selector batches have ordered refusals; no-field batches keep the capability error | pass / 146.502884 | pass / 128.629917 | 600000 |
| unconfigured profile=false: ungranted selector batches have ordered refusals; no-field batches keep the capability error | pass / 143.202752 | pass / 136.113206 | 600000 |
| ungranted selector retains the initial-policy error and diagnoses notifications without a responder | pass / 165.704053 | pass / 140.257039 | 600000 |
| context-only needs per-server opt-in even with profile enabled; advertisement=boolean | pass / 169.437935 | pass / 141.116889 | 600000 |
| context-only needs per-server opt-in even with profile enabled; advertisement=object | pass / 171.876714 | pass / 150.543867 | 600000 |
| explicit context-only opt-in is still masked by disabledCapabilities and the profile floor | pass / 181.581447 | pass / 147.742973 | 600000 |
| delivery invalid_delivery: every refusal is traced, lines are rate limited and payload is not logged | pass / 187.720115 | pass / 152.178099 | 600000 |
| delivery capability_denied: every refusal is traced, lines are rate limited and payload is not logged | pass / 174.659925 | pass / 161.940931 | 600000 |
| delivery unsupported_combination: every refusal is traced, lines are rate limited and payload is not logged | pass / 176.290800 | pass / 160.075488 | 600000 |
| grant narrowing after the required hook emits the same delivery refusal trace and line | pass / 156.059563 | pass / 146.890616 | 600000 |
| fork seed normalization preserves alignment or refuses before any shifted normal classification is stored | pass / 540.404657 | fail / 64.896004 | 600000 |
| changed normalizer bytes fail the fork-seed precondition loudly | pass / 88.256637 | absent at base | 600000 |

#### `test/tune-out-e2e.test.ts`

| Leaf | Head outcome / ms | Base outcome / ms | Parent Node leaf limit ms |
|---|---|---|---:|
| runs the full divert → wake → auto-cancel arc | pass / 4908.628777 | pass / 4907.641448 | 600000 |
| a conversation is bound to a channel only on its own server, not another server's channel with the same id | pass / 28.078354 | pass / 23.179055 | 600000 |

#### `test/tune-out-reader-epoch-shared.test.ts`

| Leaf | Head outcome / ms | Base outcome / ms | Parent Node leaf limit ms |
|---|---|---|---:|
| a real reader fork carries its epoch and leaves a later hold and channel untouched | pass / 2629.284204 | pass / 2674.891966 | 600000 |

#### `test/tune-out-reader-fork-handoff.test.ts`

| Leaf | Head outcome / ms | Base outcome / ms | Parent Node leaf limit ms |
|---|---|---|---:|
| names queued messages by their write handles, gives a failed fork's messages to the next reader, and hands nothing twice once they land | pass / 8759.294625 | pass / 8666.017291 | 120000 |
| a fork still running when its tune-out ends, which then fails, gets one late fork through the framework, and a late fork that fails gets none | pass / 3338.437355 | pass / 2312.702866 | 120000 |

Unchanged inner budgets:
- Context-only B5 restart helper: child process **20,000 ms**.
- Fork-seed positive and changed-byte child controls: **60,000 ms** each (changed-byte test absent at base).
- Existing admission-hook budgets in the context-only fixture tests remain **5,000 ms** where configured.
- Tune-out auto-cancel/reader polling waits: **20,000 ms**; e2e helper defaults elsewhere are **15,000 ms**. The channel-binding-only leaf has no polling wait.
- Outer cell timeout remains separately **900 seconds** with 60-second TERM→KILL allowance.

Machine-readable outcomes for all **85 executed leaves**, durations and parent limits: `four-summary.json`. The sole base assertion failure's complete diagnostic is preserved in its raw log.

### Consumed source/build hashes

| File | Head SHA-256 | Base SHA-256 |
|---|---|---|
| `test/context-only-delivery.test.ts` | `c98b255012e53ca7ec44d7183d6de97d267138957c422cce30dab8763b2ddd76` | `bf734a3f07015d1f0a350ac8b68f4e88855e784a2091c8881aa876420dd556ad` |
| `dist/test/context-only-delivery.test.js` | `856816702883e321b335c4ed59d53b6a178ef21131a2b692c54a5f5c29ff2e4c` | `cdd5ce9d7489bfa55d81cf0dd56902e716749400d294f7be710860c43cc87173` |
| `test/fixtures/context-only-fork-seed-child.mjs` | `48dcb1dc70db77ff7fbd30e7f13cc43fa5ae1b42162d7313925645bfae47248e` | `51bdea25c5673491dba41adba41e6a9b8888899fc3cd7c525f722aab3813cf2c` |
| `dist/test/fixtures/context-only-fork-seed-child.mjs` | `48dcb1dc70db77ff7fbd30e7f13cc43fa5ae1b42162d7313925645bfae47248e` | `51bdea25c5673491dba41adba41e6a9b8888899fc3cd7c525f722aab3813cf2c` |
| `test/tune-out-e2e.test.ts` | `38371926b3d05f4040bb180fe189e38d3ca58dae540653a37c1ee3016918aa17` | `38371926b3d05f4040bb180fe189e38d3ca58dae540653a37c1ee3016918aa17` |
| `test/tune-out-reader-epoch-shared.test.ts` | `548e53821a0a48eaf1ab125e41984c9dedc8ff86820d27d7cb4e1b545a8d6883` | `548e53821a0a48eaf1ab125e41984c9dedc8ff86820d27d7cb4e1b545a8d6883` |
| `test/tune-out-reader-fork-handoff.test.ts` | `adf28d3273a336113d7acde1396822432f21b88c6f369602f3aed60d2c0ec56a` | `adf28d3273a336113d7acde1396822432f21b88c6f369602f3aed60d2c0ec56a` |
| `dist/test/tune-out-e2e.test.js` | `ea309a777b5b11988fea2ffc4aa3522554bac3393e6967124a8073bc9b71ee2b` | `ea309a777b5b11988fea2ffc4aa3522554bac3393e6967124a8073bc9b71ee2b` |
| `dist/test/tune-out-reader-epoch-shared.test.js` | `aefde80b5555662eeb14fb951f2ce151d1852628385ea9ea4c796358d50e0e4f` | `aefde80b5555662eeb14fb951f2ce151d1852628385ea9ea4c796358d50e0e4f` |
| `dist/test/tune-out-reader-fork-handoff.test.js` | `8ba200f6fcebc2a8d9cd5e03e156460ca9ed2524d087c0d44217489c4b6b1549` | `8ba200f6fcebc2a8d9cd5e03e156460ca9ed2524d087c0d44217489c4b6b1549` |
| `dist/test/helpers/force-exit-blocking-stdout.js` | `79c1dd71226f247003a1a9178956de07e7e07e4e7c3bb6b491f7efa919d16e1e` | `79c1dd71226f247003a1a9178956de07e7e07e4e7c3bb6b491f7efa919d16e1e` |
| `dist/test/helpers/mock-membrane.js` | `3023aa256865bab806e83f58900c083a3e0d4dad4af9b6e0036a3c3d899d3335` | `3023aa256865bab806e83f58900c083a3e0d4dad4af9b6e0036a3c3d899d3335` |
| `dist/test/helpers/command-file.js` | `adfd3e2a7a4c19e76dcca3e81325303f598e413c34aaa442a3a17d55215049d7` | `adfd3e2a7a4c19e76dcca3e81325303f598e413c34aaa442a3a17d55215049d7` |
| `dist/test/helpers/json-lines.js` | `076530a7825fc4cf4ddaec95281323df5ae5cf89c710b46c6ec7ecfbb566a5c9` | `076530a7825fc4cf4ddaec95281323df5ae5cf89c710b46c6ec7ecfbb566a5c9` |
| `dist/test/fixtures/tune-out-mcpl-server.mjs` | `e5c36563decd5e99238f3a4eeb8585bd971b04ab33f47dd610e4d93340fc4c07` | `e5c36563decd5e99238f3a4eeb8585bd971b04ab33f47dd610e4d93340fc4c07` |
| `dist/src/index.js` | `9aa6af8f7663038a2beb9c6ca4435d86a8235361c70ec08a0535d733b637bb3a` | `9aa6af8f7663038a2beb9c6ca4435d86a8235361c70ec08a0535d733b637bb3a` |
| `dist/src/framework.js` | `86d59157ea5f4535a77d7c36796a0423f3833b0976ecbd88c2e575f3bc95b95c` | `86d59157ea5f4535a77d7c36796a0423f3833b0976ecbd88c2e575f3bc95b95c` |
| `dist/src/tune-out/coordinator.js` | `11303df91a431d6e288725f869b386366b0f58c926914f921b78ddbc8f3c08fb` | `11303df91a431d6e288725f869b386366b0f58c926914f921b78ddbc8f3c08fb` |
| `dist/src/held-writes.js` | `c30c581a8c10aca79c05bb97a9a593bd5666e9a99bf808048700a2f3d72ce23a` | `c30c581a8c10aca79c05bb97a9a593bd5666e9a99bf808048700a2f3d72ce23a` |
| `dist/src/deadline-timer.js` | `9f98bb23ea4548299eb3d72aafc466c541cea5cb7497972ecec87829386d00b0` | `9f98bb23ea4548299eb3d72aafc466c541cea5cb7497972ecec87829386d00b0` |

The maps above were captured before/after, including the context-only compiled test and the changed fork child. The full dist hash inventories bind potential transitive compiled inputs without modifying the loader. Build contents were consumed as they existed; no build or file copying into the trees took place.

### Per-cell process identities and survivor reconciliation

Inside each scope, the producer recorded its exact cgroup. An outside monitor recorded PID, kernel start ticks, UTC start, full scope and command for processes in **that exact cgroup**, not by process name. Reconciliation finished before the next cell.

| Cell | Owned scope | Recorded process identities | Remaining at completion | Signals sent |
|---|---|---:|---:|---|
| four-head | `0::/user.slice/user-1002.slice/user@1002.service/app.slice/run-u71074.scope` | 16 | 0 | none |
| four-base | `0::/user.slice/user-1002.slice/user@1002.service/app.slice/run-u71075.scope` | 15 | 0 | none |

Actual parent Node test-command identities:
- **four-head**: PID **610621**, start ticks **30614141**, UTC **2026-10-31T05:10:01Z**, scope `0::/user.slice/user-1002.slice/user@1002.service/app.slice/run-u71074.scope`.
- **four-base**: PID **611574**, start ticks **30615569**, UTC **2026-10-31T05:10:15Z**, scope `0::/user.slice/user-1002.slice/user@1002.service/app.slice/run-u71075.scope`.

Logs and exact identities were saved before cleanup decisions. The cleanup policy checks PID+start ticks+scope before TERM, waits up to 10 seconds, then KILLs only a still-matching owned identity and verifies again. **Both scopes were already empty**, so no TERM, grace wait or KILL was needed. Raw evidence: `four-{head,base}.identities.json`, `.survivors-before-cleanup.json`, `.reconciliation.json`. No unrelated process was signalled.

## Interpretation / conclusion

**The three tune-out timeouts were not reproduced in this four-file pair.** The base's only failed leaf is the old fixture version assertion.

This tests reproduction at this scale, **not the cause**. The earlier full head-12 result remains **FAILED / HELD unchanged**; this pair does not qualify D.

### Inherited evidence and limits

The recorded full head-12 command is reused only to bind flags; its prior 3-timeout result remains inherited, not re-executed or relabelled. The preceding three-file pair is separate historical evidence, not a fresh observation here. Current outcomes and content/load/process bindings come only from these two newly authorized cells.

## Unmet Criteria

None for this bounded diagnostic assignment. The flag conflict was resolved before starting by the operator's explicit correction. No commit was made because this round explicitly prohibited commits. The inherited qualification hold is unchanged.

## Residual Risk

The cause of the full-suite failures remains unknown. A selected four-file observation cannot clear the failed full result or demonstrate a mechanism. No further diagnostics, fixes, installs, retries, publication or push were performed.
