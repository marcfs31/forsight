---
"@marcfs31/fors-observability-design-system": minor
---

Ready the package for use as a dependency in Tailwind apps:

- New `@marcfs31/fors-observability-design-system/tailwind.css` export — a Tailwind v4 `@theme` mapping so a consumer's own markup can use the token utilities (`bg-accent`, `text-fg-muted`, `rounded-md`, …).
- New `@marcfs31/fors-observability-design-system/tailwind-preset` export — the same mapping as a Tailwind v3 preset (this repo's own config now consumes it). `tailwindcss` is declared as an optional peer.
- `sideEffects` now lists the shipped `.css` files instead of `false`, so bundlers that honor the flag literally never tree-shake `import "@marcfs31/fors-observability-design-system/styles.css"`.
- `./package.json` is exported for tooling that reads package metadata.
- New `npm run test:consumer` (also a CI job): packs the tarball, installs it into a Next.js 16 / React 19 / Tailwind v4 fixture app and builds it, verifying the RSC `"use client"` boundary, the stylesheet surviving the bundler, and the `tailwind.css` mapping.
