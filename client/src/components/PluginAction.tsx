import { resolvePluginAction, type ListingConfig } from "@shared/website";
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
  heroChatGpt = false,
}: {
  className?: string;
  compact?: boolean;
  mobileFree?: boolean;
  heroChatGpt?: boolean;
}) {
  const action = heroChatGpt ? resolvePluginAction(listingConfig) : null;
  const label = heroChatGpt && action?.external
    ? "Install NightSky in ChatGPT"
    : "Get NightSky Plugin";
  const content = <>
    {label} <Sparkles size={16} aria-hidden="true" />
    {mobileFree && <span className="action-free-label" aria-hidden="true">Free</span>}
  </>;
  const classes = `action action-primary${compact ? " action-compact" : ""}${mobileFree ? " action-mobile-free" : ""} ${className}`;
  return action?.external ? (
    <a className={classes} href={action.href}>{content}</a>
  ) : (
    <Link className={classes} href="/get-started">{content}</Link>
  );
}
