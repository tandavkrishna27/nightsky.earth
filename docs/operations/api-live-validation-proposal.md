# Bounded API validation proposal

Prepared 2026-10-17 against baseline `95c2cff`; task 7 of `docs/superpowers/plans/2026-10-17-multi-weather-activation.md`. **No live request or deployment occurred. Owner-authorized private credential setup and explicit real quota initialization are recorded in the setup evidence; this executor does not extract keys or initialize quotas.** Approval of this document's envelope must precede live execution. The dedicated executor is implemented and tested offline; live execution remains unapproved. Existing older scripts are not substitutes.

## Approval envelope

One manually started local batch, maximum ten minutes from executor start, maximum **12 upstream HTTP attempts total and three each for Geoapify, MET Norway, WeatherAPI and OpenWeather**. Failed, aborted and non-200 attempts count; no retries, redirect follows, replacements, pagination, historical jobs or budget redistribution. Skip sources without completed admission. No user GPS or browser session is collected. Private API keys are sent only to their respective approved provider for authentication, never to journals or chat. Only the public place queries `Hanle, India`, `Kodaikanal, India`, and `Munnar, India` are transmitted. End the batch early on a global safety failure; a source failure remains an explicit source outcome.

| Case, in order | Discovery allowance | Forecast allowance | Checks |
| --- | --- | --- | --- |
| Hanle, India | One Geoapify geocode | One each admitted MET, WeatherAPI, OpenWeather | Selected point identity, timezone evidence, source labels, native timestamps and cadence |
| Kodaikanal, India | One Geoapify geocode | One each admitted weather source | Same selected point across sources, field units, missing fields and horizon |
| Munnar, India | One Geoapify geocode | One each admitted weather source | Attribution, independent statuses, partial results and measured request timing |

Freeze a single `startUtc` immediately before the cases and `endUtc=startUtc+24h`; use the selected record's verified IANA timezone. Require one unambiguous matching public locality and `Asia/Kolkata` evidence. If the result is ambiguous, absent, or has unknown timezone, mark that case skipped without another lookup. Never choose a first result silently. This is a forecast integration sample, not a global accuracy or observing-site access assessment.

## Exact wire contract

Only HTTPS GET, default port 443, no userinfo or fragment, no redirects, exact hosts/paths and parameter sets below. Secret values are injected from the existing private process environment, never command arguments or reports.

| Provider | Endpoint | Query semantics | Maximum response / attempt deadline |
| --- | --- | --- | --- |
| Geoapify | `https://api.geoapify.com/v1/geocode/search` | `text` is exactly one approved place query, `limit=5`, `format=geojson`, plus private `apiKey` | 262,144 decompressed bytes / 5 seconds |
| MET Norway | `https://api.met.no/weatherapi/locationforecast/2.0/complete` | `lat`, `lon` from `roundedMetCoordinates(selectedPlace)`, formatted to four decimal places; identifying configured User-Agent | 4,194,304 decompressed bytes / 8 seconds |
| WeatherAPI | `https://api.weatherapi.com/v1/forecast.json` | `q` is the selected latitude and longitude, `days=3`, `aqi=no`, `alerts=no`, plus private `key` | 524,288 decompressed bytes / 5 seconds |
| OpenWeather | `https://api.openweathermap.org/data/2.5/forecast` | selected `lat`, `lon`, `units=metric`, `cnt=40`, plus private `appid` | 524,288 decompressed bytes / 5 seconds |

These limits total at most 16,515,072 accepted decompressed body bytes across twelve responses. A streaming guard may receive one chunk crossing a limit before cancellation; this is not a promise about TLS, compressed wire bytes or kernel buffers. Abort body reads as well as header waits. Retain no raw bodies on disk. The overall ten-minute watchdog must abort active requests and prevent new ones, independently of the adapters' deadlines. Use a monotonic clock for the batch deadline and count reservations immediately before network dispatch. At most two weather sources concurrently, one active request per provider, at least one second between starts for the same provider.

Actual MET code uses **complete**, despite the older admission table saying compact. Preserve that implemented endpoint and record this discrepancy; do not switch endpoint during a run. MET deliberately rounds coordinates; report both selected and requested public coordinates instead of claiming exact unrounded wire identity.

## Fanout and timezone accounting

`server/places/api/discovery.ts` resolves a named place with one Geoapify `/v1/geocode/search` request (`limit=5`, `format=geojson`) when GeoNames is unconfigured. `geoapify.ts` reads timezone from `properties.timezone.name` in that response. There is no additional Geoapify timezone endpoint in this adapter. Keep `NIGHTSKY_GEONAMES_USERNAME` absent and deny GeoNames hosts at the executor transport boundary. Unknown timezone is a skipped case; do not compensate with `/timezoneJSON`, reverse geocoding or another service.

Call named resolution once per case and the shared weather collection once for its selected point. That is at most 3 discovery + 9 forecast requests. Existing selection-store reuse does not require another geocode. Do not call discovery region/place search, NOAA, history, plan, or compare in this live batch. OpenWeather intentionally retains no response cache, so repeating conditions through plan and compare can spend additional requests; legacy MET cache expectations do not hold for all providers. Exercise those consumers in the offline matrix. Owner live questions need their own bounded approval after this batch; unused request slots do not authorize them.

## Private setup and budget gate

Initial presence-only inspection found only `.env.example` in this worktree and none of the credential/quota variables in this lane’s process. Subsequently, the owner authorized the coordinating agent to transfer the three provider keys into `C:/Users/TK/.nightsky/providers.env`, protected with owner/SYSTEM-only ACLs, with a valid MET contact. The coordinator verified variable presence through Node 24 without printing values. This lane did not read that file. The owner subsequently confirmed all three accounts were unused elsewhere. Based on that attestation and dashboard evidence, the coordinator explicitly initialized `C:/Users/TK/.nightsky/provider-quota.json` with the existing offline initializer, applied owner/SYSTEM-only ACLs, released its lock, and appended the path to the private environment file. Do not reset or reinitialize it. Live approval remains pending. Recorded dashboard evidence: Geoapify zero usage for September 17–October 17, WeatherAPI zero current-month calls; OpenWeather key Active, remaining-budget proof absent and email-confirmation notice still visible.

Before execution, privately configure `NIGHTSKY_DISCOVERY_MODE=api`, the admitted subset of `NIGHTSKY_WEATHER_PROVIDERS`, and `NIGHTSKY_WEATHER_ADMITTED_PROVIDERS`; configure only admitted keys and a valid MET contact. Use the already approved private environment mechanism; no browser extraction or secret import is authorized by this proposal. Require a local absolute `NIGHTSKY_QUOTA_STATE_PATH`, its existing parent, one process, and successful fail-closed durable quota loading. API mode must have no conflicting catalogue/regional environment settings.

Source-policy records are a gate: WeatherAPI trial access cannot prove Free entitlement; OpenWeather's recorded Free five-day entitlement does not prove key activation or rights. WeatherAPI's documented bounded cache and OpenWeather's zero-cache decision remain applicable. Skip any provider whose exact permitted use or attribution obligations remain unresolved; do not set its admission flag merely to test whether it works.

The durable quota policies reserve before fetching. Existing checkpoints retain usage, disable/backoff state and stable account labels across restarts and key changes. For a genuinely first initialization only, the operator must independently attest **unused** budgets for every account covered by the fixed initializer policies, accounting for other clients, or demonstrate the full relevant reset/quiet periods. The present initializer cannot import partially used remaining balances. If that attestation is unavailable, do not initialize or run.

After that separate attestation, the existing offline command is:

```powershell
node --import tsx scripts/initialize-provider-quota.ts
```

It accepts no arguments and requires privately supplied `NIGHTSKY_QUOTA_STATE_PATH`, `NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET=yes`, and nonsecret `NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE`. Do not execute it on startup, retry it to clear failures, delete checkpoint/marker files, or auto-remove locks. Existing state needs no initialization. Corruption, missing-after-use state, a lock or failed persistence stops the batch; retain evidence for separate recovery review. A fresh batch ID never resets account allowance.

## Implemented executor and launch gate

`scripts/validate-api-live.ts` is the dedicated executor. It uses the existing Geoapify parser, selection store, weather registry and durable quotas, with a shared fetch guard. It does not exercise MCP transport or owner client loading. Exact locality names, verified `Asia/Kolkata`, and broad public locality coordinate bounds are required; ambiguous selection is skipped. It records per-source statuses and sample counts, and distinguishes completed batches from cases with usable samples. A partial forecast remains partial.

The shared guard enforces the endpoint/query allowlist, one attempt per provider/place, twelve total/three per provider, ten-minute batch watchdog, redirect rejection, body byte/deadline limits and zero retries. A durable `live-<batch-id>.jsonl` journal is created exclusively beside the already existing quota checkpoint, records attempts before fetch, and cannot be reused. Failed journal persistence stops later requests. Missing checkpoint is refused; corrupt quota state stops before network dispatch. No implicit initialization or recovery exists. Skipped selection/timezone cases are persisted and receive the same spacing as completed cases. Raw upstream strings and response bodies are not copied into reports; source attribution comes from existing normalized weather adapters.

Offline preview (safe without credentials):

```powershell
node --import tsx scripts/validate-api-live.ts
node --import tsx --test tests/operations/api-live-validation.test.ts
```

**After separate explicit owner approval only**, the coordinator may set these nonsecret process values: `NIGHTSKY_LIVE_APPROVED_ENVELOPE=api-live-v1-12-3-600-zero-retries`, a unique `NIGHTSKY_LIVE_BATCH_ID`, and `NIGHTSKY_LIVE_GEOAPIFY_ADMITTED=yes` after Geoapify permission review. Configure the admitted weather subset and the existing initialized quota path as above. The exact launch is:

```powershell
node --env-file=C:/Users/TK/.nightsky/providers.env --import tsx scripts/validate-api-live.ts --live
```

The command refuses without the approval marker, Geoapify admission, API mode, selected weather credentials/admission, batch ID and quota state. An approval marker records a real owner decision; setting it is not itself authorization. Explicitly choose a new batch ID only for a separately approved batch, never as a retry workaround. The private file is loaded by Node; do not print or inspect it. The executor has no production deployment or public release approval effect.

Do not use `scripts/verify-live-planning.ts`: it is legacy MET-only, permits four points and retains raw snapshots. `scripts/measure-api-runtime.ts` is synthetic only. The separate fifteen-journey offline rehearsal and any subsequent owner live questions have their own evidence/approval scope.

Offline evidence in this lane: the new test file first failed because the executor did not exist; after implementation, **14/14 tests passed**. They cover offline default, unapproved refusal, allowlist/duplicate/cap/deadline enforcement, stalled and uncooperative fetches, body overflow, redirect rejection, failed journal persistence, selection/timezone refusal, full synthetic normalization/redaction through Geoapify plus all three actual weather adapters (exactly twelve calls, all three cases usable), missing/corrupt quota state and journal reuse. A second synthetic run with unknown timezone made exactly three Geoapify requests and no forecast calls. The full synthetic runner uses temporary test-only initialized quotas. This lane did not initialize real account state; the coordinator’s separately authorized initialization is recorded above. `npm run check` passed with the executor added to `tsconfig.tools.json`, so CI now typechecks it. An explicit strict TypeScript check also passed:

```powershell
npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --strict scripts/validate-api-live.ts
```

Tests are registered in `tests/all.test.ts`. The coordinator owns whole-wave validation and final review. No live command was run.

## Evidence and redaction

The executor journal records the envelope revision, batch ID, start/end UTC, skipped provider IDs, public selected coordinates, separately labelled requested forecast coordinates (including MET rounding), source revision, timezone provenance, provider endpoint identifier (never full URL), per-attempt sequence/status/elapsed/body-byte count, source availability, sample count, absent fields and attribution. A review report must additionally record the code SHA, source admission evidence, native cadence/coverage interpretation and precise pass/fail conclusions; the executor does not claim those human assessments automatically. Record request latency separately from end-to-end case time; record RSS at specified boundaries as sampled RSS, not peak memory. Cache/storage metrics unavailable from a public interface remain unknown; never invent measurements. Report exact request counts including failures and unused slots.

Allowlist output fields rather than redacting serialized exceptions after the fact. Exclude keys, environment dumps, query-bearing URLs, HTTP request headers, response headers outside an explicit metadata allowlist, raw response bodies, account emails and quota filesystem paths. Do not persist OpenWeather responses; retain only validation facts and permitted source attribution. Keep the detailed nonsecret report bounded (256 KiB) and label all synthetic evidence as synthetic. Any failed source stays failed/skipped, without substitution or a quality claim. No deployment, publication, hosting, history or overall ticket completion follows from this sample.

## Proposal review record

Read-only source inspection covered the discovery/HTTP/Geoapify adapters, MET/WeatherAPI/OpenWeather adapters, weather configuration/collection, quota initializer, existing synthetic measurement and legacy live-planning scripts, and admission/setup documents. No network tools, browser controls or live scripts were used by this lane. Changes are this proposal, the guarded executor, its fourteen offline tests, test registration and TypeScript tooling registration. Runtime source adapters were not changed. Root owns correction of the stale MET admission endpoint table.

## Review corrections

Three review findings were reproduced and fixed: quota reservation exceptions and authentication/backoff persistence failures now stop the entire batch and abort active requests; failed, timed-out and oversized dispatched attempts retain elapsed time; and reports distinguish the selected point from actual provider request points using the shared MET rounding helper. A last-case synthetic 401/429 persistence failure proves the report remains stopped and an active MET request aborts. The integrated twelve-request test asserts every provider outcome has usable samples and preserves non-four-decimal selected coordinates separately from MET’s four-decimal point. Updated affected suite: 13/13 passing; `npm run check` passing. No live request was performed.

### Forecast validation facts

The executor now retains the exact requested window, first/last normalized sample UTC times, unique consecutive sample intervals (at most 47), normalized forecast horizon and availability, observed sample span, bounded field/unit map, missing fields, coverage boundaries and schema/unit/order/window/cadence checks. These are derived from public-schema validated forecasts. Unexpected unit strings become a fixed marker; numerical weather values and response bodies remain excluded. MET mixed native cadence is reported without an assumed single interval; WeatherAPI/OpenWeather cadence checks use 3600/10800 seconds and remain unknown with fewer than two samples. Synthetic fixtures now provide multiple native samples for every provider; tests cover mixed cadence, partial horizon, absent fields, unexpected units and redaction. Latest affected suite: 14/14 passed; TypeScript checks passed.
