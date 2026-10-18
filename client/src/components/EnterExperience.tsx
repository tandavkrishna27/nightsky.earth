import { useCallback, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import SplashBackground from "./SplashBackground";
import nightskyLogo from "@assets/nightsky-logo-dark.svg";
export default function EnterExperience({
  onEnter,
  exiting,
}: {
  onEnter: (sound: boolean) => void;
  exiting: boolean;
}) {
  const enter = useRef<HTMLButtonElement>(null);
  const restoreEntryFocus = useCallback(() => enter.current?.focus(), []);
  useEffect(() => {
    enter.current?.focus();
  }, []);
  return (
    <div
      className={`experience-entrance${exiting ? " is-exiting" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Enter NightSky"
      onKeyDown={(event) => {
        if (event.key === "Escape") onEnter(false);
        if (event.key === "Tab") {
          event.preventDefault();
          const buttons = event.currentTarget.querySelectorAll("button");
          const index = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
          const direction = event.shiftKey ? -1 : 1;
          const next = index < 0 ? (event.shiftKey ? buttons.length - 1 : 0) : (index + direction + buttons.length) % buttons.length;
          buttons[next]?.focus();
        }
      }}
    >
      <SplashBackground exiting={exiting} onControlRemoved={restoreEntryFocus} />
      <div className="entrance-content">
        <h2>
          <img className="entrance-logo" src={nightskyLogo} width={1397} height={205} alt="NightSky.earth" />
        </h2>
        <p className="entrance-tagline">Where Earth meets the stars.</p>
        <p className="entrance-description">A night-sky plugin for ChatGPT, Claude, Gemini &amp; Grok.</p>
        <button
          ref={enter}
          className="entrance-button"
          data-testid="button-enter-night"
          aria-describedby="entrance-sound-hint"
          onClick={() => onEnter(true)}
        >
          <Sparkles size={18} aria-hidden="true" />
          Enter the Night
          <Sparkles size={18} aria-hidden="true" />
        </button>
        <p className="entrance-hint" id="entrance-sound-hint">
          Enter with ambient sound
        </p>
        <button className="entrance-quiet" onClick={() => onEnter(false)}>
          Enter without sound
        </button>
      </div>
    </div>
  );
}
