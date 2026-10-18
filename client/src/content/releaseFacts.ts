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
    "Netlify hosts the website and its news function; site plan and account-level logging settings remain unverified",
  recipients: [
    "The AI platform selected by the visitor",
    "Netlify for website and news-function hosting",
    "Google Fonts for web fonts",
    "Google Gmail for messages sent to the support address",
    "Spaceflight News API for website news searches",
    "Place, weather and climate providers listed in the Privacy Policy when the connected feature uses them",
  ],
  loggedFields: [
    "Website application code does not log request bodies or search query fields in the reviewed routes",
    "Netlify may process network, request and function-log details; exact fields depend on hosting configuration",
  ],
  retention:
    "Operator confirms NightSky does not persist user request content or conversation history. Calendar preferences remain in the visitor's browser. Netlify dashboard function-log availability is up to seven days depending on plan; the site's plan and other host or mailbox retention settings are unverified.",
  deletionProcess:
    "NightSky has no user accounts or persistent request history to delete. Users may contact the support address about email correspondence or other information held by the operator. Requests for copies held by AI platforms, Netlify or independent providers must be directed to those services.",
  analytics:
    "No third-party analytics or advertising tracker is included in the website code reviewed. The site loads Google Fonts; Netlify may process operational traffic and function logs. Any account-level analytics or logging configuration has not been verified.",
  sources: [],
  sourcesApprovedAt: null,
  hostingVerifiedAt: null,
  contentRightsApprovedAt: null,
  policiesApprovedAt: null,
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
