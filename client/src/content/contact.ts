import { SUPPORT_EMAIL } from "@shared/website";

export const contactTopics = [
  { id: "setup", label: "Help & setup", title: "Let’s help you connect.", description: "Tell us which assistant you use and where you got stuck. Include any error message that helps explain the problem." },
  { id: "bugs", label: "Bugs & corrections", title: "Help us take a closer look.", description: "Share the assistant you used, your question, what you expected and what happened. Include the relevant place and date for an observing answer." },
  { id: "collective", label: "The Collective", title: "Bring your perspective.", description: "The Collective is coming soon. Tell us about your interests, experience or an idea you would like to contribute." },
  { id: "general", label: "Something else", title: "Start a conversation.", description: "Have an idea, a collaboration in mind, or a question that doesn’t fit the other topics? We’d like to hear from you." },
] as const;
export type ContactTopicId = (typeof contactTopics)[number]["id"];

export function parseContactTopic(search: string) {
  const id = new URLSearchParams(search).get("topic");
  return contactTopics.find(topic => topic.id === id) ?? contactTopics[3];
}
export function contactEmailHref(topic: (typeof contactTopics)[number]) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`NightSky — ${topic.label}`)}`;
}
