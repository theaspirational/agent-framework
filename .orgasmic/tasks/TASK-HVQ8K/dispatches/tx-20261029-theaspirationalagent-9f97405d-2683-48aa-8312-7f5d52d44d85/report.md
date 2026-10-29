# TASK-HVQ8K — second upstream rebase

## Changed

Rebased onto **9b54c588234f852c7299412be2d8e627bdf02095**.
Final HEAD **453484be889a665b88f7386eabd9484824960c32**, branch `task-hvq8k-impl`, clean.
Recovery ref `task-hvq8k-before-rebase2` points to
`f0d66760c832c0e36337cdbf0b7dd8747a57eae2`.

### Final six commits

```
e88568d1 feat(mcpl): add opt-in required admission core
2fff7dc6 feat(mcpl): preflight required channel deliveries
1c5b4383 feat(mcpl): preflight required pushes before effects
bcdf069e feat(mcpl): preflight required inference requests
0ebf8ad2 test(mcpl): qualify lifecycle and no-hook compatibility
453484be docs(mcpl): describe required admission and compatibility limits
```

Core / channel / push / inference / cross-lane tests / docs shape retained.
All six author and committer identities are Vasyl Dovhanchyn
<48733736+theaspirational@users.noreply.github.com>, each with the requested
`Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer.
[final-identities.txt](final-identities.txt), [commits.txt](commits.txt),
[range-diff.txt](range-diff.txt), [rebase.log](rebase.log), and [fold.log](fold.log)
record the rewritten series.

Diff versus new base: **19 files, +1,426/-23**.
[files-numstat.txt](files-numstat.txt) contains per-file counts.
No dependency/lockfile changes; compiled outputs are untracked build products, not new commits.
Evidence and PR text remain outside the worktree.

### Conflict resolutions and upstream integration

1. **Textual conflict — strict dial plus admission configuration**
   `src/mcpl/protocol-family.ts:699-704`: retain upstream's
   `credentialRequiredProblems(config)` as the initial problems array, then append admission
   configuration and protocol-family problems. Neither validator replaces the other.
   Strict credential validation and diagnostic helpers at `:772` onward are byte-identical
   to upstream. This was the only conflict reported by git.

2. **Semantic auto-merge — inference method split**
   `src/mcpl/inference-router.ts:225-253`: upstream moved handling into private `answer`.
   Thread the optional admission argument into that method; retain upstream running-request
   tracking/finally cleanup around the entire request. The textual auto-merge had left
   admission referenced outside its parameter scope.
   `src/framework.ts:34759`: forward the original responder's transport abort signal in the
   required branch, matching upstream's unconfigured branch at `:34770`.

3. **Semantic integration — stop/close during asynchronous admission**
   `src/mcpl/inference-router.ts:276-307`: required preflight now observes a combined stop/transport
   signal. Stop answers with upstream's existing -32000 stopped-request error while live;
   transport closure suppresses the router answer. Guards after the await and revalidation
   prevent late allow/refuse results from reaching model resolution, chunks or another answer.
   The preflight stop listener is removed in finally, before existing provider handling resumes.
   The early required-only guard at `:253` refuses to handle an already-closed transport.

   `src/mcpl/inbound-admission.ts:74,113,142-164`: optional per-request cancellation flows into
   the bounded runner. It aborts the callback signal, settles the admission race, clears its
   deadline/listener, and releases its pending slot even if the callback never cooperates.
   Work cancelled before its scheduled invocation never calls the hook.
   These changes are folded into shared core and inference commits, not an extra patch commit.

4. **Other overlapping auto-merges preserved**
   - `src/mcpl/server-connection.ts:563-568,2604`: epoch teardown retains both admission
     invalidation and upstream transport-controller abort/reset; responder signals stay tied
     to the original transport epoch.
   - `src/framework.ts:5478`: stopAll tracks pending inference before connection teardown.
   - `src/framework.ts:16918-16990`: upstream retired-module registration checks and synchronous
     response application retained verbatim. Admission's wake ceiling at `:17073` remains
     inside the subsequent application method.
   - `src/mcpl/types.ts:226-230`: admission remains additive; upstream credentialRequired
     configuration and provider semantics are untouched.
   - The 20 files touched only by upstream, including transport strict dialing, module registry,
     new tests, and release accounting, are byte-identical to the new base.

[overlap-review.patch](overlap-review.patch) records the final overlap diff against upstream.
[check-upstream-preservation.py](check-upstream-preservation.py) independently verifies the
unchanged files, retired-module dispatch block, and strict credential helper blocks.

### Red-before / interaction tests

No prior test exercised required inference admission across the new upstream stop lifecycle.
Added **12 real-WebSocket cases** at
`test/mcpl-required-inference-admission.test.ts:43-120`:
stop / isolated router stop / transport close × late allow/refuse × stream/non-stream.

Before the cancellation fix (after mechanical parameter/signal wiring):
- [red-abort-interaction.log](red-abort-interaction.log): **0 passed / 8 failed**.
  Stop answered `-32600 admission_not_ready`, not the existing stopped-request error;
  closed transports still received one router answer attempt.
- [red-slot-release.log](red-slot-release.log): **0 passed / 4 failed**.
  Isolated router stop did not end pending admission within the hang guard while the
  transport remained live; its uncooperative callback retained the slot.
- Both red runs followed successful capped builds, with gate receipts recording intentional
  dirty-tree failures. They are regression evidence, not reusable final gate passes.
- [interaction-green.log](interaction-green.log): **30 passed / 0 failed**, combining the
  expanded required inference file with upstream's inference-abort tests before folding.

The final tests inspect actual router answer attempts (not just epoch-filtered wire writes),
one stopped reply visible to the peer, no reply on close, callback cancellation, zero pending
slots, zero model resolution/provider calls, and no second answer after a late verdict.
The isolated router-stop variant proves cancellation does not rely on connection invalidation.

### Inventory and PR text

Compared the committed connector AST inventory with both upstream bases. It remains exactly
**322 inherited occurrences in nine runtime files**; **no regeneration was needed or performed**.
Comparison input is git content from the bases, never new implementation occurrences.
[compare-inventory.cjs](compare-inventory.cjs) records the method.

Updated `docs/required-inbound-admission.md:57-60` and the changelog to describe pending inference
cancellation. The PR draft changes only the now-different cancellation behavior and test coverage.
It still recommends one PR with six reviewable commits, preserving the alternative four-PR titles
and maintainer questions. The full draft is below and in
[upstream-pr-draft.md](upstream-pr-draft.md).

## Verification Gates

All final gates ran freshly at **453484be889a665b88f7386eabd9484824960c32** with a clean tracked tree.
No previous gate pass was reused.
Every node/npm invocation ran under:
`XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0`.
No uncapped fallback. Node paths:
`/opt/node/bin` and `/tmp/credential-engines/node-v22.12.0-linux-x64/bin`.

All named checks used `orgasmic dispatch gate <name> -- <command>`.
Exact commands/environment: [run-gates.sh](run-gates.sh).
Start/end progression: [gates-progress.log](gates-progress.log).
Wrapper logs and owner PID/PGID records are alongside each receipt.

| Node | Command / gate | Result | Receipt |
|---|---|---|---|
| 22.23.3 | `npm run typecheck` | PASS | [typecheck-22.23.3](gate-typecheck-22.23.3-01M64DVXCM1J0TFFAGG27Z1HQM.log) |
| 22.23.3 | `npm run build` | PASS | [build-22.23.3](gate-build-22.23.3-01M64DVXTT9GWRY1SC2JG5W6MJ.log) |
| 22.23.3 | `node --test --test-concurrency=1 --test-force-exit <7 focused files>` | 161 tests; 161 passed, 0 skipped, 0 failed | [focused-22.23.3](gate-focused-22.23.3-01M64DVY958M8AMFQC5REYS23F.log) |
| 22.23.3 | `node --test --test-concurrency=1 --test-force-exit <6 upstream files>` | 276 tests; 276 passed, 0 skipped, 0 failed | [upstream-regressions-22.23.3](gate-upstream-regressions-22.23.3-01M64DXCVEM4YRNE8KHQKPPA26.log) |
| 22.23.3 | `AF_TEST_CONCURRENCY=4 npm test` | 9563 tests; 9500 passed, 63 skipped, 0 failed | [full-22.23.3](gate-full-22.23.3-01M64DZ6VM7ZZGWTB1NXGGJN8N.log) |
| 22.12.0 | `npm run typecheck` | PASS | [typecheck-22.12.0](gate-typecheck-22.12.0-01M64FKG54F95BY93ATVKZNBNB.log) |
| 22.12.0 | `npm run build` | PASS | [build-22.12.0](gate-build-22.12.0-01M64FKGGB3JH6B81ME2D6NB2J.log) |
| 22.12.0 | `node --test --test-concurrency=1 --test-force-exit <7 focused files>` | 161 tests; 161 passed, 0 skipped, 0 failed | [focused-22.12.0](gate-focused-22.12.0-01M64FKH0G4VYA51C5QN78S76P.log) |
| 22.12.0 | `node --test --test-concurrency=1 --test-force-exit <6 upstream files>` | 276 tests; 276 passed, 0 skipped, 0 failed | [upstream-regressions-22.12.0](gate-upstream-regressions-22.12.0-01M64FMZ045R2T8EKG4PB4GNRF.log) |
| 22.12.0 | `AF_TEST_CONCURRENCY=4 npm test` | 9563 tests; 9500 passed, 63 skipped, 0 failed | [full-22.12.0](gate-full-22.12.0-01M64FPXD6F4DG592A6Y0FN9XE.log) |
| n/a | `connector-inventory` | PASS: 322 inherited occurrences / 9 files; unchanged | [connector-inventory](gate-connector-inventory-01M64DVWECBBXSFHKV1EARAW7S.log) |
| n/a | `lane-independence` | PASS: all three patches apply separately to shared core | [lane-independence](gate-lane-independence-01M64DVX2YJJ5GECK8ZGECXMTY.log) |
| n/a | `diff-check` | PASS: git diff --check 9b54c588 HEAD | [diff-check](gate-diff-check-01M64DVX7RZC53JVB7B1E5MZ22.log) |
| n/a | `upstream-preservation` | PASS: 20 upstream-only files and targeted overlap blocks byte-identical | [upstream-preservation](gate-upstream-preservation-01M64DZ3FPA04YPJPSS1RB61A1.log) |
| n/a | `cap-and-engines` | PASS: memory.max=17179869184, memory.swap.max=0; v22.23.3 / v22.12.0 | [cap-and-engines](gate-cap-and-engines-01M64DXV2TAA2S7C4QEZ7QT2FT.log) |

Seven focused files, compiled under `dist/test/`:
`mcpl-required-admission.test.js`, `mcpl-required-push-admission.test.js`,
`mcpl-required-inference-admission.test.js`, `mcpl-admission-lifecycle.test.js`,
`mcpl-admission-no-hook.test.js`, `mcpl-admission-compatibility.test.js`,
`routing-runtime-has-no-connector-literals.test.js`.

Upstream targeted files:
`stop-with-work-in-flight.test.js`, `retired-module-context.test.js`,
`mcpl-inference-abort.test.js`, `mcpl-strict-credentials.test.js`,
`mcpl-strict-errors.test.js`, `exhausted-turn-rearm.test.js`.
These include the requested new tests and strict-dial/re-arm integration coverage.

Other exact commands:
- inventory: capped node `"$ORGASMIC_EVIDENCE_DIR/compare-inventory.cjs"`
- lane independence: `python3 "$ORGASMIC_EVIDENCE_DIR/check-lane-patches.py"`
  (temporary indexes; each lane patch independently applies with `git apply --cached --check`
  to shared core `e88568d1`; no claim of separate release readiness).
- preservation: `python3 "$ORGASMIC_EVIDENCE_DIR/check-upstream-preservation.py"`
- whitespace: `git diff --check 9b54c588 HEAD`
- cap/engines: capped node cgroup assertion and explicit absolute-binary version checks.

### Inherited evidence

The previous report/evidence at
`/home/orgasmic/.orgasmic/runs/run-01M64ANKWFR1W73NXXEM15MG6A/evidence`
is historical context only. Its PR recommendation and still-applicable maintainer questions
were retained, with cancellation/test facts updated. The existing refusal, hints, and
no-hook tests were retained and rerun. This round supplies fresh interaction red-before
evidence and all fresh final gate receipts; it does not infer integration from old passes.

## Unmet Criteria

None. Local work only: no push, PR creation, peer/external messaging, merge, or landing.
Six local commits and both requested recovery refs are retained.

## Residual Risk

- Cancellation releases framework admission bookkeeping; it cannot preempt synchronous
  JavaScript or undo side effects in a noncooperative callback. Late callback work may still
  exist externally, but it cannot start inference or send an admission result.
- Maintainer choices on timeout/pending bounds, refusal vocabulary, hints, startup policy,
  and protocol baseline/stamps remain explicit questions, not new decisions in this rebase.
- Skipped full-suite tests are reported as skipped, not covered.
- Patch independence proves applicability to shared core, not independently release-ready
  partial profiles; one integrated PR remains the recommendation.

---

# Upstream PR draft

# Submission recommendation

**Recommend one PR with six reviewable commits:** shared admission core, channels, pushes, inference, cross-lane tests, and documentation.

The opt-in contract spans connection setup, transport dispatch, all three ingress lanes, and lifecycle revalidation. Reviewing and landing it together avoids an intermediate release where a configured required connection has only some lanes implemented. Shared refusal/compatibility tests and documentation also describe the complete contract. Each lane patch independently applies to the shared core, so separate PRs remain possible if that better suits maintainer ownership, but would require coordinated landing and redistribution of the shared tests.

## Recommended title

Add opt-in required admission for inbound MCPL traffic

## PR body

### Summary

Add an explicitly configured, fail-closed admission callback for MCPL channel deliveries, push events, and inference requests.

- Enable via `McplServerConfig.inboundAdmission`; bind the callback to a framework-issued connection instance and transport epoch.
- Authorize traffic and check readiness before invoking admission. Refuse required pre-ready traffic rather than holding or replaying it.
- Await a bounded callback, validate the entire verdict, then recheck connection lifetime, grants, and channel registration before applying effects.
- Refuse timeout, throw, invalid verdict, stale epoch, removed registration, and overload without admitting the item. Preserve independent outcomes for channel-batch siblings.
- Include pending inference admission in request cancellation: stopping answers once while the transport is live; transport closure answers nothing. Both cancel the callback signal and release the admission slot without waiting for a late verdict.
- Keep a negative wake decision authoritative downstream. This is not context-only delivery.
- Apply no peer tool hints from any carrier on required connections. Result-borne hints are ignored while the underlying result is preserved.
- Support optional initialize attestation. Ordinary transport outages remain non-fatal to framework startup; binding or attestation failures are fatal.

Unconfigured connections retain their existing dispatch, holding, hint handling, and wake policy, with no added admission callback, asynchronous preflight, or synthetic verdict.

No connector-specific routing policy or new wire fields are added. Stamp support arrives with context-only delivery; a full MCPL pin follows separately.

### Tests

- Typecheck, build, and full test suite on Node 22.23.3 and 22.12.0, with test concurrency set to four.
- Seven focused admission and architecture files: real-WebSocket refusal and compatibility coverage, lifecycle revalidation, no-hook behavior, and an explicit inventory preventing new connector-specific runtime literals.
- Upstream inference-abort, stop-with-work-in-flight, retired-module-context, strict-credential dialing, and exhausted-turn re-arm/deadline regression tests.
- Real-WebSocket stop/close interactions during pending admission, including late allow/refuse verdicts and streamed/non-streamed requests; an isolated router stop proves slot release does not depend on connection teardown.
- Each lane patch independently applies to the shared core; whitespace check is clean.

### Questions for maintainers

1. Are the initial limits appropriate: required integer `timeoutMs` in **1..60000 ms** and **64 pending admissions per connection**, with immediate overload refusal and independent deadlines for sequential channel-batch items?
2. Is the closed refusal-code vocabulary acceptable, including `admission_mode_ungranted`? Channel refusals are itemwise results, pushes return `accepted: false`, and inference refusals use JSON-RPC -32600 with the fixed reason; notifications cannot receive a response.
3. Is suppressing all peer hint carriers on required connections the desired initial policy? In particular, result-borne hints are ignored without discarding the result; hinted pushes and standalone `tools/hints` requests are refused.
4. Is startup behavior correct: a required server's transport outage is logged and non-fatal, but binding or attestation failure aborts startup?
5. Is the existing `@animalabs/mcpl-core` **0.4.0** baseline sufficient for this capability, with no SPEC change here, a full protocol pin separately, and protocol stamp support later alongside context-only delivery?

## Alternative if separate PRs are preferred

1. Add opt-in MCPL admission configuration and connection lifecycle
2. Require admission before inbound MCPL channel delivery
3. Require admission before inbound MCPL push effects
4. Require admission before inbound MCPL inference requests

The latter three depend on the first; shared cross-lane tests and complete documentation should land with the final integration. The current six-commit series is reviewable by lane but does not claim four independently release-ready PR branches.

