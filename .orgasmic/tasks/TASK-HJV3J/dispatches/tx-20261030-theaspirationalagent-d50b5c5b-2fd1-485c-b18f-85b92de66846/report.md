# Changed

Local narrowing is implemented on slice A `c848977fc2280b378576f0eb72c2b07a0a93b86f`, without rebasing A, pushing, or editing the held upstream PR #931.

- Final head: `bf6e8e0eeaa38b086bb8d05bd4efe3a3d2f54cd9`.
- Recovery ref: `task-hjv3j-before-narrowing` → `3f0cfbae1d7f3d887390acd832b6245a4c54d86c`.
- Replaced the 22 B commits with four per-concern commits: separate post-admission consumer (`76f3e407`), optional frozen host authority (`248b0f58`), shared-cause turn ownership (`0612cffe`), documentation/changelog (`bf6e8e0e`). Every new author/committer is Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>, with `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`.
- 21 changed files relative to A; no lockfile/generated-file changes. Production changes are in the two new reply modules, additive channel/push/transport carriage, config/types/exports, gate provenance, and runtime ownership/publication paths. Tests cover neutral stdio peers, core authority, ingress wrapper, runtime ownership, genericity, and three existing harness initializations. Documentation is `docs/reply-routing.md` and one consolidated changelog fragment.
- Repository baseline read; no conventions or gotchas were supplied. The supplied published design was read as historical scope; the narrowed contract and confirmed API decisions govern this implementation.

## Exact implemented safety contract

1. **Route approval is optional, separate from admission/waking.** Opt-in `McplServerConfig.replyAuthority` requires existing `inboundAdmission`, its own `timeoutMs` (1..60000), bounded async `resolve`, and cheap synchronous `authorize(input, destination)` with no I/O. Resolve returns one `{ channelId }` or null; the framework supplies the original connection's server, requires registration/publish grant, detaches/freezes the route, and calls authorize at binding. Only literal true approves. No route/channel is mandatory for a wakeable item or push.
2. **A finishes first.** `src/mcpl/inbound-admission.ts` is byte-identical to A. B's optional ingress wrapper runs after A's validated verdict and pending-slot release. Its own abort controller/deadline and 64-pending cap bound route resolution. Resolution finishes, or becomes definitively private, before the item reaches the existing wake path. A's existing final stale/current/registration checks still apply. Connection invalidation cancels pending routing; late/old-epoch results cannot mint authority. A's verdict shape/refusal semantics are untouched.
3. **Recheck at send.** Each original cause's host authorization, connection incarnation, registered descriptor and publish grant are checked again immediately before automatic open/send effects, including after waits. A mismatch/revocation never re-resolves or falls back to a different destination.
4. **Private with notice.** Null, malformed, unavailable, denied, thrown, timed-out or overloaded route resolution leaves admission/mayWake unchanged, with private work instead of publication authority. Automatic prose stays in context/archive and the agent receives readable notice that no unique currently approved destination exists, prose stays private, and explicit send tools remain available. Throws log one bounded fixed diagnostic per configured connection; callback exception details never enter agent content. Send-time failure likewise gets a readable private notice. A stale connection can still trigger A's pre-existing ingress refusal; that is not a route-failure refusal.
5. **Shared turns retain every cause.** Compatible same-destination work can share one turn, but publication requires every original cause still to authorize that same frozen destination. If any loses approval, the shared prose stays private. Different destinations get separate turns; missing/incompatible authority cannot select a routing winner and publish elsewhere. Work identities remain distinct in equality, holds and dedupe.
6. **Explicit sends remain separately authorized.** Existing explicit send tools keep chosen targets and existing authorization, without requiring or inheriting automatic reply authority. `inference/request` keeps its JSON-RPC response path and bypasses channel reply resolution. With no host option, the original A ingress object and ordinary automatic routing remain unchanged.
7. **Retained ownership protections.** Work survives holds/retries, in-turn and fresh-turn continuations, and admitted-event module wakes. Coordinator/agent-tool locus activity cannot redirect it. Announcements use the frozen binding or fail closed. Stale continuation cleanup and owner/silent-resume regression remain; token release stays frame-owned. Reply-deferred diagnostics retain existing threshold/throttle/quiesce semantics. No new recovery contract.

## Removed versus round 3

- Entire experimental reply-routing profile: offers/attestation, nested-thread publish field/type, `threaded`, thread-support checks, negotiation fixtures and tests, optional-thread normalization and its fragment. Registered thread channels are ordinary ChannelRefs, not a new transport contract.
- The old host `replyRouting` option, renamed and narrowed to `replyAuthority` with explicit send-time approval.
- `initializeExtensions`, its data sanitizer/reserved-key validation, types, negotiation docs and tests; nothing remaining uses it.
- Mandatory route and push-binding admission refusals, malformed/null routing admission-invalid/stale tests, and route throw/timeout admission-refusal expectations.
- One-turn-per-admitted-identity scheduling rule; same-destination causes now retain all identities in a shared turn and are checked collectively at send.
- Round 3's same-deadline post-verdict changes in A's admission class and their tests. Replaced by an independent optional wrapper with new tests; A's admission implementation has zero diff.
- Five standalone fix fragments, consolidated into the narrowed feature fragment. Valid fixes remain in code/tests, not presented as separate fixes to unreleased behavior.

# Verification Gates

All required final gates passed, wrapped with `orgasmic dispatch gate`. Each suite ran under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, with the selected Node bin first on PATH and `node --version` in its log.

| Source | Node | Passed | Failed | Skipped | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| A `c848977f` | 22.23.3 | 9646 | 0 | 63 | 9709 |
| A `c848977f` | 22.12.0 | 9646 | 0 | 63 | 9709 |
| Head `bf6e8e0e` | 22.23.3 | 9756 | 0 | 63 | 9819 |
| Head `bf6e8e0e` | 22.12.0 | 9756 | 0 | 63 | 9819 |

Delta: **110 additional passing tests** on each Node; unchanged 63 skips, zero cancellations. Typecheck (`npm run typecheck`, Node 22.23.3, same scope limits) passed.

Commands, after selecting the named Node version:

- `orgasmic dispatch gate base-node22.23.3 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c 'cd dist/baseline && ... && node --version && npm run build && npm test'`
- `orgasmic dispatch gate base-node22.12.0 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c 'cd dist/baseline && ... && node --version && npm test'`
- `orgasmic dispatch gate head-node22.23.3 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c '...; node --version; rm -rf dist/src dist/test dist/tsconfig.tsbuildinfo; npm run build && npm test'`
- `orgasmic dispatch gate head-node22.12.0 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c '...; node --version; npm test'`
- `orgasmic dispatch gate typecheck -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c '...; node --version; npm run typecheck'`

Here `...` only selects the required Node bin on PATH; the actual argv/version and full results are recorded in the gate/console logs below. Baseline source was extracted with `git archive c848977f | tar -x -C dist/baseline` and used the existing dependencies through a symlink. Those are archived-base count measurements, marked dirty by the receipt wrapper while the branch was being edited, **not** reusable clean-head receipts. Both head suite receipts and typecheck are recorded reusable at the final clean commit.

Evidence paths relative to this report:

- `gate-base-node22.23.3-01M675YWVTVYG8FQ15SS6B772C.log`
- `gate-base-node22.12.0-01M67675F3HR5PH4JYQ6YTDF01.log`
- `gate-head-node22.23.3-01M676GTFHRSSKT4GVCASCHVZC.log`
- `gate-head-node22.12.0-01M676R64JFFFASBJYXBK3XCJ0.log`
- `gate-typecheck-01M676GVM9HJ3RY3GAX9SKDNX0.log`
- Matching `base-node*.console.log`, `head-node*.console.log`, and `typecheck.console.log` include scope/unit/version/receipt information.
- `narrow-working4.log`: development focused suite, 110/110 passing (also included in both final full suites). Production-path stdio probes cover approved/missing/malformed/throw/timeout routes, direct RPC inference, route-less pushes, shared-turn revocation, explicit sends, registration/epoch checks, stop/cancellation, tool/coordinator locus and announcements.
- `history-and-scope.txt`: commit identities/trailers, recovery/base/head, diff summary/check and unchanged admission implementation.
- `base-and-genericity.txt`: admission blob/checksum equality and zero-connector-vocabulary checks on both new runtime modules.

`git diff --check c848977f` passes. Final worktree is clean. No final gate failures or environment exceptions.

# Unmet Criteria

None. All narrowed implementation criteria and named gates are satisfied. Publication, upstream PR edits and rebasing onto refreshed A are deliberately not performed.

# Residual Risk

Likely rework if the maintainer wants a different contract:

- Public host option/API naming and the independent post-admission wrapper/deadline/cap boundary; admission-site changes are additive, but still a review seam.
- Shared-turn grouping/private-notice policy and unbound timer/home/heartbeat behavior on opted-in destinations. Applications must check unbound-post dependencies before enabling it.
- Nested thread targeting would require a separate reviewed transport proposal; this patch only uses registered channels.
- Host policy quality, cheap synchronous/no-I/O authorization, and cancellation cooperation remain host obligations; cancellation cannot undo callback side effects.
- A later rebase onto refreshed A/new upstream is separate and will require renewed gates. No typing/status, persistent classification, replay, simultaneous-start or automatic recovery guarantee is added.

BEGIN PR BODY
## Summary

Stacked on #906. This separates admission and waking from permission to publish an automatic reply.

- An admitted channel/push item may carry a frozen host-approved registered destination. No publishable route is required for admission or waking; direct inference keeps its JSON-RPC response path.
- Optional host `replyAuthority` resolves a route after required admission completes. Missing, invalid, unavailable, denied or timed-out routing keeps prose private and gives the agent a readable notice; explicit sends still use their own authorization.
- Same-destination causes can share a turn only while every cause still authorizes that destination at send. Approval, connection incarnation, registration and publish grant are rechecked before automatic open/send. Mismatch never falls back elsewhere.
- Work survives holds, retries and continuations. Coordinator/tool locus changes cannot redirect the binding, and announcements use it or fail closed. Token release stays frame-owned, as on the existing drop path; the owner/silent-resume regression adds no recovery contract.

## Scope and review seam

Required admission itself is unchanged. Additive private carriage at its transport/channel/push sites uses a separate bounded post-admission consumer; its own timeout/cap can only make reply authority private, never refuse admission. No unresolved binding reaches a waking turn. The host API and this ordering boundary are the main maintainer review questions.

There is no new thread field, experimental routing profile, initialize extension, connector-specific policy, typing ownership or durable replay contract. Destinations use existing registered channels. Unconfigured connections retain #906 behavior. Opted-in connections also keep unbound automatic prose private; explicit sends remain available.

## Tests

Full `npm test` passes on Node 22.23.3 and 22.12.0 under 16 GiB memory/no-swap scopes: **9756 passed, 0 failed, 63 skipped** on each (9819 total). The #906 base at `c848977f` has **9646 passed, 0 failed, 63 skipped** on each (9709 total): 110 additional passing tests. Typecheck passes.

Neutral stdio and runtime tests cover private-with-notice route failure, authorization revocation and throws, shared-cause publication, explicit sends, route-less pushes, cancellation/overload/epochs, holds/retries/continuations, locus and announcements. The no-hook control preserves existing automatic routing, and both new runtime modules pass the connector-vocabulary AST check.
END PR BODY
