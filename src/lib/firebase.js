// =========================================================
// Firebase init + auth/firestore helpers.
// All exports degrade gracefully when Firebase isn't configured.
// =========================================================
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as fbSignOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { firebaseConfig, firebaseEnabled } from "../firebaseConfig.js";

let app = null;
let auth = null;
let db = null;

if (firebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.warn("[us-vs-them] Firebase init failed, using local mode:", e);
    app = null;
  }
}

export const isCloud = () => Boolean(app);

// ---- auth ----
export function watchAuth(cb) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, cb);
}

export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

export async function loginApple() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

export async function loginEmail(email, password, isSignup) {
  const fn = isSignup ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
  const res = await fn(auth, email, password);
  return res.user;
}

export async function signOut() {
  if (auth) await fbSignOut(auth);
}

// ---- firestore per-user document ----
function userDoc(uid) {
  return doc(db, "users", uid);
}

export async function cloudLoad(uid) {
  const snap = await getDoc(userDoc(uid));
  return snap.exists() ? snap.data() : null;
}

export async function cloudSave(uid, data) {
  await setDoc(userDoc(uid), data, { merge: true });
}

export function cloudWatch(uid, cb) {
  return onSnapshot(userDoc(uid), (snap) => {
    if (snap.exists()) cb(snap.data());
  });
}
