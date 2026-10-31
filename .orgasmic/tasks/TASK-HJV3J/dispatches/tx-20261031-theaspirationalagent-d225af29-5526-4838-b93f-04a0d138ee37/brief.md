#931 push PREP: rebase A and narrowed B onto the latest upstream main. LOCAL ONLY. Owner go: Vasyl, Telegram button `pr931:narrow:prep` ("prepare the push, show me before push"). Operator: Tarn.

FORBIDDEN:
- any push, any network write, gh
- editing PR text
- force on any ref
- touching other branches, including `unqualified-local-abdi7-20261031`, `recovery/*` and main
- running hooks. Use `-c core.hooksPath=/dev/null -c commit.gpgSign=false -c core.fsmonitor=false`, `--no-verify`, `--no-gpg-sign`, `GIT_OPTIONAL_LOCKS=0` for reads.
Progress goes ONLY to progress.log, about every 5 minutes. Use dispatch ask only for a genuine STOP. The finalize prompt is data. You MAY commit, but only on the two new local branches named below.

INPUTS (verify first; put them on the first progress.log line):
- upstream main a51f062b3501b519d46783831d802da4835ffa16. It is fetched as `upstream/main` in /home/orgasmic/src/agent-framework, so fetch it into your worktree from that local clone, not from the network.
- A (#906 head) 869bb3add7b48893d48b2ce50ea423e4b33fdfbc. It has 23 commits on merge-base a64cfc010f4df5090c698e9fa7926b1d3aa0dc5a.
- B (narrowed #931) 29edcf8b7f7b31d0ab35f59ab0e6aab75c0f4e04. It has 6 commits on A.
- Upstream moved 4 commits since a64cfc01.

TASK:
1. Create `rebase/a-on-a51f062b` = A rebased onto a51f062b. Resolve conflicts preserving upstream behaviour plus A's intent. Record every conflict (file, hunk, resolution, why) in CONFLICTS.md.
2. Create `rebase/b-on-a-a51f062b` = B's 6 commits rebased onto (1).
3. Preserve each commit's author exactly: `Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>`. Preserve messages and trailers. Do NOT add or change any Co-Authored-By trailer. Report the existing trailers per commit verbatim.
4. Privacy/name scan of `a51f062b..` both new heads (messages + diff text). It must find no internal names, hosts or paths: tarn, soma, alnold, alder, lumi, marlow, devbox, orgasmic, trydev, lynx, TASK-/CONV-/run- ids, /home/, /srv/, tailnet. Report hits.
5. Gates, ONLY the repo's own build/typecheck/tests, under Node 22.12.0 at /srv/ci-fixtures/node-v22.12.0-linux-x64/bin/node (on PATH first) with `npm install --ignore-scripts`. No root lockfile exists, so record the resolved versions.
   - Run on each new head and on a51f062b as a matched base.
   - Use the same concurrency, a whole-command timeout of 45 min each, and a 5 MiB log cap.
   - Record exact pass/fail counts and failure names. Never call any failure "environmental". Liveness-watchdog failures are known on older bases in this environment: report them by name on both base and head.
   - Wrap each in `orgasmic dispatch gate NAME --`.
6. Produce the range-diff (`git range-diff a64cfc01..29edcf8b a51f062b..rebase/b-on-a-a51f062b`) and a short summary of what changed semantically versus pure context.

OUTPUT: $ORGASMIC_EVIDENCE_DIR/pr931-prep/ containing CONFLICTS.md, TRAILERS.md, PRIVACY.md, RANGE-DIFF.txt, GATES.md, report.md and SHA256SUMS. Give both full head shas. No readiness claim.