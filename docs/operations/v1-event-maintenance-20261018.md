# V1 event maintenance — 18 October 2026


> **19October owner scope amendment:** [Supported V1 calculations with explicit gaps](v1-bounded-event-scope-20261019.md) resolves the earlier pending decision. Wider missing scientific coverage is deferred enhancement; it is not newly supplied evidence. Known incorrect results, scientific domains, source rights and actual release gates remain mandatory. The historical findings below are retained.

The confirmed maintainer is **NightSky.earth**. The owner's API-only V1 decision retains **all existing supported evidence**. The operational selection is recorded in `data/events/event-maintenance-v1.json`, including all **19 meteor identities**, their explicit gaps and the seven implemented event families. Selection does not certify scientific completeness or turn every retained identity into a dated visual event.

`meteor-evidence-inventory-v1.json` and the runtime `meteorCoverage` selection fields remain frozen audit evidence. Their `pending-owner-decision` / null maintenance fields describe the earlier audit state, not current launch selection authority. This operational manifest supersedes those fields for maintenance responsibility and selection only; their scientific validators and finite evidence states remain authoritative. Nothing here widens a runtime scientific admission.

## Finite evidence and remaining gaps

The [event/history profile](v1-event-history-profile-20261018.md) supplies detailed domains, sources and retained rights evidence. The machine maintenance manifest preserves actual NASA maxima: **13 in 2025, 13 in 2026, 12 in 2027**, with exact supported and missing identities for each year. Beyond those years no dated maxima are admitted. Missing maxima do not imply meteor inactivity.

There are **12 radiant models**, each restricted to **2018–2030 plus its own nominal solar-longitude fit width**. Reuse beyond the observations of 2018-12-10 through 2021-05-22 remains extrapolation. The **18 verbal / 5 civil / 2 typical solar-longitude** identity sets are separately typed source context. There are **zero complete UTC activity seasons**. The 2026 IGN maximum wording cannot become exact UTC clocks where none were supplied or recur into another year.

Planetary alignment/elongation support remains 1900–2100; planet-pair RA crossings remain 21 pairs in 2025–2027 with unresolved intervals and no completeness certification. Moon phases, seasons and eclipses have no separately admitted scientific year range; the request duration gate is not arbitrary-date accuracy admission. Unsupported occultation/comet/other types remain unsupported. Bounded local samples are not continuous visibility or detectability guarantees.

## Annual review procedure

The operational default is review every **18 October**, next due **2027-10-18**. This is a schedule, not a completed future review or an automation. Additional review is needed before extending finite evidence horizons, or after a source correction, rights change, engine upgrade or numerical/model-domain change.

NightSky.earth checks the maintained roster against the runtime and source admissions, reconciles supported/missing year cells, retains original precision/qualifications and rights attribution, and records the review date, next date and unresolved gaps. New artifacts or changed models require their existing source/scientific admission workflow and separately authorized acquisition. This task authorizes no requests or downloads. If no newer evidence is admitted, retain the original finite horizons and report unavailable results honestly.

After the due date, label maintenance review overdue until a recorded review occurs. Do not shift the due date automatically, infer a new forecast year or imply scientific accuracy has been refreshed. This operational default does not require another owner selection decision for the existing breadth.

## Offline validation

`node --import tsx --test tests/events/eventMaintenance.test.ts tests/events/meteorCoverage.test.ts` passes **12/12**. The two new tests first failed because the maintenance manifest was absent. They then passed with the manifest, cross-checking all retained identities and every supported/missing peak cell against actual runtime evidence. The existing ten inventory/domain tests also pass. This is finite consistency evidence, not universal celestial-event accuracy certification.
