# SEO and GEO Route Rendering Implementation Plan

> **For agentic workers:** Use the native inline implementation workflow. Steps use checkbox syntax for tracking.

**Goal:** Make every public NightSky route identifiable from its first HTML response, provide a usable text summary when JavaScript is unavailable, and improve page sharing previews.

**Architecture:** Keep the React app and Netlify static hosting. Extend the existing route inventory into a build-time HTML metadata renderer that emits route-specific documents for indexable pages and reviewed sky events. Keep preview noindex rules, the production release gate, canonical URLs, analytics consent, and plugin/MCP code unchanged.

**Tech Stack:** TypeScript, Vite, React Helmet, Node test runner, Netlify static output.

**Spec:** User-approved direction in the conversation: first improve route-level SEO metadata and social previews, then measure discovery; any content guides are a separate editorial phase.

## Global Constraints

- Do not edit or deploy plugin/MCP code.
- Preview builds remain noindex and disallowed in robots.txt.
- Production release approval gates remain unchanged.
- Canonical URLs use https://nightsky.earth and omit query strings/fragments.
- Include only approved public pages and reviewed sky events in the indexable output and sitemap.
- Use the existing owner-approved splash poster for social previews; do not introduce unreviewed claims or third-party image rights.

## Review Focus

- Direct requests to nested routes must return that route’s metadata and retain root-relative hashed assets.
- Query strings, fragments, preview hosts, and HTML-unsafe characters must not leak into canonical tags or break output.
- Every preview route stays noindex even when a route-specific file is emitted.
- Draft/withdrawn sky events and legacy archive routes must not become indexable or enter the sitemap.
- HTML generation must not make the release depend on remote providers or external news availability.

---

### Task 1: Canonical route metadata model

**Files:** `shared/website.ts`, new `shared/seoHtml.ts`, `tests/unit/website.test.ts`, new `tests/unit/seo-html.test.ts`.

- [x] Write failing tests for route metadata serialization, canonical URLs, summary escaping, social tags, and robots state.
- [x] Align fixed-route title and description data with each page’s existing visible heading and introduction.
- [x] Implement a pure HTML-head/summary renderer using the production origin and existing splash poster.
- [x] Verify focused unit tests and the full unit suite.

### Task 2: Emit route-specific HTML at build time

**Files:** `shared/websiteBuild.ts`, `scripts/build-website.ts`, `tests/unit/site-build.test.ts`, `tests/browser/host-routing.spec.ts`.

- [x] Test fixed route and reviewed-event HTML output, including preview/release robots behavior and draft/withdrawn exclusion.
- [x] Write generated pages under their canonical static paths after Vite copies the base HTML.
- [x] Keep the existing sitemap, crawler rules, redirects, and release approval gate intact.
- [ ] Verify each generated nested document loads the built app assets and route metadata through the production-shaped host. The production-shaped local server builds successfully; this environment could not reach its local test port, so the browser check remains for the Netlify preview.

### Task 3: Route-aware client metadata and deployment checks

**Files:** `client/src/components/SEO.tsx`, selected page metadata only where required, `docs/website/verification.md`.

- [x] Add Open Graph image and Twitter card fields to client-rendered metadata to match the build output.
- [ ] Confirm SPA navigation replaces initial metadata without duplicates in a browser session.
- [x] Run TypeScript, unit, sky-event validation, preview build, and release build checks. The host-browser test cannot reach its local server from this environment.
- [ ] Inspect the Netlify preview on home, resources, sources, and a direct sky-event URL; confirm preview blocking and live production unchanged until release review.

Content expansion, Google Search Console analysis, and Bing Webmaster Tools setup are follow-up work after this technical PR; they do not block this deliverable.
