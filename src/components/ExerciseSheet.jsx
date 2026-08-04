import { useEffect, useRef, useState } from "react";
import Sheet from "./Sheet.jsx";
import NumField from "./NumField.jsx";
import CountdownTimer from "./CountdownTimer.jsx";
import { useStore } from "../store.jsx";
import { setsFor } from "../data/plans.js";
import { swapsFor } from "../data/exercises.js";
import { lastPerformance, nextTarget, summarise } from "../lib/history.js";
import { toast } from "../lib/toast.js";
import { beep, haptic } from "../lib/fx.js";

// How-to video + set logging for a single exercise.
//
// Runs full-screen so the keyboard can't squeeze the layout while you're
// entering weight and reps, and carries arrows in the header so you move
// between lifts from the top instead of closing and scrolling the list.
export default function ExerciseSheet({
  open, onClose, week, dayId, exercise,
  index = 0, total = 1, onIndex,
}) {
  const { state, actions } = useStore();
  const [restSec, setRestSec] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const bodyRef = useRef(null);

  // Moving to another lift should land you at the top of it, with any
  // half-open swap list closed.
  useEffect(() => {
    setSwapping(false);
    setRestSec(null);
    const body = document.querySelector(".sheet.full .sheet-body");
    if (body) body.scrollTop = 0;
  }, [exercise?.name]);

  if (!exercise) return null;

  const go = (d) => {
    const next = index + d;
    if (next < 0 || next >= total) return;
    haptic();
    onIndex?.(next);
  };

  // Keep a focused field clear of the keyboard.
  const keepInView = (e) => {
    const el = e.target;
    setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 260);
  };

  const key = `w${week}-${dayId}`;
  // A swap replaces the movement for this day; logs key off the name you
  // actually did, so the history stays honest.
  const swapped = state.swaps?.[key]?.[exercise.name] || null;
  const shownName = swapped || exercise.name;
  const alts = swapsFor(exercise.name, 10, state.profile?.equipment);
  const log = state.liftLogs[key]?.exercises?.[shownName] || {};
  const target = setsFor(exercise, week);
  const reps = log.reps || [];

  // Last time on this movement, and the call for today. The weight is offered
  // rather than filled in — writing a number you didn't lift would put a load
  // in your history that never happened.
  const last = lastPerformance(state, shownName, week, dayId);
  const advice = nextTarget(last, target);

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

  const header = (
    <div className="ex-head">
      <div className="ex-head-top">
        <button className="ex-close" onClick={onClose} aria-label="Close">✕</button>
        <span className="ex-count">Lift {index + 1} of {total}</span>
        <span style={{ width: 38 }} />
      </div>
      <div className="ex-head-nav">
        <button className="ex-nav" onClick={() => go(-1)} disabled={index <= 0} aria-label="Previous lift">‹</button>
        <div className="ex-head-mid">
          <div className="ex-head-name">{shownName}</div>
          <div className="ex-head-target">Target · {target}</div>
        </div>
        <button className="ex-nav" onClick={() => go(1)} disabled={index >= total - 1} aria-label="Next lift">›</button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} full header={header}>

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

      <div className="log-block" ref={bodyRef}>
      {last && (
        <div className="last-time">
          <div className="lt-row">
            <span className="lt-k">Last time</span>
            <span className="lt-v">{summarise(last)}</span>
            {last.weight != null && (
              <button
                className="lt-use"
                onClick={() => {
                  haptic();
                  actions.setExerciseLog(week, dayId, shownName, { weight: String(advice?.weight ?? last.weight) });
                }}
              >
                Use {advice?.weight ?? last.weight} lb
              </button>
            )}
          </div>
          {advice && <p className={`lt-advice ${advice.kind}`}>{advice.text}</p>}
        </div>
      )}
      <div className="section-label" style={{ marginTop: last ? 14 : 0 }}>
        Log your sets
      </div>
      <div className="ex-log" style={{ flexWrap: "wrap" }}>
        <NumField
          label="Weight"
          value={log.weight}
          accent
          onFocus={keepInView}
          placeholder={last?.weight != null ? String(last.weight) : "55"}
          onCommit={(v) => actions.setExerciseLog(week, dayId, shownName, { weight: v })}
        />
        {Array.from({ length: Math.min(setCount, 5) }).map((_, i) => (
          <NumField
            key={i}
            label={`Set ${i + 1}`}
            value={reps[i]}
            placeholder="reps"
            onFocus={keepInView}
            onCommit={(v) => setRep(i, v)}
          />
        ))}
      </div>

      <div className="ex-log" style={{ marginTop: 10 }}>
        <NumField
          label="Start wt"
          value={log.startWt}
          placeholder="—"
          onFocus={keepInView}
          onCommit={(v) => actions.setExerciseLog(week, dayId, shownName, { startWt: v })}
        />
        <NumField
          label="End wt"
          value={log.endWt}
          placeholder="—"
          onFocus={keepInView}
          onCommit={(v) => actions.setExerciseLog(week, dayId, shownName, { endWt: v })}
        />
      </div>
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

      <div className="row gap-2" style={{ marginTop: 18 }}>
        <button className="btn" style={{ flex: 1 }} onClick={() => go(-1)} disabled={index <= 0}>‹ Previous</button>
        {index < total - 1 ? (
          <button className="btn btn-primary" style={{ flex: 1.4 }} onClick={() => go(1)}>Next lift ›</button>
        ) : (
          <button className="btn btn-primary" style={{ flex: 1.4 }} onClick={onClose}>Done</button>
        )}
      </div>

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
