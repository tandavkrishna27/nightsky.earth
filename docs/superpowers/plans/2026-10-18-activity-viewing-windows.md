# Activity-aware viewing-window correction

## Scope and evidence

Owner native1.0.27 discovery now has its demonstrated pass; retain that without repeating it. Milky Way geometry was returned correctly but0.3degree core altitude was described as a useful start. Its5am endpoint may be the requested cutoff, not set. Geminids used the entire astronomical-darkness interval as a beginner outing schedule. Fix these semantic errors using existing local geometry and event evidence. No new providers, live calls or datasets.

## Source audit

shared/nightsky/events.ts already separates peakUtc from peakCalendarDateWindow, recurrence/civil guidance and uncertainty. shared/nightsky/meteors.ts exposes dated radiant samples and model qualifications, not an optimum or guaranteed meteor rate. server/nightsky/astronomy.ts calculates above-zero intervals clipped to requested bounds, plus timestamped positions and sampled maxima. No universal useful-altitude threshold or forecast score is justified.

## Tasks

1. Add optional startBoundary/endBoundary to targetVisibilityResultSchema, enum requested-window/horizon-crossing. Existing stored fixtures remain valid; new producer emits both for every above-horizon interval. Equality with requested endpoint is conservatively requested-window, even if a crossing happens exactly there. Partial intervals must never imply actual rise/set. Unsupported targets retain empty intervals.
2. Label boundaries in answer-ready target text and preserve below-horizon/low samples and existing byte caps. Do not invent geometric intervals for missing legacy boundary metadata. Explain geometric opportunity is not a recommended observing session; a sampled maximum is within requested interval, not a continuous optimum. Test clipped, crossing and legacy output.
3. Update all five skills/canonical workflows with activity-specific timing: published peak/precision/year/source separately from local darkness/radiant/Moon evidence, practical suggested session and weather-supported evidence. No exact peak invented from calendar range, recurring average or radiant model. Peak in local daylight or uncertain peak stays explicit; qualitative later-night guidance must be labelled general if radiant geometry absent. No guaranteed rates or rigid after-midnight rule for every shower. Naked-eye broad sky, never staring at radiant.
4. Milky Way/planet/comet/eclipses: geometric rise is not useful altitude; use actual timestamp samples to explain changing height and terrain risk. Suggest practical sub-session only as advice with visible rationale/uncertainty; no universal invented threshold, optimum or weather guarantee. Preserve specific contact predictions/visibility scope for eclipses; unsupported targets require appropriate available ephemeris, no generic window substitute.
5. Tests: producer short-window bounds and real crossing, full-schema compatibility, answer text legacy and boundary labels, workflow requirements across10files. Existing exact source-time/rate/meteor tests remain intact. Run affected tests, types, build/package/compiled checks and full suite. Review plan and implementation independently; controlled offline behavior cases cover daylight peak, calendar-only uncertain peak, low target and cutoff.
6. Package1.0.28 under same identity, verify installed files. Record native outcomes honestly in tracker/report; wording correction remains native-pending. Commit/push and watch exact-commit CI. Preserve unrelated source-policy edits. No deployment/publication.

## Completion boundary

Passing this correction closes the identified timing engineering issues, not all V1 tickets. Final targeted native timing test and reconciliation of remaining release gates are still required. No new native session is authorized by this plan; preserve original live allowances and expiry.

## Plan review
Independent reviewer requires geometric wording in planner factors/candidate-window rationale, bounded source-bound peak/calendar and radiant evidence early in answer text, plus mixed clipped/crossing and legacy tests. Incorporated before completion.
