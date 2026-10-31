# TASK-XHZ4H — bounded delta review: fork-seed fixture hash fix

Range `b6e225e07a8214894c3f721dfb14ac0c1cf75714..93932bae02b35584530840a5683abc7376baac6e`
(2 commits, 3 files, +50/-6). Reviewed report `/srv/review-drop/TASK-XHZ4H-HASHFIX.md`,
sha256 `69d33170e4673e04daa9182f484e9bd902116d8f5b76811ad9cc3015d6cbfbec` — **matches the brief**.

Decision provenance as stated in the brief and honoured here: the engineering choice
(bind to normalizer bytes, don't pin AF's dependency) is **Soma's** (programme qualifier),
passed on by the **task operator Tarn**. It is **not** a decision or consent of the human
owner Vasyl. The reviewed report states this correctly in its "Changed" section.

## Verdict

**APPROVE** — 0 HIGH, 2 MEDIUM (test coverage), 3 LOW (stale labels / claim scope).

The delta does what Soma's choice specifies and the central claim is reproducible: the
precondition is bound to normalizer bytes, version and integrity are emitted as evidence
only, the different-byte control fails loudly before any fork work, and the
hash-check-removal mutant is genuinely killed. I reproduced all of that myself on the
frozen closure on both Nodes. Both MEDIUMs are gaps in what the *tests enforce*, not
defects in current behaviour, and one single added assertion closes both. Nothing blocks
ship.

## Findings

### MEDIUM — test: the "fails BEFORE the fork witness" property is asserted only by proxy; a reordering mutant survives

`test/context-only-delivery.test.ts:478`

The negative control's ordering guard is `assert(!result.stdout.includes('FORK_SEED_ALIGNMENT_OK'), 'the hash precondition fails before the fork witness runs')`. That string is printed by `test/fixtures/context-only-fork-seed-child.mjs:77`, i.e. the *last* line of the witness. Any ordering in which the hash assertion precedes only that final `console.log` satisfies it.

Failure scenario, reproduced: I moved the hash assertion from `context-only-fork-seed-child.mjs:32-33` down to immediately before line 77 (mutant 3), leaving the framework creation, both `addMessage` calls, the preserved fork, the `dropFirst` fork and the store re-open to run on **changed** normalizer bytes first. Both focused tests still reported `ok` — `# tests 2 / # pass 2 / # fail 0`. The suite cannot distinguish "refused before any fork work" from "refused after all of it".

The property *does* hold in the code as written — my Probe A ran the child under the preload directly and stdout contained only the evidence line, with zero `message-store`/framework output on either stream (`grep -cE 'message-store|deprecated'` = 0 on both), and the child died at `...child.mjs:32:8`. So this is an enforcement gap, not a present defect. Given the fixture's whole purpose is "refuse before any shifted normal classification is stored", the ordering deserves a real assertion.

Fix direction: assert the mismatch child's stdout is *exactly* the evidence line, e.g. `assert.match(result.stdout, /^CONTEXT_MANAGER_NORMALIZER_EVIDENCE \{[^\n]*\}\n$/)` replacing or joining line 478. That kills mutant 3 and the MEDIUM below at the same time.

### MEDIUM — test: the evidence line that replaced the deleted version pin is itself unasserted

`test/context-only-delivery.test.ts:465` and `:475`

Soma's choice turns version/integrity from a precondition into *recorded evidence*. Both tests surface it with `console.log(output.split('\n').find(line => line.startsWith('CONTEXT_MANAGER_NORMALIZER_EVIDENCE ')))`. `Array.prototype.find` returns `undefined` when absent, and `console.log(undefined)` prints `undefined` and does not throw.

Failure scenario, reproduced: I deleted only the `console.log('CONTEXT_MANAGER_NORMALIZER_EVIDENCE ' + JSON.stringify({...}))` block at `context-only-fork-seed-child.mjs:28-31` (mutant 2). Both focused tests still passed — `# tests 2 / # pass 2 / # fail 0`. So the compensating control for the removed assertion can regress to silence with a green suite, and the only durable record of the resolved version + integrity for a given run disappears from the TAP log. This is diagnostic-only — the hash contract still governs correctness — which is why it is MEDIUM and not HIGH.

Fix direction: as above (`assert.match` on the stdout shape), plus an equivalent `assert.match(output, /CONTEXT_MANAGER_NORMALIZER_EVIDENCE \{/)` for the positive test at line 465.

### LOW — docs: production comment still labels the cardinality guard with the no-longer-resolved version

`src/framework.ts:17867`

`// context-manager 0.24.1 preserves cardinality (normalizer SHA-256: dcfff6de…701a).` The SHA-256 is correct and still current; the version word is now wrong (the frozen closure resolves **0.24.2**) and it restates exactly the version/bytes conflation this delta removed one directory away. The guard itself (`src/framework.ts:17871-17873`) is untouched and correct.

Correctly *not* fixed in this round — the brief requires zero diff in `src/`. Follow-up: drop the version from the comment and point at the hash contract, in a round that is allowed to touch `src/`.

### LOW — docs: stale audited-version label on the CM maintainer question

`docs/context-only-delivery.md:146`

"At audited context-manager **0.24.1**, `src/context-manager.ts:518–545,568–580` opens/registers without that gate". The audited version is no longer what AF resolves, and those file:line references are not re-confirmed against 0.24.2 anywhere in the evidence. Unlike the `src/` comment, `docs/` is *not* covered by the brief's zero-diff list, so this one could have been corrected in this round and was not — the delta touches no docs at all.

Fix direction: relabel to the resolved version, or state explicitly that the file:line evidence was taken at 0.24.1 and not re-audited.

### LOW — claim scope: the qualification numbers omit the operator-environment watchdog divergence

`/srv/review-drop/TASK-XHZ4H-HASHFIX.md`, "Qualification" in the PR body

The PR body presents "fix head 9,688 / 9,625 pass / **0 fail**" on both Nodes without noting that the task operator's own environment reproducibly fails `test/liveness-watchdog.test.ts` ("watchdog kills a wedged process", "watchdog aborts a wedged process") at `3b075de1`, `b6e225e0`, A `869bb3ad`, B `29edcf8b` and pristine `a64cfc01`, with root cause not established. The worker's cells show that pair passing.

This is not caused by this delta and the base/head comparison is internally matched (same closure, same environment, same concurrency), so it does not weaken the fixture conclusion. But a reader of the PR body alone would take "0 fail" as environment-independent. Fix direction: one sentence noting that the 0-fail figure is for this environment and that a separate, unresolved watchdog divergence is tracked by the operator.

### Not a finding — checked and clean

- **Claim language (brief check 6) is not overstated.** "Identical normalizer bytes do not establish whole-package compatibility" appears in the fixture comment (`context-only-fork-seed-child.mjs:10-11`), in the emitted JSON (`:30`), in the report's fixture-contract section, in its Residual Risk, and in the PR body. No doc or changelog entry claims a version pin: `grep -i "0\.24\|normaliz\|cardinal\|audited\|witness" changelog.d/context-only-delivery.added.md` and `grep -i "cardinal\|normaliz" docs/context-only-delivery.md` are both empty.
- **The integrity lookup cannot change the result or suppress a failure (brief check 2).** `integrity`/`integritySource` are written at `context-only-fork-seed-child.mjs:15,16,23` and read only at `:29` inside the `console.log` — never in the assertion. `normalizerHash` is computed once at `:27` from a direct read. Proven, not just read: Probe B forced `ENOENT` on both lock paths → evidence line reports `"integrity":null,"integritySource":null`, the hash assertion still governed and the full witness passed (child exit 0). Probe C returned malformed JSON for `.package-lock.json` → loud `SyntaxError`, child exit 1, *no* evidence line and *no* "hash contract mismatch" text, so neither test could mistake it for a pass or for a mismatch. The `catch` at `:25` swallows `ENOENT` only; everything else rethrows.
- **The preload changes only normalizer bytes in memory and touches no installed file (brief check 3).** `context-only-normalizer-read-mismatch.mjs` wraps `fs.readFileSync` only; `grep -E "writeFile|appendFile|rename|unlink|rmSync|mkdir|chmod|copyFile|open\("` finds no write API. The suffix gate `/normalize-tool-messages.js` has no collision: that filename exists exactly once in the whole tree (CM's `dist/src/`). The appended byte is a newline, so JS meaning is preserved — demonstrated, not asserted: under mutant 1 the entire fork witness ran to completion on the mutated bytes and passed. The frozen closure manifest was `dabd7705…fa01` before my work and `dabd7705…fa01` after all of it (7,332 entries).
- **The parent requires the exact failure, not a skip or any nonzero (brief check 3).** `:476` pins `status === 1` (a signal death would give `null` and fail), `:477` pins the specific message, `:475`'s `assert.ifError(result.error)` rules out spawn/timeout failure, `:478` rules out a completed witness. No `skip`/`todo` path exists.
- **Zero diff outside `test/` (brief check 1).** `git diff --name-only b6e225e0..93932bae` is exactly the three files; `git diff --stat … -- src/ package.json package-lock.json npm-shrinkwrap.json docs/**` is empty; `package.json:52` still declares `"^0.24.0"` (no pin added); the only committed lockfile in the repo is `ui/package-lock.json` and it is untouched; `git diff --summary` shows one `create mode 100644` and no mode changes. Production guard `src/framework.ts:17871-17873` byte-identical.
- **Commit metadata.** Both commits author=committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>` with `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`, matching `commit-identities.txt`.

## Verification Gates

All of mine wrapped as dispatch gates, each bounded by `timeout --signal=TERM --kill-after=60s`, run in a throwaway `git archive` export of `93932bae` at `/tmp/rev-xhz4h-hashfix` whose `node_modules` symlinks the worker's frozen closure. **No `npm install` was run.**

| Gate | Command | Outcome | Log |
|---|---|---|---|
| `rev-focused-23` | `900s bash rev-focus.sh /opt/node-v22.23.3-linux-x64/bin/node` | **exit 0** — typecheck 0, build 0, focused `# tests 2 / # pass 2 / # fail 0`; both evidence lines present (`dcfff6de…701a` positive, `5cb74f70…2b5c` negative) | `gate-rev-focused-23-01M67ZF9P8D3GX0XVVGGZ258A3.log` |
| `rev-focused-12` | `900s bash rev-focus.sh /tmp/access-a1.8HQd3X/node-v22.12.0-linux-x64/bin/node` | **exit 0** — identical result, `# pass 2 / # fail 0` | `gate-rev-focused-12-01M67ZFJQR6KJ0YGWGN8KRXTBH.log` |
| `rev-probes` | `600s bash rev-mutant.sh` (Probes A/B/C above) | **exit 0** — ordering, ENOENT and malformed-lock behaviour all as described | `gate-rev-probes-01M67ZGKZ2FM60790C187CAJWY.log` |
| `rev-mutants` | `600s bash rev-mutants2.sh` (mutants 1–3 + restore) | **exit 0** — M1 **killed** (`not ok 2`, 1 fail), M2 **survived**, M3 **survived**, pristine restore back to 2/2 | `gate-rev-mutants-01M67ZH74CDHAT307TC82K8ZXG.log` |

Node binaries confirmed in-gate: `fde6a4bf…48f48` / v22.23.3 and v22.12.0 — matching the reviewed preflight table.

**Mutant reproduction (brief check 4) — confirmed.** Removing *only* the hash assertion at `context-only-fork-seed-child.mjs:32-33`: the positive test still passes, the discriminating control fails with `changed bytes must fail the normalizer precondition / 0 !== 1`, `# tests 2 / # pass 1 / # fail 1`. Same signature as the worker's `fixture-mutant.log` / `mutant-raw.log`. The mutant is genuinely killed by the new control and not by an unrelated failure.

**Matched cells (brief check 5) — verified from the reviewed evidence, not taken on trust.**
All eight `*.closure-before.json` / `*.closure-after.json` plus `frozen-node-modules-manifest.json` hash to the same `dabd770544b337bb2cc16f7e851ea638c698dcca4e4f33c3cfea39e5a727fa01` (7,332 entries) — one identical physical closure across all four cells, `fixture-head/node_modules` being a symlink to `fixture-closure/node_modules`. CM resolves **0.24.2**, integrity `sha512-TiS7kX…NDgQ==` from `node_modules/.package-lock.json`, normalizer `dcfff6de…701a`. `grep -c '^not ok'`: base-23 **1**, base-12 **1**, head-23 **0**, head-12 **0**; the single base failure in each is `not ok 884 - fork seed normalization preserves alignment…` with `'0.24.2' !== '0.24.1'` (`base-23.log:10282`, `base-12.log:8975`) — exactly the predicted cause and nothing else. Counts reconcile: base `9623+1+63=9687`, head `9625+0+63=9688` (+1 test, +2 pass). `matrix-owner.log` / `matrix-exits.txt` show one sequential run per cell in order base-23 → head-23 → base-12 → head-12 with **no retries**; all four `result.json` have `inconclusive:false`, `log_capture:0`, `cap_hit:false`. Evidence lines appear twice in each head log and zero times in each base log (expected — the line does not exist at base).

## Unmet Criteria / test gaps

No unmet criterion for this bounded round. Test gaps, both in `test/context-only-delivery.test.ts`:

1. Ordering ("refuses before any fork work") is unenforced — mutant 3 survives (MEDIUM above).
2. Emission of `CONTEXT_MANAGER_NORMALIZER_EVIDENCE` is unenforced — mutant 2 survives (MEDIUM above).
3. Lock/manifest version **drift** is silent by design: `context-only-fork-seed-child.mjs:22` requires `entry.version === manifest.version`, so a lock that disagrees with the installed tree yields `integrity:null` rather than a diagnostic. Consistent with "version/integrity = evidence"; noted, not a finding.
4. No control covers a hash mismatch arising from a *genuinely different* normalizer implementation (one that changes cardinality). The existing `dropFirst` stub covers the production cardinality guard separately, so the pair is adequate; a single fixture cannot cover both at once.

## Residual Risk

- **Byte identity is not package compatibility.** The fixture qualifies one module's bytes under one resolved closure. 0.24.2's other 7,331 closure entries are exercised only insofar as the AF suite touches them. The delta says this explicitly in five places; the risk is real but correctly scoped and disclosed.
- **No lockfile means the closure is not reproducible by a third party.** The qualification is bound to a locally frozen `node_modules` and a *non-committed* `frozen-package-lock.json` (`df14aa0a…`). A future `^0.24.0` resolution to 0.24.3+ with different normalizer bytes will fail the precondition loudly — the intended outcome, but it will land as a red suite on an unrelated PR rather than as a dependency-update decision. That is the accepted cost of "don't pin AF's dependency"; whoever gets the red suite needs the "re-audit required" message to lead them to this fixture, which it does.
- **`liveness-watchdog` divergence is unresolved** (LOW above): reproducible for the task operator across five commits including pristine, absent for the worker and for me. Out of scope for this delta; still unexplained, so "0 fail" should not be read as environment-independent.
- Pre-existing D limitations are untouched by this delta: default-off profile, one-way enablement, no CM minimum-reader gate, no live-provider qualification.

## Fix Directions

1. **(MEDIUM, both at once)** In `test/context-only-delivery.test.ts`, replace line 478 with a shape assertion on the mismatch child's full stdout — `assert.match(result.stdout, /^CONTEXT_MANAGER_NORMALIZER_EVIDENCE \{[^\n]*\}\n$/, 'only the evidence line precedes the refusal')` — and add `assert.match(output, /CONTEXT_MANAGER_NORMALIZER_EVIDENCE \{/)` at line 465. Verify by re-running mutants 2 and 3 (`$ORGASMIC_EVIDENCE_DIR/rev-mutants2.sh`); both must then fail.
2. **(LOW)** `docs/context-only-delivery.md:146`: relabel the audited CM version or state that the file:line evidence was taken at 0.24.1 and not re-audited at 0.24.2. In scope for `docs/`.
3. **(LOW, follow-up round only)** `src/framework.ts:17867`: drop "0.24.1" from the comment and refer to the hash contract. Deliberately **not** in this round — the brief forbids any `src/` diff.
4. **(LOW)** Add one sentence to the PR body's Qualification noting the 0-fail figure is environment-bound and that the operator's watchdog divergence is tracked separately.

## Review hygiene

Worktree left exactly as found: `git status --porcelain` empty, HEAD `93932bae`. No commits, no edits to tracked files, no new files in the tree. All probe work in `/tmp/rev-xhz4h-hashfix` (disposable) and scripts/logs in `$ORGASMIC_EVIDENCE_DIR`. The worker's frozen closure is byte-identical to its manifest after my runs.
