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
  mobileFree = false,
}: {
  className?: string;
  compact?: boolean;
  mobileFree?: boolean;
}) {
  return (
    <Link
      className={`action action-primary${compact ? " action-compact" : ""}${mobileFree ? " action-mobile-free" : ""} ${className}`}
      href="/get-started"
    >
      Get NightSky Plugin <Sparkles size={16} aria-hidden="true" />
      {mobileFree && <span className="action-free-label" aria-hidden="true">Free</span>}
    </Link>
  );
}
