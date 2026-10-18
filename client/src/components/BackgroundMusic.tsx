import {
  useRef,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
const MusicContext = createContext({
  isMuted: true,
  isPlaying: false,
  isPending: false,
  startMusic: () => {},
  toggleMute: () => {},
});
export const useBackgroundMusic = () => useContext(MusicContext);
export default function BackgroundMusic({
  audioUrl,
  volume = 0.3,
  children,
}: {
  audioUrl: string;
  volume?: number;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const initialized = useRef(false);
  const requestId = useRef(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const startMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.hasAttribute("src")) audio.src = audioUrl;
    const request = ++requestId.current;
    setIsPending(true);
    audio.volume = volume;
    audio.muted = false;
    if (!initialized.current) {
      try {
        audio.currentTime = 5;
      } catch {
        /* Metadata may not be available yet. */
      }
    }
    void audio
      .play()
      .then(() => {
        if (request !== requestId.current) return;
        initialized.current = true;
        setIsPending(false);
        setIsMuted(false);
        setIsPlaying(true);
      })
      .catch(() => {
        if (request !== requestId.current) return;
        audio.muted = true;
        setIsPending(false);
        setIsMuted(true);
        setIsPlaying(false);
      });
  };
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted && !isPending) startMusic();
    else {
      requestId.current++;
      audio.muted = true;
      audio.pause();
      setIsPending(false);
      setIsMuted(true);
      setIsPlaying(false);
    }
  };
  return (
    <MusicContext.Provider
      value={{ isMuted, isPlaying, isPending, startMusic, toggleMute }}
    >
      <audio
        ref={audioRef}
        loop
        preload="none"
        onError={() => {
          requestId.current++;
          if (audioRef.current) audioRef.current.muted = true;
          setIsPending(false);
          setIsMuted(true);
          setIsPlaying(false);
        }}
      />
      {children}
    </MusicContext.Provider>
  );
}
