# TASK-ABD33 — fix round 1 (documentation only)

## Changed

- Read `/srv/review-drop/TASK-ABD33-REVIEW1.md` in full (242 lines; SHA-256 `6a50d9ad2299c36bf0e3cbc85bfa4ed2a29e9870726dae729b84c23d3b5b0109`) and verified the findings against the pinned sources.
- Made exactly one new local commit: `3251eace46be5d47ef7cd1f6a884c7fba188d249`, parent `b9e770a1e2f45a9ef2e717ced3715e58e9ba2bfd`, on `task-abd33-impl`.
- Only changed `docs/design/GENERIC-RECIPIENT-ROUTING.md`: **21 insertions, 8 deletions** (285 final lines).
- Added handshake RED witnesses at R server-connection lines 1320 and 1407–1410; corrected registry witness to 973 and added 1189.
- Expanded the architecture scan to push-handler, inference-router, admission/admit and the runtime closure of both existing and new path modules.
- Added keep-generically inventory rows for coordinator/agent-tool locus suppression and frozen announcement routing; added four supplemental neutral witnesses N1–N4 for those behaviours, pending-request dedupe and request equality. All four now appear in slice B's exit condition. The original 34-row mapping is unchanged.
- Clarified that the cited announcement sites are the sleep tool's explicit-pin and locus routes, with actual announcement publication required in the witness and mismatched pins failing closed.
- Corrected T:10 to T:9; moved O2 to maintainer wording question M6, explicitly retaining T's already-decided wire-tag refusal.
- Raised A from L to XL (11–20 engineer-days) and B from M to L (6–10), with scope/coverage reasons.
- Final document SHA-256: **`95e0a30ef8aebb5df3150534262e191038a836be9c3ea942f4e9b7d27afed672`**.
- No product code/tests, dependency, generated-file or main-checkout changes. No push, PR, merge, Slack/Telegram or live connector activity. Audit helper/report are outside the worktree in this round's evidence directory.

## Verification Gates

Fresh gate at the final clean commit, **PASS / exit 0 / recorded reusable**:

`orgasmic dispatch gate design-source-audit-fix1 -- python3 "$ORGASMIC_EVIDENCE_DIR/audit-design.py"`

Log: `/home/orgasmic/.orgasmic/runs/run-01M63RH9GMQE1EVFFF5ZKGNW3X/evidence/gate-design-source-audit-fix1-01M63RR48VZ43TPCPB1FNSANHC.log`

The extended audit checks:
- Exactly one documentation-only follow-up on the reviewed commit; clean worktree; `git diff --check HEAD^ HEAD`.
- All 113 source citation locations across 18 pinned files exist and have valid ranges.
- Every new/changed source citation is printed from its pinned SHA. Targeted line-content assertions verify coordinator guard, both announcement binding arguments, dedupe/equality comparisons, handshake witnesses and corrected registry literals. T:9,18,42,64 are checked against the unchanged input document. I also read the changed ranges to verify their meaning, rather than treating valid line numbers as semantic proof.
- Source coupling probe now reads eight initial runtime modules at both U and R, including server-connection.ts and all three newly listed modules. Expected RED witnesses: eight in framework, three in channel-registry, four in server-connection. The added ingress/admission modules have zero case-insensitive Slack hits at both pins. Separate assertions retain the legacy protocol parser witnesses. This is a source probe, not execution of the future AST test.
- Seven original input hashes still match; R/S layer equivalence still holds (10 identical blobs and two equal changed-line multisets).
- 22 + 12 = 34 inherited logical rows remain mapped exactly once; four supplemental witnesses and their slice B exit conditions are present.
- All six requested fix directions, final document hash and diff summary.

### Inherited evidence and limits

The earlier complete input/source reads and design baseline at `b9e770a1` remain applicable to unchanged architecture and test mappings. U/R/S pins and the seven input documents are unchanged; their hashes, layer equivalence and test inventory were rechecked in this round's gate. The earlier audit helper was copied into **this round's** evidence directory and extended, including the follow-up commit-parent check. No earlier gate receipt is presented as a pass for this round. Review findings were treated as claims and checked directly.

No runtime build, typecheck or test suite was run or implied: the assignment is doc-only and names the design-source audit, not runtime gates.

## Unmet Criteria

None for the narrowed fix-round brief. One local follow-up commit exists; all requested document changes and the extended audit are complete.

## Residual Risk

- The architecture test and neutral witnesses remain design specifications, not implemented tests. The source probe uses line-based witness detection, not a general AST classifier.
- Generic protocol acceptance, store/compaction support, connector trust/status inventory, strict-admission rollout compatibility and the silent-resume hazard remain explicitly unresolved implementation/migration risks from the design. This round adds coverage requirements, not runtime qualification.
