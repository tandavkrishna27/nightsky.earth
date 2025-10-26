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
      
      // Try to play unmuted on first load
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          console.log('🎵 Cosmic music playing...');
        })
        .catch((error) => {
          console.log('🔇 Browser blocked autoplay - click anywhere to start music:', error);
          // Add click listener to start music on first user interaction
          const startMusic = () => {
            if (audioRef.current && audioRef.current.paused) {
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  console.log('🎵 Music started after user interaction');
                })
                .catch(console.log);
              document.removeEventListener('click', startMusic);
            }
          };
          document.addEventListener('click', startMusic);
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
