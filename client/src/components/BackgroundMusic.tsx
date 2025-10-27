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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = false;
      
      // Function to start music from 5s
      const startMusicFrom5s = () => {
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.currentTime = 5;
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              console.log('🎵 Cosmic music playing from 5s...');
            })
            .catch(console.log);
        }
      };
      
      // Try multiple approaches to ensure music plays
      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = 5;
        }
      };
      
      const handleCanPlay = () => {
        // Try to play immediately
        startMusicFrom5s();
      };
      
      // Add listeners for multiple user interaction events
      const events = ['click', 'touchstart', 'keydown', 'scroll'];
      const handleUserInteraction = () => {
        startMusicFrom5s();
        // Remove all listeners after first interaction
        events.forEach(event => {
          document.removeEventListener(event, handleUserInteraction);
        });
      };
      
      // Set up audio event listeners
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      audioRef.current.addEventListener('canplay', handleCanPlay, { once: true });
      
      // Set up user interaction listeners (fallback if autoplay blocked)
      events.forEach(event => {
        document.addEventListener(event, handleUserInteraction, { once: true });
      });
      
      return () => {
        audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current?.removeEventListener('canplay', handleCanPlay);
        events.forEach(event => {
          document.removeEventListener(event, handleUserInteraction);
        });
      };
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
        autoPlay
        muted={isMuted}
        preload="auto"
      />
      {children}
    </BackgroundMusicContext.Provider>
  );
}
