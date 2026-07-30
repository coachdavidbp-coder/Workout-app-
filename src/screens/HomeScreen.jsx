import { useState, useEffect } from "react";
import { useStore, todayKey, weekDates, currentDayId } from "../store.jsx";
import { DAY_NAMES, daysOf, dayById, trainingCount } from "../data/plans.js";
import BrandLogo from "../components/BrandLogo.jsx";
import DayRecapSheet from "../components/DayRecapSheet.jsx";
import SettingsSheet from "../components/SettingsSheet.jsx";
import { TripleRing } from "../components/ActivityRings.jsx";
import { activityRings } from "../lib/activity.js";
import {
  totalXP, levelInfo, streak, dailyChallenge, coachQuoteOfDay,
  recentActivity, continueDay, currentIcon, activeDates,
} from "../lib/gamify.js";
import { haptic } from "../lib/fx.js";

export default function HomeScreen({ go }) {
  const { state, actions } = useStore();
  const [recapOpen, setRecapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto-pop the recap once per day, the first time you open the app after 8pm.
  useEffect(() => {
    if (new Date().getHours() >= 20 && state.game?.lastRecap !== todayKey()) {
      setRecapOpen(true);
      actions.markRecapSeen(todayKey());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openRecap = () => { actions.markRecapSeen(todayKey()); setRecapOpen(true); };

  const xp = totalXP(state);
  const lvl = levelInfo(xp);
  const s = streak(state);
  const icon = currentIcon(state);
  const week = state.week;
  const days = weekDates(new Date());
  const active = activeDates(state);
  const todayId = currentDayId();
  const day = dayById(state, todayId) || { type: "rest", name: "Rest Day" };

  const doneKey = `w${week}-${todayId}`;
  const doneToday = !!state.done[doneKey];
  const missedToday = !!state.missed?.[todayKey()];
  const isRest = day.type === "rest";

  const ring = activityRings(state, "day");
  const weekDone = daysOf(state).filter((d) => d.type !== "rest" && state.done[`w${week}-${d.id}`]).length;
  const weekTotal = trainingCount(state);

  const chal = dailyChallenge(state);
  const cont = continueDay(state);
  const recent = recentActivity(state).slice(0, 4);
  const cq = coachQuoteOfDay();

  const claim = () => {
    actions.claimReward(`${chal.todayKey}-${chal.id}`);
    haptic("success");
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLine = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const status = isRest
    ? { label: "Rest day", tone: "rest" }
    : doneToday
    ? { label: "Complete", tone: "done" }
    : missedToday
    ? { label: "Missed", tone: "miss" }
    : { label: "Not logged", tone: "open" };

  const cta = isRest
    ? { text: "Recovery day — see the plan", go: "train" }
    : doneToday
    ? { text: "✓ Logged — review workout", go: "train" }
    : cont
    ? { text: "▶ Continue workout", go: "train" }
    : { text: "▶ Start workout", go: "train" };

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
          <span className="mode-badge">{icon.emoji} Lv {lvl.level}</span>
          <button className="gear-btn" onClick={() => { haptic(); setSettingsOpen(true); }} aria-label="Settings">
            <img src="/icons/nav-settings.png" alt="" />
          </button>
        </div>
        <div className="h-title">
          <div className="kicker">{greet}, {state.profile?.name || "Coach"}</div>
        </div>
      </header>

      <main className="content">
        {/* ---------- today ---------- */}
        <section className="today-card">
          <div className="tc-top">
            <span className="tc-kicker">Today · {dateLine}</span>
            <span className={`tc-status ${status.tone}`}>{status.label}</span>
          </div>
          <h2 className="tc-session">{day.name}</h2>

          <div className="tc-body">
            <TripleRing rings={ring.rings} allClosed={ring.allClosed} className="sm" />
            <div className="tc-metrics">
              {ring.rings.map((r) => (
                <div className="tcm" key={r.id}>
                  <span className="tcm-dot" style={{ background: r.color }} />
                  <span className="tcm-lab">{r.label}</span>
                  <span className="tcm-val" style={{ color: r.color }}>
                    {r.value.toLocaleString()}<em>/{r.goal}{r.unit ? ` ${r.unit.toLowerCase()}` : ""}</em>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="tc-week">
            {days.map((d) => (
              <span
                key={d.key}
                className={`tcw ${active.has(d.key) ? "on" : ""} ${d.key === todayKey() ? "today" : ""} ${state.missed?.[d.key] && !active.has(d.key) ? "miss" : ""}`}
              >
                {d.label}
              </span>
            ))}
          </div>

          <button className="tc-cta" onClick={() => { haptic(); go?.(cta.go); }}>{cta.text}</button>
        </section>

        {/* ---------- quick stats ---------- */}
        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="st-k">{s.current}</div>
            <div className="st-l">Day streak</div>
            <div className="st-s">best {s.best}</div>
          </div>
          <div className="stat-tile">
            <div className="st-k">{weekDone}<span className="st-of">/{weekTotal}</span></div>
            <div className="st-l">This week</div>
            <div className="st-s">Week {week} · workouts</div>
          </div>
          <div className="stat-tile">
            <div className="st-k">{lvl.level}</div>
            <div className="st-l">{lvl.title}</div>
            <div className="st-bar"><span style={{ width: `${lvl.pct * 100}%` }} /></div>
          </div>
        </div>

        {/* streak at risk */}
        {s.current >= 2 && !active.has(todayKey()) && (
          <button className="streak-risk" onClick={() => { haptic("warning"); go?.("train"); }}>
            <span className="sr-flame">🔥</span>
            <span>
              <span className="sr-k">Don't break your {s.current}-day streak</span>
              <span className="sr-s">Nothing logged today yet. Get a session in.</span>
            </span>
            <span className="sr-arrow">›</span>
          </button>
        )}

        {/* ---------- daily challenge ---------- */}
        <div className="challenge-card glass">
          <div className="ch-top">
            <span className="ch-k">Today's mission</span>
            <span className="ch-xp">+{chal.xp} XP</span>
          </div>
          <div className="ch-text">{chal.text}</div>
          <div className="ch-status">
            <span className={`ch-check ${chal.done ? "on" : ""}`}>{chal.done ? "✓" : ""}</span>
            {chal.done ? (
              <button className={`ch-claim ${chal.claimed ? "claimed" : ""}`} onClick={chal.claimed ? undefined : claim}>
                {chal.claimed ? "✓ Claimed" : "Claim reward"}
              </button>
            ) : (
              <span>Not done yet — go get it.</span>
            )}
          </div>
        </div>

        {/* ---------- coach ---------- */}
        <blockquote className="home-quote">
          <p>{cq.text}</p>
          <cite>— {cq.coach} · {cq.team}</cite>
        </blockquote>

        {/* ---------- recap ---------- */}
        <button className={`recap-launch ${hour >= 18 ? "evening" : ""}`} onClick={() => { haptic(); openRecap(); }}>
          <span className="rl-ico">🌙</span>
          <span className="rl-txt">
            <span className="rl-k">{hour >= 18 ? "How did today go?" : "End-of-day recap"}</span>
            <span className="rl-s">Training, food, movement & streak</span>
          </span>
          <span className="rl-arrow">›</span>
        </button>

        {/* ---------- recent ---------- */}
        {recent.length > 0 && (
          <>
            <div className="section-title">Recent</div>
            <div className="recent-list card">
              {recent.map((e, i) => (
                <div className="recent-row" key={i}>
                  <span className="re-emoji">{e.emoji}</span>
                  <span className="re-label">{e.label}</span>
                  <span className="re-date">{shortDate(e.date)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <DayRecapSheet open={recapOpen} onClose={() => setRecapOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function shortDate(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${d}`;
}
