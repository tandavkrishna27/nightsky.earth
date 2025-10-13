import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import LoadingPage from "@/components/LoadingPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Globe, Cloud, MapPin, Star, Download, ExternalLink, Book } from "lucide-react";
import { motion } from "framer-motion";
import { SiApple, SiAndroid, SiLinux, SiMacos } from "react-icons/si";

import resourcesHero from "@assets/stock_images/long_exposure_stars__411203e7.jpg";

export default function Resources() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage message="Gathering celestial resources..." />;
  }

  const mobileApps = [
    {
      name: "SkySafari",
      description: "The most comprehensive stargazing app with over 120,000 celestial objects. Real-time tracking and telescope control.",
      platforms: ["iOS", "Android"],
      price: "Free / Premium $4.99-$39.99",
      features: ["Augmented Reality", "Telescope Control", "Offline Maps", "Night Vision"],
      link: "https://skysafariastronomy.com/",
      recommended: true
    },
    {
      name: "Star Walk 2",
      description: "Beautiful real-time sky map with stunning graphics. Point your device at the sky to identify stars, planets, and constellations.",
      platforms: ["iOS", "Android"],
      price: "Free / Premium $2.99",
      features: ["AR Star Finder", "Time Machine", "Celestial Events", "Deep Sky Objects"],
      link: "https://starwalk.space/"
    },
    {
      name: "PhotoPills",
      description: "Essential for planning astrophotography shots. Calculate sun, moon, and Milky Way positions for perfect compositions.",
      platforms: ["iOS", "Android"],
      price: "$10.99",
      features: ["Milky Way Planner", "Sun/Moon Calculator", "Star Trails", "Hyperfocal Table"],
      link: "https://www.photopills.com/",
      recommended: true
    },
    {
      name: "Sky Tonight",
      description: "Modern astronomy app for finding and identifying celestial objects. Beautiful interface with accurate sky maps.",
      platforms: ["iOS", "Android"],
      price: "Free",
      features: ["Tonight's Sky", "Visible Objects", "Calendar Events", "Sky Map"],
      link: "https://starwalk.space/sky-tonight"
    },
    {
      name: "NASA App",
      description: "Official NASA app with latest images, videos, mission updates, and astronomy news.",
      platforms: ["iOS", "Android"],
      price: "Free",
      features: ["Live ISS Tracking", "Mars Rover Images", "Space News", "NASA TV"],
      link: "https://www.nasa.gov/nasaapp/"
    }
  ];

  const desktopApps = [
    {
      name: "Stellarium",
      description: "Free, open-source planetarium software. Shows realistic 3D sky with over 600,000 stars.",
      platforms: ["Windows", "macOS", "Linux"],
      price: "Free",
      features: ["Realistic Sky", "Constellation Art", "Telescope Control", "Plugin Support"],
      link: "https://stellarium.org/",
      recommended: true
    },
    {
      name: "SkySafari Pro",
      description: "Desktop version with advanced features for serious astronomers and telescope control.",
      platforms: ["Windows", "macOS"],
      price: "$59.99-$149.99",
      features: ["15 Million Stars", "Telescope Control", "Orbit Simulation", "Observing Lists"],
      link: "https://skysafariastronomy.com/"
    },
    {
      name: "Cartes du Ciel (SkyChart)",
      description: "Free planetarium software with extensive catalog support and telescope control.",
      platforms: ["Windows", "macOS", "Linux"],
      price: "Free",
      features: ["Deep Sky Catalogs", "Custom Catalogs", "Telescope Interface", "Observation Planning"],
      link: "https://www.ap-i.net/skychart/"
    }
  ];

  const webResources = [
    {
      name: "Clear Dark Sky",
      description: "Weather forecasts specifically for astronomers. Shows cloud cover, transparency, and seeing conditions.",
      category: "Weather",
      link: "https://cleardarksky.com/",
      recommended: true
    },
    {
      name: "Light Pollution Map",
      description: "Interactive world map showing light pollution levels. Find the darkest skies near you.",
      category: "Dark Sky Maps",
      link: "https://www.lightpollutionmap.info/",
      recommended: true
    },
    {
      name: "Dark Site Finder",
      description: "Locate dark sky sites and observatories. User-contributed locations worldwide.",
      category: "Dark Sky Maps",
      link: "https://darksitefinder.com/"
    },
    {
      name: "Time and Date Astronomy",
      description: "Comprehensive astronomy tools including rise/set times, moon phases, and eclipse information.",
      category: "Planning Tools",
      link: "https://www.timeanddate.com/astronomy/"
    },
    {
      name: "Heavens Above",
      description: "Satellite tracking, ISS passes, Iridium flares, and celestial event predictions for your location.",
      category: "Satellite Tracking",
      link: "https://www.heavens-above.com/",
      recommended: true
    },
    {
      name: "Sky & Telescope",
      description: "Latest astronomy news, observing guides, and celestial event calendars.",
      category: "News & Education",
      link: "https://skyandtelescope.org/"
    },
    {
      name: "Astronomy.com",
      description: "Astronomy magazine's website with observing guides, equipment reviews, and sky charts.",
      category: "News & Education",
      link: "https://astronomy.com/"
    },
    {
      name: "International Dark-Sky Association",
      description: "Find certified dark sky places and learn about light pollution conservation.",
      category: "Dark Sky Places",
      link: "https://www.darksky.org/",
      recommended: true
    },
    {
      name: "Astrospheric",
      description: "Advanced weather forecasting for astronomy with cloud predictions and transparency forecasts.",
      category: "Weather",
      link: "https://www.astrospheric.com/"
    },
    {
      name: "CalSky",
      description: "Comprehensive celestial event calculator. Shows everything visible from your location.",
      category: "Planning Tools",
      link: "https://www.calsky.com/"
    }
  ];

  const essentialGear = [
    {
      category: "For Beginners",
      items: [
        { name: "Red LED Headlamp", description: "Preserve night vision while reading star charts" },
        { name: "Star Chart or Planisphere", description: "Physical rotating star map for your latitude" },
        { name: "Binoculars (10x50)", description: "Perfect first instrument, better than cheap telescopes" },
        { name: "Camping Chair", description: "Comfortable stargazing position" },
        { name: "Warm Layers", description: "Nights get cold, even in summer" }
      ]
    },
    {
      category: "For Photographers",
      items: [
        { name: "Sturdy Tripod", description: "Essential for long exposures" },
        { name: "Intervalometer", description: "For time-lapse sequences" },
        { name: "Wide-angle Lens (14-24mm)", description: "Capture more sky" },
        { name: "Fast Lens (f/2.8 or wider)", description: "Gather more light" },
        { name: "Star Tracker", description: "For longer exposures without trails" }
      ]
    }
  ];

  const darkSkyLocations = [
    {
      name: "NamibRand Nature Reserve, Namibia",
      designation: "International Dark Sky Reserve",
      description: "Africa's first International Dark Sky Reserve with some of the darkest skies on Earth.",
      coordinates: "25°S, 16°E"
    },
    {
      name: "Mauna Kea, Hawaii, USA",
      designation: "World-Class Observatory Site",
      description: "Above 40% of Earth's atmosphere. Home to world's largest astronomical observatories.",
      coordinates: "19.8°N, 155.5°W"
    },
    {
      name: "Atacama Desert, Chile",
      designation: "Professional Observatory Region",
      description: "Driest place on Earth with 300+ clear nights per year. Location of ALMA and VLT.",
      coordinates: "23°S, 70°W"
    },
    {
      name: "Aoraki Mackenzie, New Zealand",
      designation: "International Dark Sky Reserve",
      description: "Largest Dark Sky Reserve in the Southern Hemisphere with Magellanic Clouds visible.",
      coordinates: "44°S, 170°E"
    },
    {
      name: "Almora, Uttarakhand, India",
      designation: "Premium Himalayan Dark Sky Site",
      description: "Himalayan town at 1,638m elevation with pristine dark skies. Perfect for stargazing with minimal light pollution and clear mountain air.",
      coordinates: "29.6°N, 79.7°E"
    },
    {
      name: "Cherry Springs State Park, Pennsylvania, USA",
      designation: "International Dark Sky Park",
      description: "One of the best stargazing sites on the US East Coast.",
      coordinates: "41.7°N, 77.8°W"
    },
    {
      name: "Jasper National Park, Alberta, Canada",
      designation: "International Dark Sky Reserve",
      description: "Largest accessible Dark Sky Reserve in the world. Annual Dark Sky Festival every October.",
      coordinates: "52.8°N, 117.9°W"
    },
    {
      name: "Westhavelland, Germany",
      designation: "International Dark Sky Reserve",
      description: "First Dark Sky Reserve in Germany, protecting dark skies in Central Europe.",
      coordinates: "52.7°N, 12.5°E"
    },
    {
      name: "Warrumbungle National Park, Australia",
      designation: "International Dark Sky Park",
      description: "Australia's first Dark Sky Park, home to Siding Spring Observatory.",
      coordinates: "31.3°S, 149.0°E"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <HeroSection
        image={resourcesHero}
        headline="Essential Resources for Stargazers"
        subheadline="Apps, tools, and knowledge to enhance your cosmic journey."
        minHeight="min-h-[60vh]"
      />

      <ContentSection
        title="Mobile Stargazing Apps"
        subtitle="Your pocket planetarium - identify stars, planets, and plan your observations"
        centered
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {mobileApps.map((app, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full hover-elevate">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        {app.name}
                        {app.recommended && (
                          <Badge variant="default" className="ml-2">Recommended</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">{app.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {app.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary">
                        {platform === "iOS" && <SiApple className="w-3 h-3 mr-1" />}
                        {platform === "Android" && <SiAndroid className="w-3 h-3 mr-1" />}
                        {platform}
                      </Badge>
                    ))}
                    <Badge variant="outline">{app.price}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {app.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(app.link, '_blank')}
                      data-testid={`button-download-${app.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </ContentSection>

      <ContentSection
        title="Desktop Planetarium Software"
        subtitle="Professional-grade tools for serious astronomers and telescope control"
        className="bg-card/30"
        centered
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {desktopApps.map((app, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full hover-elevate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    {app.name}
                    {app.recommended && (
                      <Badge variant="default">Top Pick</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{app.description}</CardDescription>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {app.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform === "macOS" && <SiMacos className="w-3 h-3 mr-1" />}
                        {platform === "Linux" && <SiLinux className="w-3 h-3 mr-1" />}
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge variant="outline" className="mb-2">{app.price}</Badge>
                    <div className="flex flex-wrap gap-2">
                      {app.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(app.link, '_blank')}
                      data-testid={`button-download-${app.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </ContentSection>

      <ContentSection
        title="Essential Web Resources"
        subtitle="Weather forecasts, dark sky maps, and planning tools"
        centered
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {["Weather", "Dark Sky Maps", "Planning Tools", "Satellite Tracking", "News & Education", "Dark Sky Places"].map((category) => (
            <div key={category}>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                {category === "Weather" && <Cloud className="w-5 h-5" />}
                {category === "Dark Sky Maps" && <MapPin className="w-5 h-5" />}
                {category === "Planning Tools" && <Star className="w-5 h-5" />}
                {category === "News & Education" && <Book className="w-5 h-5" />}
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {webResources
                  .filter((resource) => resource.category === category)
                  .map((resource, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" onClick={() => window.open(resource.link, '_blank')}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center justify-between">
                            {resource.name}
                            {resource.recommended && (
                              <Badge variant="default" className="ml-2">Essential</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{resource.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button variant="ghost" className="w-full" data-testid={`button-visit-${resource.name.toLowerCase().replace(/\s+/g, '-')}`}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit Site
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </motion.div>
      </ContentSection>

      <ContentSection
        title="Essential Stargazing Gear"
        subtitle="What to bring for the best experience under the stars"
        className="bg-card/30"
        centered
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {essentialGear.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{section.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="border-l-2 border-primary pl-4">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        title="World's Best Dark Sky Locations"
        subtitle="International Dark Sky Places for the ultimate stargazing experience"
        centered
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {darkSkyLocations.map((location, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full hover-elevate">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">{location.designation}</Badge>
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {location.coordinates}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{location.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </ContentSection>

      <ContentSection
        title="Ready to Experience the Night Sky?"
        centered
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-lg text-muted-foreground mb-6">
            Armed with these resources, you're ready to explore the cosmos. Join us for curated experiences under the world's darkest skies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/experiences")} data-testid="button-explore-experiences">
              Explore Our Experiences
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/meteor-nights")} data-testid="button-meteor-calendar">
              2025 Meteor Calendar
            </Button>
          </div>
        </motion.div>
      </ContentSection>

      <Footer />
    </div>
  );
}
