import { Link, useLocation } from "wouter";
import { Home, Compass, Users, BookOpen, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/experiences", label: "Experiences", icon: Compass },
    { path: "/community", label: "Community", icon: Users },
    { path: "/resources", label: "Resources", icon: BookOpen },
    { path: "/contact", label: "Contact", icon: Mail },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border lg:hidden"
      data-testid="bottom-navigation"
    >
      <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]"
                data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                aria-current={active ? "page" : undefined}
              >
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
