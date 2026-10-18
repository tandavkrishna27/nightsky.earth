import type { AssistantId } from "@/components/AssistantIdentity";
export type SetupStep = readonly [string, string];
type Guide = {
  name: string;
  devices: string;
  requirements: string;
  directory?: readonly SetupStep[];
  manual: readonly SetupStep[];
  source: string;
  sourceName: string;
  packageHost?: "claude" | "codex";
  packageNote?: string;
};
export const setupGuides: Record<AssistantId, Guide> = {
  chatgpt: {
    name: "ChatGPT",
    devices:
      "Web & desktop · mobile use depends on the plugin’s supported surfaces.",
    requirements:
      "Sign in to your ChatGPT account. Account, workspace and plugin availability can affect the options shown. Desktop-only plugins require the desktop app.",
    directory: [
      [
        "Open the plugin directory.",
        "In ChatGPT, open Plugins and find NightSky.earth. Open its details and select the install control.",
      ],
      [
        "Finish setup.",
        "Follow the connection and permission prompts shown by ChatGPT. NightSky does not require a separate NightSky account.",
      ],
      [
        "Start a new conversation.",
        "Ask ChatGPT to use NightSky, or select it from the plugin picker where available.",
      ],
    ],
    manual: [
      [
        "Open custom connections.",
        "In ChatGPT Plugins, select the plus button, then Add custom MCP server. This is a connection to the hosted NightSky service.",
      ],
      [
        "Add the connection address.",
        "Paste NightSky’s official HTTPS connection address, name the connection NightSky, and follow the authentication options appropriate to the service. The current NightSky service has no separate account login.",
      ],
      [
        "Install and select NightSky.",
        "Review the permissions and finish creating the connection. Install the resulting plugin, start a new chat and select NightSky where available.",
      ],
    ],
    source: "https://developers.openai.com/plugins/build/app-quickstart",
    sourceName: "ChatGPT connection guide",
    packageHost: "codex",
    packageNote:
      "The Codex package is for Codex desktop or CLI local installation. It is not a ChatGPT browser upload. It connects to a separately running NightSky backend; downloading it does not start that backend.",
  },
  claude: {
    name: "Claude",
    devices:
      "Web & desktop for remote connections · local extensions require a compatible desktop host.",
    requirements:
      "Claude plugins currently require a paid Claude plan. Organization settings can restrict installation. A local MCP server runs in supported Cowork or Claude Code environments, rather than ordinary chat.",
    directory: [
      [
        "Find NightSky.",
        "Open Customize → Plugins → Discover. Select NightSky.earth and choose Add.",
      ],
      [
        "Finish the connection.",
        "Follow any connector and permission prompts. No separate NightSky account is required.",
      ],
      [
        "Start talking.",
        "Open a conversation and ask Claude to use NightSky. Available plugin skills can also appear in Claude’s skill picker.",
      ],
    ],
    manual: [
      [
        "Choose remote or local setup.",
        "For the hosted service, open Customize → Connectors and add a custom connector using NightSky’s official connection address. Follow Claude’s connection prompts.",
      ],
      [
        "For a downloaded plugin, use its matching host.",
        "Use Claude’s custom plugin upload option where available, or the package’s documented local installation route. A plugin ZIP and a desktop extension are different formats; use the instructions for the file you have.",
      ],
      [
        "Keep local services running.",
        "If the package points to a local NightSky backend, start that backend separately and keep it running. Installing the package alone does not provide the backend or establish web/mobile access.",
      ],
    ],
    source:
      "https://support.claude.com/en/articles/13837440-use-plugins-in-claude",
    sourceName: "Claude plugin guide",
    packageHost: "claude",
    packageNote:
      "This is a host-specific plugin ZIP, not a desktop extension installer. Its matching NightSky backend must be set up and started separately. Follow the package’s verified host instructions before importing it.",
  },
  gemini: {
    name: "Gemini",
    devices:
      "Add custom apps on the web · use them on eligible web and mobile accounts.",
    requirements:
      "Google currently requires a personal account, age 18+, US availability, English and Keep Activity enabled for custom apps. Work/school accounts are excluded from this consumer route. Check Google’s current requirements for your account.",
    manual: [
      [
        "Open Connected Apps on the web.",
        "On gemini.google.com, open Settings → Connected Apps. Depending on the interface, this may appear under Personal Intelligence or Customize → Connectors.",
      ],
      [
        "Add NightSky’s address.",
        "Under Custom apps, choose Add a custom app and enter the official NightSky connection address. Select Next and follow the connection instructions.",
      ],
      [
        "Select NightSky in your chat.",
        "Once connected, use the app picker or type @ and select NightSky. The connected app can then be used on eligible web and mobile accounts. Gemini CLI extensions use a separate installation system.",
      ],
    ],
    source: "https://support.google.com/gemini/answer/17209137",
    sourceName: "Gemini custom-app guide",
  },
  grok: {
    name: "Grok",
    devices:
      "Set up through Grok’s web Connectors screen · check availability in the app you use.",
    requirements:
      "Use your Grok account. Business and Enterprise users may need an administrator to provision the connector first. The connection address must be reachable by Grok over the public internet.",
    manual: [
      [
        "Open Connectors.",
        "On grok.com/connectors, choose New Connector, then Custom.",
      ],
      [
        "Connect NightSky.",
        "Enter the official NightSky connection address and complete the connection prompts. No separate NightSky account is required by the current service.",
      ],
      [
        "Ask Grok to use NightSky.",
        "Start a conversation and explicitly ask for NightSky. A server running only on your computer is not directly reachable by Grok; downloading a local package does not make it accessible.",
      ],
    ],
    source: "https://docs.x.ai/grok/connectors",
    sourceName: "Grok connector guide",
  },
};
export const setupCheckPrompt =
  "Use NightSky to plan stargazing from [town, country] on [date]. Show the sources and any missing information.";
export const setupFaqs = [
  [
    "Do I need a NightSky account?",
    "No separate NightSky account is required. Sign in to the AI assistant you use and follow its installation or connection steps. Its account, plan and workspace requirements still apply.",
  ],
  [
    "Do I need a paid AI subscription?",
    "NightSky is currently free to use. Your AI assistant’s plans and usage limits are separate. For example, Claude plugins currently require a paid Claude plan. Check the requirements in your selected setup guide.",
  ],
  [
    "Can I use NightSky on my phone?",
    "Mobile availability depends on the assistant and connection method. A remote connection may work across supported devices; a local backend or desktop-only plugin does not automatically become available on your phone. Gemini custom apps are added on the web before use on eligible mobile accounts.",
  ],
  [
    "Which installation method or download should I choose?",
    "Use the marketplace route where offered, or manually connect the hosted NightSky service using its official address. Downloaded packages are host-specific. Local packages need a separately running backend; they are not universal browser or phone installers.",
  ],
  [
    "Why isn’t NightSky appearing or responding?",
    "Check that NightSky is installed or connected, enabled for your conversation, and supported by your account and device. Try a new chat and explicitly ask the assistant to use NightSky. For local setup, confirm that the backend is running and reachable from the host. If it still fails, contact NightSky with the assistant name and error shown.",
  ],
  [
    "What information is shared when I use NightSky?",
    "NightSky processes the destination, date, observing goal and optional equipment details sent to its tools. The AI assistant processes your conversation under its own policies, and enabled data providers may receive details needed for their results. See Sources & Coverage and the privacy information for the relevant service. Having no NightSky account does not mean no data is processed.",
  ],
] as const;
