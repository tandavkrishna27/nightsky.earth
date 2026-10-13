# Next-wave astronomy and provider evidence

Reviewed 13 October 2026 against the local implementation and primary sources. This document supplements the source register; it does not mark whole tickets complete. No MET live API calls, external messages, purchases, or publication occurred.

## Independent astronomy checks (Tasks 5 and 6)

`tests/nightsky/reference-astronomy.test.ts` checks the public event orchestration against independent US Naval Observatory API 4.0.1 values, transcribed on the review date. Four 2026 seasons and eight Moon phases cover all four phase names, multiple seasons, eclipse dates, a midnight UTC boundary and the September equinox's UTC date. Each must return exactly one correctly named event within 120 seconds of the minute-resolution reference. Expected values are static; tests make no network requests and do not calculate expected values using Astronomy Engine.

Command: `node --import tsx --test tests/nightsky/reference-astronomy.test.ts`. Result: **12 passed, 0 failed**. Include the new file in the root test aggregator before treating it as a default-suite gate. References: [USNO seasons 2026](https://aa.usno.navy.mil/api/seasons?year=2026), [USNO Moon phases 2026](https://aa.usno.navy.mil/api/moon/phases/year?year=2026), [API documentation](https://aa.usno.navy.mil/data/api.html).

The pinned Astronomy Engine 2.1.19 package contains its MIT notice and an Espenak/Meeus polynomial Delta-T function, selected by default. V1 computes eclipse circumstances locally; it does not ingest a NASA eclipse-element table. Record the algorithm provenance separately from any future table reuse. [Engine license](https://github.com/cosinekitty/astronomy/blob/master/LICENSE), [upstream source](https://github.com/cosinekitty/astronomy/blob/master/source/js/astronomy.ts), [Delta-T polynomial description](https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html).

Remaining accuracy gates: independent numerical Sun/twilight, Moon altitude, planet/target altitude and local eclipse contact fixtures. The present tests substantiate event time calculations only. [USNO twilight definitions](https://aa.usno.navy.mil/faq/RST_defs) support the -6/-12/-18 degree center-of-Sun thresholds.

**Correction implemented:** the event output calls eclipse visibility geometric, but the installed engine's local solar eclipse contact altitude uses `Horizon(..., 'normal')` atmospheric refraction; lunar event visibility calls `Horizon` without refraction. Label solar contact altitudes as modeled with standard refraction; retain the geometric label for lunar altitude. Do not promise precision at terrain-obstructed horizons. No shared implementation files were changed in this review lane.

## Meteor calendar reuse (Gate 0A / Task 6)

The current NASA index expressly identifies AMS as the source of its featured date windows. Even the individually linked Perseids Fast Facts identifies both AMS and NASA MEO. AMS publishes restrictions covering its protected material, with written permission requested for redistribution. NASA's general media policy also distinguishes third-party material and does not convey the third party's rights. These pages do not establish a compatible grant for this normalized catalog. [NASA index](https://science.nasa.gov/solar-system/meteors-meteorites/meteor-showers/), [Perseids](https://science.nasa.gov/solar-system/meteors-meteorites/perseids/), [AMS terms](https://www.amsmeteors.org/legal/), [NASA media policy](https://www.nasa.gov/nasa-brand-center/images-and-media/).

**Disposition: unresolved; disable the meteor catalog in distributed service output until permission or an independently licensed source is established.** A source link alone is insufficient. This is a source-screening decision, not a determination that individual astronomical facts are copyrightable. The product's own restriction against unresolved third-party reuse is the controlling gate. Recurring windows also cannot establish an exact future-year peak, radiant visibility or local meteor rate.

## NOAA SWPC OVATION reuse (Gate 0A)

The official SWPC product is an operational NOAA/NWS forecast; its product page describes NOAA's real-time implementation and credits the underlying JHU/APL model. NWS's agency disclaimer permits lawful reuse of its public-domain output unless specifically restricted. No separate restriction was found for the operational grid; this does not license original JHU software or third-party imagery. Derived nearest-cell outputs should credit NOAA/NWS SWPC, identify NightSky normalization/interpretation, link the disclaimer, and avoid implying an official NOAA result or endorsement. [OVATION product](https://www.swpc.noaa.gov/products/aurora-30-minute-forecast), [NWS data-use disclaimer](https://www.weather.gov/disclaimer).

**Disposition: source screening passes for operational grid data with those conditions.** Add the disclaimer link and modification indication to provenance. This is a 30–90 minute product, with no lead when Kp fallback replaces missing/contaminated solar-wind input; maintain issue/valid time checks. A grid value is not a user's sighting probability, and nearest-cell zero cannot exclude aurora visible on the distant horizon.

## MET global coverage and temporal meaning (Gate 0D / Task 7A)

MET's licensing page supplies CC BY 4.0/NLOD 2.0 terms and attribution guidance. Its data model describes worldwide forecasts, with prioritized Nordic/Arctic regions and different models, refresh cadence and resolution. Outside these regions the documented global source is ECMWF, approximately 9 km, through 10 days. Field availability varies by region and horizon. This substantiates a documented global forecast path, not measured availability for every place. [License](https://api.met.no/doc/License), [data model](https://api.met.no/doc/locationforecast/datamodel), [client rules](https://api.met.no/doc/TermsOfService).

**Live gate remains open:** owner-controlled application/contact User-Agent and representative tropical, midlatitude, high-latitude, land and ocean-edge payloads are still required. No identity was invented and no live forecast request was sent.

**Confirmed parser defect:** spreading `next_1_hours`, then `next_6_hours`, then `next_12_hours` lets longer-period precipitation overwrite shorter-period data while the output labels it only `validAt`. The documented precipitation amounts/probabilities describe future intervals, not an instant. Select the shortest available period per field and preserve each value's start/end or duration; amount and probability can originate from different periods. Do not divide a 6-hour amount into hourly values or combine probabilities. Downstream planning must explain overlapping forecast intervals and must not total overlapping windows.

Required correction tests: conflicting 1/6/12-hour amounts; absent 1-hour probability with available 6-hour probability; disappearance of 1-hour data at the horizon transition; an aggregation extending beyond the requested night; instant cloud/wind values unaffected by period merging. Shared value schemas and consumer guidance need period metadata. Forecast field presence alone must not imply continuous requested-night coverage.

## Gate outcome

- Closed evidence slices: 12 independent season/phase reference checks; MET published license/global model documentation; NOAA/NWS operational OVATION reuse screening with conditions.
- Unresolved: remaining Task 5/6 numerical references, meteor catalog permissions, representative MET live sample coverage. Temporal aggregation correction is implemented with five parser regressions and planner amount/probability duration display.
- Optional GEFS remains separate and unmeasured; no global alert capability follows from NWS regional forecasts.

## Integration disposition

Reference tests are included in the aggregate suite. Solar/lunar refraction caveats and NOAA disclaimer/modification provenance are corrected. MET periods are selected separately per field, retain original bounds, and do not overwrite instant values. Overlapping earlier rainfall is available between forecast steps without inventing cloud coverage; sparse instant-only gaps report not-covered. Meteor catalog remains provisional internal code and is blocked from distributed output until the source gate is cleared.


## MET live gate follow-up — 13 October 2026

The owner supplied nightsky.earth2026@gmail.com. Eight representative point forecasts now pass through the actual adapter: Hanle IIA reference, Kodaikanal, Munnar, Oslo, Tromso, Quito, Cape Town and Sydney. Each HTTP200 payload parses; nine core instantaneous fields exist at every inspected near-term step, absent gust/probability fields stay missing, day-six and outside-horizon cases behave correctly, and eight warm repeats use cache without new source traffic. Full matrix, timestamps, hashes and limits are in source-spikes.md and .data/met/live-report.json. This supersedes the earlier no-contact/no-live-sample notes. Explicit Arctic-model/ocean and refresh-cycle/accuracy/host checks remain open. Hanle named-place coverage is a separate gap.
