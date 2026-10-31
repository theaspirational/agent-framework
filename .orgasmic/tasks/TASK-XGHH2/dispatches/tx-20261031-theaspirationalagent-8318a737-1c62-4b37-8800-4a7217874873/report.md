# TASK-XGHH2 — private draft delivery report

**Disposition:** draft artifacts delivered; NOT REVIEWED, NOT executable-ready,
UNQUALIFIED, no stage-1 authority. Operator Tarn / qualifier Soma. No owner
decision. This is not a gate PASS or a claim of completed execution machinery.

## Changed

Only evidence drafts, progress and this report were intentionally written.
Required outputs are under:
`/home/orgasmic/.orgasmic/runs/run-01M68PTAARYBQB49XNQJ504V2C/evidence/drafts/`.
Private local draft directory mode 0700, draft files 0600, no executable bits.
These are NOT the proposed installed root-owned 0444 runner files.

| Deliverable | SHA256 |
|---|---|
| BLUEPRINT-v2.md | `632fe5d3ec4d6a95d4d715c51a9f9a347d7c50e5890d879808018cf081592397` |
| controller.py | `82b365d7032d390cbb4e56a22a469b3cfe2399436ef46225333b334094872af1` |
| unit-wrapper.sh | `519be0dd292c48c3dbf9ef5137251fa3fe99c8603f2c8a9155f7994ed9b0fb1f` |
| producer-build.sh | `30be3fe48d42da99e8f64a6e85b5804aea37dd776313b878a86ee4aa29720b73` |
| producer-test.sh | `02d108b4154f2de115d8bb3552ca38556c08f539fd6596a80ba622000996c623` |
| closure-reconstruction-plan.md | `28423ae7aac372826d59744f854399a2b120cc38caf665c5185d195edb7a60c4` |
| SHA256SUMS | `5322290ce531352d39c287ff779a0374a52af9a18dab628938ec79ebe89f0cd6` |
| unit-template.json (supporting unit-file input) | `8018a87b3fb1e5c224cd32e3b1d6ce826e9ae5a53f6e69f143f0e5095bad000c` |
| lock-tarballs.tsv (complete 100-row SRI inventory) | `0eff27af05fb66a661b6c8a19a8b08dd8a57c231386f36a7a658d766b66a9701` |
| input-verification.md (supporting read-only evidence) | `ced21a9e4c82b389e911187c921fda1b8a8717d7f5e9d0b89a67d11773a42523` |

SHA256SUMS inventories the nine other draft files, not itself; its digest is
listed above to avoid a self-referential checksum. No runtime output, artifact
manifest, source archive or execution marker was fabricated.

The blueprint's numbered sections address qualifier requirements 1–7, with
explicit B1–B13 blockers/deviations in §8. The scripts have the exact required
DRAFT header. Controller main refuses by default; it has unset runner/marker
slots, an unreleased-review guard and incomplete-adapter refusals. It contains
NO path that creates the go file. Preflight refuses before any producer.

Operator additions from message msg-ef705eac455240f58f50fd2d3a20108f were folded
in: verified reaper/deadline canary record, identity-bound catatonit host-pid
TERM rather than MainPID/unshare, 5s bounded grace/hard cgroup fallback,
ungraceful RuntimeMaxSec classification, root reaper disclosure, scope-marker
semantics, and first-payload credential/capability recording/refusal.

## Verification Gates

**Read-only checks only; no dispatch gate receipt or behavioural PASS claimed.**
- sha256sum of all seven required records matched the full supplied hashes;
  LOW1-R4 abbreviated pins were additionally resolved by the pinned review and
  erratum. All seven records were read in full. Full paths/hashes are in
  drafts/input-verification.md; no input mismatch occurred.
- Direct lock hash matched F0 `df14aa0a…22578`; original manifest and five
  DIAG2 helper hashes matched v1. Helpers were not run. Sealed manifests were
  not regenerated.
- Git object reads verified full candidate
  `f8af03a852c85daf9bb8079937b994fe5419ca20`, unchanged package.json blob
  `02744ce195fc0867d9dbef4ddf2f1f341cf7277a`, all ten focused sources PRESENT,
  29 fixture .mjs paths and candidate tsconfig/package literal effects.
- jq read the sealed lock: 100 non-root tarball/SRI rows; 47 optional, 56 dev;
  all resolved URLs are registry.npmjs.org HTTPS and all integrity prefixes
  sha512; hasInstallScript exactly esbuild 0.28.2 and fsevents 2.3.3.
- Read-only manifest/text inspection verified the compiler launcher path and
  disclosed its platform native binary. No compiler or runtime was invoked.
- Final `GIT_OPTIONAL_LOCKS=0 git -c core.fsmonitor=false -c core.hooksPath=/dev/null
  status --porcelain=v1` emitted nothing; matching guarded
  `diff --no-ext-diff --no-textconv --exit-code HEAD --` exited 0. Tracked tree
  remains clean. No commit/ref/index write command was issued. See B12 below
  for the unguarded initial status/index-metadata limitation.
- All four script first lines were read back and match the requested warning.
  Draft text was read statically only. Checksums were generated with sha256sum;
  no shell/Python syntax parser, generated helper or drafted controller ran.

No node/npm/npx/bun/tsc, build/test/install, drafted script, package hook/code,
systemd-run/unshare/setpriv/catatonit/sudo, network operation or acquisition was
executed. No credential, env file or token was read/printed. Only the nonsecret
evidence-directory variable was queried. No tracked repository file was edited.
No commit was made, as explicitly forbidden by this task.

## Unmet Criteria / exact remaining blockers

The drafting set is present, but an executable-ready controller is NOT claimed.
The following are the complete current blocker/UNKNOWN inventory, matching §8:

1. **B1 — UNVERIFIED/ABSENT authority and installation:** no reviewed v2,
   qualifier stage-1 go, independent marker hash/path, fresh installed runner
   location or root-owned installed runner/unit receipts.
2. **B2 — INCOMPLETE session adapter:** bounded safe archive/extraction, scratch
   provisioning, hard aggregate/per-path/retention enforcement, closure/source
   verification, producer→seal copy/pins and complete orchestration are specified
   but not implemented. Source/artifact/consumer hashes are UNVERIFIED, not invented.
3. **B3 — INCOMPLETE containment/canary adapter:** full mount/ns assertions,
   /var/run alias handling, PrivateTmp/bind/shm stack, reduced root-capability
   compatibility and exact-owned synthetic canary unit/helper/pins are UNVERIFIED.
   payload-preflight deliberately refuses; no packages can run through that path.
4. **B4 — INCOMPLETE effective-state adapter:** outside show normalization,
   mandatory property equality and final unit Result retrieval still required.
5. **B5 — INCOMPLETE exception-safe cleanup:** launch-before-InvocationID,
   disappeared cgroup, capture/control errors, signal interruptions, client
   reaping, receipts, and exact-owned mount teardown are not integrated.
6. **B6 — INCOMPLETE bounded control capture:** bounded_control currently uses
   capture_output, so a post-read show-size check is not a pre-allocation bound.
   A draining capped control-call adapter is required.
7. **B7 — UNVERIFIED independent seal receipts:** /root/abdi7-f0-20261031
   returned Permission denied; no bypass attempted. Full sealed manifests and
   owner/mode/runtime-byte checks remain operator/F0 facts, not fresh checks.
8. **B8 — UNVERIFIED exhaustive attempted node_modules-write detection:** RO
   state protection plus before/after hashes cannot prove no ignored write
   attempt. Observed attempts STOP; exhaustive mechanism/qualifier resolution
   remains required, without unauthorised audit/daemon changes.
9. **B9 — DEFERRED/UNVERIFIED declaration consumer:** emitted declarations,
   installed public declaration reachability and external consumer typecheck
   need a separate bounded specification/go; project compile is not that check.
10. **B10 — PLAN ONLY reconstruction:** separate acquisition go, exact npm
    version/bytes/path, cache-import adapter, network/DNS/TLS allowlist, bounded
    extraction and offline SRI/platform/behaviour receipts remain UNVERIFIED.
    Original warm-cache/npm-version and 100-vs-55 provenance gaps remain.
11. **B11 — UNVERIFIED all new behaviour:** syntax, property/mount composition,
    deadline/capture/cancellation, resource bounds, build/test/type/declaration
    results, ALS/loading/throttle/normal-path runtime behaviour. Operator canary
    observations support only its synthetic construction; no hold is lifted.
12. **B12 — UNVERIFIED literal zero git metadata writes:** initial status calls
    did not disable optional locks. Worktree index mtime was later observed at
    2026-10-31 10:07:12.125278127 UTC, during drafting; automatic index refresh
    cannot be excluded without a before snapshot. No deliberate git write,
    tracked edit, ref change or commit occurred. No attempted undo or further
    metadata manipulation. Earlier progress wording is corrected, not treated
    as proof of literal zero writes.
13. **B13 — Progress cadence deviation:** 10:18:17→10:23:32 was 5m15s,
    exceeding the five-minute cadence by 15s. Not backdated. The first draft
    checkpoint was within 20 minutes; subsequent work continued without
    finalising at the checkpoint.

**Dispatch-control conflict:** no `orgasmic dispatch finalize/ask/gate` was run.
The specific brief permits only read operations and evidence writes, forbids
package execution and all outside-evidence edits, and explicitly forbids the
generic commit step. Generic finalization entails code/daemon state writes
outside that allowance; no exemption was supplied. This report is an evidence
handoff, not a daemon/lease finalization. Operator must resolve that control
exception externally. No daemon state was hand-edited and no done status claimed.

## Residual Risk

These are PRIVATE DRAFTS, not reviewed operational software. B1–B11 block any
execution proposal; B12/B13 are disclosed assurance/procedural limitations.
The root catatonit and shared user/uts/cgroup boundaries remain intentional
trust disclosures. Full privacy/retention/runtime qualification is absent.
Original closure provenance/SRI/lifecycle gaps remain preserved, not repaired
by the plan. No test success, consumer success, clean timeout, release clearance,
publication, deployment or owner authority is inferred from this delivery.

## Dispatch-control follow-up

A later explicit user directive requires dispatch finalization. That resolves
only the earlier CLI-control exception: this report is now submitted with
`--status blocked`, without `--commit`. The draft-only/no-git-write task scope
remains binding. B1–B13 and the draft hashes above are unchanged. No package,
producer, controller, wrapper, build or test execution is authorised or performed
by this follow-up. The finalization command's help was read to confirm that
blocked submission does not require a commit. Terminal outcome is recorded by
the dispatch CLI, not hand-edited into daemon state.
