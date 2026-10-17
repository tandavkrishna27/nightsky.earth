# Vatican country-filter probe handoff — 17 October 2026

Status: offline preparation complete; live execution still requires new explicit approval. The earlier consumed selection allowance is not reused. The [diagnosis](geography-diagnosis-20261017.md) found no confirmed production query defect; this experiment changes one input to collect evidence.

## Exact proposed request and allowance

```text
GET https://api.geoapify.com/v1/geocode/search?country=Vatican+City&type=country&bias=countrycode%3Anone&limit=5&format=geojson
```

The existing credential is appended privately as `apiKey`. Only `filter=countrycode:va` is removed from the earlier request. The production adapter remains unchanged.

Approve envelope `geometry-selection-filter-probe-va-1-1-30-zero-retries` for one GET, one reserved Geoapify credit, zero retries, no redirects, a 30-second transport deadline, at most 5000 ms HTTP timeout, at most 262144 response bytes in total, and at most 262144 journal bytes. The operator must use the existing durable quota authority and a fresh exclusive journal batch ID; a missing ledger is refused, never initialized by this executor. A used batch cannot be rerun. Changing the batch ID is not authorization for another request.

The exact executor argument is `--selection-filter-probe-live` in `scripts/validate-geometry-live.ts`. The no-argument invocation stays offline and exposes `filterProbe` with its query and limits. Neither `--selection-live` nor `--live`, nor their approval envelopes, substitutes for this probe.

## Selection and stop

Require a valid FeatureCollection of at most five features and exactly one eligible Feature with `country_code=va`, `result_type=country`, and an opaque place ID of 3–2048 characters with no control characters. An ID containing the credential is refused. Empty, malformed, ambiguous, wrong-country, wrong-type and unsafe-ID responses stop without selection success.

Stop after the single selection under every outcome, including success. No Details, other country, alias, park request, source admission or deployment follows. Production geometry remains disabled and source acceptance remains false. An eligible result indicates only that this later unfiltered observation differed; time and provider state prevent attributing the historical empty result conclusively to the filter.

## Evidence and operator reporting

Offline tests use injected fixture transport and temporary synthetic quota/journals only. The new guard tests were observed failing before implementation. Focused verification passed: 26 tests across `geometry-filter-probe.test.ts`, `geometry-live-validation.test.ts`, and `api-region-contract.test.ts`. Cases cover exact query/envelope binding, altered query refusal, 30-second expiry, one-dispatch stop, strict VA selection, one-credit persistence, duplicate journal refusal, safe diagnostics, redirect refusal and byte cap. The HTTP client's existing 5000 ms timeout is reused. Full-suite validation is reported separately by the coordinating task.

No live provider request, private configuration read, private ledger mutation or source acceptance occurred during preparation. After future approved execution, report envelope, request/credit count, HTTP status/byte count, safe selection counts/identity, stop reason, and journal location without credentials or response bodies. Keep the result scoped to selection and request a separate decision before any geometry acquisition.

Executed follow-up: the owner approved this exact revised request. It returned HTTP 200, 149 bytes, `selection-empty` in 779 ms and stopped after one reserved credit. See [results](source-native-acceptance-results-20261017.md). This allowance is consumed; no retry or geometry request is authorized.
