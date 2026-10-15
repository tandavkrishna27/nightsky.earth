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
