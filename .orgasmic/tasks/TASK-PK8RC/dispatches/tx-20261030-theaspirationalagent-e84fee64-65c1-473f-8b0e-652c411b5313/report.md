# Owned typing — fix round report

## Changed

- Head: `d3230a69002b493fef94e501fbf5cfc9a211080b`; stacked on `29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04`. Local commits only; no push.
- Read review 1 in full; SHA-256 `c22afffbf99a0cef2fec8df38f897d101cee891681c0c2027d3274e40a0575c7` (review1.md).
- First ran `git rebase --onto 29edcf8b 27a32127`: **no conflicts**. All five original patches compare equal (`=`) in rebase-range-diff.txt. Rebased head before fixes: 4cb78d61f65519b3a31a225a525fa83f447038b1. final-range-diff.txt adds the four separate fix commits.
- Binding refinements/ask answer are **task-operator Tarn calls within the relayed constraints, not human-owner Vasyl decisions**. They supersede the initial mutable-latest-hint instruction. The existing API has no turn-qualified hint, so no snapshot of mutable channel metadata is treated as turn authority.
- Automatic acquisition yields whenever stored host metadata exists, including idle hints: no automatic wire start/stop, metadata deletion, or root fallback. Live host typing stays host-owned. The fixed skip trace is throttled to once per registry per 60 seconds.
- Hint-free root leases retain captured absence of metadata on wire starts/refreshes/terminal/stale/force stops. Later host hints are stored but cannot retarget the lease; cleanup preserves them for a later explicit host start, never an automatic restart.
- Shutdown is pinned as one best-effort stop per live indicator under the current typing grant. Denied grants still retire local state, send no stop and make no platform-clearance claim.
- The stale-authority private-notice boundary now releases only that turn’s lease, with a non-transport invalidation and successor control.
- forceStopTyping is marked @internal/host-only in code/docs. It remains public for existing host integrations using the exported registry; this is an API-use restriction, not a module sandbox. Exports unchanged this round.
- TTL/endDroppedTurn breadth and the lost unowned sweeper are documented only; their code is not refactored. Disabled-mode guards remain intact and wire-tested.
- No changes to inbound-admission.ts or the automatic-reply files beyond the rebase: protected-files.diff is empty. No new runtime modules, thread fields, transport profiles, dependencies or generated tracked files. Changed paths/statistics: changed-files.txt.

### Commits

- `4031e3ec feat(mcpl): lease typing indicators to logical-turn owners`
- `318d75dc fix(runtime): bind automatic typing to frozen turn ownership`
- `6c630115 fix(runtime): share bounded stale deferral diagnostics across starts`
- `b93d6f2c test(runtime): observe owned typing in existing lifecycle fixtures`
- `4cb78d61 fix(runtime): refuse unbound typing on reply-authorized connections`
- `eed58c38 fix(mcpl): gate typing stops and pin shutdown notifications`
- `178ecfce fix(runtime): release stale reply typing before compilation`
- `3bb7137d fix(mcpl): yield automatic typing to unbound host hints`
- `d3230a69 docs(mcpl): mark force cleanup host-only and record lifecycle limits`

Full author/trailer details are in commits.txt. Every implementation/fix commit is authored by Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com> with Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>.

## Verification Gates

| Fresh gate / checkout / Node | Typecheck + build | Pass | Fail | Skip | Cancelled | Total | Log |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| r2-base-22233 / 29edcf8b / 22.23.3 | PASS | 9704 | 0 | 63 | 0 | 9767 | `gate-r2-base-22233-01M67F6AGMA5CJ0B7BDJM08H8K.log` |
| r2-head-22233 / d3230a69 / 22.23.3 | PASS | 9739 | 0 | 63 | 0 | 9802 | `gate-r2-head-22233-01M67FRB0S6G03R8JHPF8PC5F9.log` |
| r2-head-22120 / d3230a69 / 22.12.0 | PASS | 9739 | 0 | 63 | 0 | 9802 | `gate-r2-head-22120-01M67FRC66RDYRZYKHVX84X0MG.log` |

All three are new executions in this run, not reused receipts. The exact 63 skipped cases/reasons match base. This stack adds 35 passing tests over the new base (nine in this fix round). Raw counts: verification-summary.json. Exact receipt log paths/outcomes for every scoped/red/mutation gate: gate-index.json.

Evidence directory: `/home/orgasmic/.orgasmic/runs/run-01M67F562WJRN2ADRE6XFVK9RM/evidence`. Filenames below are relative to it.

Each required gate is fresh in this round; **no earlier receipt is reused**. Every suite runs from its tested checkout through:

```sh
orgasmic dispatch gate <gate-name> -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 "$ORGASMIC_EVIDENCE_DIR/run-suite.sh" <node-bin>
```

run-suite.sh prints cwd/head/Node/PID/PGID, then runs `npm run typecheck; npm run build; npm test` with set -e and AF_TEST_CONCURRENCY=32. Node bins: /opt/node-v22.23.3-linux-x64/bin and /tmp/task-pk8rc-tools/node-v22.12.0-linux-x64/bin. Base checkout: /tmp/task-pk8rc-r2-base; head 22.23.3: assigned checkout; head 22.12.0: /tmp/task-pk8rc-r2-head12. Scope/PID evidence: head-scopes.txt and command-owners.txt; gate argv records the same 16G/zero-swap limits for the completed base.

### Scoped probes (fresh dispatch gates)

- r2-low-red: invalid test setup build (Module stub omitted required methods); corrected before behavior claims. r2-low-red-assertions: 2 pass / 3 expected assertion failures / 0 skip / 0 cancelled: denied-stop grant cases and missing stale-lease release.
- r2-stop-green: 3 pass / 0 fail / 0 skip / 0 cancelled; shutdown wire sequence plus granted/denied local-retirement controls.
- r2-stale-green: 2 pass / 0 fail / 0 skip / 0 cancelled; actual pre-hook acquisition → non-transport invalidate → private notice → compile, including newer-owner survival.
- r2-hint-gap-green: 11 pass / 0 fail / 0 skip / 0 cancelled. r2-typing-focused: 82 pass / 0 fail / 0 skip / 0 cancelled across registry typing, reply routing and AST guard. The latter includes both real independent turn terminals yielding to two successive host topics. All sendTypingFn wire assertions use real ChannelRegistry instances.
- The first mutation batch had an invalid unreachable-code TypeScript mutation (excluded, never counted as a kill). The corrected r2-mutations-assertions batch below builds all mutants and is assertion-killed. Raw logs for invalid/red attempts are retained, not reported as passes.

Representative scoped commands (the same memory wrapper as the full suites):

```sh
orgasmic dispatch gate r2-typing-focused -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c 'npm run build && npm run pretest && node --import ./dist/test/helpers/force-exit-blocking-stdout.js --test --test-force-exit dist/test/channel-registry-typing.test.js dist/test/reply-routing.test.js dist/test/routing-runtime-has-no-connector-literals.test.js'
orgasmic dispatch gate r2-mutations-assertions -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 python3 "$ORGASMIC_EVIDENCE_DIR/mutations-final.py"
```

### Inherited evidence and limits

- The original pinned design/review and implementation intent remain context. The five equal rebase patches are fresh source evidence that the original slice was transplanted without conflict edits.
- Review 1’s unchanged legacy-spy analysis remains applicable to those unchanged fixtures; this round does not edit or weaken them. Current full suites re-exercise them. Old 08a0ec83 gate/mutation passes are **not** qualification of this head and are not counted here.
- Fresh metadata controls supersede the former tests asserting that acquiring ownership drops host hints. Same/different-channel successor safety is tested without hints; the two-topic tests prove refusal/host ownership, **not two validated topic leases**.

### New guard mutations

14/14 built successfully and were killed by the intended assertions. The runner restores source in finally; mutation-inputs-restored.diff is empty. Full scripts, source patches, build logs, failing test logs and results.json are under mutations-final/ (runner: mutations-final.py); batch gate r2-mutations-assertions.

| Mutation | Killing assertion/test |
| --- | --- |
| hint-presence | automatic typing yields to two successive unbound host hints without changing their wire or ownership |
| idle-hint | an idle stored host hint refuses automatic acquisition without a root fallback |
| hint-throttle | automatic typing yields to two successive unbound host hints without changing their wire or ownership |
| owned-refresh-absence | unscoped hints cannot retarget owned wire refresh/stop and survive owner cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive force cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive shutdown cleanup |
| owned-stop-absence | unscoped hints cannot retarget owned wire refresh/stop and survive owner cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive force cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive shutdown cleanup |
| retain-newer-hint | unscoped hints cannot retarget owned wire refresh/stop and survive owner cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive force cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive shutdown cleanup |
| force-preserves-idle-hints | an idle stored host hint refuses automatic acquisition without a root fallback |
| unscoped-start-is-metadata-only | unscoped hints cannot retarget owned wire refresh/stop and survive owner cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive force cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive shutdown cleanup |
| retain-host-update | unscoped hints cannot retarget owned wire refresh/stop and survive owner cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive force cleanup; unscoped hints cannot retarget owned wire refresh/stop and survive shutdown cleanup |
| shutdown-wire-stop | lifecycle shutdown force-cleans owned typing without touching another server |
| stop-grant | typing stop checks the current grant while retiring local owner state; typing stop checks the current grant while retiring local shutdown state |
| stale-notice-release | non-transport binding invalidation releases only its own typing lease (successor=false) |
| stale-release-is-owned | non-transport binding invalidation releases only its own typing lease (successor=true) |
| disabled-mode | automatic typing uses the frozen turn destination before and after compile in disabled mode |

## Unmet Criteria

None for this narrowed fix round and the explicitly approved conservative gap path. Turn-qualified/thread typing remains incomplete, not claimed closed.

## Residual Risk

- **Explicit incomplete thread path / typing–transport–adapter gap:** the current binding/typing API has no turn-qualified host hint. No threaded typing field, validated topic-lease transport, or thread-ownership fix is implemented. Stored hints conservatively suppress automatic acquisition, even if idle; this differs from base’s reuse of stored hints. Registered genuine channel-root binding is the only owned target; a missing/lost thread binding is not root authority. Thread-shaped registered channels remain ordinary ChannelRef targets.
- Newer host hints survive owned/lifecycle cleanup, including shutdown/re-registration, but cannot restart automatically. Hosts must explicitly resume or clear/revalidate their hints; retaining idle hints can keep automatic typing suppressed.
- Stale authority is checked at the existing inference/private-notice boundary, not continuously on every timer tick. Non-transport invalidation is stopped there; no broader policy-polling promise.
- Idle expiry still calls the broader dropped-turn settlement path and may repeat already-settled speech/input/script cleanup. The active-turn/continuation guard is unchanged; no new already-settled-hook test or narrower lifecycle is claimed (notes only, per brief).
- Unowned indicators still have no TTL and are not unref-ed. A forgotten host start on another channel can refresh/hold the loop open until host stop or lifecycle cleanup; no sweeper is reintroduced (notes only).
- No live connector/provider/deployment qualification; no general status/reaction/draft or context-only wire guarantee. Rows 4/11 remain channel-dimension witnesses, not closure of the excluded nested-thread rows.

## PR body

BEGIN PR BODY

## Problem

Owned typing must not erase host routing hints, adopt newer channel metadata as turn authority, send ungranted stops, or leave stale-authority leases refreshing.

## Changes

- Keep successor-safe channel ownership and disabled-mode suppression.
- Yield automatic acquisition to unbound stored hints, live or idle, without changing host-owned wire activity; report the missing turn-qualified hint contract explicitly.
- Preserve hints arriving during a hint-free root lease while keeping its refreshes and stops metadata-free.
- Gate shutdown stops by current typing permission and release only the stale turn’s lease at the private-notice boundary.
- Mark force cleanup host-internal and document unchanged TTL/unowned-loop limits.

## Tests

- Fresh typecheck, build and full npm test on Node 22.23.3 and 22.12.0 under 16 GiB / zero swap: **9,739 pass / 0 fail / 63 skip / 0 cancelled** each.
- Fresh base 29edcf8b on Node 22.23.3: **9,704 pass / 0 fail / 63 skip / 0 cancelled**; skipped cases are unchanged.
- 14 fresh assertion-killed mutations; live/idle host-hint refusal, metadata-free owned wire refresh/stop, hint retention, grant-gated shutdown, non-transport stale release with successor control, and disabled mode.

## Not verified / Out of scope

Live providers/connectors/deployment and nested-thread targets/transport. This remains an incomplete thread path, not a thread-ownership fix or blanket status guarantee.

## Companion PRs

Stacked on the automatic-reply authority changes at 29edcf8b; review/merge that dependency first. No new thread field or connector capability is introduced.

AI-assisted with GPT-6.1-Sol.

END PR BODY
