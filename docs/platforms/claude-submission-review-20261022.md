# Claude directory review — 22 October 2026

## Decision and scope

Prepare two listings in the same Claude organization: the production NightSky MCP connector, followed by the NightSky skill bundle at `plugins/nightsky-claude`. Both reference `https://mcp.nightsky.earth/mcp`. This source change does not deploy or submit either listing.

## Prepared source

- The bundle has five skills, and each canonical workflow is copied inside its own skill folder because installed users receive only the selected plugin folder.
- `.mcp.json` points to the public HTTPS endpoint and contains no provider credentials.
- The bundle includes a README, logo and MIT license. `scripts/sync-claude-plugin.mjs` regenerates version, connection, logo and skills from canonical sources.
- Local `claude plugin validate ./plugins/nightsky-claude` passed. This checks package structure only; the portal performs stronger validation.
- Anthropic limits the scanned GitHub archive to under 50 MiB. The full NightSky branch is about 50.1 MiB compressed before this bundle, so the portal must track a small, dedicated public release branch containing only the reviewed Claude plugin folder. Do not point it at the full source branch and assume validation will pass.

## Native acceptance before submission

1. Confirm the intended Claude account has a paid eligible plan and the correct long-term owning organization. Connect the GitHub account with push rights.
2. Add the production endpoint as a private custom connector. Record the exposed tools, titles and read-only annotations. The staging URL is deliberately closed to the public.
3. Run a complete named-place journey in Claude: ask what NightSky can do; resolve a named city; make one source-linked observing plan; ask a follow-up for a selected nearby place or target; confirm source credits, exact time zones, partial results and site-access uncertainty. Set a bounded provider-request allowance before live calls.
4. Exercise remaining exposed tools with valid inputs under their source quotas. Record failures and classification. Do not claim full connector acceptance from one successful plan.
5. Review `recommend_specialist_tools` against Anthropic's prohibition on ads, sponsored content and promotional tool descriptions. The current tool offers optional product listings. No finding has yet established a violation, but this deserves an independent policy decision before connector submission.
6. Inspect whether Claude renders the planning card as an MCP App. If it does, prepare the directory's required UI screenshots.

## Portal handoff

- Connector listing: service name, concise purpose, icon, documentation, privacy and support URLs, no-auth public-data configuration, truthful provider/data-flow disclosures, and at least three working example prompts. Provide reviewer access details only through portal fields; do not publish credentials.
- Plugin bundle: repository `tandavkrishna27/nightsky.earth`, a dedicated small release branch, and its exact plugin path (repository root if only plugin files are published there). The release branch must be generated from the reviewed source bundle and checked for byte identity. Run portal Validate on that commit and resolve blocking findings before submitting.
- Answer data-handling and under-18 questions from current production behavior and published policy. The developer must personally review contact, legal and compliance acknowledgments.
- Publish only after the portal reports an eligible reviewed version. A successful local validator, GitHub PR, or directory draft is not a public listing.

Sources: [Anthropic publishing guide](https://claude.com/docs/directory/publish), [plugin pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist), [connector checklist](https://claude.com/docs/connectors/building/review-criteria), and [Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy).
