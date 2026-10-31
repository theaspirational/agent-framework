# Owned typing — final LOW-round report and verification continuation

## Changed

**Head: `3c95d166242892206b5e1e5d624b3c9ebb062323`.** Base of this fix round:
`d3230a69002b493fef94e501fbf5cfc9a211080b`, stacked on the reply-routing changes
(`29edcf8b`). No code changed in this continuation; no additional commit was
manufactured. Existing implementation commits remain local; no push, merge,
landing or dispatch close.

Evidence roots used below:
- **O**: `/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence` (the previous LOW run, including its draft report and all historical gates).
- **N**: `/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence` (this continuation and final report).

Read the full rereview in the earlier run (`O/rereview.md`, SHA-256
`d860108a3b2867f98a31ce11df7061647040fd82ff187121a4d67b4624f5977d`).
Implementation changes retained at the pinned head:
- Document/test the same turn's A → hint → B → A lockout: returning cannot adopt
  the retained host hint or restart at root.
- Associate the existing entry with its transport-owned connection/epoch pair;
  retire hints only for qualified actual registration removal. Stale entry,
  connection and epoch controls preserve replacement entries/hints/stamps.
- Refuse ambiguous same-connection/same-epoch re-registration cleanup, without
  an old-entry token or automatic ID-only fallback. Legacy entry/timer removal
  remains explicit; hint retirement without provenance is conservative.
- Preserve host hints on retained-registration close/tune-out/transient loss.
  Restore **base** shutdown behavior only for an ACTIVE UNOWNED indicator,
  requiring both the snapshotted entry and hint-object identity (`===`) to
  remain unchanged. Owned, newer and idle orphan hints stay preserved. The
  existing shared-channel shutdown assertion is byte-identical to base.
- Bound destination-keyed hint diagnostics to 256 stamps, independent 60-second
  windows, reaped on actual removal/shutdown. Eviction may allow an earlier
  repeated trace.
- Add the four-export Added fragment; extend the AST guard to destination
  expressions/locus following, owner comparison/interface and retirement/
  shutdown helpers. Add synthetic parsed-line/disconnect/close/error controls.

| Commit | Concern |
|---|---|
| `52bddcf9` | Returning-turn suppression docs/test |
| `4ec81fee` | Bounded destination-keyed diagnostics |
| `cce9e844` | Qualified registration/hint retirement |
| `d53656a2` | Added API fragment |
| `f0d9ec5c` | Expanded AST boundaries |
| `9cfce380` | Conservative same-pair provenance gap |
| `32f136d2` | Transport/disconnect provenance tests; legacy fixture dependency |
| `3c95d166` | Restore active-unowned shutdown behavior with snapshot guards |

All author/committer identities and co-author trailers are retained as requested:
Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>,
`Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. Current history/clean-state
and protected-file checks are in `pinned-delivery-state.txt`. Nine tracked
paths changed across the implementation round; no lockfile/generated files
were committed. Builds/fixture copies remain in each checkout's ignored dist,
not evidence.

**Attribution correction:** the thread carve-out is Soma's engineering
constraint under the programme/preservation contract. Calls on asks are the
task operator Tarn's, not a personal decision/sanction of the human owner
Vasyl. Source/docs and the PR body contain no internal operator names.

### Lifecycle qualification table (draft, bounded source/synthetic evidence)


`transportEpoch` is a **transport-boundary counter**, public at `src/mcpl/server-connection.ts:460`. Its sole increment is the transport-boundary reset at `:598-602`; the same object's reconnect calls it before handshake for required admission (`:2255`) or before adopting its replacement transport otherwise (`:2305`). Explicit close (`:2073`) and transport loss (`:2959`) also advance the boundary: it is not solely a successful-reconnect counter. No unrelated state/policy update increments it. Read-only audit: `O/identity-audit.txt`, `O/lifecycle-source-lines.txt`, `O/epoch-event-source-lines.txt`.

| Path | Original capture / delivery proof | Retirement | Witness / killed mutant or gap |
| --- | --- | --- | --- |
| Parsed register/changed controls | Original epoch captured in transport line closure `server-connection.ts:2573`; old-epoch drop `:2607-2610`; `:2684/:2687` → synchronous emit `:2739-2742`; registry calls `framework.ts:35156/:35171` occur before first await. Process controls `server-connection.ts:1290-1293` discarded at reset `:638-645`; flush boundary `:928-931` prevents an old held snapshot crossing. | `channel-registry.ts:1751-1758` synchronous removal before first await `:1830`, then `retireRegistration:2741+`. | `typing-transport-epoch`: old original line closure after same-object boundary reaches no registry handler and deletes nothing; fresh-line positive control does retire. Removing the actual transport epoch drop is killed. |
| Host disconnect | `framework.ts:34357-34358` captures connection/epoch at disconnect start, before closing; carries the same pair at `:34363` and `:34399` across awaits. | `channel-registry.ts:2715-2725` synchronous first pass and guarded retirement. | Actual `runDisconnectMcplServer` with delayed synthetic close, replacement connection AND same-object new epoch: later call still has the original pair, replacement survives. Looking up the current pair at deletion is killed. |
| Connection close report | `framework.ts:35454-35459` calls `transportClosed`, NOT `removeServer`; no entry/hint retirement. | None; retains registration/hint, force-retires local typing timers subject to stop grant. | Actual wired late close reports after both kinds of replacement preserve entry/hint. Mutating close to retire the current registration is killed. No claim of generation safety for its other state changes/timer cleanup. |
| Connection error report | `framework.ts:35437-35443` only emits an error trace. | None. | Actual wired late error reports in both replacement cases preserve entry/hint; no retirement calls. |
| Same connection + same epoch, re-registration, public pair but no old-entry token | Indistinguishable external delayed intent; **remaining provenance gap**. | Refuses both entry/hint retirement; no fallback. | Two explicit same-pair tests; dropping ambiguity refusal is killed. This also refuses legitimate later pair-qualified removal within that epoch. |
| Arbitrary external callbacks without an original pair / missing registration provenance | **Unsupported conservative gap**; no fabricated current pair or ID fallback for guarded callbacks. | Guarded calls refuse; an explicitly invoked legacy ID-only call retains its legacy entry/timer removal but never retires an opaque hint. | Missing-provenance and separate legacy changed/server tests. Full generation safety is not claimed. |

No production admission/transport changes were made to pass these tests. The transport seam uses a recording transport and the existing boundary-reset/wiring methods; it does not perform a handshake, spawn a child, reconnect a live service or qualify an adapter. Protected-file diff is empty; inbound-admission hash matches A, B, round base and head (`O/hygiene.txt`; current `pinned-delivery-state.txt`).


## Verification Gates

### Fixed plan, inheritance and disclosed method change

The matched plan was predeclared in `O/report.md` before execution: ONE base/head
full-suite pair per Node, sequentially at `AF_TEST_CONCURRENCY=8`, followed by
four fixed isolated workspace-file cells. There was no retry-until-green.

The completed Node 22.23.3 base/head payloads were checked in O and **not
rerun**. Base has exit 0. Head's exact status is **summary complete, wrapper
exit unknown (session killed)**: its complete 9832-test summary and final
`head=3c95d166... clean=yes` marker are present, but no final gate outcome
receipt. Only `.started` exists. This was explicitly reconciled by Tarn under
Soma's binding condition; no wrapper exit is inferred or invented.

No old logs existed for the remaining six cells. N ran each exactly once,
sequentially; the Node 22.12.0 base was already running when the method changed
and was **not** interrupted/restarted. It has no whole-command bound and no
new capture cap. This makes the 22.12.0 full-suite pair a **DISCLOSED METHOD
DIFFERENCE**, not an identical pair: base unbounded, head bounded. Base was not
replayed to even it out.

All later cells use `timeout --signal=TERM --kill-after=60s 3000s` around the
full head typecheck/build/test payload, or 900s for an isolated file, **inside**
the same `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`.
Both members of each isolated pair use the same policy. Capture drains output
but retains less than 64 MiB, reserving 64 KiB for gate/wrapper headers;
truncation is recorded. Any timeout/truncation would be **inconclusive**, not
relabeled as a test failure. None occurred in these five bounded cells.
The old running base script's open inode was left unchanged; future paths
were atomically replaced (`method-change.txt`). No project code changed.

Commands:
- Full cells: `orgasmic dispatch gate NAME -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 RUNNER NODE_BIN`.
- O full runner: `O/run-suite-8.sh`; N full runner: `N/run-suite-8.sh` (base used its original inode; head uses timeout + `capped-command.py` + `full-payload.sh`). Payload: `npm run typecheck && npm run build && npm test`, concurrency 8, NODE_OPTIONS unset.
- Isolated: the same gate/scope with `N/run-isolated.sh NODE_BIN`; inner payload is `node --import ./dist/test/helpers/force-exit-blocking-stdout.js --test --test-force-exit --test-timeout=600000 dist/test/workspace-three-way.test.js`, one file, sequential cells.
- Node bins: `/opt/node-v22.23.3-linux-x64/bin` and `/tmp/task-pk8rc-tools/node-v22.12.0-linux-x64/bin`.

Exact argv, checkout/cwd, commit, dirty/clean start, outcomes, compiler errors,
and every failure/cancellation name are catalogued in **[all-gates.md](all-gates.md)**,
[verification-observations.tsv](verification-observations.tsv) and its JSON.
These include **all 35 gate/footer observations**, not only successful ones.
No unknown count is substituted with zero. Dated observed line-count/tail
progress and serial starts/ends are in `remaining-verification.wrapper.log`
and the native transcript. All six continuation cells exited 0.

### Predeclared full-suite observations (501 suites each)

Order: base/head 22.23.3, then base/head 22.12.0. All have the pinned code
inputs; O's completed payloads are inherited evidence, not fresh N executions.

| Gate/log | Commit | Exit | Total | Pass | Fail | Skip | Cancelled |
|---|---|---:|---:|---:|---:|---:|---:|
| [r3-matched-base-22233](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-matched-base-22233-01M67MDHYXWBJ0AFQRT79ZXY5A.log) | `d3230a69` | 0 | 9802 | 9739 | 0 | 63 | 0 |
| [r3-matched-head-22233](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-matched-head-22233-01M67NHR10J87WAS9Q6F6VE3GC.log) | `3c95d166` | unknown† | 9832 | 9769 | 0 | 63 | 0 |
| [r4-matched-base-22120](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-matched-base-22120-01M67PRWN14TBRY7K2DKZD1S2Z.log) | `d3230a69` | 0 | 9802 | 9739 | 0 | 63 | 0 |
| [r4-matched-head-22120](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-matched-head-22120-01M67QTC9J7289TYSKY5HCG3HZ.log) | `3c95d166` | 0 | 9832 | 9769 | 0 | 63 | 0 |

† **Summary complete, wrapper exit unknown (session killed).** No rerun.

### Fixed isolated workspace-three-way pairs (36 suites each)

Every cell is bounded at 900s + 60s grace, cap 64 MiB, one file at a time.

| Gate/log | Commit | Exit | Total | Pass | Fail | Skip | Cancelled |
|---|---|---:|---:|---:|---:|---:|---:|
| [r4-isolated-base-22233](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-isolated-base-22233-01M67S2Q9769W0CE5NXX68AWP0.log) | `d3230a69` | 0 | 407 | 407 | 0 | 0 | 0 |
| [r4-isolated-head-22233](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-isolated-head-22233-01M67SFMV0879944SXT272YA6Q.log) | `3c95d166` | 0 | 407 | 407 | 0 | 0 | 0 |
| [r4-isolated-base-22120](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-isolated-base-22120-01M67SVJ17Y0XP4H9MR2CBNCA3.log) | `d3230a69` | 0 | 407 | 407 | 0 | 0 | 0 |
| [r4-isolated-head-22120](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-isolated-head-22120-01M67T3F84N5H53TJ1A0M1KRVJ.log) | `3c95d166` | 0 | 407 | 407 | 0 | 0 | 0 |

Both base/head pairs have identical test counts and outcomes. Final-head full
summaries have fail=0 and cancelled=0; no final cancellation needs a base
reproduction. Earlier cancellations below are not hidden or relabeled, and
later success establishes no cause for them.

### Capture/bound receipts

| Bounded cell | Deadline + grace | Captured payload bytes | Whole gate-log bytes | Truncated / timeout |
|---|---|---:|---:|---|
| [r4-isolated-base-22120](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-isolated-base-22120-01M67SVJ17Y0XP4H9MR2CBNCA3.log) / [isolated-3705513.json](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/capture-status/isolated-3705513.json) | 900s + 60s | 124883 | 125407 | no / no |
| [r4-isolated-base-22233](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-isolated-base-22233-01M67S2Q9769W0CE5NXX68AWP0.log) / [isolated-3649293.json](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/capture-status/isolated-3649293.json) | 900s + 60s | 132755 | 133279 | no / no |
| [r4-isolated-head-22120](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-isolated-head-22120-01M67T3F84N5H53TJ1A0M1KRVJ.log) / [isolated-3712196.json](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/capture-status/isolated-3712196.json) | 900s + 60s | 124945 | 125469 | no / no |
| [r4-isolated-head-22233](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-isolated-head-22233-01M67SFMV0879944SXT272YA6Q.log) / [isolated-3689275.json](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/capture-status/isolated-3689275.json) | 900s + 60s | 134098 | 134622 | no / no |
| [r4-matched-head-22120](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/gate-r4-matched-head-22120-01M67QTC9J7289TYSKY5HCG3HZ.log) / [full-3550956.json](/home/orgasmic/.orgasmic/runs/run-01M67PQ853E43HZ3FBZBQSDAB9/evidence/capture-status/full-3550956.json) | 3000s + 60s | 4069241 | 4069761 | no / no |

### Separate historical concurrency-32 / parallel observations

These full runs used `O/run-suite.sh`, `AF_TEST_CONCURRENCY=32`, the same Node
bins and 16G/zero-swap scopes. They were unbounded whole commands, with no new
capture cap. Multiple suites overlapped; they are NOT the matched sequential
comparison and are not replaced by it. Names containing “final”/“proven” below
are historical names at the actual commits shown, not the delivered head.

| Gate/log | Commit | Exit | Total | Pass | Fail | Skip | Cancelled |
|---|---|---:|---:|---:|---:|---:|---:|
| [r3-base-22233](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-base-22233-01M67JMYRJ43XYXKD0GRKTXWYN.log) | `d3230a69` | 1 | 9754 | 9690 | 0 | 63 | 1 |
| [r3-base-22120](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-base-22120-01M67JMZWWWMTVCTF07GCWN8XQ.log) | `d3230a69` | 1 | 9754 | 9690 | 0 | 63 | 1 |
| [r3-head-22233](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-head-22233-01M67K1NKR20MTMRW0PCADM4J7.log) | `f0d9ec5c` | SIGTERM 15 | not reported | not reported | not reported | not reported | not reported |
| [r3-head-22120](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-head-22120-01M67K1PVQBQBACJDYPATBXW5Q.log) | `f0d9ec5c` | SIGTERM 15 | not reported | not reported | not reported | not reported | not reported |
| [r3-final-head-22233](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-final-head-22233-01M67K7YGZTKCGKTMEZV2V164H.log) | `9cfce380` | 1 | 9776 | 9708 | 3 | 63 | 2 |
| [r3-final-head-22120](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-final-head-22120-01M67K7ZTS40MB6MJ459VX35HB.log) | `9cfce380` | 1 | 9779 | 9711 | 3 | 63 | 2 |
| [r3-proven-head-22233](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-proven-head-22233-01M67KK41XVAMP0J7R86XNC3TK.log) | `32f136d2` | 1 | 9830 | 9766 | 1 | 63 | 0 |
| [r3-proven-head-22120](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-proven-head-22120-01M67KK5ATAWKCHQJ35VSE5RY5.log) | `32f136d2` | 1 | 9830 | 9766 | 1 | 63 | 0 |

Failure/cancellation reconciliation:
- Both base AF32 runs cancelled `dist/test/workspace-three-way.test.js` at its
  600000ms Node file timeout (fail=0, cancelled=1). That cancellation was also
  observed on intermediate `9cfce380`; cause remains unknown/load-dependent,
  not a causal diagnosis from later runs.
- Both `9cfce380` runs failed the two disconnect-order scaffolds because their
  fake registry lacked `getServer`, plus **“stopping everything forgets each
  channel's typing metadata, so the channel registered again types without it”**.
  The first two were corrected by adding `getServer: () => null` without changing
  assertions. The last was a real loss of base active-unowned shutdown semantics,
  restored at `3c95d166` with snapshot guards; its assertion was NOT rewritten.
- Those same `9cfce380` runs also cancelled `dist/test/prose-drafts.test.js` and
  `dist/test/workspace-three-way.test.js` at 600000ms. The prose-drafts cancellation
  was not reproduced in the recorded base AF32 observations: **unresolved
  historical discrepancy**, with no further debugging or cause claim.
- Both `32f136d2` runs had the one active-unowned shutdown assertion failure,
  no cancellations. They predate its correction.
- Both `f0d9ec5c` attempts were intentionally SIGTERM-stopped after the same-pair
  clarification. Receipt outcome is signal 15 (shell status 143); no complete TAP
  totals exist. Test counts/cancellations are **unknown**, not zero.

### Every other development/scoped execution

These are old Node 22.23.3 development/probe runs, not replacements for the
pinned-head full suites. Exact filters/commands and actual dirty inputs are
in the ledger. “not reported” means no Node footer (compile failed before
running tests, or a Python mutation driver with separate subprocess logs).

| Gate/log | Commit | Exit | Total | Pass | Fail | Skip | Cancelled |
|---|---|---:|---:|---:|---:|---:|---:|
| [r3-ast-boundaries](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-ast-boundaries-01M67K148BV0S82PV1TJ9V9HE1.log) | `d53656a2` | 0 | 4 | 4 | 0 | 0 | 0 |
| [r3-base-workspace-probe](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-base-workspace-probe-01M67KJF2TNKT0CMF05J2SGPFZ.log) | `d3230a69` | 1 | 389 | 388 | 0 | 0 | 1 |
| [r3-delivery-mutations](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-delivery-mutations-01M67MC660C8XWZMR2JNMF2PJW.log) | `3c95d166` | 0 | not reported | not reported | not reported | not reported | not reported |
| [r3-destination-throttle](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-destination-throttle-01M67JV5V98F615E36A9JB8VYE.log) | `52bddcf9` | 0 | 25 | 25 | 0 | 0 | 0 |
| [r3-final-mutations](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-final-mutations-01M67K8E1W6Z0KMAPBRRC298W3.log) | `9cfce380` | 0 | not reported | not reported | not reported | not reported | not reported |
| [r3-lifecycle-proof-complete](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-lifecycle-proof-complete-01M67KH98HDTAZGCDVY5AWV5DZ.log) | `9cfce380` | 0 | 7 | 7 | 0 | 0 | 0 |
| [r3-mutations](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-mutations-01M67K2QDKX74HZBC3YXRQX6C2.log) | `f0d9ec5c` | 0 | not reported | not reported | not reported | not reported | not reported |
| [r3-proven-mutations](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-proven-mutations-01M67KKK2XQ1G6RKZ24C2JG7S1.log) | `32f136d2` | 0 | not reported | not reported | not reported | not reported | not reported |
| [r3-proven-scoped](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-proven-scoped-01M67KXRBQ4XSHBS0GKRWTGFZJ.log) | `32f136d2` | 0 | 52 | 52 | 0 | 0 | 0 |
| [r3-qualified-retirement](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-qualified-retirement-01M67JYC3W6QW98V2KBW8FR26D.log) | `4ec81fee` | 1 | not reported | not reported | not reported | not reported | not reported |
| [r3-qualified-retirement-checked](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-qualified-retirement-checked-01M67JZSNKNJ5TM0GKXX143QC1.log) | `4ec81fee` | 0 | 41 | 41 | 0 | 0 | 0 |
| [r3-qualified-retirement-final](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-qualified-retirement-final-01M67JZP81VGSWFNZKCMP4ZKS7.log) | `4ec81fee` | 1 | not reported | not reported | not reported | not reported | not reported |
| [r3-registration-cleanup](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-registration-cleanup-01M67JQN4S9D40393R5KRS1A52.log) | `52bddcf9` | 0 | 31 | 31 | 0 | 0 | 0 |
| [r3-returning-turn](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-returning-turn-01M67JP6NEHAHTGB93PS295A4R.log) | `d3230a69` | 0 | 1 | 1 | 0 | 0 | 0 |
| [r3-same-pair-gap](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-same-pair-gap-01M67K7HA6A2WRD9WJWWS78G45.log) | `f0d9ec5c` | 0 | 47 | 47 | 0 | 0 | 0 |
| [r3-shutdown-snapshot/1](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-shutdown-snapshot-01M67M914Z9ZX4WVH606Y0876F.log) | `32f136d2` | 0 | 54 | 54 | 0 | 0 | 0 |
| [r3-shutdown-snapshot/2](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-shutdown-snapshot-01M67M914Z9ZX4WVH606Y0876F.log) | `32f136d2` | 0 | 1 | 1 | 0 | 0 | 0 |
| [r3-transport-proof-checked](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-transport-proof-checked-01M67KFKMEDTEFVEFBHRQXT4HE.log) | `9cfce380` | 0 | 5 | 5 | 0 | 0 | 0 |
| [r3-transport-proof-probe](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-transport-proof-probe-01M67KF7TGTC44H8HQJEHKB74Q.log) | `9cfce380` | 1 | not reported | not reported | not reported | not reported | not reported |

- `r3-base-workspace-probe` was a single-file command while other full suites
  ran, not one of the fixed isolated cells: exit 1, 389 total, 388 pass,
  0 fail, 0 skip, 1 cancelled (600000ms file timeout).
- `r3-qualified-retirement` and `r3-qualified-retirement-final` failed typecheck
  with missing required descriptor `direction` (TS2741). No tests ran. Corrected.
- `r3-transport-proof-probe` failed typecheck because the synthetic transport
  lacked a public constructor (TS2674). No tests ran. Corrected.
- `r3-registration-cleanup` was an early connection-only prototype, withdrawn
  after epoch qualification; its 31-test pass is not final safety evidence.
- `r3-shutdown-snapshot` has TWO Node invocations: 54 new/guard tests and the
  unchanged existing shutdown test (1). Both pass; neither dirty receipt is
  passed off as a fresh final-head receipt.

### Mutation receipts — all batches, then pinned-head guarantees

The Python gate outcome 0 means all mutants were killed, **not** that mutated
Node tests passed. Each Node subprocess exits 1 with assertion failures;
all builds succeeded before the test was run. Counts below aggregate child
Node runs only (not a fabricated single TAP footer).

| Mutation batch/gate | Mutants | Build exits | Test exits | Total | Pass | Expected assertion failures | Skip | Cancelled |
|---|---:|---|---|---:|---:|---:|---:|---:|
| O/mutations / [r3-mutations](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-mutations-01M67K2QDKX74HZBC3YXRQX6C2.log) | 12 | 0 (all) | 1 (all) | 19 | 0 | 19 | 0 | 0 |
| O/mutations-final / [r3-final-mutations](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-final-mutations-01M67K8E1W6Z0KMAPBRRC298W3.log) | 13 | 0 (all) | 1 (all) | 21 | 0 | 21 | 0 | 0 |
| O/mutations-proven / [r3-proven-mutations](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-proven-mutations-01M67KKK2XQ1G6RKZ24C2JG7S1.log) | 16 | 0 (all) | 1 (all) | 25 | 0 | 25 | 0 | 0 |
| O/mutations-delivery / [r3-delivery-mutations](/home/orgasmic/.orgasmic/runs/run-01M67JH84WHFD8T7T4938H7ZWM/evidence/gate-r3-delivery-mutations-01M67MC660C8XWZMR2JNMF2PJW.log) | 18 | 0 (all) | 1 (all) | 27 | 0 | 27 | 0 | 0 |

The final delivery batch is at the unchanged `3c95d166` inputs: **18/18 build-valid
mutants killed**, 27 expected assertion failures across those selected tests,
0 pass/skip/cancelled. Every one of the **59 historical mutation subprocesses**
has its exact total/pass/fail/skip/cancelled, test exit, failure names and log
path in [all-mutants.tsv](all-mutants.tsv) / JSON. Per-mutation patches, build
and test logs are under O's corresponding batch directory. No mutation is
counted as killed because of a compiler error.

| Mutation removed/broken | Load-bearing killing assertion |
| --- | --- |
| Qualified hint retirement | Identified changed/server removal → re-register: old hint must not suppress the new registration |
| Entry identity comparison | Late old-entry retirement, same connection/epoch, spares replacement |
| Connection comparisons | Late changed teardown after connection replacement preserves entry and hint |
| Epoch comparisons | Late changed teardown after same-object epoch change preserves entry and hint |
| Replace original pair by current lookup in retirement | Both stale connection/epoch controls preserve replacement |
| Delete hints for legacy ID-only calls | Both legacy removal tests retain unproven hint |
| Force cleanup deletes live unowned hints | Closed/tuned-out/transport-close live-hint controls retain hint |
| Diagnostic key reduced to bare channel name | Yield on one server-qualified destination cannot silence another with the same channel name |
| Diagnostic size eviction | 256-entry bound under churn |
| Diagnostic retirement/shutdown reaping | Changed/server/shutdown stamp cleanup controls |
| Returning-turn hint refusal | Same owner A → hint → B → A stays without root restart/refresh |
| Connector literal injected into followTurnLocus | Expanded AST guard rejects production literal |
| Same-pair ambiguity refusal | Changed/server same-pair re-registration conservatively preserves entry/hint |
| Original transport epoch guard | Old line closure after same-object boundary never reaches registry |
| Disconnect re-reads latest pair | Both asynchronous disconnect controls require the captured pre-close pair |
| Close report retires latest registration | Late same-object close/error control preserves replacement and makes no retirement calls |
| Shutdown drops its entry snapshot comparison | Replacement entry after snapshot preserves the hint |
| Shutdown drops its hint-object comparison | A hint replaced after the snapshot survives |



### Inherited evidence and unchanged inputs

The rereview/design reads and earlier rebase explain the stack, but no earlier
round pass is implied by resuming. O's final mutation batch and the matched
22.23.3 payloads use exactly the unchanged delivered head (base cells use
exactly d3230a69); log headers, source history and clean markers were checked.
Other historical probes are explicitly intermediate/dirty and not reusable
final-head passes. All new requested cells are fresh N gate executions.
The transport/inbound-admission/reply runtime protected diff is empty;
the existing shutdown assertion is unchanged (`pinned-delivery-state.txt`).
The in-repo typing modes, including disabled, remain covered in the full suite.
No new project convention/gotcha applies; inherited project baseline had none.

## Unmet Criteria

No remaining requested verification cell is omitted or replayed. No final-head
assertion failures/cancellations, bounded timeouts or log truncation remain.
**The inherited 22.23.3 wrapper exit remains unknown** after the stall; its
complete test summary is reported exactly, and it was not rerun as directed.
Historical failures/cancellations remain explicit above, including the
unresolved intermediate prose-drafts discrepancy; they are not overwritten.

Deliberately incomplete / BLOCKED-FOR-SCOPE paths: exact-thread typing and a
turn-qualified host hint contract; same-connection/same-epoch re-registration
without an old-entry token; arbitrary external callbacks without original
provenance. Conservative refusal/legacy separation is implemented and tested,
not a claim of full generation safety. No new snapshot API, identity subsystem,
thread field or feature flag was invented.

## Residual Risk

- Retained external/legacy/shutdown idle hints may accumulate or suppress
  automatic typing after re-registration. A same turn may remain without
  typing after moving away/back. Guarded same-epoch removals may be refused
  even when legitimate. No two validated topic leases are claimed.
- Diagnostic eviction can permit a trace sooner than 60 seconds; size remains
  bounded at 256 regardless of lifecycle provenance.
- Close reports preserve entries/hints, but their other confirmation/timer
  cleanup is not promised generation-safe. Wire stops are grant-gated,
  best-effort and unacknowledged; local retirement is not platform clearance.
- Idle-TTL broad dropped-turn settlement, lack of already-settled-hook coverage,
  and unowned interval/sweeper limitations remain notes-only. Stale authority
  checks occur at the private-notice boundary, not continuous polling.
- Old orphan fixture **PID 3192524**, Node 22.12.0 `long-line-stubborn`, was
  observed at 00:47Z, parent systemd user, alive since about 23:44Z at 0% CPU.
  Tarn identified it as an earlier test-run leak and instructed **do not kill**.
  It was left untouched (`inherited-fixture-leak.txt`); no globally idle/clean
  machine or leak-free historical suite claim is made.
- Source and synthetic transport evidence only; no live adapter/provider or
  deployment qualification. No inferred cause for earlier cancellations.

BEGIN PR BODY
## Summary
Stacked on the automatic reply-routing changes.

- Add turn-owned typing leases with frozen server-qualified destinations and
  successor-safe stops.
- Preserve unbound host hints without borrowing them for automatic typing;
  document the incomplete thread path and move-away/back suppression.
- Retire hints only with captured transport/registration provenance. Refuse
  ambiguous same-epoch cleanup; preserve base active-unowned shutdown behavior.
- Bound diagnostics per destination, expand the connector-neutral AST guard,
  and document the new APIs and host-only force cleanup.

## Verification
- Full test summaries on Node 22.23.3 and 22.12.0: **9769 pass / 0 fail /
  63 skipped / 0 cancelled** each (9832 tests). The 22.23.3 summary is complete
  but its wrapper exit is unknown after a session kill; no pass exit is invented.
- Fixed isolated base/head workspace pairs: **407 pass / 0 fail / 0 skip /
  0 cancelled** on each Node. Final-head 18 build-valid mutants killed.
- The 22.12.0 full pair has a disclosed method difference: base unbounded,
  head bounded. No bounded timeout or log truncation occurred. Historical
  parallel cancellations and corrected failures remain in the report.

## Remaining scope
Exact-thread typing and turn-qualified host hints remain unimplemented.
Legacy/ambiguous provenance conservatively retains state; no full generation
safety or platform-clearance claim. No live adapter qualification.
END PR BODY
