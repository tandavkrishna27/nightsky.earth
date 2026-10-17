# Hosted history aggregation and serving — 17 October 2026

This wave connects retained hosted ERA5 percent data to bounded dark-hour aggregation and an explicit offline preview provider. It makes no requests and enables no production history. The source is `open-meteo-hosted-era5-cloud-percent-v1`; method is `open-meteo-quantized-dark-cloud-v1`. Native `dark-cloud-v1` artifacts remain separate.

## Working path and limits

`aggregateHostedHistory` accepts an iterable of retained partition bytes, exact request contracts and retrieval instants. It decodes one partition at a time, checks order/overlap, point and returned-cell continuity, cumulative bytes and source hours, and uses the existing independent astronomy clock. Both the input and astronomy clock must fit the explicit hour budget. Integration ceilings are 263,088 hours, 128 MiB decoded entities and 300 seconds CPU/wall elapsed checked cooperatively between hourly computations. These ceilings do not authorize acquisition. The caller must stream input; the function cannot bound memory a caller already allocated.

Only exact requested-point/returned-grid-cell equality is admitted for this offline preview. Arbitrary point-to-nearest-cell mapping, including tie/dateline/pole behavior, remains unreviewed. No coordinates are rounded to manufacture a match. An exact-cell request supports the retained pilot without claiming arbitrary-point admission.

Local civil conversion uses the runtime ICU/tz rules, recorded in the result/cache identity. Observing dates use local noon; DST folds remain distinct UTC instants. The public bins remain **UTC hour bins**, consistent with the established schema. This corrects the method definition's earlier local-hour wording; old retained receipts remain immutable evidence of the earlier wording. No threshold rounding or filling is added. Expected hours include missing slots, while cloud frequencies use valid dark hours only.

The cache identity includes source, distinct method, returned cell, civil zone, exact period, ordered raw hashes/request URLs/retrieval dates, astronomy version and timezone runtime version. `createHostedHistoryPreviewProvider` snapshots a bounded aggregate and supports the existing MCP/planner `getClimatology(placeId, month, CalculationPlace?)` injection. It requires exact selected coordinates and display timezone. It supports API place IDs without GeoNames numeric assumptions. Selected-point `sourceRevision` remains the API selection revision; the history build digest is separately retained in the caveats.

A valid sample-only aggregate is served as explicitly partial (or not-covered when no astronomical-darkness samples exist), with actual period, source attribution, summary and UTC bins. The schema rejects hosted available results and hosted non-unavailable baseline results. Even a complete offline baseline cannot bypass the production admission gate. No aggregate fetch, rebuild, durable cache or background job runs during serving. Nothing is wired into default runtime activation.

## Retained pilot evidence

The already-consumed pilot body was read locally and re-decoded: SHA-256 `549c19aaa033b3fe20bfaa12a826f43449cd0c6b2d3a3d6a1a3da35355d97068`, retrieved `2026-10-17T08:23:40.706Z`, 4,418 bytes, exact cell 28.5/77.25. For observing nights 1991-01-01 through 1991-01-10 in Asia/Kolkata, the independent padded clock is 336 UTC hours. Aggregation produced 110 expected and 110 valid dark hourly samples in one represented year. Inclusive ≤10/25/50% cloud counts were 64/74/83; mean modeled cloud fraction was 0.2675454545454546. These are ten-night sample diagnostics, not baseline climatology. Cache identity for the inspected runtime was `c76f23d32535e340408ee12be9bfa880d00230522fed3255ea7da760b4bd438d`.

No network access was used. Raw pilot evidence remains ignored and is not copied into plugin assets.

## Exact next baseline acquisition proposal — not authorization

For this same exact cell and Asia/Kolkata, retain the validated first partition, then request exactly partitions 1 through 782 of `planOpenMeteoHistory({latitude:28.5,longitude:77.25})`. That is **782 additional GETs**, zero retries, first additional date 1991-01-13, final inclusive date 2021-01-02. Existing plus proposed partitions cover exactly 263,088 hourly slots; there is no per-partition overlap. If reuse of the original receipt is rejected, stop for a revised proposal rather than silently add request 783.

Reserve 782 estimated API units plus the already consumed one (783 total); deployed debit remains unobserved. An 800-unit planning envelope and 1,000-unit shared daily history ceiling are separate accounting limits, not permission to spend or a provider quota reservation. One request and one point build may be active application-wide, requiring a durable shared ledger before execution. Stop on 429, non-200, redirect, unit/cell mismatch or any exceeded limit. Each GET has 20 seconds and a 2 MiB decoded entity cap. Worst summed transport deadlines are 15,640 seconds (4h20m40s), not a latency prediction.

Propose a **128 MiB cumulative raw-entity stop**, plus 8 MiB receipts/manifests and 1 MiB derived summary (137 MiB total retained cap), with raw bytes streamed and persisted before aggregation. At the single pilot's measured shape, 783 × 4,418 = 3,459,294 bytes (~3.30 MiB), but that extrapolation is not a size guarantee. The cumulative cap takes precedence over the per-response cap. Full-baseline aggregation has a separate 263,088-hour / 300-second cooperative computation bound; CPU/RSS and durable cache/restart behavior must be measured in the later authorized run. No automatic retries or substitute cell/timezone builds are in this proposal.

Execution still requires a reviewed persistent acquisition/ledger implementation and explicit new allowance, plus resolution of the documented hosted-use/scientific admission conditions. This wave supplies neither. No available baseline may be emitted until the distinct source's admission policy and completeness/year guards are independently satisfied.

## Verification

The initial two serving tests failed because the integration functions were absent; the point-aware provider test separately failed before that function was added. Fifteen targeted offline history tests passed, covering contract/pilot/serving, percent thresholds, missingness, cache timezone separation, exact period, unavailable baseline, UTC bins/local noon/DST fold, budgets and iterator cleanup. `npm run check` passed after fixing ES-target-compatible iterator consumption. Root owns the final combined full-suite run and MCP injection verification.
