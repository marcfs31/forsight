// Server-safe entry: "@marcfs31/forsight/theme". No "use client" — these
// are pure functions and data, callable from a React Server Component (e.g. a
// Next.js `app/layout.tsx` to emit the anti-flash script). The component
// bundle ("@marcfs31/forsight") is a separate client entry.

export {
  FORS_THEMES,
  applyForsTheme,
  forsAntiFlashScript,
  type ForsTheme,
  type ForsAntiFlashOptions,
} from "./theme";
export { FORS_PALETTES, DARK_PALETTE, LIGHT_PALETTE, type ForsPalette } from "./tokens/palettes";
export { cn } from "./lib/cn";
