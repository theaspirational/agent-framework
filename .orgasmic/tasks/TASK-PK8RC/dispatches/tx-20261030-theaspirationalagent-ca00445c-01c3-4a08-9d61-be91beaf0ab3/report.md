# Owned typing implementation report

## Changed

- Head: `08a0ec8392d01d0cedd4017cc15d4fa4fd88f15b`. Base: `27a321276c8c03efe3fbc810029d25d53ec04572` (stacked on narrowed automatic-reply routing). Local commits only; no push.
- Registry-owned, detached server-qualified target and typed session/agent/logical-turn owner; successor-safe owned stop; unscoped isolation; explicit lifecycle force cleanup.
- Automatic typing bound to frozen admitted destinations; private/silent/disabled suppression; all emitting modes covered. Idle expiry ends idle ownership before its independent unbound closure wake, and runtime disposal releases leases.
- Shared scheduler/direct stale-deferral diagnostics: complete pending snapshot, busy qualifier, unchanged request ages/bindings, 30-second threshold, shared 60-second throttle, quiesce suppression.
- Public TypingOwner exports, focused/stdio/AST regressions, documentation and changelog. Existing lifecycle/presence fixture doubles now observe the owned APIs rather than silently ignoring them. No new runtime modules, dependencies, generated tracked files or lockfiles. Unbound wakes cannot borrow typing authority from a reply-authorized connection; all three emitting modes have real-stdio red/green witnesses.
- Changed paths and line counts: changed-files.txt (17 paths: four runtime/export files, reply-routing documentation, one changelog fragment, and eleven test/fixture files).
- Instructions read: supplied baseline project.org (no additional operating constraints), CONTRIBUTING.md; no supplied conventions/gotchas. Required pinned design and base reply-routing docs/code inspected.

### Commits

- `e8f5ea2d feat(mcpl): lease typing indicators to logical-turn owners`
- `bbbf3fa4 fix(runtime): bind automatic typing to frozen turn ownership`
- `d00f66c4 fix(runtime): share bounded stale deferral diagnostics across starts`
- `71e811ae test(runtime): observe owned typing in existing lifecycle fixtures`
- `08a0ec83 fix(runtime): refuse unbound typing on reply-authorized connections`

All commits: author Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>; Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>. Full identities/hashes: commits.txt. The final guard was red-first: all three emitting-mode unbound stdio probes fail before it (unbound-typing-red.log), then pass alongside bound/unconfigured controls (5 pass, unbound-typing-green.log).

## Verification Gates

| Checkout / Node | Typecheck + build | Full npm test (pass / fail / skip) | Gate log |
| --- | --- | --- | --- |
| Base 27a32127 / 22.23.3 | PASS | 9,703 / 0 / 63 (9,766 total) | `gate-base-node22233-01M67A88BVS73BTQ1YBHTEQBV3.log` |
| Head 08a0ec83 / 22.23.3 | PASS | 9,729 / 0 / 63 (9,792 total) | `gate-qualified-head-node22233-01M67CFP4GYVZ60KH4AKCH6XK6.log` |
| Head 08a0ec83 / 22.12.0 | PASS | 9,729 / 0 / 63 (9,792 total) | `gate-qualified-head-node22120-01M67CFQ5ZWP803X6Z214E44WH.log` |

Evidence directory: `/home/orgasmic/.orgasmic/runs/run-01M67A45AAA93376VDXNYS0VY1/evidence`. All gate logs and scripts named below are relative to it. 26 additional passing tests; the exact 63 skipped test names/reasons are unchanged from base (verification-summary.json). No new acceptance test is skipped.

Reproduction (each command is run from the checkout named in the table):

```sh
orgasmic dispatch gate qualified-head-node22233 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 "$ORGASMIC_EVIDENCE_DIR/run-final-suite.sh" /opt/node-v22.23.3-linux-x64/bin
orgasmic dispatch gate qualified-head-node22120 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 "$ORGASMIC_EVIDENCE_DIR/run-final-suite.sh" /tmp/task-pk8rc-tools/node-v22.12.0-linux-x64/bin
orgasmic dispatch gate base-node22233 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c 'export PATH=/opt/node-v22.23.3-linux-x64/bin:$PATH; echo cwd=$PWD; node -v; npm run typecheck && npm run build && AF_TEST_CONCURRENCY=8 npm test'
```

- Required gates run through `orgasmic dispatch gate`, wrapping `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`; cwd is each tested checkout. Node versions printed in logs; AF_TEST_CONCURRENCY=8 at base and 32 at final head. Effective MemoryMax/MemorySwapMax recorded in qualified-scopes.txt (head) and scopes.txt (base).
- Head command: `run-final-suite.sh <node-bin>` (script in evidence): `npm run typecheck && npm run build && npm test`.
- Base command: same steps in /tmp/task-pk8rc-base at 27a32127, PATH=/opt/node-v22.23.3-linux-x64/bin.
- Earlier owned-typing focused suite: 124 pass / 0 fail / 0 skip (focused-final.log, d00f66c4, before the additional unbound-authority guard). Post-fixture-update targeted lifecycle probe: 3 pass / 0 fail (mock-updated.log).
- Real stdio test exercises actual admission, framework turn scheduling, ChannelRegistry and server connection with two unrelated connection ids sharing room/one; verifies starts/stops, channel targets, no owner/thread on wire, and no new typing for read-only admitted arrivals.
- Two initial head gate attempts at d00f66c4 were intentionally interrupted after discovering lifecycle doubles still used unowned APIs. Scope/PID termination was verified. The subsequent complete runs at 97d9edf6 each reported 9,716 pass / 10 fail / 63 skip: all ten failures were old unowned spies in explicit-prose-routing/present-while-acting, not production-path failures. Updating those spies to the owned APIs and channel-scoped terminal assertions passes all 213 tests in those two files (owned-typing-spies.log). These historical failed/interrupted runs are not passes; their raw gate logs remain in evidence.

### Mutation table

33 source mutations built successfully and were killed by behavioral/AST assertions, not import/type errors. Final inputs match the final head exactly for all production files and these regression tests: mutation-inputs-vs-final.patch is empty. Each .patch, .build.log and .test.log is retained under mutations-final/; mutations-final/results.json and mutations-final.py give the complete commands/results. Earlier probes and the corrected one-indicator test selection are also retained (mutations-wrapper.log / mutation-retries-wrapper.log); the final independent run kills all 33.

| Mutation/log stem | Fault introduced | Killing test assertion |
| --- | --- | --- |
| owner-turn | Remove turn-id equality | owned successor survives predecessor stops on the same and different channels |
| owner-session | Remove session equality | typing identity includes session, agent, turn and server; targets are detached |
| owner-agent | Remove agent identity equality | typing identity includes session, agent, turn and server; targets are detached |
| unscoped-start | Remove the owned-lease guard on unscoped starts | unscoped frame starts and stops cannot acquire, refresh or remove an owned indicator |
| unscoped-stop | Let ordinary stop match every owner | unscoped frame starts and stops cannot acquire, refresh or remove an owned indicator |
| owned-stop | Let an owned stop match every owner | owned successor survives predecessor stops on the same and different channels |
| detached-target | Retain the caller’s mutable ChannelRef | typing identity includes session, agent, turn and server; targets are detached |
| detached-owner | Retain the caller’s mutable owner fields | owned acquisition detaches owner fields and keeps exactly one refresh per channel |
| one-indicator | Omit force-release before successor acquisition | owned successor survives predecessor stops on the same and different channels |
| channel-removal | Omit force cleanup on channel removal | lifecycle remove-channel force-cleans owned typing without touching another server |
| server-removal | Omit force cleanup on server removal | lifecycle remove-server force-cleans owned typing without touching another server |
| transport-close | Omit force cleanup on transport close | lifecycle transport-close force-cleans owned typing without touching another server |
| shutdown | Omit shutdown force cleanup | lifecycle shutdown force-cleans owned typing without touching another server |
| ordinary-metadata | Omit the ordinary metadata-change immediate refresh | startTyping with changed metadata mid-typing dispatches immediate refresh |
| frozen-target | Omit the defensive frozen-target substitution | turn cleanup cannot erase a successor, including another agent in the same channel |
| private-binding | Allow a binding without a destination to use the supplied channel | typing defensive boundary refuses private, invalidated and silent bindings |
| binding-current | Omit current-binding check | typing defensive boundary refuses private, invalidated and silent bindings |
| silent-boundary | Omit silent-turn typing suppression | typing defensive boundary refuses private, invalidated and silent bindings |
| early-start | Omit pre-compile typing acquisition | automatic typing uses the frozen turn destination before and after compile in locus mode |
| terminal-stop | Omit the terminal frame’s owner-scoped release | automatic typing uses the frozen turn destination before and after compile in locus mode |
| ttl-ownership | Omit expired idle turn’s owner termination | idle expiry ends typing and binding before the independent closure wake |
| agent-disposal | Omit disposal lease release | idle expiry ends typing and binding before the independent closure wake |
| stale-throttle | Omit recording the shared warning throttle timestamp | stale scheduler diagnostics retain age, throttle and quiesce suppression (reply=true, token=true); stale scheduler diagnostics retain age, throttle and quiesce suppression (reply=true, token=false); stale scheduler diagnostics retain age, throttle and quiesce suppression (reply=false, token=true) |
| stale-quiesce | Warn during quiesce | direct deferral reports the whole queue and busy qualifier through the shared throttle, then runs each cause once |
| stale-threshold | Raise stale threshold to 60s | direct deferral reports the whole queue and busy qualifier through the shared throttle, then runs each cause once |
| mixed-snapshot | Report only runnable requests, hiding deferred siblings | reply-deferred diagnostic includes the mixed pending snapshot before a continuation runs |
| busy-qualifier | Omit turn-alive qualification | reply-deferred diagnostic includes the mixed pending snapshot before a continuation runs |
| direct-warning | Omit direct-entry diagnostic | direct deferral reports the whole queue and busy qualifier through the shared throttle, then runs each cause once |
| deferred-age | Reset timestamp when requeuing a direct deferral | direct deferral reports the whole queue and busy qualifier through the shared throttle, then runs each cause once |
| connector-ast | Inject a forbidden connector string in owned typing | owned typing runtime has no connector vocabulary: src/mcpl/channel-registry.ts |
| single-refresh | Disable the already-running/idempotent acquisition branch | owned acquisition detaches owner fields and keeps exactly one refresh per channel |
| unbound-binding | Omit the missing-binding guard on reply-authorized connections | real stdio: an unbound wake cannot type on a reply-authorized connection in locus mode; real stdio: an unbound wake cannot type on a reply-authorized connection in hybrid mode; real stdio: an unbound wake cannot type on a reply-authorized connection in explicit mode |
| disabled-mode | Remove all disabled-mode start guards (avoids masking) | automatic typing uses the frozen turn destination before and after compile in disabled mode |

Neutral witness mapping: rows 4/11 use successor leases on different/identical registered channel targets (nested thread transport remains excluded); row 5 exercises all unscoped forms and metadata/refresh isolation; rows 20/21 cover scheduler/direct age, pending snapshot, busy qualifier, throttle/quiesce and eventual exactly-once runs; row 22 retains the existing owner/silent-resume regression and adds automatic-typing suppression. Lifecycle witnesses cover channel removal, server removal, transport close, shutdown and idle disposal.

## Unmet Criteria

None within the assigned channel-target scope. Thread-target transport is explicitly excluded and remains open, not claimed complete.

## Residual Risk

- Exact nested-thread typing target/thread field remains unimplemented, as requested; no experimental.replyRouting or other transport negotiation was invented. Registered thread-as-channel destinations use ordinary ChannelRef semantics.
- No new context-only wire selector, durable classification, live connector/provider qualification or deployment. Read-only admitted events and silent/private turn boundaries are tested; a future full context-only implementation must preserve the no-wake/no-typing effect ceiling. A wake veto is not described as full context-only delivery.
- Guarantees are limited to tested typing ownership/frozen targets and preserved existing routing/anchor behavior, not blanket frozen status, reactions or drafts. Existing ordinary unowned metadata/name fan-out semantics remain covered.

## PR body

BEGIN PR BODY

## Problem

Frame-level typing cleanup could clear an indicator belonging to a successor turn, and automatic typing could follow live routing instead of the admitted destination.

## Changes

- Lease the registry’s single per-channel indicator to the existing logical turn with session and agent identity.
- Separate owner-scoped frame cleanup from force cleanup on channel/transport/framework lifecycle events.
- Use frozen reply channels for automatic typing; suppress private, silent and disabled starts.
- Share bounded, accurate stale-deferral diagnostics across scheduler and direct starts.

## Tests

- Typecheck and full npm test pass under a 16 GiB memory / zero-swap scope on Node 22.23.3 and 22.12.0.
- Head: 9,729 pass / 0 fail / 63 skip on each version. Base 27a32127 on Node 22.23.3: 9,703 pass / 0 fail / 63 skip; skipped cases are unchanged.
- 33 assertion-killed mutations; all emitting modes plus disabled/private/silent/unbound cases, real stdio with colliding channel ids, successor safety, force cleanup, idle disposal and bounded mixed-queue diagnostics.

## Not verified

Live providers/connectors and deployment.

## Out of scope

Nested-thread typing targets and transport negotiation remain open. No general status/reaction/draft guarantee or live connector/provider qualification.

## Companion PRs

Stacked on frozen automatic-reply routing at 27a32127; review and merge that first. No companion protocol or connector change is needed for registered channel targets.

AI-assisted with GPT-6.1-Sol.

END PR BODY
