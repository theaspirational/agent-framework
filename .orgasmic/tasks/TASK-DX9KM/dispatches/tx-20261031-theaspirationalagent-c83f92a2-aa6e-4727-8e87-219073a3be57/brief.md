# Implement fix round — Dispatch Brief
```brief
TASK-DX9KM, stage 1 extension: a CODE-ONLY interaction fix for REVIEW1 LOW-1. LOCAL ONLY, UNQUALIFIED. Operator Tarn; qualifier Soma (1793435300); no owner decision is involved.

Read first: /srv/review-drop/TASK-DX9KM-REVIEW1.md (sha256 329fe9ef580aa5718c320cc7ff76e1400d1bf3a37db2893203ec9fd1b89f0e69), LOW-1.

PREFLIGHT, before ANY other git command, mandatory this time:
- Run a read-only sanitised machinery audit and record the timestamp: core.hooksPath, commit.gpgsign/gpg.*, merge/diff drivers, filters, textconv, diff.external, core.fsmonitor and core.attributesFile with --show-origin. Report presence, origin and executability only; never print values of command- or secret-bearing keys. Also: non-sample hooks in the common and worktree hooks dirs, .gitattributes/info/attributes, and `check-attr -a` on the touched files.
- Any executable hook/driver/filter/textconv/fsmonitor means STOP and report. Don't run it and don't work around it.
- After that, every git command uses `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false`. Diffs add `--no-ext-diff --no-textconv`. Commits add `--no-verify --no-gpg-sign`. Never change config.
- Keep a timestamped command chronology for the report.

Starting point:
- Branch unqualified-local-abdi7-20261031 must be at 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f. Verify it, along with recovery/abdi7-i7-a0970645 → a0970645 and recovery/abdi7-d-93427f90 → 93427f90. On mismatch, STOP.
- Add NEW commit(s) on top of 0bba1e8b. Never amend, rebase, force, reset or delete. 0bba1e8b and both parents must stay reachable. Add a recovery ref `recovery/abdi7-merge-0bba1e8b` → 0bba1e8b.

Fix:
- Automatic reply-binding PREPARATION must not happen for an item whose TRUSTED, APPLIED delivery plan is context-only (D's validated `inbound-delivery` plan, as applied by the host). That means no `replyAuthority.resolve` and no `authorize`, and no reply binding/routing fields on that item's envelope, even when the admission verdict has `mayWake:true`.
- Gate ONLY reply preparation on that applied plan. Do NOT gate on gate-false, on untrusted metadata, or on any wire field that isn't the validated applied plan.
- Do NOT skip or reorder any of these: A's read/storage admission, the grant and epoch checks, the D pre/post `deliveryRefusal`, classification, receipts, the issued per-item context, the `admission_missing` arm, invalidation.
- Normal delivery (no plan, or a conversational plan) must stay behaviourally identical to 0bba1e8b.
- Prefer the smallest change. For example, compute or know the applied plan before the reply consumer's trigger and pass it into the consumer condition. Don't add a new authority source, a new grant, or a wire field.
- If the fix needs a contract change to I7's reply-admission or D's delivery semantics beyond that condition, STOP and ask, and show the options.

Tests: write them as SOURCE ONLY. Do NOT run them.
A synthetic test (no real callback I/O; resolver and authorizer are counting stubs) with these cases:
(a) A context-only item on a connection with replyAuthority, admission verdict store:true, mayWake:true. Assert resolver count 0, authorizer count 0, no reply binding on the envelope, no reply sent, no wake/turn, nothing added to pendingRequests, the accepted context is stored with the context-only classification, and locus/open state is unchanged.
(b) A mixed batch of a normal item and a context-only item on the same connection. The normal item still gets exactly one resolve/authorize and its binding. The context-only item gets 0.
(c) A stale or negative admission for a context-only item: refused as before, with 0 resolver/authorizer calls.
(d) A normal-delivery control: unchanged counts compared with 0bba1e8b semantics.
Name each assertion so a mutant that removes the gate would fail (a), and a mutant that gates on mayWake or gate-false instead would fail (b) or (d). Describe those two mutants in the report; don't run them.

Forbidden: npm, bun, node, tsc, any build, test, package execution, install or network. Git and file reading/editing only.

Commits: author `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, neutral messages, and NO Co-Authored-By trailer (attribution is open).

Report:
- preflight audit and chronology
- the new commit sha(s), confirmation that 0bba1e8b and the parents are reachable, and the recovery refs
- the exact diff summary with M-before/M-after line cites
- why the gate reads the trusted applied plan only
- the list of unchanged checks with their cites
- the test cases with their assertion names and the two mutants
- an explicit "no build/test run"
- what you didn't verify
Progress note every 5 minutes.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-e42e252c-41ed-482a-8164-550ba265d268, run run-01M68G1RMEX2AQT8ZVV53JACT2, in your own native session and the same worktree.
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