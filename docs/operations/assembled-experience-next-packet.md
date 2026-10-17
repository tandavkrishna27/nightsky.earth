# Assembled API experience: next acceptance packet

Prepared 17 October 2026 against `627c376`. This is a reviewable plan, not an executed model run. No installation, model inference, live provider request, download, deployment or publication is performed by this packet.

## Evidence and version boundary

The [assembled integration](parallel-completion-run-20261017.md) builds local rehearsal package **1.0.14**, with fourteen tools and five canonical skills. It is not installed. The latest recorded persistent local installation is **1.0.12** in the [native validation record](complete-model-journey-validation.md#photography-timing-follow-up--15-october-2026-local-package-1012). Its Codex photography pass cannot validate the new API assembly. Confirm the actual host version and endpoint when execution is authorized; a source/package version is not an installed-host version.

Earlier Codex prompt-fed twenty-case reviews, native-host selected checks and native Claude loading evidence remain useful historical evidence. They do not establish automatic skill discovery, a fresh API matrix or complete semantic acceptance. Preserve the original failures and corrections. In particular, the nested Codex CLI cached-skill read was **blocked by policy**. Do not retry that rejected read through another command, change security policy, or use prompt injection as native proof. Later normal Codex-host reads were separately observed and did not erase that gate. Claude retesting remains owner-deferred; its latest first-photo finding is not cleared by the 1.0.12 Codex result.

## Existing preparation and execution interfaces

Run commands from the repository root. The following are existing offline interfaces; they are listed for the acceptance operator, not executed here:

```sh
node --import tsx --test tests/platforms/api-model-harness.test.ts tests/operations/api-review-cases.test.ts
node --import tsx scripts/verify-review-cases.ts --offline --api-fixture --out dist/api-review-rehearsal
node --import tsx scripts/build-local-plugin-package.ts --host codex --endpoint http://127.0.0.1:8765/mcp --out dist/local-plugin-rehearsal/codex
```

The endpoint above is an explicit local example, not a running listener. Package building requires unique `--host` and `--endpoint` pairs, accepts optional `--out`, and writes a ZIP plus `package-report.json`; it does not install or start a server. `--host claude` builds its projection without authorizing Claude inference.

The [complete runner](../../scripts/complete-model-journey-test.ts) has **no prepare-only CLI**: omitting `--run` rejects execution. Its exported fixture/package helpers are exercised by offline tests. `--api-fixture` selects synthetic API responses through real selection/discovery/planning services; omission selects legacy catalogue fixtures. Neither is live API acceptance. Unexpected fixture destinations never fall back to live providers. The synthetic clock advances independently of model waiting and cannot measure live pacing/cache latency.

For a later authorized model rehearsal, the existing invocation shape is:

```sh
node --import tsx scripts/complete-model-journey-test.ts --run --api-fixture --preflight --cases casual
```

This is the native-requested Codex CLI path and **must not be used to work around the recorded nested-CLI policy gate**. Prefer a separately authorized normal Codex-host session with legitimate native capabilities and observable installed package loading. Establish its fixture endpoint/package binding first. The runner creates task-only marketplace/configuration files; that alone is not verified installation or native skill execution.

Supported options are `--run`, `--api-fixture`, `--preflight`, `--cases <unique,comma-separated,known IDs>`, `--resume <existing task folder>`, `--prompt-fed`, and `--claude`. Default client is Codex, default loading request native. `--prompt-fed` is explicitly weaker evidence, never a substitute native pass. `--preflight` selects the first requested case in canonical matrix order, not necessarily the first ID typed. Remove it for the remaining batch. Resume paths resolve against the invocation directory and must stay inside `.superpowers/sdd/2026-10-15-nightsky-global-discovery/model-rehearsal`; API and catalogue records cannot mix. After manual review, only accepted records are marked `passed`; transport initially produces `manual-review` or `blocked`.

Retain caps: twelve MCP calls/case; 120 seconds plus five seconds shutdown; 250 KiB stdout, 32 KiB stderr; at most twenty cases and thirty minutes/client batch. Permit at most one diagnostic retry after a concrete correction, retain both records, and stop on missing answer, breached cap, failed loading or unconfirmed cleanup. CLI success alone never means semantic pass.

## Fifteen product journeys mapped to twenty harness cases

The [product matrix](../product-scope-v1-v3.md#journey-to-tool-data-and-acceptance-matrix) contains fifteen journeys. The harness adds five discovery/host/boundary probes; these are not five new product tickets. Eight scripted review cases are a third, separate server-assertion set and must not be added to model pass counts.

| Product journey | Harness ID | Required answer review |
| --- | --- | --- |
| Casual sky gazer | `casual` | Useful supported targets/window, local times, provenance and links |
| Curious beginner | `learner` | Correct explanation and practical next step; no invented visibility |
| Family/educator | `family` | Short timed plan; no safety/access certification from POI tags |
| Urban observer | `urban` | Bright-target geometry; no raw-radiance visibility promise |
| Meteor watcher | `meteor` | Selected shower/window, darkness/Moon/conditions/radiant where supported; explicit gaps |
| Milky Way photographer | `milky-way` | Supported core model, individual factors, honest twilight/foreground limits |
| First photograph | `first-photo` | Gear-qualified starting guidance; exclusive twilight phases and source links |
| Visual telescope observer | `telescope` | Target order/window; no invented seeing or setup bearing |
| Deep-sky imager | `deep-sky` | Supported catalog comparison or explicit missing target/gear evidence |
| Planet/Moon observer | `moon` | Calculated geometry/local window; unknown haze/horizon/seeing |
| Aurora chaser | `aurora` | Activity separate from visibility; honest unavailable outlook/provenance |
| Eclipse/event observer | `eclipse` | Local circumstances only when supported; authoritative solar safety |
| Months-ahead traveler | `long-ahead` | History distinct from forecast; no invented baseline/provider or future weather |
| Changed-forecast replan | `replan` | Issue-time/value change and uncertainty; persistent context remains a separate check |
| Mobility/access needs | `access` | Sourced facts/unknowns; selected site distinguished from city center |
| Additional region probe | `intersection` | Origin/country/state intersection or explicit supported limitation |
| Additional comparison probe | `multi-origin` | Both origins, limits/exclusions, partial coverage and comparison |
| Additional selected-site probe | `selected` | Site identity/revision, source timezone, plan and revision at exact selected point |
| Additional host probe | `host-boundary` | Ask for place when host supplies none; no inferred location/installed coverage |
| Additional capability probe | `unsupported-boundary` | Honest GPS/routing/reminder limits; no claimed action |

## Acceptance sequence and owners

1. **Integration operator:** freeze source revision and generated package hash; record fourteen-tool/five-skill inventory, API mode, endpoint, fixture provenance and external-attempt counters. Review the eight API scripted assertions and fixture failures for ambiguity, missing timezone, stale revision, expiry, unavailable providers and conflicting records. Those adverse fixtures are not twenty additional model prompts.
2. **Owner and host operator:** authorize the concrete native Codex session/package refresh when ready, using supported installation and normal host capabilities. Record actual installed version and fresh session. Observe complete packaged skill/reference loading and native tool calls for one preflight. If policy prevents it, retain the block and stop that path; do not weaken controls. Automatic discovery requires its own unprompted observation, because deliberate skill invocation only proves explicit loading.
3. **Independent answer reviewer:** inspect complete preflight answer, tool arguments/results, source links, local timezone conversions, unavailable/partial wording and provenance. Approve semantic evidence before continuing. The aggregate planner already includes astronomy/conditions; do not revive obsolete requirements to repeat every constituent call.
4. **Host operator and reviewer:** complete the fifteen mapped journeys plus five probes under the existing caps. Retain full sanitized answers/traces and separate loading/transport/semantic verdicts. Fail unsupported Moon timing, sampled bearings treated as setup directions, invented history/provider failures, forecast extrapolation, or silently dropped source links. Review API source revisions through conditions/events/comparison and selected-site replanning.
5. **Owner:** ask at least one actual desired outing question with explicit named destination, date/window and timezone, then follow up to change goal or forecast. Confirm usefulness and that the host preserves conversational context; a within-turn/context-fed harness replan is insufficient proof of retained conversation. Use synthetic/offline evidence unless a separately bounded live packet is authorized. Record requested improvements and their disposition.
6. **Integration/release reviewer:** fix material findings, rerun affected checks only, preserve originals, reconcile original criteria, review sources/security/privacy and freeze package with exact-commit CI evidence. Keep actual-source measurement, history admission/baseline, geometry admission and hosted/client/publication gates separate. Original counts remain **12 Done / 9 Partial / 6 Not started**. Claude remains deferred until the owner explicitly resumes it.

## Event acceptance: useful partial plans versus unsupported claims

Use the [supported event matrix](API-EVENTS-SUPPORTED-MATRIX.md) as the field-level authority. All nineteen meteor identities remain: 38 retained NASA maxima (13 for 2025, 13 for 2026, 12 for 2027), eighteen verbal rows, five qualified civil rows and zero complete UTC activity seasons. Twelve GMN models provide bounded geometry within nominal solar-longitude domains and engineering years 2018–2030, with extrapolation disclosed. Civil 2026 maximum wording must not recur as a precise 2027 event. ETA/ORI longitude-to-date conversion and full activity overlap remain unavailable.

A selected-session meteor answer may still compare supported darkness, Moon and independent forecasts, add timestamped radiant samples where available, and give source-qualified preparation/context. Missing peak means no peak-optimized claim; missing radiant geometry stays unknown. Missing evidence is not no physical activity. DRA/URS civil guidance now reaches selected-plan formatting. Full-season recommendations, continuous visibility, precise best peaks in missing cells and guaranteed counts remain unsupported. These limits do not block every ordinary stargazing, photography or concept-only learning answer.

Lunar phases, seasonal markers and eclipses retain their pinned calculations and safety sources; terrain/cloud/detectability remain separate. Solar alignments and Mercury/Venus greatest elongations use different definitions within 1900–2100; Venus-morning independent angle evidence remains open and an instant is not viewing duration. Planet-pair conjunctions are a partial 21-pair RA-of-date crossing screen for 2025–2027 with bounded point samples, not certified completeness, closest approach or continuous visibility. Occultations, live comet/asteroid lookup, satellites and seeing/transparency need explicit unsupported/conditional responses or specialist handoffs. Gear settings remain conversational guidance, not a new planner calculation.

This packet closes preparation only. S4 native/owner acceptance and ticket 6 disposition require their recorded evidence and owners; package generation or previous passing fixtures cannot close them.
