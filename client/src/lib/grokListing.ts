import { resolveAssistantListingUrl } from "./assistantListings";
export function resolveGrokListingUrl(value: string | undefined): string | null {
  return resolveAssistantListingUrl("grok", value);
}
