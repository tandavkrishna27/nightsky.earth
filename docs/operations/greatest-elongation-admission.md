# Mercury and Venus greatest elongation admission — 17 October 2026

This bounded addition follows the explicit instruction to implement conventional geocentric greatest elongation within existing V1 scope. It does not close the broader planetary-event journey, implement apparent planet-pair conjunctions, change meteor coverage or alter the shared acceptance accounting. Starting delivery was `6b35666c7193093bb619c56a2273221f2e76a627`; its six-job [documentation CI](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38958674854) passed before implementation continued.

## Independent reference admission

The [NAOJ 2026 phenomena table](https://eco.mtk.nao.ac.jp/cgi-bin/koyomi/cande/phenomena_f_en.cgi), read in its default published state without submitting a calculation request, labels its civil times **UT+9h**, with ΔT = 69 seconds. Elongation times are displayed to whole hours and angles to arcminutes; a rounding rule and detailed apparent-coordinate correction flags were not established. The [NAOJ glossary](https://eco.mtk.nao.ac.jp/koyomi/faq/phenomena.html.en) defines elongation as angular distance from the Sun as seen from Earth and associates eastern elongation with evening and western elongation with morning. This is a full angular distance, not an ecliptic-longitude difference. Narrow reference facts are attributed **(c) NAOJ**, following its [reuse terms](https://eco.mtk.nao.ac.jp/koyomi/site/index.html.en); no images, ephemeris dataset or source software was acquired.

| Body / geometry | Source display (UT+9h) | UT representative in ISO form | Angular magnitude |
| --- | --- | --- | --- |
| Mercury east / evening | 2026-02-20 03h | 2026-02-19T18:00:00Z | 18°07′ |
| Mercury west / morning | 2026-04-04 07h | 2026-04-03T22:00:00Z | 27°49′ (source signed −27°49′) |
| Venus east / evening | 2026-08-15 15h | 2026-08-15T06:00:00Z | 45°53′ |

Before running the engine, the regression envelopes were fixed at **60 minutes and 2 arcminutes**. These are finite engineering comparisons allowing for source display resolution and model differences, not measurement uncertainties or a universal accuracy claim. ISO formatting does not upgrade the published UT precision to exact UTC. Numerical solver tolerance also does not establish physical accuracy.

A matching-definition, exact Venus-west time/angle reference remains unadmitted. [NAOJ's January 2027 page](https://www.nao.ac.jp/astro/sky/2027/01-topics02.html) supplies the Japan calendar date January 4, without an exact time/angle. A [Taipei 2025 page](https://tam.gov.taipei/News_Content.aspx?n=B64052C7930D4913&s=53FFA3EF9430B2B0&sms=2CF1F5E2E0B96411) gives a clock time and angle, but its time zone and reuse terms were not established in this investigation. No UTC offset is inferred. Venus-morning output therefore has native-method/contract regression coverage, without an admitted independent numerical oracle.

## Calculation and evidence contract

The pinned MIT-licensed Astronomy Engine 2.1.19 `SearchMaxElongation` supports Mercury and Venus. Its `elongation` is the full geocentric Sun/body angle, using light-time and aberration corrections; `ecliptic_separation` is not substituted. The library's global morning/evening classification is Sun-relative geometry. It cannot establish observer horizon clearance, darkness, visual detectability, weather or a local observing window.

The distinct `greatest-elongation` event type carries a required instant and strict body/angle/morning-or-evening metadata. Local visibility is always `not-evaluated`; duration and calendar-window fields are forbidden. Existing payloads without the new optional metadata retain their contract. Existing source attribution identifies the library, pinned version, license and NightSky calculation modification.

The engineering horizon is 1900–2100, with existing request duration and result limits. Canonical annual anchors make event IDs and computed instants independent of query start. Each body stream advances strictly and has an explicit bounded-search exhaustion error; final filtering is inclusive and global sorting/truncation remains in the catalog. Horizon-only requests outside the supported range return out-of-horizon; mixed requests retain other supported evidence and the gap. No all-years physical accuracy guarantee is made.

The MCP description and canonical/exposed sky-event skills preserve these distinctions. A composed planner regression checks that a real elongation is retained as sourced event evidence while its sky-event impact remains unknown. A named-place observing recommendation still requires separate supported target visibility, darkness and forecast evidence. Never suggest unfiltered solar viewing.

Verification and independent review outcomes are recorded in the [lane handoff](SESSION-events-HANDOFF.md). This source/implementation record does not authorize deployment, installation or publication.
