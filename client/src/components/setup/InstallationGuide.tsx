import { useEffect, useRef, useState } from "react";
import { useSearch } from "wouter";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Link2,
} from "lucide-react";
import AssistantIcon, {
  assistants,
  type AssistantId,
} from "@/components/AssistantIdentity";
import { setupGuides, setupCheckPrompt } from "@/content/setupGuide";
import {
  readSetupState,
  setupGuideHref,
  type SetupMode,
} from "@/lib/setupGuideState";
import { resolveSetupResource } from "@/lib/setupResources";
import "@/styles/setup-guide.css";

export default function InstallationGuide() {
  const search = useSearch();
  const { assistant, mode } = readSetupState(search);
  const guide = setupGuides[assistant];
  const endpoint = resolveSetupResource(
    "endpoint",
    import.meta.env.VITE_NIGHTSKY_MCP_URL,
  );
  const packageUrl = resolveSetupResource(
    "package",
    guide.packageHost === "claude"
      ? import.meta.env.VITE_NIGHTSKY_CLAUDE_PACKAGE_URL
      : import.meta.env.VITE_NIGHTSKY_CODEX_PACKAGE_URL,
  );
  const [copyStatus, setCopyStatus] = useState("");
  const copyRequest = useRef(0);
  useEffect(() => {
    copyRequest.current++;
    setCopyStatus("");
    return () => {
      copyRequest.current++;
    };
  }, [assistant, mode]);
  useEffect(() => {
    if (window.location.hash !== "#setup-heading") return;
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById("setup-heading");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  function select(id: AssistantId, method?: SetupMode) {
    window.history.pushState({}, "", setupGuideHref(search, id, method));
  }
  async function copy(value: string, label: "question" | "address") {
    const request = ++copyRequest.current;
    setCopyStatus("");
    try {
      await navigator.clipboard.writeText(value);
      if (request === copyRequest.current)
        setCopyStatus(
          label === "question"
            ? "Question copied."
            : "Connection address copied.",
        );
    } catch {
      if (request === copyRequest.current)
        setCopyStatus(
          label === "question"
            ? "Select the question to copy it."
            : "Select the connection address to copy it.",
        );
    }
  }
  const steps =
    mode === "directory" && guide.directory ? guide.directory : guide.manual;
  return (
    <section className="installation-guide" aria-labelledby="setup-heading">
      <div className="setup-guide-heading">
        <h2 id="setup-heading" tabIndex={-1}>
          Set up NightSky.
        </h2>
        <p>Choose your assistant and follow the steps for your setup.</p>
      </div>
      <div className="setup-guide-shell">
        <div
          className="setup-guide-assistants"
          role="group"
          aria-label="Installation assistant"
        >
          {assistants.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={assistant === item.id}
              onClick={() => select(item.id)}
            >
              <AssistantIcon id={item.id} size={19} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        <div className="setup-guide-body">
          <div className="setup-guide-context">
            <h3>NightSky in {guide.name}</h3>
            <p>{guide.devices}</p>
          </div>
          <div
            className="setup-guide-methods"
            role="group"
            aria-label="Installation method"
          >
            {guide.directory && (
              <button
                type="button"
                aria-pressed={mode === "directory"}
                onClick={() => select(assistant, "directory")}
              >
                Marketplace
              </button>
            )}
            <button
              type="button"
              aria-pressed={mode === "manual"}
              onClick={() => select(assistant, "manual")}
            >
              Manual setup
            </button>
          </div>
          <p className="setup-guide-requirements">{guide.requirements}</p>
          <div className="setup-guide-columns">
            <div className="setup-instructions">
              <ol>
                {steps.map(([title, body], index) => (
                  <li key={title}>
                    <span
                      className="setup-instruction-number"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h4>{title}</h4>
                      <p>{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {mode === "manual" && (
                <div className="setup-connection-resource">
                  <h4>
                    <Link2 size={16} aria-hidden="true" />
                    NightSky connection address
                  </h4>
                  {endpoint ? (
                    <p className="setup-resource-address">{endpoint}</p>
                  ) : (
                    <p>
                      The public connection address has not been added to this
                      website. Contact NightSky for setup help.
                    </p>
                  )}
                  <button
                    type="button"
                    className="setup-small-action"
                    disabled={!endpoint}
                    onClick={() => endpoint && void copy(endpoint, "address")}
                    aria-label="Copy NightSky connection address"
                  >
                    <Copy size={15} aria-hidden="true" />
                    Copy address
                  </button>
                </div>
              )}
              {mode === "manual" && guide.packageHost && (
                <div className="setup-package-resource">
                  <h4>
                    <Download size={16} aria-hidden="true" />
                    Local {guide.packageHost === "codex"
                      ? "Codex"
                      : "Claude"}{" "}
                    package
                  </h4>
                  <p>{guide.packageNote}</p>
                  {packageUrl ? (
                    <a
                      className="setup-small-action"
                      href={packageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download{" "}
                      {guide.packageHost === "codex" ? "Codex" : "Claude"}{" "}
                      package <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="setup-small-action"
                        disabled
                      >
                        Download{" "}
                        {guide.packageHost === "codex" ? "Codex" : "Claude"}{" "}
                        package
                      </button>
                      <p className="setup-resource-note">
                        A verified package download and matching backend
                        instructions have not been added to this website.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
            <aside
              className="setup-connection-check"
              aria-labelledby="setup-check-heading"
            >
              <CheckCircle2 size={24} aria-hidden="true" />
              <h4 id="setup-check-heading">Check your connection.</h4>
              <p>Replace the place and date, then ask your assistant:</p>
              <p className="setup-check-prompt">{setupCheckPrompt}</p>
              <button
                type="button"
                className="setup-small-action"
                onClick={() => void copy(setupCheckPrompt, "question")}
                aria-label="Copy setup question"
              >
                {copyStatus === "Question copied." ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Copy size={15} aria-hidden="true" />
                )}
                Copy question
              </button>
              <ul>
                <li>
                  Confirm that the assistant calls a NightSky tool or shows a
                  NightSky tool result.
                </li>
                <li>
                  Check the place, date, source references and any data gaps in
                  its response.
                </li>
              </ul>
              <p className="setup-check-note">
                A general answer about the sky alone does not confirm that
                NightSky is connected.
              </p>
            </aside>
          </div>
          <p className="setup-guide-manage">
            To disconnect or remove NightSky, reopen its entry in your
            assistant’s Plugins or Connectors settings and follow the removal
            controls shown. A local backend is managed separately.
          </p>
          <p className="setup-guide-copy-status" role="status">
            {copyStatus}
          </p>
          <div className="setup-guide-bottom">
            <a href={guide.source} target="_blank" rel="noopener noreferrer">
              {guide.sourceName}
              <ArrowUpRight size={15} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <span>
              Instructions checked{" "}
              <time dateTime="2026-10-18">18 October 2026</time>. Menus and
              access can vary by account.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
