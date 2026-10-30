Fix round for upstream PR #906 (anima-research/agent-framework, "Add opt-in required admission for inbound MCPL traffic") after the maintainer's review.

Start from commit 66c9db3fd840c7d821aa4f8e9d5ce389b19d923c (the current PR head = branch required-inbound-admission; 6 per-lane commits on upstream main 48f26ce56cf73267d715e853acc9a88b50595337). Check upstream main with `git ls-remote https://github.com/anima-research/agent-framework.git refs/heads/main`; if it moved, report it but do not rebase unless trivially conflict-free.

Normative inputs (read in full):
- /srv/review-drop/PR906-ANARCHID-R1.md — maintainer dual review R1 at 119cb86 (same content as 66c9db3f, rebased): findings R1-1 .. R1-10 with the maintainer's proposed fixes. Finding ids are stable; cite them in commit messages (e.g. "Fix R1-1: ...").
- /srv/review-drop/PR906-BOT-COMMENTS.md — 4 Medium automated review comments (null line in handshake, coalesced work revoked, connector-literal test freezing Discord counts, no test for handshake-time refusal). These overlap R1-1/R1-4/R1-5.

Owner decision: address ALL findings R1-1..R1-10 and the bot Mediums. Follow the maintainer's preferred fix where one is given:
- R1-1 + R1-6: remove the separate refuseEarly listener; refuse inside the handshake's existing onLine after messageFromLine, only while installed; document the handshake-phase answer; tests for a `null` line and a same-chunk ping.
- R1-2: stop advertising toolHints on required connections (hintsFor() false when inboundAdmission is set, or reject the combination in serverConfigProblems), then remove the special cases (tools/hints refusal, push-tap suppression, tapResponse skip) that become unnecessary; add a test that a required connection's toolsets/list result is adopted.
- R1-3: preferred fix — hold required data-lane items exactly as unconfigured ones are held and run admission at flush time through emit() under the key current at flush, refusing superseded-epoch items as admission_stale; tests incl. quiesce/resume and startup staging.
- R1-4: choose between re-running admission for restored/prior-epoch coalesced batches under the current key, or refusing coalesce on required connections with admission_unsupported. Prefer the honest/smaller option if re-admission is large; ask via the ask tool if unsure. Document it; add a reconnect-with-pending-batch test.
- R1-5: restrict the connector-literal inventory to files this PR adds / that hold admission logic (src/mcpl/inbound-admission.ts with an empty allowance), dropping the framework.ts Discord-identifier ceilings.
- R1-7: emit the existing *-rejected traces with the refusal code plus a rate-limited log line for all admission refusals.
- R1-8: carry the fatal classification through HandshakeCleanupError/McplUnreapedLaunchError (or walk cause at the startup check); test.
- R1-9: export a read-only admissionOf(event) accessor and envelope type, AdmissionConnectError, MAX_ADMISSION_TIMEOUT_MS, MAX_PENDING_ADMISSIONS; update docs.
- R1-10: limit the wake cap to mayWake:false (preferred) or document it — prefer limiting; ask if this conflicts with existing tests' intent.

Keep the per-lane commit structure where reasonable; fix commits may be additional commits on top (preferred for review) rather than rewriting the 6 commits. Unconfigured behaviour must stay byte-identical. No connector names in new code.

Also produce, between "BEGIN DISPOSITION" and "END DISPOSITION" in your report, a concise reply to the maintainer listing each R1-n and bot comment with: fixed in <commit> / how, or not fixed and why. Plain, factual, no internal names, hosts, people or task ids. And an updated PR body between "BEGIN PR BODY" / "END PR BODY".

Gates (every heavy command under `XDG_RUNTIME_DIR=/run/user/1002 systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`): typecheck, build, full npm test on Node 22.23.3 (/opt/node/bin) and Node 22.12.0 (/tmp/credential-engines/node-v22.12.0-linux-x64/bin if present); report exact counts on base 66c9db3f and on your head; the maintainer's three repros (null line, same-chunk ping, quiesced push) as tests. Note: no package-lock.json; use npm install --ignore-scripts --no-save.

Author and committer for every commit: Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>, with trailer `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. No push, no PR edits, no GitHub comments. Use the ask tool for decisions outside this brief.