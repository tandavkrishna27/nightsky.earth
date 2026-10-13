# Assistant host compatibility matrix

**Reviewed:** 13 October 2026. The matrix records documented routes and local protocol evidence; it does not claim any live host connection.

| Host and route | Current status | Evidence still required |
|---|---|---|
| ChatGPT public Plugins directory | Conditional on a deployed remote HTTPS MCP endpoint, verified publisher identity, package checks, review and publication. OpenAI documents the public directory as shared with Codex. | Upload the MCP and skills package initially with the production endpoint, pass automated checks/review, publish, then run the prompt cases on an eligible account. |
| ChatGPT developer-mode MCP | Plan/account dependent. Current Help Center documents Business and Enterprise/Edu workspace MCP app workflows; the exact account and region must be checked. | Staging HTTPS endpoint, eligible workspace, tool scan, location-hint behavior, approval UX, partial outputs and exact account/region/date. |
| Codex local protocol tests | Available locally in this repository; MCP transport, schemas and deterministic fixture journeys are covered by automated tests. | This does not prove local plugin installation or a remote MCP session. Record the installed package/host version and tool calls when the package and endpoint exist. |
| Codex public Plugins directory | Same public directory route documented by OpenAI; package requires supported manifest and remote MCP configuration for this service. | Verified package ZIP and production MCP endpoint, directory checks, and live user journey. |
| Claude remote MCP | Official docs support custom remote MCP on Pro, Max, Team and Enterprise, currently described as beta. NightSky has not been connected live. | Verify intended account/region, staging URL, tool/result rendering, location-input behavior and fixture outcomes. Claude-specific skills remain separate work. |
| Gemini consumer Connected Apps | Official docs now describe custom MCP apps, with current eligibility limits: age 18+, personal Google account, US, English, Keep Activity on; availability may vary. NightSky has not been connected live. | Verify eligible account/device, staging URL, explicit app invocation, tools/results, location behavior and fixture outcomes. No global Gemini availability claim. |
| Gemini API / managed agent | Official API docs describe remote MCP registration or custom functions. Separate NightSky-owned application path; not current consumer plugin distribution. | Separate scope, cost/privacy review, API integration and tests if selected later. |

## Shared prompt cases

`tests/platforms/host-cases.json` is the repeatable host-neutral prompt set. It covers beginner stargazing, meteor planning, astrophotography learning, ambiguous places, partial weather, and coordinates without a named place. Each manual host run should record actual calls, returned structured fields, source links, caveats, errors, and host/account version alongside the expected behavior in the fixture. The checked-in fixture validates tool names and expected order; it is not an assistant-model simulation. See the [ChatGPT](chatgpt.md), [Codex](codex.md), [Claude](claude.md), and [Gemini](gemini.md) route notes.

## OpenAI references

- [Plugin submission and package checks](https://developers.openai.com/plugins/deploy/submission)
- [Portable plugin package format](https://developers.openai.com/plugins/build/plugins)
- [ChatGPT developer mode and MCP apps](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt)
