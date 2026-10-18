import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { resolveZone, isSupportedZone } from "@shared/skyEventTime";
function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}
function detected() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}
const Context = createContext({
  tz: "UTC",
  view: "month" as "month" | "list",
  now: new Date(),
  fallback: false,
  setTz: (_tz: string, _persist = true) => {},
  setView: (_v: "month" | "list") => {},
  resetZone: (): string => "UTC",
});
export const useCalendarPreferences = () => useContext(Context);
export default function CalendarPreferences({
  children,
}: {
  children: ReactNode;
}) {
  const [tz, setZone] = useState(() =>
    resolveZone(read("nightsky-timezone"), detected()),
  );
  const [view, setViewState] = useState<"month" | "list">(() => {
    const saved = read("nightsky-calendar-view");
    return saved === "month" || saved === "list"
      ? saved
      : window.matchMedia("(max-width:700px)").matches
        ? "list"
        : "month";
  });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const id = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const setTz = (value: string, persist = true) => {
    if (!isSupportedZone(value)) return;
    setZone(value);
    if (persist) save("nightsky-timezone", value);
  };
  const setView = (value: "month" | "list") => {
    setViewState(value);
    save("nightsky-calendar-view", value);
  };
  const resetZone = () => {
    save("nightsky-timezone", null);
    const value = resolveZone(detected());
    setZone(value);
    return value;
  };
  return (
    <Context.Provider
      value={{
        tz,
        view,
        now,
        setTz,
        setView,
        resetZone,
        fallback: !isSupportedZone(detected()),
      }}
    >
      {children}
    </Context.Provider>
  );
}
