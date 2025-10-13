import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { meteorShowers2025 } from "@shared/meteorShowers";

import desertImage from "@assets/stock_images/desert_dunes_night_s_ee2f17ac.jpg";

export default function MeteorNights() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <HeroSection
        image={desertImage}
        headline="Meteor Nights 2025"
        subheadline="Experience all 12 meteor showers painting the night sky throughout the year."
        minHeight="min-h-[70vh]"
        primaryCTA="Book Your Night"
        onPrimaryCTAClick={() => setLocation("/contact")}
      />

      <ContentSection
        title="Your Year Under the Stars"
        subtitle="Join us for guided expeditions to witness nature's most spectacular light shows. Each meteor shower offers a unique celestial experience."
        centered
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {meteorShowers2025.map((shower, index) => (
            <motion.div
              key={shower.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card 
                className={`hover-elevate cursor-pointer ${shower.featured ? 'border-primary/50' : ''}`} 
                data-testid={`card-meteor-${shower.id}`}
                onClick={() => setLocation(`/meteor-shower/${shower.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-serif text-xl sm:text-2xl" data-testid={`text-meteor-name-${index}`}>
                      {shower.name}
                    </h3>
                    {shower.featured && (
                      <Badge variant="default" className="ml-2" data-testid="badge-featured">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span data-testid={`text-peak-date-${index}`}>{shower.peakDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span data-testid={`text-rate-${index}`}>{shower.ratePerHour} meteors/hour</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span data-testid={`text-location-${index}`}>{shower.bestLocation}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-description-${index}`}>
                    {shower.description}
                  </p>

                  <Button
                    variant="ghost"
                    className="w-full"
                    data-testid={`button-view-details-${shower.id}`}
                  >
                    View Full Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        title="What's Included"
        centered
        className="bg-card/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="hover-elevate">
            <CardContent className="p-6 text-center">
              <h3 className="font-serif text-lg sm:text-xl mb-3">Expert Astronomy Guides</h3>
              <p className="text-sm text-muted-foreground">
                Learn the science and stories behind each meteor shower from passionate astronomers.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-6 text-center">
              <h3 className="font-serif text-lg sm:text-xl mb-3">Prime Desert Locations</h3>
              <p className="text-sm text-muted-foreground">
                Carefully selected dark-sky sites with minimal light pollution for optimal viewing.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-6 text-center">
              <h3 className="font-serif text-lg sm:text-xl mb-3">Premium Comfort</h3>
              <p className="text-sm text-muted-foreground">
                Luxury camping setup with warm blankets, hot beverages, and gourmet meals.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-6 text-center">
              <h3 className="font-serif text-lg sm:text-xl mb-3">Photography Support</h3>
              <p className="text-sm text-muted-foreground">
                Capture the moment with professional photo guidance and equipment assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      <div className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${desertImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#0E1633]/80 to-black/70" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-6">
            Reserve Your Meteor Night
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-4">
            Limited spots available for each expedition. Book early to secure your place under the stars.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/contact")}
            data-testid="button-book-meteor-night"
            className="w-full sm:w-auto"
          >
            Book Now
          </Button>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
