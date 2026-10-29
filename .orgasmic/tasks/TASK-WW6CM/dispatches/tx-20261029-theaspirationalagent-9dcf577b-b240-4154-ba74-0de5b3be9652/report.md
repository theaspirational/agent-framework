# TASK-WW6CM review — PR #870 part 1 (strict credential dial only)

Reviewed commit `5266eb525a9b5c03d65d0a4b7ec1477fa5092c7f` on base
`4a45766f019fa11c8699645bd6806ebf3e13e5d1`. Read in full: the task record, the
implementer report and `implementation-notes.md`, and all three upstream texts in
`/srv/review-drop/PR870-{bot-review-1,bot-review-2,nissa-seru-6470665456}.md`.

## Verdict

**Approve with follow-ups.** No HIGH findings. The dial change does what the
contributor review asked for: every welcomed behaviour is kept, all three
proposals are honoured, the sink-redaction work is genuinely absent, the error
mapping table matches the code, and the gates reproduce exactly. The two
findings below are a confirmed security-relevant **test gap** and the structural
fragility behind it — the code is correct as committed, but the single line that
keeps a strict dial's rotating credential out of the log sinks is undefended by
any test in the repository.

## Findings

### MEDIUM — test (security-relevant) — `src/mcpl/transport.ts:755`

`noteDialSent(config, { url, token })` is the only thing that registers a strict
dial's provider credential in the existing bounded per-config store, which is
what the framework's redactor uses to scrub the credential out of server text
(`failures.log`, the ops webhook, `console.error` at
`src/mcpl/server-connection.ts:1304`/`:1522`). **Deleting that line breaks no
test.**

Failure scenario, reproduced: a strict server echoes the credential in its own
text (e.g. `auth failed for Bearer <token>`, or a WebSocket close reason, which
`src/mcpl/transport.ts:608` passes through as `reasonFromPeer: true`). With the
line present the token is redacted; without it the rotating credential is
written to those sinks in cleartext.

Probe — same scratch copy, only that line removed:

```
variant=orig (noteDialSent x4)  REDACTED_OUTPUT: auth failed for Bearer redacted
                                TOKEN_LEAKED: false
variant=m10  (noteDialSent x3)  REDACTED_OUTPUT: auth failed for Bearer CANARY-rotating-credential-abc123
                                TOKEN_LEAKED: true
```

And the mutation is invisible to the suite. Under Node 22.23.3 I ran the whole
relevant set (`dist/test/mcpl-*.test.js` plus every `*redact*` and `*failure*`
test file, 1,522 tests) against an unmutated control and against the mutant, and
diffed the failing-test names:

```
--- M10 failures not in baseline ---
(nothing)
```

(The control's own 4 failures are scratch-environment artifacts — `quickjs.wasm`
is copied by `postbuild`, which I did not run — and are identical in both runs.)

Fix direction: add one assertion that a strict dial feeds the store, e.g. after a
successful strict `WebSocketTransport.open`, assert
`redactServerText('... ' + token, config)` no longer contains the token. One line
of coverage closes a cleartext-credential regression path.

### LOW — design — `src/mcpl/transport.ts:727-733`, `:755`, `:800`

The redaction above works **only** by object identity. `dialsSent` is a
`WeakMap`, the strict path keys it on the caller's original `config`, and it
hands the transport a field-identical *copy* (`captured`). A field-identical copy
does not redact:

```
original config      -> auth failed for Bearer redacted
field-identical copy -> auth failed for Bearer CANARY-rotating-credential-abc123
```

Today nothing live depends on the wrong object: the constructor's
`clientErrorText(err, config, dialed)` closure at `:605` does capture `captured`,
but `openStrict` removes that listener at `:800` before resolving, and
`server-connection.ts` redacts with the original `config`. So this is latent, not
a bug. But it means any future code that redacts using the transport's own config
object silently stops redacting strict credentials, and nothing fails. The
implementer's comment at `:721-724` flags the coupling; it deserves the assertion
from the MEDIUM finding to make it enforced rather than merely documented.

### LOW — test — Bun strict subset is blind to the redirect refusal

`followRedirects` is a load-bearing part of what the contributor review welcomed,
and the `strict <status> redirect fails closed at original origin` tests are the
only guard. Flipping `const followRedirects = false` to `true`
(`src/mcpl/transport.ts:738`) **passes all 108 tests under Bun 1.4.3** and
correctly fails all 5 redirect tests under Node:

```
bun 1.4.3        107 pass  1 skip  0 fail      <- mutant survives
node 22.23.3     0 pass    5 fail              <- mutant caught
```

`ws` 8.22.0 follows the redirect in `req.on('response')`
(`node_modules/ws/lib/websocket.js:915-943`); Bun's WebSocket ignores the option.
No action needed on the code — Node is the gate that matters — but the
`strict-bun-1.4.3` receipt should not be read as covering redirect behaviour.

### LOW — robustness — `src/mcpl/transport.ts:745-752`

A provider that never settles hangs `openStrict` indefinitely when no
`AbortSignal` is passed: `WS_OPEN_TIMEOUT_MS` is only armed after the socket is
constructed. This is upstream parity (the legacy path at `:636-638` does the
same) and the production caller does pass a signal
(`server-connection.ts:1292`), so it only reaches a direct API caller. Noted, not
a regression.

## Checks performed against the brief

| Item | Result |
| --- | --- |
| Welcomed: fail-closed dial | Kept — `openStrict`, `transport.ts:722-807` |
| Welcomed: cleartext `ws://` refused off-loopback | Kept — `protocol-family.ts:785`, plus upstream `:940`; M6 mutation caught (4 fails) |
| Welcomed: capability check, `followRedirects` false | Kept — `transport.ts:738`, `:790-796`; M4 caught (4 fails) |
| Welcomed: comparison harness outside the repo | Kept — 8 files changed, no harness added |
| Proposal 1: no 32-char floor | Honoured — tests at lengths 1, 11, 31, 32; M1 (floor reintroduced) caught (4 fails) |
| Proposal 2: fewer codes, none spanning server + local refusal | Honoured — 5 codes to 4; `credential-rejected` is server-only (401/403), `provider-failed` local-only, all built through one `fail()` at `:731`; M2 caught (4 fails) |
| Proposal 3: no second redaction store | Honoured — reuses upstream `noteDialSent`/`dialsSent` (`protocol-family.ts:291-317`), `DIAL_SENT_KEPT` unchanged |
| No sink-redaction code remains | Confirmed — no retire/registry/`[withheld]`-projection/retention additions; the only redaction identifier in the `+` lines is the pre-existing import line, extended solely with `credentialRequiredProblems` |
| Error mapping table matches the code | Yes — README table vs `:731`, `:740-752`, `:790-796`; `headerCarries('')` is false so an empty credential is `provider-failed` as documented |
| No credential / provider / peer text in error messages | Confirmed — `fail()` interpolates only `id`; tests assert exact message equality, `error.constructor === Error`, `'cause' in error === false`, `Object.keys(error)` empty; the constructor's `clientErrorText` listener is removed at `:800`; M5 (leak provider text) caught |
| Reconnect paths | Covered — reconnect re-enters `openTransport` with the original config, so the provider runs again; tests assert rotated credential (`calls === 2`), refusal on a newly mistyped flag, and that an empty provider on reconnect makes **no** unauthenticated upgrade (`requests === 1`) |
| Boolean-setting validation | Goes through the shared `assertBooleanSetting`; added to `SERVER_CONFIG_BOOLEANS`, so the `BooleanSetting` mapped type makes omission a compile error and `assertServerConfigBooleans` covers it; M9 caught (11 fails) |
| No review/provenance text in README/types/changelog/tests | Confirmed — the only matches in those files are pre-existing upstream lines outside the diff |
| `serverConfigProblems` wiring | No early return drops the new problems (only the binding-failure return at `:696`); refusals detectable at config load are refused there, per `ask-b6491a7e`, and re-checked at dial — M3 caught (11 fails) |

### Mutation testing

10 mutations, applied to an out-of-tree scratch copy of `src/` (the worktree was
never modified). 8 caught by the strict subset; 1 caught only under Node (LOW
above); 1 uncaught (MEDIUM above).

| # | Mutation | Caught |
| --- | --- | --- |
| M1 | reintroduce 32-char length floor | yes (4 fail) |
| M2 | 401/403 -> `connection-failed` | yes (4 fail) |
| M3 | drop dial-time `credentialRequiredProblems` guard | yes (11 fail) |
| M4 | `engine-unsupported` -> `connection-failed` | yes (4 fail) |
| M5 | leak provider error text into the message | yes (1 fail) |
| M6 | allow non-loopback cleartext `ws://` | yes (4 fail) |
| M7 | `followRedirects = true` | Node only — Bun blind |
| M8 | drop `headerCarries` sendability check | yes (5 fail) |
| M9 | drop boolean-setting validation | yes (11 fail) |
| M10 | drop `noteDialSent` in the strict path | **no** |

## The shell stub in `implementation-notes.md` — could anything sensitive have been written?

The notes describe "an existing shell stub at `/tmp/probe-r2/env/bin/bun` that
wrote `install-env.txt` containing the local process environment". I inspected
the surviving instances of that stub. It is:

```sh
#!/bin/sh
/usr/bin/env > install-env.txt
```

So the hazard is real in principle: it dumps the **entire** environment of
whatever invokes it — including `$ORGASMIC_RUN_TOKEN` — into a file named
relative to the invoking process's **cwd**. If it had been invoked from the
worktree, the dump would have landed in the tracked tree.

**Finding: no sensitive data was written anywhere that survives, and nothing
reached the commit, the tree, or evidence.** Evidence:

- `/tmp/probe-r2` no longer exists; a whole-filesystem `find / -name
  install-env.txt` returns only two files, both under `/tmp/probe-r3/`.
- Those two are dated **2026-10-28 21:12/21:13**, a day before this run
  (~13:00 on 2026-10-29), so they are not this task's. They are 238 and 137
  bytes (8 and 4 lines) and hold only `CI, HOME, HTTPS_PROXY,
  NODE_EXTRA_CA_CERTS, PATH, PWD, SDK_ROOT, TMPDIR` — no variable whose name
  matches token/key/secret/password/auth/credential/session/cookie. They were
  written by a scrubbed installer environment, not a worker shell.
- The commit contains exactly the 8 intended files; no `install-env.txt`.
- `git status --porcelain --untracked-files=all` on the worktree is empty — no
  stray file was left in the tracked tree.
- I scanned 3,164 files across both evidence directories, the worktree and
  `/tmp/probe-r3` for my own run token's literal value: **no hits**. (Scan done
  in-process so the value never entered an argv or a file.)
- The Bun used for the `strict-bun-1.4.3` gate is a real 89 MB ELF binary
  (`/home/orgasmic/probe-kqnb1/tools/bun-linux-x64/bun`, 1.4.3), not a stub —
  the implementer's claim checks out.

Residual, not attributable to this change: three copies of the stub still sit at
`/tmp/probe-r3/{env,scp,scp2}/bin/bun`. Any future run that puts one of those
directories on `PATH` and invokes `bun` will dump its full environment,
run token included, to a cwd-relative file. I did not remove them (they predate
this run and are outside my scope); worth flagging to whoever owns the probe
sandbox. I cannot verify the contents of the implementer's already-deleted
`/tmp/probe-r2/.../install-env.txt`, only that nothing from it survives on disk,
in the commit, in the tree, or in evidence.

## Verification Gates

Rerun by me at `5266eb525a9b5c03d65d0a4b7ec1477fa5092c7f` per the brief, **not**
reused from the implementer's receipts. Clean tree before and after.

| Gate | Command after `--` | Outcome | Log |
| --- | --- | --- | --- |
| `reviewer-typecheck-node-22.23.3` | `npm run typecheck` | exit 0 | `gate-reviewer-typecheck-node-22.23.3-01M63X0WJW84QGV8SZFGD929GW.log` |
| `reviewer-build-node-22.23.3` | `npm run build` | exit 0 | `gate-reviewer-build-node-22.23.3-01M63X0WY381DB8HZAY01EDR75.log` |
| `reviewer-test-node-22.23.3` | `env AF_TEST_CONCURRENCY=8 npm test` | exit 0 — 9,324 tests, **9,261 pass / 0 fail / 63 skip** | `gate-reviewer-test-node-22.23.3-01M63X0X9GG5BP3X7DWZM89EPF.log` |

These reproduce the implementer's reported counts exactly (9,261/0/63). Node
22.23.3 only, as the brief scoped ("at least"); I did not rerun the 22.12.0 or
Bun receipts.

Unwrapped scoped probes (evidence, not reusable receipts), all in a scratch copy
at `/tmp/rv-mut` with `node_modules` symlinked, worktree untouched:

- Bun 1.4.3 strict subset baseline: 107 pass / 1 skip / 0 fail — matches the
  implementer's receipt.
- Node 22.23.3 baseline over `mcpl-*` + `*redact*` + `*failure*`: 1,522 tests,
  4 pre-existing scratch-env failures (missing `quickjs.wasm`), used as the
  control for M10.
- 10 source mutations (table above), each verified to have actually applied
  before running.
- Two production-path probes through `WebSocketTransport.open` + real loopback
  WebSocket servers, establishing the MEDIUM and the LOW-design findings.

## Unmet criteria / test gaps

Acceptance criteria are met: branch is on the named upstream main, red-before
evidence exists (`red-tests.patch`, 7 pass / 44 fail), gates are green, the diff
is 8 files / +695 lines, and the work is local only — no push, PR, comment or
message was made, and `src/framework.ts` is byte-identical to upstream.

Gaps, all test-side:

1. **The strict path's contribution to the credential-redaction store is
   unasserted** (MEDIUM). Confirmed by mutation across 1,522 tests.
2. **Redirect refusal is Node-only coverage** (LOW). The Bun receipt does not
   constrain it.
3. No test covers an unsettled provider with no `AbortSignal` (LOW; upstream
   parity).
4. Not exercised anywhere, as the implementer states: a live external provider
   and a successful remote TLS dial. The malformed-frame case is skipped on Bun
   (Bun closes the frame without emitting the socket error); Node covers it.

## Residual risk

- The MEDIUM gap is the main one: redaction of strict rotating credentials rests
  on one untested line plus `WeakMap` object identity. Correct today, silently
  breakable tomorrow — and the failure mode is cleartext credentials in
  `failures.log` and the ops webhook.
- Part 2 (sink redaction on the bounded store) will touch exactly this coupling.
  Landing the assertion from the MEDIUM finding first would give part 2 a guard
  rail it currently lacks.
- 63 tests skip in both full Node suites under existing environment conditions;
  I did not audit each skip reason, only that the count matches upstream
  expectations recorded in the logs.
- `engine-unsupported` is only ever reachable through synthetic status metadata
  in tests; no real runtime in use omits `statusCode`, so the branch is
  unexercised against a genuine engine.
- The stub hazard at `/tmp/probe-r3/*/bin/bun` persists for future runs in this
  sandbox.

## Fix directions

1. (MEDIUM) In `test/mcpl-strict-credentials.test.ts`, after the existing
   successful strict dial, add:
   `assert.ok(!redactServerText(\`sent Bearer ${token}\`, c).includes(token))`.
   That one assertion kills M10 and pins the object-identity contract.
2. (LOW, design) Consider having `openStrict` call `noteDialSent` on **both**
   `config` and `captured`, or pass the original `config` to the
   `WebSocketTransport` constructor and keep `captured` purely for policy reads.
   Either removes the identity trap instead of documenting it.
3. (LOW) Note in the task record that the `strict-bun-1.4.3` receipt does not
   cover redirect behaviour, so a future reviewer does not over-read it.
4. (LOW, docs) The README table says "Strict **dial** errors have the fixed
   form"; `connection-failed` is also reported post-open through the transport's
   error event (`transport.ts:803`). A half-sentence would close that gap.

No code was changed and no commit was made; the worktree is at
`5266eb525a9b5c03d65d0a4b7ec1477fa5092c7f` with an empty
`git status --porcelain --untracked-files=all` (ignored `dist/` from the build
gate aside). The scratch copy was deleted.
