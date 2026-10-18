# Local planning result-card prototype — 19 October 2026

## What is implemented

The existing aggregate planner can attach a read-only MCP Apps result card when the explicit dependency-only `resultCardPrototype:true` rehearsal switch is supplied. It defaults off, has no environment activation, and is absent from resolver-only mode. No new tool, package dependency, API call, provider admission, stored-plan service or permission is introduced. The installed1.0.36 package is unchanged.

One versioned static resource (`ui://nightsky/planning-card-v1.html`) renders server-owned place/session facts, calculated darkness and Moon values, detailed timestamped evidence and always-visible linked credits. Sources come from `planAnswerSources(plan,target)`, including exact distinct notices, returned modification text and licence URLs. The full text response and structured schema are unchanged for non-UI clients. Original aggregate summary text is not promoted into the card: an offline fixture demonstrated that it can summarize a sample outside the requested session, so the card instead uses its own neutral introduction and the timestamped detail rows.

Card data is limited to32KiB and checked against the existing4MiB response envelope before attachment. Rejected cards return a short unavailable notice without failing the successful text result. Unsafe links cannot become anchors. Text is never interpreted as HTML. CSP external connection/resource lists and permissions are empty; there is no fetching, storage, telemetry, geolocation or tool invocation from the component. The parent-only MCP Apps bridge requires a successful2026-01-26handshake, clears stale data on input/error/cancellation/missing payload and acknowledges teardown. Resize notifications keep the credits within a flexible frame. Hidden metadata alone is not a display guarantee.

## Review and local evidence

The plan and implementation were independently reviewed. Eight focused transport/payload/view tests pass. They cover switch isolation, actual stateless resource listing/reading, unchanged text, safe credits, same-URL distinct notices, parent handshake, hostile strings, invalid/error replacement, cancellation, teardownID1 and UTF8 limits. Payload/registration regressions failed before their implementations; teardown/cancellation and stale-summary regressions also failed before corrections. Types and plugin build pass.

The local synthetic-parent browser rehearsal uses an isolated browser profile and blocks all non-loopback requests. The optional browser library was absent from the checkout; the existing bundled test library was used, with no dependency installation. Desktop1000px and mobile375px outer viewports had0horizontal overflow,8visible credit records,0browser errors and0external attempts. The last credit row was asserted inside the resized frame before screenshots. Detailed values open locally; a later error clears the old card and credits. This is visual verification in a test parent, not actual ChatGPT/Codex/Claude rendering acceptance.

An initial attempt to reuse the old1.0.36 transcript was rejected by the current strict event schema. It was not silently converted or accepted; current synthetic fixture data was generated locally for the visual rehearsal instead.

Evidence (ignored local directory): `.superpowers/sdd/2026-10-18-publicuniverse-v1/card-prototype-20261019/visual-report.json`, `card-1000.png`, `card-375.png`, and `native/` two-turn event logs/answers/report. Earlier interrupted full-suite output is transitional; the final suite log is `card-prototype-final-full.log`.

## Bounded conversation result

One fresh two-turn Codex CLI conversation completed with both exits0, no timeout,6MCPcalls and12loopback HTTPrequests,0external provider attempts. Limits were12calls/40HTTPrequests total,120seconds/turn,2MiBstdout/256KiBstderr, no retries. It read the installed planning skill, used a fixed Hyderabad fixture with real astronomy, and honestly reported weather unavailable.

The follow-up reused the resolved city and calculated22:00IST directions (Moon234.3°azimuth/21°altitude; Saturn131.1°/67°). The first turn nevertheless repeated the identical successful `resolve_place` once. That observed failure remains open; do not infer an internal model cause or claim prior guidance fixed it. Final prose still omits returned licence links. No native card rendering or all-client acceptance follows from CLI prose. Stop after this finite batch.

## Remaining acceptance and review ruling

Tasks12B/15 remain open. Categories stay15local accepted/2local remaining/8release dependent/2separate-deferred. This prototype does not close source/account/logo/public method URL, publication, actual native rendering or attribution-rights gates. Required notices are present in the tested card, but its presence beside an answer and its links must be verified in the actual intended host. No production switch or installation was changed.

Minor review item deferred: the browser has stricter individual field lengths than the producer's total-card bound; exceptionally long fields can cause a safe text fallback despite a server-available card. This is not a guaranteed general Markdown/legal/display assessment. No other important review finding remains in this prototype's implementation.

References checked19October2026: [OpenAI UI guidance](https://developers.openai.com/plugins/build/chatgpt-ui), [tool-result reference](https://developers.openai.com/plugins/reference), [vanilla bridge example](https://developers.openai.com/plugins/build/app-quickstart), [MCP Apps protocol](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx).

No new dataset/provider request, private credential or quota mutation, browser scraping, deployment, publication or package reinstall occurred.

Final local verification:1,867passed/0failed/2skipped (1,869total), exit0;40integrated affected MCP tests passed,0skips; type checks and standalone plugin build passed. Exact-commit CI outcome follows the push and is reported in the final handoff. Passing code checks do not close the retained model and native-rendering limitations above.
