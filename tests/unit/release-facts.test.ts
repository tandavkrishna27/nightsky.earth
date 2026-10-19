import { test } from "node:test";
import assert from "node:assert/strict";
import {
  releaseFacts,
  releaseBlockers,
} from "../../client/src/content/releaseFacts";
import { coverageCards } from "../../client/src/content/sourceCoverage";
test("missing factual approvals block publication", () => {
  const incomplete = {
    ...releaseFacts,
    operator: null,
    hosting: null,
    recipients: null,
    loggedFields: null,
    retention: null,
    deletionProcess: null,
    analytics: null,
    sources: [],
    sourcesApprovedAt: null,
    hostingVerifiedAt: null,
    contentRightsApprovedAt: null,
    policiesApprovedAt: null,
  };
  const blockers = releaseBlockers(incomplete, {
    published: false,
    url: null,
  });
  assert.ok(blockers.includes("Operator identity"));
  assert.ok(blockers.includes("Source inventory"));
  assert.ok(blockers.includes("Content rights approval"));
});

test("sky-map source rights and policy approval keep publication pending", () => {
  assert.deepEqual(
    releaseBlockers(releaseFacts, { published: false, url: null }),
    ["Source inventory approval", "Content rights approval", "Policy approval"],
  );
});

test("live source and retention statements match the deployed profile", () => {
  assert.match(releaseFacts.deletionProcess ?? "", /reviewed daily.*deleted 90 days after the last reply/i);
  assert.match(releaseFacts.retention ?? "", /journald has no configured age limit/i);
  assert.match(releaseFacts.retention ?? "", /no fixed deletion period.*host logs/i);
  const places = coverageCards.find((card) => card.id === "places");
  const weather = coverageCards.find((card) => card.id === "weather");
  const light = coverageCards.find((card) => card.id === "light");
  assert.ok(places);
  assert.ok(weather);
  assert.ok(light);
  assert.match(`${places.description} ${places.details.join(" ")}`, /current production.*Geoapify.*OpenStreetMap/i);
  assert.doesNotMatch(places.details.join(" "), /GeoNames supports named-city resolution/i);
  assert.match(weather.details.join(" "), /not part of the current production profile/i);
  assert.match(light.sources[0].name, /^DarkSkySites\.com/);
  assert.match(light.details.join(" "), /active production.*visible linked credit/i);
});

import { loadEnv } from "vite";
import { resolve } from "node:path";
import { resolveBuildListing } from "../../shared/websiteBuild";
const approved = {
  ...releaseFacts,
  operator: "Synthetic operator",
  hosting: "Synthetic host",
  recipients: [],
  loggedFields: [],
  retention: "Synthetic retention",
  deletionProcess: "Synthetic process",
  analytics: "None in fixture",
  sources: [
    {
      name: "Synthetic source",
      url: "https://example.org/source",
      coverage: "Synthetic coverage",
      reviewedAt: "2026-10-16",
    },
  ],
  sourcesApprovedAt: "2026-10-16",
  hostingVerifiedAt: "2026-10-16",
  contentRightsApprovedAt: "2026-10-16",
  policiesApprovedAt: "2026-10-16",
};
test("malformed source fields cannot approve a release", () => {
  for (const bad of [
    { name: " ", url: "https://", coverage: " ", reviewedAt: "invalid" },
    {
      name: "Source",
      url: "https://u:p@example.org",
      coverage: "Coverage",
      reviewedAt: "2026-10-16",
    },
    {
      name: "Source",
      url: "https://example.org",
      coverage: "Coverage",
      reviewedAt: "2026-02-30",
    },
  ])
    assert.ok(
      releaseBlockers(
        { ...approved, sources: [bad] },
        { published: false, url: null },
      ).includes("Source inventory"),
    );
});
test("Vite env-file listing requires setup verification before bundling", () => {
  const env = loadEnv("fixture", resolve("tests/fixtures/env"), "VITE_");
  const listing = resolveBuildListing(env, {});
  assert.equal(listing.published, true);
  assert.ok(releaseBlockers(approved, listing).includes("Verified setup"));
  assert.deepEqual(
    releaseBlockers({ ...approved, setupVerifiedAt: "2026-10-16" }, listing),
    [],
  );
  assert.equal(
    resolveBuildListing(env, { VITE_NIGHTSKY_LISTING_PUBLISHED: "false" })
      .published,
    false,
  );
});
