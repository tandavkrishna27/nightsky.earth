# Publication checklist

The website release build is gated by documented facts and approvals. Build approval does not activate the MCP service or certify account-level hosting settings.

- [x] Operator identity and website data recipients recorded in the Privacy Policy and release facts.
- [x] Owner confirmed an 18+ audience, free plans only, and Hetzner Cloud in Helsinki for the future MCP host.
- [x] Owner dropped the retained regional OpenStreetMap candidate index from launch. If Geoapify Free is enabled, show both required Geoapify credit and OpenStreetMap attribution.
- [x] Source inventory corrected: 7Timer's current usage guidance permits free or paid software; WeatherAPI remains conditional on actual Free-plan confirmation; OpenWeather remains disabled pending exact product-license review; ERA5 is local historical context, not a live Open-Meteo request.
- [x] Reviewed website source for analytics tags and request-body/query logging; no third-party analytics tag or request-body/query logger was found.
- [x] Removed AMS-derived meteor dates without documented reuse permission. Calendar uses eight year-specific NASA MEO night-capable maxima with source/table attribution and minute-precision limits.
- [x] Owner confirmed existing website photos and video are generated or owner-created.
- [x] News page shows limited article metadata and links only; no article text, summaries or publisher images are republished.
- [x] Privacy Policy and Terms updated with 18+ eligibility, current no-fee wording, effective date 18 October 2026, provider disclosures and the adopted future Hetzner log policy.
- [x] Owner approved source inventory, selected hosting facts, content-rights screening and policy draft for the website release build on 18 October 2026. Hosting approval identifies the planned provider/region and disclosed deployment status; it is not live-server verification.
- [ ] Before enabling MCP: apply and verify Hetzner product/region, DNS/TLS, firewall, proxy, seven-day content-free log rotation, backup scope/restore, access controls, provider switches and attribution. Reconcile the plugin draft's 13+ age line to 18+ in its separate release workstream.
- [ ] Confirm Netlify production plan, custom-domain routing and account-level logging/retention; the current policy accurately marks these as unverified.
- [ ] Hero video public-delivery optimization evaluated.
- [ ] Review local preview and authorize publication separately.

The runtime provider switches and hosting settings were not changed. Do not publish a local noindex preview build. Netlify's production command remains `npm run build:release`; preview and branch deploys use `npm run build`.
