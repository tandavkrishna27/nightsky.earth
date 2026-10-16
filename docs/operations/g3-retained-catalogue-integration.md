# G3 retained catalogue integration

16 October 2026. Offline continuation of S2-G3 in the [completion tracker](v1-completion-tracker.md). Actual retained Monaco/Faroe candidate rows now pass administrative membership against all 4,854 prepared boundaries (including the 70 unresolved identities), followed by the existing streamed catalogue bridge. This is a retained subset integration result; global source acceptance remains open.

## Actual inputs and results

The existing canonical producer output at `.data/osm/retained-geography-20261015-v3-job/normalized` supplies 84 actual OSM candidate rows: 73 Faroe-source and 11 Monaco-source lineages. Its 66,957-byte candidate stream, exclusion stream and lineage stream still match their completion pins. Source PBF hashes, native vintages and rights match the retained manifest and each candidate's lineage. [Machine-readable evidence](data-pilot-evidence/g3-retained-catalogue-20261016.json) records these checks and output pins.

Membership reuses the three pinned files from `.data/nine-global-staged-validation-20261016-v6/prepared`; no boundary ingestion or preparation was repeated. All features, unknown identities, holes and multipart geometry participate. Output country assignments are 46 FRO, 9 MCO, 1 FRA and 28 unknown. Source labels are extraction lineage, not political membership. The 28 unknown results remain unknown; no source-country override was applied. Boundary generalization and ambiguous/border membership limitations remain applicable.

All 84 candidate facts other than computed country/region membership are preserved exactly. Access remains explicitly unknown for every row. The footprint stream is empty: retained clipping metadata was a **synthetic control**, with digest `99bb34fa5a7caf06f3c6e9d16eb162ac5264c03532998dff93babbf4911fc4c5`, and cannot establish real extraction coverage. Neither points nor administrative polygons can supply the missing extraction footprint.

The existing `buildBoundaryMetadata` and `buildSourceCatalogue` APIs suffice. A concrete performance gap was found: the original membership path scanned every boundary edge for each row and exhausted the explicit 200-million comparison ceiling. A conservative per-boundary bounding box now rejects only points outside the bounds expanded by the exact classifier's `1e-10` coordinate tolerance; surviving queries use the original hole/multipart classifier. Building bounds and every query are metered. No input identity or acceptance predicate changed. Differential tests compare with the original classifier across holes, separate date-line parts, borders, tolerance offsets and unresolved identities; all 14 focused tests pass.

## Bounded run evidence

Attempts are retained separately. V1 and v2 failed harness setup before boundary processing (supervisor working-directory handling and harness import path); v3 reached actual membership and stopped at the comparison ceiling after 12.511 seconds, peak sampled RSS 942,989,312 bytes. V4 completed membership and catalogue assembly in **10.064 seconds**, peak sampled RSS **967,589,888 bytes**, peak accounted logical files **95,031,703 bytes**. The supervisor enforced the unchanged **2 GiB hard process-tree commit ceiling and 2 GiB sampled main-process RSS ceiling**, **300 seconds**, **384 MiB** accounted disk and **1 GiB** free reserve. Node heap was 1280 MiB; explicit comparison ceiling 200 million, per-partition vertices one million, aggregate two million. The final catalogue reports 11 pages and 3,688,899 output bytes. These are retained subset measurements on this machine.

Commands from the repository root:

```powershell
python .superpowers/sdd/2026-10-16-n4/g3-run-v4.py
node --import tsx --test tests/places/boundaryMetadata.test.ts
python .superpowers/sdd/2026-10-16-n4/g3-evidence.py
```

The run script uses exclusive fresh output/descriptor paths; choose a new attempt name for a repeat. Preserve the failed attempts. The evidence validator checks source PBF hashes against retained pins, all producer file pins, all prepared boundary pins, rights/lineage and unchanged candidate facts.

## Missing production inputs and acceptance

The [retained source-admission packet](global-catalogue-source-admission.md) names these eight proposed dated parent extracts. None is supplied by the Monaco/Faroe subset. Values below are the packet's retained listing metadata from 15 October, **not current verified lengths** or a new acquisition authorization.

| Required proposed basename | Retained listed bytes |
| --- | ---: |
| africa-261013.osm.pbf | 7,935,109,823 |
| antarctica-261013.osm.pbf | 33,094,189 |
| asia-261013.osm.pbf | 16,375,592,003 |
| australia-oceania-261013.osm.pbf | 1,572,907,232 |
| central-america-261013.osm.pbf | 791,628,875 |
| europe-261013.osm.pbf | 35,211,428,835 |
| north-america-261013.osm.pbf | 19,502,892,921 |
| south-america-261013.osm.pbf | 4,140,614,904 |

Each proposed source still requires admitted exact URL/HTTP identity, verified body length/hash and native header vintage, source-specific licence/attribution, checksum-pinned real clipping metadata for that edition, and bounded acquisition/build approval. The existing eight-footprint inventory leaves a known northern residual above 85.041770 degrees and uncomputed seams/islands/overlap residuals. Freeze the actual union, deterministic overlap ownership, complete-cell footprints and residual inventory before a global coverage claim. A replacement or additional source requires its own admission.

The production producer must retain exclusions/conflicts and duplicate lineage across all selected sources, preserve the reviewed named-node/complete-way policy, and emit one coherent immutable catalogue plus coverage/residual manifest. Retained regional inputs must not be added to the eight-parent edition as duplicate sources. Final derivative packaging still needs the actual durable public offer URL, active edition, reconstructable pages/index inventory, hashes/bytes, ODbL notices, modification notices, retention/refresh/rollback policy and accountable maintainer. No public offer was created by this private build.

G3 remains open for actual global inputs, footprint completeness and distribution acceptance. S3 serving/storage/refresh acceptance and S4 assembled actual-release journeys remain dependent on the intended production release. No downloads, provider/model calls, deployment or publication occurred in this lane.
