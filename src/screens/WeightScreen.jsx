import { useMemo, useState } from "react";
import { useStore, todayKey } from "../store.jsx";
import WeightChart from "../components/WeightChart.jsx";
import Sheet from "../components/Sheet.jsx";
import NumField from "../components/NumField.jsx";

const RANGES = [
  { id: "1m", label: "1M", days: 31 },
  { id: "3m", label: "3M", days: 93 },
  { id: "6m", label: "6M", days: 186 },
  { id: "all", label: "All", days: Infinity },
];

export default function WeightScreen() {
  const { state, actions } = useStore();
  const [range, setRange] = useState("3m");
  const [logging, setLogging] = useState(false);

  const sorted = useMemo(
    () => [...state.weights].sort((a, b) => a.date.localeCompare(b.date)),
    [state.weights]
  );

  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.id === range).days;
    if (days === Infinity) return sorted;
    const cutoff = Date.now() - days * 86400000;
    return sorted.filter((w) => new Date(w.date).getTime() >= cutoff);
  }, [sorted, range]);

  const latest = sorted[sorted.length - 1];
  const start = state.profile.startWeight;
  const current = latest?.weight ?? start;
  const totalDelta = current - start; // negative = lost
  const lastBf = [...sorted].reverse().find((w) => w.bodyFat != null)?.bodyFat;

  // week-over-week change within filtered set
  const first = filtered[0];
  const rangeDelta = filtered.length > 1 ? current - first.weight : 0;

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <span className="eyebrow">
            <span className="dot" /> Progress
          </span>
          <span className="mode-badge">GLP-1 journey</span>
        </div>
        <div className="h-title">
          <div className="kicker">Started at {start} lb</div>
          <h1>Weight Trend</h1>
        </div>
      </header>

      <main className="content">
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
              {rangeDelta <= 0 ? "" : "+"}
              {rangeDelta.toFixed(1)}
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
              <button key={r.id} className={range === r.id ? "on" : ""} onClick={() => setRange(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={() => setLogging(true)}>
          Log Today's Weigh-In
        </button>

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
                <button className="del" aria-label="Remove" onClick={() => actions.removeWeighIn(w.date)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <WeighInSheet open={logging} onClose={() => setLogging(false)} />
    </div>
  );
}

function WeighInSheet({ open, onClose }) {
  const { actions } = useStore();
  const [date, setDate] = useState(todayKey());
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");

  const save = () => {
    const w = parseFloat(weight);
    if (isNaN(w)) return;
    actions.addWeighIn({
      date,
      weight: w,
      bodyFat: bf === "" ? null : parseFloat(bf),
    });
    setWeight("");
    setBf("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="sheet-title">Log Weigh-In</h3>
      <div className="sheet-sub">Enter your weight and (optional) body fat</div>

      <div className="section-label" style={{ marginTop: 16 }}>
        Date
      </div>
      <input
        className="login-input"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="ex-log" style={{ marginTop: 16 }}>
        <NumField label="Weight (lb)" value={weight} accent placeholder="290.0" onCommit={setWeight} />
        <NumField label="Body fat %" value={bf} placeholder="opt." onCommit={setBf} />
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={save}>
        Save Weigh-In
      </button>
    </Sheet>
  );
}

function fmtLong(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
