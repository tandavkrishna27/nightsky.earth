# Calendar source expansion — 16 October 2026

## Admitted field

Added one bounded factual calendar entry: **GEM / Geminids / December**, giving three guidance entries with the retained ETA and ORI wording. The primary source is [NASA/JPL, What's Up - December 2023](https://www.jpl.nasa.gov/videos/whats-up-december-2023/), dated 2023-12-01, transcript, first sentence of the Geminids paragraph. The speaker identifies himself as Preston Dyches of JPL. The sentence expressly describes annual recurrence; the following 2023 peak and Moon conditions are separate and are not admitted. Inspected through the public web reader on 2026-10-16.

The admitted value is solely the calendar month fact, preserving the source's month token. No sentence, table, video, photograph, rate, date range, observing recommendation or annual forecast is reproduced. This is a field-level factual extraction from original explanatory content, not an import of the JPL Meteor Streams compilation. Its attribution identifies the source, date and NightSky transformation. `licenseUrl` is deliberately absent: the [JPL image policy](https://www.jpl.nasa.gov/jpl-image-use-policy/) expressly covers images/video and is not presented as a blanket transcript-text license. Neither NASA hosting nor a public-domain assertion is the admission basis. This narrow factual extraction decision does not approve wholesale copying of the source or replace source-specific dataset reuse review.

The reviewed project documents require provenance and rights review and reject assumed rights from NASA hosting; they do not require a blanket prose license for an individually extracted calendar fact. Existing `SourceRecord` already makes `licenseUrl` optional. The factual extraction scope, original authorship and absence of copied expressive material are the recorded basis for this admission, rather than an invented license. This is the project's bounded source decision, not legal advice about arbitrary reuse.

## Runtime and checks

`meteorCalendarGuidance` remains optional and partial. The bounded unique-code schema now admits ETA, ORI and GEM, maximum three rows. GEM retains `precision: verbal-period`, `recurrenceBasis: typical-annual` and `requestedWindowOverlap: not-evaluated`; December does not mean activity throughout the month. The result's source list includes the JPL reference and the reason reports three periods. Guidance remains outside dated events and limits, with no peak UTC, overlap or radiant validity extension. Existing strict clients must consume the refreshed advertised schema; old two-row payloads remain valid.

TDD regression first failed specifically because GEM guidance was absent (five prior cases passed). After implementation, all ten focused event/MCP tests passed, including the real HTTP structured-content path. `npx tsc --noEmit` passed. The event test checks source identity, no invented license, attribution, inclusion in the result source list, unsupported-year empty dated events, and the existing rejection checks cover invented UTC/precision/overlap for all three entries. No provider/model calls, credentials, source dataset acquisition, deployment or commit occurred.

## Other inspected candidates and limits

- [NASA Geminids overview](https://science.nasa.gov/solar-system/meteors-meteorites/geminids/) identifies AMS and NASA MEO source inputs. Its calendar compilation was not imported.
- [NASA Marshall release M13-136](https://www.nasa.gov/news-release/nasa-marshall-expert-bill-cooke-available-to-discuss-geminid-meteor-shower/), dated 2013-12-09, is original agency communication but mixes its December date range with 2013-specific viewing and forecast context. No typical full season or recurrence was inferred from those days.
- [NASA's 2020 Perseid post](https://www.nasa.gov/blogs/watch-the-skies/2020/08/06/perseids-peak-watch-best-meteor-shower-of-the-year/) names Emily Clay and has annual August wording in a NASA/Bill Ingalls image caption. That separate caption field was not admitted in this bounded pass; the clearer original JPL narrative supplies the one additional field.
- Publisher requests for A&A 626 A25 (2019) and A&A 687 A181 (2024) returned 403. Search snippets are not admitted source evidence.

No complete UTC season, missing radiant fit or additional annual maximum was supplied. The retained seven missing radiant codes and the finite GMN/eclipse acquisition proposal remain separate work. An unknown asset size or an unpinned revision is not an executable acquisition approval; this calendar admission authorizes no such acquisition.
