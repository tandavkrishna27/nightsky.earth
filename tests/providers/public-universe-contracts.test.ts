import assert from "node:assert/strict";
import test from "node:test";
import { searchReferenceObjectsInputSchema, getReferenceDetailsInputSchema, discoverObservingTargetsInputSchema, referenceMeasurementSchema } from "../../shared/nightsky/reference";
import { buildObservingRequest, parseSearchResponse, parseMeteorResponse } from "../../server/providers/publicUniverse/contracts";
const night = {
    placeId: "place:test",
    displayTimeZone: "UTC",
    localNightDate: "2026-10-18",
    window: {
        startUtc: "2026-10-18T18:00:00Z",
        endUtc: "2026-10-19T03:00:00Z"
    },
    equipment: "binocular",
    preference: "stars",
    shortlistLimit: 3
};
test("strict public search and selected detail inputs reject unbounded fanout and aliases", () => {
    assert.equal(searchReferenceObjectsInputSchema.safeParse({
        domain: "exoplanets",
        query: "x",
        limit: 11
    }).success, false);
    assert.equal(getReferenceDetailsInputSchema.safeParse({
        kind: "meteor-shower",
        code: "PER",
        url: "https://bad"
    }).success, false);
    assert.equal(getReferenceDetailsInputSchema.safeParse({
        kind: "selected-object",
        referenceId: "ref-x",
        revision: "a".repeat(64),
        sections: ["moons", "rings", "atmosphere"]
    }).success, false);
});
test("measurements reject unknown units and nonfinite values while preserving unknown and uncertainty", () => {
    assert.equal(referenceMeasurementSchema.safeParse({
        name: "mass",
        value: Infinity,
        unit: "kg"
    }).success, false);
    assert.equal(referenceMeasurementSchema.safeParse({
        name: "mass",
        value: 3,
        unit: "bananas"
    }).success, false);
    assert.deepEqual(referenceMeasurementSchema.parse({
        name: "mass",
        value: null,
        unit: "kg",
        uncertaintyPlus: 2
    }), {
        name: "mass",
        value: null,
        unit: "kg",
        uncertaintyPlus: 2
    });
});
test("discovery serializes singular flattened POST keys and rejects fractional seconds and nested aliases", () => {
    assert.deepEqual(buildObservingRequest("discover", night, {
        latitude: 12.345,
        longitude: 23.456
    }), {
        date: "2026-10-18",
        timezone: "UTC",
        lat: 12.345,
        lon: 23.456,
        window_start_utc: "2026-10-18T18:00:00Z",
        window_end_utc: "2026-10-19T03:00:00Z",
        equipment_mode: "binocular",
        preference: "stars",
        shortlist_limit: 3
    });
    assert.equal(discoverObservingTargetsInputSchema.safeParse({
        ...night,
        window: {
            ...night.window,
            startUtc: "2026-10-18T18:00:00.001Z"
        }
    }).success, false);
    assert.equal(discoverObservingTargetsInputSchema.safeParse({
        ...night,
        constraints: {}
    }).success, false);
    assert.throws(() => buildObservingRequest("discover", {
        ...night,
        window: {
            ...night.window,
            startUtc: "2026-10-17T18:00:00Z"
        }
    }, {
        latitude: 0,
        longitude: 0
    }));
});
test("search distinguishes successful empty matches from invalid envelopes and drops additive fields", () => {
    assert.deepEqual(parseSearchResponse("solar-system", {
        query: "x",
        results: [],
        extra: "ignored"
    }), {
        query: "x",
        results: []
    });
    assert.throws(() => parseSearchResponse("solar-system", {
        query: "x"
    }));
});
test("meteor binds code and caps returned sets while retaining total", () => {
    const fixture = {
        iau_no: 7,
        code: "PER",
        name: "Synthetic shower",
        status_label: "synthetic",
        parameter_sets: Array.from({
            length: 21
        }, () => ({
            iau_no: 7,
            ad_no: 1,
            code: "PER",
            name: "Synthetic",
            solar_longitude_deg: 140,
            source: "Synthetic"
        })),
        parent: null
    };
    assert.equal(parseMeteorResponse(fixture, "PER").parameter_sets.length, 20);
    assert.equal(parseMeteorResponse(fixture, "PER").totalParameterSets, 21);
    assert.throws(() => parseMeteorResponse(fixture, "GEM"));
    assert.throws(() => parseMeteorResponse({
        ...fixture,
        parameter_sets: Array(501).fill({})
    }, "PER"));
});
import { parseNightResponse, parseDiscoveryResponse, parseStarterDetail, assertEffectiveCoordinates } from "../../server/providers/publicUniverse/contracts";
import { syntheticNight, syntheticMethod, syntheticSource } from "../fixtures/public-universe/synthetic";
const binding = {
    ...night,
    latitude: 12.345,
    longitude: 23.456,
    targetIds: []
};
test("night binds exact observer date timezone window and constraint echoes", () => {
    assert.equal(parseNightResponse(syntheticNight, binding).schema_version, 1);
    for (const change of [
        {
            observer: {
                ...syntheticNight.observer,
                lat: 13
            }
        },
        {
            observer: {
                ...syntheticNight.observer,
                timezone: "Asia/Kolkata"
            }
        },
        {
            night: {
                ...syntheticNight.night,
                date: "2026-10-17"
            }
        },
        {
            constraints: {
                ...syntheticNight.constraints,
                min_altitude_deg: 22
            }
        },
        {
            constraints: {
                ...syntheticNight.constraints,
                window_end_utc: "2026-10-19T04:00:00Z"
            }
        }
    ])
        assert.throws(() => parseNightResponse({
            ...syntheticNight,
            ...change
        }, binding));
    assert.throws(() => assertEffectiveCoordinates({
        latitude: 0,
        longitude: 0
    }, {
        latitude: 0.001,
        longitude: 0
    }));
});
test("discovery null plan remains valid empty screening and method mismatch is invalid", () => {
    const discovery = {
        schema_version: 1,
        request: {
            date: "2026-10-18",
            timezone: "UTC",
            lat: 12.35,
            lon: 23.46,
            min_altitude_deg: 20,
            sun_altitude_deg: -12,
            min_moon_separation_deg: 0,
            window_start_utc: night.window.startUtc,
            window_end_utc: night.window.endUtc,
            horizon_mask: null
        },
        discovery: {
            options: {
                equipment_mode: "binocular",
                preference: "stars",
                shortlist_limit: 3,
                true_field_deg: null,
                max_catalogue_v_magnitude: null
            },
            scope: "synthetic bounded sample",
            catalogue_records: 1,
            solar_system_targets: 8,
            unsupported_catalogue_records: 1,
            coarse_step_seconds: 1200,
            sample_count: 72,
            incomplete_between_samples: true,
            coarse_matching_candidates: 0,
            refined_candidates: 0,
            selected_without_refined_window: 0,
            brightness_excluded: 0,
            unknown_or_non_v_brightness_excluded: 0,
            ranking_policy: "synthetic",
            limitations: ["synthetic"],
            source_snapshots: [syntheticSource],
            calculation: syntheticMethod.calculation,
            planner_calculation: syntheticMethod.calculation
        },
        candidates: [],
        plan: null,
        method: syntheticMethod
    };
    assert.equal(parseDiscoveryResponse(discovery, binding).plan, null);
    assert.throws(() => parseDiscoveryResponse({
        ...discovery,
        plan: syntheticNight,
        method: {
            ...syntheticMethod,
            provider: "changed"
        }
    }, binding));
    assert.throws(() => parseDiscoveryResponse({
        ...discovery,
        discovery: {
            ...discovery.discovery,
            source_snapshots: [{
                    ...syntheticSource,
                    license: undefined
                }]
        }
    }, binding));
});
test("starter detail preserves unsupported identity but requires dated rights provenance", () => {
    const record = {
        id: "openngc:Mel022",
        name: "Synthetic M45",
        source: "openngc",
        aliases: ["M 45"],
        families: ["deep_sky"],
        object_type: "OCl",
        ra_deg: 56,
        dec_deg: 24,
        astrometry: {
            status: "unsupported"
        },
        provenance: {
            ...syntheticSource,
            source: "openngc"
        }
    };
    assert.equal(parseStarterDetail(record, "openngc:Mel022").id, "openngc:Mel022");
    assert.throws(() => parseStarterDetail(record, "openngc:NGC0224"));
    assert.throws(() => parseStarterDetail({
        ...record,
        provenance: {
            ...record.provenance,
            retrieved_at: undefined
        }
    }, record.id));
});
import { reduceChartSamples, parseObjectDetail, parseExoplanetDetail } from "../../server/providers/publicUniverse/contracts";
test("chart samples reduce only after filtering and retain reduction counts", () => {
    const samples = [
        "17:00:00",
        "18:00:00",
        "19:00:00",
        "20:00:00",
        "21:00:00"
    ].map(t => ({
        time_utc: `2026-10-18T${t}Z`
    }));
    assert.deepEqual(reduceChartSamples(samples, {
        startUtc: "2026-10-18T18:00:00Z",
        endUtc: "2026-10-18T21:00:00Z"
    }), {
        samples: [samples[1], samples[2], samples[4]],
        originalCount: 5,
        inWindowCount: 4,
        reduced: true,
        sampleScope: "full-local-night"
    });
});
test("object exact ID and dated sources are required while rich unknown fields drop", () => {
    const object = {
        id: "synthetic-id",
        name: "Synthetic",
        object_type: "planet",
        sources: [{
                table_name: "physical",
                source_name: "Synthetic",
                source_url: "https://example.org",
                retrieved_at: "2026-01-01"
            }],
        physical: {
            mass_kg: 3,
            unknown_blob: "dropped"
        }
    };
    assert.deepEqual(parseObjectDetail(object, "synthetic-id").physical, {
        mass_kg: 3
    });
    assert.throws(() => parseObjectDetail(object, "other"));
    assert.throws(() => parseObjectDetail({
        ...object,
        sources: [{
                source_name: "Synthetic"
            }]
    }, "synthetic-id"));
});
test("exoplanet keeps asymmetrical errors limits reference and validates host identity", () => {
    const exo = {
        id: "synthetic-b",
        name: "Synthetic b",
        host_id: "synthetic",
        host_name: "Synthetic",
        source: "Synthetic",
        source_url: "https://example.org",
        retrieved_at: "2026-01-01",
        source_data: {
            pl_rade: 2,
            pl_radeerr1: 0.2,
            pl_radeerr2: -0.1,
            pl_radelim: 1,
            pl_rade_reflink: "Synthetic reference",
            secret: {
                blob: 1
            }
        },
        radius_earth: 2
    };
    const result = parseExoplanetDetail(exo, "synthetic-b", "synthetic");
    assert.equal(result.source_data.pl_radeerr2, -0.1);
    assert.equal("secret" in result.source_data, false);
    assert.throws(() => parseExoplanetDetail(exo, "synthetic-b", "other"));
    assert.throws(() => parseExoplanetDetail({
        ...exo,
        radius_earth: NaN
    }, "synthetic-b", "synthetic"));
});
import { parseCloseApproaches, isSupportedStarterId } from "../../server/providers/publicUniverse/contracts";
test("night request excludes discovery fields and uses exact comma-joined case-sensitive starter ids", () => {
    const { equipment, preference, shortlistLimit, ...base } = night;
    const body = buildObservingRequest("night", {
        ...base,
        targets: [{
                referenceId: "ref-a",
                revision: "a".repeat(64)
            }]
    }, {
        latitude: 0,
        longitude: 0
    }, ["openngc:NGC0224"]);
    assert.deepEqual(body, {
        date: "2026-10-18",
        timezone: "UTC",
        lat: 0,
        lon: 0,
        window_start_utc: night.window.startUtc,
        window_end_utc: night.window.endUtc,
        targets: "openngc:NGC0224"
    });
    assert.equal(isSupportedStarterId("openngc:Mel022"), false);
    assert.equal(isSupportedStarterId("openngc:ngc0224"), false);
});
test("night rejects too many samples, out of interval windows and mismatched target IDs", () => {
    const target = {
        id: "moon",
        name: "Synthetic Moon",
        status: "windows_found",
        windows: [{
                start_utc: "2026-10-18T18:00:00Z",
                end_utc: "2026-10-18T19:00:00Z"
            }],
        constraint_coverage: {
            scope: "selected_interval",
            start_utc: night.window.startUtc,
            end_utc: night.window.endUtc,
            altitude: "partial",
            darkness: "always_satisfied"
        },
        samples: []
    };
    assert.equal(parseNightResponse({
        ...syntheticNight,
        targets: [target]
    }, {
        ...binding,
        targetIds: ["moon"]
    }).targets.length, 1);
    assert.throws(() => parseNightResponse({
        ...syntheticNight,
        targets: [target]
    }, binding));
    assert.throws(() => parseNightResponse({
        ...syntheticNight,
        targets: [{
                ...target,
                windows: [{
                        start_utc: "2026-10-18T17:00:00Z",
                        end_utc: "2026-10-18T19:00:00Z"
                    }]
            }]
    }, {
        ...binding,
        targetIds: ["moon"]
    }));
    assert.throws(() => parseNightResponse({
        ...syntheticNight,
        targets: [{
                ...target,
                samples: Array(401).fill({
                    time_utc: night.window.startUtc,
                    altitude_deg: 3,
                    azimuth_deg: 4
                })
            }]
    }, {
        ...binding,
        targetIds: ["moon"]
    }));
});
test("close approaches require Earth, selected echo and dates in selected interval", () => {
    const r = {
        object: "synthetic-id",
        results: [{
                body: "Earth",
                cd_jd: 2461332,
                cd_iso: "2026-10-18 12:00",
                dist_au: 0.1,
                source: "Synthetic"
            }]
    };
    assert.equal(parseCloseApproaches(r, "synthetic-id", "2026-10-18", "2026-10-19").results.length, 1);
    assert.throws(() => parseCloseApproaches(r, "other", "2026-10-18", "2026-10-19"));
    assert.throws(() => parseCloseApproaches(r, "synthetic-id", "2026-10-19", "2026-10-20"));
});
test("starter search preserves source and astrometry and rejects missing record provenance metadata", () => {
    const starter = {
        id: "bsc5p:hr2491",
        name: "Synthetic",
        source: "bsc5p",
        aliases: [],
        families: ["bright_star"],
        object_type: "star",
        ra_deg: 1,
        dec_deg: 2,
        astrometry: {
            status: "verified",
            frame: "FK5",
            equinox: "J2000",
            reference_epoch_jyear: 2000,
            observation_epoch_jyear: null,
            motion_model: "static_catalogue_direction"
        }
    };
    const response = {
        available: true,
        results: [starter],
        total: 1,
        limit: 10,
        offset: 0,
        sources: {
            bsc5p: syntheticSource
        },
        coverage: "synthetic"
    };
    const result = parseSearchResponse("starter-targets", response);
    assert.equal((result.results[0] as any).source, "bsc5p");
    assert.equal((result.results[0] as any).astrometry.frame, "FK5");
    assert.throws(() => parseSearchResponse("starter-targets", {
        ...response,
        sources: {}
    }));
    assert.throws(() => parseSearchResponse("starter-targets", {
        ...response,
        sources: {
            bsc5p: {
                ...syntheticSource,
                license: undefined
            }
        }
    }));
    assert.equal((parseSearchResponse("starter-targets", {
        available: false,
        results: [],
        total: 0,
        sources: {},
        coverage: "synthetic"
    }) as any).available, false);
});
test("public observing seconds reject impossible dates and scientific measurement units match named fields", () => {
    assert.equal(discoverObservingTargetsInputSchema.safeParse({
        ...night,
        window: {
            ...night.window,
            startUtc: "2026-02-30T18:00:00Z"
        }
    }).success, false);
    assert.equal(referenceMeasurementSchema.safeParse({
        name: "mass",
        unit: "deg",
        value: 3
    }).success, false);
});
test("discovery rejects snapshot identity differing from selected target catalogue", () => {
    const catalogue = {
        ...syntheticSource,
        appearance: syntheticAppearance,
        input_coordinates: {
            ra_deg: 1,
            dec_deg: 2,
            frame: "FK5",
            equinox: "J2000",
            reference_epoch_jyear: 2000,
            observation_epoch_jyear: null
        },
        motion_model: "static_catalogue_direction",
        proper_motion_applied: false,
        frame_transform: "synthetic",
        pm_ra_cosdec_arcsec_per_year: null,
        pm_dec_arcsec_per_year: null,
        distance_au: null,
        refraction: "none",
        accuracy_note: "synthetic"
    };
    const target = {
        id: "bsc5p:hr2491",
        name: "Synthetic",
        catalogue,
        status: "windows_found",
        windows: [{
                start_utc: night.window.startUtc,
                end_utc: "2026-10-18T19:00:00Z"
            }],
        constraint_coverage: {
            scope: "selected_interval",
            start_utc: night.window.startUtc,
            end_utc: night.window.endUtc,
            altitude: "partial",
            darkness: "partial"
        },
        samples: []
    };
    const discovery = {
        schema_version: 1,
        request: {
            date: "2026-10-18",
            timezone: "UTC",
            lat: 12.35,
            lon: 23.46,
            min_altitude_deg: 20,
            sun_altitude_deg: -12,
            min_moon_separation_deg: 0,
            window_start_utc: night.window.startUtc,
            window_end_utc: night.window.endUtc,
            horizon_mask: null
        },
        discovery: {
            options: {
                equipment_mode: "binocular",
                preference: "stars",
                shortlist_limit: 3,
                true_field_deg: null,
                max_catalogue_v_magnitude: null
            },
            scope: "synthetic",
            catalogue_records: 1,
            solar_system_targets: 8,
            unsupported_catalogue_records: 1,
            coarse_step_seconds: 1200,
            sample_count: 72,
            incomplete_between_samples: true,
            coarse_matching_candidates: 1,
            refined_candidates: 1,
            selected_without_refined_window: 0,
            brightness_excluded: 0,
            unknown_or_non_v_brightness_excluded: 0,
            ranking_policy: "synthetic",
            limitations: ["synthetic"],
            source_snapshots: [syntheticSource],
            calculation: syntheticMethod.calculation,
            planner_calculation: syntheticMethod.calculation
        },
        candidates: [{
                id: target.id,
                name: target.name,
                aliases: [],
                appearance: syntheticAppearance,
                preference_reasons: ["synthetic"],
                field_context: "unknown_angular_extent",
                coarse_matching_samples: 1,
                sampled_peak_altitude_deg: 20,
                brightness_status: "unknown",
                refined_status: "windows_found"
            }],
        plan: {
            ...syntheticNight,
            targets: [target]
        },
        method: syntheticMethod
    };
    assert.equal(parseDiscoveryResponse(discovery, binding).candidates.length, 1);
    assert.deepEqual(parseDiscoveryResponse(discovery, binding).candidates[0].appearance, syntheticAppearance);
    assert.throws(() => parseDiscoveryResponse({
        ...discovery,
        candidates: [{
                ...discovery.candidates[0],
                appearance: {
                    ...syntheticAppearance,
                    magnitude: 2
                }
            }]
    }, binding));
    assert.throws(() => parseDiscoveryResponse({
        ...discovery,
        discovery: {
            ...discovery.discovery,
            source_snapshots: [{
                    ...syntheticSource,
                    snapshot_sha256: "f".repeat(64)
                }]
        }
    }, binding));
});
import { catalogueMetadataSchema, nightTargetSchema, ringSchema, parseHostDetail } from "../../server/providers/publicUniverse/contracts";
import { referenceCatalogueEvidenceSchema, referenceSampleSchema, referenceAppearanceSchema } from "../../shared/nightsky/reference";
const syntheticAppearance = {
    families: ["bright_star"],
    magnitude: 1,
    magnitude_band: "V",
    magnitude_flag: null,
    magnitude_code: null,
    major_axis_arcmin: null,
    minor_axis_arcmin: null
};
const bscAccuracyNote = "Angular-only estimate: no measured distance, annual parallax, radial velocity, perspective acceleration or binary orbit. " + "Linear angular proper motion from Julian reference epoch 2000.0; missing radial velocity is treated as zero by the propagation model. Empirical FK5/Hipparcos frame-spin correction is not applied. " + "1900\u20132100 is a calculation bound, not an accuracy guarantee; bundled Earth-orientation coverage further restricts dates. Source rounding and catalogue systematics remain; no precision, component position, extended-object visibility or telescope-pointing guarantee.";
const reviewedCatalogue = {
    ...syntheticSource,
    appearance: syntheticAppearance,
    input_coordinates: {
        ra_deg: 1,
        dec_deg: 2,
        frame: "FK5",
        equinox: "J2000",
        reference_epoch_jyear: 2000,
        observation_epoch_jyear: null
    },
    motion_model: "linear_angular_proper_motion",
    proper_motion_applied: true,
    frame_transform: "synthetic",
    pm_ra_cosdec_arcsec_per_year: 0,
    pm_dec_arcsec_per_year: 0,
    distance_au: null,
    refraction: "none",
    accuracy_note: bscAccuracyNote
};
const noMaskSample = {
    time_utc: "2026-10-18T18:00:00Z",
    altitude_deg: 20,
    azimuth_deg: 100,
    sun_separation_deg: 60,
    moon_separation_deg: 50,
    distance_au: null,
    sun_altitude_deg: -20,
    moon_altitude_deg: 10,
    horizon_altitude_deg: null,
    required_min_altitude_deg: 20
};
test("source-shaped no-mask target samples retain explicit nullable horizon altitude", () => {
    const target = {
        id: "bsc5p:hr2491",
        name: "Synthetic",
        catalogue: {
            ...reviewedCatalogue,
            accuracy_note: "synthetic"
        },
        status: "windows_found",
        windows: [],
        constraint_coverage: {
            scope: "selected_interval",
            start_utc: night.window.startUtc,
            end_utc: night.window.endUtc,
            altitude: "partial",
            darkness: "partial"
        },
        samples: [noMaskSample]
    };
    assert.equal(nightTargetSchema.parse(target).samples[0].horizon_altitude_deg, null);
    assert.equal(referenceSampleSchema.parse(noMaskSample).horizon_altitude_deg, null);
});
test("catalogue accuracy limitations preserve the complete pinned proper-motion note within 2KiB", () => {
    assert.equal(bscAccuracyNote.length, 581);
    assert.equal(catalogueMetadataSchema.parse(reviewedCatalogue).accuracy_note, bscAccuracyNote);
    assert.equal(referenceCatalogueEvidenceSchema.parse(reviewedCatalogue).accuracy_note, bscAccuracyNote);
    assert.equal(catalogueMetadataSchema.safeParse({
        ...reviewedCatalogue,
        accuracy_note: "x".repeat(2049)
    }).success, false);
});
test("appearance copies preserve finite magnitude band flags and families", () => {
    assert.deepEqual((catalogueMetadataSchema.parse({
        ...reviewedCatalogue,
        accuracy_note: "synthetic"
    }) as any).appearance, syntheticAppearance);
    assert.deepEqual(referenceAppearanceSchema.parse(syntheticAppearance), syntheticAppearance);
    assert.equal(catalogueMetadataSchema.safeParse({
        ...reviewedCatalogue,
        accuracy_note: "synthetic",
        appearance: {
            ...syntheticAppearance,
            magnitude: Infinity
        }
    }).success, false);
});
test("Moon chart chronology and night bounds and selected darkness intervals are validated", () => {
    for (const times of [["2026-10-18T11:00:00Z"], ["2026-10-18T19:00:00Z", "2026-10-18T18:00:00Z"], ["2026-10-18T18:00:00Z", "2026-10-18T18:00:00Z"]])
        assert.throws(() => parseNightResponse({
            ...syntheticNight,
            moon: {
                ...syntheticNight.moon,
                samples: times.map(time_utc => ({
                    ...noMaskSample,
                    time_utc,
                    horizon_altitude_deg: 0
                }))
            }
        }, binding));
    assert.throws(() => parseNightResponse({
        ...syntheticNight,
        darkness: {
            status: "intervals_found",
            intervals: [{
                    start_utc: "2026-10-18T17:00:00Z",
                    end_utc: "2026-10-18T19:00:00Z"
                }]
        }
    }, binding));
    assert.equal(parseNightResponse({
        ...syntheticNight,
        moon: {
            ...syntheticNight.moon,
            samples: [{
                    ...noMaskSample,
                    horizon_altitude_deg: 0
                }]
        }
    }, binding).moon.samples.length, 1);
});
test("source-approved ring width thickness and notes and archive reflinks survive parsing", () => {
    const ring = {
        id: 1,
        parent_id: "synthetic",
        name: "Synthetic ring",
        inner_radius_km: 1,
        outer_radius_km: 2,
        width_km: 1,
        thickness_km: 0.1,
        notes: "Synthetic bounded context"
    };
    assert.deepEqual(ringSchema.parse(ring), ring);
    const exo = {
        id: "synthetic-b",
        name: "Synthetic",
        host_id: "synthetic",
        source: "synthetic",
        source_url: "https://example.org",
        retrieved_at: "2026-01-01",
        source_data: {
            disc_refname: "Synthetic discovery",
            ra_reflink: "Synthetic RA",
            dec_reflink: "Synthetic DEC",
            sy_dist_reflink: "Synthetic distance",
            pl_rade: 2,
            pl_rade_reflink: "Synthetic radius",
            st_teff: 3000,
            st_tefferr1: 10,
            st_tefferr2: -10,
            st_tefflim: 0,
            st_teff_reflink: "Synthetic temperature"
        }
    };
    assert.deepEqual(parseExoplanetDetail(exo, exo.id).source_data, exo.source_data);
});
test("host coordinate metadata retains the actual upstream frame and Galactic conventions", () => {
    const metadata = {
        input: "ICRS; archive catalogue coordinates, no proper-motion propagation",
        heliocentric: "Synthetic Galactic Cartesian",
        unit: "pc",
        galactocentric: {
            galcen_distance_pc: 8122,
            z_sun_pc: 20.8,
            roll_deg: 0,
            galcen_ra_deg: 266.4051,
            galcen_dec_deg: -28.936175
        },
        astropy_version: "synthetic"
    };
    assert.deepEqual(parseHostDetail({
        id: "synthetic",
        name: "Synthetic",
        coordinate_source_planet: "Synthetic b",
        coordinate_metadata: metadata,
        source: "Synthetic",
        retrieved_at: "2026-01-01",
        planets: []
    }, "synthetic").coordinate_metadata, metadata);
});
