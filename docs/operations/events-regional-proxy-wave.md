# Events, regional serving and local proxy integration — 14 October 2026

User-approved parallel work advances Tasks0/6,8,3/14 on `codex/plugin-v1`, starting at `7acb97f`. Independent review cleared lane and integration code after cleanup, explicit typing and bounded-fixture corrections. No source dataset/historical retrieval, deployment, account change, submission or publication occurred.

## Delivered behavior

| Area | Implemented and verified | Limits retained |
|---|---|---|
| Planet events | Outer-planet oppositions and explicitly named inferior/superior solar alignments from pinned relative heliocentric longitude; canonical year anchors stabilize overlapping-window IDs. Five new tests, residual/reference/boundary/unsupported cases. | Engineering range1900–2100; all local visibility not-evaluated. Apparent planet-pair conjunctions/minimum separation remain unsupported. NAOJ2026 geocentric timestamps are coarse independent identity checks, not a matching-definition or all-years accuracy guarantee. Meteor seasons still lack accepted source rights/data. |
| Regional serving | SHA-pinned manifest and relative files; conservative dateline/polar radius routing; default two-region/8MiB serialized/20,000-row cache and eight active/pending serial queries; per-region vintage/source, duplicates/conflicts and integrity failures preserved. Direct MCP and planner share one provider. | Manifest max32 regions/100,000 aggregate rows; each max4MiB/10,000 rows. Serialized bytes are not RSS. Conflict checks cover selected regions only. Global coverage, relations, polygon membership, entrance/access, public ODbL distribution and exact-candidate planning remain open. |
| Proxy/admission | Default-disabled explicit narrow single-proxy trust, immediate-hop matching and malformed/extra-chain refusal. Every callback retains its HTTP request admission until actual work and transport settle, including client cancellation. | Actual proxy must overwrite forwarded client headers and isolate backend access. Fixtures use IPv4 loopback plus IPv6 matching/forwarded identities. Unknown Hetzner topology/logs/TLS are not verified. Never-settling work deliberately retains a slot; production provider deadlines remain separate. |

See [planet source/definition review](planet-events-wave.md), [regional report](regional-serving-wave.md), [proxy evidence](local-proxy-wave.md) and [approved scope](../superpowers/plans/2026-10-14-events-regional-proxy-wave.md).

## Review and test-first evidence

Planet behavior initially failed three missing-behavior assertions before implementation. Controller direct/composed regional tests failed both assertions on the old registry, then passed with shared provider wiring. Operator startup tests first exposed a missing export (setup failure), then failed two functional assertions against a no-op stub/default-off app; configuration and proxy wiring made them pass. Compiled regional rehearsal failed against the previous bundle, then passed after rebuilding. These are distinct from additional supporting integration cases added after those corrections.

Review independently checked NAOJ values/reuse credit, lane resource/geometry/security bounds, seventeen lane cases, thirteen integration cases including real ignored artifacts, retained measurements and compiled runtime. No Important/Critical findings remained. Source references do not establish every future transient/calendar or worldwide accuracy.

## Frozen local verification

- Windows Node: **469 discovered / 468 passed / one permission skip / zero failures**.
- Clean Linux Node: **469 discovered / 461 passed / eight artifact/platform skips / zero failures**.
- Python on each OS: **14 OSM / 46 ERA5 passed**, without source/account calls. Three TypeScript configurations pass, including new manifest/measurement tools.
- Eight offline review sets pass with zero external attempts. Builds, package lint, production audit and both compiled runtime modes pass. Linux production audit reports zero vulnerabilities; legacy development dependencies/build warnings are separate.
- Updated compiled rehearsal passes on Windows and nonroot network-disabled Linux: two fictional vintages, direct/planned search, Jupiter alignment, strict proxy config, corrupted-manifest startup rejection, restoration/restart and successful query; zero external attempts. Fictional artifacts do not establish source coverage.
- Actual India/Bhutan MCP/planner integration returns ten direct candidates per region, preserves two distinct vintages and exercises one-region cache with three loads/two evictions; zero external attempts. Ignored manifest SHA `c79a278ffddde390a5ce5709c9e3d9884f60be12f1c0706703837c2f681998bb` pins original1327-row India and134-row Bhutan bytes.
- Nonroot pinned container, external networking disabled, passes full12/resolver-only1 tool modes, actual Hanle resolution/lunar geometry, two retained regions and Jupiter alignment. Image manifest list `sha256:9cf96bcc482c6deb7553e0644b2f3722a6cfc0b26cce383d5523f91ef356f769`.
- Separate bundled local regional capacity harness, 2 CPU/4GiB: **60 requests / zero errors, external attempts or required-artifact failures / peak RSS498,307,072 bytes**. A separately attested rerun passed the same60 requests with peak RSS499,933,184 bytes. The actual processes asserted cgroup CPU quota200000/period100000, memory4294967296 bytes, UID1000 and only the loopback network interface; retained logs are regions-proxy-container-full.log, regions-proxy-container-resolver-only.log and regions-proxy-regional-capacity-attested.log. This combines actual GeoNames, retained regional provider and immutable2025 history; it is not selected-host capacity approval. Flat-artifact regression workload also passed60 requests with peak RSS511,107,072 bytes and fresh-process candidate/climate rollback.
- Existing100,000-row fictional indexed/full-scan probe matched24/24 on Linux. Local proxy fixtures independently bound requests/entry/listeners at2s, fixture execution5s, asynchronous tests10s; deliberate missing-entry fault exited within2.7s before restoration. The verifier process adds30s; CI job adds15min.
- Working-checkout Windows rehearsal ZIP SHA `bcf38039575e51bba8296f3601a199e8c18765c750a154a13b57e1c60b1a5dc7`. Exact Git LF checkouts on both CI platforms produced identical canonical ZIP SHA `91da3db92459858da34811fb1518c982676664cacca05f0d0ff90a2a927895b8`. The builder preserves source bytes; untouched working files still have CRLF, independently checked against LF Git blobs. Build a final package from a clean Git checkout rather than equating the working-checkout hash with canonical CI output. Example endpoint/identity/official validation gates remain.

Ignored logs/harnesses are `.superpowers/sdd/2026-10-10-nightsky-v1-execution-ready/regions-proxy-*`. New raw artifacts, credentials, ignored output and generated bundles are not committed.

## Tickets and CI

Counts remain **12 Done / 9 Partial / 6 Not started** across27 headings (groups6/10/3). Tasks6/8 progress without fabricated full seasons/global coverage; Tasks3/14 gain local proxy evidence without proving actual hosting. Exact legal publisher name and actual Hetzner plan/region/hostnames remain pending owner inputs. Historical downloads stay deferred. All six CI jobs passed for implementation revision `7e7bf4000bccd07f9894426110b8591c0f367279` ([run38526984222](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38526984222)); exact counts and canonical package hash are in ci-verification.md. Follow-up documentation CI is observed separately.
