# Findings

None. No actionable bug, regression, scope violation or unmet part-1 acceptance criterion found. **This is not full-R7 certification and not rollout permission.**

# Verdict

**APPROVE** TASK-T2F13 fix round 2 at `112bc593464315a9531b6af6d00d9d2368985daa`, against original base `4976c67d5c7916a15046c627b68913994c33b3cb` and previous round `3b1d62284b0794a3249d613d7ff2eb1897c5c108`.

# Open Questions

No blocking question for part 1. The owner still decides whether to introduce a fifth reason code. The new config refusal reuses `credential-unusable` (`src/mcpl/transport.ts:602,949`): semantically broad, but acceptable within this part's explicitly limited four-code contract. It refuses safely and exposes neither the invalid value nor a cause; shared validation still supplies the clearer configuration diagnostic.

Similarly, DNS failure, connection refusal, TLS failure, timeout and server refusal all map to `credential-unusable` through the strict error/abandon handler (`transport.ts:744–777`). This does mislabel non-credential infrastructure failures; it is not a newly introduced round-2 regression, and this review does not decide the fifth-code question.

# Verification Notes

## Inputs, scope and source

Read the live task record and journal; project.org; original and round-2 briefs; implementer report at `$ORGASMIC_REVIEWED_EVIDENCE_DIR/last.txt`; previous review at `run-01M5Y7C0HR7N4QE4Z0Y76GDG9G/evidence/report.md`; complete cumulative and round diffs; relevant production callers and test/harness source. Gotcha and convention collections are empty; no applicable AGENTS.md was found. Risk tier is risky: P1, credential safety path and cumulative breadth.

Round changes are only README, transport.ts and two already-new test files. Cumulatively, only the three allowed production files, README and six tests absent at the original base changed. Production +128/-2 (net 126); tests +709; README +39. No dependency/version edits.

`review-r2-evidence-audit` independently proves:
- Legacy WebSocket body after the new admission block is byte-identical to base.
- Factory body after flag admission is byte-identical to base.
- Executable SERVER_CONFIG_BOOLEANS table and complete assertServerConfigBooleans function are unchanged, even versus base. Only the type annotation excludes the new field; it is byte-identical to the previous round.
- headerCarries is unchanged; required README disclaimer is present.
- Lock SHA-256 remains `0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`, matching preserved acquisition bytes.

Shared/non-strict cumulative hunks are confined to the import, optional type/docs, erased boolean-table type exclusion, validation helper call and two entry checks. The helper immediately returns for undefined/null/false; no caller objects are copied or replaced on those paths. The new entry checks read only the new flag and preserve existing-settings validation text and ordering. The invalid-value refusal is the intentional round-2 exception to the early literal-true-only branch rule.

## Independent production-route probes

`review-r2-routes` passed **58 cases per engine**, Node 22.23.3 and Bun 1.4.3. Own probe source is `review-routes.mjs`; full before/after counters and errors are in `routes-node.json` and `routes-bun.json`.

For each of `'true'`, `1`, `{}`, `'1'`, `[]`, exercised:
- Direct exported openTransport and WebSocketTransport.open.
- McplServerConnection.connect and connectWithReconnect.
- Direct factory and connection stdio routes.
- Framework startup and runtime/programmatic connect.
- Framework restart of an already-connected server.
- Actual connection drop followed by scheduled reconnect, after mutating a previously valid config.

Every invalid entry produced zero additional provider calls, spawn attempts, TCP connections or upgrades. A counting fail-fast hook observed StdioTransport.spawn; the production WebSocket client was never replaced or wrapped. Startup correctly logs/skips the invalid server rather than rejecting framework creation; restart refuses before tearing down the existing connection. Source routing confirms connect/reconnect converge on handshake → openTransport (`server-connection.ts:1275`), while framework connect/restart also validate through usableConfigFamily (`framework.ts:29220`).

Own probes additionally refuse explicit strict `protocol: 'legacy'` and `'modern'` through both exported entries, connection and framework APIs. README:334–337 correctly documents refusal: the protocol selector is stdio-only.

## Capture sensitivity

`review-r2-capture-sensitivity` independently removes each property from the strict snapshot **in memory**, without editing source. On each engine, the committed admission tests (`test/mcpl-strict-credentials.test.ts:286–296`) pass 2/2 unmodified. Deleting command causes only “ambiguous command and URL” to fail; deleting transport causes only “stdio transport without command” to fail. Each mutant returns 1 pass / 1 fail because an invalid authenticated dial succeeds, not because of cleanup or loader failure. Exact mutated sources, hashes and logs are retained.

These fields are needed for direct pre-await binding admission; they are not post-await selection inputs. Passing-on-base pending-mutation controls do not, by themselves, prove every physical capture necessary. The previous review's post-await-use distinction remains valid.

## Independent legacy comparisons: undefined, null, false

Adapted the previous reviewer's inspected evidence-only controls, using an independent loader that fetches all three changed production sources with `git show BASE:path`. No checkout, reinstall or production-client substitution. Fresh base/final processes used the same installed tree on both exact engines.

`review-r2-independent-legacy` and `review-r2-byte-comparison` pass:
- **48 nonempty sink pairs** (8 sinks × 3 legacy flags × 2 engines), byte-identical.
- **48 raw handshake pairs**: identical request target and every header name/value/order/count/whitespace after ephemeral-port normalization and normalization of **only the Sec-WebSocket-Key value**. Every key is canonical base64 for 16 bytes, fresh across all 48 dials per engine. No frames/extra bytes before the delayed first response. Raw receipts retained.
- Provider throw/null/empty/value in header/query mode, fallback log text, receiver and config/transport prototypes/shape.
- Native thrown-error identity/cause/descriptors; prototype, non-enumerable and private-state responders through streaming/non-streaming inference routing.
- Fixed inference event types and exact failure reason, including real framework/router credential/event-name collision controls in default mode.
- Legacy abandonment, connection failure, refusal, actual 15-second timeout and nine other invalid-policy/constructor paths: matching error text/class/prototype/own keys/descriptors/cause presence. Stack source-location text is not compared.

Null/false sink and identity outputs additionally equal the undefined outputs, not merely their respective bases. Each paired SHA-256 and byte size is retained in `review-r2-comparison.json`. Sink hashes below match base and final for all three flags on both engines:

| Sink | Matching SHA-256 |
|---|---|
| traces | `805d234762ebfaf3cb99df4c7f953c157da91f5227d8954f8291939d3addc160` |
| console | `d503e96988f6991e15eada820a446733fd9f0577293061a048ae2be80097305e` |
| failures | `1c9cdf3861b13e2585b4b61f9af4ae5697c0b11aa43e97038887d5a3b31bf2b3` |
| webhook | `963984b8c78d4cca678658beb70582c07bff436e334373b413bf4f77a8c1f91a` |
| catalogue | `feb6296a5afba5549d7a773f7b128a40d0cef0c4f809ed0b972e31ba069111e2` |
| presentation | `d12a78af8cdb8e9ba7a43fc5513542b61f3631edaeb897d0cea73bf980cbf244` |
| notices | `88b32f2d020206eac2515c55a114c4c0328e95240fe3c9f1b0887d34f938d4d6` |
| listing | `7ce40c6c59a1cdcc8f917a5c3a7ba0e4544bf83bb5b270a3d03faf2ee38d7db0` |

Wire hashes remain Node `e8f877a4014c84648dfac0e56120dbc78b23dcc392868482c8987b96d1b5dfd7`, Bun `a7ce73d16a09d39de7987326df590bffd3a7302e6beea46d50562df131149a3e`.

## Recorded gates and per-test baseline

Read the supplied clean-tree r2-build, r2-typecheck, r2-suite, focused Node/Bun, scope, sink/wire and acceptance-comparison logs instead of deliberately rerunning those gates. Final suite: **7,900 pass / 45 skip / zero fail**, versus original **7,814 pass / 45 skip / zero fail**.

Own audit parses original named receipts, including duplicate Bun summaries and skip reasons: existing outcomes unchanged; exactly 86 additions. On each engine, **32 controls PASS→PASS and 54 new cases FAIL→PASS**. All 172 named baseline/final rows are saved in `audit-matrix.json`. Recorded focused gates include passing 301/302/303/307/308 strict redirect tests, snapshot matrix, unsupported-version simulations, reconnect and abort controls.

Independent successful gates (all clean at the reviewed HEAD):
- `review-r2-routes`: `bash "$E/review-routes-run.sh" "$E" "$P"`
- `review-r2-capture-sensitivity`: `bash "$E/review-mutations-run-v2.sh" "$E" "$P"`
- `review-r2-independent-legacy`: `bash "$E/review-legacy-run.sh" "$E" "$P"`
- `review-r2-byte-comparison`: `env -i PATH="$PATH" HOME="$E" NO_UPDATE_NOTIFIER=1 node "$E/review-compare-r2.mjs" "$E"`
- `review-r2-evidence-audit`: `python3 "$E/review-audit.py"`

E is this run's evidence directory; P is the reviewed run's credential-part1-round2 directory. Scripts retain exact child commands: Node `node --import tsx`; Bun `bun-1.4.3`; clean env, synthetic credentials and self-started loopback peers. Local version/digest checks confirm the specified engines and Bun digest.

## Harness deviations and limits

The first route attempt incorrectly expected startup creation to throw; source and observed output show the existing log-and-skip contract. The evidence-only probe was corrected and rerun successfully.

The first mutation wrapper placed Bun's --preload before “test”, causing Bun to launch the package test script rather than its focused test runner. It inadvertently began the full suite; this was not requested and is not used as verification. Inspected its owning PID/process group, terminated that dispatch gate, confirmed the entire group gone, and retried once with `bun-1.4.3 test --preload ...`. The interrupted receipt and log remain. An audit attempted before the mutation artifacts were complete also failed; the completed-artifact audit passes. These are reviewer harness errors, not product regressions. Bun's automatically generated transpile cache was moved outside evidence; logs/scripts/small artifacts remain.

Isolation is the actual LD_PRELOAD libc loopback guard, **not a namespace or kernel-enforced egress isolation**. The probes use local endpoints; no packet-capture claim of all traffic is made, and direct-syscall bypass is not excluded. Unsupported-engine tests simulate version properties, not separate unsupported binaries. No external/TLS qualification or real credentials were used. Parts 2–4, full R7 and rollout remain unverified.

Inherited acquisition deviation was verified in the original acquisition audit: **GET https://registry.npmjs.org/npm**, HTTPS despite npm's “http fetch” category, during acquisition rather than test execution. It was npm's update notifier fetching public metadata, outside the declared-dependencies-only boundary. “Retain the current evidence; do not restart” retained evidence, not retroactive compliance. No credential, resolution/install change or lock-hash change is evidenced. This affects acquisition-policy compliance, not the validity of same-installed-tree behavioral/build/typecheck/suite comparisons. No installation/resolution occurred during this review; update notifications were disabled in probe environments.

Provenance remains as previously documented: private prior references arrived only at finalize (QY3F8), so implementation non-reuse was incidental to late delivery, not a tested reuse-admission procedure. This review reused explicitly supplied reviewer controls as evidence, not implementation code.

## Manager additions handled before finalize

Acknowledged by content: explain the cross-round presentation hash drift; confirm stdio-only protocol selection against base types and validation; and explicitly include post-open socket errors in the broad error-code classification.

**Presentation drift (not a product regression).** `review-r2-round-drift` recursively diffs the implementer's original raw presentation receipts for base/final on Node/Bun. In all four pairs, the **only** changed JSON leaf is `/snapshot/source`:
- Round 1: `/tmp/t2f13-evidence.6lBU3w/scenario-work/tools.json`
- Round 2: `/tmp/t2f13-evidence.6lBU3w/fix-round2/scenario-work/tools.json`

Nothing else moved: no counter, generated name, catalogue content, array order or key order changed. The input T2F13_WORKSPACE directory changed, and the unchanged scenario includes that absolute tools.json source path in the snapshot. Accordingly the serialized presentation hash changes from `2b4d7357d0087c96d48a96bf8532dfa8c4414e81c1cf91a1269f132c0572f9fd` to `ba49af086a4604ead9313192877b4101e52ec006c58e52cbccc0691d561c8057`. Each round's base/final paths and bytes are identical. Evidence: `round-presentation-drift.json`, generated from the two implementer runs' `credential-part1/sinks-{base,final}-{node,bun}.json` and `credential-part1-round2/sinks-{base,final}-{node,bun}.json`. Cross-round absolute-path drift does not undermine within-round base/final comparisons.

**Protocol contract.** Original-base and final `types.ts:260–289` both specify URL-scheme selection for network family and a stdio-only protocol selector. Original-base and final `protocol-family.ts` contain the identical shared-validation block now at :726–733: a protocol selector on a non-stdio transport is a configuration error. resolveServerBinding uses protocol only for stdio and URL scheme for network (`:602` onward); this existing resolver was not changed. Thus refusing explicit `protocol: 'legacy'` for a new strict ws dial is consistent with the base's supported configuration contract, not a narrowing of valid legacy behavior. The raw exported WebSocket entry historically bypassed shared config admission; the new strict path enforces that contract, while its non-strict behavior is unchanged. The drift gate checks the base/final documentation and exact existing validation block; production probes and baseline controls provide the behavioral evidence.

**Post-open errors.** In addition to DNS/refused/TLS/HTTP-refusal/timeout, socket `error` events **after successful open** are also mapped to `credential-unusable`: `transport.ts:774` removes the constructor-installed listener and installs `transport.reportError(fail('credential-unusable'))`. This loses the native diagnostic distinction for non-credential failures too. This is source-path analysis, not a claim that a new TLS/post-open-error qualification probe ran. It remains an owner diagnostic-code question, not a fifth-code decision or new round-2 blocker.

Additional successful receipt: `review-r2-round-drift -- python3 "$E/review-round-drift.py"`, clean at the reviewed HEAD.

# Fix Directions

No code changes requested. Preserve the narrow strict/legacy separation; leave the fifth-code decision to the owner and complete parts 2–4 before qualification or rollout. HEAD and tracked/untracked worktree status are unchanged; no source edits or commits were made. Only permitted ignored test/build output may have been refreshed by the accidental script invocation.
