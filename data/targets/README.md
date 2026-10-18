# V1 event and target catalog boundaries

> **Historical description:** the counts and unsupported lists below predate later V1 implementations. For the current seven event families, 38 dated meteor maxima across 2025–2027, 12 bounded radiant models, sample limits and optional catalogue boundaries, use [the 18 October event/history profile](../../docs/operations/v1-event-history-profile-20261018.md) and its runtime references. This older text is retained as history and is not the current capability contract.

## Astronomy targets

The MCP target-visibility tool uses Astronomy Engine 2.1.19 for the Sun, Moon, and solar-system bodies. The Milky Way core is a fixed J2000 direction near Sagittarius, explicitly described as an approximation. There is no deep-sky object, comet, asteroid, satellite, or star catalog in V1. Do not add a third-party catalog without recording its license, source vintage, coordinates/epoch, update process, and validation cases.

## Meteor showers

`data/events/meteor-peaks-nasa-2026.json` supplies 13 original forecast maxima for 2026 from Table 3, page 8 of NASA NTRS 20250009524, issued 2025-10-17. Fresh 2026 NTRS metadata records PUBLIC distribution and GOV_PUBLIC_USE_PERMITTED, with belongsToUsGov false; ownership is not inferred. The 2025 rights record was not freshly rechecked in this metadata wave. It contains QUA, ETA, ZPE, ARI, SSG, SDA, CAP, PER, DSX, DRA, AND, GEM and URS as exact UTC forecast instants. It supplies no activity widths, full-season intervals, visual rates or recurrence in another year. Five codes overlap the GMN radiant models: QUA, ETA, SDA, PER and GEM. LYR, ORI and LEO have radiant models but no NASA-calendar peak; the other eight NASA codes have no modeled radiant.

`data/events/meteor-showers-v1.json` is retained only as an audit record of the old approximate eight-shower compilation. It is not a runtime event source and is not copied into the plugin image. Its unresolved compilation-source review does not disable the independent NASA 2026 source.

`data/events/meteor-radiants-gmn-2021.json` separately selects original Table 1 fitted coefficients and Table 3 nominal windows from Moorhead, Clements and Vida's author-deposited arXiv:2205.15423v1 (CC BY 4.0). It covers PER, GEM, ORI, ETA, LYR, SDA, QUA and LEO near their reference solar longitudes. A reference longitude is a fit anchor, not an exact annual peak or activity-season boundary. Observations span 2018-12-10 through 2021-05-22. The engineering 2018–2030 evaluator bound flags annually reused calculations outside those observations as extrapolation; it is not a published accuracy guarantee.

Use `activity: "meteor-shower"` with a selected shower name/code as `target`; do not pass a shower to the generic planet/Moon/Milky Way tool. The planner preserves three exact start/midpoint/end evaluations in `evidence.meteorRadiantSamples`. Available samples contain geometric altitude/azimuth, modeled mean-radiant/topocentric-Moon separation and source/frame/fit-offset/parameter uncertainties. Outside-model results contain status/reason and no substituted numbers. Point samples do not establish continuous visibility, visual rates, storms/outbursts, full-season drift coverage or current-year peaks. Retain source/license/modification notices and review changes before catalog updates.

## Event calculations

Moon phases, equinoxes/solstices, local solar-eclipse contacts, and lunar-eclipse intervals are calculated using Astronomy Engine. The published NASA 12 August 2026 Reykjavik contact table is one fixed regression reference; it does not establish accuracy for every date, latitude, longitude, terrain profile, or future ΔT estimate. Solar-eclipse visibility uses the engine's contact altitudes; lunar-eclipse visibility samples Moon altitude during the penumbral interval. All visibility labels mean geometric-horizon visibility only.

## Explicitly unsupported in V1

- Comet/transient discoveries and asteroid close approaches
- Occultations
- Planetary conjunction/opposition event enumeration
- ISS and satellite passes
- Meteor radiants outside licensed nominal fit domains; full-season activity/drift and local expected rates
- Seeing, transparency, atmospheric extinction, terrain/horizon masks, and guaranteed sighting predictions
