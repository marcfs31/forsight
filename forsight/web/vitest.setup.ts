import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// This project runs with `test.globals: false`, so Testing Library's own
// auto-cleanup (which only registers when it detects test-framework globals)
// never fires without this. Mirrors the design system's own vitest.setup.ts.
afterEach(() => {
  cleanup();
});

/**
 * jsdom doesn't implement these — the design system's overlay primitives
 * (FilterBar's "Add filter" popover, in particular) call them during
 * pointer interaction and layout, so mounting App() crashes without a
 * no-op polyfill even though nothing here asserts on them.
 */
if (!window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
}
if (!window.HTMLElement.prototype.setPointerCapture) {
  window.HTMLElement.prototype.setPointerCapture = () => {};
}
if (!window.HTMLElement.prototype.releasePointerCapture) {
  window.HTMLElement.prototype.releasePointerCapture = () => {};
}
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
if (!("ResizeObserver" in window)) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test-only polyfill
  window.ResizeObserver = ResizeObserverMock;
}
