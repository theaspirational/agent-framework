Slice D (context-only delivery) fix round 1. Owner approval: `xhz4h:fix:afterA`, one round: rebase onto the fixed slice A, plus M1–M4 and the overlapping LOWs. No push, no PR, nothing public.

Base: your worktree starts at a96ca7c172697632e28d5e7e707ec1c39c735403 (slice D, built on the OLD slice A 119cb8662d8e3d33f5aedf3633cb95ca6ec7dce1).

1. Rebase the D commits only (119cb866..a96ca7c1) onto the fixed slice A head c848977fc2280b378576f0eb72c2b07a0a93b86f (#906 after the maintainer-R1 fixes; it already sits on upstream c5306693). Use `git rebase --onto c848977f 119cb866`. Resolve conflicts in favour of A's current admission design (sequential ordered drain, held inference released at dispatch, requiredFlushDispatching, mayWake-only module caps). Don't change A's code except where D genuinely needs a seam, and list every such touch.
2. Fix the review findings in /srv/review-drop/TASK-XHZ4H-REVIEW1.md (read it in full):
   - M1: disclose and test the third wire delta (an ungranted incoming batch carrying `delivery`), or remove it if it isn't needed.
   - M2: add `channels.contextOnly` to DENY_BY_DEFAULT, with a test.
   - M3: widen the no-config corpus.
   - M4: the floor scan must not run on every create, and a failure in it must not block startup unguarded. Bound it, guard it, and test that.
   - LOWs L1, L2 and L6 (L6 = consistent slice A/D/E vocabulary in the docs). Other LOWs: list them as deferred, don't fix them.
3. Unchanged rules: no connector names or literals in new code; generic only; no context-manager or source changes outside this repo; opt-in profile only; unconfigured connections behave exactly as before.
4. Gates: full `npm test` on Node 22.23.3 and Node 22.12.0, each run under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`. Report base (c848977f) and head counts. Any failure must be shown failing on base too, or fixed.
5. Commits: per-concern commits on top of the rebased D; author/committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. No internal names, task ids, hosts or agents in commit messages, code or docs.
6. Report: a disposition table for M1–M4 and every LOW, the list of A-seam touches, gates, the final head sha, and a `BEGIN PR BODY` / `END PR BODY` draft for a PR stacked on #906 (upstream-ready wording, no internal names).

If anything here conflicts with A's current design, stop and ask; don't guess.