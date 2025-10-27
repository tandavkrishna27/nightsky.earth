import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface EnterExperienceProps {
  onEnter: () => void;
}

export default function EnterExperience({ onEnter }: EnterExperienceProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already entered this session
    const hasEntered = sessionStorage.getItem('nightsky-entered');
    if (!hasEntered) {
      setShow(true);
    } else {
      // Auto-enter if they've been here before this session
      onEnter();
    }
  }, [onEnter]);

  const handleEnter = () => {
    sessionStorage.setItem('nightsky-entered', 'true');
    setShow(false);
    setTimeout(() => {
      onEnter();
    }, 600); // Wait for fade animation
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(10, 10, 30, 0.8) 0%, rgba(0, 0, 0, 1) 100%)',
          }}
        >
          {/* Subtle stars */}
          <div className="absolute inset-0 overflow-hidden opacity-40">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {/* Logo/Title */}
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mb-8"
              >
                <h1 className="text-5xl md:text-7xl font-light text-white mb-3 tracking-wide">
                  NightSky<span className="text-blue-400">.earth</span>
                </h1>
                <p className="text-white/60 text-lg md:text-xl font-light tracking-widest">
                  WHERE EARTH MEETS THE STARS
                </p>
              </motion.div>

              {/* Enter Button */}
              <motion.button
                onClick={handleEnter}
                data-testid="button-enter-night"
                className="group relative mt-12 px-12 py-5 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full text-white text-lg md:text-xl font-light tracking-widest overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                
                <span className="relative flex items-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  Enter the Night
                  <Sparkles className="w-5 h-5" />
                </span>
              </motion.button>

              {/* Subtitle hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="mt-8 text-white/40 text-sm font-light tracking-wide"
              >
                Immersive experience with ambient sound
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
