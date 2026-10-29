# Local implementation report

Status: **DONE — three layers and the standalone recipient branch are implemented and tested**.
The three code layers are implemented locally. No remote action was taken.

## Changed

| Branch | Head | Contents |
| --- | --- | --- |
| `feat/typing-budget-recipient` | `72fe3f8df64393d4c05183d05b0e0e7f6f67a9e4` | Exact main + disabled typing + budget holds + recipient compatibility |
| `recipient-on-main` | `57424a0e1e851331357a721b2822720f89097a47` | Exact main + recipient compatibility only |


Base is exactly upstream main `0f11975e485c7077c6ed7cad9261621cd310a700`.
Package `@animalabs/agent-framework` remains **0.30.0**. No version bump.
Local stacked branch: `feat/typing-budget-recipient`.
All authored commits use the requested neutral author/committer and the repository-required AI trailer.
No push, PR creation, remote mutation, or main-checkout edits.

Layer 1: squash-port all five feature commits (02edb4e7, 336c7cf9, 41c846b4,
1c2d3537, 7166b0b2) from #233, excluding its two upstream merges.
Use current server-qualified ChannelRef and agent-registry homes; retain upstream
routing gates. The durable-first tune-out operation and sendTypingStop extraction
already exist upstream, so retain those and add the missing typing-capability
check/stop placement. The old tuned-out ambient test assumed a gate pass that
current main diverts before the gate; the replacement tests both zero fresh
streams and a manually queued older wake without typing.

Layer 2: net diff from merge base e85c57db9aacba43a7b55e8e18bba607fa0228e6
to #361 head 5e41150d0a6f0953e9e215bb548b1f5204158104. No feature dropped as
already upstream; merge-only content excluded. Preserve current main's terminal
stop semantics, centralized releaseAgentRuntime, merged-wake withdrawal and
host-status counting. Integrate hold cleanup into current lifecycle instead of
restoring obsolete conversation disposal. One fork test fixture now supplies
ChannelRef and idleTtlMs. The 78-test file and 21-test stop suite pass. A separate 100-line liveness
test file adds the owner-requested overlap/fresh-after-summary witness without
changing the original 78-test file. This test-only commit is kept in layer 2.

Layer 3: port all seven runtime files of the supplied patch, plus regression tests,
synthetic MCPL peer, local-extension documentation and changelog. The source patch
SHA-256 matched 2a9ce06c4aada2daf8b6f1ec3f7be91876f87cc88c15019e423b2a5730580499.
Adapt to current logical turns, server-qualified routes, continuation requests,
real incoming/push admission, and confirmed-publication routing. The former patch's
pre-publication streaming filter is unnecessary: current main emits outgoing
speech only after confirmed delivery. Add logical-turn typing ownership in addition
to thread identity, so same-thread successors are protected. Opt-in absence leaves
ordinary routing unchanged. Explicit send destinations remain explicit.

The initial layer-3 full run had 16 regressions: partial-framework tests did not
initialize the optional recipient/config maps. These were not base-red failures.
A separate follow-up commit makes the new accesses optional. All 162 tests spanning
the four failing files plus the recipient tests passed in the narrow recheck.
The failed full-run receipt is retained rather than hidden. After inserting the
liveness test-only commit into layer 2, the recipient commits were replayed: the
initial recipient commit 947c8563 corresponds to 52657657 and the optional-state
fix 3562ee64 corresponds to 6324a1a4. Runtime changes are unchanged by that replay.
A further layer-3 test-only commit adds the real tool-driven budget-restart row.


### Commit statistics

| Branch | Commit | Subject | Stats |
| --- | --- | --- | --- |
| `feat/typing-budget-recipient` | `e7f161a9` | feat(typing): port disabled-mode presence and tune-out safeguards | 5 files changed, 308 insertions(+), 9 deletions(-) |
| `feat/typing-budget-recipient` | `edb2f3cf` | fix(inference): hold refused compiles while compression makes room | 7 files changed, 3013 insertions(+), 74 deletions(-) |
| `feat/typing-budget-recipient` | `22454888` | test(inference): witness overlap liveness after budget refusal | 1 file changed, 100 insertions(+) |
| `feat/typing-budget-recipient` | `52657657` | feat(routing): preserve optional host-admitted recipient envelopes | 12 files changed, 912 insertions(+), 45 deletions(-) |
| `feat/typing-budget-recipient` | `6324a1a4` | fix(routing): tolerate absent optional recipient state | 1 file changed, 14 insertions(+), 14 deletions(-) |
| `feat/typing-budget-recipient` | `72fe3f8d` | test(routing): retain recipient ownership through a budget restart | 1 file changed, 44 insertions(+), 2 deletions(-) |
| `recipient-on-main` | `ef4ac55f` | feat(routing): preserve optional host-admitted recipient envelopes | 12 files changed, 912 insertions(+), 45 deletions(-) |
| `recipient-on-main` | `5e71e448` | fix(routing): tolerate absent optional recipient state | 1 file changed, 14 insertions(+), 14 deletions(-) |
| `recipient-on-main` | `57424a0e` | test(routing): retain recipient ownership through a budget restart | 1 file changed, 44 insertions(+), 2 deletions(-) |

Full per-file statistics and commit bodies: [commit-stats.txt](commit-stats.txt),
[commits.txt](commits.txt). Added-line and commit-message prohibited-name audits
are retained separately; the explicitly requested author/committer is unchanged.
Build output and the ignored dependency lockfile are not committed.

### Standalone conclusion

**Layer 3 does not need #361 or #233.** `recipient-on-main` contains only its
12 changed files. Cherry-picking needed two context resolutions: exclude the
#233-only disabledTypingChannel helper, and retain main's ordinary error wrapping
instead of #361's afterBudgetHold wrapper. No budget-hold implementation was
copied. Its budget-hold integration row explicitly skips on main; the stacked
branch runs that row. No runtime reference to budgetHolds/afterBudgetHold or
disabledTypingChannel exists on the standalone branch. The assigned worktree is
returned to the clean stacked head and clean-rebuilt there. Final manifests and
ancestry checks are in [final-manifest.json](final-manifest.json).

## Verification Gates

Tools: Bun **1.4.3** from `/home/orgasmic/.local/bin/bun-1.4.3`; Node **22.23.3**
from `/opt/node/bin`. Installed per repository docs with `bun-1.4.3 install`.
The resolved key dependencies are context-manager 0.24.1, chronicle 0.5.0 and
membrane 0.8.0. TypeScript resolves to 7.0.2. No tracked dependency edits.

Every listed gate was invoked with `orgasmic dispatch gate NAME -- COMMAND`.
The linked logs and console files are in this report's evidence directory.
All probes, including dirty-tree failures and the first refused finalize
followed by the owner clarification, are documented here; gate outcomes are in [gate-results.md](gate-results.md).
Dirty-tree probes are evidence, not reusable clean-head receipts.

| Snapshot | Gate / exact command after wrapper | Result |
| --- | --- | --- |
| Base `0f11975e` | [base-install](gate-base-install-01M63795YW09YBPK4WET6HN5CB.log) — `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS |
| Base | [base-typecheck](gate-base-typecheck-01M6379F4HDW3EZ3XWK00CD3QK.log) — `npm run typecheck` | PASS |
| Base | [base-build](gate-base-build-01M6379GF26D779Q0R0CCWTF4N.log) — `npm run build` | PASS |
| Final stacked `72fe3f8d` | [qualified-head-install](gate-qualified-head-install-01M63CRYQ2X3HXNVDWAF5ZY2XA.log) — `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS |
| Final stacked | [qualified-head-typecheck](gate-qualified-head-typecheck-01M63CRYVZ7Y1GSFKDE32PQA57.log) — `npm run typecheck` | PASS |
| Final stacked | [qualified-head-build](gate-qualified-head-build-01M63CRZAMMWCQN10ZGPDS1ED5.log) — `bash -c 'npm run clean && npm run build && npm run pretest'` | PASS |
| Standalone `57424a0e` | [qualified-standalone-install](gate-qualified-standalone-install-01M63D58CX9STXWMPW2AYJDHXN.log) — `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS |
| Standalone | [qualified-standalone-typecheck](gate-qualified-standalone-typecheck-01M63D58JDX19DHPTSHVY8VY2A.log) — `npm run typecheck` | PASS |
| Standalone | [qualified-standalone-build](gate-qualified-standalone-build-01M63D5A0GJJAMHT9C2BN3AD6Y.log) — `bash -c 'npm run clean && npm run build && npm run pretest'` | PASS |

Full-suite command: `AF_TEST_CONCURRENCY=8 orgasmic dispatch gate NAME -- npm test`.
The repository's npm script runs all `dist/test/*.test.js` with Node's test runner,
force-exit helper and 600000 ms per-test timeout. Clean rebuilding on branch changes
prevents tests from another layer surviving in dist.

| Snapshot | Receipt | Tests / pass / fail / skip |
| --- | --- | --- |
| Base | [base-suite](gate-base-suite-01M6379HWRM4GMAJTYEX46FA60.log) | 9211 / 9148 / 0 / 63 |
| Layer 2 | [layer2-suite](gate-layer2-suite-01M637VNJJC23TAP7PAJ1HT2FS.log) | 9303 / 9240 / 0 / 63 |
| Initial layer 3 (before optional-state fix) | [head-suite](gate-head-suite-01M63970ZXW979C6A6AGTB01FG.log) | 9326 / 9247 / 16 / 63 |
| First green stacked (3562ee64, before added witnesses) | [final-head-suite](gate-final-head-suite-01M63A5R944V06JASRYA5C1NDB.log) | 9326 / 9263 / 0 / 63 |
| Final stacked | [qualified-head-suite](gate-qualified-head-suite-01M63CS1N2WJHE02S3E76HWPYF.log) | 9329 / 9266 / 0 / 63 |
| Standalone | [qualified-standalone-suite](gate-qualified-standalone-suite-01M63D5FACFH287KX945N1GBNE.log) | 9235 / 9171 / 0 / 64 |

**Base-red failures: none.** The final stacked suite adds 118 passing tests to
base, with the same 63 skips and zero failures. Standalone adds 23 passes and one
conditional skip (budget-hold integration), with zero failures. The initial 16 head failures were
introduced regressions, not pre-existing failures, and were fixed in 3562ee64.
They affect discord-awareness-delivery, inference-exhaustion-rewind,
inference-failure-bounds and mcpl-request-handler-errors; raw failure excerpts
are in [initial-head-failures.txt](initial-head-failures.txt).

### Focused and red-first tests

Commands use `node --test --test-force-exit dist/test/<file>.test.js ...`,
with typecheck/build where shown in the gate log.

| Gate | Suites | Tests / pass / fail / skip |
| --- | --- | --- |
| [layer1-focused](gate-layer1-focused-recheck-01M637K80WMWT1X5QXZY9NXSYV.log) at e7f161a9 | disabled-prose-typing, channel-registry-typing, batched-wake-locus; typecheck + build | 26 / 26 / 0 / 0 |
| [layer2-focused](gate-layer2-focused-recheck-01M637Q2C8YDNXQ4R82YCPZTXR.log) at edb2f3cf | budget-refusal-hold, stop-step-throws, disabled-prose-typing, channel-registry-typing, overbudget-drain-breaker, host-quiesce; typecheck + build | 179 / 179 / 0 / 0 |
| [layer2-focused-recheck](gate-layer2-focused-recheck-01M637Q2C8YDNXQ4R82YCPZTXR.log) | budget-refusal-hold (78), stop-step-throws (21) | 99 / 99 / 0 / 0 |
| [layer2-liveness-focused](gate-layer2-liveness-focused-01M63CND8SEC5QJPD7CA8VEMDX.log) at 22454888 | budget-hold-liveness (2) + budget-refusal-hold (78) + stop-step-throws (21) | 101 / 101 / 0 / 0 |
| [liveness-red-confirm](gate-liveness-red-confirm-01M63CJBVRNTX0C06S50VNS0YY.log) on layer 1 | overlap red; fresh-after-summary control green | 2 / 1 / 1 / 0 |
| [recipient-restart-red](gate-recipient-restart-red-01M63CMRKCE1PWA0G8C33JH440.log) on layer 2 | Real tool-result budget restart without recipient support | 1 / 0 / 1 / 0 |
| [recipient-red](gate-recipient-red-expanded-01M638XEQSMTMGQYCW3KVFQTJR.log) | Initial nine compatibility cases, layer-2 runtime without recipient patch | 9 / 0 / 9 / 0 |
| [recipient-red-expanded](gate-recipient-red-expanded-01M638XEQSMTMGQYCW3KVFQTJR.log) | Expanded compatibility cases, layer-2 runtime without recipient patch | 15 / 1 / 14 / 0 |
| [recipient-precommit](gate-recipient-precommit-01M6393JE99HMQ66ZCQMWH26WS.log) | Recipient 23 + budget/stop 99 + typing 19; typecheck + build | 141 / 141 / 0 / 0 |
| [final-head-focused](gate-final-head-focused-01M63B6PAGVB6V9BC0PNYV3QZC.log) at first green stacked head (3562ee64) | Recipient compatibility/protocol plus the four former failing files | 162 / 162 / 0 / 0 |
| [qualified-standalone-focused](gate-qualified-standalone-focused-01M63D5BY7A6FABPDNT235C3JN.log) at standalone head | Same six files; only budget-hold integration row skips | 163 / 162 / 0 / 1 |
| [qualified-restored-stack](gate-qualified-restored-stack-01M63DH4S9JY0GJV5HKJ041YVW.log) at final stacked head | Clean rebuild + typecheck + recipient, budget/stop, disabled typing and channel typing | 144 / 144 / 0 / 0 |

The expanded red probe built successfully and failed 14 of 15 behavior assertions;
the explicit-send control already passed on layer 2. This is not missing-import
or compile-failure evidence. The new tests cover queue ownership, compile retries,
tool waits, budget holds, later addressed roots, frozen exact destinations,
channel-open resistance, explicit-send controls and stale typing stops including
a same-thread successor. Eight protocol tests exercise real stdio initialization
and inbound/push handlers with a synthetic peer (including missing/partial/other
recipient promises and message text imitating metadata).

Development-only failures are retained: one layer-1 fixture assumed obsolete
pre-gate behavior; one layer-2 fixture used the old fork API; intermediate
recipient TypeScript probes needed event narrowing/test-private access fixes.
These are fixed in the reported commits, not waived diagnostics.

## Unmet Criteria


See qualification-map.md, qualification-source-checks.txt,
frozen-framework-test-inventory.md and docs/recipient-compatibility.md. The summary claims
366 framework and 21 recipient passes per profile, but the supplied frozen runtime
omits the selecting runner and original recipient/overlap sources. The named
unpublished integration commit is not present in either local repository. Ten
named host test sources were inspected; they cover recipe/tool/identity surfaces,
not the recipient envelope. They were not executed against a new host graph.
No agent history/state or credentials were accessed. New tests use only mocks and
a synthetic stdio peer; no live provider or connector was contacted.

A source-only artifact-location question was sent (ask-c1461fc2eb994297bbfa16e4d29b37b7).
The exact historical 366/21 selection remains unreproduced, as explicitly accepted
by the owner; this is a documented evidence limitation, not an outstanding gate.
The initial 23 recipient tests, expanded to 24, are replacement regression
coverage, not a replay of that count. The owner confirmed the historical sources
are unavailable and explicitly accepted replacement tests instead (response to
ask-c1461fc2eb994297bbfa16e4d29b37b7, delivered at the first finalize attempt).
The requested overlap/fresh-after-summary witness is now a separate two-test
file: one red overlap and one green fresh control on layer 1, both green with
layer 2. It models the compressor completion boundary synthetically and executes
a real framework/context compile after it, not a real summarization provider.
An additional recipient test drives a real tool-result context-budget restart,
with later context and a separate addressed root; red on layer 2, green with layer 3.


**None remain under the owner's clarification.** The original historical test
selection is not claimed reproduced. The owner explicitly accepted documented
historical limits plus synthetic replacement witnesses; all requested witnesses
now have passing coverage, with red-first receipts for the new hold and recipient
behaviors. No live deployment qualification is claimed.

## Residual Risk


The host handshake attests to a peer's implementation; it does not establish trust
or enforce all host access policy. Connector authentication and outbound send
authorization remain the host's responsibility. This is a deliberately Slack-local
extension. No claim of generic context-only delivery or closed-channel permanence.
Historical deployment qualification cannot be replayed from incomplete supplied
sources. No real deployment, provider, or changed host dependency graph was tested.

Earlier head runs took roughly 16 minutes; the final stacked run took 4.6,
comparable to baseline. Timing varied; no performance qualification is claimed.

## Draft PR for layer 3


Title: Preserve host-admitted reply destinations with an optional recipient extension

Body:
- Add an opt-in local Slack recipient-routing extension, outside the standard MCPL
  capability manifest. This is not a standard MCPL capability or an authorization
  grant. Refuse missing, partial and other-recipient promises when enabled.
- Freeze the adapter-admitted channel/thread at turn start, retain it through
  queues, tools and retries, and run later addressed roots as separate turns.
  Keep explicit sends explicit. Metadata is supplied by the trusted host adapter;
  message text cannot create recipient metadata.
- Bind typing cleanup to the turn owner so a stale stop cannot clear a successor.
- Add red-first routing tests and real stdio handshake/ingress tests with synthetic
  transport, plus host-contract documentation.

Non-goals: generic context-only/mention-only delivery; a closed-channel persistence
  guarantee; connector authentication/send authorization; adoption as an MCPL standard.

Historical qualification counts are not claimed reproduced. Budget-hold integration
is tested on the stacked branch; upstream main alone does not contain that feature.


Use `recipient-on-main` as the standalone source, not the stacked branch.
Only a draft is provided: no PR or push was made.
