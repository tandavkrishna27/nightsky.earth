import { Link } from "wouter";
import EditorialPage from "@/components/EditorialPage";
import PluginAction, { listingConfig } from "@/components/PluginAction";
import { resolvePluginAction } from "@shared/website";
import { questionExamples } from "@/content/websiteCopy";
export default function GetStarted() {
  const action = resolvePluginAction(listingConfig);
  return (
    <EditorialPage
      eyebrow="Get started"
      title="Bring your curiosity to ChatGPT."
      intro="Add NightSky when its public listing is available, then start with the question you want to explore."
    >
      <div className="reading-column">
        <section>
          <p className="eyebrow">Availability</p>
          <h2>
            {action.external
              ? "Find NightSky in ChatGPT."
              : "A little more to come."}
          </h2>
          <p>
            {action.external
              ? "Open NightSky’s public listing to review its availability and follow the installation instructions shown there."
              : "NightSky’s public ChatGPT listing is not available yet. Explore how it works below, or contact us with a question."}
          </p>
          {action.external && <PluginAction />}
        </section>
        <section>
          <h2>Start with a question.</h2>
          <p>
            You can ask for an explanation without planning an outing. For a
            local session, include a named destination, a date, and what you
            want to observe. For photography, mention your camera and lens.
          </p>
          <ul className="question-list">
            {questionExamples.map((x) => (
              <li key={x.id}>{x.question}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Keep the conversation going.</h2>
          <p>
            Ask what a condition means, compare another night, or explore what
            to prepare. Where information is missing, ask what can be checked
            next.
          </p>
          <Link className="text-link" href="/contact">
            Need help? Contact NightSky →
          </Link>
        </section>
      </div>
    </EditorialPage>
  );
}
