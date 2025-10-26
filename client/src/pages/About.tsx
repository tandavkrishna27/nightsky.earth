import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import StarField from "@/components/StarField";
import LoadingPage from "@/components/LoadingPage";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, Users, Telescope, Globe } from "lucide-react";

import milkyWayImage from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";

export default function About() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage message="Where Earth looks up..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <HeroSection
        image={milkyWayImage}
        headline="Where Earth Looks Up"
        subheadline="About NightSky.Earth"
        minHeight="min-h-[70vh]"
      />

      <ContentSection
        title="Our Story"
        centered
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6 text-muted-foreground"
        >
          <p className="text-lg sm:text-xl leading-relaxed italic text-center">
            One night, in the stillness between our expedition campfires, we looked up —<br />
            and remembered how small and infinite we truly are.
          </p>
          
          <p className="text-base sm:text-lg leading-relaxed">
            For over a decade, we've been chasing the rarest astronomical events — meteor showers, eclipses, auroras — traveling to the quietest corners of the planet to witness what most never see.
          </p>
          
          <p className="text-base sm:text-lg leading-relaxed">
            Somewhere along those journeys, a realization dawned on us:<br />
            <span className="italic">the stars are not just to be observed — they are meant to be shared.</span>
          </p>
          
          <p className="text-base sm:text-lg leading-relaxed">
            That moment sparked NightSky.Earth — a community built around a single, universal feeling: <span className="font-semibold text-foreground">awe</span>.
          </p>
          
          <p className="text-base sm:text-lg leading-relaxed">
            What began as small, starlit gatherings grew into something far greater —<br />
            a collaboration between astronomers, astrophotographers, and explorers who wanted to help people experience the universe for real.
          </p>
          
          <p className="text-base sm:text-lg leading-relaxed font-medium text-foreground">
            Today, NightSky.Earth connects those who understand the sky<br />
            with those who long to see it.
          </p>
        </motion.div>
      </ContentSection>

      <ContentSection
        title="Who We Are"
        centered
        className="bg-card/30"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6 text-muted-foreground mb-12"
        >
          <p className="text-base sm:text-lg leading-relaxed">
            We are a collective of sky lovers — <span className="text-foreground">scientists, creators, educators, and dreamers</span> — united by curiosity and the belief that wonder can change how people see the world.
          </p>
          
          <p className="text-base sm:text-lg leading-relaxed">
            We design and support experiences that bring the night sky closer to everyone:<br />
            from meteor camps in the desert,<br />
            to dark-sky expeditions in the Himalayas,<br />
            to community stargazing nights above city rooftops.
          </p>
          
          <p className="text-base sm:text-lg leading-relaxed font-medium text-foreground">
            Behind every experience is a partnership —<br />
            between people who study the stars and people who want to feel them.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: Users,
              title: "Scientists & Educators",
              description: "Astronomers and researchers sharing knowledge"
            },
            {
              icon: Telescope,
              title: "Creators & Artists",
              description: "Astrophotographers capturing cosmic beauty"
            },
            {
              icon: Sparkles,
              title: "Explorers & Guides",
              description: "Wilderness experts leading expeditions"
            },
            {
              icon: Globe,
              title: "Community Builders",
              description: "People bringing wonder to their cities"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="hover-elevate h-full">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        title="What We Do"
        centered
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6 text-muted-foreground"
        >
          <p className="text-lg sm:text-xl leading-relaxed font-medium text-foreground text-center">
            At our core, we help others create and share night-sky experiences.
          </p>
          
          <p className="text-base sm:text-lg leading-relaxed">
            NightSky.Earth collaborates with astronomers, astrophotographers, and educators to design, host, and scale events that connect people to the cosmos — blending science, art, and emotion.
          </p>
        </motion.div>
      </ContentSection>

      <div className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-background via-primary/10 to-background">
        <StarField />
        <ContentSection
          title="Our Purpose"
          centered
          className="relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl text-center italic mb-8">
              "To reconnect Earth with the sky —<br />and people with wonder."
            </blockquote>
            
            <div className="text-muted-foreground space-y-4 text-base sm:text-lg leading-relaxed">
              <p>
                We exist to bring back a simple, forgotten act: <span className="text-foreground font-medium">looking up</span>.
              </p>
              <p>
                In a world where city lights drown the stars and screens fill our days, we create moments that remind people what it feels like to be part of something vast and alive.
              </p>
            </div>
          </motion.div>
        </ContentSection>
      </div>

      <ContentSection
        title="Our Vision"
        centered
        className="bg-card/30"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <blockquote className="font-serif text-xl md:text-2xl text-center italic text-foreground mb-8">
            A world where every person, everywhere,<br />
            has seen a sky unspoiled by light —<br />
            and found a piece of themselves in it.
          </blockquote>
          
          <div className="text-muted-foreground space-y-4 text-base sm:text-lg leading-relaxed">
            <p>
              We imagine a planet that protects its dark skies as sacred —
            </p>
            <p>
              where astronomy, art, and adventure come together to nurture curiosity and care.
            </p>
            <p>
              A community where experts and explorers collaborate not for profit, but for perspective.
            </p>
            <p className="font-medium text-foreground">
              A global movement that turns moments of wonder into movements of awareness.
            </p>
          </div>
        </motion.div>
      </ContentSection>

      <Footer />
    </div>
  );
}
