export const SITE_ORIGIN = "https://nightsky.earth";
export const SUPPORT_EMAIL = "NightSky.earth2026@gmail.com";
export type ListingConfig = { published: boolean; url: string | null };
export function resolvePluginAction(config: ListingConfig) {
  const unavailable = {
    label: "Get NightSky for ChatGPT",
    href: "/get-started",
    external: false,
  };
  try {
    const url = new URL(config.url || "");
    if (
      !config.published ||
      url.protocol !== "https:" ||
      url.hostname !== "chatgpt.com" ||
      url.username ||
      url.password ||
      url.port ||
      ["/", "/apps", "/plugins", "/gpts"].includes(
        url.pathname.replace(/\/$/, "") || "/",
      )
    )
      return unavailable;
    return {
      label: "Get NightSky for ChatGPT",
      href: url.href,
      external: true,
    };
  } catch {
    return unavailable;
  }
}
export function canonicalUrl(path: string) {
  try {
    const pathname = new URL(path, SITE_ORIGIN).pathname;
    const canonicalPath = pathname === "/" ? pathname : pathname.replace(/\/+$/, "") + "/";
    return SITE_ORIGIN + canonicalPath;
  } catch {
    return SITE_ORIGIN + "/";
  }
}
export type SiteRoute = {
  path: string;
  title: string;
  description: string;
  sitemap: boolean;
};
export const siteRoutes: readonly SiteRoute[] = [
  [
    "/",
    "Know when, where, and how to look up.",
    "Plan a night under the stars with NightSky in your AI assistant. Explore sky timing, possible observing places, and practical ways to get started.",
  ],
  [
    "/resources",
    "Find what helps you look up.",
    "Explore astronomy tools, observing guides, astrophotography resources, courses and ways to care for dark skies.",
  ],
  [
    "/community",
    "The Collective",
    "The Collective is coming soon. An invitation to stargazers, astronomers, creators, educators and everyone who cares for the night sky. Email NightSky to contribute.",
  ],
  [
    "/news",
    "News from the sky and beyond.",
    "Explore astronomy and space stories from external publishers. Follow each story to its original reporting.",
  ],
  [
    "/about",
    "Where Earth Looks Up",
    "The story behind NightSky: a plugin bringing curiosity, understanding and creative exploration into a conversation about the night sky.",
  ],
  [
    "/contact",
    "Contact NightSky.",
    "Get help with NightSky, report a bug or correction, or contribute to the Collective.",
  ],
  [
    "/get-started",
    "Get NightSky.",
    "Bring your curiosity to your AI assistant. Start with NightSky in ChatGPT, Claude, Gemini, or Grok.",
  ],
  [
    "/sky-events",
    "Sky Events calendar",
    "Explore a reviewed selection of meteor showers, eclipses, Moon phases and planetary events, with clear timing and source information.",
  ],
  [
    "/sky-map",
    "Explore the sky.",
    "Explore an interactive sky map from Stellarium Web. Load the map when you are ready to connect to the independent service.",
  ],
  [
    "/sources",
    "Sources & coverage.",
    "Understand NightSky’s astronomy calculations, weather sources, event references, place data and coverage limits.",
  ],
  [
    "/privacy",
    "Your privacy, clearly explained.",
    "What NightSky processes when you visit this website or use the connected service, and where that information goes.",
  ],
  [
    "/terms",
    "Terms for using NightSky.",
    "A clear guide to using NightSky, understanding its information and knowing what to expect from the service.",
  ],
].map(([path, title, description]) => ({
  path,
  title,
  description,
  sitemap: true,
}));
