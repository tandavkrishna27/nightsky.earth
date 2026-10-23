import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Check, Copy } from "lucide-react";
import {
  NIGHTSKY_PUBLIC_MCP_URL,
  resolveSetupResource,
} from "@/lib/setupResources";
import "@/styles/mcp-address-card.css";

type McpAddressCardProps = {
  placement: "hero" | "get-started";
};

export default function McpAddressCard({ placement }: McpAddressCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );
  const address = resolveSetupResource("endpoint", NIGHTSKY_PUBLIC_MCP_URL);
  if (!address) return null;

  async function copyAddress() {
    if (!address) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(address);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    resetTimer.current = setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <section
      className={`mcp-address-card mcp-address-card--${placement}`}
      data-copy-state={copyState}
      aria-label="Manual NightSky connection"
    >
      {copyState === "copied" && (
        <span className="mcp-address-card__stars" aria-hidden="true">
          <span className="mcp-address-card__star mcp-address-card__star--one" />
          <span className="mcp-address-card__star mcp-address-card__star--two" />
          <span className="mcp-address-card__star mcp-address-card__star--three" />
          <span className="mcp-address-card__star mcp-address-card__star--four" />
          <span className="mcp-address-card__star mcp-address-card__star--five" />
        </span>
      )}
      <h2>
        {placement === "hero" ? "Connect manually" : "Or connect manually"}
      </h2>
      <div className="mcp-address-card__row">
        <code className="mcp-address-card__value">{address}</code>
        <button
          type="button"
          className="mcp-address-card__copy"
          data-copy-state={copyState}
          onClick={() => void copyAddress()}
        >
          {copyState === "copied" ? (
            <Check size={15} aria-hidden="true" />
          ) : (
            <Copy size={15} aria-hidden="true" />
          )}
          {copyState === "copied"
            ? "Copied"
            : copyState === "error"
              ? "Retry"
              : "Copy"}
        </button>
      </div>
      {placement === "hero" ? (
        <p>
          Need help connecting?{" "}
          <Link href="/get-started#setup-heading">See setup steps</Link>.
        </p>
      ) : (
        <p>
          Paste this address into your assistant’s custom MCP connection
          settings. Choose your assistant below for the exact steps.
        </p>
      )}
      <p className="mcp-address-card__status" role="status" aria-live="polite">
        {copyState === "copied"
          ? "Connection address copied."
          : copyState === "error"
            ? "Select and copy the connection address above."
            : ""}
      </p>
    </section>
  );
}
