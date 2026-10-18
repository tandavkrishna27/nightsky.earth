export const pricingCopy = {
  badge: "Free to use",
  closing: "Start exploring for free.",
  answer: "NightSky is currently free to use. Your AI assistant’s own plans, access requirements and usage limits still apply.",
};

export const homeCopy = {
  hero: {
    eyebrow: pricingCopy.badge,
    headline: "Where Earth meets the stars.",
    body: "NightSky is an astronomy plugin for your AI assistant. Plan a night under the stars, explore the universe, and follow your curiosity.",
  },
  journeys: {
    title: "Journeys Under the Infinite.",
    body: "A quiet evening, a creative idea, a moment you don’t want to miss. Start with what draws you outside.",
  },
  universe: {
    title: "The Universe, Explained Beautifully.",
    body: "A question about the Moon. An idea for a time-lapse. A night you want to understand. Let one discovery lead to another.",
  },
  moments: {
    title: "Moments Beneath the Infinite.",
    body: "A little understanding can change the way you spend a night outside.",
  },
  ready: {
    pricingNote: pricingCopy.closing,
    title: "Ready to look up?",
    body: "Bring a question, a place, or an idea. Explore your next step with NightSky in your AI assistant.",
  },
};
export const activities = [
  {
    title: "A night of stargazing",
    body: "Explore what may be visible from your chosen place and date, and understand the conditions that matter.",
    topic: "stargazing",
    label: "Observe",
  },
  {
    title: "Capture the night",
    body: "Photography, time-lapses, and video: start with what you want to make. Explore the night, the equipment you have, and the skills you want to develop.",
    topic: "photography",
    label: "Create",
  },
  {
    title: "A moment in the sky",
    body: "Learn about supported meteor showers and sky events, then explore their relevance to your location.",
    topic: "events",
    label: "Discover",
  },
  {
    title: "Somewhere to look up",
    body: "Explore candidate observing places where coverage is available, and identify the access details still worth checking.",
    topic: "places",
    label: "Explore",
  },
];
export const questionExamples = [
  {
    id: "understand",
    label: "Understand",
    question: "Why does the Moon matter when watching meteors?",
    response:
      "A bright Moon washes out fainter meteors. The shower’s peak is only part of the picture: when the Moon rises or sets can help you find a darker observing window. Your location helps put those timings into context.",
  },
  {
    id: "explore",
    label: "Explore",
    question: "Help me explore a night under the stars.",
    response:
      "Tell me where you’ll be, when you’d like to go, and what draws you outside. We can explore what the night might offer, from learning the constellations to watching a meteor shower, and look at the conditions that matter.",
  },
  {
    id: "create",
    label: "Create",
    question: "I want to make my first night-sky time-lapse. Where do I begin?",
    response:
      "Start with the scene you imagine and the camera you have. We can work through framing, exposure, and the interval between frames, then shape a short sequence to test. A steady setup and a little experimentation are a useful beginning.",
  },
  {
    id: "prepare",
    label: "Prepare",
    question: "What should I take for my first evening of stargazing?",
    response:
      "Begin with warm layers, water, a comfortable seat, and a light you can keep dim. Then consider where you’re going, how long you’ll stay, and your journey home. Share your plans, and we can work through the details together.",
  },
] as const;
type ConversationDemo = {
  id: (typeof questionExamples)[number]["id"];
  activityLabel: string;
  response?: string;
} & ({ clarification: string; reply: string } | { clarification?: never; reply?: never });

export const conversationDemos: readonly ConversationDemo[] = [
  { id: "understand", activityLabel: "Preparing an explanation" },
  {
    id: "explore",
    clarification: "Where will you be, and when would you like to go?",
    reply: "Near Bengaluru this Saturday. It’s my first time.",
    activityLabel: "Preparing your next steps",
    response: "For a first outing, keep the plan simple: a short session with an open view of the sky. Moonlight, darkness and weather will shape the choice. Bring a dim light and something comfortable to sit on. Would you like to explore possible places?",
  },
  {
    id: "create",
    clarification: "What camera and lens will you use?",
    reply: "A mirrorless camera and the kit lens.",
    activityLabel: "Shaping a first test",
    response: "With your camera and kit lens, begin with a sturdy tripod and a short test sequence. We can work through exposure and the interval between frames, then adjust after reviewing the result. What scene would you like to capture?",
  },
  {
    id: "prepare",
    clarification: "How long will you be out, and will you bring a telescope?",
    reply: "A short evening near home, with no telescope.",
    activityLabel: "Preparing an outing checklist",
    response: "For a short evening near home, bring warm layers, water, a comfortable seat and a dim light. You can begin with your eyes alone; a telescope is not essential. Check access and your route home before setting out.",
  },
];
export const aboutSections = [
  [
    "The wish to look up.",
    "A clear evening can begin with a small question. What is that bright point? Is this a good night for meteors? Could I photograph the sky with what I already have?",
  ],
  [
    "The questions before the night.",
    "An idea soon meets practical details: the Moon, darkness, weather, timing, equipment, and where to go. Understanding how those pieces fit can make the next step easier.",
  ],
  [
    "Why NightSky.",
    "We are building NightSky to bring that exploration into a conversation. Ask for an explanation, examine the evidence for a chosen night, compare alternatives, or work through how to prepare.",
  ],
  [
    "Wonder, with understanding.",
    "A useful answer should help you understand its basis. NightSky is designed to keep sources, timing, and missing information visible, so curiosity can lead to a more considered decision.",
  ],
  [
    "Room to grow.",
    "The wider ambition is to bring people closer to the sky and to one another. The Collective is where that part of the story will take shape.",
  ],
];
export const collectiveSections = [
  [
    "A shared curiosity.",
    "Some of us are learning the constellations. Some are working towards a photograph. Others simply want an evening away from the glow of the city. There is room for each of those beginnings.",
  ],
  [
    "Learning from one another.",
    "We want NightSky to grow through the questions people ask and the experience they bring: what helped, what was confusing, and what they would like to explore next.",
  ],
  [
    "What comes next.",
    "Shared learning, observing stories, and ways to connect are part of the direction we are exploring. This page will evolve as those opportunities take shape.",
  ],
];
