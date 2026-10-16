# Geography acquisition readiness — 16 October 2026

**Decision: retain the acquired Natural Earth membership inputs and prepare one dated OSM planet receipt. Do not reacquire boundaries or revive the eight-extract/429-layer route.** G2 retained boundary preparation is complete; G3 global candidate production, searched coverage and release acceptance remain open. This packet uses retained evidence and a fresh read-only disk observation. It makes no network requests, downloads, jobs, code changes or deployment.

## Selected source inventory

| Source / edition | Exact size and identity | Current disposition |
| --- | --- | --- |
| Natural Earth v5.1.1 ADM0, commit `9380cca83db5f9aef52d5e762765100745f84b27`, `geojson/ne_10m_admin_0_countries.geojson` | 13,287,234 bytes; measured SHA-256 `239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255` | Acquired; 258 features |
| Same edition, `geojson/ne_10m_admin_1_states_provinces.geojson` | 40,726,851 bytes; measured SHA-256 `22d0e3ad85eb3e27f17cabf8ba2d50e554fbc27a87796ff891d958185da62fb5` | Acquired; 4,596 features |
| OpenStreetMap planet `planet-261012.osm.pbf` | HEAD length 95,380,942,829 bytes; provider MD5 `c51bb08eb9fc486d010aaa1a3424cabc`; S3 version `brLMq6.oGIcbk.3ciQgjtqIduCfYJMT1`; ETag `"37619b1886c62145e6a0a6b31109b300-5686"` | Body absent; local SHA-256 and native vintage unknown |

The [actual boundary receipt](data-pilot-evidence/2026-10-16-n4-geography-r2.json) binds both exact commit URLs and Git blob identities. [Completed geometry processing](n4-nine-geometry-resolution.md) retains all 4,854 features: 4,784 mapped and 70 explicitly unknown. Three prepared bodies total **45,254,883 bytes** and **1,843,740 normalized positions**. The successful v6 run took 38.458 seconds, peaked at 1,449,615,360 sampled RSS bytes and 158,377,673 accounted file bytes. Its 23 membership candidates are synthetic; its geometry inputs are actual. These measurements establish boundary preparation, not planet classification cost or release fit.

Natural Earth is generalized 1:10m cartography with de facto/disputed and ADM1-beta limitations. Keep the 70 unknown identities, coastal/island uncertainty and absent subdivisions visible; do not remove candidates because administrative membership is unknown. The earlier gbOpen inventory (429 layers, 232 ISO3 directories, 35 missing pairs) and eight Geofabrik extracts (historical total 85,563,268,782 bytes) remain historical alternatives. Their unresolved rights/clip associations are not prerequisites for this selected route and are not cleared by it.

## Attribution and release packaging proposal

Retain the [Natural Earth licence](natural-earth-v5.1.1-license.txt), 4,636 bytes, SHA-256 `2631b5b39b6d1acc56de75235109b5af2dbb4b0ac5a127b6f06185977247fd4b`, and measured source/normalization manifests. Its retained public-domain grant supports this use; proposed optional credit is **“Made with Natural Earth, v5.1.1.”** Describe generalized boundaries and the documented duplicate-position/tangent-hole transformations alongside the source revision.

For OSM, preserve **“© OpenStreetMap contributors”**, the [OSM copyright link](https://www.openstreetmap.org/copyright), ODbL 1.0 identification, source edition, selector policy and modification/derivation description in the catalogue distribution and accessible runtime attribution. Continue the existing derivative-database treatment. Before public release, the owner must choose the public machine-readable derivative offer URL, hosting owner, active/old edition retention and delivery method; package the offer with the exact catalogue hash and source provenance. These are concrete unresolved publication decisions, not permission to publish or a claim that an attribution string alone meets every applicable obligation. This lane reused retained rights evidence without making a new legal determination.

## Refreshed preparation capacity

Read-only `Win32_LogicalDisk` observation at **2026-10-16T16:46:34.0516856Z**: C: total **999,109,423,104 bytes**, free **289,979,691,008 bytes**. With **137,438,953,472 bytes (128 GiB)** retained free reserve, available new allocation is **152,540,737,536 bytes**. Exact raw receipt leaves **57,159,794,707 bytes** above reserve.

The existing [capacity proposal](geography-capacity-plan.md) totals **145,578,373,101 new bytes**, including the planet. Against this fresh snapshot it leaves **6,962,364,435 bytes** above reserve. This is 877,645,824 bytes less headroom than that document's snapshot. Other lanes and ordinary machine activity share the disk; this number is not a launch reservation.

| Simultaneously retained allocation | Ceiling |
| --- | ---: |
| One raw receipt or failed partial | 95,380,942,829 bytes |
| SQLite database plus journal/scratch | 24 GiB; proposed 20/4 split is advisory |
| Candidates, exclusions, lineage, staged candidates, footprints | 128 MiB each; five allocations |
| Boundary originals and staged boundaries | 64 MiB each |
| Membership output including metadata | 1 GiB |
| Catalogue sort and output | 8 GiB each |
| Descriptors/logs/failure evidence/margin | 1 GiB |
| Additional rollback edition | 4 GiB |

No deletion/reclamation or second planet copy is assumed. Existing retained files already reduce free disk; additionally enumerate them once, without parent/child overlaps, for supervisor logical accounting. The live retained-path manifest is still required. Coexisting history work must be accounted for and must not launch alongside this proposed single preparation job. Refresh disk and memory immediately before any approved execution.

## Actual bottlenecks and bounded attempt

The implemented reference-selective producer avoids the historical all-node-only design, but tiny retained savings are not a planet scaling factor. Proposed raw ceilings remain **24 GiB scratch, 385 MiB aggregate normalized output, one million candidates, ten billion nodes, 46 hours**. The node ceiling is a stop condition, not a measured planet count. A 4 MiB raw row and 100,000 references per way remain producer ceilings. Raw ordering, needed-reference cardinality, journal peaks and runtime are unmeasured.

Assembly independently pins **candidates, exclusions, lineage and footprints at 128 MiB each**. The producer's aggregate output allowance does not guarantee those individual limits. Membership also caps boundary JSON at **64 MiB**, vertices at **one million per shard/two million total**, candidates at **one million**, work at **200 million ticks**, emitted rows at **64 KiB**, output at **1 GiB**, and wall time at **30 minutes**. The actual boundary positions are already near the aggregate vertex cap; geometry construction and classification share work. A full planet may fail on exclusion/lineage bytes or work before disk fills. There is no partition merger and no automatic ceiling increase.

Publisher proposed input is **2 GiB**, output/sort **8 GiB each**, one million input rows and 10,000 metadata rows, with a **30-minute** deadline. Implemented maxima (10 GiB per byte field/ten million candidate rows) do not override assembly limits. Proposed outer containment is **4 GiB hard process-tree commit**, **two active processes**, **2 GiB sampled main-process RSS**, **1280 MiB Node heap**, and **48 hours shared supervisor time**. RSS and disk reserve are sampled; main-process RSS is not tree RSS. These are ceilings for a potentially unsuccessful run, not throughput evidence.

## Offline receipt and policy preparation follow-up

The geography readiness lane adds an [offline-default bounded receiver/preflight](planet-receipt-preflight.md) and an [operator-policy preparation report](planet-policy-preparation.md). These implement preparation tools for the proposal below; this document's original statement that its packet made no code changes describes that earlier packet. The receiver does not acquire anything by default, and this session authorizes no planet body request. An eventual explicit transfer allowance is distinct from a trusted source policy/review decision or build authorization.

The policy report derives the actual unchanged retained policy. It leaves raw SHA-256, native vintage, source/record subject digests and trusted reviews absent, reports the planet and selected Natural Earth subjects missing, and identifies the production enforcement binding still required. Generic boundary admission currently includes geoBoundaries-specific notices; those must not be fabricated for Natural Earth. The producer/assembly identity checks alone do not invoke the generic policy admission gate. A reviewed operator policy revision and an exact production invocation binding remain required before a separately approved build.

Neither preparation tool changes candidates/exclusions/lineage/footprint assembly caps (128 MiB each), acceptance totals, source selection, searched coverage, or the distinction between this preparation workstation and the 2 CPU / 4 GB serving host. See the lane handoff for actual tests and unresolved gates.

## Specific next approval and prerequisites

The [planet admission contract](planet-source-admission.md) now implements `osm-planet` and `planet-domain-v1`, superseding the older capacity document's unimplemented-domain concern. The remaining policy gate is concrete: the immutable operator-controlled inventory still contains the old boundary/extract subjects and rejects the planet with `policy-source-not-found`. Prepare a reviewed inventory/policy revision for the actual planet subject and applicable independently trusted reviews. Candidate-generated approvals or invented hashes cannot substitute. Confirm the selected Natural Earth inputs are bound through the actual production admission path as well; their successful preparation alone is not generic policy admission.

After preflight and policy preparation, the smallest body authorization to request is **one GET** to:

`https://osm-planet-eu-central-1.s3.dualstack.eu-central-1.amazonaws.com/planet/pbf/2026/planet-261012.osm.pbf`

Proposed receipt limits: **95,380,942,829 body bytes**, **24 hours total wall time**, **30-second connection timeout**, one raw/partial allocation, no redirect, retry, range, resume, alternate edition or mirror. Bind the request/response to the retained version/ETag; reject changed identity before accepting a body. The multipart ETag is not an MD5. Stream exact byte accounting, provider MD5 and local SHA-256; count any failed partial against the same raw allocation. Require an independent supervisor to enforce deadline, process termination and reserve. If the available receiver cannot enforce this packet, stop before sending the request. The 24-hour value is a proposed stop deadline, not a download estimate; it is a separate receipt phase, not extra time silently added to a build authorization.

Stop after receipt/native-header inspection and actual descriptor/review preparation. Native timestamp and local SHA-256 must come from the received bytes. Bind retained whole-world provider evidence and native observation to the descriptor; it may claim only `source-domain-only`. Complete actual-source policy/review admission after these identities exist. A subsequent **separately approved** build can use the 48-hour envelope above and must accept bounded failure under unchanged stream/work ceilings. This division avoids pretending a real descriptor/review can be finished before receipt. No additional broad design exercise is needed.

Completed scanning and independently supported footprints are still required for searched cells. A world rectangle or planet source identity supplies no searched coverage. Named complete-way policy, relation/unnamed exclusions, polar/date-line exclusions and access uncertainty remain explicit. Failed evidence stays retained and never becomes a release.

## Serving decision stays separate

Preparation belongs on this Windows machine. The **2 CPU / 4 GB Hetzner host** receives only an admitted immutable catalogue and required runtime assets after actual size/query/concurrency measurements. Do not send the 95 GB raw source or SQLite scratch there. Its free disk, current edition, rollback and co-resident history assets remain unmeasured. The 8 GiB build-output ceiling and 4 GiB proposed rollback allowance do not establish serving fit. Preserve the existing release until a measured host budget and concrete installation approval exist.

This advances the S2-G3 readiness decision; it closes no G3, R1, S3 or S4 acceptance. No application tests were run for this documentation-only packet.
