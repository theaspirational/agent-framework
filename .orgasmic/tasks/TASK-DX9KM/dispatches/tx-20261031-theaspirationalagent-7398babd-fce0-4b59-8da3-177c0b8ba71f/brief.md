# Implement fix round — Dispatch Brief
```brief
TASK-DX9KM ROUND 4: bounded, CODE-ONLY. LOCAL ONLY / UNQUALIFIED. Operator Tarn. Scope go from qualifier Soma (1793439302); this is not an owner decision.

BASE: exactly 9184d91e796ccd201831d9456a8662d9abd47d28 on branch unqualified-local-abdi7-20261031.
- Your first progress note must state `git rev-parse HEAD` and the branch.
- If the branch is not at 9184d91e, STOP and ask.
- Before editing, create recovery ref `recovery/abdi7-r3-9184d91e` → 9184d91e. Never move or delete existing recovery refs. 9184d91e and all earlier evidence stay immutable.
- New additive commit(s) only. Author and committer: `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, neutral message, NO trailer.

PREFLIGHT, before any other git command: the same sanitised config/hook/attribute audit as round 3. Every git command uses `-c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false`; diffs use `--no-ext-diff --no-textconv`; commits use `--no-verify --no-gpg-sign`. Keep a timestamped command chronology.

FORBIDDEN: npm, bun, node, tsc, build, typecheck, test, mutant execution, install, network, push, merge, rebase, amend, reset, force, deleting anything, package/publication. Progress note at least every 5 minutes.

READ FIRST, in full, and verify the hashes:
- /srv/review-drop/TASK-DX9KM-LOW1-R3-REVIEW2.md (sha256 0ec564aea51569d222d5258014ab641c2e112e4206ecae0a723f83245c2ccbc2)
- /srv/review-drop/TASK-DX9KM-LOW1-R3.md (6d8230de55f8755f36ac18b6321b79c8759e35649edafcd8cc5a182fe2dd93b8)

WORK (qualifier rulings are binding):
1. MEDIUM, throttle. Route the plan-loss diagnostic at reply-admission.ts:37-39 through the existing RefusalLines pattern (src/mcpl/refusal-lines.ts:27, as used at channel-registry.ts:1960-1961 and inbound-admission.ts:217), per connection/lifetime.
   - Bounded state, fixed content. No untrusted mode, payload, item, callback or credential echo.
   - NO change to admission, suppression or reply behaviour just to throttle a log. The suppression predicate at :41 stays semantically identical.
   - Reuse the existing holder type; don't invent a new logging framework.
2. LOW-1, diagnostic predicate. The predicate may recognise the MODE of the already-trusted carrier `applied`, or of an argument that can only restrict. It must never turn a wire or caller claim into permission.
   - In code comments and in the report, distinguish (a) different CONSTANT identities (two copies of CONTEXT_ONLY: a structural mode check fixes the false-positive diagnostic) from (b) different AsyncLocalStorage STORE instances (a second module copy has its own store, so `applied` is undefined there; structural comparison CANNOT recover that context).
   - Do NOT claim it fixes both. Do NOT add any global or cross-module registry (no globalThis/Symbol.for store).
   - State the supported loading modes explicitly: Node `import` → dist, Bun → src per package.json exports. Mixed src/dist or duplicated installs are unsupported, and in that case carrier protection degrades to argument-only (still closed when the argument is forwarded).
   - Node/Bun execution remains UNKNOWN.
3. LOW-2, probe export. If feasible within this round, minimise or remove the `appliedDispatchDelivery` export, e.g. make the read module-local and give reply-admission a non-widening path. Do not break the test's ability to observe the carrier without adding new public surface; if tests need it, prefer an approach that adds no new package-reachable export.
   - If it isn't feasible, keep the export and record its real limitation: it is shipped and reachable via node10 resolution, filesystem paths or createRequire, as an unsupported subpath. Do NOT claim `@internal` hides it.
4. LOW-3, test. The scoped positive must actually PROVE accepted and stored context (accepted verdict, stored item and classification present) BEFORE it counts zero resolve/authorize/routing.
   - A refused re-wrapper (admission_missing) is a NEGATIVE case; label and assert it as such, and don't let it stand in for the positive.
   - Fix the "in-both-configs" names at test:142-143 so they no longer over-claim, or add a scoped event-bearing positive.
5. LOW-4, test. The console.error mock at test:356 must re-emit unrelated lines through a bound original (mirror test:38-41), and restoration must be safe: t.mock restore or try/finally.
6. Docs and comments: supported-chain omission safety (section A of REVIEW2) stays SEPARATE from the five unsupported deferral counterexamples (section B: outside queue/drainer, emit outside scope, pre-attached thenable, pre-existing timer, Worker/MessagePort). Make no universal omission claim.

Keep the binding truth table (i)–(iv) exactly as in round 3, and echo it in progress before committing.

GATES, source-only, via `orgasmic dispatch gate`, fresh at the final head: whitespace; protected modules vs 9184d91e (the same list as round 3, adjusted only for files this round intentionally edits, each listed with its reason); reachability of 9184d91e, 54ebfc58, 0bba1e8b, I7 a0970645 and D 93427f90; clean tracked tree.

REPORT:
- final sha, diff stat (prod/test split), before→after cites for each item 1–6
- the type-surface delta (any export added or removed)
- the throttle state bound
- the loading-modes statement
- a mutant matrix update, described only, not run
- an explicit UNKNOWN list
No claim of runtime semantics.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-255bacfe-2428-46c0-a3a8-4f06ed0354b9, run run-01M68JW5EB1QKRDB4KSVDEFVD5, in your own native session and the same worktree.
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