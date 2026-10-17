# Events source resolution — 17 October 2026

> Superseded in part: IGN civil guidance and reuse admission are resolved in `meteor-source-admission-20261017.md`; the finite follow-up matrix and current skill behavior are in `events-skills-wave-20261017.md`. The candidate-only wording below records the earlier inspection, not current admission status.

## Disposition

Finite official-source inspection only; no datasets downloaded, live provider API calls, peak/radiant artifact changes, policy activation or deployment. All nineteen retained identities remain. The thirteen-shower proposal is not activated. New material below is research evidence, not admission or scientific certification.

## Missing meteor evidence

| Gap | Official evidence inspected | Admission disposition |
| --- | --- | --- |
| LYR 2026 maximum | [IGN Lyrids](https://astronomia.ign.es/en/web/guest/liridas), 2026 section: approximately 22 April, 19:40 universal time. Annual visibility guidance spans April 16–25. | Candidate approximate UT forecast; no UTC conversion or activity endpoints admitted. Source timing uncertainty and calendar endpoint semantics need review. |
| LEO 2026 maximum | [IGN Leonids](https://astronomia.ign.es/en/leonidas), 2026 section: approximately 23:45 universal time on the November 17–18 night; annual guidance November 6–30. | Candidate approximate maximum. Resolve the exact date convention and UT/UTC interpretation before machine admission. |
| LYR/ORI/NTA/STA 2027; ORI/NTA/STA 2026 | [IMO 2026 URL](https://www.imo.net/files/meteor-shower/cal2026.pdf), [2027 URL](https://www.imo.net/files/meteor-shower/cal2027.pdf), and its linked [ShCal27s.pdf](https://www.imo.net/files/meteor-shower/ShCal27s.pdf) returned HTML website-restoration notices on direct inspection. Indexed 2026 excerpts identify Table 5, Table 6, and shower sections. | Search excerpts are locator evidence only. Full PDF content, qualifications and drift tables could not be inspected; no missing cell resolved. |
| DRA / URS radiant models | [AMS annual list](https://www.amsmeteors.org/meteor-showers/2020-meteor-shower-list/), labelled 2026 despite legacy URL, lists a Draconids GIA row and Ursids row with coordinates. It also reuses STA for October Arietids and Southern Taurids, and explains its time column is observing geometry rather than necessarily peak timing. | Single coordinates do not establish frame, epoch, drift or full-season validity. GIA/DRA identity and duplicated STA require explicit reconciliation; no radiant model admitted. |
| Activity seasons | [AMS calendar](https://www.amsmeteors.org/calendar/) contains civil-date ranges, including LYR 2027 April 14–30 and URS 2026 December 17–26. CAP's displayed range and prose disagree. | Dates remain source-qualified guidance; inclusive endpoint/time-zone semantics and disagreement are unresolved. No UTC midnight fabrication or full-season fit extension. |

The [AMS terms](https://www.amsmeteors.org/legal/) require permission for reproducing protected publication structure and content; free access is not a reusable artifact license. The [IGN data-policy link](https://www.ign.es/web/ign/portal/politica-datos) did not expose substantive policy text through this inspection. Reuse admission remains unresolved for the candidate IGN facts. No permission request was sent.

These findings leave the nine missing proposed-scope maxima, complete activity seasons, and DRA/URS full radiant models unadmitted. The six additional retained identities keep their existing states; none are silently dropped. Next finite action: recover the official calendar PDFs and inspect Table 5, Table 6 and each relevant section with reuse terms; review IGN peak definitions independently; establish source-specific activity semantics. E3 full-season meteor recommendations remain dependent on that evidence.

## Independent local conjunction implementation

`sampleConjunctionWindow` in `server/events/intervalVisibility.ts` evaluates two planet altitudes, Sun altitude, Moon altitude and Moon illumination every fifteen minutes plus the exact requested endpoint. It uses existing Astronomy Engine 2.1.19 topocentric coordinates and geometric horizon at zero observer elevation. Bounds are 24 hours, 97 samples and six returned pair events per plan. No slope envelope or continuous sign certification is claimed.

`shared/nightsky/events.ts` validates the separate geometry contract and ordered sample endpoints. `shared/nightsky/planning.ts` exposes `evidence.conjunctionWindows`; `server/nightsky/planner.ts` supplies selected-point geometry while preserving the original crossing metadata and `localVisibility: not-evaluated`. Weather remains separately sourced forecast evidence at its native cadence; absence or stale/unavailable status is an explicit gap. Solar altitude is context without a planet visibility threshold. No detectability, terrain, atmospheric extinction or continuous observing interval is inferred. This is useful sampled evidence, not closure of E4's full local-window acceptance.

TDD observed missing-helper and missing-planner-evidence failures before implementation. Focused tests passed 36/36 across conjunctionWindow, localHorizon and optional-event-evidence; `npm run check` passed. The added dark above/below-horizon fixtures exercise local geometry, not independent astronomical event certification. Root integration owns full-suite verification and import of `./events/conjunctionWindow.test` in `tests/all.test.ts`.


Boundary follow-up: exact 24 hours produces 97 samples; seven supplied pair events retain all event evidence but only six local geometries plus a cap gap; an opposite selected point changes the Sun samples; over-24-hour planner input is rejected before provider calls. Oversize input cannot reach the geometry catch through the validated planner contract. New helper/planner files passed 24/24 and the final TypeScript check passed; root owns the combined suite.

Resource implication: the six-event ceiling permits 582 point samples, each computing four body positions plus lunar illumination. A local synthetic six-event/24-hour run produced 123,067 JSON bytes for the geometry array and took 36 ms in this environment (single run, not a latency guarantee or deployed-service measurement). Event IDs/numeric serialization affect size; source/caveat/other plan evidence adds further payload. Common Sun/Moon calculations are currently repeated per pair. The cap prevents unbounded expansion, but the maximum payload is material for tool clients and should be checked in actual client acceptance.
