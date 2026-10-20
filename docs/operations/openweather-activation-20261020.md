# OpenWeather admission, 20 October 2026

OpenWeather's five-day, three-hour forecast is a distinct optional source. Routine plans use one useful forecast; a user can request every admitted source with `forecastMode: all`. The OpenWeather adapter and private quota policy already exist. The current protected production environment contains a separately named OpenWeather key, but its presence alone does not authorize a request.

## Source and licence evidence

- [Free pricing](https://openweathermap.org/price) lists the five-day, three-hour forecast. The signed-in Free services page was previously checked for this account; verify its current status again before public admission. One Call and historical products are outside this integration.
- [OpenWeather's FAQ](https://openweathermap.org/faq) requires visible “Weather data provided by OpenWeather”, a link to OpenWeather, and its logo for Free–Professional use. Its [official brand page](https://openweather.co.uk/brand_guidelines) supplies the logo and presentation guidance. The first native test showed its hotlinked image as broken. The revised answer-ready result points to `https://nightsky.earth/openweather-logo.png`, an unaltered 2,929-byte white screen logo from OpenWeather's own homepage image response (SHA-256 `e18849f5f2d49f41ec54723ef2471abbbcdcd2d342bf16b4f51d53b7556f7cb8`). Verify the public asset and its rendering in the actual host before admission.
- The [licence explainer](https://openweathermap.org/storage/app/media/documents/License_explainer_25%20Feb_25.pdf) describes Open License attribution and share-alike. The [public normalization method](https://nightsky.earth/openweather-normalization-method.json) describes NightSky's adapted sample component. This is a scoped method offer, not a claim that all NightSky code or other providers are OpenWeather-derived.
- The adapter retains no response cache. It preserves native three-hour instants and documented preceding-three-hour precipitation amounts without creating hourly interpolation or unsupported probability periods.

## Release sequence

1. Review offline configuration composition, attribution projection, source identity and package tests. Keep `NIGHTSKY_OPENWEATHER_ADMIT` absent or unequal to `yes`; a saved key alone must not activate OpenWeather. Preserve the current general quota checkpoint, its initialized marker and usage counters.
2. Publish the reviewed image and promote it to protected staging. Staging remains private and has no external provider credentials; its healthy result validates startup, not OpenWeather endpoint quality or client logo display.
3. Test a synthetic native answer with an OpenWeather sample. Require the visible linked credit **and a rendered official logo beside the forecast**. If the client omits or blocks the logo, leave the provider off and use MET Norway/WeatherAPI.
4. Reconfirm the account's Free endpoint entitlement and remaining account usage without exposing its key. Review the public Sources page, including a visible official logo and the normalization-method link. The page supplements the answer-level credit; it does not replace it.
5. Only after those gates, set the protected production environment variable `NIGHTSKY_OPENWEATHER_ADMIT=yes`, promote through the existing protected production review, then make one separately approved bounded real request and inspect the returned issue/valid times, provider credit and quota increment. The variable must be removed again for rollback; keep existing counters.

### Native acceptance result

The 20 October synthetic Codex conversation returned the OpenWeather linked credit and image Markdown in the NightSky tool text. The user's screenshot of the final answer shows the credit as a clickable link, but the logo is a broken image placeholder beside the 12% sample. The pasted text alone had hidden the link formatting; the screenshot is the decisive visual evidence. The same answer correctly labeled the data synthetic and said no live weather request was made. This fails gate 3. Leave `NIGHTSKY_OPENWEATHER_ADMIT` unset; do not publish OpenWeather values in production until a host-visible logo is verified in a new native run. The hosted NightSky 1.0.38 plugin was restored after the test.

The approved unaltered logo was then published at `https://nightsky.earth/openweather-logo.png`. The Netlify preview and production URL both returned HTTP 200, `image/png`, 2,929 bytes and the SHA-256 recorded above. A second synthetic native conversation using NightSky 1.0.41 still rendered a broken image placeholder, while its credit link and synthetic-data notice displayed correctly. This isolates the remaining problem to client rendering of the answer image rather than delivery of the website asset. Gate 3 remains failed. The temporary 1.0.41 plugin was removed, hosted 1.0.38 restored, and the fixture server stopped. No live OpenWeather request or production activation was made. Investigate a host-supported MCP Apps visual card with the logo inside its declared resource domain, then retest in the actual chat host before any admission.

### Visual-card experiment

The existing opt-in planning card now has a versioned `planning-card-v2.html` resource. Only the synthetic OpenWeather fixture enables it. The card uses the tool's validated forecast samples, shows their native times, places the required linked credit and official logo beside those values, and allows only `https://nightsky.earth` as an image resource domain. The OpenWeather panel waits for the logo to load before showing its values.

The native Codex desktop test of NightSky 1.0.42 displayed the card with the synthetic 12% cloud sample at 23:00 Europe/London, the linked “Weather data provided by OpenWeather” credit and the official logo visibly rendered beside it. The screenshot also shows the synthetic-only notice; the fixture recorded zero external provider attempts. This passes the visual-rendering portion of gate 3 for this host. It does not verify another client or a real OpenWeather response. The production planning-card flag and OpenWeather admission flag stay off pending the remaining release gates.

The separate key is passed only to the protected production composition step. The composition rejects a missing key, duplicate base key, invalid key format and missing general quota path. It preserves all base configuration lines. No provider requests, historical downloads or map scraping are required to prepare this change.

## V1 geography scope

Production candidate discovery uses the Geoapify API. It does not install or download an OSM candidate index. The offline OSM importer job is removed from the V1 release workflow because that data path is outside this launch scope; its source code and fixtures remain in the repository pending a separate cleanup. Geoapify responses still carry OpenStreetMap contributor attribution, which must remain visible where applicable.
