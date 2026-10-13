# Hanle named-place coverage wave

Reviewed 2026-10-13. Hanle resolves to `place:v1:geonames:1270426` from the actual GeoNames country extract. No new database is needed.

## Source and permission

- Primary country extract: https://download.geonames.org/export/dump/IN.zip (`IN.txt`).
- Primary format and license declaration: https://download.geonames.org/export/dump/readme.txt. This explicitly licenses the gazetteer extracts under Creative Commons Attribution 4.0 and explains that country archives contain features for that country.
- License: https://creativecommons.org/licenses/by/4.0/ . Commercial use and modification are permitted with attribution. The existing GeoNames attribution and license remain present in every result.
- Reviewed download: 15,752,614 bytes, last modified `Tue, 13 Oct 2026 01:52:59 GMT`.
- Archive SHA256: `738f48ab5bc86a4325beaf013ce0a0f25119eceeeff9cd3d96f86991690df998`.
- Versioned source key: `geonames-country-IN-hanle-v1`.
- Reviewed raw row SHA256 (UTF8, without newline): `aaa42b3448db57247c8ae71d03f5e818ef285cd162f9292ee6ae21e339b73ba2`.

The exact tab-separated source record is:

```text
1270426	Hanle	Hanle	Hanle	32.78943	78.9962	P	PPL	IN		41	003	7162		0		4269	Asia/Kolkata	2024-01-07
```

The record is a populated place, not the nearby Hanle River (GeoNames 1270425). Population 0 is the source's value; it is not an assertion that the village is uninhabited. Coordinates, time zone, identity and spelling are copied from the licensed extract, not from website coordinates.

## Refresh and review boundaries

`npm run data:refresh-geonames -- --supplement-only` preserves the installed schema2 global baseline and refreshes the reviewed Hanle supplement. Ordinary `npm run data:refresh-geonames` refreshes global cities500 and includes the same reviewed supplement. The output path remains controlled by `NIGHTSKY_GEONAMES_INDEX`.

The country download aborts above 16 MiB, checking both declared length and streamed bytes. Only `IN.txt` is expanded, with a 256 MiB expanded limit. Only ID 1270426 is selected. Missing, duplicate or changed raw rows fail before replacing the artifact, requiring a new source review and explicit checksum/version update. A future archive that exceeds 16 MiB requires a separately approved streaming/filter strategy; the script does not fetch a global bulk dump.

Schema version 2 and ten-field city tuples remain unchanged. Supplemental provenance records source key, version, URL, entry, ID, reviewed-row checksum, downloaded archive checksum and last-modified date. The loader validates this metadata and checks the reviewed tuple exactly, rejecting altered coordinates and missing provenance for the supplemented vintage. Place matches and resolve-result sources identify the country extract for Hanle; global city sources retain their existing product.

## Local artifact and verification

The local ignored `.data/geonames/cities500.json.gz` was regenerated through supplement-only refresh: 236,042 records, vintage `geonames-cities500-2026-10-11+hanle-v1`, 10,396,747 compressed bytes. All 236,041 IDs from the previous global baseline remain present. Exactly one reviewed place was added.

Artifact SHA256 for this run: `7ed9817515a419c96ee2ba84b92735f77651c158d1390584fb55d5025c764a9c`. Generated timestamps and daily source checksums can change on later refresh; the reviewed row and place identity remain pinned. The archive is an operational local artifact, not a tracked deployment.

Focused tests first demonstrated missing Hanle, missing supplement behavior, missing provenance enforcement and incorrect result-source attribution. After implementation, 19 focused tests passed (existing GeoNames tests plus the coverage tests); TypeScript check passed. Root agent owns aggregate-suite integration and full checks. Installed-artifact smoke skips when the ignored data is absent; raw-row and tampering tests use controlled inputs and remain independent of the local artifact.

Coverage remains global cities500 plus this one reviewed small settlement. This does not establish comprehensive Ladakh village coverage or verify coordinates independently of GeoNames. GeoNames provides the data as-is. A changed source record is deliberately blocked pending review.
