import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  centered?: boolean;
}

export default function ContentSection({
  title,
  subtitle,
  children,
  className = "",
  centered = false
}: ContentSectionProps) {
  return (
    <section className={`py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`mb-12 ${centered ? "text-center" : ""}`}
          >
            {title && (
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4" data-testid="section-title">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="section-subtitle">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
