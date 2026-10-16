import { resolvePluginAction, type ListingConfig } from "@shared/website";
export const listingConfig: ListingConfig = {
  published: import.meta.env.VITE_NIGHTSKY_LISTING_PUBLISHED === "true",
  url: import.meta.env.VITE_NIGHTSKY_LISTING_URL || null,
};
export default function PluginAction({
  className = "",
  config = listingConfig,
}: {
  className?: string;
  config?: ListingConfig;
}) {
  const action = resolvePluginAction(config);
  return (
    <a
      className={`action action-primary ${className}`}
      href={action.href}
      {...(action.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {action.label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
