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
// ---------------------------------------------------------
export const POSE_VIDEOS = {
  // cool-down yoga (see lib/yoga.js for which day gets which)
  "Cat-Cow": "kqnua4rHVVA",
  "Child's Pose": "eqVMAPM00DM",
  "Figure-4 Glute Stretch": "AlpJlaPQOSs",
  "Supine Spinal Twist": "AJIQxcT1Iyg",
  "Sphinx Pose": "8vScuPCcuGY",
  "Low Lunge": "Nl2XwYVQmHo",
  "Half Frog Quad Stretch": "4Sti0zdBcOM",
  "Seated Forward Fold": "H6kbz8Zpwtc",
  "Downward Dog": "j97SSGsnCAQ",
  "Thread the Needle": "sMs_C_2Z0Fk",
  "Puppy Pose": "7Nn5wTiFXqk",
  "Supported Fish": "3nDgHzMJ_iw",
  "Pigeon Pose": "0_zPqA65Nu4",
  "Reclined Butterfly": "V0ROlWLBHTM",
  "Happy Baby": "5DsUwkbnwfg",
  // pre-workout (dynamic)
  "Leg Swings": "bxdBhqzHQIQ",
  "World's Greatest Stretch": "TfLm2yqLDpM",
  "90/90 Hip Switch": "sTdIcT_ZWDo",
  "Arm Circles & Shoulder Openers": "140RTNMciH8",
  "Ankle Rocks": "IikISr-0i7g",
  "Glute Bridge": "wPM8icPu6H8",
  // post-workout (static)
  "Standing Hamstring Stretch": "FKPmT_lRbXQ",
  "Standing Quad Stretch": "aWEXhpDBhwo",
  "Kneeling Hip Flexor Stretch": "UnRxOJcpJ_4",
  "Doorway Chest Stretch": "SV7hLmwLisM",
  "Calf Stretch": "6JsxJp2vjjI",
  "Overhead Lat Stretch": "K2FBqbf7Ii8",
};

const pose = (label, seconds, q, cue) => ({ label, seconds, q, cue, video: POSE_VIDEOS[label] || null });

// ---------------------------------------------------------
// PRE-WORKOUT STRETCH — dynamic. You move through range, you don't hold.
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

// ---------------------------------------------------------
// POST-WORKOUT STRETCH — static. Now the holds are the point: muscles are
// warm, and this is where length actually gets kept. Hits the six things
// lifting and sprinting shorten most.
// ---------------------------------------------------------
export const POST_STRETCH = [
  pose("Standing Hamstring Stretch", 60, "standing hamstring stretch tutorial",
    "Heel on the floor in front, toes up, hinge from the hips with a flat back. 30 seconds a leg. Chase it in the belly of the muscle, not behind the knee."),
  pose("Standing Quad Stretch", 60, "standing quad stretch tutorial",
    "Heel to your backside, knees together, tuck the pelvis under. 30 seconds a leg. The tuck is what makes it work."),
  pose("Kneeling Hip Flexor Stretch", 90, "kneeling hip flexor stretch tutorial",
    "Half-kneeling, squeeze the back glute and tuck the hips before you lean. 45 seconds a side. Tight hip flexors pull your pelvis forward and load your low back all day."),
  pose("Doorway Chest Stretch", 60, "doorway chest stretch tutorial",
    "Forearm on the frame at shoulder height, step through and turn away. 30 seconds a side. Undoes every press you just did."),
  pose("Calf Stretch", 60, "standing calf stretch wall tutorial",
    "Hands on a wall, back leg straight, heel down, hips forward. 30 seconds a leg. Then soften that back knee for 10 to catch the soleus."),
  pose("Overhead Lat Stretch", 60, "overhead lat stretch tutorial",
    "Hands on a rack or doorframe about hip height, walk back, sit the hips down and let the chest sink. Breathe into the side of your ribs."),
];
