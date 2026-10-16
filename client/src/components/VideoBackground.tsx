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
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!reduced && !failed) ref.current?.play().catch(() => setFailed(true));
  }, [reduced, failed]);
  return (
    <div className="sky-media" aria-hidden="true">
      {fallbackImage && <img src={fallbackImage} alt="" fetchPriority="high" />}
      {!reduced && !failed && (
        <video
          ref={ref}
          autoPlay
          loop
          muted
          playsInline
          poster={fallbackImage}
          onError={() => setFailed(true)}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}
      {overlay && <div className="sky-shade" />}
    </div>
  );
}
