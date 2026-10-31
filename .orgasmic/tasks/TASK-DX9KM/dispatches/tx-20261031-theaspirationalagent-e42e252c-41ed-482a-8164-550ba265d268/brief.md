TASK-DX9KM, stage 1: CODE-ONLY merge (LOCAL ONLY, UNQUALIFIED). Operator Tarn; qualifier Soma; this is not an owner decision.

Goal: a local merge of I7 and D in your worktree.
- First parent: I7 = a0970645d403a7a76449221fc36f240a7aa2464b. It contains A 869bb3add7b48893d48b2ce50ea423e4b33fdfbc and B 29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04.
- Second parent: D = 93427f90a16bcfbcf815217f4c080669ab842a71.
- Expected merge-base: A.
- Before you start, verify all four shas with `git rev-parse` and the ancestry with `merge-base --is-ancestor` (A<I7, B<I7, A<D) and `git merge-base I7 D` == A. On any mismatch, STOP and report.

Refs:
- Create local recovery refs `refs/heads/recovery/abdi7-i7-a0970645` and `refs/heads/recovery/abdi7-d-93427f90` at the parents.
- Do the merge on local branch `unqualified-local-abdi7-20261031`, starting at I7, with `git merge --no-ff --no-commit 93427f90`.
- Never force, reset main, delete, push, or touch any other branch.

Conflicts: resolve them preserving BOTH sides' semantics. Don't drop either side's behaviour.
- Where D (context-only storage/classification, fork-seed, server-connection wire seam) and I7 (per-item `forItem` issued-context composition, `registrationAdmissionForItem`, the `admission_missing` fail-closed arm, the internal compositor/brand registry) meet, keep I7's per-item issued-context composition intact. Classify D's context-only items on the same issued context, without refreshing provenance or borrowing.
- If a conflict can't be resolved without a semantic choice that changes either side's contract, STOP for that hunk and ask. Show both sides and say which invariant is at risk.

Also inspect the AUTO-MERGED regions of the seven files touched on both sides since A:
- src/framework.ts
- src/mcpl/channel-registry.ts
- src/mcpl/protocol-family.ts
- src/mcpl/push-handler.ts
- src/mcpl/server-connection.ts
- src/mcpl/types.ts
- test/mcp-protocol-family.test.ts

A clean textual merge is NOT evidence of preservation. For each file, produce a table: region → D change → I7 change → composed behaviour → invariant (D storage/classification ordering × per-item issued context; frozen epochs; A refusal on stale epoch; B reply-routing/authorize===true/private+notice; profile-off byte identity) → preserved / AT RISK / unknown. Cite line ranges in all three trees.

Allowed checks: `git diff`, `git range-diff`, `git log`, reading files, `git merge-tree`, `git diff --check`, and grep.
Not allowed: npm/bun/node/tsc, any build, test or package execution, installs, network.

Commit:
- Commit the merge as a normal merge commit with exactly two parents (I7, D).
- Author `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`, with the same co-author trailer convention as the most recent commits on I7. Verify it from `git log -1 --format=%B a0970645`; don't invent one.
- Neutral message: no internal names, task, run or private paths.

Report:
- the merge sha, both parents, and the recovery refs
- the conflict list with resolutions
- the seven-file semantic table
- AT RISK items
- what you didn't verify
- an explicit "no build/test run" statement
Progress note every 5 minutes.