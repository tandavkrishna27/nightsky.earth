# ChatGPT public submission preparation — 21 October 2026

This records the state of the author-supplied NightSky package. It is not a claim that a draft has been uploaded, reviewed or published.

## Verified package and public listing

- Package source: `plugins/nightsky`, version 1.0.43. The builder substitutes the production `https://mcp.nightsky.earth/mcp` URL in the ZIP; the source `mcp.json` placeholder is never the submitted endpoint. The generated rehearsal ZIP has 17 files, one remote MCP endpoint, no `.app.json` or app binding, five positive and three negative cases, and three review prompts. Its 512 × 512 listing logo and 64 × 64 composer icon are contained PNG files.
- Category: `Education & Research`. The listing name, subtitle, descriptions and three default prompts describe the supported product without guaranteeing visibility, weather or site access. No purchase flow is declared.
- Public listing URLs were opened and rendered without login on 21 October: [Get Started](https://nightsky.earth/get-started/), [Contact](https://nightsky.earth/contact/), [Privacy](https://nightsky.earth/privacy/) and [Terms](https://nightsky.earth/terms/). Each returned HTTP 200 and its intended page content. The published Sources and Privacy pages now disclose Public Universe's starter-only production scope.
- Production source behavior: Public Universe exact `bsc5p:hr617` search and selected detail passed through the public MCP. A native Codex conversation subsequently made one search and one selected-detail call across two turns, retained HEASARC credit and distinguished J2000 catalogue coordinates from current apparent position. This is Codex evidence, not a normal ChatGPT conversation test. NASA DONKI and AstronomyAPI remain off.

## Remaining review materials and portal checks

1. Confirm the exact developer display name verified for the intended OpenAI publisher account. The website names Tandav Krishna (TK) as operator; the package deliberately omits `developerName` until the publisher's verified name is confirmed. Check the saved draft's displayed developer name after import.
2. Record a real walkthrough in the intended ChatGPT development or preview connection and host it at a reviewer-accessible video URL. Do not place credentials, keys, private chats or quota files in the recording. The recording has not been made, so `review.demo_recording_url` remains absent. A script or screenshot cannot stand in for it.
3. Verify the intended publisher organization, domain and any required residence or business checks in the submission portal. NightSky itself requires no user login; reviewer credentials should be marked not applicable if the portal permits. Inspect the saved ZIP's imported listing, cases, endpoint, permissions and source review checks before submitting.
4. Run the portal's applicable case validation against the exact saved version. The five positive and three negative package cases are drafted; they have not all been executed in normal ChatGPT. Preserve failed or unavailable outcomes, then fix and reupload a complete ZIP if needed.
5. Have the authorized developer complete legal and policy attestations. Submission for review and later public publication are separate actions.

## Walkthrough to record

Use a clean ChatGPT chat with the development or preview NightSky connection showing the exact packaged version. Capture the plugin identity and these real interactions, pausing long enough for a reviewer to read each tool result and final answer:

1. Ask: “Plan a beginner stargazing session in Hyderabad, India, tonight from 8:30 to 11:30 pm IST. Show calculated darkness and Moon context, the forecast source and exact sample times, and any gaps.” Show the named-place selection and a final answer that does not turn sparse samples into a guaranteed clear window.
2. Ask: “Find the exact starter catalogue reference bsc5p:hr617. Give its selected detail and original catalogue credit, and say whether those J2000 coordinates tell me where to look tonight.” Show the exact search identity and selected revision, then the detail and HEASARC credit. If the detail tool is exposed only on a follow-up turn, ask for the exact selected detail in that same chat; do not repeat search needlessly.
3. Ask: “Can I safely view a solar eclipse through ordinary sunglasses?” Show the refusal and safe-viewing guidance, with no unrelated provider call.

Each new live demo requires its own bounded provider allowance and should be recorded only after confirming the connection and account are ready. A prior two-turn Codex test is evidence for the catalogue path but does not replace a ChatGPT walkthrough.
