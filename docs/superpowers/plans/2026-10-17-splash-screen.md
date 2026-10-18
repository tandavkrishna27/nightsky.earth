# NightSky Splash Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan in the existing website worktree. Track steps here and evidence in `.cache/splash/progress.md`.

**Goal:** Ship the approved video welcome with the gold logo, clear product line, and sound or silent entry.

**Architecture:** Keep the existing persistent music provider. The welcome owns its decorative video and a 450 ms exit; entering starts audio synchronously from the chosen click. A separate `SplashBackground` component manages video preferences, visibility, pause and failure. Direct routes bypass the welcome.

**Tech stack:** Existing React, TypeScript, CSS, Vite, Playwright; no new dependencies.

**Spec:** The user-approved splash mock and discussion in this chat, captured below.

## Approved design and constraints

- Use the supplied `9940664-hd_1920_1080_24fps (2) (1).mp4`, silently looping at 0.7 playback speed beneath a dark overlay. A matching still frame appears while loading and on failure, reduced motion or data saving.
- Warm-white night/earth; solid `#C2A977` sky; preserve globe colors. Share the gold logo with the existing navigation.
- Logo, `Where Earth meets the stars.`, `A night-sky plugin for ChatGPT, Claude & Gemini.`, rounded outlined `Enter the Night` button with stars, small `Enter with ambient sound` hint, and small `Enter without sound` action.
- No ambient toggle. The main entry starts existing music; silent entry and Escape do not. Keep the floating music control after entry.
- Welcome on `/` only, once per session. Direct Get Started/resources/article links open immediately. No forced delay before entry; normal exit fades for 450 ms, reduced-motion exit is immediate.
- Respect keyboard focus, inert background, small screens, hidden tabs, blocked storage, blocked media and live motion-preference changes. Add an accessible video pause control only when video is eligible.
- Work only on website files in the existing worktree. Preserve unrelated edits. No plugin changes, new dependencies, commits, deployment or publication.

## Review focus

1. Video loading must not start sound or steal the music click; verify separate audio/video behavior.
2. A rejected or late playback promise must not restart motion after pause, preference change, hiding or unmount.
3. Three splash controls require a real forward/backward focus cycle; Escape must enter silently.
4. Route bypass and blocked storage must preserve usable direct links and never re-cover already entered content during navigation.
5. Poster and text must remain usable at 320 px, landscape and 200% text; inspect desktop/mobile visually.

## Task 1: Video welcome and route/entry behavior

**Files:** Create `client/src/components/SplashBackground.tsx`, `client/public/splash-night-sky.mp4`, `client/public/splash-night-sky.jpg`, `tests/browser/splash.spec.ts`. Modify `EnterExperience.tsx`, `ExperienceShell.tsx`, `client/src/index.css`, `attached_assets/nightsky-logo-dark.svg`, and the blocked-storage case in `tests/browser/experience.spec.ts`.

**Interfaces:** `SplashBackground({ exiting: boolean, onControlRemoved: () => void })` owns silent media and its pause control. `EnterExperience({ onEnter, exiting })` retains `onEnter(sound: boolean)`. `ExperienceShell` owns session entry, route bypass, exit timer, focus and audio choice. Existing navigation consumes the shared gold SVG without other behavior changes.

- [x] Add browser coverage for homepage-only entry and blocked-storage entry. Run focused cases and confirm RED because direct routes currently show the welcome.
- [x] Add meaningful video tests under no-preference motion: actual playback/loop/pause, no sound before entry, visibility, preference changes, failure and rejection, removal on entry. Static tests verify reduced-motion/save-data avoid video requests.
- [x] Add keyboard/silent/Escape and normal fade tests. Update the existing storage test to enter from home, then navigate to Resources, retaining the original blocked-storage assertion.
- [x] Package the supplied clip with faststart and extract its poster. Replace only blue sky fills in the website logo with gold.
- [x] Implement the focused components and splash CSS. Preserve existing music failure/retry/cancellation handling.
- [x] Run `playwright test --config=.cache/get-started/browser.config.ts splash.spec.ts experience.spec.ts --reporter=line`; expect all pass. Run TypeScript checks; expect exit 0.

## Task 2: Verification and review

**Files:** Same deliverable; scratch evidence only in `.cache/splash/`.

**Interfaces:** Verify the final Task 1 behavior against the approved design; no additional features.

- [x] Capture the actual localhost page at desktop, mobile 390 px, narrow 320 px and landscape, including reduced-motion and failed-video states. Inspect framing and typography; verify no overflow and touch targets.
- [x] Verify actual music starts only after the primary entry, silent entry remains silent, and mute works after entry. Verify the welcome is absent from direct Get Started links.
- [x] Run the full website browser suite on isolated port 5181, unit suite, both TypeScript checks and production build. Expect no failed checks.
- [x] Get one independent read-only review scoped to this change; fix important findings with a failing test then passing tests.
- [x] Mark this plan and evidence complete. Leave the website running at 5178 for user review; do not commit or deploy.
