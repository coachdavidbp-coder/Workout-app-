import { useStore, todayKey, weekDates, currentDayId } from "../store.jsx";
import { DAY_NAMES, daysOf, trainingCount } from "../data/plans.js";
import { targetsFor } from "../data/plan.js";
import Ring from "../components/Ring.jsx";
import TrendChart from "../components/TrendChart.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import { weeklyActivity } from "../lib/progress.js";
import {
  totalXP, levelInfo, streak, dailyChallenge, quoteOfDay,
  recentActivity, continueDay, currentIcon, activeDates,
} from "../lib/gamify.js";
import { haptic } from "../lib/fx.js";

export default function HomeScreen({ go }) {
  const { state, actions } = useStore();
  const xp = totalXP(state);
  const lvl = levelInfo(xp);
  const s = streak(state);
  const icon = currentIcon(state);
  const week = state.week;
  const days = weekDates(new Date());
  const active = activeDates(state);
  const todayId = currentDayId();

  const T = targetsFor(state.profile);
  const weekDone = daysOf(state).filter((d) => d.type !== "rest" && state.done[`w${week}-${d.id}`]).length;
  let proteinDaysWk = 0;
  let calWk = 0;
  for (const d of days) {
    const m = state.meals[d.key];
    if (m && (m.items || []).reduce((a, it) => a + (it.p || 0), 0) >= T.protein) proteinDaysWk++;
    calWk += state.activityLog?.[d.key]?.calories || 0;
  }

  const chal = dailyChallenge(state);
  const cont = continueDay(state);
  const recent = recentActivity(state);

  const claim = () => {
    actions.claimReward(`${chal.todayKey}-${chal.id}`);
    haptic("success");
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
          <span className="mode-badge">{icon.emoji} Lv {lvl.level}</span>
        </div>
        <div className="h-title">
          <div className="kicker">{greet}, {state.profile?.name || "Coach"}</div>
          <h1>Us vs Them</h1>
        </div>
      </header>

      <main className="content">
        {/* level / xp hero */}
        <div className="home-hero glass">
          <div className="lvl-row">
            <div className="lvl-badge">{icon.emoji}</div>
            <div className="lvl-meta">
              <div className="lvl-sub">Level {lvl.level}</div>
              <div className="lvl-title">{lvl.title}</div>
            </div>
            <div className="lvl-xp">{xp}<span style={{ fontSize: 12, color: "var(--mu)" }}> XP</span></div>
          </div>
          <div className="xp-track"><div className="xp-fill" style={{ width: `${lvl.pct * 100}%` }} /></div>
          <div className="xp-cap"><span>{lvl.into} / {lvl.span} XP</span><span>{lvl.toNext} to Level {lvl.level + 1}</span></div>
        </div>

        {/* streak at risk */}
        {s.current >= 2 && !active.has(todayKey()) && (
          <button className="streak-risk" onClick={() => { haptic("warning"); go?.("train"); }}>
            <span className="sr-flame">🔥</span>
            <span>
              <span className="sr-k">Don't break your {s.current}-day streak</span>
              <span className="sr-s">You haven't logged anything today. Get a workout in.</span>
            </span>
            <span className="sr-arrow">›</span>
          </button>
        )}

        {/* continue */}
        {cont && (
          <button className="continue-card" onClick={() => { haptic(); go?.("train"); }}>
            <span className="cc-ico">▶</span>
            <span>
              <span className="cc-k">Continue where you left off</span>
              <span className="cc-t">{DAY_NAMES[cont.id]} · {cont.name}</span>
            </span>
            <span className="cc-arrow">›</span>
          </button>
        )}

        {/* rings */}
        <div className="section-title">This week</div>
        <div className="rings">
          <div className="ring-card">
            <div className="rlab">Workouts</div>
            <Ring value={weekDone} max={trainingCount(state)} center={`${weekDone}/${trainingCount(state)}`} />
          </div>
          <div className="ring-card">
            <div className="rlab">Protein</div>
            <Ring value={proteinDaysWk} max={7} color="var(--good)" center={`${proteinDaysWk}/7`} unit="days" />
          </div>
          <div className="ring-card">
            <div className="rlab">Calories</div>
            <Ring value={calWk} max={2500} color="var(--amber)" center={calWk} unit="kcal" />
          </div>
        </div>

        {/* streak */}
        <div className="streak-card glass">
          <span className="streak-flame">🔥</span>
          <div>
            <div className="streak-num">{s.current}</div>
            <div className="streak-lbl">day streak · best {s.best}</div>
          </div>
          <div className="streak-week">
            {days.map((d) => (
              <span key={d.key} className={`sd ${active.has(d.key) ? "on" : ""} ${d.key === todayKey() ? "today" : ""}`}>
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* daily challenge */}
        <div className="section-title">Daily challenge</div>
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

        {/* monthly trend */}
        {(() => {
          const wk = weeklyActivity(state, 8);
          const any = wk.some((w) => w.value > 0);
          return any ? (
            <>
              <div className="section-title">Last 8 weeks</div>
              <div className="chart-card">
                <div className="section-label" style={{ margin: "0 0 8px" }}>Workouts per week</div>
                <TrendChart points={wk} color="var(--ac)" valueFmt={(v) => v} />
              </div>
            </>
          ) : null;
        })()}

        {/* quote */}
        <div className="quote-card glass">“{quoteOfDay()}”</div>

        {/* recent activity */}
        {recent.length > 0 && (
          <>
            <div className="section-title">Recent activity</div>
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
    </div>
  );
}

function shortDate(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${d}`;
}
