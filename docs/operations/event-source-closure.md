# Event source closure — 16 October 2026

## Scientific decision: daytime Sextantid drift

The original [Kipreos et al. arXiv 2208.03521v1](https://arxiv.org/html/2208.03521v1), Sections 3.3 and 3.7, does not supply a single interchangeable linear radiant model. Its wavelet ephemeris links per-degree maxima and shows an inflection near solar longitude 193 degrees, with possible background confusion. The flux analysis replaces linear drift with convex-hull positions per bin. Figure 5 search resolution is not physical model uncertainty. The abstract's noticeable-activity interval is not a UTC season definition. Section 3.5.3's reliability criterion concerns mass-index correction, not season boundaries.

**Decision:** do not fit a line from the figure, treat a search domain as validity, or transplant a GMN convention. Next acceptance needs numerical ephemeris with uncertainty, supported bins/interpolation and coordinate/time conventions; an independent direction reference; and a justified year horizon. No observational or software archive was acquired. The paper's repository distribution license is not a blanket reuse grant. Its individual introductory annual fact is admitted separately below.

## Four individual annual facts admitted

| Code | Retained wording | Primary source and locator | Scope |
| --- | --- | --- | --- |
| QUA | early-January | [NASA Science, Quadrantids Meteor Shower](https://science.nasa.gov/solar-system/meteors-meteorites/quadrantids/), About the Meteor Shower, first sentence; inspected 2026-10-16 | Explicit yearly peak context; not the adjacent AMS/NASA Fast Facts table or its dates/rates. Page has no pinned publication date; provenance uses review date. |
| DSX | late September and early October | Kipreos et al. v1, Section 1, introductory annual description, deposited 2022-08-06 | Daytime context retained; no nighttime visibility recommendation. |
| ARI | on or near June 8th | [NOAA/NWS Sioux Falls, Meteors and Meteor Showers](https://www.weather.gov/fsd/meteor), daytime-shower narrative paragraph; inspected 2026-10-16 | Sentence explicitly calls Arietids annual. Preserve approximation and daytime limitation; exclude rates and the separate compiled table. |
| CAP | late July | [Lowell Observatory, Two Meteor Showers: One Fabulous Night](https://nightsky.jpl.nasa.gov/events/12408/), Night Sky Network listing for 2020-07-28, first narrative sentence | Explicit Every year phrase precedes a separate This year peak statement. Only annual month wording is retained. Attribute Lowell; hosting does not imply NASA owns the narrative. No media acquired. |

All four are bounded factual extraction from explanatory narrative, following the existing calendar-source policy. Each preserves source identity, locator, transformation attribution and verbal precision. None asserts a blanket article license; `licenseUrl` is absent. Adjacent tables, figures, rates and year-specific forecasts are excluded.

The contract now accepts ten unique rows, up from six, while retaining compatibility with earlier payloads. Search source aggregation derives these sources from actual guidance rows. All remain `typical-annual`, `verbal-period`, `requestedWindowOverlap: not-evaluated`. January 2028 queries still return no dated meteor events. ARI/DSX explicitly identify daytime applicability. No peak, UTC conversion, overlap, full-season drift or global V1 gate is inferred.

## Finite remaining decisions

1. Define a complete season measure for each of all 19 codes: a stated modeled threshold, detection criterion, or other justified measure. Exponential tails have no unique finite zero boundary.
2. Resolve the analysis-linked solar-longitude algorithm and correction/time convention for ETA/ORI before conversion; retain an equivalent independent ephemeris oracle and supported years. This wave did not locate new A58-linked evidence or acquire ephemerides.
3. Obtain original numeric models and uncertainty/domain evidence for AND ARI DRA DSX SSG URS ZPE. The DSX investigation above rejects the unsupported single-line shortcut. Twelve existing GMN models remain limited to their nominal fit windows.
4. Complete missing year-specific maxima separately: 2025/2026 HYD LEO LYR NTA ORI STA; 2027 AND HYD LYR NTA ORI SSG STA; all codes outside 2025–2027. Typical annual wording cannot fill those timestamps.
5. Remaining annual wording: AND DRA HYD NTA SDA SSG STA URS ZPE (nine). Lowell's generic Delta Aquariid wording was not silently assigned to SDA; a discriminating source is still needed. Draconid APOD migration did not expose the searched recurrence sentence, so no runtime fact was admitted from its search excerpt alone.

## Verification

TDD RED: four new discovery/provenance cases failed because QUA/DSX/ARI/CAP were absent. The first implementation then exposed absent aggregate sources; deriving source aggregation from guidance fixed that failure. Focused event suite: 43 passed. `npx tsc --noEmit` passed. Tests enforce exact retained phrase/provenance, daytime caveats, source aggregation, nonmeteor exclusion, no invented UTC/local-visibility fields, and unchanged radiant domain behavior. MCP initialization/structured-output tests: 4 passed. Earlier pre-integration `npm test`: 906 cases, 905 passed, zero failures, one skipped (144.4 seconds). Subsequent integrated verification caught stale six-period wording in the catalog availability reason. An initial exact-string replacement did not match, and its failed test output was obscured by truncated combined-command output; that attempt was incorrectly reported as passing. The corrected edit derives the count from returned guidance entries and verifies the edit landed. Separate affected event/catalog/MCP execution now passes all 30 tests, and a separate `npx tsc --noEmit` exits successfully. The coordinator will record the final integrated full-suite result; the earlier run is not evidence for the final tree. No deployment, external communication, commit or provider job occurred.
