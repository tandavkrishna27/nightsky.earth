import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StarField from "@/components/StarField";

import stargazingImage from "@assets/stock_images/person_silhouette_st_c7feb986.jpg";

export default function Science() {
  const guides = [
    {
      name: "Dr. Sarah Chen",
      role: "Lead Astronomer",
      initials: "SC",
      bio: "Former NASA researcher with 15 years studying celestial mechanics."
    },
    {
      name: "Marcus Rivera",
      role: "Astrophotographer",
      initials: "MR",
      bio: "Award-winning photographer featured in National Geographic and Sky & Telescope."
    },
    {
      name: "Dr. Elena Volkov",
      role: "Dark Sky Advocate",
      initials: "EV",
      bio: "Environmental scientist dedicated to preserving the world's remaining dark skies."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <HeroSection
        image={stargazingImage}
        headline="The Universe, Explained Beautifully"
        subheadline="Where science meets storytelling under the stars."
        minHeight="min-h-[70vh]"
      />

      <ContentSection
        title="Why We Travel by the Stars"
        centered
      >
        <div className="max-w-4xl mx-auto space-y-6 text-muted-foreground">
          <p className="text-lg leading-relaxed">
            Every NightSky.earth journey is meticulously planned around authentic celestial events. We don't just take you to dark places — we take you to the right place at the right time.
          </p>
          <p className="text-lg leading-relaxed">
            Meteor showers, planetary alignments, eclipses, and aurora activity all follow predictable patterns. By understanding these cosmic rhythms, we can position you in the world's darkest locations precisely when the universe puts on its greatest shows.
          </p>
          <p className="text-lg leading-relaxed">
            This fusion of scientific precision and experiential design ensures that every journey delivers moments of authentic wonder — not by chance, but by careful celestial choreography.
          </p>
        </div>
      </ContentSection>

      <div className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-background via-accent/20 to-background">
        <StarField />
        <ContentSection
          title="Our Guides & Experts"
          centered
          className="relative z-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {guides.map((guide, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="p-8 text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {guide.initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-serif text-xl mb-1" data-testid={`text-guide-name-${index}`}>{guide.name}</h3>
                  <p className="text-sm text-primary mb-3" data-testid={`text-guide-role-${index}`}>{guide.role}</p>
                  <p className="text-sm text-muted-foreground" data-testid={`text-guide-bio-${index}`}>{guide.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ContentSection>
      </div>

      <ContentSection
        title="Protecting the Dark Sky"
        centered
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Light pollution has robbed 80% of humanity of the ability to see the Milky Way from their homes. The night sky — our shared natural heritage — is disappearing.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl mb-3">Conservation Partners</h3>
                <p className="text-sm text-muted-foreground">
                  We partner with International Dark-Sky Association and local conservation groups to protect certified dark-sky reserves.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl mb-3">Eco-Travel Ethics</h3>
                <p className="text-sm text-muted-foreground">
                  Every expedition follows leave-no-trace principles and contributes to local conservation efforts.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl mb-3">Education</h3>
                <p className="text-sm text-muted-foreground">
                  We teach participants about light pollution and how they can advocate for darker skies in their communities.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl mb-3">Impact</h3>
                <p className="text-sm text-muted-foreground">
                  10% of every booking supports dark-sky preservation initiatives worldwide.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ContentSection>

      <Footer />
    </div>
  );
}
