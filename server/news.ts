import type { NewsArticle } from "../shared/news";
export function safeWebUrl(value: unknown): string | null {
  try {
    const u = new URL(String(value));
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
function normalize(value: any): NewsArticle | null {
  const url = safeWebUrl(value?.url);
  if (
    !url ||
    !Number.isSafeInteger(value?.id) ||
    value.id < 1 ||
    typeof value.title !== "string" ||
    typeof value.news_site !== "string"
  )
    return null;
  return {
    id: value.id,
    title: value.title,
    url,
    publisher: value.news_site,
    summary: typeof value.summary === "string" ? value.summary : "",
    publishedAt:
      typeof value.published_at === "string" &&
      !Number.isNaN(Date.parse(value.published_at))
        ? value.published_at
        : null,
    imageUrl: safeWebUrl(value.image_url),
  };
}
export async function serveNews(
  request: Request,
  deps: { fetch: typeof fetch } = { fetch },
) {
  const error = (status: number, message: string) =>
    Response.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  if (request.method !== "GET") return error(405, "Method not allowed");
  const input = new URL(request.url);
  const suffix = input.pathname
    .replace(/^.*\/api\/news/, "")
    .replace(/^\/+|\/+$/g, "");
  if (
    suffix &&
    (!/^\d+$/.test(suffix) ||
      !Number.isSafeInteger(Number(suffix)) ||
      Number(suffix) < 1)
  )
    return error(400, "Invalid article ID");
  const p = input.searchParams;
  const limit = p.get("limit") ?? "12",
    offset = p.get("offset") ?? "0";
  if (
    !/^\d+$/.test(limit) ||
    Number(limit) < 1 ||
    Number(limit) > 12 ||
    !/^\d+$/.test(offset) ||
    Number(offset) > 12000
  )
    return error(400, "Invalid pagination");
  const search = (p.get("search") || "").trim(),
    source = (p.get("news_site") || "").trim();
  if (search.length > 200 || source.length > 100)
    return error(400, "Search is too long");
  const upstream = new URL(
    `https://api.spaceflightnewsapi.net/v4/articles/${suffix ? suffix + "/" : ""}`,
  );
  if (!suffix) {
    upstream.searchParams.set("limit", limit);
    upstream.searchParams.set("offset", offset);
    if (search) upstream.searchParams.set("search", search);
    if (source) upstream.searchParams.set("news_site", source);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await deps.fetch(upstream, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (response.status === 404 && suffix)
      return error(404, "Article not found");
    if (!response.ok) return error(502, "News provider unavailable");
    const value = await response.json();
    let result;
    if (suffix) {
      result = normalize(value);
      if (!result) return error(502, "Invalid news response");
    } else {
      if (
        !Number.isSafeInteger(value?.count) ||
        value.count < 0 ||
        !Array.isArray(value.results)
      )
        return error(502, "Invalid news response");
      result = {
        count: value.count,
        results: value.results.map(normalize).filter(Boolean),
      };
    }
    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return error(
      controller.signal.aborted ? 504 : 502,
      "News could not be loaded",
    );
  } finally {
    clearTimeout(timer);
  }
}
