# Local actual-model rehearsal — 14 October 2026

## Result

Three synthetic journeys passed manual answer and tool-trace review using Codex CLI 0.154.0 with its default supported model. Its identifier was not exposed, so no specific model compatibility is claimed. The actual NightSky loopback MCP route, schemas, registry and deterministic astronomy calculations were exercised. There were ten tool calls and zero external provider attempts. All children exited normally and temporary fixtures were removed.

| Journey | Calls | Time | Reviewed behavior |
|---|---:|---:|---|
| Future Perseids session | 3 | 27.867 seconds | Resolved named place; searched events and planned session; refused to confirm unsupported 2027 peak or clear skies; distinguished missing coverage from no activity. |
| Two Jupiter nights | 2 | 29.088 seconds | Used comparison tool; retained geometric opportunities separately from unknown weather on both nights. |
| Candidates and near me | 5 | 27.503 seconds | Preserved partial coverage and unknown access/sky quality; distinguished candidate IDs from planning IDs; absent host location did not become an inferred location. |

[Sanitized results and traces](model-journey-test-results.json) contain actual answers, arguments and individual verdicts. These are synthetic fixtures, not Hanle observations or global source coverage. The synthetic OSM identifier/link must not be used as real site evidence.

## Method and limits

The client ignored user configuration/rules and used ephemeral, read-only execution in a named temporary directory. Only a loopback NightSky MCP server was configured. Shell, apps, plugins, web, browser, computer, image and multi-agent capabilities were disabled. Model inference contacted the existing authenticated Codex service; no account or credential changes occurred. Claude was unauthenticated. The configured model failed before inference; an initial default-model attempt had discovery disabled and made no calls. Enabling discovery produced the successful batch.

The successful batch used the earlier command-execution checker. Broader executed-item classification, stronger capped-output/termination handling and semantic checks were added afterwards and type-checked; these later changes were not exercised by another actual-model batch. Manual answer/trace review supplies the behavioral verdict; keyword checks alone are not proof. This is a small sample, not a quality benchmark or security guarantee. Tool-result assertions should continue to be covered by the existing deterministic integration tests.

The opt-in Windows harness is `scripts/model-journey-test.ts`; run with `npx tsx scripts/model-journey-test.ts` only when model inference is authorized and a compatible authenticated CLI exists. It has per-journey deadlines, call/output bounds and guarded fixture cleanup. It is type-checked in CI but never automatically invokes a paid/authenticated model there.

## Scope disposition

No deployment, tunnel, real weather/source/historical retrieval, artifact promotion, marketplace submission or website changes. Display name is NightSky.earth. Hetzner inputs are explicitly deferred until deployment preparation. Original status remains 12 Done / 9 Partial / 6 Not started; source coverage, full historical seasons, publisher verification, actual-host and marketplace gates are still open.
