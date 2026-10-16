# N4 unknown regions and whole-dataset validation

16 October 2026. Continues S2-G2 in the [fixed tracker](v1-completion-tracker.md). No new downloads, provider/model requests or deployment. Original ticket counts remain **12 Done / 9 Partial / 6 Not started**.

## Delivered behavior

- An explicit `preserve-unknown` ingestion policy retains unresolved boundary geometry and provenance separately from genuine public region identities. Default rejection remains available. The 70 unresolved source identities no longer require invented country/state assignments.
- Unknown or ambiguous boundary membership suppresses the affected administrative assignment. Coordinates and other candidate facts remain usable. Coordinate-based astronomy and available weather can proceed independently of administrative identification.
- Regional inclusion requires known membership; exclusions require affirmative nonmembership. Missing membership is not evidence that a candidate is outside a region. Regional searches disclose this limitation; radius-only discovery is unchanged.
- Four assembled HTTP MCP scenarios exercise unknown-region discovery, calculations, planning, comparisons and unavailable conditions offline. Synthetic coverage in those tests does not establish real worldwide coverage.
- Geometry bounding-box pruning retains the existing intersection tolerance and topology rules, with work accounting. It avoids impossible comparisons without increasing the 100-million-work ceiling.

## Retained global diagnostic

The two pinned Natural Earth inputs total 54,014,085 bytes. Automated validation considered all features; manual testing of every place is unnecessary.

| Measurement | Result |
| --- | --- |
| Features checked / unchecked | 4,854 / 0 |
| Pass current topology validator | 4,845 |
| Rejected | 9 |
| Work / limit | 98,478,191 / 100,000,000 |
| Diagnostic / supervised elapsed | 7.028 / 7.302 seconds |
| Peak sampled main-process RSS | 1,367,801,856 bytes |
| Peak logical files in bounded run | 54,690,884 bytes |

[Diagnostic evidence](data-pilot-evidence/n4-global-geometry-diagnostic-20261016.json) and [resource evidence](data-pilot-evidence/n4-global-geometry-resources-20261016.json).

Two records fail self-intersection checks: ADM0 EGY and ADM1 BRA-1294. Seven fail the importer's supported multipart rules: ADM0 ARE (nesting), USA and CAN; ADM1 CHE-3423, USA-3563, USA-3552 and BMU-5137 (touching/overlap). Unsupported multipart geometry is not necessarily invalid GeoJSON. No geometry was repaired or admitted by this diagnostic.

Only exact consecutive duplicate positions were normalized, as explicitly permitted: 1,843,790 source positions became 1,843,738. Raw files remain unchanged. Earlier attempts are retained locally: the full ingestion attempt stopped at self-intersection; diagnostic v1/v2 exhausted the work allowance before complete multipart checking. V3 completed after reviewed pruning under the same work ceiling.

## Review and acceptance

Independent geography, runtime and final integrated reviews found no remaining material code findings after fixes. Final local verification: `npm test` passed 872 tests with one existing skip and zero failures; `npm run check` passed all three TypeScript projects; `npm run test:review-cases` passed 8/8 offline assertion sets with zero external attempts. Exact-commit CI follows the branch push.

Diagnostic completion does not admit the source, publish membership, establish extraction completeness, prove access to observing sites or demonstrate Hetzner serving capacity. Full production ingestion still needs a reviewed disposition for the nine rejected geometries. Actual catalogue coverage, historical provenance/baseline and event-source gates remain under their existing tracker rows.

Next: decide and implement safe topology handling for those nine records, then rerun full ingestion/preparation/membership with retained inputs. This is source-level work, not another sequence of manually testing cities.

