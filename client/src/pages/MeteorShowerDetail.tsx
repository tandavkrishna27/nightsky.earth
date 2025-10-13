import { useParams, useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Star, Clock, Eye, Rocket, Gauge, Target } from "lucide-react";
import { motion } from "framer-motion";
import { getMeteorShowerById } from "@shared/meteorShowers";

import desertImage from "@assets/stock_images/desert_dunes_night_s_ee2f17ac.jpg";

export default function MeteorShowerDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const showerId = params.id as string;
  
  const shower = getMeteorShowerById(showerId);

  if (!shower) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <ContentSection>
          <div className="text-center py-20">
            <h1 className="font-serif text-4xl mb-4">Meteor Shower Not Found</h1>
            <Button onClick={() => setLocation("/meteor-nights")} data-testid="button-back-to-meteor-nights">
              Back to Meteor Nights
            </Button>
          </div>
        </ContentSection>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <HeroSection
        image={desertImage}
        headline={shower.name}
        subheadline={shower.description}
        minHeight="min-h-[60vh]"
        primaryCTA="Reserve Your Spot"
        secondaryCTA="Back to All Showers"
        onPrimaryCTAClick={() => setLocation("/contact")}
        onSecondaryCTAClick={() => setLocation("/meteor-nights")}
      />

      <ContentSection>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            {shower.featured && (
              <Badge variant="default" className="text-base px-4 py-1" data-testid="badge-featured-shower">
                Featured Shower
              </Badge>
            )}
            <Badge variant="secondary" className="text-base px-4 py-1" data-testid="badge-difficulty">
              {shower.difficulty}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg mb-2">Peak Viewing Dates</h3>
                    <p className="text-muted-foreground" data-testid="text-peak-dates">{shower.peakDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg mb-2">Peak Rate</h3>
                    <p className="text-muted-foreground" data-testid="text-rate">{shower.ratePerHour} meteors per hour</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg mb-2">Best Viewing Location</h3>
                    <p className="text-muted-foreground" data-testid="text-location">{shower.bestLocation}</p>
                    <p className="text-sm text-muted-foreground/80 mt-1" data-testid="text-visibility">{shower.visibility}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg mb-2">Best Viewing Time</h3>
                    <p className="text-muted-foreground" data-testid="text-viewing-time">{shower.bestViewingTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg mb-2">Moon Conditions</h3>
                    <p className="text-muted-foreground" data-testid="text-moon-phase">{shower.moonPhase}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg mb-2">Radiant Point</h3>
                    <p className="text-muted-foreground" data-testid="text-radiant">{shower.radiant}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg mb-2">Parent Body</h3>
                    <p className="text-muted-foreground" data-testid="text-parent-body">{shower.parentBody}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Gauge className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg mb-2">Meteor Velocity</h3>
                    <p className="text-muted-foreground" data-testid="text-velocity">{shower.velocity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ContentSection>

      <ContentSection
        title="What's Included in Your Experience"
        centered
        className="bg-card/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="hover-elevate">
            <CardContent className="p-6 text-center">
              <h3 className="font-serif text-lg sm:text-xl mb-3">Expert Guides</h3>
              <p className="text-sm text-muted-foreground">
                Learn about this specific meteor shower from astronomers who know every detail.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-6 text-center">
              <h3 className="font-serif text-lg sm:text-xl mb-3">Prime Location</h3>
              <p className="text-sm text-muted-foreground">
                We position you at the darkest sites for optimal viewing of {shower.name}.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-6 text-center">
              <h3 className="font-serif text-lg sm:text-xl mb-3">Premium Comfort</h3>
              <p className="text-sm text-muted-foreground">
                Luxury camping with warm blankets, hot beverages, and gourmet meals.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-6 text-center">
              <h3 className="font-serif text-lg sm:text-xl mb-3">Photography Support</h3>
              <p className="text-sm text-muted-foreground">
                Capture stunning meteor streaks with professional guidance and equipment.
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
            Reserve Your {shower.name} Experience
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-4">
            Limited spots available for {shower.peakDate}. Don't miss this celestial spectacle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => setLocation("/contact")}
              data-testid="button-book-now"
            >
              Book This Experience
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/meteor-nights")}
              data-testid="button-view-all-showers"
              className="bg-background/20 backdrop-blur-sm"
            >
              View All Showers
            </Button>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
