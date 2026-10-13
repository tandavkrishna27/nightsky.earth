import { compareObservingOptionsInputSchema, compareObservingOptionsResultSchema, type CompareObservingOptionsResult } from "../../shared/nightsky/planning";
import type { SourceRecord } from "../../shared/nightsky/common";
import type { PlannerServices } from "./planner";
import { planObservingSession } from "./planner";

const COMPARISON_SOURCE: SourceRecord = {
  name: "NightSky.earth planner",
  url: "https://nightsky.earth/",
  attribution: "Option summaries are composed by NightSky.earth from the individually listed evidence sources.",
  dataClass: "calculation",
  product: "Observing option comparison",
};

/** Compare each user-selected option independently; provider outputs remain separate and no winner is invented. */
export async function compareObservingOptions(inputValue: unknown, services: PlannerServices): Promise<CompareObservingOptionsResult> {
  const input = compareObservingOptionsInputSchema.parse(inputValue);
  const comparisons: CompareObservingOptionsResult["comparisons"] = [];
  let anyPartial = false;

  // Keep this sequential: a single comparison can call several live providers, and the user selected at most five options.
  for (const option of input.options) {
    try {
      const plan = await planObservingSession({ ...option, locale: input.locale, units: input.units }, services);
      if (plan.availability.status !== "available") anyPartial = true;
      comparisons.push({
        placeId: option.placeId,
        activity: option.activity,
        window: option.window,
        summary: plan.summary,
        factors: plan.factors,
        sources: plan.sources,
        availability: plan.availability, gaps: plan.gaps, candidateWindows: plan.candidateWindows, suggestions: plan.suggestions, evidence: plan.evidence,
      });
    } catch {
      anyPartial = true;
      const reason = "The planning services could not evaluate this option. Resolve the named place again or retry later.";
      comparisons.push({
        placeId: option.placeId,
        activity: option.activity,
        window: option.window,
        summary: `This option could not be evaluated: ${reason}`.slice(0, 800),
        factors: [{ name: "Option availability", assessment: reason.slice(0, 500), impact: "unknown", sourceNames: [] }],
        sources: [COMPARISON_SOURCE],
        availability: { status: "unavailable", reason: "This option could not be evaluated." }, gaps: ["The planning services could not evaluate this selected option."], candidateWindows: [], suggestions: [], evidence: {},
      });
    }
  }

  return compareObservingOptionsResultSchema.parse({
    availability: { status: anyPartial ? "partial" : "available", reason: anyPartial ? "Each requested option is retained; partial or unavailable evidence is shown within that option." : "Each requested option was evaluated independently; source values are kept separate." },
    sources: [COMPARISON_SOURCE],
    caveats: ["No universal score or winner is inferred. Compare the activity-specific factors, valid times, and source records for each option.", "Forecasts are model output and may disagree; this comparison preserves each provider's evidence separately."],
    comparisons,
  });
}
