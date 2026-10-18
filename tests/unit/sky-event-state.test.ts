import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCalendarState, calendarHref } from "../../shared/skyEventRoutes";
const defaults = {
  month: "2026-10",
  category: "all",
  view: "month",
  tz: "UTC",
} as const;
test("URL state validates values, aliases, range and preserves unrelated params", () => {
  assert.deepEqual(
    parseCalendarState(
      "?month=2026-99&view=bad&tz=invalid&category=oops",
      defaults,
    ),
    defaults,
  );
  assert.equal(
    parseCalendarState("?tz=Asia%2FCalcutta", defaults).tz,
    "Asia/Calcutta",
  );
  const state = parseCalendarState(
    "?month=2027-02&view=list&tz=Asia%2FKolkata&category=eclipses",
    defaults,
  );
  assert.equal(state.month, "2027-02");
  assert.equal(state.category, "eclipses");
  assert.match(calendarHref(state, "?ref=home"), /ref=home/);
  assert.deepEqual(
    parseCalendarState(calendarHref(state).split("?")[1], defaults),
    state,
  );
  assert.equal(parseCalendarState("?month=1800-01", defaults).month, "2026-10");
});
