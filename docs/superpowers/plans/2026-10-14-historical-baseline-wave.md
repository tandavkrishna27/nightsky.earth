# Historical baseline implementation plan

Approved scope: bounded multi-year pilot processing for the existing ten reviewed ERA5 cells, then a real 1991–2020 baseline only if measured source and resource gates make it feasible. No global bulk retrieval, deployment, runtime CDS or database dependence.

1. Preserve the immutable 2025 sample and legacy decoder defaults. Add equivalent deterministic Python/TypeScript historical plans for contiguous complete years within 1991–2020, with outer UTC boundary padding and exact monthly leap-day requests.
2. Require an explicitly reviewed plan digest before preparing or retrieving historical data. Reuse one-writer checkpoints, bounded network bodies, raw/decoded digests, uncertainty ledgers and known-job recovery. Retrieve no more than four new jobs in the first 30-minute measurement batch; stop on uncertainty.
3. Generalize the offline builder to the approved observing-night period and request count. Continue one bounded monthly chunk per cell/timezone, exact timestamp membership, independent astronomical dark-hour clock, missing observations, and source revisions.
4. Produce a directly validated schema 2 envelope for historical periods, with an explicit real generatedAt timestamp. Require all reviewed chunks before complete publication. Preserve schema 1 legacy output for 2025. Exercise envelope publication and schema 2 provider consumption using labeled engineering fixtures.
5. Record actual pilot queue, download, decode, raw/decoded bytes, source gaps and memory. Real-data partial checkpoint processing may be measured, but no incomplete source period becomes a published full-period artifact or baseline.
6. Review an efficient grouped-month source design separately if queue cost dominates. Keep parent source hashes and exact disjoint requested-hour validation, explicitly bound grouped decoding and chronological partitioning/merge, and validate actual CDS response format. Existing decoder bounds cannot be expanded implicitly.
7. Publish a real reviewed-cell baseline only after source coverage and existing 90%/27-year gates are met. Keep global rollout behind measured byte/job/disk/time/CPU gates.

Validation: fail-first historical plan, digest, retrieval uncertainty/budget, multiyear denominator and generatedAt tests; schema 2 publication/provider round trip; Python ERA5 suite; climate builder/provider suite; TypeScript check; full project suite by root before commit. Root owns shared contracts, registration, package, aggregate test registration, status docs, final review and push.
