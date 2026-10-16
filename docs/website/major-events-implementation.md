# Major-events coverage revision

User authorized source audit, expansion, detailed guides, timezone revalidation and local preview. Website only. Existing date window October 2026–September 2027. BASE 5ad2f3c.

## Definition of coverage
Include every eclipse and four principal lunar phases in the primary almanacs; every listed outer-planet opposition, inner-planet greatest elongation and solar conjunction; four seasonal turning points and Earth's perihelion/aphelion; all Moon occultation flags, Moon/bright-star pairings within 1 degree, non-Moon bright-object pairings within 2 degrees. Include all twelve in-window AMS major shower entries plus October Draconids from IMO indexed primary calendar evidence. These criteria are a reproducible completeness claim, not all possible astronomical phenomena or local observations. No new comet or aurora dates without verified event evidence.

## Work/checks
1. Record source rows and coverage manifest; write missing-event assertions and watch failure.
2. Add seasons/pairings categories, extend catalogue using original explanations, preserve existing occurrence IDs, correct shower source-night ranges and document disagreement. Add subject-specific equipment, sky geography, timing meaning, preparation, Moon context and activity reference in guide text. Peak markers only in calendar; do not flood date cells with weeks of meteor activity.
3. Public coverage disclosure on calendar, with maintained scope dates and reviewed source links. UTC instants convert; source observing-night ranges do not convert as midnight appointments; occultation references are not local contact times.
4. Run source-row parity, timezone matrix, unit/browser/build/host checks; one independent code/content review; reproduce/fix material findings, inspect desktop/mobile preview.

## Source decisions
AMS calendar is the primary observing-night source; NASA crosschecks support Orionids, Leonids, Geminids, Quadrantids and Eta Aquariids. Lyrids 2027 source disagreement: AMS Apr21–22 vs NASA Apr22–23 and almanac Apr23; conservatively display Apr21–23 with disagreement explained. AMS activity headline/narrative differ for Alpha Capricornids; no unqualified activity endpoints. IMO Draconids 2026 date Oct9 is supported by indexed primary PDF extract (not a downloaded PDF). No claim full IMO document was retrieved.

## Verification and review

Status: implemented and verified locally, 2026-10-16.

- Catalogue: 140 reviewed entries =50 Moon phases +13 showers +5 eclipses +25 planetary milestones +41 pairings/occultation opportunities +6 Earth seasonal/orbital markers.
- Independent fresh-context reviewer parsed saved primary almanac HTML and confirmed every one of the 127 qualifying non-meteor rows is represented without date/time mismatch. Meteor night ranges match AMS; source disagreements and limits were checked. No material findings. One doc count corrected from eleven to twelve AMS showers. Review did not include a browser pass; implementer inspected rendered desktop/mobile calendar and guides.
- Missing-coverage/corrected-date tests were watched fail before implementation. New domain/precision/coverage/timezone matrix tests pass for all140 records across9 zones (including Kolkata/Calcutta alias, Kathmandu, both US zones, Sydney, Kiritimati and Honolulu). Source dates remain unshifted.
- npm run check, check:tests, validate:sky-events: pass. Unit30 pass; browser31 pass; production-shaped host1 pass. Total62 tests. Preview build passes. Existing Browserslist/PostCSS warnings remain; expanded content produces a663KB JS chunk (131KB gzip), triggering Vite's500KB advisory. No new dependencies or runtime feed.
- Inspected screenshots: major-calendar.png, major-calendar-mobile.png, major-meteor-guide.png, major-season-guide.png. No page errors or mobile guide overflow. Existing splash/music, Resources, News, About, Collective and CTA regression checks remain green.
- Public coverage disclosure added; required ID manifest and evidence fixture guard against omissions. Existing occurrence IDs preserved when a specialist date range supersedes an almanac date. Long activity ranges remain in guides, not repeated as daily calendar entries.

## Deliberate limits
All major events means the documented reproducible policy for October2026–September2027, not every possible minor event or every local phenomenon. No unverified comet dates, live aurora prediction or satellite pass schedule. Global/geocentric times do not imply local visibility or contact times. Sources provide predictions with differing precision; coarse and source-night dates are visibly qualified. Draconid evidence comes from indexed primary IMO material, not a fully retrieved PDF.

Website branch/worktree only; plugin untouched. Local preview remains http://127.0.0.1:5180/sky-events . No push, merge or deployment.

