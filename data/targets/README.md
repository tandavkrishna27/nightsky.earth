# V1 event and target boundaries

Current boundary guide, 18 October 2026. The [event/history profile](../../docs/operations/v1-event-history-profile-20261018.md) contains the detailed evidence matrix and scientific limits. This supersedes the earlier eight-radiant/2026-only guide; it grants no new source or historical-method admission.

## Astronomy targets and optional catalogues

The generic target-visibility tool uses Astronomy Engine **2.1.19** for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto. The Milky Way core is an approximate fixed J2000 direction near Sagittarius (`server/nightsky/astronomy.ts`). This finite target list is not a complete star/deep-sky catalogue. Optional Public Universe reference/target enrichment and conditional JPL small-body lookup have separate selection/admission gates; they do not extend the core event registry. New catalogue material requires source vintage, reuse terms, coordinate epoch/frame, maintenance and validation evidence.

## Seven event families

`server/events/catalog.ts` implements Moon phases, equinoxes/solstices, eclipses, meteor showers, opposition, planetary conjunctions and greatest elongation. Requests span at most **366 days**, returning default **15**, maximum **25** events with explicit truncation.

- Moon phases/seasons use the engine. Solar eclipses use local contacts/obscuration and contact altitudes with standard refraction; lunar eclipse intervals use bounded geometric Moon-altitude evaluation and modeled obscuration. Unresolved grazing cases remain unevaluated. The NASA **12 August 2026 Reykjavik** contact table is one retained reference, not certification for every date/location or future Earth-rotation estimate. Terrain, weather and detectability remain separate.
- Opposition and solar planetary alignments use the defined heliocentric-longitude conventions in `server/events/planetAlignments.ts`, within **1900–2100**. Greatest elongation for Mercury/Venus uses maximum geocentric three-dimensional Sun separation with light-time/aberration in `planetElongations.ts`, within the same engineering range.
- Planet-pair conjunction screening covers **21 Mercury–Neptune pairs in 2025–2027**, using geocentric right ascension of date with light-time/aberration (`planetPairConjunctions.ts`). Completeness is not certified; unresolved intervals remain explicit. An RA crossing is not minimum separation or closest approach.

Moon/seasons/eclipse request-duration validation does not certify arbitrary-year scientific accuracy. Global event instants and morning/evening labels do not supply local darkness, horizon clearance or sighting probability. Conjunction-window geometry samples every **15 minutes plus endpoint**, at most **97 samples / 24 hours / six pair events per plan**; sampling is not continuous visibility certification.

## Meteor evidence and planning

Retain all **nineteen identities** in `shared/nightsky/meteors.ts`: QUA LYR ETA ZPE ARI SSG SDA CAP PER DSX ORI DRA NTA STA LEO AND GEM URS HYD. `data/events/meteor-evidence-inventory-v1.json` remains `pending-owner-decision`, with no adopted maintained selection, named maintainer or review date. Missing evidence is not inactivity and does not authorize dropping an identity.

The three runtime NASA MEO forecast files supply **38 dated maxima**:

| File | Count | Original source |
| --- | ---: | --- |
| `data/events/meteor-peaks-nasa-2025.json` | 13 | [NTRS 20240012381](https://ntrs.nasa.gov/citations/20240012381), issued 2024-10-18, Table 3 p9 |
| `data/events/meteor-peaks-nasa-2026.json` | 13 | [NTRS 20250009524](https://ntrs.nasa.gov/citations/20250009524), issued 2025-10-17, Table 3 p8 |
| `data/events/meteor-peaks-nasa-2027.json` | 12 | [NTRS 20260009360](https://ntrs.nasa.gov/citations/20260009360), issued 2026-10-16, Table 3 p9 |

Retained metadata records government-public-use statements without inferring ownership from NASA hosting. Published UT minute forecasts are represented as ISO UTC without subminute accuracy. They are not complete seasons, local visual optima, rates or automatic recurrence in another year. No dated maxima are supplied outside 2025–2027. The old `meteor-showers-v1.json` eight-shower compilation is audit-only, not the runtime peak source or plugin-image data.

`data/events/meteor-radiants-gmn-2021.json` retains **twelve** original fitted models: PER GEM ORI ETA LYR SDA QUA LEO CAP NTA STA HYD. Source: [Moorhead, Clements and Vida, arXiv 2205.15423v1](https://arxiv.org/abs/2205.15423v1), Table 1 coefficients/Table 3 nominal windows, **CC BY 4.0**, with modification attribution. Observations span **2018-12-10 through 2021-05-22**. Evaluator years **2018–2030** and each nominal solar-longitude fit domain both apply; reuse beyond observations is flagged as extrapolation. A fit anchor is not an annual peak or season boundary. Preserve frame, source, uncertainty and out-of-domain reasons; never substitute unsupported coordinates.

Separate reference layers contain **eighteen approximate verbal rows**, **five IGN civil guidance rows**, and **two ETA/ORI typical longitude intervals** from [A&A A58, DOI 10.1051/0004-6361/202038115](https://doi.org/10.1051/0004-6361/202038115), CC BY 4.0. Per-row source/vintage/rights and qualifications remain in `meteorCalendarGuidance.ts`, `meteorCivilGuidance.ts` and `meteorTypicalSeasons.ts`. Civil endpoint clocks/timezone and longitude conversion remain unresolved; overlap is not inferred. There are **zero complete admitted UTC activity seasons**. These layers do not fill missing maxima or extend radiant domains.

Use `activity: "meteor-shower"` and a selected name/code as `target`, rather than passing a shower to the generic target tool. The planner retains three start/midpoint/end `evidence.meteorRadiantSamples` and a separate selected-shower window sampled every **15 minutes plus endpoint**, up to **97 samples / 24 hours**. No all-shower fanout occurs. Samples supply bounded local geometry/Moon separation when supported, not continuous visibility, full-season drift, storms or expected local rates. Retain daytime qualifications for ARI/DSX/ZPE.

## Explicit unavailability

Core event types `occultation`, `comet` and `other` return unsupported reasons. There is no maintained core satellite-pass, transient-discovery or asteroid-close-approach pipeline. Core local astronomy supplies no quantitative seeing/transparency forecast, atmospheric-extinction model or terrain horizon mask. Optional 7Timer, when selected and admitted, separately supplies source-specific categorical seeing/transparency forecast bands; these are model estimates, not exact numeric measurements, certified site conditions or sighting guarantees. Complete UTC meteor seasons, radiant extrapolation beyond admitted domains and guaranteed sightings remain unsupported. Optional enrichment does not establish a numerical historical-cloud baseline or extend core event support.
