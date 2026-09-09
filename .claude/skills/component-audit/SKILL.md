---
name: component-audit
description: >-
  Audit existing Forsight design-system components for accessibility (WCAG 2.1 AA)
  and responsive behavior, and apply the fixes. Use for sweeps like "check every
  component for a11y problems", "review responsiveness across the library", "fix
  any axe warnings before release", or a pre-release hardening pass. Covers the
  rubric, how to parallelize across many components with subagents, the edit
  constraints, and the verification gate.
---

# Auditing Forsight components for accessibility & responsiveness

Use this for a **sweep** across many components. For a single new component,
use the `new-component` skill instead (same rubric, authoring context).

## How to run it

1. **Baseline.** `npm run test:coverage` (every component test already includes an
   `axe` no-violations check) and `npm run build-storybook`. Note anything red.
2. **Partition the work.** Group the ~27 components into 3–4 disjoint sets and, if
   asked to parallelize, spawn one subagent per set (a low-cost model is fine —
   the rubric below is explicit). Suggested split:
   - **Forms**: Button, Input, Textarea, Checkbox, RadioGroup, Switch, Select, Slider
   - **Overlays**: Dialog, DropdownMenu, Popover, Tooltip, Toast, Accordion
   - **Display & nav**: Badge, Alert, Avatar, Card, Spinner, Progress, Skeleton, Table, Heading, Text, Breadcrumb, Pagination
   - **Composite (keep central, don't hand to a cheap agent)**: Tabs — hand-rolled, needs the full WAI-ARIA pattern
3. Each worker: audit its set against both rubrics, apply fixes, extend each
   touched `*.test.tsx` with a test asserting the specific fix, keep the existing
   `axe` test, run `npx vitest run src/components/<Name>.test.tsx` per component,
   `npx prettier --write` its files, and report back per-component bullets + any
   change needed in a shared file (which it must NOT make itself).
4. **Consolidate.** Review every diff (`git diff`), apply the reported shared-file
   changes yourself, then run the full ship checklist (bottom).

## Accessibility rubric (WCAG 2.1 AA)

For each component check and fix:

1. **Name / role / value** — every interactive element has an accessible name; roles are correct and non-redundant (watch for `role="link"`+`aria-disabled` on non-links, `role="status"` where `role="alert"` belongs); decorative `<svg>` has `aria-hidden="true"`.
2. **Form-field description linkage** — `hint`/error text linked via `aria-describedby` to an `id` (from `React.useId()` when not supplied); `aria-invalid` on error. Reference: `Input.tsx`, `Textarea.tsx`.
3. **Keyboard** — reachable + operable by keyboard; custom widgets implement Arrow/Home/End/Esc/Enter/Space as their pattern requires; focus trapped only in modal `Dialog`.
4. **Visible focus** — `focus-visible:outline-none focus-visible:shadow-focus-ring` on every focusable element (menu items may use Radix `data-[highlighted]`).
5. **Touch targets ≥ 24×24 CSS px** (WCAG 2.5.8) — pad icon-only buttons (`flex min-h-9 min-w-9 items-center justify-center`); bare checkbox/radio is `h-6 w-6`.
6. **State exposure** — `aria-expanded`/`selected`/`checked`/`current`/`pressed`/`busy` present (Radix gives most; verify custom logic didn't strip it).
7. **Live regions** — async feedback: `role="status"` polite for neutral/success, `role="alert"` assertive for errors (see `Alert.tsx` `assertive`).
8. **Motion** — no per-component reduced-motion code; the global rule in `src/styles/globals.css` handles it.
9. **Fake interactivity** — a `<div>` with `onClick` and no role/tabindex/keyboard is a defect; either make it a real `<button>`/`<a>` or document the prop as visual-only (see `Card` `interactive`).

Do **not** change color values during an audit — token contrast is verified
separately in `src/tokens/__tests__/contrast.test.ts`. Structural / ARIA /
keyboard / focus / sizing fixes only.

## Responsiveness rubric

Each component must render and stay usable at **320 / 768 / 1280 px** and never
force horizontal page scroll:

1. **Cap fixed widths** that can exceed 320px — `max-w-[calc(100vw-2rem)]`, or `max-w-[var(--radix-popper-available-width)]` for Radix poppers. `Dialog` content: `w-[calc(100vw-2rem)] max-w-md`.
2. **Tall overlays** scroll internally: `max-h-[calc(100vh-2rem)] overflow-y-auto`.
3. **Wide content** (tables etc.) lives inside `<div className="w-full overflow-x-auto">`.
4. **Control strips** (tab lists, pagination, button rows) `flex-wrap` or `overflow-x-auto` with `shrink-0` children.
5. **Text wraps** — no `whitespace-nowrap` on user content (`Button` label excepted).
6. Add `min-w-0` to growable flex children.

## Fix constraints

- Edit only component files under `src/components/` and their co-located
  `.stories.tsx` / `.test.tsx`.
- Do **not** edit from an audit: `src/index.ts`, `tailwind.config.ts`,
  `src/styles/*`, `src/lib/*`, `src/theme/*`, `package.json`, `vitest.config.ts`,
  `.storybook/*`. If one needs to change, surface it in the report and let the
  orchestrator do it.
- Keep the house patterns: `forwardRef` + `displayName`, `cva`, `cn()`, verbose
  JSDoc, token classes only, no raw hex, no new config keys.
- Every touched component gets a new test for its fix + keeps its `axe` test.

## Verification gate (before anything merges to main)

Full pyramid is in the **`testing`** skill. Minimum for an audit sweep:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:coverage
npm run build
npm run smoke
npm run test:package
npx size-limit
npm run build-storybook
npm run storybook & npm run test:storybook   # real-browser: render smoke + full axe (incl. contrast) + play tests
```

`npx vitest run -u` if a DOM snapshot changed — then re-read the diff.

Then eyeball Storybook — the `Forsight/Overview` "Kitchen" story is the fastest
whole-system check — at 375px and desktop, in both themes.

**Versioning** (see the `release` skill): an audit that changed a prop, ARIA
output, or a documented behavior needs `npx changeset` (usually **minor** —
additive a11y/responsive improvements). A pure `chore` cleanup with no
consumer-visible change needs none and is never tagged.
