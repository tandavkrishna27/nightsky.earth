# Calendar and Route Performance Follow-up

## Measured problem

The merged website performance pass reduced homepage transfer from 11,553 KiB to 3,216 KiB and improved the homepage LCP from 3.9 s to 3.5 s. A fresh PageSpeed Insights run on 18 October 2026 scored desktop home 94, mobile home 77, Get Started 75, Resources 85, and Sky Events 60. The Sky Events report attributed 1,325 ms of script evaluation and 680 ms of total blocking time to the site’s single 740 KiB JavaScript bundle. The site has no CrUX field data, so these are lab measurements and vary between runs.

## Root cause

The event catalogue contains 135 reviewed and draft records. Projecting upcoming events and a calendar month repeatedly constructed timezone validators and `Intl.DateTimeFormat` instances for every timed event. A focused local count recorded 906 formatter constructions across the two projections. The production build also bundled every page into one 740 KiB entry file, delaying unrelated routes and causing the bundler’s large-chunk warning.

## Reviewed implementation plan

1. Cache timezone validation results and date/instant formatters in bounded per-page maps. Keep the existing formatted output and timezone fallback behavior; cap each map at 32 entries so URL-provided time zones cannot grow memory without limit.
2. Lazy-load route pages behind an accessible loading status. Keep shared site chrome eager, and verify direct route loads plus a second route navigation in a production browser test.
3. Preserve fragment navigation when its target is inside a route that has not finished loading. Verify the existing footer anchor test, which exercises this timing edge case.
4. Run type checks, unit and browser tests, event catalogue validation, and the release build. Then merge and verify Netlify production plus fresh PageSpeed reports.

Plan review: this targets measured formatter work and the oversized entry bundle, protects event timing and navigation, bounds cache memory, and keeps the change in website code. No plugin or MCP files are in scope.

## Verification results

The formatter regression test failed before the cache change (8 constructions for two event projections) and passes with the cache (at most 3). Warm local projection time for the 135-event catalogue fell from about 45 ms to 2.7–3.1 ms. The production build split the 740 KiB entry into a 216 KiB startup bundle plus on-demand route and event chunks; route modules rendered correctly on direct URLs and when navigating between pages.

The browser suite had four stale expectations, which were corrected to match the rendered experience: NASA links directly to its source PDF, JSON-LD is read from script `textContent`, the October Draconids entry has exact timing, and dates use an unpadded day number. Final checks: 44/44 unit tests pass, 105/105 browser tests pass, 2/2 production-shaped route checks pass, 135 event records validate, TypeScript and test type checks pass, the release build succeeds, and `git diff --check` is clean. Post-merge PageSpeed results will be recorded after deployment.
