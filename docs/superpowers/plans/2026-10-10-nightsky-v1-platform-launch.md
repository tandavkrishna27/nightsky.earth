# NightSky.earth V1 Assistant Platforms, Operations and ChatGPT Launch Plan

> **Historical work-package notes:** Use [the V1 execution plan](2026-10-10-nightsky-v1-execution-ready.md) as the sole implementation checklist. This file preserves earlier platform/launch discussion; verify its steps against the current official submission requirements before use. Submission and publication remain distinct owner decisions.

**Goal:** Package NightSky's shared MCP service for assistant hosts, validate local use, deploy a stable public endpoint and carry the ChatGPT plugin through public review and publication.

**Architecture:** Keep data and tool schemas host-neutral. Package repeatable workflows using each host's supported mechanism; document differences instead of promising one portable skill bundle. Deploy the MCP service at a stable HTTPS URL and submit a clean current plugin package through OpenAI's current directory flow.

**Tech stack:** Current NightSky TypeScript service, official MCP SDK, ChatGPT plugin package format, Claude remote MCP connector and Gemini route only where custom MCP is available to intended users. Use the platform's current package validator and official public submission portal.

**Spec:** [Product scope](../../product-scope-v1-v3.md). This plan depends on the [core service](2026-10-10-nightsky-v1-core-service.md) and [user workflows](2026-10-10-nightsky-v1-workflows.md); sequence is in the [master plan](2026-10-10-nightsky-v1-implementation-reviewed.md).

## Global constraints

- ChatGPT is the first product test target. The public OpenAI plugin directory is shared by ChatGPT and Codex, so test the supported ChatGPT and Codex surfaces before public submission; the same MCP tools are the cross-platform foundation.
- A local MCP connection, public HTTPS deployment, directory review and publication are distinct milestones.
- Do not publish secrets, private credentials, unverified claims or a local/testing endpoint.
- The initial plugin is read-only and anonymous unless an actual user-specific capability later requires authentication.
- Collect minimum disclosed service metrics; no exact coordinate logging or user-location history by default.
- User approval is required immediately before public submission and separately before publishing after approval.

## Review focus

- Clean checkout setup and local test flow work on Windows and a Linux deployment.
- The plugin package matches current OpenAI package rules and contains the working MCP server mapping and skills.
- Host-specific behavior is tested instead of inferred from shared MCP support.
- Public listing pages and review cases are complete before submission.
- Public launch monitoring and pilot measures do not equate tool calls with unique people.

## File responsibilities

| Path | Responsibility |
|---|---|
| plugins/nightsky/ | Plugin package, current manifest, MCP connection configuration and five workflow skills. |
| docs/platforms/chatgpt.md | Local connection, testing, packaging and public directory steps. |
| docs/platforms/claude.md | Remote MCP connector setup, account/region limits and tested workflow behavior. |
| docs/platforms/gemini.md | Consumer Gemini custom MCP availability and alternative product route, clearly distinguished. |
| docs/operations/deployment.md | Host decision, environment, start/build commands, health, logs and rollback. |
| docs/operations/privacy-and-telemetry.md | Data sent/retained, location handling, disclosure and metric definitions. |
| docs/operations/source-spikes.md | Optional provider and hosting results/decisions. |
| client/src/pages/Privacy.tsx, Terms.tsx and Support.tsx | Public listing and user-support destinations. Reuse existing Contact page only if it satisfies support requirements. |
| .github/workflows/ci.yml | Repeatable install, typecheck, test and build checks. |

## Tasks

### Task 1: Author five workflow skills and host-neutral prompt fixtures

**Files:** Create plugins/nightsky/skills/find-observing-place/SKILL.md, plan-stargazing-night/SKILL.md, plan-astrophotography/SKILL.md, plan-sky-event/SKILL.md, prepare-outing/SKILL.md; create tests/platforms/skill-tools.test.ts and tests/platforms/prompts.json.

- [ ] Each skill must state its trigger, minimal follow-up questions, exact tool names, sequencing, source/time handling, partial-data behavior and unsupported cases.
- [ ] Add positive prompts for beginner night, meteor shower, astrophotography, telescope target, aurora/eclipse, and month-ahead trip; add negative prompts for ambiguous place, unavailable provider and unsupported event.
- [ ] Check every referenced tool against the completed MCP inventory and check the five workflows against the scope matrix.
- [ ] Verify there is no duplication of provider facts in skills that could drift from server output.
- [ ] Run skill/package validation and prompt tests.

### Task 2: Build the local OpenAI plugin package and test the first journey

**Files:** Create root plugins/nightsky/plugin.json, root plugins/nightsky/mcp.json and any current OpenAI extension metadata required by the official format; create/update docs/platforms/chatgpt.md. A local ChatGPT Work compatibility package may also use .codex-plugin/plugin.json, .mcp.json and a registered .app.json mapping.

- [ ] Follow the current OpenAI Agent Plugins package guide rather than a legacy GPT Actions or old plugin manifest. Keep root plugin.json and mcp.json for the portable package; do not merely rename the local .mcp.json because the portable schema also declares transport type.
- [ ] Package the five skills and remote MCP configuration; keep OpenAI-only metadata isolated from the core service.
- [ ] Run the MCP server locally and connect through MCP Inspector. For ChatGPT Work testing, create a personal custom MCP connection using a temporary HTTPS tunnel, then add the resulting server connection to a local/repo plugin package if testing bundled skills. A private localhost URL is not reachable from the hosted ChatGPT client.
- [ ] In fresh ChatGPT and Codex sessions, run beginner, meteor, photo and partial-provider prompts; record actual tool calls, structured results, citations, errors and host-specific behavior.
- [ ] Confirm the same five packaged skills load and are discoverable on both supported OpenAI surfaces, or document any surface-specific limitations before claiming parity.
- [ ] Confirm no public directory submission or user-facing public availability is implied by this local test.

### Task 3: Verify Claude and Gemini routes separately

**Files:** Create docs/platforms/claude.md and docs/platforms/gemini.md; create/update tests/platforms/host-compatibility.md.

- [ ] Connect the same remote MCP endpoint to a real Claude account available to the owner; test the same representative journeys and record account/plan/region requirements.
- [ ] Check the intended Gemini consumer account for custom MCP availability. If not available, label the consumer plugin route unavailable and describe the Gemini API/NightSky-owned experience as a separate future product.
- [ ] Record per-host support for MCP tools, workflow instructions/skills, location context, structured results and installation/distribution; list actual limitations. Include ChatGPT and Codex results from Task 2 in the same matrix.
- [ ] Claim cross-platform support only for routes tested successfully. Tool-core portability does not prove marketplace listing or skill portability.

### Task 4: Prepare product privacy, support and terms pages

**Files:** Create client/src/pages/Privacy.tsx and Terms.tsx; create client/src/pages/Support.tsx or replace the existing Contact page's nonfunctional form with a clearly monitored support channel; add routes/navigation and link them from docs.

- [ ] Describe coordinates sent to the service/providers, retention/logging, caches, metrics, third-party assistant handling and deletion/contact path in plain language.
- [ ] Publish a working privacy policy URL, terms URL, product website URL and support URL; verify each is publicly reachable over HTTPS.
- [ ] Verify the support destination is monitored. The current Contact form only logs submissions in the browser and must not be presented as a working support form until it actually delivers messages.
- [ ] Remove legacy product claims that imply community spot contributions or premium guided experiences are part of this V1 planner.
- [ ] Do not claim certifications, site safety, forecast accuracy or platform availability that were not verified.

### Task 5: Choose and validate the production MCP host

**Files:** Create docs/operations/deployment.md and tests/operations/provider-failure.test.ts; modify netlify.toml only if the selected host supports the verified MCP runtime.

- [ ] Compare the current static Netlify configuration and existing Node/Express deployment route against one or more Node-capable hosts. Measure process lifecycle, stateless/session transport behavior, HTTPS, cold starts, rate limits, logging and the monthly cost ceiling; record a go/no-go decision before building the production deployment.
- [ ] Choose and document the host, exact production MCP URL, environment variables, deployment command, secret storage, rollback and health-check behavior.
- [ ] Add a health endpoint that reveals no secrets or user location; rate-limit anonymous requests and avoid logging full tool arguments/coordinates.
- [ ] Add provider timeout, malformed payload, stale cache, health-secret and location-free logging tests.
- [ ] Check the existing npm scripts for cross-platform behavior. The current dev/start scripts use POSIX-style NODE_ENV assignments; remove that shell dependency or use a cross-platform method, then verify npm run dev, npm start, npm run check, npm test and npm run build on Windows and Linux.
- [ ] Deploy a staging endpoint and run MCP Inspector plus real ChatGPT, Codex and Claude client checks before declaring the host ready.
- [ ] Add $25/month alerts/limits and test provider degradation. If stable hosting cannot meet the ceiling, stop and revise the hosting plan before public submission.

### Task 6: Assemble a review-ready public ChatGPT plugin package

**Files:** Update plugins/nightsky/plugin.json and MCP package metadata; create docs/platforms/chatgpt-submission.md; include exact public assets in the package.

- [ ] Verify current developer identity, organization permissions and project data-residency eligibility needed to submit; note these are account prerequisites, not application code.
- [ ] Confirm the public MCP endpoint is a real publicly accessible HTTPS URL, complete the portal's domain-verification challenge, and verify the tool scan returns complete schemas/annotations/instructions.
- [ ] Include listing name/logo/descriptions, website/privacy/terms/support URLs, source and privacy explanations, localization and release notes as required by the current portal. All four URLs must be working HTTPS pages for the MCP app.
- [ ] Prepare exactly five positive and three negative test cases for initial MCP review on the single MCP server. Positive cases cover beginner plan, meteor shower, astrophotography, telescope/target and historical-climate journeys. Negative cases cover ambiguous location, unsupported event and provider outage/partial result. Each positive case names the user prompt, expected tools and observable behavior; each negative case names why the plugin should clarify, decline or return a safe fallback.
- [ ] Record an accessible reviewer video walkthrough demonstrating the plugin and review cases, and include its URL plus release notes in the submission metadata.
- [ ] Keep credentials/reviewer instructions out of the ZIP; use the portal's secure reviewer fields if credentials ever become necessary.
- [ ] Validate the portable package and resolve blocking findings. The public ZIP must not contain registered-app references (`apps` / `.app.json`) or lifecycle hooks; configure the remote MCP server in the portable root `mcp.json` and keep local-only wiring separate.
- [ ] Produce a review-ready checklist and package artifact for the owner to inspect. Do not submit in this task.

### Task 7: Submit, complete review and publish after approval

**Files:** Update docs/platforms/chatgpt-submission.md with the actual result and review feedback.

- [ ] Owner reviews the listing, package, test cases, privacy/terms pages and public MCP URL, then explicitly authorizes submission.
- [ ] Submit the selected draft through the current OpenAI plugin submission portal.
- [ ] Track automated/manual review findings; fix package/server issues and resubmit as requested.
- [ ] After approval, pause for the owner's separate confirmation before selecting Publish.
- [ ] Once published, verify the exact universal directory listing URL and install from the directory in fresh ChatGPT and Codex sessions; record actual availability and analytics shown by the platform.
- [ ] Do not describe approval, directory prominence or acceptance as guaranteed.

### Task 8: Run an invited pilot and evaluate product evidence

**Files:** Create docs/operations/pilot-measurement.md; update docs/operations/privacy-and-telemetry.md.

- [ ] Track only metrics actually available: directory installs if shown, first successful plan where observable, tool success/error, latency, provider coverage, referrer clicks and voluntary plan usefulness/return-use feedback.
- [ ] Distinguish installs, activations, MCP calls and unique users; do not infer one from another.
- [ ] Do not add persistent user identifiers for retention analytics without a separate privacy/product decision.
- [ ] Ask pilot users where they still had to switch apps, whether they acted on the plan, which source gaps mattered and whether they would use it again.
- [ ] Review the $25/month ceiling and failure reports before describing V1 as ready for broader release.

## Current OpenAI references

- [Plugin architecture](https://developers.openai.com/plugins/concepts/plugins)
- [Package a plugin](https://developers.openai.com/plugins/build/plugins)
- [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server)
- [Connect and test in ChatGPT](https://developers.openai.com/plugins/deploy/connect-chatgpt)
- [Upload and submit a plugin](https://developers.openai.com/plugins/deploy/submission)
- [Remote MCP review requirements](https://developers.openai.com/plugins/deploy/app-review)
- [Plugin submission errors](https://developers.openai.com/plugins/deploy/submission-errors)
- [Current plugin submission checklist and public directory behavior](https://developers.openai.com/plugins/deploy/submission)

## Platform and launch acceptance

- Local end-to-end use succeeds in ChatGPT and Codex before the service is deployed publicly.
- Claude and Gemini status is based on actual intended-account checks, with gaps written plainly.
- One public HTTPS MCP endpoint has operational, privacy, source, rate-limit and budget checks.
- The public plugin ZIP passes current package validation and carries all review materials, including exactly five positive cases, three negative cases, a reviewer video URL and release notes; the MCP domain is verified and the hosted tool scan has no blocking findings.
- Submission, approval and publication are recorded as distinct states; owner authorization gates the external submission and publication actions.
- The public pilot has meaningful usefulness measures that respect the no-account/no-location-history V1 boundary.
