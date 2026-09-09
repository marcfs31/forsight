# Forsight

[![CI](https://github.com/marcfs31/forsight/actions/workflows/ci.yml/badge.svg)](https://github.com/marcfs31/forsight/actions/workflows/ci.yml)
[![Storybook](https://img.shields.io/badge/Storybook-live-16C7B0)](https://marcfs31.github.io/forsight/)

The design system behind Marc Fors's software: brand tokens and a React component library shared across every custom client app and in-house product Fors builds, so nothing starts from a blank Tailwind config again.

This package is the **observability fork** of [`@marcfs31/fors-design-system`](https://github.com/marcfs31/fors-design-system): the same tokens and base components, plus two families for the dashboards Fors builds on top of them — [data visualization](#data-visualization) (charts drawn in plain SVG, no charting dependency) and [observability](#observability) (metric tiles, health, uptime, logs, traces). Every import path changes to `@marcfs31/forsight`; nothing else about the base API moves.

**[Browse the component library →](https://marcfs31.github.io/forsight/)** (Storybook, deployed from `main`)

**Brand concept.** "Forsight" is built on _fors_, Swedish/Norwegian for rapids — force, flow, clarity, momentum — and on the foresight an observability tool is meant to give you. The palette is dark-first and engineering-forward: near-black ink surfaces, a signature Rapids Teal accent, a Spark Amber secondary, Inter for body/UI text, Space Grotesk for headings. A light theme is included for apps that need it — see [Theming](#theming) below.

**Compatibility.** React 18 and 19 · Next.js App Router, [RSC-ready](#using-with-nextjs) (the components entry ships `"use client"`) · ESM + CJS, validated with `publint`/`arethetypeswrong` on every resolution mode.

## Install

Published to GitHub Packages under the `@marcfs31` scope. Add to the consuming repo's `.npmrc`:

```
@marcfs31:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

`NPM_TOKEN` is a classic GitHub personal access token with `read:packages` scope — set it as an environment variable locally and in your deployment platform (e.g. a Vercel project environment variable). Then:

```bash
npm install @marcfs31/forsight
```

## Usage

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from "@marcfs31/forsight";
import "@marcfs31/forsight/styles.css";
import "@marcfs31/forsight/fonts.css"; // optional — see Fonts below

function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deploy your project</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Deploy</Button>
      </CardContent>
    </Card>
  );
}
```

Package entries:

| Import                               | What it is                                                                                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@marcfs31/forsight`                 | The components. Every one is interactive (hooks / Radix), so the bundle ships a `"use client"` directive — usable directly inside a React Server Component tree with no wrapper.                                  |
| `@marcfs31/forsight/theme`           | Server-safe utilities (`applyForsightTheme`, `forsightAntiFlashScript`, the raw palettes, `cn`). No `"use client"` — call these from a Server Component (e.g. a Next.js root layout).                             |
| `@marcfs31/forsight/styles.css`      | **Required.** Design tokens + compiled component styles. Tailwind's component/utility layers only (no Preflight reset, no network calls) — safe alongside an app that runs its own Tailwind base and its own CSP. |
| `@marcfs31/forsight/tailwind.css`    | Optional, Tailwind **v4** apps: `@theme` mapping so your own markup can use the token utilities (`bg-accent`, `text-fg-muted`, `rounded-md`, …). See [Tailwind](#tailwind).                                       |
| `@marcfs31/forsight/tailwind-preset` | Optional, Tailwind **v3** apps: the same mapping as a preset for `tailwind.config`. See [Tailwind](#tailwind).                                                                                                    |
| `@marcfs31/forsight/fonts.css`       | Optional: loads the brand faces from Google Fonts. See [Fonts](#fonts).                                                                                                                                           |

Runtime dependencies (Radix primitives, `cmdk`, `react-day-picker`, `class-variance-authority`, `tailwind-merge`) are regular `dependencies` of the package and install with it; only `react` / `react-dom` (18 or 19) are peers you provide. Tailwind is **not** required to use the components — `styles.css` is precompiled.

### Tailwind

The components are already styled by `styles.css`; you don't need Tailwind to use them. If your app _does_ use Tailwind and you want the Forsight token vocabulary available in your own markup, add the matching integration:

**Tailwind v4** — in your global stylesheet:

```css
@import "tailwindcss";
@import "@marcfs31/forsight/tailwind.css";
```

**Tailwind v3** — in `tailwind.config.ts`:

```ts
import forsightPreset from "@marcfs31/forsight/tailwind-preset";

export default {
  presets: [forsightPreset],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
};
```

Either way you then get `bg-ink-surface`, `text-fg-secondary`, `border-ink-border`, `bg-accent` / `text-accent-fg`, `bg-danger-subtle`, `rounded-md`, `shadow-md`, `font-heading`, and so on — every value resolves through the `--forsight-*` custom properties, so it follows the [theme switch](#theming) at runtime. (Tailwind v4 has no duration namespace; use `duration-[var(--forsight-duration-fast)]` / `duration-[var(--forsight-duration-base)]` for the motion tokens.)

### Fonts

`styles.css` references the brand families (`Inter`, `Space Grotesk`) by name but doesn't load them — nothing in the shipped CSS makes a network call. Provide the faces yourself:

- **Quickest**: `import "@marcfs31/forsight/fonts.css"` — loads both from Google Fonts.
- **Next.js / production**: use `next/font` and point the tokens at it (see [Using with Next.js](#using-with-nextjs)).
- **Self-hosted**: set `--forsight-font-sans` / `--forsight-font-heading` on `:root` to your own stack — every component reads the font through those two CSS variables.

Without any of the above, text falls back to `system-ui` — never invisible, just not on-brand.

## Theming

Dark is the default — nothing to configure. For an app that also needs light mode, import the theme utilities from the **server-safe entry** and own the switcher/persistence yourself:

```tsx
import { applyForsightTheme, forsightAntiFlashScript } from "@marcfs31/forsight/theme";

// In your root layout's <head>, before hydration:
<script dangerouslySetInnerHTML={{ __html: forsightAntiFlashScript() }} />;

// Wherever the user toggles theme:
applyForsightTheme("light");
```

## Using with Next.js

App Router, Server Components, `next/font` — all supported.

```tsx
// app/layout.tsx (Server Component — no "use client" needed here)
import "@marcfs31/forsight/styles.css";
import { forsightAntiFlashScript } from "@marcfs31/forsight/theme";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      style={
        {
          "--forsight-font-sans": "var(--font-inter)",
          "--forsight-font-heading": "var(--font-space-grotesk)",
        } as React.CSSProperties
      }
    >
      <head>
        {/* Applies a stored theme before paint — no flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: forsightAntiFlashScript() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Then use components anywhere — in a Server Component tree directly, or in your own `"use client"` files:

```tsx
import { Button } from "@marcfs31/forsight";

export default function Page() {
  return <Button>Deploy</Button>; // no "use client" needed in this file
}
```

Don't add `import "@marcfs31/forsight/fonts.css"` alongside `next/font` — that would load the same families twice, once render-blocking from Google and once self-hosted.

## Development

```bash
npm install
npm run storybook       # component playground at localhost:6006
npm test                # unit + accessibility + token-contrast tests
npm run typecheck
npm run build            # dist/{index,theme,tailwind-preset}.{js,cjs,d.ts,d.cts} + dist/{styles,tailwind,fonts}.css
npm run build-storybook  # static Storybook build
```

Package-level checks (all run in CI):

```bash
npm run smoke          # imports the built dist/ and checks the public API + shipped CSS
npm run test:package   # publint + are-the-types-wrong on the packed tarball (ESM/CJS/types resolution)
npm run test:consumer  # packs the tarball, installs it into fixtures/next-consumer (Next.js 16 App Router,
                       # React 19, Tailwind v4) and runs `next build` — proves the RSC boundary, the
                       # stylesheet surviving the bundler, and the tailwind.css @theme mapping
npm run size           # bundle-size budget
```

## Releasing

This repo uses [Changesets](https://github.com/changesets/changesets):

```bash
npm run changeset          # after a change worth releasing — prompts for a bump + summary
npm run version-packages   # bumps package.json + writes CHANGELOG.md
npm run release            # builds and publishes to GitHub Packages
git push --follow-tags
```

## Component set

### Base

Typography: `Heading`, `Text`, `Label`. Forms: `Button` (with a built-in `loading` state), `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Select`, `Slider`, `Calendar`/`DatePicker`. Overlays: `Dialog`, `DropdownMenu`, `Popover`, `Tooltip`, `Toast`/`Toaster`/`useToast`, `Command`/`CommandDialog` (command palette). Feedback & data: `Alert`, `Badge`, `Avatar`/`AvatarGroup`, `Spinner`, `Progress`, `Skeleton`, `Card`, `Table`, `Tabs`, `Accordion`, `Collapsible`, `Separator`. Navigation & layout: `Breadcrumb`, `Pagination`, `Sidebar`/`AppShell` (page shell with `SidebarProvider`/`useSidebar`). Every component supports `dir="rtl"`.

Overlay/select components are built on [Radix UI](https://www.radix-ui.com/) primitives for correct focus management and keyboard behavior; every component ships fully unstyled from Radix and is styled entirely through this repo's Tailwind token vocabulary. Open/close motion for every overlay comes from `tailwindcss-animate`, driven by Radix's own `data-state`/`data-side` attributes, and automatically collapses under `prefers-reduced-motion`.

### Data visualization

`LineChart` (lines or a single area) · `BarChart` (grouped or stacked, always from a zero baseline) · `Sparkline` (axis-less trend for a tile or table cell) · `BarList` (ranked top-N with inline bars) · `DonutChart` (part-to-whole with the total in the middle) · `Heatmap` (density matrix, one hue in five steps) · `Gauge` (bounded metric as an ARIA `meter`) · `ChartFrame` / `ChartLegend` / `ChartTooltip` (the shell and pieces, for a plot this package doesn't ship).

Charts are drawn as SVG from this repo's own geometry helpers (`niceScale`, `linePath`, `areaPath`, `barPath`, `arcPath`, `formatCompact`, …, all exported) — there is no charting library in the dependency tree, and the marks wear the same token vocabulary as everything else.

Three rules the charts hold to, which is most of what makes them readable:

- **Series colors are eight fixed slots**, `--forsight-viz-1` … `--forsight-viz-8`, assigned in order and never cycled. The ordering is the colorblind-safety mechanism: adjacent slots are the pairs a stack or a legend puts side by side, and every adjacent pair clears the CVD and normal-vision separation floors in both themes. A ninth series is drawn neutral — the signal to fold the tail into "Other" or use small multiples.
- **A chart is a picture and a table.** Every plot renders its data as a visually hidden `<table>` (or, for `Heatmap` and `TraceWaterfall`, _is_ a real table), so the numbers are never available only to sighted readers. `Sparkline` summarizes instead — count, low, high, latest — because forty cells at that size help nobody.
- **The cursor is keyboard-reachable.** Hovering a plot reads a point out; so does focusing it and pressing Arrow/Home/End, with Escape to dismiss. Identity always has a text carrier (legend, direct label, printed value) beside the color.

### Observability

`StatCard` (the metric tile: value, delta, trend, health) · `Delta` (period-over-period change, colored by whether the move is _good_, not by its sign) · `StatusDot` (service health, with the status word beside it) · `UptimeBar` (status-page strip, plus a summary and an incident list for non-visual readers) · `LogStream` (leveled, scrollable ARIA `log`) · `Timeline` (incident and deploy history) · `TraceWaterfall` (span waterfall as a table) · `TimeRange` (segmented window picker, a real ARIA radio group).

Every component has a Storybook story (with autodocs generating a props-table page from its TypeScript types) and a co-located test covering behavior and accessibility (`vitest-axe`).
