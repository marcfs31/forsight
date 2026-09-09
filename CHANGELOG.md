# @marcfs31/fors-observability-design-system

## 2.0.0

### Major Changes

- 10c1ee9: Fork of `@marcfs31/fors-design-system`, published under the new name `@marcfs31/fors-observability-design-system`. Every import path changes accordingly (`@marcfs31/fors-observability-design-system`, `/theme`, `/styles.css`, `/tailwind.css`, `/tailwind-preset`, `/fonts.css`); the base component API and the `--fors-*` token namespace are unchanged, so an app can swap the dependency and keep its markup.

### Minor Changes

- 414a3be: Add `AlertDialog` — a confirmation dialog for destructive or otherwise consequential actions (`@radix-ui/react-alert-dialog`). Unlike `Dialog`, it doesn't dismiss on an outside click and always returns focus to `AlertDialogCancel` on open, so a keyboard or screen-reader user lands on the safe choice first. `AlertDialogAction` defaults to the `danger` `Button` variant and accepts `variant`/`size` overrides for non-destructive confirmations.
- 414a3be: Add `AlertList` — "what's firing right now": active and recently resolved alerts ranked by recency, complementing `Timeline` (full history) and `StatusDot` (a single point-in-time health read). Severity is always printed as a word via `Badge`, never color alone; a resolved alert dims and gets a "Resolved" badge without hiding what it was. Renders `EmptyState` when there are no alerts, and defaults to a polite live region (opt out via `announce={false}` for a firehose feed).

  Also raises the JS bundle size-limit budget from 92 KB to 100 KB for this component-library-expansion batch (two new Radix deps — `alert-dialog`, `toggle-group` — plus several components composed from existing primitives).

- 414a3be: Add `BoxPlot` — a five-number summary (min/Q1/median/Q3/max) per category, for the latency/duration percentile spread `LineChart`/`BarChart` can't show. Like `LineChart` and unlike `BarChart`, its axis fits the data range rather than a zero baseline. Every box shares the neutral accent color (like `Histogram`/`Sparkline`) since it compares one metric's spread across categories, not several metrics against each other.
- 414a3be: Add `CalendarHeatmap` — a GitHub-contributions-style year-in-review activity calendar for incident or deploy frequency by day. Unlike `Heatmap` (a density matrix you've already arranged into rows/columns), it takes a flat, unordered list of `{ date, value }` days and buckets them into weeks (columns) and weekdays (rows) itself, then hands that grid to `Heatmap` — so it gets the same real `<table>`, five-step intensity scale, and legend. A date with no entry renders as an untracked (empty) cell, distinct from a tracked day whose count is zero.
- 414a3be: Add an `annotations` prop to `LineChart` and `BarChart` — SLO-threshold (`value`) or deploy-marker (`label`) reference lines drawn over the plot, in a `neutral`/`accent`/`warning`/`danger` tone. Every annotation's text is folded into the plot's visually hidden description, so a threshold or marker is never sighted-only information. The shared `ChartAnnotation` type and its tone-to-class mapping (`ANNOTATION_TONE_CLASSES`) are exported for building a custom plot on `ChartFrame` with the same annotation styling.

  (Note: this landed on `LineChart`/`BarChart` rather than `ChartFrame` itself — `ChartFrame` has no scale or category knowledge to place a reference line against, so the annotation geometry has to live where the scale does.)

  Also adds the `"warning (as text) on bg"` and `"danger (as text) on bg"` pairings to the token contrast test suite, covering the annotation labels' text color drawn directly on the plot background.

- 414a3be: Add `ComboChart` — bars and a line sharing one x-axis on independent scales (request volume + p99 latency, the APM-dashboard pattern), built on the same `ChartFrame`/`niceScale`/`barPath`/`linePath` geometry as `BarChart`/`LineChart`. Bar series always share a zero-baselined left axis; line series always share a right axis fit to their own data range; the visually hidden description calls out which series reads on which axis.

  Also exports `splitAtGaps` (the `null`-gap-splitting helper `LineChart` already used internally, now shared with `ComboChart`'s line series) alongside the rest of the chart math — no behavior change to `LineChart` itself.

- 414a3be: Add `Combobox` — a searchable, filterable single-select for lists too long to scan un-filtered, composed from the existing `Popover` + `Command` primitives (no new dependency). Pass `options`, `value`/`onValueChange`, and an `aria-label` for the trigger's accessible name (it replaces the visible placeholder/value text for assistive tech, so word it as the field's purpose rather than a repeat of the placeholder).
- 414a3be: Add `Drawer` — an edge-anchored panel for row detail, filters, or focused editing next to the content it relates to, built on the same `@radix-ui/react-dialog` primitive as `Dialog`. `DrawerContent` takes a logical `side` (`"start"` | `"end"`, default `"end"`) that flips the physical edge automatically under `dir="rtl"`, the same technique already used by `Sidebar`'s mobile drawer.
- 414a3be: Add `EmptyState` — placeholder content for a table, list, or search result with nothing to show (icon, title, description, action slot). Renders `role="status"` by default so a screen reader user is told the section resolved to empty; override via the `role` prop for a static (non-dynamic) empty section.
- 414a3be: Add `ErrorBudget` — an SLO burn-down bar showing how much of an error budget is spent, read as "how much is left." Unlike `Gauge` (a bounded metric with a caller-judged `tone`), the status here (`healthy`/`at-risk`/`critical`) derives automatically from `warningAt`/`dangerAt` thresholds, since "72% of your error budget is gone" means roughly the same thing in any context. The status word is always printed via `Badge`, never carried by color alone, and the whole thing is exposed as an ARIA `meter`.
- 414a3be: Add `FilterBar` — a faceted filter row for an observability dashboard header (service/env/status/whatever facets the data supports). Applied facets render as removable chips; "Add filter" opens a searchable, grouped list of everything not already applied, built on the same `Popover` + `Command` pairing `Combobox` uses. `filters` is controlled — the component owns only the chip/add-menu chrome, and the caller decides what applying a filter actually does.
- 414a3be: Add `Histogram` — distribution of one metric across ordered ranges (request-duration buckets, payload-size buckets), built on the same `ChartFrame`/`niceScale`/`barPath` geometry as `BarChart`. Bars sit edge to edge (a hairline gap) since ranges are continuous, unlike `BarChart`'s discrete, gapped categories, and it uses the neutral accent color (like `Sparkline`/`Gauge`) since there's only ever one metric to show.
- 414a3be: Add `JSONViewer` — a collapsible tree for structured data (log fields, trace/span attributes, request/response payloads). Every visible node is real text content, and collapsing a node removes its children from the DOM rather than hiding them, so assistive tech never lands on content the sighted view has hidden. It's a set of nested disclosure buttons (Tab + Enter/Space), not a full WAI-ARIA `tree` widget.

  Also adds the `"accent (as text) on bg"` pairing to the token contrast test suite, covering the node-toggle hover state's background.

- 414a3be: Add `Kbd` — a single keyboard key/shortcut token rendered as a native `<kbd>`, for use inside `CommandItem`, `Tooltip`, or anywhere a shortcut hint is shown. Compose several side by side for a multi-key shortcut (e.g. `⌘` + `K`).
- 414a3be: Add `ToggleGroup` / `ToggleGroupItem` — a segmented set of pressed-button options (view-mode switches, chart-type toggles, density controls), built on `@radix-ui/react-toggle-group`. `type="single"` exposes `role="radiogroup"`/`role="radio"` (same roles as `RadioGroup`, styled as a connected button row); `type="multiple"` exposes `role="toolbar"` with independently `aria-pressed` buttons. Arrow/Home/End move a roving focus between items; Space/Enter or a click selects.
- 55a5909: Two new component families for dashboards, and the tokens behind them.

  **Data visualization** — `LineChart` (lines or a single area, with gaps for missing samples), `BarChart` (grouped or stacked, zero-baselined), `Sparkline`, `BarList`, `DonutChart`, `Heatmap`, `Gauge`, plus `ChartFrame` / `ChartLegend` / `ChartTooltip` for building a plot this package doesn't ship. Everything is drawn as SVG from exported geometry helpers (`niceScale`, `linePath`, `areaPath`, `barPath`, `arcPath`, `project`, `polar`, `formatCompact`, `formatDuration`, `formatPercent`, `seriesFill`/`seriesStroke`/`seriesBg`) — no charting dependency is added.

  **Observability** — `StatCard`, `Delta`, `StatusDot`, `UptimeBar`, `LogStream`, `Timeline`, `TraceWaterfall`, `TimeRange`.

  **Tokens** — eight categorical chart-series slots, `--fors-viz-1` … `--fors-viz-8`, per theme, mapped into both Tailwind entries as `fill-viz-*` / `stroke-viz-*` / `bg-viz-*`. The slot order is the colorblind-safety mechanism (adjacent pairs clear the CVD and normal-vision separation floors in both themes) and is pinned, along with the 3:1 non-text contrast bar, by `src/tokens/__tests__/contrast.test.ts`.

  Accessibility notes worth knowing before using these: every plot also renders its data as a visually hidden table (`Heatmap` and `TraceWaterfall` _are_ real tables); the hover readout is reachable by keyboard (Arrow/Home/End, Escape to dismiss) and announced through a polite live region; and identity is never carried by color alone — legends, status words, delta arrows and printed values do that work.

- 10c1ee9: Ready the package for use as a dependency in Tailwind apps:

  - New `@marcfs31/fors-observability-design-system/tailwind.css` export — a Tailwind v4 `@theme` mapping so a consumer's own markup can use the token utilities (`bg-accent`, `text-fg-muted`, `rounded-md`, …).
  - New `@marcfs31/fors-observability-design-system/tailwind-preset` export — the same mapping as a Tailwind v3 preset (this repo's own config now consumes it). `tailwindcss` is declared as an optional peer.
  - `sideEffects` now lists the shipped `.css` files instead of `false`, so bundlers that honor the flag literally never tree-shake `import "@marcfs31/fors-observability-design-system/styles.css"`.
  - `./package.json` is exported for tooling that reads package metadata.
  - New `npm run test:consumer` (also a CI job): packs the tarball, installs it into a Next.js 16 / React 19 / Tailwind v4 fixture app and builds it, verifying the RSC `"use client"` boundary, the stylesheet surviving the bundler, and the `tailwind.css` mapping.

> Forked from [`@marcfs31/fors-design-system`](https://github.com/marcfs31/fors-design-system) at
> v1.4.1. Entries below that release are inherited history and name the old package; every version
> from 2.0.0 on is this package. The fork adds the data-visualization and observability component
> families and the `--fors-viz-*` series tokens — see the pending changesets.

## 1.4.1

### Patch Changes

- 4a54e50: RTL (`dir="rtl"`) support: hardcoded physical-direction classes (`text-left`, `ml-*`, `pl-*`/`pr-*`, `right-*`, `border-r`, `-ml-*`) across `Accordion`, `Table`, `Select`, `Dialog`, `Avatar`, and `Sidebar` are now logical-property equivalents (`text-start`, `ms-*`, `ps-*`/`pe-*`, `end-*`, `border-e`, `-ms-*`), and `Switch`'s thumb travel and `Sidebar`'s mobile-drawer slide animation now use explicit `rtl:`/`ltr:` variants. No API changes — purely internal styling.

  `Toast` is a deliberate, documented exception: its swipe-to-dismiss gesture and resting position are tied together by a hardcoded physical `swipeDirection`, and making that RTL-aware needs a runtime direction-detection mechanism this repo doesn't have yet. `DropdownMenu`/`Popover`/`Tooltip` needed no changes — their positioning already reads Radix's own viewport-relative `data-side`, not text direction.

  Storybook gains a `dir` toolbar (mirroring the existing theme toggle) and a `KitchenSinkRTL` story for whole-system verification.

## 1.4.0

### Minor Changes

- f979d2d: Add `Calendar`/`DatePicker` — a date grid built on `react-day-picker`, plus a compact popover-based date field for forms. Scoped to single-date selection for now; range selection is a documented follow-up.

  **Bundle budget raised from 70 KB to 85 KB** (brotli, `dist/index.js`): `react-day-picker` pulls in `date-fns`/`@date-fns/tz`, adding a real, measured ~18 KB even after tree-shaking. This is a deliberate trade-off for shipping a genuine date picker rather than a hand-rolled one — real usage after this release is ~80 KB, leaving headroom for incidental growth.

- 65591ff: Add `Sidebar`/`AppShell` — a page-shell layout primitive: `SidebarProvider`/`useSidebar` for shared collapsed/mobile-open state, `Sidebar` (a desktop icon-rail that collapses, or a mobile slide-in drawer built on Radix Dialog below the `md` breakpoint), `SidebarHeader`/`SidebarContent`/`SidebarFooter` layout slots, `SidebarNav`/`SidebarNavItem` for plain nav links, `SidebarTrigger`, and `AppShell`/`AppShellMain` for the page's flex container and its single `<main>` landmark. No new dependency — reuses `@radix-ui/react-dialog`, already in this package.
- 18e8d56: Add `Command`/`CommandDialog` — a searchable, filterable command palette built on `cmdk`, for use in place of `Select` when a list is long, filterable, or mixes action types. `CommandDialog` opens `Command` as a modal palette on top of this repo's own `Dialog`.

  `DialogContent` also gains an optional `hideClose` prop (default `false`, fully backward-compatible) for chrome-free modal surfaces like `CommandDialog` that rely on Escape to close instead of a visible close button.

## 1.3.0

### Minor Changes

- 25d6b8a: Three new components, filling gaps this repo's own usage kept surfacing:

  - **`Separator`** — a divider between sections of content, decorative by default (`decorative={false}` for the rare case it's the only signal of a semantic boundary).
  - **`Label`** — an accessible field label (wraps `@radix-ui/react-label`) so `htmlFor`/`id` correctly associates with any control, native or Radix-based — replaces every hand-rolled `<label className="...">` this design system's own stories had been using.
  - **`Collapsible`** (+ `CollapsibleTrigger`, `CollapsibleContent`) — a single show/hide section (a "Show more" toggle, an optional advanced-settings block); `Accordion` is built on the same Radix primitive but manages a whole group, this is the standalone version.

### Patch Changes

- 0fad059: Bump `tailwind-merge` to 3.6.0 (a runtime dependency of the `cn()` helper). Verified against the full test suite (unit + DOM snapshots + Storybook test runner) with no output changes — the class-merging behavior for every component is identical.

## 1.2.0

### Minor Changes

- ce3f210: Next.js App Router / React Server Components compatibility, and confirmed React 19 support.

  - The components entry (`@marcfs31/fors-design-system`) now ships a leading `"use client"` directive — every component is interactive (hooks / Radix), so the whole bundle is a client module usable directly inside an RSC tree, no wrapper `"use client"` file required.
  - New server-safe entry **`@marcfs31/fors-design-system/theme`**: `applyForsTheme`, `forsAntiFlashScript`, `FORS_THEMES`, `FORS_PALETTES`/`DARK_PALETTE`/`LIGHT_PALETTE`, and `cn` — no client directive, callable from a Server Component (e.g. a Next.js root layout). `publint`/`arethetypeswrong` validate it clean on every resolution mode, including legacy `node10` (via a root `theme/package.json` stub).
  - Type families are now CSS variables — `--fors-font-sans`, `--fors-font-heading`, `--fors-font-mono` — so a consumer can point them at `next/font` (or any self-hosted face) instead of the bundled Google Fonts import.
  - The shipped `styles.css` no longer makes a network call: the Google Fonts `@import` moved to a new optional **`@marcfs31/fors-design-system/fonts.css`** entry. Without either, text falls back to `system-ui` — never invisible, just not on-brand until fonts are wired up.
  - React 19: confirmed compatible — peer range (`>=18`) and the resolved Radix versions (`^19.0` in their own peer ranges) both support it; no removed API (`forwardRef`, etc.) is used.

  README gained "Using with Next.js" and "Fonts" sections.

## 1.1.0

### Minor Changes

- fab1ae2: Full accessibility (WCAG 2.1 AA) and responsiveness hardening pass across every component.

  Accessibility:

  - `Tabs` reworked to the complete WAI-ARIA Tabs pattern: roving `tabIndex`, Arrow/Home/End keyboard navigation with disabled-trigger skipping and wrapping, `id`↔`aria-controls`/`aria-labelledby` wiring between each trigger and panel, focusable panels, and an `orientation` prop.
  - `Input` / `Textarea`: `hint` text is now linked to the control via `aria-describedby` so screen readers announce it.
  - `Alert`: new `assertive` prop switching the live region to `role="alert"`; defaults to `true` when `variant="danger"`.
  - `Avatar`: keeps its accessible name (via `role="img"` + `aria-label`) when the image fails and it falls back to initials; `AvatarGroup`'s "+N" bubble is now labelled ("N more").
  - `Checkbox` / `RadioGroup` controls enlarged to a 24×24px minimum touch target (WCAG 2.5.8); `Dialog` and `Toast` close buttons padded to a real hit area.
  - `Breadcrumb` current-page marker simplified to a plain `aria-current="page"` span (no more `role="link"` + `aria-disabled`).
  - `Table` column headers now carry `scope="col"`.

  Responsiveness — every component is usable at 320/768/1280px with no forced horizontal page scroll:

  - `Dialog` content capped to `w-[calc(100vw-2rem)]` with internal scroll for tall content; `DropdownMenu`, `Popover`, and `Toast` viewports capped to the viewport width with a gutter.
  - `Table` renders inside a horizontal scroll container instead of overflowing the page.
  - `Tabs` list scrolls when it overflows; `Pagination` wraps.

- a9e461a: Ship a CommonJS build alongside ESM. `require("@marcfs31/fors-design-system")` now resolves to `dist/index.cjs` with its own `dist/index.d.cts` types; ESM consumers are unchanged (`dist/index.js`). `publint` and `@arethetypeswrong/cli` both pass clean across `node10`, `node16` (CJS and ESM), and bundler resolution. Non-breaking — nothing was removed or renamed.

### Patch Changes

- a9e461a: Fix `--fors-fg-muted` (dark theme) failing WCAG AA contrast on `ink-surface` and `ink-surface-2` — it only cleared 4.5:1 against the base `ink-bg`. Nudged `#75818d` → `#8a95a1` (now ≥ 5.2:1 on every ink surface). Caught by the new full-browser axe pass on the Table header, which renders `text-fg-muted` on `ink-surface-2`. The token-contrast test now checks `fg-muted` and `fg-secondary` against all three ink surfaces so this can't regress. `ToastDescription` also switched from `opacity-90` (which tipped `text-danger` under AA in the danger toast) to solid `text-fg-secondary`.

## 1.0.0

### Major Changes

- First stable release of the Fors design system.

  - Dark (default) and light theming via `[data-theme]`, with WCAG AA contrast enforced by an automated test against the real token values — no `ThemeProvider` required; consumers get `applyForsTheme`/`forsAntiFlashScript` instead.
  - 30 components: typography (`Heading`, `Text`), forms (`Button` with a built-in `loading` state, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Select`, `Slider`), overlays (`Dialog`, `DropdownMenu`, `Popover`, `Tooltip`, `Toast`/`Toaster`/`useToast`), feedback and data (`Alert`, `Badge`, `Avatar`/`AvatarGroup`, `Spinner`, `Progress`, `Skeleton`, `Card`, `Table`, `Tabs`, `Accordion`), and navigation (`Breadcrumb`, `Pagination`).
  - Overlay and select components are built on Radix UI primitives for correct focus/keyboard/ARIA behavior, restyled entirely through this package's own Tailwind token vocabulary.
  - Real open/close motion on every overlay via `tailwindcss-animate`, driven by Radix's own `data-state`/`data-side` attributes, and automatically neutralized under `prefers-reduced-motion`.
  - Every component ships a Storybook story (with autodocs generating a props table from its TypeScript types) and a co-located test covering behavior and accessibility (`vitest-axe`).
  - Production build via `tsup` (ESM, typed) plus a separately compiled `styles.css` (no Preflight reset, safe alongside a consumer's own Tailwind base).
  - CI (typecheck, lint, test, build, build-storybook) and a Changesets-driven release process publishing to GitHub Packages.
