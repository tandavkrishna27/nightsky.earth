# Complete local model rehearsal

Scope: installed Codex CLI and Claude Code against loopback NightSky with synthetic fixtures. This does not validate ChatGPT web, Claude chat, Gemini, public marketplace publication, real weather or visibility accuracy.

The offline contracts live in `tests/platforms/complete-model-harness.test.ts`; importing the harness has no model/server side effects. Real execution requires `--run`. The runner creates a unique ignored task folder, starts a loopback synthetic catalogue/provider backend and materializes both complete packages. The shared matrix has the fifteen existing product journeys and five discovery/host/boundary cases. Answers require manual review; a successful tool transport alone is not a semantic pass.

Authorized operators can use `node --import tsx scripts/complete-model-journey-test.ts --run --preflight` for the native-requested Codex preflight, add `--claude` for Claude, or add `--prompt-fed` for explicitly labelled fallback. After full-answer review, mark a successful preflight record `passed` before continuing with `--resume <existing task folder>`. Relative resume paths resolve against the invocation directory and must stay inside the task evidence base. No real-model run belongs in ordinary `npm test`.

Each case allows 120 seconds plus 5 seconds for process-tree shutdown, twelve MCP calls, 250 KiB stdout and 32 KiB sanitized stderr. Clients run sequentially; twenty cases or thirty minutes per client batch. Checkpoints retain complete synthetic answers and traces in an ignored task folder. Resume skips cases explicitly marked passed. A failing case may receive one diagnostic retry after a concrete correction. Unconfirmed process cleanup ends the batch.

Native Claude loading uses session-only `--plugin-dir`, strict MCP configuration, read-only skill/reference tools and disabled hooks; `--bare` is excluded because current local help says it disables OAuth. Existing authentication must be exercised privately without reading/copying tokens, global settings or account identity. No authentication setup is permitted.

Codex current local help exposes local `plugin marketplace add` and `plugin add`, but no session-only `--plugin-dir`. Native proof requires a verified task-only marketplace/install and observed packaged skill loading. Until that is demonstrated, the command builder fails closed for native mode. Explicit skill-content injection is labelled `prompt-fed`, never native success. A package inventory or loopback MCP call does not demonstrate skill loading.

Before model requests: assemble and validate both complete local packages; start one loopback backend with injected synthetic cities, candidates, administrative and forecast fixtures and provider functions that reject/count external attempts; inspect fourteen tools; run one skill plus tool preflight per client; inspect the whole answer and loading evidence before remaining cases. Record client/model version without account identity. A missing authentication or loading capability is a gate, not a passed case.

Primary documentation checked on 2026-10-15: [OpenAI package documentation](https://developers.openai.com/plugins/build/plugins), [Claude plugin documentation](https://code.claude.com/docs/en/plugins). Local help confirms the flags described above. Root approval of the assembled package is required before this rehearsal sends real model requests.

Offline TDD evidence: missing implementation exports observed red before implementation; nine focused contracts now green, including relative checkpoint resume regression, actual thirteenth HTTP call rejection and corrected empty-provider synthetic source identity. The source assertion first failed with the neutral provider fallback, then passed after the fixture supplied `WeatherProviderResult.source`. No real model requests occurred during those tests.

Dated local rehearsal findings and whole-answer reviews are in ignored `.superpowers/sdd/2026-10-15-nightsky-global-discovery/model-rehearsal/complete-model-report.md` and its checkpoint/review files. Raw answers, traces and client logs remain ignored; none belong in Git.

## Observed results, 2026-10-15

Codex CLI 0.154.0 completed the twenty shared questions using explicitly prompt-fed complete package content. All twenty whole answers and chosen arguments were manually reviewed. Seventeen cases made 77 local MCP calls; three valid clarification/boundary answers used no tools. Total case duration was 457,983 ms, maximum case duration 33,859 ms. There were zero external provider attempts and no deadline, byte or MCP call limit breaches. CLI JSON did not expose the inference model identity; the client default was requested without inspecting global configuration.

| Evidence | Result and limit |
|---|---|
| Initial twenty-case semantic review | Fourteen normal/boundary passes, four valid clarification passes, one current-forecast replan proxy, one attribution finding. No claim of twenty native skill passes. |
| Weather attribution correction | Empty custom-provider output had incorrectly identified MET Norway. The provider source contract and synthetic fixture were corrected; one fresh long-ahead diagnostic retry passed with explicitly synthetic source, unavailable future forecast and failed historical retrieval. Original finding retained. |
| Concrete advanced supplements | Both origins with minimum/maximum distance and state exclusion returned the correct empty partial result. Selected park plans retained actual site ID/revision and explicit display timezone, then revised to Moon viewing. Prior-answer context replan compared 12% to 85% cloud and 12:00Z to 15:00Z issue, preserving unknowns. These are within-turn/context-fed evidence; retained client conversation memory remains untested. |
| Codex native installation | A unique task-only local marketplace/install/list confirmed installed/enabled version 1.0.0. A whole-table override corrected one command-only quoted-key error. Installation is proven separately from skill execution. |
| Codex native skill read | After session-only read capability was enabled under read-only sandbox with exact package-file restrictions, the requested cached SKILL.md `Get-Content -LiteralPath` was rejected as **blocked by policy**. No file command executed and no MCP call followed. Native skill execution and remaining native skill probes are pending; policy was not bypassed. |
| Claude Code 2.1.126 | Native initialization lists all five namespaced NightSky skills and connected fourteen-tool MCP. Inference returns `authentication_failed` / “Not logged in”; model journeys remain pending user sign-in. No auth files, keys or account setup were accessed. |

Only the task-created Codex plugin and marketplace were removed successfully after preserving evidence. All model children and loopback servers ended. One accidental extra casual invocation caused by the original relative resume resolver was transparently retained, its process tree stopped, and the resolver regression fixed; the corrected batch skipped the passed preflight. No deployment, upload, remote source clone or publication occurred. These local CLI results do not validate ChatGPT web, Claude chat, Gemini, host-location integration or real forecast/visibility accuracy.

## Owner-authorized native setup follow-up, 15 October 2026

A separate persistent local test installation is now prepared in the ignored local-session folder. Codex CLI confirms `nightsky@nightsky-local-20261015` installed/enabled, and Claude Code installs the same named plugin at local project scope. The standalone offline listener exposes fourteen tools, resolves retained Hanle coordinates and is limited to loopback, 3,000 requests and two hours. Real weather/history/aurora feeds and real-site candidate coverage remain absent; no source retrieval or public deployment is implied.

Actual Claude Code 2.1.126 validation rejected the generated `displayName` field, although newer official documentation accepts it. Two regression tests observed this incompatible projection and its validator gap failing before correction. Version 1.0.1 omits that optional field only in Claude's projection, retaining portable Codex UI metadata. The patch version lets the supported updater replace the already installed stale 1.0.0 cache. Validation of the actual installed 1.0.1 Claude package passes with only the disclosed missing-author warning; author identity is not invented. No cache files were edited directly. Independent focused review accepted the compatibility change and patch bump.

The owner completed Claude sign-in, and its authentication-status command now reports logged in. The account method was checked without reading or copying credentials. Native model rehearsal is now authorized; results are recorded below. Codex's earlier rejected command is not retried or bypassed; native desktop loading must be observed in a fresh client session. Package installation and a working backend alone are not skill-execution proof. The first proposed owner question is Hanle on 15 October, 20:00–midnight Asia/Kolkata, distinguishing calculated astronomy from unavailable forecast/access/history. A direct tool smoke assembles that plan with explicit partial availability; this is server evidence only. Fresh full-suite verification after the compatibility patch: 659 discovered, 658 passed, one existing permission skip, zero failures; three TypeScript configurations and public/both local package validators pass.

## Native Claude skill execution after owner sign-in

Claude Code 2.1.126 now authenticates through the owner's existing Claude account. A bounded session-only native rehearsal observes the `Skill` tool loading a namespaced NightSky skill and `Read` retrieving its packaged workflow before MCP planning. This is native execution evidence, unlike the earlier prompt-fed Codex matrix. Explicit invocation is tested; automatic skill selection is not established by this run.

The initial generic native prompt used NightSky MCP but never invoked a skill, so it was not accepted as complete workflow evidence. A corrected explicit-invocation preflight demonstrated loading. Independent review then rejected the provisional semantic pass: answers inferred moonset from sampled Moon altitude, attached maximum-altitude azimuths to rise-time bearings, omitted returned source links and skipped the documented separate astronomy/conditions calls. The provisional pass was withdrawn; original evidence is retained.

All five skills and their canonical references now explicitly prohibit inferred Moon timing or a moonless window from illumination/sampled altitude, preserve unknown moonlight effects, distinguish sampled direction from a rise-time bearing, qualify incomplete event calendars and retain source links. A package regression failed before the correction and passes afterward. Independent review accepted the guidance, but this does not establish model compliance. The one permitted diagnostic retry still produced an unsupported moonset statement and wrong weekday labels in the casual answer. Learner Moon handling improved; family handling improved materially. These remain findings, not clean end-to-end passes. All twenty independent scenarios have now completed; failed cases were not repeatedly retried.

The final offline suite discovers 661 tests: 660 pass, one existing permission test is skipped and none fail. All three TypeScript configurations pass. Live weather, actual global candidate coverage, native Codex execution after the recorded policy rejection, retained conversational replanning and public chat-client validation remain separate gates. No deployment or source download is implied.

### Completed native matrix and owner question

All twenty scenarios completed native Skill invocation and packaged workflow reading, covering all five skills. Twenty latest records contain 70 local MCP calls, zero external provider attempts, 647,087 ms total child duration and a maximum case duration of 43,902 ms. Twenty-three retained records include the three permitted diagnostic retries; the stopped in-flight run is retained separately and is not counted as a completed scenario. Claude reports model `claude-opus-4-7[1m]`. No process deadline, output or MCP-call cap was breached in the completed records. Automatic skill selection, persistent conversation memory and live provider accuracy are not established.

| Scenarios | Supported result | Remaining acceptance finding |
|---|---|---|
| Casual / learner / family | Native package execution, local darkness, sparse forecast and access unknowns | Inconsistent mandated tool sequence; casual retry still invents moonset and weekday labels; learner misuses sampled bearings; links incomplete |
| Urban / telescope | Correct target/darkness intersection and core calls | Unsupported orientation/setup advice from sampled azimuth, over-specific telescope advice, incomplete links |
| Meteor | Missing peak/radiant model coverage preserved | Issue time, failure reason and complete source links omitted |
| Milky Way / first photo | No astronomical darkness correctly identified; no image guarantee | Twilight sometimes mislabeled daytime/sunrise; suggested alternative night not calculated; provenance gaps |
| Deep sky | M31 capability gap preserved without invented visibility | Required calls/recommendation flow omitted; source links absent |
| Moon | Explicit Moon geometry supports its timing; no sampled-altitude inference | Source links incomplete; minor wording and sequence issues |
| Aurora | Missing outlook and Moon timing preserved | Invents NOAA fetch-failure provenance and overstates clear conditions from one sample |
| Eclipse | No invented eclipse/contact times; solar viewing precautions | Planner call and source links omitted |
| Long ahead | Future forecast/unsupported year and short darkness interval preserved | Historical provider inferred as ERA5 from generic failure; weather call and links omitted |
| Replan | Newer synthetic 15:00Z / 85% cloud used | One candidate endpoint copied as local time from UTC; no before/after persistent-conversation proof |
| Accessible place | Correctly refuses accessibility/access certification | City-centre calculation insufficiently distinguished from selected park |
| Region intersection | Coverage/fallback limits stated | Recoverable place resolution not completed; requested origin/country/state intersection not executed |
| Multiple origins | Both distances, any-mode scope and partial coverage correct | Exclusions/comparison left for clarification; incomplete source links |
| Selected candidate | Details/revision and both calculations use candidate point; within-turn revision works | Display timezone selected without required clarification; completeness and Moon-summary wording errors |
| Near me | No unauthorized location call | Historical fixture counts copied as installed coverage |
| Unsupported GPS / routing / reminder | Clean boundary pass; no false tool/action promise | No finding in reviewed answer |

Independent review covered all twenty final scenarios and the three original/retry records relevant to the findings. Thus native loading passes across twenty scenarios, but these are **not twenty clean semantic acceptance passes**. The acceptance checkbox remains open.

A separate Hanle 20:00–midnight Asia/Kolkata question completed native Skill/Read plus resolve, astronomy, weather and planner calls. It correctly treated matching darkness intervals as nested thresholds, retained unavailable weather/history and unknown site access, and avoided polar-night confusion. It nevertheless added an unsourced permit claim and uncalculated Milky Way advice, and omitted actual returned source links. It is a finding, not a clean pass. No live weather or source download occurred.

The near-me review exposed historical regional-fixture details in the discovery workflow. Those count/region claims were removed from runtime guidance; the workflow now requires current tool results for installed coverage. Its package regression was observed failing before correction and passing afterward. The retained regional artifact itself was not deleted or changed. This final coverage edit has packaging/regression review, not a second full native matrix.

Both persistent local packages are refreshed through supported installers to version 1.0.3; no cache files were edited. Claude validates the actual installed manifest with the existing missing-author warning. Fresh client sessions are required to use refreshed packages. Codex's recorded execution-policy gate is unchanged and was not bypassed. No deployment, publication or new dataset downloads occurred. Original ticket counts remain unchanged.

## Reliability follow-up — 15 October 2026, local package 1.0.5

This owner-approved wave addresses interpretation errors found above. It does not close the original native acceptance checkbox or authorize deployment/data acquisition.

| Change | Verification / boundary |
|---|---|
| Calculated Moon-center-below-horizon intervals | Separate from illumination and sampled maximum altitude; geometric zero-degree centre model, not apparent limb moonset. Complement checked against Moon target intervals at four latitudes. |
| Explicit Sun-center-below-horizon intervals | Distinguishes predawn twilight from Sun-above-horizon time when no astronomical darkness is available. Does not calculate visual detectability. |
| Target bearing sample identity | Maximum-altitude UTC/local sample time and basis accompany the azimuth. A sampled bearing is not a rise-time or whole-session orientation. |
| Local planning endpoints and darkness overlap | Server formats endpoints in the selected display zone/locale and intersects target windows with astronomical darkness. Planet geometry is not shortened or described as best seeing. |
| Moon/cloud factor corrections | Phase alone rates Moon impact unknown. Instant or mixed interval/instant forecast evidence cannot produce a favorable whole-window assessment; assessed variables require interval unions covering the requested window. Precipitation-only periods are not mislabeled instant cloud samples. |
| Common Milky Way query | Plain “Milky Way” explicitly resolves to the supported Milky Way **core** model; it does not add a star-field model. |
| Aggregate workflow | A full plan resolves the city then uses the planner's existing combined evidence. Repeating each provider call is no longer mandatory; focused tools remain available. Candidate details/revision and explicit display-zone clarification remain required. |
| Native test proof | Claude must invoke its namespaced Skill and receive the complete exact packaged workflow. Successful empty/EOF, partial offset/limit reads, missing results and unrelated paths do not satisfy the check. `--cases` accepts unique known journey IDs for bounded affected-case testing. Semantic review remains manual. |

Witnessed failing regressions preceded the changes. Final offline verification: **677 discovered, 676 passed, one existing permission skip, zero failures**; all three TypeScript configurations pass. Independent review found and verified corrections to the stale Moon-timing warning, mixed forecast eligibility, precipitation labeling and incomplete native-read proof; final code review reported no remaining Important code defects. Optional output fields preserve older fixture/client shapes. Existing geometry invariance tests now distinguish the added local display field from UTC geometry. Horizon intervals retain the existing sampled-bracketing/refined-crossing engineering method; no claim of apparent rise/set, terrain modeling or new independent observational validation is made.

### Actual model verification and remaining findings

Three bounded Claude batches exercised **13 unique journeys in 15 invocations**, including one diagnostic retry each for urban Jupiter and Milky Way after concrete server corrections. They cover all five skills, make **37 local MCP calls**, and record **zero external provider attempts**. Complete native skill/reference loading was verified in all 15 invocations. Total child duration is 523,105 ms; maximum 46,358 ms; none breached the configured deadline, output or call caps. The first eleven-case batch used the initial 1.0.4 correction; final 1.0.5 urban/Milky Way retries and family/meteor checks additionally exercised the explicit overlap, Sun horizon and query-alias changes. These are not fifteen clean answer passes.

Improvements observed: explicit Moon timing replaces illumination-only guesses; forecast samples stay distinct from continuous weather; the geographic intersection recovers with all requested constraints; the urban retry copies the correct **01:43–05:34** local darkness overlap; the Milky Way retry resolves the core model and distinguishes **05:00–06:17** Sun-below-horizon time from the rest of Sydney's window. The near-me boundary answer passes without assuming location or making a tool call.

Remaining answer findings are retained: some source URLs are still omitted; urban/meteor advice still invents directional setup from a later sample or unavailable radiant geometry; geometric Moon-below-horizon evidence is sometimes overstated as minimal moonlight; selected-site/access answers still choose an unverified display timezone without user clarification; one selected answer overstates Saturn's interval; long-ahead prose incorrectly treats daytime geometry as visual invisibility; alternative-night overlap sometimes goes uncalculated. Family timing/unknowns are useful but its “easy” wording and incomplete links prevent a clean pass. No failed case is reclassified as passed merely because transport or authoring assertions succeed.

The current **Codex conversation** can now read the installed local skill/reference through normal host capability and call the native NightSky tools. Hanle and London/Jupiter checks use actual MCP evidence, correctly preserve unknown weather/access/history, and report the supported intervals without invented permits, uncalculated Milky Way targets or setup bearings. London uses the server's **01:43–05:34** darkness overlap. These are two reviewed development-conversation checks, not a fresh blind Codex matrix. The older nested CLI policy rejection remains a separate limitation; its rejected command was not retried or bypassed and no security policy changed.

Ignored evidence retains the three Claude checkpoints/full answers/reviews, exact package inventories, both current-Codex JSON captures and their reviewed answers. Both persistent local packages are refreshed to **1.0.5** through supported installers. The actual Claude cache validates with the existing missing-author warning. The temporary backend remains loopback-only, offline and automatically expires; no real weather/history/aurora feed, global candidate edition, publication or deployment is implied. Original ticket counts stay unchanged.

For reproduction, the tracked harness now supports `--run --claude --cases urban,milky-way` for a fresh bounded native batch, or `--preflight` plus reviewed contained checkpoint resume. Ordinary tests never start a real model. Existing authentication must already be available; never copy credentials into evidence. Review full answers and native proof before accepting a journey.

## Answer presentation follow-up — 15 October 2026, local package 1.0.6

The MCP human-readable planning response now includes calculation basis, local session/opportunity endpoints, darkness overlap, Moon limits, forecast issue/sample times and complete source links. Structured results and astronomy calculations are unchanged. Resolver, astronomy, target, candidate-details and aurora text also expose returned source links. The aurora summary no longer assigns NOAA identity to every provider result. Links admit only HTTP(S), reject embedded credentials, deduplicate URLs and retain complete lines within a byte budget. Overflow points to structured source records rather than shortening URLs.

All five skills and canonical workflows put candidate-details/display-timezone clarification, source links, Moon limits and the prohibition on compass setup advice at the beginning. The planner schema explicitly requires a user-chosen display timezone for an unverified candidate. These instructions improve host behavior; they do not enforce every word a host model generates.

| Fresh Claude scenario | Whole-answer review |
|---|---|
| Urban Jupiter | **Finding:** correct 01:43–05:34 London darkness overlap, Moon uncertainty and complete URLs, but still adds unsupported east-southeast setup advice and calls the geometric overlap “best.” |
| Meteor | **Finding:** Moon/radiant limitations and timing are preserved, with no invented setup bearing; however, a candidate distance/access statement omits its returned catalogue source link. |
| Accessible candidate | **Pass for reviewed case:** obtains details, asks for the user's display-zone choice, retains unknown accessibility and makes no planning call before clarification. |
| Selected candidate | **Pass for reviewed case:** “use its timezone” is not treated as a choice when the site timezone is unverified; asks and waits before planning or revising. |

The four fresh Claude invocations prove native Skill invocation and complete packaged reference retrieval, use ten local MCP calls and make zero external provider attempts. Total child time is 132,553 ms; none breached configured bounds. An independent reviewer checked the complete answers. Evidence is retained under ignored `model-rehearsal/claude-EIYmqb`, with reviewed statuses kept separate from transport success. No retries were used to relabel failures.

A fresh Codex-host agent read the installed 1.0.6 skill and full reference, then used native resolver/planner tools for London/Jupiter. Its complete answer preserves the same local overlap, Moon and offline-weather limits, includes returned source links, and uses an on-site chart without setup bearings. This is a fresh agent in the Codex host, not a nested CLI, ChatGPT chat-app test or full Codex matrix. The earlier nested-CLI policy rejection was not retried or bypassed.

A second fresh Codex-host agent read the discovery skill/reference and checked the retained legacy Fiction Park fixture. It correctly stops when candidate details are unavailable and asks before offering a separately labelled town-centre plan; it makes no planning call. This exercises the missing-details boundary, **not** the global-catalogue timezone clarification that Claude exercised. Legacy search returns no catalogue revision. Five native calls include two rejected details requests: an ID request without a revision, then name lookup with ISO2 GB instead of required ISO3 GBR. The corrected name lookup remains unavailable without the global catalogue. This is recovered interface behavior, not a clean first-attempt sequence. The schema's unspecified country-code convention is a usability follow-up. An independent reviewer checked both complete Codex answers against their captured results and found their final semantic behavior consistent with the reviewed requirements. These two Codex captures are retained in ignored `fresh-codex-answer-guards.md` and `fresh-codex-candidate-guards.md`; they do not establish global real-site coverage.

Regression verification: **683 discovered, 682 passed, one existing permission skip, zero failures**. All three TypeScript configurations, plugin packaging, plugin build and eight offline review assertion sets pass. The six added tests cover response text/source links, candidate-zone schema guidance, unsafe/duplicate links, UTF-8 bounds and early packaged skill rules. Code review reported no Important or Critical defects. Both local packages were refreshed through supported installers to 1.0.6; the actual Claude cache validates with its existing missing-author warning.

Original ticket counts remain **12 Done / 9 Partial / 6 Not started**. The installed-client acceptance checkbox stays open because two affected Claude answers still have findings and the complete client matrix has not passed. No deployment, publication, real weather/history/aurora request or new dataset download occurred.

## Country contract and full-matrix follow-up — 15 October 2026, local package 1.0.7

The discovery country filter already enforced uppercase three-letter ISO3 format. Its schema now describes the convention with GBR/IND/USA examples, and validation errors repeat those examples. Both details and region-resolution inputs retain their regex and optional-filter behavior; this does not add country conversion or change the catalogue format. A witnessed failing description regression preceded the fix. Five tests cover schema guidance, accepted/rejected formats and the actual loopback MCP `tools/list` projection.

The five skills and their canonical references now end with a final answer audit: remove parenthetical compass setup advice, distinguish geometric opportunity from best seeing, include the catalogue URL with candidate distance/access claims, and shorten optional advice before dropping a used source. An earlier sampled-azimuth paragraph is scoped to explicit bearing questions so it does not invite compass advice in ordinary plans. The packaged-text regression failed before this edit and passes afterward. These instructions are not an enforcement layer over the host model's final prose.

Fresh deterministic verification: **690 discovered, 689 passed, one existing permission skip, zero failures**; all three TypeScript checks pass. Plugin package/build, both standalone runtime modes and eight offline review assertion sets also pass. Independent code/workflow review found no actionable regression. Both local packages were refreshed through supported installers to 1.0.7; Claude validates with its existing missing-author warning.

Affected-case review: the new Claude urban answer omits the unsupported direction, and the meteor answer now includes the missing catalogue URL. Both still omit returned forecast issue time; urban also makes an optional event claim without event-source links. The meteor wording “dark-sky slot” should be more precisely tied to astronomical darkness, since measured sky brightness is unavailable. These are findings, not full acceptance passes.

### Complete question-matrix results and limits

All twenty question IDs were exercised and independently reviewed for each client. This is a first-response functional rehearsal: a justified clarification can pass without completing an outing or creating a reminder. It is not proof of every multi-turn follow-up, host action, automatic skill discovery or positive observing scenario. In particular, the shared UTC window is mostly daytime in Sydney, so those cases exercise that boundary rather than a successful night-imaging session. The clients use different session arrangements; this is not a controlled model-quality benchmark.

- **Codex host:** twenty original case evaluations plus nine diagnostic replays, sixty-two native MCP calls. The original stargazing reference was fully read before its cases, but an initially truncated SKILL read was completed only afterward. A fresh agent therefore replayed all nine stargazing-mapped questions after two separate complete installed-file reads. The other eleven cases had complete skill/reference reads before execution. Final coverage uses those nine replays and eleven original cases: **19 pass, one citation finding, zero blocked**. The original answers and loading qualification remain retained. The meteor answer discusses both NASA years but omits the returned 2025 PDF link. A recovered local evidence-save error did not repeat product calls.
- **Claude Code:** twenty original fresh CLI invocations plus one bounded first-photo diagnostic after the source wording correction below; forty-five native MCP calls. All twenty-one prove namespaced Skill invocation and complete exact packaged reference retrieval with allowed tools only. Original and latest twenty-case coverage both have **eight pass, twelve with findings, zero blocked**. Total child duration is 814,434 ms, maximum 55,336 ms; no configured bound was breached. Model identity recorded by the CLI is `claude-opus-4-7[1m]`; no model override was applied.

The Codex host used a separate loopback instance of the same synthetic global-catalogue factory as Claude, not the older legacy Fiction Park fixture. Data-provider attempts are zero. Installed files were deliberately read/invoked for the rehearsals; these are not a restarted desktop UI or ChatGPT/Gemini acceptance matrix. The rejected nested Codex CLI read was not retried, and no security policy changed. Actual global data admission, live forecast accuracy, site access and publication remain outside this evidence.


| Question ID | Codex host, reviewed coverage | Claude original matrix |
|---|---|---|
| casual | Pass | Pass |
| learner | Pass | Finding |
| family | Pass | Finding |
| urban | Pass | Finding |
| meteor | Finding | Finding |
| milky-way | Pass | Finding |
| first-photo | Pass | Finding |
| telescope | Pass | Pass |
| deep-sky | Pass | Pass |
| moon | Pass | Finding |
| aurora | Pass | Finding |
| eclipse | Pass | Finding |
| long-ahead | Pass | Pass |
| replan | Pass | Finding |
| access | Pass | Pass |
| intersection | Pass | Pass |
| multi-origin | Pass | Pass |
| selected | Pass | Pass |
| host-boundary | Pass | Finding |
| unsupported-boundary | Pass | Finding |

Findings are retained precisely, rather than equating every finding with a wrong calculation. Claude omissions include forecast issuance times and relevant event URLs; family/first-photo/unsupported-boundary exceed the requested 250-word limit. Factual or unsupported-language findings include favorable Moon-free wording, a guessed next-night alternative, an unsupported sunset reference, pole-facing setup advice, twelve modeled GMN showers described as thirteen, and a conditional promise to request an unavailable host-location capability. Eclipse filter guidance is present, but the workflow's explicit ordinary-sunglasses warning is omitted. No unsupported host action was actually executed. Intersection recovers from one invalid mixed legacy/scope request; its final geography and coverage answer passes with that recovery recorded.

### Source wording correction and its diagnostic

Review identified one inherited server error: an empty suggestion list was described as no geometrically visible bright target, although astrophotography suggestions are also filtered by astronomical darkness. A witnessed failing MCP regression proves Jupiter has above-horizon intervals while suggestions are empty. The corrected gap says no suggestions met the selection rules and does not imply all targets are below the horizon or visually undetectable. Only that text changed; calculations, schemas and selection rules did not. Independent code review approved the change.

The complete matrices above ran against the pre-correction server module. Claude's sole first-photo diagnostic used the corrected server, preserved the new gap and removed the false geometric statement. It also included forecast issue/valid times and relevant URLs and met the word limit. It remains a finding because morning Sun-below-minus-6/minus-12 interval endings are mislabeled as twilight endings rather than the beginnings of those morning twilight phases. Its suggested before-05:47 cutoff is not a calculated end of the overall twilight opportunity; the Sun-center-below-horizon interval continues until 06:17. The original failed answer is retained; the diagnostic is not used to declare the whole matrix passed. Final 690-test/type/build/runtime verification includes the corrected source.

Ignored evidence retains `claude-aggUq6` checkpoint/package inventories, both Codex answer/trace folders, loading-order proof and separate machine-readable independent reviews. Review verdicts are copied into the Claude checkpoint only after review. The normal retained-subset local listener has been restored for owner testing; it includes Hanle/London but no real weather/history/aurora or admitted global candidate edition. Both packages remain 1.0.7. Start a fresh client session to pick up installed files.

Original counts remain **12 Done / 9 Partial / 6 Not started**. The installed-client acceptance checkbox stays open. No deployment, publication or new dataset downloads occurred. Further acceptance work must address the recorded factual/reporting failures; passing transport, installation or deterministic tests does not erase them.

## Known-failure corrections — 15 October 2026, local package 1.0.11

This follow-up addresses the twelve affected Claude cases and Codex meteor citation case from 1.0.7. Independent agents implemented answer formatting, workflow guidance and optional event-evidence selection; a separate reviewer inspected source changes and full actual answers against returned results. Existing scope, source limits and original ticket gates remain unchanged.

### Corrections and regression evidence

| Area | Change | Verification |
| --- | --- | --- |
| Weather facts | Compact per-provider issue time, valid range, deterministic first supplied sample/value/unit, instant or period semantics and missing fields precede bulky geometry. Full structured results remain available. | Answer-text regressions include four providers with 48 samples, empty samples, long Unicode names and distinct provider ordinals. |
| Twilight | Exclusive civil, nautical and astronomical phases are derived by subtracting nested geometric Sun-altitude intervals and clipping to the session. A clipped boundary is not a sunrise/sunset event. | Sydney fixture establishes civil 05:47–06:17, nautical 05:17–05:47 and astronomical 05:00–05:17 local; unavailable evidence stays unknown. |
| Event relevance | Unrequested empty/failed event lookups no longer add negative event claims, sources, gaps or evidence to unrelated plans. Explicit meteor/eclipse requests and positive matches for other activities retain event evidence. Lookup itself still runs; this does not prove no real events exist. | Eleven additive planner tests cover omission, retained weather/history/access unknowns, explicit empty/failure cases and positive matches. |
| Skills and references | All five packaged workflows emphasize complete relevant links, forecast issuance/validity, unknown Moon impact, actual host capabilities, solar safety, no invented setup bearing or alternative overlap, concise answers, and photography versus dark-sky opportunity. | Additive package guards witnessed RED before correction and GREEN afterwards; prior safety/host assertions remain intact. |

The event source records were already present in the failed aggregate results: missing citations were model omissions, not a missing backend source aggregation. Suppressing incidental empty event sections reduces irrelevant claims; event-focused answers still require citations.

Final local verification: **710 discovered / 709 passed / one existing permission skip / zero failures**; all three TypeScript checks, plugin build/package, full 14-tool and resolver-only one-tool production runtime checks, and eight offline review assertion sets pass. Runtime/review assertions made zero external provider attempts. Claude validates the installed 1.0.11 manifest with the existing missing-author warning. Both supported local installers were refreshed through their normal commands. Package archive SHA-256 is recorded in the ignored `known-failure-111-package.log`; packaging still declares submissionReady false.

### Actual model follow-up, with retained intermediate failures

| Package | Claude scope | Independent result |
| --- | --- | --- |
| 1.0.8 | Seven affected cases | Three pass, four findings. |
| 1.0.9 | All twelve affected cases | Six pass, six findings. |
| 1.0.10 | Six remaining cases | Five pass, first-photo remains a finding. |
| 1.0.11 | First-photo only after a narrow instruction correction | Still a finding: incorrect morning twilight labels and Moon maximum sample time. |

Latest reviewed evidence across versions clears **eleven of twelve affected Claude cases**: urban, meteor, aurora, eclipse, replan and host-boundary at 1.0.9; learner, family, Milky Way, Moon and unsupported-boundary at 1.0.10. This is mixed-version affected-case evidence, not a fresh complete 1.0.11 matrix. The final first-photo answer is 231 words and fixes the blanket claim that photography is impossible, retains issue/valid times, instant limits, unknown Moon impact and complete source URLs. However, it calls 05:47/05:17 the civil/nautical twilight endings instead of beginnings and places the Moon maximum at 05:00 rather than the returned 17:00 Sydney local time. The backend's exclusive phases and maximum timestamp are correct. **First-photo acceptance remains open.** No further retry was used to relabel it as passed.

Three separate fresh Codex-host meteor checks at 1.0.8/1.0.9/1.0.10 independently pass, including the final 139-word answer and full returned event source URLs. Each agent read both actual installed skill and complete packaged reference in separate untruncated reads before native MCP calls. These demonstrate deliberate workflow loading and native tool use, not automatic skill discovery or desktop chat UI acceptance.

Across this correction sequence, 26 Claude case invocations used 44 product tool calls; all recorded native skill/reference/allowed-tool checks are true. Three Codex meteor checks used seven native product calls. Claude runs use fresh local CLI sessions and synthetic fixture weather/places with real astronomy calculations; no external data-provider calls or datasets were authorized. Internal shorter core/family/boundary word targets are guidance controls, not replacements for the original 250-word review criterion. Some passing answers exceed those shorter targets.

Ignored evidence retains all answers, result traces, loading proof and independent verdicts: `known-failure-108-review.json`, `known-failure-109-review.json`, `known-failure-110-review.json`, `known-failure-111-review.json`; Claude rehearsal folders `claude-9w5IMB`, `claude-RQ4Bpa`, `claude-OifWRN`, `claude-VrJGTk`, `claude-EWdKNR`, `claude-L0dvKJ`, `claude-mD75mu`; and `codex-meteor-108/109/110`. Earlier failures remain evidence. The owner listener was restored to the retained named-place offline subset, including Hanle/London, rather than leaving the three-city synthetic global test profile active. Restart the client to load 1.0.11.

Original counts remain **12 Done / 9 Partial / 6 Not started**. Installed-client acceptance remains open, as do actual global dataset, historical, hosting and publication gates. No deployment, publication or new dataset downloads occurred.
