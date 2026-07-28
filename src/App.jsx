import { useState, useEffect } from "react";
import { useStore } from "./store.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import TrainScreen from "./screens/TrainScreen.jsx";
import MealsScreen from "./screens/MealsScreen.jsx";
import MealPrepScreen from "./screens/MealPrepScreen.jsx";
import ProgressScreen from "./screens/ProgressScreen.jsx";
import MoreScreen from "./screens/MoreScreen.jsx";
import Login from "./screens/Login.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Toaster from "./components/Toaster.jsx";
import AchievementWatcher from "./components/AchievementWatcher.jsx";
import {
  IconHome,
  IconTrain,
  IconMeals,
  IconWeight,
  IconMore,
  IconPrep,
} from "./components/icons.jsx";
import BrandLogo from "./components/BrandLogo.jsx";
import { setVoiceName, setCoachStyle } from "./lib/voice.js";
import { handleSpotifyRedirect } from "./lib/spotify.js";

const TABS = [
  { id: "home", label: "Home", Icon: IconHome, Screen: HomeScreen },
  { id: "train", label: "Train", Icon: IconTrain, Screen: TrainScreen },
  { id: "meals", label: "Nutrition", Icon: IconMeals, Screen: MealsScreen },
  { id: "prep", label: "Prep", Icon: IconPrep, Screen: MealPrepScreen },
  { id: "weight", label: "Progress", Icon: IconWeight, Screen: ProgressScreen },
  { id: "more", label: "You", Icon: IconMore, Screen: MoreScreen },
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
    if (meta) meta.setAttribute("content", getComputedStyle(root).getPropertyValue("--g").trim() || "#0A1020");
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
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${tab === id ? "on" : ""}`}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
