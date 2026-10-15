# Geography source metadata wave — 15 October 2026

**Metadata inspection only; original completion remains 0/8 and worldwide coverage is unproved.** This lane used the finite 32-request / 16 MiB allowance, with redirects disabled and no automatic retries. No PBF, GeoJSON, .poly, raster or other dataset body was fetched. No model, installation, deployment or deletion occurred.

The exact public request ledger, body hashes, selected response headers, metadata samples and complete pinned ADM0/ADM1 path manifest are in [sanitized evidence](geography-source-metadata-evidence.json). Original metadata response bodies and full ledger are retained locally in ignored `.cache/geography-metadata-20261015/`; no credentials were read. All 32 requests completed between 2026-10-15T18:05:33.456947+00:00 and 2026-10-15T18:06:42.780240+00:00. Metadata bodies total **3,891,356 bytes**; largest response **3,732,495 bytes** was the permitted Git tree. Eight failed dated clip HEADs count toward the allowance. No redirects or retries occurred. The allowance is exhausted.

## Eight dated PBFs

All eight exact URLs below returned HEAD 200. Observations are HTTP availability/length/validators, including cached proxy headers, rather than source-body integrity or replication vintage. Last-Modified is an HTTP timestamp; ETag is an opaque validator. SHA-256 values of empty HEAD bodies in the ledger identify empty observation bodies only.

| Exact URL | Content-Length | ETag | Last-Modified |
| --- | ---: | --- | --- |
| https://download.geofabrik.de/africa-261013.osm.pbf | 7935109823 | `"1d8f82abf-65dc015573fca"` | Tue, 13 Oct 2026 22:10:33 GMT |
| https://download.geofabrik.de/antarctica-261013.osm.pbf | 33094189 | `"1f8fa2d-65dbfeff53f39"` | Tue, 13 Oct 2026 22:00:06 GMT |
| https://download.geofabrik.de/asia-261013.osm.pbf | 16375592003 | `"3d00fb443-65dc026c19280"` | Tue, 13 Oct 2026 22:15:25 GMT |
| https://download.geofabrik.de/australia-oceania-261013.osm.pbf | 1572907232 | `"5dc0a8e0-65dc0327e44d6"` | Tue, 13 Oct 2026 22:18:42 GMT |
| https://download.geofabrik.de/central-america-261013.osm.pbf | 791628875 | `"2f2f4c4b-65dc00480193f"` | Tue, 13 Oct 2026 22:05:50 GMT |
| https://download.geofabrik.de/europe-261013.osm.pbf | 35211428835 | `"832c3c3e3-65dc04584b48b"` | Tue, 13 Oct 2026 22:24:01 GMT |
| https://download.geofabrik.de/north-america-261013.osm.pbf | 19502892921 | `"48a768779-65dc082b2c9a2"` | Tue, 13 Oct 2026 22:41:08 GMT |
| https://download.geofabrik.de/south-america-261013.osm.pbf | 4140614904 | `"f6ccc4f8-65dc02cee32e9"` | Tue, 13 Oct 2026 22:17:09 GMT |

Total **85,563,268,782 bytes**, matching prior directory metadata. Native PBF header timestamp, replication sequence and raw SHA-256 remain unknown. No transfer fit or global catalogue follows.

## Immutable boundary inventory

Official repository [wmgeolab/geoBoundaries](https://github.com/wmgeolab/geoBoundaries/tree/5c25134028196d43ce97b5071934fd0cfc92f09f) resolves to full commit **`5c25134028196d43ce97b5071934fd0cfc92f09f`**, committed **2026-04-15T12:17:00Z**. The complete recursive tree returned **13,856 entries**, `truncated=false`; its response body SHA-256 is `bba64df73ae3b4be09ab6a2a243eb4d85ecd019c919895554362f58be60a29e3`. Server response Last-Modified differs from commit time and is retained as an HTTP observation, not an edition date. This is a commit snapshot, not an asserted numbered release.

The selected inventory contains **429 layers: 231 ADM0 and 198 ADM1**, across the repository’s **232 ISO3 directories**. Every layer records its unsimplified GeoJSON path, metadata JSON/text paths, Git blob SHA-1/bytes and exact commit-based raw/media URLs. The manifest is complete for these paths at this commit; it is not proof of a worldwide administrative universe. **35 missing level pairs** within that repository universe are explicit, including **PRI missing both ADM0 and ADM1** and **ATA missing ADM1**. Absence does not establish that a territory has no subdivisions. Dependencies, contested boundaries, seams, islands and external territory omissions remain unresolved.

The pinned `.gitattributes` applies Git LFS to all gbOpen release paths. Tree byte sizes describe Git blobs, often LFS pointers; **they are not geometry transfer sizes**. Raw ATA metadata and citation requests returned pointers. Actual metadata-only payloads were subsequently fetched from the exact commit media URLs; both SHA-256 hashes match their LFS pointer OIDs and their byte counts match the pointers (830 and 4,316 bytes). No actual geometry LFS object OID, size, body SHA-256 or validation was inferred from Git blob SHA-1.

Source metadata inspected: ATA ADM0 identifies `ATA-ADM0-39004313`, 2020, Natural Earth, Public Domain, built Dec 12 2023. IND ADM0/ADM1 identify DataMeet India community and Election Commission of India, representative year 2011, **CC BY 2.5 IN**. The IND ADM0 file has a conflict: boundaryID says `IND-ADM0-90661403` but `boundaryType` says `ADM1`. Its one-unit count does not resolve the conflict. Source/licence strings contain malformed `https//` URLs; they are preserved verbatim. At the end of the original allocation, **426 layers’ individual source/rights metadata had not been fetched**. The separately authorized aggregate metadata supplement below subsequently retains their source declarations, while individual JSON payloads remain unfetched.

Pinned repository LICENSE and ATA citation identify geoBoundaries derivative product/code CC BY 4.0 attribution; individual source citations are additionally required. [Official API documentation](https://www.geoboundaries.org/api.html) describes gbOpen as CC BY 4.0 compliant, but sampled individual source metadata demonstrate why source-specific notices must remain separate. No blanket legal clearance is claimed.

## Extraction clips and first body decision

[Geofabrik technical documentation](https://download.geofabrik.de/technical.html) explains clip polygons and timestamped historical extracts. The eight explicitly probed `https://download.geofabrik.de/{continent}-261013.poly` HEAD URLs all returned **404**; these were guessed dated clip names, not proof that no archival clip exists. [Antarctica’s current directory](https://download.geofabrik.de/antarctica.html) lists `antarctica.poly`, **178 bytes**, modified **2026-10-14 22:00**, while the selected PBF is dated October 13. The current polygon body was not fetched and cannot be treated as edition matched.

**First needed geometry sample:** an Antarctica extraction `.poly` with provider evidence binding it to `antarctica-261013.osm.pbf`, to inspect rings/date-line handling and extraction coverage. Its exact dated URL, body size and digest are **unknown**, so a concrete dated clip sample cannot yet be admitted. The current 178-byte `.poly` is a separately identified, unmatched candidate only. Obtain explicit user permission before any such body. Even a current polygon sample would not establish historical equality. The next candidate PBF body remains exact Antarctica URL above, **33,094,189 bytes**, but its acquisition gate still requires clip identity, resource checks and separate permission.

[OSM copyright](https://www.openstreetmap.org/copyright) and [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) were inspected as official rights documents. Preserve OpenStreetMap attribution and applicable database/derivative notices and obligations; exact publisher derivative offer, retention and immutable source digests remain gates.

No sample body, geometry transformation, coverage union/residual computation, parser rehearsal or acceptance test occurred. This wave improves source identity evidence only; source-specific legal admission, actual geometry sizes/hashes, edition clips and production fit remain blockers.

## Separately authorized aggregate metadata supplement

After the original allocation stopped, review identified a single ordinary Git CSV blob in the already frozen tree: [geoBoundariesOpen-meta.csv](https://raw.githubusercontent.com/wmgeolab/geoBoundaries/5c25134028196d43ce97b5071934fd0cfc92f09f/releaseData/geoBoundariesOpen-meta.csv). A **separate exact one-GET / 1 MiB allocation** was authorized to retain source declarations without 426 individual metadata requests. Request **33** returned HTTP 200, **486,138 bytes**, with no redirect/retry/fallback. Raw body SHA-256 is `d6f81bc9d3239f63fc36a62c6e3774ae892cedd5c653b8873fe1148311929eea`. Computed Git SHA-1 over `blob 486138` + NUL + body is `44e6a8078297aa79577c8b2d98692cc82c2f397c`, exactly matching the frozen tree. Combined observations are **33 requests / 4,377,494 metadata body bytes**; this does not retroactively expand the original 32-request allowance.

The CSV has **715 rows and 28 fields**. Its 429 ADM0/ADM1 rows match all 429 tree layers exactly and uniquely **when keyed by the level embedded in boundaryID**. Country and boundaryType agree for **428 layers**. The remaining **IND ADM0 is quarantined**: its boundaryID says ADM0 while boundaryType and staticDownloadLink say ADM1, consistent with the earlier individual JSON conflict. A boundaryISO/boundaryType key alone yields 428 unique pairs, missing IND ADM0 and duplicating IND ADM1. No field was silently repaired. The evidence JSON retains every selected CSV row alongside its tree layer and flags the conflict.

This freezes a complete declared source/licence inventory for the 429 identity-keyed layers, **not legal admission or complete geometry**. The declarations include **168 ODbL 1.0**, **64 Public Domain**, **91 CC BY 4.0** across two labels, **31 CC BY 3.0 IGO**, **19 CC BY-SA 2.0**, **6 CC BY-SA 3.0**, other national/attribution licences, and one each labelled **Other - Humanitarian** and **Pixabay License for Content**. All 18 exact labels/counts and per-layer source, licenceDetail, licenceSource, boundarySourceURL, vintage and build metadata remain in the evidence. These labels require source-specific review; no uniform CC BY licence is substituted. Aggregate staticDownloadLink values use short historical refs (for example `4004e96`); they were retained as source text, not followed or adopted as the pinned download manifest.

Both metadata allowances are now exhausted and inspection stopped. No geometry or dataset body was fetched in this supplement; 0/8 completion and all edition-clip, raw-geometry, worldwide residual and resource gates remain unchanged.

## Public evidence sanitization

Credential-shaped URL query values are replaced with `REDACTED` in the public JSON projection (apiKey, api_key, access_token, token, password, secret and signature). **2 value occurrences were redacted.** Public source URL fields are therefore sanitized projections rather than verbatim original values. Original metadata CSV/JSON bodies remain only in ignored local evidence; source body hashes, Git identities, layer matching and licence declarations are unchanged.
