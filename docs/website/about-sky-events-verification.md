# About and Sky Events — implementation verification

Implemented 2026-10-16 in the isolated website worktree, branch codex/website-plugin-design. Plugin files, processes and runtime were not inspected or modified. No deployment, push or merge.

## Delivered

- About: seven-section visual narrative, explicit plugin/first-ChatGPT positioning, sources principles, Collective bridge and existing install/availability CTA. Existing illustrative assets; no invented founding history or expedition services.
- Sky Events: month/list views, month navigation/Today, category filters, browser timezone detection and manual selection/reset, URL/history state, saved device preferences, current-day refresh, dense-day expansion and responsive overflow containment.
- 54 source-backed occurrences across October 2026–September 2027. This is a curated selection, not an exhaustive calendar. Year-specific guides include interpretation, visibility limits, equipment, source links, review date and copyable question.
- Shared homepage highlights, footer discovery, direct one-hop meteor-index redirects, preserved noindex legacy meteor archives, canonical occurrence sitemap/rewrite generation and unknown-ID host 404 behavior. Preview remains noindex and release factual approvals remain required.
- Draft privacy text discloses local timezone/view preference storage.

## Evidence

- npm run check and npm run check:tests: pass.
- npm run validate:sky-events: 54 validated occurrences; all twelve selected-research months present.
- npm run test:unit: 25 pass. Includes DST changes, positive/negative/fractional offsets, midnight/year/month crossover, leap day, source-date preservation, interval midnight endpoint, activity/peak ordering, validation and build routing/sitemap policies.
- npm run test:browser: 29 pass. Includes About, all prior website flows, calendar filtering/history, actual Moon phase date relocation, blocked storage, missing timezone enumeration, timezone reset, shared Home timezone, clock refresh, clipboard failure, dense-day keyboard focus and 320px reflow.
- npm run build: pass (preview noindex). Existing Browserslist/PostCSS warnings remain. Built JS approximately 444 KB / 112 KB gzip.
- npm run test:host: 1 pass, production-shaped Express routes, direct detail reloads, redirects and metadata. Static rewrite output assertions also pass; actual Netlify emulator/live behavior was not tested.
- npm run build:release: expected refusal for pre-existing operator, hosting, logging, privacy/source approval facts. No approvals manufactured.
- Desktop 1440px and mobile 375px screenshots captured and inspected; reflow tested at 320/640/1440. Reduced-motion browser checks and retained music/entrance suite pass. Native browser zoom at 200% and assistive-technology testing were not performed.

## Independent review and corrections

Fresh-context reviewer read the plan, specification, implementation, source audit and cached primary almanac material, and inspected the local preview. All 54 occurrences matched a source date/time row; source explicitly states GMT equals UTC. NASA TD values were not substituted for UTC.

Three P2 findings were reproduced with failing browser tests and corrected: returning from a top highlight now preserves selected month/category/view; ongoing primary events carry an explicit Ongoing label; dense-day closure restores focus to its trigger. Timestamp acceptance of 24:00 was also reproduced in a failing unit test and corrected to prevent quiet date rollover. A final dense-day/mobile test then caught table paint extending the page; isolating the scroll region with paint containment preserves horizontal table scrolling without page overflow. The complete suites passed after corrections. No unresolved review findings or deferred minors.

## Rulings and limits

1. Windows-compatible .cache/about-sky-events ledger used instead of shell-specific skill helper scripts. All scope/test gates retained. Cost: less automated bookkeeping, offset by this saved verification record.
2. Timing research uses the primary-author AstroPixels UTC almanacs because IMO PDF retrieval was unreliable. Hour-only meteor/planet entries deliberately retain approximate UTC source dates; no activity window, personal meteor rate or specialist-model precision is invented. Cost: a specialist peak prediction may differ; the public source and qualification remain visible. Full per-occurrence evidence: sky-events-source-audit.md. Required author attribution is included in guides.
3. Tasks 4–6 integrated in one commit because App mounts preferences and new routes together. Cost: larger integration diff; independent review and full suites cover the boundary.
4. Browser state cases consolidated in tests/browser/sky-events.spec.ts rather than a separate state spec. Cost: one longer test file, with equivalent discoverability.

Exact event times are global predicted instants converted through browser timezone rules. Approximate dates retain source basis. Neither establishes local visibility, local eclipse contacts, weather, access, or an observing guarantee. Research is bundled and does not depend on a runtime remote feed. Monthly editorial review and extending the year-specific catalogue remain ongoing maintenance. Future coverage gaps block release builds and appear honestly in the calendar.

Local preview: http://127.0.0.1:5180/about and http://127.0.0.1:5180/sky-events . Existing splash/music retained; public ChatGPT listing remains unavailable and CTA uses setup/availability page.
