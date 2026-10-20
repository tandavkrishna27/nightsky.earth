import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stageOpenWeatherMethod } from "../../scripts/stageOpenWeatherMethod";

test("the website stages the reviewed OpenWeather method as identical public JSON bytes", async () => {
  const source = new URL("../../public/openweather-normalization-method.json", import.meta.url);
  const sourceBytes = await readFile(source);
  const parsed = JSON.parse(sourceBytes.toString("utf8"));
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.source.endpoint, "https://api.openweathermap.org/data/2.5/forecast");
  assert.equal(parsed.license, "https://opendatacommons.org/licenses/odbl/1-0/");
  assert.equal(parsed.credit.text, "Weather data provided by OpenWeather");

  const outputDirectory = await mkdtemp(join(tmpdir(), "nightsky-openweather-"));
  try {
    const destination = join(outputDirectory, "openweather-normalization-method.json");
    await stageOpenWeatherMethod(source, destination);
    assert.deepEqual(await readFile(destination), sourceBytes);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});
