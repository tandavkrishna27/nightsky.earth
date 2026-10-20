# OpenWeather admission, 20 October 2026

OpenWeather's five-day, three-hour forecast is a distinct optional source. Routine plans use one useful forecast; a user can request every admitted source with `forecastMode: all`. The OpenWeather adapter and private quota policy already exist. The current protected production environment contains a separately named OpenWeather key, but its presence alone does not authorize a request.

## Source and licence evidence

- [Free pricing](https://openweathermap.org/price) lists the five-day, three-hour forecast. The signed-in Free services page was previously checked for this account; verify its current status again before public admission. One Call and historical products are outside this integration.
- [OpenWeather's FAQ](https://openweathermap.org/faq) requires visible “Weather data provided by OpenWeather”, a link to OpenWeather, and its logo for Free–Professional use. Its [official brand page](https://openweather.co.uk/brand_guidelines) supplies the logo and presentation guidance. The answer-ready result uses that page's current hosted screen logo. The logo URL is an external dependency and must be checked in the actual host at acceptance.
- The [licence explainer](https://openweathermap.org/storage/app/media/documents/License_explainer_25%20Feb_25.pdf) describes Open License attribution and share-alike. The [public normalization method](https://nightsky.earth/openweather-normalization-method.json) describes NightSky's adapted sample component. This is a scoped method offer, not a claim that all NightSky code or other providers are OpenWeather-derived.
- The adapter retains no response cache. It preserves native three-hour instants and documented preceding-three-hour precipitation amounts without creating hourly interpolation or unsupported probability periods.

## Release sequence

1. Review offline configuration composition, attribution projection, source identity and package tests. Keep `NIGHTSKY_OPENWEATHER_ADMIT` absent or unequal to `yes`; a saved key alone must not activate OpenWeather. Preserve the current general quota checkpoint, its initialized marker and usage counters.
2. Publish the reviewed image and promote it to protected staging. Staging remains private and has no external provider credentials; its healthy result validates startup, not OpenWeather endpoint quality or client logo display.
3. Test a synthetic native answer with an OpenWeather sample. Require the visible linked credit **and a rendered official logo beside the forecast**. If the client omits or blocks the logo, leave the provider off and use MET Norway/WeatherAPI.
4. Reconfirm the account's Free endpoint entitlement and remaining account usage without exposing its key. Review the public Sources page, including a visible official logo and the normalization-method link. The page supplements the answer-level credit; it does not replace it.
5. Only after those gates, set the protected production environment variable `NIGHTSKY_OPENWEATHER_ADMIT=yes`, promote through the existing protected production review, then make one separately approved bounded real request and inspect the returned issue/valid times, provider credit and quota increment. The variable must be removed again for rollback; keep existing counters.

The separate key is passed only to the protected production composition step. The composition rejects a missing key, duplicate base key, invalid key format and missing general quota path. It preserves all base configuration lines. No provider requests, historical downloads or map scraping are required to prepare this change.
