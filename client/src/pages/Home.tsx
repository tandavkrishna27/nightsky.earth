import { Link } from "wouter";
import { homeCopy, activities } from "@/content/websiteCopy";
import PluginAction from "@/components/PluginAction";
import VideoBackground from "@/components/VideoBackground";
import QuestionExplorer from "@/components/home/QuestionExplorer";
import SEO from "@/components/SEO";
import stars from "@assets/stock_images/starry_night_sky_met_675ba820.jpg";
import milky from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";
import desert from "@assets/stock_images/desert_dunes_night_s_ee2f17ac.jpg";
import aurora from "@assets/stock_images/aurora_borealis_nort_b91defe5.jpg";
import person from "@assets/stock_images/person_silhouette_st_c7feb986.jpg";
import trails from "@assets/stock_images/long_exposure_stars__411203e7.jpg";
const photos = [person, milky, aurora, desert];
export default function Home() {
  return (
    <>
      <SEO title={homeCopy.hero.headline} description={homeCopy.hero.body} />
      <section className="home-hero">
        <VideoBackground videoUrl="/Nightskyearth.mp4" fallbackImage={stars} />
        <div className="hero-copy">
          <p className="eyebrow">{homeCopy.hero.eyebrow}</p>
          <h1>
            Where Earth <br />
            meets the stars.
          </h1>
          <p className="hero-description">{homeCopy.hero.body}</p>
          <div className="action-group">
            <PluginAction />
            <a href="#possibilities" className="action action-outline">
              Explore what’s possible <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className="hero-foot">
          <span>For the nights that stay with you.</span>
          <a href="#possibilities" aria-label="Explore the possibilities below">
            Scroll to explore <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <section id="possibilities" className="section page-width">
        <div className="section-heading">
          <p className="eyebrow">01 / Find your beginning</p>
          <h2>{homeCopy.journeys.title}</h2>
          <p>{homeCopy.journeys.body}</p>
        </div>
        <div className="activity-grid">
          {activities.map((item, i) => (
            <Link
              href={`/resources?topic=${item.topic}`}
              key={item.topic}
              className="activity-card"
            >
              <div className="activity-image">
                <img src={photos[i]} alt="" loading="lazy" />
                <span>{item.label}</span>
                <b aria-hidden="true">↗</b>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="universe-section">
        <div className="page-width universe-layout">
          <div className="section-heading">
            <p className="eyebrow">02 / Follow your curiosity</p>
            <h2>{homeCopy.universe.title}</h2>
            <p>{homeCopy.universe.body}</p>
            <Link className="text-link" href="/sources">
              What goes into an answer <span aria-hidden="true">→</span>
            </Link>
          </div>
          <QuestionExplorer />
        </div>
        <div className="page-width getting-started-strip">
          {[
            [
              "01",
              "Add NightSky",
              "Open its published listing when available.",
            ],
            [
              "02",
              "Start with your curiosity",
              "Bring a question, or a place, date and observing goal.",
            ],
            [
              "03",
              "Keep exploring",
              "Ask why, compare alternatives, or work through preparation.",
            ],
          ].map(([n, title, body]) => (
            <div key={n}>
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section page-width">
        <div className="section-heading">
          <p className="eyebrow">03 / Beyond the conversation</p>
          <h2>{homeCopy.moments.title}</h2>
          <p>{homeCopy.moments.body}</p>
        </div>
        <div className="moments-grid">
          {[
            [person, "Observe.", "Take time to notice what is above you."],
            [
              trails,
              "Photograph.",
              "Explore a subject and learn through the attempt.",
            ],
            [
              milky,
              "Learn.",
              "Follow the questions the night leaves you with.",
            ],
          ].map(([image, title, body]) => (
            <figure key={title}>
              <img src={image} alt="" loading="lazy" />
              <figcaption>
                <h3>{title}</h3>
                <p>{body}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <Link className="text-link collective-link" href="/community">
          Discover The Collective <span aria-hidden="true">→</span>
        </Link>
      </section>
      <section className="meteor-callout page-width">
        <div>
          <p className="eyebrow">A reason to look up</p>
          <h2>Next Meteor Showers</h2>
          <p>
            Preparing for a meteor shower? Start with darkness, Moon conditions,
            and a comfortable place to watch.
          </p>
        </div>
        <Link className="action action-outline" href="/meteor-showers">
          Explore meteor showers <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section
        className="closing-section"
        style={{
          backgroundImage: `linear-gradient(0deg,rgba(12,12,14,.8),rgba(12,12,14,.7)),url(${milky})`,
        }}
      >
        <p className="eyebrow">The night is an invitation</p>
        <h2>{homeCopy.ready.title}</h2>
        <p>{homeCopy.ready.body}</p>
        <PluginAction />
        <Link className="setup-help" href="/get-started">
          Need help getting started?
        </Link>
      </section>
    </>
  );
}
