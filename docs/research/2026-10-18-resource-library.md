# Resources library research and update

The user requested a substantive expansion of the Resources page using subagents, current research and website-only implementation. The existing rounded design is retained. No plugin files, publication or deployment are part of this task.

## Selection

Three researchers independently checked official sources for observing/weather, photography/equipment, and learning/research/conservation. The parent reviewed their records, removed overlap, independently checked representative sources, and added the verified SIMBAD research service.

The selected library contains **46 resources**, reviewed **18 October 2026**, across nine topics. Formats comprise 19 tools, 13 guides, seven learning materials and seven communities. All nine former subjects remain covered; original destinations were refreshed where the official provider has a more useful current page.

The first twelve entries offer a mix of observing, learning, photography, places and participation. More specialist resources remain accessible through search, filters and Show more. Search matches names, providers, descriptions, topic labels and format labels. Provider names and supported access labels are visible on cards; exact prices are deliberately omitted. Missing cost labels mean no blanket pricing claim was established.

## Evidence

The per-entry first-party source URLs, verification notes, review dates and deferred candidates are recorded in [resource evidence](2026-10-18-resource-evidence.json). This is editorial evidence, separate from the customer-facing descriptions.

Material limits remain in the descriptions where they affect a choice: regional weather coverage, software/device requirements, paid editions, advanced course prerequisites, and separate destination-access checks. Forecast pages are linked as tools; no live conditions or visibility guarantees are published.

Examples of decisions:

- Use current American Meteor Society FAQ and NOAA destinations instead of legacy routes.
- Keep public astronomy lessons and smartphone photography alongside specialist imaging tools.
- Include active Galaxy Zoo, Planet Hunters TESS and Daily Minor Planet project pages; defer Backyard Worlds after its project page reported no available data.
- Defer Globe at Night submission flow, IUCAA lectures, VizieR, IMO calendar, Sequator and DeepSkyStacker where the official content could not be sufficiently checked.
- Defer ADS after the parent browser rendered navigation/footer without the search panel; include the directly verified SIMBAD database instead.
- Keep astronomy project participation distinct from NightSky's own forthcoming Collective.

## Verification checklist

- [x] New library navigation and provider/topic search checks failed before implementation.
- [x] Three independent research records reviewed; duplicates removed and evidence preserved.
- [x] Add 12-card progressive reveal with focus on the first newly revealed link; reset reveal count when filtering or navigating history.
- [x] Browser checks: filtering, history/reload, reveal through the final batch, keyboard focus and 200% mobile text.
- [x] Unit tests, TypeScript checks and production preview build.
- [x] Actual desktop/mobile visual review and focused independent review.

No accounts were created, software installed, messages sent or citizen-science classifications submitted during research.


## Final results

- Full browser suite: 88 passed (1.4 minutes), including reveal through 12 → 24 → 36 → 46, no duplicates, final-batch focus, filtering, history/reload and enlarged mobile text.
- Unit tests: 36 passed. Application and browser-test TypeScript checks passed. Production preview build passed; only the existing non-blocking toolchain/bundle warnings remain.
- Actual desktop (1440px) and phone (390px) views inspected, including long topic labels, provider/access metadata and conservation results. Automated reflow checks cover 320/390/768/1440px and 200% text.
- Independent final reviewer reported no important findings and independently confirmed all 46 production IDs/URLs match the evidence record, every category is populated, and reveal/focus works through the last batch.
- The preview remains available at http://localhost:5178/resources with all filters reset. Plugin code, publication, deployment and Git history were not changed.
