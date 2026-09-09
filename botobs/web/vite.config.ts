import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base "./" so the built assets resolve correctly when served from an
// embedded filesystem at an arbitrary mount point, not just "/".
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    // `npm run dev` here talks to a real `botobs run` process for its data —
    // start that separately (`go run . run`) on the default :8080.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
