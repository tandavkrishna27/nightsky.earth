import { SiOpenai, SiClaude, SiGooglegemini } from "react-icons/si";
import grokLogo from "@assets/grok-logomark-light.svg";
import "@/styles/assistants.css";

export const assistants = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
  { id: "gemini", name: "Gemini" },
  { id: "grok", name: "Grok" },
] as const;
export type AssistantId = (typeof assistants)[number]["id"];

export default function AssistantIcon({ id, className, size }: {
  id: AssistantId;
  className?: string;
  size?: number;
}) {
  if (id === "grok") return <img className={className} src={grokLogo} width={size ?? 19} height={size ?? 19} alt="" aria-hidden="true" />;
  const Icon = { chatgpt: SiOpenai, claude: SiClaude, gemini: SiGooglegemini }[id];
  return <Icon className={className} size={size} aria-hidden="true" />;
}
