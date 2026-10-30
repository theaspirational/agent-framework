# Changed

- Follow-up commit: `43df5ab0799db0aeea7b682dc3666a335007f3fa`, `fix(gate): bound publication fences per recipient`. No push.
- Upstream main moved twice: first from `a687fa61` to release commit `ae4d8aa0`, then at the end-of-gates check to `71193a9fefdba30bb2ffa1c0c092464305973491` (CI workflow changes and one additional workflow-pin test). Rebased both times without squashing or rewording. The original `84149999` is now `4f6a4295f45ac8ac13c2d242abe3d9c070cbf344`; the follow-up was initially `559c9ebe` and is now `43df5ab0`. Both patches compare identical across rebase (`rebase-range-diff.txt`, `rebase-final-range-diff.txt`). Both commits retain the requested author, committer and co-author trailer (`commits.txt`). Read the changed CONTRIBUTING instructions; the brief’s explicit concurrency/typecheck gates remain in force.
- Read the supplied review in full and verified the findings against the reviewed source before changing it.
- Changed this round: `src/gate/event-gate.ts`, the two existing `test/debounce-seen-*.test.ts` regression files, and sibling `.fixed.md` / `.added.md` changelog fragments. No dependency, lockfile, generated-file or unrelated source edits were committed. All upstream tests remain unchanged.

## Finding dispositions

| Finding | Disposition and evidence |
| --- | --- |
| MEDIUM-1: publication holds consume the capped inference buffer | Fixed. Dedicated per-agent fence lists never enter the capped inference buffer, including when settlement happens during a new turn or quiesce. Diagnostics count distinct held events. Tests retain and deliver all 125 unseen events, with zero cap evictions; the existing inference-cap test still pins its unchanged 100-event behavior. |
| MEDIUM-2(a): global publication coupling | Fixed. Fences and retained recipient deliveries are keyed by agent. A two-recipient batch wakes the unfenced recipient immediately, then wakes only the fenced recipient after settlement. |
| MEDIUM-2(b): unbounded publication wait | Fixed. Internal `PUBLICATION_FENCE_TIMEOUT_MS = 65_000`: one 60-second MCPL publish-request timeout plus five seconds of teardown allowance. Longer chains or non-conforming streams conservatively get an extra wake rather than an indefinitely fenced batch. Timeout bypasses the answered-write check, logs once per fence, and late settlement is idempotent. Independent overlapping fences cannot extend an older batch deadline. Timers are cleared at settlement/disposal and unreferenced. Fake-timer tests pin deadline, wakeability, overlapping deadlines, late settlement and disposal. Ordinary inference/quiesce suppression still applies after a fence expires. |
| M6: fence narrowing test gap | Fixed. A mixed batch pins module, ambient, system and unplaced events as immediately deliverable; only `after && replyTo` waits. The reviewer’s broadening mutation now fails that test. |
| M8: judge placement test gap | Fixed. The judge/status timing test now supplies a placement and a read hook that would drop it. Removing `!judge` from placement admission now fails that test. |
| LOW-1: multi-recipient remainder line | Used the permitted documented shared-slot alternative. Ordinary residents read the same message slot, so writing an identical remainder once per resident duplicates stored content. The code explains this reliance; a three-recipient unit test pins one line for the two unsatisfied recipients, and a real framework test confirms both recipients see exactly the same single stored row and both wake. Separate/forked views and recipient selection remain outside scope. |
| LOW-2: inaccurate debounce-delivery trace | Fixed without changing the trace shape. Counts describe distinct events actually delivered in that delivery occurrence, by policy, not the incoming batch size. Fully held or fully satisfied batches emit no delivery trace. Released batches trace their actual delivery. Tests pin fully dropped, partial and publication-held counts. |
| LOW-3: lifetime-only fault warning | Fixed. Read-check faults retain their wakes and log at most once per minute, matching the scheduler’s warning cadence. A fake-clock test pins suppression within the window and renewed logging afterward. |
| LOW-4: API bullet filed under Fixed | Fixed. Moved the optional host-integration API bullet into `changelog.d/debounce-answered-writes.added.md`. Behavior, deadline and trace changes remain in the Fixed fragment. No additional public API was introduced this round. |

## Retained call-site audit

The original framework wiring is unchanged by this round; `src/framework.ts` is identical to the reviewed implementation. Neither upstream change altered runtime source; the latter changed the CI-pin test only. These previously inspected/reviewed conclusions are inherited context, not substituted gate receipts:

| Site | Placement treatment |
| --- | --- |
| `applyProcessResponse` | Existing eligible single-message placement; multi-message and module-owned channel responses remain unmarked. |
| `deliverHeartbeat` | Message-mode heartbeat/reminder placement; silent heartbeat has no write. |
| `admitInbound` from channel incoming | Shared placement reference filled by ordinary storage; unsafe conversation-fork paths remain unknown. |
| `admitInbound` from push events | Same reference wiring; silent events have no write. |
| `admitInbound` from `queueCoalescedWakes` | Deliberately unmarked: aggregate `allAmbient` requirements are not represented by the latest event’s tags. The existing real-path render-batch test still requires a wake. |
| `asShouldTriggerCallback` | Compatibility adapter has no host placement; unchanged. |
| `evaluate` → `computeDecision` → `handleDebounce` | Ordinary debounce receives placement; judge batches do not. |

The read check continues to reuse `readsWriteFor`, `landedRow` and `writeAnswered`; no parallel seen-event tracker was added. The reviewed publication dependency audit remains applicable: lifecycle/transport publication does not await the gate or inference, and the outer stream `finally` settles the host promise on every exit. The new watchdog additionally bounds a stalled stream’s fence.

# Verification Gates

No earlier full-suite receipt was reused. After the second rebase, both base gates were rerun on clean `71193a9f`; both head gates were rerun on clean `43df5ab0`. Every gate used `orgasmic dispatch gate <name> -- ...`, with this scope:

```sh
env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope \
  -p MemoryMax=16G -p MemorySwapMax=0 \
  env PATH=<node-bin>:$PATH AF_TEST_CONCURRENCY=4 bash -c \
  'node --version; npm install --ignore-scripts --no-save && npm run typecheck && npm run clean && npm run build && npm test'
```

Node bins: `/opt/node/bin` (22.23.3) and `/tmp/credential-engines/node-v22.12.0-linux-x64/bin` (22.12.0). Logs below are relative to `$ORGASMIC_EVIDENCE_DIR`; console logs include the recorded gate receipt path.

| Gate | Result | Log |
| --- | --- | --- |
| `round2-rebased-base-node22.23.3` | Install, typecheck, clean/build and full suite passed: 9,406 pass / 0 fail / 63 skipped | `rebased-base-node22.23.3-console.log` |
| `round2-rebased-base-node22.12.0` | Same: 9,406 pass / 0 fail / 63 skipped | `rebased-base-node22.12.0-console.log` |
| `round2-regression-red` | Reviewed source plus expanded tests: expected 7 failures / 29 passes. Failures cover cap loss, cross-agent coupling, deadline/overlap, re-holding during turn/quiesce, trace counts and warning throttle. | `regression-red-console.log` |
| `round2-targeted` | Typecheck/build and 501 targeted tests passed, including existing gate tests and heard-mid-turn wakes | `targeted-console.log` |
| `round2-mutations` | M6 and M8 each fail their designated regression; restored build passes all 36 regression tests | `mutations-console.log`, `mutation-M6.log`, `mutation-M8.log`, `mutation-restored-green.log` |
| `round2-rebased-head-node22.23.3` | Install, typecheck, clean/build and full suite passed: 9,442 pass / 0 fail / 63 skipped | `rebased-head-node22.23.3-console.log` |
| `round2-rebased-mutations` | Clean final commit: M6 and M8 each fail the designated test; restored build passes all 36 regressions | `rebased-mutations-console.log`, `rebased-mutation-M6.log`, `rebased-mutation-M8.log`, `rebased-mutation-restored-green.log` |
| `round2-rebased-head-node22.12.0` | Same: 9,442 pass / 0 fail / 63 skipped | `rebased-head-node22.12.0-console.log` |

Targeted command inside the same scope: `npm run typecheck && npm run build && node --test --test-force-exit --test-concurrency=4 --test-timeout=600000 dist/test/debounce-seen-*.test.js dist/test/*gate*.test.js dist/test/heard-mid-turn-wake.test.js`. Red command: `npm run build && node --test --test-force-exit --test-timeout=60000 dist/test/debounce-seen-*.test.js`. Mutation command: `npm run build && python3 "$ORGASMIC_EVIDENCE_DIR/check-mutations.py"`; the script records both exact compiled-output mutations and always restores the original file. The final clean-commit mutation gate uses the same command with `check-rebased-mutations.py`, which writes separate rebased logs.

Superseded (not reused) full runs before the final rebase also passed: both Nodes at base `ae4d8aa0` had 9,405 pass / 0 fail / 63 skipped (`base-node22.23.3-console.log`, `base-node22.12.0-console.log`); head `559c9ebe` had 9,441 pass / 0 fail / 63 skipped (`head-node22.23.3-console.log`, `head-node22.12.0-console.log`). The new base/head each gain the same one upstream CI-pin test. The pre-rebase scoped red/targeted/mutation results above retain their exact tested runtime/test inputs: neither replay changed those patches, and the upstream CI-pin test is outside those selected files. They are not substituted for the final full-suite receipts.

Inherited behavioral evidence: the original red reproduction on source `a687fa61` had 15 failures / 4 passes, including module/channel/push direct and held cases making two calls instead of one. That source is unchanged in release `ae4d8aa0`; this conclusion remains relevant, but its old receipt is not claimed as a current head gate. All 25 original regressions plus 11 additional tests run again here. The shared-slot integration test uses the real framework/storage path; MCPL tests use a real loopback WebSocket with a mock model.

# Unmet Criteria

None. All requested findings and test gaps are addressed, with LOW-1 taking the explicitly permitted shared-slot documentation alternative. Final full gates pass on the clean reported commit. Final anonymous `git ls-remote` still returned `71193a9fefdba30bb2ffa1c0c092464305973491` (`upstream-main-final-confirmed.txt`). No push, merge or landing was performed.

# Residual Risk

- A publication chain lasting over 65 seconds may conservatively produce an extra wake. Deadline release does not override ordinary inference/quiesce holds, channel tune-out, or host disposal.
- Publication-held events are intentionally uncapped while retained; ordinary inference buffering retains its existing cap. Counts remain visible in diagnostics.
- Aggregate render batches, unknown/unsafe placements and another resident’s placement remain conservatively wakeable. Recipient-selection behavior and separate resident/fork views are not redesigned.
- No live model provider or production deployment was exercised. No additional independent review is claimed; this report is ready for the manager-owned follow-up review.

BEGIN PR BODY

Fixes #814.

Debounced batches now reuse the scheduler’s per-agent answered-write evidence: fully satisfied batches produce no wake, while partial batches retain unseen events.

- Channel checks wait only on the recipient’s own publication fence, outside the capped inference buffer.
- A 65-second deadline (60-second publish timeout plus teardown allowance) releases held events as wakeable and logs once. Judge/status timing is unchanged.
- Correct delivery trace counts, throttle check-fault warnings, and document the optional host-integration API separately.
- Keep one shared line per identical remainder group, avoiding duplicate writes in residents’ shared message slot.

Verification: 36 regression tests cover module/tool-boundary events, loopback MCPL channels/pushes, partial and multi-agent batches, aborts, buffer overflow, deadlines and disposal. Both previously surviving mutations are caught. Node 22.23.3 and 22.12.0 pass install, typecheck, clean build and full tests: base 9,406 passed; head 9,442 passed; zero failures and 63 skips each. Upstream tests are unchanged by this PR.

Aggregate render-batch wakes remain conservatively wakeable. No live provider was exercised.

END PR BODY
