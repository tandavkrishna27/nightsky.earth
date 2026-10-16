# Release preparation: Tasks 9, 13 and 14

Preparation only. No server purchase, deployment, publication, policy draft or production approval is recorded here. Product remains free and backend operation remains database-free.

## Measured capacity packet

`scripts/verify-capacity.ts --offline` retains the bounded legacy benchmark, explicitly labelled `evidenceMode: retained`. It requires an explicit GeoNames path and pinned history; configured flat candidates also require their digest. Global and regional configurations now use the same artifact initialization as production and always add candidate search to the workload. Invalid paired or conflicting configurations fail before measuring.

For assembled-release measurements use `node --import tsx scripts/verify-capacity.ts --offline --release`. Supply `NIGHTSKY_GEONAMES_INDEX` and `NIGHTSKY_GEONAMES_SHA256`, `NIGHTSKY_ERA5_RELEASE_MANIFEST` and `NIGHTSKY_ERA5_RELEASE_SHA256`, and `NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST` and `NIGHTSKY_GLOBAL_CATALOGUE_SHA256`. Do not set legacy history or candidate configuration alongside these. Supply `NIGHTSKY_CAPACITY_WORKLOAD` as a JSON object with `placeQuery`, named `placeId`, `candidatePlaceId`, `month`, `expectedHistoryStatus` (`available` or `partial`), and `window` containing `startUtc`, `endUtc`, and `timeZone`. Select actual covered cases from the admitted release; windows must satisfy the astronomy contract. Release mode rejects `--expect-no-candidates`, sample-only history, unavailable history, and empty or malformed geography. A deliberately expected partial baseline is a covered-case measurement, not proof of completeness.

Run in a fresh process for each candidate and previous release. The workload remains bounded to 45 requests without geography or 60 with it: first reads, warm repeats, and three waves of concurrency four. Reports include per-tool and mixed p50/p95, statuses/errors, throughput, top-level artifact hashes and bytes verified before and after measurement, sampled peak RSS and process high-water RSS. Root manifest sizes are not exhaustive release sizes: use the existing operator closure inventory for all descendants and current/rollback/scratch/reserve totals.

`initializationToListeningMs` measures configured application initialization through loopback listener readiness, excluding process launch, module imports and input hashing. RSS sampling begins before hashing and loading; the 10 ms sampler can miss short spikes. Hashing warms the filesystem cache, so first-read measurements are not cold-disk measurements. Repeated queries observe warm behavior but do not report cache hit/eviction counts. External provider attempts fail the run. Every report retains `s3Complete: false`: neither a synthetic fixture nor success on selected cases establishes R1 admission, global coverage, full S3 evidence or host fit.

Repeat on the selected Linux target with enforced 2 CPU/4 GiB limits and the same digest-pinned artifacts. Capture container limits, CPU/memory statistics, artifact byte sizes/digests, release revision, stdout report and error exit status. The initial harness covers local read tools; staging must additionally exercise fixture weather/aurora and composed plan/compare, response streaming, admission saturation/recovery and provider deadlines. Existing `load-smoke.test.ts` proves bounded admission/recovery with fixtures; it does not prove gazetteer or historical artifact host fit.

Docker daemon inspection on 2026-10-13 found Linux mode and an existing `node:lts-trixie-slim` image. No image was pulled or installed. That paragraph records the earlier preparation snapshot; final local container and capacity evidence is now recorded below. Windows node_modules may contain platform-specific executables and must not be represented as a clean Linux dependency installation. Preparation does not establish staging or production capacity.

## Rollback rehearsal packet

Keep previous release bundle and all matching gazetteer/history/candidate files with recorded SHA-256 and configuration beside the candidate. Use separate loopback ports and independent fresh processes; no mutable shared artifact replacement. Measure both with the same offline workload. Reject a candidate on unexpected errors, unavailable required history, artifact mismatch, excessive memory against the agreed headroom, or transport failures. Stop the candidate, restart the previous bundle with its own configuration, repeat health/initialize/list/read-tool checks and the bounded measurement, and compare results with its original report. Record elapsed recovery time and release/configuration/digest identity. This is the local rehearsal procedure, not evidence that a real reverse proxy or production rollback was executed.

Staging rehearsal additionally switches the reviewed proxy back to the previous bundle, confirms permanent production URL stability, upstream budgets, TLS and log settings. Artifact rollback must restore matching schema/version; a healthy process alone does not prove historical/candidate data works. Do not delete the previous release until the owner-approved recovery retention period ends.

## Task 13 verified content checklist, pending owner inputs

Task 13's original execution-ready plan requires publisher identity and confirmed matching monitored support before drafting. The owner has confirmed `nightsky.earth2026@gmail.com` is monitored support. The owner now confirms an individual publisher based in India. Local policy/support draft routes are prepared (see policy-preparation.md); exact verified legal name, listing alignment, jurisdiction review and public URLs remain gates. No legal certification is claimed.

| Content topic | Verified implementation / remaining evidence |
| --- | --- |
| Destination and locations | Named destination input and internal exact GeoNames coordinates; coordinate-shaped user queries rejected; public OSM candidates can contain mapped coordinates. MCP resolver reads only valid finite latitude/longitude from `openai/userLocation`, rounded to two decimal places, when `useApproximateHostLocation: true` explicitly opts in. Named queries ignore this hint; absent/invalid hints request a named destination. Raw hint fields are neither returned nor retained. |
| Assistant metadata | `openai/subject` is used only for an additional bounded route-local rate counter keyed by HMAC-SHA256 with a fresh random per-route salt. Raw subject/session, organization, user-agent, locale and other fields are not copied or retained by app handlers. Hints are untrusted and confer no authentication or authorization. IP/global controls still apply. Counters default to 60 starts per 60-second fixed window and at most 10,000 keys; idle expired digest entries may remain within that bound until pruning. Confirm SDK/proxy behavior on staging. |
| Recipients | MET receives rounded destination coordinates; NOAA grid fetch does not send the selected destination. Local GeoNames, OSM and ERA5 artifact reads do not transmit user queries to those artifact publishers. Assistant platform handling needs its own disclosure and reviewed current links. |
| Persistence | MCP counters/provider caches are memory-only and no completed-trip database exists. Idle expired IP keys may remain bounded until pruning; resets are not an exact deletion SLA. Release reports/artifact files are operator evidence, not user trip history. |
| Logging | Application middleware now emits only fixed route labels, method, status and duration. Former `/api` response interception/body serialization is removed; path identifiers, queries, bodies, headers and location metadata are excluded. Focused loopback tests verify marker exclusion. Proxy/provider/SDK/host logging and actual retention remain unverified. |
| Sources and availability | Explain calculated astronomy, forecast, observation, catalog and historical data separately. Preserve GeoNames CC BY and OSM ODbL attribution/database treatment; ERA5 attribution/coverage and unsupported historical years must match installed artifact. |
| Identity and support | Monitored support email confirmed: `nightsky.earth2026@gmail.com`. Owner must provide individual/business publisher, verified listing identity, jurisdiction, rights-request contact and operational support commitment. |
| Legal/age review | Record qualified review of publisher home jurisdiction and intended high-reach audiences, including transfer/representative/13–17 age requirements described by Task 13. Country scope decisions require owner review; this checklist is not a compliance finding. |

## Remaining release gates

Exact Hetzner plan/region, recurring budget and distinct staging/production domains remain required before Task 14 hosting. Required policy inputs above remain unresolved. Task 9 real historical pilot evidence is a prerequisite to claiming the months-ahead journey; a small pilot is not global or multi-year climatology. Missing candidate/history coverage requires explicit owner scope decisions before submission.

After owner inputs, complete actual Linux resource measurement, provider-fixture plan/compare workload, staging transport/privacy/rollback evidence, spending alerts and measured recurring costs. Draft policy content only after the Task 13 identity/support gate, then reconcile it against observed staging logs before public routes. Directory requirements and jurisdiction rules must be rechecked using official primary sources when drafting/submitting; this preparation deliberately makes no current listing or legal claim.

## Local measurement finding and correction

Root's pre-fix Windows report (`three-lane-windows-capacity.json` in the execution evidence directory) measured 45 requests, zero errors/external calls and 784,736,256 bytes peak RSS. Cold p95 was 461.8 ms; warm p95 323.9 ms; concurrent p95 1,716.3 ms. These numbers describe this local workload, not the selected host.

Inspection showed the stateless MCP server recreated its local gazetteer promise on every request. Route-level lazy sharing now retains one successful gazetteer index for resolve, downstream tools and historical reader initialization. Concurrent reads coalesce; missing/rejected loads reset for subsequent recovery; explicitly injected indexes retain precedence. Focused tests cover these behaviors and cross-tool history reuse. Root's identical post-fix local workload measured 437,874,688 bytes peak RSS and concurrent p95 414.2343 ms. This is evidence for this Windows workload only, not a host-capacity approval.

Configured OSM now requires a valid source-vintage-bearing result with nonempty candidates by default. `--expect-no-candidates` explicitly permits the tested zero-candidate/not-covered scenario; it never permits unavailable/missing artifacts. Record why that coverage scenario is appropriate. Remaining harness limitations are fixture weather/aurora composition, proxy/streaming behavior, resource-constrained Linux evidence and executed rollback.

Local artifact rollback is now exercised in `tests/operations/artifact-rollback.test.ts`: immutable previous/candidate directories use the exact checked-in public three-box OSM fixture. The previous version passes real loopback MCP candidate search, the candidate with mismatched bytes fails its expected SHA-256 safely, and a fresh route restored to the original configuration returns identical candidate evidence. A separate undersized byte budget fails through runtime configuration. This establishes local artifact/configuration rollback only; service bundle, proxy and staging rollback still require their own rehearsal.

The route snapshots `NIGHTSKY_OSM_CANDIDATE_INDEX`, `NIGHTSKY_OSM_CANDIDATE_SHA256` and `NIGHTSKY_OSM_CANDIDATE_MAX_BYTES` at mounting. An explicitly provided digest is verified; no digest is inferred or silently accepted as a reviewed version. Successful immutable OSM reads are shared lazily by direct search and planner requests; concurrent reads coalesce and missing/failed reads can recover. Default loader behavior remains available when these optional settings are absent.

## Standalone plugin entry and container preparation

`server/plugin.ts` is the assistant backend entry: only `/health` and `/mcp` are mounted, with a 32 KiB JSON limit, fixed-label logging and sanitized error/404 responses. It imports no website routes, news proxy, storage, static files or Vite. Listener startup is guarded so importing its app factory does not open a port. CLI defaults bind `127.0.0.1:5000`; explicit `HOST` and integer `PORT` (1–65535) configure the listener. The existing website entry remains its separate local workstream.

`tests/operations/plugin-entry.test.ts` verifies actual loopback health/initialize/list (12 tools)/recommendations, absent `/api/news` and website routes, invalid/oversized-body safe responses, recovery and zero fixture provider calls. `scripts/verify-plugin-runtime.mjs` checks the built production plugin entry and avoids retaining or printing child stdout/stderr.

`Dockerfile.plugin` prepares a standalone production image from the exact official Node `24.21.0-trixie-slim` tag, builds only the plugin bundle, prunes development dependencies and runs as the Node user. Only reviewed public event catalogs are copied. The build context allowlist excludes `.data`, Git, environment/credential/private/raw/decoded files and logs; operator-selected gazetteer/history/candidate artifacts must be mounted separately with reviewed settings/digests. The container defaults to loopback; port metadata does not constitute deployment. The preparation lane initially supplied files only. Root integration subsequently built the image and verified its nonroot runtime as recorded below; no deployment occurred.

## Final local integration evidence — 13 October 2026

The integration owner supplied these final results after the mandatory threshold metadata and skill-reference corrections:

| Check | Result |
|---|---|
| Windows Node suite | 367 discovered; 366 pass, one platform symlink skip |
| Clean Linux Node suite | 367 discovered; 363 pass, four ignored installed-artifact skips; symlink case passes |
| Python | Six OSM and 33 ERA5 tests pass on each platform |
| TypeScript | Three configured checks pass |
| Review runner | Eight offline review sets pass; negative server probes remain distinct from host refusal |
| Actual v3 all-index capacity | 60 requests, zero errors/external calls; measured peak RSS 511,082,496 bytes |
| Docker | Exact Node 24.21.0-trixie-slim digest build and actual nonroot container health/twelve tools/no-news-path checks pass |
| Rehearsal package | Regenerated SHA-256 446433abef11b172407e32992c6341b16988a353523ad67f0f76c99c67c6a3aa |

The Dockerfile pins `sha256:173f125896c3b47ddf056734c7ea789d04595a6a08769a8f78e0df642781fb66`. Capacity is local constrained-rehearsal evidence, not selected-host approval, global data capacity or an SLA. The reviewed package still uses its reserved example endpoint and is not submission ready. Push and real GitHub CI conclusions remain pending; no public endpoint, submission or pilot result is established.

Final repeated Windows evidence from the integration owner remains 366 passes/one symlink skip out of 367, with six focused package/review checks and TypeScript passing. Footer support contact now uses the confirmed monitored mailbox instead of the old hello address. Documentation freeze precedes root staging/commit/push; no hosted or public release is claimed.
