import React from "react";
import { Link } from "wouter";
import { POLICY_DATE, POLICY_STATUS, POLICY_PAGES } from "@shared/nightsky/policies";

export function PolicyPage({ kind, children }: { kind: keyof typeof POLICY_PAGES; children?: React.ReactNode }) {
  const page = POLICY_PAGES[kind];
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border px-6 py-6"><Link href="/" className="font-serif text-2xl">NightSky.earth</Link></header>
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <h1 className="font-serif text-4xl">{page.title}</h1>
      <p className="text-sm text-muted-foreground">Draft updated {POLICY_DATE}. {POLICY_STATUS}</p>
      {page.sections.map(section => <section key={section.heading} className="space-y-3">
        <h2 className="text-xl font-semibold">{section.heading}</h2>
        {section.paragraphs.map(paragraph => <p key={paragraph} className="text-muted-foreground leading-relaxed">{paragraph}</p>)}
        {section.links?.map(link => <p key={link.url}><a href={link.url} className="text-primary underline">{link.label}</a></p>)}
      </section>)}
      {children}
    </main>
    <footer className="border-t border-border px-6 py-8"><nav aria-label="Policy and support" className="max-w-3xl mx-auto flex flex-wrap gap-6">
      <Link href="/privacy" className="text-primary underline">Privacy</Link><Link href="/terms" className="text-primary underline">Terms</Link><Link href="/support" className="text-primary underline">Support</Link>
    </nav></footer>
  </div>;
}
export default function Privacy() { return <PolicyPage kind="privacy" />; }
