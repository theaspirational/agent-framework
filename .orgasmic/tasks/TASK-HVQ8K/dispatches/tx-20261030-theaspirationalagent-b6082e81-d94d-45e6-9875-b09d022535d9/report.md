# Re-review — TASK-HVQ8K R1 fix round 2 (PR #906), 89fbae88..f3f0627a

## Verdict

**Approve.** Both MEDIUM residues from my previous review are genuinely fixed, not
papered over: I re-ran my own `order.mjs` and `budget.mjs` probes against the built
head and both now pass (a 70-item held burst is fully accepted with 70 hook calls;
a descending-latency hook preserves `0,1,2,3,4`). The three LOWs are addressed. Full
`npm test` on Node 22.23.3 at `f3f0627a` reproduces the claimed **9623 pass / 0 fail /
63 skip / 9686 total** exactly. The disposition and PR body are accurate on every
claim I could falsify; the "toolset result adoption" overclaim is corrected. No new
HIGH or MEDIUM. One LOW (an undocumented consequence of the serialized drain), plus
residual risks worth naming to the maintainer.

I probed the drain for the failure modes the brief named — deadlock, starvation,
loss, duplication, mid-drain pause/reconnect, live control/ping/RPC, transport
boundary release — and found none.

## Findings

### LOW — docs/perf: an active drain serializes *live* traffic too, and self-sustains under load
`src/mcpl/server-connection.ts:1097-1100` holds every `channels-incoming` /
`push-event` / `inference-request` while `requiredFlushActive`, and
`flushRequiredHeld` (`:925-955`) keeps looping while the buffer is non-empty. So a
drain triggered by *any* backlog (startup staging included) does not just serialize
the backlog: it captures subsequently arriving live data and keeps itself alive as
long as arrivals outpace one-handler-at-a-time service. Required ingress throughput
during that window is `1 / callback-latency`, not `64 / callback-latency`.

Probes (`$ORGASMIC_EVIDENCE_DIR/drain-live.mjs`, `drain-flood.mjs`, real WebSocket fixture):
- 2 held items + 20 live `push/event` requests, 50 ms hook:
  `{"mode":"backlog","calls":22,"maxInflight":1,"ms":1161,...}` vs no backlog
  `{"mode":"live","calls":20,"maxInflight":20,"ms":103,...}` — ~11x slower, concurrency 1.
- 1 held item + 1200 live `push/event` **notifications**, 10 ms hook, after 1.5 s:
  required `{"peekHeld":859,"dropped":200,"calls":142}`; unconfigured
  `{"peekHeld":0,"dropped":0,"calls":0}`. The 200 are dropped at
  `MAX_HELD_NOTIFICATIONS` (`server-connection.ts:1226-1230`), which has no wire receipt.

**Not a regression of this round — it is a net improvement.** At `89fbae88` the same
flood met `run()`'s unchanged `if (this.pending.size >= MAX_PENDING_ADMISSIONS) return
refusal('admission_denied')` (`inbound-admission.ts:165`) with no hold guard at all, so
~1136 of the 1200 were refused immediately instead of 200 being dropped. For a burst the
new 1-wide / 1000-deep regime loses strictly less.

What is missing is the consequence, not the mechanism: `docs/required-inbound-admission.md:47-50`
does say "New data arriving during the drain joins the same bounded hold buffer" and "A
slow handler delays later held data", and the PR body hedges with "without a backlog". Neither
states that this makes required ingress single-flight for the whole drain, nor that the hold
cap then drops notifications under sustained load. A maintainer reading "controls and RPC
responses remain live" will not predict the 11x figure.

Fix direction: one sentence in the doc and the changelog — while a backlog is draining,
required data (held and newly arriving) is admitted one at a time, so sustained ingress
above roughly one item per callback latency accumulates in the hold buffer and is dropped
or refused at the existing hold bounds. A bounded-concurrency ordered drain (up to
`MAX_PENDING_ADMISSIONS` in flight, committed in arrival order) would remove the ceiling
without losing the ordering guarantee, but that is a design change, not a fix for this round.

## Per-item judgement

| item | resolved | evidence |
| --- | --- | --- |
| MEDIUM 1 (flush burst > 64 refused) | yes | `flushRequiredHeld` dispatches one item at a time and awaits `waitForCapacity()` (`inbound-admission.ts:159-162`) rather than letting held work hit the budget; waiters are released in `run()`'s `finally` (`:185-189`). `budget.mjs` rerun at this head: required `hookCalls: 70 tally: {"accepted":70}` (was `64` / `6 refused`); unconfigured unchanged at `{"accepted":70}`. |
| MEDIUM 2 (concurrent flush reorders) | yes | `order.mjs` rerun: `plain 0,1,2,3,4`, `equal 0,1,2,3,4`, **`stagger 0,1,2,3,4`** (was `4,3,2,1,0`). `drain-order-mixed.mjs` additionally proves arrival order is preserved *across* the backlog/live boundary under descending latency: `admitOrder e0..e7`, `contextOrder 0..7`, 8/8 accepted, buffer empty. |
| LOW 1 (toolset-adoption overclaim) | yes | Test renamed to `required generic result taps remain usable by an explicitly attached controller scaffold`; `docs/…:53-56` now says the generic tap is preserved and the framework does not use it for `toolsets/*` state; the PR body says the same. New assertion `inner.toolsetHub?.get('editor') === undefined` on both the first connect and after a reconnect, with the peer declaring `toolHints`/`toolsets`. |
| LOW 2 (silent `toolHints: true` override) | yes | `framework.ts:33464-33466` logs once in `connectHeldMcplServer`, which is reached only from `connectMcplServerInternal` (`:32340` startup, `:34167` operator connect) — the connection's own retry loop does not re-enter it. The test asserts `warnings().length === (toolHints === true ? 1 : 0)` **before and after** a real `f.disconnect()`/reconnect. Chosen over `serverConfigProblems`, as the maintainer offered. |
| LOW 3 (duplicate AST inventory) | yes | `test/routing-runtime-has-no-connector-literals.test.ts` deleted, its extra `eidoverse` term folded into the surviving check (`mcpl-admission-compatibility.test.ts:41`). The deleted file was introduced by this PR at `95f47c00` and does **not** exist at the upstream base `48f26ce5`, so no upstream coverage is lost. (`origin/main` has it only because it is the fork's main with this PR merged.) `eidoverse` is pre-existing upstream vocabulary, not an internal name. `dist/test/routing-runtime-has-no-connector-literals.js` absent after `clean` + `build`. |

### Drain robustness probes (all clean)

| what | probe | result |
| --- | --- | --- |
| control/ping/RPC live mid-drain | `drain-live-controls.mjs` | during a 4.5 s drain: `ping` answered in **1 ms**, `channels/register` answered in **1 ms** with `{"registered":["c1"]}`; all 3 held items accepted, buffer empty |
| pause mid-drain | `drain-boundary.mjs pause` | drain stops (`pausedCalls 2`, 4 still held), resume completes all 6 **in arrival order** `e0..e5`, nothing lost or duplicated, `requiredFlushActive false` |
| transport boundary mid-drain | `drain-boundary.mjs drop` | waiter released immediately; remaining 4 logged `dropped 4 held message(s) from a transport that closed, with no transport to come`, in-flight item refused `admission_stale`; no hang, `requiredFlushActive false` |
| new data mid-drain | `drain-order-mixed.mjs`, `drain-live.mjs` | joins the buffer at the tail, admitted in arrival order, 100% accepted |
| >64 backlog with all 64 slots held by pre-pause live work | code + `test/mcpl-admission-held.test.ts:73-92` | drain awaits capacity; `calls === 64` immediately after `resume()`, then `64 + 2` after the live owners release |
| no deadlock in `waitForCapacity` | code read | only the single drainer waits, and live data is held while it does, so no new admission can start; every slot holder settles within `timeoutMs` (`:172`) or on `invalidate()`'s abort (`:107`), and both run `run()`'s `finally`, which drains `capacityWaiters` |
| no lost/duplicated items | code read | the item is removed from the buffer before dispatch, so a boundary cannot re-keep an in-flight item; `dispatchInboundEvent` catches synchronous throws (`:2696-2706`), so a failing handler cannot abort the drain and strand the backlog |
| unconfigured path | diff | every hunk is guarded by `requiredAdmission` / `config.inboundAdmission !== undefined` / `trackCompletion === undefined`, or is inert: the `>200` flush log ternary yields the original `synchronously` string, and `void Promise…` → `const completion = Promise…` is the same chain. No unguarded behavioural change. |

### Hygiene
- All three commits: author **and** committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, trailer `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` — consistent with the earlier ten.
- No internal names, hosts, people, paths or task ids in the commit messages, diff, docs, changelog, disposition or PR body (scanned for all of them).
- `git diff --check 89fbae88..f3f0627a` clean. Worktree clean and left exactly as found; no rebase (upstream `30825fdf` left alone, as instructed).
- New tests are substantive, not scaffolds: `mcpl-admission-held.test.ts` asserts `peak === 1` (real serialization), reconstructs storage order from a `queue.push` spy, asserts `refused.length === 0`, and checks the agent context for every `held_<i>`. The red-before gate's 8 failures match exactly what those assertions would catch at the base.

## Verification Gates

Run by me at `f3f0627ae1c00f3b235df76e2d60fcf45c30b1d4`, Node **v22.23.3** (`/opt/node/bin`), under
`XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`:

| gate | command | outcome | log |
| --- | --- | --- | --- |
| `r3-22.23.3-full` | `npm install --ignore-scripts --no-save; npm run clean; npm run build; npm test` | exit 0 — **9686 tests, 9623 pass, 0 fail, 63 skip, 505 suites**, 157 s | `gate-r3-22.23.3-full-01M6697ZWHQNCVC44F2N0KHA3X.log` |

Matches the round report's `f3f0627a` / 22.23.3 row exactly. `npm run clean` was run before
the build as the brief required, and `dist/test/routing-runtime-has-no-connector-literals.js`
is absent afterwards.

Reused, not re-run: the implementer's `r2-22.12.0-test` receipt at this same commit
(`v22.12.0`, `# tests 9686 / # pass 9623 / # fail 0 / # skipped 63`), which confirms the PR
body's second Node row. The brief named only 22.23.3 for me.

Production-path probes, run from `dist/` rather than the test runner, copied into this
evidence directory: `budget.mjs`, `order.mjs` (reruns of my previous round's probes),
`drain-live.mjs`, `drain-flood.mjs`, `drain-order-mixed.mjs`, `drain-live-controls.mjs`,
`drain-boundary.mjs`, `drain-hol.mjs`.

## Unmet criteria / test gaps

- Nothing covers the live-traffic capture described in the LOW: no test sends live data
  during an active drain and asserts the resulting concurrency, latency or hold-cap drops.
- No test exercises a held `inference-request` whose *handler* (not its admission) is slow.
  `framework.ts:34999-35003` awaits the whole `handleInferenceRequest`, so the head-of-line
  window for a held inference request is the entire inference, not the admission timeout.
  My `drain-hol.mjs` could not drive this lane end-to-end without an `inferenceRouting`
  framework policy, so this rests on code reading, not a probe.
- `test/mcpl-admission-held.test.ts:88` asserts `calls === MAX_PENDING_ADMISSIONS`
  synchronously right after `resume()`. It is correct today only because the drain's first
  act is an `await` on `waitForCapacity()`; a future reordering would make it flaky rather
  than failing.
- The reconnect case (`:123-130`) documents that kept world events are refused
  `admission_stale` after a boundary rather than re-admitted against the new grant — correct
  per the design, but it is the one place where required holding still differs from
  unconfigured holding, and it is stated only in the PR body's "Superseded-epoch work is refused".

## Residual risk

- **Single-flight drain** (the LOW): while any backlog is draining, required data — held and
  newly arriving — is admitted one at a time. Sustained ingress above ~1/callback-latency
  accumulates in the hold buffer and is then dropped (notifications) or refused with -32000
  (requests) at the existing bounds. Strictly better than the previous round's behaviour,
  but worth telling the maintainer explicitly.
- **Head-of-line blocking by a complete handler.** A held `inference-request` blocks every
  later held and live data item for the full inference. Disclosed in the round report; the
  maintainer already flagged batch latency against peer request timeouts, and hold time is
  outside the per-item admission timeout.
- A live `inference-request` or `channels/incoming` request arriving mid-drain waits in the
  hold buffer with its responder open; the peer's own request timeout may fire first.
- Kept world events across a transport boundary are refused `admission_stale` rather than
  re-admitted under the next grant (pre-existing from `89fbae88`).
- `trackHeldHandler` pairs the framework handler to the flushed item by `args[0]` identity
  (`server-connection.ts:466`). Correct today because `super.emit` forwards `args` unchanged,
  but a future wrapper or clone of `params` on the dispatch path would silently disable the
  serialization rather than fail a test.
- Unchanged from the previous round: required coalescing is refused rather than made durable;
  required connections carry no RFC-014 toolset presence; on `mayWake: true` a gate decline
  still sets the module-visible `event.triggerInference = false`; `attachAdmission` defines
  the receipt symbol `enumerable: true`, so a shallow spread copies the envelope.
- No rebase was performed; upstream main has moved to `30825fdf` and these gates do not
  speak to integration against it.

## Fix directions (priority order)

1. Add one sentence to `docs/required-inbound-admission.md` and
   `changelog.d/required-inbound-admission.added.md`: while a backlog drains, required data
   is admitted one at a time, so sustained ingress above roughly one item per callback
   latency accumulates and is dropped or refused at the existing hold bounds. Mention it in
   the disposition so the maintainer sees it here rather than in R2.
2. Optional, for a later round or the maintainer's call: replace the strictly-sequential
   drain with an ordered pipeline of up to `MAX_PENDING_ADMISSIONS` in-flight admissions that
   commits in arrival order. That keeps the ordering and no-overflow guarantees this round
   won while restoring 64-wide throughput.
3. Optional: add one test that sends live data during an active drain, so the capture
   behaviour is pinned rather than incidental.
