# NightSky client release process

**Established:** 22 October 2026. Recheck each host's current rules before a public submission or update.

## Ownership boundaries

NightSky's astronomy, provider routing, quota enforcement, provenance and public MCP endpoint are shared server capabilities. Each AI client owns its package, version, user instructions, listing, review evidence and release decision. A server deployment is separate from publication to an AI directory. A client package update does not itself deploy the server.

| Track | Owned release material | Validation and distribution |
|---|---|---|
| NightSky server | `server/`, shared contracts, provider configuration and state | Exact-commit source/image checks, protected staging and production promotions, then public health and bounded data acceptance |
| ChatGPT | `plugins/nightsky/`, OpenAI listing and native review cases | OpenAI package review and submission in its existing record; keep its version and publisher evidence independent |
| Claude | `plugins/nightsky-claude/`, `claude/nightsky-directory`, Claude connector and plugin drafts | Focused Claude package check, portal validation of the exact small release branch, native Claude connector and skill checks, then connector and plugin submissions from the same Claude organization |
| Future Gemini or Grok | A client-specific package or documented connector setup only when that host supports it | Verify that host's current eligibility, package format, tool behavior and listing process before creating a release track |

The canonical planning workflows live in `docs/product/workflows`. `scripts/refresh-claude-workflows.mjs` copies those references into Claude only when run and reviewed. ChatGPT and Claude own their manifest, version, connection and skill instructions. Future clients must follow the same explicit adoption rule; copying a workflow does not imply a client version bump or publication.

## Change procedure

1. Classify the change as server, shared workflow or client-specific. Name every affected host. For server or shared-contract changes, review existing ChatGPT behavior and Claude behavior before public deployment. A client-only change stays in that client's package and listing.
2. Review privacy, provider terms, attribution and quota effects for the affected behavior. Never copy provider keys into a client package; production provider keys remain in the protected server deployment path.
3. Record an exact source commit. Run the relevant repository checks and the client package check. A green server build does not establish that an AI client renders a result correctly.
4. For Claude, copy only the reviewed bundle into the small `claude/nightsky-directory` release branch. Compare every released file byte for byte with the source bundle and validate that exact branch in the Claude portal. The full source repository exceeds Claude's scanned archive limit.
5. Run a native client journey with a stated upstream request allowance. Check actual tool permissions, place identity, local times, source credits, partial data and visual rendering. Do not retry a provider call to investigate a UI error. Record the result and any limitations under `docs/platforms/`.
6. Submit or update each client listing independently. Preserve its own version, reviewer correspondence and approval status. For Claude, submit the MCP connector first and the plugin referencing it second. Never infer one host's approval from another host's approval.
7. After a server deployment or client publication, verify the corresponding live endpoint or listing and record the exact image digest or package commit. Roll back the affected track if needed; a Claude listing correction should not silently change the ChatGPT package.

## Current gate

The Claude source package and release branch are prepared, and the connector portal draft is saved. Claude displayed the NightSky planning card, and the standalone astronomy text correction has passed a bounded native check on the current production release. The portal now shows 19 tools without metadata suggestions. Public Universe timed out after quota reservations in the latest host report, and valid-call coverage of all 19 tools is incomplete. Complete the native review before connector and plugin submissions. The portal self-test and policy/legal acknowledgements remain unchecked for the account owner.

See [Claude submission review](claude-submission-review-20261022.md), [Claude route](claude.md), [ChatGPT route](chatgpt.md) and [host case record](host-run-record-template.md).
