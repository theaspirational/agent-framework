# Context-only reply preparation fix — LOCAL ONLY / UNQUALIFIED

## Changed

Implemented REVIEW1 LOW-1 as an additive fix on `unqualified-local-abdi7-20261031`. No owner decision, release qualification, publication, or production enablement is implied.

### Commits and recovery

| Commit | Parent | Change |
| --- | --- | --- |
| `b05df8427ce6a728e97db5ab462a255d91e489a8` | `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f` | Restrict reply preparation using the validated host plan; add synthetic test source. |
| **`54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27` (final HEAD)** | `b05df8427ce6a728e97db5ab462a255d91e489a8` | Explicitly preserve the `'skip'` literal type inside the conditional test-fixture configuration. No amend/rewrite. |

Both new commits have author `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, neutral messages, and **no Co-Authored-By trailer**. `round2-final-commit.txt` records exact metadata and refs.

| Recovery ref | Exact target |
| --- | --- |
| `refs/heads/recovery/abdi7-merge-0bba1e8b` (new) | `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f` |
| `refs/heads/recovery/abdi7-i7-a0970645` (unchanged) | `a0970645d403a7a76449221fc36f240a7aa2464b` |
| `refs/heads/recovery/abdi7-d-93427f90` (unchanged) | `93427f90a16bcfbcf815217f4c080669ab842a71` |

The original merge remains unchanged, with exactly its original parents, I7 then D. Fresh final-head ancestry gates confirm that **0bba1e8b, I7, and D are all reachable**. No amend, rebase, force, reset, deletion, merge, push, main update, or other-branch mutation. The requested merge recovery branch was the only new ref.

### Exact diff summary and line citations

**M-before** = `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f`; **M-after** = `54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27`. Numbered snapshots: `round2-trees/{M-before,M-after}/<file>`. Full diff: `round2-change.diff`; stat: `round2-diff-summary.txt`.

**5 files, 207 insertions, 7 deletions**: four production files total **9 additions / 7 deletions**, plus **198 lines of new, unexecuted test source**. No generated files, dependencies, lockfiles, or docs in the worktree changed.

| File | M-before → M-after | Exact purpose |
| --- | --- | --- |
| `src/mcpl/channel-registry.ts` | 1983 → 1983 | Pass existing validated `plan` as the fourth internal `admit` argument, without moving the call or changing surrounding checks. |
| `src/mcpl/inbound-admission.ts` | 92–98 → 92–99 | Document/type an optional host-applied `DeliveryPlan` argument on internal `RequiredIngress.admit`. Actual A input, binding, verdict validation and public `InboundAdmissionConfig` are unchanged. |
| `src/mcpl/registration-view.ts` | 135–148 → 135–148 | Accept/forward that same optional plan through the registration wrapper; capture/check order is unchanged. |
| `src/mcpl/reply-admission.ts` | 29–49 → 29–50 | Accept/forward plan, then add only `delivery?.conversational !== false` to the existing post-A preparation condition. It is the last conjunct, so the original `admission.check()` remains in its original order. |
| `test/context-only-reply-admission.test.ts` | absent (new file) → 1–198 | Synthetic fixture/counter stubs and cases (a)–(d), both mixed orders, post-hook grant narrowing, and absent/conversational/context-only argument-seam controls. |

### Why this reads the trusted applied plan only

1. The producer is the existing host channel path: `channel-registry.ts:1965–1968` first calls D's `validateDelivery` using the current grant and storage profile, rejects failures, then selects the frozen `CONTEXT_ONLY` constant (or leaves the plan absent).
2. The **same plan variable** is passed at `:1983`, still used for wake/open effects at `:2046–2047,2083`, attached privately to the accepted event at `:2123–2124`, and echoed only on acceptance at `:2177–2181`. It is not recomputed from metadata or a later wire hint for B.
3. `reply-admission.ts:32–35` reads only its separate host-plan argument. It never reads `item.delivery`, tags, metadata stamps, server wake filters, local gate decisions, or eventual wake/turn state to decide this new restriction. Frozen plans and their private-symbol attachment remain unchanged in `inbound-delivery.ts:5–20`.
4. A always completes first (`reply-admission.ts:33`). The existing store/mayWake/current-admission prerequisites remain. Context-only adds a restriction on **preparation alone**: no detach/consumer call, no resolver/authorizer call, and no successful or private fallback routing receipt is created for that verdict. The unchanged envelope builder then has no routing fields to copy. Real A snapshots a fresh verdict per call (`inbound-admission.ts:147–160`), so another item's receipt cannot be reused.
5. The optional internal argument is restriction-only plumbing for the condition explicitly authorized by the brief; no new authority, grant, wire field, issuance point, or A policy contract. `RequiredIngress` is not re-exported from the package root (`src/index.ts:221–223`, unchanged). Absent plans and conversational plans satisfy the new conjunct and retain the old preparation path, including its failure/private-notice behavior.

### Unchanged checks and ordering (current source)

Unless stated otherwise, these locations have identical line numbers in M-before and M-after. The protected-modules gate below rechecks whole-file equality for the unchanged modules; the four edited files were reviewed in the exact narrow diff.

| Check / invariant | Cites and preservation |
| --- | --- |
| Per-item issued context | `channel-registry.ts:1892–1895`: one `registrationAdmissionForItem(batchAdmission)` per loop, unchanged. `registration-ingress.ts:13–71`: original key/check/admit authentication, ancestor composition, protected-key registry, and per-use revalidation unchanged. No new capture/refresh/borrowing. |
| `admission_missing` fail-closed | `registration-ingress.ts:23–26,35–71` and `server-connection.ts:495–496` unchanged. The missing ingress still ignores any extra argument and refuses. |
| Identity and actual registration before processing | `channel-registry.ts:1896–1957`: malformed/unknown channel refusals still precede selector/content handling. |
| D pre/post delivery refusal | `channel-registry.ts:1965–1968,1989–1990` unchanged: initial validation precedes A; post-hook validation still follows A/current-entry checks and precedes envelope/effects. No validation skipped or reordered. `inbound-delivery.ts:32–45` unchanged. |
| A read/storage admission | `channel-registry.ts:1975–1987`: unsupported coalescing, precheck, entry/descriptor capture, A await, then same-ingress/post-await and identity checks. Only the argument list at `:1983` changed. No early return for context-only was added before A. |
| Registration generations | `registration-view.ts:135–157`: capture before A and check before/after A unchanged; only optional argument forwarding changed. Binding/current-view/parent validation at `:72–91` unchanged. |
| Frozen connection epoch, grants, readiness, receipts | `server-connection.ts:1172–1192` unchanged: missing/old epoch refusal, capture under observed epoch and capability/readiness checks, scoped/B-issued receipt. `inbound-admission.ts` before `:121–160` → after `:122–161`: immutable key/binding, current/stale/missing checks, input/verdict snapshot/validation unchanged (one-line interface-doc shift). |
| Invalidation | All seven `channel-registry.ts` sites remain at `:1577,1744,1787,2237,2686,2753,4555`; no edits around them. Transport invalidation at `server-connection.ts:613–619` unchanged. |
| Classification, persistence and fork seed | `channel-registry.ts:2123–2124` still attaches both receipts/plan; `framework.ts:17346–17351,17495,17526,17764–17770,17881–17902,29785` and `stored-injections.ts:37–98` unchanged. Content/classification still cross the same write boundary. |
| No context-only wake/locus/open effects | `channel-registry.ts:2046–2047,2083`; `admission/admit.ts:98–106`; `framework.ts:17286,17386,17495` unchanged. The gate adds no wake and does not replace those restrictions. |
| Normal B routing and authorization | Existing store/mayWake/check condition and post-consume/error receipt handling retained at `reply-admission.ts:35–46`; `reply-routing.ts:27,108–149` unchanged, including literal `authorize(...) === true` at `:137` and private notices. Publication revalidation and all host compositor call sites (`framework.ts:35095,35169,35286`) unchanged. |

### Test source and assertion names — NOT EXECUTED

`test/context-only-reply-admission.test.ts` uses the existing synthetic loopback fixture and real framework/registration/receipt/storage paths. Resolver/authorizer callbacks only increment arrays/counters and return fixed synthetic values; no callback I/O. The direct argument-seam case is explicitly a synthetic wrapper scaffold, not evidence of accepted wire traffic. Full assertion inventory: `round2-assertion-inventory.txt`.

| Case / source | Named assertions / intent |
| --- | --- |
| (a), `:79–109` | `a.A-read-storage-admission-not-skipped`; `a.context-only-zero-resolve-despite-A-mayWake-true`; `a.context-only-zero-authorize-despite-A-mayWake-true`; `a.A-verdict-wake-ceiling-not-rewritten`; `a.no-routing-field-on-context-envelope`; `a.no-reply-binding-on-context-envelope`; `a.same-trusted-context-only-plan-applied`; `a.no-context-wake`; `a.no-reply-sent`; `a.no-model-turn`; `a.nothing-added-to-pendingRequests`; **`a.pendingRequests-push-never-called`**; `a.no-open-turn`; `a.accepted-context-stored-once`; `a.stored-context-only-classification`; `a.locus-and-open-state-unchanged`, plus no late callbacks. |
| (b), `:111–134`, both normal-first/context-first | `b.A-runs-for-both-items`; `b.frozen-connection-key-shared-not-refreshed`; **`b.normal-exactly-one-resolve-despite-server-gate-false-context-zero`**, matching authorize assertion; `b.normal-retains-branded-binding`; `b.context-has-no-routing-field`; `b.context-cannot-borrow-normal-binding`; `b.normal-wake-veto-does-not-suppress-preparation`; context classification and no later context callbacks. Normal is deliberately wake-vetoed, not context-only. |
| (c), `:136–150`, negative/stale/narrow-grant | `c.<admission>-refusal-preserved`, `-A-not-skipped`, `-zero-resolve`, `-zero-authorize`, `-no-accepted-envelope`, `-refused-context-not-stored`, `-no-reply`, `-no-turn`, `-no-pendingRequests`. Stale changes the actual registration during A; narrow-grant removes contextOnly after A starts and expects D's unchanged post-hook refusal. |
| (d), `:152–169`, normal/no plan | **`d.baseline-one-resolve-even-when-local-gate-will-skip`**, matching authorize assertion; `d.baseline-normal-binding-retained`; unchanged callback counts after gate-false; `d.untrusted-metadata-does-not-apply-a-plan`; `d.local-gate-suppresses-wake-not-preparation`; `d.forged-stamp-replaced-by-applied-normal-classification`. These encode the pre-fix baseline counts as source expectations, not a measured before/after runtime comparison. |
| Applied-argument controls, `:171–198` | For absent/conversational/context-only: `d.A-input-not-rewritten`; `d.applied-plan-does-not-bypass-A`; `d.applied-plan-does-not-change-A-verdict`; `d.<applied>-baseline-resolve-count-ignores-raw-selector`, matching authorize assertion; `d.<applied>-binding-matches-only-applied-plan`; `d.applied-context-only-no-routing-fields`. Tests forwarding through an outer scope, with a deliberately contrary raw hint. |

**Two specified mutants (described, not created/run):**

1. **Remove the applied-plan conjunct.** Then A's store:true/mayWake:true context-only item reaches resolve/authorize and gains a routing receipt. Case (a)'s zero-callback/no-routing assertions and (b)'s context-zero assertions would fail.
2. **Use a wake/gate result as the preparation gate instead of the applied plan** (e.g. suppress preparation for a server-vetoed or local-gate-skipped normal item). Case (b)'s exactly-one normal callback/binding assertions and case (d)'s local-gate-false baseline assertions would fail. A mayWake-only replacement adds no distinction beyond the original prerequisite and is equivalent to mutant 1 for case (a); reversing/requiring false mayWake instead would also fail (b)/(d)'s normal controls. The tests preserve A's mayWake semantics rather than treating that ceiling as delivery classification.

## Verification Gates

### Preflight and sanitised machinery audit

Read `/srv/review-drop/TASK-DX9KM-REVIEW1.md` first. File checksum re-read at 08:34:57 UTC: `329fe9ef580aa5718c320cc7ff76e1400d1bf3a37db2893203ec9fd1b89f0e69` (matches). Input receipt: `round2-review-input.txt`.

**First Git command this round, at 2026-10-31 08:29:35 UTC, was the sanitised read-only machinery audit**, before ref/status/diff/show/switch or any mutation. It used `git config --show-origin --name-only --get-regexp` for all requested key classes, printing names/origins only, never command or secret values. Exit 1 = no matching source settings. Complete audit, including hooks/attributes: `round2-machinery-audit.txt`; completed **08:30:05 UTC**.

| Key/class | Presence and source origin | Executable configured/applies? |
| --- | --- | --- |
| core.hooksPath | Absent; no origin/target | No. Common hooks dir has no non-sample hooks; worktree hooks dir absent. |
| commit.gpgsign / gpg.* | Absent; no source origin | No configured signing; no keys loaded. |
| merge.*.driver | Absent; no origin | No. |
| diff drivers / textconv / diff.external | Absent; no origin; external-diff environment absent | No. |
| filter.* | Absent; no origin | No. |
| core.fsmonitor | Absent; no source origin | No. |
| core.attributesFile | Absent; no origin | No. |
| .gitattributes / info/attributes | None found in worktree/ancestor/common/worktree-info and standard user/system locations inspected | No applicable merge/filter/diff attributes. |
| check-attr -a | Empty for candidate/final touched files | No applicable attributes. Final-path record: `round2-final-path-attributes.txt`. |

Every Git command after the first read-only source-config audit used **`git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false`**; every diff also used **`--no-ext-diff --no-textconv`**. Both commits additionally used **`--no-verify --no-gpg-sign`**, per the explicit safety requirement in the narrowed brief. No source config changed, no hooks/drivers/signing/fsmonitor invoked, no signing keys/credentials accessed or values printed.

### Timestamped command chronology

Exact per-invocation timestamps and escaped arguments, including gate child commands: `round2-command-chronology.txt`. No earlier-round chronology is substituted for this audit.

| UTC time, 2026-10-31 | Actual sequence |
| --- | --- |
| 08:29:35 | First Git invocation: sanitised source machinery config query. Hook/attribute file inventory followed. |
| 08:30:05 | Safety-prefixed check-attr completed audit. Then symbolic HEAD, named-ref and tracked-diff checks. Worktree initially had `task-dx9km-impl` at I7 checked out; **the required named composition/recovery refs all matched**. No edits on that branch. |
| 08:30:21 | Rechecked all three exact named targets, switched normally to the requested composition branch, created `recovery/abdi7-merge-0bba1e8b` at the original merge. No mismatch or force. |
| 08:33:31–08:34:23 | Safety-prefixed narrow diff review; numbered before/after snapshots, final touched-path attributes, whitespace and wrapper inventory review. File edits/test source only; no execution. |
| 08:34:57 | Verified review-file checksum; explicitly staged five paths; staged whitespace, diff/stat/numstat and clean unstaged comparisons. |
| 08:36:07 | Clean/staged whitespace checks, then new additive commit `b05df842` with safety flags and requested author, no trailer. |
| 08:36:25 (see exact command log) | First source-only final-head gates at b05df842. These are superseded below, not reused as final-HEAD receipts. |
| 08:36:53 | Additive one-line test literal-typing follow-up commit `54ebfc58`; verify both new commits, unchanged original merge parents, and all recovery refs; capture exact final diff. |
| 08:37:05–08:37:06 | Reran all six source-only gates below at final HEAD `54ebfc58`. All exit 0, clean=yes. |

### Fresh gates at final HEAD

All commands ran through `orgasmic dispatch gate <name> -- <command>`. Let **G** mean the exact Git prefix above. Full outputs: `round2-final-gate-results.txt`. Logs below are relative to this evidence directory. **All six passed (exit 0) at `54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27`, clean=yes.**

| Gate | Command after G | Log |
| --- | --- | --- |
| round2-final-whitespace | `diff --no-ext-diff --no-textconv --check 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f HEAD` | `gate-round2-final-whitespace-01M68HNXTCZE6CND986YVHF570.log` |
| round2-final-protected-modules | `diff --no-ext-diff --no-textconv --exit-code 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f HEAD -- src/mcpl/registration-ingress.ts src/mcpl/server-connection.ts src/mcpl/inbound-delivery.ts src/mcpl/reply-routing.ts src/mcpl/push-handler.ts src/stored-injections.ts src/framework.ts src/admission/admit.ts src/mcpl/capability-grant.ts src/index.ts` | `gate-round2-final-protected-modules-01M68HNXZCEREV78VXDCQHGF9F.log` |
| round2-final-merge-reachable | `merge-base --is-ancestor 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f HEAD` | `gate-round2-final-merge-reachable-01M68HNY4EDX6D3AX2J16STX8J.log` |
| round2-final-i7-reachable | `merge-base --is-ancestor a0970645d403a7a76449221fc36f240a7aa2464b HEAD` | `gate-round2-final-i7-reachable-01M68HNY9GTW4Q3HC3EV7C2F7H.log` |
| round2-final-d-reachable | `merge-base --is-ancestor 93427f90a16bcfbcf815217f4c080669ab842a71 HEAD` | `gate-round2-final-d-reachable-01M68HNYEHKFP4MQEN915P0GZB.log` |
| round2-final-clean-tracked-tree | `diff --no-ext-diff --no-textconv --exit-code HEAD` | `gate-round2-final-clean-tracked-tree-01M68HNYKKG0BP6JZNA12N5MGR.log` |

### Inherited evidence, narrowed applicability

- Prior project baseline/instruction reads and explicit absence of convention/gotcha pages remain context; the brief says not to replay unchanged startup reads. No project-policy edits introduced this round.
- REVIEW1's static call-path analysis identifies LOW-1 in **unchanged starting commit 0bba1e8b**. Its input checksum was checked and its cited current sources were read again. Its conclusions apply only to that original merge, not proof that the new tests pass.
- Earlier merge parents and recovery refs were freshly verified; unchanged protected source was freshly compared to 0bba1e8b. No earlier gate receipt is reused or represented as a pass for this round. Old assertions that reply-admission itself is byte-identical to I7 no longer apply after this authorized narrow fix.

## Unmet Criteria

None identified for this code-only extension. The requested production condition, source-only synthetic cases and named assertion/mutant descriptions, additive commits, author/no-trailer convention, recovery refs, fresh ancestry/source-only gates, pre-Git machinery preflight, and timestamped chronology are recorded.

**No build/test run.** No npm, bun, node, tsc, build, typecheck, test, mutant, package execution, installs, network, lifecycle run or native 2b. Test source and callback-count expectations are written/read only, not successful execution receipts.

## Residual Risk

- Compile/type correctness, the new test outcomes, actual callback counts/storage/scheduler interactions, async replacement/reconnect races, normal-delivery runtime equivalence, emitted `.d.ts`, and profile-off byte identity remain **unverified**. The follow-up literal annotation was a static typing precaution, not a compiler result.
- No mutant was executed. Failure descriptions are source-level predictions, not measured mutation results.
- The optional plan is internal host plumbing; future wrappers must preserve it when forwarding `RequiredIngress.admit`. The test source explicitly covers an outer registration wrapper to guard against dropping it.
- No new owner contract, authority source, grant or wire field was introduced. LOW-2 refusal precedence and the original merge's historical attribution remain untouched.
- **D's release hold and #931/B holds remain. LOCAL ONLY / UNQUALIFIED; no I6 clearance, production barrier lift, publication/privacy qualification or deployment.**
