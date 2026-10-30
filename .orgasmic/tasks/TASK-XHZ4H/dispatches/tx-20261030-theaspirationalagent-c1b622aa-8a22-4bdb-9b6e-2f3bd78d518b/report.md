# Context-only delivery — refreshed-base rebase

## Changed

- Old A base: `c848977fc2280b378576f0eb72c2b07a0a93b86f`.
- Recovery branch `recovery/context-only-before-refresh` preserves `51cf9b1e50602b5f6d82c2eddff34f194b0e6375`.
- New A base: `869bb3add7b48893d48b2ce50ea423e4b33fdfbc` (upstream `a64cfc01` plus required admission).
- **Final head: `3b075de1a1a2afd006f21964671f977897d28a80`.**
- Rebased all 14 commits with `git rebase --onto 869bb3add7b48893d48b2ce50ea423e4b33fdfbc c848977fc2280b378576f0eb72c2b07a0a93b86f`. No dropped/squashed/reordered commits, no subsequent source changes or behavioral commit needed.
- Local only: no push, PR, merge, dependency change, external source edit or profile enablement. All generated builds/checkouts are in ignored `dist/` and `data/`, not evidence.
- Author identity/date, committer identity and full commit messages/trailers are preserved across all 14 pairs; committer dates necessarily changed during rebase. Each identity is Vasyl Dovhanchyn's specified noreply identity and each trailer is `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. See `commit-identities.txt` and `rebase-integrity.txt`.

### Conflicts and range-diff

**Conflicts: none.** Git replayed all 14 commits without stopping; there were no manual conflict resolutions.

Command: `git range-diff c848977f..51cf9b1e 869bb3ad..HEAD`. Every patch is unchanged (`=`); full output follows and is also saved as `range-diff.txt`:

```text
 1:  be8ba368 =  1:  7eef5415 feat(mcpl): add opt-in durable context-only inbound delivery
 2:  a621423a =  2:  24e05b59 fix(mcpl): preserve policy-phase refusals and diagnose delivery drops
 3:  a61c6893 =  3:  e798bc48 fix(mcpl): require per-server context-only capability opt-in
 4:  e4fbb4bb =  4:  cefc41fd fix(storage): short-circuit and guard reader-floor fallback scans
 5:  feda5490 =  5:  d2988b9d fix(mcpl): trace and rate-limit context-only delivery refusals
 6:  97a340ca =  6:  650ea68b docs(mcpl): use public admission and initialize-offer terminology
 7:  9dd7399f =  7:  276ffbe3 test(mcpl): broaden profile-off delivery compatibility coverage
 8:  a5b02a07 =  8:  d97b3e23 test(mcpl): include context-only opt-in in modern policy diagnostics
 9:  186c46e8 =  9:  fc1a7045 fix(mcpl): keep local storage policy inert for modern servers
10:  553c8b4c = 10:  7db564cc docs(mcpl): clarify wildcard context-only opt-in
11:  5e097a73 = 11:  cf683677 docs(storage): pin the reader-floor single-version assumption
12:  b2045133 = 12:  90529ac7 test(mcpl): compare assistant rows in the delivery corpus
13:  17569e9f = 13:  3d913662 docs(mcpl): enumerate selector refusal and masking deltas
14:  51cf9b1e = 14:  3b075de1 test(mcpl): prove modern policy acceptance grants no delivery mode
```

### A boundary

- `src/mcpl/inbound-admission.ts` is byte-identical to refreshed A (SHA-256 `66d99cd30b8669120102337dc93f361877ab23c0e9b94509bd393dd11d59c185`).
- All RequiredAdmission scheduling, epoch, hold, flush and refusal blocks in `server-connection.ts` are unchanged. No new A seam was added.
- **the D seam in server-connection.ts, unchanged since review 2**: line 1 (selector import), lines 495–504 (selector-aware capability refusal), line 1158 (params argument at generic grant check), lines 2614–2620 (pre-tap push-selector rejection).
- The owner confirmed via blocking clarification that these existing D wire-only changes must stay and are excluded from the zero-diff requirement for A's RequiredAdmission blocks. Exact answer: `admission-clarification.txt`. `verify-rebase.py` removes only those enumerated wire additions in memory and asserts the rest of the complete file equals refreshed A byte-for-byte. Evidence: `rebase-integrity.txt`, `admission-zero.diff` (empty), `retained-wire-seam.diff`.

### Upstream interaction / disposition

| Item | Disposition and fresh verification |
|---|---|
| `93cdb7d6` stream declaration | Preserved the upstream `supportsInjectedMessages === true || !stream` gate. D's durable-classification stop predicate remains inside it (`framework.ts:16654–16662`). True streams stop before context-only; false/undeclared streams drain no mid-turn messages. The direct no-stream path retains the same D stop predicate. A real loopback/active-answer probe exercises true, false and undeclared streams: one context row stored, zero context injection or fallback wake, one explicit publish, locus/arrivals/signals unchanged, and a later legitimate turn sees the context. No behavioral change was needed. |
| `bbba75bc` fallback removal | Preserved the round-only `roundPreamble` path at `framework.ts:25246–25251`; no cumulative-preamble compatibility fallback restored. |
| `664473ad` reasoning-loss removal | Removed files, callbacks and notices stay removed; no D delta in the removed reasoning-loss source/test paths. Full clean builds cannot retain stale deleted tests. |
| Modern compatibility / M-A clarification | Both patterns are accepted on refreshed base and head. Fresh 45-test gate covers actual modern-wire negative controls with profile off/on: no MCPL offer, grant, delivery mode, storage or fallback wake. MCPL still requires advertisement, profile opt-in, both grants and validated mode; deny-by-default remains. |
| Red control | Rebuilt the unfixed reviewed implementation `a5b02a07` in its own checkout and ran the current modern acceptance tests against it: exactly the two intended assertion failures, reporting the erroneously included local leaf. Wrapper checks exit 1 and exactly two failures; no live/base source mutation. |
| Prior L-A / L-B / L-C / L-D fixes | Preserved as identical patches: wildcard opt-in wording; explicitly chosen v1 single-version floor assumption (not mixed-version enforcement); assistant rows in corpus; five numbered compatibility/diagnostic deltas. Fresh focused/full/corpus gates cover these unchanged sources. |

Earlier deferred LOWs remain deferred: L3 (live locus witness isolation), L4 (loss of sole floor-bearing branch), L5 (diamond-lineage over-restriction), L7(b) (profile-on fork seeding), L8 (enumerable private symbol). No additional fix was assigned or bundled.

## Verification Gates

All required commands used `orgasmic dispatch gate` and `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`. The active full-suite scopes were observed at MemoryMax=17179869184 / MemorySwapMax=0 (`scope-limits.txt`).

### Full suites and typecheck

Command, invoked **from the tested checkout**:

```sh
orgasmic dispatch gate <name> -- systemd-run --user --scope \
  -p MemoryMax=16G -p MemorySwapMax=0 \
  "$ORGASMIC_EVIDENCE_DIR/run-suite.sh" <node-bin>
```

The script logs actual cwd, Git HEAD, Node, PID/process group; unsets NODE_OPTIONS; sets AF_TEST_CONCURRENCY=4; runs `npm run clean`, `npm run typecheck`, `npm run build`, `npm test`. No custom loader or skip was added.

| Gate | Tested checkout / commit | Node | Typecheck / build | Tests | Pass | Fail | Skip |
|---|---|---|---|---:|---:|---:|---:|
| base-full-22-23-3-retry | data/refreshed-base-retry / `869bb3ad` | 22.23.3 | pass / pass | 9629 | 9566 | 0 | 63 |
| head-full-22-23-3 | assigned checkout / `3b075de1` | 22.23.3 | pass / pass | 9683 | 9620 | 0 | 63 |
| head-full-22-12-0 | data/refreshed-head-12 / `3b075de1` | 22.12.0 | pass / pass | 9683 | 9620 | 0 | 63 |

The successful base rerun is a real detached checkout under `data/refreshed-base-retry`; head 22.23.3 uses the assigned checkout; head 22.12.0 uses the real detached `data/refreshed-head-12` checkout. Dependencies are shared by symlink and unchanged; `dependency-refresh.diff` shows only the upstream package version bump, not changed dependency requirements. Sources are clean at the named commits. Node bins: `/opt/node-v22.23.3-linux-x64/bin` and `/tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin`.

Final logs: `base-full-22-23-3-retry.log`, `head-full-22-23-3.log`, `head-full-22-12-0.log`; corresponding `gate-<name>-*.log` files hold the dispatch receipts. Other-checkout receipts are not claimed reusable for the assigned worktree.

### Preserved baseline timeout

The first baseline run (`base-full-22-23-3.log`) exited **1**, not pass: **9,627 tests / 9,563 pass / 0 failed assertions / 1 cancelled / 63 skipped**. Its `workspace-three-way.test.js` file hit the existing 600,000 ms timeout (`testTimeoutFailure`, measured 600001 ms). The zero assertion-failure count must not be mistaken for a successful gate. This baseline failure occurred on unchanged refreshed A; the workspace source and test have zero D diff. Both complete head runs passed that file. An isolated rerun on the same baseline build (`base-workspace-timeout-check.log`) checks this same 600-second guard. The isolated baseline rerun passed **407/407**, no cancellations, under the unchanged timeout. It confirms the first result is load-sensitive rather than a deterministic failing assertion.

The complete baseline was rerun in a separate fresh checkout to obtain complete counts rather than infer missing results from the cancelled run. Both attempts are retained. No timeout, test source, skip or loader was changed to obtain the final results. This is classified as an environment/load-sensitive baseline timeout, not a D regression.

### Differential / focused checks

| Gate | Command after systemd prefix / scope | Result |
|---|---|---|
| rebased-focused | `npm run clean && npm run typecheck && npm run build && npm run pretest && node --test --test-timeout=600000 dist/test/context-only-delivery.test.js dist/test/context-only-floor.test.js dist/test/context-only-modern.test.js dist/test/context-only-compatibility.test.js dist/test/context-only-routing-architecture.test.js` | 51 pass, 0 fail; `rebased-focused.log` |
| injection-boundary | `node injection-boundary-probe.mjs <head-checkout>` | All three true/false/undeclared active-answer cases pass; `injection-boundary.log` |
| modern-compatibility | `node compatibility-surfaces.mjs <new-base> <head>`, then `node --test --test-timeout=600000 dist/test/context-only-modern.test.js dist/test/mcp-protocol-family.test.js` | Base/head modern constructors accept both patterns; 45 pass, 0 fail. Also reproduces the profile-off selected-item refusal and masked-leaf naming deltas; `modern-compatibility.log` |
| modern-policy-red-control | `run-red-control.sh <head-checkout>` from the separate unfixed checkout | Exactly 2 expected failures; wrapper exit 0. Raw: `modern-red-control-raw.log`; `modern-policy-red-control.log` |
| no-config-differential | `run-corpus.mjs <head> <target> <output>` for each target, then `diff -u` and SHA-256 | Byte-identical; `no-config-differential.log` |
| final-rebase-integrity | `python3 verify-rebase.py`, range-diff, diff-check, zero admission diff and clean-source/HEAD assertions | exit 0; `final-rebase-integrity.log` |
| no-config-base-checkout | Same corpus rerun with scope cwd = actual refreshed-base checkout, then diff against head output | Byte-identical; `no-config-base-checkout.log` |

Final base/head corpus SHA-256: `31c0b6de00987cfa0885a54aea247cb6280e9f4d59ac48653c77b3b8be6221b9`, each 82,260 bytes. Compared outputs: `corpus-base-checkout.json` and `corpus-head.json`. Both omitted and explicit-false profiles are covered. The runner uses the current shared projection against each target's own loopback fixture and production modules. It compares arrival and assistant content/metadata, results, admission decisions, anchors/lifecycle/typing, coalescing/holds, active-answer behavior, fork seeds and multi-branch restart; generated receipts/times/IDs are projected out as documented. This is a finite corpus, not a proof for every possible unconfigured input.

Static checks: `git diff --check 869bb3ad..HEAD` passes (`diff-check.txt`). `rebase-integrity.txt` proves identity/message preservation and A boundaries. `upstream-interactions.txt` records retained upstream gates and actual probe outcomes.

### Inherited evidence

The prior report at `/home/orgasmic/.orgasmic/runs/run-01M6778WBGZYGCHS9PT3SWWRH3/evidence/report.md` supplies historical review dispositions, the permitted reader-floor assumption and one-way-storage limitations. These D inputs are unchanged, verified by all 14 range-diff equalities. Its corpus and compatibility probe scripts were copied and **executed afresh against refreshed inputs** here. No prior full-suite or focused gate pass is reused; no old-base count substitutes for the assigned new-base run. The earlier repository instructions/conventions context is unchanged and was not replayed.

## Unmet Criteria

None within the narrowed rebase scope. All assigned head gates passed at the final commit; head adds 54 passes to refreshed A with no new failures. The rebase was conflict-free and required no behavioral change.

## Residual Risk

- Enabling the default-off storage profile remains one-way. Older framework code cannot enforce the floor and would treat stamped rows as conversational; rollback is unsupported. Dependency minimum-reader enforcement remains follow-up, not changed here.
- The accepted reader-floor shortcut assumes v1 only; finding a supported floor can leave a later branch's unsupported version unvisited. Unreadable branches contribute no floor with diagnostics; deleting the sole floor-bearing branch remains a known limitation.
- No live connector/provider or production enablement qualification. The local extension spelling and generic offer facility remain maintainer follow-up; remaining LOWs listed above remain deferred.
- No behavior change was required by refreshed upstream. The new active-answer probe supplements, rather than replaces, full-suite coverage of direct/no-stream and deferred-write paths.

BEGIN PR BODY

## Problem

Some incoming messages should enrich later context without opening channels, moving reply anchors, injecting into an active answer or waking conversational inference. The restriction must be host-owned and durable, not authority supplied by sender metadata.

Stacked on **#906 (required inbound admission) at `869bb3add7b48893d48b2ce50ea423e4b33fdfbc`**, refreshed on upstream `a64cfc01`; review and merge that first. No dependency companion changes are included.

## Changes

- Add per-item `delivery: "context-only"` on `channels/incoming`, ordered results and a private restriction-only effect plan. Required admission can refuse or narrow it, never lift it.
- Keep `contextOnlyStorage` default-off. Offering the local `experimental.mcpl.channels.contextOnly` extension requires explicit storage enablement; delivery requires an MCPL-family advertisement, both effective incoming/context-only grants and the exact validated mode. Per-server `enabledCapabilities` opt-in is required; an existing `channels.*` pattern already counts once storage is enabled. The local leaf is excluded from feature-set `uses`.
- Keep these configuration patterns inert on modern-family MCP servers, as before. Config acceptance supplies **no MCPL offer, grant or delivery mode**, even with storage enabled; unsupported traffic is not converted into a normal wake. Four real modern-wire negative controls cover both patterns and both storage settings.
- Preserve upstream’s strict stream declaration: only `supportsInjectedMessages: true` permits mid-turn injection. Context-only remains queued for later context with no injection or fallback wake for true, false and undeclared streams. Removed dependency fallbacks and reasoning-loss notices remain removed.
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

- Node 22.23.3 head: **9,620 pass / 0 fail / 63 skipped (9,683 tests)**.
- Node 22.12.0 head: **9,620 pass / 0 fail / 63 skipped (9,683 tests)**.
- Refreshed #906 base `869bb3ad`, Node 22.23.3, separate checkout: **9,566 pass / 0 fail / 63 skipped (9,629 tests)**.

An initial baseline run hit the existing 600-second workspace test-file timeout. The unchanged file then passed 407/407 in isolation, and the full baseline rerun passed; no test timeout or skip was changed.

The widened base/head profile-off corpus is byte-identical after projection of generated identities/receipts/times, now including assistant content and metadata. It covers ordinary/required wakes, incoming/push stored shapes, anchors, lifecycle, typing, coalescing, holds, active-answer injection/repin/send suppression, real fork seeds and a multi-branch restart. Fresh production-path checks cover context-only during an active explicit answer with true, false and undeclared stream support; none injects or wakes a follow-up, and later ordinary input sees the stored context. The modern-policy red control fails both intended cases on the unfixed implementation. Focused tests cover modern compatibility without grants/modes, unchanged MCPL advertisement/grant/mode requirements and the reader-floor assumption. Existing context-only recovery, compaction and no-effect tests remain in both full suites.

## Not verified / Out of scope

No live connector/provider end-to-end qualification, production enablement, reply-routing extension, external source changes, generic offer facility or dependency reader-floor backport. No deduplication or zero-maintenance-compute guarantee. Remaining ingress-witness, lineage, enabled-fork and private-symbol follow-ups are not bundled here.

## Maintainer questions / follow-up

- Confirm the local extension spelling pending specification agreement and a future generic initialize-offer extension. This uses the existing typed MCPL offer builder only with storage enabled.
- Add a minimum-reader/classification gate in the dependency/storage open path before supporting old-code rollback, and replace the v1-only branch shortcut before introducing another floor version. The audited dependency evidence is in `docs/context-only-delivery.md`.

AI-assisted implementation with GPT-6.1-Sol; co-author trailers included.

END PR BODY
