import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dimensions, criticalFailures, validateCases, reviewConversation, aggregateReviews } from "../../scripts/lib/conversation-review";

const cases = () => JSON.parse(readFileSync("tests/fixtures/v1-conversation-cases.json", "utf8"));
const reviewed = () => ({ caseId: "hyderabad-corrections", status: "reviewed", evidenceKind: "controlled-agent", responseRef: "retained/responses.md#case-1", reviewer: "explicit reviewer", scores: Object.fromEntries(dimensions.map(d => [d, { score: 2, evidence: "Turn 1: retained response supports this judgement." }])), criticalFailures: [] });

test("conversation matrix covers every required variant and turn expectations", () => {
  validateCases(cases());
  assert.throws(() => validateCases(cases().slice(1)));
  const broken = cases(); broken[0].turns[0].expected = [];
  assert.throws(() => validateCases(broken));
});
test("review requires eight explicit evidenced scores in range", () => {
  assert.equal(reviewConversation(reviewed()).verdict, "pass");
  for (const score of [-1, 3, 1.5, "2"]) {
    const row = reviewed(); row.scores.intentFit!.score = score as number;
    assert.throws(() => reviewConversation(row));
  }
  const missing = reviewed(); delete missing.scores.intentFit;
  assert.throws(() => reviewConversation(missing));
  const blank = reviewed(); blank.scores.intentFit!.evidence = " ";
  assert.throws(() => reviewConversation(blank));
  assert.throws(() => reviewConversation({ ...reviewed(), responseRef: " " }));
  assert.throws(() => reviewConversation({ ...reviewed(), evidenceKind: "packaging" }));
});
test("critical failures override even a perfect score", () => {
  for (const id of criticalFailures) {
    const row = { ...reviewed(), criticalFailures: [{ id, evidence: "Turn 2: explicit failure evidence." }] };
    assert.equal(reviewConversation(row).total, 16);
    assert.equal(reviewConversation(row).verdict, "fail");
  }
  assert.throws(() => reviewConversation({ ...reviewed(), criticalFailures: [{ id: "unknown", evidence: "example" }] }));
  assert.throws(() => reviewConversation({ ...reviewed(), criticalFailures: [{ id: "invented-access", evidence: " " }] }));
});
test("partial or zero dimensions fail and absent execution never passes", () => {
  const weak = reviewed(); weak.scores.intentFit!.score = 0;
  assert.equal(reviewConversation(weak).verdict, "fail");
  const partial = reviewed();
  partial.scores.intentFit!.score = 1;
  partial.scores.actionability!.score = 1;
  assert.equal(reviewConversation(partial).total, 14);
  assert.equal(reviewConversation(partial).verdict, "pass");
  partial.scores.continuity!.score = 1;
  assert.equal(reviewConversation(partial).total, 13);
  assert.equal(reviewConversation(partial).verdict, "fail");
  for (const status of ["unreviewed", "not-run"]) assert.equal(reviewConversation({ caseId: "city-only", status, evidenceKind: "native-host" }).verdict, "pending");
});
test("aggregation preserves evidence lanes and missing cases are pending", () => {
  const summary = aggregateReviews(["hyderabad-corrections", "city-only"], [reviewed()]);
  assert.equal(summary["controlled-agent"].verdict, "pending");
  assert.deepEqual(summary["native-host"].missing, ["hyderabad-corrections", "city-only"]);
  assert.equal(summary["native-host"].verdict, "pending");
  assert.throws(() => aggregateReviews(["hyderabad-corrections"], [reviewed(), reviewed()]));
  assert.throws(() => aggregateReviews(["city-only"], [reviewed()]));
  assert.equal(aggregateReviews(["hyderabad-corrections"], [{ ...reviewed(), evidenceKind: "fixture" }]).fixture.verdict, "pass");
  assert.equal(aggregateReviews(["hyderabad-corrections"], [reviewed()])["controlled-agent"].verdict, "pass");
  const failed = { ...reviewed(), criticalFailures: [{ id: "invented-access", evidence: "Turn 1 invented permission." }] };
  assert.equal(aggregateReviews(["hyderabad-corrections", "city-only"], [failed])["controlled-agent"].verdict, "fail");
});
