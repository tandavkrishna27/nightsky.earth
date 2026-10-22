# Claude remote MCP route

**Reviewed:** 22 October 2026 from Anthropic's directory documentation. Product availability and account policy can change; verify again before submission.

## Public directory path

Anthropic now accepts directory submissions from paid Claude accounts through [the developer portal](https://claude.ai/directory/manage). For an owned remote MCP service, its [publishing guide](https://claude.com/docs/directory/publish) calls for two submissions from the same Claude organization: the production server as an MCP connector, then a plugin bundle with skills pointing to that same server. The connector URL is `https://mcp.nightsky.earth/mcp`. The source folder for the bundle is `plugins/nightsky-claude`; publish its reviewed contents on a small dedicated release branch for the portal, because the full repository branch exceeds Anthropic's archive size limit. It is separate from the OpenAI package and the local Claude rehearsal archive. Do not submit a loopback endpoint or infer that a local rehearsal proves the public Claude journey.

Before either submission, connect the production service privately in Claude and review the actual tool list, annotations, source display, planning card behavior and data gaps. Claude's [connector checklist](https://claude.com/docs/connectors/building/submission) says to call each tool in Claude; provider requests must stay within the separately approved quota allowance. Review the optional `recommend_specialist_tools` content against the [Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy), including its limits on advertising and paid placement. Then complete the connector's portal listing, icon, data-handling answers and any applicable UI screenshots.

The ChatGPT and Claude packages have independent manifests, versions and skill instructions. Shared planning workflows live in `docs/product/workflows`. When those shared workflows change, run `node scripts/refresh-claude-workflows.mjs`, review the diff and decide whether Claude should adopt it; the script never changes the Claude version or skill instructions. Validate `plugins/nightsky-claude` with `claude plugin validate` and the portal's stronger Validate step. The plugin folder has its own README, license, skill workflows and HTTPS `.mcp.json` because installed users receive only that folder. The portal requires the connected GitHub account to have push access. Enter the exact branch name when it contains a slash, and revalidate after every source change. Do not submit for review or publish until the account owner has reviewed the data-handling and compliance declarations and the real Claude journey.

The [plugin submission guide](https://claude.com/docs/plugins/submit) states that an existing private submission must be continued rather than duplicated. Its portal data-handling questions include personal data, third-party services, retention and under-18 intent. Answer them from the live NightSky privacy policy and effective operation, not from a local fixture. Claude's own age rules apply to Claude users.

## Existing custom connector route

Anthropic documents custom remote MCP connectors in Claude and Claude Desktop for paid plans. Organization owners control shared connector configuration. This private route is useful for the native acceptance journey before directory submission.

The official implementation guide documents authless or OAuth remote MCP, Streamable HTTP or SSE (with SSE possibly deprecated), and tools/prompts/resources. NightSky uses remote Streamable HTTP and read-only tools, so it fits the documented transport/tool route. The service does not currently require user OAuth. This is protocol/feature alignment, not proof of a live NightSky connection or an official Claude directory listing.

## Setup and verification

In Claude, open **Settings → Connectors → Add custom connector** and enter the production MCP URL. The staging hostname intentionally denies public access, so it cannot serve as a normal Claude custom connector. Enable the required tools in **Search and tools**. Record plan, account region, Claude client, date, endpoint, tool list, and results for every host case in `host-cases.json`. Test whether structured outputs, source links, and partial results render as expected. Check location input; do not assume Claude passes the same location metadata as OpenAI.

## Skills and global availability

The Claude bundle is a separate projection of the canonical NightSky skills and workflows. Its packaging validation and real Claude behavior still need verification; MCP compatibility by itself does not prove skill behavior. Account eligibility, geography, and product availability should be verified with the intended users; this document makes no global availability claim.

## References

- [Anthropic: Getting started with custom connectors using remote MCP](https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp)
- [Anthropic: Building custom connectors via remote MCP servers](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers)
- [Anthropic: When to use desktop and web connectors](https://support.anthropic.com/en/articles/11725091-when-to-use-desktop-and-web-connectors)

## Local handoff — 19 October 2026

See the [final local acceptance record](../operations/v1-final-local-acceptance-20261019.md) and [host matrix](host-matrix.md). Local package rehearsals and Codex fixture evidence do not establish hosted ChatGPT, Claude or Gemini acceptance. The optional planning card defaults off; operator enablement and text-only credit limits are documented in the [delivery guide](../operations/v1-planning-card-delivery-20261019.md). Public endpoint/publisher/policy and actual-client checks remain release gates. No vendor eligibility recheck or publication occurred in this pass.
