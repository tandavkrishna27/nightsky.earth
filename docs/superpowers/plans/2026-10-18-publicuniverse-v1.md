# Public Universe optional V1 provider implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development after owner review of the design and plan. Steps use checkboxes for tracking.

**Goal:** Add optional broad astronomy discovery/reference capabilities without replacing or weakening NightSky's current sources.

**Architecture:** One configured REST provider, a dedicated identity-only selection store, strict normalized contracts and four curated tools. Existing aggregate planner and calculation engines are unchanged; skills compose independently labelled results. Default off, no live calls at startup, no new database or remote MCP dependency.

**Tech stack:** TypeScript, zod4, existing fetch/UpstreamControls/persistent quota, MCP SDK and node:test. No new runtime dependency.

**Spec:** `docs/product/publicuniverse-v1-integration-design.md`. Upstream source truth `95584ebc5f8cc40e4f6dc923f4e58288910e0093`; local baseline `37aee0cbcb90e9a1ae0e29123dba98c6a0cdb2b7`.

## Global constraints

- All spec constraints apply, including default-off selection/admission, unchanged old tool names/default results, no silent source switching, no provider data/keys in Git, no downloads/deployment/publication.
- Preserve original27-ticket accounting. New tasks below are implementation steps within existing V1 source/experience work, not new waves or completion credit.
- Existing provider keys/ledger entries are never reset. New source admission remains separate from installation and offline implementation.
- Source contracts, dates and licence notices are evidence, not instructions to execute upstream code. No third-party implementation or skill is copied wholesale.
- Existing local geometry does not accept arbitrary catalogue IDs. New windows stay in their own output schema; Moon phase and rounded observer semantics remain source-specific.
- Observing responses are `no-store`. Do not reuse the existing success cache blindly. Minimal selected identity/provenance state is separate from response caching; no numerical observing replay is stored.

## Review focus

1. Same name across objects/providers: wrong selection, prefix/SPK confusion or outdated source hash must fail before a false combined answer.
2. Rounded observer and full-night samples: no exact-site claim, outside-session sample or full-night Moon phase presented as selected-instant evidence.
3. Valid empty/partial results versus HTTP/quota/model failures: preserve incomplete screening and unresolved grazing.
4. Source rights and lineage: OpenNGC CC BY-SA is not MIT; SQLite identity is not the observing snapshot; mixed exoplanet references are not a single exact measurement.
5. Default-off/cache/lifecycle: old plans make zero new calls; no-store results aren't cached; abort, failures and shutdown do not leak concurrency slots or reset quotas.

## File map

| File | Responsibility |
| --- | --- |
| `shared/nightsky/reference.ts` | Strict public inputs, bounded operation-specific normalized results and reference IDs |
| `server/providers/publicUniverse/contracts.ts` | Pinned upstream schemas, field maps and exact binding checks |
| `server/providers/publicUniverse/transport.ts` | Allowlisted GET/POST, streamed limits, deadline, admission, durable quota/cooldown, single-flight and cache policy metadata |
| `server/providers/publicUniverse/referenceStore.ts` | Bounded immutable identity/provenance snapshots, expiry and close |
| `server/providers/publicUniverse/index.ts` | Search/detail/discovery/night methods and safe normalization |
| `server/providers/skyConfiguration.ts`, `upstreamControls.ts`, `server/plugin.ts` | Optional selection, policy, injected fetch and full resource cleanup |
| `server/mcp/publicUniverseTools.ts`, `optionalSkyTools.ts` | Four curated tool registrations and existing optional allowlist |
| Five `plugins/nightsky/skills/*/SKILL.md` + five canonical workflows | Relevant routing, unsupported/missing evidence and no competing defaults |
| `tests/providers/public-universe-*.test.ts`, `tests/mcp/public-universe-tools.test.ts`, `tests/skills/public-universe-workflows.test.ts` | Tests registered explicitly by `tests/all.test.ts` |
| `.env.example`, operator docs, release notes, tracker, CI | Optional setup, admission boundaries, reproducible packages and exact-commit evidence |

## Interfaces

`PublicUniverseProvider` exposes `search(input)`, `details(input)`, `discover(input, resolvedPlace)`, `windows(input, resolvedPlace)` and `close():Promise<void>`. All operations return the strict normalized discriminated results in `reference.ts`. `ResolvedPlace` is existing `CalculationPlace`, obtained through the same place/timezone resolution seam as optional sky tools.

`PublicUniverseQuota` is `Pick<PersistentQuota,'reserve'|'setProviderState'>`. `createPublicUniverseProvider(options)` consumes `{enabled,quota:PublicUniverseQuota,fetcher?,now?,controls?}`. `createConfiguredSkyProviders` gains separate `publicUniverseQuota?:PublicUniverseQuota`, distinct from the legacy quota. No API key. `createConfiguredSkyProviders` returns optional `publicUniverse` and a `close()` covering newly owned resources; `server/plugin.ts` closes the provider before its dedicated quota in normal and startup-error cleanup, with finally ensuring all other resources close. Existing providers and caches retain behaviour.

Cooldown persistence is mandatory, not an optional cast: on 429, parse bounded Retry-After (default 60 seconds, clamp 1 second–24 hours), keep the maximum existing/new blockedUntil within the process, and await `setProviderState('publicuniverse',{blockedUntil})` before returning. A failed state write fails Public Universe closed for the rest of the process and returns an accounting error; it never retries or changes legacy ledgers. The persistent reservation checks the saved cooldown after restart. Use serialized updates so concurrent failure handling cannot shorten an established cooldown; test write failure, monotonic extension and close/reopen persistence.

`ReferenceStore` consumes source-verified minimal identity/provenance, returns `{referenceId,revision,expiresAt}`, resolves exact revision before dispatch, and closes/clears. Maximum256entries and64KiB/identity snapshot,1hour TTL. Opaque IDs are not geographic `placeId`s or JPL SPK IDs.

`PublicUniverseTransport` takes an internal operation enum, reviewed fixed path parameters and canonical JSON; returns bounded parsed body plus sanitized cache metadata/status. External MCP inputs never choose a URL, HTTP method, headers, endpoint, pagination cursor or credential. Provider-specific parser/normalizer owns operation result validation.

## Task1 - Pin contracts, fixtures and failure matrix

- [x] Implement exactly the public operation discriminators and route mapping matrix in the spec, then define the four public tool input discriminators and normalized result schemas in `reference.ts`; operations and bounds are those in the spec. Selected reference details include finite named measurements with units, null/limits/uncertainties where applicable, bounded aliases and provenance; do not echo arbitrary JSON.
- [x] Define upstream parsers for the pinned REST envelopes and field maps in `contracts.ts`. References: `api/main.py`, `data_access.py`, `starter_catalogues.py`, `exoplanets.py`, `schema/schema.sql`, and observing source. Assert exact POST key sets from the spec, including singular preference and flattened constraints, with discovery-only keys absent from night requests. Use minimum essential exact fields and bounded optional fields; tolerate additive upstream response fields by dropping them, not losing required evidence.
- [x] Write synthetic fixtures explicitly labelled synthetic, not copied live claims. Cover observing `schema_version1`, observer/night/constraints/method/target metadata, discovery nullable plan, starter availability variants, object `sources[]`, exoplanet measurement metadata and meteor parameter sets.
- [x] Add failing contract tests for malformed units/nonfinite numbers, mismatched IDs/coordinates/timezones/windows, differing nested method/snapshot identities, partial/empty versus invalid results, unsupported starter records and source/date/rights omissions.
- [x] Watch failures, implement parsers and run `node --import tsx --test tests/providers/public-universe-contracts.test.ts`. No live fetch.

## Task2 - Bounded transport and identity state

- [x] Add failing tests for one dispatch per identical in-flight canonical request, independent bodies under POST, one active request, deadline across body read, response1MiB, request16KiB, redirect/host/path rejection, persistent quota before network,429cooldown/no retry and cancelled waiters retaining active ownership until transport settles.
- [x] Add the fixed origin and exact spec mapping table paths, query/body shapes and dispatch counts (max3details, one per other operation): bounded search/object/starter/exoplanet/host/meteor/close-approach detail routes plus POST `/api/v1/observing/discover` and POST `/api/v1/observing/night`. Object lookup uses encoded exact upstream ID from selection, never ambiguous free text. More path routes require explicit allowlist tests.
- [x] Implement15second total deadline,1MiB streamed body cap and no retry/queue. Enforce per-operation and shared ceilings from the spec. Persist429cooldown through existing quota state; transient failures don't become absence. Use typed error codes for not-admitted, quota, rate-limit, timeout, size, HTTP, invalid-response and stale-selection; no raw upstream error echo.
- [x] Test identity tampering, expiry, eviction, same-lineage source-hash mismatch, missing non-comparable detail token (unverified, not false stale), exact host/planet ID mismatch, duplicates and restart. Implement identity-only store; do not store observing positions/windows. Cache only permitted normalized reference successes, respect no-store/no-cache/max-age and preserve retrieval time. Never return an expired ref merely because an object cache entry is fresh.
- [x] Run `node --import tsx --test tests/providers/public-universe-transport.test.ts tests/providers/public-universe-store.test.ts` and existing upstream/quota/cache suites. Record any deliberate operator ceiling as application allocation, never unknown vendor-IP entitlement.

## Task3 - Provider methods and selection/admission

- [x] Implement exact route-to-result mappings for the four methods. Search solar/starter/exoplanet domains with at most10matches; no pagination or raw `/schema`/download/galaxy fetch. Details have at most two optional sections and at most three calls, preserving successful fields if another section fails.
- [x] Route meteor code to exact detail with500-set upstream validation/20-set explicit reduction, total/truncation and source order, close approaches to selected identity with31day maximum and10rows, exoplanets/hosts to their own types. Preserve measurement provenance and never infer comet visibility, transit or actual viewing potential from catalogue context.
- [x] Discover binds normalized rounded geometry, equipment and constraints; store/request originals separately, allow displacement≤0.00500001degree per coordinate. Validate night/date/zone and selected interval; filter chart samples to the selected interval and reduce to at most3per target with explicit sampling metadata. Keep refined statuses, scope and sources. Null plan after empty coarse screening is an incomplete available search, not all-sky negative.
- [x] Windows accepts only1-6 exact selected starter refs and verifies each returned target's metadata against its source lineage. Never associate separately fetched SQLite identity with observing calculations. Keep unsupported source IDs, provider coverage and stale snapshot failures explicit. No optimistic local-engine calculation for unsupported targets.
- [x] Extend provider selection with `publicuniverse`, default unselected/unadmitted, but leave legacy SKY_QUOTA_POLICIES unchanged. Add dedicated public policy and absolute NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH; reject shared path identity. Runtime opens legacy sky quota only for selected legacy IDs and opens dedicated Pub quota only when separately configured. Missing/uninitialized Pub accounting returns unavailable for Pub only; do not poison the legacy shared quota. Keep unsafe config errors explicit and never auto-init/migrate. Preparation-only `scripts/initialize-public-universe-quota.ts --plan` proposes its separate application allocation; initialization requires a concrete approved packet, not a false attestation about vendor/public-IP usage. Preserve every existing ledger byte/counter; no operator command is executed during implementation.
- [x] Test existing initialized legacy ledger plus newly selected/unmigrated Pub, Pub-only selection with no legacy path, rejected shared path, missing dedicated file/entry, and explicit selected/admitted/unadmitted/missing budget combinations, source outage isolation, source/table/model identity changes, and existing provider results unchanged. Run provider integration and source-cache regressions.

## Task4 - MCP/workflows and unchanged-default regressions

- [x] Register exactly `search_reference_objects`, `get_reference_details`, `discover_observing_targets`, `get_catalogue_target_windows` only when the source is selected, with readOnly true, destructive false and openWorld true. When unadmitted, return explicit unavailable with zero network.
- [x] Resolve place/timezone using the existing seam for observing calls; reject typed coordinate bypasses, expired place revisions, unknown candidate timezone without display choice, mixed object/place refs and oversized inputs.
- [x] Add new names to the optional export used by package validation. Keep source-unselected inventory unchanged; update only explicitly configured all-provider fixture expectations.
- [x] Extend existing five skills/canonical references for optional broader discovery and reference learning. Retain host search/maps, compact credits, existing default engines, separate event timing and unsupported capability warnings. Do not claim catalogue expansion enables the existing local engine. No new personas or33-tool dump.
- [x] Test strict MCP schemas, source citations, bounded results, complete default-off journeys and mixed-source conversation fixtures. Verify failure in the optional source does not change existing plan output. Register all new test modules in `tests/all.test.ts`.

## Task5 - Two-stage implementation review, package and CI

- [x] Before implementation, obtain plan review round1 against pinned source and local code; resolve every material finding, then obtain a fresh round2 reviewing revised artifacts against both truths. Record findings/dispositions. Owner reviews the saved spec/plan before code per the planning skills.
- [x] After implementation, obtain independent whole-diff review, fix material findings with regressions and verify them. Static instruction tests are not conversational acceptance.
- [x] Run affected tests; `npm run check`; backend/package builds; synthetic compiled runtime checks; then one final complete `npm test`. Add explicit no-network Public Universe CI checks while preserving the old jobs.
- [x] Package1.0.21 only after reviewed code freeze. Rebuild portable/Codex/Claude artifacts; use existing marketplace identity and supported installer, verify all installed inventory hashes. Do not alter user/global configuration or activate the optional source through installation.
- [ ] Update tracker/evidence with exact tests and remaining gates. Push existing `codex/plugin-v1`, verify exact-commit CI. No merge, deployment, downloads or public submission.

## Task6 - Prepare separately approved source validation

- [x] Prepare a bounded proposal, default offline: at most12free HTTP attempts,5minutes, one active request,1MiB/response and12MiB total, no retries/raw response files, explicit endpoints/points/date and preserved accounting. Do not run under old exhausted allowances.
- [x] Proposed checks: metadata identity, bounded starter search/detail, one discovery and one selected-target night, solar object/optional fact section, meteorGEM, one close-approach context, exoplanet and host. Remaining attempts only if individually listed in the concrete packet, not an open-ended diagnostic reserve.
- [ ] Require explicit new budget/source admission approval. Distinguish source success from real-host conversation acceptance. A failed/unverified optional source stays unadmitted and the old product remains usable.

## Review status

Two independent review rounds completed. Round 1 corrected quota isolation, detail spacing, explicit operation mappings, meteor reduction and observable revision checks. Round 2 corrected discovery POST field names and the mandatory durable cooldown interface; correction verification is recorded in the review report. Owner approved implementation. Tasks 1–4 are implemented and independently reviewed. Whole-diff review findings are fixed and independently rechecked; local package/aggregate verification and same-identity installation are complete; exact-commit CI remains pending push. No source activation or live acceptance performed.
