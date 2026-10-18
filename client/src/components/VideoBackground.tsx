import { useEffect, useRef, useState } from "react";
export default function VideoBackground({
  videoUrl,
  fallbackImage,
  overlay = true,
}: {
  videoUrl: string;
  fallbackImage?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}) {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [inView, setInView] = useState(true);
  const [entered, setEntered] = useState(false);
  const connection = (
    navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }
  ).connection;
  const [saveData, setSaveData] = useState(connection?.saveData === true);
  const ref = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const eligible = !reduced && !failed && !saveData;
  const shouldPlay = eligible && visible && inView && entered;
  const fail = () => {
    setFailed(true);
  };
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(media.matches);
    };
    const data = () => {
      setSaveData(connection?.saveData === true);
    };
    const visibility = () => setVisible(!document.hidden);
    const element = mediaRef.current!;
    const shell = element.closest("[data-experience-content]");
    const entry = () => setEntered(!shell?.hasAttribute("inert"));
    entry();
    const entrance =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(entry)
        : null;
    if (shell)
      entrance?.observe(shell, {
        attributes: true,
        attributeFilter: ["inert"],
      });
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([item]) => setInView(item.isIntersecting))
        : null;
    observer?.observe(element);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    connection?.addEventListener?.("change", data);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
      connection?.removeEventListener?.("change", data);
      entrance?.disconnect();
      observer?.disconnect();
    };
  }, [connection]);
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      setReady(false);
      return;
    }
    let cancelled = false;
    element.muted = true;
    element.playbackRate = 0.7;
    if (shouldPlay)
      void element
        .play()
        .then(() => {
          if (!cancelled) setReady(true);
        })
        .catch(() => {
          if (!cancelled) fail();
        });
    else element.pause();
    return () => {
      cancelled = true;
      element.pause();
    };
  }, [shouldPlay, eligible]);
  return (
    <>
      <div ref={mediaRef} className="sky-media" aria-hidden="true">
        {fallbackImage && (
          <img src={fallbackImage} alt="" fetchPriority="high" />
        )}
        {eligible && (
          <video
            ref={ref}
            className={ready ? "is-ready" : ""}
            preload="metadata"
            loop
            muted
            playsInline
            poster={fallbackImage}
            onError={fail}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}
        {overlay && <div className="sky-shade" />}
      </div>
    </>
  );
}
