import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Tailwind v3 preset, exported as "@marcfs31/forsight/tailwind-preset".
 *
 * Maps the Fors tokens (CSS custom properties in src/styles/tokens.css) into
 * the `bg-*` / `text-*` / `border-*` / `rounded-*` / `shadow-*` utility
 * vocabulary the components are built with, so a consumer app on Tailwind v3
 * can use the same class names in its own markup:
 *
 *   // tailwind.config.ts
 *   import forsPreset from "@marcfs31/forsight/tailwind-preset";
 *   export default { presets: [forsPreset], content: [...] };
 *
 * This repo's own tailwind.config.ts consumes the same preset. Tailwind v4
 * consumers use the "@marcfs31/forsight/tailwind.css" export instead.
 * Keep both in sync.
 */
const forsPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        ink: {
          bg: "var(--fors-ink-bg)",
          surface: "var(--fors-ink-surface)",
          "surface-2": "var(--fors-ink-surface-2)",
          border: "var(--fors-ink-border)",
          "border-subtle": "var(--fors-ink-border-subtle)",
        },
        fg: {
          DEFAULT: "var(--fors-fg)",
          secondary: "var(--fors-fg-secondary)",
          muted: "var(--fors-fg-muted)",
        },
        accent: {
          DEFAULT: "var(--fors-accent)",
          hover: "var(--fors-accent-hover)",
          active: "var(--fors-accent-active)",
          subtle: "var(--fors-accent-subtle)",
          fg: "var(--fors-accent-fg)",
        },
        spark: {
          DEFAULT: "var(--fors-spark)",
          hover: "var(--fors-spark-hover)",
          subtle: "var(--fors-spark-subtle)",
          fg: "var(--fors-spark-fg)",
        },
        danger: {
          DEFAULT: "var(--fors-danger)",
          subtle: "var(--fors-danger-subtle)",
          fg: "var(--fors-danger-fg)",
        },
        success: {
          DEFAULT: "var(--fors-success)",
          subtle: "var(--fors-success-subtle)",
          fg: "var(--fors-success-fg)",
        },
        warning: {
          DEFAULT: "var(--fors-warning)",
          subtle: "var(--fors-warning-subtle)",
          fg: "var(--fors-warning-fg)",
        },
        "focus-ring": "var(--fors-focus-ring)",
        "viz-1": "var(--fors-viz-1)",
        "viz-2": "var(--fors-viz-2)",
        "viz-3": "var(--fors-viz-3)",
        "viz-4": "var(--fors-viz-4)",
        "viz-5": "var(--fors-viz-5)",
        "viz-6": "var(--fors-viz-6)",
        "viz-7": "var(--fors-viz-7)",
        "viz-8": "var(--fors-viz-8)",
      },
      fontFamily: {
        heading: "var(--fors-font-heading)",
        sans: "var(--fors-font-sans)",
        mono: "var(--fors-font-mono)",
      },
      borderRadius: {
        sm: "var(--fors-radius-sm)",
        md: "var(--fors-radius-md)",
        lg: "var(--fors-radius-lg)",
        xl: "var(--fors-radius-xl)",
      },
      transitionDuration: {
        fast: "var(--fors-duration-fast)",
        base: "var(--fors-duration-base)",
      },
      boxShadow: {
        sm: "var(--fors-shadow-sm)",
        md: "var(--fors-shadow-md)",
        lg: "var(--fors-shadow-lg)",
        "focus-ring": "0 0 0 3px var(--fors-focus-ring)",
      },
      keyframes: {
        // tailwindcss-animate's fade/zoom/slide utilities cover every other
        // overlay; Accordion animates a measured height instead, which
        // needs its own keyframes reading Radix's own CSS variable.
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Collapsible is a different Radix primitive with its own height
        // variable — Accordion's keyframes above don't apply to it.
        "collapsible-down": {
          from: { height: "0" },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down var(--fors-duration-base) ease-out",
        "accordion-up": "accordion-up var(--fors-duration-base) ease-out",
        "collapsible-down": "collapsible-down var(--fors-duration-base) ease-out",
        "collapsible-up": "collapsible-up var(--fors-duration-base) ease-out",
      },
    },
  },
  plugins: [animate],
};

export default forsPreset;
