import assert from "node:assert/strict";
import test from "node:test";
import { getLearningGuidance } from "../../server/content/learning";

test("explainsSkyOrientationForHemisphere", () => {
  const north = getLearningGuidance({ activity: "learning", hemisphere: "north" });
  const south = getLearningGuidance({ activity: "learning", hemisphere: "south" });
  const equatorial = getLearningGuidance({ activity: "learning", hemisphere: "equatorial" });
  assert.ok(north.guidance.some((tip) => /Polaris|North Star/i.test(tip)));
  assert.ok(south.guidance.some((tip) => /Southern Cross|South Celestial Pole/i.test(tip)));
  assert.ok(equatorial.guidance.some((tip) => /both celestial hemispheres/i.test(tip)));
});

test("listsAstrophotographyLearningByExperience", () => {
  const beginner = getLearningGuidance({ activity: "astrophotography", experience: "beginner" });
  const intermediate = getLearningGuidance({ activity: "astrophotography", experience: "intermediate" });
  const advanced = getLearningGuidance({ activity: "astrophotography", experience: "advanced" });
  assert.ok(beginner.guidance.some((tip) => /steady|tripod/i.test(tip)));
  assert.ok(intermediate.guidance.some((tip) => /focus|test frame/i.test(tip)));
  assert.ok(advanced.guidance.some((tip) => /tracking|calibration|stacking/i.test(tip)));
});

test("requiresGearBeforeGivingSettings", () => {
  const guide = getLearningGuidance({ activity: "astrophotography", experience: "beginner" });
  assert.equal(guide.cameraSettings, undefined);
  assert.ok(guide.guidance.some((tip) => /camera and lens details/i.test(tip)));
  const equipped = getLearningGuidance({ activity: "astrophotography", experience: "beginner", gear: { cameraModel: "Example body", lensFocalLengthMm: 24, lensMaximumAperture: 1.8, support: "tripod" } });
  assert.ok(equipped.cameraSettings?.length);
});

test("includesReusableSourceCitation", () => {
  const guide = getLearningGuidance({ activity: "astrophotography", experience: "beginner" });
  assert.ok(guide.sources.some((source) => source.name === "NASA Smartphone Astrophotography" && source.url.startsWith("https://science.nasa.gov/")));
  assert.ok(guide.sources.every((source) => source.attribution.length > 0 && source.dataClass === "context"));
});

test("includesSolarEclipseEyeSafetyReference", () => {
  const guide = getLearningGuidance({ activity: "eclipse" });
  assert.ok(guide.guidance.some((tip) => /ISO 12312-2|certified solar viewer/i.test(tip)));
  assert.ok(guide.guidance.some((tip) => /optical device/i.test(tip)));
  assert.ok(guide.sources.some((source) => source.name === "NASA Eclipse Eye Safety"));
});
