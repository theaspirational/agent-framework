# TASK-WW6CM implementation report

## Changed

- Local commit: `5266eb525a9b5c03d65d0a4b7ec1477fa5092c7f` — `feat(mcpl): require provider credentials for opt-in WebSocket dials`.
- Parent/base: `4a45766f019fa11c8699645bd6806ebf3e13e5d1`; branch `task-ww6cm-impl`.
- Author and committer: Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>.
- Trailer: `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`.
- Opt-in fail-closed provider credentials, cleartext refusal outside loopback,
  no credential length floor, no redirects, capability-based status classification,
  four errors from one `fail()`, and shared boolean-setting validation.
- Strict transport-factory calls reject invalid/non-WebSocket bindings before
  provider invocation or launch. Shared configuration validation retains descriptive
  errors; direct strict dials use the fixed `connection-failed` error.
- README, type docs and changelog explain user behavior only. Tests have no
  comparison/provenance labels or loader-hook/esbuild dependencies. The timeout
  test reduces only the open timer from 15,000 ms to 50 ms.
- No changes to framework logging, ops webhook, bounded dialsSent storage,
  credential lifetimes, sink projections or retention. `src/framework.ts` is
  identical to upstream. No comparison harness was added to the repository.
- Read the task and all three supplied reviews in full, CONTRIBUTING.md and the
  supplied project baseline. No applicable AGENTS.md or supplied conventions/gotchas.

### Diff stat

```
 README.md                                   |  29 +++
 changelog.d/strict-credential-dial.added.md |  10 +
 src/mcpl/protocol-family.ts                 |  26 ++-
 src/mcpl/transport.ts                       | 107 ++++++++-
 src/mcpl/types.ts                           |  15 ++
 test/mcpl-config-booleans.test.ts           |   1 +
 test/mcpl-strict-credentials.test.ts        | 338 ++++++++++++++++++++++++++++
 test/mcpl-strict-errors.test.ts             | 173 ++++++++++++++
 8 files changed, 695 insertions(+), 4 deletions(-)
```

### Error mapping

All strict dial errors are plain `Error` objects with message
`MCPL server "<id>": <code>`, without provider/peer error text or causes.
Mistyped boolean settings retain the shared descriptive configuration error.

| Code | Condition |
| --- | --- |
| `provider-failed` | Provider absent/non-callable, throws, returns nothing/empty, or returns a non-sendable value; no connection. |
| `credential-rejected` | Upgrade response status 401 or 403. |
| `engine-unsupported` | Refused upgrade lacks a finite numeric statusCode. |
| `connection-failed` | Other upgrade status, socket/TLS error, timeout, cancellation, or strict dial configuration refusal. |

Configuration mapping was confirmed by the manager in
`ask-b6491a7e497a4e6b96d17f76a579c7b5`; configuration-load refusals remain descriptive.

## Verification Gates

All final gates below ran through `orgasmic dispatch gate <name> -- <command>` at
`5266eb525a9b5c03d65d0a4b7ec1477fa5092c7f`, with clean trees at both ends and reusable successful receipts.
Node full suites ran sequentially at concurrency 8, each after its build. Process
ownership snapshots are `node-22.23.3-process.txt` and `node-22.12.0-process.txt`.

| Gate | Command after `--` | Outcome | Raw log |
| --- | --- | --- | --- |
| `typecheck-node-22.23.3` | `npm run typecheck` | PASS | [gate-typecheck-node-22.23.3-01M63WA8HENA8MZ6GW42EPH70P.log](/home/orgasmic/.orgasmic/runs/run-01M63VX4YVY0N2ACGMABSXJ91J/evidence/gate-typecheck-node-22.23.3-01M63WA8HENA8MZ6GW42EPH70P.log) |
| `build-node-22.23.3` | `npm run build` | PASS | [gate-build-node-22.23.3-01M63WA8XANVKM5R62K0RV21WG.log](/home/orgasmic/.orgasmic/runs/run-01M63VX4YVY0N2ACGMABSXJ91J/evidence/gate-build-node-22.23.3-01M63WA8XANVKM5R62K0RV21WG.log) |
| `test-node-22.23.3` | `env AF_TEST_CONCURRENCY=8 npm test` | 9,261 pass / 0 fail / 63 skip (9,324 tests) | [gate-test-node-22.23.3-01M63WA98E0KYKSGZ2G0HH181D.log](/home/orgasmic/.orgasmic/runs/run-01M63VX4YVY0N2ACGMABSXJ91J/evidence/gate-test-node-22.23.3-01M63WA98E0KYKSGZ2G0HH181D.log) |
| `typecheck-node-22.12.0` | `env PATH=/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH npm run typecheck` | PASS | [gate-typecheck-node-22.12.0-01M63WAPY58VN5TYDH1XBST0KD.log](/home/orgasmic/.orgasmic/runs/run-01M63VX4YVY0N2ACGMABSXJ91J/evidence/gate-typecheck-node-22.12.0-01M63WAPY58VN5TYDH1XBST0KD.log) |
| `build-node-22.12.0` | `env PATH=/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH npm run build` | PASS | [gate-build-node-22.12.0-01M63WJKKPCCGBJZ10V7BD6ENZ.log](/home/orgasmic/.orgasmic/runs/run-01M63VX4YVY0N2ACGMABSXJ91J/evidence/gate-build-node-22.12.0-01M63WJKKPCCGBJZ10V7BD6ENZ.log) |
| `test-node-22.12.0` | `env PATH=/tmp/credential-engines/node-v22.12.0-linux-x64/bin:$PATH AF_TEST_CONCURRENCY=8 npm test` | 9,261 pass / 0 fail / 63 skip (9,324 tests) | [gate-test-node-22.12.0-01M63WJM0AKSJRVB5072Q7HZ52.log](/home/orgasmic/.orgasmic/runs/run-01M63VX4YVY0N2ACGMABSXJ91J/evidence/gate-test-node-22.12.0-01M63WJM0AKSJRVB5072Q7HZ52.log) |
| `strict-bun-1.4.3` | `/home/orgasmic/probe-kqnb1/tools/bun-linux-x64/bun test --timeout 10000 ./test/mcpl-strict-credentials.test.ts ./test/mcpl-strict-errors.test.ts` | 107 pass / 0 fail / 1 skip (108 tests) | [gate-strict-bun-1.4.3-01M63WAQCHEGJF4J6ZTRMYFTDF.log](/home/orgasmic/.orgasmic/runs/run-01M63VX4YVY0N2ACGMABSXJ91J/evidence/gate-strict-bun-1.4.3-01M63WAQCHEGJF4J6ZTRMYFTDF.log) |

### Red-before and focused verification

- Before production edits, the tests compiled against upstream and the selected
  behavioral run produced **7 pass / 44 fail / 0 skip** (51 tests). See
  `gate-red-build-01M63W24DQ8FQF21F0DCJGEF3N.log`,
  `gate-red-strict-01M63W24SFC4EHG97XD2E46HDV.log`, and `red-tests.patch`.
  An initial test-only build diagnosed an implicit-this annotation and was fixed
  before the behavioral red run; it is not counted as behavioral evidence.
- Final focused Node strict tests: **108 pass / 0 fail / 0 skip**; also covered
  by both full suites. Real loopback servers exercise production transport and
  reconnect paths, not only mocked return values. Missing capability tests alter
  only the status metadata of a real refused upgrade.
- The open-timeout case completes using a 50 ms injected timer, not a 15 s wait.
- `git diff --check HEAD^ HEAD` passed; final working tree is clean.
- Installed/tested ws 8.22.0 and TypeScript 7.0.2; see `tool-versions.txt`.

## Unmet Criteria

None. All required gates passed. No push, PR creation, comment, Slack or Telegram
operation was performed. The PR description below is a draft only.

## Residual Risk

- No live external provider or successful remote TLS deployment was exercised.
- Full Node suites each skipped 63 tests under their existing environment/runtime
  conditions; their complete reasons are in the logs. Bun testing was limited to
  the strict subset. Its one skip is the malformed-frame case: Bun closes that
  frame without emitting the socket error the test checks; Node exercises it.
- Diagnostic filtering remains upstream behavior, including its short-string
  rules; strict dialing is not a comprehensive diagnostic secret-hiding guarantee.
- npm install/build produced ignored dependencies, lockfile and dist artifacts;
  no package declarations or lockfiles were committed. A version-discovery probe
  encountered an existing shell stub that wrote a local environment snapshot;
  it was removed, never committed or retained in evidence, and no secret value
  was printed. Actual Bun gates used the verified ELF binary. Further details
  are in `implementation-notes.md`.

## Draft PR description

**Title:** feat(mcpl): require provider credentials for opt-in WebSocket dials

### Problem

Optional credential fallback is unsuitable for connections that must authenticate
every dial. Provider failures should stop those connections locally, and callers
need to distinguish local provider failures from server credential rejection.

### Changes

- Add `credentialRequired: true` for header-authenticated WebSocket connections,
  including reconnects. Missing, throwing, empty or non-sendable providers stop
  the dial without fallback. Sendable credentials have no minimum length.
- Refuse static tokens, URL token parameters, userinfo, fragments, unsupported
  bindings and cleartext connections outside loopback. Validate the flag through
  the existing boolean-setting checks.
- Disable redirects and classify refused upgrades from numeric status metadata,
  without runtime version pins or parsing server text.
- Report `provider-failed`, `credential-rejected` for 401/403,
  `engine-unsupported` for missing numeric status, and `connection-failed` for
  other dial failures.
- Preserve optional credential behavior and existing diagnostic filtering.

### Tests

- Red-before behavioral tests: 7 passed, 44 failed before implementation.
- Node 22.23.3: typecheck and build passed; full `npm test`:
  9,261 passed, 0 failed, 63 skipped.
- Node 22.12.0: typecheck and build passed; full `npm test`:
  9,261 passed, 0 failed, 63 skipped.
- Bun 1.4.3 strict subset: 107 passed, 0 failed, 1 skipped.
- Real local sockets cover provider refusal, short credentials, redirect refusal,
  status classification, cancellation, timeout cleanup and credential rotation
  or refusal on reconnect. The open-timeout test uses 50 ms.

### Not verified

Live external credential providers and successful remote TLS connections were
not exercised. The malformed-frame error test is skipped on Bun because that
runtime closes the frame without emitting the expected socket error.

### Out of scope

Failure-log and operations-webhook redaction, credential retention changes and
new sink registries. No companion change is required to use this option.

AI-assisted contribution.
