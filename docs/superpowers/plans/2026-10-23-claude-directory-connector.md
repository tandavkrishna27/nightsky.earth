# Claude Directory Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make NightSky's production MCP connector meet Claude Directory tool metadata and review requirements, then prepare both Claude listings for truthful submission.

**Architecture:** Add human-readable `annotations.title` at the existing registration facade so every core and admitted optional tool receives its current public title without changing its handler. Review descriptions against Anthropic's prompt-injection rules, then verify the live tool inventory and each tool's functional contract with bounded fixture or production inputs. Keep the Claude release branch and ChatGPT deployment pipeline separate.

**Tech Stack:** TypeScript, MCP SDK, Node test runner, GitHub Actions, Claude developer portal.

**Spec:** `docs/platforms/claude-submission-review-20261022.md`; [Anthropic connector checklist](https://claude.com/docs/connectors/building/review-criteria).

## Global Constraints

- Preserve all 19 production tool names, schemas, read-only hints, provider selection, quotas and state.
- Do not call live providers during metadata verification.
- Do not assert that all 19 tools were live-tested until that is recorded per tool; obtain bounded allowance before new quota-consuming checks.
- Do not acknowledge the developer's legal terms or submit either listing until the final draft is reviewed.
- Keep automatic publication off and use scheduled checks for the Claude plugin bundle.

## Review Focus

- A tool with an existing annotation object must retain every hint and gain the same human-readable title as its registration.
- A tool without a registration title must not receive a fabricated annotation title.
- Admitted optional tools must receive annotations through the same registration path as core tools.
- Provider-backed tools must retain their schemas and handlers; metadata changes must cause no provider calls.
- The public connector must expose the reviewed metadata after protected deployment, not merely in a local fixture.

---

### Task 1: Complete tool titles

**Files:** `server/mcp/toolResults.ts`, `tests/mcp/tool-metadata.test.ts`, `tests/mcp/public-universe-tools.test.ts`

**Interfaces:** `boundedToolRegistration(server, retainToolWork)` adds `annotations.title` from each `registerTool` config's human-readable `title` while preserving the existing annotations and callback.

- [x] Add a metadata test that lists core tools and asserts nonempty `annotations.title === title` with unchanged boolean hints.
- [x] Add an optional-tool assertion for the four Public Universe tools.
- [x] Add the registration facade change and verify the focused tests, type check and plugin build.

### Task 2: Review descriptions and product suggestions

**Files:** `server/mcp/registerTools.ts`, `server/mcp/publicUniverseTools.ts`, `server/content/specialistTools.ts`, and a short evidence note under `docs/platforms/` only if a change is necessary.

**Interfaces:** Every description states the tool's function and its valid inputs without instructing Claude to use unrelated tools or external instructions. Product suggestions remain unsponsored, without affiliate links or paid placement.

- [x] Read all 19 production descriptions and identify exact policy-risk phrases against Anthropic's checklist.
- [x] Change only phrases that instruct unrelated model behavior or other-tool calls; preserve scientific limits and input preconditions.
- [x] Record whether specialist-tool results are factual optional recommendations or prohibited promotion.
- [x] Verify the resulting tool inventory and package boundaries offline.

### Task 3: Release and directory review

**Files:** GitHub PR and Claude portal drafts; no provider credentials in source.

**Interfaces:** Production `tools/list` matches the reviewed exact image; connector and plugin bundle use the same NightSky URL and separate listings.

- [ ] Review the diff and obtain exact-commit CI.
- [ ] Publish and promote the image through protected image, staging and production reviews; verify health and 19 tool annotations without provider calls.
- [ ] Reconnect the Claude connector draft and verify the 19 title suggestions clear.
- [ ] Exercise each tool with valid bounded inputs and record the outcome; request a new allowance before live quota-consuming calls.
- [ ] Review all directory disclosures, developer acknowledgements and warnings; submit the connector first, then the plugin bundle, only when all statements are true.

## Self-review

The metadata change is isolated from handlers. The description review and directory submission remain separate gates, so an annotation fix alone cannot be mistaken for full connector acceptance. The final live checks require a fresh quota allowance and owner review of legal acknowledgements.
