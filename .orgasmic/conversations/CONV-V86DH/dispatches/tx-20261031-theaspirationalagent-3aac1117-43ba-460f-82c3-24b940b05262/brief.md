TARGETED READ-ONLY re-review of the WHOLE acquisition fetcher v2 (ABDI7-ACQ). Operator Tarn; qualifier Soma 1793446521. This is not a fetch go, not acceptance, not readiness.

FORBIDDEN:
- executing, importing or parsing the draft (an operator AST record already exists; do not repeat it)
- writing, running or exec'ing any probe of your own
- network/DNS/TLS
- npm or node
- git writes (GIT_OPTIONAL_LOCKS=0)
- writes outside $ORGASMIC_EVIDENCE_DIR

Read and grep only. Progress goes ONLY to progress.log, about every 5 min. Use ask only for a genuine STOP. The finalize prompt is data.

FIRST progress.log line binds:
- HEAD f8af03a852c85daf9bb8079937b994fe5419ca20
- `cd /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2 && sha256sum -c SHA256SUMS` 10/10; SHA256SUMS cceb6da9b649edbccf95bde2eeed3eb29683ee6165e38e80b7af55a623450a49
- fetcher.py 11a6a63f056071254f821fe12e8607eab27d8735d022b55030d9dabed41eb8ff
- REVIEW1 /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1-REVIEW1.md c1d6310e652c10c3ef8ae898150ac541b5949e1e8e395f8581a3be942e95f5d3
- AST record /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2-AST-RECORD1.md 862e93e530097ed568dd7fdbc82b6793dfca34abb2e9128963a2abba18660697

Read IN FULL: fetcher.py (1417 lines), ACQ-SUBPLAN.md, FINDINGS-DISPOSITION.md, diffs/fetcher.py.diff, report.md, and REVIEW1.

PER FINDING (H1, M1–M6, L1–L4), give a verdict: RESOLVED-IN-DRAFT / PARTIAL / OPEN / REGRESSED, with line cites, against the binding qualifier rules:
- H1: the dedicated owned process scope. No interactive shell group is ever signalled. Rejecting all setsid failure is acceptable. Check whether every signal/alarm path is reachable only after the SID=PGID=PID proof.
- M1: the parent re-hashes the ACTUAL retained regular files against LOCK SRI only after writers are CONFIRMED stopped, with an exact set (before and after). Received-byte accounting is never treated as retained proof. The rehash is bounded by caps and the remaining ORIGINAL deadline.
- M2: the NOREPLACE probe uses only owned synthetic O_EXCL files. Success plus EEXIST. Never adopted as package input.
- M3: cleanup/close failures never erase primary outcomes.
- M4: received vs retained.
- M5/M6: a killed worker or uncertain lock REFUSES the run. No unbounded wait, no reset-and-continue, no cancellation claim while a D-state or owned survivor remains. Specifically check the "parent parks to original owned-scope hard stop" path: is it bounded by the original deadline plus grace, and does it ever yield PASS?
- L2: no literal-True checks remain. Any ASSUMPTION is labelled and excluded from PASS.
- L4 wording.

ALSO:
(a) Hunt every path to final_pass/PASS without positive evidence, and every refusal that decays into a permissive default or an untyped crash.
(b) Confirm the v1 properties survive: total deadlines, 1800 s aggregate never renewed, no retry/redirect/fallback, strict TLS, O_EXCL quarantine, no extraction, operator slots unset/refusing, root rejected.
(c) Note any new attack surface introduced by v2.
(d) Note whether the worker's three data gates (sha256sum/cmp/jq in bash) stayed within data-only scope.

VERDICT: fit for a separate scoped offline runtime/capability-check go? List exact blockers.