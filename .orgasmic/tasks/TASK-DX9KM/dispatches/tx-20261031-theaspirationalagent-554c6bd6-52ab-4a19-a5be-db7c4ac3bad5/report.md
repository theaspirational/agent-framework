# Independent semantic review — TASK-DX9KM stage 1 (code-only merge)

Merge under review: `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f` on `unqualified-local-abdi7-20261031`.
Parents: I7 `a0970645` (p1), D `93427f90` (p2). merge-base(I7, D) = A `869bb3ad` (verified).
Read-only review in the shared worktree; no commits, no ref changes, no edits, no new files in the tree.

**NO BUILD, TYPECHECK OR TEST RAN.** No npm/bun/node/tsc, no installs, no network, no lifecycle run.
Every statement below is static source inspection plus git object comparison. Runtime behaviour,
emitted `.d.ts`, and byte identity of build artifacts are NOT evidenced here.

## Verdict

**APPROVE** (unqualified, local only). No HIGH or MEDIUM finding. I found no semantic
preservation failure: the merge tree is the exact textual union of both sides' changes, and in
every region where the two sides' changes are co-located the relative order is the one each
side's own code requires. Three LOW items are recorded, one of which the brief already
designates a pre-publication question rather than a defect.

This approval covers merge-resolution semantics only. It does not qualify the composition, clear
I6, attest authenticity, or lift D's release hold or the #931 hold.

## Findings

### LOW-1 (design / composition consequence, new to the merge, inert)
`src/mcpl/channel-registry.ts:1986` (M) × `src/mcpl/reply-admission.ts:34` (I7, unchanged) ×
`src/mcpl/inbound-delivery.ts:6` (D, unchanged).

A context-only item now runs I7's post-admission reply consumer. `withReplyConsumer` fires on
`verdict.store && verdict.mayWake && !admission.check()` (reply-admission.ts:34). `verdict.mayWake`
comes from the operator's `inboundAdmission` hook; D's restriction is applied only *after*, in
channel-registry (`triggerInference = envelope?.mayWake !== false && plan?.wake !== false`,
M:2093). So for a context-only item whose admission verdict says `mayWake: true`, the host calls
the operator's `replyAuthority.resolve` (which may do I/O, under its own timeout) and `authorize`,
and `admissionRoutingFields(verdict)` places the resulting binding — possibly one with a real
destination — on that item's frozen envelope (M:1989). Neither parent can exhibit this: D has no
reply consumer, I7 has no context-only items.

I traced consumption and it is inert. `workOf(event)` is reachable only through `carryWork(...)`,
and every channel-lane `carryWork` that injects reply work into the system is inside a wake guard:
M:17562 and M:17623 under `if (decision.wake)`, M:17747 under
`const trigger = decision.trigger && admission.wake` (M:17730). `src/admission/admit.ts:102-104`
returns `{wake: false, gatePass: false, locus: false}` for `effects.wake === false` *before*
`policy.gate.probe/evaluate`, so the gate never sees a context-only event and the gate-requested
wake path that would otherwise carry its provenance (`workOf(provenance)`, M:4914) cannot fire.
Coalesced and push lanes are closed to context-only items by construction
(`unsupported_combination` at inbound-delivery.ts:43 and the line-receipt refusal at
server-connection.ts:2640). So no context-only item can contribute reply work to any turn, and
invariant 4 holds.

Failure scenario (not a correctness break, a disclosure/effect-surface one): a server sends a
valid `delivery: "context-only"` message on a connection configured with `replyAuthority`. The
operator's `resolve` callback is invoked — doing whatever I/O it does — for traffic the host has
already classified as non-conversational and which can never produce a reply. An operator reading
"context-only suppresses conversational effects" would not expect their reply-authority callbacks
to run for it.

Fix direction: gate the reply consumer on the delivery plan, or compute D's plan before admission
and pass it into the consumer's trigger condition, so `plan.conversational === false` short-circuits
`withReplyConsumer` before `resolve`/`authorize`. This is a composition-design question for the
owner, not a merge-resolution error — both parents' code is preserved exactly as written.

### LOW-2 (refusal-precedence change, matches D standalone, no refusal lost)
`src/mcpl/channel-registry.ts:1960-1961` (M) vs `a0970645:src/mcpl/channel-registry.ts:1952`
(I7's `admission_unsupported` arm) vs `93427f90:src/mcpl/channel-registry.ts:1937-1940` (D).

D's pre-admission delivery refusal sits ahead of I7's `admission_unsupported` coalesce refusal.
For an item carrying both a `delivery` selector and `coalesce`, M answers with D's
`unsupported_combination` / `capability_denied` where I7 alone would have answered
`admission_unsupported`. This is exactly D's standalone ordering (D places the same check at the
same point relative to the `if (admission)` block), both outcomes are closed refusals, and no I7
refusal arm is removed or made unreachable for selector-free traffic. Recorded for completeness,
not as a defect. No fix needed; if the owner wants I7's code to win that race, the pre-check would
move inside the admission block after the coalesce arm.

### LOW-3 (pre-publication question, per brief — not a defect)
Merge commit trailer, actual line: `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`.

Copied verbatim from I7 onto a merge commit authored by
`Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`. Author and committer are
the requested Vasyl noreply identity. Flagged as a pre-publication question about trailer
provenance on a merge commit, as the brief directs.

## Verification gates

Reused receipts (read, not re-run): `clean-tracked-tree`, `unchanged-d-classification`,
`unchanged-i7-ingress`, `whitespace-vs-d`, `whitespace-vs-i7` — all exit 0 at
`0bba1e8b`, logs in the implementer's evidence directory.

I independently re-derived the substance of all five rather than trusting them, plus the following.
All git commands used `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false`,
diffs additionally `--no-ext-diff --no-textconv`.

| Check | Result |
| --- | --- |
| Report sha256 `/srv/review-drop/TASK-DX9KM-MERGE1.md` | `920f2478…6cbf` — matches brief |
| Exactly two parents, in order I7 then D | Confirmed (`rev-list --parents -n1`) |
| Author / committer | `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` both |
| merge-base(I7, D) | `869bb3ad` = A, confirmed |
| Recovery refs | `recovery/abdi7-i7-a0970645` → I7, `recovery/abdi7-d-93427f90` → D, both exact |
| Files touched on both sides since A | Exactly the 7 named in the brief (`comm -12` of both name-only sets) |
| Merge-vs-I7 changed-file set | Exactly D's 25 A→D paths — no extra, no missing |
| **Diff-of-diffs, I7 side**: content lines of `A→I7` vs `D→M` over all 7 files | **IDENTICAL** |
| **Diff-of-diffs, D side**: content lines of `A→D` vs `I7→M` over all 7 files | **IDENTICAL** |
| Conflict reconstruction (`merge-tree --write-tree`) | 5 conflicted files, **6** `<<<<<<<` hunks (framework 2, channel-registry 1, push-handler 1, server-connection 1, test 1); protocol-family.ts and types.ts auto-merged — matches the report |
| Byte-identical to I7: `registration-ingress.ts`, `registration-view.ts`, `reply-admission.ts`, `reply-routing.ts`, `inbound-admission.ts`, `gate/event-gate.ts`, `index.ts` | All SAME-as-I7 |
| Byte-identical to D: `inbound-delivery.ts`, `stored-injections.ts`, `admission/admit.ts`, `capability-grant.ts`, `types/framework.ts` | All SAME-as-D |
| `registration?.invalidate()` sites in channel-registry | 7 in I7, 7 in M — no invalidation lost |
| `.capture(` sites in server-connection | 2 in I7, 2 in M — no new capture point |
| `registrationAdmissionForItem` call sites | Exactly one, channel-registry:1895, inside the per-item loop |
| `composeRegistrationIngress` call sites | Exactly three, framework.ts:35095/35169/35286 — the three host lanes |
| Test suite composition | top-level blocks: A 38, I7 38, D 39, M 39; I7's `replyAuthority` assertions present (M test:647-664), D's modern-policy block present (M test:682) |
| Report line citations | Spot-checked ~12 anchors across 8 modules and framework.ts; all resolve |

The diff-of-diffs is the strongest available preservation evidence short of execution: it proves
every line each side added is present in M and every line each side deleted is deleted in M, with
nothing else introduced. I treated it as necessary but not sufficient, and separately reviewed
relative ordering in every co-located region (below), because a clean union can still compose in
the wrong order.

### Machinery audit (chronology deviation)
The implementer disclosed that the merge ran before the no-hooks binding arrived. I confirmed from
the repo that no hook or driver could have applied:

- `git config --get core.hooksPath` → unset (exit 1).
- Common hooks dir contains **only** `.sample` files — no `pre-merge-commit`, `post-merge`,
  `prepare-commit-msg` or `commit-msg`. No worktree-local hooks dir.
- `git config --list --show-origin` matches nothing for `hooksPath`, `merge.*.driver`, `filter.*`,
  `textconv`, `diff.external`, `attributesFile`, `fsmonitor`, `gpgsign` (grep exit 1).
- No `.gitattributes` anywhere in the worktree; no `info/attributes`.
- `git check-attr -a` empty for all seven files.

The deviation is therefore procedurally real but had no executable path. It remains a disclosed
ordering gap, not a retroactive preflight receipt.

## Per-invariant table

| # | Invariant | Result | Evidence |
| --- | --- | --- | --- |
| 1 | D storage/classification ordering × I7 per-item issued context | **Preserved (static)** | M channel-registry:1959-1989: unknown-channel → D pre-`deliveryRefusal()` → `if (admission)` → coalesce arm → entry/target capture → `await admission.admit` → `admission.check()` + stale compare → **D narrowed `deliveryRefusal()`** → frozen envelope with `admissionRoutingFields(verdict)`. Identical placement to D's own 1937-1966. D's post-check sits after I7's post-await stale/refusal checks and before envelope construction, as required. No `await` between the final check and envelope freeze. One issued fork per item (`registrationAdmissionForItem(batchAdmission)`, M:1895, sole call site); `deliveryRefusal` closes over only `serverId`/`this.contextOnlyStorage`, never another item's context. No `capture()`, refresh or borrowing. Classification reaches only `effects:`/`plan`, never an ingress or reply field. |
| 2 | Frozen epochs and registration generations | **Preserved (static)** | `.capture(` count 2 → 2 (no new capture point); receipt-creation block in server-connection unchanged from I7 by the I7→M diff; `registration?.invalidate()` 7 → 7, covering replace (`registerEntry`), remove, retarget, placeholder mutation, `applyOpenDeclaration`, server removal and `clear()`. `registration-view.ts` byte-identical to I7. |
| 3 | A refusal: stale/missing key → refusal; `admission_missing` fail-closed | **Preserved (static)** | `registration-ingress.ts` byte-identical to I7: `missing()` → `admission_missing` on both `check()` and `admit()` (lines 23-27), reached from `issueRegistrationIngress` (39), `composeRegistrationIngress` (55-57), `registrationOuterCheck` (64), `registrationItemFork` (70). `admissionFor`'s `?? this.requiredAdmission!.capture(() => 'admission_missing')` arm intact at server-connection:495. `inbound-admission.ts` byte-identical. |
| 4 | B routing: `authorize(...) === true` only; private prose + notice; publication revalidation; context-only never mints reply bindings or wakes turns | **Preserved (static)** | `reply-routing.ts` byte-identical to I7: literal `authorize(approvedInput, destination) === true` at :137; `privateReplyNotice` :27; `privateReplyBinding` on consumer failure (reply-admission:41). Publication revalidation retained in M channel-registry `publish()`: `initialRefusal` → `resolvedRefusal` → `beforeOpen` → `beforeSend`, each re-checking binding, destination, `isCurrent(connection)`, `replyBindingCurrent` and `channels.publish`. Context-only wake/turn closure traced in LOW-1: all reply-work injection sites are wake-guarded and `admit.ts:102-104` bypasses the gate entirely. |
| 5 | Profile-off identity vs I7 (and D) | **Preserved behaviourally (static); byte identity UNKNOWN** | With no `delivery` field on the wire, `validateDelivery` returns `undefined` at its first line (`inbound-delivery.ts:40`) and `plan` is `undefined`. Then `if (plan && !plan.openRepair) return` is a no-op; `triggerInference = envelope?.mayWake !== false && plan?.wake !== false` reduces to I7's `envelope?.mayWake !== false` (`undefined?.wake !== false` is `true`); `attachDelivery` is not called; no `delivery` key is echoed. `CapabilityGrant.of` is pure (`conn?.grant ?? CapabilityGrant.empty()`, capability-grant.ts:293-295), so D's two extra `deliveryRefusal()` calls per item are side-effect-free. Fork seed: `this.contextOnlyStorage` false → `inheritedDelivery: undefined` and `addMessage(..., undefined)`. **Code paths the merge changes on the off-profile path, relative to I7:** the two added `deliveryRefusal()` invocations per incoming item (channel-registry:1960,1986); `refuseCapability`'s added `params` argument and its unreached batch arm (server-connection:498-508,1165); `refuseDeliverySelector` at both push-handler entries (:157,:201); the line-receipt `push/event` delivery-shape check (server-connection:2640); `isKnownCapabilityPath` filter in `mcplPolicyGrants` (protocol-family:653); the `{...message, inheritedDelivery: undefined}` map in the fork seed (framework:17881). Each is statically inert off-profile, and each is D's change reproduced verbatim — none is introduced by the resolution. Byte identity of emitted output is **not provable here; marked unknown.** |
| 6 | Fork-seed path: D's inherited classification vs I7's issued-context provenance | **Preserved (static); dependency cardinality at runtime UNKNOWN** | M framework.ts:17867-17902. The `provenance` D consumes is the context-manager compile provenance returned by `template.getContextManager().compile(...)` — a different object and namespace from I7's `RequiredIngress` provenance; the two never meet. The seed writes only `INBOUND_DELIVERY_KEY` metadata via `contextManager.addMessage`; it carries no `[replyWork]` or `[admittedEnvelope]` symbol, and `workOf` requires one of those, so copied history cannot mint a reply binding. The normalizer cardinality guard (`seed.length !== withoutNotices.length` → throw, :17894) is retained. No context recapture or registration refresh in the seed path. |

## Unmet criteria / test gaps

No acceptance criterion for the code-only merge is unmet. Gaps, all of them prohibited at this
stage rather than failing:

- No build, typecheck, `.d.ts` emission, or test execution. The composed test file is reviewed as
  source only; both suites are present and no assertion was removed, but nothing was run.
- No test exercises the composition itself. The seven-file union is covered by each parent's own
  suites independently; there is no test that puts a context-only item through a connection with
  `replyAuthority` configured — exactly the interaction in LOW-1. That is the first test stage 2
  should add.
- No profile-off byte/hash comparison against I7 or D.
- No runtime probe of the ordering in invariant 1 under concurrency (a replacement or removal
  landing during `await admission.admit`).
- The implementer's `independent-review.md` exists in its evidence; I did not rely on it and formed
  the judgement above from the repo.

## Residual risk

- **Async interleaving (unknown).** The pre/post delivery re-check pattern is correct by
  inspection, but the window around `await admission.admit(...)` — a channel replaced, removed, or
  its grant narrowed mid-await — is only argued statically. Both parents' guards are present; their
  composition under real scheduling is untested.
- **LOW-1's effect surface.** Inert today because every consumption path is wake-guarded. That
  safety rests on the invariant "reply work enters the system only via `pendingRequests`". A future
  change that reads `workOf(event)` outside a wake guard would convert LOW-1 into a live defect.
- **Inherited holds (AT RISK, unchanged by this merge).** D's release hold (reported Node12
  failures) and the #931/B hold remain. UNQUALIFIED, LOCAL ONLY.
- **Dependency contract.** The fork seed's cardinality assumption is pinned to a context-manager
  normalizer SHA in a comment (framework:17890-17891); the guard throws if violated, but the
  pinned hash was not verified against an installed dependency (no installs permitted).
- **Emitted types.** `types.ts` additions are additive and disjoint across the two sides, but no
  compiler confirmed the composed declarations.

## Fix directions

1. **LOW-1** — gate `withReplyConsumer`'s trigger on the delivery plan so a non-conversational item
   never reaches `resolve`/`authorize`: compute D's plan before admission and pass it through, or
   have the consumer condition read `effects.conversational`. Owner-facing design choice; do not
   patch it inside the merge resolution.
2. **LOW-2** — no change required. If I7's refusal should win for selector+coalesce items, move
   D's pre-check below the `admission_unsupported` arm; note that changes D's standalone ordering.
3. **LOW-3** — decide trailer provenance for a merge commit before any publication. Mechanical.
4. **Stage 2** — add the composition test named above (context-only item on a `replyAuthority`
   connection: assert no reply is sent, no turn wakes, no reply work reaches `pendingRequests`),
   then run the full suite and typecheck, which this stage could not.

## What I could not verify

Build, typecheck, emitted `.d.ts`, test execution, test outcomes, byte/hash identity of any
artifact, runtime and async behaviour, dependency normalizer cardinality against an installed
context-manager, and any qualification or privacy property of the composition. Per-command
timestamps from before the binding message do not exist and cannot be reconstructed.
