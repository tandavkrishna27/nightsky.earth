# Website design and content review

Date: 16 October 2026
Target: 2026-10-16-website-product-design.md
Method: author self-review using the brainstorming spec checks and design/engineering review checklists. This is not a completed interactive gstack review, independent model review, rendered visual audit, or implementation verification. No application files or plugin files were changed.

## Outcome

Ready for owner review of the written design. Not yet approved for implementation or publication. The content now preserves the existing brand while explaining a product broader than outing plans. The main outstanding items are release/deployment facts and owner review, not additional marketing features.

## Design review

Scores describe specification completeness, not a tested website or guaranteed design quality. No dimension is scored 10: mockups, actual catalogue content, released plugin evidence, and rendered accessibility checks remain outstanding.

| Dimension | Assessment | Score | Evidence and remaining limit |
|---|---|---|---|
| Information architecture | Clear first screen, ordered Home sections, explicit header/footer/routes | 9/10 | Hero answers product/destination; Resources and News have separate utility roles. Validate actual header fit on tablet. |
| Interaction states | Local search, clipboard, feed, listing, meteors, contact all specified | 9/10 | Failure-state table prevents pretend success or blank screens. Implement and test actual states later. |
| User journey | Curiosity to possibilities, understanding, experience and action | 8/10 | Activity links go to learning topics, while the primary action consistently reaches setup/listing. Real audience feedback not gathered. |
| Specificity and repetition | Existing hero retained; each section has one job | 8/10 | Cards introduce activities; example panel introduces kinds of help; imagery provides a short pause. Check rendered page length and trim if repetitive. |
| Design-system continuity | Existing palette, fonts and components retained deliberately | 8/10 | Typography does not change just to satisfy a generic skill preference. Real contrast and media inspection are outstanding. |
| Responsive/accessibility | Widths, reflow, focus, labels, touch targets and reduced motion specified | 9/10 | Removing duplicate mobile navigation simplifies space. Keyboard and screen-reader behavior still need implementation checks. |
| Decision clarity | Known decisions separated from recommendations and launch dependencies | 8/10 | News retention and navigation defaults await owner review; policy/source facts cannot be inferred. |

### Journey check

| Moment | Visitor need | Design response |
|---|---|---|
| First five seconds | What is this and where can I use it? | Preserved headline plus explicit ChatGPT description and one primary action |
| First scroll | Is this relevant to my interests? | Stargazing, photography, events, places |
| Further exploration | Can it help with more than making plans? | Understand, Explore, Compare, Prepare |
| Practical evaluation | Can I trust its scope? | Qualified examples, sources link, no live-answer simulation |
| Return visit | Is there something useful here without installing? | Searchable Resources and attributed News |
| Community interest | Is there a real group I can join now? | Honest future-facing Collective page with no membership claim |

### Design litmus check

- Product clear on the first screen: specified yes; render review needed.
- Strong visual anchor: retained stars and brand headline.
- Scannable headings: concrete activity names and utility page titles; poetic headings are paired with practical introductions.
- One job per section: explicitly distinguished above.
- Cards earned: activity links and resource/article results are interactive; editorial text is not wrapped in gratuitous cards.
- Motion supports atmosphere: optional hero media and restrained transitions, with reduced-motion fallback.
- Depends on ornamental effects: no; hierarchy must hold without shadows or animation.

## Findings incorporated into the design

| Finding | Why it mattered | Resolution |
|---|---|---|
| Product narrative was overly limited to question -> plan | Conflicted with the owner's explicit correction | Broader four-mode explanatory section; curiosity and learning appear across hero, About and closing copy |
| Activity cards and example section could repeat each other | Long homepage could feel like duplicated feature lists | Activity cards answer what interests the visitor; examples answer how NightSky helps |
| Waiting for real plugin responses could block design | No verified captured answer has been supplied | Launch with clearly labelled example questions and explanatory text; genuine answer can be added after review |
| Primary CTA could imply a public listing exists | Local plugin development is not publication | Central availability state; Get started fallback with explicit status; no invented listing URL |
| Community could accidentally solicit interest before a form exists | Owner explicitly deferred all forms/CTA decisions | Editorial page only; no placeholder, disabled button or newsletter mechanism |
| Resource search was underspecified | Multiple interpretations would produce inconsistent results/history | Exact matching, topic/format combination, URL state, invalid-value handling and empty-state copy specified |
| News could fail after a static deploy | Express API routes are absent from a static publish directory | Host verification plus website-owned read-only function adapter for checked-in Netlify path |
| News outage currently breaks dynamic sitemap | Sitemap endpoint calls external news before listing site pages | Independent route inventory; external article fetch removed from critical sitemap path |
| Old meteor content includes broad claims and expiry risk | Date/year and Moon labels can mislead; catalogue ends in 2026 | Mandatory fact review, source/review metadata, fixed-time boundary tests, evergreen fallback |
| Retired routes could remain publicly reachable | Removing navigation alone does not retire pages | Disable route/import, remove references, explicit host retirement response |
| SEO could retain travel identity or broken assets | HTML defaults and structured data also tell the product story | Full metadata, canonical, sitemap, logo/OG and organization identity audit |
| Contact could pretend delivery succeeded | Existing handler logs locally and shows Message Sent | Replace with visible support email and explicit mailto behavior |
| Policy language could make invented data promises | Actual logging/operator facts are not available | Local drafts permitted; final publication blocked until factual and owner/legal review |

## Engineering review of the proposed approach

This is an early engineering assessment of the design, not the formal task-by-task implementation-plan review.

Architecture: React/Vite/Wouter and current UI patterns suffice. Local Resources search needs neither a server nor a search vendor. Listing state belongs to website configuration, not scattered button handlers. News delivery belongs to the website, not the plugin service. The current Netlify/Express mismatch is the only proposed hosting adaptation; determine actual hosting before writing two equivalent backends.

Code quality: separating the large Resources catalogue is justified by new search/filter behavior. No global architecture refactor or content-management system is justified. Preserve existing valid meteor IDs and use one route inventory to avoid public links, sitemap, and route drift. Keep future Experiences source without importing it into the active public bundle.

Tests: no application baseline was run because this phase changes documents only. Later checks must exercise resource multiword/combined/invalid/history behavior, news failures/races and pagination, host route responses, sitemap independence, listing unavailable state, and date-boundary fallback. Static prose does not need tests that simply duplicate the strings.

Performance: retain fallback imagery, avoid hidden content waiting for animation, do not add a live planner or external search service, and use bounded news requests. The star background is reused by owner preference, but its size/loading and reduced-motion behavior need measurement. Remove deliberate page delays and audio startup rather than optimize around them.

### Failure registry and intended verification

| Failure | Visitor experience | Required check |
|---|---|---|
| Listing missing or malformed | Read truthful setup/status page | Unit/interaction check for both listing states |
| Resources query has no matches | Guidance and working clear action | Search behavior test |
| Invalid resource URL filters | Defaults and recoverable results | Direct URL/back-forward test |
| Clipboard denied | Selectable question and copy instructions | Clipboard rejection check |
| News provider slow/unavailable | Inline retry; other pages remain usable | Mock failure/timeout; production-shaped API smoke |
| Late news response | Newer search remains visible | Controlled response ordering test |
| Calendar has no reviewed future records | Evergreen preparation content | Fixed clock after last reviewed event |
| Retired URL opened directly | Appropriate actual host response | HTTP status and body check |
| Preview hostname/query leaks into canonical | Fixed canonical production URL | Metadata inspection on preview URL |
| Media fails or motion is reduced | Readable hero and working actions | Browser failure/reduced-motion check |
| Policy facts not confirmed | Draft stays in preview; publication withheld | Release checklist sign-off |

## Editorial review

Check applied across all proposed copy:
- Each section must add a new idea; poetic headings get practical introductions.
- No fictional team, origin scene, customer quote, member count or partnership.
- No “all-in-one,” “perfect conditions,” “best spot,” guaranteed visibility or universal coverage.
- No unverified current prices, provider capabilities or platform eligibility.
- Clear distinction between candidate places and verified access, forecasts and history, examples and live answers.
- Body copy explains outcomes in familiar words. Sources/policies hold the detail required for informed use.

The new story preserves wonder without pretending to be an expedition operator. About describes purpose rather than a fictional biography. Resources and News retain distinct jobs: practical knowledge versus externally published reporting. The Collective remains future-facing and contains no hidden conversion expectation.

## Delivery and unresolved matters

Only the written design/content draft and this review are deliverables in this change. A formal implementation plan follows owner review of the written design, in accordance with the brainstorming workflow. The full interactive gstack design/engineering workflows and an independent review have not run; do not label their dashboard statuses as cleared.

Owner review needed: written design/copy, recommended News/navigation defaults.
Publication facts needed: public listing and setup evidence; actual sources/coverage; operator and data practices; actual website hosting; retained-content verification/reuse rights.
Deferred by owner: Collective form and action.

Verdict: coherent design/content draft with concrete acceptance criteria; ready for owner review, not cleared for implementation or publication.
