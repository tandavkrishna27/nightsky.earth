import type { AssistantId } from "@/components/AssistantIdentity";
export type SetupMode = "directory" | "manual";
export function readSetupState(search: string): {
  assistant: AssistantId;
  mode: SetupMode;
} {
  const params = new URLSearchParams(search);
  const value = params.get("assistant");
  const assistant = (
    ["chatgpt", "claude", "gemini", "grok"].includes(value ?? "")
      ? value
      : "chatgpt"
  ) as AssistantId;
  const mode =
    assistant === "gemini" ||
    assistant === "grok" ||
    params.get("mode") === "manual"
      ? "manual"
      : "directory";
  return { assistant, mode };
}
export function setupGuideHref(
  search: string,
  assistant: AssistantId,
  mode?: SetupMode,
): string {
  const params = new URLSearchParams(search);
  params.set("assistant", assistant);
  params.set(
    "mode",
    mode ??
      (assistant === "gemini" || assistant === "grok" ? "manual" : "directory"),
  );
  return `/get-started?${params}#setup-heading`;
}
