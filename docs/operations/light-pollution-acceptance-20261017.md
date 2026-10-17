# Light-pollution V1 implementation and acceptance

Updated 17 October 2026. This is additional work within the existing V1 blocks, not a new release sequence. Original ticket totals remain **12 done / 9 partial / 6 not started**; implementation alone does not close live, native-client or publication gates.

## Current delivery

| Component | Implemented evidence | Remaining acceptance |
| --- | --- | --- |
| LP1 comparison contract | One to five selected places or explicit coordinates; source/transport identity, exact binding, bounded provenance and unavailable states | Passed; final evidence below |
| LP2 DarkSkySites API | Fixed official endpoint; private server key; dedicated persistent project quota; bounded in-memory evidence cache; no retries or browser fallback | Passed two-point live API pilot; scientific accuracy remains unverified |
| LP3 browser boundary | Isolated child protocol, bounded queue/deadlines, synthetic parser/network-policy/lifecycle checks, separately compiled optional worker | Public admission, actual DOM binding, browser egress and process-tree capacity remain unproven; worker is hard blocked |
| LP4 DarkSkySites browser | Selected-card parser and injected visible-action workflow reject stale, hover, rounded and ambiguous evidence | Concrete selected-marker DOM extraction is not implemented or wired into the worker; experimental only |
| LP5 MCP and workflows | Optional `compare_light_pollution`; four updated workflows and canonical references; adjacent attribution and qualified comparisons | Full package native host/owner acceptance remains pending |
| LP6 assembly | All seven suites registered, offline CI checks, compiled API check with optional Playwright absent, portable package 1.0.17 | Review, regression, code CI and bounded live pilot passed; native/browser acceptance remains |

No production scraper is claimed. Setting the browser environment flag does not override the worker's `browser_not_admitted` gate. API and browser views from the same source are not independent measurements. Light pollution is distinct from astronomical darkness, cloud, Moon, horizon and night access.

## Private operator configuration

The existing key remains outside Git in the owner's private provider configuration. Never copy keys into docs, fixtures or CI. Offline CI requires no provider secrets.

```dotenv
NIGHTSKY_LIGHT_POLLUTION_SOURCES=darkskysites
NIGHTSKY_LIGHT_POLLUTION_API_ADMITTED=darkskysites
NIGHTSKY_DARKSKYSITES_API_KEY=<private existing key>
NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH=<dedicated absolute local file>
```

The key alone does not activate the service. Serving startup never initializes or resets accounting. All keys for this project share the same ledger; rotation must retain it. Keep it separate from weather/sky/discovery ledgers. A fresh ledger requires explicit setup with `NIGHTSKY_LIGHT_POLLUTION_QUOTA_VERIFIED_UNUSED_BUDGET=yes` and a nonsecret `NIGHTSKY_LIGHT_POLLUTION_QUOTA_VERIFICATION_EVIDENCE` description. After loading private environment variables, `node --import tsx scripts/initialize-light-pollution-quota.ts` is proposal-only; `--initialize` is the explicit mutation and refuses replacing initialized state.

Owner confirms the project is unused elsewhere and its dashboard shows **30,000 requests/month**. This establishes initial allowance evidence, not permission for an unbounded live run. Local accounting conservatively reserves attempts even when the upstream provider would not bill them. Provider request dispatch is capped at ten per second; quotas are project-wide, not multiplied by API keys. Multiple server instances must not operate independent copies of the same project allowance.

## Prepared live-test contract — executed once; see final receipt below

`node --import tsx scripts/validate-light-pollution.ts --plan` makes no network calls and emits the exact approval packet. Proposed lookup points are Hyderabad **17.3850, 78.4867** and Shamirpet-area **17.6100, 78.5630**; these are comparison coordinates, not verified observing sites.

Limits: **two GETs maximum**, **256 KiB accepted body per response / 512 KiB total**, **60-second request deadline**, **zero retries**, no raw response retention and no deployment. Failure/unavailable stops the remaining lookup. Received chunks may cross the body threshold before cancellation; receipts record those bytes and do not pretend this is a wire-byte cap. TLS/header overhead and filesystem cleanup are outside that body/time measurement.

Live invocation requires an approved, exact matching packet and an existing initialized ledger:

```text
node --import tsx scripts/validate-light-pollution.ts --live --acknowledge-light-pollution-pilot --approval-packet <approved-packet.json> --journal <new-private-receipt.jsonl>
```

One successful test demonstrates response integration, not scientific accuracy, global completeness or native skill loading. The approved live pilot below consumed this exact allowance; no rerun is authorized.

## Verification evidence

- Seven focused suites after the final review correction: **110 passed / 0 failed**, independently rerun by the coordinator. The review found and fixed five-point requests exceeding the four-call concurrency ceiling; new tests cover success, cancellation and quota exhaustion. Overlapping earlier counts are not added.
- Coordinator reran types, backend build, portable packaging and compiled synthetic API/blocked-worker checks after the final correction: all passed. Independent final source review has no remaining blocking finding. Final aggregate and CI results will be added after completion. Portable ZIP SHA-256: `3629e37d9f9eaf9ca633ebe53a9f6daaf013731202d80e3026b1cedaa1432ff8`.
- Synthetic measurements: cold/warm comparison **22.424 / 2.852 ms**, two upstream fixture calls total across both comparisons, **690 response-body bytes**, Node lifetime maxRSS **190,308 KiB**. These are one offline run, not real network latency or a Hetzner capacity guarantee; no Chromium process or whole-process-tree measurement was performed.
- Controlled before/after workflow exercises are retained in the local SDD evidence. The baseline was already conservative; three after-guidance scenarios handled differing datasets, a 429 without scraping fallback, and comparable SQM ranking. This is not proof of native host skill loading or causal improvement.

## Source and browser gates

[DarkSkySites API documentation](https://darkskysites.com/api-access) and [API terms](https://darkskysites.com/api-terms), version `API_TERMS_2026_10_V2`, were checked on 17 October 2026. API terms permit application use and reasonable operational caching with attribution; prohibit bulk reconstruction, quota evasion and substitute raw-data services. This permission does not automatically authorize browser scraping.

See [browser admission review](light-pollution-browser-admission-20261017.md) for unresolved rights, exact-coordinate evidence, socket-level egress, real Chromium lifecycle and resource gates. No browser download, public map scraping or native plugin reinstall occurred in this wave. The portable package version does not imply the owner's installed plugin has changed.

## Final local verification

The full offline regression run passed **1,666 / 0 failures / 2 skipped** in 228.8 seconds. It loaded before the last five-point concurrency fix; all **110** focused light-pollution cases were independently rerun after that fix and passed. Post-fix types/build/package/compiled checks also passed. Exact-commit CI will rerun the final aggregate on Linux and Windows; its status is pending at this commit. No live provider calls occurred.

The final implementation commit `8a87540` was rerun locally: **1,669 passed / 0 failed / 2 skipped** in 242.5 seconds. [CI run 39051514152](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39051514152) passed five jobs but failed the Windows focused pilot tests: 30/60 ms test deadlines expired before slow durable accounting completed, so no transport had started. The production code correctly refused late dispatch; the tests incorrectly assumed it had started. This requires test synchronization repair and a fresh exact-commit CI run, not a relaxed production deadline.

The owner has approved fresh dedicated accounting and the exact two-point pilot above. Approval remains unused until final checks pass; no provider request or private ledger initialization has occurred yet.

The test-only synchronization repair passed independent review and coordinator verification (11/11); the seven-suite command passed 111/111, and the implementer repeated 132 checks across concurrent runs. No production limits changed. Fresh CI is required for this follow-up.

## Approved live pilot — completed

Code commit `a2cb60642e7189bcc4ee63700ae5f02694e0762e` passed all six jobs in [CI run 39052258236](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39052258236) before the pilot. The dedicated private quota ledger was initialized once using the owner's confirmed unused allowance. Existing other-provider ledgers were not modified.

| Exact point | DarkSkySites modelled SQM (mag/arcsec²) | Provider Bortle class | Dataset | Quality |
| --- | --- | --- | --- | --- |
| Hyderabad 17.3850, 78.4867 | 17.96 | 9 | August 2026 (`08_2026`) | screened; coverageVerified=false |
| Shamirpet-area 17.6100, 78.5630 | 19.73 | 6 | August 2026 (`08_2026`) | screened; coverageVerified=false |

Both official API calls returned HTTP 200 with exact returned coordinates, `seasonal_temporal_v1`, no fallback and one dataset checked. Attribution: [DarkSkySites](https://darkskysites.com/). Retrieved 17 October 2026 at 17:14:35–36 UTC. Higher comparable SQM suggests the Shamirpet point is darker in this model; unknown coverage prevents treating the estimate as independently validated site truth. These values do not establish weather, horizon, access or guaranteed visibility.

Two requests consumed the complete approved pilot allowance. Received response bodies totaled **783 bytes** (390 + 393), elapsed **2,887 ms**, with zero retries. Safe structured evidence is retained privately; no raw response bodies or key entered Git. The dedicated ledger records two October 2026 reservations. Do not rerun the approval packet or reset accounting.

**Current status:** API integration and bounded live response acceptance pass. Public browser operation and native full-package/owner acceptance remain open. The owner's installed plugin was not changed by this wave. No deployment occurred. The following documentation-only commit records this result; its CI is monitored separately from the code commit above.