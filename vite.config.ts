import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const headers = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["path"],
    }),
  ],
  server: {
    headers,
  },
  preview: {
    headers,
  },
  optimizeDeps: {
    exclude: ["@rolldown/browser"],
  },
});
