import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import Navigation from "./Navigation";
import Footer from "./Footer";
export default function PageShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
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
