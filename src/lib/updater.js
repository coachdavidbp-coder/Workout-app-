// =========================================================
// Keeping the installed app on the current build.
//
// The service worker was registered and then left alone. Workbox precaches
// index.html and serves navigations from that cache, so a home-screen app
// keeps rendering the build it installed with: the new worker only takes over
// on a later launch, and the page already on screen never reloads. That is how
// you end up looking at a screen that shipped two deploys ago.
//
// So: ask the browser for a new worker whenever the app comes back to the
// front, and reload once one activates. The reload is what actually swaps the
// UI — activating the worker on its own does nothing to a page already loaded.
//
// Never mid-set, though. A reload during a guided block would throw away the
// step you're on, so checks are skipped while a timer, a sheet or the intro is
// up, and run the next time the app is idle.
// =========================================================

import { registerSW } from "virtual:pwa-register";

const CHECK_MS = 15 * 60 * 1000;   // while the app sits open in front of you
const SETTLE_MS = 1500;            // let a launch finish before asking

// Anything that would lose its place if the page reloaded underneath it.
const BUSY = ".timer-overlay, .scrim, .splash-intro";
const busy = () => !!document.querySelector(BUSY);

let reg = null;
let pending = false;   // a check was due while busy
let timer = null;

async function check(force = false) {
  if (!reg) return false;
  if (!force && busy()) { pending = true; return false; }
  pending = false;
  try {
    await reg.update();
    return true;
  } catch (e) {
    return false;   // offline, or the host is unreachable — try again later
  }
}

export function startUpdates() {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, r) {
      reg = r;
      if (!reg) return;
      setTimeout(() => check(), SETTLE_MS);
      timer = setInterval(() => { if (!document.hidden) check(); }, CHECK_MS);
    },
  });

  // Coming back to the app is the natural moment: it's the closest thing a
  // standalone PWA has to a fresh launch, and nothing is running.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) setTimeout(() => check(), 400);
  });

  // A check we had to skip earlier — take the first quiet moment after.
  document.addEventListener("click", () => {
    if (pending && !busy()) check();
  }, { passive: true });

  return () => { clearInterval(timer); };
}

// Settings → "Check for updates". Forces the check even if something is open,
// because here the tap *is* the consent to reload.
export async function checkNow() {
  if (!reg) return "unsupported";
  const before = reg.waiting || reg.installing;
  const ok = await check(true);
  if (!ok) return "offline";
  // Give a new worker a moment to show up; if one does, the registration's
  // own listener reloads us and this return value never gets used.
  await new Promise((r) => setTimeout(r, 1200));
  return reg.waiting || reg.installing || before ? "updating" : "current";
}

export const buildId = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "dev";
