# About and Sky Events design

Status: approved by user and implemented locally on 2026-10-16. Verification: docs/website/about-sky-events-verification.md. This document records the design used for implementation.

## Outcome and boundaries

Visitors should understand why NightSky exists, discover a reviewed selection of upcoming astronomical events, distinguish global event timing from local visibility, and explore their next step through the plugin. Work only in the website worktree on codex/website-plugin-design. Do not inspect, import, call, modify, or start processes from the separate plugin. Preserve entrance, music, Collective, Resources, News, primary ChatGPT action, and release safeguards.

About and calendar are two independently testable deliverables within this website revision. Build About first, then calendar domain/content, then UI/integration. No new service, database, account, geolocation request, administrative interface, automatic scraper, notification system, or paid API. No calendar subscription/export in this release.

## About: exact proposed content and composition

Use existing licensed/approved website image assets and the established night/gold/serif palette. Dedicated layout; do not reuse the sparse generic editorial body. Keep one page H1, meaningful image alternatives, strong contrast, reduced-motion support. Images are illustrative, not evidence of an expedition or team activity.

1. Full-width 70–80svh sky hero, centered: eyebrow “About NightSky”; H1 “Where Earth Looks Up”; introduction “NightSky begins with curiosity about the universe—and the wish to experience more of it.”
2. Centered story opening, H2 “It starts with looking up.” Body: “A bright point above the rooftops. A photograph you want to make. A question that stays with you long after the night is over. There are many ways to become curious about the sky.” Follow: “NightSky is being built to give that curiosity somewhere to go: into understanding, into creative work, and into time spent beneath the stars.”
3. Alternating image/text, H2 “From curiosity to understanding.” Body: “An idea soon meets practical questions. What am I looking at? When should I go? How does moonlight change the night? What can I try with the equipment I already have?” Follow: “NightSky brings those questions into a conversation, helping you connect information with what you want to learn, experience, or create.”
4. Product section, H2 “A companion for the conversation.” Body: “NightSky is a plugin for your AI assistant, launching first on ChatGPT. Ask for an explanation, explore a chosen night, compare alternatives, or work through how to prepare.” Follow: “You can begin with a question, a destination, an observing goal, or a creative idea. The conversation can grow from there.” Use four short capabilities: Understand the sky / Prepare to observe / Explore places and moments / Develop a creative approach. Do not claim media generation, automatic video tools, or guaranteed visibility.
5. Three principles under H2 “Wonder deserves care.” “Explain the reasoning”: “A useful answer helps you understand why.” “Show the sources”: “Know where the information comes from and what it covers.” “Acknowledge the gaps”: “Missing information should remain visible, so you know what still needs checking.” Link “Explore sources & coverage”.
6. Image-led bridge, H2 “A shared sky.” Body: “The wider ambition is to bring people closer to the sky and to one another. The Collective is where shared learning, observing stories, and new connections will take shape.” Link “Discover The Collective”. Do not repeat its people grid or imply membership is open.
7. Restrained closing, H2 “Follow your curiosity.” Body: “Bring a question, a place, or an idea. Discover your next step with NightSky.” Existing PluginAction. No names, invented history, tour services, or unconfirmed partnerships.

## Sky Events: page and interaction

Canonical index /sky-events; detail /sky-events/:id with stable year-specific occurrence IDs such as geminids-2026. Categories: meteor-showers, eclipses, moon, planets. Categories are editorial, not claims that the plugin calculates every event. Aurora and seasonal Milky Way opportunities are resources, not scheduled forecast events.

Hero: H1 “Something worth looking up for.” Intro “A calendar of selected moments in the sky. Discover what is coming up, understand what makes it interesting, and explore the conditions that matter.” Eyebrow “Sky Events”. Shorter than About: approximately 40–50svh so calendar controls arrive quickly.

Page order: hero → next three reviewed events → calendar controls/month or list → reading the calendar and preparation → plugin action. Top cards are independent of the selected month/category and are labelled “Coming up next · All categories”. If an event is underway, label “Ongoing” or “Activity underway”; do not call a past peak upcoming. Exclude events whose entire relevant period has passed.

Controls: Previous month / Today / Next month; month+year input/select; Calendar/List buttons with aria-pressed; category select; explicit time-zone controls. Date navigation is not limited to populated months. Use Monday-start Gregorian weeks. Show adjacent-month dates muted with links only when relevant; current day marked with text/aria-current=date. No drag, hover-only information, or color-only categories.

Desktop initial view: month table. Mobile initial view: chronological list at <=700px. Respect an explicit URL view or saved choice before this responsive default; do not switch view while resizing. Month view uses a semantic table, ordinary links in dated cells, and a caption with month/year. On small screens an explicitly selected month view may scroll inside a labelled calendar region; the whole page must not overflow. List and grid show the same set of occurrences. Clip long labels with accessible full names, show at most two event entries per cell, and make “+N more” a button opening that date’s full list beneath the calendar with focus moved to its heading. Seasonal/general advice is not inserted as all-day events.

Card content: category in words, event name, date/window with qualifier and basis, brief significance, broad visibility, equipment expectations, “Explore event”. Detail: visual hero; what happens; timing and its meaning; where broadly visible; what affects viewing; practical preparation; linked sources and reviewed date; contextual example question; PluginAction and back link retaining valid calendar state. No guarantee of counts, clear skies, local eclipse timing, or visibility.

Empty month: “No reviewed events listed for this month.” Keep navigation and category reset. Distinguish filtered empty, reviewed month with no selected events, and month outside researched coverage. Outside coverage: “This month has not been reviewed yet.” Show nearest listed future month when available. Never fabricate entries or silently reuse the previous year. Dates outside coverage remain browsable. Unknown detail IDs show not-found with proper host 404; retained known legacy meteor records remain noindex archives.

## Time model: exact, approximate, and date-only

Use a discriminated union; never coerce every entry to a Date at midnight.

- instant: verified UTC timestamp, minute precision, and semantic label (e.g. global maximum, conjunction). This is one physical instant; local date can differ by zone.
- interval: verified UTC start/end, end-exclusive. Localize both endpoints. Assign to every local calendar date intersecting the interval; an end exactly at midnight does not add the following day. Represents a sourced activity interval, not a guarantee of continuous visibility.
- approximate: verified inclusive YYYY-MM-DD date range, basis UTC or an explicit source-calendar label, and a qualification such as “Expected peak around”. Keep source dates/basis intact. No midnight instants or invented exact time. Calendar entries visibly marked “Approx. · source dates”; timezone change does not shift these dates.

An occurrence has primary timing plus optional activity timing. For a meteor shower, primary peak marker and activity period remain visibly distinct. The calendar/list indexes the union of relevant primary/activity dates; use one occurrence per cell, annotate “Activity” when the peak is not on that day. List renders each occurrence once for the month and labels peak passed/activity ongoing when appropriate. Highlight ordering: upcoming primary peak first, then ongoing activity with peak-passed label; stable tie-break by ID. No currently active event is allowed to hide the next upcoming peak.

A source’s declared time scale is recorded. Do not relabel TT/TDB or a source-local date as UTC. When conversion evidence is absent, use qualified source dates or omit the exact value. Source disagreements are resolved and documented per record before publication. Never infer a new year by recurrence.

Timezone precedence: valid tz URL parameter → valid saved website preference → browser-detected IANA zone → UTC. Use Intl.DateTimeFormat with timeZone and Gregorian Latin-number formatToParts to create YYYY-MM-DD keys; do not parse display strings or add fixed offsets. Validate aliases through Intl; accept Asia/Calcutta as well as Asia/Kolkata if supported. Enumerate supported zones where available; provide UTC, detected/saved supported aliases, and a tested common-zone fallback otherwise. Selection controls must offer a way to return to browser default.

Header: “Exact times shown in {zone} · {offset for selected month’s first day}”. Offsets on individual event times always use the event instant; an offset in the header is explicitly a month-start reference, not a promise for every date. “Approximate dates retain their source basis. Visibility varies by location.” No ambiguous abbreviation such as IST by itself. Display 24-hour clock with explicit date/year and zone. If Intl fails, show UTC and a readable notice instead of crashing.

The URL /sky-events?month=YYYY-MM&category=...&view=month|list&tz=... is shareable. Invalid parameters normalize safely while preserving unrelated parameters. Month/category/view/tz changes push history; typing into timezone search does not. Back/forward restores UI. Store only user-selected zone and view with try/catch; failure never blocks browsing. Month defaults to current month in selected zone; later zone changes keep an explicitly selected month. Today resets to current month in selected zone. Refresh now on focus/visibility and at most once per minute so an open tab can pass midnight without stale Today/highlights; clean up listeners/timers.

Global timing is not local visibility. No location input or “visible near me” filter in this release. No geolocation requests. Plugin CTA initially retains local setup/availability destination; an example question can be copied with an explicit success/failure state, never a claim it was sent to ChatGPT.

## Editorial data and maintenance

Single website-owned collection shared by index, guides, and homepage. Data fields: ID, title, category, synopsis, primary/activity timing, broad visibility, equipment, authored guide sections, contextual question, source references, lastReviewedAt, reviewStatus. Each timing claim names its supporting source. HTTPS source URLs and real dates required; duplicate IDs, malformed intervals and published entries without evidence fail content validation.

Keep drafts out of UI, sitemap and redirects. Build validates all records and the coverage manifest before producing output. No runtime dependence on NASA/IMO availability. No plugin data coupling. NASA/IMO provide research inputs; this is not a claim of an existing free JSON feed. Do not copy copyrighted summaries or images; write original explanations and reuse existing approved site assets.

Initial research target: current month plus next eleven calendar months at implementation time; individually review selected events and maintain a per-month coverage manifest (reviewedAt and selection scope). Do not claim a complete astronomy calendar or a reviewed month until its research is finished. Target balanced coverage of the four categories where supported by evidence, not an arbitrary event quota. Remaining unreviewed months may be previewed honestly but must be listed as incomplete in handoff; no claim of a fully populated launch calendar until the target research is complete. A separate pure validator reports coverage gaps as release blockers for this feature without weakening existing release gates.

Maintenance guide: add/update original source-backed occurrence; review each claim and time scale; mark reviewed; update coverage manifest; run validation/tests; build website. Recommend monthly review and annual extension; no scheduled automation created. Expired events move out of upcoming automatically, retain year-specific detail URLs, and remain labelled past events. Corrected/withdrawn occurrences are excluded from upcoming and sitemap, with an explanatory noindex page only if an already published URL needs preservation.

## Homepage, navigation, and old URLs

Homepage section “Next in the night sky”, up to three cards from the same reviewed catalogue and timing functions. CTA “Explore sky events”. If none, “More moments are being researched. Explore the calendar and skywatching resources.” Never label a static preparation paragraph “Next”. Home uses the same timezone preference and qualifiers as the calendar. Header stays About → The Collective → Resources → News → ChatGPT action. Footer replaces Meteor Showers with Sky Events.

/meteor-nights and /meteor-showers permanently redirect in one hop to /sky-events?category=meteor-showers on server and generated static host rules; client fallback matches. Existing /meteor-shower/:id paths remain known noindex archives with links to the filtered calendar unless a year/occurrence mapping is explicitly verified. Do not guess mappings from shower names. Only canonical index and reviewed occurrence pages enter the release sitemap, without filter query URLs or drafts. Continue preview noindex and retired Experiences 410 behavior. Avoid tourist Event structured data: these are natural phenomena, not NightSky-organized events. About metadata describes the product, not expeditions.

## Acceptance

Review screenshots at desktop and 375px; test reflow at 320/640px; keyboard/calendar overflow controls; long title and dense day fixtures; failed media; reduced motion; persistent audio on route changes; source links; clipboard failure. Timing tests cover positive/negative/fractional offsets, month/year crossover, leap day, US DST transitions, midnight endpoints, unknown time scales and approximate ranges. Route tests cover live app and production-shaped host/generated redirects; Netlify equivalence is not claimed without an actual host check.

Official research references checked during planning: https://www.iana.org/time-zones ; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat ; https://eclipse.gsfc.nasa.gov/SKYCAL/SKYCAL.html?cal=2026 ; https://www.imo.net/files/meteor-shower/cal2026.pdf . These are discovery references, not completed factual review of the launch catalogue.
