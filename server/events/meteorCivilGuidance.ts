import { meteorCivilGuidanceSchema } from '../../shared/nightsky/events';

/** Source calendar facts remain separate from UTC events and bounded radiant fits. */
export function meteorCivilGuidance() {
  return [
    { code: 'LYR', name: 'Lyrids', startMonthDay: '04-16', endMonthDay: '04-25', maximumWording: 'Around April 22, 19:40 universal time', geographicQualification: 'Northern hemisphere; lower activity in the southern hemisphere', url: 'https://astronomia.ign.es/en/web/guest/liridas' },
    { code: 'LEO', name: 'Leonids', startMonthDay: '11-06', endMonthDay: '11-30', maximumWording: 'Night of November 17 to 18, around 23:45 universal time', geographicQualification: 'Source gives an annual visibility period; local visibility must be evaluated separately', url: 'https://astronomia.ign.es/en/leonidas' },
  ].map(({url, ...row}) => meteorCivilGuidanceSchema.parse({
    ...row, evidenceKind: 'source-civil-calendar-guidance', recurrenceBasis: 'typical-annual', calendar: 'Gregorian',
    endpointMeaning: 'source-named-calendar-days; exact activity boundaries unspecified', timeZoneBasis: 'unspecified-by-source',
    maximumYear: 2026, maximumTimeBasis: 'UT-as-published', maximumUncertainty: 'approximate; numerical uncertainty not supplied',
    requestedWindowOverlap: 'not-evaluated', sourceLocator: 'Opening annual visibility paragraph and What to expect in 2026 section',
    caveat: 'Annual civil-day guidance is not guaranteed activity throughout each day or a UTC interval. The 2026 maximum wording is approximate and is not converted to UTC or reused in other years. Local visibility and radiant fit validity are separate.',
    source: { name: 'Instituto Geográfico Nacional de España, ' + row.name, url,
      attribution: '© Instituto Geográfico Nacional de España. Individual calendar facts structured by NightSky.earth, reviewed 2026-10-17; source supplies no content update date. Reuse under IGN RISP terms; no IGN endorsement.',
      dataClass: 'context', product: 'Annual civil-day guidance and approximate 2026 maximum', vintage: 'IGN-reviewed-2026-10-17',
      licenseUrl: 'https://www.ign.es/web/es/ign/portal/info-aviso-legal', modified: true },
  }));
}
