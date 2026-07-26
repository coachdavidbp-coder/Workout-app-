import { useStore } from "../store.jsx";
import { signOut, isCloud } from "../lib/firebase.js";
import { TRAINING_DAY_COUNT } from "../data/plan.js";
import BrandLogo from "../components/BrandLogo.jsx";

export default function MoreScreen() {
  const { state, mode, user, actions } = useStore();

  const totalDone = Object.values(state.done).filter(Boolean).length;
  const totalTarget = TRAINING_DAY_COUNT * 4;
  const name = user?.displayName || state.profile.name || "Coach";
  const initial = name.trim()[0]?.toUpperCase() || "U";

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
        </div>
        <div className="h-title">
          <div className="kicker">Profile</div>
          <h1>You</h1>
        </div>
      </header>

      <main className="content">
        <div className="card profile-card">
          <div className="avatar">{initial}</div>
          <div style={{ flex: 1 }}>
            <div className="pn">{name}</div>
            <div className="pe">
              {user?.email || (mode === "cloud" ? "Signed in" : "Saved on this device")}
            </div>
          </div>
          <span className={`mode-badge ${mode === "cloud" ? "cloud" : ""}`}>
            <span className="d" />
            {mode === "cloud" ? "Synced" : "Local"}
          </span>
        </div>

        <div className="mini-stats">
          <div className="mini-stat">
            <div className="k">{totalDone}</div>
            <div className="l">Workouts done</div>
          </div>
          <div className="mini-stat">
            <div className="k">{Math.round((totalDone / totalTarget) * 100)}%</div>
            <div className="l">Program</div>
          </div>
          <div className="mini-stat">
            <div className="k">{state.weights.length}</div>
            <div className="l">Weigh-ins</div>
          </div>
        </div>

        <div>
          <div className="section-label">Goals</div>
          <div className="card">
            <div className="setting-row">
              <div className="lab">
                Start weight
                <small>Your GLP-1 journey starting point</small>
              </div>
              <input
                type="number"
                value={state.profile.startWeight}
                onChange={(e) => actions.setProfile({ startWeight: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="setting-row">
              <div className="lab">
                Goal weight
                <small>Where you're headed</small>
              </div>
              <input
                type="number"
                value={state.profile.goalWeight}
                onChange={(e) => actions.setProfile({ goalWeight: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {mode !== "cloud" && (
          <div className="note-box">
            <b>Want your data on iPhone and iPad?</b> Turn on free Firebase sync — see
            SETUP in the project. Until then everything is saved safely on this device.
          </div>
        )}

        {mode === "cloud" && (
          <button className="btn btn-block" onClick={() => signOut()}>
            Sign Out
          </button>
        )}

        <p className="login-foot">US vs Them · 4-week football training · v1</p>
      </main>
    </div>
  );
}
