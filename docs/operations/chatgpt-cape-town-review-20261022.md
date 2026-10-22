# ChatGPT Cape Town submission review — 22 October 2026

## Diagnosis

The first review ZIP described raw coordinates as an entirely unsupported input and expected no tool call. The hosted `compare_light_pollution` tool intentionally accepts explicit evaluated coordinates, while `resolve_place` rejects coordinates and the observing-place workflow asks for a named destination before nearby place discovery. The negative case therefore conflated a supported point comparison with unsupported site discovery.

In the [4:49 Cape Town walkthrough](https://youtu.be/9Gl7SneiN4o), ChatGPT attempted a DarkSkySites lookup on the coordinates-only prompt, reported HTTP 500, and then asked for a named destination. NightSky's adapter maps non-OK HTTP status to unavailable evidence. The recording does not identify why DarkSkySites returned 500. A read-only host log and quota report is pending; no retry or provider request is authorized by this review.

## Package correction

Version 1.0.44 imports the current video URL and aligns exactly five positive and three negative cases with its Cape Town prompts. The third negative case now checks the actual safety boundary: no claim of a verified dark or accessible observing site from a coordinate alone, and no invented brightness when an optional point lookup fails. The photography positive case no longer requires `recommend_specialist_tools`, which has a separate non-blocking portal finding.

Both offline review fixtures passed 8/8 manually scripted server assertions with zero external provider attempts, and TypeScript checks passed. The 17-file ZIP for the existing draft uses `https://mcp.nightsky.earth/mcp` and has SHA-256 `82710e351646422a5fb1d11e5b57b8397f958609ce9975772eb6a65280886f06`. The OpenAI portal displays 1.0.44 as a draft; the MCP connection and domain verification remain configured, and all five skill checks passed. The plugin has not been submitted or published.

## Release decision

This correction changes package review metadata and offline assertions only. It does not require a Hetzner image, container restart, provider-key change, or production deployment. Review the host report before deciding whether the DarkSkySites 500 needs an operational follow-up. The portal's privacy accessibility notice and `recommend_specialist_tools` finding remain non-blocking and visible for human review. The verified developer must complete the legal/policy attestations and submit the draft manually after final review.
