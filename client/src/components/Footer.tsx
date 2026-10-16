import { Link } from "wouter";
import { SUPPORT_EMAIL } from "@shared/website";
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
      ["/get-started", "Get NightSky for ChatGPT"],
      ["/contact", "Contact"],
      ["/sources", "Sources & coverage"],
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
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Link href="/" className="brand">
            NightSky<span>.earth</span>
          </Link>
          <p>Where Earth meets the stars.</p>
          <a className="email-link" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
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
