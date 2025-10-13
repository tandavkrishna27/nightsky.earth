import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/experiences", label: "Experiences" },
    { path: "/science", label: "The Science" },
    { path: "/journal", label: "Journal" },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
            <span className="font-serif text-lg sm:text-xl text-foreground" data-testid="logo">
              NightSky.earth
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={isActive(link.path) ? "text-primary" : ""}
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/98 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-base ${isActive(link.path) ? "text-primary bg-primary/10" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
