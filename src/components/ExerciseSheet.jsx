import Sheet from "./Sheet.jsx";
import NumField from "./NumField.jsx";
import { IconPlay } from "./icons.jsx";
import { useStore } from "../store.jsx";

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

      <a className="video-wrap video-search" href={ytSearch} target="_blank" rel="noopener noreferrer">
        <div className="video-empty">
          <span className="yt-btn">
            <span className="tri" /> Watch how-to on YouTube
          </span>
          <span className="vq">Search: “{exercise.q}”</span>
        </div>
      </a>

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

      <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={onClose}>
        Done
      </button>
    </Sheet>
  );
}
