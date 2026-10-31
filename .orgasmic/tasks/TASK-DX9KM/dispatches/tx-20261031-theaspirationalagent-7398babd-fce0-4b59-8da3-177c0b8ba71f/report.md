# TASK-DX9KM round 4 — local, code-only, UNQUALIFIED

## Changed

**Final commit:** `f8af03a852c85daf9bb8079937b994fe5419ca20` on `unqualified-local-abdi7-20261031`.
Single parent: `9184d91e796ccd201831d9456a8662d9abd47d28`. Additive commit, neutral message, no trailer. Author **and** committer: Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>. No merge, amend, reset, force, ref deletion or push this round.

Before cites below mean **9184d91e**; after cites mean **f8af03a8**. Numbered snapshots: `round4-before-lines.txt` and `round4-after-lines.txt`; exact patch: `round4-full.diff`. The working snapshot saved immediately before staging is the committed content.

| File | Insertions | Deletions | Kind |
| --- | ---: | ---: | --- |
| src/mcpl/reply-admission.ts | 16 | 4 | production |
| src/mcpl/inbound-delivery.ts | 7 | 2 | production comments only |
| test/context-only-reply-admission.test.ts | 81 | 18 | test source only |
| docs/context-only-delivery.md | 64 | 0 | documentation |
| **Total** | **168** | **24** | **4 files** |

Production split: **+23/−6**; tests **+81/−18**; docs **+64/−0**. No dependency, lockfile, generated file, declaration output or package change.

### Items 1–6: exact bounded changes

| Item | Before → after cites | Change / static reasoning |
| --- | --- | --- |
| 1 — throttle | reply-admission.ts:1–9,34–41 → :1–20,43–53; new test :404–449 | Reuse `RefusalLines`, with a weak per-connection holder and one fixed key. Only reporting is throttled; entry capture, A await, original prerequisites and suppression expression remain unchanged. |
| 2 — diagnostic predicate | reply-admission.ts:37–39 → :46–50; test :352–386 → :359–402 | Compare the mode of the already-trusted captured carrier and restriction-only argument, not constant identity. `truth.forwarded-copy.loss-diagnostic` expects no diagnostic for a distinct frozen constant with the same mode. This does NOT recover another ALS instance's missing context. |
| 3 — probe surface | inbound-delivery.ts:12–20 → :12–25; docs new :101–118 | Retain the existing exported read probe; document intent and real reachability, not fictitious hiding. No new bridge/observer API or public export. |
| 4 — positive / negative test evidence | test :95–153 → :95–160 | Both scoped/unscoped positives now assert accepted result, stored item and classification before zero resolve/authorize/routing. The scoped replaced-admit identity case is explicitly negative `admission_missing`, with no accepted envelope and no A entry. Binding/routing assertions on an actual envelope are named unscoped-positive only. |
| 5 — console mock | test :352–356 → :359–368 | Bound original receives unrelated lines. `t.mock.method` provides test-context restoration, including assertion failures. The same filtering convention also captures throttled summary lines at :38–42 and :409–412. |
| 6 — omission boundary | inbound-delivery.ts:12,17 → :12–22; reply-admission.ts:40 → :51–52; docs before :53–56 → new :56–118 | Supported-chain reasoning is explicitly separate from five unsupported deferral counterexamples. No universal omission or runtime claim. The deliberately inverted S4 scaffold remains unchanged (test before :390–416 → after :451–479, inversion comment :468). |

### Throttle state bound and content

`reply-admission.ts:10–17` holds `WeakMap<object, RefusalLines>`, keyed by the same live connection passed by `server-connection.ts:1192`. Per-item recursion preserves that object (`reply-admission.ts:67–68`). Exactly **one fixed record** is used per live holder: `admit('', 'context-only-plan-loss')`; no item/channel/mode/callback value is used as a key. The existing holder's general cap is 1,000 records (`refusal-lines.ts:27–58`), but this use has only one possible key. The weak map does not strongly retain connection keys. Total holders scale with live connection owners, not message count; direct helper callers that omit the diagnostic owner use the existing default admission key, not a claimed global connection identifier.

The first occurrence is eligible to print, later occurrences within 60,000 monotonic ms are counted, and a later occurrence after that interval prints the fixed base text plus the numeric held count. No timer or per-message collection is added. The numeric counter is the existing holder's fixed-size number field, not a new unbounded collection. No untrusted mode, payload, item, callback, credential or destination is echoed. Admission and suppression run on every item regardless of whether a line is held.

### Binding truth table (required design; NOT executed)

Echoed in progress before the commit, unchanged from round 3:

| Row | Required/source-designed behaviour | Source witnesses |
| --- | --- | --- |
| (i) Trusted CONTEXT_ONLY | Always suppress preparation: zero resolve, zero authorize, no routing fields; A/storage still run. | reply-admission.ts:43–53; test :95–122,359–402. |
| (ii) Trusted NORMAL, or legacy normal with no context-only decision | Preserve original store/mayWake/current-admission prerequisites and normal preparation/binding behaviour. | reply-admission.ts:45,53–61; test :162–185,213–230; truth.normal / truth.legacy. |
| (iii) Internal context-only dispatch loses/mismatches its optional argument | In the supported chain retain the private restriction independently, suppress, never default to legacy-normal; diagnose the first loss. Scoped identity violations can refuse earlier as admission_missing. | channel-registry.ts:1983; reply-admission.ts:43–53; test :124–160; truth.missing / truth.mismatched. |
| (iv) Push/event and inference/request | No channel carrier applied/consumed; push retains normal preparation, inference retains its direct answer without an automatic reply consumer. | reply-admission.ts:43; server-connection.ts:1191–1192; test :232–269. |

### Supported A, unsupported B, and loading modes

**A: supported in-tree chain.** `channel-registry.ts:1965–1968` validates D's decision before creating a scope. Its sole production `withAppliedDelivery` call remains at :1983, around the same A call, inside the per-item loop. Issued ingress and the outer reply consumer are entered inside that scope; the immutable capture at `reply-admission.ts:43` occurs before the A await at :44. Neither a raw selector nor a caller's claim grants permission. This round does not change the carrier mechanism, dispatch order or suppression expression.

**B: five separate unsupported boundaries.** Outside queue/drainer; emit outside scope; pre-attached continuation/user thenable outside scope; pre-existing timer; Worker/MessagePort. These are NOT the supported in-tree chain. An earlier-registered listener synchronously emitted inside run is not the outside-emit counterexample; an inside-run-created timer is not a pre-existing timer. If a wrapper crosses such a boundary **and** drops the argument, both restrictions can be absent and preparation can fall back to legacy normal. Nothing in this round fixes or qualifies those shapes. Docs :85–99 list all five separately. No reordering was introduced to manufacture omission coverage.

**Loading:** supported package modes are Node `import` → `dist/src/index.js` and Bun → `src/index.ts` (`package.json:12–22`), using one module instance. Mixed src/dist or duplicated installs are unsupported. Distinct **constant identities** can match structurally by mode; the new test copies the constant only. Distinct **ALS stores** do not share context: another module's getter can be undefined and mode comparison cannot repair it. In that unsupported configuration protection degrades to argument-only, still closed if the argument is forwarded; losing both can fail open. No `globalThis`, `Symbol.for` or cross-module registry was added. Node/Bun loading/propagation execution remains UNKNOWN.

### Unchanged invariants, freshly inspected against current source

The protected-modules gate below compares the original 15 paths byte-for-byte with 9184d91e. Channel-registry and RefusalLines were also explicitly compared with `diff --exit-code` (0); their source is unchanged. Inbound-delivery executable bodies are identical; only comments changed.

| Invariant | Before / after preservation cites (same lines except where noted) |
| --- | --- |
| Issued per-item context, no provenance refresh/borrowing | channel-registry.ts:1892–1895; registration-ingress.ts:13–71 unchanged. reply-admission.ts before :55–56 → after :67–68 preserves the exact recursive owner/issued composition. |
| A read/storage verdict and stale refusal | channel-registry.ts:1975–1991; inbound-admission.ts:122–161; registration-view.ts:135–157 unchanged. reply-admission.ts before :34–36 → after :43–45: capture first, A await, store/mayWake/current checks. |
| admission_missing, frozen epochs, grants and invalidation | registration-ingress.ts:23–26,53–71; server-connection.ts:495–496,1172–1192; inbound-admission.ts:115–141 unchanged. No connection key, registration ref or epoch is minted/refreshed by this change. |
| D pre/post validation, classification, storage/wake/locus | channel-registry.ts:1965–1968,1989–1991,2046–2047,2083,2123–2124,2177–2181 unchanged. inbound-delivery.ts before :22–57 → after :27–62 retains symbol operations and validator. framework.ts:17346–17351,17764–17770,17881–17902 and stored-injections.ts:37–98 unchanged. |
| Suppression, receipts and B routing/private+notice | reply-admission.ts before :41 → after :53 is the **identical expression**; before :42–52 → after :54–64 retains consume, receipt, catch and private binding. reply-routing.ts:106–149 unchanged, including literal authorize===true at :137. |
| Push/inference normal lanes and profile-off | push-handler.ts:153–202, inference-router.ts:222–313, server-connection.ts:1191–1192 unchanged. Normal/legacy plans cannot satisfy the new diagnostic predicate and still pass the original preparation expression. No profile/grant/storage changes. Profile-off byte identity is NOT measured. |

### Test-source inventory and mutant matrix update

Full assertion inventory: `round4-assertion-inventory.txt`. These are **written assertions, not passed checks**.

- Positive both configs :95–122: `a.accepted-context-only`, `a.accepted-context-stored-once-before-zero-counts`, `a.stored-context-only-classification-before-zero-counts` precede `a.context-only-zero-resolve-despite-A-mayWake-true`, its authorize counterpart, and `a.no-routing-field-on-context-envelope` / `a.no-reply-binding-on-context-envelope`. Live pending field is read at acceptance and after storage. No reply, turn or locus/open change assertions remain.
- Explicit wrapper :124–160: scoped negative `drop.scoped-negative-no-accepted-envelope` and `drop.scoped-negative-A-not-entered`; unscoped positive `drop.unscoped-positive-has-an-accepted-envelope`, `drop.unscoped-positive-stored-and-classified-before-zero-counts`, `drop.unscoped-accepted-envelope-no-reply-bindings` / `...no-routing-field`. Zero callback assertions still genuinely apply to both configs.
- Truth rows :359–402, both configs: context-only, **forwarded-copy**, missing, mismatched, normal, legacy. Each asserts `truth.<row>.A-still-runs`, `.A-verdict-unchanged`, `.resolve-count`, `.authorize-count`, `.routing-presence`, `.no-routing-fields` for restricted rows and `.loss-diagnostic`. Copy distinctness is asserted at :387; it does not simulate another ALS store.
- New throttle :404–449: `throttle.first-loss-prints-fixed-line`; `throttle.repeated-items-and-new-epoch-share-one-line-before-minute`; `throttle.minute-boundary-prints-only-fixed-text-and-held-count` (22 held); independent connection assertions; `throttle.A-read-count-not-throttled` (25); per-item original store/mayWake/no-routing; zero callbacks even when logs are held. Clock mock follows the existing RefusalLines source pattern; it has not executed.
- Retained source groups: mixed batch :162–185; barrier stale/negative/narrow-grant :187–211; normal gate-false :213–230; push/inference :232–269; concurrent interleaved waits :270–302; nested both directions/configs :304–330; restoration after throw/await/rejection :332–357; deliberately inverted S4 scaffold :451–479. The header still discloses admission I/O and state mutation; no callback I/O was executed this round.

| Mutant / seam | Static expected effect and detecting assertions (NOT run) |
| --- | --- |
| S1 — drop fourth argument at channel-registry:1983, retaining run | Suppression survives via entry carrier. First loss diagnostic kills healthy `a.applied-plan-forwarded-without-loss-S1-S2-S5` in both configs. Each fixture owns a fresh connection, so throttling does not hide that first line. Zero-callback assertions alone intentionally do not kill this fail-closed omission. |
| S2 — lose consumer argument, reply-admission now :42 | Same fail-closed carrier and first-diagnostic kill. Literal removal with undeclared use could be a type error; no compile claim. |
| S3 — drop inward forwarding, now :44 | Unobservable in production order: outer consumer already captured its restriction/argument; terminal A ignores the plan. No runtime kill claimed. |
| S4 — registration-view parameter/forwarding :140/:146 | Unobservable on production path. Only deliberately inverted scaffold :468–478 makes forwarding load-bearing: `d.context-only-baseline-resolve-count-ignores-raw-selector`, authorize/binding counterparts and `d.applied-context-only-no-routing-fields`. No reorder made. |
| S5 — explicit three-argument compositor re-wrapper | Scoped healthy positive fails `a.accepted-context-only` if replaced identity produces admission_missing. Unscoped remains suppressed but fails the healthy no-loss diagnostic assertion. The explicitly labelled negative witness is not counted as accepted scoped evidence. |
| Remove throttle / allocate holder per item or epoch | `throttle.repeated-items-and-new-epoch-share-one-line-before-minute` fails. Per-connection sharing bugs fail independent-first-line assertions; window/count mistakes fail minute-boundary assertion. |
| Restore constant-identity diagnostic | `truth.forwarded-copy.loss-diagnostic` fails in both configs although suppression remains correct. This says nothing about duplicated stores. |
| Remove suppression, or substitute wake/gate-false proxy | Positive (a) zero callback/routing assertions and mixed/normal `b.normal-exactly-one-resolve-despite-server-gate-false-context-zero` / authorize / normal gate controls remain the source kills. No mutant executed. |

### Exact type-surface delta

**No export or declaration signature was added, removed or changed.** Only private `reportPlanLoss(connection: object): void` and private holder state are new. No root `export type { DeliveryPlan }` was added; legacy 3-argument admission remains valid.

| Reachable declaration | Before → after | Signature delta |
| --- | --- | --- |
| PostAdmissionConsumer | reply-admission.ts:6–7 → :7–8 | none |
| admissionRoutingFields | :9 → :18 | `(verdict: AdmissionVerdict): { routing?: unknown }` unchanged |
| withReplyConsumer | :30 → :39 | `(admission: RequiredIngress, consume: PostAdmissionConsumer | undefined, transportSignal: AbortSignal, diagnosticConnection: object = admission.key): RequiredIngress` unchanged |
| Returned admit / RequiredIngress.admit | reply-admission.ts:33 → :42; inbound-admission.ts:98 unchanged | fourth `delivery?: DeliveryPlan` remains optional; lane/item/signal/Promise<AdmissionVerdict> unchanged |
| DeliveryPlan / CONTEXT_ONLY | inbound-delivery.ts:7–8 → :7–8 | unchanged union / frozen constant |
| withAppliedDelivery<T> | :13 → :14 | `(plan: DeliveryPlan | undefined, dispatch: () => T): T` unchanged |
| appliedDispatchDelivery | :18 → :23 | `(): DeliveryPlan | undefined` unchanged; JSDoc now explicitly honest |
| deliveryOf / attachDelivery / carryDelivery / withoutDeliveryPlan / hasDeliverySelector / DeliveryRefusal / validateDelivery | :22,26,31,35,40,44,47–57 → :27,31,36,40,45,49,52–62 | all exact parameter/return/body forms unchanged |
| Public structural paths | RequiredIngress:92–99; admissionFor server-connection:495; handleIncoming channel-registry:1879–1884; handleRequiredPushEvent push-handler:163; handleInferenceRequest inference-router:222–229; registration helpers registration-view:135,140,161 | all byte-identical before/after; none newly mandatory |

**Probe-retention limitation:** removing the read while retaining reply-admission's independent module and the existing source tests' direct restoration/isolation observations requires a new cross-module bridge or moving carrier/consumer/observers. That is not a non-widening local deletion. I retained the existing getter for this bounded round rather than add another reachable helper/observer API or broadly reorganize modules. It is shipped/reachable through node10/exports-ignoring resolution, filesystem paths, or createRequire with a resolved path, despite no supported deep export. `@internal` is documentation, not hiding or access control. Emit and consumer checking stay UNKNOWN.

## Verification Gates

### Machinery preflight, snapshot transition and chronology

Full timestamped Git command chronology: `round4-command-chronology.txt`. Sanitised preflight: `round4-machinery-audit.txt`; verified input hashes: `round4-input-hashes.txt`.

- **09:36:39 UTC**, before any other Git command this round: safety-prefixed `config --show-origin --name-only --get-regexp` for core.hooksPath, commit.gpgsign/gpg.*, merge drivers, diff command/textconv/external, filters, fsmonitor and attributesFile. Only three command-line safety guard keys were present. No source-file configured machinery, signing/driver/filter/key values or credentials were printed or accessed. Config-key presence/origin only; no executable configuration found.
- Common hooks: `/home/orgasmic/src/agent-framework/.git/hooks`, sample files only; worktree hooks absent; guarded hooksPath is the non-executable `/dev/null`. No non-sample executable hook. Ancestor/worktree .gitattributes and common/worktree info/attributes absent; standard global/system attribute candidates absent. External diff environment absent. `check-attr -a` for the four changed files and RefusalLines returned empty. **09:37:06**, audit complete. No hook/driver/filter/textconv/fsmonitor ran.
- **09:36:39**, both required documents read and hashes matched: REVIEW2 `0ec564aea51569d222d5258014ab641c2e112e4206ecae0a723f83245c2ccbc2`; prior R3 report `6d8230de55f8755f36ac18b6321b79c8759e35649edafcd8cc5a182fe2dd93b8`.
- **09:37:06**, the required named branch resolved to 9184d91e. The dispatch/operator identified the initial checkout as task-dx9km-impl at I7, not the required base. I performed a normal `switch unqualified-local-abdi7-20261031`, then created recovery/abdi7-r3-9184d91e, then captured HEAD/branch/clean short status. No edit/recovery/commit was made against I7, and task-dx9km-impl was not moved (still I7, freshly checked). The first progress note stated the resulting full HEAD and branch.
- **09:38:07**, Tarn's explicit snapshot-order correction arrived **after** the switch and recovery creation. **Disclosed deviation, not compliance:** I had not stopped to ask about the I7 checkout; pre-switch porcelain was not captured; recovery was created before the correction's newly enumerated checks. I paused before any code edit and asked `ask-0feffeb38d1640b2bb9d62b949e10d0e`.
- **09:38:54**, after-the-fact checks captured full HEAD 9184d91e, branch, exact worktree root, empty porcelain, ancestor exit0 for 54ebfc58 and 0bba1e8b, HEAD^ = 54ebfc58 and the correct recovery target. Raw output: `round4-snapshot-verification.txt`, also appended to chronology. These are not retroactive proof of pre-switch porcelain.
- **09:39:32**, Tarn answered **YES**, retain the correct recovery and proceed from the verified clean base; explicitly required disclosure of the deviation. Stdout was retrieved at approximately **09:42**, before code edits. Answer: `round4-snapshot-answer.txt`.
- After answer retrieval: narrow production/comment/test/doc edits; source-only inspection logged **09:45:38**, then **09:47:02–09:48:01**. Truth table echoed in progress before committing. Exact patch/stat/snapshots saved outside the worktree.
- **09:48:13**, explicit four-path staging, cached whitespace check, additive commit with both required identities and no trailer; then metadata, branch and empty porcelain checks.
- **09:48:32–09:48:33**, all eight fresh final-head Git gates below exited0. **09:48:38**, recovery targets/original merge parents/unchanged task branch and unchanged producer/RefusalLines verified.

All Git commands issued by this worker this round, from the first config audit onward, used `-c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false`; diffs used `--no-ext-diff --no-textconv`; commit used `--no-verify --no-gpg-sign` as explicitly mandated. No repo/global config changed. This is this round's chronology, not a new audit of historical pre-08:10 commands from earlier rounds.

### Fresh final-head source-only gates

Every gate ran via `orgasmic dispatch gate NAME -- G COMMAND`, where **G** is the exact three-override Git prefix above. All receipts bind **f8af03a852c85daf9bb8079937b994fe5419ca20**, `clean=yes`, **exit0**. Logs are relative to this report's evidence directory. `round4-gate-results.txt` captures stdout; per-gate logs carry final outcome lines.

| Gate | Command after G | Log |
| --- | --- | --- |
| round4-whitespace | diff --no-ext-diff --no-textconv --check 9184d91e796ccd201831d9456a8662d9abd47d28 HEAD | gate-round4-whitespace-01M68NRQGHTVXZ24ZNNWBAS1YD.log |
| round4-protected-modules | diff --no-ext-diff --no-textconv --exit-code 9184d91e796ccd201831d9456a8662d9abd47d28 HEAD -- [15 paths below] | gate-round4-protected-modules-01M68NRQNJ4GV1R3K043G7609R.log |
| round4-base-reachable | merge-base --is-ancestor 9184d91e796ccd201831d9456a8662d9abd47d28 HEAD | gate-round4-base-reachable-01M68NRQTM494DFCR61JEXVK8D.log |
| round4-low1-base-reachable | merge-base --is-ancestor 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27 HEAD | gate-round4-low1-base-reachable-01M68NRQZKTN9TT9QZ3CZK1S5R.log |
| round4-original-merge-reachable | merge-base --is-ancestor 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f HEAD | gate-round4-original-merge-reachable-01M68NRR5GMQ7KHNHWC0XYN2EH.log |
| round4-i7-reachable | merge-base --is-ancestor a0970645d403a7a76449221fc36f240a7aa2464b HEAD | gate-round4-i7-reachable-01M68NRRAN0HQ4SGYGX7C4YGPR.log |
| round4-d-reachable | merge-base --is-ancestor 93427f90a16bcfbcf815217f4c080669ab842a71 HEAD | gate-round4-d-reachable-01M68NRRFQWVBN9Z93QZ6T3PB8.log |
| round4-clean-tracked-tree | diff --no-ext-diff --no-textconv --exit-code HEAD | gate-round4-clean-tracked-tree-01M68NRRN6MR7PPCXDKPDAR3GP.log |

Protected list is exactly round 3's list, unchanged: `src/mcpl/registration-ingress.ts src/mcpl/inbound-admission.ts src/mcpl/registration-view.ts src/mcpl/server-connection.ts src/mcpl/reply-routing.ts src/mcpl/push-handler.ts src/mcpl/inference-router.ts src/stored-injections.ts src/framework.ts src/admission/admit.ts src/mcpl/capability-grant.ts src/index.ts src/mcpl/index.ts package.json tsconfig.json`. None was edited. The previously excluded inbound-delivery.ts remains intentionally non-byte-identical (this round comments only: bounded omission/loading/probe limits). Reply-admission.ts intentionally changes logging state/predicate only; its exact suppression body is reviewed separately, not concealed by an equality gate.

Recovery refs freshly read (`round4-recovery-refs.txt`):
- recovery/abdi7-r3-9184d91e → 9184d91e796ccd201831d9456a8662d9abd47d28 (**new this round**).
- recovery/abdi7-low1-54ebfc58 → 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27.
- recovery/abdi7-merge-0bba1e8b → 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f.
- recovery/abdi7-i7-a0970645 → a0970645d403a7a76449221fc36f240a7aa2464b.
- recovery/abdi7-d-93427f90 → 93427f90a16bcfbcf815217f4c080669ab842a71.
- Other existing recovery/context-only-before-refresh also remains untouched.

Original merge still has exactly I7 then D as its two parents. No earlier evidence or commit was rewritten.

### Inherited evidence

The checksum-verified REVIEW2 and R3 report remain context about immutable 9184d91e, its source-order analysis and limitations. Their inputs and earlier history remain unchanged, but their gate receipts are **not reused as a pass** at the new head. Current source and the bounded patch were read directly; protected modules and required ancestors were freshly checked. Earlier baseline/project instruction reads and supplied absence of conventions/gotchas remain unchanged context, not fresh behavioral proof.

## Unmet Criteria

No remaining code-only change or required source gate identified as unmet. LOW-2 uses the brief's permitted retention option, with its real export limitation recorded rather than claiming removal. Snapshot-sequence compliance was **not achieved**; the exact deviation is disclosed above and Tarn explicitly authorized proceeding after the fact. Pre-switch porcelain cannot be reconstructed or claimed verified.

**No build/test run.** No npm, bun, node, tsc, build, typecheck, test, mutant execution, install, package execution, network, publication or lifecycle run. The fixture I/O, model calls, mutation, clock mocks, throws and awaits appear only in written test source; none was executed. Only source/file inspection, editing, Git operations and required dispatch CLI controls ran.

## Residual Risk — explicit UNKNOWN list

- **Node ALS runtime semantics UNKNOWN**: propagation, entry capture under real scheduling, concurrent isolation, nesting/restoration, throw/await/rejection behavior. No runtime semantics claimed.
- **Bun ALS runtime semantics UNKNOWN**, separately; no inference from unrelated existing ALS uses.
- **Compilation, declaration emit and consumer checking UNKNOWN**, including test-source type correctness and actual installed declaration reachability.
- **Test outcomes and mutant kills UNKNOWN**: all named assertions/mutants above are source specifications/static reasoning, not results.
- **Throttle execution/cost/clock mocking UNKNOWN**: the bound is a source-state analysis; no stderr rate, elapsed time, allocation/GC or held-count runtime measurement. Console mock forwarding/restoration is written, not exercised.
- **Normal behavior/profile-off byte identity UNKNOWN as measured outputs**: original predicates and protected source remain unchanged; no comparison of runtime transcripts occurred.
- **Dual install / mixed src-dist occurrence UNKNOWN**. Such loading is unsupported; constants and stores have explicitly different failure modes. Probe remains shipped/reachable at unsupported paths; @internal hides nothing.
- **Outside-scope deferrals UNKNOWN/unqualified** and not repaired: all five B shapes remain outside A's source guarantee. Loss of both carrier and argument can fail open; no universal omission claim.
- **Future wrapper scheduling/consumer callback behavior UNKNOWN**. Source checks do not enforce all future deferral changes. S3/S4 are production-order unobservable; the sole S4 kill remains deliberately inverted.
- **D release hold and #931/B holds remain. LOCAL ONLY / UNQUALIFIED.** No I6 clearance, production barrier lift, owner decision, privacy qualification, deployment or publication.
