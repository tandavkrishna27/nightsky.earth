# About and Sky Events — planning review

Date: 2026-10-16. Author self-review using superpowers:writing-plans checklist, grounded in current website source. This is not independent implementation review or proof that event data has been verified. No product code changed.

Design: ../superpowers/specs/2026-10-16-about-sky-events-design.md
Plan: ../superpowers/plans/2026-10-16-about-sky-events.md

## Findings resolved in the plan

1. **All events treated as appointments would create false precision.** Introduced instant, interval and approximate/source-date variants. No fabricated midnight times; uncertain dates visibly retain their original basis.
2. **Converting a clock alone can place an event on the wrong day.** Month/day grouping uses selected-zone date keys; source-date events explicitly do not shift. Fractional offsets, date-line and year rollover have tests.
3. **A city/timezone label can falsely suggest local visibility.** Calendar remains global; no inferred city or visible-near-me filtering. Global event maximum is named as such. Browser zone detection does not need location permission.
4. **Current UTC offset is wrong for some future event dates.** Individual event offsets use each instant. Header offset is explicitly a month-start reference; named zones and runtime rules handle DST. Alias validation and storage fallback included.
5. **An annual catalogue might be copied forward with stale predictions.** Year-specific IDs, source audit, per-month coverage manifest and build validation. Current+11-month research target is fixed by execution date; no unsupported recurrence. No runtime scraping or invented API.
6. **Long shower activity windows can hide the next peak.** Future primary moments rank ahead of ongoing activity with past peaks, with distinct labels. Activity and peak do not duplicate one event within a day/month list.
7. **A real calendar can become unusable on mobile.** List default, explicit view switch, internal grid scrolling, +N expansion and keyboard focus rules; category text not just colored dots. Long/dense fixtures required.
8. **Old meteor links could break or point to the wrong year.** Index URLs redirect once to filtered Sky Events; existing detail archives remain noindex until exact mappings are verified. Canonical occurrence URLs include year; unknown IDs return 404 at host.
9. **Client work alone misses build and hosting policy.** Current websiteBuild.ts emits meteor routes/sitemap independently of App.tsx. Plan updates generated static rules, Express, route classification, build callers and tests together.
10. **New local preference storage changes the website’s privacy description.** Verification must document saved timezone/view as device-only preferences; do not silently carry over an old assertion that the website stores no preferences. Existing legal/operator release approvals are still outstanding.

## Coverage and interface check

All user requests are covered: About copy/layout; complete calendar interaction; real reviewed records; timezone auto/manual conversion; source limits; homepage highlights; event guides; old-link migration; maintenance and verification. Existing splash/music and plugin exclusion remain explicit. Shared types and function contracts are defined once; no competing date functions in UI. Independent About delivery does not require calendar completion.

No product code or plugin edits. Pending user review of the proposed copy, calendar model and execution scope. Once authorized, inline execution followed by fresh-context review is recommended because the domain/state/build interfaces need consistent implementation. The implementation may require substantial source research; do not equate a working grid with a finished calendar.

## Honest limits

Primary research sources were identified/opened, not transformed into a verified event collection in this planning turn. Sources can describe UT/TT or date-only predictions; exact UTC normalization requires evidence. Runtime timezone rules can change with browser/system updates. This release does not compute horizon, weather, local eclipse contacts or location visibility. A live Netlify check, public listing link and operator/legal facts remain separate publication requirements.
