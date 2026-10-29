# Upstream rebase report

## Changed

Fetched `upstream main` from `https://github.com/anima-research/agent-framework.git`.
Pinned upstream main at start: **`4a45766f019fa11c8699645bd6806ebf3e13e5d1`**, exactly eight
commits beyond `0f11975e485c7077c6ed7cad9261621cd310a700` (six non-merge commits,
two merges). Fetch transcript: [fetch-upstream.log](fetch-upstream.log).
Package remains **@animalabs/agent-framework 0.30.0**.

| New local branch | Preserved old branch/head | New head |
| --- | --- | --- |
| `feat/typing-budget-recipient-r` | `feat/typing-budget-recipient` / `5560cdd94d89821e0511b7b24aecfaa845432217` | `4f942947b6218ffcb51589fa9c5b4f3f55a93f4e` |
| `recipient-on-main-r` | `recipient-on-main` / `f48546e353165aa1842972a7594e0355d3997754` | `36a9194253f319dcf79428b79893553dd9af4cb3` |

The old refs are unchanged. The stack retains eight linear commits and standalone
retains five, in the same order. Every raw author header (including date), full
message/trailer, stable patch ID and per-file commit numstat is unchanged. Rebasing changes
parent/tree/commit IDs and committer timestamps, not the carried patches; the existing
neutral committer identity is retained. No publication author/trailer rewrite.

### Conflicts and changes beyond upstream

**No conflicts; no manual resolutions.** Both rebase logs record automatic replay:
[stacked](rebase-stacked.log), [standalone](rebase-standalone.log).
Commands used on newly created branches:
`git rebase --reapply-cherry-picks --empty=keep --onto 4a45766f019fa11c8699645bd6806ebf3e13e5d1 0f11975e485c7077c6ed7cad9261621cd310a700`.

Each new head versus its old head changes exactly the same five upstream files,
**188 insertions / 24 deletions**:
- `src/agent.ts`
- `src/framework.ts`
- `src/tune-out/tools.ts`
- `test/subconscious-model-fields.test.ts`
- `changelog.d/subconscious-model-fields.added.md`

**Beyond the upstream delta: nothing on either branch.** This is checked two ways:
added/deleted-line multisets match the upstream delta exactly; independently applying
only that upstream patch to each old tree in a temporary index produces the exact
new head tree hash. There are no residual added or removed lines. Evidence:
[delta-audit.json](delta-audit.json), [stacked head diff](head-diff-stacked.patch),
[standalone head diff](head-diff-standalone.patch), [upstream stats](upstream-stats.txt).

All twelve complete layer-3 changed-file line multisets are identical between the
new branches and also identical to their pre-rebase versions:
[layer3-equivalence.json](layer3-equivalence.json). The new stacked layer-2 tip is
`75c90343`; standalone is compared directly against the new upstream base.
Standalone still requires neither #233 nor #361.

### Upstream overlap assessment

Inspected all eight commit summaries and the net runtime diff:
[upstream-commits.txt](upstream-commits.txt), [upstream-runtime.diff](upstream-runtime.diff).

| Upstream commit | Change / relation to the carried features |
| --- | --- |
| `b3007067` | Adds subconscious reader window/thinking-binding fields and persistent-reader propagation; shared framework/config surface, not typing/hold/recipient logic. |
| `909ad2a4` | Extracts `assertThinkingBinding` in `agent.ts`, validates subconscious binding, handles null/false; shared agent/framework files used by #361, but no budget-hold edits. |
| `659ec606` | Validation wording/refusal and drop-block coverage; no carried-feature implementation change. |
| `eea4c41e` | Subconscious configuration documentation; no carried-feature implementation change. |
| `0dc562fe` | Merges existing main into the subconscious topic; not a new carried-feature patch. |
| `ecd2e540` | Gives reader forks their own window/binding and tests; touches fork construction adjacent to `proseRouting: 'disabled'`, but does not change #233 disabled typing or tune-out lifecycle. |
| `89df1702` | Refines subconscious tests, including bounded harness waits and fork drop control; no carried-feature implementation change. |
| `4a45766f` | Merges the subconscious feature as #869; net effects listed above. |

Thus there **is file-level and adjacent configuration overlap** with the framework,
agent, tune-out/subconscious and compile-input areas. The new physical-window and
thinking-binding settings can affect subconscious compile inputs. There are **no
edits to #233's typing paths, #361's refusal/hold lifecycle, or recipient protocol,
queue ownership, anchors or typing-owner logic**. No recipient-specific file is
changed upstream. Clean patch replay alone is not treated as integration proof:
the fresh complete suites and recipient suites below verify both combined heads.

### Preserved commit mapping and statistics

| Branch | Old → new | Unchanged subject | Statistics |
| --- | --- | --- | --- |
| `feat/typing-budget-recipient-r` | `e7f161a9` → `41981f77` | feat(typing): port disabled-mode presence and tune-out safeguards | 5 files changed, 308 insertions(+), 9 deletions(-) |
| `feat/typing-budget-recipient-r` | `edb2f3cf` → `f8afa4ea` | fix(inference): hold refused compiles while compression makes room | 7 files changed, 3013 insertions(+), 74 deletions(-) |
| `feat/typing-budget-recipient-r` | `22454888` → `75c90343` | test(inference): witness overlap liveness after budget refusal | 1 file changed, 100 insertions(+) |
| `feat/typing-budget-recipient-r` | `52657657` → `f3287015` | feat(routing): preserve optional host-admitted recipient envelopes | 12 files changed, 912 insertions(+), 45 deletions(-) |
| `feat/typing-budget-recipient-r` | `6324a1a4` → `d65e9d06` | fix(routing): tolerate absent optional recipient state | 1 file changed, 14 insertions(+), 14 deletions(-) |
| `feat/typing-budget-recipient-r` | `72fe3f8d` → `dda793c3` | test(routing): retain recipient ownership through a budget restart | 1 file changed, 44 insertions(+), 2 deletions(-) |
| `feat/typing-budget-recipient-r` | `3e4e4990` → `74a86dd8` | fix(routing): isolate recipient turns and enforce local write policy | 6 files changed, 190 insertions(+), 25 deletions(-) |
| `feat/typing-budget-recipient-r` | `5560cdd9` → `4f942947` | fix(routing): surface deferred recipient wakes and preserve silent starts | 4 files changed, 153 insertions(+), 28 deletions(-) |
| `recipient-on-main-r` | `ef4ac55f` → `8d92b92d` | feat(routing): preserve optional host-admitted recipient envelopes | 12 files changed, 912 insertions(+), 45 deletions(-) |
| `recipient-on-main-r` | `5e71e448` → `2f1f65f3` | fix(routing): tolerate absent optional recipient state | 1 file changed, 14 insertions(+), 14 deletions(-) |
| `recipient-on-main-r` | `57424a0e` → `e9fcad67` | test(routing): retain recipient ownership through a budget restart | 1 file changed, 44 insertions(+), 2 deletions(-) |
| `recipient-on-main-r` | `280ec03d` → `af8b2d2d` | fix(routing): isolate recipient turns and enforce local write policy | 6 files changed, 190 insertions(+), 25 deletions(-) |
| `recipient-on-main-r` | `f48546e3` → `36a91942` | fix(routing): surface deferred recipient wakes and preserve silent starts | 4 files changed, 153 insertions(+), 28 deletions(-) |

Full metadata/statistics: [commit-mapping.json](commit-mapping.json),
[commit-stats.txt](commit-stats.txt). Range-diff marks every pair `=`:
[stacked](range-diff-stacked.txt), [standalone](range-diff-standalone.txt).

## Verification Gates

Toolchain: Bun **1.4.3** (`/home/orgasmic/.local/bin/bun-1.4.3`) and Node
**22.23.3** (`/opt/node/bin`). Each check uses
`orgasmic dispatch gate NAME -- COMMAND` on a clean committed new head.
Build products remain in the worktree, outside evidence. No dependency file changed.

| Head | Gate / command after wrapper | Result |
| --- | --- | --- |
| Standalone | [rebase-standalone-install](gate-rebase-standalone-install-01M63N0GHEWXX97QH0A0QGV0G1.log) — `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS |
| Standalone | [rebase-standalone-typecheck](gate-rebase-standalone-typecheck-01M63N0GPE3GHMWQKGSV9G7WJ8.log) — `npm run typecheck` | PASS |
| Standalone | [rebase-standalone-build](gate-rebase-standalone-build-01M63N0J2XN9GKFW157VM1GW0Q.log) — `bash -c 'npm run clean && npm run build && npm run pretest'` | PASS |
| Stacked | [rebase-stacked-install](gate-rebase-stacked-install-01M63N9555TG2AK4MX42G9522J.log) — `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS |
| Stacked | [rebase-stacked-typecheck](gate-rebase-stacked-typecheck-01M63N95A9GT9EPQFCK4F2QC3N.log) — `npm run typecheck` | PASS |
| Stacked | [rebase-stacked-build](gate-rebase-stacked-build-01M63N96RAQGCY34R11KKSQ0FH.log) — same clean build/pretest chain | PASS |

Full suites use `AF_TEST_CONCURRENCY=8 orgasmic dispatch gate NAME -- npm test`.
Recipient command after wrapper:
`node --test --test-force-exit dist/test/recipient-compatibility.test.js dist/test/recipient-protocol.test.js`.

| Scope | Receipt | Tests / pass / fail / skip |
| --- | --- | --- |
| Standalone, all tests | [rebase-standalone-suite](gate-rebase-standalone-suite-01M63N0NQAFQCRVA9JSM4NESWP.log) | 9250 / 9186 / 0 / 64 |
| Stacked, all tests | [rebase-stacked-suite](gate-rebase-stacked-suite-01M63N9A9MDK3CTK70SVQTTWC7.log) | 9344 / 9281 / 0 / 63 |
| Standalone, 34 recipient rows | [rebase-standalone-recipient](gate-rebase-standalone-recipient-01M63N0M3G3G0QWT29RJ67X84V.log) | 34 / 33 / 0 / 1 |
| Stacked, 34 recipient rows | [rebase-stacked-recipient](gate-rebase-stacked-recipient-01M63N98JFD6BWWTKST95MSKP7.log) | 34 / 34 / 0 / 0 |

Standalone's one conditional recipient skip remains the #361 budget-hold integration
row; standalone does not contain that feature. All 34 rows are selected on both heads.
Full-suite skip counts remain 63 stacked / 64 standalone. Each rebased full suite
has five more passing tests than its old head, from the upstream subconscious tests.

Final structural/tree audit: [rebase-audit](gate-rebase-audit-01M63NJ04GN8SJMZ6ZRTK10HC5.log) —
`python3 "$ORGASMIC_EVIDENCE_DIR/audit-rebase.py"`.
All gate receipts and counts: [gate-results.md](gate-results.md).
Manifest: [rebase-manifest.json](rebase-manifest.json).

### Inherited evidence and unchanged scope

- Previous fix-round evidence applies to the exact retained old refs and the
  unchanged carried patches, not to the integration with new upstream:
  `/home/orgasmic/.orgasmic/runs/run-01M63HTMPTP6T8R8MFH32TQNT4/evidence/report.md`.
  Old stack: 9,339 tests / 9,276 pass / 0 fail / 63 skip. Old standalone:
  9,245 / 9,181 / 0 / 64. Recipient rows: 34/34/0/0 and 34/33/0/1.
- Earlier red-first diagnostics/silent-start evidence, real-ingress anchor controls,
  and qualification mapping remain scoped to unchanged patches and test inputs.
  No historical pass substitutes for any new-head gate; all requested checks rerun.
- The historical 366/21 qualification selection remains unreproducible; the manager's
  replacement-test decision is unchanged and is not owner approval of publication.
- No base suite or deployment is newly claimed. This round is solely the requested
  local rebase and fresh integration verification.

## Unmet Criteria

None. All required gates and the structural/tree audit passed with zero failures. Old and new branch refs are
retained. Worktree is left clean on `feat/typing-budget-recipient-r` with its build.
No push, PR, remote repository mutation, main-checkout edit, merge or dispatch close.
Fetching updated local remote-tracking metadata only.

## Residual Risk

No live host, provider, credential or agent history/state was used. The optional
recipient extension remains local, not a standard MCPL capability. Synthetic tests
do not replace release-set qualification. No generic context-only/mention-only
mode or closed-channel guarantee is added. Package version remains 0.30.0, so
consumers must pin the new SHA. Author/trailer publication work is intentionally
unchanged. The fetched base is pinned to the start of this round, not a claim that
upstream cannot advance again.
