import { useRef, useEffect, useState, createContext, useContext } from "react";

interface BackgroundMusicContextType {
  isMuted: boolean;
  toggleMute: () => void;
  isPlaying: boolean;
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType>({
  isMuted: false,
  toggleMute: () => {},
  isPlaying: false,
});

export const useBackgroundMusic = () => useContext(BackgroundMusicContext);

interface BackgroundMusicProps {
  audioUrl: string;
  volume?: number;
  children: React.ReactNode;
}

export default function BackgroundMusic({ 
  audioUrl, 
  volume = 0.3,
  children 
}: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current || hasStartedRef.current) return;

    const audio = audioRef.current;
    audio.volume = volume;
    
    // Function to unmute and ensure playback
    const unmuteAndPlay = () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;
      
      // Set start position
      if (audio.currentTime < 5) {
        audio.currentTime = 5;
      }
      
      // Unmute the audio
      audio.muted = false;
      setIsPlaying(true);
      
      // Ensure it's playing
      if (audio.paused) {
        audio.play()
          .then(() => {
            console.log('🎵 Cosmic music playing unmuted from 5s...');
          })
          .catch(console.log);
      } else {
        console.log('🎵 Cosmic music playing unmuted from 5s...');
      }
    };

    // Listen for when audio starts playing (from autoplay with muted attribute)
    const handlePlay = () => {
      // Small delay to ensure playback is stable, then unmute
      setTimeout(unmuteAndPlay, 150);
    };

    audio.addEventListener('play', handlePlay, { once: true });

    // Fallback: unmute on first user interaction
    const handleFirstInteraction = () => {
      unmuteAndPlay();
    };

    // Multiple interaction triggers
    const events = ['click', 'touchstart', 'keydown', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true, passive: true });
    });

    return () => {
      audio.removeEventListener('play', handlePlay);
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && hasStartedRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newMutedState = !prev;
      
      // If unmuting and audio hasn't started, try to start it
      if (!newMutedState && audioRef.current && audioRef.current.paused) {
        audioRef.current.currentTime = 5;
        audioRef.current.play().catch(console.log);
      }
      
      return newMutedState;
    });
  };

  return (
    <BackgroundMusicContext.Provider value={{ isMuted, toggleMute, isPlaying }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        loop
        autoPlay
        muted
        playsInline
        preload="auto"
      />
      {children}
    </BackgroundMusicContext.Provider>
  );
}
