import type { SourceRecord } from '../../shared/nightsky/common';
import type { PlanResult } from '../../shared/nightsky/planning';
import { formatLocalInstant } from '../../shared/nightsky/format';

const plain = (value: string) => value.replace(/[\\[\]<>`*_~\r\n]/g, ' ').replace(/\s+/g, ' ').trim();

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

/** A bounded answer-ready view. Detailed geometry remains available without becoming setup advice. */
export function planAnswerText(plan: PlanResult): string {
  const lines = [
    plan.summary,
    `Calculation basis: ${plan.place.catalogueRevision ? 'selected candidate representative point' : 'named city record, not a selected observing site'}. Display time zone: ${plan.requestedWindow.timeZone}${plan.place.timeZoneBasis === 'explicit-display' ? '; actual site time zone remains unverified' : ''}.`,
    `Requested session: ${formatLocalInstant(plan.requestedWindow.startUtc, plan.requestedWindow.timeZone, 'en')} to ${formatLocalInstant(plan.requestedWindow.endUtc, plan.requestedWindow.timeZone, 'en')}.`,
    'No compass-direction setup advice is supplied. Use an on-site sky chart; sampled bearings are not whole-session directions.',
  ];
  const names = new Map([...(plan.evidence?.target ? [plan.evidence.target] : []), ...(plan.suggestions ?? [])].map(target => [target.target.targetId, target.target.name]));
  for (const row of plan.candidateWindows) {
    const start = row.localStart ?? formatLocalInstant(row.window.startUtc, row.window.timeZone, 'en');
    const end = row.localEnd ?? formatLocalInstant(row.window.endUtc, row.window.timeZone, 'en');
    lines.push(`${plain(names.get(row.targetId ?? '') ?? 'Geometric opportunity')}: ${start} to ${end}. This is not a best-conditions rating.`);
    for (const overlap of row.darknessOverlapIntervals ?? []) lines.push(`Astronomical-darkness overlap: ${overlap.localStart} to ${overlap.localEnd}.`);
  }
  const moon = plan.evidence?.astronomy?.moon;
  if (moon) {
    lines.push(`Moon illumination ${moon.illuminationPercent.toFixed(1)}%; observing impact remains unknown. Geometric below-horizon timing does not establish minimal moonlight.`);
    for (const row of moon.belowHorizonIntervals ?? []) lines.push(`Moon centre below geometric horizon: ${row.localStart} to ${row.localEnd}, clipped to this session; not apparent limb moonset.`);
  }
  for (const forecast of plan.evidence?.weather?.forecasts ?? []) lines.push(`${plain(forecast.source.name)} issued ${forecast.source.issuedAt ?? 'at an unavailable time'}; valid samples ${forecast.samples.map(sample => sample.validAt).join(', ')}. Keep single samples distinct from continuous coverage.`);
  lines.push(...plan.gaps.map(gap => `Unknown or limitation: ${plain(gap)}`));
  const body: string[] = [];
  let bytes = 0;
  for (const line of lines) {
    if (bytes + Buffer.byteLength(line, 'utf8') > 4_000) break;
    body.push(line); bytes += Buffer.byteLength(line, 'utf8') + 1;
  }
  if (body.length < lines.length) body.push('Further intervals and limitations remain in structuredContent; this view is bounded.');
  return sourceLinkedText(body.join('\n'), plan.sources);
}
