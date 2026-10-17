# V1 answer presentation and darkness workflow

Work began 17 October; verified locally 18 October 2026. Local package **1.0.18**. This remains within existing V1 completion blocks; it does not reset ticket or wave counts.

## Answer contract

Lead with useful values, units and a brief explanation. Explain Bortle and SQM on first use, adapt to experience, and preserve dataset vintage and material uncertainty. Keep mandatory linked provider credits beside the relevant data or immediately below its table, following provider-specific wording and placement. Repeated rows from one provider do not need duplicate credits where its terms permit one table credit.

Do not copy a catalogue-wide bibliography into the answer. Keep only references supporting the answer's claims and mandatory credits visible; expand technical provenance on request using existing evidence. Do not repeat API calls merely to supply references. No credits website URL is invented or published by this change. A future website page supplements, rather than replaces, mandatory adjacent attribution.

The existing provider documentation supports this distinction: [DarkSkySites](https://darkskysites.com/api-access) explicitly requires an adjacent linked name; [Geoapify](https://www.geoapify.com/terms-and-conditions/) requires free-plan Geoapify and OpenStreetMap attribution; [MET Norway](https://api.met.no/doc/License) requires credit. This is not a finding that one generic footer satisfies every provider's conditions.

## Backend changes

`planAnswerSources` selects relevant references from an aggregate plan without changing its full structured source inventory. It removes references belonging only to the broad event catalogue, preserving records shared with location, astronomy, weather and other evidence. It retains selected meteor guidance and matches the planner's single-shower inference when no target was supplied. Distinct credit records remain distinct even when they share a URL.

API-mode plans now produce a single relevant credit section instead of both a bibliography and another full source-credit block. Full structured event coverage, provenance, licences and field values remain available. No astronomical calculation, provider admission, quota accounting or forecast value was changed.

## Skill and discovery changes

All five skills and canonical workflows use the same compact-answer contract. Conflicting older instructions to copy the entire aggregate Sources block were replaced; clarification, timezone and observing-safety rules remain near the beginning.

The place workflow now explicitly builds a bounded shortlist, resolves one to five exact candidate points and uses `compare_light_pollution` before claiming the requested darkness range. Reported regional Bortle labels remain leads. Partially overlapping class ranges remain uncertain; unknown coverage keeps a model-qualified shortlist tentative. Distance/routing and night access remain separate, removed driving limits are not silently restored, and nearest among evaluated points is not claimed to be the globally closest site. This adds workflow guidance, not a global darkness-search API or verified observing-site catalogue.

## Verification and limits

- Regression tests first reproduced the unrelated-reference dump, duplicate-section contract and missing presentation guidance. Review also caught an inferred-shower civil-source omission; its regression failed before the fix and passed afterward.
- **76 affected checks passed**, including actual API-mode MCP response wiring, source-record preservation, weather/planning regressions and both host package layouts. Types and backend/package builds passed.
- A controlled skill baseline reproduced the source-dump conflict. After-guidance synthetic scenarios retained required credits and useful explanations, omitted irrelevant references, expanded evidence on request and avoided inventing darker qualifying sites. These are controlled reasoning checks, not native installed-skill acceptance.
- Independent code/spec review has no remaining blocking finding after the inferred-shower fix.
- Full local regression: **1,677 passed / 0 failed / 2 skipped** (1,679 total), 248.1 seconds. Both compiled API/runtime checks passed with synthetic transports.
- Existing NightSky local installation updated to 1.0.18 through the supported installer; all 15 installed files match the prepared package. Local package SHA-256: `395532feba41e0c5f7e6c69dc41c91235bd1777fb6eb131b2d01f163348a19b3`. Backend bundle SHA-256: `73f927cfa7d75c6a7fac6e2967e667baf924319d9b0112f037f09f2b817998ad`.
- Branch CI is checked against the exact pushed commit after this record is saved. No fresh provider requests, browser scraping, historical downloads or deployment are part of this change.

The preceding owner-reported 1.0.17 light-pollution comparison passed its semantic review. The longer outing conversation remains a partial acceptance result: its ten-minute listener expired before the later darkness queries, and only two retained light-pollution points were available. Nothing here promotes those follow-ups into a successful live darkness comparison. The revised package needs a subsequent native answer check; live evaluation of new candidates requires its own bounded allowance.
