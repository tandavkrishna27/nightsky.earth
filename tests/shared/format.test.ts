import assert from "node:assert/strict";
import test from "node:test";
import { formatForecastValue, formatLocalInstant } from "../../shared/nightsky/format";
test("forecast display uses requested units without changing source values", () => {
  const source = { value: 10, unit: "m/s" };
  assert.equal(formatForecastValue(source, "imperial", "en-US"), "22.369 mph");
  assert.deepEqual(source, { value: 10, unit: "m/s" });
  assert.equal(formatForecastValue({ value: 0, unit: "°C" }, "imperial", "en-US"), "32 °F");
  assert.equal(formatForecastValue({ value: 25.4, unit: "mm" }, "imperial", "en-US"), "1 in");
  assert.equal(formatForecastValue({ value: 1.609344, unit: "km" }, "imperial", "en-US"), "1 mi");
  assert.equal(formatForecastValue({ value: 1.5, unit: "m/s" }, "metric", "de-DE"), "1,5 m/s");
  assert.equal(formatForecastValue({ value: 50, unit: "%" }, "imperial", "en-US"), "50 %");
});
test("display time uses the named timezone and valid BCP47 locale", () => {
  const text = formatLocalInstant("2026-01-15T14:00:00Z", "Asia/Kolkata", "en-GB");
  assert.match(text, /19:30/);
  assert.match(text, /Asia\/Kolkata/);
  assert.throws(() => formatForecastValue({ value: Infinity, unit: "%" }, "metric", "en"));
  assert.throws(() => formatForecastValue({ value: 1, unit: "%" }, "metric", "not_a_locale"));
  assert.throws(() => formatLocalInstant("bad", "UTC", "en"));
});
