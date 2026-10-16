import type { SkyEvent, CoverageMonth } from "./skyEvents";
export const skyEvents: readonly SkyEvent[] = [
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
    id: "orionid-meteor-shower-2026-10-21",
    title: "Orionid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2026-10-21",
      endDateInclusive: "2026-10-21",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand orionid meteor shower around 2026-10-21 and what I should check for my chosen destination.",
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
    id: "southern-taurid-meteor-shower-2026-11-05",
    title: "Southern Taurid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-05",
      endDateInclusive: "2026-11-05",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand southern taurid meteor shower around 2026-11-05 and what I should check for my chosen destination.",
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
    id: "northern-taurid-meteor-shower-2026-11-12",
    title: "Northern Taurid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-12",
      endDateInclusive: "2026-11-12",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand northern taurid meteor shower around 2026-11-12 and what I should check for my chosen destination.",
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
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "leonid-meteor-shower-2026-11-18",
    title: "Leonid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2026-11-18",
      endDateInclusive: "2026-11-18",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand leonid meteor shower around 2026-11-18 and what I should check for my chosen destination.",
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
    id: "geminid-meteor-shower-2026-12-14",
    title: "Geminid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2026-12-14",
      endDateInclusive: "2026-12-14",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand geminid meteor shower around 2026-12-14 and what I should check for my chosen destination.",
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
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "ursid-meteor-shower-2026-12-22",
    title: "Ursid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2026-12-22",
      endDateInclusive: "2026-12-22",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand ursid meteor shower around 2026-12-22 and what I should check for my chosen destination.",
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
    id: "quadrantid-meteor-shower-2027-01-04",
    title: "Quadrantid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2027-01-04",
      endDateInclusive: "2027-01-04",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand quadrantid meteor shower around 2027-01-04 and what I should check for my chosen destination.",
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
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2027-04-23",
      endDateInclusive: "2027-04-23",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand lyrid meteor shower around 2027-04-23 and what I should check for my chosen destination.",
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
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "eta-aquariid-meteor-shower-2027-05-05",
    title: "Eta Aquariid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2027-05-05",
      endDateInclusive: "2027-05-05",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand eta aquariid meteor shower around 2027-05-05 and what I should check for my chosen destination.",
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
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "delta-aquariid-meteor-shower-2027-07-28",
    title: "Delta Aquariid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2027-07-28",
      endDateInclusive: "2027-07-28",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand delta aquariid meteor shower around 2027-07-28 and what I should check for my chosen destination.",
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
    ],
    lastReviewedAt: "2026-10-16",
    reviewStatus: "reviewed",
  },
  {
    id: "perseid-meteor-shower-2027-08-13",
    title: "Perseid meteor shower",
    category: "meteor-showers",
    synopsis:
      "An annual meteor-shower highlight. Explore the peak date, then consider darkness and your observing location.",
    timing: {
      kind: "approximate",
      startDate: "2027-08-13",
      endDateInclusive: "2027-08-13",
      basis: "UTC",
      basisLabel: "UTC almanac date",
      label: "Expected peak around",
      sourceId: "almanac",
    },
    visibility:
      "Local visibility depends on the shower’s radiant, latitude, darkness and weather. This calendar does not calculate a local viewing window.",
    equipment:
      "Unaided eyes and a broad view of the sky. Warm layers and a comfortable seat help with a longer watch.",
    sections: [
      {
        heading: "What happens",
        body: "The almanac identifies a predicted peak date, not an appointment or a promised meteor count. Activity can extend beyond the peak; this entry does not assert unverified activity-window dates.",
      },
      {
        heading: "Read the timing",
        body: "This entry retains the almanac’s UTC calendar date. Its coarse prediction is deliberately not converted into a precise local time. Check a current specialist source when choosing an observing night.",
      },
      {
        heading: "Prepare for your night",
        body: "Choose a dark site with confirmed access. Check the Moon, forecast and radiant visibility, allow time to settle in, and treat any quoted ideal rate as different from a personal prediction.",
      },
    ],
    question:
      "Help me understand perseid meteor shower around 2027-08-13 and what I should check for my chosen destination.",
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
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2026-11",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2026-12",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2027-01",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2027-02",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2027-03",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2027-04",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2027-05",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2027-06",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2027-07",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2027-08",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
  {
    month: "2027-09",
    reviewedAt: "2026-10-16",
    scope:
      "Selected new/full Moon phases, meteor peaks, eclipses and planetary elongations/oppositions in the source almanac; not an exhaustive sky calendar.",
  },
];
