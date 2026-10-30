# Changed

Final head: **3f0cfbae1d7f3d887390acd832b6245a4c54d86c**. Own range: **c848977f..3f0cfbae**, 22 commits. The 18 reviewed commit trees are unchanged; four additive commits follow. No push, PR edits/comments, merge, other-repository writes, or main-checkout edits.

Read the complete R2 review and checked the findings against current source. Two ask-tool clarifications are recorded in **decisions.md**: approval to reword six messages, and clarification that token release remains frame-owned rather than introducing new cleanup semantics.

| Commit | Round change |
| --- | --- |
| 3b42c809 | Remove three optional chains on eagerly initialized ownership maps; initialize both maps in the scheduler and inference-exhaustion prototype harnesses. Existing assertions are unchanged. |
| ead834ba | Add valid and invalid post-admission consumer-refusal rows. The invalid row kills removal of the validation guard. |
| 3f0cfbae | Initialize the aliased failure-bounds prototype harness, found by the first full-suite run. |
| 0585dc43 | Call existing continuation-drop cleanup in both stale-owner branches before the drop trace. Add scheduler/direct-start cleanup tests and held-token parity with the agent-gone drop. |
| 9aff1639 | Reword the prior AST-test message to describe only its zero-vocabulary check of the new reply-binding module. No code change. |
| bb186d00, 69097146, e8ef2dbd, 73a967b3, 3e146240 | Reword the five bot-fix subjects to use topics instead of invented numbered labels. No code change. |

Changed files this round: src/framework.ts; test/busy-agent-scheduler.test.ts; test/inference-exhaustion-rewind.test.ts; test/inference-failure-bounds.test.ts; test/mcpl-post-admission.test.ts; test/reply-routing.test.ts; changelog.d/reply-routing-stale-continuation.fixed.md. No manifest, lockfile, generated file or cache is committed; install/build side effects remain ignored.

All 22 commits have author and committer **Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>** and trailer **Co-Authored-By: GPT-6-Astra <noreply@openai.com>**. Static audit verifies identity, ancestry, whitespace and absence of internal names in commits and added connector vocabulary.

## Important correction to the review premise

The initially requested token-release test failed before **and after** adding the prescribed endContinuedTurn calls. Inspection confirmed that endContinuedTurn, abortDroppedTurn and endDroppedTurn do not delete activeTurnTokens: the owning frame releases its token later. The existing agent-gone drop behaves identically. Approval explicitly declined new token-release semantics.

The final defensive scaffold tests therefore assert the real contract: inference:aborted; logical turn removed before the drop trace; routing marked settled; guard abandoned/recovering cleared; registered ephemeral waiter rejected with the drop reason; deferred writes actually stored; and a later bound wake runs when no frame token remains. A separate parity test proves all three branches leave the same frame-owned token untouched. The synthetic mismatch is not claimed as a demonstrated live production path.

**Token release stays frame-owned, as on the existing drop path.** The turnRouting entry is marked ended, not deleted; no test falsely claims its map entry disappears.

## Range-diff and history proof

Reword-only range:
`git range-diff c848977f..ce5e4e88 c848977f..1cdb2dad`

- 12 unchanged-message pairs.
- Exactly six message-only changes: 5b0c1a65 → 9aff1639; 8bcc3095 → bb186d00; 08ab556d → 69097146; c0b88e50 → e8ef2dbd; 64cbb8cd → 73a967b3; 059d6d25 → 3e146240.
- Every corresponding tree ID across all 18 commits is identical, independently asserted.
- Full output: **message-only-range-diff.txt**; all SHA/tree pair results: **message-only-tree-proof.txt**.

Final range:
`git range-diff c848977f..ce5e4e88 c848977f..3f0cfbae`

The same 18 pairs plus:
```text
--: -------- > 19: 3b42c809 refactor(routing): require initialized ownership maps
--: -------- > 20: ead834ba test(mcpl): validate post-admission refusal codes
--: -------- > 21: 0585dc43 fix(routing): end stale reply continuations
--: -------- > 22: 3f0cfbae test(runtime): initialize failure-bounds routing maps
```
Full output: **final-range-diff.txt**. Interactive reword had no conflicts. A's 22 commits remain untouched; c848977f is still an ancestor, and inference-router.ts remains byte-identical to A.

This round does not change held drain, dispatch release, admission timing, mayWake semantics, refused coalescing, initialize/toolHints or exports. Prior conflict dispositions and semantic interaction analysis remain in the prior report; those code paths are unchanged. The only newly touched A test files are the three prototype harness map initializations expressly requested this round.

# Verification Gates

## Fresh final-head qualification

All matrix phases run on the clean exact final head, serially in the assigned worktree:

```sh
orgasmic dispatch gate head-<version>-<phase> -- \
  env XDG_RUNTIME_DIR=/run/user/1002 \
  systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 \
  env PATH=<node-bin>:$PATH bash -c 'git rev-parse HEAD; node --version; <command>'
```

Node bins: /opt/node/bin (22.23.3), /tmp/credential-engines/node-v22.12.0-linux-x64/bin (22.12.0).
Commands, in order: `npm install --ignore-scripts --no-save`; `npm run typecheck`; `npm run clean && npm run build`; `AF_TEST_CONCURRENCY=4 npm test`.
Orchestration: **run-matrix.sh**. Process ownership: **head-owner.txt**. No build cache in evidence.

| Revision | Node | Install | Typecheck | Clean + build | Pass / fail / skip / total |
| --- | --- | --- | --- | --- | --- |
| 3f0cfbae | 22.23.3 | pass | pass | pass | 9,750 / 0 / 63 / 9,813 |
| 3f0cfbae | 22.12.0 | pass | pass | pass | 9,750 / 0 / 63 / 9,813 |

Logs: **head-{22233,22120}-{install,typecheck,build,test}.log**; each records its daemon receipt path. **head-summary.txt** records all eight exit codes. No earlier head pass is used as this round's qualification.

## Final matrix receipt index

- gate head-22233-install: exited:0 recorded (reusable) — log /home/orgasmic/.orgasmic/runs/run-01M66GZJ20GB0TVWKTK9RQ8CRH/evidence/gate-head-22233-install-01M66HQJ2XWEFSYRQN1H2SPVYK.log
- gate head-22233-typecheck: exited:0 recorded (reusable) — log /home/orgasmic/.orgasmic/runs/run-01M66GZJ20GB0TVWKTK9RQ8CRH/evidence/gate-head-22233-typecheck-01M66HQJH8NAP0HCX43SVNGWB8.log
- gate head-22233-build: exited:0 recorded (reusable) — log /home/orgasmic/.orgasmic/runs/run-01M66GZJ20GB0TVWKTK9RQ8CRH/evidence/gate-head-22233-build-01M66HQK9NYDS9KC9QWGPFK8YP.log
- gate head-22233-test: exited:0 recorded (reusable) — log /home/orgasmic/.orgasmic/runs/run-01M66GZJ20GB0TVWKTK9RQ8CRH/evidence/gate-head-22233-test-01M66HQN3WNC35KZVP6T90A257.log
- gate head-22120-install: exited:0 recorded (reusable) — log /home/orgasmic/.orgasmic/runs/run-01M66GZJ20GB0TVWKTK9RQ8CRH/evidence/gate-head-22120-install-01M66J3V4EGXMKAWPWVKKNMP4R.log
- gate head-22120-typecheck: exited:0 recorded (reusable) — log /home/orgasmic/.orgasmic/runs/run-01M66GZJ20GB0TVWKTK9RQ8CRH/evidence/gate-head-22120-typecheck-01M66J3VSAVGJ87BJ9YJQGSYEK.log
- gate head-22120-build: exited:0 recorded (reusable) — log /home/orgasmic/.orgasmic/runs/run-01M66GZJ20GB0TVWKTK9RQ8CRH/evidence/gate-head-22120-build-01M66J3W85BRCM6GE6SNCBYNEY.log
- gate head-22120-test: exited:0 recorded (reusable) — log /home/orgasmic/.orgasmic/runs/run-01M66GZJ20GB0TVWKTK9RQ8CRH/evidence/gate-head-22120-test-01M66J3YA157HGMJZ1EC49KG1Y.log

## Focused probes and expected failures

All scoped probes used the same XDG/systemd 16 GiB/no-swap wrapper and Node 22.23.3; they are development evidence on dirty test/source states, not clean-head reusable qualification.

| Gate | Command after wrapper | Result / evidence |
| --- | --- | --- |
| stale-cleanup-red | npm run build && node --test --test-name-pattern="a stale context_budget_restart\|stale continuations retain" dist/test/reply-routing.test.js | **Expected exit 1: 3 failures**, before the cleanup calls; assertions fail on missing aborted-turn traces. stale-cleanup-red.log |
| stale-cleanup-green | npm run build && node --test dist/test/reply-routing.test.js dist/test/turn-continuation.test.js | **95 pass, 0 fail, 0 skip**. stale-cleanup-green.log |
| routing-map-harnesses | npm run build && node --test dist/test/{busy-agent-scheduler,inference-exhaustion-rewind,inference-failure-observability,overbudget-drain-breaker,ops-alert,present-while-acting,refusal-rewind}.test.js | **158 pass, 0 fail, 0 skip**. routing-map-harnesses.log |
| failure-bounds-maps | npm run build && node --test dist/test/inference-failure-bounds.test.js | **32 pass, 0 fail, 0 skip**. failure-bounds-maps.log |
| consumer-refusal-mutation | python3 consumer-mutation.py | **Expected mutant killed: 1 pass / 1 fail**; nonsense escapes instead of admission_invalid. Mutation driver exits 0 only for the required failure and restores source in finally. consumer-refusal-mutation.log |
| consumer-refusal-green | npm run build && node --test dist/test/mcpl-post-admission.test.js | **6 pass, 0 fail, 0 skip**, with validation restored. consumer-refusal-green.log |
| head-static-audit | python3 final-audit.py | Clean final-head pass: 22 identities/trailers, unchanged A ancestry/inference code, six message changes with 18 identical trees, optional map chains absent, hygiene. final-audit.log |

The earlier **stale-continuation-red.log** and **stale-continuation-green.log** retain the two unsuccessful token-release probes (2 failures each). They established the incorrect premise and led to the explicit clarification; they are superseded tests, not waived failures of the final implementation.

The first clean-head matrix at 0585dc43 failed on Node 22.23.3: **9,748 pass / 2 fail / 63 skip / 9,813 total**. Both failures were missing ownership maps in the aliased Object.create(FrameworkClass.prototype) harness in inference-failure-bounds.test.ts, missed by the initial literal-name harness scan. They are regressions in the incomplete harness update, not environmental failures. Commit 3f0cfbae initializes both maps; the 32-test file then passed. The entire two-Node matrix was restarted on the new clean head. Evidence: **initial-head-22233-test.log**, initial-head-summary.txt, failure-bounds-maps.log. No failure is waived.

## Inherited evidence, not new head qualification

Prior evidence directory:
**/home/orgasmic/.orgasmic/runs/run-01M66DQ27GPZZS7EMR615JP6WS/evidence**.

Read gate-receipts instructions and the baseline logs/summary. Base c848977f remains unchanged. Its historical clean-checkout install/typecheck/clean-build/full-suite receipts on both Nodes report **9,646 pass / 0 fail / 63 skip / 9,709 total**. Files: base-{22233,22120}-{install,typecheck,build,test}.log and base-summary.txt. This is historical base comparison only; it is not substituted for current head gates.

The prior report and range-diff retain the original rebase conflict resolutions and held-drain/dispatch-release/mayWake/coalescing evidence. Their 18 input trees are unchanged by the message reword. This round reruns the full suite after the four additive commits rather than assuming the R2 review or old head receipts qualify new code. Prior original-bot red/green and publish-refusal mutations remain inherited evidence; they were not repeated this round.

## Upstream main

- Start `git ls-remote upstream main`: **c5306693e0684efefb0122cba740ca74f6b4fc92 refs/heads/main** (r3-upstream-start.txt).
- End: **a687fa61c150dbafbedac39e1984d5b5ba3c1ab8 refs/heads/main** (r3-upstream-end.txt).

# Unmet Criteria

No uncompleted code/test item remains within the clarified mini-round scope. The original token-release expectation was explicitly superseded by the ask-tool clarification above; no new token-release behavior is claimed.

**Upstream freshness changed:** the end check moved to a687fa61. Work stopped immediately and the ask tool was used before any rebase or finalization. The answer explicitly authorized normal finalization without rebasing or waiting: leave this tested head on c848977f; A's rebase and a subsequent scope revision will be handled separately. This branch is **not publication-ready against current upstream**, and no refreshed-base qualification is claimed.

# Residual Risk

- Upstream main advanced during the round. The tested head remains on c848977f by explicit instruction; A's rebase and the next scope round are separate. This branch will not be published as-is.

- The stale-owner continuation scenario is defensive scaffolding, not a demonstrated live route. A stranded fabricated frame token remains stranded, identically to the existing agent-gone path; release remains frame-owned by explicit decision.
- Triggerless defer handling, explicit draft resend's channel-root behavior, and missing thread metadata on streaming observer notifications remain outside this narrowed round.
- No live provider/connector deployment. Local stdio peers and mock model responses qualify the behavior.
- Existing short wall-clock polling in a silent-resume regression remains a potential load-sensitive flake; it is not changed here.
- Host resolver/initialize API, additive admission seam, and local publish-only thread profile remain maintainer questions. Opted-in targets intentionally refuse unbound automatic speech.

BEGIN BOT REPLY

Locations below refer to the reviewed revisions.

- **src/mcpl/reply-routing.ts:69** — Fixed in bb186d00: explicit undefined threadId is absent, without relaxing accessor or initialize validation. Core and real-stdio regressions pass.
- **src/mcpl/server-connection.ts:2613** — Fixed in 69097146: direct inference keeps admission but skips reply resolution. Live/held null-or-throwing resolver tests pass; push still binds because it can cause automatic replies.
- **src/framework.ts:19602** — Fixed in e8ef2dbd: reply-deferred requests use the existing age, throttle and quiesce diagnostics, including the pending batch.
- **docs/reply-routing.md:98** — Fixed in 73a967b3: opted-in connections refuse all unbound automatic replies, including heartbeat/home-channel, timer, unrelated module and silent-resume output.
- **src/mcpl/channel-registry.ts:5969** — Covered in 3e146240: all five refusal reasons are asserted before open/send. The prior suite already detected thread-support removal; explicit grant-refusal coverage was missing.
- **src/framework.ts:19628,23321** — Fixed in 0585dc43: stale continuations invoke the existing turn-drop cleanup before tracing. Red/green tests cover both entry paths, guard abandonment, waiter settlement, deferred writes and later wakes. Token release stays frame-owned, as on the existing drop path; a parity test pins this.
- **src/framework.ts:19525,19623,32160** — Fixed in 3b42c809 and 3f0cfbae: ownership maps are mandatory; prototype harnesses initialize them.
- **src/mcpl/inbound-admission.ts:159** — Covered in ead834ba: valid refusal preserved, nonsense becomes admission_invalid. Deleting the guard fails the new test.
- **test/routing-runtime-has-no-connector-literals.test.ts:7** — Message corrected in 9aff1639 to describe its scoped zero-vocabulary AST check. All 18 preexisting commit trees are identical; only six approved messages changed.

Stacked on #906 at c848977f. Final-head install, typecheck, clean build and full tests pass on both Node 22.23.3 and 22.12.0: **9,750 passed, 0 failed, 63 skipped** each. Upstream advanced after qualification; these results describe the tested c848977f-based stack, not a refreshed base.

END BOT REPLY

BEGIN PR BODY

## Problem

Required inbound admission carries private reply intent, but intent alone does not bind automatic output. Queues, continuations and channel activity must not redirect replies or consume another admitted cause.

## Changes

- Opt-in host replyRouting resolves channel/push reply intent after complete admission validation, within the same deadline, cancellation and capacity boundary. Direct inference RPC answers retain admission without needing a publish destination.
- Freeze connection-qualified destinations and private work identity. In-turn continuations retain their logical owner; post-turn continuations and rewind retries open a fresh turn with the same admitted destination. Reject ended/unknown owners and defer unrelated wakes.
- End stale continuations through the existing drop cleanup before tracing: abandon pending guards, settle waiters and flush eligible deferred writes. **Token release stays frame-owned, as on the existing drop path.**
- Require initialized ownership maps rather than optional access; prototype test harnesses provide the maps.
- Enforce frozen targets before automatic open/send, including sleep announcements. Explicit sends retain their chosen targets.
- **Opted-in connections refuse all unbound automatic replies** with automatic_reply_binding_missing, including heartbeat/home-channel prose, timers, unrelated module wakes and unbound silent-start resumes. There is no latest-channel fallback; check these dependencies before enabling the profile.
- Add an explicitly local, publish-only experimental.replyRouting v1 profile for opaque nested threads and data-only initialize offers. Threadless destinations need no extension; explicit threadId: undefined is accepted as absent.
- Preserve #906's sequential held drain, dispatch-time admission and inference release at provider dispatch. Module wakes carry existing admitted work when mayWake:true permits them despite a gate decline; false remains a ceiling and unrelated events acquire no binding. Required coalescing remains refused.
- Preserve stale diagnostics for reply-deferred work with the existing age threshold, shared throttle and quiesce suppression.
- Keep the admission verdict API unchanged. The first B commit isolates the additive post-verdict consumer seam in inbound-admission.ts and private carriage at channel/push admission sites. Consumer refusal codes are validated.
- B's zero-connector-vocabulary AST check covers its new reply-binding module only, not inventories or ceilings for existing runtime modules.

## Tests

| Revision | Node | Pass / fail / skip / total |
| --- | --- | --- |
| Base c848977f (prior qualification) | 22.23.3 | 9,646 / 0 / 63 / 9,709 |
| Base c848977f (prior qualification) | 22.12.0 | 9,646 / 0 / 63 / 9,709 |
| Head 3f0cfbae | 22.23.3 | 9,750 / 0 / 63 / 9,813 |
| Head 3f0cfbae | 22.12.0 | 9,750 / 0 / 63 / 9,813 |

Fresh head installs, typechecks, clean builds and full suites run on both Node versions in 16 GiB memory scopes, with test concurrency 4. Base qualification is inherited from the unchanged base, not rerun this round.

New red/green tests cover stale context_budget_restart drops at scheduler and direct-start boundaries, plus parity with the existing agent-gone branch. These are explicit defensive state scaffolds, not a claimed live path to the mismatch. A consumer-refusal mutation proves an unknown code cannot escape validation. Focused cleanup/continuation tests pass 95/95; harness-adjacent tests 158/158; post-admission tests 6/6.

Existing tests retain optional thread handling, direct-inference resolver exclusion, stale reply diagnostics, all five publish-refusal reasons, turn ownership and silent-resume behavior. Real-stdio tests exercise held batches, live traffic joining a stalled resolver drain, slow direct inference releasing later routed storage, both-lane mayWake/module behavior and refused coalescing.

All 12 original B commits remain unsquashed, followed by ten additive fix/test/docs commits. Six historical messages were corrected without changing any of the 18 reviewed commit trees; the range-diff and tree-ID comparison prove it.

## Maintainer questions

- Accept optional publish thread targets and the local versioned profile, or require registered thread-channels?
- Confirm the host resolver/initialize-offer API and additive post-admission consumer seam.
- Confirm the focused existing silent-resume regression without adding recovery or simultaneous-start guarantees.

## Not verified / Out of scope

No live connector/provider deployment, protocol standardization, typing ownership, context-only persistence, host adapters, automatic replay or cross-epoch recovery. Existing silent-resume behavior is tested, not redesigned. Triggerless defer, explicit draft resend's channel-root behavior and streaming-observer thread metadata remain follow-ups outside this change.

## Companion PRs

Stacked on **#906 at c848977fc2280b378576f0eb72c2b07a0a93b86f**; review and merge #906 first. **This PR's own range is c848977f..3f0cfbae (22 commits)**, excluding A's 22 commits. No dependency on #233 or #361; no SPEC or adapter companion is included.

Upstream advanced during qualification; this body describes the tested stack, not refreshed-base readiness.

AI-assisted implementation and testing; all commits include the GPT-6-Astra co-author trailer.

END PR BODY
