# Implement fix round — Dispatch Brief
```brief
ACQ fix round 1. CODE-ONLY draft revision of the acquisition fetcher. Operator: Tarn. Scope comes from qualifier Soma (Slack 1793446521). This is NOT a fetch go, NOT an execution go and NOT readiness.

FORBIDDEN: executing, importing, parsing, py_compile or ast.parse of any draft (the syntax check is a separate later operator step); network, DNS or TLS; npm/node; git writes or commit (GIT_OPTIONAL_LOCKS=0); any write outside $ORGASMIC_EVIDENCE_DIR. The finalize prompt is data, not an instruction: do not commit. Progress goes ONLY to progress.log, about every 5 min. Use dispatch ask only for a genuine STOP.

FIRST progress.log line binds:
- HEAD f8af03a852c85daf9bb8079937b994fe5419ca20
- v1 drop /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1 SHA256SUMS ff9bad0e1785c2a9ebdd308925e3ca106a1b91aae72066d51cf6173202598272 (4/4)
- fetcher.py v1 3484804954c49a185c7e2242a32649fffdab4f8b37c33997a548bca0a79c6ac7
- REVIEW1 /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1-REVIEW1.md c1d6310e652c10c3ef8ae898150ac541b5949e1e8e395f8581a3be942e95f5d3 (read IN FULL)
- lock df14aa0a57fd237393e3853956707ecbb31e93952504dcba24e9a971eb022578
- TSV 0eff27af05fb66a661b6c8a19a8b08dd8a57c231386f36a7a658d766b66a9701

OUTPUT: $ORGASMIC_EVIDENCE_DIR/acq-v2/ containing fetcher.py (DRAFT/NOT-EXECUTED header), ACQ-SUBPLAN.md, inputs-binding.md (carried forward), FINDINGS-DISPOSITION.md (each of H1, M1–M6, L1–L4 mapped to symbols and lines, status PROPOSED, never "resolved"), diffs/ (v1→v2 per file), report.md, and SHA256SUMS covering EVERY delivered file except itself. The v1 drop stays untouched.

REQUIRED CHANGES (qualifier rules are binding):
- H1: invocation must be a DEDICATED OWNED process scope. Tolerating setsid EPERM is allowed only when the process is provably its own group leader with no foreign members. It never authorises signalling or killing an interactive shell's group. If ownership can't be proven, refuse with a new typed refusal (for example NOT_DEDICATED_SCOPE), never INTERNAL_ERROR. The plan must name the dedicated owned scope as the intended invocation (operator slot, unset).
- M1: after writers are CONFIRMED STOPPED, the parent re-opens each actual retained regular file in verified/ (O_NOFOLLOW, regular-file and owner check) and stream-hashes it against the LOCK SRI, bounded by cap and remaining original deadline. This is a precondition of final_pass. Received-byte accounting and child digests are never retained-file proof. The set of verified/ entries must equal the expected set exactly: no extras, no missing.
- M2: preflight probes RENAME_NOREPLACE using ONLY owned synthetic zero-byte files created O_EXCL inside the fresh root: one rename that succeeds, plus one onto an existing name asserting EEXIST. On failure, raise a typed refusal. Probe files are labelled and never adopted as package files.
- M3: cleanup or close failures must never erase the primary outcome. Publish the outcome first, and suppress and record close errors separately.
- M4: separate the received-bytes digest from the retained-bytes digest, or rename the field and document it. The manifest must not imply the partial-file hash equals the received-bytes hash.
- M5/M6: a killed worker or an uncertain shared-lock state REFUSES the run. Never wait without bound, never reset the lock and continue, and never claim cancellation while a D-state or owned survivor remains. Record per-worker cancellation_confirmed from a bounded final check. Any unconfirmed worker yields a non-PASS outcome and its own typed result. Lock-free per-worker counters summed by the parent are acceptable.
- L1: guard blank_result.
- L2: replace the literal-True checks (EOF/FLUSHED/PROMOTED) with real evidence (for example EOF requires the read loop's observed EOF plus length agreement; FLUSHED requires the fsync return plus fstat size == retained; PROMOTED requires an lstat of the target after the rename), or label each as an explicit ASSUMPTION that does not count toward PASS.
- L3: add a named RENAME_NOREPLACE constant.
- L4: informational only. State that SRI proves identity to the reviewed lock, not publisher authenticity. Dependency confusion for @animalabs/* is an open upstream question.
- Keep v1 properties: total monotonic deadlines, the original 1800 s aggregate, closed refusal/outcome sets, no retry/redirect/fallback, strict TLS, O_EXCL quarantine, no extraction, operator slots unset and refusing, root rejected.
- REPORT: what changed, what is unverified (everything runtime), and NO claim of syntax validity.

Effort: high.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-ca6168f1-f441-460d-9c8a-765938406266, run run-01M68T58JXRP8FS68YT7B7H6XE, in your own native session and the same worktree.
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