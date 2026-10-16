# Geography production-admission handoff — 17 October 2026

Worktree: `C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\geography-readiness`. Branch: `codex/geography-readiness`. This wave began clean at integrated **`ca7de5a70a60e7178c5ccf6f1f3e03ee5ffe9538`**. No applicable AGENTS.md was found. All edits/Git operations stayed in this assigned worktree; no other branch was merged or cherry-picked.

## Delivered production boundary

The [production gate](production-source-admission.md) now binds the actual raw manifest and assembly plan, each source subject, approved normalized boundary lineage, actual boundary/footprint bodies, retained evidence, fixed authority/loader/bridge files and complete invocation/resume identity. Production CLI inputs cannot select a policy or review allowlist. The actual gate derives the immutable retained policy and a fixed **empty** trusted-review allowlist. Caller-supplied inspection trust remains an offline inspection interface and cannot authorize production.

Production raw and membership commands require a separately pinned admission envelope. The supervised path checks it before creating a job, holds Windows deny-write/delete handles across retained file inputs and all three stages, rechecks under those leases and passes one snapshot through preparation, raw selection and assembly. The staged manifest is audit evidence; raw parsing uses the exact admitted original manifest. The raw CLI also holds its retained inputs. Raw file witnesses are compared across passes. Checkpoints/completion preserve admission snapshot identity; resume refuses changed or missing identity. Assembly checks the producer snapshot plus its canonical manifest hash, policy and catalogue revision and rechecks before its completion marker. Descriptor reads stay bounded when files grow. No new raw copy is made.

The old direct raw-to-catalogue bridge has no admitted boundary lineage/assembly contract and refuses before Job launch; real production uses supervised membership assembly. Existing synthetic tests now call library primitives via test-owned tiny reserved-domain XML launchers, with no production CLI bypass flag. The previously integrated base-interpreter fixture launcher behavior remains intact.

[Provider-aware boundary rules](provider-source-admission.md) select Natural Earth only from explicit trusted operator records with exact original/payload/licence/normalization pins. Candidate provider labels cannot select the branch. Omitted/GeoBoundaries classifications preserve all legacy rules. Approved normalization lineage is part of the full reviewed source subject and binds original identity, revision and exact output pins. No actual Natural Earth or planet policy record/review grant was added.

The gate enforces a shared **32 MiB distinct metadata** allocation before reads, retaining existing per-bundle/per-artifact limits. Normalized boundary aggregate remains **64 MiB**, with **128 MiB** individual assembly candidates/exclusions/lineage/footprint caps unchanged. All producer, classification, publication, scratch, source, memory/process and wall ceilings stay unchanged. The 95,380,942,829-byte proposed planet remains absent. Preparation remains separate from the **2 CPU / 4 GB Hetzner serving host**.

## Review and resolved findings

Provider policy and execution binding were implemented independently in disjoint files. A third agent reviewed policy, actual execution hooks, code/metadata binding, lease behavior, completion/resume rules, fixtures and bounds, and reported **no remaining actionable findings** within the candidate-input/TOCTOU scope.

Review and local verification resolved these concrete issues: early refusal of the legacy ungated bridge; binding producer manifest/policy/revision in addition to a copied snapshot; bounded reads for growing assembly descriptors; shared metadata accounting before allocation; stale readiness claims; and a real process-count failure. A raw Python worker launching the old tsx gate attempted a third esbuild process under the existing two-process Windows Job and failed with `spawn UNKNOWN`. The fixed `production-type-loader.mjs` uses Node 24 built-in in-process type stripping. An actual cold-TEMP Windows Job regression now runs Python + Node and receives the expected structured gate refusal without adding a process or raising limits. Loader/bridge changes invalidate the snapshot.

## Verification

- Focused TypeScript geography set: **55 passed**, zero failures/skips (provider, production, preparation/parity, source/planet admission, assembly and capacity).
- Full unchanged shared Node aggregator: **944 run, 938 passed, six skipped**, zero failures.
- `npm run check`: all repository TypeScript projects passed. Explicit strict TypeScript checks also passed for new modules/tests and the test-owned membership launcher.
- Full OSM Python suite in the worktree-owned pinned Python 3.14 environment: **180 run, 176 passed, four platform/privilege skips**, zero failures. This includes real Windows containment, PBF fixtures, cold-loader two-process gate checks, held-file leases and the complete legacy synthetic producer/assembly/supervisor/measurement suite.
- `git diff --check`: passed. Shared tracker, `tests/all.test.ts`, `tsconfig.tools.json` and workflow are unchanged.

The initial global Python run lacked optional osmium. A worktree-owned isolated Python 3.11 environment installed only pinned OSM dependencies, but an unchanged baseline test requires `Path.is_junction` (Python 3.12+); no production or baseline test was weakened for that interpreter. The full suite passed in a separate worktree-owned Python 3.14 environment with the same pinned dependencies. Package installation is not dataset acquisition. Both environments stay ignored under this worktree's `.cache`; no other environment or retained data was mutated.

A focused resume test initially observed a code-pin size mismatch while the final guard edit was still being written; after all implementation files stabilized, the complete 55-test set passed. That refusal correctly retained the executable-context mutation check.

## Outstanding actual-source gates

1. The real production trusted-review allowlist is empty, and the retained policy still lacks the selected planet and Natural Earth subjects. A separately reviewed immutable policy/trust revision must bind actual source records and independent subject-bound provenance/payload/rights/domain/admission reviews. Fictional test contexts cannot enter the CLI authority.
2. Only separately authorized actual receipt can establish the planet local SHA-256 and native PBF vintage/observation. No body was acquired here, and no receipt allowance or approval was created. Actual descriptor/native evidence, public whole-world evidence and exact source subject preparation remain required after receipt.
3. Natural Earth's retained measured originals/licence/normalization evidence must be assembled into actual reviewed source subjects and exact normalized lineage; implemented provider rules alone grant nothing. Preserve generalized cartography, unknown memberships, exclusions and normalization audit.
4. A separately authorized bounded build still needs a live nonoverlapping retained-path inventory, fresh capacity/reserve/memory observation and coordination with co-resident work. Passing admission supplies no searched cells, throughput prediction, worldwide completion or serving fit.
5. Completed scanning and independent footprint evidence, derivative distribution/offer decisions, catalogue size/query/concurrency/rollback measurements and concrete installation approval remain separate. No deployment/publication occurred.

Acceptance totals remain **12 Done / 9 Partial / 6 Not Started**. No source body download, provider job, credential inspection, deployment, publication or actual source approval occurred.

## Coordinator integration and commit

Add imports for `tests/places/providerSourceAdmission.test.ts` and `tests/places/productionSourceAdmission.test.ts` to the shared aggregator; this lane deliberately did not edit it. New Python tests are automatically discovered. The production TypeScript module is already in the tools typecheck import closure through membership assembly; no tools-config change is required for these imports. Node 24 is required for the fixed gate loader, matching the existing six-job CI Node runtime.

Final reviewed implementation commit: **`a4463dc6c39807bae22e19f52dfcff94c0817c39`** (`feat(osm): bind trusted source admission to production execution`). The following handoff-only commit records this result and is the pushed branch tip. The lane watches the exact tip's six-job `NightSky V1 checks` workflow; the final response supplies its exact commit, run URL and observed conclusion. No CI result is inferred from a previous commit. Earlier receipt work is retained through integrated baseline ca7de5a; it is not new acceptance evidence for this wave.
