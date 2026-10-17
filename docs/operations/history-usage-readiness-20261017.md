# Open-Meteo usage readiness — 2026-10-17

The annual executor and preserving provider import are implemented. The owner confirmed on 2026-10-17 that there was no Open-Meteo usage outside this NightSky work on this connection. Together with the single retained pilot receipt and no other executed-call evidence found in tracked NightSky files, this supports preparing a source-estimated usage import; it does not turn estimated debit into provider-measured debit. No private ledger, credentials or ignored attempt directory was read; no weather API request or ledger mutation was made for this review.

## Evidence available now

| Evidence | What it establishes | What it cannot establish |
| --- | --- | --- |
| [Public pilot receipt](history-pilot-receipt-20261017.json) | One HTTP 200 request, response date `2026-10-17T08:23:41Z`, canonical cell 28.5/77.25, 1990-12-30 through 1991-01-12, 336 hours, 4,418 decoded bytes; SHA-256 `549c19aaa033b3fe20bfaa12a826f43449cd0c6b2d3a3d6a1a3da35355d97068` | Receipt explicitly records measured debit `unobserved`; response date is not an account usage snapshot |
| [Pilot execution report](history-method-pilot-20261017.md) | Owner-authorized attempt was consumed; pinned source estimate is 1.0 weighted credit | Provider-measured debit or absence of other calls |
| Tracked repository searches for Open-Meteo/archive endpoint references, including operations evidence and transport code | No additional executed Open-Meteo request receipt found in this retained public evidence; plans, fixtures and synthetic tests are not actual consumption | Calls outside the repository, failed/unrecorded attempts, other applications, shared egress users, or complete rolling-day/month totals |
| [Official pricing](https://open-meteo.com/en/pricing), checked 2026-10-17 | Free evaluation/prototyping is explicitly described; published free limits are 600/minute, 5,000/hour, 10,000/day, 300,000/month. Long or variable-heavy requests can count fractionally as multiple calls | Actual unused capacity, account-specific entitlement or this request's deployed debit |
| [Official terms](https://open-meteo.com/en/terms), checked 2026-10-17 | Free API is noncommercial; terms say less than the minute/hour/day limits and list commercial/promotional exclusions | Unrecorded business facts or complete account usage |

The earlier pilot must be included in October usage and in rolling-day usage while it lies within that window. Do not substitute `1` for complete totals merely because it is the only retained receipt. A source-estimated credit is not an observed provider debit. If the operator confirms this was the sole call across the complete shared scope, its recorded 1.0 estimate supplies a practical reviewed accounting basis of one integer credit for each applicable window, explicitly labelled estimated rather than independently measured. Provider-exact debit evidence is not an extra prerequisite: conservative source-based accounting with complete call coverage is the feasible path. The published allowances substantially exceed the proposed application slice but do not establish remaining capacity.

## Smallest operator input

The owner has supplied the missing outside-usage statement; do not ask it again. Prepare the current usage snapshot with `usedLast24Hours: 1` and `usedCurrentMonth: 1` while the recorded pilot is inside the rolling window, citing the pilot, pinned source accounting and owner attestation. These are conservative integer ceilings of the recorded source estimate, not guarantees about provider-measured counters. Do not invent extra credits such as 3 or 10 as purported measured consumption. The annual attempt separately reserves three credits.

The remaining concrete operator detail is the existing shared ledger's absolute path and confirmation that further calls remain stopped through import and thereafter use the same policy/ledger. Generate `observedAt` immediately before the approved import; the receipt's response date is not that snapshot. Reconcile any newly discovered NightSky attempt before using the proposed totals. A new account, credentials, paid dashboard or extra debit-discovery request is not required. Unknown additional usage, if discovered, cannot become zero.

Settled free/ad-free/no-affiliate facts need not be requested again. The finite evaluation can cite the current pricing statement and existing source review as its eligibility basis; sustained production remains a separate decision. Prepare the migration packet from the operator statement and ask for its concrete mutation approval, then prepare the distinct annual packet after successful import. These are the existing authorized workflow's two gates, not new account-setup tasks.

## Exact import and annual bounds

Use [the accounting operator contract](history-accounting-20261017.md). Proposed stable policy is `providerId: open-meteo`, `accountLabel: operator-open-meteo`, 500/hour, 1,000/day, 30,000/UTC month. These are application ceilings. `approved-add-open-meteo-account` adds only the missing entry under the existing ledger lock, preserves every existing entry and usage value, and performs zero network requests. It refuses a duplicate, missing or corrupt ledger. No reset or fresh-budget initialization is permitted.

The usage snapshot must be no more than five minutes old, in the current UTC month and not future-dated; all consumers remain quiesced through import. Import charges the full last-24-hour total to the current minute, conservatively consuming both hourly and daily room. At the proposed ceilings, an immediate three-credit request requires imported last-day usage at most 497 and month usage at most 29,997, assuming no intervening reservations or other denial state. Higher last-day usage can delay hourly availability; it is not grounds to reduce the imported total. All subsequent consumers use the same ledger/policy or remain stopped.

Safe offline operator output on 2026-10-17 confirms plan SHA-256:

`c96b488bbcda010ddeed686816fa959eba6d984124c4b826f3ec3a16a3e0ad29`

```text
GET https://archive-api.open-meteo.com/v1/archive?latitude=28.5&longitude=77.25&start_date=1992-01-01&end_date=1992-12-31&hourly=cloud_cover&models=era5&timezone=GMT&timeformat=unixtime&cell_selection=nearest&elevation=nan
```

Annual execution reserves **3 credits** before one GET (pinned source estimate 366/140 = 2.6142857142857143); zero retry, redirect follow or fallback; 60,000 ms deadline; 2,097,152-byte body and 4,194,304-byte total evidence caps. Expect exactly 8,784 UTC hourly timestamps in `[1992-01-01, 1993-01-01)`. Original point 28.6139/77.209 maps once to canonical 28.5/77.25; display zone is Asia/Kolkata. Outcome stays quarantine-only, scientific admission false, measured debit unobserved. Failure retains its reservation and attempt evidence.

The distinct `approved-annual-history-probe` packet binds this digest, the same ledger and policy, a fresh 64-hex execution ID, future UTC expiry, existing absolute unlinked local evidence root, three-credit ceiling and nonsecret eligibility/accounting references. The operator can generate identity and directory details when preparing the packet; the user need not hand-author JSON. No packet is approved by this document.

The earlier [annual next packet](history-annual-next-packet.md) now links the implemented annual live CLI and preserving migration; its request/scientific bounds remain applicable. This review changed documentation only; the safe default CLI was run and no live-capable mode was invoked.

Execution follow-up: the owner-approved preserving import and separately approved annual probe have now completed. See [actual results](source-native-acceptance-results-20261017.md). The proposed pre-import totals above are historical snapshot evidence, not current remaining usage; the annual attempt additionally reserved three credits. Do not reuse the old totals or approval.
