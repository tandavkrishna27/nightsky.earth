# NightSky Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution method is not yet chosen; native execution is recommended for this tightly connected website change.

**Goal:** Evolve the existing NightSky website into a clear, useful companion to the ChatGPT plugin, with approved storytelling, searchable Resources, The Collective, attributed News, and accurate supporting pages.

**Architecture:** Retain React/Vite/Wouter and existing visual assets/components. Use website-owned configuration, route inventory, curated catalogues and small pure helpers; adapt the existing read-only news backend for the checked-in Netlify deployment without connecting to the plugin service. Default to a truthful unpublished-listing state and a preview build while release facts are outstanding.

**Tech Stack:** Existing React 18, TypeScript, Vite 5, Wouter 3, TanStack Query 5, Express, Zod, Tailwind and Framer Motion. Use existing tsx plus Node's test runner for pure/server tests; add @playwright/test as a development dependency only for meaningful browser checks. Lock resolved tooling in this website's package-lock.json; no runtime search service or new application framework.

**Spec:** ../specs/2026-10-16-website-product-design.md (owner-approved 16 October 2026).

**Status:** Detailed plan for review, not implementation or deployment approval. All paths below are relative to the website worktree C:/Users/TK/OneDrive/Desktop/Claude Data/nightsky.earth-main/.worktrees/website-plugin-design. Only this worktree may be read or changed during execution; no plugin workspace access is needed.

## Global Constraints

- “The website must preserve its existing dark sky identity and hero.”
- “It must stop presenting NightSky as an operating expedition company.”
- “It must not reduce every interaction to generating an outing plan.”
- “Keep Resources under that name and add useful search.”
- “Keep The Collective; remove WhatsApp. No community form, signup, waiting list, placeholder button, or data collection in this phase. The owner will provide a form later.”
- “Adapt the About story without names or invented biographical history.”
- “Use NightSky.earth2026@gmail.com for support.”
- “No new CMS, search service, accounts, plugin calls from the website, or web-based planning tool.”
- “Do not modify plugin manifests, skills, service code, or shared plugin data.” Website shared/ is inside this worktree; never confuse it with parent shared/ or plugin shared/.
- No publishing, deployment, plugin processes, plugin tests, cross-worktree dependency links, merging plugin branches, or changes outside this website checkout. Use the checked-out website branch only.
- Preserve Cosmic Black #0C0C0E, Midnight Blue #0E1633, Starlight White #F2F1EB, Meteor Gold #C2A977, Playfair Display headings and Inter body; validate actual contrast.
- Spec section 5 and sections 6–11 are the copy source of truth. Copy them faithfully; factual edits require evidence recorded in the content audit. Do not insert stock testimonials or new marketing claims.

## Review Focus

1. Missing, malformed or unverified listing settings must yield Get started, never a fake install destination (Task 1).
2. Filtered resource URLs, browser back/forward and no-match searches must agree with visible controls and results (Task 4).
3. News failure/racing searches must not show unrelated cached stories or break sitemap delivery (Tasks 5, 6, 9).
4. Exhausted, unreviewed or invalid meteor records must produce evergreen guidance, including near date/year boundaries (Task 7).
5. Static-host deep links/retired URLs and incomplete launch facts must not masquerade as working API routes or final policies (Tasks 5, 8, 9).

## Scope and implementation boundaries

This is one coordinated website release, divided into independently reviewable deliverables. It necessarily touches more than eight files because multiple existing public pages carry the old expedition identity; fewer files would leave the public story inconsistent. No new business subsystem, persistent store, user account or service is introduced. Each task ends with bounded verification and a website-only commit. Do not ship partial public routes before Task 10.

If implementation discovers a missing library, build issue or factual gap, fix it only when necessary inside this website's scope. Record unrelated baseline failures; do not use the plugin checkout as a source of fixes. Launch facts are supplied by the owner, not reverse-engineered by editing the plugin.

## File ownership and interfaces

| Area | Files and responsibility |
|---|---|
| Shared website contract | shared/website.ts: production origin, route metadata, listing/support state, preview/release gates |
| Website copy | client/src/content/websiteCopy.ts: approved Home/About/Collective/Contact/Get started copy and sample questions |
| Shared shell | client/src/App.tsx, components/Navigation.tsx, Footer.tsx, PluginAction.tsx, PageShell.tsx: one header/main/footer and coherent action |
| Hero/Home | pages/Home.tsx, components/HeroSectionVideo.tsx, VideoBackground.tsx, home/QuestionExplorer.tsx: preserved visuals, differentiated sections, media fallback |
| Editorial pages | pages/About.tsx, Community.tsx, Contact.tsx, GetStarted.tsx: exact approved narrative and honest support/setup |
| Resources | content/resources.ts, lib/resourceSearch.ts, pages/Resources.tsx: reviewed catalogue, URL state, local results |
| News | shared/news.ts, server/news.ts, server/routes.ts, netlify/functions/news.ts, client/src/lib/newsSearch.ts, pages/News.tsx, NewsArticle.tsx: one validated delivery contract across host adapters |
| Meteors | shared/meteorShowers.ts, shared/meteorContent.ts, pages/MeteorNights.tsx, MeteorShowerDetail.tsx: keep old identifiers, expose only reviewed facts/dates |
| Trust pages | content/releaseFacts.ts, pages/Sources.tsx, Privacy.tsx, Terms.tsx: structured evidence and preview-safe drafts |
| Host/SEO | components/SEO.tsx, client/index.html, scripts/build-website.ts, scripts/serve-website.mjs, netlify.toml, client/public/404.html, client/public/410.html: canonical metadata, generated host routes and independent sitemap |
| Verification | tests/unit/*.test.ts, tests/browser/*.spec.ts, scripts/run-unit-tests.mjs, playwright.config.ts, tsconfig.tests.json: scoped repeatable checks |
| Documentation | design_guidelines.md, DEPLOYMENT.md, docs/website/content-audit.md, release-checklist.md, verification.md: copy provenance, operational truth, actual evidence |

Keep retired source files Experiences.tsx and old audio/entrance components, but remove active imports and public links. Do not add folders beyond this map without a concrete need. Small functions may remain in the named module rather than spawning one file per field.

Dependencies:
```text
1 configuration/test harness -> 2 shared shell -> 3 Home/editorial pages
1 -> 4 Resources
1 -> 5 News delivery -> 6 News interface
1 -> 7 meteor review/index -> Home upcoming section
1 + owner facts -> 8 supporting pages
2–8 -> 9 host routing/SEO/release build -> 10 integrated verification
```

## Task 1: Website-only baseline, shared contract and verification harness

**Files:** Create shared/website.ts, scripts/run-unit-tests.mjs, scripts/serve-website.mjs, playwright.config.ts, tsconfig.tests.json, tests/unit/website.test.ts, tests/browser/baseline.spec.ts, docs/website/verification.md. Modify server/index.ts for portable local startup; package.json, package-lock.json, .env.example, .gitignore only if test reports need ignoring.

**Interfaces:** `ListingConfig = { published: boolean; url: string | null }`; `resolvePluginAction(config: ListingConfig): { label: string; href: string; external: boolean }`. `SITE_ORIGIN = 'https://nightsky.earth'`; `SUPPORT_EMAIL = 'NightSky.earth2026@gmail.com'`. `SiteRoute = { path: string; title: string; description: string; sitemap: boolean }`; `siteRoutes: readonly SiteRoute[]` enumerates the spec's fixed pages, excluding redirects/retired paths. `canonicalUrl(path: string): string` keeps the pathname and drops query/hash using SITE_ORIGIN. Website build config uses `VITE_NIGHTSKY_LISTING_PUBLISHED=false`, `VITE_NIGHTSKY_LISTING_URL=''`, `WEBSITE_RELEASE=false` by default. Never put secrets in VITE variables.

- [ ] Record absolute cwd, branch, HEAD and current status. Verify branch codex/website-plugin-design. Run dependency installation with npm ci in this worktree only; do not reuse sibling node_modules. Record npm run check and npm run build output as the baseline before modifying product files. Reuse a local free port, default 5178; do not stop another session's server.
- [ ] Add the bounded test tooling. `test:unit` runs `node scripts/run-unit-tests.mjs`; the script enumerates tests/unit/**/*.test.ts deterministically and spawns this Node executable with `--import tsx --test` and explicit absolute files (avoid Windows shell glob assumptions). `test:browser` runs `playwright test --config=playwright.config.ts` and excludes host-routing.spec.ts; `check:tests` runs `tsc -p tsconfig.tests.json --noEmit`, including new shared/client helpers, server/functions/scripts, test files and Playwright configs (override the existing test exclusion). Pin the installed browser tooling via this lockfile. No test dependency changes during the planning phase.
- [ ] Write failing tests covering these exact assertions (imports target the new module):
```ts
assert.deepEqual(resolvePluginAction({published:false,url:null}),
  {label:'Get started',href:'/get-started',external:false});
for (const url of ['', 'http://chatgpt.com/example', 'javascript:alert(1)',
  'https://example.com/fake', 'https://chatgpt.com.evil.test/plugin',
  'https://user:secret@chatgpt.com/plugin']) {
  assert.equal(resolvePluginAction({published:true,url}).href, '/get-started');
}
assert.equal(resolvePluginAction({published:false,url:'https://chatgpt.com/example'}).external,false);
assert.equal(resolvePluginAction({published:true,url:'https://chatgpt.com/example'}).label,
  'Get NightSky for ChatGPT');
assert.equal(canonicalUrl('/resources?q=moon#results'), 'https://nightsky.earth/resources');
```
  `/example` is a synthetic test URL, never a production destination. Accept only HTTPS, exact chatgpt.com hostname, no credentials, and a non-root path; publication remains an owner-verified boolean, not something URL validation can establish. Reject generic `/apps`, `/plugins`, `/gpts` directories. If the real portal supplies a different official hostname, verify it with official docs and update the allowlist explicitly.
- [ ] Run npm run test:unit; confirm the new contract tests fail for the missing module/functions. Implement configuration, route descriptions from the approved brief, URL normalization and unavailable fallback. Make URL parsing total: malformed values must not throw on page render.
- [ ] Create scripts/serve-website.mjs: set NODE_ENV=development and PORT only when absent, then dynamically import ../server/index.ts. Add dev:website with exact command `node --import tsx scripts/serve-website.mjs`; Playwright webServer runs `npm run dev:website` with port 5178, reuseExistingServer false, bounded timeout, and explicit occupied-port error. Default loopback host for development; remove unconditional reusePort. Browser baseline asserts Home mounts without a page error (it may still have the old entrance screen); intercept /api/news requests so no tests call a live upstream. Add host-routing project later in Task 9, rather than referring to a server that does not yet exist.
- [ ] Run npm run test:unit, npm run check:tests and baseline browser smoke; record actual results. Commit only Task 1 paths: `test: establish website contracts and verification harness`.

## Task 2: One shared shell, navigation and availability-aware actions

**Files:** Create client/src/components/PageShell.tsx, PluginAction.tsx; tests/browser/shell.spec.ts. Modify App.tsx, Navigation.tsx, Footer.tsx, index.css and all active pages to remove their duplicate Navigation/Footer wrappers (mechanical shell changes only in this task). Leave Experiences inactive and unchanged.

**Interfaces:** `PluginAction({className?, config?}: {className?: string; config?: ListingConfig})` renders a real anchor using Task 1; external actions identify ChatGPT and use safe link attributes if opened in a new tab. `PageShell({children}: {children: React.ReactNode})` owns skip link, Navigation, main#main-content and Footer. App mounts one PageShell around Router. No nested anchor/button markup.

- [ ] Add failing browser assertions: Home has exactly one banner/main/contentinfo; header exposes Resources, The Collective, News, About and Get started under default config; no Experiences link, bottom navigation, entrance dialog or audio element. At 375px, open menu with keyboard, Escape closes, focus returns to trigger, and a selected link closes menu. Set reduced motion in the test context.
- [ ] Run the shell spec and confirm its assertions fail on the old public shell. Refactor App to remove BackgroundMusic, FloatingMuteButton, EnterExperience, BottomNavigation imports/state and bottom padding. Keep the retired source files. Remove active pages' fixed 1-second loading gates; keep genuine News query loading states.
- [ ] Implement semantic shared shell, `aria-current`, labelled menu trigger with expanded state, visible keyboard focus, support mailto and the approved footer groups. Expose all planned route destinations; actual pages land in later tasks. Add scroll-margin-top on anchor destinations and honor reduced motion without hiding text.
- [ ] Run the shell browser spec and inspect the shell at desktop/mobile widths. Commit `feat: align website navigation and shared product actions`.

## Task 3: Approved storytelling on Home and editorial pages

**Files:** Create client/src/content/websiteCopy.ts, components/home/QuestionExplorer.tsx, pages/GetStarted.tsx, tests/browser/home.spec.ts, editorial.spec.ts. Modify pages/Home.tsx, About.tsx, Community.tsx, Contact.tsx, App.tsx, components/HeroSectionVideo.tsx, VideoBackground.tsx, design_guidelines.md.

**Interfaces:** `QuestionMode = 'understand'|'explore'|'compare'|'prepare'`; `questionExamples: readonly {id: QuestionMode; label: string; question: string; explanation: string}[]` holds the spec's exact four examples. `QuestionExplorer()` owns local selection and clipboard feedback; no plugin/network calls. Home receives reviewed upcoming data from Task 7; until then use the specified evergreen content rather than old unreviewed records.

- [ ] Write browser tests for selection and failure behavior: choosing Compare changes the visible question and selected state; Copy question announces success only after clipboard resolves; reject clipboard and show the selectable-text instructions; no question selection triggers /api requests. Tests assert the preserved hero headline and actionable anchors, not all marketing paragraphs.
- [ ] Implement the approved Home sequence: Hero; Journeys/#possibilities; Universe example panel plus short setup strip; Moments; meteor cards/fallback; Ready to look up. Remove Our Story, tour durations, booking, gallery quote overlays and benefit claims. Use direct copy references from spec 5.1–5.6. Activity links open Resources with the exact topic parameters. Examples are labelled as questions, never fabricated answers.
- [ ] Keep the star background. Locate the referenced /Nightskyearth.mp4 inside this worktree; if absent, do not fetch from plugin or pretend video exists. Render the existing licensed still image with the same composition and record the missing optional video. Implement fallback as a sibling image/surface behind the video, not an unsupported div inside video. On error, failed play or reduced motion keep readable text/actions; do not request video at all under reduced motion. Inspect retained imagery for embedded travel messaging.
- [ ] Implement About from spec 8, Collective from spec 7, Contact/Get started from spec 11. No names, fictional origin, WhatsApp, form, signup, waiting list, disabled CTA or send-success toast. Contact address stays selectable with “Email NightSky” and email-app explanation. Get started shows unpublished status and example questions until tested listing/setup facts are supplied.
- [ ] Use native labelled buttons with `aria-pressed` for example modes (not an incomplete ARIA tab pattern); associate the panel with its heading. Update guidelines to preserve visual identity while replacing expedition positioning. Run unit/test type checks and Home/editorial browser cases. Commit `feat: tell the NightSky product story across core pages`.

## Task 4: Curated searchable Resources

**Files:** Create client/src/content/resources.ts, lib/resourceSearch.ts, tests/unit/resources.test.ts, tests/browser/resources.spec.ts, docs/website/content-audit.md. Modify pages/Resources.tsx.

**Interfaces:** `ResourceTopic = 'stargazing'|'photography'|'weather'|'events'|'places'|'equipment'`; `ResourceFormat = 'tools'|'guides'|'learning'|'communities'`; `Resource = {id:string; name:string; description:string; topics:ResourceTopic[]; format:ResourceFormat; url:string; reviewedAt:string; platforms?:string[]; costLabel?:string}`. `ResourceState = {q:string; topic:ResourceTopic|'all'; format:ResourceFormat|'all'}`. `parseResourceState(search:string):ResourceState`; `serializeResourceState(state:ResourceState, baseSearch=''):string` preserves unrelated URL parameters from baseSearch while replacing/removing q/topic/format; `filterResources(items:readonly Resource[],state:ResourceState):Resource[]`.

- [ ] Write failing tests with synthetic entries `moon-guide` (Moon photography, photography, guides), `sky-map` (Stargazing map, stargazing, tools), and `forecast` (Cloud forecast, weather, tools): case/whitespace normalization, AND across words, combined topic/format, unknown values -> all, empty query -> editorial order, serialization round-trip, and preserving `?ref=home` through filter changes and Clear filters. Assert filtering never mutates input.
- [ ] Run the new tests red, then implement local filtering/URL helpers. Match every trimmed lowercased query token against title/description/topics. No fuzzy search library. Add visible result count and Clear filters. Preserve unrelated URL parameters if any; omit empty q/all defaults; use URLSearchParams encoding, never string-built unescaped queries.
- [ ] Audit every existing record before deciding retention. Use official source pages, record checked date, claim/link/rights, and retained/rewritten/omitted disposition in content-audit.md. Remove stale services, duplicates, unverified prices/member counts, platform assertions and destination superlatives. Curate a compact useful catalogue; no target count that encourages filler. Do not invent resources to populate every filter. A valid empty category uses the designed empty state.
- [ ] Build labelled live local search (replaceState while typing) and topic/format changes (pushState); listen to URL/back/forward changes as the source of truth. Explicitly test both navigation entries and edits. A single result area with static data needs no skeleton. Display Reviewed dates as review dates, not live checks. External links are real navigation with clear destinations.
- [ ] Browser tests: enter multiword query; combine filters; verify count/cards; clear; reload direct `/resources?topic=photography`; back/forward after topic changes; empty-state recovery; keyboard labels/focus. Run resources unit cases and, once available, browser cases. Commit `feat: add curated searchable astronomy resources`.

## Task 5: Shared News delivery and local/Netlify adapters

**Files:** Create shared/news.ts, server/news.ts, netlify/functions/news.ts, tests/unit/news-server.test.ts. Modify server/routes.ts, netlify.toml, tsconfig.tests.json. Reuse the local startup harness from Task 1.

**Interfaces:** Website API stays `/api/news?limit=12&offset=0&search=...&news_site=...` and `/api/news/:id`. `NewsArticle = {id:number;title:string;url:string;publisher:string;summary:string;publishedAt:string|null;imageUrl:string|null}` and `NewsPage = {count:number;results:NewsArticle[]}` in shared/news.ts are the website-owned normalized view. `serveNews(request:Request, deps?:{fetch:typeof fetch}):Promise<Response>` lives in server/news.ts and owns validation/normalization/failures; Express and Netlify only adapt requests/responses. Upstream origin fixed to https://api.spaceflightnewsapi.net/v4; no user-supplied hosts. Do not modify existing database user types in shared/schema.ts.

- [ ] Record checked-in hosting assumption in DEPLOYMENT notes: default Netlify static+function, no new hosting account/deploy. If the owner confirms Express hosting, retain its adapter and omit unnecessary Netlify adapter wiring. Both adapters must use serveNews; do not maintain two independent proxy implementations.
- [ ] Write failing Node tests with injected fetch: GET list and numeric article ID; reject non-GET with 405; invalid/non-integer/negative offset and limit outside 1..12 -> 400; empty/trimmed search, maximum search length 200, source length 100; detail IDs positive safe integers; upstream 404 detail -> 404, timeout -> 504, other upstream failure/malformed JSON -> 502. Abort after 8 seconds and clear timer in finally. Bound offset to 12000; unsupported filters cannot append arbitrary upstream parameters.
- [ ] Tests also prove upstream strings are treated as data, article URLs/images allow only HTTP(S) without credentials, unsafe destination items are omitted, invalid dates produce an explicit null/unknown presentation rather than Invalid Date, unknown extra provider fields are ignored, no raw upstream error body is returned. Normalize documented provider field names, handle optional authors/image fields defensively. Invalid required page/count/results shape -> 502 rather than pretending empty success. Missing optional image -> text-only preview.
- [ ] Implement shared delivery and adapters. Keep responses JSON, same-origin only (no wildcard CORS), no payload logging, no authentication or plugin access. Set bounded HTTP cache policy on successful news responses; return no-store on errors. Pagination remains fixed at 12 in the UI. Add explicit Netlify routes for exact `/api/news` and `/api/news/*` before SPA fallback; function mapping must preserve query and recognize suffix/ID deterministically, tested for both paths. Do not proxy arbitrary provider paths.
- [ ] Confirm the Task 1 startup harness still runs the Express adapter and that production-shaped Netlify mapping resolves the same list/detail requests; adapter tests explicitly cover function-native request paths and preserved query parameters. Do not change global startup behavior as part of News delivery.
- [ ] Run server unit cases and all now-runnable browser tasks. Test API route success with fixtures at the adapter boundary; do not rely on a live provider in CI. Commit `fix: make website news delivery portable and bounded`.

## Task 6: News search, attribution and honest failure states

**Files:** Create client/src/lib/newsSearch.ts, tests/unit/news-search.test.ts, tests/browser/news.spec.ts; modify pages/News.tsx, NewsArticle.tsx. Existing global queryClient stays unchanged unless a directly required fix is demonstrated.

**Interfaces:** `NewsSearch = {q:string; source:string; page:number}`; `parseNewsSearch(search:string):NewsSearch`; `serializeNewsSearch(state:NewsSearch):string`; `newsApiUrl(state:NewsSearch):string`. URL parameters q/source/page are human-facing (page starts at 1); API offset is `(page-1)*12`. Bounded page 1..1001 corresponds to Task 5 offset <=12000. `fetchNews` consumes query context AbortSignal and returns Task 5's normalized NewsPage. No direct browser calls to the upstream provider.

- [ ] Red tests assert page 2 -> offset 12, malformed/negative/too-large page -> 1, encoded query/source round-trip, query/source change -> page 1. Browser tests submit a search (typing alone sends no request), change topic, reload/back/forward, and assert correct visible URL and request.
- [ ] Implement one responsive list/grid layout, approved heading/description and Search topics controls. Use only publisher choices verified against provider values; default to a labelled source text filter if no maintained choices are available, rather than fictional list options. NewsArticle uses the normalized contract; do not preserve conflicting same-name imports/components.
- [ ] Use query keys containing committed q/source/page; pass AbortSignal to fetch. Set News-only staleTime 60 seconds, retry false, and display fetched timestamp for cached results. A failed refresh may retain only cached data for the same query key, labelled “Showing previously loaded stories.” Never display prior-query stories under a new query label. New query initial load shows skeletons.
- [ ] Show publisher, actual publication date or “Publication date unavailable,” attributed permitted summary, and original link. No “real-time” or source-count promises. Omit images until reuse permission is established; image failure falls back to text. Article 404 is different from network failure: show not-found vs retry respectively. Verify original destinations use safe validated URLs; render text without dangerous HTML.
- [ ] Resolve out-of-range non-first page once by replacing URL page=1 and explaining reset. Clear search and Retry must retain sensible focus. Preserve listing state when returning from article via URL/back history. Write controlled delayed responses proving the newest query wins, old-cache query isolation, refresh failure, zero results, malformed feed, image error, article 404 and Retry success. Run unit and browser tests. Commit `feat: clarify news discovery and publisher attribution`.

## Task 7: Reviewed meteor content and dated-data fallbacks

**Files:** Create shared/meteorContent.ts, tests/unit/meteors.test.ts, tests/browser/meteors.spec.ts; modify shared/meteorShowers.ts only for necessary website corrections, pages/MeteorNights.tsx, MeteorShowerDetail.tsx, Home.tsx, content-audit.md. No plugin data imports.

**Interfaces:** Preserve old `getMeteorShowerById(id)` identifiers; wrap existing arrays with `ReviewedMeteor = {id:string; name:string; overview:string; reviewedAt:string; sources:string[]; peak?:{startDate:string; endDate:string; basis:'UTC-catalogue-date'; year:number}}`. `legacyMeteorIds: readonly string[]` enumerates all recognized original IDs separately from `reviewedMeteors: readonly ReviewedMeteor[]`, which includes only fact-checked records. A recognized but unreviewed ID renders a noindex archive notice with the ID and general guide link, never its old unverified factual fields; an unknown ID is not-found. `upcomingMeteors(records:readonly ReviewedMeteor[], now:Date, count=3):ReviewedMeteor[]` uses UTC calendar dates consistently; invalid/missing/reversed dates omitted, inclusive through catalogue end date; stable ascending date/id order. Preserve IDs such as perseids and perseids-2026 as distinct historical records, not aliases to new predictions.

- [ ] Red tests use synthetic reviewed records: inclusive final UTC catalogue day, next-day exclusion, leap date validation, invalid calendar day, reversed interval, unreviewed/no-peak exclusion, year boundary, count cap and expired-all -> empty. Run under two TZ values via child process with task-specific env and expect identical results. Tests do not assert actual astronomical facts.
- [ ] Review retained dates and background against authoritative astronomy sources; record exact links, date basis and fields checked in content-audit.md. Do not guess source time standards; omit peak block if UTC basis cannot be established. Remove unsupported Moon favorability, worldwide visibility, “year's best show,” counts and prediction certainty. No future year extrapolation. If no reviewed future dates survive, Home and index show evergreen preparation content.
- [ ] Rewrite index as Meteor Showers using spec 10. Current-year selection is available only if reviewed records exist; distinguish past content and evergreen overview. Preserve valid detail identifiers with reviewed historical context. For IDs only in legacyMeteorIds, show “This archived record is awaiting factual review. Explore our meteor-watching resources for general preparation.” and noindex; omit dates/rates/Moon/visibility claims. Invalid IDs get not-found. Replace Event/Offer/organizer schema with factual Article/WebPage markup appropriate to educational content.
- [ ] Wire Home to upcomingMeteors, max 3, without old unreviewed helper. Evergreen body uses spec 5.5 and links `/resources?topic=events`. Meteor detail offers selectable sample question and the shared plugin action; it does not promise local geometry. Test fixed-time Home fallback, old-ID navigation, no booking schema, invalid ID and factual source links. Commit `feat: ground meteor pages in reviewed observing information`.

## Task 8: Sources, Privacy and Terms with explicit factual readiness

**Files:** Create client/src/content/releaseFacts.ts, pages/Sources.tsx, Privacy.tsx, Terms.tsx, tests/unit/release-facts.test.ts, tests/browser/supporting-pages.spec.ts, docs/website/release-checklist.md; modify App.tsx and GetStarted.tsx for verified availability only.

**Interfaces:** `ReleaseFacts = {operator:string|null; hosting:string|null; recipients:string[]|null; loggedFields:string[]|null; retention:string|null; deletionProcess:string|null; analytics:string|null; sources:readonly {name:string; url:string; coverage:string; reviewedAt:string}[]; sourcesApprovedAt:string|null; hostingVerifiedAt:string|null; contentRightsApprovedAt:string|null; policiesApprovedAt:string|null; setupVerifiedAt:string|null}`. `releaseBlockers(facts:ReleaseFacts, listing:ListingConfig):string[]` returns specific missing factual/sign-off items. Empty verified recipient/log arrays mean confirmed none; null means unknown. All approval strings must be valid dates recorded from actual review; whitespace strings are missing. Require setupVerifiedAt only when resolvePluginAction(listing) resolves to the public listing; an unpublished plugin may coexist with a truthful public website. Sources inventory is website-owned factual text supplied by owner; never import plugin manifests to generate claims.

- [ ] Tests assert null/blank fields and absent sign-off yield named blockers; empty sources and absent sourcesApprovedAt block release; rights/hosting approvals are required. Confirmed empty recipient/log arrays are not mistaken for missing facts. Unverified setup hides invented instructions and blocks a published-listing release; unpublished listing plus absent setupVerifiedAt alone does not block an otherwise approved release. Unsafe source URL/missing coverage or review date remains a blocker. No automated test can assert legal correctness; owner approval remains explicit.
- [ ] Build readable sources/privacy/terms routes using spec 11's exact section structure. Sources introduction uses approved copy; all provider lists and policy assertions come from confirmed facts. Do not write final-looking policy promises with fake defaults. Until facts arrive, show a visible “Draft — not a published policy” notice and a clear explanation that factual review is pending, with support contact and section headings. Entire preview deployment is noindex and `X-Robots-Tag: noindex` (Task 9). No user submission form, cookies or analytics added by this work.
- [ ] Once owner supplies facts, draft concise prose describing actual website and plugin processing separately and request factual/legal sign-off before enabling WEBSITE_RELEASE. Do not substitute retention/jurisdiction “best guesses.” Confirm effective dates from approval, not build date. Record sign-off source in release-checklist.md. Factual missing items are publication dependencies, not permission to omit pages from local design.
- [ ] Browser-check one h1, readable sections, contact destination, preview notice and noindex; verify no final compliance/security claims in the missing-facts state. Run pure readiness tests and relevant browser specs. Commit `feat: add factual sources and supporting policy pages`.

## Task 9: Canonical metadata, generated routes and production-shaped hosting

**Files:** Create scripts/build-website.ts, shared/websiteBuild.ts, client/public/404.html, client/public/410.html, playwright.host.config.ts, tests/unit/site-build.test.ts, tests/browser/host-routing.spec.ts. Modify scripts/serve-website.mjs, package.json, server/routes.ts, server/vite.ts, client/index.html, components/SEO.tsx, App.tsx, netlify.toml, vite.config.ts, client/public/robots.txt, client/public/sitemap.xml, DEPLOYMENT.md; remove obsolete root public/robots.txt and public/sitemap.xml after adopting generated output as the single source. Create a documented OG asset from an existing permitted photograph if permitted, otherwise remove nonexistent image references. No ImageGen or new logo system is required.

**Interfaces:** `buildWebsiteOutputs({release:boolean,facts:ReleaseFacts,listing:ListingConfig,routes:readonly SiteRoute[],meteors:readonly ReviewedMeteor[],legacyMeteorIds:readonly string[]}):{sitemap:string;robots:string;redirects:string;headers:string}` pure in shared/websiteBuild.ts. `scripts/build-website.ts` runs Vite build and existing server bundle then emits generated host files into dist/public. `npm run build` defaults to preview, `build:release` calls this script with --release and refuses output on releaseBlockers(facts,listing), including explicit sources/hosting/content-rights sign-off fields. Set VITE_WEBSITE_RELEASE from this script's resolved release boolean before invoking Vite; expose no other policy facts through env. Server/headers, initial HTML and client SEO consume the same resolved mode rather than reading incompatible variables. `npm run test:host` runs `playwright test --config=playwright.host.config.ts`, matching only host-routing.spec.ts and starting only the production-shaped server. Add `start:website = node scripts/serve-website.mjs --production`; extend the script to parse --port=5179, set NODE_ENV=production and PORT, and import dist/index.js. Production server reads generated build-mode metadata, never reinterprets an unset development variable as publication approval.

- [ ] Red tests: sitemap uses SITE_ORIGIN, XML escapes URLs, includes fixed canonical pages and reviewed meteor IDs, excludes /experiences, /meteor-nights, preview-only/unreviewed records and query strings. No network call during sitemap generation, tested with fetch throwing. Preview sitemap contains no indexable URLs and robots disallows crawling. Preview headers noindex every route. Release refuses pending policy/source/hosting/rights confirmations. A missing plugin listing alone does not block release if setup page truthfully says unavailable. Using a synthetic fully approved release fixture, assert initial HTML, client SEO and generated host headers contain no preview noindex, and that reviewed routes enter the sitemap. Never treat that fixture as actual production approval.
- [ ] Generate redirect inventory from Task 1 siteRoutes plus reviewed and recognized legacy meteor IDs: `/meteor-nights` -> `/meteor-showers` 301; `/experiences` and `/experiences/*` -> static retired response with HTTP 410; fixed client routes and recognized detail IDs serve index 200; only reviewed records enter sitemap. Direct refresh of a recognized unreviewed ID returns safe archive/noindex content; genuinely unknown IDs return host 404. News detail IDs are dynamic: `/news/*` serves preview shell with client not-found/noindex for absent articles; document this SPA status limit rather than claiming per-article HTTP 404. Query strings do not change canonical routing. Remove conflicting blanket SPA rewrites from netlify.toml; preserve API rules first and generated known routes before fallback.
- [ ] Respect Vite's existing client root: explicitly set publicDir to client/public (absolute path) or retain its equivalent default. Put copied error/media assets there; after Vite copies assets, overwrite dist/public/robots.txt and sitemap.xml from buildWebsiteOutputs so stale copies cannot win. Remove obsolete root public/robots.txt and public/sitemap.xml; client/public copies remain preview-safe fallback stubs, while dev endpoints and built output use the helper. Assert emitted 404/410 files actually exist and their bodies contain the intended retirement/not-found copy; verify /Nightskyearth.mp4 is copied from client/public. Do not switch publicDir to root public/ and accidentally drop existing hero media.
- [ ] Check hosting support for an actual 410 response using the official host documentation at implementation time. If the checked-in Netlify host cannot return 410 through static rules, use a narrowly scoped retired function mapped only to /experiences paths or use documented true HTTP 404 with retirement copy; record the selected supported behavior. Never silently produce 200 with retired text. Tests assert the selected real status.
- [ ] Write `dist/website-build.json` with exactly `{release:boolean}` from the resolved build mode (outside the public directory); production Express reads it relative to the bundled dist/index.js. Missing/malformed metadata fails safe to preview/noindex, never publication. Tests share this artifact contract. Replace Express's upstream-dependent sitemap handler with website-only generated content; production adapter serves emitted sitemap/robots and uses the same explicit route/retirement inventory before static fallback. Development uses equivalent route decisions but retains Vite asset handling. Serve assets/API before page fallbacks; never rewrite failed /api requests into HTML. Keep /news/* unknown-ID exception explicit. Production script uses cross-platform startup and no reusePort assumptions.
- [ ] SEO uses canonicalUrl and fixed origin, strips q/hash, applies preview/absent-article noindex and avoids unsupported geo/foundingDate/social claims. Set initial HTML title/description to current product and remove maximum-scale=1 to permit zoom. Each page title/description comes from approved copy/route inventory. Verify og-default/logo references exist or omit optional metadata. Use known existing image licensing before creating a 1200x630 social crop; generated media is website-only.
- [ ] Host config starts built Express with `npm run start:website -- --port=5179` on a separate unused port, tests direct GET and refresh to all fixed routes, reviewed IDs and recognized unreviewed archive IDs (with noindex), 301 Location, selected retirement status, unknown 404, API content-type/errors, sitemap during news outage and canonical preview links. Inspect emitted Netlify rules separately; validate via local Netlify dev/emulation before claiming Netlify equivalence. No remote deployment in this task. Commit `fix: align website metadata and host routing with public scope`.

## Task 10: Integrated content, accessibility and release-readiness review

**Files:** tests/browser/accessibility.spec.ts, docs/website/verification.md, release-checklist.md, content-audit.md and narrowly scoped fixes in prior task files. Do not add unrelated features or global refactoring.

- [ ] Read the approved spec and this plan again. Record every route's title, purpose, primary action, indexability, source status and links. Search active source plus generated output for old booking/WhatsApp/waitlist/email/founding-date claims; exclude intentionally archived source and explicit absence tests from pass/fail. Human-read every visible paragraph and empty/error message: distinguish activities from help modes, remove repeated ideas and avoid narrowing NightSky to plans. Any substantial copy change returns to the approved brief for review rather than being improvised.
- [ ] Run npm run test:unit, npm run check, npm run check:tests, npm run build, npm run test:browser, npm run test:host. Record exit codes and failures. Validate build:release's expected refusal while facts remain missing, not a fictitious passing release build. Fix new website regressions; document unrelated baseline errors and do not mark the release verified around them.
- [ ] Browser/keyboard review at 375/768/1024/1440, 320 reflow and 200% zoom: exactly one h1/main, skip link, menu focus/escape/route closing, labels, 44px touch targets, body >=16px, contrast, active/visited distinction, selected example indication, no horizontal clipping, email selectable and main CTA reachable. Use measured screenshots/contrast evidence; browser assertions alone do not prove visual quality. No autoplay audio. Under reduced motion, decorative video is not requested and content remains visible.
- [ ] Check network/media failure states and focus after search/Retry/Copy. Review star background size/loading and image dimensions; text/actions appear with media blocked. Record actual performance observations without inventing scores. Check links to external resources against audit, and every internal link against route inventory. No news outage can break any editorial route or sitemap.
- [ ] Use the requesting-code-review skill for a read-only whole-website review against approved spec/plan, constrained to this website checkout. Address Critical/Important findings, record minor/deferred matters. Re-run only affected checks plus final build/type checks after fixes. Do not ask a reviewer to inspect or repair the plugin.
- [ ] Commit verified website fixes and review evidence: `docs: record website verification and launch dependencies`. Present local preview and remaining fact/sign-off blockers to owner. No merge, push, directory submission or deploy is part of this plan.

## Content quality and acceptance map

| Approved requirement | Owning task | Acceptance evidence |
|---|---|---|
| Existing star identity, brand headline, no Our Story | 3 | Home render and media-failure screenshots |
| NightSky helps understand/explore/compare/prepare | 3, 10 | Four distinct examples and human copy review |
| Primary ChatGPT CTA/fallback consistent | 1–3 | Pure URL cases + shared action browser check |
| Searchable Resources, correct name and URL | 4 | Filter/search/history tests and record audit |
| Collective retained without form/CTA | 3 | Page read-through and no form/signup assertion |
| About general and support Gmail correct | 3 | Editorial review and mailto destination |
| News useful, attributed, robust on host | 5, 6, 9 | Proxy/async tests and local host API checks |
| Meteor dates factual, old IDs handled | 7, 9 | Source audit, fixed-clock and route tests |
| Supporting pages truthful | 8, 9 | Readiness tests + owner factual sign-off |
| Expeditions retired publicly | 2, 3, 7, 9 | Link/schema audit and actual retired HTTP status |
| Mobile, keyboard, motion and zoom | 2–4, 6, 10 | Browser evidence and manual review notes |
| Website-only work | Every task | cwd/branch verification, explicit staged paths, changed-file inventory |

## Deferred and publication dependencies

Deferred by design: community form/CTA, expeditions/bookings, member accounts, web planner/map, saved sessions/alerts, new platform promotion, analytics, CMS, testimonials and a rebrand. No task should add them to fill an empty section.

Owner-supplied facts: exact public listing and tested setup; actual sources/coverage; operator/data handling/policy approval; actual website hosting. Execution-time research: retained resources/meteor facts and news-content rights from primary sources. These block unsupported publication, not preview construction. All preview pages visibly identify incomplete policy/source facts; no release build until readiness checks pass.

## Plan review record

Writing-plans self-review checks to run after drafting: spec coverage, step clarity, interface/type consistency, five Review Focus cases, and proportion. Independent read-only plan review and resulting corrections are recorded in 2026-10-16-website-implementation-review.md. Do not label a plan review as a passing app build or visual audit.

## Execution handoff

Review this implementation plan before code work. Recommend native execution in this session because shared configuration, route inventory and content cross most tasks; a single implementer avoids competing shared-file edits. Subagent-driven task execution is also available if explicitly selected. Whichever method is chosen, use the appropriate skill, keep the plugin untouched and require final read-only review before presenting the website as ready.
