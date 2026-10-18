import { Link } from "wouter";
import SEO from "@/components/SEO";
import PluginAction from "@/components/PluginAction";
import { aboutCopy } from "@/content/aboutCopy";
import sky from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.webp";
import person from "@assets/stock_images/person_silhouette_st_c7feb986.webp";
import desert from "@assets/stock_images/desert_dunes_night_s_ee2f17ac.webp";
import "@/styles/about.css";
export default function About() {
  return (
    <>
      <SEO
        title="Where Earth Looks Up"
        description="The story behind NightSky: a plugin bringing curiosity, understanding and creative exploration into a conversation about the night sky."
      />
      <section
        className="about-hero"
        style={{
          backgroundImage:
            "linear-gradient(#080d1740,#0c0c0eee),url(" + sky + ")",
        }}
      >
        <p className="eyebrow">About NightSky</p>
        <h1>
          Where Earth <br />
          Looks Up
        </h1>
        <p>
          NightSky begins with curiosity about the universe—and the wish to
          experience more of it.
        </p>
        <a href="#our-beginning" className="text-link">
          Follow the story ↓
        </a>
      </section>
      <section className="about-opening page-width" id="our-beginning">
        <p className="eyebrow">Our beginning</p>
        <h2>It starts with looking up.</h2>
        {aboutCopy.opening.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>
      <section className="about-pair page-width">
        <img
          src={person}
          alt="A person standing beneath a star-filled sky"
          loading="lazy"
        />
        <div>
          <p className="eyebrow">Wonder finds its next question</p>
          <h2>
            From curiosity
            <br />
            to understanding.
          </h2>
          {aboutCopy.understanding.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>
      <section className="about-product">
        <div className="page-width">
          <p className="eyebrow">Meet NightSky</p>
          <h2>
            A companion for
            <br />
            the conversation.
          </h2>
          <div className="about-product-body">
            <div>
              {aboutCopy.product.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <ul>
              {[
                "Understand the sky",
                "Prepare to observe",
                "Explore places and moments",
                "Develop a creative approach",
              ].map((x, i) => (
                <li key={x}>
                  <span>0{i + 1}</span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="about-principles page-width">
        <p className="eyebrow">How we want to build</p>
        <h2>Wonder deserves care.</h2>
        <div>
          {aboutCopy.principles.map(([h, p]) => (
            <article key={h}>
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
        <Link href="/sources" className="text-link">
          Explore sources & coverage →
        </Link>
      </section>
      <section className="about-pair about-shared page-width">
        <div>
          <p className="eyebrow">Beyond the conversation</p>
          <h2>A shared sky.</h2>
          <p>
            The wider ambition is to bring people closer to the sky and to one
            another. The Collective is where shared learning, observing stories,
            and new connections will take shape.
          </p>
          <Link href="/community" className="text-link">
            Discover The Collective →
          </Link>
        </div>
        <img
          src={desert}
          alt="Desert dunes and a tree beneath the night sky"
          loading="lazy"
        />
      </section>
      <section className="about-closing">
        <p className="eyebrow">There is more above us</p>
        <h2>Follow your curiosity.</h2>
        <p>
          Bring a question, a place, or an idea. Discover your next step with
          NightSky.
        </p>
        <PluginAction />
      </section>
    </>
  );
}
