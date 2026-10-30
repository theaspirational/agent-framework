# Review 4 — TASK-XHZ4H slice D (context-only delivery): LOW round

Reviewed commit: `b6e225e07a8214894c3f721dfb14ac0c1cf75714`.
Range: `3b075de1a1a2afd006f21964671f977897d28a80..b6e225e0` (4 commits
`4477b96b`, `f62712de`, `b8c91512`, `b6e225e0`).
Implementer report read in full: `/srv/review-drop/TASK-XHZ4H-LOWS.md`.
My prior round: `/srv/review-drop/TASK-XHZ4H-REVIEW3.md` (input, left intact).

**Artifact note.** The brief named `TASK-XHZ4H-REVIEW3.md` as "your review 3".
That file is my *previous* round's review of `3b075de1` (written 22:31, before
this round's LOWS report at 23:19) and is an input here, so I did not overwrite
it; it is intact. I intended to drop this review alongside it as
`TASK-XHZ4H-REVIEW4.md`, but `/srv/review-drop` is root-owned and not writable
by this run (`cp: Permission denied`). This review therefore exists only at
`$ORGASMIC_EVIDENCE_DIR/report.md`
(`/home/orgasmic/.orgasmic/runs/run-01M67HRH57KKZM07Y7YQDS1FGP/evidence/report.md`)
and in the finalize summary. A manager who wants it in the drop directory needs
to copy it there.

## Verdict

**APPROVE.** No HIGH, no MEDIUM. One LOW (test maintenance, deliberate
tradeoff). All four LOWs from review 3 are genuinely fixed, and the one
production change is correct, fail-closed, and backed by a test I confirmed is
load-bearing by my own mutant.

The strongest result of this round: I proved by independent probe that L1 was
not hypothetical. With the guard removed, a `context-only` row is **persisted
stamped `mode: "normal"`** — the exact O1 downgrade. The guard prevents a real,
demonstrable durable-classification defect.

## Findings

### LOW (test) `test/fixtures/context-only-fork-seed-child.mjs:12` — the version pin is stricter than the contract it protects, and will fire on a provably identical normalizer

The fixture gates on two independent assertions: the package version string
(`=== '0.24.1'`, line 12) and the normalizer SHA-256
(`dcfff6de61ea5e77ea2d75100a29021d79ba1e45844302cd8b34ffcc2526701a`, line 14).
Only the second expresses the invariant the production guard documents
(cardinality preservation). I extracted the sealed 0.24.0 store-probe tarball
read-only and computed its normalizer hash myself:

```
0.24.0  dcfff6de61ea5e77ea2d75100a29021d79ba1e45844302cd8b34ffcc2526701a
0.24.1  dcfff6de61ea5e77ea2d75100a29021d79ba1e45844302cd8b34ffcc2526701a
```

They are **byte-identical**, and 0.24.0's normalizer is likewise a
cardinality-preserving `messages.map(...)` (`dist/src/normalize-tool-messages.js:108`).

Failure scenario: a dependency bump (or an integration set that resolves a
neighbouring version) whose normalizer is unchanged fails this test on the
version string alone, with a message about a package version rather than about
the invariant. The "new audit" the report promises is then a no-op edit to a
string literal, which is exactly the kind of churn that trains a maintainer to
bump the literal without re-reading the hash.

This is a deliberate tradeoff the report states explicitly ("a dependency update
requires a new audit rather than silently carrying this witness forward"), and
it is fail-closed in the safe direction — it over-refuses, never under-refuses.
It carries **no production risk**: the runtime guard in `src/framework.ts:17870`
is version-independent and protects any version that drops rows. Non-blocking.

Fix direction (optional, not required for this round): keep the hash assertion
as the contract and demote the version assertion to a diagnostic in the failure
message, so the test fails with "normalizer changed at version X" rather than on
the version string by itself.

## Checks against the brief

**(1) L1, the only production change — the fork-seed cardinality guard.**
`src/framework.ts:17867-17872`. Confirmed on all four sub-points.

- *Fail-closed, no partial persistence.* The guard sits after
  `seed = stripUnpairedToolBlocks(withoutNotices)` (`:17866`) and **before**
  both `logSeedOmissions` (`:17873`) and the `addMessage` write loop
  (`:17874-17879`), so neither a row nor a log line escapes. The throw unwinds
  into the existing catch (`:17904-17908`), which calls
  `closeManager(release.manager)` — and `release.manager` is the fork's own
  ContextManager, set at `:17788` — and `usedEphemeralAgentNames.delete(name)`.
  `registry.register(...)` (`:17885`) and `agents.set(...)` (`:17897`) are both
  downstream of the throw, so no fork and no reserved name survive.
  Independently confirmed by my own run of the fixture: `getAgent('fork-dropped')`
  is `null`, `usedEphemeralAgentNames.has('fork-dropped')` is `false`, and
  reopening `conversations/fork-dropped` yields `getAllMessages() === []`.
  Precisely: the *message log* is empty. `ContextManager.open` does create the
  namespace shell before the seed (one `[message-store] snapshot cadence retuned:
  conversations/fork-dropped/messages` line), which is pre-existing behavior for
  any fork that throws during seeding and carries no classification.
- *Profile-off path unchanged.* The guard is gated on `this.contextOnlyStorage`.
  With the profile off, `inheritedDelivery` is never attached (`:17858-17859`)
  and `addMessage` passes `undefined` metadata, so misalignment is unobservable.
  Proven empirically, not just by reading: my own profile-off corpus differential
  is byte-identical to A's build (see gate table).
- *The comparison target is the right array.* The loop reads
  `withoutNotices[i]!.inheritedDelivery` (`:17878`) and the guard compares
  against `withoutNotices.length` — the same array, so the earlier
  length-changing filters (`withoutThinking`, `withoutPrimaryNotices`) are
  correctly outside the invariant. I verified both filters preserve the stamp:
  each is generic `<M extends {content}>` and rebuilds rows with
  `{...message, content}` (`src/framework.ts:2019-2029`, `:2081-2087`), so the
  extra `inheritedDelivery` property survives. `inheritedDelivery` has exactly
  two uses repo-wide (`:17858`, `:17878`) — there is no second unguarded
  index-paired lane.
- *The test is load-bearing (my own red control).* I built a mutant outside the
  tracked tree (`cp -al` of `dist`, hard link broken before editing) and deleted
  only the three guard lines from `dist/src/framework.js`:

  | tree | result |
  |---|---|
  | unmutated copy in `/tmp` | exit 0, `FORK_SEED_ALIGNMENT_OK` |
  | guard removed | **exit 1, `AssertionError: Missing expected rejection.`**, no OK marker |

  I then went further than the brief asked and probed what the mutant actually
  does instead of throwing. With the guard gone and the first row dropped:

  ```
  PROBE_ROWS=[{"text":"restricted seed","stamp":{"version":1,"mode":"normal","conversational":false}}]
  ```

  The surviving row was written with `mode: 'context-only'` and is **persisted as
  `mode: 'normal'`**. That is the O1 "one-way stamped history, no downgrade"
  violation L1 predicted, confirmed end-to-end through real
  `createConversationAgent` and real storage. The guard is not defensive
  boilerplate.
- *The 0.24.1 binding is not carried to 0.24.0.* The fixture hard-asserts
  version `0.24.1` **before** touching the dependency or installing the stub
  (`:11-14`), so it cannot silently execute against 0.24.0. I verified the
  binding myself rather than trusting the report: resolved entry
  `node_modules/@animalabs/context-manager/dist/src/index.js`, version `0.24.1`,
  normalizer SHA-256 `dcfff6de…701a` — matching `package-lock.json`
  (`sha512-+w8a/I11CmK/…gJBKZA==`), the production comment
  (`src/framework.ts:17868`) and the fixture literal. The sealed store-probe
  input is a different artifact: I computed
  `ee1e7682c09a26b9db0cef45c51467df654f8f7f6a91f8fd843caf697097cf24` for
  `@animalabs__context-manager@0.24.0.tgz` myself, matching the manager-supplied
  value. No 0.24.1 result is claimed for it. (Trivial pointer slip in the LOWS
  report: that checksum lives in the *parent* directory's `SHA256SUMS`, not the
  `tarballs/` directory's.) The report's disclaimer that the A+B+D integration
  tarball is not built yet is consistent with what I can see; I make no
  integration claim either. See the LOW above on the version-vs-hash split.

**(2) L2, the synthetic assistant metadata control.** Confirmed.

- *Public CM API, no forged stamp, no grant.*
  `test/helpers/context-only-compatibility-corpus.ts:32` writes via
  `f.framework.getAgent('agent')!.getContextManager().addMessage('agent', content, metadata)`
  — context-manager's public write API, on the assistant participant, with no
  wire frame involved. The metadata is `{ note, details: { sequence, labels } }`.
  The only host-reserved key is `INBOUND_DELIVERY_KEY = 'inboundDelivery'`
  (`src/stored-injections.ts:38`); neither `note` nor `details` collides, so no
  host classification is forged. No `enabledCapabilities`, no `delivery`
  selector, and the three focused controls assert `f.membrane.calls.length === 0`
  — no wake, no grant, no mode.
- *The assertion is non-vacuous.* `:35-36` filters the projection to the control
  row and `deepEqual`s it against `[{ participant: 'agent', content, metadata }]`
  — the complete nested metadata object, round-tripped through storage. `stored()`
  strips only `inboundSource`/`acceptedAt`/`deferredWriteId`, none of which the
  control carries, so the comparison is against the literal written value. This
  is exactly what review 3 found missing.
- *Wording no longer overstated.* The vacuous assertion message lost its
  "and metadata" (`:93` now "assistant content is in the differential
  projection"), with an adjacent comment stating that generated replies carry no
  metadata. `docs/context-only-delivery.md:132-137` scopes the claim honestly
  ("Generated assistant replies in the existing wake scenarios have no metadata;
  they do not qualify arbitrary assistant metadata or inherited fork stamps").
  The only remaining "content and metadata" string in the tree is an unrelated
  pre-existing `asModuleRow` docstring (`src/framework.ts:31065`). The report
  likewise does not claim profile-on whole-corpus equality — correct, since the
  differential runs only `omitted`/`disabled`.
- *Expanded corpus byte-identical, and the control is purely additive.* I ran
  both halves myself rather than reading the log, and reproduced the claimed
  hashes exactly (table below): base and head both
  `07c83b08223c37ffbdd4ac4ec6619b7aa33df1a4cfcb73a8617905f17f36d4f2`. Deleting
  only the new `assistantMetadataControl` field from *my own* head corpus
  recovers `31c0b6de00987cfa0885a54aea247cb6280e9f4d59ac48653c77b3b8be6221b9`
  — byte-for-byte the previous comparison. The differential's shape is right, not
  just its result: `run-corpus.mjs` imports the corpus *definition* from HEAD and
  the *fixture* (production build) from the target, so base and head run the same
  corpus code against different production code.
  I also checked the one way this control could have cheated: it is inserted into
  the shared `shapes` fixture before the variant loop (`:49`), so it could in
  principle perturb downstream scenarios. It does not — `shapeRows` filters to
  `body_shape_` content (`:60`), `assert.equal(shapeRows.length, 10)` and
  `membrane.calls.length === 0` still hold, and the recovery of the exact prior
  bytes for `output.shapes.results` proves nothing recorded shifted.

**(3) L3/L4 are comment-only — verified by my own token stream, not by reading
the diff.** I tokenized `src/mcpl/server-connection.ts` at both revisions with
the repo's own `@babel/parser` (TS plugin), dropped comment tokens, and hashed:

```
3b075de1  15500 tokens  76b6c0a34b1750cfbd460db323dc95fba6d2f0a8d1d4a9e66d2d1e7edd2d5526
b6e225e0  15500 tokens  76b6c0a34b1750cfbd460db323dc95fba6d2f0a8d1d4a9e66d2d1e7edd2d5526
```

**Identical.** `f62712de` and `b8c91512` change no executable token. As a
sanity control the same probe shows `src/framework.ts` moving 223079 → 223102
tokens (+23, the L1 guard), confirming the probe discriminates. Both rewordings
are accurate: `refuseCapability` (`:494-497`) now states uniformity across
*profiles* but shape-variance for selector-bearing batches (delta #3), and the
two push comments (`:1146-1148`, `:2620-2624`) now name the line-receipt
exception explicitly and reconcile with the `:1143` rationale — which was my L4
fix direction.

**(4) A's admission surface: zero diff.** `git diff 869bb3ad..HEAD --
src/mcpl/inbound-admission.ts` is **empty** (exit 0) — byte-identical. For
`server-connection.ts` I enumerated all 23 admission touchpoints in both
revisions: the identical set, line-shifted only. No changed line between A and
HEAD contains any of `requiredAdmission`, `RequiredAdmission`,
`admissionReceipts`, `admission_missing`, `refuseAdmission`, `requiredFlush`,
`transportEpoch`, `resetPolicyForTransportBoundary`, `AdmissionRefusals`,
`RefusalCode`, `RequiredIngress`, `waitForCapacity` or `invalidate(`. The entire
A→HEAD delta (31+/4-) is exactly the four-part **D seam in
`server-connection.ts`, unchanged since review 2**:

| part | line (HEAD) |
|---|---|
| `hasDeliverySelector` import | `src/mcpl/server-connection.ts:1` |
| selector-aware `refuseCapability` branch | `src/mcpl/server-connection.ts:494-508` |
| `params` argument at the generic grant check | `src/mcpl/server-connection.ts:1164` |
| pre-tap push `delivery` rejection | `src/mcpl/server-connection.ts:2620-2630` |

Judged technically, not by attribution (per the manager's clarification, this is
the task operator's engineering call, not owner consent, and I give it no
weight): the seam remains minimal, touches no RequiredAdmission block, and is
needed for D's wire contract. The new comment at `:2624` even states "Do not
consult admission here", which matches the placement (`:2620` precedes the
admission capture at `:2686`). My review-3 assessment stands unchanged.

**(5) The `--experimental-test-module-mocks` flag does not leak and cannot hide
failures.** Repo-wide, the flag occurs on exactly one line:
`test/context-only-delivery.test.ts:462`, inside the `execFileSync` argv for the
child fixture. The global runner is unaffected — `package.json`'s `test` script
is `node --import ./dist/test/helpers/force-exit-blocking-stdout.js --test
--test-force-exit …`, with no module-mock flag and no `NODE_OPTIONS` loader. It
cannot mask a failure either: `execFileSync` throws on any non-zero child exit,
and the test additionally requires the `FORK_SEED_ALIGNMENT_OK` marker, which the
child prints only after its last assertion. My mutant run exercised exactly this
path — the child failed, so the wrapper would fail. Fail-closed in both
directions (missing marker *and* non-zero exit).

**(6) My own focused run on Node 22.23.3.** Below; 4 pass / 0 fail.

**(7) Authorship and hygiene.** All four commits: author and committer
`Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, each
with a single `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>` trailer. A
scan of the range diff for `/srv`, `review-drop`, `orgasmic`, `/home/`,
`evidence`, internal operator names, `TASK-XHZ4H` and `ledgers` returns **no
matches**. The 4-commit count, the clean tree and `git diff --check` all hold.

## Verification Gates

My own executions at `b6e225e0` (Node 22.23.3, `/opt/node-v22.23.3-linux-x64`):

| check | command | result |
|---|---|---|
| typecheck | `npx tsc --noEmit` | exit 0 |
| build + fixture copy | `npx tsc`; `npm run pretest` | exit 0; dist matches HEAD sources |
| focused (brief item 6) | `node --test --test-name-pattern="fork seed normalization preserves alignment\|ordinary synthetic assistant metadata" dist/test/context-only-delivery.test.js dist/test/context-only-compatibility.test.js` | **4 pass / 0 fail / 0 skip** |
| red control, mutant | guard lines deleted from a `/tmp` copy of `dist`; child fixture run | **exit 1, "Missing expected rejection"** |
| downgrade probe | `rev-probe-shift.mjs` on the mutant | **`context-only` row persisted as `mode: "normal"`** |
| corpus differential, base | `run-corpus.mjs $PWD $PWD/data/refreshed-base-retry …` (A `869bb3ad` build) | `07c83b08…d4f2` |
| corpus differential, head | `run-corpus.mjs $PWD $PWD …` | `07c83b08…d4f2` (identical) |
| additive-only | strip `assistantMetadataControl` from my head corpus | `31c0b6de…6221b9` = previous comparison, byte-for-byte |
| token stream | `@babel/parser` comment-free token hash, `server-connection.ts` | identical parent vs HEAD |
| admission zero-diff | `git diff 869bb3ad..HEAD -- src/mcpl/inbound-admission.ts` | empty |
| dependency binding | own version + normalizer SHA-256 + lock integrity + sealed 0.24.0 tarball SHA-256 | all match |
| watchdog discrepancy | `node --test dist/test/liveness-watchdog.test.js` | **3 pass / 0 fail** |

Reused receipts (read, not rerun): `lows-full-22-23-3` exit 0 at `b6e225e0`,
clean tree — `9687 tests / 9624 pass / 0 fail / 0 cancelled / 63 skip`. That is
`+4` tests over the parent's 9683, exactly the three profile variants of the
metadata control plus the fork-seed test, with no new skips. Also reused:
`expanded-corpus-differential`, `low-boundary-integrity-fixed`,
`lows-final-focused`, `lows-final-integrity` (all exit 0). I independently
reproduced the substance of the first and third rather than relying on them.

**Classification of the open watchdog discrepancy.** The task record notes the
operator's own gate at `3b075de1` failing `watchdog kills a wedged process` and
`watchdog aborts a wedged process` in their environment, while worker and
reviewer saw 0 failures, with root cause not established. In my environment at
`b6e225e0` that file passes 3/3. `test/liveness-watchdog.test.ts` is untouched
both in this range and since A `869bb3ad`, so whatever the cause, it is **not
attributable to this diff**: **environment-specific, pre-existing, out of scope
for slice D.** It remains genuinely unresolved and should not be relabelled
env-only on my evidence alone — two environments passing does not explain why a
third fails.

**Worktree left as found:** `git status --porcelain` empty, HEAD still
`b6e225e0`, no reviewer artifact in `dist/`, worktree `dist/src/framework.js`
guard intact (the mutant's hard link was broken before editing). All probes ran
from `/tmp` and the evidence directory; temporary trees removed.

## Unmet Criteria / test gaps

Nothing unmet in this four-LOW round. Carried-forward gaps, unchanged and
correctly disclaimed by the report:

- **L7(b) profile-on end-to-end selected-wire fork seeding** is still not
  covered. The new L1 witness drives real `createConversationAgent` and real
  storage, but seeds the template through the public CM API rather than through
  a granted wire selector, so it is not the end-to-end qualification.
- The metadata control qualifies **one** ordinary synthetic metadata shape, not
  arbitrary assistant metadata schemes and not inherited delivery stamping.
- Profile-on whole-corpus equality to the pre-extension base is **not** claimed
  and not tested; the differential covers `omitted`/`disabled` only.
- No A+B+D integration-set gate exists (tarball not built), and no live
  connector/provider end-to-end qualification.
- Older deferred items (live ingress/fork witness, locus isolation, sole
  floor-branch deletion, lineage, private-symbol discipline) are explicitly not
  claimed fixed.

## Residual Risk

- **Same-length perturbation is undetected.** The guard compares lengths only,
  so a future normalizer that *reorders* or substitutes rows 1:1 would still
  misalign stamps silently. The report discloses this. I looked for a stronger
  structural fix: the review-3 "zip the stamps alongside" alternative is not
  cleanly available, because `stripUnpairedToolBlocks` returns fresh
  `{participant, content}` objects and strips extra properties, so any parallel
  array relies on the same positional assumption. The length assert plus the
  hash-pinned witness is the pragmatic ceiling here. Blast radius stays bounded
  (`inheritedInboundDelivery` always yields `conversational: false`, so no
  wake/injection/anchor effect escapes); the damage would be to the durable
  classification on the fork lane only.
- **Version-pin churn** may erode the intended audit (the LOW above).
- The failed-fork namespace shell persists (empty of messages). Harmless and
  pre-existing, but a store-level audit counting namespaces rather than rows
  would see it.
- One-way enablement, default-off, and unsupported old-code rollback are
  unchanged; the missing context-manager minimum-reader gate stays a maintainer
  follow-up, correctly not attempted here.
- The watchdog discrepancy above remains unexplained.

## Fix Directions

1. *Optional, non-blocking.* In
   `test/fixtures/context-only-fork-seed-child.mjs:12-14`, make the normalizer
   hash the asserted contract and fold the version into the failure message, so
   a compatible bump does not fail on a string literal. Datapoint for whoever
   does it: 0.24.0 and 0.24.1 ship the **identical** normalizer.
2. Carry L7(b) (profile-on fork seeding through a granted wire selector) into the
   next slice's scope, as already planned.
3. Keep the maintainer question about the dependency minimum-reader /
   classification gate open before any rollback support is offered.
