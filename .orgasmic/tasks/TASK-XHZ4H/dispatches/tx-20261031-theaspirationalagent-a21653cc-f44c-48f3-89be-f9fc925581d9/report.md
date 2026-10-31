# Selected tune-out diagnostic pair

## Changed

**No repository changes or commits.** Assigned tree, existing head checkout and existing base checkout were clean before/after; head remains **`93427f90a16bcfbcf815217f4c080669ab842a71`**, base **`b6e225e07a8214894c3f721dfb14ac0c1cf75714`**. No build, install, source fix, timeout change, retry or additional test run.

This was the single focused diagnostic pair authorized by task operator Tarn under Soma's programme-qualification conditions, **not decisions by human owner Vasyl**. It is **not qualification or a full-gate retry**.

Read the supplied full round-3 report, SHA-256 **`66d40f10595aaf53983637bde56ebaee376f625d285d3a054e2f83d07abdb236`**. Its full-suite head-12 result stays **FAILED / HELD**: 9,688 total / 9,622 pass / 3 fail / 63 skip / 0 cancelled. The prior fresh matched base passed those three leaves and failed only the old fixture version assertion. Those are **inherited observations, not freshly executed full suites**.

## Verification Gates

### Exact scope and commands

Exactly three existing compiled test files were run, once on head, then once on base, sequentially. Both use the absolute Node **22.12.0** executable:
`/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin/node`

Full executable SHA-256, printed before each test run:
**`177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9`**.
Both in-run preflights report **v22.12.0**.

AF_TEST_CONCURRENCY=8; NODE_OPTIONS explicitly unset. The selected commands preserve the full-cell import/runner flags and timeout:

```sh
/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin/node   --import ./dist/test/helpers/force-exit-blocking-stdout.js   --test --test-force-exit --test-concurrency=8 --test-timeout=600000   dist/test/tune-out-e2e.test.js   dist/test/tune-out-reader-epoch-shared.test.js   dist/test/tune-out-reader-fork-handoff.test.js
```

Actual wrapper, for selected-head then selected-base:
```sh
orgasmic dispatch gate diagnostic-<cell> --   systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0   bash "$ORGASMIC_EVIDENCE_DIR/capture-cell.sh" <cell>   bash "$ORGASMIC_EVIDENCE_DIR/diagnostic-producer.sh" <cell> <full-commit>
```

The capture wrapper bounds the entire producer with **timeout --signal=TERM --kill-after=60s 3000s**, drains output through a **64-MiB capped capture**, and records producer/log-capture PIPESTATUS separately. Exit 124/137/141, cap hit, or capture failure is **INCONCLUSIVE**. Neither observation is inconclusive.

| Run | Actual cwd | Full commit | Unit |
|---|---|---|---|
| selected-head | `/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-xhz4h/data/workload-head` | `93427f90a16bcfbcf815217f4c080669ab842a71` | `run-u70852.scope` |
| selected-base | `/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-xhz4h/data/fixture-closure` | `b6e225e07a8214894c3f721dfb14ac0c1cf75714` | `run-u70853.scope` |

The frozen physical dependency closure is unchanged:
**`dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01`** (7,332 entries).
Both trees use `data/fixture-closure/node_modules`; head's node_modules resolves there. Before/after each run, the measured manifest matches the saved frozen manifest byte-for-byte. Actual CM is 0.24.2; identical normalizer bytes are not a whole-package compatibility claim.

Scripts: `diagnostic-pair.sh`, `diagnostic-producer.sh`, `capture-cell.sh`, `cap-log.py`, `record-inputs.py`. Raw command/cwd/hash/preflight output is in each run's log. Sequential transitions/exits: `diagnostic-owner.log`, `diagnostic-exits.txt`. No npm test/full-suite command was invoked.

### Observations

| Run | Producer/test exit | Capture exit | Total | Pass | Fail | Skip | Cancelled | Cap | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|
| selected-head | 0 | 0 | 5 | 5 | 0 | 0 | 0 | no | 9,809 |
| selected-base | 0 | 0 | 5 | 5 | 0 | 0 | 0 | no | 10,007 |

Failure names: **none in either selected-file run**.

| Leaf | Head outcome / duration ms | Base outcome / duration ms | Explicit leaf limit ms | Relevant poll limit ms | Runner limit ms |
|---|---|---|---:|---:|---:|
| runs the full divert → wake → auto-cancel arc | pass / 4866.778216 | pass / 4839.969335 | not overridden | 20000 | 600000 |
| a conversation is bound to a channel only on its own server, not another server's channel with the same id | pass / 11.781452 | pass / 10.712673 | not overridden | none in leaf | 600000 |
| a real reader fork carries its epoch and leaves a later hold and channel untouched | pass / 2436.157966 | pass / 2428.364060 | not overridden | 20000 | 600000 |
| names queued messages by their write handles, gives a failed fork's messages to the next reader, and hands nothing twice once they land | pass / 8533.295086 | pass / 8612.550555 | 120000 | 20000 | 600000 |
| a fork still running when its tune-out ends, which then fails, gets one late fork through the framework, and a late fork that fails gets none | pass / 2246.118158 | pass / 2293.415119 | 120000 | 20000 | 600000 |

Durations are whole-leaf TAP durations, not isolated measurements of a particular wait. The first leaf's relevant auto-cancel wait is 20,000 ms; its helper also contains 15,000-ms default waits elsewhere. Reader waits use 20,000 ms. Handoff leaves additionally specify 120,000-ms leaf timeouts. The channel-binding-only leaf has no polling wait. All limits and the runner's 600,000-ms setting are unchanged.

Raw artifacts: `selected-{head,base}.log`, `.result.json`, `.capture.json`, `.gate.log`, `.closure-before.json`, `.closure-after.json`. Dispatch receipt logs: `gate-diagnostic-selected-head-*.log`, `gate-diagnostic-selected-base-*.log`. `diagnostic-summary.json` contains all paired leaf outcomes and durations.

### Start/end uptime and loadavg

- **selected-head start**, 2026-10-31T04:25:37.944779+00:00: `04:25:37 up 3 days, 12:17,  0 user,  load average: 0.88, 2.44, 4.27`; `/proc/loadavg: 0.88 2.44 4.27 4/1099 438903`; **16 CPUs**.
- **selected-head end**, 2026-10-31T04:25:48.995466+00:00: `04:25:48 up 3 days, 12:18,  0 user,  load average: 0.82, 2.38, 4.22`; `/proc/loadavg: 0.82 2.38 4.22 1/1120 439327`; **16 CPUs**.
- **selected-base start**, 2026-10-31T04:25:50.348712+00:00: `04:25:50 up 3 days, 12:18,  0 user,  load average: 0.82, 2.38, 4.22`; `/proc/loadavg: 0.82 2.38 4.22 1/1114 439557`; **16 CPUs**.
- **selected-base end**, 2026-10-31T04:26:01.522164+00:00: `04:26:01 up 3 days, 12:18,  0 user,  load average: 1.36, 2.41, 4.21`; `/proc/loadavg: 1.36 2.41 4.21 4/1358 441472`; **16 CPUs**.

These are measured context, not a causal explanation. Raw snapshots: `selected-{head,base}.load-{start,end}.json`.

### Consumed compiled inputs

These SHA-256 values bind the actual selected compiled test files, their source files and the named build/helper entry points used by the runs. They were read **before and after** each run and did not change. No rebuild was performed.

| File | Head SHA-256 | Base SHA-256 |
|---|---|---|
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

In addition, `selected-head.inputs-{before,after}.json` and `selected-base.inputs-{before,after}.json` inventory **every existing dist file's SHA-256** (2,414 head / 2,413 base), binding potential transitive compiled inputs without runtime loader changes. Each tree's complete dist inventory is unchanged across its run. The hashes are metadata only; no build cache was copied to evidence.

The exact consumed entry points above match across the trees. This does not establish a cause for the previous full-suite failures.

### Owned helper reconciliation

**22 observed PID/start/cgroup identities: 19 ended, 3 unchanged control-infrastructure identities remain, zero unexpected/test-helper survivors.** No process was killed.

Snapshots `helpers-before.json`, `helpers-during.json`, `helpers-after.json` and `helper-reconciliation.json` preserve PID, kernel start ticks, UTC start, full cgroup, command and final status; `owned-scope-sources.json` ties owned scopes to receipts. Both selected-run units and enumerated prior owned gate scopes are inactive after completion.

- Control PID **435810**, start ticks **30344048**, UTC **2026-10-31T04:25:00Z**, cgroup `0::/user.slice/user-1002.slice/user@1002.service/app.slice/orgasmic-run-0c9eb01950c84b1593b542f4518b55512e66b4cf95006f10ca0cf0692ee25586-run-01M6838A7CBXAWYC4MNMCZRKXB-5cb1c0027c0448adba658543e06b5c7f.scope`.
- Control PID **435826**, start ticks **30344057**, UTC **2026-10-31T04:25:00Z**, cgroup `0::/user.slice/user-1002.slice/user@1002.service/app.slice/orgasmic-run-0c9eb01950c84b1593b542f4518b55512e66b4cf95006f10ca0cf0692ee25586-run-01M6838A7CBXAWYC4MNMCZRKXB-5cb1c0027c0448adba658543e06b5c7f.scope`.
- Control PID **436080**, start ticks **30344510**, UTC **2026-10-31T04:25:05Z**, cgroup `0::/user.slice/user-1002.slice/user@1002.service/app.slice/orgasmic-run-0c9eb01950c84b1593b542f4518b55512e66b4cf95006f10ca0cf0692ee25586-run-01M6838A7CBXAWYC4MNMCZRKXB-5cb1c0027c0448adba658543e06b5c7f.scope`.

The pair completed within one minute; no further diagnostic/test run followed. An initial offline TAP parser used a greedy name expression and asserted zero parsed leaves; it was corrected to a non-newline name expression and only the **existing logs** were reparsed. See `offline-parser-note.txt`; no test was rerun.

### Conclusion

**Not reproduced in this selected subset.**

The earlier full-suite head-12 result remains **FAILED / HELD unchanged**. This diagnostic pair is not qualification.

## Unmet Criteria

None for this narrowly assigned diagnostic pair. No commit was made, as explicitly instructed. The inherited qualification hold is unchanged and is not resolved by these selected-file observations.

## Residual Risk

The cause of the earlier three full-suite timeouts remains unknown. This subset observation supplies no wider qualification or causal conclusion. No additional investigation, run, source fix, timeout change, publication or push was performed.
