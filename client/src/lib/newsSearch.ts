export type NewsSearch = { q: string; source: string; page: number };
export function parseNewsSearch(search: string): NewsSearch {
  const p = new URLSearchParams(search);
  const page = Number(p.get("page") || 1);
  return {
    q: (p.get("q") || "").slice(0, 200),
    source: (p.get("source") || "").slice(0, 100),
    page: Number.isInteger(page) && page >= 1 && page <= 1001 ? page : 1,
  };
}
export function serializeNewsSearch(state: NewsSearch) {
  const p = new URLSearchParams();
  if (state.q.trim()) p.set("q", state.q.trim());
  if (state.source.trim()) p.set("source", state.source.trim());
  if (state.page > 1) p.set("page", String(state.page));
  return p.toString();
}
export function newsApiUrl(state: NewsSearch) {
  const p = new URLSearchParams({
    limit: "12",
    offset: String((state.page - 1) * 12),
  });
  if (state.q) p.set("search", state.q);
  if (state.source) p.set("news_site", state.source);
  return "/api/news?" + p;
}
