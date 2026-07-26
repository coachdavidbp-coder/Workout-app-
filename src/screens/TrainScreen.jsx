import { useState } from "react";
import { useStore, currentDayId } from "../store.jsx";
import {
  DAYS,
  DAY_NAMES,
  WEEKS,
  TRAINING_DAY_COUNT,
  dayById,
} from "../data/plan.js";
import { IconPlay } from "../components/icons.jsx";
import NumField from "../components/NumField.jsx";
import ExerciseSheet from "../components/ExerciseSheet.jsx";

const FEELS = ["😩", "😕", "🙂", "💪", "🔥"];

export default function TrainScreen() {
  const { state, mode, actions } = useStore();
  const today = currentDayId();
  const [dayId, setDayId] = useState(today);
  const [sheetEx, setSheetEx] = useState(null);

  const week = state.week;
  const day = dayById(dayId);
  const doneKey = `w${week}-${dayId}`;
  const log = state.liftLogs[doneKey] || {};
  const runLog = state.runLogs[doneKey] || { intervals: [] };
  const weekDone = DAYS.filter(
    (d) => d.type !== "rest" && state.done[`w${week}-${d.id}`]
  ).length;

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <span className="eyebrow">
            <span className="dot" /> Us vs Them
          </span>
          <span className={`mode-badge ${mode === "cloud" ? "cloud" : ""}`}>
            <span className="d" />
            {mode === "cloud" ? "Synced" : "On this device"}
          </span>
        </div>

        <div className="h-title">
          <div className="kicker">{DAY_NAMES[day.id]}</div>
          <h1>{day.name}</h1>
        </div>

        <div className="week-tabs">
          {WEEKS.map((w) => (
            <button
              key={w}
              className={`week-pill ${week === w ? "on" : ""}`}
              onClick={() => actions.setWeek(w)}
            >
              Wk {w}
            </button>
          ))}
          <span className="done-count">
            <b>{weekDone}</b>/{TRAINING_DAY_COUNT}
          </span>
        </div>

        <div className="daystrip">
          {DAYS.map((d) => {
            const active = d.id === dayId;
            const isDone = d.type !== "rest" && state.done[`w${week}-${d.id}`];
            return (
              <button
                key={d.id}
                className={`day-cell ${active ? "on" : ""} ${d.type === "rest" ? "rest" : ""}`}
                onClick={() => setDayId(d.id)}
              >
                {d.id === today && <span className="today-dot" />}
                {d.label}
                <span className="ck">{isDone ? "✓" : " "}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="content">
        {day.warmup && (
          <p className="warmup">
            <b>Warm-up:</b> {day.warmup}
          </p>
        )}

        {day.type === "lift" && (
          <LiftDay
            day={day}
            week={week}
            log={log}
            onOpen={setSheetEx}
            actions={actions}
            dayId={dayId}
          />
        )}

        {day.type === "cardio" && (
          <CardioDay day={day} week={week} runLog={runLog} actions={actions} dayId={dayId} />
        )}

        {day.type === "rest" && (
          <div className="card rest-card">
            <div className="ico">🛌</div>
            <h2>Rest Day</h2>
            <p>{day.note}</p>
          </div>
        )}

        {day.type !== "rest" && (
          <>
            <div className="note-box">{day.note}</div>

            <div className="feel-wrap">
              <div className="feel-label">How did today feel?</div>
              <div className="feel">
                {FEELS.map((f, i) => (
                  <button
                    key={i}
                    className={log.feel === i + 1 ? "on" : ""}
                    onClick={() => actions.setFeel(week, dayId, i + 1)}
                    aria-label={`Feeling ${i + 1} of 5`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={`btn ${state.done[doneKey] ? "btn-good" : "btn-primary"} btn-block complete-btn`}
              onClick={() => actions.toggleDone(week, dayId)}
            >
              {state.done[doneKey] ? "✓ Workout Complete" : "Mark Workout Complete"}
            </button>
          </>
        )}
      </main>

      <ExerciseSheet
        open={!!sheetEx}
        onClose={() => setSheetEx(null)}
        week={week}
        dayId={dayId}
        exercise={sheetEx}
      />
    </div>
  );
}

function LiftDay({ day, week, log, onOpen, actions, dayId }) {
  return (
    <>
      <div className="bw-log">
        <div className="lab">
          Bodyweight today
          <small>Optional — logs to your weight trend too</small>
        </div>
        <NumField
          label=""
          value={log.bodyweight}
          placeholder="290"
          accent
          onCommit={(v) => actions.setDayBodyweight(week, dayId, v)}
        />
      </div>

      <div className="ex-card">
        {day.exercises.map((ex) => {
          const exLog = log.exercises?.[ex.name] || {};
          const reps = (exLog.reps || []).filter((r) => r !== "" && r != null);
          return (
            <div className="ex-item" key={ex.name}>
              <button className="ex-top" onClick={() => onOpen(ex)}>
                <div>
                  <div className="ex-name">
                    <span className="vic">
                      <IconPlay width="15" height="15" />
                    </span>
                    {ex.name}
                  </div>
                  <div className="ex-sub">
                    {exLog.weight ? `${exLog.weight} lb` : "Tap for video & log"}
                    {reps.length ? ` · ${reps.join("/")} reps` : ""}
                  </div>
                </div>
                <span className="set-pill">{ex.sets[week - 1]}</span>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function CardioDay({ day, week, runLog, actions, dayId }) {
  const intervals = runLog.intervals || [];
  const speeds = intervals.map((i) => parseFloat(i.mph)).filter((n) => !isNaN(n));
  const top = speeds.length ? Math.max(...speeds) : null;

  return (
    <>
      <div className="ex-card">
        <div className="protocol">
          {day.protocol.map((p) => (
            <div key={p.week} className={`proto-row ${p.week === week ? "on" : ""}`}>
              <span className="wk-tag">Wk {p.week}</span>
              {p.label}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="section-label">Log your speeds</div>
        <div className="ex-card">
          {intervals.length === 0 && (
            <div className="empty-hint">
              No intervals logged yet. Add each sprint or run and enter the speed you hit.
            </div>
          )}
          {intervals.map((iv, idx) => (
            <div className="interval-row" key={idx}>
              <span className="ix">{idx + 1}</span>
              <div className="mini">
                <NumField
                  label="MPH"
                  value={iv.mph}
                  placeholder="10.5"
                  accent
                  onCommit={(v) => actions.setInterval(week, dayId, idx, { mph: v })}
                />
              </div>
              <div className="mini">
                <NumField
                  label="Incline %"
                  value={iv.incline}
                  placeholder="6"
                  onCommit={(v) => actions.setInterval(week, dayId, idx, { incline: v })}
                />
              </div>
              <button
                className="del"
                aria-label="Remove interval"
                onClick={() => actions.removeInterval(week, dayId, idx)}
              >
                ×
              </button>
            </div>
          ))}
          <button className="add-interval" onClick={() => actions.addInterval(week, dayId)}>
            + Add interval
          </button>
        </div>
      </div>

      {top != null && (
        <div className="mini-stats">
          <div className="mini-stat">
            <div className="k">{top.toFixed(1)}</div>
            <div className="l">Top MPH</div>
          </div>
          <div className="mini-stat">
            <div className="k">{intervals.length}</div>
            <div className="l">Intervals</div>
          </div>
          <div className="mini-stat">
            <div className="k">
              {speeds.length ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1) : "—"}
            </div>
            <div className="l">Avg MPH</div>
          </div>
        </div>
      )}
    </>
  );
}
