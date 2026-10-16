# Icechunk public metadata continuation — 17 October 2026

**The registry-linked public catalogue exposes `single/temporal/tcc`, its exact
shape/chunks and revision/QC flag definitions. An immutable source snapshot and
complete scientific coverage remain unproved.** This finite continuation follows
the separately committed authenticated-form/source-audit delivery at
`69c0e6c568e39d051f3899faec8c15eb21657125` (all six jobs passed in
[CI run 38959423443](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38959423443)).
It performs no second CDS form pass.

## What was actually inspected

The parent used a separate, logged-out in-app browser tab to inspect the
[maintainer marketplace listing](https://app.earthmover.io/marketplace/6a19bcfe9aa6e97720a2fad2),
following Dataset → single → temporal → status, variable attributes/encoding,
License and README. No array plot, slice, download, example code, subscription
or login was invoked. The catalogue automatically includes abbreviated coordinate
previews; those displayed previews are not a full coordinate/status inventory.
Ordinary web assets and catalogue metadata were read; no direct object-store
HEAD/GET, repository binary, manifest, observation chunk, job, install or
credential access occurred. Backend operations behind the website were not
instrumented or claimed to be zero.

The [AWS registry](https://registry.opendata.aws/earthmover-era5/) links this exact
listing and documents anonymous `s3://earthmover-icechunk-era5/icechunkV2` in
`us-east-1`, plus Arraylake repo `earthmover-public/era5`. This establishes a
publisher-declared association. It does **not** byte-bind the displayed catalogue
to a particular anonymous S3 snapshot. The listing's direct-access panel requires
Arraylake login; that client route is separate from registry-documented anonymous
S3. Neither route was opened with a client.

## Concrete metadata findings

| Subject | Observed public catalogue metadata | Remaining limit |
| --- | --- | --- |
| Exact variable | `single/temporal/tcc`; Float32; dimensions `(valid_time, latitude, longitude)`; shape `(758232, 721, 1440)` | Catalogue presence established; exact binary snapshot cross-binding pending. |
| Logical chunk layout | `(8736, 12, 12)` for this `tcc` row; encoding `numcodecs.pcodec`, level `8` | Physical objects, sharding, compressed lengths, GET/range count and virtual references unknown. |
| Scientific variable | Parameter `164`; `Total cloud cover`; `cloud_area_fraction`; units `(0 - 1)`; `GRIB_dataType=an`, `GRIB_stepType=instant`, `GRIB_typeOfLevel=surface` | Not an observation-level equivalence or threshold test. |
| Grid | `regular_ll`; 721 × 1440 nodes; both increments 0.25°; latitude 90 → −90, longitude 0 → 359.75 | Full coordinate values and exact required-cell join not read or proved. |
| Advertised clock | 1940-01-01 00:00 UTC through 2026-06-30 23:00 UTC; hourly; group modified `2026-10-12` | Extent/shape do not prove no missing, duplicated, invalid or nonfinal hours. |
| Member | `GRIB_totalNumber=0`; three dimensions, no member axis shown | No explicit `number=0` attribute or full-horizon deterministic-member certificate was exposed. Do not equate ensemble-size metadata with an independently proved member identity. |
| Missingness | `GRIB_missingValue=3.4028234663852886e+38`; `_FillValue` displayed as `AAAAAAAA+H8=`; codec panel Fill Value shown as `-` | Retain these distinct representations. Exact Zarr descriptor/decoded missingness policy requires inspection; no silent reinterpretation. |
| Revision definition | `single/temporal/status/expver`: UInt8, one value per hour; `1=era5_final`, `5=era5t_near_realtime`, `255=unspecified`; valid range `[1,5]`, fill `255` | Abbreviated preview `1 1 1 ... 1 1 1` cannot prove the entire padded target is `1`. |
| Cloud-cover status | `single/temporal/status/tcc`: UInt8 `(valid_time:758232)`, chunk `(753888)`; one QC flag per hour, with auxiliary `expver` coordinate | Definitions are known; actual complete status values were not read. |
| Licence | Listing License tab and dataset attributes identify CC-BY 4.0 | Record attribution/provenance for any later admitted data and transformations. No terms were accepted. |
| Snapshot | README example uses mutable `main`; no immutable ID or retention guarantee found in the inspected surfaces | Snapshot ID, object hashes/version IDs and retention policy remain required. |

The cloud-cover status metadata defines these paired codes:

| Code | Meaning |
| ---: | --- |
| 0 | valid_data |
| 100 | not_yet_populated |
| 101 | unavailable |
| 102 | will_never_exist |
| 103 | not_requested |
| 200 | malformed_data |
| 201 | decompression_error |
| 202 | read_error |
| 203 | corrupt_data |
| 204 | processing_error |

Status `0` and revision `1` are different conditions. Neither may be inferred
from the other. The README identifies NCAR historical backfill through 2026-01
and a CDS append leg beginning 2026-01; the target's 1990–2021 padded horizon is
within the advertised historical leg. This provenance statement does not erase
the NCAR conversion/packing questions recorded in the
[route audit](global-history-route-audit-20261017.md).

Documentation drift is visible: the registry advertises 35 surface variables and
coverage through 2025; this README says both 38 and 35; the temporal table shows
39, including `swvl2`. Listing/header/README describe quarterly free updates,
while inherited group summary/changelog prose says daily. The table and explicit
dates are retained as dated observations, without synthesizing a universal
variable count, freshness promise or snapshot from inconsistent prose. No
properties are borrowed from the older 18-variable `era5-surface-aws` store.

## Retained evidence

The [evidence index](data-pilot-evidence/2026-10-17-icechunk-metadata-index.json)
binds each saved file's byte length and SHA-256. Full accessibility snapshots
were captured immediately on each relevant surface, with observed UTC instants
(17 October in Asia/Calcutta); the licence file is an explicit short agent
transcription. These are publisher UI observations, not repository-signed proofs.
The screenshot shows cloud-cover QC definitions and logged-out public access.
No account identifier or credential appears in them.

The README capture is losslessly wrapped in JSON because the browser's text
contains trailing spaces. Its `content` restores the original UTF-8 bytes, whose
length/hash are retained inside the wrapper; the index hashes the wrapper file.

## Exact next metadata request, prepared and not executed

The next missing fact is an immutable snapshot. The
[current Icechunk specification](https://icechunk.io/en/stable/reference/spec-v2-1/)
defines a binary `repo` entry point for V2.x. A branch's `snapshot_index` selects
an ID from the snapshot list. Its 39-byte header identifies file type, format
version and compression. The directory name `icechunkV2` is not format evidence;
the [V1 layout](https://icechunk.io/en/stable/reference/spec-v1/) differs. No
fallback/version-probing sequence is included in this proposal.

Only these two derived, **untested** object URLs are candidates. `{ID}` must be
resolved from the first object and validated as canonical 20-character Crockford
Base32 before the second URL is formed; it is not an invented snapshot pin.

```text
https://earthmover-icechunk-era5.s3.us-east-1.amazonaws.com/icechunkV2/repo
https://earthmover-icechunk-era5.s3.us-east-1.amazonaws.com/icechunkV2/snapshots/{ID}
```

The host follows documented [S3 addressing](https://docs.aws.amazon.com/AmazonS3/latest/userguide/VirtualHosting.html).
Proposed operations, in order:

1. Anonymous [HEAD](https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html)
   of the exact `repo` URL. Require success, ETag and known length ≤1 MiB.
2. Conditional [GET](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html)
   of that URL using the exact ETag in `If-Match`; hard-stop at 1 MiB received
   body bytes. Retain headers, byte count and SHA-256. Parse offline to resolve
   `main` once; reject unsupported format/features or invalid references.
3. HEAD of the one resolved `snapshots/{ID}` URL, with the same size/ETag gates.
4. Conditional GET of that object, with the same body cap. Verify its internal
   snapshot ID; extract only relevant node descriptors and stop.

This is a proposed **four-request maximum**, one active request, zero retries,
zero redirects, 30-second per-request timeout and 120-second shared deadline.
Maximum aggregate received bodies, including errors, are 2 MiB; cap response
headers at 32 KiB each. Reject missing/changed lengths or ETags, nonidentity HTTP
content encoding, errors or cap violations without alternative probes. These
are application-level limits; TLS/protocol overhead is separate. No AWS SDK
credential chain, account lookup, request signing or environment credentials.
No recursive listing, ref/history traversal or data-access code is included.

Offline parsing would need separately reviewed, locally available support for
the header, optional Zstd, compatible FlatBuffers and any required FlexBuffers;
no package is installed by this dossier. Proposed parser bounds: 16 MiB expanded
bytes per object, 32 nesting levels, 100,000 aggregate entries, 256 MiB process-tree
RSS and 15 seconds per object within the shared deadline. Preserve raw metadata
in quarantine. A bound failure is a result, not permission to raise limits.
These proposed caps are neither measured object sizes nor an execution allowance.

The [pinned snapshot schema](https://github.com/earth-mover/icechunk/blob/3f422af67bc9e176f286ce7a78a465b82dd068d4/icechunk-format/flatbuffers/snapshot.fbs)
places Zarr JSON in each node's `user_data`, so repo plus snapshot can bind shape,
codec, coordinates' descriptors and attributes without retrieving manifests.
It cannot prove actual coordinate/status values or whole-horizon completeness.
The [manifest schema](https://github.com/earth-mover/icechunk/blob/3f422af67bc9e176f286ce7a78a465b82dd068d4/icechunk-format/flatbuffers/manifest.fbs)
allows inline encoded chunk bytes. Thus manifests are excluded, along with
`chunks/`, virtual URLs, transaction logs and backup objects: calling a file
metadata does not guarantee observation-free contents.

Avoid a convenience client open in this stage:
[Icechunk persisted configuration](https://icechunk.io/en/stable/guides/configuration/)
can preload manifests, and [Xarray's default index creation](https://docs.xarray.dev/en/stable/generated/xarray.open_zarr.html)
loads coordinate data. `chunks=None` does not remove those reads. Separately,
[Icechunk expiration and garbage collection](https://icechunk.io/en/stable/understanding/expiration/)
can delete old snapshots/data; an ID alone is no retention guarantee.

This finite public inspection stops at the binary-metadata boundary. An owner
can review the exact small request above without authorizing observation chunks.
Snapshot retention, full `expver=1`/QC-valid clocks, deterministic member assurance,
physical transfer accounting, exact retained subtraction, decode equivalence and
measured solar/timezone aggregation remain separate gates. No source admission,
CDS cap/allowance increase, scope reduction, deployment or publication occurs.
Acceptance remains **12 Done / 9 Partial / 6 Not started**.

## Verification

All ten indexed evidence lengths/hashes, full AX captures, local observation
dates and local dossier/handoff links passed an offline check. The date check's
first attempt lacked system `tzdata`; its successful rerun used explicit
UTC+05:30 for these instants, without an install. `git diff --check` passed.
An independent reviewer checked captures, screenshot, transcriptions, exact
hourly extent and primary specification/schema claims; no actionable findings
remain. The prior runtime milestone passed 195 ERA5 tests; this continuation
changes only documentation/evidence and does not repeat that suite.
The initial staged whitespace check identified those README spaces; packaging
was corrected and the original capture bytes were independently reverified.
