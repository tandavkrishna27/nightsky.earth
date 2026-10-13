# Events completion wave — 2026-10-14

## Active calendar source

The active meteor calendar now uses all 13 original forecast maxima from [NASA MEO's 2026 report, Table 3, page 8](https://ntrs.nasa.gov/api/citations/20250009524/downloads/LEO_Forecast_2026.pdf). Its [specific NTRS record](https://ntrs.nasa.gov/citations/20250009524) explicitly identifies US government work and public use permission. The report was issued October 17, 2025. Selected names/codes and forecast timestamps are normalized in `data/events/meteor-peaks-nasa-2026.json`; source, rights evidence, table, review date and modification notice are retained. No ZHR, spacecraft flux, activity widths or radiant coordinates were imported.

`server/events/meteorPeaks.ts` validates and filters inclusive UTC instants. The public search returns these peaks only when inside the requested window, labels meteor coverage partial, and never recurs into 2027. Empty results cannot establish no physical shower activity. The old `meteor-showers-v1.json` is retained solely for source-audit history and is no longer read by event search. Its redistribution/source screening remains unresolved; it should be excluded from the runtime package.

Five peak codes overlap the eight accepted GMN radiant models: QUA, ETA, SDA, PER, GEM. The NASA report supplies no LYR, ORI or LEO maxima. Its eight other forecast codes have no accepted runtime radiant model. The calendar and radiant coverages are separate. Full-season widths and a validated full-season radiant model remain required for complete meteor planning; this wave does not close that gate or claim local rates.

## Fresh primary review

| Primary source | Disposition |
| --- | --- |
| [GMN high-level data](https://globalmeteornetwork.org/data/) | Explicit CC BY 4.0. A seasonal observational series is a possible next source, requiring quality selection, shower assignment and coverage validation. No bulk archive downloaded. |
| [Moorhead, Clements and Vida, exact v1](https://arxiv.org/html/2205.15423v1) | Explicit CC BY 4.0. Existing original coefficients stay confined to nominal fit windows. The authors did not measure corrected full shower duration; the old calendar seasons cannot be inferred. |
| [NASA Perseids facts](https://science.nasa.gov/solar-system/meteors-meteorites/perseids/) | Facts block credits AMS and NASA MEO and currently gives an ending date plus peak night. Hosting does not identify which contributor supplied each old date. No replacement season imported. |
| [NASA 2019 record](https://ntrs.nasa.gov/citations/20190030373), [arXiv deposit](https://arxiv.org/abs/1904.06370), [NASA STI guidance](https://sti.nasa.gov/disclaimers/) | Public use permission is documented, but the record has mixed institutional authors and does not label the whole work US government authored. The repository distribution license does not independently grant downstream rights. Earlier Table 5 provenance and activity-threshold gates remain open. This is screening, not a legal conclusion that factual dates are copyrighted. |

## Independent local horizon references

Five bounded [NASA/JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) requests were made, each below one day. Parameters: `EPHEM_TYPE=OBSERVER`, `CENTER=coord@399`, `COORD_TYPE=GEODETIC`, `QUANTITIES=4`, `APPARENT=AIRLESS`, `format=text`. UTC, east-positive longitude, geodetic latitude, height 0 km. Returned API 1.2, DE441, ITRF93 center frame, EOP `eop.261012.p270108`, with data-based Earth orientation through October 12, 2026. [Frame and quantity documentation](https://ssd.jpl.nasa.gov/horizons/manual.html).

| Target/site | Request UTC and step | Transcribed elevations in degrees |
| --- | --- | --- |
| Moon 301, synthetic `(57.5,18.5204,0)` | 2026-03-03 14:14–14:24, 1 minute | 14:14 −1.982102; 14:22 −0.164618; 14:23 +0.062795; 14:24 +0.290256 |
| Moon 301, Pune `(73.8567,18.5204,0)` | 2026-03-03 08:40–14:30, 10 minutes | 08:40 −56.670190; 11:30 −23.438244; 13:10 −1.103430; 13:20 +1.169447; 14:20 +14.891001 |
| Sun 10, synthetic `(−20,0,0)` | 2026-08-12 19:05–19:49, 1 minute | 19:05 +4.833747; 19:06 +4.592056; 19:27 −0.484422; 19:28 −0.726179; 19:48 −5.560824; 19:49 −5.802508 |

These are independently calculated apparent topocentric body-center directions without atmospheric refraction. Solar eclipse contacts use standard refraction; the solar test checks robust horizon signs across that convention difference, not exact altitude equality. Its contact timestamps locate the model within external elevation brackets; JPL does not independently establish eclipse contact times. Existing NASA Dallas contacts and global lunar timing references provide separate timing evidence.

## Defect and verification

The lunar interval loop omitted a final partial ten-minute step. At the synthetic site its final old sample was 14:14:01 UTC, below the horizon. JPL independently places rise during 14:22–14:23, before the modeled end 14:23:18. Event search wrongly returned not-visible. The loop now includes the endpoint once. RED: one failure/one pass, with actual not-visible against expected partially-visible. GREEN: five local tests pass, including Pune's lunar rise and the solar horizon case.

Peak-source TDD initially failed for missing data and inclusive-boundary behavior; the active-search switch then failed four calendar tests before implementation. After the switch, all 26 focused event tests passed. Root owns final aggregate import/check results. No deployment or source communication occurred.

Remaining numerical limits: ten-minute lunar samples do not prove absence of brief grazing polar crossings between samples. Visibility labels describe the complete modeled event, not just the requested overlap. Clouds, terrain, twilight detectability and personal counts are not established.

Additional non-grazing lunar references use the same March 3 08:40–14:30 UTC, ten-minute Moon request: Honolulu site `(−157.8583,21.3069,0)` has elevations +57.818654,+70.885307,+33.307653 at 08:40,11:30,14:30; London `(−0.1276,51.5072,0)` has −17.534745,−32.195837,−27.023366. The corresponding event classifications are visible and not-visible. These broad horizon references complement the two partial-visibility cases, without certifying grazing behavior.
