import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto", // ← KEEP as a STRING "auto"
      includeAssets: ["/education.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            // Don't cache auth endpoints - always go to network (GET and POST)
            urlPattern:
              /^https:\/\/.*\.supabase\.co\/.*\/auth\/v1\/(token|logout|user)/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-auth",
            },
            method: "GET",
          },
          {
            // Don't cache auth POST requests (logout, signin, etc.)
            urlPattern:
              /^https:\/\/.*\.supabase\.co\/.*\/auth\/v1\/(token|logout|user|signin|signup)/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-auth",
            },
            method: "POST",
          },
          {
            // Cache other Supabase API calls with NetworkFirst strategy
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: "StudySpot",
        short_name: "StudySpot",
        description: "Find and manage your perfect study spots.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/education.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
