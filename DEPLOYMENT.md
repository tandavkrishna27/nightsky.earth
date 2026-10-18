# Website preview and publication

Run commands only inside this website worktree. Never use the plugin checkout or service as a website dependency.

- Install: npm ci
- Development: npm run dev:website -- --port=5180
- Preview build: npm run build (noindex)
- Serve build locally: npm run start:website -- --port=5180
- Verify: npm run check; npm run check:tests; npm run test:unit; npm run test:browser; npm run test:host
- Publication build: npm run build:release (refuses missing factual approvals)

Vite's public directory is client/public. Build generates sitemap.xml, robots.txt, _redirects and _headers in dist/public, plus dist/website-build.json for the Express preview server. No upstream news request is used to create a sitemap.

Netlify is the confirmed deployment host. Its checked-in configuration selects the gated publication build, so it cannot publish the noindex preview output. Generated API rewrites precede fallback rules. The shared read-only news adapter serves local Express and Netlify functions; retired Experiences receives a real 410 through a narrow function. Local Express route/API behavior has tests. Netlify deployment equivalence must be validated before publication; no deployment was performed.

Release `robots.txt` allows all crawlers on public pages, including search, user-requested retrieval, and model-training crawlers. Google-Extended is included for Gemini Apps grounding; Google's single robots control also permits model-training use. API, admin, and JSON endpoints remain excluded. These directives express the site's preference to compliant crawlers; they are not access controls.

News article previews are client routes; absent dynamic article IDs show client not-found/noindex rather than guaranteeing a server HTTP 404. Fixed unknown routes and invalid meteor IDs receive host 404. Known legacy meteor IDs retain safe archive notices and no dated claims.

See docs/website/release-checklist.md for approvals that remain outside local preview scope.
