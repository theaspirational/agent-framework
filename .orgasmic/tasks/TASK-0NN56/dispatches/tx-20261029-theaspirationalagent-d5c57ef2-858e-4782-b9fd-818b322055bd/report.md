# Fix round 1 report

## Changed

Review read in full: `/srv/review-drop/TASK-0NN56-REVIEW1.md`.
Package remains **@animalabs/agent-framework 0.30.0**.

| Local branch | Reviewed parent | New head |
| --- | --- | --- |
| `feat/typing-budget-recipient` | `72fe3f8df64393d4c05183d05b0e0e7f6f67a9e4` | `3e4e49901d745bc94c34963f2321d9b171454a0b` |
| `recipient-on-main` | `57424a0e1e851331357a721b2822720f89097a47` | `280ec03d60720642318b7408710ec4a2059bf525` |

Only new commits were added. Existing commits/trailers were not rewritten.
The requested neutral author/committer and existing trailer convention are retained.
No push, PR, remote mutation, ledger/main-checkout edit, merge or dispatch close.

| Branch | New commit | Subject | Statistics |
| --- | --- | --- | --- |
| `feat/typing-budget-recipient` | `3e4e49901d745bc94c34963f2321d9b171454a0b` | fix(routing): isolate recipient turns and enforce local write policy | 6 files changed, 190 insertions(+), 25 deletions(-) |
| `recipient-on-main` | `280ec03d60720642318b7408710ec4a2059bf525` | fix(routing): isolate recipient turns and enforce local write policy | 6 files changed, 190 insertions(+), 25 deletions(-) |

Changed paths: `src/framework.ts`, `src/host-recipient-protocol.ts`,
`test/recipient-compatibility.test.ts`, `test/recipient-protocol.test.ts`,
`docs/recipient-compatibility.md`, `changelog.d/recipient-compatibility.added.md`.
Full statistics: [commit-stats.txt](commit-stats.txt).

### 1. Logical-turn ownership

Chose **requeue, not adoption**. A new recipient must not retarget an earlier
turn's in-flight deliveries, tools, continuation or typing owner. The scheduler
parks recipient requests behind an open non-recipient turn while allowing its
own continuation through; the direct-start boundary also refuses a mismatched
owner, releasing any already-held provider admission before requeueing. It does
not queue into a stopping framework.

**Reachable in production code under synthetic inputs:** the new regression
starts a normal non-recipient turn, executes a real module tool result, and drives
its physical-window `context_budget_restart`. An addressed recipient wake arrives
during that tool. No logical routing object is injected in this row. Before the
fix, the recipient-selection filter displaced the old continuation: only one
stream ran instead of three and the turn stalled. After the fix, the earlier turn
continues, then the recipient gets its own correctly threaded reply. The trace
asserts `inference:stream_restarted`. Separate injected-precondition rows cover
the scheduler and direct-start entry points, including provider-gate cleanup.
This establishes framework-path reachability, not a live deployment incident.

### 2. Channel write allowlist

Enforcing `writeChannels` was **the manager's (Tarn's) call**, as specified in this
round, not an owner sign-off. The bridge snapshots the channel allowlist and gates
reply-envelope creation and inference on it. A valid readable mention outside
that allowlist is retained as context; DM policy remains independently controlled
by `dmUsers`. Both actual MCPL ingress lanes carry the bridge's narrowed wake
verdict downstream rather than ignoring it. Original mention/provenance fields
remain metadata; no message text is parsed for routing. A host-normalized denied
mention remains valid context if the bridge rechecks it.

Tests cover non-writable channels, allowed channels, independent DM admission,
configuration-array mutation, and real stdio incoming/push delivery: denied
mentions are stored but cause no model call, no publication and no anchor change.
This is automatic-reply admission, not a grant to arbitrary explicit-send tools;
connector and explicit-send authorization remain host responsibilities.

### 3. Latest-inbound reply anchor

Ported the missing source-patch guard into current main's central
`noteDeliveredOrPark` boundary, where delivered anchors are now recorded.
An opted-in context-only event neither calls `ChannelRegistry.noteDelivered` nor
parks an anchor for later coalescer acceptance. Therefore `defaultPublishChannel`,
message/thread ids, `ChannelContext.incoming`, and `incomingFor` (the source used
by refusal handling) retain the earlier addressed message. No extra registry API
was necessary. The regression covers immediate and parked paths plus feature-off
behavior. This corrects the prior port's undisclosed omission; it is not the
separate, justified removal of the obsolete pre-publication streaming filter.

### 4–6. Documentation, types and attribution

- Budget-hold claims and the mapping to `budget-refusal-hold.test.ts` are explicitly
  conditional on the stacked branch; main alone has neither that feature nor test.
- Removed casts from public `routeSpeech`, `stopTyping`, and registry options, and
  unnecessary metadata argument casts. Remaining casts are private-state/test-double
  scaffolding or a deliberately partial compression preview, not those public APIs.
- **Correction to the earlier report:** replacement qualification tests were the
  manager's (Tarn's) decision, not the owner's. Historical 366/21 counts remain
  unreproducible from the supplied source artifacts. No owner approval is inferred.
- Both branches' complete layer-3 added/deleted-line multisets are compared in
  [layer3-equivalence.json](layer3-equivalence.json); comparison bases are layer-2
  tip `22454888` for the stack and exact upstream main for standalone. Round-only
  changes are also compared. Existing history/neutral-author/name audits are in
  [round-manifest.json](round-manifest.json).

## Verification Gates

Toolchain: **Bun 1.4.3** (`/home/orgasmic/.local/bin/bun-1.4.3`) and
**Node 22.23.3** (`/opt/node/bin`). All assigned checks use
`orgasmic dispatch gate NAME -- COMMAND`; build output remains in the worktree,
not evidence. Dependency files/version were not edited.

### Red-first and focused

| Gate | Scope | Tests / pass / fail / skip |
| --- | --- | --- |
| [r1-final-red](gate-r1-final-red-01M63FTV40Z0GPAE9DEWH5SJBV.log) | Reviewed runtime 72fe3f8d, six new behavioral rows, no runtime fixes | 6 / 0 / 6 / 0 |
| [r1-ownership-recheck](gate-r1-ownership-recheck-01M63FWVEBZSHSS33YCXV9Y3GK.log) | Typecheck/build + complete recipient suites including admission-release assertion | 30 / 30 / 0 / 0 |
| [r1-stacked-focused](gate-r1-stacked-focused-01M63GEEXM1WWWMN4PH0CCGM7F.log) | Complete recipient suites at new stacked commit | 30 / 30 / 0 / 0 |
| [r1-standalone-focused](gate-r1-standalone-focused-01M63GF3H2GXG7GTZCF8W1CHRE.log) | Same suites at new standalone commit; budget-hold row skips | 30 / 29 / 0 / 1 |
| [r1-restored-stack](gate-r1-restored-stack-01M63GQPEMTDN2W9SA494288HY.log) | Clean rebuild and recipient suites after restoring stacked checkout | 30 / 30 / 0 / 0 |

Authoritative red command after the gate wrapper:
`bash -c 'npm run build && npm run pretest && node --test --test-force-exit --test-timeout=20000 --test-name-pattern="unowned open|non-recipient budget|latest-inbound reply anchor|write allowlist|non-writable channel" dist/test/recipient-compatibility.test.js dist/test/recipient-protocol.test.js'`.
All six final red failures are assertions, with zero cancellations, not compiler
or missing-symbol failures. Initial exploratory receipts are preserved separately:
one compile error, then an incomplete routing stub and timeout, corrected before
the authoritative red run. No failed probe is presented as a passing gate.
Focused commands run `node --test --test-force-exit` on the two recipient files.
The dirty-tree green probe is evidence, not a reusable clean-head receipt.

### Fresh gates on both heads

| Head | Gate / command after wrapper | Result |
| --- | --- | --- |
| Stacked | [r1-stacked-install](gate-r1-stacked-install-01M63G0QHCTRM01X7TQQXFW5W6.log) — `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS |
| Stacked | [r1-stacked-typecheck](gate-r1-stacked-typecheck-01M63G0QPAQJMRJ3B9JJ9S0RM3.log) — `npm run typecheck` | PASS |
| Stacked | [r1-stacked-build](gate-r1-stacked-build-01M63G0R1G8JMMHQ40JE5QSTFT.log) — `bash -c 'npm run clean && npm run build && npm run pretest'` | PASS |
| Standalone | [r1-standalone-install](gate-r1-standalone-install-01M63GEZY3D26GE4386H0J345K.log) — `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS |
| Standalone | [r1-standalone-typecheck](gate-r1-standalone-typecheck-01M63GF02X6MQS4918AAPGMVY5.log) — `npm run typecheck` | PASS |
| Standalone | [r1-standalone-build](gate-r1-standalone-build-01M63GF1DC2GZSCSR89FWWXW48.log) — same clean build chain | PASS |

Full-suite command on each head:
`AF_TEST_CONCURRENCY=8 orgasmic dispatch gate NAME -- npm test`.

| Head | Receipt | Tests / pass / fail / skip |
| --- | --- | --- |
| Stacked `3e4e4990` | [r1-stacked-suite](gate-r1-stacked-suite-01M63G0SVTNRZ031T7WS0DKSC7.log) | 9335 / 9272 / 0 / 63 |
| Standalone `280ec03d` | [r1-standalone-suite](gate-r1-standalone-suite-01M63GF4YMCW234ADDM9J6BHHV.log) | 9241 / 9177 / 0 / 64 |

Compared with the reviewed heads, each adds six passing tests with unchanged skip
counts. The standalone extra skip is still the budget-hold integration row.
All receipts/probe outcomes: [gate-results.md](gate-results.md).

Equivalence/history/name audit: [r1-equivalence](gate-r1-equivalence-01M63GQSV41RRXKDPY08B3K8ZH.log) —
`python3 "$ORGASMIC_EVIDENCE_DIR/audit-round.py"` (PASS). The audit is
reproducible from the saved script and verifies both complete-layer and round-only
added/deleted lines, exact parents, neutral identities, and clean diff status.

### Inherited evidence and limits

- The pinned base `0f11975e` is unchanged. Its earlier full-suite log was reread:
  9,211 tests, 9,148 passed, zero failures, 63 skipped. This is historical baseline
  comparison, not a new head gate. Receipt:
  `/home/orgasmic/.orgasmic/runs/run-01M63783T63Z42QNG09P652MBB/evidence/gate-base-suite-01M6379HWRM4GMAJTYEX46FA60.log`.
- The review records 9,266/0/63 on 72fe3f8d and 9,171/0/64 on 57424a0e (pass/fail/skip).
  Those exact parent commits remain ancestors; no parent commit was rewritten.
  Layers 1 and 2 remain unchanged. Their historical provenance
  and red-first qualification witnesses are inherited only for that unchanged scope.
- No old head gate is substituted for this round's required gates. Installation,
  typecheck, clean build and complete tests are rerun on both new commits.
- The historical qualification-source gap and manager-directed replacement decision
  remain unchanged; this round adds the missing ownership/policy/anchor cases.

## Unmet Criteria

None. All required final gates and both equivalence comparisons passed. No publication
or deployment was requested or performed. The worktree is left clean on the
stacked branch; both local branches are retained.

## Residual Risk

The extension is optional and local, not a standard MCPL capability. The handshake
attests to a peer; it does not authenticate an arbitrary connector. No real
provider, credential, agent history/state, host dependency graph or deployment was
used. The synthetic reachability test proves the framework scheduling path, not
that it occurred in a deployed host. Historical qualification counts are not
claimed reproduced. No generic context-only/mention-only delivery or closed-channel
persistence guarantee is added. The review's stale-wake telemetry nit is unchanged;
this round protects ownership and liveness without redesigning that bookkeeping.
