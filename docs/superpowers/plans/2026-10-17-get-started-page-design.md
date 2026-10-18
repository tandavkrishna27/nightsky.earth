# Get Started Page — Design and Delivery Plan

**Status:** User-approved design implemented in the website worktree. Final verification is recorded below. The separate plugin is unchanged.

**Purpose:** Turn `/get-started` into a clear, attractive place to get NightSky and start using it. The website launches alongside the live ChatGPT plugin. The design accommodates additional marketplaces and supported desktop packages without another redesign.

**Scope:** A bounded redesign of the existing website route and its website-side acquisition links. Preserve the current homepage, entrance, audio, navigation styling, Universe animation, other pages, and all separate plugin files/services. This plan does not build an installer, publish a listing, or create a desktop app.

## What is wrong with the present page

- It uses EditorialPage, which is suited to articles: a large title followed by a narrow, left-aligned reading column. That gives a practical setup page too much empty space and too little visual hierarchy.
- While the listing is unpublished, its only installation action disappears. Visitors who clicked “Get NightSky for ChatGPT” meet several paragraphs and a vague “A little more to come.”
- Shared example questions appear as a long typographic list rather than something easy to choose and use.
- There is no coherent place for future marketplaces or client-specific desktop packages.

## Recommended direction

Use a compact introduction followed by one featured live ChatGPT panel, a short setup guide, three useful starter questions, and a small help section. Display other integrations and downloads only when usable. This is an access and setup page for a live product.

An equal-weight platform grid would distract from the primary ChatGPT action. Another cinematic full-height hero would delay the action. The featured-panel approach keeps the established NightSky atmosphere while making immediate access easy to understand.

### Page order and proposed copy

| Order | Section | Content and job |
| --- | --- | --- |
| 1 | Compact introduction | Small “Free forever.” badge; H1 “Get NightSky.”; description “Bring your curiosity to your AI assistant. Start with NightSky in ChatGPT.” |
| 2 | Featured ChatGPT panel | ChatGPT mark, explicit status, H2 “NightSky for ChatGPT,” a short explanation, one main action, and a compact illustrative conversation on the right. |
| 3 | Three setup steps | “Open the listing” → “Follow its setup instructions” → “Start a conversation.” Label this “Your first steps.” |
| 4 | Start with a question | Three short prompt cards with copy buttons, followed by a concise preparation hint. |
| 5 | More ways to explore | Claude and Gemini appear as quieter secondary cards, per the user's implementation clarification. Their actions ask NightSky about access and setup; they do not claim live marketplace integrations. |
| 6 | Help | Three compact disclosures about cost, getting started, and support; a real Contact link. No oversized closing sales section. |

Keep the main ChatGPT status and useful action visible within the initial desktop viewport and as early as practical on a small phone. A visitor should understand what NightSky is, whether they can get it, and what their next action does without reading the entire page.

## Visual design

- Continue the site's existing Cosmic Black `#0C0C0E`, Midnight Blue `#0E1633`, Starlight White `#F2F1EB`, and Meteor Gold `#C2A977`. Playfair Display for the page heading, Inter for instructions and controls.
- Use a dedicated Get Started layout rather than changing EditorialPage globally. Give the top area a soft midnight radial glow and a restrained existing star image; it must work without the image. No new background video or entrance treatment.
- Keep the introduction centered and compact: approximately 60–68px heading on desktop and 40–44px on phones. Aim for 16px body text, readable line lengths, and no tiny setup copy.
- Center the main panel within approximately 1000–1080px. Desktop: information/action on the left, a short conversation illustration on the right. Use a subtle border, a modest 16–20px radius, generous 28–36px internal padding, and a restrained gold emphasis for the primary action.
- On mobile, stack the panel with platform name, status, description and action before the illustration. Use 20px page gutters and about 20–24px panel padding; the button spans the available width. No horizontal carousel or nested scrolling.
- Show an ordinary user question and a short assistant reply in the preview, with a small NightSky activity mark and the label “Illustrative conversation.” Reuse existing educational content, not a live forecast. This preview is compact and static; the homepage already provides the full animated demonstration.
- Present the three steps as a horizontal sequence on desktop and a numbered vertical list on phones. Prompt cards can sit in three columns on desktop and stack on phones.
- Use an explicit “Available on ChatGPT” label. Color alone is insufficient. Do not use “Coming soon,” “Not live yet,” or “Planned” placeholders in the launch page.
- Keep hover and focus treatments quiet and obvious. No autoplay sequence, parallax, endlessly pulsing status, or animated installation progress.

## Featured live ChatGPT panel and configuration safeguards

**Common description:** “Learn about the sky, plan a night outside, and work through creative ideas in conversation.”

| State | Status and action | Expected behavior |
| --- | --- | --- |
| Published with a valid specific listing URL | “Available” + “Open NightSky in ChatGPT ↗” | Opens that official listing in a new tab. A short note says “Opens ChatGPT.” Setup requirements are shown only when verified. |
| Required launch URL or publication setting is missing | Render the real ChatGPT button disabled, with a setup-help action | User confirmed no listing URL is supplied and requested that the button still be built. Keep the page in present tense and provide contact help. Supply the real URL through existing website settings for launch. |
| Configured URL fails validation | Same disabled-button and setup-help state | Prevent an invalid external action, self-loop, fake URL or installation-success claim. Existing validation stays authoritative. |

Retain the existing safe URL validation and publication checks. Do not place a Get NightSky button on `/get-started` that sends a visitor back to `/get-started` as its main action. Do not add a waitlist, email form, or notification promise without a separate working flow.

## First questions and setup guidance

Choose three existing examples covering understanding, exploring, and creating. Use the source questions from questionExamples so the website has one source of truth; the homepage's four-mode content remains unchanged.

- “Why does the Moon matter when watching meteors?”
- “Help me explore a night under the stars.”
- “I want to make my first night-sky time-lapse. Where do I begin?”

Each card has a clear “Copy question” button. On success announce “Question copied” through one polite status region. On clipboard failure, leave the question selectable and explain “Select the question to copy it.” Do not show success before the write resolves. Keep keyboard focus on the initiating control.

Below the cards: “Planning a night outside? Include your place, date and what you want to observe. For photography, mention your camera and lens.”

Keep setup instructions at the truthful level supported today. Do not invent ChatGPT menu names, plan eligibility, one-click installation, or universal setup steps across different clients. Confirm platform-specific instructions against the actual official destination before release.

## Future marketplaces and downloads

**Marketplaces:** ChatGPT is the featured launch integration. The user explicitly requested Claude/Gemini mentions while URLs remain unset, superseding the earlier hide-unavailable recommendation. These secondary cards offer real mailto access/setup questions. They do not contain invented listing links or claims of supported live integration. Do not equate a platform logo with availability.

**Desktop:** Reserve a separate “Desktop integrations” section in the design. Keep it hidden in the initial shipped page until there is a defined supported client and a release artifact. Avoid filling the live page with speculative Windows/macOS/Linux download buttons.

When a package becomes available, show the supported client, package type, relevant operating-system compatibility, actual version, file size and a short setup guide. The button should name the deliverable, such as “Download plugin package.” Only offer an OS selector if separate OS-specific files actually exist. Marketplace access and package download are different actions and must remain labelled distinctly.

The user's desktop idea is treated as a future plugin-package distribution option for compatible clients. A separate standalone NightSky application would need its own product and implementation plan. This website work must not promise that every client accepts the same package or that marketplace integrations work through desktop downloads.

## Website routing and configuration

- Keep `/get-started` as a stable route; do not auto-redirect it to the first available platform.
- Recommended acquisition semantics: generic “Get NightSky” links open this hub; platform-specific “Get NightSky for ChatGPT” links open its verified live listing directly. This hub remains a deliberate platform-selection and setup route. Preserve safe URL validation while implementing the distinction.
- Launch readiness includes supplying the real ChatGPT listing URL and setting its publication configuration correctly. Missing configuration is an engineering issue to resolve before release, not a reason to describe the product as pre-launch.
- Continue to consume the current `VITE_NIGHTSKY_LISTING_PUBLISHED` and `VITE_NIGHTSKY_LISTING_URL` through the existing website resolver. Supply the real URL and publication flag as launch configuration; verify that present-tense copy, requirements and destinations match.
- Add a small website-side platform catalog only as needed for this page: id, display name, marketplace/package kind, available/planned/hidden state, destination, and optional verified requirements. Do not build a generic installation engine or duplicate current publication authority in a second flag.
- New platforms require their own validated destinations. Download entries additionally require actual artifact metadata and client compatibility. No user-controlled redirect destination or automatic download.
- Consider renaming the footer's local setup link to “Get started” for clarity. Keep changes to navigation behavior narrowly scoped; do not redesign the site header again.

## Delivery sequence after design approval

1. **Page composition:** Replace GetStarted's use of EditorialPage with the dedicated compact layout, featured ChatGPT panel and static example. Add scoped styles; preserve other editorial routes.
2. **Useful next actions:** Add the three setup steps, copyable starter prompts with honest failure handling, and concise help disclosures. Render other distribution options only when usable. Design the main experience for immediate access.
3. **Destination states:** Drive actions from the current resolver and verify the live path and missing/invalid-configuration safeguards. Introduce the agreed generic-versus-platform acquisition routing without changing platform publication policy.
4. **Verify and review:** Check desktop/mobile screenshots, keyboard and screen-reader structure, text enlargement, clipboard errors, unavailable external services, link destinations and regressions across the existing website. Leave the updated preview running for review.

Likely implementation surfaces: GetStarted.tsx, scoped index.css rules, page-specific website copy, a small presentational platform panel if useful, and focused browser tests. PluginAction/Navigation/Footer need changes only for the explicitly agreed acquisition-routing distinction. Existing shared listing validation stays authoritative. Separate plugin code remains outside scope.

## Acceptance and design review

- The first screen communicates product, first platform, availability and the next useful action. No article-length introduction or unexplained empty panel.
- The ChatGPT option has clear visual priority. Future options and downloads do not resemble currently available products.
- The intended launch experience has a working direct ChatGPT listing action, present-tense setup guidance, and no pre-launch copy. Missing/invalid configuration is handled safely without fake links or a self-looping primary action.
- After a valid listing is supplied, the platform button goes directly to the right marketplace without a page redesign. Invalid URLs continue to fail safely.
- At 320/390/768/1440px, content reflows without overflow, clipped instructions or hidden actions. Check all relevant text at 200% enlargement, not just the body paragraph. Touch targets are at least 44px.
- Copy status handles success, rejection and unavailable clipboard access. Disclosure/help controls and all links are keyboard reachable with visible focus; status is not conveyed by color alone.
- The page remains readable with decorative media blocked and with reduced motion. No new runtime dependencies or network requirement for rendering its guidance.
- Existing homepage badge, sound control, animated demo, editorial pages, release checks and plugin files/services remain intact.

**Self-review outcome:** The plan targets the joint launch of the website and ChatGPT plugin. The page uses present-tense copy and a direct marketplace action once configured. The button is built without a fabricated URL; Claude and Gemini have honest access-question actions. The real listing URL remains a release input. Separate plugin code remains outside scope.

## Implementation and review record

- Built a dedicated star-backed introduction and featured ChatGPT card with a static illustrative conversation, three setup steps, three copyable starter questions, Claude/Gemini cards and native FAQ disclosures.
- Generic compact “Get NightSky” navigation stays on this hub; platform-specific actions retain the existing safe listing resolver. Footer setup wording is “Get started.”
- Copy actions handle actual success, unavailable/rejected clipboard access, overlapping writes and unmount cleanup. Shared homepage questionExamples remain unchanged; the existing Get Started regression now expects the three approved starter cards.
- URL not supplied by the user: no real website publication setting changed and no external destination invented. The live-link path was verified in an isolated test-server environment with a fixture URL that is never set in actual website configuration.
- Independent read-only code review found no Critical or Important implementation issues. Its touch-target finding was addressed as a mobile acceptance requirement: a browser regression reproduced a target below44px, then passed after a scoped44px minimum was added.
- Desktop and mobile captures at1440/390/320px show the main action in the first viewport, no horizontal overflow, no page errors and no ChatGPT/plugin requests. Artifacts and baseline comparison are retained in `.cache/get-started/`.
- Actual marketplace installation and third-party client compatibility cannot be verified without the real URLs and are outside this website-only request. The page makes no invented claims about them. No plugin files, services, packages or publication operations were touched.
- Final verification after the touch-target fix: **51/51 full website browser tests**, **7/7 isolated live-link browser tests**, **30/30 unit tests**, production build, application/test TypeScript checks, and diff-check passed. Desktop/mobile screenshots refreshed and inspected; the primary action stays in the first viewport at1440/390/320px.
- Preview remains at `http://localhost:5178/get-started`. Real marketplace settings remain unset as requested; the complete ChatGPT button is disabled until the final URL is supplied. No commit or deployment performed.
