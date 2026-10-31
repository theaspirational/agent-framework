## Changed

Head/local commit: `46be55864f95abc333c3f32c8683d7c230446aec` — Clarify the scope of the second disconnect cleanup pass. Author and committer: Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>; required GPT-6.1-Sol co-author trailer present. No push.

Only `docs/reply-routing.md` changed (5 insertions, 3 deletions). It now limits the guarantee to registrations arriving while close settles, between the two passes, and lifecycle work queued up to the second pass. It expressly makes no claim about registrations/work after that pass. This matches `test/typing-transport-epoch.test.ts:119–144` and the two `serverRemovals` increments.

Review read in full; SHA256 verified: `bf0925d2b856918ed4d850e924f3d410011d4a20ef5305d6e6a2ec99b0f46a5a` (`review.sha256`). LOW-2 unchanged as directed. Changelog checked: it does not repeat the “cannot outlive the disconnect” guarantee, so no changelog edit. No source/test/dependency edits or install/build commands.

## Verification Gates

Fresh gates at the committed clean head, each under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 timeout --signal=TERM --kill-after=60s 300s`:

| Gate / payload | Result | Log |
|---|---|---|
| `orgasmic dispatch gate r6-diff-check -- <scope/bound> git diff --check 7504acbd HEAD` | exit0 | [gate-r6-diff-check-01M680Q4M5GM2TA6PZRHQT4JZY.log](gate-r6-diff-check-01M680Q4M5GM2TA6PZRHQT4JZY.log) |
| `orgasmic dispatch gate r6-focused-existing -- <scope/bound> /opt/node-v22.23.3-linux-x64/bin/node --test --test-force-exit dist/test/typing-transport-epoch.test.js dist/test/channel-lifecycle-order.test.js` | exit0; **162 total /162 pass /0 fail /0 skip /0 cancelled** | [gate-r6-focused-existing-01M680Q4SABDRV57HE52S658SR.log](gate-r6-focused-existing-01M680Q4SABDRV57HE52S658SR.log) |

Node version: v22.23.3. Existing build used without recompilation or npm install. The two test files and two production compiled modules have identical before/after SHA256 manifests (`existing-build-before.sha256`, `existing-build-after.sha256`; comparison exit0). No timeout; no failure/cancellation names. Working tree clean.

Inherited evidence: prior head `7504acbd` full matched base/head runs and review remain context, not fresh receipts for this docs round. The previous evidence/report is retained at `/home/orgasmic/.orgasmic/runs/run-01M67W0Y48J8WSM1ZYEBFQH5G0/evidence/`. Runtime/tests are unchanged; this round ran only the assigned sanity gates, not new full suites or typecheck/build. No earlier gate pass is implied as freshly executed.

## Unmet Criteria

None for this docs-only round.

## Residual Risk

No new runtime guarantee. Registrations/work after the second disconnect pass remain outside the documented bound. Existing ID-based provenance and incomplete threaded-typing gaps remain unchanged; no same-pair or generation-safety claim added.

BEGIN PR BODY
## Summary
Narrow the disconnect-cleanup documentation to registrations arriving between the two cleanup passes and lifecycle work queued up to the second pass. No runtime changes.

## Verification
Diff check and two focused existing-build test files passed on Node22.23.3:162/162, no failures or cancellations.
END PR BODY
