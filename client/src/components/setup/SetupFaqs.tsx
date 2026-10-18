import StableFaqList from "@/components/StableFaqList";
import { setupFaqs } from "@/content/setupGuide";
export default function SetupFaqs() {
  return (
    <section className="setup-faq" aria-labelledby="setup-faq-heading">
      <div>
        <h2 id="setup-faq-heading">Questions about setup.</h2>
        <p>Accounts, devices and getting connected.</p>
      </div>
      <StableFaqList items={setupFaqs} idPrefix="setup" />
    </section>
  );
}
