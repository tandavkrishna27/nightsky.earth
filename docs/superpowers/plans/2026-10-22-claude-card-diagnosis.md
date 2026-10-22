# Claude planning card diagnosis implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Do not infer a renderer defect from a successful generic `resources/read` event.

**Goal:** Identify whether Claude fetches NightSky's planning-card resource, then make the minimum verified compatibility change without disturbing ChatGPT's card or production provider behavior.

**Architecture:** Add a fixed, non-sensitive resource-class label to MCP request diagnostics. Use it to separate card fetch, unrelated resource reads, and no fetch. Existing textual tool results remain available while the card issue is investigated. Make a protocol change only after the diagnostic identifies the failing boundary.

**Tech Stack:** TypeScript, Express, MCP SDK, Node test runner, GitHub Actions.

**Spec:** `docs/platforms/claude-submission-review-20261022.md` and the MCP Apps 2026-01-26 specification.

## Global constraints

- No raw resource URI, request body, coordinates, credentials, or provider response in logs.
- No new provider calls for the diagnostic. Do not retry the saved Claude planning call.
- Do not change the ChatGPT tool metadata or card output in the diagnostic step.
- The Claude directory listing remains a draft until native acceptance passes.

## Review focus

- An unknown `resources/read` URI must log only `other`, not user-supplied text.
- A malformed or missing URI must log only `other`.
- The exact planning-card URI must log `planning-card`.
- The resource class must remain identical on ingress and completion.
- Diagnostics must never alter response status or admission.

## Task 1: Identify the resource class safely

**Files:** `server/mcp/requestDiagnostics.ts`, `tests/mcp/native-admission.test.ts`.

- [x] Add tests for exact card URI, unknown URI, malformed URI, and safe event shape.
- [x] Run the focused test and confirm it fails for the missing resource class.
- [x] Implement a closed enum label on `resources/read` events, preserving the existing event fields and status behavior.
- [x] Run the focused test, type check, and MCP card smoke test.
- [ ] Commit the diagnostic change and create a PR. Review its exact diff and CI before merging.

## Task 2: Observe the saved Claude card without provider calls

- [ ] Promote the diagnostic through the existing image and protected deployment workflow after its checks pass.
- [ ] Reload the saved Claude conversation once; do not resend the prompt or click Retry.
- [ ] Compare the safe `resources/read` class/status with the Claude UI. If the host does not refetch saved apps, stop and choose a synthetic no-provider fixture for the next probe.
- [ ] Record the result in the Claude submission review, including any remaining uncertainty.

## Task 3: Change only the failing boundary

- [ ] If Claude does not fetch the card, inspect UI capability negotiation and tool metadata against the MCP Apps specification; implement a text fallback for unsupported hosts.
- [ ] If it fetches the card and returns 200, inspect app initialization/rendering and fix the smallest reproducible mismatch.
- [ ] Verify offline protocol tests, then stage and run one bounded native Claude acceptance. Keep the listing in draft until it passes.
