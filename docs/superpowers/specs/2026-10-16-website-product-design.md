# NightSky.earth website: product story and design specification

Date: 16 October 2026 (Asia/Calcutta)
Status: Design and content approved by the owner in chat on 16 October 2026. Detailed implementation planning and review authorized; implementation and publication remain pending.
Branch: codex/website-plugin-design
Base: main at a59260a

## 1. Purpose and boundaries

Introduce NightSky as a companion for exploring, understanding, comparing, planning, and preparing for the night sky through ChatGPT. Help a new visitor understand its relevance and reach its verified plugin listing. Give returning visitors searchable resources, attributed news, and a credible introduction to The Collective.

The website must preserve its existing dark sky identity and hero. It must stop presenting NightSky as an operating expedition company. It must not reduce every interaction to generating an outing plan.

Only website documentation and, after separate approval, website code may change in this worktree. Do not edit, install into, start processes from, format, test, commit, merge, or deploy the plugin worktree. Do not modify plugin manifests, skills, service code, or shared plugin data. Request missing launch facts from the owner; do not attempt to fix the plugin to satisfy the website.

Confirmed owner decisions:
- Keep the star background and the headline “Where Earth meets the stars.”
- Remove the Our Story section from Home.
- Keep Resources under that name and add useful search.
- Keep The Collective; remove WhatsApp. No community form, signup, waiting list, placeholder button, or data collection in this phase. The owner will provide a form later.
- Adapt the About story without names or invented biographical history.
- Use NightSky.earth2026@gmail.com for support.
- Include supporting sources, privacy, and terms pages.
- Expeditions are a later product direction and must not be advertised as current services.

Approved defaults: retain News as a secondary page; no separate How it works page or header item; preserve the restrained Playfair Display/Inter typography and existing colors rather than introduce a new design system.

Success: a visitor can identify the product and its ChatGPT destination from the first screen; find a useful resource; understand the distinction between explanation, evidence, and predictions; and never encounter a false installation, booking, form-success, or community-membership promise.

## 2. Approach and existing assets

Chosen approach: evolve the React/Vite website in place. Reuse hero, photography, content sections, buttons, news fetch flow, and meteor route structure. Curate and separate the oversized Resources catalogue from its rendering. No new CMS, search service, accounts, plugin calls from the website, or web-based planning tool.

Alternatives considered:
1. Minimal text/button replacement: smaller change, but retains conflicting trip content and does not solve resource discovery, trust, or setup.
2. Full rebrand and website planner: adds a second product surface and backend ownership during plugin development. Outside this phase.

The existing design_guidelines.md supplies the palette and atmosphere, but its expedition positioning and “emotion first, information second” priority must be revised. Emotional language belongs in selected headings; practical explanations must remain concrete.

## 3. Information architecture

Header: logo/Home | Resources | The Collective | News | About | primary plugin action.
Home's secondary hero action links to #possibilities. A short getting-started strip links to /get-started; no additional main-navigation item.

Footer groups:
- Explore: Resources, Meteor Showers, The Collective, News, About.
- Help: Get started, Contact, Sources & coverage.
- Policies: Privacy, Terms.
- Brand line: “Where Earth meets the stars.”
- Verified support email; no unverified social destinations or subscription action.

```text
Home
  hero -> verified listing OR Get started launch status
  possibilities -> Resources topic links
  understand/explore/compare/prepare -> sample questions + Get started
  moments -> The Collective (ordinary navigation link)
  upcoming meteors -> Meteor Showers -> shower details
  closing action -> same primary destination as hero
Resources -> searchable tools and learning material -> original sources
News -> attributed summaries -> original reporting
About / Collective -> editorial pages
Get started -> listing, setup help, support
Sources / Privacy / Terms -> factual supporting pages
```

Routes:
| Route | Decision |
|---|---|
| / | Rewrite Home |
| /resources | Keep; searchable curated collection |
| /community | Keep URL; display The Collective |
| /news and /news/:id | Keep; attributed third-party summaries |
| /about | Rewrite |
| /contact | Support email; no simulated form |
| /meteor-showers | New canonical name for converted meteor index |
| /meteor-nights | Permanent redirect to /meteor-showers |
| /meteor-shower/:id | Preserve valid existing identifiers; review content |
| /get-started | New setup/status page |
| /sources | New sources and coverage page |
| /privacy and /terms | New supporting pages, factual sign-off required |
| /experiences | Retired response; no redirect to an unrelated product page |
| unmatched | Accessible not-found page |

Preserve retired Experiences source for later; disable its import/route and remove all inbound public links, sitemap entries, and offer metadata. Do not preserve public booking sections on other pages. Implement redirect/retirement behavior on the actual deployment host, not only in the client router.

## 4. Primary action and availability

Use one website-owned setting for listing availability and the exact verified public URL, shared by all primary actions. No inferred URL or generic directory substitute. A missing/invalid HTTPS listing URL must behave as unpublished.

| State | Button | Destination and explanation |
|---|---|---|
| Public listing verified | Get NightSky for ChatGPT | Exact NightSky listing; external destination made clear |
| Listing not public or not supplied | Get started | /get-started; “NightSky's public ChatGPT listing is not available yet. Explore how it works below, or contact us with a question.” |

Do not offer notifications or imply an existing waiting list. Do not promise install completion, account access, free ChatGPT access, subscription eligibility, mobile support, or platform parity. Setup steps and requirements must match tested release evidence. Keep ChatGPT as the leading destination; other platforms are not promoted until verified.

Official reference, checked during this conversation: https://developers.openai.com/plugins/deploy/app-review#publication-and-distribution supports exact directory links after publication. Recheck this flow when connecting the production listing.

## 5. Home: copy and composition

### 5.1 Hero

Keep the existing full-width star/video background, still-image fallback, dark overlay, serif headline, centered composition, and warm gold button. Inspect the actual media for embedded old messaging before reuse. No entrance gate, ambient music, forced wait, dashboard, fake prompt input, or response card inside the hero.

Eyebrow: “Your night-sky companion”
Headline: “Where Earth meets the stars.”
Body: “Explore the night sky with NightSky in ChatGPT. Understand what you could see, choose when to go, and prepare for your time under the stars.”
Primary: availability-aware action in section 4.
Secondary: “Explore what’s possible” -> #possibilities.

The headline preserves identity; the body supplies product clarity. No additional brand slogan in this viewport. Keep the body readable against moving imagery and limit desktop line length to approximately 60 characters.

### 5.2 Journeys Under the Infinite — #possibilities

Introduction: “A quiet evening, a first photograph, a moment you don't want to miss. Start with what draws you outside.”

Four image links; retain the existing card concept because the image and text form an actual navigation target. Each goes to a Resources topic filter; it does not pretend to execute the question.

| Title | Body | Destination |
|---|---|---|
| A night of stargazing | Explore what may be visible from your chosen place and date, and understand the conditions that matter. | /resources?topic=stargazing |
| A photograph to work towards | Bring your subject and equipment into the conversation, from a first attempt to a more considered session. | /resources?topic=photography |
| A moment in the sky | Learn about supported meteor showers and sky events, then explore their relevance to your location. | /resources?topic=events |
| Somewhere to look up | Explore candidate observing places where coverage is available, and identify the access details still worth checking. | /resources?topic=places |

No durations, package prices, reservations, or claims that a suggested place is safe, open, or verified dark.

### 5.3 The Universe, Explained Beautifully

Introduction: “Follow a question a little further. Understand a condition, explore an idea, compare your options, or prepare for something new.”

Use an editorial example panel with four manually selected modes. On mobile, wrap controls into two rows; no auto-rotation or swipe-only interaction. Show a sample question and a concise explanation of how NightSky helps. These are illustrative questions, not simulated live answers.

| Mode | Sample question | Explanatory text |
|---|---|---|
| Understand | Why does the Moon matter when watching meteors? | Explore how moonlight, darkness, and your observing goal relate, and ask for an explanation at your level. |
| Explore | What could a beginner look for from my destination on my chosen night? | Start with a named place and date, then explore supported observing possibilities and the evidence available. |
| Compare | How do these two nights differ for observing? | Compare the supported astronomy and weather evidence for the alternatives you choose, with sources and gaps kept visible. |
| Prepare | What should I consider for my first night-sky photograph? | Talk through your subject, camera, and lens, then work towards an appropriate starting approach. |

Permanent label: “Example questions — start a conversation in ChatGPT.”
Controls: “Copy question” (copies only the selected text; announces “Question copied”) and “Getting started” -> /get-started. Copy failure: “Couldn’t copy. Select and copy the question above.” Preserve selectable text.

Do not invent dates, visibility, weather, bearings, scores, or polished success stories. If a genuine response is added later, require review, captured date, location/timezone where relevant, source links, and explicit example labelling. A real response is not required to launch this version.

Short getting-started strip below, not another full section:
1. “Add NightSky” — open its published listing when available.
2. “Start with your curiosity” — share a question, or a named place, date, and goal for local planning.
3. “Keep exploring” — ask why, compare alternatives, or work through preparation.

### 5.4 Moments Beneath the Infinite

Introduction: “A little understanding can change the way you spend a night outside.”
Use three photographs with short original editorial captions, not quotation marks or testimonial styling:
- “Observe. Take time to notice what is above you.”
- “Photograph. Explore a subject and learn through the attempt.”
- “Learn. Follow the questions the night leaves you with.”

This is a brief visual pause, not another benefits grid. Use a wider lead photo and two supporting images on desktop; a simple vertical sequence on mobile. No carousel. Link: “Discover The Collective” -> /community. This is navigation, not a membership action.

### 5.5 Next Meteor Showers

Introduction: “Explore what’s approaching, then find out what it could mean for your chosen place and night.”
Show at most three future, reviewed year-specific records: name, full date/year, short explanation, “Explore this shower.” Index link: “Explore meteor showers.” Do not headline ideal hourly rates or generic favorable Moon claims. Global catalogue dates are not user-local viewing windows.

When no reviewed future records exist, replace the cards with: “Preparing for a meteor shower? Start with darkness, Moon conditions, and a comfortable place to watch.” Link to the evergreen meteor guide. Do not fabricate next-year records or present expired events as upcoming.

### 5.6 Ready to look up?

Body: “Bring a question, a place, or an idea. Explore your next step with NightSky in ChatGPT.”
Primary: same availability-aware action as hero.
Text link: “Need help getting started?” -> /get-started.

Our Story is removed. News is not inserted on Home. No testimonials, subscription capture, bookings, or expedition conservation claims.

## 6. Resources

Headline: “Find what helps you look up.”
Introduction: “Explore tools, guides, and practical knowledge for your next night outside.”

Layout: title and introduction; visible search label; search; topic and format controls; results count/active filters; results; simple plugin-related next step. Keep all content available without a plugin account.

Search label: “Search resources”
Placeholder: “Try Moon, photography, or sky maps”
Topics: All, Stargazing, Photography, Weather, Sky events, Places, Equipment.
Formats: All, Apps & tools, Guides, Videos & courses, Communities.

Search is local over a curated catalogue. No remote search API or new dependency is required. Each entry has stable ID, name, factual description, topics, format, URL, and last-reviewed date; platform and cost labels are optional and only displayed if reviewed. Separate catalogue data from the existing 1,100-line page. No universal “best” badge or current-price promise.

Matching: trim the query, normalize case, split whitespace, require every query word to occur in the combined title/description/topic text. Search and filters combine with AND. Retain editorial order. URL state uses q, topic, format; invalid topic/format values default to All. Back/forward restores controls and results. Default view shows all curated records, with a small “Start here” introduction rather than a second independent catalogue.

Display a result count; clear-all action resets query and filters. Use labelled select controls where space is constrained. Empty: “No resources match this search. Try a broader term or clear your filters.” Clear-filters action. Static catalogue means no pretend network spinner. Search is keyboard-operable and result count announced politely without moving focus.

Initial catalogue review covers every retained record. Remove unverified prices/counts, unsupported software-platform claims, stale services, duplicate entries, and unsupported destination superlatives. Existing astronomy resources may be retained only after checking their official destination and factual description. A record that cannot be verified is omitted from launch. Display “Reviewed [date]”; do not imply it is a live availability check.

Closing line: “Have a question about putting it into practice? Explore it with NightSky in ChatGPT.” Use section 4 action.

## 7. The Collective

URL remains /community. Navigation label and page identity: The Collective.
Headline: “For everyone who looks up.”
Introduction: “Different places, different experience, the same curiosity. The Collective is the community we want to grow around the night sky.”

Editorial sections:
1. “A shared curiosity.” Body: “Some of us are learning the constellations. Some are working towards a photograph. Others simply want an evening away from the glow of the city. There is room for each of those beginnings.”
2. “Learning from one another.” Body: “We want NightSky to grow through the questions people ask and the experience they bring: what helped, what was confusing, and what they would like to explore next.”
3. “What comes next.” Body: “Shared learning, observing stories, and ways to connect are part of the direction we are exploring. This page will evolve as those opportunities take shape.”

End with a quiet closing sentence: “A shared sky. Many ways to experience it.” No conversion block. Ordinary Resources/About navigation may remain in the footer. No form, interest capture, signup, disabled CTA, fabricated member count, event calendar, benefits programme, funding, logistics, sponsorship, or claim of an operating expert collective. Owner's future form is a later change with separate privacy review.

## 8. About

Headline: “A little closer to the night sky.”
Introduction: “NightSky begins with a simple wish: to help more people find their way from curiosity to time under the stars.”

“The wish to look up.” Body: “A clear evening can begin with a small question. What is that bright point? Is this a good night for meteors? Could I photograph the sky with what I already have?”

“The questions before the night.” Body: “An idea soon meets practical details: the Moon, darkness, weather, timing, equipment, and where to go. Understanding how those pieces fit can make the next step easier.”

“Why NightSky.” Body: “We are building NightSky to bring that exploration into a conversation. Ask for an explanation, examine the evidence for a chosen night, compare alternatives, or work through how to prepare.”

“Wonder, with understanding.” Body: “A useful answer should help you understand its basis. NightSky is designed to keep sources, timing, and missing information visible, so curiosity can lead to a more considered decision.” Link to /sources.

“Room to grow.” Body: “The wider ambition is to bring people closer to the sky and to one another. The Collective is where that part of the story will take shape.” Link to /community.

Close with section 4 action. No names, invented origin scene, travel history, years of experience, team credentials, existing partnerships, nonprofit identity, or unsupported conservation funding claim.

## 9. News and article previews

Keep /news and valid /news/:id routes. Existing backend fetches Spaceflight News API articles; the astronomy keyword controls do not establish astronomy-specific coverage. Preserve the feed's honest breadth rather than promise observing alerts or local visibility.

Headline: “News from the sky and beyond.”
Introduction: “Explore astronomy and space stories from external publishers. Follow each story to its original reporting.”

Search label “Search news”; existing publisher filter can remain if choices match values actually returned by the provider. Label astronomy buttons “Search topics,” not verified categories. Date/source on every preview; explicit “Summary from [publisher]” attribution. No “real-time,” “40+ trusted sources,” complete coverage, or source endorsements without substantiation. No automatic interpretation of a news story as local observing advice.

Show 12 articles per page with labelled Previous/Next and current page context. Remove the grid/scroll toggle unless a meaningful second interaction survives review; one responsive results layout is sufficient. Changing query/source resets page to 1; last request wins. Query changes must not fire unbounded requests on every keystroke: submit through the labelled search form, preserve URL search/page/source state, and avoid duplicate pending requests. Out-of-range page after refreshed counts returns to page 1 with clear context.

Article preview: headline, publisher, original publication date, credited image where permitted, attributed summary, “Read the original at [publisher]” link, Back to News. Do not present externally authored content as original NightSky reporting. Verify provider terms and permitted text/image reuse before launch; if rights cannot be established, omit affected media or reduce to permitted linking rather than assume reuse is allowed.

Loading: skeletons only inside result area. Empty: “No stories match this search. Try another topic or clear your filters.” Failure: “We couldn’t load the news right now. Try again in a moment.” Retry action. If cached results remain, show them with “Showing previously loaded stories”; preserve visible timestamps and do not relabel stale results as current. Missing article: clear not-found message + Back to News.

## 10. Meteor information

Index title: “Plan a night for the meteors.”
Introduction: “A shower’s peak is a starting point. Darkness, the Moon, weather, and where you watch all shape the experience.”

Keep reviewed year-specific records separate from evergreen shower background. Default to the current reviewed year, clearly distinguish past and upcoming records, and never silently roll dates into a new year. Remove “all 24 major showers”: the current arrays repeat twelve showers across two years. Audit date, source, timezone interpretation, rate definition, Moon text, visibility, parent-body and difficulty claims. Do not replace the plugin's data or import its service as the website's calendar.

Detail page: factual overview, reviewed activity/peak dates, source and review date, radiant context, observing factors, beginner preparation, related Resources, suggested question to copy into ChatGPT. Typical idealized rates require qualification; no generic “favorable Moon” or “visible worldwide” claims without appropriate evidence. Remove booking, ticket offers, camping, food, guides, accommodation, equipment-provision, and tour structured data.

Without reviewed dated content, provide an evergreen shower guide instead of false precision. The existing local date helper mixes date-only parsing with local time; define upcoming against the catalogue's documented date basis, test boundary behavior, and label dates as general catalogue dates rather than local calculated windows.

## 11. Get started, Contact, Sources, and policy pages

### Get started
Headline: “Bring your curiosity to ChatGPT.”
Introduction: “Add NightSky when its public listing is available, then start with the question you want to explore.”
Sections: actual availability; verified listing action if public; tested setup steps and account/device requirements only when supplied; sample questions from section 5; what to include for local planning; troubleshooting; support email. Before verified setup is supplied, show launch-status copy and illustrative questions without invented installation steps. Copy-question works without installing. No email capture.

### Contact
Headline: “Help us make NightSky better.”
Body: “Have a question, found something confusing, or noticed information that needs a closer look? Email us at NightSky.earth2026@gmail.com.”
Supporting text: “For a problem with an answer, include the question, the place and date if relevant, and what seemed wrong. Leave out personal details you do not want to share.”
Action: “Email NightSky” -> mailto:NightSky.earth2026@gmail.com. Explain that it opens the user's email app. Keep the address selectable. No existing simulated form or delivery-success toast; no promised response time.

### Sources & coverage
Headline: “Understand what your answer is based on.”
Introduction: “Different questions need different evidence. This page explains the sources behind the released service, where they apply, and what they cannot establish.”
Required sections: release-specific source inventory and attribution; calculated astronomy versus forecasts; forecast issue/valid times and horizons; historical seasonal context; event and target coverage; candidate observing-place coverage and access unknowns; missing/stale/partial evidence; reporting a problem.
Only list provider integrations confirmed in the released service. Do not promote an optional or experimental source as universally live. This inventory requires owner-supplied release facts before publication.

### Privacy
Readable structure: operator/contact; website information and logs; plugin inputs and processing; external recipients/providers; purpose and retention; deletion/contact process; actual analytics/cookies; relationship to ChatGPT processing; effective date. No blanket “we store nothing,” “no tracking,” or universal security/compliance claims. A draft may be built locally but must not be published as final policy before facts are confirmed.

### Terms
Readable structure: operator; service purpose; eligibility and permitted use; availability; evidence limitations; third-party services/content; user responsibilities; applicable terms/liability/governing arrangements once established; contact; effective date. Final legal language and identity details require owner/legal sign-off. Do not invent jurisdiction or publish placeholder legal promises.

## 12. Visual and interaction system

Reuse Cosmic Black #0C0C0E, Midnight Blue #0E1633, Starlight White #F2F1EB, Meteor Gold #C2A977 as design intent; validate actual rendered contrast. Playfair Display headings and Inter body are retained to respect existing identity. No new fonts, illustration system, decorative badge suite, or generic icon-in-circle grid. Existing circular placeholder icons are removed with their old benefit section.

Hero and closing CTA may be centered. Editorial explanations and support pages use left-aligned reading columns. Resources/News use utility labels and readable results. Use restrained borders/radii already present; no fake glass dashboards or decorative chart scores. Retain subtle entrance/hover effects only where they support atmosphere and orientation. No auto-advancing examples, forced page delays, or hidden primary content awaiting animation.

Responsive acceptance widths: 375, 768, 1024, 1440 CSS pixels, plus 320 reflow and 200% zoom. Desktop activity cards four across, tablet two, phone one. Resource filters become labelled selects/wrapped controls rather than off-screen chips. Mobile navigation uses one header menu and a reachable primary action; remove the old duplicate five-item bottom navigation and its reserved padding. Closing action must not obscure content.

Accessibility: semantic landmarks and one h1/page, skip link, visible focus, keyboard-operable menu and example selection, Escape closes menu and focus returns to trigger. Example controls use native buttons with clear selected state and keyboard reachability; panel changes announced or associated accessibly. Visible field labels, 44px touch targets, body text at least 16px, body contrast at least 4.5:1, larger text 3:1. Reduced-motion preference pauses decorative video/animation and uses fallback image. No autoplay audio. Meaningful link names and image alt text; decorative imagery has empty alt text. Do not use color alone for active, visited, or error states.

## 13. Engineering approach and deployment findings

No framework migration. Reuse React, Wouter, existing components and fetch flow. A shared website configuration owns listing state, support email, navigation destinations. A shared catalogue owns Resources records. Clear content modules may hold exact copy; avoid one giant marketing component or a new CMS.

```text
website configuration -> Navigation / Footer / plugin action / Get started
resource catalogue -> local search + filters -> Resources results
existing news provider -> website-owned delivery adapter -> News / article preview
reviewed website meteor catalogue -> index / details / Home upcoming
route inventory -> client routing + host redirects + sitemap
```

Observed deployment risk: netlify.toml publishes static dist/public, but /api/news and the dynamic sitemap are Express routes in server/routes.ts. A local working feed does not demonstrate that those routes exist on static hosting. Verify actual deployment before implementing News changes. Default resolution for the checked-in Netlify path: expose the existing read-only news proxy through a website-owned Netlify function and explicit /api/news routing, preserving query validation, request bounds, timeout, and errors. No dependency on or deployment of the plugin service. If the owner confirms an Express deployment, reuse Express instead and remove duplicate route ownership.

Sitemap: generate the website page/meteor inventory without any upstream news request. News failure must never make sitemap fail. Include only canonical public routes; article entries are optional and not fetched in the critical sitemap path. Configure old meteor redirect before SPA fallback; configure /experiences retirement with an actual host response. Verify direct URL refresh for all new routes. Do not claim an HTTP 404/410 based only on client-rendered text.

SEO: update initial HTML as well as per-route descriptions, Open Graph images, canonical URLs, structured data, robots and sitemap. Use a fixed production site origin for canonical URLs rather than preview origin or query-bearing browser href. Preserve valid old shower IDs; repair every sitemap entry pointing at nonexistent IDs. Remove invented founder dates and organizations' social identities. Review logo/default OG references: the current public folder does not establish that the referenced files exist.

## 14. Interaction and failure-state inventory

| Feature | Pending/loading | Empty/unavailable | Failure | Success/partial |
|---|---|---|---|---|
| Hero media | Text/actions visible over fallback | Fallback still image | Still image or solid readable surface | Video optional, motion preference respected |
| Plugin CTA | No request needed | Get started with truthful status | Invalid config treated as unpublished | Exact verified listing |
| Resources | Static content; no fake spinner | Broader-term guidance + Clear filters | Invalid URL values normalized | Count, visible filters, stable editorial order |
| Example questions | Immediate local content | All four examples provided | Clipboard fallback text | Copied announcement; no fake tool execution |
| News | Result skeletons, header/search usable | Clear-search action | Retry; cached list clearly identified | Publisher/date/attribution; pagination |
| Meteors | Reviewed local data | Evergreen preparation fallback | Omit unverified records | At most three future reviewed items |
| Collective | Immediate editorial content | No action required | No third-party form dependency | Full page without membership promise |
| Contact | Selectable email always visible | Email app may be unavailable | User can manually copy address | No assertion email was sent |
| Policies/sources | Local review draft | Release facts missing -> publication blocked | No invented policy promises | Publish only after factual sign-off |

## 15. Delivery stages and acceptance evidence

This section is a delivery outline, not the separately approved task-by-task implementation plan.

1. Establish website-only baseline and route/config inventory. Install dependencies only in this worktree when implementation is authorized; record existing check/build results and preserve unrelated failures.
2. Rewrite shared shell, Home, About, Collective, Contact and Get started with listing-unavailable state. Verify links, responsive behavior, and removal of all public booking copy.
3. Curate Resources and implement local search/filters/URL state. Test multiword matching, combined filters, invalid values, no results, clear, and browser history.
4. Retain News with correct deployment delivery, attribution and failure states. Test query validation, search reset, request race, provider failure, missing article and direct route refresh.
5. Review website meteor data, index/detail copy, upcoming boundaries, and evergreen fallback. Tests use fixed time near catalogue day/year boundaries and do not call plugin tools.
6. Complete sources/policy drafts with release facts, metadata, assets, canonical routes, host redirects, independent sitemap and accessibility checks.
7. Type check, production build, meaningful interaction tests for new behavior, production-shaped route/API smoke checks, keyboard/mobile/reduced-motion review, full link and residual-copy audit. No new tests merely mirror static paragraphs.

Evidence required: actual commands/output for type check and build; resource behavior tests; news outage/sitemap independence test; routing/retired HTTP checks; fixed-time meteor fallback test; mobile and keyboard review notes. No performance/accessibility claims based only on source inspection. Planning documents do not establish a passing application baseline.

## 16. Launch dependencies and deferred work

Owner/plugin release facts needed, without any edits to plugin workspace:
- Exact public listing URL and published status; tested installation flow and account/device availability.
- Actual released capability/source/coverage inventory.
- Operator identity, hosting/providers, logged fields, retention, deletion process, analytics/cookies, and policy sign-off.
- Confirmation of website hosting; Netlify configuration is evidence of intent, not proof of deployment.
- News-provider reuse terms for retained summaries/images and official checks for Resources and meteor facts.

Dependencies do not stop local design/build. They do stop publishing unsupported claims or incomplete policies. The site can remain in preview with an honest Get started state while publication facts are gathered.

Deferred: community form and its CTA, member accounts, community channels, expeditions, bookings, web planner/map, saved sessions, automatic alerts, new platform promotions, CMS, paid search service, analytics installation, testimonials, personalized live website forecasts, new branding, and website deployment. Each requires its own scope when requested.

## 17. Review handoff

Review this document's content, navigation and interactions before a detailed implementation plan is written. Subsequent plan should map each acceptance requirement to exact website files, bounded changes and checks. Do not interpret this design draft, its self-review, or a future build as permission to publish the website or modify the plugin.
