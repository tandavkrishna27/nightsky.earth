import { auditMajorEventCoverage } from "../shared/skyEventCoverage";
import { skyEvents, coverageMonths } from "../shared/skyEventCatalog";
import { build as viteBuild, resolveConfig, loadEnv } from "vite";
import { build as esbuild } from "esbuild";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  buildWebsiteOutputs,
  resolveBuildListing,
} from "../shared/websiteBuild";
import { siteRoutes } from "../shared/website";
import { legacyMeteorIds } from "../shared/meteorContent";
import { releaseFacts } from "../client/src/content/releaseFacts";
import { renderRouteHtml } from "../shared/seoHtml";
process.env.NODE_ENV = "production";
const release = process.argv.includes("--release");
const viteConfig = await resolveConfig({}, "build", "production", "production");
const fileEnv = loadEnv(viteConfig.mode, viteConfig.envDir, "VITE_");
const listing = resolveBuildListing(fileEnv, process.env);
process.env.VITE_NIGHTSKY_LISTING_PUBLISHED = String(listing.published);
process.env.VITE_NIGHTSKY_LISTING_URL = listing.url || "";
const missingMajor = auditMajorEventCoverage(skyEvents);
if (missingMajor.length)
  throw Error("Missing major-event coverage: " + missingMajor.join(", "));
const output = buildWebsiteOutputs({
  release,
  facts: releaseFacts,
  listing,
  routes: siteRoutes,
  events: skyEvents,
  coverageMonths,
  legacyMeteorIds,
});
process.env.VITE_WEBSITE_RELEASE = String(release);
await viteBuild();
await esbuild({
  entryPoints: ["server/index.ts"],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: "dist",
});
await mkdir("dist/public", { recursive: true });
const htmlTemplate = await readFile("dist/public/index.html", "utf8");
for (const page of output.pages) {
  const relativePath = page.path === "/"
    ? "index.html"
    : join(page.path.replace(/^\/+|\/+$/g, ""), "index.html");
  const targetPath = join("dist/public", relativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, renderRouteHtml(htmlTemplate, page, release));
}
for (const [file, value] of Object.entries({
  "sitemap.xml": output.sitemap,
  "robots.txt": output.robots,
  _redirects: output.redirects,
  _headers: output.headers,
}))
  await writeFile("dist/public/" + file, value);
await writeFile("dist/website-build.json", JSON.stringify({ release }));
console.log(
  release ? "Release build ready" : "Local preview build ready (noindex)",
);
