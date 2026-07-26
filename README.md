# US vs Them — Football Training Tracker

A personal college-football training app (PWA) for iPhone & iPad. Log your lifts,
runs, meals and weight through a 4-week program built around treadmill + 55 lb
dumbbells and your GLP-1 journey.

**Design:** "Royal" — deep navy, electric blue, self-hosted Archivo + Inter.
Installable, works offline, and syncs across devices when Firebase is turned on.

## Features

- **Train** — Sunday-first day strip, week 1–4 selector. Lift days show set×rep
  per week with inline logging (weight used, reps per set, start/end weight) and a
  how-to **video pop-up** for each lift. Cardio days highlight the week's protocol
  and let you log **mph + incline per interval** with top-speed tracking. Plus a
  daily "how you feel" rating and "Mark Complete."
- **Meals** — Daily calorie / protein / water rings. Add food from a built-in
  common-foods table or search the full **Open Food Facts** database (+ barcode
  lookup); pick a portion and macros auto-calculate. Meal ideas, grocery list and
  GLP-1 notes included.
- **Weight** — Trend chart (seeded from your scale history), body-fat, "since
  start" delta, range filters, and a weigh-in log.
- **You** — Profile, goals, sync status, sign out.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # preview the production build
```

Without any Firebase config the app runs in **local mode** — no login, everything
saved on the device via `localStorage`. That's enough to use it fully on one phone.

## Turn on login + cross-device sync (free)

1. Create a free project at <https://console.firebase.google.com> (Spark plan — no
   card needed).
2. Add a **Web app** and copy its config values.
3. Either paste them into `src/firebaseConfig.js`, or copy `.env.example` to `.env`
   and fill in the `VITE_FB_*` values (env vars win).
4. In the Firebase console enable:
   - **Authentication → Sign-in method →** Google (and Email/Password if you want).
     For Apple sign-in you need an Apple Developer account; it's optional.
   - **Firestore Database → Create database.** Then publish the rules in
     `firestore.rules` (each user can only read/write their own document).
5. Rebuild. You'll now get the login screen and your data follows you across iPhone
   and iPad.

## Deploy free (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # public dir: dist   • single-page app: yes
npm run build
firebase deploy
```

Then open the live URL in **Safari on your iPhone → Share → Add to Home Screen.**
It installs with its own icon, opens full-screen, and works offline.

(Netlify or Vercel work too — build command `npm run build`, publish directory
`dist`.)

## Notes

- **Lift videos:** each exercise opens a "Watch how-to on YouTube" search that's
  always correct. To embed a specific clip inline instead, set that exercise's
  `video` field in `src/data/plan.js` to a YouTube video id.
- **Your weight history** from the scale screenshots is pre-loaded in
  `src/store.jsx` (`SEED_WEIGHTS`) so the chart isn't empty on day one.
- No medical advice — confirm training/nutrition load with your prescribing doctor.
