import "@fontsource-variable/archivo";
import "@fontsource-variable/inter";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { StoreProvider } from "./store.jsx";
import { startUpdates } from "./lib/updater.js";
import "./styles.css";
import "./ui.css";

startUpdates();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
