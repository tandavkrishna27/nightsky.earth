import type { TargetVisibilityResult } from '../../shared/nightsky/astronomy';
import type { SourceRecord } from '../../shared/nightsky/common';
import type { PlanResult } from '../../shared/nightsky/planning';
import { formatLocalInstant } from '../../shared/nightsky/format';
import {forecastAnswerText} from './forecastAnswerText';
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

/** Complete HTTP(S) source links and returned notices; never infer provider rights. */
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
    const identity = sourceKey(source);
    if (seen.has(identity)) continue;
    seen.add(identity);
    let license: string | undefined;
    if (source.licenseUrl) {
      try {
        const parsed = new URL(source.licenseUrl);
        if (['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password)
          license = parsed.href.replace(/[<>]/g, char => encodeURIComponent(char));
        else omitted = true;
      } catch { omitted = true; }
    }
    const modification = source.modified === true ? ' Source record marks data modified.' : '';
    const line = `- [${plain(source.name)}](<${href}>): ${plain(source.attribution)}${modification}${license ? ` [License](<${license}>)` : ''}`;
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

/** Quote positions at their actual instants; no interpolation or terrain claims. */
export function orientationAnswerText(target: TargetVisibilityResult): string {
  const boundary = (value: string | undefined) => value === 'requested-window' ? 'requested-window cutoff (not rise/set)' : value === 'horizon-crossing' ? 'calculated geometric horizon crossing (not apparent rise/set)' : 'boundary unknown';
  const intervalLines = (target.intervals ?? []).slice(0,1).flatMap(row => {
    const lines = [`${plain(target.target.name)} geometric opportunity: ${plain(row.localStart)} (${boundary(row.startBoundary)}) to ${plain(row.localEnd)} (${boundary(row.endBoundary)}); not a useful-altitude or recommended-session window.`];
    if (Number.isFinite(row.maximumAltitudeDegrees)) {
      const time = row.maximumAltitudeAtUtc ? `at ${row.maximumAltitudeLocal ? plain(row.maximumAltitudeLocal) : 'local time unknown'} [UTC ${row.maximumAltitudeAtUtc}]` : 'at time unknown';
      const bearing = row.azimuthBasis === 'maximum-altitude-sample' && row.maximumAltitudeAtUtc
        ? `azimuth ${row.azimuthDegrees.toFixed(1)} degrees at that maximum sample only, not at other times`
        : 'maximum-sample azimuth basis unknown; no bearing inferred';
      lines.push(`${plain(target.target.name)} maximum sampled altitude ${row.maximumAltitudeDegrees.toFixed(1)} degrees ${time}; sampled maximum within this interval, not a continuous optimum or best observing conditions; ${bearing}.`);
    }
    return lines;
  });
  const samples = target.orientationSamples ?? [];
  if (!samples.length) return [...intervalLines,'Time-specific orientation samples unavailable; use an on-site sky app without inferring a bearing.'].join('\n');
  const lines = [...intervalLines,'Orientation: returned instants only; azimuth is clockwise from true north, altitude is height above the geometric horizon. No refraction; observer elevation assumed zero; terrain and obstructions are not modelled.'];
  for (const sample of samples) lines.push(`${plain(target.target.name)} at ${plain(sample.localTime)} [UTC ${sample.atUtc}]: altitude ${sample.altitudeDegrees.toFixed(1)} degrees; ${sample.altitudeDegrees >= 89 ? 'near zenith: compass direction is unhelpful' : `azimuth ${sample.azimuthDegrees.toFixed(1)} degrees`}${sample.altitudeDegrees <= 0 ? '; at or below the geometric horizon' : '; geometric position, not guaranteed visibility'}.`);
  lines.push('Use your sky app to identify the target; request a new calculation for another time, not an interpolated track.');
  return lines.join('\n');
}

/** Published maxima and sampled geometry are distinct from an observing itinerary. */
export function meteorTimingAnswerText(plan: PlanResult, target?: string): string[] {
  if (plan.goal !== 'meteor-shower') return [];
  const lines=['Meteor timing: a published peak is not a local observing window or a practical itinerary. Calendar guidance and radiant samples do not establish exact activity boundaries or meteor rates.'];
  const code=target?resolveMeteorIdentity(target):undefined;
  const events=(plan.evidence?.events?.events??[]).filter(event=>event.eventType==='meteor-shower' && (!target || code!==undefined && (resolveMeteorIdentity(event.name)===code || resolveMeteorIdentity(event.eventId?.split(':').at(-1)??'')===code))).slice(0,2);
  for(const event of events){
    const label=Array.from(plain(event.name)).slice(0,40).join('');
    const source=Array.from(plain(event.source.name)).slice(0,40).join('');
    if(event.peakUtc)lines.push(`${label}: source-published peak instant ${event.peakUtc} (${formatLocalInstant(event.peakUtc,plan.requestedWindow.timeZone,'en')}); source ${source}; numerical uncertainty not established here. Local darkness/radiant visibility must be checked separately.`);
    else if(event.peakCalendarDateWindow)lines.push(`${label}: published peak calendar range ${event.peakCalendarDateWindow.startDate} to ${event.peakCalendarDateWindow.endDate} (date-only; timezone basis not established); source ${source}; no exact local peak hour inferred.`);
  }
  if(!events.some(event=>event.peakUtc||event.peakCalendarDateWindow))lines.push('Year-specific peak instant/calendar range unavailable in selected event evidence; recurring calendar guidance is not an exact maximum.');
  const samples=(plan.evidence?.meteorRadiantSamples??[]).filter(row=>row.status==='available' && (!target || code!==undefined && resolveMeteorIdentity(row.code)===code));
  const selected=Array.from(new Set([0,Math.floor((samples.length-1)/2),samples.length-1])).map(i=>samples[i]).filter(row=>row!==undefined);
  for(const row of selected){if(row.status!=='available')continue;lines.push(`Radiant ${plain(row.code)} sample; model ${Array.from(plain(row.source.vintage)).slice(0,30).join('')}; ${row.evaluatedAt} (${formatLocalInstant(row.evaluatedAt,plan.requestedWindow.timeZone,'en')}): altitude ${row.altitudeDeg.toFixed(1)} degrees; Moon altitude ${row.moonAltitudeDeg.toFixed(1)} degrees; ${row.annualExtrapolation?'annual extrapolation':'source model'}; point geometry only, not continuous visibility or a viewing-rate forecast.`);}
  if(!samples.length)lines.push('Supported dated radiant samples unavailable; local radiant visibility remains unknown.');
  const kept:string[]=[];let bytes=0;const notice='Further meteor evidence remains in structuredContent; no omitted peak or sample is inferred.';
  for(const line of lines){const size=Buffer.byteLength(line)+(kept.length?1:0);if(bytes+size+Buffer.byteLength(notice)+1>1800){kept.push(notice);break;}kept.push(line);bytes+=size;}
  return kept;
}

/** A bounded answer-ready view. Detailed geometry remains available without becoming setup advice. */
export function planAnswerText(plan: PlanResult, options: {target?: string; includeSourceLinks?: boolean} = {}): string {
  const lines = [
    Array.from(plain(plan.summary)).slice(0,120).join('')+(plan.summary.length>120?' (full summary in structuredContent)':''),
    `Calculation basis: ${plan.place.sourceRevision ? 'selected API source point; representative coordinates, site suitability unverified' : plan.place.catalogueRevision ? 'selected candidate representative point' : 'named city record, not a selected observing site'}. Display time zone: ${plan.requestedWindow.timeZone}${plan.place.timeZoneBasis === 'explicit-display' ? '; actual site time zone remains unverified' : ''}.`,
    `Requested session: ${formatLocalInstant(plan.requestedWindow.startUtc, plan.requestedWindow.timeZone, 'en')} to ${formatLocalInstant(plan.requestedWindow.endUtc, plan.requestedWindow.timeZone, 'en')}.`,
  ];
  const weather=plan.evidence?.weather;
  lines.push(...(weather?forecastAnswerText(weather):['Weather forecast values and issue times unknown; no continuous coverage is established.']));
  const astronomy = plan.evidence?.astronomy;
  const moon = astronomy?.moon;
  if (moon) lines.push(`Moon illumination ${moon.illuminationPercent.toFixed(1)}%; observing impact remains unknown. Geometric below-horizon timing does not establish minimal moonlight.`);
  if (moon) lines.push(`Moon maximum sampled altitude ${moon.maximumAltitudeDegrees.toFixed(1)} degrees ${moon.maximumAltitudeAtUtc ? `at ${formatLocalInstant(moon.maximumAltitudeAtUtc, plan.requestedWindow.timeZone, 'en')}` : 'at time unknown'}; sampled maximum within this session, not a continuous optimum.`);
  lines.push(...plan.gaps.slice(0,2).map(gap=>`Unknown or limitation: ${plain(gap)}`));
  lines.push(...meteorTimingAnswerText(plan,options.target));
  // Reuse existing selected/suggested geometry before optional long context.
  const targets=[...(plan.evidence?.target?[plan.evidence.target]:[]),...(plan.suggestions??[])];
  const seenTargets=new Set<string>();
  for(const target of targets){if(seenTargets.has(target.target.targetId))continue;seenTargets.add(target.target.targetId);lines.push(...orientationAnswerText(target).split('\n'));}
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
  const names = new Map([...(plan.evidence?.target ? [plan.evidence.target] : []), ...(plan.suggestions ?? [])].map(target => [target.target.targetId, target.target.name]));
  for (const row of plan.candidateWindows) {
    const start = row.localStart ?? formatLocalInstant(row.window.startUtc, row.window.timeZone, 'en');
    const end = row.localEnd ?? formatLocalInstant(row.window.endUtc, row.window.timeZone, 'en');
    lines.push(`${plain(names.get(row.targetId ?? '') ?? 'Geometric opportunity')}: ${start} to ${end}. Geometric overlap only, not useful altitude, rise/set, a practical itinerary or a best-conditions rating.`);
    for (const overlap of row.darknessOverlapIntervals ?? []) lines.push(`Astronomical-darkness overlap: ${overlap.localStart} to ${overlap.localEnd}.`);
  }
  if (moon) {
    for (const row of moon.belowHorizonIntervals ?? []) lines.push(`Moon centre below geometric horizon: ${row.localStart} to ${row.localEnd}, clipped to this session; not apparent limb moonset.`);
  }
  lines.push(...plan.gaps.slice(2).map(gap => `Unknown or limitation: ${plain(gap)}`));
  if(!targets.length)lines.push('Time-specific orientation samples unavailable; use an on-site sky chart without invented bearings.');
  const body: string[] = [];
  const notice='Further intervals and limitations remain in structuredContent; this view is bounded.';
  const reserved=Buffer.byteLength('\n'+notice,'utf8');
  let bytes = 0;
  for (const line of lines) {
    const size=Buffer.byteLength(line,'utf8')+(body.length?1:0);
    if (bytes+size+reserved>8_000) break;
    body.push(line);bytes+=size;
  }
  if (body.length<lines.length)body.push(notice);
  return options.includeSourceLinks === false ? body.join('\n') : sourceLinkedText(body.join('\n'), planAnswerSources(plan, options.target));
}
