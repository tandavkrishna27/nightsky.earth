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
    "Netlify hosts the website and its news function; site plan and account-level logging settings remain unverified. The owner selected Hetzner Cloud in Helsinki for the MCP server. The MCP server is not yet deployed there, so its host, firewall, TLS, proxy and logging controls are not operationally verified.",
  recipients: [
    "The AI platform selected by the visitor",
    "Netlify for website and news-function hosting",
    "Hetzner for the MCP service when it is deployed in Helsinki; host-side processing and logging have not yet been verified",
    "Google Fonts for web fonts",
    "Google Gmail for messages sent to the support address",
    "Spaceflight News API for website news searches",
    "Place, weather and climate providers listed in the Privacy Policy when the connected feature uses them",
  ],
  loggedFields: [
    "Website application code does not log request bodies or search query fields in the reviewed routes",
    "Netlify may process network, request and function-log details; exact fields depend on hosting configuration",
    "The adopted Hetzner service-log policy is route, status and elapsed time only; request bodies, queries, exact coordinates and client IP addresses are excluded. This policy is not yet applied or verified on a live host",
  ],
  retention:
    "NightSky does not persist user request content or conversation history. Calendar preferences remain in the visitor's browser. Netlify dashboard function-log availability is up to seven days depending on plan; the site's plan and other host or mailbox retention settings are unverified. The adopted policy for future Hetzner service logs is a maximum of seven days with rotation and no request bodies, queries, exact coordinates or client IP addresses. This policy has not yet been applied or verified on a live host. Provider caches and bounded in-memory abuse-prevention counters are transient service data, not request-history storage.",
  deletionProcess:
    "NightSky has no user accounts or persistent request history to delete. Users may contact the support address about email correspondence or other information held by the operator. Requests for copies held by AI platforms, Netlify or independent providers must be directed to those services.",
  analytics:
    "No third-party analytics or advertising tracker is included in the website code reviewed. The site loads Google Fonts; Netlify may process operational traffic and function logs. No analytics product is planned for the Hetzner MCP service; host-level account settings have not yet been verified.",
  sources: [
    { name: "Astronomy Engine", url: "https://github.com/cosinekitty/astronomy", coverage: "Local astronomy, Sun/Moon/planet positions, twilight and supported event calculations; MIT-licensed library.", reviewedAt: "2026-10-18" },
    { name: "GeoNames", url: "https://www.geonames.org/export/", coverage: "Named-place gazetteer; CC BY attribution required; data is provided as-is. Local index or provider API use depends on service configuration.", reviewedAt: "2026-10-18" },
    { name: "Geoapify", url: "https://www.geoapify.com/terms-and-conditions/", coverage: "Conditional place-candidate API only. Do not enable unless the Free-plan Geoapify credit and required OpenStreetMap attribution are displayed and the configured API/region is verified. No retained OSM candidate index is included in launch coverage.", reviewedAt: "2026-10-18" },
    { name: "MET Norway Locationforecast", url: "https://api.met.no/doc/TermsOfService", coverage: "Conditional weather forecast integration; CC BY attribution, identifying User-Agent, caching and traffic conditions apply.", reviewedAt: "2026-10-18" },
    { name: "NOAA SWPC OVATION", url: "https://www.swpc.noaa.gov/products/aurora-30-minute-forecast", coverage: "Short-horizon aurora model only; source and forecast time must be shown, and no personal sighting probability is implied.", reviewedAt: "2026-10-18" },
    { name: "Global Meteor Network radiant models", url: "https://arxiv.org/html/2205.15423v1", coverage: "Twelve bounded radiant fits; the cited author-deposited paper version states CC BY 4.0. Fit domains and dates limit use.", reviewedAt: "2026-10-18" },
    { name: "NASA Meteoroid Environment Office reports", url: "https://ntrs.nasa.gov/citations/20260009360", coverage: "NASA MEO Table 3 maxima for eight night-capable showers in 2026–2027 only; UT minute values are shown as ISO UTC instants. Peak-only, not activity-season or visibility predictions. Report-specific source attribution and modification/precision notes are retained.", reviewedAt: "2026-10-18" },
    { name: "AstroPixels almanacs", url: "https://www.astropixels.com/almanac/almanac.html", coverage: "Reproduction of almanac data is permitted with the required credit: Sky Event Almanac Courtesy of Fred Espenak www.AstroPixels.com", reviewedAt: "2026-10-18" },
    { name: "IGN meteor-shower guidance", url: "https://astronomia.ign.es/en/orionidas", coverage: "Reference guidance; attribution/reuse terms need confirmation for any copied text or data. Current content should remain a link and original summary.", reviewedAt: "2026-10-18" },
    { name: "Spaceflight News API", url: "https://spaceflightnewsapi.net/", coverage: "Website news search metadata and links; article images and summaries are withheld pending reuse-term review.", reviewedAt: "2026-10-18" },
    { name: "7Timer! ASTRO", url: "https://github.com/Yeqzids/7timer-issues/wiki/Wiki#usage", coverage: "Conditional forecast/seeing integration. The operator states data may be used in free or paid software; retain source acknowledgement and keep forecast categories and ranges within their documented scope.", reviewedAt: "2026-10-18" },
    { name: "Copernicus ERA5", url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels", coverage: "Historical context may use operator-prepared, locally stored ERA5-derived summaries. This is not a live Copernicus/Open-Meteo query or a forecast; preserve CC BY attribution and artifact provenance when enabled.", reviewedAt: "2026-10-18" },
    { name: "Google Fonts", url: "https://fonts.google.com/knowledge/glossary/self_hosting", coverage: "Playfair Display and Inter font delivery; website requests Google-hosted font files, subject to Google service terms and privacy notice.", reviewedAt: "2026-10-18" },
  ],
  sourcesApprovedAt: "2026-10-18",
  hostingVerifiedAt: "2026-10-18",
  contentRightsApprovedAt: "2026-10-18",
  policiesApprovedAt: "2026-10-18",
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
