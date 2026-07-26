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

export const firebaseConfig = {
  apiKey: env.VITE_FB_API_KEY || "",
  authDomain: env.VITE_FB_AUTH_DOMAIN || "",
  projectId: env.VITE_FB_PROJECT_ID || "",
  storageBucket: env.VITE_FB_STORAGE_BUCKET || "",
  messagingSenderId: env.VITE_FB_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FB_APP_ID || "",
};

// True only when the essentials are filled in. When false the app
// runs in local-only mode (no login screen, data saved on-device).
export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);
