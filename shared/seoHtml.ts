import { canonicalUrl, SITE_ORIGIN } from "./website";

export type RouteSeo = {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
  summary?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

function jsonForHtml(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function jsonLd(route: RouteSeo, canonical: string) {
  const data = {
    "@context": "https://schema.org",
    "@type": route.path === "/" ? "WebSite" : "WebPage",
    name: route.path === "/" ? "NightSky.earth" : route.title,
    description: route.description,
    url: canonical,
    ...(route.path === "/" ? { alternateName: "NightSky" } : {}),
  };
  return `<script type="application/ld+json" data-nightsky-seo>${jsonForHtml(data)}</script>`;
}

export function renderRouteHtml(template: string, route: RouteSeo, release: boolean) {
  const title = `${route.title} | NightSky.earth`;
  const canonical = canonicalUrl(route.path);
  const robots = !release || route.noindex ? "noindex, nofollow" : "index, follow";
  const image = `${SITE_ORIGIN}/splash-night-sky.jpg`;
  const metadata = [
    `<title data-rh="true">${escapeHtml(title)}</title>`,
    `<meta data-rh="true" name="description" content="${escapeHtml(route.description)}">`,
    `<meta data-rh="true" name="robots" content="${robots}">`,
    `<link data-rh="true" rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta data-rh="true" property="og:site_name" content="NightSky.earth">`,
    `<meta data-rh="true" property="og:title" content="${escapeHtml(route.title)}">`,
    `<meta data-rh="true" property="og:description" content="${escapeHtml(route.description)}">`,
    `<meta data-rh="true" property="og:type" content="website">`,
    `<meta data-rh="true" property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta data-rh="true" property="og:image" content="${image}">`,
    `<meta data-rh="true" property="og:image:alt" content="A night sky above Earth">`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image">`,
    `<meta data-rh="true" name="twitter:title" content="${escapeHtml(route.title)}">`,
    `<meta data-rh="true" name="twitter:description" content="${escapeHtml(route.description)}">`,
    `<meta data-rh="true" name="twitter:image" content="${image}">`,
    jsonLd(route, canonical).replace("data-nightsky-seo", 'data-rh="true" data-nightsky-seo'),
  ].join("\n    ");

  const cleaned = template
    .replace(/\s*<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/\s*<meta\b(?=[^>]*(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi, "")
    .replace(/\s*<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi, "")
    .replace(/\s*<script\b(?=[^>]*data-nightsky-seo)[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\s*<meta\b[^>]*data-preview-robots[^>]*>/gi, "");
  const withHead = cleaned.replace("</head>", `    ${metadata}\n  </head>`);
  const fallback = `<noscript><main><h1>${escapeHtml(route.title)}</h1><p>${escapeHtml(route.summary || route.description)}</p></main></noscript>`;
  return withHead.replace("<body>", `<body>\n    ${fallback}`);
}
