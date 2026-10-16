import { SiOpenai, SiClaude, SiGooglegemini } from "react-icons/si";
export default function PlatformAvailability() {
  return (
    <section
      className="platform-availability page-width"
      aria-label="AI platform availability"
    >
      <div className="platform-intro">
        <p className="eyebrow">One sky. More ways to explore.</p>
        <p>
          A companion for your AI conversations.
          <br />
          Starting with ChatGPT.
        </p>
      </div>
      <div className="platform-list">
        <div className="platform-item platform-first">
          <SiOpenai aria-hidden="true" />
          <div>
            <strong>ChatGPT</strong>
            <span>First release · In development</span>
          </div>
        </div>
        <div className="platform-item">
          <SiClaude aria-hidden="true" />
          <div>
            <strong>Claude</strong>
            <span>Future direction · Not available yet</span>
          </div>
        </div>
        <div className="platform-item">
          <SiGooglegemini aria-hidden="true" />
          <div>
            <strong>Gemini</strong>
            <span>Future direction · Not available yet</span>
          </div>
        </div>
      </div>
    </section>
  );
}
