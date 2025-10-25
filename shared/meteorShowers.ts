export interface MeteorShower {
  id: string;
  name: string;
  peakDate: string;
  peakDateStart: string; // ISO date for sorting
  peakDateEnd: string; // ISO date for sorting
  ratePerHour: string;
  bestLocation: string;
  description: string;
  featured?: boolean;
  radiant: string;
  moonPhase: string;
  bestViewingTime: string;
  visibility: string;
  parentBody: string;
  velocity: string;
  difficulty: string;
}

export const meteorShowers2025: MeteorShower[] = [
  {
    id: "quadrantids",
    name: "Quadrantids",
    peakDate: "January 3-4, 2025",
    peakDateStart: "2025-01-03",
    peakDateEnd: "2025-01-04",
    ratePerHour: "Up to 120",
    bestLocation: "Northern Hemisphere",
    description: "Sharp, bright meteors with fine trains. Best viewed in dark skies away from moonlight.",
    radiant: "Constellation Boötes",
    moonPhase: "Waxing Crescent (favorable)",
    bestViewingTime: "After midnight to dawn",
    visibility: "Best from northern latitudes",
    parentBody: "Asteroid 2003 EH1",
    velocity: "41 km/s (medium speed)",
    difficulty: "Moderate - narrow peak window"
  },
  {
    id: "lyrids",
    name: "Lyrids",
    peakDate: "April 22-23, 2025",
    peakDateStart: "2025-04-22",
    peakDateEnd: "2025-04-23",
    ratePerHour: "Up to 20",
    bestLocation: "Both Hemispheres",
    description: "Fast meteors that can leave persistent glowing dust trails in the atmosphere.",
    radiant: "Constellation Lyra",
    moonPhase: "Waning Crescent (favorable)",
    bestViewingTime: "After midnight",
    visibility: "Visible worldwide",
    parentBody: "Comet C/1861 G1 Thatcher",
    velocity: "49 km/s (very fast)",
    difficulty: "Easy - consistent and reliable"
  },
  {
    id: "eta-aquariids",
    name: "Eta Aquariids",
    peakDate: "May 5-6, 2025",
    peakDateStart: "2025-05-05",
    peakDateEnd: "2025-05-06",
    ratePerHour: "Up to 50",
    bestLocation: "Southern Hemisphere",
    description: "Swift and bright meteors, remnants from Halley's Comet.",
    radiant: "Constellation Aquarius",
    moonPhase: "First Quarter (moderate interference)",
    bestViewingTime: "Pre-dawn hours",
    visibility: "Best from tropics and southern latitudes",
    parentBody: "Halley's Comet",
    velocity: "66 km/s (very fast)",
    difficulty: "Easy - broad peak"
  },
  {
    id: "delta-aquariids",
    name: "Delta Aquariids",
    peakDate: "July 28-29, 2025",
    peakDateStart: "2025-07-28",
    peakDateEnd: "2025-07-29",
    ratePerHour: "Up to 25",
    bestLocation: "Southern Hemisphere",
    description: "Faint meteors best viewed from tropical and southern latitudes.",
    radiant: "Constellation Aquarius",
    moonPhase: "Waxing Crescent (favorable)",
    bestViewingTime: "After midnight",
    visibility: "Best from southern tropics",
    parentBody: "Unknown (possibly Comet 96P/Machholz)",
    velocity: "41 km/s (medium speed)",
    difficulty: "Moderate - faint meteors"
  },
  {
    id: "perseids",
    name: "Perseids",
    peakDate: "August 12-13, 2025",
    peakDateStart: "2025-08-12",
    peakDateEnd: "2025-08-13",
    ratePerHour: "Up to 100",
    bestLocation: "Northern Hemisphere",
    description: "The year's most popular meteor shower, known for bright fireballs and long trails.",
    featured: true,
    radiant: "Constellation Perseus",
    moonPhase: "Waning Gibbous (some interference)",
    bestViewingTime: "After midnight to dawn",
    visibility: "Excellent from northern latitudes",
    parentBody: "Comet 109P/Swift-Tuttle",
    velocity: "59 km/s (very fast)",
    difficulty: "Easy - reliable and spectacular"
  },
  {
    id: "draconids",
    name: "Draconids",
    peakDate: "October 8-9, 2025",
    peakDateStart: "2025-10-08",
    peakDateEnd: "2025-10-09",
    ratePerHour: "Up to 10",
    bestLocation: "Northern Hemisphere",
    description: "Unusual shower best viewed in the early evening rather than after midnight.",
    radiant: "Constellation Draco",
    moonPhase: "Full Moon (unfavorable)",
    bestViewingTime: "Early evening after sunset",
    visibility: "Best from northern latitudes",
    parentBody: "Comet 21P/Giacobini-Zinner",
    velocity: "20 km/s (slow)",
    difficulty: "Challenging - low rates and moon interference"
  },
  {
    id: "orionids",
    name: "Orionids",
    peakDate: "October 21-22, 2025",
    peakDateStart: "2025-10-21",
    peakDateEnd: "2025-10-22",
    ratePerHour: "Up to 25",
    bestLocation: "Both Hemispheres",
    description: "Another gift from Halley's Comet. Fast meteors with persistent trains.",
    radiant: "Constellation Orion",
    moonPhase: "New Moon (ideal)",
    bestViewingTime: "After midnight to dawn",
    visibility: "Visible worldwide",
    parentBody: "Halley's Comet",
    velocity: "66 km/s (very fast)",
    difficulty: "Easy - dark skies guaranteed"
  },
  {
    id: "southern-taurids",
    name: "Southern Taurids",
    peakDate: "November 4-5, 2025",
    peakDateStart: "2025-11-04",
    peakDateEnd: "2025-11-05",
    ratePerHour: "Up to 10",
    bestLocation: "Both Hemispheres",
    description: "Known for producing bright fireballs and slow-moving meteors.",
    radiant: "Constellation Taurus",
    moonPhase: "Waxing Gibbous (some interference)",
    bestViewingTime: "After midnight",
    visibility: "Visible worldwide",
    parentBody: "Comet 2P/Encke",
    velocity: "27 km/s (slow)",
    difficulty: "Moderate - fireball hunters' favorite"
  },
  {
    id: "northern-taurids",
    name: "Northern Taurids",
    peakDate: "November 11-12, 2025",
    peakDateStart: "2025-11-11",
    peakDateEnd: "2025-11-12",
    ratePerHour: "Up to 10",
    bestLocation: "Both Hemispheres",
    description: "Companion to Southern Taurids, also known for spectacular fireballs.",
    radiant: "Constellation Taurus",
    moonPhase: "Waxing Gibbous (some interference)",
    bestViewingTime: "After midnight",
    visibility: "Visible worldwide",
    parentBody: "Comet 2P/Encke",
    velocity: "29 km/s (slow)",
    difficulty: "Moderate - patient observation rewarded"
  },
  {
    id: "leonids",
    name: "Leonids",
    peakDate: "November 17-18, 2025",
    peakDateStart: "2025-11-17",
    peakDateEnd: "2025-11-18",
    ratePerHour: "Up to 15",
    bestLocation: "Both Hemispheres",
    description: "Fast meteors known for periodic meteor storms every 33 years.",
    radiant: "Constellation Leo",
    moonPhase: "Waning Crescent (favorable)",
    bestViewingTime: "After midnight to dawn",
    visibility: "Visible worldwide",
    parentBody: "Comet 55P/Tempel-Tuttle",
    velocity: "71 km/s (extremely fast)",
    difficulty: "Easy - spectacular speed"
  },
  {
    id: "geminids",
    name: "Geminids",
    peakDate: "December 13-14, 2025",
    peakDateStart: "2025-12-13",
    peakDateEnd: "2025-12-14",
    ratePerHour: "Up to 120",
    bestLocation: "Both Hemispheres",
    description: "Brightest and most reliable meteor shower of the year. Multicolored meteors with medium speed.",
    featured: true,
    radiant: "Constellation Gemini",
    moonPhase: "Waning Gibbous (some interference)",
    bestViewingTime: "9 PM onwards - all night",
    visibility: "Excellent worldwide",
    parentBody: "Asteroid 3200 Phaethon",
    velocity: "35 km/s (medium speed)",
    difficulty: "Easy - year's best show"
  },
  {
    id: "ursids",
    name: "Ursids",
    peakDate: "December 21-22, 2025",
    peakDateStart: "2025-12-21",
    peakDateEnd: "2025-12-22",
    ratePerHour: "Up to 10",
    bestLocation: "Northern Hemisphere",
    description: "Minor shower that closes out the year. Best viewed in very dark skies.",
    radiant: "Constellation Ursa Minor",
    moonPhase: "Waning Crescent (favorable)",
    bestViewingTime: "After midnight",
    visibility: "Best from northern latitudes",
    parentBody: "Comet 8P/Tuttle",
    velocity: "33 km/s (medium speed)",
    difficulty: "Challenging - low rates but rewarding"
  }
];

export const meteorShowers2026: MeteorShower[] = [
  {
    id: "quadrantids-2026",
    name: "Quadrantids",
    peakDate: "January 3-4, 2026",
    peakDateStart: "2026-01-03",
    peakDateEnd: "2026-01-04",
    ratePerHour: "Up to 120",
    bestLocation: "Northern Hemisphere",
    description: "Sharp, bright meteors with fine trains. Best viewed in dark skies away from moonlight.",
    radiant: "Constellation Boötes",
    moonPhase: "Waxing Gibbous (some interference)",
    bestViewingTime: "After midnight to dawn",
    visibility: "Best from northern latitudes",
    parentBody: "Asteroid 2003 EH1",
    velocity: "41 km/s (medium speed)",
    difficulty: "Moderate - narrow peak window"
  },
  {
    id: "lyrids-2026",
    name: "Lyrids",
    peakDate: "April 22-23, 2026",
    peakDateStart: "2026-04-22",
    peakDateEnd: "2026-04-23",
    ratePerHour: "Up to 20",
    bestLocation: "Both Hemispheres",
    description: "Fast meteors that can leave persistent glowing dust trails in the atmosphere.",
    radiant: "Constellation Lyra",
    moonPhase: "Waxing Crescent (favorable)",
    bestViewingTime: "After midnight",
    visibility: "Visible worldwide",
    parentBody: "Comet C/1861 G1 Thatcher",
    velocity: "49 km/s (very fast)",
    difficulty: "Easy - consistent and reliable"
  },
  {
    id: "eta-aquariids-2026",
    name: "Eta Aquariids",
    peakDate: "May 5-6, 2026",
    peakDateStart: "2026-05-05",
    peakDateEnd: "2026-05-06",
    ratePerHour: "Up to 50",
    bestLocation: "Southern Hemisphere",
    description: "Swift and bright meteors, remnants from Halley's Comet.",
    radiant: "Constellation Aquarius",
    moonPhase: "Waning Gibbous (some interference)",
    bestViewingTime: "Pre-dawn hours",
    visibility: "Best from tropics and southern latitudes",
    parentBody: "Halley's Comet",
    velocity: "66 km/s (very fast)",
    difficulty: "Easy - broad peak"
  },
  {
    id: "delta-aquariids-2026",
    name: "Delta Aquariids",
    peakDate: "July 28-29, 2026",
    peakDateStart: "2026-07-28",
    peakDateEnd: "2026-07-29",
    ratePerHour: "Up to 25",
    bestLocation: "Southern Hemisphere",
    description: "Faint meteors best viewed from tropical and southern latitudes.",
    radiant: "Constellation Aquarius",
    moonPhase: "Waxing Gibbous (some interference)",
    bestViewingTime: "After midnight",
    visibility: "Best from southern tropics",
    parentBody: "Unknown (possibly Comet 96P/Machholz)",
    velocity: "41 km/s (medium speed)",
    difficulty: "Moderate - faint meteors"
  },
  {
    id: "perseids-2026",
    name: "Perseids",
    peakDate: "August 12-13, 2026",
    peakDateStart: "2026-08-12",
    peakDateEnd: "2026-08-13",
    ratePerHour: "Up to 100",
    bestLocation: "Northern Hemisphere",
    description: "The year's most popular meteor shower, known for bright fireballs and long trails.",
    featured: true,
    radiant: "Constellation Perseus",
    moonPhase: "Waning Crescent (favorable)",
    bestViewingTime: "After midnight to dawn",
    visibility: "Excellent from northern latitudes",
    parentBody: "Comet 109P/Swift-Tuttle",
    velocity: "59 km/s (very fast)",
    difficulty: "Easy - reliable and spectacular"
  },
  {
    id: "draconids-2026",
    name: "Draconids",
    peakDate: "October 8-9, 2026",
    peakDateStart: "2026-10-08",
    peakDateEnd: "2026-10-09",
    ratePerHour: "Up to 10",
    bestLocation: "Northern Hemisphere",
    description: "Unusual shower best viewed in the early evening rather than after midnight.",
    radiant: "Constellation Draco",
    moonPhase: "Waning Gibbous (some interference)",
    bestViewingTime: "Early evening after sunset",
    visibility: "Best from northern latitudes",
    parentBody: "Comet 21P/Giacobini-Zinner",
    velocity: "20 km/s (slow)",
    difficulty: "Moderate - predictable viewing window"
  },
  {
    id: "orionids-2026",
    name: "Orionids",
    peakDate: "October 21-22, 2026",
    peakDateStart: "2026-10-21",
    peakDateEnd: "2026-10-22",
    ratePerHour: "Up to 25",
    bestLocation: "Both Hemispheres",
    description: "Another gift from Halley's Comet. Fast meteors with persistent trains.",
    radiant: "Constellation Orion",
    moonPhase: "Waxing Crescent (favorable)",
    bestViewingTime: "After midnight to dawn",
    visibility: "Visible worldwide",
    parentBody: "Halley's Comet",
    velocity: "66 km/s (very fast)",
    difficulty: "Easy - excellent conditions"
  },
  {
    id: "southern-taurids-2026",
    name: "Southern Taurids",
    peakDate: "November 4-5, 2026",
    peakDateStart: "2026-11-04",
    peakDateEnd: "2026-11-05",
    ratePerHour: "Up to 10",
    bestLocation: "Both Hemispheres",
    description: "Known for producing bright fireballs and slow-moving meteors.",
    radiant: "Constellation Taurus",
    moonPhase: "Full Moon (unfavorable)",
    bestViewingTime: "After midnight",
    visibility: "Visible worldwide",
    parentBody: "Comet 2P/Encke",
    velocity: "27 km/s (slow)",
    difficulty: "Challenging - moon interference"
  },
  {
    id: "northern-taurids-2026",
    name: "Northern Taurids",
    peakDate: "November 11-12, 2026",
    peakDateStart: "2026-11-11",
    peakDateEnd: "2026-11-12",
    ratePerHour: "Up to 10",
    bestLocation: "Both Hemispheres",
    description: "Companion to Southern Taurids, also known for spectacular fireballs.",
    radiant: "Constellation Taurus",
    moonPhase: "Waning Gibbous (some interference)",
    bestViewingTime: "After midnight",
    visibility: "Visible worldwide",
    parentBody: "Comet 2P/Encke",
    velocity: "29 km/s (slow)",
    difficulty: "Moderate - patient observation rewarded"
  },
  {
    id: "leonids-2026",
    name: "Leonids",
    peakDate: "November 17-18, 2026",
    peakDateStart: "2026-11-17",
    peakDateEnd: "2026-11-18",
    ratePerHour: "Up to 15",
    bestLocation: "Both Hemispheres",
    description: "Fast meteors known for periodic meteor storms every 33 years.",
    radiant: "Constellation Leo",
    moonPhase: "Waning Crescent (favorable)",
    bestViewingTime: "After midnight to dawn",
    visibility: "Visible worldwide",
    parentBody: "Comet 55P/Tempel-Tuttle",
    velocity: "71 km/s (extremely fast)",
    difficulty: "Easy - spectacular speed"
  },
  {
    id: "geminids-2026",
    name: "Geminids",
    peakDate: "December 13-14, 2026",
    peakDateStart: "2026-12-13",
    peakDateEnd: "2026-12-14",
    ratePerHour: "Up to 120",
    bestLocation: "Both Hemispheres",
    description: "Brightest and most reliable meteor shower of the year. Multicolored meteors with medium speed.",
    featured: true,
    radiant: "Constellation Gemini",
    moonPhase: "Waning Crescent (favorable)",
    bestViewingTime: "9 PM onwards - all night",
    visibility: "Excellent worldwide",
    parentBody: "Asteroid 3200 Phaethon",
    velocity: "35 km/s (medium speed)",
    difficulty: "Easy - year's best show"
  },
  {
    id: "ursids-2026",
    name: "Ursids",
    peakDate: "December 21-22, 2026",
    peakDateStart: "2026-12-21",
    peakDateEnd: "2026-12-22",
    ratePerHour: "Up to 10",
    bestLocation: "Northern Hemisphere",
    description: "Minor shower that closes out the year. Best viewed in very dark skies.",
    radiant: "Constellation Ursa Minor",
    moonPhase: "Waxing Crescent (favorable)",
    bestViewingTime: "After midnight",
    visibility: "Best from northern latitudes",
    parentBody: "Comet 8P/Tuttle",
    velocity: "33 km/s (medium speed)",
    difficulty: "Moderate - low rates but clear skies"
  }
];

// Combine all meteor showers
export const allMeteorShowers = [...meteorShowers2025, ...meteorShowers2026];

// Helper function to get next upcoming meteor showers
export function getUpcomingMeteorShowers(count: number = 3): MeteorShower[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter showers that haven't ended yet from all years
  const upcoming = allMeteorShowers.filter(shower => {
    const endDate = new Date(shower.peakDateEnd);
    endDate.setHours(23, 59, 59, 999);
    return endDate >= today;
  });
  
  // Sort by peak date
  upcoming.sort((a, b) => {
    const dateA = new Date(a.peakDateStart);
    const dateB = new Date(b.peakDateStart);
    return dateA.getTime() - dateB.getTime();
  });
  
  return upcoming.slice(0, count);
}

// Helper function to get meteor shower by ID
export function getMeteorShowerById(id: string): MeteorShower | undefined {
  return allMeteorShowers.find(shower => shower.id === id);
}
