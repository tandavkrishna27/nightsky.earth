import EditorialPage from "@/components/EditorialPage";
import { SUPPORT_EMAIL } from "@shared/website";
const content = {
  sources: {
    eyebrow: "Sources & coverage",
    title: "Understand what your answer is based on.",
    intro:
      "Different questions need different evidence. This page explains how to read it and what still needs confirmation for the released service.",
    notice: "Release source inventory awaiting confirmation",
    sections: [
      [
        "Astronomy and weather answer different questions.",
        "A calculation can describe darkness or a target’s position. A forecast describes expected conditions. Neither guarantees what you will see.",
      ],
      [
        "Look for the source and the time.",
        "Forecast issue times, valid times, calculation context and coverage help you judge whether information fits your question. Historical seasonal patterns are context, not a forecast for a particular night.",
      ],
      [
        "A candidate is a starting point.",
        "A mapped observing place does not establish current night access, opening hours, parking, accessibility or safety. Check current official information before heading out.",
      ],
      [
        "The released source inventory.",
        "The service’s final provider list, supported targets and events, forecast horizons and geographic coverage will be added after release verification. This preview does not claim those integrations are live.",
      ],
    ],
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Your questions deserve clear answers.",
    intro: "Privacy information for NightSky’s website and connected service.",
    notice: "Draft — not a published policy",
    sections: [
      [
        "Website information",
        "This local preview has no signup, community submission form or added analytics. You can explore its editorial pages without submitting personal information.",
      ],
      [
        "Calendar preferences",
        "If you choose a calendar time zone or view, this website saves that preference in this browser’s local storage. Use browser time zone removes the saved zone override; clearing this site’s browser storage removes both preferences. These choices are not submitted to a NightSky account.",
      ],
      [
        "Plugin processing and external providers",
        "The released service’s inputs, hosting, external recipients and operational logging need factual confirmation before this policy is published. ChatGPT’s own processing is governed by its applicable policies separately.",
      ],
      [
        "Retention and requests",
        "Retention periods, deletion procedures and operator details have not yet been confirmed for publication. Contact NightSky with privacy questions using the address below.",
      ],
      [
        "Before publication",
        "A final policy will identify the operator, purposes, information processed, recipients, retention, any analytics or cookies, request process and effective date. No final security or compliance assurance is implied by this draft.",
      ],
    ],
  },
  terms: {
    eyebrow: "Terms",
    title: "A clear basis for exploring.",
    intro: "The scope and terms of the NightSky service.",
    notice: "Draft — not published terms",
    sections: [
      [
        "Service purpose",
        "NightSky is being developed to support exploring, understanding and preparing for the night sky. Information and calculated opportunities do not guarantee observing conditions, access or a particular result.",
      ],
      [
        "Third-party information",
        "External resources and reporting remain the responsibility of their original publishers. Their availability, terms and content can change.",
      ],
      [
        "Preparing for an outing",
        "Check current official information for your destination and use equipment appropriate to your activity. A suggested location is not an access or safety certification.",
      ],
      [
        "Before publication",
        "Operator identity, eligibility, permitted use, availability, liability and governing arrangements require owner review before final terms and an effective date are published. This local preview is not a final legal agreement.",
      ],
    ],
  },
};
export default function SupportingPage({
  kind,
}: {
  kind: keyof typeof content;
}) {
  const page = content[kind];
  return (
    <EditorialPage eyebrow={page.eyebrow} title={page.title} intro={page.intro}>
      <div className="reading-column">
        <div className="draft-notice">
          <p className="eyebrow">Preview information</p>
          <p>{page.notice}</p>
        </div>
        {page.sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
        <p>
          Questions or corrections:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </div>
    </EditorialPage>
  );
}
