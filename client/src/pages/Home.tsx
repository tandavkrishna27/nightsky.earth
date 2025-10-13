import { useLocation } from "wouter";
import { useMemo, useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import ExperienceCard from "@/components/ExperienceCard";
import LoadingPage from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import { getUpcomingMeteorShowers } from "@shared/meteorShowers";

import heroImage from "@assets/stock_images/starry_night_sky_met_675ba820.jpg";
import milkyWayImage from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";
import desertImage from "@assets/stock_images/desert_dunes_night_s_ee2f17ac.jpg";
import auroraImage from "@assets/stock_images/aurora_borealis_nort_b91defe5.jpg";
import stargazingImage from "@assets/stock_images/person_silhouette_st_c7feb986.jpg";
import starTrailsImage from "@assets/stock_images/long_exposure_stars__411203e7.jpg";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  // Get next 3 upcoming meteor showers dynamically
  const upcomingMeteorShowers = useMemo(() => getUpcomingMeteorShowers(3), []);

  useEffect(() => {
    // Show loader for 1 second on page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage message="Where Earth meets the stars..." />;
  }

  const experiences = [
    {
      title: "Meteor Nights",
      description: "Watch celestial showers paint the desert skies.",
      image: desertImage,
      season: "August–December",
      duration: "3 nights",
      comingSoon: false
    },
    {
      title: "Cosmic Silence",
      description: "Find stillness under a billion stars.",
      image: milkyWayImage,
      duration: "2 nights",
      comingSoon: false
    },
    {
      title: "Dark Sky Treks",
      description: "Hike where the Milky Way becomes your map.",
      image: starTrailsImage,
      duration: "4 days",
      comingSoon: true
    },
    {
      title: "Eclipse Expeditions",
      description: "Witness the universe align in real time.",
      image: auroraImage,
      season: "Special Events",
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <HeroSection
        image={heroImage}
        headline="Where Earth meets the stars."
        subheadline="Journey to the darkest skies on Earth to witness the brightest moments of the universe."
        primaryCTA="Explore Experiences"
        secondaryCTA="Join the Waitlist"
        onPrimaryCTAClick={() => setLocation("/experiences")}
        onSecondaryCTAClick={() => setLocation("/contact")}
      />

      <ContentSection
        title="Born of Earth. Guided by Stars."
        centered
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-lg text-muted-foreground italic mb-8">
            NightSky.earth was created to reconnect people with the cosmos through immersive night-sky journeys.
            We travel beyond the glow of cities — to where silence hums and wonder feels close enough to touch.
          </p>
          <Button
            variant="outline"
            onClick={() => setLocation("/about")}
            data-testid="button-our-story"
          >
            Our Story
          </Button>
        </motion.div>
      </ContentSection>

      <ContentSection
        title="Journeys Under the Infinite."
        centered
        className="bg-card/30"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {experiences.map((exp, index) => (
            <ExperienceCard
              key={index}
              {...exp}
              onLearnMore={() => {
                if (exp.title === "Meteor Nights") {
                  setLocation("/meteor-nights");
                } else {
                  setLocation("/experiences");
                }
              }}
            />
          ))}
        </div>
        <div className="text-center mt-8 sm:mt-12">
          <Button
            size="lg"
            onClick={() => setLocation("/experiences")}
            data-testid="button-view-all-experiences"
            className="w-full sm:w-auto"
          >
            View All Experiences
          </Button>
        </div>
      </ContentSection>

      <ContentSection
        title="The Universe, Explained Beautifully."
        centered
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <p className="text-lg text-muted-foreground italic">
            Each journey is aligned with real celestial events — meteor showers, eclipses, and planetary alignments.
            Guided by passionate astronomers and storytellers, every experience blends exploration with understanding.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="hover-elevate">
            <CardContent className="p-4 sm:p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <div className="w-6 h-6 rounded-full bg-primary"></div>
              </div>
              <h3 className="font-serif text-lg sm:text-xl mb-2">Celestial Alignment</h3>
              <p className="text-sm text-muted-foreground">
                We plan each journey around authentic astronomical events for the most spectacular viewing.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-4 sm:p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <div className="w-6 h-6 rounded-full bg-primary"></div>
              </div>
              <h3 className="font-serif text-lg sm:text-xl mb-2">Expert Guides</h3>
              <p className="text-sm text-muted-foreground">
                Learn from astronomers and astrophotographers who bring the cosmos to life.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-4 sm:p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <div className="w-6 h-6 rounded-full bg-primary"></div>
              </div>
              <h3 className="font-serif text-lg sm:text-xl mb-2">Dark Sky Conservation</h3>
              <p className="text-sm text-muted-foreground">
                Every expedition supports the preservation of the world's remaining dark skies.
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      <ContentSection
        title="Moments Beneath the Infinite."
        centered
        className="bg-card/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="overflow-hidden hover-elevate group cursor-pointer">
            <div className="relative h-64 sm:h-80">
              <img src={stargazingImage} alt="Stargazing" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <p className="text-sm italic text-muted-foreground">
                  "Under these stars, we found ourselves again."
                </p>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden hover-elevate group cursor-pointer">
            <div className="relative h-64 sm:h-80">
              <img src={starTrailsImage} alt="Star Trails" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <p className="text-sm italic text-muted-foreground">
                  "Time stands still when the universe moves around you."
                </p>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden hover-elevate group cursor-pointer">
            <div className="relative h-64 sm:h-80">
              <img src={auroraImage} alt="Aurora" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <p className="text-sm italic text-muted-foreground">
                  "Nature's light show reminded us of our place in the cosmos."
                </p>
              </div>
            </div>
          </Card>
        </div>
        <div className="text-center mt-12">
          <Button
            variant="outline"
            onClick={() => setLocation("/journal")}
            data-testid="button-read-journal"
          >
            Read Our Journal
          </Button>
        </div>
      </ContentSection>

      {upcomingMeteorShowers.length > 0 && (
        <ContentSection
          title="Next Meteor Showers"
          subtitle="Witness the cosmos in motion. Here are the next celestial spectacles waiting for you."
          centered
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {upcomingMeteorShowers.map((shower, index) => (
              <motion.div
                key={shower.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className="hover-elevate cursor-pointer" 
                  data-testid={`card-upcoming-meteor-${shower.id}`}
                  onClick={() => setLocation(`/meteor-shower/${shower.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-serif text-xl sm:text-2xl" data-testid={`text-upcoming-name-${index}`}>
                        {shower.name}
                      </h3>
                      {shower.featured && (
                        <Badge variant="default" className="ml-2" data-testid="badge-featured-upcoming">
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span data-testid={`text-upcoming-date-${index}`}>{shower.peakDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span data-testid={`text-upcoming-rate-${index}`}>{shower.ratePerHour} meteors/hour</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span data-testid={`text-upcoming-location-${index}`}>{shower.bestLocation}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4" data-testid={`text-upcoming-description-${index}`}>
                      {shower.description}
                    </p>

                    <Button
                      variant="ghost"
                      className="w-full"
                      data-testid={`button-view-upcoming-${shower.id}`}
                    >
                      View Full Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-12">
            <Button
              size="lg"
              onClick={() => setLocation("/meteor-nights")}
              data-testid="button-view-all-meteor-showers"
              className="w-full sm:w-auto"
            >
              View All 2025 Meteor Showers
            </Button>
          </div>
        </ContentSection>
      )}

      <div className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${milkyWayImage})` }}
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
            Ready to look up?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-4">
            Join the next NightSky.earth experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              onClick={() => setLocation("/contact")}
              data-testid="button-book-now"
              className="w-full sm:w-auto"
            >
              Book Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/contact")}
              className="backdrop-blur-sm bg-background/20 w-full sm:w-auto"
              data-testid="button-join-waitlist"
            >
              Join the Waitlist
            </Button>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
