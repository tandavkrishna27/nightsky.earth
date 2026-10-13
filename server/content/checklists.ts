export interface PreparationChecklistOptions {
  cloudCoverMax?: number;
  equipment?: string[];
  experience?: "beginner" | "intermediate" | "advanced";
}

export function getPreparationChecklist(activity: string, options: PreparationChecklistOptions = {}): string[] {
  const items = [
    "Confirm public access, after-dark access or night opening, permits, and current closures with the land manager.",
    "If children are joining, keep the route and session short and supervise around roads, edges, and equipment.",
    options.cloudCoverMax === undefined
      ? "Cloud cover is unavailable in the supplied forecast; check an official local forecast again before departure."
      : options.cloudCoverMax >= 70
        ? "The supplied forecast shows substantial cloud cover; if your date is flexible, compare another night and recheck nearer departure."
        : "Recheck the forecast and its valid times before departure; forecast conditions can change.",
    "Bring warm layers, a charged phone, a dim red light, water, and a safe return plan.",
  ];
  if (options.experience === "beginner") items.push("Start with a short session and one easy target; give your eyes time to adapt.");
  if (options.equipment?.length) items.push(`Equipment you mentioned: ${options.equipment.join(", ")}.`);

  const byActivity: Record<string, string[]> = {
    "meteor-shower": ["Allow 20–30 minutes for dark adaptation; look broadly across the sky rather than at the radiant.", "Use a reclining chair or ground mat and avoid bright phone screens."],
    astrophotography: ["Bring a stable tripod, spare batteries, storage, and a dew-control plan.", "Take a test frame and review focus and star shapes; results depend on conditions and equipment."],
    "deep-sky-imaging": ["Check target altitude and Moon separation; plan focus, power, storage, and dew control.", "Use a specialist app for framing and seeing forecasts where available; this plan does not supply seeing or transparency."],
    "planet-observing": ["Check target altitude and allow the telescope to reach outdoor temperature.", "Use a specialist sky chart to confirm nearby stars and the current planet position."],
    "moon-observing": ["Bring binoculars or a telescope if available; observe near the terminator for visible lunar relief."],
    aurora: ["Choose an open view toward the pole and keep clouds, darkness, and aurora activity as separate checks."],
    eclipse: ["For a solar eclipse, follow official eye-safety guidance and use appropriate certified protection outside totality."],
    "family-stargazing": ["Plan a short route and session, bring warm layers and water, and keep children away from roads, edges, and equipment trip hazards."],
  };
  items.push(...(byActivity[activity] ?? ["Binoculars or a telescope are optional; naked-eye observing is enough to begin."]));
  return items.slice(0, 12);
}
