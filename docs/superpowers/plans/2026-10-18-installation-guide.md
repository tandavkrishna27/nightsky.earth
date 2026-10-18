# NightSky setup guide implementation plan

> For agentic workers: use superpowers:executing-plans inline, followed by a focused independent review.

**Goal:** Extend Get Started with actionable assistant-specific setup guidance, visible manual routes and six setup FAQs.
**Architecture:** Data-driven guides keyed by existing AssistantId, a URL-bound guide selector, validated optional public installation resources, and a reusable stable-height native FAQ list.
**Tech stack:** React, TypeScript, Wouter, existing CSS/Lucide, Playwright and node:test. No new dependencies.
**Spec:** User-approved seven-part in-chat plan immediately preceding “lets carfully plan and review the plan and do it”. Existing hero/cards/overview/questions remain, followed by setup guide, FAQ, help and footer.

## Global constraints
- Website worktree only; preserve all prior changes. No plugin edits, backend launches, package generation, provider requests, account/permission changes, commits, publication or deployment.
- No separate NightSky sign-in/up. AI assistant account/plan restrictions are separate.
- Real listing URLs, public MCP URL, tested downloads and actual installation screenshots are not supplied. Never substitute example/loopback URLs or fabricated screenshots. Build the complete guide and safe inactive resource actions; describe dependencies accurately.
- Manual setup is visible. A hosted connection, host-specific package and a separately running local backend are different routes. Codex local packages are labelled Codex, not ChatGPT browser packages.
- Analytics implementation is excluded. FAQ describes tool inputs and assistant policies without promising no logging or access to whole transcripts.
- Match existing dark/gold rounded design, accessible controls >=44px, reflow at 320px and 200% text. No decorative eyebrows or autoplay illustrations.

## Review focus
- Unknown assistant query defaults safely; selection preserves unrelated query parameters and Back/Forward.
- A card setup link selects its assistant, reaches the guide, and gives keyboard focus a useful destination.
- Missing/malformed resources cannot become outbound links, downloads or copied placeholders; valid configured resources use a verified owned HTTPS host.
- Mobile setup is distinct from local computer access; instruction headings name actual host/surface.
- FAQs stay exclusive and reserve the longest answer's space as font/width changes; existing homepage FAQ behavior remains intact.

## Tasks
- [x] 1. Add failing tests: guide links/selection/manual routes/FAQ keyboard and reserve, narrow enlarged text, valid/invalid resource configuration. Run focused browser and unit checks to observe expected failures.
- [x] 2. Add content/setupGuide.ts (four guides, verified source links/date, six FAQ answers), lib/setupResources.ts (resolveSetupResource(kind,value): string|null), components/setup/InstallationGuide.tsx and styles/setup-guide.css. Use query assistant=chatgpt|claude|gemini|grok and mode=directory|manual; Gemini/Grok default manual and don't expose an invented directory option. Native button groups with aria-pressed; all controls remain visible and wrap. Copy address only when configured; copy first prompt with race/error feedback.
- [x] 3. Add optional MCP and Claude/Codex package URL configuration in .env.example. Exact /mcp HTTPS endpoint on nightsky.earth or subdomains only; ZIP package URLs on those hosts only; no credentials, query/hash or nondefault port. Download actions include host/backend notes and remain disabled when unset. All real configuration stays unset.
- [x] 4. Extract existing HomeFaqs native list/reservation logic into components/StableFaqList.tsx with items and idPrefix props; preserve HomeFaqs wrapper and styles. Add setup FAQ wrapper with distinct IDs and scoped styling. Integrate after questions, add account note and per-card Setup guide links. Update previous no-FAQ expectations intentionally.
- [x] 5. Run focused checks, application/test types, full unit suite, preview build and full browser suite. Visually inspect actual desktop/mobile guide, manual route and FAQ; reset viewport; save screenshot evidence. No actual installation or live tool calls.
- [x] 6. Obtain focused independent implementation review and fix material findings. Record results and missing real resource/host acceptance separately from website verification.

## Plan review rulings
- User authorization includes planning/review and implementation; continue without another approval gate.
- Do not render fake screenshots while real host captures are unavailable. Use numbered instructions plus a genuine first-response checklist and official reference links. This completes the website without inventing evidence of installation.
- Local backend setup is advanced explanatory guidance only: no guessed shell commands, dependencies or package auto-start promises. Actual downloadable artifacts and their backend instructions require later host-specific acceptance, outside website-only scope.
- Topic-level FAQ is intentionally added now that setup has multiple routes; general homepage FAQ remains unchanged.

## Verification ledger
Completed website implementation and verification on 18 October 2026.

- New browser tests initially failed on absent account clarification, guide and FAQ; resource unit initially failed on the missing resolver. Implemented afterward.
- Plan review: no blockers; incorporated explicit inactive-resource explanations, correct host labels, normalized modes, first-tool-result check and distinct FAQ groups.
- Focused guide, FAQ/history/copy/reflow checks passed. Extracted homepage FAQ behavior passed all existing stable-height, enlarged-text and rapid-selection checks.
- One earlier multi-width run captured a blank page; it did not recur in either subsequent full suite. No retry was used to change the failed run's result.
- Independent implementation review: no blockers; fixed modified link clicks. Both new modified-click and direct-link-focus tests were observed failing before fixes, then passed. Corrected the combined global scroll padding/local margin identified by the direct-link test.
- `npm run check` and `npm run check:tests`: passed after final code changes.
- `npm run test:unit`: 38 passed. Resource URL validation covers missing, local/example/deceptive hosts, unsafe protocols, credentials, query/fragment, ports and incorrect paths.
- `npm run build`: passed, retaining preview noindex/publication gates. Existing Browserslist/PostCSS/chunk-size warnings remain.
- Final full browser run: 99 passed (`npx playwright test --config=.cache/get-started/browser.config.ts --reporter=line`), including the two additional reviewed link regressions.
- Configured-resource fixture: 1 passed (`.cache/installation-guide/resources.config.ts`). Confirmed correct address copying and package link rendering; zero remote NightSky requests and no downloads. Synthetic values were isolated to that test server; real website settings remain unset.
- Actual in-app browser review: desktop guide/manual route, mobile assistant switching and device requirements, mobile FAQ expansion, direct-link focus. Temporary viewport override reset; final screenshot `.cache/installation-guide/desktop-guide.png`; local preview port 5178 remains running.
- `git diff --check`: passed. No new dependency, plugin/backend change, analytics, login/signup, provider request, actual installation, commit, publication or deployment.

Actual public URLs, verified download artifacts/backend instructions, real installation screenshots and install-to-tool-result host acceptance remain separate outstanding release inputs. They are not claimed by website verification. Evidence and references: `docs/research/2026-10-18-installation-guide.md`.
