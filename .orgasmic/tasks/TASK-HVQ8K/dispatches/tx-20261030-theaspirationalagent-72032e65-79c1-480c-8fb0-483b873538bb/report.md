# Review — TASK-HVQ8K R1 fix round (PR #906), 66c9db3f..89fbae88

## Verdict

**Approve.** All ten maintainer findings (R1-1..R1-10) and all four automated Medium
comments are resolved as the maintainer described, with the dispatcher's R1-10 variant
honoured exactly. I reproduced the three repros the brief named (R1-1 `null` line,
R1-6 same-chunk ping, R1-3 quiesced push) against the built head myself; all three are
fixed and the unconfigured path is byte-identical to upstream main `48f26ce5` on every
changed line. Full suite on Node 22.23.3 at 89fbae88: **9612 pass / 0 fail / 63 skip**,
matching the implementer's claim.

Two MEDIUM findings remain, both residue of R1-3's new holding path rather than
regressions (pre-fix the same traffic was refused outright). Neither blocks ship;
both should be disclosed to the maintainer in the disposition, and one needs a
documentation sentence.

## Findings

### MEDIUM — correctness/docs: a held burst larger than `MAX_PENDING_ADMISSIONS` is refused at flush
`src/mcpl/server-connection.ts:882-903` (`flushHeld`) dispatches the whole held snapshot
in one synchronous loop; each item's handler then starts its own `admit()`, so all held
items contend for the same 64-slot budget (`src/mcpl/inbound-admission.ts:158`). Hold bounds
are `MAX_HELD_NOTIFICATIONS = 1000` / `MAX_HELD_REQUESTS = 10_000`
(`server-connection.ts:721,730`), i.e. two orders of magnitude above the admission budget,
so any quiesce or startup-staging window that accumulates more than 64 data-lane items
refuses the overflow.

Probe (`/home/orgasmic/.orgasmic/runs/run-01M667D8BDA7CRMZ3CTKJNDYG1/evidence/budget.mjs`, real WebSocket fixture, quiesce → 70 `push/event` requests → resume):
- unconfigured: `{"accepted":70}`, hook not involved;
- required, allow-everything hook: `hookCalls: 64`, `{"accepted":64,"refused:admission_denied":6}`.

Impact: R1-3's preferred fix was "hold required data-lane items exactly as unconfigured ones
are held". For bursts it does not. Requests get an honest `accepted:false, reason:admission_denied`
(retryable), but notifications (`channels/incoming` / `push/event` without an id) have no wire
receipt, so the content is lost with only the R1-7 trace as a record — exactly the startup-backlog
case R1-3 was filed about (a bridge replaying its backlog after a restart). Neither
`docs/required-inbound-admission.md` nor `changelog.d/required-inbound-admission.added.md`
mentions it; both read as if the hold is transparent.

Fix direction: admit flushed items sequentially (as channel-batch items already are), or
queue rather than refuse when the overflow comes from a flush; failing that, document the
interaction between the hold bounds and `MAX_PENDING_ADMISSIONS` in the doc and changelog.

### MEDIUM — correctness/docs: concurrent admission reorders held items relative to arrival
Because `flushHeld` starts every held item's admission concurrently, storage order follows
hook-completion order, not arrival order.

Probe (`/home/orgasmic/.orgasmic/runs/run-01M667D8BDA7CRMZ3CTKJNDYG1/evidence/order.mjs`, 5 held pushes, hook latency `(N-i)*20 ms`):
- `plain` (unconfigured): `0,1,2,3,4`
- `equal` (uniform 5 ms hook): `0,1,2,3,4`
- `stagger` (descending latency): `4,3,2,1,0`

Classification: **pre-existing in the PR, not a regression of this round** — `/home/orgasmic/.orgasmic/runs/run-01M667D8BDA7CRMZ3CTKJNDYG1/evidence/order-live.mjs`
reproduces the same reversal on live pipelined traffic without any quiesce, so it is a property
of the admission await itself, present at `119cb86`. R1-3 amplifies it by creating a systematic
concurrent burst at every flush. Items inside one `channels/incoming` batch are unaffected
(`channel-registry.ts:1867` is a sequential loop).

`docs/required-inbound-admission.md:39-41` says required data "is held during startup staging,
policy exchange and quiesce just like unconfigured traffic", which a reader will take to include
order. Fix direction: either flush sequentially (also fixes the finding above) or state that the
host callback's latency determines relative ordering of independently-sent items.

### LOW — docs: "toolset result adoption" coverage is a scaffold, not the production path
The PR body claims regression coverage for "toolset result adoption", and the disposition says
R1-2 "verified solicited toolsets/list state adoption through the transport tap". The test
(`test/mcpl-admission-lifecycle.test.ts:379-386`) first asserts
`inner.toolsets().get('endpoint') === undefined` and then *manually* constructs and attaches a
controller — because `hintsFor()` now returns `false` for required connections
(`src/framework.ts:33053`), so the framework installs no RFC-014 controller at all and no
`toolsets/*` bookkeeping happens in production on a required connection. That is the intended
consequence of R1-2 (RFC-014 §6.3), and the implementer report discloses the scaffold, but the
PR body does not. Fix direction: in the PR body say the generic result tap is preserved and that
required connections carry no toolset presence, rather than "toolset result adoption".

### LOW — design: `toolHints: true` is now silently overridden
`src/framework.ts:33053`: `if (config.inboundAdmission !== undefined || config.toolHints === false …) return false;`
An operator who configures both `toolHints: true` and `inboundAdmission` gets hints silently
disabled, with no `serverConfigProblems` diagnostic and no log line. The maintainer offered
rejecting the combination in `serverConfigProblems` as the alternative; the chosen branch is
documented (`docs/required-inbound-admission.md:43-45`) but not surfaced at config load.
Fix direction: either reject the combination as a config problem or log once at connect.

### LOW — test: the scoped connector inventory now duplicates an existing check
`test/routing-runtime-has-no-connector-literals.test.ts` was correctly narrowed to
`src/mcpl/inbound-admission.ts` with an empty allowance (R1-5 ✓), but
`test/mcpl-admission-compatibility.test.ts:33-53` already AST-scans the same file for the same
vocabulary — which is what the automated Medium comment pointed at when it suggested dropping
the file. Harmless; a candidate for removal if the maintainer prefers one check.

## Per-finding judgement

| id | resolved | evidence |
| --- | --- | --- |
| R1-1 | yes | `refuseEarly` listener deleted; refusal moved into the handshake `onLine` `'method' in msg` branch after `messageFromLine` (`server-connection.ts:1405-1410`). Probe `/home/orgasmic/.orgasmic/runs/run-01M667D8BDA7CRMZ3CTKJNDYG1/evidence/r1-1.mjs`: peer writes `null\n` + 3 data requests before its initialize result — both profiles log "length 4 that is JSON but not an object" and connect; no `uncaughtException`. Exactly the maintainer's preferred fix. |
| R1-2 | yes | `hintsFor()` returns false for `inboundAdmission !== undefined` (`framework.ts:33053`), so `mcplHostCapabilitiesFor` omits `toolHints` and `controllerFor(...).attach` is skipped (`:33463-33484`). All three special cases removed: `tapResponse` (`:2492`), push tap (`:2521`), `tools/hints` branch — each now byte-identical to upstream `48f26ce5:2417/2446/2447` (verified). `grep requiredAdmission src/mcpl/server-connection.ts` shows no remaining generic-behaviour suppression. `tap`/`tapResponse` are no-ops with `readTap === null`, so stray peer hints are ignored, not dropped mid-state. RFC-014 §6.3 conformance holds. |
| R1-3 | yes, with the two MEDIUMs above | Pre-plane refusal block deleted; receipt epoch recorded at line receipt (`:2573`) and `capture()` now runs at the plane-gate choke point under the current key (`:1068-1086`), re-checking epoch / `isConnected` / grant / both planes at `admit()` time (`inbound-admission.ts:118-129`). Probe `/home/orgasmic/.orgasmic/runs/run-01M667D8BDA7CRMZ3CTKJNDYG1/evidence/r1-3.mjs`: quiesced `push/event` is held (`buffered = 1`), unanswered, then `{"accepted":true}` after `resume()` with content delivered — identical to unconfigured. Superseded epoch → `admission_stale` (`:1074-1077`), no rebinding, hook not called. No double admission (one `capture` per `emit`, one `admit` per handler; `admissionFor` falls back to a refusing receipt). Memory while held is bounded by the pre-existing `MAX_HELD_*` counters — `capture()` takes no slot and both maps are `WeakMap`s. |
| R1-4 | yes | `params.coalesce !== undefined` → `admission_unsupported` before the hook, dedup and any acceptance (`push-handler.ts:167-171`, after feature validation per the earlier ordering decision; `channel-registry.ts:1937-1940`, after §14.5 and identity, before `markAccepted`/the coalescer). I read both prefixes: no state is recorded and no acknowledgement is sent before the refusal, so there is no acknowledge-then-drop path. Documented, with reconnect-with-pending-batch tests on both profiles. |
| R1-5 | yes | Inventory narrowed to `{'src/mcpl/inbound-admission.ts': {}}`; the ~100 Discord ceilings and the catch-all are gone. |
| R1-6 | yes | Probe `/home/orgasmic/.orgasmic/runs/run-01M667D8BDA7CRMZ3CTKJNDYG1/evidence/r1-1.mjs`: the peer's `ping` sent in the same write as the initialize result is answered `{}` on **both** profiles (previously unanswered when required), and the three early data lanes get `-32002 capability_denied`. The handshake-phase answer is now documented at `docs/required-inbound-admission.md:77-82`, including that notifications are discarded and malformed lines use the normal decoder. |
| R1-7 | yes | New `AdmissionRefusals` (`inbound-admission.ts:184-196`) emits the sibling traces (`mcpl:channel-incoming-rejected`, `mcpl:push-event-rejected`, `mcpl:inference_fail`) with the fixed code and a `RefusalLines`-bounded log line, wired into all four refusal sites including `refuseAdmission` (via a new `admission-rejected` event forwarded by `framework.ts:33476`) and the inference cancellation path. No payload or callback-exception text is logged (asserted in `test/mcpl-admission-diagnostics.test.ts`). |
| R1-8 | yes | `admissionConnectErrorOf` walks a cycle-safe `cause` chain (`inbound-admission.ts:36-43`); startup uses it (`framework.ts:32347`). Test drives a real stdio handshake with a deliberately failing first `close()` for both binding and attestation failures and asserts the startup rejection still carries the `AdmissionConnectError`. |
| R1-9 | yes | `src/index.ts:223` exports `admissionOf`, `AdmissionConnectError`, `MAX_ADMISSION_TIMEOUT_MS`, `MAX_PENDING_ADMISSIONS` and `type AdmittedEnvelope`; `test/mcpl-admission-public.test.ts` reads a frozen receipt from a module's `onProcess` through the package entry point and shows forged metadata yields `undefined`. |
| R1-10 | yes, per the dispatcher | `wakeForbidden` is now exactly `admissionOf(event)?.mayWake === false` (`inbound-admission.ts:82-84`). The `triggerInference = false` writes at `framework.ts:17434` / `:19299` stay, so the gate decline remains module-visible, as the dispatcher required; the two old tests are renamed and replaced with the two confirmed intents (`mayWake:true` permits a module wake despite a false gate; `mayWake:false` still caps every downstream wake including `requestInference`, and a later veto still downgrades the module-visible event). Docs and changelog state both halves. |
| bot M1 (null handshake line) | yes | = R1-1. |
| bot M2 (coalesced work revoked) | yes | = R1-4, by refusing before acceptance. |
| bot M3 (Discord ceilings) | yes | = R1-5. |
| bot M4 (no handshake-refusal coverage) | yes | `test/mcpl-admission-lifecycle.test.ts:440-456` covers `null` input, all three data lanes and the same-chunk ping over a real stdio peer. |

### Unconfigured path vs upstream main 48f26ce5
Every production line this round changed is either admission-guarded or a revert to upstream:
- guarded: the `emit` required block (`this.requiredAdmission &&`), the `onLine` refusal (`admission &&`), `admissionEpochs.set` (`:2572`), the `admission-rejected` subscription (`registering.requiredAdmission &&`), and all `channel-registry` / `push-handler` / `inference-router` diffs (inside `if (admission)` / `handleRequiredPushEvent`);
- reverts: `:2492`, `:2521`, `:2522` now match `48f26ce5:2417/2446/2447` character for character (diffed);
- `hintsFor` adds a leading `config.inboundAdmission !== undefined ||`, inert when undefined;
- `admissionConnectErrorOf(error)` replaces `instanceof AdmissionConnectError`; only `RequiredAdmission` ever constructs that class, so no unconfigured error can match;
- `wakeForbidden` returns false without an envelope, as before;
- `src/index.ts` is additive.
No unguarded behavioural change to the unconfigured path.

### Disposition / PR body / hygiene
- All ten disposition commit ids exist in `66c9db3f..89fbae88` and each contains the change it claims (diffed individually). No overclaim found except the LOW "toolset result adoption" wording above.
- PR body is accurate on every contract bullet I checked, and its head verification row (9612/0/63) reproduces exactly. Its hold description omits the burst-overflow refusal (MEDIUM 1).
- All 10 commits: author **and** committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, trailer `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`.
- No internal names, hosts, people or task ids in commit messages, the diff, docs, changelog, disposition or PR body. (`Anarchid` appears only in three pre-existing upstream attribution comments in `channel-registry.ts:5` and `server-connection.ts:736,1576`, untouched by this round.)
- `git diff --check` clean; worktree clean, left as found (only ignored `dist/` touched).

## Verification Gates

Run by me at `89fbae8814fd8b5c0ae68f20087d2abc75de84cf`, Node **v22.23.3** (`/opt/node/bin`), each under
`XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`,
after `npm install --ignore-scripts --no-save` (no tracked lockfile; `package-lock.json` is gitignored).
Implementer receipts were **not** reused for these.

| gate | command | outcome | log |
| --- | --- | --- | --- |
| `rev-22.23.3-typecheck-build` | `npm run typecheck && npm run build` | exit 0 | `gate-rev-22.23.3-typecheck-build-01M667EB9VQ720EB69SMBQPFSW.log` |
| `rev-22.23.3-test` | `npm test` | exit 0 — **9675 tests, 9612 pass, 0 fail, 63 skip, 505 suites**, 158 s | `gate-rev-22.23.3-test-01M667EFMMABM02D6C1Y7QWNK7.log` |

Production-path probes (artifacts copied into this evidence directory, run from `dist/`, not the test runner):
`r1-1.mjs` (real stdio peer: `null` line + early data lanes + same-chunk ping, both profiles),
`r1-3.mjs` (real WebSocket fixture: quiesce → `push/event` → resume, both profiles),
`budget.mjs` (70 held pushes across a quiesce, both profiles),
`order.mjs` / `order-live.mjs` (held and live ordering under staggered hook latency).

Reused, not re-run: the implementer's `head-22.12.0-{typecheck,build,test}` receipts (all exit 0 at
this commit) cover the second Node version the PR body claims; the brief named only 22.23.3 for me.
Base-revision counts (9595/0/63) are the implementer's evidence and were not reproduced.

## Unmet criteria / test gaps

- No test covers the flush-burst overflow (MEDIUM 1) or held-item ordering (MEDIUM 2). The
  existing lifecycle tests hold a single item per lane.
- No test exercises a required connection whose host callback has non-uniform latency.
- The `toolsets/list` adoption test needs a hand-attached controller; there is no production-path
  test that a required connection carries no toolset presence at all (the intended outcome).
- `MAX_HELD_*` vs `MAX_PENDING_ADMISSIONS` is untested as an interaction.

## Residual risk

- Required coalescing is refused rather than made durable; operators must drain pending coalesced
  work before switching an existing binding to the profile. Documented in the doc, changelog and
  PR body.
- Required connections carry no RFC-014 toolset state at all. Peers that relied on hints must
  tailor their inventory; `tools/list` still supplies presence and `mcpl/rev` via `sendToolsList`.
- On a required connection with `mayWake: true`, a gate decline still sets the module-visible
  `event.triggerInference = false` (`framework.ts:17434`, `:19299`) while permitting a module wake.
  That asymmetry with unconfigured connections is the dispatcher's explicit decision, and is stated
  in the doc and changelog.
- Batch latency can still approach `batch length × timeoutMs`; the maintainer flagged this against
  peer request timeouts and it is unchanged.
- `attachAdmission` defines the receipt symbol with `enumerable: true`, so a shallow spread of an
  admitted event copies the envelope. Pre-existing, unchanged this round, not exploitable from the
  wire, but worth a look when slice D adds stamps.

## Fix directions (priority order)

1. Make flush admission sequential per lane (mirroring the channel-batch loop), which removes both
   MEDIUMs at once; or, minimally, add one sentence to `docs/required-inbound-admission.md` and the
   changelog saying that a flush larger than `MAX_PENDING_ADMISSIONS` refuses the overflow with
   `admission_denied` and that independently-sent items are ordered by callback completion. Mention
   the former in the disposition so the maintainer sees it rather than finding it in R2.
2. Reword the PR body's "toolset result adoption" to "generic result taps preserved; required
   connections carry no toolset presence".
3. Optionally reject `toolHints: true` together with `inboundAdmission` in `serverConfigProblems`,
   or log the override once at connect.
4. Optionally delete `test/routing-runtime-has-no-connector-literals.test.ts` in favour of the
   equivalent check already in `test/mcpl-admission-compatibility.test.ts`.
