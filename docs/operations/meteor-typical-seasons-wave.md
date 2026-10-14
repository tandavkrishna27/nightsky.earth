# Meteor typical season evidence — 14 October 2026

This implements the approved source-metadata fallback. It does not close V1 meteor completeness or accept reduced scope. No historical archive, bulk observations, account, email, deployment, commit or push was used.

## Accepted original result and reuse evidence

[Egal, Brown, Rendtel, Campbell-Brown and Wiegert (2020), A&A 640 A58](https://doi.org/10.1051/0004-6361/202038115) is available as an [author-hosted final publication PDF](https://physics.uwo.ca/~pwiegert/papers/2020AA-Egal-01.pdf). Its first page shows the same publication identifier, DOI, author copyright and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) notice. The publisher PDF/full HTML returned 403 in this run; byte identity against the publisher file was not established. The inspected author copy is publication-formatted, not a license inferred from repository hosting.

Original analysis in Sections 6.1.1/6.1.2 and conclusion Section 7 reports ETA 35–60° and ORI 195–220°. The introduction identifies solar longitude as ecliptic J2000. These are typical activity intervals; subpeaks vary between years. No Appendix D historical compilation, rates, fitted radiant extensions or annual peak times were imported. Attribution preserves all authors, exact work/version, license and transcription changes.

## Scientific conversion gate

The reviewed text does not resolve geometric versus apparent longitude, or a precise boundary UTC convention. Existing `solarLongitudeJ2000` uses geometric reversed heliocentric Earth position; `SearchSunLongitude` uses apparent longitude of date. A shared J2000 label does not by itself establish that the former matches the source. Independent validation of the radiant helper is not independent validation of this paper's season boundary convention.

No annual UTC conversion was accepted, so there are no calculated year windows to validate or expose. A future conversion needs an explicit source convention, a matching implementation and independent boundary references. This is a retained scientific gap, not an invented date approximation.

## Runtime contract

Meteor requests expose optional `meteorTypicalSeasons`, at most two unique source-only entries, separately from dated `events`. Each entry carries its source, ordered longitude bounds, `evidenceKind`, frame, `dateConversion: unavailable` and `requestedWindowOverlap: not-evaluated`. It is unfiltered reference evidence on every meteor query, including January or unsupported forecast years; its presence never asserts occurrence during the requested window. No UTC/peak/calendar fields are accepted by its strict schema. Nonmeteor requests omit it and its source.

Planner evidence already retains the complete typed event result, so no additional planner factor or schema change was necessary. NASA forecast maxima, event limits, radiant fit domains and unavailable/outside-model behavior remain intact. Full seasons for other showers, yearly maxima outside the retained NASA years, rates, outbursts and complete season radiants remain unresolved requirements.

## Bounded additional research

| Original resource | Evidence inspected | Disposition |
|---|---|---|
| [Moorhead 2019, arXiv 1910.10729v1](https://arxiv.org/abs/1910.10729v1) | Original methodological work on selection bias in measured shower duration; its license link is [arXiv nonexclusive distribution](https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html). | Useful methodological warning, no accepted reusable season catalog. Distribution permission to arXiv is not a general CC license. |
| [Deriving meteor stream properties from meteor count rate time series in a multi-observer network, PSS 272 (2026) 106246](https://doi.org/10.1016/j.pss.2026.106246) | Publisher search record advertises a Creative Commons license and analysis of 2019 Geminids forward scatter radio observations. Full publisher reading failed here. | Research lead only: exact license/version/results and applicability to a visual season remain unverified. No coefficients or bounds imported. |

These bounded leads do not establish a free complete catalog. Continue source-by-source rights and scientific review within the global/free V1 objective.

## Verification

TDD: the dedicated tests first failed because typical-season evidence was absent. Then the focused meteor/catalog tests passed (27 before the composed test; 28 with it). The four new tests check original bounds/provenance, absent fabricated dates/overlap, omission for nonmeteor queries, strict limits/order/required source and composed planner preservation without fabricated radiant evidence. `npx tsc --noEmit` passed. Existing `npm test` completed: 469 total, 468 pass, zero fail, one skip. The dedicated file is run separately; the root integrator owns `tests/all.test.ts` registration.
