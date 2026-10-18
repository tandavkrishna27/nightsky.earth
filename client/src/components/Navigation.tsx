import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import PluginAction from "./PluginAction";
import nightskyLogo from "@assets/nightsky-logo-dark.svg";
const links = [
  ["/about", "About"],
  ["/community", "The Collective"],
  ["/resources", "Resources"],
  ["/news", "News"],
  ["/sky-map", "Sky Map"],
];
export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 64);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="nav-inner">
        <Link href="/" className="brand nav-brand" aria-label="NightSky.earth home">
          <img src={nightskyLogo} alt="" width={1397} height={205} />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={location === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <PluginAction compact />
          <button
            ref={trigger}
            className="menu-trigger"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            <span className="menu-icon" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={location === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <PluginAction compact />
        </nav>
      )}
    </header>
  );
}
