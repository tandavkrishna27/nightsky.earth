# OpenStreetMap candidate-place discovery

**Status:** Candidate-search interface, fixture parser and a completed tiny real 59-node pilot are implemented; see candidate-real-wave.md for exact source/region/checksum evidence. Two broader India scans stopped without a regional artifact. No broad geographic coverage is claimed. ODbL/publication review (Gate 0A) and regional scale/storage measurement (Gate 0B) remain open.

## Current behavior

- `search_observing_locations` searches only an injected, local OSM candidate index. Without an index, it returns `unavailable` and explains that the local index is not configured.
- `importOsmJson` normalizes a bounded Overpass-style JSON fixture or converted extract into a deterministic minimum-field candidate index. It is a normalization function, not yet a production bulk-import pipeline or storage/index choice.
- Supported candidate classes are parks, viewpoints, protected areas, campgrounds and beaches. Records retain OSM element type and ID in source links.
- Results include extract vintage, stated coverage and ODbL attribution. Names are normalized and control characters stripped before they reach the assistant.
- Candidate ranking uses requested category order, then distance and source completeness; without category preferences it uses distance then source completeness. It is not a darkness ranking.
- `get_location_context` links the resolved GeoNames place and states that ground-light context and access are unknown until separately validated.

## Data and legal gates

The owner must choose the sample region before an extract is obtained and measured. Gate 0A must review how the proposed indexed fields, derived database, and any public database offer or share-alike obligations apply under ODbL. No data artifact is included in this branch while those decisions remain open. Public Nominatim and Overpass endpoints are not used as production query backends.

After the region and rights decisions, measure extract size, retained candidate count, import memory/time, final index size, query latency, refresh effort, and geographic coverage. Then select the production storage/index strategy and build the corresponding repeatable import job.

## User-facing limits

An OSM feature is a discovery lead. It does not prove public access, night opening, permits, current closures, safety, low skyglow or suitability for astrophotography. Users must verify local rules with the responsible land manager. Candidate results must retain the extract vintage and show the source link.
