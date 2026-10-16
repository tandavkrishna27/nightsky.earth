import { useEffect, useState, type ReactNode } from "react";
import EnterExperience from "./EnterExperience";
import FloatingMuteButton from "./FloatingMuteButton";
import { useBackgroundMusic } from "./BackgroundMusic";
export default function ExperienceShell({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(() => {
    try {
      return sessionStorage.getItem("nightsky-entered") === "true";
    } catch {
      return false;
    }
  });
  const [justEntered, setJustEntered] = useState(false);
  const { startMusic } = useBackgroundMusic();
  useEffect(() => {
    if (entered && justEntered)
      document.getElementById("main-content")?.focus({ preventScroll: true });
    if (entered) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [entered, justEntered]);
  const onEnter = (sound: boolean) => {
    if (sound) startMusic();
    try {
      sessionStorage.setItem("nightsky-entered", "true");
    } catch {
      /* Entry works without storage. */
    }
    setJustEntered(true);
    setEntered(true);
  };
  return (
    <>
      <div data-experience-content {...(!entered ? { inert: "" } : {})}>
        {children}
      </div>
      {entered ? <FloatingMuteButton /> : <EnterExperience onEnter={onEnter} />}
    </>
  );
}
