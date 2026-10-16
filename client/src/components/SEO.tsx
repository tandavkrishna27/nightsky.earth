import { Helmet } from "react-helmet-async";
import { canonicalUrl } from "@shared/website";
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
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
}
