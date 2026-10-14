# Global spot acquisition proposal

**Status: PROPOSAL ONLY — NO OWNER APPROVAL, NO ACQUISITION, NO EXECUTION.**

Prepared 14 October 2026 against baseline `f6d043b`. This is the next decision following [global-candidate-feasibility.md](global-candidate-feasibility.md) and the successful [retained Bhutan experiment](retained-spot-experiment.md). Research used publication pages, tiny geographic extent metadata and HEAD requests only; no PBF body, historical archive, account or installed tool was acquired. The global/free product objective remains unchanged.

**Goal:** Measure the existing node/complete-way candidate approach on three small, contrasting regional sources, under the existing offline envelope, before making a worldwide acquisition or serving-capacity decision.

**Architecture:** Acquire exact dated current-snapshot regional PBFs once into new immutable local paths, then run sequential supervised reference builds, three-pass filters and point partitions. Record complete source identity, output equality and resource use. Keep all pilot artifacts local; publication and runtime installation require their own release decision.

**Tech stack:** Existing Python/pyosmium 4.3.1, Windows Job supervision, JSON candidate artifacts and local files; no database or new service. This document is the only change in this proposal lane.

## Selected source manifest for review

Recommend **Monaco → Faroe Islands → Fiji**, in that order. These are purposeful contrasting cases, not a statistical worldwide sample. “Dense” and “sparse” describe the geographic hypotheses to test; selected-candidate density remains unknown. The source count is three, not a requirement to acquire every country.

Each source page identifies OSM contributors and ODbL 1.0. Use the public PBF, not the login-only full-metadata/history service. Source pages: [Monaco](https://download.geofabrik.de/europe/monaco.html), [Faroe Islands](https://download.geofabrik.de/europe/faroe-islands.html), [Fiji](https://download.geofabrik.de/australia-oceania/fiji.html).

| Source and exact proposed URL | Purpose / known geometry gap | Page-listed rounded latest size | Exact dated-file HEAD bytes | HEAD Last-Modified (UTC) | Expected source vintage and license |
|---|---|---:|---:|---|---|
| Monaco — [monaco-261013.osm.pbf](https://download.geofabrik.de/europe/monaco-261013.osm.pbf) | Small dense urban/coastal extract; buffered boundary may include nearby places | 676 KB | **692,392** | 2026-10-13 23:28:39 | Latest page states **2026-10-13T20:21:31Z**; exact PBF header unverified. [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) |
| Faroe Islands — [faroe-islands-261013.osm.pbf](https://download.geofabrik.de/europe/faroe-islands-261013.osm.pbf) | Sparse settlement / high-latitude coastal-island hypothesis; coastline geometry can dominate raw nodes | 7.4 MB | **7,735,542** | 2026-10-13 23:25:45 | Fresh primary HTML states **2026-10-13T20:21:31Z**; exact PBF header unverified. [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) |
| Fiji — [fiji-261013.osm.pbf](https://download.geofabrik.de/australia-oceania/fiji-261013.osm.pbf) | Dispersed coastal islands and dateline routing/point-policy audit; dateline-crossing way means remain unresolved | 16.5 MB | **17,249,749** | 2026-10-13 22:23:34 | Latest page states **2026-10-13T20:21:31Z**; exact PBF header unverified. [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) |

All three dated HEAD requests returned HTTP 200 with Content-Length and no Content-Encoding. Exact Content-Length values are **remote metadata**, not locally downloaded/measured files. Aggregate proposed source-body allowance is **25,677,683 bytes**. Date suffix and HTTP Last-Modified do not prove the OSM snapshot vintage; the proposed worker must verify the PBF header after an approved acquisition before accepting that expected vintage. No source SHA-256 is available here because no PBF body was read.

HEAD identifiers observed 14 October 2026:

| Source | ETag | HEAD checked at UTC |
|---|---|---|
| Monaco | `"a90a8-65dc12ca110ea"` | 13:40:36.702795 |
| Faroe Islands | `"7608f6-65dc12240bee5"` | 13:41:33.310484 |
| Fiji | `"10735d5-65dc043e799ab"` | 13:40:38.301139 |

ETags are change identifiers, not cryptographic integrity proofs. Recheck exact dated metadata before any approved body request. If a dated URL disappears, redirects, or its declared bytes/ETag change, stop and revise the proposal; never silently switch to `-latest` or another date.

Fiji's small [provider clipping definition](https://download.geofabrik.de/australia-oceania/fiji.poly) explicitly has two parts meeting −180 and +180 degrees. This makes it a justified dateline audit source. It does not prove any selected candidate way actually crosses that meridian. Count such ways during processing; if none exist, preserve that finding and use clearly synthetic geometry for the policy check rather than inventing real examples.

## Inspected alternatives excluded from this pilot

| Source | Exact inspected dated URL / remote bytes | Why excluded; no fallback authority |
|---|---|---|
| Malta | [malta-261013.osm.pbf](https://download.geofabrik.de/europe/malta-261013.osm.pbf), **8,930,887** HEAD bytes; [source page](https://download.geofabrik.de/europe/malta.html) lists 8.5 MB | Useful coastal alternative, but overlaps the selected island/coastal question. Excluded to keep the first pilot to three sources. Substitution requires an owner decision and revised totals. |
| Greenland | [greenland-261013.osm.pbf](https://download.geofabrik.de/north-america/greenland-261013.osm.pbf), **26,201,710** HEAD bytes; [source page](https://download.geofabrik.de/north-america/greenland.html) lists 25.0 MB | A future large-geographic/sparse candidate, but larger than retained Bhutan with potentially substantial coastline geometry. No demonstrated 60-second/256-MiB build admission. Conditional future experiment only; excluded from request and disk totals. |

The Faroe/Greenland web-reader snapshots initially reported 12 October vintage. Fresh direct HTML reads (22,573 / 22,667 bytes, each under 64 KiB) reported 13 October vintage and the corresponding dated archive entry. This discrepancy is why the plan verifies source headers and preserves check timestamps.

Research accounting: **five explicit PBF HEAD requests**, zero PBF GET requests, plus **two direct capped HTML GETs** to refresh stale page metadata. Eight web-reader open invocations inspected the five regional pages, Fiji extent text and two already inspected page portions; their internal cache/network behavior is not counted as verified raw HTTP request traffic. No directory-wide scrape, checksum-body request, historical file or source body was fetched.

## Existing envelope and concrete admission limits

Keep **60 seconds and 256 MiB worker RSS per stage**, the additional existing **256 MiB Windows job committed-memory cap**, and **100 MiB = 104,857,600 bytes combined logical source + scratch + kept pilot files**. One worker at a time; descendants refused. Keep the existing 20-ms RSS/scratch checks, failure cleanup, job-drain and directory-sharing checks. Sampled scratch stopping can briefly overshoot; it is not a hard filesystem quota. Cleanup waits are separate bounded shutdown time, as already documented. No larger allowance is proposed.

The selected raw lengths fit inside the input allowance. Their parser/runtime/output admission is **conditional on measurement**, not guaranteed by small compressed bytes or the Bhutan result. In particular, Fiji is conditional on dateline geometry audit and Faroe on coastline/reference volume.

For this pilot only, propose the following **additional smaller file ceilings within the unchanged 100-MiB envelope**. They are stop conditions, not output-size predictions or universal product requirements:

- Per-source filtered PBF: at most **8 MiB**.
- Unfiltered reference candidate JSON: at most **4 MiB**.
- Filtered candidate JSON: at most **4 MiB**.
- All point-partition files for that source combined: at most **4 MiB**, with current individual 4-MiB/10,000-row and 32-partition limits also enforced.
- All source/run/partition reports and notices for that source combined: at most **1 MiB**.

Thus each source's kept non-raw pilot files have an upper allocation of **21 MiB**, and all raw plus kept files at those allocations would be **91,737,971 bytes**. The remaining **13,119,629 bytes** are shared staging/headroom within the same global limit, not an automatic extra allowance. Source downloads write one exclusive file directly and then rename; no second raw copy is budgeted. In-memory `flex_mem` lookup is subject to RAM limits. Count every temporary file, prior source, prior stage and report before starting the next stage; pending final reports must fit before writing. Failed evidence remains counted. No automatic deletion to manufacture space for the next source.

| Source | Proposed future network requests | Stage wall / RSS limits | Source + own kept-file ceiling | Whole-pilot source/scratch/kept ceiling | On failure |
|---|---|---|---:|---:|---|
| Monaco | **1 HEAD + at most 1 GET**; no retries/redirects | Acquisition 60 s / 256 MiB; reference 60 s / 256 MiB; filter+normalize+partition 60 s / 256 MiB | **22,712,488 bytes** | **104,857,600 bytes** shared with every retained pilot file | Stop the wave, keep isolated evidence, revise owner proposal |
| Faroe Islands | **1 HEAD + at most 1 GET**; no retries/redirects | Same three stage limits | **29,755,638 bytes** | Same shared ceiling | Same; never infer no sites from missing/failed output |
| Fiji | **1 HEAD + at most 1 GET**; no retries/redirects | Same three stage limits | **39,269,845 bytes** | Same shared ceiling | Same; unresolved crossing-way means prevent accepting those coordinates |

Maximum future source requests: **six** (three HEAD, three GET), with exactly three possible source bodies totaling the declared allowance. Actual requests can be fewer if an earlier stop occurs. Maximum active work is nine stages × 60 seconds = **540 seconds**, plus existing bounded shutdown per started stage; this is a proposed deadline envelope, not a completion estimate. The downloader's socket timeout must fit within its supervised deadline. No body request starts when preflight, file admission, fresh path, header handling or supervision is unavailable. Previously retained Bhutan evidence is not recopied into this wave or counted twice; the shared ceiling covers all newly created pilot raw/scratch/kept files, while pre-existing repository/tools/evidence require separate free-disk headroom.

## Tooling prerequisite before any GET

This is not runnable for new regions with the current command. `retained_experiment.py` hardcodes Bhutan `INPUT_BYTES`, `INPUT_HASH`, `VINTAGE` and `OUTPUT_HASH`; `offline_extract.py acquire` hardcodes the Bhutan URL. Calling either unchanged for a new source would fail identity checks or acquire the wrong source. Do not substitute constants informally and lose the retained regression.

Required future implementation after owner approval:

1. **Exact approved source manifest and generic acquisition wrapper.** Pass source ID, exact HTTPS URL, declared bytes, expected header vintage, license/source page, observed HTTP identifiers and file allowances explicitly. Restrict acquisition to those three manifest URLs; reject redirects, missing/invalid lengths, overflow, short replies and metadata changes. Stream/hash once to a new checked staging path under the supervisor. No network retries or fallback. Record retrieval time, local SHA-256, final length and expected versus actual source-header vintage.
2. **Generic identity-checked offline workers.** Consume the acquired manifest's local SHA-256/length/header vintage rather than Bhutan constants; retain the old Bhutan command/regression. Reuse the tested category filter, complete-way importer and partition mechanics where compatible. Produce a plain unfiltered reference JSON without duplicating reference partitions, then produce filtered JSON and one partition set. Require candidate-array and canonical-byte equality between reference and filtered outputs where policy is identical. Do not invent a pre-acquisition expected candidate hash.
3. **Budget/admission/report integration.** Account globally for raw, filtered, reference, candidate, partition, prior-source, failed-stage and final-report files; enforce the new smaller file ceilings and existing global envelope. Keep worker hash/header checks inside supervised time. Preserve source/vintage/geometry policy in every artifact and refuse all publication/runtime installation in this pilot.

Before body acquisition, demonstrate those changes using existing retained Bhutan and small synthetic inputs, with no extra source download. Tests must fail first for manifest URL mismatch, redirected/short/oversize body, source hash/header mismatch, aggregated scratch overflow including earlier sources and pending reports, worker assignment/termination cleanup, unequal filter output, point/partition cap breach and dateline geometry disposition. On Linux the Windows supervisor remains explicitly unsupported; portable filter/partition tests can run, but Linux execution needs a separately reviewed supervisor before use. No tool installation is requested here.

## Candidate and coverage policy to preserve

Keep existing node and complete-way selection with current park, viewpoint, protected-area, campground and beach category precedence, name fallbacks and text cleanup. Retain referenced nodes and their tags, exclude relations, and count incomplete geometry instead of averaging a valid subset. Coordinates are representative points; mean vertices remove a repeated closing vertex and do not establish an entrance, access/night permission, darkness or safety.

| Pilot measurement | Needed acceptance evidence | Remaining gap |
|---|---|---|
| Source eligibility | Exact byte/hash/header identity, source page/license and clipping definition reference | Mapping quality and source-extent gaps remain |
| Tags/names | Count named nodes/ways by category, exclusions and reference volume | Relation-only/unnamed suitable sites remain absent |
| Filter correctness | Exact reference/filtered candidate equality, omitted complete-way count, deterministic canonical output | One-region agreement cannot prove every worldwide geometry case |
| Point partitions | All identities preserved once, bounds/digests/bytes/rows, current limits | No catalog installed; global manifest/count caps remain unmeasured |
| Fiji/dateline | Count selected ways with antimeridian-spanning vertex longitudes; preserve original geometry audit | Existing arithmetic longitude mean can be wrong; choose reviewed correction or explicit exclusion before those points are accepted |
| Resource cost | Per-stage elapsed/RSS/commit outcome, maximum combined logical disk, reference node/ID counts | No production-host or worldwide throughput guarantee |

For Fiji, reference/filter equality alone is insufficient: both could reproduce the same wrong mean. If any selected way spans the dateline, retain its source identity and audit disposition, then stop candidate acceptance for that geometry until a correction or clearly labeled exclusion is reviewed. The source can still provide bounded diagnostic evidence. Do not describe synthetic antimeridian/pole points as newly acquired coverage.

ODbL distribution remains as in the feasibility packet: attribution and a durable offer of the complete exact active derivative database are public-release requirements. Internal pilot notices and private local files do not fulfill that public offer. This proposal approves no distribution, deployment, account or paid builder.

## Execution sequence for an owner-approved wave

- [ ] Owner accepts the three exact URLs, total request/body allowance, node/way/name policy, unchanged envelope and stop behavior; records approval separately from this proposal.
- [ ] Implement and review the generic manifest/acquisition/admission prerequisites; run retained/synthetic safety checks first. Preserve the existing Bhutan identity regression.
- [ ] Preflight free disk, fresh resolved wave paths, installed parser and supported Windows supervisor. Count global pilot scratch before every stage.
- [ ] Revalidate and acquire Monaco once; complete its reference/filter/partition comparison and resource report. Stop on any failure before another GET.
- [ ] Repeat for Faroe Islands, then Fiji only if earlier stages pass and the shared budget still admits the declared next source. Apply the dateline disposition independently of equality.
- [ ] Reconcile local source hashes, vintages, rows/bytes and all exclusion/resource reports. Present the bounded pilot result; keep source acquisition, geographic processing coverage, candidate completeness and serving readiness distinct.

Expected approved-wave evidence lives in a new versioned `.data/osm/global-pilot-<approved-version>/` directory containing an immutable acquisition manifest, exact raw files, per-stage reports, candidate/partition outputs and a no-runtime-installation disposition. The version name, new implementation files and public publication path are not created by this document.

## Global inventory roadmap and review

Successful pilots would inform an independently budgeted worldwide source-union build, not silently authorize it. Enumerate provider parent/child extracts and residual geographic gaps; choose a covering source set without parent-plus-child duplication; include islands, territories, offshore/polar areas and antimeridian cases. Reconcile boundary duplicates by OSM type/ID and actual snapshot/point policy. Only complete measured worldwide counts/bytes/partitions can decide whether the current 32-region/100,000-row provider fits or needs a deliberate catalog change. No country-count, raw-file-size or pilot density extrapolation is supplied.

Engineering review: the three-source manifest is a small extension of measured local mechanics; generic source admission is essential because current commands are hardcoded. Byte lengths establish possible disk admission only, not runtime/RAM success. The per-file ceilings fit the shared budget conservatively and can stop useful outputs without changing the global scope. The strongest uncertainty is sparse/coastal raw geometry versus candidate density; measuring reference volume addresses it. The strongest correctness gap is equal-but-wrong Fiji way points; its independent geometry audit addresses it. Later geometry or infrastructure expansion needs a new concrete proposal.

**Owner review decision requested by this document:** approve this exact three-source measurement wave and its prerequisite implementation, or revise the source set/budget. No approval is inferred from preparing or reading the proposal. The current state remains **NO APPROVAL / NO PBF ACQUISITION / NO EXECUTION**.

## Offline implementation disposition — 14 October 2026

The previously listed generic prerequisite is now implemented and tested in [offline-spot-runner-wave.md](offline-spot-runner-wave.md). CurrentBhutan scripts remain intact; generic modules are separate. This is code/fixture evidence only: no defaultliveopener or liveCLI, no source retrieval allowance, no actualregionalheader/hash admission or runtimecatalog promotion. Proposed request/file/budget/policy values remain unchanged; actualdata validation and explicitapproval are still required.

## Execution update — 15 October 2026

Owner approved the existing small measurement pilots. [Execution evidence](data-pilot-wave.md) records two completed ERA5 jobs and the Monaco build-time stop, after which the geographic pilot halted before Faroe/Fiji. This is the executed bounded allowance, not authorization for a global build or retries. Existing earlier proposal-only/no-approval statements are historical; new acquisition remains held beyond the consumed pilot. Cleanup was blocked by automatic approval review; files retained.
