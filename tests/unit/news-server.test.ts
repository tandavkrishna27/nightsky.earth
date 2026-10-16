import { test } from "node:test";
import assert from "node:assert/strict";
import { serveNews } from "../../server/news";
test("news validates before fetching and controls failure status", async () => {
  const neverFetch: typeof fetch = async () => {
    throw new Error("should not fetch");
  };
  for (const query of ["limit=99", "offset=-1", "offset=1.5", "offset=12001"])
    assert.equal(
      (
        await serveNews(new Request("http://localhost/api/news?" + query), {
          fetch: neverFetch,
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await serveNews(
        new Request("http://localhost/api/news", { method: "POST" }),
        { fetch: neverFetch },
      )
    ).status,
    405,
  );
  assert.equal(
    (
      await serveNews(new Request("http://localhost/api/news/12"), {
        fetch: async () => new Response("", { status: 404 }),
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await serveNews(new Request("http://localhost/api/news"), {
        fetch: async () => new Response("bad", { status: 500 }),
      })
    ).status,
    502,
  );
});
test("news normalizes safely and rejects malformed shapes", async () => {
  const result = await serveNews(new Request("http://localhost/api/news"), {
    fetch: async () =>
      Response.json({
        count: 2,
        results: [
          {
            id: 1,
            title: "A story",
            url: "https://example.org/story",
            news_site: "Example",
            summary: "Text",
            published_at: "bad",
            image_url: "javascript:bad",
          },
          { id: 2, title: "Bad", url: "javascript:bad" },
        ],
      }),
  });
  const body = await result.json();
  assert.equal(body.results.length, 1);
  assert.equal(body.results[0].publishedAt, null);
  assert.equal(body.results[0].imageUrl, null);
  assert.equal(
    (
      await serveNews(new Request("http://localhost/api/news"), {
        fetch: async () => Response.json({ wrong: true }),
      })
    ).status,
    502,
  );
});

test(
  "provider timeout is bounded and reported as unavailable",
  { timeout: 10000 },
  async () => {
    const started = Date.now();
    const response = await serveNews(new Request("http://localhost/api/news"), {
      fetch: async (_input, options) =>
        new Promise((_resolve, reject) =>
          options?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          ),
        ),
    });
    assert.equal(response.status, 504);
    assert.ok(Date.now() - started < 9500);
  },
);
