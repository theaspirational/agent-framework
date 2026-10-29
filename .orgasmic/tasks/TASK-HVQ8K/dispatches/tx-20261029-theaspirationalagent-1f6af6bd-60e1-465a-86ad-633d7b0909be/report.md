# TASK-HVQ8K — final text and pinning round

## Changed

Final HEAD: **2a66e609647423aefd053b1fb1caa99f153fc0d5**, clean `task-hvq8k-impl`.
Base: **8145085d06dfdbea402eb3451e7f06ade455cf9d**. Recovery ref `task-hvq8k-before-final` retains
`453484be889a665b88f7386eabd9484824960c32`.
Read REVIEW3 in full and verified the cited paths. Read the newly changed CONTRIBUTING.md.
The requested rebase was clean: no manual conflict resolution was needed.

### Six-commit series

```
1c2459cf feat(mcpl): add opt-in required admission core
0cdd421a feat(mcpl): preflight required channel deliveries
e31477c3 feat(mcpl): preflight required pushes before effects
60d23fd6 feat(mcpl): preflight required inference requests
0e69e4c9 test(mcpl): qualify lifecycle and no-hook compatibility
2a66e609 docs(mcpl): describe required admission and compatibility limits
```

Core / channels / push / inference / cross-lane tests / docs shape retained.
Every author and committer is Vasyl Dovhanchyn
<48733736+theaspirational@users.noreply.github.com>, with
`Co-Authored-By: GPT-6-Astra <noreply@openai.com>`.
See [final-identities.txt](final-identities.txt), [range-diff.txt](range-diff.txt),
[rebase.log](rebase.log), and [fold.log](fold.log).
The series changes **19 files, +1,528/-23** against the new base;
[files-numstat.txt](files-numstat.txt) lists each file.

### Per-item disposition

1. **MEDIUM — precise hint contract, no runtime change.**
   `docs/required-inbound-admission.md:39-50` and
   `changelog.d/required-inbound-admission.added.md:3-8` now distinguish ignored
   push/standalone/result-borne hints from the application's solicited `tools/list`
   inventory. The latter still supplies tool presence and `mcpl/rev`, without admission,
   and a revision gap may cause application-to-peer list recovery. This is catalogue
   bookkeeping, not a wake, delivered content or stored data.
   The PR bullet and maintainer question 3 use the same contract.
   **No edit to server-connection.ts, including its direct completed-list tap.**

   New real-WebSocket pinning test at
   `test/mcpl-admission-lifecycle.test.ts:367-429`: required profile, empty capability grant,
   solicited list with `_meta['mcpl/rev']=7`, updated tool presence/revision, exactly one
   direct list tap, observed subsequent `tools/list` and `toolsets/list` recovery,
   zero admission hooks, queued events or provider calls, and unchanged stored-message view.
   Folded into the cross-lane test commit.

2. **LOW — unreachable guard removed.**
   Deleted only `if (admission && responder.signal?.aborted) return;` and its separating
   blank line at the former `src/mcpl/inference-router.ts:253`.
   The existing `afterBoundary` transport gate remains untouched.
   Before adding tests, [guard-removal-94.log](guard-removal-94.log) recorded the exact
   **94 affected tests passing**. Final-HEAD runs of those three files pass on both engines
   with the three additions too (97 total). The runner's name-pattern selected the full
   97-test superset; no claim is made that it excluded the additions.
   Folded into the inference commit.

3. **LOW — admitted provider-call handoff pinned.**
   `test/mcpl-required-inference-admission.test.ts` adds real-WebSocket allow-then-stop
   and allow-then-close cases during a pending provider call. Stop produces exactly one
   `-32000` answer; a closed transport produces **zero answers**, preserving upstream's
   no-answer-on-close contract. Each emits exactly one `mcpl:inference_fail` trace with the
   expected error and model. Existing pending-admission stop rows now also assert their
   single failure trace with `model: null`. No production fix was necessary.
   Folded into the inference commit.

4. **LOW — inventory maintenance explained.**
   The PR draft now states that the connector inventory is an exact ceiling over inherited
   upstream occurrences; a future upstream identifier/occurrence requires a reviewed ceiling
   bump, not suspicion of admission code. `admission_mode_ungranted` remains maintainer
   **question 2**, unchanged.

5. **Rebase / preservation / latest upstream.**
   Initial and pre-gate `git ls-remote upstream refs/heads/main` both named the requested
   base. A fresh final ls-remote gate confirms that it still names that base.
   [upstream-start.txt](upstream-start.txt), [upstream-before-gates.txt](upstream-before-gates.txt),
   and the final gate receipt record the checks.
   The runtime-preservation gate constructs the exact reviewed tree plus upstream's delta
   in a temporary index, removes only the dead guard, then compares **all 168 src files**.
   They match final HEAD exactly. **All 32 upstream-only changed files** also match the
   new base byte-for-byte. This includes upstream's turn-input pinning and transport grace
   work. The connector inventory remains **322 occurrences across nine files**;
   it was compared from both bases, **not regenerated from our tree or regenerated at all**.

The sole implementation edit in this round is the dead guard deletion. The remainder is
tests/text plus upstream's own changes. No dependency/lockfile changes; build artifacts remain
outside evidence and uncommitted.

## Verification Gates

Every node/npm invocation used:
`XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0`.
No uncapped fallback. The cap probe verified `memory.max=17179869184` and
`memory.swap.max=0`. Engine paths: `/opt/node/bin` and
`/tmp/credential-engines/node-v22.12.0-linux-x64/bin`.

All final gates ran freshly at **2a66e609647423aefd053b1fb1caa99f153fc0d5**, through
`orgasmic dispatch gate <name> -- <command>`, with a clean tracked tree.
Exact commands/environment: [run-gates.sh](run-gates.sh).
Timing: [gates-progress.log](gates-progress.log).
Each long-running check has a durable wrapper log and owner PID/PGID record.

| Node | Gate / command | Result | Receipt |
|---|---|---|---|
| 22.23.3 | npm run typecheck | PASS | [typecheck-22.23.3](gate-typecheck-22.23.3-01M64N2JAYRQXYK75EM0PVMY4P.log) |
| 22.23.3 | npm run build | PASS | [build-22.23.3](gate-build-22.23.3-01M64N2JT4Q78CHYM7TBXNP6V2.log) |
| 22.23.3 | 7 focused files | 164 tests: 164 passed, 0 skipped, 0 failed | [focused-22.23.3](gate-focused-22.23.3-01M64N2K8JTV78GTRYVX1TTVVM.log) |
| 22.23.3 | 3 affected files (original 94 + 3 added tests) | 97 tests: 97 passed, 0 skipped, 0 failed | [affected-94-22.23.3](gate-affected-94-22.23.3-01M64N4CAKH6T9AAF3PNY5TZGD.log) |
| 22.23.3 | 13 upstream targeted files | 511 tests: 511 passed, 0 skipped, 0 failed | [upstream-regressions-22.23.3](gate-upstream-regressions-22.23.3-01M64N5F5PWB467SW88038ACB8.log) |
| 22.23.3 | AF_TEST_CONCURRENCY=4 npm test | 9594 tests: 9531 passed, 63 skipped, 0 failed | [full-22.23.3](gate-full-22.23.3-01M64NHGGYE94QHRP1NGC3PGGG.log) |
| 22.12.0 | npm run typecheck | PASS | [typecheck-22.12.0](gate-typecheck-22.12.0-01M64Q9X1NNWJSP1FSZC02W9Y4.log) |
| 22.12.0 | npm run build | PASS | [build-22.12.0](gate-build-22.12.0-01M64Q9XK7CJCAZTRTEBQYN6FF.log) |
| 22.12.0 | 7 focused files | 164 tests: 164 passed, 0 skipped, 0 failed | [focused-22.12.0](gate-focused-22.12.0-01M64Q9Y1MDF3E4XMP7WFRQA4R.log) |
| 22.12.0 | 3 affected files (original 94 + 3 added tests) | 97 tests: 97 passed, 0 skipped, 0 failed | [affected-94-22.12.0](gate-affected-94-22.12.0-01M64QD8SK4QTYKECD7K5V3QPH.log) |
| 22.12.0 | 13 upstream targeted files | 511 tests: 511 passed, 0 skipped, 0 failed | [upstream-regressions-22.12.0](gate-upstream-regressions-22.12.0-01M64QEZ8C1HNCWEQ40PH8XEGM.log) |
| 22.12.0 | AF_TEST_CONCURRENCY=4 npm test | 9594 tests: 9531 passed, 63 skipped, 0 failed | [full-22.12.0](gate-full-22.12.0-01M64QP9KSTVHQ0FPYDJRT3PQR.log) |
| n/a | runtime-preservation | PASS — 168 source files: upstream delta plus only dead-guard deletion; 32 upstream-only files identical | [runtime-preservation](gate-runtime-preservation-01M64N2GD504HN2SX7RRD0GSHX.log) |
| n/a | connector-inventory | PASS — 322 inherited occurrences, unchanged; no regeneration | [connector-inventory](gate-connector-inventory-01M64N2GYNEY8RE1ESCMJQSBSN.log) |
| n/a | lane-independence | PASS — Each lane patch applies to shared core separately | [lane-independence](gate-lane-independence-01M64N2HKEBY14AHQ461H9K1F8.log) |
| n/a | diff-check | PASS — Clean | [diff-check](gate-diff-check-01M64N2J0RH7VVTTMB7N8V2AXS.log) |
| n/a | internal-names-final | PASS — No internal-name matches in commit range or final PR draft | [internal-names-final](gate-internal-names-final-01M64RMAJSF7C6N3DZP9TPSFBE.log) |
| n/a | cap-and-engines | PASS — 16 GiB, zero swap; both requested engines | [cap-and-engines](gate-cap-and-engines-01M64N310T0Q6PHYGHKGADN0B3.log) |
| n/a | upstream-final | PASS — ls-remote main still equals final base | [upstream-final](gate-upstream-final-01M64RMX2KWN0Q0VYF9573G815.log) |

The seven focused files are the required channel, push and inference files, admission lifecycle,
no-hook and compatibility files, and the connector-runtime inventory test.
The 13 upstream targeted files are:
`stop-with-work-in-flight`, `retired-module-context`, `mcpl-inference-abort`,
`mcpl-strict-credentials`, `mcpl-strict-errors`, `exhausted-turn-rearm`,
`turn-inputs-pin`, `turn-continuation`, `host-quiesce`, `failed-create-releases`,
`mcpl-transport-close`, `mcpl-legacy-lifetime`, and `mcp-modern-outcomes`
(all `dist/test/<name>.test.js`). The new upstream turn-input pinning tests are included.

Additional exact commands:
- `python3 "$ORGASMIC_EVIDENCE_DIR/check-runtime-preservation.py"`
- capped node `"$ORGASMIC_EVIDENCE_DIR/compare-inventory.cjs"`
- `python3 "$ORGASMIC_EVIDENCE_DIR/check-lane-patches.py"`
  (independent temporary-index `git apply --cached --check` against core `1c2459cf`)
- `git diff --check 8145085d HEAD`
- `python3 "$ORGASMIC_EVIDENCE_DIR/check-internal-names.py"`
  over `git log -p <base>..HEAD` and the final PR draft; pattern is printed in its receipt
- final upstream gate: `git ls-remote upstream refs/heads/main`, checked against the base.

### Scoped probes and inherited evidence

[pinning-tests.log](pinning-tests.log): **20 passed / 0 failed** before folding, covering
the new tools/list row and inference rows. An initial test-only compile failed because the
public trace union omits the internal MCPL trace discriminant; the test now narrows it in
the same style as upstream's inference-abort tests. The corrected build and all final builds pass.
This was a test typing error, not a runtime defect.

No red-before behavior fix was needed: the new tests pin existing approved runtime behavior,
and the only production deletion is unreachable code (94 tests remained green).
No earlier gate pass was reused. REVIEW3 and the previous report at
`/home/orgasmic/.orgasmic/runs/run-01M64DGNQTRCJJ7B205PNGV6EY/evidence/report.md`
are inherited context, not this round's gate proof. Earlier cancellation red/mutation evidence
still concerns unchanged cancellation code; fresh focused/full runs verify it here.

## Unmet Criteria

None. No push, PR creation, external/peer messaging, merge or landing.
Final PR draft: [upstream-pr-draft.md](upstream-pr-draft.md), also included below.

## Residual Risk

- The solicited catalogue exception is intentional and now explicit; admission does not
  block tool presence/revision bookkeeping or its list recovery.
- Callback cancellation cannot preempt synchronous JavaScript or undo external side effects.
- The exact connector ceiling needs maintenance when upstream-owned occurrences change.
- Timeout/pending bounds, refusal vocabulary (including `admission_mode_ungranted`), startup
  policy and protocol/stamp timing remain maintainer questions.
- Full-suite skips remain skipped. No live provider or deployed connector was exercised.
- The final upstream check is a point-in-time observation, not a lock on upstream.

---

# Final upstream PR draft

# Submission recommendation

**Recommend one PR with six reviewable commits:** shared admission core, channels, pushes, inference, cross-lane tests, and documentation.

The opt-in contract spans connection setup, transport dispatch, all three ingress lanes, and lifecycle revalidation. Reviewing and landing it together avoids an intermediate release where a configured required connection has only some lanes implemented. Shared refusal/compatibility tests and documentation also describe the complete contract. Each lane patch independently applies to the shared core, so separate PRs remain possible if that better suits maintainer ownership, but would require coordinated landing and redistribution of the shared tests.

## Recommended title

Add opt-in required admission for inbound MCPL traffic

## PR body

### Problem

Applications need an opt-in admission boundary before inbound MCPL data can cause effects, without changing existing unconfigured connections.

### Changes

Add an explicitly configured, fail-closed admission callback for MCPL channel deliveries, push events, and inference requests.

- Enable via `McplServerConfig.inboundAdmission`; bind the callback to a framework-issued connection instance and transport epoch.
- Authorize traffic and check readiness before invoking admission. Refuse required pre-ready traffic rather than holding or replaying it.
- Await a bounded callback, validate the entire verdict, then recheck connection lifetime, grants, and channel registration before applying effects.
- Refuse timeout, throw, invalid verdict, stale epoch, removed registration, and overload without admitting the item. Preserve independent outcomes for channel-batch siblings.
- Include pending inference admission in request cancellation: stopping answers once while the transport is live; transport closure answers nothing. Both cancel the callback signal and release the admission slot without waiting for a late verdict.
- Keep a negative wake decision authoritative downstream. This is not context-only delivery.
- Required connections ignore peer hints on pushes, standalone `tools/hints`, and result-borne `mcpl/hints`; the underlying result is preserved. The application's own solicited `tools/list` result still supplies tool presence and `mcpl/rev` without admission, because it asked for the inventory. A revision gap may trigger application-to-peer list recovery: catalogue bookkeeping, not a wake, content delivery or stored data.
- Support optional initialize attestation. Ordinary transport outages remain non-fatal to framework startup; binding or attestation failures are fatal.

Unconfigured connections retain their existing dispatch, holding, hint handling, and wake policy, with no added admission callback, asynchronous preflight, or synthetic verdict.

No connector-specific routing policy or new wire fields are added. Stamp support arrives with context-only delivery; a full MCPL pin follows separately.

### Tests

- Typecheck and build pass on Node 22.23.3 and 22.12.0. On each engine, `AF_TEST_CONCURRENCY=4 npm test`: **9,531 passed / 0 failed / 63 skipped** (9,594 tests).
- On each engine: **164 focused tests** and **511 upstream targeted tests**, all passing. The original 94 affected cases also pass within the expanded 97-test file set.
- Seven focused admission and architecture files: real-WebSocket refusal and compatibility coverage, lifecycle revalidation, no-hook behavior, and an explicit inventory preventing new connector-specific runtime literals.
- Upstream inference-abort, stop-with-work-in-flight, retired-module-context, strict-credential dialing, and exhausted-turn re-arm/deadline regression tests.
- Real-WebSocket stop/close interactions during pending admission, including late allow/refuse verdicts and streamed/non-streamed requests; an isolated router stop proves slot release does not depend on connection teardown.
- Pinning tests cover solicited `tools/list` inventory/revision updates without admission, and allow-then-stop/close during a provider call, including the single stopped answer (no answer after close) and failure trace.
- Each lane patch independently applies to the shared core; whitespace check is clean.

The connector-literal inventory is an exact ceiling over inherited occurrences in upstream-owned runtime files. A future upstream identifier or occurrence needs a reviewed ceiling bump based on that upstream change, not an assumption that admission code introduced connector policy.

### Not verified / out of scope

No deployed connector or live model provider was exercised. Reply destination binding, typing, context-only delivery and protocol stamps are not implemented here.

### Questions for maintainers

1. Are the initial limits appropriate: required integer `timeoutMs` in **1..60000 ms** and **64 pending admissions per connection**, with immediate overload refusal and independent deadlines for sequential channel-batch items?
2. Is the closed refusal-code vocabulary acceptable, including `admission_mode_ungranted`? Channel refusals are itemwise results, pushes return `accepted: false`, and inference refusals use JSON-RPC -32600 with the fixed reason; notifications cannot receive a response.
3. Is this hint policy appropriate: ignore result-borne `mcpl/hints`, refuse hinted pushes and standalone `tools/hints` requests, but retain tool presence and `mcpl/rev` from solicited `tools/list` results, including application-to-peer list recovery?
4. Is startup behavior correct: a required server's transport outage is logged and non-fatal, but binding or attestation failure aborts startup?
5. Is the existing `@animalabs/mcpl-core` **0.4.0** baseline sufficient for this capability, with no SPEC change here, a full protocol pin separately, and protocol stamp support later alongside context-only delivery?

## Alternative if separate PRs are preferred

1. Add opt-in MCPL admission configuration and connection lifecycle
2. Require admission before inbound MCPL channel delivery
3. Require admission before inbound MCPL push effects
4. Require admission before inbound MCPL inference requests

The latter three depend on the first; shared cross-lane tests and complete documentation should land with the final integration. The current six-commit series is reviewable by lane but does not claim four independently release-ready PR branches.

AI-assisted implementation; model attribution is recorded in the commit trailers.

