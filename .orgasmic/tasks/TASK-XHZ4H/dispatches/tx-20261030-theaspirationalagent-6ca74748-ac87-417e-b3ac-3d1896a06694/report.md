# Context-only delivery implementation report

## Changed

- Start: `119cb8662d8e3d33f5aedf3633cb95ca6ec7dce1` (verified; no rebase).
- Final local commit: `a96ca7c172697632e28d5e7e707ec1c39c735403`. Exact requested author, committer and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. No push or PR.
- Opt-in wire selector, current incoming/contextOnly grants, ordered results and closed refusals; restriction-only private effects at registry admission, framework admission and downstream consumers.
- Default-off host-owned v1 classification at existing content/deferred-write boundaries, restrictive malformed/future readers, sharding/recovery/history lineage and one-way startup floor across branches.
- Push refuses any top-level delivery field before taps/holds, independent of profile. Enabled-profile reserved-key collision handling covers incoming, ordinary and push writes.
- Docs and changelog describe both deltas, unsupported old-code rollback, separate production enablement, and pending maintainer decisions.
- Recovery reviewed the prior JSONL and worktree before edits. Found/fixed a startup cleanup regression: use the existing current-branch store instead of closing an unnecessary view. Updated old closed-vocabulary assertions for the intentional additional leaf. No dependency or lockfile changes; generated dist output is untracked/ignored.
- Instructions read: supplied project baseline (no additional operating constraints), CONTRIBUTING.md; no supplied convention or gotcha entries. Normative pinned design read. Production change remains well below the approximately 900-net-line alarm and within allowed runtime paths.

```text
 changelog.d/context-only-delivery.added.md         |  19 ++
 docs/context-only-delivery.md                      | 104 ++++++
 src/admission/admit.ts                             |   8 +
 src/framework.ts                                   |  88 ++++-
 src/mcpl/capability-grant.ts                       |   6 +-
 src/mcpl/channel-registry.ts                       |  16 +-
 src/mcpl/inbound-delivery.ts                       |  45 +++
 src/mcpl/push-handler.ts                           |  10 +
 src/mcpl/server-connection.ts                      |  21 +-
 src/mcpl/types.ts                                  |   6 +
 src/stored-injections.ts                           |  59 +++-
 src/types/framework.ts                             |   2 +
 test/context-only-delivery.test.ts                 | 376 +++++++++++++++++++++
 test/context-only-routing-architecture.test.ts     |  44 +++
 test/fixtures/context-only-queue-child.mjs         |  14 +
 test/mcpl-capability-grant.test.ts                 |   7 +-
 ...uting-runtime-has-no-connector-literals.test.ts |   3 +
 17 files changed, 803 insertions(+), 25 deletions(-)
```

## Verification Gates

Every Node/npm/test/mutation invocation was under the required `XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 -- timeout 1800 orgasmic dispatch gate NAME -- COMMAND` envelope. Scope preflight passed: `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-recovery-scope-preflight-01M664FR3K1GYVBY0HW6J47H59.log`.

`clean-env-v2.sh` disables notifiers/audit/fund, supplies empty npm user/global configs, scrubs provider/platform credentials and loads the loopback-only preload. Both final engine gates repeat negative TCP/TLS/HTTP/fetch/DNS/UDP probes, positive loopback HTTP, and an environment-scrubbed child inheritance probe. Dependency acquisition was offline with scripts disabled; no dependency changes or test-time external network were required.

### Counts (actual full runs, not adjusted totals)

| Tree / Node | Tests | Pass | Fail | Skip | Typecheck / build |
|---|---:|---:|---:|---:|---|
| Start / 22.23.3 | 9601 | 9532 | 6 | 63 | passed |
| Start / 22.12.0 | 9601 | 9532 | 6 | 63 | passed |
| Final / 22.23.3 | 9632 | 9564 | 5 | 63 | passed |
| Final / 22.12.0 | 9632 | 9564 | 5 | 63 | passed |

The full-suite receipts are **not green**. Four final failures are guard/environment interactions reproduced on pristine start-commit source with the same v2 guard: the stdio invalid-argument error index changes because child guard flags are prepended, plus three packaging tests that inspect child argv. The pristine probe is 68 pass / 4 fail / 0 skip, 72 tests. Original baseline used guard v1 and had six environment-sensitive failures; do not equate its failure set with the final v2 set.

Each final full run has one additional cross-run fixture collision: 22.23.3 EventGate sleep hit missing temporary storage; 22.12.0 reconnect's first-attempt fixture saw another attempt's success. Both suites share fixed fixture paths (for example event-gate-sleep uses `dist/.test-tmp-gate-sleep`). The two affected files were then rerun **sequentially on each engine**, 61/61 passing each. No unresolved production regression was identified. Concurrent full-run counts above remain unmodified; isolated passes do not turn failed full receipts into passes.

| Gate | Command after envelope | Result | Log |
|---|---|---|---|
| baseline-22-23-3 | `clean-env.sh bash -c: typecheck; full suite; build` | 9532/6/63; baseline evidence | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-baseline-22-23-3-01M662FPN8Q7T2ERW8D7NJJ79K.log` |
| baseline-22-12-0 | `clean-env.sh bash -c: select 22.12.0; typecheck; full suite; build` | 9532/6/63; baseline evidence | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-baseline-22-12-0-01M662WCGWJ3S60Y8YAB76E8ME.log` |
| final-22-23-3 | `clean-env-v2.sh bash -c: node --version; guard-probe; npm run typecheck; npm run build; AF_TEST_CONCURRENCY=4 npm test` | typecheck/build pass; full 9564/5/63 | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-final-22-23-3-01M664WJTCWND2C178W9M6GFG7.log` |
| final-22-12-0 | `clean-env-v2.sh bash -c: PATH=/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH; node --version; guard-probe; npm run typecheck; npm run build; AF_TEST_CONCURRENCY=4 npm test` | typecheck/build pass; full 9564/5/63 | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-final-22-12-0-01M664WNFPSEAJ8K9N6GHB2BKY.log` |
| final-context-only-focused | `clean-env-v2.sh node --test --test-force-exit dist/test/{context-only-delivery,context-only-routing-architecture,routing-runtime-has-no-connector-literals,mcpl-capability-grant}.test.js` | 51 pass, 0 fail | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-final-context-only-focused-01M66560HAB33B2Q52KK1QKX1K.log` |
| recovery-corrected-focused | `clean-env-v2.sh bash -c: npm run typecheck; npm run build; node --test --test-force-exit [delivery/architecture/vocabulary/compression/state-read files]` | 89 pass, 0 fail; dirty-tree diagnostic only | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-recovery-corrected-focused-01M664TPD5FYDKHPKWWN5H2D6F.log` |
| final-cleanup-focused | `clean-env-v2.sh node --test --test-force-exit dist/test/failed-create-releases.test.js` | 11 pass, 0 fail | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-final-cleanup-focused-01M664XFQR55WNMCYDGT284190.log` |
| final-isolated-followup | `clean-env-v2.sh bash -c: node --test --test-force-exit dist/test/{event-gate-sleep,mcpl-reconnect-events}.test.js; select Node 22.12.0; repeat` | 61 pass, 0 fail on each engine | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-final-isolated-followup-01M665D6Y2KSWKNR8MVYSNCGFV.log` |
| final-no-config-differential | `clean-env-v2.sh bash -c: node no-config-corpus.mjs no-config-final.json; python3 compare-no-config.py` | 20 deliveries match baseline projections | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-final-no-config-differential-01M664XD7KKRPXNKZ50RGC6BNR.log` |
| baseline-guard-v2-probe | `clean-env-v2.sh bash -c: cd pristine start-commit scratch snapshot; npm run build; copy fixtures; node --test --test-force-exit dist/test/{mcp-recorded-text,pack-installs-alone}.test.js` | 68 pass, 4 inherited guard failures | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-baseline-guard-v2-probe-01M664YMDFAC2ASR1W1HQ9QQQN.log` |
| recovery-mutations-r2 | `clean-env-v2.sh bash -c: cd isolated compiled snapshot; python3 /tmp/xhz4h-mutations-r2.py` | 10/10 killed by intended assertions | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-recovery-mutations-r2-01M664S49D4ZMT7M3HNHE24KG5.log` |
| architecture-red-probe | `clean-env-v2.sh bash -c: cd isolated final snapshot; node --test dist/test/context-only-routing-architecture.test.js; require exit 1 and forbidden-literal diagnostic` | red assertion proved; final architecture green | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/gate-architecture-red-probe-01M665E9JFV6ZKKWZR6ZHYZ9XY.log` |

Exact scripts/argv are retained in the named evidence scripts and session JSONL. Final clean receipts were run on the final SHA. Dirty/moved-head exploratory receipts are not reused as clean passes. In particular recovery-final-22-23-3 found cleanup/vocabulary issues before their correction and is superseded. The first push mutation hit the deliberately held request timeout; r2 instead targets the ready-connection assertion and is the qualifying battery.

The no-config corpus compares ordered results and stored participant/content/metadata, including reserved-key collisions with the profile omitted and false. Only 30 per-run inferenceId/connection-binding differences are excluded; all other keys, values, bytes and ordering agree. It is not a claim that nondeterministic runtime IDs are byte-identical.

### Mutation table

All mutations alter isolated compiled output, restore it in finally, and execute the real delivery tests. They do not leave source mutations in the final commit. Architecture red probe separately mutates a source snapshot.

| Fault restored | Result / intended witness | Log |
|---|---|---|
| grant-check-dropped | Killed: not ok 6 - B3 C5: ungranted/unknown channels are refused, no lazy registration; not ok 7 - B3: current grant is narrowed between messages and across the admission await | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-grant-check-dropped.log` |
| push-accepts-field | Killed: not ok 1 - B4: push selector is refused, never silently downgraded on a ready connection | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-push-accepts-field.log` |
| metadata-tags-honoured | Killed: not ok 4 - B2: nested metadata.tags cannot select context-only without the field; incoming, ordinary and push strip only the enabled reserved key | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-metadata-tags-honoured.log` |
| open-repair-not-suppressed | Killed: not ok 2 - C1 C2 B4: drift stays closed with desired open; an existing default is not retargeted and no publish right is granted | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-open-repair-not-suppressed.log` |
| anchor-not-suppressed | Killed: not ok 1 - B1 C1 C2: idle context-only stores once without open repair, null default, anchors, typing, status or inference; a later turn sees it; not ok 2 - C1 C2 B4: drift stays closed with desired open; an existing default is not retargeted and no publish right is granted | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-anchor-not-suppressed.log` |
| stamp-not-persisted | Killed: not ok 1 - B1 C1 C2: idle context-only stores once without open repair, null default, anchors, typing, status or inference; a later turn sees it; not ok 3 - B2 C3 C4: forged tags, nested metadata.tags, reserved stamps and foreign server identity cannot lift the selector or module suppression | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-stamp-not-persisted.log` |
| malformed-promoted | Killed: not ok 17 - B5: malformed and future stamps never promote conversational authority; unstamped history retains legacy semantics | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-malformed-promoted.log` |
| downgrade-allowed | Killed: not ok 16 - B5: restart/history replay retain classification and decisions; disabled/ignored profile refuses one-way history without restoring stale rows | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-downgrade-allowed.log` |
| reserved-key-not-stripped | Killed: not ok 3 - B2 C3 C4: forged tags, nested metadata.tags, reserved stamps and foreign server identity cannot lift the selector or module suppression; not ok 4 - B2: nested metadata.tags cannot select context-only without the field; incoming, ordinary and push strip only the enabled reserved key | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-reserved-key-not-stripped.log` |
| advertisement-without-profile | Killed: not ok 12 - B3: no offer or grant without explicit persistence; local leaf is excluded from feature-set uses | `/home/orgasmic/.orgasmic/runs/run-01M6629SJZ1Q0E6H5WVBAX4E6B/evidence/mutation-r2-advertisement-without-profile.log` |

The anchor fault restores both the upstream locus veto and the downstream defensive guard so the real production-path anchor witness also fails. Reserved-key mutation restores sender retention at ingress and write boundary. Push r2 fails the actual ready-connection refusal assertion, not an import, syntax, or timeout failure. The additional architecture probe catches an injected forbidden connector string in inbound-delivery source.

### B/C test mapping

All references below are named tests in `test/context-only-delivery.test.ts`:

| Requirement | Witness |
|---|---|
| B1 | idle/later legitimate turn at line 39; active real streamed answer at 232 |
| B2 / G-T1 | forged top-level/nested tags, stamp and server at 71; no-field/all-lane collisions at 98; unrelated connections with colliding channel ids at 347 |
| B3 | mixed value/type/case/coalesce/tag refusals at 112; unknown/ungranted at 126; grant narrowing at 134; missing incoming grant batch at 337 |
| B4 | closed drift/no publish right at 57; push pre-tap/pre-hold off/on at 156; ready push at 358 |
| B5 / G-T3 | restart/history/disabled or omitted profile at 207; malformed/future at 221; abrupt process queue reconstruction at 270; sharding at 282; real mixed compaction source lineage at 291 |
| B6 | no gate/probe/inference permission at 188; maintenance-only compression at 291 |
| C1 | actual/desired/default state snapshots at 39, 57; tuned-out bookkeeping suppression at 365 |
| C2 | null and existing defaults at 39, 57; defensive anchor boundary at 329 |
| C3/C4 | repin/rearm suppression and module-request veto at 71; active-answer suppression at 232 |
| C5 | no lazy registration at 126 |
| C6 | contradictory normal-wake/core-closure tags and coalesce at 112 |
| C7 | two entries/zero wakes and uncertain responder ACK without automatic replay at 197 |
| Required-hook composition | store refusal and both host wake ceilings at 146 |
| Advertisement / decoder | default-off offer/grant and uses exclusion at 169; old closed decoder compatibility at 179 |
| No-config identity | separate captured start/final ordinary incoming and push differential corpus |

Runtime AST checks cover new delivery/storage/admission helpers and their local runtime import closure, plus the existing routing architecture inventory. Summary provenance uses context-manager's existing source IDs and original rows, never summary prose; inherited compiled context is nonconversational.

### Binding dispatcher answers (quoted)

> A1 (offer facility): Proceed using the existing MCPL host-capability offer builder for the experimental.mcpl.channels.contextOnly leaf; generic initialize-extension offer support belongs to slice E. The leaf is offered only when the context-only storage profile is explicitly enabled (default off, tested); minimal and typed, no connector names; record it as a maintainer question in PR body and docs.

> A2 (O1 vs old readers): the NEW reader fails closed at startup when stamped rows exist and the profile is disabled/ignored (tested); unknown/malformed/future stamps never promoted; profile default-off and never offered without enablement; docs, changelog and PR body state plainly that enabling is one-way and rolling back to older framework code is unsupported because context-manager/Chronicle have no minimum-reader gate; that gate is a maintainer question and follow-up; do not touch context-manager; production enablement is a separate owner decision.

> A3 (push lane): a push/event carrying a top-level `delivery` field is refused before any effect with `unsupported_combination`, whatever its value, gated only on presence of the field; push without the field stays byte-identical to the base; document as the second wire delta next to the reserved-key collision delta; keep the mutation 'push accepts field'.

### Stop-and-ask evidence / disposition

Prior questions were answered by the binding decisions above; no unanswered external-change decision remains. D uses the existing typed offer facility rather than adding generic initialize extensions. Audited context-manager 0.24.1 `src/context-manager.ts:518–545,568–580` opens/registers without an application-reader compatibility floor; `src/message-store.ts:686–720,2347` retains opaque row metadata; `src/types/strategy.ts:2430–2438` exposes summary source IDs, and `src/context-manager.ts:2449–2452` exposes summary lookup. Chronicle 0.5.1 `index.d.ts:89–101,276` has no minimum-reader gate. Exact extracted evidence and integrity are in `persistence-preflight.txt` and offer evidence in `initialize-offer-preflight.txt`. No companion package was touched; existing provenance supports this slice. A future application-reader minimum-version check is follow-up, not silently claimed implemented here.

## Unmet Criteria

- Full-suite gates are not wholly green: four reproduced guard/environment failures and one concurrent-fixture collision per engine. Isolated collision follow-up passes both engines; full counts remain reported honestly.
- No live connector/provider qualification, protocol ratification, generic initialize-offer extension support, old-binary rollback safety, production enablement, push context-only support, push/PR, or deployment was performed or authorized. These are exclusions/follow-ups, not implemented claims.

## Residual Risk

Enabling is one-way. The new reader guards its durable host floor and never treats malformed/future classification as conversational authority, but older framework code does not know this floor and can misread stamped history. Context-manager/Chronicle cannot enforce an application minimum reader today. Production enablement needs a separate owner decision. The leaf and feature-set uses treatment remain a local extension pending slice E and maintainer acceptance. Synthetic tests do not establish live connector behavior or automatic retries in external connector implementations. Full-suite environment sensitivity and cross-run fixed test fixtures remain outside this runtime slice.

<!-- PR BODY START -->
## Problem

Connectors need to retain ambient channel context without opening a channel, moving reply anchors, injecting into an active answer, or scheduling conversational inference. This depends on slice A (#906); review and land A first.

## Changes

- Add default-off `contextOnlyStorage`, the local sibling `experimental.mcpl.channels.contextOnly` offer and `channels.contextOnly` grant, and per-item `delivery: "context-only"` validation/results. Both current incoming and contextOnly grants are required; the new leaf is excluded from feature-set uses.
- Apply a private restriction-only effect plan and durable host-owned v1 classification through deferred recovery, sharding and source-history/compaction provenance. Required admission can further restrict or refuse storage.
- Document two compatibility deltas: enabled-profile reservation of inboundDelivery on every write lane; unconditional rejection of any top-level delivery field on push/event as unsupported_combination. No-field push and unconfigured ordinary delivery retain baseline behavior.
- Enabling is one-way. The new reader refuses disabled/omitted profiles over enabled history. Rolling back to older framework code is unsupported because context-manager/Chronicle have no minimum-reader gate. Adding that gate is a maintainer question and follow-up. Production enablement is a separate owner decision.
- Use the existing typed host-capability offer builder. Generic initialize-extension offers, protocol acceptance and the local leaf's graduation remain maintainer questions for slice E.

## Tests

Node 22.23.3 and 22.12.0 typecheck/build pass. Full suites on each: 9,564 pass / 5 fail / 63 skip (baseline on each: 9,532 pass / 6 fail / 63 skip). Four final failures reproduce on pristine base under the same test environment; the additional shared-fixture failure on each engine passes in sequential isolated reruns (61/61 per engine). Focused delivery/architecture/capability tests: 51/51. Ten behavior mutations are killed, the forbidden-literal architecture probe is red, and a 20-delivery no-config corpus matches baseline content/metadata/results apart from generated IDs.

## Not verified / out of scope

No live provider or connector qualification. No dependency changes, old-code rollback guarantee, push context-only support, automatic uncertain-ACK replay, protocol ratification, or production enablement.

AI-assisted implementation with GPT-6-Astra.
<!-- PR BODY END -->
