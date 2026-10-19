import {
  resolvePluginAction,
  type ListingConfig,
} from "../../../shared/website";
export type ReleaseFacts = {
  operator: string | null;
  hosting: string | null;
  recipients: string[] | null;
  loggedFields: string[] | null;
  retention: string | null;
  deletionProcess: string | null;
  analytics: string | null;
  sources: readonly {
    name: string;
    url: string;
    coverage: string;
    reviewedAt: string;
  }[];
  sourcesApprovedAt: string | null;
  hostingVerifiedAt: string | null;
  contentRightsApprovedAt: string | null;
  policiesApprovedAt: string | null;
  setupVerifiedAt: string | null;
};
export const releaseFacts: ReleaseFacts = {
  operator: "Tandav Krishna (TK), Hyderabad, Telangana, India",
  hosting:
    "Netlify hosts the website and its news function; site plan and account-level logging settings remain unverified. Hetzner Cloud in Helsinki hosts the deployed MCP server; its production HTTPS route and health endpoint were checked on 19 October 2026. Production nginx access logging is off and its error log is discarded; Docker logs are size-limited, so age varies, and journald has no configured age limit. The Hetzner Console shows automatic backups disabled and no snapshots for this server.",
  recipients: [
    "The AI platform selected by the visitor",
    "Netlify for website and news-function hosting",
    "Hetzner for the deployed NightSky MCP service; production nginx access logs are off, Docker logs are size-limited and journald has no configured age limit; automatic backups are disabled and there are no snapshots for this server",
    "Google Fonts for web fonts",
    "Google Analytics for optional website analytics, only after the visitor allows analytics",
    "Google Gmail for messages sent to the support address",
    "Spaceflight News API for website news searches",
    "Stellarium Web, including its IP-based location service and optional browser device-location request, for the interactive sky map; OpenStreetMap Nominatim may receive detected or selected coordinates for reverse geocoding",
    "Place, weather and climate providers listed in the Privacy Policy when the connected feature uses them",
  ],
  loggedFields: [
    "Website application code does not log request bodies or search query fields in the reviewed routes; after consent, NightSky sends Google Analytics sanitized manual page views while GA4 also creates standard session/first-visit events and processes baseline technical metadata",
    "Netlify may process network, request and function-log details; exact fields depend on hosting configuration",
    "The application emits fixed route and outcome diagnostics without request bodies, query strings or exact coordinates. Production nginx access logging is off and its error log goes to /dev/null; the catch-all vhost keeps separate access and error logs with daily rotation and 14 compressed rotations. Docker container logs are capped by size, not age, and persistent journald has no configured age limit",
  ],
  retention:
    "NightSky does not persist user request content or conversation history. Calendar preferences remain in the visitor's browser. Netlify dashboard function-log availability is up to seven days depending on plan; the site's plan and other host or mailbox retention settings are unverified. The deployed MCP service has bounded in-memory caches and a persistent provider quota ledger for usage buckets, not prompt history. Docker container logs are size-limited, so their age varies; journald has no configured age limit. Hetzner Console shows automatic backups disabled and no snapshots for this server as checked on 19 October 2026. No fixed deletion period is promised for host logs or backups. Provider caches and bounded in-memory abuse-prevention counters are transient service data, not request-history storage.",
  deletionProcess:
    "NightSky has no user accounts or persistent request history to delete. Support email is reviewed daily and deleted 90 days after the last reply; a new reply restarts that period. Users may contact the support address about email correspondence or other information held by the operator. Requests for copies held by AI platforms, Netlify or independent providers must be directed to those services.",
  analytics:
    "The website uses optional Google Analytics 4 only after explicit visitor consent. NightSky sends manual page views with a sanitized path, fixed site title and empty referrer; query strings and fragments are removed, and clicks, forms and scrolling are not tracked. GA4 also creates standard first_visit, session_start and user_engagement events and processes pseudonymous identifiers and baseline browser/device and approximate-location metadata. Enhanced Measurement, Google Signals and ad personalization are disabled; query parameter redaction is enabled. Analytics cookies are limited to 30 days, and GA user/event retention is configured to two months. Visitors can change their choice in the footer. Google Fonts and Google Gmail are separate website recipients. No analytics product is configured for the Hetzner MCP service; host-level account settings have not yet been verified.",
  sources: [
    { name: "Astronomy Engine", url: "https://github.com/cosinekitty/astronomy", coverage: "Local astronomy, Sun/Moon/planet positions, twilight and supported event calculations; MIT-licensed library.", reviewedAt: "2026-10-18" },
    { name: "GeoNames", url: "https://www.geonames.org/export/", coverage: "Researched named-place gazetteer; not part of the current production profile. Any future use requires service configuration and CC BY attribution.", reviewedAt: "2026-10-19" },
    { name: "Geoapify", url: "https://www.geoapify.com/terms-and-conditions/", coverage: "Active production place lookup and bounded candidate discovery. Geoapify and OpenStreetMap credits must be visible with results. Candidate records do not verify night access or sky darkness; no retained OSM candidate index is included.", reviewedAt: "2026-10-19" },
    { name: "MET Norway Locationforecast", url: "https://api.met.no/doc/TermsOfService", coverage: "Active production forecast source. CC BY attribution, identifying User-Agent, caching and traffic conditions apply; forecast fields may be partial or unavailable.", reviewedAt: "2026-10-19" },
    { name: "DarkSkySites.com", url: "https://www.darkskysites.com/api-terms", coverage: "Active production point-specific modelled zenith brightness and Bortle estimates. Not a live measurement or access assessment; linked DarkSkySites.com credit must accompany derived values.", reviewedAt: "2026-10-19" },
    { name: "NOAA SWPC OVATION", url: "https://www.swpc.noaa.gov/products/aurora-30-minute-forecast", coverage: "Researched short-horizon aurora model; not part of the current production profile. If enabled later, source and forecast time must be shown, with no personal sighting probability implied.", reviewedAt: "2026-10-19" },
    { name: "Global Meteor Network radiant models", url: "https://arxiv.org/html/2205.15423v1", coverage: "Twelve bounded radiant fits; the cited author-deposited paper version states CC BY 4.0. Fit domains and dates limit use.", reviewedAt: "2026-10-18" },
    { name: "NASA Meteoroid Environment Office reports", url: "https://ntrs.nasa.gov/citations/20260009360", coverage: "NASA MEO Table 3 maxima for eight night-capable showers in 2026–2027 only; UT minute values are shown as ISO UTC instants. Peak-only, not activity-season or visibility predictions. Report-specific source attribution and modification/precision notes are retained.", reviewedAt: "2026-10-18" },
    { name: "AstroPixels almanacs", url: "https://www.astropixels.com/almanac/almanac.html", coverage: "Reproduction of almanac data is permitted with the required credit: Sky Event Almanac Courtesy of Fred Espenak www.AstroPixels.com", reviewedAt: "2026-10-18" },
    { name: "IGN meteor-shower guidance", url: "https://astronomia.ign.es/en/orionidas", coverage: "Reference guidance; attribution/reuse terms need confirmation for any copied text or data. Current content should remain a link and original summary.", reviewedAt: "2026-10-18" },
    { name: "Spaceflight News API", url: "https://spaceflightnewsapi.net/", coverage: "Website news search metadata and links; article images and summaries are withheld pending reuse-term review.", reviewedAt: "2026-10-18" },
    { name: "7Timer! ASTRO", url: "https://github.com/Yeqzids/7timer-issues/wiki/Wiki#usage", coverage: "Researched forecast/seeing source; not part of the current production profile. If enabled later, retain source acknowledgement and keep categories and ranges within documented scope.", reviewedAt: "2026-10-19" },
    { name: "Copernicus ERA5", url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels", coverage: "Historical context may use operator-prepared, locally stored ERA5-derived summaries. This is not a live Copernicus/Open-Meteo query or a forecast; preserve CC BY attribution and artifact provenance when enabled.", reviewedAt: "2026-10-18" },
    { name: "Google Fonts", url: "https://fonts.google.com/knowledge/glossary/self_hosting", coverage: "Playfair Display and Inter font delivery; website requests Google-hosted font files, subject to Google service terms and privacy notice.", reviewedAt: "2026-10-18" },
    { name: "Google Analytics 4", url: "https://support.google.com/analytics/answer/12002338", coverage: "Optional consent-gated website analytics. NightSky sends sanitized manual page views with a fixed title and empty referrer; query strings and fragments are removed. GA4 also creates first_visit, session_start and user_engagement events and processes baseline technical metadata. Enhanced Measurement, Google Signals and ad personalization are disabled; query redaction is enabled. GA user/event retention is two months and analytics cookies expire after 30 days.", reviewedAt: "2026-10-18" },
    { name: "Stellarium Web", url: "https://stellarium-web.org/", coverage: "Third-party hosted interactive sky map. Its current web frontend uses its own IP-based location service and can request browser device location when the visitor chooses the opt-in mode; it may use OpenStreetMap Nominatim to reverse geocode detected or selected coordinates. Browser requests go directly to the providers. NightSky embeds the hosted service and does not bundle or modify engine code. Device-location behavior and provider policies should be rechecked before release.", reviewedAt: "2026-10-19" },
    { name: "OpenStreetMap Nominatim", url: "https://nominatim.org/", coverage: "May receive coordinates from Stellarium Web for reverse geocoding when its interactive map loads. Stellarium controls this integration; the NightSky app does not call Nominatim for the sky map. Check OSMF's current Nominatim usage and privacy policies before release.", reviewedAt: "2026-10-19" },
  ],
  sourcesApprovedAt: "2026-10-19",
  hostingVerifiedAt: "2026-10-19",
  contentRightsApprovedAt: "2026-10-19",
  policiesApprovedAt: "2026-10-19",
  setupVerifiedAt: null,
};
export function releaseBlockers(facts: ReleaseFacts, listing: ListingConfig) {
  const blockers: string[] = [];
  for (const [key, label] of [
    ["operator", "Operator identity"],
    ["hosting", "Hosting"],
    ["retention", "Retention"],
    ["deletionProcess", "Deletion process"],
    ["analytics", "Analytics declaration"],
  ] as const) {
    if (!facts[key]?.trim()) blockers.push(label);
  }
  for (const [key, label] of [
    ["recipients", "Recipients"],
    ["loggedFields", "Logged fields"],
  ] as const) {
    if (facts[key] === null) blockers.push(label);
  }
  for (const [key, label] of [
    ["sourcesApprovedAt", "Source inventory approval"],
    ["hostingVerifiedAt", "Hosting verification"],
    ["contentRightsApprovedAt", "Content rights approval"],
    ["policiesApprovedAt", "Policy approval"],
  ] as const) {
    if (!validReviewDate(facts[key])) blockers.push(label);
  }
  if (
    !facts.sources.length ||
    facts.sources.some((source) => !validSource(source))
  )
    blockers.push("Source inventory");
  if (
    resolvePluginAction(listing).external &&
    !validReviewDate(facts.setupVerifiedAt)
  )
    blockers.push("Verified setup");
  return blockers;
}

function validReviewDate(value: string | null): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
function validSource(source: ReleaseFacts["sources"][number]): boolean {
  if (
    !source.name.trim() ||
    !source.coverage.trim() ||
    !validReviewDate(source.reviewedAt)
  )
    return false;
  try {
    const url = new URL(source.url);
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
