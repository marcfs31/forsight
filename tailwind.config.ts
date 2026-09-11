import type { Config } from "tailwindcss";
import forsightPreset from "./src/tailwind-preset";

/**
 * Repo-local Tailwind config, loaded by `@config` from package.css (the
 * shipped stylesheet) and globals.css (Storybook). The token → utility
 * mapping lives in src/tailwind-preset.ts, which is also published for
 * Tailwind v3 consumers. v4 ignores `content` — sources are declared with
 * `@source` in those CSS files.
 */
export default {
  presets: [forsightPreset],
} satisfies Config;
