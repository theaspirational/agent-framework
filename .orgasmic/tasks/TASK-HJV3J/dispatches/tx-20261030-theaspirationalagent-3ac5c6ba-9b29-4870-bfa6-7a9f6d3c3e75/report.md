# Changed

Rebased all **12** original B commits from `66c9db3f..20610f0c` onto **`c848977fc2280b378576f0eb72c2b07a0a93b86f`**, fetched from the supplied local branch. No squash or dropped B commit; none of A's 21 commits was rewritten. Rebased B tip: `f7280f83`. Added six commits; final head: **`ce5e4e88970bedc9437d0033fbcbc72f295512b2`**. B's own range is **`c848977f..ce5e4e88`** (18 commits).

| Commit | Change |
| --- | --- |
| `8bcc3095` | bot M1: accept explicit undefined optional thread targets, without relaxing initialize data or invoking accessors. |
| `08ab556d` | bot M2: direct inference retains required admission but skips reply resolution; pushes still bind. |
| `c0b88e50` | bot M3: share stale diagnostics across busy and reply-deferred requests. |
| `64cbb8cd` | bot M4: document refusal of all unbound automatic replies on opted-in connections. |
| `059d6d25` | bot M5: assert all five publish-refusal reasons, before open/send. |
| `ce5e4e88` | Approved rebase interaction: carry existing admitted work through module-requested wakes; qualify held routing, dispatch release and refused coalescing. |

All 18 commits have author **and** committer Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>, and the exact `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Explicit paths were staged. No push, PR edit/comment, merge, other-repository write or main-checkout modification occurred. No dependency manifest, generated file or lockfile is committed. Installs/builds changed only ignored dependencies/output.

Read the complete bot review, supplied prior reports, project baseline and CONTRIBUTING.md. No applicable AGENTS.md or supplied convention/gotcha was present. The absent worktree design reference was resolved through the ask tool: use the published design at `db44514b12a4da64633fd705b790e1610e683ddd:docs/design/GENERIC-RECIPIENT-ROUTING.md`, without adding it to this branch. Additional ask approvals covered inference-only resolver exclusion, the narrow AST conflict resolution, diagnostic-only reuse of the existing stale mechanism, and module work carriage. None authorizes typing, recovery or a broader policy redesign.

## Conflicts and range-diff

Eight file-conflict occurrences across five replayed commits:

| Original commit | Conflicts and resolution |
| --- | --- |
| `47fb8e83` | channel-registry and push-handler imports: retain A's AdmissionRefusals and add B's admissionRoutingFields. Preserve A refusal helpers and envelope semantics. |
| `abb9c2e6` | framework import: retain A's cause-aware admissionConnectErrorOf. index exports: retain every A export and add B's types. server-connection: retain all held-drain/dispatch-window fields and methods; retain receipt-time admissionEpochs capture; move B's optional consumer argument to A's actual capture-at-dispatch site in emit(), not back to transport receipt. |
| `90699b64` | push-handler import: retain both A diagnostics and B binding helpers. |
| `96c161f5` | framework import: combine B ownership helpers with A's cause-aware startup check. |
| `2f068ac4` | Modify/delete inventory conflict: preserve A's removal of broad existing-module inventories. With explicit approval, replace B's replayed test with a zero-vocabulary AST check of its newly introduced runtime module only; no existing-module ceilings or duplicate admission check. |

All other commits replayed automatically. A's new cancellation checks, held inference dispatch callback and emit guard survived; clean application alone was not used as semantic evidence.

Full `git range-diff 66c9db3f..20610f0c c848977f..HEAD`: **range-diff.txt**. Summary:

| Old | Rebased | Result |
| --- | --- | --- |
| `47fb8e83` | `c02b6303` | conflict/import and A refusal-helper context |
| `abb9c2e6` | `eca4edad` | capture moves with A's dispatch boundary; merged imports/exports |
| `90699b64` | `7f764d7e` | diagnostics imports and cancellation context |
| `96c161f5` | `5646c5b9` | cause-aware import context |
| `96e08f1e` | `8b188cdd` | = |
| `1196d255` | `437a52b1` | = |
| `550a6209` | `236a5dbd` | = |
| `ea3c69bd` | `a78cf78d` | = |
| `95094c15` | `e8c981df` | = |
| `c8064f2e` | `0c8b7ba1` | = |
| `2f068ac4` | `5b0c1a65` | scoped replacement test; Git displays this pair as removal/addition |
| `20610f0c` | `f7280f83` | = |

The six additive commits follow that range. Evidence: rebase.log, rebase-range-diff.txt, range-diff.txt, changed-files.txt and commit-identities.txt.

## Semantic interactions

- **Held drain and routing:** original transport epoch remains captured at receipt; the admission key and optional routing consumer are captured at dispatch. Channel/push resolution stays inside the same admission deadline, cancellation signal and capacity slot. Held admission plus synchronous dispatch/storage remains sequential, including complete channel batches; new live items join an active drain. A's capacity waiters, bounded hold behavior, epoch checks, synchronous dispatch window and same-dispatch re-hold refusal are unchanged. A new real-stdio witness stalls the first resolver, adds live traffic, then observes first/second channel items → direct inference dispatch → push → live channel, with four distinct bound events and frozen targets.
- **Inference release:** a slow direct provider call does not retain the held-data drain. Its admission and synchronous provider dispatch release it; the full handler still owns cancellation and the eventual RPC reply. M2 removes only irrelevant reply authority: the final inference-router.ts is byte-identical to A. Live and held requests with null/throwing resolvers prove the resolver is never called; push publication proves it remains bound.
- **mayWake/module semantics:** A's mayWake:true continues to permit module-requested wakes despite a false gate; mayWake:false still caps them. This exposed B's omitted work carriage at applyProcessResponse. The separate interaction fix copies only authority already on the triggering event, never invents it. Both lanes × both mayWake values run through real stdio and the module pipeline; true wakes publish their bound thread, false wakes do not infer. An unrelated synthetic timer enters the real module pipeline with an explicitly scaffolded home destination; it remains unbound and publication is refused.
- **Coalescing:** required channel/push coalescing still refuses admission_unsupported before admission/resolution, storage or wake. New real-stdio cases assert zero resolver/model calls. EventGate debounce still retains distinct admitted causes; it is not authorization for the refused wire coalescing path.
- **toolHints and initialization:** A's absent required-profile toolHints/RFC-014 presence, once-at-connect override diagnostic, generic result tap, decoder and handshake refusal remain intact. B adds only validated initialize extension data and its local publish profile; reserved MCPL keys cannot be overridden. A's stopped-stdio check still precedes binding.
- **Exports/startup/diagnostics:** A public admission exports and cause-chain fatal-startup recognition remain. Existing A tests are unmodified. The optional post-verdict seam is still the first B commit and absent-consumer behavior is covered separately. M3 reuses the existing 30-second age threshold, 60-second per-agent shared trace/stderr throttle and quiesce suppression; it does not reset age, drop requests, reorder scheduling or change recovery.
- **Ownership and upstream adjacency:** shared model/awaited sleep dispatch, module-start shutdown ordering, fresh-turn continuation carriage, budget restart fallback, unknown-owner rejection, N1–N4 and O5's existing silent-resume boundary all remain in the routing suite. No typing, simultaneous-start, automatic resend, or #361 behavior was added.

# Verification Gates

Fresh qualification uses a clean checked-out revision, serially per matrix; no prior-run qualification receipts are reused. Both versions run installation, typecheck, clean build and full tests:

```sh
orgasmic dispatch gate <revision>-<version>-<phase> -- \
  env XDG_RUNTIME_DIR=/run/user/1002 \
  systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 \
  env PATH=<node-bin>:$PATH bash -c '<command>'
```

Node bins: `/opt/node/bin` (22.23.3) and `/tmp/credential-engines/node-v22.12.0-linux-x64/bin` (22.12.0). Commands: `npm install --ignore-scripts --no-save`; `npm run typecheck`; `npm run clean && npm run build`; `AF_TEST_CONCURRENCY=4 npm test`. Each log records the checked-out SHA and node version. Exact orchestration: run-matrix.sh. Owner/process records: base-owner.txt and head-owner.txt.

| Revision | Node | Install | Typecheck | Clean + build | Pass / fail / skip / total |
| --- | --- | --- | --- | --- | --- |
| Base `c848977f` | 22.23.3 | pass | pass | pass | 9,646 / 0 / 63 / 9,709 |
| Base `c848977f` | 22.12.0 | pass | pass | pass | 9,646 / 0 / 63 / 9,709 |
| Head `ce5e4e88` | 22.23.3 | pass | pass | pass | 9,745 / 0 / 63 / 9,808 |
| Head `ce5e4e88` | 22.12.0 | pass | pass | pass | 9,745 / 0 / 63 / 9,808 |

Logs: `{base,head}-{22233,22120}-{install,typecheck,build,test}.log`; each ends with its daemon receipt path. No final full-suite failure is waived.

Additional evidence:
- **head-focused:** 296 passed, zero failures/skips, at the clean final head on Node 22.23.3. Command: `node --import tsx --test --test-force-exit --test-concurrency=4 --test-timeout=90000 test/reply-routing*.test.ts test/mcpl-post-admission.test.ts test/mcpl-admission-*.test.ts test/mcpl-required-*.test.ts test/routing-runtime-has-no-connector-literals.test.ts`. Same memory scope. Includes all existing A admission cases unchanged, plus O5 and new interaction tests. Log: head-focused.log.
- **M1/M2/M3 and module interaction red/green:** final bounded tests over the rebased, unfixed production source produce **10 intended assertion failures, 3 passing controls**. The fixes pass these and the expanded interaction checks. Scripts/logs: red-replay.py, bot-red-final-replay.log, bot-red-final-tests.log, bot-green.log. M1 also crosses real stdio with explicit undefined threadId and no thread extension.
- **M4:** check-docs.py fails on the missing opt-in contract and passes after docs/changelog changes (bot-m4-doc-red.log, bot-m4-doc-green.log). It checks the explicit refusal code and heartbeat/home/timer/module/silent cases.
- **M5:** all five new assertions kill removal of their refusal branches, without syntax/import failures. The prior unit suite survives removing the specific ungranted check; the new test fails on the lost refusal reason. Contrary to part of the review, the prior lifecycle test already detects removal of thread-support enforcement. We still add explicit before-open refusal-code coverage for it. Evidence: refusal-mutations.py, bot-m5-mutations-corrected.log, m5-old-*.log and m5-new-*.log. No production publish policy changed for M5.
- **Static audit:** final-audit.py / final-audit.log verifies the exact clean head, 18 identities/trailers, ancestry, whitespace, unchanged A tests/inference implementation, absence of internal identifiers in commit messages/patches, and equality of development source/test overlays with final source/tests.

Development red/green/mutation checks ran in an ignored archive of the rebased B source while the exact A checkout was qualifying. They are diagnostic source-pinned evidence, not base/head qualification receipts despite the wrapper's checked-out-base header. The final matrix and head-focused checks run the actual committed head. No cache/build output is stored in evidence.

Preliminary development failures are retained, not counted as final failures: the first mixed red run included a too-slow held-drain negative witness and an incomplete home-channel scaffold; the final bounded replay isolates the intended failures. The first typecheck caught a readonly descriptor deletion, corrected using descriptor rest-copy before commits. The first mutation driver incorrectly expected old thread-support coverage to be absent; its failed expectation exposed the existing test, and the corrected driver records that fact.

## Upstream observations

First command: `git ls-remote upstream main` → **`c5306693e0684efefb0122cba740ca74f6b4fc92`** (`refs/heads/main`).
Final identical command: **`c5306693e0684efefb0122cba740ca74f6b4fc92` (`refs/heads/main`)**.
Evidence: upstream-start.txt and upstream-end.txt. Upstream was unchanged between the two observations.

# Unmet Criteria

None. Every requested base/head gate passed on both Node versions; the final worktree is clean. Publishing and PR operations were intentionally not performed.

# Residual Risk

- Qualification is local with neutral stdio/WebSocket peers and mock model responses, not live connector/provider deployment.
- The local publish-only experimental profile, optional thread field, host resolver/initialize-offer API and additive post-admission consumer seam still require maintainer agreement.
- A's sequential backlog throughput/hold bounds, concurrent provider calls after held inference dispatch, and possible completion reordering for independent live admissions are unchanged; no durable replay or cross-epoch reauthorization is promised.
- The AST check now covers only B's new runtime module, per the explicit conflict decision. Changes inside existing modules are covered behaviorally, not by restored whole-module literal/identifier ceilings.
- Some tests explicitly scaffold leaked logical/token state, a mixed continuation start, or an unrelated wake's home destination. These test the stated boundaries, not a new recovery contract.
- No typing ownership, context-only persistence, protocol standardization, host adapter, live migration or #361 dependency is included.

BEGIN BOT REPLY

- **M1:** Fixed in `8bcc3095`. Explicit `threadId: undefined` is treated as absent; accessor rejection and strict initialize data remain. Core repro and real-stdio threadless coverage pass.
- **M2:** Fixed in `08ab556d`. Live/held `inference/request` never calls the reply resolver, even if it would return null or throw. Required admission remains. Pushes can cause automatic replies, so they still resolve and bind; publication is tested.
- **M3:** Fixed in `c0b88e50`. Reply-deferred waits share the existing stale-age/throttle/quiesce behavior, with an explicit qualifier and pending-batch count. Tests cover leaked idle turns, mixed continuations and unchanged ordinary busy diagnostics.
- **M4:** Fixed in `64cbb8cd`. Docs/changelog now state that opted-in connections refuse all unbound automatic replies, including heartbeat/home-channel prose, timers, unrelated module wakes and unbound silent resumes.
- **M5:** Addressed in `059d6d25`: explicit assertions for all five refusal reasons before open/send. Mutation checks confirm coverage. The old suite already caught removal of thread-support enforcement; the missing ungranted-reason coverage is now covered.

Rebased onto #906 at `c848977f`, preserving all 12 B commits. Separate integration fix `ce5e4e88` preserves admitted work for module wakes under A's corrected mayWake semantics. On Node 22.23.3 and 22.12.0, install/typecheck/clean build/full tests pass: head 9,745 passed, 0 failed, 63 skipped; base 9,646 passed, 0 failed, 63 skipped.

END BOT REPLY

BEGIN PR BODY

## Problem

Required inbound admission carries private reply intent, but intent alone does not bind automatic output. Queues, continuations and channel activity must not redirect replies or consume another admitted cause.

## Changes

- Opt-in host `replyRouting` resolves channel/push reply intent after complete admission validation, within the same deadline/cancellation/capacity boundary. Direct inference RPC answers retain admission but need no reply destination.
- Freeze connection-qualified destinations and private work identity. In-turn continuations retain their logical owner; post-turn continuations and rewind retries open a fresh turn with the same admitted destination. Reject unknown/ended owners and defer unrelated wakes.
- Enforce frozen targets before automatic open/send, including sleep announcements. Explicit sends retain their chosen targets.
- **Opted-in connections refuse all unbound automatic replies** with `automatic_reply_binding_missing`, including heartbeat/home-channel prose, timers, unrelated module wakes and unbound silent-start resumes. There is no latest-channel fallback. Check those dependencies before enabling the profile.
- Add an explicitly local, publish-only `experimental.replyRouting` v1 profile for opaque nested threads and data-only initialize offers. Threadless destinations need no extension; explicit `threadId: undefined` is accepted as absent.
- Preserve #906's sequential held drain, dispatch-time admission and inference release at provider dispatch. A separate rebase-interaction fix carries existing admitted work through module wakes when mayWake:true permits them despite gate declines; false remains a ceiling and unrelated events acquire no binding. Required coalescing remains refused.
- Preserve stale diagnostics for reply-deferred work using the existing age threshold, shared throttle and quiesce suppression.
- Keep the admission verdict API unchanged. The first B commit isolates the additive post-verdict seam in inbound-admission.ts and private carriage at channel/push admission sites.
- Preserve #906's removal of broad AST inventories: B's zero-connector-vocabulary check covers its new runtime module only; existing modules are covered by behavioral tests.

## Tests

| Revision | Node | Pass / fail / skip / total |
| --- | --- | --- |
| Base `c848977f` | 22.23.3 | 9,646 / 0 / 63 / 9,709 |
| Base `c848977f` | 22.12.0 | 9,646 / 0 / 63 / 9,709 |
| Head `ce5e4e88` | 22.23.3 | 9,745 / 0 / 63 / 9,808 |
| Head `ce5e4e88` | 22.12.0 | 9,745 / 0 / 63 / 9,808 |

Fresh installs, typecheck, clean builds and full suites run on both Node versions in 16 GiB memory scopes, with test concurrency 4. The final focused routing/admission suite passes **296/296** on Node 22.23.3.

Red-before/green-after tests cover optional threads, inference resolver exclusion, stale reply deferral and module work carriage. Five publish-refusal mutation checks verify the new reason assertions; the prior thread-support lifecycle check remains. Real-stdio tests cover held channel batches, live traffic joining a resolver-stalled drain, slow direct inference releasing later routed storage, both-lane mayWake/module behavior, refused coalescing and unbound module publication. Existing ownership, N1–N4 and focused silent-resume regressions remain.

All 12 prior B commits were rebased without squashing; six additive fix/test/docs commits follow. The range-diff records import/export conflicts, moving the consumer to A's dispatch-time capture site, and the explicitly narrowed AST check.

## Maintainer questions

- Accept optional publish thread targets and the local versioned profile, or require registered thread-channels?
- Confirm the host resolver/initialize-offer API and additive post-admission consumer seam.
- Confirm the focused existing silent-resume regression without adding recovery or simultaneous-start guarantees.

## Not verified / Out of scope

No live connector/provider deployment, protocol standardization, typing ownership, context-only persistence, host adapters, automatic replay or cross-epoch recovery. Existing silent-resume behavior is tested, not redesigned.

## Companion PRs

Stacked on **#906 at `c848977fc2280b378576f0eb72c2b07a0a93b86f`**; review and merge #906 first. **This PR's own range is `c848977f..ce5e4e88` (18 commits)**, excluding A's 21 commits. No dependency on #233 or #361; no SPEC or adapter companion is included.

AI-assisted implementation and testing; all commits include the GPT-6-Astra co-author trailer.

END PR BODY
