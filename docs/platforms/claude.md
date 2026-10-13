# Claude remote MCP route

**Reviewed:** 13 October 2026 from Anthropic's official Help Center. Product availability and account policy can change; verify again before launch.

## Current route

Anthropic documents custom remote MCP connectors in Claude and Claude Desktop for Pro, Max, Team, and Enterprise plans. The feature is described as beta. Team/Enterprise organization connectors require an owner to configure the connector; users then connect individually. Anthropic's current connector article also says already-added connectors can be used in Claude mobile, while mobile users cannot add new servers directly.

The official implementation guide documents authless or OAuth remote MCP, Streamable HTTP or SSE (with SSE possibly deprecated), and tools/prompts/resources. NightSky uses remote Streamable HTTP and read-only tools, so it fits the documented transport/tool route. The service does not currently require user OAuth. This is protocol/feature alignment, not proof of a live NightSky connection or an official Claude directory listing.

## Setup and verification

When a staging URL exists, in Claude open **Settings → Connectors → Add custom connector**, enter the staging MCP URL, then enable the required tools in **Search and tools**. For Team/Enterprise, an owner first configures an organization connector. Record plan, account region, Claude client, date, endpoint, tool list, and results for every host case in `host-cases.json`. Test whether structured outputs, source links, and partial results render as expected. Check location input; do not assume Claude passes the same location metadata as OpenAI.

## Skills and global availability

MCP tool compatibility does not make OpenAI `SKILL.md` packaging automatically portable to Claude. Any Claude-specific reusable skill/package route needs its own implementation and test. Account eligibility, geography, and product availability should be verified with the intended users; this document makes no global availability claim.

## References

- [Anthropic: Getting started with custom connectors using remote MCP](https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp)
- [Anthropic: Building custom connectors via remote MCP servers](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers)
- [Anthropic: When to use desktop and web connectors](https://support.anthropic.com/en/articles/11725091-when-to-use-desktop-and-web-connectors)
