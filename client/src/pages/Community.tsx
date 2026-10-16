import SEO from "@/components/SEO";
import person from "@assets/stock_images/person_silhouette_st_c7feb986.jpg";
import trails from "@assets/stock_images/long_exposure_stars__411203e7.jpg";
import milky from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";
import desert from "@assets/stock_images/desert_dunes_night_s_ee2f17ac.jpg";
const pursuits = [
  {
    number: "01",
    label: "Share the night",
    title: "Some things are better looked at together.",
    body: "The first constellation you recognise. A meteor someone else almost missed. A quiet stretch of darkness, far from the city. Looking up can be a personal moment, and a reason to connect.",
    image: desert,
    alt: "Desert dunes beneath a star-filled night sky",
  },
  {
    number: "02",
    label: "Make something of it",
    title: "A sky full of stories. A thousand ways to tell them.",
    body: "A photograph, a film, a time-lapse, a few words in a notebook. The night gives us something to work with. We want the Collective to become a place for the ideas, experiments, and lessons that follow.",
    image: trails,
    alt: "A warmly lit cabin beneath a starry winter sky",
  },
  {
    number: "03",
    label: "Keep learning",
    title: "Curiosity travels further when it is shared.",
    body: "There is always another question to ask, whether you are finding your first planet or helping someone understand what they see. Different experience brings different perspectives. That is where learning begins.",
    image: milky,
    alt: "The Milky Way stretching across a dark sky",
  },
];
export default function Community() {
  return (
    <>
      <SEO
        title="The Collective"
        description="For the dreamers, the teachers, the ones who never stopped looking up. Discover the community taking shape around NightSky."
      />
      <section
        className="collective-hero"
        style={{
          backgroundImage:
            "linear-gradient(180deg,rgba(8,12,20,.25),rgba(8,12,20,.35) 45%,#0c0c0e),url(" +
            person +
            ")",
        }}
      >
        <div>
          <p className="eyebrow">Many beginnings. One shared sky.</p>
          <h1>The Collective</h1>
          <p>
            For the dreamers, the teachers,
            <br />
            the ones who never stopped looking up.
          </p>
          <a className="collective-scroll" href="#shared-sky">
            Find your place beneath the stars <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <section id="shared-sky" className="collective-intro page-width">
        <p className="eyebrow">The sky belongs to all of us</p>
        <h2>
          Different places.
          <br />
          The same wonder.
        </h2>
        <p>
          Some of us come for the quiet. Some come with a camera, a question, or
          a story to tell. The Collective is the community we want to grow
          around those beginnings—a place to learn from one another and stay
          curious about the world above.
        </p>
      </section>
      <div className="collective-pursuits page-width">
        {pursuits.map((p) => (
          <section className="collective-pursuit" key={p.number}>
            <div className="collective-image">
              <img src={p.image} alt={p.alt} loading="lazy" />
              <span>{p.number} / Beneath the infinite</span>
            </div>
            <div className="collective-pursuit-copy">
              <p className="eyebrow">{p.label}</p>
              <h2>{p.title}</h2>
              <p>{p.body}</p>
            </div>
          </section>
        ))}
      </div>
      <section className="collective-people page-width">
        <div>
          <p className="eyebrow">You belong in the picture</p>
          <h2>
            No single way
            <br />
            to be a sky person.
          </h2>
        </div>
        <div className="collective-people-grid">
          {[
            [
              "Observers & wanderers",
              "For the joy of being outside, noticing more, and finding a little darkness.",
            ],
            [
              "Photographers & Filmmakers",
              "For the images, moving moments, and stories waiting to be made.",
            ],
            [
              "Educators & storytellers",
              "For making a complicated universe feel closer, one explanation at a time.",
            ],
            [
              "The simply curious",
              "For everyone starting with a question. No equipment or experience required.",
            ],
          ].map(([title, body]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>
      <section
        className="collective-future"
        style={{
          backgroundImage:
            "linear-gradient(#0c0c0eaa,#0c0c0ee8),url(" + milky + ")",
        }}
      >
        <p className="eyebrow">A community, taking shape</p>
        <h2>
          A shared sky.
          <br />
          An unfolding story.
        </h2>
        <p>
          Shared learning, observing stories, and ways to connect are the next
          part of NightSky. The Collective is still taking shape. As it grows,
          this is where you will find what comes next.
        </p>
        <span>For now, keep looking up.</span>
      </section>
    </>
  );
}
