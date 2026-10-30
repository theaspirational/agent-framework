# Changed

One new local commit on `27a321276c8c03efe3fbc810029d25d53ec04572`:

**`29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04` — `fix(mcpl): distinguish reply config errors and throttle failure diagnostics`**.

Author/committer: Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>. Trailer: `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`.

The re-review Findings section was read and both findings verified against source (`review-input.md`, `review-input.sha256`). No push or PR edits; #931 publication remains held.

| Finding | Disposition |
| --- | --- |
| LOW-1 | Split the five authority validation clauses into separate fixed messages with no interpolated values. All eight rejecting config cases now assert the exact `problems` array; accepting boundaries remain exact empty arrays. Independent clause-removal probes prove each requirement's own cases fail. |
| LOW-2 | Replaced lifetime latches with a shared 60-second diagnostic window per live connection. Authority and consumer failures use the same weakly held connection scope, which survives reconnects; other connections are independent. Fake-Date tests prove one line within 59,999 ms and a second at 60,000 ms, with private work/verdicts and exception-content suppression unchanged. Documentation now describes the repeating throttle. |

Nine files changed: protocol validation, reply authority/ingress diagnostics, two wiring calls supplying the stable connection identity, config and fake-time tests, and the reply-routing documentation. No dependency/lockfile/generated changes. `src/mcpl/inbound-admission.ts` has **zero diff** from refreshed required-admission base `869bb3ad`. The four original concern commits and previous fix remain unchanged ancestors.

No admission, wake, route approval, publication, notice or explicit-send behavior changes. The deliberate externally observable changes are clause-specific configuration error strings and recurring bounded operator diagnostics instead of lifetime-silent faults.

# Verification Gates

All assigned gates passed at clean head `29edcf8b`. No previous head's gate pass is substituted.

| Gate | Result |
| --- | --- |
| Full `npm test`, Node 22.23.3 | **9704 passed / 0 failed / 63 skipped / 9767 total** |
| Full `npm test`, Node 22.12.0 | **9704 passed / 0 failed / 63 skipped / 9767 total** |
| `npm run typecheck`, Node 22.23.3 | exit 0 |
| Focused reply admission/authority/runtime/stdio/AST and protocol config suites | **176 passed / 0 failed** |
| Five independent config clause-removal probes | All five mutants killed by exactly their own rejecting cases; original controls pass |

Both full suites have 501 suites, zero cancellations and unchanged 63 skips. One added cross-path/connection/reconnect diagnostic test accounts for the increase from the reviewed parent's 9703 passing tests to 9704. There were no unexpected failures or environment exceptions. Negative mutant test exits are intentional proof, not regressions.

### Commands and receipts

Every check ran through `orgasmic dispatch gate <name> -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c '<Node PATH selection>; pwd; node --version; <payload>'`. The log records the actual Node version, tested CWD, clean head, scope and final receipt.

| Gate | Payload / checkout | Log relative to this report |
| --- | --- | --- |
| `head-node22.23.3` | Assigned checkout; `rm -rf dist/src dist/test dist/tsconfig.tsbuildinfo; npm run build && npm test` | `gate-head-node22.23.3-01M67AJ0EPBPHR5D0Q6Z348KT3.log` |
| `head-node22.12.0` | Same assigned checkout and emitted build; full `npm test` | `gate-head-node22.12.0-01M67BR455EQ1DEMWVS7JEP90Z.log` |
| `typecheck` | Assigned checkout; `npm run typecheck` | `gate-typecheck-01M67AEQ5Q60RJHH33YQ1VK12P.log` |
| `focused` | Assigned checkout; `npm run build && npm run pretest && node --import ./dist/test/helpers/force-exit-blocking-stdout.js --test --test-force-exit --test-timeout=120000 dist/test/{reply-admission,reply-routing,reply-routing-core,reply-routing-transport,routing-runtime-has-no-connector-literals,mcp-protocol-family}.test.js` | `gate-focused-01M67AFEHHQDT4DMJ93D3GTEG8.log` |
| `config-clause-probes` | Separate detached `dist/reply-clause-probes` checkout at the same head; `python3 "$ORGASMIC_EVIDENCE_DIR/clause-probes.py"` | `gate-config-clause-probes-01M67AH2K2D6MNG2K3HGBA3CD4.log` |

Matching `head-node*.console.log`, `typecheck.console.log`, `focused.console.log` and `clause-probes.console.log` include scope/version/receipt information. Assigned-checkout receipts are recorded reusable at this head; the probe harness receipt is correctly marked `other-checkout`. Its mutations are deliberate, scoped and restored. All builds remain in the tested checkouts, outside evidence.

`source-invariants.txt` and `final-checks.txt` record the parent, admission-file equality, diff check and clean source. `commit.txt` records identity/trailer and the nine-file commit. No lockfile or generated artifacts were committed.

## Clause-removal probes

`config-clause-probes` passed as an expected-failure harness. Each mutant builds successfully and its config test run exits 1 with exactly the intended rejecting cases red:

| Clause removed | Failing cases | Failed tests |
| --- | --- | ---: |
| Required inbound admission | Missing inboundAdmission | 1 |
| Function resolve | Non-function resolve | 1 |
| Synchronous function authorize | Non-function authorize | 1 |
| Integer timeout | 1.5 / NaN / string timeout | 3 |
| Timeout range | 0 / 60001 | 2 |

All eight rejecting cases are accounted for without unrelated failures. Original-source controls pass before/after; the isolated probe checkout is restored clean. Driver: `clause-probes.py`; raw patches, build/test logs, controls and structured results: `clause-probes/`. Gate/console: `gate-config-clause-probes-01M67AH2K2D6MNG2K3HGBA3CD4.log`, `clause-probes.console.log`.

## Inherited evidence

No earlier gate pass is reused as proof for this head. The prior conflict-free rebase onto `869bb3ad` and range-diff provenance for the unchanged ancestor commits remain valid historical evidence; this round adds only one commit on the reviewed `27a32127`. Admission-file equality and clean source status are checked anew. Earlier full matrices and mutation results apply only to their earlier heads, not to the current one.

# Unmet Criteria

None. Both LOW findings, all five own-clause mutation kills, fake-time throttle coverage, unchanged admission implementation, focused tests, typecheck and both full Node head matrices are complete. No push or PR update was performed.

# Residual Risk

- Configuration diagnostics intentionally have new exact fixed strings; consumers parsing the old combined message must adjust.
- The throttle is event-driven: a continuing fault logs on the first failing operation after its 60-second window, not from a background retry or recovery timer.
- Host approval/cancellation obligations and the separately authorized explicit-send contract are unchanged. No new recovery, routing, thread transport or deployment behavior is introduced.

BEGIN PR BODY
## Summary

Stacked on #906. Automatic reply publication is separate from required inbound admission and waking.

- Optional host `replyAuthority` resolves a frozen registered destination after admission. Unavailable authority keeps prose private with a readable agent notice, not an admission refusal. Direct inference keeps its JSON-RPC path; pushes need no publishable route.
- Compatible causes may share a turn only while every original cause still authorizes the same destination before automatic open/send. Connection, registration and grant checks fail closed without fallback; explicit sends retain separate authorization.
- Work survives holds/retries/continuations; locus changes and announcements cannot redirect its binding. Admitted-work wakes retain their authority rather than being consumed by ordinary read/publication watermarks. Unconfigured connections retain existing behavior. Token release remains frame-owned; no recovery contract is added.

## Hardening

Authority configuration has five clause-specific fixed diagnostics, pinned by exact rejection arrays and independent clause-removal probes. Persistent callback/consumer faults emit bounded operator diagnostics at most once per 60 seconds per connection, shared across failure paths and reconnects; private agent-visible behavior is unchanged. Required inbound admission itself is unchanged. No experimental routing or new thread transport is added.

## Verification

Full `npm test` passes on Node 22.23.3 and 22.12.0 under 16 GiB/no-swap scopes: **9704 passed, 0 failed, 63 skipped** on each (9767 total). Typecheck passes. Focused reply-routing/config suites pass **176/176**. Removing each of the five configuration clauses makes exactly its own rejection cases fail; original-source controls pass before and after. Fake-time tests pin the 60-second diagnostic window, connection isolation and reconnect behavior.
END PR BODY
