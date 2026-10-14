# Local reverse proxy rehearsal

This wave models one reverse proxy connected to a loopback backend. It does not establish readiness for any Hetzner plan, region, hostname, firewall, certificate, or deployed topology. No external listener, deployment, account, source fetch, or historical download is used.

Run `node scripts/verify-local-proxy.mjs` from the repository. The command has a 30 second process bound. Independently, requests and callback-entry waits have 2 second bounds, each fixture has a 5 second bound, listener startup/cleanup have 2 second bounds, and asynchronous tests have 10 second bounds. These protections also apply when the tests run through the aggregate suite. Delayed gates release in finally, including assertion failures; listeners close even when another cleanup step fails. Fixtures open ephemeral listeners on 127.0.0.1, close connections and listeners in cleanup, and inject delayed local operations. IPv6 trust matching is tested directly; the local listener exercise uses IPv4 loopback and forwarded IPv6 client addresses.

## Opt-in trust contract

Proxy trust defaults disabled. The standalone plugin accepts `NIGHTSKY_MCP_TRUSTED_PROXIES` as a comma separated list of explicit IP addresses or narrow CIDRs: IPv4 /24 through /32, IPv6 /64 through /128, at most 32 entries. Invalid entries cause startup failure before listening. Names, broad networks, `true`, wildcards, empty list entries, scoped and mapped IPv6 configuration addresses are rejected. Socket IPv4 mapped IPv6 peers are normalized for matching.

This contract supports exactly one proxy hop. The trusted proxy must replace X-Forwarded-For with the verified socket client IP; it must not append client supplied values. Multi-hop configurations require another reviewed design. Only hop zero is trusted; additional forwarded chains or a malformed forwarded address from that peer receive 400. Missing X-Forwarded-For falls back to the immediate peer and its shared budget. Untrusted peers' forwarded headers do not change their client admission identity. The real socket and infrastructure firewall determine peer trust; allowing loopback necessarily trusts local processes able to connect there.

Host validation and the 32 KiB JSON body limit remain enforced by their existing controls. A trusted identity is solely an admission key, not authentication, user identity, or proof of consent. Subject, IP, global, concurrency and provider budgets retain their independent roles. Native HTTP assertions check Host rejection because the Node fetch implementation can rewrite an explicit Host header.

## Lifecycle and logging evidence

The fixture proxy streams the upstream response directly without buffering; successful tools/list replies retain SSE data framing. Its synthetic 50 ms upstream timeout closes the backend connection and returns 504. Actual client cancellation also closes that connection. Neither event frees the backend request admission while an abort-ignoring tool callback remains pending. Every callback acquires a per-request lease, released in its own finally; transport completion releases admission only after all its tool work settles. Repeated release is idempotent. Callback starts after the request lease has closed are refused. This covers injected providers and composed operations as well as index reads, without retaining unrelated requests behind another request's index read.

An operation that never settles can retain an admission slot indefinitely; this is intentional bounded concurrency. Cancellation does not guarantee all injected work stops. Production provider timeouts and their retained operation slots remain separate controls. This rehearsal proves a representative fixture timeout and recovery, not the timeout settings of an unknown production proxy.

Log assertions reject query values, body values, authorization values, request identifiers, spoofed headers and client addresses. Successful and rejected MCP requests retain only the existing operational log fields. Production proxy access/error logs must be configured with equivalent omission; their contents are outside this fixture's backend logging proof.

The suite verifies narrow configuration, trusted/untrusted peers, IPv4/IPv6 matching, default-off shared proxy budgets, independent forwarded client budgets, overwrite protection against supplied spoofing, malformed/extra chains, Host/body limits, SSE delivery, timeout/cancellation admission retention, recovery after settlement, and backend log privacy.
