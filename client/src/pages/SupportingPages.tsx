import EditorialPage from "@/components/EditorialPage";
import { SUPPORT_EMAIL } from "@shared/website";
const content = {
  privacy: {
    eyebrow: "Privacy",
    title: "Your privacy, clearly explained.",
    intro: "What NightSky’s website and connected service process, where information goes, and what still needs confirmation before publication.",
    sections: [
      [
        "Who operates NightSky",
        "NightSky.earth is operated by Tandav Krishna (TK), based in Hyderabad, Telangana, India. For privacy questions or requests, contact the address at the end of this page.",
      ],
      [
        "What NightSky processes",
        "NightSky does not currently ask you to create a NightSky account. When you ask an AI assistant to use NightSky, the service may receive the information needed for that request, such as a place or coordinates, date and time, observing interests, optional equipment details, and settings you choose. Do not include information that is not needed for a sky-planning request. The AI platform separately processes your conversation under its own terms and privacy notice.",
      ],
      [
        "Information sent to service providers",
        "To answer a request, NightSky may send the relevant location, date range or query to providers that supply place, weather, climate or news information. Depending on the feature and configuration, these can include GeoNames or Geoapify for place lookup; MET Norway, WeatherAPI, OpenWeather or NOAA for weather; Open-Meteo for historical climate preparation; and the Spaceflight News API for news searches. Weather requests can include resolved coordinates, and some location inputs are rounded before they are sent. Each provider handles information under its own terms and privacy practices. The exact providers and transfers depend on the deployed configuration and must be checked before publication.",
      ],
      [
        "Service logs and retention",
        "NightSky’s application logging records operational details such as a fixed route label, request method, response status and duration; it is designed not to record request bodies or query strings. Temporary rate-limit counters are held in memory. The service also keeps an operator-side quota ledger for provider usage. An optional climate API history feature can store request summaries and source evidence, but it is disabled by default. These implementation details do not establish the retention period for the production host, backups, infrastructure logs or support mailbox. Those settings and any configured history use must be confirmed before this draft is published; no deletion deadline is promised here.",
      ],
      [
        "Website storage and analytics",
        "The website stores selected calendar view and time-zone preferences in local storage on your device. The entered splash-screen state is kept in session storage for the current browser session. These preferences are not sent to a NightSky account. The website code does not add an analytics script. The production host may create its own technical logs; its logging, cookies and retention settings have not yet been confirmed. News searches send the search term and selected source filter to NightSky’s service so it can request matching results.",
      ],
      [
        "Contacting NightSky",
        "The contact link opens your email application; information is sent to NightSky only if you choose to send the message. Please leave out passwords, access keys and sensitive details that are not needed. Support-mailbox access and deletion practices need to be confirmed before publication. You can ask what information NightSky holds about you or request correction or deletion. We will assess requests against the information available to us and the laws that apply; copies held by an AI platform or an external provider must be addressed with that provider.",
      ],
      [
        "Age and children",
        "NightSky is intended for adults aged 18 and older. NightSky does not ask for your date of birth or operate its own age-verification check. You must also meet the age and account requirements of the AI platform you use. If you believe someone under 18 has sent personal information to NightSky, contact us so we can review the request.",
      ],
      [
        "Jurisdiction, changes and effective date",
        "Privacy rights, legal bases for processing, international-transfer details and complaint channels depend on the final hosting and provider arrangements and the laws that apply. They require review before publication. This draft has no effective date and does not make a final compliance or security assurance. The published policy will identify its effective date and explain any material changes.",
      ],
    ],
  },
  terms: {
    eyebrow: "Terms",
    title: "Terms for using NightSky.",
    intro: "The service, your responsibilities, and the limits to keep in mind while exploring the night sky with NightSky.",
    sections: [
      [
        "Operator and service",
        "NightSky.earth is operated by Tandav Krishna (TK), based in Hyderabad, Telangana, India. NightSky provides information and tools to help people explore, understand and prepare for the night sky through supported AI platforms. It does not currently require a separate NightSky account. The service and its features may change as they are maintained.",
      ],
      [
        "Eligibility and AI platforms",
        "NightSky is intended for people aged 18 and older. You must also meet the age, account and use requirements of the AI platform through which you access it. The platform is a separate service, and its terms and privacy practices apply to your account and conversations.",
      ],
      [
        "Use the service responsibly",
        "Use NightSky only for lawful purposes and do not interfere with, overload, probe or attempt to gain unauthorized access to the service or its providers. Do not use NightSky to make decisions that require guaranteed, real-time or professionally certified information. Do not submit secrets or personal information that is not needed for your request.",
      ],
      [
        "Information, conditions and safety",
        "Astronomical calculations, forecasts, maps, event details and other results can be incomplete, delayed, approximate or unavailable. They are for general informational and educational use, not a guarantee of visibility, weather, access, safety or a particular outcome. Conditions can change quickly. Before travelling or observing, check current official notices and local access rules, use your own judgment, and follow appropriate safety practices. Never look directly at the Sun without proper certified protection.",
      ],
      [
        "Third-party services and material",
        "NightSky may rely on AI platforms and independent data providers. Their services, content, availability, terms and privacy practices are controlled by those providers and may change. Provider names, marks and content belong to their respective owners. Follow any applicable provider terms and source attributions shown with the service.",
      ],
      [
        "Ownership and feedback",
        "NightSky’s website, branding and original materials are owned by their respective rights holders and may not be copied or used in a way that violates applicable rights. These terms do not transfer ownership of material you provide or of third-party content. If you send feedback, you allow NightSky to consider and use it to improve the service without an obligation to you, subject to applicable law; do not send confidential material in feedback.",
      ],
      [
        "Availability, changes and pricing",
        "NightSky is provided as currently made available and may be changed, suspended or discontinued to maintain or improve the service. Features and provider access can vary by AI platform. No permanent availability or price is promised by this draft; any charges or paid features will be presented before they apply.",
      ],
      [
        "Liability and legal rights",
        "Nothing in these terms removes rights or remedies that cannot be excluded under applicable consumer-protection law. The final terms must specify any lawful limits on responsibility and the applicable dispute and governing-law arrangements after legal review. Until then, this preview is not a final agreement and should not be treated as a waiver of your legal rights.",
      ],
      [
        "Changes and contact",
        "The published terms will include an effective date. Material changes will be reflected on this page with an updated date. Questions about these draft terms can be sent using the contact address below.",
      ],
    ],
  },
};
export default function SupportingPage({
  kind,
}: {
  kind: keyof typeof content;
}) {
  const page = content[kind];
  return (
    <EditorialPage eyebrow={page.eyebrow} title={page.title} intro={page.intro}>
      <div className="reading-column">
        {page.sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
        <p>
          Questions or corrections:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </div>
    </EditorialPage>
  );
}
