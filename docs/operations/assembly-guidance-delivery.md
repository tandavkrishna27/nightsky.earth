# Supervised assembly, weather benchmark and calendar guidance

16 October 2026. Implementation of the accepted three-lane continuation after `8903ac6`. No dataset downloads, live provider/model calls, credentials, deployment or installation. Source-document verification for event wording only. Original ticket accounting remains **12 Done / 9 Partial / 6 Not started**; no production-data gate is closed by retained tests.

| Existing row | Delivered | Remaining acceptance |
| --- | --- | --- |
| G3 | [Supervised assembly](supervised-membership-assembly.md) connects raw producer, administrative membership and catalogue publication; pins all producer evidence and accounts explicitly enumerated retained/failure paths. Actual retained membership/catalogue measurement: 84 candidates, 4,854 boundaries, 31.573 seconds, 902,082,560 bytes sampled peak main RSS. Synthetic raw-input regression exercises all stages. | Actual global sources, extraction footprint/residual admission, continent-scale resource fit and distribution/serving acceptance. Membership retains its narrower one-million-row/128-MiB candidate ceilings. |
| H2/H3 | [Exact benchmark packet](history-benchmark-execution-packet.md) binds the existing four-cell/24-hour legacy request to paths, limits and source pins. Header/encoding checks, owned library scratch, sampled storage checks, monotonic wall bound and sanitized timing/resource receipts are implemented and offline tested. | Separate owner approval before one real job. Provider rejection/unknown asset host/provenance failure still stops. No sample or global historical baseline admitted. |
| E2 | [Approximate calendar guidance](approximate-calendar-guidance.md) exposes two licensed verbal annual periods through event search and combined planning, separately from dated events and radiant validity. | Other approximate fields need source admission; full seasons, missing maxima/radiants and broader reference validation remain open. |

## Verification and review

Independent lane reviews checked specification and code quality. Assembly findings corrected: content hashing moved into contained preparation, producer evidence pins reject path overrides and require candidates/lineage/exclusions, and preflight descriptor reads are bounded. Weather prose distinguishes inherited cookies, hard Job commit from sampled RSS/storage and post-parse header admission. Calendar review found no material issue. Final review also corrected the limits-file read bound and normalized weather source pins to committed LF bytes.

Integrated Node suite: 895 passed, one existing skip, zero failures; all TypeScript projects, eight offline MCP review cases and plugin packaging passed. Subsequent assembly review corrections passed 14 focused Node cases and type checks; the final limits-reader regression passed all five Python assembly cases. Final ERA5 suite: 142 passed. Full OSM suite in the existing project environment: 126 passed, four optional skips (130 discovered); an initial system-Python attempt lacked osmium and was rerun in that environment. Exact final checks and branch CI belong to this commit's delivery record; previous evidence is not silently reused as a new run.

No runtime plugin skill/input changes were needed; the shared event output and MCP description carry the new optional guidance. Old payloads remain accepted; clients enforcing an older strict output schema need the refreshed tool schema. Plugin package remains 1.0.13; backend changes are identified by commit.

## Concrete next action

The weather packet can now be presented for approval as one finite diagnostic: one request, four quarter-degree cells, 24 hours, at most 2 MiB raw, 128 MiB sampled output/scratch and a 30-minute whole-job deadline, with the exact further controls in its packet. It can stop without a usable result and cannot prove global acquisition feasibility.

Geography still needs its actual extraction footprint/edition decision before bulk acquisition. Its supervised local pipeline is ready for admitted inputs within the documented caps; this does not mean all global inputs fit. E2 can continue field-specific source admission without inventing exact seasons. All work stays under the existing G3/H2/H3/E2 rows, then R1 assembly, S3 production measurement and S4 assembled-product acceptance.

## CI follow-up

The first Windows ERA5 run exposed a test assertion comparing equivalent short and canonical path spellings. Runtime scratch canonicalization was correct. The test now checks resolved paths and covers actual Windows 8.3 spellings; all 143 ERA5 tests passed locally after correction. Source pins and runtime behavior are unchanged. A subsequent exact-commit CI run is required for closure.
