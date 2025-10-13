import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HeroSectionProps {
  image: string;
  headline: string;
  subheadline: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  onPrimaryCTAClick?: () => void;
  onSecondaryCTAClick?: () => void;
  minHeight?: string;
}

export default function HeroSection({
  image,
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
  onPrimaryCTAClick,
  onSecondaryCTAClick,
  minHeight = "min-h-screen"
}: HeroSectionProps) {
  return (
    <div className={`relative ${minHeight} flex items-center justify-center overflow-hidden`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-foreground mb-4 sm:mb-6 leading-tight"
          data-testid="hero-headline"
        >
          {headline}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-4"
          data-testid="hero-subheadline"
        >
          {subheadline}
        </motion.p>
        
        {(primaryCTA || secondaryCTA) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            {primaryCTA && (
              <Button
                size="lg"
                variant="default"
                onClick={onPrimaryCTAClick}
                className="bg-primary text-primary-foreground border border-primary-border w-full sm:w-auto"
                data-testid="button-primary-cta"
              >
                {primaryCTA}
              </Button>
            )}
            {secondaryCTA && (
              <Button
                size="lg"
                variant="outline"
                onClick={onSecondaryCTAClick}
                className="backdrop-blur-sm bg-background/20 w-full sm:w-auto"
                data-testid="button-secondary-cta"
              >
                {secondaryCTA}
              </Button>
            )}
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
