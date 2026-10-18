import { Link } from "wouter";
import { homeCopy } from "@/content/websiteCopy";
import { collectiveValues } from "@/content/homepage";
import HomeFaqs from "@/components/home/HomeFaqs";
import PluginAction from "@/components/PluginAction";
import VideoBackground from "@/components/VideoBackground";
import QuestionExplorer from "@/components/home/QuestionExplorer";
import PlatformAvailability from "@/components/home/PlatformAvailability";
import UpcomingEvents from "@/components/sky-events/UpcomingEvents";
import SEO from "@/components/SEO";
import stars from "@assets/stock_images/starry_night_sky_met_675ba820.webp";
import milky from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.webp";
import "@/styles/home.css";

export default function Home() {
  return (
    <>
      <SEO
        title={homeCopy.hero.headline}
        description={homeCopy.hero.body}
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "NightSky.earth",
          alternateName: "NightSky",
          url: "https://nightsky.earth/",
          description: homeCopy.hero.body,
        }}
      />
      <section className="home-hero">
        <VideoBackground videoUrl="/Nightskyearth.mp4" fallbackImage={stars} />
        <div className="hero-copy">
          <p className="eyebrow hero-free-badge">{homeCopy.hero.eyebrow}</p>
          <h1>
            Where Earth <br />
            meets <span>the stars.</span>
          </h1>
          <p className="hero-description">{homeCopy.hero.body}</p>
          <div className="action-group">
            <PluginAction />
          </div>
          <PlatformAvailability />
        </div>
        <div className="hero-foot">
          <span>For the nights that stay with you.</span>
          <a href="#possibilities" aria-label="Explore the possibilities below">
            Scroll to explore <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <section
        id="possibilities"
        className="section page-width home-journey"
        aria-labelledby="journey-heading"
      >
        <div id="how-it-works" className="section-heading">
          <h2 id="journey-heading">Journeys Under the Infinite.</h2>
          <p>
            A place, an idea, a question. Choose a beginning and see how the
            conversation unfolds.
          </p>
        </div>
        <QuestionExplorer />
      </section>
      <UpcomingEvents home />
      <section
        id="collective"
        className="home-collective"
        aria-labelledby="collective-heading"
      >
        <div className="page-width home-collective-layout">
          <div>
            <h2 id="collective-heading">
              Moments Beneath
              <br /> the Infinite.
            </h2>
            <p className="collective-description">
              The Collective brings together a love of the night sky—through
              curiosity, creativity, and care for the darkness that makes it all
              possible.
            </p>
            <div className="collective-values">
              {collectiveValues.map(([title, body]) => (
                <div key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
            <Link className="text-link" href="/community">
              Discover The Collective <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <figure className="home-collective-photo">
            <img
              src={milky}
              alt="The Milky Way above a quiet landscape"
              loading="lazy"
            />
            <figcaption>
              A shared sky.
              <br />A reason to care for it.
            </figcaption>
          </figure>
        </div>
      </section>
      <HomeFaqs />
      <section
        className="closing-section home-closing"
        style={{
          backgroundImage: `linear-gradient(0deg,rgba(8,12,16,.9),rgba(8,12,16,.55)),url(${milky})`,
        }}
      >
        <h2>{homeCopy.ready.title}</h2>
        <p>
          Bring a question, a place, or an idea.
          <br />
          Your next night begins with a conversation.
        </p>
        <PluginAction />
        <p className="pricing-note">{homeCopy.ready.pricingNote}</p>
      </section>
    </>
  );
}
