import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNavigation from "@/components/BottomNavigation";
import BackgroundMusic from "@/components/BackgroundMusic";
import FloatingMuteButton from "@/components/FloatingMuteButton";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Experiences from "@/pages/Experiences";
import MeteorNights from "@/pages/MeteorNights";
import MeteorShowerDetail from "@/pages/MeteorShowerDetail";
import Community from "@/pages/Community";
import Contact from "@/pages/Contact";
import Resources from "@/pages/Resources";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/experiences" component={Experiences} />
      <Route path="/meteor-nights" component={MeteorNights} />
      <Route path="/meteor-shower/:id" component={MeteorShowerDetail} />
      <Route path="/community" component={Community} />
      <Route path="/resources" component={Resources} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BackgroundMusic audioUrl="/cosmic-music.mp3" volume={0.3}>
            <Toaster />
            <div className="pb-20 lg:pb-0">
              <Router />
            </div>
            <BottomNavigation />
            <FloatingMuteButton />
          </BackgroundMusic>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
