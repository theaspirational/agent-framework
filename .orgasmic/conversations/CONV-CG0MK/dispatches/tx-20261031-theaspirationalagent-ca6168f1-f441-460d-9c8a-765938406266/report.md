# CONV-CG0MK — CODE-ONLY delivery report

DRAFT — NOT REVIEWED — MUST NOT BE EXECUTED. Operator Tarn; qualifier Soma,
Slack 1793444684. No owner decision, qualification, readiness claim or fetch go.

## Changed

Only this evidence `acq-v1/` bundle was generated:

- `ACQ-SUBPLAN.md`: acquisition-only rules, explicitly superseding background
  v1 plan §3; no extraction/cache/install phase.
- `fetcher.py`: Python 3 standard-library-only draft; required warning first
  line; all operator identity/location/uid/authority slots UNSET and refusing.
- `inputs-binding.md`: immutable input hashes, independent jq regeneration,
  exact byte comparison, inventory/provenance and verification limits.
- `SHA256SUMS`: seals the three deliverables and this report, excluding itself.
- `report.md`: this scoped completion report. The generic evidence-root report
  location was not used because the brief limits generated files to `acq-v1/`.

The sole evidence-root write exception is the requested `progress.log`; its
initial record contains HEAD and the three full input hashes. No worktree,
parallel XGHH2 round-2 bundle or other evidence was edited. No git write,
staging, commit or lifecycle finalization was performed; generic lifecycle
text does not override the brief's code-only/write-boundary prohibitions.

HEAD, read with `GIT_OPTIONAL_LOCKS=0 git rev-parse HEAD`:
`f8af03a852c85daf9bb8079937b994fe5419ca20`.

### Input SHA256

- Lock: `df14aa0a57fd237393e3853956707ecbb31e93952504dcba24e9a971eb022578`
- v1 TSV: `0eff27af05fb66a661b6c8a19a8b08dd8a57c231386f36a7a658d766b66a9701`
- v1 background plan: `28423ae7aac372826d59744f854399a2b120cc38caf665c5185d195edb7a60c4`

### Deliverable SHA256

- `ACQ-SUBPLAN.md`: `1a5caf51c51552030a041cfd77fc355aea5a215ec9fb741649851c06a0006b55`
- `fetcher.py`: `3484804954c49a185c7e2242a32649fffdab4f8b37c33997a548bca0a79c6ac7`
- `inputs-binding.md`: `049043774411cb0231733abc647888a510bb8950bc2b1348cb1b93dcf6623a44`

### Inventory, deadlines and caps selected in the draft

100 immutable TSV rows; **99** deduplicated literal URL+SRI pairs; zero
URL/SRI conflicts in either direction. The sole duplicate retains both nested
`@discordjs/collection` 2.1.1 lock keys. Request cap **99**, maximum **100**;
fetch concurrency **2**; no retries, redirects or address fallback.

Original aggregate deadline **1,800 seconds from monotonic entry**, never
renewed; no new requests at/after it. Hard-stop grace **5 seconds** (absolute
start +1,805). Total per-request deadline **30 seconds** including DNS,
connect, TLS, headers, body and verification/promotion. Parent monotonic
watchdog plus a one-shot worker timer; separate aggregate monotonic guardian.
TERM grace **0.25 seconds**, then KILL and at most **0.25 seconds** further wait.

Fixed maximum stream chunk **64 KiB**. Per-file body threshold **64 MiB**;
aggregate body threshold **512 MiB**, counted before retention. Reaching a
body threshold aborts without retaining the triggering chunk. Up to two
in-flight chunks (128 KiB) can be counted beyond the aggregate threshold but
not retained. Entire dedicated filesystem capacity **544 MiB** maximum;
log **1 MiB**, manifest **2 MiB**, input read **2 MiB per immutable file**.
Filesystem provisioning and its run location are not chosen by this draft.

### Closed refusal set

`UNSET_OPERATOR_SLOT`, `OPERATOR_IDENTITY_INVALID`, `UNSUPPORTED_PLATFORM`,
`INPUT_IO`, `INPUT_HASH`, `LOCK_FORMAT`, `ROW_INVALID`, `URL_INVALID`,
`SRI_INVALID`, `INVENTORY_MISMATCH`, `BINDING_CONFLICT`, `REQUEST_CAP`,
`TLS_CONFIGURATION`, `FILESYSTEM_BOUNDARY`, `ROOT_EXISTS`,
`PREFLIGHT_DEADLINE`, `INTERNAL_REFUSAL`.

Unexpected exceptions fail as `INTERNAL_ERROR`; they never authorize admission.
Preflight refusal is a small machine-readable stderr record, not a fetch run.

### Closed per-fetch outcome set

`VERIFIED`, `SRI_MISMATCH`, `HTTP_STATUS`, `REDIRECT`, `TLS_ERROR`, `DEADLINE`,
`SIZE_CAP`, `LENGTH_MISMATCH`, `CONNECT_ERROR`, `HTTP_PROTOCOL_ERROR`, `IO_ERROR`,
`DISK_CAP`, `LOG_CAP`, `INTERNAL_ERROR`, `MISSING_RESULT`,
`AGGREGATE_DEADLINE_SKIPPED`, `AGGREGATE_SIZE_SKIPPED`,
`NOT_ATTEMPTED_AFTER_FAILURE`, `CANCELLED_AFTER_FAILURE`.

Each inventory fetch gets one typed final result. PASS requires every required
result to be VERIFIED with the complete positive check set; missing/unknown
is failure. Machine-readable final manifest plus successful termination is
required; missing/partial manifest or hard kill is failure. The draft's
required-set safeguards are design text/code, not empirically tested claims.

## Verification Gates

Permitted data checks actually performed (not execution/test gate receipts):

1. `sha256sum` on all three immutable inputs: full values match; lock prefix
   `df14aa0a` and suffix `22578` also match.
2. `cat` on the bound v1 TSV/background plan and `jq` on the sealed lock.
   No r2 copy was used.
3. Independent `jq -r` lock-to-TSV regeneration piped directly into `cmp`
   against the immutable v1 TSV: exit 0, `BYTE_EQUALITY=PASS`. The exact command
   and filter are recorded in `inputs-binding.md`.
4. Independent `jq -R -s` immutable TSV grouping/counts: 100 rows, 99 distinct
   URL+SRI pairs, zero conflicts, both duplicate provenance keys enumerated.
5. `sha256sum` data hashing of output files; the final `SHA256SUMS` records
   their bytes. Hashing is not parsing or validation of draft code.

No written artifact was executed, imported, parsed, syntax-checked, compiled or
tested. No test, build, gate wrapper, package manager, network request, TLS/DNS
probe, extraction or install ran. No credentials were read. The required skill
and supplied baseline were read as instructions only; the baseline supplies no
additional constraints, and conventions/gotchas were explicitly absent.

## Unmet Criteria

No runtime qualification or verification was attempted; those are prohibited
in this code-only dispatch. Review, separate acquisition go, run identity,
execution location, uid and bounded filesystem provisioning remain UNSET or
UNVERIFIED. No local commit or finalize was attempted under the hard brief.
There is no fetch result manifest because no fetch was authorized or run; the
draft would create one only in a separately admitted future acquisition.

## Residual Risk

Python syntax/compatibility and all runtime behaviour remain UNVERIFIED:
validation/refusal branches, TLS/system CA behaviour, libc DNS bounds/routing,
HTTP raw framing, monotonic/signal enforcement, 64-bit Linux fork/shared-memory
assumptions, process-group cancellation, concurrent caps, no-follow/exclusive
creation, renameat2 availability, filesystem capacity/underlying storage,
partial-file accounting and receipt failure/kill races. Default resolver
retransmissions and privileged interference are not controlled by the draft.
Missing failure receipts cannot be made successful, but require operator
investigation. No readiness conclusion follows from the static inventory.

Neither this delivery nor a hypothetical acquisition PASS proves npm cache
import, extraction safety, an ignore-scripts install, esbuild usability, or
that matching bytes are benign. No package or compiler was executed.
