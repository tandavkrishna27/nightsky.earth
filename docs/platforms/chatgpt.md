# ChatGPT distribution and testing notes

**Reviewed:** 13 October 2026. Recheck OpenAI's current package and directory rules before submission; the public directory and product surfaces can change.

## Product route

NightSky is a remote MCP service with shared skills. OpenAI's current Plugins directory accepts packages containing MCP connections, skills, or both; the public directory is shared by ChatGPT and Codex. Public submission requires a verified individual/business identity and a package ZIP. A plugin with an MCP server must include it in the initial package upload; the current submission guide says a skills-only plugin cannot later be converted by adding an MCP server. Submit the endpoint through the “With MCP” route after the remote HTTPS service is ready.

The current developer-mode MCP connector workflow is a separate private testing path. OpenAI's Help Center currently documents developer-mode MCP apps for ChatGPT Business and Enterprise/Edu workspaces; availability and controls vary by plan. Pro users can connect read/fetch MCPs in developer mode, while full MCP support is limited to the documented workspace plans. Verify the actual account and region before relying on this path. ChatGPT connects to a remote MCP server; a local-only endpoint requires a supported tunnel or a deployed HTTPS host.

## Local and hosted test boundary

Local verification currently covers MCP initialization, tool listing, structured tool calls, place-to-plan flows and fixture-injected provider failures without external network access. It does not prove ChatGPT connector compatibility. After the staging and production endpoints exist, test developer mode with the host matrix and record account plan, region, date, exact server URL, tool scan, location behavior and partial-result handling. Do not place production secrets in the package ZIP.

## Required location behavior

For “near me,” use an explicit location hint only when the user asks for their current area and the host supplies it. If absent, ask for a named city. Ask the user to resolve ambiguous place names. If they give coordinates, ask them to name the destination; do not reverse-geocode coordinates or create a plan from them. Follow the data-flow contract for sensitive location and call metadata.

## References

- [OpenAI plugin submission](https://developers.openai.com/plugins/deploy/submission)
- [OpenAI plugin package guide](https://developers.openai.com/plugins/build/plugins)
- [OpenAI plugin skills](https://developers.openai.com/plugins/concepts/skills)
- [ChatGPT developer mode and MCP apps](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt)
- [Remote MCP app review](https://developers.openai.com/plugins/deploy/app-review)
