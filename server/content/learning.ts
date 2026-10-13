import { sourceRecordSchema, type SourceRecord } from "../../shared/nightsky/common";

export type LearningActivity = "learning" | "astrophotography" | "deep-sky-imaging" | "eclipse";
export type LearningExperience = "beginner" | "intermediate" | "advanced";
export type SkyHemisphere = "north" | "south" | "equatorial" | "unknown";

export interface LearningGear {
  cameraModel: string;
  lensFocalLengthMm: number;
  lensMaximumAperture: number;
  support: "tripod" | "tracking-mount";
}

export interface LearningGuidance {
  guidance: string[];
  sources: SourceRecord[];
  /** Present only when the caller supplied enough camera, lens, and support details. */
  cameraSettings?: string[];
}

const SOURCES = {
  nasaSkywatching: sourceRecordSchema.parse({
    name: "NASA Skywatching FAQ",
    url: "https://science.nasa.gov/skywatching/faq/",
    attribution: "Night-sky learning guidance links to NASA's Skywatching FAQ; NightSky.earth provides an original summary.",
    dataClass: "context",
    product: "Skywatching FAQ",
  }),
  nasaSmartphoneAstro: sourceRecordSchema.parse({
    name: "NASA Smartphone Astrophotography",
    url: "https://science.nasa.gov/solar-system/skywatching/night-sky-network/astrophotography-with-your-smartphone/",
    attribution: "Beginner astrophotography guidance links to NASA's Night Sky Network article; NightSky.earth provides an original summary.",
    dataClass: "context",
    product: "Astrophotography with your smartphone",
  }),
  esoSouthernCross: sourceRecordSchema.parse({
    name: "European Southern Observatory: Navigating the Southern Cross",
    url: "https://www.eso.org/public/blog/navigating-the-stars/",
    attribution: "Southern-sky orientation guidance links to the European Southern Observatory; NightSky.earth provides an original summary.",
    dataClass: "context",
    product: "Navigating the stars: the Southern Cross",
  }),
  nasaEclipseSafety: sourceRecordSchema.parse({
    name: "NASA Eclipse Eye Safety",
    url: "https://science.nasa.gov/eclipses/safety/",
    attribution: "Solar viewing safety guidance links to NASA's Eclipse Eye Safety page; NightSky.earth provides an original summary.",
    dataClass: "context",
    product: "Eclipse Viewing Safety",
  }),
} satisfies Record<string, SourceRecord>;

export function getLearningGuidance(input: {
  activity: LearningActivity;
  experience?: LearningExperience;
  hemisphere?: SkyHemisphere;
  gear?: LearningGear;
}): LearningGuidance {
  const guidance: string[] = [];
  const sourceKeys = new Set<keyof typeof SOURCES>();

  if (input.activity === "learning") {
    sourceKeys.add("nasaSkywatching");
    guidance.push("Start with your unaided eyes: choose one bright planet, the Moon, or a familiar star pattern, and use a sky chart to check its direction and time.");
    guidance.push("Give your eyes about 30 minutes to adapt to darkness. Keep screens and lights dim or red when you need them.");
    if (input.hemisphere === "north") guidance.push("In the Northern Hemisphere, Polaris (the North Star) lies close to the north celestial pole and can help orient a sky chart. It is not visible from most of the Southern Hemisphere.");
    else if (input.hemisphere === "south") {
      guidance.push("In the Southern Hemisphere, the Southern Cross and its pointer stars can help you locate the south celestial pole; there is no bright pole star there.");
      sourceKeys.add("esoSouthernCross");
    } else if (input.hemisphere === "equatorial") guidance.push("Near the equator, parts of both celestial hemispheres are visible. Orient yourself with the local horizon and a sky chart for your date and time.");
    else guidance.push("Orient yourself using the local horizon and a sky chart for your location, date, and time; north-sky landmarks are not visible everywhere.");
    guidance.push("Choose one learning goal for the session, such as finding a constellation, following the Moon's phase, or identifying a bright planet.");
  }

  if (input.activity === "astrophotography" || input.activity === "deep-sky-imaging") {
    sourceKeys.add("nasaSmartphoneAstro");
    if (input.experience === "advanced") guidance.push("For a next step, learn how your mount tracks the sky, then practice calibration and image stacking with a target that fits your equipment.");
    else if (input.experience === "intermediate") guidance.push("Practice repeatable focus and framing: take a test frame, inspect star shapes, then change one setting at a time.");
    else guidance.push("Begin with a bright, forgiving target and a steady support. A phone or camera timer can reduce shake; review a test frame before changing equipment.");
    if (!input.gear) guidance.push("Camera-specific shutter, ISO, and focus settings depend on your camera, lens, support, and sky. Share your camera and lens details plus how you will support the camera before asking for a tailored starting point.");
  }

  if (input.activity === "eclipse") {
    sourceKeys.add("nasaEclipseSafety");
    guidance.push("For every partial or annular solar-eclipse phase, look only through an undamaged solar viewer that meets ISO 12312-2. Ordinary sunglasses are not safe.");
    guidance.push("Never look through an optical device, including binoculars, a telescope, or a camera viewfinder, while wearing eclipse glasses. Those optics need a purpose-built solar filter secured over the front aperture.");
    guidance.push("During a total solar eclipse, direct viewing without a filter is safe only during the brief totality when the Moon completely covers the Sun's bright face; use protection again before any bright solar surface returns.");
  }

  const result: LearningGuidance = { guidance, sources: Array.from(sourceKeys).map((key) => SOURCES[key]) };
  if (input.gear) {
    result.cameraSettings = ["With the camera, lens, and support details supplied, use them as a starting context: take a short test exposure, inspect the stars, and adjust one control at a time. Exact shutter and ISO values still depend on the sky, target, and whether the mount tracks."];
  }
  return result;
}
