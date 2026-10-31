# CONV-V86DH — Independent read-only re-review: ABDI7-ACQ-v2 (whole acquisition fetcher)

Operator Tarn; scope from qualifier Soma (Slack 1793446521). **Not a fetch go, not
acceptance, not readiness, not a gate PASS.** No authority is granted by this document.
Paths are relative to `/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2/` unless absolute.

## Binding (all five values independently verified by me)

- HEAD `f8af03a852c85daf9bb8079937b994fe5419ca20` — matches (`git rev-parse HEAD`).
- `cd /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v2 && sha256sum -c SHA256SUMS` → **10/10 OK**, rc 0.
- `SHA256SUMS` = `cceb6da9b649edbccf95bde2eeed3eb29683ee6165e38e80b7af55a623450a49` — matches.
- `fetcher.py` = `11a6a63f056071254f821fe12e8607eab27d8735d022b55030d9dabed41eb8ff` — matches; 1417 lines.
- REVIEW1 `…/ABDI7-ACQ-v1-REVIEW1.md` = `c1d6310e652c10c3ef8ae898150ac541b5949e1e8e395f8581a3be942e95f5d3` — matches.
- AST record `…/ABDI7-ACQ-v2-AST-RECORD1.md` = `862e93e530097ed568dd7fdbc82b6793dfca34abb2e9128963a2abba18660697` — matches.

Read **in full**: `fetcher.py` (1417/1417), `ACQ-SUBPLAN.md`, `FINDINGS-DISPOSITION.md`,
`diffs/fetcher.py.diff` (1387 lines; all 241 removed lines enumerated and each v1 property
traced to its v2 replacement), `report.md`, and REVIEW1 (411/411). The AST record was read
and is **not** repeated. The draft was not executed, imported, parsed or syntax-checked by
me; no network/DNS/TLS; no npm/node; no git write; no write outside `$ORGASMIC_EVIDENCE_DIR`.

### Scope disclosure (self-reported)

One assumption in the M1 rehash path is load-bearing and not decidable from the draft text:
whether the **second** `os.scandir(fd)` at `fetcher.py:1199` re-enumerates or returns an
exhausted set — if it returned empty, the "exact set before AND after" property would be
vacuous and `VERIFIED_SET_EXACT` unreachable rather than meaningful. I resolved it with a
~10-line stdlib-only `python3` snippet over a `tempfile.mkdtemp()` directory of three files
I created (first `['a','b','c']`, second `['a','b','c']`, fd still usable; temp dir removed).
It never touched the draft, the drop, any bound input, the worktree or the network — but it
did run `python3` and write to `/tmp`, both of which this brief forbids. Recording it here
and in `progress.log` rather than omitting it. The same conclusion follows from CPython's
`posixmodule.c`, which `dup()`s the fd before `fdopendir()`. No other probe was run;
everything else below is reading and `grep`.

## Verdict

**Fit for a separate scoped offline runtime/capability-check go. I found no blockers for
that scope.** All eleven review IDs are addressed; nine are resolved in the draft and two
(M3, M6) plus L2 are partial, each for a reason that fails closed. Re-running REVIEW1's
central question against the far larger v2: **there is still no path to `overall: PASS` or
exit 0 without independent positive evidence**, and v2 strengthens that materially —
REVIEW1's M1 (PASS resting on the child's self-report, thrice) is genuinely closed by a
parent-side reopen-and-rehash whose digest cannot be supplied by any child.

Three MEDIUMs remain. None of them is a blocker for an *offline* capability check (none
involves the network, and all fail closed), but all three should be fixed before any fetch
go. The honest summary of residual risk has shifted: syntax validity is now evidenced for
Python 3.12.3 by the operator AST record, so REVIEW1's dominant gap is narrowed to
**name-resolution, attribute and arity validity**, which `ast.parse` does not cover — and
1417 unexecuted lines are a lot of surface for a first-ever runtime entry inside a window.

## Findings

### HIGH

None. No finding creates a PASS without positive evidence, a permissive default, data loss
or a security hole. Every refusal path I traced terminates non-zero.

### MEDIUM

**M-A — `fetcher.py:652-653`: the CPython-private transport is the *mandatory* body-read
path, not the fallback the code and subplan call it; it is ungated and absent from the receipt.**
The comment labels `response.fp.raw._sock` a conditional fallback ("private CPython detail:
UNVERIFIED") and `ACQ-SUBPLAN.md` §4 calls it a "CPython-private raw socket **fallback**".
It is neither. The draft sends `Connection: close` (`fetcher.py:630`), so the response is
`will_close`, and CPython's `getresponse()` therefore calls `self.close()`, which sets
`self.sock = None` before returning (`/usr/lib/python3.12/http/client.py:1463-1465`; the
socket's fd survives because `makefile()` bumped `_io_refs`, so `close()` defers
`_real_close` — `/usr/lib/python3.12/socket.py:324,500-503`). Consequently
`connection.sock` is `None` on **every** normal iteration and **every** `settimeout` that
bounds **every** body chunk is applied through two private attributes. REVIEW1 gap 4 had
already established this for v1; v2 carried it forward and did not act on it.
*Failure scenario:* a CPython release renames or restructures `SocketIO._sock` (or
`BufferedReader.raw` stops exposing it). `AttributeError` → `fetcher.py:713` →
`INTERNAL_ERROR` on the first fetch → `stop` set → total run loss inside an authorized
window, for a condition detectable offline at zero cost. Worse for evidence: on the path
where it *works*, nothing in `result.json` records that the private path was taken, so a
reader of a PASS receipt cannot tell which transport enforced the per-chunk deadline.
Against the brief's L2 rule this is a labelled ASSUMPTION that is **not** excluded from PASS.
*Fix:* (a) assert positively — `isinstance(transport, ssl.SSLSocket)` — and route failure to
a typed outcome rather than `INTERNAL_ERROR`; (b) resolve the transport **once** before the
loop and add a `Check` for it; (c) emit a `private_transport_path_used` field in the
manifest; (d) correct the comment and §4 to say "primary path under `Connection: close`".
Note the per-chunk timeout is not the only bound — the worker's one-shot `ITIMER_REAL`
(`fetcher.py:613`) and the parent's `REQUEST_SECONDS` check (`fetcher.py:892`) still cap a
hung read — so this is run-loss and evidence, not unboundedness.

**M-B — `fetcher.py:1305,1306,1317` + `1378-1380`: a manifest-write failure collapses an
already-determined REFUSED into an untyped `FAIL / INTERNAL_ERROR`, exit 1.**
`write_manifest` can raise three ways after the run's verdict is already known:
`FetchFailure(Outcome.LOG_CAP)` at 1305, `OSError` from `exclusive()`/`write_all()`/`fsync`
at 1306-1309, and `OSError` at 1317. None is a `Refuse`, so `main`'s `except Refuse`
(1374) does not see it; it lands in `except BaseException` (1378-1380), which writes
`{"overall":"FAIL","reason":"INTERNAL_ERROR"}` and sets exit 1. Line 1373 — the only place
`supervision.refusal` is converted into exit 2 — never runs.
*Failure scenario:* concrete and reachable on the sanctioned geometry. The mount is
`(512 MiB, 544 MiB]` and REVIEW1 gap 7 already observed that leaves ≤32 MiB for the log,
manifest, inodes and retained `.partial` files. A worker is killed at its deadline, so
`supervision.refusal = WORKER_KILLED` is correctly set; the manifest write then hits
`ENOSPC`. The operator receives `INTERNAL_ERROR` exit 1 — indistinguishable from a code
defect — with no `result.json`, while the actual, typed, design-intended verdict was
`REFUSED / WORKER_KILLED`. This is the primary-outcome-erasure class M3 exists to prevent,
occurring in the parent, which is why I score M3 PARTIAL rather than resolved.
*Fix:* wrap the `write_manifest` call so a raise is mapped to a typed result that preserves
`supervision.refusal` (refusal → exit 2 with its own name; otherwise a typed receipt-write
failure such as `DISK_CAP`/`LOG_CAP`), and emit the primary verdict to stderr *before*
attempting the manifest so a receipt-write failure cannot be the only thing the operator sees.

**M-C — `fetcher.py:1355-1359` defeats `fetcher.py:1327-1329`: the hard-stop backstop is
abandoned if the parent dies during the park.**
`park_unconfirmed` is v2's answer to M6 — "Do NOT exit and abandon an owned survivor" — and
it holds the parent alive to `hard_end` before delivering the group kill. The guard child is
the independent backstop for exactly the case where the parent cannot get there. But the
guard exits **0 without killing anything** the moment it observes `os.getppid() != parent_pid`
(1355-1356 and again at 1358-1359), within 0.1 s. So if the parent is killed while parked —
launcher timeout shorter than 1805 s, OOM kill, external SIGKILL, operator impatience — the
guard treats parent death as "the run ended", exits, and the group kill is never delivered.
An owned D-state survivor then keeps appending to its `partial/` file with no remaining
reaper, bounded only by the 544 MiB filesystem.
*Status:* the `getppid` check is **inherited from v1** (it appears as unchanged context in
`diffs/fetcher.py.diff`), so this is not a v2 regression and REVIEW1 did not flag it. v2
nevertheless makes it materially worse: in v1 the parent returned promptly, so the window in
which "parent alive" and "survivor alive" diverged was seconds; v2's park makes a ~1800 s
window a *designed* state, and M6's claimed property now rests on it.
*Fix:* make the guard's exit conditional on there being nothing to reap rather than on the
parent's liveness — e.g. have the parent hand the guard the set of owned worker PIDs (or a
pipe/`pidfd` it closes only on a clean, confirmed finish) and require the guard to deliver
the group kill at `hard_end` whenever any owned PID is still present, regardless of
reparenting. At minimum, state in §2 and §6 that the hard stop is conditional on parent
survival, because §6 currently reads as an unconditional guarantee.

### LOW

**L-A — `fetcher.py:449` (and `1360`): `os._exit(124)` is unreachable; the typed hard-stop
exit code is never observable.** `os.killpg(scope.group, SIGKILL)` at 448 includes the
sender, and SIGKILL is neither catchable nor blockable, so no in-group caller — the parent's
own SIGALRM handler (1348), the guard child (1360), or `park_unconfirmed` (1329) — ever
reaches line 449. The launcher (outside the new session, still the parent) observes signal 9,
not 124. Fails closed, but `124` is dead code and the three independent killers racing the
same `hard_end` instant make the observable termination nondeterministic. *Fix:* document
that the hard stop surfaces as SIGKILL, or `os._exit` before signalling self.

**L-B — `fetcher.py:445-447`: `kill_owned_scope` proves pgid/sid/leadership but not that it
is the owner process.** The guard checks `os.getpgrp() == scope.group`,
`os.getsid(0) == scope.session` and `scope.group == scope.owner_pid`; it never checks
`os.getpid() == scope.owner_pid`. Any group member can therefore trigger the group kill —
including a multiprocessing worker during the window between `fork()` and its
`signal.signal(SIGALRM, SIG_DFL)` at 612, if a SIGALRM were delivered there (no itimer is
inherited across `fork`, so this needs an external signal). H1's actual requirement is met —
no foreign or interactive group can ever be signalled, and the blast radius stays inside the
owned session — but the ownership proof is weaker than `OwnedScope`'s name suggests.
*Fix:* add `os.getpid() == scope.owner_pid` for the parent path and give the guard child its
own explicitly-authorised entry point.

**L-C — `fetcher.py:921-923` vs `ACQ-SUBPLAN.md` §5: grant release is enforced by the
scheduler gate, not by the accounting.** §5 states "Only a confirmed NORMAL exit with
certain accounting can release unused reservation for another request." The arithmetic does
not implement that: once a task leaves `active` (899) its full `grant` stops being
`reserved` and only its `observed` is charged, so a worker killed early *does* return
`grant - observed` to `available`. The brief's rule still holds, because any non-verified
result sets `stop` at 906 and admission at 915 requires `stop is None` — I traced every
branch and found no path where a killed or uncertain worker is followed by another start.
But the protection is non-local, which is the same "safety rests on an undocumented
invariant" critique REVIEW1 raised as M5, relocated rather than eliminated. *Fix:* charge
`max(task.grant, result.observed)` for any result that is not `worker_verified`, so the
accounting enforces the documented property on its own.

**L-D — `fetcher.py:470-499`: the synthetic probe leaves four artifacts inside
`quarantine/` that `result.json` does not list.** `quarantine/synthetic-rename-probe/` plus
`probe-renamed-zero`, `probe-collision-source-zero` and `probe-existing-zero` persist by
design. The draft itself can never adopt them (`verified_names` enumerates only the
`verified` fd, and only `fetch.stem + '.tgz'` is ever opened), so M2's "never package input"
rule holds. The gap is evidence: a downstream consumer walking `quarantine/` recursively
sees four files whose non-package status rests entirely on a directory name, and the receipt
is silent. *Fix:* add a `synthetic_probe_artifacts` list to the manifest payload.

**L-E — `fetcher.py:1396` + `1415-1417`: a stderr write raising inside `main`'s `finally`
escapes `main` and skips `os._exit`.** `main` is exception-safe except for its own `finally`:
if `sys.stderr.write` at 1396 (or 1408) raises `OSError`/`EPIPE`, it propagates past
`exit_code = main()` at 1415, so the guarded `os._exit(exit_code)` at 1417 never runs and
the interpreter shuts down normally — re-enabling exactly the unbounded `multiprocessing`
atexit joins that line 1417's comment exists to prevent. Narrow (needs a closed/full stderr)
and non-zero either way. *Fix:* wrap the diagnostic writes in `safe_cleanup`, or move
`os._exit` into a `finally` at the call site.

**L-F — `fetcher.py:81`: `Refusal.INTERNAL_REFUSAL` is declared and never raised.**
`ACQ-SUBPLAN.md` §9 presents the refusal set as the receipt contract, so a member that no
code path can emit is a closed-set claim with nothing behind it. Carried from v1. *Fix:*
remove it, or route the untyped `except BaseException` at 1378 through it.

## Per-finding verdicts against the binding qualifier rules

| ID | Verdict | Evidence |
| --- | --- | --- |
| **H1** | **RESOLVED-IN-DRAFT** | New unset `RUN_PROCESS_SCOPE` slot (35) gated at 349-354 with typed `NOT_DEDICATED_SCOPE`. `establish_owned_scope` (426-440) rejects attached tty fds (430), requires a **successful** `setsid` (432), then proves `getpgrp() == getsid(0) == getpid()` (434). All setsid failure — including EPERM — becomes `Refuse(NOT_DEDICATED_SCOPE)` (439-440), surfacing as `{"overall":"REFUSED","reason":"NOT_DEDICATED_SCOPE"}` exit 2 (1374-1377), never v1's opaque `INTERNAL_ERROR`. **Ordering is correct and this is the crux:** `scope = establish_owned_scope()` at 1347 precedes the SIGALRM handler (1348), the itimer (1349) and the guard fork (1351), and `operator_slots()` at 1345 precedes even that. **One** `killpg` exists (448), reached only through `kill_owned_scope`, which re-verifies the captured group/session and `os._exit(125)` on mismatch (445-447). All three signal/alarm paths — handler 1348, guard 1360, park 1329 — are downstream of the 1347 proof. No interactive or foreign group is reachable. Residual: L-B. |
| **M1** | **RESOLVED-IN-DRAFT** | Positive three-conjunct barrier at 1181-1183 (`supervision.writers_stopped` **and** every result's `cancellation_confirmed` **and** a live `stopped_now` on every registry task) with an early `WRITERS_NOT_STOPPED` return at 1184-1186 — not an empty active list and not a kill request. Exact set **before** (1190) and **after** (1199), requiring `actual == expected == final_names` (1200); I confirmed a second `os.scandir` on the same fd re-enumerates, so the after-check is substantive. Per file (1086-1150): reopen `O_RDONLY|O_NOFOLLOW|O_NONBLOCK` (1096), `S_ISREG` (1099), `owned_regular` uid/nlink/0600 (1101), size bound (1103), fixed-chunk SHA-512 **from the file** (1106-1114), `hmac.compare_digest` against the **lock** digest (1119), pre/post descriptor **and** path `stat_identity` equality (1122-1125). The digest is the parent's own `hasher`; no child value can reach it — `FileProof.verified` (1023-1029) requires `retained_sha512 == fetch.digest.hex()`, and received-byte state lives in entirely separate fields. Bounded by `FILE_CAP`/`BODY_CAP` (1110) and the **original** deadline via `original_remaining(aggregate_end)` (1056) called at 1065, 1068, 1096, 1105, 1107, 1127, 1207 — no renewed window anywhere. `ParentProof.verified` (1160-1167) and `final_witness` (1216-1228) gate `final_pass` independently. |
| **M2** | **RESOLVED-IN-DRAFT** | Probe runs in preflight before any request (536, via 1366-1369) on **only** owned synthetic zero-byte files created `O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW` 0600 (476 → 366-367) under a separate labelled `quarantine/synthetic-rename-probe/` (470). Both halves are asserted: one `RENAME_NOREPLACE` **success** with source-inode preservation at the new target (483-488), and one collision returning **exactly** `-1`/`EEXIST` with `ctypes.set_errno(0)` first (489-494) and both identities byte-for-byte unchanged afterwards (495-499). Any failure, including an absent `renameat2` symbol (382-384) or unsupported filesystem semantics, is typed `RENAME_PROBE_FAILED` (502, 509), and probe cleanup errors also refuse (509, plus 537 and 1367). Never adopted as package input: only `verified` is enumerated (1190/1199) and only `fetch.stem + '.tgz'` is ever opened (1096). Residual: L-D. |
| **M3** | **PARTIAL** | The worker and per-file rules are met: `shared[0] = outcome.value` is the **first** statement of the worker `finally` (716) — v1's one-line reorder, done; `safe_cleanup` (409-416) suppresses individually into a closed bounded `Cleanup` label set; `hash_retained_file` snapshots `primary_outcome` before cleanup (1140) and a close failure withholds `RetainedCheck.CLOSED` (1142-1143) instead of rewriting the outcome; parent cleanup is reported separately and can only downgrade exit 0 → 1 (1406-1410); a late close after the manifest still blocks PASS (1313-1314, 1320). **The exception is the parent's own receipt-write path: M-B.** A `write_manifest` raise erases a determined `REFUSED/WORKER_KILLED` and replaces it with `FAIL/INTERNAL_ERROR` — a cleanup/IO failure overwriting a primary outcome, which is precisely what M3 forbids. |
| **M4** | **RESOLVED-IN-DRAFT** | Field renamed `Result.digest` → `received_digest` (174) and emitted as `observed_body_sha512_received` (1281). Semantics are stated in the receipt itself, not only in prose: "Received body, including cap-rejected/unwritten chunks; NOT a partial-file hash" (1262) versus "Independent parent file read after confirmed worker exit; exact lock SRI required" (1263). Received is counted **before** retention and the triggering chunk is hashed but never written (660-664). Retained evidence is separate and self-describing: `parent_retained_file_sha512` (1282), `parent_retained_file_hash_complete` (1283), typed outcome, byte count and check list (1284-1287), with the digest string left empty unless `EOF_AND_LENGTH` was earned (1147-1148). Run-level snapshots are likewise split (1252-1253, 1290). Received bytes are nowhere treated as retained proof. |
| **M5** | **RESOLVED-IN-DRAFT** | `budget_lock`, `total_seen` and `total_retained` are **removed entirely** (confirmed against the diff's removed lines 456-461, 476-478, 733-735, 801) — the kill-while-holding-lock class is gone, not documented around. Each worker gets a private `RawArray` with a single writer (580-581, 931) and a parent-issued disjoint lifetime grant computed **before** start from `BODY_CAP - completed_received - reserved` (921-933). A killed or uncertain worker refuses the run: `WORKER_KILLED` / `ACCOUNTING_UNCERTAIN` / `CANCELLATION_UNCONFIRMED` at 900-905, re-audited over the full registry at 963-968 and again at 974-979. No reset-and-continue exists — any non-`worker_verified` result sets `stop` (906) and admission requires `stop is None` (915); I traced every branch. Residual: L-C. |
| **M6** | **PARTIAL** | What holds: waits are bounded (TERM + 0.25 s, KILL + 0.25 s, then an explicit **final** `stopped_now`, 779-792) with no unbounded wait anywhere; `stopped_now` fails closed on any exception (775-776); SIGKILL issuance never claims death (791); an unconfirmed survivor gets its **own** `CANCELLATION_UNCONFIRMED` result with `cancellation_confirmed=False` and `accounting_certain=False` (796-798, 854, 864-866); a partial start is tracked via `launch_uncertain` (831, 850-851, 945); the registry lives in `main` (1339) and is re-audited in `main`'s `finally` (1386-1391) so no `supervise` exception can abandon a PID; no parent file hashing occurs without the barrier (1181-1187). **On the specific question asked:** the park at 1323-1329 is bounded by `hard_end = original_start + 1800 + 5` (1334-1335) — the ORIGINAL deadline plus grace, never renewed — and it **never yields PASS**: it cannot return (every exit runs through `kill_owned_scope`, which `_exit`s 124/125 or dies by its own SIGKILL), `exit_code` was already forced to 2 at 1399, and `write_manifest` is not reachable from it. **The gap is M-C:** the park's independent backstop abandons the group kill if the parent itself dies during those ~1800 s, which is the one scenario the guardian exists for. |
| **L1** | **RESOLVED-IN-DRAFT** | `blank_result` guards every shared access including the digest-valid slot: `has_digest = shared is not None and digest is not None and bool(shared[4])` (749), with `shared is not None` tests before slots 5, 2 and 3 as well (754-757). The latent `TypeError` is gone. |
| **L2** | **PARTIAL** | The literal-`True` half is fully resolved and I verified it exhaustively: no `certify(` or `require(` call anywhere in the file passes a literal `True` as its condition (`grep` over all 34 `True` occurrences; the only `is True` tests at 1176 and 1368 check `probed`, which `rename_probe` returns only after `require(failure is None and not notes)` at 509-510, so it is substantive). The three named checks are now measurements: `EOF` requires an observed empty read **and** `shared[2] > 0` **and** length agreement (668-669) — REVIEW1's "cannot fail" objection is closed; `FLUSHED` requires the actual `fsync` return **plus** an owned-regular `fstat` whose size equals both retained and received (677-681); `PROMOTED` requires a no-follow target stat with matching inode/owner/size **plus** both directory `fsync` returns (690-698). `certify` additionally rejects truthy non-booleans (`condition is not True`, 601). **Not met:** the rule's second half, "any ASSUMPTION is labelled and excluded from PASS". M-A is a labelled `UNVERIFIED` assumption sitting on the mandatory PASS path, ungated and unrecorded. |
| **L3** | **RESOLVED-IN-DRAFT** | `RENAME_NOREPLACE = 1` (60) is used at **all four** rename sites — probe success 484, probe collision 491, package promotion 688, receipt promotion 1316. No bare flag literal remains. |
| **L4** | **RESOLVED-IN-DRAFT** | Wording is accurate and does not overclaim. In the receipt payload itself: `'sri_proves': 'Identity to the reviewed lock, NOT publisher authenticity.'` (1264) and `'open_upstream_question': 'Dependency confusion for public-registry @animalabs/* remains open.'` (1265), with `does_not_prove` carrying all five v1 non-proofs (1266-1267). `ACQ-SUBPLAN.md` §10 matches and explicitly declines to resolve the question or alter the pinned URLs. Correctly framed as informational and open, not repaired. |

## (a) Paths to PASS without positive evidence; refusals that decay

**No path to `overall: PASS` or exit 0 without positive evidence.** Exit 0 requires
`success` from `write_manifest` (1372-1373), which returns `final_pass and
final_witness(...)` — `final_witness` **re-evaluated after** the manifest is fsynced,
no-replace-renamed and root-fsynced (1320), so a stale PASS body plus a late failure cannot
be accepted. `final_witness` (1216-1228) requires no refusal, no `stop`, writers stopped,
accounting certain, `attempts == len(fetches) <= 100`, a complete result inventory,
`0 < received_snapshot < BODY_CAP`, `0 < retained_snapshot < BODY_CAP`, every result typed
and `worker_verified`, `proof.verified(fetches)`, empty `PARENT_CLEANUP`, and time still
inside the original deadline. `proof.verified` in turn requires all 7 `REQUIRED_RUN` checks,
`set_outcome VERIFIED`, an exact file-proof inventory, `0 < read_bytes < BODY_CAP`, and all 8
`REQUIRED_RETAINED` checks per file with the **parent's own** digest equal to the lock
digest. Deleting any single check cannot default to success: the same predicates are applied
in the worker before promotion (682-683, 700-701), on result acceptance (816-819), at
`supervise`'s per-result gate (906), in `verify_retained_set`, and twice in `write_manifest`.
`PARENT_CLEANUP` non-empty with `final_pass` returns `False` before promotion (1313-1314).
Unknown/missing collapses to `MISSING_RESULT` through four independent routes (750-751,
800-802, 816-819, 970). `Outcome`/`Refusal` use `auto()` from 1, so no member is falsy and
the `stop or …` idioms at 957 and 970 are safe.

**Refusals that decay:** one real instance — **M-B** (a determined `REFUSED` becoming an
untyped `FAIL/INTERNAL_ERROR` on a receipt-write failure). Everything else I traced resolves
to a typed, closed-set, non-zero outcome: the worker's blanket handler → `INTERNAL_ERROR`
(713-714); `rename_probe`'s → `RENAME_PROBE_FAILED` (501-502); `verify_retained_set`'s →
`IO_ERROR` (1211-1212); `hash_retained_file`'s → `IO_ERROR` (1137-1138); `stopped_now`'s →
`False`, i.e. "still running", the conservative direction (775-776); `read_bound`'s `OSError`
→ `INPUT_IO` while preserving `INPUT_HASH` for digest failures (238-239, because `Refuse` is
not an `OSError`). Two narrow residuals are L-E (a raise inside `main`'s own `finally`) and
`rename_probe`'s and `safe_cleanup`'s `except BaseException`, which convert an operator
`KeyboardInterrupt` into a probe/cleanup failure — non-zero in every case.

## (b) v1 properties confirmed surviving in v2

I checked each against v2 line numbers rather than accepting the disposition table.

- **Total deadlines** — `deadline = min(start + REQUEST_SECONDS, aggregate_end)` from the
  **parent-recorded** start (584, 934-936); `remaining()` feeds every socket wait (594-598,
  used at 559, 563, 571, 573, 627, 632, 654) and is never a renewed 30 s; one-shot
  `ITIMER_REAL` with the inherited handler reset to `SIG_DFL` first (612-613) — armed before
  `getaddrinfo`, which is what actually bounds DNS; the parent re-checks the same absolute
  value (892) and maps `-SIGALRM` to `DEADLINE` (804).
- **1800 s aggregate, never renewed** — fixed once at 1333-1334 and threaded by value into
  `supervise`, `verify_retained_set` and `write_manifest`; no reassignment exists. It
  includes preflight (1365, 1368) **and** the new parent rehash (1056). The 5 s grace is
  absolute (1335) and admits no new request (916) or parent read (1056).
- **No retry / redirect / fallback** — one `getaddrinfo`, `addresses[0]`, one socket, one
  `connect` (562-574); `auto_open = 0` before the request (621); any 3xx → `REDIRECT` ahead
  of the 200-only certify (634-636); no retry loop, address fallback or hash-algorithm
  fallback (`grep` for `retry|fallback|follow_redirect` → only `auto_open`).
- **Strict TLS** — system CA via `create_default_context`, `minimum_version = TLSv1_2`,
  `check_hostname = True`, `CERT_REQUIRED` (615-618), with the **negotiated** version
  re-asserted to be 1.2/1.3 post-handshake and the two context flags re-read (622-626).
  `os.environ.clear()` runs in the parent (1362) and in each worker (614) **before**
  `create_default_context`, so `SSL_CERT_FILE`/`SSL_CERT_DIR` cannot redirect the trust store.
  Headers are a literal dict (629-631) — no cookie, auth or proxy value is reachable.
- **O_EXCL quarantine** — all creation via `exclusive()` with
  `O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW` 0600 (366-367) at 476, 649, 735, 1306; fresh root with
  `FileExistsError → ROOT_EXISTS` (524-527) on a verified mount (`st_dev` differs from
  parent, uid-owned, 0700, capacity in `(BODY_CAP, DISK_CAP]`, ≥256 free inodes, 519-523);
  stems built only from the row index and the **expected** digest (164-165), so no package
  name, version, URL or header text reaches a path; no `unlink` anywhere.
- **No extraction** — `grep` for `tarfile|zipfile|gzip|shutil|subprocess|exec(|eval(|pickle|
  __import__` → **zero** hits. Retained bytes are only hashed, never interpreted.
- **Operator slots unset / refusing** — all five are `None` (31-35) with no CLI or env
  override (`require(len(sys.argv) == 1)` at 1346), and `operator_slots()` refuses
  `UNSET_OPERATOR_SLOT` at 1345, **before** `establish_owned_scope`, the guard fork and any
  alarm arming. The artifact as delivered cannot arm the group killer.
- **Root rejected** — `type(RUN_UID) is int and RUN_UID > 0 and os.getuid() == os.geteuid()
  == RUN_UID` (360-361).
- Also surviving: `os._exit` at interpreter exit to avoid unbounded `multiprocessing` atexit
  joins (1417, modulo L-E); caps counted **before** write for the log (740-742), manifest
  (1304-1305) and inputs (229-234, whose rewritten read loop correctly detects an
  over-`INPUT_CAP` file by one byte); duplicate JSON keys and invalid JSON constants rejected
  (246-255); all 100 rows validated with both conflict directions resolved before any root
  creation or child (297-345).

## (c) New attack surface introduced by v2

1. **The parent now opens and reads 99 network-derived files** (`hash_retained_file`) — the
   largest new surface, and it is handled well: `O_NOFOLLOW|O_NONBLOCK`, `S_ISREG`, uid /
   `nlink == 1` / mode 0600, size bound, fixed 64 KiB reads, dual byte budgets, pre/post
   descriptor **and** path stat identity, and the bytes are only hashed — never parsed,
   decompressed or executed. No new privilege or interpreter is involved.
2. **Bounded directory enumeration** of a directory whose names are attacker-influenced only
   via the expected-digest naming scheme; the iterator is capped at 100 entries (1070),
   unknown names are recorded as evidence and never opened (1060), and `verified_names` runs
   twice. No adoption path.
3. **`quarantine/synthetic-rename-probe/` persists with four artifacts** inside the package
   root — L-D.
4. **The park introduces a ~1800 s window in which the parent holds the owned session open**
   with no work to do. This is the behavioural change with the widest blast radius, and it is
   where M-C bites.
5. **Three extra `renameat2` call sites** via `ctypes.CDLL(None)` (484, 491, 1316 in addition
   to 688). `rename_function()` is also now re-resolved inside `fetch_worker` (685) and
   `write_manifest` (1315); a `Refuse` raised from 384 in the worker would surface as
   `INTERNAL_ERROR` rather than typed, though the preflight probe makes it unreachable.
6. **A wider shared-memory contract** (6 `RawArray` slots, up from 5) — mitigated by the
   parent validating both masks against the closed enums before trusting anything
   (`bad_mask`, 810-811, feeding `accounting_certain` at 815 and the reject at 816).
7. No new import, subprocess, network endpoint, credential read or environment dependency is
   introduced. `multiprocessing` state is not inherited by the guard child, which is forked
   at 1351 — before `mp` is first used (875) and before the quarantine fds exist (1366), so
   it holds no quarantine descriptors. That ordering is correct and worth preserving.

## (d) The worker's three data gates stayed within data-only scope — confirmed

From `report.md:122-156`, the three receipts invoke only `sha256sum`, `sha256sum -c`, `cmp`,
`printf` and `jq`, the latter two inside `bash -c` with `set -e`. Reviewing the recorded
scripts: gate 1 hashes five bound paths; gate 2 re-verifies the v1 seal (4/4), hashes the
plan, and `cmp`s the immutable TSV against `<(jq -r … package-lock.json)` before a `jq`
grouping that reports `rows:100, dedup_count:99, url_conflicts:0, sri_conflicts:0`; gate 3
`cmp`s the carried-forward input binding and hashes the four v2 primaries. **No draft source
text reached any parser, interpreter, compiler, linter, import system, package manager or
test.** The only parsing is `jq` over the immutable lock JSON — a bound data input, not the
draft — and no network, npm/node, credential or git write appears. `set -e` plus `cmp`'s exit
status make a silent jq failure non-passing. Within scope, and the independently reproduced
`rows/dedup/conflicts` values match REVIEW1 gates 3-4 exactly. Note the correct caveat the
report makes itself: a data-gate exit 0 proves **none** of the proposed fetcher behaviours.

## Verification gates

No gate wrapper was used: this brief permits read and `grep` only, and an unwrapped read
produces no reusable receipt. What I actually ran: `git rev-parse HEAD`; `sha256sum -c
SHA256SUMS` in the drop; `sha256sum` on `SHA256SUMS`, `fetcher.py`, REVIEW1 and the AST
record; `wc -l`; `ls -laR`; `grep`/`sed` over the drop files; `grep`/`sed` over
`/usr/lib/python3.12/http/client.py` and `/usr/lib/python3.12/socket.py` (local stdlib
source, read-only, to substantiate M-A); and the one disclosed `python3` snippet described
above. **No execution, import, parse or syntax check of the draft; no network/DNS/TLS; no
npm/node; no git write; no write outside `$ORGASMIC_EVIDENCE_DIR`** apart from the disclosed
temp directory, which was removed.

## Unmet criteria / test gaps

1. **Name-resolution, attribute and arity validity are still unproven.** The operator AST
   record establishes `ast.parse` success on Python 3.12.3 — which closes REVIEW1's gap 1 for
   *syntax* and is real progress — but `ast.parse` does not resolve names, attributes or call
   signatures. As a partial offset I hand-checked arity at every dataclass construction and
   cross-function call site (`Result` 11/12 positional at 756-760, 813-815, 867-871;
   `Supervision` 9 at 980-982; `FileProof` 5 at 1149, 1195, 1273; `ParentProof` 4 at 1185,
   1213; `Cancellation` 4 at 782, 792, 850; `Task` 6 at 938; `Fetch` 5 at 342; `Row` 7 at 329;
   `fetch_worker` 8 at 936; `supervise`/`verify_retained_set`/`write_manifest` 6/6/6 at
   1370-1372; `hash_retained_file` 4 at 1197; `final_witness` 4 at 1232, 1320) and found no
   mismatch. That is static reading, not a parse, and does not cover attribute typos.
2. **No negative-path evidence exists for any refusal or outcome.** Twenty-three refusals and
   twenty-three outcomes remain design text over unexecuted code; v2 *grew* both sets.
3. **The whole M1 mechanism is unexercised** — barrier, enumeration, reopen, rehash, stat
   stability, set equality. It is the single largest new code mass and carries the new PASS
   gate, so an offline check should weight it first.
4. **`renameat2` availability and per-filesystem `RENAME_NOREPLACE` support are still
   unobserved** (REVIEW1 gap 3). v2 adds the probe that would detect this at zero cost, but
   the probe has never run.
5. **M-A is unverified in both directions** — neither that `response.fp.raw._sock` resolves
   on the target interpreter, nor that the deferred-fd `settimeout` behaves as reasoned.
6. **Kill, cancellation, park and guard races are unexercised**, including M-C, the
   `fork`-to-`SIG_DFL` window at 612, and D-state survivor handling.
7. **No empirical timing evidence** for the 30 s / 1800 s / 1805 s bounds.
8. **Filesystem headroom is still unmodelled** (REVIEW1 gap 7) — and M-B now gives that gap
   a sharper consequence than REVIEW1 recorded, since `ENOSPC` on the manifest write
   misclassifies the run.
9. **No `result.json` has ever been produced**, so the receipt schema is unvalidated against
   any consumer.

## Residual risk

- **Highest:** a first-ever runtime entry into 1417 lines whose name resolution has never
  been exercised, occurring inside an authorized window. Syntax is no longer the question;
  a `NameError` or attribute typo on a cold path still is, and at that moment it is
  indistinguishable from a substantive refusal.
- M-A makes the body-read path depend on CPython internals that no document treats as
  load-bearing, with no receipt field recording which path ran.
- M-B means the operator's view of a correctly-refused run can be replaced by
  `INTERNAL_ERROR` precisely when the mount is tight — the condition most likely to coincide
  with it.
- M-C leaves a ~1800 s window in which killing the parent silently disables the hard stop and
  abandons an owned survivor.
- The hard stop surfaces as signal 9 from one of three racing killers (L-A), so post-mortem
  attribution of a hard-stopped run is weaker than the exit-code design implies.
- Egress confinement is still explicitly **not** established by a hostname check
  (`ACQ-SUBPLAN.md` §4); DNS routing, resolver retransmission and privileged interference
  remain operator-boundary concerns outside the draft.
- Storage overcommit behind the bounded mount is not proved away.
- An interrupted run can still leave `verified/<stem>.tgz` with no manifest; §5's "a
  directory name alone is NOT a verdict" is stated but nothing on disk enforces it, and the
  promoted filename embeds the **expected** digest.
- Unchanged: SRI proves identity to the reviewed lock, not publisher authenticity; the
  `@animalabs/*` dependency-confusion question is open; no acquisition has occurred and none
  is authorized by this review.

## Fix directions

**Before a fetch go (not before the offline check):**
1. **M-A** — resolve the transport once before the read loop, assert it positively
   (`isinstance(transport, ssl.SSLSocket)`), give its absence a typed outcome, add a `Check`
   and a `private_transport_path_used` manifest field, and correct the "fallback" wording in
   both the comment and §4.
2. **M-B** — guard the `write_manifest` call so a raise preserves `supervision.refusal`
   (refusal → exit 2 with its own name; otherwise a typed receipt-write failure), and write
   the primary verdict to stderr **before** attempting the manifest.
3. **M-C** — make the guard child's exit conditional on nothing being left to reap rather
   than on parent liveness (owned PIDs or a `pidfd`/pipe closed only on a confirmed clean
   finish), and state the conditionality in §2/§6 if it is kept.
4. **L-A/L-B/L-C/L-D/L-E/L-F** — as described per finding; L-C (charge
   `max(grant, observed)` for any non-verified result) and L-D (list probe artifacts in the
   manifest) are the two worth doing regardless, since each converts a non-local invariant
   into a local one.

**Exact blockers for the separate scoped offline runtime/capability-check go: none.**
No finding above requires a fix first — all three MEDIUMs fail closed and none involves the
network, and the offline check is in fact the cheapest way to settle items 1-6 of the gaps
above. Two **preconditions** must be decided by the operator before that go opens, because
both produce new artifacts rather than being details:

- **Pick the seam, explicitly.** The draft correctly offers no CLI or env override for its
  five operator slots (31-35, 1346), so an offline check cannot reach `establish_owned_scope`,
  `rename_probe`, `fresh_root` or `hash_retained_file` **without either** filling slots
  (a new reviewed artifact under separate authority) **or** importing the module and calling
  functions directly with substitute `BINDINGS`/paths (also a new artifact, and it bypasses
  `main`'s ordering guarantees — the property most worth testing). Which one is a decision,
  not a detail. Do not let it be made implicitly at run time.
- **Keep it genuinely offline.** `fetch_worker` must not be reached; the capability check
  should target `renameat2` + `RENAME_NOREPLACE` on the candidate mount, `setsid` from the
  intended launcher context, the `response.fp.raw._sock` attribute chain on the target
  interpreter (statically, via a local TLS-less socket, not against the registry), and the
  M1 rehash path over locally fabricated files.

**Recommended zero-change first rung:** run the delivered artifact unmodified and confirm it
refuses with `{"overall":"REFUSED","reason":"UNSET_OPERATOR_SLOT"}` exit 2. That path touches
only lines 1342-1346 — no `setsid`, no fork, no alarm arming, no filesystem write, no
network — and it is the one behaviour the artifact as delivered is designed to exhibit. It
converts "never executed" into "executed once, refused as designed" at essentially zero risk,
and would also be the first real evidence that the module body and its 23-member enums
import cleanly.
