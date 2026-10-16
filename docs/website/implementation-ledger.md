# Implementation ledger — docs/superpowers/plans/2026-10-16-website-implementation.md

Website worktree only. Base 5f5b660. Native execution approved by owner.

Baseline: npm ci completed; npm run check and npm run build passed. Existing non-fatal warnings: old Browserslist data, PostCSS source warning, large bundle.

Preflight: tasks share ListingConfig, SiteRoute and copy; use one shared config and PageShell. Resources is local-only. News adapters share normalization. Meteor legacy IDs and reviewed records remain distinct. Build mode is resolved once.

Ruling: Windows shell cannot execute the skill's Bash bookkeeping scripts directly; keep the equivalent task ledger here and use explicit scoped git paths. No loss of progress history; no plugin access.

Task 1: complete (commit fed5493; baseline check/build passed; pure contracts red for missing modules then green; final browser baseline passed).


Task 2: complete for local preview — one semantic shell, no audio/entrance/bottom navigation; browser tests pass.
Task 3: complete — approved Home/editorial story, preserved sky media and examples; content/browser checks pass.
Task 4: complete — nine checked resources, local search/filters/URL state; unit and browser checks pass.
Task 5: complete for local execution — shared bounded News delivery and host adapter; unit failures/timeouts and live HTTP200 smoke pass. Netlify deployment remains unverified.
Task 6: complete — attributed headline/original-link News, no copied images/text, async/cache isolation and recovery checks pass.
Task 7: complete using approved evergreen fallback — no unverified annual forecasts; known old IDs show noindex archive notices; UTC/timezone tests pass.
Task 8: complete for local preview — sources/policy drafts, no fabricated facts, strict release blockers tested.
Task 9: complete for local preview — independent generated sitemap, actual Express route statuses, client/public assets, preview headers and release guard verified.
Task 10: complete — fresh independent reviewer, one correction pass, 16 unit + 12 browser + 1 host tests, type checks and build pass; screenshots inspected; preview left running.

Ruling: core page and hosting changes share route/config contracts, so tasks 2–9 are saved as a coordinated integration commit instead of eight broken intermediate application states. Cost if wrong: less granular per-task rollback; scoped files/tests remain recorded.
Ruling: Sources/Privacy/Terms use one typed supporting-page component rather than three duplicate page wrappers. Cost if wrong: future bespoke layouts may need separation; current content and routes remain distinct.
Ruling: article body/images are not reproduced until rights are established; the current preview offers publisher/date/headline/original links. Cost if wrong: less rich previews until permission is confirmed.
Ruling: dated meteor records remain unverified, so use the spec's evergreen fallback and noindex archives. Cost if wrong: no upcoming cards until actual dates are reviewed; no fabricated predictions.
Ruling: native browser zoom and deployed Netlify equivalence remain unverified rather than inferred from local Express/reflow tests. Cost if wrong: production-host or browser-zoom differences require follow-up before launch.

Final reviewer: 3 Important findings; fixed URL state, env/gate consistency and source validation with regression evidence. Regraded query-all serialization, duplicate metadata and visible mojibake as functional correctness defects; corrected them in the same pass. No deferred cosmetic reviewer items remain.
Final: fixed same-page URL reset — two browser tests RED→GREEN.
Final: fixed malformed source approvals — direct failing assertion plus fixture tests RED→GREEN.
Final: fixed env-file listing setup gate — fixture loader test RED→GREEN.
Final: fixed search all, duplicate metadata and mojibake — unit/browser regressions RED→GREEN.
Final declined-to-judge rulings: actual legal/provider/media approval remains an owner-fact dependency, Netlify deployment/native zoom unverified as above, and no future astronomical facts are published. These do not block the requested local preview; they block unsupported launch claims.
Final suite: 16/16 unit, 12/12 browser, 1/1 host, app/test type checks and preview build passed. Release build correctly refuses incomplete facts. Keep local branch/worktree and live preview as requested; no merge/push/publish.
