# Planet alignments wave — 2026-10-14

## Approved bounded design

Use pinned Astronomy Engine 2.1.19 `SearchRelativeLongitude` for Sun/Earth/planet alignments. Target 0° gives heliocentric-longitude opposition for Mars, Jupiter, Saturn, Uranus and Neptune; target 180° gives superior solar conjunction for Mercury through Neptune, and target 0° gives inferior solar conjunction for Mercury and Venus. Latitude above the ecliptic is ignored. Names, IDs and descriptions preserve the body and kind. These are neither minimum angular separation nor apparent planet-pair conjunctions. Existing schemas remain unchanged; the broad `planetary-conjunction` request has partial coverage with the omitted pair calculation stated explicitly.

Local visibility is not evaluated: an alignment instant does not establish nighttime, altitude, terrain, cloud conditions or detectability. Solar alignment is not an observing recommendation. Searches are confined to the engineering interval 1900-01-01 through 2100-12-31, a maximum 366-day input window and eight iterations per stream per UTC calendar year. At most three calendar years intersect such a window (including tiny boundary tails), with 14 streams, hence at most 336 primitive calls. The pinned primitive itself caps convergence at 100 iterations. Canonical year anchors keep IDs and instants stable across overlapping queries. This is a bounded support interval, not a blanket accuracy guarantee for every year. Out-of-range planet searches return no planet events and an explicit coverage state.

## Independent reference and chosen comparison scope

[NAOJ ECO 2026 phenomena](https://eco.mtk.nao.ac.jp/cgi-bin/koyomi/cande/phenomena_f_en.cgi) uses geocentric longitude relative to the Sun; [its glossary](https://eco.mtk.nao.ac.jp/koyomi/faq/phenomena.html.en) defines that convention. The runtime instead uses simultaneous heliocentric longitudes. Therefore a reference comparison is a coarse event-identity/timing sanity check, not a claim of exact geocentric conjunction accuracy. Before implementation the comparison envelope was set to two hours: it permits coordinate/light-time/model differences and rejects wrong dates or wrong alignment branches. It is an engineering comparison threshold, not a measured error bound. Tests also verify the runtime definition directly and inclusive filtering independently.

Tiny normalized test facts are credited `(c) NAOJ`; [ECO terms](https://eco.mtk.nao.ac.jp/koyomi/site/index.html.en), reviewed 2026-10-14, explicitly allow re-publication/re-use with credit. Times below are converted from UT+9 to UTC. No runtime NAOJ dataset or bulk download is added.

| Event | NAOJ UTC | Runtime minus NAOJ (minutes) |
| --- | --- | --- |
| Jupiter opposition | 2026-01-10 08:42 | −12.47 |
| Saturn opposition | 2026-10-04 12:29 | −16.10 |
| Uranus opposition | 2026-11-25 22:41 | −13.96 |
| Neptune opposition | 2026-09-26 01:36 | −9.07 |
| Venus superior solar conjunction | 2026-01-06 16:36 | −42.48 |
| Mars superior solar conjunction | 2026-01-09 11:41 | +29.03 |
| Mercury inferior solar conjunction | 2026-03-07 11:02 | −6.29 |

These differences are convention/model differences, not an independently measured error of the stated heliocentric definition. Direct definition tests require the runtime's relative heliocentric longitude residual to be below 0.001°. That property check is not an independent ephemeris accuracy reference.

## Verification

RED: all three initial public-search tests failed with missing Jupiter event, zero instead of one boundary event, and unsupported instead of out-of-horizon. GREEN: all five planet tests passed, including direct-definition residuals, overlapping query identity, both inclusive boundaries, year crossing, omitted Mars opposition in 2026, partial conjunction coverage, preserved unsupported comet/occultation classes and no local observability claim. Focused event suite: 45 passed. Initial full aggregate suite: 447 tests, 446 passed, one skipped, no failures; root owns the final aggregate import and final wave verification. Type checks passed. No deployment, commits, external dataset acquisition or source communication occurred.

## Meteor season review

[IMO 2026 calendar](https://imo.net/files/meteor-shower/cal2026.pdf) describes Table 5 as a changing working list of visual showers. Its activity ranges are an attractive primary reference, but this review found no explicit reuse grant; direct PDF retrieval also timed out. No season dates are imported, and activity-season coverage remains unknown. Existing NASA forecast peaks retain their original provenance and partial coverage. A public calendar's accessibility does not alone resolve redistribution rights or establish full-season radiant validity.
