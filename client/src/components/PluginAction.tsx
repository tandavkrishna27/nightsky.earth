import type { ListingConfig } from "@shared/website";
import { Sparkles } from "lucide-react";
import { Link } from "wouter";
export const listingConfig: ListingConfig = {
  published: import.meta.env.VITE_NIGHTSKY_LISTING_PUBLISHED === "true",
  url: import.meta.env.VITE_NIGHTSKY_LISTING_URL || null,
};
export default function PluginAction({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      className={`action action-primary${compact ? " action-compact" : ""} ${className}`}
      href="/get-started"
    >
      Get NightSky Plugin <Sparkles size={16} aria-hidden="true" />
    </Link>
  );
}
