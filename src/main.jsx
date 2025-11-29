import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./app.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Register PWA service worker after initial load to avoid render-blocking
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        registerSW({
          immediate: false,
          onRegistered(r) {
            console.log("Service Worker registered:", r);
            // Check for updates periodically
            if (r) {
              setInterval(() => {
                r.update();
              }, 60 * 60 * 1000); // Check every hour
            }
          },
          onRegisterError(error) {
            console.error("Service Worker registration error:", error);
          },
          onNeedRefresh() {
            // Force update when new version is available
            window.location.reload();
          },
        });
      })
      .catch((error) => {
        console.error("Failed to load service worker registration:", error);
      });
  });
}
