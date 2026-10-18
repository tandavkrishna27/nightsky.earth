import { useSearch } from "wouter";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Compass, PlayCircle, Search, Users } from "lucide-react";
import { resources, topics, formats, type ResourceFormat } from "@/content/resources";
import { filterResources, parseResourceState, serializeResourceState, type ResourceState } from "@/lib/resourceSearch";
import SEO from "@/components/SEO";
import PluginAction from "@/components/PluginAction";
import "@/styles/resources.css";

const formatDetails = {
  tools: { Icon: Compass, action: "Visit tool" },
  guides: { Icon: BookOpen, action: "Read guide" },
  learning: { Icon: PlayCircle, action: "Explore learning" },
  communities: { Icon: Users, action: "Visit community" },
} satisfies Record<ResourceFormat, { Icon: typeof Compass; action: string }>;
const reviewDates = new Set(resources.map(resource => resource.reviewedAt));
const commonReviewDate = reviewDates.size === 1 ? resources[0]?.reviewedAt : null;
const displayDate = (value: string) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${value}T00:00:00Z`));

export default function Resources() {
  const [state, setState] = useState(() => parseResourceState(window.location.search));
  const searchField = useRef<HTMLInputElement>(null);
  const resourceGrid = useRef<HTMLDivElement>(null);
  const revealFrom = useRef<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const search = useSearch();
  useEffect(() => {
    const next = parseResourceState(search);
    setVisibleCount(12);
    setState(previous => previous.q.trim() === next.q && previous.topic === next.topic && previous.format === next.format ? previous : next);
  }, [search]);
  function change(next: ResourceState, replace = false) {
    setVisibleCount(12);
    const query = serializeResourceState(next, location.search);
    history[replace ? "replaceState" : "pushState"]({}, "", `/resources${query ? "?" + query : ""}`);
    setState(next);
  }
  function clearFilters() {
    searchField.current?.focus();
    change({ q: "", topic: "all", format: "all" });
  }
  const results = filterResources(resources, state);
  const visibleResources = results.slice(0, visibleCount);
  useEffect(() => {
    if (revealFrom.current === null) return;
    resourceGrid.current?.querySelectorAll<HTMLAnchorElement>(".resource-card-link")[revealFrom.current]?.focus();
    revealFrom.current = null;
  }, [visibleCount]);
  function showMore() {
    revealFrom.current = visibleResources.length;
    setVisibleCount(count => count + 12);
  }
  const filtered = Boolean(state.q || state.topic !== "all" || state.format !== "all");
  return (
    <div className="resources-page">
      <SEO title="Find what helps you look up." description="Explore astronomy tools, observing guides, astrophotography resources, courses and ways to care for dark skies." />
      <header className="resources-intro page-width">
        <h1>Find what helps you look up.</h1>
        <p>Sky maps, field guides, photography tools and ways to keep learning. Find a resource for wherever your curiosity leads.</p>
      </header>
      <div className="resources-body page-width">
        <section className="resource-filters" aria-label="Find resources">
          <div className="resource-search-row">
            <div className="search-field">
              <label htmlFor="resource-search">Search resources</label>
              <div className="resource-search-input"><Search size={19} aria-hidden="true" />
                <input ref={searchField} id="resource-search" type="search" value={state.q} placeholder="Try Moon, photography, or sky maps" onChange={event => change({ ...state, q: event.target.value }, true)} />
              </div>
            </div>
            <div className="resource-format-field">
              <label htmlFor="resource-format">Format</label>
              <select id="resource-format" value={state.format} onChange={event => change({ ...state, format: event.target.value as ResourceState["format"] })}>
                <option value="all">All formats</option>
                {Object.entries(formats).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <div className="resource-topics" role="group" aria-label="Filter by topic">
            <button type="button" aria-pressed={state.topic === "all"} onClick={() => change({ ...state, topic: "all" })}>All topics</button>
            {Object.entries(topics).map(([value, label]) => <button key={value} type="button" aria-pressed={state.topic === value} onClick={() => change({ ...state, topic: value as ResourceState["topic"] })}>{label}</button>)}
          </div>
        </section>
        <div className="resource-results-bar">
          <p role="status" aria-live="polite">{results.length} {results.length === 1 ? "resource" : "resources"}</p>
          {filtered && <button className="text-link" type="button" onClick={clearFilters}>Clear filters</button>}
        </div>
        <p className="resource-external-note" id="resource-external-note">Links open the provider’s website in a new tab. Some resources have paid editions.</p>
        {results.length ? <div className="resources-grid" ref={resourceGrid}>
          {visibleResources.map(resource => {
            const { Icon, action } = formatDetails[resource.format];
            return <article className="resource-card" data-testid="resource-card" key={resource.id}>
              <a className="resource-card-link" href={resource.url} target="_blank" rel="noopener noreferrer" aria-labelledby={`resource-title-${resource.id}`} aria-describedby={`resource-description-${resource.id}${resource.costLabel ? ` resource-access-${resource.id}` : ""} resource-external-note`}>
                <div className="resource-card-top"><span className="resource-format"><Icon size={15} aria-hidden="true" />{formats[resource.format]}</span>
                  {resource.costLabel && <span className="resource-access" id={`resource-access-${resource.id}`}>{resource.costLabel}</span>}</div>
                <h2 id={`resource-title-${resource.id}`}>{resource.name}</h2>
                <p className="resource-provider">{resource.provider}</p>
                <p className="resource-description" id={`resource-description-${resource.id}`}>{resource.description}</p>
                <div className="resource-meta">{resource.topics.map(topic => <span key={topic}>{topics[topic]}</span>)}</div>
                {!commonReviewDate && <p className="resource-reviewed">Reviewed <time dateTime={resource.reviewedAt}>{displayDate(resource.reviewedAt)}</time></p>}
                <span className="resource-visit" aria-hidden="true">{action}<ArrowUpRight size={17} /></span>
              </a>
            </article>;
          })}
        </div> : <div className="resource-empty-state">
          <Search size={26} aria-hidden="true" />
          <h2>No resources match this search.</h2>
          <p>Try a broader term or clear your filters.</p>
        </div>}
        {results.length > 0 && <div className="resource-pagination">
          <p aria-live="polite">Showing {visibleResources.length} of {results.length} {results.length === 1 ? "resource" : "resources"}</p>
          {visibleResources.length < results.length && <button type="button" className="resource-more-button" onClick={showMore}>Show more resources</button>}
        </div>}
        {commonReviewDate && <p className="resource-review-note">Resources reviewed <time dateTime={commonReviewDate}>{displayDate(commonReviewDate)}</time>.</p>}
        <section className="resource-closing" aria-labelledby="resource-closing-title">
          <div><h2 id="resource-closing-title">Put your curiosity into practice.</h2>
            <p>Explore your next question with NightSky in your AI assistant.</p></div>
          <PluginAction />
        </section>
      </div>
    </div>
  );
}
