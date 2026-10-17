import * as z from "zod4";
import { ianaTimeZoneSchema } from "./common";
const text = z.string().trim().min(1).max(500);
const evidenceNote = z.string().min(1).max(2048).refine(value => new TextEncoder().encode(value).byteLength <= 2048, "Evidence note exceeds 2KiB UTF-8");
export const referenceDomainSchema = z.enum(["solar-system", "starter-targets", "exoplanets"]);
export const referenceOperationSchema = z.enum([
    "search",
    "object",
    "discovery",
    "designations",
    "moons",
    "rings",
    "atmosphere",
    "meteor-shower",
    "close-approaches",
    "exoplanet",
    "exoplanet-host",
    "discover",
    "night"
]);
export const referenceStatusSchema = z.enum([
    "available",
    "partial",
    "unavailable",
    "not-found",
    "ambiguous",
    "invalid-input",
    "stale"
]);
export const referenceSelectionSchema = z.strictObject({
    referenceId: z.string().min(1).max(100),
    revision: z.string().regex(/^[a-f0-9]{64}$/)
});
export const referenceSourceSchema = z.strictObject({
    id: text,
    url: z.url().max(2048),
    retrievedAt: z.iso.datetime(),
    version: text.nullable(),
    hash: text.nullable(),
    licence: text.nullable(),
    licenceUrl: z.url().max(2048).nullable(),
    attribution: text.nullable(),
    modifications: text.nullable()
});
export const referenceMeasurementSchema = z.strictObject({
    name: z.enum([
        "mass",
        "radius",
        "diameter",
        "density",
        "gravity",
        "temperature",
        "orbital-period",
        "semi-major-axis",
        "eccentricity",
        "inclination",
        "magnitude",
        "distance",
        "right-ascension",
        "declination",
        "separation",
        "metallicity",
        "age"
    ]),
    value: z.number().finite().nullable(),
    unit: z.enum([
        "kg",
        "g/cm3",
        "m/s2",
        "K",
        "km",
        "m",
        "AU",
        "pc",
        "ly",
        "day",
        "year",
        "deg",
        "arcsec",
        "mag",
        "solar-mass",
        "earth-mass",
        "jupiter-mass",
        "solar-radius",
        "earth-radius",
        "jupiter-radius",
        "dex",
        "Gyr",
        "dimensionless"
    ]),
    uncertaintyPlus: z.number().finite().nonnegative().optional(),
    uncertaintyMinus: z.number().finite().nonnegative().optional(),
    limit: z.enum(["upper", "lower"]).optional(),
    reference: text.optional()
}).refine(m => ({
    mass: ["kg", "solar-mass", "earth-mass", "jupiter-mass"],
    radius: [
        "km",
        "m",
        "solar-radius",
        "earth-radius",
        "jupiter-radius"
    ],
    diameter: ["km", "m"],
    density: ["g/cm3"],
    gravity: ["m/s2"],
    temperature: ["K"],
    "orbital-period": ["day", "year"],
    "semi-major-axis": ["AU"],
    eccentricity: ["dimensionless"],
    inclination: ["deg"],
    magnitude: ["mag"],
    distance: ["AU", "pc", "ly", "km"],
    "right-ascension": ["deg"],
    declination: ["deg"],
    separation: ["arcsec"],
    metallicity: ["dex"],
    age: ["Gyr", "year"]
} as Record<string, string[]>)[m.name].includes(m.unit), "Measurement unit does not match named quantity");
export const referenceRecordSchema = z.strictObject({
    domain: referenceDomainSchema,
    upstreamId: z.string().min(1).max(160),
    name: text,
    aliases: z.array(text).max(30),
    selection: referenceSelectionSchema.optional(),
    sources: z.array(referenceSourceSchema).max(20),
    measurements: z.array(referenceMeasurementSchema).max(40),
    observingSupported: z.boolean().optional(),
    remoteRevisionAssociation: z.enum(["verified", "unverified"]).optional()
});
export const searchReferenceObjectsInputSchema = z.strictObject({
    domain: referenceDomainSchema,
    query: z.string().trim().min(1).max(100),
    limit: z.number().int().min(1).max(10).default(10)
});
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);
const second = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/).refine(v => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().replace(".000Z", "Z") === v);
export const referenceWindowSchema = z.strictObject({
    startUtc: second,
    endUtc: second
}).refine(v => Date.parse(v.endUtc) > Date.parse(v.startUtc));
export const getReferenceDetailsInputSchema = z.discriminatedUnion("kind", [
    z.strictObject({
        kind: z.literal("selected-object"),
        ...referenceSelectionSchema.shape,
        sections: z.array(z.enum([
            "discovery",
            "designations",
            "moons",
            "rings",
            "atmosphere"
        ])).max(2).refine(v => new Set(v).size === v.length).default([])
    }),
    z.strictObject({
        kind: z.literal("meteor-shower"),
        code: z.string().regex(/^[A-Z]{3}$/)
    }),
    z.strictObject({
        kind: z.literal("close-approaches"),
        ...referenceSelectionSchema.shape,
        from: date,
        to: date,
        limit: z.number().int().min(1).max(10).default(10)
    }).refine(v => Date.parse(v.to) >= Date.parse(v.from) && Date.parse(v.to) - Date.parse(v.from) <= 30 * 86400000),
    z.strictObject({
        kind: z.literal("exoplanet-host"),
        ...referenceSelectionSchema.shape
    })
]);
const observing = {
    placeId: z.string().min(1).max(160),
    sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    catalogueRevision: text.optional(),
    displayTimeZone: ianaTimeZoneSchema,
    localNightDate: date,
    window: referenceWindowSchema,
    minAltitudeDeg: z.number().finite().min(0).max(90).optional(),
    sunAltitudeDeg: z.union([z.literal(-6), z.literal(-12), z.literal(-18)]).optional(),
    minMoonSeparationDeg: z.number().finite().min(0).max(180).optional()
};
export const discoverObservingTargetsInputSchema = z.strictObject({
    ...observing,
    equipment: z.enum(["naked_eye", "binocular", "telescope"]),
    preference: z.enum([
        "balanced",
        "wide_field",
        "stars",
        "deep_sky",
        "solar_system"
    ]),
    shortlistLimit: z.number().int().min(1).max(6),
    trueFieldDeg: z.number().finite().min(0.01).max(180).optional(),
    maxCatalogueVMagnitude: z.number().finite().min(-30).max(30).optional()
});
export const getCatalogueTargetWindowsInputSchema = z.strictObject({
    ...observing,
    targets: z.array(referenceSelectionSchema).min(1).max(6).refine(v => new Set(v.map(x => x.referenceId)).size === v.length)
});
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const referenceCalculationSchema = z.strictObject({
    algorithm: text,
    source_sha256: hash,
    files: z.array(z.string().max(160)).max(30),
    python_version: text.optional(),
    numpy_version: text.optional(),
    catalogue_scope: text.optional()
});
export const referenceMethodSchema = z.strictObject({
    provider: text,
    ephemeris: text,
    astropy_version: text,
    erfa_version: text,
    frame: text,
    refraction: text,
    accuracy_note: evidenceNote,
    iers: z.strictObject({
        start_utc: second,
        end_utc: second,
        data_version: text,
        snapshot: z.strictObject({
            sha256: hash,
            algorithm: text,
            columns: z.array(text).max(20)
        }),
        status: z.enum(["predicted", "measured"])
    }),
    calculation: referenceCalculationSchema,
    sample_minutes: z.number().finite().positive(),
    root_tolerance_seconds: z.number().finite().positive(),
    window_note: text,
    jplephem_version: text.optional(),
    kernel: z.strictObject({
        sha256: hash,
        name: text.optional(),
        size_bytes: z.number().int().positive().optional(),
        source_url: z.url().max(2048),
        start_tdb: text,
        end_tdb: text
    }).optional()
});
export const referenceSnapshotSchema = z.strictObject({
    source: text,
    snapshot_sha256: hash,
    upstream_sha256: hash,
    source_url: z.url().max(2048),
    retrieved_at: z.string().min(10).max(40),
    license: text,
    license_url: z.url().max(2048).nullable(),
    attribution: text
});
export const referenceCoordinatesSchema = z.strictObject({
    ra_deg: z.number().finite().min(0).lt(360),
    dec_deg: z.number().finite().min(-90).max(90),
    frame: text,
    equinox: text.nullable(),
    reference_epoch_jyear: z.number().finite().nullable(),
    observation_epoch_jyear: z.number().finite().nullable()
});
export const referenceCatalogueEvidenceSchema = z.strictObject({
    ...referenceSnapshotSchema.shape,
    appearance: z.lazy(() => referenceAppearanceSchema),
    input_coordinates: referenceCoordinatesSchema,
    motion_model: text,
    proper_motion_applied: z.boolean(),
    frame_transform: text,
    pm_ra_cosdec_arcsec_per_year: z.number().finite().nullable(),
    pm_dec_arcsec_per_year: z.number().finite().nullable(),
    distance_au: z.null(),
    refraction: text,
    accuracy_note: evidenceNote
});
const referenceCoverageSchema = z.enum(["always_satisfied", "never_satisfied", "partial", "unresolved"]);
const evidenceInterval = z.strictObject({
    start_utc: second,
    end_utc: second
}).refine(v => Date.parse(v.end_utc) > Date.parse(v.start_utc));
export const referenceConstraintsSchema = z.strictObject({
    min_altitude_deg: z.number().finite().min(0).max(90),
    window_start_utc: second,
    window_end_utc: second,
    horizon_mask: z.null(),
    horizon_rule: text,
    sun_altitude_deg: z.union([z.literal(-6), z.literal(-12), z.literal(-18)]),
    min_sun_separation_deg: z.literal(30),
    min_moon_separation_deg: z.number().finite().min(0).max(180),
    moon_separation_rule: text
});
export const referenceSampleSchema = z.strictObject({
    time_utc: second,
    altitude_deg: z.number().finite().min(-90).max(90),
    azimuth_deg: z.number().finite().min(0).max(360),
    sun_separation_deg: z.number().finite().min(0).max(180).optional(),
    moon_separation_deg: z.number().finite().min(0).max(180).optional(),
    distance_au: z.number().finite().nonnegative().nullable().optional(),
    sun_altitude_deg: z.number().finite().min(-90).max(90).optional(),
    moon_altitude_deg: z.number().finite().min(-90).max(90).optional(),
    horizon_altitude_deg: z.number().finite().nullable().optional(),
    required_min_altitude_deg: z.number().finite().optional()
});
export const referenceSamplingSchema = z.strictObject({
    originalCount: z.number().int().min(0).max(400),
    inWindowCount: z.number().int().min(0).max(400),
    reduced: z.boolean(),
    sampleScope: z.literal("full-local-night")
});
export const referenceAppearanceSchema = z.strictObject({
    families: z.array(z.enum(["bright_star", "double_star", "deep_sky"])).max(3),
    magnitude: z.number().finite().nullable().optional(),
    magnitude_band: text.nullable().optional(),
    magnitude_flag: text.nullable().optional(),
    magnitude_code: text.nullable().optional(),
    major_axis_arcmin: z.number().finite().nonnegative().nullable().optional(),
    minor_axis_arcmin: z.number().finite().nonnegative().nullable().optional(),
    components: text.nullable().optional(),
    separation_arcsec: z.number().finite().nonnegative().nullable().optional(),
    separation_epoch: text.nullable().optional(),
    position_angle_deg: z.number().finite().nullable().optional()
});
export const referenceDiscoveryEvidenceSchema = z.strictObject({
    scope: text,
    ranking_policy: text,
    coarse_step_seconds: z.number().finite().positive(),
    sample_count: z.number().int().nonnegative(),
    incomplete_between_samples: z.literal(true),
    catalogue_records: z.number().int().nonnegative(),
    solar_system_targets: z.number().int().nonnegative(),
    unsupported_catalogue_records: z.number().int().nonnegative(),
    coarse_matching_candidates: z.number().int().nonnegative(),
    refined_candidates: z.number().int().nonnegative(),
    selected_without_refined_window: z.number().int().nonnegative(),
    brightness_excluded: z.number().int().nonnegative(),
    unknown_or_non_v_brightness_excluded: z.number().int().nonnegative(),
    source_snapshots: z.array(referenceSnapshotSchema).max(2),
    calculation: referenceCalculationSchema,
    planner_calculation: referenceCalculationSchema,
    limitations: z.array(text).max(20)
});
export const meteorParameterSetSchema = z.strictObject({
    iau_no: z.number().int(),
    ad_no: z.number().int(),
    code: z.string().regex(/^[A-Z]{3}$/),
    name: text,
    status_label: text.nullable().optional(),
    activity: text.nullable().optional(),
    solar_longitude_deg: z.number().finite().nullable().optional(),
    ra_deg: z.number().finite().min(0).lt(360).nullable().optional(),
    dec_deg: z.number().finite().min(-90).max(90).nullable().optional(),
    vg_km_s: z.number().finite().nonnegative().nullable().optional(),
    reference: text.nullable().optional(),
    source: text,
    submitted_on: text.nullable().optional(),
    parent_object_id: text.nullable().optional(),
    parent_body: text.nullable().optional()
});
export const referenceCloseApproachSchema = z.strictObject({
    body: z.literal("Earth"),
    cd_jd: z.number().finite(),
    cd_iso: text,
    dist_au: z.number().finite().nonnegative().nullable().optional(),
    dist_min_au: z.number().finite().nonnegative().nullable().optional(),
    dist_max_au: z.number().finite().nonnegative().nullable().optional(),
    v_rel_km_s: z.number().finite().nullable().optional(),
    v_inf_km_s: z.number().finite().nullable().optional(),
    t_sigma: text.nullable().optional(),
    orbit_ref: text.nullable().optional(),
    source: text
});
const envelope = {
    provider: z.literal("publicuniverse"),
    operation: referenceOperationSchema,
    status: referenceStatusSchema,
    reason: text.nullable(),
    errorCode: z.string().max(80).nullable(),
    retrievedAt: z.iso.datetime(),
    sources: z.array(referenceSourceSchema).max(30),
    limitations: z.array(text).max(20)
};
export const referenceSearchResultSchema = z.strictObject({
    ...envelope,
    data: z.strictObject({
        domain: referenceDomainSchema,
        matches: z.array(referenceRecordSchema).max(10),
        selectionRequired: z.boolean(),
        total: z.number().int().nonnegative().nullable()
    }).nullable()
});
export const referenceDetailsResultSchema = z.strictObject({
    ...envelope,
    data: z.strictObject({
        record: referenceRecordSchema.nullable(),
        meteor: z.strictObject({
            iau_no: z.number().int(),
            code: z.string().regex(/^[A-Z]{3}$/),
            name: text,
            status_label: text.nullable(),
            parameter_sets: z.array(meteorParameterSetSchema).max(20),
            totalParameterSets: z.number().int().max(500),
            truncated: z.boolean(),
            parent: z.strictObject({
                id: text,
                name: text
            }).nullable()
        }).optional(),
        closeApproaches: z.array(referenceCloseApproachSchema).max(10).optional(),
        host: z.strictObject({
            id: text,
            name: text,
            coordinateMetadata: z.strictObject({
                input: evidenceNote,
                heliocentric: evidenceNote,
                unit: z.literal("pc"),
                galactocentric: z.strictObject({
                    galcen_distance_pc: z.number().finite().positive(),
                    z_sun_pc: z.number().finite(),
                    roll_deg: z.number().finite(),
                    galcen_ra_deg: z.number().finite().min(0).lt(360),
                    galcen_dec_deg: z.number().finite().min(-90).max(90)
                }),
                astropy_version: text
            }).nullable(),
            planets: z.array(referenceRecordSchema).max(100)
        }).optional(),
        sections: z.array(z.strictObject({
            section: text,
            status: referenceStatusSchema,
            reason: text.nullable(),
            records: z.array(referenceRecordSchema).max(20),
            facts: z.array(z.strictObject({
                name: text,
                value: text.nullable(),
                source: text.nullable()
            })).max(30).optional()
        })).max(3)
    }).nullable()
});
export const catalogueWindowSchema = z.strictObject({
    startUtc: second,
    endUtc: second,
    status: z.enum(["available", "unresolved_grazing", "no-refined-window"])
});
export const observingTargetSchema = z.strictObject({
    record: referenceRecordSchema,
    catalogue: referenceCatalogueEvidenceSchema.optional(),
    status: z.enum(["unresolved_grazing", "windows_found", "no_matching_window"]),
    constraintCoverage: z.strictObject({
        scope: z.literal("selected_interval"),
        start_utc: second,
        end_utc: second,
        altitude: referenceCoverageSchema,
        darkness: referenceCoverageSchema
    }),
    sampling: referenceSamplingSchema,
    appearance: referenceAppearanceSchema.nullable().optional(),
    preferenceReasons: z.array(text).max(10).optional(),
    fieldContext: text.optional(),
    brightnessStatus: text.optional(),
    windows: z.array(catalogueWindowSchema).max(100),
    samples: z.array(z.strictObject({
        atUtc: second,
        altitudeDeg: z.number().finite().min(-90).max(90),
        azimuthDeg: z.number().finite().min(0).max(360)
    })).max(3),
    limitations: z.array(text).max(20)
});
export const referenceObservingResultSchema = z.strictObject({
    ...envelope,
    data: z.strictObject({
        requestedCoordinates: z.strictObject({
            latitude: z.number().finite().min(-90).max(90),
            longitude: z.number().finite().min(-180).max(180)
        }),
        effectiveCoordinates: z.strictObject({
            latitude: z.number().finite().min(-90).max(90),
            longitude: z.number().finite().min(-180).max(180)
        }),
        localNightDate: date,
        timeZone: ianaTimeZoneSchema,
        window: referenceWindowSchema,
        method: referenceMethodSchema,
        constraints: referenceConstraintsSchema.nullable(),
        night: z.strictObject({
            date: date,
            start_utc: second,
            end_utc: second,
            duration_hours: z.number().finite().min(22).max(26)
        }).nullable(),
        darkness: z.strictObject({
            intervals: z.array(evidenceInterval).max(100),
            status: z.enum(["unresolved_grazing", "intervals_found", "no_matching_interval"])
        }).nullable(),
        moon: z.strictObject({
            reference_utc: second,
            definition: text,
            illumination_fraction: z.number().finite().min(0).max(1),
            phase_angle_deg: z.number().finite().min(0).max(180),
            elongation_deg: z.number().finite().min(0).max(180),
            samples: z.array(referenceSampleSchema).max(3),
            sampling: referenceSamplingSchema
        }).nullable(),
        discovery: referenceDiscoveryEvidenceSchema.optional(),
        targets: z.array(observingTargetSchema).max(6)
    }).nullable()
});
export const discoverObservingTargetsResultSchema = referenceObservingResultSchema;
export const catalogueTargetWindowsResultSchema = referenceObservingResultSchema;
export type ReferenceDomain = z.infer<typeof referenceDomainSchema>;
export type ReferenceOperation = z.infer<typeof referenceOperationSchema>;
export type ReferenceRecord = z.infer<typeof referenceRecordSchema>;
export type ReferenceSource = z.infer<typeof referenceSourceSchema>;
export type SearchReferenceObjectsInput = z.infer<typeof searchReferenceObjectsInputSchema>;
export type GetReferenceDetailsInput = z.infer<typeof getReferenceDetailsInputSchema>;
export type DiscoverObservingTargetsInput = z.infer<typeof discoverObservingTargetsInputSchema>;
export type GetCatalogueTargetWindowsInput = z.infer<typeof getCatalogueTargetWindowsInputSchema>;
export type ReferenceSearchResult = z.infer<typeof referenceSearchResultSchema>;
export type ReferenceDetailsResult = z.infer<typeof referenceDetailsResultSchema>;
export type ReferenceObservingResult = z.infer<typeof referenceObservingResultSchema>;
