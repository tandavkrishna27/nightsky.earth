import type { AssistantId } from "@/components/AssistantIdentity";

const listingHosts: Record<AssistantId, string> = {
  chatgpt: "chatgpt.com", claude: "claude.ai", gemini: "gemini.google.com", grok: "grok.com",
};
/** Public website destinations only; a general assistant homepage is not a NightSky listing. */
export function resolveAssistantListingUrl(id: AssistantId, value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (url.protocol !== "https:" || url.hostname !== listingHosts[id] || url.username || url.password || url.port || ["/", "/apps", "/plugins", "/gpts", "/connectors"].includes(path)) return null;
    return url.href;
  } catch { return null; }
}
