# Geography selection diagnosis — 17 October 2026

## Finding

No query-construction defect is confirmed. The [authorized result](geography-selection-result-20261017.md) establishes that the exact structured Vatican City request returned HTTP 200, 149 bytes, a valid FeatureCollection and an empty features array. It consumed one request/credit and stopped with `selection-empty`. Geometry was neither acquired nor accepted. The reason the provider returned no features remains unknown.

This investigation used repository source, the published safe result, existing offline tests and public official documentation. It did not read private configuration, the quota ledger or private journals; send a provider API request; download source data; or deploy. The consumed allowance remains consumed. No production code or tests were changed because there is no demonstrated defect to fix.

## Contract and execution trace

The [adapter](../../server/places/api/geoapify.ts) maps `VAT` to lowercase `va` and constructs `country=Vatican City`, `type=country`, `filter=countrycode:va`, `bias=countrycode:none`, `limit=5`, `format=geojson`. The [validator](../../scripts/validate-geometry-live.ts) calls that same builder and binds its guard to the complete query. The [HTTP client](../../server/places/api/http.ts) serializes the parameter values with URLSearchParams and appends the credential privately. There is no alias retry or fallback query in this path.

The official [forward-geocoding contract](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/), checked 17 October 2026, documents country names as structured inputs, `country` as a type, lowercase alpha-2 country filters, `countrycode:none` to suppress IP bias, a result limit and GeoJSON output. The [country-filter guidance](https://apidocs.geoapify.com/how-to/addresses/restrict-address-search-country/) also documents the filter syntax. These documents support the request shape; they do not promise a result for this name and country combination.

The validator observes `featureCount=0` before applying feature identity, country code, result type or place-ID eligibility checks. Thus those checks did not discard a returned Vatican feature. Details decoding, polygon classification and production geometry admission were never reached. HTTP success alone says nothing about successful selection or available country geometry.

Retained facts cannot distinguish provider indexing, name matching, country-filter interaction or another provider-side behavior. None is established as the cause. Response length cannot reconstruct the discarded body. The older 136-byte response lacked selection diagnostics, so it is not evidence that two requests returned the same result. No global country-coverage conclusion follows from this single diagnosed selection attempt.

## V1 behavior and fallback

The existing [region resolver](../../server/places/api/discovery.ts) reports `not-covered` for a successful empty lookup and says no usable country/state boundary identity is available. It does not synthesize a country selection. Constraints needing original boundary geometry remain unsupported while geometry admission is disabled; constraints must not be silently removed.

A user can explicitly choose a named town/site and a supported point/radius workflow instead, accepting that it does not establish membership within the requested country boundary. That is a user scope change, not an automatic country fallback. Ordinary point workflows do not gain a new mandatory country gate. V1 can retain its existing point capabilities with this country-selection limitation stated; this result does not justify declaring geography source acceptance.

## Concrete alternative for separate review — not executed or authorized

If a further provider experiment is wanted, isolate the filter interaction with one structured query that removes only the country filter:

```text
GET https://api.geoapify.com/v1/geocode/search?country=Vatican+City&type=country&bias=countrycode%3Anone&limit=5&format=geojson
```

This deliberately broadens provider search scope and therefore needs a new explicit allowance. It is an experiment, not a claimed correction. Keep the post-response requirement of exactly one eligible country feature with `country_code=va`, `result_type=country` and a safe opaque place ID. Wrong-country results cannot count as selection success.

Proposed limits: one request, one reserved credit, zero retries, no redirects, 30-second transport deadline, at most 5000 ms HTTP timeout, 262144 response bytes and a 262144-byte journal. Use a new distinct envelope, for example `geometry-selection-filter-probe-va-1-1-30-zero-retries`, with the existing durable quota authority and safe count/identity diagnostics. This envelope is a proposal only: the current executor does not implement or accept it. Do not invoke the existing selection packet as a substitute. A narrowly scoped executor change and failing offline guard tests would precede any approved execution.

Stop after that selection under every outcome, including success. No Details request, alias, second country, park search, source admission or deployment follows. Empty results would establish only another empty query. An eligible result would support a difference associated with removing the filter in that later observation; provider state may change between attempts, so it would not prove the historical cause. Either outcome leaves original-geometry acceptance as separate work.

## Offline evidence

On Node `v24.14.0`, the following existing fixture tests passed: **22 tests, 22 passed, zero failed**.

```powershell
node --import tsx --test tests/places/api-region-contract.test.ts tests/operations/geometry-live-validation.test.ts
```

The tests cover the structured query and restriction, ambiguity/type/country rejection, safe empty-selection diagnostics, exact packet binding, one-request stop, consumed-envelope refusal, and synthetic quota/journal guards. Injected fixture fetchers and temporary synthetic quota files provide the evidence; the live provider and private quota were not used. These tests support local behavior, not provider coverage. No full-suite claim is made for this documentation-only diagnosis.
