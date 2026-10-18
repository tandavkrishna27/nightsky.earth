export const coverageReviewedAt = "2026-10-18";

export const coverageCards = [
  {
    id: "astronomy", title: "Darkness & the Moon", icon: "moon",
    description: "Calculated twilight, Moon phase and local sky positions help put an observing window into context.",
    coverage: "Supported targets include the Sun, Moon, planets and a Milky Way core reference. Positions use a geometric horizon; hills, buildings and atmospheric effects are outside that model.",
    details: [
      "NightSky uses Astronomy Engine for local calculations, including timestamped altitude and direction. A sampled position describes that time, rather than a target’s path through the whole night.",
      "Moon illumination and below-horizon intervals are separate pieces of evidence. Neither alone establishes the Moon’s effect on the view or the quality of a photograph.",
    ],
    sources: [{ name: "Astronomy Engine", url: "https://github.com/cosinekitty/astronomy" }, { name: "Don Cross — MIT license", url: "https://github.com/cosinekitty/astronomy/blob/master/LICENSE" }],
  },
  {
    id: "weather", title: "Weather & aurora", icon: "cloud",
    description: "Source-labelled forecasts help compare cloud, weather and short-term aurora outlooks for the selected place and time.",
    coverage: "Forecast windows, time intervals and available fields differ by provider. Missing cloud layers, seeing or transparency remain unknown. An aurora model is not a personal sighting probability.",
    details: [
      "MET Norway is the baseline weather integration. It preserves the forecast’s native sampling and accumulation periods. NOAA’s OVATION product is a short-term aurora outlook, typically 30–90 minutes, rather than a full-night forecast.",
      "Additional integrations are conditional on provider access and the service’s enabled sources. WeatherAPI uses hourly samples and is shown only after the account is confirmed on its Free plan with required credit and disclaimer. OpenWeather’s five-day product uses three-hour samples, but remains disabled until its exact Free-product license and attribution obligations are approved. 7Timer! ASTRO may be used in free or paid software under its current published guidance; its seeing and transparency values are categories or ranges, not precise measurements.",
      "Your answer identifies the source and returned time window. Fetch time is retrieval time; a model issue time is shown only when supplied. Independent forecasts retain their disagreements and are not averaged into one score.",
    ],
    sources: [
      { name: "MET Norway", url: "https://api.met.no/" },
      { name: "NOAA Space Weather Prediction Center", url: "https://www.swpc.noaa.gov/products/aurora-30-minute-forecast" },
      { name: "WeatherAPI — conditional on Free-plan confirmation", url: "https://www.weatherapi.com/terms.aspx" },
      { name: "OpenWeather — disabled pending license review", url: "https://openweathermap.org/storage/app/media/documents/License_explainer_25%20Feb_25.pdf" },
      { name: "7Timer! ASTRO — optional", url: "https://github.com/Yeqzids/7timer-issues/wiki/Wiki#usage" },
    ],
  },
  {
    id: "events", title: "Sky events & targets", icon: "orbit",
    description: "Supported lunar phases, eclipses, planetary events and meteor-shower references connect an event with its timing and source.",
    coverage: "Coverage is bounded by event, target and year. A meteor peak, a typical activity interval and a radiant model describe different things; they do not establish complete seasons or a personal meteor rate.",
    details: [
      "Lunar phases, seasons, eclipse geometry and supported planetary events use Astronomy Engine calculations. Local visibility still needs its own place, time, weather and horizon context.",
      "NASA Meteoroid Environment Office reports supply reviewed meteor maxima for 2025, 2026 and 2027. NightSky keeps each maximum attached to its original report and year, without repeating it into another year.",
      "Separate meteor-radiant fits from Moorhead, Clements and Vida are evaluated within their stated domains. Typical activity and civil-date guidance remain source-labelled context; they are not interchangeable with an exact UTC event.",
    ],
    sources: [
      { name: "NASA MEO — 2025 maxima", url: "https://ntrs.nasa.gov/citations/20240012381" },
      { name: "NASA MEO — 2026 maxima", url: "https://ntrs.nasa.gov/citations/20250009524" },
      { name: "NASA MEO — 2027 maxima", url: "https://ntrs.nasa.gov/citations/20260009360" },
      { name: "Moorhead, Clements & Vida — radiant models", url: "https://arxiv.org/abs/2205.15423" },
      { name: "Radiant-model license — CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
      { name: "IGN — meteor-shower guidance", url: "https://astronomia.ign.es/en/orionidas" },
      { name: "IGN — attribution and reuse terms", url: "https://www.ign.es/web/es/ign/portal/info-aviso-legal" },
    ],
  },
  {
    id: "places", title: "Places & geography", icon: "map",
    description: "Named-place resolution and source-labelled candidate searches help explore an area and select a point for a plan.",
    coverage: "A resolved town and a candidate observing site have different coverage. A map point does not establish night access, parking, facilities, accessibility or safety.",
    details: [
      "GeoNames supports named-city resolution. NightSky does not include or distribute a retained OpenStreetMap observing-place index. Where configured, observing candidates may come from bounded Geoapify API searches; Geoapify Free use requires visible Geoapify credit and OpenStreetMap attribution.",
      "API searches are bounded samples with their own category and geographic limits. A worldwide place-name index does not imply a complete worldwide observing-site catalogue. Source identity and date remain attached to each result.",
      "A named city’s time zone is separate from an exact site’s time zone. Where site evidence is unavailable, NightSky asks for an explicit display time zone. Access and current restrictions need official local information.",
    ],
    sources: [
      { name: "GeoNames", url: "https://www.geonames.org/" },
      { name: "Geoapify terms and attribution", url: "https://www.geoapify.com/terms-and-conditions/" },
    ],
  },
  {
    id: "light", title: "Light pollution", icon: "sparkles",
    description: "Optional point-specific estimates help compare modeled sky brightness when a supported source and dataset are available.",
    coverage: "SQM and Bortle estimates are model outputs. Keep the dataset age, selected coordinates and coverage quality in view; an unverified zero does not establish pristine darkness.",
    details: [
      "The optional DarkSkySites API integration preserves the provider’s attribution, dataset and quality information with the selected point. Availability depends on the enabled source and returned coverage.",
      "These estimates are separate from live weather and an on-site sky-brightness measurement. Missing data stays unavailable, and a darker modeled point still needs access and observing-condition checks.",
    ],
    sources: [{ name: "DarkSkySites — optional", url: "https://darkskysites.com/" }],
  },
] as const;

export const readingNotes = [
  ["A source, a place, a time.", "Read forecast valid times, the selected point and its display time zone together. Older datasets and shorter forecast windows carry different limits."],
  ["Missing means unknown.", "An absent value is not zero. When a source is unavailable or does not cover your night, NightSky keeps that gap visible alongside any usable evidence."],
  ["Historical context stays separate.", "Historical samples describe the past. Limited retained data or a test year does not establish a worldwide climate baseline, or predict conditions on a particular night."],
  ["Your assistant adds its own capabilities.", "Web search, maps and reminders depend on the assistant and tools available in your conversation. Those capabilities have their own evidence and access requirements."],
] as const;
