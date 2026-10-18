import { Link } from "wouter";
import { ArrowRight, ChevronDown, CloudMoon, MapPin, Moon, Orbit, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { coverageCards, coverageReviewedAt, readingNotes } from "@/content/sourceCoverage";
import "@/styles/support-pages.css";
import "@/styles/sources.css";

const icons = { moon: Moon, cloud: CloudMoon, orbit: Orbit, map: MapPin, sparkles: Sparkles };
export default function Sources() {
  return <div className="support-page sources-page">
    <SEO title="Sources & coverage." description="Understand NightSky’s astronomy calculations, weather sources, event references, place data and coverage limits." />
    <div className="support-width">
      <header className="support-intro"><h1>Sources &amp; coverage.</h1><p>Know where your answer comes from, what it covers, and where uncertainty remains.</p></header>
      <p className="coverage-introduction">Different questions need different evidence. NightSky keeps calculations, forecasts and model estimates connected to their sources. Available data depends on your place, date and the sources enabled for your conversation.</p>
      <div className="coverage-grid">{coverageCards.map(card => {
        const Icon = icons[card.icon];
        return <article className="coverage-card" aria-labelledby={`coverage-${card.id}`} key={card.id}>
          <div className="coverage-card-title"><Icon size={24} aria-hidden="true" /><h2 id={`coverage-${card.id}`}>{card.title}</h2></div>
          <p className="coverage-description">{card.description}</p><p className="coverage-limit">{card.coverage}</p>
          <details><summary>View source details <ChevronDown size={17} aria-hidden="true" /></summary>
            <div className="coverage-detail">{card.details.map(detail => <p key={detail}>{detail}</p>)}
              <ul className="coverage-source-links" aria-label={`${card.title} sources`}>{card.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>
            </div>
          </details>
        </article>;
      })}</div>
      <section className="coverage-reading" aria-labelledby="coverage-reading-title"><h2 id="coverage-reading-title">How to read your answer.</h2>
        <div className="coverage-reading-grid">{readingNotes.map(([title, body]) => <div key={title}><h3>{title}</h3><p>{body}</p></div>)}</div>
      </section>
      <div className="coverage-closing"><p>Source descriptions reviewed <time dateTime={coverageReviewedAt}>18 October 2026</time>. The evidence returned with an answer gives its specific coverage.</p><Link className="text-link" href="/contact?topic=bugs">Suggest a correction <ArrowRight size={16} aria-hidden="true" /></Link></div>
    </div>
  </div>;
}
