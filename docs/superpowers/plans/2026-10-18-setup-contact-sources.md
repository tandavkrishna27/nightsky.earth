# Get Started, Contact and Sources implementation

User approved the in-chat plan after read-only investigation of the website, plugin-v1 source and installed NightSky 1.0.20 package. Implement in the existing website worktree; no plugin edits, provider requests, publication, commits or deployment.

## Agreed design

- Get Started: one equal four-assistant grid, ChatGPT first; consistent acquisition actions and safe per-platform destination configuration. Remove the ChatGPT feature/demo, separate other-assistants section and repeated FAQ. Keep three compact steps, three copyable questions, Free to use once with assistant-plan qualification, and contextual help links.
- Contact: Contact NightSky heading; four native radio reasons (Help & setup, Bugs & corrections, The Collective, Something else), contextual helper and one Email NightSky action using the existing support address and encoded subject. Show selectable address and copy fallback; no submission form or automatic sending. Preserve chosen reason through URL/history and support contextual entry links.
- Sources & Coverage: dedicated page with five rounded capability cards, linked source details and truthful coverage statements. Explain calculations, forecasts, timestamps, gaps, historical context and access limits. Preserve the difference between baseline, optional/configured sources and incomplete global coverage. Do not convert private source validation into public-readiness claims.
- All pages: existing gold/dark typography, rounded surfaces, no decorative eyebrow labels, responsive layout, keyboard focus and enlarged-text reflow.

## Files and sequence

- [x] Add failing browser behavior checks and per-assistant URL validation checks.
- [x] Add pure per-assistant URL resolver and shared acquisition configuration; rebuild Get Started while preserving clipboard race/error behavior.
- [x] Add Contact reasons/content and URL-bound reason selection; email subject/copy behavior without sending.
- [x] Add website source inventory/content and evidence record from the read-only plugin audit; isolate Sources from privacy/terms rendering.
- [x] Update existing expectations, run targeted checks, full browser/unit suites, types and build.
- [x] Inspect actual desktop/mobile output and obtain focused independent review; resolve material findings.

## Boundaries and rulings

- User-confirmed launch availability supports presenting all four assistants equally. Real listing URLs remain unset until supplied. No generic assistant homepage, invented install destination or assumed identical platform UI.
- Missing listing destinations use the same disabled acquisition action for every assistant; one contextual setup-help link remains available below the choices. No Grok-only action line.
- Contact defaults to Something else for direct visits and unknown topic parameters, so a general email action is always usable. Subjects contain the selected topic only, never user data from the URL.
- Source inventory describes verified implementation and source semantics; optional provider names are labelled as conditional. No release approvals or runtime provider settings are changed.
- Privacy and Terms content remain outside this task.

## Verification record

Completed locally on 18 October 2026.

- Red checks first: the old page failed the new four-assistant, Contact heading and source-card requirements. After implementation the focused 35-test browser run passed.
- Application and browser-test type checks passed (`npm run check`, `npm run check:tests`).
- Unit suite: 37 passed (`npm run test:unit`).
- Preview build passed (`npm run build`), retaining noindex and existing publication gates. Existing Browserslist/PostCSS/chunk-size warnings remain.
- Full browser regression: 94 passed using isolated local port 5181 (`.cache/get-started/browser.config.ts`).
- Configured listing action: 7 passed on isolated port 5182 with a synthetic ChatGPT fixture URL. No real marketplace destination was configured or opened.
- New checks cover reason-specific encoded mailto, invalid-topic fallback, query/history preservation, keyboard radio selection, copy success/failure, source details, four assistant choices, and reflow at 320/390/768/1440 with 200% text. No email was sent.
- Actual in-app browser review: desktop Contact/Get Started/Sources, mobile 390px on all three, mobile Contact email/address wrap, and expanded source details. The assistant action font was increased after visual inspection. Temporary viewport override reset. Preview running at http://localhost:5178/.
- Focused independent review reported no blocking or actionable findings; it inspected source claims against plugin audit records and ran the resolver unit checks.
- Evidence inventory: `docs/research/2026-10-18-source-coverage-audit.md`. Final screenshot: `.cache/setup-contact-sources/get-started-desktop.png`.
- No plugin modifications, provider calls, real listing configuration, publishing, commits or deployment.
