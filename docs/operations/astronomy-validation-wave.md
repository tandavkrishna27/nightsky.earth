# Independent astronomy validation — 2026-10-13

This wave adds 26 offline tests in `tests/nightsky/reference-horizon.test.ts`. It complements the existing 12 USNO season and Moon-phase fixtures in `reference-astronomy.test.ts`. Expected numbers were transcribed from independent NASA/JPL output and a NASA eclipse event notice. None were generated from Astronomy Engine, and the tests make no network requests. Reviewed reference dates are in 2024 and 2026; these tests do not establish an accuracy claim for arbitrary historical or future dates.

## Sources and conventions

The primary numerical source is [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html), API 1.2, queried 2026-10-13. The reference observer is geodetic latitude 38.9° N, east-positive longitude -77°, height 0 km. Query parameters:

```text
https://ssd.jpl.nasa.gov/api/horizons.api
format=text
COMMAND='10'                 # replace with target ID below
EPHEM_TYPE='OBSERVER'
CENTER='coord@399'
COORD_TYPE='GEODETIC'
SITE_COORD='-77,38.9,0'
START_TIME='2026-01-15 17:00'
STOP_TIME='2026-01-15 17:01'
STEP_SIZE='1 m'
QUANTITIES='4'
APPARENT='AIRLESS'
```

[A reproducible Sun query](https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND=%2710%27&EPHEM_TYPE=%27OBSERVER%27&CENTER=%27coord%40399%27&COORD_TYPE=%27GEODETIC%27&SITE_COORD=%27-77,38.9,0%27&START_TIME=%272026-01-15%2017:00%27&STOP_TIME=%272026-01-15%2017:01%27&STEP_SIZE=%271%20m%27&QUANTITIES=%274%27&APPARENT=%27AIRLESS%27) returns target-center apparent topocentric elevation and azimuth. Light time, aberration, gravitational light deflection, precession and nutation are included; atmospheric refraction is disabled. Elevation is measured above the local plane perpendicular to the reference ellipsoid zenith. Azimuth runs clockwise from north. The center frame is ITRF93. Modern output timestamps are UTC, despite the printed UT heading. The Sun response reported DE441, EOP `eop.261012.p270108`, with data-based Earth orientation through 2026-Oct-12. These are reference calculations, not measured atmospheric visibility.

The implementation uses apparent topocentric equatorial coordinates of date followed by an unrefracted horizon transformation. Its user-facing phrase “geometric horizon” means no atmospheric refraction or terrain correction; it does not imply omission of apparent-place ephemeris corrections. Refraction must stay disabled when comparing these fixtures. Geocentric Moon altitude would be a different quantity because of parallax.

Astronomy Engine 2.1.19 approximates UTC and UT1 as equal and uses its default Espenak/Meeus polynomial ΔT conversion to Terrestrial Time; the application does not override that default. Algorithm provenance is recorded in [the preceding data review](next-wave-data-review.md) and [NASA's ΔT polynomial description](https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html). Horizons instead uses its EOP file for Earth rotation and its internal dynamical-time-to-UTC conversion/leap-second history. The fixture tolerances allow these convention differences; no attempt is made to tune the engine to reproduce Horizons.

## Body samples

Each row below was read from the two-minute-row Horizons response; the test asserts the larger elevation and its accompanying azimuth over the one-minute window. This exercises the actual target result, including the endpoint, rather than exporting a test-only position function. Tolerance is 0.03° for elevation and circular azimuth difference. This is an engineering regression bound allowing engine/Earth-orientation differences, not a published guarantee of physical accuracy. It is much smaller than atmospheric refraction at the lower-altitude reference targets.

All dates are 2026-01-15, Washington observer above; hours are UTC.

| Body / ID | Hours | Start elevation / azimuth (°) | End elevation / azimuth (°) | Horizons target ephemeris |
|---|---|---|---|---|
| Sun / 10 | 17:00–17:01 | 29.928760 / 175.296728 | 29.944384 / 175.565340 | DE441 |
| Moon / 301 | 17:00–17:01 | 15.035894 / 210.698387 | 14.938926 / 210.895518 | DE441 |
| Mercury / 199 | 17:00–17:01 | 27.618583 / 179.286395 | 27.620707 / 179.544629 | DE441 |
| Venus / 299 | 17:00–17:01 | 29.161953 / 172.713344 | 29.186314 / 172.977843 | DE441 |
| Mars / 499 | 17:00–17:01 | 28.775661 / 176.895542 | 28.785846 / 177.159381 | mar099 |
| Jupiter / 599 | 01:00–01:01 | 37.817702 / 90.531133 | 38.012870 / 90.690220 | jup365_merged |
| Saturn / 699 | 17:00–17:01 | 16.989468 / 108.686420 | 17.174160 / 108.863082 | sat441l |
| Uranus / 799 | 01:00–01:01 | 70.380826 / 171.810898 | 70.407435 / 172.510948 | ura184_merged |
| Neptune / 899 | 17:00–17:01 | 16.732564 / 105.864644 | 16.920140 / 106.038266 | nep098_merged |
| Pluto / 999 | 17:00–17:01 | 26.743575 / 166.335078 | 26.789246 / 166.588145 | plu060_merged |

Three negative elevation cases assert no above-horizon interval: Jupiter at 17:00/17:01 (-28.760851/-28.752725°), Uranus at 17:00/17:01 (-10.514262/-10.355812°), Pluto at 01:00/01:01 (-26.435035/-26.627554°). A separate rising Moon sample at 13:00/13:01 (18.570104/18.641313°) checks the astronomy window's sampled maximum and timestamp, also at 0.03° tolerance.

Moon illuminated disk fraction uses a separate geocentric reference, matching the product's place-independent illumination. Query Moon 301 with `CENTER='500@399'`, omit `COORD_TYPE` and `SITE_COORD`, use `QUANTITIES='10'`, and keep January 15 2026 13:00–13:01 UTC and one-minute cadence. Horizons reports 10.17550 and 10.17151 percent. The 13:00:30 midpoint is checked against approximately 10.1735 percent with 0.05 percentage-point tolerance for model differences. This is a single illumination reference, distinct from the existing USNO phase-event timing fixtures.

## Twilight and horizon crossings

For Sun ID 10 at Washington, query 2026-01-15 22:00 to 2026-01-16 13:00 with one-minute steps and the same AIRLESS settings. Consecutive reference elevations bracket the threshold crossings below. The tests allow ten seconds beyond either bracket endpoint for engine/time-model differences; they do not claim a computed second-precision reference instant.

| Threshold | Evening UTC bracket / elevations (°) | Morning UTC bracket / elevations (°) |
|---|---|---|
| Civil -6° | Jan 15 22:39–22:40 / -5.929221, -6.109245 | Jan 16 11:55–11:56 / -6.093228, -5.912877 |
| Nautical -12° | Jan 15 23:12–23:13 / -11.963075, -12.148661 | Jan 16 11:22–11:23 / -12.142651, -11.956784 |
| Astronomical -18° | Jan 15 23:44–23:45 / -17.967976, -18.157614 | Jan 16 10:50–10:51 / -18.159928, -17.970049 |

Four-minute windows ending 22:40 Jan 15 and 11:57 Jan 16 check clipping when a crossing lies in the final partial sampling step. Target visibility also checks the Sun's airless center at 0°: Jan 15 22:05/22:06 (+0.067215/-0.105406°), and Jan 16 12:29/12:30 (-0.077414/+0.095587°). Those latter queries cover 21:00–23:00 Jan 15 and 12:00–13:00 Jan 16. Refracted upper-limb sunrise/sunset is deliberately not substituted for a center crossing. Even a short window crossing the horizon must produce a positive-duration interval.

## Polar cases

Sun ID 10, AIRLESS, June 20 2026 00:00 to June 21 00:00 UTC:

- Tromso site `(18.96,69.65,0)`, six-hour steps: elevations at 00/06/12/18/24 are 4.034827, 28.324903, 42.480695, 15.746629, 4.035049°. The expected state is no astronomical darkness.
- South Pole site `(0,-90,0)`, twelve-hour steps: 00/12/24 elevations are -23.433886, -23.437665, -23.439720°. The expected state is continuous astronomical darkness and the full selected window is returned.

These exercise states far from grazing thresholds. They do not establish accuracy for a tangent crossing or polar day/night transition.

## Local solar eclipse contacts

[NASA's Dallas Cotton Bowl event notice](https://solarsystem.nasa.gov/events/318/sun-moon-and-you-dallas-cotton-bowl-solar-eclipse/?category=eclipses_general) publishes April 8 2024 partial beginning 12:23 CDT, partial ending 15:02 CDT, totality 13:40–13:44 CDT. CDT is UTC-5, so the fixture's C1/C4 references are 17:23/20:02 UTC and local maximum must be within 18:40–18:44 UTC.

The test uses Dallas city coordinates 32.78° N, -96.8°, zero elevation. The publication is a venue notice with minute precision, rather than a precise numerical table for that city coordinate. A 120-second bound on the two partial contacts accounts for rounding and city-versus-venue location differences. The source provides a totality interval, so maximum is tested inside that interval; an invented exact peak time is not used. Local eclipse visibility is expected to be visible. A separate window 17:25–17:35 UTC, wholly in the partial phase and ending before maximum, must still return the eclipse.

This validates C1/C4 timing and local maximum at a daytime total eclipse. It does not independently validate the implementation's refracted solar contact altitudes, C2/C3 (not exposed by the API), obscuration, lunar shadow contacts or visibility at sunrise/sunset. Those remain useful follow-up reference fixtures.

## Defects reproduced and fixed

The first run of the new reference file failed 14 of 23 tests: ten short target windows ended at their starting sample, two twilight tail crossings were missed, the rising Moon maximum omitted the endpoint, and an eclipse overlapping the window before maximum was absent. Two added target crossing regressions subsequently failed because rising/setting four-minute windows produced zero-duration intervals or incorrect crossing bounds.

The astronomy sampling helper now includes the endpoint once, even for a final partial step. Target horizon transitions are bisected inside each sampling bracket and only positive-duration groups are returned. The solar eclipse iteration limit now compares first partial contact to the requested end rather than comparing maximum, allowing pre-maximum overlap. Maximum altitudes remain sampled estimates; they are not continuous optimization results.

Focused verification: 47 tests passed across `astronomy.test.ts`, `reference-astronomy.test.ts` and `reference-horizon.test.ts` on Windows/Node, 2026-10-13. TypeScript check passed. An intermediate aggregate run passed 206 tests before the latest reference additions and root integration; final aggregate counts are recorded by the parent workstream. The mislabeled mid-latitude fixture now uses Madrid instead of Quito and checks a normal state with positive-duration intervals.

## Remaining evidence gaps

USNO API requests for new one-day/eclipses data reset their connections during this wave; JPL supplied the horizon fixtures. Existing USNO season/phase tests remain in place. The new coverage gives independently bounded twilight, supported-body altitude/azimuth, polar state and local solar partial contacts; it does not certify all dates/locations or observing conditions. Add independent grazing polar cases, southern mid-latitude altitude samples, local lunar eclipse contact/visibility references, and solar eclipses near the horizon before claiming those numerical boundaries are validated. The fixed-J2000 Milky Way core approximation also has no independent numerical fixture in this wave.

## Final integration verification — 13 October 2026

The reference suite is imported in the default aggregate runner. Windows and clean Linux each pass 207 tests, typecheck and build; real MCP astronomy and target calls return schema-valid structured content. Independent review approved Task 5 local completion against the explicit plan criteria, with remaining numerical boundaries above retained. Task 6 source/radiant and broader event gates remain open.
