import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ContentSection from "@/components/ContentSection";
import LoadingPage from "@/components/LoadingPage";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

import milkyWayImage from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";

export default function Contact() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  useEffect(() => {
    // Show loader for 1 second on page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage message="Let's find your perfect celestial journey..." />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    toast({
      title: "Message Sent",
      description: "We'll be in touch soon to help you find your perfect celestial journey.",
    });
    setFormData({ name: "", email: "", message: "" });
  };

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact NightSky.earth",
    "description": "Book your cosmic journey or join our community of astronomers and astrophotographers.",
    "mainEntity": {
      "@type": "Organization",
      "name": "NightSky.earth",
      "email": "hello@nightsky.earth"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Contact Us - Book Your Cosmic Journey"
        description="Ready to witness the universe? Contact NightSky.earth to book meteor shower experiences, aurora journeys, or join our community of cosmic explorers."
        keywords="book stargazing tour, astronomy contact, meteor shower booking, aurora tours, dark sky experiences contact"
        schema={contactSchema}
      />
      <Navigation />
      
      <HeroSection
        image={milkyWayImage}
        headline="The night sky belongs to everyone."
        subheadline="Let's find yours."
        minHeight="min-h-[70vh]"
      />

      <ContentSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 max-w-6xl mx-auto">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-4 sm:mb-6">Book Now</h2>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message or Destination Interest
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your dream celestial journey..."
                      rows={6}
                      required
                      data-testid="input-message"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    data-testid="button-send-message"
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4">Get in Touch</h3>
              <p className="text-muted-foreground mb-6">
                Ready to embark on a journey under the stars? Whether you're interested in a specific expedition or just curious about what we offer, we'd love to hear from you.
              </p>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Email:</span>{" "}
                  <a href="mailto:hello@nightsky.earth" className="text-primary hover:underline">
                    hello@nightsky.earth
                  </a>
                </p>
              </div>
            </div>

            <Card className="bg-card/50">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl mb-3">What Happens Next?</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary font-semibold">1.</span>
                    <span>We'll review your message and match you with the perfect experience</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-semibold">2.</span>
                    <span>Our team will reach out within 24 hours to discuss details</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-semibold">3.</span>
                    <span>We'll help you plan every aspect of your celestial journey</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-semibold">4.</span>
                    <span>Get ready to look up and rediscover wonder</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 rounded-md">
              <p className="font-serif text-xl italic text-center">
                "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."
              </p>
              <p className="text-sm text-muted-foreground text-center mt-3">— Carl Sagan</p>
            </div>
          </div>
        </div>
      </ContentSection>

      <Footer />
    </div>
  );
}
