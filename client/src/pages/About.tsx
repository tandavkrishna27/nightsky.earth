import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

import milkyWayImage from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <HeroSection
        image={milkyWayImage}
        headline="We spend most of our lives looking down."
        subheadline="But every once in a while, the universe reminds us to look up."
        minHeight="min-h-[70vh]"
      />

      <ContentSection centered>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="prose prose-lg prose-invert mx-auto">
            <p className="text-lg text-muted-foreground italic leading-relaxed">
              NightSky.earth was born from that moment of awe — watching a meteor streak across an untouched horizon.
              We exist to bring people closer to the cosmos through journeys that blend science, silence, and soul.
            </p>
            <p className="text-lg text-muted-foreground italic leading-relaxed">
              Each expedition is a return to wonder — a reminder that under the same stars, we're all explorers.
            </p>
          </div>
        </motion.div>
      </ContentSection>

      <div className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-background via-accent/20 to-background">
        <StarField />
        <ContentSection
          title="Our Mission"
          centered
          className="relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <blockquote className="font-serif text-2xl md:text-3xl text-center italic">
              "To preserve the night, and inspire humanity to look up again."
            </blockquote>
          </motion.div>
        </ContentSection>
      </div>

      <ContentSection
        title="What We Believe"
        centered
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="hover-elevate">
            <CardContent className="p-8 text-center">
              <h3 className="font-serif text-2xl mb-4">Connection</h3>
              <p className="text-muted-foreground">
                The night sky connects us to something greater than ourselves — to the vastness of space and the intimacy of shared wonder.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-8 text-center">
              <h3 className="font-serif text-2xl mb-4">Preservation</h3>
              <p className="text-muted-foreground">
                Dark skies are disappearing. We're committed to protecting the places where stars still shine bright and wild.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-8 text-center">
              <h3 className="font-serif text-2xl mb-4">Discovery</h3>
              <p className="text-muted-foreground">
                Every journey is an opportunity to see the universe — and ourselves — with fresh eyes and renewed curiosity.
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      <ContentSection
        title="Our Story"
        centered
        className="bg-card/30"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6 text-muted-foreground"
        >
          <p className="text-lg leading-relaxed">
            It started with a single meteor shower in the Mojave Desert. No city lights. No distractions. Just an endless canvas of stars and the collective gasp of strangers becoming friends.
          </p>
          <p className="text-lg leading-relaxed">
            We realized that most people have never seen a truly dark sky. They've never felt the humbling presence of the Milky Way stretching overhead, or witnessed a meteor painting its brief, brilliant arc across the heavens.
          </p>
          <p className="text-lg leading-relaxed">
            NightSky.earth was founded to change that. To take people beyond the glow of civilization and remind them of their place in the cosmos. To create moments where wonder becomes tangible, where the universe feels both impossibly vast and intimately close.
          </p>
        </motion.div>
      </ContentSection>

      <Footer />
    </div>
  );
}
