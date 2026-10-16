# Detailed website implementation plan review

Date: 16 October 2026 (Asia/Calcutta)
Target: 2026-10-16-website-implementation.md
Approved design: ../specs/2026-10-16-website-product-design.md
Scope: planning and review only, within codex/website-plugin-design.

## Method and limits

Used the writing-plans skill to author and self-review the plan, the requesting-code-review skill for a fresh read-only reviewer, the receiving-code-review skill to evaluate feedback against the actual website, and verification-before-completion for document checks. No full interactive gstack review pipeline is claimed. No product implementation, package installation, application test, build, deployment, plugin operation or plugin inspection took place in this planning turn.

The independent reviewer received only file paths, requirements and a strict website-only/read-only boundary, not the author's conversation history. Its first pass found four Important and two Minor issues, no Critical issue. A bounded follow-up confirmed all six resolved and found no remaining Critical or Important issue. One subsequent minor artifact-naming clarification was incorporated. These findings establish plan quality, not application correctness or publication readiness.

## Writing-plans self-review

| Check | What was examined | Result |
|---|---|---|
| Spec coverage | All 17 design sections, route map, Home copy, Resources, Collective, About, News, meteor data, setup/support and policies | Every build requirement has an owning task and evidence in the acceptance map. Deferred features remain excluded. |
| Step clarity | Each task's files, consuming/producing contracts, failing checks, implementation changes, verification and commit | Ten tasks; startup harness moved to Task 1 so early UI tasks can actually run their tests. |
| Interface consistency | ListingConfig, SiteRoute, ResourceState, NewsSearch, normalized news response, ReviewedMeteor, legacy IDs, ReleaseFacts, build outputs | Explicit types/URL contracts, shared normalized API, conditional setup gate and named build-mode artifact now align. |
| Review Focus | Missing listing, resource URL/history, feed failure/races, expired dates, host/status and missing release facts | Assigned to tasks 1, 4, 5/6/9, 7 and 8/9 respectively, with targeted assertions/checks. |
| Proportion | Delivery decisions versus duplicated source code and approved content | Plan references approved copy rather than duplicating it. Function signatures and assertions specify decisions without writing the application in the plan. |

## Independent review findings and resolutions

| ID | Severity | Finding | Verified against | Resolution |
|---|---|---|---|---|
| R1 | Important | Required release evidence could not be represented; empty source inventory and setup gating ambiguous | Plan Task 8 ReleaseFacts and Task 9 release checks | Added sourcesApprovedAt, contentRightsApprovedAt, hostingVerifiedAt; empty sources block release; valid dated approvals required; setup verification required only for published-listing instructions. Unpublished-listing site can release with honest status when other facts are approved. |
| R2 | Important | Root public/ error assets would not be copied by Vite's client root | vite.config.ts root and existing client/public contents | Error assets explicitly live in client/public; preserve actual Nightskyearth.mp4 there; output assertions; remove obsolete root robots/sitemap duplicates and use generated output. |
| R3 | Important | Recognized but unreviewed meteor IDs would get host 404 despite planned archive behavior | Current shared/meteorShowers.ts IDs and Tasks 7/9 inventory | Separate legacyMeteorIds from reviewedMeteors; known unreviewed IDs render safe noindex archive notice with no unverified claims; only unknown IDs are host 404 and only reviewed records enter sitemap. |
| R4 | Important | Browser preview/release state had no explicit connection to build/server state | Task 1 env contract, Task 9 SEO/output rules | Build resolves one mode, sets VITE_WEBSITE_RELEASE for client/HTML, generates host headers and dist/website-build.json for Express. Synthetic approved-release and missing-facts-refusal cases remain separate. |
| R5 | Minor | Resource serializer could not preserve unrelated parameters despite requirement | ResourceState serializer and Task 4 browser-history requirement | Added baseSearch argument and ref=home preservation test through changes/Clear filters. |
| R6 | Minor | Browser-start command could omit the TypeScript loader | Task 1 vs Task 5 startup descriptions | Standardized Playwright on npm run dev:website -> node --import tsx scripts/serve-website.mjs; separate production command/config added. |
| R7 | Minor, follow-up | Generated build-mode metadata filename unspecified | Follow-up reviewer and Task 9 | Named dist/website-build.json, exact release:boolean content, path relative to bundled server, fail-safe preview behavior on missing/malformed file. |

Author correction before final review: Task 2/3 initially deferred browser verification until a Task 5 harness existed. This contradicted the task-level test cycle. Harness/startup now belongs to Task 1; Tasks 2/3 test their own changes immediately. Host tests use a separate config/port so they do not accidentally run against the development server.

## Content review

The implementation plan preserves the approved draft as the single prose source. Task 3 imports its wording into websiteCopy.ts; Task 10 requires a human read-through of every paragraph and recovery state before completion. Static-copy tests intentionally check only key product/navigation commitments rather than mirror all prose.

| Area | Editorial intent | Guard against |
|---|---|---|
| Hero | Existing sky identity plus explicit ChatGPT product explanation | Preserving travel copy while changing only buttons |
| Journeys | Activities and visitor interests | Trip durations, reservations or duplicating help modes |
| Universe | Understanding, exploration, comparison and preparation | Treating every question as an outing-plan generator or simulating live answers |
| Moments | Brief photographic pause about observing, photographing and learning | Fake quotations/testimonials or a repeated feature grid |
| Meteors | A timely but evidence-qualified starting point | Stale years, unreviewed Moon labels, expected-rate promises |
| Resources | Searchable useful references with reviewed links | Catalogue filler, universal best badges, stale prices/claims |
| Collective | Honest general ambition and shared curiosity | Signup/interest form, placeholder CTA or invented active community |
| About | Purpose and general story without names | Fabricated expedition biography, credentials or partnerships |
| News | Attributed external reporting with its real breadth | Complete observing-alert claims, unverified source counts or reuse rights |
| Supporting pages | Actual release sources, setup and data practices | Generic assurances presented as final policy facts |

## Architecture, tests and failure coverage

Architecture remains a website evolution: current React/Vite/Wouter, local catalogue filtering, shared config/route inventory, existing feed through one delivery function. No database, website planner, plugin network integration, CMS, remote search service or platform migration. Netlify adaptation is limited to existing website News delivery; actual hosting must be confirmed before redundant adapters are built.

Meaningful planned checks cover:
- Pure contracts: unavailable/malformed listing URLs, canonical production origin, search/filter normalization, normalized feed response, date boundaries and release readiness.
- Browser behavior: menu/keyboard, URL/back-forward, copy denial, search submission/races, same-query cache only, archive/noindex, media failure and reduced motion.
- Host behavior: exact API mapping, independent sitemap under news failure, known route refresh, actual redirect/retirement status, emitted client/public assets, preview/release header consistency.
- Editorial/factual review: every retained resource/meteor claim, news reuse terms, sources inventory and policy facts, with recorded provenance and sign-off.

An Express test does not prove Netlify hosting behavior. The plan now explicitly requires checking emitted rules and local Netlify emulation before claiming host equivalence. If the host cannot serve static 410, choose a documented narrow function or real 404 retirement response; never call 200 retirement text a correct status.

## Decisions intentionally not made by the reviewer

- Actual astronomical accuracy and source data completeness require authoritative record-by-record review during execution.
- News summary/image reuse permission and resource/media rights require primary-source terms checks.
- Legal sufficiency, operator identity, logging/retention, deletion process and policy approval require owner facts and sign-off.
- Actual public listing, account/device availability and setup require tested release evidence.
- Actual deployment ownership and rendered accessibility/performance require implementation/host evidence.

None of these were silently approved. They remain named dependencies in the plan. They do not require plugin workspace access or editing to construct a preview.

## Final verdict

Ready for owner review and choice of execution method. Independent reviewer recheck: no remaining Critical or Important plan findings. Author self-review: coverage and interface corrections incorporated. Application tests/builds have not run because the change is documentation only.

Next gate: owner reviews the detailed plan and chooses native or subagent-driven implementation, as required by writing-plans. Recommendation: native execution for coordinated shared-file work, followed by independent read-only review. Website publication remains outside scope, and the plugin remains untouched.
