import { useState } from "react";
import { useStore } from "./store.jsx";
import TrainScreen from "./screens/TrainScreen.jsx";
import MealsScreen from "./screens/MealsScreen.jsx";
import WeightScreen from "./screens/WeightScreen.jsx";
import MoreScreen from "./screens/MoreScreen.jsx";
import SupplementsScreen from "./screens/SupplementsScreen.jsx";
import Login from "./screens/Login.jsx";
import {
  IconTrain,
  IconMeals,
  IconWeight,
  IconSupps,
  IconMore,
} from "./components/icons.jsx";
import BrandLogo from "./components/BrandLogo.jsx";

const TABS = [
  { id: "train", label: "Train", Icon: IconTrain, Screen: TrainScreen },
  { id: "meals", label: "Meals", Icon: IconMeals, Screen: MealsScreen },
  { id: "supps", label: "Supps", Icon: IconSupps, Screen: SupplementsScreen },
  { id: "weight", label: "Weight", Icon: IconWeight, Screen: WeightScreen },
  { id: "more", label: "You", Icon: IconMore, Screen: MoreScreen },
];

export default function App() {
  const { mode } = useStore();
  const [tab, setTab] = useState("train");

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

  const Active = TABS.find((t) => t.id === tab).Screen;

  return (
    <div className="app-shell">
      <Active />
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
