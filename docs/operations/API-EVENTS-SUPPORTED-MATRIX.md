# Source-qualified event support — 17 October 2026

This matrix describes implemented evidence, not an adopted launch subset or a claim of exhaustive scientific coverage. All nineteen identities remain. A **bounded fit** means a twelve-model GMN fit evaluated only within its original nominal solar-longitude domain and 2018–2030 engineering years, with annual extrapolation disclosed. It does not establish activity, full-season geometry or visibility.

| Identity | NASA forecast maximum 2026 / 2027 | Separate calendar context | Radiant evidence |
| --- | --- | --- | --- |
| QUA | yes / yes | verbal | bounded fit |
| LYR | missing / missing | verbal; civil annual | bounded fit |
| ETA | yes / yes | verbal; typical longitude interval | bounded fit |
| ZPE | yes / yes | verbal; daytime | missing |
| ARI | yes / yes | verbal; daytime | missing |
| SSG | yes / missing | none admitted | missing |
| SDA | yes / yes | verbal | bounded fit |
| CAP | yes / yes | verbal | bounded fit |
| PER | yes / yes | verbal | bounded fit |
| DSX | yes / yes | verbal; daytime | missing |
| ORI | missing / missing | verbal; civil annual; typical longitude interval | bounded fit |
| DRA | yes / yes | verbal; civil general northern visibility period | missing |
| NTA | missing / missing | verbal | bounded fit |
| STA | missing / missing | verbal | bounded fit |
| LEO | missing / yes | verbal; civil annual | bounded fit |
| AND | yes / missing | verbal, usually low activity | missing |
| GEM | yes / yes | verbal | bounded fit |
| URS | yes / yes | verbal; civil annual northern visibility period | missing |
| HYD | missing / missing | verbal | bounded fit |

Derived from the current validated offline inventory, NASA maxima, narrative guidance and [five civil rows](API-EVENTS-SOURCE-ADMISSION.md). NASA's 2025 historical maxima remain thirteen, with 2026 thirteen and 2027 twelve: **38 retained maxima**. No NASA maximum or GMN model changed in this lane. The five civil references retain separately qualified **2026** maximum wording; they supply no new UTC event and must not recur that maximum in 2027. There are still eighteen verbal rows and zero admitted complete UTC activity seasons. ETA/ORI longitude-to-date conversion and activity overlap remain unavailable.

## Required behavior versus stronger unsupported claims

The [original journey acceptance](../product-scope-v1-v3.md#journey-to-tool-data-and-acceptance-matrix) defines launch-required behavior as a useful correctly caveated result; it explicitly allows unknown/partial coverage and a suitable authoritative source link. This does not require all nineteen showers, a thirteen-row maintained selection or complete scientific seasons before **every** ordinary session. It also does not waive the meteor journey's radiant/Moon/darkness/hourly-condition comparisons where evidence exists.

- **Supported selected-session path:** retain the user's shower and window; compare returned darkness, Moon and independent forecasts, add timestamped radiant geometry where the model covers it, and preserve civil/narrative context. If a precise peak is missing, do not call the result peak-optimized. If geometry is unavailable, keep that unknown and still supply supported preparation/context.
- **Still unsupported stronger claim:** an exact best peak night for a missing year/source cell, a full activity-season recommendation across unvalidated domains, continuous meteor visibility, guaranteed meteor counts, or a claim that omitted rows imply no physical activity. Finite source search may clarify a specific field; it never silently admits a new runtime dataset/model.
- **Root integration required:** DRA/URS civil facts reach `search_sky_events`, but selected-plan dispatch/formatting needs the [coordinator-owned patch](API-EVENTS-PLANNER-INTEGRATION.md). The failed URS regression is retained in the [workflow report](API-EVENTS-WORKFLOW-READINESS.md), not counted as a pass.

The earlier [events/skills report](events-skills-wave-20261017.md) calls the nine missing maxima and full-season model gaps blockers for **full-season claims**. They are not blanket blockers for supported selected-night plans, stargazing, photography or learning. Original acceptance counts and release status are unchanged.

## Other event and workflow dispositions

| Capability | Current useful behavior | Explicit limit / next evidence |
| --- | --- | --- |
| Lunar phases, seasonal markers, eclipses | Existing pinned local calculations, eclipse circumstances and safety sources | Terrain/cloud/detectability remain separate; local/model validity does not imply universal actual visibility |
| Solar alignments / greatest elongation | Existing heliocentric alignments and geocentric Mercury/Venus elongations, engineering years 1900–2100 | Separate definitions; Venus-morning independent angle reference remains open; global instant is not a viewing duration |
| Planet-pair conjunctions | Existing 21-pair RA-of-date crossing screen, 2025–2027, and bounded local body/Sun/Moon point samples | Partial, completeness not certified; not closest approach or continuous visibility; independent-reference limits remain disclosed |
| Occultations, live comet/asteroid lookup, satellites, seeing/transparency | Explicit unsupported/conditional boundaries and appropriate source/specialist handoff | No invented event API; conditional JPL work and optional satellite feeds are not newly mandatory launch adapters |
| Ordinary stargazing, astrophotography, learning | Useful returned targets/windows/preparation survive event-source failure; concept-only teaching needs no location/date | Actual installed-host skill behavior and owner acceptance remain unverified; gear-specific settings are conversational, not a planner input/calculation |

This is a release-disposition clarification backed by current implemented evidence and tests, not a silent product-scope reduction or final acceptance of ticket 6.
