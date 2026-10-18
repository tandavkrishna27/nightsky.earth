import {
  siteRoutes,
  type SiteRoute,
  type ListingConfig,
  SITE_ORIGIN,
} from "./website";
import { legacyMeteorIds } from "./meteorContent";
import {
  releaseBlockers,
  type ReleaseFacts,
} from "../client/src/content/releaseFacts";
import { skyEvents } from "./skyEventCatalog";
import {
  validateSkyEvents,
  validateCoverage,
  type SkyEvent,
  type CoverageMonth,
} from "./skyEvents";
import { legacyCalendarDestination } from "./skyEventRoutes";
export function classifyPath(path: string) {
  if (path === "/meteor-nights" || path === "/meteor-showers")
    return { status: 301, location: legacyCalendarDestination };
  if (path === "/experiences" || path.startsWith("/experiences/"))
    return { status: 410 };
  if (
    siteRoutes.some((r) => r.path === path) ||
    skyEvents.some(
      (e) => e.reviewStatus !== "draft" && path === "/sky-events/" + e.id,
    ) ||
    /^\/news\/\d+$/.test(path) ||
    (path.startsWith("/meteor-shower/") &&
      legacyMeteorIds.includes(path.slice(15)))
  )
    return { status: 200 };
  return { status: 404 };
}
function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}
export function buildWebsiteOutputs({
  release,
  facts,
  listing,
  routes,
  events,
  coverageMonths,
  now = new Date(),
  legacyMeteorIds: ids,
}: {
  release: boolean;
  facts: ReleaseFacts;
  listing: ListingConfig;
  routes: readonly SiteRoute[];
  events: readonly SkyEvent[];
  coverageMonths: readonly CoverageMonth[];
  now?: Date;
  legacyMeteorIds: readonly string[];
}) {
  const validated = validateSkyEvents(events);
  const gaps = validateCoverage(coverageMonths, now);
  for (const event of validated)
    if (event.lastReviewedAt > now.toISOString().slice(0, 10))
      throw Error("Future review date: " + event.id);
  if (release) {
    if (gaps.length)
      throw Error(
        "Release blocked: unreviewed sky-event months " + gaps.join(", "),
      );
    const blockers = releaseBlockers(facts, listing);
    if (blockers.length)
      throw new Error("Release blocked: " + blockers.join(", "));
  }
  const paths = release
    ? [
        ...routes.filter((x) => x.sitemap).map((x) => x.path),
        ...validated
          .filter((x) => x.reviewStatus === "reviewed")
          .map((x) => "/sky-events/" + x.id),
      ]
    : [];
  return {
    sitemap:
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      paths
        .map((path) => "<url><loc>" + xml(SITE_ORIGIN + path) + "</loc></url>")
        .join("") +
      "</urlset>",
    robots: release
      ? [
          "# All crawlers, including search, answer retrieval, and model-training crawlers, may access public pages.",
          "# Google-Extended is included for Gemini Apps grounding; Google's control also permits model training.",
          "Sitemap: " + SITE_ORIGIN + "/sitemap.xml",
          ...[
            "Googlebot",
            "Bingbot",
            "OAI-SearchBot",
            "ChatGPT-User",
            "Claude-SearchBot",
            "Claude-User",
            "GPTBot",
            "ClaudeBot",
            "CCBot",
            "Google-Extended",
          ].flatMap((agent) => [
            "",
            "User-agent: " + agent,
            "Allow: /",
            "Disallow: /api/",
            "Disallow: /admin/",
            "Disallow: /*.json$",
          ]),
          "",
          "User-agent: *",
          "Allow: /",
          "Disallow: /api/",
          "Disallow: /admin/",
          "Disallow: /*.json$",
          "",
        ].join("\n")
      : "User-agent: *\nDisallow: /\n",
    headers: release ? "" : "/*\n  X-Robots-Tag: noindex, nofollow\n",
    redirects:
      "/api/news /.netlify/functions/news 200\n/api/news/* /.netlify/functions/news?article=:splat 200\n/meteor-nights /sky-events?category=meteor-showers 301\n/meteor-showers /sky-events?category=meteor-showers 301\n/experiences /.netlify/functions/retired 200\n/experiences/* /.netlify/functions/retired 200\n" +
      routes.map((x) => `${x.path} /index.html 200`).join("\n") +
      "\n" +
      [
        ...ids.map((id) => `/meteor-shower/${id} /index.html 200`),
        ...validated
          .filter((e) => e.reviewStatus !== "draft")
          .map((e) => `/sky-events/${e.id} /index.html 200`),
      ].join("\n") +
      "\n/news/* /index.html 200\n/* /404.html 404\n",
  };
}

export function resolveBuildListing(
  fileEnv: Record<string, string | undefined>,
  processEnv: Record<string, string | undefined>,
): ListingConfig {
  const env = { ...fileEnv, ...processEnv };
  return {
    published: env.VITE_NIGHTSKY_LISTING_PUBLISHED === "true",
    url: env.VITE_NIGHTSKY_LISTING_URL || null,
  };
}
