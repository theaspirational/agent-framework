# TASK-HVQ8K — rebase and upstream text

## Changed

Rebased the six-commit series onto upstream `84e040897779552d92816285c29a123036f234e4`.
Final HEAD: `f0d66760c832c0e36337cdbf0b7dd8747a57eae2`, branch `task-hvq8k-impl`, clean.
Recovery ref `task-hvq8k-before-rebase` retains `6aec11ec1dad94eac0610a868e55428f5b96bc10`.

### New commit list

```
865d61f3 feat(mcpl): add opt-in required admission core
9571eabc feat(mcpl): preflight required channel deliveries
5407970d feat(mcpl): preflight required pushes before effects
f4907bf6 feat(mcpl): preflight required inference requests
ef78c950 test(mcpl): qualify lifecycle and no-hook compatibility
f0d66760 docs(mcpl): describe required admission and compatibility limits
```

The purposes remain shared core / channels / pushes / inference / cross-lane tests / docs.
All six have the requested Vasyl Dovhanchyn author **and committer** and
`Co-Authored-By: GPT-6-Astra <noreply@openai.com>`; checked programmatically and recorded in
[final-identities.txt](final-identities.txt).
The admission diff against the new base is unchanged: **19 files, +1,291/-22**;
per-file counts in [files-numstat.txt](files-numstat.txt).
No new implementation changes, dependency changes, lockfile changes, or additional commits were needed.
PR text is evidence-only, not a seventh repository commit.

### Conflict resolutions / semantic preservation

**No conflicts occurred and no manual resolutions were made.**
[rebase.log](rebase.log) records the clean rebase.
All six patches compare equal in [range-diff.txt](range-diff.txt).
The preservation gate constructs a temporary index from the recovery ref, applies the exact
old-upstream→new-upstream diff, and verifies its tree equals final HEAD. It also verifies that
`src/types/framework.ts`, `test/exhausted-turn-rearm.test.ts`, and upstream's changelog fragment
are byte-identical to the new base. This proves the rebase added only the upstream delta to
the previously reviewed tree, not an approximation of its behavior.

Preserved integration sites (final file:line):
- `src/framework.ts:3790`, `:6480-6497`: upstream deadline-cut state and transient classification,
  including first-cut handling and the explicit transient argument to re-arming.
- `src/framework.ts:24255`, `:26102`, `:26535`: upstream classification at the error paths;
  `:26291`, `:29627`, `:11902`: clearing on usage, spoken-to message, and termination.
- `src/types/framework.ts:316-402`: upstream bound/re-arm configuration documentation, unchanged.
- `test/exhausted-turn-rearm.test.ts:501`, `:534`, `:548`, `:1004`: upstream hold, non-re-arm,
  reset, and termination cases, unchanged; all 74 tests pass on both engines.
- `src/framework.ts:32059`: admission setup failure remains fatal, ordinary transport outage non-fatal.
- `src/framework.ts:34625`, `:34698`, `:34813`: push, channel, and inference original-receipt
  admission wrappers retained.
- `src/mcpl/server-connection.ts:2485`, `:2512`, `:2522`: result, standalone, and push hints
  suppression retained for required connections only.

### Connector inventory

Compared AST inventories from **both upstream bases**, not from our implementation as a source
of allowances. Both contain the same **322 inherited occurrences across nine runtime files**,
exactly matching the committed inventory at `test/routing-runtime-has-no-connector-literals.test.ts:13`.
**No regeneration was needed or performed.**
[compare-inventory.cjs](compare-inventory.cjs) records the comparison method.
The architecture test passes in both focused and full runs.

## Verification Gates

All acceptance gates ran freshly at final HEAD with a clean tracked tree.
Every node/npm invocation, including the AST inventory comparison and engine probes, ran under
`XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0`.
The cap probe confirmed `memory.max=17179869184`, `memory.swap.max=0`; no uncapped fallback.
Node paths: `/opt/node/bin` and `/tmp/credential-engines/node-v22.12.0-linux-x64/bin`.
Every check below used `orgasmic dispatch gate <name> -- <command>`.
No previous gate pass was reused.

| Node | Command / gate | Result | Receipt log |
|---|---|---|---|
| 22.23.3 | `npm run typecheck` | PASS | [typecheck-22.23.3](gate-typecheck-22.23.3-01M64AVZNN83FA3Z8ZHDP8NR98.log) |
| 22.23.3 | `npm run build` | PASS | [build-22.23.3](gate-build-22.23.3-01M64AW0X1JGX34A85ESA6YKGQ.log) |
| 22.23.3 | `node --test --test-concurrency=1 --test-force-exit <7 files>` | 149 passed; 0 failed/skipped | [focused-22.23.3](gate-focused-22.23.3-01M64AW1QS8B9EZAB47052ETE7.log) |
| 22.23.3 | `node --test --test-force-exit dist/test/exhausted-turn-rearm.test.js` | 74 passed; 0 failed/skipped | [exhausted-rearm-22.23.3](gate-exhausted-rearm-22.23.3-01M64AWFZ08Z8DY9WFCNDZ01D9.log) |
| 22.23.3 | `AF_TEST_CONCURRENCY=4 npm test` | 9,384 tests; 9,321 passed; 63 skipped; 0 failed; 497 suites | [full-22.23.3](gate-full-22.23.3-01M64AWP2J38XMPJ2RPTFJAHYP.log) |
| 22.12.0 | `npm run typecheck` | PASS | [typecheck-22.12.0](gate-typecheck-22.12.0-01M64BAZWFG0JCT2F4A9CM096M.log) |
| 22.12.0 | `npm run build` | PASS | [build-22.12.0](gate-build-22.12.0-01M64BB0AQ32Z06FMY86RA2JB1.log) |
| 22.12.0 | `node --test --test-concurrency=1 --test-force-exit <7 files>` | 149 passed; 0 failed/skipped | [focused-22.12.0](gate-focused-22.12.0-01M64BB0S718JXTMBCPTCRB44T.log) |
| 22.12.0 | `node --test --test-force-exit dist/test/exhausted-turn-rearm.test.js` | 74 passed; 0 failed/skipped | [exhausted-rearm-22.12.0](gate-exhausted-rearm-22.12.0-01M64BBET8GM2E9SAN9EJ07P0A.log) |
| 22.12.0 | `AF_TEST_CONCURRENCY=4 npm test` | 9,384 tests; 9,321 passed; 63 skipped; 0 failed; 497 suites | [full-22.12.0](gate-full-22.12.0-01M64BBNGKX382TP5XNY38RJSV.log) |
| n/a | `connector-inventory` (commands below) | PASS: old base = new base = committed; 322 occurrences / 9 files | [connector-inventory](gate-connector-inventory-01M64AVN4KNQN8AQ89QVBW4MK9.log) |
| n/a | `lane-independence` (commands below) | PASS: each of three lane patches applies to core independently | [lane-independence](gate-lane-independence-01M64AVNS22ZYTTB11FBPMTJ07.log) |
| n/a | `diff-check` (commands below) | PASS: git diff --check 84e04089 HEAD | [diff-check](gate-diff-check-01M64AVNXVNP5JB6K495J0T26S.log) |
| n/a | `rebase-preservation` (commands below) | PASS: exact previous tree + upstream delta = final tree | [rebase-preservation](gate-rebase-preservation-01M64AWQNXPNHV0W3M6MESM0MB.log) |
| n/a | `engine-versions` (commands below) | PASS: v22.23.3 and v22.12.0 | [engine-versions](gate-engine-versions-01M64BHRC6RBWAYE7HV7FV5EKN.log) |

Exact sequential commands and environment are in [run-gates.sh](run-gates.sh);
[gates-progress.log](gates-progress.log) records start/pass times.
Full suites used `AF_TEST_CONCURRENCY=4` and took 468.6s / 468.2s respectively.
The 63 skipped tests remain skipped; they are not represented as passes.
Durable wrapper logs and owning PID/PGID records are adjacent to each receipt.

Seven focused files (compiled under `dist/test/`):
- `mcpl-required-admission.test.js`
- `mcpl-required-push-admission.test.js`
- `mcpl-required-inference-admission.test.js`
- `mcpl-admission-lifecycle.test.js`
- `mcpl-admission-no-hook.test.js`
- `mcpl-admission-compatibility.test.js`
- `routing-runtime-has-no-connector-literals.test.js`

Additional gate commands:
- connector inventory: capped `/opt/node/bin/node "$ORGASMIC_EVIDENCE_DIR/compare-inventory.cjs"`
- lane independence: `python3 "$ORGASMIC_EVIDENCE_DIR/check-lane-patches.py"`
  (three independent `git apply --cached --check` runs against core `865d61f3`, temporary indexes).
- preservation: `python3 "$ORGASMIC_EVIDENCE_DIR/check-rebase-preservation.py"`
- whitespace: `git diff --check 84e04089 HEAD`
- engine versions: capped bash invoking each absolute node binary with `--version`.

### Inherited evidence and red-before scope

Prior implementation/polish red-before and mutation artifacts remain historical evidence,
not fresh gate passes. The prior evidence directory is
`/home/orgasmic/.orgasmic/runs/run-01M6467C786S6YQ7R0P0WQRZQH/evidence`.
In particular, `red-result-hints-wrapper.log` showed the real-WebSocket required/control pair
at 1 pass / 1 failure before tap suppression; the architecture mutation showed 8 pass / 1 failure
when a new connector literal was introduced. The tested admission sources and test files are
unchanged by this rebase except for upstream's unrelated framework additions, as proved by
range-diff and tree preservation. No new behavioral edit was made this round, so no new red-before
test was needed. Fresh focused and full passes above establish integration on the new base.

An initial attempt to execute a pre-existing non-executable helper returned permission denied
before running git. Invoking the same helper through bash performed the clean capped rebase.
This was a command invocation issue, not a source conflict or failed test.

## Unmet Criteria

None. No push, PR creation, external messaging, landing, merge, or dispatch closure was performed.
The requested local PR draft follows and is also in [upstream-pr-draft.md](upstream-pr-draft.md).

## Residual Risk

- Maintainer choices are explicitly left as questions in the draft, not silently changed:
  limits, refusal vocabulary, hint policy, startup failure policy, and protocol baseline/stamp timing.
- Lane independence proves patch applicability to shared core, not that each partial configuration
  is independently release-ready. A single integrated PR is recommended.
- Callback timeouts cannot preempt synchronous JavaScript or undo external effects; callbacks must
  cooperate with cancellation. Protocol stamp/context-only behavior remains outside this capability.
- Full suites have 63 explicit skips on each engine; those paths were not executed.

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
- Keep a negative wake decision authoritative downstream. This is not context-only delivery.
- Apply no peer tool hints from any carrier on required connections. Result-borne hints are ignored while the underlying result is preserved.
- Support optional initialize attestation. Ordinary transport outages remain non-fatal to framework startup; binding or attestation failures are fatal.

Unconfigured connections retain their existing dispatch, holding, hint handling, and wake policy, with no added admission callback, asynchronous preflight, or synthetic verdict.

No connector-specific routing policy or new wire fields are added. Stamp support arrives with context-only delivery; a full MCPL pin follows separately.

### Tests

- Typecheck, build, and full test suite on Node 22.23.3 and 22.12.0, with test concurrency set to four.
- Seven focused admission and architecture files: real-WebSocket refusal and compatibility coverage, lifecycle revalidation, no-hook behavior, and an explicit inventory preventing new connector-specific runtime literals.
- Upstream exhausted-turn re-arm/deadline regression tests.
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

