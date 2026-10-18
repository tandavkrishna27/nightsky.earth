# Activity viewing-window correction — 18 October 2026

## Native evidence and acceptance boundary

Owner1.0.27 discovery returned three evaluated numerical improvements against an explicitly approximate Hyderabad baseline, qualified unknown coverage/search completeness, and investigated approach evidence without claiming exact drive-up access. That demonstrated discovery scenario passes. Travel preference was retained and supported core/darkness/Moon calculations were used. Milky Way planning remains partial:0.3degree geometric rise was described as useful and5am was not distinguished from a calculation cutoff. Geminids response had useful broad-sky/preparation and future-weather limitations but used all-night darkness as the outing schedule. The current correction addresses these timing semantics; it does not certify all V1 journeys or releases.

## Design and implementation

[Reviewed plan](../superpowers/plans/2026-10-18-activity-viewing-windows.md). Version1.0.28 retains source activation, quotas, API inputs and default inventories. Target interval outputs add optional requested-window/horizon-crossing boundary metadata, preserving legacy fixtures. New local calculations emit both labels. Exact equality with request bounds conservatively means cutoff. Crossings remain geometric, not apparent rise/set or terrain clearance.

Answer-ready target and planner/candidate-window text distinguishes geometric opportunity from useful altitude and practical itinerary. Compact meteor text retains at most two relevant published event peaks/calendar ranges and three dated radiant samples, explicitly labelled by shower/model within1800UTF8bytes; full evidence remains structured. Overall8000byte planning cap remains. Source precision and unknown numerical uncertainty are preserved. No optimal threshold, meteor counts or forecast guarantee is invented.

Five skills and canonical workflows distinguish published peak, local geometry, practical suggested session and forecast evidence. Daylight/uncertain/calendar-only peaks, low targets and cutoff endpoints stay explicit. General late-night advice is not a universal shower rule. Eclipse/contact and unsupported-target limits remain activity-specific.

## Review and verification

Preimplementation review added planner-factor/candidate-rationale coverage and compact event/radiant evidence. Independent implementation review found unknown-target radiant leakage and missing sample identity. Regression reproduced leakage; target-aware filtering and shower/model labels fixed it. Removed accidental unused Moon-level boundary fields. Affected offline tests:129passed,0failed. The full suite exposed a candidate-rationale length regression in a stale-weather case; wording was shortened without relaxing the500character contract (longest supported target-name case476characters). Final fresh full suite after the fix:1,792passed/0failed/2skipped (1,794total). Types, package verification and compiled API/PublicUniverse/light-pollution synthetic runtimes pass with no external provider calls. All15 installed files match version1.0.28. Final compiled backend SHA256:1c9674631073538d06ee61620902a696d3511d57793971c0f02aa875cfc17298. Full-suite result above was verified before push. Exact-commit CI is watched after push.

A controlled offline behavior review distinguished local daytime peak from nearby night opportunity, preserved calendar-only uncertainty, treated0.3degree as geometric rise and19.7degree as a later sample rather than optimum, and labelled5am cutoff. This is not native-host acceptance. Targeted timing retest remains pending under a fresh valid allowance. No provider downloads, scraping, deployment or publication.

## What remains before calling V1 complete

- Native targeted meteor/MilkyWay timing acceptance with real tool outputs.
- Reconcile original ticket statuses against current API/search scope and evidence; do not change12Done/9Partial/6Notstarted by inference from this wave.
- Confirm remaining source/admission, unsupported-coverage, policy/publisher and host packaging gates in the tracker.
- Deployment configuration, public endpoint and publication/reviewer gates remain separate from local engineering completion.
