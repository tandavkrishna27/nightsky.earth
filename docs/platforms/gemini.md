# Gemini remote MCP route

**Reviewed:** 13 October 2026 from Google's official Gemini Apps Help and AI for Developers documentation. Recheck rollout and eligibility before launch.

## Consumer Gemini Apps

Google's current help article documents adding a custom app by entering its MCP server URL in Gemini web Connected Apps; after connection it is available on Gemini web and mobile. The current requirements in that article are: age 18 or older, personal Google Account, United States, English, and Keep Activity enabled. Custom apps are unavailable for work or school accounts under the current instructions. Google says availability also varies by location, language, device, and Gemini app. Users should explicitly invoke a connected app when needed (for example, `@` and selecting it).

NightSky's public read-only Streamable HTTP MCP endpoint is a plausible route because Google requires a server following the standard MCP specification and exposes its URL as the setup input. The article also describes advanced credential entry when a server does not support Dynamic Client Registration. NightSky currently needs no user credentials. This is documented consumer-app support subject to the requirements above, not proof that the NightSky server has been connected or passed a live test.

## Gemini API / managed-agent route

Google's developer documentation separately describes registering remote MCP servers or custom functions with Gemini API managed agents. This requires a NightSky-owned integration that configures the server and passes tool calls/results through the API. It is not the same distribution path as a consumer Connected App and would add a separate application/runtime, account setup, cost and privacy review. It is not included in the current consumer plugin implementation.

## Setup and verification

When a staging URL exists and the tester meets Google's current eligibility rules, add NightSky through Gemini web **Settings → Connected Apps → Custom apps** and enter the staging MCP URL. Confirm it appears in web and mobile, invoke it explicitly, and record account country, language, device, app version, Keep Activity setting, date, endpoint, tool listing, outputs, source links, and errors against `host-cases.json`. Test ambiguous and coordinates-only requests, partial weather, source separation, and the required user invocation behavior. If an eligibility requirement cannot be met, mark the consumer route conditional for that test market.

## Skills and global availability

Gemini consumer Connected Apps expose MCP tools; this does not establish that OpenAI skill files are imported as Gemini skills. Keep workflow guidance in host instructions or implement/test a Gemini-specific format separately. The current US/English/account restrictions mean NightSky cannot claim a globally available Gemini consumer app from this route.

## References

- [Google: Connect and manage custom apps for Gemini Apps](https://support.google.com/gemini/answer/17209137)
- [Google: Use and manage Connected Apps in Gemini](https://support.google.com/gemini/answer/13695044)
- [Google AI: Using tools with Gemini API](https://ai.google.dev/gemini-api/docs/tools)
- [Google AI: Building managed agents](https://ai.google.dev/gemini-api/docs/custom-agents)
