import { meteorCivilGuidanceSchema } from '../../shared/nightsky/events';

/** Source calendar facts remain separate from UTC events and bounded radiant fits. */
export function meteorCivilGuidance() {
  return [
    { code: 'LYR', name: 'Lyrids', startMonthDay: '04-16', endMonthDay: '04-25', maximumWording: 'Around April 22, 19:40 universal time', geographicQualification: 'Northern hemisphere; lower activity in the southern hemisphere', url: 'https://astronomia.ign.es/en/web/guest/liridas' },
    { code: 'LEO', name: 'Leonids', startMonthDay: '11-06', endMonthDay: '11-30', maximumWording: 'Night of November 17 to 18, around 23:45 universal time', geographicQualification: 'Source gives an annual visibility period; local visibility must be evaluated separately', url: 'https://astronomia.ign.es/en/leonidas' },
    { code: 'ORI', name: 'Orionids', startMonthDay: '10-02', endMonthDay: '11-07', maximumWording: 'October 21; secondary peaks may increase activity in surrounding nights', maximumTimeBasis: 'unspecified-by-source', maximumUncertainty: 'day precision; secondary peaks possible; numerical uncertainty not supplied', geographicQualification: 'Source gives annual occurrence dates; local visibility must be evaluated separately', url: 'https://astronomia.ign.es/en/orionidas' },
    { code: 'DRA', name: 'Draconids', startMonthDay: '10-06', endMonthDay: '10-10', recurrenceBasis: 'source-general-period', maximumWording: 'October 9 at around 2 a.m. universal time', geographicQualification: 'Northern hemisphere visibility period as described by the source; not a global activity boundary', url: 'https://astronomia.ign.es/en/draconidas' },
    { code: 'URS', name: 'Ursids', startMonthDay: '12-17', endMonthDay: '12-26', maximumWording: 'December 22 at 22h universal time', maximumUncertainty: 'hour precision; numerical uncertainty not supplied', sourceLocator: 'Opening visibility paragraph; What to expect in 2026; Why do they happen annual-crossing sentence', geographicQualification: 'Northern hemisphere visibility period as described by the source; not a global activity boundary', url: 'https://astronomia.ign.es/en/ursidas' },
  ].map(({url, recurrenceBasis = 'typical-annual', maximumTimeBasis = 'UT-as-published', maximumUncertainty = 'approximate; numerical uncertainty not supplied', sourceLocator = 'Opening period paragraph and What to expect in 2026 section', ...row}) => meteorCivilGuidanceSchema.parse({
    ...row, evidenceKind: 'source-civil-calendar-guidance', recurrenceBasis, calendar: 'Gregorian',
    endpointMeaning: 'source-named-calendar-days; exact activity boundaries unspecified', timeZoneBasis: 'unspecified-by-source',
    maximumYear: 2026, maximumTimeBasis, maximumUncertainty,
    requestedWindowOverlap: 'not-evaluated', sourceLocator,
    caveat: (recurrenceBasis === 'source-general-period' ? 'The source gives a general northern visibility period, not an explicitly annual global activity interval. ' : 'Annual civil-day guidance is not guaranteed activity throughout each day or a UTC interval. ') + 'The 2026 maximum wording is approximate and is not converted to UTC or reused in other years. Local visibility and radiant fit validity are separate.',
    source: { name: 'Instituto Geográfico Nacional de España, ' + row.name, url,
      attribution: '© Instituto Geográfico Nacional de España. Individual calendar facts structured by NightSky.earth, reviewed 2026-10-17; source supplies no content update date. Reuse under IGN RISP terms; no IGN endorsement.',
      dataClass: 'context', product: (recurrenceBasis === 'source-general-period' ? 'General' : 'Annual') + ' civil-day guidance and approximate 2026 maximum', vintage: 'IGN-reviewed-2026-10-17',
      licenseUrl: 'https://www.ign.es/web/es/ign/portal/info-aviso-legal', modified: true },
  }));
}
