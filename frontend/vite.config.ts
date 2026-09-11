import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
  build: {
    // Slightly larger source maps in exchange for readable production
    // stack traces. The app already ships an ErrorBoundary that logs the
    // component stack; without maps those logs point at minified names
    // and are effectively unusable for diagnosing a real user's crash.
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split the long-lived dependencies out of the app chunk.
        //
        // Everything used to land in one ~560 KB entry file, so shipping a
        // one-line copy fix invalidated React, framer-motion and Radix in
        // every returning visitor's cache along with it. These three change
        // only when their versions do, which is a handful of times a year —
        // pinning them to their own files means a normal deploy re-downloads
        // app code alone.
        //
        // They are deliberately grouped rather than split one-per-package:
        // react/react-dom/scheduler are a single unit that must not
        // initialise out of order, and framer-motion + Radix are both
        // needed by the very first screen anyway, so splitting them further
        // would only add round-trips.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\/]node_modules[\/](react|react-dom|scheduler|react-router|react-router-dom)[\/]/.test(id)) {
            return "vendor-react";
          }
          if (/[\/]node_modules[\/](framer-motion|motion-dom|motion-utils)[\/]/.test(id)) {
            return "vendor-motion";
          }
          if (/[\/]node_modules[\/](@radix-ui|axios|zustand|clsx|tailwind-merge)[\/]/.test(id)) {
            return "vendor-ui";
          }
        },
      },
    },
    // With the vendor chunks carved out, the remaining app chunk sits well
    // under Rollup's default 500 KB advisory. Kept explicit so the warning
    // stays meaningful instead of being permanently silenced.
    chunkSizeWarningLimit: 500,
  },
});
