Your worktree is this work chain's shared tree, checked out detached at 9184d91e796ccd201831d9456a8662d9abd47d28 — the commit you review. Leave it exactly as you found it: no commits, no edits, no new files (ignored build output is fine). The next round of the chain runs here, and the daemon records anything you leave behind when your dispatch is closed.

TASK-DX9KM round 3, STATIC delta review, attempt 2. Read-only. UNQUALIFIED, LOCAL ONLY. Operator Tarn; scope binding from qualifier Soma (1793437032 / 1793437197 / 1793437584 / 1793438484); no owner decision is involved.

Attempt 1 (run-01M68M1RT2H99PKK8Q008RJ0BZ) was cancelled. It was given the wrong snapshot (I7 a0970645) and produced nothing.

SNAPSHOT BINDING, before anything else:
- The candidate is exactly 9184d91e796ccd201831d9456a8662d9abd47d28. The range under review is 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27..9184d91e796ccd201831d9456a8662d9abd47d28. Baselines are 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f (merge), I7 a0970645d403a7a76449221fc36f240a7aa2464b, and D 93427f90a16bcfbcf815217f4c080669ab842a71.
- Your FIRST progress note must state `git rev-parse HEAD` and the candidate full sha.
- Read every cited file and call path through git objects at 9184d91e only: `git -c core.hooksPath=/dev/null show 9184d91e:<path>` and `git grep <pat> 9184d91e -- <paths>`. Do this even if HEAD equals the candidate.
- Don't move HEAD.
- Cite lines at 9184d91e.

Read first:
- /srv/review-drop/TASK-DX9KM-LOW1-R3.md. Verify sha256 6d8230de55f8755f36ac18b6321b79c8759e35649edafcd8cc5a182fe2dd93b8.
- /srv/review-drop/TASK-DX9KM-LOW1-REVIEW1.md (a9763762f6a90b6aa5c4327d17507977ed1e4f838cb4339326e864ed882d6647), including its addendum.

FORBIDDEN:
- npm, bun, node, tsc, build, typecheck, test, mutant execution, install, network
- any git write, any edit to tracked files
- Use `--no-ext-diff --no-textconv`. Probes go in the evidence dir only.
- Progress every 5 minutes.

Binding truth table. Check the source against it exactly:
- (i) A trusted applied CONTEXT_ONLY ALWAYS suppresses preparation: 0 resolve, 0 authorize, no routing fields. A and storage still run.
- (ii) Trusted NORMAL, or a legacy normal item without a context-only decision, behaves exactly as at 0bba1e8b.
- (iii) An internal context-only path that has lost or mismatched its plan suppresses, and never falls back to legacy-normal.
- (iv) The push/event and inference/request lanes are unchanged.

Questions:
1. Carrier provenance. Is the ALS store written only at channel-registry:1983, from D's validated `plan` (:1965-1968)? Is `enterWith` or any leaked ambient store reachable? Is the instance unexported?
2. Entry capture. Is `appliedDispatchDelivery()` read synchronously, before the first await, into an immutable local in withReplyConsumer.admit? Is any later ambient lookup left?
3. Omission (the key question). Keep two classes strictly separate:
   (A) The actual supported in-tree call chains from :1983 to the consumer: registration-view, the registration-ingress compositor, the framework spread at 35095/35169/35286, and server-connection's composition. For each, show that a dropped 4th argument still suppresses.
   (B) Arbitrary custom/operator wrappers. Give explicit counterexamples where work is deferred OUTSIDE the dispatch context, so that `applied` is undefined at consumer entry and the path fails open: a callback or queue created outside the scope and drained later, an EventEmitter registered before the dispatch, a thenable or promise resolved from another context, setImmediate from a pre-existing context, a worker/message port. For each counterexample, state whether it is reachable in-tree on a supported path (with cites), or only via custom wrappers.
   Do NOT claim universal omission safety from a private ALS variable or from helpers being module-scoped.
4. Nested and concurrent. A separately validated nested NORMAL item inside a context-only dispatch must keep normal behaviour, and vice versa. Context-only must not be globally sticky. Distinguish trusted per-item dispatch (the :1983 scope) from an unconstrained helper call. Is anything shared across concurrent items?
5. Normal equivalence. For NORMAL and legacy, is the predicate algebraically identical to 0bba1e8b? Can the new console.error fire on a healthy path? Flood risk?
6. Lanes. Push never reads the carrier; inference never gets the consumer. Cite.
7. Surface and package reachability.
   - Confirm that no public signature changed.
   - For the two new exported helpers in src/mcpl/inbound-delivery.ts, determine PACKAGE reachability from package.json `exports`/`types`/`files`, the dist layout implied by tsconfig, and every barrel and re-export. The absence of a root-barrel export is NOT proof: a module shipped in files/dist and reachable through deep import, or `exports` patterns, counts.
   - If an external caller can reach `withAppliedDelivery`, can it only restrict, or can it also UNRESTRICT an inner context-only dispatch, e.g. `withAppliedDelivery(NORMAL, …)` wrapping a call that re-enters :1983? Note that :1983 installs its own scope. Is any new authority created?
8. Test source honesty. Do the named assertions check what they claim? Do the scoped and unscoped setups really differ? Are there visible compile errors? Is the mutant matrix correct?
9. Hygiene. Author and committer are Vasyl noreply, no trailer, parent 54ebfc58, recovery refs exact, tree clean.

Verdict: approve or reject, with findings graded HIGH/MEDIUM/LOW and file:line cites at 9184d91e. Include an explicit UNKNOWN list (runtime ALS semantics including Bun, emit, consumers). This is NOT a gate PASS.

## Gates already passed at this commit

orgasmic recorded these gate runs in the implementer's worktree, each on a clean tree it left clean, at 9184d91e796ccd201831d9456a8662d9abd47d28 — the commit your worktree is cut at — or at an ancestor of it whose gate inputs are identical to this commit's: the two trees differ only in paths this project marks as not gate inputs. Read the log instead of running the gate again. Run scoped probes and required gates that lack a reusable receipt. The manager names required gates; project policy also applies. Missing receipts do not assign a full suite.

- `round3-clean-tracked-tree` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --exit-code HEAD` (cwd `.`) — at `9184d91e796ccd201831d9456a8662d9abd47d28` — log `/home/orgasmic/.orgasmic/runs/run-01M68JW5EB1QKRDB4KSVDEFVD5/evidence/gate-round3-clean-tracked-tree-01M68KNJEWV2RF6TK6B26RN9SR.log`
- `round3-d-reachable` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false merge-base --is-ancestor 93427f90a16bcfbcf815217f4c080669ab842a71 HEAD` (cwd `.`) — at `9184d91e796ccd201831d9456a8662d9abd47d28` — log `/home/orgasmic/.orgasmic/runs/run-01M68JW5EB1QKRDB4KSVDEFVD5/evidence/gate-round3-d-reachable-01M68KNJ9VW1W4WAGQN86X66CX.log`
- `round3-i7-reachable` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false merge-base --is-ancestor a0970645d403a7a76449221fc36f240a7aa2464b HEAD` (cwd `.`) — at `9184d91e796ccd201831d9456a8662d9abd47d28` — log `/home/orgasmic/.orgasmic/runs/run-01M68JW5EB1QKRDB4KSVDEFVD5/evidence/gate-round3-i7-reachable-01M68KNJ4TX60BASG41HV9JW64.log`
- `round3-low1-base-reachable` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false merge-base --is-ancestor 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27 HEAD` (cwd `.`) — at `9184d91e796ccd201831d9456a8662d9abd47d28` — log `/home/orgasmic/.orgasmic/runs/run-01M68JW5EB1QKRDB4KSVDEFVD5/evidence/gate-round3-low1-base-reachable-01M68KNHTHF1ZSQ83MK9V9KDCW.log`
- `round3-original-merge-reachable` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false merge-base --is-ancestor 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f HEAD` (cwd `.`) — at `9184d91e796ccd201831d9456a8662d9abd47d28` — log `/home/orgasmic/.orgasmic/runs/run-01M68JW5EB1QKRDB4KSVDEFVD5/evidence/gate-round3-original-merge-reachable-01M68KNHZRQWCMT9YHHV3767AF.log`
- `round3-protected-modules` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --exit-code 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27 HEAD -- src/mcpl/registration-ingress.ts src/mcpl/inbound-admission.ts src/mcpl/registration-view.ts src/mcpl/server-connection.ts src/mcpl/reply-routing.ts src/mcpl/push-handler.ts src/mcpl/inference-router.ts src/stored-injections.ts src/framework.ts src/admission/admit.ts src/mcpl/capability-grant.ts src/index.ts src/mcpl/index.ts package.json tsconfig.json` (cwd `.`) — at `9184d91e796ccd201831d9456a8662d9abd47d28` — log `/home/orgasmic/.orgasmic/runs/run-01M68JW5EB1QKRDB4KSVDEFVD5/evidence/gate-round3-protected-modules-01M68KNHNK11A6G42X58RMC18J.log`
- `round3-whitespace` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --check 54ebfc586ed98ef1fa2ff47b63cbde8bcea42e27 HEAD` (cwd `.`) — at `9184d91e796ccd201831d9456a8662d9abd47d28` — log `/home/orgasmic/.orgasmic/runs/run-01M68JW5EB1QKRDB4KSVDEFVD5/evidence/gate-round3-whitespace-01M68KNHGHWAKBWFSR0NS3GFD5.log`
