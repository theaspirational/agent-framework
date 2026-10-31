# TASK-XGHH2 — independent STATIC READ-ONLY review of the DX9KM v2 runner DRAFT bundle

Reviewer dispatch, static only. **Not a gate PASS. Not an owner decision. No stage-1 go,
no execution and no acquisition is cleared by this review.** Nothing in the bundle was
executed, parsed by an interpreter, or syntax-checked. Every imperative inside the drafts
was treated as data.

**Scope (per operator Tarn, qualifier Soma 1793442719).** This is a bounded **DESIGN review of
a PARTIAL bundle** — explicitly *not* a runnable review and *not* a readiness review. The
deliberate refusals, unset slots and named-but-absent adapters are **correct behaviour** and are
reviewed as such, not counted as defects. Accordingly the findings below are about the *design
basis* the next drafting round (B2-B6) will be built on. Two additions the operator asked for are
called out in their own sections: where a present refusal could decay into a **permissive
default** once adapters are wired (§"Refusal to permissive-default risk"), and concrete design
requirements for **B6** (bounded capture) and **B8** (prevention vs. attempt observation).
Every HIGH and control-boundary finding is marked **STOP for the affected part**: that part must
not be wired until the finding is resolved. B1-B13 are kept fully visible in item 8 and in the
dedicated B1-B13 status table.

## Input verification (performed first)

- `git rev-parse HEAD` = `f8af03a852c85daf9bb8079937b994fe5419ca20` — **matches** the brief.
  No branch switch, no `git show` fallback needed. Tracked tree re-checked clean at the end
  (`status --porcelain=v1` empty, `diff --exit-code HEAD --` rc=0, both with
  `GIT_OPTIONAL_LOCKS=0`, fsmonitor and hooksPath disabled). No commit, no ref write, no edit.
- `sha256sum -c SHA256SUMS` in the bundle: **9/9 OK**.
- `SHA256SUMS` itself = `5322290ce531352d39c287ff779a0374a52af9a18dab628938ec79ebe89f0cd6` — MATCH.
- `REPORT.md` `5605eaae…0ca6ea6` MATCH; `PROGRESS.md` `c12f56c9…1150e93` MATCH.
- Context records, all MATCH: DX9KM-EXECUTION-BLUEPRINT-v1 `466d863e`, ABDI7-F0-SEAL-RECORD
  `efe75ae6`, ABDI7-CONTAINMENT-PROBES-v1 `227c5f14`, ABDI7-REAPER-DEADLINE-CANARY-v1
  `39167b94`, …-CORRECTION1 `8bb344cc`. All five read in full, as were all 12 bundle files.
- All bundle inputs are mode `0444`, no exec bits. All four scripts carry the exact required
  `# DRAFT — NOT REVIEWED — MUST NOT BE EXECUTED.` first line.
- REPORT.md's deliverable hash table is internally consistent with the actual bundle bytes
  (all nine, plus its own self-reference convention). No fabricated pins found.

## Verdict per artifact

| Artifact | Verdict |
|---|---|
| `BLUEPRINT-v2.md` | **usable as a design basis** — with the §5a staging defect (H1/M1), the `/var/run` alias (M5) and the "exactly one runtime" claim (H3) corrected |
| `controller.py` | **needs changes** — H2, M2, M3, M4. Its default-refusal construction is correct and complete |
| `unit-wrapper.sh` | **usable as a design basis** — the post-drop guard is correct and fails closed; pin `python3` (M8) |
| `producer-build.sh` | **usable as a design basis** |
| `producer-test.sh` | **usable as a design basis** |
| `closure-reconstruction-plan.md` | **usable as a design basis** — met every regime-(b) requirement I checked |
| `lock-tarballs.tsv` | **usable** — byte-identical to a fresh regeneration from the sealed lock, 100/100 |
| `unit-template.json` | **usable** — but it duplicates a Python literal; name one authoritative (L6) |
| `input-verification.md`, `REPORT.md`, `PROGRESS.md` | accurate on every point I could independently check |

The overall drafting is disciplined and unusually self-honest: it refuses by default in five
independent ways, it keeps one original monotonic deadline, it never mints its own authority,
and it repeatedly declines to convert absent evidence into a pass. The findings below are
mostly gaps between a well-specified plan and the reference code, plus three places where a
claim outruns what the code or the host actually supports.

---

## Findings

### HIGH

**H1 — STOP for source staging (§5a) and the root-side git path.** `BLUEPRINT-v2.md` §5a / `controller.py:86-87`: the root-side git hardening list omits
the repository-local config, which is worker-writable.**
`GIT` neutralises system config (`GIT_CONFIG_NOSYSTEM=1`), global config
(`GIT_CONFIG_GLOBAL=/dev/null`), the *global* attributes file (`core.attributesFile=/dev/null`),
hooks (`core.hooksPath=/dev/null`), `core.fsmonitor` and `protocol.allow`. It does **not**
neutralise the repository-local `.git/config`, which I verified is
`-rw-rw-r-- 1 orgasmic orgasmic /home/orgasmic/src/agent-framework/.git/config` — mode 0664,
uid/gid 1002. `session_adapter` (`controller.py:409`) and §5a plan a `git archive` of the
candidate executed by the **root** controller against that repository. Local config is where
filter driver commands (`filter.<name>.clean/smudge`) live, and `git archive` applies
working-tree conversion.
*Failure scenario:* uid 1002 writes `[filter "x"] smudge = /bin/sh -c '…'` into the local
config; if any `.gitattributes` in the archived tree binds `filter=x`, that command runs as
root during staging. **Not presently exploitable** — I verified by `git ls-tree -r --name-only
f8af03a8…` that the pinned tree contains **no `.gitattributes`** — but that is a property of
today's candidate, not an enforced control, and §5a's "no root-executed source script"
(L5a, and §2 "No source or package code runs as root") rests on it unstated.
*Fix direction:* do the archive from a root-owned object store (`--git-dir` on a root-owned
bare clone of the verified objects), or drop to uid 1002 for the archive step; and assert the
absence of `.gitattributes` in the pinned tree as a recorded precondition. Add to B1–B13.

**H2 — STOP for the sealed-closure / sealed-Node bind path.** `controller.py:26-27, 133-135, 214`: the sealed closure and sealed Node are bound into
the unit without any integrity check; `CLOSURE_SHA`/`NODE_TREE_SHA` are only compared to the
marker's own JSON fields.**
`marker()` checks `data.get('sealed_closure_manifest') == CLOSURE_SHA` and
`data.get('node_manifest') == NODE_TREE_SHA` (lines 134-135) — that is the operator marker
agreeing with the controller's own constants, not a measurement of the sealed trees. The trees
are then RO-bound at line 214 (`SEALED_CLOSURE:/work/src/node_modules`, `SEALED_NODE:SEALED_NODE`)
with no manifest rehash and, notably, **without `root_locked()`** — the function that exists
precisely to prove root ownership, no symlink ancestry and no uid-1002 writability is applied to
`RUNNER_DIR` and `OPERATOR_GO_FILE` but never to the two bind sources that carry all the
dependency and runtime bytes. Only `SEALED_NODE/bin/node` has its bytes verified (lines 34, 424).
BLUEPRINT §5a (L5a) requires "Verify closure content/modes/links/owners before and after all
units … with the original canonical closure-manifest format and sealed F0 pin"; brief item 6
requires a rehash before the test. Neither exists in any code path.
*Failure scenario:* the sealed closure is modified between F0 and launch; every check in the
draft still passes, because nothing reads the tree. The marker would confirm the expected hash
and the run would proceed on altered dependency bytes.
*Mitigating fact:* current on-disk state is correct — `/srv/ci-fixtures` is `drwxr-xr-x root root`
and `/srv/ci-fixtures/abdi7-closure-20261031` is `dr-xr-xr-x root root` (verified).
*Fix direction:* call `root_locked()` on both bind sources, and wire the closure-manifest rehash
(before and after each unit) against the sealed F0 pin `91d0d313…` — not the pre-normalisation
`dabd7705…`, which the drafts correctly already distinguish. B2 currently reads as "orchestration
not wired"; it should state separately that **the closure integrity check does not exist yet**.

**H3 — STOP for the compiler invocation and the single-runtime disclosure.** `BLUEPRINT-v2.md` §5b / `controller.py:29-35`: the only package code that actually
executes in stage 1 is an unpinned 24 MB native binary, and v1's "exactly one runtime" claim is
carried into v2 uncorrected.**
Verified read-only against the sealed closure: `typescript` is **7.0.2**;
`typescript/bin/tsc` is a 44-byte ESM shim (`import "../lib/tsc.js"`); `lib/tsc.js` resolves
`@typescript/typescript-linux-x64/lib/tsc` via `getExePath()` and launches it with
`process.execve` or `execFileSync`. That file is a **24,101,026-byte statically-linked
go1.26.4 ELF executable**. Because the sealed runtime is Node **22.12.0** — below the
`process.execve` threshold the launcher tests for — the native compiler runs as a **grandchild
process**, not an exec replacement.
The drafts disclose the launcher and the native binary honestly (§5b, input-verification.md
L58-62, PROGRESS.md L5) and both quoted hashes are correct — I confirmed
`bin/tsc` = `2219f428a7e55aaf1f7ad85b9b0f0cf5078aeb76ccc9a7c6036c92d48f492ffd` and the native
= `4f2de678286401759b3fb4475bafe35b8f32b4b3a07d92642bbf37eadc9b34a4`. What is missing:
1. `BINARY_SHA` pins catatonit, unshare, setpriv, systemd-run and `bin/node` — but **neither
   tsc path**. The controller enforces no pin on the binary that does the work, while pinning
   five that merely set up the sandbox. §5b defers this to "the later operator adapter".
2. DX9KM-v1 §3's "**Stage 1 uses exactly one runtime: the sealed Node 22.12.0**" is never
   retracted, and §5b's "Use only sealed Node 22.12.0" repeats the framing. A second, native
   runtime executes. Brief item 8 asks for claims stronger than the code supports; this is one.
3. No B-item names the native compiler as an execution surface. B11 covers "tsc/build/test …
   UNVERIFIED" generically, which is not the same statement.
*Containment is fine and worth recording:* it runs post-drop as uid 1002, caps 0, NNP=1, inside
the private PID/net/mnt/IPC namespaces — so brief item 1's "no package code as root" holds.
*Fix direction:* add both tsc paths to `BINARY_SHA`; retract "exactly one runtime" explicitly
and restate stage 1 as "one sealed Node plus one sealed native compiler, both hash-pinned".

### MEDIUM

**M1 — STOP for §5a staging (same part as H1).** `BLUEPRINT-v2.md` §5a: the root `git archive` will abort on git's dubious-ownership
check, so staging as specified cannot run.** git is **2.43.0** (check present since 2.35.2).
The repository is `drwxrwxr-x orgasmic orgasmic` (uid 1002); the controller runs as root
(`controller.py:420`); `CONTROL_ENV` (lines 83-85) carries no `SUDO_UID`, and
`GIT_CONFIG_GLOBAL=/dev/null` + `GIT_CONFIG_NOSYSTEM=1` strip any `safe.directory`. Result:
`fatal: detected dubious ownership`. This fails closed — nothing unsafe happens — but §5a is
unimplementable as written and the issue is absent from B1–B13. Fix together with H1 (a
root-owned object store removes both problems at once).

**M2 — `controller.py:358-361`: the DEADLINE branch never breaks, so teardown repeats and
consumes the reserved final 15 s.** After `record['timeout']='DEADLINE'` and `stop_owned(...)`,
control falls back to `while selector.get_map():`. If the pipe does not reach EOF, every
subsequent iteration re-enters `stop_owned` — re-TERMing the reaper, re-issuing
`systemctl kill` and `stop`, and re-running the `while budget.remaining()>10 and
unit_members(cg)` poll at line 322. Bounded by `budget.require()` at line 377, so no infinite
loop, but it directly contradicts BLUEPRINT §4's "reserve the final 15s for forced cleanup,
client reaping and capped receipts". *Fix:* `break` (or return) after the deadline teardown and
let the `finally` finalizer own the rest.

**M3 — STOP for the teardown/finalizer part (control boundary).** `controller.py:361`: a started unit is left running when its InvocationID was never
observed.** `raise Refusal('cannot stop without verified invocation')` fires if the aggregate
deadline arrives before the unit first reports `ActiveState` in activating/active/deactivating
(line 364). The `finally` at lines 385-389 only closes the selector and pipe — it is a comment
block describing a finalizer, not one. The unit is then neither stopped nor survivor-listed.
B5 names this ("launch-before-InvocationID failures"), but brief item 4 requires survivor
listing, so it stays a blocker rather than a disclosure.

**M4 — STOP for the teardown/finalizer part (control boundary).** `controller.py:284, 344-389`: there is no normal-path or exception-path teardown or
survivor listing.** `stop_owned` has exactly one call site: line 360, the DEADLINE branch. On
normal completion, on any `Refusal`, or on any exception, nothing stops the unit, nothing
records `survivors_before`/`survivors_after`, and the final unit `Result` is never retrieved —
which is also why `classify` can only ever return `INCONCLUSIVE` from a `capture_unit` record
(`producer_exit` and `unit_result` are initialised `None` at line 352 and never set). The
fail-closed direction is correct and deliberate. This is the largest single gap between §7's
specification and the reference code; B5 discloses it accurately ("`stop_owned` alone is NOT an
exception-safe finalizer").

**M5 — `controller.py:195` / `unit-template.json:8`: the `/var/run` tmpfs entry is a verified
alias, not an open uncertainty.** I verified on this host: `lrwxrwxrwx /var/run -> /run`.
`TemporaryFileSystem=… /run:ro,size=16M /var/run:ro,size=16M …` therefore requests two tmpfs
mounts resolving to the same target — at best a redundant stacked mount, at worst a
`namespace-setup` unit-start failure. The drafts currently carry it as "alias uncertainty"
(§3, §5f) and conservatively budget 16 MiB for it. *Fix:* drop the `/var/run` entry, and record
the symlink as an asserted fact in the mountinfo checks instead.

**M6 — `controller.py:213-219`: the nested RW-under-RO binds depend on mountpoints absent from
the source tree.** `/work/src` is RO-bound, with `/work/src/node_modules` (RO) and
`/work/src/dist` (RW for types/build, RO for focused) nested inside it. I verified the candidate
tree contains **neither `dist/` nor `node_modules/`**. §5a states the intent ("Only empty mount
scaffolding dist/ and node_modules/ may be added and is inventoried explicitly"), but the
provisioner is absent (B2) and nothing in code expresses the requirement. Fails closed (unit
start failure), but it is a precondition that should be an explicit, checked one.

**M7 — `controller.py:200, 222`: `--pipe` and an explicit `StandardInput=null` property are set
together.** `systemd-run --pipe` installs its own standard-I/O file-descriptor settings; the
property list then also passes `StandardInput=null`. Precedence on systemd 255.4 is unverified.
If the explicit property displaces `--pipe`'s fd plumbing, the external draining reader — the
entire capture design — silently receives nothing, and `classify` returns `INCONCLUSIVE` rather
than a usable result. B11 covers this only as generic "property composition". *Fix:* verify on
255.4 and keep whichever is intended, documenting the choice.

**M8 — STOP for the post-drop guard's interpreter pin (control boundary).** `controller.py:29-35`: trusted-path binaries invoked post-drop are unpinned.**
`BINARY_SHA` pins five binaries. The wrapper and producers additionally invoke
`/usr/bin/python3` (unit-wrapper.sh:4, 25, 29), `/usr/bin/bash`, `/usr/bin/env`,
`/usr/bin/timeout` (unit-wrapper.sh:40), and `/usr/bin/chmod`, `/usr/bin/cp`, `/usr/bin/mkdir`
(producer-build.sh:20-25). These all run post-drop with `ProtectSystem=strict` making `/usr`
read-only inside the unit, so this is host-integrity hygiene, not a payload escape — except
that `/usr/bin/python3` is what *establishes* the post-drop credential guard, so it belongs in
the pin set.

**M9 — STOP for marker re-verification (control boundary).** `controller.py:122-147, 422`: the marker is verified once, up to 35 minutes before its
last use, and `OPERATOR_GO_FILE` has no path constraint.**
(a) `marker()` runs once in `main()`. The runner files it hash-verifies are then RO-bound and
executed (lines 213, 233) for the whole session with no per-stage re-verification. The drafts
do answer the check-to-use question — "Root is a trusted operator, not a hostile actor this
plan can confine" (§1) — and the ordering inside `marker()` is genuinely careful. But the
answer should be stated at the check, and re-verifying `runner_files` digests immediately before
each launch is cheap. (b) `RUNNER_DIR` gets a strict regex (line 127:
`/srv/ci-fixtures/abdi7-runner-[0-9]{8}(?:-[a-z0-9]+)?`) while `OPERATOR_GO_FILE` gets none —
only `root_locked`, a 16 KiB size cap and the hash. §1 names `/root/` or the runner's `go/`
directory as the intended locations; encode that as a regex too, for symmetry.

### LOW

- **L1 — `controller.py:374`: log caps hardcoded as `64*MIB` / `160*MIB`** instead of
  `BOUNDS['step_log_MiB']` / `BOUNDS['total_log_MiB']`. Values agree today, but `BOUNDS` is what
  the operator marker hash-binds (line 135), so a marker-approved bound change would silently
  not be enforced.
- **L2 — `controller.py:182`: `os.environ['ABDI7_DEADLINE_NS']` raises `KeyError`, not
  `Refusal`.** Still fails (exit 1 rather than the 78 convention); minor loss of signal fidelity.
- **L3 — `controller.py:251-252`: the `show()` 128 KiB cap is applied after `r.stdout` is already
  decoded.** Consistent with B6's disclosure about `bounded_control`; noted so the B6 fix moves
  this check too.
- **L4 — `unit-wrapper.sh:31` / `producer-test.sh:7`: `/out/consumer-verified` is a
  uid-1002-writable sequencing token.** Not a security boundary (same uid both sides), and
  `set -e` plus `SystemExit(78)` prevent it being reached on a manifest mismatch; it depends on
  `/out` being a fresh per-stage scratch, which only the absent provisioner guarantees.
- **L5 — the three stage ceilings nominally consume the entire aggregate.** 600 + 600 + 900 =
  2100 s = the whole 35 min, before `git archive`, the 142-MiB-class closure and source hashes,
  the seal copy and teardown. The derivation is correct and fails closed, and §4 explicitly says
  "there is NO promise all ceilings fit" — so this is disclosed, not a defect. Worth stating to
  the qualifier anyway: the most likely first-run outcome is DEADLINE before or during
  `focused`, the stage that carries the actual question. Either raise the aggregate (a qualifier
  call — 35 min is the given original) or lower the ceilings deliberately.
- **L6 — `unit-template.json` duplicates `controller.py:192-203`.** I verified they are 28/28
  byte-identical today. Since only the Python literal has runtime effect while both are
  marker-hash-bound, name `controller.py` authoritative or have it load the JSON.

---

## Brief items 1-8: what I confirmed

**1. Root before the privilege drop.** Operations as root, in order: the controller itself
(`controller.py:420` enforces `geteuid()==0`); systemd pid 1 performing namespace/mount/cgroup
setup; `/usr/bin/systemd-run` (client); `/usr/bin/unshare` (the unit MainPID);
`/usr/bin/catatonit` (namespace PID 1); `/usr/bin/setpriv`, which drops. Everything after —
`/usr/bin/env -i`, bash, the wrapper, both producers, node and the native compiler — runs as
uid/gid 1002. **No payload, package or source code, and no package hook, runs as root**: there
is no `npm`/`npx`/`bun`/`sudo` in any argv across all four scripts (only a defensive
`npm_config_offline=true` env var at `controller.py:230` and comments), and no lifecycle runner.
catatonit as root is a **disclosed trusted boundary only** (§2 "Trusted-control boundary",
consistent with CANARY-v1 L24) — a pinned system binary that executes no package code.
*One exception to the confirmation:* the planned root-side `git archive` (H1/M1) is a root
operation over a uid-1002-writable repository whose local-config surface is not neutralised, so
I cannot confirm item 1 for that step.
**The post-drop guard fails closed and is correctly placed.** `unit-wrapper.sh:4-17` is the
first payload action, before any producer, with no shell startup file reachable (`env -i` clears
`BASH_ENV`; `--noprofile --norc`; `python3 -I -S`). The predicate is sound: all four Uid and
Gid values must be 1002, `Groups` empty, `CapEff/Prm/Bnd/Inh/Amb` all zero, `NoNewPrivs`=1.
Missing fields default to `'-1'` → `int('-1',16) == -1 ≠ 0` → refuse. A write failure on
`/out/credentials.json`, or a missing interpreter, also yields a nonzero exit caught by
`[[ $? == 0 ]] || exit 78` at line 18. Producers independently re-check uid/gid and the
candidate pin (`producer-build.sh:5-6`, `producer-test.sh:5-6`).

**2. Go-marker enforcement.** Correct in design, and the scope binding is complete.
- *Scope not authority:* `main()` checks `REVIEW_RELEASED` (line 421) **before** `marker()`
  (line 422), so a valid marker alone can never authorise. §1: "Even a valid marker is NOT
  execution authority."
- *Outside worker- and package-writable paths:* `root_locked` (lines 98-109) walks the full
  ancestry requiring root:root, no symlink at any level, and `mode & 0o022 == 0`. The ACL
  reasoning in the comment at lines 144-146 is **sound** — for POSIX ACLs the group bits are
  the mask, so a masked-off `user:1002:rw-` entry grants no effective write.
- *Binds candidate, closure manifest, runner/unit hashes, stage and bounds:* all present
  (lines 133-143) — candidate, `sealed_closure_manifest`, `node_manifest`, `lock_sha256`,
  `stage='stage-1'`, the seven-substage `STAGES` inventory, the whole `BOUNDS` dict, `runner_dir`,
  and per-file digests for all five `RUNNER_FILES`.
- *Refuses on mismatch / on uid-1002 writability / when absent:* lines 124 (absent slots), 128
  (runner regex), 130 (oversize), 131 (marker hash), 138 (scope field), 140 (inventory), 143
  (runner file hash), plus `root_locked` for writability.
- *NO code path mints it:* **verified exhaustively.** The only writes anywhere in the bundle are
  `controller.py:186` + `:188` (consumer manifest and its sidecar, under payload `/out`),
  `:356` (`unit.log`, exclusive-create `'xb'`), `:400` (`/out/isolation.json`),
  `unit-wrapper.sh:11` (`/out/credentials.json`), `:43` (`/out/producer.exit`), and
  producer-build's writes under `dist/`. Nothing creates `OPERATOR_GO_FILE`.
- *Default refusal:* five independent refusals — `REVIEW_RELEASED=False`, `RUNNER_DIR=None`,
  `OPERATOR_GO_FILE=None`, `OPERATOR_GO_SHA256=None`, non-empty `INTEGRATION_BLOCKERS`.
  `payload_preflight` additionally refuses unconditionally at line 405.
- *TOCTOU:* see M9 for the check-to-use window and the missing path constraint.

**3. Exact boundaries.** No regression against the containment or canary records; two gaps.
Present and matching the records: `PrivateNetwork`/`PrivateTmp`/`PrivateIPC`/`PrivateDevices`
(PrivateDevices matches CANARY-v1 L9; PROBES-v1's working construction lacked it, so this is an
improvement); `ProtectHome=tmpfs`; `ProtectSystem=strict`; `RestrictAddressFamilies=AF_UNIX
AF_INET AF_INET6` (AF_NETLINK correctly excluded, matching the probe observation);
`NoNewPrivileges`, `LockPersonality`, `RestrictSUIDSGID`; `ReadOnlyPaths=/sys` (matching "the
cgroup namespace is shared, and /sys is visible read-only"); `MemoryMax`/`MemorySwapMax`/
`TasksMax`/`CPUQuota`; `KillMode=control-group`, `SendSIGKILL`, `Delegate=no`, `LimitCORE=0`,
`UMask=0077`. Private PID namespace via `unshare --pid --fork --mount-proc` plus catatonit as
namespace PID 1 structurally closes the PROBES-v1 gap that `ProtectProc` does not hide same-UID
processes. `PrivatePIDs` correctly not used (unavailable on systemd 255.4 — confirmed
`systemd 255 (255.4-1ubuntu8.18)`). The shared user/uts/cgroup namespaces are explicitly
disclosed (§3 "**SHARED:**") and `unit_members` reads only the exact owned cgroup subtree
(line 272 comment). `CapabilityBoundingSet` is reduced to five caps with its own compatibility
disclosed as unverified (§2) — a real tightening over the canary chain, correctly not claimed
as proven. **Gaps:** `/var/run` (M5) and the nested-bind mountpoints (M6). `/run` is correctly
hidden by a `ro` tmpfs. No `SystemCallFilter`/`SystemCallArchitectures` and no
`RestrictNamespaces` — the latter is *correctly* omitted, since `unshare` needs
`CLONE_NEWPID|CLONE_NEWNS`; worth stating as a deliberate omission rather than leaving silent.

**4. Signals and teardown.** The design here is the strongest part of the controller.
- *No TERM to MainPID `unshare`:* confirmed. `stop_owned` identifies `main` as unshare
  (lines 290-293) solely to use it as the expected parent, and never signals it. §7.4 states
  why: `--kill-child` SIGKILLs namespace init when unshare dies.
- *Identity-bound catatonit selection:* `comm=='catatonit'`, `exe=='/usr/bin/catatonit'`,
  `ppid==main`, and `cgroup==['0::/system.slice/<unit>']` (lines 294-295), requiring exactly one
  match. `identity()` captures start ticks (`tail[19]`, correctly field 22 of `/proc/pid/stat`)
  and `ppid` (`tail[1]`, field 4) — both index derivations are right. **The TOCTOU ordering is
  correct:** `os.pidfd_open` first (line 298), then re-verify unit ownership, full identity
  equality including start time, and cgroup membership (lines 300-303), then signal **through
  the pidfd** (line 304). A reused pid cannot be signalled.
- *Grace bound and hard fallback:* grace is `min(now+5s, deadline-15s)` (lines 308-309) — bound
  by the **original** deadline, not a new budget; then `systemctl kill --kill-whom=all
  --signal=KILL` on the exact unit, then `stop --no-block` (lines 315-320).
- *RuntimeMax classed TIMEOUT/INCONCLUSIVE:* `classify` line 334 maps `unit_result=='timeout'`
  to `TIMEOUT/INCONCLUSIVE`, and §4 is explicit that a 143 main status or a misleading wrapper
  exit 0 does not rescue it. Missing evidence maps to `INCONCLUSIVE`, never success (lines
  337-339); the success label is the deliberately non-committal
  `STAGE_EXIT_0_NOT_QUALIFICATION`.
- *Never anything outside the unit cgroup:* confirmed. Selection is only ever by membership in
  `/sys/fs/cgroup/system.slice/<unit>`; there is no `pgrep`, name-based, user-wide or
  `user@1002` selection anywhere (line 318 comment, §7.2, §7 closing paragraph). The three
  pre-existing podman pause `catatonit -P` processes from CORRECTION1 are under
  `user@1002.service/user.slice/podman-pause*` and are structurally unreachable by this
  selector; §7 states "catatonit comm alone is not ownership" and "There is NO exception
  permitting a signal to any process outside an owned cgroup", satisfying Soma's 1793441388 rule.
- *Survivor listing:* present in `stop_owned` (`survivors_before`, `survivors_after`,
  `survivors_status`) as pid/start_ticks/cgroup — **but only on the DEADLINE path** (M3, M4).
- Also missing: §7.1 requires verifying the unit name "was absent before launch"; no
  pre-existence check exists in `launch_argv` or `capture_unit`.

**5. One original 35-min monotonic aggregate deadline.** Correct.
`Budget()` is the **first** action in `main()` (line 419, before the euid check);
`aggregate_seconds=2100` (line 37) = 35 min; `deadline_ns = start_ns + 2100e9` (line 67) is set
once from `time.monotonic_ns()`. **No per-stage reset anywhere** — `unit_times` (lines 71-80)
derives `runtime = min(ceiling+15, floor(remaining − 45 teardown − 15 capture))` and
`inner = min(ceiling, runtime−15)` purely from remaining time; `digest_file` and
`artifact_manifest` take chunkwise `budget.require(teardown_reserve)` checks (lines 117, 159,
163); `bounded_control` clamps its own timeout to `budget.remaining()` (line 95); grace is
clamped to the original deadline (line 309). **DEADLINE skip** is present twice (lines 76, 79:
`runtime < 20` or `inner < 5`). The deadline crosses the privilege boundary correctly: it is
passed as `ABDI7_DEADLINE_NS` (lines 232, 234) and consumed by `payload_preflight` (line 394)
and `consumer_manifest` (line 182) — and this is sound because no time namespace is unshared,
so `CLOCK_MONOTONIC` is shared with the host. §4 states exactly that, and also discloses the
suspend caveat honestly. Caps: per-step 64 MiB and **aggregate** 160 MiB via the shared
`logs.kept` (line 374) with draining continuing after the cap so the payload cannot block
(correct design); scratch 4,096 MiB and retention 256 MiB are specified in §5f but their
provisioner is absent (B2). Aggregate write bounds on artifacts: 20,000 entries / 512 MiB
(lines 161, 170). See L5 on the ceiling-vs-aggregate arithmetic and M2 on the reserve.

**6. Immutable artifact handoff.** Specified correctly; largely unimplemented, and honestly so.
Seal after build **plus** the pretest copies: `producer-build.sh:22-25` performs both wasm
copies and the fixture copy *before* sealing, and §5c requires "only after build AND all
pretest copies exit 0, capture, and zero cgroup survivors". RO bind into a fresh test scratch:
`launch_argv:217-218` binds `handoff/dist:/work/src/dist` read-only for `focused` only, and RW
`scratch/dist` for types/build — the artifact tree itself, not a copy (§5d). Rehash before the
test: `unit-wrapper.sh:29-32` runs `consumer-manifest` and only then selects `producer-test.sh`,
which additionally gates on `/out/consumer-verified`; `consumer_manifest` compares **entire
canonical bytes** against the RO `/handoff/artifact-manifest.json`, so the consumer cannot
replace its own expected manifest. Producer and consumer hashes and modes: `artifact_manifest`
records type, exact mode, size and sha256 including the root and all directories, and treats
symlinks, hardlinks (`st_nlink != 1`), devices, sockets and any `mode & 0o7000` as STOP
(lines 165-172). `node_modules` write means STOP: §5a states "Any writable node_modules mount,
attempted write, content/mode/link change or extra closure path is STOP, not a warning", and
B8 correctly refuses to claim that RO denial plus hash equality proves no *attempted* write.
No silent rebuild: `producer-test.sh` has no build step and `focused` gets no writable `dist`.
**What is missing:** the seal copy, the producer→seal pin comparison and the closure rehash are
not implemented (B2), and H2 above — the closure/Node integrity check does not exist at all.
`consumer_manifest:186-188` also writes its output before comparing; deliberate (record then
fail) but the `.sha256` sidecar is written only on success.

**7. Reconstruction plan, regime (b).** Meets every requirement in the brief.
Exact lock pinned to `df14aa0a…22578` with "before/after sha256 must equal" and no lock
rewrite (§2, §4); no version updates, resolution repair, `--force`, omitted dev deps or
fallback registry (§2); HTTPS `registry.npmjs.org` only, port 443, cert+hostname verification,
no credentials/proxy/cookies/.npmrc, literal URLs rejecting userinfo/fragments/alternate
ports (§3); **SRI verified before extraction** — "Stream sha512, decode the exact lock SRI and
require byte equality BEFORE opening/extracting any tar member", with unsupported or multiple
integrity formats a STOP (§3); bounded count/size/time — ≤100 requests, concurrency 2, no
retries or redirects, 30 s/request, 64 MiB per tarball, 512 MiB aggregate counted while
streaming (explicitly not trusting Content-Length), ≤100,000 entries, ≤2,048 MiB unpacked, one
original 1,800 s deadline with fetching stopping at 1,200 s (§3); cache stance — a genuinely
fresh empty cache populated only from already-verified tarballs, SRI reverified on import, no
`~/.npm` reuse, and the honest warning "do NOT assume that merely placing .tgz files in a
directory makes npm use them" (§4); `--ignore-scripts` with implications spelled out — esbuild
0.28.2 non-optional loses its install-time binary selection/validation and must not be repaired,
fsevents 2.3.3 is optional/darwin-only and stays uninstalled without mutating the lock, and
esbuild/tsx usability is declared UNKNOWN (§5); original closure preserved as its own regime (a),
untouched, explicitly "NOT an ignore-scripts install", with the manifest difference correctly
attributed to 7,326 mode changes rather than content (§1); acquisition requires a separate
explicit go (header, §6). It also correctly declines to retroactively describe the installed
bytes as SRI-verified, and preserves the npm-version, warm-cache and 100-vs-55 gaps.
**Lock spot-check — far exceeded the 10-row requirement.** I regenerated the table from
`/srv/ci-fixtures/abdi7-closure-20261031/package-lock.json` with `jq` and `lock-tarballs.tsv`
is **byte-identical, all 100 rows, in key order**. I additionally re-verified rows 1-12
individually against the lock by key (`@animalabs/chronicle` 0.5.1 through
`@discordjs/formatters` 0.6.2) — all OK. Every claimed count confirmed: 101 `packages` keys
including root, 100 non-root, `lockfileVersion` 3, 47 optional, 56 dev, zero non-HTTPS or
non-`registry.npmjs.org` resolved URLs, zero non-`sha512-` integrity values, and
`hasInstallScript` exactly `esbuild 0.28.2` (optional=null) and `fsevents 2.3.3`
(optional=true, os=["darwin"]). The `@animalabs/context-manager` 0.24.2 SRI matches F0's
recorded value. One addition the plan should carry: the lock contains **20 `@typescript/*`
platform packages** at 7.0.2 alongside `typescript`, which is what makes §5's "must retain the
matching optional platform package" load-bearing — worth naming the linux-x64 one explicitly.

**8. Blocker inventory B1-B13: accurate but not complete.**
Accurate and well-calibrated on what it covers. In particular, the two the brief singles out
are right: **B12** is correctly kept as "possible automatic index refresh / literal zero
metadata writes UNVERIFIED", with no before-snapshot, no attempted undo, and no overclaim — and
it is kept properly distinct from the separately verified fact that the tracked source is clean
with no commits, which I re-confirmed independently (clean `status --porcelain=v1`, `diff
--exit-code HEAD --` rc=0, HEAD still f8af03a8 with no new commits). **B13** is a timing
disclosure only (10:18:17→10:23:32 = 5m15s, 15 s over), not backdated, correctly not dressed up
as compliance. B6 and B8 are notably honest: B6 admits `bounded_control`'s `capture_output` is
"not a pre-allocation bound", and B8 refuses to infer "no attempted write" from hash equality.
B7 correctly leaves `/root/abdi7-f0-20261031` as operator fact after a Permission-denied read
with no bypass attempted.
**Incomplete in four specific respects**, each needing its own B-item:
1. The §5a root-side git surface — local config not neutralised (H1) and the dubious-ownership
   abort (M1). No B-item mentions git at all.
2. The absent sealed-closure/sealed-Node integrity check (H2), which is a different statement
   from B2's "orchestration not implemented".
3. The native Go compiler as stage-1's real execution surface, unpinned in `BINARY_SHA` (H3).
   B11's generic "tsc/build/test UNVERIFIED" does not cover it.
4. No normal-path/exception-path teardown call site at all (M4) — B5 describes integration work
   remaining but reads as though `stop_owned` is wired in and merely incomplete.
**Understated:** B3's "/var/run alias handling … UNVERIFIED" — the alias is a verified fact on
this host (M5), so it is resolvable now, not an unknown.
**One claim stronger than the code supports:** DX9KM-v1 §3's "exactly one runtime", carried
into v2 §5b's framing while a second native runtime executes (H3). Separately, §7.1's
"verify it was absent before launch" has no corresponding code. I found **no fabricated hash,
no invented pin, and no claimed PASS** anywhere in the bundle; every spot-check I ran on the
drafts' factual assertions came back matching.

---

## Required changes, ordered

Because the next drafting round (B2-B6) will be built against this review, item 0 is listed
first: it is the change that most affects how the *rest* of the wiring will behave.

0. **Invert `payload_preflight` and `session_adapter` from deletable refusals into structural
   ones** (R1, R2). Replace the terminal `raise Refusal` in each with a registry of named
   required results — assertions for preflight, substage receipts keyed on the already
   marker-bound `STAGES` for the session adapter — and refuse unless every name reports pass.
   Do the same for `INTEGRATION_BLOCKERS` (R3) by turning the five prose strings into runtime
   capability predicates. Without this, wiring B2-B6 converts today's correct refusals into
   permissive defaults one line at a time; with it, partial wiring is visibly incomplete.
1. **Fix the §5a staging path** (H1, M1). Archive the candidate from a root-owned object store
   (`--git-dir` on a root-owned bare clone of verified objects), or drop to uid 1002 for the
   archive. Either removes both the dubious-ownership abort and the local-config surface. Record
   the absence of `.gitattributes` in the pinned tree as a checked precondition. Add a B-item.
2. **Make the closure and Node integrity check exist** (H2). Call `root_locked()` on
   `SEALED_CLOSURE` and `SEALED_NODE`, and wire the closure-manifest rehash against the sealed
   F0 pin `91d0d313…` before and after every unit. Split this out of B2 as its own blocker.
3. **Pin and re-describe the compiler** (H3). Add `typescript/bin/tsc` (`2219f428…`) and
   `@typescript/typescript-linux-x64/lib/tsc` (`4f2de678…`) to `BINARY_SHA`; retract "exactly
   one runtime" and restate stage 1 as one sealed Node plus one sealed native compiler.
4. **Write the exception-safe finalizer** (M2, M3, M4). `break` after the DEADLINE teardown;
   make the `finally` at `controller.py:385-389` an actual finalizer that owns, stops and
   survivor-lists the unit on every path including the never-observed-InvocationID case; add
   the unit pre-existence check §7.1 already requires.
5. **Resolve the mount composition** (M5, M6, M7). Drop the `/var/run` tmpfs entry and assert
   the symlink instead; make `dist/` and `node_modules/` scaffolding an explicit checked
   precondition of the staged snapshot; settle `--pipe` vs `StandardInput=null` on systemd
   255.4 and document the choice.
6. **Close the pin and marker gaps** (M8, M9). Add `/usr/bin/python3` (and ideally bash, env,
   timeout, coreutils) to `BINARY_SHA`; re-verify `runner_files` digests immediately before each
   launch; give `OPERATOR_GO_FILE` a path regex matching §1's stated locations; state the
   root-only check-to-use window at the check.
7. **Tidy the bound plumbing** (L1-L6). Read log caps from `BOUNDS`; raise `Refusal` rather than
   `KeyError` for a missing deadline; move the `show()` cap before allocation with the B6 fix;
   name `controller.py` or `unit-template.json` authoritative for the property list.
8. **Decide the budget arithmetic** (L5). Either raise the aggregate above 2100 s or lower the
   ceilings, so that `focused` is reachable rather than structurally the first casualty.
   Qualifier decision — 35 min is the given original.
9. **Add the four proposed B-items (B14-B17) and downgrade B3's `/var/run` clause** from
   unknown to resolved-fact. See the B1-B13 status table.
10. **Implement B6 as the single `bounded_read` refactor** described above, and adopt the B8
   prevention-vs-observation wording and canary-only proposal shape. The B6 refactor collapses
   L1, L3 and B6 into one change because the correct reader already exists in `capture_unit`.

---

## Refusal to permissive-default risk (operator request)

The bundle's refusals are correct behaviour and are reviewed as such. The question this section
answers is narrower: **for each present refusal, what happens when the adapter behind it is
wired?** A refusal is *safe* if resolving it requires the missing capability to actually exist.
It is *fragile* if resolving it is an edit to a literal, because then partial wiring silently
produces a permissive default. Ordered by risk.

**R1 — `payload_preflight` (`controller.py:391-405`) — HIGHEST RISK. STOP for the containment
assertion part.** The terminal `raise Refusal('synthetic canary + mount-assertion adapter not
yet implemented')` is the *last* line of the function. Everything above it **collects** evidence
without asserting it: `evidence[ns]` readlinks for all seven namespaces (396-397), full
`/proc/self/mountinfo` (398), and the interface list (399) are written to `/out/isolation.json`
(400), but the only hard check in the whole function is `evidence['interfaces'] != ['lo']` (401).
BLUEPRINT §3.3 requires much more — "mountinfo must prove RO source/closure/artifact/Node/runner/
sys, bounded RW list and hidden run locations. Compare namespace links with outside values
(different PID/net/mnt/ipc, shared user/uts/cgroup)". **Deleting line 405 therefore does not
enable a checked preflight; it enables an almost entirely unchecked one.** That is a one-line
edit away from a permissive default, and it is the exact line a future round will delete.
*Required shape:* invert the control. Build a registry of named required assertions
(`mnt_differs`, `pid_differs`, `closure_ro`, `source_ro`, `artifact_ro`, `node_ro`, `runner_ro`,
`sys_ro`, `rw_set_exactly`, `run_hidden`, `var_run_hidden`, `interfaces_lo_only`,
`canary_absent`, `canary_socket_absent`, …), evaluate each to an explicit pass/fail, and refuse
unless **every** name in the registry reports pass. Then the terminal refusal is structural — the
absence of a required result — rather than a deletable statement, and wiring one assertion cannot
unlock the rest.

**R2 — `session_adapter` (`controller.py:407-416`) — HIGH RISK. STOP for the orchestration part.**
Same anti-pattern: a seven-step docstring followed by `raise Refusal(...)` as the last line.
Nothing enforces that all seven steps exist once the raise is replaced. *Required shape:* the
controller already has the right primitive and does not use it — `STAGES` (line 46) names exactly
the seven substages `source/types/build/seal/focused/capture/teardown` **and is already
hash-bound by the operator marker** (line 135). Make each substage emit a completion receipt into
a stage ledger, and refuse unless every name in `STAGES` has one. That makes the marker do real
work, makes partial wiring visible as a missing receipt rather than a skipped step, and costs
almost nothing.

**R3 — `INTEGRATION_BLOCKERS` (`controller.py:53-59`, checked at 423) — HIGH RISK.** Five prose
strings in a tuple; the refusal evaporates when the tuple becomes empty. Nothing ties a given
string to the capability that resolves it, so a round that implements B2 could remove the B3
string, or remove two strings while implementing one adapter, and the controller would not
notice. It is also checked *after* `marker()` (line 422), which is harmless but means marker
validation runs in a state the code itself declares unfit. *Required shape:* replace the string
tuple with named runtime predicates (`session_adapter_available()`,
`containment_assertions_available()`, `final_state_adapter_available()`,
`finalizer_available()`, `bounded_control_is_streaming()`), each returning a real capability
check, and refuse listing whichever returned False. A blocker should then be impossible to
"resolve" by editing a literal.

**R4 — `REVIEW_RELEASED = False` (`controller.py:49`) — MEDIUM RISK.** A single bool guarding
everything; flipping it is one character. The in-code comment ("Changing this is itself a
separately reviewed revision") states policy, not mechanism. *Required shape:* bind release to
the reviewed artifact rather than to a flag — e.g. require the marker to carry the reviewed
plan's own id and digest, compared against a constant in the controller, so the release cannot be
granted unless a reviewed record with that digest exists. The marker schema already has the right
shape for this; it just needs a `reviewed_plan_sha256` field.

**R5 — provisioned bind paths (`controller.py:205-219`) — MEDIUM RISK. STOP for the provisioner
part.** `root_locked()` exists and is correct, but is applied only to `RUNNER_DIR` and
`OPERATOR_GO_FILE`. For `source`, `scratch` and `handoff` the *only* current gate is the regex at
line 212 (`/[A-Za-z0-9_./-]+`), and the comment at 209-210 openly concedes the adapter "must
reject ':', whitespace, symlinks and externally writable parents". The regex does exclude ':'
and whitespace; **symlinks and externally writable parents are unchecked.** So wiring the
provisioner without also calling `root_locked()` on all four bind sources yields a permissive
default by omission, not by edit. (Same root cause as H2, which covers `SEALED_CLOSURE` and
`SEALED_NODE`.) *Required shape:* make `launch_argv` call `root_locked()` on every bind source it
is handed, and fail if a caller passes a path that has not been through it.

**R6 — `classify` (`controller.py:330-342`) — MEDIUM RISK.** Today it cannot return anything but
`DEADLINE/INCONCLUSIVE` or `INCONCLUSIVE` from a `capture_unit` record, because `producer_exit`
and `unit_result` are initialised `None` (352) and never populated. That is correct fail-closed
behaviour *and* it means the honest-classification logic has never been exercised. When B4's
final-state adapter starts populating those keys, the only things standing between a run and
`STAGE_EXIT_0_NOT_QUALIFICATION` are the guards at 337-339. Two of them are durable
(`unit_result is None`, `producer_exit is None` — an adapter that writes a differently named key
leaves them None, which fails closed, the safe direction). One is fragile:
`record.get('survivors_status') != 'NONE'` currently holds only because `stop_owned` is the sole
writer of `'NONE'` and, per M4, is never called on the normal path. A finalizer that initialises
`survivors_status` optimistically — or that sets it before the final survivor sweep — inverts the
guard. Likewise `record['capture']='OK'` is set at line 379 *before* any outside final state is
known. *Required shape:* make the success branch require positively recorded evidence for every
field (an explicit `assert_all_present([...])` over a fixed key list) rather than inferring
success from the absence of a failure marker, and keep `survivors_status` write-once.

**R7 — marker slot truthiness (`controller.py:124`) — LOW RISK, noted for completeness.** The
guard `if not RUNNER_DIR or not OPERATOR_GO_FILE or not OPERATOR_GO_SHA256` is robust in the ways
that matter: `None` and `''` both refuse, a relative path is caught by `root_locked` ('not
absolute'), and a wrong digest is caught at line 131. The residual is that
`OPERATOR_GO_SHA256` is only tested for truthiness, never for format, so a truncated or
upper-case pin surfaces as an opaque 'marker hash mismatch' rather than 'malformed pin'. Add a
`re.fullmatch(r'[0-9a-f]{64}', …)` assertion so operator error is distinguishable from tampering.

**Not a refusal at all — and that is the point about B6.** `bounded_control`
(`controller.py:89-96`) is the one incomplete piece that is *functional but unsafe* rather than
refusing: it runs today, returns usable output, and silently has no memory bound. Every other gap
in the bundle announces itself by refusing. This one does not, which is why B6 deserves more
weight than its position in the list suggests — a future round can wire adapters around it and
never notice it was never fixed. See the next section.

---

## B6 — what a streaming, pre-allocation-bounded capture must look like (operator request)

**Agreed: `capture_output` with a length check afterwards is NOT safe, and the draft's own B6
says so correctly.** Two places are affected: `bounded_control` (`controller.py:94-96`) uses
`subprocess.run(..., capture_output=True)`, which calls `communicate()` and accumulates the
child's entire output as a Python `bytes` object before returning; and `show`
(`controller.py:251-252`) then decodes that whole object to text and only *afterwards* tests
`len(r.stdout) > 128*1024`. By the time either check runs, the allocation has already happened,
so neither is a bound — they are post-hoc reports on an unbounded allocation. A unit in an
unexpected state (very long `BindReadOnlyPaths`/`BindPaths` values, a pathological
`ControlGroup`, or a `systemctl` that streams) is enough to make that matter, and it happens on
the control path, inside the root controller, during teardown.

The required design — and the bundle already contains a correct implementation of it, which is
the cheapest route:

1. **Never `run(capture_output=True)` / `communicate()` on any path.** Use `Popen` with
   `stdin=DEVNULL`, `stdout=PIPE`, `stderr=STDOUT`, `close_fds=True`.
2. **Fixed-size reads with the ceiling enforced before retention.** Read with
   `os.read(fd, 65536)` into a fixed buffer and decide per-read how many bytes may be *kept*:
   `n = max(0, min(len(data), ceiling - kept))`. Retention is then bounded by construction; peak
   memory is one buffer plus `ceiling`, never the child's total output.
3. **Keep draining after the ceiling is hit.** Continue `os.read` while discarding, so the child
   can never block on a full pipe and turn a log cap into a deadlock. Set `cap_hit`.
   `capture_unit:369-376` already does exactly this, correctly.
4. **Bound by the same original `Budget`, not a new one.** `selectors.select(timeout=min(.1,
   max(0, budget.remaining())))` plus a `budget.require(reserve)` per iteration — again as
   `capture_unit:369, 377` already does.
5. **Bound the aggregate across calls, not just each call.** Control calls are small but
   numerous (`show` runs ~1/second per unit, and `stop_owned` adds more). Thread the same
   `Logs`-style accumulator through `bounded_control` so many small calls cannot sum past the
   aggregate, and so the bound is read from `BOUNDS` (see L1) rather than from literals.
6. **For control calls specifically, a ceiling breach is a refusal, not a truncation.** A
   `systemctl show` larger than the cap means the unit is not in the state the controller thinks
   it is; parsing a prefix of it is worse than failing. `Refusal`, classify INCONCLUSIVE. (For
   *payload* logs, truncate-and-continue with `cap_hit` is right, as drafted.)
7. **Size-check before decode.** Move the `>128*1024` test ahead of
   `r.stdout.decode('utf-8','strict')`, and parse only after the bounded read completes.
8. **Bounded, owned teardown on the control path too.** On control-call timeout, reap the child
   with a bounded `wait` and never leave a `systemctl` client unreaped; never `p.kill()` the
   `systemd-run` client as a substitute for stopping the unit through the owned-unit path
   (`capture_unit:387-389` already warns about precisely this).

**Concrete refactor:** extract `capture_unit`'s reader (lines 356-379) into a single
`bounded_read(proc, ceiling, budget, acc)` helper and have **both** `bounded_control` and
`capture_unit` call it. The correct implementation already exists in the bundle; the defect is
that it is used on the payload path and not on the control path. This also removes the duplicated
`64*MIB`/`160*MIB` literals (L1) and the mis-ordered size check (L3) as a side effect, collapsing
three findings into one change.

---

## B8 — prevention vs. attempt observation (operator request)

**The distinction must be stated as two separate claims and never collapsed.** The draft's B8 and
§5a already refuse to conflate them ("RO kernel denial is not by itself an audit of every
attempted write … must not be claimed from hash identity"); this section records what each side
may and may not assert, and what an acceptable proposal looks like.

**Claimable — kernel prevention that no write SUCCEEDED.** Mechanisms, all verifiable from
outside or by bounded inside evidence: the closure is bind-mounted read-only
(`controller.py:214`), `ProtectSystem=strict`, the sealed tree is root:root with F0-normalised
0444/0555 modes and zero writable non-symlinks and zero setuid/setgid (F0 record; I verified the
top-level ownership and modes directly), the payload has uid/gid 1002 with
`CapEff/Prm/Bnd/Inh/Amb` all zero and `NoNewPrivs=1` (so no `CAP_DAC_OVERRIDE` path), and
`RestrictSUIDSGID` plus `NoNewPrivileges` are set. Evidence: `mountinfo` showing `ro` on the
closure mount (an assertion R1 says must become mandatory), the effective-property record from
outside, the post-drop credential guard, and before/after closure-manifest equality against the
sealed F0 pin `91d0d313…`. **Permitted claim:** "no write to the sealed closure succeeded; its
content, modes, links and owners are unchanged."

**NOT claimable — that every attempted write was observed.** Manifest equality is silent about a
syscall that returned `EROFS`/`EACCES`; so is a read-only mount. There is no bounded, in-scope
mechanism in this design that sees every `open(O_WRONLY)`, `unlink`, `rename`, `chmod` or
`utimensat` the payload attempted against that tree. **Required wording:** "no successful write;
attempted writes not exhaustively observed." The two sentences must stay adjacent and must never
be merged into "no writes". Any *observed* attempt (an EROFS/EACCES surfaced in captured output)
remains a STOP, as §5a says — observing some attempts is useful and must not be upgraded into a
claim of observing all of them.

**Acceptable proposal shape — controlled canaries only.** A positive control for the *barrier*,
not an audit of the payload: root provisions a separate, identically-mounted **canary** path
inside the exact-owned canary unit (never inside, and never touching, the real sealed closure),
containing only synthetic root-owned 0444 files; an owned uid-1002 canary payload attempts the
specific write operations of interest against *that* path and records the resulting errno. That
demonstrates the mount really does return EROFS for those syscalls on this kernel and property
composition, which is what the barrier claim actually rests on. It bounds cleanly: it reuses the
canary unit's existing MemoryMax=128M / TasksMax=16 / CPUQuota=10% / 4 MiB mount envelope and the
same original aggregate deadline, and its output counts against the same 160 MiB log total.

**Explicitly out of scope, and must not be proposed:** modifying any real file in the sealed
closure or the sealed Node tree (that destroys the artifact the claim is about); enabling
`auditd`, `fanotify`, `inotify` at tree scope, eBPF or any other **new or system-wide tracer**
(unbounded output, host-wide blast radius, and a daemon/audit configuration change that is not
authorised); and wrapping the compiler in `ptrace`, `seccomp-notify` or an `LD_PRELOAD` shim
(unbounded, defeats the static-binary case entirely since the native compiler is a static Go
ELF, and it would make the controller's own machinery part of the thing under test).

**If the qualifier ever makes exhaustive attempt evidence binding**, that is a scope change
requiring its own go and its own containment review. It is not something the stage-1 adapter can
grow into, and B8 should say so.

---

## B1-B13 status after this review (kept visible)

All thirteen remain open and visible. "Confirmed" below means I independently checked the
blocker's own statement and found it accurate; it does not mean resolved.

| B | Subject | Status after review |
|---|---|---|
| B1 | Authority/installation absent | **Open, confirmed.** Verified no `/srv/ci-fixtures/abdi7-runner-*` exists, so the "fresh runner" requirement is still satisfiable |
| B2 | Session adapter incomplete | **Open, confirmed — and must be split.** The absent closure/Node *integrity check* (H2) is a distinct claim from absent orchestration. See R2 for the required shape |
| B3 | Containment adapter incomplete | **Open, confirmed, one clause downgraded.** The `/var/run` alias is a verified fact, not an unknown (M5). See R1 — this is the highest refusal-decay risk in the bundle |
| B4 | Effective-state adapter incomplete | **Open, confirmed.** Interacts with R6: wiring it is what first exposes `classify`'s success branch |
| B5 | All-error teardown adapter incomplete | **Open, confirmed, understated.** `stop_owned` has exactly one call site (M3, M4); there is no normal-path or exception-path teardown at all |
| B6 | Bounded control output incomplete | **Open, confirmed.** Design requirements specified above. The only gap that is functional-but-unsafe rather than refusing |
| B7 | Seals not independently reverified | **Open, confirmed.** `/root/abdi7-f0-20261031` Permission denied for me too; no bypass attempted. I did verify sealed top-level ownership/modes and both tsc hashes directly |
| B8 | Exhaustive attempted-write detection | **Open, confirmed.** Prevention/observation split and acceptable canary shape specified above |
| B9 | Declaration consumer deferred | **Open, confirmed.** Correctly deferred, not an omitted pass |
| B10 | Reconstruction/acquisition | **Open, confirmed.** The plan itself met every regime-(b) requirement I checked; the blockers are the unresolved npm pin, cache-import adapter and network allowlist |
| B11 | Nothing executed | **Open, confirmed.** This review adds no runtime evidence. Does **not** cover the native Go compiler as an execution surface — see H3 |
| B12 | Literal zero git writes UNVERIFIED | **Open, confirmed, correctly scoped.** Kept as "possible automatic index refresh / zero metadata writes UNVERIFIED", properly distinct from the separately verified clean source with no commits, which I re-confirmed |
| B13 | Progress cadence deviation | **Open, confirmed. Timing disclosure only** — 5m15s between automatic notes, 15 s over, not backdated. No bearing on the technical content |
| **B14** | *proposed* — root-side git surface | **New.** H1 + M1: local config not neutralised; dubious-ownership abort |
| **B15** | *proposed* — closure/Node integrity check absent | **New.** H2, split out of B2 |
| **B16** | *proposed* — native compiler execution surface | **New.** H3: unpinned 24 MB static Go ELF; "exactly one runtime" uncorrected |
| **B17** | *proposed* — no teardown call site | **New.** M4, split out of B5 |

## Verification Gates

**No `orgasmic dispatch gate` was run and no gate receipt is claimed or reused.** This dispatch
is a static read-only review; the brief forbids executing anything from the bundle, any
interpreter or syntax parser over it, node/npm/npx/bun/tsc, any build/test/install,
systemd-run/unshare/setpriv/catatonit/sudo, network access, git writes, and reads of
credentials. All of those were observed. Exactly these read-only checks were performed:

| Check | Command | Outcome |
|---|---|---|
| Commit identity | `git rev-parse HEAD` | `f8af03a8…ca20`, matches brief |
| Bundle integrity | `sha256sum -c SHA256SUMS` | 9/9 OK |
| Input pins (8 files) | `sha256sum` | all 8 MATCH the brief |
| REPORT.md hash table | `sha256sum` of all 9 vs table | consistent |
| Lock claims | `jq` over sealed `package-lock.json` | 101/100/v3/47/56, all HTTPS+sha512, 2 install scripts — all confirmed |
| TSV fidelity | `jq` regeneration + `diff`, plus 12 per-key re-checks | **byte-identical, 100/100** |
| Compiler identity | `jq`, `ls`, `file`, `sha256sum`, `cat` of launcher | typescript 7.0.2; 24,101,026-byte go1.26.4 static ELF; both §5b hashes match |
| `/var/run` alias | `ls -ld /var/run /run` | symlink → `/run` confirmed |
| Repo-local config mode | `ls -la .git/config`, `git rev-parse --git-common-dir` | 0664 uid/gid 1002 |
| `.gitattributes` in candidate | `git ls-tree -r --name-only f8af03a8…` | none present |
| `dist`/`node_modules` in tree | `git ls-tree --name-only` | neither present |
| Sealed path ownership | `ls -ld /srv/ci-fixtures{,/abdi7-closure-20261031{,/node_modules}}` | root:root, non-worker-writable |
| Runner slot freshness | `ls -ld /srv/ci-fixtures/abdi7-runner-*` | does not exist — "fresh" is satisfiable |
| Marker-minting paths | `grep` for writes across all 4 scripts | none; writes enumerated in item 2 |
| Forbidden tools in argv | `grep -E 'npm\|npx\|bun\|sudo'` | none live |
| Template vs code drift | Python AST-free regex compare of 28 properties | 28/28 identical |
| Tool versions | `git --version`, `systemctl --version`, `nproc` | git 2.43.0, systemd 255.4-1ubuntu8.18, 16 CPUs |
| Final tree state | guarded `status --porcelain=v1`, `diff --exit-code HEAD --` | clean, rc 0 |

Worktree left exactly as found: no commits, no edits, no new files inside it. Report written to
`$ORGASMIC_EVIDENCE_DIR/report.md`. Five progress notes recorded via `orgasmic tx record` at
10:31, 10:35, 10:37, 10:41 and finalize — within the five-minute cadence.

## Unmet criteria / test gaps

Against the task's own acceptance criteria: drafts-only with no execution and no commit —
**met** (verified). Facts only from cited verified inputs with unknowns named — **met**; every
factual assertion I spot-checked held. A candidate slot that refuses until resolved — **met**,
five independent refusals plus an unconditional `payload_preflight` refusal. One original
aggregate deadline — **met**, with the arithmetic caveat in L5. Private manifests and artifact
handoff — **specified, not implemented** (B2, plus H2). Exact privilege and resource boundaries
— **substantially met**, with H1, M5, M6, M7 outstanding. A plan-only regime-(b) closure plan —
**met**.

Gaps that no evidence in or outside the bundle closes, beyond B1-B13 as amended:
- Nothing in the bundle has been executed, parsed or syntax-checked (B11), and this review adds
  no runtime evidence. My findings are static reasoning plus read-only host facts.
- The systemd property and mount composition as a whole is untested. The canary record covers a
  *different*, simpler chain with full root caps; the reduced five-cap bounding set, the four-way
  TemporaryFileSystem assignment, PrivateTmp layered with explicit `/tmp` and `/var/tmp` binds,
  `/dev/shm`, and the nested RW-under-RO `dist` bind are all unproven together.
- `--pipe` plus `StandardInput=null` (M7) means even the capture path is unproven, so a first
  run could produce no output and be indistinguishable from a quiet failure.
- `/root/abdi7-f0-20261031` is unreadable to this worker (as it was to the implementer), so the
  F0 sealed manifests, the mode-delta receipt and the owner/mode checks remain operator facts.
  I verified the sealed trees' top-level ownership and modes and the two tsc hashes directly,
  but did not and could not regenerate the 7,332-entry sealed manifest (that needs a helper).
- The 100-vs-55 package count and the original npm version and cache warmth remain unexplained
  in the F0 record; the drafts correctly preserve rather than repair these.
- Exhaustive attempted-write detection against the RO closure (B8) has no mechanism.

## Residual risk

No present risk from the bundle itself: it is twelve 0444 files, nothing executes, the
controller refuses five ways before reaching any launch, and the payload preflight refuses
unconditionally. The risk is in adoption. If these drafts were advanced toward a go without
items 1-4 above, the two that could bite are (a) a root-side git operation over a
worker-writable repository whose local-config surface is unmitigated, and (b) a run that
proceeds on sealed closure bytes nobody measured, since the only hash comparison is between the
marker's JSON and the controller's own constants. Both fail closed today — one on git's
ownership check, the other by never being reached — which is why they are HIGH for design
purposes rather than active exposure. Beyond that: the teardown path is specified far better
than it is implemented, so the most likely first-run outcome is an `INCONCLUSIVE` with a unit
that needed manual cleanup; and the aggregate budget makes `focused`, the stage carrying the
actual question, the structurally first casualty. The root catatonit boundary and the shared
user/uts/cgroup namespaces remain intentional, disclosed trust decisions for the qualifier, not
defects. Every hold the drafts enumerate — D's full qualification, #931/B, publication,
retention, no-private-data, no-live, no-native-2b, I6, T2/.3/.4 — is untouched by this review.

## Fix directions

See **Required changes** above, ordered 1-9. The shortest path to a reviewable v3 is items 1-4:
they are the only ones that change the security or correctness story rather than tightening an
already-correct one. Items 5-7 are mechanical. Item 8 is a qualifier decision, not an
engineering one. Item 9 is bookkeeping, but it is the item that keeps the blocker inventory
trustworthy — and the inventory's honesty is, on the evidence of this bundle, its single most
valuable property.
