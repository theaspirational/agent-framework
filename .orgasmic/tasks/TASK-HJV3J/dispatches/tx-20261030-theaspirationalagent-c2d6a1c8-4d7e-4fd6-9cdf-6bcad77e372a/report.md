# Rebased admission and reply routing — local qualification

## Changed

- Upstream base: **`48f26ce56cf73267d715e853acc9a88b50595337`**. `git ls-remote upstream refs/heads/main` returned this SHA at the start, midpoint and end; no movement. Evidence: `upstream-start.txt`, `upstream-midpoint.txt`, `upstream-end.txt`.
- **`a-rebased`: `66c9db3fd840c7d821aa4f8e9d5ce389b19d923c`** — all six original admission commits rebased from `d700dce18bc9f33f65ac5965b0cc69c075aa7da1`.
- **`b-rebased`: `20610f0cfef13423e5bdb1bd29a6eb9b5396e193`** — all eleven original B commits rebased onto A, followed by one separate test-only integration commit, `20610f0c`. The rebased original B tip is `2f068ac4065f70e309e9b10a46da635a3e744396`; final B therefore has **12 commits above A**, not a squashed or rewritten lane split.
- The original 17 commit patches, full messages, author identities and author dates are unchanged (`final-range-a.txt`, `final-range-b.txt`). All 18 local commits have author and committer **Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>** and the exact **Co-Authored-By: GPT-6-Astra <noreply@openai.com>** trailer. Rebase necessarily generates new commit SHAs and committer timestamps.
- Supplementary change: **92 added lines in `test/reply-routing-transport.test.ts`, three tests**. No production source, API, lockfile, dependency, generated file or changelog change beyond the original rebased patches. All existing A admission tests remain unmodified. The new cases use real framework ingress, logical turns and stdio transport; the module-start case deliberately holds a test module and resolver. They do not claim a live connector/provider deployment.
- The three admission lane patches independently apply to the rebased shared core (`a-lane-independence.log`). Clean worktree and whitespace checks pass.
- Read repository `CONTRIBUTING.md` and the supplied project baseline. No applicable AGENTS.md or supplied conventions/gotchas were present.
- **No push, PR creation/edit, merge or change to the main checkout.** The original implementation branch remains untouched. Both updated PR bodies below are local publication drafts. A's source is the current public #906 body fetched read-only from the GitHub API (`pr-a-original.json`, `pr-a-original.md`); `gh` had no configured authentication. B's source is the supplied fix-round report's body.

### Conflicts and resolutions

**A: zero conflicts. B: zero conflicts. No manual resolutions or conflict-driven behavior changes.** `rebase-a.log` and `rebase-b.log` record both complete rebases. Every original patch is `=` in range-diff. Upstream's dispatcher/diagnostic changes in `src/framework.ts` and `src/gate/event-gate.ts` integrate independently of the replayed admission/ownership hunks; unchanged patch application was also checked semantically, below.

### Upstream interaction analysis

Read the complete diffs from `d700dce18bc9f33f65ac5965b0cc69c075aa7da1` to `48f26ce56cf73267d715e853acc9a88b50595337` for `src/framework.ts`, `src/gate/event-gate.ts`, and the related module-registry/tune-out changes, not just the rebase outcome. Raw diffs and the path-filtered commit log are adjacent evidence artifacts.

- **MCPL admission and transport:** no upstream changes under `src/mcpl`, including channel-registry and push-handler. There is no upstream change to callback ordering, epoch/grant checks, pending-admission limits, reply negotiation or publish validation to reconcile. The A and B MCPL patches replay verbatim.
- **Tool dispatch (#913, `43aab654`, documentation `d1be0036`/`42567acb`): semantic interaction with B.** `toolRoute` now selects one shared route for model dispatch and awaited host/module/puppet calls. Awaited calls newly reach sleep/wake and other built-ins. Sleep announcements must still use the calling turn's binding, whereas a host call without `callerTurnId` must not borrow the current bound turn. Dispatch still carries the caller turn into the handlers; B's publication checks remain in those handlers. New real-stdio tests exercise both the actual model dispatcher and public awaited execution rather than invoking the sleep handler directly. The upstream save-image sibling barrier change affects awaited tool completion, not admitted work identity; upstream awaited-tool-route tests cover it. No scheduler, turn-opening, continuation, pending-key or owner-carriage code changed upstream.
- **Module start/stop (#912, `e43ac21c`, `4ce0e7fc`): semantic lifecycle adjacency.** Shutdown now waits for a module's pending start before invoking that module's stop; addModule also refuses after a stop begins during its start. It must not defer cancellation of MCPL preflight. Framework shutdown still starts module and MCPL teardown in parallel. A new real-stdio integration test holds module startup and a routing consumer simultaneously, asserts callback abort and pending-slot release before the module is released, then checks orderly module stop and no late inference.
- **Tune-out cancellation (#909, `9e894de8`): semantic scheduling adjacency, not a new reply authority.** Backlog durability now precedes ending the hold; a failed release keeps the hold, retry de-duplicates recorded dumps, and an excepted-channel close can refuse if release fails. Deferred persistence and `commitDeliveries` now report failure. This can change when an unrelated wake is queued, but does not mint admission, change a frozen destination or authorize an existing turn's use. Existing B N1 all-except tests, unrelated-wake ownership/deferral tests and the real-stdio debounce tests cover the composition; the focused common suite also runs upstream tune-out cancellation ordering tests. Durable replay and cross-epoch authorization remain out of scope.
- **Event gate (#910, `27de49de` through `207fefc4`): no changed admission/routing decision.** The gate's refusal/status text names fields as supplied, quotes rule names safely, identifies files and remedies, and explains when edits become active. `fieldNames`, `ruleNamesForChange`, and `configFix` support diagnostics. Removing the unused `behavior` argument from `readPassthrough` changes wording, not its predicate. Policy validation, debounce/judge wake selection and work carriage do not change. B's private work aggregation additions remain separate; existing bound debounce and gate-held-batch tests cover them. No connector-literal ceiling needed adjustment.

No production behavior changes are introduced by this integration. The original 17 rebased patches are unchanged; only supplementary integration tests are added to B.


### Publication hygiene

`final-audit.py` checks every commit in the whole upstream-to-B range, not only the final net diff: metadata, patch equivalence, the exact trailer, whitespace, clean state, supplemental test-only scope, and both prepared PR bodies. `internal-name-grep.txt` records the explicit grep pattern and exit 1 (no matches) across full commit metadata, all per-commit patches, and both bodies; it covers task IDs, internal workflow/agent names and internal filesystem paths. A separate address scan found only loopback WebSocket fixtures, not internal service hosts. Generic test identities and the required public author/co-author identities are retained. No connector-literal ceiling was relaxed; the inventory runs in the focused and full suites.

Changed paths for each slice: `changed-files-a.txt`, `changed-files-b.txt`. Full metadata and patch evidence: `commit-range.txt`, `whole-range.patch`.

## Verification Gates

All gates use the required wrapper:

```sh
orgasmic dispatch gate <name> -- env XDG_RUNTIME_DIR=/run/user/1002 \
  systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0 <command>
```

Each final qualification runs at its recorded **clean checked-out commit**, serially in this assigned worktree. `dist` is removed before each engine's fresh build; no stale compiled tests from another branch remain. The same installed dependency tree is used throughout (`dependencies.txt`), with the Node 22.12.0 binary prepended to PATH for floor-version legs. Build output and development archives stay in ignored worktree directories, not evidence.

Full command: `bash "$ORGASMIC_EVIDENCE_DIR/full-gate.sh"` — prints PID/group, SHA and engine; runs `npm run typecheck`, `npm run build`, and `AF_TEST_CONCURRENCY=4 npm test`, recording each exit code. Focused command: `bash "$ORGASMIC_EVIDENCE_DIR/focused-gate.sh"` — `node --test --test-force-exit --test-concurrency=4 --test-timeout=600000` on the explicitly printed files. The common upstream subset has 417 tests; A adds its admission/inventory suite, and B additionally adds routing/post-admission/stdio coverage and the three integration cases. The baseline cannot run admission/routing files that do not exist upstream; it runs the identical common subset, not a copied modified test tree.

| Tree | Node | Typecheck | Build | Full: total / pass / fail / skip | Focused: pass / fail | Logs |
| --- | --- | --- | --- | --- | --- | --- |
| BASELINE | 22.23.3 | PASS | PASS | 9,494 / 9,431 / 0 / 63 | 417 / 0 | [baseline-node22233.log](baseline-node22233.log), [baseline-focused22233.log](baseline-focused22233.log) |
| BASELINE | 22.12.0 | PASS | PASS | 9,494 / 9,431 / 0 / 63 | 417 / 0 | [baseline-node2212.log](baseline-node2212.log), [baseline-focused2212.log](baseline-focused2212.log) |
| A | 22.23.3 | PASS | PASS | 9,658 / 9,595 / 0 / 63 | 581 / 0 | [a-node22233.log](a-node22233.log), [a-focused22233.log](a-focused22233.log) |
| A | 22.12.0 | PASS | PASS | 9,658 / 9,595 / 0 / 63 | 581 / 0 | [a-node2212.log](a-node2212.log), [a-focused2212.log](a-focused2212.log) |
| B | 22.23.3 | PASS | PASS | 9,734 / 9,671 / 0 / 63 | 657 / 0 | [b-node22233.log](b-node22233.log), [b-focused22233.log](b-focused22233.log) |
| B | 22.12.0 | PASS | PASS | 9,734 / 9,671 / 0 / 63 | 657 / 0 | [b-node2212.log](b-node2212.log), [b-focused2212.log](b-focused2212.log) |

- **B mutation gate:** `python3 "$ORGASMIC_EVIDENCE_DIR/mutation-checks.py"` — **13/13 intended assertion failures, gate exit 0** on Node 22.23.3. It is byte-identical to the reviewed script (`mutation-script-digests.txt`). It asserts single-match edits, excludes syntax/transform/import failures and restores every mutated file. Evidence: `b-mutations.log`, `mutation-*.log`; final audit proves clean restoration.
- **A lane independence:** `python3 "$ORGASMIC_EVIDENCE_DIR/lane-check.py"` — 3/3 patches apply separately to the rebased core using an isolated temporary index, no source edits.
- **Final static audit:** `python3 "$ORGASMIC_EVIDENCE_DIR/final-audit.py"` — PASS (`final-audit.log`).
- **New integration witness development:** typecheck and three production-path tests pass in `b-integration-precommit.log`; this dirty-tree check is not reused as final qualification. `integration-development.log` also records 3/3 in an exact B archive plus the test overlay.
- **Pre-upstream control:** `integration-pre-upstream.log` applies only the three test cases to archived original B `7acacf17`: model-sleep control passes; awaited-sleep success and module-stop ordering fail with `ERR_ASSERTION` (1 pass, 2 expected failures, no infrastructure failures). This establishes the new tests exercise upstream's changed semantics, not a rebased-production regression. These deliberate historical failures are not waived final gate failures.

Reusable receipts for the full/focused matrix:
- `gate-baseline-node22233-01M660ZHEHWGRG0AECPNE2MTP4.log`
- `gate-baseline-focused22233-01M661BAX9BYKSGJY79JB2X42H.log`
- `gate-baseline-node2212-01M661CD0D0GEF6WZDST50SVHD.log`
- `gate-baseline-focused2212-01M661RC5ZBKZD7V84FQT5384H.log`
- `gate-a-node22233-01M661SEC7CATX8M06CTEYBCDM.log`
- `gate-a-focused22233-01M6625JQXKR9J376SHNSESGCQ.log`
- `gate-a-node2212-01M6626SKWZ02FJM9Y6CY6RB51.log`
- `gate-a-focused2212-01M662M3PMAE8GH4B40QEW11XB.log`
- `gate-b-node22233-01M662P05BKGTW3699G1NXRTW4.log`
- `gate-b-focused22233-01M6634KBKKBBRYKTJ42D0V5PN.log`
- `gate-b-node2212-01M66361NMD3TH72GG6VGBVHYN.log`
- `gate-b-focused2212-01M663JSJHGJQ3EH50ZM9ANE5M.log`

Other receipts are named in the last line of their corresponding logs. No historical qualification receipt was reused. Command/session owners and progress are in `base-a-matrix.log`, `b-matrix.log`, and each full gate's PID/group header; the gate wrapper owns its child process group.

### Failure classification versus baseline

**No final failures on any tree or engine.** Each full suite has the same 63 skips and zero failures. A adds 164 passing tests over current upstream; final B adds 76 over A (73 existing routing tests plus three new integration tests). Focused suites have zero skips. No flaky, environment-blocked or pre-existing failure is used to excuse a result. The only failing gates are the explicitly expected pre-upstream integration control and the individual injected mutation processes; the mutation gate itself passes.

## Unmet Criteria

None for this local rebase-and-qualification assignment. Publishing branches and applying the prepared bodies to GitHub are intentionally not performed; they remain the separately authorized publication step. B's review/merge base must be the admission branch for #906, not main.

## Residual Risk

- Qualification is local with neutral stdio/WebSocket peers and mock provider responses, not a deployed connector or live model provider.
- The existing local `experimental.replyRouting` v1 profile, optional publish thread field and additive admission consumer seam still need maintainer acceptance. Typing ownership, context-only delivery/stamps, protocol standardization, durable replay and cross-epoch reauthorization remain out of scope.
- Previously disclosed nonblocking coverage limits remain: the 3-second budget-restart polling witness can be sensitive to load; some continuation triggers use explicit private scaffolding; invalid consumer-refusal-code and ownerless-continuation deferral are not newly expanded here. This rebase does not redesign those behaviors.
- The upstream freshness statement is the recorded end check, not a guarantee that main will remain fixed after this report. Recheck before the later publication step.

### PR A — #906

BEGIN PR BODY A
### Problem

Applications need an opt-in admission boundary before inbound MCPL data can cause effects, without changing existing unconfigured connections.

### Changes

Add an explicitly configured, fail-closed admission callback for MCPL channel deliveries, push events, and inference requests.

- Enable via `McplServerConfig.inboundAdmission`; bind the callback to a framework-issued connection instance and transport epoch.
- Authorize traffic and check readiness before invoking admission. Refuse required pre-ready traffic rather than holding or replaying it.
- Await a bounded callback, validate the entire verdict, then recheck connection lifetime, grants, and channel registration before applying effects.
- Refuse timeout, throw, invalid verdict, stale epoch, removed registration, and overload without admitting the item. Preserve independent outcomes for channel-batch siblings.
- Include pending inference admission in request cancellation: stopping answers once while the transport is live; transport closure answers nothing. Both cancel the callback signal and release the admission slot without waiting for a late verdict.
- Keep a negative wake decision authoritative downstream. This is not context-only delivery.
- Required connections ignore peer hints on pushes, standalone `tools/hints`, and result-borne `mcpl/hints`; the underlying result is preserved. The application's own solicited `tools/list` result still supplies tool presence and `mcpl/rev` without admission, because it asked for the inventory. A revision gap may trigger application-to-peer list recovery: catalogue bookkeeping, not a wake, content delivery or stored data.
- Support optional initialize attestation. Ordinary transport outages remain non-fatal to framework startup; binding or attestation failures are fatal.

Unconfigured connections retain their existing dispatch, holding, hint handling, and wake policy, with no added admission callback, asynchronous preflight, or synthetic verdict.

No connector-specific routing policy or new wire fields are added. Stamp support arrives with context-only delivery; a full MCPL pin follows separately.

### Tests

Rebased the six commits onto upstream `main` at `48f26ce56cf73267d715e853acc9a88b50595337`, with no conflicts or production-code changes from the original patches.

- On **Node 22.23.3 and 22.12.0**: typecheck and build pass; full suite **9,595 passed / 0 failed / 63 skipped** (9,658 tests). The same upstream baseline on both engines has **9,431 passed / 0 failed / 63 skipped** (9,494 tests): 164 additional passing cases.
- Expanded focused admission/routing and upstream-interaction suite: **581 passed / 0 failed** on each engine, compared with **417 / 0** on the upstream baseline.
- Coverage includes real-WebSocket refusal and compatibility, complete verdict validation, lifecycle revalidation, pending inference cancellation, no-hook behavior, solicited inventory/revision handling, and the connector-literal architecture inventory. Stop/close tests include late verdicts, streamed and non-streamed requests, and an isolated router stop.
- The focused upstream checks cover shared awaited/model tool dispatch, pending module startup at shutdown, tune-out cancellation ordering, gate diagnostics, channel routing, inference aborts and held-turn/gate behavior.
- Each channel, push and inference lane patch independently applies to the rebased shared admission core. All original commit patches, messages and author identities are preserved; whitespace checks pass.

The connector-literal inventory retains its inherited ceilings; none were relaxed for this rebase. Checks run in memory-limited scopes with test concurrency 4.

### Not verified / out of scope

No deployed connector or live model provider was exercised. Reply destination binding, typing, context-only delivery and protocol stamps are not implemented here.

### Questions for maintainers

1. Are the initial limits appropriate: required integer `timeoutMs` in **1..60000 ms** and **64 pending admissions per connection**, with immediate overload refusal and independent deadlines for sequential channel-batch items?
2. Is the closed refusal-code vocabulary acceptable, including `admission_mode_ungranted`? Channel refusals are itemwise results, pushes return `accepted: false`, and inference refusals use JSON-RPC -32600 with the fixed reason; notifications cannot receive a response.
3. Is this hint policy appropriate: ignore result-borne `mcpl/hints`, refuse hinted pushes and standalone `tools/hints` requests, but retain tool presence and `mcpl/rev` from solicited `tools/list` results, including application-to-peer list recovery?
4. Is startup behavior correct: a required server's transport outage is logged and non-fatal, but binding or attestation failure aborts startup?
5. Is the existing `@animalabs/mcpl-core` **0.4.0** baseline sufficient for this capability, with no SPEC change here, a full protocol pin separately, and protocol stamp support later alongside context-only delivery?

### Companion PRs

This is the admission prerequisite for the stacked reply-destination/turn-ownership change. Review and merge this PR first; destination binding, thread publication and typing are not part of this PR.

AI-assisted implementation and testing; commits include the GPT-6-Astra co-author trailer.
END PR BODY A

### PR B — feat(mcpl): retain admitted reply destinations across logical turns

BEGIN PR BODY B
## Problem

Required inbound admission can carry private reply intent, but intent alone does not bind automatic output. Queues, continuations and channel activity must not redirect a reply or consume another admitted cause.

## Changes

- Add opt-in host `replyRouting` resolution after complete admission validation, under the same deadline and cancellation boundary.
- Freeze connection-qualified destinations and private work identity. In-turn retries, tool continuations and budget restarts retain their logical owner; auto-continue, prose continuations and rewind retries carry admitted work into a fresh turn with the same frozen destination.
- Keep unrelated wakes from taking an open reply turn; reject forged or ended in-turn owners.
- Enforce automatic targets before open/send, including sleep announcements. Explicit sends retain their chosen targets.
- Add an explicitly local, publish-only `experimental.replyRouting` v1 profile for opaque nested threads, plus data-only initialize offers. Threadless destinations need no extension.
- Keep unconfigured behavior and the admission verdict API unchanged. The first commit isolates the optional post-verdict consumer in `src/mcpl/inbound-admission.ts` and additive private carriage at the channel/push admission sites for review against #906.
- Add neutral runtime/real-stdio tests, documentation and a changelog. Cover the private binding module and event gate in the connector-literal architecture inventory without relaxing existing ceilings.

## Tests

On **Node 22.23.3 and 22.12.0**, typecheck and build pass. Full suite: **9,671 passed, 0 failed, 63 skipped** (9,734 tests); the rebased #906 base has **9,595 passed, 0 failed, 63 skipped**. Expanded focused routing/admission/upstream-interaction suite: **657 passed, 0 failed** on each engine (#906: 581 passed). Checks run in memory-limited scopes with test concurrency 4.

All eleven original commits rebase without conflicts or production-code changes. A separate test-only integration commit adds three real-stdio witnesses for upstream's shared tool dispatcher and module-start shutdown ordering: a model sleep announcement retains its admitted thread; an awaited off-turn sleep cannot borrow a live bound turn; pending module startup does not delay routing-consumer abort and slot release. The latter two fail against the pre-rebase implementation for the expected missing upstream behaviors; all three pass after integration.

The existing post-turn-continuation and budget-fallback regression witnesses remain unchanged. Thirteen mutation checks cover ownership, fresh-turn carriage, destination enforcement, stale-owner rejection and fallback guards; each produces its intended assertion failure and restores the source. No connector-literal inventory ceiling was relaxed.

## Maintainer questions

- Accept optional publish thread targets and this local versioned profile, or require registered thread-channels?
- Confirm the host resolver/initialize-offer API and additive post-admission consumer seam.
- Confirm the focused existing silent-resume regression without adding a recovery or simultaneous-start contract.

## Not verified / Out of scope

No live connector/provider deployment or protocol standardization. No typing ownership, context-only wire mode/persistence, host adapters, automatic replay or cross-epoch recovery. Existing silent-resume behavior is tested, not redesigned.

## Companion PRs

Stacked on #906 at `66c9db3fd840c7d821aa4f8e9d5ce389b19d923c`, rebased onto upstream `main` at `48f26ce56cf73267d715e853acc9a88b50595337`; review and merge #906 first. Target the admission branch, not `main`. This patch has no dependency on #233 or #361. No SPEC or adapter companion is included; nested-thread interoperability remains an explicitly local agreement.

AI-assisted implementation and testing; commits include the GPT-6-Astra co-author trailer.
END PR BODY B
