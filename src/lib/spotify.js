// =========================================================
// Spotify "now playing" — free, using the Web API with PKCE.
// Shows what you're currently listening to, Nike-style.
//
// Setup (one-time, free): create an app at
// https://developer.spotify.com/dashboard, add your deployed
// URL as a Redirect URI, and put the Client ID in the env var
// VITE_SPOTIFY_CLIENT_ID. No client secret needed (PKCE).
// =========================================================

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
export const spotifyEnabled = !!CLIENT_ID;

const SCOPES = "user-read-currently-playing user-read-playback-state user-modify-playback-state";
const LS = {
  access: "svt_sp_access",
  refresh: "svt_sp_refresh",
  expires: "svt_sp_expires",
  verifier: "svt_sp_verifier",
};

// redirect URI = the app's own origin (must match a URI added in the dashboard)
function redirectUri() {
  return window.location.origin + window.location.pathname;
}

// ---------- PKCE helpers ----------
function randString(len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
async function sha256(str) {
  const data = new TextEncoder().encode(str);
  return crypto.subtle.digest("SHA-256", data);
}
function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ---------- connect / callback ----------
export async function connectSpotify() {
  if (!CLIENT_ID) return;
  const verifier = randString(64);
  localStorage.setItem(LS.verifier, verifier);
  const challenge = base64url(await sha256(verifier));
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

// Call once on app load. If we came back from Spotify with ?code=...,
// exchange it for tokens and clean the URL. Returns true if it handled one.
export async function handleSpotifyRedirect() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (!code || !CLIENT_ID) return false;
  const verifier = localStorage.getItem(LS.verifier);
  if (!verifier) return false;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(),
        code_verifier: verifier,
      }),
    });
    if (!res.ok) throw new Error("token exchange failed");
    saveTokens(await res.json());
    localStorage.removeItem(LS.verifier);
  } catch (e) {
    // ignore — user can retry connect
  }
  // strip the auth params from the URL either way
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  return true;
}

function saveTokens(data) {
  if (data.access_token) localStorage.setItem(LS.access, data.access_token);
  if (data.refresh_token) localStorage.setItem(LS.refresh, data.refresh_token);
  if (data.expires_in) localStorage.setItem(LS.expires, String(Date.now() + data.expires_in * 1000));
}

export function isSpotifyConnected() {
  return !!localStorage.getItem(LS.refresh);
}

export function disconnectSpotify() {
  localStorage.removeItem(LS.access);
  localStorage.removeItem(LS.refresh);
  localStorage.removeItem(LS.expires);
}

async function refreshIfNeeded() {
  const expires = parseInt(localStorage.getItem(LS.expires) || "0", 10);
  if (Date.now() < expires - 15000 && localStorage.getItem(LS.access)) return true;
  const refresh = localStorage.getItem(LS.refresh);
  if (!refresh || !CLIENT_ID) return false;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: refresh,
      }),
    });
    if (!res.ok) throw new Error("refresh failed");
    saveTokens(await res.json());
    return true;
  } catch (e) {
    return false;
  }
}

// Returns the full player state:
//   { active, playing, title, artist, art, url, shuffle, repeat }
// active:false means nothing is playing on any device right now.
export async function nowPlaying() {
  if (!isSpotifyConnected()) return null;
  if (!(await refreshIfNeeded())) return null;
  const token = localStorage.getItem(LS.access);
  try {
    const res = await fetch("https://api.spotify.com/v1/me/player", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204 || res.status === 202) return { active: false };
    if (res.status === 401) { disconnectSpotify(); return null; }
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.item) return { active: false };
    return {
      active: true,
      playing: !!data.is_playing,
      title: data.item.name,
      artist: (data.item.artists || []).map((a) => a.name).join(", "),
      art: data.item.album?.images?.[0]?.url || null,
      url: data.item.external_urls?.spotify || "https://open.spotify.com",
      shuffle: !!data.shuffle_state,
      repeat: data.repeat_state || "off", // off | context | track
    };
  } catch (e) {
    return null;
  }
}

// Playback controls. Returns { ok, premium, noDevice }.
// Controlling playback needs Spotify Premium + an active device.
export async function control(action, arg) {
  if (!isSpotifyConnected()) return { ok: false };
  if (!(await refreshIfNeeded())) return { ok: false };
  const token = localStorage.getItem(LS.access);
  let path, method;
  switch (action) {
    case "play": path = "me/player/play"; method = "PUT"; break;
    case "pause": path = "me/player/pause"; method = "PUT"; break;
    case "next": path = "me/player/next"; method = "POST"; break;
    case "previous": path = "me/player/previous"; method = "POST"; break;
    case "shuffle": path = `me/player/shuffle?state=${arg ? "true" : "false"}`; method = "PUT"; break;
    case "repeat": path = `me/player/repeat?state=${arg}`; method = "PUT"; break;
    default: return { ok: false };
  }
  try {
    const res = await fetch(`https://api.spotify.com/v1/${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403) return { ok: false, premium: true };
    if (res.status === 404) return { ok: false, noDevice: true };
    return { ok: res.ok };
  } catch (e) {
    return { ok: false };
  }
}
