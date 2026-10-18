# AEO and GEO Implementation Plan

> **For agentic workers:** This plan was executed natively in this task; the steps record scope and verification.

**Goal:** Make NightSky.earth easier for search engines and answer engines to discover, interpret, and cite without publishing an unapproved release.

**Architecture:** Keep the existing gated website build as the source of robots.txt, sitemap.xml, redirects, and robots headers. Make release crawling policy explicit for search, user-requested retrieval, and training crawlers, with private/API exclusions repeated in every explicit crawler group. Improve stable homepage identity metadata and WebSite structured data, then use the release build and tests as gates. No plugin checkout or deployment is in scope.

**Tech Stack:** TypeScript, Vite, React Helmet, Node test runner, Netlify build configuration.

**Spec:** The AEO/GEO research and agreed policy in the conversation: allow all crawlers on public pages, including search, user-requested retrieval, and model-training crawlers; explicitly include Google-Extended for Gemini grounding, understanding that Google's combined control also permits training; keep release factual approval checks in force.

## Global Constraints

- Do not inspect or edit plugin code or its worktree.
- Preview builds remain `noindex` and block crawling.
- Release builds must continue to fail on missing factual approvals.
- Crawler policy must exclude `/api/`, `/admin/`, and JSON endpoints in each explicit user-agent group.
- No deployment, publication, or claims of search ranking outcomes.

## Review Focus

- A named crawler group does not inherit wildcard directives; repeat sensitive-path exclusions in each named group and assert them.
- Public crawler access must be explicit for search, retrieval, and model-training agents, including GPTBot, ClaudeBot, CCBot, and Google-Extended; test this alongside wildcard access.
- Preview remains blocked while release remains crawlable; test both build modes.
- Sitemap must continue to omit retired, draft, or withdrawn routes; retain existing route/event assertions.
- Incomplete release facts must continue to block the release build; retain and rerun the release blocker test.

---

### Task 1: Crawler directives and build selection

**Files:**
- Modify: `shared/websiteBuild.ts`
- Modify: `tests/unit/site-build.test.ts`
- Modify: `netlify.toml`
- Modify: `DEPLOYMENT.md`

**Interfaces:** Keep `buildWebsiteOutputs`' existing output contract and ensure Netlify invokes the existing gated `build:release` command.

- [x] Add assertions for search/retrieval crawlers, all crawlers on public pages, private-path exclusions, and unchanged preview blocking.
- [x] Generate explicit release groups for `Googlebot`, `Bingbot`, `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `GPTBot`, `ClaudeBot`, `CCBot`, and `Google-Extended`; keep general wildcard access and exclusions.
- [x] Point Netlify's configured build at `npm run build:release`; document that deployment remains gated on factual approvals and host confirmation.
- [x] Run the focused site-build test.

### Task 2: Homepage identity metadata

**Files:**
- Modify: `client/index.html`
- Modify: `client/src/pages/Home.tsx`
- Modify: `tests/browser/site.spec.ts` (only if an existing SEO assertion can cover the new behavior)

**Interfaces:** Use the existing `SEO` component's JSON-LD `schema` prop. Keep page-level metadata in React Helmet.

- [x] Replace generic ChatGPT-only shell metadata with accurate NightSky.earth description and platform-neutral Open Graph description.
- [x] Add homepage `WebSite` JSON-LD with verified name, URL, and a short description.
- [x] Verify rendered homepage metadata and existing route canonical/robots behavior; do not imply special AEO markup or guaranteed ranking.

### Task 3: Plan review and release verification

**Files:**
- Create: `docs/superpowers/plans/2026-10-18-aeo-geo-implementation.md`

- [x] Review crawler semantics, release gate integrity, metadata accuracy, and scope against the agreed policy.
- [x] Run `npm run check`, `npm run check:tests`, and `npm run test:unit`.
- [x] Run preview build and verify generated preview robots/sitemap remain blocked/empty.
- [x] Attempt release build and verify it stops on the known missing factual approvals without changing approvals or publishing.
- [x] Inspect the intended hunks while preserving the broader website changes that were already in the worktree.

## Review Outcome

The crawler rules follow the chosen policy: all crawlers may access public pages, while API, admin, and JSON endpoints stay excluded. Preview remains `noindex`; the Netlify publication configuration now selects the release build, which continues to fail closed on the missing operator, hosting, retention, analytics, source, rights, and policy approvals. The existing site routes remain canonicalized and page metadata stays route-specific after the app loads. The homepage now carries a platform-neutral shell description and a `WebSite` identity schema.

Type checks, unit tests, and the preview build passed. The release build stopped at the expected factual approval gate. I checked rendered homepage and Resources metadata in the local browser. The automated Playwright metadata test could not start because this environment has no installed Playwright Chromium; its separate-port retry also did not start a listener, and the already-running local site was left undisturbed. No deployment or publication occurred.
