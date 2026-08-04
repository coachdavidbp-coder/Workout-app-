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

// ---------------------------------------------------------
// Pose how-to videos.
//
// These are plain YouTube video ids — the same thing the lifts in plans.js
// carry — so each pose plays inline in the app instead of kicking you out to
// the YouTube app. To swap one: open the video on YouTube, copy the id out of
// the URL (youtube.com/watch?v=THIS_PART) and paste it here. Set an entry to
// null and that pose falls back to a "search YouTube" card.
//
// Every id below was looked up by searching for the move and taking a video
// that actually came back indexed under that name — the titles are in the
// comments so a wrong one is easy to spot. An id that can't be reached from
// the build machine is an id that might not exist, and a dead embed shows up
// as a black box mid-session.
// ---------------------------------------------------------
export const POSE_VIDEOS = {
  // cool-down yoga (see lib/yoga.js for which day gets which)
  "Cat-Cow": "kqnua4rHVVA",                    // How to Do a Cat Cow Pose for Energy | Yoga
  "Child's Pose": "EniGBCHAEVQ",               // How to do Childs Pose PROPERLY | Yoga for Beginners
  "Figure-4 Glute Stretch": "OcfcKXTaEkA",     // How to do a Figure-4 Stretch | Well+Good
  "Supine Spinal Twist": "sADFnhF-Ln0",        // How To Do A Supine Spinal Twist (Supta Matsyendrasana)
  "Sphinx Pose": "QVYLJJE2TlE",                // How to Do Sphinx Pose in Yoga
  "Low Lunge": "Y8jM-f_mUTM",                  // How to do Low Lunge Pose | Anjaneyasana
  "Half Frog Quad Stretch": "K2QimPsO8zw",     // Yoga: How To Do Half Frog
  "Seated Forward Fold": "IreNmKl5o6U",        // How to Do Seated Forward Fold - Paschimottanasana
  "Downward Dog": "Y0GDgQqt-bA",               // How to do Downward Facing Dog | Yoga for Beginners
  "Thread the Needle": "UomKzkyp6kQ",          // How to Thread-the-Needle | Well+Good
  "Puppy Pose": "U6ExAZXkJ80",                 // How To: Puppy Pose (Uttana Shishosana)
  "Supported Fish": "s6cSG0ebhkI",             // How To - Supported Fish Pose
  "Pigeon Pose": "zuYbjkuKLKY",                // How To SAFELY Do Pigeon Pose For Beginners
  "Reclined Butterfly": "N4figcWjDGI",         // How to Do the Reclined Butterfly Pose
  "Happy Baby": "Rg8L0_ZDick",                 // How to Do Happy Baby Pose
  // pre-workout (dynamic)
  "Leg Swings": "difYoBtZi2s",                 // How To Do Leg Swings
  "World's Greatest Stretch": "T6j7BpxeqqU",   // World's Greatest Stretch | Tutorial
  "90/90 Hip Switch": "HUZimFZJZWU",           // How to Do the 90/90 Switch for Hip Mobility
  "Arm Circles & Shoulder Openers": "mwDgFY86zck", // Workout WARM-UP | ARM CIRCLES
  "Ankle Rocks": "Hm_Iu72bJJg",                // Half Kneeling Ankle Rocks - Ankle Mobility
  "Glute Bridge": "wPM8icPu6H8",               // How To Do A Glute Bridge | Well+Good
};

const pose = (label, seconds, q, cue) => ({ label, seconds, q, cue, video: POSE_VIDEOS[label] || null });

// ---------------------------------------------------------
// STRETCH — dynamic, and it opens the session. You move through range,
// you don't hold.
// Static holds before lifting temporarily cut force output; these open the
// hips, ankles and thoracic spine so you can squat and press in real
// positions instead of fighting for them under load.
// ---------------------------------------------------------
export const PRE_STRETCH = [
  pose("Leg Swings", 60, "leg swings dynamic warm up tutorial",
    "Hold something solid. Swing one leg front-to-back, loose and controlled, then side-to-side. 30 seconds a leg — let the range build, don't force it."),
  pose("World's Greatest Stretch", 90, "worlds greatest stretch tutorial",
    "Deep lunge, back knee off the floor, drop the inside elbow toward the instep, then rotate that arm to the ceiling. 45 seconds a side. Best single move for a lifting day."),
  pose("90/90 Hip Switch", 60, "90 90 hip switch mobility drill tutorial",
    "Sit with both knees bent at 90°, one in front, one out to the side. Rotate the knees down to the other side and back. Chest tall the whole time."),
  pose("Arm Circles & Shoulder Openers", 45, "arm circles shoulder warm up tutorial",
    "Big slow circles forward, then back, then wide open-and-cross. Gets blood into the cuff before anything goes overhead."),
  pose("Ankle Rocks", 45, "ankle mobility rock knee over toe drill",
    "Half-kneeling, front foot flat, drive the knee out over the toes and back. 20 seconds a side. Stiff ankles are why squats fall forward."),
  pose("Glute Bridge", 45, "glute bridge warm up tutorial",
    "On your back, feet flat, drive through the heels and squeeze at the top for a second. Wakes the glutes up so your low back doesn't do their job."),
];

