# Public Universe bounded live validation — 18 October 2026

## Result: partial; source remains disabled by default

Owner approved proceeding with the prepared batch. A separate reviewer checked the plan-scoped runner before execution and found no blocking bounds or dependency defects. Production code and installed package remain 1.0.21; normal plugin configuration was not activated.

Execution: **2026-10-18T04:40:42.769Z–04:40:59.756Z**. Ten sequential HTTP requests, **335,445 accepted response bytes**, zero retries. All ten returned HTTP 200. Eight normalized operations were available; two failed validation as `invalid-response`. Two dependent starter operations were skipped. No replacement or diagnostic calls used the unspent allowance.

| Prepared step | Result | Evidence / limit |
| --- | --- | --- |
| 1. Sirius starter search | Unavailable: invalid-response | HTTP 200; response failed adapter validation; no accepted starter identity |
| 2. Starter detail | Skipped | Required accepted identity absent |
| 3. Naked-eye discovery | Unavailable: invalid-response | HTTP 200; no accepted targets or observing directions |
| 4. Selected starter windows | Skipped | Required verified starter identity/provenance absent |
| 5–6. Jupiter search/detail | Available | Exact selected identity `planet-jupiter`; bounded reference facts |
| 7. Geminids reference | Available | Geminids identity and reference parameter sets; not an annual peak forecast |
| 8–9. Apophis search/approach context | Available | Exact selected identity `ast-20099942-apophis`; one approach returned in requested April 2029 interval; not visibility evidence |
| 10–12. Exoplanet search/detail/host | Available | TRAPPIST-1 b and associated TRAPPIST-1 host; detail revision association remains explicitly unverified |

The Hyderabad city reference, date and observing window were unchanged from the [approved packet](publicuniverse-live-validation-proposal.md). No live geocoder or other provider was used. No observing-site/access claim was made.

## Accounting and retained evidence

- Dedicated private ledger: `C:\Users\TK\AppData\Local\NightSky\publicuniverse-quota.json`. It did not previously exist. Initialization records a new NightSky application allocation (20/hour, 100/day), not a vendor entitlement or public-IP usage claim. Existing provider counters were untouched; the new ledger records ten attempts and must not be reset.
- The runner used the production provider, parsers, reference store, bounded transport and durable quota implementation. A separate outer guard enforced twelve attempts maximum, five minutes, one MiB per response and twelve MiB aggregate accepted bodies; redirects and retries were forbidden.
- Only normalized results plus HTTP path/status metadata were retained in plan-scoped local scratch. Raw bodies were not saved. Consequently the exact failing upstream field is **not established** by this run; do not guess or loosen validation to accept unknown data.
- No persistent source admission, deployment, publication, bulk catalogue or historical download occurred. Native host/model conversation acceptance remains open; Claude remains deferred. Original ticket totals remain 12 Done / 9 Partial / 6 Not started.

## Next action

Prepare a separately approved diagnostic of the two failed routes, retaining only bounded validation issue paths/types and response shape metadata in memory-derived evidence, not full raw responses. Compare those findings with pinned upstream contracts before changing parsers. Add offline regressions and independently review any material fixes. Do not repeat this completed batch or infer full observing support from the eight successful reference operations.

The unchanged implementation's final six-job CI passed at commit `64e59981fcc82282a21c6af172248b19b5ec700a`: [CI](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39073541142). This live evidence is distinct from offline fixture verification and native conversation acceptance.
