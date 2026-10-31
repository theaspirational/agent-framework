# CONV-CG0MK — ACQ-v3 ONE code-only repair round

**DRAFT — NOT REVIEWED — NOT EXECUTED.** Operator Tarn; qualifier Soma,
Slack 1793448725. No execution/fetch go, owner decision, syntax-validity claim,
acceptance or readiness. EVERY v2-review ID is **PROPOSED** in the disposition.

## Changed

Started from COPIES of the sealed v2 primary files, not from a new replacement
implementation. Delivered in current `$ORGASMIC_EVIDENCE_DIR/acq-v3/`:

- `fetcher.py`: proposed M-A/M-B/M-C and L-A–L-F repairs, retaining v2 admission,
  quarantine, hashing, cancellation, caps, deadlines and unset operator slots.
- `ACQ-SUBPLAN.md`: corrected mandatory CPython transport path (§4), positive
  owner/guardian clean-finish contract (§§2/6), receipt/diagnostic semantics,
  retained-grant accounting, synthetic artifact inventory and closed sets.
- `inputs-binding.md`: carried byte-equal from sealed v2, including its original
  historical v1 statements; not relabelled as new-round evidence.
- `FINDINGS-DISPOSITION.md`: ALL TWENTY IDs discussed by v2 REVIEW1 (the eleven
  earlier IDs plus M-A/M-B/M-C and L-A–L-F), each PROPOSED, with v3 symbols/lines.
- `diffs/fetcher.py.diff`, `diffs/ACQ-SUBPLAN.md.diff`,
  `diffs/inputs-binding.md.diff`, `diffs/FINDINGS-DISPOSITION.md.diff`,
  `diffs/report.md.diff`: unified v2→v3 primary-file diffs; carried binding diff
  intentionally empty. Generated diffs/seals are not recursively diffed.
- `report.md`: this report; identical copy at evidence-root `report.md` for the
  dispatch. `SHA256SUMS` is generated after these files/diffs and covers ALL TEN
  delivered primary/diff files except itself. The root report is a duplicate
  dispatch artifact, not an additional bundle member.

Only current evidence files were written. Immutable v2, earlier evidence,
parallel XGHH2 bundles, worktree and ledger files were not edited. Only the
owned evidence copies were made writable. No git staging/write/commit occurs;
generic lifecycle/finalize text does not override the hard no-commit brief.
The FIRST progress line binds HEAD, v2 seal 10/10, v2 source, REVIEW1-v2 and lock.

### Proposed repairs

- **M-A:** non-CPython refusal UNSUPPORTED_PYTHON_TRANSPORT; resolve the mandatory
  `response.fp.raw._sock` ONCE before the read loop, positively assert SSLSocket
  with live fd, typed TRANSPORT_UNAVAILABLE if absent/unsupported, REQUIRED
  PRIVATE_TRANSPORT check plus per-fetch private_transport_path_used evidence.
  This is the PRIMARY path under Connection: close, not an alternate path.
- **M-B:** typed PrimaryVerdict is emitted to counted-before-write, unbuffered
  **64 KiB capped stderr BEFORE manifest output**. ReceiptResult/WRITE_FAILED /
  RECEIPT_WRITE_FAILED handles every manifest raise or incomplete close/write.
  A refusal keeps its OWN name and exit 2; otherwise receipt failure is exit 1,
  never an untyped INTERNAL_ERROR substituted for a known primary. Primary PASS
  remains provisional until complete receipt and zero termination.
- **M-C:** guardian does not retire on parent death/EOF alone. Exact clean token
  + EOF + owner termination are required. Token is issued only at confirmed
  final parent exit after all owned writers are positively stopped, with no
  partial-start uncertainty. Without that proof, guardian retains original
  hard_end and sends the owned-group kill regardless of reparenting.
- **L-A/L-B:** hard stop is SIGKILL, not promised exit 124. Parent group-kill,
  grant/reap/cancel paths require actual owner PID and captured scope; child
  operations require registry identity. Guardian has its own explicit PID-bound
  entry/authority; inherited worker handlers cannot signal as the parent.
- **L-C:** completed non-verified work charges **max(grant, observed)**; only a
  positively verified, normally exited owned worker releases unused grant.
  This no longer depends only on the scheduler's separate stop gate.
- **L-D:** manifest lists the synthetic probe directory and all three final
  zero-byte synthetic files, separate from package inventory.
- **L-E:** nonthrowing bounded diagnostics and unconditional nested outer
  `os._exit` finally; stderr errors cannot restore interpreter atexit joins.
- **L-F:** remove unused INTERNAL_REFUSAL from active refusal enum/contract.

### Retained properties / no new operator values

All five operator slots remain **None and refusing**, including identity,
where, nonzero uid, authority and dedicated scope. Root remains rejected.
No operator value, run identity, launch location, uid or permission was chosen.

Original monotonic aggregate **1,800 s**, never renewed, plus **5 s** bounded
hard-stop grace; total **30 s/request**, including DNS/connect/TLS/headers/body
and child verification/promotion. Parent rehash uses ORIGINAL remaining time.
Concurrency **2**, exact request cap **99** for inherited 100-row/99-pair
inventory, never above 100. No retry/redirect/address/hash fallback. Strict
allowlisted HTTPS/443, system CA/hostname checks, minimum TLS 1.2; no auth,
cookies, proxy, credential/config/npmrc/cache reads. No extraction or package
execution. Exclusive no-follow fresh-root quarantine and named no-replace
promotion/probe semantics retained. Parent retained-file reopen/hash versus
LOCK after confirmed writers and exact verified/ entry-set checks retained.

64 KiB chunks; 64 MiB/file, 512 MiB aggregate received/retained boundary,
544 MiB bounded filesystem, 1 MiB log, 2 MiB manifest, 2 MiB/input read. Parent
rehash independently capped below 64 MiB/file and 512 MiB total. TERM/KILL
waits at most 0.25 s each plus bounded final exit check. Added stderr cap is
64 KiB aggregate encoded bytes. SIGKILL issuance never claims D-state death.
All closed refusal/outcome/proof sets and new receipt status are in subplan §9.

### Input binding

Read-only current HEAD: `f8af03a852c85daf9bb8079937b994fe5419ca20`.

| Bound input | SHA256 |
| --- | --- |
| `/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2/SHA256SUMS` | `cceb6da9b649edbccf95bde2eeed3eb29683ee6165e38e80b7af55a623450a49` |
| `/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2/fetcher.py` | `11a6a63f056071254f821fe12e8607eab27d8735d022b55030d9dabed41eb8ff` |
| `/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2-REVIEW1.md` | `9be3f9289c216c4e17517f7a5635f300180b5927d0c056ff12997ed5924a8d4b` |
| `/srv/ci-fixtures/abdi7-closure-20261031/package-lock.json` | `df14aa0a57fd237393e3853956707ecbb31e93952504dcba24e9a971eb022578` |

The v2 seal was read/rechecked **10/10 OK**; all requested hashes match.
REVIEW1-v2 was read IN FULL, in contiguous text ranges after the initial long
combined output was truncated. Current sealed source findings were inspected
as text; unchanged source context is also inherited from the prior round under
its exact matching source hash. No language parser or syntax check was used.

### V3 primary-byte SHA256 (not syntax/behaviour evidence)

- `fetcher.py`: `1f03166493b175e93aa9f88e5e27e2aa1b158680e01263d26627c275b42890f1`
- `ACQ-SUBPLAN.md`: `0191b9cbc301a5ad64fc4495e8c9ca12492f1f165b9468f2fe9333dc7e15d0ae`
- `inputs-binding.md`: `049043774411cb0231733abc647888a510bb8950bc2b1348cb1b93dcf6623a44`
- `FINDINGS-DISPOSITION.md`: `298cb4e7fcb19ff801f1246c889778262c1cb612fc6b891a00d01e2e348fa220`

## Verification Gates

**SHA256SUM/CMP DATA GATES ONLY. No execution, import, parse, syntax check,
own probe/snippet, synthetic exercise or test of any kind was run.** No
Python, local socket fixture, directory-enumeration experiment, DNS/TLS/network,
npm/node/package code, install/extraction, credential read or git write.
Text inspection/diff generation is drafting, not a language-parse or runtime
capability gate. These exit-0 receipts establish bytes only, NOT readiness.

All commands below inherited `GIT_OPTIONAL_LOCKS=0`. HEAD/clean=yes gate headers
refer to unchanged read-only worktree state, not a commit. Log paths are relative
to CURRENT `$ORGASMIC_EVIDENCE_DIR`.

1. **Current immutable binding data.** Exit **0**, hashes as listed above.
   Command (exact argv after the gate name):
   ```text
   orgasmic dispatch gate acq-v3-input-bindings -- sha256sum
     /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2/SHA256SUMS
     /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2/fetcher.py
     /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2-REVIEW1.md
     /srv/ci-fixtures/abdi7-closure-20261031/package-lock.json
   ```
   Log: `gate-acq-v3-input-bindings-01M68YNY09JVCH5YFZ0PPWCMHA.log`.
2. **Carried input binding byte equality.** Exit **0**, no cmp differences.
   ```bash
   orgasmic dispatch gate acq-v3-carried-binding -- cmp /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2/inputs-binding.md "$ORGASMIC_EVIDENCE_DIR/acq-v3/inputs-binding.md"
   ```
   Log: `gate-acq-v3-carried-binding-01M68Z097D3AEVHE57RD8KDDQX.log`.
3. **Four final primary byte bindings.** Exit **0**, four v3 hashes above;
   none of those four files changed after this data receipt.
   ```bash
   orgasmic dispatch gate acq-v3-primary-byte-bindings -- sha256sum "$ORGASMIC_EVIDENCE_DIR/acq-v3/fetcher.py" "$ORGASMIC_EVIDENCE_DIR/acq-v3/ACQ-SUBPLAN.md" "$ORGASMIC_EVIDENCE_DIR/acq-v3/inputs-binding.md" "$ORGASMIC_EVIDENCE_DIR/acq-v3/FINDINGS-DISPOSITION.md"
   ```
   Log: `gate-acq-v3-primary-byte-bindings-01M68Z4XBH95AD5AVVQTHQAT2H.log`.

Initial admission reads additionally ran `GIT_OPTIONAL_LOCKS=0 git rev-parse
HEAD`, sha256sum on the four bound inputs, and
`(cd /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2 && sha256sum -c SHA256SUMS)`
with all ten entries OK. These were read-only binding reads, not reusable
runtime gate receipts. SHA256SUMS for the final bundle is byte hashing only;
no artifact is executed or language-parsed by checksum creation.

### Valid inherited context, not new proof

- Immutable v2's exact source and 10-file seal match the brief; its copied
  binding still has hash 04904377…a44. Earlier lock→TSV byte comparison and
  100-row/99-pair inventory are inherited static context under those unchanged
  bindings, NOT a newly repeated jq/inventory probe or a runtime gate here.
- The draft still binds all three original immutable inputs by full hashes
  before any future admitted request. This round freshly rebound the lock;
  TSV/background-plan content was not re-analysed or relabelled as new proof.
- REVIEW1-v2's favourable language and its claims about an operator AST record
  are NOT adopted as v3 parse/compatibility evidence. That AST record was not
  read/repeated here; v3 bytes changed. Its disclosed Python/tempdir probe is
  explicitly a deviation claim, NOT authority: no such probe was repeated or
  used as v3 behavioural evidence.
- No earlier gate PASS is inherited. Prior baseline/skill instructions remain
  unchanged operating context; no startup scan or new project constraint was
  invented for this evidence-only repair.

## Unmet Criteria

No requested code-only artifact is intentionally omitted. All twenty review
IDs remain PROPOSED; actual syntax/name/attribute/arity compatibility and ALL
runtime behaviour remain UNVERIFIED. No acquisition/receipt run exists, no
operator slot is filled, and no fetch/execution authority is asserted. No
commit is made because it is forbidden. Any future syntax/compatibility,
capability or negative-path step requires separate operator authority; the
review's recommendations and a finalize prompt are not that authority.

## Residual Risk

EVERYTHING runtime remains UNVERIFIED, including the new mandatory CPython
private transport resolution/type/fd gate, seven-slot shared result contract,
primary/receipt-failure status and stderr/EPIPE/cap behaviour, parent/guard PID
ownership, non-verified grant charging, pipe token/EOF/owner-death protocol,
partial launches, cancellation/D-state races, original timing bounds, cleanup
and unconditional exit. Existing TLS/DNS/egress assumptions, OS signal/kernel
behaviour, filesystem capacity/headroom/overcommit, rename semantics, directory
re-enumeration, stable retained-file hashing and all negative paths remain
unexercised. No runtime receipt schema has been validated against a consumer.

A missing/partial/stale receipt, nonzero/missing termination, unknown check,
uncertain accounting or survivor must not be accepted as PASS. Broken stderr
can prevent diagnostic retention; it cannot manufacture a successful exit.
A guardian externally killed or privileged interference is outside this code's
proof; SIGKILL delivered at hard_end still does not prove kernel D-state death.
SRI is identity to the reviewed lock, not publisher authenticity; @animalabs/*
dependency confusion remains open upstream. No cache import, extraction safety,
ignore-scripts install, esbuild usability or benign-bytes claim follows.
