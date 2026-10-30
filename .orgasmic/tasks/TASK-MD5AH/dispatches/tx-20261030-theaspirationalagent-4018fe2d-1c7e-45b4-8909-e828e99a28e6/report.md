# Changed

- Local commit: `acfccc9a24e663a7c17c166a1a364bc1aeb3c2ca`, `fix(gate): preserve recipient views during debounce delivery`, on reviewed head `43df5ab0`. Existing commits were not rewritten. Author, committer and co-author trailer match the brief. No push.
- Initial upstream `ls-remote` returned `71193a9fefdba30bb2ffa1c0c092464305973491`, already the branch base; no rebase was needed at startup.
- Read all supplied bot-review summaries, inline bodies, issue comments (empty), and the full re-review. Verified findings against the reviewed source before applying changes.
- Files: `src/gate/event-gate.ts`, `src/framework.ts`, the two existing PR regression files, new `test/debounce-recipient-delivery.test.ts`, and the sibling Added/Fixed changelog fragments. No upstream tests were edited. No lockfile, dependency or generated-file changes were committed.
- The optional shared-slot hook and common-remainder trade-off were approved. Compatibility was clarified: without `getSharedSlotReaders`, batch-line grouping/placement remains exactly as before; the independently requested fence, recipient, trace and microtask fixes apply regardless. A test pins that boundary.

## Disposition table

| Finding | Disposition |
| --- | --- |
| B-M1 — divergent remainders contaminate the shared slot (`event-gate.ts:3874`) | Fixed with the approved trade-off. The framework supplies `registry.sharedSlotReaders()`. One shared summary contains only the common unseen remainder; divergent answered events are omitted from that summary, not from unread recipients’ wakes. Unit coverage exercises different remainders. A real framework test proves the original input remains in each unread resident’s window and actual model request, without re-presenting it in a shared summary to the answered resident. |
| B-M2 — partial group targets a fork instead of the shared slot (`:3872`) | Fixed. Shared summaries explicitly target a shared-slot reader; isolated recipients get their own summary in their own store. A fork-first partial-group test and a real conversation-fork test pin the store separation. The fork-only summary never enters the residents’ slot. |
| B-M3 — released recipient is no longer eligible (`:3840`) | Fixed. Release intersects the captured name with current gate recipients. Removed/deregistered or role-revoked recipients get no write and no inference request. Covered both at gate level and through framework disposal / `receivesGateWakes` revocation. |
| B-M4 — non-owner waits for an irrelevant fence (`:3857`) | Fixed. Holding requires `event.after.agent === recipient`, as well as the existing reply requirement. Other recipients wake immediately. Tests cover another owner and two simultaneous recipient fences. |
| B-M5 — trace double counts immediate/released delivery (`:3882`) | Fixed. A delivery-only flag on the existing pending event counts it once across immediate delivery and later fence release. It is not read/seen evidence. A two-recipient split-delivery test pins one count. |
| Bot LOW — copied scheduler lookup (`framework.ts:31199-31216`) | Fixed. Scheduler deferred/stored checks and `gateWriteDone` now share the pure `writeDoneFromEvidence` lookup. Scheduler-only unknown-landing settlement remains in its wrapper; fault policies remain with the callers. Wake decisions retain the same queue, un-acked row, stored row, watermark and publication checks. Existing scheduler regressions and real gate paths exercise the refactor. |
| Bot LOW — heartbeat/reminder coverage (`framework.ts:6259`) | Fixed. Four real framework tests cover heartbeat and reminder text read at a tool boundary with a 200 ms debounce, both directly firing and inference-held: one model call, not two. Removing heartbeat placement wiring makes all four fail. The Fixed fragment names this lane. |
| Bot LOW — “at most 65 seconds” claim (`debounce-answered-writes.fixed.md:5-6`) | Fixed. Documentation distinguishes the 65-second publication-fence deadline from delivery, which still waits for inference/quiesce to clear. |
| Re-review LOW-1 — two fences duplicate a shared line | Fixed by owner-only holding plus shared-summary emission bookkeeping on the existing event. An immediate summary also serves a later release into that slot. Two open recipient fences produce one shared line and preserve both wakes. Removing the summary guard is caught independently of trace deduplication. |
| Re-review LOW-2 — undisclosed trace sites/cardinality | Fixed. The changelog names debounce fire, inference/quiesce buffer flush, and fence release, including one trace per policy with newly delivered events on merged flushes. A two-policy inference-buffer test pins those counts. Field shape is unchanged; fully held/dropped batches emit none. |
| Re-review LOW-3 — stale captured recipient | Fixed together with B-M3; tests assert no write/request, not merely an empty buffer. |
| Re-review LOW-4 — queued delivery loses suppression | Fixed. Fence microtasks re-check disposal, quiesce and inference, returning still-live events to their uncapped fence when suppressed. The same small guard applies to inference-buffer microtasks, restoring older events before newer ones through the existing cap. Tests cover turn/quiesce/disposal races for both paths and oldest-first cap eviction after re-holding. |

Additional re-review gaps are pinned: an event arriving while two fences are actually open uses the older deadline; late settlement while a timed-out fence is retained cannot undo wakeability; disposal cancels the watchdog timer. All three corresponding mutations fail.

## Test changes and compatibility

- Existing upstream tests are untouched. Only regression files added by this PR were adjusted.
- Old fence fixtures now explicitly name their placement owner; an unknown owner must no longer acquire a fence.
- The earlier shared-line integration assertion now requires zero redundant summary rows after the owner answered, while proving the unread residents receive the stored input and still wake.
- Disposal checks now spy on actual gate writes/requests, and role revocation has its own case.
- No per-agent content-filter metadata, recipient-selection redesign, or parallel read tracker was added. Per-delivery memoization reuses the host read test; the event flags track only summary/trace emission.
- The shared-slot hook preserves the existing lazy single-entry `WakeLine` optimization; isolated windows receive their own stored line rather than using the shared-slot newest-entry test.

# Verification Gates

All gates use `orgasmic dispatch gate <name> -- ...`. Fresh base/head runs use:

```sh
env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope \
  -p MemoryMax=16G -p MemorySwapMax=0 \
  env PATH=<node-bin>:$PATH AF_TEST_CONCURRENCY=4 bash -c \
  'node --version; npm install --ignore-scripts --no-save && npm run typecheck && npm run clean && npm run build && npm test'
```

Node bins: `/opt/node/bin` (22.23.3), `/tmp/credential-engines/node-v22.12.0-linux-x64/bin` (22.12.0). Logs below are relative to `$ORGASMIC_EVIDENCE_DIR`; each console log includes its receipt path.

| Gate | Source / outcome | Log |
| --- | --- | --- |
| `revision-base-node22.23.3` | Clean `71193a9f`: install, typecheck, clean/build and full suite passed, 9,406 pass / 0 fail / 63 skipped | `base-node22.23.3-console.log` |
| `revision-base-node22.12.0` | Same clean base and outcome: 9,406 / 0 / 63 | `base-node22.12.0-console.log` |
| `revision-red-complete` | Reviewed `43df5ab0` runtime source with final regression tests: expected 16 failures / 44 passes | `red-complete-console.log` |
| `revision-targeted-complete` | Final implementation: typecheck, clean/build, fixtures and 525 targeted tests pass | `targeted-complete-console.log` |
| `revision-mutations` | Clean `acfccc9a`: all 14 mutations caught; baseline and restored output pass all 60 regressions | `mutations-console.log`, `mutation-*.log` |
| `revision-head-node22.23.3` | Clean `acfccc9a`: install, typecheck, clean/build and full suite passed, 9,466 pass / 0 fail / 63 skipped | `head-node22.23.3-console.log` |
| `revision-head-node22.12.0` | Same clean head and outcome: 9,466 / 0 / 63 | `head-node22.12.0-console.log` |

Targeted command inside the same memory scope:

```sh
npm run typecheck && npm run clean && npm run build && npm run pretest && \
node --import ./dist/test/helpers/force-exit-blocking-stdout.js --test \
  --test-force-exit --test-concurrency=4 --test-timeout=600000 \
  dist/test/debounce-*.test.js dist/test/*gate*.test.js dist/test/heard-mid-turn-wake.test.js
```

The red command uses clean/build/pretest followed by the same Node import/test flags with timeout 60000 and only `dist/test/debounce-*.test.js`. Reviewed runtime files were temporarily restored from Git, then the working implementation restored by an EXIT trap. The mutation command is `npm run clean && npm run build && npm run pretest && python3 "$ORGASMIC_EVIDENCE_DIR/mutations.py"`; that script records exact mutations, asserts the baseline, restores both compiled files in `finally`, and verifies green again. Mutations cover common-remainder filtering, store placement, shared-line deduplication, live audience, owner-only holding, trace deduplication, both microtask guards, reply-only fence narrowing, judge exclusion, oldest deadline, late settlement, timer cleanup, and heartbeat placement.

Development-only failures are not claimed as regressions: an initial fork fixture tried to inspect an unregistered ephemeral candidate and was corrected to use a real registered conversation fork. The first broad targeted run omitted copied `.mjs` fixtures after `clean`; its owned gate process was stopped, and the corrected run includes `npm run pretest`. Early narrow logs also lacked the blocking-stdout import; only the complete red/targeted/mutation runs above supply final counts. The corrected red run independently confirms all behavioral failures against the reviewed implementation.

## Inherited evidence

No earlier full-suite pass is reused. The original #814 module/channel/push reproduction and the earlier placement-admission/publication dependency audits remain context for unchanged paths, not current receipts. This round reruns those regression paths, adds heartbeat and real recipient/store checks, and reruns all assigned base/head gates. The existing aggregate-render exception remains pinned: `queueCoalescedWakes` stays unmarked because aggregate reply requirements cannot be inferred from the latest event’s tags. Ordinary module, channel, push and heartbeat placement wiring remains as previously audited; only the shared evidence lookup and registry-backed shared-slot hook changed in the framework.

# Unmet Criteria

None. All 12 findings are addressed, including the approved common-remainder trade-off. Final upstream `ls-remote` still returned `71193a9fefdba30bb2ffa1c0c092464305973491` (`upstream-main-final.txt`), so no rebase was needed. Both full head gates passed on the clean reported commit. No push, merge or landing was performed.

# Residual Risk

- A single shared row cannot represent divergent per-resident summaries. The approved trade-off omits divergent events from that summary while preserving original stored input and each unread recipient’s wake/provenance. Standalone hosts without the new optional hook retain legacy summary placement.
- A timed-out fence keeps its wake without guessing at a fresh shared summary. A publication chain beyond 65 seconds conservatively keeps its wake; ordinary inference/quiesce can postpone actual delivery longer. Publication-held lists remain deliberately uncapped and visible in diagnostics.
- Aggregate renders, unknown/unsafe placements and other residents’ placements remain conservatively wakeable; recipient selection is not redesigned.
- No live model provider or production deployment was exercised. MCPL coverage uses a real loopback connection with a mock model. No independent follow-up review is claimed.

BEGIN BOT REPLY

Addressed in `acfccc9a` (line anchors refer to the reviewed revision):

- **Different per-recipient remainders** — `event-gate.ts:3874`: use the common unseen remainder for the shared slot. Trade-off: divergent summaries are omitted rather than re-presented to answered residents; unread recipients retain their original stored input and wakes.
- **Partial-group line targets a fork** — `event-gate.ts:3872`: optional `getSharedSlotReaders()` selects a shared-slot target, while isolated recipients receive summaries in their own windows. Legacy line grouping/placement remains when the hook is absent.
- **Fence release uses stale recipients** — `event-gate.ts:3840`: intersect with current gate recipients; disposal and role-loss tests require no write or inference request.
- **Non-owner fence delays** — `event-gate.ts:3857`: hold only when the placement owner is the recipient.
- **Double-counted delivery trace** — `event-gate.ts:3882`: count each event once across immediate delivery and fence release; document all emission sites and merged-flush cardinality. Shared summary emission is also deduplicated.
- **Copied evidence logic** — `framework.ts:31199-31216`: gate and scheduler checks share a pure lookup, retaining scheduler-only settlement and caller-specific fault handling.
- **Heartbeat/reminder coverage** — `framework.ts:6259`: four tool-boundary tests cover direct and inference-held 200 ms batches. Removing placement wiring fails all four.
- **65-second bound wording** — `debounce-answered-writes.fixed.md:5-6`: clarify that the deadline releases publication holds, while actual delivery still waits for inference/quiesce.

Queued deliveries also re-check disposal/inference/quiesce before writing. Verification: 60 regression tests, 14 caught mutations, and full base/head gates on Node 22.23.3 and 22.12.0. No upstream tests were edited.

END BOT REPLY

BEGIN PR BODY

Fixes #814.

Debounced batches reuse the scheduler’s per-agent answered-write evidence: fully satisfied batches produce no wake, while partial batches retain unseen events.

- Per-agent publication fences hold only the placement owner, outside the capped inference buffer. Their 65-second deadline keeps events wakeable; delivery still waits for inference/quiesce to clear.
- Optional `getSharedSlotReaders()` gives isolated recipients their own summaries. Shared summaries omit divergent answered events rather than re-presenting them; original stored input and unread recipients’ wakes remain.
- Fence release checks current recipients; queued deliveries re-check disposal/inference/quiesce. Shared summary emission and delivery counts are deduplicated across immediate delivery and release.
- Share the scheduler’s evidence lookup, document all debounce trace emission sites, and retain legacy line placement when the new hook is absent.

Verification: 60 regression tests cover module/tool-boundary events, loopback MCPL channels/pushes, heartbeat/reminders, partial and multi-agent batches, fork windows, aborts, buffer overflow, deadlines and disposal. The new round reproduces 16 failures before the fix; all 14 targeted mutations are caught. Node 22.23.3 and 22.12.0 pass install, typecheck, clean build and full tests: base 9,406 passed; head 9,466 passed; zero failures and 63 skips each. Upstream tests are unchanged by this PR.

Aggregate render-batch wakes remain conservatively wakeable. No live provider was exercised.

END PR BODY
