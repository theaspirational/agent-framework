# AF-scope — per-item batch isolation fix

## Changed

Base B: `29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04`. Starting head: `47f3b4f2195d2ff544815ea29a410c3a335864ba`. Qualified fix head: `39c76401f1be9191e5f62f66b497828d4f30fd56`.

Two local commits, per concern:
- `b52dd8c419b2272f65d4517bea8f504b20aa6edb`: runtime isolation, documentation and fix fragment.
- `39c76401f1be9191e5f62f66b497828d4f30fd56`: real-path regression tests, including the original batch preprobe.

Both author and committer are `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`; both include `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. See `fix-commit-identities.txt`. No push, merge, dependency/lockfile, typing/C, persisted schema or public wire change. Builds modified ignored outputs only.

### API and fix

The existing opt-in API remains `inboundAdmission.registrationScope = {timeoutMs, project}`, with `bind(key, registrations?)`, immutable `lookup(channelId)` snapshots and synchronous `current(ref)`. No mutable or private registry is exposed. Accepted generations and lifecycle still originate in the real ChannelRegistry; no tap-derived registry, native parent/thread interpretation or lazy fallback is added.

The internal `RequiredIngress.forItem?()` factory now forks only the registration guard. Each incoming item captures its own registration before A. Every fork retains the original transport-event admission/key/view; it never captures a new connection epoch. The helper combines the original outer host/framework check with the item's check. The B consumer carries the factory through using the same consumer, transport signal and diagnostic connection. Existing post-A/B currentness checks consume that item's guard.

Thus removing m1's registration cannot poison m2 on another current registration, cannot lend m1's valid scope to unknown/unreadable m2, and cannot refresh any old-epoch item into a replacement transport. Same-registration removal still refuses both items. With the opt-in guard absent, the helper returns the identical ingress object (including undefined).

### Diff file:line (starting head → fix head)

`changes.diff` contains the full patch, 7 files, 159 insertions / 2 deletions.

| Location | Change |
| --- | --- |
| `src/mcpl/inbound-admission.ts:94-95` | Optional internal fork factory declaration only. No RequiredAdmission implementation change this round. |
| `src/mcpl/registration-view.ts:138-139,151-158` | Name the frozen wrapper; factory creates a fresh capture closure on the same admission/view. Helper preserves outer checks as well as item checks; off-profile identity return. |
| `src/mcpl/reply-admission.ts:31` | Propagate the optional factory through the unchanged B consumer/transport context. |
| `src/mcpl/channel-registry.ts:1,1886,1889` | Import helper; retain batch admission; fork per item before existing validation. All existing RequiredAdmission handler statements remain unchanged. |
| `docs/registration-scope-view.md:71-73` | Document separate per-item refs and invariant transport provenance. |
| `changelog.d/registration-batch-isolation.fixed.md:1` | Describe the fixed isolation defect. The original required `registration-scope-view.added.md` fragment remains present. |
| `test/registration-batch-scope.test.ts:1-139` | 18 committed regression tests described below. |

No existing A/B checks, readiness/epoch checks, grants, verdicts, target sidecars or registration ordering were removed or weakened. The only inbound-admission edit is the additive optional interface field above; no grant/verdict logic edit was needed.

### Semantic correspondence to frozen T1 §4

The contract, host design and synthetic fixture remain pinned to `bff8c46e3a4c403f62b738cead317863d43fca9c`, not moving heads. Fixture SHA-256 remains `70a1827c21722b6056ba209928434877f4d4ea729338793c4d95a9e5c5126381`.

| T1 requirement | Implementation and evidence |
| --- | --- |
| Opt-in read-only accepted registration identity | Existing lookup/current-only view over authoritative accepted sidecars; no mutable registry, new wire field or trace-built registry. Profile-off helper returns exactly its input. |
| Exact connection/epoch K and accepted generation R | Each batch keeps its transport-event K/view. Each item owns its R capture. Epoch/removal/replacement/ancestor invalidation remains synchronous. Real reconnect tests and current-generation/epoch mutants discriminate these boundaries. |
| Detached immutable descriptors and verified scope | Existing frozen data snapshots remain unchanged; mutable-reference mutant still killed at fix head. Candidate refs remain noncurrent until validation settles. |
| Bounded/cancellable validation and lifecycle | Existing independent deadline/capacity, abort and authoritative-entry/epoch settlement checks unchanged; prior scope tests rerun. |
| Accepted parents and runtime-only lifecycle | Same-connection/epoch issued parent refs, transitive invalidation and cycle rejection remain unchanged. Replacements cannot revive old refs or descendants; persisted rows never supply scope authority. Existing lifecycle tests rerun. |
| Registration-before-ingress and ACK ordering | Actual accepted registry lookup precedes A and semantic decoding; unknown channels cannot reach A or lazy-register. Existing ACK/reconcile ordering unchanged; ordering tests rerun. |
| Capture before A, synchronous check after A/B waits | Fresh per-item closure captures its own R; all existing final checks retained. Tests remove first registration during A and B resolver waits and require unrelated second item to succeed. |
| No authority borrowing; exact item association | B-off/on mixed valid/unknown/unreadable/valid batches assert ordered messageId/result, body/store and publication destinations; same-registration stale refuses both. |
| Frozen B target and independent permissions | Existing B target sidecar/authorize/send checks unchanged, including required authorize. Factory preserves consumer/signal/key. AF scope confers no read/wake/write/tool permission; host verifier and A/B still decide these. |
| No lazy fallback or new epoch per item | Protected-push lazy mutant killed; mixed unknown tests assert no new registry entry. Real reconnect tests assert all old receipts refuse and every fork retains the exact old key, even after the new transport is ready. |

## Verification Gates

### Inherited evidence and method

Read in full and verified the frozen report `/srv/review-drop/TASK-S4Q8F-FROZEN-HEAD-VALIDATION.md`, SHA-256 `5211c99422b19681b5f098096b9713a4723b6cefacfb3fc7f03c246aad35a598`; copied as `inherited-validation.md`. Its old-head defect is the regression fixed here. Its API/source inventory and historical observations remain evidence only for their unchanged inputs/scope; they are not fresh fix-head passes. Earlier raw artifacts remain in the two run directories named in that report.

**No base receipt was reused.** Historical executable/dependency bindings were insufficient to demonstrate identical bindings, so `gate-plan.md` predeclared four fresh cells: 22.23.3 base → head, then 22.12.0 base → head, once each. No retry-until-green. Scripts stayed unchanged during the matrix.

All fresh cells use absolute Node executable preflight (SHA-256 and `node --version`) BEFORE npm; AF_TEST_CONCURRENCY=8; separate systemd --user scopes with actual MemoryMax=17179869184; typecheck/build/test in order. Exact implementation: `run-matrix.sh`, `bounded-cell.sh`, `stages.sh`.

```sh
orgasmic dispatch gate "fix-$CELL" -- systemd-run --user --scope \
  --unit="$UNIT" -p MemoryMax=16G env "PATH=$NODE_BIN:$PATH" \
  "AF_NODE=$ABSOLUTE_NODE" "AF_NODE_SHA=$SHA" "AF_CELL=$CELL" \
  AF_TEST_CONCURRENCY=8 bash bounded-cell.sh "$TREE" "$PIN" "$CELL"
# Inside the scope, around the WHOLE typecheck + build + test command:
timeout --signal=TERM --kill-after=60s 3000s bash stages.sh "$TREE" "$PIN" \
  2>&1 | head -c 67108864 > "$FULL_LOG"
# stages.sh invokes the absolute node + that runtime's npm-cli.js for each npm command.
```

The scripts record producer and capture exits separately. 124/137 (operator-bounded timeout), 141/SIGPIPE, cap hit or capture !=0 means **INCONCLUSIVE**, not a test failure. The current method carries forward the operator's deadline/log-cap method change; the two earliest 22.23.3 observations had neither bound and are not retroactively described as bounded. Every current matrix cell uses the same bounded method. Observed line/byte progress was recorded every 120s and surfaced during waiting; no surviving fixture is manually killed.

### Focused regression tests

`focused-registration-batches` gate exited **0** at committed fix head: **95 total / 95 pass / 0 fail / 0 skip / 0 cancelled**, comprising 77 existing scope tests and 18 new tests. Receipt/raw output: `gate-focused-registration-batches-01M67TYG2YSRZ1FFG70ZZXQ89N.log`, `focused-owner.log`.

```sh
/opt/node-v22.23.3-linux-x64/bin/node \
  --import ./dist/test/helpers/force-exit-blocking-stdout.js \
  --test --test-force-exit --test-timeout=120000 \
  dist/test/registration-batch-scope.test.js dist/test/registration-view.test.js
```

All batch witnesses use real WebSocket → framework → ChannelRegistry dispatch (one additional helper unit test tests composition). B-off/on stale-first, stale-last, all-stale, none-stale, same-registration-stale; mixed unknown/unreadable borrowing; ordered messageId receipts, exact storage/body and destination checks; first-item invalidation after A and resolver await; actual transport disconnect/reconnect with a ready replacement before item 2, requiring original old K for both items. The original preprobe assertion is now a committed test.

Development failure retained, not erased: first test draft configured reconnect after connect even though reconnectEnabled is snapshotted at connect. `batch-dev.log`: exit **1**, **18 total / 16 pass / 1 fail / 0 skip / 1 cancelled**. Failure: `scope batch B=false: real epoch change refuses all old items and never reads a new key per item` (`condition did not settle within 60 s`), with file timeout `dist/test/registration-batch-scope.test.js` at 120000ms. The test setup was corrected to configure reconnect at fixture startup, without weakening production checks. Both development build commands exited 0 (`build-dev.log`, `build-dev-corrected.log`; test counts N/A); corrected focused draft run exited 0, 95/95/0/0/0 (`build-dev-corrected.log`, `scoped-dev-corrected.log`). These development commands are not receipt-based final gates; the committed-head focused gate above and fresh matrix below are separate qualification.

### Mutants at the fix head

Gate `registration-batch-mutants` harness exit **0**; all six killed. Each mutant subprocess exits **1**, **1 total / 0 pass / 1 fail / 0 skip / 0 cancelled**, with its named discriminating assertion failing. `mutants.py`, `mutants.json`, `mutant-*.log` and `gate-registration-batch-mutants-01M67V1J6VF23K9WR62611JNSR.log` retain exact patches, argv and results. Compiled files were restored in finally before qualification builds; no mutant entered source or a commit.

| Mutant | Named test |
| --- | --- |
| Shared capture closure (`forItem` returns same wrapper) | `batch preprobe: an invalidated sibling must not poison fresh unrelated registration` |
| Drop view epoch/current-key checks | `view epoch invalidation is synchronous` |
| Return mutable descriptor reference | `view returns detached deeply immutable descriptors and sidecars` |
| Refresh to current generation after await | `real framework push/event: captured generation rechecked after admission await` |
| Missing-ref/lazy-registration fallback | `real framework protected push never lazy-registers` |
| Per-item fresh connection epoch read | `scope batch B=false: real epoch change refuses all old items and never reads a new key per item` |

The last mutant captures a fresh RequiredAdmission/view at each fork. The test kills it by exact old transport-key association, even though the independently retained outer stale check still prevents storage; no redundant A guard was removed to make the mutant observable.

### Profile-off differential

Repeated once at fix head against B: gate `profile-off-serialized-fix` exit **0**, base/head/cmp exits **0/0/0**. Three opt-out profiles (no binder, A without scope, A+B without scope), **21 RPCs / 26 logical stored rows / 28,865 bytes per output**. Complete response/store/offer/publication JSON is byte-identical, without field deletion or output normalization:

`ddc883dd5bb2bf754135bc20fc1841cdc7f62238161e1c5ab84e04ab1e716ff6`

Artifacts: `profile-off-serialized-{base,head}.json`, `profile-off-serialized.mjs`, `profile-off-serialized-gate.sh`, `gate-profile-off-serialized-fix-01M67V2Y8Q1000FGF4DB3FP3D4.log`. Deterministic clock/UUID/Math.random, identical ports and drain after each request are inputs, not post-hoc output stripping. Command: gate wrapper → 16 GiB systemd user scope → `timeout --signal=TERM --kill-after=60s 3000s bash profile-off-serialized-gate.sh`.

**The first historical differential remains FAILED and separate:** original base/head child exits 0/0, cmp 1; original raw outputs and `profile-off-first.diff` remain in the first run's evidence directory. It used independently allocated ports, random IDs and unconfigured turn/deferred-write batching. Neither the old nor this new serialized match erases that witness or relabels it a parity pass. This finite logical wire/store corpus is not a physical Chronicle-file comparison or proof of concurrent scheduling equivalence.

### Fresh matched matrix

All four cells are **fresh**, with completion receipts. No test failure names occurred (`failure_names: []` in every cell of `matrix-results.json`). T/B/test below are individual stage exits, not inferred from an owner process.

| Node/tree | T/B/test | Total | Pass | Fail | Skip | Cancelled | Gate | Producer | Capture | Log bytes | Truncation |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 22.23.3-base | 0/0/0 | 9767 | 9704 | 0 | 63 | 0 | 0 | 0 | 0 | 4316588 | no |
| 22.23.3-head | 0/0/0 | 9862 | 9799 | 0 | 63 | 0 | 0 | 0 | 0 | 4317909 | no |
| 22.12.0-base | 0/0/0 | 9767 | 9704 | 0 | 63 | 0 | 0 | 0 | 0 | 4152093 | no |
| 22.12.0-head | 0/0/0 | 9862 | 9799 | 0 | 63 | 0 | 0 | 0 | 0 | 4151678 | no |

Every cell completed within its bound, without SIGPIPE, capture failure or cap hit. Full commands, timestamps, progress and scope identities: `matrix-owner.log`, `scope-units.txt`. Raw full logs: `full-$VERSION-$TREE.log`; separate pipeline exits: `status-$VERSION-$TREE.txt`; parsed exact data and hashes: `matrix-results.json`. Completion receipts:

- `gate-fix-22.23.3-base-01M67V69RWMFMJPJCWCS5NJ654.log`
- `gate-fix-22.23.3-head-01M67WCN32YSPS7Y195722J1KR.log`
- `gate-fix-22.12.0-base-01M67XCYYEBRAJKWKAV6APD6PV.log`
- `gate-fix-22.12.0-head-01M67YP640AB76ECK4EX8Z0V46.log`

### Runtime and dependency bindings

| Node | Absolute executable | Executable SHA-256 |
| --- | --- | --- |
| v22.23.3 | `/opt/node-v22.23.3-linux-x64/bin/node` | `fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48` |
| v22.12.0 | `/home/orgasmic/.orgasmic/worktrees/theaspirational.agent-framework/task-s4q8f/node_modules/.runtime/node-v22.12.0-linux-x64/bin/node` | `177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9` |

Both base/head within each pair used that exact executable. npm versions: 10.9.9 on 22.23.3; 10.9.0 on 22.12.0. Each full log records the absolute executable SHA/version before its first npm command, concurrency 8, cgroup and actual 16 GiB limit. Node SHA/version remained unchanged in the final metadata audit.

Both trees resolve to the **same installed node_modules directory and installed-lock inode** (`dependency-path-bindings.txt`). All four per-cell complete dependency file/symlink inventories, before and after, match: `91c5fd4fc5a930b841480847fb8c54943432aa9f1fcfc8e4ff28c068ce751afd`, 7,332 records. `.runtime` and `.matched-base` are excluded from this application dependency inventory (runtime executables are separately bound; the baseline worktree/build is not a dependency). Installed lock SHA-256: `034f98722b1c33ec4901139cca713e96a63dcedaedbd775260598535a6e076ca`. No dependency installation or repository dependency/lockfile change occurred.

**Explicit npm-ls discrepancy, not hidden or called environmental:** both base invocations of `npm ls --all --json` exited **1 / ELSPROBLEMS**, reporting 41 extraneous and 526 missing entries; both head invocations exited **0**, with no problems. Base JSON SHA-256: `974e3bcfc2d3a01d06f66b219dd303580cb69cdd13ce74487c60257b788d4535`; head: `3c34f4248cd25631eae8af813a21972c32225cda9fab8b8ebea1cf9c5ec69975`. These hashes are **not equal**. Raw names/details: `npm-ls-$VERSION-$TREE.{json,stderr}`, summary `npm-ls-discrepancy-initial.json`. The independent byte inventory and realpath/inode observations demonstrate the shared installed closure; no matching npm-ls hash is claimed. This diagnostic audit is not a passing npm-ls gate and was not included in the three requested stage exits. Final metadata observations reproduce the same per-tree exits/hashes and unchanged closure (`final-integrity.json`, `dependency-closure-after.*`, `npm-ls-after-*`).

Supplemental gate `fix-final-metadata` exited **0**, confirming unchanged source pins/clean trees, executable SHA/version, dependency inventory/lock, and the same per-tree npm-ls diagnostics/hashes after the matrix. Counts/failure names N/A (read-only metadata, not a test suite); producer/capture exits **0/0**, 1,380 log bytes, no truncation. It used a separate 16 GiB scope and the same 3000s TERM/60s KILL and 64 MiB log-cap policy; scripts `final-integrity.py`, `final-metadata.sh`; receipt `gate-fix-final-metadata-01M67ZRVN2TXAHTNS70FSD0R5R.log`. A postprocessing-only parser assertion initially exited 1 by expecting CLI-owner wording inside a raw gate log; it was corrected to validate both actual formats, without rerunning any gate (`postprocessing-note.txt`).

### Historical cells (not reused)

These qualify only B/old head `47f3b4f2`, not the fix. Original evidence roots:
- `/home/orgasmic/.orgasmic/runs/run-01M67MDC3Y7G9B9R6R58KVBMWD/evidence`
- `/home/orgasmic/.orgasmic/runs/run-01M67QDRZ11X7TTXYZ7P5VPY9Z/evidence`

| Historical Node/tree | T/B/test | Total | Pass | Fail | Skip | Cancelled | Completion evidence |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 22.23.3 base | 0/0/0 | 9767 | 9704 | 0 | 63 | 0 | present |
| 22.23.3 head | 0/0/0 | 9844 | 9781 | 0 | 63 | 0 | missing; log observation only |
| 22.12.0 base | 0/0/0 | 9767 | 9704 | 0 | 63 | 0 | present |
| 22.12.0 head | 0/0/0 | 9844 | 9781 | 0 | 63 | 0 | present |

Historical failure-name lists are empty. Historical 22.23.3 base overall gate exit 0, receipt present. Historical 22.23.3 head: completed stage log has 0/0/0, but dispatch-gate owner died and the completion receipt/overall gate result is **missing**; no receipt-based success is asserted. Those two cells had no whole-command deadline/log cap, and no separately recorded producer/capture exits. Historical 22.12.0 base/head overall gate exits 0/0; producer/capture 0/0 for each; logs 4,150,073 / 4,142,228 bytes, no truncation, under the later bounded method. `historical-cells.json` preserves original raw log paths; the frozen report contains receipt paths and earlier commands. Nothing in this fix round fabricates the missing historical receipt.

The historical real-path batch preprobe exited **1** (non-TAP; counts N/A), named assertion `an invalidated sibling must not poison fresh unrelated registration`: m1 correctly refused as admission_stale, while unrelated current m2 falsely received the same refusal. It remains separate failed evidence. Its assertion is now committed, passes unmutated, and kills the shared-ref mutant.

### Surviving processes

Read-only snapshots during each active cell record scope/cgroup membership, systemd activation time, PID/PPID/PGID/session and kernel start ticks. After the entire set, and again after final metadata collection: **0 matching live processes, 0 read errors**, all four matrix scopes, corpus scope and final metadata scope inactive with no remaining control group. Evidence: `process-audit-*-running.json`, progress/late snapshots, `tracked-processes.json`, `process-audit-after-set.json`, `process-audit-final.json`. No fixture survivor was manually killed. This is a cgroup plus tracked exact-start-identity reconciliation, not an inference from timeout status or a universal claim about unrelated host processes.

## Unmet Criteria

None for this authorized fix round. All requested real-path regressions, six mutants, repeated serialized opt-out differential and four fresh bounded matrix cells completed at the committed fix head. The historical missing receipt and first failed differential remain explicit archival limitations, not relabelled passes or reused qualification. The npm-ls diagnostic discrepancy remains explicit above; actual installed dependency bytes and all requested typecheck/build/test stage results are separately recorded. No BLOCKED-FOR-SCOPE item was found necessary.

## Residual Risk

Finite synthetic tests do not establish native truth. The existing 50 ingress fixture cases and new 18 batch tests use invented IDs; seven native-tool fixture cases and T2–T5/native host/send-time qualification remain outside this AF-only change. No native activation, producer attestation, release artifact or integration repin is claimed. The serialized logical parity corpus does not prove all concurrent schedules or physical store-file equivalence; its original failed uncontrolled witness remains preserved.

Estimated remaining AF implementation/qualification work for this fix: **none** against this brief; bounded review approximately **1–2 engineer-hours**. Artifact composition/host repin is separate integration work (approximately **2–4 hours**, dependent on supplied inputs), followed by separate native qualification. No push or integration action was performed.
