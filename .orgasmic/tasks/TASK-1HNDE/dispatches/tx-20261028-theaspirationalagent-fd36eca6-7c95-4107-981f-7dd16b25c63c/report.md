# Design: one credential mechanism, two scope-preserving views

## Changed

**Read-only investigation; no tracked files changed, no commit, no push.** Deliverable is this design report. Repository instructions and the supplied project baseline were read; no applicable conventions or gotchas were supplied.

Citation legend: **B** = `e85c57db9aacba43a7b55e8e18bba607fa0228e6`; **H** = `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e`. All source references below use those revisions, not the review's sometimes-stale line numbers.

### Recommendation

Use **one config-keyed dial-history store, one credential-pattern builder, and one matcher implementation**. Retain two *views* of that store:

1. The existing bounded view, unchanged for existing traces/tool errors.
2. An accepted-strict-credential view, unbounded and used only by failures.log and the ops webhook.

Keep framework membership and temporary shutdown/publication holds separate from credential storage. Remove destructive credential-lifetime retirement. Keep the descriptor-only sink projection as a presentation/security policy, but make it consume the shared matcher rather than build another credential registry or matcher. Document its actual broad withholding behavior.

**Merely uncapping the existing arrays and calling the existing `everyServerRedactor()` is not acceptable under the binding decisions.** That would expose extended history to traces/tool errors and would redact the two sinks against non-strict servers' configured tokens, URL credentials and environment secrets too. Reusing a mechanism does not require using an identical population at every sink.

All binding decisions are achievable with the two-view design. They are not simultaneously achievable with an unchanged, single-view `serverCredentialPatterns` consuming uncapped arrays. The latter needs an explicit OWNER widening decision; it is not the default proposed here.

## 1. What exists: iteration, snapshots and lifecycle

### The upstream union is an operation-local closure, not a framework registry

`everyServerRedactor()` immediately takes a **strong array snapshot of the values of `mcplServerConfigs`**, not the connection registry, not a global inventory, not the accepted registry, and not the closed-tab map. Each invocation of the returned function combines that array with the **current** map values, deduplicates by config-object identity, reads every config's patterns, and builds one combined matcher. The snapshot freezes membership, **not credential values**: dial history and config fields are read when the returned function is invoked. If pattern collection throws, the whole text is withheld. B `src/framework.ts:31187-31210`; H `src/framework.ts:31244-31267`.

Consequences:

- A removed or displaced object stays covered by a closure made before removal.
- A newly added object is covered by that same closure on a later invocation.
- A fresh closure made after removal cannot rediscover the old object through a WeakMap.
- Creating a redactor separately at each sink call does **not** provide shutdown-wide protection.
- A saved closure also strongly references the framework through `this`; it must not be retained indefinitely accidentally.

For example, tool-list refresh creates its closure before starting asynchronous work, then uses it in the rejection handler. H `src/framework.ts:32514-32536`. Several tool-failure sites instead create and immediately invoke one. H `src/framework.ts:24272-24275`, `src/framework.ts:24392`.

Not every trace or tool error uses this union. Connection event listeners use a per-config `serverTextRedactor`; response errors use that per-config matcher and `redactedData`. Generic trace emission bounds error/stack strings; it does not globally apply `everyServerRedactor`. H `src/framework.ts:31690`, `src/framework.ts:32146-32149`, `src/mcpl/server-connection.ts:2648-2676`, `src/framework.ts:28202-28212`.

### Lifecycle matrix

| Event | Upstream B | Changes at H |
|---|---|---|
| Explicit disconnect/removal | Abort a pending legacy connect, initiate closes, wait for the preceding operation, retry registry removal, then remove routing/config entries. Failure to reap keeps the connection/config registered. Successful config deletion precedes another awaited tool refresh and its publications. | Retires accepted history immediately before deleting the config, unless a stop snapshot exists. This loses protection for later publications outside stop. |
| Replacing the same id with a different object | The setter overwrites the config map. Old operation snapshots/per-config closures can still hold the old object and its WeakMap history. | Begins ownership for the incoming object and retires the displaced object's owner-lifetime. A repeated registration of the same object also resets its accepted lifetime through `beginCredentialLifetime`. |
| Final connection close, no reconnect | Connection registry may drop the connection; the framework config map is **not** deleted by that close listener. Ordinary config/dial-history redaction can continue. | The framework close listener retires accepted history merely because `willReconnect` is false, before its remaining publications, even though the framework still holds the config. |
| Transient close/reconnect | Reconnecting connection remains registered; config identity/history survive. | Accepted history normally survives while `willReconnect` remains true. |
| Initial handshake aborted by stop | Config was installed before the handshake. Stop aborts pending connects; a connection that completes too late is removed rather than made ready. Handshake rejection itself does not delete the config. | Stop snapshots config objects before teardown. The handshake catch requests retirement, suppressed while that snapshot exists; the snapshot can preserve sink protection even if concurrent disconnect later deletes the map entry. |
| Stop succeeds | Closes connections and forgets reference-registry addresses; does not clear `mcplServerConfigs` or `dialsSent`. | Finally erases every owned accepted lifetime and drops the stop snapshot, even though config objects can remain held. |
| Stop rejects/times out | Cleanup can outlive a timeout; failed work may still publish. A failed stop can be retried when its owned store remains open. | The same unconditional finally erases accepted history. “Stop promise settled” is incorrectly treated as “all credential-related lifetime obligations ended.” |

Evidence: B `src/framework.ts:30996-31068`, H `src/framework.ts:31051-31125`; B `src/framework.ts:7355-7359`, H `src/framework.ts:7370-7380`; H `src/mcpl/protocol-family.ts:289-318`; B `src/framework.ts:32043-32074`, H `src/framework.ts:32102-32134`; B `src/framework.ts:30127-30136`, `src/framework.ts:30235-30284`, H `src/framework.ts:30180-30189`, `src/framework.ts:30287-30339`; B `src/framework.ts:4929-4944`, H `src/framework.ts:4938-4953`; B `src/framework.ts:4856-4876`, `src/framework.ts:5304-5317`, H `src/framework.ts:4859-4885`, `src/framework.ts:5313-5326`.

The connection-registry and connection-close implementations are unchanged between B and H. `removeServer` awaits `closeServer`; `closeAll` bounds waiting without cancelling cleanup; close failures retain ownership for retry. `close()` disables reconnect before emitting a successful final close and aborts an in-flight reconnect. B/H `src/mcpl/server-registry.ts:78-112`, `src/mcpl/server-registry.ts:175-209`; B/H `src/mcpl/server-connection.ts:1841-1935`.

**Required strong reference:** a framework-owned shutdown/publication hold must retain each relevant **config object**, including configs removed or displaced while teardown/publication remains possible. The original map is sufficient only while that object remains in it. A `WeakMap` or `WeakRef` cannot substitute for this hold. A closure snapshot is sufficient if it is actually retained and consulted through the last publication and across failed attempts. A saved regex alone is insufficient: it misses credentials captured after the regex was built.

H's snapshot is useful but incomplete as a general model: it contains only the map at stop entry, is discarded on rejection, and does not capture configs already removed before stop entry. H `src/framework.ts:4870-4884`. A removed config still publishing needs an operation hold that shutdown also sees.

There is another real owner of configs: closed tabs. Closing a tab removes the active config and then retains it for reopening. That collection is not included in the current every-server redactor. B `src/framework.ts:29887-29900`; H `src/framework.ts:29940-29953`. The proposed strict-sink membership includes this explicit framework ownership; the existing trace/tool-error population stays unchanged.

## 2. Value handling and current sink formatting

### Existing redactors are not safe object serializers

`credentialRedactor` calls `asText`, including when there are no patterns. `asText` returns strings directly; otherwise it calls `String(value)`, catching conversion failures into a fixed unprintable-value marker. Thus it can execute `Symbol.toPrimitive`, `toString`, and then `valueOf` under JavaScript conversion rules, including getters used to obtain those hooks. Ordinary `String(object)` does **not** call `toJSON` or enumerate arbitrary data getters. It can read tagging/prototype behavior. It is not a descriptor-only operation. B `src/mcpl/protocol-family.ts:498-532`; H `src/mcpl/protocol-family.ts:654-688`.

The accompanying `redactedData` is different: it redacts strings, number text when matched, keys and recursively walked arrays/plain objects; it leaves other objects and other primitive types unchanged. It uses `.map`, `Object.entries` and prototype inspection, so accessors and proxy traps can run. It does not directly call serialization hooks on non-plain objects. A later serializer can. Its depth limit is 64, and it preserves colliding redacted object keys using suffixes. `maskedError` separately creates a fresh Error containing redacted words and the original name, without arbitrary fields/cause. These functions are unchanged at B/H `src/mcpl/protocol-family.ts:229-279`.

### Concrete formats

These are ordinary native values; user overrides can change the outcomes.

| Value | Existing text redactor input conversion | Base failure-record field | Base ops message description | H strict sink projection |
|---|---|---|---|---|
| Date | Date's string form | ISO JSON string | Date's string form | `[withheld]` |
| URL | URL text | URL JSON string | URL text | `[withheld]` |
| Buffer | Decoded buffer text | `{type:"Buffer",data:[…]}` | Decoded text | `[withheld]` |
| Map | `[object Map]` | Usually `{}` | Usually `[object Map]` | `[withheld]` |
| Class instance with ordinary own fields | Usually `[object Object]` | Own enumerable JSON fields | Its own meaningful String, else JSON | `[withheld]` |
| Native Error | Native Error string conversion | Name/classification/status/code/retryable/message projection | Same diagnostic projection | Descriptor-derived safe fields, formatted through the diagnostic projection |
| Plain object/array | Tag/array string conversion, not a deep walk | JSON with nested Error projection | JSON when no meaningful object String; arrays use JSON | Descriptor walk; selected unsafe, cyclic or deep values withheld |

Base field/message formatting is unchanged at B/H `src/framework.ts:2856-2909`, `src/framework.ts:2982-2996`. H projection: `src/mcpl/protocol-family.ts:365-425`; Error adapter: `src/framework.ts:28312-28320`.

In particular:

- `failureJson` uses `JSON.stringify` with an Error replacer. Normal JSON getters and `toJSON` execute; `toJSON` executes before the replacer, so a custom Error `toJSON` can bypass normal Error projection. Cross-realm Errors need not satisfy `instanceof`.
- `failureDescription` uses String conversion for primitives and meaningful object strings, otherwise JSON, then a tag fallback. Its Error branch directly reads fields and bounds name/type/provider code to 128 characters before producing the whole description.
- `boundFailureFields` enumerates the outer record, bounds strings to 2,000, projects Errors, and JSON-serializes other values. Small JSON is parsed into detached data; large JSON becomes bounded text. Undefined/function-like values that JSON omits are omitted; serialization failures fall back to the failure description. Outer `Object.entries` can itself throw.
- Base `logFailure` wraps that preparation and file append in best-effort catch, stamps `at`, and writes JSONL. It has no independent credential redaction at this boundary. B `src/framework.ts:28295-28306`.
- Base ops preparation describes/bounds the message, treats null data as absent, spreads plain data or wraps other data in a `data` field, and bounds it. Log data can override earlier outer fields through spread precedence. It logs, emits the original bounded trace, and posts **only composed message content**, not the data object, with a 500-character message bound and cooldown. B `src/framework.ts:28429-28476`.

H first builds descriptor-only copies for the two exports, then separately performs legacy preparation for the trace. On legacy-preparation failure it attempts safe exports, suppresses the trace that could not be prepared, and rethrows the original exception. Thus **H's projection avoids ordinary getters/hooks; the entire ops call does not promise that no hooks run**. Reflection can also invoke proxy traps; descriptor inspection is not arbitrary-JavaScript sandboxing. H `src/framework.ts:28478-28529`, `src/mcpl/protocol-family.ts:373-423`.

H's non-plain-object rejection is at `src/mcpl/protocol-family.ts:376`, not the review's cited line 458. Date, URL, Buffer, Map and ordinary class instances are all withheld, regardless of whether their own descriptors contain hooks. This is broader than the documented accessor/hook exception at H `README.md:411-416`.

## 3. Proposed single mechanism

### Storage and capture

Extend the existing `dialsSent` WeakMap entry, rather than create another owner-keyed accepted-credential store:

- One token pool and one URL pool, deduplicated by string value.
- The existing newest-16 token and URL order indexes, retaining their exact recency behavior.
- Per-entry provenance: whether a token was accepted on a strict dial; whether the entry is pinned for full-history retention.
- Config-level `strictEverAccepted`, an ordinary-view version, and an accepted-view version.
- Optional derived pattern caches; caches are not another authoritative credential history.

Each pool entry has one authoritative payload. The bounded indexes and provenance are indexes/metadata over those entries, not independently retired credential registries.

Before the first strict capture, preserve upstream's 16 **distinct tokens and 16 distinct URLs separately**, not “16 connections.” A duplicate moves to newest without changing the matching set. On eviction, delete a pool entry only if nothing pins it. B `src/mcpl/protocol-family.ts:291-317`; H `src/mcpl/protocol-family.ts:437-473`.

On a validated strict dial, set sticky retention and mark that token `acceptedStrict`. Pin every distinct token/URL observed from that point onward, including later flag-off dials, to meet the stronger interpretation of sticky R9. **Only strict-dial acceptance sets `acceptedStrict`.** A later legacy dial can be retained without entering the strict sink view. Existing pre-strict entries are not retroactively marked or pinned; if subsequently sent again, their new observation gets the appropriate provenance. The ordinary newest-16 view continues to update exactly as upstream.

This distinction matters when a token is first seen on a legacy dial and later on a strict dial: accepting the same bytes strictly must increment the accepted-view version even though no new pool string is inserted.

Keep H's capture point: after provider validation and the 32-character floor, before constructing the WebSocket. “Accepted” means accepted for the dial, **not authenticated successfully by the peer**, and includes constructor/open failures. A provider result abandoned before that point is not captured. H `src/mcpl/transport.ts:697-733`. This preserves fail-closed dial behavior and avoids recapturing mutable config fields after awaiting host code.

### Two views, shared pattern/matching implementation

Factor the existing token/encoding pattern construction so it can read either view:

| View | Pattern population | Consumers |
|---|---|---|
| Default/compatibility | Current config token/URL/env plus exactly the newest 16 recorded URLs and tokens | Every existing `serverTextRedactor`, `redactServerText`, `everyServerRedactor`, trace and tool-error consumer |
| Accepted-strict | Only tokens tagged `acceptedStrict`, across the framework's held configs | failures.log and ops webhook only |

The default is unchanged. Do not let callers accidentally obtain all pinned history merely by calling the existing API.

Use the same `credentialRedactor` for combined overlap handling. Extend the shared builder with a strict-view-only option for H's mixed literal/ASCII-unicode-escape patterns. Otherwise replacing H's matcher with the base builder would silently lose an existing protection: the base forms do not recognize arbitrary mixed `\\uXXXX` escapes. B `src/mcpl/protocol-family.ts:365-379`, `src/mcpl/protocol-family.ts:452-478`; H `src/mcpl/protocol-family.ts:346-360`.

The sinks may share a generalized union helper with `everyServerRedactor`, but must request the **accepted-strict selector and strict membership supplier**. Existing calls retain the original default and original population. Calling the unchanged method directly is the wrong implementation.

### Gate and D-union

Let held membership include active configs, retained closed-tab configs, and configs held for still-protected removal/displacement/shutdown publications. Let U be the union of their accepted-strict tokens.

- The strict gate conceptually means a held config currently requests strict mode **or has accepted strict history**. Flag-off does not undo the second condition.
- An enabled strict config with no accepted token has an empty contribution. With U empty, use the original sink path: there is nothing to redact, and activating object withholding early would be an unnecessary new behavior.
- With U nonempty, every failure record/message sent to either sink uses one matcher over U, irrespective of the originating server, including non-strict servers and failures with no server attribution.
- Do **not** union all configs' current tokens/URLs/env or their legacy-only histories. D-union specifies whose failures are filtered and which accepted credentials are used; it does not authorize this broader population.
- “No strict config” for compatibility must mean no held strict history as well as no currently enabled config. Defining it only by today's boolean would contradict the binding flag-flip decision.

This keeps rejected provider candidates, pre-strict legacy captures and unrelated non-strict secrets outside the new matching scope. Existing default redactors may independently redact such values, as upstream already does.

### Projection and retirement

Keep the current descriptor-only projection for this conservative design, but change its input from registries to a shared `Redaction`. Remove its registry flattening, matcher construction and private matcher cache. Its job is now only safe formatting. Keep the detached Error adapter and original trace preparation separate. H `src/mcpl/protocol-family.ts:341-425`, `src/framework.ts:28312-28320`, `src/framework.ts:28478-28529`.

Document **all non-plain/non-array/non-Error values** as withheld, not merely objects with hooks. This addresses the misleading contract, not the loss of diagnostic data. Restoring native serialization instead is a separate OWNER choice discussed below; it is not required to consolidate credential storage.

Delete `strictOwners`, `strictTargets`, `CredentialLifetime`, `beginCredentialLifetime`, `endCredentialLifetime(s)`, `strictSinkRegistries` and their destructive calls. Remove reset-on-registration, retirement-on-connect-failure and retirement-on-final-close. Do not delete dial history on stop. H `src/mcpl/protocol-family.ts:282-335`, `src/mcpl/protocol-family.ts:442-451`; H `src/framework.ts:7361-7376`, `src/framework.ts:30300-30301`, `src/framework.ts:31115-31116`, `src/framework.ts:32103`.

**Snapshot/hold code remains necessary.** Replace the PR's stop-only snapshot/finally deletion with membership leases and a shutdown hold that survives failed cleanup. That code retains configs, not copies of credentials.

## 4. Ownership is not membership, and neither proves quiescence

| Concern | WeakMap gives | Explicit code still needed |
|---|---|---|
| Memory ownership | History becomes collectible when the config is unreachable; one framework cannot erase another's entry by simply dropping its own reference. | Avoid strong global config lists/caches; release operation snapshots and stale cache entries. A caller retaining a standalone config intentionally retains its history. |
| Membership in one framework's union | Nothing: WeakMaps are not enumerable and cannot decide who holds a config. | Enumerate active/closed-tab configs plus framework-owned temporary holds, deduplicated by identity. Removal from one framework must not affect another's membership. |
| Reconnect protection | Same config key naturally preserves history. | Keep membership during disconnected/retrying/failed-close states; don't equate `willReconnect === false` with config removal. |
| Shutdown and removal publications | Nothing about when async work has really stopped. | Acquire strong holds before abort/close callbacks, retain through post-removal publication, and preserve them when a wait times out or fails. |

Recommended rules:

1. **Registration is idempotent for the same object.** It joins membership; it does not reset history. Replacement transfers the displaced object to a retiring hold before overwriting the public map if any operation can still publish for it.
2. **Explicit disconnect acquires its publication hold before aborting/closing.** Keep it through config deletion, tool refresh, trace callbacks and resulting sink publication. Release only when the relevant publishing work settles; a timeout is not settlement of the underlying work.
3. **Stop acquires a union hold before invoking `stopOwned`**, including already-retiring operation configs and closed tabs. Continue reading live capture versions, not frozen token sets. Merge/retain this hold across retry attempts; do not replace it with a fresh snapshot that forgets earlier removed configs.
4. **Failed stop retains the hold conservatively** until successful retry/quiescence or framework collection. Existing map ownership and ongoing operation leases remain. Store closure alone is not proof that every publication obligation ended.
5. **Successful stop releases temporary shutdown holds only after final protected publications.** It does not erase WeakMap history or pretend configs still held in `mcplServerConfigs` ceased to exist. Such configs remain effective strict members if a caller invokes the sinks later. Removal after completed publication ends membership, not another owner's memory.
6. **Config lifetime means object identity for this design.** Re-adding the same object resumes its history; a genuinely new config object starts fresh. A closed tab keeps the same history. This deliberately differs from H's registration-scoped resets. See OWNER question 1 if registration generations are required instead.

A caller saving arbitrary old secret text and publishing it after the config has left all membership/operation holds is outside D-union. No bounded lifecycle scheme can identify that relationship from the string alone. Conversely, keeping every removed config forever merely to avoid specifying publication ownership would recreate a leak.

## 5. Cost and concrete caching

### Existing triggers

- `serverTextRedactor(config)` caches a matcher in its closure. It rebuilds on changed `dialsSent.version`; a failed config read withholds that call and retries later. New distinct URL/token insertion increments the version; duplicate recency changes do not. A plain mutation of token/env/URL alone does **not** invalidate an already-built closure. `redactServerText` creates a new closure each call. B/H `src/mcpl/protocol-family.ts:153-197`; B `src/mcpl/protocol-family.ts:303-317`, H `src/mcpl/protocol-family.ts:459-473`.
- `everyServerRedactor` has no compiled-matcher cache: it collects, encodes, sorts, deduplicates and constructs a regex on **every invocation**. B `src/framework.ts:31195-31210`; H `src/framework.ts:31252-31267`.
- H already caches strict registry arrays by identity/size and strict matchers by registry-array identity plus sizes. A new accepted token invalidates them; an unchanged logging call normally does **not** rebuild the regex. The review's wording should not be read as “rebuilds on every log.” H `src/mcpl/protocol-family.ts:319-361`.

Pattern generation expands raw/percent/form/JSON/slash forms. Regex construction sorts alternatives by length. Matching scans all overlapping matches and combines spans; it is not a constant-cost replacement. B `src/mcpl/protocol-family.ts:365-478`, `src/mcpl/protocol-family.ts:498-525`.

Hot paths include stderr/event lines, per-response tool errors, union-based tool failures/refresh errors, and—with this feature—every failure-log record and ops message/data projection. Plain data can contain many individual strings. H `src/framework.ts:32146-32149`, `src/mcpl/server-connection.ts:2659-2676`, `src/framework.ts:32522-32529`, `src/framework.ts:28332-28338`, `src/framework.ts:28478-28520`.

### Proposed cache

- Keep the compatibility-view version and cache behavior unchanged. Accepted-history growth outside the newest-16 view must not invalidate or enlarge existing trace/tool matchers.
- Store lazily derived accepted patterns per config, keyed by accepted-view version. Generate forms only for newly accepted distinct tokens where practical.
- Cache one union matcher per framework/active union view, keyed by the ordered or canonicalized vector of **config identities plus accepted-view versions**, including publication holds. Reuse it within a projection and between sink preparations when that key is unchanged. Revalidate at each publication boundary: trace delivery can call host callbacks between the log write and webhook preparation, so do not assume an entire ops call is free of reentrancy.
- A flag-off flip alone does not invalidate accepted patterns. A membership add/remove, provenance promotion of an existing token, or newly accepted distinct token does. Retention of an unaccepted legacy token need not rebuild the strict matcher.
- The selected accepted view reads captured strings, not mutable token/env/URL getters, so its version cache has a complete invalidation source. Do not “optimize” the default every-server redactor using dial version alone: it currently rereads mutable config fields on every invocation.
- Cache ownership must not prolong removed config membership: replace stale union caches on membership changes and retain an old cache only for the operation that still owns its snapshot. Fail closed for strict-view matcher-build failures rather than exporting raw text.

If C configs contribute K accepted tokens and total expanded pattern length is L, an unchanged union check is O(C), storage is at least O(L), and rebuild entails at least reading the patterns plus sorting/regex compilation. Matching cost depends on input length, alternatives and overlap density; do not claim a universal linear-time bound for this regex. Rebuilding the whole growing regex after every rotation can still produce roughly quadratic cumulative construction work over many rotations. Incremental pattern caching reduces encoding/allocation, not that fundamental monolithic-regex cost.

R9 forbids solving memory growth by an LRU/TTL. Use rotation-count/size telemetry without credential values and benchmark realistic/maximal histories. A trie/multi-pattern automaton or bounded matcher chunks with **global span merging** could reduce rebuild cost later, but sequential per-token replacement is incorrect for overlaps and is not part of this narrow change.

## 6. Findings disposition

**Input discrepancy:** the supplied review lists **five diff MEDIUM findings plus one non-diff MEDIUM**, not six diff MEDIUM plus one non-diff. All six actual MEDIUM findings and all three LOW findings are mapped below. No extra finding is invented.

| Supplied finding | Disposition under this design | Reason / required follow-through |
|---|---|---|
| MEDIUM: failed stop deletes strict lifetimes | **Gone structurally** | No destructive history retirement; failed-stop membership hold survives. Add retry and late-publication tests. H `src/framework.ts:4879-4884`. |
| MEDIUM: standalone strict dials retain credentials no sink reads | **Changes; residual cost remains** | The separate unused accepted set disappears. One config-owned history remains, required by R9; a retained standalone config can still consume unbounded memory without ever using a sink. WeakMap permits collection, not bounded memory for live objects. Dropping/capping standalone history would need an OWNER exception. H `src/mcpl/protocol-family.ts:443-451`. |
| MEDIUM: unbounded rotation/matcher cost on failure logging | **Remains, mitigated** | One shared versioned union cache prevents unchanged-call rebuilds; new unique rotations still grow storage, rebuild cost and matching work. H already has caching, so consolidation alone does not fix this. H `src/mcpl/protocol-family.ts:319-361`. |
| MEDIUM: no failed-stop retry/running-publication test | **Remains until tests are added** | Existing fixtures check exports during failed teardown, then assert retirement; they do not prove continuing protection between attempts and on retry. Some current assertions must reverse. H `test/fixtures/mcpl-strict-shutdown.mjs:77-84`, `test/fixtures/mcpl-strict-inflight-stop.mjs:77-91`. |
| MEDIUM: non-reconnecting close retires a still-registered config | **Gone structurally** | Close is not a membership-removal event; history is config-owned. H `src/framework.ts:32103`. Update tests that currently expect the leak after final close. H `test/fixtures/mcpl-strict-shutdown.mjs:57-74`. |
| Non-diff MEDIUM: all non-plain objects withheld | **Changes as documentation; behavior remains** | Conservative recommendation explicitly retains and accurately documents broad withholding. It does not claim to restore Date/URL/Buffer/Map/class diagnostics. If that tradeoff is unacceptable, choose OWNER question 2 before implementation. H `src/mcpl/protocol-family.ts:376`; `README.md:411-416`. |
| Requested additional diff MEDIUM | **Not supplied; cannot classify** | The verbatim review contains no sixth diff MEDIUM finding. |
| LOW: review/provenance text in user docs/tests | **Remains until editorial commit** | Replace review history with operational configuration, lifetime, output and cost documentation; remove runtime-comparison/provenance claims from API comments/changelog. Actual locations include H `README.md:362-427`, `src/mcpl/types.ts:324-327`, `changelog.d/strict-credential-mode.added.md:6-8`. |
| LOW: short-token error has extra suffix | **Remains until independent fix** | Route the 32-character refusal through `fail('credential-unusable')`; put length guidance in docs. Actual line is H `src/mcpl/transport.ts:731`, not 631. |
| LOW: open-timeout test consumes 15 seconds | **Remains until test fix** | Use controlled timers or a private timeout seam, keeping the production default 15,000 ms. Actual test is H `test/mcpl-strict-five-codes.test.ts:135-150`; timeout is H `src/mcpl/transport.ts:546`, `src/mcpl/transport.ts:757`. |

These are proposed dispositions, not claims that code/tests have been changed.

## 7. Output deltas

| Situation | Versus B | Versus H |
|---|---|---|
| Framework has never accepted/held strict history and has no effective strict member | **Byte-identical sink outputs and existing trace/tool-error behavior.** Keep the original branches, formatting, failure/throw behavior, cooldown, field precedence and bounds; no always-on redaction or object projection. | Same ordinary behavior; remove lifetime bookkeeping with no output role. Avoid carrying H's added setter admission guard into unrelated legacy behavior changes. |
| Strict config enabled, no accepted history yet | Empty union: original sink path, no gratuitous object withholding. | Matches H's lazy accepted-set activation. |
| Strict-active framework: failures.log and webhook | Every server's failure text is filtered against U; projection withholds exceptional/non-plain objects. Known accepted forms become `redacted`; Error values are projected before bounding. Upstream did not apply this boundary protection. | Ordinary strict-active formatting and supported encodings remain. Protection continues after flag-off, final close, failed initial connect, failed stop, and across same-object re-registration while ownership persists. Closed-tab membership is included. Earlier removed configs are protected during outstanding publication holds. |
| Strict-active framework: traces and tool errors | **No new sink/retention scope.** Existing default views remain at 16; no accepted-union projection is added to trace/tool outputs. Strict dial behavior itself differs from legacy by the already-proposed fail-closed codes. | Same trace/tool redaction population and bounded history. Keep H's separation of safe exports from legacy trace preparation. |
| Fully removed config, no remaining publication hold | Its history no longer contributes to that framework's sinks. Another held strict config can still keep the gate active. | Same membership principle, but removal is delayed until publication obligations actually end; history itself is not destroyed. |
| Same config object reused or framework retained after successful stop | Config-owned history persists; only explicit membership/temporary holds determine sink participation. | Unlike H, there is no empty-history reset on re-registration or stop. |

For fixed outer structural fields, keep H's exceptions, not indiscriminate redaction of the complete JSON envelope. The webhook's cooldown key and failed-post console logging remain out of scope. H `src/mcpl/protocol-family.ts:410-414`, `src/framework.ts:28333`, `src/framework.ts:28509-28525`.

The existing upstream default redactor may already have removed tokens before text reaches a sink; the new union does not undo that. Conversely, a token already fragmented by earlier truncation cannot necessarily be recognized at the sink. There is no new promise to recover arbitrary partial credentials or encodings outside the documented matching forms.

## 8. Estimated diff and reviewable commit plan

**Estimate, not measured implementation:** roughly **+330 to +500 net production lines versus B**, across four existing source files:

| Source anchor | Estimated net lines | Work |
|---|---:|---|
| B `src/mcpl/protocol-family.ts:291-318` | +150 to +225 | Unified indexed history, provenance/views, strict encoding option/cache, retained descriptor-only projection, strict config validation |
| B `src/framework.ts:28295-28306` | +75 to +150 | Two-sink plumbing, strict membership/publication holds, union cache, lifecycle integration |
| B `src/mcpl/transport.ts:596-647` | +95 to +110 | Retain H's strict dial path and validation; fixed-code correction |
| B `src/mcpl/types.ts:313` | +10 to +15 | Public option and precise operational contract |

The conservative projection remains substantial code: this is not a five-line simplification. For context, the measured H source diff is +357 net lines across those four files (framework +58, protocol-family +181, transport +103, types +15). Two documentation files and approximately 10–18 test/fixture files would also change; estimate +50–90 documentation lines and +700–1,200 test/fixture lines versus B, depending on reuse. They are excluded from the production estimate. No generated files, dependency changes or lockfile changes are expected.

Suggested commits, each carrying its own tests:

1. **Strict dial contract:** public option, admission, five codes/32-character floor, strict transport path; preserve the legacy branch. Include controlled timeout coverage and the short-token exact-message fix. No sink/lifetime claims yet.
2. **One history, two views:** indexed `dialsSent`, provenance, sticky retention, view selection, pattern/cache tests. Prove the default view still evicts at 17; strict view retains all; pre-flip entries are not promoted; identical-value strict promotion invalidates the strict cache. No sink routing yet.
3. **Framework membership/publication ownership:** strong temporary holds and shared union-builder/cache API. Test removal/displacement, closed tabs, in-flight handshake abort, failed stop/late publication/retry, shared config ownership and collection. Do not retire history on connection close. This infrastructure can land without changing sink output.
4. **Route the two sinks only:** consume the accepted-strict matcher, retain the descriptor projection without its credential registry, retain trace separation. Include real file/webhook tests for D-union, rotations, overlaps, encodings, flag flips, structural fields and no-strict byte comparisons. Remove H's parallel registry atomically if implementing this as a PR revision rather than replaying from B.
5. **User-facing documentation:** precise lifetime/membership semantics, broad object withholding, unbounded costs and narrow scope; remove review-process text. No claim that all diagnostics or arbitrary encodings are protected.

A boolean compatibility check alone is not enough: the acceptance tests must compare outputs and exceptions for no-strict hooks/objects, and separately prove that >16 strict rotations do **not** extend the default trace/tool-error view.

## 9. Explicit decisions and open questions

### OWNER

1. **Config lifetime identity:** recommended default is config-object lifetime, consistent with upstream's WeakMap. Same-object reuse resumes history; two frameworks sharing it can see the same captured history while each holds membership, including history captured before a later adoption. H instead creates owner-registration generations and resets on re-add. If those fresh-registration/isolation semantics are required, one store is still possible, but it needs capture sequence numbers and per-membership epoch/cutoff metadata; the simple object-lifetime design and estimate no longer apply unchanged. Do not silently preserve H's destructive resets.
2. **Object policy:** retain H's descriptor-only projection and document all non-plain withholding, as recommended here, or restore upstream native formatting? The latter removes the broad diagnostic-loss finding but allows getters/toJSON/coercion hooks to run and needs a serialize/describe-first, redact-before-bounding adapter—not `redactor(object)` or redaction of already-truncated JSON. Parsing/walking detached JSON avoids corrupting structural JSON; Error metadata must be redacted before its 128-character component bounds. Never feed the redacted copy into traces. This is a separate output/security decision, not a prerequisite for one credential store.
3. **Optional simplification that widens scope:** allow unbounded accepted history in default traces/tool errors? If yes, the 16-entry compatibility view for historically strict configs could be dropped, reducing code. This is expressly **not assumed**; it conflicts with narrow scope until authorized. Legacy-only configs would still keep 16.
4. **Optional broader sink population:** use all current config token/URL/env patterns while strict-active, rather than only accepted-strict tokens? That exceeds D-union's specified credential population; default answer is no.
5. **Standalone retention:** R9 plus narrow scope leaves live standalone configs retaining unbounded history without necessarily having a sink consumer. An exemption, retention cap, or new standalone diagnostic consumer would change an owner decision; none is silently introduced.

### MAINTAINER

1. **Strict-only versus always-on sink filtering:** recommend strict-only. Always applying the upstream redactor would alter no-strict output and needs an explicit exception to the binding compatibility decision, not a routine cleanup.
2. Prefer a private test timeout seam or controlled timers for the open-timeout test? Keep the public/default timeout unchanged.
3. What realistic rotation counts/token sizes should define the performance benchmark and warning thresholds? Do not choose a retention cap under the guise of caching.
4. The review supplied five diff MEDIUM findings, not six. Supply the missing finding if a ten-finding substantive mapping was intended; the extra requested row cannot be reconstructed from source evidence.

## Verification Gates

No build/full-suite gate was assigned for this read-only design. No dependencies were installed and no repository build was attempted. The local environment has Node 22.23.3; the repository dependency/build outputs needed for full framework integration were absent.

Commands executed:

- `git rev-parse HEAD`: matched H.
- `git diff --stat e85c57db 0fdee5bc` and `git diff --numstat e85c57db 0fdee5bc -- src`: inspected scope and measured source delta.
- `git show <revision>:<file> | nl -ba` with targeted ranges, plus targeted searches: traced source at both commits.
- `git diff --quiet e85c57db 0fdee5bc -- src/mcpl/server-registry.ts src/mcpl/server-connection.ts`: exit 0; lifecycle implementations identical.
- In external scratch space: `SCRATCH="$SCRATCH" python3 "$SCRATCH/extract.py"`, then `node --experimental-strip-types --disable-warning=ExperimentalWarning probe.mts`, the same command with `cache.mts`, `stop.mts`, and `hooks.mts`.
- `git status --porcelain=v1`, `git diff --exit-code`, `git diff --cached --exit-code`: clean/no tracked changes.

The scratch extractor reads committed source with `git show`; it extracts the actual protocol functions, formatting helpers, sink methods and every-server method, stripping TypeScript at execution. File output is real scratch JSONL; webhook fetch and trace delivery are stubs. A separate probe executes H's actual stop method with a controlled rejecting teardown. This is **production-method evidence in a reduced harness**, not a full framework/real-network shutdown integration run and not a test of unimplemented proposed code. An initial scratch extraction included a dangling comment and failed parsing; correcting the extraction boundary made the probes pass. That was a harness error, not a product failure.

Results:

- Native Date/URL/Buffer/Map/class/Error formats matched the table above.
- Getter/toJSON fields executed during base JSON formatting; conversion hooks executed during base String formatting. H's projection withheld these cases without invoking those hooks.
- Both B and H ordinary redactors evicted the first token after 17 distinct dials; H's separate strict projection still redacted it.
- A saved every-server closure redacted a removed config's token; a new closure did not.
- An existing per-server cached closure missed a static-token mutation without a new dial; a fresh closure saw it.
- Mixed literal/ASCII-unicode escapes were missed by B's patterns and recognized by H's strict matcher.
- Actual extracted sink methods wrote unredacted base log/webhook content versus redacted H content; H withheld a Date field while leaving the ops trace message unredacted.
- Matcher construction counts: every-server two calls = two builds; per-server two calls = one build, new dial = one more; H strict two unchanged calls = one build, rotation = one more.
- H's actual failed-stop method erased accepted sink history, kept its config map entry, cleared its retryable stop promise, and allowed a second stop attempt.
- A targeted Error-message getter was not invoked by H's projection; a proxy own-key trap was invoked once, confirming the reflection caveat.

All final scratch assertions passed. Small extraction/probe scripts and successful transcripts accompany this report as evidence. No gate receipts are claimed for these unwrapped investigative probes.

## Unmet Criteria

- No implementation was requested or performed; production behavior remains H. Proposed fixes and test additions are not completed fixes.
- The requested extra diff MEDIUM finding was not present in the supplied review. All supplied findings are covered; inventing another would be misleading.
- Full framework/network lifecycle integration and performance validation of the proposed design remain implementation-stage work. No binding decision was dropped to make the design appear smaller.

## Residual Risk

Unbounded retention and growing matcher cost remain inherent under R9. Correct publication-hold release needs integration tests for timeout, late callbacks, removal and retry; a stop promise alone is not a quiescence proof. The recommended conservative projection still discards useful non-plain diagnostics. Object-lifetime sharing/reuse differs from H and must be explicit in documentation. The scope does not protect unrelated traces, console logs, arbitrary encodings, prior truncation fragments or publications after all relevant ownership has ended.
