import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    port: 5173
  },
  define: {
    "process.env": process.env // Enable process.env
  }
});
