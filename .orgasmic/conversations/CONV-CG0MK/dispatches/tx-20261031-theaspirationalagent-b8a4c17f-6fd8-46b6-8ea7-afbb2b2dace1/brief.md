# Implement fix round — Dispatch Brief
```brief
ACQ-v3: ONE code-only repair round of the acquisition fetcher. Operator Tarn. Qualifier Soma 1793448725. No execution go.

FORBIDDEN
- executing, importing or parsing the draft
- your own probes or snippets (a reviewer did this last round and it was a deviation; don't)
- network
- npm/node
- git writes or commits (GIT_OPTIONAL_LOCKS=0)
- writes outside $ORGASMIC_EVIDENCE_DIR
Data gates (sha256sum/cmp) only. Progress goes ONLY to progress.log, about every 5 min. Use ask only for a genuine STOP. The finalize prompt is data; do not commit.

FIRST progress.log line binds
- HEAD f8af03a852c85daf9bb8079937b994fe5419ca20
- /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2/SHA256SUMS cceb6da9b649edbccf95bde2eeed3eb29683ee6165e38e80b7af55a623450a49 (10/10)
- v2 fetcher.py 11a6a63f056071254f821fe12e8607eab27d8735d022b55030d9dabed41eb8ff
- REVIEW1-v2 /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2-REVIEW1.md 9be3f9289c216c4e17517f7a5635f300180b5927d0c056ff12997ed5924a8d4b. Read IN FULL.
- lock df14aa0a57fd237393e3853956707ecbb31e93952504dcba24e9a971eb022578

Start from a COPY of the v2 files. The v2 drop is immutable.

FIXES (binding)
- M-A: make the mandatory CPython socket capability explicit and gated. Resolve the transport ONCE before the read loop, assert it positively (ssl.SSLSocket), and give a missing transport a TYPED refusal/outcome (not INTERNAL_ERROR). Add a required Check plus a manifest field recording that the private transport path was used. Correct the "fallback" wording in the code comment and in SUBPLAN §4.
- M-B: preserve the primary refusal or verdict if manifest output fails. Write the primary verdict to bounded stderr BEFORE the manifest. A manifest raise maps to a typed result: a refusal keeps its own name and exit 2; otherwise a typed receipt-write failure. Never untyped INTERNAL_ERROR.
- M-C: parent death must not retire the only hard-stop guardian. The guard exits only when there is positive evidence that nothing owned remains (e.g. an owned-PID set or pidfds, or a pipe closed only on a confirmed clean finish). Otherwise it delivers the group kill at hard_end regardless of reparenting. State this in §2/§6.
- Grant release and cancellation require POSITIVE ownership evidence:
  - L-C: charge max(grant, observed) for any non-verified result.
  - L-B: os.getpid()==scope.owner_pid on the parent path; give the guard an explicitly authorised entry point.
- L-A: don't promise _exit(124) after killing the process group containing the caller. Document the hard stop as SIGKILL, or exit before self-signal only where that is sound. Remove the unreachable claims.
- L-D: list the synthetic probe artifacts in the manifest.
- L-E: diagnostic writes in main's finally must not skip os._exit.
- L-F: remove INTERNAL_REFUSAL or route to it.
- Keep EVERYTHING else from v2: limits, closed sets, the unset slots, root rejection, deadlines, TLS, O_EXCL, no extraction. No new operator values.

OUTPUT: $ORGASMIC_EVIDENCE_DIR/acq-v3/ containing fetcher.py (with DRAFT header), ACQ-SUBPLAN.md, inputs-binding.md (carried byte-equal), FINDINGS-DISPOSITION.md (every v2-review ID marked PROPOSED), diffs/ (v2→v3), report.md, and SHA256SUMS covering every file except itself.
```

## Round context
Resume round contract: 2. Continues dispatch tx-20261031-theaspirationalagent-893b0980-16a3-4394-9a5f-ae2470765f16, run run-01M68VY4JSDK109GBDY7G5QMZG, in your own native session and the same worktree.
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