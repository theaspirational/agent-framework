# Review — TASK-HVQ8K slice A refresh onto upstream a64cfc01

Head reviewed: `1d990e4195e265f58be865719df2bb7e51f5c456` (base `a64cfc010f4df5090c698e9fa7926b1d3aa0dc5a`).
Previous reviewed head: `c848977fc2280b378576f0eb72c2b07a0a93b86f` (base `c5306693`).
Scope: the refresh only. The 21 replayed commits are byte-identical to the previously
reviewed delta (proved below), so their internals were not re-reviewed; this review covers
the replay fidelity, the upstream interaction, the one new commit, identity/text hygiene,
and one independent full gate.

## Verdict

**APPROVE.** No HIGH or MEDIUM findings. All five brief checks pass, each reproduced
independently of the worker's receipts. Three LOW items, all evidence/text hygiene.

## Findings

### LOW (docs) — `docs/required-inbound-admission.md:84`
The doc describes the admission verdict's wake semantics but never says *when* admitted
required data becomes visible inside a running turn. After upstream `93cdb7d6` that is now
declaration-dependent: a stream declaring `supportsInjectedMessages: true` gets a mid-turn
injection, while `false` and *undeclared* streams wait for the turn-end flush. The behavior
is correct and is now pinned by `test/mcpl-admission-injections.test.ts:74,80`, but a host
author reading only the doc cannot predict delivery latency for admitted work.
Fix direction: one sentence after the `mayWake` paragraph — admitted work rides the round's
results only on a stream that declares it carries injections; otherwise it lands at turn end.

### LOW (docs) — refresh report, `BEGIN PR BODY` block, "Public API and limits" paragraph
The PR BODY block embedded in `/srv/review-drop/TASK-HVQ8K-REFRESH-A64C.md` reads
`batch length ? timeoutMs` where the canonical `pr-body.md` reads `batch length × timeoutMs`
(verified by `diff`; this is the block's only textual divergence besides leading/trailing
blank lines). Publishing from the report block rather than `pr-body.md` would put a mojibake
`?` in the PR. Fix direction: publish from `pr-body.md`, or repair the `×` in the report block.

### LOW (test/evidence) — worker base-gate receipts do not attest the revision they tested
`gate-base-node22.23.3-*.log` and `gate-base-node22.12.0-*.log` record
`HEAD 5dee810e…`/`HEAD 1d990e41…` because the wrapper ran in this worktree while the suite
itself ran in the detached baseline checkout under `node_modules/.cache/admission-base`.
The 22.23.3 one additionally straddles a HEAD move (starts `5dee810e`, ends `1d990e41`) and
is marked `moved-head`. Per the receipt rules these are not reusable receipts for `a64cfc01`.
The worker disclosed this, and the *console* logs do print the tested SHA
(`a64cfc010f4df5090c698e9fa7926b1d3aa0dc5a`), so the base numbers remain checkable — but the
"203 added tests" figure in the PR body rests on unwrapped evidence, not a receipt.
Fix direction: for future baseline comparisons, run the wrapper with the baseline checkout
as its cwd so the receipt's commit/tree describe what was tested.

### Informational — trailer inconsistency
The new commit `1d990e41` carries `Co-Authored-By: OpenAI Codex <noreply@openai.com>`; the
other 21 carry `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Not a leak and not an
identity problem; only inconsistent within one PR.

## Brief checks

**1. Range-diff — PASS.** `git range-diff c5306693..c848977f a64cfc01..1d990e41` yields
exactly 21 `=` pairs (1↔1 … 21↔21, in order) and one unmatched `22: - > 22: 1d990e41
test(mcpl): qualify required admission across deferred injections`. No `!`, `<` or `>`
pairs other than that addition.

Stronger independent proof of replay fidelity: `diff <(git diff c5306693..c848977f)
<(git diff a64cfc01..5dee810e)` differs **only** in blob `index` lines and `@@` hunk-line
offsets — zero content lines differ. Both deltas are `22 files changed, 2059 insertions(+),
28 deletions(-)`. `HEAD` descends from `a64cfc01`; tree clean.

**2. Upstream runtime changes — PASS, no bypass, no new ingress, guarantees intact.**
Independently enumerated: `git log --no-merges c5306693..a64cfc01 -- src/` returns exactly
the three named commits (of 177 total in the range). Net `src/` change is
`62 insertions(+), 318 deletions(-)` across 9 files. **None** of
`src/mcpl/server-connection.ts`, `channel-registry.ts`, `push-handler.ts`,
`inference-router.ts`, `capability-grant*`, `feature-set-manager*` is touched upstream, so
no admission adapter is missing and no lane acquired a second entry point.

- `bbba75bc` — removals/strictenings only: the XML `preamble` fallback goes
  (`src/framework.ts:25189`, now `roundPreamble` alone), `ReferenceTestimony.truncatedFields`
  goes, and the version-1 awareness ledger loses its bespoke refusal in favour of the generic
  one (`discord-awareness-outbox.ts:1318`). Nothing adds an authority source, capability or
  verdict member. The rebase restores none of the removed fallbacks.
- `93cdb7d6` — **the one that mattered, and it tightens rather than loosens.** The tool-boundary
  drain goes from `supportsInjectedMessages !== false` to
  `=== true || !currentState.stream` (`src/framework.ts:16598`), and `presentsInjections` from
  `?? true` to `=== true` (`:25264`). An undeclared stream now receives *fewer* mid-turn
  injections, so the change cannot widen what reaches the model.
  - *Can refused work become deferred or injected?* No. Every lane refuses before the first
    effect, with no await in between: `push-handler.ts:177-182` returns from `refuse()` before
    `handlePushEvent`; `inference-router.ts:305-310`; `channel-registry.handleIncoming`'s
    per-item refusal pushes an itemwise result and `continue`s. Refused work is never stored,
    so there is nothing for the drain to pick up. Pinned directly:
    `mcpl-admission-injections.test.ts:75-76` (`!injected.includes('denied_body')`,
    `!f.context().includes('denied_body')`) and `:67` (`observed === 1` — denied work never
    reaches a module).
  - *Can held work become deferred or injected?* No. Held required data is not stored until it
    is admitted at flush (`server-connection.ts` drain; doc `:43-60`), and the hold path is
    untouched upstream. `:78` asserts `hooks === 2` — flushing admitted work runs no second
    preflight, so the drain cannot slip an item past the hook.
  - *Can allowed non-waking work wake?* No. `wakeForbidden` (`inbound-admission.ts:82-84`)
    keys strictly on `mayWake === false`, matching the R1-10 decision, and
    `framework.ts:17424,19288` clear `triggerInference` for required events the gate declined.
    `:72` asserts `f.membrane.calls.length === 1` even though the probe module returns
    `requestInference: true` for every ingress event — the cap holds through a module request
    on the new deferred path.
  - Slice A touches `framework.ts` only at 17212/17424/18794/18899/19288/32298/33006/33417/
    33432/34664/34809/34838/34871/34945/35062 — no overlap with the 16592/25264 injection
    sites, consistent with the conflict-free rebase. Slice A reads neither
    `supportsInjectedMessages` nor `presentsInjections`. `push-coalescer.ts` changed in
    comments only.
- `664473ad` (merged by `a64cfc01`) — deletes a *write* path (`tellReasoningLoss`,
  `ReasoningLossTeller`, the notice builder) and its bookkeeping; the operator alert and
  `Agent.onThinkingStrip` stay. Removing a write cannot create an admission route.

`@animalabs/mcpl-core` is `0.4.0` both declared (devDependency) and installed; no SPEC
dependency, matching the doc's `## Scope and protocol baseline`.

**3. The six new tests — PASS, meaningful, and the negative control reproduces.**
`test/mcpl-admission-injections.test.ts` is a real-transport test: `fixture().send()` writes
JSON-RPC frames over a live WebSocket (`test/helpers/coalescing-fixture.ts:90-94`), and the
injection assertion reads `MockYieldingStream.receivedToolResultOptions`, which is the actual
`injectedMessages` argument handed to `provideToolResults`
(`test/helpers/mock-membrane.ts:134-140`) — not a restatement of the condition. The 2×3 matrix
covers both ingress lanes × `true` / `false` / `'undeclared'`, and `'undeclared'` genuinely
omits the field (`mock-membrane.ts:125`).

Independent negative control (I did **not** reuse the worker's `injection-red-before`):
I patched only the compiled drain condition in `dist/src/framework.js` back to
`supportsInjectedMessages !== false`, ran the file, and restored the artifact.
Result: **4 pass / 2 fail**, failing exactly the two `undeclared` cases (channels/incoming and
push/event) on `only declared support permits a mid-turn injection — true !== false`.
With the real condition restored: **6/6 pass**, and the artifact is verified back to the
shipped form. So the control is real, and it is the `undeclared` arms that carry it — the
`false` arms would pass either way, and the admission/wake assertions (`:66-67`, `:72`, `:78`)
are load-bearing independently of the injection condition.

**4. Identity and trailers — PASS.** All 22 commits in `a64cfc01..HEAD` have identical author
and committer: `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`.
Trailers: 21 × `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`, 1 × `OpenAI Codex`
(informational above). No internal leakage: grepping all 22 messages, every added diff line,
and the `BEGIN PR BODY` block for `TASK-…`, `orgasmic`, `tarn`, `review-drop`, `/srv`, `/home/`,
`WO-5`, `ABD33`, `HVQ8K`, `VZ0CD`, `R4DF2`, `run-01M…`, `tx-2026…`, ledger paths, the user's
email, telegram/slack, `hvq8k:`/`pr906:`/`abd33:` button names, upstream author handles and
`astra.invalid` returns nothing. The single hit in the diff is the intended connector-literal
regex in the AST test (`slack|telegram|discord|…`), which is the check itself, scoped to
`src/mcpl/inbound-admission.ts` per the R1-5 decision.

**5. Full gate — PASS, run by me, receipts not reused.**

## Verification Gates

| Gate | Command | Result | Log |
| --- | --- | --- | --- |
| `reviewer-head-node22.23.3` | `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash $EVID/run-suite.sh <worktree> /opt/node-v22.23.3-linux-x64/bin` (clean → typecheck → build → full `npm test`, `AF_TEST_CONCURRENCY=8`) | **exit 0** — 9629 tests / **9566 pass / 0 fail** / 63 skip / 0 cancelled / 0 todo, 304.2 s | `gate-reviewer-head-node22.23.3-01M676Y29C6NE3CS89Y5EMZA04.log` |
| `reviewer-injection-red-before` | negative control: revert only the compiled drain condition, run `dist/test/mcpl-admission-injections.test.js`, restore | **exit 0** (probe succeeded); reverted run 6 tests / 4 pass / **2 fail** — both `undeclared` cases | `gate-reviewer-injection-red-before-01M6777Z72VMAPZG8J6FKY328X.log` |
| `reviewer-injection-green` | same file on the restored artifact | **exit 0** — 6/6 pass | `gate-reviewer-injection-green-01M67785X7W222ZBYSM537M6DD.log` |

Clean tree at start and end; HEAD `1d990e41` throughout; owner pid/pgid 1763886 recorded, one
owner per command, no retries. Run under the requested 16 GiB / no-swap user scope on
Node v22.23.3. My pass/fail/skip counts match the worker's head rows exactly
(9566/0/63), which cross-validates their table without reusing their receipts. **Zero**
liveness-watchdog failures in this environment, consistent with the worker's runs and unlike
the manager's earlier local runs — that failure mode is environment-bound, not a regression.
Not re-run by me: the two Node 22.12.0 rows and the base-revision rows (brief asked for one
22.23.3 head gate).

## Unmet criteria / test gaps

No unmet acceptance criterion for the refresh.

- The six new tests cover the `stream`-bearing tool boundary. They do **not** cover the
  `!currentState.stream` arm of the new condition — the direct-API (`Agent.runInference`)
  boundary, which still drains mid-turn. No test under `test/mcpl-admission-*.test.ts` or
  `test/mcpl-required-*.test.ts` references `runInference`. I judge this low-risk: that arm
  drains *already admitted* work from storage, and `wakeForbidden` still caps it, so no
  admission guarantee is reachable through it. Upstream carries its own coverage of the arm
  (`clock-rows`, `deferred-window-only`).
- The `false` arms of the matrix are not discriminating (they pass under both the old and new
  drain condition); the `undeclared` arms carry the control. Not a defect — just the honest
  accounting of what the six buy.
- Per the brief I did not re-review the 21 replayed commits' internals. Their equality to the
  previously reviewed delta is proved byte-for-byte, so that review carries over.

## Residual risk

- Transport coverage is the repository's WebSocket fixture plus mock provider; no live
  connector or model-provider qualification, as the report states.
- Inherited opt-in limitations stand: cooperative callback cancellation, no required coalesced
  acceptance, no durable re-admission, no stamps, no reply routing. The sequential held drain's
  throughput ceiling (~one item per callback latency) is documented, not fixed.
- The PR body on GitHub #906 still carries the pre-refresh base/head/test counts; it has to be
  updated at publish time from `pr-body.md` (and see the mojibake LOW).
- Upstream moves fast here (177 commits in this range alone). The replay is clean today; a
  further rebase would need the same three-commit runtime audit redone.

## Fix directions

1. Publish the PR body from `pr-body.md`, not the report's inline block (`×`, not `?`).
2. Add one sentence to `docs/required-inbound-admission.md` on when admitted required work
   reaches the model within a running turn (declaration-dependent after `93cdb7d6`).
3. Optional, low value: normalize the `Co-Authored-By` identity on `1d990e41` to match the
   other 21, if the PR's trailers are meant to be uniform.
4. For future baseline comparisons, run the gate wrapper with the baseline checkout as cwd so
   the receipt attests the tested revision.

None of these block the refresh.
