# NightSky experience revision implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline. User authorized planning, review, and execution in one turn.

**Goal:** Restore NightSky’s immersive arrival while making the plugin and its first platform clear, and giving The Collective a cinematic identity.

**Architecture:** Retain existing routes, assets, release guards, and resource/news behavior. Mount one persistent audio provider above the route shell; place an accessible entrance outside an inert shell until dismissed. Use a dedicated Collective layout rather than the generic editorial template.

**Tech stack:** Existing React, Wouter, CSS, Framer Motion, react-icons, Playwright; no new dependencies.

**Spec:** The user-approved design in the preceding conversation, reflected below. This revision supersedes the earlier no-splash/no-audio requirement and generic fallback CTA.

## Global constraints

- Website worktree only; do not inspect or modify the separate plugin.
- Navigation: About, The Collective, Resources, News.
- All primary CTAs say “Get NightSky for ChatGPT”; retain safe local availability destination until a verified listing exists.
- Hero preserves “Where Earth meets the stars.” and existing background. Explicitly describe a plugin for an AI assistant, launching first on ChatGPT.
- Show ChatGPT, Claude, Gemini icons from installed react-icons. ChatGPT is first release; Claude/Gemini are future direction, explicitly unavailable. Muse omitted until identified. No installation links for future platforms.
- Preserve original cosmic-music.mp3 and Enter the Night identity. Silent entry, keyboard access, session persistence, blocked-storage resilience, reduced motion, truthful playback state, one audio instance across navigation.
- Broaden Create to photography, time-lapse, video as creative interests; do not invent specialized video tools or generated media capabilities.
- Collective: centered photographic hero, inclusive introduction, image-led shared pursuits and people; no signup, WhatsApp, tour/funding promises, or inactive CTA.
- Keep About, Resources, News, support/legal content and release gates intact; no deployment.

## Review focus

1. Failed audio playback leaves the control muted and allows retry.
2. Silent entry and reload never autoplay sound; route changes never replace the audio element.
3. Entrance cannot trap keyboard users or leave the underlying page interactive; focus moves to main after entry.
4. 320px navigation accommodates the longer CTA; Collective has no horizontal overflow.
5. Platform logos cannot imply three currently available integrations; first-release status remains explicit.

### Task 1: Product copy, navigation, platform story

**Files:** shared/website.ts; client/src/components/Navigation.tsx; client/src/content/websiteCopy.ts; client/src/pages/Home.tsx; new client/src/components/home/PlatformAvailability.tsx; tests/unit/website.test.ts; tests/browser/experience.spec.ts.

**Interfaces:** resolvePluginAction keeps existing return shape and URL safeguards; PlatformAvailability is a presentational component.

- [x] Add expected CTA label to unit contract; add browser assertions for navigation order, plugin/first-release copy, platform status and expanded creative language. Run and observe failures.
- [x] Apply exact navigation/CTA decisions; add compact icon/status strip below hero. Revise Create and moments “Photograph” to “Create”; add how-it-works anchor and footer link.
- [x] Run unit and relevant browser tests. Expected: pass.

### Task 2: Entrance and persistent audio

**Files:** App.tsx; components/BackgroundMusic.tsx, EnterExperience.tsx, FloatingMuteButton.tsx; new components/ExperienceShell.tsx; tests/browser/experience.spec.ts; existing browser test fixtures.

**Interfaces:** BackgroundMusic exposes startMusic synchronously callable in click handler, toggleMute, isMuted, isPlaying. EnterExperience receives onEnter(sound:boolean). ExperienceShell owns entry/session state, keeps routed children mounted/inert during entrance, restores focus without changing URL.

- [x] Add browser tests for first visit, silent entry, one audio instance across routes, session reload, playback success/failure/retry, storage failure. Stub browser media only in playback-specific tests. Run and observe failures.
- [x] Restore same star entrance, direct-gesture audio start, silent alternative, deterministic star positions and reduced-motion support. No sound on reload. Catch sessionStorage failure. One mounted audio tag, metadata preload, original volume and 5s start, playback rejection reflected by controls.
- [x] Existing non-entrance tests mark session entered using initScript. Replace obsolete no-audio assertion with one paused audio element; do not bypass entrance in the new experience tests.
- [x] Run browser suite. Expected: pass.

### Task 3: Collective visual composition and verification

**Files:** pages/Community.tsx; index.css; docs/website/experience-revision-review.md; tests/browser/experience.spec.ts.

**Interfaces:** Same /community route and PageShell; dedicated semantic sections with existing images and SEO. No form or member state.

- [x] Add assertions for The Collective hero, observers/creators/educators/beginners, honest future status, no form or membership CTA, mobile reflow. Run and observe failures.
- [x] Build centered 75svh photographic hero with original inclusive line; spacious alternating image/text sections for observation, creation, learning; closing future section without collection CTA. Apply responsive platform/entrance/Collective styles with existing typography and gold/night palette.
- [x] Run check, check:tests, unit/browser suites and build. Expected: all pass. Capture and inspect home, entrance, Collective at desktop and mobile sizes.
- [x] Final fresh-context review of this revision; address material findings and verify. Leave local preview running and open it for user.

## Plan self-review

Coverage: all requested revisions map to tasks 1–3. Interfaces: task 2 wraps the existing shell; no route or backend contract changes. Corrected risks before implementation: do not use delayed effect to start audio; do not replace route content on entry; do not market future platforms as installed; do not manufacture Muse identity. Resources remains a reviewed library, so Create links to existing photography resources while copy includes broader creative interests. Visual checks, rather than snapshot-copy tests, judge composition and spacing.

Execution: authorized by user “plan and review ... then ... do it”; no additional approval pause required.
