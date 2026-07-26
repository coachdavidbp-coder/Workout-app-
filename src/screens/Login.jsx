import { useState } from "react";
import { loginGoogle, loginApple, loginEmail } from "../lib/firebase.js";
import BrandLogo from "../components/BrandLogo.jsx";

export default function Login() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const wrap = (fn) => async () => {
    setErr("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = wrap(() => loginEmail(email.trim(), pw, mode === "signup"));

  return (
    <div className="login-screen">
      <div className="beams" />

      <div className="login-brand">
        <BrandLogo height={62} style={{ height: "auto", width: "min(78%, 320px)" }} />
        <p className="tagline">Your training plan, meals and weight — synced on every device.</p>
      </div>

      <button className="oauth-btn g-btn" onClick={wrap(loginGoogle)} disabled={busy}>
        <GoogleG /> Continue with Google
      </button>
      <button className="oauth-btn apple-btn" onClick={wrap(loginApple)} disabled={busy}>
         Continue with Apple
      </button>

      <div className="login-divider">or use email</div>

      <input
        className="login-input"
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="login-input"
        type="password"
        placeholder="Password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />

      {err && <p className="login-err">{err}</p>}

      <button className="btn btn-primary btn-block" onClick={submitEmail} disabled={busy}>
        {busy ? "…" : mode === "signup" ? "Create Account" : "Sign In"}
      </button>

      <div style={{ textAlign: "center" }}>
        <button className="login-toggle" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
          {mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>

      <p className="login-foot">Secured by Firebase · your data stays yours</p>
    </div>
  );
}

function friendly(e) {
  const c = e?.code || "";
  if (c.includes("popup-closed") || c.includes("cancelled")) return "Sign-in was cancelled.";
  if (c.includes("wrong-password") || c.includes("invalid-credential")) return "Wrong email or password.";
  if (c.includes("user-not-found")) return "No account with that email — create one below.";
  if (c.includes("email-already-in-use")) return "That email already has an account — sign in instead.";
  if (c.includes("weak-password")) return "Password should be at least 6 characters.";
  if (c.includes("invalid-email")) return "That doesn't look like a valid email.";
  if (c.includes("operation-not-allowed")) return "That sign-in method isn't enabled in Firebase yet.";
  return "Something went wrong. Try again.";
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.5 2.6 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.9-9.8 6.9-17.4z" />
      <path fill="#FBBC05" d="M10.3 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.7 2.2-6.4 0-11.8-3.7-13.7-9.4l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
