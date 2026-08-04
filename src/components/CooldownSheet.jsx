import { useState } from "react";
import Sheet from "./Sheet.jsx";
import HowToVideo from "./HowToVideo.jsx";
import { totalSeconds } from "../lib/sequence.js";
import { haptic } from "../lib/fx.js";

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// The cool-down laid out pose by pose — how long each one lasts, what to do,
// and a how-to video — with the option to run the whole thing guided.
export default function CooldownSheet({
  open, onClose, steps = [], onStart,
  title = "Cool-down · yoga",
  subtitle = "for your lower back",
  noun = "poses",
  startLabel = "Start guided cool-down",
  untimed = false,
}) {
  const [openId, setOpenId] = useState(null);

  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="sheet-title">{title}</h3>
      <div className="sheet-sub">
        {steps.length} {noun}{untimed ? "" : ` · ${fmt(totalSeconds(steps))}`} · {subtitle}
      </div>

      <div className="pose-list">
        {steps.map((p, i) => (
          <div className={`pose-row ${openId === p.label ? "open" : ""}`} key={p.label}>
            <button
              className="pose-head"
              onClick={() => { haptic(); setOpenId(openId === p.label ? null : p.label); }}
            >
              <span className="pose-n">{i + 1}</span>
              <span className="pose-txt">
                <span className="pose-name">{p.label}</span>
                {!untimed && <span className="pose-time tnum">{fmt(p.seconds)}</span>}
              </span>
              <span className="pose-caret">{openId === p.label ? "▾" : "▸"}</span>
            </button>
            {openId === p.label && (
              <div className="pose-body">
                {p.cue && <p className="pose-cue">{p.cue}</p>}
                {(p.video || p.q) && (
                  <HowToVideo videoId={p.video} slug={p.label} query={p.q} title={`${p.label} how-to`} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 16 }}
        onClick={() => { haptic("success"); onClose(); onStart?.(); }}
      >
        ▶ {startLabel}{untimed ? "" : ` · ${fmt(totalSeconds(steps))}`}
      </button>
      <div className="ss-note">
        {untimed
          ? `Shows one ${noun.replace(/e?s$/, "")} at a time — move on when you're ready.`
          : `Runs one ${noun.replace(/e?s$/, "")} at a time with a timer and a countdown into the next.`}
      </div>
    </Sheet>
  );
}
