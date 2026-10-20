# OpenWeather public method and source accuracy

## Objective
Make the reviewed OpenWeather normalization-method JSON available as a static public asset in Netlify preview builds, and ensure website source, privacy, and support statements distinguish active production integrations from researched/inactive providers.

## Constraints
- Website files only; do not edit MCP runtime/provider code, credentials, or deployment settings.
- Build against the current website launch baseline and target PR base `main`.
- Do not merge or promote/deploy production. Verify only the PR preview once Netlify creates it.
- Do not claim OpenWeather or WeatherAPI is live. The website currently renders no forecast data from either provider.
- Do not claim a 90-day support-email deletion process as active until daily handling and the first sweep are verified.

## Steps
1. Verify the baseline/build config and source/rights record; inspect the reviewed normalization JSON and its existing staging implementation without modifying the plugin worktree.
2. Add a regression test that builds the static public artifact and checks the JSON exists, parses as JSON, matches the reviewed source bytes, and contains the expected schema and endpoint.
3. Run the regression test and confirm it fails because the asset is absent from `dist/public`.
4. Add the JSON source asset and a deterministic website build staging step that copies it byte-for-byte to `dist/public`; test content type and prevent SPA fallback for its explicit static route as needed.
5. Update the sources/coverage and source-rights documentation to state the active provider profile and mark OpenWeather/WeatherAPI inactive. Link the public method and explain OpenWeather’s ODbL/modification context without implying that this sources page satisfies adjacent credit in any future AI response.
6. Update privacy/support statements to remove the unverified 90-day deletion guarantee. Keep hosting/logging facts and 13+ audience language accurate; use the current effective date where policy date is displayed.
7. Review Get Started and Contact for provider or support claims; change only if a concrete inconsistency is found.
8. Run type checks, unit tests, production-style preview build, relevant browser tests, and rendered desktop/mobile checks. Inspect generated JSON bytes, JSON schema/endpoint, headers and routes.
9. Review the full website-only diff; create a PR against current `main`, then verify the exact-commit CI and Netlify preview. Do not merge.

## Acceptance criteria
- `dist/public/openweather-normalization-method.json` is identical to `public/openweather-normalization-method.json` and is valid JSON with reviewed schema/endpoint fields.
- A GET against the PR preview URL returns 200 with JSON content type and not SPA HTML.
- OpenWeather and WeatherAPI remain clearly inactive in public source descriptions; no unearned weather credit/logo/disclaimer is added to the website.
- No active 90-day email retention guarantee remains.
- Tests and browser/rendered checks pass; no plugin files are changed.
- PR targets current `main`; production is neither merged nor deployed.
