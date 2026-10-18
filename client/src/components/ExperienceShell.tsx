import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import EnterExperience from "./EnterExperience";
import FloatingMuteButton from "./FloatingMuteButton";
import { useBackgroundMusic } from "./BackgroundMusic";
const ReplayWelcomeContext = createContext<(trigger: HTMLElement) => void>(() => {});
export const useReplayWelcome = () => useContext(ReplayWelcomeContext);

export default function ExperienceShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [entered, setEntered] = useState(() => {
    if (location !== "/") return true;
    try {
      return sessionStorage.getItem("nightsky-entered") === "true";
    } catch {
      return false;
    }
  });
  const [justEntered, setJustEntered] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [exiting, setExiting] = useState(false);
  const entering = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout>>();
  const returnFocus = useRef<HTMLElement | null>(null);
  const replayLocation = useRef<string | null>(null);
  const { startMusic, toggleMute, isMuted, isPending } = useBackgroundMusic();
  const showEntrance = replaying ? location === replayLocation.current : !entered && location === "/";
  useEffect(() => () => { clearTimeout(exitTimer.current); }, []);
  useEffect(() => {
    if (location !== "/" && !entered) {
      clearTimeout(exitTimer.current);
      setEntered(true);
    }
    if (replaying && location !== replayLocation.current) {
      clearTimeout(exitTimer.current);
      entering.current = false;
      returnFocus.current = null;
      setReplaying(false);
      setExiting(false);
      setJustEntered(true);
    }
  }, [location, entered, replaying]);
  useEffect(() => {
    if (entered) {
      try { sessionStorage.setItem("nightsky-entered", "true"); } catch { /* Optional storage. */ }
    }
  }, [entered]);
  useEffect(() => {
    if (entered && justEntered && !showEntrance) {
      const target = returnFocus.current;
      (target?.isConnected ? target : document.getElementById("main-content"))?.focus({ preventScroll: true });
      returnFocus.current = null;
      setJustEntered(false);
    }
    if (!showEntrance) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [entered, justEntered, showEntrance]);
  const replayWelcome = (trigger: HTMLElement) => {
    clearTimeout(exitTimer.current);
    if (!isMuted || isPending) toggleMute();
    returnFocus.current = trigger;
    replayLocation.current = location;
    entering.current = false;
    setJustEntered(false);
    setExiting(false);
    setReplaying(true);
  };
  const onEnter = (sound: boolean) => {
    if (entering.current) return;
    entering.current = true;
    if (sound) startMusic();
    const finish = () => {
      setJustEntered(true);
      setEntered(true);
      setReplaying(false);
      setExiting(false);
      entering.current = false;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
    else {
      setExiting(true);
      exitTimer.current = setTimeout(finish, 450);
    }
  };
  return (
    <ReplayWelcomeContext.Provider value={replayWelcome}>
      <div data-experience-content {...(showEntrance ? { inert: "" } : {})}>
        {children}
      </div>
      {showEntrance ? <EnterExperience onEnter={onEnter} exiting={exiting} /> : <FloatingMuteButton />}
    </ReplayWelcomeContext.Provider>
  );
}
