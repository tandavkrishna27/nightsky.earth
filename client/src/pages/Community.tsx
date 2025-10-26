import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import LoadingPage from "@/components/LoadingPage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Radio, 
  Globe, 
  Moon, 
  Camera, 
  Telescope,
  Tent,
  GraduationCap,
  Rocket,
  Palette,
  DollarSign,
  Handshake,
  Video,
  Calendar,
  Users,
  Leaf,
  MessageCircle
} from "lucide-react";

import communityImage from "@assets/stock_images/person_silhouette_st_c7feb986.jpg";

export default function Community() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/YOUR_PHONE_NUMBER?text=Hey%2C%20I'm%20interested%20in%20hosting%20an%20event%20with%20NightSky.Earth!", "_blank");
  };

  const handleWhatsAppCommunity = () => {
    window.open("https://wa.me/YOUR_PHONE_NUMBER?text=I'd%20like%20to%20join%20the%20NightSky.Earth%20community!", "_blank");
  };

  if (isLoading) {
    return <LoadingPage message="Opening the cosmic gateway..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <HeroSection
        image={communityImage}
        headline="The Collective"
        subheadline="For the dreamers, the teachers, the ones who never stopped looking up. We built NightSky.Earth for you."
        minHeight="min-h-[70vh]"
        primaryCTA="Join the Collective"
        onPrimaryCTAClick={() => setLocation("/contact")}
        secondaryCTA="Message on WhatsApp"
        onSecondaryCTAClick={handleWhatsAppClick}
      />

      <ContentSection
        title="Why Join the Collective"
        subtitle="A collaboration network where science meets story, and wonder meets purpose."
        centered
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="hover-elevate h-full">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl mb-4" data-testid="text-support-title">
                  Support that goes beyond logistics
                </h3>
                <p className="text-muted-foreground">
                  We take care of operations, funding, and storytelling — so you can focus on creating magic.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="hover-elevate h-full">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Radio className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl mb-4" data-testid="text-visibility-title">
                  Visibility that matters
                </h3>
                <p className="text-muted-foreground">
                  Be featured across our website, films, and campaigns.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="hover-elevate h-full">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl mb-4" data-testid="text-network-title">
                  A network that believes in wonder
                </h3>
                <p className="text-muted-foreground">
                  Collaborate with people who see the night sky not just as science — but as poetry, philosophy, and home.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ContentSection>

      <ContentSection
        title="Under the Infinite"
        subtitle="Each journey is a chapter in our collective story — of Earth meeting sky, and people meeting wonder."
        centered
        className="bg-card/30"
      >
        <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
          We design and support events led by our Collective:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {[
            { icon: Moon, label: "Meteor Shower Camps" },
            { icon: Camera, label: "Astrophotography Retreats" },
            { icon: Telescope, label: "Dark Sky Expeditions" },
            { icon: GraduationCap, label: "Educational Stargazing Nights" },
            { icon: Tent, label: "Full Moon Gatherings" },
          ].map((event, index) => (
            <motion.div
              key={event.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <event.icon className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm sm:text-base font-medium" data-testid={`text-event-${index}`}>
                      {event.label}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => setLocation("/experiences")}
            data-testid="button-explore-events"
          >
            Explore Events
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={handleWhatsAppClick}
            data-testid="button-whatsapp-plan"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Us on WhatsApp to Plan Yours
          </Button>
        </div>
      </ContentSection>

      <ContentSection
        title="Bring Your Vision to the Horizon"
        subtitle="Have an idea that could make people look up again? We'll help you turn it into an experience that moves them."
        centered
      >
        <div className="max-w-4xl mx-auto mb-12">
          <h3 className="font-serif text-2xl sm:text-3xl mb-8 text-center">What We Offer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Rocket, text: "End-to-end operations & logistics" },
              { icon: Palette, text: "Visual design, branding & marketing" },
              { icon: DollarSign, text: "Funding & sponsorship opportunities" },
              { icon: Handshake, text: "Partnerships with eco-lodges, gear brands, and observatories" },
              { icon: Video, text: "Storytelling, documentation & PR exposure" },
            ].map((offer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex items-start gap-4"
              >
                <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                  <offer.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-muted-foreground pt-1" data-testid={`text-offer-${index}`}>
                  {offer.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <h3 className="font-serif text-2xl sm:text-3xl mb-8 text-center">Who It's For</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Independent astronomers",
              "Astrophotographers",
              "Science communicators",
              "Outdoor educators",
              "Travel and nature creators",
            ].map((role, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover-elevate">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm font-medium" data-testid={`text-role-${index}`}>{role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg"
            onClick={() => setLocation("/contact")}
            data-testid="button-collaborate"
          >
            Let's Collaborate
          </Button>
        </div>
      </ContentSection>

      <ContentSection
        title="Under One Sky"
        subtitle="Every event begins with one spark — but together, we light up the whole sky."
        centered
        className="bg-card/30"
      >
        <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
          We're building a global network of creators, explorers, and organizations who believe in the power of wonder.
        </p>

        <div className="max-w-3xl mx-auto mb-12">
          <h3 className="font-serif text-2xl sm:text-3xl mb-8 text-center">What's Coming</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Calendar, text: "A shared celestial calendar" },
              { icon: Users, text: "Opportunities for co-hosted events" },
              { icon: Leaf, text: "Dark-sky conservation initiatives" },
              { icon: GraduationCap, text: "Educational partnerships" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover-elevate">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm sm:text-base font-medium" data-testid={`text-coming-${index}`}>
                        {item.text}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg"
            onClick={() => setLocation("/contact")}
            data-testid="button-signup-updates"
          >
            Sign Up for Updates
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={handleWhatsAppCommunity}
            data-testid="button-whatsapp-community"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Join the WhatsApp Community
          </Button>
        </div>
      </ContentSection>

      <ContentSection
        title="Talk to Us Directly"
        subtitle="The easiest way to reach the stars is to start the conversation."
        centered
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
          <Button 
            size="lg"
            onClick={() => setLocation("/contact")}
            data-testid="button-contact-form"
          >
            Contact Us
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={handleWhatsAppClick}
            data-testid="button-whatsapp-direct"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message on WhatsApp
          </Button>
        </div>
      </ContentSection>

      <Footer />
    </div>
  );
}
