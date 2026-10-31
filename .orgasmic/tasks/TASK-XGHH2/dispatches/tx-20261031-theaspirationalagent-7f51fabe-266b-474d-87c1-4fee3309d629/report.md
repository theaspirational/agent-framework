# TASK-XGHH2 round 2 — private code-only draft handoff

Operator Tarn / qualifier Soma1793442719 +1793444005. Not an owner decision,
not a stage go. DRAFT — NOT REVIEWED — MUST NOT BE EXECUTED.
No completeness or readiness claim. All42 H/M/L/R/B findings remain OPEN.

## Changed

One bounded draft revision, only in the current evidence directory's drafts-r2/:
BLUEPRINT-v3.md, controller.py, unit-wrapper.sh, producer-build.sh,
producer-test.sh, carried/addended closure-reconstruction-plan.md,
FINDINGS-DISPOSITION.md, supporting input/executable evidence and lock TSV,
11 per-file diffs, SHA256SUMS. Unit-template.json is deliberately dropped;
controller.py is the sole unit/argv authority. The deletion diff is included.
The regenerated manifest is not self-diffed/self-hashed; its digest is separately
listed below. Local files0600, directories0700, scripts nonexecutable. Proposed
future root0444 runner installation was NOT performed.

Proposed changes: typed named assertion/capability/stage registries, positive
validated receipts and write-once survivor evidence; UID1002-only archive/
preparation; actual pre/post-unit closure/Node/runner/bind verification; native
compiler and control executable pins; prebound unique intent/reconciliation and
normal/error/ambiguous finalizer call sites; shared pre-retention bounded capture;
/var/run alias assertion and --pipe choice; removal of writable consumer token.
No bare release bool and no marker creation path. Missing predicates/adapters
remain UNKNOWN/NEGATIVE, including the currently absent positive input/intent
receipt attachment. All changes are unexecuted draft proposals, not resolutions.

### Deliverable SHA256 inventory
Relative paths below are under drafts-r2/. The final line hashes SHA256SUMS
itself; there is no recursive checksum claim.

```text
808f587c3ac422c009c9271538a4b03c10956c3a42ca863eaaf5a99a5fbdf91d  BLUEPRINT-v3.md
52f3414523471ce7e75ee71a80627a36dddf1c41568f73a90d49f620e95cea8a  controller.py
44a7bb884c6048778d1cbd5eaeb8a09a9c48b3f64d5b6cd4f3c9a67955858a60  unit-wrapper.sh
88b912177ea76b0a09fe517f83364395f7c53792593dfabbc0e3a821833e555f  producer-build.sh
128f97607c67f9581d168102ffe78d5eea2bf48456e5c388551b8a5d28db1309  producer-test.sh
dd50f9a2cbc4402dfb8897f9367c93f815b3c631fda31a0ccfc6df6f6d4301e3  closure-reconstruction-plan.md
e85875865b622735664138b673bb4186df00dedc4ef71ca10e865b2258720d0f  FINDINGS-DISPOSITION.md
0eff27af05fb66a661b6c8a19a8b08dd8a57c231386f36a7a658d766b66a9701  lock-tarballs.tsv
d377640f82385c2c91c3309cd33dc8d923dbf81f586021c0f701d838ea9e6d08  input-verification.md
da6bd112cbb690941cc353fad5f56738f7b5ac2a393e3ac3d42243750f75c40f  observed-executable-SHA256SUMS
520ef710e759efe785586657c385606119b9b3d926ff964658f88b34a74c0554  diffs/BLUEPRINT-v2-to-v3.diff
4911c39ecac094fbb1d7e11c915c28b5b0828512814754c4e8029b7b957a6cb8  diffs/FINDINGS-DISPOSITION.md.added.diff
18af759584a7457cc7b7a140c61a6000ad92abdfbd7d9741889fb4258f143658  diffs/closure-reconstruction-plan.md.diff
2b98f7d2e1e205efb68e58c54d7b16245bc07f53c5d42dc51b0b511d63c10454  diffs/controller.py.diff
8dfeb11d1502299d1da811489e5d38458f1bd9a2422f150d4bc27cc5af4fa18b  diffs/input-verification.md.diff
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  diffs/lock-tarballs.tsv.diff
0cf1c4da9005193481325616b5d470d8f911d33631d1c9d2fd424a38927d65bc  diffs/observed-executable-SHA256SUMS.added.diff
f99f0fd9908c0c82382ae62da439732fc3f81a9e93525471c9c7d314c79e2597  diffs/producer-build.sh.diff
db01bea814b751a27d4256e43b49174474fb4be3701cfb434bab5afe0e4efc8d  diffs/producer-test.sh.diff
b72925d42ee76fa90ceeba332cf6ef4dcd7084e0d5802e9523c1010aa480b667  diffs/unit-template.json.deleted.diff
c85d6f85a910bc0d01fa39fa350f70b86ae45cfbac08ef3ab8eca29a6023c37e  diffs/unit-wrapper.sh.diff
e5addcb8f45045577b009a932fd1eed2bbc5c373ead431e78e0468134d8278e3  SHA256SUMS
```

### Disposition summary
FINDINGS-DISPOSITION.md maps3 HIGH +9 MEDIUM +6 LOW +7 refusal-decay +17 blocker
items =42, individually to symbols/draft changes or exact remaining reasons.
**42 OPEN for independent re-review, zero resolved.** B14(root Git/ingress),
B15(actual integrity), B16(native/toolchain surface), B17(teardown call sites)
are now distinct inventory entries, not folded away into older generic blockers.
B7 stays operator-only; B8 retains the prevention/attempt-observation distinction;
B9 deferred; B10 plan-only; B12 possible old index refresh/zero metadata writes
UNVERIFIED; B13 timing only. No historical deviation is erased or backdated.

## Verification Gates

Only DATA/hash/source-state checks; no parser, draft or package execution.
Every Git invocation in this round used GIT_OPTIONAL_LOCKS=0. The CLI gate
commands also inherited that setting. No commit/ref/index-write command.

Fresh required input checks, before spec reading:
- HEAD=f8af03a852c85daf9bb8079937b994fe5419ca20, exact match.
- v1 SHA256SUMS=5322290ce531352d39c287ff779a0374a52af9a18dab628938ec79ebe89f0cd6;
  sha256sum -c9/9 OK; v1 never edited.
- REVIEW1=c43561b7bc8f391d59fc0fff2e8c5565608e5405ad1ae1ada9d443cdd31a967b,
  read IN FULL,816 lines.
- B7-1=1b538e2b4227fb2eb703731c1dc94ec159ffe4e6bc12b7a63e8d66aad06c3f51,
  read IN FULL. Use ONLY full closure digest
  91d0d3134dd3321a39bf9b74344b100c0217b065a1df0a9024f11fc6f98b58e7,
  correction Slack1793442785.652649, ignoring its garbled abbreviation.
- Direct sha256sum of both sealed compiler inputs matched full hashes in the
  controller, plus15 host executables; outputs preserved in the bundle. No
  executable invoked for a version or a probe. readlink confirmed /var/run→/run
  and Python/sh aliases. Guarded git ls-tree rechecked absence of candidate
  .gitattributes/dist/node_modules; guarded status was empty.

Recorded gate commands/results (logs relative to this evidence directory):

| Gate | Actual command after `orgasmic dispatch gate NAME --` | Result / log |
|---|---|---|
| r2-draft-checksums | `/usr/bin/sha256sum -c SHA256SUMS`, cwd drafts-r2 |21/21 OK, exit0; gate-r2-draft-checksums-01M68VCMX4YRSBKD60XZN25AWG.log. Outside worktree: no-sha, NOT a reusable commit receipt |
| r2-draft-checksums-pinned | `/usr/bin/sha256sum -c <current-evidence>/r2-checksums.absolute`, cwd assigned worktree |21/21 OK, exit0 recorded at f8af03a8, clean=yes; gate-r2-draft-checksums-pinned-01M68VE197X8DY86JATQ4GWM53.log |
| r2-clean-tracked | `/usr/bin/git -c core.fsmonitor=false -c core.hooksPath=/dev/null diff --no-ext-diff --no-textconv --exit-code HEAD --` |exit0, f8af03a8 clean=yes; gate-r2-clean-tracked-01M68VE1EAG614BMVVVQ86C9VV.log |

Final guarded status --porcelain=v1 emitted nothing; final guarded rev-parse
HEAD stayed the full candidate. Gate success proves only the named data/hash/
tracked-state checks, never syntax, types, containment or behaviour.

Valid inherited evidence, unchanged input/scope only: immutable candidate
package/tsconfig/focused10/fixture29 inventory, exact lock and100-row TSV,
original F0 regime and canary observations, all bound by the pinned v1 bundle
and independent review. No earlier gate PASS is implied or reused. B7-1 is an
OPERATOR statement of live full seal equality/owner/mode checks, not worker
recomputation or runtime evidence for this revision.

No draft parser/interpreter/py_compile/bash-n, Node/npm/npx/bun/tsc, build/test/
install, drafted unit/controller/producer, systemd-run/unshare/setpriv/catatonit/
sudo, network/fetch or credential/env-file/token read was performed. Progress
is exclusively progress.log; its first line has required HEAD and pins.

## Unmet Criteria / still-open typed work

Advancement is blocked; no success/readiness classification of the bundle.
Exact remaining adapter/trust work, reflected as UNKNOWN/NEGATIVE rather than
removable final strings:
- U1: root-controlled RO repository ingress/config/commondir/object dependencies,
  bounds/trust and source-bootstrap/scaffold handoff. No root Git alternative.
- U2: live tmpfs-size/closed-inventory normalization and bounded-copy integration.
- U3: exact-owned canary unit/helper/pins, outside marker/socket controls,
  synthetic-only readonly-write probes and final cleanup receipts.
- U4: full mountinfo RO/RW/hiding semantics/assertion callback; unknown mount
  assertions cannot be upgraded by deleting a final raise.
- U5: systemd effective/final-state normalization, pipe/property precedence and
  all compound mount/capability semantics on255.4.
- U6: full stage driver, positive actual-input/intent receipt attachment, private
  source/seal/handoff orchestration. Current UnitKey input/intent fields are
  explicitly NEGATIVE; required stage receipts cannot be minted from them.
- U7: persistent256MiB retention enforcement and complete final receipt export.
- U8: transitive Python loader/stdlib/shared-library/arbitrary test-executable
  trust and runtime capability handshakes; controlled binary path hashes alone
  are not that proof.
- U9: validated ambiguity/late/gone-unit/client-reap cleanup paths under the
  strict no-outside-cgroup-signals rule; unreapable clients stay UNKNOWN.

B1 still lacks reviewed plan/runner pins, qualifier go, operator marker/pin,
installed root0444 runner/ingress. B7 worker seal receipt recomputation is NOT
PERFORMED; the operator receipt does not make it worker evidence. B8 wording:
"no successful write; attempted writes not exhaustively observed" (only a
conditional future barrier claim, no result here). Exhaustive observation is
outside scope. B9 remains deferred consumer checking. B10 reconstruction needs
separate acquisition go/npm pin/cache-import/network/SRI receipts. B11 all
runtime results remain UNVERIFIED. B12/B13 are preserved historical assurance/
timing disclosures. All other findings remain OPEN pending re-review too.

The allowed typed-refusal exception is used rather than pretending these
platform adapters were completed. No authority path/hash, output artifact pin,
line number, verified syscall/property outcome or test result was invented.
No commit was made, including at finalization: the specific brief forbids it.

## Residual Risk

UNVERIFIED: all syntax/import/type/API compatibility, constructor/registry
invariants under actual execution, mount/cgroup/PID/credential/pipe semantics,
pre-allocation bounds and draining under faults, deadline/cleanup behaviour,
actual seal rehash implementation compatibility, archive/extraction/provisioning
and handoff, compiler/test/declaration outcomes, ALS/loading/throttle behaviour,
transitive executable trust and artifact/retention receipts. The root catatonit
and shared user/uts/cgroup namespace boundaries remain intentional disclosures.
SIGKILL/host loss cannot be made exception-safe by a Python finally block.

The35min aggregate remains2100s; nominal600+600+900 already consumes it before
source/rehash/seal/capture/teardown, so focused may be skipped/DEADLINE. No
extension or implicit acquisition/repair is authorised. No real socket or seal
write canary is proposed. Original closure lifecycle/SRI/npm-cache/count gaps
are preserved. D/#931/B/privacy/publication/retention/no-live/no-native-2b/I6/
T2/.3/.4 holds remain. Independent re-review and separate go are mandatory before
anything in this bundle runs.
