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



Historical snapshot before the three-data-lanes wave: the plan had 7 Done, 14 Partial and 6 Not started headings. The current counts and acceptance evidence are in the final section below. CI execution is now verified, while full-season meteor catalog rights/coverage, broader spot coverage, real multi-year/global historical baseline and hosted/release acceptance remain open. See [implementation status](implementation-status.md) and [local completion checklist](local-completion-checklist.md).



This evidence identifies the implementation revision above. A subsequent documentation commit adds this record and runs the same CI again; its result is reported separately rather than retroactively changing the verified revision.



## Windows helper startup follow-up



The documentation revision 8558bea subsequently exposed a test-only startup timeout: its PowerShell COM helper was killed at 5,024 ms before returning a result. Five other jobs passed. Commit 2de2ff3 raises only that regression helper's bounded startup allowance from five to thirty seconds; production processing deadlines and strict path assertions are unchanged. All twelve focused tile-builder checks passed locally after the correction. The successful implementation run above remains valid evidence for its named revision; final branch CI must also pass before the work is reported verified.



## Three data lanes — 14 October 2026



Verified implementation revision `f521065d0af8a50ba664cd3d6923e9e9c6cc9210`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38456841770). Node 24 application, OSM importer and ERA5 offline suites passed on Windows and Linux. New regressions are included through the existing aggregate entry point and Python discovery.



Local final evidence: Windows 395 discovered/394 passed/one permission skip; clean 2 CPU/4 GiB Linux 395 discovered/388 passed/seven artifact/platform skips; zero failures. OSM6 and ERA539 passed on both systems. All three type checks, eight offline review sets, package validation, builds and both production runtimes passed. Latest sixty-request artifact capacity rerun had zero errors/external calls/required-artifact failures, peak RSS 512,299,008 bytes. Production dependency audit reported zero vulnerabilities; this does not describe the legacy development dependency audit.



Task 2 now closes: 27 headings = 8 Done/13 Partial/6 Not started; 19 groups = 4 Done/12 Partial/3 Not started. Tasks 6/8/9 retain source-completeness gates. Historical progress is four of 52 checkpoints, active runtime history remains the 2025 sample, and private repository OSM fixtures are not a public offer. No deployment or submission occurred. Follow-up documentation commits run the same CI separately.



## Data expansion — 14 October 2026



Verified implementation revision `756e02866c5b5a73f576511b2c4235222cf02126`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38462293288). Application tests/type checks/package/review/build/prune/production audit and both runtimes passed on Windows and Ubuntu. All fourteen OSM and forty-six ERA5 Python cases passed on both OS jobs; source/account data is not downloaded in CI.



Frozen local totals: Windows 401 discovered/400 passed/one permission skip; clean Linux 401 discovered/394 passed/seven scope skips; zero failures. Full Python14/46 passed on both. Sixty local 2 CPU/4 GiB artifact requests passed with zero errors/external calls/required-artifact failures and peak RSS512,212,992bytes. The pinned nonroot container exercised actual GeoNames plus the Bhutan fixture and new2025NASA calendar. Rehearsal package SHA256 `ddc843a719415776693f5bd6e64296b775af601cc9a6a20a09d856d605c3a6f3`. These are local checks, not hosting or official client validation.



The wave evidence is [data-expansion-wave.md](data-expansion-wave.md). Counts remain 8 Done/13 Partial/6 Not started; source/geographic/full-season/real-baseline and host/release gates remain open. No additional CDS request, deployment or publication occurred. This evidence names the implementation commit; the follow-up documentation commit runs the same CI separately.



## Offline readiness — 14 October 2026



Verified implementation revision `c20a38190375cb29169000774aa14d3d660a32c3`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38471282719). Node24 application/type/package/review/build/prune/audit and production checks passed on both OS jobs, including the newly expanded compiled full/resolver-only checks. Python14 OSM/46 ERA5 cases passed on Windows and Ubuntu; no historical data retrieval ran.



Frozen local suites: Windows431 discovered/430 passed/one permission skip; clean Linux431 discovered/424 passed/seven artifact/platform skips, zero failures. Both Python suites passed on both platforms. Eight offline review sets, real six-process candidate/climate rollback, actual compiled resolver Inspector list/call and pinned nonroot two-mode container tests passed. Latest60-request 2CPU/4GiB local workload had zero errors/external calls/artifact failures and peak RSS510,705,664 bytes. Production audit returned zero vulnerabilities; legacy development-dependency status is separate. Rehearsal ZIP SHA256 `eb3cecd7b0cd48bad63830c5dce7b52e9fcce9fedf27547add183724bc245cde`.



Tasks3/7A/10A/10B are Done against their original local criteria; counts12 Done/9 Partial/6 Not started (groups6/10/3). See `local-ticket-closure.md` for all remaining held evidence. An exploratory journey run reached NOAA before its missing override was corrected; frozen fixtures reject external requests. No CDS/historical download, deployment, account change, submission or publication occurred. This record names the implementation revision; final documentation CI is observed separately.



## Coverage and accuracy — 14 October 2026



Verified implementation revision `da569129b6c1233f8acd5a79b7f0afa3b245b066`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38520264907). Application/type/package/review/build/prune/production-audit and both runtime modes passed on Windows and Ubuntu. The expanded workflow also passed the fixed-seed 100,000-row indexed-query reference on both OS jobs: all24 ordered queries matched the independent full scan. The 512 MiB V8 heap allowance is not an RSS cap or a global source performance guarantee.



GitHub Node counts: Windows447 discovered/443 passed/four installed-artifact skips; Ubuntu447 discovered/440 passed/seven artifact/platform skips; zero failures. Python14 OSM/46 ERA5 passed on both. Local frozen counts were Windows446 passed/one permission skip and clean Linux440 passed/seven scope skips. The differing Windows skip counts reflect ignored operator artifacts on CI and local symlink privileges; they are not hidden failures.



[Wave evidence](coverage-accuracy-wave.md) records independent review, adaptive model-conditional lunar horizon handling, bounded same-vintage spot composition, retained-artifact rollback/capacity and offline nonroot container checks. Counts remain12 Done/9 Partial/6 Not started; full-source/global/owner/host gates remain open. No historical retrieval, deployment or publication occurred. This record names the implementation revision; the follow-up documentation commit runs the same CI and is observed separately.



## Events, regional serving and local proxy — 14 October 2026



Verified implementation revision `7e7bf4000bccd07f9894426110b8591c0f367279`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38526984222). Expanded compiled regional/operator smoke passed after production pruning on both Node jobs, including checksum startup rejection/restoration with zero external attempts. Tests/type/package/review/build/prune/production audit, full/resolver-only runtimes and synthetic100k reference also passed.



GitHub Node: Windows469 discovered/464 passed/five installed-artifact skips; Ubuntu469 discovered/461 passed/eight artifact/platform skips; zero failures. Python14 OSM/46 ERA5 passed on each OS. Final canonical clean-Git package ZIP was identical on both CI platforms: SHA256 `91da3db92459858da34811fb1518c982676664cacca05f0d0ff90a2a927895b8`. The local working-checkout SHA differs because exact source bytes preserve untouched CRLF files; Git blobs/CI checkouts use LF under .gitattributes. These are separate explicitly identified artifacts, not nondeterminism for identical inputs.



[Wave evidence](events-regional-proxy-wave.md) records verified retained India/Bhutan source versions, bounded serving, actual proxy/cancellation fixtures, nonroot network-isolated container attestations and two CPU/4GiB regional60-request measurements. Counts remain12 Done/9 Partial/6 Not started; source/global/identity/actualhost gates stay open. No historical download, deployment or publication. This record names the implementation commit; follow-up documentation CI is observed separately.



## V1 original acceptance closure — 14 October 2026



Verified documentation revision `8a12e37495f594cbc787baa7a3a560a4e43a3712`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38530009790). Both Node24 OS jobs and both OS pairs of OSM/ERA5 offline jobs completed successfully. This wave changed documentation only; the existing expanded CI covered tests, type checks, package/review/build/runtime checks and regional fixtures. Fresh local Windows suite:469 discovered/468 passed/one permission skip/zero failures. JSON/local-link/whitespace checks and the exact160-box/27-heading reconciliation passed.



[Closure evidence](v1-closure-wave.md) records independent review of278 granular dispositions (200 satisfied/33 partial/43 open/two conditional). Current headings are11 Done/10 Partial/6 Not started; Task4 original timezone-boundary acceptance is reopened. No deployment, historical/source acquisition, account change, submission or publication. This record identifies the verified substantive revision; its documentation-only follow-up CI is observed separately.



## Source evidence and data gap wave — 14 October 2026



Verified implementation revision `4da8870fec1ea7e61b22919260f8700de9c804c9`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38535497812). Both Node24 jobs passed the aggregated tests/types/package/offline review/build/prune/audit/runtime checks. The compiled regional check now verifies source-only ETA/ORI metadata, unavailable date conversion/overlap and empty2027 dated events with zero external attempts. OSM and ERA5 offline jobs passed on both operating systems.



Fresh local Windows suite:473 discovered/472 passed/one permission skip/zero failures; three type configurations, package lint, eight offline review sets, full build and standalone full/resolver-only plus compiled regional checks passed. Independent review found no actionable implementation or scope issues. [Wave evidence](data-gap-wave.md) preserves11 Done/10 Partial/6 Not started, unchanged boundary acceptance and remaining full-season/global/host gates. No deployment, historical/bulk downloads, account changes or publication. Final documentation-only CI is observed separately.



## Named-place timezone and retained spot evidence — 14 October 2026



Verified implementation revision `af3f5e1c4b144993c1af963f237e9323f1a1e933`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38545635117). Both Node24 OS jobs completed tests/type/package/review/build/prune/audit and production/standalone/regional runtime checks. Expanded OSM discovery passed on both OS jobs; four supervisor cases are Windows-only and explicitly skipped on Linux. ERA5 offline jobs passed on both. No source acquisition ran inCI.



Fresh local Node484 discovered/483 passed/one permission skip/zero failures; PythonOSM20/20 passed after correcting the reproduced Windows termination-directory-release race. Three type checks, package/eight offline review sets/fullbuild/compiled runtimes passed. Independent review approved all lanes and final integration. [Wave evidence](local-evidence-wave.md) records accepted named-place Task4 Done,12 Done/9 Partial/6 Not started, exact134-candidate retained equality and unresolved meteor conversion/global coverage/host gates. No deployment, historical/new source download, account change or publication. Final documentation-only CI is observed separately.



## Bounded acquisition decision preparation — 14 October 2026



Verified documentation revision `880778a2701ec7ce17d4cfe9d990a017ce0433a6`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38575165940). Existing two-OS Node test/type/package/review/build/prune/audit/runtime checks and two-OS OSM/ERA5 offline tests passed. No runtime or workflow behavior changed in this wave.



Local validation checked exact offline grouped digest5eb57ba09de53fd9c8881d66444e2aecf868b9640bc9e2ccaff982f132cc565d, bothMarchjobs/1,488uniqueclocks/fourmonthlychildren, zero overlap with actualfourcompleteledgerentries,19meteorcodes/sixpeak-modeloverlap, JSON/local links and source/scratch arithmetic. Independent lane and consolidated review found no actionable issues. [Proposal](data-acquisition-proposal.md) remains preparation only: no retrievalallowance, authentication, historical/source download, deployment or publication. Counts12 Done/9 Partial/6 Not started unchanged. Final documentation-only CI is observed separately.



## Offline generic spot runner and Windows canonical paths — 14 October 2026



Verified revision `5181248a5136b39ce0f95fe14cbdfdceeffee574`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38583724276). Windows/Linux Node, OSM and ERA5 offline jobs passed. Earlier run38580931140 exposed Windows 8.3 aliases; shared lexical safeguards and canonical identity fix passes native short-name and dangling-junction regressions. Local OSM66 discovered/63passed/threeexplicit skips. No source/historical downloads or deployment. Model rehearsal evidence is recorded separately; final follow-up exact-head CI is observed.


## Complete local Claude/Codex package assembly — 14 October 2026

Verified substantive revision `5b3ebdad55d80c92b2277cfdace9a10f4d324bde`: [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38591337445). Windows/Linux Node jobs ran aggregate tests, three type configurations, public and both complete local package verification, eight offline MCP review sets, build/prune/audit and production/standalone/regional runtimes. OSM and ERA5 offline jobs passed on both operating systems. No plugin installation/upload, model invocation or source/history retrieval in CI.

Fresh local Windows Node24.14.0:496 discovered/495 passed/one permission skip/zero failures. Both packages preserve five exact canonical workflow references and false install/submission flags. Independent review reproduced and resolved raw metadata lint bypasses; focused re-review16/16 passed. The offline-operations report also verified eight server sets and six fresh-process corruption/recovery checks with identical restoration and official validation false.

[Package notes](local-plugin-package.md), [handoff](local-completion-next-actions.md) and [wave plan](../superpowers/plans/2026-10-14-nightsky-local-package-completion.md) preserve deferred accuracy/installed-skill/model/source/host/public gates. Current headings10 Done/11 Partial/6 Not started, groups4/12/3, original160 boxes89checked/71open. This identifies the verified substantive revision; final documentation-followup CI is observed separately. No deployment or new data acquisition.
