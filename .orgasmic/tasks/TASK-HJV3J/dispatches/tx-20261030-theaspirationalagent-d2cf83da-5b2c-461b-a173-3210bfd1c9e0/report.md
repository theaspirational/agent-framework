# Review — TASK-HJV3J slice B (narrowed), head bf6e8e0e on A c848977f

Scope: `git diff c848977f..bf6e8e0e` (21 files, +2077/-63). Read-only; worktree left clean
at bf6e8e0e (`git status --short` empty; all mutation probes reverted with `git checkout`).

## Verdict

**APPROVE.**

The four narrowed contract points are implemented as specified, and every dispatcher
condition holds. No HIGH findings: I could not construct a path that publishes to a
destination other than the frozen one, that turns a route failure into an admission
refusal, that wakes with an unresolved binding, that publishes without the send-time
recheck, or that publishes a shared turn while one cause has lost authority. Findings
below are one MEDIUM test gap and eight LOW items (test coverage, hygiene, robustness).

### Brief checklist

| Check | Result |
| --- | --- |
| (a) exact contract, no fallback / no route-failure refusal / no unresolved wake / no unrechecked publish / no shared-turn publish with a lost cause | PASS — see Evidence |
| (b) `replyRouting` / `threaded` / `initializeExtensions` fully removed | PASS — zero hits in `src/ test/ docs/ changelog.d/ README.md` |
| (c) opted-in connections keep unbound automatic prose private | PASS, correct + documented + no regression for unconfigured connections (LOW-7 is an undocumented secondary difference) |
| (d) genericity: no connector names/literals in new runtime modules | PASS — AST gate + manual grep |
| (e) mutation probes on key guards | MOSTLY — load-bearing guards die; see MEDIUM-1, LOW-1/2/3 |
| (f) no internal names, task ids or hosts in commits/docs/PR body | PARTIAL — commits/changelog/PR body clean; slice letters leak into src + docs (LOW-6) |
| (g) full gate on Node 22.23.3 under the named scope | PASS — reproduced independently, exit 0 |

### Dispatcher conditions

- **Optional sync `authorize` (no I/O)** — `ReplyAuthorityConfig.authorize` is typed
  `=> boolean`, called at binding and at each send-time recheck (`src/mcpl/reply-routing.ts:15,124`).
- **Route resolution after A's verdict, own timeout 1..60000, AbortController, cap 64** —
  `src/mcpl/reply-admission.ts:34-40` runs the consumer only after `await admission.admit`;
  own `AbortController` + `setTimeout(timeoutMs)` at `reply-routing.ts:102-113`; cap at
  `reply-routing.ts:100`; range validated at `src/mcpl/protocol-family.ts:700-702`.
- **Overload ⇒ private, never `admission_denied`** — `reply-routing.ts:100` returns
  `privateWork()`; `reply-admission.ts:41` returns A's verdict untouched on every path.
  Probe P9b (below) confirms the suite pins this hard.
- **Zero diff to A's `inbound-admission.ts`** — confirmed:
  `git diff c848977f..bf6e8e0e -- src/mcpl/inbound-admission.ts` is 0 lines.
  A's admission tests are unmodified; the only pre-existing test edits are three
  prototype-harness field additions (`openLogical`/`turnRouting` maps), no assertion changes.
- **No unresolved binding reaches a waking turn** — resolution is awaited inside `admit`
  before the verdict returns; there is no "pending" binding state. A binding is either
  destination-bearing with a live `current()` predicate, or destinationless (private).
- **Stale epoch result discarded** — `privateWork()` mints with `current = () => false`
  (`reply-routing.ts:63,99`), and `valid()` rechecks
  `requiredAdmission.isCurrent(key)` + server identity + `channels.publish` grant +
  descriptor identity (`src/framework.ts:34985-34995`).
- **With no hook, behaviour is exactly A's** — `withReplyConsumer` returns `admission`
  unchanged when the consumer is unset (`reply-admission.ts:28`); `requiresReplyBinding`
  stays `false`; `admissionRoutingFields` returns `{}`; every `routing.reply` branch is
  falsy. The only unconditional change in `publish()` is a defensive shallow copy
  (`channel-registry.ts:5960`), inert for callers.

## Findings

### MEDIUM-1 (test) `src/mcpl/protocol-family.ts:700-702` — the new `replyAuthority` config validation has zero coverage

The whole added validation branch (requires `inboundAdmission`; `resolve`/`authorize` must
be functions; `timeoutMs` an integer in 1..60000) is untested. Two independent mutants
survive the full 110-test new suite:

- **P11** — replaced the entire integer/range clause with `false`: 110 pass, 0 fail.
- **P12** — dropped the `!config.inboundAdmission` requirement: 110 pass, 0 fail.

`grep -rn serverConfigProblems test/` hits only `test/mcp-protocol-family.test.ts`, which
never constructs a config with `replyAuthority`. The 1..60000 bound is a dispatcher-named
condition, so it should be pinned rather than inferred from the source.

*Fix direction:* add table-driven `serverConfigProblems` cases to
`test/mcp-protocol-family.test.ts` — `replyAuthority` without `inboundAdmission`;
`timeoutMs` of `0`, `60001`, `1.5`, `NaN`, a string; non-function `resolve`/`authorize`;
and the accepting boundaries `1` and `60000`.

### LOW-1 (test) `src/mcpl/reply-routing.ts:124` — "only literal `true` authorizes" is untested

**P8** replaced `authorize(approvedInput, destination) === true` with
`!!authorize(approvedInput, destination)`: 110 pass, 0 fail. Every test's `authorize`
returns a real boolean, so the documented rule (`reply-routing.ts:14`,
`docs/reply-routing.md:23`) is unpinned. A host returning a truthy non-boolean (`1`,
`'yes'`, an object) would be treated as approval.

*Fix direction:* parameterise an existing core test over `authorize` returning
`1 / 'true' / {} / undefined / null / 0` and assert all stay private.

### LOW-2 (test) `src/mcpl/reply-routing.ts:61,73` — the two redundant multi-cause destination layers are unprobed

Two mutants survive:

- **P2** — `turnReply` returns `first.destination` unconditionally instead of
  `works.every(w => sameDestination(first, w)) ? first.destination : undefined`.
- **P5** — `shareReplyTurn` compares only `sameDestination(aa[0], bb[0])` instead of
  `[...aa, ...bb].every(w => sameDestination(aa[0], w))`.

Neither is exploitable: the `current` closure minted at `reply-routing.ts:74` still
requires `works.every(w => sameDestination(first, w) && replyBindingCurrent(w))`, so the
send-time gate in `channel-registry.ts:5968` refuses. Confirmed by **P6**, which weakens
exactly that closure to `() => replyBindingCurrent(works[0])` (recheck only the routing
winner) and **does** fail 2 tests — so contract point 3 is covered at its load-bearing
layer. Flagged only because the brief asks for mutation probes on the key guards and
these two outer layers would decay silently.

*Fix direction:* two unit tests in `test/reply-routing-core.test.ts` asserting
`turnReply([a, b]).destination === undefined` and `shareReplyTurn` false for
mixed-destination cause sets, independent of the send path.

### LOW-3 (test) `src/mcpl/reply-routing.ts:98` — the `!verdict.mayWake` early return is untested

**P7** (`if (false) return {}`) leaves 110 passing. The guard is redundant with
`reply-admission.ts:35`, which already gates on `verdict.store && verdict.mayWake`, so
this is defence-in-depth only — but it means a `mayWake: false` verdict never
demonstrably skips the resolver at this layer.

### LOW-4 (efficiency) `src/mcpl/reply-admission.ts:33` — `detach()` runs ahead of A's overload refusal

`detach(item)` deep-copies the untrusted payload *before* `admission.admit`. A
deliberately checks `pending.size >= MAX_PENDING_ADMISSIONS` and returns
`admission_denied` **before** doing its own `snapshot(item)` (`inbound-admission.ts:162-164`
vs `:130`). With a consumer installed, every inbound item — including ones A will refuse
instantly for overload, staleness, or `store: false` — pays a full recursive copy first,
so the opt-in moves work ahead of a boundary A placed deliberately. Cost is ~1x payload
and opt-in only; a deep-nesting payload raises `RangeError`, which the surrounding
`catch {}` absorbs, so it is not a crash vector.

The pre-verdict position also looks unnecessary. The stated intent ("detach before either
callback") is to snapshot before a host callback can mutate `item`, but A hands its host
`snapshot(item)` and never the original (`inbound-admission.ts:130`), so no callback can
reach `item`.

*Fix direction:* move `detach(item)` inside the `verdict.store && verdict.mayWake &&
!admission.check()` block, immediately before building `input`. It then runs only for
items that actually resolve a route, and A's cheap-refusal ordering is preserved.

### LOW-5 (robustness) `src/mcpl/reply-admission.ts:38` and `src/mcpl/reply-routing.ts:101-106` — two narrow fail-open seams

1. `await consume(input, verdict)` has no `try`/`catch`. A throwing consumer propagates out
   of `admit` to the channel/push caller instead of failing closed to private. Unreachable
   with the only shipped consumer (`replyConsumer` catches broadly), but
   `postAdmissionConsumer` is an assignable public field on `McplServerConnection:487`.
2. `pending++` (`reply-routing.ts:101`) precedes the `try`, with three statements between
   it and the `try` (`new AbortController`, `addEventListener`, `Object.freeze`). A throw
   there leaks a pending slot permanently; 64 such events degrade the connection to
   always-private with no diagnostic. Not reachable with the internally constructed signal.

*Fix direction:* wrap `consume` in `try { ... } catch { /* private */ }`; move `pending++`
to the first statement inside the `try` (or the listener wiring after it).

### LOW-6 (docs/hygiene — brief item f) internal slice vocabulary in upstream-bound files

Commits, `changelog.d/admitted-reply-routing.added.md` and the PR body are clean: no task
ids, hosts, internal agent names, or run ids anywhere in the diff
(`git diff c848977f..bf6e8e0e | grep -inE 'hjv3j|orgasmic|tarn|nissa|alder|soma|anarchid|TASK-[0-9A-Z]{5}|review-drop'` → none).
Authorship is uniformly `Vasyl Dovhanchyn` with the `GPT-6.1-Sol` trailer.

But our internal slice letters leak into shipped files:

- `src/mcpl/reply-admission.ts:1` — "slice-A admission completes before route resolution"
- `src/mcpl/reply-admission.ts:31` — "Detachment cannot override A's own validation"
- `docs/reply-routing.md:33` — "A's admission completes first"
- `docs/reply-routing.md:39` — "Admission/storage rules remain A's; B only decides…"
- `docs/reply-routing.md:49` — "A's existing final current/epoch/registration checks"
- `docs/reply-routing.md:92` — "Connections without `replyAuthority` retain slice-A behavior"
- `test/routing-runtime-has-no-connector-literals.test.ts:1` — "B's new runtime"

"A"/"B" are our decomposition labels, meaningless to a maintainer reading the merged tree.
(`eidoverse` in the AST gate's forbidden-vocabulary regex is pre-existing upstream
vocabulary at `c848977f`, not introduced here.)

*Fix direction:* name the feature, not the slice — "required inbound admission" /
"this feature" / "the admission layer".

### LOW-7 (behaviour/docs) `src/framework.ts:19836` — bound requests are exempt from the redundant-wake drop, undocumented

`if (workOf(r).length) return false` removes bound requests from the `read` set, i.e. a
bound wake is never dropped as already-satisfied. This is the conservative choice (dropping
it would discard the admitted cause and its authority) and carries no loop risk, but it
means an opted-in connection can start a turn where base A would have dropped the wake.
`docs/reply-routing.md:88-93` documents the unbound-prose change for opted-in connections
but not this one.

*Fix direction:* one sentence in the opt-in paragraph, and a test asserting a bound wake
survives the `deferredWriteDone`/`storedMessageDone` drop.

### LOW-8 (consistency) `src/framework.ts:17034` vs `:16917` — divergent owner fallbacks in sibling continuation producers

The budget-restart producer uses
`(stream ? replyStreamOwners.get(stream) : undefined) ?? openLogical.get(name)`; the
`tool_results_ready` producer uses `stream ? replyStreamOwners.get(stream) :
openLogical.get(name)`. The second yields no reply when a stream exists but is unrecorded,
silently demoting the continuation to private. Unreachable today — `driveStream` records
every stream at `:24831` — but the shapes should match.

## Verification Gates

Run myself, not reused. Worktree `task-hjv3j` at bf6e8e0e, clean before and after.

| Gate | Command | Result |
| --- | --- | --- |
| `review-head-node22.23.3` | `orgasmic dispatch gate review-head-node22.23.3 -- systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c 'export PATH=/opt/node-v22.23.3-linux-x64/bin:$PATH; node --version; rm -rf dist/src dist/test dist/tsconfig.tsbuildinfo; npm run build && npm test'` | **exit 0** — v22.23.3, `# tests 9819 / # pass 9756 / # fail 0 / # cancelled 0 / # skipped 63` |

Receipt: `$ORGASMIC_EVIDENCE_DIR/gate-review-head-node22.23.3-01M6770KMFJDC854KY22W0Q7YT.log`
Console: `$ORGASMIC_EVIDENCE_DIR/review-gate.console.log`

This reproduces the implementer's head claim exactly (9756/0/63/9819 on Node 22.23.3).
I did not re-run Node 22.12.0 or `typecheck`; both have reusable clean-head receipts at
this commit, which I read rather than repeated. I did **not** reproduce the archived-base
counts (9646/0/63) — the implementer marks those as dirty-tree measurements, not receipts,
so the "+110" delta rests on their evidence plus my own count of 110 tests in the six new
files (`# tests 110 / # pass 110 / # fail 0`), which is consistent.

### Mutation probes (production path, scoped)

Baseline: the six new/changed reply test files, 110 pass / 0 fail. Each probe = edit one
guard, `npm run build`, re-run the 110, `git checkout` the file.

| Probe | Guard weakened | Result |
| --- | --- | --- |
| P1 | drop `!replyBindingCurrent(binding)` from the send-time recheck (`channel-registry.ts:5968`) | **3 fail** ✅ |
| P2 | `turnReply` returns `first.destination` for mixed-destination causes | 0 fail ⚠ LOW-2 |
| P3 | `target.routed && binding` — drop `peer?.requiresReplyBinding` (`channel-registry.ts:5962`) | **3 fail** ✅ (pins (c)) |
| P4 | 64-pending cap raised to 1e6 (`reply-routing.ts:100`) | **1 fail** ✅ |
| P5 | `shareReplyTurn` compares only `aa[0]` vs `bb[0]` | 0 fail ⚠ LOW-2 |
| P6 | shared-turn liveness rechecks only the routing winner (`reply-routing.ts:74`) | **2 fail** ✅ (pins contract 3) |
| P7 | remove `!verdict.mayWake` early return | 0 fail ⚠ LOW-3 |
| P8 | `authorize(...) === true` → `!!authorize(...)` | 0 fail ⚠ LOW-1 |
| P9b | a destinationless (private) route refuses admission instead | **19 fail** ✅ (pins "never refuses admission") |
| P10 | `inference-request` no longer bypasses the consumer (`server-connection.ts:1173`) | **4 fail** ✅ |
| P11 | drop `timeoutMs` integer/1..60000 validation | 0 fail ⚠ MEDIUM-1 |
| P12 | drop the `inboundAdmission` requirement | 0 fail ⚠ MEDIUM-1 |
| P13 | subject non-`routed` publishes to the binding gate | 0 fail — equivalent mutant: `channel_publish` resolves and sends on its own path and never enters `publish()` (`channel-registry.ts:6213` doc + `grep 'routed: true'` → the sole caller is `deliverSpeech`) |

### Other evidence

- A unchanged: `git diff c848977f..bf6e8e0e -- src/mcpl/inbound-admission.ts` → 0 lines.
- Removal complete: `grep -rni 'replyRouting|initializeExtensions|threadSupport|requiresThread|replyOffers|routeAttestation' src/ test/ docs/ changelog.d/ README.md` → none. Surviving `threadId` hits are all pre-existing connector/registry code outside the diff.
- Genericity: `test/routing-runtime-has-no-connector-literals.test.ts` AST-walks `Identifier`/`StringLiteral`/`RegExpLiteral`/`TemplateElement` in both new modules; my own grep for connector names over both modules returns only `AbortSignal`/`signal` matches.
- No alias-resolution hole: with `serverId` always supplied on the automatic path, `findExactEntry` → `entryAt` → `channels.get(destinationKey(ref))` is the same exact lookup `getDescriptor` uses, so the authorized `channelId` and the resolved `entry.descriptor.id` cannot diverge (`channel-registry.ts:4023,5862,2413`).
- Reconnect: `transportEpoch++` mutates the same `McplServerConnection` (`server-connection.ts:602`), so `postAdmissionConsumer` and `requiresReplyBinding` survive a reconnect — no "replies silently stop working after reconnect" regression.
- No leaks: `replyStreamOwners` (`framework.ts:3687`), `bindings`, `liveBindings`, `identities`, `receipts` are all Weak collections.
- Agent-initiated draft resends publish without the gate (`framework.ts:20980`, no `routed`), consistent with contract point 6 (explicit sends keep their own authorization).

## Unmet criteria / test gaps

No unmet acceptance criteria. Gaps, in priority order:

1. `replyAuthority` config validation — entirely untested (MEDIUM-1).
2. `authorize` truthiness contract — untested (LOW-1).
3. `turnReply` / `shareReplyTurn` outer destination layers — untested in isolation (LOW-2).
4. `!verdict.mayWake` early return — untested (LOW-3).
5. No test asserts an explicit `channel_publish` is refused/allowed *through `publish()`* on an opted-in connection; P13 shows the `routed` condition is unreachable for explicit sends, so that clause of contract 6 is proven by code structure rather than by test. Existing explicit-send tests (`reply-routing.test.ts:164`, `reply-routing-transport.test.ts:488-501`) do cover the tool path.
6. Base-count delta (+110) rests on the implementer's self-declared dirty-tree base measurements; I confirmed the 110 new tests exist and pass but did not re-measure `c848977f`.

## Residual risk

- **Contract churn, not correctness.** The maintainer may still reject the public
  `replyAuthority` shape or the post-admission wrapper boundary. Everything here is
  additive and opt-in, so that is rework, not breakage.
- **Opt-in blast radius.** Enabling `replyAuthority` on a connection makes *all* unbound
  automatic prose to it private (timer/heartbeat/home/unrelated module wakes) and exempts
  bound wakes from redundant-wake dropping (LOW-7). Documented for the first, not the
  second. An operator enabling this on a live deployment without auditing unbound-post
  dependencies will see prose go quiet — the failure is loud to the agent (notice) but
  silent to the operator beyond `[routeSpeech]` lines.
- **Host-obligation surface.** Correctness depends on `authorize` being cheap, synchronous
  and side-effect-free and on `resolve` honouring cancellation. Violations degrade to
  private (fail-closed) but can block the admission path for up to `timeoutMs`.
- **Rebase debt.** Head is stacked on the pre-rebase A `c848977f`; upstream main has moved
  (171 commits). The rebase onto refreshed A will need renewed gates, and `framework.ts`
  (+228 lines across ~30 sites) is the likely conflict surface.
- Not re-verified by me: Node 22.12.0 and `typecheck` (reusable receipts read, not rerun).

## Fix directions (summary)

Nothing blocks ship. If a cleanup round runs, in this order:

1. Add the `serverConfigProblems` cases for `replyAuthority` (MEDIUM-1) — cheap, closes the
   only dispatcher-named condition with no coverage.
2. Reword the six slice-letter references in `src/`, `docs/` and the new test (LOW-6) —
   pure hygiene, but these ship upstream.
3. Move `detach(item)` after the verdict gate (LOW-4) — strictly cheaper and restores A's
   cheap-refusal ordering.
4. `try`/`catch` around `consume`, and `pending++` inside the `try` (LOW-5).
5. Three small unit tests: `authorize` truthiness, `turnReply` mixed destinations,
   `shareReplyTurn` mixed destinations (LOW-1, LOW-2).
6. Align the `:17034` fallback with `:16917` (LOW-8); document the bound-wake drop
   exemption (LOW-7).
