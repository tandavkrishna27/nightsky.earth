import {skyEvents,coverageMonths} from "../shared/skyEventCatalog";
import { createServer, type Server } from "node:http";
import type { Express } from "express";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serveNews } from "./news";
import { buildWebsiteOutputs } from "../shared/websiteBuild";
import { siteRoutes } from "../shared/website";
import { legacyMeteorIds } from "../shared/meteorContent";
import { releaseFacts } from "../client/src/content/releaseFacts";
export async function registerRoutes(app: Express): Promise<Server> {
  let release = false;
  try {
    release =
      JSON.parse(
        readFileSync(
          resolve(import.meta.dirname, "website-build.json"),
          "utf8",
        ),
      ).release === true;
  } catch {}
  if (process.env.NODE_ENV !== "production") release = false;
  app.use((_req, res, next) => {
    if (!release) res.setHeader("X-Robots-Tag", "noindex, nofollow");
    next();
  });
  app.all(["/api/news", "/api/news/:id"], async (req, res) => {
    const response = await serveNews(
      new Request("http://localhost" + req.originalUrl, { method: req.method }),
    );
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await response.text());
  });
  app.all("/api/*", (_req, res) =>
    res.status(404).json({ error: "API route not found" }),
  );
  app.get(["/meteor-nights","/meteor-showers"], (_req, res) =>
    res.redirect(301, "/sky-events?category=meteor-showers"),
  );
  app.get(["/experiences", "/experiences/*"], (_req, res) =>
    res
      .status(410)
      .type("html")
      .send(
        '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page retired | NightSky.earth</title><body style="background:#0c0c0e;color:#f2f1eb;font-family:Georgia;padding:15vh 10vw"><h1>This chapter is for another night.</h1><p>Our former experiences page has been retired.</p><a style="color:#c2a977" href="/">Explore NightSky</a></body></html>',
      ),
  );
  app.get(["/sitemap.xml", "/robots.txt"], (req, res) => {
    if (process.env.NODE_ENV === "production") {
      try {
        return res
          .type(req.path.endsWith(".xml") ? "application/xml" : "text/plain")
          .send(
            readFileSync(
              resolve(import.meta.dirname, "public", req.path.slice(1)),
              "utf8",
            ),
          );
      } catch {}
    }
    const output = buildWebsiteOutputs({
      release: false,
      facts: releaseFacts,
      listing: { published: false, url: null },
      routes: siteRoutes,
      events: skyEvents,
      coverageMonths,
      legacyMeteorIds,
    });
    res
      .type(req.path.endsWith(".xml") ? "application/xml" : "text/plain")
      .send(req.path.endsWith(".xml") ? output.sitemap : output.robots);
  });
  return createServer(app);
}
