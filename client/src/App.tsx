import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Experiences from "@/pages/Experiences";
import MeteorNights from "@/pages/MeteorNights";
import MeteorShowerDetail from "@/pages/MeteorShowerDetail";
import Science from "@/pages/Science";
import Journal from "@/pages/Journal";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/experiences" component={Experiences} />
      <Route path="/meteor-nights" component={MeteorNights} />
      <Route path="/meteor-shower/:id" component={MeteorShowerDetail} />
      <Route path="/science" component={Science} />
      <Route path="/journal" component={Journal} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
