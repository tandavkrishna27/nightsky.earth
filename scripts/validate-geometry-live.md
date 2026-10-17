# Bounded geometry validation executor

Default invocation is offline:

```powershell
node --import tsx scripts/validate-geometry-live.ts
```

An explicitly authorized operator can invoke the fixed packet in a child process with the existing private configuration file:

```text
node --env-file=C:/Users/TK/.nightsky/providers.env --import tsx scripts/validate-geometry-live.ts --live
```

Supply these nonsecret values to that child environment:

- `NIGHTSKY_LIVE_APPROVED_ENVELOPE=geometry-live-v1-6-9-120-zero-retries`
- `NIGHTSKY_LIVE_BATCH_ID=<unique lowercase batch identifier>`
- `NIGHTSKY_LIVE_GEOAPIFY_ADMITTED=yes`
- `NIGHTSKY_DISCOVERY_MODE=api`

The private configuration must already supply `NIGHTSKY_GEOAPIFY_API_KEY` and `NIGHTSKY_QUOTA_STATE_PATH`. Both production geometry flags must remain unset or false; the executor refuses `yes`. Never initialize or reset the existing quota for this run. The executor creates an exclusive `geometry-live-<batch>.jsonl` marker beside that quota and synchronizes each attempt receipt before network dispatch. A previous attempt marker prevents reuse of that batch.

The sequence is exactly two country geocodes (Vatican City and San Marino), their two original-details acquisitions, one Vatican park page, and a fresh repeated Vatican details acquisition. Country selections must be unambiguous and have the expected country code and country result type. Every details call costs two credits through the existing HTTP client. Maximums are six requests, nine credits, 262144 bytes per response, 1572864 bytes total and 120 seconds. No retries or pagination are permitted.

An unknown response shape, decoder rejection, ambiguous identity, unavailable response, quota denial, byte cap or persistence failure stops the packet. Inspect the safe `shape` receipts to review feature types, selected identity matching, geometry type and vertex/ring counts. No raw bodies or coordinates are retained. Snapshot normalization and receipt hashes, expiry, and bounded transient inside/outside/boundary probes are recorded only after decoder acceptance. Source vintage remains unknown. This packet never sets production source acceptance.

Offline verification:

```powershell
node --import tsx --test tests/operations/geometry-live-validation.test.ts
npx tsc --noEmit
```

The integration test initializes only a fresh synthetic temporary quota, dispatches only its fake fetcher, and checks the nine-credit debit and exclusive journal. It does not touch operator quota or credentials.

## Actual authorized attempt, 17 October 2026

The operator executed this packet once. It stopped after the first Vatican City country-geocode GET: HTTP 200, 136 response bytes, 445 ms, and one consumed credit. No second geocode, details acquisition, park search or repeated acquisition occurred. Geometry response shape and serializer acceptance remain untested. Production geometry gates remain disabled.

That executor version retained the transport receipt but no selection diagnostics. Because the response body was discarded, the evidence cannot distinguish empty results, ambiguous identities, malformed shape or missing expected identity metadata. The small response length is not proof of any one explanation. No retry was made or authorized by the diagnostic change.

Future explicitly authorized runs now persist selection facts before selection: FeatureCollection validity, feature count, limit check, and at most five boolean-only feature/country/type/ID checks. The report records a typed stop reason and packet phase. These additions are verified offline and do not reconstruct the discarded response or establish why the actual attempt stopped.
