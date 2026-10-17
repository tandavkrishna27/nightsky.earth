import type { ReferenceRecord, ReferenceSource } from '../../../shared/nightsky/reference';
import type { IdentitySnapshot } from './referenceStore';
import { isSupportedStarterId, type StarterRecord, type StarterProvenance, type ObjectDetail, type ExoplanetRecord } from './contracts';
type Measurement = ReferenceRecord['measurements'][number];
export const unknownRights = { version: null, hash: null, licence: null, licenceUrl: null, attribution: null, modifications: null };
export const timestamp = (value: string) => new Date(value).toISOString();
export function starterSource(p: StarterProvenance): ReferenceSource { return { id: p.source, url: p.source_url, retrievedAt: timestamp(p.retrieved_at), version: null, hash: p.snapshot_sha256, licence: p.license, licenceUrl: p.license_url, attribution: p.attribution, modifications: 'Upstream starter selection and coordinate/unit normalization; NightSky field selection and renaming.' }; }
export function starterIdentity(row: StarterRecord, p: StarterProvenance): IdentitySnapshot {
    const a = row.astrometry;
    return { domain: 'starter-targets', upstreamId: row.id, upstreamSourceIdentity: { lineage: 'starter:' + p.source, source: p.source, snapshot_sha256: p.snapshot_sha256, upstream_sha256: p.upstream_sha256, equinox: a.equinox ?? null, reference_epoch_jyear: a.reference_epoch_jyear == null ? null : String(a.reference_epoch_jyear), observation_epoch_jyear: a.observation_epoch_jyear == null ? null : String(a.observation_epoch_jyear) }, coordinateFrame: a.frame ?? null, coordinateEpoch: a.reference_epoch_jyear == null ? null : String(a.reference_epoch_jyear), motionModel: a.motion_model ?? null };
}
export function observingIdentity(id: string, c: any): IdentitySnapshot {
    const a = c.input_coordinates;
    return { domain: 'starter-targets', upstreamId: id, upstreamSourceIdentity: { lineage: 'starter:' + c.source, source: c.source, snapshot_sha256: c.snapshot_sha256, upstream_sha256: c.upstream_sha256, equinox: a.equinox, reference_epoch_jyear: a.reference_epoch_jyear == null ? null : String(a.reference_epoch_jyear), observation_epoch_jyear: a.observation_epoch_jyear == null ? null : String(a.observation_epoch_jyear) }, coordinateFrame: a.frame, coordinateEpoch: a.reference_epoch_jyear == null ? null : String(a.reference_epoch_jyear), motionModel: c.motion_model };
}
export function starterRecord(row: StarterRecord, p: StarterProvenance): ReferenceRecord {
    const measurements: Measurement[] = [{ name: 'right-ascension', value: row.ra_deg, unit: 'deg' }, { name: 'declination', value: row.dec_deg, unit: 'deg' }];
    if (row.magnitude !== undefined)
        measurements.push({ name: 'magnitude', value: row.magnitude, unit: 'mag', reference: `Catalogue band=${row.magnitude_band ?? 'unknown'}; flag=${row.magnitude_flag ?? 'unknown'}; code=${row.magnitude_code ?? 'unknown'}` });
    if (row.separation_arcsec !== undefined)
        measurements.push({ name: 'separation', value: row.separation_arcsec, unit: 'arcsec' });
    return { domain: 'starter-targets', upstreamId: row.id, name: row.name, aliases: row.aliases, sources: [starterSource(p)], measurements, astrometry: row.astrometry, observingSupported: isSupportedStarterId(row.id) && !!row.astrometry.frame && !!row.astrometry.motion_model };
}
const quantities: [
    string,
    Measurement['name'],
    Measurement['unit'],
    string?
][] = [['mass_kg', 'mass', 'kg'], ['radius_km', 'radius', 'km'], ['density_g_cm3', 'density', 'g/cm3'], ['surface_gravity_m_s2', 'gravity', 'm/s2'], ['semi_major_axis_au', 'semi-major-axis', 'AU', 'sigma_a'], ['eccentricity', 'eccentricity', 'dimensionless', 'sigma_e'], ['inclination_deg', 'inclination', 'deg', 'sigma_i'], ['orbital_period_days', 'orbital-period', 'day', 'sigma_per']];
export function solarRecord(row: ObjectDetail): ReferenceRecord {
    const sources: ReferenceSource[] = row.sources.slice(0, 20).map(s => ({ id: s.source_name + '/' + s.table_name, url: s.source_url, retrievedAt: timestamp(s.retrieved_at), ...unknownRights }));
    const measurements: Measurement[] = [];
    for (const [block, table] of [[row.physical, 'physical_properties'], [row.orbital, 'orbital_elements']] as const) {
        if (!block)
            continue;
        for (const [field, name, unit, sigma] of quantities) {
            const value = (block as Record<string, unknown>)[field];
            if (value === undefined)
                continue;
            const m: Measurement = { name, unit, value: value as number | null };
            const uncertainty = sigma ? (block as Record<string, unknown>)[sigma] : undefined;
            if (typeof uncertainty === 'number' && uncertainty >= 0)
                m.uncertaintyPlus = m.uncertaintyMinus = uncertainty;
            const source = row.sources.find(s => s.table_name === table);
            if (source)
                m.reference = source.source_name;
            measurements.push(m);
        }
    }
    return { domain: 'solar-system', upstreamId: row.id, name: row.name, aliases: row.designation ? [row.designation] : [], sources, measurements };
}
export function solarIdentity(row: ObjectDetail): IdentitySnapshot {
    // The detail route exposes row/table provenance, not a catalogue revision.
    return { domain: 'solar-system', upstreamId: row.id, upstreamSourceIdentity: { lineage: 'solar-object-tables', tables: JSON.stringify(row.sources.map(s => [s.table_name, s.source_name, s.source_url, s.retrieved_at]).sort()) } };
}
export function exoplanetRecord(row: ExoplanetRecord, limitations: string[]): ReferenceRecord {
    const mappings: [
        string,
        string,
        Measurement['name'],
        Measurement['unit']
    ][] = [['radius_earth', 'pl_rade', 'radius', 'earth-radius'], ['mass_earth', 'pl_bmasse', 'mass', 'earth-mass'], ['period_days', 'pl_orbper', 'orbital-period', 'day'], ['semi_major_axis_au', 'pl_orbsmax', 'semi-major-axis', 'AU'], ['equilibrium_temperature_k', 'pl_eqt', 'temperature', 'K']];
    const measurements: Measurement[] = [];
    const raw = row.source_data as Record<string, unknown>;
    for (const [field, base, name, unit] of mappings) {
        const value = (row as unknown as Record<string, unknown>)[field];
        if (value === undefined)
            continue;
        if (raw[base + 'lim'] && raw[base + 'lim'] !== 0) {
            limitations.push(`Omitted ${field}: archive limit flag semantics are unverified.`);
            continue;
        }
        const plus = raw[base + 'err1'], minus = raw[base + 'err2'];
        if ((typeof plus === 'number' && plus < 0) || (typeof minus === 'number' && minus > 0)) {
            limitations.push(`Omitted ${field}: unexpected uncertainty signs.`);
            continue;
        }
        const m: Measurement = { name, unit, value: value as number | null };
        if (typeof plus === 'number')
            m.uncertaintyPlus = plus;
        if (typeof minus === 'number')
            m.uncertaintyMinus = Math.abs(minus);
        const ref = raw[base + '_reflink'];
        if (typeof ref === 'string')
            m.reference = ref.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) || 'Archive citation';
        measurements.push(m);
    }
    if (row.distance_pc !== undefined)
        measurements.push({ name: 'distance', value: row.distance_pc, unit: 'pc' });
    if (row.mass_provenance)
        limitations.push(('Mass provenance: ' + row.mass_provenance).slice(0,500));
    return { domain: 'exoplanets', upstreamId: row.id, name: row.name, aliases: [], sources: [{ id: row.source, url: row.source_url, retrievedAt: timestamp(row.retrieved_at), ...unknownRights }], measurements, observingSupported: false };
}
export function exoplanetIdentity(row: ExoplanetRecord): IdentitySnapshot { return { domain: 'exoplanets', upstreamId: row.id, hostId: row.host_id, upstreamSourceIdentity: { lineage: 'exoplanet-row', source: row.source, source_url: row.source_url, retrieved_at: row.retrieved_at } }; }
/** Host route has no row URL. This is the documented dataset citation, never a per-row association. */
export function hostEvidence(host:ReturnType<typeof import('./contracts').parseHostDetail>){
    const citation={url:'https://doi.org/10.26133/NEA13',label:'NASA Exoplanet Archive PSCompPars; provider documentation citation',association:'provider-documentation' as const};
    const retrievedAt=timestamp(host.retrieved_at);
    return {
        coordinates:{raDeg:host.ra_deg??null,decDeg:host.dec_deg??null,unit:'deg' as const,frame:'ICRS' as const,coordinateSourcePlanet:host.coordinate_source_planet},
        // Preserve returned signed errors verbatim; do not silently reinterpret their signs.
        distance:{value:host.distance_pc??null,unit:'pc' as const,errorPlus:host.distance_error_plus_pc??null,errorMinus:host.distance_error_minus_pc??null},
        provenance:{source:host.source,retrievedAt,rowUrl:null,citation},
        source:{id:'host-provider-documentation',url:citation.url,retrievedAt,...unknownRights,attribution:citation.label,modifications:'Citation supplied by provider documentation; no per-host row URL or catalogue revision association is supplied.'} satisfies ReferenceSource,
    };
}

