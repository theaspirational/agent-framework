Your worktree is this work chain's shared tree, checked out detached at f8af03a852c85daf9bb8079937b994fe5419ca20 — the commit you review. Leave it exactly as you found it: no commits, no edits, no new files (ignored build output is fine). The next round of the chain runs here, and the daemon records anything you leave behind when your dispatch is closed.

Reviewed implementer evidence ($ORGASMIC_REVIEWED_EVIDENCE_DIR): /home/orgasmic/.orgasmic/runs/run-01M68N26DAFETZCQF1HFVF5APT/evidence

TASK-DX9KM round 4, STATIC delta review. Read-only. UNQUALIFIED / LOCAL ONLY. Operator Tarn; scope from qualifier Soma (1793439302, 1793439561). No owner decision.

SNAPSHOT BINDING (mandatory):
- Candidate: exactly f8af03a852c85daf9bb8079937b994fe5419ca20.
- Range: 9184d91e796ccd201831d9456a8662d9abd47d28..f8af03a852c85daf9bb8079937b994fe5419ca20.
- Baselines: 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f, I7 a0970645d403a7a76449221fc36f240a7aa2464b, D 93427f90a16bcfbcf815217f4c080669ab842a71.
- FIRST progress note: `git rev-parse HEAD` and the candidate sha. If HEAD is not f8af03a8, still read ONLY through git objects. Never switch or move HEAD.
- Read and cite every file via `git -c core.hooksPath=/dev/null show f8af03a8:<path>` and `git grep <pat> f8af03a8 -- <paths>`, with diffs `--no-ext-diff --no-textconv`.

FORBIDDEN:
- npm, bun, node, tsc, build, typecheck, test, mutants, install, network
- any git write or file edit in the worktree
Probes go only in the evidence dir. Write a progress note at least every 5 min (file in the evidence dir is fine).

Read first, in full, and verify the hashes:
- /srv/review-drop/TASK-DX9KM-LOW1-R4.md (ac8de90105e836073d73bf699a695ef750bdc657dea83eb2beec49e75ecca866)
- /srv/review-drop/TASK-DX9KM-LOW1-R3-REVIEW2.md (0ec564aea51569d222d5258014ab641c2e112e4206ecae0a723f83245c2ccbc2)

Binding truth table (unchanged): (i) a trusted CONTEXT_ONLY always suppresses preparation; A and storage still run. (ii) NORMAL/legacy behaves exactly as at 0bba1e8b. (iii) a lost or mismatched plan on the internal path suppresses and never falls back to legacy-normal. (iv) push and inference are unchanged.

Questions:
1. Behaviour neutrality. Is the suppression expression at reply-admission.ts:53 identical to 9184d91e:41? Does the throttle change only reporting (no early return, no skipped admission, no reordering)? Is the entry capture still before the first await?
2. Throttle bound. Is the WeakMap<object, RefusalLines> keyed only by a trusted connection object? Is the single fixed record key really fixed? Check RefusalLines (refusal-lines.ts) semantics: its cap, window, the meaning of the return value, and whether `admit('', key)` returns null for held lines. Is the printed text fixed apart from a number? Can any caller-controlled object become the key and grow state? What does the default `admission.key` fallback mean for direct helper callers?
3. Diagnostic predicate. Does it read only the mode of the trusted `applied` carrier and of an argument that can only restrict? Can a wire or caller claim turn into permission? Does the code and docs wording keep constant-identity copies distinct from separate ALS store instances, without claiming to fix both? No globalThis/Symbol.for registry? Are the loading-mode statements accurate against package.json?
4. Probe export. Retained. Is the documented reachability limitation accurate, with no claim that @internal hides it? Was removal genuinely infeasible without new surface, or is there a simple non-widening alternative?
5. Tests (source). Does the scoped positive prove the item was accepted, stored and classified BEFORE zero-count assertions? Is the refused re-wrapper asserted as a negative and not counted as the positive? Is the console mock re-emitting unrelated lines through a bound original, with restoration safe? Do the throttle tests check what their names say (fresh connection per fixture, so S1 is still killed by the first line)? Is the forwarded-copy row truthful? Any visible compile errors?
6. Docs. Are supported chains (A) kept separate from the five unsupported deferral counterexamples (B)? Any universal or runtime claim?
7. Type surface. Was no export added, removed or changed? Verify the signature table against 9184d91e.
8. Hygiene. Author and committer are Vasyl noreply, no trailer, single parent 9184d91e, recovery refs exact (including the new recovery/abdi7-r3-9184d91e), task-dx9km-impl still at I7, tree clean. The snapshot deviation is disclosed as a deviation.

Verdict: approve or reject, with HIGH/MEDIUM/LOW findings and file:line cites at f8af03a8, plus an explicit UNKNOWN list. This is NOT a gate PASS.

## Gates already passed at this commit

orgasmic recorded these gate runs in the implementer's worktree, each on a clean tree it left clean, at f8af03a852c85daf9bb8079937b994fe5419ca20 — the commit your worktree is cut at — or at an ancestor of it whose gate inputs are identical to this commit's: the two trees differ only in paths this project marks as not gate inputs. Read the log instead of running the gate again. Run scoped probes and required gates that lack a reusable receipt. The manager names required gates; project policy also applies. Missing receipts do not assign a full suite.

- `round4-base-reachable` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false merge-base --is-ancestor 9184d91e796ccd201831d9456a8662d9abd47d28 HEAD` (cwd `.`) — at `f8af03a852c85daf9bb8079937b994fe5419ca20` — log `/home/orgasmic/.orgasmic/runs/run-01M68N26DAFETZCQF1HFVF5APT/evidence/gate-round4-base-reachable-01M68NRQTM494DFCR61JEXVK8D.log`
- `round4-clean-tracked-tree` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --exit-code HEAD` (cwd `.`) — at `f8af03a852c85daf9bb8079937b994fe5419ca20` — log `/home/orgasmic/.orgasmic/runs/run-01M68N26DAFETZCQF1HFVF5APT/evidence/gate-round4-clean-tracked-tree-01M68NRRN6MR7PPCXDKPDAR3GP.log`
- `round4-d-reachable` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false merge-base --is-ancestor 93427f90a16bcfbcf815217f4c080669ab842a71 HEAD` (cwd `.`) — at `f8af03a852c85daf9bb8079937b994fe5419ca20` — log `/home/orgasmic/.orgasmic/runs/run-01M68N26DAFETZCQF1HFVF5APT/evidence/gate-round4-d-reachable-01M68NRRFQWVBN9Z93QZ6T3PB8.log`
- `round4-i7-reachable` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false merge-base --is-ancestor a0970645d403a7a76449221fc36f240a7aa2464b HEAD` (cwd `.`) — at `f8af03a852c85daf9bb8079937b994fe5419ca20` — log `/home/orgasmic/.orgasmic/runs/run-01M68N26DAFETZCQF1HFVF5APT/evidence/gate-round4-i7-reachable-01M68NRRAN0HQ4SGYGX7C4YGPR.log`
- `round4-low1-base-reachable` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false merge-base --is-ancestor 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27 HEAD` (cwd `.`) — at `f8af03a852c85daf9bb8079937b994fe5419ca20` — log `/home/orgasmic/.orgasmic/runs/run-01M68N26DAFETZCQF1HFVF5APT/evidence/gate-round4-low1-base-reachable-01M68NRQZKTN9TT9QZ3CZK1S5R.log`
- `round4-original-merge-reachable` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false merge-base --is-ancestor 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f HEAD` (cwd `.`) — at `f8af03a852c85daf9bb8079937b994fe5419ca20` — log `/home/orgasmic/.orgasmic/runs/run-01M68N26DAFETZCQF1HFVF5APT/evidence/gate-round4-original-merge-reachable-01M68NRR5GMQ7KHNHWC0XYN2EH.log`
- `round4-protected-modules` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --exit-code 9184d91e796ccd201831d9456a8662d9abd47d28 HEAD -- src/mcpl/registration-ingress.ts src/mcpl/inbound-admission.ts src/mcpl/registration-view.ts src/mcpl/server-connection.ts src/mcpl/reply-routing.ts src/mcpl/push-handler.ts src/mcpl/inference-router.ts src/stored-injections.ts src/framework.ts src/admission/admit.ts src/mcpl/capability-grant.ts src/index.ts src/mcpl/index.ts package.json tsconfig.json` (cwd `.`) — at `f8af03a852c85daf9bb8079937b994fe5419ca20` — log `/home/orgasmic/.orgasmic/runs/run-01M68N26DAFETZCQF1HFVF5APT/evidence/gate-round4-protected-modules-01M68NRQNJ4GV1R3K043G7609R.log`
- `round4-whitespace` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --check 9184d91e796ccd201831d9456a8662d9abd47d28 HEAD` (cwd `.`) — at `f8af03a852c85daf9bb8079937b994fe5419ca20` — log `/home/orgasmic/.orgasmic/runs/run-01M68N26DAFETZCQF1HFVF5APT/evidence/gate-round4-whitespace-01M68NRQGHTVXZ24ZNNWBAS1YD.log`
