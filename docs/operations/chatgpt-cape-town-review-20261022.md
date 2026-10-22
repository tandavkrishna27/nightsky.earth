# ChatGPT Cape Town submission review — 22 October 2026

## Diagnosis

The first review package treated a coordinates-only request as a negative case. NightSky's `compare_light_pollution` intentionally accepts explicit coordinates, so that prompt can legitimately trigger the plugin. The OpenAI review form defines negative test cases as prompts where the plugin should **not trigger**. The aurora and solar-safety prompts in the current [Cape Town walkthrough](https://youtu.be/9Gl7SneiN4o) are also NightSky-relevant, so the last three video prompts do not demonstrate valid negative cases.

ChatGPT described an HTTP 500 during the coordinates-only prompt. A read-only production report found three `compare_light_pollution` calls on 22 October. Each MCP operation completed with status 200; the latest took 791 ms at 10:57 UTC. The DarkSkySites ledger recorded a reservation and now totals 27 October requests. Application logs do not record upstream response status or error classification, while nginx access logging is off. Thus the host report neither confirms nor rules out an upstream HTTP 500. It confirms that the service was reachable and completed the tool call. No provider retry is justified by this evidence.

## Package correction

Version 1.0.45 keeps the five Cape Town positive cases and replaces the three negative cases with unrelated traffic, hotel-booking and creative-writing prompts. Each expects zero NightSky tool calls. Offline review probes execute the five positive service sequences and validate the three negative case definitions; they do not verify ChatGPT's routing behavior. The photography case does not require `recommend_specialist_tools`, which has a separate portal finding.

The current video supports the five positive cases. It needs a replacement negative-case segment or new recording before final submission. In a normal ChatGPT chat with NightSky connected, run the three negative prompts without explicitly selecting or mentioning the NightSky plugin, and confirm the tool trace has no NightSky calls. Update the package recording URL to the final video before uploading the final ZIP.

## Release decision

This package revision changes review metadata, documentation and offline assertions only. It requires no Hetzner image, container restart, provider-key change or production deployment. The portal's privacy accessibility notice and `recommend_specialist_tools` finding remain for final review. The verified developer must complete the legal and policy attestations and submit the draft manually after the corrected evidence and final portal checks.
