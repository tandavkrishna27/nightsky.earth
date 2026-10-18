import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Pause,
  Play,
  RotateCcw,
  ArrowUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import AssistantIcon, { assistants } from "@/components/AssistantIdentity";
import { journeyExamples } from "@/content/homepage";
import person from "@assets/stock_images/person_silhouette_st_c7feb986.jpg";
import milky from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";
import aurora from "@assets/stock_images/aurora_borealis_nort_b91defe5.jpg";
import cabin from "@assets/stock_images/long_exposure_stars__411203e7.jpg";

const scenes = [
  [person, "A person looking up beneath a sky filled with stars"],
  [milky, "The Milky Way above a dark landscape"],
  [aurora, "Aurora illuminating the night sky"],
  [cabin, "A cabin beneath a winter sky"],
] as const;
const answerStart = 3500;
const wordInterval = 65;
const wordCount = (text: string) => text.split(/\s+/).length;

export default function QuestionExplorer() {
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isUserPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [inView, setInView] = useState(false);
  const [entered, setEntered] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(!document.hidden);
  const [fallback, setFallback] = useState(false);
  const chat = useRef<HTMLDivElement>(null);
  const example = journeyExamples[index];
  const paragraphStarts = example.paragraphs.map(
    (_, i) =>
      answerStart +
      example.paragraphs
        .slice(0, i)
        .reduce(
          (time, paragraph) => time + wordCount(paragraph) * wordInterval + 200,
          0,
        ),
  );
  const followupStart =
    answerStart +
    example.paragraphs.reduce(
      (time, paragraph) => time + wordCount(paragraph) * wordInterval + 200,
      0,
    );
  const duration =
    followupStart + wordCount(example.followup) * wordInterval + 350;
  const isStatic = reduced || fallback;
  const complete = elapsed >= duration;
  const running =
    !isStatic &&
    !complete &&
    !isUserPaused &&
    inView &&
    entered &&
    documentVisible;
  const state = isStatic
    ? "static"
    : complete
      ? "complete"
      : running
        ? "playing"
        : elapsed > 0 || isUserPaused
          ? "paused"
          : "idle";

  useEffect(() => {
    const element = chat.current!;
    const shell = element.closest("[data-experience-content]");
    const updateEntry = () => setEntered(!shell?.hasAttribute("inert"));
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    updateEntry();
    document.addEventListener("visibilitychange", updateVisibility);
    if (
      typeof IntersectionObserver === "undefined" ||
      typeof MutationObserver === "undefined"
    ) {
      setFallback(true);
      return () =>
        document.removeEventListener("visibilitychange", updateVisibility);
    }
    const observer = new IntersectionObserver(
      ([entry]) =>
        setInView(entry.isIntersecting && entry.intersectionRatio >= 0.15),
      { threshold: [0, 0.15] },
    );
    observer.observe(element);
    const entrance = new MutationObserver(updateEntry);
    if (shell)
      entrance.observe(shell, { attributes: true, attributeFilter: ["inert"] });
    return () => {
      observer.disconnect();
      entrance.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(media.matches);
      setElapsed(duration);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [duration]);

  useEffect(() => {
    if (!running) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      setElapsed((value) => Math.min(duration, value + delta));
    }, 40);
    return () => clearInterval(timer);
  }, [running, index, duration]);

  const select = (next: number) => {
    setIndex(next);
    setElapsed(0);
  };
  const control = () => {
    if (complete) {
      setElapsed(0);
      setUserPaused(false);
    } else setUserPaused((value) => !value);
  };
  const controlLabel = complete
    ? "Replay demo"
    : isUserPaused
      ? "Resume demo"
      : "Pause demo";
  const ControlIcon = complete ? RotateCcw : isUserPaused ? Play : Pause;
  const stage = (at: number, animated: boolean): CSSProperties => ({
    visibility: !animated || elapsed >= at ? "visible" : "hidden",
    opacity: !animated || elapsed >= at ? 1 : 0,
    transform: !animated || elapsed >= at ? "translateY(0)" : "translateY(5px)",
  });
  const conversation = (animated: boolean) => {
    const stream = (text: string, start: number) =>
      text.split(/\s+/).map((word, i) => (
        <span
          className="demo-word"
          key={i}
          style={{
            visibility:
              !animated || elapsed >= start + (i + 1) * wordInterval
                ? "visible"
                : "hidden",
            opacity:
              !animated || elapsed >= start + (i + 1) * wordInterval ? 1 : 0,
          }}
        >
          {word}{" "}
        </span>
      ));
    const message = (
      key: string,
      speaker: string,
      text: ReactNode,
      at: number,
    ) => (
      <li
        className={`demo-message demo-stage ${speaker === "You" ? "is-user" : "is-assistant"}`}
        data-message={key}
        style={stage(at, animated)}
      >
        {speaker !== "You" && <span className="demo-speaker">{speaker}</span>}
        {key === "answer" ? (
          text
        ) : (
          <p
            data-testid={
              !animated && key === "question" ? "example-question" : undefined
            }
          >
            {text}
          </p>
        )}
      </li>
    );
    return (
      <ol className="demo-messages">
        {message("question", "You", example.question, 700)}
        {message(
          "clarification",
          "Assistant",
          stream(example.clarification, 1400),
          1400,
        )}
        {message("reply", "You", example.reply, 2200)}
        <li
          className={`demo-activity demo-stage ${animated && elapsed >= 2850 && elapsed < 3500 ? "is-thinking" : ""}`}
          style={stage(2850, animated)}
        >
          <Sparkles size={14} aria-hidden="true" />
          <span>
            NightSky ·{" "}
            {!animated || complete
              ? "Example response"
              : "Preparing your next steps"}
          </span>
          <span className="thinking-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </li>
        {message(
          "answer",
          "With NightSky",
          <div
            className="demo-visible-text"
            data-testid={!animated ? "example-response" : undefined}
          >
            {example.paragraphs.map((paragraph, i) => (
              <p
                className="demo-stage"
                key={paragraph}
                style={stage(paragraphStarts[i], animated)}
              >
                {stream(paragraph, paragraphStarts[i])}
              </p>
            ))}
            <p
              className="demo-followup demo-stage"
              style={stage(followupStart, animated)}
            >
              {stream(example.followup, followupStart)}
            </p>
          </div>,
          3500,
        )}
      </ol>
    );
  };
  return (
    <div
      className="question-explorer"
      data-testid="conversation-demo"
      data-playback-state={state}
    >
      <div
        className="journey-choices"
        role="group"
        aria-label="Choose a conversation example"
      >
        {journeyExamples.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={i === index}
            aria-controls="conversation-example"
            onClick={() => select(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div id="universe" className="journey-layout">
        <figure className="journey-scene">
          <img
            key={example.id}
            src={scenes[index][0]}
            alt={scenes[index][1]}
            loading="lazy"
          />
          <figcaption>
            <h3>{example.title}</h3>
            <p>{example.caption}</p>
          </figcaption>
        </figure>
        <div className="journey-chat" ref={chat}>
          <div className="question-platform">
            <div
              className="assistant-brands"
              aria-label="For ChatGPT, Claude, Gemini and Grok"
            >
              {assistants.map(assistant => <span key={assistant.id}>
                <AssistantIcon id={assistant.id} />{assistant.name}
              </span>)}
            </div>
            <span className="plugin-brand">
              <Sparkles size={14} aria-hidden="true" />
              NightSky.earth plugin
            </span>
          </div>
          <div id="conversation-example" className="demo-panel">
            <div
              className={`demo-transcript ${isStatic ? "" : "sr-only"}`}
              aria-label={`${example.label} example conversation`}
            >
              {conversation(false)}
            </div>
            {!isStatic && (
              <div className="demo-animation" aria-hidden="true">
                {conversation(true)}
              </div>
            )}
          </div>
          <div className="demo-composer" aria-hidden="true">
            <span>Ask about the night sky…</span>
            <ArrowUp size={16} />
          </div>
          <div className="demo-controls">
            <span>
              Example {String(index + 1).padStart(2, "0")} / {example.label}
            </span>
            <div className="demo-control-actions">
              {!isStatic && (
                <button onClick={control} aria-label={controlLabel}>
                  <ControlIcon size={13} aria-hidden="true" />
                  {controlLabel.replace(" demo", "")}
                </button>
              )}
              <button
                onClick={() => select((index + 1) % journeyExamples.length)}
                aria-label="Next example"
              >
                Next example <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <p className="journey-disclaimer">
        Illustrative conversations. Your place, date and conditions shape the
        guidance.
      </p>
    </div>
  );
}
