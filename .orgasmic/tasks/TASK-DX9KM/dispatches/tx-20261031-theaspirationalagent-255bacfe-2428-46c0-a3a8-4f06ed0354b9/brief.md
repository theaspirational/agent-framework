# Implement fix round — Dispatch Brief
```brief
TASK-DX9KM round 3: a CODE-ONLY coverage, LOW and fail-closed round on top of 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27 (branch unqualified-local-abdi7-20261031). UNQUALIFIED, LOCAL ONLY. Operator Tarn; the binding scope comes from qualifier Soma (1793437032); no owner decision is involved.

Read first, and verify the shas:
- /srv/review-drop/TASK-DX9KM-LOW1-REVIEW1.md (a9763762f6a90b6aa5c4327d17507977ed1e4f838cb4339326e864ed882d6647), including the addendum
- your own previous report /srv/review-drop/TASK-DX9KM-LOW1-FIX1.md (3dfb0445…fd0a)

SAFETY, the same as round 2. Do this up front, before your FIRST git command:
- Run a sanitised machinery preflight that records only presence, origin and executability, with a timestamp. Any executable hook, driver, filter, textconv or fsmonitor means STOP.
- Prefix every later git command with `-c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false`. Add `--no-ext-diff --no-textconv` to diffs and `--no-verify --no-gpg-sign` to commits.
- Keep a timestamped chronology.
- Make new additive commits only: no amend, rebase, force, reset or ref deletion, and no push.
- Author `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, no trailer.
- Before you start, add `recovery/abdi7-low1-54ebfc58` → 54ebfc58. Keep all existing recovery refs.
- NO npm, bun, node, tsc, build, typecheck, test, mutant execution, install or network. Progress note every 5 minutes.

PART 1: fail-closed mechanism (closes MEDIUM-1/3; tests alone do NOT close them).
- Problem: a missing plan currently defaults to conversational (`delivery?.conversational !== false`). An unscoped 3-arg wrapper that drops the plan silently brings back resolver/authorizer callback I/O for context-only items.
- Do NOT make the public `admit` 4th parameter mandatory: `RequiredIngress` is structurally PUBLIC via `admissionFor()`, `handleIncoming`, `handleRequiredPushEvent` and `handleInferenceRequest`. Legacy normal callers must keep compiling and behaving exactly as before.
- Propose and implement ONE small INTERNAL mechanism using the existing machinery, so that on the context-only path a missing or lost plan SUPPRESSES reply preparation instead of defaulting to conversational.
- Candidate for you to evaluate, not mandated: inside `withReplyConsumer`, treat an item that carries the delivery selector (D's existing `hasDeliverySelector`, presence only, used purely as a restriction) as context-only unless the applied plan is exactly the host's frozen `CONTEXT_ONLY`. If the plan is missing or mismatched, prepare nothing. A wire hint may then only REMOVE preparation, never grant it. Alternatively, use a validated issued-context or private-symbol carrier already in the codebase (e.g. the `inbound-delivery.ts` private symbol or the `registration-ingress.ts` WeakMap pattern).
- Whatever you choose, justify that it adds no new authority, wire mode or caller-trusted claim, and that A's verdict, storage, epoch and order, D's validation, B's routing and the push and inference lanes stay intact.
- If the only workable fix needs a broader contract choice (a public signature change, a new wire field, a new grant, or changing what A sees), STOP and ask with run_ask. Do not improvise it.

PART 2: test source (not executed).
- Run the callback-zero context-only case (a) through the REAL chain in both the scoped (registrationScope) and the UNSCOPED config: parameterise setup() so it builds without registrationScope and drops the view wait.
- Assert on the LIVE `pendingRequests` field, not a captured array's patched push.
- Make the stale case (c) barrier-based, following `test/registration-view.test.ts:140-168`, with no reentrant `f.send` inside the hook.
- Add push/event and inference/request normal no-plan controls: behaviour unchanged, and preparation still happens on push where it applies.
- Add one test proving the Part 1 mechanism: a wrapper drop (simulate the plan going missing on the context-only path) results in zero resolve, zero authorize and no routing fields, in BOTH configs.
- Mutant plan, described and not run: S1 (drop at `channel-registry:1983`), S2 (drop the consumer param), S5 (an explicit 3-arg re-wrapper at the compositor, in both scoped and unscoped configs). For each, name the killing assertions, and under Part 1 explain why S1/S2/S5 now fail closed (they suppress preparation) and are still detected.
- Record S3/S4 as honestly unobservable where the outermost consumer has already consumed the plan. Do NOT reorder anything just to kill them.
- Leave the inverted scaffold at `:188` as it is and add a one-line comment saying the inversion is deliberate and is the only kill for S4.
- Fix the `:1` header to mention that the admission hook does real I/O and state mutation in (c).

PART 3: type surface.
- Add `export type { DeliveryPlan }` ONLY if Part 1 actually needs consumers to name it. Do not add it just because the root lacks it.
- List every exact surface change, before and after, for each publicly reachable declaration.
- Emit and consumer checking stay UNKNOWN.

Report:
- diff and stat
- the mechanism and its justification
- cites for unchanged invariants
- the test inventory with assertion names
- the mutant matrix
- exact surface deltas
- gates: source-only git gates at the final head (whitespace, protected modules — note any now-intentional change — reachability of 0bba1e8b/I7/D/54ebfc58, clean tree)
- an explicit "no build/test run"
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-c83f92a2-aa6e-4727-8e87-219073a3be57, run run-01M68H7A0PSTV76HAV765V0V2C, in your own native session and the same worktree.
Changed this round: the brief above narrows the assignment; use this run's evidence directory and report, not the earlier round's destination.
Original instructions are history, not missing context. Original scope, security and read-only-ledger boundaries still apply, narrowed by this brief. Do not replay startup reads unless changed facts or this brief require them. Do not merge or close the dispatch.

## Evidence and verification
Earlier reads/code/reports remain context, not new proof. Identify valid inherited evidence and its unchanged inputs/scope in this round's report. No earlier gate pass is implied by resuming. Verify findings against current source. Run assigned checks and scoped probes through `orgasmic dispatch gate <name> -- <cmd> [args...]`; missing receipts do not assign a full suite. Keep builds outside evidence.

## Completion for this round
Report Changed, Verification Gates (commands/results/logs and inherited evidence), Unmet Criteria, and Residual Risk in `$ORGASMIC_EVIDENCE_DIR/report.md`. If unset, substitute a scratch path outside the worktree below.
For done, satisfy the narrowed brief and make a local commit in this worktree; stage explicit paths and do not bypass hooks. Then run:
`orgasmic dispatch finalize --status done --summary-file "$ORGASMIC_EVIDENCE_DIR/report.md"`
If blocked, report the exact unmet criteria and run:
`orgasmic dispatch finalize --status blocked --reason "<why>" --summary-file "$ORGASMIC_EVIDENCE_DIR/report.md"`
Blocking decision: `orgasmic dispatch ask "<question>"`; keep it alive for the stdout answer. A timeout is not permission. With `--no-wait`, Codex app-server accepts answers/messages mid-turn; other multi-turn harnesses receive them at turn boundaries or finalize. If finalize refuses for pending messages, handle their full text and retry. Successful finalize is terminal; no work follows it. Never disclose credentials or the run token.