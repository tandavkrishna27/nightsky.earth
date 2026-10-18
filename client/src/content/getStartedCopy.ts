import { questionExamples } from "./websiteCopy";

export const getStartedCopy = {
  title: "Get NightSky.",
  intro: "Bring your curiosity to your AI assistant. Start with NightSky in ChatGPT, Claude, Gemini, or Grok.",
  description: "Learn about the sky, plan a night outside, and work through creative ideas in conversation.",
  steps: [
    { title: "Choose your assistant.", body: "Start with the assistant you already use." },
    { title: "Add NightSky.", body: "Follow its official instructions to install or connect the plugin." },
    { title: "Start talking.", body: "Ask a question, plan a night outside, or explore a creative idea." },
  ],
};

export const starterQuestions = questionExamples.filter(example =>
  ["understand", "explore", "create"].includes(example.id),
);
