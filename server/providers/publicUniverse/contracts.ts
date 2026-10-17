import * as z from "zod4";
import { discoverObservingTargetsInputSchema, getCatalogueTargetWindowsInputSchema, type ReferenceDomain } from "../../../shared/nightsky/reference";
const text = z.string().min(1).max(500);
const numeric = z.number().finite();
const evidenceNote = z.string().min(1).max(2048).refine(value => new TextEncoder().encode(value).byteLength <= 2048, "Evidence note exceeds 2KiB UTF-8");
const row = z.object({
    id: z.string().min(1).max(160),
    name: text,
    designation: text.nullable().optional(),
    object_type: text.optional(),
    parent_id: text.nullable().optional(),
    discoverer: text.nullable().optional()
});
export const solarSearchResponseSchema = z.object({
    query: z.string().max(100),
    results: z.array(row).max(10)
});
const meteorParameterSchema = z.object({
    iau_no: z.number().int(),
    ad_no: z.number().int(),
    code: z.string().regex(/^[A-Z]{3}$/),
    name: text,
    status_label: text.nullable().optional(),
    activity: text.nullable().optional(),
    solar_longitude_deg: numeric.nullable().optional(),
    ra_deg: numeric.min(0).lt(360).nullable().optional(),
    dec_deg: numeric.min(-90).max(90).nullable().optional(),
    dra_deg_per_day: numeric.nullable().optional(),
    ddec_deg_per_day: numeric.nullable().optional(),
    vg_km_s: numeric.nonnegative().nullable().optional(),
    a_au: numeric.nullable().optional(),
    q_au: numeric.nullable().optional(),
    e: numeric.nullable().optional(),
    peri_deg: numeric.nullable().optional(),
    node_deg: numeric.nullable().optional(),
    incl_deg: numeric.nullable().optional(),
    n_members: z.number().int().nullable().optional(),
    shower_group: text.nullable().optional(),
    parent_body: text.nullable().optional(),
    parent_object_id: text.nullable().optional(),
    technique: text.nullable().optional(),
    reference: text.nullable().optional(),
    submitted_on: text.nullable().optional(),
    source: text
});
export const meteorResponseSchema = z.object({
    iau_no: z.number().int().nonnegative(),
    code: z.string().regex(/^[A-Z]{3}$/),
    name: text,
    status_label: text.nullable(),
    parameter_sets: z.array(meteorParameterSchema).max(500),
    parent: z.union([text, z.object({
            id: text,
            name: text,
            designation: text.nullable().optional(),
            object_type: text.optional()
        })]).nullable()
});
export function parseMeteorResponse(value: unknown, code: string) {
    const result = meteorResponseSchema.parse(value);
    if (result.code !== code || result.parameter_sets.some(set => set.code !== code || set.iau_no !== result.iau_no))
        throw new Error("Meteor identity mismatch");
    return {
        ...result,
        parameter_sets: result.parameter_sets.slice(0, 20),
        totalParameterSets: result.parameter_sets.length,
        truncated: result.parameter_sets.length > 20
    };
}
export function assertLocalNight(input: {
    localNightDate: string;
    displayTimeZone: string;
    window: {
        startUtc: string;
        endUtc: string;
    };
}) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: input.displayTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    });
    const local = (instant: string) => Object.fromEntries(formatter.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
    const next = new Date(input.localNightDate + "T12:00:00Z");
    next.setUTCDate(next.getUTCDate() + 1);
    const nextDate = next.toISOString().slice(0, 10);
    for (const instant of [input.window.startUtc, input.window.endUtc]) {
        const p = local(instant), date = `${p.year}-${p.month}-${p.day}`, clock = `${p.hour}:${p.minute}:${p.second}`;
        if (!((date === input.localNightDate && clock >= "12:00:00") || (date === nextDate && clock <= "12:00:00")))
            throw new Error("Selected window outside local noon-to-noon night");
    }
}
export function buildObservingRequest(operation: "discover" | "night", value: unknown, coordinates: {
    latitude: number;
    longitude: number;
}, targetIds?: string[]) {
    const input = operation === "discover" ? discoverObservingTargetsInputSchema.parse(value) : getCatalogueTargetWindowsInputSchema.parse(value);
    assertLocalNight(input);
    z.object({
        latitude: numeric.min(-90).max(90),
        longitude: numeric.min(-180).max(180)
    }).parse(coordinates);
    const body: Record<string, string | number> = {
        date: input.localNightDate,
        timezone: input.displayTimeZone,
        lat: coordinates.latitude,
        lon: coordinates.longitude,
        window_start_utc: input.window.startUtc,
        window_end_utc: input.window.endUtc
    };
    for (const [key, name] of [["minAltitudeDeg", "min_altitude_deg"], ["sunAltitudeDeg", "sun_altitude_deg"], ["minMoonSeparationDeg", "min_moon_separation_deg"]] as const) {
        if (input[key] !== undefined)
            body[name] = input[key]!;
    }
    if (operation === "discover") {
        const discovery = discoverObservingTargetsInputSchema.parse(value);
        Object.assign(body, {
            equipment_mode: discovery.equipment,
            preference: discovery.preference,
            shortlist_limit: discovery.shortlistLimit
        });
        if (discovery.trueFieldDeg !== undefined)
            body.true_field_deg = discovery.trueFieldDeg;
        if (discovery.maxCatalogueVMagnitude !== undefined)
            body.max_catalogue_v_magnitude = discovery.maxCatalogueVMagnitude;
    }
    else {
        if (!targetIds || targetIds.length !== getCatalogueTargetWindowsInputSchema.parse(value).targets.length || new Set(targetIds).size !== targetIds.length || targetIds.some(id => !isSupportedStarterId(id)))
            throw new Error("Expected unique selected supported starter IDs");
        body.targets = targetIds.join(",");
    }
    return body;
}
export function isSupportedStarterId(id: string) {
    return /^(?:bsc5p:hr\d+|openngc:(?:NGC|IC)\d+)$/.test(id);
}
export function assertEffectiveCoordinates(requested: {
    latitude: number;
    longitude: number;
}, effective: {
    latitude: number;
    longitude: number;
}) {
    for (const key of ["latitude", "longitude"] as const) {
        const v = effective[key];
        if (!Number.isFinite(v) || Math.abs(v * 100 - Math.round(v * 100)) > 1e-8 || Math.abs(v - requested[key]) > 0.00500001)
            throw new Error("Effective observer mismatch");
    }
    if (Math.abs(effective.latitude) > 90 || Math.abs(effective.longitude) > 180)
        throw new Error("Observer outside bounds");
}
export const starterProvenanceSchema = z.object({
    source: text,
    snapshot_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    upstream_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    source_url: z.url().max(2048),
    retrieved_at: z.string().min(10).max(40).refine(v => Number.isFinite(Date.parse(v))),
    license: text,
    attribution: text,
    license_url: z.url().max(2048).nullable()
});
export const astrometrySchema = z.object({
    status: text,
    frame: text.nullable().optional(),
    equinox: text.nullable().optional(),
    reference_epoch_jyear: numeric.nullable().optional(),
    observation_epoch_jyear: numeric.nullable().optional(),
    motion_model: text.optional(),
    pm_ra_cosdec_arcsec_per_year: numeric.nullable().optional(),
    pm_dec_arcsec_per_year: numeric.nullable().optional(),
    reason: text.optional()
});
export const starterRecordSchema = z.object({
    id: text,
    name: text,
    source: z.enum(["bsc5p", "openngc"]),
    aliases: z.array(text).max(30),
    families: z.array(z.enum(["bright_star", "double_star", "deep_sky"])).max(3),
    object_type: text,
    ra_deg: numeric.min(0).lt(360),
    dec_deg: numeric.min(-90).max(90),
    coordinate_equinox: text.nullable().optional(),
    coordinate_epoch: text.nullable().optional(),
    magnitude: numeric.nullable().optional(),
    magnitude_band: text.nullable().optional(),
    magnitude_flag: text.nullable().optional(),
    magnitude_code: text.nullable().optional(),
    major_axis_arcmin: numeric.nonnegative().nullable().optional(),
    minor_axis_arcmin: numeric.nonnegative().nullable().optional(),
    components: text.nullable().optional(),
    separation_arcsec: numeric.nonnegative().nullable().optional(),
    separation_epoch: text.nullable().optional(),
    position_angle_deg: numeric.nullable().optional(),
    astrometry: astrometrySchema
});
export function parseStarterDetail(value: unknown, id: string) {
    const result = starterRecordSchema.extend({
        provenance: starterProvenanceSchema
    }).parse(value);
    if (result.id !== id || !result.id.startsWith(result.source + ":") || result.provenance.source !== result.source)
        throw new Error("Starter identity mismatch");
    return result;
}
export const calculationIdentitySchema = z.object({
    algorithm: text,
    source_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    files: z.array(z.string().max(160)).max(30),
    python_version: text.optional(),
    numpy_version: text.optional(),
    catalogue_scope: text.optional()
});
const utc = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/).refine(v => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().replace(".000Z", "Z") === v);
export const methodSchema = z.object({
    provider: text,
    ephemeris: text,
    astropy_version: text,
    erfa_version: text,
    frame: text,
    refraction: text,
    accuracy_note: evidenceNote,
    iers: z.object({
        start_utc: utc,
        end_utc: utc,
        data_version: text,
        snapshot: z.object({
            sha256: z.string().regex(/^[a-f0-9]{64}$/),
            algorithm: text,
            columns: z.array(text).max(20)
        }),
        status: z.enum(["predicted", "measured"])
    }),
    calculation: calculationIdentitySchema,
    sample_minutes: numeric.positive(),
    root_tolerance_seconds: numeric.positive(),
    window_note: text,
    jplephem_version: text.optional(),
    kernel: z.object({
        name: text,
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        size_bytes: z.number().int().positive(),
        source_url: z.url().max(2048),
        start_tdb: text,
        end_tdb: text
    }).optional()
});
const intervalSchema = z.object({
    start_utc: utc,
    end_utc: utc
}).refine(v => Date.parse(v.end_utc) > Date.parse(v.start_utc));
const sampleSchema = z.object({
    time_utc: utc,
    altitude_deg: numeric.min(-90).max(90),
    azimuth_deg: numeric.min(0).max(360),
    sun_separation_deg: numeric.min(0).max(180).optional(),
    moon_separation_deg: numeric.min(0).max(180).optional(),
    distance_au: numeric.nonnegative().nullable().optional(),
    sun_altitude_deg: numeric.min(-90).max(90).optional(),
    moon_altitude_deg: numeric.min(-90).max(90).optional(),
    horizon_altitude_deg: numeric.nullable().optional(),
    required_min_altitude_deg: numeric.optional()
});
const coverageValueSchema = z.enum(["always_satisfied", "never_satisfied", "partial", "unresolved"]);
export const appearanceSchema = z.object({
    families: z.array(z.enum(["bright_star", "double_star", "deep_sky"])).max(3),
    magnitude: numeric.nullable(),
    magnitude_band: text.nullable(),
    magnitude_flag: text.nullable(),
    magnitude_code: text.nullable(),
    major_axis_arcmin: numeric.nonnegative().nullable(),
    minor_axis_arcmin: numeric.nonnegative().nullable()
});
export const catalogueMetadataSchema = starterProvenanceSchema.extend({
    appearance: appearanceSchema,
    input_coordinates: z.object({
        ra_deg: numeric.min(0).lt(360),
        dec_deg: numeric.min(-90).max(90),
        frame: text,
        equinox: text.nullable(),
        reference_epoch_jyear: numeric.nullable(),
        observation_epoch_jyear: numeric.nullable()
    }),
    motion_model: text,
    proper_motion_applied: z.boolean(),
    frame_transform: text,
    pm_ra_cosdec_arcsec_per_year: numeric.nullable(),
    pm_dec_arcsec_per_year: numeric.nullable(),
    distance_au: z.null(),
    refraction: text,
    accuracy_note: evidenceNote
});
export const nightTargetSchema = z.object({
    id: text,
    name: text,
    catalogue: catalogueMetadataSchema.optional(),
    status: z.enum(["unresolved_grazing", "windows_found", "no_matching_window"]),
    windows: z.array(intervalSchema).max(100),
    constraint_coverage: z.object({
        scope: z.literal("selected_interval"),
        start_utc: utc,
        end_utc: utc,
        altitude: coverageValueSchema,
        darkness: coverageValueSchema
    }),
    samples: z.array(sampleSchema).max(400)
});
export const nightResponseSchema = z.object({
    schema_version: z.literal(1),
    observer: z.object({
        lat: numeric.min(-90).max(90),
        lon: numeric.min(-180).max(180),
        timezone: text,
        elevation_m: z.literal(0)
    }),
    night: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        start_utc: utc,
        end_utc: utc,
        duration_hours: numeric.min(22).max(26)
    }),
    constraints: z.object({
        min_altitude_deg: numeric.min(0).max(90),
        window_start_utc: utc,
        window_end_utc: utc,
        horizon_mask: z.null(),
        horizon_rule: text,
        sun_altitude_deg: z.union([z.literal(-6), z.literal(-12), z.literal(-18)]),
        min_sun_separation_deg: z.literal(30),
        min_moon_separation_deg: numeric.min(0).max(180),
        moon_separation_rule: text
    }),
    method: methodSchema,
    darkness: z.object({
        intervals: z.array(intervalSchema).max(100),
        status: z.enum(["unresolved_grazing", "intervals_found", "no_matching_interval"])
    }),
    moon: z.object({
        reference_utc: utc,
        definition: text,
        illumination_fraction: numeric.min(0).max(1),
        phase_angle_deg: numeric.min(0).max(180),
        elongation_deg: numeric.min(0).max(180),
        samples: z.array(sampleSchema).max(400)
    }),
    targets: z.array(nightTargetSchema).max(8)
});
export interface ObservingBinding {
    localNightDate: string;
    displayTimeZone: string;
    window: {
        startUtc: string;
        endUtc: string;
    };
    latitude: number;
    longitude: number;
    targetIds?: string[];
    minAltitudeDeg?: number;
    sunAltitudeDeg?: number;
    minMoonSeparationDeg?: number;
    equipment?: string;
    preference?: string;
    shortlistLimit?: number;
    trueFieldDeg?: number;
    maxCatalogueVMagnitude?: number;
}
function equal(a: unknown, b: unknown, label: string) {
    if (JSON.stringify(a) !== JSON.stringify(b))
        throw new Error(label + " mismatch");
}
function bindConstraints(c: {
    min_altitude_deg: number;
    sun_altitude_deg: number;
    min_moon_separation_deg: number;
    window_start_utc: string;
    window_end_utc: string;
}, b: ObservingBinding) {
    equal(c.min_altitude_deg, b.minAltitudeDeg ?? 20, "Altitude");
    equal(c.sun_altitude_deg, b.sunAltitudeDeg ?? -12, "Solar threshold");
    equal(c.min_moon_separation_deg, b.minMoonSeparationDeg ?? 0, "Moon separation");
    equal(c.window_start_utc, b.window.startUtc, "Window start");
    equal(c.window_end_utc, b.window.endUtc, "Window end");
}
function validateChartSequence(samples: {
    time_utc: string;
}[], start: number, end: number) {
    for (let i = 0; i < samples.length; i++) {
        const at = Date.parse(samples[i].time_utc);
        if (at < start || at > end || (i > 0 && at <= Date.parse(samples[i - 1].time_utc)))
            throw new Error("Invalid sample sequence");
    }
}
export function parseNightResponse(value: unknown, b: ObservingBinding) {
    const r = nightResponseSchema.parse(value);
    assertLocalNight(b);
    equal(r.night.date, b.localNightDate, "Night date");
    equal(r.observer.timezone, b.displayTimeZone, "Timezone");
    assertEffectiveCoordinates({
        latitude: b.latitude,
        longitude: b.longitude
    }, {
        latitude: r.observer.lat,
        longitude: r.observer.lon
    });
    bindConstraints(r.constraints, b);
    if (b.targetIds)
        equal([...r.targets.map(t => t.id)].sort(), [...b.targetIds].sort(), "Targets");
    const start = Date.parse(r.night.start_utc), end = Date.parse(r.night.end_utc);
    validateChartSequence(r.moon.samples, start, end);
    for (const interval of r.darkness.intervals) {
        if (Date.parse(interval.start_utc) < Date.parse(b.window.startUtc) || Date.parse(interval.end_utc) > Date.parse(b.window.endUtc))
            throw new Error("Darkness outside selected interval");
    }
    equal(end - start, r.night.duration_hours * 3600000, "Night duration");
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: b.displayTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    });
    for (const instant of [r.night.start_utc, r.night.end_utc]) {
        const p = Object.fromEntries(fmt.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
        if (p.hour !== "12" || p.minute !== "00" || p.second !== "00")
            throw new Error("Night boundary is not local noon");
    }
    if (Date.parse(b.window.startUtc) < start || Date.parse(b.window.endUtc) > end)
        throw new Error("Window outside returned night");
    if (Math.abs(Date.parse(r.moon.reference_utc) - (start + end) / 2) > 1000)
        throw new Error("Moon phase reference not night midpoint");
    for (const t of r.targets) {
        equal(t.constraint_coverage.start_utc, b.window.startUtc, "Coverage start");
        equal(t.constraint_coverage.end_utc, b.window.endUtc, "Coverage end");
        if (isSupportedStarterId(t.id) && !t.catalogue)
            throw new Error("Missing catalogue identity");
        for (const w of t.windows)
            if (Date.parse(w.start_utc) < Date.parse(b.window.startUtc) || Date.parse(w.end_utc) > Date.parse(b.window.endUtc))
                throw new Error("Window outside selected interval");
        validateChartSequence(t.samples, start, end);
    }
    return r;
}
export const discoveryResponseSchema = z.object({
    schema_version: z.literal(1),
    request: z.object({
        date: text,
        timezone: text,
        lat: numeric,
        lon: numeric,
        min_altitude_deg: numeric,
        sun_altitude_deg: numeric,
        min_moon_separation_deg: numeric,
        window_start_utc: utc,
        window_end_utc: utc,
        horizon_mask: z.null()
    }),
    discovery: z.object({
        options: z.object({
            equipment_mode: z.enum(["naked_eye", "binocular", "telescope"]),
            preference: z.enum([
                "balanced",
                "wide_field",
                "stars",
                "deep_sky",
                "solar_system"
            ]),
            shortlist_limit: z.number().int().min(1).max(6),
            true_field_deg: numeric.nullable(),
            max_catalogue_v_magnitude: numeric.nullable()
        }),
        scope: text,
        catalogue_records: z.number().int().nonnegative(),
        solar_system_targets: z.number().int().nonnegative(),
        unsupported_catalogue_records: z.number().int().nonnegative(),
        coarse_step_seconds: numeric.positive(),
        sample_count: z.number().int().nonnegative(),
        incomplete_between_samples: z.literal(true),
        coarse_matching_candidates: z.number().int().nonnegative(),
        refined_candidates: z.number().int().nonnegative(),
        selected_without_refined_window: z.number().int().nonnegative(),
        brightness_excluded: z.number().int().nonnegative(),
        unknown_or_non_v_brightness_excluded: z.number().int().nonnegative(),
        ranking_policy: text,
        limitations: z.array(text).max(20),
        source_snapshots: z.array(starterProvenanceSchema).max(2),
        calculation: calculationIdentitySchema,
        planner_calculation: calculationIdentitySchema
    }),
    candidates: z.array(z.object({
        id: text,
        name: text,
        aliases: z.array(text).max(30),
        appearance: appearanceSchema.nullable(),
        preference_reasons: z.array(text).max(10),
        field_context: text,
        coarse_matching_samples: z.number().int().nonnegative(),
        sampled_peak_altitude_deg: numeric.min(-90).max(90),
        brightness_status: text,
        refined_status: z.enum(["unresolved_grazing", "windows_found"])
    })).max(6),
    plan: nightResponseSchema.nullable(),
    method: methodSchema
});
export function parseDiscoveryResponse(value: unknown, b: ObservingBinding) {
    const r = discoveryResponseSchema.parse(value);
    equal(r.request.date, b.localNightDate, "Request date");
    equal(r.request.timezone, b.displayTimeZone, "Timezone");
    assertEffectiveCoordinates({
        latitude: b.latitude,
        longitude: b.longitude
    }, {
        latitude: r.request.lat,
        longitude: r.request.lon
    });
    bindConstraints(r.request, b);
    equal(r.discovery.options.equipment_mode, b.equipment, "Equipment");
    equal(r.discovery.options.preference, b.preference, "Preference");
    equal(r.discovery.options.shortlist_limit, b.shortlistLimit, "Shortlist");
    equal(r.discovery.options.true_field_deg, b.trueFieldDeg ?? null, "True field");
    equal(r.discovery.options.max_catalogue_v_magnitude, b.maxCatalogueVMagnitude ?? null, "Magnitude");
    equal(r.method.calculation, r.discovery.planner_calculation, "Planner calculation");
    if (r.plan) {
        parseNightResponse(r.plan, {
            ...b,
            targetIds: undefined
        });
        equal(r.method, r.plan.method, "Nested method");
        for (const c of r.candidates) {
            const target = r.plan.targets.find(t => t.id === c.id);
            if (!target || !target.windows.length)
                throw new Error("Candidate missing refined windows");
            if (target.catalogue) {
                if (c.appearance !== undefined && target.catalogue.appearance !== undefined)
                    equal(c.appearance, target.catalogue.appearance, "Candidate appearance");
                const source = r.discovery.source_snapshots.find(s => s.source === target.catalogue!.source);
                if (!source)
                    throw new Error("Missing discovery snapshot");
                equal(starterProvenanceSchema.parse(target.catalogue), source, "Nested source snapshot");
            }
        }
    }
    else if (r.candidates.length)
        throw new Error("Candidates without plan");
    return r;
}
export function reduceChartSamples<T extends {
    time_utc: string;
}>(samples: T[], window: {
    startUtc: string;
    endUtc: string;
}) {
    const filtered = samples.filter(s => s.time_utc >= window.startUtc && s.time_utc <= window.endUtc);
    const selected = filtered.length <= 3 ? filtered : [filtered[0], filtered[Math.floor((filtered.length - 1) / 2)], filtered.at(-1)!];
    return {
        samples: selected,
        originalCount: samples.length,
        inWindowCount: filtered.length,
        reduced: selected.length !== samples.length,
        sampleScope: "full-local-night" as const
    };
}
const optionalNumber = numeric.nullable().optional();
const optionalText = text.nullable().optional();
export const objectSourceSchema = z.object({
    table_name: text,
    source_name: text,
    source_url: z.url().max(2048),
    retrieved_at: z.string().min(10).max(40).refine(v => Number.isFinite(Date.parse(v)))
});
export const discoveryDetailSchema = z.object({
    object_id: text,
    discovered_on: optionalText,
    discoverer: optionalText,
    site: optionalText,
    location: optionalText,
    citation: optionalText,
    reference: optionalText,
    source: text
});
export const designationSchema = z.object({
    designation: text,
    kind: text,
    source: text
});
export const physicalSchema = z.object({
    mass_kg: optionalNumber,
    radius_km: optionalNumber,
    equatorial_radius_km: optionalNumber,
    polar_radius_km: optionalNumber,
    density_g_cm3: optionalNumber,
    surface_gravity_m_s2: optionalNumber,
    rotation_period_hours: optionalNumber,
    axial_tilt_deg: optionalNumber,
    diameter_sigma_km: optionalNumber
});
export const orbitalSchema = z.object({
    object_id: text.optional(),
    epoch: optionalText,
    epoch_jd: optionalNumber,
    frame: optionalText,
    centre: optionalText,
    semi_major_axis_au: optionalNumber,
    eccentricity: optionalNumber,
    inclination_deg: optionalNumber,
    orbital_period_days: optionalNumber,
    perihelion_au: optionalNumber,
    aphelion_au: optionalNumber,
    sigma_e: optionalNumber,
    sigma_a: optionalNumber,
    sigma_i: optionalNumber,
    sigma_per: optionalNumber
});
export const visualSchema = z.object({
    absolute_magnitude_h: optionalNumber,
    apparent_magnitude: optionalNumber,
    geometric_albedo: optionalNumber
});
export const atmosphereSchema = z.object({
    object_id: text,
    surface_pressure_bar: optionalNumber,
    pressure_note: optionalText,
    temperature_k: optionalNumber,
    temperature_note: optionalText,
    density_kg_m3: optionalNumber,
    scale_height_km: optionalNumber,
    mean_molecular_weight: optionalNumber,
    wind_note: optionalText,
    source: text,
    composition: z.array(z.object({
        species: text,
        fraction: optionalNumber,
        unit: z.enum(["%", "fraction", "ppm", "ppb"]).optional()
    })).max(30).nullable().optional()
});
export const ringSchema = z.object({
    parent_id: text.optional(),
    width_km: optionalNumber,
    thickness_km: optionalNumber,
    notes: evidenceNote.nullable().optional(),
    id: z.union([text, z.number().int()]).optional(),
    object_id: text.optional(),
    name: text,
    inner_radius_km: optionalNumber,
    outer_radius_km: optionalNumber,
    source: optionalText
});
export const objectDetailSchema = z.object({
    id: text,
    name: text,
    designation: optionalText,
    object_type: text,
    parent_id: optionalText,
    discoverer: optionalText,
    discovery_date: optionalText,
    classifications: z.array(text).max(30).optional(),
    sources: z.array(objectSourceSchema).max(30),
    physical: physicalSchema.nullable().optional(),
    orbital: orbitalSchema.nullable().optional(),
    visual: visualSchema.nullable().optional(),
    discovery: discoveryDetailSchema.nullable().optional(),
    designations: z.array(designationSchema).max(40).optional(),
    atmosphere: atmosphereSchema.nullable().optional()
});
export function parseObjectDetail(value: unknown, id: string) {
    const result = objectDetailSchema.parse(value);
    equal(result.id, id, "Object identity");
    for (const block of [result.orbital, result.discovery, result.atmosphere])
        if (block?.object_id)
            equal(block.object_id, id, "Nested object identity");
    return result;
}
export const exoplanetSourceDataSchema = z.object({
    disc_refname: text.nullable().optional(),
    ra_reflink: text.nullable().optional(),
    dec_reflink: text.nullable().optional(),
    sy_dist_reflink: text.nullable().optional(),
    pl_rade: optionalNumber,
    pl_radeerr1: optionalNumber,
    pl_radeerr2: optionalNumber,
    pl_radelim: z.number().int().min(-1).max(1).nullable().optional(),
    pl_rade_reflink: text.nullable().optional(),
    pl_bmasse: optionalNumber,
    pl_bmasseerr1: optionalNumber,
    pl_bmasseerr2: optionalNumber,
    pl_bmasselim: z.number().int().min(-1).max(1).nullable().optional(),
    pl_bmasse_reflink: text.nullable().optional(),
    pl_orbper: optionalNumber,
    pl_orbpererr1: optionalNumber,
    pl_orbpererr2: optionalNumber,
    pl_orbperlim: z.number().int().min(-1).max(1).nullable().optional(),
    pl_orbper_reflink: text.nullable().optional(),
    pl_orbsmax: optionalNumber,
    pl_orbsmaxerr1: optionalNumber,
    pl_orbsmaxerr2: optionalNumber,
    pl_orbsmaxlim: z.number().int().min(-1).max(1).nullable().optional(),
    pl_orbsmax_reflink: text.nullable().optional(),
    pl_eqt: optionalNumber,
    pl_eqterr1: optionalNumber,
    pl_eqterr2: optionalNumber,
    pl_eqtlim: z.number().int().min(-1).max(1).nullable().optional(),
    pl_eqt_reflink: text.nullable().optional(),
    st_teff: optionalNumber,
    st_tefferr1: optionalNumber,
    st_tefferr2: optionalNumber,
    st_tefflim: z.number().int().min(-1).max(1).nullable().optional(),
    st_teff_reflink: text.nullable().optional(),
    st_mass: optionalNumber,
    st_masserr1: optionalNumber,
    st_masserr2: optionalNumber,
    st_masslim: z.number().int().min(-1).max(1).nullable().optional(),
    st_mass_reflink: text.nullable().optional(),
    st_rad: optionalNumber,
    st_raderr1: optionalNumber,
    st_raderr2: optionalNumber,
    st_radlim: z.number().int().min(-1).max(1).nullable().optional(),
    st_rad_reflink: text.nullable().optional()
});
export const exoplanetRecordSchema = z.object({
    id: text,
    name: text,
    host_id: text,
    host_name: text.optional(),
    discovery_method: optionalText,
    discovery_year: z.number().int().nullable().optional(),
    radius_earth: optionalNumber,
    mass_earth: optionalNumber,
    mass_provenance: optionalText,
    period_days: optionalNumber,
    semi_major_axis_au: optionalNumber,
    equilibrium_temperature_k: optionalNumber,
    distance_pc: optionalNumber,
    controversial: z.union([z.literal(0), z.literal(1)]).optional(),
    source: text,
    source_url: z.url().max(2048),
    retrieved_at: z.string().min(10).max(40).refine(v => Number.isFinite(Date.parse(v))),
    source_data: exoplanetSourceDataSchema
});
export function parseExoplanetDetail(value: unknown, id: string, hostId?: string) {
    const r = exoplanetRecordSchema.parse(value);
    equal(r.id, id, "Exoplanet identity");
    if (hostId)
        equal(r.host_id, hostId, "Host identity");
    return r;
}
export const hostCoordinateMetadataSchema = z.object({
    input: evidenceNote,
    heliocentric: evidenceNote,
    unit: z.literal("pc"),
    galactocentric: z.object({
        galcen_distance_pc: numeric.positive(),
        z_sun_pc: numeric,
        roll_deg: numeric,
        galcen_ra_deg: numeric.min(0).lt(360),
        galcen_dec_deg: numeric.min(-90).max(90)
    }),
    astropy_version: text
});
export const hostDetailSchema = z.object({
    id: text,
    name: text,
    ra_deg: optionalNumber,
    dec_deg: optionalNumber,
    distance_pc: optionalNumber,
    distance_error_plus_pc: optionalNumber,
    distance_error_minus_pc: optionalNumber,
    coordinate_source_planet: text,
    coordinate_metadata: hostCoordinateMetadataSchema,
    source: text,
    retrieved_at: z.string().min(10).max(40),
    planets: z.array(exoplanetRecordSchema).max(100)
});
export function parseHostDetail(value: unknown, id: string) {
    const r = hostDetailSchema.parse(value);
    equal(r.id, id, "Host identity");
    for (const p of r.planets)
        equal(p.host_id, id, "Planet host identity");
    return r;
}
export const closeApproachSchema = z.object({
    body: z.literal("Earth"),
    cd_jd: numeric,
    cd_iso: text,
    dist_au: optionalNumber,
    dist_min_au: optionalNumber,
    dist_max_au: optionalNumber,
    v_rel_km_s: optionalNumber,
    v_inf_km_s: optionalNumber,
    t_sigma: optionalText,
    orbit_ref: optionalText,
    source: text
});
export const closeApproachesResponseSchema = z.object({
    object: text,
    results: z.array(closeApproachSchema).max(10)
});
export function parseCloseApproaches(value: unknown, objectEcho: string, from: string, to: string) {
    const r = closeApproachesResponseSchema.parse(value);
    equal(r.object, objectEcho, "Close approach object");
    for (const event of r.results) {
        const date = event.cd_iso.slice(0, 10);
        if (date < from || date > to)
            throw new Error("Close approach outside requested dates");
    }
    return r;
}
export type NightResponse = z.infer<typeof nightResponseSchema>;
export type DiscoveryResponse = z.infer<typeof discoveryResponseSchema>;
export type StarterRecord = z.infer<typeof starterRecordSchema>;
export type StarterProvenance = z.infer<typeof starterProvenanceSchema>;
export type ObjectDetail = z.infer<typeof objectDetailSchema>;
export type ExoplanetRecord = z.infer<typeof exoplanetRecordSchema>;
export const starterSearchResponseSchema = z.object({
    available: z.boolean(),
    results: z.array(starterRecordSchema).max(10),
    total: z.number().int().nonnegative(),
    limit: z.number().int().min(1).max(10).optional(),
    offset: z.literal(0).optional(),
    sources: z.record(z.string(), starterProvenanceSchema),
    coverage: text
}).superRefine((r, ctx) => {
    if (r.available && (r.limit === undefined || r.offset === undefined))
        ctx.addIssue({
            code: "custom",
            message: "Available starter response needs pagination"
        });
    if (!r.available && (r.results.length || r.total))
        ctx.addIssue({
            code: "custom",
            message: "Unavailable starter has records"
        });
    for (const item of r.results)
        if (!r.sources[item.source] || !item.id.startsWith(item.source + ":"))
            ctx.addIssue({
                code: "custom",
                message: "Missing/mismatched starter provenance"
            });
});
export const catalogueSnapshotSchema = z.object({
    schema_version: z.literal(1),
    association: z.literal("same-read-transaction"),
    status: text,
    reason: text.nullable(),
    catalogue_id: text.nullable(),
    build_identifier: text.nullable(),
    hash_policy: text.nullable()
});
export const exoplanetSearchResponseSchema = z.object({
    available: z.boolean(),
    results: z.array(exoplanetRecordSchema).max(10),
    total: z.number().int().nonnegative(),
    limit: z.number().int().min(1).max(10),
    offset: z.literal(0),
    has_more: z.boolean(),
    catalogue_snapshot: catalogueSnapshotSchema
}).superRefine((r, ctx) => {
    if (!r.available && (r.results.length || r.total))
        ctx.addIssue({
            code: "custom",
            message: "Unavailable exoplanets has records"
        });
});
export function parseSearchResponse(domain: ReferenceDomain, value: unknown) {
    return domain === "solar-system" ? solarSearchResponseSchema.parse(value) : domain === "starter-targets" ? starterSearchResponseSchema.parse(value) : exoplanetSearchResponseSchema.parse(value);
}
