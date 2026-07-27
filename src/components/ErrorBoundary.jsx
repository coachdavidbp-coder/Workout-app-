import { Component } from "react";

// Catches render errors so one bad screen can't white-screen the app.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("[us-vs-them] render error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="app-shell">
          <div style={{ margin: "auto", textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏈</div>
            <h2 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase" }}>Fumble.</h2>
            <p style={{ color: "var(--mu)", margin: "10px 0 20px" }}>
              Something glitched, but your data's safe on this device.
            </p>
            <button className="btn btn-primary" onClick={() => location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
