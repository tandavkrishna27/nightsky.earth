# Icechunk offline parser dependency plan — 17 October 2026

**The coordinator approved this exact seven-wheel development setup. It is now
installed in an isolated target, using 70,453,339 bytes including the archive
directory, below the 128 MiB ceiling.** The
[setup receipt](data-pilot-evidence/2026-10-17-icechunk-development-setup.json)
records verified archive hashes, package versions and 293 installed-file pins.
The official local-file parser and offline transport fixtures are implemented;
the interpretation limitation below is explicit in its results. No source-data
download, repository-metadata request, provider job or execution allowance is
authorized. The selection and API review basis follows.

The scoped [local inventory](data-pilot-evidence/2026-10-17-icechunk-parser-readiness.json)
found no existing compatible parser. A raw repo receipt alone cannot resolve a
usable snapshot and is **not recommended as the next progress milestone**.
The target is a tested local parser plus bounded transport, followed by separate
review of source access under the metadata-only interpretation contract in the
[metadata dossier](icechunk-metadata-dossier-20261017.md).

## Exact package choice and footprint

The [machine-readable proposal](data-pilot-evidence/2026-10-17-icechunk-dependency-proposal.json)
contains the exact wheel URLs, advertised sizes/SHA-256, dependencies and three
schema hashes. At proposal time only package registry JSON and public
source/documentation were read. The seven wheels were subsequently fetched and
independently hashed after coordinator approval; no source repository binary or
observation was fetched. The original proposal retains its pre-approval status;
the separate setup receipt records the later bounded development operation.

| Additional package | Version | Wheel bytes | Project licence |
| --- | --- | ---: | --- |
| icechunk | 2.3.0 | 16,264,949 | Apache-2.0 |
| zarr | 3.1.6 | 295,655 | MIT |
| donfig | 0.8.1.post1 | 21,592 | MIT |
| google-crc32c | 1.9.0 | 35,535 | Apache-2.0 |
| numcodecs | 0.17.0 | 1,534,816 | MIT |
| PyYAML | 6.0.3 | 156,429 | MIT |
| packaging | 26.3 | 129,956 | Apache-2.0 OR BSD-2-Clause |

Total new wheel payload: **18,438,932 bytes** (about 17.59 MiB). Existing
lane-owned **NumPy 2.5.4** (BSD-3-Clause) and **typing-extensions 4.16.0**
(PSF-2.0) satisfy the remaining base requirements and stay unchanged. No extras,
Xarray, Dask, pandas, PCodec, AWS SDK, CDS client or additional FlatBuffers
generator/runtime is needed for this route. Numcodecs is a declared Zarr base
dependency; no cloud-cover codec is invoked just to read descriptor JSON.

The [official Icechunk release metadata](https://pypi.org/pypi/icechunk/2.3.0/json)
requires Python ≥3.12 and `zarr>=3.1.0`. Select the conventional Windows
`cp312-abi3-win_amd64` wheel, SHA-256
`0dc5a0938f8198f648f41ac82170b750772b769ed41f5e05c991b8e08ab3d447`,
for the existing non-free-threaded Python 3.14.3. The separate `cp314t` wheel is
not that interpreter's artifact. Pin Zarr 3.1.6 because the
[Icechunk release source](https://github.com/earth-mover/icechunk/blob/cb526569fac748e7a52a04591d08fcc9b276dfae/icechunk-python/pyproject.toml)
constrains its development environments below Zarr 3.2. The
[Zarr metadata](https://pypi.org/pypi/zarr/3.1.6/json) and version-specific
metadata URLs in the proposal establish the base dependency closure.

Proposed target: `.data/icechunk-metadata-deps`, loaded only by the dedicated
worker alongside the existing lane environment's pinned packages. Do not modify
the shared environment, current requirements/lockfiles, global PATH, user config
or the retained ERA5 test environment. Installation would use exact wheels and
hashes, binary-only/no dependencies/no extras/no build/no bytecode/no cache,
isolated pip configuration and no version check. All wheels were fetched once
from the exact URLs with redirects/proxies/retries disabled, verified before
installation, then installed solely from local files with `--no-index`.

Measured installed target size is **52,011,104 bytes**; archive directory size
is **18,442,235 bytes**, including requirements/admission receipts. The ZIP member
sum before installation was 51,789,158 bytes. ZIP path/type, encryption,
overlap, CRC and expansion checks passed before installation; no startup `.pth`
hook was admitted. Installed package licence files remain in the isolated
target. Archive plus target is below the approved 128 MiB ceiling. Package
downloads used the separate development dependency approval/budget, not the
scientific metadata proposal's 2 MiB allowance.

## Compatible maintained format implementation

Pin the [Icechunk 2.3.0 release](https://github.com/earth-mover/icechunk/releases/tag/v2.3.0)
to source commit `cb526569fac748e7a52a04591d08fcc9b276dfae`; its
[licence](https://github.com/earth-mover/icechunk/blob/cb526569fac748e7a52a04591d08fcc9b276dfae/LICENSE)
is Apache-2.0. The official wheel includes the maintained native format handling;
it avoids generating our own Python accessors. The same commit contains:

| Schema | Bytes | SHA-256 of public source read |
| --- | ---: | --- |
| common.fbs | 1,521 | `a1e847904665f3714c8b2c3936d5ecebd2f2059243daed529b7c5b940358ec35` |
| repo.fbs | 5,447 | `dec87e7f19940254eaa1bb2494c072791d3173625f4813209b7fa37c295502b9` |
| snapshot.fbs | 6,156 | `a14f61544b54d58d463a07a9ab748c44fd557618dd0b02cfc88001403e7ecbba` |

Their exact URLs are in the proposal. These are compatibility references, not a
claim that the unobserved public store uses this format version. Header/version,
features and schema consistency must pass known-format and malformed fixtures.
The [maintained serializer source](https://github.com/earth-mover/icechunk/blob/cb526569fac748e7a52a04591d08fcc9b276dfae/icechunk-format/src/serializers/mod.rs)
and generated native types provide the structural-verification route to inspect;
they do not replace the application memory, expansion, work and time limits.

## Offline-only parse API and containment

The [version-pinned Python repository API](https://github.com/earth-mover/icechunk/blob/cb526569fac748e7a52a04591d08fcc9b276dfae/icechunk-python/python/icechunk/repository.py)
supports the local-only implementation below. Its known-format synthetic
fixtures have now been exercised with the approved installed packages:

1. Independently validate the future receipt/hash and fixed header; reject
   unsupported format/features or oversized input. If compressed, bound Zstd
   expansion to 16 MiB in the contained worker. Retain raw bytes and hash; if a
   bounded uncompressed local derivative is used, record its transformation/hash
   separately. [Python 3.14's Zstd API](https://docs.python.org/3.14/library/compression.zstd.html)
   supplies bounded-output primitives; malformed/trailing/multiple frames need
   explicit fixtures. No handwritten FlatBuffers reader is proposed.
2. Materialize only verified local `repo` and the one verified
   `snapshots/{ID}` in an owned quarantine directory. Use
   `Repository.open(local_filesystem_storage(...), config=..., authorize_virtual_chunk_access={})`.
   Explicitly disable manifest preloading with `ManifestPreloadConfig` and
   `ManifestPreloadCondition.false()`; override persisted configuration. No S3,
   HTTP, cloud, virtual or Arraylake storage factory, environment credential
   default, Xarray open or library CLI/config file is used.
3. With repo bytes only, `lookup_branch('main')` resolves the fixed snapshot
   identity offline. Validate the ID before it can identify any future network
   URL. `inspect_repo_info()` can retain debug metadata; its output is version
   specific. The later verified snapshot must agree internally with that ID.
4. With both local objects, open a read-only session at that exact ID. Call
   `session.store.get('single/temporal/tcc/zarr.json', prototype=...)` and a fixed
   allowlist of coordinate/status **descriptor** keys, with the Zarr buffer
   prototype. Parse bounded UTF-8 JSON with duplicate-key/nonfinite/depth/count
   checks. No `c/...` key, manifest or data-array operation is permitted.

The [native store metadata branch](https://github.com/earth-mover/icechunk/blob/cb526569fac748e7a52a04591d08fcc9b276dfae/icechunk/src/store.rs)
distinguishes descriptor keys from chunk keys. `inspect_snapshot()` alone omits
node user metadata, so it cannot replace the descriptor-key step. Its
[inspection implementation](https://github.com/earth-mover/icechunk/blob/cb526569fac748e7a52a04591d08fcc9b276dfae/icechunk/src/inspect.rs)
reads snapshot structure, rather than fetching referenced manifest bodies.

The future worker must have a sanitized environment (including no AWS/CDS or
OTLP/logging configuration), fixed local input allowlist, no writes outside its
fresh output, and externally enforced process-tree memory/deadline containment.
Library options alone do not establish a network denial guarantee. Source call
graph review plus offline tests must demonstrate no extra store access or
preload; missing local files must fail rather than trigger remote recovery.
The fixture result establishes the specific local metadata path, not universal
format compatibility, network denial or scientific admission.

Required focused fixtures: valid repo/snapshot pairs; missing/changed identity;
malformed header/version/offset/union; decompression overflow/truncation/frames;
oversized/deep/duplicate-key metadata; local-path escape; forbidden descriptor or
chunk keys; unsupported features; missing local files; preload/virtual access
rejection; parent-enforced deadline and memory. The bounded anonymous transport
needs separate no-retry status/header/ETag/byte/encoding/deadline fixtures and a
default offline CLI before it can be an approval candidate.

## Smaller alternative and decision

Official [FlatBuffers 25.12.19](https://pypi.org/pypi/flatbuffers/25.12.19/json)
is Apache-2.0, includes `flatbuffers.flexbuffers`, and declares no runtime
dependencies. Its 26,661-byte wheel plus the matching official
[Windows flatc release](https://github.com/google/flatbuffers/releases/tag/v25.12.19)
(1,412,094-byte ZIP) and the three schemas is smaller, about 1.45 MB before
generation. Runtime SHA-256:
`7634f50c427838bb021c2d66a3d1168e9d199b0607e6329399f04846d42e20b4`;
generator ZIP SHA-256:
`fff9445c9db907227bc64b54cc98743084c4949282aa4e576cff6a955724ddc8`.
Generator source commit: `7e163021e59cca4f8e1e35a7c828b5c6b7915953`.

It is not the recommended safe-parser route: the
[official support table](https://flatbuffers.dev/support/) marks Python buffer
verification unavailable. Generated accessors do not validate whole buffers or
bound traversal. The [flatc manual](https://flatbuffers.dev/flatc/) also warns
that raw binary conversion can crash with a mismatched schema; smaller download
size is insufficient to select that path without an independently reviewed
verifier. No custom unsafe reader or generator execution is used here.

## Actual capability and execution gate

The maintained parser reads a synthetic, metadata-only repo/snapshot pair from
fresh local storage and returns the six fixed Zarr descriptors without local
manifests or chunks. It resolves `main` once and checks the snapshot's internal
identity. Original, bounded expanded and native-input derivatives retain separate
hashes. Icechunk 2.3.0 rejects compression code 0 even though the format defines
it; the implementation therefore bounds expansion first, then recompresses the
identical payload with standard-library Zstd for the native reader. This is a
local transformation, not another source request or a raised transfer cap.

The initial implementation brief required rejection of all unsupported features.
The coordinator explicitly refined that requirement for bounded observational
metadata inspection: report the pinned reader's interpretation without claiming
complete feature compatibility. The pinned Python
`Repository.feature_flags()` enumerates only IDs in the library's known
`FEATURE_FLAGS`; unknown stored enabled/disabled IDs are omitted. The inspected
native open/deserialization path structurally verifies the FlatBuffer but does
not reject those IDs. `inspect_repo_info()` also omits raw flags and opaque
extensions. Thus fixed read-only descriptor inspection is demonstrated for the
known-format fixtures, while exclusion of unsupported semantics in an arbitrary
repo remains unproved. Every result must retain
`unsupportedFeatureExclusionProved=false` and `scientificAdmission=false`.
This limitation is not by itself a ban on fixed read-only metadata inspection;
future scientific admission still requires field-specific compatibility and
units/grid/time/status/member evidence.

Pinned source evidence:

- [`Repository::feature_flags`](https://github.com/earth-mover/icechunk/blob/cb526569fac748e7a52a04591d08fcc9b276dfae/icechunk/src/repository.rs#L537)
  iterates the known registry rather than every stored ID.
- [`RepositoryBuilder::open`](https://github.com/earth-mover/icechunk/blob/cb526569fac748e7a52a04591d08fcc9b276dfae/icechunk/src/repository/builder.rs#L423)
  constructs the repository without rejecting unknown flags in the inspected path.
- [`RepoInfo::from_buffer`](https://github.com/earth-mover/icechunk/blob/cb526569fac748e7a52a04591d08fcc9b276dfae/icechunk-format/src/repo_info.rs#L1277)
  verifies structure; its raw flag accessors are available in Rust, rather than
  through the Python feature enumeration.

If complete raw-feature exclusion later becomes necessary, the official Rust
format API exposes raw IDs and generated reserved-field accessors. An upstream
Python accessor extension or a separately reviewed helper could expose them.
Neither is needed for the refined metadata interpretation contract, and no Rust
toolchain, dependency, helper or custom binary reader is added here.

The default CLI and prepared candidate packet report `executionEligible=false`
and the interpretation limitation. Live use requires separate source-access
approval, fresh byte-pinned packet/allowance and verified Windows containment.
The current work exercises transport only with fake byte I/O and local synthetic
metadata; source requests remain zero. Unknown extensions are not inferred absent.

The coordinator approved only the exact isolated development setup and finite
offline implementation. No source access or scientific admission is authorized;
existing source caps and acceptance totals remain unchanged. A raw repo receipt
is not a substitute for parsed snapshot progress.

The [offline verification receipt](data-pilot-evidence/2026-10-17-icechunk-offline-verification.json)
pins the implemented scripts/tests, focused Python 3.14/3.12 results, actual
contained native cases, attempted-access instrumentation and explicit limits.
It is evidence of local preparation, not a source execution allowance.

The [exact owner proposal](icechunk-metadata-owner-proposal-20261017.md) closes the
remaining packet/template preparation: actual byte hashes, current runtime and
dependency pins, a verified absent output, exact activation/preflight/execution
commands and host/resource/stop contract. Local preflight rejected its unapproved
template and accepted the exact approved shape only in an ephemeral test fixture
with transport construction trapped. No approved allowance or claim was retained.
Only explicit owner approval of the unexpired proposal remains before source
execution; no source request is authorized by this preparation.
