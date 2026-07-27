import { useRef, useState } from "react";
import { useStore, todayKey } from "../store.jsx";
import CustomPlanBuilder from "./CustomPlanBuilder.jsx";
import GuidedBuilder from "./GuidedBuilder.jsx";
import { signOut } from "../lib/firebase.js";
import BrandLogo from "../components/BrandLogo.jsx";
import { haptic } from "../lib/fx.js";
import { speak, listVoices, setVoiceName, randomEncouragement } from "../lib/voice.js";
import { toast } from "../lib/toast.js";
import { PLAN_LIST, getPlan } from "../data/plans.js";
import { DIETS, defaultTargets } from "../data/plan.js";
import { spotifyEnabled, isSpotifyConnected, connectSpotify, disconnectSpotify } from "../lib/spotify.js";

function speakTest() {
  speak("Coach voice on. Let's get to work.");
}
function dietBlurb(id) {
  return (DIETS[id] || DIETS.balanced).blurb;
}
const VOICE_SAMPLES = [
  "Let's get to work — us versus them.",
  "Last one. Leave nothing on the floor!",
  "Halfway there. Keep pushing!",
  "Sprint! Go go go!",
  "That's a new personal best. Proud of that.",
];
import {
  totalXP, levelInfo, streak, badges, profileIcons, currentIcon,
  totals, activeDates,
} from "../lib/gamify.js";

export default function MoreScreen() {
  const { state, mode, user, actions } = useStore();
  const fileRef = useRef(null);
  const [building, setBuilding] = useState(false);
  const [guiding, setGuiding] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [spTick, setSpTick] = useState(0);
  const spConnected = isSpotifyConnected();

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `us-vs-them-backup-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      haptic();
      toast({ emoji: "💾", title: "Backup saved", sub: "Keep it somewhere safe" });
    } catch (e) {
      toast({ emoji: "⚠️", title: "Backup failed", sub: "Try again" });
    }
  };

  const importDeviceData = () => {
    const c = actions.mergeLocalData();
    haptic("success");
    const total = c.weighIns + c.workouts + c.meals;
    if (total === 0) {
      toast({ emoji: "🔍", title: "Nothing new to import", sub: "No un-synced data found on this device" });
    } else {
      const parts = [];
      if (c.weighIns) parts.push(`${c.weighIns} weigh-in${c.weighIns > 1 ? "s" : ""}`);
      if (c.workouts) parts.push(`${c.workouts} workout${c.workouts > 1 ? "s" : ""}`);
      if (c.meals) parts.push(`${c.meals} day${c.meals > 1 ? "s" : ""} of meals`);
      toast({ emoji: "✅", title: "Imported to your account", sub: parts.join(" · "), tone: "good" });
    }
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object") throw new Error("bad file");
        actions.replaceState(data);
        haptic("success");
        toast({ emoji: "✅", title: "Backup restored", sub: "Your data is back", tone: "good" });
      } catch (err) {
        toast({ emoji: "⚠️", title: "Couldn't read that file", sub: "Use a US vs Them backup" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
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
          {state.settings?.voice !== false && (
            <div className="setting-row" style={{ flexWrap: "wrap", gap: 10 }}>
              <div className="lab" style={{ flexBasis: "100%" }}>Coach's voice<small>Pick a voice, then preview it</small></div>
              <select
                className="login-input"
                style={{ flex: 1, minWidth: 0 }}
                value={state.settings?.voiceName || ""}
                onChange={(e) => { const n = e.target.value || null; actions.setSetting("voiceName", n); setVoiceName(n); }}
              >
                <option value="">Auto (device default)</option>
                {listVoices().map((v) => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
              <button
                className="btn"
                onClick={() => { setVoiceName(state.settings?.voiceName || null); speak(VOICE_SAMPLES[Math.floor(Math.random() * VOICE_SAMPLES.length)]); }}
              >
                ▶ Preview
              </button>
            </div>
          )}
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

        {/* music */}
        {spotifyEnabled && (
          <>
            <div className="section-title">Music</div>
            <div className="card">
              <div className="setting-row">
                <div className="lab">
                  Spotify
                  <small>{spConnected ? "Connected — see what's playing during workouts" : "Show what you're listening to, right in your workout"}</small>
                </div>
                {spConnected ? (
                  <button className="btn" onClick={() => { disconnectSpotify(); setSpTick((n) => n + 1); haptic(); }}>Disconnect</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => { haptic(); connectSpotify(); }}>Connect</button>
                )}
              </div>
            </div>
          </>
        )}

        {/* program */}
        <div className="section-title">Program</div>
        <div className="stack gap-2">
          {PLAN_LIST.map((pl) => (
            <button
              key={pl.id}
              className={`plan-card ${state.profile.planId === pl.id ? "on" : ""}`}
              onClick={() => { actions.setProfile({ planId: pl.id }); haptic(); toast({ emoji: pl.accent, title: "Program switched", sub: pl.name, tone: "good" }); }}
            >
              <div className="plan-top">
                <span className="plan-emoji">{pl.accent}</span>
                <span className="plan-name">{pl.name}</span>
                {state.profile.planId === pl.id && <span className="plan-check">✓</span>}
              </div>
              <div className="plan-tag">{pl.tagline}</div>
              <div className="plan-chips">
                {pl.equipment.map((eq) => <span key={eq} className="plan-chip">{eq}</span>)}
              </div>
            </button>
          ))}
          <button className={`plan-card ${state.profile.planId === "custom" ? "on" : ""}`} onClick={() => setChoosing(true)}>
            <div className="plan-top">
              <span className="plan-emoji">⚙️</span>
              <span className="plan-name">Build your own</span>
              {state.profile.planId === "custom" && <span className="plan-check">✓</span>}
            </div>
            <div className="plan-tag">Create a program you actually like</div>
            <div className="plan-focus">Answer a few questions &amp; we build it — or set every day yourself →</div>
          </button>
        </div>

        {/* nutrition style */}
        <div className="section-title">Eating style</div>
        <div className="card" style={{ padding: 14 }}>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {Object.values(DIETS).map((d) => (
              <button
                key={d.id}
                className={`week-pill ${(state.profile.diet || "balanced") === d.id ? "on" : ""}`}
                onClick={() => {
                  const t = defaultTargets({ weight: state.profile.startWeight || 180, goal: state.profile.goal, sex: state.profile.sex, diet: d.id });
                  actions.setProfile({ diet: d.id, proteinGoal: t.protein, calorieGoal: t.calories, waterGoal: t.waterOz });
                  haptic();
                  toast({ emoji: "🥗", title: "Eating style updated", sub: d.name, tone: "good" });
                }}
              >
                {d.name}
              </button>
            ))}
          </div>
          <p className="summary-note" style={{ marginTop: 10 }}>{dietBlurb(state.profile.diet)} · Meal ideas &amp; protein target update to match.</p>
        </div>

        {/* goals */}
        <div className="section-title">Goals</div>
        <div className="card">
          <div className="setting-row">
            <div className="lab">Start weight<small>Where your journey started</small></div>
            <input type="number" value={state.profile.startWeight} onChange={(e) => actions.setProfile({ startWeight: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="setting-row">
            <div className="lab">Goal weight<small>Where you're headed</small></div>
            <input type="number" value={state.profile.goalWeight} onChange={(e) => actions.setProfile({ goalWeight: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>

        {/* backup */}
        <div className="section-title">Your data</div>
        <div className="card" style={{ padding: 14 }}>
          <div className="backup-row">
            <button className="btn" onClick={exportData}>⬇ Export backup</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>⬆ Restore</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json" onChange={importData} style={{ display: "none" }} />
          {mode === "cloud" && (
            <>
              <button className="btn btn-block" style={{ marginTop: 10 }} onClick={importDeviceData}>
                ↺ Import this device’s saved data
              </button>
              <p className="summary-note" style={{ marginTop: 8 }}>
                Recovers weigh-ins &amp; workouts you logged on <b>this device</b> before signing in.
                (It can’t reach data saved on a different phone or computer.)
              </p>
            </>
          )}
          <p className="summary-note" style={{ marginTop: 10 }}>
            Export a backup file to keep it safe or move it to another device.
          </p>
        </div>

        {mode !== "cloud" && (
          <div className="note-box">
            <b>Want your data on iPhone and iPad?</b> Turn on free Firebase sync (see SETUP in the project). Until then everything's saved safely on this device.
          </div>
        )}
        {mode === "cloud" && (
          <button className="btn btn-block" onClick={() => signOut()}>Sign Out</button>
        )}
        <p className="login-foot">US vs Them · train hard · v2</p>
      </main>

      {choosing && (
        <div className="pick-scrim" onClick={() => setChoosing(false)}>
          <div className="pick-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="pick-grip" />
            <div className="pick-title">Build your own plan</div>
            <p className="pick-sub">Pick how you want to create it.</p>
            <button className="choice-card" onClick={() => { setChoosing(false); setGuiding(true); }}>
              <span className="choice-emoji">⚡</span>
              <span className="choice-text">
                <span className="choice-label">Guided — answer a few questions</span>
                <span className="choice-sub">Tell us your gear, days &amp; goals and we build the whole plan. Best if you're not sure where to start.</span>
              </span>
            </button>
            <button className="choice-card" onClick={() => { setChoosing(false); setBuilding(true); }}>
              <span className="choice-emoji">✏️</span>
              <span className="choice-text">
                <span className="choice-label">Manual — set every day yourself</span>
                <span className="choice-sub">Full control over each day's exercises, sets &amp; cardio intervals.</span>
              </span>
            </button>
            <button className="btn btn-block" style={{ marginTop: 6 }} onClick={() => setChoosing(false)}>Cancel</button>
          </div>
        </div>
      )}
      {guiding && <GuidedBuilder onClose={() => setGuiding(false)} />}
      {building && <CustomPlanBuilder onClose={() => setBuilding(false)} />}
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
