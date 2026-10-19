import { useEffect, useRef, useState } from "react";
import { ExternalLink, Map, MapPin, Maximize2, Minimize2, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import "@/styles/sky-map.css";

const STELLARIUM_URL = "https://stellarium-web.org/";

export default function SkyMap() {
  const [loaded, setLoaded] = useState(false);
  const [deviceLocationAllowed, setDeviceLocationAllowed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const isFullscreen = expanded || nativeFullscreen;

  useEffect(() => {
    const syncFullscreen = () => {
      setNativeFullscreen(document.fullscreenElement === frameRef.current);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) setExpanded(false);
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [expanded]);

  const toggleFullscreen = async () => {
    const frame = frameRef.current;
    if (isFullscreen) {
      if (document.fullscreenElement === frame && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch {
          setExpanded(false);
        }
      } else {
        setExpanded(false);
      }
      return;
    }
    if (frame?.requestFullscreen) {
      try {
        await frame.requestFullscreen();
        return;
      } catch {
        // Some mobile browsers do not allow fullscreen on a div; use the viewport fallback.
      }
    }
    setExpanded(true);
  };

  return (
    <div className="sky-map-page">
      <SEO
        title="Explore the sky."
        description="Explore an interactive sky map from Stellarium Web. Load the map when you are ready to connect to the independent service."
      />
      <section className="sky-map-intro page-width" aria-labelledby="sky-map-title">
        <p className="eyebrow"><Sparkles size={15} aria-hidden="true" /> A window to the night sky</p>
        <h1 id="sky-map-title">Explore the sky.</h1>
        <p className="sky-map-lede">
          Look around the night sky with Stellarium Web. Find a constellation,
          follow a planet, and see what is above your horizon.
        </p>
      </section>

      <section className="sky-map-shell page-width" aria-label="Interactive sky map">
        <div ref={frameRef} className={`sky-map-frame${loaded ? " is-loaded" : ""}${expanded ? " is-expanded" : ""}`}>
          {!loaded ? (
            <div className="sky-map-prompt">
              <div className="sky-map-orbit" aria-hidden="true">
                <span className="sky-map-star sky-map-star-one" />
                <span className="sky-map-star sky-map-star-two" />
                <span className="sky-map-star sky-map-star-three" />
                <Map size={48} strokeWidth={1.2} aria-hidden="true" />
              </div>
              <h2>Your sky is waiting.</h2>
              <p>Choose how Stellarium can set your observing location before you connect.</p>
              <button
                type="button"
                className="sky-map-load-button"
                onClick={() => {
                  setDeviceLocationAllowed(false);
                  setLoaded(true);
                }}
                aria-label="Load map without device location"
              >
                <Sparkles size={17} aria-hidden="true" />
                Load map without device location
              </button>
              <button
                type="button"
                className="sky-map-location-button"
                onClick={() => {
                  setDeviceLocationAllowed(true);
                  setLoaded(true);
                }}
                aria-label="Load map with device location"
              >
                <MapPin size={16} aria-hidden="true" />
                Load with device location
              </button>
              <p className="sky-map-connection-note">
                Stellarium estimates your location from your IP address. If you choose device location, it can also ask your browser for precise location access. Your browser may show a permission prompt; declining keeps the approximate estimate.
              </p>
            </div>
          ) : (
            <>
              <iframe
                className="sky-map-iframe"
                src={STELLARIUM_URL}
                title="Interactive sky map by Stellarium Web"
                loading="lazy"
                referrerPolicy="no-referrer"
                allow={deviceLocationAllowed ? "fullscreen; geolocation" : "fullscreen"}
                allowFullScreen
              />
              <button
                type="button"
                className="sky-map-fullscreen-button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen sky map" : "View sky map fullscreen"}
                aria-pressed={isFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={19} aria-hidden="true" /> : <Maximize2 size={19} aria-hidden="true" />}
              </button>
            </>
          )}
        </div>
        <div className="sky-map-caption">
          <p>Interactive sky map provided by <a href={STELLARIUM_URL} target="_blank" rel="noopener noreferrer">Stellarium Web<span className="sr-only"> (opens in a new tab)</span></a>.</p>
          <a className="sky-map-direct-link" href={STELLARIUM_URL} target="_blank" rel="noopener noreferrer">
            Open Stellarium Web directly <ExternalLink size={15} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </section>
      <p className="sky-map-privacy page-width">
        Stellarium Web is an independent service. It uses IP-based location lookup when the map loads; device location is available only if you choose that option and grant browser permission. Stellarium may use OpenStreetMap Nominatim to resolve a location. Your browser sends map coordinates directly to these providers; NightSky’s app does not receive or store those coordinates. Website hosting and third-party providers may separately process connection data such as IP addresses under their own privacy practices. Read more in our <a href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  );
}
