# Fix round 2 report

## Changed

Read `/srv/review-drop/TASK-0NN56-REVIEW2.md` in full. Addressed LOWs 1–5 in the narrowed brief.
Package remains **@animalabs/agent-framework 0.30.0**.

| Local branch | Reviewed parent | New head | New commit statistics |
| --- | --- | --- | --- |
| `feat/typing-budget-recipient` | `3e4e49901d745bc94c34963f2321d9b171454a0b` | `5560cdd94d89821e0511b7b24aecfaa845432217` | 4 files changed, 153 insertions(+), 28 deletions(-) |
| `recipient-on-main` | `280ec03d60720642318b7408710ec4a2059bf525` | `f48546e353165aa1842972a7594e0355d3997754` | 4 files changed, 153 insertions(+), 28 deletions(-) |

One new commit on each branch, no rewrites. Existing authors/trailers are untouched;
new commits retain the existing neutral identity/trailer convention. Publication
provenance changes remain deferred as instructed. No push, PR, merge, remote mutation,
main-checkout edit or dispatch close. Full stats: [commit-stats.txt](commit-stats.txt).

Changed files: `src/framework.ts`, `test/recipient-compatibility.test.ts`,
`test/recipient-protocol.test.ts`, `docs/recipient-compatibility.md`.
No dependency/version/generated-file changes are committed.

### Deferred-wake diagnostics (LOW 2)

Recipient ownership requeues now use a shared `warnRecipientDeferral` helper at
scheduler and direct-start boundaries, including different-recipient/sibling deferrals.
After 30 seconds, an `inference:request_stale` trace and `[inference-stale]` stderr
line identify `recipient-deferred` status and say the wake was requeued, not started.
Both share the existing busy-path `staleWarnAt` per-agent 60-second throttle and
quiesce suppression; no new trace schema, request timestamp reset, or drop policy.

The scheduler/direct-start rows each exercise 200 passes with a 120-second-old
wake: exactly one trace and stderr line, renewed after the throttle, with the same
request, original age and envelope retained. Both non-recipient and other-recipient
open owners are covered. Clearing the predecessor permits exactly one reply.
Fresh wakes are silent. No sleep of 120 seconds is required by the test.

### Silent-start exemption (LOW 3)

The direct guard now includes `!trigger.suppressProse`. The test waits for an
actual silent stream to complete and verifies no requeue, no automatic publication,
and the original open prose routing object/envelope remains untouched. The open-turn
coexistence precondition is deliberately injected; this does not claim that a live
host has produced that combination.

### Real-ingress anchor regression and correction (LOW 1)

Replaced the private `noteDeliveredOrPark` invocation row with a synthetic stdio
MCPL test. It sends an addressed `channels/incoming`, then genuine context-only
`channels/incoming` and `push/event` arrivals in another channel. It checks the
default channel, adapter `ChannelContext.incoming`, refusal source (`incomingFor`),
empty parked anchors, stored context and lack of extra inference. A spy confirms
context does **not** reach `noteDeliveredOrPark`, so a regression in `decision.locus`
is caught even if the downstream guard still prevents the final anchor mutation.
The existing real-ingress write-denied-mention row remains unchanged.

**Correction to the prior report:** live ingress already enforced the anchor
invariant through `decision.locus = false` before fix round 1. The retained
`noteDeliveredOrPark` guard is **defence in depth**, not the mechanism that fixed
live ingress. Round 1's private-method red row did not establish a reachable
production defect; its wording overstated that change. The replacement ingress
row is green on the reviewed parent, as expected, not falsely claimed red-first.
The code comment and docs now describe the boundary accurately.

### Configuration and storage docs (LOWs 4–5)

Documented that a channel absent from `writeChannels` gets no automatic reply,
and that `writeChannels: []` is valid and disables all channel auto-replies;
DM admission remains independent. Added an empty-allowlist unit row for both lanes.

Documented the addressed-but-context asymmetry: preserved mention ids,
`human-mention`/`peer-mention` routing reason and `chat:addressed` tags can coexist
with host-normalized `wakeAllowed: false` for a non-writable channel. Such arrivals
may count as addressed inbound but cause no inference, envelope or anchor move.
This is preserved provenance, not a new generic mention-only delivery mode.
These are also the configuration notes to carry into the eventual upstream PR.

Both full layer-3 and round-only added/deleted-line multisets are identical:
[layer3-equivalence.json](layer3-equivalence.json). The standalone change still
requires neither #233 nor #361. Exact-parent, identity, added-line name and clean
worktree audits: [round-manifest.json](round-manifest.json).

## Verification Gates

Fresh toolchain: Bun **1.4.3** at `/home/orgasmic/.local/bin/bun-1.4.3`, Node
**22.23.3** at `/opt/node/bin`. All gates use `orgasmic dispatch gate NAME -- COMMAND`.
Build products stay in the worktree, outside evidence.

### Behavioral probes

| Gate | Scope | Tests / pass / fail / skip |
| --- | --- | --- |
| [r2-red](gate-r2-red-01M63HXJD902S7K8P7WZQ9S7VH.log) | Reviewed runtime, new rows before production changes | 5 / 2 / 3 / 0 |
| [r2-green](gate-r2-green-01M63HZRBZ6RDCKTC8482Q6JN5.log) | Typecheck/build and recipient suites, dirty-tree development | 34 / 34 / 0 / 0 |
| [r2-focused](gate-r2-focused-01M63J1GARTH2R7YEZZJPDHG7S.log) | Final expanded diagnostic assertions, dirty tree | 34 / 34 / 0 / 0 |
| [r2-stacked-focused](gate-r2-stacked-focused-01M63J2FWW9TM7W15DW5MTVZGR.log) | Complete recipient suites at stacked commit | 34 / 34 / 0 / 0 |
| [r2-standalone-focused](gate-r2-standalone-focused-01M63JBCM6N7RDGMKMERSRR201.log) | Complete recipient suites at standalone commit | 34 / 33 / 0 / 1 |
| [r2-restored-stack](gate-r2-restored-stack-01M63JKZJWNG3GV2V6WGBN7NCH.log) | Clean rebuild and recipient suites after restoring stacked checkout | 34 / 34 / 0 / 0 |

Red command after wrapper:
`bash -c 'npm run build && npm run pretest && node --test --test-force-exit --test-timeout=20000 --test-name-pattern="long-deferred|silent recipient direct|real context-only ingress|empty channel write" dist/test/recipient-compatibility.test.js dist/test/recipient-protocol.test.js'`.
Three expected assertion failures (two missing diagnostics and the blocked silent
start); zero compiler failures/cancellations. The real-ingress anchor and empty
allowlist controls pass on the reviewed runtime. No failed probe is hidden.
Focused commands use `node --test --test-force-exit` on the same two recipient files.
Restoration prepends `npm run clean && npm run build && npm run pretest`.

### Required fresh gates on both committed heads

| Head | Gate / command after wrapper | Result |
| --- | --- | --- |
| Stacked | [r2-stacked-install](gate-r2-stacked-install-01M63J2DB83K2TPKS6VABTARF0.log) — `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS |
| Stacked | [r2-stacked-typecheck](gate-r2-stacked-typecheck-01M63J2DG40CCE3F23547DAXCT.log) — `npm run typecheck` | PASS |
| Stacked | [r2-stacked-build](gate-r2-stacked-build-01M63J2DVD70DTFH5BMQYZP6F8.log) — `bash -c 'npm run clean && npm run build && npm run pretest'` | PASS |
| Standalone | [r2-standalone-install](gate-r2-standalone-install-01M63JB99VF8J9AXPT9X65N3AS.log) — `/home/orgasmic/.local/bin/bun-1.4.3 install` | PASS |
| Standalone | [r2-standalone-typecheck](gate-r2-standalone-typecheck-01M63JB9F0CYSZ9TVKXPSZ59K8.log) — `npm run typecheck` | PASS |
| Standalone | [r2-standalone-build](gate-r2-standalone-build-01M63JBASWPK89V7CYS46MTTVW.log) — same clean build chain | PASS |

Full-suite command: `AF_TEST_CONCURRENCY=8 orgasmic dispatch gate NAME -- npm test`.

| Head | Receipt | Tests / pass / fail / skip |
| --- | --- | --- |
| Stacked `5560cdd9` | [r2-stacked-suite](gate-r2-stacked-suite-01M63J2HPYB7458KBSQQRJJXTP.log) | 9339 / 9276 / 0 / 63 |
| Standalone `f48546e3` | [r2-standalone-suite](gate-r2-standalone-suite-01M63JBEB5RDMSC4WRABCC7X4N.log) | 9245 / 9181 / 0 / 64 |

Relative to each reviewed head: four net new passing tests (three new behavior
rows, one empty-allowlist row, plus one replaced anchor row). Skip counts unchanged;
standalone's extra skip remains the conditional budget-hold integration test.

Equivalence/history/name audit: [r2-equivalence](gate-r2-equivalence-01M63JM35JH6H37033VTKWVADE.log) —
`python3 "$ORGASMIC_EVIDENCE_DIR/audit-round.py"`.
All outcomes and logs: [gate-results.md](gate-results.md).

### Inherited evidence (not reused as fresh passes)

- Review 2 records stacked 9,335 total / 9,272 pass / 0 fail / 63 skip at `3e4e4990`,
  and standalone 9,241 / 9,177 / 0 / 64 at `280ec03d`. Those exact commits are the
  unmodified parents; they provide the comparison, not current-head receipts.
- Upstream base remains `0f11975e485c7077c6ed7cad9261621cd310a700`, package 0.30.0.
  Layers 1–2 and their historical qualification inputs are unchanged; this round
  does not rerun or claim new evidence for the historical base or frozen deployment.
- The historical 366/21 selection remains unreproducible from supplied sources.
  Replacement qualification and write-policy choices remain the manager's (Tarn's)
  decisions, not an owner sign-off. This round's owner button authorizes the listed
  LOW fixes only; no publication/deployment approval is inferred.

## Unmet Criteria

None. All required final gates and both equivalence comparisons passed. Both local branches retained;
checkout restored clean on the stacked head. No publication or deployment performed.

## Residual Risk

A leaked logical turn can still defer wakes indefinitely; it is now observable,
not automatically repaired. Quiesced waits intentionally suppress stale diagnostics.
The optional local extension is not a standard MCPL capability, and the handshake
is an attestation, not arbitrary-peer authentication. Tests use synthetic adapters,
stores and membranes, not real providers, credentials, agent history/state or a
host deployment. Host configuration must explicitly list channels permitted to
auto-reply. No generic context-only/mention-only delivery or closed-channel
persistence guarantee is introduced. Publication trailer/credit work remains
out of this round's scope as explicitly instructed; package consumers must pin SHA
because the version remains 0.30.0.
