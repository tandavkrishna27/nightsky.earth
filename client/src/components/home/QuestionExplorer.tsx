import { useState } from "react";
import { Link } from "wouter";
import { questionExamples } from "@/content/websiteCopy";
export default function QuestionExplorer() {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("");
  const selected = questionExamples[index];
  async function copy() {
    try {
      await navigator.clipboard.writeText(selected.question);
      setStatus("Question copied");
    } catch {
      setStatus("Couldn’t copy. Select and copy the question above.");
    }
  }
  return (
    <div className="question-explorer">
      <div className="example-modes" aria-label="Ways to explore">
        {questionExamples.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={i === index}
            onClick={() => {
              setIndex(i);
              setStatus("");
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="example-panel" aria-live="polite">
        <p className="eyebrow">A little curiosity goes a long way</p>
        <p className="example-question" data-testid="example-question">
          {selected.question}
        </p>
        <p>{selected.explanation}</p>
        <div className="example-actions">
          <button className="text-link" onClick={copy}>
            Copy question <span aria-hidden="true">↗</span>
          </button>
          <Link href="/get-started" className="text-link">
            Getting started <span aria-hidden="true">→</span>
          </Link>
        </div>
        <span role="status" className="copy-status">
          {status}
        </span>
        <p className="example-note">
          Example questions — start a conversation in ChatGPT.
        </p>
      </div>
    </div>
  );
}
