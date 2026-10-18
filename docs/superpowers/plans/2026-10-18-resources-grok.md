# Resources and Grok Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Track the approved website changes and verify the result before reporting completion.

**Goal:** Add Grok as supported at launch and make Resources softer, clearer and easier to browse.

**Architecture:** Reuse existing assistant placements and search state. Centralize assistant names and icons in one website module; use the official unmodified Grok asset. Scope Resources styling to its page so other editorial pages are unaffected.

**Tech stack:** React, TypeScript, CSS, Wouter, Lucide, Playwright.

**Spec:** The in-chat design approved by the user's “carefully plan and do it and then verify it,” plus confirmation that Grok is supported at launch.

## Global constraints

- Website worktree only. No plugin changes, commits, publishing or deployment.
- Keep Get NightSky Plugin as the general CTA and keep ChatGPT first.
- Include ChatGPT, Claude, Gemini and Grok in the hero, demo, splash, setup introduction/options and relevant FAQs.
- No invented listing URLs. Grok's setup action remains disabled until its real destination is configured.
- Keep Resources content and destinations. Remove the decorative eyebrow, retain useful format labels.
- Round cards to 20px, soften borders, add clear focus states and keep reduced-motion support.
- Search remains shareable and works with history; topic pills wrap and use pressed state. Format remains a native select.
- Keep external-link behavior explicit. Preserve review dates accurately, showing a common date once only while all dates match.

## Review focus

- Four assistant names/logos must fit at 320px and with enlarged text.
- A missing Grok URL must never turn into a fake active link or email action.
- Filter state must survive back/forward, reload and unrelated URL parameters.
- Clearing filters must keep keyboard focus useful when the clear button disappears.
- Long resource names, empty results and 200% text must not clip or overflow.

## Tasks

- [x] Add browser coverage for four assistants and keyboard topic filtering; run it before implementation and confirm expected failures.
- [x] Add official Grok logo and shared assistant presentation, update existing placements/copy and configurable Grok setup action.
- [x] Build the rounded Resources page: prominent search, wrapping topics, format selector, concise cards, honest review note and assistant-neutral closing.
- [x] Run targeted browser checks, existing regression suite, unit tests, type checks and build.
- [x] Review actual desktop/mobile screenshots and tablet reflow and request one focused independent review; address material findings.

## Execution record

- Existing branch/worktree reused. The approved in-chat design is the binding brief; no additional approval gate is needed.
- Official logo package downloaded through the brand page's Download Logos link using the browser after direct CLI requests were blocked by the host.

- Added shared assistant identity rendering with the official Grok logo, four-platform hero/demo/splash/setup copy and updated About/FAQ copy. ChatGPT remains the primary setup option.
- Grok setup URL is public website configuration only (`VITE_NIGHTSKY_GROK_LISTING_URL`); it is currently unset. The button is disabled without a specific HTTPS Grok destination, never replaced with the generic homepage or a fabricated URL.
- Resources now uses 20px card corners, rounded search/select controls, wrapping pressed-state topic buttons, external-link notice, common review-date note and assistant-neutral closing copy. Existing resource data and destinations preserved.
- Red/green evidence: missing Grok and topic controls failed before implementation; both passed afterwards. Review found a CSS cascade conflict in the assistant grid: a desktop same-row regression failed before scoping selectors and passed afterwards. Generic Grok homepage rejection also failed before the URL check was tightened and passed afterwards.
- Independent focused review confirmed the fix and reported no remaining material findings. It also verified history/reload state and 320px enlarged text.
- Verification: 86/86 browser tests passed in the final confirmation run; 35/35 unit tests passed; application and test TypeScript checks passed; production preview build passed; git diff whitespace check passed.
- One earlier full browser run had an intermittent reduced-motion homepage startup timeout (element absent); three isolated repeats and the subsequent complete 86-test confirmation passed. No speculative production change was made for that transient failure.
- Visually reviewed desktop Resources at 1440px, mobile at 390px, corrected desktop Get Started, mobile four-assistant hero/demo and splash. Automated reflow checks include 320/390/768/1440px and 200% mobile text.
- Local preview is running at http://localhost:5178/resources. Plugin, commits, publication and deployment remain untouched.
