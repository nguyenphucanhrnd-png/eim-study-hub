import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { afterPaint } from "./data";
import { CLOUD_ENABLED, hasStoredSession, urlHasAuthCallback } from "./lib/sync/cloud";
import { useAuth } from "./store/authStore";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root element missing");

// Accounts & sync: load Supabase only for returning signed-in users or when coming back from an auth e-mail.
if (CLOUD_ENABLED && (hasStoredSession() || urlHasAuthCallback())) {
  void afterPaint()
    .then(() => useAuth.getState().init())
    .catch(() => undefined);
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
