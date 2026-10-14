# Coverage and accuracy integration — 14 October 2026

Three parallel lanes advance original Tasks 0/6, 8 and 13/14. The existing branch is `codex/plugin-v1`; starting revision is `f7ed0d2`. Independent review cleared each lane after one event-helper correction. No historical retrieval, source artifact acquisition, deployment or publication occurred.

## Deliveries and retained gates

| Lane | Delivery | Remaining |
|---|---|---|
| Events | Adaptive lunar interval evaluation replaces ten-minute sign extrapolation. Conditional slope-envelope bounds, a one-second uncertainty floor and 4096-evaluation limit preserve broad cases and leave unresolved grazing intervals unevaluated. | The envelope uses upstream empirical extrema, not an independently proven all-years derivative bound. Solar contacts and radiant samples retain their own limits. Full meteor seasons, other calendars and additional event categories remain open. |
| Spots | Cached latitude bands preserve exact radius/ranking results. Offline composition enforces checksum, same source/vintage, identity conflicts, 32 shards/4 MiB each/100,000 aggregate rows/32 MiB output. | All shards remain resident; dense latitude bands can still scan many rows. No global coverage, disk-lazy tiles, polygon membership, relations, entrance/access or public ODbL distribution is established. Existing South India/Bhutan vintages are incompatible for this union. |
| Policy/host | Concrete configuration and policy handoff records actual proxy, listener, artifact, logging and identity inputs; stale host/source-register statements reconciled. | Exact legal publisher name, actual Hetzner values, budgets and hostnames remain unsupplied. Strict proxy trust needs topology-specific implementation/verification. Health is liveness; final public policy hosting/URLs and hosted checks remain open. |

See [event report](event-accuracy-wave.md), [spot report](spot-scaling-wave.md), [policy/host handoff](policy-host-wave.md) and [approved wave plan](../superpowers/plans/2026-10-14-coverage-accuracy-wave.md).

## Review and verification

Independent review found a nonfinite altitude could count as an observed horizon sign. The implementer reproduced mixed Infinity/finite failures, fixed finite-first sign handling and added invalid numeric-option limits. Scoped re-review cleared the finding; scientific assumptions and uncertainty remain visible. Spot and policy reviews had no Important/Critical findings. Controller integration review covers CI, source register and ticket evidence separately.

- Frozen Windows Node suite: **447 discovered / 446 passed / one permission skip / zero failures**.
- Clean Linux Node suite: **447 discovered / 440 passed / seven artifact/platform skips / zero failures**.
- Three TypeScript configurations, eight offline review sets, rehearsal package lint, website/standalone builds and both production runtime modes passed on both OS paths. Review sets made zero external attempts.
- Windows and Linux OSM **14** and ERA5 **46** Python cases passed; no account/source calls are required.
- Fixed-seed 100,000 fictional rows matched all **24** ordered full-scan reference queries on Windows and Linux. Controller Windows: merge205.3 ms/query p95 1.398 ms/peak RSS266,383,360 bytes. Linux with 2 CPU/4 GiB limits: merge171.5 ms/query p95 1.367 ms/peak RSS297,541,632 bytes. Uniform fictional points do not establish dense worst-case or global source performance. The CI matrix now executes this probe with a 512 MiB V8 heap allowance, which is not an RSS limit.
- Linux retained-artifact MCP workload: **60 requests / zero errors, external attempts or required-artifact failures / peak RSS512,454,656 bytes**. Fresh-process candidate/climate rollback accepted originals, rejected corruption and restored identical results; source bytes unchanged.
- Pinned standalone container built and ran as the nonroot `node` user in full/resolver-only modes with external networking disabled. Actual Hanle resolution passed; full mode calculated the March2026 lunar eclipse as partially visible. Image manifest list: `sha256:dd95070386a21834b982bbde33479075979cedd5fd52efc43695861ecd8ad976`.
- Linux production dependency audit: zero vulnerabilities. Legacy development dependencies and website build warnings are separate; no claim of a clean entire dependency tree.
- Rehearsal ZIP is unchanged at SHA256 `eb3cecd7b0cd48bad63830c5dce7b52e9fcce9fedf27547add183724bc245cde`; it still uses an example endpoint and is not submission-ready.

The first Linux verification harness used a default noexec tmpfs, blocking esbuild during install. Mount evidence confirmed the cause; the executable temporary workspace rerun passed. The first slim Python harness lacked libexpat required by osmium; the rerun includes the same runtime library as the existing CI job. These are harness corrections, not changes to application acceptance.

## Tickets and CI

Counts remain **12 Done / 9 Partial / 6 Not started** across27 headings; numbered groups remain6 Done/10 Partial/3 Not started. This wave advances Partial headings without replacing their source/global/owner/host requirements. Historical downloads stay deferred. All six CI jobs passed for implementation revision `da569129b6c1233f8acd5a79b7f0afa3b245b066` ([run38520264907](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38520264907)). Exact GitHub counts and expanded probe results are in [CI verification](ci-verification.md); a follow-up documentation commit is observed separately.

Ignored verification logs are under `.superpowers/sdd/2026-10-10-nightsky-v1-execution-ready/accuracy-*`; raw artifacts, operator data, generated output and credentials are not committed.
