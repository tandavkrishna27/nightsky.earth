# Host-aware complete outing V1 - 18 October 2026

## Scope

Implements the approved [plan](../superpowers/plans/2026-10-18-host-aware-outing-v1.md) inside the existing V1 tickets. No deployment, publication, source download or provider calls were performed for this engineering work.

## Implemented

- Five skills and canonical references compose actually exposed search, maps, fetch and browser tools; native browser assistance is distinct from the disabled packaged scraper.
- Independent preferences, initial useful answer plus two or three relevant questions, mixed destinations/scouting points, candidate continuity, approach research and concise unknowns.
- Activity-aware preparation and short on-site guidance, app preference and optional walkthrough. No assumed beginner status, trek, facilities preference, weather or access.
- Additive `orientationSamples` in target results: up to three ascending unique instants, UTC and local labels, geometric altitude, true-north-clockwise azimuth, no refraction and zero-elevation assumption. Supported bodies and Milky Way core proxy only. Legacy fixtures without samples remain valid.
- Target MCP and aggregate answer text explain samples honestly. Essential windows, darkness overlap, Moon intervals and gaps precede optional orientation in the bounded answer.
- Ten new conversation specifications extend the existing eleven cases; specification presence is not model/native acceptance.

## Decisions and limitations

- Existing geography `sourceAttempts` already carries quota/timeout/invalid-response evidence, and light-pollution results expose `errorCode`. Retain these contracts and strengthen guidance and boundary tests instead of inventing redundant error enums. No production coverage fix is claimed for the temporary acceptance transport's generic refusal.
- Directions describe returned timestamps only. A different time requires recalculation, not interpolating sparse samples. Near zenith, compass direction is unhelpful; below-horizon geometry is not a viewing recommendation.
- No routing, terrain or app-specific API was added. Host research can investigate these where available; it cannot establish unsupported access or trail facts.
- Claude remains deferred. Gemini integration is researched design, not installed/tested support. CLI model rejection remains unresolved. New native conversation acceptance is pending and no further provider allowance was consumed.

## Review and checks

TDD evidence is in ignored `dist/outing-*.log` files. New orientation/workflow tests were observed failing before implementation; the target MCP explanation regression was observed failing before its fix. Initial reference testing exposed a formatting-test mismatch and duplicate timezone label; corrected locally.

Independent reviewer found one P2: orientation inserted before viewing windows could evict essential evidence under the existing 4,000-byte renderer. Fixed by placing split orientation lines after windows and limitations; reviewer confirmed no remaining blocker. The dedicated budget regression passed.

Affected checks initially passed 83 tests; the final answer-text suite passed 19 and astronomy suite passed 24 after the corrections. Type checks, backend build and portable packaging passed at the recorded intermediate revision. Final aggregate verification, installed-package hashes, commit and exact-commit CI are recorded below after completion.

## Final verification

- Final `npm test`: **1,691 tests; 1,689 passed, zero failed, two skipped**, 233.2 seconds. The earlier run had one formatting assertion failure; final rerun includes its correction and the answer-budget regression. Counts overlap; do not add affected-suite counts to the aggregate.
- `npm run check`, `npm run build:plugin`, `npm run plugin:package`: passed.
- Compiled synthetic API and light-pollution runtime checks: passed; no external provider calls.
- Installed 1.0.20: all 15 package inventory files match. ZIP SHA-256: `015148036b7aeef8d84010ecc53e674d5a3f2f36474df3a2b363c5deef4f11f0`.
- Compiled backend SHA-256: `6edc9e2d82e903a68e2d9d0c8e4374d6f2e765e1dd82cb526ed9ab0dd5a62e9b`.
- CI explicitly exercises host-aware outing, conversation, astronomy and MCP presentation tests on Node24 Linux and Windows, alongside the existing full checks. Exact-commit CI is verified after push; local checks alone do not establish its outcome.
- Native model/owner acceptance remains pending. The local server is not started by installation. Prior live allowances are exhausted; no new calls, scraping or deployment were authorized by this engineering pass.
