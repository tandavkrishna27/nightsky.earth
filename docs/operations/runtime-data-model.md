# Runtime APIs, calculations and prepared data

Clarification agreed for discussion on 16 October 2026; this document explains the existing scope and does not authorize a scope change, data promotion or deployment.

| Capability | Runtime source | Preparation and retention |
| --- | --- | --- |
| Weather/cloud forecast and aurora outlook | Request-time external APIs with bounded short-lived caches | Source adapters/fixtures and separate live verification; forecasts are not a downloaded permanent global archive. |
| Sun/Moon/planet geometry and supported calculated events | Local calculations in the MCP backend | Calculation libraries and versioned validation references. |
| Named-place resolution | Prepared read-only gazetteer in the current design | Imported source records; not a database of users or plans. |
| Country/state matching | Prepared administrative geometry/membership artifacts if admitted | Downloaded boundaries are potential production source inputs, not merely test fixtures. Raw files stay local during preparation; only accepted runtime artifacts are selected later. |
| Observing-place candidates | Prepared read-only catalogue if admitted | Candidate source extraction, provenance and coverage preparation. These boundary downloads do not supply candidate spots or prove access. |
| Long-term cloud statistics | Prepared historical summary files if eligible and feasible | The one-point/day ERA5 sample tests provider format. It is not the 1991–2020 baseline. Building that capability needs separate actual data, quality and cost decisions. |
| Maintained meteor maxima and reference catalogues | Small versioned data files | Dated source admission and refresh; not every celestial event is supplied by an API. |

The model client calls MCP tools; the backend combines these sources. Model reasoning cannot replace absent measurements or validated location access.

**No database does not mean no stored data.** The existing plugin persistence decision allows versioned read-only data files and in-memory caches, without accounts, saved plans or personal query history. Raw preparation archives do not automatically belong on the small Hetzner serving host. Accepted finished files needed by enabled features must be available to the deployed backend; their actual sizes and resource costs remain S3 measurement work. Raw retention/deletion must preserve the necessary source identities, attribution and reproducibility.

An API-only design is a possible different architecture. Removing the prepared-data paths would require a deliberate decision about affected discovery, filtering and historical features; this clarification makes no such change.
