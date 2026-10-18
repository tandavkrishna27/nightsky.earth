import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";
import {
  readAnalyticsConsent,
  revokeGoogleAnalytics,
  saveAnalyticsConsent,
  trackAnalyticsPageView,
  type AnalyticsConsent as AnalyticsConsentValue,
} from "@/lib/analytics";
import "@/styles/analytics-consent.css";

type AnalyticsConsentContextValue = {
  openAnalyticsPreferences: () => void;
};

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue>({
  openAnalyticsPreferences: () => {},
});

export function useAnalyticsPreferences() {
  return useContext(AnalyticsConsentContext);
}

export default function AnalyticsConsent({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [consent, setConsent] = useState<AnalyticsConsentValue>(() => readAnalyticsConsent());
  const [preferencesOpen, setPreferencesOpen] = useState(consent === "undecided");

  useEffect(() => {
    if (consent === "accepted") trackAnalyticsPageView(window.location.pathname);
  }, [consent, location]);

  useEffect(() => {
    const syncConsent = (event: StorageEvent) => {
      if (event.key !== "nightsky-analytics-consent") return;
      const nextConsent = readAnalyticsConsent();
      setConsent(nextConsent);
      if (nextConsent === "rejected") revokeGoogleAnalytics();
    };
    window.addEventListener("storage", syncConsent);
    return () => window.removeEventListener("storage", syncConsent);
  }, []);

  const choose = useCallback((choice: Exclude<AnalyticsConsentValue, "undecided">) => {
    saveAnalyticsConsent(choice);
    if (choice === "rejected") revokeGoogleAnalytics();
    setConsent(choice);
    setPreferencesOpen(false);
  }, []);

  const openAnalyticsPreferences = useCallback(() => setPreferencesOpen(true), []);
  const contextValue = useMemo(
    () => ({ openAnalyticsPreferences }),
    [openAnalyticsPreferences],
  );

  return (
    <AnalyticsConsentContext.Provider value={contextValue}>
      {children}
      {preferencesOpen && (
        <aside
          className="analytics-consent"
          aria-label="Analytics privacy choices"
          data-testid="analytics-consent"
        >
          <div className="analytics-consent-copy">
            <p className="analytics-consent-eyebrow">Your privacy, your choice</p>
            <h2>Help us make NightSky better</h2>
            <p>
              Optional Google Analytics runs only if you allow it. NightSky sends
              clean page paths without query strings or referrers. Google also
              collects standard events such as first visits and sessions, plus
              basic browser, device and approximate location data. We turn off
              interaction tracking and advertising. Your choice is saved in this
              browser, and you can change it anytime in the footer.
            </p>
            <a href="/privacy">Read the Privacy Policy</a>
          </div>
          <div className="analytics-consent-actions">
            <button type="button" className="analytics-consent-reject" onClick={() => choose("rejected")}>
              Reject analytics
            </button>
            <button type="button" className="analytics-consent-accept" onClick={() => choose("accepted")}>
              Allow analytics
            </button>
          </div>
        </aside>
      )}
    </AnalyticsConsentContext.Provider>
  );
}
