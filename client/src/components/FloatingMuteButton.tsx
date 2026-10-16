import { Volume2, VolumeX } from "lucide-react";
import { useBackgroundMusic } from "./BackgroundMusic";
export default function FloatingMuteButton() {
  const { isMuted, isPending, toggleMute } = useBackgroundMusic();
  return (
    <button
      className="music-control"
      data-testid="button-mute-toggle"
      onClick={toggleMute}
      aria-label={
        isPending
          ? "Cancel music playback"
          : isMuted
            ? "Unmute music"
            : "Mute music"
      }
      aria-pressed={!isMuted}
      title={
        isPending
          ? "Cancel music playback"
          : isMuted
            ? "Play ambient music"
            : "Pause ambient music"
      }
    >
      {isMuted ? (
        <VolumeX size={19} aria-hidden="true" />
      ) : (
        <Volume2 size={19} aria-hidden="true" />
      )}
      <span>
        {isPending ? "Loading sound…" : `Sound ${isMuted ? "off" : "on"}`}
      </span>
    </button>
  );
}
