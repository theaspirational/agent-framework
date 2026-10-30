# Slice B — destination and turn ownership

Status: complete; all assigned final gates passed at the clean implementation head.

## Changed

Base: `119cb8662d8e3d33f5aedf3633cb95ca6ec7dce1` (slice A / upstream #906).
Implementation head: `02e3622358b48713c86eea1553aac30bc3b939e9`.
No rebase, pushes, dependency changes, or changes to existing admission tests or the connector-literal inventory ceiling. The design document was read from its supplied pin and was not added to the branch. Applicable instructions: `CONTRIBUTING.md` and the supplied project baseline; no additional conventions/gotchas were supplied and no applicable AGENTS.md was found.

| Commit | Change |
| --- | --- |
| `505d8132` | Separate additive admission seam: optional post-verdict consumer within the existing timeout/cancellation slot; private routing receipt, unchanged verdict API; red-first seam tests. |
| `d40d8ec0` | Private minted work bindings, connection-qualified destination equality, host `replyRouting` configuration, data-only initialize offers, negotiated local publish-thread profile, core tests. |
| `80292b16` | Admission-boundary revalidation and automatic-send enforcement before open/send; thread carried by publish outcomes; explicit-send selection unchanged. |
| `9aa27802` | Queue/hold/dedupe ownership, debounce carriage, continuation and direct-start ownership, frozen locus and announcement consumers. |
| `4b7218b3` | Snapshot opt-in configuration before initial transport failure/reconnect; verify thread transport at admission. |
| `10e7ecce` | Neutral runtime witnesses, including setup retries, tool/budget continuations, direct-start provider release and silent resume; reuse existing pending-provider cleanup when an ended owner is dropped. |
| `c062ea10` | Real neutral stdio ingress/publish tests: collisions, concurrent agents, negotiation, cancellation, N1/N2, read-only input, pushes and debounce. |
| `61a59618` | User documentation and changelog; local-protocol and lifecycle limits explicitly stated. |
| `02e36223` | Preserve existing rewind callers with absent routing state, found by the full suite; original rewind tests remain unchanged. |

All nine commits use the requested author/committer and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. See `commit-identities.txt` and `changed-files.txt` for exact metadata and paths. Build/dependency caches are ignored and remain under the assigned worktree, not evidence.

### Authorized admission boundary change

I stopped before changing A and asked about the missing post-verdict hook. The manager approved an additive, unset-compatible seam, in a separate first commit, with the same deadline/abort/pending-slot semantics and unchanged existing tests. The full question and answer are in `scope-question.log`; source evidence is in `admission-seam-evidence.txt`. The first commit contains only the generic seam/carriage and its tests. B's concrete resolver and final admission-boundary checks are in later routing commits. This touches `inbound-admission.ts` and the channel/push/inference admission consumers additively; it does not resolve opaque intent inside A's verdict validation or alter its verdict API.

### Exit-condition witnesses

`R` = `test/reply-routing.test.ts`; `T` = `test/reply-routing-transport.test.ts`; `C` = `test/reply-routing-core.test.ts`.

| Required row | Test witness |
| --- | --- |
| 1 | R: `automatic speech publishes the frozen thread, never a later default`; default changed before publication. |
| 2 | R: `automatic speech cannot replace the frozen connector or channel`. |
| 3 | R: `recipient connections refuse automatic speech without an admitted envelope`. |
| 6 | R: `separate addressed roots queued together each get their own turn`; T: two opted-in connections and debounce preserve separate roots. |
| 7 | R: `the turn snapshots its envelope before asynchronous compilation`; mutates raw channel, thread and server during compile, checks emitted server/channel/thread. |
| 8 | R: `a later context arrival cannot move an open bound turn` (direct boundary); T: `read-only arrival on another channel cannot repin a live bound turn` (real ingress). This does not claim D's wire context-only mode. |
| 9 | R: `holds do not coalesce two roots sharing a timestamp and channel`, plus N3/N4 server/epoch/identity variants and separate hold assertions. |
| 10 | R: `explicit channel_publish still honours its chosen destination`; no inherited thread. |
| 12 | R: `a retry keeps its opening root and leaves a later root for another turn`; `a merged duplicate keeps its private owner through a setup retry`. |
| 14 | R: `tool waits and injected context keep the opening envelope while a later addressed root waits`. |
| 15 | R: `opening another channel is not an implicit redirect of the frozen reply`; T/N2 also asserts the real channel-open result succeeds before sleep. |
| 16 | R: `a tool-driven budget restart keeps the frozen envelope despite later context and another root`; asserts the production restart trace, three streams and both destinations. |
| 17 | R: unowned-open-turn scheduler variant; admitted wake remains queued. |
| 18 | R: unowned-open-turn direct-start variant; provider admission depth returns to zero. |
| 19 | R: `a recipient arriving during a non-recipient budget restart waits for its own turn`; production continuation trace and three streams. |
| N1 | T: successful all-except agent-tool path, real coordinator, injected null locus, bound/unbound controls in both locus and hybrid modes. |
| N2 | T: actual sleep announcement after successful channel-open/default activity; locus, explicit pin, conflicting pin, no-turn, silent, disabled, heartbeat and announce-off controls. Positive cases wait for the actual asynchronous wire publication and check channel plus thread. |
| N3 | R: direct `pendingRequestKey` comparison independent of ownership filtering; structural key-component assertions, opaque ids, epoch/server/root differences, identical-key newest absorption and quiesced retention. |
| N4 | R: direct `sameInferenceRequest` comparison independent of scheduling, unchanged-copy control and hold retention; C separately isolates every destination equality component from work identity. |
| Collisions / stale epochs | R: opaque separators, two peers sharing channels, epoch rebinding and forged-object refusal; lifecycle-wait rechecks for epoch/grant/registration/thread support. C: connection-instance equality and immutable, non-forgeable binding. T: two real peers, concurrent turns on different agents, and replacement-registration refusal. |
| O5 | R: silent direct-start witness now also performs the subsequent silent budget resume, checking both owner and live routing object, preserved predecessor `openLogical`, and no speech. It explicitly preserves the existing latest-silent-routing boundary, not a new recovery or simultaneous-start guarantee. |

Additional tests cover absent/partial/wrong-version negotiation even with reconnect, threadless/feature-off behavior, malformed destinations and accessors, resolver throw/timeout/cancel/close/stop, stale owner diagnostics/provider release, hint-free pushes and generic offer validation. Private scaffolding is labelled where tests install a logical-turn precondition or host-side agent fanout; the ingress and publication tests use actual framework/registry/connection paths over stdio.

## Verification Gates

Every heavy command ran through:

```sh
orgasmic dispatch gate <name> -- env XDG_RUNTIME_DIR=/run/user/1002 \
  systemd-run --user --scope -q -p MemoryMax=16G -p MemorySwapMax=0 <command>
```

For each full matrix leg, `<command>` was `bash -c 'set -e; node --version; npm run typecheck; npm run build; AF_TEST_CONCURRENCY=4 npm test'`, with the Node 22.12.0 executable prepended to PATH for that leg. `typecheck` runs `tsc --noEmit`; build runs `tsc` and the package's postbuild. The floor-version build uses an exact git archive inside the assigned worktree with the same installed dependencies. Baseline archives are pinned to `119cb866`; final archives are pinned to the implementation head.

| Tree / Node | tsc | Build | Full suite |
| --- | --- | --- | --- |
| Base / 22.23.3 | PASS | PASS | 9,601 tests: 9,538 pass, 0 fail, 63 skip |
| Base / 22.12.0 | PASS | PASS | 9,601 tests: 9,538 pass, 0 fail, 63 skip |
| Final / 22.23.3 | PASS | PASS | 9,665 tests: 9,602 pass, 0 fail, 63 skip |
| Final / 22.12.0 | PASS | PASS | 9,665 tests: 9,602 pass, 0 fail, 63 skip |

Baseline raw logs: `base-node22233.log`, `base-node2212.log`. Their receipt footers say dirty/moved-head because an uncompiled new test was added during the first baseline run and B's worktree advanced during the archived floor-version run. Neither receipt is reused to qualify the final tree; the pinned baseline source/build and raw counts provide the comparison. Final qualification is rerun at the clean reported commit.

Final focused gate: PASS, 228 tests, 0 failures, plus the successful real-ingress frozen-thread probe. Command: `node --test --test-force-exit --test-concurrency=4 --test-timeout=90000 dist/test/reply-routing*.test.js dist/test/mcpl-post-admission.test.js dist/test/mcpl-admission-*.test.js dist/test/mcpl-required-*.test.js dist/test/routing-runtime-has-no-connector-literals.test.js`, followed by the real-ingress probe.

Mutation gate: `qualified-mutations` PASS at the reported commit. Ten deliberate faults each failed for its intended assertion (not an import/type error): owner deferral, repin protection, coordinator protection, both announcement binding arguments, pending key, request equality, target match, stale epoch, and replacing the frozen outbound thread with the live default. Files were restored after every mutation; the tree is clean. Script: `mutation-checks.py`; summary: `qualified-mutations.log`; detailed logs: `mutation-*.log`.

Final reusable receipt logs (all at clean `02e3622358b48713c86eea1553aac30bc3b939e9`), relative to this report's directory:

- `gate-qualified-node22233-01M65XHNDZFSEG3WVMRD18VF67.log`
- `gate-qualified-node2212-01M65XHWT3BMRP3T8PMDEC7KC4.log`
- `gate-qualified-focused-01M65XT3P7CHS733T48NSR3SBX.log`
- `gate-qualified-mutations-01M65XG51C8D1AFS578PJ3ANCV.log`

Baseline raw receipt logs: `gate-base-node22233-01M65SK7NM4XXS80KFFDQJK78W.log` and `gate-base-node2212-01M65SPHV26725RBBWG11AKG54.log` (comparison evidence only, as explained above).

The final floor-version command prepends `$PWD/node_modules/.node2212/node_modules/node/bin` to PATH and changes to the exact HEAD archive at `node_modules/.routing-node2212` before the matrix command. The focused command is followed by `node "$ORGASMIC_EVIDENCE_DIR/routing-ingress-probe.mjs"`. The mutation command is `python3 "$ORGASMIC_EVIDENCE_DIR/mutation-checks.py"`, inside the same scoped gate wrapper. Final ancestry, clean-tree and `git diff --check` checks pass; existing A and connector-inventory tests have no diff from base.

Red/green evidence:

- `post-admission-red.log`: unchanged verdict control passed; consumer invocation and throw/refusal checks failed on A before the seam. The completed seam's four tests pass, including cancellation/pending-slot release.
- `ingress-red-base.log`: real stdio publication on the pinned A archive emitted no thread and failed the intended thread assertion. The same black-box `routing-ingress-probe.mjs` passes on B and records the frozen thread in the wire request.
- `stale-owner-red.log`: an ended owner's pending provider permit remained set. `ownership-green.log` confirms the existing cleanup path clears it without running or redirecting a successor.
- The first full B runs (`final-node22233.log`, `final-node2212.log`, before the final fix) each had nine failures in the unchanged exhaustion-rewind test file: a lightweight caller had no routing map. These were regressions, not baseline exceptions. `02e36223` makes that ownership lookup optional; `rewind-compatibility.log` passes all 14 original rewind tests. Both full suites subsequently passed in final qualification; no failure is waived as pre-existing or flaky.

`routing-runtime-has-no-connector-literals.test.ts` passes without modifying its inventory or ceiling. No existing A test was edited. No package/lockfile changes are committed.

### Upstream freshness

Immediately before completion, `git ls-remote https://github.com/anima-research/agent-framework refs/heads/main` returned `48f26ce56cf73267d715e853acc9a88b50595337`. Upstream **has moved** from `d700dce18bc9f33f65ac5965b0cc69c075aa7da1`. Raw output: `upstream-head.txt`. No rebase was performed; qualification remains against the requested slice-A base.

## Unmet Criteria

None. All assigned implementation exits and final gates passed. Open maintainer API/protocol questions below are intentionally not treated as settled standards.

## Residual Risk

- Upstream main moved to `48f26ce56cf73267d715e853acc9a88b50595337`; this stacked branch was intentionally not rebased or qualified against the newer main.
- M1: accept optional thread targets and the proposed local v1 spelling/4096-code-unit bound, or prefer registered thread-channels? No SPEC acceptance or protocol interoperability release is claimed.
- M3: confirm the public `replyRouting.resolve` / `initializeExtensions` shape and the additive post-verdict seam/private carriage on top of #906. Owned typing cleanup remains C, not this API's promise.
- M5: confirm the focused owner/silent-resume regression and standalone suite independent of #233/#361; the broader silent-routing hazard is not redesigned here.
- Distinct admitted work identities run separately even at the same destination. This is the conservative option permitted by §5; it preserves identities rather than relying on optional same-root batching.
- The supported threaded profile promises publish only. Typing ownership, broader status effects, context-only wire delivery/persistence, SPEC changes, adapters and live deployment are out of scope. No live connector/provider qualification, uncertain-delivery replay, durable reply recovery or cross-epoch reauthorization was attempted.
- Host callbacks are trusted policy. Cancellation cannot roll back side effects inside a callback; the documented non-reentrancy/purity requirement remains important.

No material design deviation beyond the explicitly approved additive A seam. M1/M3/M5 follow the design's minimal proposed recommendations and remain maintainer questions. O1/O3/O4/O5 boundaries are preserved; no H2 context-only policy or blanket status guarantee is introduced.

BEGIN PR BODY
Title: feat(mcpl): retain admitted reply destinations across logical turns

## Problem

Required inbound admission can carry private reply intent, but intent alone does not bind automatic output. Queues, continuations and channel activity must not redirect a reply or consume another admitted cause.

## Changes

- Add opt-in host `replyRouting` resolution after complete admission validation, under the same deadline and cancellation boundary.
- Freeze connection-qualified destinations and private work identity; preserve logical-turn ownership through queues, holds, retries, tool continuations and direct starts.
- Enforce automatic targets before open/send, including sleep announcements; explicit sends retain their chosen targets.
- Add an explicitly local, publish-only `experimental.replyRouting` v1 profile for opaque nested threads, plus data-only initialize offers. Threadless destinations need no extension.
- Keep unconfigured behavior and the admission verdict API unchanged. The first commit isolates the additive seam in `inbound-admission.ts` and private carriage at admission sites for review against #906.
- Add neutral runtime/real-stdio tests, documentation and a changelog fragment.

## Tests

On both Node 22.23.3 and 22.12.0, typecheck and build pass. Full suite: 9,602 passed, 0 failed, 63 skipped (baseline: 9,538 passed, 0 failed, 63 skipped). All 64 added tests pass. Focused routing/admission/inventory suite: 228 passed, 0 failed.

The exact connector-literal inventory ceiling is unchanged. Real-ingress red/green and ten targeted ownership/enforcement mutation checks supplement the suite.

## Maintainer questions

- M1: accept optional publish thread targets and this local versioned profile, or require registered thread-channels?
- M3: confirm the host resolver/initialize-offer API and additive post-admission consumer seam.
- M5: confirm the focused existing silent-resume regression without adding a recovery or simultaneous-start contract.

## Not verified / Out of scope

No live connector/provider deployment or protocol standardization. No typing ownership, context-only wire mode/persistence, host adapters, automatic replay or cross-epoch recovery. Existing silent-resume behavior is tested, not redesigned.

## Companion PRs

Stacked on #906 at `119cb8662d8e3d33f5aedf3633cb95ca6ec7dce1`; review and merge #906 first. This patch has no dependency on #233 or #361. No SPEC or adapter companion is included; nested-thread interoperability remains an explicitly local agreement.

AI-assisted implementation and testing; commits include the GPT-6-Astra co-author trailer.
END PR BODY
