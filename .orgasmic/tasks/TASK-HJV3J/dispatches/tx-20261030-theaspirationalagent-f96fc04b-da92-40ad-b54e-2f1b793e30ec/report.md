# Changed

Rebased the four automatic-reply commits from `bf6e8e0eeaa38b086bb8d05bd4efe3a3d2f54cd9` onto refreshed required-inbound-admission base `869bb3add7b48893d48b2ce50ea423e4b33fdfbc`. **No conflicts**. Kept all four per-concern commits and added one focused fix commit.

Final head: **`27a321276c8c03efe3fbc810029d25d53ec04572`**.

No push, PR edits, landing or merge. Upstream #931 remains held. Every commit author/committer is Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>; each has `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. Existing recovery refs are retained, including the pre-narrowing ref at `3f0cfbae` and a pre-fix/rebase ref at `bf6e8e0e`.

## Range-diff

`git range-diff c848977f..bf6e8e0e 869bb3ad..27a32127`:

```text
1:  76f3e407 = 1:  5aa8c3a5 feat(mcpl): expose a separate post-admission consumer
2:  248b0f58 = 2:  b3f696d2 feat(mcpl): authorize optional frozen automatic replies
3:  0612cffe = 3:  1ba34438 feat(runtime): retain every shared reply cause through turn ownership
4:  bf6e8e0e = 4:  6ea739f7 docs(mcpl): describe admitted work and separate reply authority
-:  -------- > 5:  27a32127 fix(routing): pin authority guards and fail closed across consumers
```

The four original patches are unchanged by rebase. `rebase.log`, `rebase-range-diff.txt` (before the fix), and `final-range-diff.txt` preserve the evidence. `src/mcpl/inbound-admission.ts` has **zero diff** against `869bb3ad`.

## Review disposition

The supplied review was read in full and findings checked against source. A copy and checksum are in `review-input.md` / `review-input.sha256`.

| Finding | Disposition and evidence |
| --- | --- |
| MEDIUM-1 | Fixed. Ten table-driven config cases in `test/mcp-protocol-family.test.ts`: missing admission; timeout 0/60001/1.5/NaN/string; non-function resolve/authorize; accepted boundaries 1 and 60000. P11/P12 fail these assertions. |
| LOW-1 | Fixed. Six core cases reject authorize values 1, `'true'`, `{}`, undefined, null and 0; only literal true authorizes. P8 fails the three truthy cases. |
| LOW-2 | Fixed. Direct `turnReply` mixed-destination test requires no destination; direct `shareReplyTurn` tests inspect both multi-cause sets, with a compatible control. P2/P5 fail independently of publication. |
| LOW-3 | Fixed. Direct consumer invocation with `mayWake:false` verifies an empty result and zero resolver calls, independently of the ingress wrapper. P7 fails. |
| LOW-4 | Fixed. Payload detachment now occurs inside the validated store/wake/current gate, after admission. Refused, read-only and stale controls prove the wrapper never traverses their payloads. |
| LOW-5 | Fixed. Consumer/detachment exceptions preserve the accepted verdict and attach recognized destinationless private work, with one bounded diagnostic and no exception content. Unit and real-stdio tests verify private-with-notice behavior. Pending increment and setup are inside the try; 64 injected setup errors followed by a successful resolve prove slot release. |
| LOW-6 | Fixed. Shipped source/docs/tests name required inbound admission or automatic-reply authority instead of decomposition letters. |
| LOW-7 | Fixed. Documentation explicitly discloses the admitted-work redundant-wake exemption. Both deferred/stored tests use real answered/read/publication watermarks, prove the bound wake runs, and prove an equivalent unbound wake is still dropped. |
| LOW-8 | Fixed. Both continuation producers use the stream-owner lookup with nullish fallback to the open logical turn. Existing missing-stream-owner/budget-restart coverage is retained; no new recovery contract. |

Ten files changed in the fix commit: reply ingress/authority modules, runtime fallback/comment, protocol config tests, core/ingress/runtime/stdio tests, genericity test wording, and reply-routing documentation. No dependency, lockfile or generated-file changes.

The safety contract is unchanged: optional host-approved frozen registered destinations; all original causes reauthorized before automatic open/send; private prose with readable notice on unavailable authority; compatible causes may share a turn only while every cause still authorizes the same destination; explicit sends remain separately authorized. Direct inference keeps its RPC path and pushes need no publishable route. The robustness fix preserves a private binding even if the post-admission consumer itself throws.

# Verification Gates

All required checks are fresh this round and passed. All suites ran via `orgasmic dispatch gate` under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, selecting the named Node on PATH and logging `pwd` / `node --version`.

| Tested source | Node | Passed | Failed | Skipped | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| Base `869bb3ad` | 22.23.3 | 9566 | 0 | 63 | 9629 |
| Base `869bb3ad` | 22.12.0 | 9566 | 0 | 63 | 9629 |
| Head `27a32127` | 22.23.3 | 9703 | 0 | 63 | 9766 |
| Head `27a32127` | 22.12.0 | 9703 | 0 | 63 | 9766 |

**Delta: 137 additional passing tests** on each Node; unchanged 63 skips, zero cancellations. Typecheck passed on Node 22.23.3. The focused authority/config/runtime/stdio/AST gate passed **175/175**, including the existing protocol-family cases.

### Commands, checkout ownership and logs

The gate command shape was:

```sh
orgasmic dispatch gate <name> -- systemd-run --user --scope \
  -p MemoryMax=16G -p MemorySwapMax=0 bash -c \
  '<select the named Node bin on PATH>; pwd; node --version; <payload>'
```

| Gate name | CWD / tested source | Payload | Result / console |
| --- | --- | --- | --- |
| `refreshed-base-node22.23.3` | Separate detached `dist/admission-base` checkout at `869bb3ad` | `npm run build && npm test` | exit 0; `base-node22.23.3.console.log` |
| `refreshed-base-node22.12.0` | Same separate checkout at `869bb3ad` | `npm test` | exit 0; `base-node22.12.0.console.log` |
| `head-node22.23.3` | Assigned checkout at `27a32127` | `rm -rf dist/src dist/test dist/tsconfig.tsbuildinfo; npm run build && npm test` | exit 0; `head-node22.23.3.console.log` |
| `head-node22.12.0` | Assigned checkout at `27a32127` | `npm test` | exit 0; `head-node22.12.0.console.log` |
| `typecheck` | Assigned checkout at `27a32127` | `npm run typecheck` | exit 0; `typecheck.console.log` |
| `focused` | Assigned checkout at `27a32127` | `npm run pretest && node --import ./dist/test/helpers/force-exit-blocking-stdout.js --test --test-force-exit --test-timeout=120000 dist/test/{reply-admission,reply-routing,reply-routing-core,reply-routing-transport,routing-runtime-has-no-connector-literals,mcp-protocol-family}.test.js` | exit 0; `focused.console.log` |
| `mutation-probes-rerun` | Separate detached `dist/reply-mutations` checkout at `27a32127` | `python3 "$ORGASMIC_EVIDENCE_DIR/mutations.py"` | exit 0; `mutations-rerun.console.log` |

The base gate wrapper's CWD **is the tested base checkout**, not a parent checkout around an archived source tree. Both base runs start/end clean at `869bb3ad`. Its receipts are marked `other-checkout` because it is a separate checkout, not dirty archive measurements. Head/typecheck/focused receipts are reusable clean-head receipts. Mutation receipts likewise identify the mutation checkout; the harness restores source in `finally` and checks original controls before/after. All three checkouts are clean after verification. Builds stay in the tested checkouts, outside evidence; dependencies are shared by symlink. `source-invariants.txt` records the zero-diff admission file, upstream ancestor, head and clean status.

Gate logs (relative to this report):

- `gate-refreshed-base-node22.23.3-01M677TGDGAFPDA3S9CTBWMNBM.log`
- `gate-refreshed-base-node22.12.0-01M6783E7ZAYZW7548DE6H3V2Y.log`
- `gate-head-node22.23.3-01M6783F6C6BR0DNQ64QNKT2PQ.log`
- `gate-head-node22.12.0-01M678CVBNSKA9K87HPFVK65G1.log`
- `gate-typecheck-01M67819CV6V6Z5JRWQ1P5447T.log`
- `gate-focused-01M6781MVJE1DF2KMHMQS37XTA.log`
- `gate-mutation-probes-rerun-01M6787J0J2QD0WZEV1J4SK9SK.log`

### Mutation results

Every mutant builds successfully, then exits **1** from the scoped test suite at its intended assertion. The harness gate exits 0 only after all six are killed and original-source controls pass 175/175 before and after.

| Probe | Weakened guard | Failed tests | Intended witness |
| --- | --- | ---: | --- |
| P2 | Mixed `turnReply` always takes first destination | 1 | No destination for a mixed-cause turn |
| P5 | Sharing compares only the first cause from each set | 1 | Every destination in both cause sets checked |
| P7 | Remove the read-only consumer early return | 1 | Direct mayWake:false invocation skips resolution |
| P8 | Accept truthy authorize results | 3 | Number/string/object remain private |
| P11 | Remove integer/range timeout validation | 5 | All five invalid timeout values rejected |
| P12 | Remove required admission dependency | 1 | Otherwise-valid authority without admission rejected |

Raw per-probe patches, build/test logs, original-source controls and `mutation-results.json` are in `mutation-rerun/`. The exact repeatable driver is `mutations.py`.

An initial mutation-harness invocation stopped after correctly killing P7 because its parser required `ERR_ASSERTION`; Node reported that deep-equality failure with `ERR_TEST_FAILURE` plus the expected/actual assertion diff. This was a **harness-format assumption**, not a source/test regression or survivor. The parser was corrected to recognize that assertion form, with no source changes, and all six probes plus both controls were rerun successfully. The failed attempt is retained in `gate-mutation-probes-01M67832K48MRV5VQMMGEQFSKX.log`, `mutations.console.log`, `mutations-attempt1.py` and the initial per-probe logs. No suite/typecheck gate failed; there were no environment exceptions.

## Inherited evidence

No previous gate receipt is reused or implied by this resume. Prior history, the narrowed contract and review are context only. This round freshly verifies source invariants, config/ownership tests, mutations, typecheck, and both Node matrices for the refreshed base and final head. Original four-patch equivalence is newly demonstrated by range-diff, not assumed from the previous report.

# Unmet Criteria

None. Every assigned review finding, the conflict/range-diff record, all six mutation kills, unchanged admission implementation, typecheck and both full Node matrices for head and refreshed base are complete. Publication remains deliberately out of scope.

# Residual Risk

- Maintainers may still prefer a different host option/API or post-admission ordering boundary. This round deliberately does not redesign that accepted contract.
- Opt-in effects include both private unbound automatic prose and retaining admitted-work wakes that ordinary read/publication watermarks could otherwise drop; both are now documented and tested.
- Host authorization must remain cheap, synchronous, no-I/O and side-effect-free; resolution must honor cancellation. No nested-thread transport, typing/status, replay, persistence or new recovery contract is introduced.
- The four-commit rebase was conflict-free, but future upstream changes require their own verification. The held PR was not updated.

BEGIN PR BODY
## Summary

Stacked on #906. Automatic reply publication is separate from required inbound admission and waking.

- Optional host `replyAuthority` resolves a frozen registered destination after admission completes. Missing, invalid, denied, unavailable or timed-out routes keep prose private with a readable agent notice; they do not refuse admission. Direct inference keeps its JSON-RPC reply path, and pushes need no publishable route.
- Same-destination causes may share a turn only while every original cause still authorizes that destination before automatic open/send. Connection incarnation, registration and publish grant are rechecked; mismatch never falls back. Explicit sends retain separate authorization.
- Work survives holds, retries and continuations. Locus changes cannot redirect it, and announcements use the binding or fail closed. Token release stays frame-owned; owner/silent-resume coverage adds no recovery contract.

## Hardening and compatibility

Configuration bounds and literal-true approval are explicitly tested, along with mixed-cause guards and read-only resolver suppression. Detachment follows the admission verdict; consumer/setup failures retain private work and release their pending slot.

Required inbound admission itself is unchanged. Opted-in connections keep unbound automatic prose private, and admitted-work wakes are exempt from redundant-wake drops based on ordinary read/publication watermarks. Unconfigured connections retain existing behavior. No thread transport or experimental routing profile is added.

## Verification

Full `npm test` passes on Node 22.23.3 and 22.12.0 under 16 GiB/no-swap scopes: **9703 passed, 0 failed, 63 skipped** on each (9766 total). The refreshed #906 base has **9566 passed, 0 failed, 63 skipped** on each (9629 total): **137 additional passing tests**. Typecheck passes. The focused suite passes 175/175; all six targeted guard mutations fail their intended assertions, with original-source controls passing before and after.
END PR BODY
