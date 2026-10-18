# Approved Homepage Mock Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. The user approved implementation of the reviewed mock in this session; proceed locally without an additional approval round.

**Goal:** Implement homepage concept 03 and verify it against the separate mock on desktop and mobile.

**Architecture:** Reuse the website worktree and existing experience, routing and calendar providers. The journey owns its selected example and coordinates the image and animated conversation. A homepage-specific event preview consumes the existing projected calendar data; detailed Sky Events cards remain unchanged.

**Tech Stack:** React, TypeScript, CSS, Playwright; existing dependencies only.

**Spec:** User-approved `homepage-flow-v3.html`, at `C:/Users/TK/.codex/visualizations/2026/10/17/01a14998-808b-78c1-84cd-347e4f761e65/.superpowers/brainstorm/10026-1792256288/content/homepage-flow-v3.html` and the discussion in this chat.

## Global Constraints

- Website only; do not modify or invoke the plugin.
- Keep centred hero, existing welcome/session/audio behaviour and full footer navigation.
- Sequence: hero, combined Journeys, events, Collective, FAQs, closing invitation, footer.
- Journey choices: Plan a night, Capture the sky, Explore an event, Ask a question.
- Chat header recognises ChatGPT, Claude and Gemini with NightSky.earth plugin branding; conversation remains explicitly illustrative.
- Motion plays once, supports pause/replay, freezes offscreen and under the welcome overlay, and becomes a readable full transcript under reduced motion or missing observer APIs.
- Event previews show prominent day/date, category, short synopsis and individual guide link; mobile uses native horizontal snapping plus arrows and position. Retain timezone, approximate date and ongoing activity semantics.
- Collective includes Observe, Create, Learn, Conserve and one community link. FAQs have no extra Get Started link in their introduction.
- Keep unset marketplace configuration unset. Local changes only, no commits, publishing or deployment.

## Review Focus

1. Reduced motion, missing APIs, media errors and welcome overlays must not conceal information or start unwanted audio.
2. Rapid topic changes and pause/replay must never mix conversations or move the page unexpectedly.
3. Mobile swiping, keyboard navigation, resized and enlarged text must remain accessible without page overflow.
4. UTC instants, approximate ranges, month/year boundaries and ongoing activity must retain correct date meaning.
5. Existing Get Started, detailed calendar, footer anchors and replay welcome must still work.

### Task 1: Combined journey and homepage structure

**Files:** `client/src/pages/Home.tsx`, `client/src/components/home/QuestionExplorer.tsx`, new `client/src/content/homepage.ts`, new `client/src/styles/home.css`, `tests/browser/homepage.spec.ts`, `tests/browser/site.spec.ts`.

- [x] Write and run failing browser checks for section order, coordinated image/chat selection, all three brands and Collective/FAQ content.
- [x] Implement approved copy and four coherent sample conversations; keep Get Started starter questions unchanged.
- [x] Replace the duplicate journey/universe sections with one heading, choices and image/chat pair; preserve existing anchor destinations.
- [x] Reveal message blocks smoothly in a fixed-content footprint, with complete accessible transcript and existing visibility/pause safeguards.
- [x] Add Collective and FAQ sections; remove redundant homepage setup links. Run targeted browser checks and record results.

### Task 2: Homepage event preview and hero motion

**Files:** new `client/src/components/home/HomeEvents.tsx`, new `client/src/components/home/eventDate.ts`, `client/src/components/sky-events/UpcomingEvents.tsx`, `client/src/components/VideoBackground.tsx`, `client/src/styles/home.css`, `tests/unit/homeEventDate.test.ts`, `tests/browser/homepage.spec.ts`.

- [x] Write and run failing checks for date summaries, timezone boundaries, native horizontal navigation and reduced-motion media controls.
- [x] Render homepage-specific category artwork and date badges using primary timing or ongoing activity timing as appropriate. Keep exact timing in accessible guide context and visible compact basis text.
- [x] Implement native scroll snapping, arrow navigation, position indicator and resize handling without changing detailed Sky Events cards.
- [x] Smooth hero playback, add accessible pause/resume and freeze offscreen/hidden/under the welcome screen; retain the existing homepage video and fallback image.
- [x] Run unit checks and targeted browsers, including a touch swipe and video failure.

### Task 3: Review and verification

**Files:** browser expectations where approved behaviour changed; local screenshots/check reports under `.cache/homepage-implementation`.

- [x] Type checks, unit suite, full browser suite and production build.
- [x] Capture desktop, mobile and narrow mobile; compare mock and actual sections and test enlarged text.
- [x] Request a fresh code review focused on the changed website files and the five review risks above; resolve material findings.
- [x] Report the verified local URL and any remaining external dependency (marketplace URL).

## Execution record

- Initial: Existing worktree and dirty website changes preserved. Approved mock is the implementation brief; no new product or design decisions require clarification at setup.

- Completed: Combined journey, assistant branding, smooth message blocks, live calendar previews, native mobile swipe, Collective values and FAQs match the approved composition. Existing full navigation, footer, splash/session and audio behaviour preserved.
- Verification: 74/74 browser tests, 34/34 unit tests, both TypeScript checks, production preview build, and git diff --check passed. Desktop1440, mobile390 and narrow320 screenshots and real touch/guide checks are in .cache/homepage-implementation.
- Independent review: Fixed mobile enlarged-caption clipping and thinking dots continuing during pause; focused regressions reproduced failures before fixes and passed in the full suite. Full-suite data-saving fallback failure also fixed with optional listener methods. No material findings deferred.
- External configuration: Public marketplace listing URL remains unset, as previously instructed. No plugin changes, commits, deployment or publication.

## Approved refinement follow-up

- User approved rounded main CTAs, generic Get NightSky hub actions with assistant logos below, Free to use badge and current-pricing FAQ language, restored word streaming, hero pause/secondary link removal, footer email removal, eight homepage FAQs and 24px closing-note spacing. No installation strip added.
- Implemented shared pricing copy across Home and Get Started. Specific official listing action remains on Get Started with its existing configuration checks.
- Streaming reveals words every 65ms with reserved layout, dynamic sequence duration, pause/replay and full accessible/reduced-motion transcripts. Timer delta is captured before the React updater to avoid delayed-update drift.
- Focused 33 browser checks passed, independent read-only review found no material issue, both TypeScript checks and the production preview build passed, and 34 unit tests passed. Final desktop1440/mobile390/narrow320 screenshots and checks are in .cache/homepage-refinements.
- Final refinement regression: 76/76 browser tests passed. Plugin untouched; changes remain local.

## FAQ and CTA follow-up

- User requested a steadier FAQ experience and Get NightSky Plugin CTAs with the splash Sparkles icon in place of arrows.
- Reproduced cumulative answer expansion: each answer increased FAQ section height by about70px desktop and66–108px mobile. Extracted HomeFaqs with one active answer and a responsive minimum height based on actual summary heights plus the longest natural answer. Answers retain native details/summary semantics, keyboard access and unconstrained readable text; temporary measurement probes are aria-hidden and removed synchronously.
- Measurements at1440,1024,390,320 showed identical section heights closed and with different answers open; 200% answer/summary text resizing passed without overflow.
- Independent review found a queued-toggle race; reproduced with a failing rapid selection test and fixed by controlled summary activation plus a native exclusive details group. All four focused FAQ checks passed. No material findings deferred.
- Shared acquisition CTAs now say Get NightSky Plugin; official ChatGPT listing action keeps its specific label. Both use the same Sparkles icon as the welcome screen. Destinations and unset listing configuration remain unchanged.
- Final FAQ/CTA verification: 80/80 browser tests passed, both TypeScript checks and production build passed. A prior calendar check timed out and passed in isolation; the final complete rerun was clean. No plugin files changed.
