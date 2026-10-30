Your worktree is this work chain's shared tree, checked out detached at bf6e8e0eeaa38b086bb8d05bd4efe3a3d2f54cd9 — the commit you review. Leave it exactly as you found it: no commits, no edits, no new files (ignored build output is fine). The next round of the chain runs here, and the daemon records anything you leave behind when your dispatch is closed.

Reviewed implementer evidence ($ORGASMIC_REVIEWED_EVIDENCE_DIR): /home/orgasmic/.orgasmic/runs/run-01M675WMW5VJZFQ9S6N1351R2R/evidence

Independent review of slice B, NARROWED (binding automatic replies to admitted work). Head bf6e8e0eeaa38b086bb8d05bd4efe3a3d2f54cd9, stacked on slice A c848977fc2280b378576f0eb72c2b07a0a93b86f. Diff: `git diff c848977f..bf6e8e0e`. Round 3 (superseded) is kept at ref task-hjv3j-before-narrowing (3f0cfbae).
Read in full: the implementer report /srv/review-drop/TASK-HJV3J-NARROW.md. The narrowed contract it must implement is our public reply to the maintainer:
1. Admission and waking stay as in #906. Permission to publish an automatic reply is separate: an admitted item may carry a host-approved destination, and it is rechecked at send time.
2. When there's no unique approved route, the input stays admitted, automatic prose stays private with a readable notice, and explicit sends still work.
3. Causes share a turn only when each still authorises the same destination at send; otherwise they get separate turns or private prose.
4. `experimental.replyRouting` is dropped completely.
Conditions from the dispatcher: an optional sync `authorize` hook (no I/O); route resolution after A's verdict with its own timeout (1..60000), an AbortController and a cap of 64, where overload means private and never admission_denied; zero diff to A's `inbound-admission.ts`; no unresolved binding may reach a waking turn; a stale epoch result is discarded; with no hook, behaviour is exactly A's.
Check:
(a) Does the code implement exactly that? Look for any fallback to another destination, any route failure that refuses admission, any wake with an unresolved binding, any publish without the send-time recheck, and any shared-turn publish while one cause has lost authority.
(b) Has replyRouting / threaded / initializeExtensions been fully removed (no dead code, docs or tests)?
(c) The "Opted-in connections also keep unbound automatic prose private" behaviour: timer/heartbeat/home posts on opted-in connections. Is it correct, documented, and not a silent regression for unconfigured connections?
(d) Genericity: no connector names or literals in the new runtime modules.
(e) Test quality: mutation probes on the key guards.
(f) No internal names, task ids or hosts in the commits, docs or PR BODY.
(g) Run the full gate yourself once on Node 22.23.3 under `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0`. Do not reuse the worker's receipts.
Verdict APPROVE or REJECT; findings HIGH/MEDIUM/LOW with file:line. Read-only.

## Gates already passed at this commit

orgasmic recorded these gate runs in the implementer's worktree, each on a clean tree it left clean, at bf6e8e0eeaa38b086bb8d05bd4efe3a3d2f54cd9 — the commit your worktree is cut at — or at an ancestor of it whose gate inputs are identical to this commit's: the two trees differ only in paths this project marks as not gate inputs. Read the log instead of running the gate again. Run scoped probes and required gates that lack a reusable receipt. The manager names required gates; project policy also applies. Missing receipts do not assign a full suite.

- `head-node22.12.0` — exit 0 — `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c export PATH=/tmp/task-v08en/node-v22.12.0-linux-x64/bin:$PATH; node --version; npm test` (cwd `.`) — at `bf6e8e0eeaa38b086bb8d05bd4efe3a3d2f54cd9` — log `/home/orgasmic/.orgasmic/runs/run-01M675WMW5VJZFQ9S6N1351R2R/evidence/gate-head-node22.12.0-01M676R64JFFFASBJYXBK3XCJ0.log`
- `head-node22.23.3` — exit 0 — `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c export PATH=/opt/node-v22.23.3-linux-x64/bin:$PATH; node --version; rm -rf dist/src dist/test dist/tsconfig.tsbuildinfo; npm run build && npm test` (cwd `.`) — at `bf6e8e0eeaa38b086bb8d05bd4efe3a3d2f54cd9` — log `/home/orgasmic/.orgasmic/runs/run-01M675WMW5VJZFQ9S6N1351R2R/evidence/gate-head-node22.23.3-01M676GTFHRSSKT4GVCASCHVZC.log`
- `typecheck` — exit 0 — `systemd-run --user --scope -p MemoryMax=16G -p MemorySwapMax=0 bash -c export PATH=/opt/node-v22.23.3-linux-x64/bin:$PATH; node --version; npm run typecheck` (cwd `.`) — at `bf6e8e0eeaa38b086bb8d05bd4efe3a3d2f54cd9` — log `/home/orgasmic/.orgasmic/runs/run-01M675WMW5VJZFQ9S6N1351R2R/evidence/gate-typecheck-01M676GVM9HJ3RY3GAX9SKDNX0.log`
