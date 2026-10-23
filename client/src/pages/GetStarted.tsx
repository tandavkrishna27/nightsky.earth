import { useEffect, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import InstallationGuide from "@/components/setup/InstallationGuide";
import SetupFaqs from "@/components/setup/SetupFaqs";
import { setupGuideHref } from "@/lib/setupGuideState";
import { ArrowRight, Check, Copy, Sparkles } from "lucide-react";
import AssistantIcon, {
  assistants,
  type AssistantId,
} from "@/components/AssistantIdentity";
import { resolveAssistantListingUrl } from "@/lib/assistantListings";
import SEO from "@/components/SEO";
import { listingConfig } from "@/components/PluginAction";
import { getStartedCopy, starterQuestions } from "@/content/getStartedCopy";
import { pricingCopy } from "@/content/websiteCopy";
import stars from "@assets/stock_images/starry_night_sky_met_675ba820.webp";
import "@/styles/get-started.css";

type CopyState = {
  id: string | null;
  status: "idle" | "copying" | "copied" | "error";
};

export default function GetStarted() {
  const search = useSearch();
  const destinations: Record<AssistantId, string | null | undefined> = {
    chatgpt: listingConfig.published ? listingConfig.url : null,
    claude: import.meta.env.VITE_NIGHTSKY_CLAUDE_LISTING_URL,
    gemini: import.meta.env.VITE_NIGHTSKY_GEMINI_LISTING_URL,
    grok: import.meta.env.VITE_NIGHTSKY_GROK_LISTING_URL,
  };
  const [copyState, setCopyState] = useState<CopyState>({
    id: null,
    status: "idle",
  });
  const copyRequest = useRef(0);
  useEffect(
    () => () => {
      copyRequest.current++;
    },
    [],
  );
  const copyQuestion = async (id: string, question: string) => {
    const request = ++copyRequest.current;
    setCopyState({ id, status: "copying" });
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(question);
      if (request === copyRequest.current)
        setCopyState({ id, status: "copied" });
    } catch {
      if (request === copyRequest.current)
        setCopyState({ id, status: "error" });
    }
  };
  return (
    <div className="get-started-page">
      <SEO title={getStartedCopy.title} description={getStartedCopy.intro} />
      <div
        className="setup-atmosphere"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(180deg,#0c0c0e10,#0c0c0e),url(${stars})`,
        }}
      />
      <div className="setup-width">
        <header className="setup-intro">
          <p className="setup-free-badge">
            <Sparkles size={12} aria-hidden="true" />
            {pricingCopy.badge}
          </p>
          <h1>{getStartedCopy.title}</h1>
          <p>{getStartedCopy.intro}</p>
        </header>

        <section
          className="setup-assistants"
          aria-labelledby="setup-assistants-title"
        >
          <h2 id="setup-assistants-title">Choose your assistant.</h2>
          <ul className="setup-assistant-grid">
            {assistants.map((assistant) => {
              const href = resolveAssistantListingUrl(
                assistant.id,
                destinations[assistant.id],
              );
              const label = `Get NightSky Plugin for ${assistant.name}`;
              const reviewPending =
                !href &&
                (assistant.id === "chatgpt" || assistant.id === "claude");
              return (
                <li className="setup-assistant-card" key={assistant.id}>
                  <AssistantIcon
                    id={assistant.id}
                    className="setup-choice-icon"
                    size={31}
                  />
                  <h3>{assistant.name}</h3>
                  {href ? (
                    <a
                      className="action action-primary setup-choice-action"
                      data-testid={`${assistant.id}-listing-action`}
                      aria-label={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get NightSky Plugin
                      <Sparkles size={15} aria-hidden="true" />
                    </a>
                  ) : (
                    <button
                      className="action action-primary setup-choice-action"
                      data-testid={`${assistant.id}-listing-action`}
                      aria-label={
                        reviewPending
                          ? `${assistant.name} directory review pending`
                          : label
                      }
                      disabled
                    >
                      {reviewPending
                        ? "Directory review pending"
                        : "Get NightSky Plugin"}
                      {!reviewPending && <Sparkles size={15} aria-hidden="true" />}
                    </button>
                  )}
                  <a
                    className="setup-card-guide"
                    href={setupGuideHref(search, assistant.id)}
                    onClick={(event) => {
                      if (
                        event.ctrlKey ||
                        event.metaKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.button !== 0
                      )
                        return;
                      event.preventDefault();
                      window.history.pushState(
                        {},
                        "",
                        setupGuideHref(search, assistant.id),
                      );
                      document.getElementById("setup-heading")?.focus();
                      document
                        .getElementById("setup-heading")
                        ?.scrollIntoView({ block: "start" });
                    }}
                  >
                    Setup guide <ArrowRight size={14} aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="setup-account-note">
            No separate NightSky account required.
          </p>
          <p className="setup-plan-note">
            Your AI assistant’s own plans, access requirements and usage limits
            apply.
          </p>
        </section>

        <section
          className="setup-steps-section"
          aria-labelledby="setup-steps-title"
        >
          <div className="setup-section-heading">
            <h2 id="setup-steps-title">Your first steps.</h2>
          </div>
          <ol className="setup-steps">
            {getStartedCopy.steps.map((step, index) => (
              <li className="setup-step" key={step.title}>
                <span className="setup-step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="setup-questions-section"
          id="first-question"
          aria-labelledby="starter-questions-title"
        >
          <div className="setup-section-heading">
            <h2 id="starter-questions-title">Start with a question.</h2>
            <p>Take one of these into your next conversation.</p>
          </div>
          <ul className="question-list starter-question-grid">
            {starterQuestions.map((example) => {
              const selected = copyState.id === example.id;
              const copied = selected && copyState.status === "copied";
              return (
                <li className="starter-question" key={example.id}>
                  <span className="starter-question-kind">{example.label}</span>
                  <p className="starter-question-text">{example.question}</p>
                  <button
                    onClick={() =>
                      void copyQuestion(example.id, example.question)
                    }
                    aria-label={`Copy question: ${example.question}`}
                    aria-busy={selected && copyState.status === "copying"}
                  >
                    {copied ? (
                      <Check size={15} aria-hidden="true" />
                    ) : (
                      <Copy size={15} aria-hidden="true" />
                    )}
                    {copied
                      ? "Copied"
                      : selected && copyState.status === "copying"
                        ? "Copying…"
                        : "Copy question"}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="setup-copy-status" role="status">
            {copyState.status === "copied"
              ? "Question copied."
              : copyState.status === "error"
                ? "Select the question to copy it."
                : copyState.status === "copying"
                  ? "Copying question…"
                  : ""}
          </p>
          <p className="setup-question-hint">
            <span aria-hidden="true">✦</span>
            <span>
              Planning a night outside? Include your place, date and what you
              want to observe. For photography, mention your camera and lens.
            </span>
          </p>
        </section>

        <InstallationGuide />
        <SetupFaqs />

        <div className="setup-help-line">
          <p>Need help connecting?</p>
          <Link className="text-link" href="/contact?topic=setup">
            Contact NightSky <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link className="text-link" href="/sources">
            Sources &amp; coverage <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

