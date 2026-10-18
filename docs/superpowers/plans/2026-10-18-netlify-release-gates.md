# Netlify Release Gate Resolution Plan

> **For agentic workers:** Execute this plan in the website worktree; do not edit the MCP/plugin worktree.

**Goal:** Make the website release build pass with accurate, owner-approved source, hosting, rights and policy facts.

**Architecture:** Update website policy copy, source coverage, rights inventory and release facts to reflect the owner's launch decisions. Remove OSM from launch coverage, record Hetzner Helsinki and the adopted minimal logging/retention policy without claiming the MCP service is already deployed, and keep optional sources clearly conditional until their Free-plan rights and activation checks are complete.

**Tech Stack:** TypeScript/React, Vite, Node test runner, Netlify release build.

**Spec:** Owner decisions in this conversation: OSM is dropped; Hetzner region is Helsinki; use a minimal, redacted logging policy and follow general production safeguards; use Free plans only; audience is 18+; approve and record the release facts.

## Global Constraints

- Website worktree only; leave every plugin/MCP file, account, secret and deployment unchanged.
- Never claim Hetzner is deployed or its controls are operationally verified before deployment.
- Do not include OSM in launch sources or claims.
- Do not imply that “Free plan” removes a provider's attribution, licensing, caching or quota requirements.
- Do not change Netlify from `npm run build:release` or bypass the release gate.

## Review Focus

- Privacy wording must distinguish website requests from connected MCP calls and identify conditional providers accurately.
- Provider data terms must not be simplified to “free to use” without their required attribution and product conditions.
- The future Hetzner logging policy must be explicit while the service's not-yet-live status remains clear.
- Source inventory and rights register must agree with public Sources & Coverage content after OSM removal.
- Release approvals must have valid dates, and the release build must still reject incomplete facts in tests.

---

### Task 1: Align launch source and rights records

**Files:** `client/src/content/releaseFacts.ts`, `client/src/content/sourceCoverage.ts`, `docs/website/source-and-rights-register.md`, `docs/website/release-checklist.md`

- [x] Remove the retained OSM candidate index from launch inventory and user-facing coverage; document the owner's exclusion decision and Geoapify's separate OSM credit requirement.
- [x] Correct the 7Timer terms summary from stale noncommercial-only wording to current provider guidance.
- [x] Keep WeatherAPI conditional on Free-plan confirmation; keep OpenWeather disabled pending exact product-license review.
- [x] Record sources used by website content and conditional plugin features, with scope and current limits.

### Task 2: Align Privacy and Terms with approved operations

**Files:** `client/src/pages/SupportingPages.tsx`, `client/src/content/sourceCoverage.ts`

- [x] Record the 18+ audience, no persistent NightSky query history, provider-specific data flow, no analytics tracker, and Netlify's plan-dependent log availability.
- [x] Record Hetzner Helsinki as the selected future MCP region and specify the adopted 7-day, content-free operations-log policy without claiming it is deployed.
- [x] Distinguish prebuilt ERA5 summaries from live upstream calls and disclose only services actually used or explicitly conditional.
- [x] Keep the Terms' current price language and effective date consistent with the user's approval.

### Task 3: Record approvals and verify release

**Files:** `client/src/content/releaseFacts.ts`, `docs/website/release-checklist.md`

- [x] Record dated owner approvals for source inventory, hosting facts, content rights and policies after Tasks 1–2 are complete.
- [ ] Run release-facts tests and `npm run build:release`.
- [ ] Inspect generated robots/sitemap headers and the full website diff; confirm the plugin worktree remains untouched.

