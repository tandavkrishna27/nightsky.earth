export type AnalyticsConsent = "accepted" | "rejected" | "undecided";

export const ANALYTICS_CONSENT_KEY = "nightsky-analytics-consent";
export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-G6DTHEN2E1";
const GA_SCRIPT_ID = "nightsky-google-analytics";
const GA_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
let memoryConsent: AnalyticsConsent = "undecided";

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type PageViewPayload = {
  page_location: string;
  page_path: string;
  page_title: "NightSky.earth";
  page_referrer: "";
};

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export function readAnalyticsConsent(storage?: StorageLike): AnalyticsConsent {
  try {
    const stored = (storage ?? window.localStorage).getItem(ANALYTICS_CONSENT_KEY);
    if (stored === "accepted" || stored === "rejected") return stored;
  } catch {
    return memoryConsent;
  }
  return memoryConsent;
}

export function saveAnalyticsConsent(
  choice: Exclude<AnalyticsConsent, "undecided">,
  storage?: StorageLike,
): void {
  memoryConsent = choice;
  try {
    (storage ?? window.localStorage).setItem(ANALYTICS_CONSENT_KEY, choice);
  } catch {
    // The choice still applies for this page view when browser storage is blocked.
  }
}

export function mayLoadAnalytics(
  hostname: string,
  consent: AnalyticsConsent,
  protocol: string,
): boolean {
  return hostname === "nightsky.earth" && consent === "accepted" && protocol === "https:";
}

export function sanitizeAnalyticsPath(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0];
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path || "/";
}

export function buildPageViewPayload(
  pathname: string,
  _pageTitle: string,
  origin: string,
): PageViewPayload {
  const pagePath = sanitizeAnalyticsPath(pathname);
  let safeOrigin = "https://nightsky.earth";
  try {
    const parsed = new URL(origin);
    if (parsed.protocol === "https:" && parsed.hostname === "nightsky.earth") {
      safeOrigin = parsed.origin;
    }
  } catch {
    // Fall back to the canonical site origin.
  }
  return {
    page_location: `${safeOrigin}${pagePath}`,
    page_path: pagePath,
    page_title: "NightSky.earth",
    page_referrer: "",
  };
}

export function initializeGoogleAnalytics(): boolean {
  if (
    typeof window === "undefined" ||
    !mayLoadAnalytics(
      window.location.hostname,
      readAnalyticsConsent(),
      window.location.protocol,
    )
  ) {
    return false;
  }

  if (!window.gtag) {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => window.dataLayer!.push(args);
    window.gtag("js", new Date());
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("config", GOOGLE_ANALYTICS_MEASUREMENT_ID, {
      ...buildPageViewPayload(window.location.pathname, "NightSky.earth", window.location.origin),
      send_page_view: false,
      ignore_referrer: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: GA_COOKIE_MAX_AGE_SECONDS,
      cookie_update: false,
    });
  }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }
  return true;
}

export function trackAnalyticsPageView(pathname: string): boolean {
  if (!initializeGoogleAnalytics() || !window.gtag) return false;
  window.gtag(
    "event",
    "page_view",
    buildPageViewPayload(pathname, "NightSky.earth", window.location.origin),
  );
  return true;
}

export function revokeGoogleAnalytics(): void {
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  const host = window.location.hostname;
  const domains = [host, ".nightsky.earth"];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=", 1)[0];
    if (!name.startsWith("_ga")) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax; Secure`;
    }
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax; Secure`;
  }
}
