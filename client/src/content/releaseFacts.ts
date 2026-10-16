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
