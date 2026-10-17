# Meteor source admission — 17 October 2026

## Admitted capability

The event result now includes `meteorCivilGuidance` for LYR and LEO: source-named annual Gregorian month/day ranges, approximate 2026 maximum wording, source time basis, uncertainty, geographic qualification, locator and reuse attribution. These are reference facts, separate from dated UTC events. LYR is April 16–25; LEO is November 6–30. Endpoint clock times and time zone are unspecified. No UTC midnight, guaranteed activity or requested-window overlap is manufactured. The 2026 maximum wording never recurs into another year; the planner only summarizes it for a request wholly within 2026.

Inspected original pages: [IGN Lyrids](https://astronomia.ign.es/en/web/guest/liridas), opening paragraph and “What to expect in 2026”; [IGN Leonids](https://astronomia.ign.es/en/leonidas), same sections. Lyrids specify approximately April 22 at 19:40 UT. Leonids describe the November 17–18 night, approximately 23:45 UT. The latter date wording remains intact rather than choosing a UTC date. Neither page gives numerical timing uncertainty or a content update date; the 2025 footer is not treated as one. Source review date is metadata, not publication date.

[IGN legal notice](https://www.ign.es/web/es/ign/portal/info-aviso-legal), general scope, intellectual-property and RISP sections, explicitly permits content reuse subject to preserving meaning, source attribution, supplied update dates and reuse metadata, and avoiding endorsement claims. This resolves the previously unavailable reuse evidence. The implementation links those terms and attributes IGN; it does not assume the geographic-data CC BY policy applies to every astronomy page. Only individual calendar facts are structured; no images, design or full text are copied.

## Local observing evidence

For one selected shower, the planner now samples every 15 minutes plus the exact endpoint, with at most 97 samples over the already limited 24-hour session. Available points retain altitude, azimuth, Moon altitude and separation, fit domain, provenance and extrapolation. Unavailable points retain timestamps and reasons with no invented coordinates. The summary reports supported/total sample counts and ranges; it does not infer continuous visibility between points. Existing darkness and weather evidence remains independently sourced. A request never fans out over every shower. The nineteen retained identities and existing NASA maxima are unchanged.

## Finite unresolved evidence

The official non-www [2026 calendar](https://imo.net/files/meteor-shower/cal2026.pdf) and the restoration page's own [2027 link](https://imo.net/files/meteor-shower/ShCal27s.pdf) both returned HTML restoration notices on inspection, not inspectable PDFs. A finite alternative-calendar search did not recover an accessible official PDF. Search-index excerpts and a third-party ResearchGate copy were not used for admission. The prior source-resolution record already covers www alternatives and AMS discrepancies; no bulk acquisition or provider API was used here.

Missing UTC maxima remain the previously inventoried cells; the new LYR/LEO approximate references are useful evidence, not additional NASA UTC rows. ORI/NTA/STA 2026 and LYR/ORI/NTA/STA 2027 still need directly inspectable source qualifications. DRA/URS drift coverage remains absent. Annual civil guidance does not extend any radiant fit or certify full activity-season coverage. AMS's conflicting CAP period and differing Lyrid range are not silently reconciled by replacing them with IGN values: IGN is explicitly one source's guidance. Recovering the IMO calendar is an evidence-access task, not an additional permission gate on public facts.

## Validation

Targeted catalog, meteor-planning and meteor-radiant tests passed 35/35, including 97-point limit, non-cadence endpoint, source attribution, civil/UTC separation, 2026-only maximum usage and unavailable model coverage. `npm run check` passed after final edits. Tests are in the existing imported files; no new test import is needed. Root owns the combined suite. Full-season recommendation and scientific completeness are not claimed.
