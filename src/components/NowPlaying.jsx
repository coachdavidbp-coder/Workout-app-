import { useEffect, useRef, useState, useCallback } from "react";
import MusicButton from "./MusicButton.jsx";
import {
  spotifyEnabled, isSpotifyConnected, connectSpotify, nowPlaying, control,
  myPlaylists, playContext,
} from "../lib/spotify.js";
import { haptic } from "../lib/fx.js";
import { toast } from "../lib/toast.js";

// Full-size Spotify player for the workout screen: art, track, and
// shuffle / prev / play-pause / next / repeat. Falls back to a plain
// "open Spotify" launcher when Spotify isn't set up or connected.
export default function NowPlaying() {
  const [connected, setConnected] = useState(isSpotifyConnected());
  const [track, setTrack] = useState(null);
  const [lists, setLists] = useState(null);   // null = not loaded, [] = none
  const [showLists, setShowLists] = useState(false);
  const [listErr, setListErr] = useState("");
  const timer = useRef(null);

  const loadLists = async () => {
    setListErr("");
    const r = await myPlaylists();
    if (!r) { setListErr("Couldn't load playlists."); setLists([]); return; }
    if (r.needsScope) {
      setListErr("Reconnect Spotify to give the app permission to read your playlists.");
      setLists([]);
      return;
    }
    setLists(r.items);
  };

  const openLists = async () => {
    haptic();
    const next = !showLists;
    setShowLists(next);
    if (next && lists === null) await loadLists();
  };

  const startList = async (pl) => {
    haptic();
    const r = await playContext(pl.uri);
    if (r.ok) {
      toast({ emoji: "🎵", title: "Playing", sub: pl.name, tone: "good" });
      setTimeout(poll, 900);
      return;
    }
    // Free account or no active device → hand off to the Spotify app.
    toast({
      emoji: "↗️",
      title: r.premium ? "Opening Spotify" : "Opening Spotify",
      sub: r.premium ? "In-app playback needs Premium" : "Start playback there, then come back",
      tone: "neutral",
    });
    window.open(pl.url, "_blank", "noopener");
  };

  const poll = useCallback(async () => {
    const t = await nowPlaying();
    if (t === null && !isSpotifyConnected()) { setConnected(false); return; }
    setTrack(t);
  }, []);

  useEffect(() => {
    if (!spotifyEnabled || !connected) return;
    let alive = true;
    const run = async () => { if (alive) await poll(); };
    run();
    timer.current = setInterval(run, 8000);
    return () => { alive = false; clearInterval(timer.current); };
  }, [connected, poll]);

  const act = async (action, arg) => {
    haptic();
    const r = await control(action, arg);
    if (r.premium) toast({ emoji: "🎧", title: "Spotify Premium needed", sub: "Playback control requires a Premium account", tone: "warn" });
    else if (r.noDevice) toast({ emoji: "🔈", title: "No active device", sub: "Start playing on Spotify first, then control it here", tone: "warn" });
    // give Spotify a beat, then refresh the widget
    setTimeout(poll, 350);
  };

  if (!spotifyEnabled) return <div className="np-wrap"><MusicButton /></div>;

  if (!connected) {
    return (
      <div className="np-wrap">
        <button className="np-connect" onClick={() => { haptic(); connectSpotify(); }}>
          <SpotifyIcon /> <span>Connect Spotify</span>
        </button>
      </div>
    );
  }

  const playing = track?.active && track?.playing;
  const hasTrack = track?.active && track?.title;

  return (
    <div className="np-card">
      <div className="np-top">
        {track?.art
          ? <img className="np-cover" src={track.art} alt="" />
          : <span className="np-cover np-cover-fallback"><SpotifyIcon /></span>}
        <a
          className="np-info"
          href={track?.url || "https://open.spotify.com"}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="np-now">{hasTrack ? "Now playing" : "Spotify"}</span>
          <span className="np-track">{hasTrack ? track.title : "Nothing playing"}</span>
          <span className="np-by">{hasTrack ? track.artist : "Start a song to control it here"}</span>
        </a>
        {playing && <span className="np-eq" aria-hidden="true"><i /><i /><i /></span>}
      </div>

      <div className="np-controls">
        <button
          className={`np-btn ${track?.shuffle ? "on" : ""}`}
          onClick={() => act("shuffle", !track?.shuffle)}
          aria-label="Shuffle"
        >
          <IconShuffle />
        </button>
        <button className="np-btn" onClick={() => act("previous")} aria-label="Previous track">
          <IconPrev />
        </button>
        <button
          className="np-btn np-play"
          onClick={() => act(playing ? "pause" : "play")}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <button className="np-btn" onClick={() => act("next")} aria-label="Next track">
          <IconNext />
        </button>
        <button
          className={`np-btn ${track?.repeat && track.repeat !== "off" ? "on" : ""}`}
          onClick={() => act("repeat", nextRepeat(track?.repeat))}
          aria-label="Repeat"
        >
          <IconRepeat one={track?.repeat === "track"} />
        </button>
      </div>

      <button className="np-lists-toggle" onClick={openLists}>
        {showLists ? "▾ Hide playlists" : "▸ My playlists"}
      </button>

      {showLists && (
        <div className="np-lists">
          {listErr && (
            <div className="np-list-err">
              {listErr}
              {/needs?|permission/i.test(listErr) && (
                <button className="np-reconnect" onClick={() => connectSpotify()}>Reconnect Spotify</button>
              )}
            </div>
          )}
          {lists === null && !listErr && <div className="np-list-empty">Loading…</div>}
          {lists && lists.length === 0 && !listErr && <div className="np-list-empty">No playlists found.</div>}
          {(lists || []).map((pl) => (
            <button className="np-list-row" key={pl.id} onClick={() => startList(pl)}>
              {pl.art
                ? <img className="np-list-art" src={pl.art} alt="" />
                : <span className="np-list-art np-list-art-fb">♪</span>}
              <span className="np-list-txt">
                <span className="np-list-name">{pl.name}</span>
                <span className="np-list-sub">{pl.tracks} tracks{pl.owner ? ` · ${pl.owner}` : ""}</span>
              </span>
              <span className="np-list-play">▶</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function nextRepeat(cur) {
  // off → context (repeat all) → track (repeat one) → off
  return cur === "off" || !cur ? "context" : cur === "context" ? "track" : "off";
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.8.8 0 01-1.1.3c-3-1.8-6.8-2.2-11.2-1.2a.8.8 0 11-.4-1.6c4.8-1.1 9-.6 12.4 1.4.4.2.5.7.3 1.1zm1.2-2.7a1 1 0 01-1.4.3c-3.5-2.1-8.7-2.7-12.8-1.5a1 1 0 11-.6-1.9c4.7-1.4 10.5-.7 14.5 1.7.5.3.6 1 .3 1.4zm.1-2.8C13.7 8.6 7.3 8.4 3.6 9.5A1.2 1.2 0 112.9 7.2c4.3-1.3 11.3-1 15.8 1.6a1.2 1.2 0 01-1.2 2.1z" />
    </svg>
  );
}
const IconPlay = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
const IconPause = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>;
const IconNext = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 5l8 7-8 7zM16 5h2v14h-2z" /></svg>;
const IconPrev = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 5l-8 7 8 7zM6 5h2v14H6z" /></svg>;
const IconShuffle = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>;
const IconRepeat = ({ one }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    {one && <text x="12" y="15" fontSize="8" fill="currentColor" stroke="none" textAnchor="middle">1</text>}
  </svg>
);
