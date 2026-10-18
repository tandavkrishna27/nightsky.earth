import { homepageFaqs } from "@/content/homepage";
import StableFaqList from "@/components/StableFaqList";
export default function HomeFaqs() {
  return (
    <section
      id="faq"
      className="section page-width home-faq"
      aria-labelledby="faq-heading"
    >
      <div className="faq-intro">
        <h2 id="faq-heading">
          A few things,
          <br /> before you begin.
        </h2>
        <p>A little guidance for your first conversation with NightSky.</p>
      </div>
      <StableFaqList
        items={homepageFaqs}
        idPrefix="homepage"
        className="home-faq-list"
      />
    </section>
  );
}
