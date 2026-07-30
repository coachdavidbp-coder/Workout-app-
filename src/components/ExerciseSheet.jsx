import { useState } from "react";
import Sheet from "./Sheet.jsx";
import NumField from "./NumField.jsx";
import CountdownTimer from "./CountdownTimer.jsx";
import { useStore } from "../store.jsx";
import { setsFor } from "../data/plans.js";
import { swapsFor } from "../data/exercises.js";
import { toast } from "../lib/toast.js";
import { beep, haptic } from "../lib/fx.js";

// How-to video + set logging for a single exercise.
export default function ExerciseSheet({ open, onClose, week, dayId, exercise }) {
  const { state, actions } = useStore();
  const [restSec, setRestSec] = useState(null);
  const [swapping, setSwapping] = useState(false);
  if (!exercise) return null;

  const key = `w${week}-${dayId}`;
  // A swap replaces the movement for this day; logs key off the name you
  // actually did, so the history stays honest.
  const swapped = state.swaps?.[key]?.[exercise.name] || null;
  const shownName = swapped || exercise.name;
  const alts = swapsFor(exercise.name);
  const log = state.liftLogs[key]?.exercises?.[shownName] || {};
  const target = setsFor(exercise, week);
  const reps = log.reps || [];

  const setRep = (i, v) => {
    const next = [...reps];
    next[i] = v;
    actions.setExerciseLog(week, dayId, shownName, { reps: next });
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
          <h3 className="sheet-title">{shownName}</h3>
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

      {/* swap */}
      {alts.length > 0 && (
        <div className="swap-box">
          <button className="swap-toggle" onClick={() => { haptic(); setSwapping((s) => !s); }}>
            {swapping ? "▾ Close swaps" : `⇄ Swap this exercise${swapped ? " (swapped)" : ""}`}
          </button>
          {swapped && !swapping && (
            <div className="swap-note">
              Doing <b>{swapped}</b> instead of {exercise.name}.
              <button
                className="swap-undo"
                onClick={() => { actions.setSwap(week, dayId, exercise.name, null); haptic(); toast({ emoji: "↩️", title: "Swap removed", sub: exercise.name, tone: "neutral" }); }}
              >
                Undo
              </button>
            </div>
          )}
          {swapping && (
            <div className="swap-list">
              <div className="swap-hint">Same movement pattern — pick what you can actually do today.</div>
              {swapped && (
                <button
                  className="swap-opt"
                  onClick={() => { actions.setSwap(week, dayId, exercise.name, null); setSwapping(false); haptic(); }}
                >
                  ↩︎ Back to {exercise.name}
                </button>
              )}
              {alts.map((a) => (
                <button
                  key={a.name}
                  className={`swap-opt ${shownName === a.name ? "on" : ""}`}
                  onClick={() => {
                    actions.setSwap(week, dayId, exercise.name, a.name);
                    setSwapping(false);
                    haptic("success");
                    toast({ emoji: "⇄", title: "Swapped", sub: `${exercise.name} → ${a.name}`, tone: "good" });
                  }}
                >
                  <span>{a.name}</span>
                  <span className="swap-eq">{(a.eq || []).join(" · ")}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="section-label" style={{ marginTop: 18 }}>
        Log your sets
      </div>
      <div className="ex-log" style={{ flexWrap: "wrap" }}>
        <NumField
          label="Weight"
          value={log.weight}
          accent
          placeholder="55"
          onCommit={(v) => actions.setExerciseLog(week, dayId, shownName, { weight: v })}
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
          onCommit={(v) => actions.setExerciseLog(week, dayId, shownName, { startWt: v })}
        />
        <NumField
          label="End wt"
          value={log.endWt}
          placeholder="—"
          onCommit={(v) => actions.setExerciseLog(week, dayId, shownName, { endWt: v })}
        />
      </div>

      <div className="section-label" style={{ marginTop: 18 }}>Rest timer</div>
      <div className="rest-timer">
        {[60, 90, 120].map((sec) => (
          <button
            key={sec}
            className="rt-preset"
            onClick={() => { beep(600, 0.05); haptic(); setRestSec(sec); }}
          >
            {sec}s
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={onClose}>
        Done
      </button>

      {restSec != null && (
        <CountdownTimer
          label="Rest"
          seconds={restSec}
          accent="rest"
          voice={state.settings?.voice !== false}
          doneLabel="Back to it"
          onClose={() => setRestSec(null)}
        />
      )}
    </Sheet>
  );
}
