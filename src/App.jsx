import { useState, useEffect } from "react";
import { useStore } from "./store.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import TrainScreen from "./screens/TrainScreen.jsx";
import RunScreen from "./screens/RunScreen.jsx";
import MealsScreen from "./screens/MealsScreen.jsx";
import MealPrepScreen from "./screens/MealPrepScreen.jsx";
import ProgressScreen from "./screens/ProgressScreen.jsx";
import MoreScreen from "./screens/MoreScreen.jsx";
import Login from "./screens/Login.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Toaster from "./components/Toaster.jsx";
import AchievementWatcher from "./components/AchievementWatcher.jsx";
import BrandLogo from "./components/BrandLogo.jsx";
import { setVoiceName, setCoachStyle } from "./lib/voice.js";
import { handleSpotifyRedirect } from "./lib/spotify.js";

const TABS = [
  { id: "home", label: "Home", img: "/icons/nav-home.png", Screen: HomeScreen },
  { id: "train", label: "Train", img: "/icons/nav-train.png", Screen: TrainScreen },
  { id: "run", label: "Run", img: "/icons/nav-run.png", Screen: RunScreen },
  { id: "meals", label: "Nutrition", img: "/icons/nav-nutrition.png", Screen: MealsScreen },
  { id: "prep", label: "Prep", img: "/icons/nav-prep.png", Screen: MealPrepScreen },
  { id: "weight", label: "Progress", img: "/icons/nav-progress.png", Screen: ProgressScreen },
  { id: "more", label: "You", img: "/icons/nav-you.png", Screen: MoreScreen },
];

export default function App() {
  const { mode, state } = useStore();
  const [tab, setTab] = useState("home");
  const theme = state?.settings?.theme || "system";
  const voiceName = state?.settings?.voiceName || null;
  const coachStyle = state?.settings?.coachStyle || "balanced";

  useEffect(() => { setVoiceName(voiceName); }, [voiceName]);
  useEffect(() => { setCoachStyle(coachStyle); }, [coachStyle]);

  // If we returned from a Spotify auth redirect, finish the handshake once.
  useEffect(() => { handleSpotifyRedirect(); }, []);

  // apply theme to <html>: explicit light/dark, or follow the system when "system"
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", getComputedStyle(root).getPropertyValue("--g").trim() || "#000000");
  }, [theme]);

  if (mode === "loading") {
    return (
      <div className="app-shell">
        <div style={{ margin: "auto", opacity: 0.9 }}>
          <BrandLogo height={30} style={{ height: "auto", width: 220 }} />
        </div>
      </div>
    );
  }

  if (mode === "signedout") {
    return (
      <div className="app-shell">
        <Login />
      </div>
    );
  }

  if (!state?.profile?.onboarded) {
    return (
      <div className="app-shell">
        <Toaster />
        <ErrorBoundary>
          <Onboarding />
        </ErrorBoundary>
      </div>
    );
  }

  const Active = TABS.find((t) => t.id === tab).Screen;

  return (
    <div className="app-shell">
      <AchievementWatcher />
      <Toaster />
      <ErrorBoundary key={tab}>
        <Active go={setTab} />
      </ErrorBoundary>
      <nav className="bottom-nav">
        {TABS.map(({ id, label, img }) => (
          <button
            key={id}
            className={`nav-item ${tab === id ? "on" : ""}`}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
          >
            <img className="nav-img" src={img} alt="" aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
