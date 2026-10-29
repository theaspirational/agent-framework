# TASK-HVQ8K re-review — slice A after fix round 1

Reviewed `02ee294731a2e171aa0eae7533f7ec7b7129a2c0` (6 commits on upstream main
`4a45766f019fa11c8699645bd6806ebf3e13e5d1`), against the previously reviewed HEAD
`task-hvq8k-reviewed-before-fix1` = `632f2e87c093c82f80f80e0b8e84104111300bc7`.
Read in full: `/srv/review-drop/TASK-HVQ8K-REVIEW1.md`, `/srv/review-drop/TASK-HVQ8K-FIX1.md`.
Fresh run; no evidence carried over from the OOM-killed re-review.

## Verdict

**Approve.** All eight REVIEW1 items (2 MEDIUM + 6 LOW) are genuinely fixed, and
I killed each fix with my own `dist/` mutation rather than trusting the
implementer's receipts. The rebuilt six-commit series is clean: `git diff
632f2e87 02ee2947` touches exactly the seven files the fixes require and nothing
else, each lane patch applies independently to the shared core, and the file set
against upstream base is unchanged at 18 files. Typecheck, build, the full
`npm test` and the focused admission suite all pass on Node 22.23.3 under the
memory cap, with **0 failures** — including the two liveness-watchdog tests the
manager's own run saw fail. No HIGH, no MEDIUM, no blocks-ship.

One LOW remains, and it is the surviving tail of the MEDIUM-1 class rather than
a regression: RFC-014 hint **carrier 1** (hints on a result) is still applied
un-admitted on required connections. I reproduced it on the real transport.

## Findings

### HIGH
None.

### MEDIUM
None.

### LOW

**LOW `src/mcpl/server-connection.ts:2485` / `:2689` (bug class, carried over from
MEDIUM-1; docs + test gap): RFC-014 carrier 1 — hints carried on a *result* —
still mutates toolset state on a required connection with no verdict and no grant.**
Fix round 1 closed carrier 3 (standalone `tools/hints`, new guard at `:2512`) and
carrier 2 (push read tap, `:2522`) but left carrier 1: `dispatchMessage` calls
`tapResponse(msg)` at `:2485` unconditionally, and `tapResponse` (`:2689`) taps any
response to a `HINTED_METHODS` request (`:261` — `tools/call`, `toolsets/open`,
`toolsets/close`, `toolsets/list`). `toolset-host.ts:263`'s `default:` arm then runs
`applyHints(metaHints(res), method)`, which mutates `presence.rev` and can call
`scheduleRecovery()`.

Failure scenario, reproduced on the real WebSocket path
(`$ORGASMIC_EVIDENCE_DIR/probes/probe-result-hints.mjs`): a **required** connection
with `CapabilityGrant.empty()`, declaring toolset peer, host sends `tools/call`,
peer answers with `_meta: { 'mcpl/hints': { rev: 7, tools: [] } }` →

```
required=true  | readTap=true presents=true | rev 0 -> 7 | taps=2 | admission hook calls=0 | recoveryTimer=true
required=false | readTap=true presents=true | rev 0 -> 7 | taps=2 | admission hook calls=0 | recoveryTimer=true
```

Host log on both: `hint change rev 7 (tools/call) after rev 0: a rev was lost;
applied, and recovering from tools/list and toolsets/list`. Required is
byte-for-byte identical to unconfigured: toolset presentation state mutated and
host→peer `tools/list`/`toolsets/list` recovery scheduled, with **zero admission
hook calls**.

Why LOW rather than MEDIUM: unlike carrier 3, this is a reply to a request the
*host* chose to send, so it is solicited rather than unsolicited peer ingress, and
it is not a regression (base behaves the same for every connection). W §10's
"cover each ingress path or reject it before connect; unsupported must never mean
unguarded" is still arguably on point, so a manager who reads W literally may want
this at MEDIUM. Either way the current text under-describes it:
`docs/required-inbound-admission.md:38-42` and
`changelog.d/required-inbound-admission.added.md:3` now enumerate push hints and
standalone `tools/hints` as refused, which reads as an exhaustive list of hint
carriers; carrier 1 is named nowhere, and FIX1's Residual Risk omits it too. No
test covers it either way. Fix direction: either suppress `tapResponse` for
required connections at `:2485` (same shape as the `:2522` push-tap suppression),
or add one doc line and one pinning test stating that result-borne hints are
accepted on required connections because the host solicited them.

**LOW `test/mcpl-admission-lifecycle.test.ts:180-182,325-331`,
`test/mcpl-admission-compatibility.test.ts:68-71` (test): three of the new
witnesses drive internal boundaries rather than the transport.** The capability
notification diagnostic is asserted by calling `connection.emit(name, {})`
directly; the M15 presence-arm row calls `connection.emit('push-event', …)` with a
hand-built responder; the M16 rows monkeypatch `framework.admitInbound`. All three
are labelled as scaffolds in comments and each has a real-transport sibling, so
this is disclosure-adequate, not misleading — but a refactor that changes how the
framework reaches `emit` would leave these green while the production path
regressed. Fix direction: none required for this round; worth noting if the lanes
are refactored.

**LOW (carried over, unaddressed and acknowledged): `admission_mode_ungranted`
remains in the closed `RefusalCode` enum (`src/mcpl/inbound-admission.ts:9`) with
no framework producer and no test asserting a host may return it**; and the
connector AST delta check is still an evidence script
(`check-connector-delta.mjs`), not a committed CI test. FIX1 explicitly declines
both as out of the fix round's scope. Both are reasonable deferrals; flagging so
they are not lost before upstreaming.

## Verification of each REVIEW1 finding

Each row: what I read, plus the mutation I applied to compiled `dist/` to prove
the fix's test is load-bearing. Baseline for every mutation run: 138 pass / 0 fail.
Logs in `$ORGASMIC_EVIDENCE_DIR/probes/`.

| REVIEW1 item | Fixed? | Evidence I produced |
| --- | --- | --- |
| MEDIUM-1 `tools/hints` un-admitted | **Yes** — `server-connection.ts:2512-2518` refuses before the tap: `-32600 admission_unsupported` for requests, discard-and-log for notifications; guard is `this.requiredAdmission && …`, so the unconfigured branch at `:2522-2527` is untouched | Mutation **F1** (neutralize the guard) → **1 fail**: `standalone tools/hints: required=true preserves the opt-in boundary over WebSocket` (`f1.log`). The committed test is a real-WebSocket pair with an actively declaring peer (`assert(controller?.presents)`), asserting `taps=0`, unchanged `presence.rev`, `recoveryTimer === null` and `hooks === 0` for required, and the full legacy behaviour for the unconfigured control |
| MEDIUM-2 any connect failure aborted startup | **Yes** — `framework.ts:32036-32041`: only `AdmissionConnectError` is the admission-specific fatal condition; `DiscordAwarenessAccountingError` is restored to its own untouched statement | Mutation **F2** (restore `config.inboundAdmission !== undefined`) → **1 fail**: `required server transport outage does not abort framework startup` (`f2.log`). The binder-absent terminal case still passes (`lifecycle.test.ts:267`), so `AdmissionConnectError` does reach `32041` unwrapped. Checked separately that the modern-family rejection is a *config* problem (`protocol-family.ts:700-704`, throws before launch) and that `McplProtocolVersionError` leaves nothing registered (`:1585`), so the narrowing opens no un-admitted fallback |
| LOW capability message parity + lost notification log | **Yes** — one private `refuseCapability()` helper (`server-connection.ts:467-477`) used by both the required branch (`:1031`) and the pre-existing branch (`:1068`); the old branch body was moved verbatim, `logValue(name)` included | Mutation **F3** (revert the required branch to `'capability_denied'`) → **3 fails**, one per lane (`f3.log`). The tests now `deepEqual` the whole peer error and assert the exact `[mcpl] editor: discarded …` line |
| LOW accessor/non-enumerable guard had no killing witness | **Yes** — three rows added at `test/mcpl-required-admission.test.ts:19-21`, plus a `validators` counter proving the intent validator is never reached | Mutation **M12** (weaken to `typeof key !== 'string'`) → **4 fails**: accessor-on-`replyIntent` and non-enumerable-`replyIntent`, ordinary and coalesced (`m12.log`). Was 0 fails before. The third row (non-enumerable extra member) is redundant — whole-shape validation catches it either way — which FIX1 states accurately |
| M15 survivor: receipt-presence arm | **Yes** — three real-transport non-object-params rows plus one labelled emit-boundary row | Mutation **M15-presence** (drop only `!this.admissionReceipts.has(…)`) → **1 fail** (`m15.log`). Was 0 before. The real-transport rows additionally assert `routed === 0`, isolating the transport guard from the `admissionFor` fallback |
| M16 survivor: post-decision ceiling downgrade | **Yes** — two rows in `mcpl-admission-compatibility.test.ts:59-74` | Mutation **M16** (neutralize both downgrades at `framework.ts:17220,19083`) → **2 fails**, channel and push (`m16.log`). Was 0 before |
| LOW PR-facing workplan vocabulary | **Yes** — `grep -niE "slice [A-E]\b\|4a45766f\|WO-5a\|TASK-\|HVQ8K\|VZ0CD\|ABD33"` over `docs/required-inbound-admission.md`, the changelog fragment, all added source and all admission tests returns **nothing**. The base SHA is gone; §"Scope and protocol baseline" is now capability-phrased. `@animalabs/mcpl-core` is verified `0.4.0` in `package.json` devDependencies and `0.4.0` installed, as the doc claims | — |
| LOW connector-named startup clause | **Yes** — the admission condition is its own `if` statement (`framework.ts:32041`) carrying no connector identifier; the `DiscordAwarenessAccountingError` branch is byte-identical to upstream | — |

### Rebuilt series

- `git diff 632f2e87 02ee2947` = **7 files, +136/−29** — exactly FIX1's table, and every
  hunk maps to a REVIEW1 finding. No stray edits.
- `git diff 4a45766f 02ee2947` = **18 files, +1101/−21**; the file set is *identical*
  to the reviewed HEAD's file set against base (`diff` of the two `--name-only`
  lists is empty), so the restructure moved content between commits without
  adding or dropping a file.
- Per-commit map is cleanly per-lane: `5789ca60` shared core → `ed327072` channel
  (framework + `channel-registry.ts` + its test) → `0d745887` push → `f5df955f`
  inference → `e33e1639` cross-lane tests only → `02ee2947` docs only. **No lane
  commit deletes or fixes up another lane's runtime lines** — the only post-core
  deletion is `e33e1639`'s −16 inside the lifecycle *test* file.
- Lane independence verified myself with a temporary index
  (`GIT_INDEX_FILE` + `git read-tree 5789ca60` + `git apply --cached --check`):
  `ed327072`, `0d745887`, `f5df955f` each apply cleanly on the shared core. No
  worktree modification.
- All six commits authored and committed by `Vasyl Dovhanchyn
  <48733736+theaspirational@users.noreply.github.com>`. Nothing pushed — all six
  are in `git log --all --not --remotes`. `git diff --check` clean. Tracked tree
  clean at start and finish.

### Regressions introduced by the fixes
I looked specifically for these and found none.
- The hints guard sits after `afterBoundary` and `ping` and before the tap; `request.id != null`
  matches the file's existing notification convention (`featureSets/changed`, `scope/elevate`).
- `refuseCapability` is a pure extraction: the pre-existing branch's behaviour,
  message, `data` and `console.error` are unchanged for unconfigured connections.
- The startup narrowing does not create an un-admitted fallback (checked the
  modern-family and protocol-version paths above). A required connection whose
  binder never ran refuses everything: `admissionFor`'s
  `?? capture(() => 'admission_missing')` (`:464`) plus the pre-ready arm in `emit`.
- Full suite 0 fail confirms no collateral damage.

## Verification Gates

All run by me in this worktree, on Node **22.23.3** / npm 10.9.9, every one wrapped
as `orgasmic dispatch gate … -- env XDG_RUNTIME_DIR=/run/user/1002 systemd-run
--user --scope -q -p MemoryMax=16G -p MemorySwapMax=0 <cmd>`. The cap was verified
working before use (`cap ok v22.23.3`); nothing was run uncapped. No implementer
receipt reused for any gate.

| Gate | Command after `--` | Outcome | Log |
| --- | --- | --- | --- |
| `typecheck-review2` | `npm run typecheck` | exit 0 | `gate-typecheck-review2-01M64597ENQXJ0SF2KQZTS4D8C.log` |
| `build-review2` | `npm run build` | exit 0 | `gate-build-review2-01M64598WFSKTQMYTDM1N9EQBQ.log` |
| `npm-test-node22-23-review2` | `env AF_TEST_CONCURRENCY=4 npm test` | exit 0 — **9354 tests, 9291 pass, 0 fail, 0 cancelled, 63 skipped, 0 todo**, 497 suites, 489.95 s | `gate-npm-test-node22-23-review2-01M6459WS89MJGZRYH2PA5XZGP.log` |
| `admission-review2` | `node --test --test-concurrency=1 --test-force-exit dist/test/mcpl-{required-admission,required-push-admission,required-inference-admission,admission-lifecycle,admission-no-hook,admission-compatibility}.test.js` | exit 0 — **138 pass, 0 fail, 0 skipped** | `gate-admission-review2-01M645SGZ4SVN01PGG71754637.log` |

Setup note: this worktree had no `node_modules` and the repo has **no
`package-lock.json`**, so `npm ci` is impossible here; I installed with capped
`npm install --no-audit --no-fund` (exit 0). Dependency resolution is therefore
range-resolved rather than lock-pinned — `@animalabs/mcpl-core` resolved to
`0.4.0`, matching the exact pin in `package.json`.

**Discrepancy with the manager's run, resolved in the implementation's favour:**
the brief reported 9289 pass / **2 fail** (liveness-watchdog SIGKILL/SIGABRT) / 63 skip
at this HEAD. My capped run at the same HEAD gave **9291 pass / 0 fail / 63 skip** —
those two tests passed. Classification: **environment/load-sensitive**, not a code
defect and not a regression. Test and skip totals otherwise match FIX1 exactly.

Unwrapped scoped probes (no receipt): the carrier-1 production-path probe
(`probes/probe-result-hints.mjs`) and the six-mutation matrix below.
Mutations were applied to compiled `dist/` only (ignored build output), with
`dist/src` restored from a pristine copy after each run; final `diff -r dist/src
/tmp/rv2-dist-pristine` is clean and `git status --porcelain` is empty. Nothing
was written inside the tracked tree.

### Mutation matrix (6 applied, 6 killed; baseline 138 pass / 0 fail)

| Mutation | Result | Log |
| --- | --- | --- |
| **M12** weaken `snapshot` descriptor guard to `typeof key !== 'string'` | **killed, 4 fail** (was *survived* in REVIEW1) | `m12.log` |
| **M15** drop only the `admissionReceipts.has` arm of the `emit` guard | **killed, 1 fail** (was *survived*) | `m15.log` |
| **M16** drop both post-decision ceiling downgrades | **killed, 2 fail** (was *survived*) | `m16.log` |
| **F1** neutralize the new standalone `tools/hints` refusal | killed, 1 fail | `f1.log` |
| **F2** restore the broad `config.inboundAdmission !== undefined` startup abort | killed, 1 fail | `f2.log` |
| **F3** revert the required capability refusal to `'capability_denied'` | killed, 3 fail | `f3.log` |

## Unmet Criteria / test gaps

No acceptance criterion is unmet, and every REVIEW1 finding is closed. Remaining gaps:

- **No test and no doc line for RFC-014 carrier 1** (result-borne hints) on a
  required connection — the LOW above. This is the only new gap this round.
- The three labelled internal-boundary scaffolds noted in the LOW above; each has
  a real-transport sibling, so the production path is covered, but the scaffolds
  themselves would survive a dispatch refactor.
- Carried over from REVIEW1 and deliberately deferred by FIX1:
  `admission_mode_ungranted` has no producer and no host-returns-it test; the
  nine-file connector AST delta check is an evidence script, not a committed test
  (the committed AST test still covers `inbound-admission.ts` alone). Design §6
  asks for `routing-runtime-has-no-connector-literals` as a committed test, though
  §7 places "no connector literals" under slice **B**'s exit, not A's.
- Attestation-refusal-aborts-startup has no dedicated startup test; it shares the
  `AdmissionConnectError` path with the binder case, which *is* tested, so coverage
  is adequate but the doc sentence is only transitively pinned.
- The 63 full-suite skips are pre-existing and unrelated.

## Residual Risk

- The required profile's "no peer-caused effect before a verdict" guarantee is
  still not total: result-borne hints apply, mutate toolset presentation state and
  can schedule host→peer `tools/list`/`toolsets/list` traffic with no verdict and
  no grant. Narrower than before fix round 1 (which also left the unsolicited
  carrier open) and solicited rather than unsolicited, but real and undocumented.
- The MEDIUM-2 fix trades a loud failure for a quiet one: a required server that
  cannot start is now silently absent at startup. That is the correct call (an
  absent connection admits nothing, and it is what W asks for), and it is stated
  in the doc and changelog, but operators relying on the strict profile must now
  watch `Failed to connect MCPL server` / the `mcpl:server-connect-failed` trace
  rather than relying on create() rejecting.
- 1..60000 ms and 64 pending remain declared initial bounds with no production
  sizing evidence; a 64-item batch of 60 s timeouts can still occupy one request
  for about an hour. W §10's known open risk, not a defect here.
- Host hooks run in-process: timers cannot preempt a synchronous infinite loop nor
  undo external writes. Documented.
- Probes used synthetic WebSocket/stdio peers and a mock membrane, never a deployed
  connector or provider.
- Dependencies were range-resolved (`npm install`, no lockfile in the repo), so my
  gate runs are not byte-reproducible against the implementer's install; the one
  version that matters here (`@animalabs/mcpl-core`) is an exact pin and matched.
- Only Node 22.23.3 was exercised by me. FIX1's Node 22.12.0 gates are implementer
  receipts I did not reproduce; the brief named 22.23.3 only.

## Fix Directions

1. Decide carrier 1 explicitly. Either suppress `tapResponse` for required
   connections (`server-connection.ts:2485`, mirroring the `:2522` push-tap
   suppression) with a test pair like the new carrier-3 one, **or** add one
   sentence to `docs/required-inbound-admission.md:38-42` and one to FIX1's
   Residual Risk saying result-borne hints are accepted because the host solicited
   them, plus a test pinning that choice. Today the doc's carrier list reads
   exhaustive and is not.
2. Before upstreaming, consider promoting `check-connector-delta.mjs` into the repo
   as `routing-runtime-has-no-connector-literals` over the nine touched runtime
   files, so the connector-agnostic property is guarded by CI rather than by one
   run's evidence. (Design §7 puts this under slice B; cheap to do now.)
3. Cosmetic, upstream-reviewer-visible: in `channel-registry.ts`, `inference-router.ts`,
   `types.ts` and `protocol-family.ts` the new `import` line was inserted *above*
   each file's leading module docblock, so the header is no longer the first thing
   in the file. Four one-line moves; no behavioural effect.
4. Nothing else blocks this series. The six commits are independently reviewable
   and, with item 1 settled, ready for upstream PRs.
