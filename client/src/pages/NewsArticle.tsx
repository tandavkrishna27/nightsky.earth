import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import EditorialPage from "@/components/EditorialPage";
import SEO from "@/components/SEO";
import type { NewsArticle as Article } from "@shared/news";
export default function NewsArticle() {
  const { id } = useParams();
  const query = useQuery<Article>({
    queryKey: ["website-article", id],
    queryFn: async ({ signal }) => {
      const r = await fetch("/api/news/" + encodeURIComponent(id || ""), {
        signal,
      });
      if (!r.ok)
        throw new Error(r.status === 404 ? "not-found" : "unavailable");
      return r.json();
    },
    staleTime: 60000,
    retry: false,
  });
  return (
    <>
      <EditorialPage
        noindex={!query.data}
        eyebrow={query.data?.publisher || "News"}
        title={
          query.data?.title ||
          (query.isPending
            ? "Loading story…"
            : query.error?.message === "not-found"
              ? "Story not found."
              : "We couldn’t load this story.")
        }
        intro={
          query.data
            ? "Follow this story to its original publisher."
            : "Return to News or try again in a moment."
        }
      >
        <div className="reading-column">
          {query.data ? (
            <section>
              <p>
                {query.data.publishedAt
                  ? new Date(query.data.publishedAt).toLocaleDateString()
                  : "Publication date unavailable"}{" "}
                · {query.data.publisher}
              </p>
              <p>
                Read the full story at its original source. Images and article
                text are not reproduced in this preview.
              </p>
              <a
                className="action action-primary"
                href={query.data.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the original at {query.data.publisher} ↗
              </a>
            </section>
          ) : (
            !query.isPending &&
            query.error?.message !== "not-found" && (
              <button
                className="action action-outline"
                onClick={() => query.refetch()}
              >
                Retry
              </button>
            )
          )}
          <Link className="text-link" href="/news">
            ← Back to News
          </Link>
        </div>
      </EditorialPage>
    </>
  );
}
