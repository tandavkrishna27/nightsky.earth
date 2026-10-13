# Data expansion wave — 14 October 2026

User authorization: proceed with all three proposed lanes using subagents, skills and review; finish locally, update original tickets/documents, test, push `codex/plugin-v1` and observe CI. No deployment. Starting revision: `897222745b51291fab25f368c14cc9821579c8ee`.

## Parallel ownership and acceptance

| Lane | Original tickets | Work | Acceptance / owner |
|---|---|---|---|
| Events | 0A / 6 | Research cleared full-season and additional-year calendars and missing radiants; implement only source-supported data and boundary calculations | Exact primary sources, explicit reuse disposition, focused regressions, partial coverage maintained. Event agent owns event code/data/tests and its operations note. |
| Spots | 0B / 8 | One bounded small offline extract, complete way geometry policy, cross-region identity/deduplication and measured regional loading | Immutable source/digests, supervised processing limits, actual counts/memory/time, no night-access or global inference. Spot agent owns OSM scripts/candidate implementation/tests and its note. |
| Historical | 0C / 9 | Bounded grouped-year request/decoder partitions preserving raw parent identity and exact requested clocks; concrete next retrieval proposal | Offline fixtures, leap-day/revision/clock/size/recovery checks, unchanged legacy limits and active 2025 artifact. Historical agent owns ERA5 scripts/tests and its note. |

Root owns shared contracts, aggregate tests, planner/comparison, tool/build configuration, canonical workflows/package and general ticket/status documents. Shared changes follow lane review; agents must not edit these concurrently.

## Source and resource gates

- No further live CDS requests in this wave's initial phase. The previous four-job allowance is exhausted. Present a concrete bounded request plan for user approval after offline implementation and review. Private CDS configuration stays outside the repository and is never printed, copied or committed.
- Spot acquisition may use one official small extract after size verification, with a hard 100 MiB download cap, bounded request/processing deadlines and recorded actual measurements. Do not repeat the retained India whole-extract scans, download a planet archive or bulk-scrape Overpass. Raw files stay ignored; reviewed compact fixtures and notices may be committed. Repository privacy does not satisfy the public ODbL offer gate.
- Public availability alone does not establish data reuse permission. Calendars/radiants without defensible reuse terms remain research-only. Never infer future-year recurrence, event seasons, user meteor rates or access guarantees.
- Regional and partial-year results remain explicit partial coverage. Fictional engineering fixtures are not real climatology. Runtime continues serving reviewed local aggregates without a user database or on-demand CDS acquisition.

## Review, integration and verification sequence

1. Run the three lanes in parallel with disjoint files and focused regression tests.
2. When a worker slot opens, dispatch independent review of completed source/code/test claims. Resolve important findings before integration.
3. Integrate accepted lane changes into aggregate tests and any affected planner/comparison/workflow paths. Preserve existing tool contracts unless a reviewed change is required.
4. Reconcile Tasks 0A/6, 0B/8 and 0C/9 against actual evidence; update Tasks 10A/10B/11C only where behavior changes. Do not count source-limited or hosted work as complete.
5. Run Windows and clean Linux Node/Python suites, all type checks, package/review checks, build and production runtime/audit checks; measure applicable artifact loading under the local server budget.
6. Commit/push existing branch without deployment and observe current-revision CI. Record exact evidence and remaining gates.

## Deferred inputs

Exact legal publisher name, selected Hetzner configuration/hostnames and intended Claude/Gemini account surfaces remain later release/connection inputs. They do not block local work in these lanes. Hosted connection, official validation, publication and invited-pilot observations remain separate acceptance gates.
