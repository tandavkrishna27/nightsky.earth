# Events and skills wave — 17 October 2026

## Finite source review and exact disposition

This wave re-opened the named remaining primary-source gaps, then stopped. No authenticated API, bulk dataset, additional event artifact or invented season was used.

| Evidence | Supported now | Unavailable / not admitted |
| --- | --- | --- |
| Proposed thirteen-shower timing matrix, 2026 | NASA rows for QUA, ETA, SDA, CAP, PER, DRA, GEM, URS (8/13) | LYR, ORI, NTA, STA, LEO (5/13) have no admitted dated UTC maxima |
| Same proposed matrix, 2027 | NASA rows for QUA, ETA, SDA, CAP, PER, DRA, LEO, GEM, URS (9/13) | LYR, ORI, NTA, STA (4/13) |
| LYR / LEO reference guidance | IGN annual civil ranges and approximate 2026 UT wording, with reuse terms and attribution | No exact UTC conversion, inferred endpoint clocks, annual recurrence of the 2026 maximum, or guaranteed activity |
| Radiants in proposed matrix | 11 bounded GMN fits; 15-minute points plus exact endpoint, maximum 97 for one selected shower | DRA and URS models; all-shower full-season validity |
| Pair-conjunction local context | Up to six returned pairs, 97 geometric samples each, selected observer point and independent darkness/weather | Continuous visibility, detectability, terrain, closest approach, exhaustive conjunction completeness |
| Retained identities | All nineteen retained; proposed thirteen remain an inventory comparison | No implicit removal of the six other identities or activation of proposed scope |

[IMO 2026](https://imo.net/files/meteor-shower/cal2026.pdf) returned restoration HTML. Following its own [2027 calendar link](https://imo.net/files/meteor-shower/ShCal27s.pdf) also returned restoration HTML (the initial direct request was inaccessible). Neither delivered an inspectable PDF; no Table 5/6 claims are admitted.

[AMS annual list](https://www.amsmeteors.org/meteor-showers/2020-meteor-shower-list/) remains labeled 2026 and provides isolated coordinates without a reviewed frame/drift/validity model. Its GIA label and duplicate STA identities still need reconciliation. Its time column explicitly concerns favorable radiant position and need not be a maximum. [AMS calendar](https://www.amsmeteors.org/calendar/) does not resolve the previously recorded civil-range contradictions or endpoint semantics. These sources justify no new UTC rows or radiant fits. Prior IGN reuse resolution remains valid as recorded in meteor-source-admission-20261017.md; the earlier events-source-resolution candidate status was superseded by that admission.

## Guidance changes

Removed the contradictory three-point meteor instruction. Both event guides now explicitly use conjunctionWindows, six-pair limits, sampled geometry and unchanged not-evaluated event visibility; clients should consume existing aggregate evidence before requesting duplicate calculations. All five packaged skills and canonical workflows retain selected snapshot geometry limits and explicit unavailable-history behavior. Existing global API discovery and exact revision/timezone handoff remain intact.

## Validation and release implications

A new static authoring regression failed against the stale three-point wording before editing, then passed. Targeted skills, meteor-coverage, meteor-planning and conjunction-window tests passed 60/60. These checks validate documentation contracts and implemented offline evidence; they do not establish installed-host behavior. No new subagent pressure evaluation was run because this lane explicitly prohibits subagents. No production code changed; combined integration checks belong to the root lane.

Full-season meteor recommendations remain blocked by the nine missing dated maxima, unavailable DRA/URS radiant models, and unadmitted season-wide domains. Useful qualified civil guidance and bounded local snapshots are available now. Public-source restoration is an evidence-access dependency, not a request for user permission. Actual host/client acceptance and deployed provider configuration remain separate release checks.
