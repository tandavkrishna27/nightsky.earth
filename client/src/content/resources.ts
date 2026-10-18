export type ResourceTopic =
  "stargazing" | "photography" | "weather" | "events" | "places" | "equipment" | "learning" | "research" | "conservation";
export type ResourceFormat = "tools" | "guides" | "learning" | "communities";
export type Resource = {
  id: string;
  name: string;
  provider: string;
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
  learning: "Learning",
  research: "Research & citizen science",
  conservation: "Dark-sky conservation",
};
export const formats: Record<ResourceFormat, string> = {
  tools: "Apps & tools",
  guides: "Guides",
  learning: "Learning materials",
  communities: "Communities",
};
export const resources: Resource[] = [
  {
    "id": "nasa-skywatching",
    "name": "NASA Skywatching",
    "provider": "NASA",
    "url": "https://science.nasa.gov/skywatching/",
    "description": "Read monthly skywatching guides, watch short videos, and learn observing basics for the Moon, planets, meteors, and eclipses. Check local visibility before using event suggestions.",
    "topics": [
      "stargazing",
      "learning",
      "events"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "stellarium",
    "name": "Stellarium",
    "provider": "Stellarium contributors",
    "url": "https://stellarium.org/",
    "description": "Explore a realistic simulated sky, identify constellations and planets, and move through time before observing. Free desktop software includes telescope-oriented features; the official site also links to Stellarium Web.",
    "topics": [
      "stargazing",
      "equipment"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18",
    "costLabel": "Free"
  },
  {
    "id": "timeanddate-astronomy",
    "name": "timeanddate Astronomy",
    "provider": "Time and Date AS",
    "url": "https://www.timeanddate.com/astronomy/",
    "description": "Check local Sun and Moon times, Moon phases, planet visibility, and eclipse circumstances. Its location-based night-sky map and event explainers help turn a general sky event into a personal observing window.",
    "topics": [
      "stargazing",
      "events"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "rmg-smartphone-moon",
    "name": "Photograph the Moon with a Smartphone",
    "provider": "Royal Museums Greenwich",
    "url": "https://www.rmg.co.uk/stories/space-astronomy/how-photograph-moon-smartphone",
    "description": "Try Moon photography with practical advice on phone exposure, stability, zoom and editing. The guide explains digital-zoom limitations and automatic image enhancements that can affect the recorded detail.",
    "topics": [
      "photography",
      "equipment",
      "learning"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "photopills-academy",
    "name": "PhotoPills Academy",
    "provider": "PhotoPills",
    "url": "https://www.photopills.com/academy",
    "description": "Explore illustrated guides and videos for Milky Way, Moon, star trails and twilight photography. Some lessons teach PhotoPills workflows, so practical exercises can depend on its mobile app.",
    "topics": [
      "photography",
      "learning",
      "events"
    ],
    "format": "learning",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "openstax-astronomy",
    "name": "Astronomy 2e",
    "provider": "OpenStax, Rice University",
    "url": "https://openstax.org/books/astronomy-2e/pages/preface",
    "description": "Read or download a complete introductory astronomy textbook covering the Solar System, stars, galaxies, and cosmology. Digital reading is free; printed editions and some supplementary products cost extra.",
    "topics": [
      "learning"
    ],
    "format": "learning",
    "costLabel": "Free & paid",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "clear-outside",
    "name": "Clear Outside",
    "provider": "First Light Optics",
    "url": "https://clearoutside.com/",
    "description": "Choose a location to compare seven-day hourly cloud layers, weather, Moon times, and astronomical darkness. The traffic-light display makes a quick first check; revisit the forecast before heading out.",
    "topics": [
      "weather",
      "stargazing"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18",
    "costLabel": "Free"
  },
  {
    "id": "darksky-places",
    "name": "International Dark Sky Places",
    "provider": "DarkSky International",
    "url": "https://darksky.org/what-we-do/international-dark-sky-places/",
    "description": "Explore certified dark sky communities, parks, and protected areas around the world, and learn what certification protects. Confirm each destination’s opening hours, entry rules, and observing access separately.",
    "topics": [
      "places",
      "conservation",
      "stargazing"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "cloudy-nights",
    "name": "Cloudy Nights",
    "provider": "Cloudy Nights",
    "url": "https://www.cloudynights.com/forums/",
    "description": "Discuss telescopes, binoculars, mounts and imaging with other observers. Use the dedicated imaging forums for astrophotography questions; the general beginners forum explicitly focuses on visual observing.",
    "topics": [
      "photography",
      "equipment",
      "stargazing"
    ],
    "format": "communities",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "photopills",
    "name": "PhotoPills",
    "provider": "PhotoPills",
    "url": "https://www.photopills.com/",
    "description": "Plan Milky Way, Moon and star-trail compositions with a mobile app, augmented reality views and exposure calculators. Available for iOS and Android; purchasing the app is required.",
    "topics": [
      "photography",
      "equipment",
      "events"
    ],
    "format": "tools",
    "costLabel": "Paid",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "galaxy-zoo",
    "name": "Galaxy Zoo",
    "provider": "Galaxy Zoo, Zooniverse",
    "url": "https://www.zooniverse.org/projects/zookeeper/galaxy-zoo",
    "description": "Classify galaxy shapes in telescope images and discuss interesting objects with researchers and volunteers. Tutorials support beginners; available image collections change as research workflows progress.",
    "topics": [
      "research",
      "learning"
    ],
    "format": "communities",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "light-pollution-map",
    "name": "Light Pollution Map",
    "provider": "Jurij Stare / lightpollutionmap.info",
    "url": "https://www.lightpollutionmap.info/",
    "description": "Compare satellite night-light layers, modeled sky brightness, and ground measurements while scouting darker areas. Check each layer's date and meaning; mapped darkness does not confirm public access or conditions tonight.",
    "topics": [
      "places",
      "stargazing",
      "conservation"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "astrospheric",
    "name": "Astrospheric",
    "provider": "Astrospheric LLC",
    "url": "https://www.astrospheric.com/",
    "description": "Compare clouds, transparency, seeing, and smoke when planning North American observing. Forecast coverage follows regional weather models; check availability for your location. Free forecasts have partial data, with additional Pro features.",
    "topics": [
      "weather",
      "stargazing"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18",
    "costLabel": "Free & paid"
  },
  {
    "id": "skysafari",
    "name": "SkySafari",
    "provider": "Simulation Curriculum",
    "url": "https://skysafariastronomy.com/",
    "description": "Plan targets with interactive sky charts, observing lists, and an events calendar on iOS or Android. Paid editions offer different capabilities; check the edition and device requirements before choosing telescope-control features.",
    "topics": [
      "stargazing",
      "equipment",
      "events"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18",
    "costLabel": "Paid"
  },
  {
    "id": "sky-tonight",
    "name": "Sky Tonight",
    "provider": "Vito Technology",
    "url": "https://vitotechnology.com/apps/sky-tonight",
    "description": "Identify objects with a mobile sky map, follow their paths, and browse upcoming celestial events. The free app includes ads and limits expanded lists; paid access removes those restrictions.",
    "topics": [
      "stargazing",
      "events"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18",
    "costLabel": "Free & paid"
  },
  {
    "id": "sky-and-telescope-stargazing-basics",
    "name": "Stargazing Basics",
    "provider": "Sky & Telescope",
    "url": "https://skyandtelescope.org/astronomy-resources/stargazing-basics/",
    "description": "Build practical observing skills with the magazine's beginner collection: learning constellations, reading star charts, and starting with a telescope. Choose a guide for your next step rather than tackling everything at once.",
    "topics": [
      "stargazing",
      "equipment",
      "learning"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "meteoblue-astronomy-seeing",
    "name": "meteoblue Astronomy Seeing",
    "provider": "meteoblue",
    "url": "https://www.meteoblue.com/en/weather/outdoorsports/seeing/",
    "description": "Compare worldwide cloud layers, atmospheric seeing, and jet-stream forecasts before telescope sessions. Three days are free; seven days require point+. Fog and very low clouds need a separate check.",
    "topics": [
      "weather",
      "stargazing"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18",
    "costLabel": "Free & paid"
  },
  {
    "id": "clear-sky-chart",
    "name": "Clear Sky Chart",
    "provider": "ClearDarkSky / CSCCharts",
    "url": "https://www.cleardarksky.com/csk/",
    "description": "Read compact hourly charts for clouds, transparency, seeing, and darkness at observing sites in Canada, the United States, and parts of Mexico. Select a nearby chart and check its forecast timestamp.",
    "topics": [
      "weather",
      "stargazing"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18",
    "costLabel": "Free"
  },
  {
    "id": "noaa-aurora-forecast",
    "name": "NOAA Aurora Forecast",
    "provider": "NOAA Space Weather Prediction Center",
    "url": "https://www.spaceweather.gov/products/aurora-30-minute-forecast",
    "description": "Check modeled aurora location and intensity for both hemispheres over the next 30–90 minutes. This short-term outlook still depends on darkness, local weather, and available solar-wind observations.",
    "topics": [
      "weather",
      "events"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "ams-meteor-faq",
    "name": "Meteor Shower FAQ",
    "provider": "American Meteor Society",
    "url": "https://www.amsmeteors.org/faq/",
    "description": "Prepare for a meteor watch with advice on timing, direction, dark adaptation, and comfortable setup. Learn why radiant height, moonlight, and local conditions make published meteor rates different from what you see.",
    "topics": [
      "events",
      "stargazing"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "nasa-eclipse-viewing-safety",
    "name": "Eclipse Viewing Safety",
    "provider": "NASA Science",
    "url": "https://science.nasa.gov/eclipses/safety/",
    "description": "Understand eye protection for partial, annular, and total solar eclipses, including indirect viewing. NASA explains why eclipse glasses cannot replace the special front-mounted solar filters required for binoculars or telescopes.",
    "topics": [
      "events",
      "equipment"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "heavens-above",
    "name": "Heavens-Above",
    "provider": "Heavens-Above GmbH",
    "url": "https://www.heavens-above.com/",
    "description": "Set your observing location to find ISS and bright-satellite passes, with times and sky charts. Check predictions close to your session; orbital forecasts become less accurate farther from the current date.",
    "topics": [
      "events",
      "stargazing"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "nps-where-to-stargaze",
    "name": "Where to Stargaze",
    "provider": "U.S. National Park Service",
    "url": "https://www.nps.gov/subjects/nightskies/stargaze.htm",
    "description": "Explore U.S. national parks with night-sky programs and ideas for observing closer to home. Follow each park's own pages for current events, opening hours, reservations, and overnight access before traveling.",
    "topics": [
      "places",
      "stargazing"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "siril",
    "name": "Siril",
    "provider": "Siril",
    "url": "https://siril.org/",
    "description": "Calibrate, align, stack and process astronomical images with desktop software. Follow the official tutorials for a first workflow and for preparing the calibration frames your images need.",
    "topics": [
      "photography"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "nina",
    "name": "N.I.N.A.",
    "provider": "N.I.N.A. project",
    "url": "https://nighttime-imaging.eu/docs/master/site/",
    "description": "Automate deep-sky imaging through equipment connections, focusing and sequencing, supported by official documentation and a quick start. Requires a compatible Windows computer and supported cameras, mounts or drivers.",
    "topics": [
      "photography",
      "equipment"
    ],
    "format": "tools",
    "costLabel": "Free",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "phd2-guiding-manual",
    "name": "PHD2 Guiding Manual",
    "provider": "Open PHD Guiding",
    "url": "https://openphdguiding.org/man/",
    "description": "Learn guide-camera and mount connections, calibration, guiding graphs and troubleshooting from PHD2's manual. Intended for imaging setups with guiding equipment; device-specific connection requirements still apply.",
    "topics": [
      "photography",
      "equipment",
      "learning"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "lonely-speck-101",
    "name": "Astrophotography 101",
    "provider": "Lonely Speck",
    "url": "https://www.lonelyspeck.com/astrophotography-101/",
    "description": "Follow a free lesson collection covering Milky Way capture, lenses, focusing, stacking and processing. Several lessons reflect older equipment or software, and some listed topics remain unfinished.",
    "topics": [
      "photography",
      "equipment",
      "learning"
    ],
    "format": "learning",
    "costLabel": "Free",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "stellafane-beginners",
    "name": "Stellafane Beginner Resources",
    "provider": "Springfield Telescope Makers",
    "url": "https://stellafane.org/misc/beginners/index.html",
    "description": "Build observing habits before choosing equipment, with beginner articles on learning the sky, binoculars and a first telescope. This is a starting guide with some older external references.",
    "topics": [
      "equipment",
      "stargazing",
      "learning"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "astap",
    "name": "ASTAP",
    "provider": "Han Kleijn",
    "url": "https://www.hnsky.org/astap.htm",
    "description": "Stack deep-sky images, inspect FITS files and solve image coordinates with ASTAP. Its official page includes a detailed manual; plate solving requires installing an appropriate star database.",
    "topics": [
      "photography",
      "equipment"
    ],
    "format": "tools",
    "costLabel": "Free",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "autostakkert",
    "name": "AutoStakkert!",
    "provider": "Emil Kraaikamp",
    "url": "https://www.autostakkert.com/wp/guides/",
    "description": "Align and stack lunar and planetary image sequences using lucky-imaging software and its official guides. Windows software; additional sharpening is needed, and commercial use requires a purchased license.",
    "topics": [
      "photography",
      "equipment"
    ],
    "format": "tools",
    "costLabel": "Free & paid",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "firecapture",
    "name": "FireCapture",
    "provider": "Torsten Edelmann",
    "url": "https://www.firecapture.de/",
    "description": "Capture planetary video with camera profiles, automated recording and session logs, supported by installation and first-step tutorials. Check the official camera and operating-system compatibility table before installing.",
    "topics": [
      "photography",
      "equipment"
    ],
    "format": "tools",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "starstax",
    "name": "StarStaX",
    "provider": "Markus Enzweiler",
    "url": "https://markus-enzweiler.de/software/StarStaX/",
    "description": "Blend a sequence of night photographs into star trails, with gap filling and an official tutorial. Available for Windows and macOS; develop RAW files elsewhere before importing.",
    "topics": [
      "photography"
    ],
    "format": "tools",
    "costLabel": "Free",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "nasa-meteors-meteorites",
    "name": "Meteors and Meteorites",
    "provider": "NASA",
    "url": "https://science.nasa.gov/solar-system/meteors-meteorites/",
    "description": "Understand how meteoroids, meteors, and meteorites differ, explore their origins, and follow links to meteor science and observing information. This is background learning rather than a local forecast.",
    "topics": [
      "learning",
      "stargazing",
      "events"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "darksky-lighting-principles",
    "name": "Five Principles for Responsible Outdoor Lighting",
    "provider": "DarkSky International & IES",
    "url": "https://darksky.org/resources/guides-and-how-tos/lighting-principles/",
    "description": "Learn how to direct, control, and reduce outdoor lighting, with downloadable materials for explaining the principles to others. Translations include Bengali; local lighting requirements still need separate checking.",
    "topics": [
      "conservation",
      "learning"
    ],
    "format": "guides",
    "costLabel": "Free",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "openlearn-galaxies-stars-planets",
    "name": "Galaxies, Stars and Planets",
    "provider": "The Open University, OpenLearn",
    "url": "https://www.open.edu/openlearn/science-maths-technology/galaxies-stars-and-planets/",
    "description": "Follow an introductory course on cosmic scale, gravity, the Solar System, stars, and galaxies. Reading can start immediately; an account enables progress tracking, quizzes, and a participation statement.",
    "topics": [
      "learning"
    ],
    "format": "learning",
    "costLabel": "Free",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "mit-general-relativity",
    "name": "General Relativity Video Lectures",
    "provider": "MIT OpenCourseWare",
    "url": "https://ocw.mit.edu/courses/8-962-general-relativity-spring-2020/video_galleries/video-lectures/",
    "description": "Watch graduate lectures on tensors, spacetime curvature, gravitational waves, cosmology, and black holes, supported by course problem sets. This advanced course requires substantial mathematics and physics preparation.",
    "topics": [
      "learning",
      "research"
    ],
    "format": "learning",
    "costLabel": "Free",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "iau-astroedu",
    "name": "astroEDU",
    "provider": "International Astronomical Union",
    "url": "https://astroedu.iau.org/",
    "description": "Find peer-reviewed astronomy activities for classrooms and outreach, with age ranges and practical teaching instructions. Review each activity’s materials, timing, and language before adapting it for your group.",
    "topics": [
      "learning"
    ],
    "format": "learning",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "asi-outreach",
    "name": "Astronomical Society of India Outreach",
    "provider": "Astronomical Society of India",
    "url": "https://astron-soc.in/outreach/",
    "description": "Explore astronomy activities, public education resources, and outreach initiatives connected to India’s professional astronomy community. Many pages archive past campaigns, so verify dates before treating an announcement as current.",
    "topics": [
      "learning",
      "events",
      "stargazing"
    ],
    "format": "communities",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "aavso-getting-started",
    "name": "Getting Started with Variable Star Observing",
    "provider": "American Association of Variable Star Observers",
    "url": "https://aavso.org/getting-started/",
    "description": "Learn to observe variable stars and contribute measurements to scientific archives, with guidance on techniques, targets, and equipment. A free account supports data submission; some additional services require membership.",
    "topics": [
      "research",
      "stargazing",
      "learning",
      "equipment"
    ],
    "format": "communities",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "planet-hunters-tess",
    "name": "Planet Hunters TESS",
    "provider": "Planet Hunters TESS, Zooniverse",
    "url": "https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess",
    "description": "Help search TESS observations for signs of planets beyond the Solar System, using guided online classifications and discussions. Candidate signals need scientific follow-up before they can establish a planet discovery.",
    "topics": [
      "research",
      "learning"
    ],
    "format": "communities",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "daily-minor-planet",
    "name": "The Daily Minor Planet",
    "provider": "Catalina Sky Survey, Zooniverse",
    "url": "https://www.zooniverse.org/projects/fulsdavid/the-daily-minor-planet",
    "description": "Review Catalina Sky Survey image sequences to help distinguish possible asteroids from false detections. Follow the project’s instructions for contribution credit; reviewing a candidate does not guarantee a new discovery.",
    "topics": [
      "research",
      "learning"
    ],
    "format": "communities",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "astronomical-league-programs",
    "name": "Astronomical League Observing Programs",
    "provider": "Astronomical League",
    "url": "https://www.astroleague.org/observing-program-division/",
    "description": "Build observing skills with structured target lists, log guidance, and programs for different objects and instruments. Read each program’s rules carefully, especially membership and award requirements.",
    "topics": [
      "stargazing",
      "learning",
      "equipment"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "british-astronomical-association",
    "name": "British Astronomical Association",
    "provider": "British Astronomical Association",
    "url": "https://britastro.org/join",
    "description": "Join an international amateur astronomy community with observing sections, expert advice, publications, talks, and challenges for several experience levels. Membership is paid; many in-person activities take place in Britain.",
    "topics": [
      "stargazing",
      "research",
      "learning",
      "events"
    ],
    "format": "communities",
    "costLabel": "Paid",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "darksky-home-assessment",
    "name": "Home Outdoor Lighting Assessment",
    "provider": "DarkSky International",
    "url": "https://darksky.org/get-involved/home-lighting-assessment/",
    "description": "Use a worksheet to assess outdoor lights at home, identify fixtures needing changes, and plan improvements using responsible lighting principles. The assessment is practical guidance rather than a professional audit.",
    "topics": [
      "conservation"
    ],
    "format": "guides",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "iau-education-resources",
    "name": "Astronomy Education Resources",
    "provider": "IAU Office of Astronomy for Education",
    "url": "https://astro4edu.org/resources/",
    "description": "Browse multilingual astronomy teaching resources, a terminology glossary, education guides, and light pollution or eclipse collections. Language coverage differs between collections, so check the linked resource before planning lessons.",
    "topics": [
      "learning",
      "conservation",
      "events"
    ],
    "format": "learning",
    "reviewedAt": "2026-10-18"
  },
  {
    "id": "simbad",
    "name": "SIMBAD Astronomical Database",
    "provider": "CDS, Strasbourg",
    "url": "https://simbad.cds.unistra.fr/simbad/",
    "description": "Look up astronomical objects by name or coordinates, with identifiers, measurements and references to published research. Covers objects outside the Solar System; consult the original studies when interpreting data.",
    "topics": [
      "research"
    ],
    "format": "tools",
    "costLabel": "Free",
    "reviewedAt": "2026-10-18"
  }
];
