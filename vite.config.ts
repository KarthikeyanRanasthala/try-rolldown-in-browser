import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const headers = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Expose the binding module for direct access to __volume (memfs)
      "@rolldown/browser/binding": path.resolve(
        __dirname,
        "./node_modules/@rolldown/browser/dist/rolldown-binding.wasi-browser.js"
      ),
    },
  },
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
