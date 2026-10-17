import type { SourceRecord } from '../../shared/nightsky/common';
import type { PlanResult } from '../../shared/nightsky/planning';
import { formatLocalInstant } from '../../shared/nightsky/format';
import { resolveMeteorIdentity } from '../../shared/nightsky/meteors';

const plain = (value: string) => value.replace(/[\\[\]<>`*_~\r\n]/g, ' ').replace(/\s+/g, ' ').trim();

const sourceKey = (source: SourceRecord) => JSON.stringify(Object.entries(source).sort(([a], [b]) => a.localeCompare(b)));

/** Select answer references without deleting the full catalogue provenance.
 * Only event-inventory-only records are filtered; shared or distinct credits
 * used by location, weather or other evidence remain intact. */
export function planAnswerSources(plan: PlanResult, target?: string): SourceRecord[] {
  const events = plan.evidence?.events;
  if (!events) return plan.sources;
  const inventory = new Set(events.sources.map(sourceKey));
  const evidence = plan.evidence;
  const used = [
    ...plan.place.sources,
    ...(evidence?.astronomy?.sources ?? []), ...(evidence?.target?.sources ?? []),
    ...(evidence?.weather?.sources ?? []), ...(evidence?.weather?.forecasts.map(row => row.source) ?? []),
    ...(evidence?.location?.sources ?? []), ...(evidence?.history?.sources ?? []),
    ...(evidence?.aurora?.sources ?? []), ...(evidence?.candidates?.sources ?? []),
    ...(evidence?.candidates?.candidates.flatMap(row => row.sources) ?? []),
    ...(plan.suggestions?.flatMap(row => row.sources) ?? []),
  ];
  const meteorEvents = events.events.filter(event => event.eventType === 'meteor-shower');
  // Match the planner's single-shower inference when no explicit target exists.
  const code = plan.goal === 'meteor-shower'
    ? target ? resolveMeteorIdentity(target) : meteorEvents.length === 1
      ? resolveMeteorIdentity(meteorEvents[0].name) ?? resolveMeteorIdentity(meteorEvents[0].eventId.split(':').at(-1)!)
      : undefined
    : undefined;
  const relevantEvents = events.events.filter(event => plan.goal !== 'meteor-shower' || event.eventType === 'meteor-shower' && (!target || code !== undefined && (resolveMeteorIdentity(event.name) === code || resolveMeteorIdentity(event.eventId.split(':').at(-1)!) === code)));
  used.push(...relevantEvents.map(event => event.source));
  if (code) {
    used.push(...(events.meteorCivilGuidance?.filter(row => row.code === code).map(row => row.source) ?? []));
    used.push(...(events.meteorCalendarGuidance?.entries.filter(row => row.code === code).map(row => row.source) ?? []));
    used.push(...(events.meteorTypicalSeasons?.filter(row => row.code === code).map(row => row.source) ?? []));
  }
  const relevant = new Set(used.map(sourceKey));
  for (const sample of evidence?.meteorRadiantSamples ?? []) {
    if (sample.status === 'available' && (!target || code !== undefined && sample.code === code)) {
      // Model samples retain their own source shape; match its exact public URL.
      for (const source of plan.sources) if (source.url === sample.source.url) relevant.add(sourceKey(source));
    }
  }
  return plan.sources.filter(source => !inventory.has(sourceKey(source)) || relevant.has(sourceKey(source)));
}

/** Complete HTTP(S) source links, never truncated URLs or inferred provider identities. */
export function sourceLinkedText(text: string, sources: SourceRecord[]): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  let bytes = 0;
  let omitted = false;
  for (const source of sources) {
    let url: URL;
    try { url = new URL(source.url); } catch { omitted = true; continue; }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) { omitted = true; continue; }
    const href = url.href.replace(/[<>]/g, char => encodeURIComponent(char));
    if (seen.has(href)) continue;
    seen.add(href);
    const line = `- [${plain(source.name)}](<${href}>)`;
    if (bytes + Buffer.byteLength(line, 'utf8') > 7_000) { omitted = true; continue; }
    lines.push(line); bytes += Buffer.byteLength(line, 'utf8') + 1;
  }
  const note = omitted ? '\nAdditional source records remain in structuredContent.sources; no URL was shortened.' : '';
  return `${text}\n\nSources:\n${lines.join('\n')}${note}`;
}

type Interval = { startUtc: string; endUtc: string };

/** Subtract nested threshold coverage; endpoints remain clipped session bounds. */
function twilightPhases(outer: Interval[], inner: Interval[], window: PlanResult['requestedWindow']): string[] {
  return outer.flatMap(row => {
    let pieces = [{ start: Math.max(Date.parse(row.startUtc), Date.parse(window.startUtc)), end: Math.min(Date.parse(row.endUtc), Date.parse(window.endUtc)) }];
    for (const cut of inner) {
      const a = Date.parse(cut.startUtc), b = Date.parse(cut.endUtc);
      pieces = pieces.flatMap(piece => b <= piece.start || a >= piece.end ? [piece] : [
        { start: piece.start, end: Math.min(a, piece.end) },
        { start: Math.max(b, piece.start), end: piece.end },
      ].filter(piece => piece.end > piece.start));
    }
    return pieces.filter(piece => piece.end > piece.start).map(piece => `START ${formatLocalInstant(new Date(piece.start).toISOString(), window.timeZone, 'en')}; END ${formatLocalInstant(new Date(piece.end).toISOString(), window.timeZone, 'en')}`);
  });
}

/** A bounded answer-ready view. Detailed geometry remains available without becoming setup advice. */
export function planAnswerText(plan: PlanResult, options: {target?: string; includeSourceLinks?: boolean} = {}): string {
  const lines = [
    plan.summary,
    `Calculation basis: ${plan.place.catalogueRevision ? 'selected candidate representative point' : 'named city record, not a selected observing site'}. Display time zone: ${plan.requestedWindow.timeZone}${plan.place.timeZoneBasis === 'explicit-display' ? '; actual site time zone remains unverified' : ''}.`,
    `Requested session: ${formatLocalInstant(plan.requestedWindow.startUtc, plan.requestedWindow.timeZone, 'en')} to ${formatLocalInstant(plan.requestedWindow.endUtc, plan.requestedWindow.timeZone, 'en')}.`,
  ];
  // Put provider facts and exclusive phases ahead of potentially lengthy geometry.
  const forecasts = plan.evidence?.weather?.forecasts ?? [];
  if (!forecasts.length) lines.push('Weather forecast values and issue times unknown; no continuous coverage is established.');
  for (let forecastIndex = 0; forecastIndex < forecasts.length; forecastIndex++) {
    const forecast = forecasts[forecastIndex];
    const name = Array.from(plain(forecast.source.name));
    const times = forecast.samples.map(sample => sample.validAt).sort((a, b) => Date.parse(a) - Date.parse(b));
    lines.push(`Forecast ${forecastIndex + 1}: ${name.slice(0, 40).join('')}${name.length > 40 ? '...' : ''} issued ${forecast.source.issuedAt ?? 'at an unavailable time'}; ${times.length} samples, ${times.length ? `valid sample range ${times[0]} to ${times[times.length - 1]}` : 'valid times unknown; values unknown'}; availability ${forecast.availability.status}.`);
    // Deterministic examples, never the clearest sample or an inferred coverage period.
    const sample = forecast.samples[0];
    if (sample) {
      const values = Object.entries(sample.values).filter(([, value]) => value !== undefined).slice(0, 1).map(([field, value]) => `${field} ${value!.value} ${plain(value!.unit)} (${value!.periodStartUtc && value!.periodEndUtc ? `period ${value!.periodStartUtc} to ${value!.periodEndUtc}` : 'instant sample'})`);
      for (const [field, band] of Object.entries(sample.bands ?? {})) { if (band) values.push(`${field} category ${band.code}: ${plain(band.range)} ${plain(band.unit)}`); }
      lines.push(`First sample example, valid ${sample.validAt}: ${values.join('; ')}.`);
    }
    if (forecast.missingFields.length) lines.push(forecast.missingFields.slice(0, 3).map(field => `${field.field} unknown`).join('; ') + '.');
  }
  if (forecasts.length) lines.push('Examples are first samples, not continuous coverage or a clear-night assessment; remaining samples, values and missing-field reasons remain in structuredContent.');
  const astronomy = plan.evidence?.astronomy;
  if (astronomy?.availability.status === 'available' && astronomy.sunBelowGeometricHorizonIntervals !== undefined && astronomy.solarThresholdIntervals !== undefined) {
    const below6 = astronomy.solarThresholdIntervals.filter(row => row.sunAltitudeThresholdDegrees === -6);
    const below12 = astronomy.solarThresholdIntervals.filter(row => row.sunAltitudeThresholdDegrees === -12);
    const below18 = astronomy.solarThresholdIntervals.filter(row => row.sunAltitudeThresholdDegrees === -18);
    for (const [name, outer, inner] of [
      ['Civil', astronomy.sunBelowGeometricHorizonIntervals, below6],
      ['Nautical', below6, below12],
      ['Astronomical', below12, below18],
    ] as const) {
      const phases = twilightPhases(outer, inner, plan.requestedWindow);
      lines.push(`${name} twilight phase: ${phases.length ? phases.join('; ') : 'none within the requested session'}.`);
    }
    lines.push('Twilight uses geometric Sun-centre altitude bands 0 to -6, -6 to -12, and -12 to -18 degrees. Intervals are clipped to this session; a clipped boundary is not a sunrise or sunset event.');
  } else lines.push('Twilight phases unknown: required geometric threshold evidence unavailable.');
  const moon = astronomy?.moon;
  if (moon) lines.push(`Moon illumination ${moon.illuminationPercent.toFixed(1)}%; observing impact remains unknown. Geometric below-horizon timing does not establish minimal moonlight.`);
  if (moon) lines.push(`Moon maximum sampled altitude ${moon.maximumAltitudeDegrees.toFixed(1)} degrees ${moon.maximumAltitudeAtUtc ? `at ${formatLocalInstant(moon.maximumAltitudeAtUtc, plan.requestedWindow.timeZone, 'en')}` : 'at time unknown'}; sampled maximum within this session, not a continuous optimum.`);
  lines.push('No compass-direction setup advice is supplied. Use an on-site sky chart; sampled bearings are not whole-session directions.');
  const names = new Map([...(plan.evidence?.target ? [plan.evidence.target] : []), ...(plan.suggestions ?? [])].map(target => [target.target.targetId, target.target.name]));
  for (const row of plan.candidateWindows) {
    const start = row.localStart ?? formatLocalInstant(row.window.startUtc, row.window.timeZone, 'en');
    const end = row.localEnd ?? formatLocalInstant(row.window.endUtc, row.window.timeZone, 'en');
    lines.push(`${plain(names.get(row.targetId ?? '') ?? 'Geometric opportunity')}: ${start} to ${end}. This is not a best-conditions rating.`);
    for (const overlap of row.darknessOverlapIntervals ?? []) lines.push(`Astronomical-darkness overlap: ${overlap.localStart} to ${overlap.localEnd}.`);
  }
  if (moon) {
    for (const row of moon.belowHorizonIntervals ?? []) lines.push(`Moon centre below geometric horizon: ${row.localStart} to ${row.localEnd}, clipped to this session; not apparent limb moonset.`);
  }
  lines.push(...plan.gaps.map(gap => `Unknown or limitation: ${plain(gap)}`));
  const body: string[] = [];
  let bytes = 0;
  for (const line of lines) {
    if (bytes + Buffer.byteLength(line, 'utf8') > 4_000) break;
    body.push(line); bytes += Buffer.byteLength(line, 'utf8') + 1;
  }
  if (body.length < lines.length) body.push('Further intervals and limitations remain in structuredContent; this view is bounded.');
  return options.includeSourceLinks === false ? body.join('\n') : sourceLinkedText(body.join('\n'), planAnswerSources(plan, options.target));
}
