# V1 production completion contract — API-first revision, 17 October 2026

This is the current contract following the owner's explicit [API/search decision](api-search-discovery-v1-decision.md). Use the [current tracker](v1-completion-tracker.md), [original-ticket matrix](v1-remaining-ticket-release-matrix.md) and [regroomed implementation plan](../superpowers/plans/2026-10-17-api-first-v1-regroom.md). Earlier catalogue acquisition prerequisites are superseded, not completed.

## Product invariants

Global night-sky planning, free product and suitable free sources, shared MCP tools/five workflows, no runtime database. Multiple providers are permitted where their terms and data fit; label each source, freshness, limits and disagreement. Host search/location are optional client capabilities, not universal assumptions. Do not silently introduce paid dependencies, bulk global downloads, a verified-access claim or exhaustive search claim.

API-first does not prohibit local astronomy calculations, small maintained reference files or bounded caches. It removes the need to construct our own exhaustive global places catalogue for V1. Historical-weather and supported-event obligations remain; source feasibility is evaluated independently and any feature reduction needs an explicit owner decision.

| Stage | Required result | Acceptance evidence |
| --- | --- | --- |
| S1 | Preserve reviewed local engineering baseline | Existing commits, tests and model records with original scope |
| S2 | Actual working API/search discovery, location/context/planning handoff, suitable providers, intended history and supported events | Provider policy/source matrix; configured adapters; reliable source identity/coordinates/timezone; scope/ambiguity/unknown behavior; retained real evidence for enabled content |
| S3 | Measure the actual configured service locally | Version/config/source identity, startup/peak memory/storage/cache, per-tool/end-to-end latency, concurrency/failure/rate-limit behavior, refresh/current/rollback costs |
| S4 | Verify assembled user experience | Existing journeys, genuine tool/skill traces, permitted live checks, owner questions, fixes and final audit |

Geography, history and events work may proceed in parallel with one shared integration owner. Exact provider/source selection precedes implementation of dependent adapters. Frozen schemas precede parallel runtime/skill work. Large suites run at integration milestones; focused checks accompany changes.

## Authority and limits

No deployment/publication. Concrete new datasets/provider jobs remain separately authorized; scope approval is not a download allowance. The planet receipt proposal is superseded for V1. Cleanup authorization is recorded separately and its failed automatic attempt must not be represented as completed. Credentials remain private. Claude testing remains deferred; Codex evidence is accepted within its actual scope. Brand NightSky.earth, personal publisher India, support nightsky.earth2026@gmail.com remain settled; verified legal identity/hosting details are later gates.

## Completion audit

Do not count deferred catalogue tasks as done. Verify original tickets against revised acceptance, preserve IDs, and report current totals honestly. Global eligibility means requests may target locations worldwide with explicit upstream coverage limits; it does not imply exhaustive candidate enumeration. Candidate tags are not proof of nighttime access/safety. Historical statistics are not forecasts. Missing data must remain visible but cannot close an unchanged promised capability. S3 cannot be closed using synthetic catalogue tests or a successful source-file receipt.

The [pre-regroom contract](archive/v1-production-completion-goal-before-api-regroom-20261017.md) remains historical evidence only.
