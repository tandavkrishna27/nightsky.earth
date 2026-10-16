import {
  siteRoutes,
  type SiteRoute,
  type ListingConfig,
  SITE_ORIGIN,
} from "./website";
import { legacyMeteorIds, type ReviewedMeteor } from "./meteorContent";
import {
  releaseBlockers,
  type ReleaseFacts,
} from "../client/src/content/releaseFacts";
export function classifyPath(path: string) {
  if (path === "/meteor-nights")
    return { status: 301, location: "/meteor-showers" };
  if (path === "/experiences" || path.startsWith("/experiences/"))
    return { status: 410 };
  if (
    siteRoutes.some((r) => r.path === path) ||
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
  meteors,
  legacyMeteorIds: ids,
}: {
  release: boolean;
  facts: ReleaseFacts;
  listing: ListingConfig;
  routes: readonly SiteRoute[];
  meteors: readonly ReviewedMeteor[];
  legacyMeteorIds: readonly string[];
}) {
  if (release) {
    const blockers = releaseBlockers(facts, listing);
    if (blockers.length)
      throw new Error("Release blocked: " + blockers.join(", "));
  }
  const paths = release
    ? [
        ...routes.filter((x) => x.sitemap).map((x) => x.path),
        ...meteors.map((x) => "/meteor-shower/" + x.id),
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
      ? "User-agent: *\nAllow: /\nSitemap: " + SITE_ORIGIN + "/sitemap.xml\n"
      : "User-agent: *\nDisallow: /\n",
    headers: release ? "" : "/*\n  X-Robots-Tag: noindex, nofollow\n",
    redirects:
      "/api/news /.netlify/functions/news 200\n/api/news/* /.netlify/functions/news?article=:splat 200\n/meteor-nights /meteor-showers 301\n/experiences /.netlify/functions/retired 200\n/experiences/* /.netlify/functions/retired 200\n" +
      routes.map((x) => `${x.path} /index.html 200`).join("\n") +
      "\n" +
      ids.map((id) => `/meteor-shower/${id} /index.html 200`).join("\n") +
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
