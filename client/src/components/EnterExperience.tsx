import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
export default function EnterExperience({
  onEnter,
}: {
  onEnter: (sound: boolean) => void;
}) {
  const enter = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    enter.current?.focus();
  }, []);
  return (
    <div
      className="experience-entrance"
      role="dialog"
      aria-modal="true"
      aria-label="Enter NightSky"
      onKeyDown={(event) => {
        if (event.key === "Escape") onEnter(false);
        if (event.key === "Tab") {
          event.preventDefault();
          const buttons = event.currentTarget.querySelectorAll("button");
          (document.activeElement === buttons[0]
            ? buttons[1]
            : buttons[0]
          )?.focus();
        }
      }}
    >
      <div className="entrance-stars" aria-hidden="true">
        {Array.from({ length: 60 }, (_, i) => (
          <i
            key={i}
            style={{
              left: ((i * 37.7) % 100) + "%",
              top: ((i * 23.9) % 100) + "%",
              animationDelay: (i % 7) + "s",
              animationDuration: 3 + (i % 5) + "s",
            }}
          />
        ))}
      </div>
      <div className="entrance-content">
        <p className="eyebrow">A moment away from the everyday</p>
        <h2>
          NightSky<span>.earth</span>
        </h2>
        <p className="entrance-tagline">Where Earth meets the stars.</p>
        <button
          ref={enter}
          className="entrance-button"
          data-testid="button-enter-night"
          onClick={() => onEnter(true)}
        >
          <Sparkles size={18} aria-hidden="true" />
          Enter the Night
          <Sparkles size={18} aria-hidden="true" />
        </button>
        <p className="entrance-hint">
          An immersive experience with ambient sound
        </p>
        <button className="entrance-quiet" onClick={() => onEnter(false)}>
          Enter without sound
        </button>
      </div>
    </div>
  );
}
