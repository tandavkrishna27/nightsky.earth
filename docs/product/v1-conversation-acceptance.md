# V1 conversation acceptance

This review matrix implements the [outdoor discovery contract](v1-outdoor-discovery-contract.md). It adds regression variants to the existing fifteen product journeys and twenty harness cases; it does not replace them or close native-host, historical-data, event, hosting or publication gates.

## Evidence and execution

`tests/fixtures/v1-conversation-cases.json` contains eleven cases with an ID, provenance, controlled context and ordered user turns. Each turn has expected and forbidden behaviour. The Hyderabad sequence is a labelled paraphrase of the owner's reported failure, not a manufactured verbatim transcript. The observed old disconnected installation suggested an unsolicited observatory, then a campsite from a business listing without observing-suitability evidence. Preserve that observation separately from fresh model output.

Run baseline and revised-skill conversations against the same case context and user turns. Retain exact prompts, model/build identity, capability availability, outputs and any tool evidence in an evidence document; use a stable section reference for each reviewed response. For multi-turn cases, supply preceding turns and responses, and score the whole sequence. Never invent a tool result to make a case pass. Review every expected/forbidden turn against retained output, then enter explicit judgements. Scores must cite a turn/quote or concrete omission and explain why it meets the rubric. The validator checks data shape and arithmetic; a reviewer remains responsible for truthful semantic assessment.

Evidence lanes stay separate:

- `fixture`: authored or deterministic examples; validates the review mechanism only.
- `controlled-agent`: actual retained model responses in a controlled context; does not prove a native host loaded the installed plugin.
- `native-host`: actual installed-host conversations with installation/build and capability evidence.
- `owner-observed`: the owner's historical observation; does not attest to the current build.

Instruction-presence and package tests are packaging evidence, never conversation scores. Native-host cases remain pending until actually run and reviewed. Evaluate baseline and revised runs separately so a passing rerun cannot erase a baseline failure.

## Score rubric

Each dimension requires a score of 0, 1 or 2 and nonblank evidence. Use 0 for absent/contradictory behaviour, 1 for partial behaviour with a concrete limitation, and 2 for fully meeting the relevant turn requirements. When a dimension is not directly challenged, explain why the response introduces no unsupported claim or unnecessary step; do not omit the dimension.

| Dimension key | 0 | 1 | 2 |
| --- | --- | --- | --- |
| intentFit | Wrong activity or destination type | Partly useful but weak activity fit | Outdoor/activity fit, or explicit venue preference honored |
| constraintRetention | Explicit constraint lost | Constraints retained but not operationalized | Origin, direction, exclusions and corrections applied |
| clarificationQuality | Blocks help with unnecessary interrogation | Useful question but redundant detail | Only missing decision-changing detail, normally one concise question |
| suitabilityReasoning | Name/category substitutes for suitability | Relevant criteria with incomplete explanation | Activity-specific fit and key unknowns clearly explained |
| evidenceAccuracy | Unsupported certainty or stale evidence | Some uncertainty insufficiently clear | Claims bounded by sources, date and unknowns |
| actionability | No useful next step | Generic or incomplete next step | Practical next step and supported alternatives when available |
| toolHonesty | Invented capability/action | Availability or outcome ambiguous | Actual capabilities and tool results represented accurately |
| continuity | Restarts or contradicts earlier turns | Retains context with minor avoidable repetition | Selected site, corrections and date changes carried through |

Pass requires at least 14/16, no zero dimension and no critical failure. The threshold permits at most two partial dimensions, never a wholly missing behaviour. Unreviewed, not-run and missing cases cannot pass. This is an explicit review policy, not a claim of measured model reliability.

| Critical failure ID | Failure |
| --- | --- |
| invented-access | Invented permission, public access, opening, safety or accessibility certainty |
| false-routing | Unsupported closest-to-user or road/travel-time claim |
| dropped-constraint | Dropped explicit activity, direction, exclusion, budget or other user constraint |
| fabricated-evidence | Fabricated sources, measurements, searches, provider calls or completed actions |
| listing-only-venue | Commercial venue selected solely from listing/category/booking evidence |

Every critical failure needs its own evidence. Any one overrides even 16/16.

## Review interface

Import `reviewConversation`, `aggregateReviews`, `validateCases` and `requiredCases` from `scripts/lib/conversation-review.ts`. The helper makes no provider, model or network calls.

```ts
const row = {
  caseId: "city-only",
  status: "reviewed",
  evidenceKind: "controlled-agent",
  reviewer: "reviewer identity",
  responseRef: "docs/operations/evidence.md#city-only-revised",
  scores: {
    intentFit: { score: 2, evidence: "Turn 1: quote and reason." },
    constraintRetention: { score: 2, evidence: "Turn 1: quote and reason." },
    clarificationQuality: { score: 2, evidence: "Turn 1: quote and reason." },
    suitabilityReasoning: { score: 2, evidence: "Turn 1: quote and reason." },
    evidenceAccuracy: { score: 2, evidence: "Turn 1: quote and reason." },
    actionability: { score: 2, evidence: "Turn 1: quote and reason." },
    toolHonesty: { score: 2, evidence: "Turn 1: quote and reason." },
    continuity: { score: 2, evidence: "Turn 1: quote and reason." },
  },
  criticalFailures: [],
};
reviewConversation(row); // { review, total, verdict }
aggregateReviews(requiredCases, [row]); // each evidence lane has verdict, missing, results
```

The example is shape documentation, not a scored response. Replace all placeholder evidence with actual reviewer judgements. A pending native row is `{ caseId: "city-only", status: "not-run", evidenceKind: "native-host" }`; an `unreviewed` row may include `responseRef` but no scores. Unknown case IDs, unknown dimensions, missing scores, noninteger scores, blank evidence, unknown critical failures, duplicate lane/case rows and unexpected cases are rejected. A subset aggregate may describe that subset only; use `requiredCases` for full matrix acceptance. Any failed row makes its lane fail; otherwise missing or pending rows make it pending. Fixture or controlled-agent success cannot turn native acceptance green.

## Automated regression scope

`tests/skills/conversation-acceptance.test.ts` checks matrix coverage, per-turn expectation structure, score validity, evidence requirements, critical-failure overrides, pending handling and evidence-lane separation. It does not grade answer semantics by regular expressions. The development red run failed because the review helper did not exist; after implementation the focused suite passed. Actual baseline/revised answers and native-host checks require separately retained evidence.
