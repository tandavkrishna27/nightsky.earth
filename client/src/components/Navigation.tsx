import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import PluginAction from "./PluginAction";
const links = [
  ["/about", "About"],
  ["/community", "The Collective"],
  ["/resources", "Resources"],
  ["/news", "News"],
];
export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [location]);
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
    <header className="site-header">
      <div className="nav-inner">
        <Link href="/" className="brand" aria-label="NightSky.earth home">
          NightSky<span>.earth</span>
          <i aria-hidden="true">✧</i>
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
          <PluginAction />
          <button
            ref={trigger}
            className="menu-trigger"
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? "Close" : "Menu"}{" "}
            <span aria-hidden="true">{open ? "−" : "+"}</span>
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
          <PluginAction />
        </nav>
      )}
    </header>
  );
}
