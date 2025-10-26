import { Link } from "wouter";
import { Instagram, Youtube, Mail, Heart } from "lucide-react";
import { SiX } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
          <div className="text-center sm:text-left lg:col-span-1">
            <Link href="/">
              <h3 className="font-serif text-xl sm:text-2xl mb-4 cursor-pointer hover:text-primary transition-colors mx-auto sm:mx-0 w-fit" data-testid="footer-logo">
                NightSky.earth
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground italic leading-relaxed mb-6 mx-auto sm:mx-0">
              Dedicated to the preservation of dark skies and the spirit of wonder.
            </p>
            <div className="flex items-center gap-4 justify-center sm:justify-start w-full">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
                data-testid="link-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
                data-testid="link-youtube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="X (Twitter)"
                data-testid="link-x"
              >
                <SiX className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@nightsky.earth"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Email"
                data-testid="link-email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-base sm:text-lg mb-4">Explore</h4>
            <div className="space-y-3">
              <Link href="/about">
                <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-about">
                  About Us
                </span>
              </Link>
              <Link href="/experiences">
                <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-experiences">
                  Experiences
                </span>
              </Link>
              <Link href="/meteor-nights">
                <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-meteor-nights">
                  Meteor Nights
                </span>
              </Link>
              <Link href="/community">
                <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-community">
                  Community
                </span>
              </Link>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-base sm:text-lg mb-4">Resources</h4>
            <div className="space-y-3">
              <Link href="/resources">
                <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-resources">
                  Stargazing Tools
                </span>
              </Link>
              <Link href="/contact">
                <span className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-contact">
                  Contact Us
                </span>
              </Link>
              <a 
                href="mailto:hello@nightsky.earth" 
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="footer-link-email"
              >
                hello@nightsky.earth
              </a>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-base sm:text-lg mb-4">Join Us</h4>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stay updated on upcoming meteor showers, expeditions, and celestial events.
              </p>
              <Link href="/contact">
                <span className="inline-block text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium" data-testid="footer-link-subscribe">
                  Subscribe to Updates →
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 sm:pt-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2025 NightSky.earth. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span>Observing from Earth with</span>
              <Heart className="h-4 w-4 text-primary fill-primary" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
