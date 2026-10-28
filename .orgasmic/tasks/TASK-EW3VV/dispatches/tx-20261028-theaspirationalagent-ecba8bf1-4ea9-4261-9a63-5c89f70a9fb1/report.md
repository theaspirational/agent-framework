# TASK-EW3VV — independent re-review 2

## Verdict

**APPROVE** at `e95400714223477305624645dbf6f846e9f0918e`, for the narrowed dial/two-exporting-sink scope only.

## Findings

No HIGH, MEDIUM or LOW findings. Both round-1 MEDIUM findings are fixed. No branch changes, commits or pushes were made.

### Finding 1 verification

- `src/framework.ts:6435–6443` retires a displaced object before replacing the id; `28260–28263` ends rejected initial connections; `4744` clears the owner's entire registry. Removal and final close retain their cleanup hooks (`29038`, `29997`). Reconnect-pending connections keep their history.
- `src/mcpl/protocol-family.ts:285–315`: per framework, a weak-key configuration lookup and a set of lifetime records. Each record contains a **WeakRef**, not a strong configuration reference, and an optional accepted set. Reverse targets are weak-keyed and weakly reference lifetime records. Never-strict configurations create no accepted set. Existing configuration-map/connection ownership remains unchanged.
- Independently reran the original round-1 GC programs on Node 22.23.3 and Bun 1.4.3 (only GC invocation adapted for Bun). Strict and never-strict cases now retain **1/8**, not 8/8, with the stopped framework kept alive. The remaining object is the pre-existing current map entry.
- Fresh original-base/final comparisons of eight upgrade failures and eight initialize failures match exactly for never-strict use on both runtimes: retained before/after stop **1/1**, id getter counts **189/197** respectively. Shutdown completes normally.
- Fresh strict variants show every accepted set absent immediately after each failed initial connect, before replacement or stop. The original replacement probe also reports the old registry absent after replacement and stop.
- Fresh production-route matrix on each runtime: 288 cells, zero mismatches; includes pending/completed automatic reconnect, independent owners, runtime flag flips, rotation, and post-stop controls.

### Finding 2 verification

- `src/framework.ts:26656–26706` builds the exporting copies from raw inputs before legacy preparation. No-strict preparation still rethrows immediately; its finally block has no captured failure to throw. Successful calls retain record → trace → webhook order. Exceptional strict preparation emits no invented trace and rethrows the exact original object after export attempts.
- `src/mcpl/protocol-family.ts:347,355–406` uses fixed code-owned `[withheld]`, own descriptors and detached values. It does not derive marker text from the diagnostic object. Native Error formatting is handled on a detached Error in `framework.ts:26490–26498`.
- Fresh 32-snapshot base/final accessor comparison on both runtimes: never-strict bytes, hook counts, traces and exception behavior match base; mixed-set exports differ only by credential replacement and the named hook/accessor withholding exception. Ordinary native Errors, nested plain objects, repeated references and sparse arrays preserve formatting apart from credential replacement.
- Throwing top-level details accessor: exactly one getter call; strict-active writes both exports, withholds data, preserves exception identity, emits no trace. Never-strict writes neither export and propagates the same exception. Error.message accessor: the existing description function catches it internally; one getter call and the same trace behavior, not a newly invented escaping exception.
- Additional independent probe calls the projection with getter, toJSON, toString, valueOf and Symbol.toPrimitive objects: all return the fixed marker with **zero hook calls**. Missing-webhook and cooldown-return cases still rethrow the original preparation exception, write the projected record and invent no trace, on both runtimes.
- Original round-1 accessor probe was also rerun. Its failed strict initial connection now ends the lifetime, so that exact fixture correctly exercises the no-active-strict path (two records). The successful-strict/mixed fixture supplies the necessary positive exporting test; the old failed-connect fixture is not misrepresented as one.

### Remaining cumulative source review

Read the cumulative production diff from `112bc593`, including the production hunks in `d2b5fbf0`, and the two fix commits separately. Only framework.ts, protocol-family.ts and transport.ts change; production net +198 lines. No scope expansion into local diagnostic sinks or catalogue admission.

The strict status decision uses response.statusCode only; 401/403 map to credential-unusable, other statuses to connection-failed. Minimum length is 32. Legacy sixteen-entry history remains separate. The strict late-error no-op is installed only after abandonment has marked settlement, cleared timeout/abort listener, removed dial listeners, destroyed/aborted the upgrade request and terminated the socket. It cannot suppress the initial rejection; post-open errors use the reporting handler instead. Supplied strict tests assert single settlement, closed peer sockets and listener/timer teardown on both runtimes.

Source search finds one failures.log append boundary and one ops webhook body/sender in framework.ts. No new writer bypass appeared. This is **assembled-text sink redaction by manager decision**, not an R3 template-provenance claim.

## PR-description sentence checks

- **Confirmed:** “Retention ends when the configuration is removed, finally closed, or the framework stops.” This means that framework's strict exporting history, not erasure of the original map entry or pre-existing sixteen-entry legacy history. Reconnect and another live owner's history remain, intentionally. Failed initial and displaced lifetimes now end immediately as well.
- **Confirmed in scope:** “Without credentialRequired, and with no strict configuration in the framework, behaviour is unchanged.” Fresh comparisons show identical never-strict retention, getter counts, hook counts, exceptions, and sink/trace bytes in the exercised cases. This does not apply when a previously strict accepted lifetime remains active after turning its flag off; that documented case intentionally keeps redacting.
- The earlier draft's mixed-comparison wording permitting only substitution is superseded by the updated draft's explicit second exception for hook/accessor withholding. Do not publish the earlier draft unchanged. The updated draft and README name both differences. Dial-refusal, provider-failure and pinned-runtime descriptions agree with the final code; no additional contradiction found.

## Verification Gates

All fresh executable checks used `orgasmic dispatch gate NAME -- COMMAND`. Logs below are evidence-relative basenames, with no private filesystem locations.

### Fresh reviewer runs

| Gate | Command after wrapper | Result |
|---|---|---|
| review-gc | `bash "$ORGASMIC_REVIEWED_EVIDENCE_DIR/gc-compare.sh"` | PASS; eight base/final never-strict snapshots |
| review-accessors | `bash "$ORGASMIC_REVIEWED_EVIDENCE_DIR/accessor-compare.sh"` | PASS; 32 snapshots |
| review-strict-gc-{node,bun}-{false,true} | `env P2_STRICT=true P2_UNWIND=true P2_HANDSHAKE=FLAG RUNNER test/mcpl-strict-lifetime-gc.mjs` | four PASS |
| review-original-{node,bun}-reviewer-{gc,gc-legacy,accessors,probe} | `RUNNER "$ORGASMIC_EVIDENCE_DIR/reviewer-NAME.mjs"` | eight PASS; original round-1 programs, Bun GC adaptation only |
| review-lifecycle-{node,bun} | `env PROBE_OUTPUT=OUTPUT RUNNER test/mcpl-strict-sinks.mjs` | two PASS; 288 cells each |
| review-extra-accessors-{node,bun} | `env P2_STRICT=true P2_CASE=details-accessor RUNNER "$ORGASMIC_EVIDENCE_DIR/review-extra-accessors.mjs"` | two PASS |

RUNNER is `node --import tsx` or `bun-1.4.3`; GC runs additionally use Node `--expose-gc`. OUTPUT is the corresponding evidence-relative review-matrix JSON. Original probe programs remain outside the worktree.

Fresh receipt logs:
- `gate-review-accessors-01M604K6KT7CZ0MS278Q58ZFDT.log`
- `gate-review-extra-accessors-bun-01M604PVBTW32RBTG8HHHN9NVV.log`
- `gate-review-extra-accessors-node-01M604PTXPDNSWBX85MD6DPAJA.log`
- `gate-review-gc-01M604JZARTD45FVPX7J6XDV9J.log`
- `gate-review-lifecycle-bun-01M604NS2M5WZ0AKS2H87YRJHY.log`
- `gate-review-lifecycle-node-01M604NP62QANG1V0T0H4JJ8TT.log`
- `gate-review-original-bun-reviewer-accessors-01M604N3NRXG138M3FT73MAZV9.log`
- `gate-review-original-bun-reviewer-gc-01M604N2JA8SAETT97R1FR8V5M.log`
- `gate-review-original-bun-reviewer-gc-legacy-01M604N33Y12JB5WNJCG13BS5B.log`
- `gate-review-original-bun-reviewer-probe-01M604N3XRTBYWSWABT8YC6PP4.log`
- `gate-review-original-node-reviewer-accessors-01M604N1NZ0C8GCKV12FGGNRZZ.log`
- `gate-review-original-node-reviewer-gc-01M604N00ED815G83G8VT7K83S.log`
- `gate-review-original-node-reviewer-gc-legacy-01M604N0V97KZHC1QZ7WDQK9WT.log`
- `gate-review-original-node-reviewer-probe-01M604N245C1A6WEX1GXHP20ZS.log`
- `gate-review-strict-gc-bun-false-01M604KK4T40ZADK8D8HDZ8T6D.log`
- `gate-review-strict-gc-bun-true-01M604KKZHZ2F1YVHG8NF99N09.log`
- `gate-review-strict-gc-node-false-01M604KGQKZ63FYSTRF99EH1Y4.log`
- `gate-review-strict-gc-node-true-01M604KHVXTGCXTFZ3B51GWC8R.log`

### Reused clean-final receipts, read during this review

The execution context expressly requires reading eligible logs instead of rerunning those gates. These are exact-final-commit clean-tree receipts, not claims of fresh reviewer executions. Thus the brief's rerun list is satisfied by receipt reuse for the gates below under that later execution instruction; the scoped probes above were independently executed.

| Gate | Command | Recorded result |
|---|---|---|
| r2-final-build | `env NO_UPDATE_NOTIFIER=1 npm_config_update_notifier=false npm run build` | PASS |
| r2-final-typecheck | `node_modules/.bin/tsc --noEmit` | PASS |
| r2-final-node-suite | `env NO_UPDATE_NOTIFIER=1 npm_config_update_notifier=false npm test` | 7959 pass, 45 skip, 0 fail; 8004 total |
| r2-final-strict-node | `node --import tsx --test test/mcpl-strict-*.test.ts` (seven expanded files) | 126 pass |
| r2-final-strict-bun | `bun-1.4.3 test --timeout 60000 test/mcpl-strict-*.test.ts` (seven expanded files) | 125 pass, 1 skip, 0 fail |
| r2-final-comparison | `env P2_EVIDENCE=OUTPUT bash test/mcpl-narrow-verify.sh` | PASS; omitted/false/null and mixed, both engines |
| r2-final-identity | `bash "$ORGASMIC_REVIEWED_EVIDENCE_DIR/identity.sh"` | PASS; identity/receiver controls, both engines/base/final |

Supplied receipt logs (in the reviewed evidence set):
- `gate-r2-final-build-01M6042E2VXJVWGSGA93TCR8EG.log`
- `gate-r2-final-typecheck-01M6042EQ9VTPX18C89862QG1D.log`
- `gate-r2-final-node-suite-01M6042YJT6RTKCG1K9B9H67G7.log`
- `gate-r2-final-strict-node-01M6042ZRMF5GWZ2WT1MW9X5SE.log`
- `gate-r2-final-strict-bun-01M6043F9TQG3WRFT58T7QK659.log`
- `gate-r2-final-comparison-01M60430WND7N10RFSA9K7TR4J.log`
- `gate-r2-final-identity-01M60446HQTTVDBH7RR5JT2K55.log`

Also inspected the supplied final GC/accessor/matrix/audit logs; their outcomes agree with fresh targeted runs. `git diff --check 112bc593..HEAD` passes; final worktree remains clean at the reviewed commit. No applicable conventions/gotchas were supplied; the baseline contains no additional concrete project constraints.

## Unmet Criteria/test gaps

No unmet narrowed implementation criterion found. Real Bun post-open malformed-frame error is still skipped; injected-client coverage is not real-runtime proof. Real DNS and actual constructor-fault cells rely on labelled fault injection. Not every internal alert caller was dynamically driven. No full Bun-suite pass is claimed or required here. The broad assigned gates were reused, not personally rerun, as explained above.

## Residual Risk

This approval is not rollout authorization or a complete redaction guarantee. Console, traces and other excluded sinks can contain reflected credentials. Strict lifetime history is intentionally unbounded; supported matching forms are finite. Withholding affects the two exports only; legacy preparation can still invoke hooks and throw. Delivery is best-effort and still respects cooldown/skip rules. Independent owners can intentionally over-redact shared-object credentials.

## Fix Directions

No production fix requested. Use the updated PR wording that explicitly names both intentional exporting differences, and retain the documented lifetime/local-sink/encoding/coverage qualifications.
