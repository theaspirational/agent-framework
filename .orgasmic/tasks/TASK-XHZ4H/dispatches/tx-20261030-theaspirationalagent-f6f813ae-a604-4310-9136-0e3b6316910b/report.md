# Context-only delivery follow-up report

## Changed

- Parent: `a5b02a07fd4c380ded751e01ada2ce3e6b242cca`. Final head: `51cf9b1e50602b5f6d82c2eddff34f194b0e6375`.
- Six per-concern commits on that parent, without rewriting. All author/committer identities are `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` and every commit has `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. See `commit-identities.txt`.
- Local only: no push, PR, merge, dependency installation/change, external source change or production profile enablement.
- Read the supplied second review in full and verified the findings against current source. Existing repository/skill instructions remain applicable; no startup scans were replayed.

### Disposition

| Finding | Disposition | Commit / verification |
|---|---|---|
| M-A | Fixed using the preferred exclusion | `186c46e8`: the modern-policy deny-by-default enumeration skips paths excluded by `isKnownCapabilityPath`, matching the existing local-extension exclusion from feature-set uses. Modern `channels.*` and literal `channels.contextOnly` configurations are accepted, as on fixed base `c848977f`. The MCPL grant computation and DENY_BY_DEFAULT list are unchanged. Real constructor/config tests cover both patterns on HTTP and stdio; a fresh base/head production-module probe reproduces compatibility. |
| M-A clarification | Confirmed: compatibility only, **not a grant or mode** | `51cf9b1e`: four real modern stdio/framework cases (both patterns × storage false/true) advertise the extension and attempt registration, selected incoming, invalid-mode incoming and selected push notifications. The host supplies no context-only offer, no effective grant, no MCPL registry entry/handler, no channel registration, no stored payload or context-only row, no anchor change and **zero inference calls**. The tool-result read barrier follows the unsupported frames on the same pipe; this is not an idle-sleep assertion. Unit negative controls also refuse context-only against a modern connection's empty grant. MCPL controls require advertisement, storage opt-in, both effective grants and the exact validated selector; invalid modes remain refused, never downgraded. |
| L-A | Fixed | `553c8b4c`: docs explicitly say a pre-existing `channels.*` pattern already opts that server into an advertised context-only leaf once the profile is enabled; naming the leaf literally is not required. Existing/new positive MCPL wildcard tests pin that behavior. |
| L-B | Addressed with the explicitly permitted **single-version assumption** option | `5e097a73`: call-site comment and public doc state that the bounded fast path assumes the v1 floors this implementation writes; a future additional floor format requires a store-wide compatibility check. No additional scans or runtime storage-policy changes. New test refuses a discovered unsupported current floor, then deliberately puts a newer marker on an unvisited branch and confirms the current-v1 shortcut does not inspect it. This makes the limitation executable, not a claim that mixed-version stores are supported. |
| L-C | Fixed | `b2045133`: `stored()` now includes assistant rows, preserving their content and metadata, with a positive non-arrival-class assertion. The widened final corpus remains byte-identical against fixed base. It compares 2 assistant rows per ordinary/required wake scenario, 1 coalesced assistant row and 3 active-answer assistant rows for each profile spelling; see `corpus-assistant-coverage.txt`. Other non-arrival classes such as clock rows are not claimed to be covered by this projection. |
| L-D | Fixed | `17569e9f`: docs and changelog number **five** compatibility/diagnostic deltas. New #4 is granted-incoming/profile-off selector refusal instead of ordinary acceptance; new #5 is local-leaf naming in masked-capability logs and `maskedCapabilities`, without changing effective grants or `deniedCapabilities`. The PR draft below has the same numbered list. Fresh real-transport/status probes verify both surfaces on base and head. |

Earlier deferred findings remain out of scope: L3 (isolating the live context-only locus witness), L4 (loss of the sole floor-bearing branch), L5 (diamond-lineage over-restriction), L7(b) (profile-on real fork seeding) and L8 (enumerable private symbol). L7(a)'s discovered-unsupported-floor witness is now covered as the direct overlap with L-B; no other deferred fix was bundled.

### Source and admission boundaries

`production-diff.txt` contains the complete production-source delta for this round:

- `src/mcpl/protocol-family.ts`: import/reuse `isKnownCapabilityPath`; skip the local storage extension in the modern-family policy check. No grant algorithm changes.
- `src/framework.ts`: **comment only**, in the context-only reader-floor block. No runtime statements changed.

`admission-runtime-unchanged.diff` is empty for `inbound-admission.ts`, `server-connection.ts`, `channel-registry.ts`, `inference-router.ts`, `push-handler.ts` and `admission/admit.ts` against the reviewed parent. Required admission's closed refusal vocabulary, ordered drain, held inference dispatch/release, `requiredFlushDispatching` and mayWake-only module ceiling are untouched. No new admission seam was introduced.

Other changed paths: two existing docs/changelog files, the two existing tests, the shared corpus helper, and new `test/context-only-modern.test.ts` / `test/fixtures/context-only-modern-child.mjs`. `changed-files.txt` lists exact additions/deletions. No tracked generated files or lockfiles changed. Build/archive scratch is under ignored `data/` and `dist/`, never evidence.

## Verification Gates

### Required final-head gates (new runs, not inherited passes)

Command form:

```sh
orgasmic dispatch gate <gate> -- systemd-run --user --scope \
  -p MemoryMax=16G -p MemorySwapMax=0 \
  "$ORGASMIC_EVIDENCE_DIR/run-full.sh" <tree> <node-bin>
```

The runner logs Node version, tree, PID and process group; unsets `NODE_OPTIONS`; sets `AF_TEST_CONCURRENCY=4`; then runs `npm run clean`, `npm run typecheck`, `npm run build`, `npm test`. It uses no custom loader/loopback guard.

Final trees are fresh archives of `51cf9b1e` under the assigned worktree's ignored `data/head-round2-final-23` and `data/head-round2-final-12`, with shared installed dependencies. `final-23-source-integrity.txt` and `final-12-source-integrity.txt` verify all **726 tracked blobs** against the exact final commit, excluding generated dist/dependencies. `scope-limits.txt` records both final scopes at MemoryMax=17179869184 and MemorySwapMax=0 while active.

| Gate | Node | Typecheck/build | Tests | Pass | Fail | Skip |
|---|---|---|---:|---:|---:|---:|
| full-final-22-23-3 | 22.23.3 | pass/pass | 9763 | 9700 | 0 | 63 |
| full-final-22-12-0 | 22.12.0 | pass/pass | 9763 | 9700 | 0 | 63 |

Logs are `full-final-22-23-3.log` / `full-final-22-12-0.log` and the corresponding `gate-<name>-*.log` receipt logs in this evidence directory. Both owned sessions completed successfully at the final committed sources. On each version: **+8 tests / +8 passes** versus the reviewed parent, or **+54 tests / +54 passes** versus the historical fixed-base counts; no new failures or skips.

### Corpus and targeted production checks

| Gate | Command / scope | Result / evidence |
|---|---|---|
| no-config-differential-final | `run-corpus.mjs <final-23-archive> <base-archive> corpus-base-final.json`, then the same runner with the final archive as target, then `diff -u` | **exit 0**, byte-identical including assistant rows. SHA-256 for both: `31c0b6de00987cfa0885a54aea247cb6280e9f4d59ac48653c77b3b8be6221b9`. Log: `no-config-differential-final.log`. |
| compatibility-surface-probes-final | `node compatibility-surfaces.mjs data/base-gate data/head-round2-final-23` (absolute paths in receipt) | **exit 0**. Real modern constructors accept both patterns on base and head. Real loopback ingress with incoming granted/profile false: base accepts/stores the selected item; head returns `capability_denied` and stores none. Real handshake logs/operator status add exactly the masked local leaf; grant and denied lists stay equal. Log: `compatibility-surface-probes-final.log`. |
| modern-negative-controls-compiled | `node --test --test-timeout=600000 <final-23-archive>/dist/test/context-only-modern.test.js <final-23-archive>/dist/test/mcp-protocol-family.test.js` | **45 pass / 0 fail** at final committed sources, including all four wire negative controls and the MCPL advertisement/grant/mode matrix. Log: `modern-negative-controls-compiled.log`. |
| modern-policy-red-control | New modern acceptance tests run against the verified, unfixed `a5b02a07` archive's built production modules; generated copied test only | **Two expected failures**, both pattern cases, wrapper exit 0 after checking that exact red count. Raw failures: `modern-red-control-raw.log`; wrapper: `modern-policy-red-control.log`. No final/baseline source was mutated. |

The corpus still projects out generated source receipts, acceptance clocks and deferred IDs, normalizes the generated connection-instance segment of coalescing subjects and generated push inference IDs. Sender metadata, arrival and assistant content/metadata, ordered results, admission decisions, anchor/lifecycle/typing/repin counters, published output, active injection/send suppression, fork seeds and branch count are compared. Full gates remain broader coverage than this finite projection.

Earlier scoped checks this round: modern policy + delivery **77/77**; floor tests **8/8**; assistant corpus **1/1**. Two intermediate full runs at `17569e9f` completed **9,759 tests / 9,696 pass / 0 fail / 63 skipped** on each Node version, but are **not** the required final receipts: the additional negative controls arrived while those runs were active, so the final head is tested afresh above.

Development failures retained and resolved: the first custom modern fixture used the old initialize handshake rather than modern discovery, failing four new harness cases; its cleanup ordering also removed the directory before stop. The fixture now implements the actual pinned modern discovery/result format and stop precedes removal. A subsequent fixture incorrectly awaited server-request responses that the modern family does not provide, causing a timeout; only that proven gate owner was interrupted (`modern-probe-wait-processes.txt`). The final control sends unsupported notifications followed by a successful tool-result read barrier, so it assumes neither a response channel nor a timing threshold. Both source and final compiled focused runs pass. No production workaround or test skip was added.

`git diff --check a5b02a07..HEAD` passes (`diff-check.txt`). All added runtime code is generic; no connector literals or operational identifiers were added to shipped files or commit messages.

### Inherited evidence and limits

No prior gate pass substitutes for a required gate in this round. Prior receipts cannot certify changed gate inputs, and the archived baseline runs' wrapper HEAD moved during their original invocation.

Valid inherited comparison data is explicitly historical:

- Fixed `c848977f` baseline on each Node version: **9,709 tests / 9,646 pass / 0 fail / 63 skipped**, from the prior run's `base-full-22-23-3.log` and `base-full-22-12-0.log`.
- Reviewed parent `a5b02a07` on each version: **9,755 tests / 9,692 pass / 0 fail / 63 skipped**. Those are parent counts, not new-head passes.
- `inherited-evidence.txt` records the original absolute log paths, headers, footers and receipt status. Their source scope is unchanged: fresh `base-source-integrity.txt` verifies all **715 baseline tracked blobs**; `previous-head-source-integrity.txt` verifies all **724 parent blobs**. This work installed/changed no dependencies. No baseline full rerun was assigned here.
- The original profile-off corpus hash is not reused: its projection changed for L-C, and the widened corpus was executed anew. Review mutation claims likewise are not treated as new proof.

## Unmet Criteria

None within this round’s approved scope. All required gates passed at the final committed sources, and the added clarification controls passed. The explicitly permitted L-B assumption option is implemented/documented/tested; it is not a mixed-version compatibility implementation. Previously deferred findings remain unmodified except the directly overlapping discovered-floor witness noted above.

## Residual Risk

- The permitted L-B assumption option does **not** enforce cross-branch mixed-version compatibility: a supported current/first-discovered v1 floor short-circuits later branches. A future additional floor version must change that policy before deployment. Floorless stores still need O(branches) fallback; unreadable branches contribute no floor with diagnostics.
- Deleting the sole floor-bearing branch can still remove downgrade protection for other stamped history (deferred L4). Dependencies still have no application minimum-reader gate. Enabling remains one-way; older framework code would treat stamped rows as conversational and is unsupported for rollback.
- Production profile enablement remains a separate decision. A `channels.*` allow-list already counts as per-server opt-in once the profile is enabled and the MCPL peer advertises the leaf.
- No live connector/provider qualification or external dependency work. Local extension spelling remains unratified; generic initialize offers remain future work. Remaining witness/lineage/symbol-discipline gaps are the explicitly deferred LOWs, not claimed fixed by the modern controls.

BEGIN PR BODY

## Problem

Some incoming messages should enrich later context without opening channels, moving reply anchors, injecting into an active answer or waking conversational inference. The restriction must be host-owned and durable, not authority supplied by sender metadata.

Stacked on **#906 (required inbound admission)**; review and merge that first. No dependency companion changes are included.

## Changes

- Add per-item `delivery: "context-only"` on `channels/incoming`, ordered results and a private restriction-only effect plan. Required admission can refuse or narrow it, never lift it.
- Keep `contextOnlyStorage` default-off. Offering the local `experimental.mcpl.channels.contextOnly` extension requires explicit storage enablement; delivery requires an MCPL-family advertisement, both effective incoming/context-only grants and the exact validated mode. Per-server `enabledCapabilities` opt-in is required; an existing `channels.*` pattern already counts once storage is enabled. The local leaf is excluded from feature-set `uses`.
- Keep these configuration patterns inert on modern-family MCP servers, as before. Config acceptance supplies **no MCPL offer, grant or delivery mode**, even with storage enabled; unsupported traffic is not converted into a normal wake. Four real modern-wire negative controls cover both patterns and both storage settings.
- Persist host-owned versioned classification through ordinary/deferred writes, recovery, sharding and summary-source history. Context-only has no open repair, anchor/locus change, conversational inference, live injection, repin or send-suppression reset. Maintenance may still run.
- Record the one-way reader floor before offering the capability; guard fallback branch-read failures and check the current branch first. The bounded shortcut explicitly assumes only v1 floors. It does not inspect later branches for a newer version after finding a supported floor; another floor format requires a store-wide compatibility check.
- Trace refusals with closed reasons and payload-free, rate-limited registry diagnostics; diagnose unsupported push notifications.

## Compatibility and diagnostic deltas

1. With the profile enabled, `inboundDelivery` is host-reserved and overwritten on all write lanes. With it off, historical sender values remain unchanged.
2. Any top-level `delivery` field on push/event is rejected before taps or effects, independent of profile/grants, as `-32602 unsupported_combination`; notifications are diagnosed. No-field push keeps existing behavior.
3. After initial policy, an ungranted incoming batch containing any item `delivery` field gets ordered `capability_denied` results instead of the JSON-RPC capability error. Before initial policy, the phase-aware error remains; no-field batches keep the existing error.
4. Even with incoming granted, `delivery: "context-only"` with the profile off gets ordered `capability_denied` instead of ordinary acceptance with an ignored field. Invalid selectors get `invalid_delivery`; selection is never silently downgraded.
5. Masking an advertised local leaf (for example, `channels: true` plus `disabledCapabilities: ['channels.*']`) additionally names `channels.contextOnly` in masked-capability logs and operator `maskedCapabilities`, including with the profile off. Effective grants and `deniedCapabilities` are unchanged by that naming.

**One-way enablement:** a discovered reader floor requires the enabled compatible profile; unknown/malformed row stamps never supply conversational authority. Rolling back to framework code older than this change is unsupported and would treat stamped rows as conversational, because current dependency open APIs have no minimum application-reader gate. Unreadable floors and deletion of the sole floor-bearing branch remain limitations. Production enablement is a separate decision. Never automatically resend or downgrade an uncertain context-only acknowledgement.

## Tests

Full `npm test`, preceded by clean/typecheck/build, under systemd user scopes with MemoryMax=16G / MemorySwapMax=0, concurrency 4 and no custom NODE_OPTIONS loader:

- Node 22.23.3: **9,700 pass / 0 fail / 63 skipped** (9,763 tests).
- Node 22.12.0: **9,700 pass / 0 fail / 63 skipped** (9,763 tests).
- Historical fixed #906 baseline on each version: **9,646 pass / 0 fail / 63 skipped** (9,709 tests); not rerun for this follow-up.

The widened base/head profile-off corpus is byte-identical after projection of generated identities/receipts/times, now including assistant content and metadata. It covers ordinary/required wakes, incoming/push stored shapes, anchors, lifecycle, typing, coalescing, holds, active-answer injection/repin/send suppression, real fork seeds and a multi-branch restart. Focused tests cover modern compatibility without grants/modes, unchanged MCPL advertisement/grant/mode requirements and the reader-floor assumption. Existing context-only recovery, compaction and no-effect tests remain in both full suites.

## Not verified / Out of scope

No live connector/provider end-to-end qualification, production enablement, reply-routing extension, external source changes, generic offer facility or dependency reader-floor backport. No deduplication or zero-maintenance-compute guarantee. Remaining ingress-witness, lineage, enabled-fork and private-symbol follow-ups are not bundled here.

## Maintainer questions / follow-up

- Confirm the local extension spelling pending specification agreement and a future generic initialize-offer extension. This uses the existing typed MCPL offer builder only with storage enabled.
- Add a minimum-reader/classification gate in the dependency/storage open path before supporting old-code rollback, and replace the v1-only branch shortcut before introducing another floor version. The audited dependency evidence is in `docs/context-only-delivery.md`.

AI-assisted implementation with GPT-6.1-Sol; co-author trailers included.

END PR BODY
