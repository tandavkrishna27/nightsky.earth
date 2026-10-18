import type { ReactNode } from "react";
import SEO from "./SEO";
export default function EditorialPage({
  eyebrow,
  title,
  intro,
  children,
  image,
  noindex = false,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  image?: string;
  noindex?: boolean;
}) {
  return (
    <>
      <SEO title={title} description={intro} noindex={noindex} />
      <section
        className={`editorial-hero ${image ? "with-photo" : ""}`}
        style={
          image
            ? {
                backgroundImage: `linear-gradient(90deg,rgba(12,12,14,.92),rgba(12,12,14,.55)),url(${image})`,
              }
            : undefined
        }
      >
        <div className="page-width">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="intro">{intro}</p>
        </div>
      </section>
      <div className="editorial-body page-width">{children}</div>
    </>
  );
}
