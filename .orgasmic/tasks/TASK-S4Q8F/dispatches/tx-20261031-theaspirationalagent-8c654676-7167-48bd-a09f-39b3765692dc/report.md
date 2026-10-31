# TASK-S4Q8F — bounded delta review of the AF-scope batch-isolation fix

Range `47f3b4f2195d2ff544815ea29a410c3a335864ba..39c76401f1be9191e5f62f66b497828d4f30fd56`
(2 commits, 7 files, +159/-2). Worktree at `39c76401`, tree clean before and after; no
tracked file edited, no commit, no push. Report `/srv/review-drop/TASK-S4Q8F-BATCHFIX.md`
read in full; sha256 verified `2803c051…c7145b90` (matches the brief).

Addendum handled before finalize: manager message `msg-6fefd1b6` (Soma, via tarn2,
2026-10-31T03:35Z) requiring check (6) to stay open until explained with per-tree
cwd/prefix, manifest diff, npm version/config/flags and named resolved entries. Done —
see check (6) below and the standalone appendix `npm-ls-explanation.md`.

## Verdict

**APPROVE.** The per-item fork is correct: it reuses the batch's `RequiredAdmission`
and transport-event key, never re-reads the epoch, composes rather than replaces the
outer checks, preserves the B consumer/signal/diagnostic connection and the exact
receipt↔messageId association, and is byte-identical identity when the profile is off.
All seven brief checks came out clean on correctness. I independently reproduced two of
the six mutants (both killed by their named assertions) and resolved the open npm-ls
discrepancy as a provable layout artefact. No HIGH findings. Remaining findings are
test-coverage and robustness-of-contract items that do not block.

## Findings

### MEDIUM — test — no coverage for a non-removing mid-batch registration replacement, where this delta changes behaviour
`test/registration-batch-scope.test.ts:38-41` (shape table), `src/mcpl/registration-view.ts:139`

Every new batch shape invalidates by `channels/changed {removed:[...]}`, which
*deletes* the registry entry (`src/mcpl/channel-registry.ts:1737-1739`). The other
non-removing invalidation path — `channels/changed {updated:[…changed target…]}`, the
case commit `47f3b4f2` ("invalidate scope on remaining descriptor rewrites") exists for —
leaves the entry in place and replaces the generation. On that path the delta changes
observable behaviour and nothing asserts it.

Reproduced (`probes/rev-probe-update.mjs`, real WebSocket → framework → ChannelRegistry;
m1 and m2 both on `topic/one`, m1's host `admit` sends a retargeting `updated` for it):

```
RESULTS [{"messageId":"m1","accepted":false,"reason":"admission_stale"},
         {"messageId":"m2","accepted":true}]
```

At the pre-fix head the shared closure would have refused m2; at the fix head m2 is
admitted against the *new* generation its own fork captured. That is coherent with
`docs/registration-scope-view.md:62-63` ("including equal re-registration or descriptor
update, is a new generation") plus per-item capture, and I believe it is the intended
semantics — but it is an unasserted behaviour change on exactly the "same channel,
mid-batch invalidation" axis the Soma condition names, and it is the one axis where a
regression would be silent (an item admitted rather than refused).

Fix direction: add one shape driving invalidation through `updated` with a changed
target, asserting the intended verdict for the later same-channel item explicitly
(accept-against-new-generation, with the host observing the new ref), plus a variant
where the replacement's scope has not yet resolved.

### LOW — test — the `same-registration-stale` shape cannot discriminate the fix
`test/registration-batch-scope.test.ts:42`, assertion at `:51-53`

For that shape m2 never reaches the registration scope at all: m1's removal deletes the
entry, so m2 is refused by the pre-existing §14.5 unknown-channel gate at
`src/mcpl/channel-registry.ts:1926-1948`, before `if (admission)`. Reproduced
(`probes/rev-probe-samereg.mjs`):

```
m1 → "admission_stale"
m2 → "unknown channel \"topic/one\" — register it first (§14.5)"
```

The test's disjunctive reason assertion (`r.reason === 'admission_stale' ||
r.reason.includes('unknown channel')`) accepts this, so the shape passes identically at
the pre-fix head and would pass with the per-item scope check removed for that item. The
Soma condition "items with the SAME invalidated registration still refuse" is satisfied
*behaviourally*, but this test is not evidence for the scope mechanism — and by
construction it cannot be (a per-item fork captures after m1's mutation, so it can only
ever hold the *current* ref; holding a ref invalidated during its own processing is the
`stale-last`/`all-stale` case, which is covered). The report's claim that
"same-registration removal still refuses both items" is true but its mechanism is
mis-attributed. Fix direction: assert the exact expected reason per shape rather than a
disjunction, so the gate records which guard fired.

### LOW — design — `RequiredIngress.forItem` is unsafe to call directly; safety rests on a comment
`src/mcpl/inbound-admission.ts:94-95`, `src/mcpl/registration-view.ts:139`,
`src/mcpl/registration-view.ts:155-159`, `src/framework.ts:35199-35203`

`withRegistrationScope`'s `forItem` forks from the *inner* captured admission, so a raw
`forItem()` fork loses every outer wrapper's check — specifically the framework-level
`queue.isClosed → admission_not_ready` and `getServer(id) !== connection →
admission_stale` gates spread in at `src/framework.ts:35200-35203`. The current code is
correct only because `registrationAdmissionForItem` re-composes
`admission.check() ?? item.check()` (`registration-view.ts:158`), and because the batch
loop never touches the batch-level object's `admit`. A future batch lane that calls
`admission.forItem()` directly would silently drop those two gates from both the
pre-admit and post-admit checks, with no type or test signal. Fix direction: rename to
`forItemUnchecked`, or make `withRegistrationScope`'s own `forItem` compose the outer
check, so the unsafe primitive is not reachable by the natural spelling.

### LOW — test — the per-item-epoch invariant is only observable through a test-only monkeypatch
`test/registration-batch-scope.test.ts:146-160`

I reproduced the `per-item-epoch` mutant and confirmed it is killed *only* by
`assert(keys.every(key => key === oldKey), 'each item must retain the transport-event
key')` — a white-box observation via a replaced `channelRegistry.handleIncoming` that
inspects `fork.key`:

```
not ok 1 - scope batch B=false: real epoch change refuses all old items and never reads a new key per item
  error: 'each item must retain the transport-event key'
```

Under that mutant the production-visible outcome is unchanged (both items still refuse
`admission_stale`, nothing stored, nothing published — the test asserts all of that and
those assertions pass mutated), because the retained outer stale check independently
blocks the leak. The report states this honestly. For items that *do* reach A the host
observes `input.connection` per item on the real path
(`test/registration-batch-scope.test.ts:28` capture, `:60` assertion), so the invariant
is real-path-covered for that case; the gap is only the never-reaches-A case. Acceptable;
recorded so a future refactor that removes the outer check is not assumed covered.

### LOW — docs — the batch paragraph omits the replacement corollary
`docs/registration-scope-view.md:71-73`

"Removing one registration cannot refuse a different current registration or refresh the
batch into a new epoch" is accurate, but does not state the behaviour confirmed by the
MEDIUM finding's probe: a mid-batch re-registration or descriptor update of the *same*
channel makes later items in that batch admit against the new generation. One sentence
would close it. Changelog fragment
(`changelog.d/registration-batch-isolation.fixed.md:1`) is accurate and matches the
`.fixed.md` convention already in `changelog.d/`.

## What I verified, with evidence

**(1) `forItem` → same underlying admission, outer check composed, no false pass/refusal.**
`src/mcpl/server-connection.ts:1173-1176` builds the scoped receipt once per inbound
event (keyed on the `params` object in `admissionReceipts`), capturing
`this.requiredAdmission.registrations.view` *by value* at receipt time;
`registration-view.ts:139` `forItem: () => withRegistrationScope(admission, view)` closes
over that same captured raw admission and that same view object. So no fork reads a new
epoch, and `key: admission.key` (`:138`) is the identical frozen `ConnectionKey` object —
confirmed on the real path by `assert(x.keys.every(key => key === originalKey))`
(test `:60`) and `keys.every(key => key === oldKey)` (test `:160`).
`registration-view.ts:158` composes `admission.check() ?? item.check()`.
*No false pass:* `??` returns the first truthy refusal; neither leg is bypassed, and
`item.check` is the fork's own `raw.check() ?? forkStale`.
*No false refusal:* the batch-level wrapper's stale leg requires its own
`channelBearing === true`, which is set only inside its own `admit`
(`registration-view.ts:143`) — and after the fix the only `admit` call for this lane is
the fork's (`channel-registry.ts:1967`; verified by grepping every `.admit(` call site:
`push-handler.ts:174` and `inference-router.ts:303` consume *different* receipts, keyed
on their own `params` objects). So `batchAdmission.check()` reduces to the raw+framework
checks for the whole batch. `envelope.connection = admission.key`
(`channel-registry.ts:1971`) is the batch key.

**(2) `withReplyConsumer.forItem`.** `src/mcpl/reply-admission.ts:31` forwards `consume`,
`transportSignal` and `diagnosticConnection` explicitly (so the connection object, not
the `admission.key` default, is retained), and the post-verdict block at `:34-45`
(`verdict.store && verdict.mayWake && !admission.check()` → detach → consume → receipt /
`privateReplyBinding` + `reportReplyFailure` on throw) is untouched. The ordering and the
inner `admission.check()` scope are identical to the pre-fix composition.

**(3) Profile-off identity.** `RequiredAdmission.capture()`
(`src/mcpl/inbound-admission.ts:132-159`) returns an object with no `forItem`, so
`registrationAdmissionForItem` hits `if (!admission?.forItem) return admission`
(`registration-view.ts:156`) and returns the identical object — and `undefined` for
`undefined`. Unit-asserted at test `:143`; the `undefined` arm is covered behaviourally
by the byte-identical profile-off differential.

**(4) Batch loop audit.** `const admission` at `channel-registry.ts:1889` is the first
statement of the `for…of` body, so there is no TDZ hazard and every subsequent
`admission` reference in the body is the item one. I enumerated all `admission`
references in `handleIncoming` (lines 1877-2170): `:1889` creation, then only
`:1961 check()`, `:1967 admit()`, `:1968 check()`, `:1971 key` — all inside
`if (admission)`, all the fork. There are **no** `admission`/`batchAdmission` references
after the loop. `closesAtArrival` (`:1885`) is correctly batch-scoped (it is the batch's
arrival transport generation, by design). The malformed-identity path (`:1890-1907`) and
the coalescer path do not consult admission — coalesced items under admission are refused
`admission_unsupported` at `:1960` before any fork use. A fork is allocated and discarded
for malformed/unknown-channel items; harmless. `results.push` always uses
`message.messageId` of the current item, and `responder.respond({results})` fires once
after the loop — the receipt↔messageId association is exact.

**(5) Tests.** 18 new tests in one new file, all but the composition unit test driving a
real loopback `WebSocketServer` (`test/helpers/coalescing-fixture.ts:11,34`) →
framework → `ChannelRegistry`. Shapes stale-first / stale-last / all-stale / none-stale /
same-registration × B=off/on (10), committed preprobe (1), unknown+unreadable borrowing ×
B (2), stale-after-admission-await and stale-after-resolver-await (2), helper composition
unit (1), real disconnect/reconnect-with-ready-replacement × B (2) = 18. I hand-checked
the `expected` computation at test `:47` against all five shapes; it yields the intended
`[false,true]` for stale-first and `[false,false]` for same-registration. Unknown channels
provably never reach A (`assert.deepEqual(x.calls, ['m1','m3','m4'])`, test `:81`) and no
entry is minted (`:83-84`). The reconnect test re-registers both channels in the new epoch
and still requires both old items to refuse with the old key (`:155-160`).

**Mutants reproduced independently** (`probes/rev-mutants.py`, focused tests only,
600 s per-run timeout, existing `dist/` build, no `npm install`; `dist` is gitignored and
both mutated files were byte-restored — verified by sha256):

| run | exit | tests/pass/fail | named failure |
| --- | ---: | --- | --- |
| baseline, preprobe test | 0 | 1/1/0 | — |
| baseline, epoch test | 0 | 1/1/0 | — |
| mutant `shared-ref` (`forItem: () => scoped`) | 1 | 1/0/1 | yes — `an invalidated sibling must not poison fresh unrelated registration`, `false !== true` |
| mutant `per-item-epoch` (fresh `capture()` + view per fork) | 1 | 1/0/1 | yes — `each item must retain the transport-event key` |

**(6) npm-ls discrepancy — kept open until explained, then explained with named
entries and a causal control.** Full record, per Soma's addition (tx via tarn2
msg-6fefd1b6): `npm-ls-explanation.md`, raw JSON in `probes/npm-ls-*.json`. Summary:

*Invocation context, per tree* — identical command `npm ls --all --json`, no other flags,
`workspaces/false`; npm 10.9.9 and node v22.23.3 (`fde6a4bf…`) on both; identical npm
config (same `/home/orgasmic/.npmrc`, cache, global-prefix); `local-prefix` is
`…/task-s4q8f` for both. Base: cwd/prefix `…/task-s4q8f/node_modules/.matched-base`,
`npm root` `…/.matched-base/node_modules`, git HEAD `29edcf8b`, `node_modules` is a
**symlink** to `…/task-s4q8f/node_modules`. Head: cwd/prefix `…/task-s4q8f`, git HEAD
`39c76401`, `node_modules` a real directory. **No `package-lock.json` or
`npm-shrinkwrap.json` exists in either tree** — so the report's "installed lock inode"
identity refers to the shared `node_modules/.package-lock.json` and is trivially true
rather than independent evidence.

*Manifest diff* — `diff <(git show 29edcf8b:package.json) node_modules/.matched-base/package.json`
→ empty; `diff package.json node_modules/.matched-base/package.json` → empty; both sha256
`e149f0a8943238a6…`. The range changes no manifest and no lockfile. 14 declared deps
(7 `dependencies` + 7 `devDependencies`) = head's root-entry count exactly.

*Named resolved entries.* All **14 declared dependencies resolve in both trees at
identical versions** (`@animalabs/chronicle` 0.5.1, `@animalabs/context-manager` 0.24.2,
`@animalabs/mcpl-core` 0.4.0, `@animalabs/membrane` 0.8.0, `@babel/parser` 7.29.12,
`@modelcontextprotocol/{client,server}` 2.4.0, `@types/node` 22.20.5, `@types/ws` 8.18.2,
`chokidar` 4.0.3, `discord.js` 14.28.0, `tsx` 4.23.15, `typescript` 7.0.2, `ws` 8.22.0);
none is absent or `invalid`. The only difference is the `resolved` field: in base each one
is reported as a **`file:` link out of the tree** — `@animalabs/chronicle →
"file:../../../@animalabs/chronicle"`, `chokidar → "file:../../chokidar"`,
`typescript → "file:../../typescript"` — because `.matched-base/node_modules` is a symlink,
so `…/.matched-base/node_modules/<pkg>` realpaths into the parent worktree and Arborist
records a link rather than a tree node.
  - **41 extraneous = 39 distinct transitive packages** npm can no longer attribute to a
    parent edge (`@discordjs/collection` appears 3× at different depths): `@anthropic-ai/sdk`,
    `@babel/{types,helper-string-parser,helper-validator-identifier}`,
    `@discordjs/{builders,collection,formatters,rest,util,ws}`, `discord-api-types`,
    `@sapphire/{async-queue,shapeshift,snowflake}`, `ts-mixer`, `undici`, `undici-types`,
    `esbuild`, `@esbuild/linux-x64`, `readdirp`, `eventsource`, `eventsource-parser`,
    `pkce-challenge`, `jose`, `zod`, `@modelcontextprotocol/core`,
    `@typescript/typescript-linux-x64`, `@vladfrangu/async_event_emitter`, `cross-spawn`,
    `path-key`, `shebang-command`, `shebang-regex`, `isexe`, `which`, `tslib`, `lodash`,
    `lodash.snakecase`, `magic-bytes.js`, `fast-deep-equal`. Each is a legitimate
    transitive of a declared dep (`@discordjs/*` ← `discord.js`, `esbuild` ← `tsx`,
    `readdirp` ← `chokidar`, `@babel/types` ← `@babel/parser`, `@anthropic-ai/sdk` ←
    `@animalabs/membrane`, …), hoisted into the one shared flat install exactly as in head.
    Base's 53 root entries = 14 declared + these 39.
  - **526 missing = dev/peer requirements of the installed packages**, across 42 requiring
    packages (top: `discord-api-types` 30, `discord.js` 30, `@sapphire/shapeshift` 29,
    `@modelcontextprotocol/client` 28, `@discordjs/ws` 27, `ts-mixer` 25, `undici` 24).
    Named: `@napi-rs/cli@^2.18.0 required by @animalabs/chronicle@0.5.1` and
    `@vitest/coverage-v8@^4.0.18 required by @animalabs/membrane@0.8.0` are the linked
    packages' own **devDependencies**, never installed for a consumer;
    `typescript@~5.8.3 required by @discordjs/builders@1.15.0`,
    `typescript@^5.1.6 required by @discordjs/collection@1.5.3`,
    `@types/node@16.18.40`, `@types/node@18.17.9` are dev-time pins unsatisfiable against
    the single hoisted `typescript@7.0.2` / `@types/node@22.20.5` once each package is
    treated as its own root. Decisively, **60 of the 526 lines name a dep that *is*
    declared and installed here** (e.g. `@animalabs/chronicle@^0.5.1 required by
    @animalabs/context-manager@0.24.2`, `@babel/parser@^7.29.11 required by
    @babel/types@7.29.11`) — present at 0.5.1 and 7.29.12 respectively, reported missing
    only because the link-ified roots break the edge that would resolve them. That is an
    attribution artifact, not absent bytes.

*Causal control (one variable).* A fresh `/tmp/revbase-outside` holding **only** the
byte-identical `package.json` and a symlink `node_modules → …/task-s4q8f/node_modules`,
located outside `node_modules` so the "cwd inside node_modules" variable is eliminated:

```
/tmp/revbase-outside           exit 1  problems 567  extraneous 41  missing 526  root entries 53
…/node_modules/.matched-base   exit 1  problems 567  extraneous 41  missing 526  root entries 53
…/task-s4q8f (real directory)  exit 0  problems   0  extraneous  0  missing   0  root entries 14
```

All four base numbers reproduced from the symlink alone, with manifest, npm version, npm
config, flags and installed bytes held identical. Nothing was reinstalled or repaired.

*Closure equivalence, independent of npm-ls.* Flattening both JSON trees to distinct
`name@version` reachable from the root: base 54, head 54, `in head not base: []`,
`in base not head: []` — zero symmetric difference. This is why the two JSON hashes
differ without the closures differing: the base document carries `problems` + `error` and
53 `file:`-resolved root entries, the head document 14 nested entries — different
serialization of the same closure.

*Status:* **explained and closed on this evidence**, not called harmless without a
mechanism. It does not affect the base/head comparison. The derived limitation is carried
forward as a LOW in Residual Risk: the base cell shares head's install through the
symlink, so matched dependencies hold *by construction* rather than being independently
measured, and `npm ls` cannot serve as a closure check for the base tree in this layout.

**(7) Changelog/docs** — see the LOW docs finding; otherwise accurate against the code.

## Verification Gates

Reused receipts (read, not rerun — all at `39c76401`, all exit 0, logs under
`/home/orgasmic/.orgasmic/runs/run-01M67TBE53E4YSJ4E1KCSZDFCK/evidence/`):
`fix-22.23.3-base`, `fix-22.23.3-head`, `fix-22.12.0-base`, `fix-22.12.0-head`,
`focused-registration-batches`, `registration-batch-mutants`,
`profile-off-serialized-fix`, `fix-final-metadata`. I spot-verified the reported numbers
against the raw artifacts: focused gate `# tests 95 / pass 95 / fail 0 / cancelled 0 /
skipped 0`; `matrix-results.json` cells 9767/9704/0/63 (base) and 9862/9799/0/63 (head)
with `failure_names: []`, `stage_command_exit`/`log_capture_exit`/`gate_exit` all 0,
`truncation: no`; profile-off `DIFFERENTIAL base/head/cmp EXIT 0/0/0`. The +95 full-suite
test delta equals the focused gate's 95 (77 pre-existing scope tests introduced after B,
plus the 18 new), consistent with base = B `29edcf8b`. `package.json` has no lint script;
typecheck/build/test is the whole gate set, and all three have receipts.

Scoped probes I ran (unwrapped — no reusable receipt; artifacts in
`$ORGASMIC_EVIDENCE_DIR/probes/`): the two mutant reproductions plus baselines above,
`rev-probe-samereg.mjs`, `rev-probe-update.mjs`, and the three `npm ls` invocations.
Build state: `dist/` was already current at `39c76401` (`forItem` present in the compiled
`registration-view.js`, `reply-admission.js`); no `npm install`, no rebuild.

Worktree left exactly as found: `git status --porcelain` empty, `dist/src/mcpl/{registration-view,server-connection}.js`
sha256 identical to pre-probe values, `node_modules/.package-lock.json` untouched.

## Unmet criteria / test gaps

Acceptance criteria are met. Gaps, in priority order:
1. No test for a non-removing mid-batch registration replacement (`channels/changed
   updated` with a changed target) — the one axis where this delta's behaviour change is
   unasserted (MEDIUM).
2. `same-registration-stale` is masked by the §14.5 unknown-channel gate and does not
   exercise the per-item scope (LOW).
3. The "epoch not read per item" invariant has no production-observable assertion for the
   case where the item never reaches A (LOW).
4. `registrationAdmissionForItem`'s undefined arm is not unit-asserted (covered only
   behaviourally by the profile-off differential).

## Residual risk

- Fork-safety of `forItem` is a convention, not a type or test invariant; a second batch
  lane added later is the plausible regression vector (LOW finding above).
- The matched matrix compares head against **B** (`29edcf8b`), not against the pre-fix head
  `47f3b4f2`, so the full suite does not isolate this delta; the historical cells (one with
  a missing receipt, honestly flagged) cover `47f3b4f2`. The delta is small and I audited it
  line by line, so I do not consider this blocking.
- The base matrix cell shares the head install through a symlink into the head worktree's
  `node_modules`, so "matched dependencies" holds by construction rather than being
  independently measured, and `npm ls` cannot serve as a closure check for the base tree
  in that layout (the base ELSPROBLEMS is fully explained in `npm-ls-explanation.md`; the
  "installed lock inode" identity is trivially true since no in-repo lockfile exists).
  A future round wanting an independent base install should give `.matched-base` its own
  `node_modules` and then compare `npm ls` hashes directly.
- Carried forward unchanged from the implementer's own statement: synthetic IDs only, no
  native activation, the serialized logical corpus does not prove all concurrent schedules
  or physical store-file equivalence, and the first uncontrolled profile-off differential
  remains a preserved failed witness rather than a parity pass.

## Fix directions

None blocking. If a follow-up round is authorized, in order:
1. Add the `updated`-with-changed-target batch shape and assert the intended later-item
   verdict (MEDIUM).
2. Replace the disjunctive reason assertion at `test/registration-batch-scope.test.ts:51-53`
   with per-shape exact reasons so the gate records which guard fired (LOW).
3. Rename `forItem` → `forItemUnchecked`, or have `withRegistrationScope`'s `forItem`
   compose the outer check, so the unsafe primitive is not reachable by the natural
   spelling (LOW).
4. One sentence in `docs/registration-scope-view.md:71-73` on the replacement corollary
   (LOW).
