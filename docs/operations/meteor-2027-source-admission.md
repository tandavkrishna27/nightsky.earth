# NASA MEO 2027 meteor source admission — 16 October 2026

## Evidence and disposition

The separately approved one-report acquisition retained `LEO_Forecast_2027.pdf` from https://ntrs.nasa.gov/api/citations/20260009360/downloads/LEO_Forecast_2027.pdf . Root performed the network request; this lane only inspected the retained bytes. HTTP 200, 164,659 bytes, SHA-256 `1d66de345feb22ce71b43498a426c6b5b6bdb1c2ca974dcb33d193fdbe1edbff`. The source is NASA Meteoroid Environment Office, *The 2027 meteor shower activity forecast for low Earth orbit*, issued October 16, 2026, prepared by Danielle Moser, Althea Moorhead and Bill Cooke.

Independent layout text extraction and a rendered visual inspection of Table 3, printed/PDF page 9, agree on **twelve** original forecast maxima. These are suitable for bounded calendar admission after root review. This source inspection alone changes no runtime catalog. No body was fetched by this lane, and no code, credentials, model or deployment action occurred.

## Exact admissible facts

| Code | Original shower name | Source maximum (UT) | Proposed ISO normalization |
|---|---|---|---|
| QUA | Quadrantids | 2027-01-04 00:48 | 2027-01-04T00:48:00Z |
| ETA | eta Aquariids | 2027-05-06 22:28 | 2027-05-06T22:28:00Z |
| ZPE | Daytime zeta Perseids | 2027-06-03 12:51 | 2027-06-03T12:51:00Z |
| ARI | Daytime Arietids | 2027-06-10 08:02 | 2027-06-10T08:02:00Z |
| SDA | Southern delta Aquariids | 2027-07-30 06:52 | 2027-07-30T06:52:00Z |
| CAP | alpha Capricornids | 2027-07-31 10:41 | 2027-07-31T10:41:00Z |
| PER | Perseids | 2027-08-13 20:20 | 2027-08-13T20:20:00Z |
| DSX | Daytime Sextantids | 2027-10-02 05:51 | 2027-10-02T05:51:00Z |
| DRA | October Draconids | 2027-10-09 08:20 | 2027-10-09T08:20:00Z |
| LEO | Leonids | 2027-11-20 04:38 | 2027-11-20T04:38:00Z |
| GEM | Geminids | 2027-12-14 19:13 | 2027-12-14T19:13:00Z |
| URS | Ursids | 2027-12-22 22:07 | 2027-12-22T22:07:00Z |

Table 3 labels the clock **UT**, to minute precision. ISO Z normalization is the project's calendar representation; it must not imply independently established subminute UTC accuracy. Names may retain established display capitalization/hyphenation with a modification notice; codes and instants must preserve this exact table. Do not copy prior-year row counts or dates.

The report's first page explicitly removes Southern mu Sagittariids (SSG) and Andromedids (AND) from its forecast list because recent detections did not support inclusion. This is not evidence that those physical showers cannot occur. It includes a Leonid enhancement associated with an old dust stream about one day after the traditional maximum. The listed 2027 LEO maximum must not become a generic annual Leonid peak. Perseid enhancement is also described, with differing model predictions. Neither narrative is a personal meteor-count forecast.

## Rights and timestamp precision

The previously retained canonical metadata https://ntrs.nasa.gov/api/citations/20260009360 records `distribution: PUBLIC`, `determinationType: GOV_PUBLIC_USE_PERMITTED`, `containsThirdPartyMaterial: false`. `belongsToUsGov` is absent; do not infer ownership or unconditional public-domain status. The inspected report text supplies no separate blanket license notice. Use the precise neutral statement: **NASA NTRS PUBLIC distribution; GOV_PUBLIC_USE_PERMITTED. Ownership not inferred.** Retain record URL as rights evidence and report URL as the source, attribution, issue vintage and modification notice.

Canonical metadata was observed at 2026-10-16 04:55:28–04:55:29 UTC, while its publication and distribution fields say 2026-10-16T05:00:00Z. Preserve both values; do not claim publication preceded that observation. The PDF itself says issued October 16, without a time. The bounded `q=2027 meteoroid` search discovered the exact record, while the known-2026 control included expected record 20250009524 plus one unrelated result. These observations demonstrate useful search discovery, not exact query semantics or comprehensive recall. They supersede earlier inconclusive `keyword=` searches for finding this source, not historical records of those searches.

## Safe integration boundary after review

If admitted, add exactly these twelve year-qualified rows, preserving all 2025/2026 bytes and their rights evidence. Expected total becomes **38** maxima: 13 + 13 + 12. The retained 19-code union remains unchanged, because LEO already has a bounded radiant model. LEO obtains timing for 2027 only; no 2025/2026 timing is supplied. The 2027 timing/radiant intersection is CAP, ETA, GEM, LEO, PER, QUA, SDA. Five 2027 peak codes still lack radiants: ARI, DRA, DSX, URS, ZPE. Existing SSG/AND historical maxima remain valid retained forecasts for their original years.

Do not import ZHR, flux/fluence profiles, Table 2 snapshot radiants, seasonal boundaries or enhancement probabilities under this maxima-only admission. There is still no complete UTC meteor activity season, full-season radiant model, personal rate or local visibility claim. Radiant validity remains its separate nominal fit domain and engineering 2018–2030 horizon. No 2028 recurrence follows.

Loader validation should enforce exact per-year cardinality and codes rather than a universal thirteen-row assumption. Calendar regression should compare every 2027 pair, source/vintage/rights, inclusive endpoints, absence of 2027 SSG/AND and absence of 2028 recurrence. Public caveats, planner/workflow coverage and source documentation need current three-year wording while preserving limited maxima-only behavior. Those are integration requirements, not tests run by this inspection.

Local derived outputs: layout extraction 15,820 bytes and page-9 PNG 114,590 bytes (130,410 total), below the 16 MiB extraction allowance. Both remain ignored under `.cache/source-admission-wave-20261016-v2/`; the original PDF is unchanged. This admission evidence closes the specific missing 2027 report/table fact, not full Task 6 or production-release acceptance.

## Reviewed integration outcome

Root independently checked the rendered table and approved only the twelve names/codes/UT-minute maxima. The runtime now loads 2025, 2026 and 2027 with exact per-year admitted code sets and cardinalities (13/13/12), unique codes, year checks and strict per-year rights statements. Original 2025/2026 data files have no diff. The new 2027 artifact retains Table 3/page 9, issue vintage, source/rights URLs and the minute-precision limitation. Event search stays partial and local visibility remains not-evaluated; SSG/AND omission is explicitly not physical absence. Unsupported-year fixtures now use 2028.

TDD evidence: before production changes, four existing peak tests passed and both new 2027 tests failed because the runtime returned no rows. A subsequent admission-validation regression failed before the validator existed; it now rejects same-count unknown-code substitutions, missing rows and wrong-year timestamps. After integration, the six focused event files completed **53 tests / 53 passed / zero failed or skipped**. `npm run check` passed all three TypeScript configurations. Root owns the final aggregate tests/build/package verification after integration; no full-suite claim is made here.

Packaging inspection: `build-plugin-package.ts` collects only the plugin manifest/assets/skills plus canonical workflow references; `build-local-plugin-package.ts` explicitly states that backend runtime and data are not bundled. Accordingly the new JSON is a backend project-root `data/events/` runtime dependency, just like the existing two catalogs; it does not belong inside the remote-endpoint plugin ZIP. Current loader reads all three files explicitly. No packaging code change or deployment was performed.
