import { Link } from "wouter";
import { Instagram } from "lucide-react";
import { INSTAGRAM_URL } from "@shared/website";
import { useReplayWelcome } from "./ExperienceShell";
import { useAnalyticsPreferences } from "./AnalyticsConsent";
import nightskyLogo from "@assets/nightsky-logo-dark.svg";
const groups: { title: string; links: string[][] }[] = [
  {
    title: "Explore",
    links: [
      ["/resources", "Resources"],
      ["/sky-events", "Sky Events"],
      ["/community", "The Collective"],
      ["/news", "News"],
      ["/about", "About"],
    ],
  },
  {
    title: "Help",
    links: [
      ["/#how-it-works", "How it works"],
      ["/get-started", "Get started"],
      ["/contact", "Contact"],
      ["/sources", "Sources & coverage"],
      ["/sky-map", "Sky Map"],
    ],
  },
  {
    title: "The details",
    links: [
      ["/privacy", "Privacy"],
      ["/terms", "Terms"],
    ],
  },
];
export default function Footer() {
  const replayWelcome = useReplayWelcome();
  const { openAnalyticsPreferences } = useAnalyticsPreferences();
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Link href="/" className="footer-brand" aria-label="NightSky.earth">
            <img src={nightskyLogo} alt="" width={1397} height={205} />
          </Link>
          <p>Where Earth meets the stars.</p>
          <a
            className="footer-social"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow NightSky.earth on Instagram"
          >
            <Instagram size={18} aria-hidden="true" /> Instagram
          </a>
        </div>
        {groups.map((group) => (
          <div className="footer-column" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={
                  href.includes("#")
                    ? () => {
                        requestAnimationFrame(() =>
                          document
                            .getElementById(href.split("#")[1])
                            ?.scrollIntoView(),
                        );
                      }
                    : undefined
                }
              >
                {label}
              </Link>
            ))}
            {group.title === "Help" && (
              <button className="footer-replay" type="button" onClick={event => replayWelcome(event.currentTarget)}>
                Replay welcome
              </button>
            )}
            {group.title === "The details" && (
              <button
                className="footer-replay footer-analytics-preferences"
                type="button"
                onClick={openAnalyticsPreferences}
              >
                Privacy choices
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} NightSky.earth</span>
        <span>Curiosity belongs under an open sky.</span>
      </div>
    </footer>
  );
}
