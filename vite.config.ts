/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // Slow machines and CI: the page tests render whole screens and can exceed the 5s default.
    testTimeout: 20000,
    setupFiles: ["./src/test/setup.ts"],
  },
});
