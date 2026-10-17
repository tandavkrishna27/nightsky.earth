# Hyderabad owner live results — 17 October 2026

The owner explicitly approved the exact `owner-hyderabad-v1-4-1-120-zero-retries` packet. Execution completed at **2026-10-17T12:11:53.119Z** using the existing private configuration and durable quota ledger, preserving prior quota state. The allowance is now **consumed**. No retry, refresh, replacement location or native live session is authorized by this completed packet.

Implementation: `cf265c6b217fe9992f4d519871d7c225873b2368`. The coordinator verified all six exact-commit jobs passed in [CI run 39031080277](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39031080277). This results document is a subsequent documentation follow-up; that implementation CI does not validate a future documentation commit.

## Observed bounded integration result

Safe metrics were read from local `dist/hyderabad-owner-live-20261017/report.json`; no private credential or quota contents were read by this documentation task. Batch: `owner-hyderabad-20261017-1792239110576`. Status: completed, one usable case, all admitted sources have samples, no skipped providers.

| Provider | HTTP | Response bytes | Request elapsed | Normalized samples / state |
| --- | ---: | ---: | ---: | --- |
| Geoapify | 200 | 2,636 | 622 ms | One eligible Hyderabad city point; verified Asia/Kolkata from source |
| MET Norway | 200 | 61,918 | 760 ms | 25 / partial |
| WeatherAPI | 200 | 57,048 | 375 ms | 24 / partial |
| OpenWeather | 200 | 16,597 | 130 ms | 8 / partial |

Exactly **four requests**, all HTTP 200; **138,199 response bytes** total. No raw weather responses or numerical weather values were retained in the report. Selected public city reference point: 17.360589, 78.4740613; MET used the existing rounded request point 17.3605, 78.474. Source revision: `f4113c077ac1095897675f20b0124f370c1dbb3d42af841c7cde291dcee7e15f`.

The frozen request window was **17 October 12:11:50.589 UTC through 18 October 12:11:50.589 UTC**, displayed in Asia/Kolkata. This is current city-point forecast integration evidence, not forecast-accuracy validation. WeatherAPI cadence was one hour and OpenWeather cadence three hours; their native-cadence checks passed. No interpolation or averaging between products is implied. This successful WeatherAPI request does not establish post-trial Free access.

All sources passed schema, units, strictly increasing time and value-relevance checks. Partial states and missing fields remain: MET lacks precipitation probability/wind gust; WeatherAPI lacks layer clouds and precipitation probability/amount; OpenWeather lacks layer clouds, precipitation probability and dew point. Their respective reported forecast horizons were approximately 228.64, 53.30 and 119.80 hours; these do not supply December weather.

MET's `samplesInsideRequestedWindow:false` is a sample-anchor diagnostic, **not a failed temporal-value validation**. Its first sample anchor was 12:00, before the 12:11 request start, because an interval value overlaps the window. All 216 retained instantaneous values were within the window, all 25 interval values overlapped it, and `valuesRelevantToWindow:true`. Intervals extended through 18 October 13:00 UTC. Anchor-only endpoint flags do not establish invalid values or continuous complete coverage.

The case reported 1,425 ms case elapsed and **97,935,360 bytes sampled RSS**. This is a point sample, not peak memory, startup/concurrency measurement or small-host capacity acceptance. Individual request timings are observed values for this one packet, not a service latency guarantee.

## Remaining boundary

This closes execution of this bounded city-point packet only. It does not establish an outdoor observing site, north-of-Hyderabad suitability/access, Geminids event or December weather acceptance, native skills/reference loading, a full native model journey, historical baseline, administrative geometry, deployment or publication. Original **12 Done / 9 Partial / 6 Not started** and the six completion blocks remain unchanged. Any further provider request requires its own applicable bounded authority; do not rerun the setup command under the consumed allowance.
