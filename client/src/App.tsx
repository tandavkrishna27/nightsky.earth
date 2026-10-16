import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/queryClient";
import PageShell from "./components/PageShell";
import Home from "./pages/Home";
import About from "./pages/About";
import Community from "./pages/Community";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import GetStarted from "./pages/GetStarted";
import MeteorNights from "./pages/MeteorNights";
import MeteorShowerDetail from "./pages/MeteorShowerDetail";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import SupportingPage from "./pages/SupportingPages";
import NotFound from "./pages/not-found";
export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <PageShell>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/resources" component={Resources} />
            <Route path="/community" component={Community} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/get-started" component={GetStarted} />
            <Route path="/news" component={News} />
            <Route path="/news/:id" component={NewsArticle} />
            <Route path="/meteor-showers" component={MeteorNights} />
            <Route path="/meteor-nights">
              <Redirect to="/meteor-showers" />
            </Route>
            <Route path="/meteor-shower/:id" component={MeteorShowerDetail} />
            <Route path="/sources">
              <SupportingPage kind="sources" />
            </Route>
            <Route path="/privacy">
              <SupportingPage kind="privacy" />
            </Route>
            <Route path="/terms">
              <SupportingPage kind="terms" />
            </Route>
            <Route component={NotFound} />
          </Switch>
        </PageShell>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
