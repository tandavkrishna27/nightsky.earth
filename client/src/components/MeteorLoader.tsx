import { motion } from "framer-motion";

interface MeteorLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function MeteorLoader({ size = "md", className = "" }: MeteorLoaderProps) {
  const sizeConfig = {
    sm: { scale: 0.7, meteorSize: 24 },
    md: { scale: 1, meteorSize: 32 },
    lg: { scale: 1.4, meteorSize: 44 }
  };

  const config = sizeConfig[size];

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Complete meteor with flame - moving as one unit */}
      <motion.div
        className="relative"
        style={{ scale: config.scale }}
        animate={{
          x: [-40, 40, -40],
          y: [-25, 25, -25],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Complete flame that wraps around meteor */}
        <div 
          className="absolute"
          style={{ 
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Main flame with donut shape to surround meteor */}
          <svg 
            width={config.meteorSize * 4} 
            height={config.meteorSize * 3} 
            viewBox={`0 0 ${config.meteorSize * 4} ${config.meteorSize * 3}`} 
            className="absolute z-0"
            style={{ transform: `translate(-${config.meteorSize * 3}px, -${config.meteorSize * 1.5}px) rotate(225deg)` }}
          >
            {/* Outer flame envelope - smaller proportions */}
            <path
              d={`M${config.meteorSize * 0.3},${config.meteorSize * 1.5} Q${config.meteorSize * 0.7},${config.meteorSize * 0.3} ${config.meteorSize * 1.5},${config.meteorSize * 0.4} Q${config.meteorSize * 2.3},${config.meteorSize * 0.2} ${config.meteorSize * 3.3},${config.meteorSize * 0.7} Q${config.meteorSize * 4},${config.meteorSize * 1.1} ${config.meteorSize * 4.1},${config.meteorSize * 1.5} Q${config.meteorSize * 4},${config.meteorSize * 1.9} ${config.meteorSize * 3.7},${config.meteorSize * 2.5} Q${config.meteorSize * 3.1},${config.meteorSize * 2.9} ${config.meteorSize * 2.1},${config.meteorSize * 3} Q${config.meteorSize * 1.2},${config.meteorSize * 3.1} ${config.meteorSize * 0.7},${config.meteorSize * 2.5} Q${config.meteorSize * 0.4},${config.meteorSize * 2} ${config.meteorSize * 0.3},${config.meteorSize * 1.5} Z`}
              fill="url(#flameGradient1)"
            />
            
            {/* Middle flame layer - smaller */}
            <path
              d={`M${config.meteorSize * 0.5},${config.meteorSize * 1.55} Q${config.meteorSize * 0.8},${config.meteorSize * 0.5} ${config.meteorSize * 1.6},${config.meteorSize * 0.6} Q${config.meteorSize * 2.3},${config.meteorSize * 0.4} ${config.meteorSize * 3.1},${config.meteorSize * 0.8} Q${config.meteorSize * 3.7},${config.meteorSize * 1.1} ${config.meteorSize * 3.7},${config.meteorSize * 1.55} Q${config.meteorSize * 3.7},${config.meteorSize * 1.9} ${config.meteorSize * 3.3},${config.meteorSize * 2.3} Q${config.meteorSize * 2.9},${config.meteorSize * 2.5} ${config.meteorSize * 2.1},${config.meteorSize * 2.5} Q${config.meteorSize * 1.4},${config.meteorSize * 2.5} ${config.meteorSize * 0.9},${config.meteorSize * 2.1} Q${config.meteorSize * 0.5},${config.meteorSize * 1.8} ${config.meteorSize * 0.5},${config.meteorSize * 1.55} Z`}
              fill="url(#flameGradient2)"
            />
            
            {/* Inner flame - bright center */}
            <path
              d={`M${config.meteorSize * 0.7},${config.meteorSize * 1.57} Q${config.meteorSize * 0.9},${config.meteorSize * 0.7} ${config.meteorSize * 1.7},${config.meteorSize * 0.8} Q${config.meteorSize * 2.3},${config.meteorSize * 0.6} ${config.meteorSize * 2.9},${config.meteorSize * 0.9} Q${config.meteorSize * 3.3},${config.meteorSize * 1.2} ${config.meteorSize * 3.5},${config.meteorSize * 1.57} Q${config.meteorSize * 3.3},${config.meteorSize * 1.9} ${config.meteorSize * 3.1},${config.meteorSize * 2} Q${config.meteorSize * 2.7},${config.meteorSize * 2.2} ${config.meteorSize * 2.1},${config.meteorSize * 2.1} Q${config.meteorSize * 1.6},${config.meteorSize * 2.2} ${config.meteorSize * 1.2},${config.meteorSize * 1.9} Q${config.meteorSize * 0.7},${config.meteorSize * 1.7} ${config.meteorSize * 0.7},${config.meteorSize * 1.57} Z`}
              fill="url(#flameGradient3)"
            />
            
            {/* Flame gradients */}
            <defs>
              <linearGradient id="flameGradient1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="50%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <linearGradient id="flameGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="rgba(251,191,36,0.6)" />
              </linearGradient>
              <linearGradient id="flameGradient3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#fef3c7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Simple flame particles - smaller */}
          <motion.div
            className="absolute rounded-full bg-yellow-300"
            style={{ 
              left: `${-config.meteorSize * 2}px`, 
              top: `${-config.meteorSize * 0.3}px`,
              width: `${config.meteorSize * 0.3}px`,
              height: `${config.meteorSize * 0.3}px`
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
              x: [0, -config.meteorSize * 0.4, -config.meteorSize * 0.7],
              y: [0, -config.meteorSize * 0.2, -config.meteorSize * 0.4]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3
            }}
          />
          <motion.div
            className="absolute rounded-full bg-orange-400"
            style={{ 
              left: `${-config.meteorSize * 1.8}px`, 
              top: `${config.meteorSize * 0.3}px`,
              width: `${config.meteorSize * 0.25}px`,
              height: `${config.meteorSize * 0.25}px`
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.7, 0],
              x: [0, -config.meteorSize * 0.3, -config.meteorSize * 0.5],
              y: [0, config.meteorSize * 0.2, config.meteorSize * 0.3]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.7
            }}
          />
        </div>

        {/* Additional flame details */}
        <div 
          className="absolute"
          style={{ 
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Front flame details */}
          <svg 
            width={config.meteorSize * 4} 
            height={config.meteorSize * 3} 
            viewBox={`0 0 ${config.meteorSize * 4} ${config.meteorSize * 3}`} 
            className="absolute z-10"
            style={{ transform: `translate(-${config.meteorSize * 3}px, -${config.meteorSize * 1.5}px) rotate(225deg)` }}
          >
            {/* Top flame detail */}
            <path
              d={`M${config.meteorSize * 3.1},${config.meteorSize * 1.1} Q${config.meteorSize * 3.5},${config.meteorSize * 0.9} ${config.meteorSize * 3.7},${config.meteorSize * 1.1} Q${config.meteorSize * 3.7},${config.meteorSize * 1.3} ${config.meteorSize * 3.7},${config.meteorSize * 1.5} Q${config.meteorSize * 3.5},${config.meteorSize * 1.6} ${config.meteorSize * 3.4},${config.meteorSize * 1.5} Q${config.meteorSize * 3.3},${config.meteorSize * 1.4} ${config.meteorSize * 3.2},${config.meteorSize * 1.3} Q${config.meteorSize * 3.1},${config.meteorSize * 1.2} ${config.meteorSize * 3.1},${config.meteorSize * 1.1} Z`}
              fill="url(#flameGradient3)"
              opacity="0.7"
            />
            
            {/* Bottom flame detail */}
            <path
              d={`M${config.meteorSize * 3.1},${config.meteorSize * 2} Q${config.meteorSize * 3.5},${config.meteorSize * 2.2} ${config.meteorSize * 3.7},${config.meteorSize * 2} Q${config.meteorSize * 3.7},${config.meteorSize * 1.8} ${config.meteorSize * 3.7},${config.meteorSize * 1.6} Q${config.meteorSize * 3.5},${config.meteorSize * 1.5} ${config.meteorSize * 3.4},${config.meteorSize * 1.6} Q${config.meteorSize * 3.3},${config.meteorSize * 1.7} ${config.meteorSize * 3.2},${config.meteorSize * 1.8} Q${config.meteorSize * 3.1},${config.meteorSize * 1.9} ${config.meteorSize * 3.1},${config.meteorSize * 2} Z`}
              fill="url(#flameGradient3)"
              opacity="0.7"
            />
            
            {/* Side flame details */}
            <path
              d={`M${config.meteorSize * 3.7},${config.meteorSize * 1.4} Q${config.meteorSize * 3.9},${config.meteorSize * 1.2} ${config.meteorSize * 4},${config.meteorSize * 1.4} Q${config.meteorSize * 4.1},${config.meteorSize * 1.6} ${config.meteorSize * 3.9},${config.meteorSize * 1.7} Q${config.meteorSize * 3.8},${config.meteorSize * 1.8} ${config.meteorSize * 3.7},${config.meteorSize * 1.7} Q${config.meteorSize * 3.7},${config.meteorSize * 1.6} ${config.meteorSize * 3.7},${config.meteorSize * 1.5} Q${config.meteorSize * 3.7},${config.meteorSize * 1.4} ${config.meteorSize * 3.7},${config.meteorSize * 1.4} Z`}
              fill="url(#flameGradient3)"
              opacity="0.6"
            />
            <path
              d={`M${config.meteorSize * 3.7},${config.meteorSize * 1.8} Q${config.meteorSize * 3.9},${config.meteorSize * 2} ${config.meteorSize * 4},${config.meteorSize * 1.8} Q${config.meteorSize * 4.1},${config.meteorSize * 1.5} ${config.meteorSize * 3.9},${config.meteorSize * 1.5} Q${config.meteorSize * 3.8},${config.meteorSize * 1.4} ${config.meteorSize * 3.7},${config.meteorSize * 1.5} Q${config.meteorSize * 3.7},${config.meteorSize * 1.5} ${config.meteorSize * 3.7},${config.meteorSize * 1.6} Q${config.meteorSize * 3.7},${config.meteorSize * 1.7} ${config.meteorSize * 3.7},${config.meteorSize * 1.8} Z`}
              fill="url(#flameGradient3)"
              opacity="0.6"
            />
            
            {/* Flame gradients */}
            <defs>
              <linearGradient id="flameGradient1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="50%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <linearGradient id="flameGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="rgba(251,191,36,0.6)" />
              </linearGradient>
              <linearGradient id="flameGradient3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#fef3c7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
