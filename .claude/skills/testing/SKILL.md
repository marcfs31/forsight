---
name: testing
description: >-
  How the Forsight design system is tested and how to keep coverage complete when
  creating or modifying a component. Use when adding or changing tests, when a
  component change needs regression protection, when CI test jobs fail, or when
  deciding what kind of test a given change needs. Covers every layer (unit,
  DOM-snapshot, token-contrast, real-browser story tests, built-artifact smoke,
  package-resolution, bundle-size), what each one catches, and the per-change
  checklist.
---

# Testing the Forsight design system

The goal: **any error or regression introduced by creating or modifying a
component is caught before it reaches `main`.** No single tool does that — the
layers below overlap on purpose.

## The layers

| Layer                                                               | Command                                                         | Runs where                                | Catches                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit tests** — `src/components/*.test.tsx`                        | `npm test` / `npm run test:coverage`                            | Vitest + jsdom                            | behavior, props, controlled/uncontrolled, keyboard interaction, ARIA roles/names/structure (`axe`, minus contrast)                                                                                                                                                               |
| **DOM structure snapshots** — `src/__tests__/dom-snapshot.test.tsx` | `npm test`                                                      | Vitest + jsdom                            | unintentional markup / class / attribute / ordering changes across the whole library — a tripwire, one canonical render per component                                                                                                                                            |
| **Token contrast** — `src/tokens/__tests__/contrast.test.ts`        | `npm test`                                                      | Vitest (DOM-free)                         | every fg/bg token pairing against WCAG AA, in both themes, computed from the real hex values                                                                                                                                                                                     |
| **Coverage thresholds** (98 / 98 / 85 / 85)                         | `npm run test:coverage`                                         | Vitest v8                                 | a new component or branch landing with no test at all                                                                                                                                                                                                                            |
| **Story tests** — `vitest.storybook.config.ts`                      | `npm run test:storybook` (watch) or `npm run test:storybook:ci` | real headless **Chromium** via Playwright | (1) **render smoke on every story** — any story that throws on mount or logs a page error fails, even states no unit test covers; (2) **full axe per story** including `color-contrast`, which jsdom cannot evaluate; (3) **`play` interaction tests** — real-browser user flows |
| **Built-artifact smoke** — `scripts/smoke-test.mjs`                 | `npm run smoke`                                                 | Node, against `dist/`                     | the compiled bundle imports; every expected export is present; `styles.css` was actually processed by Tailwind                                                                                                                                                                   |
| **Package resolution** — `publint` + `@arethetypeswrong/cli`        | `npm run test:package`                                          | Node, against a packed tarball            | a broken `exports` / `types` map — the package failing to resolve in some consumer's module mode (ESM, `node16`, bundler…)                                                                                                                                                       |
| **Bundle-size budget**                                              | `npx size-limit`                                                | esbuild + brotli                          | an accidental heavy import blowing the JS/CSS budget                                                                                                                                                                                                                             |

CI runs the unit/coverage/smoke/package/size layers on Node 22 and 24, and the
story tests as a separate job.

**The story tests run through `@storybook/addon-vitest`, not the old
`@storybook/test-runner`.** That runner was Jest-based and cannot work with
Storybook 10, which loads `.storybook/*` config through a `serverRequire` that
calls `module.register()` — an API Jest refuses. Two consequences worth knowing:

- The accessibility gate is **wider than it used to be.** The old runner scoped
  axe to `#storybook-root`, and Radix renders popovers, dropdowns and tooltips
  into a portal on `document.body` — outside that root — so overlay content was
  never checked. It is now. That change alone surfaced three shipped
  `aria-dialog-name` defects (`Combobox`, `MultiSelect`, `FilterBar`).
- **`a11y.test: "error"` in `.storybook/preview.ts` is what makes a violation
  fail.** Without it the addon still runs axe and still reports violations, but
  the suite passes regardless — green, testing nothing. Do not remove that line;
  if you ever need to confirm the gate is live, add a story with deliberately
  low-contrast text and check that it fails.

Per-story escape hatches keep the usual Storybook parameter shape, and
Storybook deep-merges them, so a story's own rules add to the project defaults
rather than replacing them:

```ts
parameters: { a11y: { disable: true } }
parameters: { a11y: { options: { rules: { region: { enabled: false } } } } }
parameters: { viewport: { options: { mobile: { name: "Mobile", styles: { width: "390px", height: "844px" } } }, defaultViewport: "mobile" } }
```

**Not in the gate:** pixel-level visual regression. Baselines are
font-rendering-dependent and churn between macOS and CI Linux. The story render
smoke + full per-story axe + DOM snapshots + token-contrast test cover "did it
visually break" without flaky image baselines. If a specific change is visually
risky, run a local Playwright screenshot diff or wire up Chromatic for that PR —
don't add image baselines to the repo.

## When you create or modify a component — the checklist

1. **Unit test** (`src/components/<Name>.test.tsx`): render; each variant / prop effect; controlled _and_ uncontrolled where both exist; a keyboard-driven test for anything interactive; and `expect(await axe(container)).toHaveNoViolations()` from `../test-utils/axe`.
   - **jsdom / Radix-overlay boundary**: for a floating overlay (Dialog, DropdownMenu, Popover, Tooltip, Select content), keep jsdom tests **structural and fast** — assert the rendered props/roles/classes with `defaultOpen`. Do **not** call `axe()` on an _open_ overlay in jsdom and prefer not to drive the open gesture there: with no layout engine, `axe` + Radix's floating-ui/focus-scope on a portalled tree runs for **minutes** and times out on CI. Open-state a11y and real open/close interaction for overlays live in the real-browser story tests instead (next point + point 3). `axe()` in jsdom is for **inline** components.
2. **DOM snapshot**: a _new_ component gets a case added to `src/__tests__/dom-snapshot.test.tsx` (a canonical render — the state a consumer reaches first). A _modified_ component: run `npx vitest run src/__tests__/dom-snapshot.test.tsx`; if it fails, the diff is your change — confirm it's intended, then `npx vitest run -u` and re-read the updated snapshot before committing.
3. **`play` interaction test** on the story for any user flow the unit test can't drive well in jsdom — overlay open/close, keyboard navigation, a form submit path. Put it on a dedicated story (`KeyboardNavigation`, `OpenAndClose`, …) using `expect` / `userEvent` / `within` from `storybook/test`. The story tests execute it in a real browser.
4. **New color pairing** → add the fg/bg pair to `src/tokens/__tests__/contrast.test.ts`.
5. **New component** → add its name to `EXPECTED_COMPONENT_EXPORTS` in `scripts/smoke-test.mjs`, and export it from `src/index.ts`.
6. **New story** → nothing extra: the story tests pick it up automatically for render smoke + axe.
7. **Run the full gate** (below). A component change that only touches `.tsx`/`.stories`/`.test` still needs `test:storybook` — that's where the real-browser axe and render smoke live.

## Full gate

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

# real-browser layer — one-time: npx playwright install chromium
# No server needed: addon-vitest imports each story directly.
npm run test:storybook:ci
```

## Debugging a failing layer

- **`test:storybook` axe failure** — the report names the rule, the element, and the fix. If a story legitimately can't satisfy a rule (a deliberately-broken example), scope it off on that story: `parameters: { a11y: { config: { rules: [{ id: "...", enabled: false }] } } }` or `parameters: { a11y: { disable: true } }` — never globally.
- **`test:storybook` render/timeout failure** — open that story in `npm run storybook`; it's a real runtime error, not a jsdom artifact.
- **DOM snapshot failure on an unrelated component** — a shared change (a `cn` tweak, a token rename, a `lib/` edit) rippled. Review every changed snapshot, not just the one you expected.
- **`test:package` failure** — `publint` / `attw` print the exact `exports` or `types` field problem; fix `package.json`, don't suppress.
- **Coverage below threshold** — add the missing test; only lower a threshold in `vitest.config.ts` with a written reason, and never below the current real number.
