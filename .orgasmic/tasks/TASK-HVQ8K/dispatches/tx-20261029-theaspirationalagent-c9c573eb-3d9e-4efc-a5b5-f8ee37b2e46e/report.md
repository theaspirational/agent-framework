# TASK-HVQ8K — review of the second upstream rebase (453484be on upstream main 9b54c588)

Reviewed `453484be889a665b88f7386eabd9484824960c32` (six commits on upstream main
`9b54c588234f852c7299412be2d8e627bdf02095`) against the previously approved tree
`f0d66760c832c0e36337cdbf0b7dd8747a57eae2` (on `84e04089`).
Read in full: `/srv/review-drop/TASK-HVQ8K-REVIEW2.md`, `/srv/review-drop/TASK-HVQ8K-REBASE2.md`,
`/srv/review-drop/HVQ8K-PR-BODY.md`.
All gates rerun by me in this worktree; no implementer receipt reused for any gate.

## Verdict

**Approve.** The rebase is a faithful carry-forward plus one genuinely new, well-built
integration. The admission semantics approved at `f0d66760` are unchanged: the per-file
patch against the new base is **byte-identical** to the patch against the old base for
`channel-registry.ts`, `push-handler.ts`, `index.ts` and `types.ts`; identical in every
added/removed line (context-only differences) for `server-connection.ts`; and differs by
exactly **one line** in `protocol-family.ts` (the conflict resolution), **one line** in
`framework.ts` (abort-signal forwarding), plus the inference-router cancellation work and
its 12 tests. The 20 upstream-only files are byte-identical to the new base. Typecheck,
build, the 7 focused files, the 6 upstream targeted files and the full `npm test` all pass
on Node 22.23.3 under the 16 GiB cap with **0 failures**. I killed the new fix by mutation
(6 of 8 mutations killed; both survivors explained below, neither a test gap).

No HIGH. One MEDIUM, and it is a **PR/doc accuracy** defect carried over from the approved
tree, not a rebase regression: the PR draft and `docs/required-inbound-admission.md` now
state an absolute "no peer tool hints from any carrier" guarantee that one carrier still
violates. I reproduced it on the production path.

## Findings

### HIGH
None.

### MEDIUM

**MEDIUM `docs/required-inbound-admission.md:39-40` / `/srv/review-drop/HVQ8K-PR-BODY.md`
("Apply no peer tool hints from any carrier on required connections") vs
`src/mcpl/server-connection.ts:1835` (docs/correctness — PR text over-claims a profile
guarantee).**

The polish round closed the `tapResponse` carrier (`server-connection.ts:2489`, guarded by
`!this.requiredAdmission`) and the push and standalone-`tools/hints` carriers (`:2526`,
`:2516`), and the doc/changelog/PR text were then rewritten to an absolute claim:
"Required connections apply no peer hints from any carrier. Result-borne hints are ignored
without losing the result." That claim is false for one path. `sendToolsList()`
(`server-connection.ts:1821-1839`) taps the completed inventory **directly** from its
`onRead` callback at `:1835` — `this.tap({ kind: 'result', method: 'tools/list', …, result:
{ tools, _meta } })` — with no `requiredAdmission` guard. `toolset-host.ts:231` routes it
to `readToolList` (`:306`), which calls `presence.setTools(tools)` and
`presence.noteListRev(_meta['mcpl/rev'])`, and on a rev gap calls `scheduleRecovery()`.
`:230-234` can also `scheduleRecovery()` on the `straddled` multi-rev condition. This is
the production refresh path: `framework.ts:35253` and `toolset-host.ts:498`.

Failure scenario, reproduced on a real WebSocket
(`$ORGASMIC_EVIDENCE_DIR/probes/probe-toolslist-hints.mjs`): a **required** connection with
`CapabilityGrant.empty()`, a peer declaring `toolHints` + a toolset, answering `tools/list`
with `_meta: { 'mcpl/rev': 7 }` →

```
required=true  | readTap=true presents=true | rev 7 -> 7 | taps=1 | admission hook calls=0 | recoveryTimer=true
required=false | readTap=true presents=true | rev 7 -> 7 | taps=2 | admission hook calls=0 | recoveryTimer=true
```

Host log on both: `[mcpl] editor: tools/list was written after rev 7, past the last rev
read: a message was lost; recovering`. The required connection applied the peer's rev and
scheduled host→peer `tools/list`/`toolsets/list` recovery traffic with **zero admission hook
calls** and no grant. (`required=false` shows `taps=2` only because `tapResponse` also fires
there; the `:1835` tap is identical in both.)

Why MEDIUM and not HIGH: the carrier is **host-solicited** (the host asked for
`tools/list`), the mutated state is the host's own view of the peer's catalogue which it must
read to function, the only outbound effect is host→peer list traffic, and there is no agent
wake, no delivered content and no stored data. No acceptance criterion is unmet — the
acceptance matrix covers `channels/incoming`, `push/event` and `inference/request`, all of
which are correctly gated. It is MEDIUM because the over-claim is in the **PR-facing** text
upstream maintainers will read as the security contract of the profile, and REVIEW2's LOW on
the sibling carrier explicitly warned that "the doc's carrier list reads exhaustive and is
not". Pre-existing at `f0d66760`; this rebase neither introduced nor widened it.

Fix direction (one of):
1. Guard `:1835` the way `:2489` is guarded — skip the tap when `this.requiredAdmission` —
   plus one pinning test. Note this would also stop the required profile from tracking
   `mcpl/rev` at all, which may be the wrong trade; check with the toolset-host owner.
2. Keep the behaviour and make the text true: say that the host's own `tools/list` result
   still supplies `mcpl/rev` and tool presence because the host solicited it, and pin that
   choice with a test. Either way, drop the word "any" from "from any carrier".

### LOW

**LOW `src/mcpl/inference-router.ts:253` (dead code / no witness): the new early
`if (admission && responder.signal?.aborted) return;` guard is unreachable and untested.**
Mutation **m-earlyguard** (delete the guard) ran 94 tests across
`mcpl-required-inference-admission`, `mcpl-inference-abort` and `mcpl-admission-lifecycle`:
**0 failures** (`probes/m-earlyguard.log`). It is unreachable because a request whose
transport has already closed is intercepted one layer up: `server-connection.ts:2630`
(`afterBoundary`) refuses the three required lanes with `admission_stale` before dispatch,
and there is no `await` between `dispatchInboundEvent` and `handleInferenceRequest`
(`framework.ts:34722-34758` is synchronous up to the call), so `responder.signal` cannot
abort in that window. Harmless defence in depth, but an upstream reviewer will ask what
reaches it. Fix direction: delete it, or add the comment naming `afterBoundary` as the real
gate.

**LOW `test/mcpl-required-inference-admission.test.ts:43-120` (test gap, narrow): no case
covers "admission allows, then stop/close during the provider call" on a required
connection, and none asserts the `mcpl:inference_fail` trace the admission-path `answerStop`
emits with `model: null` (`inference-router.ts:303`).** All 12 interaction cases keep the
hook pending. The uncovered transition is the handoff from the admission block's
`answerStop` listener (removed in its `finally`, `:244`) to the downstream listener
(`:311`). I read the window closed: everything between the two registrations
(`sendChunk`/`chunkRequestId`/`streamed`/`resolveModel`) is synchronous, so no abort can
interleave — which is why I rate this LOW rather than a real hole. Fix direction: one row
that allows the verdict and then stops during `membrane.complete`, asserting one answer and
the trace.

**LOW `test/routing-runtime-has-no-connector-literals.test.ts:13-132` (test, upstream
friction): the committed inventory is a hard ceiling over upstream-owned files.** I
recomputed it independently: **322 allowed, 322 actual, 0 per-key mismatches at HEAD, and
322 with 0 per-key differences at the new base `9b54c588`** — so the ceilings are exactly
tight and this series adds zero connector vocabulary (claim in REBASE2 confirmed, and the
new admission modules are all `{}`). The cost is that any future upstream commit which adds
one `discord*` identifier use to `src/framework.ts` fails a test that lives in the admission
PR. Fix direction: none for this round; mention it in the PR body so maintainers know to
bump the ceiling rather than suspect the admission code.

**LOW (carried over, acknowledged): `admission_mode_ungranted` is still in the closed
`RefusalCode` enum (`src/mcpl/inbound-admission.ts:10`) with no framework producer and no
test that a host may return it.** The PR draft asks maintainers about it (question 2), which
is the right disposal, but an enum member no code can emit will still draw a review comment.

## Verification of what changed since the approved tree

### Preservation and series shape (all checked by me)

| Check | Method | Result |
| --- | --- | --- |
| Upstream-only files byte-identical | `git rev-parse 9b54c588:<f>` vs `HEAD:<f>` for all 25 files in `git diff --name-only 84e04089 9b54c588` minus the 5 overlap files | **20/20 identical**, 0 mismatches |
| Task file set unchanged | `diff` of `--name-only` lists, old base→`f0d66760` vs new base→`HEAD` | empty; 19 files both times |
| Admission semantics unchanged | per-file `diff` of the two lane patches | `channel-registry.ts`, `push-handler.ts`, `index.ts` **identical**; `types.ts` identical but for the blob header; `server-connection.ts` identical in every `+`/`-` line (context/line-number only); `protocol-family.ts` differs by 1 line; `framework.ts` by 1 line |
| No upstream line dropped | every `^-` line in `git diff 9b54c588 HEAD -- src/` read | all 23 are modified-in-place lines; `McplProtocolVersionError`, the `handshake(config, hostCapabilities, signal)` arg list and the capability-refusal body are all preserved inside their replacements |
| Per-lane commits | `git diff --numstat` per commit | core → channel → push → inference → cross-lane tests → docs; **no lane commit edits another lane's runtime lines**; cancellation folded into core + inference as claimed |
| Lane independence | my own `GIT_INDEX_FILE` + `read-tree e88568d1` + `git apply --cached --check` | `2fff7dc6`, `1c5b4383`, `bcdf069e` each apply on the shared core |
| Identity / not pushed | `git log --format` + `git branch -r --contains HEAD` | all six author+committer `Vasyl Dovhanchyn <48733736+theaspirational@…>`, each with the `Co-Authored-By: GPT-6-Astra` trailer; **no remote contains HEAD** |
| Whitespace | `git diff --check 9b54c588 HEAD` | clean |
| Tree state | `git status --porcelain` at start and finish | empty; `dist/src` restored bit-identical to a pristine copy after every mutation |

### The four focus areas, read and probed

1. **`protocol-family.ts:697-704` conflict resolution — correct and load-bearing.** Upstream's
   `const problems: string[] = credentialRequiredProblems(config)` is retained as the initial
   array; the admission problems are appended after it. The file's only diff against the new
   base is `+6/-0`, so `credentialRequiredProblems` and every strict-dial helper are
   byte-identical by construction. Mutation **m-credprob** (resolve the conflict the other
   way, `problems = []`) → **23 failures** in `mcpl-strict-credentials` /
   `mcpl-strict-errors`, including every `strict validation rejects …` and
   `strict direct dial validates before provider` row (`probes/m-credprob.log`). The wrong
   resolution would have been loud.

2. **`inference-router.ts:225-307` answer() split and admission threading — correct.** The
   admission block's check/admit/recheck/validate lines are **character-for-character** the
   approved tree's block (`git show f0d66760:src/mcpl/inference-router.ts`), now wrapped in
   abort guards; the optional `admission` parameter is threaded through `handleInferenceRequest`
   into the private `answer`, inside upstream's `running`/`finally` tracking, so a pending
   admission is part of the request's tracked lifetime. Unconfigured connections are untouched
   (`admission` is `undefined`, every new branch is `if (admission)`-gated).

3. **Cancellation (`inbound-admission.ts:74,113,142-164`) — correct, and the slot is released
   without the connection.** `run()` takes an optional caller signal, returns
   `admission_stale` before consuming a slot if it is already aborted, and otherwise forwards
   its abort to the internal controller; the `cancelled` race then settles, and the `finally`
   clears the timer, removes the listener and deletes the pending entry even if the callback
   never cooperates. `Promise.resolve().then(() => controller.signal.aborted ? refusal(…) :
   work(…))` means work cancelled before its microtask never calls the hook. The channel and
   push lanes pass no signal, so their behaviour is unchanged.
   Mutation **m-cancel** (drop `signal?.addEventListener('abort', abort)`) → **4 failures,
   exactly the four `router-stop` rows** (`probes/m-cancel.log`), which is precisely the
   claim that slot release does not depend on connection teardown: with the connection alive,
   nothing else aborts the controller.
   Mutation **m-epochinvalidate** (drop `requiredAdmission?.invalidate()` from
   `resetPolicyForTransportBoundary`, `server-connection.ts:563`) → **1 failure**,
   `real stdio notification awaiting admission cannot cross a replacement connection with the
   same id` (`probes/m-epochinvalidate.log`). Ordering is right: `invalidate()` runs *before*
   `transportEnded.abort()` (`:563` then `:567`), so by the time the router's await resumes the
   responder signal is already aborted and the answer is suppressed. `close()` (`:1960`) and
   the transport `lost` handler (`:2864`) both go through the same reset, so a permanent close
   cancels pending admission too.

4. **Responder abort-signal forwarding (`framework.ts:34760`) — correct and load-bearing.**
   The required branch now spreads `...(responder.signal ? { signal: responder.signal } : {})`
   exactly as the unconfigured branch at `:34771` does. Mutation **m-sigfwd** (remove it) →
   **4 failures, the four `close` rows** (`probes/m-sigfwd.log`).

5. **One stopped answer, no double answer, no provider call.** The stop path answers with
   upstream's `hostStoppedWhileHandling()` (`-32000`, "the host stopped while handling this
   request") while the transport is live, and `answerStop`'s `if (responder.signal?.aborted)
   return` suppresses it after a close. Mutation **m-stopanswer** (remove the listener and the
   already-aborted call) → **8 failures** (all `stop` and `router-stop` rows,
   `probes/m-stopanswer.log`). Mutation **m-allguards** (remove all four post-await
   `signal.aborted` guards) → **4 failures**, the `close` rows (`probes/m-allguards.log`).
   Worth recording for the PR: the "answers once" property is held **twice** — the guards here,
   and upstream's pre-existing `containedInboundHandler` once-guard
   (`framework.ts:34482-34516`, "a second answer was refused; the request was already
   answered"), which I confirmed by instrumentation is what absorbs the second answer in the
   stop rows when the guards are removed.

### The 12 new interaction tests — real transport, load-bearing

`test/mcpl-required-inference-admission.test.ts:43-120` is 3 ends (`stop`, `router-stop`,
`close`) × late `store` true/false × `stream` true/false over a real `WebSocketServer` with a
real `AgentFramework.create`, a hook that never resolves until the test releases it, and
instrumentation of **router answer attempts** (`sendResponse`/`sendErrorResponse`) rather than
epoch-filtered wire writes. Each row asserts: hook signal aborted immediately, `pending.size
=== 0`, exactly one answer attempt for stop/router-stop and **zero** for close, the exact
`[71, -32000, 'the host stopped while handling this request']` argv, one `-32000` reply
actually visible to the peer, then — after the late verdict — no second attempt, zero
`resolveModel` calls and zero membrane calls. The 5-second `until` hang guard is what fails
when cancellation regresses. They killed 5 of my 5 behavioural mutations. Verified green in my
own `focused-review3` receipt (rows 130-141).

Two survivors, both benign, reported for completeness:
- **m-postguard** (remove only the *first* post-await `signal.aborted` guard) survived — the
  other three guards in the same block cover it. Redundancy, not a gap; `m-allguards` kills
  the property.
- **m-earlyguard** — the LOW above.

### PR draft (`/srv/review-drop/HVQ8K-PR-BODY.md`) accuracy against the code

Accurate, with the single exception in the MEDIUM. Spot-checked against source:
`McplServerConfig.inboundAdmission` (`types.ts:229`); `timeoutMs` 1..60000 and 64 pending as
named constants (`inbound-admission.ts:4-5,34`); overload → `admission_denied`
(`:144`); whole-verdict validation incl. unknown-member rejection (`:120-127`); negative wake
authoritative downstream (`framework.ts:17073`, `:17286`, `:19151`); attestation optional and
binder/attestation failures fatal while transport outages stay non-fatal
(`framework.ts:32109-32112`, and the clause carries no connector identifier); cancellation
bullet matches the code and the tests; `@animalabs/mcpl-core` pinned **0.4.0** in
`package.json:60` and 0.4.0 installed; "each lane patch independently applies" verified by me.
The claim "an isolated router stop proves slot release does not depend on connection teardown"
is exactly what **m-cancel** demonstrated.
Required text fix: the bullet "Apply no peer tool hints from any carrier on required
connections" and maintainer question 3's "suppressing all peer hint carriers" are
over-broad — see the MEDIUM.

## Verification Gates

All run by me in this worktree at `453484be`, tracked tree clean at start and finish, on Node
**22.23.3** (`/opt/node/bin`, npm 10.9.9), each wrapped as
`orgasmic dispatch gate <name> -- env XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user
--scope -q -p MemoryMax=16G -p MemorySwapMax=0 <cmd>`. The cap was asserted from inside the
scope before use; **nothing ran uncapped**. No implementer receipt was reused for any gate.
Exact commands: `$ORGASMIC_EVIDENCE_DIR/run-review-gates.sh`; progression:
`review-gates-progress.log`.

| Gate | Command after the cap | Outcome | Receipt |
| --- | --- | --- | --- |
| `cap-and-engines-review3` | cgroup assertion via `/opt/node/bin/node` | exit 0 — `cap ok v22.23.3 { memory: '17179869184', swap: '0' }` | `gate-cap-and-engines-review3-01M64HKWKDPZAWEGWBFJCF23P8.log` |
| `typecheck-review3` | `npm run typecheck` | exit 0 | `gate-typecheck-review3-01M64HKWR5MWV7FTVAWJ53X4KK.log` |
| `build-review3` | `npm run build` | exit 0 | `gate-build-review3-01M64HKX822SHXHF08GBH90QJV.log` |
| `focused-review3` | `env AF_TEST_CONCURRENCY=4 node --test --test-concurrency=1 --test-force-exit <the 7 focused files>` | exit 0 — **161 tests, 161 pass, 0 fail, 0 skipped** | `gate-focused-review3-01M64HKXMGXQ9A16YTEGDTP6X5.log` |
| `upstream-regressions-review3` | same runner over `<the 6 upstream targeted files>` | exit 0 — **276 tests, 276 pass, 0 fail, 0 skipped** | `gate-upstream-regressions-review3-01M64HQ5TBBZ139GC619R91DXC.log` |
| `full-review3` | `env AF_TEST_CONCURRENCY=4 npm test` | exit 0 — **9563 tests, 9500 pass, 0 fail, 0 cancelled, 63 skipped, 0 todo**, 499 suites, 2032 s | `gate-full-review3-01M64HVMF55029YFYDDW1R72CG.log` |

The 7 focused files and the 6 upstream targeted files are exactly those named in REBASE2 and
the brief. My totals match the implementer's receipts exactly (161 / 276 / 9563-9500-63-0),
including the liveness-watchdog tests the manager's own earlier run saw fail; the wall-clock
was ~4× longer than the implementer's because another dispatch was running `npm test`
concurrently in `/tmp/af-mine-4534`. Only Node **22.23.3** was exercised by me, as the brief
names; the 22.12.0 column stays implementer receipts I did not reproduce.

Unwrapped scoped probes (evidence, not reusable receipts), all in
`$ORGASMIC_EVIDENCE_DIR/probes/`, each run under the same memory cap:
`probe-toolslist-hints.mjs` (the MEDIUM), the independent connector-inventory recount, and
the mutation matrix below. Mutations were applied to compiled `dist/src` only (ignored build
output), restored from `/tmp/rv3-dist-pristine` after each run; final `diff -r dist/src
/tmp/rv3-dist-pristine/src` is clean, `git status --porcelain` is empty, and a post-restore
rerun of the interaction file is 17/17. Nothing was written inside the tracked tree.

### Mutation matrix (8 applied, 6 killed; interaction baseline 17 pass / 0 fail)

| Mutation | Result | Log |
| --- | --- | --- |
| **m-credprob** resolve the `protocol-family.ts` conflict as `problems = []` | **killed, 23 fail** | `m-credprob.log` |
| **m-stopanswer** remove the stopped answer during pending admission | **killed, 8 fail** (all stop + router-stop) | `m-stopanswer.log` |
| **m-cancel** drop external-signal cancellation in `RequiredAdmission.run` | **killed, 4 fail** (router-stop only) | `m-cancel.log` |
| **m-allguards** remove all four post-await `signal.aborted` guards | **killed, 4 fail** (close) | `m-allguards.log` |
| **m-sigfwd** drop `responder.signal` forwarding in the required branch | **killed, 4 fail** (close) | `m-sigfwd.log` |
| **m-epochinvalidate** drop `requiredAdmission.invalidate()` at the transport boundary | **killed, 1 fail** | `m-epochinvalidate.log` |
| **m-postguard** remove only the first post-await guard | survived — redundant with the other three | (traced inline) |
| **m-earlyguard** remove the early closed-transport guard | survived over 94 tests — unreachable; see LOW | `m-earlyguard.log` |

## Unmet Criteria / test gaps

No acceptance criterion is unmet, and no finding from REVIEW1/REVIEW2 has reopened — the
REVIEW2 LOW on result-borne hints (carrier 1) is closed for `tapResponse`, which is why the
`:1835` remainder is now a text-accuracy MEDIUM rather than the same LOW. Remaining gaps:

- **No test and no doc line for the `sendToolsList` hint carrier** on a required connection —
  the MEDIUM. This is the only hint carrier left unpinned either way.
- **No "allow, then stop during the provider call" row** on a required connection, and no
  trace assertion for the admission-path stop answer — the LOW above.
- **The early `responder.signal?.aborted` guard has no witness** and I could not construct a
  reachable path to it — the LOW above.
- Three labelled internal-boundary scaffolds in `mcpl-admission-lifecycle.test.ts:180-182,
  325-331` and `mcpl-admission-compatibility.test.ts:68-71` (carried from REVIEW2, each with a
  real-transport sibling) are unchanged by this rebase.
- `admission_mode_ungranted` still has no producer and no host-returns-it test.
- Attestation-refusal-aborts-startup still has no dedicated startup test; it shares the tested
  `AdmissionConnectError` path with the binder case.
- The 63 full-suite skips are pre-existing and unrelated; they are reported as skipped, not
  covered.
- Node 22.12.0 was not exercised by me.

## Residual Risk

- The required profile's "no peer-caused effect before a verdict" guarantee is still not
  total: the host's own `tools/list` result supplies the peer's `mcpl/rev` and tool presence
  and can schedule host→peer recovery traffic with no verdict and no grant. Narrower than
  before the polish round, host-solicited, and with no wake/content/storage effect — but the
  PR text currently denies it exists.
- Cancellation releases framework bookkeeping only. It cannot preempt synchronous JavaScript
  or undo a noncooperative callback's external effects; it does guarantee such a callback can
  no longer start inference or deliver an admission result. Documented.
- 1..60000 ms and 64 pending remain declared initial bounds with no production sizing
  evidence; a 64-item batch at 60 s each can still occupy one request for about an hour. An
  open maintainer question, not a defect here.
- The committed connector inventory is a tight ceiling over upstream-owned files, so an
  unrelated upstream change can turn it red inside this PR.
- Dependencies are range-resolved (`npm install`; the repo has no lockfile), so my runs are
  not byte-reproducible against the implementer's install. The one pin that matters,
  `@animalabs/mcpl-core`, is exact and matched at 0.4.0.
- My probes used synthetic WebSocket/stdio peers and a mock membrane, never a deployed
  connector or a real provider.
- `git rev-parse` identity checks prove the 20 upstream-only files equal the new base; they do
  not prove upstream's *semantics* survive inside the 5 overlap files beyond the line-level
  reading, the targeted upstream suite (276 pass) and the full suite (0 fail) recorded above.

## Fix Directions

1. **Settle the `tools/list` hint carrier before upstreaming** (MEDIUM). Either guard
   `server-connection.ts:1835` with `!this.requiredAdmission` the way `:2489` is guarded and
   pin it with a test — checking first whether the required profile should still track
   `mcpl/rev` at all — or keep the behaviour and correct
   `docs/required-inbound-admission.md:39-40`, the changelog fragment and the PR bullet plus
   maintainer question 3 to say the host's own solicited list result is exempt, with a test
   pinning that choice. Minimum acceptable: stop saying "any carrier".
2. Delete the unreachable `inference-router.ts:253` guard, or annotate it with
   `afterBoundary` as the layer that actually refuses closed-transport required traffic.
3. Add one interaction row that allows the verdict and then stops during the provider call,
   asserting one answer and the `mcpl:inference_fail` trace; it closes the only untested
   transition in the new block.
4. Add a line to the PR body telling maintainers that
   `routing-runtime-has-no-connector-literals` is a ceiling over upstream-owned files, to be
   bumped rather than treated as an admission-code regression.
5. Nothing else blocks the series. The six commits are per-lane reviewable, each lane applies
   independently to the shared core, the upstream integration is clean, and the rebase
   preserves the approved admission semantics exactly.
