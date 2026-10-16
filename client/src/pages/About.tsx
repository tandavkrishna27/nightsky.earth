import { Link } from "wouter";
import EditorialPage from "@/components/EditorialPage";
import PluginAction from "@/components/PluginAction";
import { aboutSections } from "@/content/websiteCopy";
import image from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";
export default function About() {
  return (
    <EditorialPage
      eyebrow="Our story"
      title="A little closer to the night sky."
      intro="NightSky begins with a simple wish: to help more people find their way from curiosity to time under the stars."
      image={image}
    >
      <div className="reading-column">
        {aboutSections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
            {title === "Wonder, with understanding." && (
              <Link className="text-link" href="/sources">
                Explore sources & coverage →
              </Link>
            )}
            {title === "Room to grow." && (
              <Link className="text-link" href="/community">
                Discover The Collective →
              </Link>
            )}
          </section>
        ))}
        <PluginAction />
      </div>
    </EditorialPage>
  );
}
