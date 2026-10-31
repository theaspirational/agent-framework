## Changed

Head: `7504acbd139e63878f6142f962750b8669fc92d1`, stacked on `3c95d166242892206b5e1e5d624b3c9ebb062323`. Local commits only, no push:

- `c545dee06770ee058e0a4cc3515d09b6b7aca598` — restore ordinary registration cleanup; defer hint provenance.
- `81c9f8349383f1bd67da20e8e9ade080554545b1` — real-connection dead-server/wire/disconnect controls.
- `7504acbd139e63878f6142f962750b8669fc92d1` — match the changed response itself and model detached-registry pass two.

All three author/committer identities are Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>, each with the required GPT-6.1-Sol co-author trailer. Rejected branch `task-pk8rc-lowb-rejected-3c95d166` remains at its original head; no old evidence/branches deleted. No admission, transport, grants, wire-schema or dependency source changes. No new identity subsystem.

This implements the **replacement direction** from Soma (programme qualifier), relayed by task operator Tarn, not a human-owner decision: withdraw incarnation-aware entry/hint retirement, rather than invent an ordering between connection objects. The original newer-provenance proposal is NOT implemented. `stopTypingWhere` and `stopAll` are restored together, not hybridized with withdrawn snapshot guards.

Changed paths: `src/mcpl/channel-registry.ts`, `src/framework.ts`, `test/channel-lifecycle-order.test.ts`, `test/channel-registry-typing.test.ts`, `test/typing-transport-epoch.test.ts`, `test/routing-runtime-has-no-connector-literals.test.ts`, `docs/reply-routing.md`, `changelog.d/owned-typing.fixed.md`. No generated/lockfile changes committed. The four-export added fragment remains unchanged.

### Exact runtime comparison to reviewed pre-change baseline d3230a69

`baseline-runtime-hunks.diff` has exactly **five** hunks, all diagnostic-only (the retained bounded-throttle concern); no entry/hint policy is smuggled through a helper:

| Current registry line | Hunk | Classification |
|---|---|---|
| 1306–1307 | scalar stamp → bounded destination-keyed map | diagnostic only |
| 1738 | delete removed channel's diagnostic stamp | diagnostic only |
| 2279–2285 | per-destination 60s throttle, cap256, least-recently-emitted eviction | diagnostic only |
| 2706 | delete removed server-entry's diagnostic stamp | diagnostic only |
| 2770 | clear diagnostic stamps at shutdown | diagnostic only |

`framework.ts` has **zero hunks** against d3230a69. `registerEntry`, `handleRegister`, `transportClosed`, ordinary entry deletion and typing force cleanup are restored; optional connection/epoch parameters, WeakMap stamps and `retireRegistration` are gone. The absent-entry removal once again calls `forceStopTyping(ref)` unconditionally (`channel-registry.ts:1737–1739`), and stamp reap precedes that call with no provenance refusal. Both review LOWs disappear with the revert.

Disconnect uses baseline ID-based removal before close (`framework.ts:34361`) and again after close settles (`:34397`); `serverRemovals` increments each pass (`channel-registry.ts:2702`), default message/thread reset runs without a current-connection early return (`:2716–2719`). Entry cleanup no longer depends on stamps for lazy pushes, earlier epochs or repeated announcements. This is ordinary dead-server cleanup, NOT stale external-callback generation safety.

### Preserved and removed tests

`baseline-test-preservation.json` proves every byte of d3230a69's typing test is an exact prefix of the final file. Lifecycle-order, shared-channel-id and reply-routing tests are byte-identical to d3230a69 (`baseline-assertion-diff.txt` is empty). In particular both original lifecycle doubles are restored without invented identities or changed assertions, the unowned shutdown assertion remains intact, and original grant/disabled/mode controls remain. All base assertions are retained.

Retained later controls: same-turn move-away/back hint lockout; independent/bounded/reaped diagnostics; expanded AST selectors. The AST guard still scans `registerEntry`, `stopAll`, all remaining owned-typing methods, `sameTypingOwner`/`TypingOwner`, `earlyTypingChannel`, `driveStream.typingChannel` and `followTurnLocus`. Only the nonexistent `retireRegistration` selector is removed; destination-choosing coverage is not reduced. A connector literal in `sameTypingOwner` is caught.

Removed tests added solely for the withdrawn mechanism (none existed at d3230a69; `removed-test-inventory.txt` preserves templates):

| Removed test template | Instances | Reason |
|---|---:|---|
| identified changed/server removal reaps only departed registration's hint | 2 | withdrawn qualified hint deletion |
| late changed/server teardown after connection/epoch replacement preserves new entry/hint | 4 | withdrawn captured-pair retirement API |
| legacy ID-only changed/server preserves behavior without retiring hints | 2 | obsolete paired-vs-ID-only scaffold/helper; baseline ID-only tests retained |
| late entry retirement on same connection/epoch cannot reap re-registration hint | 1 | removed private retirement helper |
| guarded removal refuses entries without captured registration provenance | 1 | rejected entry-leak policy |
| closed/tuned-out/transport-close keeps registration and stored hint, live=false/true | 6 | withdrawal of blanket hint preservation for active unowned force cleanup; ordinary baseline semantics restored |
| same-pair changed/server teardown without old-entry token refuses cleanup | 2 | withdrawn guarded API; gap now documented, not a false entry-safety promise |
| shutdown preserves hint when entry/hint replaced after snapshot | 2 | withdrawn shutdown snapshot mechanism |
| disconnect carries start pair across delayed teardown, sameObject=false/true | 2 | removed disconnect pair plumbing |
| late close/error reports keep replacement registration/hints, sameObject=false/true | 2 | removed retirement-helper spy and qualified cleanup claim |

The existing old-line transport-epoch control is retained and its fresh-control assertion now pins the documented **idle-hint gap**, not the withdrawn deletion policy. Five new synthetic production-path controls use a real `McplServerConnection` and real framework wire/disconnect methods: lazy push entry retirement, same-epoch repeated announcement retirement, earlier-epoch entry retirement, exact itemized `channels/changed` response `accepted:true`, and two disconnect passes with a late registration after pass one. They assert dead-channel resolution errors; the second-pass control removes the connection from the server-registry double and pins `serverRemovals == 2`. No live connectors or transport/admission production edits.

## Verification Gates

### Method and dependency closure

`predeclared-plan.md` preserves the plan before full cells and the test-only final-head amendment before any head full cell. Exactly four new full cells, sequential base/head on 22.23.3 then base/head on 22.12.0. The short final scoped build/mutation probes overlapped startup of the first base cell; no two full-suite cells overlapped. This is disclosed, not a claim of an unloaded host or a timing-cause inference. All full cells use AF_TEST_CONCURRENCY=8, a single copied `/tmp/pk8rc-r5-closure/node_modules` closure (no installs), the same installed-closure lock, and the same scripts. Base is rejected head3c95d166, final head7504acbd; no retry-until-green.

Command in each tested checkout:

```sh
orgasmic dispatch gate <cell> -- systemd-run --user --scope \
  -p MemoryMax=16G -p MemorySwapMax=0 "$E/run-full.sh" <cell> <node-bin>
```

`run-full.sh` executes `timeout --signal=TERM --kill-after=60s 3000s python3 "$E/capped-command.py" <status> "$E/full-payload.sh" <node-bin>`. Payload: `npm run typecheck && npm run build && npm test`. Producer and capture exits are separate status fields; 64MiB cap includes reserved wrapper/header space, continued draining after cap, truncation explicitly inconclusive. 124/137/141/cap are not relabeled as failures or passes. Payload PID/PGID captured in each status JSON/log; observed progress printed during waits, not guessed activity. Final process reconciliation is read-only.

Preflight `preflight.sha256` and `node-versions.txt`:
- `/opt/node-v22.23.3-linux-x64/bin/node` v22.23.3, SHA256 `fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48`.
- `/tmp/task-pk8rc-tools/node-v22.12.0-linux-x64/bin/node` v22.12.0, SHA256 `177208bfc4a9403121a40c72d038c670f4fd937fa16ca7df0a720e90be0fe2d9`.
- Lock SHA256 `bcf206d06d3e0a80a0fdc64a4869575d8b0503028bb4c536efcfea5122cc50a0`. Assigned-worktree lock copied as evidence only. Detached checkouts BOTH omitted that ignored project lock during gates (no install ran); their shared node_modules/.package-lock.json is archived as installed-closure-lock.json, SHA25638a6979b0c2c8b629142c4abf230e43fc13cee0eb17abe780e0a7d36f2d19d8d. See lock-input-note.txt; a post-set attempt to hash nonexistent detached project locks failed, not a suite or dependency change. `npm ls --all --json`: both checkouts exit0, byte-identical outputs (`npm-ls-base.json`, `npm-ls-head.json`). The installed-closure lock digest is also present in the BEFORE manifest. Closure file AND symlink manifests match byte-for-byte before/after (both comparisons exit0); no dependency changes committed. npm ls on22.12.0 also exited0 for both trees and matched byte-for-byte.

| Cell | Producer / capture / gate exit | Total | Pass | Fail | Skip | Cancelled | Captured bytes / truncation |
|---|---|---:|---:|---:|---:|---:|---|
| [r5-base-22233](gate-r5-base-22233-01M67WANFZ07YFQFRBA98SXHZZ.log) | 0 / 0 / 0 | 9832 | 9769 | 0 | 63 | 0 | 4223505 / False |
| [r5-head-22233](gate-r5-head-22233-01M67XCC97RDNWYGWGJYBP2RTQ.log) | 0 / 0 / 0 | 9813 | 9750 | 0 | 63 | 0 | 4221008 / False |
| [r5-base-22120](gate-r5-base-22120-01M67YSQRDSQ0J51R020WC043X.log) | 0 / 0 / 0 | 9832 | 9769 | 0 | 63 | 0 | 4057755 / False |
| [r5-head-22120](gate-r5-head-22120-01M67ZQWV85H7CK1YFZD3ZXP1Q.log) | 0 / 0 / 0 | 9813 | 9750 | 0 | 63 | 0 | 4048489 / False |

All four typechecks, builds and full suites passed. No failure/cancellation names, timeouts, truncations or unknown exits in this set. Base/head count difference19 = 24 withdrawn-mechanism instances removed, five new lifecycle controls added; no baseline assertion removed. `full-results.json` contains exact paths/status objects. No reruns.

Profile-off controls are separate from disabled typing mode: the unchanged `test/reply-routing-transport.test.ts:76` control “real stdio: unconfigured connections keep existing automatic routing” and the `N2 … (off)` case passed in all full cells. The new synthetic harness also constructs real connections with no admission profile. The unchanged reply-routing controls exercise all typing modes (locus/hybrid/explicit/disabled), with disabled/private/silent starts emitting no automatic typing; the grant-denial and per-indicator shutdown controls remain unchanged.

### Scoped development and mutation runs

Every scoped run was also through a dispatch gate in a 16G/zero-swap scope with timeout. `r5-focused` (900s, Node22.23.3): typecheck/build plus six focused files, **367 total /367 pass /0 fail /0 skip /0 cancelled**, exit0. This was a dirty development run whose head moved; it is evidence only, not a reusable clean-head acceptance receipt.

`r5-final-probes` (300s, final head7504acbd, Node22.23.3): typecheck/build pass; real synthetic path **6/6/0/0/0**, exit0, then deliberately restores both rejected compiled modules: **6/3/3/0/0**, producer1 as expected and harness0 (mutation killed). Failure names: old line-closure epoch drops delayed controls after same-object reconnect before registry dispatch (fresh-control hint expectation); current wire removal accepts a same-epoch re-announcement; both disconnect passes remove entries, including a late registration (the `serverRemovals==2` assertion). Original compiled/source bytes restored in `finally`.

Mutation table (counts are total/pass/fail/skip/cancelled; expected mutant failures are not product test failures):

| Mutation | Witness | Result |
|---|---|---|
| reintroduce rejected registry only, without framework pair plumbing | 6/6/0/0/0 | **SURVIVED**: ID-only callers bypass those removed guards; no isolated guard proof claimed |
| reintroduce rejected registry AND framework plumbing | exact wire response + second disconnect counter + conservative idle hint | **KILLED**, final probe6/3/3/0/0 |
| global destination throttle | X must not silence same-named Y | **KILLED**,25/21/4/0/0 |
| remove cap256 | bounded destination churn | **KILLED**,25/24/1/0/0 |
| remove changed stamp reap only | changed cleanup control | **KILLED**,25/24/1/0/0 |
| remove server stamp reap only | server cleanup control | **KILLED**,25/24/1/0/0 |
| remove shutdown stamp reap only | shutdown cleanup control | **KILLED**,25/24/1/0/0 |
| ignore stored-hint suppression | same-turn A→B→A control and wire/hint controls | **KILLED**,25/15/10/0/0 |
| connector literal inside sameTypingOwner | AST registry boundary | **KILLED**,4/3/1/0/0 |

The first `r5-mutations` harness exited1: seven mutation subprocesses completed, then the AST mutation replacement did not apply (assertion before execution). Not a product regression and not hidden as a pass. The AST probe was repaired and run **alone**, not the full set rerun. `r5-ast-literal` harness0, mutant producer1; all source restored. An accidental separately named `r5-ast-mutation` gate only ran the Node version command, exit0, no tests; it is not mutation evidence. Earlier `r5-rejected-plumbing` intermediate-head harness0 had the same three expected failure names, but its pass-two witness was late entry deletion rather than the subsequently strengthened counter assertion. Exact logs/status and failure names are attached; no conjunct is claimed independently proven.

| Scoped gate | Exit | Exact log |
|---|---:|---|
| r5-ast-literal | 0 | [gate-r5-ast-literal-01M67WAN02MW52M9Y1B4XN9JVE.log](gate-r5-ast-literal-01M67WAN02MW52M9Y1B4XN9JVE.log) |
| r5-ast-mutation | 0 | [gate-r5-ast-mutation-01M67WAMTTS22VGTNXBTSXFX20.log](gate-r5-ast-mutation-01M67WAMTTS22VGTNXBTSXFX20.log) |
| r5-final-probes | 0 | [gate-r5-final-probes-01M67WCK66F1Y2G0X66B6VTMC7.log](gate-r5-final-probes-01M67WCK66F1Y2G0X66B6VTMC7.log) |
| r5-focused | 0 | [gate-r5-focused-01M67W6PD71FW4CJVJKH6DVRFN.log](gate-r5-focused-01M67W6PD71FW4CJVJKH6DVRFN.log) |
| r5-mutations | 1 | [gate-r5-mutations-01M67W9PVSB95HVNZET220Q0JP.log](gate-r5-mutations-01M67W9PVSB95HVNZET220Q0JP.log) |
| r5-rejected-plumbing | 0 | [gate-r5-rejected-plumbing-01M67WBM6PA64FJ8YHG3CKG3HV.log](gate-r5-rejected-plumbing-01M67WBM6PA64FJ8YHG3CKG3HV.log) |

Scoped commands: all use the same systemd16G/zero-swap prefix. r5-focused: timeout900 bash payload(typecheck/build, then node --test --test-force-exit on channel-registry-typing, typing-transport-epoch, channel-lifecycle-order, reply-routing, shared-channel-id, routing-runtime-has-no-connector-literals). r5-mutations: timeout900 run-mutations.sh. r5-final-probes: timeout300 run-final-probes.sh. r5-ast-literal and r5-rejected-plumbing: timeout120 env PATH=<Node22.23.3>/bin:... python3 ast-mutation.py/rejected-plumbing-mutation.py. r5-ast-mutation: timeout120 <Node22.23.3>/bin/node --version only. Every timeout includes TERM and60s kill grace. Scripts and per-mutant logs are evidence artifacts.

### Inherited evidence and correction of prior claims

Historical evidence is retained, not refreshed/reused for acceptance. `inherited-observations.tsv` / `inherited-gates.md` preserve the prior run's **every-run** table and log paths, including actual32/parallel observations, proven/final intermediate heads, matched8 cells and isolated workspace controls. Inputs there were d3230a69/intermediate heads/3c95d166, not this final head or frozen closure. The historical 22.23.3 head summary had no wrapper exit (session killed); it remains unknown, not inferred. The prior method-different unbounded base/bounded head22.12 pair is not called identical. Historical timeout/cancellations remain unresolved observations, never labeled environmental or erased by later green runs.

`inherited-mutants-not-acceptance.tsv` retains old mutant records. **Correction:** old “connection comparisons”/“epoch comparisons” mutants removed captured and current checks together, so their kills did NOT establish the captured conjuncts independently. The reviewer independently observed survivors. Those guards/plumbing are now removed, not renamed or asserted proven. No new proof of incarnation-aware hint retirement is claimed. Review read in full; `review.sha256` matches the supplied digest.

## Unmet Criteria

None under the replacement bounded-revert direction. Incarnation-aware retirement is explicitly deferred, not claimed complete.

## Residual Risk

- No turn-qualified host hint in the binding/typing API: automatic typing yields to live OR idle unbound hints. A hint arriving mid-root lease never retargets owned refresh/stop; same-turn move-away/back can remain locked out. This is the programme engineering constraint, NOT exact-thread support. Optional thread target/transport remains out of scope and incomplete.
- Ordinary ID-only lifecycle cleanup is restored. Arbitrarily delayed external ID callbacks are not incarnation-qualified and can remove a replacement entry. Incarnation-aware entry/hint retirement is deferred; stored idle/owned hints may accumulate or suppress automatic typing after re-registration until explicit host stop. No new deletion/generation-safety guarantee.
- Grant denial allows local timer retirement only; it proves no platform clearance. Even granted wire notification is not acknowledgement. Base unowned force/shutdown cleanup semantics are restored, without snapshot guarantees.
- Idle TTL still uses broader dropped-turn settlement; no narrower hook redesign. Unowned indicators still need paired host stops; no unowned sweeper/TTL added.
- Read-only process reconciliation: 0 test-associated Node survivor(s), 12 Node processes on the specified binaries in total (including worker app-servers/other services); see process-reconciliation.json. No processes were killed. Historical long-line-stubborn fixture PID3192524 was not present at this observation; disappearance cause not inferred.

BEGIN PR BODY
## Summary
Stacked on the frozen reply-routing change.

- Lease typing to a server-qualified channel and logical-turn owner; stale turn stops cannot clear successors.
- Preserve frozen/private/disabled typing boundaries and yield to unqualified host hints without retargeting wire refreshes.
- Restore ordinary dead-server registration cleanup, including lazy/late entries and repeated announcements.
- Bound hint-yield diagnostics per destination and retain connector-neutral AST coverage.

## Verification
Typecheck, build and full npm test on Node22.23.3 and22.12.0, matched base/head, concurrency8 in bounded16GiB scopes. Final head:9,813 total /9,750 passed /63 skipped /0 failures /0 cancellations on each Node. Mutation controls cover lockout, diagnostics, wire removal and disconnect cleanup.

## Remaining scope
Exact nested-thread typing and incarnation-qualified host-hint retirement remain incomplete. Ordinary ID-based cleanup is not generation safety; retained unbound hints may suppress typing until an explicit host stop. Wire stops require the current typing grant and are best effort.
END PR BODY
