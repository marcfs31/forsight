import { defineConfig } from "tsup";

export default defineConfig({
  // `index` is the client component bundle (its source starts with
  // "use client", which tsup preserves per-entry); `theme` is the
  // server-safe utilities entry with no directive; `tailwind-preset` is the
  // Tailwind v3 JS preset (build-time only, never imported by app code).
  // The library's own v4 build loads it via `@config` rather than as a
  // runtime import.
  entry: {
    index: "src/index.ts",
    theme: "src/theme-entry.ts",
    "tailwind-preset": "src/tailwind-preset.ts",
  },
  // ESM is the primary target; the CJS build is a compatibility shim so
  // `require()` from CommonJS tooling still resolves (validated by
  // `npm run test:package`).
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
});
