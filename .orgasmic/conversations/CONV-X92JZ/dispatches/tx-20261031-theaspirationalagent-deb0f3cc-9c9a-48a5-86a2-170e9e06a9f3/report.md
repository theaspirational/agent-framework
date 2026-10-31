# CONV-X92JZ — Independent read-only review: ABDI7 ACQ-v1 (input binding + full fetcher)

Operator Tarn; scope from qualifier Soma (Slack 1793444684). **This review is not a
fetch go, not a gate PASS and not a readiness claim. No authority is granted.**
All paths cited are relative to `/srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1/`.

## Binding

- HEAD `f8af03a852c85daf9bb8079937b994fe5419ca20` — matches.
- `cd /srv/review-drop/tarn-rtaln-20261030/ABDI7-ACQ-v1 && sha256sum -c SHA256SUMS` → **4/4 OK**.
- `SHA256SUMS` = `ff9bad0e1785c2a9ebdd308925e3ca106a1b91aae72066d51cf6173202598272`; `fetcher.py` = `3484804954c49a185c7e2242a32649fffdab4f8b37c33997a548bca0a79c6ac7` — both match.
- Inputs: lock `df14aa0a…22578`, TSV `0eff27af…a9701` — both match.

Read in full: `fetcher.py` (851/851 lines), `ACQ-SUBPLAN.md`, `inputs-binding.md`, `report.md`.
The draft was **not** executed, imported, parsed, compiled or syntax-checked; no network,
DNS or TLS probe; no git write. Everything below is static reading plus `jq`/`sha256sum`
over the immutable lock and TSV.

## Verdict

The draft is **fit for a scoped acquisition go once the HIGH and the two
verification-gap MEDIUMs are fixed**, and once the operator choices in
*Fix Directions* are settled. This is the most disciplined acquisition draft in this
series: the deadline model is genuinely total and monotonic, the refusal and outcome
sets are closed, and I found **no path to PASS without positive per-fetch evidence**.
The defects are concentrated in *runnability* and *independence of the final check*, not
in the acquisition rules.

The single largest residual is not in the list below: **this file has never been parsed
by any Python implementation.** The review scope forbade even `py_compile`, so a syntax
error, a typo or a Python-version incompatibility anywhere in 851 lines would surface for
the first time inside an authorized run window. Any go must be gated on a parse/compat
check performed under separate authority before the fetch window opens.

## Findings

### HIGH

**H1 — `fetcher.py:799` `os.setsid()` hard-fails in the most likely operator context, reported as an opaque `INTERNAL_ERROR`.**
`os.setsid()` returns `EPERM` when the caller is already a process-group leader. Under an
interactive shell with job control, every foreground pipeline's first process *is* its
group leader, so a hand-run `python3 fetcher.py` raises `OSError` here. It is caught by
the blanket handler at `fetcher.py:840-843`, which deliberately suppresses the exception
text and emits `{"overall":"FAIL","reason":"INTERNAL_ERROR"}` with exit 1.
*Failure scenario:* operator obtains a fetch go, runs the draft interactively inside the
1800 s window, and gets an indistinguishable-from-a-bug `INTERNAL_ERROR` with no
diagnostic, no manifest and no indication that the run location was the problem. The run
window is consumed. It works under a non-interactive shell (script/cron/systemd), so this
is silently run-location dependent.
Fail-closed (no fetch occurs), but it blocks the delivered artifact from running at all
in the default context, and `ACQ-SUBPLAN.md:§2` states "Parent, workers and the aggregate
guardian remain in one private process group" as a delivered property.
*Fix:* tolerate `EPERM` when isolation already holds — if `os.getpgrp() == os.getpid()`
the process is already a group leader and its group contains only itself and its
children, which satisfies the requirement; otherwise refuse with a **typed**
`Refusal` (e.g. `UNSUPPORTED_PLATFORM`), never a bare `INTERNAL_ERROR`. A double-fork
before `setsid()` is the alternative. Either way, add a distinct typed refusal so this
is never confused with an internal fault.

### MEDIUM

**M1 — `fetcher.py:724-731` + `fetcher.py:528` PASS rests on the child's self-reported digest; the parent never re-hashes the promoted file.**
`Result.verified()` (`fetcher.py:163-171`) compares `result.digest` — bytes the worker wrote
into `digest_shared` — against `fetch.digest.hex()`. `write_manifest` re-applies the same
predicate, so the *same* child-supplied value is checked three times rather than checked
once independently. Nothing in the parent ever opens `verified/<stem>.tgz` and hashes it.
*Failure scenario:* a child-side logic defect (not malice) that publishes `hasher.digest()`
on a path where the promoted file's bytes differ — e.g. a future edit that reorders
`hasher.update` relative to `write_all`, which are already separated at
`fetcher.py:507-516` — yields `VERIFIED`, the full 11-check set and a PASS manifest while
the file on disk is wrong. `ACQ-SUBPLAN.md:§6` disclaims only "arbitrary malicious
rewrites of the verifier itself", which does not cover this.
*Fix:* after promotion, have the **parent** re-open each `verified/<stem>.tgz` with
`O_NOFOLLOW`, stream-hash it under the remaining aggregate deadline, and require equality
with the lock SRI before `final_pass`. This is the one change that converts PASS from
"the worker says so, thrice" into independent positive evidence. Bound it by a cap and a
deadline so it cannot itself become unbounded work.

**M2 — `fetcher.py:819` + `fetcher.py:540` preflight proves the `renameat2` *symbol* exists but never that `RUN_WHERE` supports `RENAME_NOREPLACE`.**
`rename_function()` in preflight only resolves the glibc symbol (absent → clean
`UNSUPPORTED_PLATFORM` refusal, `fetcher.py:352-355`). `RENAME_NOREPLACE` additionally
requires per-filesystem support; where it is unsupported the call returns `-1/EINVAL`.
*Failure scenario:* operator provisions the 544 MiB mount on a filesystem without
`RENAME_NOREPLACE` support. Preflight passes, the first tarball is fetched and verified
over the network, promotion at `fetcher.py:540-542` raises `OSError` → `IO_ERROR` → first
failure sets `stop` → whole run FAILs. Real network traffic and a consumed go for a
condition detectable in preflight at zero cost.
*Fix:* inside `fresh_root()`, create and `RENAME_NOREPLACE`-rename a zero-byte probe file
between `partial/` and `verified/` (and a second rename onto an existing name, asserting
`EEXIST`) before the first request; refuse `FILESYSTEM_BOUNDARY` on failure. This also
positively proves the no-overwrite semantics the design depends on.

**M3 — `fetcher.py:576` the worker's outcome is published *last*, after three close operations that can raise.**
In the worker `finally`, `shared[0] = outcome.value` is the final statement, preceded by
`os.fstat`/`os.close(fd)` (`fetcher.py:573-575`), `response.close()` and
`connection.close()`. If any of those raises, `shared[0]` is never written.
*Failure scenario:* all 99 tarballs stream, verify and promote correctly; on the last
worker `connection.close()` raises `OSError` on the TLS socket. `shared[0]` stays at its
initialized `MISSING_RESULT` (`fetcher.py:685`) and the child exits non-zero, so
`result_from_worker` (`fetcher.py:614-616`) returns `MISSING_RESULT`, `stop` is set, and
the entire run reports FAIL with 99 correctly promoted files on disk.
Fail-closed, so not a safety hole — but the blast radius is a total run loss and the fix
is a one-line reorder.
*Fix:* assign `shared[0] = outcome.value` as the **first** statement of the `finally`, and
wrap the three close calls in their own suppressed block.

**M4 — `fetcher.py:507-508, 570-571` `observed_sha512` is the digest of bytes *received*, not bytes *retained*, and the manifest does not say so.**
`hasher.update(block)` at `fetcher.py:508` precedes the cap test at `fetcher.py:510-514`
and the `write_all` at `fetcher.py:515`, and the `finally` re-publishes
`hasher.digest()` unconditionally at `fetcher.py:570-572`.
*Failure scenario:* a body trips `FILE_CAP`/`BODY_CAP`. The triggering chunk is correctly
**not** retained, but it *is* hashed. The manifest then reports an `observed_sha512`
alongside `partial_candidate` (`fetcher.py:757-762`) for a `.partial` file whose bytes
hash to something else. An investigator who hashes the partial to identify it gets a
mismatch against the draft's own receipt and cannot tell whether that indicates tampering.
The same divergence occurs on any `write_all` failure. `ACQ-SUBPLAN.md:§6` documents
*counter* lag but not *digest* divergence.
*Fix:* either maintain a second hasher fed only after a successful write, or rename the
field to `observed_body_sha512_received` and state in `ACQ-SUBPLAN.md:§6` that it is only
comparable to the partial file when `outcome is VERIFIED`.

**M5 — `fetcher.py:508, 521` `budget_lock` is orphaned by any worker SIGKILL; the peer worker's indefinite block is bounded only implicitly.**
`budget_lock` is a `multiprocessing` semaphore. `stop_process` (`fetcher.py:619-626`)
SIGKILLs workers; a worker killed inside `with budget_lock` never releases it. The parent
correctly refuses to take the lock itself (`fetcher.py:646` comment), but the *other*
concurrent worker (`CONCURRENCY = 2`) will then block forever at `fetcher.py:508`.
*Failure scenario:* worker A is killed at its 30 s per-request deadline while holding the
lock; worker B hangs at its next chunk accounting. B is only rescued because the kill set
`stop`, so the next supervisor iteration TERM/KILLs B within `TERM_GRACE`. Correct today,
but the safety of the design rests on an undocumented invariant — if a future edit lets
the scheduler continue past a single kill, or raises `CONCURRENCY`, surviving workers
deadlock until the 1805 s hard stop.
*Fix:* document the invariant explicitly in `ACQ-SUBPLAN.md:§4`, or make the accounting
lock-free (per-worker `RawValue` slots summed by the parent), which removes the
kill-while-holding-lock class entirely.

**M6 — `fetcher.py:619-626` `stop_process` proceeds while the child may still be alive.**
After `terminate()`+`join(0.25)` and `kill()`+`join(0.25)`, the function returns without
re-checking `is_alive()`. A task blocked in an uninterruptible kernel wait survives
`SIGKILL` until the wait completes.
*Failure scenario:* a worker in D-state on a stalled write survives both grace windows;
the parent records `DEADLINE`, deletes it from `active`, and later writes `result.json`.
The surviving worker then resumes and continues appending to its `partial/` file and
mutating `total_seen`/`total_retained` *after* the receipt was written — so retained bytes
on disk can exceed the 512 MiB accounted aggregate, bounded only by the 1805 s
`killpg`. The run correctly reports FAIL, so this is a disk-bound/evidence-consistency
defect, not a PASS hole.
*Fix:* record a `cancellation_confirmed` boolean per worker from a final `is_alive()`
check and surface it in the manifest, so a receipt never implies that all writers stopped
when they may not have.

### LOW

**L1 — `fetcher.py:600` latent `TypeError` in `blank_result`.**
`bytes(digest).hex() if digest is not None and shared[4] else ''` subscripts `shared`
without testing it for `None`, unlike the two preceding operands. No current call site
passes `digest` non-`None` with `shared is None` (verified across
`fetcher.py:605,616,654,660,671,708,710,752,754`), so this is latent only. *Fix:* guard
on `shared is not None and digest is not None and shared[4]`.

**L2 — `fetcher.py:501, 534, 545` three of the eleven "required checks" are certified with the literal `True`.**
`Check.EOF`, `Check.FLUSHED` and `Check.PROMOTED` pass `True` into `certify`, so they
record "control flow reached this line" rather than an independent measurement. This is
*sound* — reaching `fetcher.py:534` does prove `os.fsync` did not raise — and the real
gate is the SRI/digest/set-equality triple, so there is no PASS hole. But
`ACQ-SUBPLAN.md:§5` calling all of them "positive certificates" overstates three of
eleven. Note `Check.EOF` in particular cannot fail: a zero-byte 200 response certifies
EOF and is caught only later by the SRI compare. *Fix:* soften the subplan wording, or
make `Check.EOF` conditional on `shared[2] > 0`.

**L3 — `fetcher.py:540-542, 777` `RENAME_NOREPLACE` is passed as the bare literal `1`.**
The value is correct, but an off-by-one here (`2` = `RENAME_EXCHANGE`) would silently
convert the no-overwrite promotion into a swap while every surrounding check still
passed. *Fix:* a module-level `RENAME_NOREPLACE = 1` constant.

**L4 — informational: the closure resolves four `@animalabs/*` scoped packages from the public registry.**
Scope distribution over the 100 bound rows: `@esbuild` 26, `@typescript` 20,
`@discordjs` 8, `@babel` 4, **`@animalabs` 4**, `@sapphire` 3, `@modelcontextprotocol` 3,
`@types` 2, remainder unscoped. Acquisition is safe regardless: each row is pinned to a
literal URL *and* a canonical SHA-512 SRI, so any substituted artifact fails
`Check.SRI` and the run FAILs closed. Flagged only because whether internal-looking
`@animalabs/*` names *should* resolve on `registry.npmjs.org` is an upstream
dependency-confusion question that this acquisition phase neither raises nor answers.

## Verification Gates

No gate wrapper was used: the brief permits only data reads, and an unwrapped read
produces no reusable receipt. Everything below is data analysis over the **immutable**
lock and TSV plus `sha256sum`. **No draft execution, import, parse, compile or
syntax check; no network/DNS/TLS; no npm/node/tsc; no tests; no git write.**

1. **Bundle seal** — `sha256sum -c SHA256SUMS` in the drop dir → `4/4 OK`. `SHA256SUMS`
   and `fetcher.py` hashes match the brief exactly.
2. **Input binding** — `sha256sum` on the lock and TSV: both match the brief.
3. **Independent TSV regeneration (brief check 1)** — `jq -r '.packages | to_entries[] |
   select(.key != "") | [.key,.value.version,.value.resolved,.value.integrity] | @tsv'`
   piped into `cmp` against the immutable TSV → **exit 0, `BYTE_EQUALITY=PASS`**, no
   normalisation. Reproduces `inputs-binding.md`'s claim independently.
4. **Dedup (brief check 1)** — `jq -Rn --rawfile` grouping over the TSV:
   `rows=100`, `fields_per_row=[4]`, `dedup_count=99`, `url_conflicts=0`,
   `sri_conflicts=0`, `missing_url=0`, `missing_sri=0`, `non_sha512=[]`, `multi_sri=0`,
   `bad_prefix=[]`; the sole duplicate group is `@discordjs/collection` `2.1.1` at
   `node_modules/@discordjs/rest/node_modules/@discordjs/collection` **and**
   `node_modules/@discordjs/ws/node_modules/@discordjs/collection`. Matches the brief and
   `inputs-binding.md` exactly.
5. **SRI form (brief check 1)** — all 100 base64 bodies decode to **exactly 64 bytes**
   (`uniq -c` → `100 64`). `validate_sri` (`fetcher.py:253-262`) additionally pins the
   literal form `sha512-[A-Za-z0-9+/]{86}==` and re-encodes to reject non-canonical
   padding, so "exactly one `sha512-` with 64 decoded bytes" is enforced structurally.
6. **Validator-vs-real-data conformance** — against the bound lock: 0 keys failing the
   `fetcher.py:286-288` key regex; 0 versions failing the `fetcher.py:295-297` semver
   regex; 0 URL paths failing the `fetcher.py:243-249` path regex; **no entry carries an
   explicit `name`** (so the `fetcher.py:291-293` derive-and-agree rule is always the
   derived path); no duplicate `node_modules/*` JSON keys; `lockfileVersion` 3; root `""`
   key present; 101 packages → 100 non-root rows. All three inputs are far under
   `INPUT_CAP` (50463 / 21081 / 8289 bytes), and **no component of any input path is a
   symlink**, so the `O_NOFOLLOW` descriptor walk at `fetcher.py:177-193` can reach them.
   Conclusion: `validate_inventory` would admit exactly 100 rows / 99 fetches on the bound
   inputs — the validator is neither over- nor under-tight for its actual input.
7. **Path hygiene (brief check 2)** — across all 100 resolved paths: zero occurrences of
   `//`, `/./`, `/../`, a trailing `/`, `%`, `\`, `?` or `#`; all 100 match
   `^https://registry\.npmjs\.org/`. The draft rejects **all** percent escapes
   (`fetcher.py:245`) rather than decoding then re-checking — strictly stronger than
   traversal decoding, and the real inventory needs no escapes.
8. **Absence sweep** — `grep -nic` over `fetcher.py`: `tarfile` 0, `zipfile` 0, `gzip` 0,
   `shutil` 0, `subprocess` 0, `popen` 0, `npmrc` 0, `netrc` 0, `cookie` 0,
   `Authorization` 0, `token` 0, `getenv` 0, `retry` 0, `rmtree` 0,
   `follow_redirect` 0, `unlink` 1 (a comment stating partials are *not* unlinked,
   `fetcher.py:568`). No extraction, no subprocess, no credential/cookie/`.npmrc` read, no
   retry, no deletion anywhere.

### Brief checks resolved as satisfied (read, not probed)

- **URL rules (2)** — `fetcher.py:236-250`: scheme `https` exactly; `netloc` restricted to
  `registry.npmjs.org` or that host `:443`; `hostname` and `port` re-checked independently
  of `netloc`; `username`/`password` must be `None`; `query`/`fragment` empty **and** the
  raw `?`/`#` characters rejected; ASCII-only with controls and DEL excluded; no rewrite or
  canonicalisation performed. Proxies: `http.client` consults no proxy environment, and
  `os.environ.clear()` runs in both the parent (`fetcher.py:819`) and each worker
  (`fetcher.py:452`) **before** `ssl.create_default_context` at `fetcher.py:453`, so
  `SSL_CERT_FILE`/`SSL_CERT_DIR` cannot redirect the trust store. Headers are an explicit
  literal dict (`fetcher.py:467-470`) — no cookie or auth header is reachable.
  Any 3xx → `REDIRECT` (`fetcher.py:473-474`) before the 200-only `certify`
  (`fetcher.py:475`); `auto_open = 0` (`fetcher.py:460`) blocks `http.client` reconnection;
  one `getaddrinfo`, `addresses[0]`, one TCP attempt, no fallback
  (`fetcher.py:401-414`); no retry loop and no hash fallback anywhere. TLS: system CA via
  `create_default_context`, `minimum_version = TLSv1_2`, `check_hostname = True`,
  `CERT_REQUIRED`, and the negotiated version is re-asserted to be 1.2/1.3 post-handshake
  (`fetcher.py:461-466`).
- **Quarantine (3)** — the filename stem is `f'{index:03d}-{digest.hex()}'`
  (`fetcher.py:147-149`) built **only** from the first original row index and the expected
  SRI digest; package name, version, URL and response headers never reach a path. All file
  creation goes through `exclusive()` (`fetcher.py:336-338`) with
  `O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW` mode `0600`, which cannot adopt or overwrite an
  existing name, including a symlink. The root is fresh: `mkdir('quarantine')` with
  `FileExistsError → ROOT_EXISTS` (`fetcher.py:374-377`), on a verified mountpoint
  (`st_dev` differs from the parent, uid-owned, mode `0700`, `fetcher.py:368-373`).
  Partials are never unlinked (`fetcher.py:568`). Promotion happens only after the
  streaming SHA-512 equals the SRI (`fetcher.py:528`) **and** the pre-promotion check set
  is complete (`fetcher.py:536-537`). No extraction anywhere (gate 8).
- **Deadlines (4)** — the 30 s bound is a **total monotonic deadline**, not a resetting
  socket timeout, enforced three independent ways: (a) the worker computes
  `deadline = min(start + 30, aggregate_end)` from the *parent-recorded* start
  (`fetcher.py:423`) and every socket wait receives only `remaining()`
  (`fetcher.py:430-434`, used at `fetcher.py:409-412, 467, 472, 497`); (b) a **one-shot**
  `ITIMER_REAL` armed at `fetcher.py:449` with the disposition reset to `SIG_DFL` at
  `fetcher.py:448`, so the kernel terminates the worker even while blocked in libc — armed
  *before* `getaddrinfo`, which is what actually bounds DNS; (c) the parent re-checks the
  same absolute value at `fetcher.py:652` and the exit status `-SIGALRM` is mapped to
  `DEADLINE` at `fetcher.py:604-605`. Two subtleties are handled correctly: `fork` resets
  itimers, so no inherited parent timer fires in a worker; and resetting the inherited
  `hard_stop` handler to `SIG_DFL` at `fetcher.py:448` is what stops a worker's own 30 s
  timeout from `killpg`-ing the entire group. The 1800 s aggregate is fixed once at
  `fetcher.py:785-786` and never renewed; the 5 s grace is absolute
  (`fetcher.py:801-816`). Bytes are counted before retention per file and in aggregate
  (`fetcher.py:507-516`), the triggering chunk is not written, and the ≤2×64 KiB = 128 KiB
  overshoot applies to the *observed* counter only — retained bytes cannot exceed the cap.
  `Content-Length` is never the bound: the body is read from the raw post-header stream to
  connection EOF via `response.fp.read1` (`fetcher.py:489-517`, deliberately bypassing
  `HTTPResponse.read`), with a mismatch → `LENGTH_MISMATCH` (`fetcher.py:518`), so both
  short and long bodies are detectable. `CONCURRENCY = 2`. Request cap is pinned to the
  deduplicated count (`fetcher.py:319`, plus the `attempts` guard at `fetcher.py:681-683`);
  log, manifest and input caps all count encoded bytes before writing
  (`fetcher.py:584-594, 770-772, 203-206`). **Unbounded libc DNS is named** in
  `fetcher.py:457-458`, `ACQ-SUBPLAN.md:§3` ("OS resolver retransmission policy is not
  controlled by this Python draft") and `report.md` Residual Risk — and it is in fact
  bounded by (b) and (c).
- **Outcomes (5)** — both sets are closed `IntEnum`s (`fetcher.py:60-108`) and match
  `ACQ-SUBPLAN.md:§6` and `report.md` verbatim. `auto()` starts at 1, so no enum member is
  falsy and the `stop or …` idioms at `fetcher.py:708,710` are safe. Unknown/missing
  collapses to `MISSING_RESULT` via three independent routes: an unparseable `shared[0]`
  (`fetcher.py:607-610`), a nonzero exit code or an unknown check bit or a `VERIFIED`
  proposal failing re-validation (`fetcher.py:614-616`), and `setdefault` backfill
  (`fetcher.py:710`). **Deleting a final check cannot yield PASS:** `Result.verified()`
  requires `checks == REQUIRED` (all eleven) *plus* digest equality *plus*
  `retained == observed < FILE_CAP`, and that predicate is applied in the worker before
  promotion (`fetcher.py:536-537`), on result acceptance (`fetcher.py:615`), in
  `passed` (`fetcher.py:714-719`) and again in `write_manifest`'s independent
  `pass_witness` (`fetcher.py:726-730`). Removing any single site still leaves a
  positive-evidence requirement. A partial manifest cannot pass: `final_pass` is returned
  only after `result.json.partial` is fsynced and `RENAME_NOREPLACE`-promoted
  (`fetcher.py:773-779`), and a hard kill leaves only the `.partial` name. Operator slots
  are all `None` (`fetcher.py:29-32`) and `operator_slots()` refuses
  `UNSET_OPERATOR_SLOT`. **Note the ordering is right:** that refusal at `fetcher.py:797`
  precedes `setsid`, the guardian fork and any `killpg` arming, so the artifact *as
  delivered* cannot even arm the process-group killer.
- **Process safety (6)** — `os.setsid()` (`fetcher.py:799`) runs before the hard stop is
  armed, so both `killpg` call sites (`fetcher.py:790`, `fetcher.py:816`) target a private
  session group containing only this process and its descendants; a caller can never be
  signalled. Worker cancellation uses `Process.terminate()`/`kill()` (single pid), not a
  group signal. No `kill(-1)`, no signal to a parent pid. Waits are bounded: `join(0.25)`
  twice (`fetcher.py:620-624`), `os._exit` at interpreter exit to avoid
  `multiprocessing`'s unbounded atexit joins (`fetcher.py:848-851`). Exception paths do not
  mask failure — the blanket `except BaseException` handlers resolve to
  `INTERNAL_ERROR`/`MISSING_RESULT` (`fetcher.py:565-566, 700-702, 840-843`), never to
  success. **Running as root is impossible:** `operator_slots()` requires
  `RUN_UID > 0` *and* `os.getuid() == os.geteuid() == RUN_UID` (`fetcher.py:331-332`).
  Identity and uid remain **UNSET**.
- **Claims (7)** — the five non-proofs (npm cache import, extraction safety,
  ignore-scripts install, esbuild usability, benign bytes) appear in the manifest payload
  itself (`fetcher.py:747-749`), `ACQ-SUBPLAN.md:§7` and `report.md`. I found **no
  overclaim**: every document states the draft was never executed/parsed and that runtime
  properties are UNVERIFIED, and `report.md` explicitly labels its checks "not
  execution/test gate receipts".

## Unmet criteria / test gaps

1. **`fetcher.py` has never been parsed by any Python implementation** (prohibited by this
   brief and by the producing brief). Syntax, name-resolution and version compatibility
   across all 851 lines are unproven. This dominates every other gap.
2. **No negative-path evidence exists for any refusal or outcome.** All nineteen outcomes
   and seventeen refusals are design text plus unexecuted code. Nothing demonstrates that
   a 3xx, a `Transfer-Encoding` response, a truncated body, an SRI mismatch, a cap trip or
   a kill actually produces the typed result claimed.
3. **The promotion no-overwrite property is untested** (see M2) and
   `RENAME_NOREPLACE`-via-`ctypes` behaviour is unobserved.
4. **`response.fp.raw._sock` (`fetcher.py:496`) depends on CPython-private internals.** The
   fallback is correct for current CPython — `getresponse()` does set `connection.sock` to
   `None` when `Connection: close` makes the response `will_close`, which is exactly the
   case the code anticipates — but it is unverified and version-fragile. An
   `AttributeError` there resolves to `INTERNAL_ERROR` (fail-closed), so the risk is run
   loss, not unsafety.
5. **Concurrency, kill and cancellation races are unexercised**, including M5 and M6.
6. **No empirical timing evidence.** That the 30 s / 1800 s / 1805 s bounds hold under real
   DNS, TLS and disk latency is asserted, not measured.
7. **Filesystem capacity headroom is unmodelled.** The `(512 MiB, 544 MiB]` window
   (`fetcher.py:370-371`) leaves ≤32 MiB for 99 retained bodies plus a 1 MiB log, a 2 MiB
   manifest, inodes and any kept `.partial` files. Coherent on paper and `ACQ-SUBPLAN.md:§4`
   declines to assume the headroom, but no sizing evidence exists — the real tarball total
   is unknown without network access.

## Residual risk

- **Highest:** a first-ever parse of 851 unexecuted lines occurring inside an authorized
  fetch window (gap 1). A trivial syntax error is indistinguishable at that point from a
  substantive refusal.
- H1 makes the run location outcome-determining in a way no document states, and the
  deliberate suppression of exception text means the operator gets no signal.
- M1 leaves the final SRI verdict resting on a worker's self-report rather than on an
  independent parent-side re-hash.
- Byte accounting is correct but *advisory* after a failed kill (M6): disk contents can
  exceed the accounted aggregate while the receipt already says FAIL.
- Egress confinement is explicitly **not** established by an HTTPS hostname check
  (`ACQ-SUBPLAN.md:§2`); DNS routing, resolver retransmission and privileged interference
  remain operator-boundary concerns outside the draft.
- Storage overcommit behind the bounded mount is not proved away.
- An interrupted run can leave `verified/<stem>.tgz` present with no manifest. The
  directory split plus the `.partial` suffix is the only on-disk marking, and promoted
  filenames embed the *expected* digest — so a later reader must treat
  `quarantine/` as unverified absent a PASS `result.json`. `ACQ-SUBPLAN.md:§5` states this
  ("a directory name alone is NOT a verdict"), but nothing on disk enforces it.
- Unchanged by this review: no acquisition has occurred, and none is authorized.

## Fix directions

**Minimal fixes before a scoped acquisition go:**
1. **H1** — tolerate `setsid` `EPERM` when `os.getpgrp() == os.getpid()`; otherwise refuse
   with a typed `Refusal`, never a bare `INTERNAL_ERROR`.
2. **M1** — add a parent-side re-hash of every promoted `verified/*.tgz` against the lock
   SRI, bounded by the remaining aggregate deadline, as a precondition of `final_pass`.
3. **M2** — add a `RENAME_NOREPLACE` probe (including an asserted `EEXIST` on an existing
   name) inside `fresh_root()` before the first request.
4. **M3** — publish `shared[0]` as the first statement of the worker `finally`; suppress
   errors from the close sequence.
5. **M4** — separate the received-bytes digest from the retained-bytes digest, or rename
   the manifest field and document the restriction.
6. **M5/M6** — document the kill/lock invariant (or drop the shared lock for per-worker
   counters), and record a `cancellation_confirmed` flag per worker in the manifest.
7. **L1-L3** — guard `blank_result`, make `Check.EOF` non-vacuous or soften the subplan
   wording, and name the `RENAME_NOREPLACE` constant.
8. **Gate the go on a parse/compat check** of `fetcher.py` performed under separate
   authority *before* the fetch window opens — this is the prerequisite, not a fix.

**Operator choices that must be settled before any run** (all currently UNSET; none is
this review's to make):
- **Run location** — `RUN_WHERE`, an existing dedicated mount, uid-owned, mode `0700`,
  reported capacity in `(512 MiB, 544 MiB]`, ≥256 free inodes, no symlink in its path,
  and on a filesystem proven to support `RENAME_NOREPLACE`. Provisioning and mounting are
  explicitly not performed by the draft. **Also, per H1, the invocation context itself**
  (non-interactive shell / systemd unit vs. an interactive shell) **is a decision, not a
  detail.**
- **uid** — `RUN_UID`, nonzero, matching both real and effective uid; root is rejected by
  construction and must stay rejected.
- **Filesystem provisioning** — size the mount against a real tarball-total estimate for
  the 99 pairs rather than against the 512 MiB application cap alone (gap 7).
- **`RUN_IDENTITY`** and **`REVIEWED_FETCH_AUTHORITY`** — an explicit independent
  acquisition go reference. Filling these produces a new artifact that needs its own
  review.
- A reviewed **OS/egress boundary**, since the draft's hostname check does not confine DNS
  or routing.
