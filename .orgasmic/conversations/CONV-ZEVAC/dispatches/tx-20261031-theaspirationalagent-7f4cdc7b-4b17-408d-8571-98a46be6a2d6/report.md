# CONV-ZEVAC — independent READ-ONLY re-review of the complete XGHH2 round-2 bundle

Operator Tarn; qualifier Soma 1793444005. Scope: review the complete DX9KM v2
runner draft bundle before any canary, acquisition or package stage.

**This is not a go, not a gate PASS, and not a readiness statement. No authority
is granted by this document.** Nothing in the bundle was executed, imported,
parsed, `py_compile`d or `bash -n`'d. No `systemd-run`/`unshare`/`setpriv`/
`catatonit`/`sudo`, no node/npm/tsc, no network, no git writes, no writes outside
`$ORGASMIC_EVIDENCE_DIR`. Drafts were consumed strictly as DATA.

## Binding (also progress.log line 1)

| Fact | Value | Result |
|---|---|---|
| HEAD | `f8af03a852c85daf9bb8079937b994fe5419ca20` | matches brief |
| `cd .../XGHH2-DRAFTS-r2 && sha256sum -c SHA256SUMS` | 21 files | **21/21 OK, 0 FAILED** |
| `SHA256SUMS` itself | `e5addcb8f45045577b009a932fd1eed2bbc5c373ead431e78e0468134d8278e3` | matches brief |
| `XGHH2-DRAFTS-v1-REVIEW1.md` | `c43561b7bc8f391d59fc0fff2e8c5565608e5405ad1ae1ada9d443cdd31a967b` | matches brief |
| v1 `SHA256SUMS` | `5322290ce531352d39c287ff779a0374a52af9a18dab628938ec79ebe89f0cd6` | matches brief |
| closure | `91d0d3134dd3321a39bf9b74344b100c0217b065a1df0a9024f11fc6f98b58e7` | read ONLY from recorded metadata: `ABDI7-F0-SEAL-RECORD.md:23`, `ABDI7-OPERATOR-RECEIPT-B7-1.md:8,13`. **No tree re-hashed as root** (probes ran as uid 1002, stat-only). |

Read in full as data: `REPORT.md`, `FINDINGS-DISPOSITION.md`, `BLUEPRINT-v3.md`
(490 l), `controller.py` (1379 l, every line), `unit-wrapper.sh`,
`producer-build.sh`, `producer-test.sh`, `closure-reconstruction-plan.md`,
`input-verification.md`, `observed-executable-SHA256SUMS`, and all 11 diffs.

---

## Verdict

**The bundle CANNOT yet serve as the basis for a canary-only next step. One more
drafting round is required.** The blocker is not the (correctly) disclosed U1–U9
absences — it is **NEW-H1**, a one-condition defect that makes the H2 remediation
refuse unconditionally against the *actual pinned closure*. I proved both halves
of this independently: a stat-only probe finds the two hardlinked files the
`st_nlink==1` guard rejects, and a second probe reproducing the draft's format
*without* that guard regenerates both sealed digests byte-exactly. A canary that
exercises the H2 rehash path would therefore refuse on every launch for a reason
unrelated to the property under test, producing no usable signal — while the fix
is a single deleted condition.

Structurally the round is strong and the self-assessment is honest: the typed
registry design genuinely admits **no path to PASS without positive evidence**
(verified below), `REVIEW_RELEASED` is gone, there is **no marker-creation path
anywhere** (full write audit), U1–U9 really are typed refusals, and the bundle's
"42 OPEN, zero resolved" claim is accurate rather than understated. The round-2
disposition table does not overclaim on any of the 42 items.

Minimal remaining set before a canary-only step (**3 items**):

1. **NEW-H1** — delete the `st_nlink==1` condition in `tree_manifest`'s closure
   branch (or justify refusing, then re-seal). My probe proves this is the *only*
   divergence from the F0 format: without the guard the draft reproduces both
   pinned digests exactly; with it, every launch refuses. Non-negotiable.
2. **NEW-M1** — remove the duplicated unit-property authority: derive
   `BASE_PROPERTIES` resource literals from `BOUNDS`, which `verify_marker`
   already binds. This is the same defect class L6 fixed by deleting
   `unit-template.json`, reintroduced one layer down.
3. **NEW-M2** — specify, in the draft, which source `UnitKey.PRODUCER` must
   read. `/out/producer.exit` is uid-1002-writable; leaving the choice to the
   absent driver re-admits exactly the writable sequencing token L4 removed.

All three are drafting/contract work, not platform adapters. Everything else can
legitimately remain in U1–U9 for the canary step. NEW-H2 is **retracted** (see
below). Deadline enforcement needs no change — it is verified sound below.

---

## Findings

### HIGH

**NEW-H1 (correctness; H2-fatal) — `controller.py:281,289`: the sealed closure
contains hardlinked files, so `actual_inputs()` refuses on every launch.**

`tree_manifest` accepts a regular file only when `st_nlink==1`:

```
281:            elif stat.S_ISREG(s.st_mode) and s.st_nlink==1:
...
289:            else: raise Refusal('special/hardlinked tree entry')
```

The actual pinned closure has two hardlinked regular files, same inode:

```
$ find /srv/ci-fixtures/abdi7-closure-20261031/node_modules -type f -links +1 \
       -printf '%n links  %i inode  %s bytes  %p\n'
2 links  30160096 inode  11427952 bytes  .../node_modules/esbuild/bin/esbuild
2 links  30160096 inode  11427952 bytes  .../node_modules/@esbuild/linux-x64/bin/esbuild
```

`actual_inputs` (`controller.py:504`) calls
`tree_manifest(SEALED_CLOSURE,budget,closure_format=True)` as its first act, and
`capture_unit` calls `actual_inputs` at `969` (before) and `988` (after) for
*every* unit.
Failure scenario: the first stage-1 launch raises
`Refusal('special/hardlinked tree entry')` before any unit is created; every
retry does the same; `UnitKey.BEFORE/AFTER` can never be measured.

**Conclusive proof (reviewer probe, read-only, uid 1002, no draft imported).** I
wrote my own 25-line probe (`/tmp/zevac-rehash-probe.py`) mirroring the shape of
`tree_manifest` closure mode + `digest_file` + `canonical()` — same membership
rule (files + symlinks, dirs excluded), same `{sha256,mode}` / `{symlink,mode}`
records, same `json.dumps(sort_keys=True,indent=2)+'\n'` — but **without** the
`st_nlink==1` guard. It reproduces both pins exactly:

```
/srv/ci-fixtures/abdi7-closure-20261031/node_modules
  entries=7332  wall=0.27s  digest=91d0d3134dd3321a39bf9b74344b100c0217b065a1df0a9024f11fc6f98b58e7
/srv/ci-fixtures/node-v22.12.0-linux-x64
  entries=4885  wall=0.28s  digest=e02b14b595849fd8b5ccc751cf8432e4ac05e21e681bb7507addb956e9708b49
```

Both match `CLOSURE_SHA` (`controller.py:31`) and `NODE_TREE_SHA` (`32`) and both
entry counts match `ABDI7-F0-SEAL-RECORD.md`. So the `st_nlink==1` condition is
**the single and only divergence** between the draft and the F0 format: remove it
and H2 measures correctly; keep it and H2 refuses on every launch. Corroborating
provenance: the F0 record states "esbuild's install script executed at generation
time, and its outputs are part of the closure" — the hardlink pair is an expected
artifact of that install, and F0's `closure-manifest.py` hashed both paths.
Fail-closed, so not a safety risk; but H2 is inert as drafted.

**NEW-H2 — RETRACTED by my own probe. Reported here for traceability.**

I initially raised that `SealReceipt` (`controller.py:493-500`) requires
byte-exact reproduction of `CLOSURE_SHA`/`NODE_TREE_SHA` while the producing tool
`closure-manifest.py` (`ABDI7-F0-SEAL-RECORD.md`: sha256 `c207923062ca…`) is
unreadable by the worker (`ls /root/closure-manifest.py` → Permission denied) and
its schema appears nowhere in the bundle (`BLUEPRINT-v3.md:209` says only "the F0
canonical format"). **The probe quoted under NEW-H1 disproves the concern:** the
draft's documented format reproduces both pins exactly, so the equality
requirement is satisfiable and `BLUEPRINT-v3.md:209` is accurate. The residual is
documentation only — the bundle asserts format fidelity without demonstrating it,
and a future reviewer without this probe cannot confirm it. Folded into
Fix Directions as a cheap read-only receipt to add, **not** a blocker.

### MEDIUM

**NEW-M1 (correctness/drift) — `controller.py:535-552` vs `43-53`: unit resource
properties are hardcoded literals, not derived from the marker-bound `BOUNDS`.**

`BASE_PROPERTIES` (`535-552`) hardcodes `size=16M`, `size=64M`, `MemoryMax=16384M`,
`MemorySwapMax=0`, `TasksMax=256`, `CPUQuota=400%`, `TimeoutStopSec=5s`, while
`BOUNDS` declares `work_MiB=16, run_MiB=16, shm_MiB=64, memory_MiB=16384,
swap_bytes=0, tasks=256, cpu_percent=400, grace_seconds=5` — and grep confirms
**none of those eight keys is ever read**. `verify_marker` (`controller.py:468`)
requires `data['bounds']==dict(BOUNDS)`. Failure scenario: an operator marker
that lowers `memory_MiB` to 4096 passes `verify_marker` unchanged and the unit is
still created with `MemoryMax=16384M`; the marker's resource envelope is
cosmetic. Only `RuntimeMaxSec` is actually derived (`controller.py:745`). This is
the duplicate-authority class L6 removed at the `unit-template.json` layer.

**NEW-M2 (security/correctness) — `unit-wrapper.sh:34` + `controller.py:1007`:
`UnitKey.PRODUCER`'s provenance is unspecified and has a payload-writable
candidate source.**

The wrapper writes `printf '%s\n' "$producer" > /out/producer.exit`, and `/out`
is bound rw from a 1002:1002 0755 leaf (`controller.py:728`). `unit_receipt`
takes `producer_exit` as a caller-supplied parameter; the absent `stage_driver`
decides where it comes from. Failure scenario: a driver that reads
`/out/producer.exit` lets the payload assert its own success key — the exact
writable sequencing token L4 removed as `/out/consumer-verified`. The safe source
(systemd `ExecMainStatus`, already captured as `FinalizerReceipt.main_status`,
`controller.py:838-841`) makes `UnitKey.PRODUCER` redundant with `UnitKey.RESULT`.
The draft never states which is normative; the wrapper comment labels the file
"DATA from uid1002" but does not forbid its use.

**NEW-M3 (correctness) — `controller.py:848-851`: the finalizer's final survivor
wait is bounded only by the whole remaining aggregate.**

```
848:            while self.ctx.budget.remaining()>BOUNDS['capture_reserve']:
849:                final=owned_members(cg,self.ownership.intent)
850:                if not final: break
851:                time.sleep(.05)
```

`_stop`'s grace is correctly capped at `grace_seconds` (`controller.py:898`), but
this post-kill loop has no per-finalizer slice. Failure scenario: one owned task
stuck in uninterruptible sleep after `SIGKILL` spins this loop until
`remaining()<=15s`; `main()`'s `finally` then runs the remaining finalizers
(`controller.py:1353`) and `teardown_receipt` (`controller.py:1282`) inside that
15s, so `stop`/`kill` requests for the *other* owned units are issued (or
`Deadline`) in a window far smaller than `teardown_reserve=45`. Outcome is typed
UNKNOWN, not a false PASS, but actual cleanup of later units is degraded.

**NEW-M4 (correctness, latent) — `controller.py:569-572`: `mint_intent` builds a
unit name its own validator always rejects.**

```
571:    i=UnitIntent('abdi7-'+nonce+'-'+stage,nonce,'ABDI7 intent '+nonce,...)
```
`UnitIntent.__post_init__` (`controller.py:526-531`) requires
`abdi7-[0-9a-f]{32}-(source|types|build|focused|canary)\.service`. For any plain
`Stage` value (`Stage` is a `str` Enum, so `'source'`) the name lacks `.service`
and `UnitIntent` raises. Failure scenario: a driver calling
`mint_intent(Stage.SOURCE,…)` refuses before minting; and `--unit=` without
`.service` would also break `reconcile`'s `s['Id']!=intent.name` check
(`controller.py:588`). No caller exists today, so this is latent.

**NEW-M5 (correctness, scope) — the entire unit-launch/receipt path is
unreachable dead code.** `mint_intent` (569), `launch_argv` (717),
`capture_unit` (944), `unit_receipt` (995), `copy_tree_data` (682),
`SessionFS.stage_dirs` (644), `Budget.times` (190) and
`synthetic_negative_assertions` (1085) have **no caller** in `controller.py`;
`PLATFORM.stage_driver is None` (`controller.py:942`) so `session_adapter`
refuses at `controller.py:1321`. `PlatformAdapters.repository_ingress`
(`controller.py:924`) is never consulted at all. This is consistent with "42
OPEN", but it means items 1–8 of the brief can only be judged as *drafted text*;
no amount of static review can retire them, and NEW-H1/H2/M4 are the kind of
defect that only surfaces when the path is wired.

**NEW-M6 (correctness) — `controller.py:1176-1178`: `RLIMIT_FSIZE` is lowered
irreversibly and converts a cap breach into death by signal, not a Refusal.**
`resource.setrlimit(RLIMIT_FSIZE,(limit,limit))` sets soft **and hard** to 64 MiB
and is never restored. Every later write in the same process — archive member
extraction (`controller.py:1210`), `/out/source-manifest.json` (1235),
`/out/archive.sha256` (1236) — is now subject to it, and exceeding `RLIMIT_FSIZE`
raises `SIGXFSZ`, whose default action terminates the process. Failure scenario:
a >64 MiB candidate blob exits 128+25 instead of the typed `REFUSED: … 78`
contract at `controller.py:1372-1379`; the refusal decays into an untyped death.

### LOW

**NEW-L1 — several procfs reads bypass the shared bounded reader and
`ByteAccount`.** `mount_rows` (`controller.py:616`), `pid_identity` (765-770),
`owned_members`' `cgroup.procs` (780), `credentials_now` (1022) and
`payload_preflight`'s `mountinfo` (1066) all use unbounded `read_text()` and
allocate before any cap; `payload_preflight` checks its cap only *after* the read
(1067-1080). Values are small in practice, so this is a completeness gap against
L1/B6's "cap BEFORE retaining", not a live exposure.

**NEW-L2 — `controller.py:869`: `proven`'s third conjunct is tautological.**
`(cg4 is not None or s4.get('LoadState')=='not-found')` is true in both branches
`reconcile` can return, so `proven == (not final and client_reaped)`. Harmless
(ambiguity already raises inside `reconcile`), but the adjacent comment claims a
check that contributes nothing.

**NEW-L3 — `controller.py:739-743`: the bind inventory check does not assert
`actual_ro ∩ actual_rw == ∅`.** The comparison uses the union, and the role check
resolves an overlapping path to `WRITABLE`. No current stage produces an overlap,
and `root_locked`'s writable branch (`controller.py:245-250`) would still reject
an immutable path, so this is defence-in-depth only.

**NEW-L4 — `observed-executable-SHA256SUMS` covers 17 of the 22 `BINARY_SHA`
pins; M8's wording overclaims.** Missing: `catatonit`, `unshare`, `setpriv`,
`systemd-run`, sealed `bin/node`. `input-verification.md` is honest ("Node/setup
binary pins are inherited operator pins") and `BLUEPRINT-v3.md:245` says "the
four operator-pinned setup binaries" (it is five — Node is the fifth), but
FINDINGS-DISPOSITION M8 says the inventory pins "compiler/**setup**/control
binaries". **I closed this gap independently:** read-only `sha256sum` of all five
matches `controller.py:296-317` byte-for-byte, and `sha256sum -c
observed-executable-SHA256SUMS` is 17/17 OK. Documentation nit only.

**NEW-L5 — `controller.py:1236,1239`: `digest_file(archive,…)` is computed twice**
(once for `/out/archive.sha256`, once for the receipt), re-hashing up to 64 MiB
inside an already over-subscribed budget.

**NEW-L6 — `Budget.times` raises `KeyError` for `SEAL`/`CAPTURE`/`TEARDOWN`**
(`controller.py:192`: `BOUNDS[stage.value+'_ceiling']`; no such keys at 53).
Caught at `controller.py:1377` as an untyped `KeyError`, not a `Refusal`. Latent
(no caller).

**NEW-L7 — candidate-inventory headroom is 2.1x, and the binding cap is not the
documented one.** `archive_source` reads `git ls-tree` through
`bounded_control`'s `control_call_bytes=131072`, not `tree_entries=20000`.
Measured: `git ls-tree -rz --full-tree f8af03a8 | wc -c` = **61107** bytes / 718
blobs. Fits, but a tree ~2.1x larger refuses with `control-call overflow`, a
message that does not name the real limit. `records.get('package.json')` =
`02744ce1…` matches `PACKAGE_BLOB`; 0 `.gitattributes` at any depth. Not
currently a defect.

### Explicitly checked and found sound (no finding)

- **Brief item 6 — no path to PASS without positive evidence. CONFIRMED.**
  `Evidence.__bool__`/`Proof.__bool__` raise (`controller.py:93,107`);
  `observed()` refuses a non-`bool` (121); `Proof.__post_init__` requires
  `frozenset(keys)==frozenset(enum_type)` **and** every entry `POSITIVE` **and**
  matching binding (96-107), so deleting a check shrinks `_entries` and
  `Registry.seal` (118) raises; `require_proof` reconstructs (129-134);
  `StageReceipt` (136), `StageResults.accept` (1272) and
  `EvidencedSession.__post_init__` (146-156) each **revalidate independently**, so
  deleting any one validator still refuses. `SurvivorCell` is write-once (161);
  `SurvivorSnapshot` rejects POSITIVE-with-identities (157). `PLATFORM =
  PlatformAdapters()` is empty and non-permissive: `capabilities` (927) emits
  `unavailable` for each of the 9 fixed `Capability` members, so `seal()` raises.
  `unit_receipt` hardcodes `BEFORE/AFTER/INTENT = False` (1001-1003), making
  every unit receipt refuse by construction. I found **no permissive default and
  no refusal that decays** in the registry layer. (NEW-M6 is a refusal decaying
  to a signal death, but outside the registry.)
- **Brief item 7 — release binding. CONFIRMED.** No `REVIEW_RELEASED`
  (removed per `diffs/controller.py.diff`). `verify_marker` (448) requires
  `hex_pin(REVIEWED_PLAN_SHA256)` and `hex_pin(OPERATOR_GO_SHA256)`, both `None`
  (34-35) → refuses; marker path restricted to `/root/abdi7-go/*.json` or
  `<runner>/go/*.json`, root-owned 0444, hash-pinned; the plan pin is compared to
  the **actual** `BLUEPRINT-v3.md` bytes (473) and `reviewed_runner_sha256` comes
  from the marker, not from source (476-477). A full `O_CREAT`/`mkdir`/
  `write_text`/`write_bytes` audit shows **no write to any marker path**.
- **Brief item 1 — H1 root-Git removal. Sound at code level.** The only git
  invocations are `GIT_UID1002` inside `archive_source`, which asserts
  `geteuid()==1002 and getegid()==1002` first (1152); `bounded_control` carries an
  independent belt-and-braces `root Git prohibited` guard (411-412). Root's only
  contact with `/repo` is `root_locked`'s `lstat` ancestry walk (`731`, via `root_locked`). Residual is
  U1 (ingress trust/`commondir`/`include.path`), correctly disclosed.
- **Brief item 3 — H3 native-tsc pin + retraction. Sound.** Both compiler paths
  are in `BINARY_SHA` (315-317) and re-measured per launch (510-512), and both are
  also inside the closure manifest. "Exactly one runtime" is retracted in
  `BLUEPRINT-v3.md:§2.3` and `FINDINGS-DISPOSITION` H3; I found no surviving
  "exactly one runtime" claim anywhere in the bundle.
- **Brief item 4 — finalizer call sites.** `OwnedFinalizer` is registered before
  the launch checks (945-946) and invoked from `capture_unit`'s `finally` (`985`),
  `session_adapter`'s `finally` (`1331`) and `main`'s `finally` (`1353`), idempotently
  (806). `creation_attempted` is set before `Popen` (`974-975`); ambiguity raises
  `'DO NOT SIGNAL'` (591) with **no relaunch** anywhere. Signalling is confined to
  a pidfd `SIGTERM` to the re-verified catatonit reaper (883-897) and
  `systemctl kill --kill-whom=all` on the exact owned unit (901-903) — no `pkill`,
  no name/user-wide selection, **no signal outside the owned cgroup**;
  `owned_members` refuses a member whose cgroup escaped (786-787). Caveat NEW-M3.
- **Brief item 5 — bounded capture.** `bounded_read` (358) is genuinely shared by
  `bounded_control`, `capture_unit` and `archive_source`'s stderr; it reads a fixed
  `io_chunk_bytes`, computes `acc.allowance(...)` **before** extending/writing
  (387-392), drains after the cap, and `bounded_control` refuses overflow **before
  any decode** (424-426). Caveat NEW-L1.
- **Brief item 8 — U1–U9 are typed refusals.** Verified individually: U1 →
  `launch_argv:730` Refusal + `Capability.REPOSITORY` UNKNOWN; U2 → `PROVISION`
  UNKNOWN; U3 → `canary_assertions`/`ctx.canary_teardown` None → UNKNOWN
  (1073-1077, 1295-1298); U4 → `assert_mounts` None → UNKNOWN per named key
  (1069-1077); U5 → `normalize_effective` None → Refusal in `tick` (954-956);
  U6 → `stage_driver` None → Refusal (`1321`) plus NEGATIVE input/intent (1001);
  U7 → `retain_receipts` None → UNKNOWN (1300); U8 → `TOOLCHAIN` UNKNOWN;
  U9 → unreaped client → `errors` → state UNKNOWN (875-880). **No silent no-op
  found.**
- **Regression check vs v1** (`diffs/`): `/var/run:ro,size=16M` and
  `StandardInput=null` are gone from both the properties and the deleted
  `unit-template.json`; `INTEGRATION_BLOCKERS` strings replaced by the
  `Capability` enum; `safe.directory=/repo` is exact, not a wildcard and not
  root-scoped; `/out/consumer-verified` is absent from the whole bundle. I found
  **no REGRESSED item** among the 42.

---

## Brief item 9 — the 2100 s aggregate (qualifier call; reported, NOT changed)

Per the Tarn addendum (qualifier Soma 1793446521): **the 2100 s aggregate must not
be raised, and I propose no increase.** The addendum's condition is that nominal
ceilings may exceed the aggregate only if remaining-time enforcement genuinely
stops or refuses at the ORIGINAL deadline. I verified that condition holds.

### (a) The aggregate is minted once and never renewed

`Budget.__init__` (`controller.py:179-180`) sets
`deadline_ns = monotonic_ns() + BOUNDS['aggregate_seconds']*10**9` **once**;
`main()` constructs the only `Budget()` (`1342`). `Budget.inherited`
(`181-186`) sets `deadline_ns=int(raw)` from the parent's absolute value and
`start_ns=None` — it **inherits, never re-mints** — and is the only other
constructor (`utility_main:1357`). Across all 1379 lines `deadline_ns` is
**assigned at exactly two sites, 180 and 185**, and read everywhere else; there
is no `+=`, no reset, no second `Budget()`. The value is pinned into the unit
argv and env (`758`, `760`), and `unit-wrapper.sh:24` refuses unless the env and
argv copies agree (`[[ ${ABDI7_DEADLINE_NS-} == "$deadline_ns" ]] || exit 78`),
so an inner process cannot be handed a renewed deadline silently. The preflight
also cross-checks it (`1049`).

### (b) Every step's effective bound is min(step ceiling, remaining original)

`Budget.times` (`190-197`) is the sole step-bound computation:

```
191:        self.require(BOUNDS['teardown_reserve']+BOUNDS['capture_reserve'])
192:        ceiling=BOUNDS[stage.value+'_ceiling']
193:        runtime=min(ceiling+15,int(self.remaining()-BOUNDS['teardown_reserve']-
194:                                  BOUNDS['capture_reserve']))
195:        inner=min(ceiling,runtime-BOUNDS['startup_margin']-BOUNDS['kill_after_seconds'])
196:        if runtime<BOUNDS['min_unit_seconds'] or inner<5: raise Deadline('DEADLINE: skip')
```

`remaining()` (`187`) is always measured against the original `deadline_ns`.
So `runtime = min(ceiling+15, remaining-60)` and
`inner = min(ceiling, runtime-15)`, i.e. **`inner ≤ min(step ceiling,
remaining original aggregate − 75 s)`**. The ceiling can only *lower* the bound,
never raise it above what the original aggregate still allows. `runtime` is then
the systemd-side hard bound `RuntimeMaxSec` (`745`) and `inner` the
`timeout --signal=TERM --kill-after=5s "${inner_seconds}s"` bound
(`unit-wrapper.sh:29`). `RuntimeRandomizedExtraSec=0` (`542`) removes the one
systemd-side source of extension.

Every other time-consuming site is likewise clamped to the original deadline, not
to a per-call allowance: `bounded_read`'s `limit=budget.deadline_ns-reserve` then
`min(limit,call_end_ns)` (`371-372`); `bounded_control`'s
`end=min(ctx.budget.deadline_ns, now+seconds)` (`420`); `_stop`'s grace
`min(now+grace_seconds, deadline_ns-capture_reserve)` (`898-899`); the finalizer
sweep `while remaining()>capture_reserve` (`848`). Plus 17 `budget.require(...)`
guard points across hashing, copying, archiving and extraction (`207`, `213`,
`262`, `413`, `438`, `570`, `626`, `659`, `677`, `690`, `696`, `705`, `1194`,
`1212`, `1222`, `1227`, `1319`).

### (c) Hitting the bound yields a stop/refusal — not extension, renewal or retry

`Deadline` is a subclass of `Refusal` (`81: class Deadline(Refusal): pass`), so
every deadline hit is a typed refusal and reaches the terminal handler
(`1372-1379`) as `REFUSED: Deadline: …` with `SystemExit(78)`.

- `require` raises at the boundary (`188-189`); `times` raises
  `Deadline('DEADLINE: skip')` rather than shortening below the floor (`196`).
- `bounded_read` sets `timed=True` and **breaks once** (`373-375`, comment
  "ONCE: caller's finally owns teardown, never repeated here"); `capture_unit`
  converts it to `error='DEADLINE'` (`980-981`), which forces
  `UnitKey.CAPTURE` NEGATIVE (`1007`) and therefore refuses the stage receipt.
- `bounded_control` refuses on `r.timed_out` (`427`); `archive_source` refuses on
  `rr.timed_out` (`1187`).
- `session_adapter`'s per-stage `ctx.budget.require(teardown_reserve)` (`1319`)
  raises into `problem` and the function ends with
  `raise Refusal('session incomplete: …')`. **A skipped stage produces no
  receipt, and `EvidencedSession` requires all seven (`146-156`)** — so a
  deadline can never be absorbed into success.
- A `Deadline` inside `OwnedFinalizer.finish` lands in `errors` → state
  `UNKNOWN` (`862-866`), never POSITIVE.

**I found no retry, no renewal, no extension and no `DEADLINE → retry` edge**:
no loop re-calls `times` for the same stage, and `session_adapter`'s stage loop
(`1316-1324`) is a single forward pass over `Stage` with no restart.

### (d) Does minimal work fit? No — and the enforcement truncates rather than extends

Nominal ceilings (`53`): `source 120 + types 600 + build 600 + focused 900 =
**2220 s** > aggregate 2100`, before `teardown_reserve 45 + capture_reserve 15`
and before per-unit `startup_margin 10`. Tracing `times()` on a nominal run:

| Stage | remaining at entry | `runtime` | `inner` | vs ceiling |
|---|---|---|---|---|
| source | 2100 | min(135, 2040) = 135 | 120 | full |
| types | ~1965 | min(615, 1905) = 615 | 600 | full |
| build | ~1350 | min(615, 1290) = 615 | 600 | full |
| focused | ~735 | min(915, **675**) = 675 | **660** | **truncated from 900** |

So `focused` is cut to ~660 s by `remaining-60`, not extended — the enforcement
behaves exactly as the addendum requires. The consequence is substantive:
`producer-test.sh` sets `--test-timeout=600000` (600 s per test), so a focused
suite needing more than ~660 s wall is TERM'd mid-run and, per
`BLUEPRINT-v3.md:§4`, `Result=timeout` is **ungraceful TIMEOUT/INCONCLUSIVE** —
not a failure that can be mistaken for success, but also not a pass. **A nominal
full stage-1 pass is therefore unreachable at 2100 s unless the focused suite
completes inside ~660 s.** I report this as the addendum directs and propose no
default increase; whether to re-scope the focused set, lower a ceiling, or accept
a truncated focused window is the qualifier's call.

### (e) Correction to my own earlier concern: rehash cost is NOT a material consumer

I had flagged the 8 `actual_inputs` passes as an unquantified new consumer of the
same 2100 s. My probe measures the real cost: **0.27 s (closure) + 0.28 s (Node)
= ~0.55 s per pass warm**, so ~4–5 s for all 8 passes, plus 22 `digest_file`
calls per pass. Against a 2100 s aggregate that is noise. Only the first pass
pays cold-cache I/O for 125.5 MB + 184.3 MB. The budget problem is purely the
2220-vs-2100 ceiling arithmetic in (d), not the H2 rehash.

## Per-item verdicts (42)

Verdicts describe **whether the drafted code does what the disposition claims**.
`RESOLVED-IN-DRAFT` never means closed, approved, executed or ready — every item
remains OPEN for the owner, exactly as `FINDINGS-DISPOSITION.md` states. Line
numbers are `controller.py` unless noted.

**Strict ledger rule applied (Tarn addendum, qualifier Soma 1793446521):** a typed
refusal or typed UNKNOWN for any of U1–U9 is **not** an implemented adapter, so
any item whose disposition rests on one is recorded **PARTIAL or OPEN, never
RESOLVED-IN-DRAFT**. This downgraded eight rows I had first scored
RESOLVED-IN-DRAFT — H1, H3, M1, M4, M7, M8, R1, R3 — and made B14 plain OPEN.
`RESOLVED-IN-DRAFT` now survives only where the change is self-contained code
with no U-adapter dependency.

### H/M/L/R (25)

| Item | Verdict | Evidence |
|---|---|---|
| H1 | **PARTIAL** (U1) | Only git callers are `GIT_UID1002` in `archive_source`, gated `geteuid/getegid==1002` at `1152`; second guard at `411-412`; root touches `/repo` only via `lstat` at `734`. U1 ingress trust absent, so NOT resolved under the strict rule. |
| H2 | **PARTIAL — blocked by NEW-H1/NEW-H2** | `actual_inputs:504` does measure closure+Node+runner+22 binaries+binds before & after each unit (`969`, `990-993`), with `root_locked` on each; **but it refuses unconditionally on the real closure (`281/289`, 2 hardlinks)** and must reproduce an unreadable tool's digest (`493-500`). Membership rule verified exact (7332/4885). |
| H3 | **PARTIAL** (U8) | Both tsc paths pinned at `315-317`, re-measured `510-512`, also inside the closure manifest; "exactly one runtime" retracted in `BLUEPRINT §2.3` and nowhere re-asserted. U8 transitive trust is a typed UNKNOWN, so NOT resolved. |
| M1 | **PARTIAL** (U1) | `safe.directory=/repo` exact at `325`, applied only to the uid-1002 argv; no wildcard, no root exception. Root-controlled ingress still unsuppliable (U1). |
| M2 | **RESOLVED-IN-DRAFT** | `bounded_read` breaks once on deadline (`373-375`); `capture_unit` `finally` calls the idempotent finalizer (`985`); `capture_reserve=15` preserved. |
| M3 | **PARTIAL** | Intent fsynced pre-launch with `O_EXCL` and absence check (`574-578`); `creation_attempted` before `Popen` (`973`); `reconcile` binds InvocationID once (`596-598`); no relaunch anywhere. But see **NEW-M4** (`mint_intent` name fails its own regex) and U9. |
| M4 | **PARTIAL** (U5/U6/U9), caveat NEW-M3 | Finalizer registered pre-launch (`945`); invoked in `capture_unit`/`session_adapter`/`main` finallys (`985`, `1331`, `1353`); survivor sweep attempted on the exception path too (`871-880`); write-once cell; no `missingResult ⇒ success`. |
| M5 | **RESOLVED-IN-DRAFT** | `/var/run` tmpfs removed from `BASE_PROPERTIES` and from the deleted template; `readlink` assertion at launch (`719`) and inside (`1062`). |
| M6 | **PARTIAL** | Tracked-`dist`/`node_modules` rejected (`1157`); empty scaffolding created (`1232-1234`) and checked at launch (`721-723`) and inside (`1063-1065`). U1 bootstrap/handoff absent. |
| M7 | **PARTIAL** (U5) | `--pipe` at `753`, `StandardInput=null` removed, client stdin `DEVNULL` (`975`). Combined 255.4 semantics UNVERIFIED and the normalizer is a typed refusal (U5). |
| M8 | **PARTIAL** (U8); see NEW-L4 | 22 pins at `296-317`; `observed-executable-SHA256SUMS` 17/17 OK; the 5 inherited pins verified byte-correct by me. No execution/version probe. Loader/stdlib/test-executable closure is a typed UNKNOWN (U8). |
| M9 | **RESOLVED-IN-DRAFT** | `verify_marker` at `main:1347` and again per launch (`970-972`) with `scope_now!=scope` refusal; runner re-verified per unit via `actual_inputs:509`; strict path regexes (`452-461`); check-to-use window disclosed (`515-516`). |
| L1 | **PARTIAL** | Reader/stream/control/reserve limits do come from `BOUNDS` with one `ByteAccount` (`331-348`, `385-391`). But **NEW-M1** (unit resource literals) and **NEW-L1** (unbounded procfs reads) remain. |
| L2 | **RESOLVED-IN-DRAFT** | `Budget.inherited:182-186` refuses `None` and anything but `[0-9]{1,20}`, then `require()`. |
| L3 | **RESOLVED-IN-DRAFT** | `bounded_control:424-426` refuses overflow/size before `show`'s decode at `561`. |
| L4 | **RESOLVED-IN-DRAFT**, caveat NEW-M2 | `/out/consumer-verified` absent bundle-wide; `guarded_producer:1241-1242` requires a typed `Proof`; `ArtifactReceipt:1109-1115` requires digest equality + `byte_equal is True`; `producer-test.sh` rehashes independently. `/out` outputs are labelled evidence (`1081`,`1143`). |
| L5 | **OPEN — arithmetic disclosure, no resolution** (as claimed) | Accurate; see item 9 above. 2100 unchanged. |
| L6 | **RESOLVED-IN-DRAFT** | `unit-template.json` deleted with diff; `BASE_PROPERTIES:535-552` is the sole property list; no reference remains. (NEW-M1 is a *different* duplication, against `BOUNDS`.) |
| R1 | **PARTIAL** (U3/U4) | Fixed `PreflightKey`; `Proof` requires the complete domain; missing callbacks yield `unavailable` **per named key** (`1069-1077`); no collect-only terminal raise. The assertions themselves stay UNKNOWN pending U3/U4, so mechanism-only. |
| R2 | **RESOLVED-IN-DRAFT** | `STAGE_CHECKS:1265`; `StageResults.accept:1273`; `EvidencedSession:146` revalidates all seven. Empty/partial/None cannot be success. |
| R3 | **PARTIAL** (U2/U8 et al.) | `Capability` enum replaces the strings; `capabilities:927-940` emits UNKNOWN for absent predicates; `PLATFORM` empty and non-permissive. Every predicate is an absent adapter, so mechanism-only. |
| R4 | **RESOLVED-IN-DRAFT** | No bool; independent plan pin + actual plan bytes (`473`); runner map digest external (`476`); **no marker-creation path** (full write audit). |
| R5 | **RESOLVED-IN-DRAFT**, caveat NEW-L3 | `BindSource` roles; exact RO/RW set + role equality (`738-743`); `root_locked` on every source twice (`719`, `742-743`); writable leaf only 1002:1002 0755 under the owned session (`245-250`). |
| R6 | **PARTIAL** (as claimed) | Positive required `UnitKey`; `BEFORE/AFTER/INTENT` explicitly NEGATIVE (`1001-1003`); write-once `SurvivorCell`. No raw `exit 0`/`None`/absence-of-error success. See **NEW-M2** for `PRODUCER` provenance. |
| R7 | **RESOLVED-IN-DRAFT** | `hex_pin:199-202` requires lower-case 64-hex and distinguishes malformed from mismatch; unset pins refuse. |

### B1–B17 (17)

| Item | Verdict | Evidence |
|---|---|---|
| B1 | **OPEN — authority absent** (as claimed) | All five slots `None` (`34-38`); `hex_pin` refuses. Correct. |
| B2 | **PARTIAL** | `SessionFS` (625), `archive_source` (1147), `copy_tree_data` (682), `StageResults` (1269) drafted; U1/U2/U6/U7 absent. **NEW-M5**: `stage_dirs`/`copy_tree_data` unreachable. |
| B3 | **OPEN — typed UNKNOWN** (as claimed) | Named assertions `1037-1083`; `synthetic_negative_assertions:1085` requires an outside control receipt first and reads no environ. |
| B4 | **OPEN — typed UNKNOWN** (as claimed) | `show:556-565` bounded + strict key set; normalizer required at `954-959`. |
| B5 | **PARTIAL** | Finalizer/reconciliation/pidfd TERM/exact-cgroup KILL/sweep/mount-identity cleanup all drafted (`801-904`, `668-681`). Caveat **NEW-M3**. |
| B6 | **PARTIAL** | Shared `bounded_read`, pre-retention cap, drain, reserves, overflow refusal, decode ordering all present. Caveat **NEW-L1**. |
| B7 | **OPEN — operator-only** (as claimed) | Accurate; I used the recorded digest only and re-hashed no tree as root. |
| B8 | **OPEN — scope/claim limit** (as claimed) | Required wording present verbatim in `REPORT.md` and `BLUEPRINT §6`. |
| B9 | **OPEN — deferred** (as claimed) | Accurate; `producer-test.sh` runs only the ten pinned focused files. |
| B10 | **OPEN — plan only** (as claimed) | `closure-reconstruction-plan.md` + 100-row TSV carried; `diffs/lock-tarballs.tsv.diff` is empty (0 bytes, `e3b0c442…` = SHA256 of empty), consistent with "carried forward unchanged". |
| B11 | **OPEN — no execution evidence** (as claimed) | Confirmed; and **this review adds none** — all my probes were read-only hashes/stats on inputs, never on drafts. |
| B12 | **OPEN — historical assurance limit** (as claimed) | Accurate; every round-2 git command carries `GIT_OPTIONAL_LOCKS=0`, as did mine. |
| B13 | **OPEN — historical timing disclosure** (as claimed) | Accurate. |
| B14 | **OPEN — new explicit blocker** | Root-Git removal is real in code (see H1) but U1 ingress bounds are unresolved, so the blocker stands. |
| B15 | **OPEN — new explicit blocker; worse than stated in one respect, better in another** | The disposition says "measurement function exists as draft, never run". **NEW-H1 shows it cannot run at all against the actual closure** — the only row where the self-assessment is materially optimistic. Offsetting: my probe shows the format is byte-exact against both pins, so the remaining defect is a single condition, not a design problem (NEW-H2 retracted). |
| B16 | **OPEN — new explicit blocker** (as claimed) | Direct hashes verified (17/17 + my 5); child resources counted via shared cgroup limits; U8 unresolved. |
| B17 | **OPEN — new explicit blocker** (as claimed) | Call sites drafted; no behaviour/ambiguity/survivor proof. Caveat **NEW-M3**. |

Tally after the strict rule: **0 REGRESSED, 11 RESOLVED-IN-DRAFT**
(M2, M5, M9, L2, L3, L4, L6, R2, R4, R5, R7 — all self-contained code with no
U-adapter dependency), **16 PARTIAL** (H1, H2, H3, M1, M3, M4, M6, M7, M8, L1,
R1, R3, R6, B2, B5, B6), **15 OPEN** (L5, B1, B3, B4, B7–B17). Sums to 42.
**All 42 remain OPEN for the owner; no item is closed by this review.**

---

## Verification Gates

No `orgasmic dispatch gate` receipt was produced: the manager named no gates for
this dispatch, and every check below is a read-only hash/stat on *inputs*, not a
buildable project check — an unwrapped check yields no reusable receipt, and
wrapping these would imply a verification duty that was not assigned.

| Check | Command | Result |
|---|---|---|
| bundle integrity | `cd .../XGHH2-DRAFTS-r2 && sha256sum -c SHA256SUMS` | 21/21 OK, 0 FAILED |
| bundle manifest pin | `sha256sum XGHH2-DRAFTS-r2/SHA256SUMS` | `e5addcb8…` = brief |
| prior review pin | `sha256sum XGHH2-DRAFTS-v1-REVIEW1.md` | `c43561b7…` = brief |
| v1 manifest pin | `sha256sum XGHH2-DRAFTS-v1/SHA256SUMS` | `5322290c…` = brief |
| HEAD | `GIT_OPTIONAL_LOCKS=0 git rev-parse HEAD` | `f8af03a8…` = brief |
| executable inventory | `sha256sum -c observed-executable-SHA256SUMS` | 17/17 OK |
| uncorroborated pins | `sha256sum` of the 5 `BINARY_SHA` entries absent from that file | all 5 match `controller.py:296-317` |
| candidate inventory size | `git ls-tree -rz --full-tree f8af03a8 \| wc -c` | 61107 B, 718 blobs, 0 `.gitattributes` |
| package blob | `git ls-tree f8af03a8 -- package.json` | `02744ce1…` = `PACKAGE_BLOB` |
| closure/Node shape (stat only, uid 1002) | `find … -links +1 / -perm /7000 / -perm /022 / ! -uid 0 / -lname '/*' / -xtype l` | **2 hardlinks (NEW-H1)**; 0 setid, 0 writable non-symlinks, 0 non-root, 0 absolute/broken links, 0 special files |
| manifest membership | file+symlink counts vs F0 record | closure 7332 == 7332; Node 4885 == 4885 |
| closure-manifest.py | `ls -la /root/closure-manifest.py` | Permission denied (motivated NEW-H2, since retracted) |
| **F0 format reproduction** | reviewer's own probe `/tmp/zevac-rehash-probe.py` (25 lines, imports no draft), mirroring `tree_manifest` closure mode + `digest_file` + `canonical()` **without** the `st_nlink==1` guard | closure → `91d0d313…` == `CLOSURE_SHA`; Node → `e02b14b5…` == `NODE_TREE_SHA`; entries 7332 / 4885. **Proves NEW-H1 is the only divergence and retracts NEW-H2.** |
| rehash cost | same probe, warm cache | 0.27 s + 0.28 s per `actual_inputs` pass ⇒ ~5 s for all 8 passes |
| deadline enforcement | static audit of all `deadline_ns` / `require` / `times` / `call_end_ns` sites (`controller.py` 81, 179-197, 371-375, 420, 427, 542, 745, 758-760, 848, 898-899, 980-981, 1007, 1049, 1187, 1319, 1342, 1357, 1372-1379; `unit-wrapper.sh:24,29`) | `deadline_ns` assigned at exactly 2 sites (180, 185); no `+=`, no reset, no second `Budget()`; every bound is `min(ceiling, remaining original)`; every hit raises `Deadline(Refusal)`. **No extension, renewal or retry edge found.** |

Gate success here proves only data/hash/shape facts about the *inputs*. It proves
nothing about the drafts' syntax, imports, types, containment or behaviour.

## Unmet criteria / test gaps

- `Acceptance: not set` for this dispatch; the brief is the contract and every
  numbered item 1–10 is answered above.
- **B11 stands unchanged.** No syntax, import, type, API, mount, cgroup,
  credential, pipe, capture, finalizer or timing behaviour is verified, by the
  drafting round or by me. Many findings above (NEW-M4, NEW-L6, NEW-M6) are
  exactly the class a single `py_compile`/import would surface, and the brief
  correctly forbids that here — so they can only be closed in a later round.
- **No mutation-style evidence exists for the "deleting any check cannot produce
  PASS" property.** My conclusion is a static reading of the four independent
  revalidation sites, not a test. `BLUEPRINT-v3.md:40-42` makes the same caveat.
- The inside→outside evidence channel is untested *and* unimplemented: the
  `Proof` built by `payload_preflight` cannot cross the `os.execv` boundary
  (`1255`), and `registry.snapshot()` (`119-121`) loses typing. U6 names this; the
  bundle does not say how `UnitKey.PREFLIGHT` could ever become positive.
- `/handoff/preflight-input.json` and `/handoff/artifact-manifest.json` are
  required root-owned 0444 inputs (`1039-1041`, `1135-1137`) that nothing in the
  bundle creates.

## Residual risk

Everything in the bundle's own Residual Risk section stands, with one exception:
my probe *reduces* the H2 format risk by reproducing both sealed digests exactly.
Additionally: (1) H2 is **inert as drafted** — a single condition away from
working, but today every launch refuses; (2) the marker's `bounds` field is
cosmetic for unit resource limits
(NEW-M1), so marker review would not catch a resource-envelope error;
(3) teardown of later owned units can be starved by one stuck earlier unit
(NEW-M3); (4) `SIGXFSZ` and `SIGKILL`/host loss remain outside Python's
exception model — NEW-M6 widens that surface from the disclosed `SIGKILL` case to
an ordinary oversized-file case. The root check-to-use window, the root catatonit
boundary, and the shared user/uts/cgroup namespaces remain intentional
disclosures, not findings.

## Fix directions

1. **NEW-H1** — in `tree_manifest` closure mode, accept `st_nlink>1` when every
   link target resolves inside `root` (record the entry normally; optionally
   record the link group), keeping the `nlink!=1` refusal for the non-closure
   artifact path where `copy_tree_data` genuinely cannot reproduce hardlinks.
   Verify by recomputing both sealed digests read-only *before* re-review.
2. **NEW-H2 (retracted; cheap hardening only)** — record a read-only receipt that
   the draft's canonical format reproduces `91d0d313…` / `e02b14b5…`, and pin
   `closure-manifest.py`'s sha256 `c207923062ca…` next to `CLOSURE_SHA`, so the
   next reviewer need not rediscover this. Not a blocker.
3. **NEW-M1** — build `BASE_PROPERTIES` by formatting from `BOUNDS`
   (`f"MemoryMax={BOUNDS['memory_MiB']}M"` etc.) and delete the unused keys that
   remain unused after that, so `verify_marker`'s `bounds` check has real force.
4. **NEW-M2** — state in `BLUEPRINT` and assert in `unit_receipt` that
   `producer_exit` must come from the outside `ExecMainStatus`, and demote
   `/out/producer.exit` to a cross-check that can only *contradict*, never
   satisfy, `UnitKey.PRODUCER`.
5. **NEW-M3** — bound the post-kill survivor wait by
   `min(grace_seconds, remaining - teardown_reserve)` and give each registered
   finalizer an explicit slice of `teardown_reserve`.
6. **NEW-M4/L6** — pass `stage.value+'.service'` (or append it inside
   `mint_intent`); raise `Refusal` rather than `KeyError` for stages without a
   `_ceiling`.
7. **NEW-M6** — raise the `RLIMIT_FSIZE` scope to cover only the archive write
   (restore the prior limit in a `finally`, keep the hard limit untouched) and
   check the source tree's largest blob against the cap up front so a breach is a
   `Refusal`, not `SIGXFSZ`.
8. **NEW-L1** — route the procfs reads through a bounded helper and charge them to
   `ByteAccount`.
9. **NEW-L4** — reword M8 to say the observed inventory covers the 17 newly
   hashed paths and that the 5 setup/Node pins are inherited; correct
   `BLUEPRINT-v3.md:245` "four" to five. (This review independently verified all
   five, so the substance holds.)
10. **Deadline: no change.** Enforcement is verified sound (item 9) and the
    aggregate must stay at 2100 s. The open decision is the focused window, not
    the budget: `focused` is structurally truncated to ~660 s. Re-scoping the
    focused set or lowering a ceiling are the levers; I propose no increase.
11. Once NEW-H1 is closed, the honest next step is a **canary-only** step
    scoped to U3/U4/U5 with the stage driver still absent — not a stage-1 run.
    That still needs independent re-review of the new round plus a separate
    qualifier go.
