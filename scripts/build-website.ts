import { build as viteBuild, resolveConfig, loadEnv } from "vite";
import { build as esbuild } from "esbuild";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import {
  buildWebsiteOutputs,
  resolveBuildListing,
} from "../shared/websiteBuild";
import { siteRoutes } from "../shared/website";
import { reviewedMeteors, legacyMeteorIds } from "../shared/meteorContent";
import { releaseFacts } from "../client/src/content/releaseFacts";
process.env.NODE_ENV = "production";
const release = process.argv.includes("--release");
const viteConfig = await resolveConfig({}, "build", "production", "production");
const fileEnv = loadEnv(viteConfig.mode, viteConfig.envDir, "VITE_");
const listing = resolveBuildListing(fileEnv, process.env);
process.env.VITE_NIGHTSKY_LISTING_PUBLISHED = String(listing.published);
process.env.VITE_NIGHTSKY_LISTING_URL = listing.url || "";
const output = buildWebsiteOutputs({
  release,
  facts: releaseFacts,
  listing,
  routes: siteRoutes,
  meteors: reviewedMeteors,
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
for (const [file, value] of Object.entries({
  "sitemap.xml": output.sitemap,
  "robots.txt": output.robots,
  _redirects: output.redirects,
  _headers: output.headers,
}))
  await writeFile("dist/public/" + file, value);
if (release) {
  const html = await readFile("dist/public/index.html", "utf8");
  await writeFile(
    "dist/public/index.html",
    html.replace(/<meta[^>]*data-preview-robots[^>]*>/g, ""),
  );
}
await writeFile("dist/website-build.json", JSON.stringify({ release }));
console.log(
  release ? "Release build ready" : "Local preview build ready (noindex)",
);
