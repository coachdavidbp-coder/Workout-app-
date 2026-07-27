import { useState } from "react";
import { useStore, currentDayId, todayKey } from "../store.jsx";
import { DAY_NAMES, WEEKS, daysOf, dayById, trainingCount } from "../data/plans.js";
import { IconPlay } from "../components/icons.jsx";
import NumField from "../components/NumField.jsx";
import ExerciseSheet from "../components/ExerciseSheet.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import CoachCard from "../components/CoachCard.jsx";
import WorkoutTimer from "../components/WorkoutTimer.jsx";
import MusicButton from "../components/MusicButton.jsx";
import IntervalTimer from "../components/IntervalTimer.jsx";
import { trainingCoach } from "../lib/coach.js";
import { fmtPace, fmtDuration } from "../lib/progress.js";
import { caloriesForSession, bodyweight, strengthPRHit, runPRHit, streakMilestoneHit, streak } from "../lib/gamify.js";
import { fireConfetti, haptic } from "../lib/fx.js";
import { toast } from "../lib/toast.js";

const FEELS = ["😩", "😕", "🙂", "💪", "🔥"];

export default function TrainScreen() {
  const { state, mode, actions } = useStore();
  const today = currentDayId();
  const [dayId, setDayId] = useState(today);
  const [sheetEx, setSheetEx] = useState(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [startSignal, setStartSignal] = useState(0);
  const beginTiming = () => setStartSignal((n) => n + 1);
  const openEx = (ex) => { setSheetEx(ex); beginTiming(); };

  const week = state.week;
  const day = dayById(state, dayId);
  const doneKey = `w${week}-${dayId}`;
  const log = state.liftLogs[doneKey] || {};
  const runLog = state.runLogs[doneKey] || { intervals: [] };
  const days = daysOf(state);
  const weekDone = days.filter(
    (d) => d.type !== "rest" && state.done[`w${week}-${d.id}`]
  ).length;
  const coachMsg = trainingCoach(state, { week, dayId, day, todayId: today });
  const proto = day.protocol?.find((p) => p.week === week);

  const sessionSec = state.durations?.[doneKey] || 0;
  const estCals = caloriesForSession(sessionSec, day.type, bodyweight(state));

  const voiceOn = state.settings?.voice !== false;

  const completeDay = () => {
    const turningOn = !state.done[doneKey];
    if (turningOn) {
      const wins = [];
      if (day.type === "lift" && strengthPRHit(state, week, dayId)) wins.push({ emoji: "🏋️", title: "New strength PR!", sub: "You lifted heavier than before" });
      if (day.type === "cardio") {
        const speeds = (runLog.intervals || []).map((i) => parseFloat(i.mph)).filter((n) => !isNaN(n));
        const rdur = (parseInt(runLog.durMin) || 0) * 60 + (parseInt(runLog.durSec) || 0);
        const dist = parseFloat(runLog.distanceMi) || null;
        const top = speeds.length ? Math.max(...speeds) : null;
        const pace = dist && rdur ? rdur / 60 / dist : null;
        if (runPRHit(state, { topMph: top, pace })) wins.push({ emoji: "💨", title: "New running PR!", sub: "Faster than any run yet" });
        actions.logRunSession({
          date: todayKey(), dayId, week,
          distanceMi: dist, durationSec: rdur || null, topMph: top,
          avgMph: speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null,
        });
      }
      if (streakMilestoneHit(state)) wins.push({ emoji: "🔥", title: `${streak(state).current + 1}-day streak!`, sub: "Don't stop now" });
      actions.logActivity(todayKey(), { workouts: 1, calories: estCals });
      haptic("success");
      if (wins.length) {
        fireConfetti(); // only on a PR or streak milestone
        wins.forEach((w) => toast({ ...w, tone: "good" }));
      }
    }
    actions.toggleDone(week, dayId);
  };

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
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
            <b>{weekDone}</b>/{trainingCount(state)}
          </span>
        </div>

        <div className="daystrip">
          {days.map((d) => {
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
                <span className="ck">{isDone ? "✓" : " "}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="content">
        <CoachCard msg={coachMsg} />

        {day.type !== "rest" && (
          <div className="train-toolbar">
            <WorkoutTimer week={week} dayId={dayId} voice={voiceOn} startSignal={startSignal} />
            <MusicButton compact />
          </div>
        )}

        {day.warmup && (
          <p className="warmup">
            <b>Warm-up:</b> {day.warmup}
          </p>
        )}

        {day.type === "lift" && (
          <LiftDay day={day} week={week} log={log} onOpen={openEx} actions={actions} dayId={dayId} />
        )}

        {day.type === "cardio" && (
          <CardioDay
            day={day}
            week={week}
            runLog={runLog}
            actions={actions}
            dayId={dayId}
            onStartTimer={() => { setTimerOpen(true); beginTiming(); }}
            proto={proto}
          />
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

            {(sessionSec > 0 || state.done[doneKey]) && (
              <div className="session-summary">
                <div className="summary-stat">
                  <div className="k tnum">{fmtDuration(sessionSec)}</div>
                  <div className="l">Total time</div>
                </div>
                <div className="summary-stat">
                  <div className="k tnum" style={{ color: "var(--amber)" }}>{estCals}</div>
                  <div className="l">Est. calories</div>
                </div>
              </div>
            )}
            {sessionSec > 0 && (
              <p className="summary-note">Timer runs automatically once you start a lift · calories estimated from time + bodyweight</p>
            )}

            <button
              className={`btn ${state.done[doneKey] ? "btn-good" : "btn-primary"} btn-block complete-btn`}
              onClick={completeDay}
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

      {timerOpen && proto && (
        <div className="timer-overlay">
          <IntervalTimer
            rounds={proto.rounds}
            work={proto.seconds}
            rest={proto.rest}
            workLabel={dayId === "tue" ? "Sprint" : "Run"}
            voice={voiceOn}
            onClose={() => setTimerOpen(false)}
          />
        </div>
      )}
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

function CardioDay({ day, week, runLog, actions, dayId, onStartTimer, proto }) {
  const intervals = runLog.intervals || [];
  const speeds = intervals.map((i) => parseFloat(i.mph)).filter((n) => !isNaN(n));
  const top = speeds.length ? Math.max(...speeds) : null;

  const distanceMi = parseFloat(runLog.distanceMi) || 0;
  const durSec = (parseInt(runLog.durMin) || 0) * 60 + (parseInt(runLog.durSec) || 0);
  const pace = distanceMi > 0 && durSec > 0 ? durSec / 60 / distanceMi : null;
  const mph = distanceMi > 0 && durSec > 0 ? distanceMi / (durSec / 3600) : null;

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

      {proto && (
        <button className="btn btn-primary btn-block interval-launch" onClick={onStartTimer}>
          ▶ Start Interval Timer · {proto.rounds} × {proto.seconds}s
        </button>
      )}

      {/* run summary */}
      <div>
        <div className="section-label">Run summary</div>
        <div className="card" style={{ padding: 14 }}>
          <div className="ex-log">
            <NumField
              label="Distance (mi)"
              value={runLog.distanceMi}
              placeholder="2.5"
              accent
              onCommit={(v) => actions.setRunField(week, dayId, { distanceMi: v })}
            />
            <NumField
              label="Min"
              value={runLog.durMin}
              placeholder="24"
              onCommit={(v) => actions.setRunField(week, dayId, { durMin: v })}
            />
            <NumField
              label="Sec"
              value={runLog.durSec}
              placeholder="30"
              onCommit={(v) => actions.setRunField(week, dayId, { durSec: v })}
            />
          </div>
          <div className="mini-stats" style={{ marginTop: 12 }}>
            <div className="mini-stat">
              <div className="k">{pace ? fmtPace(pace).replace("/mi", "") : "—"}</div>
              <div className="l">Pace /mi</div>
            </div>
            <div className="mini-stat">
              <div className="k">{mph ? mph.toFixed(1) : "—"}</div>
              <div className="l">Avg MPH</div>
            </div>
            <div className="mini-stat">
              <div className="k" style={{ color: "var(--ac-hi)" }}>{top ? top.toFixed(1) : "—"}</div>
              <div className="l">Top MPH</div>
            </div>
          </div>
        </div>
      </div>

      {/* per-interval speeds */}
      <div>
        <div className="section-label">Interval speeds</div>
        <div className="ex-card">
          {intervals.length === 0 && (
            <div className="empty-hint">
              Log the speed you hit each sprint or run. Add one per interval.
            </div>
          )}
          {intervals.map((iv, idx) => (
            <div className="interval-row" key={idx}>
              <span className="ix">{idx + 1}</span>
              <div className="mini">
                <NumField label="MPH" value={iv.mph} placeholder="10.5" accent onCommit={(v) => actions.setInterval(week, dayId, idx, { mph: v })} />
              </div>
              <div className="mini">
                <NumField label="Incline %" value={iv.incline} placeholder="6" onCommit={(v) => actions.setInterval(week, dayId, idx, { incline: v })} />
              </div>
              <button className="del" aria-label="Remove interval" onClick={() => actions.removeInterval(week, dayId, idx)}>
                ×
              </button>
            </div>
          ))}
          <button className="add-interval" onClick={() => actions.addInterval(week, dayId)}>
            + Add interval
          </button>
        </div>
      </div>
    </>
  );
}
