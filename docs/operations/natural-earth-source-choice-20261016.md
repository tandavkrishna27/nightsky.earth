# Natural Earth source choice — 16 October 2026

Recommend Natural Earth **v5.1.1**, commit `9380cca83db5f9aef52d5e762765100745f84b27`, as the practical default **generalized administrative membership source** for the next real-data tranche. This replaces the proposed mixed gbOpen source route explicitly; it does not silently reduce the OSM candidate universe or claim detailed cadastral containment. Keep unsupported/ambiguous membership unknown, retain every otherwise selected candidate, and report the actual administrative coverage exceptions. The six candidate categories and existing node/way selector stay as implemented. Natural Earth does not establish OSM extraction coverage or resolve dated Geofabrik clip association.

## Evidence and limits

The official website terms retained in [public-source evidence](data-pilot-evidence/2026-10-16-public-source-check.json) affirm that all website raster/vector versions are public domain, permit modification and commercial redistribution, require no permission and make credit optional. This is affirmative reuse evidence, not a missing generic approval. Retain the grant and revision provenance; optional “Made with Natural Earth” credit is useful. The pinned repository lists `LICENSE.md`, 4,636 bytes, Git blob `9dfbc3d55a4ab1dd758c253b2ee339888f632889`; its fetched terms are verified below.

Country and state pages advertise 5.1.1. The GitHub tag response identifies a direct commit at the SHA above. Newly retained root and `10m_cultural` listings provide exact component paths, lengths, Git blob SHA-1s and download URLs, overcoming malformed website download hrefs **without repairing those hrefs**. Website rounded ZIP sizes (4.7 MB countries, 14.22 MB states) are not the sizes of the repository components below.

Natural Earth is 1:10m generalized cartographic geometry. Country boundaries default to **de facto control**, with separate point-of-view variants. Countries do not necessarily split overseas map units as ISO users expect. ADM1 is explicitly **beta** and lacks Antarctica, some disputed areas, tiny island nations and principalities including Monaco, Andorra, Liechtenstein and San Marino. Therefore state filters cannot promise complete worldwide membership; missing state geometry must not exclude a candidate from coordinate-based discovery. Country ISO3 mapping, overseas identity, disputed flags, coastal/island differences and simplified-border errors must be measured from actual attributes/geometry before release. Do not manufacture ISO3 from the display name or accept provider sentinel codes as ISO3.

## Preferred exact body manifest — two GeoJSON files, proposed only

The newly retained pinned `geojson` folder listing supports these exact files:

| Path | Listed bytes | Git blob SHA-1 |
| --- | ---: | --- |
| `geojson/ne_10m_admin_0_countries.geojson` | 13,287,234 | `5ebc66e25fc1af01edaebe9375c546655e04cf1e` |
| `geojson/ne_10m_admin_1_states_provinces.geojson` | 40,726,851 | `4a8438f98ac7dfec7dc1739b1eaf91398ad33f22` |

- `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/9380cca83db5f9aef52d5e762765100745f84b27/geojson/ne_10m_admin_0_countries.geojson`
- `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/9380cca83db5f9aef52d5e762765100745f84b27/geojson/ne_10m_admin_1_states_provinces.geojson`

Prefer this direct GeoJSON route, avoiding shapefile conversion. Total **54,014,085 bytes (51.51 MiB)**. These are metadata-listed sizes/Git identities, not measured body lengths or SHA-256s. Proposed finite body allowance: **two exact GETs, 64 MiB combined, 48 MiB per response**, sequential, no redirects/retries/substitution, a fresh output root and a finite transfer deadline fixed before execution. Stop on length/Git-blob mismatch and compute measured SHA-256s. No body authority follows from metadata permission. The existing 64 MiB aggregate preparation-input ceiling leaves limited mapping/descriptor headroom; actual vertex/comparison fit remains unproved.

The pinned `LICENSE.md` body has now been inspected: **4,636 bytes**, SHA-256 `2631b5b39b6d1acc56de75235109b5af2dbb4b0ac5a127b6f06185977247fd4b`. It confirms public domain, commercial/modification/dissemination use, no permission and optional credit, with accuracy disclaimers and historical upstream releases. Retain those statements as provenance; they do not negate its express public-domain declaration or create 429 new source approvals. New evidence is retained in `metadata-07.body` and the **251,677-byte** `metadata-08.body` folder listing under the owning wave cache.

## Shapefile alternative — not additionally selected

All ten URLs below are returned `download_url` values from the pinned folder listing. Source prefix is exactly:

`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/9380cca83db5f9aef52d5e762765100745f84b27/10m_cultural/`

Append the literal filename in each row. Listed Git blob hashes are upstream metadata claims; actual SHA-256 and measured file lengths remain unknown until a separately authorized body acquisition validates them.

| Exact filename | Listed bytes | Git blob SHA-1 |
| --- | ---: | --- |
| `ne_10m_admin_0_countries.cpg` | 5 | `3ad133c048f2189041151425a73485649e6c32c0` |
| `ne_10m_admin_0_countries.dbf` | 878482 | `0d66afaf65fa81968afa449516daf2fd65cbb28a` |
| `ne_10m_admin_0_countries.prj` | 145 | `f45cbadf0074d8b7b2669559a93bc50bb95f82d4` |
| `ne_10m_admin_0_countries.shp` | 8806224 | `a10056b74ef4ba38e4af7f7f127ea8f48124b2da` |
| `ne_10m_admin_0_countries.shx` | 2164 | `9e417c2af62695b2d6a0d68cd1059135bd9e1862` |
| `ne_10m_admin_1_states_provinces.cpg` | 5 | `3ad133c048f2189041151425a73485649e6c32c0` |
| `ne_10m_admin_1_states_provinces.dbf` | 15161514 | `83821576779dd93b32ab6b56993071f3ce1ba0cb` |
| `ne_10m_admin_1_states_provinces.prj` | 145 | `f45cbadf0074d8b7b2669559a93bc50bb95f82d4` |
| `ne_10m_admin_1_states_provinces.shp` | 20998780 | `f97a631c6784f4097304a83668df51ec803b0072` |
| `ne_10m_admin_1_states_provinces.shx` | 36868 | `710af4895e4b4bef697fe7104456f002517682ee` |

Total: **45,884,332 bytes (43.76 MiB)** across ten components. This is a bounded, much smaller alternative to acquiring 429 heterogeneous layers, not evidence that normalized worldwide geometry fits existing memory/vertex budgets. Alternative envelope only if shapefiles are selected: ten exact GETs, no redirects/retries/substitutions, 64 MiB combined and 24 MiB per body, fresh output root, measured SHA-256/Git-blob verification, and stop on any metadata/length/hash discrepancy. No body authority follows from the metadata allowance. README/VERSION metadata are separate from this ten-component total.

The same listing identifies `ne_10m_admin_0_countries.README.html` (39,383 bytes), `ne_10m_admin_1_states_provinces.README.html` (44,181 bytes), and both corresponding `.VERSION.txt` files (six bytes each, common blob `ac14c3dfaa865ea332c62348d1bca867bdbbd1cf`). Root `VERSION` is also six bytes. Their bodies were not inspected by this documentation lane.

## Bounded implementation and release conditions

The preferred GeoJSON route uses the existing JSON/geometry parser and requires no conversion or new installation. Map actual provider properties to stable RegionRef/ISO3 identities with a transformation audit and preserve all parts/holes and source IDs. Only if shapefiles are selected, admit an existing reader/converter or resolve the dependency first; SHP/DBF/SHX cannot be passed directly to the existing GeoJSON preparation tool. Existing conservative geometry preparation and strict-interior membership should be tried first. Unsupported topology/dateline/polar geometry remains rejected or unknown with counted residuals; do not presume a new union/partition architecture is needed before measuring actual input fit.

The current source-admission CLI is deliberately scoped to the retained gbOpen/Geofabrik inventory and cannot admit Natural Earth. Selecting this source requires an explicit reviewed source-policy/manifest addition and enforcement in the production path; candidate-generated trust or a changed licence label is not a workaround. A concise factual public-domain profile is appropriate; repeated subjective rights approvals do not create the grant. Actual payload identity, geometry validity, mappings, residual evidence, notice provenance and output checks remain necessary.

The completed retained producer/bridge acceptance (44.917 supervised seconds; 84 candidates) and synthetic lineage capacity proof remain complete. New work is the exact Natural Earth body/format admission and actual membership/filter acceptance, alongside independently unresolved OSM effective clips and real global build sizing. Do not reopen generic producer optimization or require the 429-layer route to finish after explicitly choosing this alternative.

Evidence source: ignored `.cache/source-admission-wave-20261016-v2/metadata-01.body` (root listing), `metadata-03.body` (681,642-byte folder listing), their counted ledger, and the earlier official terms/country/state/tag responses. This lane performed no network, dataset acquisition, code change, installation or deployment.
