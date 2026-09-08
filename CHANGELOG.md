# @marcfs31/fors-observability-design-system

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
