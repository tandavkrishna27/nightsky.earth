# Events offline closure — 17 October 2026

## Implemented inventory; original event requirements remain partial

`data/events/meteor-evidence-inventory-v1.json` retains all nineteen identities. Its maintained selection, annual owner and next review date remain null; selection is pending an owner decision. The thirteen-shower/2026–2027 proposal is not activated. Reviewed peak years describe existing artifacts, not a newly adopted maintenance policy.

`server/events/meteorCoverage.ts` computes independent peak/activity/radiant states and artifact references without copying peak timestamps. Existing peak catalogs are read through their reviewed admission validator. Peak support means only a year-specific NASA MEO forecast maximum. Missing cells do not imply inactivity. Beyond 2025–2027, peak state is out-of-horizon; 2028 does not inherit an annual maximum. All nineteen identities remain in every requested year's inventory.

Radiants retain source frame, anchor, nominal half-width and 2018–2030 evaluation bounds. Existing models are partial within those calendar bounds because their solar-longitude domains do not establish full activity-season coverage; outside the calendar bounds their state is out-of-horizon. DRA/URS remain missing. Complete year-specific activity evidence remains missing for every identity. ETA/ORI typical-interval metadata is separately referenced as context; it does not admit civil/UTC boundaries or requested-year overlap. Artifact schema validation rejects changed maintenance policy, duplicate retained/radiant codes, nonpositive fit widths and changed evaluation bounds. The radiant artifact is bound to its reviewed schema version, vintage, source URL, license and exact twelve code/anchor/nominal-width tuples; code substitution or domain widening requires a new reviewed admission. The inventory validator rejects duplicated/dropped identities, altered evidence references, fabricated seasons and unsupported selection claims by comparison to current artifacts.

## Offline verification

TDD: first assertion failed with `missing meteor coverage helper` before implementation. After implementation, `node --import tsx --test tests/events/meteorCoverage.test.ts tests/events/meteorPeaks.test.ts tests/events/meteorRadiants.test.ts` passed 24/24. `npm run check` passed all three TypeScript projects after replacing Set iteration with `Array.from` for the project target. The root integrator owns final suite evidence and test-entry import `import "./events/meteorCoverage.test";` in `tests/all.test.ts`.

The regression matrix records the proposed thirteen by two years solely for audit: 17 supported forecast maxima, nine missing maxima (LYR/ORI/NTA/STA in both years and LEO in 2026), eleven bounded radiant models per year, DRA/URS missing models, and zero admitted complete seasons. All six other retained identities stay visible. Existing independent radiant and peak tests remain unchanged.

## Exact remaining gates

- E1 policy activation: owner selects or amends the meteor scope and years, appoints maintenance owner and next review. No expiry warning can be truthfully implemented while these remain undecided.
- E2 admission: accept source-specific activity start/end precision, endpoint meaning, time/calendar basis, applicable years, uncertainty and reuse evidence. Resolve the nine proposed-scope missing maxima and DRA/URS radiant models; independently validate new radiant directions and full declared-window coverage. Existing fits cannot be extended by typical seasons or narrative calendar wording.
- E3 composed observing journey: depends on E2 admission. Full bounded interval evidence, uncovered intervals, darkness, Moon, hourly weather, local-midnight/DST and maintenance cases remain required. The inventory is not a planning recommendation and is not wired into planner responses.
- E4 planetary acceptance: owner confirms RA-crossing convention/horizon; retain partial/not-certified inventory. Admit a representative source packet with predetermined convention/correction/precision tolerances and resolve the separate Venus-morning maximum-elongation reference gap. Local conjunction observing windows still require per-body altitude, darkness/Moon/weather and missing-forecast cases. Existing numerical synthetic tests cannot certify astronomical references.
- Release and original ticket closure still require conditional comet/asteroid/occultation/transient disposition, configured-service measurements, actual journeys/client acceptance and owner gates identified in the implementation packet.

No external references were fetched or admitted, no sources downloaded, and no planner/schema behavior was changed by this lane. Missing scientific evidence remains missing.


