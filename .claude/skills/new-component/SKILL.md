---
name: new-component
description: >-
  Create or design a new component for the Forsight design system. Use whenever the
  task is to add, scaffold, build, or design a new component (e.g. "add a
  Combobox", "build a DatePicker", "we need a Stepper component") — it defines
  the file set, the code conventions, and the accessibility, responsiveness,
  testing, and versioning gates every Forsight component must pass before it lands
  on main.
---

# Adding a component to the Forsight design system

This system ships to every Forsight app (client and in-house). A component that is
wrong here is wrong everywhere. The bar is: **tested, accessible (WCAG 2.1 AA),
responsive, versioned.** Nothing merges to `main` until every gate below passes.

Related skills: **`testing`** (the full test pyramid + per-change checklist),
**`release`** (changeset bump type, the release commit, git tags),
**`component-audit`** (sweeping the whole library).

## 1. File set

For a component named `Thing`, create all of:

| File                               | Purpose                                                                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Thing.tsx`         | the component                                                                                                                                                                                   |
| `src/components/Thing.stories.tsx` | 2–5 realistic named-export stories; `title: "Forsight/<Category>/Thing"` — Typography, Forms, Overlays, Feedback, Data Display, or Navigation (sidebar order is set in `.storybook/preview.ts`) |
| `src/components/Thing.test.tsx`    | behavior + keyboard + `axe` tests                                                                                                                                                               |
| `src/index.ts`                     | add the `export { Thing, type ThingProps }` line (keep alphabetical-ish grouping already there)                                                                                                 |

Then `npx changeset` → **minor** bump, summary describing the new component (that text becomes the CHANGELOG entry).

## 2. Code conventions (match the existing components exactly)

- **`React.forwardRef`** for every element-rendering component, with `Thing.displayName = "Thing"`.
- **Variants via `class-variance-authority`** (`cva`), mirroring `Button.tsx` / `Alert.tsx`. Export `type ThingProps` extending the right `React.*HTMLAttributes` + `VariantProps<typeof thingVariants>`.
- **`cn()` from `../lib/cn`** for all class composition. Never string-concatenate classes.
- **Verbose JSDoc on the exported component** — say _when to use which variant_, and note any composition requirement (needs a provider, must wrap a parent, etc.). This becomes the Storybook description and, later, the design-agent-facing doc.
- **Token classes only.** Allowed vocabulary: `bg-ink-{bg,surface,surface-2,border,border-subtle}`, `text-fg{,-secondary,-muted}`, `border-ink-{border,border-subtle}`, `bg-accent{,-hover,-active,-subtle}` / `text-accent{,-fg}`, `bg-spark*` / `text-spark*`, `bg-danger*`/`text-danger*` and the `success`/`warning` equivalents, `shadow-{sm,md,lg,focus-ring}`, `rounded-{sm,md,lg,xl}`, `duration-{fast,base}`, `font-{heading,sans,mono}`. **No raw hex, ever.** No new Tailwind config keys.
- **Logical properties, not physical ones**, for anything direction-sensitive: `text-start`/`text-end` (not `-left`/`-right`), `ms-*`/`me-*`/`ps-*`/`pe-*` (not `ml-*`/`mr-*`/`pl-*`/`pr-*`), `start-*`/`end-*` (not `left-*`/`right-*`), `border-s`/`border-e` (not `border-l`/`border-r`). A `translateX` needs explicit `ltr:`/`rtl:`-scoped values instead — see `Switch.tsx`. See CONTRIBUTING.md's "RTL" section.
- **Overlays / positioned components** (anything that opens on click or hover — menus, dialogs, tooltips, popovers, comboboxes): build on a **Radix UI primitive**, restyle with token classes, and add `POPPER_ANIMATION_CLASSES` from `../lib/animation` to the content element. See `Popover.tsx` / `DropdownMenu.tsx`. Do not hand-roll focus trapping / dismiss / positioning.
- **Compound components** (`Thing.Root` / `Thing.List` / `Thing.Item`…): if Radix has it, use Radix. If you must hand-roll (see `Tabs.tsx`), implement the **full** WAI-ARIA pattern for that widget — roles, `id`↔`aria-controls`/`aria-labelledby` wiring, roving `tabIndex`, and the arrow-key/Home/End keyboard model.

## 3. Accessibility gate (WCAG 2.1 AA)

Every point applies to the new component:

1. **Name / role / value.** Every interactive element has an accessible name (visible label, `aria-label`, or `aria-labelledby`). Roles are correct and not redundant (no `role="link"` on a non-link, etc.). Decorative `<svg>` icons get `aria-hidden="true"`.
2. **Form-field description linkage.** If the component renders helper or error text (a `hint` prop, validation message…), it MUST be linked to the control via `aria-describedby` pointing at an `id` on that text — generate the `id` with `React.useId()` when the consumer didn't pass one. Error state also sets `aria-invalid`. Pattern: see `Input.tsx` / `Textarea.tsx`.
3. **Keyboard.** Every control is reachable and operable by keyboard. Custom widgets implement their expected keys (Arrow/Home/End for composites, Esc to dismiss, Enter/Space to activate). Focus is never trapped except in a modal `Dialog`.
4. **Visible focus.** Every focusable element uses `focus-visible:outline-none focus-visible:shadow-focus-ring` (menu items may instead use Radix's `data-[highlighted]` styling).
5. **Touch targets.** Interactive controls are **≥ 24×24 CSS px** (WCAG 2.5.8). Icon-only buttons: pad the hit area (`flex min-h-9 min-w-9 items-center justify-center`), don't leave it the size of the ~12px glyph. See `Toast.tsx` `ToastClose`, `Dialog.tsx` close button. Bare checkboxes/radios are `h-6 w-6` (24px).
6. **State.** Toggle/expanded/selected/busy state is exposed via `aria-pressed` / `aria-expanded` / `aria-selected` / `aria-checked` / `aria-current` / `aria-busy`. Radix handles this for Radix-based components — verify custom logic didn't strip it.
7. **Live regions.** Feedback that appears asynchronously uses a live region: `role="status"` (polite) for neutral/success, `role="alert"` (assertive) for errors. See `Alert.tsx` (`assertive` prop, auto-on for `variant="danger"`).
8. **Motion.** Do not add per-component reduced-motion handling — `src/styles/globals.css` already collapses every animation/transition under `prefers-reduced-motion`. Just use `duration-base` and the `tailwindcss-animate` / `POPPER_ANIMATION_CLASSES` utilities.
9. **Interactive-looking-but-not.** If a prop only _looks_ interactive (e.g. `Card`'s `interactive`), say so in the JSDoc and tell the consumer to wrap in a real `<button>`/`<a>` — never fake it with `onClick` on a `<div>`.

## 4. Responsiveness gate

The component must render and stay usable at **320px, 768px, and 1280px** wide, and must never force the page to scroll horizontally.

1. **Cap fixed widths.** Any fixed `w-*` / `min-w-*` that can exceed 320px gets a cap: `max-w-[calc(100vw-2rem)]` (leaves a gutter), or for Radix poppers `max-w-[var(--radix-popper-available-width)]`. `Dialog` content is `w-[calc(100vw-2rem)] max-w-md`.
2. **Tall overlays scroll internally.** `max-h-[calc(100vh-2rem)] overflow-y-auto` on dialog/menu content, not viewport overflow.
3. **Wide content scrolls in its own box.** Data tables and other intrinsically-wide content render inside `<div className="w-full overflow-x-auto">…`. See `Table.tsx`.
4. **Strips of controls wrap or scroll.** Tab lists, pagination, button rows: `flex-wrap`, or `overflow-x-auto` with `shrink-0` children (see `Tabs.tsx` `List`).
5. **Text wraps, never clips.** No `whitespace-nowrap` on anything holding user content (`Button` label is the one deliberate exception).
6. **Fluid page padding** in stories/examples: `p-4 sm:p-8 lg:p-10`, not a fixed `p-10`.
7. Add `min-w-0` to flex children that hold growable content so they can shrink below their intrinsic width.

## 5. Testing gate

See the **`testing`** skill for the full pyramid (unit, DOM-snapshot,
token-contrast, Storybook test runner, built-artifact smoke, package-resolution,
size). The component-authoring minimum:

- **Unit test** `Thing.test.tsx` — behavior (render, variant/prop effects, controlled + uncontrolled); a keyboard-driven test for anything interactive (Radix overlays: `.focus()` + `userEvent.keyboard("{Enter}")`, never `.click()` — jsdom lacks the pointer capture; these run slow, up to ~50s, that's expected); and the mandatory `import { axe } from "../test-utils/axe"` → `expect(await axe(container)).toHaveNoViolations()`.
- **DOM snapshot** — add a canonical-render case to `src/__tests__/dom-snapshot.test.tsx`.
- **`play` interaction test** on a story for any user flow jsdom can't drive well (overlay open/close, keyboard nav, form submit) — `expect`/`userEvent`/`within` from `@storybook/test`; the Storybook test runner executes it in real Chromium and also render-smokes + full-axes every story.
- **New color pairing** → add the fg/bg pair to `src/tokens/__tests__/contrast.test.ts`.
- **New component** → add its name to `EXPECTED_COMPONENT_EXPORTS` in `scripts/smoke-test.mjs`.
- Run `npx vitest run src/components/Thing.test.tsx src/__tests__/dom-snapshot.test.tsx` — green before moving on. Coverage thresholds (98/98/85/85 statements/lines/branches/functions, see `vitest.config.ts`) are enforced by `npm run test:coverage`.

## 6. Adding a new design token (only if genuinely unavoidable)

Prefer composing existing tokens. If a new one is truly needed, update **all four** in the same change:

1. `src/styles/tokens.css` — the `:root` block **and** the `[data-theme="light"]` block (a light value that clears contrast).
2. `src/tokens/palettes.ts` — the `DARK_PALETTE` / `LIGHT_PALETTE` objects and the `ForsightPalette` type.
3. `tailwind.config.ts` — map it into the utility vocabulary.
4. `src/tokens/__tests__/contrast.test.ts` — assert its fg/bg pairing passes AA in both themes.

## 7. Ship checklist

Run all of these from the repo root; every one must pass:

```bash
npm run typecheck
npm run lint
npm run format:check      # npm run format to auto-fix
npm run test:coverage
npm run build
npm run smoke
npm run test:package      # publint + are-the-types-wrong
npx size-limit
npm run build-storybook
npm run storybook & npm run test:storybook   # real-browser render smoke + full axe + play tests
```

Then verify visually in Storybook at mobile (375px) and desktop, in **both** themes (Theme toolbar) and **both** directions (Direction toolbar), plus the `Forsight/Overview` "Kitchen"/"KitchenSinkRTL" stories if the component belongs there.

**Versioning** (see the `release` skill): `npx changeset` → **minor** for a new component; commit the `.changeset/*.md` with the code. The version bump + tag is a separate release step.
