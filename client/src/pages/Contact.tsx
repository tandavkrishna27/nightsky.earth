import { useRef, useState } from "react";
import { useSearch } from "wouter";
import { Check, Copy, Mail, MessageCircle, Plug, Users, Wrench } from "lucide-react";
import SEO from "@/components/SEO";
import { SUPPORT_EMAIL } from "@shared/website";
import { contactTopics, parseContactTopic, contactEmailHref, type ContactTopicId } from "@/content/contact";
import "@/styles/support-pages.css";

const topicIcons = { setup: Plug, bugs: Wrench, collective: Users, general: MessageCircle };
export default function Contact() {
  const search = useSearch();
  const selected = parseContactTopic(search);
  const [copyStatus, setCopyStatus] = useState("");
  const copyRequest = useRef(0);
  function choose(id: ContactTopicId) {
    const params = new URLSearchParams(window.location.search);
    params.set("topic", id);
    window.history.pushState({}, "", `/contact?${params}`);
  }
  async function copyAddress() {
    const request = ++copyRequest.current;
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      if (request === copyRequest.current) setCopyStatus("Email address copied.");
    } catch {
      if (request === copyRequest.current) setCopyStatus("Select the email address to copy it.");
    }
  }
  return <div className="support-page contact-page">
    <SEO title="Contact NightSky." description="Get help with NightSky, report a bug or correction, or contribute to the Collective." />
    <div className="support-width">
      <header className="support-intro"><h1>Contact NightSky.</h1><p>Questions, ideas, or something that needs a closer look? We’d like to hear from you.</p></header>
      <div className="contact-layout">
        <fieldset className="contact-reasons"><legend>What’s it about?</legend>
          <div className="contact-choices">{contactTopics.map(topic => {
            const Icon = topicIcons[topic.id];
            return <label className="contact-choice" data-selected={selected.id === topic.id} key={topic.id}>
              <input type="radio" name="contact-topic" value={topic.id} checked={selected.id === topic.id} onChange={() => choose(topic.id)} />
              <Icon size={19} aria-hidden="true" /><span>{topic.label}</span>
            </label>;
          })}</div>
        </fieldset>
        <section className="contact-panel" aria-labelledby="contact-context-title">
          <div className="contact-context" aria-live="polite" aria-atomic="true"><h2 id="contact-context-title">{selected.title}</h2><p>{selected.description}</p></div>
          <p className="contact-privacy-note">Please leave out passwords, access keys and personal details you don’t want to share.</p>
          <a className="action action-primary contact-email-action" href={contactEmailHref(selected)}>Email NightSky <Mail size={17} aria-hidden="true" /></a>
          <p className="contact-action-note">Opens your email app with the topic included.</p>
          <div className="contact-address"><span>{SUPPORT_EMAIL}</span><button type="button" onClick={() => void copyAddress()} aria-label="Copy email address">{copyStatus === "Email address copied." ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}Copy address</button></div>
          <p className="contact-copy-status" role="status">{copyStatus}</p>
        </section>
      </div>
    </div>
  </div>;
}
