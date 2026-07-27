import { useEffect, useRef, useState } from "react";
import Sheet from "./Sheet.jsx";
import NumField from "./NumField.jsx";
import { useStore } from "../store.jsx";
import { haptic } from "../lib/fx.js";

// How-to video + set logging for a single exercise.
export default function ExerciseSheet({ open, onClose, week, dayId, exercise }) {
  const { state, actions } = useStore();
  if (!exercise) return null;

  const key = `w${week}-${dayId}`;
  const log = state.liftLogs[key]?.exercises?.[exercise.name] || {};
  const target = exercise.sets[week - 1];
  const reps = log.reps || [];

  const setRep = (i, v) => {
    const next = [...reps];
    next[i] = v;
    actions.setExerciseLog(week, dayId, exercise.name, { reps: next });
  };

  // how many rep fields to show — infer set count from "4×12"
  const setCount = parseInt(String(target).split("×")[0], 10) || 3;

  const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.q || exercise.name
  )}`;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="spread" style={{ alignItems: "flex-start" }}>
        <div>
          <h3 className="sheet-title">{exercise.name}</h3>
          <div className="sheet-sub">Target · {target}</div>
        </div>
        <span className="set-pill">{target}</span>
      </div>

      {exercise.video ? (
        <>
          <div className="video-wrap">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${exercise.video}?rel=0&modestbranding=1`}
              title={`${exercise.name} how-to`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <a className="video-fallback" href={ytSearch} target="_blank" rel="noopener noreferrer">
            Video not playing? Search YouTube instead ↗
          </a>
        </>
      ) : (
        <a className="video-wrap video-search" href={ytSearch} target="_blank" rel="noopener noreferrer">
          <div className="video-empty">
            <span className="yt-btn">
              <span className="tri" /> Watch how-to on YouTube
            </span>
            <span className="vq">Search: “{exercise.q}”</span>
          </div>
        </a>
      )}

      {exercise.cue && <p className="cue-box">{exercise.cue}</p>}

      <div className="section-label" style={{ marginTop: 18 }}>
        Log your sets
      </div>
      <div className="ex-log" style={{ flexWrap: "wrap" }}>
        <NumField
          label="Weight"
          value={log.weight}
          accent
          placeholder="55"
          onCommit={(v) => actions.setExerciseLog(week, dayId, exercise.name, { weight: v })}
        />
        {Array.from({ length: Math.min(setCount, 5) }).map((_, i) => (
          <NumField
            key={i}
            label={`Set ${i + 1}`}
            value={reps[i]}
            placeholder="reps"
            onCommit={(v) => setRep(i, v)}
          />
        ))}
      </div>

      <div className="ex-log">
        <NumField
          label="Start wt"
          value={log.startWt}
          placeholder="—"
          onCommit={(v) => actions.setExerciseLog(week, dayId, exercise.name, { startWt: v })}
        />
        <NumField
          label="End wt"
          value={log.endWt}
          placeholder="—"
          onCommit={(v) => actions.setExerciseLog(week, dayId, exercise.name, { endWt: v })}
        />
      </div>

      <div className="section-label" style={{ marginTop: 18 }}>Rest timer</div>
      <RestTimer />

      <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={onClose}>
        Done
      </button>
    </Sheet>
  );
}

// Between-set rest countdown with presets. Beeps + buzzes at zero.
function RestTimer() {
  const [preset, setPreset] = useState(90);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const tick = useRef(null);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick.current);
          setRunning(false);
          haptic("success");
          try {
            const AC = window.AudioContext || window.webkitAudioContext;
            const ctx = new AC();
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.frequency.value = 660; o.connect(g).connect(ctx.destination);
            g.gain.setValueAtTime(0.25, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
            o.start(); o.stop(ctx.currentTime + 0.4);
          } catch (e) { /* ignore */ }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  const startRest = (sec) => { setPreset(sec); setRemaining(sec); setRunning(true); haptic(); };

  return (
    <div className="rest-timer">
      {[60, 90, 120].map((sec) => (
        <button
          key={sec}
          className={`rt-preset ${running && preset === sec ? "on" : ""}`}
          onClick={() => startRest(sec)}
        >
          {sec}s
        </button>
      ))}
      <span className="rt-clock">
        {running || remaining ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : "–:––"}
      </span>
    </div>
  );
}
