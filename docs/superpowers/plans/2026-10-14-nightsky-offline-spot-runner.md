# Offline generic spot runner implementation plan

> **For agentic workers:** Use subagent-driven-development, TDD, independent code/spec review and verification-before-completion.

**Goal:** Implement the prerequisites for the exact three-source spot pilot without performing real retrieval.

**Architecture:** A strict immutable manifest feeds injected acquisition and generic reference/filter builds. A bounded journal/runner controls the whole new wave root and supervised Windows build workers. CLI remains offline; runtime catalog and old Bhutan evidence are unchanged.

**Tech Stack:** Python3.12+ /pyosmium4.3.1, Windows Jobs, canonical JSON, existing offline helpers; no new dependencies/database.

**Spec:** global-spot-acquisition-proposal.md and data-acquisition-proposal.md; owner approved offline three-lane implementation only.

## Constraints

No real provider requests/source/historydownloads, accounts, deployment/publication or website/runtimecatalog changes. FakeHTTP and genuine tiny syntheticPBF fixtures only. Existing branch/worktree; root owns shared integration/docs/tickets/push/CI. Old retained-source identity regression stays intact. ExactMonaco/Faroe/Fiji pins are not an authorization.

## Review focus

Redirect/length/encoding/ETag/header mismatches; symlink/junction/exclusive-output races; dateline mean equal-but-wrong; sampledbudget versus hardcommit guarantees; incomplete/corrupted journals mistaken for accepted recovery.

## Interfaces and ownership

- Acquisition lane: spot_manifest.py,spot_acquisition.py/test_spot_acquisition.py and safeguarddoc. `load_manifest(value)`, `manifest_digest(value)`, exact `{version:1,sources:[{id,url,declaredBytes,etag,expectedVintage,licenseUrl,sourcePage}]}`. `acquire_source(source,root,opener=None,deadline=None,budget_check=None)` accepts explicit fakecapability only; `validate_source_header(path,source)` checks actualPBF vintage. Pending-byte callback beforewrites andzero afterwrites. No default network capability.
- Build lane: spot_build.py/test_spot_build.py and geometrydoc. `build_source(source_path,output_dir,source,budget_check=None)` returns bounded provenance/equality/partition/exclusionreport; no runtimeinstall. Exactactualheader/rawidentity, boundedreferences, completewaymean closingvertex handling, explicit longitude-span>180 exclusion.
- Runner lane: spot_runner.py/test_spot_runner.py and recoverydoc. Exactmanifest/journal pin, injectedorchestration, maxsixrequestcount,900second overall,100MiB whole-wave logical accounting, oneactivephase. Windows supervisedworker60s/256MiB jobcommit+sampledRSS/rootdisk and boundedcleanup; portable CLIplan/rehearsal only. Interrupted/uncertain state blocks automatic restart; corruptcomplete evidence failsclosed.

## Parallel tasks

- [x] Acquisition failingtests→strictmanifest/fakeHEAD+GET/header/byte/deadline/exclusivepromotion implementation→focusedtests.
- [x] Build failingtests→generic boundedfilter/reference/datelineexclusion/partition/provenance implementation→genuine syntheticPBF tests.
- [x] Runner failingtests→whole-wave budgets/journal/corruption/recovery/Windowsworker supervision→portable/platform cases.

## Sequential integration

- [x] Independent lane and combinedreview; fix actionable findings.
- [x] Root exercises actual combined fakeacquisition→syntheticPBF build→journal/recovery path and registers relevantCI coverage.
- [x] Fresh PythonOSM suite onlocalWindows and Node/types/package/review/build/runtimes.
- [x] Exact-revision CI onbothOS verifies regressions afterpush.
- [x] Update originalTask0/8 evidence/status without claiming realworld/globalcoverage.
- [x] Scopedcommit/push and watch allCIjobs; record exactrevision and explicit retrievalstillheld.

## Rulings

Ruling: use explicit dateline-crossing-way exclusion instead of inventing a geometric correction — reviewedproposal allows this — exclusioncounts/sourceidentities remain visible and fullgeographiccompleteness unclaimed.
Ruling: enforce supervisedgenericbuild workers rather than ship a budgetstub — full offlineexperience was approved — acquisition mocks remain cooperative until separately approved liveworker capability.
Ruling: no defaultliveopener or fetchCLI — downloads are held — later enabling live retrieval requires reviewed allowance and explicit capability.

Evidence: docs/operations/offline-spot-runner-wave.md. Independent reviews and final fixture checks pass; all six exactrevisionCI jobs pass for5181248 (run38583724276).
