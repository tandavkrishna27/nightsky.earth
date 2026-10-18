import { allMeteorShowers } from "./meteorShowers";
export type ReviewedMeteor = {
  id: string;
  name: string;
  overview: string;
  reviewedAt: string;
  sources: string[];
  peak?: {
    startDate: string;
    endDate: string;
    basis: "UTC-catalogue-date";
    year: number;
  };
};
export const legacyMeteorIds = allMeteorShowers.map((x) => x.id);
export const reviewedMeteors: readonly ReviewedMeteor[] = [];
function validDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  );
}
export function upcomingMeteors(
  records: readonly ReviewedMeteor[],
  now: Date,
  count = 3,
) {
  if (Number.isNaN(now.getTime())) return [];
  const today = now.toISOString().slice(0, 10);
  return records
    .filter(
      (x) =>
        x.reviewedAt &&
        x.sources.length &&
        x.peak &&
        validDate(x.peak.startDate) &&
        validDate(x.peak.endDate) &&
        x.peak.startDate <= x.peak.endDate &&
        x.peak.endDate >= today,
    )
    .sort(
      (a, b) =>
        a.peak!.startDate.localeCompare(b.peak!.startDate) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, Math.max(0, Math.min(3, count)));
}
