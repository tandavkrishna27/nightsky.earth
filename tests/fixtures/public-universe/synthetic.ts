// SYNTHETIC: invented fixtures for offline contracts; not observing evidence.
export const syntheticSource = {
    source: "bsc5p",
    snapshot_sha256: "a".repeat(64),
    upstream_sha256: "b".repeat(64),
    source_url: "https://example.org/synthetic",
    retrieved_at: "2026-01-01",
    license: "Synthetic licence",
    license_url: "https://example.org/licence",
    attribution: "Synthetic attribution"
};
export const syntheticMethod = {
    provider: "astropy-builtin",
    ephemeris: "ERFA builtin",
    astropy_version: "synthetic",
    erfa_version: "synthetic",
    frame: "apparent topocentric AltAz; azimuth north through east",
    refraction: "none",
    accuracy_note: "Synthetic approximation",
    iers: {
        start_utc: "2026-01-01T00:00:00Z",
        end_utc: "2027-01-01T00:00:00Z",
        data_version: "synthetic",
        snapshot: {
            sha256: "c".repeat(64),
            algorithm: "synthetic",
            columns: ["MJD"]
        },
        status: "predicted"
    },
    calculation: {
        algorithm: "synthetic",
        source_sha256: "d".repeat(64),
        files: ["observing/planner.py"]
    },
    sample_minutes: 5,
    root_tolerance_seconds: 1,
    window_note: "Synthetic windows"
};
export const syntheticNight = {
    schema_version: 1,
    observer: {
        lat: 12.35,
        lon: 23.46,
        timezone: "UTC",
        elevation_m: 0
    },
    night: {
        date: "2026-10-18",
        start_utc: "2026-10-18T12:00:00Z",
        end_utc: "2026-10-19T12:00:00Z",
        duration_hours: 24
    },
    constraints: {
        min_altitude_deg: 20,
        window_start_utc: "2026-10-18T18:00:00Z",
        window_end_utc: "2026-10-19T03:00:00Z",
        horizon_mask: null,
        horizon_rule: "synthetic",
        sun_altitude_deg: -12,
        min_sun_separation_deg: 30,
        min_moon_separation_deg: 0,
        moon_separation_rule: "synthetic"
    },
    method: syntheticMethod,
    darkness: {
        intervals: [],
        status: "no_matching_interval"
    },
    moon: {
        reference_utc: "2026-10-19T00:00:00Z",
        definition: "synthetic",
        illumination_fraction: 0.5,
        phase_angle_deg: 90,
        elongation_deg: 90,
        samples: []
    },
    targets: []
};
