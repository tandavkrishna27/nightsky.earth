import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useBackgroundMusic } from "./BackgroundMusic";
import { Button } from "./ui/button";

export default function FloatingMuteButton() {
  const { isMuted, toggleMute } = useBackgroundMusic();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="fixed bottom-24 right-6 z-50 md:right-8 lg:bottom-8"
      data-testid="floating-mute-button"
    >
      <Button
        size="icon"
        variant="outline"
        onClick={toggleMute}
        className="h-12 w-12 rounded-full backdrop-blur-md bg-background/30 border-2 border-primary/30 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
        data-testid="button-mute-toggle"
        aria-label={isMuted ? "Unmute music" : "Mute music"}
      >
        <AnimatePresence mode="wait">
          {isMuted ? (
            <motion.div
              key="muted"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          ) : (
            <motion.div
              key="unmuted"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <Volume2 className="h-5 w-5 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulsing ring when unmuted */}
        {!isMuted && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </Button>
      
      {/* Tooltip on hover */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-md text-sm text-muted-foreground border border-border pointer-events-none hidden md:block"
      >
        {isMuted ? "Unmute cosmic sounds" : "Mute music"}
      </motion.div>
    </motion.div>
  );
}
