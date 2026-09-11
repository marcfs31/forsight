import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// This dashboard's own test suite. Deliberately separate from the root
// design-system package's vitest.config.ts — forsight/web consumes
// @marcfs31/forsight as a pinned published dependency rather than the
// workspace source (see CLAUDE.md, "two artifacts"), so it gets its own
// minimal jsdom harness here instead of sharing the root project's.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
  },
});
