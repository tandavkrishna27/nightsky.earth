import { useRef, useEffect, useState, createContext, useContext } from "react";

interface BackgroundMusicContextType {
  isMuted: boolean;
  toggleMute: () => void;
  isPlaying: boolean;
  startMusic: () => void;
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType>({
  isMuted: false,
  toggleMute: () => {},
  isPlaying: false,
  startMusic: () => {},
});

export const useBackgroundMusic = () => useContext(BackgroundMusicContext);

interface BackgroundMusicProps {
  audioUrl: string;
  volume?: number;
  shouldStart?: boolean;
  children: React.ReactNode;
}

export default function BackgroundMusic({ 
  audioUrl, 
  volume = 0.3,
  shouldStart = false,
  children 
}: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasStartedRef = useRef(false);

  // Function to start music unmuted from 5 seconds
  const startMusic = () => {
    if (!audioRef.current || hasStartedRef.current) return;
    
    const audio = audioRef.current;
    hasStartedRef.current = true;
    
    // Set volume and position
    audio.volume = volume;
    audio.currentTime = 5;
    audio.muted = false;
    
    // Start playing
    audio.play()
      .then(() => {
        setIsPlaying(true);
        console.log('🎵 Cosmic music playing unmuted from 5s...');
      })
      .catch((error) => {
        console.log('Music playback failed:', error);
      });
  };

  // Start music when shouldStart becomes true
  useEffect(() => {
    if (shouldStart && !hasStartedRef.current) {
      startMusic();
    }
  }, [shouldStart]);

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
    <BackgroundMusicContext.Provider value={{ isMuted, toggleMute, isPlaying, startMusic }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        loop
        preload="auto"
      />
      {children}
    </BackgroundMusicContext.Provider>
  );
}
