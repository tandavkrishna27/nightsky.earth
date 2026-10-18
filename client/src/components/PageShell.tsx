import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import Navigation from "./Navigation";
import Footer from "./Footer";
export default function PageShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
      return;
    }
    let targetId = window.location.hash.slice(1);
    try {
      targetId = decodeURIComponent(targetId);
    } catch {
      // Keep the literal fragment if it is not valid percent encoding.
    }
    let observer: MutationObserver | undefined;
    const revealAnchor = () => {
      const target = document.getElementById(targetId);
      if (!target) return false;
      requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth" }));
      observer?.disconnect();
      return true;
    };
    if (!revealAnchor()) {
      const main = document.getElementById("main-content");
      if (main) {
        observer = new MutationObserver(revealAnchor);
        observer.observe(main, { childList: true, subtree: true });
      }
    }
    return () => observer?.disconnect();
  }, [location]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navigation />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
