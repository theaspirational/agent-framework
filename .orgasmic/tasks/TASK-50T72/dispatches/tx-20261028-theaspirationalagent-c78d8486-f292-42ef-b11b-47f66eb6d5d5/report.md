# Changed

Commit: `0fdee5bc0c15a1ece95f441cca3a3b9842e1f78e`, locally on the assigned branch; no push. Author/committer: Vasyl Dovhanchyn <48733736+theaspirational@users.noreply.github.com>.

- Reproduced the review's accepted-but-uncompleted handshake leak on `b4089505` before editing production.
- `src/framework.ts:3903,4870,4882–4883` captures the shutdown's config set before aborting work, and releases it only at the shutdown-finally boundary, alongside bulk lifetime retirement.
- `src/framework.ts:7363` centralizes ordinary retirement. Failed connects (`30301`), displaced configurations (`7375`), removals (`31116`) and final close callbacks (`32103`) defer retirement while that shutdown snapshot exists. Outside shutdown, these paths still retire immediately.
- Both protected sinks consult the snapshot during shutdown (`src/framework.ts:28332,28478`). Thus an admitted disconnect can still remove its public config entry without removing the credential from the sink inputs. Config registration refuses after stop starts (`7371`), preventing registration from resetting a shutdown-owned lifetime.
- Added `test/fixtures/mcpl-strict-inflight-stop.mjs` and its compiled-layout wrapper `test/mcpl-strict-inflight-stop.test.ts`. A real WebSocket peer verifies the header and receives `initialize`, then withholds its reply. The fixture checks double-stop promise identity, success/rejection of module shutdown, both exported sinks, and final retirement/snapshot release. Two additional cases race an admitted disconnect against stop and prove the public config is actually removed before publication. The outside-stop control rejects initialization normally and verifies immediate retirement while the config stays registered.
- The existing changelog fragment (`changelog.d/strict-credential-mode.added.md:14`) now explicitly covers in-flight handshakes and concurrent removal. Engine capability checks, boolean validation, test packaging infrastructure, protocol registries/cache, and external comparison tooling are unchanged.

**Production delta over b4089505: +19 / −7 = net +12 lines**, only `src/framework.ts`; below the +60 limit. No other production file changed. Baseline/contributing instructions remain applicable; supplied conventions/gotchas were absent.

## Retirement/configuration-removal audit

The source audit found one public-config map initializer, one setter/replacement site, one deletion site, and no clear/reassignment path. All individual framework retirement now goes through the helper; only shutdown-finally calls the bulk retirement directly. Evidence: `retirement-audit-source.txt`, `production.patch`.

| Path and final source lines | Decision |
|---|---|
| `src/framework.ts:3900,4870,4882–4883` — map initialization, stop capture, final cleanup | Empty initialization has no credential. Capture membership before any abort/teardown; finally retires all owner lifetimes and drops the snapshot on success or rejection. Double stop returns the existing promise without replacing its snapshot. |
| `src/framework.ts:4938–4950,5024,5198,5314–5326` — stopOwned abort, admitted-operation wait, server/module shutdown | Abort can reject a connect before module teardown. It must not retire credentials. Operator completion and parallel shutdown still run in the original order; final cleanup remains the sole shutdown retirement boundary. Reference-address forgetting is not a credential/config-map deletion. |
| `src/framework.ts:7363–7376` — lifetime begin, same-object registration, replacement/displacement | Setter now refuses registration after stop begins, before begin can reset a lifetime. Displacement uses the deferred-retirement helper. The normal setter still creates a fresh lifetime and replaces the public entry outside shutdown. |
| `src/framework.ts:28952,30129,30189` — startup pre-registration and runtime admission/registration | Both setter callers use the guarded setter. Runtime admission already refuses stopping/stopped frameworks. No new registration can reset a shutdown-owned lifetime. |
| `src/framework.ts:30299–30317` — rejected/aborted addServer | Defer retirement during shutdown; no config-map removal here. Without shutdown, a non-retrying failure retires immediately, retaining the same disconnected public config as before. Covered by the real outside-stop control and existing lifetime-GC tests. |
| `src/framework.ts:30324–30343` — handshake finishes after stop/displacement | Registry removal closes the connection, not the public config. Its lifetime remains available to the shutdown snapshot and finally. |
| `src/framework.ts:29810,29829,30605,30792` — failed setup / initial or post-manifest policy closes | These converge on registry closeServer, not config deletion. Any final-close callback uses the retirement helper. No extra early retirement site. |
| `src/framework.ts:31070,31081,31116–31117` — runDisconnect/removeServer | Transport removals retain their existing semantics. The only public-config deletion remains allowed; retirement is deferred and the captured config remains a sink input. The disconnect-success/failure regression cases assert the public map entry is absent during the module alert. |
| `src/framework.ts:32103` — final close callback | Non-reconnecting close uses the common retirement helper. Automatic reconnect retains history as before; shutdown defers final-close retirement. |
| `src/framework.ts:4624,29222,29940–29954` — initial closed tabs, close-to-tab and reopen | Initial placeholders have no accepted dial. Close-to-tab delegates to the audited disconnect path, then stores a placeholder; during stop, the separate snapshot remains available. Reopen goes through stop admission and the guarded config setter. |
| `src/framework.ts:30975,30984,31010` — closed-tab removal/restoration around connect | Only changes the closed-tab placeholder map, not active sink ownership. Connect failure uses the audited catch; success has stop checks before removing the placeholder. |
| `src/framework.ts:31035–31045` — permanent removal of an already-closed tab | Stop admission is checked before this synchronous path. With no public config, the already-closed placeholder has no live strict lifetime to retire. Otherwise removal delegates to runDisconnect. |
| `src/framework.ts:31220–31230` — restart/closed-tab cleanup | Restart delegates to the audited disconnect and guarded connect paths. Placeholder deletion does not remove the shutdown snapshot. A stop between disconnect and reconnect refuses the reconnect. |
| `src/mcpl/server-registry.ts:85–89,105–113,182–207` — registry auto-remove, removeServer, closeAll, closeServer | These remove the connection registry's entries, not framework config-map entries or credentials. Framework callbacks/helper and shutdown-finally control credential retirement. No changes needed here. |
| `src/framework.ts:29290–29297` — modern connection teardown | Removes the modern connection map only. Strict credential mode is legacy-WebSocket-only; this path does not remove the captured framework config or directly retire a credential. |
| `src/mcpl/protocol-family.ts:289–315,442–450` — begin/reset, end, bulk end and standalone fallback | Unchanged. Framework begin is now guarded; individual framework end is centralized. Deferred lifetimes retain live targets, so an existing framework-owned dial does not fall back to a self-owned lifetime during shutdown. Bulk end runs only at finally. Direct standalone ownership is not a framework removal path. |

## Red → green evidence

- **Red**, production still exactly `b4089505`, with only the new test/fixture added: `orgasmic dispatch gate inflight-red -- node --test dist/test/mcpl-strict-inflight-stop.test.js`: **1 pass / 4 fail / 0 skip**. Each shutdown variant reports `{ failuresLogLeaks: true, webhookLeaks: true }`; the outside-stop control passes. `inflight-red-launch.log` links `gate-inflight-red-01M60XA9A7SSQG1DHHF8V8XC1T.log`. The dirty receipt is expected for a newly added failing regression, not reused as a final gate.
- **Green**, final commit: the new five cases pass, both alone on Node 22.12.0 and with the existing shutdown/lifetime-GC suite on Node 22.23.3 (**12 pass / 0 fail / 0 skip**). The successful and rejected shutdown cases both wait for socket closure, publish through the real public alert API, check both sinks, and verify final retirement. A precommit 12-pass iteration is separately retained as `inflight-green-launch.log`, not counted as a final receipt.

# Verification Gates

All gates below were freshly run through `orgasmic dispatch gate` at the clean final commit. No earlier gate pass is implied or reused. The Node matrix uses separate `git archive HEAD` source/build layouts under ignored `dist/`, avoiding the known fixed-directory interference from running different engines in one layout. Both use the same installed public dependencies and `AF_TEST_CONCURRENCY=4`. Preparation and exact commands: `prepare-round2-layouts.sh`, `run-round2-node.sh`.

| Gate / engine | Result | Receipt log |
|---|---|---|
| build | PASS | `gate-build-01M60XGQM0NY3J1XP27WWMEPM4.log` |
| typecheck | PASS | `gate-typecheck-01M60XGRR6R3F41D8EA0AADQ0Q.log` |
| isolated layout builds | PASS | `gate-isolated-builds-01M60XJ7P5JFT0254B23PBFFW9.log` |
| full npm test — Node 22.12.0 | PASS: 8,885 pass, 0 fail, 63 skip | `gate-test-node2212-01M60XKDHKASC19QQWC1KS0E2D.log` |
| full npm test — Node 22.23.3 | PASS: 8,885 pass, 0 fail, 63 skip | `gate-test-node2223-01M60XKENYAZHXJEPY9YJDHVKW.log` |
| strict — Bun 1.4.0 | PASS: 143 pass, 0 fail, 1 existing skip | `gate-strict-bun140-01M60XK08Y1YFS8DMXHQRS5VT9.log` |
| strict — Bun 1.4.3 | PASS: 143 pass, 0 fail, 1 existing skip | `gate-strict-bun143-01M60XJ8VMZPJX4YPWW5ACDV1G.log` |
| in-flight + shutdown + lifetime-GC — Node 22.23.3 | PASS: 12 pass, 0 fail, 0 skip | `gate-inflight-regression-01M60XGS576S87TEWJTKVVEGJB.log` |
| in-flight regression — Node 22.12.0 | PASS: 5 pass, 0 fail, 0 skip | `gate-inflight-floor-01M60XMT072TK0AXZB3QASFDZQ.log` |
| base comparison — committed mode | PASS: 12 legacy comparisons + 2 mixed comparisons | `gate-base-comparison-01M60XKRJSFQYKF06S072YK7BA.log` |

Both full suites report 8,948 tests across 443 suites. There are no failing tests to classify as base-shared. The unchanged Bun malformed-frame case accounts for its single skip. Fresh comparison results: `comparison/committed-legacy-hashes.json` and `comparison/mixed-hashes.json`.

Commands, with `$ENGINE_BIN`, `$BUN140`, `$EVIDENCE` and `$SCRATCH` denoting the installed engine directory, installed Bun executable, this round's evidence directory and external scratch directory:

```sh
orgasmic dispatch gate build -- npm run build
orgasmic dispatch gate typecheck -- npm run typecheck
orgasmic dispatch gate test-$ENGINE -- env PATH="$ENGINE_BIN:$PATH" AF_TEST_CONCURRENCY=4 bash -c 'cd "$1"; node --version; npm test' bash "dist/round2-$ENGINE"
orgasmic dispatch gate strict-bun143 -- bash -c 'bun-1.4.3 test --timeout 60000 ./dist/test/mcpl-strict*.test.js'
orgasmic dispatch gate strict-bun140 -- bash -c '$BUN140 test --timeout 60000 ./dist/test/mcpl-strict*.test.js'
orgasmic dispatch gate inflight-regression -- node --test dist/test/mcpl-strict-inflight-stop.test.js dist/test/mcpl-strict-shutdown.test.js dist/test/mcpl-strict-lifetime-gc.test.js
orgasmic dispatch gate inflight-floor -- "$ENGINE_BIN/node" --test dist/test/mcpl-strict-inflight-stop.test.js
orgasmic dispatch gate base-comparison -- env COMPARE_ROOT="$PWD" COMPARE_HARNESS="$EVIDENCE/comparison" COMPARE_WORK="$SCRATCH" P2_EVIDENCE="$EVIDENCE/comparison" bash "$EVIDENCE/comparison/mcpl-narrow-verify.sh" committed
```

The committed-mode comparison remains upstream base `e85c57db` versus current production on Node 22.23.3 and Bun 1.4.3: omitted/false/null flags, wire and eight production sinks, plus mixed-set comparisons. Harness copies and fresh committed receipts stay outside the repository under `comparison/`; no comparison artifacts were reintroduced into the suite.

### Inherited evidence and unchanged inputs

- Reused the previously official/checksum-verified Node 22.12.0 and Bun 1.4.0 installations, plus the supplied Node 22.23.3 and Bun 1.4.3. Original verification is copied to `inherited/engine-checksums.log`. This round rehashed the downloaded archives and verified the executed binaries byte-for-byte against their archive members (`inherited/archives-rechecked.sha256`, `inherited/engine-binaries-rechecked.txt`).
- Dependency installation is unchanged: public npm registry, empty user/global config, `--ignore-scripts --package-lock=false`. The original install receipt is copied to `inherited/install.log`. No dependency/lockfile change or new installation was needed.
- The external comparison harness is inherited unchanged, but its committed-mode execution and results are fresh. Earlier build/full-suite/Bun passes and reviewer claims were not used as proof of this fix. The HIGH finding was independently reproduced against current source before editing.
- Earlier project-baseline and contributing-instruction reads remain applicable; no changed conventions/gotchas were supplied. Source audit conclusions above are fresh.

# Unmet Criteria

None for the narrowed round-2 assignment. The fix, all retirement/removal-path audit, red-to-green real-handshake coverage, production limit, local commit and named fresh gates are complete. Existing skips are reported above; none of the new regression cases skip.

# Residual Risk

- Default shutdown has no deadline: a genuinely never-settling shutdown keeps its credential lifetimes and snapshot until it settles. An explicit shutdown timeout can end that boundary while underlying cleanup continues; later publications after that boundary are not claimed protected by this change. No unconditional bounded-retention claim is made.
- Bun retains the existing malformed-frame test skip; the new in-flight cases do not skip. Linux verification only. Node 24/latest, macOS and unrelated upstream jobs were not rerun in this narrowed round.
- The original two-sink-only scope, cross-server over-redaction and per-lifetime credential history remain unchanged; this is not a broader diagnostic-redaction or rollout guarantee.
