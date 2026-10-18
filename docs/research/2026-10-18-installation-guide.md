# NightSky installation guide evidence

Reviewed 18 October 2026 for website guidance only. No plugins were changed or installed, no accounts were connected, and no live backend/provider calls were made.

## Primary references

- ChatGPT public plugin installation and device distinctions: https://learn.chatgpt.com/docs/plugins
- ChatGPT manual custom connection: https://developers.openai.com/plugins/build/app-quickstart
- Claude directory installation, custom uploads, paid-plan requirements and local-host limits: https://support.claude.com/en/articles/13837440-use-plugins-in-claude
- Claude remote/local distinctions: https://support.claude.com/en/articles/11725091-when-to-use-desktop-and-web-connectors
- Gemini consumer custom apps, web setup, mobile use and account/geography restrictions: https://support.google.com/gemini/answer/17209137
- Grok connectors, custom address and Business administrator provisions: https://docs.x.ai/grok/connectors

These official pages were fetched during the preceding read-only research turns. They establish platform procedures, not successful NightSky installation on those platforms. UI names and eligibility can change; the page links back to the source for the selected assistant.

## NightSky-specific evidence and limits

The preceding read-only plugin review found no separate NightSky signup/login. Package documentation at `../plugin-v1/docs/operations/local-plugin-package.md` describes host-specific Codex/Claude local rehearsal packages and a separately running backend. Uploading a package does not start that backend or make a computer's loopback address reachable from a cloud assistant.

Public listing URLs remain unset. This change adds blank optional public MCP, Claude ZIP and Codex ZIP settings to `.env.example`. The page accepts only HTTPS on nightsky.earth or its subdomains, exact /mcp for the service, and .zip paths for packages, without credentials, nondefault port, query or fragment. Actual destinations remain unset. Isolated tests use synthetic destinations solely to inspect rendering and copy behavior, without fetching them or downloading anything.

The displayed installation guide is text and a first-response checklist, with no fabricated screenshots. Real installation captures, actual download bytes/version/backend instructions and public endpoint/host acceptance remain required before activating those resources. Actual install-to-tool-result acceptance has not been claimed.

Analytics was discussed but is excluded from implementation. No tracking scripts, signup, provider authentication or backend behavior were added. The new data FAQ describes tool inputs and platform/provider policies without making a no-logging promise.

## Review record

A focused independent plan reviewer found no blockers and requested clear inactive-resource explanations, truthful surface limits, state normalization, explicit tool-result checks and separate native FAQ group names. All are included.

A fresh implementation reviewer found no blockers and one minor modified-click issue in setup links. A regression test reproduced it; Ctrl/Cmd-click now preserves normal browser behavior. A separate direct-link test reproduced missing initial focus; mount focus/scroll was added. Testing then identified combined global scroll padding and section scroll margin; the local margin was corrected. Both tests passed afterward.

An earlier multi-width test captured a blank page once. It passed in the subsequent full 97-test run; the final expanded suite is recorded in the implementation plan. No retry was used to label the failed run green.
