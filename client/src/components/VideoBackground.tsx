import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface VideoBackgroundProps {
  videoUrl: string;
  fallbackImage?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}

export default function VideoBackground({ 
  videoUrl, 
  fallbackImage,
  overlay = true,
  overlayOpacity = 0.5,
  className = ""
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75; // Slow motion for more cinematic feel
    }
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster={fallbackImage}
      >
        <source src={videoUrl} type="video/mp4" />
        {fallbackImage && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${fallbackImage})` }}
          />
        )}
      </video>
      
      {overlay && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: overlayOpacity }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"
        />
      )}
    </div>
  );
}
