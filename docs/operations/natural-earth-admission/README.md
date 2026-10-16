# Retained Natural Earth source subjects — 17 October 2026

The assembler's packet assembles **actual retained evidence** for independent source review. It issues no review receipts, trusted-review allowlist or operator policy grant. Both generated source bundles retain `reviews: []`, private intended use and `public-domain` original-source terms. [The proposed records](proposed-records.json) remain explicitly proposal-only; their `reviewable` disposition does not itself adopt or approve a source.

After assembly, genuine independent role review and a separate root admission assessment produced the [reviewed authority](reviewed-authority.md) and separate reviewed bundles. The fixed code now adopts those exact private subjects. This page describes the reproducible unsigned assembly, whose bytes and pins remain unchanged; the linked authority records the subsequent decision and scope. The unsigned bundles still quarantine.

The intended use is private offline administrative membership preparation from Natural Earth originals and the audited v6 normalized parts. The subjects cover the Natural Earth boundary input/normalization chain. They do not approve a public mixed OSM database, derivative offer, publication, deployment, observing access or searched-coverage claim. The notice destination is the actual upstream immutable source-tree URL, used as an evidence citation; it is **not a claim that NightSky has published an output notice page**. Licence/authority/third-party/mixed-output condition evidence remains material for independent rights review, not a newly issued review conclusion.

## Exact subjects and source identities

| Source key | Subject SHA-256 |
| --- | --- |
| `NE-v5.1.1-ADM0` | `6afdd8189eb50e1d8e508393d051cb5fef5fffa13030518a95965fb854f06e79` |
| `NE-v5.1.1-ADM1` | `06d404498660df3a966f5f7fcf0d3a058b5f1ee2b41030cacc32072b367a0673` |

The source edition is `5.1.1@9380cca83db5f9aef52d5e762765100745f84b27`. [ADM0](adm0-bundle.json) and [ADM1](adm1-bundle.json) use the actual immutable raw GitHub URLs at that commit. [The source manifest](manifests/sources.json) binds each exact record and payload. Source record hashes are the physical SHA-256 of the corresponding canonical, LF-terminated `manifests/adm0-source-record.json` and `manifests/adm1-source-record.json` bytes. [The subject index](subjects.json) retains bundle, record, lineage and every supporting artifact pin.

| Original | Measured bytes | Measured SHA-256 | Measured Git blob SHA-1 |
| --- | ---: | --- | --- |
| `ne_10m_admin_0_countries.geojson` | 13,287,234 | `239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255` | `5ebc66e25fc1af01edaebe9375c546655e04cf1e` |
| `ne_10m_admin_1_states_provinces.geojson` | 40,726,851 | `22d0e3ad85eb3e27f17cabf8ba2d50e554fbc27a87796ff891d958185da62fb5` | `4a8438f98ac7dfec7dc1739b1eaf91398ad33f22` |

The assembler rehashed those **54,014,085 original bytes** read-only under `plugin-v1/.cache/s2-geography-acquisition-20261016-r2/raw`, checking exact size, SHA-256, Git blob identity and observed mutation. Actual retained successful acquisition receipts are preserved in `evidence/adm0-receipt.json` and `evidence/adm1-receipt.json`; the new measurements are separate evidence files. No request was made and no body was copied.

[The licence](evidence/licence.txt) is the exact retained **4,636-byte** Natural Earth commit licence, SHA-256 `2631b5b39b6d1acc56de75235109b5af2dbb4b0ac5a127b6f06185977247fd4b`, Git blob `9dfbc3d55a4ab1dd758c253b2ee339888f632889`. Its bytes were verified against the fixed policy and copied unchanged. Do not normalize whitespace or line endings inside retained evidence after source review.

## Normalization chain and limits

All three actual prepared files remain read-only in `plugin-v1/.data/nine-global-staged-validation-20261016-v6/prepared`. Their exact Windows absolute paths are retained in the lineage documents. They are not replaced with fictional portable paths and are not copied into this packet.

| Prepared body | Original source | Bytes | SHA-256 | Mapped / unknown features |
| --- | --- | ---: | --- | --- |
| `boundaries-0.geojson` | ADM0 | 12,596,289 | `c05e09728d6fa92c56f44c54ccda87b8bdbd14d1733d9307d2d9e51b69259d99` | 238 / 20 |
| `boundaries-1.geojson` | ADM1 | 24,718,304 | `63599bc852fa013b398ff222de5d23f8dea2e578d2d17ae2a6b36d4f6bc9b642` | 2,871 / 24 |
| `boundaries-2.geojson` | ADM1 | 7,940,290 | `16a8e80eef9b135cf8b4536d93c2d924546cace5d7a33912077ed86fa23dd1ce` | 1,675 / 26 |

The assembler checked all **45,254,883 normalized bytes**, the ingestion/preparation completion pins and every prepared feature identity against the audited whole-feature source partitions. The counts remain **4,854 source features, 4,784 mapped and 70 explicitly unknown**, with **1,843,740 normalized positions** recorded by the pinned ingestion completion. It does not rerun geometry construction, ingestion, membership, point-in-polygon queries or provider jobs.

[The ADM0 lineage](lineage/adm0.json) binds the first output to the ADM0 original. [The ADM1 lineage](lineage/adm1.json) binds both remaining outputs to the ADM1 original. Each lineage document is itself pinned inside the reviewed source subject's `normalized-boundary-lineage` condition. The intended transform revision `natural-earth-retained-v6-20261016-3cbda439d1d39ab7` labels this assembled subject's exact retained transformation evidence; it is derived from the measured v6 ingestion-audit identity, not a claim that an upstream provider issued this revision name.

The packet preserves the exact **4,040,327-byte ingestion audit**, the **160,983-byte preparation audit**, both completion receipts and the boundary-shard metadata. The audit records 47 consecutive-position removal records covering 52 positions, plus the two explicit Egypt/Brazil tangent-hole extractions with one additional closure occurrence each. It preserves the opt-in `remove-consecutive-identical`, `extract-tangent-holes`, `preserve-unknown` and verified CRS84 policies. Attribute mapping, original/normalized positions and unknown identities are visible in [the normalization evidence](evidence/normalization-and-limitations.json). No unrecorded repair or geometry rebuild is performed here. Independent review must assess the factual transformation/edge evidence; the assembler's checks do not issue that review.

Natural Earth remains generalized 1:10m de facto cartography; ADM1 is beta, and missing/disputed/overseas/tiny administrative identities remain unknown. All 70 unresolved records, including the 20 ADM0 and 50 ADM1 identities, remain explicit. Coverage and access remain `unknown`; no extraction footprints, candidate completeness or public access are inferred from administrative membership.

## Reproduction and verification

From the assigned worktree:

```powershell
.\node_modules\.bin\tsx.cmd scripts/osm/prepare-retained-natural-earth-admission.ts
.\node_modules\.bin\tsx.cmd scripts/osm/prepare-retained-natural-earth-admission.ts --verify
```

The default command emits an offline plan and opens no retained body. `--verify` checks committed metadata pins, source subjects, strict lineage and the proposed-records inspection context; absent reviews must still produce quarantine. It validates the strict index before referenced reads: index at most 64 KiB, at most 32 unique safe-relative artifact pins with at most 8 MiB aggregate declared bytes, and exactly two known source keys bound to their frozen digests and bundle/record/lineage paths. Subsequent admission metadata checks share the existing 32 MiB distinct-file budget. The actual Windows runtime-lineage check is Windows-only because its retained paths are real Windows paths. Cross-platform tests still verify all artifact bytes/hashes, source schemas/digests, private scope, empty reviews and recorded Windows pin syntax; synthetic general admission tests exercise native path contracts separately. CI must not traverse the retained absolute source/output bodies.

`--assemble` is an explicit local evidence operation that reads the fixed retained edition and run, hashes original bodies in 64 KiB chunks, checks normalized feature identities and creates this packet **only if its directory is absent**. It refuses to overwrite an existing packet. It makes no network requests and never modifies `plugin-v1`, raw bodies, normalized bodies or existing audits. This wave ran that bounded metadata assembly once. No acceptance totals change and no receipt/build/publication allowance is created by it.

Any subsequent source/evidence/lineage/intended-use change creates a different `admissionSubjectDigest` and needs fresh independent role conclusions. Adopting operator policy records and review allowlists is a separate root-owned action after genuine review; these files cannot choose their own authority.
