# TASK-DX9KM round 3 — STATIC delta review (attempt 2)

**Snapshot binding.** `git rev-parse HEAD` = `9184d91e796ccd201831d9456a8662d9abd47d28`; candidate full sha = `9184d91e796ccd201831d9456a8662d9abd47d28`. **They match.** Range reviewed `54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27..9184d91e796ccd201831d9456a8662d9abd47d28`. Every cited file was read through git objects at `9184d91e` (`git -c core.hooksPath=/dev/null show 9184d91e:<path>`, `git grep <pat> 9184d91e -- <paths>`), all diffs with `--no-ext-diff --no-textconv`. HEAD was never moved; no git write, no edit to any tracked file, no new file in the worktree. Inputs verified: `TASK-DX9KM-LOW1-R3.md` sha256 `6d8230de55f8755f36ac18b6321b79c8759e35649edafcd8cc5a182fe2dd93b8` OK; `TASK-DX9KM-LOW1-REVIEW1.md` sha256 `a9763762f6a90b6aa5c4327d17507977ed1e4f838cb4339326e864ed882d6647` OK.

**Procedural note.** The brief requires a progress note every 5 minutes, but this CLI has no such verb (`orgasmic dispatch --help` → `finalize | ask | message | gate` only). Progress was recorded as `$ORGASMIC_EVIDENCE_DIR/progress-01.md` and `progress-02.md`; `progress-01.md` carries the required first note (HEAD + candidate sha).

---

## Verdict

**APPROVE** as a static delta, scope-limited: LOCAL ONLY / UNQUALIFIED, **not a gate PASS**, no execution performed. The four binding truth-table rows hold on every supported in-tree call chain, no public signature changed, and no new authority is created. Findings: **0 HIGH, 1 MEDIUM, 4 LOW.** D's release hold and the #931 hold are untouched.

---

## Findings

### MEDIUM — log flood: the new diagnostic is unthrottled, against this repo's own explicit convention

`src/mcpl/reply-admission.ts:37-39` (at 9184d91e) emits a bare `console.error` once per **positive admission** whose plan argument was lost. The repository has a documented mechanism for exactly this shape — `src/mcpl/refusal-lines.ts:27` `RefusalLines`, whose header comment states the problem verbatim: *"A server that never registered a busy channel would otherwise print a line for every message in it."* Both neighbouring per-message fault paths use it: `channel-registry.ts:1960-1961` (`this.deliveryRefusalLines.admit(...)`) and `inbound-admission.ts:217` (`this.lines.admit(...)`). The new line uses neither.

Failure scenario: an operator/custom wrapper on the unscoped profile drops the fourth argument (exactly the S1/S5-unscoped situation this mechanism exists to survive — witnessed at `test/context-only-reply-admission.test.ts:146`, `drop.unscoped-plan-loss-is-diagnosed`). A server then sends a `channels/incoming` batch of N accepted context-only messages. Suppression is correct, but stderr gets N unthrottled identical lines per batch, continuously, for as long as the wrapper is in place. `channel-registry.ts` applies no cap to `params.messages` (only `:2190` counts it for a trace). Impact is operational, not a safety break — the fail-closed guarantee holds either way.

Fix direction: route the line through a `RefusalLines`-style holder (or `AdmissionRefusals`) keyed per connection, so the first occurrence prints and repeats are counted. Line content itself is fine — fixed text, no item/callback/private data.

### LOW — duplicated-module / cross-realm plan identity silently disarms the carrier (degrades to round-2 behaviour, stays closed)

`reply-admission.ts:37` tests plan identity (`delivery !== CONTEXT_ONLY`) while `:41` tests structure (`conversational === false`). Two consequences if `src/mcpl/inbound-delivery.js` is instantiated twice in one process — plausible given `package.json` offers `"bun": "./src/index.ts"` alongside `"import": "./dist/src/index.js"`, plus duplicated installs and any `src`/`dist` mixing:

1. `dispatchDelivery` (`inbound-delivery.ts:10`) becomes two distinct `AsyncLocalStorage` instances, so `appliedDispatchDelivery()` at `:34` returns `undefined` and the whole carrier protection evaporates — i.e. back to round-2, argument-only safety. Still **closed** when the argument is forwarded (`:41`'s structural check matches a non-identical clone), so this is a resilience loss, not a hole.
2. The diagnostic at `:37-38` fires **spuriously** on a healthy forwarded path, because `delivery` is the *other* copy's `CONTEXT_ONLY`. Combined with the MEDIUM above, that is a healthy-path flood.

Fix direction: make `:37` structural too (`applied?.conversational === false && delivery?.conversational !== false`), which removes the false positive and keeps the mutant kill. Note this is a pre-existing-architecture hazard, not introduced by the diff; the diff adds a new sensitivity to it.

### LOW — `appliedDispatchDelivery()` is an unnecessary public read of ambient dispatch state

`inbound-delivery.ts:18-20` is exported though its only production reader is `reply-admission.ts:34` in the same directory. It leaks a read-only probe of "am I inside a context-only channel dispatch" to anything that can reach the module (see Surface below). No authority, no write, trivially low impact — but it is avoidable surface. Fix direction: keep the read internal (module-local function used by `reply-admission` via a non-exported shared module, or accept the export and document it as `@internal`). Tests use it (`test:227,249,269,...`), which is the practical reason it is exported; an `@internal` JSDoc tag would at least mark intent.

### LOW (test) — two `drop.*-in-both-configs` assertions are vacuous in the scoped config

`test/context-only-reply-admission.test.ts:142-143` (`drop.no-reply-bindings-in-both-configs`, `drop.no-routing-fields-in-both-configs`) iterate `x.events`, and `:144` asserts `x.events.length === 0` when `scope` is true. So in the scoped half of that parametrised test both assertions pass over an empty array. The names claim "in-both-configs"; the propositions do hold in both, but are only *exercised* in the unscoped one. The scoped half's real evidence is the `admission_missing` result at `:137-139` and `reads.length === 0` at `:145`. `:144`'s own name (`...-not-vacuous`) documents the situation honestly rather than fixing it. Fix direction: rename to `...-in-unscoped-config`, or add a scoped-config event-bearing case.

### LOW (test) — the truth-table mock swallows unrelated `console.error` output

`test:356` replaces `console.error` with a filter that records the plan-loss line and **drops everything else**, unlike `test:39-42` which re-emits non-matching lines via a bound original. Across the 10 parametrised truth-table tests, a genuine unrelated error line would be invisible. Fix direction: mirror the `:38`/`:41` pattern (`const error = console.error.bind(console); ... else error(...args)`).

---

## Answers to the briefed questions

### 1. Carrier provenance
- The ALS store is written **only** at `channel-registry.ts:1983`. Exhaustive: `git grep withAppliedDelivery 9184d91e -- src` returns the import (`channel-registry.ts:46`), the call site (`:1983`), and the definition (`inbound-delivery.ts:13`) — nothing else in `src`.
- The value is D's already-validated plan: `validateDelivery` runs at `channel-registry.ts:1965-1967` and refuses before the scope exists; `:1968` selects the frozen constant or `undefined` (`const plan = hasDeliverySelector(message) ? CONTEXT_ONLY : undefined`). The same `plan` binding is passed both as the scope value and as the fourth argument at `:1983`. Nothing parses, copies or strips the item.
- `enterWith` appears **nowhere** in the repo (`git grep enterWith 9184d91e -- src test` → empty). Only `.run` (`inbound-delivery.ts:14`) and `.getStore` (`:19`).
- The instance is **unexported**: `const dispatchDelivery = new AsyncLocalStorage<DeliveryPlan>()` at `inbound-delivery.ts:10`, module-private, never returned, no disable/reset/registry. The two unrelated ALS instances in the repo (`modern-connection.ts:125,131`, `modules/workspace/disk-agreement.ts:55`) are separate stores.

### 2. Entry capture
Yes. `reply-admission.ts:34` — `const applied = lane === 'channels/incoming' ? appliedDispatchDelivery() : undefined;` — is the **first statement** of `admit`, synchronous, and precedes the only await on the A call at `:35`. It is an immutable `const` holding a frozen object (`inbound-delivery.ts:6-7`, both `Object.freeze`). There is exactly one `appliedDispatchDelivery()` call in `reply-admission.ts` (confirmed by grep); **no later ambient lookup remains**.

This is load-bearing, not decorative: the inner A path already crosses a microtask hop and a `Promise.race` (`inbound-admission.ts:191,196`) and then an arbitrary host callback (`:148`), so a post-await ambient read would have been genuinely fragile.

### 3. Omission

#### (A) Supported in-tree call chains from `:1983` to the consumer

The decisive structural fact: **`withReplyConsumer` is the outermost wrapper in both profiles**, and every hop between `:1983` and its `admit` is either a reference-preserving spread or a reconstruction that puts `withReplyConsumer` outermost again. So `reply-admission.ts:33` is entered **synchronously inside the `run` callback**, in every supported chain.

- **Composition root** — `server-connection.ts:1189-1192`: `scoped = registrations ? withRegistrationScope(admission, view) : admission`, then `withReplyConsumer(scoped, ...)`. Registration scope is therefore always *inner*.
- **Framework spread, all three lanes** — `framework.ts:35095-35099` (push), `35169-35173` (inference), `35286-35290` (channels/incoming): `{ ...original, check: () => ... }`. **No `admit` key is overridden** at any of the three, so `admit` is the identical function reference. A dropped argument here is structurally impossible.
- **Registration-ingress compositor** — `registration-ingress.ts:53-58`: unscoped (`!original.forItem && !protectedKeys.has(original.key)`, `:54`) returns `outer` — the spread, same `admit`. Scoped re-issues via `:58`/`:49` `Object.freeze({ ...ingress, forItem })` — again same `admit` reference. Note `:55` rejects any outer whose `admit !== original.admit`, so an *explicit* re-wrapper is refused `admission_missing` rather than silently accepted (this is the scoped arm of S5).
- **Per-item fork** — `channel-registry.ts:1895` `registrationAdmissionForItem(batchAdmission)` → `registration-view.ts:162` → `registration-ingress.ts:67-72`. Unscoped: returns the object unchanged (`:69`). Scoped: `admission.forItem!(admission)` → `:43-46` → `create(outer)` → `reply-admission.ts:55-56` `withReplyConsumer(admission.forItem!(outer), ...)`, which rebuilds with the reply consumer **outermost** over a fresh `withRegistrationScope` (`registration-view.ts:151-157`). Construction happens outside the scope; only `admit` is called inside it, which is what matters.
- **Registration view** — `registration-view.ts:140-148` is always *inner* of the capture at `:34`.

Therefore, for each supported chain, a dropped fourth argument still suppresses:

| Drop point | Cite | Result |
|---|---|---|
| `:1983` fourth arg (S1) | `channel-registry.ts:1983` | `delivery` undefined, `applied === CONTEXT_ONLY` → `reply-admission.ts:41` returns the verdict. Suppressed + diagnostic. |
| Framework compositor | `framework.ts:35287` | Not droppable — spread preserves `admit` by reference. |
| Compositor replaced with an explicit 3-arg admit (S5) | `registration-ingress.ts:55-56` | Scoped: `missing(key)` → refused at `channel-registry.ts:1979-1980` before A. Unscoped (`:54` returns `outer`): carrier suppresses + diagnoses. |
| `registration-view.ts:146` (S4) | `registration-view.ts:140,146` | Inner of the capture; outer consumer already holds `applied`. Suppressed. |
| `reply-admission.ts:35` inward (S3) | `reply-admission.ts:33-35` | Inner terminal (`inbound-admission.ts:143`) ignores `delivery` anyway. No observable effect. |

#### (B) Arbitrary custom/operator wrappers — explicit fail-open counterexamples

Each of these makes `applied` `undefined` at `reply-admission.ts:34`. **If the wrapper also drops the fourth argument, the path fails open** (preparation runs for a context-only item); if it forwards the argument, `:41`'s `delivery?.conversational === false` still closes it — i.e. you fall back to round-2 argument-only safety.

1. **Callback/queue created outside the scope and drained later.** A wrapper whose `admit` pushes `() => inner.admit(lane, item, signal)` onto a queue owned by a drainer loop started at connection setup, returning a promise the drainer settles. The drainer's async context predates the dispatch, so `getStore()` there is `undefined`. — **Not reachable in-tree.** No queue/drain hop exists between `:1983` and `reply-admission.ts:33`: `git grep 'setImmediate|setTimeout|queueMicrotask|process.nextTick|MessagePort|new Worker|EventEmitter|\.emit\(' 9184d91e -- src/mcpl/reply-admission.ts src/mcpl/registration-view.ts src/mcpl/registration-ingress.ts src/mcpl/inbound-delivery.ts` yields exactly one hit, `registration-view.ts:109`, a scope-evidence abort timer that is not an admit hop.
2. **EventEmitter registered before the dispatch.** Precision matters here: Node's `emit` is synchronous and runs listeners on the **emitter's call stack**, so a listener registered before the dispatch but emitted *inside* the `run` callback still sees the store. The failing shape is an emit that happens **outside** the scope — e.g. the wrapper's `admit` returns a pending promise and the transport read loop later emits the event that invokes `inner.admit`. — **Not reachable in-tree.** The framework's own emitter hop (`framework.ts:35276` `onRequest('channels-incoming', ...)`) is strictly *upstream* of `:1983`, so it is irrelevant.
3. **Thenable or promise resolved from another context.** `.then()` captures context at the moment `.then` is called, so a continuation attached *inside* the run keeps the store. The failing shape is a **pre-attached** continuation — `preExistingPromise.then(() => inner.admit(...))` wired at wrapper construction, or a user thenable whose `then` is invoked by a resolver running outside the dispatch. — **Not reachable in-tree.** `inbound-admission.ts:191` does use `Promise.resolve().then(...)`, but it is attached *inside* the run and sits *inner* of the `:34` capture, so it neither loses the store nor affects `applied`.
4. **`setImmediate`/`setTimeout` from a pre-existing context.** A timer scheduled before the dispatch whose callback calls `inner.admit` has no store. (A timer scheduled *inside* the run does carry it.) — **Not reachable in-tree** (same grep as (1)).
5. **Worker thread / MessagePort.** ALS does not propagate across threads at all, so a wrapper that forwards admission to a worker has `applied === undefined` unconditionally. Worse, a structured-cloned fourth argument is no longer identical to `CONTEXT_ONLY`, so the `:37` identity diagnostic would not even fire — only `:41`'s structural check would still suppress. — **Not reachable in-tree**; no `Worker`/`MessagePort` on this path (same grep).

I make **no** universal omission claim from the ALS variable being private or from the helpers being module-scoped. The claim is exactly: *for the enumerated supported chains above, with the cites above, a dropped fourth argument still suppresses* — and for arbitrary wrappers that defer work outside the dispatch context **and** drop the argument, the path fails open. The implementer's report states this residual honestly (R3 §Residual Risk, "Removal/bypass of the dispatch scope itself, or a runtime that does not preserve its async context, is not claimed verified").

### 4. Nested and concurrent
- **Per-item scope, not global stickiness.** `channel-registry.ts:1983` is inside the `for (const message of params.messages)` loop opened at `:1894`, so each item installs its own `run` scope; a nested `channels/incoming` dispatch re-enters `:1983` and installs its own, overriding the parent for its subtree. A nested NORMAL item inside a context-only dispatch gets `plan === undefined` → `withAppliedDelivery(undefined, ...)` → `NORMAL` (`inbound-delivery.ts:14`) → `:41` false → normal preparation. The converse holds symmetrically. Source witnesses: `test:297-323`, both directions × both profiles, asserting `['outer','after-inner', ...]` restoration.
- **Trusted per-item dispatch vs unconstrained helper call.** `:1983` is the only production writer and always passes D's validated `plan` for *that* message. `withAppliedDelivery` called from anywhere else is an unconstrained helper call that can only install a restriction; it cannot survive into `:1983`'s subtree, because `:1983` nests its own `run`.
- **Lane isolation under nesting** is handled by the `lane === 'channels/incoming'` guard at `reply-admission.ts:34`: a nested `push/event` admit raised from inside a context-only channel dispatch reads `applied === undefined` and keeps normal preparation. Cited witnesses: `test:233,254` (`push.no-channel-carrier-at-admission`, `inference.no-channel-carrier-at-admission`).
- **Nothing new is shared across concurrent items.** The single `AsyncLocalStorage` instance is shared, but each `run` yields a per-async-context store; the captured value is a `const` holding a frozen object. The only other module state in the touched files is pre-existing (`reply-admission.ts:8` `receipts` WeakMap keyed on verdict; `registration-ingress.ts:13-14` `contexts`/`protectedKeys` WeakMap/WeakSet). No item registry, no per-connection mutable map was added. Source witness: `test:263-295`.

### 5. Normal equivalence
**Algebraically identical to `0bba1e8b`** for NORMAL and legacy.

- `0bba1e8b:src/mcpl/reply-admission.ts:34`: `if (verdict.store && verdict.mayWake && !admission.check()) { prepare }` — no `delivery` parameter at all.
- `9184d91e:src/mcpl/reply-admission.ts:36,41`: same three conjuncts at `:36`, then `:41` `if (applied?.conversational === false || delivery?.conversational === false) return verdict;`.
  - **Trusted NORMAL** (`:1983` with `plan === undefined`): `applied = NORMAL`, `NORMAL.conversational === true` (`inbound-delivery.ts:6`) → false; `delivery === undefined` → `undefined === false` → false. Prepares. Identical.
  - **Legacy normal, no context-only decision** (no enclosing scope): `applied === undefined` → `undefined?.conversational === false` → false; `delivery === undefined` → false. Prepares. Identical.
  - The round-2 form `delivery?.conversational !== false` is the exact negation of the second disjunct, so that half is unchanged too; the first disjunct is the only new restriction and is false for both rows.
- **The new `console.error` cannot fire on a healthy path.** `:37` requires `applied === CONTEXT_ONLY`, which is false for both rows above; and on the healthy context-only path `:1983` passes the *same object* as scope value and fourth argument, so `delivery !== CONTEXT_ONLY` is false. Source witnesses asserting zero diagnostics on healthy paths: `test:103,118,240,257,291,319,384`.
- **Flood risk: yes, on the fault path.** See the MEDIUM finding.

### 6. Lanes
- **Push never reads the carrier.** Two independent guards: (a) no `withAppliedDelivery` call exists on the push path — `push-handler.ts:184` is `await admission.admit('push/event', params)`, two arguments, and the grep in Q1 shows no writer outside `channel-registry.ts:1983`; (b) `reply-admission.ts:34` returns `undefined` for any lane other than `channels/incoming`. Push's predicate is therefore bit-identical to `0bba1e8b`. `push-handler.ts` is unchanged in this round (`round3-protected-modules` gate, exit 0).
- **Inference never gets the consumer.** `server-connection.ts:1191-1192`: `this.postAdmissionConsumer && name !== 'inference-request' ? withReplyConsumer(scoped, ...) : scoped`. For `inference-request` the stored receipt is `scoped` — no reply wrapper, so `reply-admission.ts` is not on that path at all. `inference-router.ts:303` calls `admission.admit('inference/request', params, signal)`, three arguments, no delivery. Unchanged this round.

### 7. Surface and package reachability
- **No public signature changed.** Verified against the R3 inventory by reading each declaration at `9184d91e`: `inbound-admission.ts:98` (`RequiredIngress.admit`, fourth arg already optional at `54ebfc58`), `:92-99` interface, `:134,143` (`capture`; terminal admit still **three** parameters), `server-connection.ts:463,495`, `channel-registry.ts:1879-1884`, `push-handler.ts:163`, `inference-router.ts:222-229`, `registration-view.ts:135,140,161`, `reply-admission.ts:30,33`, `inbound-delivery.ts:8`. The `round3-protected-modules` gate (exit 0, log `gate-round3-protected-modules-01M68KNHNK11A6G42X58RMC18J.log`) independently shows `inbound-admission.ts`, `server-connection.ts`, `registration-view.ts`, `push-handler.ts`, `inference-router.ts`, `index.ts`, `mcpl/index.ts`, `package.json`, `tsconfig.json` byte-identical to `54ebfc58`. The three production files that did change are `inbound-delivery.ts`, `channel-registry.ts:46,1983`, `reply-admission.ts` — and the only signature touched is the *internal wrapper's* `admit`, which already carried the optional fourth argument at `54ebfc58`.
- **Package reachability of the two new helpers — they ARE shipped and ARE reachable, just not via a supported subpath.** I did not treat the missing barrel export as proof.
  - No barrel re-exports them: `git grep "inbound-delivery|DeliveryPlan" 9184d91e -- src/index.ts src/mcpl/index.ts` → **empty**; no `export * from './inbound-delivery.js'` anywhere in `src`; `src/index.ts` has only four wildcard barrels (`:2,20,23,202`), none reaching `src/mcpl/inbound-delivery.ts`.
  - `package.json` `"files": ["dist/src", "src"]` ships **both** `src/mcpl/inbound-delivery.ts` and (per `tsconfig.json` `outDir: "./dist"`, `rootDir: "."`, `declaration: true`) `dist/src/mcpl/inbound-delivery.{js,d.ts,d.ts.map}`.
  - `exports` declares only `"."` with **no `"./*"` pattern**, so a *bare deep specifier* (`@animalabs/agent-framework/dist/src/mcpl/inbound-delivery.js`) is blocked for exports-aware resolvers (Node ESM, `moduleResolution: NodeNext`/`Bundler`, Bun). It is **not** blocked for: a consumer on `moduleResolution: node`/`node10` or a bundler configured to ignore `exports`; an absolute or relative **filesystem** import into `node_modules` (exports gating applies to bare specifiers only); `createRequire` with a resolved path; or any in-repo/monorepo relative import. **Conclusion: package-reachable in practice, unsupported-subpath only.**
- **Can an external caller UNRESTRICT? No.**
  - `withAppliedDelivery(NORMAL, …)` wrapping a call that re-enters `:1983` cannot unrestrict it, because `:1983` installs its **own nested** `run` (`inbound-delivery.ts:14`), which shadows the outer store for its whole subtree. The only reader (`reply-admission.ts:34`) therefore sees `:1983`'s value, never the outer one.
  - Obtaining `NORMAL` is possible — it is not exported (`inbound-delivery.ts:6`), but `deliveryOf({})` (`:22-23`, unchanged from baseline) returns it, and `withAppliedDelivery(undefined, …)` defaults to it. That changes nothing: see above.
  - The only thing an external caller gains is the ability to **add** a restriction around a direct `admit('channels/incoming', …)` call made outside `:1983`. Restriction is strictly subtractive at `:41` — it returns the unmodified A verdict, runs no resolver/authorizer, writes no routing receipt, and does not touch A, storage, classification, wake, epoch, grant or registration identity. **No new authority is created.** The pre-existing route of calling a wrapped ingress directly (holding the `params` object that `server-connection.ts:495-497` keys the receipt on) is unchanged and no wider than at `0bba1e8b`.
  - `appliedDispatchDelivery()` adds a read-only probe — see the LOW above.

### 8. Test source honesty
Checked, at `9184d91e:test/context-only-reply-admission.test.ts`:
- **Named assertions check what they claim**, with two caveats raised as LOWs above. Spot-verified against source semantics: `:103`/`:146` form a genuine mutant-kill pair (no diagnostic on the healthy path; exactly one on the dropped-plan path), so `a.applied-plan-forwarded-without-loss-S1-S2-S5` is non-vacuous. `:384`'s expectation (`1` for `missing`/`mismatched`, `0` for `context-only`/`normal`/`legacy`) matches `reply-admission.ts:37` exactly. `:111`/`:117` do read the live field (`x.host.pendingRequests.length`), as claimed.
- **Scoped and unscoped setups really differ.** `setup()` at `:51` includes or omits `registrationScope` on the *actual* `inboundAdmission` config, and `:97` asserts the consequence on the live object: `assert.equal(!!x.host.mcplServerRegistry.getServer(peer).requiredAdmission.registrations, scope, 'a.real-scoped-or-unscoped-chain')`. The truth-table test differs structurally at `:366` (`scope ? withRegistrationScope(captured, view) : captured`). I confirmed both halves of the truth-table test are non-vacuous: the scoped fork is *accepted* (`composeRegistrationIngress` at `:371` passes `registration-ingress.ts:55`'s identity check because the spread preserves `admit`; `view.current(ref)` is true at `:362`, so `registration-view.ts:138`'s check passes), so `reads === 1` holds in both.
- **No visible compile error found.** Spot-checked the risky spots: `:131` relies on contextual typing from the `RequiredIngress` annotation on `legacy`; `:129` assigns through `registry`, which is `any` (`:81` `const host = f.framework as any`); `:373` `fourth` widens to `DeliveryPlan | undefined`, matching `inbound-admission.ts:98`; `:362-364` and `:402-404` satisfy `RegistrationView` (`registration-view.ts:22-25`) and the second block is unchanged from round 2; `:304`'s `x` use is guarded by the `let x!` definite-assignment and runs only after assignment; `t.mock.method(console, 'error', …)` is an established repo pattern (20+ existing test files). **This is static inspection only — no `tsc` ran, so declaration emit and test-source type-correctness remain UNKNOWN.**
- **Mutant matrix is correct and honest.** S1/S2 kills are real (the diagnostic assertions above). S5 kills are real (scoped: `a.accepted-context-only` at `:99` fails on the unexpected `admission_missing`; unscoped: `:103` fails on the loss diagnostic). S3/S4 are correctly declared **production-order unobservable** — I confirmed by construction: the inner terminal `admit` (`inbound-admission.ts:143`) takes three parameters and ignores `delivery`, and `withReplyConsumer` is always outermost, so no inner forwarding hop is load-bearing in production. The deliberately **inverted** scaffold at `:390-416` (`withRegistrationScope(withReplyConsumer(...))`, inverted relative to `server-connection.ts:1190-1192`) is correctly declared as S4's only kill, is correctly disclosed in-line at `:405`, and genuinely works: it installs no ALS scope, so `applied` is `undefined` and only the forwarded argument can restrict.

### 9. Hygiene
`git cat-file commit 9184d91e`: author **and** committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` (noreply ✓, identical ✓), timestamp `2026-10-31T09:11:38+00:00`, **no trailer** in the message body ✓ (no `Co-Authored-By`), unsigned (`%G?` = `N`) ✓, single parent `54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27` ✓, tree `ec9885c4…`. Recovery refs resolve exactly as reported: `recovery/abdi7-low1-54ebfc58` → `54ebfc58…`, `recovery/abdi7-merge-0bba1e8b` → `0bba1e8b…`, `recovery/abdi7-i7-a0970645` → `a0970645…`, `recovery/abdi7-d-93427f90` → `93427f90…`; `unqualified-local-abdi7-20261031` → `9184d91e…`. The original merge still has exactly its original parent order: `0bba1e8b… a0970645… 93427f90…` (I7 then D) ✓. Worktree tracked tree clean (`git status --porcelain` empty; `git diff --exit-code HEAD` exit 0) and left exactly as found.

---

## Verification Gates

**Reused receipts (read, not re-run)** — all at `9184d91e`, all exit 0, logs under `/home/orgasmic/.orgasmic/runs/run-01M68JW5EB1QKRDB4KSVDEFVD5/evidence/`: `round3-clean-tracked-tree`, `round3-d-reachable`, `round3-i7-reachable`, `round3-low1-base-reachable`, `round3-original-merge-reachable`, `round3-protected-modules`, `round3-whitespace`. I relied on `round3-protected-modules` for the "nine invariant modules + `package.json` + `tsconfig.json` unchanged" claim and cross-checked it by reading those files at `9184d91e` directly.

**Read-only probes I ran** (no gate wrapper; read-only, no reusable receipt needed, all `--no-ext-diff --no-textconv`):
- `git diff --stat 54ebfc58 9184d91e` and the full `-- src/` diff → 4 files, +263/−27; production +22/−4 as reported.
- `git diff 0bba1e8b 9184d91e -- src/mcpl/reply-admission.ts` → the exact predicate delta used for the Q5 equivalence argument.
- `git show 9184d91e:<path>` for `inbound-delivery.ts`, `reply-admission.ts`, `registration-ingress.ts`, `registration-view.ts` (125-165 and 1-40), `inbound-admission.ts` (90-215), `channel-registry.ts` (1875-2000), `server-connection.ts` (455-500, 1165-1200), `framework.ts` (35085-35120, 35159-35191, 35276-35311), `refusal-lines.ts`, `package.json`, `tsconfig.json`, the full test file.
- `git grep` at `9184d91e` for: `withAppliedDelivery`, `appliedDispatchDelivery`, `dispatchDelivery`, `enterWith`, `AsyncLocalStorage`, `async_hooks`, `withReplyConsumer`, `withRegistrationScope`, `composeRegistrationIngress`, `registrationAdmissionForItem`, `registrationItemFork`, `.admit(`, `handleIncoming(`, `inbound-delivery`, `export *`, deferral primitives, `mock.method(console`.
- `git cat-file commit`, `git log -1 --format=...`, `git for-each-ref`, `git status --porcelain`, `git diff --exit-code HEAD`.

**Not run, per the FORBIDDEN list:** npm, bun, node, tsc, build, typecheck, test, mutant execution, install, network, any git write, any edit. No probe artifact was written inside the worktree; progress notes and this report are in `$ORGASMIC_EVIDENCE_DIR`.

---

## Unmet criteria / test gaps

Nothing in the round-3 brief is unmet. Remaining gaps, all of them evidence gaps rather than defects:

1. **No compiler ran.** Declaration emit, the generic `withAppliedDelivery<T>` signature, the structurally-public `RequiredIngress` surface, and the 264 new lines of test source are type-unverified. The 7 reusable receipts are all `git diff`/`merge-base`; none is a typecheck.
2. **No test ran.** Every behavioural claim in the R3 report and in §3(A)/§4/§5 above is static control-flow reasoning over source, not a measured result. The 60-odd new named assertions have never executed; a test that does not compile or that is silently vacuous at runtime would not have been detected.
3. **No runtime ALS validation.** The restoration group (`test:325-350`) specifies the exact semantics the mechanism depends on but has not run, on Node or Bun.
4. **No coverage of class-(B) fail-open shapes.** The counterexamples in §3(B) are deliberately untested — correctly so, since none is in-tree — but that means the fail-open boundary itself is documented only in prose, not in source.
5. **The MEDIUM flood path is unmeasured.** No test asserts a bound on the number of diagnostic lines, and no throttle exists to assert against.
6. **Normal-delivery byte-equivalence and profile-off identity** are argued algebraically (§5), not measured against `0bba1e8b` output.

---

## Residual risk

### Explicit UNKNOWN list
- **Runtime ALS semantics, Node.** Propagation into the async continuation of `dispatchDelivery.run`, isolation between concurrent `run` scopes, nesting/override, and caller restoration after sync throw / await / async rejection are **UNKNOWN**: nothing executed. The repo's other ALS uses (`modern-connection.ts:125,131`, `disk-agreement.ts:55`) are not a receipt for this one.
- **Runtime ALS semantics, Bun.** Separately **UNKNOWN**, and materially so: `package.json` `exports["."]["bun"]` points at `./src/index.ts`, so Bun is a declared consumer path, and Bun's `AsyncLocalStorage` has historically diverged from Node's in exactly the propagation/restoration behaviours this mechanism depends on.
- **`emit` / queue / scheduler interaction.** Whether any *future* in-tree hop between `channel-registry.ts:1983` and `reply-admission.ts:33` defers outside the dispatch context is **UNKNOWN** — nothing enforces the "no deferral between the scope and the capture" invariant. Today it holds by inspection only (§3(A) grep).
- **Consumer behaviour.** `PostAdmissionConsumer` and the host-supplied `config.bind(...).admit` are arbitrary callbacks (`reply-admission.ts:45`, `inbound-admission.ts:148`). They run *inside* the scope, which is harmless for `applied` (already captured), but their own behaviour is **UNKNOWN**.
- **Declaration emit / consumer compile.** **UNKNOWN** (no `tsc`).
- **Dual module instantiation in a real install.** Whether `src`/`dist` mixing or a duplicated package copy actually occurs for any consumer is **UNKNOWN**; the consequence if it does is the LOW above (closed, but noisy and carrier-disarmed).

### Other residual risk
- Complete removal of **both** the dispatch scope and the fourth argument is, by construction, indistinguishable from a legitimate legacy normal external call. This is the irreducible limit of the design and the implementer states it.
- The fault-path diagnostic is new stderr output with no measured throttle or cost (MEDIUM above).
- S3/S4 remain production-order unobservable; their only kill is a deliberately inverted test scaffold. That is disclosed, and no production code was reordered to manufacture a score.
- **D's release hold and the #931/B holds remain in force. LOCAL ONLY / UNQUALIFIED.** This review clears no gate, lifts no production barrier, and does not clear I6.

---

## Fix directions (priority order)

1. **(MEDIUM)** Route `reply-admission.ts:38`'s line through a `RefusalLines`-style holder (`refusal-lines.ts:27`) or `AdmissionRefusals`, keyed per connection, matching `channel-registry.ts:1960-1961` and `inbound-admission.ts:217`. First line prints, repeats are counted.
2. **(LOW)** Make the diagnostic predicate at `reply-admission.ts:37` structural rather than identity-based — `applied?.conversational === false && delivery?.conversational !== false` — removing the dual-instance false positive while preserving the S1/S2/S5 kills.
3. **(LOW)** Mark `appliedDispatchDelivery` `@internal` (or keep the read module-local and expose it to tests another way).
4. **(LOW, test)** Rename `test:142-143` to `...-in-unscoped-config`, or add a scoped event-bearing case so the names stop over-claiming.
5. **(LOW, test)** Make `test:356`'s mock re-emit non-matching `console.error` lines, mirroring `test:38,41`.
6. **(Next stage, needs qualifier go)** The decisive missing evidence is a **typecheck plus one execution** of `test/context-only-reply-admission.test.ts` on both Node and Bun. Until then every behavioural claim here and in the R3 report is static only. None of items 1-5 is a prerequisite for that run.
