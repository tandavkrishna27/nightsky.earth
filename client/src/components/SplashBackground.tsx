import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type DataConnection = EventTarget & { saveData?: boolean };

export default function SplashBackground({ exiting, onControlRemoved }: { exiting: boolean; onControlRemoved: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const motionControl = useRef<HTMLButtonElement>(null);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const connection = (navigator as Navigator & { connection?: DataConnection }).connection;
  const [saveData, setSaveData] = useState(() => connection?.saveData === true);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const eligible = !reduced && !saveData && !failed;
  const shouldPlay = eligible && visible && !paused && !exiting;
  const restoreEntryFocus = useCallback(() => {
    if (motionControl.current && document.activeElement === motionControl.current) onControlRemoved();
  }, [onControlRemoved]);
  const failVideo = useCallback(() => {
    restoreEntryFocus();
    setFailed(true);
  }, [restoreEntryFocus]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      if (motion.matches) restoreEntryFocus();
      setReduced(motion.matches);
    };
    const updateVisibility = () => setVisible(!document.hidden);
    const updateData = () => {
      if (connection?.saveData) restoreEntryFocus();
      setSaveData(connection?.saveData === true);
    };
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    connection?.addEventListener?.("change", updateData);
    return () => {
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      connection?.removeEventListener?.("change", updateData);
    };
  }, [connection, restoreEntryFocus]);

  useEffect(() => {
    const element = video.current;
    if (!element) {
      setReady(false);
      return;
    }
    let cancelled = false;
    element.muted = true;
    element.defaultPlaybackRate = 0.7;
    element.playbackRate = 0.7;
    if (!shouldPlay) {
      element.pause();
    } else {
      void element.play().then(() => {
        if (cancelled) return;
        setReady(true);
      }).catch(() => {
        if (cancelled) return;
        failVideo();
      });
    }
    return () => {
      cancelled = true;
      element.pause();
    };
  }, [eligible, shouldPlay, failVideo]);

  return <>
    <div className="splash-background" aria-hidden="true">
      <img className="splash-poster" src="/splash-night-sky.jpg" alt="" fetchPriority="high" />
      {eligible && <video
        ref={video}
        className={`splash-video${ready ? " is-ready" : ""}`}
        src="/splash-night-sky.mp4"
        poster="/splash-night-sky.jpg"
        preload="metadata"
        loop muted playsInline tabIndex={-1}
        onError={failVideo}
      />}
      <div className="splash-shade" />
    </div>
    {eligible && <button
      ref={motionControl}
      className="splash-motion-control"
      type="button"
      aria-label={shouldPlay ? "Pause background video" : "Play background video"}
      aria-pressed={paused}
      onClick={() => setPaused(value => !value)}
    >{shouldPlay ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}</button>}
  </>;
}
