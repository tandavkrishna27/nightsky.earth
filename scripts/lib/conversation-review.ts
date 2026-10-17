import { z } from "zod";

export const dimensions = ["intentFit", "constraintRetention", "clarificationQuality", "suitabilityReasoning", "evidenceAccuracy", "actionability", "toolHonesty", "continuity"] as const;
export const criticalFailures = ["invented-access", "false-routing", "dropped-constraint", "fabricated-evidence", "listing-only-venue"] as const;
export const evidenceKinds = ["fixture", "controlled-agent", "native-host", "owner-observed"] as const;
export const requiredCases = ["hyderabad-corrections", "city-only", "explicit-observatory", "free-no-camping", "disconnected-no-search", "empty-data", "travel-unknown", "photography-learning", "family-mobility", "chosen-place", "date-change"] as const;
const text = z.string().trim().min(1);
const caseSchema = z.object({
  id: z.enum(requiredCases), provenance: text,
  context: text,
  turns: z.array(z.object({ user: text, expected: z.array(text).min(1), forbidden: z.array(text).min(1) }).strict()).min(1),
}).strict();
export function validateCases(input: unknown) {
  const cases = z.array(caseSchema).parse(input);
  if (cases.length !== requiredCases.length || new Set(cases.map(c => c.id)).size !== requiredCases.length) throw new Error("Missing or duplicate conversation cases");
  return cases;
}
const scoreSchema = z.object({ score: z.number().int().min(0).max(2), evidence: text }).strict();
const scoresSchema = z.object(Object.fromEntries(dimensions.map(d => [d, scoreSchema])) as Record<typeof dimensions[number], typeof scoreSchema>).strict();
const common = { caseId: z.enum(requiredCases), evidenceKind: z.enum(evidenceKinds) };
const reviewSchema = z.discriminatedUnion("status", [
  z.object({ ...common, status: z.literal("reviewed"), reviewer: text, responseRef: text, scores: scoresSchema, criticalFailures: z.array(z.object({ id: z.enum(criticalFailures), evidence: text }).strict()) }).strict(),
  z.object({ ...common, status: z.literal("unreviewed"), responseRef: text.optional() }).strict(),
  z.object({ ...common, status: z.literal("not-run") }).strict(),
]);
export type ConversationReview = z.infer<typeof reviewSchema>;
type Verdict = "pass" | "fail" | "pending";
/** Validates reviewer data, never infers semantic correctness from response words. */
export function reviewConversation(input: unknown) {
  const review = reviewSchema.parse(input);
  if (review.status !== "reviewed") return { review, total: null, verdict: "pending" as Verdict };
  const scores = dimensions.map(d => review.scores[d].score);
  const total = scores.reduce((a, b) => a + b, 0);
  const verdict: Verdict = review.criticalFailures.length || scores.includes(0) || total < 14 ? "fail" : "pass";
  return { review, total, verdict };
}
/** Missing cases stay pending in each separate evidence lane. No cross-lane promotion. */
export function aggregateReviews(expectedCaseIds: readonly string[], inputs: readonly unknown[]) {
  if (!expectedCaseIds.length || new Set(expectedCaseIds).size !== expectedCaseIds.length || expectedCaseIds.some(id => !(requiredCases as readonly string[]).includes(id))) throw new Error("Invalid expected cases");
  const results = inputs.map(reviewConversation);
  const seen = new Set<string>();
  for (const result of results) {
    const key = `${result.review.evidenceKind}/${result.review.caseId}`;
    if (seen.has(key) || !expectedCaseIds.includes(result.review.caseId)) throw new Error("Duplicate or unexpected review");
    seen.add(key);
  }
  return Object.fromEntries(evidenceKinds.map(kind => {
    const rows = results.filter(r => r.review.evidenceKind === kind);
    const missing = expectedCaseIds.filter(id => !rows.some(r => r.review.caseId === id));
    const verdict: Verdict = rows.some(r => r.verdict === "fail") ? "fail" : missing.length || rows.some(r => r.verdict === "pending") ? "pending" : "pass";
    return [kind, { verdict, missing, results: rows }];
  })) as Record<typeof evidenceKinds[number], { verdict: Verdict; missing: string[]; results: ReturnType<typeof reviewConversation>[] }>;
}
