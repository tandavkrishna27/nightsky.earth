# Claude directory review — 22 October 2026

## Decision and scope

Prepare two listings in the same Claude organization: the production NightSky MCP connector, followed by the NightSky skill bundle at `plugins/nightsky-claude`. The Claude release is planned to use `https://mcp.nightsky.earth/mcp?presentation=text` after that route is deployed and verified. The existing private connector still points at `/mcp`; editing source does not change or submit either listing.

## Prepared source

- The bundle has five skills, and each canonical workflow is copied inside its own skill folder because installed users receive only the selected plugin folder.
- `.mcp.json` points to the public HTTPS endpoint and contains no provider credentials.
- The bundle includes a README, logo and MIT license. Claude owns its manifest, version, connection and skill instructions. `scripts/refresh-claude-workflows.mjs` updates only shared workflow reference copies when explicitly run and reviewed.
- Claude Code 2.1.308's plugin validator passed. The Claude portal validated the small release branch at `ef1ebe7`: 5 skills, 1 MCP server, 28 files/entries and 673.4 kB, with no blocking findings. Its four warnings concern directory URL fields in the manifest that this validator version does not recognize; the portal still shows all six listing links.
- Anthropic limits the scanned GitHub archive to under 50 MiB. The full NightSky branch is about 50.1 MiB compressed before this bundle, so the portal must track a small, dedicated public release branch containing only the reviewed Claude plugin folder. Do not point it at the full source branch and assume validation will pass.

## Native acceptance before submission

1. Confirm the intended Claude account has a paid eligible plan and the correct long-term owning organization. The inspected account showed Max; GitHub push-rights confirmation for directory submission remains a portal gate.
2. The production endpoint was added and connected as `NightSky.earth private test` in Claude. Claude exposed 19 tools: 18 in its read-only group and `Plan a night-sky observing session` in its interactive group because it can show a planning card. All tool permissions remain at Claude's default `Needs approval`. The staging URL is deliberately closed to the public.
3. Run a complete named-place journey in Claude: ask what NightSky can do; resolve a named city; make one source-linked observing plan; ask a follow-up for a selected nearby place or target; confirm source credits, exact time zones, partial results and site-access uncertainty. Set a bounded provider-request allowance before live calls.
4. Exercise remaining exposed tools with valid inputs under their source quotas. Record failures and classification. Do not claim full connector acceptance from one successful plan.
5. Review `recommend_specialist_tools` against Anthropic's prohibition on ads, sponsored content and promotional tool descriptions. The current tool offers optional product listings. No finding has yet established a violation, but this deserves an independent policy decision before connector submission.
6. Inspect whether Claude renders the planning card as an MCP App. If it does, prepare the directory's required UI screenshots.

### First native connector observation

On 22 October, a private Claude chat loaded the 19 connected tools without a provider call. A bounded Cape Town request then made one `resolve_place` call and one `plan_observing_session` call, each approved once. Claude reused the returned place ID and source revision, used `Africa/Johannesburg` for 24 October 20:00–23:00, and produced a readable plan with timestamped MET Norway samples and Geoapify, OpenStreetMap, Astronomy Engine and MET Norway credits. No retry was selected. This checks the private connector and text response; it does not exercise the five packaged Claude skills or the full tool surface.

Claude displayed “There was a problem displaying content from NightSky.earth private test” where the planning card should appear, although its text answer used the successful plan response. Treat MCP App rendering as an open issue for Claude. Do not use the host's Retry button for diagnosis because that can repeat provider calls. Inspect the card's resource/protocol behavior and resolve or explicitly scope a Claude text-only route before public connector submission.

The server logs showed a later `resources/read` completion at 11:49:55 UTC with HTTP 200 but did not record the URI, so it cannot be attributed to this card. The diagnostic plan at `docs/superpowers/plans/2026-10-22-claude-card-diagnosis.md` adds a fixed planning-card/other label before another observation. A successful generic resource read is not evidence that Claude rendered the NightSky card.

### Fresh card observation and Claude text presentation

On 22 October, a fresh Claude Cape Town chat called `resolve_place` once and `plan_observing_session` once. Both completed with HTTP 200. The production diagnostic recorded one `resources/read` labeled `planning-card`, also HTTP 200 in 3 ms. An independent public MCP probe confirmed that `tools/list` advertises the card, `resources/list` includes it, and `resources/read` returns the exact URI, `text/html;profile=mcp-app`, HTML, and CSP metadata. Claude nevertheless displayed only a text answer and stated that no card was available. This narrows the failure to the host-side rendering path after the resource fetch; it does not prove whether Claude rejected the HTML, failed its iframe handshake, or suppressed the view. Do not claim the MCP App works in Claude or submit UI screenshots from ChatGPT as Claude evidence.

The text answer also proposed an observing window from sparse cloud instants despite the tool's explicit warning not to infer one. That answer is unsuitable as a positive review example. Recheck the next native Claude plan for this behavior before submission.

The reviewed fallback is an exact `?presentation=text` MCP URL. It omits the card registration and result metadata for that request while retaining the complete source-linked text. The existing planner excludes OpenWeather when the card is off, so Claude does not receive values whose required logo it cannot display. Plain `/mcp` remains card-enabled for ChatGPT. Promote and verify the route before changing the private Claude connector or the directory draft. Verify that Claude preserves the URL query and shows the plan as text without a failed card, then refresh the dedicated Claude release branch from the reviewed plugin folder and rerun portal validation.

## Portal handoff

- Connector listing: service name, concise purpose, icon, documentation, privacy and support URLs, no-auth public-data configuration, truthful provider/data-flow disclosures, and at least three working example prompts. Provide reviewer access details only through portal fields; do not publish credentials.
- Plugin bundle: repository `tandavkrishna27/nightsky.earth`, a dedicated small release branch, and its exact plugin path (repository root if only plugin files are published there). The release branch must be generated from the reviewed source bundle and checked for byte identity. Run portal Validate on that commit and resolve blocking findings before submitting.
- The portal draft tracks `claude/nightsky-directory` at the repository root. Its data-handling answers are `Reads only` for personal data, `Yes — listed in README` for optional non-connector search/browsing, `Longer` for conservative treatment of technical retention with no fixed age limit, and `No` for under-18 use. Confirm these against production and published policy before submission.
- The developer must personally review the contact address and four legal, privacy, security and contact acknowledgments. None have been checked in the draft.
- Publish only after the portal reports an eligible reviewed version. A successful local validator, GitHub PR, or directory draft is not a public listing.

Sources: [Anthropic publishing guide](https://claude.com/docs/directory/publish), [plugin pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist), [connector checklist](https://claude.com/docs/connectors/building/review-criteria), and [Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy).
