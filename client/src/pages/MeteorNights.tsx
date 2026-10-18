import { Link } from "wouter";
import EditorialPage from "@/components/EditorialPage";
import PluginAction from "@/components/PluginAction";
export default function MeteorNights() {
  return (
    <EditorialPage
      eyebrow="Meteor Showers"
      title="Plan a night for the meteors."
      intro="A shower’s peak is a starting point. Darkness, the Moon, weather, and where you watch all shape the experience."
    >
      <div className="reading-column">
        <section>
          <h2>Start with the conditions.</h2>
          <p>
            A little preparation helps you make more of a meteor-watching night.
            Explore the role of darkness, the Moon, your viewing location, and
            the forecast before deciding when to head out.
          </p>
          <a
            className="text-link"
            href="https://science.nasa.gov/solar-system/meteors-meteorites/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Understand meteors with NASA ↗
          </a>
        </section>
        <section>
          <h2>Find a starting point.</h2>
          <p>
            The dated calendar is being reviewed. Rather than carry old
            predictions into a new year, this preview keeps the focus on general
            preparation. Local viewing windows need a named destination and
            date.
          </p>
          <Link className="text-link" href="/resources?topic=events">
            Explore sky-event resources →
          </Link>
        </section>
        <section>
          <h2>Bring your question to NightSky.</h2>
          <p>
            Ask about a shower you are curious about, what conditions matter, or
            what to prepare for your chosen night.
          </p>
          <PluginAction />
        </section>
      </div>
    </EditorialPage>
  );
}
