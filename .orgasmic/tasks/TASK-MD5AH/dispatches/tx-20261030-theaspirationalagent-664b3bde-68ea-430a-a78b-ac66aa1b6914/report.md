# Changed

- Local commit: `8414999904622471a8d3dee5b7bd0ff309855330` (`fix(gate): drop debounced events already read and answered`). No push.
- Base: upstream main `a687fa61c150dbafbedac39e1984d5b5ba3c1ab8`, confirmed by anonymous `git ls-remote` before inspection. Neither fork main nor another feature branch was used.
- `src/gate/event-gate.ts`: retain existing write placements with debounce events; filter at delivery using per-recipient host evidence; omit empty remainders and derive partial-batch lines/provenance from remaining events. Placement lifetime follows the existing buffers and eviction cap. Hook errors keep events wakeable and log once. Hosts without the optional integration retain the existing shared-line path.
- `src/framework.ts`: wire ordinary module, channel, push and message-mode heartbeat placements into the gate. The pure read check reuses `readsWriteFor`, `landedRow`, and `writeAnswered` (the answered-request watermark and channel-publication evidence used by #819). It does not settle unknown writes or introduce a seen-event tracker.
- Final publication: the normal early `onInferenceEnded` still updates status and releases the judge. An optional publication promise holds only placement-backed channel debounce checks until the stream's outer `finally`, including error, stop and disposal paths. Self-wakes and sleep are unchanged. Tests cover refused and thrown publication, shutdown, agent disposal, and unchanged judge/status timing.
- `test/debounce-seen-wake.test.ts`: real framework/tool-boundary tests and loopback MCPL channel/push traffic with a mock model; direct and inference-held 200 ms batches, partial batches with a late mid-turn arrival, stored messages, multiple residents, channel reply requirements, aborts/failures, publication cleanup, and the aggregate-render limitation.
- `test/debounce-seen-batch.test.ts`: per-agent filtering/provenance, delivery-time checks, eviction, error fallback, unchanged optional-hook behavior and judge timing.
- `changelog.d/debounce-answered-writes.fixed.md`: behavior and API disclosure. The exported `EventGate` class has optional internal-facing constructor `isWriteDone`, `evaluate(info, after)`, and `onInferenceEnded(agentName, repliesSettled)` integration. No new types are exported. These API/timing choices were approved before implementation.
- Existing tests were not edited. No lockfile, dependency, generated artifact or unrelated source changes were committed.
- Instructions read: supplied project baseline, repository `CONTRIBUTING.md`, and worker command-ownership instructions. No applicable `AGENTS.md` was present; no additional conventions/gotchas were supplied.
- The requested `gh issue view` / `gh pr view` invocations failed because the CLI had no authentication. Read the supplied read-only issue/PR JSON copies and public GitHub pages instead, as authorized; inspected #819's mechanism in the base code and #243's scope.

## Evaluate/admission call-site audit

| Site | Placement treatment |
| --- | --- |
| `AgentFramework.applyProcessResponse` | Passes the existing eligible single-message placement (`added`). Multi-message responses, module-owned channel answers and local-surface input remain unmarked, as with the existing direct scheduler wakes. |
| `AgentFramework.deliverHeartbeat` | Passes the stored/deferred placement for message-mode heartbeat/reminder text. A silent heartbeat has no message and remains unmarked. |
| `AgentFramework.admitInbound`, called by `handleMcplChannelIncoming` | Receives a placement reference before admission; ordinary `addMessage` fills it after admission. Conversation-fork paths leave it empty, preserving #819's safety restriction on writes stored past a running fork's deferral. |
| `AgentFramework.admitInbound`, called by `handleMcplPushEvent` | Same placement-reference wiring; silent events have no write. |
| `AgentFramework.admitInbound`, called by `queueCoalescedWakes` | Deliberately unmarked. Before materialization there is no placement; even a plain deferred-render wake has aggregate `allAmbient` reply requirements not represented by the latest event tags. Approved conservative exception; regression test confirms the render-batch wake still runs. |
| `EventGate.asShouldTriggerCallback` | The compatibility adapter receives content/metadata, not a host write placement. Remains unmarked; ordinary framework MCPL ingestion uses `admitInbound` instead. |
| `EventGate.evaluate` → `computeDecision` → `handleDebounce` | Forwards the optional placement for declarative and scripted debounce rules. Judge rules retain their own decision semantics and do not acquire the placement check. |

## Publication dependency audit

`routeLocusSpeech` calls `ChannelRegistry.routeSpeech` / `deliverSpeech` / `publish`. Its waits are channel lifecycle tails, channel-open transport work and `sendChannelsPublish`; they do not wait for EventGate batches or model inference. `waitForOpenChannel` consumes lifecycle promises independently of inference admission. The built-in Discord speech handler awaits transport sends/edits, not gated inference. No gate-dependent publication wait was found. Arbitrary downstream speech hooks are not an end-to-end verification target. The regression tests also exercise real loopback channel publication and controlled refusal/throw/stop/disposal while publication is pending.

# Verification Gates

Every recorded gate used `orgasmic dispatch gate <name> -- ...`. Full base/head commands use:

```sh
env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope \
  -p MemoryMax=16G -p MemorySwapMax=0 \
  env PATH=<node-bin>:$PATH AF_TEST_CONCURRENCY=4 bash -c \
  'node --version; npm install --ignore-scripts --no-save && npm run typecheck && npm run clean && npm run build && npm test'
```

Node binaries: `/opt/node/bin` (22.23.3) and `/tmp/credential-engines/node-v22.12.0-linux-x64/bin` (22.12.0).

| Gate | Commit | Result | Evidence log |
| --- | --- | --- | --- |
| `base-node22.23.3` | `a687fa61` (clean) | Install, typecheck, clean/build, suite pass: 9,405 pass / 0 fail / 63 skipped | `gate-base-node22.23.3-01M66KCQS1GW187T1W3RMW1Z63.log` |
| `base-node22.12.0` | `a687fa61` (clean) | Install, typecheck, clean/build, suite pass: 9,405 pass / 0 fail / 63 skipped | `gate-base-node22.12.0-01M66KS3ZWFD6EY7DE3V9S3DT6.log` |
| `regression-red` | Base source + initial new tests | Expected regression: 15 fail / 4 pass. Module, real channel and push cases each made 2 calls instead of 1, both direct and held. Partial-batch, multi-agent and stored-message cases also failed. | `gate-regression-red-01M66M4KVYV4AR630KSQ8B1X1D.log` |
| `targeted-final` | Pre-commit implementation | 489 pass / 0 fail, including existing gate-related tests and `heard-mid-turn-wake` unchanged | `gate-targeted-final-01M66MK77Z89HGBCFSAAXJER3N.log` |
| `regression-complete` | Pre-commit implementation | All 25 new tests pass | `gate-regression-complete-01M66MQ7XK4FSYJKYFE28747XZ.log` |
| `head-node22.23.3` | `84149999` (clean) | Install, typecheck, clean/build, suite pass: 9,430 pass / 0 fail / 63 skipped | `gate-head-node22.23.3-01M66MSAFET65BAKX3N51W1PEA.log` |
| `head-node22.12.0` | `84149999` (clean) | Install, typecheck, clean/build, suite pass: 9,430 pass / 0 fail / 63 skipped | `gate-head-node22.12.0-01M66N4MHH92VWQVWRB1ASGKSF.log` |

The narrow gates run `npm run build` followed by `node --test --test-force-exit --test-timeout=60000 dist/test/debounce-seen-*.test.js`; the broader targeted gate additionally uses concurrency 4, timeout 600000, `dist/test/*gate*.test.js` and `dist/test/heard-mid-turn-wake.test.js`. All run under the same systemd memory scope.

Intermediate development failures were corrected: the initial green attempt exposed early publication settlement; subsequent fence/harness iterations exposed a misplaced release and test typing/assertion mistakes. These are development regressions, not claimed baseline failures or flaky passes. Their raw logs remain beside the final successful evidence.

# Unmet Criteria

- None within the approved implementation scope. Both full head gates passed on the clean local commit. Final `git ls-remote` still returned `a687fa61c150dbafbedac39e1984d5b5ba3c1ab8`; no rebase was needed (`upstream-main-final.txt`).
- Opus review is manager-owned and follows this report, explicitly not an implementation prerequisite. No review is claimed here.

# Residual Risk

- Aggregate render-batch wakes deliberately remain wakeable; no aggregate tag semantics or coalescer redesign is included.
- Unknown placements, another resident's write placement, multi-message module responses and unsafe fork placements remain conservative, as in #819. #243's recipient-selection problem is not fixed.
- No live model provider or production deployment was exercised. MCPL coverage uses a real loopback WebSocket connection and the framework's admission/storage/stream/routing path with a mock model.
- Existing debounce-delivery trace counts retain their original batch accounting; the new assertions measure actual wakes/model calls and gate content rather than inferring them from that trace.
- Install/build artifacts are ignored worktree outputs, not committed changes.

BEGIN PR BODY

Fixes #814.

## Problem
Debounce could wake an agent again after it had already read and answered the events.

## Changes
- Reuse existing per-agent answered-write evidence; drop satisfied batches and retain unseen events.
- Check channel debounces after final publication settles, without delaying judge/status updates.
- Add optional internal-facing placement, read-check and publication-fence hooks to the exported `EventGate` class. Standalone defaults remain unchanged.

## Tests
- 25 new tests covering module events, loopback MCPL channels/pushes, partial/multi-agent batches, failures/aborts, evictions and publication cleanup. Initial red run: 15 failed, 4 passed.
- Node 22.23.3 and 22.12.0: install, typecheck, clean build and full suite; base 9,405 passed / 0 failed / 63 skipped, head 9,430 passed / 0 failed / 63 skipped.
- Existing tests unchanged.

## Limitations
Aggregate render-batch wakes remain conservatively wakeable. No live provider was exercised.

🤖 Assisted by GPT-6-Astra.

END PR BODY
