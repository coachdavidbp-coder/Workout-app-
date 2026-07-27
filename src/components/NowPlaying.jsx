import { useEffect, useRef, useState } from "react";
import MusicButton from "./MusicButton.jsx";
import {
  spotifyEnabled, isSpotifyConnected, connectSpotify, disconnectSpotify, nowPlaying,
} from "../lib/spotify.js";
import { haptic } from "../lib/fx.js";

// Shows what's playing on Spotify, Nike-style. Falls back to a plain
// "open Spotify" launcher when Spotify isn't set up or connected.
export default function NowPlaying() {
  const [connected, setConnected] = useState(isSpotifyConnected());
  const [track, setTrack] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!spotifyEnabled || !connected) return;
    let alive = true;
    const poll = async () => {
      const t = await nowPlaying();
      if (!alive) return;
      if (t === null && !isSpotifyConnected()) setConnected(false);
      else setTrack(t);
    };
    poll();
    timer.current = setInterval(poll, 8000);
    return () => { alive = false; clearInterval(timer.current); };
  }, [connected]);

  // Spotify not configured for this build → plain launcher
  if (!spotifyEnabled) return <MusicButton compact />;

  // configured but not linked yet → connect chip
  if (!connected) {
    return (
      <button className="music-btn spotify-connect" onClick={() => { haptic(); connectSpotify(); }} aria-label="Connect Spotify">
        <SpotifyIcon />
        <span>Connect</span>
      </button>
    );
  }

  // connected but nothing playing
  if (!track || track.playing === false || !track.title) {
    return (
      <a className="music-btn" href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" aria-label="Open Spotify">
        <SpotifyIcon />
        <span>Not playing</span>
      </a>
    );
  }

  return (
    <a className="now-playing" href={track.url} target="_blank" rel="noopener noreferrer" title="Open in Spotify">
      {track.art
        ? <img className="np-art" src={track.art} alt="" />
        : <span className="np-art np-art-fallback"><SpotifyIcon /></span>}
      <span className="np-meta">
        <span className="np-title">{track.title}</span>
        <span className="np-artist">{track.artist}</span>
      </span>
      <span className="np-eq" aria-hidden="true"><i /><i /><i /></span>
    </a>
  );
}

export function SpotifyDisconnect({ onDone }) {
  if (!spotifyEnabled || !isSpotifyConnected()) return null;
  return (
    <button className="btn" onClick={() => { disconnectSpotify(); onDone?.(); }}>
      Disconnect Spotify
    </button>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.8.8 0 01-1.1.3c-3-1.8-6.8-2.2-11.2-1.2a.8.8 0 11-.4-1.6c4.8-1.1 9-.6 12.4 1.4.4.2.5.7.3 1.1zm1.2-2.7a1 1 0 01-1.4.3c-3.5-2.1-8.7-2.7-12.8-1.5a1 1 0 11-.6-1.9c4.7-1.4 10.5-.7 14.5 1.7.5.3.6 1 .3 1.4zm.1-2.8C13.7 8.6 7.3 8.4 3.6 9.5A1.2 1.2 0 112.9 7.2c4.3-1.3 11.3-1 15.8 1.6a1.2 1.2 0 01-1.2 2.1z" />
    </svg>
  );
}
