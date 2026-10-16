# Global preparation delivery — 16 October 2026

This advances existing S2-G3/H3/E2 work after `e4e80b1`. Original ticket totals remain **12 Done / 9 Partial / 6 Not started**. No new dataset download, CDS request, credential use or deployment occurred.

## Geography: optional selective reference index

The producer now offers an explicit `selected-references` mode alongside the existing `all-nodes` default. It collects references from selected named ways in bounded SQLite scratch, stores coordinates only for those references, then emits candidates through the existing selection policy. Selected named nodes remain directly eligible. This changes preparation work, not the application's no-database serving design.

The selective mode checks that valid node IDs are nondecreasing. That permits constant-memory duplicate-coordinate checking across **all valid nodes**, including unselected nodes. Conflicting duplicates or unordered input stop the build. It does not silently fall back to a larger index. Existing arbitrary-order inputs can still use the legacy mode. Source hashes, candidate rules, exclusions, lineage, deadlines and storage limits remain enforced across all passes.

The digest-pinned assembly plan carries the optional mode. Checkpoint and completed-output resume checks bind it, and membership assembly rejects a mismatched producer mode. The candidate catalogue identity remains based on its source and selection policy; identical geographic outputs do not receive a different geographic identity merely because their build strategy changed.

See [selective geography index](selective-geography-index.md) for tests and retained-input measurements. Those measurements cannot establish the full planet's build size, elapsed time or Hetzner serving fit. Full global source acquisition remains a separate bounded decision.

## History: grouped global request preparation

[Validated legacy baseline plan](validated-legacy-baseline-plan.md) applies the existing bounded multi-year decoder shape to the frozen global request inventory. It groups only identical month/day/hour selections, preserves leap-year and retained-hour distinctions, and does not add observations. The generator is offline and has no submission path. Provider acceptance for larger grouped requests remains unproved.

The earlier 24-hour legacy sample establishes its own format/provenance acceptance. It does not validate every grouping, supply a completed 1991–2020 baseline or resolve the separate ARCO source contract. Required source cells, explicit filler cells, exact retained subtraction and full-world versus named-inventory scope remain visible in the plan.

## Events: ten annual contexts, precise gaps preserved

[Event source closure](event-source-closure.md) adds Quadrantids, Daytime Sextantids, Daytime Arietids and Alpha Capricornids. The structured calendar now has ten sourced annual contexts, separate from dated events. Daytime showers include explicit observing limitations. Source aggregation derives from returned guidance, avoiding a separate stale source inventory.

The original Sextantid study uses per-bin radiant positions and describes nonlinear behavior; it does not justify inventing one linear drift model. The remaining precise season, radiant and annual-maximum gaps remain explicitly enumerated. No approximate phrase was promoted to exact UTC coverage or local visibility.

## Measured outcomes

| Lane | Verified result | Remaining limit |
| --- | --- | --- |
| Geography | Retained inputs produced identical 84 candidates, 295 exclusions and 84 lineage rows. SQLite scratch fell from 33,828,864 to 147,456 bytes (99.56%); elapsed time increased from 47.196 to 64.599 seconds. | This small retained comparison does not establish planet-scale resource needs. |
| History | Offline grouping reduced 9,016,688 monthly requests to 373,619 parents; 26,286,148,944 scalar hours and 9,016,688 monthly partitions are unchanged. Computation took 93.223 seconds and 336,838,656 bytes peak RSS. | Current provider acceptance, latest padding reconciliation and worldwide importer binding remain open. 373,619 requests still represents a large acquisition workload. |
| Events | Ten sourced annual contexts, with daytime limitations and approximate periods explicitly marked. | Precise dated-event, radiant and remaining annual-context gaps remain open. |

## Review and verification

Independent review identified missing completed-output mode validation in geography and overlapping/invalid override risks in history grouping. Regression tests cover the corrected behavior. Integration testing also caught stale six-period wording in the event availability summary. The summary now derives its count from actual entries; 30 affected tests passed after correction. Earlier successful lane runs are historical evidence, not substitutes for the final integrated suite. No completion of the broader production-data tickets is inferred from local tests.

Final integrated verification: 910 JavaScript tests, 909 passed, one skipped, zero failures (219.916 seconds). All three TypeScript configurations passed; eight offline review cases passed; plugin packaging passed. The OSM Python lane ran 138 tests, four skipped, zero failures. Exact-commit CI must be checked after pushing; its result is reported with the delivery commit rather than inferred here.
