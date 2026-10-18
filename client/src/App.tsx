import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/queryClient";
import PageShell from "./components/PageShell";
import BackgroundMusic from "./components/BackgroundMusic";
import ExperienceShell from "./components/ExperienceShell";
import CalendarPreferences from "./components/sky-events/CalendarPreferences";
import AnalyticsConsent from "./components/AnalyticsConsent";
const Home = lazy(() => import("./pages/Home"));
const SkyEvents = lazy(() => import("./pages/SkyEvents"));
const SkyEventDetail = lazy(() => import("./pages/SkyEventDetail"));
const Resources = lazy(() => import("./pages/Resources"));
const Community = lazy(() => import("./pages/Community"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const News = lazy(() => import("./pages/News"));
const NewsArticle = lazy(() => import("./pages/NewsArticle"));
const MeteorShowerDetail = lazy(() => import("./pages/MeteorShowerDetail"));
const Sources = lazy(() => import("./pages/Sources"));
const SkyMap = lazy(() => import("./pages/SkyMap"));
const SupportingPage = lazy(() => import("./pages/SupportingPages"));
const NotFound = lazy(() => import("./pages/not-found"));
export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AnalyticsConsent>
          <BackgroundMusic audioUrl="/cosmic-music.mp3">
            <CalendarPreferences>
              <ExperienceShell>
                <PageShell>
                  <Suspense
                    fallback={
                      <div className="route-loading" role="status">
                        Loading page…
                      </div>
                    }
                  >
                    <Switch>
                      <Route path="/" component={Home} />
                      <Route path="/sky-events" component={SkyEvents} />
                      <Route path="/sky-events/:id" component={SkyEventDetail} />
                      <Route path="/resources" component={Resources} />
                      <Route path="/community" component={Community} />
                      <Route path="/about" component={About} />
                      <Route path="/contact" component={Contact} />
                      <Route path="/get-started" component={GetStarted} />
                      <Route path="/news" component={News} />
                      <Route path="/news/:id" component={NewsArticle} />
                      <Route path="/meteor-showers">
                        <Redirect to="/sky-events?category=meteor-showers" />
                      </Route>
                      <Route path="/meteor-nights">
                        <Redirect to="/sky-events?category=meteor-showers" />
                      </Route>
                      <Route
                        path="/meteor-shower/:id"
                        component={MeteorShowerDetail}
                      />
                      <Route path="/sources" component={Sources} />
                      <Route path="/sky-map" component={SkyMap} />
                      <Route path="/privacy">
                        <SupportingPage kind="privacy" />
                      </Route>
                      <Route path="/terms">
                        <SupportingPage kind="terms" />
                      </Route>
                      <Route component={NotFound} />
                    </Switch>
                  </Suspense>
                </PageShell>
              </ExperienceShell>
            </CalendarPreferences>
          </BackgroundMusic>
        </AnalyticsConsent>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
