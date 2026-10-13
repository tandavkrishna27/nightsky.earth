# Local live planning journey

This opt-in smoke script starts the production MCP route at `/mcp` on an ephemeral `127.0.0.1` port, initializes MCP, lists its tools, resolves three public demonstration places, calculates astronomy, requests real MET Norway conditions, builds observing plans, and compares them. It closes the server in `finally`, including when a request or assertion fails. It does not connect a chat host, publish a service, or run in default/offline CI.

## Run locally

Use Node 24 with installed project dependencies and the current local GeoNames data. Provide the approved identifying MET User-Agent only through the process environment or a local ignored env file. Neither `npm run dev` nor `npm start` automatically loads dotenv: their scripts invoke Node directly without dotenv or `--env-file`.

For a local ignored `.env.local` containing `MET_NORWAY_USER_AGENT`, explicitly load it:

```powershell
node --env-file=.env.local --use-env-proxy --import tsx scripts/verify-live-planning.ts --live
```

Alternatively set `$env:MET_NORWAY_USER_AGENT` in the current shell to the approved product identifier and contact, then run:

```powershell
node --use-env-proxy --import tsx scripts/verify-live-planning.ts --live
```

`--use-env-proxy` enables Node 24's support for existing proxy environment settings where required. It does not install persistent environment settings. The script requires explicit `--live` and rejects a missing contact identifier before starting the server. The production adapter validates the User-Agent format. No contact value is recorded by this script.

## Requests, freshness, and results

The script uses `mountMcpRoute` and its real production weather adapter, with a bounded fetch wrapper and shared cache. It does not inject fixture weather or planner services. It permits at most four MET source requests per invocation and one per coordinate point; redirects are rejected and no automatic retry is performed. The default three-place journey normally needs at most three source requests. Use `--sites=hanle` for one place or `--sites=kodaikanal,munnar` for a subset. A one-place run compares general stargazing and astrophotography within the same forecast window. Plan and comparison steps must reuse fresh cache entries without further requests.

Downloaded source snapshots in ignored `.data/met/` can seed the cache only if the recorded HTTP status is 200, the original `Expires` is still future, `Last-Modified` is valid, and the original SHA-256 digest matches the raw snapshot. Expired snapshots are excluded. The production adapter manages response `Expires` and `Last-Modified` thereafter. A run crossing expiry fails the cache assertions rather than silently reporting warm-cache success.

The ignored `.data/met/live-planning-<selected-sites>-report.json` records start/end times, runtime, source request count, response statuses and cache headers, MCP tool names, and actual structured tool results. It records no raw tool arguments, source request URLs, private coordinates, or User-Agent. Structured results describe the public demonstration places. Review this local report before sharing it.

The named resolver can return fuzzy alternatives for Munnar. This demonstration explicitly selects the exact `Munnar, India` match; it does not assume the first fuzzy match is correct. Kodaikanal resolves as the single `Kodaikānāl, India` match. All selections validate their expected GeoNames IDs and `Asia/Kolkata` timezone; Hanle is `1270426`, Kodaikanal `1266425`, and Munnar `1262463`. No arbitrary first match is accepted.

## Evidence from 2026-10-13

The successful run spanned `2026-10-13T08:19:39.890Z` through `2026-10-13T08:19:43.404Z` on Node `v24.14.0`. MCP exposed eleven production tools. Two MET requests returned HTTP 200, with Expires `08:49:45 GMT` and `08:50:05 GMT`; no source spike snapshots were reused because they had expired. Each weather result contained 25 samples with `partial` availability and explicit missing `precipitationProbability` and `windGust`. Astronomy, both plans, and the comparison returned schema-valid structured results. Both plans and the comparison retained MET source attribution and needed no additional source requests.

There were four source requests in the implementation session: one successful Kodaikanal request in the initial run before the Munnar ambiguity stopped the journey, followed by the successful two-request run and one successful Hanle source request. No subsequent live retry was performed.

These results demonstrate transport, composition, attribution, source gaps, and forecast cache reuse at three named places across two successful runs. They do not establish forecast accuracy, global coverage, terrain suitability, access, safety, or a working connection from ChatGPT, Claude, or Gemini.

Offline contract checks are available separately:

```powershell
npx tsx --test tests/mcp/live-planning-contract.test.ts
```

These test expiry boundaries, per-point and total request admission, and explicit selection from fuzzy place alternatives without making live requests.

## Hanle extension evidence

The Hanle-only run spanned `2026-10-13T08:31:33.371Z` through `2026-10-13T08:31:35.658Z`, using the real GeoNames place `1270426` in `Asia/Kolkata`. One MET request returned HTTP 200, Expires `09:03:04 GMT`, and Last-Modified `08:31:34 GMT`. Conditions contained 25 samples with partial availability and explicit missing precipitation probability and wind gust. Plan and comparison retained MET attribution and reused the fresh source cache. The comparison contrasted general stargazing and astrophotography at Hanle within the same window. Evidence is in ignored `.data/met/live-planning-hanle-report.json`; the original two-place report remains `.data/met/live-planning-report.json`. The default combined three-place comparison is implemented but has not been run live in this session.

```powershell
node --env-file=.env.local --use-env-proxy --import tsx scripts/verify-live-planning.ts --live --sites=hanle
```

The script now also saves the exact source response body, SHA-256, original Expires/Last-Modified, and source cache URL in ignored `.data/met/live-planning-snapshots/`. These private local snapshots are source evidence, not normalized reconstructions. Future runs reuse them only while fresh and digest-valid. The snapshot cache URLs contain server-private coordinate point keys; do not share the raw cache directory as a public report. The report itself excludes those URLs and private coordinates. One Hanle snapshot was saved by the successful run; Kodaikanal and Munnar were fetched before this persistence feature was added.

Eight offline contract checks now pass, including site flag validation and verified identity/timezone selection. TypeScript checks also pass. No combined three-site live pass is claimed.

Snapshot persistence reads decoded source bodies with a 4 MiB maximum and an 8 second deadline, and observes the adapter abort signal. Oversized or stalled bodies are cancelled. Offline tests exercise both failure cases and exact source text preservation. These safety changes were verified offline after the successful Hanle run; no further live request was made.
