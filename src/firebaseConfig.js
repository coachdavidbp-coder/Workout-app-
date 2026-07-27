// =========================================================
// Firebase configuration.
//
// The app works IMMEDIATELY without this — it stores everything
// locally on the device (local mode). To turn on login + syncing
// across your iPhone and iPad:
//
//   1. Go to https://console.firebase.google.com and create a
//      free project (Spark plan — no card needed).
//   2. Add a "Web app", copy its config values below.
//   3. In the console enable:  Build → Authentication → Sign-in
//      method → Google (and Email/Password if you want it), and
//      Build → Firestore Database → Create database (production
//      mode is fine; rules are in firestore.rules).
//
// You can also provide these via a .env file (see .env.example)
// instead of editing this file — env vars win when present.
// =========================================================

const env = import.meta.env;

// Defaults are the "Us vs Them" project's web config. These Firebase web
// keys are NOT secret — they're meant to ship in client-side code, and your
// data is protected by the Firestore security rules (see firestore.rules),
// not by hiding them. A .env file (see .env.example) still overrides these.
export const firebaseConfig = {
  apiKey: env.VITE_FB_API_KEY || "AIzaSyCarzNFPxkx0ZyABfBmRCqKrJF5elp3-Wo",
  authDomain: env.VITE_FB_AUTH_DOMAIN || "us-vs-them-fd820.firebaseapp.com",
  projectId: env.VITE_FB_PROJECT_ID || "us-vs-them-fd820",
  storageBucket: env.VITE_FB_STORAGE_BUCKET || "us-vs-them-fd820.firebasestorage.app",
  messagingSenderId: env.VITE_FB_MESSAGING_SENDER_ID || "222297222509",
  appId: env.VITE_FB_APP_ID || "1:222297222509:web:a0504d73ad83ac8b42fe64",
};

// True only when the essentials are filled in. When false the app
// runs in local-only mode (no login screen, data saved on-device).
export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);
