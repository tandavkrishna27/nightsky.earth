# Refresh the local GeoNames place index

The V1 resolver uses GeoNames `cities500` plus `countryInfo.txt`. The current GeoNames gazetteer readme states CC BY 4.0; product results include GeoNames attribution, the license link and index vintage. GeoNames provides the data as-is.

From the repository root:

```sh
npm run data:refresh-geonames
npm run dev
```

The refresh script downloads three official sources: `cities500.zip`, `countryInfo.txt`, and `IN.zip` for the reviewed Hanle supplement. It validates city rows and IANA zone IDs, attaches country names, stores source checksums and vintage, then atomically writes `.data/geonames/cities500.json.gz` using index format version 2. See [Hanle coverage evidence](hanle-coverage-wave.md) for the pinned record and bounded supplement-only refresh. `.data/` is Git-ignored. Run the refresh when updating the local index; restart the service afterward so it loads the new vintage.

The downloaded index is not committed or deployed automatically. A selected production host must have a reviewed way to stage and refresh this artifact, sufficient memory, a rollback path, and a documented update cadence. The current in-memory index measured about 317 MiB process RSS in the local `tsx` runtime after load, so hosting must validate capacity before remote exposure. The user-facing resolver accepts named destinations and explicit approximate-location mode only; it does not accept coordinates or promise exact timezone polygons.
