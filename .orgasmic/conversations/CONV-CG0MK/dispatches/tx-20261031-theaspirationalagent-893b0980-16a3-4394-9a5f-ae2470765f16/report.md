# CONV-CG0MK — ACQ fix round 1, code-only report

**DRAFT — NOT REVIEWED — NOT EXECUTED.** Operator Tarn; qualifier Soma,
Slack 1793446521. No fetch/execution go, syntax-validity assertion or readiness.
All H1, M1–M6 and L1–L4 dispositions are **PROPOSED**, not runtime conclusions.

## Changed

Delivered in current `$ORGASMIC_EVIDENCE_DIR/acq-v2/`:

- `fetcher.py`: proposed acquisition-only revision of the sealed v1 source.
- `ACQ-SUBPLAN.md`: v2 rules and exact refusal/outcome/proof sets.
- `inputs-binding.md`: carried forward BYTE-FOR-BYTE from the sealed v1 drop;
  historical labels/statements remain v1 evidence, not new-round assertions.
- `FINDINGS-DISPOSITION.md`: all eleven review IDs mapped to v2 symbols/lines,
  each status PROPOSED, with behavioural verification explicitly absent.
- `diffs/fetcher.py.diff`, `diffs/ACQ-SUBPLAN.md.diff`,
  `diffs/inputs-binding.md.diff`, `diffs/report.md.diff`, and
  `diffs/FINDINGS-DISPOSITION.md.diff`: plain unified v1→v2 primary-file diffs.
  Carried input-binding diff is intentionally empty; findings have an absent
  v1 baseline (`/dev/null`). Generated diffs/seals are not recursively diffed.
- `report.md`: this report; identical copy at evidence-root `report.md` for the
  dispatch. `SHA256SUMS` covers ALL TEN delivered primary/diff files except
  itself and is generated from their final bytes after report/diff creation.

No worktree, immutable v1 drop, parallel bundle or reviewed evidence was
modified. Writes stayed inside the CURRENT evidence directory, including
progress, gate logs, report and the v2 bundle. The initial copied source was
read-only like its immutable original; only the owned evidence COPY was made
writable to permit editing. The first progress line binds all requested values.
No git write/staging/commit is authorised or performed. Completion must not
use --commit, regardless of generic lifecycle text or a later finalize prompt.

### Proposed changes by finding

- **H1:** new unset `RUN_PROCESS_SCOPE` slot requires a dedicated owned NEW
  session. Reject terminal-attached invocations and ANY setsid failure,
  including EPERM, with NOT_DEDICATED_SCOPE. Never treat group leadership as
  ownership proof. Successful setsid + SID=PGID=PID proof precedes captured
  owned-scope alarms/signals; no interactive shell group can be adopted.
- **M1:** independent parent O_NOFOLLOW/regular/owner checked file reopens and
  streaming SHA512 versus LOCK SRI, only after writers confirmed stopped;
  exact verified/ filename set before AND after, caps and remaining ORIGINAL
  deadline, mandatory independent per-file and run proof sets for final_pass.
- **M2:** proposed fresh-root synthetic zero-byte O_EXCL rename probe: one
  success with inode evidence, one collision demanding EEXIST and unchanged
  source/target. Separate labelled synthetic directory, never package input.
  Any failure/unsupported semantics => typed RENAME_PROBE_FAILED, no request.
- **M3:** publish primary worker result FIRST; individually suppress/record
  cleanup errors. Preserve primary across cleanup/signalled-exit paths;
  separate cleanup labels and termination triggers prevent success without
  erasing primary evidence. Parent cleanup also cannot erase primary errors.
- **M4:** received hash is explicitly named observed_body_sha512_received and
  NOT a partial-file hash. Separate independently read parent retained-file
  hash, complete-read indicator/checks/count/outcome; absent/incomplete hash is
  never represented as a completed retained-file digest.
- **M5/M6:** remove shared budget lock entirely; parent-issued disjoint lifetime
  receive grants and worker-local lock-free counters. Killed/uncertain worker
  REFUSES the run; no reset/grant reuse/continued admission. Bounded final
  cancellation_confirmed checks plus persistent ownership registry (including
  partial starts and exceptions) precede parent reads. Unconfirmed survivor
  has its own typed result, unstable snapshots, no PASS, and parent parks to
  original owned-scope hard stop rather than claim cancellation or abandon it.
- **L1:** guard every blank_result shared access, including digest-valid flag.
- **L2:** measured EOF/length, fsync+fstat, and no-follow post-rename stat/inode
  evidence replace literal-True EOF/FLUSHED/PROMOTED certificates.
- **L3:** named RENAME_NOREPLACE constant at every rename call.
- **L4:** SRI is identity to the reviewed lock, NOT publisher authenticity.
  Public-registry @animalabs/* dependency confusion remains OPEN UPSTREAM.

### Retained limits and unset choices

30 s TOTAL/request; one ORIGINAL 1,800 s aggregate including preflight and
parent rehash, plus 5 s hard-stop grace. No deadline renewal or new requests in
grace. Concurrency 2; 99 deduplicated fetches/request cap, never above 100.
64 KiB maximum chunks; 64 MiB/file, 512 MiB aggregate body, 544 MiB bounded
filesystem, 1 MiB log, 2 MiB result manifest, 2 MiB/input read. Parent rehash is
additionally capped below 64 MiB/file and 512 MiB total under ORIGINAL time.
TERM and KILL waits at most 0.25 s each, followed by explicit bounded exit check.
Kernel D-state death is not claimed merely because SIGKILL was issued.

Strict all-row URL/SRI validation; exact allowlisted HTTPS/443; system CA,
hostname check, TLS >=1.2; no proxy/auth/cookies/credentials/npmrc; no retry,
redirect, hash fallback, address fallback or extraction remain draft rules.
All run identity/location/uid/go/scope slots remain None and refusing; root is
still rejected. No operator value was invented or filled in this round.

### Input/HEAD binding

Current read-only HEAD: `f8af03a852c85daf9bb8079937b994fe5419ca20`.

| Immutable input | Current SHA256 |
| --- | --- |
| `/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1/SHA256SUMS` | `ff9bad0e1785c2a9ebdd308925e3ca106a1b91aae72066d51cf6173202598272` |
| `/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1/fetcher.py` | `3484804954c49a185c7e2242a32649fffdab4f8b37c33997a548bca0a79c6ac7` |
| `/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1-REVIEW1.md` | `c1d6310e652c10c3ef8ae898150ac541b5949e1e8e395f8581a3be942e95f5d3` |
| `/srv/ci-fixtures/abdi7-closure-20261031/package-lock.json` | `df14aa0a57fd237393e3853956707ecbb31e93952504dcba24e9a971eb022578` |
| `/srv/review-drop/tarn-rtaln-20261030/XGHH2-DRAFTS-v1/lock-tarballs.tsv` | `0eff27af05fb66a661b6c8a19a8b08dd8a57c231386f36a7a658d766b66a9701` |
| `/srv/review-drop/tarn-rtaln-20261030/XGHH2-DRAFTS-v1/closure-reconstruction-plan.md` | `28423ae7aac372826d59744f854399a2b120cc38caf665c5185d195edb7a60c4` |

The v1 seal rechecks **4/4 OK**. REVIEW1 and current sealed v1 fetcher were read
IN FULL before revising, along with the v1 plan/input binding/report. Findings
were checked against that current source as text, not accepted on authority.
No v2/r2 XGHH2 material was used.

### V2 primary artifact hashes (data only)

- fetcher.py: `11a6a63f056071254f821fe12e8607eab27d8735d022b55030d9dabed41eb8ff`
- ACQ-SUBPLAN.md: `26f03e41d5dee5edb74ad7778204440c22ce35230b6d541755774c2d6ec11119`
- inputs-binding.md: `049043774411cb0231733abc647888a510bb8950bc2b1348cb1b93dcf6623a44`
- FINDINGS-DISPOSITION.md: `52fda87d1b662cc24619631a56db65c196fedada6642552289bc9cc677f05ca6`

## Verification Gates

**ONLY data reads/comparisons/hashing. No runtime, language-parse or syntax gate
is authorised or performed. A data gate exit 0 proves none of the proposed
fetcher behaviours.** All gate commands inherited GIT_OPTIONAL_LOCKS=0; gate
headers recorded the unchanged HEAD and clean=yes, not a commit.

Current data receipts (paths are relative to CURRENT `$ORGASMIC_EVIDENCE_DIR`):

1. `orgasmic dispatch gate acq-v2-input-bindings -- sha256sum <five bound paths>`
   actually supplied the v1 SHA256SUMS, v1 fetcher, REVIEW1, lock and TSV paths
   listed above (five paths). Exit **0**; values exactly as bound above.
   Log: `gate-acq-v2-input-bindings-01M68WA8E7AJW3T48KRC6CQPFV.log`.
2. `orgasmic dispatch gate acq-v2-immutable-inventory -- bash -c <script>`
   Exit **0**; v1 seal **4/4 OK**, background hash matched, regenerated TSV
   BYTE_EQUALITY=PASS, rows **100**, dedup **99**, URL conflicts **0**, SRI
   conflicts **0**.
   Log: `gate-acq-v2-immutable-inventory-01M68WF7251YSFMNMJH0TQ5NSS.log`.
   The executed bash script argument (quoting presented as script text):

   ```bash
   set -e
   (cd /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1 && sha256sum -c SHA256SUMS)
   sha256sum /srv/review-drop/tarn-rtaln-20261030/XGHH2-DRAFTS-v1/closure-reconstruction-plan.md
   cmp /srv/review-drop/tarn-rtaln-20261030/XGHH2-DRAFTS-v1/lock-tarballs.tsv \
     <(jq -r '.packages | to_entries[] | select(.key != "") | [.key,.value.version,.value.resolved,.value.integrity] | @tsv' \
       /srv/ci-fixtures/abdi7-closure-20261031/package-lock.json)
   printf 'BYTE_EQUALITY=PASS\n'
   jq -R -s 'split("\n") | map(select(length>0)|split("\t")) | {rows:length,dedup_count:(map([.[2],.[3]])|unique|length),url_conflicts:(group_by(.[2])|map(select((map(.[3])|unique|length)>1))|length),sri_conflicts:(group_by(.[3])|map(select((map(.[2])|unique|length)>1))|length)}' \
     /srv/review-drop/tarn-rtaln-20261030/XGHH2-DRAFTS-v1/lock-tarballs.tsv
   ```

3. `orgasmic dispatch gate acq-v2-primary-byte-bindings -- bash -c <script>`
   Exit **0**, INPUTS_BINDING_CARRIED_FORWARD=BYTE_EQUAL, and the four v2
   hashes listed above. None of those four hashed files changed afterward.
   Log: `gate-acq-v2-primary-byte-bindings-01M68WR87R343VQZH2DHK23RYE.log`.
   Executed script:

   ```bash
   set -e
   cmp /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1/inputs-binding.md "$ORGASMIC_EVIDENCE_DIR/acq-v2/inputs-binding.md"
   printf 'INPUTS_BINDING_CARRIED_FORWARD=BYTE_EQUAL\n'
   sha256sum "$ORGASMIC_EVIDENCE_DIR/acq-v2/fetcher.py" "$ORGASMIC_EVIDENCE_DIR/acq-v2/ACQ-SUBPLAN.md" "$ORGASMIC_EVIDENCE_DIR/acq-v2/inputs-binding.md" "$ORGASMIC_EVIDENCE_DIR/acq-v2/FINDINGS-DISPOSITION.md"
   ```

The first gate's exact argv after `--` was:

```text
sha256sum
/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1/SHA256SUMS
/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1/fetcher.py
/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1-REVIEW1.md
/srv/ci-fixtures/abdi7-closure-20261031/package-lock.json
/srv/review-drop/tarn-rtaln-20261030/XGHH2-DRAFTS-v1/lock-tarballs.tsv
```

Additional permitted drafting operations: plain cat/nl/sed/grep text reading
for symbol/line indexing, apply_patch/cat editing, copying the bound input
binding, plain diff generation, and byte hashing. No source text was passed to
Python, a compiler, AST parser, linter, import system, package manager or test.
The synthetic preflight probe and retained-file hashing are CODE ONLY; they
were NOT invoked. No network/DNS/TLS, npm/node/package execution, credentials,
installation, extraction or git write occurred.

### Inherited evidence, not new runtime proof

- Sealed v1 input binding and historical independent lock→TSV byte comparison
  remain valid immutable-input context because their full hashes and v1 seal
  are unchanged. This round additionally repeated the seal, hashes, TSV byte
  comparison and pair grouping through the current data gates above.
- The v1 sole duplicate's two nested @discordjs/collection 2.1.1 keys remain
  provenance context; the unchanged inventory comparison binds all bytes.
- REVIEW1's broader v1 data/conformance observations remain review claims,
  not v2 behavioural receipts. Its favourable wording is NOT adopted as a go.
- No prior runtime/gate PASS is inherited, and no runtime gate was created.
  The baseline/skill already read in the prior round remain operating
  instructions; no changed project constraint was supplied or inferred.

## Unmet Criteria

No authorised code-only deliverable is intentionally deferred. Every finding
is only PROPOSED, including informational L4. Syntax/compatibility checking,
independent review, negative-path/production probes and actual execution are
NOT performed and remain separate operator-authorised steps. No syntax-validity
claim is made. No acquisition result manifest exists because no acquisition
was attempted. All operator slots remain UNSET. No git commit is made because
this brief explicitly forbids git writes, regardless of generic completion
text. These exclusions do not supply implicit execution or fetch permission.

## Residual Risk

EVERYTHING runtime is UNVERIFIED: Python syntax/name/version compatibility;
dedicated-scope/launcher assumptions and typed EPERM refusal; signal timers,
parent/guardian lifecycle and D-state cancellation; partial process starts and
exception barriers; counter/grant accounting and cap races; HTTP private raw
socket internals/framing; TLS/system CA/DNS/egress behaviour; filesystem
capacity/headroom/overcommit, probe correctness and renameat2 availability;
no-follow/owner/type/stability checks; independent retained-file rehash/entry
set equality; cleanup/late manifest/termination races and all negative paths.

A missing/partial/stale manifest, nonzero/missing termination, unknown proof,
killed/uncertain worker or unconfirmed survivor must never be treated as PASS.
Hard-stop signals are not empirical proof of kernel task death. Hostile
privileged interference, OS resolver retransmissions and underlying storage
capacity remain external assumptions needing separate review.

SRI establishes identity to the reviewed lock, not publisher authenticity;
@animalabs/* dependency confusion is still an upstream question. Neither this
delivery nor a hypothetical future valid acquisition receipt proves npm cache
import, extraction safety, an ignore-scripts install, esbuild usability or
that bytes are benign. There is NO readiness/fetch/execution claim.
