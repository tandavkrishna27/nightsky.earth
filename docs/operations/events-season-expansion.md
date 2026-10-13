# Meteor source expansion — 14 October 2026

## Accepted data

The active peak calendar includes thirteen exact UTC forecast maxima for each of 2025 and 2026, with independent source/vintage and year-qualified identities. The new [NASA 2025 record](https://ntrs.nasa.gov/citations/20240012381) explicitly states US government work and public use permitted. Only original Table 3 names/codes and timestamps from [page 9](https://ntrs.nasa.gov/api/citations/20240012381/downloads/LEO_Forecast_2025.pdf) are normalized. No rates, width, recurrence or locally visible season are imported. Its issue date is 18 October 2024. The accepted 2026 catalog remains unchanged.

Four additional original fits from [Moorhead, Clements and Vida, arXiv v1](https://arxiv.org/html/2205.15423v1) are accepted under its explicit CC BY 4.0 notice: Alpha Capricornids (CAP), Northern Taurids (NTA), Southern Taurids (STA), Sigma Hydrids (HYD). Table 1 coefficients and bootstrap uncertainties plus Table 3 nominal fit windows are retained. This raises bounded radiant support from eight to twelve codes. CAP is the only new overlap with NASA peak codes. Taurids remain mean fitted directions subject to the source's special selection method; they are not a new activity calendar.

## Full-season research disposition

The NASA 2025 report Table 3 supplies maxima and maximum ZHR, without tau/r0/r1 shape parameters or season endpoints. Figure 1 shows overlapping modeled visual activity; it is not digitized. NASA explains that cumulative shower rates overlap, and the model targets spacecraft risk. No curve-derived season is accepted.

Bounded reads (at most 4096 bytes per file, no archives retained) inspected the linked [2025 flux](https://ntrs.nasa.gov/api/citations/20240012381/downloads/flux_data.txt), [2025 fluence](https://ntrs.nasa.gov/api/citations/20240012381/downloads/fluence_data.txt), [2026 flux](https://ntrs.nasa.gov/api/citations/20250009524/downloads/flux_data.txt) and [2026 fluence](https://ntrs.nasa.gov/api/citations/20250009524/downloads/fluence_data.txt) headers. They include sampled aggregate ZHR, solar longitude, energy-weighted flux/fluence and enhancement factors. They have no individual shower code or activity-start/end column. Flux is per square meter per hour; 2025 fluence specifies a seven-hour exposure interval. These are possible cumulative model-context sources, but decomposing them into individual seasons or choosing a rate threshold would introduce a new scientific assumption. Rights clearance alone does not establish that calculation. No values from these attachments are imported.

[GMN high-level products](https://globalmeteornetwork.org/data/) remain explicitly CC BY 4.0, providing a possible observational route. Complete seasons still require quality cuts, shower assignment, treatment of missing observation nights and a documented activity definition. The radiant study explicitly does not establish corrected full shower durations. No bulk GMN data was downloaded. Search did not identify an accepted 2027 NASA source; absence of a search result is not evidence that none exists.

## Bounds and remaining gates

Calendar filtering includes exact endpoints and does not extrapolate outside 2025/2026. Peak instant spans: 2025-01-03 12:27 through 2025-12-22 09:44 UTC; 2026-01-03 18:38 through 2026-12-22 15:54 UTC. Empty results remain partial, with no assertion of no physical activity. Public input allows at most 366 days and 25 events (default 15), with explicit truncation. At most two 13-row peak catalogs are read locally, without runtime network access.

Radiant calculation remains limited to UTC years 2018–2030 and to half of each nominal fit duration converted at the existing 0.986 degrees/day approximation: CAP seven days, NTA fifteen, STA nineteen and HYD fifteen total days. These are fit windows, not seasons. Annual reuse outside the observation span is explicitly extrapolation. Unknown/outside-model states remain intact, with no fabricated direction or rate. Pole and longitude-edge calculations are tested; atmospheric effects, zenith attraction, terrain and propagated confidence intervals remain unmodeled.

Full-season coverage, other-year forecasting, missing NASA radiant codes, maintained dynamic/transient catalogs and source-supported local event visibility remain open gates. Root maintains the canonical rights register, contracts, packaging and planner integration.

## Verification

Test-first RED: new 2025 peak test failed because zero rows were returned; new fitted-row test failed because the four rows were absent. Focused GREEN after implementation: 29 event tests passed, including every fitted-window edge, polar observer directions, independent lunar/solar horizon references and 2025 identity/provenance. Root owns final aggregate tests and type checks. No deployment or source communication occurred.
