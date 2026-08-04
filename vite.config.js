import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Stamped into the app so a build can be identified from the phone — the
// quickest way to answer "am I actually looking at the new version?".
function buildId() {
  if (process.env.BUILD_ID) return process.env.BUILD_ID;
  let sha = "";
  try {
    sha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch (e) { /* not a checkout — fall back to the date alone */ }
  const d = new Date().toISOString().slice(0, 10);
  return sha ? `${d} · ${sha}` : d;
}

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
        // lib/updater.js does the registering, so it can also keep checking
        // for new builds and reload when one lands. The script the plugin
        // injects by default registers once and never looks again.
        injectRegister: null,
        includeAssets: ["icons/apple-touch-icon.png", "icons/favicon.svg"],
        manifest: {
          name: "Us vs Them — Training",
          short_name: "Us vs Them",
          description:
            "Your college football training plan: lifts, runs, meals and weight — synced across your devices.",
          theme_color: "#000000",
          background_color: "#000000",
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
          globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
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
    define: { __BUILD_ID__: JSON.stringify(buildId()) },
    resolve: PREVIEW
      ? {
          alias: {
            "virtual:pwa-register": fileURLToPath(
              new URL("./src/lib/pwa-register-stub.js", import.meta.url)
            ),
          },
        }
      : {},
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
