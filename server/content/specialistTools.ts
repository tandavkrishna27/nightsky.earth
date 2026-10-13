import { specialistToolsResultSchema, type planObservingSessionInputSchema } from "../../shared/nightsky/planning";
import { sourceRecordSchema, type SourceRecord } from "../../shared/nightsky/common";
import type * as z from "zod4";

type Activity = z.infer<typeof planObservingSessionInputSchema>["activity"];
type Recommendation = z.infer<typeof specialistToolsResultSchema>["recommendations"][number];

const reviewDate = "2026-10-13";
const products: Array<Recommendation & { activities: Activity[]; source: SourceRecord }> = [
  {
    name: "Stellarium", platform: "desktop", purpose: "Explore a simulated sky, identify objects, and plan a visual observing session.", url: "https://stellarium.org/", pricing: "free", lastReviewed: reviewDate,
    activities: ["general-stargazing", "visual-stargazing", "planet-observing", "moon-observing", "learning", "eclipse", "meteor-shower", "astrophotography", "deep-sky-imaging"],
    source: sourceRecordSchema.parse({ name: "Stellarium official product page", url: "https://stellarium.org/", attribution: "Product purpose and desktop free/open-source status checked on 2026-10-13.", dataClass: "context", product: "Stellarium desktop planetarium" }),
  },
  {
    name: "Sky Tonight", platform: "ios", purpose: "Use a phone sky map to identify objects and check visible events and trajectories.", url: "https://apps.apple.com/us/app/sky-tonight-stargazing-guide/id1570594940", pricing: "free-tier", lastReviewed: reviewDate,
    activities: ["general-stargazing", "visual-stargazing", "planet-observing", "moon-observing", "learning", "eclipse", "meteor-shower", "astrophotography", "deep-sky-imaging", "aurora"],
    source: sourceRecordSchema.parse({ name: "Sky Tonight US App Store listing", url: "https://apps.apple.com/us/app/sky-tonight-stargazing-guide/id1570594940", attribution: "US Apple App Store listing describes free download with in-app purchases; pricing is storefront- and region-specific, checked 2026-10-13.", dataClass: "context", product: "Sky Tonight iOS listing" }),
  },
  {
    name: "SkySafari", platform: "ios", purpose: "Use an interactive planetarium for object identification, observing plans, and telescope workflows.", url: "https://apps.apple.com/us/app/skysafari/id1257281849", pricing: "paid", lastReviewed: reviewDate,
    activities: ["general-stargazing", "visual-stargazing", "planet-observing", "moon-observing", "astrophotography", "deep-sky-imaging", "learning", "eclipse"],
    source: sourceRecordSchema.parse({ name: "SkySafari US App Store listing", url: "https://apps.apple.com/us/app/skysafari/id1257281849", attribution: "The selected US iOS listing is a paid download; price and editions vary by storefront, checked 2026-10-13. No global price is asserted.", dataClass: "context", product: "SkySafari iOS listing" }),
  },
  {
    name: "PhotoPills", platform: "ios", purpose: "Plan photographic alignments and calculate framing, exposure, and Milky Way timing for a location.", url: "https://apps.apple.com/us/app/photopills/id596026805", pricing: "paid", lastReviewed: reviewDate,
    activities: ["astrophotography", "deep-sky-imaging", "eclipse"],
    source: sourceRecordSchema.parse({ name: "PhotoPills US App Store listing", url: "https://apps.apple.com/us/app/photopills/id596026805", attribution: "Product purpose and paid US iOS listing checked 2026-10-13; storefront pricing may vary by region.", dataClass: "context", product: "PhotoPills iOS listing" }),
  },
  {
    name: "Light Pollution Map", platform: "web", purpose: "Inspect mapped artificial-light and sky-brightness context when comparing broad areas.", url: "https://www.lightpollutionmap.info/", pricing: "unknown", lastReviewed: reviewDate,
    activities: ["general-stargazing", "visual-stargazing", "astrophotography", "deep-sky-imaging", "meteor-shower", "aurora", "planet-observing", "moon-observing", "eclipse", "learning"],
    source: sourceRecordSchema.parse({ name: "Light Pollution Map", url: "https://www.lightpollutionmap.info/", attribution: "Official map reviewed for its mapped light-pollution context; fee and reuse terms for particular layers were not established, checked 2026-10-13.", dataClass: "context", product: "Light Pollution Map" }),
  },
];

export function getSpecialistToolRecommendations(activity: Activity, _experience?: string) {
  const recommendations = products.filter(({ activities }) => activities.includes(activity)).map(({ activities: _activities, source: _source, ...recommendation }) => recommendation);
  const sources = products.filter(({ activities }) => activities.includes(activity)).map(({ source }) => source);
  return specialistToolsResultSchema.parse({
    availability: { status: recommendations.length ? "available" : "partial", reason: recommendations.length ? "Suggestions are optional specialist tools; verify current availability, platform support, and local pricing in the linked listing." : "No reviewed specialist suggestion is available for this activity yet." },
    sources, caveats: ["Suggestions are not endorsements and may include paid products. No affiliate links or paid placement are used."], recommendations,
  });
}
