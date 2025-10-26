import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import ExperienceCard from "@/components/ExperienceCard";
import LoadingPage from "@/components/LoadingPage";
import SEO from "@/components/SEO";

import starTrailsImage from "@assets/stock_images/long_exposure_stars__411203e7.jpg";
import desertImage from "@assets/stock_images/desert_dunes_night_s_ee2f17ac.jpg";
import milkyWayImage from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";
import auroraImage from "@assets/stock_images/aurora_borealis_nort_b91defe5.jpg";
import stargazingImage from "@assets/stock_images/person_silhouette_st_c7feb986.jpg";

export default function Experiences() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loader for 1 second on page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage message="Preparing your cosmic journey..." />;
  }

  const experiencesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Night Sky Experiences",
    "description": "Curated astronomical experiences including meteor nights, aurora journeys, and astrophotography workshops.",
    "numberOfItems": 6
  };

  const experiences = [
    {
      title: "Meteor Nights",
      description: "Sleep under a meteor-lit sky. Our guided desert expeditions combine astronomy, photography, and silence.",
      image: desertImage,
      season: "August–December",
      duration: "3 nights",
      comingSoon: false
    },
    {
      title: "Cosmic Silence",
      description: "Stargazing and meditation beneath high-altitude skies where the air is thin and the stars are countless.",
      image: milkyWayImage,
      season: "Year-round",
      duration: "2 nights",
      comingSoon: false
    },
    {
      title: "Dark Sky Treks",
      description: "Guided hikes through certified dark-sky reserves where the Milky Way becomes your compass.",
      image: starTrailsImage,
      season: "Spring–Fall",
      duration: "4 days",
      comingSoon: true
    },
    {
      title: "Eclipse Expeditions",
      description: "Witness rare celestial events and cosmic alignments from the world's best viewing locations.",
      image: auroraImage,
      season: "Special Events",
      duration: "Varies",
      comingSoon: true
    },
    {
      title: "Aurora Journeys",
      description: "Chase the northern lights across pristine landscapes in Iceland, Norway, and beyond.",
      image: auroraImage,
      season: "September–March",
      duration: "5 nights",
      comingSoon: true
    },
    {
      title: "Astro-Photography Workshops",
      description: "Learn to capture the cosmos with guidance from master astrophotographers.",
      image: stargazingImage,
      season: "Year-round",
      duration: "3 nights",
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Celestial Experiences - Meteor Nights, Aurora Journeys & More"
        description="Book curated night-sky experiences: meteor showers in the desert, aurora hunting, dark sky treks, and astrophotography workshops. Journey to the world's darkest skies."
        keywords="meteor shower tours, aurora borealis trips, dark sky experiences, astrophotography workshops, astronomy tours, stargazing expeditions, celestial events"
        schema={experiencesSchema}
      />
      <Navigation />
      
      <HeroSection
        image={starTrailsImage}
        headline="Journeys Under the Infinite"
        subheadline="Curated celestial experiences designed to reconnect you with the cosmos."
        minHeight="min-h-[70vh]"
      />

      <ContentSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {experiences.map((exp, index) => (
            <ExperienceCard
              key={index}
              {...exp}
              onLearnMore={() => {
                if (exp.title === "Meteor Nights") {
                  setLocation("/meteor-nights");
                }
              }}
            />
          ))}
        </div>
      </ContentSection>

      <ContentSection
        title="What to Expect"
        centered
        className="bg-card/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl">Expert Guidance</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Every expedition is led by experienced astronomers, astrophotographers, and wilderness guides who share their passion for the cosmos.
            </p>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl">Premium Comfort</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              We believe wonder doesn't require sacrifice. Expect comfortable accommodations, gourmet meals, and thoughtful amenities.
            </p>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl">Small Groups</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Limited to 12-15 participants per journey to ensure intimate experiences and personalized attention.
            </p>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl">All Equipment Provided</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              From telescopes to photography gear, warm blankets to camping essentials — everything you need is included.
            </p>
          </div>
        </div>
      </ContentSection>

      <Footer />
    </div>
  );
}
