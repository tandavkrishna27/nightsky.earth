import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ExperienceCardProps {
  title: string;
  description: string;
  image: string;
  season?: string;
  duration?: string;
  onLearnMore?: () => void;
}

export default function ExperienceCard({
  title,
  description,
  image,
  season,
  duration,
  onLearnMore
}: ExperienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden hover-elevate group cursor-pointer" data-testid={`card-experience-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        <div className="relative h-64 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        <CardContent className="p-6">
          <h3 className="font-serif text-2xl mb-3" data-testid={`text-experience-title-${title.toLowerCase().replace(/\s+/g, "-")}`}>{title}</h3>
          <p className="text-muted-foreground mb-4" data-testid={`text-experience-description-${title.toLowerCase().replace(/\s+/g, "-")}`}>{description}</p>
          {(season || duration) && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              {season && <span data-testid="text-season">Season: {season}</span>}
              {duration && <span data-testid="text-duration">Duration: {duration}</span>}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={onLearnMore}
            className="w-full"
            data-testid="button-learn-more"
          >
            Discover More
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
