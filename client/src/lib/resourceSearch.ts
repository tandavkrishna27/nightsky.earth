import {
  topics,
  formats,
  type Resource,
  type ResourceTopic,
  type ResourceFormat,
} from "../content/resources";
export type ResourceState = {
  q: string;
  topic: ResourceTopic | "all";
  format: ResourceFormat | "all";
};
export function parseResourceState(search: string): ResourceState {
  const p = new URLSearchParams(search);
  return {
    q: (p.get("q") || "").trim(),
    topic: Object.hasOwn(topics, p.get("topic") || "")
      ? (p.get("topic") as ResourceTopic)
      : "all",
    format: Object.hasOwn(formats, p.get("format") || "")
      ? (p.get("format") as ResourceFormat)
      : "all",
  };
}
export function serializeResourceState(state: ResourceState, baseSearch = "") {
  const p = new URLSearchParams(baseSearch);
  for (const key of ["q", "topic", "format"] as const) {
    const value = state[key].trim();
    if (value && (key === "q" || value !== "all")) p.set(key, value);
    else p.delete(key);
  }
  return p.toString();
}
export function filterResources(
  items: readonly Resource[],
  state: ResourceState,
) {
  const words = state.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(
    (x) =>
      (state.topic === "all" || x.topics.includes(state.topic)) &&
      (state.format === "all" || x.format === state.format) &&
      words.every((w) =>
        `${x.name} ${x.description} ${x.topics.join(" ")}`
          .toLowerCase()
          .includes(w),
      ),
  );
}
