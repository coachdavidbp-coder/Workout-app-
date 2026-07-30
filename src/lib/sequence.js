// =========================================================
// Turns a warm-up / cool-down written as prose into timed steps,
// so the timer can say what to do *right now* instead of just
// counting down a single block.
// =========================================================

// "5 min treadmill walk · arm circles · 15 push-ups"
//   → [{label:"Treadmill walk", seconds:300}, ...]
export function parseSequence(text, fallbackEach = 40) {
  if (!text) return [];
  return String(text)
    .split(/·|;|•|\+|,(?![^()]*\))/)      // bullets, plus signs, commas (not inside parens)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      let seconds = fallbackEach;
      const min = raw.match(/(\d+(?:\.\d+)?)\s*min/i);
      const sec = raw.match(/(\d+)\s*[-\s]?sec/i);
      const reps = raw.match(/(\d+)\s*(?:×|x)?\s*(?:reps?|push-?ups?|squats?|lunges?|swings?|bridges?|circles?)/i);
      const count = raw.match(/^(\d+)\s/);

      if (min) seconds = Math.round(parseFloat(min[1]) * 60);
      else if (sec) seconds = parseInt(sec[1], 10);
      else if (reps) seconds = Math.max(30, Math.min(90, parseInt(reps[1], 10) * 3));
      else if (count) seconds = Math.max(30, Math.min(90, parseInt(count[1], 10) * 3));

      // tidy the label: drop the leading duration/count, capitalise
      let label = raw
        .replace(/^\d+(?:\.\d+)?\s*min(?:ute)?s?\s*/i, "")
        .replace(/^\d+\s*[-\s]?sec(?:ond)?s?\s*/i, "")
        .trim();
      if (!label) label = raw.trim();
      label = label.charAt(0).toUpperCase() + label.slice(1);

      return { label, seconds };
    });
}

export const totalSeconds = (steps) => steps.reduce((a, s) => a + s.seconds, 0);

// Four poses chosen for lower-back relief after lifting: mobilise the spine,
// decompress it, then release the two things that usually pull on it
// (glutes and the rotators).
export const YOGA_LOWER_BACK = [
  {
    label: "Cat-Cow",
    seconds: 60,
    cue: "On hands and knees. Inhale — drop the belly, lift the chest. Exhale — round the spine, tuck the chin. Slow and smooth.",
  },
  {
    label: "Child's Pose",
    seconds: 60,
    cue: "Knees wide, big toes together, hips back to the heels. Walk the hands forward and let the low back open. Breathe into your back ribs.",
  },
  {
    label: "Figure-4 Glute Stretch",
    seconds: 90,
    cue: "On your back, ankle across the opposite knee, pull the thigh in. 45 seconds each side — tight glutes are what drag on your low back.",
  },
  {
    label: "Supine Spinal Twist",
    seconds: 90,
    cue: "On your back, knees together, drop them to one side, shoulders flat. 45 seconds each side. Exhale and let gravity do it.",
  },
];
