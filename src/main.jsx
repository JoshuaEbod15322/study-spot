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
    import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({
        immediate: false,
      });
    });
  });
}
