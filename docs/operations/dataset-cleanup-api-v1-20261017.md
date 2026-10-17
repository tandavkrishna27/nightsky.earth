# API-based V1 dataset cleanup inventory

Status: **retained — automatic execution policy blocked deletion**. The root agent's native PowerShell attempt to remove the exact India PBF was rejected before execution. No file was deleted, and no alternate deletion method was attempted.

The [exact JSON manifest](dataset-cleanup-api-v1-20261017.json) lists 48 individually inspected raw source files totaling **1,863,767,351 logical bytes (1.736 GiB)**:

| Raw source | Files | Logical bytes |
|---|---:|---:|
| OSM regional PBF bodies | 8 | 1,791,200,293 |
| Natural Earth GeoJSON boundaries | 2 | 54,014,085 |
| GeoNames India supplement archive | 1 | 15,752,614 |
| ERA5 NetCDF source samples | 37 | 2,800,359 |

Every listed absolute path was resolved inside this workspace. Each file and its ancestors through the workspace had no reparse-point attribute. This is a bounded metadata inventory, not an atomic filesystem snapshot; recheck paths before any later manual cleanup. Logical byte totals do not guarantee equal physical space recovery.

## Manual cleanup scope

A later manual cleanup may remove the exact raw files in the JSON manifest. This report contains no deletion command and performs no cleanup. Offline dataset rebuilds would require reacquiring removed sources. Existing built serving artifacts are outside this raw inventory.

Preserve the required GeoNames runtime reference at `.worktrees/plugin-v1/.data/geonames/cities500.json.gz` (10,396,747 bytes), along with code, Git metadata, dependencies, virtual environments, credentials, configuration, compact evidence, fixtures, request records and validation reports.

## Synthetic outputs are separate

The lineage scale-proof `artifacts` tree and geography partition `large-contract-*` directories contain synthetic test outputs, not downloaded source datasets. They are excluded from the 48-file raw list. Historical inventories report larger allocations, but their current recursive sizes were not re-enumerated. Preserve the lineage sibling `preserved-metadata-20261017`, `evidence.json`, and compact reports. Do not remove the whole partition cache, which also contains reports, code and compact fixtures.

## Evidence and future acquisition

Historical checksum and receipt records describe prior acquisitions. After any later deletion they remain historical evidence; their hashes do not prove that the raw files are still present. Record actual cleanup separately rather than rewriting old receipts to imply current retention.

Do not automatically redownload these datasets. Continue the API/search-based V1 direction without restoring bulk offline acquisition. The JSON manifest records all candidates as `retained` until a separately confirmed cleanup occurs.
