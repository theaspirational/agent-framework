# TASK-ABD33 — generic recipient routing design

## Changed

- Added only `docs/design/GENERIC-RECIPIENT-ROUTING.md` (272 lines), committed locally as `b9e770a1e2f45a9ef2e717ced3715e58e9ba2bfd` on `task-abd33-impl`.
- Commit parent is requested upstream pin `4a45766f019fa11c8699645bd6806ebf3e13e5d1`. The assigned clean task branch initially pointed to an older upstream commit; it was rebased to the requested pin before writing.
- Fetched the two supplied rebased branches from the local clone, read all required inputs in full, read the standalone recipient patch including compatibility documentation/tests/fixture, and inspected upstream primitives and stacked integration sites.
- Design covers behaviour keep/drop/question inventory; connector/host/framework ownership; generic contract and negotiation; WO-5a/TAB7M insufficiencies and conflicts; 34-row neutral test mapping and red-first architecture test specification; sized upstream/fork slices; Slack/later Telegram migration; separate owner and maintainer questions.
- Source citations use full-SHA aliases and file:line locations. Required document hashes are recorded. In particular, the document corrects the old-design assumption that current-main `markAccepted` still updates the reply anchor.
- Read project baseline and applicable `CONTRIBUTING.md`; supplied conventions/gotchas were explicitly none. No AGENTS.md found in the worktree or applicable ancestor paths. No code, test implementation, dependency, generated-file or changelog changes. No push, PR, merge/landing, live provider, Slack or Telegram activity. Main checkout was read-only.

## Verification Gates

PASS, recorded reusable at clean commit `b9e770a1e2f45a9ef2e717ced3715e58e9ba2bfd`:

`orgasmic dispatch gate design-source-audit -- python3 "$ORGASMIC_EVIDENCE_DIR/audit-design.py"`

Log: `/home/orgasmic/.orgasmic/runs/run-01M63PH8ZF75G215JE6T06WDTC/evidence/gate-design-source-audit-01M63QE4GS6BYVT6NH0K7QQGZR.log`

Checks:
- Commit is directly on U, changes exactly the requested document, and worktree is clean; `git diff --check HEAD^ HEAD` passed.
- 102 source citation locations across 18 pinned files exist and are in range. This is a location audit, not automated semantic verification.
- All seven required input-file SHA-256 hashes match the document manifest.
- Source test inventory: 22 compatibility + 12 protocol = 34 expanded logical rows; all are mapped exactly once. Conditional standalone budget-hold skip explicitly documented.
- Recipient layer equivalence between R and S: 10 identical blobs and two identical changed-line multisets, both descendants of U.
- Expected-RED source witness: R contains six exact `'slack'` literals in framework routing paths, including lines 19823 and 32041; U contains none matching that code-string probe. The proposed AST architecture test is specified in the design, not implemented or claimed executed.

No build/full suite/runtime tests were assigned or run: this is a documentation-only task. No claim to reproduce historical 366/21 qualifications or reviewer runtime receipts. The evidence audit script is outside the worktree and is not product code.

## Unmet Criteria

None for this design-only assignment. Owner/maintainer questions explicitly gate future implementation/migration; their approval is not claimed. The red test deliverable is an implementable red-first test specification plus an observed failing-source condition, consistent with the no-code boundary.

## Residual Risk

- Generic threaded publish/typing negotiation and contextOnly spec vocabulary remain proposals, not accepted MCPL features. External SPEC assertions from TAB7M are clearly attributed to that input; no fresh external-spec qualification is claimed.
- Stored classification and mixed-summary provenance require a context-manager schema/compaction audit and restart/downgrade probes before rollout.
- Legacy push compatibility conflicts with strict admission's early/hinted traffic and replay limits; the design does not conceal this as unchanged behaviour.
- Host/connector adapters, full frozen-status effects, live connector migration, and the existing silent-turn/resume hazard need their own qualification. No runtime guarantee is inferred from document completeness.
