import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

/**
 * The real-browser story gate, kept in its own config file rather than as a
 * second project inside vitest.config.ts.
 *
 * That separation is deliberate: `npm test` and `npm run test:coverage` run
 * the jsdom unit suite in the `verify` CI job, which has no Playwright
 * browsers installed. A `projects` array in the shared config would pull this
 * browser project into those runs and fail them, so the two suites stay in
 * separate config files and separate jobs.
 *
 * This replaces `@storybook/test-runner`, which cannot run against Storybook
 * 10: the runner is Jest-based, and Storybook 10 loads `.storybook/*` config
 * through a `serverRequire` that calls `module.register()` unconditionally —
 * an API Jest refuses, because the hooks would attach to Jest's own module
 * loader instead of the sandboxed one used by test code.
 *
 * What the old `.storybook/test-runner.ts` did by hand is now declarative:
 *  - the full axe pass (including `color-contrast`, which jsdom's vitest-axe
 *    cannot evaluate) comes from `@storybook/addon-a11y`, which runs on every
 *    story; the `a11y.test: "error"` parameter in `.storybook/preview.ts` is
 *    what turns a violation into a failure, and without it this suite would
 *    pass while testing nothing;
 *  - `prefers-reduced-motion` and the clipboard grants are Playwright context
 *    options below;
 *  - per-story viewports are `parameters.viewport`, which addon-vitest applies
 *    and — unlike the old hand-rolled version — resets to its own desktop
 *    default between stories, so a size set by one story cannot leak into the
 *    next and no explicit default needs setting here;
 *  - the story-index retry is gone because there is no index to race: each
 *    story is imported directly as a test rather than visited over HTTP.
 */
export default defineConfig({
  plugins: [storybookTest({ configDir: ".storybook" })],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        contextOptions: {
          // globals.css collapses overlay enter animations under this media
          // query, so axe measures the settled visual state rather than a
          // mid-transition frame.
          reducedMotion: "reduce",
          // Chromium refuses navigator.clipboard.writeText() without an
          // explicit grant — CopyButton's play tests exercise a real copy.
          permissions: ["clipboard-read", "clipboard-write"],
        },
      }),
      instances: [{ browser: "chromium" }],
    },
  },
});
