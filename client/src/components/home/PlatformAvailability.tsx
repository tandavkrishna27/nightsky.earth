import AssistantIcon, { assistants } from "@/components/AssistantIdentity";
export default function PlatformAvailability() {
  return (
    <div
      className="platform-availability hero-platforms"
      aria-label="AI platform availability"
    >
      {assistants.map(assistant => <div className="hero-platform" key={assistant.id}>
        <AssistantIcon id={assistant.id} />
        <span>{assistant.name}</span>
      </div>)}
    </div>
  );
}
