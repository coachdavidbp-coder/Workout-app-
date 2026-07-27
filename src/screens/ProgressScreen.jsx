import { useMemo, useState } from "react";
import { useStore, todayKey } from "../store.jsx";
import WeightChart from "../components/WeightChart.jsx";
import TrendChart from "../components/TrendChart.jsx";
import Sheet from "../components/Sheet.jsx";
import NumField from "../components/NumField.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import { strengthSummary, runningSummary, personalBests, fmtPace } from "../lib/progress.js";

const SEGMENTS = [
  { id: "weight", label: "Weight" },
  { id: "strength", label: "Strength" },
  { id: "running", label: "Running" },
];

export default function ProgressScreen() {
  const [seg, setSeg] = useState("weight");

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
          <span className="mode-badge">Progress</span>
        </div>
        <div className="h-title">
          <div className="kicker">Are you getting better?</div>
          <h1>Progress</h1>
        </div>
        <div className="week-tabs" style={{ marginTop: 14 }}>
          {SEGMENTS.map((s) => (
            <button key={s.id} className={`week-pill ${seg === s.id ? "on" : ""}`} onClick={() => setSeg(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <main className="content">
        <PersonalBests />
        {seg === "weight" && <WeightBody />}
        {seg === "strength" && <StrengthBody />}
        {seg === "running" && <RunningBody />}
      </main>
    </div>
  );
}

/* ------------------ PERSONAL BESTS ------------------ */
function PersonalBests() {
  const { state } = useStore();
  const pb = personalBests(state);
  const items = [
    { k: pb.heaviest ? `${pb.heaviest.last} lb` : "—", l: pb.heaviest ? shortName(pb.heaviest.name) : "Heaviest lift", emoji: "🏋️" },
    { k: pb.topSpeed ? `${pb.topSpeed.toFixed(1)}` : "—", l: "Top mph", emoji: "💨" },
    { k: pb.bestPace ? fmtPace(pb.bestPace).replace("/mi", "") : "—", l: "Best pace", emoji: "⏱️" },
    { k: pb.longestRun ? `${pb.longestRun}` : "—", l: "Longest run (mi)", emoji: "🏃" },
  ];
  return (
    <div>
      <div className="section-title">Personal bests</div>
      <div className="pb-grid">
        {items.map((it, i) => (
          <div className="pb-card glass" key={i}>
            <span className="pb-emoji">{it.emoji}</span>
            <div className="pb-k">{it.k}</div>
            <div className="pb-l">{it.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function shortName(n) {
  return n.replace(/^DB /, "").replace(/ \(.*\)$/, "");
}

/* ------------------ WEIGHT ------------------ */
const RANGES = [
  { id: "1m", label: "1M", days: 31 },
  { id: "3m", label: "3M", days: 93 },
  { id: "6m", label: "6M", days: 186 },
  { id: "all", label: "All", days: Infinity },
];

function WeightBody() {
  const { state, actions } = useStore();
  const [range, setRange] = useState("3m");
  const [logging, setLogging] = useState(false);

  const sorted = useMemo(() => [...state.weights].sort((a, b) => a.date.localeCompare(b.date)), [state.weights]);
  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.id === range).days;
    if (days === Infinity) return sorted;
    const cutoff = Date.now() - days * 86400000;
    return sorted.filter((w) => new Date(w.date).getTime() >= cutoff);
  }, [sorted, range]);

  const latest = sorted[sorted.length - 1];
  const start = state.profile.startWeight;
  const current = latest?.weight ?? start;
  const totalDelta = current - start;
  const lastBf = [...sorted].reverse().find((w) => w.bodyFat != null)?.bodyFat;
  const first = filtered[0];
  const rangeDelta = filtered.length > 1 ? current - first.weight : 0;

  return (
    <>
      <div className="weight-hero">
        <span className="big tnum">{current.toFixed(1)}</span>
        <span className="u">lb</span>
        <span className={`delta ${totalDelta <= 0 ? "down" : "up"}`}>
          {totalDelta <= 0 ? "▼" : "▲"} {Math.abs(totalDelta).toFixed(1)} since start
        </span>
      </div>
      <div className="mini-stats">
        <div className="mini-stat">
          <div className="k" style={{ color: rangeDelta <= 0 ? "var(--good)" : "var(--live)" }}>
            {rangeDelta <= 0 ? "" : "+"}{rangeDelta.toFixed(1)}
          </div>
          <div className="l">This range</div>
        </div>
        <div className="mini-stat">
          <div className="k">{lastBf != null ? `${lastBf}%` : "—"}</div>
          <div className="l">Body fat</div>
        </div>
        <div className="mini-stat">
          <div className="k" style={{ color: "var(--good)" }}>{Math.max(0, start - current).toFixed(0)}</div>
          <div className="l">lb lost · {Math.max(0, current - state.profile.goalWeight).toFixed(0)} to goal</div>
        </div>
      </div>
      <div className="chart-card">
        <WeightChart data={filtered} />
        <div className="range-row">
          {RANGES.map((r) => (
            <button key={r.id} className={range === r.id ? "on" : ""} onClick={() => setRange(r.id)}>{r.label}</button>
          ))}
        </div>
      </div>
      <button className="btn btn-primary btn-block" onClick={() => setLogging(true)}>Log Today's Weigh-In</button>
      <div>
        <div className="section-label">History</div>
        <div className="log-list">
          {[...sorted].reverse().map((w) => (
            <div className="log-row" key={w.date}>
              <div className="ld">
                <div className="d1">{fmtLong(w.date)}</div>
                <div className="d2">{w.bodyFat != null ? `Body fat ${w.bodyFat}%` : "—"}</div>
              </div>
              <div className="wv tnum">{w.weight.toFixed(1)}</div>
              <button className="del" aria-label="Remove" onClick={() => actions.removeWeighIn(w.date)}>×</button>
            </div>
          ))}
        </div>
      </div>
      <WeighInSheet open={logging} onClose={() => setLogging(false)} />
    </>
  );
}

/* ------------------ STRENGTH ------------------ */
function StrengthBody() {
  const { state } = useStore();
  const s = useMemo(() => strengthSummary(state), [state]);

  if (!s.hasData)
    return (
      <div className="card empty-hint">
        Log the weight you use on your lift days (tap a lift → enter weight & reps).
        Your strength trend and per-lift progress show up here.
      </div>
    );

  const points = s.weekly.map((w) => ({ label: `W${w.week}`, value: w.volume > 0 ? w.volume : null }));

  return (
    <>
      <div className="mini-stats">
        <div className="mini-stat">
          <div className="k" style={{ color: s.volumeDelta >= 0 ? "var(--good)" : "var(--live)" }}>
            {s.volumeDelta >= 0 ? "▲" : "▼"}
          </div>
          <div className="l">{s.volumeDelta >= 0 ? "Volume up" : "Volume down"}</div>
        </div>
        <div className="mini-stat">
          <div className="k" style={{ color: "var(--good)" }}>{s.improved}</div>
          <div className="l">Lifts improved</div>
        </div>
        <div className="mini-stat">
          <div className="k">{s.logged}</div>
          <div className="l">Lifts logged</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="section-label" style={{ margin: "0 0 8px" }}>Total volume by week (lb × reps)</div>
        <TrendChart points={points} color="var(--ac)" />
      </div>

      <div>
        <div className="section-label">Lift by lift</div>
        <div className="log-list">
          {s.lifts.map((l) => (
            <div className="log-row" key={l.name}>
              <div className="ld">
                <div className="d1">{l.name}</div>
                <div className="d2">{l.weeksLogged > 1 ? `${l.first} → ${l.last} lb` : `${l.last} lb logged`}</div>
              </div>
              <div className={`prog-tag ${l.delta > 0 ? "up" : l.delta < 0 ? "down" : "flat"}`}>
                {l.delta > 0 ? `+${l.delta}` : l.delta < 0 ? l.delta : "="}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------ RUNNING ------------------ */
function RunningBody() {
  const { state } = useStore();
  const s = useMemo(() => runningSummary(state), [state]);

  if (!s.hasData)
    return (
      <div className="card empty-hint">
        Run your Speed or Tempo days, then hit <b>Mark Workout Complete</b> — your
        top speed, pace and mile times build a trend here so you can see yourself
        getting faster.
      </div>
    );

  const speedPts = s.runs.map((r) => ({ label: shortDate(r.date), value: r.topMph ? parseFloat(r.topMph) : null }));

  return (
    <>
      <div className="mini-stats">
        <div className="mini-stat">
          <div className="k" style={{ color: "var(--ac-hi)" }}>{s.topSpeed ? s.topSpeed.toFixed(1) : "—"}</div>
          <div className="l">Top speed mph</div>
        </div>
        <div className="mini-stat">
          <div className="k">{s.bestPace ? fmtPace(s.bestPace).replace("/mi", "") : "—"}</div>
          <div className="l">Best pace /mi</div>
        </div>
        <div className="mini-stat">
          <div className="k" style={{ color: "var(--good)" }}>{s.totalDistance.toFixed(1)}</div>
          <div className="l">Total miles</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="section-label" style={{ margin: "0 0 8px" }}>Top speed over time (mph)</div>
        <TrendChart points={speedPts} color="var(--ac)" valueFmt={(v) => v} />
      </div>

      <div>
        <div className="section-label">Run history</div>
        <div className="log-list">
          {[...s.runs].reverse().map((r) => (
            <div className="log-row" key={`${r.date}-${r.dayId}`}>
              <div className="ld">
                <div className="d1">{fmtLong(r.date)}</div>
                <div className="d2">
                  {r.distanceMi ? `${r.distanceMi} mi` : "—"}
                  {r.pace ? ` · ${fmtPace(r.pace)}` : ""}
                </div>
              </div>
              <div className="wv tnum">{r.topMph ? `${parseFloat(r.topMph).toFixed(1)}` : "—"}<span style={{ fontSize: 11, color: "var(--mu)" }}> mph</span></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------ shared ------------------ */
function WeighInSheet({ open, onClose }) {
  const { actions } = useStore();
  const [date, setDate] = useState(todayKey());
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const save = () => {
    const w = parseFloat(weight);
    if (isNaN(w)) return;
    actions.addWeighIn({ date, weight: w, bodyFat: bf === "" ? null : parseFloat(bf) });
    setWeight(""); setBf(""); onClose();
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="sheet-title">Log Weigh-In</h3>
      <div className="sheet-sub">Enter your weight and (optional) body fat</div>
      <div className="section-label" style={{ marginTop: 16 }}>Date</div>
      <input className="login-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="ex-log" style={{ marginTop: 16 }}>
        <NumField label="Weight (lb)" value={weight} accent placeholder="290.0" onCommit={setWeight} />
        <NumField label="Body fat %" value={bf} placeholder="opt." onCommit={setBf} />
      </div>
      <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={save}>Save Weigh-In</button>
    </Sheet>
  );
}

function fmtLong(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function shortDate(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${d}`;
}
