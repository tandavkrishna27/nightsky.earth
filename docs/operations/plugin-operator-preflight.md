# Offline operator preflight

`config/plugin-operator.example.json` is a separate redacted template. It passes the strict structure schema and deliberately returns `incomplete-owner-inputs`. Unknown fields at every object level, including environment and credential fields, fail closed. Keep evidence as opaque record references; never put credentials or private identity details in this file.

Run with an explicit configuration file:

```text
node --import tsx scripts/plugin-operator-preflight.ts --config config/plugin-operator.example.json
```

Exit codes: 0 means `offline-pass`; 2 means `incomplete-owner-inputs`; 1 means invalid configuration, missing/corrupt artifact, or unsafe input. Output contains fixed finding codes only, with `hostChecksPerformed:false`, `deploymentReady:false`, and `officialAccepted:false`. Exceptions, local paths, environment values and input contents are never printed. The CLI imports safely and never reads process environment. Configuration input is bounded to 1 MiB. No network requests, DNS lookups, account access or runtime changes occur.

## Required explicit choices

Set `status` to `selected` only after entering actual decisions. Supply distinct production and staging HTTPS `/mcp` endpoints, HTTPS policy/support URLs, and an exact bare DNS host allowlist covering both service hosts. Credentials, queries, fragments, wildcards, local/example hosts and IP URLs are rejected. Choose `NODE_ENV=production`, listener HOST/PORT and mode explicitly. Runtime listener, tool mode, regional/global exclusivity and proxy validators are the actual exported server contracts. Host reachability remains untested.

Direct topology disallows trusted proxy peers. A single rewriting proxy requires narrow runtime-valid IP/CIDR peers plus header replacement and restricted backend evidence. These evidence references express an operator decision; preflight cannot prove firewall rules, TLS, DNS, forwarded-header behavior or public-route isolation.

Full mode additionally requires the confirmed MET contact in its User-Agent, GeoNames inventory and path, one pinned OSM/global selection and one pinned historical selection. Resolver-only can omit these product artifacts, but any selection explicitly present must be paired, pinned and verified. Historical release uses `NIGHTSKY_ERA5_RELEASE_MANIFEST` plus `NIGHTSKY_ERA5_RELEASE_SHA256`, mutually exclusive with `NIGHTSKY_CLIMATE_ARTIFACT` plus `NIGHTSKY_CLIMATE_SHA256`. The global and regional runtime parsers enforce their mutual exclusions. GeoNames uses independently pinned inventory rather than an invented SHA environment variable.

## Immutable inventory and resource admission

Every artifact has an opaque ID, kind, relative path, SHA256, exact byte length and version. Every release lists its complete artifact IDs. Include all referenced manifest components/shards and all rollback files explicitly as `component` entries. Paths are relative to the configuration directory and must stay inside it. Absolute paths, traversal, backslashes, alternate stream syntax, symlinks in artifact path components and nonregular files are rejected. Files are read in fixed 64 KiB chunks with an explicit per-artifact ceiling (maximum 16 GiB), checked length/hash, and before/after file metadata checks. No unbounded world dataset read or loader cache population is performed.

This is byte/inventory verification, not a semantic catalogue or historical-method acceptance check. An inventory cannot prove its own completeness: independently freeze and review the manifest dependency closure with the owning data lane, retain those provenance/coverage records, and run the owning loader validation before actual runtime acceptance. Ordinary read-only checks cannot guarantee immutability against a privileged concurrent adversary; preserve read-only immutable mounts and rerun verification at promotion.

Budget requires process count, memory ceiling, disk available evidence, current and rollback allocations, scratch, reserve, per-artifact ceiling and capacity/rollback evidence references. Preflight checks the sum of **current + rollback + scratch + reserve**, using integer arithmetic, against supplied available bytes, and verifies each release's listed bytes fit its allocation. Shared files count in both release allocations conservatively. Supplied free space is evidence input, not a reservation or fresh actual-host measurement. Process/memory values are declared limits, not a benchmark or provider entitlement. Never reuse the old 1 TiB plus reserve proposal without a measured feasible envelope.

## Promotion and rollback selection

`selectRelease(config, 'current' | 'rollback')` returns a detached copy of a structurally valid immutable source commit, built image digest, architecture, package version and artifact-ID tuple. It performs no mounting, file replacement, pointer update, image pull or process restart. Run `operatorPreflight` and inspect the selected release inventory before using this plan. Current and rollback IDs/images must differ and architecture must match. Preserve complete source/image/artifact/version tuples and all previous artifact files; changing only a manifest path is not rollback.

Owner evidence must cover identity, policy approval, retention, exact host decisions and provider budgets as redacted references. Even an offline pass closes none of the actual-host streaming/capacity/TLS/firewall checks, intended-client journeys, official review, publication or deployment authorization gates described in `v1-host-policy-handoff.md` and `local-package-readiness.md`.

Inventory admission rejects every artifact not assigned to current or rollback (ARTIFACT_UNASSIGNED), ensuring every verified retained file is charged to at least one release allocation. Release selection rejects schema errors with a fixed message and does not expose unknown property names.
