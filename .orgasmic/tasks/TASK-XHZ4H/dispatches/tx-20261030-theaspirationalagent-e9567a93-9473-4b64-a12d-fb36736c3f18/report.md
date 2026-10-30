# Context-only delivery: four-LOW follow-up

## Changed

- Parent: `3b075de1a1a2afd006f21964671f977897d28a80`.
- Final head: **`b6e225e07a8214894c3f721dfb14ac0c1cf75714`**.
- Read review 3 in full. Fixed only its four LOWs and the binding version/metadata clarifications.
- Four local per-concern commits, no rewriting: `4477b96b` (L1), `f62712de` (L3), `b8c91512` (L4), `b6e225e0` (L2). Author and committer: `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`; each carries `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. Exact metadata: `commit-identities.txt`.
- No push, PR, merge, dependency/source change outside this repo, package installation or production enablement. No lockfiles or generated builds committed; builds/checkouts remain under ignored `dist/` and `data/`.
- Human owner is **Vasyl**. Engineering answers to dispatch asks are those of **task operator Tarn**, not owner consent. This corrects the attribution in the prior rebase report without rewriting that historical artifact; the separate correction already supplied with that report remains applicable.

### Disposition

| Finding | Fix | Evidence |
|---|---|---|
| L1 | Before logging/writing the seed, an enabled profile now throws if normalization changes row count. No shifted stamp or partial seed can be persisted. The profile-off path is unchanged. | Version/hash-bound child fixture runs the real fork creation method with an ordinary then context-only compiled seed. The preserving normalizer keeps both classifications; a stub dropping the first row causes refusal, no registered fork/reserved name, and an empty failed-fork namespace. Red control against the original built parent fails with “Missing expected rejection”; fixed control passes on both Nodes. |
| L2 | Added one ordinary synthetic assistant row with non-reserved nested metadata through the public context-manager write API inside the existing corpus fixture. No real history, selector, forged stamp or context-only grant. | The projection asserts the complete metadata object survives unchanged. Three focused controls exercise omitted/false/true storage profiles. Generated replies in other scenarios are honestly labelled content-only witnesses. The widened base/head corpus is byte-identical, and removing only the new control reproduces every original byte of the previous comparison. |
| L3 | Reworded `refuseCapability`: uniform across storage profiles, but selector-bearing incoming batches after initial policy have ordered per-item refusals; other requests use the capability error and notifications are diagnosed. | Comment-only diff; full server-connection token stream equals the reviewed parent. |
| L4 | Both comments explicitly distinguish state-dependent grant refusal from the content/state-independent `-32602 unsupported_combination` push-shape exception. It reveals only line receipt, as ping already does. | No code moved or runtime token changed; the existing paused-plane push controls remain in both full suites. |

Changed files are listed in `changed-files.txt`. Production changes in this round are only the seven-line fork-seed guard/comment and server-connection comments. The documentation addition scopes what the assistant-metadata control actually qualifies.

### Dependency binding (do not cross versions)

The assigned checkout's `package-lock.json`, installed `node_modules/.package-lock.json`, and installed package manifest all resolve **context-manager 0.24.1**.

- Resolved tarball integrity in both locks: `sha512-+w8a/I11CmK/8jIuB5+NbnsIULAkpX4uve0jULUQ3nuIanmwLRQkTVTJ8Z5mK+EjGNjoXMlR7fQvsrP9gJBKZA==`.
- Installed `dist/src/normalize-tool-messages.js` SHA-256: `dcfff6de61ea5e77ea2d75100a29021d79ba1e45844302cd8b34ffcc2526701a`.
- The production comment names that exact version/hash. The executable fixture checks installed version **and** normalizer hash before using the dependency/stub; a dependency update requires a new audit rather than silently carrying this witness forward. The runtime cardinality guard itself protects any version that drops rows.
- Task operator Tarn clarified that the **A+B+D integration tarball is not built yet**, will take D's lock, and has no separate resolved integration artifact to verify now. This report does **not** claim an integration-set gate pass or an independently verified integration resolution.
- The separate sealed store-probe input is **0.24.0**, tarball SHA-256 `ee1e7682c09a26b9db0cef45c51467df654f8f7f6a91f8fd843caf697097cf24`. It was checked read-only against the supplied cache and SHA256SUMS, not extracted or analysed. It is a **different input**: **no 0.24.1 evidence is carried to 0.24.0, or vice versa**.

Raw dependency paths/lock entries/hashes: `dependency-inputs.txt`. Operator clarification: `operator-clarification.txt`. No external source was edited; module mocking changes only the test child's in-memory dependency export.

### Admission boundary

- `inbound-admission.ts` is byte-identical to refreshed A `869bb3ad`.
- All 13 inspected RequiredAdmission conditional blocks/methods in `server-connection.ts` are byte-identical to A. The whole file's token stream is identical to parent `3b075de1`: only comments changed in this round.
- Removing only the already-reviewed D wire seam leaves A's complete token stream unchanged. No admission ordering, epoch, held dispatch, flush, refusal or grant runtime changed.
- `verify-low-boundaries.mjs` and the passing `low-boundary-integrity-fixed.log` contain the executable comparisons; `git diff --check 3b075de1..HEAD` passes.

## Verification Gates

### Fresh required full gates at final head

Both invoked from the actual tested checkout with:

```sh
orgasmic dispatch gate <name> -- systemd-run --user --scope \
  -p MemoryMax=16G -p MemorySwapMax=0 \
  "$ORGASMIC_EVIDENCE_DIR/run-suite.sh" <node-bin>
```

The runner logs cwd/HEAD/Node/process ownership, unsets NODE_OPTIONS, sets `AF_TEST_CONCURRENCY=4`, and runs **clean → typecheck → build → npm test**. The new dependency-mock flag is local to the regression-test child; it is not a global loader or a gate bypass.

| Gate | Commit / checkout | Node | Typecheck/build | Tests | Pass | Fail | Cancelled | Skip |
|---|---|---|---|---:|---:|---:|---:|---:|
| lows-full-22-23-3 | `b6e225e0` / assigned checkout | 22.23.3 | pass/pass | 9687 | 9624 | 0 | 0 | 63 |
| lows-full-22-12-0 | `b6e225e0` / data/lows-head-12 | 22.12.0 | pass/pass | 9687 | 9624 | 0 | 0 | 63 |

Node paths: `/opt/node-v22.23.3-linux-x64/bin` and `/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin`. The 22.23.3 checkout is the assigned worktree; 22.12.0 is a clean real detached checkout at the same commit in `data/lows-head-12`, sharing unchanged installed dependencies. `scope-limits.txt` records both active scopes at MemoryMax=17179869184 / MemorySwapMax=0.

Logs: `lows-full-22-23-3.log`, `lows-full-22-12-0.log` and their `gate-<name>-*.log` receipts. These are **fresh executions**, not reused passes.

### Fresh focused and differential checks

| Gate | Scope / command after systemd prefix | Result |
|---|---|---|
| module-mock-preprobe | Both Node binaries with `--experimental-test-module-mocks data/context-only-module-mock-probe.mjs` | Both support the in-memory element-dropping stub; no dependency source edits. |
| fork-seed-red-control-valid | Original parent build + new child; wrapper requires exit 1 with “Missing expected rejection” | Expected red; `fork-seed-red-valid-raw.log`. This is not a production failure at final head. |
| lows-final-focused | Both Nodes: `node --test --test-name-pattern="fork seed normalization preserves alignment\|ordinary synthetic assistant metadata" dist/test/context-only-delivery.test.js dist/test/context-only-compatibility.test.js` | 4 pass / 0 fail on each Node; `lows-final-focused.log`. |
| expanded-corpus-differential | `run-corpus.mjs <current-head> <target> <json>` for base `869bb3ad` and head, then `compare-corpus.mjs <evidence-dir>` | Exit 0; byte-identical expanded base/head, metadata positive assertion, and exact old-field preservation. |
| lows-final-integrity | Boundary comparisons, four-commit/clean-HEAD checks for both tested checkouts, diff-check and corpus comparison | Exit 0; `lows-final-integrity.log`. |
| low-boundary-integrity-fixed | `node verify-low-boundaries.mjs`, `git diff --check`, zero inbound-admission diff and clean-tree assertion | Exit 0; zero admission changes, server comments only. |

The expanded corpus hash is **`07c83b08223c37ffbdd4ac4ec6619b7aa33df1a4cfcb73a8617905f17f36d4f2`** for both targets. Files: `corpus-expanded-base.json`, `corpus-expanded-head.json`; log `expanded-corpus-differential.log`.

The **previous result is retained separately and unmodified** as `corpus-previous-base.json` / `corpus-previous-head.json`, copied from the preceding run. Its SHA-256 remains `31c0b6de00987cfa0885a54aea247cb6280e9f4d59ac48653c77b3b8be6221b9`. This copied prior result is **historical, not fresh execution**. The new comparison explicitly proves that deleting only the added `assistantMetadataControl` field recovers those exact original bytes. The ordinary metadata control is additionally checked with the profile true, but this does **not** claim profile-on whole-corpus equality to pre-extension base.

Development probe failures are retained: the first stub assumed exactly two source rows, overlooking the ordinary notice generated by a prior successful spawn; it now verifies the intended first two classifications while permitting that notice. The first green-path cleanup assertion expected undefined instead of the public API's null; corrected to null. A static checker initially tried the compiler API no longer exported by installed TypeScript; switched to the repository's existing Babel parser. These were test/probe harness failures, not shipped behavioral fixes. Final focused/static/full checks supersede them; no skip or production workaround was added.

### Inherited evidence / limits

No earlier full gate pass certifies this head. The previous run at `3b075de1` recorded **9,683 tests / 9,620 pass / 0 fail / 63 skip** on each Node; refreshed A at `869bb3ad` recorded **9,629 / 9,566 pass / 0 fail / 63 skip**. These are historical counts, not rerun counts in this LOW round. Source scope for A is unchanged, and the earlier four-LOW parent is exactly this round's parent. The earlier baseline timeout and later successful baseline retry remain separate observations in their original report.

The prior rebase/range-diff, modern-wire negative controls, stream-declaration probes and floor findings remain historical evidence at unchanged relevant inputs; no fresh execution of those old probe scripts is claimed here. The current full suites re-exercise their committed tests. The corpus projection changed only for the requested ordinary metadata control, so its widened comparison was executed anew. Existing repository instructions/conventions context remains unchanged and was not replayed.

## Unmet Criteria

None within this four-LOW round. Both fresh full gates pass at the final committed head, adding 4 tests/passes over the reviewed parent without new failures or skips. No claims are made for the not-yet-built integration set or the separate 0.24.0 input.

## Residual Risk

- The length guard catches cardinality changes, not same-length dependency reordering. The pinned normalizer preserves order/cardinality; upgrades require re-auditing the bound witness.
- The L1 witness uses real fork creation/storage with a controlled dependency export; it is not a new end-to-end selected-wire fork-seeding qualification. Older deferred live-ingress/fork, locus, floor-branch deletion, lineage and symbol-discipline findings are not claimed fixed.
- The assistant control qualifies one ordinary synthetic metadata shape through the public context-manager API, not every assistant metadata scheme or inherited delivery stamping. Sender/reserved-key tests retain their separate scope.
- The integration tarball is not yet built, and the separate 0.24.0 store probe is not qualified by these 0.24.1 results.
- Default-off, one-way enablement and unsupported old-code rollback remain unchanged. Dependency minimum-reader enforcement, live provider/connector qualification and production enablement remain outside this round.

BEGIN PR BODY

## Problem

Some incoming messages should enrich later context without opening channels, moving reply anchors, injecting into an active answer or waking conversational inference. The restriction must be host-owned and durable, not authority supplied by sender metadata.

Stacked on **#906 (required inbound admission) at `869bb3add7b48893d48b2ce50ea423e4b33fdfbc`**, refreshed on upstream `a64cfc01`; review and merge that first. No dependency companion changes are included.

## Changes

- Add per-item `delivery: "context-only"` on `channels/incoming`, ordered results and a private restriction-only effect plan. Required admission can refuse or narrow it, never lift it.
- Keep `contextOnlyStorage` default-off. Offering the local `experimental.mcpl.channels.contextOnly` extension requires explicit storage enablement; delivery requires an MCPL-family advertisement, both effective incoming/context-only grants and the exact validated mode. Per-server `enabledCapabilities` opt-in is required; an existing `channels.*` pattern already counts once storage is enabled. The local leaf is excluded from feature-set `uses`.
- Keep these configuration patterns inert on modern-family MCP servers, as before. Config acceptance supplies **no MCPL offer, grant or delivery mode**, even with storage enabled; unsupported traffic is not converted into a normal wake. Four real modern-wire negative controls cover both patterns and both storage settings.
- Preserve upstream’s strict stream declaration: only `supportsInjectedMessages: true` permits mid-turn injection. Context-only remains queued for later context with no injection or fallback wake for true, false and undeclared streams. Removed dependency fallbacks and reasoning-loss notices remain removed.
- Refuse a conversation fork before any seed writes if normalization changes message count, rather than shifting inherited delivery classifications. The dependency-boundary regression witness pins the resolved context-manager 0.24.1 normalizer SHA-256 and exercises a stub that drops a row.
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

- Node 22.23.3 head: **9,624 pass / 0 fail / 63 skipped (9,687 tests)**.
- Node 22.12.0 head: **9,624 pass / 0 fail / 63 skipped (9,687 tests)**.
- Historical refreshed #906 base `869bb3ad`, Node 22.23.3, separate checkout (not rerun for this follow-up): **9,566 pass / 0 fail / 63 skipped (9,629 tests)**.

An earlier baseline run hit the existing 600-second workspace test-file timeout. The unchanged file then passed 407/407 in isolation, and the full baseline rerun passed; no test timeout or skip was changed.

The widened base/head profile-off corpus is byte-identical after projection of generated identities/receipts/times, including assistant content and a non-vacuous ordinary synthetic assistant-metadata control. It covers ordinary/required wakes, incoming/push stored shapes, anchors, lifecycle, typing, coalescing, holds, active-answer injection/repin/send suppression, real fork seeds and a multi-branch restart. Previously executed production-path checks at the reviewed parent cover context-only during an active explicit answer with true, false and undeclared stream support; none injects or wakes a follow-up, and later ordinary input sees the stored context. The previously executed modern-policy red control fails both intended cases on the unfixed implementation. Focused tests cover modern compatibility without grants/modes, unchanged MCPL advertisement/grant/mode requirements and the reader-floor assumption. Existing context-only recovery, compaction and no-effect tests remain in both full suites. The new ordinary assistant-metadata control uses the public context-manager write API with no delivery selector or reserved metadata; it passes with the profile omitted, false and true. Generated assistant replies in the other corpus scenarios carry no metadata, so they witness content only. All original corpus fields remain byte-identical to the preserved previous comparison.

## Not verified / Out of scope

No live connector/provider end-to-end qualification, production enablement, reply-routing extension, external source changes, generic offer facility or dependency reader-floor backport. No deduplication or zero-maintenance-compute guarantee. Remaining ingress-witness, lineage, enabled-fork and private-symbol follow-ups are not bundled here.

## Maintainer questions / follow-up

- Confirm the local extension spelling pending specification agreement and a future generic initialize-offer extension. This uses the existing typed MCPL offer builder only with storage enabled.
- Add a minimum-reader/classification gate in the dependency/storage open path before supporting old-code rollback, and replace the v1-only branch shortcut before introducing another floor version. The audited dependency evidence is in `docs/context-only-delivery.md`.

AI-assisted implementation with GPT-6.1-Sol; co-author trailers included.

END PR BODY
