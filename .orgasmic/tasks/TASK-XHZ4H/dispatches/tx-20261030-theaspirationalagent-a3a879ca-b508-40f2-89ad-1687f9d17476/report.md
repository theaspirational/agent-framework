# Context-only delivery fix report

## Changed

- Final head: `a5b02a07fd4c380ded751e01ada2ce3e6b242cca`.
- Rebased only `119cb866..a96ca7c1` (one delivery commit) with `git rebase --onto c848977f 119cb866` onto fixed required inbound admission, `c848977fc2280b378576f0eb72c2b07a0a93b86f` (#906, on upstream `c5306693`). No push, PR, merge, dependency edits or changes to external sources.
- Eight local commits (rebased feature plus seven per-concern fixes); all author/committer identities are `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, with `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`.
- Read the complete supplied review, project baseline and `CONTRIBUTING.md`. No applicable AGENTS.md files were found; conventions/gotchas were explicitly absent in the brief.
- Changed-path inventory: `changed-files.txt`. No lockfile or generated tracked files changed. Baseline scratch build is under ignored `data/base-gate`; build output is ignored `dist/`. Evidence contains logs/scripts/small JSON snapshots only.

### Finding disposition

| Finding | Disposition | Evidence / scope |
|---|---|---|
| M1 | Fixed, third wire delta retained and disclosed | `a621423a`: docs/changelog enumerate all three deltas. With profile omitted or false, selector-bearing ungranted incoming batches get ordered per-item refusals, including invalid selectors. No-field batches retain the capability error. Before initial policy, the phase-aware error remains. Responder-less drops retain the diagnostic. Tests exercise the real transport and emit choke point. |
| M2 | Fixed | `a61c6893` plus test follow-up `a5b02a07`: `channels.contextOnly` is DENY_BY_DEFAULT. Real handshake tests cover shorthand and explicit leaf with empty per-server config, denial diagnostics, disabled-capability masking and explicit opt-in. Profile enablement alone cannot grant the leaf. Docs describe per-server controls. |
| M3 | Fixed | `9dd7399f`: shared profile-off corpus retains 5 metadata shapes × 2 lanes × 2 profile spellings, plus wake-bearing ordinary/required admission, actual decisions, anchor/lifecycle state, typing, coalescing, tune-out bookkeeping, live-answer injection/repin/send suppression, real fork seeding and a three-branch restart. Same corpus executed against the fixed base and final head; normalized outputs are byte-identical. Full-suite comparisons remain the primary broad compatibility evidence, not a claim that a finite corpus proves all behavior. |
| M4 | Fixed | `e4fbb4bb`: current floor is read first; an existing floor avoids branch listing/view opens entirely. Only an absent floor triggers fallback, at most one visit per other branch, stopping at the first floor. Read/open/close/list failures are diagnosed and contained. Seven tests cover repeated enabled startup, disabled-profile refusal, branch fallback/early exit and each guarded failure boundary. A floorless store still requires O(branches) search; no unsafe negative-result cache or arbitrary cutoff was added. |
| L1 | Fixed | `feda5490`: each registry delivery refusal emits `mcpl:channel-incoming-rejected`; `RefusalLines` bounds payload-free log lines per server/reason. Tests cover notifications, all three reasons, repeats, and post-hook grant narrowing. |
| L2 | Fixed | `a621423a`: id-less wire push selectors emit `console.error` before taps/holds/effects; the direct handler without a responder also diagnoses the drop. Real notification test checks the operator diagnostic and absence of payload disclosure. |
| L3 | Deferred as directed | Existing context-only ingress witness still does not isolate live `decision.locus` from its defensive guard; direct admission and defensive-boundary tests remain separate. The new corpus covers the normal/profile-off path, not a fix to this context-only witness. |
| L4 | Deferred as directed | Deleting the only floor-bearing branch can remove downgrade protection for stamped rows on another branch. No branch-switch floor refresh or branch-deletion policy change was made. |
| L5 | Deferred as directed | Shared visited-set lineage traversal can conservatively restrict an acyclic diamond. No memoization change. |
| L6 | Fixed | `97a340ca`: shipped doc/changelog use “required inbound admission (#906)” and “future generic initialize-offer extension”; no public slice A/D/E vocabulary. |
| L7 | Deferred as directed | No dedicated unsupported-floor-version test or profile-enabled real fork-seed test added. The widened fork corpus intentionally runs only with omitted/false profiles. |
| L8 | Deferred as directed | Private delivery symbol remains enumerable; write-boundary stripping/carry discipline is unchanged. |

### Rebase resolution and every admission seam touched

Evidence: `rebase-range-diff.txt`, `admission-seams.diff` (final changes against fixed A).

1. **`src/framework.ts` import conflict:** retained A's `admissionConnectErrorOf`, adding only delivery/classification imports; did not restore the old error handling. D's startup floor lives inside A's `createOn` lifecycle, retaining A's owned-store failure cleanup. Profile/config propagation and the existing typed host offer/grant construction are D additions.
2. **`src/mcpl/server-connection.ts` import/emit conflicts:** retained `AdmissionRefusals` and A's `requiredFlushActive` / `requiredFlushDispatching` guard, sequential ordered drain, epoch capture and held inference release-at-dispatch. Only the capability-refusal helper and its existing emit call receive batch params for D's selector-aware response. Added the D-only push-selector check before read taps. Did not restore the old eager admission/readiness block or old required tools/hints block.
3. **`src/mcpl/push-handler.ts` conflicts:** retained A's `AdmissionRefusals` and current required preflight; added the selector import/check before required preflight and direct push effects. No admission scheduler changes.
4. **`src/mcpl/channel-registry.ts` required per-item seam:** validate D selection before admission, then revalidate after A's stale/store-refusal checks. Keep D refusal reasons outside A's closed `RefusalCode` / `AdmissionRefusals` vocabulary; no changes to `inbound-admission.ts`. Attach a separate private delivery plan alongside (not instead of) the admitted envelope, and intersect open/wake effects.
5. **`src/admission/admit.ts` + framework channel handler:** optional trusted `effects` field returns storage recipients/hold with `wake=false`, `gatePass=false`, `locus=false` for context-only, without calling the wake gate. Normal admission remains A's existing path. Context-only omits normal tune-out reader-wake bookkeeping.
6. **Framework module-response seam (`handleEventResponse`):** add `deliveryOf(event).wake` beside A's existing `!wakeForbidden(event)`; do not replace A's mayWake-only ceiling with later gate decisions. Carry the plan onto module-added metadata. D's defensive anchor boundary and stamp-aware injection/repin/rearm/fork writes are restriction-only storage/effect seams, not changes to A scheduling.
7. **Architecture-test conflict:** respected A's deletion of the superseded `routing-runtime-has-no-connector-literals.test.ts`; did not resurrect its inventory. A's scoped admission AST test and D's dependency-closure AST check remain.

8. **Shared negotiation/types/storage helpers:** `src/mcpl/capability-grant.ts` adds the local vocabulary path, excludes it from feature-set uses, gates it on storage opt-in and denies it by default. `src/mcpl/types.ts` adds the typed sibling offer/advertisement leaf and incoming selector/result fields; `src/types/framework.ts` adds the optional profile flag. `src/stored-injections.ts` adds D's reserved-stamp read/write and restriction-only lineage helpers. New `src/mcpl/inbound-delivery.ts` owns the separate private plan. The existing modern-config test's exact deny-by-default diagnostics additionally enumerate the new leaf; no modern-config production code changed.

No touch to `src/mcpl/inbound-admission.ts`, the inference router, ordered held-data drain, held inference dispatch accounting or requiredFlushDispatching semantics beyond the batch-param call described above.

### Preserved prior owner decisions

The supplied record's operative approvals remain in force (quoted here; no external-source work was performed):

> Proceed using the existing MCPL host-capability offer builder (server-connection.ts:1366-1374 / framework.ts host capability construction) for the experimental.mcpl.channels.contextOnly leaf. Generic host-controlled initialize-extension offer support belongs to slice E per the design's §7 E row ("Generic initialize offer support in framework if needed"); do not build it here. Conditions: (1) the leaf is offered only when the context-only storage profile is explicitly enabled (default off, no offer otherwise, tested); (2) keep the offer addition minimal and typed, no connector names; (3) record this as a maintainer question in the PR body and docs (local extension spelling, pending spec/slice E); (4) quote this answer in your report.

> Yes for this slice: (1) the NEW reader fails closed at startup when stamped rows exist and the profile is disabled/ignored (test it), (2) unknown/malformed/future stamps never promoted, (3) the storage profile stays default-off and is never offered without explicit enablement, and (4) docs + changelog + PR body state plainly that enabling the profile is one-way: rolling back to framework code older than this change is unsupported and would treat stamped rows as conversational, because the current context-manager/Chronicle open path has no minimum-reader gate. Put the missing minimum-reader/classification gate in context-manager (with your file:line evidence) as an explicit maintainer question and follow-up, not a change here. Do not touch context-manager. Production enablement of the profile is a separate owner decision outside this slice. Quote this answer in your report.

> Explicitly reject. A push/event carrying a top-level `delivery` field is refused before any effect with the closed reason `unsupported_combination` (no new reason), whatever its value; never ignored, never downgraded to normal. Push without the field stays byte-identical to the base (covered by the no-config differential corpus). Gate it only on presence of the field, so it does not depend on grants or the storage profile. Document it as the second explicit wire delta next to the reserved-key collision delta, in docs, changelog and PR body, and keep the mutation `push accepts field`. If push has no per-message result channel at your base, refuse the way push already refuses invalid events and say which path that is with file:line. Quote this answer in the report.

## Verification Gates

Full-run command form: `orgasmic dispatch gate <name> -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 <runner> <tree> <node-bin>`, using the recorded `run-full.sh` / `run-full-clean.sh` runners in this evidence directory. The runner logs Node version, tree, PID/PGID; sets `AF_TEST_CONCURRENCY=4`, unsets `NODE_OPTIONS`, then runs `npm run typecheck`, `npm run build`, `npm test`. The final 22.23.3 head run uses `run-full-clean.sh` with an initial `npm run clean`; all archive builds start with a fresh dist tree. No custom loader/loopback guard is used. `active-scope-limits.txt` also records the two final scopes at MemoryMax=17179869184 and MemorySwapMax=0 while active.

Base tree: ignored `data/base-gate`, created with `git archive c848977f`; `base-source-integrity.txt` verifies all 715 tracked-file blobs match that exact base. Generated dist and the shared installed dependencies are excluded from this source integrity check. Baseline receipts name the dispatch worktree's HEAD, not the archive's commit, so base counts are archive-run evidence, not a claim of reusable receipts at the base SHA.

| Gate | Tree | Typecheck/build | Tests | Pass | Fail | Skip |
|---|---|---|---:|---:|---:|---:|
| base-full-22-23-3 | c848977f | pass/pass | 9709 | 9646 | 0 | 63 |
| base-full-22-12-0 | c848977f | pass/pass | 9709 | 9646 | 0 | 63 |
| head-full-22-23-3-final | a5b02a07 | pass/pass | 9755 | 9692 | 0 | 63 |
| head-full-22-12-0 | a5b02a07 | pass/pass | 9755 | 9692 | 0 | 63 |

Log names are `<gate>.log` in this evidence directory, with the corresponding `gate-<gate>-*.log` receipt logs. The final 22.12.0 head run uses ignored `data/head-floor-gate`, an immutable final-head archive; `head-archive-source-integrity.txt` verifies all 724 tracked blobs. The 22.23.3 head run uses the assigned worktree directly. All four owned full-gate sessions completed. On both versions the final head adds **46 tests / 46 passes, zero failures and zero additional skips** over the fixed base.

Additional checks:
- `no-config-differential-final`: passed at clean final head. Command is recorded in its gate log; shared corpus helper receives the base fixture then head fixture, with both profile spellings. `corpus-base-final.json` and `corpus-head-final.json` are byte-identical, SHA-256 `29045186182b3b56df0ea5dbd231a8300acf21d5aaa22275e8343926e7599bb6`. Comparison omits generated source receipts/times/deferred IDs, replaces the connection-instance portion of coalescing subjects, and normalizes generated push inference IDs; sender metadata, bodies, ordered result shape and effect counters remain compared.
- Focused fix runs: wire refusals 29/29; fresh grant opt-in + grant-core 43/43; floor + delivery 39/39; delivery diagnostics 36/36; widened corpus 1/1. The full head runs cover these final sources together, including the architecture tests.
- `git diff --check c848977f..HEAD`: passed (`diff-check.txt`).
- Development failures are retained, not hidden: an initial focused grant run used the pre-edit compiled `.mjs` fixture because direct `node --test` does not copy fixtures; `grant-opt-in-focused-fresh` runs `npm run pretest` and passes. Corpus development caught a wrongly expected idle repin, a wait inside a live tool that deadlocked the fixture (interrupted only its proven gate owner; `corpus-r2-processes.txt`), a missing explicit fork bind rule, and generated coalescing/push IDs in snapshot equality. The final corpus removes the in-tool wait, positively witnesses live injection/repin, explicitly configures fork binding, and normalizes only generated fields. These were new-test harness errors, not accepted production regressions. The first head full run also exposed a deterministic exact-list expectation in `mcp-protocol-family.test.ts`: DENY_BY_DEFAULT now includes the new leaf. Fixed in `a5b02a07` by enumerating the fourth path in both exact wildcard/malformed-pattern lists and adding an explicit leaf refusal case; the source-path focused run passes 38/38. The first attempt completed at 9dd7399f with 9,703 pass / 1 fail / 63 skipped (9,767 tests), retained as `head-full-22-23-3-attempt1.log`. Its count includes 12 stale compiled tests from the inventory file deleted by fixed A (`stale-compiled-tests.txt`), so it is not the final source-count comparison. The final 22.23.3 runner explicitly cleans dist before rebuilding. Both required head gates are rerun on a5b02a07, with no production workaround for the expectation failure.

## Unmet Criteria

None within the approved fix-round scope. All required gates passed at the final committed sources. Unassigned LOWs remain intentionally deferred, as listed above; this is not approval to enable the profile in production.

## Residual Risk

- The profile remains default-off; production enablement is a separate decision. No live connector/provider qualification was attempted.
- Enabling is one-way. Older framework binaries ignore these stamps and would treat them as conversational. Dependencies lack a minimum application-reader gate; follow-up evidence and the maintainer question remain in the shipped doc.
- The floor fallback is only as complete as readable branches. Failures now log and contribute no floor on that branch instead of escaping startup. A floorless store still incurs the necessary bounded-by-branch-count fallback. The branch-deletion gap in L4 remains.
- Local extension spelling is not yet ratified; generic initialize offers remain future work.
- Deferred coverage/over-restriction/symbol-discipline risks are specifically L3/L5/L7/L8, not claimed fixed by the broader profile-off corpus.

BEGIN PR BODY

## Problem

Some incoming messages should enrich later context without opening a channel, moving reply anchors, injecting into an active answer, or waking conversational inference. Sender metadata must not create that authority, and its classification must survive persistence and recovery.

Stacked on **#906 (required inbound admission)**; review and merge that first. No dependency companion changes are included.

## Changes

- Add per-item `delivery: "context-only"` on `channels/incoming`, ordered acceptance/refusal results and a private restriction-only effect plan. Required admission can refuse or narrow it, never lift it.
- Keep `contextOnlyStorage` default-off. The local `experimental.mcpl.channels.contextOnly` offer requires explicit storage enablement; the grant additionally requires per-server `enabledCapabilities` opt-in and both effective incoming/context-only grants. It is not accepted in feature-set `uses`.
- Persist host-owned versioned classification through normal/deferred writes, recovery, sharding and summary-source history. Context-only has no open repair, anchor/locus change, conversational inference, live injection, repin or send-suppression reset. Maintenance may still run.
- Record the one-way reader floor before offering the capability. Check the current branch first; search other branches only when it has no floor, stopping on the first discovered floor. Diagnose unreadable fallback branches instead of introducing an unguarded startup failure.
- Emit payload-free refusal traces and rate-limited registry diagnostics; diagnose unsupported push notifications.

**Three explicit compatibility deltas:**
1. With the profile enabled, `inboundDelivery` is host-reserved and overwritten on all message-write lanes. With it disabled, historical sender values remain unchanged.
2. Any top-level `delivery` field on push/event is rejected before read taps or effects, independent of profile/grants, with `-32602 unsupported_combination`; notifications are logged. No-field push keeps existing behavior.
3. After initial policy is established, an ungranted incoming batch containing any item `delivery` field receives ordered `capability_denied` item results instead of the usual JSON-RPC capability error. This is independent of profile and required admission, including invalid selector values. Before initial policy, the phase-aware capability error remains; no-field batches keep the existing error.

**One-way enablement:** the new reader refuses a disabled/omitted profile over a discovered reader floor and never promotes unknown/malformed stamps. Rolling back to framework code older than this change is unsupported and would treat stamped rows as conversational: current context-manager/Chronicle open APIs cannot enforce an application minimum-reader version. Unreadable branch floors are diagnosed but cannot protect downgrade; deleting the sole floor-bearing branch is also a known limitation. Production enablement is a separate owner decision. Never automatically resend or downgrade an uncertain context-only acknowledgement.

## Tests

Full `npm test`, preceded by typecheck/build, on Node 22.23.3 and 22.12.0, each under a systemd user scope with MemoryMax=16G and MemorySwapMax=0; test concurrency 4, no custom NODE_OPTIONS loader:

- Fixed #906 baseline, on each Node version: **9,646 pass / 0 fail / 63 skipped** (9,709 tests).
- This branch, on each Node version: **9,692 pass / 0 fail / 63 skipped** (9,755 tests): +46 tests / +46 passes, no new skips.

The same widened profile-off corpus is byte-identical against the baseline after projection of generated source receipts, identities and times. It includes ordinary/required wakes, stored metadata shapes on incoming/push, anchors, lifecycle state, typing, coalescing, holds, active-answer injection/repin/send suppression, real fork seeding and a multi-branch restart. Full-suite comparison is the primary broad compatibility evidence. Context-only-specific tests also cover refusal/grant races, no-effect behavior, reserved-key collisions, process recovery, sharding, real compaction source lineage and architecture boundaries.

## Not verified / Out of scope

No live connector or provider end-to-end qualification; no production profile enablement, reply-routing extension, external source changes, generic offer facility or dependency minimum-reader backport. This does not add deduplication or a zero-maintenance-compute guarantee.

## Maintainer questions / follow-up

- Is the local contextOnly extension spelling acceptable pending specification agreement and a future generic initialize-offer extension? This uses the existing typed MCPL offer builder only when storage is enabled.
- Add a minimum-reader/classification gate in the context-manager/storage open path before supporting old-code rollback. `docs/context-only-delivery.md` records the audited dependency versions/file evidence. Branch-floor deletion, conservative diamond lineage, remaining ingress-witness/coverage gaps and private-symbol copy discipline remain follow-ups.

AI-assisted implementation with GPT-6.1-Sol (co-author trailers included).

END PR BODY
