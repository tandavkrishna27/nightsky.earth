# Public Universe bounded validation proposal

**Preparation only. Not an executed test or permission to call the service.**

Public Universe needs no API key. Installation does not admit this optional source. Existing live allowances are expired or consumed. After offline implementation and review, request a separate decision covering a dedicated NightSky application budget and this exact batch. Do not change existing provider ledgers.

## Limits

| Item | Proposed bound |
| --- | --- |
| Network attempts | At most 12, including failures; one active request |
| Total duration | Five minutes; each operation at most 15 seconds |
| Bodies | At most 1 MiB per response and 12 MiB aggregate accepted bodies |
| Request bodies | At most 16 KiB each |
| Retries / pagination | None; no diagnostic reserve or replacement calls |
| Storage | Sanitized status, identity/binding checks and normalized evidence only; no raw responses |
| Other services | None; use a synthetic resolved Hyderabad point rather than a live geocoder |
| Deployment / downloads | No deployment, bulk catalogue, kernel or historical download |

Application accounting proposes 20 attempts/hour and 100/day. This is a NightSky allocation, not a verified vendor allowance or a statement about other users sharing the public IP. The dedicated ledger must preserve prior usage if it already exists. Approval must specify its private absolute path before initialization; never reset it to rerun a failed batch.

## Exact call sequence

Origin is fixed to `https://api.sol.wickedsick.com`. All paths below start with `/api/v1`. Each selected ID comes from the indicated preceding response. If the required identity/provenance is absent or ambiguous, skip dependent calls rather than substituting a different object.

| # | Method and route | Purpose / dependency |
| --- | --- | --- |
| 1 | GET `/starter-targets?q=Sirius&limit=1&offset=0` | Identify one exact supported starter target and source snapshot |
| 2 | GET `/starter-targets/{selected-id}` | Verify exact ID, source provenance and astrometry against call 1 |
| 3 | POST `/observing/discover` | One naked-eye shortlist, maximum two targets; observer/window below |
| 4 | POST `/observing/night` | One exact starter target selected by calls 1–2, matching source metadata |
| 5 | GET `/search?q=Jupiter&limit=1` | Select exact solar-system identity |
| 6 | GET `/objects/{selected-jupiter-id}` | Check bounded facts, units and source references; no extra sections |
| 7 | GET `/meteor-showers/GEM` | Check meteor identity and explicitly reduced parameter sets, not annual peak forecast |
| 8 | GET `/search?q=Apophis&limit=1` | Select exact small-body identity |
| 9 | GET `/objects/{selected-apophis-id}/close-approaches?from=2029-04-01&to=2029-04-30T23:59:59.999999999Z&body=Earth&limit=2` | Check bounded approach context through the final inclusive day, not visibility |
| 10 | GET `/exoplanets?q=TRAPPIST&limit=1&offset=0` | Select exact exoplanet/host with same-response snapshot |
| 11 | GET `/exoplanets/{selected-exoplanet-id}` | Verify ID and measurement metadata; do not invent snapshot association |
| 12 | GET `/exoplanet-hosts/{selected-host-id}` | Verify selected host association and bounded planet context |

The observing point is Hyderabad city reference, latitude **17.385**, longitude **78.4867**, timezone **Asia/Kolkata**. It is not an observing-site/access claim. Local night is **2026-10-18**; selected window **2026-10-18T15:00:00Z–2026-10-18T18:00:00Z**. If execution is delayed, revise the dated packet before seeking approval; do not silently change dates at runtime.

Both POSTs use `date`, `timezone`, `lat`, `lon`, `window_start_utc`, `window_end_utc`, `min_altitude_deg:20`, `sun_altitude_deg:-18`, `min_moon_separation_deg:20`. Discovery additionally uses `equipment_mode:"naked_eye"`, `preference:"balanced"`, `shortlist_limit:2`. Night additionally uses comma-string `targets` with the single verified starter ID. No nested constraints or plural preferences.

## Pass / failure evidence

- Validate exact identities, returned rounded observer, date/timezone, selected interval, source lineage and method before accepting a result.
- Preserve valid empty, incomplete, unsupported, unresolved, unavailable and quota errors distinctly. No failure is evidence that no targets exist.
- Preserve rights, original retrieval times and data uncertainty. Observing numerical results are no-store; no replay cache.
- Stop on exhausted budget, deadline, admission/cooldown or accounting failure. No automatic retry or alternate-source call.
- Successful API checks establish provider contract evidence only. Native model conversation and owner judgement remain separate gates.
