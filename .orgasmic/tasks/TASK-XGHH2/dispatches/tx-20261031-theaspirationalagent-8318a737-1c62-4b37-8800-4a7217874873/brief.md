TASK-XGHH2: DRAFTING ONLY. PRIVATE. Operator Tarn; scope from qualifier Soma (Slack 1793441074, 1793441124). Not an owner decision.

PURPOSE
Draft the DX9KM stage-1 execution blueprint v2, plus the controller, producer and unit-wrapper scripts, for the UNQUALIFIED local A+B+D+I7 composition.
- Candidate pin: CANDIDATE_HEAD = f8af03a852c85daf9bb8079937b994fe5419ca20, statically reviewed only.
- Nothing you write may be executed by you, and nothing may run package code.

ABSOLUTELY FORBIDDEN
- Running node, npm, npx, bun, tsc, any build, test or install, the drafted controller, wrapper or unit, systemd-run, unshare, setpriv, catatonit, sudo
- Network access, acquisition of anything
- Any git write. Do NOT commit; leave the worktree tracked tree untouched and clean.
- Editing files outside $ORGASMIC_EVIDENCE_DIR
- Reading or printing any credential, env file or token
Allowed: reading files and git objects, sha256sum of the read-only inputs below, `--help`/man text of system binaries, writing drafts into $ORGASMIC_EVIDENCE_DIR/drafts/.
Write a progress note to $ORGASMIC_EVIDENCE_DIR/progress.md at least every 5 minutes. **First draft checkpoint within 20 minutes**: write whatever exists to drafts/ and finalize nothing; just keep going.

VERIFIED INPUTS (read in full; verify sha256 first; any mismatch means STOP and ask). Directory /srv/review-drop/tarn-rtaln-20261030/:
- DX9KM-EXECUTION-BLUEPRINT-v1.md — 466d863e2aa6477389b6debbe72ddb814093d62364b67897216a9238f5f9220b (v1: pins, scripts, runtimes, DIAG2 runner hashes, focused files)
- ABDI7-F0-SEAL-RECORD.md — efe75ae6e4c4084b61f45aab658dfd559bd58217a716632a3d6eda02f1011e2d (sealed closure /srv/ci-fixtures/abdi7-closure-20261031, sealed Node /srv/ci-fixtures/node-v22.12.0-linux-x64, origin run, gaps)
- ABDI7-CONTAINMENT-PROBES-v1.md — 227c5f14ef7296e8e6ba5cbeb40fc13c03f9275f2cde092e1506b38c3a4d91c5 (observed and failed isolation facts)
Also these, in /srv/review-drop/: TASK-DX9KM-LOW1-R4.md (ac8de901...), TASK-DX9KM-LOW1-R4-REVIEW1.md (13897d60...), TASK-DX9KM-LOW1-R4-ERRATUM1.md (7a4093a5...).
Additional verified facts from the operator:
- /usr/bin/catatonit is package catatonit, `tini version 0.1.7_catatonit`, sha256 43e9b836ca7631672f12d0610cd574875b62d236dfd62e3b86751f35862e5eba. Its role as PID-1 reaper is UNTESTED; a separate operator canary is testing it.
- unshare a23c8863860669003dc4660039fe642f5795c8c2195898ebc5d01afa1ac3d11c; setpriv 62ec0120791f3afcfb689fed52384ec2b0accc6e118a6b9a1d6fcfa7450aaf37; systemd-run de28cc5757d3789efa5f6fed5659893410469f68b42175d4531f5b34d3a09e16; systemd 255.4-1ubuntu8.18.
- Payload uid/gid 1002 (orgasmic). Host: 16 CPUs, 86 GiB RAM.
- Whether RuntimeMaxSec is enforced for this unit type is UNTESTED (operator canary pending).

QUALIFIER REQUIREMENTS (binding; each must be addressed in a numbered section, or named as an exact remaining blocker)

1. Candidate slot. The controller embeds CANDIDATE_HEAD = f8af03a8 and REFUSES to run unless a separate, operator-supplied, hash-pinned go file exists and matches. The drafted default is refusal. Stage-1 execution is not authorised.

2. Root control path.
   - Transient system unit only, root-started by the operator controller. ExecStart: catatonit as PID 1 inside a fresh PID namespace, then setpriv dropping to 1002:1002 with --clear-groups, --no-new-privs, empty inheritable and bounding caps, then the payload.
   - Give the EXACT argv and the order of unshare/catatonit/setpriv. Justify where catatonit sits relative to setpriv, and name the gap if catatonit can't be PID 1 after unshare --fork.
   - No package or source script runs as root. Wrapper and unit files live root-owned 0444 under a fresh /srv/ci-fixtures/abdi7-runner-<date>/ directory, hash-bound, outside any worker-writable tree.
   - No persistent unit, no enablement, no daemon or firewall change.

3. Isolation properties: PrivateNetwork, PrivateTmp, PrivateIPC, PrivateDevices, ProtectHome=tmpfs, ProtectSystem=strict, TemporaryFileSystem=/run and /var/run, RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6, NoNewPrivileges, LockPersonality, RestrictSUIDSGID, MemoryMax, MemorySwapMax=0, TasksMax, CPUQuota, RuntimeMaxSec, plus explicit BindReadOnlyPaths and BindPaths.
   - Effective-state evidence: the controller records `systemctl show` from OUTSIDE while the unit runs. Inside, only ns readlinks, mountinfo, /sys/class/net, and synthetic canaries (an owned env-marker process and an owned unix socket placed outside before the run). Never connect to real sockets.
   - Keep explicit what is SHARED: user, uts and cgroup namespaces, and /sys read-only.

4. One original aggregate deadline: 35 minutes, monotonic, set once by the controller at start. It covers copy, hash, every unit, handoff, capture and teardown.
   - Each unit's RuntimeMaxSec and inner timeout are derived from the remaining time. Never reset per stage.
   - Remaining-time handling: too little left means skip with status DEADLINE, not overrun.
   - Record per-step statuses: producer exit, capture, timeout 124/137, cap hit, survivors.

5. Stages, each in a FRESH private scratch, with a closed write inventory:
   (a) Staged source: `git archive f8af03a8` into scratch, hashed. node_modules is a READ-ONLY bind of the sealed closure. Any write into node_modules is a STOP.
   (b) Build: tsc plus the literal postbuild and pretest effects from package.json, enumerated exactly (chmod 755 on the two dist files, the quickjs.wasm copies, the fixture .mjs copies into dist/test/fixtures). No lifecycle scripts, no npx fallback, no implicit acquisition. Run the tools via explicit paths, e.g. sealed node plus node_modules/typescript/bin/tsc (verify the path in the closure manifest).
   (c) Seal: after the build AND the pretest copies, make a closed hash manifest (path, sha256, mode) of the exact artifact tree.
   (d) Focused test: a FRESH test scratch with the artifact tree itself RO-bound and re-hashed against the manifest before any test, recording producer and consumer hashes and permissions. The focused files are from v1, confirmed against f8af03a8 by git ls-tree (list each, mark present or absent); at minimum context-only-reply-admission. The DIAG2-style test command uses --test-concurrency=8 and a whole-command timeout.
   (e) Declaration-consumer check: specify it, or label exactly as deferred.
   - Aggregate bounds count all writable mounts, retained output, scratch copies and logs (give MB numbers). Logs are capped. Name every writable path.

6. Closure regime (b), PLAN ONLY.
   - The original sealed closure and its receipts are preserved as their own regime.
   - Draft an exact-lock reconstruction: package-lock df14aa0a... (verify it from the F0 record) with NO version updates; `npm ci --ignore-scripts` (or an equivalent) from tarballs fetched by a bounded acquisition plan; HTTPS registry.npmjs.org only; the tarball list from the lock with an SRI sha512 per entry, verified before extraction; a bounded count, size and time; no cache reuse, or a recorded empty cache.
   - Enumerate the hasInstallScript packages (esbuild, fsevents) and what disabling their scripts means for tsc/test.
   - Acquisition itself needs a separate go. Say so.

7. Survivors and teardown: whole-unit cgroup stop from outside, survivor listing by pid, start time and cgroup, exact-owned only.

DELIVERABLES in $ORGASMIC_EVIDENCE_DIR/drafts/:
- BLUEPRINT-v2.md
- controller.py (draft)
- unit-wrapper.sh (draft)
- producer-build.sh and producer-test.sh (drafts)
- closure-reconstruction-plan.md
- SHA256SUMS
Every script starts with a header comment: DRAFT — NOT REVIEWED — MUST NOT BE EXECUTED.

The final report lists every deliverable with its sha256, every remaining blocker or UNKNOWN, and any fact you could not verify (marked UNVERIFIED). Never invent a pin, hash, path or line number.