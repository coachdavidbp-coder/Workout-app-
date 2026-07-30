// =========================================================
// Resolves a real, embeddable YouTube video id for a recipe AT RUNTIME
// (on the device, which has internet) instead of shipping hardcoded ids
// that can't be verified at build time and rot into dead links.
//
// Results are cached in localStorage, so each recipe costs one search
// once — the free YouTube Data API quota (10,000 units/day ≈ 100
// searches/day) is plenty for personal use.
//
// No key configured → resolve() returns null and the UI falls back to a
// "watch on YouTube" link, so nothing breaks.
// =========================================================
const KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "";
const CACHE_PREFIX = "yt:v1:";
const MISS_TTL = 1000 * 60 * 60 * 24; // retry a failed lookup after a day

export const youtubeSearchEnabled = !!KEY;

function cacheGet(q) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + q);
    if (!raw) return undefined;
    const rec = JSON.parse(raw);
    if (rec.id) return rec.id;
    if (Date.now() - (rec.t || 0) < MISS_TTL) return null; // remembered miss
    return undefined;
  } catch (e) { return undefined; }
}

function cacheSet(q, id) {
  try {
    localStorage.setItem(CACHE_PREFIX + q, JSON.stringify({ id: id || null, t: Date.now() }));
  } catch (e) { /* storage full — fine, we just re-search later */ }
}

// Returns a videoId string, or null when we can't get one.
export async function resolveVideoId(query, signal) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;

  const hit = cacheGet(q);
  if (hit !== undefined) return hit;
  if (!KEY) return null;

  const url =
    "https://www.googleapis.com/youtube/v3/search" +
    "?part=snippet&type=video&videoEmbeddable=true&maxResults=1&safeSearch=moderate" +
    `&q=${encodeURIComponent(q)}&key=${KEY}`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      // 403 = quota exhausted or key restricted; remember the miss briefly
      cacheSet(q, null);
      return null;
    }
    const data = await res.json();
    const id = data?.items?.[0]?.id?.videoId || null;
    cacheSet(q, id);
    return id;
  } catch (e) {
    if (e.name !== "AbortError") cacheSet(q, null);
    return null;
  }
}

export function embedUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
}
