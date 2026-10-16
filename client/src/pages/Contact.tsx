import EditorialPage from "@/components/EditorialPage";
import { SUPPORT_EMAIL } from "@shared/website";
export default function Contact() {
  return (
    <EditorialPage
      eyebrow="Contact"
      title="Help us make NightSky better."
      intro="Have a question, found something confusing, or noticed information that needs a closer look?"
    >
      <div className="reading-column">
        <section>
          <h2>Start a conversation.</h2>
          <p>
            Email us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
          <p>
            For a problem with an answer, include the question, the place and
            date if relevant, and what seemed wrong. Leave out personal details
            you do not want to share.
          </p>
          <a className="action action-primary" href={`mailto:${SUPPORT_EMAIL}`}>
            Email NightSky ↗
          </a>
          <p className="small-note">
            This opens your email app. You can also copy the address above.
          </p>
        </section>
      </div>
    </EditorialPage>
  );
}
