import { Helmet } from "react-helmet-async";
import { canonicalUrl, SITE_ORIGIN } from "@shared/website";
export default function SEO({
  title,
  description,
  noindex = false,
  schema,
}: {
  title: string;
  description: string;
  noindex?: boolean;
  schema?: object | object[];
  keywords?: string;
}) {
  const canonical = canonicalUrl(window.location.pathname);
  const preview = import.meta.env.VITE_WEBSITE_RELEASE !== "true";
  const image = `${SITE_ORIGIN}/splash-night-sky.jpg`;
  const pageSchema = schema ?? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonical,
  };
  return (
    <Helmet>
      <title>{title} | NightSky.earth</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta
        name="robots"
        content={preview || noindex ? "noindex, nofollow" : "index, follow"}
      />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="NightSky.earth" />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content="A night sky above Earth" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
    </Helmet>
  );
}
