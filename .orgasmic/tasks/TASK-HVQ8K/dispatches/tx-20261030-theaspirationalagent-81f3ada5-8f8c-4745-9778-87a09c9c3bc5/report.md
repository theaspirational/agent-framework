# Re-review — TASK-HVQ8K R1 fix round 3 + rebase (PR #906), `f3f0627a` → `a218dfb0` on upstream `00d7d7aa`

## Verdict

**Approve.** The one new commit `a218dfb0` does what it claims and nothing more. I drove the
held-inference release on the real production path (real WebSocket fixture, real router, real
`dist/` build — not the test runner) and confirmed every property the brief named: the drain
releases at provider dispatch, stored arrival order is preserved, pre-dispatch refusal/throw/
timeout settle through the full-completion fallback, transport loss and host stop each answer
exactly once, and nothing deadlocks. The rebase is exact — `git range-diff` shows 19 `=` pairs
plus the new commit, and the PR touches **zero** files that upstream `48f26ce5..00d7d7aa`
touched. My own full `npm test` on Node 22.23.3 at `a218dfb0` reproduces the report's claimed
**9626 pass / 0 fail / 63 skip / 9689 total** exactly. All 20 commits carry the right author,
committer and trailer. The DISPOSITION and PR BODY blocks are accurate on every claim I could
falsify and contain no internal names.

No HIGH. No MEDIUM. One LOW, and it is a latent-robustness point, not shipped behaviour: the
params-identity coupling the prior round flagged was removed from `trackHeldHandler` but still
governs the `emit` hold guard, where a mismatch hangs the host instead of degrading.

## Findings

### LOW — correctness/robustness: the params-identity coupling moved rather than left, and the remaining site hard-hangs

`src/mcpl/server-connection.ts:1113-1114`

```js
if (this.requiredAdmission && this.requiredFlushActive && REQUIRED_DATA_EVENTS.has(name)
  && !(this.requiredFlushItem?.event === name && this.requiredFlushItem.args[0] === args[0])) {
  return this.hold(name, args);
}
```

`a218dfb0` changed `trackHeldHandler` from `args[0] === params` to an event-name match
(`:469-470`), and the disposition records this as *"Optional pairing hardening: fixed in
a218dfb0; trackHeldHandler pairs by synchronous event dispatch rather than params identity."*
The prior round's residual risk was concretely about *"a future wrapper or clone of `params` on
the dispatch path"*. That wrapper is still fatal — it just fails at the other site. The emit
pass-through exception is the only thing letting the flushed item through its own hold guard,
and it is still keyed on `args[0]` object identity.

**Failure scenario.** Any future dispatch-path layer that hands the handler a fresh `params`
object (a normalizer, a decorator, a redactor, a structured clone) makes `args[0] !== item.args[0]`,
so `emit` re-holds the very item the drain just removed. `flushRequiredHeld` (`:938-970`) then sees
it again via `findIndex`, re-dispatches it, and — because no handler ran, `requiredFlushCompletion`
stays `undefined` and the `if (completion …)` await is skipped — the `while` loop spins with no
`await` in the body. The event loop starves.

Demonstrated, not inferred (`$ORGASMIC_EVIDENCE_DIR/emit-identity-spin.mjs`, a wrapper that
spreads `args[0]` for `push-event` only):

| run | result |
| --- | --- |
| `plain` (head as shipped) | `{"clone":false,"heartbeatTicks":73,"admitCalls":3,"held":0,"flushActive":false}` |
| `clone` (simulated wrapper) | no output, 20 ms heartbeat never ticks, killed at 60 s (exit 143) |

**Not reachable at this head** — `dispatchInboundEvent` calls `this.emit(event, ...args)` with
`item.args` spread, so identity always holds, and `hold()` re-stores the same `args` array. So
this is LOW, not a shipped defect. Two things make it worth recording: the mismatch at the
remaining site is *strictly worse* than the one that was fixed (a `trackHeldHandler` miss only
lost serialization silently; this one hangs the host), and the disposition reads as if the
identity dependency was eliminated.

**Fix direction.** Replace the identity test with an explicit dispatch flag — set
`requiredFlushDispatching = true` around the `dispatchInboundEvent` call in `flushRequiredHeld`
and have the guard's exception read `this.requiredFlushDispatching && this.requiredFlushItem?.event === name`.
Equivalent today (no live item can arrive inside the synchronous dispatch window, which is
I/O-driven) and immune to param cloning. Cheap belt-and-braces alternative: if an item comes back
held during its own dispatch, refuse it rather than re-dispatch, so the loop can't spin.

## Per-item judgement (brief items 1–3)

### 1. `a218dfb0` — release held inference at dispatch; `trackHeldHandler` pairing

Mechanism read: `heldInferenceDispatch()` (`server-connection.ts:476-481`) is evaluated
*synchronously* as an argument at `framework.ts:35003`, inside the `connection.requiredAdmission`
branch, before the handler's first `await`. `containedInboundHandler` invokes the handler
synchronously (`framework.ts:34846`, *"Invoke immediately"*) and calls `trackCompletion`
synchronously right after (`:34862`), both while `requiredFlushItem` is still set
(`:953-957`). So both side effects land before `flushRequiredHeld` reads them. If anything on
the handler path awaited first, `requiredFlushItem` would be `undefined`,
`heldInferenceDispatch()` returns `undefined` *before* assigning, and the drain falls back to
the old full-completion await — fail-safe, not fail-open.

| brief check | result | evidence |
| --- | --- | --- |
| no reply/error/cancellation lost or doubled | **clean** | see the four probes below; every path produced exactly one answer |
| refusal/failure **before** dispatch settles correctly | **clean** | `drain-hol-prefail.mjs` — hook `throw` → one `-32600 admission_threw`; invalid verdict → one `admission_invalid`; `timeout` → one `admission_timeout` released in **365 ms** (bounded by `timeoutMs`, not hung). All three: `providerEntered: 0`, `running: 0`, `held: 0`, `flushActive: false`, later pushes all accepted in order `e0,e1,e2` |
| provider failure after dispatch | **clean** | `drain-hol2.mjs throw` — one `-32603 "provider exploded"`, drain unaffected |
| transport loss releases the waiter | **clean** | `drain-hol-boundary-slow.mjs mid` — drop mid-drain with the inference in flight: `dropped 3 held message(s) from a transport that closed`, in-flight push refused `admission_stale`, **one** `not answering request` line per open request (1001, 1002), `flushActive: false`, `held: 0`, `running: 0` |
| host stop mid-flight | **clean** | `drain-hol-stop.mjs` — `stopAll()` while the provider is blocked: exactly one `-32000 "the host stopped while handling this request"`, and re-awaiting the same reply yields the identical single answer. `afterRunning: 0` |
| arrival order of stored data kept | **clean** | `drain-hol2.mjs` (all modes): `stored: "e0,e1,e2"` with `marks` `admit:infer@19, provider-entered@19, admit:e0@20, admit:e1@47, admit:e2@75`. The released lane stores nothing — `answer()` reaches `responder.respond`/`emitTraceFn` only, never `queue.push` — so early release cannot reorder stored data |
| no new deadlock | **clean** | the race is `[completion, dispatched, boundary]`; `completion` is `.then(…).catch(…)` so it always settles, and `dispatched` is only an *additional* early-exit. Admission's slot is released before `dispatched?.()` (the `await admission.admit(...)` precedes step 5), so no slot leak into `waitForCapacity` |
| unconfigured path unchanged | **clean** | `unconfigured-inference.mjs` — `requiredAdmission: undefined (old path)`, backlog still flushes **concurrently** (3 pushes done while the provider is blocked), `ok` → result, `throw` → one `-32603`. `trackCompletion` is gated on `connection.requiredAdmission` (`framework.ts:34885`) and `heldInferenceDispatch()` is only called inside that branch. The router's `const pending = …; dispatched?.(); await pending` refactor introduces no tick boundary, so there is no unhandled-rejection window on the old path |

**HOL fix proven on the production path** (`drain-hol2.mjs`, the gap the prior round could not
probe): with the provider blocked, all three held pushes complete in **75 ms** while
`inferenceStillRunning: 1` and `infSettledBeforeProvider: false`. At the base this blocked —
the implementer's `hol-red-bounded` gate records the exact expected assertion,
`'all held data must dispatch while inference is still pending'`.

Note my older `drain-hol.mjs` still cannot reach the provider (no `inferenceRouting` policy →
`-32603`); it does usefully confirm the refusal-before-dispatch ordering (`infer, e0, e1, e2`,
3/3 accepted). `drain-hol2.mjs` supersedes it by overriding `resolveModel`.

**Rerun drain probes, all matching the previous round:**

| probe | result |
| --- | --- |
| `order.mjs` | `plain 0,1,2,3,4` · `equal 0,1,2,3,4` · **`stagger 0,1,2,3,4`** |
| `budget.mjs required` | `held: 70`, `hookCalls: 70 tally: {"accepted":70}` |
| `budget.mjs` (unconfigured) | `held: 70`, `hookCalls: 0 tally: {"accepted":70}` |
| `drain-boundary.mjs pause` | `pausedCalls 2 / pausedHeld 4`, resumes to `stored ["e0".."e5"]`, `heldLeft 0`, `flushActive false` |
| `drain-boundary.mjs drop` | `dropped 4 held message(s)`, `admission_stale`, `heldLeft 0`, `flushActive false`, `epoch 1` |

**Prior round's LOW is addressed.** The requested sentence is present verbatim in both
`docs/required-inbound-admission.md:52-57` and
`changelog.d/required-inbound-admission.added.md:7-13`, and in the disposition and PR body.
Prior fix direction 3 (a test for live capture during a drain) is now
`test/mcpl-admission-held.test.ts:174-220`, asserting `peak === 1` and
`queued === [0..21]` — real FIFO + single-flight, not a scaffold. The new tests are substantive:
the first pins `dispatched === ['0','inference','1','2']`, `answered === false`,
`running.size === 1`, and `held_0 < held_1 < held_2` in the agent context.

### 2. Rebase fidelity — exact

`git range-diff 48f26ce5..f3f0627a 00d7d7aa..a218dfb0`: pairs **1–19 all `=`**, then
`-: -------- > 20: a218dfb0`. 20 commits total. `git diff --check 00d7d7aa..a218dfb0` clean.

**Semantic interaction with upstream `48f26ce5..00d7d7aa`: none found, and the file sets are disjoint.**
`comm -12` over the two changed-file lists returns **empty** — the PR's 22 files and upstream's 9
do not intersect.

- **Chronicle `^0.5.1`** (`d92e6b55`, `95aed056`) is the only one with semantic reach: 0.5.1 stops
  normalizing object-key order, and the upstream commits only update comments in
  `src/mcpl/inbound-source.ts` and `src/tool-result-guard.ts` to say so. The PR touches neither
  and adds no storage. I verified my gate actually exercised 0.5.1:
  `node_modules/@animalabs/chronicle` is **0.5.1**, and my full suite — which stores channel and
  push data and reads the agent context back — is green on it.
- *Pre-existing upstream nit, not this PR's:* `package.json` asks `^0.5.1` while
  `package-lock.json` still pins `0.5.0`. Upstream's `d92e6b55` bumped the manifest without the
  lockfile (`git log 48f26ce5..00d7d7aa -- package-lock.json` is empty), and this PR does not touch
  the lockfile either. `npm install` reconciles to 0.5.1, so nothing is broken — worth mentioning
  to the maintainer only because a lockfile-respecting CI (`npm ci`) would test 0.5.0.
- **Test helpers / pgrep** (`7c52a683`, `ea5643d1`, `22c1b26d`) touch `pretest` (quickjs.wasm copy),
  the orphan helper's exit, and the no-reconnect probe's `ps`→`pgrep` switch. Test-harness only.
  My run used the new `pretest` and includes the added upstream tests: base `9495` → head `9689`
  total, i.e. the PR's `+194` over the new base, with the 2 new drain tests among them.

### 3. DISPOSITION / PR BODY blocks — accurate, final, no internal names

- **Internal-name scan of both blocks** (72 lines, `BEGIN DISPOSITION`..`END PR BODY`) for
  `orgasmic|tarn|HVQ8K|ABD33|VZ0CD|TASK-|run-01M|review-drop|/srv/|theaspirational|anima-research|alder|cook|<author names>|telegram|slack|worktree|ledger|astra|codex|gpt-6|claude|redacted|WO-5a|eidoverse`
  → **no hits**. (The `[redacted]/run-01M…` paths appear only in the report's own
  "Inherited evidence" prose, outside the blocks — correct.)
- **Numbers verified against the actual gate logs**, all four rows exact:
  base `00d7d7aa` 22.23.3 and 22.12.0 → `9432 / 0 / 63 / 9495`; head `a218dfb0` 22.23.3 and
  22.12.0 → `9626 / 0 / 63 / 9689`. The head/22.23.3 row also matches **my own independent run**.
- **Export and limit claims verified in source**: `src/index.ts:223` exports `admissionOf`,
  `AdmissionConnectError`, `MAX_ADMISSION_TIMEOUT_MS`, `MAX_PENDING_ADMISSIONS`, `type AdmittedEnvelope`;
  `inbound-admission.ts:6-7` gives `60_000` and `64`. `@animalabs/mcpl-core` is `0.4.0` in both
  `package.json:60` and `node_modules` — the PR body's version is right.
- **Behavioural claims spot-checked by probe**: *"Held inference releases the drain after admission
  and synchronous provider dispatch, not after model completion"* ✓; *"stop answers once and
  transport closure answers nothing"* ✓ (`-32000` once; closure logs one `not answering` and
  sends nothing); *"Required held data drains sequentially in arrival order"* ✓.
- **Author/committer/trailer on all 20 commits**: every one is author **and** committer
  `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` with trailer
  `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. No exceptions.
- One honest self-report worth crediting: the round report discloses that `hol-green`/`r3-focused`
  were run with two non-matching filenames and that the 33-test count therefore covers only two
  suites. `r3-contained` (122 passed) is the corrected run. Both match their logs.

## Verification Gates

Run by me at `a218dfb0220e86f8f1dfc4cf318e41db7c9ffd58`, Node **v22.23.3** (`/opt/node/bin`),
under `XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`:

| gate | command | outcome | log |
| --- | --- | --- | --- |
| `r3-review-22.23.3-full` | `node --version; npm install --ignore-scripts --no-save; npm run clean; npm run build; npm test` | **exit 0 — 9689 tests, 9626 pass, 0 fail, 0 cancelled, 63 skip, 505 suites, 197 s** | `gate-r3-review-22.23.3-full-01M66B6C24JPAYC501Y7QNAB9N.log` |

`npm run clean` preceded the build as the brief required. Installed Chronicle verified as `0.5.1`
after the install, so the run genuinely covers the upstream dependency bump.

**Reused, not re-run** (per the dispatch's gate receipts, same commit): the implementer's
`r3-head-22.12.0-{typecheck,build,test}` — `9626 / 0 / 63 / 9689` on `v22.12.0`, which is the PR
body's second Node row. The brief named only 22.23.3 for me. Also read, not re-run:
`gate-r3-base-*` (both Nodes, `9432 / 0 / 63 / 9495`) and the red-before gates `hol-red` /
`hol-red-bounded` / `hol-green`.

**Production-path probes**, all run from the built `dist/` against the real WebSocket fixture, not
the test runner; copied into `$ORGASMIC_EVIDENCE_DIR`:
`drain-hol2.mjs` (new: `slow|throw|cancel`), `drain-hol-prefail.mjs` (new: `throw|deny|timeout`),
`drain-hol-boundary.mjs` + `drain-hol-boundary-slow.mjs` (new: transport loss with an inference in
flight), `drain-hol-stop.mjs` (new: host stop mid-flight), `unconfigured-inference.mjs` (new:
old-path parity), `emit-identity-spin.mjs` (new: the LOW's reproduction), plus the brief's named
reruns `drain-hol.mjs`, `order.mjs`, `budget.mjs` and `drain-boundary.mjs`.

**Worktree left exactly as found**: clean, no untracked non-ignored files, detached at `a218dfb0`.
No edits, no commits, nothing written inside the tracked tree.

## Unmet criteria / test gaps

- **Nothing pins the dispatch-release boundary itself against a *cloning* dispatch path.** The LOW's
  scenario has no test; the new tests would still pass with the fragile `emit` guard in place. A
  test that wraps `emit` to clone `params` and asserts the drain still completes would pin both
  sites at once.
- `test/mcpl-admission-held.test.ts:159` asserts `inner.inferenceRouter.running.size === 1` while the
  provider is blocked, which is the right shape, but **no test bounds how many concurrent provider
  calls a held backlog can now start**. A backlog of N held inference requests now dispatches N
  concurrent inferences (previously 1). This matches the unconfigured path, which also dispatches
  its whole backlog at once, so it is parity rather than a regression — but it is undocumented and
  unpinned, and it is the one throughput property this commit *loosened* rather than tightened.
- The `timeout` branch of the pre-dispatch fallback is only covered by my probe plus the existing
  non-held `required inference timeout` test; no committed test exercises a *held* inference whose
  admission times out and asserts the drain proceeds.
- Carried forward unchanged: no committed test asserts the live-traffic concurrency/latency *cost*
  during a drain (the prior round's LOW) beyond `peak === 1`; and reconnect still refuses kept world
  events `admission_stale` rather than re-admitting them, stated only in prose.

## Residual risk

- **The LOW's latent hang.** Unreachable today; one future dispatch-path wrapper away from starving
  the event loop rather than degrading. This is the one item I would ask the maintainer to look at.
- **Concurrency the drain no longer caps.** Held inference requests now reach the provider
  concurrently (one per held item), so a large staged inference backlog fans out to the provider at
  once, on the operator's credentials. Bounded only by the hold buffer, not by `MAX_PENDING_ADMISSIONS`
  (whose slot is released before dispatch). Same as the unconfigured path; worth a sentence.
- **Single-flight drain for the storing lanes** (prior round's LOW, now documented, not changed):
  while a backlog drains, required data is admitted one at a time; sustained ingress above
  ~1/callback-latency accumulates and is dropped (notifications) or refused `-32000` (requests) at
  the existing bounds. The bounded-concurrency ordered drain remains correctly scoped as a
  maintainer-directed follow-up.
- A live `inference/request` or `channels/incoming` arriving mid-drain still waits in the hold buffer
  with its responder open; the peer's own request timeout may fire first. Hold time is outside
  `timeoutMs`, as documented.
- `attachAdmission` keeps the receipt symbol `enumerable: true`, so a shallow spread copies the
  envelope. The report explains why (existing shallow-copy paths rely on propagation; a
  descriptor-only change would risk dropping the wake cap) — a defensible call, explicitly disclosed.
- Unchanged from earlier rounds: required coalescing refused rather than made durable; no RFC-014
  toolset presence on required connections; pre-existing upstream connector policy
  (`derivePushEventChannel`'s discord branch) deliberately untouched per the manager's O4 ruling.
- Upstream `package-lock.json` lags `package.json` on Chronicle; an `npm ci`-based CI would test
  0.5.0, not the 0.5.1 these gates ran on. Upstream's to fix, not this PR's.

## Fix directions (priority order)

1. **LOW, optional for this round.** Key the `emit` hold-guard exception
   (`server-connection.ts:1113-1114`) on an explicit `requiredFlushDispatching` flag set around
   `dispatchInboundEvent` instead of `args[0]` identity, and soften the disposition's "pairing
   hardening" line to say the identity coupling remains at the emit guard. That completes the
   hardening the round claims and removes the only hang I could construct.
2. Optional, one sentence: note in `docs/required-inbound-admission.md` that a held inference
   backlog now reaches the provider concurrently (one call per held item), since the drain releases
   before the model answers — the natural reader's question after "releases at dispatch".
3. Optional, deferred by design: the bounded-concurrency ordered drain, at the maintainer's
   discretion. Correctly scoped out and documented as such.
