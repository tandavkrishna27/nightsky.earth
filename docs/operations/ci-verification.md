# Local and GitHub verification — 13 October 2026

## Verified implementation revision

Branch: `codex/plugin-v1`. Commit: `ac8089116c35f6c744ac78d6250171f6332a455a`.

[GitHub run 38446465326](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38446465326) completed successfully with all six jobs:

| Check | Windows | Ubuntu |
|---|---|---|
| Node 24 aggregate suite | 367 passed, 4 installed-artifact skips | 364 passed, 4 installed-artifact and 3 Windows-only skips |
| TypeScript, package, eight offline review sets, build | Passed | Passed |
| Production dependency audit | Zero findings | Zero findings |
| Built website/MCP and standalone plugin runtime checks | Passed | Passed |
| OSM Python fixtures | 6 passed | 6 passed |
| ERA5 Python fixtures | 33 passed | 33 passed |

Both Node jobs discover 371 tests and report zero failures. Ignored private/local data artifacts are intentionally absent from clean runners. The Linux symlink test passes; Windows CI has sufficient privileges to exercise it too. Tests use offline fixtures and do not make CDS retrieval or global dataset requests.

Local Windows runs all installed-artifact checks: 370 passed and one privilege-dependent symlink skip. The earlier constrained Linux rehearsal measured 60 actual-artifact MCP requests, zero errors or external calls, and 511,082,496 bytes peak RSS with 2 CPUs/4 GiB. Docker build and nonroot container health/twelve tools/absent news route passed. These measurements do not establish production capacity, forecast accuracy or global coverage.

## CI failures investigated and resolved

The first run at `640c219` passed five jobs and failed Windows Node. Git converted text fixture line endings, invalidating the exact public OSM checksum and skill-frontmatter assertion. `.gitattributes` now preserves LF text bytes across checkout platforms; the source blob retains the reviewed checksum.

Path comparisons also rejected Windows aliases. The drive-case regression fix at `f447818` resolved drive-letter variation but did not cover the runner's short temporary path. CI diagnostics subsequently confirmed `RUNNER~1` resolves to `runneradmin`. Fixtures now canonicalize the temporary base and created root. Product checks continue rejecting noncanonical output aliases and symlinks; they do not broadly lowercase paths. Local regressions exercised the actual Windows case/8.3 aliases before the successful run.

## Publication and plan boundaries

The source branch is pushed; no production deployment, marketplace submission, publication or pilot was performed. The rehearsal package still has an example endpoint. Publisher direction is individual/India with support `nightsky.earth2026@gmail.com`; exact verified legal identity remains a release gate.

The original plan still has 7 Done, 14 Partial and 6 Not started headings. CI execution is now verified, while full-season meteor catalog rights/coverage, broader spot coverage, real multi-year/global historical baseline and hosted/release acceptance remain open. See [implementation status](implementation-status.md) and [local completion checklist](local-completion-checklist.md).

This evidence identifies the implementation revision above. A subsequent documentation commit adds this record and runs the same CI again; its result is reported separately rather than retroactively changing the verified revision.

## Windows helper startup follow-up

The documentation revision 8558bea subsequently exposed a test-only startup timeout: its PowerShell COM helper was killed at 5,024 ms before returning a result. Five other jobs passed. Commit 2de2ff3 raises only that regression helper's bounded startup allowance from five to thirty seconds; production processing deadlines and strict path assertions are unchanged. All twelve focused tile-builder checks passed locally after the correction. The successful implementation run above remains valid evidence for its named revision; final branch CI must also pass before the work is reported verified.

## Three data lanes — 14 October 2026

Verified implementation revision `f521065d0af8a50ba664cd3d6923e9e9c6cc9210`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38456841770). Node 24 application, OSM importer and ERA5 offline suites passed on Windows and Linux. New regressions are included through the existing aggregate entry point and Python discovery.

Local final evidence: Windows 395 discovered/394 passed/one permission skip; clean 2 CPU/4 GiB Linux 395 discovered/388 passed/seven artifact/platform skips; zero failures. OSM6 and ERA539 passed on both systems. All three type checks, eight offline review sets, package validation, builds and both production runtimes passed. Latest sixty-request artifact capacity rerun had zero errors/external calls/required-artifact failures, peak RSS 512,299,008 bytes. Production dependency audit reported zero vulnerabilities; this does not describe the legacy development dependency audit.

Task 2 now closes: 27 headings = 8 Done/13 Partial/6 Not started; 19 groups = 4 Done/12 Partial/3 Not started. Tasks 6/8/9 retain source-completeness gates. Historical progress is four of 52 checkpoints, active runtime history remains the 2025 sample, and private repository OSM fixtures are not a public offer. No deployment or submission occurred. Follow-up documentation commits run the same CI separately.
