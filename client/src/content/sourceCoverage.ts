export const coverageReviewedAt = "2026-10-21";

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
    description: "Source-labelled forecasts help compare cloud and weather for the selected place and time.",
    coverage: "MET Norway, WeatherAPI.com and OpenWeather are enabled forecast sources. OpenWeather values are limited to visual-card plans. Their time intervals and available fields differ; missing cloud layers, seeing or transparency remain unknown. No aurora forecast is active in this production profile.",
    details: [
      "MET Norway preserves its native forecast sampling and accumulation periods. WeatherAPI.com supplies hourly samples within its Free-plan three-day forecast horizon. Both supplied Hyderabad samples during the bounded production check on 20 October 2026; missing fields remained unknown. WeatherAPI.com answers include its credit and weather-uncertainty notice.",
      "The website itself displays no forecast samples. WeatherAPI.com requires source credit and its weather and safety notice wherever its forecast data is displayed.",
      "OpenWeather's Free five-day forecast uses native three-hour samples. The provider is enabled for plans with NightSky's visual card; direct forecast and comparison tools exclude its values. The card shows the linked ‘Weather data provided by OpenWeather’ credit and official logo beside OpenWeather samples. The published normalization-method document offers the adapted sample component under ODbL 1.0 and contains no API key or forecast response. This source list does not replace the adjacent in-product credit.",
      "NOAA OVATION is a short-term aurora outlook, and 7Timer! seeing and transparency values are categories or ranges rather than precise measurements. Both remain inactive. Provider availability can vary by request, place and time.",
      "Your answer identifies the source and returned time window. Fetch time is retrieval time; a model issue time is shown only when supplied. Independent forecasts retain their disagreements and are not averaged into one score.",
    ],
    sources: [
      { name: "MET Norway", url: "https://api.met.no/" },
      { name: "WeatherAPI.com — active forecast source", url: "https://www.weatherapi.com/" },
      { name: "WeatherAPI.com terms and weather disclaimer", url: "https://www.weatherapi.com/terms.aspx" },
      { name: "OpenWeather alteration-method offer — ODbL 1.0", url: "/openweather-normalization-method.json" },
      { name: "Open Data Commons Open Database License 1.0", url: "https://opendatacommons.org/licenses/odbl/1-0/" },
      { name: "OpenWeather attribution guidance", url: "https://openweathermap.org/faq#license" },
      { name: "NOAA OVATION — inactive", url: "https://www.swpc.noaa.gov/products/aurora-30-minute-forecast" },
      { name: "7Timer! ASTRO — inactive", url: "https://github.com/Yeqzids/7timer-issues/wiki/Wiki#usage" },
    ],
  },
  {
    id: "events", title: "Sky events & targets", icon: "orbit",
    description: "Supported lunar phases, eclipses, planetary events and meteor-shower references connect an event with its timing and source.",
    coverage: "Coverage is bounded by event, target and year. Meteor peaks do not establish complete seasons or personal rates. Public Universe covers only screened Bright Star Catalog and OpenNGC starter references; catalogue coordinates are not a current sky position or visibility guarantee.",
    details: [
      "Lunar phases, seasons, eclipse geometry and supported planetary events use Astronomy Engine calculations. Local visibility still needs its own place, time, weather and horizon context.",
      "NASA Meteoroid Environment Office reports supply reviewed meteor maxima for 2025, 2026 and 2027. NightSky keeps each maximum attached to its original report and year, without repeating it into another year.",
      "Separate meteor-radiant fits from Moorhead, Clements and Vida are evaluated within their stated domains. Typical activity and civil-date guidance remain source-labelled context; they are not interchangeable with an exact UTC event.",
      "Public Universe can search and return selected details from its screened BSC5P and OpenNGC starter subsets. A search or detail call is made for a requested catalogue task; an ordinary Moon, planet, darkness or meteor plan does not require it. Returned identities, source revisions, coordinate frames and original-catalogue credits stay attached to the result. Wider Public Universe domains are not admitted.",
      "NASA DONKI live space-weather access is not enabled. NASA Meteoroid Environment Office reports used for dated meteor references are a separate, already reviewed source.",
    ],
    sources: [
      { name: "NASA MEO — 2025 maxima", url: "https://ntrs.nasa.gov/citations/20240012381" },
      { name: "NASA MEO — 2026 maxima", url: "https://ntrs.nasa.gov/citations/20250009524" },
      { name: "NASA MEO — 2027 maxima", url: "https://ntrs.nasa.gov/citations/20260009360" },
      { name: "Moorhead, Clements & Vida — radiant models", url: "https://arxiv.org/abs/2205.15423" },
      { name: "Radiant-model license — CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
      { name: "IGN — meteor-shower guidance", url: "https://astronomia.ign.es/en/orionidas" },
      { name: "IGN — attribution and reuse terms", url: "https://www.ign.es/web/es/ign/portal/info-aviso-legal" },
      { name: "Public Universe — starter catalogue API", url: "https://sol.wickedsick.com/index.php/api" },
      { name: "Bright Star Catalog — NASA/GSFC HEASARC", url: "https://heasarc.gsfc.nasa.gov/docs/heasarc/data_policy.html" },
      { name: "OpenNGC — CC BY-SA 4.0", url: "https://github.com/mattiaverga/OpenNGC" },
    ],
  },
  {
    id: "places", title: "Places & geography", icon: "map",
    description: "Geoapify place lookup and bounded OpenStreetMap-based candidate searches help explore an area and select a point for a plan.",
    coverage: "A resolved town and a candidate observing site have different coverage. A map point does not establish night access, parking, facilities, accessibility or safety.",
    details: [
      "The current production service uses Geoapify for named-place lookup and bounded candidate searches using OpenStreetMap data. Geoapify Free use requires visible Geoapify credit and OpenStreetMap attribution. NightSky does not include or distribute a retained OpenStreetMap observing-place index; candidate records do not establish site access.",
      "GeoNames is a researched source, not part of the current production profile.",
      "API searches are bounded samples with their own category and geographic limits. A worldwide place-name index does not imply a complete worldwide observing-site catalogue. Source identity and date remain attached to each result.",
      "A named city’s time zone is separate from an exact site’s time zone. Where site evidence is unavailable, NightSky asks for an explicit display time zone. Access and current restrictions need official local information.",
    ],
    sources: [
      { name: "Geoapify terms and attribution", url: "https://www.geoapify.com/terms-and-conditions/" },
      { name: "OpenStreetMap copyright and license", url: "https://www.openstreetmap.org/copyright" },
      { name: "GeoNames — researched, inactive", url: "https://www.geonames.org/" },
    ],
  },
  {
    id: "light", title: "Light pollution", icon: "sparkles",
    description: "Active production estimates help compare modeled sky brightness for a selected point.",
    coverage: "SQM and Bortle estimates are model outputs. Keep the dataset age, selected coordinates and coverage quality in view; an unverified zero does not establish pristine darkness.",
    details: [
      "DarkSkySites.com is the active production source for point-specific modeled estimates. A visible linked credit accompanies returned values; availability still depends on its returned coverage.",
      "These estimates are separate from live weather and an on-site sky-brightness measurement. Missing data stays unavailable, and a darker modeled point still needs access and observing-condition checks.",
    ],
    sources: [{ name: "DarkSkySites.com — active production source", url: "https://darkskysites.com/" }],
  },
  {
    id: "sky-map", title: "Interactive sky map", icon: "map",
    description: "An interactive planetarium is available from Stellarium Web after you choose how to connect and whether to allow device location.",
    coverage: "This is a third-party hosted map, separate from NightSky’s own astronomy calculations and AI-plugin answers.",
    details: [
      "The map connects to Stellarium Web only after you choose a location option. Stellarium’s current web app uses IP-based location lookup and may request precise browser location when you opt in. It may use OpenStreetMap Nominatim to resolve detected or selected coordinates to a place name. These requests are made directly by your browser to the independent providers; NightSky’s app does not receive or store the map coordinates. Website hosting and third-party providers may separately process connection data such as IP addresses.",
      "NightSky embeds the hosted service; it does not bundle or modify Stellarium Web Engine code. The engine project publishes its licensing information in its repository.",
    ],
    sources: [
      { name: "Stellarium Web", url: "https://stellarium-web.org/" },
      { name: "Stellarium Web Engine and license", url: "https://github.com/Stellarium/stellarium-web-engine" },
      { name: "OpenStreetMap Nominatim", url: "https://nominatim.org/" },
      { name: "Nominatim usage policy", url: "https://operations.osmfoundation.org/policies/nominatim/" },
      { name: "OpenStreetMap Foundation privacy policy", url: "https://osmfoundation.org/wiki/Privacy_Policy" },
    ],
  },
] as const;

export const readingNotes = [
  ["A source, a place, a time.", "Read forecast valid times, the selected point and its display time zone together. Older datasets and shorter forecast windows carry different limits."],
  ["Missing means unknown.", "An absent value is not zero. When a source is unavailable or does not cover your night, NightSky keeps that gap visible alongside any usable evidence."],
  ["Historical context stays separate.", "Historical samples describe the past. Limited retained data or a test year does not establish a worldwide climate baseline, or predict conditions on a particular night."],
  ["Your assistant adds its own capabilities.", "Web search, maps and reminders depend on the assistant and tools available in your conversation. Those capabilities have their own evidence and access requirements."],
] as const;
