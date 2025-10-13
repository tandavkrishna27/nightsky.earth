import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface JournalCardProps {
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  onClick?: () => void;
}

export default function JournalCard({ title, excerpt, image, tag, onClick }: JournalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className="overflow-hidden hover-elevate cursor-pointer group"
        onClick={onClick}
        data-testid={`card-journal-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="relative h-72 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" data-testid="badge-tag">{tag}</Badge>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="font-serif text-xl mb-2" data-testid="text-journal-title">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-journal-excerpt">{excerpt}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
