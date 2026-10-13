# Local package readiness

Reviewed 13 October 2026. This is a local rehearsal record for Tasks 12A, 12B, 15, 16 and 17; it is not an official validation result or a public release.

## Reproduce the artifact

From the repository root on Node 24:

```text
node --import tsx --test tests/platforms/package.test.ts tests/platforms/review-cases.test.ts
node --import tsx scripts/verify-review-cases.ts --offline
node --import tsx scripts/build-plugin-package.ts
node --import tsx scripts/build-plugin-package.ts --endpoint https://staging.example.com/mcp --out dist/plugin-rehearsal
```

The default endpoint is the reserved example `https://example.com/nightsky/mcp`; no service exists there. An explicit HTTPS endpoint parameter changes only the bundled connection. The builder never connects, deploys, uploads, submits or publishes. It always reports `submissionReady: false`. Output is `dist/plugin-rehearsal/nightsky-local-rehearsal.zip` with `package-report.json`, which contains the full URL, ZIP SHA256, sorted entry byte counts and entry SHA256 values. ZIP timestamps are fixed, so identical source bytes and parameters produce identical artifacts. The builder copies each of the five canonical workflows verbatim into `skills/<name>/references/workflow.md` and rewrites the installed skill reference to that bundled path. Repository skill sources continue to refer to canonical repository docs. Missing references, unknown skill names and other nested reference paths fail validation. Regenerate after final skill or canonical workflow changes; retain the exact final report with the release evidence.

The source package uses the current portable Agent Plugins layout: root `plugin.json`, root `mcp.json`, `skills/` and `assets/`. OpenAI interface, review and publication settings live under `extensions.com.openai`. No second compatibility manifest competes with those settings. The original execution plan names this portable layout. Current official guidance also supports a Codex-only alternative with `.codex-plugin/plugin.json` and `.mcp.json`; it is not needed here.

Local checks enforce one remote Streamable HTTP server, HTTPS without embedded credentials/query tokens, five valid skill headers, required referenced icons, five positive and three negative review cases, no hooks/local apps, traversal/symlinks, machine paths or recognizable credential strings. This is a targeted lint, not proof that arbitrary secrets are absent or a substitute for official validation. Icons are original local SVG moon/star assets with no remote dependencies. Publisher fields and listing policy URLs are deliberately absent until verified; confirmed support contact is nightsky.earth2026@gmail.com, which must be monitored and appear on the approved support page.

## Review cases and evidence boundary

`plugins/nightsky/plugin.json` contains exactly five positives: casual session with candidate coverage caveat, meteor planning, beginner targets, photography, and a two-night telescope comparison. The negatives cover aurora guarantees, sunglasses for eclipse viewing, and typed coordinates. Prompt/date fixtures are deterministic. The comparison dates must be rebased within the actual forecast horizon before live production review; historical fixture weather cannot stand in for live weather. The offline review runner writes eight records to `dist/review-rehearsal/review-case-report.json`. It initializes a real loopback MCP route and manually calls the listed positive tool sequences. It uses a synthetic gazetteer and forecast/aurora fixtures, an empty candidate index and unavailable history; astronomy calculations and catalog source gaps run through production services. Each row records request IDs, actual tools, expected host behavior, fixture flags and server assertions. Negative rows intentionally probe the server: coordinate-shaped resolver input is rejected, aurora evidence stays uncovered and separate from weather, and eclipse preparation includes ISO 12312-2, sunglasses rejection, front-aperture solar filters and NASA provenance. These probes do not demonstrate an assistant refusal or its choice to avoid tools. `hostBehaviorVerified` remains false for every row. Injected provider traffic is denied and any unexpected provider attempt fails the run. Local service/journey tests prove the structured evidence paths they exercise. Package tests prove case structure and artifact contents. An assistant's choices and refusals require actual host execution and are not proven by static prompts or tool tests.

Task 8/9 coverage and meteor data rights remain explicit gates. A missing dataset is a source gap; omission of agreed V1 scope needs a recorded owner decision. No reduced positive case silently changes scope. Collect local journey evidence and pending host observations using the record template below.

## Release gates

| Gate | Current state | Required evidence |
|---|---|---|
| Publisher/controller | Pending | Verified individual/business identity matching policy/support pages |
| Organization/project | Pending | Intended project, verification and eligible residency |
| Runtime and full URL | Pending | Approved host/budget, separate staging, fixed production scheme/host/port/path |
| Public disclosures | Pending | Verified website/support/privacy/terms HTTPS routes, actual logging/retention and qualified review where needed |
| Domain challenge | Pending | Ownership check for permanent production host |
| Sources and coverage | Pending | Rights, actual artifact digests, global coverage disposition and owner decisions for gaps |
| Official validator/scan | Pending | Current portal/validator record and production tool/location scan |
| Host execution | Pending | Fresh ChatGPT desktop/mobile, Codex, conditional Claude/Gemini connection and all cases |
| Video | Pending | Accessible actual reviewer walkthrough URL |
| Submission | Not authorized/performed | Separate explicit owner instruction after concrete reviewed artifact |
| Publication | Not authorized/performed | Approval plus separate explicit owner instruction |
| Invited pilot | Not performed | Authorized recruitment and observed sample outcomes |

## Sources checked

- [OpenAI package guide](https://developers.openai.com/plugins/build/plugins): portable structure and compatibility overlay.
- [OpenAI submission guide](https://developers.openai.com/plugins/deploy/submission): review field shape, exact five/three counts, icon references, publication countries and separate review/publish steps.
- [Original execution plan](../superpowers/plans/2026-10-10-nightsky-v1-execution-ready.md): task acceptance and authorization boundaries.

Official pages were fetched on 13 October 2026. The publication country default is `[]`, reflecting global intent; this does not establish global data coverage, host availability or legal readiness.

Final local package regeneration after the meteor skill reference fix: SHA-256 `446433abef11b172407e32992c6341b16988a353523ad67f0f76c99c67c6a3aa`. Eight offline review sets pass according to final integration evidence. This is the rehearsal package with an example endpoint; final identity, live endpoint, official validator/video and hosted refusal/connection evidence remain open.

## 14 October offline operations update

The previous package digest is historical; regenerate after current canonical skill/workflow bytes freeze. `node --import tsx scripts/verify-offline-operations.ts` produces `dist/offline-operations/readiness-report.json` with UTC run times, Node version, source revision, working-tree patch digest, untracked source digests, current ZIP inventory/digest, eight scripted review records and actual-source fresh-process rollback. The report explicitly marks official validation and host behavior false. Run the builder separately to retain the corresponding ZIP; compare its digest with the report before review. Concurrent edits require a final frozen rerun.

Package lint now rejects quoted JSON credential assignments, forward-slash Windows paths, malformed UTF-8, empty files and archives over 32 MiB total, in addition to existing entry/path/secret/reference rules. Two regression groups failed before this change; all six focused package groups now pass. This remains targeted lint, not a universal secret detector or official platform validator. Official OpenAI package/submission pages were fetched again on 14 October 2026; the portable root manifest remains appropriate.

See [offline operations readiness](offline-operations-readiness.md), [fresh-process rollback](artifact-rollback.md), [early connection preparation](../platforms/early-chatgpt-smoke.md), [resolver scan preparation](../platforms/location-tool-scan.md), and [host workflow instructions](../platforms/host-workflow-guide.md). The publisher's exact legal name and finalized policy copy remain open despite the confirmed individual/India/support facts.
