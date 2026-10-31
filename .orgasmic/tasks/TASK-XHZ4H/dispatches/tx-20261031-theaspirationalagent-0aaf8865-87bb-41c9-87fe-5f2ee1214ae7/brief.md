# Implement fix round — Dispatch Brief
```brief
D fixture fix round (TASK-XHZ4H), from head b6e225e07a8214894c3f721dfb14ac0c1cf75714. Engineering choice by Soma (programme qualifier), passed on by the task operator Tarn; not a decision by the owner Vasyl.

FINDING (Tarn's matched gate, 22.23.3, a fresh clone + `npm install` without a lockfile): test 884 "fork seed normalization preserves alignment or refuses before any shifted normal classification is stored" (test/context-only-delivery.test.ts ~:515) fails: test/fixtures/context-only-fork-seed-child.mjs:12 `'0.24.2' !== '0.24.1'`. AF has no root lockfile; `^0.24.0` resolved to @animalabs/context-manager 0.24.2, whose dist/src/normalize-tool-messages.js has sha256 dcfff6de61ea5e77ea2d75100a29021d79ba1e45844302cd8b34ffcc2526701a, the same as the hash the fixture checks. This is review 4's LOW-1.

DO: (1) the fixture binds to the normalizer's HASH contract (dcfff6de…701a), not the version string; (2) a discriminating control: a different normalizer hash (e.g. a temp copy of the module with one byte changed, via a mock/loader in the test only, without modifying node_modules) → the test REFUSES (fails loudly / skip-with-reason isn't allowed; it must be a clear failure of the precondition), and a mutant that removes the hash check is killed; (3) the receipt/test output records the actual CM version and the integrity from the installed package.json/package-lock if one exists, as EVIDENCE, with an explicit note that identical normalizer bytes do NOT establish whole-package compatibility. DON'T: pin AF's dependency, change package.json/lockfile, change the production guard (framework.ts L1) or permissions.

GATES (qualification): ONE frozen resolved dependency closure for the matched base b6e225e0 + fix-head: one `npm install` → save the generated package-lock.json and `npm ls --all --json` as EVIDENCE (don't commit them), then use exactly that node_modules closure (copy or `npm ci` from the saved lock) for base and head. Node 22.23.3 /opt/node-v22.23.3-linux-x64/bin/node and 22.12.0 (absolute path to the executable; preflight: full sha256 + `node --version` BEFORE npm/test; record them), sequentially, AF_TEST_CONCURRENCY=8, a 16G systemd --user scope, `timeout --signal=TERM --kill-after=60s 3000s` around the cell, log capped at 64 MiB with producer/PIPESTATUS kept; 124/137/141/cap hit/log_capture≠0 = inconclusive. Exact exit/total/pass/fail/skip/cancelled + failure names. No retry-until-green and no "environmental" labels. A progress line from observed activity every ≤4 minutes.

COMMITS: per concern, author/committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`, no internal names or private paths. No push. In the report: the diff, the control, the mutant, the dependency closure (lock sha256, CM version/integrity), all cells.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261030-theaspirationalagent-e9567a93-9473-4b64-a12d-fb36736c3f18, run run-01M67F20N3M33QABRKHQTQN6QN, in your own native session and the same worktree.
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