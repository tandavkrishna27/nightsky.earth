# V1 outdoor conversation evaluation evidence — 17 October 2026

## Evidence boundaries

Owner-supplied real conversation used older `nightsky@nightsky-local-20261015` and explicitly lacked live tools. Its failure was recommendation intent: observatory first, then a commercial camp whose listing did not establish meteor suitability. It is not an execution trace for current native 1.0.14.

Controlled baseline below used a fresh isolated agent, existing discovery workflow/skill only, no search/provider tools. Supplied candidates were deliberately synthetic: downtown observatory with telescope hours, paid camp north with contact only, and north reservoir with geography only. This is an instruction test, not native host acceptance or real Hyderabad advice.

## Baseline exact answers

### A — closest place, then Hyderabad India

I can’t establish the closest observing place from these results: distances are missing and NightSky’s location tools are disconnected.

The supplied synthetic results describe a downtown observatory with public telescope hours of 6:30–8 pm, a paid tent camp north of Hyderabad, and a northern reservoir. They don’t establish darkness or an open sky; the camp and reservoir also lack verified after-dark access. No source links were supplied for verification.

Are you looking for a telescope visit or an outdoor place to watch the sky?

### B — open sky, then north of Hyderabad for Geminids

Neither northern option is yet verified as an open-sky Geminids spot.

The supplied synthetic results describe a paid tent camp north of Hyderabad with an official contact, and a northern reservoir with geographical information only. Lighting, unobstructed sky and after-dark access remain unknown for both. The downtown observatory doesn’t meet your northern-location request.

Start by contacting the camp to ask whether it permits nighttime meteor watching and has an unobstructed area away from its lights. These are unverified leads; NightSky’s location tools are disconnected and no source links were supplied.

### C — teach meteor photography, phone only

Start by practising a steady sky photo with your phone: capturing a meteor also depends on one crossing the frame during an exposure.

Prop the phone securely, frame a broad patch of sky, and use its timer to avoid shaking it when you tap the shutter. If it has a night mode, try that first. Inspect whether the stars look sharp before attempting repeated photos.

You don’t need a location or date for this first exercise. I haven’t checked a photography source here, so this is general practice guidance, without tailored exposure settings or a promised meteor capture.

## Baseline review

A fails the newly agreed outdoor default by asking the user to choose telescope visit versus outdoor before useful outdoor-first guidance. B preserves direction/activity and unknowns, but still elevates camp contact as the primary next step without establishing observing suitability or learning travel tolerance. C correctly avoids unnecessary location/date and promises; do not mark it failed merely to manufacture a red baseline. These are reviewer judgements, not automated semantic assertions.

## Controlled probe setup and revision limits

Both A/B/C probes used isolated subagents with no parent conversation. Model family/build was not exposed by the agent tool; it is recorded as **unreported**, not guessed. Baseline source was commit `18d1be0`; revised source is the working-tree V1 contract/skills described in this record, packaged as 1.0.15. This limits reproducibility and does not satisfy native-client acceptance.

Exact scenario instructions supplied to both probes: A user “closest place to me”, then “Hyderabad India”; B prior user “open sky?”, then “north of Hyderabad for Geminids”; C user “teach me meteor photography, I have only a phone”. Tools disconnected; host search available but no actual browsing permitted. Synthetic results for A/B: downtown observatory public telescope 6:30–8 pm; paid tent camp north with official contact, night lighting/access unknown; northern reservoir geographical position only, after-dark access/lighting unknown. Do not invent names/facts; label supplied evidence synthetic. Return natural final answers, not review notes. The baseline read existing discovery skill/workflow; revised probe additionally read the shared outdoor contract. No scorecard oracle was provided to these probes.

## Revised exact answers

### A — initial closest-place question

What town or city and country are you starting from?

### A — after Hyderabad India

Hyderabad gives us a starting area, but I can’t identify the closest observing spot without distances and a more local origin. NightSky’s tools are disconnected; these supplied leads are synthetic, not verified recommendations.

- **Area to investigate:** the reservoir north of Hyderabad. Only its geographical position is supplied; sky exposure, lighting and after-dark access are unknown.
- **Optional hosted choices:** the northern paid tent camp has an official contact, but night access and lighting are unknown. The downtown observatory lists a public telescope session from 6:30–8 pm; that doesn’t establish open-sky observing access.

Which neighbourhood or nearby landmark in Hyderabad would you start from?

### B — outdoor Geminids north of Hyderabad

For Geminids, look for a broad, unobstructed sky north of Hyderabad, with little local lighting and confirmed access for your intended observing hours.

From the supplied **synthetic evidence**, there are two leads:

- **Area to investigate:** the northern reservoir. Its position fits your direction, but open sky, lighting and after-dark access are unverified.
- **Optional accommodation:** the northern paid tent camp. Its official contact could answer those questions, but the listing doesn’t establish meteor-viewing suitability.

Neither is a verified observing site. Ask the land manager about sky obstructions, overnight lighting and permitted observing hours before choosing.

How far north of Hyderabad are you willing to travel?

### C — phone meteor photography

Start by practising a steady photograph of the stars with your phone. Capturing a meteor is less predictable, so getting the setup working comes first.

1. Support the phone firmly on a stable surface or phone holder.
2. Frame a broad patch of sky away from nearby lights.
3. If your camera has Night mode, try it with a short shutter timer so tapping the screen doesn’t shake the phone.
4. Inspect the image: if stars look smeared, improve the support before trying again.

Once you can make a steady sky photo, take repeated photographs with the same framing. A meteor needs to cross the frame while the camera is recording; catching one isn’t guaranteed. Exact settings depend on your phone and camera app.

## Additional matrix probe integrity

An initial additional matrix probe accidentally received expected/forbidden oracle fields and was interrupted; no answer from that run counts as acceptance. Its replacement reads a generated projection containing only case ID, context and user turns, plus the workflow instructions. It does not receive the scorecard or expected/forbidden fields. Actual controlled answers and independent review are retained separately. No native pass is inferred.

## Matrix review and package outcome

The blind replacement produced [all eleven case answers](v1-conversation-controlled-answers-20261017.json). An independent reviewer retained [explicit score rows](v1-conversation-controlled-review-20261017.json); the coordinator parsed them through `aggregateReviews(requiredCases, rows)`. Controlled-agent lane: **11 pass, 0 fail, 0 pending**, zero critical failures; nine scored 16/16 and two 15/16. The free/no-camping and chosen-place answers could include more explicit broad-sky/lighting guidance. These minor omissions remain visible rather than rewriting observed answers. Native-host, fixture and owner-observed lanes have no complete new-matrix reviews and remain pending; this does not erase separate existing fixture tests or the owner's baseline report.

Portable package assembly, Codex/Claude local projections, all TypeScript projects, website/server/plugin build and compiled MCP runtime checks passed. Integration exposed a stale raw-canonical comparison in `verify-local-plugin-packages.ts`; it now independently expands the shared contract before comparing, and the command passes. No package-validation condition was removed to mask the failure.

Local rehearsal 1.0.15 at `http://127.0.0.1:8765/mcp` SHA256: `002548365c64e2d4dc97528aeaefed3ff908c5a7df4ffbedfdfca8bfbddda5cc`. Preparation observed fourteen tools, five skills and zero external attempts, then closed the listener. The supported installer updated the same `nightsky@nightsky-native-acceptance-20261017` local plugin to **1.0.15**; no cache was edited. The older `nightsky-local-20261015` identity is not the updated test installation. Installing changed bytes is not native-tool or answer acceptance.

No provider calls, source downloads, deployment or publication occurred in this instruction/evaluation work. Existing full-baseline, events, geography and native-host gates remain V1 work in the fixed tracker sequence.

Final local verification: **1,475 passed, zero failed, two skipped** (1,477 total, 244.2 seconds). The separately rerun scorecard tests include both 13/16 rejection and 14/16 acceptance with no zero dimension. Fresh type checks passed after all source changes. Independent source review found no material blocker; controlled answer review is recorded above. Exact-commit CI is observed after push.
