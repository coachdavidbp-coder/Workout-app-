import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Set PREVIEW=1 to produce a single self-contained index.html (everything
// inlined, no service worker) for hosting a quick login-free preview.
const PREVIEW = !!process.env.PREVIEW;

export default defineConfig(async () => {
  const plugins = [react()];

  if (PREVIEW) {
    const { viteSingleFile } = await import("vite-plugin-singlefile");
    plugins.push(viteSingleFile());
  } else {
    plugins.push(
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icons/apple-touch-icon.png", "icons/favicon.svg"],
        manifest: {
          name: "Us vs Them — Training",
          short_name: "Us vs Them",
          description:
            "Your college football training plan: lifts, runs, meals and weight — synced across your devices.",
          theme_color: "#0A1020",
          background_color: "#0A1020",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/icons/icon-512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
          navigateFallback: "/index.html",
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/(world|.*\.openfoodfacts)\.org\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "off-food-api",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
              },
            },
          ],
        },
      })
    );
  }

  return {
    plugins,
    build: PREVIEW
      ? { assetsInlineLimit: 100000000, cssCodeSplit: false, outDir: "dist-preview" }
      : {
          rollupOptions: {
            output: {
              manualChunks: {
                firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
                react: ["react", "react-dom"],
              },
            },
          },
        },
  };
});
