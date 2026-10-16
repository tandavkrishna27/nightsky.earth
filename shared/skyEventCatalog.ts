import type { SkyEvent, CoverageMonth } from "./skyEvents";
export const skyEvents: readonly SkyEvent[] = [
  {
    id: "last-quarter-moon-2026-10-03",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2026-10-03T13:25:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2026-10-03 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "saturn-at-opposition-2026-10-04",
    title: "Saturn at opposition",
    category: "planets",
    synopsis:
      "A planetary opposition: an alignment to explore, rather than a single appointment for observing.",
    timing: {
      kind: "approximate",
      startDate: "2026-10-04",
      endDateInclusive: "2026-10-04",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "At opposition, an outer planet lies opposite the Sun in Earth’s sky. The surrounding nights can be worth exploring; the alignment does not guarantee local conditions.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Saturn",
        body: "A telescope can reveal Saturn as more than a point of light. Check seeing conditions, altitude and a suitable magnification; the calendar does not promise a particular ring appearance.",
      },
    ],
    question:
      "Help me understand saturn at opposition around 2026-10-04 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mars-and-the-moon-occultation-opportunity-2026-10-05",
    title: "Mars and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Mars depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2026-10-05T05:30:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Mars 1.2° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Mars and the Moon — occultation opportunity around 2026-10-05 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-and-the-moon-occultation-opportunity-2026-10-06",
    title: "Jupiter and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Jupiter depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2026-10-06T10:18:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Jupiter 0.2° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Jupiter and the Moon — occultation opportunity around 2026-10-06 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "regulus-and-the-moon-2026-10-07",
    title: "Regulus and the Moon",
    category: "pairings",
    synopsis:
      "Regulus and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-10-07T02:57:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Regulus 0.6° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Regulus and the Moon around 2026-10-07 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "october-draconid-meteor-shower-2026-10-09",
    title: "October Draconid meteor shower",
    category: "meteor-showers",
    synopsis:
      "Slow-moving meteors and a northerly radiant distinguish the October Draconids.",
    timing: {
      kind: "approximate",
      startDate: "2026-10-09",
      endDateInclusive: "2026-10-09",
      basis: "source-calendar",
      basisLabel: "IMO predicted date (UT source; approximate)",
      label: "Reference peak around",
      sourceId: "imo",
    },
    visibility:
      "Northern observers are favored. A high northern radiant can make evening observing relevant, unlike a blanket rule that every shower needs a pre-dawn watch.",
    equipment:
      "Unaided eyes and a wide dark view. A stable camera support helps with a photographic record; no telescope is needed for a broad meteor watch.",
    sections: [
      {
        heading: "What makes this shower different",
        body: "Slow-moving meteors and a northerly radiant distinguish the October Draconids. Some past returns produced outbursts, but that history is not a forecast for this return.",
      },
      {
        heading: "Understand the peak reference",
        body: "The IMO 2026 calendar’s indexed primary extract predicts October 9 around 01h UT. This guide preserves October 9 as an approximate reference rather than treating an hour-level prediction as a precise UTC observing appointment.",
      },
      {
        heading: "Activity reference",
        body: "The indexed IMO 2026 calendar extract gives October 6–10 as the activity reference and October 9 as the predicted maximum date. These are predicted reference dates; an outburst or a particular meteor count is not guaranteed.",
      },
      {
        heading: "Moon and sky conditions",
        body: "New Moon is on October 10, near this reference date. Check local darkness and actual moonrise/moonset before observing.",
      },
      {
        heading: "Prepare to observe",
        body: "Northern observers are favored. A high northern radiant can make evening observing relevant, unlike a blanket rule that every shower needs a pre-dawn watch. Check darkness, forecast and legal access, settle comfortably, and watch a broad area. A fireball or outburst is never guaranteed.",
      },
    ],
    question:
      "Help me explore October Draconid meteor shower near 2026-10-09 for my chosen location.",
    sources: [
      {
        id: "imo",
        title: "IMO — 2026 Meteor Shower Calendar, Draconids section",
        url: "https://imo.net/files/meteor-shower/cal2026.pdf",
        sourceTimeScale: "UT; approximate date retained",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2026-10-10",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2026-10-10T15:50:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2026-10-10 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-greatest-elongation-2026-10-12",
    title: "Mercury at greatest elongation",
    category: "planets",
    synopsis:
      "A planetary elongation: a starting point for exploring its separation from the Sun and local observing conditions.",
    timing: {
      kind: "approximate",
      startDate: "2026-10-12",
      endDateInclusive: "2026-10-12",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "Greatest elongation describes a planet’s greatest apparent separation from the Sun in that part of its orbit. Horizon and twilight conditions still shape what an observer can see.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Mercury",
        body: "This reference is a eastern elongation, generally associated with the evening sky. Angular separation from the Sun is not altitude above your horizon. Check twilight and the ecliptic angle for your latitude before trying to observe.",
      },
    ],
    question:
      "Help me understand mercury at greatest elongation around 2026-10-12 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2026-10-14",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-10-14T20:25:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.4° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2026-10-14 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2026-10-18",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2026-10-18T16:13:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2026-10-18 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "orionid-meteor-shower-2026-10-21",
    title: "Orionid meteor shower",
    category: "meteor-showers",
    synopsis:
      "Halley’s comet supplies the debris that produces this shower; the apparent radiant lies in Orion.",
    timing: {
      kind: "approximate",
      startDate: "2026-10-21",
      endDateInclusive: "2026-10-22",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "Both hemispheres can observe the shower when Orion is suitably placed, generally after midnight.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "Halley’s comet supplies the debris that produces this shower; the apparent radiant lies in Orion. Fast meteors can leave persistent trains.",
      },
      {
        heading: "Peak nights and source precision",
        body: "The AMS observing-night range is the planning reference here. It is not a UTC interval: changing the display time zone does not shift these date labels. Choose your local observing night after checking darkness and radiant altitude.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Oct 2–Nov 7, 2026. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "The peak falls between first quarter on October 18 and full Moon on October 26. Moonlight can obscure faint meteors; check local moonset before choosing a darker interval.",
      },
      {
        heading: "Where and when to look",
        body: "Both hemispheres can observe the shower when Orion is suitably placed, generally after midnight.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Orionid meteor shower around 2026-10-21 to 2026-10-22 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
      {
        id: "shower-background",
        title: "NASA — Orionid meteor shower",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/orionids/",
        sourceTimeScale: "Not applicable; shower explanation",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "venus-at-inferior-conjunction-2026-10-24",
    title: "Venus at inferior conjunction",
    category: "planets",
    synopsis:
      "Venus reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2026-10-24",
      endDateInclusive: "2026-10-24",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Venus passes between Earth and the Sun in its orbital cycle. Most inferior conjunctions are not transits across the solar disc.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Venus at inferior conjunction around 2026-10-24 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2026-10-26",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2026-10-26T04:12:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2026-10-26 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "pleiades-and-the-moon-2026-10-28",
    title: "Pleiades and the Moon",
    category: "pairings",
    synopsis:
      "Pleiades and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-10-28T01:11:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Pleiades 1.0° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Pleiades and the Moon around 2026-10-28 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2026-11-01",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-01T20:28:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2026-11-01 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mars-and-the-moon-occultation-opportunity-2026-11-02",
    title: "Mars and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Mars depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-02T14:23:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Mars 1.1° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Mars and the Moon — occultation opportunity around 2026-11-02 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-and-the-moon-occultation-opportunity-2026-11-02",
    title: "Jupiter and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Jupiter depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-02T23:11:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Jupiter 0.5° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Jupiter and the Moon — occultation opportunity around 2026-11-02 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "regulus-and-the-moon-2026-11-03",
    title: "Regulus and the Moon",
    category: "pairings",
    synopsis:
      "Regulus and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-03T08:40:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Regulus 0.8° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Regulus and the Moon around 2026-11-03 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-inferior-conjunction-2026-11-04",
    title: "Mercury at inferior conjunction",
    category: "planets",
    synopsis:
      "Mercury reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-04",
      endDateInclusive: "2026-11-04",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Mercury passes between Earth and the Sun in its orbital cycle. Most inferior conjunctions are not transits across the solar disc.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Mercury at inferior conjunction around 2026-11-04 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "southern-taurid-meteor-shower-2026-11-05",
    title: "Southern Taurid meteor shower",
    category: "meteor-showers",
    synopsis:
      "This long, broad shower is notable for occasional bright meteors rather than a dense, brief burst.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-04",
      endDateInclusive: "2026-11-05",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "Check Taurus and your dark-sky horizon rather than treating this broad maximum as a single timed event.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "This long, broad shower is notable for occasional bright meteors rather than a dense, brief burst. The southern and northern Taurid branches overlap during part of the season.",
      },
      {
        heading: "Peak nights and source precision",
        body: "The AMS observing-night range is the planning reference here. It is not a UTC interval: changing the display time zone does not shift these date labels. Choose your local observing night after checking darkness and radiant altitude.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Sep 20–Nov 20, 2026. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "The reference peak approaches new Moon on November 9. Check the waning Moon’s local rise time when choosing a darker period.",
      },
      {
        heading: "Where and when to look",
        body: "Check Taurus and your dark-sky horizon rather than treating this broad maximum as a single timed event.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Southern Taurid meteor shower around 2026-11-04 to 2026-11-05 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "venus-and-the-moon-occultation-opportunity-2026-11-07",
    title: "Venus and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Venus depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-07T11:31:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Venus 1.1° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Venus and the Moon — occultation opportunity around 2026-11-07 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2026-11-09",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-09T07:02:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2026-11-09 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "venus-and-spica-2026-11-10",
    title: "Venus and Spica",
    category: "pairings",
    synopsis:
      "Venus and Spica share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-10T13:49:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Venus 0.1° south of Spica at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Venus and Spica around 2026-11-10 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "northern-taurid-meteor-shower-2026-11-12",
    title: "Northern Taurid meteor shower",
    category: "meteor-showers",
    synopsis: "The northern branch overlaps the southern Taurids.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-11",
      endDateInclusive: "2026-11-12",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "A broad view of the night sky and a suitable radiant altitude matter more than staring directly at Taurus.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "The northern branch overlaps the southern Taurids. Distinguish the branch names when checking predictions and do not infer that a fireball is guaranteed.",
      },
      {
        heading: "Peak nights and source precision",
        body: "The AMS observing-night range is the planning reference here. It is not a UTC interval: changing the display time zone does not shift these date labels. Choose your local observing night after checking darkness and radiant altitude.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Oct 20–Dec 10, 2026. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "New Moon occurs on November 9, before this reference peak. A young evening crescent may set relatively early; verify local moonset.",
      },
      {
        heading: "Where and when to look",
        body: "A broad view of the night sky and a suitable radiant altitude matter more than staring directly at Taurus.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Northern Taurid meteor shower around 2026-11-11 to 2026-11-12 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2026-11-11",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-11T03:58:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.3° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2026-11-11 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "leonid-meteor-shower-2026-11-18",
    title: "Leonid meteor shower",
    category: "meteor-showers",
    synopsis:
      "The Leonids arise from material associated with comet 55P/Tempel-Tuttle and appear to radiate from Leo.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-16",
      endDateInclusive: "2026-11-17",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "Look for a suitable radiant altitude after midnight. A wide dark view is more useful than aiming only at Leo.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "The Leonids arise from material associated with comet 55P/Tempel-Tuttle and appear to radiate from Leo. Their historical storms do not imply a storm for this return.",
      },
      {
        heading: "Peak nights and source precision",
        body: "AMS and NASA list November 16–17 for observing, while the coarse annual almanac lists November 18. The specialist observing-night range takes precedence here; no precise UTC maximum is asserted.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Nov 6–30, 2026. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "First quarter occurs on November 17. Check whether the Moon has set by your intended pre-dawn observing period.",
      },
      {
        heading: "Where and when to look",
        body: "Look for a suitable radiant altitude after midnight. A wide dark view is more useful than aiming only at Leo.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Leonid meteor shower around 2026-11-16 to 2026-11-17 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
      {
        id: "shower-background",
        title: "NASA — Leonid meteor shower",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/leonids/",
        sourceTimeScale: "Not applicable; shower explanation",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mars-and-jupiter-2026-11-16",
    title: "Mars and Jupiter",
    category: "pairings",
    synopsis:
      "Mars and Jupiter share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-16",
      endDateInclusive: "2026-11-16",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Geocentric almanac reference (not local contacts) (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Mars 1.2° north of Jupiter at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Mars and Jupiter around 2026-11-16 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2026-11-17",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-17T11:48:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2026-11-17 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-greatest-elongation-2026-11-20",
    title: "Mercury at greatest elongation",
    category: "planets",
    synopsis:
      "A planetary elongation: a starting point for exploring its separation from the Sun and local observing conditions.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-20",
      endDateInclusive: "2026-11-20",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "Greatest elongation describes a planet’s greatest apparent separation from the Sun in that part of its orbit. Horizon and twilight conditions still shape what an observer can see.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Mercury",
        body: "This reference is a western elongation, generally associated with the morning sky. Angular separation from the Sun is not altitude above your horizon. Check twilight and the ecliptic angle for your latitude before trying to observe.",
      },
    ],
    question:
      "Help me understand mercury at greatest elongation around 2026-11-20 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "pleiades-and-the-moon-2026-11-24",
    title: "Pleiades and the Moon",
    category: "pairings",
    synopsis:
      "Pleiades and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-24T11:18:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Pleiades 0.9° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Pleiades and the Moon around 2026-11-24 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2026-11-24",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-24T14:53:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2026-11-24 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "uranus-at-opposition-2026-11-25",
    title: "Uranus at opposition",
    category: "planets",
    synopsis:
      "A planetary opposition: an alignment to explore, rather than a single appointment for observing.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-25",
      endDateInclusive: "2026-11-25",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Optical equipment and an accurate finder chart are needed; check suitable local guidance.",
    sections: [
      {
        heading: "What happens",
        body: "At opposition, an outer planet lies opposite the Sun in Earth’s sky. The surrounding nights can be worth exploring; the alignment does not guarantee local conditions.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Uranus",
        body: "Use a current finder chart and appropriate optical equipment. These faint outer planets require careful identification; a photograph of a field is not by itself confirmation of the planet.",
      },
    ],
    question:
      "Help me understand uranus at opposition around 2026-11-25 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mars-and-regulus-2026-11-25",
    title: "Mars and Regulus",
    category: "pairings",
    synopsis:
      "Mars and Regulus share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-25T07:47:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Mars 1.6° north of Regulus at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Mars and Regulus around 2026-11-25 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-and-the-moon-occultation-opportunity-2026-11-30",
    title: "Jupiter and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Jupiter depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2026-11-30T09:18:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Jupiter 1.2° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Jupiter and the Moon — occultation opportunity around 2026-11-30 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2026-12-01",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2026-12-01T06:09:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2026-12-01 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2026-12-09",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2026-12-09T00:52:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2026-12-09 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-and-regulus-2026-12-12",
    title: "Jupiter and Regulus",
    category: "pairings",
    synopsis:
      "Jupiter and Regulus share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-12-12T15:35:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Jupiter 1.3° north of Regulus at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Jupiter and Regulus around 2026-12-12 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "geminid-meteor-shower-2026-12-14",
    title: "Geminid meteor shower",
    category: "meteor-showers",
    synopsis:
      "The Geminids are associated with asteroid 3200 Phaethon rather than a conventional active comet.",
    timing: {
      kind: "approximate",
      startDate: "2026-12-13",
      endDateInclusive: "2026-12-14",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "The radiant can be well placed before midnight at northern latitudes; southern observers should check their later-night altitude.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "The Geminids are associated with asteroid 3200 Phaethon rather than a conventional active comet. The radiant is in Gemini, and bright meteors can make the shower rewarding.",
      },
      {
        heading: "Peak nights and source precision",
        body: "The AMS observing-night range is the planning reference here. It is not a UTC interval: changing the display time zone does not shift these date labels. Choose your local observing night after checking darkness and radiant altitude.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Dec 4–17, 2026. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "The reference nights fall after new Moon on December 9 and before first quarter on December 17. Check when the waxing Moon leaves your local sky.",
      },
      {
        heading: "Where and when to look",
        body: "The radiant can be well placed before midnight at northern latitudes; southern observers should check their later-night altitude.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Geminid meteor shower around 2026-12-13 to 2026-12-14 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
      {
        id: "shower-background",
        title: "NASA — Geminid meteor shower",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/geminids/",
        sourceTimeScale: "Not applicable; shower explanation",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2026-12-17",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2026-12-17T05:43:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2026-12-17 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "ursid-meteor-shower-2026-12-22",
    title: "Ursid meteor shower",
    category: "meteor-showers",
    synopsis:
      "The Ursids are a northern-sky shower associated with comet 8P/Tuttle.",
    timing: {
      kind: "approximate",
      startDate: "2026-12-21",
      endDateInclusive: "2026-12-22",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "The high northern radiant makes this principally a Northern Hemisphere opportunity. Southern locations may not have a useful radiant altitude.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "The Ursids are a northern-sky shower associated with comet 8P/Tuttle. Their modest usual activity makes darkness and patience especially relevant.",
      },
      {
        heading: "Peak nights and source precision",
        body: "The AMS observing-night range is the planning reference here. It is not a UTC interval: changing the display time zone does not shift these date labels. Choose your local observing night after checking darkness and radiant altitude.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Dec 17–26, 2026. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "Full Moon falls on December 24, close to the peak nights. Bright moonlight may limit faint-meteor viewing.",
      },
      {
        heading: "Where and when to look",
        body: "The high northern radiant makes this principally a Northern Hemisphere opportunity. Southern locations may not have a useful radiant altitude.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Ursid meteor shower around 2026-12-21 to 2026-12-22 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "december-solstice-2026-12-21",
    title: "December solstice",
    category: "seasons",
    synopsis:
      "December’s seasonal turning point: northern winter and southern summer.",
    timing: {
      kind: "instant",
      atUtc: "2026-12-21T20:50:00Z",
      label: "Seasonal turning-point instant",
      sourceId: "almanac",
    },
    visibility:
      "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
    equipment:
      "No astronomical equipment is needed. A notebook or a fixed photo composition can help compare daylight and shadow through the year.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "At the December solstice, the Northern Hemisphere is tilted away from the Sun and the Southern Hemisphere towards it. This marks opposite astronomical seasons; it is not a promise of the coldest or hottest day.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
      },
      {
        heading: "Prepare to explore",
        body: "Use this as a reference for comparing local sunrise, sunset, daylight or shadow length over time. Never point optical equipment at the Sun without appropriate solar-viewing protection. Local weather and seasonal climate do not change at a single instant.",
      },
    ],
    question:
      "Help me understand December solstice around 2026-12-21 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Earth facts",
        url: "https://science.nasa.gov/earth/facts/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "pleiades-and-the-moon-2026-12-21",
    title: "Pleiades and the Moon",
    category: "pairings",
    synopsis:
      "Pleiades and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2026-12-21T22:37:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Pleiades 1.0° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Pleiades and the Moon around 2026-12-21 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2026-12-24",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2026-12-24T01:28:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2026-12-24 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2026-12-30",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2026-12-30T18:59:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2026-12-30 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2026 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2026gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-superior-conjunction-2027-01-01",
    title: "Mercury at superior conjunction",
    category: "planets",
    synopsis:
      "Mercury reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-01-01",
      endDateInclusive: "2027-01-01",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Mercury passes on the far side of the Sun from Earth in its orbital cycle. Solar glare generally prevents ordinary observing near this alignment.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Mercury at superior conjunction around 2027-01-01 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "earth-at-perihelion-2027-01-03",
    title: "Earth at perihelion",
    category: "seasons",
    synopsis:
      "Earth reaches its nearest point to the Sun in this yearly orbit.",
    timing: {
      kind: "approximate",
      startDate: "2027-01-03",
      endDateInclusive: "2027-01-03",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Orbital milestone around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
    equipment:
      "No astronomical equipment is needed. A notebook or a fixed photo composition can help compare daylight and shadow through the year.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Earth follows a slightly elliptical orbit. Perihelion is the nearest point to the Sun. Axial tilt, rather than this distance change, drives the opposite seasons in the two hemispheres.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
      },
      {
        heading: "Prepare to explore",
        body: "Use this as a reference for comparing local sunrise, sunset, daylight or shadow length over time. Never point optical equipment at the Sun without appropriate solar-viewing protection. Local weather and seasonal climate do not change at a single instant.",
      },
    ],
    question:
      "Help me understand Earth at perihelion around 2027-01-03 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Earth facts",
        url: "https://science.nasa.gov/earth/facts/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "quadrantid-meteor-shower-2027-01-04",
    title: "Quadrantid meteor shower",
    category: "meteor-showers",
    synopsis: "A comparatively narrow maximum distinguishes the Quadrantids.",
    timing: {
      kind: "approximate",
      startDate: "2027-01-03",
      endDateInclusive: "2027-01-04",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "Northern latitudes are favored; timing and radiant altitude matter because the peak can be brief.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "A comparatively narrow maximum distinguishes the Quadrantids. The radiant lies in the area once called Quadrans Muralis, and the shower is linked with object 2003 EH1.",
      },
      {
        heading: "Peak nights and source precision",
        body: "The AMS observing-night range is the planning reference here. It is not a UTC interval: changing the display time zone does not shift these date labels. Choose your local observing night after checking darkness and radiant altitude.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Dec 28, 2026–Jan 12, 2027. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "New Moon is on January 7, after the reference nights. The waning crescent generally offers less interference than a full Moon, but check its local rise time.",
      },
      {
        heading: "Where and when to look",
        body: "Northern latitudes are favored; timing and radiant altitude matter because the peak can be brief.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Quadrantid meteor shower around 2027-01-03 to 2027-01-04 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
      {
        id: "shower-background",
        title: "NASA — Quadrantid meteor shower",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/quadrantids/",
        sourceTimeScale: "Not applicable; shower explanation",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "venus-at-greatest-elongation-2027-01-03",
    title: "Venus at greatest elongation",
    category: "planets",
    synopsis:
      "A planetary elongation: a starting point for exploring its separation from the Sun and local observing conditions.",
    timing: {
      kind: "approximate",
      startDate: "2027-01-03",
      endDateInclusive: "2027-01-03",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "Greatest elongation describes a planet’s greatest apparent separation from the Sun in that part of its orbit. Horizon and twilight conditions still shape what an observer can see.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Venus",
        body: "This reference is a western elongation, generally associated with the morning sky. Angular separation from the Sun is not altitude above your horizon. Check twilight and the ecliptic angle for your latitude before trying to observe.",
      },
    ],
    question:
      "Help me understand venus at greatest elongation around 2027-01-03 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-01-04",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-01-04T16:34:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.3° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-01-04 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-01-07",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-01-07T20:24:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-01-07 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2027-01-15",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2027-01-15T20:34:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2027-01-15 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2027-01-22",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2027-01-22T12:17:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2027-01-22 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2027-01-29",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2027-01-29T10:55:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2027-01-29 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-01-31",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-01-31T22:48:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.4° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-01-31 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-greatest-elongation-2027-02-03",
    title: "Mercury at greatest elongation",
    category: "planets",
    synopsis:
      "A planetary elongation: a starting point for exploring its separation from the Sun and local observing conditions.",
    timing: {
      kind: "approximate",
      startDate: "2027-02-03",
      endDateInclusive: "2027-02-03",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "Greatest elongation describes a planet’s greatest apparent separation from the Sun in that part of its orbit. Horizon and twilight conditions still shape what an observer can see.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Mercury",
        body: "This reference is a eastern elongation, generally associated with the evening sky. Angular separation from the Sun is not altitude above your horizon. Check twilight and the ecliptic angle for your latitude before trying to observe.",
      },
    ],
    question:
      "Help me understand mercury at greatest elongation around 2027-02-03 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-02-06",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-02-06T15:56:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-02-06 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "annular-solar-eclipse-2027-02-06",
    title: "Annular Solar Eclipse",
    category: "eclipses",
    synopsis:
      "A solar eclipse with a limited geographic path. Local circumstances are essential before making plans.",
    timing: {
      kind: "instant",
      atUtc: "2027-02-06T16:00:00Z",
      label: "Global eclipse maximum (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Annularity follows a narrow path through Chile, Argentina and the Atlantic; partial phases extend across parts of South America, Antarctica and western/southern Africa.",
    equipment:
      "Proper solar-viewing protection is essential. Follow NASA’s eclipse safety guidance before any observation.",
    sections: [
      {
        heading: "What happens",
        body: "During an annular eclipse, the Moon does not cover the entire solar disc along the central path. A ring of sunlight remains.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global maximum from the UTC almanac, rounded to its published minute. NASA’s decade table uses TD, so its clock values are not substituted for UTC. Local contact times need a location-specific source.",
      },
      {
        heading: "Prepare for your night",
        body: "Never view partial or annular solar-eclipse phases without suitable solar-viewing protection. Ordinary sunglasses are not adequate. Optical equipment needs appropriate front-mounted solar filters; follow the linked NASA instructions.",
      },
      {
        heading: "What would make a useful plan",
        body: "First establish whether your site lies in the central path or only the partial-eclipse region. Then obtain local contact times, assess the horizon and forecast, and prepare suitable solar protection. A global maximum converted to your clock does not answer those local questions.",
      },
    ],
    question:
      "Help me understand annular solar eclipse around 2027-02-06 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Eclipse viewing safety",
        url: "https://science.nasa.gov/eclipses/safety/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "visibility",
        title: "NASA GSFC — eclipse dates and geographic visibility",
        url: "https://eclipse.gsfc.nasa.gov/SEdecade/SEdecade2021.html",
        sourceTimeScale:
          "TD (geography/date cross-check only; time from UTC almanac)",
      },
      {
        id: "annual-eclipse-review",
        title: "NASA — Eclipses During 2027",
        url: "https://eclipse.gsfc.nasa.gov/OH/OH2027.html",
        sourceTimeScale:
          "Mixed source scales; context only, UTC time remains from almanac",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-and-the-moon-occultation-opportunity-2027-02-08",
    title: "Mercury and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Mercury depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2027-02-08T03:36:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Mercury 0.4° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Mercury and the Moon — occultation opportunity around 2027-02-08 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-at-opposition-2027-02-11",
    title: "Jupiter at opposition",
    category: "planets",
    synopsis:
      "A planetary opposition: an alignment to explore, rather than a single appointment for observing.",
    timing: {
      kind: "approximate",
      startDate: "2027-02-11",
      endDateInclusive: "2027-02-11",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "At opposition, an outer planet lies opposite the Sun in Earth’s sky. The surrounding nights can be worth exploring; the alignment does not guarantee local conditions.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Jupiter",
        body: "A telescope can support a study of the cloud bands or the changing arrangement of its bright moons. A local ephemeris is needed for specific moon events, transits and visibility.",
      },
    ],
    question:
      "Help me understand jupiter at opposition around 2027-02-11 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2027-02-14",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2027-02-14T07:58:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2027-02-14 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-inferior-conjunction-2027-02-18",
    title: "Mercury at inferior conjunction",
    category: "planets",
    synopsis:
      "Mercury reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-02-18",
      endDateInclusive: "2027-02-18",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Mercury passes between Earth and the Sun in its orbital cycle. Most inferior conjunctions are not transits across the solar disc.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Mercury at inferior conjunction around 2027-02-18 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mars-at-opposition-2027-02-19",
    title: "Mars at opposition",
    category: "planets",
    synopsis:
      "A planetary opposition: an alignment to explore, rather than a single appointment for observing.",
    timing: {
      kind: "approximate",
      startDate: "2027-02-19",
      endDateInclusive: "2027-02-19",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "At opposition, an outer planet lies opposite the Sun in Earth’s sky. The surrounding nights can be worth exploring; the alignment does not guarantee local conditions.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Mars",
        body: "A telescope may help explore the planetary disc, with results strongly dependent on seeing, altitude and equipment. Opposition is a useful reference rather than a promise of visible surface detail.",
      },
    ],
    question:
      "Help me understand mars at opposition around 2027-02-19 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-and-the-moon-occultation-opportunity-2027-02-20",
    title: "Jupiter and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Jupiter depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2027-02-20T05:46:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Jupiter 1.2° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Jupiter and the Moon — occultation opportunity around 2027-02-20 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "penumbral-lunar-eclipse-2027-02-20",
    title: "Penumbral Lunar Eclipse",
    category: "eclipses",
    synopsis:
      "A penumbral lunar eclipse, where subtle shading may affect the Moon rather than a dramatic dark bite.",
    timing: {
      kind: "instant",
      atUtc: "2027-02-20T23:13:00Z",
      label: "Global eclipse maximum (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Some phases are visible across parts of the Americas, Europe, Africa and Asia; the Moon must be above your horizon.",
    equipment:
      "Unaided eyes or binoculars, where the Moon is above the horizon. Penumbral shading can be difficult to notice.",
    sections: [
      {
        heading: "What happens",
        body: "A penumbral lunar eclipse occurs when the Moon passes through Earth’s outer shadow. The depth of the encounter determines how noticeable the shading may be.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global maximum from the UTC almanac, rounded to its published minute. NASA’s decade table uses TD, so its clock values are not substituted for UTC. Local contact times need a location-specific source.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "What would make a useful plan",
        body: "Check whether the Moon is above your horizon during the eclipse and which phases occur after local darkness begins. A penumbral event can be subtle; a careful before/during comparison is more meaningful than expecting the appearance of a total lunar eclipse.",
      },
    ],
    question:
      "Help me understand penumbral lunar eclipse around 2027-02-20 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "visibility",
        title: "NASA GSFC — eclipse dates and geographic visibility",
        url: "https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html",
        sourceTimeScale:
          "TD (geography/date cross-check only; time from UTC almanac)",
      },
      {
        id: "annual-eclipse-review",
        title: "NASA — Eclipses During 2027",
        url: "https://eclipse.gsfc.nasa.gov/OH/OH2027.html",
        sourceTimeScale:
          "Mixed source scales; context only, UTC time remains from almanac",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2027-02-20",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2027-02-20T23:23:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2027-02-20 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2027-02-28",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2027-02-28T05:16:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2027-02-28 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-02-28",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-02-28T06:09:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.4° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-02-28 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-03-08",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-03-08T09:29:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-03-08 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2027-03-15",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2027-03-15T16:25:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2027-03-15 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-greatest-elongation-2027-03-17",
    title: "Mercury at greatest elongation",
    category: "planets",
    synopsis:
      "A planetary elongation: a starting point for exploring its separation from the Sun and local observing conditions.",
    timing: {
      kind: "approximate",
      startDate: "2027-03-17",
      endDateInclusive: "2027-03-17",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "Greatest elongation describes a planet’s greatest apparent separation from the Sun in that part of its orbit. Horizon and twilight conditions still shape what an observer can see.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Mercury",
        body: "This reference is a western elongation, generally associated with the morning sky. Angular separation from the Sun is not altitude above your horizon. Check twilight and the ecliptic angle for your latitude before trying to observe.",
      },
    ],
    question:
      "Help me understand mercury at greatest elongation around 2027-03-17 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-and-the-moon-occultation-opportunity-2027-03-19",
    title: "Jupiter and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Jupiter depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2027-03-19T10:05:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Jupiter 0.9° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Jupiter and the Moon — occultation opportunity around 2027-03-19 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "march-equinox-2027-03-20",
    title: "March equinox",
    category: "seasons",
    synopsis:
      "A shared global equinox, marking opposite seasonal transitions in the two hemispheres.",
    timing: {
      kind: "instant",
      atUtc: "2027-03-20T20:25:00Z",
      label: "Seasonal turning-point instant",
      sourceId: "almanac",
    },
    visibility:
      "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
    equipment:
      "No astronomical equipment is needed. A notebook or a fixed photo composition can help compare daylight and shadow through the year.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "At an equinox the Sun crosses the celestial equator. Day and night are approximately balanced, but the date of equal daylight depends on location, atmospheric refraction and how sunrise is defined.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
      },
      {
        heading: "Prepare to explore",
        body: "Use this as a reference for comparing local sunrise, sunset, daylight or shadow length over time. Never point optical equipment at the Sun without appropriate solar-viewing protection. Local weather and seasonal climate do not change at a single instant.",
      },
    ],
    question:
      "Help me understand March equinox around 2027-03-20 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Earth facts",
        url: "https://science.nasa.gov/earth/facts/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2027-03-22",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2027-03-22T10:44:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2027-03-22 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "neptune-in-conjunction-with-the-sun-2027-03-24",
    title: "Neptune in conjunction with the Sun",
    category: "planets",
    synopsis:
      "Neptune reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-03-24",
      endDateInclusive: "2027-03-24",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Neptune lies in the direction of the Sun from Earth. Its apparent proximity to the Sun makes this a visibility transition rather than a normal observing target.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Neptune in conjunction with the Sun around 2027-03-24 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-03-27",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-03-27T14:36:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.3° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-03-27 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2027-03-30",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2027-03-30T00:54:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2027-03-30 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-04-06",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-04-06T23:51:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-04-06 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "saturn-in-conjunction-with-the-sun-2027-04-07",
    title: "Saturn in conjunction with the Sun",
    category: "planets",
    synopsis:
      "Saturn reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-04-07",
      endDateInclusive: "2027-04-07",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Saturn lies in the direction of the Sun from Earth. Its apparent proximity to the Sun makes this a visibility transition rather than a normal observing target.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Saturn in conjunction with the Sun around 2027-04-07 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "pleiades-and-the-moon-2027-04-10",
    title: "Pleiades and the Moon",
    category: "pairings",
    synopsis:
      "Pleiades and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-04-10T03:30:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Pleiades 0.9° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Pleiades and the Moon around 2027-04-10 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2027-04-13",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2027-04-13T22:57:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2027-04-13 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-and-the-moon-occultation-opportunity-2027-04-15",
    title: "Jupiter and the Moon — occultation opportunity",
    category: "pairings",
    synopsis:
      "A lunar pairing flagged for an occultation somewhere on Earth. Whether the Moon covers Jupiter depends strongly on your location.",
    timing: {
      kind: "instant",
      atUtc: "2027-04-15T15:01:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Jupiter 1.0° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The source flags a possible lunar occultation for some geographic locations. It does not establish that the object will disappear from your observing site.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "A location-specific occultation prediction is required for an ingress/egress time or a visibility map. The reference shown here is not a local disappearance time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Confirm local occultation circumstances with an authoritative prediction before arranging a timed recording.",
      },
    ],
    question:
      "Help me understand Jupiter and the Moon — occultation opportunity around 2027-04-15 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2027-04-20",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2027-04-20T22:27:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2027-04-20 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "lyrid-meteor-shower-2027-04-23",
    title: "Lyrid meteor shower",
    category: "meteor-showers",
    synopsis: "The Lyrids are associated with comet C/1861 G1 Thatcher.",
    timing: {
      kind: "approximate",
      startDate: "2027-04-21",
      endDateInclusive: "2027-04-23",
      basis: "source-calendar",
      basisLabel: "Published observing-night estimates (sources differ)",
      label: "Published peak estimates",
      sourceId: "ams",
    },
    visibility:
      "Northern pre-dawn skies generally offer a higher radiant; southern viewers should check their lower radiant altitude.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "The Lyrids are associated with comet C/1861 G1 Thatcher. Their radiant lies near Lyra and Vega; they are a long-recorded spring shower for northern observers.",
      },
      {
        heading: "Peak nights and source precision",
        body: "AMS lists April 21–22, NASA lists April 22–23, and the annual almanac gives April 23. These sources differ; this guide deliberately brackets April 21–23 rather than asserting a single precise maximum.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Apr 14–30, 2027. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "Full Moon occurs on April 20, close to the published peak estimates. Bright waning moonlight can interfere, especially with fainter meteors.",
      },
      {
        heading: "Where and when to look",
        body: "Northern pre-dawn skies generally offer a higher radiant; southern viewers should check their lower radiant altitude.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Lyrid meteor shower around 2027-04-21 to 2027-04-23 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
      {
        id: "shower-background",
        title: "NASA — Lyrid meteor shower",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/lyrids/",
        sourceTimeScale: "Not applicable; shower explanation",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-04-23",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-04-23T23:16:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.1° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-04-23 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-superior-conjunction-2027-04-28",
    title: "Mercury at superior conjunction",
    category: "planets",
    synopsis:
      "Mercury reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-04-28",
      endDateInclusive: "2027-04-28",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Mercury passes on the far side of the Sun from Earth in its orbital cycle. Solar glare generally prevents ordinary observing near this alignment.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Mercury at superior conjunction around 2027-04-28 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2027-04-28",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2027-04-28T20:18:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2027-04-28 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "eta-aquariid-meteor-shower-2027-05-05",
    title: "Eta Aquariid meteor shower",
    category: "meteor-showers",
    synopsis:
      "Like the Orionids, this shower is supplied by debris from Halley’s comet.",
    timing: {
      kind: "approximate",
      startDate: "2027-05-05",
      endDateInclusive: "2027-05-06",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "The Southern Hemisphere and southern tropics are favored; northern observers generally have a shorter pre-dawn opportunity.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "Like the Orionids, this shower is supplied by debris from Halley’s comet. The radiant is in Aquarius and its fast meteors can leave trains.",
      },
      {
        heading: "Peak nights and source precision",
        body: "The AMS observing-night range is the planning reference here. It is not a UTC interval: changing the display time zone does not shift these date labels. Choose your local observing night after checking darkness and radiant altitude.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Apr 19–May 28, 2027. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "New Moon falls on May 6, close to the peak nights. Lunar interference should be limited, but darkness and weather still need local checks.",
      },
      {
        heading: "Where and when to look",
        body: "The Southern Hemisphere and southern tropics are favored; northern observers generally have a shorter pre-dawn opportunity.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Eta Aquariid meteor shower around 2027-05-05 to 2027-05-06 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
      {
        id: "shower-background",
        title: "NASA — Eta Aquariid meteor shower",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/eta-aquarids/",
        sourceTimeScale: "Not applicable; shower explanation",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-05-06",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-05-06T10:58:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-05-06 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "venus-and-saturn-2027-05-07",
    title: "Venus and Saturn",
    category: "pairings",
    synopsis:
      "Venus and Saturn share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "approximate",
      startDate: "2027-05-07",
      endDateInclusive: "2027-05-07",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Geocentric almanac reference (not local contacts) (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Venus 0.6° north of Saturn at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Venus and Saturn around 2027-05-07 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2027-05-13",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2027-05-13T04:44:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2027-05-13 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mars-and-regulus-2027-05-14",
    title: "Mars and Regulus",
    category: "pairings",
    synopsis:
      "Mars and Regulus share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-05-14T10:58:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Mars 1.1° north of Regulus at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Mars and Regulus around 2027-05-14 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2027-05-20",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2027-05-20T10:59:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2027-05-20 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-05-21",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-05-21T07:08:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.0° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-05-21 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "uranus-in-conjunction-with-the-sun-2027-05-27",
    title: "Uranus in conjunction with the Sun",
    category: "planets",
    synopsis:
      "Uranus reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-05-27",
      endDateInclusive: "2027-05-27",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Uranus lies in the direction of the Sun from Earth. Its apparent proximity to the Sun makes this a visibility transition rather than a normal observing target.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Uranus in conjunction with the Sun around 2027-05-27 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-greatest-elongation-2027-05-28",
    title: "Mercury at greatest elongation",
    category: "planets",
    synopsis:
      "A planetary elongation: a starting point for exploring its separation from the Sun and local observing conditions.",
    timing: {
      kind: "approximate",
      startDate: "2027-05-28",
      endDateInclusive: "2027-05-28",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "Greatest elongation describes a planet’s greatest apparent separation from the Sun in that part of its orbit. Horizon and twilight conditions still shape what an observer can see.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Mercury",
        body: "This reference is a eastern elongation, generally associated with the evening sky. Angular separation from the Sun is not altitude above your horizon. Check twilight and the ecliptic angle for your latitude before trying to observe.",
      },
    ],
    question:
      "Help me understand mercury at greatest elongation around 2027-05-28 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2027-05-28",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2027-05-28T13:58:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2027-05-28 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-06-04",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-06-04T19:40:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-06-04 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2027-06-11",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2027-06-11T10:56:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2027-06-11 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-06-17",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-06-17T13:46:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.0° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-06-17 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2027-06-19",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2027-06-19T00:44:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2027-06-19 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "june-solstice-2027-06-21",
    title: "June solstice",
    category: "seasons",
    synopsis:
      "June’s seasonal turning point: northern summer and southern winter.",
    timing: {
      kind: "instant",
      atUtc: "2027-06-21T14:11:00Z",
      label: "Seasonal turning-point instant",
      sourceId: "almanac",
    },
    visibility:
      "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
    equipment:
      "No astronomical equipment is needed. A notebook or a fixed photo composition can help compare daylight and shadow through the year.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "At the June solstice, the Northern Hemisphere is tilted towards the Sun and the Southern Hemisphere away from it. Daylight extremes and astronomical seasons differ between hemispheres.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
      },
      {
        heading: "Prepare to explore",
        body: "Use this as a reference for comparing local sunrise, sunset, daylight or shadow length over time. Never point optical equipment at the Sun without appropriate solar-viewing protection. Local weather and seasonal climate do not change at a single instant.",
      },
    ],
    question:
      "Help me understand June solstice around 2027-06-21 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Earth facts",
        url: "https://science.nasa.gov/earth/facts/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-inferior-conjunction-2027-06-23",
    title: "Mercury at inferior conjunction",
    category: "planets",
    synopsis:
      "Mercury reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-06-23",
      endDateInclusive: "2027-06-23",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Mercury passes between Earth and the Sun in its orbital cycle. Most inferior conjunctions are not transits across the solar disc.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Mercury at inferior conjunction around 2027-06-23 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2027-06-27",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2027-06-27T04:54:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2027-06-27 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "pleiades-and-the-moon-2027-07-01",
    title: "Pleiades and the Moon",
    category: "pairings",
    synopsis:
      "Pleiades and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-07-01T07:04:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Pleiades 0.9° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Pleiades and the Moon around 2027-07-01 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-07-04",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-07-04T03:02:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-07-04 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "earth-at-aphelion-2027-07-05",
    title: "Earth at aphelion",
    category: "seasons",
    synopsis:
      "Earth reaches its farthest point from the Sun in this yearly orbit.",
    timing: {
      kind: "approximate",
      startDate: "2027-07-05",
      endDateInclusive: "2027-07-05",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Orbital milestone around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
    equipment:
      "No astronomical equipment is needed. A notebook or a fixed photo composition can help compare daylight and shadow through the year.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Earth follows a slightly elliptical orbit. Aphelion is the farthest point from the Sun. Axial tilt, rather than this distance change, drives the opposite seasons in the two hemispheres.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
      },
      {
        heading: "Prepare to explore",
        body: "Use this as a reference for comparing local sunrise, sunset, daylight or shadow length over time. Never point optical equipment at the Sun without appropriate solar-viewing protection. Local weather and seasonal climate do not change at a single instant.",
      },
    ],
    question:
      "Help me understand Earth at aphelion around 2027-07-05 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Earth facts",
        url: "https://science.nasa.gov/earth/facts/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2027-07-10",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2027-07-10T18:39:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2027-07-10 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-07-14",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-07-14T19:34:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.1° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-07-14 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-greatest-elongation-2027-07-15",
    title: "Mercury at greatest elongation",
    category: "planets",
    synopsis:
      "A planetary elongation: a starting point for exploring its separation from the Sun and local observing conditions.",
    timing: {
      kind: "approximate",
      startDate: "2027-07-15",
      endDateInclusive: "2027-07-15",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "Greatest elongation describes a planet’s greatest apparent separation from the Sun in that part of its orbit. Horizon and twilight conditions still shape what an observer can see.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Mercury",
        body: "This reference is a western elongation, generally associated with the morning sky. Angular separation from the Sun is not altitude above your horizon. Check twilight and the ecliptic angle for your latitude before trying to observe.",
      },
    ],
    question:
      "Help me understand mercury at greatest elongation around 2027-07-15 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2027-07-18",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2027-07-18T15:45:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2027-07-18 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "penumbral-lunar-eclipse-2027-07-18",
    title: "Penumbral Lunar Eclipse",
    category: "eclipses",
    synopsis:
      "An extremely slight penumbral eclipse: a useful astronomical distinction, with no conspicuous visual spectacle expected.",
    timing: {
      kind: "instant",
      atUtc: "2027-07-18T16:03:00Z",
      label: "Global eclipse maximum (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Geometric coverage includes parts of eastern Africa, Asia, Australia and the Pacific; the penumbral overlap is extremely slight.",
    equipment:
      "Unaided eyes or binoculars, where the Moon is above the horizon. Penumbral shading can be difficult to notice.",
    sections: [
      {
        heading: "What happens",
        body: "A penumbral lunar eclipse occurs when the Moon passes through Earth’s outer shadow. The depth of the encounter determines how noticeable the shading may be.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global maximum from the UTC almanac, rounded to its published minute. NASA’s decade table uses TD, so its clock values are not substituted for UTC. Local contact times need a location-specific source.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "What would make a useful plan",
        body: "Check whether the Moon is above your horizon during the eclipse and which phases occur after local darkness begins. A penumbral event can be subtle; a careful before/during comparison is more meaningful than expecting the appearance of a total lunar eclipse.",
      },
    ],
    question:
      "Help me understand penumbral lunar eclipse around 2027-07-18 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "visibility",
        title: "NASA GSFC — eclipse dates and geographic visibility",
        url: "https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html",
        sourceTimeScale:
          "TD (geography/date cross-check only; time from UTC almanac)",
      },
      {
        id: "annual-eclipse-review",
        title: "NASA — Eclipses During 2027",
        url: "https://eclipse.gsfc.nasa.gov/OH/OH2027.html",
        sourceTimeScale:
          "Mixed source scales; context only, UTC time remains from almanac",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-and-regulus-2027-07-25",
    title: "Jupiter and Regulus",
    category: "pairings",
    synopsis:
      "Jupiter and Regulus share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-07-25T06:23:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Jupiter 0.4° north of Regulus at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Jupiter and Regulus around 2027-07-25 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2027-07-26",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2027-07-26T16:55:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2027-07-26 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "pleiades-and-the-moon-2027-07-28",
    title: "Pleiades and the Moon",
    category: "pairings",
    synopsis:
      "Pleiades and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-07-28T16:20:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Pleiades 1.0° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Pleiades and the Moon around 2027-07-28 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "alpha-capricornid-meteor-shower-2027-07-30",
    title: "Alpha Capricornid meteor shower",
    category: "meteor-showers",
    synopsis:
      "A relatively low-rate shower that can nevertheless produce bright fireballs.",
    timing: {
      kind: "approximate",
      startDate: "2027-07-30",
      endDateInclusive: "2027-07-31",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak around",
      sourceId: "ams",
    },
    visibility:
      "Both sides of the equator can have useful opportunities when the radiant is sufficiently high.",
    equipment:
      "Unaided eyes and a wide dark view. A stable camera support helps with a photographic record; no telescope is needed for a broad meteor watch.",
    sections: [
      {
        heading: "What makes this shower different",
        body: "A relatively low-rate shower that can nevertheless produce bright fireballs. It can be explored alongside the Southern Delta Aquariids without assuming both produce the same appearance or radiant.",
      },
      {
        heading: "Understand the peak reference",
        body: "The published observing-night labels are retained as a source-date range. They are not local-midnight appointments and do not move when the time-zone selector changes.",
      },
      {
        heading: "Activity reference",
        body: "AMS gives July 3–August 15, 2027 in its activity heading, while its narrative describes July 12–August 12. Because those endpoints differ, this guide does not assert a single exact activity interval; it uses July 30–31 for the peak-night reference.",
      },
      {
        heading: "Moon and sky conditions",
        body: "New Moon on August 2 follows these reference nights. Check the waning crescent and twilight for your own observing site.",
      },
      {
        heading: "Prepare to observe",
        body: "Both sides of the equator can have useful opportunities when the radiant is sufficiently high. Check darkness, forecast and legal access, settle comfortably, and watch a broad area. A fireball or outburst is never guaranteed.",
      },
    ],
    question:
      "Help me explore Alpha Capricornid meteor shower near 2027-07-30 for my chosen location.",
    sources: [
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "delta-aquariid-meteor-shower-2027-07-28",
    title: "Southern Delta Aquariid meteor shower",
    category: "meteor-showers",
    synopsis:
      "The Southern Delta Aquariids can provide a broad period of faint-meteor activity.",
    timing: {
      kind: "approximate",
      startDate: "2027-07-30",
      endDateInclusive: "2027-07-31",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "Southern tropics are favored. Northern observers should check the lower southern radiant and use the darkest practical sky.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "The Southern Delta Aquariids can provide a broad period of faint-meteor activity. Their southerly radiant makes this a different opportunity from the northern Perseids.",
      },
      {
        heading: "Peak nights and source precision",
        body: "AMS lists July 30–31, whereas the coarse annual almanac gives July 28. This guide uses the specialist observing-night reference, not an invented conversion of the almanac hour.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Jul 12–Aug 23, 2027. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "New Moon is on August 2, soon after the reference peak. Check the waning crescent’s local rise time and the approach of morning twilight.",
      },
      {
        heading: "Where and when to look",
        body: "Southern tropics are favored. Northern observers should check the lower southern radiant and use the darkest practical sky.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Southern Delta Aquariid meteor shower around 2027-07-30 to 2027-07-31 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
      {
        id: "shower-background",
        title: "NASA — Southern Delta Aquariid meteor shower",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/delta-aquariids/",
        sourceTimeScale: "Not applicable; shower explanation",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-08-02",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-02T10:05:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-08-02 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "total-solar-eclipse-2027-08-02",
    title: "Total Solar Eclipse",
    category: "eclipses",
    synopsis:
      "A solar eclipse with a limited geographic path. Local circumstances are essential before making plans.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-02T10:07:00Z",
      label: "Global eclipse maximum (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Totality follows a narrow path across parts of Spain, North Africa and the Middle East; partial phases extend more widely across Africa, Europe and western/southern Asia.",
    equipment:
      "Proper solar-viewing protection is essential. Follow NASA’s eclipse safety guidance before any observation.",
    sections: [
      {
        heading: "What happens",
        body: "During a total solar eclipse, the Moon fully covers the solar disc only along the path of totality. Outside that path, the experience differs.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global maximum from the UTC almanac, rounded to its published minute. NASA’s decade table uses TD, so its clock values are not substituted for UTC. Local contact times need a location-specific source.",
      },
      {
        heading: "Prepare for your night",
        body: "Never view partial or annular solar-eclipse phases without suitable solar-viewing protection. Ordinary sunglasses are not adequate. Optical equipment needs appropriate front-mounted solar filters; follow the linked NASA instructions.",
      },
      {
        heading: "What would make a useful plan",
        body: "First establish whether your site lies in the central path or only the partial-eclipse region. Then obtain local contact times, assess the horizon and forecast, and prepare suitable solar protection. A global maximum converted to your clock does not answer those local questions.",
      },
    ],
    question:
      "Help me understand total solar eclipse around 2027-08-02 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Eclipse viewing safety",
        url: "https://science.nasa.gov/eclipses/safety/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "visibility",
        title: "NASA GSFC — eclipse dates and geographic visibility",
        url: "https://eclipse.gsfc.nasa.gov/SEdecade/SEdecade2021.html",
        sourceTimeScale:
          "TD (geography/date cross-check only; time from UTC almanac)",
      },
      {
        id: "annual-eclipse-review",
        title: "NASA — Eclipses During 2027",
        url: "https://eclipse.gsfc.nasa.gov/OH/OH2027.html",
        sourceTimeScale:
          "Mixed source scales; context only, UTC time remains from almanac",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2027-08-09",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-09T04:54:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2027-08-09 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-superior-conjunction-2027-08-11",
    title: "Mercury at superior conjunction",
    category: "planets",
    synopsis:
      "Mercury reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-08-11",
      endDateInclusive: "2027-08-11",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Mercury passes on the far side of the Sun from Earth in its orbital cycle. Solar glare generally prevents ordinary observing near this alignment.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Mercury at superior conjunction around 2027-08-11 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-08-11",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-11T01:31:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.1° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-08-11 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "perseid-meteor-shower-2027-08-13",
    title: "Perseid meteor shower",
    category: "meteor-showers",
    synopsis:
      "Comet 109P/Swift-Tuttle supplies the Perseid debris, with an apparent radiant in Perseus.",
    timing: {
      kind: "approximate",
      startDate: "2027-08-12",
      endDateInclusive: "2027-08-13",
      basis: "source-calendar",
      basisLabel: "AMS observing-night dates; location dependent",
      label: "Reference peak nights",
      sourceId: "ams",
    },
    visibility:
      "Northern observers are favored, particularly before dawn. Southern observers should check whether Perseus reaches a useful altitude.",
    equipment:
      "Unaided eyes, a broad unobstructed view, warm layers and a comfortable seat. Use a tripod and a wide field if making a photographic record.",
    sections: [
      {
        heading: "The story behind this shower",
        body: "Comet 109P/Swift-Tuttle supplies the Perseid debris, with an apparent radiant in Perseus. The shower is known for bright meteors and occasional fireballs.",
      },
      {
        heading: "Peak nights and source precision",
        body: "The AMS observing-night range is the planning reference here. It is not a UTC interval: changing the display time zone does not shift these date labels. Choose your local observing night after checking darkness and radiant altitude.",
      },
      {
        heading: "Activity beyond the peak",
        body: "Published AMS activity reference: Jul 17–Aug 24, 2027. These are broad seasonal dates, not a promise of constant activity. The calendar marks the peak reference; this longer period is context for planning.",
      },
      {
        heading: "The Moon for this return",
        body: "The peak falls between first quarter on August 9 and full Moon on August 17. Check for a darker pre-dawn interval after local moonset rather than assuming a moonless peak.",
      },
      {
        heading: "Where and when to look",
        body: "Northern observers are favored, particularly before dawn. Southern observers should check whether Perseus reaches a useful altitude.",
      },
      {
        heading: "Prepare for the experience",
        body: "Confirm night access and forecast, give your eyes time to adapt, and watch a broad area rather than only the radiant. A published ideal rate is not a personal forecast. For photographs or video, begin with your field of view, battery plan and exposure tests.",
      },
    ],
    question:
      "Help me explore Perseid meteor shower around 2027-08-12 to 2027-08-13 for my destination, including darkness, moonrise/moonset and preparation.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Meteors and meteorites",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "ams",
        title: "American Meteor Society — 2026/2027 observing-night calendar",
        url: "https://www.amsmeteors.org/calendar/",
        sourceTimeScale:
          "Source observing-night dates; no UTC instant asserted",
      },
      {
        id: "shower-background",
        title: "NASA — Perseid meteor shower",
        url: "https://science.nasa.gov/solar-system/meteors-meteorites/perseids/",
        sourceTimeScale: "Not applicable; shower explanation",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "venus-at-superior-conjunction-2027-08-12",
    title: "Venus at superior conjunction",
    category: "planets",
    synopsis:
      "Venus reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-08-12",
      endDateInclusive: "2027-08-12",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Venus passes on the far side of the Sun from Earth in its orbital cycle. Solar glare generally prevents ordinary observing near this alignment.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Venus at superior conjunction around 2027-08-12 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "penumbral-lunar-eclipse-2027-08-17",
    title: "Penumbral Lunar Eclipse",
    category: "eclipses",
    synopsis:
      "A penumbral lunar eclipse, where subtle shading may affect the Moon rather than a dramatic dark bite.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-17T07:14:00Z",
      label: "Global eclipse maximum (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Some phases are visible across parts of the Pacific and the Americas; the Moon must be above your horizon.",
    equipment:
      "Unaided eyes or binoculars, where the Moon is above the horizon. Penumbral shading can be difficult to notice.",
    sections: [
      {
        heading: "What happens",
        body: "A penumbral lunar eclipse occurs when the Moon passes through Earth’s outer shadow. The depth of the encounter determines how noticeable the shading may be.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global maximum from the UTC almanac, rounded to its published minute. NASA’s decade table uses TD, so its clock values are not substituted for UTC. Local contact times need a location-specific source.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "What would make a useful plan",
        body: "Check whether the Moon is above your horizon during the eclipse and which phases occur after local darkness begins. A penumbral event can be subtle; a careful before/during comparison is more meaningful than expecting the appearance of a total lunar eclipse.",
      },
    ],
    question:
      "Help me understand penumbral lunar eclipse around 2027-08-17 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
      {
        id: "visibility",
        title: "NASA GSFC — eclipse dates and geographic visibility",
        url: "https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html",
        sourceTimeScale:
          "TD (geography/date cross-check only; time from UTC almanac)",
      },
      {
        id: "annual-eclipse-review",
        title: "NASA — Eclipses During 2027",
        url: "https://eclipse.gsfc.nasa.gov/OH/OH2027.html",
        sourceTimeScale:
          "Mixed source scales; context only, UTC time remains from almanac",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2027-08-17",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-17T07:29:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2027-08-17 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mars-and-spica-2027-08-23",
    title: "Mars and Spica",
    category: "pairings",
    synopsis:
      "Mars and Spica share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-23T14:36:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Mars 1.7° north of Spica at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Mars and Spica around 2027-08-23 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "pleiades-and-the-moon-2027-08-24",
    title: "Pleiades and the Moon",
    category: "pairings",
    synopsis:
      "Pleiades and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-24T23:36:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Pleiades 0.9° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Pleiades and the Moon around 2027-08-24 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2027-08-25",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-25T02:27:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2027-08-25 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "jupiter-in-conjunction-with-the-sun-2027-08-31",
    title: "Jupiter in conjunction with the Sun",
    category: "planets",
    synopsis:
      "Jupiter reaches a solar conjunction: useful context for its changing observing season, rather than an invitation to look close to the Sun.",
    timing: {
      kind: "approximate",
      startDate: "2027-08-31",
      endDateInclusive: "2027-08-31",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Solar-conjunction date around (approximate)",
      sourceId: "almanac",
    },
    visibility:
      "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
    equipment:
      "No visual observation is recommended at the alignment. Explore the orbital geometry with a diagram or a suitable planetarium.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Jupiter lies in the direction of the Sun from Earth. Its apparent proximity to the Sun makes this a visibility transition rather than a normal observing target.",
      },
      {
        heading: "Understand the reference time",
        body: "The source only supplies a coarse hour estimate. We preserve its approximate UTC calendar date instead of inventing a precise local appointment.",
      },
      {
        heading: "What to check for your location",
        body: "A global orbital alignment. This entry does not predict a visible transit, a safe daytime target, or a local observing window.",
      },
      {
        heading: "Prepare to explore",
        body: "Follow the planet’s changing separation from the Sun on later dates. Do not search near the Sun with binoculars, telescopes or an unprotected camera; choose a verified safe night-sky opportunity instead.",
      },
    ],
    question:
      "Help me understand Jupiter in conjunction with the Sun around 2027-08-31 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-08-31",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-08-31T17:41:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-08-31 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "antares-and-the-moon-2027-09-07",
    title: "Antares and the Moon",
    category: "pairings",
    synopsis:
      "Antares and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-09-07T08:34:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Antares 0.0° north of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Antares and the Moon around 2027-09-07 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "first-quarter-moon-2027-09-07",
    title: "First Quarter Moon",
    category: "moon",
    synopsis:
      "The waxing half-lit Moon: a useful stage for exploring the boundary between lunar daylight and shadow.",
    timing: {
      kind: "instant",
      atUtc: "2027-09-07T18:31:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "First quarter occurs about one quarter of the way through the lunar phase cycle. Roughly half of the Earth-facing lunar disc is illuminated; quarter refers to the cycle, not the illuminated fraction.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The first-quarter Moon generally offers afternoon and evening opportunities. Local moonrise, moonset and altitude still depend on the observer.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand First Quarter Moon around 2027-09-07 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "full-moon-2027-09-15",
    title: "Full Moon",
    category: "moon",
    synopsis:
      "A moment to explore the Moon’s changing face and what moonlight brings to a night outside.",
    timing: {
      kind: "instant",
      atUtc: "2027-09-15T23:04:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "Unaided eyes; binoculars or a telescope can support closer observation.",
    sections: [
      {
        heading: "What happens",
        body: "Full Moon marks the phase when the Moon’s Earth-facing side is fully illuminated. Its appearance changes gradually around the listed instant.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "Consider a moonrise composition or a study of the lunar disc. The Moon is bright near full phase, so faint deep-sky targets may be harder to see. Check local moonrise and choose focal length and exposure for your own equipment.",
      },
    ],
    question:
      "Help me understand full moon around 2027-09-15 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-and-spica-2027-09-21",
    title: "Mercury and Spica",
    category: "pairings",
    synopsis:
      "Mercury and Spica share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-09-21T03:21:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Mercury 0.2° south of Spica at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Mercury and Spica around 2027-09-21 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "pleiades-and-the-moon-2027-09-21",
    title: "Pleiades and the Moon",
    category: "pairings",
    synopsis:
      "Pleiades and the Moon share a close apparent alignment in the almanac: an opportunity to explore the geometry and a possible composition.",
    timing: {
      kind: "instant",
      atUtc: "2027-09-21T05:12:00Z",
      label: "Geocentric almanac reference (not local contacts)",
      sourceId: "almanac",
    },
    visibility:
      "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
    equipment:
      "Use a current finder chart; unaided eyes, binoculars or a telescope may be appropriate for the named objects. Optical equipment requires a safely dark observing direction away from the Sun.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "The almanac lists Pleiades 0.8° south of Moon at its geocentric reference. This is an apparent alignment in our sky; the objects are not physically close. The quoted separation is the source’s reference value, not a calculated local minimum separation.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "Visibility and the apparent spacing depend on your horizon, darkness and location. The almanac reference is not a local rise, set, or guaranteed closest-approach time.",
      },
      {
        heading: "Prepare to explore",
        body: "Check both objects’ altitude and separation in a location-specific sky chart. For photography, estimate your field of view and test exposure for the brighter object. Explore the surrounding night as well as the listed reference; the best local composition may occur at another time.",
      },
    ],
    question:
      "Help me understand Pleiades and the Moon around 2027-09-21 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "september-equinox-2027-09-23",
    title: "September equinox",
    category: "seasons",
    synopsis:
      "A shared global equinox, marking opposite seasonal transitions in the two hemispheres.",
    timing: {
      kind: "instant",
      atUtc: "2027-09-23T06:02:00Z",
      label: "Seasonal turning-point instant",
      sourceId: "almanac",
    },
    visibility:
      "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
    equipment:
      "No astronomical equipment is needed. A notebook or a fixed photo composition can help compare daylight and shadow through the year.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "At an equinox the Sun crosses the celestial equator. Day and night are approximately balanced, but the date of equal daylight depends on location, atmospheric refraction and how sunrise is defined.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "This is a global Earth–Sun geometry milestone, not a localized light show. Its calendar date can differ between time zones when an exact instant is supplied.",
      },
      {
        heading: "Prepare to explore",
        body: "Use this as a reference for comparing local sunrise, sunset, daylight or shadow length over time. Never point optical equipment at the Sun without appropriate solar-viewing protection. Local weather and seasonal climate do not change at a single instant.",
      },
    ],
    question:
      "Help me understand September equinox around 2027-09-23 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Earth facts",
        url: "https://science.nasa.gov/earth/facts/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "last-quarter-moon-2027-09-23",
    title: "Last Quarter Moon",
    category: "moon",
    synopsis:
      "The waning half-lit Moon: a different lighting angle for late-night and morning lunar exploration.",
    timing: {
      kind: "instant",
      atUtc: "2027-09-23T10:20:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
    equipment:
      "Unaided eyes for the phase; binoculars or a small telescope for lunar detail. A stable support helps when increasing magnification.",
    sections: [
      {
        heading: "What makes this moment interesting",
        body: "Last quarter occurs about three quarters of the way through the lunar phase cycle. Roughly half the visible lunar disc is illuminated as the Moon moves towards its next new phase.",
      },
      {
        heading: "Understand the reference time",
        body: "The source gives a UTC reference to the published minute, with predictive accuracy that depends on the phenomenon. Your selected time zone changes the displayed clock and possibly the date. It does not calculate local visibility.",
      },
      {
        heading: "What to check for your location",
        body: "The last-quarter Moon generally offers late-night and morning opportunities. The phase instant is global, but local moonrise and altitude differ.",
      },
      {
        heading: "Prepare to explore",
        body: "Choose a feature near the terminator, the boundary between lunar day and night, and compare its shadows over successive evenings or mornings. Check your local horizon and forecast rather than treating the phase instant as an observing appointment.",
      },
    ],
    question:
      "Help me understand Last Quarter Moon around 2027-09-23 and explore what it means for my chosen location.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; explanatory guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "mercury-at-greatest-elongation-2027-09-24",
    title: "Mercury at greatest elongation",
    category: "planets",
    synopsis:
      "A planetary elongation: a starting point for exploring its separation from the Sun and local observing conditions.",
    timing: {
      kind: "approximate",
      startDate: "2027-09-24",
      endDateInclusive: "2027-09-24",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Equipment depends on what you want to see. Check the planet’s altitude and safe observing circumstances first.",
    sections: [
      {
        heading: "What happens",
        body: "Greatest elongation describes a planet’s greatest apparent separation from the Sun in that part of its orbit. Horizon and twilight conditions still shape what an observer can see.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Mercury",
        body: "This reference is a eastern elongation, generally associated with the evening sky. Angular separation from the Sun is not altitude above your horizon. Check twilight and the ecliptic angle for your latitude before trying to observe.",
      },
    ],
    question:
      "Help me understand mercury at greatest elongation around 2027-09-24 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "neptune-at-opposition-2027-09-28",
    title: "Neptune at opposition",
    category: "planets",
    synopsis:
      "A planetary opposition: an alignment to explore, rather than a single appointment for observing.",
    timing: {
      kind: "approximate",
      startDate: "2027-09-28",
      endDateInclusive: "2027-09-28",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Almanac date around",
      sourceId: "almanac",
    },
    visibility:
      "Latitude, horizon and the planet’s position determine your viewing opportunity. The listed date is not a local rise or set time.",
    equipment:
      "Optical equipment and an accurate finder chart are needed; check suitable local guidance.",
    sections: [
      {
        heading: "What happens",
        body: "At opposition, an outer planet lies opposite the Sun in Earth’s sky. The surrounding nights can be worth exploring; the alignment does not guarantee local conditions.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Check a location-specific sky chart, a clear horizon, and weather. Use the date as a research starting point rather than a guarantee that the object is observable.",
      },
      {
        heading: "A goal for Neptune",
        body: "Use a current finder chart and appropriate optical equipment. These faint outer planets require careful identification; a photograph of a field is not by itself confirmation of the planet.",
      },
    ],
    question:
      "Help me understand neptune at opposition around 2027-09-28 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Skywatching",
        url: "https://science.nasa.gov/skywatching/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "new-moon-2027-09-30",
    title: "New Moon",
    category: "moon",
    synopsis:
      "A marker for the Moon’s monthly cycle, and a starting point for thinking about darker skies.",
    timing: {
      kind: "instant",
      atUtc: "2027-09-30T02:36:00Z",
      label: "Phase instant",
      sourceId: "almanac",
    },
    visibility:
      "The phase instant is global. Whether and when the Moon is above your horizon depends on location.",
    equipment:
      "No equipment needed to understand the phase. New Moon itself is generally not visible in the night sky.",
    sections: [
      {
        heading: "What happens",
        body: "New Moon marks the alignment when the Moon’s illuminated half faces mainly away from Earth. The calendar marks the phase instant, not a guaranteed dark observing session.",
      },
      {
        heading: "Read the timing",
        body: "The displayed time is the global phase instant, converted to your selected time zone. It is not a moonrise time.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose whether your goal is the Moon itself or a darker sky for another subject. Check moonrise, moonset, weather and your horizon for the place you intend to observe.",
      },
      {
        heading: "Choose a lunar goal",
        body: "A new phase is a useful dark-sky reference, but the Moon’s phase alone does not establish darkness at a particular hour. Check local moonrise/moonset, twilight, weather and the altitude of the subject you want to observe.",
      },
    ],
    question:
      "Help me understand new moon around 2027-09-30 and what I should check for my chosen destination.",
    sources: [
      {
        id: "almanac",
        title: "2027 Sky Event Almanac — Fred Espenak",
        url: "https://www.astropixels.com/almanac/almanac21/almanac2027gmt.html",
        sourceTimeScale: "UTC",
      },
      {
        id: "background",
        title: "NASA — Moon phases",
        url: "https://science.nasa.gov/moon/moon-phases/",
        sourceTimeScale: "Not applicable; background guidance",
      },
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
];
export const coverageMonths: readonly CoverageMonth[] = [
  {
    month: "2026-10",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2026-11",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2026-12",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2027-01",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2027-02",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2027-03",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2027-04",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2027-05",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2027-06",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2027-07",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2027-08",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
  {
    month: "2027-09",
    reviewedAt: "2026-10-16",
    scope:
      "Major-event policy: all four Moon phases, eclipses, major showers, planetary observing milestones, specified close pairings/occultations and Earth seasonal/orbital markers.",
  },
];
