# Homepage Conversation and Sound Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task in this session after design approval. Steps use checkbox syntax. No subagent work is required.

**Goal:** Simplify the floating sound control, communicate the user's “free forever” promise, and show how a NightSky conversation develops in the existing homepage example panel.

**Architecture:** Keep the existing React homepage, audio provider, CTA resolver, and four example modes. Add scripted conversation data alongside existing website copy and a small, local playback controller inside QuestionExplorer. The demo uses local content and has no connection to ChatGPT or the plugin backend.

**Tech Stack:** Existing React/TypeScript, CSS, lucide-react/react-icons, and Playwright. No new runtime dependencies, videos, or animation packages.

**Spec:** The proposed design below incorporates this chat's requested changes, including the user's October 17 instruction to replace the hero eyebrow with “Free forever.” This document is a plan for review, not permission to start implementation.

**Status:** User approved execution. Implemented in the website worktree and verified on October 17, 2026; independent code review completed.

## Global constraints

- Work only in `.worktrees/website-plugin-design`, which serves the updated preview at `http://localhost:5178/`.
- Do not modify, run, install, test, or deploy the separate plugin; do not make calls to its services.
- Preserve the existing uncommitted website edits. Record the starting diff and edit only the files listed below; do not reset, broadly stage, or commit unrelated work.
- Do not modify PluginAction.tsx or shared/website.ts. Existing listing availability, destinations, safe URL checks, and button wording remain authoritative.
- “Free forever.” describes NightSky. Do not add “ChatGPT is free,” “no account needed,” “unlimited,” “no credit card,” or current public availability claims.
- Keep the existing hero background, entrance, four modes, left-hand Universe heading/copy, platform row, and single CTA below that section.
- Keep questionExamples compatible with GetStarted.tsx. No backend, route, pricing system, analytics, publishing, or dependency changes.
- Leave the user's preview running; use an isolated port for browser tests. No commits or deployment are part of this planning request.

## Proposed design

### 1. Sound control

- Replace the pill with a 46 × 46 CSS-pixel circular button on desktop and mobile. Preserve the current bottom-right placement; include safe-area insets and a visible keyboard focus ring.
- Remove the visible “Sound on,” “Sound off,” and “Loading sound…” text. Preserve the existing Volume2/VolumeX icons, accessible names, tooltip, aria-pressed state, and click handler.
- Pending playback stays cancellable. Use aria-busy and a static small pending indicator rather than adding a spinner; do not disable the button. aria-pressed becomes true only when playback resolves, as the provider already implements.
- Preserve silent entry, playback failure/retry, and audio continuity across routes. BackgroundMusic.tsx and ExperienceShell.tsx do not need modification.

### 2. Free forever messaging

- Replace the hero eyebrow “The night-sky plugin for your AI assistant” with exactly **“Free forever.”** Use the existing restrained eyebrow typography and color, not a badge or new banner.
- Preserve product meaning in the hero description with this proposed copy: **“Explore the night sky with NightSky, a plugin for your AI assistant. Learn, plan a night outside, or bring a creative idea to life.”** The existing CTA and ChatGPT platform row identify the first platform.
- Add **“NightSky is free forever.”** as quiet supporting text immediately below the closing primary CTA, before the existing setup-help link. No second pricing line beneath the hero CTA; the eyebrow already makes the promise.
- Keep the navigation CTA and all destination logic unchanged. The pricing promise does not change the current unpublished-listing fallback.

### 3. Animated conversation

**Appearance:** Retain the right-hand panel's dark surface and restrained gold accents, but use conversational typography rather than a large quotation. Keep the existing “NightSky in ChatGPT” header and “Illustrative conversation” label visible throughout. Show right-aligned user bubbles, left-aligned assistant messages labelled “ChatGPT,” a compact NightSky activity row, and a decorative composer. The composer is not an input and cannot send messages.

**Meaning:** ChatGPT remains the conversational assistant; NightSky appears as the plugin it uses. The animation demonstrates a scripted interaction, not live execution or an exact replica of the current ChatGPT UI. Do not invent tool names, source links, weather values, visibility verdicts, or fetched results. There is no reasoning/thinking trace.

**Default:** Select **Explore** initially because it naturally demonstrates a clarification and useful follow-up. Preserve Understand / Explore / Create / Prepare as keyboard-operable buttons with aria-pressed and aria-controls. Selecting one resets only that scenario; no automatic cycling.

**Explore script:**

1. User: “Help me explore a night under the stars.”
2. ChatGPT: “Where will you be, and when would you like to go?”
3. User: “Near Bengaluru this Saturday. It’s my first time.”
4. Activity: “NightSky · Preparing your next steps”
5. ChatGPT: “For a first outing, keep the plan simple: a short session with an open view of the sky. Moonlight, darkness and weather will shape the choice. Bring a dim light and something comfortable to sit on. Would you like to explore possible places?”

This is illustrative preparation advice, not a claim that Saturday's local conditions were checked. The clarification is a conversation example, not an installation walkthrough.

**Other scenarios:** Keep every initial question sourced from questionExamples. Understand also uses its existing final answer and shows a direct explanation without a location question. For the other modes, use the following contextual replies rather than repeating a request for details already supplied. All final answers remain within the existing 25–45-word test contract.

- Create clarification: “What camera and lens will you use?” User reply: “A mirrorless camera and the kit lens.” Activity: “NightSky · Shaping a first test”. Final answer: “With your camera and kit lens, begin with a sturdy tripod and a short test sequence. We can work through exposure and the interval between frames, then adjust after reviewing the result. What scene would you like to capture?”
- Prepare clarification: “How long will you be out, and will you bring a telescope?” User reply: “A short evening near home, with no telescope.” Activity: “NightSky · Preparing an outing checklist”. Final answer: “For a short evening near home, bring warm layers, water, a comfortable seat and a dim light. You can begin with your eyes alone; a telescope is not essential. Check access and your route home before setting out.”
- Understand activity: “NightSky · Preparing an explanation”. No scenario implies that external data was retrieved.

**Playback timeline:** Use a reusable scene sequence; the default and other clarification scenarios use the schedule below. Understand uses the same initial 0–2.4-second question, shows its activity at 3.0–4.8 seconds, reveals its final answer at 5.4–12.0 seconds, and completes at 12.0 seconds.

| Elapsed time | Visible change |
| --- | --- |
| 0–2.4 seconds | Initial question types into the decorative composer |
| 2.4 seconds | Question becomes a user message |
| 3.0 seconds | Assistant clarification appears as a complete message and stays visible |
| 5.4–7.4 seconds | User detail types into the composer |
| 7.4 seconds | Detail becomes a user message |
| 8.0–9.8 seconds | NightSky activity row is visible |
| 10.4–17.0 seconds | Final answer reveals by short word groups |
| 17.0 seconds onward | Complete conversation remains readable indefinitely |

- Start once when at least 25% of the panel is visible, the entrance shell is not inert, and the document is visible. If observer APIs are unavailable, show the completed static transcript.
- Use one persistent control whose labels are “Pause demo,” “Resume demo,” and “Replay demo.” It stays mounted so completion does not drop keyboard focus. Replay is explicit; no automatic loop.
- Freeze elapsed time when the panel leaves view or the browser tab is hidden; resume from that point when eligible. An explicit user pause always wins over automatic resume. Completion remains complete when returning to the section.
- Switching modes resets elapsed time and content but preserves an explicit user pause. Switching modes after completion starts the selected scenario when eligible. Replay restarts the selected scenario, not the default mode.
- With prefers-reduced-motion, show the complete static conversation immediately, including clarification and final response, and omit playback controls. A live switch to reduced motion completes the current transcript; switching back leaves it complete until replay or a mode selection.
- Do not use an aria-live region for typed characters. Hide the decorative animated layer from assistive technology and supply one complete, semantically ordered transcript per selected mode. In static mode, that same transcript becomes visible. Keep controls outside the hidden decorative layer; prevent duplicate announcements.
- On mobile, stack below the heading using the existing breakpoint. The panel grows naturally instead of clipping messages or creating an internal scroll trap. Reserve stable message slots for the selected scenario so reveals do not repeatedly push the page; measure the final footprint responsively. Do not scroll the page automatically.

## File map

| File | Responsibility |
| --- | --- |
| client/src/components/FloatingMuteButton.tsx | Remove visible text; retain semantic and pending states |
| client/src/content/websiteCopy.ts | Hero/closing pricing copy and separate scripted demo data |
| client/src/components/home/QuestionExplorer.tsx | Render and play the selected scenario with local lifecycle management |
| client/src/pages/Home.tsx | Render the closing pricing note; retain the existing layout and actions |
| client/src/index.css | Circle sizing, scoped demo styles, responsive layout, focus and reduced motion |
| tests/browser/experience.spec.ts | Sound-button presentation and existing audio regression coverage |
| tests/browser/site.spec.ts | Pricing, demo interaction/lifecycle, reduced-motion and mobile coverage |

No new product files are required. Keep helpers local to QuestionExplorer unless implementation reveals a concrete reason to split them; review that decision before expanding scope.

## Interfaces and data flow

- Keep `questionExamples` and its current question/response fields unchanged for GetStarted and existing content contracts.
- Export `conversationDemos` as a readonly array from websiteCopy.ts. Each entry has `id: 'understand' | 'explore' | 'create' | 'prepare'`, optional `clarification: string` and `reply: string` supplied together, `activityLabel: string`, and optional `response: string`. The id resolves the initial question from questionExamples; final text is `demo.response ?? example.response`. Supply response for Explore, Create and Prepare using the exact contextual answers above; Understand inherits its existing answer.
- `QuestionExplorer(): JSX.Element` remains the public interface. The selected id and elapsed milliseconds are local state; mode buttons and the playback control dispatch explicit user intent. Do not export a generic animation framework.
- Keep `isUserPaused` separate from visibility/entrance eligibility. Derive effective running state rather than combining multiple unrelated meanings in one playing boolean.
- Advance elapsed time from a monotonic clock using at most one pending timeout, capped at 20 updates per second. Pause excludes wall-clock time spent hidden. Clear timers, observers and media/visibility listeners on unmount or scenario replacement; callbacks must not update an obsolete scenario.
- Observe the existing `[data-experience-content]` element's inert attribute to prevent playback behind the entrance. Do not change the audio or entrance provider interfaces.
- Expose `data-playback-state="idle|playing|paused|complete|static"` on the demo root for deterministic tests. Keep existing example-question/example-response hooks in the completed/static transcript; scope tests to that transcript rather than the decorative duplicate.

## Review focus

1. A pending audio request can still be cancelled with an icon-only button; late resolution must not turn sound back on.
2. A mode switch, route exit or rapid replay must cancel obsolete animation work and keep the selected transcript correct.
3. Reduced motion, screen readers and the entrance overlay must not receive animated text churn or start a hidden demo.
4. At 320 CSS pixels and browser text zoom, controls remain reachable and transcripts neither clip nor overflow the viewport.
5. The normal-motion path must actually be tested: the existing Playwright config explicitly defaults to reduced motion.

## Implementation tasks

### Task 1: Simplify the floating sound control

**Files:** FloatingMuteButton.tsx, index.css, experience.spec.ts from the file map.

**Consumes:** Existing useBackgroundMusic() contract; no provider changes.
**Produces:** The same sound control with no visible text and a minimum 46 × 46 target.

- [ ] Record starting git status/diff for the seven scoped files and confirm the correct worktree. Preserve the existing audio and entrance tests. Before the first browser run, create the isolated test config described in Task 4; use it for every targeted browser check.
- [ ] Remove only visible text, update circle styles, preserve tooltip/accessibility states, and add the nonanimated pending indication.
- [ ] Extend the existing audio browser coverage to assert empty visible button text, accessible name, aria-pressed, pending cancellation, keyboard activation, and the 46-pixel target. This is a presentation refinement: do not add implementation-mirroring unit tests.
- [ ] Run the targeted experience suite and visually inspect desktop/mobile placement. Expected: existing playback failure, cancellation and route-persistence checks still pass.

### Task 2: Apply the confirmed free-forever positioning

**Files:** websiteCopy.ts, Home.tsx, index.css, site.spec.ts, experience.spec.ts.

**Consumes:** The user's “free forever” wording; existing PluginAction and listing fallback.
**Produces:** Hero eyebrow and closing supporting copy defined in the design, without changing CTA behavior.

- [ ] Set homeCopy.hero.eyebrow to “Free forever.” and update the description to the exact proposed sentence above. Add homeCopy.ready.pricingNote = “NightSky is free forever.”
- [ ] Render the closing pricingNote directly after its existing PluginAction. Apply local supporting-text spacing without changing the global primary-action component or the hero platform row.
- [ ] Replace the old eyebrow assertion in experience.spec.ts: check “Free forever.”, product identification in the description, and unchanged Get NightSky destination. In site.spec.ts verify both scoped price statements and no duplicate hero pricing note.
- [ ] Inspect hero wrapping and closing rhythm at 320, 390, 768 and 1440 pixels. Expected: no crowding, detached captions, or implication that the listing is now public.

### Task 3: Build the scripted conversation and lifecycle

**Files:** websiteCopy.ts, QuestionExplorer.tsx, index.css, site.spec.ts.

**Consumes:** Existing questionExamples; the scene model and lifecycle rules above.
**Produces:** A local illustrative demo with four modes and accessible static transcripts.

- [ ] Add the four conversationDemos records without changing questionExamples. Keep clarification/reply paired and final content educational rather than a fabricated live report.
- [ ] First add failing behavioral browser cases for one complete Explore flow, pause/resume, replay, rapid mode changes, and switching modes while user-paused. Use Playwright's clock for timing; do not introduce fixed multi-second sleeps.
- [ ] Render the static transcript and decorative chat layout, then implement the single local playback controller. Match the documented stage timings, preserve focus, and clear obsolete callbacks.
- [ ] Add and run lifecycle cases: no playback behind the entrance, offscreen freeze/resume, hidden-document freeze/resume, route away/back, and completion remaining complete. For visibility tests stub document.hidden and dispatch visibilitychange; supplement with a real browser-tab check during visual QA.
- [ ] Add reduced-motion cases for initial load and live preference changes. Assert the full selected conversation is available immediately, no playback controls run, and the typed layer is not announced.
- [ ] Test all four mode choices with reduced motion and normal motion. Preserve Create's initial question and final “interval” response assertion; update old tests to scope the completed transcript and keep the existing final-answer length checks.
- [ ] Verify `/get-started` still renders the original four questionExamples. Check that each completed demo answer uses its context rather than asking again for information already supplied.
- [ ] Assert demo interaction makes no ChatGPT/plugin requests and adds no media element; allow existing unrelated website news/media requests. Inspect all four completed transcripts for honest product behavior.
- [ ] Add responsive/keyboard checks at 320, 390, 768 and 1440 pixels, plus 200% text zoom. Check for viewport overflow, clipped text, obscured controls, contrast, focus visibility, and unwanted page scrolling. Confirm CSS slot sizing matches real wrapping rather than assuming a fixed desktop height.

### Task 4: Verify the integrated website

**Files:** No additional product files; temporary test config, logs and screenshots belong under .cache/test-results only.

- [ ] Run `npm.cmd run check` and `npm.cmd run check:tests`. Expected: exit 0. If a baseline problem exists, identify whether it predates this work instead of expanding the change silently.
- [ ] Create a temporary `.cache/playwright-homepage-review.config.ts` importing the existing config and overriding testDir to `../tests/browser`, baseURL to `http://127.0.0.1:5181`, and webServer to `{ command: 'npm run dev:website -- --port=5181', url: 'http://127.0.0.1:5181', reuseExistingServer: false, timeout: 30000 }`. Retain other settings. Confirm port 5181 is free first; do not terminate an unknown process.
- [ ] Run `npm.cmd exec playwright test -- --config=.cache/playwright-homepage-review.config.ts site.spec.ts experience.spec.ts`. Expected: exit 0; existing tests retain reduced motion while animation-specific tests explicitly use `reducedMotion: 'no-preference'`.
- [ ] Run `npm.cmd run build` and `npm.cmd run test:unit` once after integration. Expected: exit 0; the unchanged CTA and shared-content contracts still pass. Broaden testing only for new failures or affected behavior.
- [ ] Capture and inspect desktop/mobile screenshots and one short normal-motion recording. Review first paint, clarification, activity, answer, paused and completed states; screenshots alone cannot prove the timing or lifecycle.
- [ ] Compare the final scoped diff with the recorded starting diff. Verify only the seven planned product/test files changed for this work and no plugin files, plugin services, release settings or unrelated uncommitted edits were touched.
- [ ] Recheck the preview on port 5178, leave it running, and report the exact behavior verified plus any remaining limitation. No deployment or commit is implied.

## Plan self-review and revisions

This is a self-review grounded in the current source and test configuration, not an independent review or a claim that implementation tests have run.

| Review area | Finding in the first proposal | Resolution incorporated in this plan |
| --- | --- | --- |
| Product/design | “Free to use” did not capture the user's stronger wording; removing the old eyebrow could lose product identity | Hero says “Free forever.”; description still identifies the plugin; closing copy names NightSky explicitly |
| Scope/architecture | Changing PluginAction globally could affect navigation, fallback destinations and other pages | Pricing remains homepage content; action component and resolver are excluded |
| Content/data | questionExamples also supplies Get Started; changing its shape could create an unrelated regression | Separate demo metadata references the existing examples by id |
| Conversation continuity | Reusing the original Create/Prepare answers after clarification would ask again for information already given | Scenario-specific final responses acknowledge the supplied details; the original shared answers remain untouched |
| Accessibility | Character-by-character aria-live and repeated looping would be distracting | One static semantic transcript; decorative animation hidden; visible pause/replay; static reduced-motion path |
| Lifecycle | A single playing boolean could erase a manual pause, advance behind the entrance, or skip ahead after returning | User pause and eligibility are separate; inert/visibility observation and frozen elapsed time are specified |
| Layout/performance | A large fixed-height desktop mockup could clip at 320px; four simultaneous animations would waste work | Only the selected scenario runs; one capped timer; responsive reserved slots; no nested scrolling |
| Test reliability | Existing reduced-motion defaults would leave the main animation untested; the active preview occupies the test port | Explicit normal-motion cases, virtual clock, and an isolated test server on 5181 |

**Planning review verdict (before execution):** The proposed design covers all three requested changes with seven existing product/test files and no new runtime dependencies. The free-forever direction is confirmed by the user. This remains a reviewed implementation proposal; design approval and actual execution/verification have not happened.

**Execution recommendation:** Implement inline in this worktree, following tasks 1–4. The changes share a small set of files, so sequential work keeps the existing edits and interaction contracts easier to preserve. The user can approve or revise this document before implementation starts.

## Execution and verification report — October 17, 2026

Tasks 1–4 implemented in the existing website worktree. The original questionExamples, audio provider, action resolver, navigation changes, platform row, and separate plugin remain intact. SHA256 comparison against the saved starting snapshot confirms exactly the seven planned tracked files changed.

- Final complete website browser suite: **44/44 passed**, including normal and reduced motion, all four modes, manual pause/replay, offscreen/document visibility, entrance gating, route remount, observer fallback, keyboard use, and narrow layouts.
- Unit suite: **30/30 passed**. Production build and both application/test TypeScript checks passed.
- Desktop/mobile screenshots and a normal-motion recording captured and inspected under `.cache/homepage-polish/`. Observed complete and paused states, no page errors, no horizontal overflow, and no ChatGPT/plugin requests.
- Independent read-only review: no Critical or Important code findings. Its minor text-enlargement verification gap was addressed by doubling all relevant computed text sizes, including labels and controls, at 320/640px; the test passes.
- An additional panel-height regression initially captured asynchronous font loading. After waiting for document.fonts.ready, all four modes stay within one CSS pixel throughout typing, sending and completion. No production patch was needed.
- Visibility was verified with browser DOM hidden/visibilitychange events and viewport transitions; operating-system tab switching was not separately exercised.
- Preview remains at http://localhost:5178/. No commit, push, deployment, or plugin operation performed. Existing unrelated uncommitted edits are preserved. Scratch logs and baseline snapshots are retained because no commit history was created for this change.
