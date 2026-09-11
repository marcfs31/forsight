---
"@marcfs31/forsight": major
---

Compile the design system with Tailwind CSS v4.

This package's own build (`dist/styles.css`, Storybook) now runs Tailwind 4.3
via `@tailwindcss/cli` / `@tailwindcss/postcss`. Lightning CSS in that
pipeline replaces Autoprefixer. The shipped stylesheet still omits Preflight
and still makes no network calls.

**If you consume `@marcfs31/forsight/styles.css` (the precompiled
stylesheet):** keep importing it. No Tailwind upgrade is required to use the
components. The generated CSS now uses v4 features (`@property`,
`color-mix()`), so it targets Safari 16.4+, Chrome 111+, and Firefox 128+.

**If you consume `@marcfs31/forsight/tailwind-preset` on Tailwind v3:** that
export is unchanged — it is still a v3 JS preset (`presets: [forsightPreset]`
in `tailwind.config`). Stay on Tailwind 3.4. The optional `tailwindcss` peer
range remains `>=3.4`. Token class names (`bg-ink-*`, `text-fg*`,
`bg-accent*`, `rounded-*`, `shadow-*`, `duration-fast` / `duration-base`) are
the same.

**If you consume `@marcfs31/forsight/tailwind.css` on Tailwind v4:** keep
`@import "@marcfs31/forsight/tailwind.css"` after `@import "tailwindcss"`. The
`@theme` mapping now also emits accordion/collapsible keyframes and
`duration-fast` / `duration-base` `@utility` rules, matching the v3 preset.

**If you compile this repo from source:** install Tailwind 4 together with
`@tailwindcss/cli` and `@tailwindcss/postcss`. `tailwindcss` v4 no longer
ships a CLI binary or a PostCSS plugin.
