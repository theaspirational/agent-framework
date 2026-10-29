# TASK-HVQ8K review — slice A, generic required inbound admission

Reviewed `632f2e87c093c82f80f80e0b8e84104111300bc7` (7 commits on upstream main
`4a45766f019fa11c8699645bd6806ebf3e13e5d1`). Read in full: implementer report
`/srv/review-drop/TASK-HVQ8K-IMPL.md`; design `docs/design/GENERIC-RECIPIENT-ROUTING.md`
at `591f6c14578ef57796399b91c8a0bea1d5ba7c62` (sha256 `475da25d…118ac`, §4.1 and O1–O5
confirmed); W `/srv/review-drop/TASK-VZ0CD-CMT-R4DF2.md`.

## Verdict

**Approve with follow-ups.** The three ingress lanes behave as the design §4.1
ordering and W require, the opt-in boundary holds, and I could not break the
central guards by mutation. Diff inventory, full-suite counts and the gate set in
the implementer report all reproduce exactly. Two MEDIUM items are worth fixing
before this goes upstream, neither of which is a defect in the admission
mechanism itself: an un-admitted peer ingress path (`tools/hints`) that the
required profile leaves open, and a startup availability change that is broader
than fail-closed admission requires and is undocumented. No HIGH findings; no
blocks-ship.

Checks 1–7 from the brief: (1) confirmed; (2) confirmed; (3) confirmed;
(4) confirmed; (5) confirmed; (6) confirmed; (7) mostly accurate, three LOW
inaccuracies below. The "Clarifications and deviations" calls (stamp omission,
1..60000 / 64 bounds, retained pre-existing connector policy, deferred MCPL pin,
hint-after-feature ordering) are all implemented as stated and are sound on the
merits: each is conservative, each is reflected in `docs/required-inbound-admission.md`,
and none weakens the admission guarantee.

## Findings

### MEDIUM

**MEDIUM `src/mcpl/server-connection.ts:2509` (bug / unmet W §10): a required
connection still applies peer `tools/hints` with no verdict and no grant.**
The commit suppresses only the push-borne read tap (`request.method === 'push/event' && !this.requiredAdmission`).
The sibling branch at `:2510` (`request.method === 'tools/hints' && this.readTap`)
is untouched, and `AgentFramework.hintsFor()` (`src/framework.ts:33154`, default
`true` for legacy servers) installs that tap on required connections too. So a
peer can send a standalone `tools/hints` on a strict required connection and have
its hints applied, toolset presentation state mutated and host→peer recovery
requests scheduled — before and without any admission verdict, and with no
capability grant.
Failure scenario, reproduced on the real WebSocket path
(`$ORGASMIC_EVIDENCE_DIR/probes/probe-hints3.mjs`): required connection, active
toolset presence, peer sends `tools/hints {rev: 7, …}` →
`ToolsetHost attached: true presents: true`, host logs
`hint change rev 7 (tools/hints) after rev 0: a rev was lost; applied, and
recovering from tools/list and toolsets/list`, response `{}`, **admission hook
calls: 0**. Without declarations the tap still fires un-admitted
(`probe-hints.mjs`: `taps=1 … admission hook calls=0`) but `onRead` returns
early, so the state effect needs a declaring peer.
This is not a regression from base — base behaves the same for every connection,
and design §4.1's table names only the push read tap — but W §10 is explicit:
"A future implementation must either cover each additional ingress/dispatch path
with the same ceiling and preflight contract or reject required admission on it
before connect; unsupported must never mean unguarded." It also makes
`docs/required-inbound-admission.md:"Push hints are unsupported and never reach
the early tap"` read as a stronger promise than the code keeps, and it is absent
from the report's Residual Risk. Fix direction: for required connections either
refuse `tools/hints` before `this.tap(...)` with `admission_unsupported` (the
same call W makes for hinted pushes) or skip installing the tap at
`framework.ts:33171`; failing that, document the exception explicitly in the doc
and the report. No test covers this path either way.

**MEDIUM `src/framework.ts:32035` (design / docs): any connect failure on a
required server now aborts whole-framework startup, not just a binder or
attestation refusal.** `if (config.inboundAdmission !== undefined || error instanceof DiscordAwarenessAccountingError) throw error;`
replaces the fail-open log-and-continue for every error class, including ordinary
outages. Fail-closed admission does not need this: a connection that never
exists cannot admit anything.
Failure scenario, reproduced (`$ORGASMIC_EVIDENCE_DIR/probes/probe-startup.mjs`):
one required server with an unreachable command and no `reconnect` →
`framework CREATE REJECTED: MCPL server "down" could not be started: spawn /nonexistent/peer ENOENT`;
the identical unconfigured server → `framework STARTED`. So a transient peer
outage takes down the host and every other configured server and agent. W draws
the opposite line ("Initial bind failure/missing hook fails that configured
connect closed … Ordinary transport outage retry remains a separate lifecycle
policy"). It is also undocumented: neither
`docs/required-inbound-admission.md` nor `changelog.d/required-inbound-admission.added.md`
mentions it, and the only test
(`test/mcpl-admission-lifecycle.test.ts:260`, "framework startup does not degrade
when a required binder is absent") exercises the binder case, which is already
terminal via `AdmissionConnectError`. Fix direction: narrow the condition to
`error instanceof AdmissionConnectError` (plus the existing accounting error),
or keep the strict behaviour and state it in the doc and changelog with a test.

### LOW

**LOW `src/mcpl/server-connection.ts:1020` (docs/report accuracy): the
required-path capability refusal does not keep the existing wire form.** The new
guard answers `respondError(CAPABILITY_DISABLED, 'capability_denied', { capability: cap })`
where the existing path at `:1060` answers
`` `${name} rejected: capability "${requiredCap}" ${phase}` ``. Code and `data`
match; the `message` does not. The implementer report's refusal matrix says
"Missing grant at receipt | Existing capability error" and its preamble says
"Existing authorization errors retain their old wire form and precede
admission" — that is wrong for the message string. Required connections are
opt-in and new, so no peer regresses, and the test only asserts
`r.error.code === -32002` (`test/mcpl-admission-lifecycle.test.ts:170`). Fix
direction: either reuse the existing message builder or correct the report
wording. Related, same site: when the item is a notification there is no
responder and, unlike the base branch at `:1062`, nothing is logged — required
connections lose that diagnostic line.

**LOW `src/mcpl/inbound-admission.ts:53` (test): the data-only / accessor guard
in `snapshot` has no killing test.** Mutating
`if (typeof key !== 'string' || !('value' in descriptor) || !descriptor.enumerable)`
down to `if (typeof key !== 'string')` leaves all 123 admission tests green
(`probes/M12-accessors-allowed.log`: `# pass 123 # fail 0`). The committed
`'accessor'` case (`test/mcpl-required-admission.test.ts:19`) puts the getter on
`store`, which is refused anyway by the `typeof verdict.store !== 'boolean'`
check — `getOwnPropertyDescriptor` never runs a getter, so that row passes with
or without the guard. The guard *is* load-bearing in production: my direct probe
(`probes/probe-accessor.mjs`) shows `{store:true, mayWake:true, get replyIntent(){…}}`
→ `admission_invalid` with `isReplyIntent` never called, and a non-enumerable
extra member → `admission_invalid`. Design §6 asks that each witness fail when
its own guard is removed. Fix direction: add an accessor-on-`replyIntent` row and
a non-enumerable-member row.

**LOW `docs/required-inbound-admission.md:22,68` (docs): internal workplan
vocabulary in PR-facing text.** "Slice A rejects a `stamp` member", "A full
external MCPL pin is deferred to slice E", and the base SHA quoted as the
"protocol baseline" have no referent for an upstream reader. The manager's answer
to `ask-fb5b3491` did ask for the slice-A/slice-E statement, so this is a
wording call rather than a deviation; task ids, `WO-5a`, `W` and `O4` are
correctly absent. Fix direction before upstreaming: phrase as capability
statements ("stamp support arrives with context-only delivery" already does
this) and drop the slice letters and the base SHA.

**LOW commit series (scope): the series is not cleanly splittable per lane.**
`273e609c`/`f514854e`/`93a15a88` are per-lane, but `a78b337e` and `632f2e87`
reach back into `channel-registry.ts`, `push-handler.ts`, `inference-router.ts`
and `inbound-admission.ts` together, and `93a15a88`/`632f2e87` each delete lines
`273e609c` added in `server-connection.ts`. Against the acceptance line "small
reviewable commits, one per lane where possible, so upstream can take them as
separate PRs", the later fixes would need folding into the lane commits first.

**LOW `src/framework.ts:32035` (connector-agnostic hygiene): new admission
policy is interleaved with a connector-named branch.** The new condition shares
its `if` with `error instanceof DiscordAwarenessAccountingError`. The
count-based AST delta check correctly reports zero *new* connector identifiers
(I reran it: `9 runtime files checked; 0 new connector-specific AST values/identifiers; 322 pre-existing sites retained`),
but a touched-function reading of the manager's `ask-8c10d500` answer would
prefer the new clause as its own statement.

### Survivors worth noting (not findings)

Two mutations survived; both are redundant belts, not faults.
`probes/M15-no-receipt-guard.log` — deleting the `admissionReceipts.has(args[0])`
arm of the `emit` guard (`server-connection.ts:1027`) keeps 123/123 green,
because `admissionFor()`'s `?? capture(() => 'admission_missing')` fallback
(`:463`) refuses anyway; the arm is still the reachable guard for
`params: null`/non-object and deserves a row.
`probes/M16-no-decision-downgrade.log` — deleting
`if (admittedEnvelope in event && !decision.wake) event.triggerInference = false;`
(`framework.ts:17220,19083`) keeps 123/123, because `wakeForbidden()` already
returns true on `envelope.mayWake === false` and `admitInbound` already receives
`vetoed: event.triggerInference === false`.

## Verification Gates

All run by me in this worktree on Node **22.23.3** / npm 10.9.9; no implementer
receipt reused for any of the four required gates.

| Gate | Command | Outcome | Log |
| --- | --- | --- | --- |
| `typecheck-review` | `npm run typecheck` | exit 0 | `gate-typecheck-review-01M63ZFY6YDFXJGK77TFC3H2Q6.log` |
| `build-review` | `npm run build` | exit 0 | `gate-build-review-01M63ZG0Q635CSEE9KBRNJRE8Y.log` |
| `npm-test-node22-review` | `env AF_TEST_CONCURRENCY=4 npm test` | exit 0 — **9339 tests, 9276 pass, 0 fail, 0 cancelled, 63 skipped, 0 todo**, 464.4 s | `gate-npm-test-node22-review-01M63ZG4A3PJPHKM43GV68W5M9.log` |
| `admission-review` | `node --test --test-concurrency=1 --test-force-exit dist/test/mcpl-{required-admission,required-push-admission,required-inference-admission,admission-lifecycle,admission-no-hook,admission-compatibility}.test.js` | exit 0 — **123 pass, 0 fail, 0 skipped**, 13.8 s | `gate-admission-review-01M640QRAR4DB0HWCJ752NGXJR.log` |

Unwrapped scoped probes (no receipt): the connector AST delta rerun above; the
five `probes/probe-*.mjs` production-path probes; the 13-mutation matrix below.
Diff inventory reproduced exactly against the report's table
(`git diff --numstat 4a45766f..HEAD`: 18 files, +988/−15, every per-file count
matching). `@animalabs/mcpl-core` is `0.4.0` in `package.json` devDependencies
and installed, as claimed. Tracked tree clean at start and at finish; `dist/src`
restored byte-identical after the mutation runs (`diff -r` clean); nothing
written inside the worktree.

### Mutation matrix (13 applied; 11 killed)

Applied to compiled `dist/` (ignored build output), then `dist/src` restored from
a pristine copy after each run. Baseline 123 pass / 0 fail.

| Mutation | Result |
| --- | --- |
| M1 drop channel post-await `admission.check()` | killed, 5 fail |
| M2 drop channel entry/descriptor recheck | killed, 2 fail |
| M3 `triggerInference = true` (ignore `mayWake`) in registry+push | killed, 21 fail |
| M4 drop `Object.hasOwn(params,'hints')` refusal | killed, 2 fail |
| M5 disable the 64-pending budget | killed, 1 fail |
| M6 un-suppress the required push read tap | killed, 3 fail |
| M7 accept unknown members on the allow branch | killed, 4 fail |
| M8 drop `requiredAdmission.isCurrent()` in `coalescedAuthorized` | killed, 1 fail |
| M9 drop `AdmissionConnectError` from the terminal reconnect set | killed, 8 fail |
| M10 drop `!wakeForbidden(event)` on module `requestInference` | killed, 6 fail |
| M11 drop the required pre-ready refusal in `emit` | killed, 1 fail (suite bailed) |
| M17 inference ignores `!verdict.mayWake` | killed, 1 fail |
| M18 drop handshake-window `refuseEarly` | killed, 2 fail |
| M19 drop `requiredAdmission?.invalidate()` on transport boundary | killed, 1 fail |
| M20 accept a wrong-key binder return | killed, 1 fail |
| M21 always re-reset policy after reconnect handshake | killed, 1 fail |
| M12 weaken `snapshot` accessor/enumerability guard | **survived** → LOW above |
| M15 drop the `emit` receipt-presence arm | **survived** → noted above |
| M16 drop the post-decision ceiling downgrade | **survived** → noted above |

### What I verified by reading, per brief item

1. **Unconfigured identity.** Every new runtime branch is behind
`requiredAdmission`/`inboundAdmission !== undefined`
(`server-connection.ts:550,1017,1024,2509,2560,2611`; `framework.ts:18592,18697,34604,34676,34791`),
and the two shared expressions degrade to the old literals:
`envelope?.mayWake !== false` → `true` and `if (triggerInference && this.shouldTriggerInference)`
is identical when `triggerInference` is unconditionally true
(`channel-registry.ts:2033`, `push-handler.ts:257`); `wakeForbidden()` returns
`false` with no envelope (`inbound-admission.ts:67`); `admittedEnvelope in event`
is false. Reconnect keeps exactly one `resetPolicyForTransportBoundary()` for
unconfigured connections (`:2134` vs `:2184`). The push read tap, holding and
replay paths are untouched. `mcpl-admission-no-hook.test.ts` pins the synchronous
`['gate','observer','queue','response']` order with no added yield and
`Object.getOwnPropertySymbols(queued) === []`.
2. **No effect before a validated verdict + live recheck.** Validation covers
exact booleans, branch discrimination, closed enum, no unknown/extra members, and
a data-only snapshot that refuses accessors, non-enumerable and symbol keys and
non-plain prototypes (`inbound-admission.ts:42-58,120-127`); `replyIntent` must
pass the host validator with literal `true`, inside the same deadline. After the
await each lane rechecks the framework wrapper (`queue.isClosed`, registry
identity) → the receipt closure (`transportEpoch`, `isConnected`, grant, both
planes) → binding/key object identity → plus the channel entry *and* its
descriptor (`channel-registry.ts:1937`), the feature set (`push-handler.ts:168`,
`inference-router.ts:250`) and `hookOrchestrator.isInHook` (`:251`). I confirmed
there is no `await` between the final check and the first effect on all three
lanes: channel reaches `markAccepted()` synchronously (content conversion is
sync), push reaches `dedup.checkAndAdd` synchronously, inference reaches
`resolveModel` synchronously. Receipts are created only at line receipt, keyed by
the params object in a `WeakMap`, for requests *and* notifications, with the
line's own epoch (`:2560`).
3. **Budget / timeout / abort / pre-ready.** `run()` always settles (the
`cancelled` promise resolves on both abort and timer; `operation` has a rejection
handler) and releases its slot in `finally`, so the 64-slot set cannot leak or
deadlock; batch items are sequential, so a 64-message batch uses one slot;
`timeoutMs` is clamped to an integer 1..60000 at config load through
`serverConfigProblems` → `checkServerConfig` → `checkConfig`, which throws before
launch. Late resolution after the race is discarded and the signal is aborted.
Pre-ready required traffic is refused at the `emit` choke point before
`planeReadyFor`, so it never enters `bufferedEvents` (asserted in the tests), and
during the handshake window `refuseEarly` answers data-lane requests instead.
4. **Attestation / binder terminal.** `attest()` runs inside the bounded `run()`
after protocol agreement and before `resolve`, `admission.bind(epoch)` and
`notifications/initialized` (`server-connection.ts:1446,1514,1517`); any
absence/mismatch/throw/timeout/malformed becomes
`AdmissionConnectError('initialize_attestation_refused')`, and a bad binder
`admission_missing`. Both are in the terminal sets of `connectWithReconnect`
(`:1580`) and `reconnectAfterFailure` (`:2151-2152`, `reconnectEnabled = false`,
`permanent: true`), so no reconnect can degrade to the unconfigured path; a
required connection with no usable binding refuses `admission_missing` rather
than falling through (`capture()`'s `!binding → 'admission_missing'`). Protocol
refusal still wins (`read === 0` asserted for the `protocol` case).
5. **Ceiling cannot be raised.** `attachAdmission` defines the envelope
non-writable/non-configurable, so a module cannot overwrite it on the original
event; the authoritative read is `envelope.mayWake === false` in
`wakeForbidden()`, which is checked at the only module-driven wake request
(`framework.ts:17011`) and is independent of anything a module may write to
`event.triggerInference`. Through coalescing: `queueCoalescedWakes` returns early
on `!occ.event.event.triggerInference` (`:18733`) for the push lane, and the
assembled channel event carries the envelope forward (`:18697`) into
`admitInbound(… vetoed: event.triggerInference === false)`; `admit.ts:101,105`
forces `gatePass`/wake false when vetoed. Both lanes share one `PushCoalescer`
whose `authorized` hook is `coalescedAuthorized` (`:18290`), which refuses
deferred work without a live matching key. M3/M10/M17 and the 16 cross-product
rows in `mcpl-admission-compatibility.test.ts` cover it.
6. **No new connector policy.** Confirmed by rerunning the delta check (0 new)
and by grepping every added line: the only connector token in the added code is
the pre-existing `DiscordAwarenessAccountingError` reused at `framework.ts:32035`
(LOW above). `inbound-admission.ts` is connector-free and has a committed AST
test.
7. **Docs/changelog.** Accurate on bounds, config validation, modern-family
rejection, per-connection budgets, batch ordering, refusal wire shapes,
attestation placement, the stamp omission and the `mayWake`-is-not-context-only
distinction. The three LOW items above are its only inaccuracies/gaps.

## Unmet Criteria / test gaps

No acceptance criterion is unmet. Gaps:

- No test for `tools/hints` on a required connection (MEDIUM 1). If the
  behaviour is kept deliberately, it needs a test pinning it and a doc line.
- No test for a required server failing startup on an ordinary connect error
  (MEDIUM 2); only the binder case is covered.
- No row kills the `snapshot` accessor/enumerability guard (LOW).
- No row kills the `emit` receipt-presence arm, including the peer-reachable
  `push/event` with `params: null`.
- `admission_mode_ungranted` is in the closed enum and accepted from a host but
  never produced by the framework, and no test asserts a host may return it.
- The connector AST delta check lives only in the reviewed run's evidence
  (`check-connector-delta.mjs`), not in the repo, so it is not a durable
  regression guard; the committed AST test covers `inbound-admission.ts` alone,
  not the eight other touched runtime files. Design §6 asks for
  `routing-runtime-has-no-connector-literals` as a committed test, though §7
  lists "no connector literals" under slice **B**'s exit, not A's.
- The 63 full-suite skips are pre-existing and unrelated to this change.
- Post-await authority rows for `remove-entry`/`replace-entry`/`remove-binding`
  mutate registry/admission internals directly rather than driving them through
  a transport event; the report says so, and the real stdio
  disconnect/replacement and WebSocket reconnect rows do cover genuine teardown.

## Residual Risk

- The required profile's "no peer-caused effect before a verdict" guarantee is
  not total while `tools/hints` is ungated; the same class of effect W wanted
  gated for hinted pushes (hint application, recovery scheduling, notices) is
  still reachable, and it also lets a peer cause host→peer `tools/list` /
  `toolsets/list` traffic without a grant.
- Required + no `reconnect` turns a peer outage into a host-startup failure.
- 1..60000 ms and 64 pending are declared initial bounds with no production
  sizing evidence; a 64-message batch of 60 s timeouts can still delay later
  siblings for an hour within one request, which is W §10's known open risk
  rather than a defect here.
- Host hooks run in-process: timers cannot preempt a synchronous infinite loop
  nor undo external writes. Documented.
- `replyIntent` reaches modules via an enumerable symbol on the event (copied by
  object spread), so host module code can read it. That matches W's "carry the
  slot unchanged to host extension points", but it is wider than "private" reads
  at first glance and is not called out in the doc.
- Nothing durable: restored coalesced work without a live envelope cannot
  inherit a replacement grant. Correct for A; slice B/D own the rest.
- Probes used synthetic WebSocket/stdio peers and a mock membrane, never a
  deployed connector or provider.

## Fix Directions

1. Gate or explicitly refuse standalone `tools/hints` on required connections —
   refuse with `admission_unsupported` before `this.tap(...)` at
   `server-connection.ts:2510`, or skip the tap install at `framework.ts:33171`
   when `inboundAdmission` is set. Add the two tests (hints applied vs refused)
   and a doc line. If the behaviour is kept, say so in the doc and the report's
   Residual Risk instead.
2. Narrow `framework.ts:32035` to `error instanceof AdmissionConnectError`
   (keeping `DiscordAwarenessAccountingError`), as a separate `if` statement so
   the new clause carries no connector identifier; or keep the strict behaviour
   and document it in `docs/required-inbound-admission.md` and the changelog
   with a test for an ordinary connect failure.
3. Reuse the existing capability-refusal message builder at
   `server-connection.ts:1020` and keep the `console.error` for the
   no-responder case, or correct the report's "retain their old wire form"
   claim.
4. Add the two missing guard witnesses: an accessor on `replyIntent` plus a
   non-enumerable extra member (`snapshot`), and a `push/event` with
   `params: null` (the `emit` receipt arm).
5. Before upstreaming: fold `a78b337e`/`632f2e87` into the lane commits so each
   lane is independently takeable, and strip "slice A"/"slice E" and the base
   SHA from `docs/required-inbound-admission.md`.
6. Consider promoting `check-connector-delta.mjs` into the repo as the
   `routing-runtime-has-no-connector-literals` test over the touched runtime
   files, so the connector-agnostic property is guarded by CI rather than by one
   run's evidence.
