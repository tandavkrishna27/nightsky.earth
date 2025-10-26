import { useRef, useEffect, useState, createContext, useContext } from "react";

interface BackgroundMusicContextType {
  isMuted: boolean;
  toggleMute: () => void;
  isPlaying: boolean;
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType>({
  isMuted: true,
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
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      // Try to play on mount (will be muted initially due to browser policies)
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log('Audio autoplay prevented, waiting for user interaction:', error);
        });
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newMutedState = !prev;
      
      // If unmuting for the first time, ensure audio plays
      if (!newMutedState && audioRef.current && audioRef.current.paused) {
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
        muted={isMuted}
        preload="auto"
      />
      {children}
    </BackgroundMusicContext.Provider>
  );
}
