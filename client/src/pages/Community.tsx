import {
  BookOpen,
  Camera,
  Leaf,
  Mail,
  Orbit,
  Telescope,
  Users,
} from "lucide-react";
import SEO from "@/components/SEO";
import { SUPPORT_EMAIL } from "@shared/website";
import {
  collectiveAudiences,
  collectivePurposes,
  contributionSubject,
} from "@/content/collective";
import person from "@assets/stock_images/person_silhouette_st_c7feb986.webp";
import milky from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.webp";
import "@/styles/collective.css";

const audienceIcons = [Telescope, Orbit, Camera, BookOpen, Users, Leaf];

export default function Community() {
  return (
    <div className="collective-page">
      <SEO
        title="The Collective"
        description="The Collective is coming soon. An invitation to stargazers, astronomers, creators, educators and everyone who cares for the night sky. Email NightSky to contribute."
      />
      <section
        className="collective-hero"
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(8,12,20,.3),rgba(8,12,20,.4) 45%,#0c0c0e),url(${person})`,
        }}
      >
        <div>
          <span className="collective-status">Coming soon</span>
          <h1>The Collective</h1>
          <p>
            For the dreamers, the teachers,
            <br />
            the ones who never stopped looking up.
          </p>
          <p className="collective-definition">
            A community around the night sky: observing, creating, learning and
            conserving dark skies.
          </p>
          <a className="collective-scroll" href="#shared-sky">
            Discover the Collective <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section
        id="shared-sky"
        className="collective-audience page-width"
        aria-labelledby="collective-audience-heading"
      >
        <div className="collective-audience-intro">
          <h2 id="collective-audience-heading">
            Different places.
            <br /> The same wonder.
          </h2>
          <p>
            From a first constellation to a lifetime of research, there are many
            ways to connect with the night. The Collective is an invitation to
            bring your perspective.
          </p>
          <p className="collective-welcome-note">
            No title, equipment or experience required.
          </p>
        </div>
        <ul className="collective-audience-grid">
          {collectiveAudiences.map(([title, body], index) => {
            const Icon = audienceIcons[index];
            return (
              <li key={title}>
                <Icon
                  className="collective-audience-icon"
                  size={28}
                  aria-hidden="true"
                />
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className="collective-purpose"
        aria-labelledby="collective-purpose-heading"
      >
        <div className="collective-purpose-layout page-width">
          <figure className="collective-purpose-photo">
            <img
              src={milky}
              alt="The Milky Way above dark desert dunes"
              loading="lazy"
            />
          </figure>
          <div className="collective-purpose-copy">
            <h2 id="collective-purpose-heading">
              Curiosity travels further when it is shared.
            </h2>
            <p>
              A connection to the sky can begin in many ways. These four ideas
              guide the Collective.
            </p>
            <div className="collective-purpose-grid">
              {collectivePurposes.map(([title, body]) => (
                <div key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="collective-contribute"
        aria-labelledby="collective-contribute-heading"
        style={{
          backgroundImage: `linear-gradient(#0c0c0eaa,#0c0c0ee8),url(${milky})`,
        }}
      >
        <h2 id="collective-contribute-heading">Bring your perspective.</h2>
        <p>
          The Collective is coming soon. Have an idea, a story, or experience
          you’d like to contribute? Email us and tell us what you have in mind.
        </p>
        <a
          className="action action-primary"
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(contributionSubject)}`}
        >
          Email to contribute <Mail size={17} aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
