import type { TestRunnerConfig } from "@storybook/test-runner";
import { getStoryContext } from "@storybook/test-runner";
import { injectAxe, checkA11y } from "axe-playwright";

/**
 * The Storybook test runner opens every story in a real headless Chromium.
 * That alone is a render-smoke test — a story that throws on mount, or logs
 * a page error, fails here even when no unit test covers that state.
 *
 * On top of that, this runs the FULL axe rule set against each story,
 * including `color-contrast`, which the jsdom-based `vitest-axe` in unit
 * tests cannot evaluate (no layout/paint engine).
 *
 * `preVisit` forces `prefers-reduced-motion` so overlay enter animations
 * (which globals.css collapses under that media query) resolve instantly —
 * axe then measures the settled visual state, not a mid-transition frame.
 *
 * Per-story escape hatches mirror the `@storybook/addon-a11y` parameter shape:
 *   parameters: { a11y: { disable: true } }
 *   parameters: { a11y: { options: { rules: { region: { enabled: false } } } } }
 *
 * A story can also request a real browser viewport size before its `play`
 * function runs — needed for anything gated by a CSS breakpoint (a mobile
 * drawer that's `md:hidden`, say), since `play` itself has no access to the
 * Playwright `page` to resize it:
 *   parameters: { viewport: { width: 390, height: 844 } }
 * Always explicitly resets to the default otherwise — the test runner can
 * reuse one browser page across every story in a file, so a size set by one
 * story would otherwise leak into whichever runs next.
 */
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

/**
 * `getStoryContext` reads Storybook's story store, which throws
 * `StoryStoreAccessedBeforeInitializationError` if the preview iframe has
 * not finished building its index yet. That is a startup race, not a broken
 * story: it can only bite the first story the runner visits in a worker, and
 * it took down an unrelated `Spinner` story on CI while the other 225 tests
 * passed. Retrying is the correct synchronization — the alternative is a
 * fixed sleep, which is either too short (flaky again) or too long (paid on
 * every one of the 72 suites).
 */
async function storyContextWhenReady(
  page: Parameters<typeof getStoryContext>[0],
  context: Parameters<typeof getStoryContext>[1]
) {
  const deadline = Date.now() + 15_000;
  for (;;) {
    try {
      return await getStoryContext(page, context);
    } catch (error) {
      const isIndexNotReady =
        error instanceof Error &&
        /StoryStoreAccessedBeforeInitialization|index is ready/i.test(error.message);
      if (!isIndexNotReady || Date.now() > deadline) throw error;
      await page.waitForTimeout(100);
    }
  }
}

const config: TestRunnerConfig = {
  async preVisit(page, context) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Chromium refuses navigator.clipboard.writeText() without this explicit
    // grant — CopyButton's play tests need it to exercise a real copy.
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const storyContext = await storyContextWhenReady(page, context);
    const viewport = storyContext.parameters?.viewport as
      { width: number; height: number } | undefined;
    await page.setViewportSize(viewport ?? DEFAULT_VIEWPORT);
  },
  async postVisit(page, context) {
    const storyContext = await storyContextWhenReady(page, context);
    if (storyContext.parameters?.a11y?.disable) return;

    await injectAxe(page);
    await page.waitForTimeout(150); // let the story settle before measuring

    // `region` (content must sit inside a landmark) is a page-level rule; an
    // isolated component story has no landmarks by design, so it's off by
    // default here. The full-page `Forsight/Overview` story re-enables it via its
    // own `parameters.a11y.options`.
    const storyOptions = storyContext.parameters?.a11y?.options ?? {};
    const axeOptions = {
      ...storyOptions,
      rules: { region: { enabled: false }, ...(storyOptions as { rules?: object }).rules },
    };

    const run = () =>
      checkA11y(page, "#storybook-root", {
        detailedReport: true,
        detailedReportOptions: { html: true },
        axeOptions,
      });

    try {
      await run();
    } catch (err) {
      if (String(err).includes("Axe is already running")) {
        await page.waitForTimeout(400);
        await run();
        return;
      }
      throw err;
    }
  },
};

export default config;
