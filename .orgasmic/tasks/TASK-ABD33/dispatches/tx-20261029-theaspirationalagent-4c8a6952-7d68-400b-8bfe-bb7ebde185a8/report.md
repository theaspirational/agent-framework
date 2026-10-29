# TASK-ABD33 review — DESIGN: generic connector-agnostic recipient routing (WO-5b)

Reviewed: `docs/design/GENERIC-RECIPIENT-ROUTING.md` (272 lines) at `b9e770a1e2f45a9ef2e717ced3715e58e9ba2bfd`.
Doc copy `/srv/review-drop/GENERIC-RECIPIENT-ROUTING-r1.md` is byte-identical to the committed file
(sha256 `032b153c…5868`). Commit parent is `4a45766f` (U) as claimed; diff is the one doc file only;
worktree clean, left clean.

## Verdict

**APPROVE.** No HIGH findings. The design meets the assignment's substance: the behaviour inventory,
the three-authority split, the minimal fail-closed wire extension, the 34-row neutral test mapping,
sized slices with an upstream/fork split, and separated owner/maintainer questions are all present and
largely well-grounded in the pinned source. Citation accuracy is high — I sampled ~60 refs across
U/R/S/W/T/K and found two minor defects, both LOW. Three MEDIUM findings are enumeration gaps that let
a conforming implementation drop real guarantees; all three are fixable by adding lines, and none
invalidates the architecture.

## Findings

### MEDIUM — test, doc:206-208: red-case witness set omits the handshake lane's connector literals
`§6` line 206 puts `src/mcpl/server-connection.ts` in the scanned module set, but the enumerated
expected-red witness list at line 208 names only `R:src/framework.ts:19217-19224,19822-19823,32041`,
`R:src/mcpl/channel-registry.ts:971-971,6190-6194` and `R:src/host-recipient-protocol.ts:3-3,48-50`.
`R:src/mcpl/server-connection.ts` holds four code-level connector literals that are absent from it:

    1320: ...(config.supportRecipientBridge ? { slackRecipientRouting: config.supportRecipientBridge.initializeCapability } : {}),
    1407: if (config.id !== 'slack' || (experimental?.mcpl as { version?: unknown })?.version !== '0.5') {
    1408:   throw new Error('Recipient mode requires the local Slack MCPL 0.5 extension');
    1410: requireRecipientCapability(experimental?.slackRecipientRouting, ...);

Failure scenario: an implementer calibrates `routing-runtime-has-no-connector-literals` against the
stated witness list, so the assertion is never exercised on the handshake/negotiation lane — the exact
lane where connector naming entered the framework through the wire key and a `config.id !== 'slack'`
identity gate. The test then goes green on a port that keeps a named handshake branch.
(The inventory row at doc:45 *does* cite `R:src/mcpl/server-connection.ts:1316-1322,1402-1412,1524-1529`
and classify the behaviour — verified correct — so this is a red-baseline gap, not a classification gap.)
Fix: add those four lines to the line-208 witness set.

### MEDIUM — test, doc:206: scanned module set omits three ingress/admission modules the design itself changes
The initial set is `src/framework.ts`, `src/mcpl/{channel-registry,server-connection,types}.ts`,
`src/types/agent.ts`, plus "the new admission/routing modules and their runtime dependency closure".
The closure clause is scoped to *new* modules, so three existing modules the design's own §4.1 table
names as modification sites are outside the scan: `src/mcpl/push-handler.ts` (doc:111),
`src/mcpl/inference-router.ts` (doc:112), `src/admission/admit.ts` (doc:113 — the effect-ceiling site
capping `wake`/`gatePass`/`locus`).
Failure scenario: slice A/D adds a connector-named branch to `push-handler.ts` or `inference-router.ts`
— both literally "ingress path modules" by the line-206 wording — and the architecture test reports
green, so acceptance criterion "a red test showing the framework has no 'slack' literal on these paths"
is satisfied on paper while a literal survives on an ingress path.
Probe: `git show 36a91942:src/{mcpl/push-handler.ts,mcpl/inference-router.ts,admission/admit.ts}` →
0 case-insensitive `slack` hits each, so this is a future-proofing hole, not a present miss.
Fix: extend the initial set with those three, or widen the closure clause to all runtime path modules.

### MEDIUM — design, doc:38-52 and doc:147-156: two R guarantees neither classified nor witnessed
I enumerated all 16 `R:src/framework.ts:` citations in the doc and diffed them against every
`recipientReply` site in `R:src/framework.ts`. Two behaviours R adds are uncited, unclassified in the
§2 inventory, and absent from the §5 continuation table:

- `R:src/framework.ts:36775` — `+ if (open && !open.recipientReply && open.locus == null && …` : the
  coordinator/agent tool (`coordinator.enterAllExcept`, `'agent-tool'`) no longer assigns
  `open.locus = resolved` when the open logical turn carries a frozen reply.
- `R:src/framework.ts:37036,37046` — both changed by R from `routeSpeech(agentName, announcement(x), x)`
  to `routeSpeech(agentName, announcement(x), x, callingTurn.recipientReply)`: locus/channel-open
  **announcements** are routed through the frozen reply destination rather than the announced channel.

Failure scenario: slice B's exit condition is "Neutral rows 1–3, 6–10, 12, 14–19; collisions/stale
epochs; no connector literals" (doc:221) and G's is "No legacy code in framework routing paths"
(doc:226). No row 1–34 covers either site — R's nearest test (`:290-304`, mapped to neutral row 15 at
doc:187) asserts a single publish from a fixture whose `channel_open` emits no announcement, so it
witnesses neither. An implementation can therefore pass every stated exit condition while a coordinator
tool call repins a frozen turn's locus and an announcement lands in the announced channel instead of
the admitted destination.
Mitigation that keeps this out of HIGH: §5 states the invariants generically — "Do not overwrite it …
when another channel opens … or a tool returns" (doc:145) and "any automatic `deliverSpeech` call still
must match the binding" (doc:159) — so the behaviour is not contradicted, only unenumerated.
Fix: add one inventory row (keep generically) and one neutral witness row for each.

### LOW — docs, doc:132: `T:10` miscited
"T says frozen reply/status/provenance stay Slack-only (T:10,18)". `T:10` is the open-GATES line
(budget hold, G-AUTH, sealed qualification, owner go) and does not support the claim. The supporting
line is `T:9`: "frozen reply, status, provenance and the routing ledger stay Slack-only code and must be
ported by TASK-8K2H9". The co-cite `T:18` (the SLACK-ONLY inventory) does support it, so the conflict
row's substance is sound. Fix: `T:9,18`.

### LOW — docs, doc:208: `R:src/mcpl/channel-registry.ts:971-971` points at a blank line
Line 971 is empty; 972 is `interface ChannelRegistryOptions {` and the literal is at 973
(`recipientServerId?: 'slack';`). A second instance at `:1189`
(`private readonly recipientServerId?: 'slack';`) is also missing from the witness set. The §2
inventory row at doc:52 cites `970-973`, which is correct. Fix: `:973,1189`.

### LOW — design, doc:216-222: slices A and B read a tier low
A (`L` = 6–10 engineer-days) is the whole W required-admission checkpoint across four lanes with
pre-tap/pre-hold guards, post-await revalidation at five insertion points, and a passing real-transport
refusal matrix. B (`M` = 3–5 days) is private-binding plumbing through queues, continuations,
direct starts and provider/budget holds plus 13 neutral rows, collisions and stale epochs — where R's
much narrower hard-coded version alone was 235 changed lines in `src/framework.ts` plus 470 lines of
tests. doc:216 labels sizes "relative implementation/review estimates, not commitments", which blunts
this; flagging so a manager does not plan off A+B ≈ 9–15 days.

### LOW — design, doc:251: O2 is a maintainer/spec confirmation, not an owner decision
O2 asks the owner to "confirm selector + normal-wake tag refusal despite C3 wording". The design
already resolves it correctly from T's own text — `T:42` ("delivery together with a normal-wake tag …
is rejected too, and the tag never overrides the field … Decision, not question") versus `T:64` (C3:
the field decides, the legacy *marker* is not consulted) — and its reading, that C3's precedence applies
to a legacy metadata marker and not to a conflicting top-level tag, is the only one consistent with
both. Deciding-and-flagging is fine practice; the classification is not. Consider moving O2 to the
maintainer table. O1/O3/O4/O5 are genuine owner decisions (user-visible behaviour change and retirement
timing; scope of an advertised guarantee; production compatibility risk; feature scope) with sound
recommendations and stated consequences of withholding approval.

## What I verified (and what held up)

Citations: sampled ~60 refs, 2 defects (both LOW above). Precision is unusually good — e.g.
`U:src/admission/admit.ts:105-107` is exactly the `env.vetoed` branch returning `locus: true`, the
load-bearing evidence for "a wake veto still permits a locus update"; `U:src/mcpl/types.ts:1254-1259`
and `:1273-1284` land exactly on `ChannelsPublishParams` (no thread) and `ChannelIncomingMessage.threadId`.

Substantive claims I confirmed against the pins:
- **The port correction at doc:118 is real and valuable.** At U, `markAccepted`
  (`channel-registry.ts:1976-2013`) only repairs transport/open state, conditionally on lifecycle
  direction and desired state; the comment at `:1977-1980` states anchor/default decisions moved to
  `noteDelivered` (`:2317-2345`) after framework admission. W/T's old-build placement of default
  retarget in `markAccepted` (T:17) is not U's baseline. Correcting this before implementation is the
  doc's single highest-value contribution.
- **The O5 silent-resume hazard is real.** `U:src/framework.ts:23758-23784`: a silent start sets
  `this.turnRouting.set(agent.name, routing)` to its own `routing.silent = true` object, and a later
  `resumesTurn` takes `this.routingOf(agent.name)`. R's test `:452-470` asserts only that `openLogical`
  is preserved and no speech published — it never exercises a subsequent resume. The design's refusal to
  repeat the broader guarantee (doc:49, doc:192) is correct.
- **The `replyRouting` extension is minimal and genuinely fails closed** (doc:65-67): v1 is two
  booleans; no bot id, ACL, wake grant, provenance or status; absent thread means the registered channel,
  never latest; nothing sent to an old peer; partial/wrong-version/missing negotiation fails the profile
  closed. Consistent with U: `advertisedPaths` (`capability-grant.ts:138-160`) walks `VOCABULARY`, not
  the advertised object, so an unknown `capabilities.experimental.replyRouting` member is ignored by an
  old decoder rather than rejected — the local-extension framing is sound. The `[open]` at doc:68 that a
  host *offer* facility is a dependency is correct: `W:172-182` specifies reading the initialize RESULT
  and `W:182` explicitly puts any host offer/challenge outside scope.
- **The connector/host/framework split really does remove names and grammars.** Destinations are
  `ChannelRef` tuples with `destinationKey` as a JSON tuple ("Never concatenate delimiters that opaque
  ids can contain", doc:143 — matching U's own `qualifiedChannelName` comment "never split at a colon");
  `serverId` is assigned from the connection key, not returned by metadata (doc:74); the thread string is
  opaque, nonempty, bounded (doc:67); typing ownership is the existing `TurnRouting.turnId` plus process/
  agent identity (doc:161), not a second id system — a justified rejection of K:3.1's `scopeId`.
- **All eight §4.3 conflicts are real**, checked against the inputs: W:71-77 (intent opaque, resolution
  forbidden, no persistence promised) and W:211-218 (§8 extension points, nothing decided); W:184-196
  and T:48 genuinely cannot both be literal for a sender already using the reserved key; T:42 vs T:64;
  T:33/66/69 (push out of v1) vs R protecting both lanes vs W:198-209 (hints unsupported on a required
  connection); T:60-66 H1/H2; K:13-20's outer-handler insertion is indeed too late for the tap at
  `U:src/mcpl/server-connection.ts:2438-2442`, which fires during request dispatch before the plane gate.
- **Test inventory arithmetic is correct.** 20 `test(` declarations in `recipient-compatibility.test.ts`
  with two 2-case loops (`:347`, `:407`) = 22; 10 in `recipient-protocol.test.ts` with one 3-case loop
  (`:67`) = 12; total 34. Every neutral-witness row's `file:line` matches an actual test start line, and
  all 34 are mapped exactly once. The conditional hold skip is honest: `budgetHolds` count is 0 at U and
  R, 26 at S, so `:226-254`'s `t.skip('budget holds are not part of upstream main')` fires on R and not
  on S, exactly as doc:167 states.
- **Scope boundary respected.** Only the doc is committed; no code, no test implementation, no push/PR;
  the "red test" is delivered as a specification plus a source witness, which is the right call under the
  "No code" constraint.

## Verification Gates

Reused (not re-run), per the recorded receipt:
- `design-source-audit` — exit 0 — `python3 …/evidence/audit-design.py` at
  `b9e770a1e2f45a9ef2e717ced3715e58e9ba2bfd`, clean tree. Log:
  `/home/orgasmic/.orgasmic/runs/run-01M63PH8ZF75G215JE6T06WDTC/evidence/gate-design-source-audit-01M63QE4GS6BYVT6NH0K7QQGZR.log`.
  I read the log rather than re-running. Note its own stated limit — "existence/range, not automated
  semantic validation" — and that its RED witness probe covered `src/framework.ts` only, which is why
  MEDIUM-1 was not caught by it.

My own probes (all read-only; no gate wrapper, so no reusable receipt):
- `git cat-file -t` on U/R/S and W's `4976c67d` — all four commits resolve.
- `git rev-parse HEAD^` = `4a45766f…` — parent is the requested pin.
- `sha256sum` on all seven input documents — all match the doc's manifest table (doc:19-25).
- `sha256sum` on the doc and its `/srv/review-drop` copy — identical.
- `git show <pin>:<path> | sed -n` for ~60 cited ranges across U, R and S; `sed -n` for W/T/K line cites.
- `git diff U R -- src/framework.ts | grep -E '^\+.*recipient'` (92 added lines) cross-referenced against
  every `R:src/framework.ts:` citation in the doc — the diff that produced MEDIUM-3.
- `git grep -lI -i slack 36a91942 -- src` → 7 files; per-file `grep -ni slack` to separate code literals
  from comments (`conversation-router.ts:295,349-350` and `types/events.ts:60` are comments only, so
  correctly outside the design's comment exemption even though those files are unlisted).
- `git show <pin>:src/framework.ts | grep -c budgetHolds` across U/R/S.
- `git status --porcelain` before and after — clean, no commits, no new tracked files.

No build, typecheck or test suite was run: the brief named no runtime gate, the commit is
documentation-only, and the design deliberately claims no execution receipts.

## Unmet criteria / test gaps

Against the assignment's acceptance list:
- Behaviour inventory, each guarantee keep/drop/question — **substantially met, two omissions**
  (MEDIUM-3: coordinator locus at `R:…36775`, announcement routing at `R:…37036,37046`).
- Connector-agnostic contract; no connector names or id formats in framework code — **met in the
  contract text**; the *enforcement* has two holes (MEDIUM-1, MEDIUM-2).
- 34 tests connector-neutral + red no-`'slack'` test — mapping **met and arithmetically checked**; red
  test **specified, not implemented** (correct under "No code"), with an incomplete witness set.
- Slices with sizes, upstream/fork split, Slack and later Telegram migration — **met**; sizing optimistic
  (LOW). The upstream/fork sequencing is coherent because M0 (doc:232) fixes U, not R, as the
  implementation base — without that line slice B's "no connector literals" exit would be unreachable on
  the fork.
- Owner questions with recommendations, maintainer questions separate — **met**; O2 misclassified (LOW).
- No code, local design doc only — **met**.

Residual test gaps the design itself does not close, beyond the findings: no witness is proposed for the
pending-request dedupe key at `R:src/framework.ts:19523` (extended with reply channel/thread, so two
distinct roots sharing a `reason` no longer collapse) or the request-equality predicate at `:6375-6376`;
neutral rows 6 and 9 cover the observable consequence but not those predicates directly.

## Residual risk

- Protocol acceptance: `replyRouting` and `channels.contextOnly` are proposals. `channels.contextOnly`
  additionally needs U's closed vocabulary extended (`U:src/mcpl/capability-grant.ts:38-104` — verified
  `channels` has seven leaves and no `contextOnly`), so slice D cannot land without that change.
- Store/compaction: unproven by framework sources and open in T itself (T:48, T:84-92 Q27/Q28). The
  design's own `[open]` at doc:126 is the right posture; the companion context-manager change is a real
  dependency on D, not a detail.
- Host adapter trust and O3's status inventory require reading the host/Slack connector repos, which this
  task did not and could not inspect; no guarantee about `frozenStatus` should be advertised until then.
- Strict admission (O4) changes early/hinted-push and old-epoch-replay behaviour for deployed peers. The
  design refuses to present this as "unchanged push" (doc:136, doc:240), which is correct but means
  migration is gated on a decision not yet taken.
- Telegram: no connector implementation was inspected (doc:242, self-declared). Its port needs its own
  pins and end-to-end tests.
- My review is source- and document-based. I ran no build, no tests and touched no live connector, so
  nothing here qualifies runtime behaviour of U, R or S.

## Fix directions

1. doc:208 — add `R:src/mcpl/server-connection.ts:1320,1407-1410` to the red-case witness set, and
   correct `channel-registry.ts:971-971` to `:973,1189`.
2. doc:206 — add `src/mcpl/push-handler.ts`, `src/mcpl/inference-router.ts` and `src/admission/admit.ts`
   to the scanned set, or restate the closure clause as "all runtime modules on these paths, new or
   existing".
3. §2 inventory and §6 table — add one keep-generically row and one neutral witness each for the
   coordinator locus suppression (`R:…:36775`) and the announcement reply destination
   (`R:…:37036,37046`), and add both to slice B's exit condition at doc:221.
4. doc:132 — `T:10` → `T:9`.
5. doc:251 — move O2 to the maintainer table, or restate it as a notification of a decision already
   taken on T's own text.
6. doc:216-222 — reconsider A and B one tier up, or split A by lane so the estimate is per-lane.

None of these requires rework of the architecture; items 1–3 are the ones that change what a later
implementation is actually held to.
