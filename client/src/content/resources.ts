export type ResourceTopic =
  "stargazing" | "photography" | "weather" | "events" | "places" | "equipment";
export type ResourceFormat = "tools" | "guides" | "learning" | "communities";
export type Resource = {
  id: string;
  name: string;
  description: string;
  topics: ResourceTopic[];
  format: ResourceFormat;
  url: string;
  reviewedAt: string;
  platforms?: string[];
  costLabel?: string;
};
export const topics: Record<ResourceTopic, string> = {
  stargazing: "Stargazing",
  photography: "Photography",
  weather: "Weather",
  events: "Sky events",
  places: "Places",
  equipment: "Equipment",
};
export const formats: Record<ResourceFormat, string> = {
  tools: "Apps & tools",
  guides: "Guides",
  learning: "Videos & courses",
  communities: "Communities",
};
export const resources: Resource[] = [
  {
    id: "stellarium",
    name: "Stellarium",
    description:
      "Explore a realistic planetarium and become familiar with the sky before you head outside.",
    topics: ["stargazing"],
    format: "tools",
    url: "https://stellarium.org/",
    reviewedAt: "2026-10-16",
  },
  {
    id: "timeanddate",
    name: "Time and Date Astronomy",
    description:
      "Explore Sun and Moon information, eclipses and astronomy reference tools for a chosen place.",
    topics: ["stargazing", "events"],
    format: "tools",
    url: "https://www.timeanddate.com/astronomy/",
    reviewedAt: "2026-10-16",
  },
  {
    id: "nasa-meteors",
    name: "NASA: Meteors & Meteorites",
    description:
      "Understand meteors, meteorites and the celestial debris behind the streaks of light.",
    topics: ["events", "stargazing"],
    format: "guides",
    url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
    reviewedAt: "2026-10-16",
  },
  {
    id: "photopills",
    name: "PhotoPills",
    description:
      "Explore photographic planning tools for the Sun, Moon and Milky Way. Check the provider for current availability and pricing.",
    topics: ["photography"],
    format: "tools",
    url: "https://www.photopills.com/",
    reviewedAt: "2026-10-16",
  },
  {
    id: "siril",
    name: "Siril",
    description:
      "Explore astronomical image processing, with documentation to help you develop a processing workflow.",
    topics: ["photography"],
    format: "tools",
    url: "https://siril.org/",
    reviewedAt: "2026-10-16",
  },
  {
    id: "nasa-skywatching",
    name: "NASA Skywatching",
    description:
      "Find skywatching information and introductory observing guidance from NASA.",
    topics: ["stargazing", "events", "equipment"],
    format: "guides",
    url: "https://science.nasa.gov/skywatching/",
    reviewedAt: "2026-10-16",
  },
  {
    id: "darksky",
    name: "DarkSky International: Places",
    description:
      "Learn about the International Dark Sky Places programme. Confirm current visiting and night-access rules with each place.",
    topics: ["places"],
    format: "guides",
    url: "https://darksky.org/what-we-do/international-dark-sky-places/",
    reviewedAt: "2026-10-16",
  },
  {
    id: "astrospheric",
    name: "Astrospheric",
    description:
      "Explore astronomy weather tools. Check the provider’s coverage before relying on a forecast for your destination.",
    topics: ["weather"],
    format: "tools",
    url: "https://www.astrospheric.com/",
    reviewedAt: "2026-10-16",
  },
  {
    id: "cloudynights",
    name: "Cloudy Nights",
    description:
      "Read observing discussions and equipment experiences shared by astronomy enthusiasts.",
    topics: ["stargazing", "equipment", "photography"],
    format: "communities",
    url: "https://www.cloudynights.com/",
    reviewedAt: "2026-10-16",
  },
];
