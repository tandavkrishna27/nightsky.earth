# Website local preview verification

Date: 16 October 2026. Branch: codex/website-plugin-design. Plugin workspace was not read or modified during implementation or independent review.

## Results

| Check | Observed result |
|---|---|
| Original baseline npm ci/check/build | Passed before product edits |
| npm run check | Passed |
| npm run check:tests | Passed |
| npm run test:unit | 16 passed, including an actual bounded 8-second timeout, date/timezone cases, invalid listing URLs, resource URL state, source validation and environment-file listing gates |
| npm run test:browser | 12 passed: core story, examples/copy denial, mobile menu/focus, filters/history and same-page navigation, News retries/races/404, metadata ownership, clean UTF-8 archive copy, reflow |
| npm run build | Passed as noindex local preview; JS about 250.4 kB before gzip |
| npm run test:host | 1 passed, checking all fixed routes, redirect, retirement 410, unknown 404, canonical and sitemap |
| npm run build:release | Expected refusal with missing operator/hosting/data/source/rights/policy approvals; no publication attempt |
| Live News local smoke | HTTP 200 with real provider count/headline; summaries/images are not reproduced |
| Desktop/mobile visual inspection | Actual screenshots reviewed; current star hero and readable phone layout preserved |

## Final independent review and corrections

One fresh read-only reviewer inspected website source and the live local preview. No Critical findings. Three Important findings: same-page URL/filter drift; Vite env-file listing values differing from release-validation input; malformed source records passing validation. All were reproduced or covered by failing checks, corrected, and the affected/full suites passed.

Additional functional corrections: query word `all` survives serialization, duplicate initial route metadata is reconciled by Helmet, and malformed UTF-8 punctuation on archive pages was repaired. These were treated as user-facing correctness defects rather than deferred styling nits. The build explicitly resolves production mode before Vite configuration so development React does not leak into the production-shaped preview bundle.

No second reviewer pass was requested; the regression tests and green suite verify the corrections. Do not describe this as formal legal approval, published-host verification or a plugin review.

## Visual evidence

- home-desktop.png: full desktop Home.
- home-mobile.png: full phone Home.
- preview-hero.png and preview-mobile.png: first viewport.
- resources-desktop.png: searchable catalogue.

Inspected desktop 1440px and phone 375px screenshots; tests cover 320px and 640px effective viewports. The reviewer also checked 320px reflow across fixed routes. A 640px viewport models the reflow of a 1280px desktop at 200%; native browser zoom itself was not verified and is not claimed. No full automated accessibility audit or measured performance score is claimed.

## Local use

Preview: http://127.0.0.1:5180
Development process is kept running from this website worktree. Restart with npm run dev:website -- --port=5180 if needed. The built preview is available via npm run start:website -- --port=5180 after stopping the development process on that port.

## Remaining public-release dependencies

Actual listing/setup, released source inventory, operator/data practices, final policies and media/news rights require factual confirmation. Netlify configuration and local Express verification are not proof of a Netlify deployment; validate on the confirmed host before publication. Existing video is about 21.4 MB and should be optimized for public delivery. Existing non-fatal Browserslist/PostCSS warnings remain.

All work remains on the local website branch. No push, merge, deployment or plugin operation was performed.
