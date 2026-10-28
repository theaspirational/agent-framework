# TASK-5GAY8 independent rebase review

## Verdict
APPROVE at cb57dfa611bb02232a55f07020966d141df1bcf2. No HIGH, MEDIUM or LOW rebase findings. No branch changes, commits or pushes made.

Owner identity rule acknowledged: all 13 commits above e85c57db have the required author and committer identity. Baseline project instructions read; no conventions or gotchas supplied.

## Findings
None attributable to this rebase.

### Patch equivalence and upstream interaction audit
- Independently compared `git diff --unified=0 4976c67d..9cc792de` with `git diff --unified=0 e85c57db..HEAD`, ignoring only hunk coordinates and index object IDs. All existing files have identical deltas except framework webhook formatting and the three explicit baseline-reference updates. The only additional path is the release fragment. Detailed comparison: `independent-patch-audit.txt` in this review's evidence. Approved republication and e9540071 have identical trees.
- `src/framework.ts:28505`: the conflict result preserves strict agent-name projection and `sinkMessage ?? wholeMessage`, passing the result to upstream `opsWebhookText`. The helper (`:2851`) is exactly upstream's former `boundFailureText(message, OPS_WEBHOOK_MESSAGE_MAX_CHARS)` expression. Thus all three expression components retain approved semantics and upstream bounding behavior.
- `src/framework.ts:28317,28463-28466`: union registries affect only failures.log and webhook copies. Raw descriptor projection occurs before unchanged legacy preparation. `src/mcpl/protocol-family.ts` retains literal `[withheld]` for strict exceptional-data projection, separately from upstream notice-tag-based legacy diagnostics. Traces retain legacy input, and `:28492` emits no invented trace on failed preparation. `:28511-28513` rethrows the original exception through missing-hook and cooldown returns; independently exercised both cases on Node and Bun.
- All framework map mutations were inspected: registration is centralized at `src/framework.ts:7356-7364`, deletion at `:31099-31104`; upstream `eventGate.sourcesChanged()` remains after both changes. Startup pre-registration (`:28937`) and connect (`:30174`) use that setter. The registry add path is at `:30272`; no additional framework configuration mutation/dial path bypassing these hooks was found. Standalone transport dials use `noteDialSent`'s standalone ownership path.
- Closed-tab disconnect/reopen callbacks (`:29924-29940`) route through runDisconnect/runConnect, ending the old credential lifetime and registering a new one. Fresh production callback probes with actual authenticated loopback peers verified that the retired token is no longer redacted, a retained server's token remains redacted, and reopening the same config object starts a fresh lifetime. Final-close retirement remains at `:32088`; transient reconnects retain history (also covered by reused sink-matrix receipts).
- Default-on hint policy is captured at `:30265` before legacy setup/addServer and reused for host capability offer and registration tap. Strict transport policy capture does not remove that upstream behavior.
- Upstream stdio `readLines`, its cleanup, and U+2028/U+2029 escaping in both transport writers are untouched by the approved/rebased transport delta. Upstream notice tags for legacy withheld/unprintable diagnostics likewise survive unchanged. Never-strict identity comparison is against the new base, not the old one.
- The narrow overlay defaults to e85c57db and loads framework plus three MCPL source files; the credential overlay loads the same new-base MCPL files; credential verifier's diff baseline is e85c57db. Narrow comparison's Node/Bun undefined/false/null cases passed in reusable evidence. This is scoped equivalence evidence, not proof for every possible JavaScript input.
- `changelog.d/strict-credential-mode.added.md:1-11` accurately describes opt-in scope, exact supported runtimes, minimum length, lifetime retention and the two exporting sinks; explicitly excludes other diagnostics/application payloads. No private names or overclaim found.
- Dependency lock SHA-256 independently checked: `3108da80bc1fa23eeb56f0e683ad34a4e51033cb1184bdb5448f0c7f073d8b02`. Inspected all 101 package records: no non-public resolved URL. Lock is outside the repository; no new tracked lock or package.json change. No dependency installation performed by reviewer.

### Full-file Bun failure investigation
Fresh command, three runs per phase:
- Base cwd `dist/upstream-base`: `bun-1.4.3 test --timeout 60000 ./test/mcp-recorded-text.test.ts`
- Head cwd `.`: same command.

Before classification, independently verified every extracted base src/test file against `git show e85c57db:<path>`: no mismatches.

All six runs: 44 pass, 1 fail. The TAB initialize case passed 3/3 on base and 3/3 on head. The sole repeated failure is `test/mcp-recorded-text.test.ts:823`: Bun's spawn error says `ENOENT: no such file or directory, posix_spawn ...`, while the assertion expects Node's `spawn ... ENOENT`. This is a reproducible base/head runtime-expectation mismatch, not a rebase regression.

The earlier full-Bun head-only TAB failure was inspected as a claim, not treated as proof. This case uses a non-strict stdio configuration (`:521-539`); transport framing/redaction and test sources are identical to the new base on that path. The change adds inert ownership tracking and registry lookup there, not strict projection. No causal regression found; the earlier full-suite-only failure remains non-reproduced, plausibly timing/isolation-sensitive, not conclusively explained by these scoped runs.

## Verification Gates
The brief requests fresh reruns, but the later execution-context instruction and gate-receipts policy explicitly require reuse of eligible receipts. Accordingly **build, typecheck, full npm test, strict Node/Bun and narrow verification were not rerun by this reviewer**. Their clean cb57dfa6 logs were read and pass trailers checked. No gate inputs changed. Log references below are evidence-relative basenames (no private filesystem paths).

### Reused gates (reviewed implementer evidence)
| Gate / exact command | Outcome | Log |
|---|---|---|
| `npm run build` | PASS | `gate-build-01M60QADGQ703Y0XSFVXJK4ZQM.log` |
| `npm run typecheck` | PASS | `gate-typecheck-01M60QADWV9J7SXXYMGTGBMXSA.log` |
| `env AF_TEST_CONCURRENCY=4 npm test` | PASS: 8875 passed, 63 skipped, zero failures | `gate-npm-test-head-01M60QAWSANB0X3RZRYRBSVQD7.log` |
| Base: `npm run build && AF_TEST_CONCURRENCY=4 npm test` in `dist/upstream-base` | PASS: 8730 passed, 63 skipped | `gate-npm-test-base-01M60QAKJVJTW94SC2CHB92JBK.log` |
| `node --import tsx --test --test-concurrency=2 test/mcpl-strict-*.test.ts` | PASS: 126 | `gate-strict-node-01M60QBAAZN9DVMK6H2479A7GD.log` |
| `bun-1.4.3 test --timeout 60000 test/mcpl-strict-*.test.ts` | PASS: 125, one skipped | `gate-strict-bun-01M60QBTHAHX7MW5GPBHDZ14GV.log` |
| `env P2_EVIDENCE=<external-artifacts> bash test/mcpl-narrow-verify.sh` | PASS | `gate-narrow-comparison-01M60QDKWR3BD4YR6KZEE31AC4.log` |
| `python3 <reviewed-evidence>/rebase-audit.py` | PASS | `gate-rebase-audit-01M60QAE7WDCJKFFE3W4GWZJGN.log` |
| `bash <reviewed-evidence>/sink-matrix.sh` | PASS: 288 cells/engine, zero unexpected credential presence | `gate-sink-matrix-01M60QCH5JS85B8338NEFRKF5X.log` |
| `bash <reviewed-evidence>/compare-lifetimes-accessors.sh` | PASS: 24 comparisons | `gate-lifetime-accessor-comparison-01M60QCQ32CR2QW4C68E5C60B6.log` |
| Base/head `bun-1.4.3 test --timeout 60000 --test-name-pattern 'holding a TAB' ./test/mcp-recorded-text.test.ts` | PASS: six cases each; superseded for investigation by fresh whole-file runs | `gate-bun-tab-base-01M60QDK9KGV0KDNS4MJ94BFBG.log`, `gate-bun-tab-head-01M60QDKMQ2WR7YJVTJT1GZ188.log` |

### Fresh reviewer gates (this review's evidence)
All invoked through `orgasmic dispatch gate`.
- `recorded-text-whole-file`: loop over base/head and runs 1,2,3, executing the whole-file command above. Exit 1; the identical pre-existing Bun spawn-message assertion fails in every run. Log: `gate-recorded-text-whole-file-01M60QR2NXZ9WPE05Y49ZAF9ZP.log`.
- `closed-tab-lifetimes`: `node --import tsx <evidence>/closed-tab-probe.mjs` then `bun-1.4.3 <evidence>/closed-tab-probe.mjs`, with separate ignored workspaces/artifacts. PASS. Real loopback authentication, tool error reflection, production closed-tab callbacks and exporting sinks; script derives from the checked-in mixed production scenario. Log: `gate-closed-tab-lifetimes-01M60QT5T214Z8CJ900Y6QWJ37.log`.
- `preparation-exception-edges`: corresponding Node/Bun execution of `preparation-probe.mjs`. PASS. Real strict/legacy peers, missing and throttled webhook, identical thrown object, one getter invocation, literal withheld copy, no fabricated trace. Log: `gate-preparation-exception-edges-01M60QTXCQPXVQAHA79CAEG5QK.log`.

## Unmet Criteria / Test Gaps
- Fresh reruns of reusable gates were forbidden by the execution context; exactly which checks were reused is listed above.
- Strict Bun receipt skips the real malformed-frame-after-open case. Node covers it; injected Bun client-error cases are not equivalent to a native malformed frame.
- Full-Bun-suite TAB-only intermittency was not reproduced by six full-file runs. These scoped runs cannot exclude cross-file test interference under full-suite load.

## Residual Risk
The supported runtime allowlist remains intentionally exact. No new claim of general diagnostic no-leak safety, unsupported-engine support, or universal never-strict equivalence is made. Bun whole-file tests are not wholly green due to the shared pre-existing assertion above.

## Fix Directions
No rebase fix requested. Separately, make the existing stdio spawn-message test runtime-aware and investigate the earlier full-suite TAB failure under equivalent suite load if it recurs. Preserve the two-sink boundary and literal strict marker in any follow-up.
