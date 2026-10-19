# V1 planning-card delivery — 19 October 2026

## Configuration and scope

The configured standalone backend accepts `NIGHTSKY_PLANNING_CARD_ENABLED=true` or `false`. An absent flag means false. Empty, padded, differently cased and other values fail startup before provider configuration, private quota opening or service initialization. API and legacy discovery branches use the same flag. Existing embedded callers may continue supplying the boolean dependency `resultCardPrototype`; its name and contract are unchanged.

| Runtime configuration | Delivery |
| --- | --- |
| Flag absent or false | Existing text and structured tool results; no planning-card resource advertised |
| Flag true, full tools | Planner advertises the planning-card resource and returns optional card metadata alongside its existing results |
| Flag true, resolver-only | No planner or planning-card resource advertised |

The flag enables presentation only. It does not activate a provider, initialize or reset an account budget, change discovery mode, authorize browser scraping, or add a product database. No provider admission or quota settings were changed.

## Client behaviour and source credits

Text and structured results remain available regardless of the flag. Required source records and notices stay in the tool output; a client without a compatible card view can use that output. This does not guarantee that an LLM repeats every required notice in its final prose. Any requirement that attribution be visible to the user must be checked in the intended host; tool availability alone is insufficient.

The native Codex acceptance screenshot supplied by the owner showed the card and visible credits. That evidence applies to the tested local host and session. It does not establish ChatGPT, Claude or Gemini rendering, all viewport cases, or provider-specific logo compliance. The flag remains default off. Enabling it on a production host should follow acceptance in that intended host, including visible attribution and the text-only fallback. No installed plugin or running host configuration was changed in this implementation pass.

## Verification

- Pure parser: absent/false/true and invalid spellings, whitespace, empty and numeric-like values.
- Configured API and legacy runtime: actual loopback MCP transport for absent/false/true flags and full/resolver-only modes; resource and planner metadata visibility checked.
- Invalid card flag fails before a deliberately invalid weather configuration, confirming validation ordering.
- All injected provider transport is forbidden; the matrix made zero external requests.
- Both new tests failed before implementation (missing parser and missing card metadata), then passed after wiring.

The existing payload, resource, card-view and source-credit tests remain separate coverage. This document records local delivery configuration; it does not claim deployment or publication readiness.
