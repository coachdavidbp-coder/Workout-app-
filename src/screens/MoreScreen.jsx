import { useStore, todayKey } from "../store.jsx";
import { signOut } from "../lib/firebase.js";
import BrandLogo from "../components/BrandLogo.jsx";
import { haptic } from "../lib/fx.js";
import { speak } from "../lib/voice.js";

function speakTest() {
  speak("Coach voice on. Let's get to work.");
}
import {
  totalXP, levelInfo, streak, badges, profileIcons, currentIcon,
  totals, activeDates,
} from "../lib/gamify.js";

export default function MoreScreen() {
  const { state, mode, user, actions } = useStore();
  const xp = totalXP(state);
  const lvl = levelInfo(xp);
  const s = streak(state);
  const t = totals(state);
  const icon = currentIcon(state);
  const icons = profileIcons(state);
  const blist = badges(state);
  const earned = blist.filter((b) => b.earned).length;
  const name = user?.displayName || state.profile?.name || "Coach";

  // last-30-day record
  const active = activeDates(state);
  let wins = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
    if (active.has(todayKey(d))) wins++;
  }
  const losses = 30 - wins;
  const winPct = Math.round((wins / 30) * 100);

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
          <span className={`mode-badge ${mode === "cloud" ? "cloud" : ""}`}>
            <span className="d" />{mode === "cloud" ? "Synced" : "Local"}
          </span>
        </div>
        <div className="h-title">
          <div className="kicker">Level {lvl.level} · {lvl.title}</div>
          <h1>You</h1>
        </div>
      </header>

      <main className="content">
        {/* profile card */}
        <div className="card profile-card glass">
          <div className="avatar" style={{ fontSize: 26 }}>{icon.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="pn">{name}</div>
            <div className="pe">{user?.email || (mode === "cloud" ? "Signed in" : "Saved on this device")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono-num" style={{ fontSize: 20, color: "var(--ac-hi)" }}>{xp}</div>
            <div style={{ fontSize: 10, color: "var(--mu)", textTransform: "uppercase", fontFamily: "var(--font-display)", fontWeight: 700 }}>XP</div>
          </div>
        </div>

        {/* icon picker */}
        <div className="section-title">Profile icon</div>
        <div className="icon-grid">
          {icons.map((ic) => (
            <button
              key={ic.id}
              className={`icon-opt ${icon.id === ic.id ? "on" : ""} ${ic.unlocked ? "" : "locked"}`}
              onClick={() => { if (ic.unlocked) { actions.setProfileIcon(ic.id); haptic(); } }}
              title={ic.unlocked ? ic.name : "Locked — keep leveling up"}
            >
              {ic.emoji}
              {!ic.unlocked && <span className="lock">🔒</span>}
            </button>
          ))}
        </div>

        {/* stats */}
        <div className="section-title">Stats</div>
        <div className="mini-stats">
          <div className="mini-stat"><div className="k">{t.workouts}</div><div className="l">Workouts</div></div>
          <div className="mini-stat"><div className="k" style={{ color: "var(--good)" }}>{s.current}</div><div className="l">Streak · best {s.best}</div></div>
          <div className="mini-stat"><div className="k" style={{ color: "var(--amber)" }}>{t.calories}</div><div className="l">Calories</div></div>
        </div>

        {/* record */}
        <div className="card glass" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26 }}>
              {wins}<span style={{ color: "var(--mu)" }}>–</span>{losses}
            </div>
            <div style={{ fontSize: 11, color: "var(--mu)", textTransform: "uppercase", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: ".05em" }}>
              30-day record (W–L)
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: winPct >= 60 ? "var(--good)" : "var(--tx)" }}>{winPct}%</div>
            <div style={{ fontSize: 11, color: "var(--mu)", textTransform: "uppercase", fontFamily: "var(--font-display)", fontWeight: 700 }}>Win rate</div>
          </div>
        </div>

        {/* achievements */}
        <div className="section-title">Achievements · {earned}/{blist.length}</div>
        <div className="badge-grid">
          {bist(blist).map((b) => (
            <div key={b.id} className={`badge ${b.earned ? "earned" : ""}`} title={b.desc}>
              <span className="b-emoji">{b.emoji}</span>
              <span className="b-name">{b.name}</span>
            </div>
          ))}
        </div>

        {/* activity calendar */}
        <div className="section-title">Activity</div>
        <ActivityCalendar state={state} />

        {/* settings */}
        <div className="section-title">Settings</div>
        <div className="card">
          <div className="setting-row">
            <div className="lab">Coach voice<small>Spoken cues during workouts (on-device, free)</small></div>
            <button
              className={`toggle ${state.settings?.voice !== false ? "on" : ""}`}
              role="switch"
              aria-checked={state.settings?.voice !== false}
              onClick={() => { const nv = !(state.settings?.voice !== false); actions.setSetting("voice", nv); if (nv) speakTest(); }}
            >
              <span className="knob" />
            </button>
          </div>
          <div className="setting-row" style={{ flexWrap: "wrap", gap: 10 }}>
            <div className="lab">Appearance<small>Light, dark, or follow your device</small></div>
            <div className="row gap-2">
              {["system", "light", "dark"].map((t) => (
                <button
                  key={t}
                  className={`week-pill ${(state.settings?.theme || "system") === t ? "on" : ""}`}
                  onClick={() => { actions.setSetting("theme", t); haptic(); }}
                >
                  {t === "system" ? "Auto" : t === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* goals */}
        <div className="section-title">Goals</div>
        <div className="card">
          <div className="setting-row">
            <div className="lab">Start weight<small>Your GLP-1 journey starting point</small></div>
            <input type="number" value={state.profile.startWeight} onChange={(e) => actions.setProfile({ startWeight: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="setting-row">
            <div className="lab">Goal weight<small>Where you're headed</small></div>
            <input type="number" value={state.profile.goalWeight} onChange={(e) => actions.setProfile({ goalWeight: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>

        {mode !== "cloud" && (
          <div className="note-box">
            <b>Want your data on iPhone and iPad?</b> Turn on free Firebase sync (see SETUP in the project). Until then everything's saved safely on this device.
          </div>
        )}
        {mode === "cloud" && (
          <button className="btn btn-block" onClick={() => signOut()}>Sign Out</button>
        )}
        <p className="login-foot">US vs Them · 4-week football training · v2</p>
      </main>
    </div>
  );
}

// keep earned badges first
function bist(list) {
  return [...list].sort((a, b) => Number(b.earned) - Number(a.earned));
}

function ActivityCalendar({ state }) {
  // score per date over last 16 weeks
  const score = {};
  for (const d in state.activityLog || {}) score[d] = (score[d] || 0) + (state.activityLog[d].workouts || 0) * 2;
  for (const w of state.weights || []) score[w.date] = (score[w.date] || 0) + 1;
  for (const d in state.meals || {}) {
    const p = (state.meals[d].items || []).reduce((a, it) => a + (it.p || 0), 0);
    if (p >= 100) score[d] = (score[d] || 0) + 1;
  }

  const WEEKS = 16;
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay())); // to Saturday
  const cells = [];
  for (let i = WEEKS * 7 - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const key = todayKey(d);
    const sc = score[key] || 0;
    const level = d > today ? -1 : sc >= 3 ? 3 : sc === 2 ? 2 : sc === 1 ? 1 : 0;
    cells.push({ key, level });
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="cal-wrap">
        <div className="cal-grid">
          {cells.map((c) => (
            <div key={c.key} className={`cal-cell ${c.level > 0 ? "l" + c.level : ""}`} style={c.level === -1 ? { visibility: "hidden" } : undefined} />
          ))}
        </div>
      </div>
      <div className="cal-legend">
        Less
        <span className="cal-cell" /><span className="cal-cell l1" /><span className="cal-cell l2" /><span className="cal-cell l3" />
        More
      </div>
    </div>
  );
}
