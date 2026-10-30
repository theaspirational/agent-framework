Slice B (bind automatic replies to admitted work) NARROWING round. Owner programme go `gen:exec`, option "narrowed B now". Local only: no push, no PR edits (the upstream PR #931 stays held).

Base: your worktree starts at 3f0cfbae1d7f3d887390acd832b6245a4c54d86c (B round 3, 22 commits on slice A c848977f). Slice A is being refreshed separately onto newer upstream; stay on c848977f for now. A later rebase is a separate step.

Implement exactly this narrowed contract, which is our public reply to the maintainer (verbatim intent):
1. Admission and waking stay exactly as in slice A (#906). Permission to PUBLISH an automatic reply becomes separate: an admitted item MAY carry a host-approved destination, and it is checked again at send time.
2. When no unique approved route exists, the input stays admitted, automatic prose stays PRIVATE with a readable notice to the agent, and explicit send tools still work.
3. Causes SHARE a turn when each still authorizes the same destination at send. Otherwise they get separate turns, or the prose stays private.
4. Drop `experimental.replyRouting` (the local thread profile) completely: config, types, docs, tests.
Also: no mandatory channel/route for any wakeable item. `inference/request` keeps its JSON-RPC reply path. Pushes need no publishable route.

Keep from earlier rounds what remains valid: frozen destination on admitted work through holds/retries/continuations; automatic route mismatch never falls back to another destination; explicit sends authorised separately; stale continuation cleanup; token release stays frame-owned; coordinator/agent-tool locus changes can't redirect an admitted turn's binding; announcements use the frozen binding or fail closed. Remove code and tests that only served the dropped contracts (mandatory route, one turn per cause, replyRouting). Keep the owner/silent-resume regression test (no new recovery contract).

Constraints: generic only, no connector names or literals in new code; opt-in only; unconfigured connections unchanged. Prefer a minimal diff over A. Rewrite B's history into clean per-concern commits on c848977f if that gives a reviewable PR; keep a recovery ref `task-hjv3j-before-narrowing` at 3f0cfbae.

Gates: full `npm test` on Node 22.23.3 and 22.12.0 under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`, plus typecheck; base c848977f vs head counts.
Identity: author/committer `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, trailer `Co-Authored-By: GPT-6.1-Sol <noreply@openai.com>`. No internal names, task ids, hosts or agents.

Report: the exact safety contract as implemented (route approval, re-check at send, private-with-notice, shared-turn rule, explicit sends), a list of what was removed versus round 3, the parts likely to need rework if the maintainer asks for something different, gates, the final head sha, and `BEGIN PR BODY`/`END PR BODY` (upstream wording, stacked on #906). If any point is ambiguous, ask; don't guess.