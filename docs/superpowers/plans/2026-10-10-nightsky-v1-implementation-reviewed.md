# NightSky.earth V1 Implementation Plan

> **Planning status:** Roadmap and decision record. The authoritative ordered implementation checklist is [the V1 execution plan](2026-10-10-nightsky-v1-execution-ready.md). Older subsystem work-package files are retained as background only; do not execute their stale website, sharing, or calendar tasks.

**Goal:** Deliver the free, assistant-first NightSky.earth V1: help a user discover source-linked candidate observing places and plan what to see and when for their activity, place and date. The discovery and planning journey ships through ChatGPT first and a shared MCP service for other compatible assistants.

**Architecture:** Leave the existing React/Vite website experience as-is for plugin V1, while adding the privacy, terms, and monitored support pages required for a public remote-MCP listing. Add a platform-neutral TypeScript planning service and expose read-only tools through one Streamable HTTP MCP endpoint on a Node-capable host. Website discovery, design, and possible implementation can proceed in parallel as a separately scoped workstream; it is independent of plugin V1.

**Tech Stack:** Existing Node.js 20, TypeScript, Express, React, Vite, Zod and tsx; prove compatibility with the current official MCP TypeScript SDK v2 and its schema/runtime requirements before integrating it. Use the Node test runner for service and protocol tests. Verify each dataset's license and the current host package format before shipping it.

**Product scope:** [docs/product-scope-v1-v3.md](../../product-scope-v1-v3.md)

**Execution plan:** [Ordered V1 implementation plan](2026-10-10-nightsky-v1-execution-ready.md). The older [core service](2026-10-10-nightsky-v1-core-service.md), [workflow](2026-10-10-nightsky-v1-workflows.md), and [platform launch](2026-10-10-nightsky-v1-platform-launch.md) outlines are background references only and contain superseded scope details.

## Global Constraints

- The product and required data/API access must remain free to end users; the proposed recurring public-pilot ceiling is $25/month, with a separate one-off data-build budget to approve and measure before any paid processing.
- Keep each weather model/source separate. Show its source, model, issue/update time, valid time, forecast horizon, time step and missing fields where the source provides them. Include a retrieval/check time only when no provider timestamp gives a usable freshness signal and the user needs it. Never average, rank or label one as the winner.
- Clearly distinguish forecasts, observations, calculated astronomy and historical climatology.
- Use named places as the portable location input on every host; reject typed coordinates in V1. `resolve_place` accepts a named destination or `useApproximateHostLocation: true`; the assistant sets the flag only for an explicit current-area request, and the server uses a documented host hint transiently to resolve a named place before discarding it. If the user supplies coordinates, ask them to name a destination; never convert or reverse-geocode the coordinates into a place name. Other tools receive a `placeId`; no raw coordinates or addresses are requested. Do not require accounts, precise GPS access, social access, location history or user submissions.
- Public place records are candidates, not proof of nighttime access, safety, opening, accessibility or an unobstructed horizon.
- V1 is read-only and has no interactive website map, community submissions, photo hosting, account history or automated reminders. The assistant includes text-based place discovery as well as night planning.
- Leave the current website's product pages, homepage, and navigation unchanged for plugin V1. Add the required privacy, terms, and support pages for public remote-MCP review. Separately scope any website update or interactive map in a parallel workstream; it has its own product/design discussion and is not a plugin V1 dependency.
- V1 returns the plan in the assistant conversation. Do not build a website plan-share page or make calendar-file delivery a launch requirement; revisit those after confirming platform support and user demand.
- Preserve source attribution, reuse rights, request policies, cache rules, data vintage and degradation behavior.
- Shared MCP tools are the cross-platform product foundation. Skill/package distribution, location context and setup vary by host; do not promise identical availability across ChatGPT, Claude and Gemini before verifying each route.

## Review Focus

- Ambiguous place names or unavailable host location must lead to a location question, not guessed coordinates; covered by execution-plan Tasks 4 and 10.
- Polar dates and DST boundaries must return correct local astronomy or an explicit no-darkness result; covered by execution-plan Tasks 4–6 and 10.
- Missing, stale, failed or conflicting forecast sources must remain separately labeled in a partial plan; covered by execution-plan Tasks 7 and 10.
- Historical climatology must not be described as a future forecast; covered by execution-plan Tasks 9–10.
- Stale OSM records must not imply access, safety, opening or accessibility; covered by execution-plan Task 8 and tested in Task 10.

## Review record

The detailed execution plan was drafted with `superpowers:writing-plans` and reviewed using `plan-ceo-review`, `plan-design-review`, `plan-eng-review`, and `plan-devex-review` criteria. This was a document-based review using decisions already made in the conversation; the skills' full interactive question loops and implementation tests were not run. Claude reviewed successive full-plan attachments and confirmed the final edits in a delta pass; its last pass found no P0/P1 or material contradiction and said Task 0 is ready. I independently checked current OpenAI, MET, and privacy-regulation sources before adopting external claims. Claude's findings and their dispositions are recorded in the execution plan.

| Review lens | Finding | Resolution in this plan |
|---|---|---|
| Product strategy | The user value is coordinating discovery, sky timing and conditions across separate apps. A map, community feed or “AI” label alone is not the V1 wedge. | Keep the planning journey central; treat the marketplace as a distribution channel and pilot as the demand test. No new product scope was added. |
| Engineering | Earlier plans bundled multiple providers and user-facing deliverables, left data/hosting decisions open inside implementation tasks, and exposed possible placeholder tools before they worked. | Sequence six independent source/host preflight gates before implementation; split work into 19 numbered task groups and lettered sub-tasks with explicit interfaces and acceptance checks; check SDK/transport and the location schema early; use one place resolver and IDs downstream; register tools only when handlers are complete. |
| UX and design | Host setup UX and the assistant's response hierarchy matter; a new NightSky website entry page is not needed for plugin V1. Partial data, ambiguity, and unsupported cases need explicit acceptance checks. | Design the conversation response and platform setup instructions; keep existing website pages unchanged apart from listing-required policy/support pages. |
| Developer experience | Local setup must work in the owner's Windows environment and distinguish local MCP testing from public installation. The existing package scripts use POSIX environment assignments. | Add cross-platform scripts and a first local plan walkthrough; verify on Windows and Linux, use MCP Inspector, then validate hosts separately. |
| Independent Claude review | Full-plan review found OpenAI location-schema and annotation risks, late host compatibility checks, URL-doc conflict, mobile/domain/identity requirements, privacy logging gaps, candidate ranking ambiguity, and pass-through/response-minimization risks. | See the execution-plan review table: named-place resolution is isolated; all annotations are explicit; smoke and location scans move earlier; the full URL is frozen; mobile, domain, publisher and residency checks are added; logs/telemetry and candidate sort reasons are defined; forecast/aurora tools must add NightSky planning value. |

## Historical implementation-readiness audit

This audit applied to the earlier work-package outlines and is retained to explain why they are not the execution source of truth. The new ordered V1 execution plan supersedes these broad work packages with explicit files, inputs/outputs, dependencies, test names, and release gates. The individual concerns below still apply as feasibility risks and are addressed in that execution plan.

| Work package | Why it is still too broad | Required planning split before implementation |
|---|---|---|
| Core Task 5: target catalogs and event search | Combines catalog licensing/vintages, routine event calculations, eclipse circumstances, comet/asteroid ephemerides and unsupported-event behavior. | Separate the data/catalog decisions from calculated event classes and remote ephemeris lookup. Give each slice its own schema, fixtures and acceptance gate. |
| Core Task 8: global OSM candidate index | Combines a feasibility spike, storage/index choice, global imports, refresh operations and query behavior. | Make the regional import spike a decision task. Only after its measured result, plan the chosen index and refresh implementation as separately reviewable tasks. |
| Core Task 9: ERA5 climatology | Combines CDS access, historical aggregation, global storage, query integration and launch readiness. | Keep the small registered-data proof as a stop/go task; detail aggregation, serving and historical-result validation only after it passes. |
| Core Task 10: supplemental data review | Lists several unrelated feeds with different uses and terms, but has no single launch-critical deliverable. | Keep this as a source-disposition appendix or one bounded research task. Do not turn it into a catch-all implementation task. |
| Workflow Task 3: meteor, eclipse and aurora plans | These event types have different inputs, providers, safety/content requirements and failure states. | Split them into independently tested workflow tasks, while sharing the planner interface. |
| Workflow Task 11: website and stale copy | Combines a new entry page, navigation, route/accessibility checks, README/setup changes and existing-site copy corrections. | Split product/setup page work from documentation and legacy-copy cleanup, with browser acceptance for the page. |
| Platform Task 5: production host and operations | Combines host comparison, deployment, health/rate limits, provider-failure behavior, cross-platform scripts, staging and cost monitoring. | First produce a measured host decision. Then write separate deployment/operations and cross-platform clean-setup tasks with concrete acceptance commands. |
| Platform Task 6: public submission package | Includes manifest compliance, public listing assets, eligibility, exact review prompts and ZIP validation. | Retain as one release-preparation gate, but enumerate each artifact and the exact package validation result required before it can pass. |

The execution plan now provides that next planning pass. Its tasks still contain explicit source/host gates; if an early feasibility gate fails, stop the affected claim and record a truthful partial/unsupported result before implementation proceeds.

## Source and feature disposition

“Free” describes user price and data access, not the cost of storage, processing, hosting or maintenance. Integrate a source only when the terms, data quality, coverage and operations fit the user journey.

| Capability/source | V1 disposition | Gate or limitation |
|---|---|---|
| MET Norway Locationforecast | Required baseline global point forecast | Respect User-Agent, attribution, coordinates, caching, missing fields and reasonable request load. |
| Astronomy Engine, IANA time zones and selected HYG/OpenNGC/NASA/curated event data | Required for local sky timing and defined event classes | Verify licenses, source vintage, local-time conversion and high-latitude behavior. Meteor data is curated only where redistribution terms are clear. |
| GeoNames place names and OSM candidate places | Required for global baseline text discovery | Build a product-managed index; disclose coverage gaps and ODbL duties. No production dependency on public Nominatim autocomplete or public Overpass capacity. |
| ERA5 historical cloud/weather summaries | Required for the months-ahead seasonal-planning journey in the scope | Prove the registered-data workflow, statistic, update cadence, storage and cost before public launch. Label as history, never a forecast. |
| NOAA GEFS | Optional V1 enhancement for day 10–16 | Add only after decoding, field/time alignment, attribution, latency and budget pass a real-data spike. MET-only is still a useful short-range plan, but must not claim the extended forecast flow. |
| ECMWF AIFS ensemble | Alternative optional extended forecast if NOAA GEFS decoding fails | GRIB retrieval, decoding, caching, attribution and operating-cost validation are still required; MET's ECMWF-based medium range is not independent corroboration. |
| CAMS aerosols and U.S. NWS forecast/alerts | Conditional regional/context enhancements | Add separately only after useful fields, terms, attribution, coverage and outage behavior are verified. Aerosols are context, not astronomical transparency. |
| JPL Horizons/SBDB | Selected bright comet/asteroid targets where current ephemerides are useful | Cache server-side, identify the service, follow fair-use guidance and return unsupported when a current lookup is unavailable. |
| NASA Black Marble/VIIRS relative ground-light radiance | Conditional V1 text context, pending execution-plan Gate 0E | Verify exact product/terms, coverage, vintage, labels and usefulness. This is ground radiance, not astronomical sky brightness; no Bortle/SQM or “dark sky” claim. |
| NASA GIBS map imagery, NASA FIRMS fire hotspots, NOAA coastal tides and Copernicus DEM | Not required for the assistant-first launch; retain as reviewed follow-up candidates | No interactive map in V1. Each needs a specific user journey, exact layer/product, terms, freshness and operational test. Fire hotspots do not establish smoke or safety. |
| Open-Meteo free, 7Timer! and Clear Sky Chart free services; World Atlas noncommercial raster; paid astronomy/weather services | Excluded from the product data path under the current free and reuse constraints | Reconsider only if licensing terms change or the user changes the free-data boundary. |

## Scope coverage and release outcomes

| Product requirement | Owning plan | Required release evidence |
|---|---|---|
| Place/date/activity to an end-to-end answer | Execution-plan Task 10 | A deterministic fixture suite covers the agreed user journeys and source/error states. |
| Astronomy, darkness, Moon, target visibility and defined events | Execution-plan Tasks 4–6 | Reference cases pass, including DST boundaries and polar day/night. Unsupported event classes return a clear boundary and an authoritative link where known. |
| Weather now through the supported baseline horizon | Execution-plan Task 7 | MET outputs preserve source metadata, missing fields and partial failures. |
| Months-ahead travel planning | Execution-plan Task 9 | ERA5 statistic is computed and described as historical, or the launch is explicitly held back from promising this journey. |
| Named-place resolution and text candidate discovery | Execution-plan Tasks 4 and 8 | Repeatable index/import with source ID/link, vintage and unknown access status where not verified; global coverage is stated only to the measured extent. |
| Beginner learning, astrophotography guidance, telescope/meteor/aurora/eclipses, packing and app suggestions | Execution-plan Tasks 10–11 | Prompt fixtures cover matching activity factors and prevent unsupported camera, seeing, safety or visibility claims. |
| Useful assistant-native plan output; calendar export may be revisited later | Execution plan | The complete plan is readable and copyable from the conversation. Calendar export and share links are not V1 launch requirements. |
| ChatGPT-first package, with Codex, Claude and Gemini paths checked separately | Execution-plan Task 12 | A host matrix records connection route, workflow/skill support, test prompts, account/region caveats and observed gaps. |
| Public OpenAI plugin directory launch (ChatGPT and Codex) | Execution-plan Tasks 13–16 | Stable public HTTPS MCP endpoint, current package validation, verified developer identity/domain, listing URLs, five positive and three negative review cases, accessible video walkthrough, review approval and an explicit publish step. |
| Privacy, operations and pilot learning | Execution-plan Tasks 13–14 and 17 | No default exact-coordinate logging; health, limits, outage handling, budget alerts and disclosed aggregate metrics are ready. |

## Execution order and gates

1. **Preflight:** Complete the source/terms register and prove the data-storage, OSM import, ERA5 workflow and hosting cost assumptions. No product code is required to decide whether these paths are viable.
2. **Core service:** Follow Tasks 1–10 in the execution plan through local MCP Inspector. A user-named place and time can return local astronomy, forecast evidence, and a source-aware partial result.
3. **User journey:** Follow Tasks 10A–11C. The assistant can plan, compare choices, teach, and prepare without relying on a custom website UI.
4. **Package and route preparation:** Follow Tasks 12A–12B for package validation, host instructions, and a repeatable test matrix. Local MCP Inspector success is a protocol check, not evidence that a hosted assistant connection works.
5. **Staging validation:** Follow Tasks 13–15 to publish the required privacy/terms/support pages, deploy at the selected permanent MCP origin, measure the real operating cost, and test ChatGPT/Codex plus the available Claude/Gemini routes. If invited testers can connect, run a small staged usability check before submission; otherwise document the limitation and begin the invited pilot after publication.
6. **OpenAI plugin directory submission and launch:** Verify the public MCP domain and all listing URLs, submit the prepared package through the current OpenAI review flow, resolve findings, then—after approval—publish and verify the actual listing on ChatGPT and Codex. The final submit/publish actions happen only after the owner reviews the ready-to-submit material and authorizes them.
7. **Invited pilot:** Follow Task 17 to test real plans with target users and record what they acted on, where data was missing, and whether they returned. Do not use MCP call totals as unique-user or install counts.
8. **Parallel website workstream:** Task 18 can start alongside plugin V1 to scope and plan website work separately. Pilot evidence may inform later decisions, but the website work neither changes nor blocks the plugin launch boundary.

## Separate, parallel website workstream

Website discovery, design, and possible implementation can proceed alongside plugin V1 under a separate scope and plan. This work can consider an interactive place-discovery map and the broader website experience, its data layers, evidence and limitations, licensing, and operating cost. Plugin V1 already covers text-based candidate-place discovery and night planning in the assistant. Pilot findings can inform later website revisions, but are not a prerequisite for starting.

## Self-review

- **Scope coverage:** Every launch-required user journey, core source, five workflow skills, privacy/operations requirement and public OpenAI plugin directory step maps to a numbered task in the execution plan. Optional feeds and excluded terms are explicitly listed.
- **Task sizing:** The authoritative execution plan names 19 numbered task groups, six independently passable preflight gates, files, consumed/produced interfaces, named verification cases and pass conditions. Feasibility spikes remain stop/go gates because their measurements cannot be known before implementation work begins.
- **Interface consistency:** Shared domain schemas and tool outputs are defined before planner orchestration; host packages and deployment depend on the completed tool inventory rather than placeholder endpoints.
- **Failure coverage:** Invalid location/time, polar dates, ambiguous places, missing/stale/throttled feeds, source disagreement, unsupported events, OSM age/access unknowns and privacy-sensitive location parameters have explicit test or release checks.
- **Proportion:** This document stays at roadmap level. Detailed files, interfaces, tests, and task steps are in the linked execution plan.

## Release decision rules

- The minimum ChatGPT release does not depend on custom UI or an interactive map.
- Do not expose a tool as supported while its implementation returns only a placeholder. Add each tool when its owning task is complete; optional providers may be omitted with a truthful availability state.
- The defined V1 user journeys are the launch contract. A data source can be deferred only if the journey that needs it is clearly marked unsupported or partial; months-ahead climatology is a launch gate because that journey is in scope.
- Treat source accuracy, site access, sky quality and app marketplace approval as unknown until directly validated. Directory inclusion or a public listing does not guarantee prominent placement or demand.

## Plan status

This document is the V1 decision record and roadmap. The step-by-step implementation draft is [2026-10-10-nightsky-v1-execution-ready.md](2026-10-10-nightsky-v1-execution-ready.md). It is ready for owner review and Task 0 source research, not implementation approval. The proposed $25 pilot ceiling, one-off data-build budget, publisher identity, OpenAI project/region, production/staging hostnames, OSM sample region, privacy/legal decisions, monitored support destination, and conditional darkness behavior remain open at their task gates. The product’s global intent is settled; the execution plan defaults to unrestricted OpenAI country targeting (`publication.countries: []`), subject to jurisdiction and platform distribution checks.
