import { useState } from "react";
import { useStore, currentDayId, todayKey, weekDates } from "../store.jsx";
import { DAY_NAMES, weeksOf, daysOf, dayById, trainingCount, setsFor, protoFor } from "../data/plans.js";
import { IconPlay } from "../components/icons.jsx";
import NumField from "../components/NumField.jsx";
import ExerciseSheet from "../components/ExerciseSheet.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import CoachCard from "../components/CoachCard.jsx";
import WorkoutTimer from "../components/WorkoutTimer.jsx";
import NowPlaying from "../components/NowPlaying.jsx";
import IntervalTimer from "../components/IntervalTimer.jsx";
import CountdownTimer from "../components/CountdownTimer.jsx";
import SequenceTimer from "../components/SequenceTimer.jsx";
import CooldownSheet from "../components/CooldownSheet.jsx";
import { parseSequence, totalSeconds } from "../lib/sequence.js";
import WorkoutSummarySheet from "../components/WorkoutSummarySheet.jsx";
import { trainingCoach, fatigueCheck } from "../lib/coach.js";
import { fmtPace, fmtDuration } from "../lib/progress.js";
import { caloriesForSession, bodyweight, strengthPRHit, runPRHit, streakMilestoneHit, streak } from "../lib/gamify.js";
import { fireConfetti, beep, haptic } from "../lib/fx.js";
import { toast } from "../lib/toast.js";

const FEELS = ["😩", "😕", "🙂", "💪", "🔥"];

// Pull a warm-up length out of the plan text ("5 min ..." → 300s); default 5 min.
function warmupSeconds(text) {
  const m = String(text || "").match(/(\d+)\s*min/i);
  return m ? parseInt(m[1], 10) * 60 : 300;
}
function clock(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

// Sunday-first day ids, so a program day maps to a real calendar date
// in the current week (missed days are stored by date).
const DAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function TrainScreen() {
  const { state, mode, actions } = useStore();
  const today = currentDayId();
  const [dayId, setDayId] = useState(today);
  const [sheetEx, setSheetEx] = useState(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [cooldownOpen, setCooldownOpen] = useState(false);
  const [cooldownList, setCooldownList] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
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
  const proto = protoFor(day, week);

  const wkDates = weekDates(new Date());
  const dateKeyFor = (id) => wkDates[DAY_IDS.indexOf(id)]?.key || todayKey();
  const missedKey = dateKeyFor(dayId);
  const isMissed = !!state.missed?.[missedKey];

  const sessionSec = state.durations?.[doneKey] || 0;
  // One session control: the Start card until the workout clock is live.
  const sessionLive = startSignal > 0 || sessionSec > 0;
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
      actions.logActivity(todayKey(), { workouts: 1, calories: estCals, minutes: Math.round(sessionSec / 60) });
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
          {weeksOf(state).map((w) => (
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
            const skipped = d.type !== "rest" && !isDone && !!state.missed?.[dateKeyFor(d.id)];
            return (
              <button
                key={d.id}
                className={`day-cell ${active ? "on" : ""} ${d.type === "rest" ? "rest" : ""}`}
                onClick={() => setDayId(d.id)}
              >
                {d.id === today && <span className="today-dot" />}
                {d.label}
                <span className={`ck ${skipped ? "miss" : ""}`}>{isDone ? "✓" : skipped ? "✕" : " "}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="content">
        <CoachCard msg={coachMsg} />

        {(() => {
          const f = fatigueCheck(state);
          if (!f) return null;
          return (
            <div className={`fatigue-card ${f.tone}`}>
              <div className="fc-top">
                <span className="fc-ico">{f.kind === "recovering" ? "📈" : f.kind === "highload" ? "🔋" : "🛑"}</span>
                <span className="fc-title">{f.title}</span>
              </div>
              <p className="fc-body">{f.body}</p>
            </div>
          );
        })()}

        {day.type !== "rest" && (
          <>
            {sessionLive ? (
              <div className="train-toolbar">
                <WorkoutTimer week={week} dayId={dayId} voice={voiceOn} startSignal={startSignal} />
              </div>
            ) : (
              <div className="session-start">
                <div className="ss-top">
                  <span className="ss-kicker">Session</span>
                  <span className="ss-len">{day.warmup ? `${clock(totalSeconds(parseSequence(day.warmup)))} guided warm-up first` : "No warm-up listed"}</span>
                </div>
                <button
                  className="ss-btn"
                  onClick={() => {
                    beep(600, 0.05); haptic("success");
                    if (day.warmup) setWarmupOpen(true);
                    else beginTiming();
                  }}
                >
                  ▶ Start session
                </button>
                <div className="ss-note">
                  {day.warmup
                    ? "Warm-up counts down, buzzes, then asks if you're ready to lift."
                    : "Starts the workout clock."}
                </div>
              </div>
            )}
            {/* Always visible: the warm-up is part of the session, not just a
                prompt before it. Re-runnable once the workout is underway. */}
            {day.warmup && (
              <div className="warmup-card">
                <div className="warmup-txt"><b>Warm-up</b> · {day.warmup}</div>
                <button
                  className="btn warmup-btn"
                  onClick={() => { beep(600, 0.05); haptic(); setWarmupOpen(true); }}
                >
                  ▶ {sessionLive ? "Run warm-up again" : "Start warm-up"} · {clock(totalSeconds(parseSequence(day.warmup)))}
                </button>
              </div>
            )}

            <NowPlaying />
          </>
        )}

        {day.type === "lift" && (
          <LiftDay day={day} week={week} log={log} onOpen={openEx} actions={actions} dayId={dayId} swaps={state.swaps?.[doneKey] || {}} />
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
            {day.cooldown?.length > 0 && (
              <div className="warmup-card cooldown-card">
                <div className="warmup-txt"><b>Cool-down · yoga</b> · for your lower back</div>
                <div className="pose-mini">
                  {day.cooldown.map((c) => (
                    <span className="pose-chip" key={c.label}>
                      {c.label}<em className="tnum">{clock(c.seconds)}</em>
                    </span>
                  ))}
                </div>
                <div className="row gap-2" style={{ marginTop: 10 }}>
                  <button className="btn" style={{ flex: 1 }} onClick={() => { haptic(); setCooldownList(true); }}>
                    Poses &amp; videos
                  </button>
                  <button className="btn cooldown-btn" style={{ flex: 1.4, marginTop: 0 }} onClick={() => { beep(600, 0.05); haptic(); setCooldownOpen(true); }}>
                    ▶ Start · {clock(totalSeconds(day.cooldown))}
                  </button>
                </div>
              </div>
            )}

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

            {(state.done[doneKey] || sessionSec > 0) && (
              <button
                className="btn btn-ghost btn-block"
                style={{ marginTop: 10 }}
                onClick={() => { haptic(); setSummaryOpen(true); }}
              >
                📋 Summarize this workout
              </button>
            )}

            {!state.done[doneKey] && (
              <button
                className={`btn btn-block missed-btn ${isMissed ? "on" : ""}`}
                style={{ marginTop: 10 }}
                onClick={() => {
                  const now = !isMissed;
                  actions.reportMissed(missedKey, now);
                  haptic(now ? "warning" : "light");
                  toast(now
                    ? { emoji: "✗", title: "Marked as missed", sub: `${day.name} — logged as a workout you skipped.`, tone: "neutral" }
                    : { emoji: "↩️", title: "Undone", sub: "Removed the missed-workout mark.", tone: "neutral" });
                }}
              >
                {isMissed ? "✓ Marked missed (tap to undo)" : `✗ I missed this workout${dayId === today ? "" : ` (${DAY_NAMES[dayId]})`}`}
              </button>
            )}
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

      {warmupOpen && day.warmup && (
        <SequenceTimer
          title="Warm-up"
          steps={parseSequence(day.warmup)}
          accent="warmup"
          voice={voiceOn}
          countdownFrom={5}
          donePhase="Warm-up complete"
          doneNote="Ready to start the workout?"
          doneLabel="I'm ready — start workout ▶"
          onComplete={beginTiming}
          onClose={() => setWarmupOpen(false)}
        />
      )}

      <CooldownSheet
        open={cooldownList}
        onClose={() => setCooldownList(false)}
        steps={day.cooldown || []}
        onStart={() => setCooldownOpen(true)}
      />

      {cooldownOpen && day.cooldown?.length > 0 && (
        <SequenceTimer
          title="Cool-down"
          steps={day.cooldown}
          accent="rest"
          voice={voiceOn}
          countdownFrom={5}
          donePhase="Cool-down complete"
          doneNote="Low back should feel looser. Water and protein next."
          doneLabel="Done"
          onClose={() => setCooldownOpen(false)}
        />
      )}

      <WorkoutSummarySheet
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        state={state}
        week={week}
        dayId={dayId}
        day={day}
        sessionSec={sessionSec}
        estCals={estCals}
      />
    </div>
  );
}

function LiftDay({ day, week, log, onOpen, actions, dayId, swaps = {} }) {
  return (
    <>
      <div className="bw-log">
        <div className="lab">
          Weigh-in
          <small>Optional — “before” logs to your weight trend; we track the change</small>
        </div>
        <div className="weighin-row">
          <NumField
            label="Before"
            value={log.bwBefore}
            placeholder="290"
            accent
            onCommit={(v) => actions.setDayWeighIn(week, dayId, "before", v)}
          />
          <NumField
            label="After"
            value={log.bwAfter}
            placeholder="289"
            onCommit={(v) => actions.setDayWeighIn(week, dayId, "after", v)}
          />
          {log.bwBefore && log.bwAfter && !isNaN(parseFloat(log.bwBefore)) && !isNaN(parseFloat(log.bwAfter)) && (
            <div className="weighin-delta">
              <div className="k">{(parseFloat(log.bwAfter) - parseFloat(log.bwBefore) >= 0 ? "+" : "") + (parseFloat(log.bwAfter) - parseFloat(log.bwBefore)).toFixed(1)}</div>
              <div className="l">lb</div>
            </div>
          )}
        </div>
      </div>

      <div className="ex-card">
        {day.exercises.map((ex) => {
          const swapped = swaps[ex.name] || null;
          const shownName = swapped || ex.name;
          const exLog = log.exercises?.[shownName] || {};
          const reps = (exLog.reps || []).filter((r) => r !== "" && r != null);
          return (
            <div className="ex-item" key={ex.name}>
              <button className="ex-top" onClick={() => onOpen(ex)}>
                <div>
                  <div className="ex-name">
                    <span className="vic">
                      <IconPlay width="15" height="15" />
                    </span>
                    {shownName}
                    {swapped && <span className="swap-tag">swapped</span>}
                  </div>
                  <div className="ex-sub">
                    {exLog.weight ? `${exLog.weight} lb` : "Tap for video & log"}
                    {reps.length ? ` · ${reps.join("/")} reps` : ""}
                  </div>
                </div>
                <span className="set-pill">{setsFor(ex, week)}</span>
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
          {day.protocol.map((p, i) => (
            <div key={p.week} className={`proto-row ${i === (week - 1) % day.protocol.length ? "on" : ""}`}>
              <span className="wk-tag">Wk {p.week}</span>
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {proto && proto.rounds > 1 && (
        <button className="btn btn-primary btn-block interval-launch" onClick={onStartTimer}>
          ▶ Start Interval Timer · {proto.rounds} × {proto.seconds}s
        </button>
      )}
      {proto && proto.rounds <= 1 && (
        <div className="steady-run-hint">🏃 Steady run — open the <b>Run</b> tab to track it live with GPS + map, or log it below.</div>
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
