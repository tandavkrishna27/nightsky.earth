# API-only V1 wave — 18 October 2026

## Scope and disposition

Owner-approved V1 uses APIs and host search. No bulk geography, direct OSM extraction, database or historical baseline preparation is required. Numerical history (original ticket9) is deferred, not completed; website18 remains separate. Existing legacy test fixtures and optional historical tooling are retained. Original categories remain12local done/5local acceptance/8release dependent/2separate-deferred, total27.

## Implemented

- Five packaged workflows and canonical guidance preserve returned contributor/copyright/licence credits, including location-selection clarifications. Removed contradictory URL-label compression advice.
- Sparse cloud values remain tied to actual timestamps; lowest returned sample is not proof of a clear hour or continuous observing window.
- API-only absent-history output explicitly says optional/unavailable and identifies ERA5 links as methodology references, not data used. Configured providers and legacy behavior remain intact.
- OpenWeather source metadata now carries ODbL1.0 and selection/normalization notice. Public activation still requires applicable attribution/logo and database-use obligations.
- Selected API readiness evidence and all27 original headings are reconciled in the linked readiness, scope and acceptance records. No optional source was activated or quota ledger changed.

## Review and verification

Independent lane and final replay reviews completed. Guidance regression104/104, OpenWeather25/25, API-history wording3/3 pass after observed red tests. Type checks, both host packages and compiled synthetic API/Public Universe/light-pollution runtime checks pass. All15 installed Codex package1.0.34 files match the generated package.

Initial1.0.34 replay retained a shortened OSM notice; preserved as a failed/partial baseline. Final revised replay passes the targeted requirements:4turns exit0, no timeouts;4MCP calls(2+1+1+0),1synthetic geocode,2synthetic weather calls,0external-provider attempts. Both location answers include contributor and ODbL credit. Explicit failed refresh preserves18/25/40% at20:30/21:30/22:30, with unknown freshness. Follow-up makes0calls and qualifies its conditional early recommendation as sampled instants, explicitly not continuous coverage. Its opener could still be more precise; no universal model/client claim follows.

The first restricted full-suite attempt encountered environment child-process/loopback restrictions. The final permitted offline run passed1,826tests,0failed,2skipped (1,828total), exit0; no provider data calls are authorized by that rerun.

## Remaining gates

Exact enabled production source/account/rights configuration, finite maintained event claims and schedule, final release artifact/security/requirements audit, actual public hosting/policy/host validation, submission and pilot remain explicit. Claude testing stays deferred. Any legacy full-release preflight history requirement must be reconciled with the API-only production profile before that profile is declared releasable; scope documentation alone does not pass it. No deployment, publication, scraping, new datasets or live provider requests occurred.

See [scope](v1-api-only-scope-20261018.md), [API readiness](v1-api-readiness-20261018.md), [acceptance](v1-api-only-acceptance-20261018.md), and [ticket matrix](v1-remaining-ticket-release-matrix.md).
