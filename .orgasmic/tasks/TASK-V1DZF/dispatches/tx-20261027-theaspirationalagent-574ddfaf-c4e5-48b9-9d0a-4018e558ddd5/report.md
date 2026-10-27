# TASK-V1DZF — fix round 4

## Changed

Starting HEAD: `fd575946248892f4c5ff7116254d0e71c5d496bd` (clean). Final HEAD: `340231e371c2b1efebefd8f974c3923332ea569c` (clean), on the same `task-v1dzf-impl` branch. Original upstream base `4976c67d5c7916a15046c627b68913994c33b3cb` remains an ancestor. No merge, rebase, push, dependency installation, version change, or publication.

Focused local commits:

1. `091b676d82d7f91a2d5275863b0870073e002b68` — project native strict diagnostics before redaction.
2. `82a7e470c4c80f226eeda11b4eb5d0f5fc43f1b1` — final-message redaction for strict MCPL diagnostics.
3. `1f007f13120b5ad54d2d46f125a06fbc11401e6a` — callback and operator-entry diagnostic boundaries, with additional callback tests.
4. `f58325f060ee16770abe6a466ffc045869e1992c` — mechanical drift guard, explicit exception proposals and covered output-boundary witnesses; additional contextual console/ledger/webhook boundaries.
5. `220d428c51f94edcc9df5c1a800ecf5b79997918` — explicitly unreviewed proposal labels; isolate new witness log fixtures.
6. `7d2185856ac40f314bf2e2662ca52c936301f769` — isolate earlier TASK-V1DZF scalar/sink fixtures from parallel failures.log writers without weakening assertions.
7. `56059f2f7fd771c093243f4ab7d4b3caa8983813` — borrowed-private-method legacy fixture inherits the actual framework formatter.
8. `f2df7e41f3f00197f3a8d114b31b8a45adf582c5` — supported native/scalar ToolResult.error diagnostic copies before queue/drop formatting; successful application data remains original.
9. `340231e371c2b1efebefd8f974c3923332ea569c` — scan limits in the committed test file; distinguish covered transport diagnostic errors from original operational payload exclusions.


The flag remains **`credentialRequired?: boolean`**, literal true opt-in for WS only: explicit header transport, no static token or URL token/userinfo, a runtime provider on every dial/reconnect, usable printable-ASCII header value, no stale/anonymous fallback, and TLS except loopback. Missing/failed/empty/unusable provider results stop before I/O; HTTP/stdio reject the flag. Exact engine qualification and redirect refusal remain unchanged. The name is retained because it describes the fail-closed credential requirement without claiming file reading or origin binding. Unset-flag behavior remains legacy.

### 1. One strict final-message choke point

`src/mcpl/protocol-family.ts:170` defines `strictDiagnosticText`. SDK dynamic message bodies are assembled first and filtered there before Error construction or diagnostic publication. `diagnosticError` (`:212`) is the Error factory; `diagnosticErrorValue` (`:230`) is the final boundary for errors originating in configuration-free algorithms/libraries. With no strict connection these preserve legacy text, Error options and thrown-object identity.

Direct/contextual constructors in the connection, transport, binding/validation and registry use that boundary. Configuration-free helper failures are filtered at their connection/framework publication boundary, not by rewriting algorithm inputs or routing identifiers. Framework-owned MCPL helpers receive optional diagnostic-only formatters (identity by default), so completed console messages, including generated counts and punctuation, also pass the same choke point. Wire close codes and operational identifiers are not rewritten.

Principal fixes and publication paths:

| Path | Evidence / tests |
|---|---|
| Handshake close/error/timeout/abort failures | `src/mcpl/server-connection.ts:1369`; `failed` now constructs via `diagnosticError`; both public connect callers tested against real upgrade/close responses. |
| Generated pagination errors | `src/mcpl/server-connection.ts:1820`; real malformed sixth tools/list page, credential `6`. |
| Connection diagnostic events, including retained-token reconnect failure | `src/mcpl/server-connection.ts:1004,1028,2140`; filter before queueing/emission and again when delivering held reports, covering rotations while held. |
| Returned public connection/framework errors | `src/mcpl/server-connection.ts:1242`; framework `connectMcplServer`, `disconnectMcplServer`, `restartMcplServer`, and programmatic tool dispatch. Their publication catches include operator-entry refusals. Known SDK protocol-error prototypes are retained explicitly; arbitrary native prototypes are not. |
| Framework trace/display/queued notices | `src/framework.ts:5931,26358,29175-29209,30923`; only SDK diagnostic `ToolResult.error` (including native/scalar carriers passed by JavaScript callers) is projected/filtered before queue/drop formatting and in returned tool results, not successful application data/structured content. |
| Persistence and alerts | `src/framework.ts:26510,26644`; strict projection/redaction precedes formatting, bounding and failures.log/webhook serialization. |
| Secondary callback diagnostics | `src/framework.ts` trace-listener error handling, ops webhook rejection, and reference-registration failure console calls; real-response-backed callback tests cover Error cause/httpStatus and the rejected webhook callback. |

**Fixed SDK discriminators are structurally separate, not text-pattern exemptions.** Manager answer `ask-7d808e8d7aac4caca6ac19fbd478cc18` / `msg-85b0189970b84d748eace79ee08ec39d` approved preserving compile-time SDK reason codes only with code provenance. The factory receives a typed reason enum separately from the dynamic body, and a WeakMap brands only factory-created errors with the already-safe body plus that enum. It never recognizes marker-looking text by searching a message. Appending the fixed suffix accounts for credential matches crossing the body/suffix boundary. The state contains no provider result. Server-forged `(metadata-credential)` text is ordinary reflected text and is redacted. Tests pin the recognizable real discriminator, a forged discriminator plus credential, and a real initialize response whose credential spans dynamic context and the fixed suffix. The unchanged 94-character control still passes.

### 2. Detached strict native-carrier copies

`src/mcpl/protocol-family.ts:334-383` projects strict diagnostics before redaction:

- Native Error: safe detached plain fields `name`, `message`, `code`, `httpStatus`, status/classification fields, cause chains and aggregate errors, and known SDK error data fields. Stack/rawRequest/unknown native internals are not copied.
- Boxed number/string/boolean/bigint/symbol: intrinsic unboxing, without invoking overridden valueOf/toString/toJSON; bigint/symbol become diagnostic text.
- Arrays/plain objects: detached recursive data-descriptor copies.
- Unsupported native/class carriers, accessors, unreadable data, cycles or excessive nesting: conservatively withheld. No raw native reference is returned by strict diagnostic copying, and custom getters/toJSON are not invoked.

Final projection text, keys and scalar values are redacted before bounding/persistence. Strict API errors are fresh native Errors built from the safe projection, rather than exposing the original carrier. Legacy copying remains unchanged. Received application content, structuredContent, policy/routable identifiers and other application payloads remain original.

### Diagnostic construction / assembly inventory

The complete function-by-function, file:line inventory is **`round4/diagnostic-site-inventory.md`**, backed by **`round4/diagnostic-site-inventory.json`** and reproducible **`round4/inventory.mjs`** in this run's evidence. It indexes 1,193 sites in 32 files: every Error/Refusal construction/super initializer in src/mcpl; framework MCPL paths and shared publication boundaries; console/events/traces; assembled message/error fields; and text-return helpers. Operational text returns are explicitly included for audit but must not be rewritten.

The full explicit constructor/super location list follows. Message assembly/publication function names and locations are listed in the linked inventory, rather than pasting complete source documents here.

| Source | Error/Refusal construction or superclass sites | Route / disposition |
|---|---|---|
| `src/framework.ts` | 1796, 3713, 3746, 3831, 3834, 3844, 3968, 4051, 4057, 4897, 7703, 14897, 14899, 14900, 14963, 14966, 27556, 27747, 27766, 27818, 27872, 28796, 29289, 29293 | Contextual constructors and completed console bodies use the choke point; accounting Errors now project cause/message through diagnosticErrorValue with their known SDK prototype. Pre-provider boot-only exceptions and delegated publications are itemized as UNREVIEWED proposals below. |
| `src/mcpl/channel-registry.ts` | 132, 814, 1334, 1335, 3524, 3529, 3544, 3632, 3751, 3756, 3759, 4257, 4266, 4280, 4327, 5141 | Internal lifecycle errors retain operational classification/codes; console callbacks, framework returned ToolResult.error, traces and queued notices filter at publication. |
| `src/mcpl/checkpoint-manager.ts` | 92, 115, 178, 188, 433, 436, 569, 610, 618 | Class messages: formatter. Pure JSON Pointer/Patch errors: caught and formatted at checkpoint/contained-handler publication. |
| `src/mcpl/feature-set-manager.ts` | 38, 305, 313, 321 | Typed messages and completed console diagnostics: formatter. Trace publication: framework boundary. |
| `src/mcpl/hook-orchestrator.ts` | 52, 289 | Class diagnostics: formatter. Configuration-free timeout errors: consumed by formatted hook diagnostic path. |
| `src/mcpl/inference-router.ts` | 95, 112, 115, 156, 165, 455, 458 | Class diagnostics and error-response/trace publication: formatter. Pure result/finish/tool-call errors: consumed there. |
| `src/mcpl/modern-connection.ts` | 125, 349, 367, 371, 476, 552, 631, 741, 775, 841, 990, 1020, 1093, 1168, 1191, 1199, 1210, 1228, 1241, 1254, 1267, 1272, 1284 | HTTP/modern stdio cannot enable strict mode; unchanged, deliberately not modernized. |
| `src/mcpl/prefix-rule.ts` | 27 | Configuration-free formatter; caller filters completed refusal before construction/publication. |
| `src/mcpl/protocol-family.ts` | 222, 428 | Error factory: choke point. Generic maskedError: contextual final boundaries (and unchanged modern paths). |
| `src/mcpl/push-coalescer.ts` | 40, 62, 431, 433, 434, 436, 473, 476, 479, 482, 485, 487, 488, 489, 491, 601, 611, 635 | Configuration-free validation/coalescing errors: strict push/channel console, connection error responder, framework trace/queue diagnostic publication. |
| `src/mcpl/push-handler.ts` | 210 | Empty-content validation error: diagnostic formatter / connection error responder / framework trace boundary. |
| `src/mcpl/server-connection.ts` | 192, 211, 287, 312, 341, 1273, 1441, 1535, 1951, 1995, 2224, 2241, 2268, 2305, 2333, 2779, 2886 | Contextual Error/typed Error messages: choke point; aggregate children: projection. Cleanup subclasses: stdio-only (strict rejected). Public catches and diagnostic emits filter before publication. |
| `src/mcpl/toolset-host.ts` | 163 | Contextual typed request error: choke point. Hub logs: framework diagnostic callback. |
| `src/mcpl/toolsets-module.ts` | 134 | Configuration-free MetaError: programmatic ToolResult.error and process queue/trace boundaries filter completed messages. |
| `src/mcpl/transport.ts` | 382, 411, 427, 429, 535 | Remaining direct constructors listed here: stdio-only (strict rejected). WS constructors: diagnosticError. No-listener WS console fallback: final-message formatter. |

Completed-message console boundaries were also audited in capability-grant, channel-registry, checkpoint-manager, feature-set-manager, hook-orchestrator, inbound-source digest fallback, inference-router, push-handler, reference-fetcher, tool-classes, tool-lifecycle, tool-result-normalize and toolset-host/hub. These callbacks are diagnostic-only and default to identity; they do not filter application envelopes or lifecycle wire payloads. The framework supplies the same choke point. Pure rendering/validation helpers without a server configuration are not taught to mutate their inputs; their SDK-owned diagnostic consumers perform final filtering. Modern HTTP and stdio paths remain outside strict mode.

Changed files this round (26): `src/framework.ts`, `src/mcpl/capability-grant.ts`, `src/mcpl/channel-registry.ts`, `src/mcpl/checkpoint-manager.ts`, `src/mcpl/feature-set-manager.ts`, `src/mcpl/hook-orchestrator.ts`, `src/mcpl/inbound-source.ts`, `src/mcpl/inference-router.ts`, `src/mcpl/protocol-family.ts`, `src/mcpl/push-handler.ts`, `src/mcpl/reference-fetcher.ts`, `src/mcpl/server-connection.ts`, `src/mcpl/server-registry.ts`, `src/mcpl/tool-classes.ts`, `src/mcpl/tool-lifecycle.ts`, `src/mcpl/tool-result-normalize.ts`, `src/mcpl/toolset-host.ts`, `src/mcpl/transport.ts`, `test/fixtures/mcpl-diagnostic-allowlist.json`, `test/helpers/mcpl-diagnostic-closure.ts`, `test/mcpl-credential-diagnostics.test.ts`, `test/mcpl-credential-scalars.test.ts`, `test/mcpl-credential-sinks.test.ts`, `test/mcpl-diagnostic-allowlist-boundaries.test.ts`, `test/mcpl-diagnostic-closure.test.ts`, `test/mcpl-rejection-log-lines.test.ts`.

### Manager addendum: mechanical drift guard and UNREVIEWED proposals

Per manager instruction and answer `ask-784b1d9a60c2442385a57004ed75f3fe`, the committed allowlist is **UNREVIEWED IMPLEMENTER EXCEPTION PROPOSALS**, not independent approval. Every reason starts with that explicit label. The manager authorized delivering proposals for the independent reviewer rather than claiming review work here.

- Scanner: `test/helpers/mcpl-diagnostic-closure.ts`.
- Guard/self-tests: `test/mcpl-diagnostic-closure.test.ts`.
- Committed proposal file: `test/fixtures/mcpl-diagnostic-allowlist.json`.
- Boundary witnesses: `test/mcpl-diagnostic-allowlist-boundaries.test.ts`.
- Complete entry/reason/boundary/test table: **`round4/closure-proposals.md`** (482 entries).
- **Separate, complete list of every potentially server/peer/provider-derived entry: `round4/closure-peer-derived-proposals.md` (373 entries)**, for individual reviewer judgment. Nothing in that list is implicitly approved.

The AST scan recursively covers all TypeScript in src/mcpl (including deliberately excluded modern/stdio paths), the anchored framework MCPL section, framework methods/functions with MCPL identifier references, and shared diagnostic boundaries. It enumerates Error/Refusal construction, Error super calls, throw, console methods (including computed spelling), trace/event/process publication, audit/log callbacks, ops alerts and file writes. Exact full-source SHA256 + owner/kind/occurrence identify each site; no wildcard exemptions or test-time regeneration. New/changed unlisted sites, stale entries, missing one-line reasons or uncovered deferred proposals fail the guard. Merely calling the choke point elsewhere in a method does not exempt a later site.

Final mechanical result: **740 enumerated sites = 258 locally routed + 482 explicit unreviewed proposals; zero unlisted or stale sites in this defined scan**. This is a drift check, **not security qualification or proof of class closure**.

| Proposal category | Count | Reason category |
|---|---:|---|
| deferred final boundary | 339 | Internal classification/algorithm values are filtered at explicitly named downstream SDK publication boundaries; each entry names the covering output-witness test. |
| operational | 33 | Original application/transport/process payloads or wire close codes are not SDK display copies; diagnostic consumers filter copies/diagnostic fields. Reviewer must judge these separately. |
| unsupported strict family | 82 | Modern HTTP/stdio/child cleanup cannot enable strict mode; validated before dial/spawn. |
| pre-dial | 27 | Framework restoration/bootstrap runs before the first provider invocation; no strict provider result exists. |
| root implementation | 1 | The choke-point Error factory itself constructs from already-safe message/options. |

The **340 deferred/root proposals** each name one of the following tested boundaries. The witness loop processes each deferred/root proposal identifier using real authenticated dials on one config (two retained rotations and a current numeric credential), raw/URL-encoded/Bearer/JSON forms, native Error cause/code/httpStatus, boxed scalars and nested metadata. It tests the completed output carriers at the named boundary; input/application data remain original. Native/scalar ToolResult.error is projected before queue/drop formatting, while data/structured payload is deliberately not rewritten.

| Named boundary | Witnessed proposal count |
|---|---:|
| AgentFramework.mcplDiagnosticText | 141 |
| AgentFramework.emitTrace | 129 |
| diagnosticErrorValue / diagnosticError | 40 |
| AgentFramework.opsAlert / logFailure | 13 |
| McplServerConnection.emit | 9 |
| AgentFramework.mcplToolDiagnostic | 7 |
| AgentFramework.pushEvent | 1 |

**Manager-requested key count: 33.** These are conservatively classified potentially received-data operational proposals whose **complete original payload is not covered by a redaction-boundary test** (diagnostic-copy tests are not counted as full-payload coverage). Every exact entry is named with its reason in **`round4/closure-uncovered-received-proposals.md`**, backed by `round4/closure-keycount.json`:

| Uncovered-original-data reason group | Entries |
|---|---:|
| Mixed process/application events via pushEvent; diagnostic fields only are filtered | 22 |
| Operational connection events; diagnostic consumers filter copies | 6 |
| Operational transport input/close events; SDK diagnostic consumers filter their copies | 5 |

There are **zero deferred proposals missing a named tested boundary**, but this is not a claim that delegation has been proved end-to-end. All **339 deferred + one root** entries have the named boundary witnesses above. The transport **error** emit is categorized as covered/deferred (its WS error is built by diagnosticError); only original operational transport input/close payloads remain in the uncovered group. This refines the preliminary 34 count to **33**. The 33 are explicitly **unreviewed proposals**, not approved exemptions or an assertion that no credential can occur in their original application/wire values.

The scan limits are also inside the committed `test/mcpl-diagnostic-closure.test.ts` header, including files/syntax covered and the alias/delegation/dynamic-callback limitations.

**Limits:** aliases, delegated formatting, dynamically selected callbacks and indirectly reached framework helpers can escape textual/AST selection or conceal a route. Witnesses establish filtering for each proposed output carrier at its named boundary, **not execution of every original source site or proof that the site's actual delegation reaches that boundary**. The reviewer must individually verify the 373 potentially derived routes/exclusions, including operational-data exceptions, and approve/reject proposals. No independent review was performed by this implementer.

## Verification Gates

### Environment and dependency continuity

`r4-environment` passed at final HEAD. Bun **1.4.3**, binary SHA256 **`7ce7d6b654eddeec20afddf2396317fba6dc19ab52788a27e894e1806bf8f24b`**; Node **v22.23.3**; npm **10.9.9**. No reinstall. The ignored generated package-lock.json is byte-identical to the preserved acquisition copy outside the repository: SHA256 **`0d3bc869ca0edc85c87f7fde4ac2224a9dda616dc6e6fea8265968f4bfd093b1`**. `round4/environment-final.log` records the resolved version AND full integrity for ws 8.22.0, typescript 7.0.2, tsx 4.23.15, @types/node 22.20.5, @types/ws 8.18.2, @animalabs/mcpl-core 0.4.0 and @modelcontextprotocol/server 2.4.0.

Every verification command used the SAME existing isolated wrapper, abbreviated `I` below:

```
I=/tmp/task-v1dzf-evidence/isolated
```

It uses an empty credential-free HOME/config environment, offline npm configuration, and the existing loopback-only LD_PRELOAD network guard. Tests use synthetic data, self-started ephemeral 127.0.0.1 servers, and stubbed webhook fetches. No real credentials, external model/provider call or external test acquisition was used.

### Before / after: every new test

The final 22 new tests (16 runtime regressions/controls plus six addendum tests) were run on both engines against the fix-round starting production source `fd575946...`, on this same installed tree. The baseline recipe temporarily restored **all changed production inputs** from that commit with `git show`, leaving the new tests in place, and restored the final sources using an EXIT trap. It did not reinstall, switch branch, change HEAD or use the read-only main checkout. Baseline receipts therefore correctly say **dirty** (test/source overlay), not reusable clean-base gates. Exact recipe and transcript: `round4/baseline-final.sh`, `round4/baseline-final.log`. Gate names: `r4-baseline-final-node`, `r4-baseline-final-bun` (latest invocations).

Exact test commands (under `orgasmic dispatch gate NAME --`):

```
I node --import tsx --test test/mcpl-credential-diagnostics.test.ts test/mcpl-diagnostic-closure.test.ts test/mcpl-diagnostic-allowlist-boundaries.test.ts
I bun-1.4.3 test test/mcpl-credential-diagnostics.test.ts test/mcpl-diagnostic-closure.test.ts test/mcpl-diagnostic-allowlist-boundaries.test.ts
```

Baseline on **each** engine: **22 tests, 12 pass, 10 fail**. The 16 runtime cases below are eight controls green on base and eight real regression cases red on base; final all green. Four scanner self-tests are green controls. The mechanical inventory test fails on the old source's unlisted/stale sites: this is **structural baseline evidence, not independent runtime defect proof**. The output-witness test fails on an actual native diagnostic leak through opsAlert/failures.log, not on a missing helper import. An earlier named-import baseline trial failed at module load and was discarded; the final namespace-import baseline reaches the real assertion. Final focused results: **104/104 on each engine**, including all 22 new tests.

| Test name in `test/mcpl-credential-diagnostics.test.ts` | Node/Bun baseline | Node/Bun final |
|---|---|---|
| control legacy: assembled handshake close error via connection | PASS / PASS | PASS / PASS |
| control legacy: assembled handshake close error via framework | PASS / PASS | PASS / PASS |
| control legacy: retained credential in reconnect-failed assembled error | PASS / PASS | PASS / PASS |
| control legacy: generated pagination number redacted at returned-error boundary | PASS / PASS | PASS / PASS |
| control legacy: detached native diagnostic projection before queue/trace/persistence | PASS / PASS | PASS / PASS |
| strict: assembled handshake close error via connection | FAIL / FAIL | PASS / PASS |
| strict: assembled handshake close error via framework | FAIL / FAIL | PASS / PASS |
| strict: retained credential in reconnect-failed assembled error | FAIL / FAIL | PASS / PASS |
| strict: generated pagination number redacted at returned-error boundary | FAIL / FAIL | PASS / PASS |
| strict: detached native diagnostic projection before queue/trace/persistence | FAIL / FAIL | PASS / PASS |
| strict: unsupported native carriers/getters/cycles are withheld, never shared or invoked | FAIL / FAIL | PASS / PASS |
| control: SDK-owned metadata discriminator remains recognizable for a short credential | PASS / PASS | PASS / PASS |
| control: a server-forged reason suffix is not an SDK-branded discriminator | PASS / PASS | PASS / PASS |
| strict: a credential spanning dynamic context and the fixed discriminator is removed whole | FAIL / FAIL | PASS / PASS |
| control legacy: trace-listener and webhook callback diagnostics pass the final boundary | PASS / PASS | PASS / PASS |
| strict: trace-listener and webhook callback diagnostics pass the final boundary | FAIL / FAIL | PASS / PASS |
| mechanical closure: every MCPL diagnostic site is locally routed or explicitly allowlisted | FAIL / FAIL (structural) | PASS / PASS |
| control: mechanical scanner enumerates every required diagnostic site syntax | PASS / PASS | PASS / PASS |
| control: unrelated choke-point calls never exempt an unprotected later site | PASS / PASS | PASS / PASS |
| control: changed source invalidates an exception and every exception needs a reason | PASS / PASS | PASS / PASS |
| control: new framework MCPL paths and shared diagnostic boundaries cannot escape enumeration | PASS / PASS | PASS / PASS |
| strict: proposed deferred exceptions have current and retained output witnesses at named boundaries | FAIL / FAIL (actual native diagnostic leak) | PASS / PASS |


### Final clean-commit gates

All following gates passed at `340231e371c2b1efebefd8f974c3923332ea569c`, clean at start/end. The final complete command driver is `round4/final-gates.sh`; transcript `round4/final-gates-closure-limit.log`; compact results/digests `round4/final-gates-summary.txt`. The daemon's individual `gate-NAME-INVOCATION.log` files are the authoritative receipts. There are **31 passing gates** in that driver, plus `r4-environment` (**32** total final clean-commit invocations).

| Gate | Command after `orgasmic dispatch gate NAME --` | Result |
|---|---|---|
| `r4-build` | `I npm run build` | PASS, including project postbuild. |
| `r4-typecheck` | `I ./node_modules/.bin/tsc --noEmit` | PASS, no diagnostics. |
| `r4-focused-node` | `I node --import tsx --test test/mcpl-credential-{required,sinks,scalars,diagnostics}.test.ts test/mcpl-diagnostic-{closure,allowlist-boundaries}.test.ts` | **104/104 pass**, 0 fail/skip. |
| `r4-focused-bun` | `I bun-1.4.3 test test/mcpl-credential-{required,sinks,scalars,diagnostics}.test.ts test/mcpl-diagnostic-{closure,allowlist-boundaries}.test.ts` | **104/104 pass**, 0 fail/skip. |
| `r4-full` | `I npm test` | **7,963 tests; 7,918 pass; 45 skip; 0 fail/cancel/todo; 364 suites**, 105,088 ms. |
| `r4-environment` | `I bash /tmp/task-v1dzf-round4-evidence/environment.sh` | PASS; versions, binary/lock digests, preserved-lock cmp and package integrities. |

The provided starting re-review recorded the existing full-suite result as 7,941 tests / 7,896 pass / 45 skip / zero failures; the final increment is exactly these **22** new tests. The old full suite/typecheck baseline was not rerun during this fix round; the exact new-test baseline above was. No pre-existing production diagnostic was silently fixed.

Development failures and classification (all receipts retained):
- New callback wiring and witness inference introduced transient TypeScript errors (including TS7022); corrected before the final build/typecheck.
- The first combined focused runs exposed cross-file failures.log races (`actual failures.log records written`, 3 versus 2). These were test-fixture isolation failures, not credential leaks. Only TASK-V1DZF fixtures now use private temporary working directories; the exact two-record assertions remain unchanged.
- The first completed addendum full suite at `7d218585...` had **7,963 tests / 7,917 pass / 45 skip / one failure**: `a refusal reaction with no server for its locus names the locus as one field`, because a borrowed private method's plain-object fixture lacked the new formatter. The fixture now inherits the real framework prototype (not an identity formatter); its exact text assertion is unchanged. Targeted rejection controls passed **22/22 on Node and Bun** before the final full run, and the final full suite passes it.
- An early `python` invocation was unavailable (changed to python3); a baseline script lacking execute permission was explicitly launched with bash. Neither counted as a successful verification gate.
- Earlier dirty development gates, discarded import-failure baseline, intermediate passing full runs (7,955 and 7,957 tests), and incomplete/failed gate drivers are not substituted for the final clean-commit receipts.

### All reviewer probe programs, both engines

The complete requested re-review bundle from `run-01M5XSEW65ASPZ070YR6TFF7VS` was read and exercised, including the earlier-round probes retained in it. For each name below and each engine, gate **`r4-NAME-node`** / **`r4-NAME-bun`** ran:

```
I node --import tsx /tmp/task-v1dzf-round4-evidence/probes/NAME.mjs
I bun-1.4.3 /tmp/task-v1dzf-round4-evidence/probes/NAME.mjs
```

| NAME | Final result on both engines |
|---|---|
| `review-probes` | PASS: metadata raw/encoded/Bearer forms, rotation, sinks, unchanged wire routing, full dial snapshot race, numeric RPC error code, punctuation controls. |
| `review-envelope-toolset` | PASS: envelope/toolset/native-value coverage retained from earlier rounds. |
| `followup-probes` | PASS: prior edge/formatting/control-plane cases. |
| `review-scalar-matrix` | PASS: decimal/negative/exponent/true/false/null across two dials and eight sinks; held IDs/refusal codes after rotation. |
| `review-short-values` | PASS: all 94 valid single-printable credentials; 26 initialize refusals from actual content collisions, **zero JSON-syntax-only refusals**, 68 connected; real credential-bearing entries withheld; recovery/retention unchanged. |
| `review-short-withholding` | PASS: unchanged 94-character control and withholding/recovery diagnostic placement. |
| `review-additional` | PASS: both public handshake callers, retained-token reconnect event/console, sixth-page generated error, native boolean/null/number diagnostics. All reported leak flags false. |
| `review-native-boundary` | PASS: numeric Error.httpStatus / boxed number; failures/ops trace/process trace/queue/webhook clean, original native reference not retained. |

The last two defect probes had their old expected-leak assertions inverted/strengthened to require closure; fixtures, production calls and sink captures remain. These adaptations are preserved as `round4/probes/*.changes.diff`. Other non-legacy probes are unchanged. The two legacy programs, loader and compare script below complete execution of all 12 scripts in the supplied bundle.

### Legacy per-sink byte equality: original base vs final, both engines

Gates **`r4-legacy-{sinks,scalars}-{base,final}-{node,bun}`** ran the original legacy program and the extended scalar/native variant. Base mode overlays **all 20 changed production source files** from original upstream `4976c67d...` in memory (Node loader / Bun onLoad); final mode uses current source. The loader and both Bun file filters were extended for this round's helper files, so comparisons do not mix new helper code into the old base. No installation or checkout switch occurs.

Exact recipe for each VARIANT=`sinks|scalars`, MODE=`base|final`, ENGINE=`node|bun`:

```
I node --import tsx /tmp/task-v1dzf-round4-evidence/probes/review-legacy-VARIANT.mjs MODE /tmp/task-v1dzf-round4-evidence/legacy-VARIANT/legacy-MODE-node.json
I bun-1.4.3 /tmp/task-v1dzf-round4-evidence/probes/review-legacy-VARIANT.mjs MODE /tmp/task-v1dzf-round4-evidence/legacy-VARIANT/legacy-MODE-bun.json
I node /tmp/task-v1dzf-round4-evidence/probes/compare-legacy.mjs /tmp/task-v1dzf-round4-evidence/legacy-VARIANT
```

Comparison gates **`r4-legacy-sinks-compare`** and **`r4-legacy-scalars-compare`** passed: **all 32 per-sink comparisons byte-equal** (eight sinks × two variants × two engines). Node and Bun also produced the same digests. The reviewer's controlled Date.now / omission of failure-record `at` / ephemeral port substitution were retained; message text, field values and key order were not normalized.

| Sink | Original legacy bytes | Extended scalar/native bytes | Equality on Node and Bun |
|---|---:|---:|---|
| traces | 717 | 1,175 | exact |
| console | 242 | 246 | exact |
| failures | 183 | 355 | exact |
| webhook | 88 | 88 | exact |
| catalogue | 10,963 | 10,963 | exact |
| presentation | 11,120 | 11,120 | exact |
| notices | 247 | 247 | exact |
| listing | 693 | 693 | exact |

Raw JSONs, all per-sink SHA256 values, adaptation diffs and commands are retained in this run's `round4/` evidence; verification does not depend on prose alone.

## Unmet Criteria

No implementation or requested final verification gate remains uncompleted. The 33 original-operational-data proposals lack full-payload redaction coverage and are explicitly identified for review rather than claimed clean; their app/wire-data exception is proposed, not approved. Independent approval of the explicitly UNREVIEWED exception proposals is outstanding by design, as authorized by the manager; no claim of independent review, security closure or qualification is made.

## Residual Risk

- Exact qualified engines remain **Bun 1.4.3** (actual built-in adapter) and **Node 22.23.3** (ws 8.22.0). The focused redirect controls again pass for redirect responses: the second origin receives **zero upgrade requests**, hence no Authorization header, and the dial fails. Unsupported/newer runtimes still refuse with `engine-unsupported`; no pin, redirect policy, dial snapshot, retention, withholding policy or minimum-length policy was changed.
- Strict credential history remains unbounded for the configuration lifetime. Retaining rotations grows memory/redaction work; no performance benchmark or retention change was requested. README's existing engine-accounting and growth guidance was left unchanged.
- The mechanical guard and output witnesses are complementary drift checks, not alias/dataflow proof; see the unreviewed proposal inventory and limits above.
- Strict copies intentionally withhold unsupported native carriers/accessors/cycles; this trades diagnostic detail for no raw reference leakage. Native stack source coordinates and SDK fixed schema/discriminator fields are not authentication echoes. Host/application-owned data and successful application payloads are not blanket-scrubbed.
- Verification covers local production paths on the two pinned engines, not arbitrary engine versions, external providers, real TLS deployments or custom application serializers. The existing isolation wrapper is a libc LD_PRELOAD guard, not kernel network isolation.
- Mechanical effects: ignored dist build outputs and synthetic test logs were regenerated. The existing ignored lockfile stayed byte-identical; no generated dependency files or evidence artifacts were committed. All work stayed local; no push.

