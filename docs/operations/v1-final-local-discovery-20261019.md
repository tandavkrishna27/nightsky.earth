# Final local discovery acceptance and independent audit — 19 October 2026

Reviewed baseline `8f0036d` and the current working tree. This record accepts the locally demonstrable default API discovery contract and reviews the Task15 runtime/privacy/source boundaries. It preserves implemented conditional geometry and its missing real-source acceptance. It neither activates sources nor accepts production host behavior. Existing `data-sources.md` and `weather-provider-admission.md` edits were preserved. No provider network requests, private keys/ledgers, downloads, deployment or commits occurred in this lane.

## Exact scope and disposition

The current API-only scope is [18 October owner decision](v1-api-only-scope-20261018.md); the 19 October amendment concerns bounded events, not new geography authority. No database, planet, OSM extraction, numerical history acquisition or every-place test is required. Intended current/rollback source declaration fixtures keep both geometry flags `no` (`disabled-pending-selected-source-acceptance`). These declarations are intended configuration evidence, not a read of an operator environment. Conditional full geometry remains implemented; its active-source acceptance is pending, not deleted from product breadth.

Task8 **default API discovery is locally accepted** with the bounded semantics below. Task8's **conditional selected-geometry source integration is not accepted** from fixtures or the retained empty selections. The prior blanket wording “full geographic acceptance open” should be replaced with these exact boundaries. Default acceptance is meaningful implementation/behavior closure; it is not a global coverage or source entitlement certificate. Source-use/credits and final intended profile are coordinated with the source-freeze record; actual configured accounts and host remain external release evidence.

## Semantic evidence map

| Case | Accepted local behavior | Evidence and limit |
| --- | --- | --- |
| Named town/site, ambiguity/fallback | Bounded selected snapshots; exact selected identity/revision, no alias retry; source failures differ from emptiness | Existing `api-discovery.test.ts`, selection contracts; real named India receipts below. |
| Near-me, coordinate/address input | API near-me makes no location request; typed coordinates/numbered addresses rejected; named fallback retains selected site | `api-geography-flows.test.ts`; shared schemas. Provider-returned coordinates are permitted source data. |
| Point radius and multiple origins | Exact source point; 1–300km radius; any/all distance bands retained independently; deterministic ordering | Existing discovery and geography flow tests; no nearby-city substitution. |
| Country/state with selected identity | Structured type/country filtering; wrong metadata withheld; single region/provider-filter union needs no geometry or centroid | Existing region/discovery tests; current focused flows verify country/state and union. No accepted live country identity is inferred. |
| Region intersections, origin plus region, exclusions | Both geometry flags required; exact include/exclude Boolean constraints; unknown/boundary withheld; no unconstrained fallback | Focused geographic acceptance/flow fixtures. These establish algorithms/transport composition only. |
| Five includes plus five excludes | Ten references, ten geometry requests, five positive pages, 25 conservative credits; no exclusion-only positive search | Focused maximum-scope fixture. Eleven references remain rejected in retained scope tests. |
| Polygon/hole, islands, split antimeridian | Snapshot-relative shell/hole and boundary semantics; split MultiPolygon supported; unsplit/complex unsupported geometry rejected | Focused snapshot tests. Artificial geometry proves parser/classifier behavior, not real provider availability. |
| Failure, expiry and cache | Two-credit pre-reservation; deny before transport; revision-bound cache; expired selections/geometry cannot qualify; malformed/unsupported response has no fallback | Focused acquisition/flow tests; separate shared accounting and source configuration controls remain. |
| Access/timezone/suitability | Immutable exact point; access unknown; no safety/night opening/road/entrance guarantee; unknown source timezone requires display choice | Inspected discovery snapshots and retained MCP geography journeys. A display zone does not verify a site timezone. |
| Coverage | Bounded request completeness only; mapped-feature completeness unknown; page/result/failure limits make result partial | `server/places/api/discovery.ts`; retained geography matrix. No darkest/global/exhaustive/access claim follows. |

The detailed [geographic matrix](v1-geographic-acceptance-20261018.md) remains the source for exact cache/body/topology bounds and test names. No new test was added because the focused retained cases cover the concrete semantic boundaries and this audit established no missing implementation regression.

## Retained real-provider facts

| Retained record | Actual observed fact | Acceptance boundary |
| --- | --- | --- |
| `api-live-validation-results-20261017.md` | Three Geoapify named India points: Hanle, Kodaikanal, Munnar; all selected with Asia/Kolkata source evidence, with bounded weather integration | Named-point adapter integration only; not candidate quality or administrative membership. Original12-request allowance consumed. |
| `hyderabad-owner-live-results-20261017.md` | Accepted Hyderabad city point/timezone and selected revision; four total source requests including weather | City planning point, not observing-site access or region geometry. |
| `geometry-live-receipt-20261017.json` | One country text query, HTTP200,136bytes,445ms; no result; productionEnabled/sourceAccepted false | No usable administrative selection, no Details, no geometry. |
| `source-native-acceptance-results-20261017.md` | Later separately authorized unfiltered country query, HTTP200,149bytes,779ms, one reserved credit, selection-empty; no Details/dependent call | No accepted country identity; neither universal failure nor proven filter bug. Its allowance is consumed. |
| `activity-viewing-window-correction-20261018.md` | Scoped owner1.0.27 journey passed numerical comparison against approximate Hyderabad baseline and qualified coverage/access | Useful scenario acceptance, not every-site ranking or live geometry. |

No record above is substituted with a synthetic success. Existing bounded local resource evidence remains accepted as measured: [compiled API probe](v1-api-resource-measurement-20261018.md), twelve MCP requests, eight workload responses, four overlapping clients, sampled RSS311.24MiB and five injected source dispatches. It proves bounded local process execution, not provider latency, cold/sustained demand, complete cache storage or2CPU/4GiB host capacity.

## One exact conditional missing live check

For the declared geometry-disabled profile, no new provider call is necessary to finish local default acceptance. Before claiming **enabled selected-geometry integration**, retain one separately authorized finite packet, rather than a requirement to test every country/topology live. Proposed packet: at most **3 Geoapify GETs,4 conservative credits,30seconds total,5seconds per request,262144 decoded bytes per body,786432 bytes total,zero retries/aliases/pagination**. Use the existing shared durable accounting; do not initialize/reset it or reuse consumed batch authority.

1. One `/v1/geocode/search` with exactly `country=Vatican City`, `type=country`, `filter=countrycode:va`, `bias=countrycode:none`, `limit=5`, `format=geojson`. Stop on empty, ambiguous, wrong-country/type, malformed or failed result. Retain one exact source identity/revision; never manufacture it.
2. Only if selection succeeds, one `/v2/place-details` for that exact returned upstream ID with `features=details,details.full_geometry` (two credits). Stop if identity, original Polygon/MultiPolygon, bounds/topology or expiry fails. Retain sanitized receipt, attribution, fetch/expiry/revision, original byte count and actual supported shape; do not promise a hole/island if absent.
3. Only if geometry succeeds, one `/v2/places` with exactly `categories=leisure.park` (the supported park category), `filter=place:<that exact selected ID>`, `limit=20`; run returned valid Points through the current snapshot classifier and retain source credits, counts and withheld/inside/outside outcomes. Empty results remain a recorded boundary, not a qualifying-site success. No other country, exclusion or point lookup follows.

This checks the currently absent real response chain and exact parser/selected identity/attribution composition. It does not certify every shape or administrative truth. Shell/hole/island/dateline/tie/oversize/failure semantics stay locally established by adversarial fixtures; real-source missing/unsupported cases remain honest outcomes. A successful packet supports its exact bounded integration only; any active broader claim must retain those limits. This proposal is **not executed or authorized by this record**. The existing six-request/nine-credit live script is a different envelope and must not be run as though it implements this narrower proposal.

## Independent Task15 local audit

Inspected `server/plugin.ts`, `server/mcp/route.ts`, `proxyTrust.ts`, `requestDiagnostics.ts`, `server/requestLogging.ts`, API HTTP/discovery/geometry acquisition, selected snapshots and `shared/nightsky/policies.ts`. No new demonstrated material code defect was established. This is targeted review evidence, not a universal security/compliance certification.

- Runtime accepts fixed provider origins/endpoint/query allowlists; redirect error, bounded bodies/deadlines/queues, exact geometry feature string and paired geometry flags prevent broadening a rejected query. Errors are bounded/sanitized; source keys do not enter public snapshots or diagnostic schema.
- MCP uses loopback Host defaults, explicit narrow immediate-proxy trust with forwarded-chain rejection, global/IP/protocol/tool/subject/key/concurrency limits,32KiB JSON parser and generic handler/parser failures. Pending tool work retains admission after transport completion. Actual TLS/proxy/client-IP behavior remains a host gate.
- Default logs use fixed route labels and method/status/timing. Diagnostics add generated request UUID, allowlisted protocol/tool labels and bounded outcome, without planning bodies/queries/coordinates/raw subjects. The corrected draft policy discloses that distinction, durable accounting and unverified host retention. UUID is not described as a user/session identifier. No privacy disclosure mismatch was found in inspected paths.
- Source points/representative geometry are not verified entrances, administrative vintage or access. Discovery preserves unknown access and source-specific timezone status; geometry receipts remain snapshot-relative. Source text is data, not assistant instruction. Model rendering of required adjacent credits remains separate native evidence.
- Task15 local code/claim review may be accepted with this scoped no-new-material-finding conclusion, combined with coordinator artifact/type/security and native evidence. It cannot close actual host/account/rights/retention/publication/pilot gates or prove all clients.

## Fresh focused verification

Executed offline on19October:

`node --import tsx --test tests/places/api-geographic-acceptance-matrix.test.ts tests/places/api-geography-flows.test.ts tests/places/api-geometry-snapshot.test.ts tests/places/api-geometry-acquisition.test.ts tests/operations/policies.test.ts`

**45 passed,0 failed/skipped, exit0.** Tests use injected provider transports and synthetic geography; no live provider request occurred. A preceding six-file run also included `tests/operations/requestLogging.test.ts`:45 passed and its only failure was sandbox loopback `connect EACCES127.0.0.1`, before its assertion. Coordinator owns a permitted loopback rerun and aggregate/release verification. No failure was suppressed or converted into a passing logging claim here.
