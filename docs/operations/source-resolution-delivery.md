# Source resolution delivery — 16 October 2026

Advances the existing S2-G3, H2/H3 and E2 rows. Original totals remain **12 Done / 9 Partial / 6 Not started**; no full production data release or deployment is claimed.

## Geography: exact identity established, build fit still open

The [planet identity and capacity record](planet-identity-capacity.md) establishes the dated source's exact **95,380,942,829-byte** raw size, provider checksum, HTTP identity and fresh local capacity. Only metadata and the 56-byte checksum were retrieved. The original URLs redirected; their exact unsigned provider destinations were reviewed before direct metadata requests. No PBF body was downloaded.

Above the existing 128 GiB reserve, the measured machine could hold the raw file and leave **62,630,256,659 bytes (58.33 GiB)** for all new preparation allocations. The existing all-node SQLite index has no demonstrated planet fit. The recommended engineering next step is reference-selective indexing that preserves the current candidate policy, followed by retained-fixture equivalence and bounded resource checks, before deciding on a large acquisition. This is a recommendation, not a silently implemented producer change or a serving-host size estimate.

## Events: six sourced approximate periods

[Remaining event coverage](event-remaining-coverage.md) adds Lyrids April, Perseids August and Leonids around November 17 or 18 to existing ETA/ORI/GEM guidance. Primary narratives explicitly establish annual recurrence. All entries remain approximate reference context, separate from dated peaks, complete UTC seasons, radiant validity and local visibility. The document enumerates the remaining 19-code season, seven-code radiant and annual-maximum gaps with specific research routes.

## Weather

The owner separately approved one results-metadata request for the existing successful legacy job: at most 1 MiB body, 30 seconds, no retries, new job or asset download. Preparation reuses the existing bounded transport and Windows containment, validates retained identity and claims one attempt before requesting metadata. Private configuration is read only in the contained worker; committed results must omit credentials, job IDs, complete asset URLs and arbitrary exception text. The original job checkpoint and consumed allowance remain unchanged.

The approved metadata request returned HTTP 200 and **329 bytes**. Its [sanitized receipt](data-pilot-evidence/legacy-weather-result-metadata-20261016.json) identifies a **25,261-byte** result on `object-store.os-api.cci2.ecmwf.int`, excluded by the original legacy adapter's host set. This current response would fail that origin check. It establishes a concrete present blocker without retroactively recovering the original suppressed exception. No raw result was fetched during this metadata inspection and no new job was created.

The helper was independently reviewed before execution. Review caught a possible read beyond the body ceiling; bounded raw reads and nine offline regressions now check actual bytes consumed, unknown length, malformed headers, sensitive-value exclusion and retained identity. The inspected body stayed far below the ceiling. This one-shot helper is retained in the ignored wave working directory, with an exclusive consumed claim; the committed evidence contains only sanitized fields.

The owner then separately approved one metadata GET (maximum 1 MiB), one exactly 25,261-byte asset GET, a two-minute shared deadline, no retry or new job, and local inspection. The independently reviewed helper used a separate tokenless download session, exact host/size checks, a 512 MiB/one-process Windows Job and fresh exclusive claim/output. Its metadata transport timeout is cooperative; the two-minute supervisor deadline is the hard bound. Five retrieval and nine metadata tests passed before execution. No original checkpoint or allowance was changed.

**Retrieval and strict validation succeeded.** [Validation evidence](data-pilot-evidence/legacy-weather-result-validation-20261016.json) records raw SHA-256 `4d54f0e655b04c22c077d94fe790bbec5cc5e1f49df32f6ac9189a8013e2d5bd`, 24 exact UTC hours, four exact cells, 96 finite cloud fractions, member 0 and final `expver=0001`. The existing contained validator used a 256 MiB job and 60-second deadline; observed decode duration was 0.203 seconds and sampled peak worker RSS 42,029,056 bytes. It retained the raw file in separate ignored output. No raw data or credentials enter Git.

This closes the **legacy sample transport/format/provenance check**, not global history preparation or production admission. The fixed request was `reanalysis`; an observed member-zero field does not independently equate HRES and EDA products. This one day is outside the proposed 1991–2020 baseline and provides no completed baseline period. The ARCO point product's separate provenance question remains open; it is not retroactively validated by this legacy response. Remaining H3 work is an appropriately bounded actual baseline acquisition plan and practical build/serving feasibility.

## Review and verification

Independent reviews checked source facts, data/approval boundaries, host/size controls and the new event contracts. Findings corrected before execution/delivery: metadata reads could exceed their stated cap; a stale calendar caveat contradicted the expanded response; and the retrieval packet needed to distinguish a cooperative metadata timeout from its hard two-minute deadline. No material findings remain.

An initial aggregate run caught an old three-entry MCP assertion while the lane was still updating it. Final aggregate verification after all fixes: **901 Node tests passed, one existing skip**, all TypeScript configurations passed and eight offline review cases passed. Fourteen offline helper tests passed before approved retrieval. The full ERA5 offline suite passed 149 tests and plugin packaging passed. Independent final review recomputed the actual raw size/hash and confirmed the sanitized receipts. Exact-commit CI is checked after push.

No geography PBF body, new CDS job, deployment or publication occurred. The sole dataset download was the explicitly approved 25,261-byte result.
