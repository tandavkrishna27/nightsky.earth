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
    <section className={`py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`mb-8 sm:mb-10 lg:mb-12 ${centered ? "text-center" : ""}`}
          >
            {title && (
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 leading-tight" data-testid="section-title">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0" data-testid="section-subtitle">
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
