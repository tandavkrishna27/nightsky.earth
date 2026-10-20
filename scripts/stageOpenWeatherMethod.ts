import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const defaultSource = fileURLToPath(
  new URL("../public/openweather-normalization-method.json", import.meta.url),
);
const defaultDestination = fileURLToPath(
  new URL("../dist/public/openweather-normalization-method.json", import.meta.url),
);

/** Copy the reviewed method into Netlify's published website directory verbatim. */
export async function stageOpenWeatherMethod(
  source: string | URL = defaultSource,
  destination: string | URL = defaultDestination,
): Promise<number> {
  const sourceInfo = await stat(source);
  if (!sourceInfo.isFile() || sourceInfo.size === 0 || sourceInfo.size > 64 * 1024) {
    throw new Error("Invalid OpenWeather alteration method file size or type.");
  }

  const reviewedBytes = await readFile(source);
  let method: unknown;
  try {
    method = JSON.parse(reviewedBytes.toString("utf8"));
  } catch {
    throw new Error("OpenWeather alteration method must be valid JSON.");
  }
  const value = method as {
    schemaVersion?: unknown;
    license?: unknown;
    source?: { endpoint?: unknown; credentials?: unknown };
    credit?: { text?: unknown; providerUrl?: unknown };
  };
  if (
    value.schemaVersion !== 1 ||
    value.license !== "https://opendatacommons.org/licenses/odbl/1-0/" ||
    value.source?.endpoint !== "https://api.openweathermap.org/data/2.5/forecast" ||
    value.source?.credentials !== "Not included. lat/lon select the requested point." ||
    value.credit?.text !== "Weather data provided by OpenWeather" ||
    value.credit?.providerUrl !== "https://openweathermap.org/"
  ) {
    throw new Error("OpenWeather alteration method identity, rights or credit fields are invalid.");
  }

  const destinationPath = typeof destination === "string"
    ? destination
    : fileURLToPath(destination);
  await mkdir(dirname(destinationPath), { recursive: true });
  await copyFile(source, destinationPath);
  const stagedBytes = await readFile(destinationPath);
  if (!reviewedBytes.equals(stagedBytes)) {
    throw new Error("Staged OpenWeather alteration method differs from the reviewed source.");
  }
  return stagedBytes.byteLength;
}
