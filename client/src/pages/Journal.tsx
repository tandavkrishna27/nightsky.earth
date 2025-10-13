import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import JournalCard from "@/components/JournalCard";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import starTrailsImage from "@assets/stock_images/long_exposure_stars__411203e7.jpg";
import desertImage from "@assets/stock_images/desert_dunes_night_s_ee2f17ac.jpg";
import milkyWayImage from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";
import auroraImage from "@assets/stock_images/aurora_borealis_nort_b91defe5.jpg";
import stargazingImage from "@assets/stock_images/person_silhouette_st_c7feb986.jpg";
import heroImage from "@assets/stock_images/starry_night_sky_met_675ba820.jpg";

interface JournalEntry {
  title: string;
  excerpt: string;
  content: string;
  image: string;
  tag: string;
}

export default function Journal() {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const entries: JournalEntry[] = [
    {
      title: "Dancing Lights of the North",
      excerpt: "Our expedition to witness the aurora borealis revealed nature's most ethereal light show...",
      content: "The aurora borealis is more than a visual spectacle — it's a reminder of our planet's invisible connection to the sun. As solar winds collide with Earth's magnetic field, they paint the sky in impossible greens and purples. Standing beneath this celestial dance in the Arctic silence, our group fell into reverent quiet. Some wept. Others laughed in disbelief. All of us felt small in the best possible way.",
      image: auroraImage,
      tag: "Aurora"
    },
    {
      title: "When Meteors Paint the Desert",
      excerpt: "The Perseids meteor shower transformed the Mojave into a cosmic cinema...",
      content: "Forty-seven meteors in a single hour. We counted them together, sprawled on blankets in the warm desert night. Each streak of light was a 3,000-year-old ice fragment from Comet Swift-Tuttle, burning up at 37 miles per second. Ancient debris becoming momentary brilliance. The metaphor wasn't lost on us.",
      image: desertImage,
      tag: "Meteor Showers"
    },
    {
      title: "The Milky Way's Hidden Message",
      excerpt: "In Chile's Atacama Desert, we learned to read the river of stars...",
      content: "At 8,000 feet elevation in the Atacama, the Milky Way isn't just visible — it's overwhelming. Our astronomer guide pointed out that we were looking at the center of our galaxy, 26,000 light-years away. Every photon hitting our retinas had been traveling since before human civilization began. We were literally seeing into deep time.",
      image: milkyWayImage,
      tag: "Night Photography"
    },
    {
      title: "Silence Under the Stars",
      excerpt: "What we discovered in the absence of city noise and artificial light...",
      content: "There's a sound to complete darkness and silence that defies description. In Utah's Natural Bridges Dark Sky Park, with no human-made light for 100 miles, the quiet becomes tangible. We heard our own heartbeats. We heard the wind carrying whispers from distant canyons. And above, the stars sang their ancient song of hydrogen fusion and gravitational dance.",
      image: stargazingImage,
      tag: "Field Notes"
    },
    {
      title: "Star Trails: Time Made Visible",
      excerpt: "A four-hour exposure reveals Earth's rotation in stunning detail...",
      content: "Setting up our cameras for star trail photography requires patience and precision. Four hours of exposure, tracking Earth's rotation through the apparent motion of stars. The result: concentric circles of light that prove we're standing on a spinning planet, hurtling through space at 67,000 miles per hour. Yet standing there in the dark, we felt perfectly still.",
      image: starTrailsImage,
      tag: "Night Photography"
    },
    {
      title: "Cosmic Perspective",
      excerpt: "How a week under dark skies changed how we see everything...",
      content: "On the last night of our expedition, someone asked what we'd learned. The answers surprised us all. Not facts about stars or galaxies, but insights about ourselves. About how small our problems seemed under the vastness of space. About how connected we felt to strangers who'd become friends. About remembering to look up.",
      image: heroImage,
      tag: "Field Notes"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <HeroSection
        image={starTrailsImage}
        headline="Moments Beneath the Infinite"
        subheadline="Stories and reflections from our journeys under the stars."
        minHeight="min-h-[70vh]"
      />

      <ContentSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {entries.map((entry, index) => (
            <JournalCard
              key={index}
              {...entry}
              onClick={() => setSelectedEntry(entry)}
            />
          ))}
        </div>
      </ContentSection>

      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <div className="relative h-80 -mx-6 -mt-6 mb-6">
                <img
                  src={selectedEntry.image}
                  alt={selectedEntry.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" data-testid="dialog-badge-tag">{selectedEntry.tag}</Badge>
                </div>
              </div>
              <DialogHeader>
                <DialogTitle className="font-serif text-3xl" data-testid="dialog-title">{selectedEntry.title}</DialogTitle>
              </DialogHeader>
              <div className="prose prose-lg prose-invert">
                <p className="text-muted-foreground leading-relaxed" data-testid="dialog-content">
                  {selectedEntry.content}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
