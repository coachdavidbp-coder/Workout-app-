import { useState } from "react";
import Sheet from "./Sheet.jsx";
import { useStore } from "../store.jsx";
import { weeklyReport } from "../lib/weekly.js";
import { haptic } from "../lib/fx.js";

const fmtRange = (a, b) =>
  `${a.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${b.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

// Week in review: every headline number against last week, so you can see
// whether the trend is going the right way.
export default function WeeklyReportSheet({ open, onClose }) {
  const { state } = useStore();
  const [offset, setOffset] = useState(0);
  const r = weeklyReport(state, offset);

  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="sheet-title">Week in review</h3>
      <div className="sheet-sub">{fmtRange(r.start, r.end)}{offset === 0 ? " · this week" : ""}</div>

      <p className="wr-headline">{r.headline}</p>

      <div className="wr-rows">
        {r.rows.map((row) => (
          <div className="wr-row" key={row.id}>
            <span className="wr-lab">{row.label}</span>
            <span className="wr-val tnum">
              {row.value.toLocaleString()}{row.unit ? <em> {row.unit}</em> : null}
            </span>
            <span className={`wr-chg ${row.change > 0 ? "up" : row.change < 0 ? "down" : "flat"}`}>
              {row.change === null ? "new" : row.change === 0 ? "—" : `${row.change > 0 ? "▲" : "▼"} ${Math.abs(row.change)}%`}
            </span>
          </div>
        ))}
      </div>

      {r.cur.missed > 0 && (
        <p className="wr-note">You marked {r.cur.missed} session{r.cur.missed === 1 ? "" : "s"} missed this week — that's logged honestly, which is what makes the trend mean anything.</p>
      )}
      {r.cur.weightDelta != null && (
        <p className="wr-note">
          Weight {r.cur.weightDelta <= 0 ? "down" : "up"} {Math.abs(r.cur.weightDelta).toFixed(1)} lb across {r.cur.weighIns} weigh-ins.
        </p>
      )}

      <div className="wr-nav">
        <button className="btn" onClick={() => { haptic(); setOffset((o) => o - 1); }}>‹ Earlier</button>
        <button className="btn" disabled={offset >= 0} onClick={() => { haptic(); setOffset((o) => Math.min(0, o + 1)); }}>Later ›</button>
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
    </Sheet>
  );
}
