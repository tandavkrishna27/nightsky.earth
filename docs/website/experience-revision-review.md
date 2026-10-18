# Experience revision — plan review and implementation verification

Date: 2026-10-16. Website branch: codex/website-plugin-design. Scope excludes the plugin.

## Plan review

The preceding conversation approved this bounded revision; the user explicitly requested plan, review, then execution in one turn. The revision plan records that authorization and supersedes the earlier removal of music/splash. Navigation, product story, creative scope, first-platform availability, entrance, and Collective each map to implementation tasks. No backend changes or new dependencies were necessary.

Decisions: retain safe local setup destination while changing its label; use installed platform icons with explicit first-release/future status; omit unidentified Muse; keep Collective free of membership collection. Existing photography resources remain the destination of the broader creative card, rather than promising an unbuilt video tool.

## Independent review

Fresh-context reviewer inspected this revision and confirmed two material findings. Both were reproduced with failing browser tests and corrected:

- Footer How it works changed the URL without moving to its target. Post-render scrolling now reaches the section from both Home and Collective without reloading the page/audio.
- Pending playback could not be cancelled while audio loaded. Pending state now has an explicit Cancel music playback control; cancellation invalidates old requests, pauses and mutes the element, and stale promise resolution cannot turn the indicator on.

No other material defects reported; no deferred minor findings.

## Verification

- TypeScript application and test checks pass.
- Unit suite: 16 passed.
- Browser suite: 19 passed, including seven experience tests covering entrance, storage failure, keyboard entry, persistent audio, playback failure/retry/cancellation, platform story, Collective reflow, and footer navigation.
- Production-shaped host: 1 passed.
- Preview build passes. Existing Browserslist/PostCSS warnings remain.
- Real local MP3 playback, without a media mock: paused=false, muted=false, currentTime=5.026, volume=0.3, source=/cosmic-music.mp3. Auditory quality was not assessed through tooling.
- Desktop and mobile screenshots inspected; corrected an inaccurate image alternative and reduced the mobile music control to an icon to avoid the hero scroll cue.

Preview runs at http://127.0.0.1:5180/. No deployment performed. ChatGPT listing is still unpublished; Claude/Gemini are explicitly future direction and unavailable. Muse identity remains unresolved. Legal/operator release blockers from the prior implementation remain in force.
