READ-ONLY DESIGN. Do not modify tracked files, do not commit, do not push. Deliverable: your final report (Markdown). THIS LEDGER IS PUBLIC: no private paths, hostnames, people or agent names in the report; refer to code by file:line only.

Repository: agent-framework fork. Upstream base 0.28.0 = e85c57db9aacba43a7b55e8e18bba607fa0228e6. Current PR head = 0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e (strict credential mode: five codes, 32-char floor, redaction of failures.log and the ops webhook). Both commits are reachable in this worktree.

Problem. Upstream already has a per-server credential filter: serverCredentialPatterns (src/mcpl/protocol-family.ts:347 at base), fed by the config's token/url/env and by dialsSent / noteDialSent (WeakMap per config, DIAL_SENT_KEPT = 16, ~:292-313), applied via Framework.everyServerRedactor() (src/framework.ts:31195 at base) to traces and tool errors. Our PR adds a separate 'accepted credential' registry with its own lifetime (begin/retire/snapshot-at-stop), unbounded retention, used only by the two sinks, plus a [withheld] projection for objects. Upstream's automated review on 0fdee5bc (verbatim below) found 6 MEDIUM issues, most inside our lifetime logic. The owner asked for a design that uses a SINGLE mechanism.

Owner decisions that bind the design (state if any becomes impossible, do not silently drop):
- D-union: in a framework holding any strict config, the two sinks redact every server's failure text against the credentials accepted by all strict configs.
- R9: strict configs keep every distinct credential sent for the config's lifetime (no 16 cap); legacy keeps 16 exactly.
- Flag flip: turning credentialRequired off keeps redacting with the accepted history until the config's lifetime ends; legacy dials before a strict flip are not reclassified as strict captures.
- Behaviour with no strict config must stay byte-identical to upstream (unless offered as an explicitly labelled maintainer question).
- Narrow scope: only failures.log and the ops webhook gain new protection. Any widening to traces/tool errors must be shown as an explicit owner decision, not assumed.

Answer, with file:line citations at e85c57db and 0fdee5bc:
1. Exactly what everyServerRedactor iterates, when its snapshot is taken, and what happens to a config being removed (runDisconnect/removeServer), displaced, finally closed, or in an in-flight handshake aborted by stop(), including teardown publications after removal. What strong reference must exist for protection to last until shutdown completes?
2. How the existing redactor handles non-string values and objects (does it invoke getters/toJSON/toString/valueOf/Symbol.toPrimitive? formatting of Date/URL/Buffer/Map/class instances/Errors?) versus our redactStrictSink. What the base logFailure/notifyOps paths do with record fields today.
3. Proposed single-mechanism design: e.g. strict configs extend dialsSent retention (sticky once a strict dial happened), the two sinks route through the existing redactor gated on 'framework holds a strict config'. Spell out: data structures, gating, flag-flip stickiness, D-union semantics vs the broader everyServerRedactor population (non-strict servers' tokens/urls/env), whether the extended history also reaches traces/tool errors (widening), and what retire/snapshot code remains.
4. Separate memory ownership, membership in a framework's union, and shutdown/reconnect protection; show which of those the WeakMap gives for free and which need explicit code.
5. Cost: the existing matcher build/caching triggers, the hot paths, and the cost with unbounded strict history; a concrete caching proposal.
6. A table mapping each finding below (6 MEDIUM + 1 non-diff MEDIUM + 3 LOW) to gone / remains / changes under the proposed design, with reasoning.
7. Output deltas versus upstream and versus 0fdee5bc for: no-strict framework; strict framework, the two sinks; strict framework, traces and tool errors.
8. Estimated production diff vs e85c57db (files, net lines) and a commit plan (separate commits reviewable on their own).
9. Open questions, labelled OWNER or MAINTAINER (e.g. strict-only vs always for the sinks).
You may run small throwaway probes outside the repo tree (scratch dir) to confirm behaviour; report commands and results. If any binding decision cannot be met, say so plainly and give options.

=== Upstream automated review on 0fdee5bc (verbatim) ===
### Automated review

**Recommendation: needs a maintainer's decision.** The change belongs, but part of it needs a maintainer's call.

Reviewed commit 0fdee5b with claude-opus-5-5, by reading the code. It did not run the code or look at the checks.

#### Does this change belong in the project?

**It fits, with concerns.** An opt-in fail-closed credential mode for MCPL WebSocket dials fits the project's existing credential-handling work. But it adds a second redaction registry, separate from the existing per-server credential filter and covering only two sinks, and its README section reads like review notes rather than user docs.

<details>
<summary>More</summary>

A maintainer should decide on both.

</details>

#### Findings

5 findings of medium or high severity, see the inline comments:

- Medium severity. [A failed stop() deletes every strict lifetime, but the framework can keep running and stop can be retried](https://github.com/anima-research/agent-framework/pull/870#discussion_r4399395196).
- Medium severity. [Standalone strict dials keep every credential forever in a set that no sink ever reads](https://github.com/anima-research/agent-framework/pull/870#discussion_r4399395203).
- Medium severity. [Every rotation rebuilds a redaction regex that grows without limit, and it runs on every failure log](https://github.com/anima-research/agent-framework/pull/870#discussion_r4399395207).
- Medium severity, test coverage. [No test for redaction after a failed stop that is retried or leaves the framework running](https://github.com/anima-research/agent-framework/pull/870#discussion_r4399395212).
- Medium severity. [Close handler retires the lifetime on closes where reconnect is already off but the config stays registered](https://github.com/anima-research/agent-framework/pull/870#discussion_r4399395222).

1 finding about lines the diff does not show:

- Medium severity. Strict sink copy withholds every non-plain object, not only objects with hooks or accessors. `src/mcpl/protocol-family.ts:458`

<details>
<summary>Details of this finding</summary>

- Medium severity, `src/mcpl/protocol-family.ts:458`. **Strict sink copy withholds every non-plain object, not only objects with hooks or accessors.** `redactStrictSink` returns `[withheld]` for any object that is not an Error, not an array, and not a plain object, whether or not it has hooks. That includes Date (whose toJSON is on the prototype), Map, URL, Buffer and plain class instances. While any strict lifetime exists, this projection is applied to every `logFailure` and `notifyOps` record for every server, so non-strict servers' diagnostic fields that used to be serialized now come out as `[withheld]`. The PR description and README say only objects with accessors or serialization hooks are withheld and that other formatting is kept. Either narrow the check to what is documented, or document that the change affects all non-plain data.

</details>

<details>
<summary>3 more findings, less severe</summary>

- Low severity, documentation, `README.md:59-112`. **User README contains review-process and provenance text instead of user documentation.** The new README section contains text meant for reviewers, not users. Examples: 'The in-depth base comparison was performed on Node 22.23.3 and Bun 1.4.3', 'unchanged from the first strict-dial implementation', 'not a strict-mode rollout authorization', and 'a mechanical drift guard remain separate work'. The test files do the same with labels such as 'red-then-green', 'P2', 'Reviewer accessor cases' and 'independent review's GC/probe cases'. These describe this PR's review history and will be wrong or meaningless to README readers and future maintainers. The same version claims also appear in `types.ts` and the changelog fragment. Move this material to the PR body.
- Low severity, documentation, `src/mcpl/transport.ts:631`. **Too-short credential error does not match the fixed five-code message format.** Every other strict failure is built by `fail(reason)` as exactly `MCPL server "<id>": <code>`. The length check throws a hand-built message with an extra parenthetical, `credential-unusable (strict credentials require at least 32 characters)`. The PR and README describe five fixed error codes, so callers that match the exact message, as the tests' `rejected()` helper does, will not recognize this case. Either route it through `fail` or document the suffix as part of the contract.
- Low severity, test coverage, `test/mcpl-strict-five-codes.test.ts:207`. **Open-timeout case waits the full 15-second WS_OPEN_TIMEOUT_MS.** The 'open timeout' variant uses a TCP server that never answers the upgrade, so it only finishes when the hard-coded 15,000 ms `WS_OPEN_TIMEOUT_MS` timer in transport.ts fires. That adds about 15 seconds to every suite run, and the test sits close to its 25 s timeout on a slow CI machine. Inject or shorten the timeout, or fake timers.

</details>

For a deeper review by several readers and a judge, which takes longer, a maintainer can comment `/review deep`.

<!-- rev-engine-prime -->