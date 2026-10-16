import { useSearch } from "wouter";
import { useEffect, useState } from "react";
import { resources, topics, formats } from "@/content/resources";
import {
  filterResources,
  parseResourceState,
  serializeResourceState,
  type ResourceState,
} from "@/lib/resourceSearch";
import EditorialPage from "@/components/EditorialPage";
import PluginAction from "@/components/PluginAction";
export default function Resources() {
  const [state, setState] = useState(() =>
    parseResourceState(window.location.search),
  );
  const search = useSearch();
  useEffect(() => {
    const next = parseResourceState(search);
    setState((previous) =>
      previous.q.trim() === next.q &&
      previous.topic === next.topic &&
      previous.format === next.format
        ? previous
        : next,
    );
  }, [search]);
  function change(next: ResourceState, replace = false) {
    const q = serializeResourceState(next, location.search);
    history[replace ? "replaceState" : "pushState"](
      {},
      "",
      `/resources${q ? "?" + q : ""}`,
    );
    setState(next);
  }
  const results = filterResources(resources, state);
  return (
    <EditorialPage
      eyebrow="Resources"
      title="Find what helps you look up."
      intro="Explore tools, guides, and practical knowledge for your next night outside."
    >
      <div className="resource-controls">
        <div className="search-field">
          <label htmlFor="resource-search">Search resources</label>
          <input
            id="resource-search"
            type="search"
            value={state.q}
            placeholder="Try Moon, photography, or sky maps"
            onChange={(e) => change({ ...state, q: e.target.value }, true)}
          />
        </div>
        <div>
          <label htmlFor="resource-topic">Topic</label>
          <select
            id="resource-topic"
            value={state.topic}
            onChange={(e) =>
              change({
                ...state,
                topic: e.target.value as ResourceState["topic"],
              })
            }
          >
            <option value="all">All topics</option>
            {Object.entries(topics).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="resource-format">Format</label>
          <select
            id="resource-format"
            value={state.format}
            onChange={(e) =>
              change({
                ...state,
                format: e.target.value as ResourceState["format"],
              })
            }
          >
            <option value="all">All formats</option>
            {Object.entries(formats).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="results-bar">
        <p aria-live="polite">
          {results.length} {results.length === 1 ? "resource" : "resources"}
        </p>
        <button
          className="text-link"
          onClick={() => change({ q: "", topic: "all", format: "all" })}
        >
          Clear filters
        </button>
      </div>
      {results.length ? (
        <div className="resources-grid">
          {results.map((x) => (
            <article
              className="resource-card"
              data-testid="resource-card"
              key={x.id}
            >
              <p className="eyebrow">{formats[x.format]}</p>
              <h2>
                <a href={x.url} target="_blank" rel="noopener noreferrer">
                  {x.name}
                  <span aria-hidden="true"> ↗</span>
                </a>
              </h2>
              <p>{x.description}</p>
              <div className="resource-meta">
                <span>{x.topics.map((t) => topics[t]).join(" · ")}</span>
                <span>Reviewed {x.reviewedAt}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No resources match this search.</h2>
          <p>Try a broader term or clear your filters.</p>
        </div>
      )}
      <div className="resource-bottom">
        <h2>Put your curiosity into practice.</h2>
        <p>
          Have a question about putting it into practice? Explore it with
          NightSky in ChatGPT.
        </p>
        <PluginAction />
      </div>
    </EditorialPage>
  );
}
