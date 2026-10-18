import { pricingCopy } from "./websiteCopy";

export const journeyExamples = [
  {
    id: "plan",
    label: "Plan a night",
    title: "A night outside.",
    caption: "Begin with where you are. Find your next reason to look up.",
    question: "Help me plan my first evening under the stars.",
    clarification: "Where will you be, and when would you like to go?",
    reply: "Near Bengaluru this Saturday. It’s my first time.",
    paragraphs: [
      "For a first outing, keep the plan simple: a short session with an open view of the sky.",
      "Moonlight, darkness and weather will shape the choice. Bring a dim light and something comfortable to sit on.",
    ],
    followup: "Would you like to explore possible places?",
  },
  {
    id: "create",
    label: "Capture the sky",
    title: "An idea to create.",
    caption: "A photograph. A time-lapse. A story only the night can tell.",
    question: "I want to make my first night-sky time-lapse. Where do I begin?",
    clarification: "What camera and lens will you use?",
    reply: "A mirrorless camera and the kit lens.",
    paragraphs: [
      "With your camera and kit lens, begin with a sturdy tripod and a short test sequence.",
      "We can work through exposure and the interval between frames, then adjust after reviewing the result.",
    ],
    followup: "What scene would you like to capture?",
  },
  {
    id: "event",
    label: "Explore an event",
    title: "A moment to catch.",
    caption: "Explore the sky’s rhythms, and what they mean for your night.",
    question: "How do I plan an evening around a meteor shower?",
    clarification: "Which shower, and where will you be?",
    reply: "The Orionids, near Bengaluru.",
    paragraphs: [
      "The peak date is a starting point. Your location, the Moon, darkness and weather help put the observing window into context.",
      "We can explore the shower’s timing and the preparation that matters for your chosen night.",
    ],
    followup: "Which night are you considering?",
  },
  {
    id: "learn",
    label: "Ask a question",
    title: "A little wonder.",
    caption: "Follow a question. Let one discovery lead to another.",
    question: "Why does the Moon matter when watching meteors?",
    clarification: "Moonlight changes how much of the shower you can see.",
    reply: "Does the time the Moon sets make a difference?",
    paragraphs: [
      "A bright Moon washes out fainter meteors. The shower’s peak is only part of the picture.",
      "When the Moon rises or sets can help you find a darker observing window. Your location helps put those timings into context.",
    ],
    followup: "Would you like to explore moonlight for a particular night?",
  },
] as const;

export const collectiveValues = [
  ["Observe", "Spend time beneath the sky."],
  ["Create", "Express what it inspires."],
  ["Learn", "Deepen your understanding."],
  ["Conserve", "Care for dark skies."],
] as const;

export const homepageFaqs = [
  [
    "What is NightSky?",
    "NightSky is a plugin for your AI assistant that helps you explore and understand the night sky. Bring a question, plan an evening outside, or work through a creative idea in conversation.",
  ],
  ["Is NightSky free?", pricingCopy.answer],
  [
    "Where can I use NightSky?",
    "Choose your assistant on the Get Started page and follow its setup instructions. Start with ChatGPT, Claude, Gemini or Grok.",
  ],
  [
    "Do I need a telescope or any experience?",
    "No. Begin with your eyes, a question, or a place you’re curious about. NightSky can help you find a first step that fits your experience and the equipment you have.",
  ],
  [
    "What can I explore with NightSky?",
    "Ask about stargazing, the Moon, meteor showers and other sky events, or explore a place you have in mind. Share what you want to observe or understand, and build the conversation from there.",
  ],
  [
    "Can NightSky help with photography and creative ideas?",
    "Yes. Bring an idea for a photograph, time-lapse or video. Share your equipment and experience, and work through practical next steps in the conversation.",
  ],
  [
    "Why does NightSky ask for my place and date?",
    "Moonlight, darkness, timing and weather vary with where and when you plan to go. A place, date and observing goal help make the guidance relevant. Conditions can change, so check current information before heading out.",
  ],
  [
    "How do I get started?",
    "Choose your AI assistant, install or connect NightSky, then start talking. Try a question such as ‘Help me plan my first evening under the stars.’",
  ],
] as const;
