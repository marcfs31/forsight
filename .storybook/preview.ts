import type { Preview } from "@storybook/react";
import React from "react";
import { addons } from "storybook/internal/preview-api";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import "../src/styles/globals.css";
import { ForsDocsContainer } from "./DocsContainer";

/**
 * Applies the `theme` / `dir` globals to the preview document. Called from
 * the decorator (initial paint, per-story globals) and, below, straight from
 * the globals channel event — so a toolbar toggle flips the whole iframe in
 * one CSS-cascade pass instead of block-by-block as each story re-renders.
 */
function applyGlobals(globals: Record<string, unknown>) {
  document.documentElement.setAttribute("data-theme", (globals.theme as string) ?? "dark");
  document.documentElement.dir = (globals.dir as string) ?? "ltr";
}
addons
  .getChannel()
  .on(GLOBALS_UPDATED, ({ globals }: { globals: Record<string, unknown> }) =>
    applyGlobals(globals)
  );

/**
 * A real theme toolbar, not a fixed "backgrounds" swatch: the Storybook
 * backgrounds addon paints a hardcoded color behind every story regardless
 * of `data-theme`, which silently breaks light-theme stories (dark text on
 * a backdrop still forced dark). Instead this sets `data-theme` on the
 * preview iframe's own <html> so the real token cascade (including body's
 * `background-color: var(--forsight-ink-bg)` from globals.css) does the work,
 * matching how a real consuming app renders.
 */
const preview: Preview = {
  globalTypes: {
    // No `toolbar` here on purpose: the theme control is a single toggle
    // button, rendered by the manager addon in manager.tsx (which also themes
    // Storybook's own UI). Declaring the global keeps it in the URL / globals
    // API so the decorator below and the Docs container can read it.
    theme: {
      description: "Forsight theme",
    },
    // Same as `theme`: a toggle button in manager.tsx, no stock dropdown.
    dir: {
      description: "Text direction",
    },
  },
  initialGlobals: {
    theme: "dark",
    dir: "ltr",
  },
  parameters: {
    // Sidebar order: the Overview first, then the component categories in a
    // deliberate top-down reading order (type → inputs → overlays → feedback
    // → data display → charts → observability → navigation); components
    // alphabetical within a category.
    // Story titles are "Forsight/<Category>/<Component>" — see src/**/*.stories.tsx.
    options: {
      storySort: {
        order: [
          "Forsight",
          [
            "Overview",
            "Typography",
            "Forms",
            "Overlays",
            "Feedback",
            "Data Display",
            "Data Viz",
            "Observability",
            "Navigation",
          ],
        ],
      },
    },
    backgrounds: { disable: true },
    // Docs pages (autodocs) are rendered by Storybook's own UI, which doesn't
    // see our CSS tokens — the container below themes that chrome to match
    // the toolbar's theme. The manager UI is themed in .storybook/manager.ts.
    docs: { container: ForsDocsContainer },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story, context) => {
      applyGlobals(context.globals);
      return React.createElement(Story);
    },
  ],
};

export default preview;
