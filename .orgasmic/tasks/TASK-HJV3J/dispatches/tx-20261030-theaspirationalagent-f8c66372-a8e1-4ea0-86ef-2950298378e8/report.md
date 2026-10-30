# Destination and turn ownership — fix round 1

Status: complete; all assigned final gates passed at the clean new head.

## Changed

Starting head: `02e3622358b48713c86eea1553aac30bc3b939e9`.
New head: **`7acacf170bb017e9bc3a1a548c21150e7a07e412`**.
The branch remains stacked on slice A at `119cb8662d8e3d33f5aedf3633cb95ca6ec7dce1` / #906. No rebase, rewrite or push. No admission implementation files changed this round.

Read the complete supplied review; a copy is `review-input.md`. The following addresses only HIGH-1, MEDIUM-2 and MEDIUM-3, plus the permitted PR-body-only LOW-8 wording change.

### Commits

1. **`04451382` — fix(runtime): carry admitted work into fresh continuation turns.** Separates new-turn work carriage from in-turn owner carriage; fixes the budget fallback; adds regression cases and corrects continuation lifetime documentation.
2. **`7acacf17` — test(routing): cover binding and event-gate runtime vocabulary.** Adds the two missing modules to the architecture gate with their current AST counts, without relaxing any existing entry.

Both commits use Vasyl Dovhanchyn as author and committer and the required GPT-6-Astra co-author trailer. Exact metadata: `round1-commits.txt`; changed paths: `round1-changed-files.txt`. No dependency, generated-file or lockfile changes are committed.

### Findings and witnesses

| Finding | Changes and evidence |
| --- | --- |
| **HIGH-1** | `src/framework.ts:1517` adds work-only `replyForNextTurn`; `ownedReply` at :1521 still adds the logical owner for true in-turn continuations. Prose (:22248), auto-continue (:22339), refusal/unstick rewind (:25935), and inference-failure rewind (:32020) now carry only work into fresh turns. The stale-owner guard is unchanged. |
| Positive fresh-turn ownership | `test/reply-routing.test.ts:491`: real autoContinue completes two turns with distinct turn ids, the same admitted binding, and the original channel/thread despite a later default. |
| Positive rewind execution | `test/reply-routing.test.ts:513`: real refusal handling sheds history and runs its retry, both with autoRewind and with an explicitly installed forced-session precondition; the recovered answer publishes in the frozen thread. |
| Other post-turn producers | `test/reply-routing.test.ts:531`: after a real bound turn settles, the production prose-continuation and failure-exhaustion producers queue ownerless work and the scheduler runs a fresh bound turn. The prose flag is explicitly installed as private scaffolding; exhaustion uses three calls to the real failure-accounting method. No end-to-end provider failure or prose parser claim is made for those two cases. |
| Forged/unknown owner protection | `test/reply-routing.test.ts:468` replaces the misleading “ended owner” title with two explicit forged/unknown owner cases (-1 and an unminted positive id), retaining scheduler/direct-start rejection, successor protection and provider-admission cleanup assertions. |
| Documentation | `docs/reply-routing.md:69` and `changelog.d/admitted-reply-routing.added.md:3` now distinguish in-turn ownership from post-turn work carriage and fresh ownership. |
| **MEDIUM-2** | `src/framework.ts:16868` falls back with `?? this.openLogical.get(agent.name)` when there is no stream-owner entry, preserving the open logical owner. `test/reply-routing.test.ts:249` now runs the real tool-driven budget restart both normally and with the live stream's owner entry deliberately removed; both finish the original turn before the later root. |
| Streamless reachability | A completely streamless budget restart is not constructible under the current guards: `src/framework.ts:16693` requires a stream for `overBudget`; :16716 computes a zero projection without a stream, so `overPhysical` is false for valid configured limits. The injected missing-owner-entry witness exercises the fallback without falsifying those guards or inventing a streamless production contract. |
| **MEDIUM-3** | `test/routing-runtime-has-no-connector-literals.test.ts:125` inventories the four existing event-gate AST occurrences (one template element and three string literal values, each ceiling 1); :131 adds the reply-binding module at an empty/zero ceiling. Existing entries and ceilings are untouched. The gate now covers 11 modules rather than 9. |
| **LOW-8 (permitted text only)** | The updated upstream PR body below states the maintainer questions directly, without bare design-document labels. |

### Red/green and mutation evidence

At the unchanged starting implementation, the bounded regression gate ran eight cases: **2 forged-owner controls passed; 6 regression witnesses failed with intended assertions** (auto-continue, both refusal/unstick rewinds, prose, exhaustion, budget fallback). Raw evidence: `round1-red-bounded.log` and `gate-round1-red-bounded-01M65ZCSG1SJYAZFMBZT2TQASB.log`.

The first test-generation command aborted before editing; its zero-match gate is not evidence. An initial unbounded budget witness hit its timeout; the test was changed to bounded production-loop polling so the useful red evidence is an assertion failure, not a timeout. Those preliminary logs are retained as `round1-red.log` and `round1-red-witnesses.log`, not counted as validation.

After the fix, the complete routing unit file passed **31/31** (`round1-routing-green.log`). Early typecheck plus expanded architecture inventory passed (`round1-typecheck-inventory.log`). These were dirty-tree development checks; the clean-head final receipts below supersede them.

The final mutation script passed **13/13 checks** at the new head. Each injected fault caused its intended assertion failure, excluding module/transform/syntax failures; every source file was restored. Three new cases supplement the ten inherited guards:
- Stamp an ended owner onto auto-continue again: the positive fresh-turn witness fails.
- Remove the stale/unknown-owner rejection branch: the forged-owner witness fails.
- Remove the budget-owner fallback: the bounded budget witness fails.

Script: `mutation-checks.py`; summary: `round1-mutations.log`; individual `mutation-*.log`. Reusable receipt: `gate-round1-mutations-01M65ZG6B2C2BTKYHS7V6J7WS3.log`.

## Verification Gates

All heavy checks run through:

```sh
orgasmic dispatch gate <name> -- env XDG_RUNTIME_DIR=/run/user/1002 \
  systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0 <command>
```

Final commit for every qualification gate: `7acacf170bb017e9bc3a1a548c21150e7a07e412`.

| Gate | Command after the wrapper | Result |
| --- | --- | --- |
| round1-node22233 | `bash -c 'set -e; node --version; npm run typecheck; npm run build; AF_TEST_CONCURRENCY=4 npm test'` | PASS: tsc/build; 9,674 tests, 9,611 pass, 0 fail, 63 skipped |
| round1-node2212 | Same matrix command with the local Node 22.12.0 executable first on PATH, in an exact HEAD archive under the worktree | PASS: tsc/build; 9,674 tests, 9,611 pass, 0 fail, 63 skipped |
| round1-focused | `node --test --test-force-exit --test-concurrency=4 --test-timeout=90000 dist/test/reply-routing*.test.js dist/test/mcpl-post-admission.test.js dist/test/mcpl-admission-*.test.js dist/test/mcpl-required-*.test.js dist/test/routing-runtime-has-no-connector-literals.test.js` | PASS: 237 tests, 0 fail |
| round1-mutations | `python3 "$ORGASMIC_EVIDENCE_DIR/mutation-checks.py"` | PASS, 13 intended assertion failures |

The floor-version wrapper first replaces the ignored `node_modules/.routing-node2212` archive using `git archive HEAD`, links its dependencies to the existing worktree dependencies, prepends `$PWD/node_modules/.node2212/node_modules/node/bin` to PATH, and changes to that archive. Typecheck is `tsc --noEmit`; build is `tsc` plus the package postbuild. No cache or build output is kept in evidence.

Final logs: `round1-node22233.log`, `round1-node2212.log`, `round1-focused.log`, `round1-mutations.log`. Reusable final receipts:
- `gate-round1-node22233-01M65ZHJ26QMQ29FGWQ5DY31QM.log`
- `gate-round1-node2212-01M65ZHK6SCFJV16SX9Q2BFV7T.log`
- `gate-round1-focused-01M65ZJWSQ1XR0VJKV9G563108.log`
- `gate-round1-mutations-01M65ZG6B2C2BTKYHS7V6J7WS3.log`

Both final full suites have 73 more passing cases than the pinned slice-A base, and 9 more than the reviewed implementation (7 routing cases plus 2 architecture inventory cases). No final failure is waived or classified as pre-existing/flaky. All existing admission tests pass unchanged. Ancestry, clean-tree and `git diff --check` checks pass; `src/mcpl` is unchanged from the reviewed head.

### Inherited evidence and limits

No prior gate pass is reused to qualify this changed implementation. The previous implementation report is retained as `initial-implementation-report.md` for the original exit-row mapping and admission-seam approval record; its continuation claims are superseded by the findings/witnesses above.

The unchanged pinned **base** comparison remains valid: at `119cb866`, both Node versions had typecheck/build PASS and **9,601 tests / 9,538 pass / 0 fail / 63 skipped**. These are historical comparison counts, not final-tree receipts. Original raw baseline logs remain at:
- `/home/orgasmic/.orgasmic/runs/run-01M65SDTHPQPT9CBRSFSBQ4WFC/evidence/gate-base-node22233-01M65SK7NM4XXS80KFFDQJK78W.log`
- `/home/orgasmic/.orgasmic/runs/run-01M65SDTHPQPT9CBRSFSBQ4WFC/evidence/gate-base-node2212-01M65SPHV26725RBBWG11AKG54.log`

The base source pin, Node versions and installed dependency tree are unchanged. As previously disclosed, those old baseline receipts were dirty/moved-head and are not reused as clean qualification receipts; their raw pinned-source results provide the comparison. This round reruns all assigned final gates. Original seam approval and unchanged admission source are inherited scope evidence, not a new behavioral claim.

### Upstream freshness

Immediately before completion, `git ls-remote https://github.com/anima-research/agent-framework refs/heads/main` returned `48f26ce56cf73267d715e853acc9a88b50595337`. Upstream **has moved** from `d700dce18bc9f33f65ac5965b0cc69c075aa7da1`, and is unchanged from the prior implementation report. Raw output: `upstream-head.txt`. No rebase was performed.

## Unmet Criteria

None within the narrowed fix-round assignment. The explicitly excluded follow-up findings remain listed under Residual Risk.

## Residual Risk

- LOW-4 through LOW-7 remain explicitly deferred by this round's scope. No optional-chain/harness cleanup, triggerless-defer redesign, admission-refusal-code additions, or draft-resend change was made.
- A true in-turn continuation whose owner has ended remains invalid; the fix does not relax unknown-owner rejection or introduce a new simultaneous-start/recovery contract.
- Missing stream-owner state is explicitly injected in the budget witness; current budget guards exclude a truly streamless restart. No claim is made that ordinary execution loses this map entry.
- The local thread profile/API still needs maintainer agreement. No typing ownership, context-only wire mode, SPEC changes, adapters, live deployment, durable replay or cross-epoch reauthorization is included.
- Qualification remains on the requested stacked base, not newer upstream main.

BEGIN PR BODY
Title: feat(mcpl): retain admitted reply destinations across logical turns

## Problem

Required inbound admission can carry private reply intent, but intent alone does not bind automatic output. Queues, continuations and channel activity must not redirect a reply or consume another admitted cause.

## Changes

- Add opt-in host `replyRouting` resolution after complete admission validation, under the same deadline and cancellation boundary.
- Freeze connection-qualified destinations and private work identity. In-turn retries, tool continuations and budget restarts retain their logical owner; auto-continue, prose continuations and rewind retries carry admitted work into a fresh turn with the same frozen destination.
- Keep unrelated wakes from taking an open reply turn; reject forged or ended in-turn owners.
- Enforce automatic targets before open/send, including sleep announcements. Explicit sends retain their chosen targets.
- Add an explicitly local, publish-only `experimental.replyRouting` v1 profile for opaque nested threads, plus data-only initialize offers. Threadless destinations need no extension.
- Keep unconfigured behavior and the admission verdict API unchanged. The first commit isolates the additive post-verdict seam and private carriage for review against #906.
- Add neutral runtime/real-stdio tests, documentation and a changelog. Cover the private binding module and event gate in the connector-literal architecture inventory without relaxing existing ceilings.

## Tests

On both Node 22.23.3 and 22.12.0, typecheck and build pass. Full suite: **9,611 passed, 0 failed, 63 skipped** (base: 9,538 passed, 0 failed, 63 skipped). Focused routing/admission/inventory suite: **237 passed, 0 failed**.

Red-before/green-after witnesses cover post-turn continuations and budget fallback. Thirteen mutation checks cover ownership, fresh-turn carriage, destination enforcement, stale-owner rejection and fallback guards.

## Maintainer questions

- Accept optional publish thread targets and this local versioned profile, or require registered thread-channels?
- Confirm the host resolver/initialize-offer API and additive post-admission consumer seam.
- Confirm the focused existing silent-resume regression without adding a recovery or simultaneous-start contract.

## Not verified / Out of scope

No live connector/provider deployment or protocol standardization. No typing ownership, context-only wire mode/persistence, host adapters, automatic replay or cross-epoch recovery. Existing silent-resume behavior is tested, not redesigned.

## Companion PRs

Stacked on #906 at `119cb8662d8e3d33f5aedf3633cb95ca6ec7dce1`; review and merge #906 first. This patch has no dependency on #233 or #361. No SPEC or adapter companion is included; nested-thread interoperability remains an explicitly local agreement.

AI-assisted implementation and testing; commits include the GPT-6-Astra co-author trailer.
END PR BODY
