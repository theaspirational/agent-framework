# Review — TASK-HJV3J slice B, re-review after fix + rebase

Head `27a321276c8c03efe3fbc810029d25d53ec04572` on refreshed A `869bb3add7b48893d48b2ce50ea423e4b33fdfbc`
(upstream ancestor `a64cfc010f4df5090c698e9fa7926b1d3aa0dc5a`, confirmed by `git merge-base --is-ancestor`).
Previous review: `/srv/review-drop/TASK-HJV3J-NARROW-REVIEW.md` (APPROVE, MEDIUM-1 + LOW-1..8).
Worker report: `/srv/review-drop/TASK-HJV3J-FIX-A869.md`. Read-only; worktree left clean at this commit.

## Verdict

**APPROVE.**

All four narrowed commits survive the rebase byte-identically, A's `inbound-admission.ts` is untouched,
and fix commit `27a32127` genuinely closes MEDIUM-1 and all eight LOW findings. I re-ran the six
mutation probes myself and all six are killed. I ran my own full Node 22.23.3 gate (exit 0) and
reproduced the implementer's head counts exactly.

The two behavioural changes the brief singled out are both sound, and I could not construct the
failure paths it asked about: no host callback can observe a mutable `item` after the detach move,
and a throwing consumer can neither wake an accepted verdict without a binding nor leak exception
text to the agent. Findings below are two LOW items (one test-precision, one observability); neither
blocks ship.

### Brief checklist

| Check | Result |
| --- | --- |
| (1) range-diff `=` for all four commits; zero diff to `inbound-admission.ts` | **PASS** — reproduced independently |
| (2) fix commit closes MEDIUM-1 + LOW-1..8 | **PASS** — all nine closed; LOW-4/LOW-5 analysed in depth below |
| (3) re-run P2/P5/P7/P8/P11/P12 | **PASS** — all six killed in my own harness |
| (4) hygiene: no internal names or slice letters | **PASS** |
| (5) own full gate, Node 22.23.3, under the named scope | **PASS** — exit 0, 9703/0/63 of 9766 |

## (1) Rebase equivalence

```
$ git range-diff c848977f..bf6e8e0e 869bb3ad..27a32127
1:  76f3e407 = 1:  5aa8c3a5 feat(mcpl): expose a separate post-admission consumer
2:  248b0f58 = 2:  b3f696d2 feat(mcpl): authorize optional frozen automatic replies
3:  0612cffe = 3:  1ba34438 feat(runtime): retain every shared reply cause through turn ownership
4:  bf6e8e0e = 4:  6ea739f7 docs(mcpl): describe admitted work and separate reply authority
-:  -------- > 5:  27a32127 fix(routing): pin authority guards and fail closed across consumers
```

All four original patches are `=`. `git diff 869bb3ad..27a32127 -- src/mcpl/inbound-admission.ts` is
**0 lines**; the blob hash is identical on both sides (`8ffa59a3`). `869bb3ad` descends from upstream
`a64cfc01`, and `27a32127` descends from `869bb3ad`. All five commits are authored *and* committed as
`Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` with a single
`Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>` trailer. (The task's acceptance text names a
`GPT-6-Astra` trailer; the trailer correctly names the model that actually assisted this round, which
changed between rounds. Not a defect, but worth confirming with the owner before publication.)

## (2) Does `27a32127` close the findings?

| Finding | Closed | Evidence |
| --- | --- | --- |
| MEDIUM-1 config validation untested | **Yes** | 10 table-driven cases, `test/mcp-protocol-family.test.ts:640-657` (8 reject + 2 accepting boundaries `1`/`60000` asserting `deepEqual(problems, [])`). P11 kills 5, P12 kills 1. See LOW-1 for a precision caveat. |
| LOW-1 `authorize` truthiness | **Yes** | 6 cases `test/reply-routing-core.test.ts:147-154` over `1 / 'true' / {} / undefined / null / 0`; each asserts no destination **and** `replyBindingCurrent === false`. P8 kills the 3 truthy cases. |
| LOW-2 outer destination layers | **Yes** | Direct unit tests `test/reply-routing-core.test.ts:156-176`. `turnReply` mixed → `destination === undefined` (kills P2). `shareReplyTurn` tested over three mixed combinations including `work(a,b) vs work(same)` and `work(a) vs work(same,b)`, which specifically require the full `[...aa,...bb].every(...)` (kills P5), plus a compatible control asserting `true`. |
| LOW-3 `!verdict.mayWake` early return | **Yes** | `test/reply-routing-core.test.ts:178-184` invokes `replyConsumer` directly with `{store:true,mayWake:false}`, asserting `{}` **and** `resolves === 0`. Kills P7. |
| LOW-4 `detach()` ahead of the verdict gate | **Yes** | `detach(item)` moved inside the `verdict.store && verdict.mayWake && !admission.check()` block (`src/mcpl/reply-admission.ts:36`). Three controls (refused / read-only / stale) pass a `Proxy` whose `ownKeys` throws and assert `reads === 0` (`test/reply-admission.test.ts:53-66`). Analysis below. |
| LOW-5 two fail-open seams | **Yes** | `try`/`catch` now wraps input construction *and* `consume` (`reply-admission.ts:35-46`); `pending++` moved to the first statement inside the `try` (`reply-routing.ts:108`) with `pending--` first in `finally` (`:136`) and `abort` guarded. Analysis below. |
| LOW-6 slice vocabulary in shipped files | **Yes** | Zero slice-letter prose in all five B-authored files. The only surviving `A`/`B` comment, `src/framework.ts:19943`, is present verbatim at the base (`869bb3ad:src/framework.ts:19864`) and uses A/B as generic *sender* placeholders. |
| LOW-7 bound-wake drop exemption undocumented | **Yes** | `docs/reply-routing.md:93-97` discloses it explicitly, including private admitted work. Differential test for both lanes (`test/reply-routing.test.ts:734-753`): real `markAnswered`/`notePublished` watermarks, asserts `deferredWriteDone`/`storedMessageDone` **would** consume an ordinary wake, that the bound wake still runs, and that the same request with `[replyWork]` destructured away **is** dropped. |
| LOW-8 divergent owner fallbacks | **Yes** | `src/framework.ts:16916` and `:17027` are now byte-identical. Verified zero behaviour change: `routingOf` (`:22465`) creates a fresh `TurnRouting` when absent and **never returns undefined**, so `replyStreamOwners.set(stream, streamRouting)` (`:24802`) always stores a defined value and the `?? openLogical.get(...)` arm is unreachable. `ownedReply` (`:1551`) additionally returns `{}` unless `routing.reply` is set. |

### LOW-4 — can a host callback now see a mutable `item`?

**No.** Two independent reasons:

1. A never hands the original object to any host callback. `RequiredAdmission.admit` builds
   `input` with `item: snapshot(item)` and passes that to `binding.admit(input)`
   (`src/mcpl/inbound-admission.ts:132`). `snapshot` is the same descriptor-walking deep copy as
   `detach` (`:53-65`, `value: snapshot(descriptor.value)`), so it neither runs accessors nor
   exposes the original. No other host-supplied function in the admission path receives `item`.
2. There is no suspension point between the verdict and the snapshot. In
   `reply-admission.ts`, `await admission.admit(...)` (`:33`) is followed by the gate (`:34`) and
   `detach(item)` (`:36`) with no intervening `await`, so nothing can run between A's verdict and
   the copy.

The move is therefore a strict improvement: it restores A's deliberate cheap-refusal ordering
(A returns `admission_denied` on overload at `inbound-admission.ts:165` *before* its own
`snapshot`), and because `detach` is now inside the `try`, a `detach` throw fails closed to private
instead of silently handing the consumer `item: undefined` as it did before.

### LOW-5 — can an accepted verdict wake without a binding, or exception text reach the agent?

**Neither.**

*No unbound accepted wake.* Every return path of the shipped consumer carries `routing`:
`reply-routing.ts:104` (overload cap), `:122` (aborted/malformed), `:126` (bad `channelId`),
`:132` (both arms), `:134` (catch) — all `privateWork()` or `mint(...)`. The only `return {}`
(`:102`) is the `!verdict.mayWake` arm, which the wrapper's own gate already excludes. And if a
custom `postAdmissionConsumer` throws, or returns a non-object so that
`Object.hasOwn(result,'routing')` throws, the new catch mints `privateReplyBinding(admission.key)`
(`reply-admission.ts:41`), so a receipt is always present. Pinned by
`test/reply-admission.test.ts:68-85`, which asserts `verdict.store === true`,
`Reflect.ownKeys(verdict) === ['store','mayWake']`, a real binding with
`destination === undefined` and `replyBindingCurrent === false`, and A's
`pending.size === 0` (no slot leak or double release).

*No exception text to the agent.* No `catch` in either module binds the error
(`reply-admission.ts:40`, `reply-routing.ts:130,133`). Both diagnostics are fixed string literals
written to `console.error` — i.e. stderr, not agent context. The agent-visible text is the module
constant `privateReplyNotice` (`reply-routing.ts:27`), which interpolates nothing. Pinned twice:
the unit test asserts `!JSON.stringify(logs).includes('private callback detail')`, and the
real-stdio test asserts the agent's own context manager contains `'prose stays private'` but **not**
`'private consumer detail'` (`test/reply-routing-transport.test.ts:541-550`).

*Pending-slot balance.* `pending++` is the first statement in the `try` and `pending--` the first in
`finally`; the `pending >= 64` early return precedes the `try`, so it neither increments nor
decrements. The new test at `test/reply-routing-core.test.ts:186-199` injects 64 consecutive
`addEventListener` throws and then asserts a 65th call still resolves (`resolves === 1`,
`replyBindingCurrent === true`) — which fails if even one slot leaks.

## (4) Hygiene

- No internal names, task ids, hosts or run ids anywhere in `869bb3ad..27a32127`
  (`grep -inE 'hjv3j|orgasmic|tarn|nissa|alder|soma|anarchid|TASK-[0-9A-Z]{5}|review-drop'` → only
  `eidoverse` inside `connectorVocabulary`, which is the AST gate's *forbidden*-vocabulary denylist
  and pre-existing upstream vocabulary).
- No slice letters in `src/`, `docs/`, `test/` or the five commit messages. The only matches were
  `tuple.slice(1,5)` (Array.slice) and, under `grep -i`, `\bA\b` matching the article "a".
- The AST gate (`test/routing-runtime-has-no-connector-literals.test.ts`) is a pure vocabulary
  check over both new modules with **no literal-count ceilings**, so the fix's new diagnostic
  strings cannot make it brittle, and no ceiling was silently bumped.

## Findings

No HIGH. No MEDIUM. Two LOW items, neither blocking.

### LOW-1 (test) `test/mcp-protocol-family.test.ts:649` — the ten config cases cannot tell which clause rejected

`src/mcpl/protocol-family.ts:701-702` folds all five rejection clauses (`inboundAdmission` present,
`resolve` a function, `authorize` a function, `timeoutMs` an integer, `timeoutMs` in 1..60000) into a
single `problems.push('replyAuthority requires inboundAdmission, resolve, synchronous authorize, and
timeoutMs in 1..60000')`. Every one of the eight new rejection cases therefore asserts the same
substring, `p.includes('replyAuthority requires')`.

*Failure scenario:* the `timeoutMs: '1000'` case would still pass if the integer/range clause were
deleted and only the `inboundAdmission` clause fired — the assertion cannot distinguish them. Today
each clause is demonstrably load-bearing (P11 kills exactly the five timeout cases, P12 exactly the
missing-admission case), so the coverage MEDIUM-1 asked for is real. The gap is durability: a future
refactor that reorders or merges clauses could leave these tests green while a bound stops being
enforced, which is the same decay MEDIUM-1 was raised about.

*Fix direction:* either split the single `problems.push` into one message per clause and assert the
specific message, or assert the exact `problems` array as the two accepting-boundary tests already do
with `assert.deepEqual(..., [])`.

### LOW-2 (observability) `src/mcpl/reply-admission.ts:42-45`, `src/mcpl/reply-routing.ts:97-100` — the fail-closed diagnostic fires at most once, ever

Both fail-closed paths are latched: `failedConsumers` is a module-level `WeakSet` keyed on the
consumer function, and `loggedThrow` is a per-connection boolean. Each emits exactly one stderr line
for the lifetime of that consumer/connection. The one-shot behaviour is deliberate and pinned —
`test/reply-admission.test.ts:82` asserts `logs.length === 1` across two throwing admissions.

*Failure scenario:* a host `resolve`/`authorize`/consumer that throws persistently (a bad deployment,
a revoked credential) prints one line and then degrades silently. Every subsequent automatic reply on
that connection becomes private, and an operator who missed the first line — or who attached after it
— has no signal at all beyond the absence of `channels/publish` traffic. The agent still receives its
notice each time, so this is loss of *operator* visibility, not of agent-visible behaviour, and the
connection stays correctly fail-closed.

This matches the contract as approved ("one fixed, bounded diagnostic per configured connection",
`docs/reply-routing.md:48-49`), so I am flagging it as an operability observation rather than a
contract violation. Note that this project already has a repeating-window idiom for exactly this
situation — the 30s stale-age / 60s per-agent trace+stderr throttle used for the stale-pending
diagnostic — which keeps a persistent fault visible without flooding.

*Fix direction:* replace the one-shot latch with that existing throttle window (one line per 60s per
connection while the fault persists). Cheap, and it does not change any agent-visible behaviour.

## Verification Gates

Run by me in this worktree, at `27a32127`, clean before and after. Both wrapped via
`orgasmic dispatch gate`, both under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`.

| Gate | Command | Result |
| --- | --- | --- |
| `review2-head-node22.23.3` | `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c 'export PATH=/opt/node-v22.23.3-linux-x64/bin:$PATH; pwd; node --version; rm -rf dist/src dist/test dist/tsconfig.tsbuildinfo; npm run build && npm test'` | **exit 0** — v22.23.3, `# tests 9766 / # pass 9703 / # fail 0 / # cancelled 0 / # skipped 63` |
| `review2-mutations` | `... python3 "$ORGASMIC_EVIDENCE_DIR/probes/probe.py"` | see below |

Receipts: `gate-review2-head-node22.23.3-01M678QQ5WZM0K704NYY9MFP5B.log` (`clean=yes` at start and
end), `gate-review2-mutations-*.log`. Consoles: `review2-gate.console.log`,
`review2-mutations.console.log`.

My full-gate counts reproduce the implementer's head claim **exactly** (9703/0/63 of 9766). I also
read, rather than repeated, the reusable clean-head receipts for `head-node22.12.0`, `typecheck` and
`focused` (175/175); all three match the worker's report. I did **not** re-measure the refreshed base
`869bb3ad` — see test gaps.

### (3) Mutation probes — re-run independently

I wrote my own harness (`$ORGASMIC_EVIDENCE_DIR/probes/probe.py`, anchored on exact unique source
strings, asserting each anchor matches exactly once) rather than reusing the implementer's
`mutations.py`, and ran it in **this** worktree at `27a32127` on Node 22.23.3. Each probe: weaken one
guard → `npm run build` → run the 175-test focused suite → restore the file in a `finally`. Controls
run before and after.

| Probe | Guard weakened | Exit | Failing tests | Killed |
| --- | --- | ---: | ---: | --- |
| control-before | none | 0 | 0 (175/175) | — |
| P2 | `turnReply` returns `first.destination` unconditionally | 1 | 1 | **yes** |
| P5 | `shareReplyTurn` compares only `aa[0]` vs `bb[0]` | 1 | 1 | **yes** |
| P7 | `!verdict.mayWake` early return neutralised | 1 | 1 | **yes** |
| P8 | `authorize(...) === true` → `!!authorize(...)` | 1 | 3 | **yes** |
| P11 | `timeoutMs` integer/1..60000 validation dropped | 1 | 5 | **yes** |
| P12 | `!config.inboundAdmission` requirement dropped | 1 | 1 | **yes** |
| control-after | none (restored) | 0 | 0 (175/175) | — |

**KILLED: P2, P5, P7, P8, P11, P12. SURVIVED: none.** The failing test names match the implementer's
mutation receipt test-for-test:

- P2 → `core: mixed-destination turnReply has no publication destination`
- P5 → `core: shareReplyTurn checks every destination in both cause sets`
- P7 → `core: a read-only verdict skips the resolver at the consumer boundary`
- P8 → `core: authorize {number,string,object} is private unless it is literal true`
- P11 → `reply authority config rejects timeoutMs={0,60001,1.5,NaN,'1000'}`
- P12 → `reply authority config rejects missing inboundAdmission`

Gate receipt `gate-review2-mutations-01M679365JX7Z7AWGKA78SYHHM.log`, exit 0, `clean=yes` at start
and end. Per-probe patches, build/test logs and `results.json` are in
`$ORGASMIC_EVIDENCE_DIR/probes/`. All six previously surviving mutants are now dead, which is the
mutation-level confirmation that MEDIUM-1 and LOW-1/2/3 are genuinely closed rather than nominally
addressed.

## Unmet criteria / test gaps

No unmet acceptance criteria. Remaining gaps, in priority order:

1. **Config-clause attribution** (LOW-1) — the eight rejection cases cannot distinguish which clause
   fired, because the source emits one combined message.
2. **Persistent-fault visibility** (LOW-2) — no test covers, and no code produces, a repeated signal
   for a consumer that keeps throwing; the one-shot latch is pinned instead.
3. **Explicit `channel_publish` through `publish()` on an opted-in connection** — still unproven by
   test, carried over unchanged from the previous round. The previous review's P13 showed the
   `routed` condition is unreachable for explicit sends (`channel_publish` resolves and sends on its
   own path and never enters `publish()`), so this clause of the contract rests on code structure.
   Existing explicit-send tests cover the tool path.
4. **Refreshed-base count not independently re-measured.** The `+137` delta rests on the worker's
   `refreshed-base-node22.23.3` receipt, which is a *legitimate* wrapped gate receipt
   (`clean=yes` at `869bb3ad`, exit 0, 9566/0/63 of 9629) but ran in a separate checkout
   (`dist/admission-base`), disclosed as such. This is a material improvement over last round's
   dirty-tree base measurement. I verified the head side myself and read the base receipt; I did not
   rebuild the base.
5. **Node 22.12.0 and `typecheck` not re-run by me** — reusable clean-head receipts read instead, as
   the brief scopes my own gate to 22.23.3.

## Residual risk

- **Maintainer contract churn, not correctness.** The public `replyAuthority` shape and the
  post-admission wrapper boundary may still be rejected upstream. Everything is additive and opt-in,
  so that is rework rather than breakage. #931 remains held; nothing was pushed.
- **Detach snapshot ordering.** The consumer's copy of `item` is now taken *after* the host's admit
  callback rather than before. For the shipped path this is indistinguishable: `item` is JSON parsed
  from the transport and no host callback can reach it. It could differ only for an in-process host
  that passes an object it retains *and* mutates from its own admit callback — and even then the
  resolved destination is still re-authorized synchronously by `authorize` plus the registration,
  grant, incarnation and descriptor-identity checks before every automatic open/send, so no
  unauthorized destination results.
- **One throw-escape path remains, unreachable in practice.** `console.error` at
  `reply-admission.ts:44` is the only statement in the fail-closed path that could throw and escape
  `admit`. Node's global `console` is constructed with `ignoreErrors: true` and swallows stream write
  errors, and `failedConsumers.add` precedes it, so it cannot throw more than once even in principle.
- **Opt-in blast radius.** Enabling `replyAuthority` makes all unbound automatic prose to that
  connection private *and* exempts admitted-work wakes from read/publication-watermark drops. Both
  are now documented (`docs/reply-routing.md:88-97`) and tested. Note the exemption also applies to
  *private* (destinationless) work, including work minted by the new consumer-throw path — so a
  persistently throwing consumer retains wakes that base behaviour would drop. Consistent with every
  other private-work path (overload, timeout, denial), and disclosed by the new doc wording.
- **Host obligations.** Correctness still depends on `authorize` being cheap, synchronous and
  side-effect-free and on `resolve` honouring cancellation. Violations degrade to private
  (fail-closed) but can delay the admission path by up to `timeoutMs`.
- **Rebase debt is now largely retired** — the branch sits on refreshed A `869bb3ad`, which descends
  from upstream `a64cfc01`, and the rebase was conflict-free with all four patches `=`. Further
  upstream movement will need its own gates; `src/framework.ts` remains the likely conflict surface.
- **`postAdmissionConsumer` is a public assignable field.** In-tree it is only ever assigned under
  `if (config.replyAuthority)` (`src/framework.ts:34943-34945`), the same condition that sets
  `requiresReplyBinding` (`src/mcpl/server-connection.ts:1395,1732`), so consumer presence and the
  publish gate cannot diverge. An out-of-tree caller assigning the field directly could attach work
  to a connection whose publish gate is off; that is the maintainer-facing A seam (M3), not B
  behaviour.

## Fix directions (summary)

Nothing blocks ship. If another cleanup round runs:

1. Split the combined `replyAuthority` config problem message, or assert the exact `problems` array,
   so each bound is pinned to its own case (LOW-1).
2. Swap the one-shot diagnostic latches for the project's existing 60s-per-connection throttle
   window (LOW-2).
3. Optional, carried over: a test that drives an explicit `channel_publish` through `publish()` on an
   opted-in connection, if the maintainer wants that clause pinned by test rather than by structure.
4. Confirm the `Co-Authored-By` trailer model name with the owner before publication.
