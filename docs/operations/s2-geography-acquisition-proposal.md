# S2 geography acquisition proposal

**Status: proposal only, 16 October 2026.** This advances N1 in the [completion tracker](v1-completion-tracker.md); it does not acquire data or close S2-G2. S2-G2 still requires actual body identity, reviewed mappings, topology/membership evidence and measured resources. N4 requires review and finite execution authorization. This documentation wave makes no network request, download, account/token use, installation, deployment or product/model test.

**Goal:** Acquire and inspect exactly two immutable Natural Earth v5.1.1 bodies in a future bounded run, then stop with evidence for the G2 decision.

**Architecture:** Sequential unauthenticated transfers into a fresh quarantine directory; verify exact bytes and Git identities before offline inspection. Apply the existing offline adapter only after actual provider mapping review; retain source geometry and fail conservatively.

**Tools:** Existing transfer client with explicit containment, local SHA-256/Git blob hashing, installed Node/tsx and the existing adapter. No dependency installation is included.

**Spec:** [Offline ingestion contract](natural-earth-offline-ingestion.md), [source choice](natural-earth-source-choice-20261016.md), [fixed policy](../../scripts/osm/natural-earth-policy.ts). The older [build proposal](production-geography-build-proposal.md) supplies historical resource context, not fresh capacity or authority for this run.

## Exact body manifest

Repository `nvkelso/natural-earth-vector`; edition `5.1.1`; immutable commit `9380cca83db5f9aef52d5e762765100745f84b27`.

| Level / repository path | Expected bytes | Expected Git blob SHA-1 | Measured body SHA-256 |
| --- | ---: | --- | --- |
| ADM0 `geojson/ne_10m_admin_0_countries.geojson` | 13,287,234 | `5ebc66e25fc1af01edaebe9375c546655e04cf1e` | Unknown; measure after acquisition |
| ADM1 `geojson/ne_10m_admin_1_states_provinces.geojson` | 40,726,851 | `4a8438f98ac7dfec7dc1739b1eaf91398ad33f22` | Unknown; measure after acquisition |

Exact GET URLs, in order:

1. `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/9380cca83db5f9aef52d5e762765100745f84b27/geojson/ne_10m_admin_0_countries.geojson`
2. `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/9380cca83db5f9aef52d5e762765100745f84b27/geojson/ne_10m_admin_1_states_provinces.geojson`

Total **54,014,085 bytes**. Paths, lengths, Git hashes and URLs come from the retained [GeoJSON listing](natural-earth-v5.1.1-geojson-listing.json); they are metadata claims pending body verification. Listing: 251,677 bytes, SHA-256 `85bd94a4e6cc3cd95cf9e54af5b6da1d8b9699b55ddefb229cc968d607c7af0a`. Retained [licence](natural-earth-v5.1.1-license.txt): 4,636 bytes, SHA-256 `2631b5b39b6d1acc56de75235109b5af2dbb4b0ac5a127b6f06185977247fd4b`. Its public-domain grant permits modification/commercial redistribution, with optional credit. Reuse these files without refetching licence, listings or linked assets. Recommend retaining “Made with Natural Earth” with edition/provenance and modification disclosure.

## Proposed finite allowance and containment

These are rejection ceilings, not expected throughput or proof of fit. Before execution record authorization identity, UTC start, tool versions, exact absolute paths, free disk/physical RAM/commit headroom and a ledger of every retained/partial file. Use one operator-controlled fresh run root under `C:/Users/TK/OneDrive/Desktop/Claude Data/nightsky.earth-main/.worktrees/plugin-v1/.cache/s2-geography-acquisition-20261016/`; reject if it exists. Use `raw/`, `inspection/`, `prepared/` and `evidence/` children; create no duplicate raw copy. Reject symlinks, aliases and uncontrolled concurrent writers. A collision requires a reviewed new root, not overwrite or deletion.

| Resource | Fixed proposed limit |
| --- | --- |
| Requests | At most two GET attempts total, sequential, one per exact URL; zero HEAD, retries, redirects, resumes or replacement requests |
| Transfer | 48 MiB per response; 64 MiB aggregate response body bytes including rejected/error/partial responses; stop earlier at the expected file length plus one observed excess byte |
| Time | Connect timeout 30 seconds; each GET at most 10 minutes; acquisition phase at most 20 minutes; whole supervised machine run at most 30 minutes, including hashes/inspection/preparation |
| New disk | 256 MiB total simultaneously: raw/partials at most 64 MiB, descriptor/mapping/inspection scratch at most 32 MiB, prepared output at most 128 MiB, evidence/logs at most 32 MiB |
| Memory/processes | One active job, at most two processes, 2 GiB process-tree RSS and 4 GiB commit; fresh available physical RAM and commit must each cover the relevant cap plus a 2 GiB reserve |
| Free disk reserve | At least 2 GiB outside the full 256 MiB allocation, measured before starting and monitored during execution |

The supervisor must enforce wall time, process-tree termination and written/received byte accounting independently of HTTP headers. Use bounded logs and count partial files. A finite remaining deadline must be passed to each step. Stop rather than continue inspection if the 30-minute machine budget expires. Human review has no running background job; any later machine execution needs a fresh bounded allowance.

Only HTTPS port 443 to exact host `raw.githubusercontent.com` with normal certificate-chain and hostname validation is allowed. No insecure TLS option, cookies, credentials, authorization header, proxy host substitution, alternate mirror, GitHub API fallback, branch/tag URL or shapefile route. Request identity encoding; reject content encoding other than absent/identity, non-200 status, redirect or changed effective URL. A returned Content-Length, when present, must equal the manifest; missing length still requires streamed limits and final exact length. Do not consume error text as geometry. If the installed transfer/supervisor cannot enforce these limits, stop before the first request and report the missing mechanism; this proposal does not claim such a wrapper already exists.

## Execution checkpoints for the later authorized run

- [ ] **Preflight:** Verify retained licence/listing SHA-256 and exact two listing rows against policy; record tool availability and capacity. Freeze the two-request ledger before sending anything. No account or token is needed.
- [ ] **Transfer ADM0:** Exclusively create its `.partial` path, count all bytes/time, and close it on completion. Measure length; calculate SHA-256 over exact bytes; calculate Git SHA-1 over UTF-8 `blob ` + decimal measured length + one NUL byte + exact body bytes. Compare length and Git hash with the row. SHA-256 has no pre-existing expected body value; record it as newly measured provenance, never as upstream independent proof. Record status, effective URL, UTC start/end, headers, byte count, tool exit and both hashes. Rename to the intended raw filename only after checks pass.
- [ ] **Transfer ADM1:** Only after ADM0 passes, do the identical sequence for the second and last request. Any failure stops the entire tranche; no next attempt fills the allowance. Hash both retained raw files again before inspection and bind inspection output to those measured hashes.
- [ ] **Inspect actual attributes:** Fatal UTF-8 decoding and JSON parsing; inspect FeatureCollection/features, actual property names/types, feature counts and geometry types. Inventory every proposed ID value and all missing/null/sentinel/duplicate/conflicting values. Select `idField` only from actual evidence. Produce a reviewable exhaustive provider-ID-to-RegionRef mapping with `regionId`, `name`, ISO3 `countryCode`, correct `adminLevel`, pinned revision and factual sources. No field name, ISO identity or mapping is asserted here. Do not derive ISO3 from names or sentinel values. Review disputed/de facto and overseas relationships and absent ADM1 entries against the intended release universe. If identities cannot all be mapped consistently, stop; the current adapter rejects the whole preparation rather than dropping features.
- [ ] **Review mapping:** Retain exact descriptor bytes/hash and mapping audit before preparation. Descriptor schema is `schemaVersion:1`, `profile:"natural-earth-v5.1.1"`, exactly two level 0/1 layers with local relative input path, measured `bytes`/`sha256`, fixed `gitBlobSha1`, inspected `idField` and explicit `mapping`. Descriptor at most 1 MiB; both bodies plus descriptor must fit the 64 MiB aggregate input ceiling (13,094,779 bytes headroom before descriptor, subject to its stricter 1 MiB cap). No synthetic profile or invented source revision.
- [ ] **Try actual preparation once:** Run the existing `node --import tsx scripts/osm/natural-earth-ingest.ts INPUT.json NEW_OUTPUT` on the reviewed descriptor with a fresh output path. Use CLI defaults: 100,000 vertices, 10,000,000 work ticks, 128 MiB output and 60 seconds; retain external memory/disk/deadline supervision. Do not automatically raise limits to adapter ceilings. Record exit, elapsed wall time, peak RSS/commit, disk peaks, input reread/hash duration where observable, feature/part/hole/vertex counts and adapter comparisons. A resource rejection is useful feasibility evidence and requires a new reviewed continuation, not automatic rerun.

## Actual topology and membership acceptance still required

Preparation success is not assumed. Record actual failures for invalid/unclosed/self-intersecting rings, unsplit dateline edges, polar geometry, touching/overlapping/nested multipart exteriors and islands inside another part's hole. The current conservative validator may reject this source. Preserve every source part/hole; no repair, simplification, union, partial feature drop or country reassignment is authorized. Report actual coast/island/dispute/overseas and ADM1-beta limitations even if validation passes.

A later finite membership acceptance must bind the prepared boundary hash to an independently pinned candidate stream/catalogue and report all candidates before/after plus exact residual counts. Build cases from inspected actual geometries: strict interior, border, hole, overlap, no country match, missing state, island/coast, overseas/disputed and dateline/polar cases if present. Do not claim an actual hole/overlap case without finding one; record absent case classes and use separately labelled fixtures for algorithm coverage. Verify globally unique strict-interior membership, unknown on ambiguous/border/hole/missing matches, candidate retention and state/country filter behavior without hidden deletion. This proposal authorizes no product/model tests and this documentation wave runs none. Actual acceptance execution and any required harness changes need their own reviewed finite scope after inspection.

`preparation.json` has empty extractions and intended cells; boundaries cannot establish OSM extraction completeness, candidate access or worldwide discovery coverage. S2-G3 remains separate.

## Quarantine, retention and follow-up

On timeout, request uncertainty, TLS/host/HTTP failure, changed metadata, length/Git mismatch, parse/mapping/topology failure, resource breach or input mutation: terminate the active process tree, close files, mark the run failed/quarantined, retain bounded evidence and stop all requests. Keep partials counted; no retry, fallback or silent allowance increase. A failed preparation or pending marker is never consumed. Only a successful fresh `complete.json` plus verified listed output hashes can identify a prepared result; it still is not a release admission.

Retain raw source bytes, measured manifest, retained licence/listing references, mapping/descriptor and success/failure evidence locally for the review decision within the 256 MiB allocation. Quarantine raw files separately from serving: no raw/source/evidence file or prepared result is copied to runtime/public assets by this run. No deletion occurs automatically on success or failure. After review, propose exact resolved paths and hashes for scratch/partial deletion and receive explicit cleanup authorization; preserve identity/provenance evidence. Future raw retention or serving/refresh packaging must budget all concurrent old/new files explicitly. Natural Earth is public domain, but any later OSM-derived catalogue has its own notices/database obligations.

The handoff is one bounded result packet: request ledger, actual lengths/SHA-256/Git identities, inspected property inventory, mapping decisions or blockers, actual geometry/resource findings, output manifest or failure, retained-path inventory and the proposed next finite action. Stop for review after that packet. Unknown now: body availability/identity, provider fields/IDs, correct exhaustive mapping, topology fit, actual resource fit and membership/filter acceptance. Do not mark S2-G2 complete until those gates pass; do not promote N1 proposal progress into acquired coverage or close original tickets.

## Proposal self-review

The two manifest rows match retained listing/policy; no body SHA-256 or provider mapping is invented. Attempts, time, transfer/disk/output/memory bounds and transport/stop rules are explicit. Actual topology and membership requirements remain gates; raw retention is distinct from serving. Only this document is authored by this lane; tracker, shared evidence and code remain owned by their existing lanes. Local links are checked before handoff; no external verification is claimed.
