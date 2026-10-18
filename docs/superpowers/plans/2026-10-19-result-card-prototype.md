# Compact planning result card — implementation plan

**Goal:** Display a server-owned planning summary with adjacent linked credits, independently of model prose, in compatible MCP Apps hosts.

**Architecture:** Extend only the existing aggregate planning result. An explicit dependency-only prototype switch defaults off. When enabled, register one static versioned UI resource and associate it with plan_observing_session. Return a bounded card payload in component metadata; preserve structuredContent and complete text fallback unchanged. No new lookup/tool, stored plans, dependencies, API calls or provider activation.

**Spec:** Owner approved the compact-card prototype with retained text tools, local rendering tests and one focused conversation check. This is a prototype, not universal host support or legal/source/publication acceptance.

## Design and constraints

- Card: heading, place/session, existing answer-ready values and limitations, always-visible relevant credits with returned modification/licence notices. No hidden required-credit panel.
- Build card from validated PlanResult and planAnswerSources, never model-supplied display values. Text nodes only; safe HTTP(S), credential-free links; distinct same-URL notices retained.
- Standard MCP Apps UI MIME/resource metadata and2026-01-26initialize/initialized/tool-result bridge. Parent-source-only messages; no tools/call, fetch, storage, analytics, location or browser permission. Explicit empty CSP network/resource lists. No static provider logo asset rights assumed.
- No capability inferred from a host name. Non-UI hosts continue using unchanged content/schema. Register only under explicit prototype switch; resolver-only mode remains unchanged.
- Unknown/malformed/error/oversized payload clears stale content and reports unavailable; no silent source truncation. Component bridge timeout leaves a useful fallback notice. No public deployment/domain accepted.
- Existing local1.0.36 package and historical freeze are unchanged. Dedicated fixture server can exercise the prototype without reading credentials or changing installation.

## Tasks and tests

1. RED→GREEN server/resource regression: prototype off/on, resolver-only, resources/list/read, tool metadata, same schema/text, exact source credits, no extra upstream calls, response budgets.
2. RED→GREEN UI tests: bridge initialization, parent-only tool-result, literal hostile labels, unsafe links, same-provider distinct notices, error/malformed replacement, narrow layout. Static self-contained HTML; no third-party scripts.
3. Review implementation independently; fix important findings with regressions. Run focused tests/types/build/full offline suite. Visual review with local synthetic parent bridge, not a claimed native-host pass.
4. One fresh local model case at most: two conversational prompts for resolved-city reuse and changed observing goal/date;120seconds per prompt,12MCPcalls total,40loopback HTTP, output2MiB/256KiB,0data-provider requests. Stop on failure; no retries. CLI cannot verify a rendered native card.
5. Document actual visual/native limits and current tickets, commit/push/watch exact CI. No deployment, new datasets, credentials/quota changes or package reinstall.

## References and review focus

Official OpenAI UI/reference/quickstart checked19October2026: https://developers.openai.com/plugins/build/chatgpt-ui ; https://developers.openai.com/plugins/reference ; https://developers.openai.com/plugins/build/app-quickstart . Base SDK2.3.1 supports resource registration and tool metadata; no SDK migration.

Review especially: spoofed parent messages, HTML/script injection, unsafe links, missing credits, stale result after error, source evidence unrelated to shown values, default/rehearsal scope leaks, unsupported-host claims. Self-review: the card and native prose are separate acceptance surfaces; existing source display/entitlement/logo obligations remain open.

## Execution record

Implementation and independent review complete. No important review finding remains. One minor deferred item: exceptional individually long fields may trigger safe text fallback despite a server-available total-size-bounded card. Protocol cancellation/teardown and stale-summary regressions failed before corrections; all8card tests pass. Local visual checks verify all8credit notices, last-row visibility and no overflow at desktop/mobile sizes with0external attempts. One two-turn CLI batch completed6calls/12HTTPrequests/0external attempts; follow-up reuse worked, identical initial lookup repeated, native rendering remains unverified. No retries or further native batches.

Final local suite1,867passed/0failed/2skipped;40affected MCP checks, types and build passed. Tracker/documentation updated; exact-head CI is watched after commit/push. Task12B/15 remain open; prototype remains off by default and installation unchanged.
