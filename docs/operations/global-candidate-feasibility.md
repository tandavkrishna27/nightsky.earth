# Global candidate feasibility and next build protocol

Research and retained-file inspection: 14 October 2026. This document develops the global candidate decision in [v1-data-coverage-decisions.md](v1-data-coverage-decisions.md). The objective remains a global, free product with local artifacts, no custom database and a small serving server. It does not establish global coverage or authorize a source download, account action, deployment, host purchase or public distribution. Only publication pages and already retained small artifacts were read; no whole-country scan was repeated.

## Recommended architecture

Use free regional OSM PBF extracts in a separately budgeted offline builder. Filter to the existing candidate categories while retaining nodes needed by selected ways; emit compact candidate records, reconcile overlapping OSM identities offline, and partition the reconciled points into immutable serving artifacts. Keep raw PBF, geometry lookup and build scratch off the serving machine. Reuse the existing hash-pinned regional provider when measured complete output fits its limits. If it does not, change the catalog/provider deliberately after measuring the output; do not truncate it or describe several unsupported manifests as an implemented global catalog.

The smallest next step is a supervised filter/build comparison on the retained Bhutan extract, followed by a local bounded partition/identity exercise on the retained Bhutan and South India candidates. These measure pipeline behavior without more acquisition. The following worldwide step requires an explicit source inventory and resource envelope, not another public Overpass sweep.

```text
reviewed source inventory + exact snapshot/hash
                    |
       one retained/acquired PBF at a time
                    |
       tag filter + referenced way nodes
                    |
    complete geometry -> named point records
                    |
    disk runs sorted by (OSM type, OSM ID)
                    |
   external merge / equal dedupe / conflict stop
                    |
  point partitions + provenance + coverage ledger
                    |
  full artifact validation -> immutable version
                    |
  small server: pinned manifest -> bounded cache
```

External sorted runs are a proposed file-based implementation, not an existing builder. They bound candidate accumulation without introducing a database. A geographic partition is a serving unit; it need not match the source extract boundary.

## Source selection and actual geographic coverage

[Geofabrik's free download server](https://download.geofabrik.de/) supplies current regional PBF extracts without payment or login. On inspection its top-level menu listed Africa 7.4 GB, Antarctica 31.6 MB, Asia 15.3 GB, Australia/Oceania 1.5 GB, Central America 754 MB, Europe 32.8 GB, North America 18.2 GB and South America 3.9 GB. These are rounded provider listings, not measured files or selected-candidate sizes. Do not sum them into a precise disk/network budget or treat the menu alone as proof of worldwide inclusion.

[Geofabrik technical details](https://download.geofabrik.de/technical.html) provide a machine-readable download inventory with parent relationships. Extract clipping uses buffered boundaries, and crossing ways can be retained complete. Country borders therefore cannot assign unique ownership. Public PBFs omit contributor user/UID/changeset fields. Diff availability is finite (100 days), so an incremental design also needs a full-rebuild recovery path.

Recommended acquisition inventory: select a covering set of regional leaves, avoid downloading both a parent and its covered children, and record deliberate residual parent coverage where leaves do not cover it. Include island/territory, polar and antimeridian cases in review. Inspect provider clipping definitions to identify geographic gaps; this is provenance work, not a requirement to implement runtime polygon matching. A list of ISO countries is insufficient for offshore or territorial coverage. Declare every residual gap until resolved. If the available regional set cannot satisfy the required geographic target, use a separately approved current planet build to close that source gap.

[The OSM planet PBF directory](https://planet.openstreetmap.org/pbf/) listed the current `planet-261005.osm.pbf` as `89G`, modified 8 October 2026. That is a rounded directory value for raw global data, not exact bytes, runtime RAM or filtered candidate output. A planet build removes extract-union uncertainty but carries a substantially larger input/scratch budget. It is a fallback source strategy, not a download approved by this document. History files are unnecessary for this candidate snapshot task.

Prefer PBF over the free shapefile package: this pipeline needs source object identities and exact tag selection. Regional partitions support global scope only after the source-union ledger is complete. Global OSM processing still cannot establish completeness of real observing locations: mapping, names and tags are uneven worldwide.

## Tag and representative-point policy

Preserve `category_for` in `scripts/osm/import_candidates.py` as the authoritative category mapping, including its precedence: park; viewpoint; protected area (`boundary=national_park`, `leisure=nature_reserve` or `protect_class` present); campground (`tourism=camp_site/caravan_site`); beach. Keep the current name fallback (`name`, then `name:en`, then `official_name`), text cleanup, six-decimal coordinates and completeness calculation. Broad `protect_class` selection may capture sites with little observing value; measure counts rather than silently narrowing it.

For the proposed offline filter, the category union is:

```text
nw/leisure=park,nature_reserve
nw/tourism=viewpoint,camp_site,caravan_site
nw/boundary=national_park
nw/protect_class
nw/natural=beach
```

These expressions are OR alternatives. Apply name eligibility in the importer; requiring only `name` upstream would discard existing name fallbacks. Preserve tags on reference nodes unless the importer can distinguish reference-only records safely. [Osmium tags-filter documentation](https://docs.osmcode.org/osmium/latest/osmium-tags-filter.html) says referenced objects are included by default, may require up to three input passes, and require in-memory ID tables. `--omit-referenced` saves those tables but drops the nodes needed by selected ways. Consequently, neither a one-pass claim nor constant-RAM claim is justified for the proposed complete-way filter.

Use node coordinates directly. For ways, initially retain the complete-vertex mean used by `scripts/osm/offline_extract.py`, excluding a repeated closing vertex and refusing incomplete geometry. Count omitted incomplete ways. Treat arithmetic longitude means across the antimeridian as a known issue requiring a reviewed correction or explicit exclusion ledger before global publication; a mean near zero for vertices near ±180 degrees is misleading. Measure polar examples too. A representative point need not lie inside a feature and is not an entrance, public-access guarantee, night-entry permission, safe location or darkness measurement.

South India uses Overpass bounding-box centers, whereas Bhutan uses mean vertices. Preserve each artifact's policy and vintage. Equal identities from differing point policies may conflict even when source objects are unchanged; reconcile policy before composition rather than picking the first copy. Source coverage and query routing bounds describe different things. A way overlapping a source boundary can have its representative point outside that boundary; assign serving ownership after normalization, not by nominal country.

Relations and full polygon geometry are not universal requirements of this plan. Their exclusion remains an explicit candidate limitation; many protected areas are mapped as relations. If the intended candidate experience requires those specific missing objects, decide a focused extension with measurements. Do not turn this feasibility task into an all-relations geometry engine.

## Measurements and estimate method

Small retained candidate artifacts were re-read on this research date; byte counts, row counts and SHA-256 matched the regional serving evidence. Build/runtime measurements below are prior retained reports, not fresh runs or target-host guarantees.

| Retained evidence | Actual values | Interpretation |
|---|---|---|
| South India four boxes | 1,327 rows: 185 nodes, 1,142 ways; 201,201 bytes; 151.621 bytes/row including document overhead | Dense boxes with a different way-point policy; not a country sample |
| Bhutan | 134 rows: 95 nodes, 39 ways; 20,933 bytes; 156.216 bytes/row including document overhead | One small extract; relation exclusion and tag/name gaps remain |
| Bhutan source/build | 23,618,779 source bytes; 46.749 seconds; peak RSS 179,777,536 bytes; zero incomplete ways | Prior build under 60 seconds/256 MiB; memory includes all-source location lookup |
| Bhutan acquisition | 3.926 seconds in retained report | Historical network measurement; cannot predict another region |
| India PBF scans | 1,709,857,118 retained source bytes; corrected scan stopped at 120.012 seconds, peak worker RSS 45,502,464 bytes | No completed checksum/selection/publication; no throughput extrapolation |
| Regional serving | 2,173-byte manifest; South India + Bhutan payload 222,134 bytes; prior peak process RSS 94,892,032 bytes | Local one-region-cache workload; not an 8 MiB process memory budget |

Source reports: `.data/osm/bhutan-offline-20261014-v1/manifest.json`, [regional-serving-wave.md](regional-serving-wave.md), [spot-expansion-wave.md](spot-expansion-wave.md), [candidate-real-wave.md](candidate-real-wave.md). Candidate hashes: South India `e542a89ac7094acbd02f18dd7ea559001e21a4778214379b08839e1e553265ef`; Bhutan `d800a935abd54b8cda8e98d02c7e2bce50c7ca6f8e469cadfc735289704f41ff`.

Worldwide candidate count, row-byte distribution, dense-region maxima, overlap volume and filtered geometry/reference volume are unknown. The two observed bytes/row ratios are useful for interpreting these files only. Multiplying either ratio by a guessed worldwide count, land-area ratio, country count or planet input size would produce an unsupported estimate.

Measure every accepted source `i`: raw bytes `P_i`, filtered bytes `F_i`, unique candidates, referenced nodes, omitted geometry, build wall/CPU time, process-tree peak RSS and peak actual scratch disk. Record storage allocation separately from logical file size where sparse indexes are used. Then report exact global deduplicated count `N`, exact serialized artifact sum `S`, manifest/ledger/notice bytes `M`, maximum partition rows/bytes and identity conflicts. Density should drive partitioning, not a fixed one-file-per-country rule.

| Budget | Calculation or measurement needed |
|---|---|
| Serving persistent disk | `S_current + S_prior + S_staging + M_all_versions + application/log allowance`; for equal full releases roughly `3S`, but measure actual versions |
| Serving memory | Measure process RSS with manifest, cached parsed rows, active load/parsing copies, per-query dedupe/results, planner/weather state and queue; add actual-host headroom |
| Offline peak disk | For sequential sources, maximum simultaneously resident raw + filtered + location index + sorted runs/merge outputs + staged artifact versions; sum actual live files by stage |
| Offline peak RAM | Maximum process-tree RSS across filtering, location lookup, external sorting/merge and validation; kernel page cache/cgroup accounting may exceed process RSS |
| Offline build time | Sum measured source stages plus identity merge, partition serialization and full validation; include input hashing and repeated PBF passes |
| Updates | Measure changed-source rebuild plus cross-boundary reconciliation, deletions, validation and retained rollback copy; full rebuild initially is simpler if measured budget permits |
| Money | Actual selected host/builder prices, measured storage and transfer × update cadence; free data provides no zero-cost infrastructure estimate |

No RAM, disk, duration, cadence or monetary estimate for a worldwide build is claimed here. Budgeting source scratch separately lets a small serving server remain viable without pretending it is also a planet builder.

## Current provider acceptance boundary

`server/places/regionalOsm.ts` currently permits at most 32 regions and 100,000 declared aggregate rows; a region is at most 10,000 rows/4 MiB and the manifest at most 256 KiB. Defaults cache two regions/20,000 rows/8 MiB serialized payload and serialize eight total active/queued queries. Wide requests may examine all intersecting regions and retain query state beyond the cache. Serialized cache bounds are not process-memory bounds. Separate composed-flat output has a 32 MiB cap; that does not bound regional disk.

Required partition count is at least `ceil(N / 10,000)` and may be higher because of bytes or geography. Current admission requires measured `N <= 100,000`, every partition within both limits and no more than 32 partitions. A catalog that exceeds any limit requires a measured serving design change; merely raising caps retains linear manifest routing and wide-query accumulation. Maintain exact distance filtering, dateline/pole routing, category/distance/completeness ordering and immutable version rollback. Empty results in gaps stay unavailable/partial, not proof no observing site exists.

## ODbL distribution recommendation

Treat the normalized candidate collection as a derivative database and publish its entire exact active version as machine-readable artifacts under ODbL 1.0, with a manifest listing every file/digest, source snapshots, transformation/geometry policy, attribution and license link. Choose this direct-copy route over asking recipients to reconstruct the database from a changing upstream extract. It also makes identity and provenance review practical.

[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) §§4.2–4.6 require notices/share-alike and an offer of the entire derivative database or its alteration material when publicly used; internet distribution of that offer is free. The license does not apply to the computer program (§2.3). Keep application-code and database notices distinct. This is an engineering distribution disposition, not a claim of legal certainty.

Put a visible OSM attribution/license and active database-version link in returned candidate provenance and the service's user-facing source information. Verify the complete offer works for intended recipients without a repository membership, payment or contradictory data-use terms. Retain applicable notices and ensure the offered digest matches served bytes. A private repository or a source-credit string alone does not establish this public offer. Public hosting/offer verification remains a release action outside this research wave.

## Bounded next executable protocol

Availability inspected in this workspace: `.data/osm/venv/Scripts/python.exe` imports pyosmium 4.3.1 and exposes `FileProcessor`. The default `C:\Python314\python.exe` has no osmium module, and `osmium` CLI was not found on PATH. Thus the retained pyosmium complete-way build is executable now; the proposed CLI tag-filter experiment first needs a separately provisioned Osmium Tool, or a reviewed equivalent using the existing parser. This document does not install tools or implement that prototype.

The immediate existing-code option is to copy only retained Bhutan `source.osm.pbf` and `acquisition.json` into a fresh local staging directory and run the existing `offline_extract.py build` mode with the retained virtual environment and exact vintage. It already supervises 60 seconds/256 MiB worker RSS and produces new candidate/selection/run reports without any network call. It does not enforce a disk/process-tree cap. For example, after that fresh directory is prepared:

```powershell
& .data/osm/venv/Scripts/python.exe scripts/osm/offline_extract.py build .data/osm/bhutan-feasibility-rebuild-NEW --vintage 2026-10-12T20:21:35Z
```

`NEW` means a new, unused version name. This command is a proposed next run, not a run performed here. Do not select `acquire` mode. Existing retained regional manifest/serving measurements already cover the small assembled dataset; repeating them alone cannot prove global capacity. Synthetic manifest-limit or boundary inputs are useful only for checking cap enforcement and routing, and add zero real geographic coverage.

1. **Retained-source preflight.** Confirm retained Bhutan input is 23,618,779 bytes and hash `6728f46b23ab722d9713af1b4a089d7c62290d9b28baa1fcb4348cd4afd1ba87`. Use a new staging directory. Capture installed Python/pyosmium/Osmium versions, source timestamp and free disk. Do not use the unverified India vintage as an exact snapshot.
2. **Supervised filter comparison.** On that retained source only, run the category filter with reference nodes; normalize using the same complete-way point policy. Initial worker envelope: 60 seconds and 256 MiB RSS per stage, preserving the previous Bhutan budget. Set a proposed combined local scratch stop of 100 MiB for this experiment; it is a stop condition, not a predicted usage. Supervise the full process tree and disk as well as time. Stop and report if any bound is exceeded; no automatic enlargement or retry. Existing supervision measures one worker and does not provide general process-tree/disk enforcement, so extend it before treating those new limits as enforced.
3. **Determinism and reference checks.** Confirm category/name semantics, counts, complete coordinates, omitted-way counts and exact normalized equality with retained Bhutan where policy is identical. Filtered reference nodes must not create extra candidates accidentally. Record filter passes, filtered bytes, lookup size, time/RSS/disk, and compare against the retained unfiltered build. Smaller filtered input is a hypothesis; count/reference output determines the benefit.
4. **Local catalog rehearsal.** Use only the retained 1,461 candidate rows to exercise point partitioning, equal duplicates/conflicts and mixed-policy handling. Produce a new version and pinned manifest with current builders. This tests mechanics, not worldwide capacity. Any constructed boundary/duplicate inputs are labeled synthetic and never counted as acquired real coverage.
5. **Worldwide inventory gate.** Prepare the exact geographic source set, snapshot policy, per-source input limits and an approved total acquisition/build budget. Start subsequent bounded acquisitions with a diverse selected subset sufficient to measure dense/sparse and boundary behavior; these pilots inform resource planning and do not close global coverage. Complete the entire reviewed inventory before claiming global processing coverage.
6. **Release admission.** Reconcile all identity conflicts and source gaps; measure `N/S/M` and partition maxima; validate every file/hash/count/path. Exercise cold, warm, boundary, pole/dateline, maximum-radius and queue-limit requests on the actual serving host, including combined planner workloads. Verify disk space for current/prior/staging and the active ODbL offer before an atomic manifest switch. Do not retimestamp older rows or replace files within a reviewed version.

Validation flow for the future build:

```text
source/header/hash mismatch --------> stop; no artifact promotion
reference/coordinate omission ------> counted coverage exclusion
identity conflict -----------------> stop; reconcile source/policy
partition or catalog cap exceeded --> stop; measured design decision
path/hash/row validation failure ---> stop; retain prior active version
all checks + host/offer accepted ---> publish new immutable version
```

## Engineering review and unresolved inputs

Scope review: existing category mapping, supervised small-source importer, regional manifest builder and provider already solve selection and bounded serving. The minimum addition is a measured offline filter/reconciliation/partition protocol; this document changes one file and adds no runtime service.

Architecture review: approve separated build/serve resources, immutable publication and file-based identity reconciliation. Code quality review: reuse category/text semantics and explicitly version geometry policy; the generic importer accepts valid subsets of way vertices and retains all candidates, whereas the Bhutan path rejects incomplete ways. Use the latter policy for this protocol rather than silently expanding the generic importer. Validation review: next-build cases above cover source integrity, reference completeness, overlap conflicts, dateline geometry and publication failure; no new tests or build scans ran in this research wave. Performance review: reference filtering and sorted runs address different memory costs; both need measurements, and the small source's 46.749-second build leaves limited margin under its prior 60-second envelope.

Adversarial assessment: the strongest objection is that regional input coverage and candidate eligibility may leave useful relation-only/unnamed sites absent even after every file is processed. Keep global geographic processing and observing-site completeness as separate claims, with omissions visible. The second objection is that a small artifact ratio can conceal a large location index or identity merge; the staged measurements and separate budgets prevent that assumption.

## GSTACK REVIEW REPORT

| Runs | Status | Findings |
|---|---|---|
| Scope, architecture, code quality, validation, performance | Research review complete | Existing provider bounded; global output unknown; offline reconciliation/partition builder proposed; no runtime change |
| Primary-source inspection | Complete | Free regional PBF route and raw planet fallback; reference-filter costs; direct ODbL version offer |
| Retained artifact inspection | Complete | Two small hashes/counts/bytes rechecked; earlier build/runtime results distinguished from new measurements |

VERDICT: Proceed with the bounded retained-source protocol; worldwide acquisition and global release need the measured inventory/budget and capacity evidence below. No global feasibility guarantee.

**UNRESOLVED DECISIONS:**
- Exact worldwide geographic source union and residual gaps; snapshot alignment and overlap-conflict policy.
- Acceptance of existing tags, name eligibility and node/complete-way representative-point limitations for the requested candidate journey; focused relation support only if needed.
- Actual offline process-tree RAM/scratch/time envelope for subsequent sources and total build; target serving host headroom and update cadence.
- Measured worldwide count/bytes/partitions and resulting provider-cap/catalog decision.
- Durable public active-version database offer and user-facing attribution before release.
