# Weather provider admission

Decision date: 2026-10-17. This records offline implementation contracts from the reviewed multi-weather plan and local setup evidence. It does not grant production activation. No live weather endpoint was called during this task. Public documentation and account evidence are separate: missing rights, cache or account proof blocks activation.

## Endpoint and account decisions

| Provider | Fixed endpoint and request | Account / free permission | Activation |
| --- | --- | --- | --- |
| MET Norway (`met`) | Existing `https://api.met.no/weatherapi/locationforecast/2.0/compact`; selected latitude/longitude; preserve existing adapter parameters | Existing integration; preserve its contact, terms, cache and parsing behavior | Existing route retained; this task makes no new account or live acceptance claim |
| WeatherAPI (`weatherapi`) | Candidate `https://api.weatherapi.com/v1/forecast.json`; selected `q=lat,lon`, `days=3`, `aqi=no`, `alerts=no`, server-held key | Account/key exist; Business trial ends 2026-10-24 and dashboard says automatic Free transition. Reviewed plan records Free marketing limits of 100,000 calls/month and three days. Trial features are inadmissible | Blocked until exact Free schema, permitted use, attribution, caching and timezone semantics are evidenced and private setup / quota / bounded validation gates pass |
| OpenWeather (`openweather`) | Candidate `https://api.openweathermap.org/data/2.5/forecast`; selected `lat`, `lon`, `units=metric`, `cnt=40`, server-held `appid` | Account exists; email-confirmation notice visible. Public five-day forecast shape does not prove this account's Free endpoint entitlement | Blocked pending account entitlement, rights/cache review and private setup / quota / bounded validation. One Call and historical endpoints excluded |

Only exact HTTPS GET endpoints are candidates. Reject redirects, alternate hosts/ports, arbitrary query parameters and user-controlled base URLs. Never substitute a paid endpoint. Geoapify and GeoNames remain location services, outside the weather registry.

## Scientific and source contract

| Provider | Resolution / horizon | Supported normalization candidates | Time and absent values |
| --- | --- | --- | --- |
| MET Norway | Preserve native samples and existing horizon behavior; no promise of local accuracy | Existing adapter's documented instantaneous and period values | Preserve UTC sample times and accumulation intervals; source issue time only when supplied |
| WeatherAPI | Hourly forecast hours; at most three forecast days requested, at most 48 returned samples | Total cloud, temperature/dew point, humidity, wind/gust/direction, visibility; precipitation amount/probability only with documented interval/meaning | Validate documented epoch interpretation; local text is not an independent UTC instant. Current observations are excluded. Cloud layers and undocumented period semantics remain missing |
| OpenWeather | Five-day series at three-hour cadence, at most 40 upstream entries and 48 public samples | Total cloud, temperature, humidity, wind/gust/direction, visibility and documented three-hour precipitation; optional fields stay optional | Preserve UTC `dt` instants and three-hour accumulation bounds. No hourly interpolation. Returned city center cannot move selection; fixed offset cannot replace IANA timezone |

Coordinates identify the selected point, including its revision; forecasts do not establish complete global coverage or local accuracy. Preserve disagreement as separate source-labelled series. Zero cloud is valid; absent cloud is unknown. Do not average providers or invent missing layers, issue times or rain intervals. Fetch time must never become model issue time. Missing horizon/night samples require explicit partial, out-of-horizon or unavailable outcomes.

## Attribution, caching and limitations

MET's existing source record, attribution, terms link, contact header and cache behavior remain authoritative. Preserve its response metadata and deprecation behavior.

WeatherAPI terms require attribution and constrain caching according to the reviewed plan. Exact wording, permitted retention and Free use rights have not been established in this task; no new cache retention permission is inferred. The proposed 15-minute bounded cache is conditional on documented permission, and activation stays blocked until that review is recorded. Show provider attribution and forecast limitations without implying guaranteed observing conditions.

OpenWeather attribution/license obligations and cache permission for this exact account/product remain unverified here. Do not assume a different OpenWeather product's rights apply. Activation and persistent reuse stay blocked until those obligations are documented. A proposed short cache is an application bound, not permission.

All new adapters target five-second request/body deadlines, 512 KiB response caps, one concurrent request per source, at least one second between starts and zero retries. Proposed application quota caps are below account marketing limits and still require durable reservation before requests. Quota limits do not establish endpoint permission.

## Frozen interfaces and compatibility

`WeatherProvider.getForecast` is unchanged. Registry IDs are `met`, `weatherapi`, `openweather`; upstream controls also recognize these IDs. `WeatherCollectionService.getForecasts` returns ordered `{providerId,result}` outcomes. The public optional `providerOutcomes` array accepts zero to four unique known IDs with an existing weather status, bounded reason and SourceRecord. Disabled/unconfigured entries should use `unavailable` with a reason. Legacy results without the array remain valid. Strict public schemas reject credential fields.

`server/providers/quotaTypes.ts` defines the minimal `ProviderQuota.reserve(providerId,cost)` boundary independently of persistence, so task 2 can implement it and both adapter lanes can consume `WeatherAdapterOptions` without importing unfinished implementation. Task 5 owns legacy/collection injection conflict validation and runtime collection; task 6 owns registry configuration. This task does not implement either.

## Evidence references

The source plan records checks on 2026-10-17 against [WeatherAPI pricing](https://www.weatherapi.com/pricing.aspx), [terms](https://www.weatherapi.com/terms.aspx), [docs](https://www.weatherapi.com/docs/), [OpenWeather pricing](https://openweathermap.org/price), [five-day forecast](https://openweathermap.org/api/forecast5) and [MET terms](https://docs.api.met.no/doc/TermsOfService.html). Those checks are carried as existing evidence, not fresh verification by this task. See `api-mode-local-setup.md` for account state and `docs/superpowers/plans/2026-10-17-multi-weather-activation.md` for remaining gates.

### OpenWeather account entitlement follow-up

On 2026-10-17, read-only inspection of the signed-in Services page (`https://home.openweathermap.org/myservices`) showed Weather / Free plan, 60 calls per minute and five-day three-hour forecast access; hourly and daily forecasts were unavailable. This resolves account-tier entitlement for the proposed forecast endpoint, not key activation, rights/cache review or live quality. The email-confirmation notice remained visible. No subscription was changed and no weather request was sent.

### WeatherAPI adapter evidence follow-up

Task 3 checked the official forecast schema and terms (https://www.weatherapi.com/docs/forecast-api/ and https://www.weatherapi.com/terms.aspx). The implementation targets forecast hours only; source issue time remains absent. Forecast cache is 15 minutes, below the documented 24-hour maximum. Free attribution and a concise end-user uncertainty/safety notice travel in source attribution and must remain visible through composed answers. Undocumented precipitation accumulation bounds and combined rain/snow probability are omitted with missing-field reasons. Synthetic adapter tests establish parser behavior, not account-key activation or live accuracy. Private setup, persistent quota integration and bounded live verification remain open.

### OpenWeather offline adapter disposition

The adapter preserves three-hour UTC samples and documented preceding-three-hour rain/snow volumes; it omits precipitation probability when its interval meaning is unverified. Cache retention is disabled (zero retained response bytes) pending confirmed permission. This is a conservative departure from the proposed optional cache cap. Authentication/backoff state may persist in the nonsecret quota checkpoint; that checkpoint contains no weather response. Account entitlement does not close rights, key activation or live-validation gates.
