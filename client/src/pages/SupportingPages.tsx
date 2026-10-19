import EditorialPage from "@/components/EditorialPage";
import { SUPPORT_EMAIL } from "@shared/website";

const effectiveDate = "19 October 2026";

const content = {
  privacy: {
    eyebrow: "Privacy",
    title: "Your privacy, clearly explained.",
    intro:
      "What NightSky processes when you visit this website or use the connected service, and where that information goes.",
    sections: [
      [
        "Who operates NightSky",
        "NightSky.earth is operated by Tandav Krishna (TK), based in Hyderabad, Telangana, India. For privacy questions or requests, contact the email address at the end of this page.",
      ],
      [
        "Information used to answer a request",
        "NightSky does not require a separate NightSky account and does not keep request content, submitted locations, prompts or conversation history in a persistent NightSky user profile or request history. When you ask an AI assistant to use NightSky, the information needed to answer—such as a place or coordinates, date and time, observing interests, optional equipment details or a news search—may be processed while the request is answered. The AI platform you use separately processes your conversation under its own terms and privacy notice.",
      ],
      [
        "Information sent to data providers",
        "Some features use independent data providers. Depending on the feature, NightSky may send a relevant place, coordinates, date range or search query to a provider. The deployed MCP service currently uses Geoapify with OpenStreetMap data for place lookup and candidate discovery, MET Norway for weather forecasts, and DarkSkySites.com for point-specific modeled light-pollution estimates. Astronomy Engine calculates sky geometry within the service. A chosen destination name or coordinates can be sent to these providers; DarkSkySites estimates are not live readings. GeoNames, NOAA OVATION, WeatherAPI, OpenWeather, Public Universe and 7Timer! are researched integrations, not active in the current production profile. The website separately uses Spaceflight News API for news searches. Historical context may use locally stored, operator-prepared Copernicus ERA5 summaries; NightSky does not make a live Open-Meteo request for that feature. The news search sends its search term and source filter through NightSky to Spaceflight News API, and displays article metadata and links rather than article text or images. Providers handle information under their own terms and privacy practices and may process it in other countries. Geoapify Free use requires visible Geoapify credit and OpenStreetMap attribution; NightSky does not include or distribute a retained OSM observing-place index.",
      ],
      [
        "Interactive sky map",
        "The Sky Map page shows a preview until you choose how to load the map. Stellarium Web is an independent third-party service. Its current web app requests an approximate location using your IP address whenever the map loads. If you choose Load with device location, the embedded app may also request precise device coordinates from your browser; this option is off unless you select it, and browser permission is required. If you decline or the browser blocks access, Stellarium falls back to its approximate IP-based estimate. Stellarium may send selected or detected coordinates to OpenStreetMap Nominatim to look up a place name. These connections are made by your browser directly to Stellarium and Nominatim; NightSky’s app does not receive or store the map coordinates. Website hosting and third-party providers may separately process connection data such as IP addresses under their own privacy practices. Stellarium and OpenStreetMap control their own processing, terms and privacy practices. The map may also use its own storage or cookies. You can open Stellarium Web directly instead of embedding it.",
      ],
      [
        "Website storage, analytics and hosting",
        "The Sky Events calendar saves your selected time zone and calendar view in local storage on your device, and the website remembers that you entered the welcome screen for the current browser session. These preferences stay in your browser and are not sent to a NightSky account. Optional Google Analytics 4 loads only after you choose Allow analytics. NightSky sends manual page views with a fixed site title and a sanitized page path; it removes query strings and fragments, sends an empty referrer, and does not track clicks, forms or scrolling. Google Analytics also creates standard events such as first_visit, session_start and user_engagement and may process pseudonymous identifiers, browser/device details and approximate location based on network information. Enhanced Measurement, Google Signals and advertising personalization are disabled, and query parameter redaction is enabled. Rejecting analytics prevents the Google tag from loading. You can change your choice with Privacy choices in the footer. The choice is stored in this browser; if storage is unavailable, it applies only until you leave the page. Analytics cookies expire after 30 days, and the GA property retains user-level and event-level data for two months. Revoking consent stops future measurement and removes GA cookies in this browser; it does not automatically delete data already received by Google. Google Analytics is separate from Google Fonts, which connects your browser to retrieve font files. Processing may occur outside India under Google's terms and privacy policy. Netlify hosts this website and its news function; as part of delivery and security, Netlify may process technical information such as network and request details and function logs. The Netlify dashboard makes function logs available for up to seven days depending on plan; this is not a confirmed deletion period for all hosting records. The MCP service is deployed on Hetzner Cloud and serves mcp.nightsky.earth over HTTPS. The application emits fixed route and outcome diagnostics without request or response bodies, query strings or exact coordinates. The production nginx site has access logging off and discards its error log. A separate catch-all nginx site keeps access and error logs under daily rotation with 14 compressed rotations; this is not a guaranteed deletion date. Docker container logs are limited by size (10 MB per file, three files), so their age varies. The system journal is persistent with no configured age limit. The service uses bounded in-memory caches and a persistent provider quota ledger for usage buckets, not a conversation history. No NightSky backup job was found on the host. The Hetzner Console shows automatic backups disabled and no snapshots for this server as checked on 19 October 2026. No fixed deletion period is promised for host logs or backups here. No analytics product is configured for the MCP service. This hosting activity is separate from NightSky’s request-history storage.",
      ],
      [
        "Email and privacy requests",
        "If you email NightSky at its Gmail address, Google processes the message as the email provider. The support inbox is reviewed daily, and support messages are deleted 90 days after the last reply; a new reply restarts that period. Please leave out passwords, access keys and sensitive details that are not needed. You can ask what personal information NightSky holds about you, or request correction or deletion. NightSky does not keep a persistent request history; if your request concerns an email or information held by an AI platform, host or data provider, that information may need to be addressed with the relevant service. Requests will be handled under applicable law.",
      ],
      [
        "Age and children",
        "NightSky's astronomy-planning content is intended for general audiences aged 13 and older, and is not intended for children under 13. You must also meet the age and consent requirements of the AI platform you use. NightSky does not ask for your date of birth or run its own age-verification check.",
      ],
      [
        "Changes and effective date",
        `This Privacy Policy is effective ${effectiveDate}. If NightSky’s data practices change, this page will be updated to explain the change and show a revised effective date.`,
      ],
    ],
  },
  terms: {
    eyebrow: "Terms",
    title: "Terms for using NightSky.",
    intro:
      "A clear guide to using NightSky, understanding its information and knowing what to expect from the service.",
    sections: [
      [
        "Operator and service",
        "NightSky.earth is operated by Tandav Krishna (TK), based in Hyderabad, Telangana, India. NightSky provides information and tools to help people explore, understand and prepare for the night sky through supported AI platforms. It does not require a separate NightSky account. The service and its features may change as they are maintained.",
      ],
      [
        "Eligibility and AI platforms",
        "NightSky's astronomy-planning content is intended for general audiences aged 13 and older. You must also meet the age, consent, account and use requirements of the AI platform through which you access it. The AI platform is a separate service, and its terms and privacy practices apply to your account and conversations.",
      ],
      [
        "Current price",
        "NightSky is currently available without a NightSky fee. This does not promise that every future feature will remain free. If a paid feature or charge is introduced, its price and terms will be shown before you choose to use or purchase it.",
      ],
      [
        "Use the service responsibly",
        "Use NightSky only for lawful purposes. Do not interfere with, overload, probe or attempt to gain unauthorized access to NightSky or its providers. Do not submit passwords, access keys or personal information that is not needed for your request. Do not use NightSky as a substitute for professional advice or information that must be guaranteed, real-time or certified.",
      ],
      [
        "Information and observing safety",
        "Astronomical calculations, forecasts, maps, event details and other results can be incomplete, delayed, approximate or unavailable. They are for general informational and educational use and do not guarantee visibility, weather, access, safety or a particular outcome. Conditions can change quickly. Before travelling or observing, check current official notices and local access rules, use your own judgment and follow appropriate safety practices. Never look directly at the Sun without proper certified protection.",
      ],
      [
        "Third-party services and material",
        "NightSky may rely on AI platforms, independent data providers and Stellarium Web’s hosted interactive sky map. Their services, content, availability, terms and privacy practices are controlled by those providers and may change. Provider names, marks and materials belong to their respective owners. Follow applicable provider terms and any source attributions shown with the service.",
      ],
      [
        "Ownership and feedback",
        "NightSky’s name, branding and original website materials belong to their respective rights holders. Third-party materials remain with their owners. These terms do not transfer ownership of material you provide. If you send feedback, you allow NightSky to consider and use it to improve the service, subject to applicable law; do not send confidential material in feedback.",
      ],
      [
        "Availability and changes",
        "NightSky is provided as currently made available and may be changed, suspended or discontinued to maintain or improve the service. Features and provider access can vary by AI platform. To the extent permitted by law, NightSky does not promise uninterrupted availability or that every result will be error-free.",
      ],
      [
        "Liability and legal rights",
        "To the extent permitted by applicable law, NightSky is not responsible for indirect or consequential loss arising from use of the service or reliance on its general sky information. Nothing in these terms excludes or limits responsibility that cannot lawfully be excluded or limits any consumer right or remedy that cannot be waived. You remain responsible for checking conditions, official guidance and safety before acting on information provided by NightSky.",
      ],
      [
        "Applicable law, changes and effective date",
        `These terms are governed by the laws of India, subject to any mandatory consumer protections and other rights that apply to you. Any dispute may be brought before a court or consumer forum with jurisdiction under applicable law. These Terms are effective ${effectiveDate}. Material changes will be reflected on this page with an updated effective date.`,
      ],
    ],
  },
} as const;

export default function SupportingPage({
  kind,
}: {
  kind: keyof typeof content;
}) {
  const page = content[kind];
  return (
    <EditorialPage eyebrow={page.eyebrow} title={page.title} intro={page.intro}>
      <div className="reading-column">
        <p className="small-note">Effective date: {effectiveDate}</p>
        {page.sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
            {title === "Website storage, analytics and hosting" && (
              <p>
                <a
                  href="https://www.netlify.com/privacy/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Netlify Privacy Statement
                </a>
                {" · "}
                <a
                  href="https://docs.netlify.com/manage/monitoring/logs/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Netlify function-log details
                </a>
                {" · "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Privacy Policy
                </a>
                {" · "}
                <a
                  href="https://support.google.com/analytics/answer/12002338"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Analytics setup and data practices
                </a>
              </p>
            )}
            {title === "Interactive sky map" && (
              <p>
                <a href="https://stellarium-web.org/" target="_blank" rel="noopener noreferrer">
                  Stellarium Web
                </a>
                {" · "}
                <a href="https://github.com/Stellarium/stellarium-web-engine" target="_blank" rel="noopener noreferrer">
                  Stellarium Web Engine project and license
                </a>
                {" · "}
                <a href="https://operations.osmfoundation.org/policies/nominatim/" target="_blank" rel="noopener noreferrer">
                  Nominatim usage policy
                </a>
                {" · "}
                <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">
                  OpenStreetMap Foundation privacy policy
                </a>
              </p>
            )}
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
