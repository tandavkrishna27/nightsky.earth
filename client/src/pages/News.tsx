import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import EditorialPage from "@/components/EditorialPage";
import {
  parseNewsSearch,
  serializeNewsSearch,
  newsApiUrl,
  type NewsSearch,
} from "@/lib/newsSearch";
import type { NewsPage } from "@shared/news";
export default function News() {
  const [state, setState] = useState(() => parseNewsSearch(location.search));
  const [draft, setDraft] = useState(state.q);
  const [source, setSource] = useState(state.source);
  const [notice, setNotice] = useState("");
  function change(next: NewsSearch, replace = false) {
    const query = serializeNewsSearch(next);
    history[replace ? "replaceState" : "pushState"](
      {},
      "",
      `/news${query ? "?" + query : ""}`,
    );
    setState(next);
    setDraft(next.q);
    setSource(next.source);
  }
  const search = useSearch();
  useEffect(() => {
    const next = parseNewsSearch(search);
    setState(next);
    setDraft(next.q);
    setSource(next.source);
    setNotice("");
  }, [search]);
  const query = useQuery<NewsPage>({
    queryKey: ["website-news", state.q, state.source, state.page],
    queryFn: async ({ signal }) => {
      const response = await fetch(newsApiUrl(state), { signal });
      if (!response.ok) throw new Error("Unavailable");
      return response.json();
    },
    staleTime: 60000,
    retry: false,
  });
  useEffect(() => {
    if (
      query.data &&
      state.page > 1 &&
      (state.page - 1) * 12 >= query.data.count
    ) {
      change({ ...state, page: 1 }, true);
      setNotice("The result count changed. Showing the first page.");
    }
  }, [query.data, state.page]);
  return (
    <EditorialPage
      eyebrow="News"
      title="News from the sky and beyond."
      intro="Explore astronomy and space stories from external publishers. Follow each story to its original reporting."
    >
      <form
        className="news-search resource-controls"
        onSubmit={(e) => {
          e.preventDefault();
          change({ q: draft.trim(), source: source.trim(), page: 1 });
        }}
      >
        <div className="search-field">
          <label htmlFor="news-search">Search news</label>
          <input
            id="news-search"
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={200}
            placeholder="Try a comet, a planet, a discovery"
          />
        </div>
        <div>
          <label htmlFor="news-source">Publisher</label>
          <input
            id="news-source"
            value={source}
            maxLength={100}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Any publisher"
          />
        </div>
        <button className="action action-primary" type="submit">
          Search <span aria-hidden="true">↗</span>
        </button>
      </form>
      <div className="topic-search">
        <span>Search topics</span>
        {["Comets", "Meteors", "Planets", "Telescopes"].map((t) => (
          <button
            key={t}
            onClick={() => change({ ...state, q: t.toLowerCase(), page: 1 })}
          >
            {t}
          </button>
        ))}
      </div>
      {notice && <p role="status">{notice}</p>}
      {query.isPending ? (
        <div className="news-skeleton" aria-label="Loading news">
          Loading stories…
        </div>
      ) : (
        <>
          {query.isError && (
            <div className="empty-state">
              <h2>We couldn’t load the news right now.</h2>
              <p>Try again in a moment.</p>
              <button
                className="action action-outline"
                onClick={() => query.refetch()}
              >
                Retry
              </button>
            </div>
          )}
          {query.data && (
            <>
              {query.isError && <p>Showing previously loaded stories</p>}
              <div className="results-bar">
                <p>
                  {query.data.count} stories · Page {state.page}
                </p>
                {!!query.dataUpdatedAt && (
                  <span>
                    Loaded {new Date(query.dataUpdatedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
              {query.data.results.length ? (
                <div className="news-results">
                  {query.data.results.map((item) => (
                    <article key={item.id} className="news-row">
                      <div>
                        <span className="eyebrow">{item.publisher}</span>
                        <p className="small-note">
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString(
                                undefined,
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "Publication date unavailable"}
                        </p>
                      </div>
                      <div>
                        <h2>
                          <Link href={`/news/${item.id}`}>{item.title}</Link>
                        </h2>
                        <a
                          className="text-link"
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Read the original at {item.publisher} ↗
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h2>No stories match this search.</h2>
                  <p>Try another topic or clear your filters.</p>
                  <button
                    className="text-link"
                    onClick={() => change({ q: "", source: "", page: 1 })}
                  >
                    Clear search
                  </button>
                </div>
              )}
              <div className="pagination">
                <button
                  className="action action-outline"
                  disabled={state.page <= 1}
                  onClick={() => change({ ...state, page: state.page - 1 })}
                >
                  Previous
                </button>
                <span>Page {state.page}</span>
                <button
                  className="action action-outline"
                  disabled={
                    state.page >= 1001 || state.page * 12 >= query.data.count
                  }
                  onClick={() => change({ ...state, page: state.page + 1 })}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
      <p className="small-note">
        Headlines link to external reporting. This feed includes wider space
        coverage and is not a local observing forecast.
      </p>
    </EditorialPage>
  );
}
