/** Public NightSky resources only; optional configuration must never copy local/example addresses. */
export function resolveSetupResource(
  kind: "endpoint" | "package",
  value: string | undefined | null,
): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !(
        url.hostname === "nightsky.earth" ||
        url.hostname.endsWith(".nightsky.earth")
      ) ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash
    )
      return null;
    if (
      kind === "endpoint"
        ? url.pathname !== "/mcp"
        : !url.pathname.endsWith(".zip")
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}
