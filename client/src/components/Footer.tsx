import { Link } from "wouter";
import { Instagram, Youtube, Mail } from "lucide-react";
import { SiX } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-serif text-xl mb-4">NightSky.earth</h3>
            <p className="text-sm text-muted-foreground italic">
              "Dedicated to the preservation of dark skies and the spirit of wonder."
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <div className="space-y-2">
              <Link href="/about">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-about">
                  About
                </span>
              </Link>
              <br />
              <Link href="/experiences">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-experiences">
                  Experiences
                </span>
              </Link>
              <br />
              <Link href="/journal">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-journal">
                  Journal
                </span>
              </Link>
              <br />
              <Link href="/contact">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="footer-link-contact">
                  Contact
                </span>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-youtube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-x"
              >
                <SiX className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@nightsky.earth"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 NightSky.earth. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
