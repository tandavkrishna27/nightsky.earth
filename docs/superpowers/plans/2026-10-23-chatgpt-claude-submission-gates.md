# ChatGPT and Claude Submission Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare an evidence-backed ChatGPT replacement and a Claude directory submission without weakening NightSky's source, quota, or safety behavior.

**Architecture:** Keep one shared MCP service, but treat the ChatGPT ZIP and Claude connector/bundle as independent release artifacts. Fix source behavior first, deploy through image publication and protected staging/production, then validate each platform's exact saved draft. Preserve the current ChatGPT review until a corrected package and live server are ready.

**Tech Stack:** TypeScript MCP server, GitHub Actions, Hetzner Docker/nginx, OpenAI Platform plugin portal, Claude directory portal.

**Spec:** `docs/platforms/chatgpt-submission.md`, `docs/platforms/claude-submission-review-20261022.md`, and current platform policy pages linked there.

## Global Constraints

- Do not reset provider quota counters, print credentials, or retry Public Universe solely to obtain a passing demo.
- Keep GitHub protected environment reviews and exact image digests in the release chain.
- Keep current ChatGPT version 1.0.45 in review until the replacement ZIP and portal checks are ready; cancellation loses its queue position.
- The developer personally reviews and accepts submission attestations; an automated agent does not attest on their behalf.
- Treat the OpenAI specialist-tool finding as unexplained until review feedback identifies its cause.

## Review Focus

- A valid specialist-tool call must not advertise paid digital products or redirect a user away from the requested NightSky task.
- A removed or narrowed tool must not remain referenced by packaged skills or test cases.
- Public Universe timeout must not silently consume repeated quota or be represented as a successful catalogue lookup.
- Claude's visible tool inventory and the tested inventory must be identical at submission time.
- A prepared ZIP or portal draft must not be described as approved or published.

## 23 October decision and evidence

- The developer chose to retain Public Universe tools while its upstream public data connection is affected. No catalogue tool or quota state will be removed to accelerate Claude submission.
- The corrected ChatGPT 1.0.46 ZIP is built for `https://mcp.nightsky.earth/mcp` with 13 core tools in source. Its exact ZIP hash is recorded in `dist/plugin-1.0.46-review/package-report.json` (local, ignored artifact). Offline review cases passed: five positive probes and three negative definitions; ChatGPT routing remains unverified.
- The existing ChatGPT 1.0.45 portal entry remains **In review**. The portal currently disables **Cancel review**. Its live MCP scan still lists `recommend_specialist_tools` because the source change has not been deployed.
- Anthropic's connector checklist requires every exposed tool to return a successful result and to be exercised through MCP Inspector and native Claude. The four Public Universe tools have not met that gate while the upstream service reports a connection issue. The connector draft remains unsubmitted.

---

### Task 1: Audit the ChatGPT specialist tool

**Files:** `server/mcp/registerTools.ts`, `server/content/specialistTools.ts`, packaged ChatGPT skills and review cases.

**Interfaces:** Produces the exact live MCP tool inventory and a policy-safe recommendation behavior or a justified removal.

- [x] Compare tool metadata and returned products against current OpenAI commerce, advertising and intent rules.
- [x] Remove paid-product promotion from the MCP output, or remove the tool from the live inventory if a narrow useful function cannot be supported.
- [x] Update packaged skills and review cases to match; verify no references to a removed tool.
- [x] Inspect the built ZIP and its manifest, then run the relevant checks on the exact artifact.

### Task 2: Resolve Claude's Public Universe reliability gate

**Files:** `server/providers/publicUniverse/transport.ts`, `server/mcp/publicUniverseTools.ts`, Claude review matrix.

**Interfaces:** Produces a classified upstream outcome and an evidence-backed decision to retain or defer the four Public Universe tools for Claude.

- [x] Inspect diagnostic phases, timeout handling, quota reservation, and the provider's current public service notice without making an upstream request.
- [ ] If the provider recovers, run one newly authorized bounded request and record outcome and quota delta. If it remains unavailable, prepare a release profile that omits the four Public Universe tools from Claude's exposed inventory without changing production quota files.
- [ ] Exercise every tool in the resulting Claude inventory through MCP Inspector and a native Claude connector, recording valid input and observed result.

### Task 3: Release and verify shared server changes

**Files:** changed source, release manifests, operations receipt.

**Interfaces:** Produces a verified production image digest and exact live MCP inventory.

- [ ] Review source diff and exact-commit CI.
- [ ] Publish the image and promote the same digest through protected staging and production reviews.
- [ ] Verify public health, inventory, safe error behavior and quota file continuity.

### Task 4: Prepare platform drafts independently

**Files:** ChatGPT submission ZIP; Claude small release branch and connector draft.

**Interfaces:** Produces a reviewable ZIP/draft and a Claude portal validation report.

- [ ] Rebuild ChatGPT ZIP from the verified source; inspect listing, five positive/three negative cases, URLs, demo and reviewer access.
- [ ] Only after the corrected ZIP is ready, seek explicit approval to cancel the active ChatGPT review; upload replacement draft and recheck connection, scans and imported cases before the developer resubmits.
- [ ] Validate Claude's connector and plugin bundle at the exact release commit; clear blocking findings and prepare screenshots and example prompts.
- [ ] Present the developer with the exact remaining portal attestations and submit controls. Do not mark either listing submitted or approved without the portal state.
