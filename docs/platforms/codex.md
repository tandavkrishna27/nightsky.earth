# Codex distribution and testing notes

**Reviewed:** 13 October 2026. Recheck OpenAI's current plugin packaging rules before submission.

## Product route

The public OpenAI Plugins directory is shared by ChatGPT and Codex. The same portable plugin can bundle skills and a remote MCP server; the Codex app also supports the Codex-specific compatibility manifest where needed. Keep portable workflow instructions in the package skills and transport/data behavior in the MCP server. Do not assume that a skill format used by another assistant is automatically portable.

The local repository's Express MCP route can be exercised with fixture services and MCP protocol tests. This verifies the server contract and deterministic results; it does not establish that a Codex desktop plugin, public directory package, or remote endpoint has been installed successfully. Before any remote test, use a separate staging endpoint, then record the installed package version, host version, tool listing/calls, tool approval behavior, location handling, and source/partial-result display.

## Location and result handling

Ask for a named place if needed. For “near me,” ask before using a host location hint and request a named city when the hint is absent. If the user supplies coordinates, ask them to name the destination and do not reverse-geocode or plan. Keep provider values and valid times separate; state partial, stale, out-of-horizon and unsupported evidence directly.

## References

- [OpenAI plugin package guide](https://developers.openai.com/plugins/build/plugins)
- [OpenAI plugin submission](https://developers.openai.com/plugins/deploy/submission)
- [OpenAI skills](https://developers.openai.com/plugins/concepts/skills)
- [OpenAI Plugins overview](https://developers.openai.com/api/docs/guides/agents-api/tools/plugins)

## Local handoff — 19 October 2026

See the [final local acceptance record](../operations/v1-final-local-acceptance-20261019.md) and [host matrix](host-matrix.md). Local package rehearsals and Codex fixture evidence do not establish hosted ChatGPT, Claude or Gemini acceptance. The optional planning card defaults off; operator enablement and text-only credit limits are documented in the [delivery guide](../operations/v1-planning-card-delivery-20261019.md). Public endpoint/publisher/policy and actual-client checks remain release gates. No vendor eligibility recheck or publication occurred in this pass.
