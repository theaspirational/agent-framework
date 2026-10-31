Your worktree is this work chain's shared tree, checked out detached at 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f — the commit you review. Leave it exactly as you found it: no commits, no edits, no new files (ignored build output is fine). The next round of the chain runs here, and the daemon records anything you leave behind when your dispatch is closed.

Reviewed implementer evidence ($ORGASMIC_REVIEWED_EVIDENCE_DIR): /home/orgasmic/.orgasmic/runs/run-01M68G1RMEX2AQT8ZVV53JACT2/evidence

Independent SEMANTIC review of TASK-DX9KM stage 1, a code-only merge. READ-ONLY, UNQUALIFIED, LOCAL ONLY. Operator Tarn; qualifier Soma; no owner decision is involved.

Merge under review: 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f on local branch unqualified-local-abdi7-20261031.
- Parent 1, I7: a0970645d403a7a76449221fc36f240a7aa2464b. It contains A 869bb3add7b48893d48b2ce50ea423e4b33fdfbc and B 29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04.
- Parent 2, D: 93427f90a16bcfbcf815217f4c080669ab842a71.
- Recovery refs: recovery/abdi7-i7-a0970645 and recovery/abdi7-d-93427f90.

Implementer report: /srv/review-drop/TASK-DX9KM-MERGE1.md (sha256 920f2478a040cca6c768abecc9744e249c22ac6261828ae3d295536417c86cbf). Verify the sha before reading.
The implementer also ran its own sub-review (independent-review.md in its evidence). It is NOT this review and gives no credit; form your own judgement.

Rules:
- Never run npm/bun/node/tsc, builds, tests, installs or network.
- Use git with per-command overrides: `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false`. Add `--no-ext-diff --no-textconv` on diffs.
- No commits, ref changes, checkout or reset in the shared repo. Read files via `git show <rev>:<path>`, or use a private `git worktree add --detach` under /tmp and remove only that worktree at the end.

A clean textual merge is NOT evidence of preservation. Review the AUTO-MERGED regions as well as the 6 conflict hunks, across all 7 files touched on both sides since A:
- src/framework.ts
- src/mcpl/channel-registry.ts
- src/mcpl/protocol-family.ts
- src/mcpl/push-handler.ts
- src/mcpl/server-connection.ts
- src/mcpl/types.ts
- test/mcp-protocol-family.test.ts

Also check any other file where D and I7 changes interact through a call path, even when the file itself is touched on only one side.

Invariants to check:
1. D storage/classification ordering × I7 per-item issued-context composition. Each channel item uses exactly one issued fork. There is no capture(), refresh or borrowing of another item's context. D's pre/post delivery refusal sits correctly relative to I7's post-await stale/refusal checks. Classification never becomes ingress or reply authority.
2. Frozen epochs and registration generations: no new capture point, and invalidation on replace/remove is preserved.
3. A refusal: a stale or missing key → refusal. The `admission_missing` fail-closed arm is preserved.
4. B routing: authorize(...) === true only; private prose + notice; publication revalidation. Context-only items never mint reply bindings or wake turns.
5. Profile-off: with D's storage profile off and no recipient policy, is behaviour statically identical to I7 (and to D where applicable)? List any code path where the merge changes the off-profile path. Byte identity is not provable here; mark it unknown where it is.
6. The fork-seed path: D's inherited classification versus I7's issued-context provenance.

Verify the report's "byte-for-byte unchanged" claims yourself: registration-ingress/view, reply-admission/routing, inbound-admission against I7; inbound-delivery and stored-injections against D. Check that its line citations actually resolve.

Also check:
- The merge has exactly two parents in order, and the author is Vasyl noreply.
- The trailer: report the actual Co-Authored-By line. It was copied from I7; flag it as a pre-publication question, not a defect.
- The implementer's disclosed chronology deviation: the merge ran before the no-hooks binding arrived. Confirm from the repo that no hook or driver could have applied: hooks samples only, no attributes, no config.

Output: verdict approve/reject with severity-ranked findings. Each finding gets file:line in M plus the matching lines in I7/D, a failure scenario, and a fix direction. Then a per-invariant table: preserved / AT RISK / unknown, with evidence. List what you couldn't verify. State explicitly that no build or test ran. Progress note every 5 minutes.

## Gates already passed at this commit

orgasmic recorded these gate runs in the implementer's worktree, each on a clean tree it left clean, at 0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f — the commit your worktree is cut at — or at an ancestor of it whose gate inputs are identical to this commit's: the two trees differ only in paths this project marks as not gate inputs. Read the log instead of running the gate again. Run scoped probes and required gates that lack a reusable receipt. The manager names required gates; project policy also applies. Missing receipts do not assign a full suite.

- `clean-tracked-tree` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --exit-code HEAD` (cwd `.`) — at `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f` — log `/home/orgasmic/.orgasmic/runs/run-01M68G1RMEX2AQT8ZVV53JACT2/evidence/gate-clean-tracked-tree-01M68GEKZ5PQMWQAHM2DK0Z2AG.log`
- `unchanged-d-classification` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --exit-code 93427f90 HEAD -- src/mcpl/inbound-delivery.ts src/stored-injections.ts` (cwd `.`) — at `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f` — log `/home/orgasmic/.orgasmic/runs/run-01M68G1RMEX2AQT8ZVV53JACT2/evidence/gate-unchanged-d-classification-01M68GEKT3F77M3DXD8E6AD235.log`
- `unchanged-i7-ingress` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --exit-code a0970645 HEAD -- src/mcpl/registration-ingress.ts src/mcpl/registration-view.ts src/mcpl/reply-admission.ts src/mcpl/reply-routing.ts src/mcpl/inbound-admission.ts` (cwd `.`) — at `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f` — log `/home/orgasmic/.orgasmic/runs/run-01M68G1RMEX2AQT8ZVV53JACT2/evidence/gate-unchanged-i7-ingress-01M68GEKN1HE99WQKG8B040ED2.log`
- `whitespace-vs-d` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --check HEAD^2 HEAD` (cwd `.`) — at `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f` — log `/home/orgasmic/.orgasmic/runs/run-01M68G1RMEX2AQT8ZVV53JACT2/evidence/gate-whitespace-vs-d-01M68GEKBY2162CJF54VMKSJ4W.log`
- `whitespace-vs-i7` — exit 0 — `git -c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false diff --no-ext-diff --no-textconv --check HEAD^1 HEAD` (cwd `.`) — at `0bba1e8bcdf1dcafe2dad0817e42b9e9ef44b03f` — log `/home/orgasmic/.orgasmic/runs/run-01M68G1RMEX2AQT8ZVV53JACT2/evidence/gate-whitespace-vs-i7-01M68GEK6E17H2X08DQZQWAMVP.log`
