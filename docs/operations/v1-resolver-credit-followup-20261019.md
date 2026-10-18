# Resolver reuse and final-answer credit follow-up — 19 October 2026

## Findings and bounded implementation

The retained1.0.36 meteor answer repeats the same successful Hyderabad lookup. Its local resolver text contained names and credit notices but omitted exact placeId/timeZone and reuse guidance already present in the API resolver. That parity defect is fixed: each local match now carries its exact public ID, named-record time zone and index vintage. Ambiguous results ask for selection; empty results do not imply a successful selection. No coordinates, API revisions or invented expiry are added. This improves the evidence available to the model; it does not establish the model's internal cause or prove repeated calls can no longer occur.

Final prose attribution remains an open host/model acceptance issue. Complete notices were already delivered to the model. A pure offline assessor now checks explicitly selected source records against an answer: exact whitespace-normalized attribution/modification text and actual safe Markdown source/licence links. Distinct same-provider notices stay distinct; empty source selection is not-assessed; unsafe links fail. Code, images, escaped Markdown and HTML require rendering review rather than being counted as displayed credits. This is a conservative test contract, not a general Markdown parser, legal assessment, browser rendering proof or runtime enforcement. Paraphrases may require manual review.

## Retained replay

Both retained final answers remain incomplete for their selected resolver source. Meteor lacks returned attribution, source link and licence link. Photography lacks exact returned attribution and licence link; its paraphrased modification wording needs manual review rather than an inferred legal failure. Replay scope is the explicitly selected resolver source only, not a complete all-source audit. Evidence: ignored local file `.superpowers/sdd/2026-10-18-publicuniverse-v1/credit-delivery-replay-20261019.json` plus unchanged136transcripts.

No new model batch was run. The server fix is verified at the tool boundary, not accepted in a native conversation. The installed1.0.36 package and historical freeze are unchanged; rebuilding the server does not update an already running/installed session.

## Host presentation decision

Official documentation distinguishes model/component-visible content from component-only metadata; it does not state that a model must reproduce credits in final prose. Compatible MCP Apps hosts can render a server-owned result card alongside the conversation. Keep the ordinary tools functional for clients without UI. A small result card with adjacent required linked credits is the next presentation option to prototype and visually verify, not an implemented or universally supported feature. A static source directory alone is not assumed to satisfy every provider's adjacent-credit/logo requirement.

Sources checked19October2026: [tool-result reference](https://developers.openai.com/plugins/reference#tool-results), [MCP UI and compatibility guidance](https://developers.openai.com/plugins/build/chatgpt-ui). No arbitrary cross-platform display guarantee follows from these documents. Existing rights/admission and OpenWeather logo/public method gates remain.

## Review and verification

Plan independently reviewed before implementation. Local resolver regression failed first on missing exactID. Credit checker regressions failed before implementation. Independent final review found raw-Markdown false passes; a regression reproduced them and the conservative rendering guard fixed them. Six focused checks pass; type checks and plugin build pass. Full-suite result is recorded in the completion entry after execution.

Tasks12B/15 remain open; categories remain15local accepted/2local remaining/8release dependent/2separate-deferred. No provider requests, datasets, credentials, quota mutation, deployment or publication.

Completion evidence: full permitted offline suite1,859passed/0failed/2skipped (1,861total), exit0;34affected MCP tests passed,0skips; type checks and server build passed. The initial restricted full run is retained separately and is not the accepted verification run. Logs: `reuse-credit-permitted-full.log` and `reuse-credit-focused.log` in the ignored local evidence directory. Exact-head CI follows the push; its final result is reported in the handoff rather than inferred from local checks.
