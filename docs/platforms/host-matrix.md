# Assistant host compatibility matrix

**Vendor-route research:** 13 October 2026. **Local evidence update:** 19 October 2026. Codex local native evidence is recorded below; other client routes remain conditional. Vendor eligibility was not newly rechecked in this local pass.

| Host and route | Current status | Evidence still required |
|---|---|---|
| ChatGPT public Plugins directory | Conditional on a deployed remote HTTPS MCP endpoint, verified publisher identity, package checks, review and publication. OpenAI documents the public directory as shared with Codex. | Upload the MCP and skills package initially with the production endpoint, pass automated checks/review, publish, then run the prompt cases on an eligible account. |
| ChatGPT developer-mode MCP | Plan/account dependent. Current Help Center documents Business and Enterprise/Edu workspace MCP app workflows; the exact account and region must be checked. | Staging HTTPS endpoint, eligible workspace, tool scan, location-hint behavior, approval UX, partial outputs and exact account/region/date. |
| Codex local protocol and native fixture | Installed1.0.36 owner conversation exercised tools, workflow reads, numerical follow-ups and an actual rendered planning card. See the [native record](../operations/v1-owner-native-followup-20261019.md). | Synthetic weather/location acceptance context with real astronomy; not remote production or every provider/logo/client acceptance. Latest display labels additionally have local synthetic-parent visual evidence. |
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
