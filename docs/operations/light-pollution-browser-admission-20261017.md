# Browser admission review — 17 October 2026

Status: **Public browser admission remains blocked for both sources.** This is a documentation review, not a legal determination or live adapter acceptance. No API requests, credentials, interactive browser extraction, tile downloads or map-data collection were performed.

## Scope and primary sources

Read the agreed design and the implementation plan, including all eight binding engineering corrections. Public pages were read using the web documentation reader; targeted public search was used to locate missing policy information.

| Primary URL | Result on review date | Verified facts versus unknowns |
| --- | --- | --- |
| https://darkskysites.com/api-access | Readable directly | Documents an official server-side API and adjacent, linked DarkSkySites.com attribution. It does not establish permission for automated map-page extraction. |
| https://darkskysites.com/api-terms | Documentation reader reported inaccessible | Terms content could not be verified. Trailing-slash and www variants also failed. This is a tool retrieval limitation, not evidence that terms do not exist. |
| https://www.lightpollutionmap.info/ | Readable page shell | Shows point-information and hover tools and layer controls. The retrieved text did not expose an automated-extraction license, reuse terms, cache allowance, rate policy or complete layer attribution. |

DarkSkySites API documentation currently requires visible DarkSkySites.com credit next to displayed data, linked to https://darkskysites.com where links work. It also identifies modeled estimates, provenance and quality fields; extra coordinate digits do not improve dataset resolution. These are API-specific facts, not a browser reuse grant. A search index returned older API limits inconsistent with the directly read page; do not use indexed snippets as current entitlement evidence.

## Unresolved policy gates

For each browser source, obtain a documented access/reuse basis covering automated visible-page lookup, extraction into another product, user-facing attribution, permitted request frequency, caching duration and redistribution. No such grant was verified in this review. Absence of a prohibition in retrieved text is insufficient evidence of permission.

Keep browser caching disabled. The proposed API cache policy is an implementation ceiling, not verified provider permission from the unread API terms. The operator should resolve the API terms separately before treating its cache policy as admitted. Do not infer map-layer rights from a basemap credit, public availability or the underlying satellite dataset's license. Preserve full relevant layer/model attribution when it becomes verifiable.

No provider communication was sent. No browser activation, even a small public pilot, is authorized by this report. API entitlement, API pilot authorization and browser admission are independent evidence gates.

## Concrete optional implementation recommendation

Implement the optional boundary and synthetic fixtures while admission is off. Compile the worker separately to dist/light-pollution-browser-worker.js; resolve it using import.meta.url and lazy-load pinned optional Playwright. API startup and packaging must succeed without Playwright or Chromium. Start with one active comparison and two waiting; queue time counts toward the 90-second comparison limit and each point has a 30-second limit. Cap JSONL input/output and terminate the complete browser process tree on cancellation, timeout, parent loss and shutdown. Measure memory and enforce a deployment process/container memory limit before public admission.

Use a fresh credential-free context and a minimal explicit child environment. Expose only a fixed provider enum, exact validated coordinates, candidate ID and request ID across the protocol. Do not accept URLs, scripts or selectors from MCP callers. Public page navigation must use fixed allowlisted HTTPS origins; resource origins must be separately inventoried and explicitly allowed. Disable downloads and unnecessary permissions; block service workers so network interception cannot silently omit their requests. These controls reduce surface area but do not establish network isolation.

Require a fresh visible selected-result association for every point. Submit coordinates through supported visible controls, clear prior selection, observe a new selected result after that action, and require visible exact-coordinate evidence attached to that same result. A URL, coordinate input, centered map, marker position or disappearance/reappearance alone proves intent or freshness, not that the displayed metrics belong to that point. Rounded labels and pointer-following hover metrics cannot independently bind results. Do not read hidden state, intercept private APIs or infer coordinates from pixel positions. If the UI lacks exact visible evidence, return unavailable with an explicit coordinate-binding failure and no SQM/Bortle values.

Fixtures should cover two distinct coordinates with identical rounded labels, old cards surviving navigation, conflicting hover/card values, multiple cards and reversed completion order. A fresh request ID protects the worker protocol; it cannot repair ambiguous provider DOM evidence. Retain actual layer/year and original retrieval time only when observed.

## Egress requirement and admission decision

Playwright routing plus hostname checks must not be described as rebinding-resistant isolation. DNS preflight and Chromium connection establishment can resolve differently; redirects, subresources, WebSockets, IPv6 and alternate address forms must all be covered. Validate all resolved addresses and redirects, rejecting loopback, private, link-local, unspecified, multicast and mapped private IPv6 destinations, but retain the public gate until the actual socket egress path is enforced.

Recommended deployment boundary: run the worker in a separate restricted process/container or network namespace whose only outbound route is a policy-enforcing proxy. The proxy must resolve destinations itself, reject non-public addresses on every connection, restrict hosts/ports, validate TLS targets, and deny direct egress bypass. Apply equivalent controls to WebSockets and redirects; reject unsupported protocols. Use OS-level process-tree lifecycle and resource limits. Required public resource origins and bandwidth budgets must be measured in a separately authorized bounded pilot before admission; do not invent an allowlist from this documentation read.

Until policy, exact coordinate binding, egress enforcement and measured runtime gates all pass, both browser transports stay opt-in **and unavailable for public operation**. Never retry an API authorization, quota or paid-feature failure through a browser. DarkSkySites remains one source across transports.

## Coordinator public-browser verification
The API terms page was successfully read in the in-app browser on 17 October 2026: https://darkskysites.com/api-terms , API_TERMS_2026_10_V2, effective 14 October 2026. API use in applications/services and reasonable operational caching are allowed with adjacent linked attribution; bulk reconstruction, quota evasion and a general-purpose substitute redistribution API are prohibited. This resolves the documentation-reader failure for API terms, not browser-page extraction rights. NightSky remains a scoped observing planner with bounded candidate lookups, not a raw bulk data service. No terms acceptance or account change was performed.
